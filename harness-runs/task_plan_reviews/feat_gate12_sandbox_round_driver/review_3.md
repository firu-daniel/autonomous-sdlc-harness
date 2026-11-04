# Task plan review — iteration 3

All three Must Fix findings from `review_2.md` are resolved in the files:
- Task 14's `**Work:**` list has five bullets.
- `ghStub` has a `synthesiseRun: true` run listing and `ghStubRuns`. Both are restated under **Depends on:** in Tasks 11 and 12.
- Task 3 verifies its mechanics without Task 4, and the `plant --row JS1` end-to-end check is now Task 4's. Task 1 states the `g12_need g12_preflight` → `g12_preflight` → `g12_need <fn>` order, and Task 2 restates it.

Both round-2 Should Fixes are applied:
- FR3 reads each job's last `job: <final> <decision>` line (Tasks 8 and 14).
- `g12_branch_build` creates no ref. `g12_branch_push` records the name before `update-ref` and the push (Task 3).

Re-run of the Scope register:
- **Entry 1:** re-ran verbatim. It reaches 22 sites: `docs/cli.md` ×4, `docs/development.md` ×5, `docs/outer-loop-verification.md` ×3, `docs/remote-execution.md` ×7 and `docs/sandbox-verification.md` ×3. Every one is a row (rows 1–22).
- **Entry 2:** re-walked. All 16 §10 rows are rows 23–38.
- **Entry 3:** re-walked. Task 16's and Task 18's targets are rows 1, 2 and 39.

The source anchors the plan cites resolve in the shipped files:
- `cli/templates/scripts/autonomous-watcher.sh`: `run_job`, `check_stalled_runs`, `stall_job_surfaces_ok`, `spawn_refuse` and `spawn_engine`.
- `cli/templates/scripts/lib/harness-run-lib.sh`: `hr_remote_copy_tree`, `hr_remote_bundle_source_ok`, `hr_remote_status_write` and `hr_remote_move_aside`.
- `cli/templates/scripts/remote-run.sh`: `verb_save`, `verb_restore` and `save_link_free`.
- `cli/src/generators/writeProtection.ts`: `protectedPaths`, `jobSurfacePaths`, and the `PROFILE_PATH` / `CONFIG_FILENAME` entries.
- `cli/templates/github/workflows/harness-run.yml`: the step names, `run-name`, and the `STALL_*` / `HARNESS_GITHUB_DEFAULT_BRANCH` `env:` lines.
- The log strings the grades match.

The findings below are new.

## Must Fix

1. **The fixture does not ignore the scratch directory, so the "checkout unchanged" checks cannot pass** — `task_10_plan.md`, with consumers `task_11_plan.md`, `task_3_plan.md` and `task_4_plan.md`.
   - **Where the script writes.** `plant` writes its state file into the Gate 12 checkout itself: `$G12_ROOT/$G12_STATE_DIR/scratch/gate12-sandbox-round/state.json` (Task 2, `g12_scratch_dir`).
   - **Why a real repository stays clean.** In a real adopted repository that path is ignored. The managed `.gitignore` block ignores `<stateDir>/scratch/` by its contents (`cli/templates/repo/gitignore` → `{{scratchGlob}}`, filled from `scratch.contents` in `cli/src/generators/repoRoot.ts`). Task 2's own header relies on this.
   - **Why the fixture does not.** Task 10's `makeGate12Fixture` seeds only `harness.config.json`, `.claude/settings.json`, `.github/workflows/harness-run.yml` and the stub `<scriptsDir>/remote-run.sh`. It has no `.gitignore` and no exclude rule. So after `plant`, `git status --porcelain` in the fixture lists `?? sdlc-harness/`.
   - **What breaks.** These checks fail as written:
     - Task 11, the `**Work:**` bullet: *"The fixture checkout's `git status --porcelain`, `git rev-parse HEAD` and index hash are byte-identical before and after."*
     - Task 3, Verification: *"the fixture checkout's `git status --porcelain` and `HEAD` are unchanged"*.
     - Task 4, Verification: *"The fixture checkout's `git status --porcelain` is unchanged."*
   - **Why the implementer cannot fix it.** `cli/test/helpers/gate12-round.mjs` is not among Task 11's `### Targets`. Task 11's implementer would have to weaken the assertion, edit another task's file, or guess at a workaround.

   **Fix:**
   - In `task_10_plan.md`, have `makeGate12Fixture`'s seed commit carry a `.gitignore` with the scratch contents rule, written the way `init`'s managed block writes it for the configured `stateDir` (the rule `scratchGlob` renders). That way the fixture is ignored the way an adopted Gate 12 repository is. Add a case asserting that a file written under `<stateDir>/scratch/gate12-sandbox-round/` leaves `git status --porcelain` empty.
   - Restate that seeded ignore rule under **Depends on:** in `task_11_plan.md`.
   - Name the same `.gitignore` line in the fixture description of the Verification bullets in `task_3_plan.md` and `task_4_plan.md`.

2. **The default-branch leg can lose the record of a branch it created, so `teardown` never removes it** — `task_5_plan.md`, with its test `task_12_plan.md`.
   - **The steps.** Task 5's Work, step 2, runs `git push --no-verify origin refs/remotes/origin/<default>:refs/heads/<other>`, **then** records `other_branch`. `other_branch` is a single key (Task 2's `state.sh` shape). Task 5's refusals check only *"`default_branch` is already recorded and differs from the live default"*.
   - **Path 1, an interrupt between the push and the record.** The trap restores the default branch and the variables. But `<other branch>` is on origin and never recorded.
   - **Path 2, a second `default-branch` run on the same state file.** This is the natural retry after Task 12's own failure case, *"the dispatch's `remote-run.sh` stub exits 3"*. `default_branch` is recorded and equal to the live default, so nothing refuses. A new `gate12_other_<stamp>` is pushed, and `other_branch` is overwritten. The first `<other branch>` is then unrecorded, and `teardown` (Task 9, which deletes *"`branches[]` plus `other_branch`"*) never deletes it.
   - **What this contradicts.**
     - The story index's own invariant: *"so no ref this script creates is ever unrecorded"*. Task 3 enforces it for `branches[]` by recording before the push and refusing an already-recorded arm. Task 5 does neither for `<other branch>`.
     - `harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create."*

   **Fix:**
   - In `task_5_plan.md`, under "Refusals and recording, before anything changes", add: refuse (2) when `other_branch` is already recorded, naming `teardown`. This is the same per-arm refusal `g12_plant_cmd` applies. Also record `other_branch` through `g12_state_update` **before** the `git push … refs/heads/<other>`. A record left after a failed push is harmless: Task 9 deletes only when `git ls-remote --heads origin <name>` lists the branch, and then drops the name.
   - In `task_12_plan.md`, add a case: a state file whose `other_branch` is already recorded makes `default-branch` exit 2, with no push to the bare origin and no `repo edit` call in the stub log.

## Should Fix

- **Task 12's failed-dispatch case has no stated way to make the stub `remote-run.sh` fail** (`task_12_plan.md`, `task_10_plan.md`).
  - **The gap.** Task 10's fixture writes a stub that *"appends its argv to a log and exits 0"*, with no option to change its exit code. Task 12 still asks for *"the dispatch's `remote-run.sh` stub exits 3"*.
  - **The fix.** Choose one:
    - add a `remoteRunExit` option (default `0`) to `makeGate12Fixture` and restate it in Task 12's **Depends on:**;
    - or have Task 12 state that it rewrites the stub in the fixture's working tree before that case. The script runs the working-tree copy, and Task 12 asserts nothing about `git status`.

## Nice to Have

- As in rounds 0–2, the readiness list puts the catch-all `general` Tasks 1–9 ahead of the `cli` tests, because each test drives a script that must already exist. No `**Depends on:**` link points forward, and the **Ship order.** paragraph argues the order. Noted, not graded.
