# Architecture review — iteration 0

Checked against `.claude/context/conventions.md` (the `general` layer, which every task in this plan is tagged with), `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md` and `unit_loop_core.md` → `## The test-run rule`.

What holds:
- Every target is outside `cli/` and `plugin/`, so the `general` catch-all is the correct layer for all 17 tasks. The gap where no `layers[]` row covers `docs-retrieval-service/` is already raised for `## Corpus staleness`.
- `cli/src`, `cli/templates` and `plugin/` are left untouched.
- The bridge reaches the TypeScript side only through `cli/dist` and exported helpers. Every name it reads from `cli/dist/retrieval/*`, `cli/test/helpers/fixture.mjs` and `evals/docs-retrieval/corpora.mjs` is exported today.
- `scripts/python-service.sh` sits beside the other hand-written scripts in `scripts/`.
- `scripts/run-gates.sh` is hand-written, not an `init` template.
- Inside the package, dependencies point one way: entry points → `service.py` → search/refresh/store/models.
- Each new module has its own test file.
- No `**Verification:**` bullet asks for a test run the rule forbids. Each bullet names only the unit's own created or edited test file, deferred to the story index's test-run note.

## Must Fix
1. **The `/health` probe reaches past `service.py` into the store's meta layout and retypes the store's meta key** — `task_12_plan.md`, the `**GET /health:**` bullet (`calls await session.store.read_meta("dimensions")`). This breaks `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"A responsibility that already has a home does not get a second one"*) and `## Configuration is the source of truth, and it is read at run time` (*"The shared constants have owners, and a value is imported from its owner rather than retyped"*).
   Task 7 makes `store.py` the owner of the meta-key vocabulary (`DIMENSIONS_META_KEY = "dimensions"`, `EMBEDDER_META_KEY`). Task 12's own `**Where this task stops.**` says the app holds no logic of its own and reaches the backend only through `service.py`. But the health bullet has the HTTP entry point type the store's private meta key `"dimensions"` as a literal and call a `DocStore` method directly. That gives the entry point a second copy of the store's schema knowledge. Task 12's `**Depends on:**` does not even list `store.py`. If the store's meta layout is renamed, `/health` silently reports 200 or 503 on the wrong key, and no compile error or test catches it.
   **Fix:** In `task_12_plan.md`, take the probe off the entry point.
   - **Preferred:** move it into `service.py`. Have Task 10's `RetrievalSession` gain an `async probe() -> None` that reads `store.read_meta(DIMENSIONS_META_KEY)`, with the constant imported from `store.py`. Amend `task_10_plan.md`'s session bullet and `test_service.py` to match. The `/health` bullet then calls `await session.probe()` under `session.lock`.
   - **At minimum:** have Task 12 import `DIMENSIONS_META_KEY` from `store.py` instead of typing `"dimensions"`, and add Task 7 (`store.py` → `DIMENSIONS_META_KEY`) to Task 12's `**Depends on:**`.

## Should Fix
1. **A test-database variable name is retyped inside the message that names it** — `task_1_plan.md`, the `tests/conftest.py` bullet: the skip reason `container gate: HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL is unset; …` is written as a literal, beside the `TEST_DATABASE_URL_ENV` constant the same file declares. `.claude/context/conventions.md` → `## Configuration is the source of truth…` says an environment-variable name is *"read through its constant and never retyped as a literal — including in the message that names it to a reader"*. Task 6 already applies that rule to `RETRIEVAL_STUB_ENV`. Build the reason with an f-string over `TEST_DATABASE_URL_ENV`.
2. **The testing bar's "no mocking framework" rule is not listed among the gaps this branch opens.** `task_6_plan.md`, `task_10_plan.md` and `task_13_plan.md` lean on pytest's `monkeypatch` to swap `models.load_models`, `resolve_models`, `open_postgres_store` and `fetch_models`. `.claude/context/conventions.md` → `## The testing bar` says *"There is no mocking framework, and adding one is a decision raised as a `stale-rule` entry"*. Scope register row 8 of the story index raises only the Node-only runner statement. Extend that `## Corpus staleness` item to name the monkeypatch substitution as well, so the supervised re-run settles both together.
3. **Where the seam finding and the precision decision live.** `.claude/context/conventions.md` → `### Where a new responsibility goes` routes *"a measured fact or a decision of record"* to `docs/`, *"and nowhere else"*. `task_17_plan.md` puts both into `docs-retrieval-service/README.md`. The task prompt's deliverable 10 does order exactly that README, so this does not block. Add the tension to the story index's `## Corpus staleness`, so the conventions document is amended to admit a package README as a home, or the next branch moves the record.

## Nice to Have
1. `task_10_plan.md` declares `CONFIG_FILENAME = "harness.config.json"` in `service.py`. That mirrors `cli/src/config/model.ts`'s owned `CONFIG_FILENAME` with no parity assertion. The plan already asserts every other cross-language mirror through `run_bridge("constants")` (Tasks 6, 7, 8 and 10), so a matching assertion would make this one consistent. It would mean adding `config: { CONFIG_FILENAME }` to Task 4's `constants` output.
