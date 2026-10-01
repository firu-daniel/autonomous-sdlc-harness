### Task 17 — Write the package README, with `## The seam, as found`

**Goal:** Write the package's one document of record (deliverable 10). It covers how to stand the service up, where its weight cache lives and how to provision it, which precision and embedder id it runs and why, and a `## The seam, as found` section. That section records every place `DocStore`'s statements or contract did not carry over unchanged, each with its reason, or says in one line that everything did. That finding about the seam is what this work exists to produce.

**Depends on:** every earlier task, because this document describes what they built. It reads three durable records rather than anyone's return message:

- `docs-retrieval-service/src/harness_docs_retrieval/store.py` → the module docstring's `Departures from store.ts:` paragraph (Task 7);
- `docs-retrieval-service/postgres/Dockerfile` → its header's records of the `pg_textsearch` tag, the `pgvector` version and any server setting PGlite supplies differently (Task 14);
- `docs-retrieval-service/src/harness_docs_retrieval/models.py` → the precision and id decision in its docstring (Task 5).

**Framing constraints.** This README describes the package by what it is: a second, opt-in docs-retrieval backend that speaks the same `search_docs` wire. It does **not** present the package as serving the roadmap item **Second-runtime reference port**, which `ROADMAP.md` lists as Withdrawn, or the LangGraph port. It states as a present fact that nothing in this repository selects the backend and that an adopter's install is unchanged. It defers to no numbered roadmap item, so `docs/development.md` → `## 6` owes no row. It records **no** measured figure: no latency, no relevance number, no disk size presented as measured. A size estimate is labelled as arithmetic from the upstream parameter counts. Every command an operator runs sits in a fenced block, one command per line (the lessons ledger's fenced-command rule).

**Where this task stops.** It edits no other document. The `docs/retrieval.md` rewrite belongs to `feat_docs_retrieval_backend_selection`, by the task prompt's `## Out of scope`, and `docs/development.md` §5 is Task 16's.

### Targets

- `docs-retrieval-service/README.md` (new) — scope register row 11; bound by rows 12–14 and 16–17.

**Work:**

- [ ] **Opening and stand-up.** Who reads this and what it owns. That the TypeScript implementation stays the default. That this backend is local-only: a Postgres the operator runs, no hosted API, no key. The layout (`src/harness_docs_retrieval/`, `tests/`, `compose.yaml`, `postgres/`). Then fenced, one command per line:
  - provisioning: `bash scripts/python-service.sh sync`, and `bash scripts/python-service.sh sync --with-models` for real models;
  - the entry point through `bash scripts/python-service.sh run <sub-command> …`, with each of `serve-mcp`, `serve-http`, `index`, `self-check` and `fetch-models`, its flags (`--repo`, `--docs-root`, `--host`, `--port`) and what it prints;
  - `docker compose up --build` from `docs-retrieval-service/`, with the two read-only mounts and their override variables.

  Include a table of the service's environment variables: `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`, `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE`, `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB`, and the test-only `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` and `HARNESS_DOCS_RETRIEVAL_PG_PORT`.
- [ ] **Weights, precision and ids** (deliverable 4).
  - The cache is at `${XDG_CACHE_HOME:-$HOME/.cache}/harness-docs-retrieval/models`, separate from the Xenova ONNX cache `init` installs: same models, different artifacts, different location, so budget disk for both.
  - It is provisioned only by an operator running `fetch-models`, and no run downloads anything. Explain the manifest and that the presence check runs even under the stub.
  - It runs **fp32 on CPU**, the normal Python path, against the TypeScript side's q8. Name the ids `py-st/BAAI/bge-small-en-v1.5:fp32:cls:384:v1` and `py-st/cross-encoder/ms-marco-MiniLM-L-6-v2:fp32:sigmoid:v1`. Say they are namespaced because no measurement in this branch shows the vectors are interchangeable, that the precision is encoded so the comparison branch can attribute a relevance difference to it, and that whether ids may ever be shared is that branch's decision.
  - The stub seam reuses `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` because its semantics are identical, and its vectors and scores equal the TypeScript stubs' (`tests/test_stubs.py`).
- [ ] **The wire and its timing.** The server name, tool name and permission string are unchanged, and no file quoting them was edited. `POST /search`'s request (`query`, `k`, optional `mode`) and response fields, and `GET /health`. The timing exposure: `search_ms` in the HTTP response and the stdio line `harness-docs: search_ms=<ms>` on stderr, each timing the library-level `search_docs` call alone, excluding refresh and rendering. **No query log:** the Python backend does not write one and ignores the TypeScript side's query-log variable, because the task prompt's `## Out of scope` excludes the query log from this port. Say which seams it ships instead for the comparison branch to measure with: the `search_ms` exposure, all four `mode`s on `POST /search`, and the `index` sub-command (story index scope register row 16, the lessons ledger's measurement-seam rule). Under **Deliberate wire differences**, list where a client could tell the backends apart:
  - the refresh-failure remedy names `harness-docs-retrieval self-check` instead of the CLI's `doctor`;
  - `serverInfo.version` is this package's version;
  - stderr warning lines carry their own prefix.
- [ ] **`## The seam, as found`.** One item per departure, each with its reason, taken from the three records above: statements that did not carry over verbatim, the connection-by-string `open_postgres_store(database_url, dimensions)` in place of `openPgliteStore({ dataDir, dimensions })`, any server setting or extension-version difference, and the async-only `DocStore` methods. When `store.py` records `none` and the Dockerfile records no setting difference, say in one line that every statement carried over unchanged. State where byte parity is asserted and which cases need the container gate: `tests/test_chunk_parity.py`, `tests/test_stubs.py`, `tests/test_render_parity.py` and `tests/test_mcp_parity.py` run without a container, and `tests/test_backend_parity_e2e.py` needs it.
- [ ] **Testing.** How the suite runs: gate 13 in `scripts/run-gates.sh`, the opt-in `HARNESS_GATES_CONTAINERS=1`, and `bash scripts/python-service.sh container-test`. That no test needs weights or a network. That the bridge cases need `npm run build` first.

**Verification:**

- Every sub-command, flag, environment variable, path and id the README names is found by a grep of `docs-retrieval-service/src`, `scripts/python-service.sh` or `docs-retrieval-service/compose.yaml`. None is remembered.
- `## The seam, as found` carries an item for each entry in `store.py`'s `Departures from store.ts:` paragraph and in `postgres/Dockerfile`'s header records, or the single all-carried-over line when both record none.
- `grep -nE '[0-9]+ ?(ms|MB|GB|s)\b' docs-retrieval-service/README.md` shows no measured figure. Any size present is the labelled parameter-count estimate.
- `grep -n "Second-runtime\|LangGraph\|item [0-9]" docs-retrieval-service/README.md` finds nothing.
