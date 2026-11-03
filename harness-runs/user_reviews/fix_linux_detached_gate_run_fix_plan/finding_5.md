### 5. Plan-review Should Fix 2, never applied: the semi-autonomous `<gate_launcher>` reason claims *"on every host"*

**Severity:** Should Fix (user observation 4, second item)

**File:** two fork rows and one story-index sentence.

- `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` and `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md`. In each, the binding row opens `` | `<gate_launcher>` | `none` — this flow runs under the session's own settings ``. The text to fix is *"so the run form's detached worker outlives its call on every host"*.
- `harness-runs/story_plans/fix_linux_detached_gate_run_story_plan.md` → `## Context`. The sentence to fix is *"They run under the user's own settings, which `init` merges with no sandbox block, so F10 does not reach them."*

**Source.** `harness-runs/task_plan_reviews/fix_linux_detached_gate_run/review_1.md` → `## Should Fix` 2. `review_2.md` → `## Should Fix` 2 raised it again as *"Not addressed from round 1"*. It was neither applied nor recorded under `## Rejected findings`.

**The problem, verified.** Both fork rows still say the detached worker *"outlives its call on every host"*. That holds only for a session that has no sandbox. `init` writes no sandbox block for this flow. A user whose own settings turn the sandbox on under Linux still meets F10 here: a process detached inside a sandboxed call did not outlive the call (`docs/sandbox-verification.md` §5 F10). The story index's *"so F10 does not reach them"* makes the same overclaim.

**Fix:**

- [ ] **1. Both fork rows.** Make the same edit in both files. Replace the row's reason with one limited to what `init` writes for that flow, and drop *"on every host"*:
  > `none` — this flow runs under the session's own settings, in which `init` writes no sandbox block, so the run form's detached worker outlives its call there and the core's G.1 issues the run form directly. A user whose own settings turn the sandbox on under Linux meets `docs/sandbox-verification.md` §5 F10 in this flow too.

  Keep the value `none` and the table shape. Confirm that `grep -n 'on every host' plugin/instructions/*_semi_autonomous.md` prints nothing.
- [ ] **2. The story index's `## Context`.** Replace *"so F10 does not reach them"* with *"so F10 does not reach them unless the user's own settings turn the sandbox on under Linux"*. Edit no other line of that file, and never its `## Phase 2 Readiness — Ordered Fix List`.
