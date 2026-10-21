## Unit-loop row A's `commit_prefix` rule names a token this repository's commit policy forbids, so the first task commit was refused
- **category:** agent-contract
- **evidence:** dispatch #2 (`[A · Task 1 · commit] → committer`) passed `commit_prefix: fix`, the value `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` cell gives for a `fix_` branch; the committer returned `error: commit_prefix fix is not a legal value under the commit policy in .claude/context/conventions.md, which allows only the prefix none for a story task; nothing was committed or pushed`. `.claude/context/conventions.md` → `## Commit-message policy` assigns `none` to both the story-task and the fix classes. Dispatch #3 with `commit_prefix: none` committed `3dbf4b27`; every later task and fix commit passed `none`.
- **cost this run:** one committer dispatch wasted, and a story-index checkbox flipped and reverted by hand inside the refused dispatch.
- **hypothesis:** row A's branch-name rule predates the committer's policy-reading `commit_prefix` contract that the fix rows already defer to.

## The planning architecture gate overruled a user's planning answer, and the overruled exception was needed again at implementation
- **category:** agent-contract
- **evidence:** the user answered planning Q1 with (a), "the one `cli` task … also edit[s] `evals/docs-retrieval/floor.json` … an explicit exception to the one-layer-per-task rule"; `harness-runs/architecture_reviews/fix_docs_retrieval_bm25_index_state_typescript/review_0.md` raised that exception as Must Fix 1 and the writer removed it, so the orchestrator asked the user again (they accepted the revision). At implementation, Task 8 returned `blocker: Task 8's fix moves two fixture-catalog floored figures …`, and the user ruled the re-record into Task 8's own commit as a one-off cross-layer exception (commit `0c4630e5`, which touches `cli/src/retrieval/refresh.ts` and `evals/docs-retrieval/floor.json`).
- **cost this run:** one extra user question at planning, one Task 8 park and re-dispatch at implementation (dispatches #18 and #19), and a second user question on the same decision.

## A reviewer wrote a home-directory path into a committed review file, caught only by the Run gates phase
- **category:** silent-failure
- **evidence:** `harness-runs/architecture_reviews/fix_docs_retrieval_bm25_index_state_typescript/review_0.md` (planning, plan-review mode) quoted an absolute path under the home directory in `## Should Fix` item 1; it was committed in `3bf658b8` (`chore: Add task plan for …`). Run gates round 1 failed on it (`harness-runs/test_run_logs/fix_docs_retrieval_bm25_index_state_typescript/task_round_1.log`); test fix plan `harness-runs/test_fix_plans/fix_docs_retrieval_bm25_index_state_typescript_task_round_1.md` had one finding, fixed in `8b51e556`; round 2 passed.
- **cost this run:** one gate round and four dispatches (#47–#51: test-fix-plan writer, architecture gate, committer, implementer, committer).

## Probe runs over `self-docs` outlast the 600 s foreground window and are collected against the test-run rule
- **category:** tooling-gap
- **evidence:** Task 2's first Python `self-docs` run and Task 10's TypeScript `self-docs` run were each moved to the background by the tool layer at 600 s; each implementer waited for the run to exit and read its capture (Task 2's return; `harness-runs/task_plans/fix_docs_retrieval_bm25_index_state_typescript/task_10_plan.md` deviation note). `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6 says a backgrounded run is not collected; the user accepted Task 10's collection by ruling.
- **cost this run:** one user ruling, and two recorded measurements resting on a collection the rule forbids.

## Answers given live in the manual entry point reached implementer dispatches only outside the sanctioned form
- **category:** agent-contract
- **evidence:** the implementation fork's `<escalate>` manual arm says questions "surface live … No files are written", but names no channel by which the answer reaches the re-dispatched implementer; four implementer dispatches (#13, #14, #19, #24) carried the user's answer as a trailing section, each recorded as `outside the sanctioned form` in `harness-runs/dispatch_additions/fix_docs_retrieval_bm25_index_state_typescript.md` (commit `a8d5002b`).
- **cost this run:** four recorded dispatch-discipline violations that carried only the user's own rulings.

## The plan needed 3 review rounds across its plan-convergence gates
- **category:** optimization
- **evidence:** plan-convergence rounds on disk: `harness-runs/architecture_reviews/fix_docs_retrieval_bm25_index_state_typescript/review_0.md` (1 round in that root), `harness-runs/task_plan_reviews/fix_docs_retrieval_bm25_index_state_typescript/review_0.md` and `review_1.md` (2 rounds in that root); `business_parity_reviews` absent (`phases.parity` false). Total 3. Per round, by finding title: architecture `review_0` — 1 Must Fix, 1 Should Fix, all net-new (first round of its root); task-plan `review_0` — 3 Must Fix, 2 Should Fix, 1 Nice to Have, all net-new (first round of its root); task-plan `review_1` against `review_0` — Must Fix 4 net-new / 0 re-raised, Should Fix 2 net-new / 1 re-raised (the baked-in count), Nice to Have 0 net-new / 1 re-raised.
- **cost this run:** 4 writer dispatches and 6 reviewer dispatches in the planning loop.

## The plan reported an undescribed layer: `docs-retrieval-service/`
- **category:** tooling-gap
- **evidence:** the `task-plan-writer`'s revision-3 return carried `## Corpus staleness` with one entry, `undescribed-layer` — `docs-retrieval-service/` (the Python docs-retrieval service: package, tests, compose stack, Postgres image, and its `README.md`), covered only by the catch-all `general` row (`path: "."`); Task 11 and skeptic Finding 1 edited that directory's `README.md`.
- **cost this run:** none on this branch; the remedy is owed: a supervised `/autonomous-sdlc-harness:harness-analyze` run answering `skip` for every already-filled document (not `--yes`), with the profile applied through `npx autonomous-sdlc-harness config set layers`.
