# Code Review: chore_devscene_docs_retrieval

## Context

**Branch:** `chore_devscene_docs_retrieval`
**Date:** 2026-11-12
**Reviewed:** the whole branch diff against the default branch `dev`. This checkout has no local `dev` ref, so the diff base is its remote-tracking form `origin/dev`. The diff covers 117 files (517 insertions, 517 deletions), in five segments:
- `cli/src/retrieval/`;
- the `cli/templates/` retrieval wiring, launcher, watcher and workflow;
- `cli/test/` with the sandbox-probe fixtures;
- the eleven `plugin/agents/` allowlists and `plugin/agents/README.txt`;
- the `general` segment: the Python package moved to `docs-retrieval-service/src/devscene_docs_retrieval/` with its tests, packaging and `uv.lock`, plus `scripts/python-service.sh`, the sandbox probe, the model-pin check, `evals/`, `ARCHITECTURE.md`, `docs/` and the research records.

21 run-artifact files excluded from the reviewed diff.

**Headline: the branch is a pure rename, and the wires agree on both sides.**
- **Mechanical check.** A word-level comparison of every changed line outside `uv.lock` found no edit beyond the task prompt's rename table and the login spellings (`-U devscene`, `POSTGRES_USER` / `POSTGRES_PASSWORD`).
- **`uv.lock`.** It moves only by the renamed package entry and its re-sorted position.
- **Server name.** `DOCS_SERVER_NAME` is `devscene-docs` in `cli/src/retrieval/server.ts` and in `wire.py`. `TIMING_LINE_PREFIX` derives from it.
- **Python command, variables and login.** These `pythonBackend.ts` literals match their declared mirrors: `cli/templates/scripts/docs-search-server.sh`, `store.py` → `DATABASE_URL_ENV` and the compose `postgres` service. The default login `devscene:devscene` matches `scripts/python-service.sh container-test`.
- **Stub and log variables.** `RETRIEVAL_STUB_ENV` and `RETRIEVAL_LOG_ENV` match `stubs.py` and the compose passthrough.
- **Watcher.** The derivation grep in the `SESSION_ENV_BASE` header of `cli/templates/scripts/autonomous-watcher.sh` re-run over the tree reproduces the renamed name it keeps.
- **No compatibility path.** No compatibility path, fallback or rename-announcing sentence was added (`harness-runs/lessons.md` → *"A rename declared breaking ships no compatibility path"*).
- **Pass 0.** The grep sweep list is still the unfilled stub, so half (a) did not run. Half (b) found no new exported symbol: every added export line is an existing constant with a new value.
- **Tests.** The branch adds no test file. It only respells existing assertions, so no unregistered test exists.
- **Parity.** Parity is off (`phases.parity: false`).
- **Pass 2.** The per-unit findings root `harness-runs/task_plan_point_reviews/chore_devscene_docs_retrieval_task_plan/` does not exist, so Pass 2 had nothing to reconcile.

**One gap remains.** The live notes-app permission profile was not re-rendered from the template it renders. It is also the one hit left by the task prompt's Done-when grep that is neither excluded nor keep-listed.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Re-render the notes-app permission profile's `harness-docs` sentence to match its template _(layer: general)_

---

## Must Fix

### 1. The live notes-app permission profile still names the `harness-docs` server its template no longer names
→ [finding_1.md](chore_devscene_docs_retrieval_code_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. This section is empty.
