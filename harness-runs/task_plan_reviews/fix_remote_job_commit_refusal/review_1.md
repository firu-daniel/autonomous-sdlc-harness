# Task plan review — iteration 1

## Must Fix
1. **A resumed suite outside the re-cast set flips to `paused` / `unfinished`, and no task owns it** — `task_5_plan.md`. The story index's `Top risks:` item 1 is affected too.
   Task 3 reclassifies a zero exit with an absent ledger as `paused` / `unfinished` after a resume (`resume_kind` `answer` or `pause`) or an earlier park. `cli/test/run-copy-migration.test.mjs` has two cases that resume a session through exactly those passes. Each stub writes no ledger, and each case asserts `completed`:
   - `a parked legacy worktree run resumes in its worktree, commits and pushes through the wrappers`. This is an answer resume of `legacyFixture(t, 'parked')`, which seeds `question_1.md` / `answer_1.md`. It asserts `f.record().status` `completed` and the notifications `['resumed', 'completed']`.
   - `a paused legacy worktree run resumes through the pause-resume path, commits and pushes`. This is a pause resume through `RESUME`. It asserts `completed` and `[['resumed', 'after pause'], ['completed', '']]`.

   `legacyFixture` → `stubCommitAndPush` builds the stub body, and that body only commits and pushes `legacy.txt`. It never writes `<state_dir>/flow_progress/<branch>_progress.md`. After Task 3, both cases end `paused` with `pause_reason` `unfinished` and fail.

   No per-task file targets `run-copy-migration.test.mjs`. Task 5's sweep is limited to *"each file this task edits"*, which is the five listed suites, so the sweep cannot reach this file either. The index's risk 1 says *"Task 4 (the job-mode suite) and Task 5 (the local suites) re-cast every such case"*. For this file that is not true.

   This also repeats a lesson in `harness-runs/lessons.md` → *Evidence and measurement*: *"When a check moves to reading a field one producer writes, the same change makes every path that stands in for that producer (a probe's setup, a fixture helper) write the field too."* `stubCommitAndPush` is a fixture helper that stands in for the engine session, and nothing makes it write the ledger.

   **Fix:** In `task_5_plan.md`:
   - Add `cli/test/run-copy-migration.test.mjs` to `### Targets`.
   - Make `legacyFixture` → `stubCommitAndPush` append `finishedLedgerBody(LEGACY)` to its stub, so both resumed cases still complete. Fold this into an existing Work bullet so the file stays within the 5-bullet budget, or split the task.
   - Add `npm test --workspace cli -- test/run-copy-migration.test.mjs` to `**Verification:**`.
   - Widen the sweep bullet. It currently covers *"each file this task edits"*. It should cover every `cli/test/*.test.mjs` that imports `helpers/watcher.mjs` and drives a resumed, stall-restarted or previously parked session to an asserted `completed`. State it as a grep the implementer runs, for example `grep -lE "createWatcherFixture|helpers/watcher.mjs" cli/test/*.test.mjs`, then read each hit's `completed` assertions. Every file the sweep finds becomes a target.

   Then update the story index's `Top risks:` item 1 so the claim matches the targets.

## Should Fix

## Nice to Have
