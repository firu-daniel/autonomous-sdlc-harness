# Architecture review — iteration 3

The iteration-2 Must Fix is resolved in the artifact. `task_1_plan.md` → **Restate the section headers.** now restates `hr_registry_drop`'s and `hr_registry_restore`'s caller comments and `hr_clone_create_var`'s registry-directory clause. `task_7_plan.md` and `task_11_plan.md` list those restated comments under **Depends on:**.

The three iteration-2 Should Fix items are applied:
- Task 9 and Task 11 read the record through `hr_registry_peek`.
- Task 20 cites `hr_run_copy_live_var`.
- Task 21 adds `run-profiles/` to `docs/watcher.md` §5, and Task 6 adds it to `machineStateDir`'s JSDoc.

## Must Fix

1. **Task 1 adds library writers but leaves the library's closed write-exception list unchanged, so after this branch the list misstates who writes what** — `task_1_plan.md`, **Restate the section headers.** This violates `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit."* It also violates `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"*.

   The file header of `cli/templates/scripts/lib/harness-run-lib.sh` → *"THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES"* states its own rule: *"Nothing outside this list writes at all; a section that adds a writer adds its entry here."* Each section points back to its own entry, for example *"Write exception 5 in the header is this section's."* Task 1 changes the library's writes in four ways, and none of its header bullets touches that list:
   - **The new `hr_copy_ref_swap_var`** moves the clone's `refs/heads/<branch>` and the main checkout's, then rolls the clone back. Exception 6 ends *"Written only by `hr_copy_sync_in_var`, `hr_copy_sync_out_var`, `hr_clone_create_var` and `hr_clone_remove_var`"*. The new function is not on that list, and it is not on the closing *"A caller that calls no … function still gets a library that only reads"* list either.
   - **Sync-in's heal** fast-forwards the **clone's** `refs/heads/<branch>`. Exception 6's fence says *"sync-in writes objects, `FETCH_HEAD` and `refs/heads/<branch>` in the main repository … sync-out writes the one named ref in a clone's own `.git`"*. After the heal, sync-in also writes inside the clone, which that fence does not allow.
   - **Exception 4** says *"On a clone, `hr_commit_paths_var` also syncs the moved ref out to the clone's `refs/heads/<branch>` through `hr_copy_sync_out_var` (exception 6)"*. **Exception 5** says *"and, on a clone, the clone's `refs/heads/<branch>` through `hr_copy_sync_out_var`"*. Task 1 replaces both paths with the clone-first helper, so both sentences become false.
   - **Exception 5's runner example** reads *"a caller that drives a writing git command through them (`create-worktree.sh`'s `worktree add`, `read-tree` and cleanup `worktree remove`) owns that write"*. Task 7 deletes all three calls from `create-worktree.sh`.

   Task 1 is the only task allowed to edit the library, so no later task can make this amendment.

   **Fix:** in `task_1_plan.md` → **Restate the section headers.**, add one bullet that restates the file header's write-exception list:
   - **Exception 6:** add `hr_copy_ref_swap_var` to the *"Written only by"* list. Restate the fence so it covers the helper's clone-first compare-and-swap on both refs and its compare-and-swap rollback of the clone. State that sync-in's heal moves the clone's `refs/heads/<branch>` by compare-and-swap.
   - **Exceptions 4 and 5:** replace the `hr_copy_sync_out_var` clauses with the helper.
   - **Exception 5's runner example:** name the runner writes `create-worktree.sh` still drives after Task 7, or drop the example.
   - **The closing "only reads" list:** add `hr_copy_ref_swap_var`.

   Add a **Verification** step:
   - `grep -n 'hr_copy_ref_swap_var' cli/templates/scripts/lib/harness-run-lib.sh` reaches the header's exception 6 and the closing list.
   - No line in exceptions 4–6 still says a clone's `refs/heads/<branch>` is moved through `hr_copy_sync_out_var`.

## Should Fix

_None._

## Nice to Have

1. `task_20_plan.md`: condition 2 (*"the registry record's `worktree` … names a path that exists"*) can never fire on its own in this command, because check (a) already rejects any registry record for the branch. Say so in one clause, or drop the condition from (b), so the command does not appear to rely on a test it never reaches. This was carried over from iterations 0–2.
