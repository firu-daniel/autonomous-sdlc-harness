# Task plan review — iteration 0

## Must Fix

1. **The new module is required to contain the D1 phrase, and three verifications require D1 to reach no plugin file.** Files: `task_2_plan.md`, `task_4_plan.md`, `task_9_plan.md`, and the story index (`fix_clone_main_repo_resolution_story_plan.md`).
   - `task_2_plan.md` → `## The fallback` → **F2 keeps today's answer, by name.** requires `plugin/instructions/main_repo_resolution.md` to say *"It is the first `worktree ` line of a bare `git worktree list --porcelain`"*. That sentence carries the D1 needle `` first `worktree ` line ``.
   - `task_4_plan.md` → **Verification:**, first bullet: ``git grep -l -F 'first `worktree ` line' -- plugin`` finds nothing. Once Task 2 has landed, this check will always find `plugin/instructions/main_repo_resolution.md`, so Task 4 can never pass its own verification.
   - `task_9_plan.md` → **Verification:**, second bullet: ``git grep -l -F 'first `worktree ` line' -- docs plugin`` finds nothing. It fails for the same reason. Task 9 also tells the implementer to add *"One sentence of what the fallback does, from the rule above"*, and step 2 of that rule reads *"use the first `worktree ` line of `git worktree list --porcelain`"*. So `docs/watcher.md` may carry the needle again too.
   - Story index → `## Scope register` → **Closure invariant:** *"Once Tasks 4 and 9 land, D1 must reach no file under `plugin/` and must not reach `docs/watcher.md`"*. The plan's own module breaks this.

   What was retired is the **whole old clause**, not the phrase. Task 8's `forbidden` string is already the full old clause, and that is the right test.

   **Fix:** In `task_4_plan.md` and `task_9_plan.md`, change those verification greps to search for the full old clause, ``the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain` ``, scoped as now. In `task_9_plan.md`, also say that the added sentence must not repeat that full old clause. In the story index, restate the closure invariant the same way: once Tasks 4 and 9 land, no file under `plugin/` and not `docs/watcher.md` carries the full old clause. The alternative is to reword F2 in `task_2_plan.md` (and the Task 9 sentence) so neither carries `` first `worktree ` line ``. Pick one route and apply it in all four files, so that no verification contradicts another task's required text.

## Should Fix

1. **`task_1_plan.md`: say that `jq` is needed only on the clone arm.** The **Work:** bullet *"Every other outcome exits non-zero. That includes the marker present, any check failing, no git and no `jq`"*, and the matching `CLAUDE.md` wording *"and so does a missing `jq`"*, can be read as making `jq` a precondition in every layout. Read that way, an adopter's main checkout without `jq` would fall silent where it offers today. That breaks the prompt's constraint *"Today's answer is unchanged in the main checkout and in a linked worktree"*. State that the F2 arm (no alternates file) needs no `jq`. Optionally, add a Task 7 case that runs the F2 arm with `jq` absent from `PATH`.
2. **Story index → `## Scope register`, rows 24, 26 and 28: replace `line 5` with a quoted anchor.** The `Site` cells cite a line coordinate. Use the quoted substring instead, *"at the main worktree's root"*, as `task_1_plan.md` already does.
3. **`task_12_plan.md`: an edit that may happen is missing from `### Targets`.** The **Work:** bullet *"Recount only if needed"* may edit `examples/notes-app/README.md`. List that file under `### Targets` as conditional, or say the task stops with a blocker if a recount differs.

## Nice to Have

1. **`task_3_plan.md` / story index: say the tree is briefly red between Tasks 3 and 6.** After Task 3 lands, `cli/test/qa-user-locks.test.mjs` case (f) fails until Task 6 rewrites it. A sentence in Task 3's **Where this task stops.** saying that the red case is expected until Task 6 would save an implementer from investigating it.
