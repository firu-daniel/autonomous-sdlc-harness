# cli review — 2. A job whose watcher is itself killed (a `stop` cancel, a step timeout) still hands `Push the branch` a leftover `<scriptsDir>/.git` — iteration 0

Confirmation note: this review is by reading only. The two suites' `job-sweep:` cases and the new workflow-template case were not executed: running `node --test` on `cli/test/watcher-placeholder-host.test.mjs` and `cli/test/workflow-templates.test.mjs` was refused by this session's permission mode. Read instead: the full diff, `placeholder_start_recover`, `placeholder_sweep_pass` / `placeholder_sweep_unprobed`, `running_count`, the source-time statements between the recovery and the entry `case`, and the test helpers `jobFixture`, `runJobSteps`, `stepKey`, `runBodies` and `ifOf`.

## Nice to Have
1. **The sweep-points paragraph was not re-wrapped after the insertion** — `cli/templates/scripts/autonomous-watcher.sh` (header, the paragraph that starts "In job mode the same sweep runs at the head of `spawn_engine`'s job arm") — "job-mode start-up recovery, and in `job-sweep` (JOB MODE); its manifest is `hr_job_absent_file`'s, under"
   This line is about 110 columns wide. Every line around it wraps at about 78.
   **Fix:** Re-wrap the paragraph from "`run_job`'s exit ahead of the workflow's" down to "would not outlive it." at the header's usual width.

2. **The `job-sweep` arity refusal has no test** — `cli/templates/scripts/autonomous-watcher.sh` (source-time guard ahead of `placeholder_start_recover "${1-}"`) — "[ \"$#\" -eq 2 ] || job_usage job-sweep \"expected <branch>\""
   The exit map documents exit 2 for "other than one argument", but only the `HARNESS_JOB_MODE` refusal is tested (case 2). If this guard regressed, `job_sweep "$2"` would fail under `set -u` with no argument and exit 1 instead of 2, and no test would catch it. The plan did not ask for this case, so it stays Nice to Have.
   **Fix:** Add a `job-sweep: (2b)` case to `cli/test/watcher-placeholder-host.test.mjs`. Run `[f.watcherPath, 'job-sweep']`, and also run it with an extra argument, both under `HARNESS_JOB_MODE=1`. Assert exit 2, the `job-sweep: expected <branch>` line, and that the planted leftover is still present.
