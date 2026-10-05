### 1. A `layer-reviewer` probe moved to the background is still free to be polled

> **Self-contained per-finding file** for the `fix_background_test_wait` skeptic-review index (`harness-runs/skeptic_reviews/fix_background_test_wait_skeptic_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**Severity:** Should Fix. This is the same grade the code review gave the identical gap in the implementer (code-review Finding 2).

**Files:**

- `plugin/agents/layer-reviewer.md` → the paragraph `**Run the probe that would settle it.**`, ending "the no-fixes rule at the top of this file binds a probe exactly as it binds a direct edit."
- `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, the `**Who may cite this.**` roster.

**Problem.** The story plan's inventory (scope-register row 11) leaves `layer-reviewer`'s probe route unchanged. It argues that "a backgrounded probe is a confirmation the reviewer did not execute, which its existing rule already routes". That existing rule is `**Disclose a confirmation you did not execute.**`.

The code review already rejected this reasoning for the implementer. A disclosure or evidence-downgrade rule only says what to **record**. It does not forbid **waiting**. Code-review Finding 2 closed that hole in `layer-implementer.md` by adding a pointer to point 6 in its probe route. `layer-reviewer.md` carries the same probe route, word for word, and got no such pointer. So a reviewer whose probe is moved to the background can still improvise the loop from the task prompt's `## Why`: `until grep -q … <output>; do sleep 15; done`. That loop is a `sleep` in its own command, keyed on runner output, and it is exactly what point 6 and G.1 forbid.

**Why this is reachable.**

- `layer-reviewer` is dispatched whenever `<per_unit_review>` is `on`. `plan_orchestration_instructions_semi_autonomous.md` binds it `on`, so it runs in every semi-autonomous plan flow.
- Its probes go through `scratch-run.sh` and can run a whole mutation or test file, just as the implementer's do.
- The story's second reason, that "per-unit review is off in the autonomous forks", covers only the autonomous fork. It says nothing about the forks where the reviewer runs.

**Two-leg test (check 4).**

- **Leg 2, the precedent.** This branch's own Finding 2 fix sets the precedent: a probe the tool layer moves to the background is bound by point 6.
- `layer-reviewer.md` follows neither that precedent nor any stated alternative.

**Roster constraint.** `## The test-run rule` says: "**no document beyond this roster may point at this heading.**" `layer-reviewer.md` is not on the roster today. Adding the pointer therefore also requires adding the roster entry, in the same change.

**Fix.** Two edits, nothing else.

1. In `plugin/agents/layer-reviewer.md`, find the paragraph `**Run the probe that would settle it.**`. Append this sentence to the end of it, after "binds a probe exactly as it binds a direct edit.":

   > A probe the tool layer moves to the background is not waited on: `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` point 6's prohibitions on collecting a backgrounded run bind it, and a finding that rested on it is disclosed under the rule below.

2. In `plugin/instructions/unit_loop_core.md` → `## The test-run rule` → `**Who may cite this.**`, add this line immediately after the `` - `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` `` line:

   > `` - `${CLAUDE_PLUGIN_ROOT}/agents/layer-reviewer.md` ``

**Verify by reading:**

- `grep -n "point 6's prohibitions" plugin/agents/layer-reviewer.md` returns one line.
- `grep -n "agents/layer-reviewer.md" plugin/instructions/unit_loop_core.md` includes the new roster line.

No test run is involved.
