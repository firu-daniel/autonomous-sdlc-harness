### 1. `layer-implementer` tells a unit to record a gate script that `<test_cmd>` runs as "no phase of this flow runs it"

**File:** `plugin/agents/layer-implementer.md` (`**What you run, in every mode.**`): "any other gate script is recorded as *not run, and no phase of this flow runs it*"

The rewritten paragraph now reads:

> Write *deferred to the Run gates phase* only for `<test_cmd>`, the whole-tree `<typecheck_cmd>`, or a test file the suite runs; any other gate script is recorded as *not run, and no phase of this flow runs it*.

The "any other gate script" arm includes the gate scripts that `<test_cmd>` itself invokes, and Phase G **does** run those. `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 1 forbids a unit to run "`<test_cmd>`, a gate script it runs, or a test file…". That "it" is `<test_cmd>`, so the scripts point 1 keeps away from units are exactly the ones Phase G runs. This repository shows the case directly. `commands.test` is `bash scripts/test.sh`, and that script's body ends `bash scripts/run-gates.sh "$@"`. Earlier task plans in this repository carry `**Verification:**` bullets that ask for `bash scripts/run-gates.sh` (for example `harness-runs/task_plans/chore_gate_10_real_catalog_measurement/task_1_plan.md`, "`bash scripts/run-gates.sh` prints no new failure"). An implementer following the new text writes *"not run, and no phase of this flow runs it"* for that bullet, and the claim is false: every Phase G round runs it.

This is the defect class the branch exists to remove. Task prompt goal 6 asks that the implementer's records tell the truth about what Phase G verifies, in both directions. The new text fixes the false "deferred" and introduces a false "never verified".

**Fix:** in `plugin/agents/layer-implementer.md` → `**What you run, in every mode.**`, replace the sentence

> Write *deferred to the Run gates phase* only for `<test_cmd>`, the whole-tree `<typecheck_cmd>`, or a test file the suite runs; any other gate script is recorded as *not run, and no phase of this flow runs it*.

with

> Write *deferred to the Run gates phase* only for `<test_cmd>`, the whole-tree `<typecheck_cmd>`, a test file the suite runs, or a gate script one of those two configured commands invokes (read the wrapper under `<scripts_dir>` that the configured string names to establish it — reading it is not running it); any other gate script is recorded as *not run, and no phase of this flow runs it*.

Change no other sentence in the paragraph. The fix touches no test file and asks for no run.
