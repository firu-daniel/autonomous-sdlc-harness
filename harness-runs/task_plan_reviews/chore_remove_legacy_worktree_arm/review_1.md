# Task plan review — iteration 1

## Must Fix

1. **Round 0's Should Fix on `cli/test/remote-start.test.mjs` was neither applied nor recorded as rejected.** Fix it in the story index (`chore_remove_legacy_worktree_arm_story_plan.md`) and in a `cli` per-task file. One option is `task_1_plan.md`, but it is already at 5 `**Work:**` bullets. Another is `task_5_plan.md`, but it changes script comments only, so a better fit is a test-only task such as `task_3_plan.md`.
   `review_0.md` → `## Should Fix` 1 asked for the case *"a refused start leaves a legacy linked worktree at the copy's path untouched"* (`cli/test/remote-start.test.mjs`) to be renamed and its comment reworded. Two other places still describe the legacy run too: the comment *"A registered working tree, so `git worktree remove --force` would delete it were the guard gone"* and the header sentence *"one legacy case plants a linked worktree there instead"*. `remote-run.sh` runs no `git worktree remove`, and after this branch no run copy is a linked worktree.
   The revised plan:
   - has no task whose `### Targets` names this file;
   - has no `## Rejected findings` section in the index;
   - still excludes `cli/test` from register entry 1 because it is *"owned by Tasks 1–6, 11 and 12 by their own targets"*, though none of those tasks targets this file.

   The lessons ledger says: *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."* _(taught by: fix_linux_detached_gate_run)_.
   The task prompt's `## What goes` → **Tests** also asks for *"the worktree cases elsewhere"* to be deleted or rewritten.
   **Fix:** Add `cli/test/remote-start.test.mjs` to the `### Targets` of a `cli` test task, and add a `**Work:**` bullet that does three things, with every assertion kept:
   - Rename the case to describe a linked worktree a person made by hand occupying the copy's path, for example *"a refused start leaves a hand-made linked worktree at the copy's path untouched"*.
   - Reword its comment so it no longer cites `git worktree remove --force`: the worktree is a registered working tree that start must not touch.
   - Reword the header's *"one legacy case"* sentence the same way.

   Add one `**Verification:**` bullet saying that this test file, which the task edits, passes. Keep the task within 5 bullets and 20 points. If you reject the finding instead, add a `## Rejected findings` section at the end of the index carrying this finding and its reason.

## Should Fix

1. **Register entry 1's reason for excluding `cli/test` is not true for every file under it.** Fix it in the story index (`chore_remove_legacy_worktree_arm_story_plan.md`) → `## Scope register` → the paragraph after derivation entry 1. The paragraph says `cli/test` is *"owned by Tasks 1–6, 11 and 12 by their own targets"*. That holds once Must Fix 1 is applied, so restate it then. The sentence should cover every file under `cli/test` that still carries legacy-run wording, so a later re-run can check the exclusion.
