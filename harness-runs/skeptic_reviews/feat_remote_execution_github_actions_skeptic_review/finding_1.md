### 1. `save` re-uploads the restored previous job's `status.json` whenever job mode never wrote its own, so a deterministic pre-launch failure re-dispatches forever with a chain that never grows

> **Self-contained per-finding file** for the `feat_remote_execution_github_actions` skeptic-review index. The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/remote-run.sh` (`verb_save`) — "Without either file the harness step never started"

**The problem.** In the run workflow the steps run in this order (`cli/templates/github/workflows/harness-run.yml`):

1. `Restore the previous job's state`: `remote-run.sh restore`.
2. `Run the harness`: `autonomous-watcher.sh job`.
3. `Save the state bundle` under `always()`, then `Continue, wait or stop` under `!cancelled()`.

`restore` runs under every `--resume` kind, `none` included. Whenever a previous bundle exists, which is every job after a branch's first, it calls `hr_remote_bundle_restore … job`. That call copies the previous job's `status.json` to `<state_dir>/autonomous_logs/remote_status.json` (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_restore`, "mv "$tmp" "$base/$HR_REMOTE_STATUS_SOURCE""). This is the same path job mode later overwrites with its own status.

`hr_remote_bundle_write` then copies whatever sits at that path **verbatim** (`hr_remote_bundle_write` → "cp "$base/$HR_REMOTE_STATUS_SOURCE" "$out/$HR_REMOTE_STATUS_FILE""). So when anything exits between the restore and job mode's first `job_write_status`, this job's bundle is the previous job's `status.json`, unchanged. It keeps that job's `decision`, `chain`, `status` and `run_id`. The paths that exit there:

- every `fatal` in the watcher's startup: config unresolvable, state paths underivable, state directories not creatable;
- the `job` arm's `job_usage` refusals: a protected branch, or protection unresolvable;
- `run_job`'s `run_state_dir` fatal;
- a `restore` failure after its own restore: the answer-write loop's `restore_fail`, or the `park_loop_clear` rewrite's `restore_fail`.

`save`'s own "never started" detection does not help. It tests `[ ! -f "$status_source" ] && [ ! -f "$registry_file" ]`, and the restored file makes the first test false.

**Why it runs without bound.** Take a hosted run whose previous job ended on the time budget. Its `status.json` is `{decision: "continue", chain: "3", run_id: A}`. `continue` dispatches job B with chain 4. B restores A's bundle, and then its harness step exits before job mode writes, for example on a watcher `fatal`. B's `save` uploads A's `status.json` unchanged, with chain `"3"`. B's `continue` reads `decision: continue`, computes `NEXT_CHAIN` = 3 + 1 = 4, and dispatches job C with chain 4. C restores the newest finished run that carries a bundle. That is B, whose bundle again says chain `"3"`. The failure repeats, and so does the same dispatch at chain 4.

- `HARNESS_MAX_CHAIN` is never reached, because the chain never grows.
- `continue_redispatch` sends no notification on a successful re-dispatch, so the user hears nothing.
- Every lap bills a job's setup minutes: Node, the `claude` install, the plugin install, `npx init` and `doctor`.
- Only `HARNESS_REMOTE_STOP` or `remote-run.sh stop` ends it.

The header claims otherwise. `remote-run.sh`'s header says "`HARNESS_MAX_CHAIN` is what bounds a job that is killed every time" and "no status.json — the harness step never started: one `failed` naming the run URL, no dispatch". The library's `status.json` contract says `chain` is "the writing job's OWN input `HARNESS_INPUT_CHAIN`, never a value carried from an earlier bundle". This path breaks all three.

When the previous decision was `stop`, for example a parked run, the same mechanism uploads that job's `parked` status as this job's. The next `sync` then sets the record back to `parked` and moves the mirror's clarification directory aside, with no notification. Code-review Finding 3 already closed this for one trigger: the `--resume answer` question-index refusal, now checked before the restore. Every trigger listed above still reaches it.

**Fix.** `save` treats a `remote_status.json` whose `run_id` is not this job's as the restored copy it is. It moves the file aside, so the existing never-started and registry-fallback paths decide.

- [ ] In `verb_save`, directly after the line `status_source=$(hr_state_path "$root" "$HR_REMOTE_STATUS_SOURCE") || status_source=""`, insert:
  ```bash
  # `restore` places the previous job's status.json at this same path; one whose
  # run_id is not this job's means this job's harness step never wrote its own,
  # and re-uploading it would replay the previous job's decision and chain.
  if [ -n "$status_source" ] && [ -f "$status_source" ] && [ -n "${GITHUB_RUN_ID-}" ] \
    && [ "$(hr_remote_status_get "$status_source" run_id 2>/dev/null || :)" != "$GITHUB_RUN_ID" ]; then
    if mv "$status_source" "$status_source.previous" 2>/dev/null; then
      echo "remote-run.sh: save: $status_source is the previous job's (run_id is not $GITHUB_RUN_ID); moved aside, not uploaded" >&2
    else
      echo "remote-run.sh: save: cannot move the previous job's '$status_source' aside; no bundle written" >&2
      mkdir -p "$out_dir" 2>/dev/null || :
      status_source=""
      registry_file=""
    fi
  fi
  ```
  Then change the never-started test just below from `if [ ! -f "$status_source" ] && [ ! -f "$registry_file" ]; then` to `if { [ -z "$status_source" ] || [ ! -f "$status_source" ]; } && { [ -z "$registry_file" ] || [ ! -f "$registry_file" ]; }; then`. With the file moved aside and no registry, the job gets the empty bundle. `upload-artifact` then uploads nothing, and `continue` sends its existing `failed` ("The job stopped before the harness run started"). With a registry present, `hr_remote_bundle_write` takes its existing fallback: it writes `status.json` from the record with decision `stop`, or writes none when the record has no status.
- [ ] In `remote-run.sh`'s header, extend the `` `save` WRAPS `hr_remote_bundle_write` `` paragraph with: "A `remote_status.json` whose `run_id` is not `GITHUB_RUN_ID` is the previous job's copy that `restore` placed. This job's harness step never wrote its own, so `save` moves it aside to `remote_status.json.previous` and decides as if it were absent."
- [ ] In `cli/test/remote-run.test.mjs`, add a case beside `'save with no status and no registry leaves an empty bundle, and never fails'`:
  - Seed `<state_dir>/autonomous_logs/remote_status.json` with schema `"1"`, branch `feat_x`, status `paused`, decision `continue`, chain `"3"`, `run_id` `"111"`, and no registry.
  - Run `save feat_x <out>` with `GITHUB_RUN_ID=222`.
  - Assert exit 0, that `<out>` exists and is empty, and that `remote_status.json.previous` exists.
  - Then run `continue feat_x <out>` with `HARNESS_PUSH_CMD` pointed at a recorder.
  - Assert exactly one `failed` notification and no `workflow run` in the gh stub's log.
- [ ] Check that `'save after a job-mode status write produces the full layout and a job-summary table'` still passes. Its status is written by `hr_remote_status_write`, whose `run_id` is `GITHUB_RUN_ID` when the test sets it and empty otherwise. When the test sets no `GITHUB_RUN_ID`, the new branch is skipped by its `-n "${GITHUB_RUN_ID-}"` guard.
