# Skeptic Review: fix_background_test_wait

## Context

**Branch:** `fix_background_test_wait`
**Date:** 2026-10-05
**Reviewed:** the whole branch diff against `dev`. That is four prose files: the two adopter conventions templates under `cli/templates/claude/context/`, `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6, and `plugin/agents/layer-implementer.md`. The review includes the three code-review fixes already landed. 10 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_background_test_wait_code_review.md` and its three findings. There is no parity review, because `phases.parity` is `false`, and this branch has no architecture review.

**Citations verified first-hand:**

- Point 6 cites `### G.1 Run the gates` as forbidding "a `Monitor`, a `sleep`". The cited bullet "Forbidden here, by name" says exactly that.
- Point 6 cites the refused-call fallback in `layer-implementer.md` → `## Resolved values`. That fallback exists in the `<test_cmd>` / `<typecheck_cmd>` row.
- The roster in `## Who may cite this` already lists `layer-implementer.md`, which is the only file on this branch that newly points at the heading.

**Headline:** two net-new items, neither of them Must Fix.

- The story plan's stated reason for leaving `layer-reviewer`'s probe route alone is the same reasoning the code review rejected for the implementer (code-review Finding 2). The reviewer's probe still has no bar against polling a backgrounded run.
- The "never piped" fix added a third shape to the template sentence, but the sentence's reason still says "either shape".

There is also one decision for a human, in the return's `## Questions` section: point 6's "Phase G runs the suite anyway" does not hold for `<typecheck_cmd>`.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Make the reason clause in both adopter templates fit the three forbidden shapes _(layer: cli)_
2. [ ] **Finding 1** — Bind a backgrounded `layer-reviewer` probe to test-run rule point 6's no-wait prohibitions _(layer: plugin)_

---

## Must Fix

_None._

---

## Should Fix

### 1. A `layer-reviewer` probe moved to the background is still free to be polled
→ [finding_1.md](fix_background_test_wait_skeptic_review/finding_1.md)

---

## Nice to Have

### 2. The template sentence lists three forbidden shapes, then gives its reason for "either shape"
→ [finding_2.md](fix_background_test_wait_skeptic_review/finding_2.md)

---

## Intentional divergences that survived the two-leg test (call-outs, not fixes)

- **The wrapper `run-test-suite.sh` is not extended to a unit-scoped form** (story `## Context`, the design paragraph). Its reason is that the wrapper runs only configured `commands.*` strings, so an agent-supplied command would ride the script-allowlist guard's permit. That reason holds. No precedent in `plugin/` or `cli/templates/` gives a wrapper an agent-supplied command line. Kept.
- **G.1's "never end the turn with the run in flight" is not carried into point 6.** The reason given is that a unit's turn ending is its return to the orchestrator, not a session teardown. That holds for a dispatched sub-agent per `unit_loop_core.md` → `## The unit loop`. Kept.
