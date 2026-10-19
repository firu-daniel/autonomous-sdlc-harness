# Architecture review — iteration 1

## Must Fix

None. Iteration 0's Must Fix is resolved. The sync-in fetch's measured pins now have their record in `docs/cli.md` §6: Task 15's **Record the measured fetch pins.** bullet writes it in the documents-of-record shape. Task 5's header names `docs/cli.md` §6 as the record. Task 2's section header cites §6 and names the suite only as the re-check. Task 16's sync-in row cites §6 and its verification greps for that.

The other checks found nothing:

- **Placement.** Every target sits in the layer its tag names. Shell is under `cli/templates/scripts/`, TypeScript under `cli/src/generators/` and `cli/src/doctor/`, suites at `cli/test/<kebab-case>.test.mjs`, and `docs/` and `examples/notes-app/` are tagged `general`. Nothing touches `plugin/`.
- **Dependency direction.** The wrappers and the watcher family call into the library, and the library calls no wrapper. `cli/src/doctor/checks.ts` already imports from `cli/src/generators/stateDir.ts` (`selectedStateDirs`), so the moved constants add no new edge kind. `stateDir.ts` imports nothing from `repoRoot.ts` or `writeProtection.ts`, so no cycle forms.
- **Accompanying set.** Every new suite opens with its rule. The generator change in Task 12 lands with a `profile.test.mjs` case and a `doctor-profile-sandbox.test.mjs` case.
- **`rm -rf` in Task 3.** The plan says the removal is "a script-internal call like the library's existing temp-directory removals". I checked that claim, and it holds: the library already removes its temp directories with `rm -rf "$tmpdir"`.
- **Test-run rule.** Each verification runs only the unit's own new or edited suite. Tasks 7, 9 and 11 leave the existing suites to Run gates.

## Should Fix

1. **Task 12 makes `cli/src/generators/stateDir.ts` the owner of the `autonomous_logs` segment, but leaves `cli/src/generators/repoRoot.ts`'s private `const LOGS_DIR = 'autonomous_logs'` as a second source** — offending file: `task_12_plan.md`. Rule source: `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` (*"a value is imported from its owner rather than retyped"*), and `### Where a new responsibility goes` (*"Before adding a copy of anything, grep for it."*).

   Iteration 0 raised this as a Should Fix. The plan does not resolve it, and the index has no `## Rejected findings` entry for it. Task 12's last **Verification** bullet still expects the literal in `repoRoot.ts`'s "pre-existing `LOGS_DIR`, which this task leaves alone". Once `RUN_LOGS_DIR` is exported from `stateDir.ts`, that private constant is a retyped copy of the owned value. It predates this branch, so this is not a Must Fix.

   **Fix:** in `task_12_plan.md`, choose one of these:
   - Add a Work bullet that has `cli/src/generators/repoRoot.ts` import `RUN_LOGS_DIR` from `./stateDir.js` in place of its private `LOGS_DIR`. `stateDir.ts` imports nothing from `repoRoot.ts`, so no cycle forms. Then tighten the verification grep so the `'autonomous_logs'` literal is expected in `cli/src/generators/stateDir.ts` alone.
   - Or record the finding under the index's `## Rejected findings` with the reason `repoRoot.ts` keeps its own copy.

## Nice to Have

- This repeats iteration 0's note. `task_1_plan.md` (the `hr_wrapper_target_check_var` header bullet) and `task_4_plan.md` (the **Header first.** bullet) cite `docs/sandbox-verification.md` row CL5, which Task 14 writes thirteen units later. In the intermediate commits that citation points at a row that does not exist yet. Task 2's citation of `docs/cli.md` §6 already uses the wording *"(added by this branch)"*, and the same wording would make this gap visible to a mid-branch reader as well.
