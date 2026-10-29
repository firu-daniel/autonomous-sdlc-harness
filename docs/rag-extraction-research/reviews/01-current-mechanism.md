# Review — 01-current-mechanism.md
verdict: PASS

Checked at `dev` (`2ace325d`), 2026-10-28. 31 repository citations verified against source (list at the end). Five licence claims checked on the web. No Must Fix: no wrong fact changes the verdict, and the seven claims the author asked about all hold.

## Must Fix

None.

## Should Fix

1. **The licence items marked Unconfirmed can now be settled, and one of them is a real constraint.** §7 → `### Licence and NOTICE`; Open question 9. Evidence:
   - `pg_textsearch` is under the PostgreSQL License (https://raw.githubusercontent.com/timescale/pg_textsearch/main/LICENSE);
   - pgvector is under the PostgreSQL License (https://raw.githubusercontent.com/pgvector/pgvector/master/LICENSE);
   - psycopg 3 is under LGPL-3.0 (https://raw.githubusercontent.com/psycopg/psycopg/master/LICENSE.txt);
   - the reranker model card says `apache-2.0` and names no dataset terms (https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2);
   - MS MARCO's own page says "The MS MARCO datasets are intended for non-commercial research purposes only" (https://microsoft.github.io/msmarco/).

   Change: relabel the first three as Documented, with those URLs and a note that they came from the review, not the fork's own route. Keep the reranker as a named risk, stated precisely: the weights are Apache-2.0, but their training data is non-commercial-only, and whether that reaches the weights is unsettled. Narrow Open question 9 to that one item, plus LGPL obligations if a wheel or image bundles psycopg.

2. **Gap: what a remote or managed Postgres has to provide is missing from §6.** That is a stated requirement in `_brief.md`. Evidence:
   - `docs-retrieval-service/postgres/Dockerfile:15` says pg_textsearch 1.5.1 needs server 18.4 or newer;
   - `compose.yaml` needs `shared_preload_libraries=pg_textsearch`, and pg_textsearch "refuses to load without the preload";
   - `store.py:132` runs `CREATE EXTENSION IF NOT EXISTS vector; … pg_textsearch` on every open, and `store.py:91-92` runs `ALTER EXTENSION … UPDATE`, which needs extension-owner or superuser rights.

   The §1 sequence diagram mentions the DDL, but §6 never draws the consequence: the service cannot use an arbitrary remote Postgres URL. The server needs a preload setting, 18.4 or newer, and a role allowed to create and update extensions. Change: add a §6 row ("Postgres must be ≥18.4, preload `pg_textsearch`, and grant extension create/update; not a plain connection string"), and point to fork 03 for which managed providers allow this.

3. **Wrong attribution: "The README says the service image 'is not in an adopter's path'".** The citation is `docs/retrieval-eval-results.md` → `### Footprint`. The phrase is at `docs/retrieval-eval-results.md:28246` and `docs/retrieval-eval.md:390`. `grep` finds it in no README. Change: "The eval record says…".

4. **Wrong fact: "`supply-chain.yml` … only runs `uv audit` on `uv.lock`".** `.github/workflows/supply-chain.yml` has four jobs: `npm-audit` (:47), `uv-audit` (:62), `zizmor-online` (:77) and `model-revisions` (:100). Change: "…and the only Python job in it is `uv audit` on `uv.lock`; none builds or pushes a wheel or image."

5. **Wrong count: the eval harness "imports `cli/dist` in ten modules" (§4 #14).** `grep -l "cli/dist" evals/docs-retrieval/*.mjs` returns 15 modules, each with a top-level `import … from '../../cli/dist/…'`, for example `args.mjs:29`, `results.mjs:30-31` and `check-floor.mjs:34-35`. The total of 6 066 lines is correct. Change: "fifteen modules". This makes the move cost of the eval harness higher than stated.

6. **Stale or loose path: `harness-run.yml:597-654` (§4 #7).** The file is `cli/templates/github/workflows/harness-run.yml`. The cache path appears twice, at :600 (`run` job) and :938 (`warm` job), as `cli/src/retrieval/runtime.ts:25-27` says. The range given misses the second. Change: cite the full path and `:600`, `:938`.

7. **Incomplete statement in §5, "its own `HARNESS_DOCS_RETRIEVAL_*` environment variables".** The Python service also reads `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` (`stubs.py:21`), and its own `compose.yaml` passes that variable through. §4 #6 records this; §5 contradicts it by omission. Change: add "(except the stub variable, §4 #6)".

8. **Length: about 4 780 words against a 2 000 – 4 000 target.** Cuts worth about 900 words, with no loss of evidence:
   - §1 `### Sequence`: the mermaid diagram repeats the numbered prose and the pipeline table. Drop it, or drop the prose list it duplicates (about 150 words).
   - §1 `### What comes back`: the full list of literal error strings is wire detail the seam does not turn on. Keep the four shapes (hits, abstention, note, `isError`) and cite `server.ts:82-166` for the rest (about 120 words).
   - §4 rows 11, 15, 16, 17 and 18 are "stays in the harness" or CI/test housekeeping, and §7 → `### What stays in the harness` repeats them. Fold them into one "harness CI, tests and schema keys" row (about 200 words).
   - §5 measured-facts table: rows on cold start and footprint, `pg_textsearch#573`, and the "not for your product's own search" warning are context, not seam. Keep recall/latency, the backend disagreement, single connection, single tenant and `REINDEX` (about 180 words).
   - §6 repeats §5 for reconnect, tenancy, Linux and "not published". Keep those in §6 only, with one-word cross-references in §5 (about 150 words).
   - `### Licence and NOTICE`: once Should Fix 1 is applied, it becomes four lines (about 100 words).

9. **The fork verdict is over the 3–8 sentence limit.** It is about 10 sentences plus a four-item list. Change: merge the "minimum cut" list into one sentence and drop the restated gap list, which §6 already holds.

## Nice to Have

1. §4 #3: "`init` gitignores it" cites `session.ts:53`, which is only the path. The ignore rule is `cli/src/generators/repoRoot.ts:622` (`gitignoreRetrieval`, `INDEX_DIR_NAME`). Add that citation.
2. §7 contract bullet: "`self-check`'s `ok|FAIL <question>: …` lines (`pythonBackend.ts:58`)". Line 58 is the question list. The line shape is owned by `self_check.py` → `CheckLine.render` (:40) and parsed by `parseSelfCheck`. Cite those.
3. §3 table, Serve row: `http_app.py` runs the same per-call refresh, so every `POST /search` writes to the database (`evals/docs-retrieval/python-backend.mjs:81`: "One `POST /search` includes the server's per-call refresh"). Say so where the HTTP surface is offered as the base of a product API. It bears on Open questions 3 and 7.
4. §6: the per-query refresh also re-reads a bind-mounted corpus in the container image (`compose.yaml` mounts `/repo:ro`). At large scale over a network mount, that is the cost to measure for Open question 3. One clause is enough.

## Citations verified (all hold unless listed above)

- `cli/src/config/model.ts:637` — `retrievalApplies`.
- `cli/src/generators/repoRoot.ts` → `retrievalWiring` refuses any server other than `harness-docs` (:443-447).
- `cli/templates/repo/mcp.retrieval.json` — `bash`, one `args` string, empty `env`.
- `cli/templates/claude/settings.autonomous.retrieval.json` — enablement plus allow, and the `_README` stall wording.
- `docs-search-server.sh:58-87`, `:75-87` (backend choice), `:89-122` (Python: default URL, child, signal relay, exit 3) and `:124-135` (TS `exec node $cache/retrieval/runtime/node_modules/autonomous-sdlc-harness/dist/cli.js docs serve`).
- `cli/src/retrieval/runtime.ts:14-17`, `:57-60` — `init` installs "the peers and this CLI, at its own version" into the machine-cache runtime directory. Confirms the copy-of-the-CLI claim.
- `server.ts:35-42`, `:56-69` (schema `{query, k}`, `additionalProperties: false`, annotations), `:58` (description), `:82-96`, `:137` (remedy), `:149` (`mode: 'fused-rerank'` hard-coded, so no mode), `:201-211` (queue).
- `wire.py:25-46` — the same schema and description.
- `search.ts:20-27`, `:30-33` (default 5, max 20), `:36` (240 characters), `:51-54` (0.32, `no confident match`), `:57`, `:140-150` (abstention), `:164-170`.
- `plugin/agents/README.txt:54-94`, plus `grep -l mcp__harness-docs__search_docs plugin/agents/*.md` returning exactly 11 files, all naming the tool in `tools:`.
- `plugin/hooks/hooks.json` — one `PreToolUse` entry, matcher `Bash`, six commands, no `mcp`. `grep search_docs\|harness-docs plugin/hooks/*` finds nothing, and neither does `grep -rn search_docs plugin/instructions plugin/commands`.
- `plugin/agents/task-plan-writer.md:22`, `:60`.
- `http_app.py:57-113` (`POST /search` with optional `mode`, `GET /health`), `:101-106` (raw `str(error)`).
- `Dockerfile:46`.
- `docs/retrieval.md:196` ("not published to any package index").
- `.github/workflows/` holds three files, and none builds a wheel or image.
- `service.py:83-101` — the config read raises before `docs_root` is consulted, so `--docs-root` does not avoid `harness.config.json`. `cli.py:44`, `:58` and `:64` call it for `serve-mcp`, `serve-http` and `index`.
- `service.py:13-15`, `:245`.
- `refresh.py:77-84` and `refresh.ts:83-86` — every call runs `corpus_files`, reads and chunks every file, then `list_chunk_hashes`. `service.py:241` (Python) and `server.ts:132` (TS) refresh on every call. Confirms the re-read-every-query claim.
- `corpus.py:39-52`, `:72`, `:96-134`, `:109-110`.
- `store.ts:43`, `:84`; `session.ts:37-41`, `:47`, `:53`.
- `stubs.py:21`; `queryLog.ts:53`.
- `setup.ts:46` (900 000 ms).
- `postgres/Dockerfile` — PG 18, pgvector 0.8.7, pg_textsearch v1.5.1.
- `pyproject.toml` — version 0.1.0, no `license` field.
- `NOTICE:6`, `cli/NOTICE:6` (section 4(d)).
- `schemas/harness.config.schema.json:10-11`, `:279-288`.
- `scripts/run-gates.sh:227` (gate 13); `supply-chain.yml:74`, `:100-114`.
- `docs/retrieval.md:15`, `:17`, `:31`, `:54`, `:71-73`, `:88`, `:140`, `:159`, `:168`, `:170`, `:171`, `:185-200`, `:235-250`, `:262`, `:268`, `:269`, `:288`, `:296`.
- `docs/retrieval-eval-results.md:4607`, `:4610` (0.909 / 0.795; 1.7 ms / 1099.7 ms), and every cited `##`/`###` heading exists.
- `docs-retrieval-service/README.md:7`, `:97`, `:127-133`, `:146`, `:150`, `:151`, `:153`, `:155-163`.
- `cli/test/` — five `docs-retrieval*.test.mjs` files, plus the two named.
- `doctor` — six checks (`checks.ts:5767-5978`).
