# Architecture review — iteration 1

Iteration 0's Must Fix is resolved. `task_1_plan.md`'s DECLARED MIRRORS run-library bullet and `task_3_plan.md`'s `MIRROR OF cli/src/doctor/sandboxPrerequisites.ts` block now both name `SANDBOX_INSTALLERS` and `WSL1_AGENT_MESSAGE`. Task 3's host matrix now checks `HR_SANDBOX_REFUSAL` against the imported `installCommands(missing)` and `WSL1_AGENT_MESSAGE`. Iteration 0's two Should Fix items are neither resolved in the plan nor listed in a `## Rejected findings` section, so both are raised again below. Neither one blocks.

The rest of the plan checks out against the rules:
- Layer placement holds. `cli/src/doctor/sandboxPrerequisites.ts`, `cli/test/*.test.mjs` and the `cli/templates/scripts` / `cli/templates/github` edits are tagged `cli`. `docs/` and `ROADMAP.md` are tagged `general`.
- The dependency direction holds. The new module is pure, `checks.ts` imports it and `config/model.ts`, and nothing points back.
- No shell change lands under the root `scripts/` copies.
- Every new `cli/src` module carries its header, and every new behaviour lands with its own new suite.
- Every `**Verification:**` bullet names only the unit's own new or edited test file, in line with `unit_loop_core.md` → `## The test-run rule`.

## Must Fix

_None._

## Should Fix

1. **The shell probe's mirror still points at a module that does not own the probe** — `task_1_plan.md`, `task_2_plan.md` and `task_3_plan.md`. Re-raised from iteration 0 (Should Fix 1). It was not addressed and not recorded as rejected. Rule sources:
   - `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header"*.
   - `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`: *"a mirror the header does not declare is a defect"*.
   - The task prompt's goal 3: *"The mirror is declared in both headers, the owner's and the mirror's."*

   What the plan does now:
   - Task 1's module-header bullet still says *"Its `hr_sandbox_prereq_probe_var` mirrors the live probe's platform, kernel-release and `PATH` reads"*. That declaration sits in `sandboxPrerequisites.ts`, and Task 1 states that this module reads nothing.
   - Task 3's header block puts the same clause under `MIRROR OF cli/src/doctor/sandboxPrerequisites.ts`.
   - Task 2 places the probe, `probeSandboxHost`, in `cli/src/doctor/checks.ts`. Its planned doc comment names the watcher's probe only as *"the authority for the daemon's `PATH`"*, and never declares it as a mirror.

   So the module that owns the probe carries no mirror declaration, and the module that carries one does not own the probe. Renaming the probe, or changing what it reads, would not show up as an edit to the shell mirror.

   **Fix:**
   - In `task_2_plan.md`, make `probeSandboxHost`'s doc comment declare `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_prereq_probe_var` as its shell mirror, held equal by `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`.
   - In `task_1_plan.md`, reword the probe clause of the run-library bullet so it names `cli/src/doctor/checks.ts` → `probeSandboxHost` as that half's owner, or drop the clause.
   - In `task_3_plan.md`, move the probe clause out of the `MIRROR OF cli/src/doctor/sandboxPrerequisites.ts` block into its own `MIRROR OF cli/src/doctor/checks.ts → probeSandboxHost` line.

2. **The workflow step still retypes the installer families without declaring them** — `task_5_plan.md`, with the matching bullet in `task_1_plan.md`. Re-raised from iteration 0 (Should Fix 2). It was not addressed and not recorded as rejected. Rule source: `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"*.

   The step installs through `apt-get` and falls back to `dnf`. That is `SANDBOX_INSTALLERS`' family set, in the same order. But Task 5's `# DECLARED MIRRORS` entry and Task 1's workflow bullet still list only the packages, the two paths, `bwrapAppArmorProfile()` and `APPARMOR_RELOAD_COMMAND`. The step's flags (`-y -qq`, `sudo -n`) legitimately differ from the owner's adopter-facing commands, so this is not a byte copy. The installer families and their order still belong to the owner.

   **Fix:**
   - Name `SANDBOX_INSTALLERS`' families (`apt-get`, then `dnf`) in Task 5's `# DECLARED MIRRORS` entry and in Task 1's workflow mirror bullet.
   - Add a case to `cli/test/workflow-sandbox-install.test.mjs` asserting that the step tries the installers in the owner's family order. Derive that order from the imported `SANDBOX_INSTALLERS` rather than retyping it.

## Nice to Have

_None._
