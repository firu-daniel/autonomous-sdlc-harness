# Task plan review — iteration 1

## Must Fix
1. **Iteration 0's Should Fix on register row 27 was neither applied nor recorded, which repeats a ledger lesson.** Files: the story index (`chore_devscene_docs_retrieval_story_plan.md`), `## Scope register` row 27, and `task_11_plan.md` (`### Targets` and the second `**Work:**` bullet).
   `harness-runs/task_plan_reviews/chore_devscene_docs_retrieval/review_0.md` → `## Should Fix` 1 said that row 27 is a `change` row with nothing left to change. This revision still has the problem:
   - Row 27 still reads `docs/rag-extraction-research/07-extraction-plan.md` (every hit except rows 28–32), `change`, Task 11.
   - `task_11_plan.md` still lists `07-extraction-plan.md` under `### Targets`, and its second `**Work:**` bullet still tells the implementer to rename hits there "except for the kept lines".
   - The story index has no `## Rejected findings` section that records a reason for keeping either.

   I re-ran the register's own derivation entry 2 (`git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness' -- docs/work-report-research docs/rag-extraction-research`). In that file it reaches exactly five lines: the cut-table row `6, 7` and the four catch-2 bullets ("**Keep `HARNESS_RETRIEVAL_CACHE` (4).**", "**Replace `HARNESS_RETRIEVAL_LOG` (0).**", "**Add `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` (7)…", "**Fix #154 too.**"). Rows 28–32 keep all five as `no-change`. Row 27 therefore assigns Task 11 an edit with no hit to make, and Task 11 targets a file that must stay byte-identical.

   The finding was neither resolved in the artifact nor recorded, so it is unaddressed. Leaving it that way repeats the ledger entry `harness-runs/lessons.md` → `## Unattended control loops`: *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."*
   **Fix:** Either apply the finding or record a rejection.
   - **To apply it:** in the story index, delete row 27, or reword it so the file's only rows are its five `no-change` lines. In `task_11_plan.md`, drop `07-extraction-plan.md` from the `docs/rag-extraction-research/` line of `### Targets`, and drop "`07-extraction-plan.md`" from the second `**Work:**` bullet's "Do the same in …" list. Its kept lines stay listed under "Which lines keep their text", because the closure grep still prints them.
   - **To record a rejection:** add a trailing `## Rejected findings` section to the story index, as its last section after `## Scope register`. List review_0 Should Fix 1 there with a reason that holds against the derivation-entry-2 output above.

## Should Fix

## Nice to Have
