# Task plan review — iteration 0

## Must Fix

1. **The Gate 12 suites run the round driver in place, and it sources the self-adopted run library, which keeps the old config name until the cutover** — `task_26_plan.md` (and `task_16_plan.md`, which creates the mismatch)
   `scripts/lib/gate12-sandbox-round/preflight.sh` → `g12_preflight` sources the run library relative to its own location: `lib="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)/lib/harness-run-lib.sh"`. Run in place, that is this checkout's `scripts/lib/harness-run-lib.sh`. `## Context` puts that file out of reach of every task, and it reads `f="${root%/}/harness.config.json"`. `cli/test/helpers/gate12-round.mjs` → `runRound` defaults `script` to `ROUND_SCRIPT = join(WORKSPACE_ROOT, 'scripts', 'gate12-sandbox-round.sh')`, so it runs the driver in place. No `runRound(` call in `gate12-sandbox-round-grade.test.mjs` or `gate12-sandbox-round-full-run.test.mjs` passes `script:`.
   Once Task 16 changes preflight's `[ -f "$G12_ROOT/harness.config.json" ]` check to `devscene.config.json`, and Task 26 changes the helper's fixture key to `'devscene.config.json'`, the check passes. Then the old library's `hr_state_dir` / `hr_scripts_dir` / `hr_default_branch` look for `harness.config.json` in the fixture, find nothing, and preflight refuses. These suites therefore fail from Task 26 until the maintainer's cutover:
   - Task 26's own Verification (*"Each target test file passes"*) cannot be met for `gate12-sandbox-round-grade.test.mjs` and `gate12-sandbox-round-full-run.test.mjs`, nor for the in-place cases of `gate12-sandbox-round-cli.test.mjs`.
   - Phase G, which runs before the cutover, goes red.

   Task 26's library switch covers only suites that `cp` or source `join(WORKSPACE_ROOT, 'scripts', 'lib', 'harness-run-lib.sh')` themselves. It does not cover a driver that sources the library by its own path. `scripts/lib/sandbox-probe/preflight.sh` → `sp_preflight` has the same in-place shape (`lib="$probe_scripts/lib/harness-run-lib.sh"`). Check every target suite that runs the probe in place against this case too.
   **Fix:** In `task_26_plan.md`, add a Work bullet that runs the Gate 12 driver in each affected suite from a copy outside the fixture repository. The copy is `scripts/gate12-sandbox-round.sh` plus `scripts/lib/gate12-sandbox-round/`, placed beside `cli/templates/scripts/lib/harness-run-lib.sh` copied to `lib/harness-run-lib.sh`, the layout `gate12-sandbox-round-cli.test.mjs` already builds near its `cp(join(WORKSPACE_ROOT, 'scripts', 'gate12-sandbox-round.sh'), script)` line. Make it the `helpers/gate12-round.mjs` default, so `runRound` / `ROUND_SCRIPT` no longer resolve to the in-place driver. Do the same for any target suite that runs `scripts/sandbox-probe.sh` in place against a renamed-config fixture.
   - Extend `## Context` → *This repository's own adoption is cut over by the maintainer* so it names this in-place sourcing path beside the four copying suites.
   - Add a Verification bullet to `task_26_plan.md` showing that no target suite runs `ROUND_SCRIPT` in place against a `devscene.config.json` fixture.

2. **The task prompt's first two *Done when* criteria map to no task** — `task_35_plan.md`
   The task prompt's *Done when* requires: *"A fresh `init` in a scratch repository writes only the new names"* and *"`doctor` passes there."* No per-task file checks either one:
   - Task 19 explicitly asserts no absence (*"No case asserts that an old name is absent"*).
   - Task 35's closing check is a `git grep` over this checkout only.
   - No file runs `doctor` against a freshly initialized repository.

   Every task-prompt requirement must map to at least one per-task file.
   **Fix:** In `task_35_plan.md`, add a Verification step:
   - Build the CLI with `commands.build`.
   - Create a throwaway `git init` repository under the system temp directory, outside any checkout, and run the built CLI's `init` there non-interactively.
   - Grep the written tree, `.claude/` and the state directory included, with the same old-name pattern the closing check uses, and require no hit.
   - Run the built CLI's `doctor` in that repository and record its exit status and any `fail` lines. A `fail` caused by a renamed name is a defect of this branch.
   - Have the closing report state both results.

## Should Fix

1. **`## Context` counts four commits for the configuration contract but lists three tasks** — the story index (`chore_devscene_adopter_layout_story_plan.md`), `## Context` → *Order, and the tree guards that force it*, first bullet: *"in four consecutive commits: Task 15 …, then Task 1 …, then Task 36"*. Three tasks, three commits (Task 1 covers both `model.ts` and `check.ts`). **Fix:** say "three consecutive commits covering the contract's four places".

2. **A stray non-task file sits in `task_files_dir`** — Correspondence: `harness-runs/task_plans/chore_devscene_adopter_layout/_renumber.txt`, whose only content is `placeholder`, maps to no readiness entry. It is not a `task_<N>_plan.md`, so it breaks no 1:1 mapping, but it is a leftover the committer would stage with the plan. **Fix:** delete it.

## Nice to Have

- `## Rejected findings` → *Should Fix 1* (the CLI names the renamed slash commands before the plugin ships them) was tested against the tree. Its reason holds: `remote-run.sh` checks `$HARNESS_MENTION_PLUGIN_DIR/commands/<basename>.md`, the installed plugin, and `init` only prints the command. It is not re-raised.
