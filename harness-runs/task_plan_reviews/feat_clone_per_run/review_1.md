# Task plan review — iteration 1

Iteration 0's Must Fix (the sync pair's `HR_RUN_MAIN` precondition) is resolved. Task 2 now states the globals contract, Tasks 5, 7 and 9 restate it word for word, and Task 5 case (h) proves it holds.

## Must Fix

1. **The library header's "writes nothing" guarantee goes false and no task updates it** — `task_7_plan.md` and `task_3_plan.md`.

   The guarantee lives in `cli/templates/scripts/lib/harness-run-lib.sh` → the file header:
   - the opening of *THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES*: "Nothing outside this list writes at all; a section that adds a writer adds its entry here";
   - the closing list: "A caller that calls no `hr_lane_*`, … `hr_run_main_git` or `hr_run_copy_git` function still gets a library that only reads".

   **Task 7.** It makes `hr_run_copy_check_var` call `hr_copy_sync_in_var` on a clone. That call writes objects into the main repository and moves its `refs/heads/<branch>` by compare-and-swap. `hr_run_copy_check_var` is not in the closing list, and it is not a writer under write exception 5. Exception 5's fence also still reads "moved only by a compare-and-swap `update-ref` against the tip `hr_run_copy_check_var` read", but on a clone the copy check moves that ref itself.

   This matters to callers that use the copy check as a read-only probe. `cli/templates/scripts/remote-run.sh` does this in its liveness test (`hr_run_copy_check_var "$run_main" "$record_wt" && [ "$HR_RUN_COPY_BRANCH" = "$branch" ]`). On a clone, those callers would write without the header saying so.

   Task 7's header bullet only changes exception 5's fence (the clone's ref through `hr_copy_sync_out_var`) and adds a note to exception 4.

   **Task 3.** It adds `hr_registry_drop` to exception 2 and to the closing list, and it adds "creation and removal fences" to exception 6. It never names `hr_clone_create_var` or `hr_clone_remove_var` as writers. Task 2 lists exception 6's writers as "written only by `hr_copy_sync_in_var` and `hr_copy_sync_out_var`". Neither creation function is added to the closing list either. As written, the header would still say that a caller of `hr_clone_create_var` or `hr_clone_remove_var` gets a library that only reads.

   `.claude/context/cli.md` → `## What "done" means here` says: "A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit."

   **Fix:**
   - In `task_7_plan.md`'s header bullet:
     - name `hr_run_copy_check_var` (through `hr_copy_sync_in_var`, on a clone only) as a writer, in write exception 5 or 6;
     - correct exception 5's "against the tip `hr_run_copy_check_var` read" fence for the clone arm;
     - add `hr_run_copy_check_var` to the closing *"only reads"* list.
   - In `task_3_plan.md`'s removal bullet:
     - add `hr_clone_create_var` and `hr_clone_remove_var` to write exception 6's "written only by" list;
     - add both to the closing *"only reads"* list.
   - Add a diff-reading check to each task's **Verification:** confirming that every new writer appears in both places.

## Should Fix

1. **Carried from iteration 0, still unaddressed: the control commands in CL1–CL5 are partly composed rather than transcribed** — `task_14_plan.md`.
   - The **Setup** bullet writes the new-file controls as `dd if=/dev/null of=<clone>/.git/<new file> conv=notrunc`.
   - The task prompt records them only as "`dd` creating a new file in `<clone>/.git` and in `<main>/.git`".
   - Goal 1 asks for "the commands verbatim".
   - Either quote the prompt's wording, or label the form as §4's `dd` convention applied to these controls, not as the command of record.

2. **Carried from iteration 0, still unaddressed: shipped comments cite row CL5 before it exists** — `task_1_plan.md` (the `hr_wrapper_target_check_var` header bullet: "Task 14's row CL5") and `task_4_plan.md` (header bullet).
   - Word each citation so a mid-branch reader sees the gap, as `task_2_plan.md` does with "(added by this branch)".
   - Do not let "Task 14" appear in shipped text.

3. **Carried from iteration 0, still unaddressed: a SHA-256 main checkout** — `task_1_plan.md`.
   - The allow-list pins `core.repositoryformatversion=0` and admits no `extensions.objectformat`.
   - Either say in the spec's header comment that a SHA-256 main checkout is refused by design, or add the rule.

4. **`docs/cli.md` §6 residual 1, item 7 still gives `refresh-branch.sh`'s exit 5 one meaning** — `task_15_plan.md`.
   - Item 7 calls exit 5 "the one state it cannot undo": the branch moved, the tree refused, and the put-back failed.
   - Task 9 gives exit 5 a second cause on the clone arm: a failed sync-out. Task 15's Depends-on even states this ("Exit 5 now also covers a failed sync-out").
   - But Task 15's verification limits the diff to four paragraphs plus the measured-record one, so item 7 cannot change.
   - Either add item 7 to Task 15's Work, or give it a `no-change` row in the story index's `## Scope register` with the reason: no real run reaches the clone arm yet.

5. **`hr_copy_kind` defaults to the writing arm** — `task_1_plan.md` (producer); `task_2_plan.md` and `task_7_plan.md` depend on it.
   - It prints `clone` for any gitdir that is neither `<main>/.git` nor directly under `<main>/.git/worktrees/`, and it compares purely lexically.
   - If a caller passes a `<main>` that is not canonical, a worktree's canonical gitdir would be classed `clone`, and sync-out would write a ref through the worktree record. For example, macOS's `/var` → `/private/var`.
   - Today's callers pass canonical values (`hr_wrapper_main_of`, `HR_RUN_MAIN`), so nothing breaks now.
   - Either canonicalize `<main>` inside `hr_copy_kind`, or decide `clone` from `HR_TARGET_KIND` / a positive shape test and return a refusal for an unrecognized gitdir.
