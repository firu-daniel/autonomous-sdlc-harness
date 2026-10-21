### Task 11 — Run the relevance eval's deterministic figures on 1.5.1 and report every figure that moved

**Goal:** Run the relevance eval's deterministic figures, recall and MRR per arm, on both corpora, from fresh state, through the existing launcher, on the TypeScript backend's new engine. Report every recorded figure that moved against the generated region of `docs/retrieval-eval-results.md`. Check the `fixture-catalog` figures against `evals/docs-retrieval/floor.json` by reading, so that a gate-11 breach surfaces here before the Run gates phase.

**Depends on:**

- **Task 10**, the previous writer of `### The deciding figures on pg_textsearch 1.5.1`. This task's part goes after Task 10's `#### The candidate end-state rule, at refresh level, on 1.5.1`. The comparison rule is in Task 8's lead paragraph.
- **Task 4**: the store's old-index handling. It issues nothing on a fresh data directory.

**Where this task stops.**

- It owns `#### The relevance eval's deterministic figures, on 1.5.1`.
- **It does not rewrite the generated region**: every run writes with `--out` into a scratch file. It does not touch `evals/docs-retrieval/floor.json`, the abstention threshold, `k` or any fusion weight.
- **If a `fixture-catalog` figure falls below its floor, it stops and reports.** It re-records nothing. An extension upgrade is not on `docs/retrieval-eval.md` → `## The regression floor` → **The same-commit re-record rule.**'s list, so that call is the maintainer's.
- It does not run `scripts/run-gates.sh`, which is the Run gates phase's.

### Targets

- `docs/retrieval-eval-results.md`: `#### The relevance eval's deterministic figures, on 1.5.1`.

**Work:**

- [ ] **Preconditions.**
  - Run `npm run build`.
  - Create `harness-runs/scratch/eval.mjs` as `docs/retrieval-eval.md` → `## How to run it` gives it.
  - Confirm the TypeScript model cache exists under `~/.cache/autonomous-sdlc-harness/retrieval/models`. If it is missing, stop and say so, and never fetch.
  - Read the installed engine with a scratch probe run through `bash scripts/scratch-run.sh`. It opens an in-memory PGlite with both extensions and prints `SHOW pg_textsearch.library_version` and both extensions' `extversion`. `pg_textsearch` must read `1.5.1`; stop and report otherwise. Record the `vector` reading too.
- [ ] **The runs, fresh state**, one per corpus, each into a data directory that does not exist yet, written with `--out` to a scratch file holding only the two generated-region markers (the 1.3.1 part `### Whether either mechanism moves relevance` → **The setup.** describes that form):
  - `bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --data-dir harness-runs/scratch/v151-relevance/fresh-fixture-catalog --out harness-runs/scratch/v151-relevance/fixture-catalog.md --repeat 1`
  - `bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus self-docs --data-dir harness-runs/scratch/v151-relevance/fresh-self-docs --out harness-runs/scratch/v151-relevance/self-docs.md --repeat 1`

  Take both before editing the document. Record each block's provenance: host, Node, embedder, reranker, threshold, and the `{ files, chunks }` stamp.
- [ ] **Compare against the generated region.** For each corpus and each arm B–E, compare every recall@1/3/5, strict recall, MRR and strict MRR figure, and the abstention counts, with the same corpus's block in the generated region. Latency columns are not compared, and arm A is not compared. List every figure that moved, with both values. Where the corpus stamp differs from the recorded block's, say so beside the comparison: on `self-docs`, a moved figure can then also be the corpus moving.
- [ ] **Check the floors by reading.** For every row of `evals/docs-retrieval/floor.json`, compare its `value` with the `fixture-catalog` run's figure for that arm and metric. **If any figure is below its floor, stop and report**, with the figure, the floor and the arm, and do not edit the document.
- [ ] **The part.**
  - The setup: the runs, provenance, stamps, and the two commands above.
  - The moved figures, per corpus.
  - The floor check's outcome.
  - **The attribution statement.** On the TypeScript backend three things moved at once: PGlite 0.5.8 to 0.5.10, `pg_textsearch` 1.3.1 to 1.5.1, and `vector` 0.8.1 to 0.8.7. No moved figure here is attributed to `pg_textsearch` alone, because this run separates none of the three.

**Verification:**

- Both blocks carry a `{ files, chunks }` stamp. Every moved figure is listed with its recorded and its 1.5.1 value.
- The floor check covers every row of `floor.json`. No floor is breached, or the task stopped and reported.
- `git diff -- evals/docs-retrieval/floor.json` is empty, and the generated region between the two `eval:generated` markers is byte-identical: `git diff docs/retrieval-eval-results.md` adds lines only directly after Task 10's part.
- No latency or other wall-clock figure appears in the part.
