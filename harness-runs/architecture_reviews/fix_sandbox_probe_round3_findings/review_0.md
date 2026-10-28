# Architecture review — iteration 0

## Must Fix

1. **Task 1's Verification runs the Gate 15 gate script** — `task_1_plan.md`, `**Verification:**`, first bullet. Rule source: `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 4 (*"No `**Verification:**` bullet, finding fix or sub-step names `<test_cmd>`, a gate script, or a test file the unit neither creates nor edits"*), with point 1 placing every gate run in the Run gates phase. `.claude/context/conventions.md` → `## The testing bar` defers to `docs/development.md` → `## 5. Verifying a change` for what the gates are. There, `scripts/sandbox-probe.sh` is the script of **Gate 15 — the unattended sandbox probe (macOS)**, and `bash scripts/sandbox-probe.sh --list` is one of the commands in that gate's own command block.
   The bullet reads *"`bash scripts/sandbox-probe.sh --list` prints the six new strings … Each matches its Gate 15 table cell character for character once backticks are removed."* That asks the unit to invoke a gate script. A read-only mode does not take it out of the rule. The comparison the bullet wants is the one `cli/test/sandbox-probe-git-and-legs.test.mjs` → *"Gate 15's restated leg table matches --list, row for row"* already makes. This task neither creates nor edits that test, so it is the Run gates phase's check and not the unit's.
   **Fix:** Delete the `bash scripts/sandbox-probe.sh --list` bullet from `task_1_plan.md` → `**Verification:**`. Replace it with a source-text check the unit may run. For example: each of the six new strings appears verbatim as the third `sp_leg_declare` argument of its leg in `scripts/lib/sandbox-probe/core.sh` (a `grep -F` of the full string, one hit each). The same string appears in the matching Gate 15 table row of `docs/development.md` once backticks are removed. Optionally, add one sentence noting that the row-for-row comparison is made by `cli/test/sandbox-probe-git-and-legs.test.mjs` in the Run gates phase, as a statement of where the check happens rather than a request to run it. Leave the other three Verification bullets as they are.

## Should Fix

_None._

## Nice to Have

_None._
