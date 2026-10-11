# Code Review: chore_supply_chain_nightly_audit

## Context

**Branch:** `chore_supply_chain_nightly_audit`
**Date:** 2026-10-11
**Reviewed:** the whole branch diff against `dev` (19 files, +950/−406). It covers:
- the MCP SDK peer and dev floor raised to `^1.31.0` (Task 1);
- the CLI model pins in `cli/src/retrieval/models.ts`, with the fixture and test updates (Task 2);
- the lock refresh (Task 3);
- `schemas/validate.mjs` replacing `ajv-cli` (Task 4), and `js-yaml` 4 with `yaml.load` (Task 5);
- the Python model pins and the manifest-at-pin rule in `models.py`, with its tests (Task 6);
- the zizmor fixes to `release-npm.yml` and `publish-main.yml` (Task 7);
- `--zizmor-online` in `scripts/check-rendered-workflows.mjs` (Task 8), and `scripts/check-model-revisions.mjs` (Task 9);
- `.github/workflows/supply-chain.yml` (Task 10);
- `docs/development.md` gates 3 and 14 and the new §8 (Tasks 11–13);
- `docs/retrieval.md`, the service README and the `ROADMAP.md` row (Task 14).

19 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** This review ran no test suite; the Run gates phase owns that. The tests that ship with the changed code are present and match the new contract:
- `cli/test/docs-retrieval.test.mjs` case (h) asserts the `<model id>/<revision>/<file>` layout.
- `cli/test/helpers/fixture.mjs` plants at the pinned revision.
- `docs-retrieval-service/tests/test_models.py` adds the stale-manifest and pin-shape cases.

**Checked by hand, all consistent:**
- **The lock.** `package-lock.json` resolves `@modelcontextprotocol/sdk` 1.32.1, `sharp` 0.35.5, `fast-uri` 3.1.8, `ajv` 8.20.0, `js-yaml` 4.3.2 and `argparse` 2.0.1. No `ajv-cli`, `fast-json-patch`, `sprintf-js` or `brace-expansion` entry is left.
- **The action pins.** Every action sha in `supply-chain.yml` is the commit its version comment's tag names, checked with `gh api repos/<owner>/<repo>/git/ref/tags/<tag>` for `actions/checkout` v5.1.0, `actions/setup-node` v7.0.0 and `astral-sh/setup-uv` v10.3.0.
- **The uv flags.** `uv audit --preview-features audit-command` under uv 0.12.23 accepts both `--frozen` and the `--ignore-until-fixed` that §8 documents.
- **The validator.** It keeps `ajv-cli` 5's draft-07 default, its no-formats behaviour and its message and exit-code table.
- **Re-fetching a moved cache.** `retrieval/setup.ts` re-fetches when `modelFilesPresent` reports missing, so `docs/retrieval.md`'s "the next `init` re-fetches them" holds.
- **Leftover references.** No `ajv test`, `ajv validate` or `safeLoad` is left outside `.claude/context/conventions.md`. That document's row *A negative schema fixture* is a conventions document, which no fix may target. The plan routes it through the writer's `## Corpus staleness` return, not through this review.

**Pass 0.** The grep-sweep regex list is unfilled, so half (a) found nothing.

Half (b), the new-export caller check, covered every layer path:
- `MODEL_REVISIONS` is consumed by `scripts/check-model-revisions.mjs`.
- `EMBEDDING_REVISION` and `RERANK_REVISION` are wired into `loadModels` in their defining module.
- Nothing new is left without a caller.

`phases.parity` is `false`, so no parity cross-check ran. Pass 2 reconciled no per-unit findings, because the per-unit findings root holds no review files.

**Findings.** Two findings remain, both Should Fix and both prose: the §8 record's run-scoped wording, and an incomplete code comment.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside per-finding files, are informational only, and the committer never touches them.

Each entry resolves to `harness-runs/code_reviews/chore_supply_chain_nightly_audit_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable number.

1. [x] **Finding 2** — Name all four parsed lines, and the parsing script, in the `models.py` pin comment _(layer: general)_
2. [ ] **Finding 1** — Remove run-internal pointers and run-transient state from `docs/development.md` §8's final-tree record _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `docs/development.md` §8's final-tree record points into this run's own artifacts and records run-transient state
→ [finding_1.md](chore_supply_chain_nightly_audit_code_review/finding_1.md)

### 2. The `models.py` comment says the drift check parses "these two lines", but it also parses the two `_MODEL` lines
→ [finding_2.md](chore_supply_chain_nightly_audit_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no divergence call-outs.
