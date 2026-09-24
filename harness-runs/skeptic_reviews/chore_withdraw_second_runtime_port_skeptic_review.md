# Skeptic Review: chore_withdraw_second_runtime_port

## Context

**Branch:** `chore_withdraw_second_runtime_port`
**Date:** 2026-09-24
**Reviewed:** the whole branch diff against `dev` (`harness.config.json` → `defaultBranch`): the new decision record `docs/second-runtime-port-decision.md`, the withdrawn row, the `Withdrawn` legend value and the renumbered index in `ROADMAP.md`, the amended opening paragraph of `ARCHITECTURE.md` → `### Why no candidate is named here`, and the new entries in `README.md` and `llms.txt` → `## Where to read more`. 15 run-artifact files excluded from the reviewed diff. De-duplicated against the committed code review `harness-runs/code_reviews/chore_withdraw_second_runtime_port_code_review.md` and its three findings. No parity review exists (`phases.parity` is `false`) and no branch-level architecture review exists for this branch.

**Headline conclusion.** The ROADMAP index runs 1..45 without a gap. No file other than the record names an agent framework, so the amended `ARCHITECTURE.md` sentence holds. The cited headings in `task_plan_writing_instructions_core.md`, `task_plan_writing_instructions_autonomous.md` and `dispatch_discipline_instructions.md` exist. The `dispatch_additions` example exists as quoted. The record's `jq` command, re-run against the local logs, returns exactly the table's figures. Two claims in the record do not survive first-hand checking, and both are net-new. First, the per-phase totals behind "roughly $30–80" leave out each run's last planning rounds. In every one of the four runs, the planning loop continues into a session that goes on to dispatch `layer-implementer`, and the selector drops that session (Finding 1). Second, the graph table describes one shared counter and one FAIL edge back to the writer across "all gates", including the UI-test-plan loop it lists as a node. The cited source gives that loop its own reset counter and its own writer (Finding 2). Neither finding changes the decision, and both are fixed by adding a sentence while leaving the maintainer-given table and figures as they are.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — State after the §1 table that the UI-test-plan loop has its own counter and its own FAIL edge _(layer: general)_
2. [ ] **Finding 1** — State in §4 that each run's phase total is a lower bound, because the selector drops the session where planning converged _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The per-phase cost totals leave out the session in which each run's planning loop converged
→ [finding_1.md](chore_withdraw_second_runtime_port_skeptic_review/finding_1.md)

### 2. The §1 table puts the UI-test-plan loop under one shared counter and one writer FAIL edge, but its source gives it its own
→ [finding_2.md](chore_withdraw_second_runtime_port_skeptic_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section carries no divergence call-outs.

Verified OK: the cited paths `scripts/publish-main.sh` and `.gitignore` → `harness-runs/autonomous_logs/*` are themselves removed from, or cut out of, the published `main` (`removed_paths` lists `scripts`, and the managed `.gitignore` block runs to end of file). Other published documents already cite `scripts/` paths without a disclosure (`docs/development.md` → the gate 6c–6e paragraphs), so this record follows established precedent and is not flagged.
