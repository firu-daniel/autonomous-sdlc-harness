# Task plan review — iteration 0

## Must Fix

1. **The floor check in Task 9's verification points the wrong way** — `task_9_plan.md`, the third `**Verification:**` bullet.
   It reads: *"No `floor.json` row is below this run's figure (a breach would be red at gate 11)."* A breach is the other way round. Gate 11 fails when a **measured figure falls below its floor**, and `docs/retrieval-eval.md` → `## The regression floor` → **The margin, and why there is one.** puts every recorded floor *"0.05 below the measured value"*. So in a healthy run every row in `evals/docs-retrieval/floor.json` (B `mrr` 0.6, D `mrr` 0.7, and so on) **is** below this run's figure. If the implementer follows the bullet as written, every healthy row fails it, and under **Where this task stops** each failure becomes a false `blocker:`.
   **Fix:** In `task_9_plan.md`, rewrite the bullet as: *"No figure of this run is below its `floor.json` row's `value` (that would be a breach, red at gate 11). A breach found here is a `blocker:`, per **Where this task stops**."* Make the **The floor.** Work bullet use the same direction.

2. **Task 5 decides the end state's vector statement on fixture-sized figures alone, which repeats a ledger lesson** — `task_5_plan.md` (**The decision.**), with knock-on edits to `task_7_plan.md` and the story index's `## Scope register` row 32.
   `harness-runs/lessons.md` → `## Evidence and measurement`, first rule: *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision: the branch that makes the decision also ships the gate step that produces the real-shape figure, and the decision cites that step rather than the stub."*
   Task 5 takes its held-another states on `fixture-catalog` (41 chunks), with `self-docs` supplying only the dead rows. From those figures alone it decides whether `VACUUM chunks` or `REINDEX INDEX chunks_hnsw` joins `END_STATE_STATEMENTS`. Task 7 then ships that list into every refresh. The real-shape step this plan ships, gate 10 leg (vii) (Tasks 3 and 6), measures only the BM25 route-2 end state. It takes no arm C reading after deletes. So a vector statement adopted by Task 5 would be a shipped design decision with no real-shape figure behind it.
   Row 32 of the register records this lesson as *"Satisfied … Task 6 records the real-shape figure before Tasks 7–8 design on it"*. That holds for the BM25 statement only.
   The rebuild-cost seam has the same gap. `--reindex-cost` times one BM25 `REINDEX` (`docs/retrieval-eval.md` → `### The BM25 index-state probe`), so it does not cover an added `VACUUM` or HNSW rebuild. That leaves the lesson *"A feature that ships as 'not yet measured' ships the seam that will measure it"* unmet for that statement.
   **Fix:** Pick one of these and apply it consistently:
   - **(a)** In `task_5_plan.md` → **The decision.**, a vector statement never joins the end state on this branch. Where the figures show one restores full lists, record it as a proposal to the maintainer with this part's figures, and leave the short lists recorded as open. `END_STATE_STATEMENTS` is then `REINDEX INDEX chunks_bm25` alone. Simplify Task 7's and Task 8's restatements to match.
   - **(b)** Extend leg (vii) (`task_3_plan.md`) and Task 6's question and checks (`task_6_plan.md`) so the real catalog also yields an arm C reading after a refresh with deletes. Make Task 5's choice provisional until Task 6 confirms it at real shape, and state in Task 11's `## What it costs` bullet which seam measures the added statement's cost.

   Either way, correct register row 32's reason so it covers the vector decision.

3. **The base-commit snapshot is not removed on every exit path, which repeats a ledger lesson** — `task_4_plan.md` (**The base snapshot.**) and `task_9_plan.md` (**Preconditions.**).
   `harness-runs/lessons.md` → `## Remote and branch-scoped operations`: *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create."*
   Both tasks write the `d15e5cc3` snapshot under `harness-runs/scratch/fix-bm25/base-corpus/` and remove it with `--remove` only *"once this task's readings are taken"*. Each task also has stop paths taken after the snapshot exists:
   - Task 4: the sandbox-refusal `blocker:` (a partial snapshot), and a run failing mid-task.
   - Task 9: *"Its `self-docs` stamp must equal Task 4's recorded stamp; stop and report if it does not"*, and the floor-breach `blocker:` in **Where this task stops**.

   Every one of those exits leaves the snapshot behind. Register row 36 records the lesson as *"Satisfied"*, but that is true only on the success path.
   **Fix:** In both `task_4_plan.md` and `task_9_plan.md`, state that every exit after the snapshot is first written runs `base-corpus.mjs --remove` before returning: success, every `blocker:` and every stop. A partial write is removed the same way. Add a `**Verification:**` bullet saying the snapshot directory is absent when the task returns, whatever the outcome. Restate register row 36's reason to match.

## Should Fix

1. **`REINDEX INDEX chunks_hnsw` has no constant to compose from** — `task_7_plan.md`, the `DocStore.rebuildIndexes()` bullet. It says to compose the list from *"the existing constants (`BM25_INDEX`, `CHUNKS_TABLE`), never retyped"*. The HNSW index name has no exported constant: it is a literal in `openPgliteStore`'s `CREATE INDEX IF NOT EXISTS chunks_hnsw …` in `cli/src/retrieval/store.ts`. If Task 5 adopts that statement, name the constant to add (for example `HNSW_INDEX` beside `BM25_INDEX`), and have the open path's `CREATE INDEX` use it, so there are not two sources for the name. This goes away if Must Fix 2 takes option (a).
2. **A baked-in count in a verification bullet** — `task_3_plan.md`, the second `**Verification:**` bullet: *"The one remaining *"six legs"* phrase describes the 2026-09-22 run."* State the invariant instead: every remaining hit describes the 2026-09-22 run, and none claims the gate has six legs today.

## Nice to Have

1. `fix_docs_retrieval_bm25_index_state_typescript_story_plan.md`, top risk 4: Task 8 may not run `cli/test/docs-retrieval.test.mjs`, but it could **read** that suite's lexical-arm assertions against the new Seq Scan plan and its filter. It would then name in its return any assertion it expects to move, so the Run gates test-fix loop starts with that knowledge.
