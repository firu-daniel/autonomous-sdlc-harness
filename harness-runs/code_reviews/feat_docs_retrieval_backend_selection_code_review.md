# Code Review: feat_docs_retrieval_backend_selection

## Context

**Branch:** `feat_docs_retrieval_backend_selection`
**Date:** 2026-10-01
**Reviewed:** the whole branch diff against `dev`, 28 files. The pieces:

- **Config key.** `docs.retrievalBackend` in all four places of its contract: `cli/src/config/model.ts`, `cli/src/config/check.ts`, `schemas/harness.config.schema.json` with `schemas/negative/docs-retrieval-backend-unknown.json` wired into `validate:config:negative`, and `docs/config.md` §5.
- **Constants module.** The new owner `cli/src/retrieval/pythonBackend.ts`.
- **Launcher routing.** The run library's `hr_docs_retrieval_applies` / `hr_docs_retrieval_backend` and the routing in `cli/templates/scripts/docs-search-server.sh`, with its exit `3`.
- **`doctor` and `init`.** The three `retrieval-python-*` checks in `cli/src/doctor/checks.ts`, and `init`'s Python note in `cli/src/retrieval/setup.ts`.
- **Python service.** The remedy reverted in `docs-retrieval-service/src/harness_docs_retrieval/service.py`, and the new `docs-retrieval-service/tests/test_launcher_e2e.py`.
- **Documents.** The rewrites of `docs/retrieval.md`, `docs/cli.md`, `docs/watcher.md`, `docs/remote-execution.md`, `ARCHITECTURE.md` and the service README.

28 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**

- **Tests are present for every new unit.** The key's accepted and rejected shapes, each new `doctor` check in its not-applicable, pass and fail states, the launcher's routing and exit `3`, the key-absent `init` and `doctor` reports, and the container-gated MCP-client case are all covered. This review runs no suite; whether they pass is the Run gates phase's to establish.
- **The no-change constraints hold.** No file under `plugin/` is touched, and neither is `.mcp.json`'s template or either settings template.
- **Every new export is called.** The Pass 0 caller check found a consumer outside its defining file for each one. The constants consumed only by tests are the declared owners of shell-mirrored literals, and the tests assert those mirrors.
- **Parity.** `phases.parity` is `false`, so no parity review ran.

**What is left:**

- **Two Must Fix findings.** In both, an adopter acting on what the branch says does the wrong thing. The remote-execution documents promise a run that `doctor --remote-job`'s preflight actually stops (Finding 1). The `retrieval-python-index` remedy prints a `docker compose` command with no directory, and that command fails where `doctor` runs (Finding 2).
- **Four Should Fix findings.** `INT` forwarding in the launcher is ineffective (Finding 3). An unreadable `self-check` answer gets no remedy (Finding 4). There is an undeclared mirror of `self-check`'s text (Finding 5). A stale doc comment remains (Finding 6).
- **One Nice to Have** on the negative fixture's isolation (Finding 7).

**Pass 2:** `per_task_findings_root` (`harness-runs/task_plan_point_reviews/feat_docs_retrieval_backend_selection_task_plan/`) holds no per-unit review files, so reconciliation was a no-op.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only. The committer never touches them.

Each entry resolves to `harness-runs/code_reviews/feat_docs_retrieval_backend_selection_code_review/finding_<K>.md` through its `**Finding K**` reference. The list runs from small, safe fixes to wider ones, `cli` before the catch-all `general`. The leading `N.` is the fix order. The `K` is the finding's stable number.

1. [x] **Finding 6** — Correct `PYTHON_SERVE_SUB_COMMAND`'s doc comment: the launcher runs it as a child, never `exec`s it _(layer: cli)_
2. [x] **Finding 5** — Move `self-check`'s not-attempted pattern into `pythonBackend.ts` and declare it as a mirror _(layer: cli)_
3. [x] **Finding 2** — Name the clone's `docs-retrieval-service/` directory in `retrieval-python-index`'s compose remedy _(layer: cli)_
4. [x] **Finding 4** — Give the unreadable-`self-check` failure of `retrieval-python-dependencies` the install remedy _(layer: cli, general)_
5. [ ] **Finding 3** — Pass the launcher's `INT` on to the Python child as `TERM`, and test signal forwarding _(layer: cli, general)_
6. [ ] **Finding 7** — Reduce `docs-retrieval-backend-unknown.json` to the single enum change _(layer: general)_
7. [ ] **Finding 1** — Say in `docs/remote-execution.md` and `docs/retrieval.md` that the job's `doctor --remote-job` preflight stops a job with the Python backend selected _(layer: general)_

---

## Must Fix

### 1. The documents say a remote job with the Python backend selected still runs without `search_docs`, but the job's `doctor --remote-job` preflight fails and stops it
→ [finding_1.md](feat_docs_retrieval_backend_selection_code_review/finding_1.md)

### 2. `retrieval-python-index`'s remedy prints `docker compose up -d --wait postgres` with no directory, and in the adopter's repository, where `doctor` runs, there is no compose file
→ [finding_2.md](feat_docs_retrieval_backend_selection_code_review/finding_2.md)

---

## Should Fix

### 3. The launcher forwards `INT` to a Python child that ignores it, so an interrupt never reaches the server, and no test covers signal forwarding
→ [finding_3.md](feat_docs_retrieval_backend_selection_code_review/finding_3.md)

### 4. `retrieval-python-dependencies` fails an unreadable `self-check` answer without naming the hand step that fixes it
→ [finding_4.md](feat_docs_retrieval_backend_selection_code_review/finding_4.md)

### 5. `self-check`'s "not attempted" line is mirrored in `doctor/checks.ts`, outside the module that owns the Python backend's contract, and no header declares the mirror
→ [finding_5.md](feat_docs_retrieval_backend_selection_code_review/finding_5.md)

### 6. `PYTHON_SERVE_SUB_COMMAND`'s doc comment says the launcher `exec`s it; the launcher deliberately runs it as a child
→ [finding_6.md](feat_docs_retrieval_backend_selection_code_review/finding_6.md)

---

## Nice to Have

### 7. The new negative fixture differs from the worked configuration in three places, where its directory's README requires one
→ [finding_7.md](feat_docs_retrieval_backend_selection_code_review/finding_7.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are not fixes and do not appear in the readiness list. `phases.parity` is `false`, so there is no reference implementation to diverge from, and this section is otherwise empty.
