## Task 12 was closed without a fix: the tool layer refused every edit under the worked example's `.claude/`
- **category:** tooling-gap
- **evidence:** commit `052f2482`, unit token `Task 12`, cause recorded on the commit: "tool-layer guard refused every Edit to examples/notes-app/.claude/**, so the worked example could not be re-rendered". Diagnosis in `harness-runs/task_plans/fix_clone_main_repo_resolution/task_12_plan.md` → `## Disposition`. The implementer's return quoted the refusal as "Permission to use Edit has been denied because Claude Code is running in don't ask mode" for all six `Edit` calls.
- **cost this run:** the unit was closed without a fix; the re-render of `examples/notes-app/.claude/` is left as a manual pre-merge step (story index `## Manual setup required`, added by code-review Finding 4).

## The plan needed 6 review rounds across two gates and two clarification parks before it converged
- **category:** optimization
- **evidence:** `harness-runs/task_plan_reviews/fix_clone_main_repo_resolution/` holds `review_0.md`–`review_3.md` (4 FAIL rounds) and `harness-runs/architecture_reviews/fix_clone_main_repo_resolution/` holds `review_0.md`–`review_1.md` (2 FAIL rounds); the converging round (plan-review iteration 4, architecture iteration 2) wrote no file. The run parked twice on the plan loop's cap (`question_1.md`, `question_2.md` under `harness-runs/clarifications/fix_clone_main_repo_resolution/`). The net-new vs re-raised split per round is unmeasurable from headings: each review file carries only `## Must Fix` / `## Should Fix` / `## Nice to Have` section headings, with no per-finding headings to match across rounds.
- **cost this run:** two human-answered parks before implementation could start.

## Shell-level verification of the clone arm was refused in two agents' sessions
- **category:** tooling-gap
- **evidence:** Task 3's `layer-implementer` return: "The permission layer refused running the QA helper scripts and that follow-up fixture command", leaving the helpers' new stderr line and three refusal sentences unexecuted (recorded in `harness-runs/task_plans/fix_clone_main_repo_resolution/task_3_plan.md`). The Phase C2 `skeptic-reviewer` return: "the sandbox refused direct runs of the library function, so I checked the shell clone arm by reading the code."
- **cost this run:** the `plugin/scripts/reserve-qa-user.sh` / `release-qa-user.sh` stderr path and the skeptic's runtime check rested on code reading until the Phase G suite ran.

## Task 5's implementer reported no tree guard selected although its change matched one
- **category:** agent-contract
- **evidence:** Task 5 changed `cli/src/doctor/checks.ts` and `cli/src/generators/permissionProfile.ts` (commit `754794c6`); `harness.config.json` → `treeGuards` maps `test/retrieval-loading.test.mjs` to `cli/src/**/*.ts`. The return said: "I wrote and edited no test file, and selected no tree guard."
- **cost this run:** the guard ran only in Phase G's whole-suite run, not at the unit.
- **hypothesis:** the glob match against `cli/src/**/*.ts` was evaluated incorrectly by the agent.

## The branch-reviewer's mechanical grep sweep did not run because its pattern table is blank
- **category:** agent-contract
- **evidence:** Phase B `branch-reviewer` return: "the grep half of the mechanical sweep is disabled because its pattern table in my agent definition is still blank; that is a configuration gap to fill."
- **cost this run:** the code review ran without its mechanical grep sweep.

## The skeptic review committed an absolute home-directory path and failed Run gates round 1
- **category:** agent-contract
- **evidence:** the round 1 log `harness-runs/test_run_logs/fix_clone_main_repo_resolution/task_round_1.log` failed gate 6a ("no machine paths") on `harness-runs/skeptic_reviews/fix_clone_main_repo_resolution_skeptic_review.md` line 25 (the **Check 2 (runtime address).** bullet, which quoted this clone's `.git/objects/info/alternates` contents). The fix plan is `harness-runs/test_fix_plans/fix_clone_main_repo_resolution_task_round_1.md`, and the fix is commit `77a3a8ed`.
- **cost this run:** one extra Run gates round, plus 5 dispatches (#49–#53: test-fix-plan-writer, architecture-reviewer, committer, layer-implementer, committer).
