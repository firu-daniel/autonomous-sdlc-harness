# Code Review: fix_docs_retrieval_symlink_corpus_escape

## Context

**Branch:** `fix_docs_retrieval_symlink_corpus_escape`
**Date:** 2026-10-29
**Reviewed:** the whole branch diff against the default branch `dev`. No local `dev` ref exists in this checkout, so the diff base was `origin/dev`. The diff covers:
- Task 1: the physical inside-repository check in `cli/src/retrieval/corpus.ts` → `corpusFiles`, and its new suite `cli/test/docs-retrieval-corpus.test.mjs`.
- Task 2: the port to `docs-retrieval-service/src/harness_docs_retrieval/corpus.py` → `corpus_files`, and the rewritten and added cases in `docs-retrieval-service/tests/test_corpus.py`.
- Task 3: the `corpus-at` sub-command in `docs-retrieval-service/tests/ts_bridge.mjs`, and `test_symlinked_corpus_matches_typescript` in `docs-retrieval-service/tests/test_chunk_parity.py`.
- Task 4: the `**Corpus.**` paragraph of `docs/retrieval.md`.

7 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- **Contract.** Both backends implement the story's contract identically. Each keeps today's lexical check and adds a physical check against the repository's real root, on the `docs.root` itself, walked-file and conventions-document routes. Each keeps an in-repository link under its own lexical path. The new `docs.root file <rel> resolves outside the repository and was skipped` warning is byte-identical in both backends, is sorted by code unit after the walk, and comes before every conventions warning. A real-path lookup that fails falls back the same way in both: a walked file is dropped silently, and a conventions document takes `… is missing and was skipped`.
- **Scope.** `cli/src/core/paths.ts` → `insideRepo` is unchanged, as planned. Both module headers record the enumeration-time residual. The `inside_repo` docstring now points to the physical check that follows it.
- **Tests.** Every accompanying test the task prompt asks for is present: one per backend for each route, plus the cross-backend parity case over real and alias roots. The old Python case that asserted the escape was rewritten, not left failing. The new TypeScript suite builds its fixtures under the system temp directory, opens with the rule it enforces, and spreads no `process.env`. Whether the tests pass is for the Run gates phase to establish; this review runs no suite.
- **Mechanical checks.** The new-exported-symbol caller check finds no new production export. The added helpers are module-private, and `corpusAt` is wired into the bridge's `answer` switch and called by the parity case. Half (a) of the Pass 0 grep sweep did not run: the sweep table has no regexes filled in, so it is disabled. A spot sweep of the added lines for console/print calls found nothing.
- **Parity.** `phases.parity` is `false`, so no reference-implementation parity review applies.

One Nice to Have is left.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Name the corpus files-and-warnings comparison in the README's `test_chunk_parity.py` byte-parity bullet _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

_None._

---

## Nice to Have

### 1. The Python package README's byte-parity list says `test_chunk_parity.py` covers only chunk keys and hashes
→ [finding_1.md](fix_docs_retrieval_symlink_corpus_escape_code_review/finding_1.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section is empty.
