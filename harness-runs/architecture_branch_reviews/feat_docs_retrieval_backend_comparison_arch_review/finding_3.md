### 3. `python-backend.mjs` states an eval-wide boundary that `vector-agreement.mjs` crosses

**Severity:** Should Fix. **Layer:** general.

**Site.**

- `evals/docs-retrieval/python-backend.mjs` → module header, the sentence *"The rule this module exists to enforce: the eval reaches the Python backend only through the package's own entry points, `bash scripts/python-service.sh run <sub-command>`"*.
- `evals/docs-retrieval/vector-agreement.mjs` → `pythonVectors` and `psql`. They read the Python index's `chunks` and `meta` tables directly with `docker compose exec -T postgres psql` (`ROWS_QUERY`, and `EMBEDDER_META_KEY` copied from `docs-retrieval-service/src/harness_docs_retrieval/store.py`).

**Problem.** The boundary rule is written as a rule for *the eval*, not for one module. `vector-agreement.mjs` goes around it: it reads the Python package's storage schema (table names, column names, the meta key) directly instead of using an entry point of the package.

`vector-agreement.mjs`'s own header gives the reason. No entry point exposes stored vectors, and the plan forbids changing `docs-retrieval-service/` beyond its README. So the read-back is a reasonable choice for this branch. The problem is the stated boundary: it no longer matches the code, and the one exception to it is declared only in the module that takes it.

Under `.claude/context/conventions.md` → `### Where a new responsibility goes`, the boundary should have one statement, held by the module that owns the route. A reader who trusts `python-backend.mjs`'s header would not expect a second route into the Python index, and would not know the eval depends on `store.py`'s schema.

Graded Should Fix. The rule being contradicted is a module header in the `general` layer, not a conventions-document rule.

**Fix.** Narrow the rule in `evals/docs-retrieval/python-backend.mjs`'s header so that it states the one exception and names who takes it. For example, change the rule sentence to: *"…only through the package's own entry points, `bash scripts/python-service.sh run <sub-command>` — with one stated exception: `evals/docs-retrieval/vector-agreement.mjs` reads stored document vectors back from the compose database through `psql`, because no entry point exposes them, and it depends on `store.py`'s `chunks` and `meta` schema in doing so."* Change no code. If Finding 2 lands first, also say in the same sentence that this module owns `COMPOSE_DIR` and `POSTGRES_SERVICE`, which that read-back route uses.
