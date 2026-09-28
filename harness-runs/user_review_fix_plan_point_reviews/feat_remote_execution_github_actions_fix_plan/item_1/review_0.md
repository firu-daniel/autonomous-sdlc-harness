# cli review — 1. `remote-run.sh poll` can disable the resume poller while a finishing job is enabling it — iteration 0

Scope: `cli/templates/scripts/remote-run.sh`, `cli/test/remote-run.test.mjs`. I ran `npm --prefix cli run build` and then `node --test cli/test/remote-run.test.mjs`: 57/57 pass, including the four new `poll` cases. The `**Docs.**` sub-step (under `docs/`) and the `harness-runs/lessons.md` edit are outside this layer's path scope, so this review does not cover them.

## Should Fix
1. **Header places the stopped-branch skip under the `completed` arm only** — `cli/templates/scripts/remote-run.sh` (file header, `poll` paragraph) — "For a `completed` run,\n# skipped, not waiting: a stopped branch"
   In `poll_branch`, `remote_branch_stopped` runs before the `[ "$state" != completed ]` split. So an unfinished run on a stopped branch is skipped and not waiting, even when it carries a usage-paused bundle. The header says the opposite: "with one whose bundle says `status: paused` / `pause_reason: usage` it is waiting", and it lists "a stopped branch" only under the `completed` arm. A maintainer reading the header would expect a stopped branch's finishing job to keep the poller enabled, and it does not. The code is correct. The header misstates it (`.claude/context/cli.md` → `## What "done" means here`, the header bullet).
   **Fix:** Put the stopped-branch skip ahead of both arms, e.g. "A stopped branch is skipped, not waiting, whatever its run's state. A run not yet `completed` is never dispatched …". Then drop "a stopped branch" from the `completed`-arm list.

2. **`list_all_runs` doc comment still says "listed once per invocation"** — `cli/templates/scripts/remote-run.sh` (`list_all_runs` comment) — "listed once per invocation"
   `poll_recheck` now resets `ALL_RUNS_LISTED=0` and lists a second time. So the comment's guarantee no longer holds for `poll`, and a reader relying on it would assume `ALL_RUNS` is fixed for the whole tick.
   **Fix:** Reword it to "listed once per invocation, except `poll_recheck`, which resets `ALL_RUNS_LISTED` for one fresh listing after its disable".

---

# general review — 1. `remote-run.sh poll` can disable the resume poller while a finishing job is enabling it — iteration 0

Note on this file: the `cli` layer's dispatch had already written `review_0.md` in this same findings folder at iteration 0. The `general` dispatch appends its section below instead of overwriting, so the `cli` findings above are kept for Pass 2.

Scope: `docs/remote-execution.md` and `docs/development.md`, the `**Docs.**` sub-step. I checked them against `cli/templates/scripts/remote-run.sh` (`poll_branch`, `poll_recheck`, `verb_poll`) and `cli/templates/github/workflows/harness-run.yml` (step order). Every pointer resolves: `### Resuming without the local watcher` sits under `## 3`, and `## 6. What is not verified here` exists. The new §6 row follows the table's "not retrieved" convention. Nothing was executed for this section; every point below comes from reading. The `harness-runs/lessons.md` edit is in the uncommitted set, but this unit's task file does not name it, so it is not graded here.

## Should Fix
1. **Gate 12 (v)'s new in-progress artifact observation has a window of seconds and no "not observed" rule** — `docs/development.md` (`## 5. Verifying a change` → **(v)**) — "While that job is still running, after its `Upload the state bundle` step, record whether `gh api repos/<owner>/<repo>/actions/runs/<in-progress run id>/artifacts` lists `harness-state` before the run completes"
   In `harness-run.yml`, only `Continue, wait or stop` runs between `Upload the state bundle` and the end of the run. On the `wait-poller` path that step makes a single `gh workflow enable` call, so the run is in progress for only a few seconds after the upload. A gate runner who types the command by hand will almost always query after the run has completed. They may then record "not listed", or record a listing taken from the completed run as if it were in progress. The §6 row says "Gate 12 observation (v) records which it is", so a false negative there would wrongly mark the post-disable re-check as resting on a behaviour GitHub lacks. The paragraph's existing rule, "records the enable as **not observed**, never inferred", covers the enable only, not this new observation.
   **Fix:** Tell the gate runner to start polling before the harness step ends, for example by repeating the `gh api …/artifacts` call together with `gh run view <run id> --json status` until the status is `completed`. They record the answer only from a response whose paired status was still `in_progress`. Add: "A gate run that gets no answer while the run is in progress records this as **not observed**, never inferred from the completed run's listing."

## Nice to Have
1. **Placeholder differs from the neighbouring observation** — `docs/development.md` (**(v)**) — "`gh api repos/<owner>/<repo>/actions/runs/`"
   Observation (iv) spells the same endpoint `repos/<owner>/<scratch-repo>/…`. In the new sentence, `<repo>` could be read as this repository.
   **Fix:** Use `<owner>/<scratch-repo>`.

2. **"such a run is never dispatched until its run has completed" says "run" twice** — `docs/remote-execution.md` (`### Resuming without the local watcher`) — "such a run is never dispatched until its run has completed"
   **Fix:** "the poller never dispatches such a job's run until that run has completed".

3. **The §6 row's failure column covers only the listing** — `docs/remote-execution.md` (`## 6. What is not verified here`, the new `actions/upload-artifact@v4` row) — "The listing shows no in-progress artifact, the re-check finds nothing"
   The assumption also covers `gh run download` of an in-progress run. If the listing works but the download is refused, `poll_branch` counts every unfinished run that carries `harness-state` as waiting ("counted as waiting"). The poller then stays enabled until that job completes. The outcome is benign and short, but the row does not say so.
   **Fix:** Add one clause: "if listed but not downloadable, the tick counts that run as waiting, and the poller stays enabled until the job completes".
