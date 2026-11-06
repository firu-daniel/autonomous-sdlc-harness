### 1. "`run_profile` field also names the rendered file" presents a field that a refused spawn leaves set as a second record that this spawn passed

**File:** `docs/watcher.md` (`### The per-run profile`), the paragraph opening "A render and a check that pass log nothing of their own" — "outside job mode the run-registry record's `run_profile` field also names the rendered file"

**Problem.** After code-review Finding 2, the sentence's closing clause reads "…because the launch line is logged before `spawn_engine` renders and checks; outside job mode the run-registry record's `run_profile` field also names the rendered file, which job mode neither renders nor records." That fix meant the field to be "a second record of a passing render and check" (code review `finding_2.md`), and "also", in a sentence whose subject is "the record that both passed", reads that way. The field is not such a record for any spawn after a branch's first.

**Proof, from `cli/templates/scripts/autonomous-watcher.sh`** (`scripts/autonomous-watcher.sh` does not differ from it on any line that names `spawn_engine`, `run_profile` or a launch line):

- The one write of the field is in `spawn_engine`: `if [ "$JOB_MODE" != "1" ] && ! registry_set "$branch" run_profile "$settings_file"; then`. A grep of the script and of `cli/templates/scripts/lib/*.sh` for `run_profile`, excluding `run_profile_*` and `RUN_PROFILE*`, finds that line and the registry header comment, and nothing else. No path clears the field: `launch_run` resets `pid`, `stall_restarts`, `stall_warned`, `stall_killing`, `paused_by`, `usage_resume_at`, `pause_reason`, `pause_note_stale`, `resume_kind` and `park_loop_cycles` on a reused branch key, but not `run_profile`. `spawn_refuse` and `spawn_refused` do not touch it either.
- The path is the same at every spawn of a branch: `hr_run_profile_file` prints `<lane dir>/run-profiles/<slug>/<sanitized branch>.json`.
- The registry header itself says the field names the profile "this run's **latest** spawn was launched on".

**Why it is reachable.** A run launches cleanly, so `run_profile` is set. It parks, and on the park-resume (`resume_parked_run` logs `resuming parked run '<branch>' …`, then calls `spawn_engine`) `run_profile_render` or `run_profile_check` refuses. `watcher.log` then carries `not launching '<branch>': <reason>` and the record goes to `failed`, but `run_profile` still names `<sanitized branch>.json`. On a check refusal that file is the copy just rendered and refused. The pause-resume, stall-watchdog relaunch and a fresh launch on a reused branch key behave the same way.

**Runtime symptom.** An operator checks whether a resume's per-run profile rendered and passed. The new sentence tells them the field "also" records that, so they read `run_profile`, find it set, conclude the profile passed and look elsewhere for the cause. The log line is the only record of this spawn's outcome.

**Fix.** In that sentence of `docs/watcher.md`, replace

```
; outside job mode the run-registry record's `run_profile` field also names the rendered file, which job mode neither renders nor records.
```

with

```
; outside job mode the run-registry record's `run_profile` field names the rendered file, which job mode neither renders nor records, but it is not a second record that this spawn passed, because a refused spawn neither clears nor rewrites it and every spawn of a branch renders to the same path.
```

Keep it one sentence, as the task prompt's `## Done when` requires, and change nothing else in the document. This is a prose-only change, so it owes no test run.
