# Skeptic Review: feat_docs_retrieval_backend_selection

## Context

**Branch:** `feat_docs_retrieval_backend_selection`
**Date:** 2026-10-01
**Reviewed:** the whole branch diff against `dev`, 28 files, read adversarially:

- the launcher routing in `docs-search-server.sh` and its run-library readers;
- the three `retrieval-python-*` `doctor` checks and the not-applicable switch on the TypeScript three;
- `init`'s Python note;
- the config key in all four places;
- the Python service's remedy revert and the launcher end-to-end test;
- the rewritten documents.

36 run-artifact files excluded from the reviewed diff. De-duplicated against `harness-runs/code_reviews/feat_docs_retrieval_backend_selection_code_review.md` (Findings 1–7) and `harness-runs/architecture_branch_reviews/feat_docs_retrieval_backend_selection_arch_review.md` (Findings 1–3). `phases.parity` is `false`, so no parity review exists, and check 2's parity leg does not apply.

**What was verified first-hand, and holds.**

- **Check 1, wiring.** Every new path has a caller:
  - `pythonRetrievalApplies` is called from all six retrieval checks;
  - `retrievalBackend` is called from `init`;
  - `hr_docs_retrieval_applies` and `hr_docs_retrieval_backend` are called from the launcher;
  - the three Python checks share one `self-check` child.
- **Check 2, runtime address.** The default URL `postgresql://harness:harness@127.0.0.1:5432/docs_retrieval` matches `docs-retrieval-service/compose.yaml` → `postgres` on user, password, database and published loopback port. `serve-mcp`/`self-check --repo` exist in `cli.py` → `SUB_COMMANDS`.
- **Check 3, citations.** The `TODO: @claude` marker in `service.py` → `answer` is executed, and the restored text matches `server.ts` byte for byte. Every cited heading exists: `## Turning on the Python backend`, `### Its database`, `### A lost connection`, and `## Configuration is the source of truth…`.
- **Check 4, divergences.** The TypeScript three passing as not applicable under `python` is argued from the launcher's own routing, and no project precedent contradicts it.
- **Check 5, runtime.** The signal path holds. `serve_mcp` installs a `SIGTERM` handler and exits `0`, so a forwarded `TERM` ends with launcher exit `0`, and `<&0` hands the child the real stdin.

**Headline:** one net-new Should Fix, a durable README in the template tree that this branch made false and that the plan's scope register never searched. No Must Fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Make `cli/templates/scripts/README.md`'s launcher sentence name both backends _(layer: cli)_

---

## Should Fix

### 1. `cli/templates/scripts/README.md` still says the launcher always `exec`s the TypeScript runtime's `docs serve`
→ [finding_1.md](feat_docs_retrieval_backend_selection_skeptic_review/finding_1.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

- **Verified-OK: the launcher falls back to `typescript` when `harness.config.json` cannot be read (`hr_config_load` status 2, for example no `jq`).** This is a fallback between backends, which the header otherwise rules out. It is what keeps a key-absent adopter without `jq` on the pre-branch behaviour (Acceptance 1), it prints a stderr line, and `doctor`'s `jq` check fails the same machine. Not a fix.
