# Architecture review — iteration 1

Iteration 0's finding (the shell probe's undeclared copies of `NESTED_USERNS_PROBE`, `NESTED_USERNS_HELPER` and `BWRAP_USERNS_RESTRICT_PROFILE_PATH`) is resolved. `task_2_plan.md` now replaces the header's *"is not a mirror of this module"* sentence with a declared mirror entry. `task_5_plan.md` names the three values in the library's `MIRROR OF` block and asserts each against the owner's exports.

## Must Fix

1. **The install step's copy of `NESTED_USERNS_PROBE` is declared as a mirror, but no case holds it equal to the owner** — `task_3_plan.md` (the `workflow-sandbox-install.test.mjs` stub-world and new-cases sub-steps).
   Task 2 (`task_2_plan.md` → **DECLARED MIRRORS**) and Task 3 (`task_3_plan.md` → **DECLARED MIRRORS** in the template header) both list `NESTED_USERNS_PROBE` as something `cli/templates/github/workflows/harness-run.yml` → `Install the sandbox prerequisites` mirrors, *"still held by `cli/test/workflow-sandbox-install.test.mjs`"*. The step hard-codes the vector as the literal `bwrap --unshare-user --dev-bind / / -- unshare -U -r true`.
   Task 3's test plan holds every other new mirrored value to the owner:
   - case (c) holds the four path lines;
   - case (d) holds `APPARMOR_LOAD_COMMAND`;
   - case (g) maps `bwrapUsernsRestrictRemedy()` onto the recorded calls.

   The `bwrap` stub it adds only exits 0 or 1 by the `nested` option, plus a special case for `cat /proc/self/attr/current`. It never records or checks its arguments, and no case compares the step's verification command with `NESTED_USERNS_PROBE`. A typo in the step's vector would therefore pass every case, and the probe runner's byte copy (Task 6) would inherit it. In the job that means a check other than the one `doctor` and the watcher run.
   The owner's header states the rule this breaks (`cli/src/doctor/sandboxPrerequisites.ts`): *"every other copy is a declared mirror held equal by a test"*. `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` adds that a value is imported from its owner rather than retyped. `.claude/context/cli.md` → `## What "done" means here` requires a change to satisfy the rule its module's header states. A declared mirror that no test holds equal does not satisfy that rule.
   **Fix:** In `task_3_plan.md`:
   - Under **the stub world**, make the `bwrap` stub append its argument vector, one call per line, to a record file in the world, as the `apparmor_parser` recorder does.
   - Under **new cases**, add an assertion to case (g), or to a new case. On Linux with `nested: 'pass'`, the recorded verification call's arguments must equal `NESTED_USERNS_PROBE.slice(1)`, imported from the owner and never retyped. `NESTED_USERNS_PROBE[0]` must also be the stub's file name.
   - Add `NESTED_USERNS_PROBE` to the list of Task 2 imports the test reads.
   - In case (k), assert that the record file is absent or empty, so "no `bwrap` call is made" is graded on what reached the disk.

## Should Fix

_None._

## Nice to Have

_None._
