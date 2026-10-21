### Task 8 — End every changing refresh, and every index the shipped code left, in the `REINDEX` state, pinned by a history test

**Goal:** Implement route 2 in the refresh (task prompt, goal 2). Every refresh that changed something, and the first `docs index` build, ends in the state `REINDEX INDEX chunks_bm25` leaves. A database the shipped code left is brought to that state on its next refresh, even an unchanged one. Pin it with a test that fails before the fix and passes after it (goal 3). Then read every `evals/docs-retrieval/floor.json` row against a fresh `fixture-catalog` run, **by reading only**. If a floored figure moved, return `blocker:` with each moved row's arithmetic and change nothing, so the maintainer decides how the same-commit re-record lands (goal 4; `## Context`, Q1).

**Depends on:** Task 7, which leaves `cli/src/retrieval/store.ts` exporting the following, and calls none of them:

- `DocStore.rebuildIndexes(): Promise<void>`, which issues `END_STATE_STATEMENTS` in order. That list is `REINDEX INDEX chunks_bm25` alone; no vector-index statement joins it on this branch (Task 5's **The decision.**).
- `INDEX_STATE_META_KEY` (`'index_state'`), `INDEX_STATE_PENDING` (`'pending'`) and `INDEX_STATE_REBUILT` (`'rebuilt'`), read and written through `DocStore.readMeta` / `writeMeta`. The open path deletes the key when it recreates `chunks`.
- `lexicalSearch` already filtering to matching rows on every plan, so ending a refresh in the `REINDEX` state is safe below the 63-row crossover.

This task calls `rebuildIndexes()` and owns when. It changes nothing in `store.ts`. If it finds it needs a store change, return `blocker:` naming it rather than editing Task 7's file.

**Where this layer stops: the floor.** `evals/docs-retrieval/floor.json` sits in the `general` layer, outside this task's `cli` path scope (`.claude/context/conventions.md` → `## The layers`; `.claude/context/cli.md` → `## What this layer owns, and what it is not`), so this task never writes it. `docs/retrieval-eval.md` → `## The regression floor` → **The same-commit re-record rule.** still binds: *"A change that legitimately moves a floor re-records it in the same commit as the change that moved it, with the reason … A floor lowered in a commit of its own … is the failure this gate exists to catch."* A moved floor therefore cannot be re-recorded by a later task's commit either. This task meets the rule by reading the floor and, when a floored figure moved, returning `blocker:` before its commit, which puts the routing decision with the maintainer (`## Context`, Q1).

### Targets

- `cli/src/retrieval/refresh.ts`: `refreshIndex`, its doc comment and the module header.
- `cli/test/docs-retrieval-refresh-end-state.test.mjs` (new).

**Work:**

- [ ] **`refreshIndex` ends in the end state.**
  - Read `INDEX_STATE_META_KEY` once, at the start.
  - Before the refresh's first write (the embedder-change `clear()`, a `deleteChunks` with keys, or an `upsertChunks`), write `INDEX_STATE_PENDING`.
  - After every write, call `store.rebuildIndexes()` if the refresh wrote anything **or** the key read anything other than `INDEX_STATE_REBUILT`, then write `INDEX_STATE_REBUILT`.
  - A refresh that writes nothing over an index already marked rebuilt issues nothing.
  - So a first build ends rebuilt; an index the shipped code built, which carries no key, is rebuilt on its next refresh, unchanged or not; and a refresh interrupted after a write leaves `pending`, which the next refresh finishes.
  - Extend the doc comment's numbered steps with this one.
  - Add the end state to the module header as part of the rule it enforces: the index's ranking state is derived from the stored rows alone, not from the history of writes that produced them. Keep the existing rule sentence.
  - `RefreshResult` keeps its shape.
- [ ] **`cli/test/docs-retrieval-refresh-end-state.test.mjs`**, whose header opens with the rule it enforces: *"after a refresh, every ranking score equals the score a fresh build of the final corpus ranks by, whatever the index's history."*
  - **The setup.** A fixture repository from `cli/test/helpers/fixture.mjs` → `createFixture` holds several Markdown documents. Each store is an on-disk PGlite `dataDir` under `os.tmpdir()`, removed in `t.after`. `refreshIndex` is called in process with a minimal retrieval config and a test-local deterministic 384-dimension `Embedder`, with no model and no stub variable.
  - **The scores.** After the store closes, the test opens the directory raw with `PGlite` and both extensions. Under `SET enable_seqscan = off`, which forces the index scan and so is allowed, it reads `SELECT key, bm25_get_current_score() … ORDER BY ${BM25_ORDER_CLAUSE} LIMIT $2` for each of at least three queries. The statement is composed from `store.ts`'s exported constants, and the test asserts the plan is the `chunks_bm25` index scan. The ranking score is `bm25_get_current_score()`, never the operator (goal 3).
  - **The reference**: a fresh refresh of the final corpus into a second directory, then `REINDEX INDEX chunks_bm25` issued raw, which is the diagnosis's `reference-reindex`.
  - **Case (a), a history of changes.** Build; then edit one document, remove another and add a third; refresh. Every query's `(key, scan)` list deep-equals the reference's **exactly**, with no tolerance (task prompt, `## Constraints`).
  - **Case (b), an index the shipped code left.** Build the state a shipped refresh would have left, with the store's own calls:
    1. Refresh the corpus plus one extra document.
    2. Call `store.deleteChunks` on that document's keys directly. That leaves dead rows and issues no end state.
    3. Delete the `INDEX_STATE_META_KEY` row from `meta`, raw, because a database the shipped code built carries none.
    4. Remove the document from the fixture, and close the store.

    Then run `refreshIndex` over the remaining corpus. Its stored keys and hashes already match, so the refresh writes nothing. The scores deep-equal the reference's.
- [ ] **Run the new file, then show it failing without the fix.**
  - Run `npm test --workspace cli -- test/docs-retrieval-refresh-end-state.test.mjs`: both cases pass.
  - Then remove the `rebuildIndexes()` call by hand, rebuild, run the same file, and record each case's failing assertion with its first differing key and both values. Restore the call.
  - Put both runs in the detail file's **Deviations from plan:** note as executed evidence.
  - If a case fails **with** the fix on a sub-`real` residual, stop and return `blocker:` with the key and both values. Never add a tolerance, a retry or a second `REINDEX` (`## Context`, the third top risk).
- [ ] **The floor, by reading only.**
  - After `npm run build`, run `fixture-catalog` fresh through `harness-runs/scratch/eval.mjs` (created as `docs/retrieval-eval.md` → `## How to run it` gives it), with `--repeat 1`, `--data-dir harness-runs/scratch/fix-bm25/t8-fixture-catalog` into a new directory, and `--out` to a scratch file holding only the two markers. That scratch output is a measurement under the gitignored `harness-runs/scratch/`, not a committed edit.
  - For each `floor.json` row, read this run's figure against the fresh `fixture-catalog` run of Task 4's `#### The relevance eval's deterministic figures, before the fix`.
  - **Where a floored figure moved** so that the same-commit rule requires a re-record, change nothing: no edit to `floor.json`, and no edit anywhere outside this task's `### Targets`. Return `blocker:` naming each moved row (`corpus`, `arm`, `metric`), its current `value`, Task 4's figure, this run's figure, and the re-record arithmetic: this run's figure, minus 0.05, truncated down to two decimals (`## The regression floor` → **The margin, and why there is one.**). Add the reason line the re-recording commit would carry: `Re-record fixture-catalog floors: route 2's REINDEX end state puts the 41-chunk corpus on the filtered Seq Scan plan, moving <arm/metric list> (docs/retrieval-eval.md → The regression floor)`.
  - **Where no floored figure moved**, return normally and state, per row, that the figure is unchanged.
  - Never run `evals/docs-retrieval/check-floor.mjs`, which is a gate.
- [ ] **No other change.** `cli/src/retrieval/session.ts` reaches the end state through `refreshIndex` unchanged. Abstention, `k`, `ARM_CANDIDATES` and the fusion constants stay as they are.

**Verification:**

- `npm test --workspace cli -- test/docs-retrieval-refresh-end-state.test.mjs` passes with the fix. Both cases fail with the `rebuildIndexes()` call removed, and the failures are recorded.
- `bash scripts/typecheck.sh` passes.
- The return states each `floor.json` row's reading against Task 4's figure. If any floored figure moved, the return is a `blocker:` carrying every moved row's arithmetic (measured figure, minus 0.05, truncated), and the working tree holds no edit to `floor.json`.
- `git diff --stat` lists `cli/src/retrieval/refresh.ts` and the new test file only, and never `evals/docs-retrieval/floor.json`.
