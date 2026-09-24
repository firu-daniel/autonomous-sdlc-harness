# Skeptic Review: fix_plan_loop_resume_from_walker_state

## Context

**Branch:** `fix_plan_loop_resume_from_walker_state`
**Date:** 2026-09-25
**Reviewed:** the whole branch diff against `dev`, 25 files: the walker header and the graph's two new `entries` (`cli`), the two walker suites, the planning core's **Continuing a saved walk.** and its **review** / **continue** outcomes, the autonomous fork's Override 2 and Override 5, the semi-autonomous binding row, `autonomous_pause_and_ledger.md` §1.7 step 4 and `plugin/docs/AUTONOMOUS_FLOW.md` (`plugin`), and `docs/flow-graph-walker.md` → `### Item 3a`, the schema's `entries` description, the synced fixtures and the `scripts/` mirrors (`general`). 19 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_plan_loop_resume_from_walker_state_code_review.md` and its four findings, all four now applied. No business-parity branch review exists (`phases.parity` is `false`), and no architecture branch review exists for this branch. `harness-runs/lessons.md` holds no entry this review touches.

**Verified first-hand.** `node --test` over `flow-walker-resume` and `flow-walker-ui-and-reentry` passes 19 of 19. `scripts/check-flow-graph.sh` and `--negatives` pass. The walker code did not change, and I checked the header's claims against `flow-walker.sh` myself. `current` refuses a missing state file with exit 1 (`load_state`). `start` refuses an `--entry` not in `entries` with exit 1. An entry that is not a node faults with exit 2 (`arrive`, `g_get "nodes.$node.kind" || fault`). `current` re-prints `OUT` byte for byte, a `ledger: P1` line included. The **Idempotency** citation in Override 5 resolves: `autonomous_pause_and_ledger.md` → `### 1.6` says re-flipping an `[x]` entry returns wrapper exit 3. Both new entries are consumed, by `## Setup` step 7 and by Override 2 (b) and (d).

**Headline.** Two net-new findings. The main one is Finding 1, a Must Fix. The core defines an unusable saved walk as one whose pending action has lost the artifact it works on. But its list of those artifacts leaves out the story index for a `ui_writer` on its `initial` prompt, even though that prompt's `Inputs:` line names the story index. The task prompt asks about exactly this case: a draft deleted by hand while the state is past `plan_writer`. In that case the fork re-applies a printed-again `ledger: P1` and marks `P1` converged in the ledger with no story index on disk. Finding 2 is a Should Fix. It covers a registry *Reason:* sentence that §1.7 step 4 made false. The plan-time architecture review raised it twice, and it was never applied.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else are informational only.

Each entry resolves to `harness-runs/skeptic_reviews/fix_plan_loop_resume_from_walker_state_skeptic_review/finding_<K>.md`. Both are single-sentence prose edits in one layer. They are ordered smallest blast radius first.

1. [ ] **Finding 2** — Correct `mode_contract.md` class (i) *Reason:* now that §1.7 step 4 cites the planner's Override 2 by file and heading _(layer: plugin)_
2. [ ] **Finding 1** — Treat a saved walk pending at a `ui_writer` `initial` dispatch as unusable when the story index is absent _(layer: plugin)_

---

## Must Fix

### 1. A saved walk at the UI writer's first dispatch is used with the story index deleted, so a printed-again `ledger: P1` marks a plan that does not exist as converged
→ [finding_1.md](fix_plan_loop_resume_from_walker_state_skeptic_review/finding_1.md)

---

## Should Fix

### 2. `mode_contract.md` class (i) *Reason:* still says §1.7 names the planner's Override 2 "with neither filename nor heading"
→ [finding_2.md](fix_plan_loop_resume_from_walker_state_skeptic_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from.

- **Verified-OK, a cost the design accepts: a `ledger: P1` lost on a finished walk.** With `phases.qa` `false` or `qa` run-mode-skipped, `plan_review` → `PASS` prints `ledger: P1` on the `<terminal_handoff>` action itself, because `ui_writer`'s skip gates pass straight to `convergence`. If the session ends before the flip, the walk is finished. **Continuing a saved walk.** acts on nothing it printed. `P1` stays `[ ]`, and case (d) sends the draft through one more review round. Nothing is lost, and the round is re-earned rather than trusted. This matches the lost-`P2`-flip cost that `docs/flow-graph-walker.md` → `### Item 3a` → **Cost.** records. It is listed here so the user can confirm the same trade-off holds for `P1`. It is not a fix.
