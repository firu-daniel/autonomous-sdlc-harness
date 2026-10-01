### Task 14 — Add the service image, the Postgres image with both extensions, and the compose file

**Goal:** Give the service its container story. `docker compose up`, run from `docs-retrieval-service/`, stands up a Postgres carrying **both** `vector` and `pg_textsearch` alongside the service, which serves HTTP from the same search module as stdio (Acceptance 3). It stays local-only: nothing is published beyond `127.0.0.1`, nothing reaches a hosted API, and **no image build and no container start downloads a model**.

**Depends on:** Task 1 (`pyproject.toml` with the `models` extra and the Linux CPU-only `torch` source; `uv.lock`), Task 5 (`HARNESS_DOCS_RETRIEVAL_MODEL_CACHE`, honoured by `model_cache_dir()`), Task 7 (`HARNESS_DOCS_RETRIEVAL_DATABASE_URL`; the store's `CREATE EXTENSION IF NOT EXISTS vector` / `pg_textsearch`) and Task 12 (`harness-docs-retrieval serve-http --host <h> --port <p> --repo <dir>`).

**This machine has no Docker.** Nothing in this task can be built or run here, so write the three files to be read and then run by hand. That run is in the story index's `Manual setup required:`. Pin every base image by tag, so a later hand run builds what this task wrote. Never make the service's start depend on a network fetch.

**Where this task stops.** The container-gated **test** run is Task 15's. It starts only the `postgres` service from this compose file (`docker compose up -d --wait postgres`), so the service name `postgres`, its health check and its loopback port are a contract with Task 15. The README's account of standing the stack up is Task 17's. Any way the Postgres here differs from PGlite is recorded in the Postgres Dockerfile's header for Task 17 to carry into `## The seam, as found`: an extension version, a preload setting, a server parameter.

### Targets

- `docs-retrieval-service/Dockerfile` (new) — the service image.
- `docs-retrieval-service/.dockerignore` (new)
- `docs-retrieval-service/postgres/Dockerfile` (new) — Postgres with `pgvector` and `pg_textsearch`.
- `docs-retrieval-service/compose.yaml` (new)

**Work:**

- [ ] **The service image** (`Dockerfile`, `.dockerignore`). Base it on a tag-pinned `python:3.12-slim`. Copy `uv` from a tag-pinned `ghcr.io/astral-sh/uv` image and run `uv sync --frozen --no-dev --extra models`, so the CPU-only `torch` comes from Task 1's lock. Run as a non-root user. Set `HF_HUB_OFFLINE=1` and `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE=/models`, which is mounted at run time and **never baked into the image**. Use `ENTRYPOINT ["harness-docs-retrieval"]` and `CMD ["serve-http", "--host", "0.0.0.0", "--port", "8080", "--repo", "/repo"]`. A header comment states what the image carries and what it deliberately does not: no weights, and no download at build or run. `.dockerignore` excludes `tests/`, every Python and tool cache, and any `.venv`.
- [ ] **The Postgres image** (`postgres/Dockerfile`). Start from a tag-pinned `pgvector/pgvector` image for one Postgres major, then build `pg_textsearch` from source at a **pinned release tag** in a build stage, keeping only the installed extension files. The header records three things for Task 17's seam section. First, the `pg_textsearch` tag chosen, and what can be read about the version `@electric-sql/pglite-pg_textsearch` 0.0.10 embeds from `node_modules/@electric-sql/pglite-pg_textsearch` (its package metadata and bundled files, read only). If that cannot be determined, say so. Second, the `pgvector` version, against `@electric-sql/pglite-pgvector` 0.0.9. Third, any server setting the extension needs that PGlite supplies through its `extensions` option, such as a `shared_preload_libraries` entry.
- [ ] **The compose file** (`compose.yaml`) has two services.
  - **`postgres`:** built from `./postgres`, with local-only credentials declared in the file (no secret, no key to manage), port `127.0.0.1:${HARNESS_DOCS_RETRIEVAL_PG_PORT:-5432}:5432` (Task 15 sets a non-default port so a developer's own Postgres never collides), a `pg_isready` health check, and any preload setting the header above names, passed as `command:` flags.
  - **`service`:** built from `.`, with `depends_on: postgres` `condition: service_healthy`, and these environment variables:
    - `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`, pointing at `postgres:5432`;
    - `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB: ${AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB:-}`, so a weightless stack can be stood up under the stub.

    Two **read-only** volumes: the corpus repository, `${HARNESS_DOCS_RETRIEVAL_REPO:-..}:/repo:ro`, which defaults to this checkout's root because the service directory is a peer of `cli/`, and the host weight cache, `${HARNESS_DOCS_RETRIEVAL_MODEL_CACHE:-${HOME}/.cache/harness-docs-retrieval/models}:/models:ro`. Port `127.0.0.1:8080:8080`. A missing host cache without the stub makes the service refuse at start with `open_session`'s one-line message, which is the designed outcome.

**Verification:**

- By reading: every `FROM` is tag-pinned; no `RUN` line fetches model weights; both published ports bind `127.0.0.1`; the service's environment carries no hosted endpoint; and the `postgres/Dockerfile` header carries its three records.
- Manual, on a machine with Docker, listed in the story index's `Manual setup required:` and not run by this unit: from `docs-retrieval-service/`, run `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1 docker compose up --build`. It stands up both services. `curl -s -X POST localhost:8080/search -H 'content-type: application/json' -d '{"query":"gates"}'` answers 200. `docker compose exec postgres psql -U <user> -c '\dx'` lists `vector` and `pg_textsearch`. And `docker compose run --rm service index` prints the `index:` summary line. A planted weight cache is needed even under the stub (Task 10's presence rule): plant it with `tests/model_cache.py`'s helper, or provision real weights with `fetch-models`.

**Deviations from plan:**

- Postgres major is 18, not left open: `@electric-sql/pglite` bundles `PostgreSQL 18.3` (`grep -rhoa "PostgreSQL 1[0-9]\.[0-9]*"` over its `dist`), so the base is `pgvector/pgvector:0.8.1-pg18` to keep the major equal to PGlite's.
- The PGlite extension versions were read from the bundled archives through a scratch probe (`harness-runs/scratch/t14_pglite_ext.py`, Python `tarfile`, read only) because `tar -tzf` was refused by the permission profile: `pg_textsearch.control` `default_version = '1.3.1'`, `vector.control` `default_version = '0.8.1'`. The `pg_textsearch` preload comes from the package's `dist/index.js` (`sharedPreloadLibraries:["pg_textsearch"]`).
- Every image tag (`ghcr.io/astral-sh/uv:0.8.22`, `python:3.12.11-slim-bookworm`, `pgvector/pgvector:0.8.1-pg18`) and the `pg_textsearch` release tag `v1.3.1` are pinned but **unverified against their registries** (no network, no Docker here; `uv --version` was refused, so the uv tag is not matched to the local uv). Evidence: reading only; the hand run in `Manual setup required:` is the first execution. `python:3.12-slim` was pinned to a patch-and-distro tag rather than the floating minor.
- The service image ends on `WORKDIR /repo` so `docker compose run --rm service index` (whose `--repo` defaults to the working directory) reads the mounted corpus; the plan's `CMD` still passes `--repo /repo`.
- The `pg_isready` health check targets `-h 127.0.0.1`: the image's init-time server listens on the Unix socket only, so a socket check could report healthy before init finishes.
- `.dockerignore` additionally excludes `postgres/`, `compose.yaml`, the Dockerfile itself, `*.egg-info`, `build/` and `dist/`.
- Manual verification (the `docker compose up --build` run, the `curl`, `\dx` and `index` checks): deferred to the hand run listed in the story index; not run by this unit.
