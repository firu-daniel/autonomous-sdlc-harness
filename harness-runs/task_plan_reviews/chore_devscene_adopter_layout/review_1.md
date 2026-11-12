# Task plan review — iteration 1

## Must Fix

1. **The two Should Fix findings from iteration 0 were neither applied nor recorded under `## Rejected findings`.** Applies to the story index (`chore_devscene_adopter_layout_story_plan.md`) and to `task_files_dir`.
   `harness-runs/lessons.md` → `## Unattended control loops` says: *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."* This revision applied both Must Fixes from `review_0.md`: Task 26 now stages the drivers, and Task 35 now carries the fresh-adoption check. It did nothing with either Should Fix:
   - **Should Fix 1 is still in the text.** `## Context` → *Order, and the tree guards that force it*, first bullet, still reads *"The configuration contract lands first, schema-first, in four consecutive commits: Task 15 …, then Task 1 …, then Task 36"*. That names three tasks, so three commits. Task 1 covers both `model.ts` and `check.ts`.
   - **Should Fix 2 is still on disk.** `harness-runs/task_plans/chore_devscene_adopter_layout/_renumber.txt` still holds only `placeholder` and maps to no readiness entry.
   - **Neither is recorded.** `## Rejected findings` lists only the earlier slash-command-ordering rejection.

   Under the ledger, a plan that re-plans a lesson fails its review.
   **Fix:** In the story index's `## Context`, change *"in four consecutive commits"* to *"in three consecutive commits covering the contract's four places"*. Delete `_renumber.txt` from `task_files_dir`. If you keep either one as it is, add an entry for it under `## Rejected findings` stating the reason.

## Should Fix

1. **Two target counts disagree with the scope-register rows they cite.** Applies to `task_9_plan.md` and `task_11_plan.md`.
   - `task_9_plan.md` → `### Targets` says *"the twelve `cli/templates/state-dir/*/README.md` the scope register lists (rows 67–77)"*. Rows 67–77 are eleven files. The Work bullet *"The thirteen state-directory READMEs"* should say twelve, which is `README-root.md` plus those eleven.
   - `task_11_plan.md` → `### Targets` and Work say *"the eighteen files the scope register lists (rows 194–212)"*. Rows 194–212 are nineteen `branch-*.md` files. D1 lists all nineteen, from `branch-answer.md` through `branch-user-review.md`.

   An implementer who trusts the count could stop one file short. The broad Verification greps would catch it, but only after the work is done.
   **Fix:** In `task_9_plan.md`, change the counts to eleven and twelve. In `task_11_plan.md`, change the count to nineteen.

2. **Two commands in the fresh-adoption check are ones an unattended run is likely to refuse.** Applies to `task_35_plan.md` → *Verification — the fresh-adoption check*.
   - Step 7 is `rm -rf <scratch>`. `.claude/context/conventions.md` → `## Shell assets` says: *"Never shell out to a recursive removal. A user-level `permissions.deny` on `rm -rf` is realistic, deny is evaluated before any allow and cannot be overridden"*.
   - Step 2 is `mktemp -d "$TMPDIR/devscene-fresh-init.XXXXXX"`, which carries a shell expansion. `.claude/CLAUDE.md` says a command carrying a substitution *"is not reliably auto-allowed in an unattended run"*.

   **Fix:** Drop step 7, or say that a refused removal is recorded and is not a failure, since the directory is under the system temp directory. For step 2, either give a literal temp path or state that a refusal of that step is recorded in the return as "not run", never as a pass.
