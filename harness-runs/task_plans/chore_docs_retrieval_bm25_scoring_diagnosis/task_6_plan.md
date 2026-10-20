### Task 6 — Measure the candidate end-state rule at refresh level on both engines and record the before-fix figures

**Goal:** Meet goal 5 of the task prompt. Show whether a refreshed index, after the candidate rule, scores in the `scan` column the same as a freshly built index of the final corpus, whatever the database held before. Use the refresh-level sequence on the TypeScript backend (PGlite) and on the Python backend (the compose Postgres). Record the same runs' before-fix figures while the code is still unfixed.

**Depends on:** Task 2 and Task 5.

- **From Task 2** it uses three things:
  - the statement closing `docs/retrieval-eval-results.md` → `### The score each index state ranks by`, naming **which build forms score alike in `scan`**. That decides which reference this task's verdict is graded against;
  - whether PGlite exposes `bm25_spill_index`;
  - the procedure subsection `docs/retrieval-eval.md` → `### The BM25 index-state probe`, which this task closes with one paragraph.
- **From Task 5** it uses `evals/docs-retrieval/bm25-refresh-rule.mjs` → `runRefreshRuleLauncher`, with `--backend <typescript|python>`, `--corpus` (A), `--other` (B) and `--capture`. Per scenario, it prints:
  - the refresh line;
  - the rule's decision (`reindex`, `spill` or `none`) with its inputs (`deleted`, `rebuilt`, `embedded`, `updatedExisting`);
  - the `before` and `after` readings, each with its probe and store plan lines, diagnostics and a `forced` reading where the plan was not the index scan;
  - the differing-hit counts per column against `reference-insert`, `reference-spill` and `reference-reindex` of the final corpus variant.

  The scenarios are `fresh` (empty → A), `other-corpus` (B → A), `file-added`, `file-edited`, `file-removed` and `unchanged`. `F` is named in the output. On PGlite every `before` is labelled as read after a reopen.

**Where this task stops.** It records goal 5 and two observations its runs make. One is the Python store's own fresh build on an empty database, which is the condition the near-tie came from, for goal 4. The other is the store plan before and after the rule. It recommends nothing. The verdict on which route the fix branch takes is **Task 8's**.

### Targets

- `docs/retrieval-eval-results.md` → a new `### The candidate end-state rule, at refresh level`, after `### The stray index-scan score`.
- `docs/retrieval-eval.md` → `### The BM25 index-state probe`: one closing paragraph giving the refresh-rule launcher's two lines and its run commands, in fenced blocks.

**Work:**

- [ ] **Runs.** The preconditions are the compose `postgres` service up and the Python weight cache present, both under `## Context` → **Manual setup required**. If either is missing, stop and say so. If the Python environment refuses as not provisioned, run `bash scripts/python-service.sh sync --with-models` once, and never `fetch-models`. Use the launcher `harness-runs/scratch/bm25-refresh-rule.mjs`, which imports `runRefreshRuleLauncher` and calls it with `process.argv.slice(2)`:
  ```
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend typescript --corpus fixture-catalog --other self-docs --capture harness-runs/scratch/bm25-history/t6-typescript-fixture-catalog-1.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend typescript --corpus self-docs --other fixture-catalog --capture harness-runs/scratch/bm25-history/t6-typescript-self-docs-1.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend python --corpus fixture-catalog --other self-docs --capture harness-runs/scratch/bm25-history/t6-python-fixture-catalog-1.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend python --corpus self-docs --other fixture-catalog --capture harness-runs/scratch/bm25-history/t6-python-self-docs-1.txt
  ```
  Take the two `python` runs a second time into `…-2.txt`, and `--compare` each pair through `harness-runs/scratch/bm25-history.mjs`, so a stray is named rather than read as a rule failure. Take every run before editing either document.
- [ ] **Choose the reference by Task 2's statement, and grade.** The reference is the `reference-*` form that matches the build forms Task 2 found alike in `scan`. When Task 2 found none alike, report against all three and state that no single reference exists.
  - **The rule holds**, per backend and corpus, when every scenario's `after` reading differs from that reference in **0 `scan` hits**, apart from a value the `--compare` names as a one-run value, which is listed.
  - **Otherwise** record each failing scenario with its counts, largest difference and first differing hits.
  - **Before-fix figures:** each scenario's `before` against the same reference, in both columns.
  - Note per scenario whether the rule's statement was issuable. On PGlite without `bm25_spill_index`, the `spill` branch could not be issued, and the state is the reopen's.
- [ ] **Two observations from the same runs.**
  - (1) **The store's plan.** Give the store plan line (`LIMIT 50`) of each `before` and `after` reading on both corpora. Name every scenario whose rule statement turned the store's plan from the `chunks_bm25` index scan to anything else. `docs/retrieval.md` → `## Still open`, the lexical-arm bullet, records a 63-row crossover for an index whose statistics describe its rows. `fixture-catalog` has 41 chunks.
  - (2) **The near-tie (goal 4).** From the Python `fresh` scenario's `before` reading on `fixture-catalog`, the store's own build on an empty database, give diagnostic (f)'s inversions for `q-fc-token-lifetime` and `q-fc-unreadable-label`, with all three values. Then say whether they are gone in its `after` reading.
- [ ] **`### The candidate end-state rule, at refresh level`.**
  - **The rule**, quoted from the task prompt.
  - **The setup:** backends, server versions, corpus stamps, `F`, the scenarios, the references and which one grades the verdict. Say also why the PGlite `before` readings come after a reopen.
  - **The statements the rule issues**, verbatim.
  - **One table per backend × corpus:** scenario × refresh line, decision, statement issued, `before` ≠ reference in `scan` and `operator`, `after` ≠ reference in `scan` and `operator`, largest `after` difference, and store plan before → after.
  - **The verdict sentence** per backend and corpus.
  - **The two observations.**
  - **The commands,** by reference to the procedure subsection.

  State the corpus sizes (41 and the run's `self-docs` stamp) as the limit of these figures.
- [ ] **`docs/retrieval-eval.md`.** Add the closing paragraph to `### The BM25 index-state probe`. It says what the refresh-rule launcher measures and gives its two launcher lines. It gives the four run commands, one per line in a fenced block, and the Python preconditions by reference to `### The Python backend`. It states that the module creates and drops its own `bm25_refresh_rule_*` databases on the compose server and removes its own mirrors and data directories.

**Verification:**

- Every backend × corpus has a verdict sentence citing its table. Every `after` difference is either counted in a failing verdict or named as a one-run value by `--compare`, and none is absorbed.
- The reference each verdict uses is the one Task 2's statement names, or all three when it names none, and the subsection says which.
- After the runs, the compose server lists no `bm25_refresh_rule` database.
- `git diff` adds bytes only inside `### The candidate end-state rule, at refresh level` and the closing paragraph of `### The BM25 index-state probe`. The new results subsection carries no millisecond figure.
