### Task 12 — Record what shipped under the recommendation, and the probe paragraph's post-fix reading

**Goal:** Close the diagnosis's record (task prompt, goal 5, its third bullet: *"the diagnosis section's recommendation, with a line saying what shipped"*). Then add to the probe documentation the one sentence the fix made necessary: what a TypeScript `before` reading now is.

**Depends on:**

- **Task 10**, the last writer of `docs/retrieval-eval-results.md` → `### Route 2 on the fix branch`, whose `#### The shipped end state at refresh level` records the shipped code read at refresh level: every TypeScript `before` reading against `reference-reindex`. Task 10 also restated `evals/docs-retrieval/bm25-refresh-rule.mjs`'s header: on TypeScript the shipped refresh issues `END_STATE_STATEMENTS`, so `before` readings there are the shipped end state.
- **Task 3**, the previous editor of `docs/retrieval-eval.md` → `### The BM25 index-state probe`, which documents `--end-state` and the ad-hoc corpus flags.
- **Tasks 7 and 8**: `END_STATE_STATEMENTS` in `cli/src/retrieval/store.ts`, and `refreshIndex` in `cli/src/retrieval/refresh.ts`. The line names the shipped statements as those files carry them.
- **Task 6**: `#### Route 2 on the real catalog`, the real-shape figure the design waited on.

**Where this task stops.** One line under the recommendation and one sentence in the probe paragraph. **The 1.3.1 recommendation and its 1.5.1 standing paragraph are not rewritten.** They stay as the proposal they were, and the new line follows them. Nothing else in either file changes.

### Targets

- `docs/retrieval-eval-results.md` → `### The recommendation for the fix branch`: one closing line, after **Its standing on pg_textsearch 1.5.1.**
- `docs/retrieval-eval.md` → `### The BM25 index-state probe`: one sentence in the refresh-level paragraph.

**Work:**

- [ ] **The line under the recommendation**, opening **What shipped.**:
  - route 2 shipped on the TypeScript backend, on `fix_docs_retrieval_bm25_index_state_typescript`;
  - the end state is `END_STATE_STATEMENTS`, named by their statements;
  - the detection of an index an earlier version built is the `meta` marker;
  - `lexicalSearch` drops score-`0` rows on every plan;
  - the figures are in `### Route 2 on the fix branch`, citing its real-catalog and shipped-end-state parts by heading;
  - the Python backend's store is unchanged on this branch.

  No figure is restated.
- [ ] **The probe sentence**: on the TypeScript backend, a `before` reading is the shipped end state, because the refresh issues `END_STATE_STATEMENTS` itself. On the Python backend it is still the state its own refresh leaves. Cite `### Route 2 on the fix branch` → `#### The shipped end state at refresh level`.

**Verification:**

- `git diff docs/retrieval-eval-results.md` adds lines only after **Its standing on pg_textsearch 1.5.1.** and removes none.
- The statements the line names match `cli/src/retrieval/store.ts` → `END_STATE_STATEMENTS`. Grep them.
- `git diff --stat` lists the two target files only.
