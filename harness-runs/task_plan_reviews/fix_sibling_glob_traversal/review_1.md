# Task plan review — iteration 1

All five Must Fix items from `review_0.md` are resolved. The four drivers are now `.mjs` in Tasks 4–7. Entry A is widened, and rows 24 and 25 are added and assigned to Task 7. I re-ran entry A verbatim: every line it prints is a register row. I also re-walked entry B over `harness-runs/lessons.md` and `harness-runs/improvement_suggestions.md`, and it reached no entry. Should Fix 3 from round 0 is applied in `task_1_plan.md` → **Where this layer stops.**

## Must Fix

1. **Three round-0 Should Fix items were neither applied nor recorded under `## Rejected findings`**: `fix_sibling_glob_traversal_story_plan.md` and `task_2_plan.md`.
   The lessons ledger, `harness-runs/lessons.md` → `## Unattended control loops`, says: *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."* (taught by `fix_linux_detached_gate_run`). The story index has no `## Rejected findings` section, and the revised plan still carries all three unaddressed items:
   - **Round-0 Should Fix 1** (`task_2_plan.md`). The first `**Verification:**` bullet still reads *"A multi-step probe may live under `harness-runs/scratch/` and run through `bash scripts/scratch-run.sh harness-runs/scratch/<file>.sh`"*. That call exits 66, because `scripts/scratch-run.sh` → `SCRATCH_INTERPRETERS='py:python3 js:node mjs:node cjs:node rb:ruby dart:dart php:php'` carries no `.sh` row. Tasks 4–7 were corrected for the same reason; this bullet was not.
   - **Round-0 Should Fix 2** (story index → `## Scope register` → **Derivation entry A**). The pathspecs `'harness-runs/lessons.md'` and `'harness-runs/improvement_suggestions.md'` still sit beside `':!harness-runs/**'`. The exclusion drops both files, so entry A never reads them. Only entry B covers them.
   - **Round-0 Should Fix 4** (story index → `## Scope register`). `task_7_plan.md` → **The counts.** still edits two passages that have no register row: the §2.4 **Outcome** paragraph's open and closed counts, and the sentence listing the rows added later (*"Row `h` was added with the bare-`&` separator …"*).

   **Fix:** In `task_2_plan.md`, change the probe example to `harness-runs/scratch/<file>.mjs` (or `.py`). In the story index, either remove the two dead pathspecs from entry A or add a sentence saying entry B covers those files. Also add register rows for the two §2.4 bookkeeping passages, each with disposition `change` and owner Task 7. For any of the three you judge wrong, record it as a `## Rejected findings` line at the end of the index with its reason, instead of applying it.

## Should Fix

None beyond the item above.

## Nice to Have

1. Register row 9 (`fix_sibling_glob_traversal_story_plan.md`) has *"A, `` `cd` arm `` / arm prose"* in its Evidence cell. A re-run of entry A does not print that line (`docs/guard-verification.md`, *"The middle four are the rows a later "simplification" has to fail on"*). Keeping the row is correct, because Task 7 changes the passage. Its Evidence cell should say it was added by hand from Task 7's edit list rather than from entry A.
2. This repeats Nice to Have 1 from round 0. Tasks 4, 5 and 6 target only gitignored files under `harness-runs/scratch/`. One sentence in each could say that the committer's flip-only commit is the task's record.
