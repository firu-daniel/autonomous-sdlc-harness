### 2. A probe moved to the background is recorded as a downgrade but is never forbidden from being polled

> **Self-contained per-finding file** for the `fix_background_test_wait` code-review index (`harness-runs/code_reviews/fix_background_test_wait_code_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `plugin/agents/layer-implementer.md` (`**The probe route, in every mode.**`) — "is written as a file under `<state_dir>/scratch/` and run with `bash <scripts_dir>/scratch-run.sh"

The new no-wait rule (`plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6) covers `<typecheck_cmd>` and `<test_file_cmd>` and nothing else. The story plan's inventory names `scratch-run.sh` probes as the other command an implementer runs that can outlast the foreground window. It says they are handled through the evidence-downgrade rule, and Task 3 added "a run moved to the background" to that rule's list.

The evidence-downgrade rule only says to **record** a claim that could not be executed. It does not forbid **waiting** for a backgrounded probe. Probe text in this file never mentions the background case. Picture an implementer whose mutation probe (a script that breaks the implementation to prove a new test fails, often a full test-file run) gets moved to the background. Nothing it reads stops it from writing the loop the task prompt observed: `until grep -q … <output>; do sleep 15; done`. That is a `sleep` in its own command, keyed on runner output. The no-wait guarantee this branch adds therefore has a hole at the one other long-running command the implementer issues.

**Fix:** in `plugin/agents/layer-implementer.md` → `**The probe route, in every mode.**`, append this sentence to the end of the paragraph, after "and `**Standing-prohibition disposition.**` below owns that case.":

> A probe the tool layer moves to the background is not waited on: `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` point 6's prohibitions bind it exactly as they bind `<test_file_cmd>`, and it is recorded under the evidence-downgrade rule below.

Change nothing else. This is a pointer to point 6, not a restatement of it.
