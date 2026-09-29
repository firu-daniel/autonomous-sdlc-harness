## No single-file test command is stated, so implementers ran or skipped new tests inconsistently
- **category:** agent-contract
- **evidence:** neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states the single-file test command `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 3 reads as `<test_file_cmd>`. The Task 2 and Task 3 implementers, and the Phase C Item 2 and Item 3 implementers, each built their own command from the runner (`node --test test/init.test.mjs`, `node --test cli/test/doctor.test.mjs`, `node --test --test-timeout=1800000 test/doctor.test.mjs`, `node --test cli/test/workflow-plugin-pin.test.mjs`). The Task 4 implementer took the rule's skip arm instead ("skipped: no single-file command stated") for its new `cli/test/workflow-plugin-pin.test.mjs`. That file failed with ENOENT before any case ran, because its template path left out `templates`. The failure was found and fixed only by the Phase C Item 3 implementer (commit eb7ec9b, deviation note in `harness-runs/code_reviews/fix_remote_plugin_version_pin_code_review/finding_1.md`).
- **cost this run:** a new test file was committed broken in Task 4 (f4434ee) and stayed broken through the Phase A2 and Phase B reviews.
- **hypothesis:** two agents resolved the same missing value two ways: one improvised a command, the other skipped the run.

## `bash -n`, `chmod` and `printenv HOME` refused by the unattended permission profile
- **category:** tooling-gap
- **evidence:** the Task 5 implementer reports `bash -n scripts/tag-release.sh` refused "in both path spellings" and `chmod 755` refused. The Task 6 implementer reports `bash -n scripts/probe-plugin-cli.sh` refused. The Phase G test-fix-plan-writer reports `printenv HOME` refused. `scripts/tag-release.sh` and `scripts/probe-plugin-cli.sh` were committed at mode 644 (59f2fd0, 5df3960), while the implementer found `scripts/publish-main.sh` and `scripts/run-gates.sh` tracked at 755.
- **cost this run:** two new shell scripts shipped without a syntax check and without the executable bit their siblings carry.

## Row A's commit_prefix rule contradicts the project's commit-message policy
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A` derives `commit_prefix` from the branch name (`fix_` → `fix`). `.claude/context/conventions.md` → `## Commit-message policy` says a story task's commit takes prefix `none`. The committer passed `fix` as instructed, then flagged the conflict on its Task 2 return (c2f6547) and again on Task 7 (1a105e9). All nine task commits f963baf..db7104f carry `fix:`, while the fix-row commits, where the loop defers to the committer's designation, carry none.
- **cost this run:** nine task commits whose subjects break the repository's own policy.

## A leftover scratch probe with the checkout's absolute path failed the first Run gates round
- **category:** agent-contract
- **evidence:** the Task 1 implementer wrote `harness-runs/scratch/t1_probe.mjs` (a gitignored throwaway probe, named in its return) and left it in place. Run gates round 1 failed gate 6a on that file alone (`harness-runs/test_run_logs/fix_remote_plugin_version_pin/task_round_1.log`). Round 2 passed after the file was deleted (`harness-runs/test_fix_plans/fix_remote_plugin_version_pin_task_round_1.md`).
- **cost this run:** one extra gate round and 5 dispatches (test-fix-plan-writer, architecture-reviewer, 2 committers, layer-implementer).

## Index-only commit
- **category:** optimization
- **evidence:** Finding 1 of `harness-runs/test_fix_plans/fix_remote_plugin_version_pin_task_round_1.md`, commit 0985d4d, "gitignored scratch probe deleted, no tracked diff".
- **cost this run:** one unit closed on a commit that staged no work file.

## Corpus staleness reported by the plan writer
- **category:** tooling-gap
- **evidence:** undescribed-layer — `scripts/` at the repository root is covered only by the catch-all `general` layer (`path: "."`). It holds hand-written maintainer scripts (`publish-main.sh`, `run-gates.sh`, `measure-suite.sh`, and now `tag-release.sh` and `probe-plugin-cli.sh`) beside the wrappers `init` generates, while `.claude/context/conventions.md` → `## Documents of record` describes the whole directory as `init`'s output.
- **cost this run:** owes a supervised remedy: a `/autonomous-sdlc-harness:harness-analyze` run answered `skip` for every already-filled document (never `--yes`), then `npx autonomous-sdlc-harness config set layers`.
