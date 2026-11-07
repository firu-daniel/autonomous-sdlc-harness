## A plan-mandated guard reproduction could not run under the unattended profile
- **category:** tooling-gap
- **evidence:** Phase A, Task 2 (`plugin/hooks/git-trust-file-guard.sh`). The `layer-implementer` reported its hand run of the guard's `REPRO` block refused three ways: a `$TMPDIR` test repo, a `git init` under `harness-runs/scratch/`, and a payload piped into the guard. It recorded this as reduced evidence in `harness-runs/task_plans/chore_unattended_sandbox_record/task_2_plan.md`.
- **cost this run:** the edited guard's `deny` reason was not executed in Task 2. Its first execution was Task 7's trio re-drive.

## Plan-named `bash -n` syntax checks were refused at the permission layer
- **category:** tooling-gap
- **evidence:** Phase A, Task 7. The `layer-implementer` reported both `bash -n` commands that `harness-runs/task_plans/chore_unattended_sandbox_record/task_7_plan.md` names for `scripts/lib/gate12-sandbox-round/grade-full-run.sh` and `grade-plant.sh` refused by the permission layer. It substituted the typecheck's shell-parse step and recorded an evidence downgrade.
- **cost this run:** one plan verification step was replaced by a coarser one.

## Two implementer returns reported no tree guard selected for changed `*.md` files
- **category:** agent-contract
- **evidence:** Phase A, Tasks 6 and 7. Both `layer-implementer` returns say no tree guard was selected. Both units changed `*.md` files (Task 6: `docs/watcher.md`, `docs/remote-execution.md`, `docs/sandbox-placeholder-upstream-report.md`; Task 7: `docs/development.md`, `docs/sandbox-verification.md` and others). `harness.config.json` `treeGuards` has an entry whose `covers` is `**/*.md` (`test/no-container-home-paths.test.mjs`). Tasks 3, 4, 5 and 8 selected and ran that guard for the same kind of change.
- **cost this run:** the guard was not run on two units. Phase G's whole suite ran it later and passed on round 2.

## A catch-all-layer dispatch edited another layer's paths and removed the prior layer's record in the same unit
- **category:** agent-contract
- **evidence:** Phase G, row G.4, Finding 1 of `harness-runs/test_fix_plans/chore_unattended_sandbox_record_task_round_1.md` (tag `cli, general`). The `cli` layer returned `blocker: already passing — …` and appended a `## Already passing` section to `harness-runs/test_fix_plans/chore_unattended_sandbox_record_task_round_1/finding_1.md`. The `general` layer dispatch then edited `cli/test/helpers/gate12-round.mjs` and `cli/test/gate12-sandbox-round-default-branch.test.mjs`, both under the `cli` layer's path, and removed that `## Already passing` section. The unit's commit (`32c9bf1f`) carries both the code change and the `already_passing:` record.
- **cost this run:** the unit's commit record disagrees with its detail file, and `cli`-path code landed under a `general` dispatch after the branch architecture review (Phase A2) had already passed.

## A suite file was cancelled at the 30-minute file timeout and did not reproduce
- **category:** flow-efficiency
- **evidence:** Phase G round 1, `bash scripts/run-test-suite.sh task_round_1` → `fail harness-runs/test_run_logs/chore_unattended_sandbox_record/task_round_1.log`. Per the `test-fix-plan-writer`'s return, the only failure was `cli/test/gate12-sandbox-round-default-branch.test.mjs` cancelled at the 1,800,000 ms file timeout (`# fail 0`, `# cancelled 1`). The branch had not changed the code that file exercises. The `cli`-layer implementer's single-file run then passed 12/12 in about 15 s.
- **cost this run:** one extra gate round, about 30 minutes of suite time, and three extra dispatches (test-fix plan, architecture gate, revision).
- **hypothesis:** a transient host stall or a blocked child process. The log does not say which.
