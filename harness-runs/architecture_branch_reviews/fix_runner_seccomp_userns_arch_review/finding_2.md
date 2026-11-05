### 2. The workflow's install step now sources the run library and calls `hr_sandbox_opted_out`, and neither file declares that dependency

**Site:** `cli/templates/github/workflows/harness-run.yml`, step `Install the sandbox prerequisites`, the line beginning `if [ -n "${SCRIPTS_DIR-}" ] && [ -f "$SCRIPTS_DIR/lib/harness-run-lib.sh" ] && ( . "$SCRIPTS_DIR/lib/harness-run-lib.sh" && hr_sandbox_opted_out "$PWD" )`. The other end is `cli/templates/scripts/lib/harness-run-lib.sh` → the header paragraph `WHO SOURCES THIS, AND HOW.`

**Problem.** Before this branch, the workflow reached the scriptsDir family only by running a script (`bash "$SCRIPTS_DIR/<script>.sh" …`). Now an inline `run:` body sources the library itself and depends on one of its function names. Neither side records this:

- The workflow's own header block, `DECLARED MIRRORS — a rename on either side is an edit to both:`, lists its name-level dependencies on other files. It does not list `harness-run-lib.sh` → `hr_sandbox_opted_out`.
- The library's `WHO SOURCES THIS, AND HOW.` paragraph describes only scripts in `scriptsDir`, sourced from `${BASH_SOURCE[0]}`. It does not name the workflow step as a sourcer.
- `cli/test/workflow-sandbox-install.test.mjs` writes its own stub `hr_sandbox_opted_out() { return 0; }` into the fixture library. So renaming the real function would leave that test green while the step's subshell fails with `command not found`. An opted-out repository would then have its job stopped with `::error::` instead of the intended warning.

This is the silent cross-file wire that `.claude/context/conventions.md` → *"A literal only one side knows about is a silent contract break"* warns about. It is also contrary to `.claude/context/cli.md` → `## What "done" means here` (*"A reviewer holds a change to its module's own header"*). Graded **Should Fix**: neither header states a rule that this sourcer breaks outright. The dependency is real but undeclared, and the only test of it would not catch a rename.

**Fix.**
- [x] In `cli/templates/github/workflows/harness-run.yml`, add an entry to the `DECLARED MIRRORS` block, aligned like the others: `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_opted_out`, sourced from `$SCRIPTS_DIR/lib/` by `Install the sandbox prerequisites` to read `sandbox.optOut` on its failing arm.
- [x] In `cli/templates/scripts/lib/harness-run-lib.sh`, extend the `WHO SOURCES THIS, AND HOW.` paragraph with one sentence naming the one non-script sourcer: the `harness-run.yml` step `Install the sandbox prerequisites`, which sources it in a subshell from `$SCRIPTS_DIR/lib/harness-run-lib.sh` (a value read from configuration, not a hardcoded path) and calls only `hr_sandbox_opted_out`.
- [x] Mirror the library edit byte-for-byte into the self-adopted `scripts/lib/harness-run-lib.sh`, which matches the template on this branch.
- [x] Optionally, in `cli/test/workflow-sandbox-install.test.mjs`, add an assertion that the function name the step calls is defined in the real `cli/templates/scripts/lib/harness-run-lib.sh` (read as text), so a rename fails a test. If this lands, it is that test file's own edit, run through the unit's own test-file command only.

**Implementation notes (cli layer):**
- The optional test landed as case `(j2)`: it takes the function name from the step body's `/lib/harness-run-lib.sh" && <name> ` call and asserts `^<name>() {$` in the real template library. The new mirror entry therefore ends `held by workflow-sandbox-install.test.mjs`, like the `sandboxPrerequisites.ts` entry.
- Mutation evidence: a scratch probe (`harness-runs/scratch/j2_mutation.mjs`, run through `bash scripts/scratch-run.sh`) applied the same regex to the real library (`true`) and to a copy with the function renamed to `hr_sandbox_opt_out` (`false`).
- The third sub-step, mirroring the library header into the self-adopted `scripts/lib/harness-run-lib.sh`, sits outside `cli/` and belongs to the `general`-layer dispatch of this finding (`_(layer: cli, general)_`). This dispatch did not touch it. The template paragraph to copy byte for byte is the one that begins `The one sourcer that is not a script is`.

**Implementation notes (general layer):**
- The `WHO SOURCES THIS, AND HOW.` paragraph of `scripts/lib/harness-run-lib.sh` now carries the same five comment lines as the template. `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` reports no difference. No self-adopted `harness-run.yml` exists under `.github/workflows/`, so the workflow side has nothing to mirror.
