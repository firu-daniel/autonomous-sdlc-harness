### 1. Test-run rule point 6 forbids reshaping a refused command, which contradicts the sanctioned wrapper fallback for a refused `<typecheck_cmd>`

> **Self-contained per-finding file** for the `fix_background_test_wait` code-review index (`harness-runs/code_reviews/fix_background_test_wait_code_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `plugin/instructions/unit_loop_core.md` (`## The test-run rule`, point 6) — "A refusal is handled as a refusal (point 3, for a test file), never as a reason to reshape the command or move it to the background."

Point 6 applies to **both** `<typecheck_cmd>` and `<test_file_cmd>` ("Run `<typecheck_cmd>` and `<test_file_cmd>` each as one foreground command …"), then says a refusal is "never … a reason to reshape the command". The unit's own contract says the opposite for `<typecheck_cmd>`. `plugin/agents/layer-implementer.md` → `## Resolved values`, row `<test_cmd>` / `<typecheck_cmd>` — "If that call is **refused**, the key holds a raw command line rather than the wrapper invocation — run `bash <scripts_dir>/<name>.sh`" — tells the unit to run a **different** command string when the configured one is refused. `plugin/instructions/plan_orchestration_instructions_core.md` → `## Setup` step 3 ("unless that call is **refused** — the commands row of `## Resolved values` states what to run then") says the same.

The parenthetical "(point 3, for a test file)" names a route for a refused test file only. It leaves the typecheck case to the bare phrase "handled as a refusal", and that phrase states no route. An implementer whose configured `<typecheck_cmd>` is refused now reads two contradictory instructions:

- the agent row says to run the wrapper;
- point 6 says never to reshape after a refusal.

Following point 6 drops the sanctioned fallback, so the unit's type check goes unrun. Phase G runs `<test_cmd>` only (`### G.1 Run the gates`), so nothing later in the flow runs the type check either.

The intent the story plan states is narrower: on a refusal, never move the command to the background and never wrap it in a `cd` compound or a redirect. Writing that intent into the rule, and pointing the typecheck case at its existing owner, removes the conflict without adding a second owner.

**Fix:** in `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6, replace the sentence

> A refusal is handled as a refusal (point 3, for a test file), never as a reason to reshape the command or move it to the background.

with

> A refusal takes the route already stated for it — point 3's skip for a test file, and for `<typecheck_cmd>` the refused-call fallback of `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → `## Resolved values` — and is never a reason to wrap the command in a `cd`, redirect or pipe its output, or move it to the background.

Change nothing else in point 6. Verify by grepping `plugin/` for `reason to reshape the command`. The grep must return nothing.
