# Task plan review — iteration 2

All three Must Fixes from iteration 1 are resolved in the artifact:
- Task 10 now accepts the branch an issue's genuine `started` marker names, and its first-run case runs end to end on `pushBranch('feat_y', { ledger: false })`. Task 7's cases run on a branch that carries a ledger.
- Task 7 amends the `review` clause of `WHAT IT NEVER DOES.` after Task 4's text, and register row 79 lists it.
- D15 exists, rows 89 to 93 cover every site it reaches, and Task 16 (`plugin`) owns `branch-resume.md`.

Structure checks pass:
- All sixteen readiness entries map 1:1 to their files, and each `### Task N` heading matches its file name.
- Each entry carries one layer and a points value of 20 or less, and no file has more than five `**Work:**` bullets.
- The order runs `cli`, then `plugin` (Task 16 at entry 13), then `general`, and every `**Depends on:**` link points at an earlier entry.
- No task targets a conventions document.
- No `**Verification:**` bullet runs a test file its task does not create or edit, or the suite.

I re-ran D1 to D8, D14 and D15 word for word, and every site they reach is a row. One new Must Fix follows.

## Must Fix

1. **Task 10's rule (a) accepts a branch that no longer exists on origin, so `resume`, `answer` and `clear` on an issue now dispatch onto a deleted branch and tell the user to retry.** File: `task_10_plan.md`. The same fact is restated in the story index's `## Context` (finding 5 paragraph) and in `task_14_plan.md` (**Who and where.**).
   - Today, `control_check_branch` (`remote-run.sh`) calls `forge_fetch_branch "$b"`, which tolerates a failed fetch and returns 0, and then calls `forge_recognised`. For a deleted branch the remote-tracking ref does not exist, so the branch is refused.
   - Task 10's rule is *"`$2` is `started` → accepted. Fall through to `CONTROL_BRANCH="$b"`"*. Its Goal says (a) holds *"whatever state that run is in now"*. An issue keeps its genuine `started` marker after its branch is deleted, so the branch now passes.
   - **The path this opens.** Round 8's leg (h) deleted a branch, and the `delete` job's comment said *"its branch was deleted, so the run cannot be resumed"*. A user who comments `@sdlc-harness resume` on that issue goes through these steps:
     - `control_state_var` reads the state. The cancelled job's bundle gives `paused` / `killed` (Case 3), and `control_state_word_var` names it `stopped`.
     - `control_resume` still resumes a stopped `paused` run (header → `A STOPPED RUN IS NAMED stopped`), so it reaches `control_resume_dispatch`.
     - `verb_dispatch` runs `gh workflow run … --ref "$branch"` against a ref that does not exist.
     - The reply is `the dispatch could not be sent (…)` with *"Comment `@sdlc-harness resume` again to retry."*.
   - That reply is the kind of misleading message that finding 6 lists. It also contradicts the harness's own `stopped` comment. `answer` on a stopped `parked` run and `clear` on a stopped `park_loop` run take the same path.
   - No case in `task_10_plan.md` covers a deleted branch.

   **Fix:** in `task_10_plan.md`:
   - Accept rule (a) only when the branch exists on origin. Either check that `refs/remotes/origin/<b>` resolves after `forge_fetch_branch`, or call `remote_branch_exists "$b"`, the existing helper that `continue_redispatch` and `continue_wait_poller` already use.
   - If the branch is absent, refuse with exit 2 and a reason that names the deletion, for example ``\`$b\` no longer exists on origin, so its run cannot be resumed``. If the existence check itself fails, use the existing failed-read refusal form (`EXIT_GH`, "Comment again to retry."). Neither refusal may say "not a harness branch".
   - Add a `remote-control.test.mjs` case. Issue 7 carries a bot `started` marker for `feat_y`, `feat_y` is never pushed to origin, and `@sdlc-harness resume` on the issue gives that refusal with nothing dispatched.
   - State the existence condition in the `THE BRANCH.` text this task writes.
   - Carry the condition into `task_14_plan.md`'s **Who and where.** fact list and into the story index's finding 5 paragraph.

## Should Fix

- **The check-run annotation read still has no `checks` permission.** Files: `task_6_plan.md`, `task_12_plan.md`, `task_13_plan.md`. This was raised in iteration 1 and is still unaddressed.
  - `harness-run.yml`'s `permissions:` block lists only `contents`, `actions`, `issues` and `pull-requests`. Every scope it does not list is `none`.
  - So `check-runs/<id>/annotations` will fail in `collect` and in `control`, and the reason will always fall back to ``its `run` job ended `<conclusion>` with no step run``. Task 13's new not-verified row would then describe an annotation that the shipped workflow never reads.
  - **Fix:** either add `checks: read`, with its header line, to every workflow whose job reaches `run_not_started_var`, or state in Tasks 6 and 13 that the fallback is the expected text under the shipped permissions.
- **`notify not_started` sends an event word outside `autonomous-notify.sh`'s seven.** File: `task_8_plan.md`. This was raised in iteration 1 and is still unaddressed.
  - Task 9 states its own `bundle_unreadable` exception and the generic title it gets; Task 8 states nothing.
  - **Fix:** either state that the generic title is intended, or send the push as `paused` / `failed` and keep `not_started` for `forge_report` alone.
- **Task 14 documents an `answer` behaviour that does not exist.** File: `task_14_plan.md` (the `answer` row addition and the "Tasks 5 to 7" fact *"`resume` and `answer` use the engine its dispatch recorded"*). The same phrase appears in `task_7_plan.md`'s Goal (*"and `answer` where it applies"*). This was raised in iteration 1 and is still unaddressed.
  - `control_answer` refuses every state but `parked` (`remote-run.sh` header → `THE ARMS.`: *"any state but `parked`"*). A never-started run is `paused` / `killed` or `failed`, so `answer` never acts on it.
  - **Fix:** drop the `answer` row addition, or reword it: an answer whose dispatch never started is recovered with `resume`.
- **The resumed first run is told to "resume strictly from the committed flow-progress ledger", which does not exist.** Files: `task_7_plan.md` ("Resuming it is safe"), `task_16_plan.md`.
  - With `--resume pause` and no restored bundle, `prev_status` is empty. `run_job` (`autonomous-watcher.sh`, the `[ "$resume" = "pause" ] && { [ "$prev_status" != "paused" ] …` branch) therefore sets `pause_note_stale 1`.
  - `spawn_engine` then sends the clause *"there is no pause note — resume strictly from the committed flow-progress ledger `<state_dir>/flow_progress/<branch>_progress.md` — continue at the first phase entry still marked [ ]"*, naming a file the first run's branch does not have.
  - `verb_restore`'s "this is its first job" line answers only the restore half.
  - **Fix:** cite where the engine handles an absent ledger on that clause (for example the planning fork's no-story-index case) and verify it. Or have Task 7 note the clause and its effect.
- **Task 8's way-on sentence is false for a first run.** File: `task_8_plan.md`.
  - The `paused`-with-engine text is *"Comment `@sdlc-harness resume` to start it again from its committed ledger."*. Task 8's own "A first run, engine recorded" case posts that sentence on a branch with no ledger.
  - That is the claim Task 16 corrects in `branch-resume.md`.
  - **Fix:** drop "from its committed ledger", or word the sentence so it holds for a first run.

## Nice to Have
