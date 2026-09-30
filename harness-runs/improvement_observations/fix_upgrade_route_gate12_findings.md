## No conventions document states a single-file test command, so every unit that edited a test file skipped running it
- **category:** tooling-gap
- **evidence:** the `layer-implementer` returns for Tasks 1, 2, 3 and 4 (layer `cli`, conventions `.claude/context/cli.md`, catch-all `.claude/context/conventions.md`) each reported the edited test file run as skipped: `cli/test/doctor.test.mjs` (Task 1), `cli/test/init.test.mjs` (Tasks 2 and 3), `cli/test/workflow-plugin-pin.test.mjs` (Task 4), all "no single-file command stated". Tasks 3 and 4 substituted throwaway probes under `harness-runs/scratch/` instead.
- **cost this run:** 4 units' new test cases were first executed at Phase G rather than inside their own unit; Phase G round 1's only failure was elsewhere (gate 6a), so nothing was lost this time.

## Row `A`'s branch-name `commit_prefix` rule conflicts with this repository's commit-message policy on every task commit
- **category:** agent-contract
- **evidence:** all six Phase-A `committer` dispatches were passed `commit_prefix: fix` (derived from the `fix_` branch name per `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`); every return reported the argument was not used because `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for a story task's commit. Commits ad3a3b5, 6e227b3, 20f13b4, bcecabc, 440fcb5, 6803b7a carry no prefix.
- **cost this run:** none to the output (the committer resolved it the same way six times); six returns carried the same override note.
- **hypothesis:** the committer contract calls a caller-chosen token outside the policy "not a legal value", so the row-`A` rule and the policy disagree whenever the policy designates `none` for new work.

## Gate 6a failed on an absolute home-directory path in the committed task prompt
- **category:** flow-efficiency
- **evidence:** Phase G round 1 (`harness-runs/test_run_logs/fix_upgrade_route_gate12_findings/task_round_1.log`) failed only gate 6a (no machine paths) on line 86 of `harness-runs/task_prompts/fix_upgrade_route_gate12_findings_task_prompt.md`, committed before launch in 2f4d13e; fixed by aa209d6 (test fix plan `harness-runs/test_fix_plans/fix_upgrade_route_gate12_findings_task_round_1.md`); round 2 passed.
- **cost this run:** one extra gate round and 4 dispatches (test-fix-plan-writer, architecture-reviewer, layer-implementer, committer).

## The task plan needed 3 review rounds; round 2 of the structural reviewer re-raised two unfixed Should Fix items
- **category:** optimization
- **evidence:** plan unit round artifacts: `harness-runs/task_plan_reviews/fix_upgrade_route_gate12_findings/review_0.md`, `review_1.md` and `harness-runs/architecture_reviews/fix_upgrade_route_gate12_findings/review_0.md` (3 total; the business-parity root has none, `phases.parity` is false). Per root: task-plan `review_0` 5 findings (first in its root); `review_1` vs `review_0` — 2 net-new (Must Fix: three other routes still say "commit the two workflows"; Nice to Have: scope register row 30), 2 re-raised (Should Fix: `git switch <branch>` stale local branch; case (d) inherits git config). Architecture `review_0` is the only artifact in its root. The re-raised `git switch <branch>` item later became code-review Finding 1 (Must Fix), fixed in 6c912e7.
- **cost this run:** 3 writer revisions and 8 reviewer dispatches in planning (11 planning dispatches total).
