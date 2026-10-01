# harness-docs-retrieval

**Who reads this:** an operator standing this service up, and whoever compares it against the TypeScript backend. It owns how to run the package, where its weights live, which precision and model ids it runs, and the record of where the store's contract did not carry over unchanged (`## The seam, as found`).

`harness-docs-retrieval` is a second, opt-in docs-retrieval backend. It answers the same `search_docs` tool, over the same corpus, as `cli/src/retrieval/`, and keeps its index in a Postgres reached by connection string. The TypeScript implementation remains the default. **Nothing in this repository selects this backend, and an adopter's install is unchanged by it.**

It is local-only: a Postgres the operator runs, no hosted API and no key.

| Path | Holds |
|---|---|
| `src/harness_docs_retrieval/` | The package. One console entry point, `harness-docs-retrieval`, defined in `cli.py` → `SUB_COMMANDS`. |
| `tests/` | The `pytest` suite, including the parity cases that run the TypeScript code through `cli/dist`. |
| `compose.yaml` | The `postgres` and `service` stack. |
| `Dockerfile` | The service image. It carries no model weight. |
| `postgres/` | The Postgres image with `vector` (pgvector) and `pg_textsearch` built in. |

## Standing it up

Every Python command goes through `scripts/python-service.sh`, run from the repository root. Install `uv` first. Provision the environment, which lives outside the checkout:

```
bash scripts/python-service.sh sync
```

For real models, install the `models` extra (`sentence-transformers`, `torch`) instead. A plain `sync` afterwards removes it again:

```
bash scripts/python-service.sh sync --with-models
```

`run` forwards its arguments to the `harness-docs-retrieval` console script. The wrapper runs it from `docs-retrieval-service/`, so `--repo` defaults to that directory and a relative `--repo` resolves against it. Pass `--repo ..` to index this checkout.

Every sub-command except `fetch-models` reads its connection string from `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`. The value below matches the compose file's `postgres` service on its default port:

```
export HARNESS_DOCS_RETRIEVAL_DATABASE_URL=postgresql://harness:harness@127.0.0.1:5432/docs_retrieval
```

| Sub-command | Flags | What it does and prints |
|---|---|---|
| `serve-mcp` | `--repo`, `--docs-root` | Serves `search_docs` over stdio MCP. Nothing but the transport writes to stdout. |
| `serve-http` | `--repo`, `--docs-root`, `--host` (default `127.0.0.1`), `--port` (default `8080`) | Serves `POST /search` and `GET /health`. |
| `index` | `--repo`, `--docs-root` | Brings the index in line with the corpus. It prints one line, `index: <files> files, <chunks> chunks; embedded <n>, unchanged <n>, deleted <n>`, with `; rebuilt for a new embedder` appended when the embedder changed. |
| `self-check` | `--repo`, `--docs-root` | Prints one line per question, `packages`, `weights`, `index` in that order, each `ok   <question>: …` or `FAIL <question>: …`. It exits `0` only when all three are `ok`. `index` is not attempted when an earlier line failed. |
| `fetch-models` | none | Downloads both models into the weight cache. This is the only command that downloads. |

`--repo` names the repository whose `harness.config.json` is read, read-only, for `docs.root` and `layers[]` only. `--docs-root` overrides `docs.root` alone. Each sub-command runs through the wrapper, one per line:

```
bash scripts/python-service.sh run fetch-models
bash scripts/python-service.sh run self-check --repo ..
bash scripts/python-service.sh run index --repo ..
bash scripts/python-service.sh run serve-http --repo .. --host 127.0.0.1 --port 8080
bash scripts/python-service.sh run serve-mcp --repo ..
```

An anticipated failure prints one line, `harness-docs-retrieval: <message>`, on stderr and exits `1`. A missing or unknown sub-command exits `2`.

### The compose stack

From `docs-retrieval-service/`:

```
docker compose up --build
```

This builds both images, starts `postgres` with `shared_preload_libraries=pg_textsearch`, and serves HTTP on `127.0.0.1:8080` once Postgres is healthy. Both published ports bind `127.0.0.1`, and the credentials in the compose file are throwaway local values. The service container mounts two directories read-only:

| Mount | Source on the host | Override |
|---|---|---|
| `/repo` | `..` (this checkout's root) | `HARNESS_DOCS_RETRIEVAL_REPO` |
| `/models` | `${HOME}/.cache/harness-docs-retrieval/models` | `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` |

The compose default for `/models` does not read `XDG_CACHE_HOME`. Where that variable moves the cache, set `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` to the same directory. The container never downloads anything, so start the stack after `fetch-models` has run on the host. A missing cache refuses at start.

To run only the database and use the service from the host:

```
docker compose up -d --wait postgres
```

### Environment variables

| Variable | Read by | Meaning |
|---|---|---|
| `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` | the service | The connection string of the Postgres the index lives in. It is required, and the refusal message never quotes it back. |
| `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` | the service, and `compose.yaml` as the `/models` mount source | The weight cache directory. An empty value counts as unset. |
| `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` | the service | `hash-v1` or `hash-v2` selects the hash stub models. Any other non-empty value is refused. |
| `HARNESS_DOCS_RETRIEVAL_REPO` | `compose.yaml` | The host directory mounted at `/repo`. |
| `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` | tests only | The Postgres the `container`-marked tests use. When it is unset they skip loudly. `container-test` sets it. |
| `HARNESS_DOCS_RETRIEVAL_PG_PORT` | `compose.yaml` | The loopback port `postgres` publishes, default `5432`. Test-only in practice: `container-test` sets a per-checkout port. |

## Weights, precision and ids

**The cache** is `${XDG_CACHE_HOME:-$HOME/.cache}/harness-docs-retrieval/models`, or `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` when set. It is a separate cache from the Xenova ONNX one that `init` installs for the TypeScript backend. The models are the same, but the artifacts and the location are not. fp32 stores four bytes per parameter where q8 stores one, so budget disk for both caches.

**Provisioning** is an operator running `fetch-models` with the `models` extra installed. No other run downloads anything: every other load is `local_files_only`, against the revision the manifest records. `fetch-models` loads both models, runs each once, then writes `harness-docs-retrieval-models.json` into the cache. That manifest lists each model's snapshot revision and files, taken from what was actually downloaded. With `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` set, `fetch-models` refuses with exit `1` and downloads nothing, so unset it before fetching.

**The presence check runs even under the stub.** Before anything loads, every sub-command that opens the index checks that each manifest file is on disk. So a stub run still needs a fetched cache, the same way the TypeScript session checks its own cache. The tests plant a fake one.

**Precision.** Both models run at **fp32 on CPU** through `sentence-transformers`, against the TypeScript side's q8. fp32 is the normal Python path, and pinning CPU rules out GPU nondeterminism. No measured figure justifies this choice. It is a decision, and it is open to the comparison that follows.

**Ids.**

- `py-st/BAAI/bge-small-en-v1.5:fp32:cls:384:v1`
- `py-st/cross-encoder/ms-marco-MiniLM-L-6-v2:fp32:sigmoid:v1`

They are namespaced under `py-st` because nothing measured here shows the two backends' vectors are interchangeable, and a shared id would claim they are. They encode the precision, so a later comparison can attribute a relevance difference to it. Whether ids may ever be shared is that comparison's decision. The embedder id is stored in the index, and a change to it forces a rebuild.

**The stub** reuses `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` because its semantics are identical to the TypeScript side's. Its ids, vectors and scores equal the TypeScript stubs' bit for bit, which `tests/test_stubs.py` asserts against the running TypeScript code.

## The wire and its timing

The server name `harness-docs`, the tool `search_docs` and the permission string `mcp__harness-docs__search_docs` are the TypeScript side's (`src/harness_docs_retrieval/wire.py`). No file that quotes them was edited. The tool's description, input schema, `k` clamp, rendering, coverage `note: ` lines and abstention line are reproduced byte for byte.

**`POST /search`** takes a JSON body with `query`, an optional `k`, and an optional `mode`: one of `lexical`, `vector`, `fused` or `fused-rerank`, default `fused-rerank`. Any other key is refused, as the MCP tool refuses it. A successful response carries:

- `text`: byte-identical to the MCP tool's result for the same query;
- `mode`, `abstained` and `best_rerank_score`;
- `hits`: each with `ref`, `path`, `anchor`, `heading`, `snippet` and `score`;
- `notes` and `search_ms`.

A malformed body, a bad `mode` or an argument refusal answers `400 {"error": …}`. A refresh or search failure answers `500 {"error": …}`.

**`GET /health`** answers `200` with `status: "ok"` and the `embedder` and `reranker` ids, or `503` with `status: "unavailable"` and the `error`.

**Timing is exposed, never recorded.** `search_ms` in the HTTP response, and the stdio server's stderr line `harness-docs: search_ms=<ms>` (three decimals, after each call that searched), both time the library-level `search_docs` call alone. Neither includes the index refresh or the rendering.

**No query log.** This backend writes no query log and ignores `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG`, because the query log is out of scope for this port. A comparison measures it with what this backend ships instead:

- the `search_ms` exposure;
- all four `mode`s on `POST /search`;
- the `index` sub-command.

**Deliberate wire differences.** A client can tell the backends apart in these places only:

- The refresh-failure remedy names `harness-docs-retrieval self-check` in place of the CLI's `doctor`, which knows nothing of this backend. The difference is temporary: it is reverted to `server.ts`'s `npx autonomous-sdlc-harness doctor` remedy once `feat_docs_retrieval_backend_selection` makes `doctor` check this backend.
- `serverInfo.version` is this package's version, kept equal to `pyproject.toml`'s.
- stderr lines carry their own prefix. A corpus warning prints as `harness-docs: warning: <text>`, where the CLI's reporter prints `! <text>`. `index` prints `harness-docs-retrieval: warning: <text>`. The timing line has no TypeScript counterpart.

## The seam, as found

The `DocStore` contract carried over method for method. **Every SQL statement `store.ts` issues is issued unchanged**, through psycopg's `AsyncRawCursor` with native `$1` placeholders (`src/harness_docs_retrieval/store.py` → `statements`). These are the places where something did not carry over unchanged, each with its reason, taken from `store.py`'s `Departures from store.ts:` paragraph and the header of `postgres/Dockerfile`:

1. **Extensions load on the server, not the client.** PGlite loads `vector` and `pg_textsearch` through `PGlite.create`'s `extensions` option, and a real Postgres has no client-side equivalent. Both are installed in the `postgres/` image. The `CREATE EXTENSION IF NOT EXISTS` statement itself is unchanged.
2. **One server setting differs in where it comes from.** `pg_textsearch` must be in `shared_preload_libraries`. PGlite supplies that through the extension's own `setup`. Here `compose.yaml` passes `-c shared_preload_libraries=pg_textsearch`, and the image sets no server parameter. pgvector needs no preload in either.
3. **Connection by string, not by directory.** `open_postgres_store(database_url, dimensions)` replaces `openPgliteStore({ dataDir, dimensions })`. The database is the server's, so this package creates no directory. A connection failure is a one-line error with the connection string replaced by `<connection string>`, because the driver can quote a malformed one back whole. The index is therefore scoped to a database, not to a checkout. The TypeScript index lives at `<repoRoot>/<stateDir>/docs_index`, so every checkout and worktree has its own. Here, two checkouts that share one connection string share one `chunks` table, and each refresh deletes the other's chunks as gone from its corpus. Give each checkout its own database. Selecting this backend has to settle how that database is named per checkout.
4. **Extension and server versions.** pgvector is `0.8.1` on both sides, and the Postgres major is 18 on both. The server's minor is whatever the pinned `pgvector/pgvector:0.8.1-pg18` base carries. `pg_textsearch` is built from the upstream tag `v1.3.1`, chosen to match the `default_version` in the control file that PGlite's package bundles. That tag spelling was not checked against the upstream repository when the Dockerfile was written, so if the image build fails at the download, check the tag first.
5. **The bound vector text.** `store.ts` formats each value with JS `String(value)`, and `store.py` uses Python's shortest round-trip `repr`. Both parse to the same number (`1` against `1.0`, `1e-7` against `1e-07`), but the bound text is not always byte-identical.
6. **Programming errors.** Where `store.ts` throws through `internal(…)`, `store.py` raises `ValueError`.
7. **Async only, one call at a time.** `DocStore` is a `Protocol` whose methods are all coroutines with snake_case names (`readMeta` becomes `read_meta`). There is no synchronous variant, so every caller awaits inside an event loop. The store holds one async connection, which must not be used concurrently. `RetrievalSession.lock` (`service.py`) therefore serialises every use, and calls are answered one at a time.
8. **A connection that can be lost, with no recovery.** PGlite runs in-process, so the store `openPgliteStore` returns cannot lose its connection, and `serveDocs` opens it once for the server's lifetime. `open_postgres_store` holds one `psycopg.AsyncConnection` for the server's lifetime, and nothing reconnects. If that connection drops, through a Postgres restart or a network drop, every later `search_docs` call fails with `refreshing the docs index failed: …` until the server process is restarted. Selecting this backend has to settle recovery: either the store reconnects on failure, or a supervisor restarts the server.

**Where byte parity is asserted.** These four run without a container, against the TypeScript code through `cli/dist`:

- `tests/test_chunk_parity.py`: chunk keys and hashes;
- `tests/test_stubs.py`: stub vectors and scores;
- `tests/test_render_parity.py`: rendering;
- `tests/test_mcp_parity.py`: tool listing and refusals, and the stdio encoding of an outgoing message, which writes a lone surrogate as `JSON.stringify` does.

`tests/test_backend_parity_e2e.py` asserts that both servers render byte-identical `search_docs` output, with the stub models, over one corpus. A second case asks a query whose snippet ends in a lone surrogate over raw JSON-RPC lines and compares the parsed text, because the Python SDK's client cannot parse that escape from either server. It runs the TypeScript server on PGlite and this one on a real Postgres, so it needs the container gate. An engine-level divergence that case finds, such as tie order among equal scores or a different planner choice, is not a port defect to paper over. It belongs in this section.

## Testing

The suite is gate 13 in `scripts/run-gates.sh`, which grades `lint`, `typecheck` and `test` through the wrapper by exit status (`docs/development.md` → `## 5. Verifying a change`). Each leg is reported `BLOCKED`, not failed, where `uv` or the synced environment is missing. To run the legs by hand:

```
bash scripts/python-service.sh lint
bash scripts/python-service.sh typecheck
bash scripts/python-service.sh test
```

`test` forwards paths to `pytest`, relative to `docs-retrieval-service/`:

```
bash scripts/python-service.sh test tests/test_cli.py
```

The `container`-marked cases (`tests/test_store_postgres.py`, `tests/test_backend_parity_e2e.py`) skip loudly in `test`. They run against a throwaway Postgres in `container-test`, which starts only the compose `postgres` service under a per-checkout project name and port. It tears that project down with `down -v` on every exit path, and exits `4` (`SKIPPED`) when `docker` is not on `PATH`:

```
bash scripts/python-service.sh container-test
```

In the gate script, that leg is opt-in:

```
HARNESS_GATES_CONTAINERS=1 bash scripts/run-gates.sh
```

**No test needs model weights or a network.** The suite selects the hash stub and plants a fake weight cache for the presence check. Every leg runs through `uv run --frozen --no-sync`. The one exception is `container-test`'s first image build, which may reach the network.

The bridge cases run the TypeScript implementation from `cli/dist`, so build it first, from the repository root:

```
npm run build
```
