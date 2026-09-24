# Code Review: fix_plan_loop_resume_from_walker_state

## Context

**Branch:** `fix_plan_loop_resume_from_walker_state`
**Date:** 2026-09-25
**Reviewed:** the whole branch diff against `dev`, 24 files across all three layers:

- `cli`: the walker header's re-entry contract, the graph's two new `entries`, the new `cli/test/flow-walker-resume.test.mjs`, and the relabelled `cli/test/flow-walker-ui-and-reentry.test.mjs`.
- `plugin`: the planning core's **Continuing a saved walk.** and its **review** / **continue** outcomes, the autonomous fork's Override 2 and Override 5, the semi-autonomous binding row, `autonomous_pause_and_ledger.md` §1.7 step 4, and `plugin/docs/AUTONOMOUS_FLOW.md`.
- `general`: `docs/flow-graph-walker.md` → `### Item 3a`, the schema's `entries` description, the synced graph fixtures, and the walker and graph mirrored into `scripts/`.

14 run-artifact files excluded from the reviewed diff.

**Tests.** The walker suites and the byte-for-byte mirror suite pass: `node --test` over `flow-walker-resume`, `flow-walker-ui-and-reentry` and `outer-loop-scripts`, 63 of 63. `cli/templates/scripts/flow-walker.sh` and the graph are byte-identical to their `scripts/` mirrors. All five graph fixtures carry the new `entries` line. The seven test names cited in `### Item 3a` match the suite exactly.

**The walker code is unchanged, and the header claims hold against it.** `current` exits 1 when no state file exists. `next` refuses `awaiting=done` with exit 1. `start` refuses an `--entry` not in `entries` with exit 1. An entry that is not a node faults with exit 2.

**The findings are all in the orchestrator prose that decides when to continue.** Two are Must Fix cases where a resumed run still loses work: a pause between `answered` and the writer's dispatch drops the human's answers (Finding 1), and a UI-test draft is rewritten because two paragraphs of the same fork disagree (Finding 2). A third makes the new "continue a walk parked before the index exists" rule unreachable (Finding 3).

**Mechanical sweep.** Pass 0's grep half is empty: the agent's sweep list has no regexes filled in. The caller check found no new exported symbol in the diff.

**Two-pass mode.** Pass 2 was a no-op: `harness-runs/task_plan_point_reviews/fix_plan_loop_resume_from_walker_state_task_plan/` does not exist, so there were no per-unit findings to reconcile.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else are informational only.

Each entry resolves to `harness-runs/code_reviews/fix_plan_loop_resume_from_walker_state_code_review/finding_<K>.md`. The list is sorted so the smallest, safest fixes come first.

1. [x] **Finding 4** — Drop "exactly as the task planner's does" from the fix-plan fork's **Resume-from-ledger.** _(layer: plugin)_
2. [x] **Finding 2** — Make Override 5's skip mapping name `--entry ui_review` for a UI-test draft with `P2` `[ ]` _(layer: plugin)_
3. [ ] **Finding 3** — Widen `## Setup` step 5's trigger to a decision that weighs a saved walk _(layer: plugin)_
4. [ ] **Finding 1** — Append pending answered pairs when a continued walk re-dispatches a writer _(layer: plugin)_

---

## Must Fix

### 1. A continued walk dispatches the writer without the answered pairs a pause left unconsumed, and the watcher then archives them
→ [finding_1.md](fix_plan_loop_resume_from_walker_state_code_review/finding_1.md)

### 2. Override 5 still sends every "skip the task-plan loop" to `--entry ui_writer`, which rewrites a UI-test draft that Override 2(b) says to review
→ [finding_2.md](fix_plan_loop_resume_from_walker_state_code_review/finding_2.md)

### 3. `## Setup` step 5 still applies `<existing_artifact_decision>` only when a story index exists, so a walk parked before the index is written can never be continued
→ [finding_3.md](fix_plan_loop_resume_from_walker_state_code_review/finding_3.md)

---

## Should Fix

### 4. The fix-plan fork still says its ledger resume composes "exactly as the task planner's does", a composition this branch removed
→ [finding_4.md](fix_plan_loop_resume_from_walker_state_code_review/finding_4.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section carries no parity call-outs.
