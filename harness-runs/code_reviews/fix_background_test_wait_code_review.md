# Code Review: fix_background_test_wait

## Context

**Branch:** `fix_background_test_wait`
**Date:** 2026-10-05
**Reviewed:** the whole branch diff against `dev`, which is 4 files and 7 insertions:

- the single-file-command shape sentence added to `cli/templates/claude/context/conventions.md` and `cli/templates/claude/context/layer.md` (Task 1);
- point 6 of `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (Task 2);
- the background case in `plugin/agents/layer-implementer.md`'s fix-site fallback, evidence-downgrade rule and `## Output contract` item 5 (Task 3).

6 run-artifact files excluded from the reviewed diff.

**Headline.** The rule is placed with its owner, and its consumer's not-run strings are spelled consistently (`not run: moved to the background`, `skipped: moved to the background`). Point 6 cites `### G.1 Run the gates` for the `Monitor` / `sleep` prohibitions, and that citation was opened and confirmed. Appending point 6 renumbers nothing, and no citer counts the points.

**Tests.** No test was added. The branch changes prose only, and nothing under `cli/test` asserts these template sentences. Whether the suite passes is for the Run gates phase to establish.

**Parity.** `phases.parity` is `false`, so there is no parity check.

**Pass 0.** The grep half's sweep list has no regexes configured, so it found nothing. The new-exported-symbol caller check found no new exported symbols, because the diff is prose only.

**Pass 2.** The per-unit findings root `harness-runs/task_plan_point_reviews/fix_background_test_wait_task_plan/` does not exist. This flow ran with per-unit review off, so Pass 2 was a no-op.

**What is left.**

- One Must Fix: point 6 forbids reshaping a refused command, which contradicts the sanctioned wrapper fallback for a refused `<typecheck_cmd>`.
- Two Should Fix: the no-wait rule does not reach `scratch-run.sh` probes, and the templates omit the pipe that point 6 forbids.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each entry to `[x]` when that fix's commit lands. `[ ]` markers anywhere else are informational, and the committer does not touch them.

1. [ ] **Finding 3** — Add "never piped" to the single-file command shape sentence in both adopter conventions templates _(layer: cli)_
2. [ ] **Finding 1** — Point test-run rule point 6's refusal clause at the existing `<typecheck_cmd>` fallback instead of forbidding every reshape _(layer: plugin)_
3. [ ] **Finding 2** — Bind a backgrounded `scratch-run.sh` probe to point 6's no-wait prohibitions in `layer-implementer` _(layer: plugin)_

---

## Must Fix

### 1. Test-run rule point 6 forbids reshaping a refused command, which contradicts the sanctioned wrapper fallback for a refused `<typecheck_cmd>`
→ [finding_1.md](fix_background_test_wait_code_review/finding_1.md)

---

## Should Fix

### 2. A probe moved to the background is recorded as a downgrade but is never forbidden from being polled
→ [finding_2.md](fix_background_test_wait_code_review/finding_2.md)

### 3. The adopter templates forbid a `cd` compound and a redirect in the single-file command, but not the pipe that point 6 also forbids
→ [finding_3.md](fix_background_test_wait_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section holds no parity divergences.

- **Verified-OK: the conventions-document priming text is out of scope for a task.** This repository's `.claude/context/conventions.md` → `## The testing bar` still states the per-unit command as `npm test -- test/<name>.test.mjs` *from `cli/`*. It also still quotes spec-reporter `ℹ` lines. The story plan raises this as a `stale-rule` for a hand edit, because no task may edit a `layers[].conventions` document. Until a human makes that edit, every unit in this repository skips its single-file run under point 6, and Phase G covers the file.
