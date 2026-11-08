# Architecture review — iteration 0

## Must Fix

1. **Task 3 puts a `plugin/` file name into a `cli/src` string literal that is neither a doc comment nor `doctor`'s report text** — `task_3_plan.md`, Work bullet **`writeProtection.ts`, the write-protection line.**, and the matching assertion in the **`profile.test.mjs`, a new case** bullet. Rule source: `.claude/context/conventions.md` → `## The layers`, the bullet **Neither shipped half may reach into the other at run time.**: *"`cli/src` names `plugin/` files only inside doc comments and in `doctor`'s own report text"*.

   The plan inserts into the `appendReadme` string in `cli/src/generators/writeProtection.ts` → `applyWriteProtection` the sentence *"on a host sandboxed by bubblewrap the plugin's `git-trust-file-guard.sh` refuses `Edit`, `Write` and `NotebookEdit` on those three paths …"*. That string is generator output, rendered into every adopter's profile. It is not a doc comment, and it is not `doctor`'s report text. In `cli/src/generators/writeProtection.ts` today the guard's file name appears only in a doc comment (the `plugin/hooks/git-trust-file-guard.sh` mention inside the `/** … */` block). That module's run-time strings refer to *"the plugin guard hooks"* and name no file. The plan would put a `plugin/` file name into a `cli/src` run-time string, which the conventions document's list of permitted places does not allow. Task 3's test then makes `git-trust-file-guard.sh` part of the asserted contract, so the coupling would be enforced as well as introduced.

   **Fix:** In `task_3_plan.md`, rewrite the inserted sentence so it names no `plugin/` file. For example: *"on a host sandboxed by bubblewrap a harness plugin guard hook refuses `Edit`, `Write` and `NotebookEdit` on those three paths instead of a rule here (docs/sandbox-record.md residual 12)"*. Residual 12 in the record names the guard. In the new test case, replace the assertion that the line *"includes `git-trust-file-guard.sh`"* with one that it includes `residual 12` and `docs/sandbox-record.md`. Change the **Goal** sentence and the last **Verification** bullet to match: re-read the sentence against residual 12 and the `plugin/hooks/README.md` row, and confirm it names no plugin file. Placing the guard's name in the template `cli/templates/claude/settings.autonomous.json`, as Task 2 does for its residual line, is not affected. That file is under `cli/templates/`, not `cli/src`.

## Should Fix

_None._

## Nice to Have

_None._
