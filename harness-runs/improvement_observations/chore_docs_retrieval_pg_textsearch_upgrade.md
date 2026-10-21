## The plan writer reported corpus staleness: `docs-retrieval-service/` is an undescribed layer
- **category:** tooling-gap
- **evidence:** the `task-plan-writer`'s return carried a `## Corpus staleness` section with one `undescribed-layer` entry for the directory `docs-retrieval-service/`. That directory holds the Python docs-retrieval package (psycopg store, MCP/HTTP server), its pytest suite and the compose Postgres image, and it has its own toolchain (uv, ruff, mypy, pytest) behind `scripts/python-service.sh`. Only the catch-all `general` row of `harness.config.json` covers it, and `.claude/context/conventions.md` → `## The layers` does not name it. Tasks 6 and 7 of this run changed files under it as `general`-layer units.
- **cost this run:** none blocking. It owes a supervised remedy: run `/autonomous-sdlc-harness:harness-analyze` in a supervised session, answering `skip` for every already-filled document (never `--yes`), then apply the new layer with `npx autonomous-sdlc-harness config set layers`. `doctor`'s layer-drift check reports the same directory.

## Row A's branch-derived `commit_prefix` contradicts the repository's commit-message policy for story tasks
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table`, row `A`, derives `commit_prefix` from the branch name (`chore_` → `chore`), while `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for "Adding new work — a story task's commit" and reserves `chore` for the flow's own run artifacts. The orchestrator followed row A, so all 13 task commits (`ee78ff06` … `351872ef`) carry `chore:`. The committer flagged the conflict in its returns on Tasks 1, 4, 8 and 11. The fix rows (`C`, `C2.4`) read the policy's designation and committed with no prefix (`2570cd53`, `58d4ef20`, `50390e53`, `5d4f9d9e`), so this branch mixes both forms.
- **cost this run:** 13 task commits whose subject prefix the repository's own policy says they should not have.
- **hypothesis:** (guess) row A's rule predates the per-class designation the committer contract now reads for the fix rows.

## Two implementer dispatches stopped on an environment precondition and were re-dispatched after a live ruling
- **category:** flow-efficiency
- **evidence:** Task 6, dispatch #11: `pg_textsearch` v1.5.1 built on the kept compose base `pgvector/pgvector:0.8.1-pg18` (PostgreSQL 18.2) failed to load with `undefined symbol: palloc_mul`, because the build headers came from 18.6. The story's keep-the-base decision had not checked header drift. The maintainer ruled live to move the base to `0.8.7-pg18`, and #12 redid the task (`47d8f1c6`). Task 10, dispatch #20: the precondition self-check reported `FAIL packages: python 3.14.7; unresolved: sentence_transformers, torch`, because this checkout's Python environment lacked the `models` extra. The plan's preconditions name that extra, but no planning step checked it. The maintainer ran `bash scripts/python-service.sh sync --with-models`, and #21 redid the task (`5c9b9440`).
- **cost this run:** two wasted implementer dispatches and two live interruptions to the maintainer.

## An implementer's `DROP DATABASE` clean-up was refused by the auto-mode classifier
- **category:** tooling-gap
- **evidence:** during Task 7 (`52d8749c`) the implementer's clean-up `docker exec harness-docs-retrieval-postgres-1 psql -U harness -d postgres -c "DROP DATABASE pg_textsearch_upgrade_old"` was refused by the auto-mode classifier as a mass delete. It was not worked around. The scratch database `pg_textsearch_upgrade_old` is still on the compose Postgres.
- **cost this run:** a leftover scratch database the maintainer must drop by hand.

## The branch reviewer's Pass 0 sweep had no regexes to run
- **category:** tooling-gap
- **evidence:** the `branch-reviewer`'s Phase B return said its Pass 0 grep sweep "has no regexes filled in its table yet, so that half did not run". It checked the added lines by hand for host paths and `console` calls instead.
- **cost this run:** the deterministic half of the end-of-branch review did not run, and a manual check stood in for it.
