# Story: Move both docs-retrieval engines to `pg_textsearch` 1.5.1, handle an index the old versions built, and re-take the BM25 diagnosis's deciding figures

## Context

This branch moves both docs-retrieval backends from `pg_textsearch` 1.3.1 to 1.5.1. The TypeScript backend's engine is PGlite, and the Python backend's engine is the compose Postgres. The branch makes each store handle an index that the old versions built, and then re-takes the deciding figures of `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured` on 1.5.1, beside the 1.3.1 figures and without overwriting them. **It ships no fix.** `cli/src/retrieval/` and `docs-retrieval-service/src/` gain only the old-index handling of goal 2. No `REINDEX`, no spill and no other end-state change goes in. The route 2 fix is the next branch, `fix_docs_retrieval_bm25_index_state_typescript`, and that branch designs on the version this branch ships.

**Facts checked at planning, 2026-10-21, against the live registry and the bundles.** The implementer does not need to re-derive these. Each task that depends on one re-reads it.

- `npm view` reports `@electric-sql/pglite` `latest` = `0.5.10`. `@electric-sql/pglite-pg_textsearch@0.0.12` and `@electric-sql/pglite-pgvector@0.0.11` each declare `peerDependencies = { '@electric-sql/pglite': '0.5.10' }`. The task prompt's lead calls that "its dependency", but it is a peer. Neither package declares `engines`.
- The `dist/pg_textsearch.tar.gz` of `pglite-pg_textsearch@0.0.12` carries `pg_textsearch.control` with `default_version = '1.5.1'`. It carries `pg_textsearch--1.5.1.sql` as the only install script, plus the upgrade chain through `pg_textsearch--1.3.1--1.4.0.sql`, `pg_textsearch--1.4.0--1.5.0.sql` and `pg_textsearch--1.5.0--1.5.1.sql`.
- **`pgvector` moves too, and the prompt does not say so.** The `dist/vector.tar.gz` of `pglite-pgvector@0.0.11` carries `vector.control` with `default_version = '0.8.7'`. The installed `0.0.9` bundles `0.8.1`. `pglite-pgvector@0.0.10` peers `@electric-sql/pglite` `0.5.9`, so no `pglite-pgvector` version that pairs with PGlite 0.5.10 bundles 0.8.1. **Decision: the compose image's base stays `pgvector/pgvector:0.8.1-pg18`.** The prompt asks for one compose change, the `pg_textsearch` tag. The prompt's same-version constraint names `pg_textsearch`, not `vector`, and no measurement on this branch reads a vector score on the Python backend. Task 6 records the divergence in `docs-retrieval-service/postgres/Dockerfile` record 2 and in `docs-retrieval-service/README.md` → `## The seam, as found`, item 4, and the maintainer decides whether the base image follows. Because an old PGlite data directory's `vector` catalog reads 0.8.1, the old-index handling covers `vector` as well as `pg_textsearch`.
- **Why the old store is a committed fixture rather than built at test time.** Planning tried installing the old packages beside the new ones under npm aliases (`"pglite-pg_textsearch-0.0.10": "npm:@electric-sql/pglite-pg_textsearch@0.0.10"` and its siblings) with `npm install --package-lock-only`. npm refused: `Could not resolve dependency: peer @electric-sql/pglite@"0.5.8" from pglite-pg_textsearch-0.0.10@0.0.10`, so a lockfile carrying both cannot exist and `npm ci` (`commands.depInstall`) would break. Instead, Task 1 builds a store with the installed old packages before the bump and commits its `dumpDataDir('gzip')` archive. A planning probe under the old packages dumped an on-disk PGlite data directory to 4776761 bytes and loaded that archive back into a new on-disk data directory.
- On the old packages, `SHOW pg_textsearch.library_version` reads `1.3.1`, and `pg_available_extensions` reads `default_version` and `installed_version` `1.3.1`. That `SHOW` is how every task reads goal 1's library version.

**How the work is cut, and why the catch-all is not last.** Ship order follows dependency:

- Task 1 builds the old-store fixture, and must run while the old packages are installed.
- Task 2 bumps `cli/package.json`.
- Task 3 refreshes the workspace-root `package-lock.json` and reads the new engine on Node 22 and Node 20. The lockfile is in the `general` layer (`chore_supply_chain_nightly_audit` split it out the same way), and the store work after it needs the new packages installed. So a `general` task sits between `cli` tasks.
- Tasks 4 and 5 are the store's handling and the crossover re-take.
- Task 6 moves the compose image. Task 7 ports the handling to the Python store, and opens the old database that Task 6 left in place.
- Tasks 8–11 re-take goal 3's four figure sets, goal 4 and goal 5. Task 12 records goals 2 and 6 in `docs/retrieval.md` and Task 13 adds goal 7.

**The new results subsection.** Task 8 creates `### The deciding figures on pg_textsearch 1.5.1` in `docs/retrieval-eval-results.md`, directly before `### The recommendation for the fix branch`, so the recommendation stays last and Task 13's paragraph can cite the subsection above it. Each later measurement task adds one `####` part to it and owns only that part. Every part heading ends in `, on 1.5.1` so that no anchor collides with a 1.3.1 `###` heading. The tasks that edit a shared file run strictly in order, each `**Depends on:**` the one before it in that file.

**Decisions this plan makes, stated once for every task:**

- **The index scan is never disabled.** The probes' forced re-score under `SET enable_seqscan = off` forces the index scan, and it is the probes' own behaviour (`docs/retrieval-eval-results.md` → `### How the probe reads a score, and the setup`, **The forced re-score.**). No task adds anything else.
- **Nothing is retried, re-scored, averaged or put under a tolerance.** Every repetition is reported. A difference is reported with its size. A value that a `--compare` pair lists is a one-run value, recorded and never dropped.
- **The probes are run unchanged.** `evals/docs-retrieval/bm25-history.mjs` and `evals/docs-retrieval/bm25-refresh-rule.mjs` change in no statement and no logic. The one edit is Task 8's: the doc-comment sentence in `bm25-history.mjs` that names `pg_textsearch` 1.3.1 is amended to name the versions it ran on. The commands are `docs/retrieval-eval.md` → `### The BM25 index-state probe`, cited and never restated with changes.
- **Whether 1.5.1 changed a figure.** On `fixture-catalog`, which does not move, a 1.5.1 figure is compared value for value with its 1.3.1 counterpart. `self-docs` is a moving corpus, and this branch edits members of it. Every `self-docs` figure therefore carries the `{ files, chunks }` stamp of the runs that took it. When that stamp differs from the 1.3.1 figure's stamp, the task compares the structural outcome only (which states score alike, whether a verdict holds, whether the stray occurs) and says the counts sit at different stamps. Each task takes all its runs before it edits any document.
- **Before any run, a measurement task reads the version.** It reads `pg_textsearch.library_version` and both extensions' `extversion` on every engine it uses. If either engine does not read 1.5.1, the task stops and reports, and labels no figure 1.5.1.
- **No wall-clock figure is taken or recorded** (`harness-runs/lessons.md` → `## Evidence and measurement`). That includes any speed comparison between 1.3.1 and 1.5.1. No task runs the probe's `--reindex-cost`.
- **Captures are evidence for the implementer, never for the record.** They go under `harness-runs/scratch/`, which is gitignored, and no document points at one.
- **Upstream is the maintainer's.** No task files an issue upstream or comments on one. Task 9 may read `timescale/pg_textsearch#573` for its reproduction's shape, and records whether it did.
- **Nothing is retuned.** The abstention threshold, `evals/docs-retrieval/floor.json`, `k`, every fusion weight, `harness.config.json`, every corpus and every query set stay as they are. The generated region of `docs/retrieval-eval-results.md` is not rewritten: Task 11 writes its runs with `--out` into scratch files.
- **The test-run rule binds every task** (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`). No task runs `scripts/run-gates.sh`, `commands.test` or a test file it neither creates nor edits. `scripts/run-gates.sh` runs at the Run gates phase, and it must pass there on a machine with no Docker and no Python weights. **If gate 11 (the `fixture-catalog` floors) fails, the run stops and reports.** No floor is re-recorded on this branch, because an extension upgrade is not on `docs/retrieval-eval.md` → `## The regression floor` → **The same-commit re-record rule.**'s list. Task 11 compares its own `fixture-catalog` figures with `floor.json` by reading, so a floor breach surfaces there first.
- **Node 20.** Node 20.19.5 is keg-only at `/opt/homebrew/opt/node@20/bin`. A command runs on it with the prefix `PATH=/opt/homebrew/opt/node@20/bin:$PATH`, and Node 22 stays the default. A failure that happens only on Node 20 is recorded and does not stop the branch. The `engines` floor in `cli/package.json` is not touched.

**Top risks:**

1. **Old-index handling that passes on a toy index.** Task 1's fixture holds a spilled segment, memtable rows and a dead row. Task 4's test asserts the matching-rows result and a write on that store after the handling, on Node 22 and on Node 20.
2. **A figure labelled 1.5.1 that was taken on a 1.3.1 server.** The default compose project's image and `python-service.sh container-test`'s per-checkout image are both reused by `docker compose up` without a rebuild, so either can stay stale. Task 6 rebuilds the default project explicitly, and Tasks 8–11 each read the versions before running.
3. **A moved figure credited to `pg_textsearch` alone.** On the TypeScript backend, PGlite (0.5.8 to 0.5.10) and `vector` (0.8.1 to 0.8.7) moved with it, so Task 11 names all three moves beside every moved figure. A `self-docs` comparison across two stamps is guarded by the stamp rule above.

**Manual setup required** (before `/autonomous-sdlc-harness:branch-implement-plan`):

- Docker running, with the default compose project's `postgres` service up (`harness-docs-retrieval-postgres-1`). It was up and healthy at planning time, on the **1.3.1** image. **Nothing may rebuild that image before Task 6**: Task 6 prepares a database on the 1.3.1 server first. Tasks 6–11 need the service up, and each stops and says so if it is not. None of them installs Docker.
- The Python weight cache under `~/.cache/harness-docs-retrieval/models`, needed by Task 10's Python runs. It was present at planning time. If it is missing, Task 10 stops and says so, and never fetches weights.
- The TypeScript model cache under `~/.cache/autonomous-sdlc-harness/retrieval/models`, needed by Task 11. It was present at planning time.
- Network access for Task 3's `npm install` and `npm ci`, and for Task 6's image build, which downloads the `v1.5.1` tag from GitHub. Both were reachable at planning time.
- Node 20.19.5 at `/opt/homebrew/opt/node@20/bin` (Tasks 3, 4 and 5).

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as the sub-step bullets in the per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_docs_retrieval_pg_textsearch_upgrade/task_<K>_plan.md`. The entries are in ship order, which follows dependency (see `## Context`, **How the work is cut**).

1. [x] **Task 1** — Build the old-store fixture under the installed `pg_textsearch` 1.3.1 packages _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Bump the three PGlite packages in `cli/package.json` to the 1.5.1 set _(layer: cli)_ _(points: 5)_
3. [x] **Task 3** — Refresh `package-lock.json` and read the new PGlite engine on Node 22 and Node 20 _(layer: general)_ _(points: 10)_
4. [x] **Task 4** — Make `openPgliteStore` handle an index the old versions built, pinned by a test that opens the fixture _(layer: cli)_ _(points: 20)_
5. [ ] **Task 5** — Re-take the lexical-plan crossover in the store suite on the new engine _(layer: cli)_ _(points: 8)_
6. [ ] **Task 6** — Move the compose image to `pg_textsearch` `v1.5.1` and record what it does to a database 1.3.1 built _(layer: general)_ _(points: 15)_
7. [ ] **Task 7** — Port the old-index handling to the Python store and open the 1.3.1-built database with it _(layer: general)_ _(points: 15)_
8. [ ] **Task 8** — Re-take the states sequence and the near-tie pairs on 1.5.1, opening the new results subsection _(layer: general)_ _(points: 20)_
9. [ ] **Task 9** — Re-take the stray index-scan score on 1.5.1, and reduce it to a standalone reproduction if it survives _(layer: general)_ _(points: 20)_
10. [ ] **Task 10** — Re-take the candidate end-state rule at refresh level on 1.5.1 _(layer: general)_ _(points: 15)_
11. [ ] **Task 11** — Run the relevance eval's deterministic figures on 1.5.1 and report every figure that moved _(layer: general)_ _(points: 15)_
12. [ ] **Task 12** — Record the old-index handling and the crossover on 1.5.1 in `docs/retrieval.md` and the results subsection _(layer: general)_ _(points: 10)_
13. [ ] **Task 13** — State whether the 1.5.1 figures keep route 2, under the recommendation _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Record them in a new subsection of `## The BM25 index's state, measured`, beside the 1.3.1 figures. Do not overwrite the 1.3.1 figures. Say for each figure whether 1.5.1 changed it."* It is read together with goal 1's *"Update both records of why the tag was chosen"*, goal 2's *"State what happens to a data directory or database that 1.3.1 built"*, goal 6's *"update the band and the bullet together"* and goal 7's *"Do not rewrite the 1.3.1 recommendation"*. Together these reach every document that states the engines' extension versions, the store's open path, the crossover, or the recommendation. The out-of-scope line *"Correcting the backend comparison's paragraphs"* sets every statement in `## The Python backend against the TypeScript one` to `no-change`.

**Derivation entry — sites that state an engine's extension or PGlite version, the store's open path, the crossover, or the recommendation (command).** Re-run verbatim from the repository root:

```
git grep -nE "pg_textsearch\`? \`?1\.[0-9]|v1\.3\.1|PGlite 0\.5|0\.8\.1|63 rows|\*\*Store\.\*\*|^## The BM25 index's state, measured|^### The recommendation for the fix branch" -- '*.md' ':!harness-runs' ':!examples'
```

**Derivation entry — documents that state how the BM25 probes are launched (command).** Re-run verbatim from the repository root:

```
git grep -lE "bm25-history\.mjs|bm25-refresh-rule\.mjs" -- '*.md' ':!harness-runs'
```

**Derivation entry — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** that ledger. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when it states a fact about an engine version, the store's open path or the BM25 index's state that this branch's work makes stale. None is reached. The `## Evidence and measurement` rules govern how this branch measures, and `## Context` applies them, but none of them states such a fact.

**Closure invariant:** every site any entry above reaches appears as a row below. After implementation, the first command also reaches lines this branch adds. Each such line falls inside a row marked `change` (the new `####` parts sit inside row 3's section), or it is a line Tasks 6, 7 or 12 add to rows 1, 10 and 12.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs-retrieval-service/README.md` → `## The seam, as found`, item 4, **Extension and server versions.** | — | first command, `0.8.1` | `change` | Task 6 (the tag, why it was chosen, the `vector` divergence, and what the 1.5.1 server does with a 1.3.1-built database before any store opens it); Task 7 (what `open_postgres_store` then does to that database) |
| 2 | `docs/retrieval-eval-results.md` → `### Divergence sources, in the order checked`, item 3, **The configuration is the same on both sides.** ("`pg_textsearch` 1.3.1 on both", "PGlite 0.5.8's PostgreSQL 18.3") | — | first command, `PGlite 0\.5` | `no-change` | The backend comparison's paragraphs are out of scope, and they record what that comparison ran on. |
| 3 | `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured` (the section heading; the new `### The deciding figures on pg_textsearch 1.5.1` is added inside it) | — | first command, the section heading | `change` | Tasks 8, 9, 10, 11 and 12, each owning the `####` parts listed in rows 15–20 |
| 4 | `docs/retrieval-eval-results.md` → `### Footprint` ("the `pgvector/pgvector` `0.8.1-pg18` base it builds on") | — | first command, `0.8.1` | `no-change` | A dated record of the image that comparison measured. The base image does not change on this branch (`## Context`, the `pgvector` decision). |
| 5 | `docs/retrieval-eval-results.md` → `### How the probe reads a score, and the setup`, **The engines.** ("PGlite 0.5.8", "`pg_textsearch` `1.3.1` on both") | — | first command, `PGlite 0\.5`, `pg_textsearch\` \`1.3` | `no-change` | 1.3.1 figures, which the prompt keeps. Task 8's setup part records the 1.5.1 engines beside them. |
| 6 | `docs/retrieval-eval-results.md` → `### The stray index-scan score`, **The reproducible sequence.** and **Conclusion.** ("with `pg_textsearch` 1.3.1", "a defect in `pg_textsearch` 1.3.1 as run here") | — | first command, `pg_textsearch\` 1.3` | `no-change` | 1.3.1 figures and conclusion. Task 9 records the 1.5.1 outcome in its own part. |
| 7 | `docs/retrieval-eval-results.md` → `### The candidate end-state rule, at refresh level`, **The setup.** ("PostgreSQL 18.3 (PGlite 0.5.8)", "`pg_textsearch` `1.3.1` on both") | — | first command, `PGlite 0\.5`, `pg_textsearch\` \`1.3` | `no-change` | 1.3.1 figures. Task 10 records the 1.5.1 setup in its own part. |
| 8 | `docs/retrieval-eval-results.md` → `### The candidate end-state rule, at refresh level`, **Observation 1 — the store's plan.** ("records a crossover of 63 rows") | — | first command, `63 rows` | `no-change` | It quotes the bullet as it stood when the 1.3.1 figures were taken. Task 12 records the 1.5.1 crossover in its own part. |
| 9 | `docs/retrieval-eval-results.md` → `### The recommendation for the fix branch` | — | first command, the subsection heading | `change` | Task 13 adds one closing paragraph. The 1.3.1 recommendation's text is kept as it is. |
| 10 | `docs/retrieval.md` → `## How it fits together`, **Store.** paragraph (`openPgliteStore` / `open_postgres_store`) | — | first command, `\*\*Store\.\*\*` | `change` | Task 12 adds the paragraph **An index older extension versions built.** directly after it |
| 11 | `docs/retrieval.md` → `## How it fits together`, **Two backends.** ("**Store.**, **Server.** and **Models.** also name the Python counterpart") | — | first command, `\*\*Store\.\*\*` | `no-change` | It names the paragraph and says nothing about versions or the open path. |
| 12 | `docs/retrieval.md` → `## Still open`, the bullet **Whether the lexical arm filters to matching chunks on every index.** ("**63 rows**") | — | first command, `63 rows` | `change` | Task 12 states the crossover with the versions it was measured on, and with the new figure if Task 5 moved it |
| 13 | `docs/retrieval.md` → `## Measured, and how`, item **(b) The store.** ("Measured 2026-09-17 on PGlite 0.5.8") | — | first command, `PGlite 0\.5` | `no-change` | A dated measurement record on the versions it names. |
| 14 | `docs/retrieval-eval.md` → `### The BM25 index-state probe`, and `evals/docs-retrieval/README.md` → `## The modules`, the two probe rows | — | second command | `no-change` | The prompt re-runs the committed probes with the same commands. Neither the commands nor the modules' behaviour change. |
| 15 | `docs/retrieval-eval-results.md` → new `### The deciding figures on pg_textsearch 1.5.1`, its lead paragraph and `#### How these were taken, on 1.5.1` | — | first command, row 3's section | `change` | Task 8 |
| 16 | `docs/retrieval-eval-results.md` → new `#### The score each index state ranks by, on 1.5.1` and `#### The near-tie ordering, on 1.5.1` | — | first command, row 3's section | `change` | Task 8 |
| 17 | `docs/retrieval-eval-results.md` → new `#### The stray index-scan score, on 1.5.1` | — | first command, row 3's section | `change` | Task 9 |
| 18 | `docs/retrieval-eval-results.md` → new `#### The candidate end-state rule, at refresh level, on 1.5.1` | — | first command, row 3's section | `change` | Task 10 |
| 19 | `docs/retrieval-eval-results.md` → new `#### The relevance eval's deterministic figures, on 1.5.1` | — | first command, row 3's section | `change` | Task 11 |
| 20 | `docs/retrieval-eval-results.md` → new `#### The lexical-plan crossover, on 1.5.1` | — | first command, row 3's section | `change` | Task 12 |
