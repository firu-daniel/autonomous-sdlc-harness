### 2. The `stopped` comment says a new review starts another round, but a review on a branch stopped mid-run is refused; the command that works, `resume`, is not named

**Severity:** Must Fix

**Sites:**
- `cli/templates/scripts/remote-run.sh` (`forge_report`) — the `stopped)` text arm, "was stopped. Nothing runs on it until a new review or label starts another round or run."
- `docs/github-run-control.md` → `## 5. Lifecycle comments and state labels`, the table row whose first cell is `` `stopped` ``, the *next GitHub action* cell "a new review or trigger label starts another round or run".

**Problem.** `@sdlc-harness stop` (`control_stop`) and a local `remote-run.sh stop` both end in `verb_stop`. That dispatches the `harness stop <branch>` marker, cancels every queued or in-progress `harness run <branch>` job, and posts `forge_report stopped`. The comment it posts, on the run's pull request when there is one, names a new review as the way on.

That review is refused in the ordinary case, a stop of a run that was executing:
- The cancelled job's `always()` post-steps still save and upload its bundle. `docs/remote-execution.md` → `### The kill switch and stopping` records that Gate 12 round 2 observed this: *"the running job was cancelled while its post-steps still saved and uploaded the bundle"*.
- That bundle's `status.json` still says `running`, because job mode writes `running` / `continue` before it spawns the session (`autonomous-watcher.sh` → `run_job`, "job_write_status \"$branch\" \"$remote_status\" continue \"job started\""), and nothing rewrites it on cancellation.
- `remote-run.sh` → `remote_state`, case 3, reads a bundle that says `running` as `RS_STATE=paused`, `RS_PAUSE_REASON=killed`. A cancelled run that never started and left no bundle falls into case 4, which gives the same `paused` / `killed` whenever any older bundle exists.
- `verb_review` accepts only `completed` or `failed` (and `none` under `--allow-no-run`). Its `paused)` arm exits 2 with *"`<branch>` is paused (killed) on GitHub; a review waits until its run is completed or failed"*.

**The runtime symptom.** After `@sdlc-harness stop` on a running run, the maintainer reads *"Nothing runs on it until a new review … starts another round"* on the pull request. They submit a review requesting changes. `control_review` passes it to the `review` child, which refuses it. The reply is *"`review` was not run: the round was refused (… is paused (killed) on GitHub; a review waits until its run is completed or failed). Submit the review again once that is fixed."* Nothing the maintainer can do with reviews changes that state, so every later review is refused the same way.

The command that does work is `@sdlc-harness resume`. `control_resume` resumes any `paused` state, `killed` included (*"Every pause reason, `expired` and `killed` included, resumes from the committed ledger"*). The resumed dispatch is newer than the stop marker, so `continue` and `poll` treat the branch as un-stopped. But neither the comment nor the documentation row names `resume`.

Acceptance 5 of the task prompt requires that every lifecycle comment *"names the next GitHub-side action"*. This one names an action that fails.

**Fix.** Name `resume` as the way on, and state when a review is accepted. Change no behaviour.

1. In `cli/templates/scripts/remote-run.sh` → `forge_report`, replace the `stopped)` arm's text with:
   ```bash
   text="The harness run on \`$br\` was stopped. Comment \`${COMMAND_HANDLE} resume\` to continue it from its committed ledger. A review that requests changes starts a round only once a run of the branch has completed or failed." ;;
   ```
2. In `docs/github-run-control.md` → `## 5. Lifecycle comments and state labels`, in the table row whose first cell is `` `stopped` ``, replace the *next GitHub action* cell with: "`@sdlc-harness resume`, which continues the stopped run from its committed ledger; a review that requests changes is accepted only once a run of the branch has completed or failed".
3. Grep `cli/test/` for the old sentence `Nothing runs on it until` and for `new review or label`, and update any assertion that quotes it. The grep run for this review found none: `cli/test/remote-report.test.mjs`'s `stopped` case asserts only on the label calls.

No test run is needed beyond any test file step 3 edits. The full suite runs in the Run gates phase.
