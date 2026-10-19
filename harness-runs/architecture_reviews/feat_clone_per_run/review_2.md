# Architecture review — iteration 2

## Must Fix

None. Every task file and the story index were re-read in full. That includes Tasks 2, 3, 5, 7 and 9, revised since iteration 1. No layer-placement, dependency-direction or test-run violation remains.

- **Placement.** Every target sits under the `layers[].path` of the layer its readiness tag names:
  - `cli`: Tasks 1–13. Shell is under `cli/templates/scripts/`. TypeScript is under `cli/src/generators/` and `cli/src/doctor/`. Suites follow `cli/test/<kebab-case>.test.mjs`, and the profile template is `cli/templates/claude/settings.autonomous.json`.
  - `general`: Tasks 14–17, which touch `docs/` and `examples/notes-app/`.
  - No task touches `plugin/`. Each measured fact goes to `docs/` (`.claude/context/conventions.md` → `### Where a new responsibility goes`). Task 15 writes the fetch-pin record in `docs/cli.md` §6. Tasks 2, 5 and 16 cite it there and name the suite only as the reproduction.
- **Dependency direction.**
  - The wrappers, the watcher family and `setup-worktree.sh` call into the library. The library calls no wrapper.
  - The revised Task 2 keeps the sync pair off the watcher family's globals and `hr_run_main_git`. It does this through its own private runner, so the new section adds no back-edge into *THE WATCHER FAMILY'S GIT IN A RUN'S COPY*.
  - `cli/src/doctor/checks.ts` and `cli/src/generators/repoRoot.ts` already import from `cli/src/generators/stateDir.ts`. `stateDir.ts` imports nothing from `repoRoot.ts`, `writeProtection.ts` or `checks.ts`, so Task 12's moved constants form no cycle.
- **Module header held to the change** (`.claude/context/cli.md` → `## What "done" means here`). Tasks 3 and 7 now add each new writer to a write exception's "written only by" list and to the closing "only reads" list:
  - Task 3: `hr_registry_drop`, `hr_clone_create_var`, `hr_clone_remove_var`.
  - Task 7: `hr_run_copy_check_var`, qualified to a clone.

  Each task also checks that in its **Verification:**. Task 7 corrects exception 5's fence for the clone arm.
- **Accompanying set.** Every new suite opens with its rule. Task 12's generator change lands with a `profile.test.mjs` case and a `doctor-profile-sandbox.test.mjs` case.
- **Test-run rule** (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`).
  - Each **Verification:** names only the unit's own new or edited suite.
  - Tasks 7, 9 and 11 leave the existing suites to Run gates by name.
  - Task 17's `npm run build` and fixture `init` are not test runs.

## Should Fix

1. **Task 12 makes `cli/src/generators/stateDir.ts` the owner of the `autonomous_logs` segment, but keeps `cli/src/generators/repoRoot.ts`'s private `const LOGS_DIR = 'autonomous_logs'` as a second source** — offending file: `task_12_plan.md`. Rule source: `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` (*"a value is imported from its owner rather than retyped"*) and `### Where a new responsibility goes` (*"Before adding a copy of anything, grep for it."*).

   This is the third time this has been raised: iterations 0 and 1 both raised it. The plan has not changed. The story index has no `## Rejected findings` entry for it. Task 12's last **Verification:** bullet still expects the literal in `repoRoot.ts`'s "pre-existing `LOGS_DIR`, which this task leaves alone". The copy predates this branch, so this stays a Should Fix.

   The fix is a one-line import. `repoRoot.ts` already imports `STATE_DIR_ENTRIES` from `./stateDir.js` (line 97), so the edge already exists.

   **Fix:** in `task_12_plan.md`, choose one of these:
   - Add a Work bullet replacing `repoRoot.ts`'s private `LOGS_DIR` with an import of `RUN_LOGS_DIR` from `./stateDir.js`. Add `cli/src/generators/repoRoot.ts` to the Targets. Then tighten the verification grep so the `'autonomous_logs'` literal is expected in `cli/src/generators/stateDir.ts` alone.
   - Or record the finding under the story index's `## Rejected findings` with the reason the copy stays.

## Nice to Have

- This repeats iterations 0 and 1. `task_1_plan.md` (the `hr_wrapper_target_check_var` **Its header.** bullet) and `task_4_plan.md` (**Header first.**) still word their shipped citation as "Task 14's row CL5". Task 14 lands thirteen units later, so a mid-branch reader meets a citation to a row that does not exist yet.
  - Word both as `docs/sandbox-verification.md` row CL5 *(added by this branch)*, as `task_2_plan.md` already does for `docs/cli.md` §6.
  - Keep "Task 14" out of the shipped text.
