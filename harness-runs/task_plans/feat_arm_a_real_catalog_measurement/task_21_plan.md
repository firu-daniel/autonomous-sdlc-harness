### Task 21 — Regenerate the `fixture-catalog` and `self-docs` blocks so every calibration point is observed

**Goal:** Re-run the eval over the two committed corpora with `--out`, so their generated blocks carry `bestRerankScore` on every arm E query — every negative's score observed rather than censored at `null` — which is the condition the fixed re-calibration method puts on pooling them with the real catalog: *"only after regenerating those with the uncensored field, so every point in the pool is observed rather than bounded"*.

**Depends on:** Task 5, after which every `metrics.perQuery` entry carries `bestRerankScore: number | null` (the top reranker score `fused-rerank` compared against the threshold, recorded whether or not the query abstained); Task 4, whose `negativeKind` marks on the committed sets' negatives landed before any of their scores was observable; and Task 20, so these scores are first published **after** the decision and cannot have fed it. The regeneration is taken under the shipped threshold `0.32`; Task 22 moves the constant afterwards, if the method says to.

### Targets

- `docs/retrieval-eval-results.md` — the `fixture-catalog` and `self-docs` blocks of the generated region, through `--out` only.
- `docs/retrieval-eval-results.md` → `## The query-log pass` — the one quoted row of library-level arm E, restated by hand below the end marker.

**Work:**

- [ ] Run, through the launcher `docs/retrieval-eval.md` → `## How to run it` gives, each in its own invocation: `bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --out docs/retrieval-eval-results.md` and the same with `--corpus self-docs`. No `--transcript`: neither corpus has an arm A hand run, so its `A` row reads *awaiting hand run*, which stays true.
- [ ] **Check the two blocks.** `fixture-catalog`: snapshot `{ files: 9, chunks: 41 }`, and recall@1/3/5, MRR and strict columns equal to the block before this task (only latency and the timestamp move; any relevance change is a stop to investigate, because nothing on this branch changed that corpus's ranking). `self-docs`: a **new snapshot stamp** — this branch has grown `docs/` — which the block states and which makes its figures a different corpus from the old block's, not a before/after pair. In both, arm E's `perQuery` carries a numeric `bestRerankScore` on every query; list any `null` by id in the return. Every `self-docs` label must still resolve — a heading this branch renamed would refuse the run by name; fix such a label's `ref` alone, keeping its `id`.
- [ ] **`## The query-log pass`** quotes library-level arm E's p50 / p95 for `self-docs` from the generated region, and its own text warns that a regeneration leaves the quote describing bytes that are gone (`docs/retrieval-eval.md` → `### The cold-build and query-log launchers`). Restate that row from the regenerated block with its new snapshot, and keep the existing *"as the region stood when this pass ran"* row as it is.

**Verification:**

- `readPerQuery(text, id, mode)` from `evals/docs-retrieval/calibrate.mjs` (Task 6; `mode` required — pass `evals/docs-retrieval/arms.mjs` → `armForLetter('E').mode`) now succeeds on both `fixture-catalog` and `self-docs` — it refused before this task because the blocks carried no `bestRerankScore`.
- `git diff` shows changes only inside the two regenerated blocks and on the one restated row; the `gate10-catalog` block is byte-identical.
- `bash scripts/run-gates.sh`, without a pipe: gate 11 passes; no new failure.
