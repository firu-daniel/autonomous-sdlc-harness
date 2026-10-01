# Skeptic Review: feat_docs_retrieval_python_backend

## Context

**Branch:** `feat_docs_retrieval_python_backend`
**Date:** 2026-10-01
**Reviewed:** the whole branch diff against `dev` (51 files): the new `docs-retrieval-service/` package, its tests, images, compose file and README; `scripts/python-service.sh`; gate 13 in `scripts/run-gates.sh`; `docs/development.md` → `## 5. Verifying a change`; and `.gitignore`. 29 run-artifact files excluded from the reviewed diff.

**De-duplicated against** `harness-runs/code_reviews/feat_docs_retrieval_python_backend_code_review.md` and its four findings, all four already applied. No branch-level parity review exists (`phases.parity: false`). The only architecture review is the plan-time `harness-runs/architecture_reviews/feat_docs_retrieval_python_backend/review_0.md`. Lessons-ledger entries are out of scope.

**Adversarial checks run.**
- **Check 1 (wiring).** Every sub-command in `cli.py` → `SUB_COMMANDS` reaches its module. Both entry points answer through `service.answer`. `/health` reaches the store only through `RetrievalSession.probe`. `fetch_models` writes the manifest that `model_files_present` and `_manifest_revision` read. Gate 13's four legs are called from `run-gates.sh`. The e2e case starts both servers with `hash-v1`, and its TypeScript side gets `hash-v1` from `cli/test/helpers/fixture.mjs` → `retrievalEnv`.
- **Check 2.** The parity leg is inert. For the runtime-address leg, I composed the compose `service` URL (`postgresql://harness:harness@postgres:5432/docs_retrieval`) against the `postgres` service environment. I also checked the `/models` mount default against `model_cache_dir`'s default, and found the locked `torch 2.14.1+cpu` entry carries `manylinux_2_28_aarch64` and `x86_64` wheels. All three hold.
- **Check 3.** Every cited source I opened resolves and says what the code claims: `docs/retrieval.md` → `## Measured, and how` item (b), `postgres/Dockerfile` header record 3, `search.ts` → `ABSTAIN_SCORE_THRESHOLD`, `runtime.ts` → `unresolvedRetrievalPeers`, `repoPaths.ts` → `normalizeRepoDir` and `paths.ts` → `insideRepo`. The exceptions are plan-unit pointers in durable code, and one of them makes a false claim (Finding 2).
- **Check 4.** Each stated departure in a module header traces to a reason, and none drops an intended slice. These are the stub-mode `fetch-models` success, the `self-check` remedy and the stderr prefixes.

**Headline.** No Must Fix. The port is faithful and its wiring is complete. Two Should Fix items:
- Finding 1: a failure after the connection opens (an extension the server lacks, or a missing preload) escapes as a traceback, not the one-line `ServiceError` that `errors.py` says an anticipated failure becomes.
- Finding 2: durable comments point at plan units ("Task 4", "Task 14", "Task 15"), and the Task 14 one wrongly says the compose file passes `--host` / `--port`.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Replace plan-unit pointers in durable comments with file names, and correct the claim that the compose file passes `--host` / `--port` _(layer: general)_
2. [x] **Finding 1** — Raise a post-connect setup failure in `open_postgres_store` as a one-line `ServiceError` _(layer: general)_

---

## Must Fix

None.

---

## Should Fix

### 1. A failure while preparing the database after connecting escapes as a traceback, not a one-line `ServiceError`
→ [finding_1.md](feat_docs_retrieval_python_backend_skeptic_review/finding_1.md)

### 2. Durable comments cite plan units, and one says the compose file passes flags it does not
→ [finding_2.md](feat_docs_retrieval_python_backend_skeptic_review/finding_2.md)

---

## Nice to Have

None.

---

## Intentional divergences that survived the two-leg test (call-outs, not fixes)

`phases.parity` is `false`, so there is no `<reference_impl>` to diverge from. The module headers record these departures from the TypeScript side. Each passed both legs, and none is a fix:

- `cli.py` → `_run_fetch_models` succeeds under the stub where `docs fetch-models` refuses. The README → `## Weights, precision and ids` states the consequence: a stub run still needs a fetched cache, and `fetch-models` under the stub writes no manifest.
- `service.py` → `answer`'s refresh-failure remedy names `harness-docs-retrieval self-check` in place of `doctor`.
- The stderr warning prefixes, and the `search_ms` timing line in `mcp_server.py`.
