## The plan took 3 review rounds to converge
- **category:** optimization
- **evidence:** Plan round artifacts across the three plan-gate roots: `harness-runs/architecture_reviews/fix_run_gates_typecheck/review_0.md` (1), `harness-runs/task_plan_reviews/fix_run_gates_typecheck/review_0.md` and `review_1.md` (2); `harness-runs/business_parity_reviews/` has none (`phases.parity` is false). Total 3. Per round, from the writer's revision returns (the review files carry no per-finding headings to diff): architecture `review_0` — 2 Must Fix, first round in that root, net-new; task-plan `review_0` — 1 Must Fix (scope register missed the repo's own state-dir READMEs), first round in that root, net-new; task-plan `review_1` — 3 Must Fix, all net-new against `review_0` (scope register missed `README-root.md` / `harness-runs/README.md`, Task 9 claimed implementers ran no type check, Task 3 command not in a fenced block), plus 1 Should Fix re-raised from the iteration-0 architecture review (Task 7's duplicated `commands.typecheck` wording), which the writer left unapplied both times because revisions apply Must Fix only.
- **cost this run:** 5 extra planning dispatches (#3–#10) beyond a first-pass convergence.
- **hypothesis:** (guess) the scope-register search in round 0 was widened by exactly the miss each round named, rather than to the full class.

## A Task 1 syntax check was refused by the permission profile
- **category:** tooling-gap
- **evidence:** The `layer-implementer` dispatch for Task 1 (#12) reported that `bash -n` on `cli/templates/scripts/run-test-suite.sh` was refused ("This command requires approval"); it recorded the syntax check as by-eye only in `harness-runs/task_plans/fix_run_gates_typecheck/task_1_plan.md`. The wrapper was first actually executed by Task 2's test file (#14).
- **cost this run:** Task 1 shipped its shell change with no syntax check of its own.

## The committer objected to the row-A commit prefix it was handed
- **category:** agent-contract
- **evidence:** For `mode: task` the unit loop's row `A` derives `commit_prefix` from the branch name (`fix_` → `fix`), and the orchestrator passed `fix`. The committer's return on commit `898d49c1` said `.claude/context/conventions.md` → `## Commit-message policy` gives a story task's commit prefix `none` and lists `chore` as its only token, so `fix` is outside its vocabulary, and asked for `commit_prefix: none` on later tasks. The orchestrator kept row `A`'s rule, so all 12 task commits (`898d49c1` … `35c7f719`) carry `fix:`, while the review-fix commits, routed through the policy's designation, carry no prefix.
- **cost this run:** The branch's task commits do not match the repository's stated commit-message policy.

## Implementers could not capture the type-check exit status
- **category:** tooling-gap
- **evidence:** The Task 2 (#14), Task 5 (#20) and Task 8 (#26) `layer-implementer` returns each said the whole-tree `bash scripts/typecheck.sh` pass rests on the printed `PASS: typecheck` line alone, because the exit status was not captured (Task 5: "the `PIPESTATUS` check printed empty"; Task 8: "zsh has no `PIPESTATUS`").
- **cost this run:** Three units' type-check evidence is a printed line, not an exit code.
