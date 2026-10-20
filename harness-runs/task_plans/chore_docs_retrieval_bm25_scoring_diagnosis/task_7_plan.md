### Task 7 — Measure whether either mechanism moves the relevance eval's deterministic figures

**Goal:** Meet goal 6 of the task prompt. Run the existing relevance eval through its existing launcher, on the TypeScript backend, in three states. Report which recorded relevance figures change and by how much, or that nothing changes. That answers whether the exact-against-quantized split, and the dead rows a refresh leaves, matter for ranking quality or only for score parity. The three states:

- **held-another** — a database that held another corpus first;
- **fresh-insert** — a fresh-insert index of the same corpus;
- **after-spill** — that index after a spill.

**Depends on:** Task 2. It uses `docs/retrieval-eval-results.md` → `### The score each index state ranks by` for two facts:

- **Whether a PGlite reopen empties the memtable.** That is the `t2` (reopen) row: memtable documents and its `scan`-against-`t1` counts. It decides whether the existing launcher reaches the after-spill state at all, because the launcher has no spill flag. It reaches a spilled index only by reopening a persisted `--data-dir`, with an unchanged refresh writing nothing (`cli/src/retrieval/refresh.ts` → `refreshIndex`, step (5)).
- **Whether PGlite exposes `bm25_spill_index`.**

It adds its subsection after Task 6's `### The candidate end-state rule, at refresh level`. That is a placement dependency only: no Task 6 figure is compared with this task's.

**Where this task stops.** It runs only the existing launcher, `harness-runs/scratch/eval.mjs` as `docs/retrieval-eval.md` → `## How to run it` gives it, with flags that launcher already has (`--corpus`, `--data-dir`, `--repeat`, `--out`). It adds no code, takes no latency figure, retunes nothing (task prompt → `## Constraints`) and writes nothing into the generated region of `docs/retrieval-eval-results.md`.

### Targets

- `docs/retrieval-eval-results.md` → a new `### Whether either mechanism moves relevance`, after `### The candidate end-state rule, at refresh level`.

**Work:**

- [ ] **Scratch results files.** For each corpus and state, create a file under `harness-runs/scratch/bm25-relevance/` (gitignored) holding only the two marker lines `<!-- eval:generated:start -->` and `<!-- eval:generated:end -->`. Use the `Write` tool, never a shell copy, and name each file `<corpus>-<state>.md`. `--out` writes each run's block, per-query tables included, into its own file, so no state overwrites another and no results file under `docs/` is written.
- [ ] **Runs.** `cli/dist` must be built first, and the launcher is `harness-runs/scratch/eval.mjs`'s two documented lines. Every run uses `--repeat 1` and the default `k`. Take every run before editing the document, so each corpus's three states share one stamp. For each target corpus `X`, with `Y` the other corpus:
  - **held-another:** run `--corpus Y --data-dir harness-runs/scratch/bm25-relevance/held-X`, then `--corpus X --data-dir harness-runs/scratch/bm25-relevance/held-X --out harness-runs/scratch/bm25-relevance/X-held-another.md`. The second run's refresh deletes `Y`'s keys and inserts `X`'s, in one store opened over `Y`'s.
  - **fresh-insert:** run `--corpus X --data-dir harness-runs/scratch/bm25-relevance/fresh-X --out harness-runs/scratch/bm25-relevance/X-fresh-insert.md` against an absent directory.
  - **after-spill:** run the same command again against the same directory, with `--out harness-runs/scratch/bm25-relevance/X-after-spill.md`. Its refresh reports `unchanged` for every chunk, and its index is the reopened one. If Task 2's `t2` row shows that a reopen does **not** empty the memtable, this state is not reachable through the existing launcher: record that, take no substitute and run nothing else for it.
- [ ] **Compare.** For each corpus, read every arm's deterministic columns from the three blocks: recall@1, recall@3, recall@5, MRR, and the per-query refs, abstention included where the block carries it. Never read the p50/p95 columns. Give the differences:
  - fresh-insert against after-spill, which is mechanism 2 alone;
  - held-another against fresh-insert, which adds mechanism 1's dead rows.

  For each, list every column that changes with both values, every query whose ordered refs or first relevant rank change, and the arms they are in. A pair with no change is reported as **no change**, with the columns compared.
- [ ] **`### Whether either mechanism moves relevance`.** Write it with these parts:
  - **The setup:** host, Node, both models' ids, both corpus stamps, `k`, `--repeat 1`.
  - **The three states,** each with its exact commands in fenced blocks, one per line, and what makes it that state, citing Task 2's `t2` row for the reopen.
  - **One table per corpus:** arm × state × the four deterministic columns.
  - **The per-query changes.**
  - **The answer:** "ranking quality" where any figure moves, naming which mechanism's comparison moved it, or "score parity only" where nothing moves.

  State that every block was written to scratch files, so the generated region and the recorded floor are untouched. State also that latency was not read.

**Verification:**

- `git diff -- docs/retrieval-eval-results.md` shows no byte changed between `<!-- eval:generated:start -->` and `<!-- eval:generated:end -->`, and bytes added only inside the new subsection. `git diff -- evals/docs-retrieval/floor.json harness.config.json` is empty.
- Each corpus's three blocks carry one `{ files, chunks }` stamp. A mismatch is a re-run, not a comparison.
- The new subsection carries no p50, p95 or millisecond figure.
- Every "no change" claim names the columns and queries it compared.
