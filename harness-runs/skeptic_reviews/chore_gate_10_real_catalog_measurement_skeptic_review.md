# Skeptic review — `chore_gate_10_real_catalog_measurement`

## Context

Branch `chore_gate_10_real_catalog_measurement`, reviewed adversarially on 2026-09-22 against `dev` (the
`defaultBranch` in `harness.config.json`). The reviewed diff is four prose documents under `docs/` —
`docs/development.md`, `docs/retrieval-eval-results.md`, `docs/retrieval-eval.md`, `docs/retrieval.md` — 309
insertions and 71 deletions. **17 run-artifact files excluded from the reviewed diff.** `phases.parity` and
`phases.docs` are both `false`, so check 2's parity leg is inert and no documentation corpus was consulted.

De-duplicated against the already-committed
`harness-runs/code_reviews/chore_gate_10_real_catalog_measurement_code_review.md` (three findings, all applied:
the CLI-route refresh mislabel, the cancellation grounded on cost in the file of record, and the unpinned leg
(iii) refusal example) and
`harness-runs/architecture_branch_reviews/chore_gate_10_real_catalog_measurement_arch_review.md` (two findings,
both applied: the duplicated `search_docs` roster and the gate document carrying leg (i)'s measured figure). No
parity review exists for this branch, correctly. Neither finding below overlaps either set.

**The routine checks those reviewers ran were re-run first-hand rather than trusted.** The generated region of
`docs/retrieval-eval-results.md` is byte-identical to `dev` (compared by extracting the region from both
revisions and diffing the strings, 143,014 bytes each); `scripts/setup-worktree.sh` and
`cli/templates/scripts/setup-worktree.sh` are absent from the diff; no `plugin/agents/` allowlist changed; the
scope register's derivation entries A, B and C were re-run over the whole tree and return only the four
deliberately historical *"the rule used to say"* statements, the six unrelated API-overload retry rows and the
four `no-change` register rows, so no site was missed. The `plugin/agents/README.txt` →
`The docs-retrieval grant — one roster, one wire` citation the cost correction now rests on was opened and
re-derived with the README's own `grep` command: ten agents, `task-plan-writer` among them and neither
`docs-writer` nor `docs-reviewer`, exactly as the prose claims. Every arithmetic claim in the new
real-catalog subsection was recomputed from the figures the section itself records — the 13.7% spread, the 1.8%
route gap, the 2.6% time hold, the 11.9% refresh gap, the 98.8% refresh share, the 7.5% store-open rise and the
31% floor clearance all check out.

**Two claims did not survive that recomputation, and both are net-new.** The Must Fix is a settled-question
claim in `docs/retrieval.md` that the run it cites cannot support: the branch deleted the `## Still open` entry
asking whether the agent runner starts the `.mcp.json` server with the **checkout root** as its working
directory, on the strength of a leg (v) that the same document records — fourteen lines below — as having
proved only that the path resolved from **the session's working directory**, and that session was started at the
checkout root, so the two readings were never distinguished. The Should Fix is the one bullet in the file of
record whose size arithmetic does not follow from the byte counts printed in the same section.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — `docs/retrieval.md` records the `.mcp.json` working-directory question as settled on a leg that could not distinguish it _(layer: general)_
2. [x] **Finding 2** — The size bullet's per-chunk figure and two-anchor fit do not follow from the byte counts the same section records _(layer: general)_

## Must Fix

### 1. `docs/retrieval.md` records the `.mcp.json` working-directory question as settled on a leg that could not distinguish it

→ [finding_1.md](chore_gate_10_real_catalog_measurement_skeptic_review/finding_1.md)

## Should Fix

### 2. The size bullet's per-chunk figure and two-anchor fit do not follow from the byte counts the same section records

→ [finding_2.md](chore_gate_10_real_catalog_measurement_skeptic_review/finding_2.md)

## Nice to Have

None.

## Intentional divergences that survived the two-leg test

- **Deleting the `## Still open` entry on the abstain threshold**, where the file of record still says a further
  real-catalog run is what would move the value. Leg 1: the deleted entry's own words were *"confirmation
  against a real catalog, which is a hand run this repository has not made"* — that confirmation **was** made,
  at both ends, so the entry as worded is genuinely spent rather than a live question dropped. Leg 2: the
  precedent in the same document is the reranker question, retired the same way once a real load and run
  existed. `docs/retrieval-eval-results.md` → `### The limit on this calibration` retains the stronger,
  distribution-observing run as still owed, so nothing is lost. **Stands.**
- **Recording the 13.7% leg (iii) spread as thermal rather than averaging it**, against a 177-chunk section that
  reports sub-1%. Leg 1: the divergence keeps the intended behaviour — both figures stay published, side by
  side, with the smaller one explicitly marked not comparable — rather than dropping the slice that still holds.
  Leg 2: the established precedent in this file is `## The query-log pass`, which likewise publishes a rising
  five-run series with its cause rather than a mean. **Stands.**
