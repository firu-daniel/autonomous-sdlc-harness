# Code Review: chore_withdraw_second_runtime_port

## Context

**Branch:** `chore_withdraw_second_runtime_port`
**Date:** 2026-09-24
**Reviewed:** the whole branch diff against `dev` (`harness.config.json` → `defaultBranch`). That is five files, all in the `general` catch-all layer: the new decision record `docs/second-runtime-port-decision.md` (Task 1), the withdrawn row, the `Withdrawn` status value and the renumbered index in `ROADMAP.md` (Task 2), the amended opening paragraph of `ARCHITECTURE.md` → `### Why no candidate is named here` (Task 3), and the new reference-list entries in `README.md` → `## Where to read more` and `llms.txt` → `## Where to read more` (Task 4). 10 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** The branch changes no code, so no test is owed and none is affected. `phases.parity` is `false`, so no parity review was run. The acceptance criteria hold:
- The `ROADMAP.md` index runs 1..45 without gaps, and exactly 45 table rows are `Open` or `In progress`.
- The prompt's mention grep (`second-runtime|reference port|langgraph|langchain`) returns only sites that describe the item as withdrawn.
- No other file in the tree names an agent framework, so the amended `ARCHITECTURE.md` sentence *"One file names agent frameworks"* is true.
- `scripts/check-llms-txt.sh` and `scripts/check-eval-artifacts.sh` exit clean, and the added lines carry no machine path.

Every cost figure in the record was re-read from the local run logs and matches to the cent. So does the `dispatch_additions` example it quotes. Pass 0: the sweep list has no regexes filled in, and the branch adds no exported symbol, so neither half produced a candidate. Pass 2 found no per-unit review folder, so it was a no-op.

The three findings below are all in the decision record. None of them changes the decision or any figure. One further item needs a maintainer decision rather than a fix, and is returned to the caller as a question.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Cite `## Override 5` beside `## Override 2` as the source of the park-and-resume row _(layer: general)_
2. [x] **Finding 3** — State in §5 that the `dispatch_additions` record and its example are not in the published tree _(layer: general)_
3. [x] **Finding 1** — Make the cost-figure read command select the planning-only sessions it claims to report _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The cost figures' read command prints every session of a run, not the planning-only ones the table reports
→ [finding_1.md](chore_withdraw_second_runtime_port_code_review/finding_1.md)

### 2. The park-and-resume row is sourced to `## Override 2` alone, but its flow-progress ledger lives in `## Override 5`
→ [finding_2.md](chore_withdraw_second_runtime_port_code_review/finding_2.md)

### 3. §5 cites `harness-runs/dispatch_additions/` without saying the published tree does not carry it
→ [finding_3.md](chore_withdraw_second_runtime_port_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section carries no divergence call-outs.

Verified OK: `docs/second-runtime-port-decision.md` → `## 5. What a graph runtime cannot do that the orchestrator does` cites the dispatch-discipline heading as `## The sanctioned form`. That short form is correct. `plugin/instructions/dispatch_discipline_instructions.md` → `## Knowledge, not conclusions — the boundary`, in its **Knowledge — permitted, and shaped.** paragraph, requires it: the full heading carries a code span, "so it is cited by that backtick-clean short form throughout". `.claude/context/plugin.md` → `## Wires: dispatch in, return out` says the same.
