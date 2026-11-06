# Code Review: fix_phase_g_resume_answer_reads_and_park_loop_window

## Context

**Branch:** `fix_phase_g_resume_answer_reads_and_park_loop_window`
**Date:** 2026-11-06

**Reviewed:** the whole branch diff against the default branch `dev`, read as `origin/dev...HEAD` because this run copy has no local `dev` ref. That is 13 files across all three layers:
- `cli`: the watcher template's `resume_clause` and park-loop guard (Tasks 1–2), the workflow template's variable list, and three suites (`watcher-park-loop`, `watcher-park-resume`, `run-gates-park-answer`).
- `plugin`: the core's G.2 and must-not bullet, the three autonomous forks' Override 2(a) and **On resume** passages, and `architecture-reviewer` sub-case (c) (Tasks 3–4).
- `general`: `docs/watcher.md` §4, `docs/remote-execution.md` and `ARCHITECTURE.md` (Task 6).

11 run-artifact files excluded from the reviewed diff.

**Conclusions.**
- **The window is fully retired.** A grep for `PARK_LOOP_WINDOW`, `resumed_at_epoch`, `either detector` and `consume ALL` outside `harness-runs/` finds no live reader. The hits left are:
  - the dated record in `docs/sandbox-verification.md` §7, deliberately unchanged;
  - the decision-of-record sentence in `docs/watcher.md` §4;
  - the self-adopted `scripts/autonomous-watcher.sh`, deliberately unchanged per the story plan's **The self-adopted copy.** paragraph.
- **The guard is still bounded.** The index-detector case still trips `park_loop` after two cycles and is released by `PARK_LOOP_CLEAR`. The run-B pin shows two fast re-parks that each raise the index under shipped defaults are not caught. The guard keeps one bound.
- **The wording matches the plan and the pins.** W1–W5 match the story plan byte for byte. Every heading `run-gates-park-answer.test.mjs` slices on exists, and the first sentence of the resume prompt that `watcher-remote-job.test.mjs` → `PARK_RESUME` matches is unchanged.
- **Tests.** Every changed behaviour ships with a test. No new tree-reading test was added, so there is no `treeGuards` entry to add. Whether the tests pass is for the Run gates phase to establish.
- **Parity.** `phases.parity` is `false`, so no parity check runs.
- **What is left.** One Should Fix: the resume prompt and `docs/watcher.md` say G.0 passes every Phase G pair to `test-fix-plan-writer`, which the core's G.0 contradicts. One Nice to Have, on prose.
- **Pass 2.** It found nothing to reconcile, because the supplied per-task findings root does not exist.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` as that fix's commit lands. Each entry resolves 1:1 to `harness-runs/code_reviews/fix_phase_g_resume_answer_reads_and_park_loop_window_code_review/finding_<K>.md`.

1. [x] **Finding 2** — Say "The default is sized" and fix the run-on sentence in `docs/watcher.md` §4's sizing paragraph _(layer: general)_
2. [x] **Finding 1** — Have the resume prompt and `docs/watcher.md` say G.0 decides whether a Phase G pair reaches `test-fix-plan-writer`, and update its pin _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The resume prompt says G.0 passes every Phase G pair to `test-fix-plan-writer`, but G.0 passes only a pair naming a pending index
→ [finding_1.md](fix_phase_g_resume_answer_reads_and_park_loop_window_code_review/finding_1.md)

---

## Nice to Have

### 2. `docs/watcher.md` §4 still says "The defaults are sized", and the window's removal leaves a run-on sentence
→ [finding_2.md](fix_phase_g_resume_answer_reads_and_park_loop_window_code_review/finding_2.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
