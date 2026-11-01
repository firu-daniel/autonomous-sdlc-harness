### Task 2 — Add `job.sh`: job-mode setup, the launch line's job tail, the placeholder manifest, the sweep and the branch restore

**Goal:** One new library that holds everything job mode does differently from the clone layout, so `session.sh` gains only hooks (Task 4) and nothing is forked. Each function reproduces the job rather than approximating it, and the header says which code it mirrors:

- **setup** with no clone and no per-run profile: the base profile, checked by the watcher's own `run_profile_check` with no copy;
- **the launch line's job tail**: one `--add-dir` per `permissions.additionalDirectories` entry of the base profile, the watcher's `JOB MODE ONLY` tail (`cli/templates/scripts/autonomous-watcher.sh` → the launch-line comment, and `spawn_engine`'s *"JOB MODE ONLY: every permissions.additionalDirectories entry of the base profile"* block);
- **the placeholder manifest** `spawn_engine` writes in job mode before each session (its *"What was absent before this session"* block);
- **the sweep** the job's `Sweep the sandbox placeholders` step runs (`HARNESS_JOB_MODE=1 autonomous-watcher.sh job-sweep <branch>`), then the switch back and the probe branch's removal.

**Depends on:** Task 1, which declares `SP_JOB_MODE` (`0`/`1`), `SP_JOB_CHECKOUT` and `SP_RUNNER_CONTROLS_FILE` in `core.sh`, assigned only by the entry point. It reuses, unchanged:

- `session.sh` → `sp_track_branch`, `sp_track`, `sp__branch_taken`, `sp__setup_refuse` and `sp__td_fail`;
- `session.sh` → `SP_MAIN`, `SP_TMP`, `SP_SCRIPTS`, `SP_STATE_DIR` and `SP_BRANCH`, which `sp_setup` has set by the time it calls `sp_job_setup` (Task 4);
- the run library preflight check 1 sources: `hr_placeholder_host_probe_var`, `hr_profile_deny_paths`, `hr_job_absent_file`, `hr_placeholder_manifest_write`.

**Where this task stops.** It writes `job.sh` and nothing else. The calls into it are Task 4's (`session.sh`); the file is sourced from the entry point's list in Task 5. The preflight is Task 3's. No watcher, wrapper or profile behaviour changes: job mode calls the checkout's own watcher and wrappers as they are.

### Targets

- `scripts/lib/sandbox-probe/job.sh` (new)

**Work:**

- [ ] **The header**, as every sibling's: what job mode is (the checkout it runs in, under the base profile a `harness-run.yml` job builds); the four differences above, each naming the watcher code it mirrors and saying *keep in step with it*; the functions and globals below with their contracts; that every function is a no-op returning 0 when `SP_JOB_MODE` is not `1`; and *SOURCED, NEVER EXECUTED … Bash 3.2 floor.*
- [ ] **`sp_job_setup`** — status 0, or 2 through `sp__setup_refuse`, the refusal named. In order:
  1. **Profile check.** `SP_JOB_BASE_PROFILE` is `$SP_MAIN/.claude/settings.autonomous.json`. Run a child `bash -c` that sources `"$SP_SCRIPTS/autonomous-watcher.sh" status`, then calls `run_profile_check "$SETTINGS_PROFILE"` with **no copy**, then prints `$SETTINGS_PROFILE`. On failure, refuse quoting `RUN_PROFILE_REFUSAL`. Refuse too when the printed path is not the base profile, compared canonically. `SP_RUN_PROFILE` becomes the base profile.
  2. **No clone.** `SP_CLONE` becomes `SP_MAIN`.
  3. **The probe branch.** Record `SP_JOB_ORIG_BRANCH` from `git -C "$SP_MAIN" symbolic-ref --short HEAD`. Refuse when `sp__branch_taken "$SP_BRANCH"`. `sp_track_branch "$SP_BRANCH"`, then `git -C "$SP_MAIN" switch -q -c "$SP_BRANCH"`, setting `SP__JOB_SWITCHED=1`. Then `git -C "$SP_MAIN" push -q origin "refs/heads/$SP_BRANCH:refs/heads/$SP_BRANCH"`: a plain refspec with **no `--set-upstream`**, so `.git/config`, which the `shasum` guard watches, is not written. A failed push refuses, and teardown still switches back.
  4. **The runner temp.** `SP_JOB_RUNNER_TEMP` is `$RUNNER_TEMP` when that is absolute. Otherwise it is `$SP_TMP/runner-temp`, created here; it sits under `SP_TMP` and goes with it.
  5. **The host.** Call `hr_placeholder_host_probe_var` and keep `HR_PLACEHOLDER_HOST` as `SP_JOB_PLACEHOLDER_HOST`.
- [ ] **`sp_job_add_dirs <base profile> <cwd> <state root>`** sets the array `SP_JOB_ADD_DIRS` to the extra directories, as `spawn_engine` builds `extra_dirs`:
  - every `jq -r '.permissions.additionalDirectories[]? // empty'` entry of the base profile, in file order;
  - an empty entry skipped, and one whose `${dir%/}` equals `${cwd%/}` or `${state root%/}`;
  - an absent, unparsable or keyless profile gives none and never fails.

  It always reads the **base** profile, as the watcher reads `$SETTINGS_PROFILE`, even when a session runs on a scratch copy. Empty when not in job mode.
- [ ] **`sp_job_manifest_write <settings file> <add-dir root>...`** — the job-mode half of `spawn_engine`'s manifest block, run only when `SP_JOB_PLACEHOLDER_HOST` is `1`:
  - the manifest path is `RUNNER_TEMP="$SP_JOB_RUNNER_TEMP" hr_job_absent_file "$SP_BRANCH"`;
  - nothing is written, and one `sp_refuse` line says so, when that path canonically lies under any add-dir root: the watcher never writes a manifest the session could write;
  - the paths are `hr_profile_deny_paths <settings file>`'s lines plus `<root>/.mcp.json` for each add-dir root;
  - the write is `hr_placeholder_manifest_write`.

  A failed step prints one `sp_refuse` line naming it and returns 0, as the watcher logs and launches anyway.
- [ ] **`sp_job_teardown`** — called once by `sp_teardown`, after its pending restore and before its clone loop (Task 4). In order:
  1. **The sweep.** From `SP_MAIN`, run `HARNESS_JOB_MODE=1 RUNNER_TEMP="$SP_JOB_RUNNER_TEMP" bash "$SP_SCRIPTS/autonomous-watcher.sh" job-sweep "$SP_BRANCH"`, its output captured. Teardown's evidence step has already run by then, so the output is not kept as a file: each of its lines is printed to stderr as `sandbox-probe: job-sweep: <line>`, whole, and the workflow keeps stderr (Task 14). It runs on every host, as the job's `if: always()` step does: off a placeholder host it finds no manifest and sweeps nothing. Then print one stderr line: `sandbox-probe: job-sweep: exit <n>; git status after the sweep: <first line of git -C "$SP_MAIN" status --porcelain, or clean>`. A non-zero exit goes through `sp__td_fail`.
  2. **The switch back**, when `SP__JOB_SWITCHED` is `1`: `git -C "$SP_MAIN" switch -q --discard-changes "$SP_JOB_ORIG_BRANCH"`. It discards only the probe's own edits, because preflight refused a checkout with any tracked change (Task 3), and untracked probe files are `sp_track`ed. A failure goes through `sp__td_fail`, naming the hand command. The tracked-branch pass that follows deletes the probe branch locally and on origin, as it does today.

  Beside it, **`sp_job_git_note`** prints `; read before the placeholder sweep` in job mode and nothing otherwise. Each leg that reads the checkout's git state appends it to its evidence (Tasks 9, 11, 13). Every leg runs before teardown, so every such line says truthfully when it was read.

**Verification:**

- The type check passes; its shell-parse step covers the new file once it is tracked.
- `grep -n 'set-upstream\|push -u' scripts/lib/sandbox-probe/job.sh` finds nothing outside a comment.
- By hand, `bash -c '. scripts/lib/sandbox-probe/core.sh; . scripts/lib/sandbox-probe/job.sh; SP_JOB_MODE=1; f=$(mktemp "${TMPDIR:-/tmp}/jp.XXXXXX"); printf "%s" "{\"permissions\":{\"additionalDirectories\":[\"/a\",\"\",\"/c\",\"/s/harness-runs/\",\"/b\"]}}" >"$f"; sp_job_add_dirs "$f" /c /s/harness-runs; printf "%s\n" "${SP_JOB_ADD_DIRS[@]}"; rm -f "$f"'` prints `/a` then `/b`.

**Deviations from plan:**

- Evidence downgrade — the shell parse of `job.sh`. `bash scripts/typecheck.sh` ran and printed `check-shell-parse: 101 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` and `PASS: typecheck`, but its parse step covers tracked files only and `job.sh` is untracked until the commit. A direct `/bin/bash -n scripts/lib/sandbox-probe/job.sh` was refused by the permission layer (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`). The claim rests on reading the file; the Run gates phase's whole-tree `bash scripts/typecheck.sh`, run once the file is tracked, verifies it.
- Evidence downgrade — the by-hand `sp_job_add_dirs` check (the `bash -c '…'` bullet above) was refused by the permission layer with the same message, and was not routed through a probe. It is not run; the claim that it prints `/a` then `/b` rests on reading `sp_job_add_dirs` against `spawn_engine`'s `extra_dirs` loop. The `grep -n 'set-upstream\|push -u'` bullet was run and found nothing.
- Added `SP__JOB_SETUP_RAN`: `sp_job_teardown` runs the sweep only when `sp_job_setup` was entered, since before it `SP_SCRIPTS`, `SP_BRANCH` and the runner temp may be unset and no session can have run. The plan's "runs on every host" is kept: the gate is on setup, never on the host.
- `sp_job_setup` step 3 refuses when `git symbolic-ref --short HEAD` prints nothing (a detached HEAD), since teardown's switch back needs a branch name; the plan records the value without saying what an empty one does.
- `sp_job_manifest_write` reproduces `placeholder_manifest_writable_root` as the private `sp__job_writable_root` (its first root is the session cwd, as the watcher passes `$worktree` first), because the watcher's function is reachable only by sourcing the watcher in a child shell.
</content>
</invoke>
