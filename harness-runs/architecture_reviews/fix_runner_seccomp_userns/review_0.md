# Architecture review — iteration 0

## Must Fix

1. **The shell probe's copies of `NESTED_USERNS_PROBE`, `NESTED_USERNS_HELPER` and `BWRAP_USERNS_RESTRICT_PROFILE_PATH` are never declared as mirrors of their owner, and the owner's header keeps saying the probe is not its mirror** — `task_2_plan.md` (the **DECLARED MIRRORS** sub-step) and `task_5_plan.md` (the library header's `MIRROR OF cli/src/doctor/sandboxPrerequisites.ts` block).
   Task 2 makes `cli/src/doctor/sandboxPrerequisites.ts` the one owner of `NESTED_USERNS_PROBE`, `NESTED_USERNS_HELPER` and `BWRAP_USERNS_RESTRICT_PROFILE_PATH`. Task 5 then hard-codes all three as literals in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_prereq_probe_var`: `command -v unshare`, `bwrap --unshare-user --dev-bind / / -- unshare -U -r true` and `[ -e /etc/apparmor.d/bwrap-userns-restrict ]`. Task 5's test holds the argument vector equal to `NESTED_USERNS_PROBE.slice(1)`, but neither header declares that copy:
   - Task 2's DECLARED MIRRORS update covers only the shell **judge** (*"mirrors `NestedUsernsAnswer` and the stock-profile half of the refusal"*). It does not touch the owner header's existing sentence *"That library's `hr_sandbox_prereq_probe_var` is not a mirror of this module: it mirrors the live probe"*. After Task 5, that sentence is false, because the probe carries three of this module's literals.
   - Task 5's update to the library's `MIRROR OF cli/src/doctor/sandboxPrerequisites.ts` block names `NestedUsernsAnswer` and *"the one stock-profile path"*. It does not name the nested check's argument vector or the `unshare` helper, which the probe now copies from this module.
   - Task 4's `probeSandboxHost` doc comment declares a mirror of the **probe's behaviour** (`cli/src/doctor/checks.ts`). It is not the owner of these values, so it cannot stand in for the owner's declaration.

   This breaks the rule the module exists to enforce. In the module's own header: *"the sandbox's host prerequisites are declared once, here, and every other copy is a declared mirror held equal by a test"*. `.claude/context/conventions.md` → `## Configuration is the source of truth…` adds that, where a shipped template must know the same literal, *"that mirror [is] declared in the owning module's header"*, and that *"a mirror the header does not declare is a defect"*. `.claude/context/cli.md` → `## What "done" means here` says a change to a module either satisfies the rule its header states or amends the header in the same edit.
   **Fix:** In `task_2_plan.md`, under **DECLARED MIRRORS**:
   - Replace the sentence *"`hr_sandbox_prereq_probe_var` is not a mirror of this module"* with a declared mirror entry. The entry says that `hr_sandbox_prereq_probe_var` mirrors `NESTED_USERNS_PROBE`, `NESTED_USERNS_HELPER` and `BWRAP_USERNS_RESTRICT_PROFILE_PATH`, held equal by `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`, and that it still mirrors `probeSandboxHost` for its platform, kernel-release and `PATH` reads, as `checks.ts` declares.

   In `task_5_plan.md`:
   - Extend the library header's `MIRROR OF cli/src/doctor/sandboxPrerequisites.ts` block to name the same three values.
   - Make the test assert the stock path and the `unshare` helper against the owner's exports as well as the vector. The stub `bwrap` is called only when `command -v` resolves `NESTED_USERNS_HELPER`, and the probe tests the presence of `BWRAP_USERNS_RESTRICT_PROFILE_PATH`, both read from the module and not retyped.

## Should Fix

_None._

## Nice to Have

_None._
