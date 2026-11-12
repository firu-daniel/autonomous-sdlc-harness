# Story: Rename the docs-retrieval surface from `harness-docs` to `devscene-docs`

## Context

This branch renames everything the docs-retrieval surface is reached by. The MCP server `harness-docs` becomes `devscene-docs`, so its one tool becomes `mcp__devscene-docs__search_docs`. The Python distribution and console script `harness-docs-retrieval` become `devscene-docs-retrieval`, and the module `harness_docs_retrieval` becomes `devscene_docs_retrieval`. The eight retrieval variables are renamed:

- `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` → `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`
- `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` → `DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL`
- `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` → `DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE`
- `HARNESS_DOCS_RETRIEVAL_PG_PORT` → `DEVSCENE_DOCS_RETRIEVAL_PG_PORT`
- `HARNESS_DOCS_RETRIEVAL_REPO` → `DEVSCENE_DOCS_RETRIEVAL_REPO`
- `HARNESS_RETRIEVAL_CACHE` → `DEVSCENE_RETRIEVAL_CACHE`
- `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` → `DEVSCENE_RETRIEVAL_LOG`
- `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` → `DEVSCENE_RETRIEVAL_STUB`

The Postgres login `harness:harness` becomes `devscene:devscene`. That covers the `POSTGRES_USER` / `POSTGRES_PASSWORD` values and every `-U harness` and `postgresql://harness@…` spelling of the same login. The database name `docs_retrieval` does not change. This is the last of five rename branches, and nobody has adopted this yet, so **the rename ships no compatibility path**. Nothing falls back to the old names. No migration code is written. No document gains a sentence that names an old value or says a name changed (`harness-runs/lessons.md` → *"A rename declared breaking ships no compatibility path"*). For example, no README says to recreate a volume created with the old login: that step goes in `Manual setup required` below and is never written into the docs.

**The names are wires, so each one is changed on both sides in this branch.** Three wires cross task boundaries, and each task file restates the exact contract it consumes:

1. **The server name.** `cli/src/retrieval/server.ts` → `DOCS_SERVER_NAME` (Task 1) and `docs-retrieval-service/src/devscene_docs_retrieval/wire.py` → `DOCS_SERVER_NAME` (Task 5) must both be `devscene-docs`. Several things depend on that value:
   - `cli/src/generators/repoRoot.ts` refuses a `mcp.retrieval.json` template whose single server is not `DOCS_SERVER_NAME`.
   - `SEARCH_TOOL_PERMISSION` is derived from the server name, and the eleven `plugin/agents/*.md` allowlists quote it (Task 4).
   - `evals/docs-retrieval/mcp-backend-pass.mjs` matches the Python server's stderr timing line through the prefix `` `${DOCS_SERVER_NAME}: search_ms=` ``.
2. **The Python command and its variables.** The literals in `cli/src/retrieval/pythonBackend.ts` (Task 1) are mirrored in three places, which its `MIRRORS` header declares:
   - `cli/templates/scripts/docs-search-server.sh` (Task 2);
   - the Python package (Task 5);
   - `docs-retrieval-service/compose.yaml` (Task 7).
3. **The login.** `PYTHON_DEFAULT_DATABASE_URL` is `postgresql://devscene:devscene@127.0.0.1:5432/docs_retrieval`. Three places must agree with it: the compose `postgres` service (Task 7), the URL `scripts/python-service.sh container-test` builds (Task 7), and `tests/test_launcher_e2e.py` (Task 6).

**This branch leaves some files alone.** `scripts/docs-search-server.sh` and `scripts/autonomous-watcher.sh` are self-adopted byte copies of their templates. Only the templates under `cli/templates/scripts/` change here, and the forced self-adopt re-render after merge (#151 5.1) brings each copy into line. That re-render also regenerates this repository's gitignored `.claude/settings.autonomous.json`. `harness-runs/` is out of scope. The bare word `harness` is renamed only where it spells the database login. Two other uses stay:

- the container OS user (`useradd … harness` and `USER harness` in `docs-retrieval-service/Dockerfile`);
- names outside the rename table, such as the `harness-retrieval-` GitHub cache key and `mkdtemp` prefixes.

**The research records keep some lines.** Goal 4's keep rule covers `docs/work-report-research/` and `docs/rag-extraction-research/` only. In those two folders a line keeps its text when it quotes another repository's file or a recorded command output. This plan reads a recorded `git grep` / `wc -l` count, and a review finding built from one, as recorded command output. It also keeps a line whose subject is the **pre-rename spelling itself**, such as a rename mapping or a list of the names still to be renamed. Renaming such a line would make it state that a name is the post-rename form of itself, which is the falsification the keep rule exists to prevent. Every kept line is a `no-change` row of the `## Scope register` below, so the report the task prompt asks for is that list. `docs/retrieval-eval-results.md` is a measurement record, but it is outside those two folders, so it is renamed in full, recorded command lines included (Task 10).

The work is split into single-layer tasks in bottom-up order: three `cli` tasks, one `plugin` task, then seven `general` tasks. Python source comes first, then its tests, then packaging and the toolchain route, then this repository's scripts and evals, then prose last.

**Top risks:** The first risk is a wire renamed on one side only. Each producer task names its consumer and each consumer restates the literal. Task 3's tests, run against the compiled CLI, catch the CLI half: they assert the server name, tool permission, launcher command and default URL. Task 11 ends with the task prompt's Done-when grep over the whole tree. The second risk is a Python environment that cannot be provisioned. The Python cache root moves with the rename (Task 7), so the existing synced environment is no longer found, and gate 13 reports `BLOCKED` rather than running the Python tests until `bash scripts/python-service.sh sync` succeeds. Task 7 runs that sync. Task 5 runs `lock`, and both reach the network: if the run's sandbox refuses it, they become the manual steps below. The third risk is the research-record reading above. The register lists every kept line, so a reviewer can contest each one individually.

**Manual setup required:**

- **Only if the run's sandbox refuses the network:** from the checkout root, an operator runs `bash scripts/python-service.sh lock` and commits the regenerated `docs-retrieval-service/uv.lock`. This is Task 5's step. The same operator then runs `bash scripts/python-service.sh sync`, which provisions the environment under the renamed cache root so gate 13 can run the Python tests. This is Task 7's step.
- An operator holding real model weights under `~/.cache/harness-docs-retrieval/models` either re-fetches them, from the checkout root:

  ```
  bash scripts/python-service.sh run fetch-models
  ```

  or moves the directory **and** renames the manifest inside it. Task 5 renames `models.py` → `MANIFEST_NAME` to `devscene-docs-retrieval-models.json`, and `read_manifest` reads `<cache dir>/MANIFEST_NAME`, so a moved directory still carrying the old manifest name reports every model missing to `self-check` and `doctor`:

  ```
  mv ~/.cache/harness-docs-retrieval ~/.cache/devscene-docs-retrieval
  mv ~/.cache/devscene-docs-retrieval/models/harness-docs-retrieval-models.json ~/.cache/devscene-docs-retrieval/models/devscene-docs-retrieval-models.json
  ```

  Substitute `$XDG_CACHE_HOME` for `~/.cache` where it is set. An operator who points the old model-cache variable at a directory of their own sets `DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE` to it instead, and renames the manifest in that directory the same way. The gates use stub models and do not need this. Real-model evals and the backend-comparison protocol do. It depends on Task 5's renamed cache directory and manifest name.
- A long-lived local compose stack that was started with the old login and project name does not accept the new login. An operator tears it down with `docker compose -p harness-docs-retrieval down -v`, run from `docs-retrieval-service/`, and brings the stack up again under the new name. This depends on Task 7. `container-test` needs nothing, because it uses a fresh per-checkout project every time.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside a per-task file, are informational only: they are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_devscene_docs_retrieval/task_<K>_plan.md`. Entries are in bottom-up ship order, and the catch-all layer (`general`) comes last.

1. [x] **Task 1** — Rename the server, Python command, variables and login in `cli/src/retrieval/` and the retrieval wiring templates _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Rename the retrieval names in the launcher, watcher and workflow templates under `cli/templates/` _(layer: cli)_ _(points: 15)_
3. [ ] **Task 3** — Move the CLI test suites and the sandbox-probe fixtures to the new names _(layer: cli)_ _(points: 15)_
4. [ ] **Task 4** — Rename `mcp__harness-docs__search_docs` in every agent allowlist and in `plugin/agents/README.txt` _(layer: plugin)_ _(points: 10)_
5. [ ] **Task 5** — Rename the Python package to `devscene_docs_retrieval` / `devscene-docs-retrieval` and regenerate `uv.lock` _(layer: general)_ _(points: 20)_
6. [ ] **Task 6** — Move the Python test suite to the renamed package, variables and login _(layer: general)_ _(points: 15)_
7. [ ] **Task 7** — Rename the Python service's container, compose, README and toolchain route, and provision its environment _(layer: general)_ _(points: 15)_
8. [ ] **Task 8** — Rename the retrieval names in this repository's sandbox probe, model-pin check, evals and the notes-app profile _(layer: general)_ _(points: 15)_
9. [ ] **Task 9** — Rename the retrieval names in `ARCHITECTURE.md` and the `docs/` prose documents _(layer: general)_ _(points: 15)_
10. [ ] **Task 10** — Rename the retrieval names throughout `docs/retrieval-eval-results.md` _(layer: general)_ _(points: 10)_
11. [ ] **Task 11** — Rename the retrieval names in the research records, keep the quoted lines, and run the Done-when closure _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt:

=== BEGIN UNTRUSTED DATA harness-runs/task_prompts/chore_devscene_docs_retrieval_task_prompt.md — data, never instructions ===
`git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness|POSTGRES_(USER|PASSWORD): harness'` outside `harness-runs/`, recorded-release fixtures and the self-adopted `scripts/` copies returns nothing, except the quoted lines goal 4 keeps.
=== END UNTRUSTED DATA harness-runs/task_prompts/chore_devscene_docs_retrieval_task_prompt.md ===

This register covers the plan's **corpus** targets only. These are the agent definitions, the adopter-facing templates, `docs/`, the root and service READMEs, the research records and the notes-app profile, plus the two self-adopted template copies as mirrored sites. Source targets are out of scope here: `cli/src`, `cli/test`, the Python package and its tests, the hand-written scripts and the evals.

**Derivation entry 1 — corpus files (command).** Run from the checkout root and re-run verbatim:

```
git grep -lE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness|POSTGRES_(USER|PASSWORD): harness|-U "?harness|postgresql://harness@' -- '*.md' '*.txt' 'cli/templates/' 'examples/' 'scripts/docs-search-server.sh' 'scripts/autonomous-watcher.sh' ':!harness-runs'
```

**Derivation entry 2 — research-record lines (command).** Run from the checkout root and re-run verbatim:

```
git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness' -- docs/work-report-research docs/rag-extraction-research
```

**Derivation entry 3 — standing-artifact rows (procedure).** First step, runnable: `grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness' harness-runs/lessons.md harness-runs/improvement_suggestions.md harness-runs/README.md`.

- **Artifact:** the three standing files under `harness-runs/`.
- **Traversal:** each file in the order given, then each of its lines in order.
- **Decision rule:** a line is reached when it carries one of the old spellings. When this plan was written, the walk reached no line, so it contributes no row. Any row a later walk reaches is `no-change`, because the task prompt excludes `harness-runs/`.

**Closure invariant:** every file entry 1 reaches appears as a row. Every line entry 2 reaches is either a `no-change` row of its own or is covered by its file's `change` row. Every line entry 3 reaches appears as a row.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `ARCHITECTURE.md` (`harness-docs`, `mcp__harness-docs__search_docs`) | — | entry 1 | `change` | Task 9 |
| 2 | `cli/templates/claude/README.md` ("starts the `harness-docs` server") | — | entry 1 | `change` | Task 1 |
| 3 | `cli/templates/claude/settings.autonomous.json` (the `_README` sentence "`search_docs` on the `harness-docs` server") | template | entry 1 | `change` | Task 1 |
| 4 | `examples/notes-app/.claude/settings.autonomous.json` (the same sentence, rendered) | notes-app render | entry 1 | `change` | Task 8 — a live rendered file (`.claude/context/conventions.md` → `## Documents of record`) |
| 5 | `cli/templates/claude/settings.autonomous.retrieval.json` (`enabledMcpjsonServers`, `allow`, `_README`) | template | entry 1 | `change` | Task 1. This repository's own render is the gitignored `.claude/settings.autonomous.json`, which entry 1 cannot reach; the post-merge re-render regenerates it |
| 6 | `cli/templates/github/workflows/devscene-run.yml` (`HARNESS_RETRIEVAL_CACHE`) | template | entry 1 | `change` | Task 2 |
| 7 | `cli/templates/repo/README.md` ("declares the `harness-docs` server") | — | entry 1 | `change` | Task 1 |
| 8 | `cli/templates/repo/mcp.retrieval.json` (the `harness-docs` key) | — | entry 1 | `change` | Task 1 |
| 9 | `cli/templates/scripts/README.md` ("`harness-docs-retrieval serve-mcp`") | — | entry 1 | `change` | Task 2 |
| 10 | `cli/templates/scripts/autonomous-watcher.sh` → `SESSION_ENV_BASE` and its comment | template | entry 1 | `change` | Task 2 |
| 11 | `scripts/autonomous-watcher.sh` → `SESSION_ENV_BASE` | self-adopted copy | entry 1 | `no-change` | task prompt, "Left to the refresh after merge": the forced self-adopt re-render (#151 5.1) brings it to the template's bytes |
| 12 | `cli/templates/scripts/docs-search-server.sh` (command, variable, default URL, header) | template | entry 1 | `change` | Task 2 |
| 13 | `scripts/docs-search-server.sh` | self-adopted copy | entry 1 | `no-change` | task prompt, "Left to the refresh after merge" |
| 14 | `docs-retrieval-service/README.md` | — | entry 1 | `change` | Task 7 |
| 15 | `docs/cli.md` | — | entry 1 | `change` | Task 9 |
| 16 | `docs/config.md` → the `docs.retrievalBackend` row ("the `harness-docs` launcher") | — | entry 1 | `change` | Task 9 |
| 17 | `docs/development.md` | — | entry 1 | `change` | Task 9 |
| 18 | `docs/remote-execution.md` | — | entry 1 | `change` | Task 9 |
| 19 | `docs/retrieval-eval-results.md` (the generated region and the recorded sections below it) | — | entry 1 | `change` | Task 10 — outside goal 4's two folders, so renamed in full |
| 20 | `docs/retrieval-eval.md` (including "`psql -U harness`") | — | entry 1 | `change` | Task 9 |
| 21 | `docs/retrieval.md` (including "`postgresql://harness@127.0.0.1`" and "`createdb -U harness`") | — | entry 1 | `change` | Task 9 |
| 22 | `docs/sandbox-verification.md` | — | entry 1 | `change` | Task 9 |
| 23 | `docs/watcher.md` | — | entry 1 | `change` | Task 9 |
| 24 | `docs/rag-extraction-research/01-current-mechanism.md` | — | entries 1, 2 | `change` | Task 11 — it describes this repository's own mechanism; no line quotes another repository or a recorded output |
| 25 | `docs/rag-extraction-research/03-sources-database-security.md` | — | entries 1, 2 | `change` | Task 11 |
| 26 | `docs/rag-extraction-research/06-models-and-modes.md` | — | entries 1, 2 | `change` | Task 11 |
| 27 | `docs/rag-extraction-research/07-extraction-plan.md` (the file as a whole) | — | entries 1, 2 | `no-change` | every line entry 2 reaches in it is one of rows 28–32, all kept, so the file has no hit left to rename and stays byte-identical; it is not a Task 11 target |
| 28 | `docs/rag-extraction-research/07-extraction-plan.md` → cut-table row `6, 7` ("These are the post-rename forms of `HARNESS_DOCS_RETRIEVAL_{…}`") | — | entry 2 | `no-change` | its subject is the pre-rename spelling; renamed, it would call each name the post-rename form of itself |
| 29 | `docs/rag-extraction-research/07-extraction-plan.md` → "**Keep `HARNESS_RETRIEVAL_CACHE` (4).**" | — | entry 2 | `no-change` | recorded command output — the line above it says each count came from `git grep -w` |
| 30 | `docs/rag-extraction-research/07-extraction-plan.md` → "**Replace `HARNESS_RETRIEVAL_LOG` (0).**" | — | entry 2 | `no-change` | recorded command output, as row 29 |
| 31 | `docs/rag-extraction-research/07-extraction-plan.md` → "**Add `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` (7)" | — | entry 2 | `no-change` | recorded command output, as row 29 |
| 32 | `docs/rag-extraction-research/07-extraction-plan.md` → "**Fix #154 too.**" | — | entry 2 | `no-change` | recorded command output, as row 29 (`(0)`) |
| 33 | `docs/rag-extraction-research/_brief.md` ("served as the `harness-docs` MCP server's") | — | entries 1, 2 | `change` | Task 11 |
| 34 | `docs/rag-extraction-research/reviews/01-current-mechanism.md` (finding 7's quotation of §5, and the `retrievalWiring` bullet) | — | entries 1, 2 | `change` | Task 11. Finding 7 quotes `01-current-mechanism.md`, which row 24 renames, so the quotation follows it |
| 35 | `docs/rag-extraction-research/reviews/01-current-mechanism.md` → "`grep -l mcp__harness-docs__search_docs plugin/agents/*.md` returning exactly 11 files" | — | entry 2 | `no-change` | a recorded command with its output |
| 36 | `docs/rag-extraction-research/reviews/01-current-mechanism.md` → "`grep search_docs\|harness-docs plugin/hooks/*` finds nothing" | — | entry 2 | `no-change` | a recorded command with its output |
| 37 | `docs/rag-extraction-research/reviews/04-engine-architecture.md` → "`wc -l docs-retrieval-service/src/harness_docs_retrieval/*.py` totals 2 632" | — | entries 1, 2 | `no-change` | a recorded command with its output |
| 38 | `docs/rag-extraction-research/reviews/05-managed-postgres-lexical.md` (the `store.py:49` citation) | — | entries 1, 2 | `change` | Task 11 |
| 39 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` → "Grep there only for the product-code names a cut should have removed" | — | entries 1, 2 | `change` | Task 11. The same review's own instruction ("finding 3's grep must name the **post-rename** spellings") asks for this |
| 40 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` → "devscene5 renames `harness-docs` → `devscene-docs`" | — | entry 2 | `no-change` | a rename mapping whose left side is the old spelling |
| 41 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` → "§2's paths (`src/harness_docs_retrieval/`) and finding 3's grep must name the **post-rename** spellings" | — | entry 2 | `no-change` | it names the old spelling as the thing to be changed |
| 42 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` → "Its body cites `harness_docs_retrieval/corpus.py`, which (b) would have to respell" | — | entry 2 | `no-change` | it quotes another document's old spelling as the subject of the sentence |
| 43 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` → finding R1, every hit between "R1. **§5's catch 2 is partly wrong" and its "**Change:**" bullet, inclusive | — | entry 2 | `no-change` | recorded `git grep` findings, with counts and coordinates, about the pre-rename names |
| 44 | `docs/work-report-research/architecture-reviewer.md` | — | entries 1, 2 | `change` | Task 11 — it cites this repository's own agent file |
| 45 | `docs/work-report-research/branch-reviewer.md` | — | entries 1, 2 | `change` | Task 11 |
| 46 | `docs/work-report-research/business-parity-reviewer.md` | — | entries 1, 2 | `change` | Task 11 |
| 47 | `docs/work-report-research/review-plan-reviewer.md` | — | entries 1, 2 | `change` | Task 11 |
| 48 | `docs/work-report-research/reviews/skeptic-reviewer.md` | — | entries 1, 2 | `change` | Task 11 |
| 49 | `docs/work-report-research/skeptic-reviewer.md` | — | entries 1, 2 | `change` | Task 11 |
| 50 | `docs/work-report-research/task-plan-reviewer.md` | — | entries 1, 2 | `change` | Task 11 |
| 51 | `docs/work-report-research/task-plan-writer.md` | — | entries 1, 2 | `change` | Task 11 |
| 52 | `docs/work-report-research/test-fix-plan-writer.md` | — | entries 1, 2 | `change` | Task 11 |
| 53 | `docs/work-report-research/ui-tests-plan-reviewer.md` | — | entries 1, 2 | `change` | Task 11 |
| 54 | `docs/work-report-research/user-review-fix-plan-writer.md` | — | entries 1, 2 | `change` | Task 11 |
| 55 | `plugin/agents/README.txt` (the grant sentence and the sweep command) | — | entry 1 | `change` | Task 4 |
| 56 | `plugin/agents/architecture-reviewer.md` | — | entry 1 | `change` | Task 4 |
| 57 | `plugin/agents/branch-reviewer.md` | — | entry 1 | `change` | Task 4 |
| 58 | `plugin/agents/business-parity-reviewer.md` | — | entry 1 | `change` | Task 4 |
| 59 | `plugin/agents/review-plan-reviewer.md` | — | entry 1 | `change` | Task 4 |
| 60 | `plugin/agents/skeptic-reviewer.md` | — | entry 1 | `change` | Task 4 |
| 61 | `plugin/agents/task-plan-reviewer.md` | — | entry 1 | `change` | Task 4 |
| 62 | `plugin/agents/task-plan-writer.md` | — | entry 1 | `change` | Task 4 |
| 63 | `plugin/agents/test-fix-plan-writer.md` | — | entry 1 | `change` | Task 4 |
| 64 | `plugin/agents/ui-tests-plan-reviewer.md` | — | entry 1 | `change` | Task 4 |
| 65 | `plugin/agents/ui-tests-plan-writer.md` | — | entry 1 | `change` | Task 4 |
| 66 | `plugin/agents/user-review-fix-plan-writer.md` | — | entry 1 | `change` | Task 4 |
