# Architecture review — iteration 4

The iteration-3 Must Fix is resolved in the artifact. `task_1_plan.md` → **Restate the section headers.** now carries a **Restate the file header's write-exception list** bullet covering exception 6's *"Written only by"* list and fence (the helper, its rollback, the verify-only form and sync-in's heal), exceptions 4 and 5, exception 5's runner example and the closing "only reads" list. Its **Verification** has the requested `grep` and the read of exceptions 4–6.

The story index has no `## Rejected findings` section.

## Must Fix

1. **Task 11 makes `start` and `review` write a registry record and directory, but leaves `remote-run.sh`'s header stating that `start` writes none** — `task_11_plan.md`, the **Rewrite the header for clones** bullet. This violates `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit."*

   `cli/templates/scripts/remote-run.sh` states what its verbs write, in two places:
   - **The `start` paragraph** (*"`start` IS THE ADAPTERS' ONE ENTRY"*) ends: *"It writes no registry record: a trigger job has no registry, and such a run needs no local record: the local commands act on it through GitHub."*
   - **`WHAT IT NEVER DOES.`** gives the whole write inventory for each verb. `start`'s is *"the prompt committed on `origin/<branch>`, through a working copy and a local branch it removes before it returns, and … a fetch"*. `review`'s cut path lists *"a copy and a local branch it removes"*. Neither names a registry record or a registry directory.

   After this branch, both statements are false. Task 7 makes `create-worktree.sh` create `<stateDir>/autonomous_logs/` when it is absent, which is exactly the trigger job's case. Through `hr_clone_create_var`, it also writes a registry record with `worktree` and `copy_kind`. Task 11 then drops that record (`hr_registry_drop`) and `rmdir`s the directory. Task 11's header bullet asks only for *"the place that says what each removes"* and for no sentence to say a copy is a linked worktree. It does not ask for the *"writes no registry record"* claim or the write inventory to be amended, and no other task owns `remote-run.sh`. A reader who trusts the inventory would miss a registry write. That write is exactly the kind of thing the inventory exists to enumerate.

   **Fix:** in `task_11_plan.md` → **Rewrite the header for clones**, add a bullet:
   - In the `start` paragraph, replace *"It writes no registry record: a trigger job has no registry, …"* with the new fact. The verb's `create-worktree.sh` call writes a registry record for the clone, and creates the registry directory when it is absent, which a trigger job's fresh checkout always is. The verb drops a record that did not exist before and removes the directory when it made it and it is empty. No record is left behind, so the local commands still act on such a run through GitHub.
   - In `WHAT IT NEVER DOES.`, add those writes to `start`'s and `review`'s cut-path inventory, each as written and then removed. Keep `review`'s mirror path as it is: it writes no record there.

   Add a **Verification** bullet: `grep -n 'writes no registry record' cli/templates/scripts/remote-run.sh` prints nothing, and `WHAT IT NEVER DOES.` names the registry record and directory for both `start` and the `review` cut path.

## Should Fix

1. **Task 11's switch from `branch -D` to a compare-and-swap delete leaves the upstream section behind in the main checkout** — `task_11_plan.md` → `start_remove_copy` step 3. After Task 7, `create-worktree.sh` pushes a new branch with `--set-upstream` from the main checkout, which writes `branch.<branch>.remote` / `.merge` into the main `.git/config`. Task 7's own rollback (step 3) states that *"`update-ref -d` leaves it behind"*, and removes the section with `git config --remove-section`. Task 11 replaces `branch -D`, which removes that section, with a compare-and-swap delete, but does not remove the section. So every local `start` leaves a `branch.<branch>` section in the main checkout's configuration. That is a write the verb made and did not remove (`harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path…"*). **Fix:** in step 3, when the verb cut the branch, also run `git -C "$run_main" config --remove-section "branch.$branch"` after the compare-and-swap delete, as Task 7 does, as one more idempotent step. Have Task 12's `remote-start.test.mjs` assert that `git config --get-regexp '^branch\.feat_x\.'` prints nothing afterwards.

## Nice to Have

1. `task_1_plan.md`: `hr_clone_git`'s comment calls it *"the one body of the clone-side pins, used by sync-out and by creation"*. After this task, `hr_copy_ref_swap_var` and sync-in's heal use it too. Add both to the comment while the section headers are being restated.
2. `task_20_plan.md`: condition 2 (*"the registry record's `worktree` … names a path that exists"*) can never fire on its own in this command, because check (a) already rejects any registry record for the branch. Say so in one clause, or drop the condition from (b). This was carried over from iterations 0–3.
