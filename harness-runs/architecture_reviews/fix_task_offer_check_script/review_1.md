# Architecture review — iteration 1

Reviewed against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md` and `plugin/instructions/unit_loop_core.md` → `## The test-run rule`.

Iteration 0's Must Fix is resolved: `task_3_plan.md` now tells the implementer to rewrite the closing sentence of `projectSettings.ts`'s header. Layer placement still holds. Tasks 1–5 are under `cli/`, Task 6 is under `plugin/hooks/`, and Tasks 7–9 are under `docs/`, `scripts/` and `examples/` (`general`).

Dependency direction still holds:
- `claudeContext.ts`, `projectSettings.ts` and `doctor/checks.ts` import the name, the invocation and the rule from `outerLoopScripts.ts`, the module that owns the table. `checks.ts` already imports from both generators.
- `scriptInvocation` stays the one producer of the invocation.
- The library functions the script reuses (`hr_repo_root`, `hr_main_repo`, `hr_copy_sync_main_of`, `hr_clone_target_check_var`) all exist in `cli/templates/scripts/lib/harness-run-lib.sh`.
- `writeProtection.ts` → `protectedPaths` really does pick up a top-level row that is not `runsUnsandboxed` and is not the docs launcher.

No `**Verification:**` bullet asks for a forbidden test run. The one remaining problem is the same kind as iteration 0's, in a different module: a doc-comment claim that Task 4 makes false without telling the implementer to change it.

## Must Fix
1. **Task 4 makes the closing claim of `TASK_OFFER_RULES_CHECK`'s doc comment false without amending it** — `task_4_plan.md`. This breaks `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit."*
   The doc comment on `TASK_OFFER_RULES_CHECK` in `cli/src/doctor/checks.ts` ends with *"It reads one file, tests one for existence, and writes none."* Task 4's new arms make the check do more than that:
   - It now also reads `.claude/settings.json`.
   - It now also tests `<scriptsDir>/task-offer-check.sh` for existence.

   So it reads two files and tests two for existence. The plan's "**The doc comment.**" bullet only lists additions: the two arms, why they warn, why they are gated, and why they live here rather than in `plugin-wiring`. The Work bullet's *"The check still reads files and writes none"* is guidance for the code, not an instruction to change that sentence. An implementer who follows the list exactly leaves a doc comment that misstates what the check reads.

   **Fix:** In `task_4_plan.md` → the "**The doc comment.**" Work bullet, add an instruction to rewrite the closing sentence *"It reads one file, tests one for existence, and writes none."* The new sentence should say that the check reads `.claude/CLAUDE.md` and, on the new arms, `.claude/settings.json`; that it tests the rules file and, on the new arms, the fence's script for existence; and that it still writes none.

## Should Fix
- `task_4_plan.md`: the new arms only run when the project file contains `taskOfferCheckInvocation(ctx.config)`, which is built from the *current* `scriptsDir`. Both `.claude/CLAUDE.md` (`create-if-absent`) and `.claude/settings.json` (an existing `permissions.allow` is kept) freeze the `scriptsDir` that was configured when `init` ran (`.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`). So a repository that later changes `scriptsDir` breaks without a warning:
  - The fence runs a path that no longer exists, so it stays silent.
  - `doctor` grades the file "exactly as today", with no warning.

  The task prompt requires the placeholder, so freezing the value is licensed. The gap is that nobody reports the drift. Consider also gating on a fence that names any `bash …/task-offer-check.sh` span, and warning when that span differs from the current invocation.

## Nice to Have
- `task_4_plan.md`: `TASK_OFFER_RULES_CHECK.title` (*"the change-request offer's rules file is there for the fence that points at it"*) and the doc comment's opening line only talk about the rules file. Once the check also grades the script and the allow rule, consider widening both.
