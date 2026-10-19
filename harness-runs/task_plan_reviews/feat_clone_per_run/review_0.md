# Task plan review — iteration 0

## Must Fix

1. **The sync pair's `HR_RUN_MAIN` precondition is unstated, and the two consumer contexts need opposite answers** — `task_2_plan.md` (producer), restated in `task_5_plan.md`, `task_7_plan.md` and `task_9_plan.md` (consumers).

   `task_2_plan.md` → **The fetch's pins.** says every git call goes "through `hr_run_main_git` once `hr_run_main_set_var <main>` has set it", and the sync-out bullet says "Read that value with `hr_run_main_git`". It never says **who** sets `HR_RUN_MAIN`: the function itself or its caller. Read either way, one consumer breaks.

   - **The function sets it itself, by calling `hr_run_main_set_var`.** That function clears `HR_RUN_TRUSTED_BASE` and every `HR_RUN_COPY_*` global (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_main_set_var`: `HR_RUN_COPY_TOP=""`, `HR_RUN_COPY_GITDIR=""`, `HR_RUN_COPY_BRANCH=""`, `HR_RUN_COPY_TIP=""`). Task 7 calls `hr_copy_sync_in_var` from inside `hr_run_copy_check_var`, after it has set `HR_RUN_COPY_TOP` / `GITDIR` / `BRANCH`. It calls `hr_copy_sync_out_var` from `hr_run_fast_forward_var` after `HR_RUN_COPY_TIP=$new`, and from `hr_commit_paths_var` after the runner globals are seeded. Each of those calls would wipe the state the watcher family goes on to use.
   - **The caller must set it.** `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` never call `hr_run_main_set_var` and never set `HR_RUN_MAIN`. A grep for `hr_run_main_set_var\|HR_RUN_MAIN\|hr_run_` over the three templates finds nothing outside comments. They use their own `main_git` / `wt_git` helpers. `hr_run_main_git` returns 1 when `HR_RUN_MAIN` is empty. So Task 9's sync-in calls would fail on every clone, because each one comes before the commit wrapper's `hr_commit_paths_var`. The same goes for `refresh-branch.sh`'s sync-out and `push-branch.sh`'s mirror. Task 9's "The common change in all three" bullet adds no such call.

   Task 5 calls both functions directly and inherits the same ambiguity.

   **Fix:** In `task_2_plan.md`, state the contract exactly. Either:
   - (a) each sync function sets `HR_RUN_MAIN` from its `<main>` argument itself (canonical, with the same main-checkout predicate) **without** calling `hr_run_main_set_var` and without touching any `HR_RUN_COPY_*` or `HR_RUN_TRUSTED_BASE` global; or
   - (b) the caller must have run `hr_run_main_set_var <main>` first, and the function returns 1 with `HR_SYNC_REFUSAL` set when `HR_RUN_MAIN` is empty or differs from `<main>`.

   Also state which globals each function sets or leaves alone. Then restate that contract word for word in the **Depends on:** blocks of `task_5_plan.md`, `task_7_plan.md` and `task_9_plan.md`. If (b) is chosen, add the `hr_run_main_set_var "$main_top"` call, and its refusal under each wrapper's own prefix and exit code, to `task_9_plan.md`'s common-change bullet. Make sure it cannot change any worktree-arm behaviour. Either way, add a case to `task_8_plan.md` (or `task_5_plan.md`) asserting that `HR_RUN_COPY_TOP`, `HR_RUN_COPY_GITDIR`, `HR_RUN_COPY_BRANCH` and `HR_RUN_TRUSTED_BASE` survive a sync call.

## Should Fix

1. **The control commands in rows CL1–CL5 are partly composed rather than transcribed** — `task_14_plan.md`.
   - The task prompt's setup names the new-file controls only as "`dd` creating a new file in `<clone>/.git` and in `<main>/.git`".
   - The plan writes them as `dd if=/dev/null of=<clone>/.git/<new file> conv=notrunc`. That is the doc's own W0 form, but the prompt does not record it.
   - This conflicts with the task's own Goal and its verification bullet ("No commit id, path or message appears that the prompt does not carry").

   Either quote the prompt's wording for these controls, or say the form is §4's `dd` convention as applied to these controls, so a reader does not take it as the verbatim command of record.

2. **A code comment cites row CL5 before the row exists** — `task_1_plan.md`, `task_4_plan.md`.
   - Task 1's header comment and Task 4's suite header cite `docs/sandbox-verification.md` row CL5.
   - That row lands in Task 14, so the citation does not resolve for most of the branch.
   - `task_2_plan.md` handles the same forward reference by wording it so a mid-branch reader sees the gap ("added by this branch"). Do the same here.
   - Neither citation should name "Task 14" in shipped text.

3. **No `extensions.objectFormat` allowance for a SHA-256 repository** — `task_1_plan.md`.
   - The allow-list pins `core.repositoryformatversion=0`, but a clone of a SHA-256 main checkout needs format 1 and `extensions.objectformat`.
   - Either state in the spec's header comment that a SHA-256 main checkout is out of scope, so the check refuses it by design, or add the rule.
