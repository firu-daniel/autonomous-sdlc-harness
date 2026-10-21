# Dispatch additions — chore_docs_retrieval_pg_textsearch_upgrade

## [A · Task 6 · general · iter 0] → layer-implementer  (#12)
- **added:** `context_notes:`
- **verbatim:** "The maintainer answered the blocker this task's previous dispatch recorded under `**Deviations from plan:**` in task_6_plan.md (pg_textsearch v1.5.1 fails to load on the kept base, PostgreSQL 18.2, with `undefined symbol: palloc_mul`). Their ruling, chosen in this session on 2026-10-21, overrides the story's keep-the-base decision: \"Move the compose base to a pgvector tag whose server is PostgreSQL 18.4 or newer, e.g. pgvector/pgvector:0.8.7-pg18 (also aligns `vector` with PGlite's bundled 0.8.7); record the move in Dockerfile records 1–2 and README item 4.\" (source: the maintainer's answer to the session's live question)"
- **why the agent could not derive it:** the ruling existed only in the session, as the maintainer's answer to a live AskUserQuestion
- **reported back by the agent:** (none)

## [A · Task 8 · general · iter 0] → layer-implementer  (#16)
- **added:** `context_notes:`
- **verbatim:** "Since Task 3's lock refresh, the three PGlite packages install under cli/node_modules/@electric-sql/*, not the repository root, so a bare `import '@electric-sql/pglite'` from harness-runs/scratch/ no longer resolves; harness-runs/scratch/pglite-engine.mjs resolves them through createRequire anchored at cli/package.json (source: the `**Deviations from plan:**` note in harness-runs/task_plans/chore_docs_retrieval_pg_textsearch_upgrade/task_3_plan.md). The compose base image moved to pgvector/pgvector:0.8.7-pg18 (PostgreSQL 18.6) on a maintainer ruling in Task 6 (source: commit 47d8f1c6 and the deviation note in task_6_plan.md)."
- **why the agent could not derive it:** both facts arose in earlier tasks' deviations and are absent from task_8_plan.md
- **reported back by the agent:** (none)

## [A · Task 9 · general · iter 0] → layer-implementer  (#18)
- **added:** `context_notes:`
- **verbatim:** "Since Task 3's lock refresh, the three PGlite packages install under cli/node_modules/@electric-sql/*, not the repository root, so a bare `import '@electric-sql/pglite'` from harness-runs/scratch/ no longer resolves; harness-runs/scratch/pglite-engine.mjs resolves them through createRequire anchored at cli/package.json (source: the `**Deviations from plan:**` note in harness-runs/task_plans/chore_docs_retrieval_pg_textsearch_upgrade/task_3_plan.md). The compose base image moved to pgvector/pgvector:0.8.7-pg18 (PostgreSQL 18.6) on a maintainer ruling in Task 6 (source: commit 47d8f1c6 and the deviation note in task_6_plan.md)."
- **why the agent could not derive it:** both facts arose in earlier tasks' deviations and are absent from task_9_plan.md
- **reported back by the agent:** (none)

## [A · Task 10 · general · iter 0] → layer-implementer  (#20)
- **added:** `context_notes:`
- **verbatim:** "Since Task 3's lock refresh, the three PGlite packages install under cli/node_modules/@electric-sql/*, not the repository root, so a bare `import '@electric-sql/pglite'` from harness-runs/scratch/ no longer resolves; harness-runs/scratch/pglite-engine.mjs resolves them through createRequire anchored at cli/package.json (source: the `**Deviations from plan:**` note in harness-runs/task_plans/chore_docs_retrieval_pg_textsearch_upgrade/task_3_plan.md). The compose base image moved to pgvector/pgvector:0.8.7-pg18 (PostgreSQL 18.6) on a maintainer ruling in Task 6 (source: commit 47d8f1c6 and the deviation note in task_6_plan.md)."
- **why the agent could not derive it:** both facts arose in earlier tasks' deviations and are absent from task_10_plan.md
- **reported back by the agent:** (none)

## [A · Task 10 · general · iter 0] → layer-implementer  (#21)
- **added:** `context_notes:`
- **verbatim:** "Since Task 3's lock refresh, the three PGlite packages install under cli/node_modules/@electric-sql/*, not the repository root, so a bare `import '@electric-sql/pglite'` from harness-runs/scratch/ no longer resolves; harness-runs/scratch/pglite-engine.mjs resolves them through createRequire anchored at cli/package.json (source: the `**Deviations from plan:**` note in harness-runs/task_plans/chore_docs_retrieval_pg_textsearch_upgrade/task_3_plan.md). The compose base image moved to pgvector/pgvector:0.8.7-pg18 (PostgreSQL 18.6) on a maintainer ruling in Task 6 (source: commit 47d8f1c6 and the deviation note in task_6_plan.md). The previous dispatch of this task stopped at the Python-environment precondition; the maintainer has since run `bash scripts/python-service.sh sync --with-models` in this session, and a bare `bash scripts/python-service.sh run self-check` now reports `ok packages` (sentence_transformers, torch resolve) and `ok weights`, but `FAIL index: the service config .../docs-retrieval-service/harness.config.json could not be read` — check whether the `--backend python` path's own self-check invocation (assertPythonBackendAvailable) passes; if it still refuses, stop and report rather than working around it (source: the orchestrator's self-check runs in this session, 2026-10-21)."
- **why the agent could not derive it:** the sync and the self-check output happened only in the session, after the previous dispatch (#20) returned its precondition blocker
- **reported back by the agent:** the `--backend python` path's own check passed; the bare self-check's `FAIL index` comes from running it without `--repo`

## [A · Task 11 · general · iter 0] → layer-implementer  (#23)
- **added:** `context_notes:`
- **verbatim:** "Since Task 3's lock refresh, the three PGlite packages install under cli/node_modules/@electric-sql/*, not the repository root, so a bare `import '@electric-sql/pglite'` from harness-runs/scratch/ no longer resolves; harness-runs/scratch/pglite-engine.mjs resolves them through createRequire anchored at cli/package.json (source: the `**Deviations from plan:**` note in harness-runs/task_plans/chore_docs_retrieval_pg_textsearch_upgrade/task_3_plan.md). The compose base image moved to pgvector/pgvector:0.8.7-pg18 (PostgreSQL 18.6) on a maintainer ruling in Task 6 (source: commit 47d8f1c6 and the deviation note in task_6_plan.md). The Python environment now has the `models` extra synced (the maintainer ran `bash scripts/python-service.sh sync --with-models` in this session on 2026-10-21); the `--backend python` path's own availability check passed in Task 10, while a bare `self-check` without `--repo` reports a spurious `FAIL index` (source: the `**Deviations from plan:**` note in task_10_plan.md)."
- **why the agent could not derive it:** the earlier tasks' deviations and the in-session sync are absent from task_11_plan.md
- **reported back by the agent:** (none)

## [A · Task 13 · general · iter 0] → layer-implementer  (#27)
- **added:** `context_notes:`
- **verbatim:** "Task 12's new part `#### The lexical-plan crossover, on 1.5.1` in docs/retrieval-eval-results.md ends with a sentence that takes the next branch's fix as ending refreshes in the state `REINDEX INDEX chunks_bm25` leaves (route 2); if this task's statement changes how route 2 is framed, check that sentence still agrees (source: Task 12 implementer's report, commit f9950f3e)."
- **why the agent could not derive it:** the coupling was raised only in Task 12's return to the orchestrator
- **reported back by the agent:** the sentence still agrees; its "ends refreshes" wording reads as settled rather than proposed, left unedited as outside the task's target
