# Skeptic review — `feat_docs_retrieval_eval`

## Context

Branch `feat_docs_retrieval_eval` against `dev`, reviewed adversarially 2026-09-22: 41 changed files, +8,616 / −46 — the `cli` store constants and the calibrated threshold with its new store suite, the 13-module eval runner and its two committed corpora under `evals/docs-retrieval/`, gate 11 in `scripts/run-gates.sh`, and the documentation of record (`docs/retrieval-eval.md`, `docs/retrieval-eval-results.md`, `docs/retrieval.md`, `docs/cli.md`, `docs/development.md`, `evals/README.md`, `README.md`, `llms.txt`). **46 run-artifact files excluded from the reviewed diff.** De-duplicated against the already-committed `harness-runs/code_reviews/feat_docs_retrieval_eval_code_review.md` (11 findings, all applied) and `harness-runs/architecture_branch_reviews/feat_docs_retrieval_eval_arch_review.md` (4 findings, all applied); `phases.parity` is `false`, so no parity review ran and check 2's parity leg is inert. Nothing below re-raises a finding either of those reviews made, and I re-verified their fixes landed rather than taking their word for it (the typographic punctuation is gone from both renderers, `ARM_CANDIDATES` and the `ARMS` table are imported rather than retyped, the recorded hostname is replaced by `platform() release()` at every site, and both launcher bodies are in `docs/retrieval-eval.md`).

**The headline.** The engineering holds up under an adversarial read: every new export has a caller, the arm table and the metric module carry no letter test, `check-floor.mjs`'s three exit statuses match what `run-gates.sh` switches on, the floor margin policy reproduces every entry in `floor.json` to the digit (0.05 below each measured value, truncated), the cold-build arithmetic checks out (177 × 62.51 ms + 1.07 s = 12.2 s; the 940-chunk crossover and the 94.8 s extrapolation both re-derive), and `roadmap item 17` — a citation I opened expecting to be fabricated — exists in `docs/development.md` → `## 6. The roadmap this tree defers to` and says exactly what `docs/retrieval.md` claims of it.

What survives is one **ordering defect the plan designed and nobody caught**: the story index settled that Task 9 is the last writer of the generated region and that Tasks 7, 8, 14 and 6 "write only hand-written sections" — but Task 7's hand-written section *reads the region live* and was pasted before Task 9 regenerated it. The shipped `## The query-log pass` therefore publishes a library-level comparison row, a signed gap and a provenance stamp that the region three thousand lines above it contradicts, with the gap's **sign inverted** (Finding 1). The other three are a stale unstamped corpus count presented as the current one, a calibration sentence that reads as a gain the data does not show, and a latent hazard in the one arm that was deliberately never executed.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Say that the threshold move changed no measured outcome _(layer: general)_
2. [ ] **Finding 4** — Forbid a code fence around arm A's answer _(layer: general)_
3. [ ] **Finding 2** — Stop calling 166 the `self-docs` chunk count _(layer: cli, general)_
4. [ ] **Finding 1** — Restate the query-log pass's comparison against the region as it ships _(layer: general)_

## Must Fix

### 1. `## The query-log pass` compares against a retired reading of the generated region, and publishes the gap with the wrong sign
→ [finding_1.md](feat_docs_retrieval_eval_skeptic_review/finding_1.md)

## Should Fix

### 2. The store suite and `docs/retrieval.md` call 166 rows the `self-docs` corpus's chunk count, and claim the case covers both committed corpora's sizes
→ [finding_2.md](feat_docs_retrieval_eval_skeptic_review/finding_2.md)

### 3. `## Threshold calibration` presents abstention on every negative query as the move's outcome, when the pre-move run already abstained on all of them
→ [finding_3.md](feat_docs_retrieval_eval_skeptic_review/finding_3.md)

### 4. Arm A's task text shows both answer forms inside a code fence, and nothing in the pipeline handles one
→ [finding_4.md](feat_docs_retrieval_eval_skeptic_review/finding_4.md)

## Nice to Have

_None._

## Divergences that survived the two-leg test

`phases.parity` is `false` and `.claude/context/conventions.md` → `## Reference implementation` states this project is kept in parity with nothing, so check 4 has no reference behaviour to grade and check 2's parity leg is inert. Three things that look like divergences from the task prompt were tested and are not, so they are recorded here rather than filed:

- **The `## Still open` lexical entry was reworded rather than removed, and the substance is right.** Deliverable 9 allows either branch; `cli/test/docs-retrieval-store.test.mjs` case (a) shows the property holding and case (b) records the 63-row crossover for the other plan. Leg 2 of the two-leg test found no sibling precedent in this tree for closing an entry on one of two measured plans. Only the entry's *numbers* are behind (Finding 2).
- **The eval's own `node evals/…` invocation inside `scripts/run-gates.sh` is not the bare-interpreter route the prompt forbids.** I checked this rather than assuming it: the prohibition is on a tool call, and commands inside that script run as a bash subprocess with no per-command check, which is the route the prompt itself nominates.
- **Gate 11's `BLOCKED` third outcome genuinely cannot turn the script red.** `floor_blocked` is pushed onto neither array and `check-floor.mjs` reserves status 3 for the empty cache alone; a shortfall is any other non-zero and still lands on `failed`. The plant recorded in `docs/retrieval-eval.md` → `## The regression floor` matches the failure line the module composes, field for field.
