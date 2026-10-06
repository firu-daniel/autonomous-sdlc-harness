## The task plan needed 5 review rounds and parked at the plan loop's cap
- **category:** optimization
- **evidence:** The plan's round artifacts were `harness-runs/task_plan_reviews/fix_forge_run_control_gate12_round8_findings/review_0.md` through `review_3.md`, which is 4 plan-review rounds, plus `harness-runs/architecture_reviews/fix_forge_run_control_gate12_round8_findings/review_0.md`, 1 architecture round. Business parity is off. That is 5 rounds in all. Per the parked question `harness-runs/clarifications/fix_forge_run_control_gate12_round8_findings/question_1.md`, the plan-review Must Fix counts were 6, then 3, then 1, then 1. By finding title, round 3's only Must Fix (a missing Scope register row reached by D10) is not among round 0's six, so it is net-new. Rounds 1 and 2 write their findings in a different heading shape, so their net-new/re-raised split was not established by title.
- **cost this run:** the walker hit its 5-revision cap, and the run parked for one human answer ("accept the plan as it stands") before implementation.
- **hypothesis:** guess: each revision's Scope register edits gave the next round a new derivation entry to check.

## Story-task commit subjects carry a `fix:` prefix on 5 of 16 tasks, from the same dispatch
- **category:** agent-contract
- **evidence:** Every Phase A `committer` dispatch passed `commit_prefix: fix`, per `unit_loop_core.md` row `A`'s rule for a `fix_` branch. `.claude/context/conventions.md` → `## Commit-message policy` gives story-task commits `none`. Eleven committers dropped the prefix and cited that policy; five used it: 995ede7 (Task 11), 2da3cd7 (Task 16), b4c72b8 (Task 13), 9ede2d6 (Task 14) and 2708fd6 (Task 15). The Task 12 committer's return also flagged 995ede7's prefix as against policy.
- **cost this run:** the branch's task-commit subjects are inconsistent, and 5 subjects break the repository's own commit policy.
- **hypothesis:** guess: row `A`'s branch-name prefix rule and the committer's policy-first rule disagree whenever the repository's policy says `none`.

## An implementer ran 11 test suites it neither created nor edited
- **category:** agent-contract
- **evidence:** The Task 6 `layer-implementer` return says it ran `remote-control-review`, `remote-control`, `remote-control-close`, `remote-collect`, `remote-report`, `remote-deliver`, `remote-start`, `remote-trigger` and the three `watcher-remote-*` suites together with `node --test` (287 tests). Its only edited test file was `cli/test/remote-run.test.mjs`. `unit_loop_core.md` → `## The test-run rule` point 1 excludes any test file the unit did not create or edit.
- **cost this run:** extra test time on one unit, for suites Phase G ran anyway.

## `bash -n` was refused to a fix implementer, so a shell edit shipped with no syntax check
- **category:** tooling-gap
- **evidence:** The Code-review Finding 8 `layer-implementer` (commit c2d551b, `cli/templates/scripts/remote-run.sh`) reported that `bash -n` on the edited script was refused by the permission layer. It recorded that the edit's parse rests on reading only.
- **cost this run:** one script edit went unchecked until Phase G's suite run, which passed.

## Two fix implementers wrapped a command that the test-run rule says to run bare
- **category:** agent-contract
- **evidence:** The Code-review Finding 6 implementer piped `npm test --workspace cli -- test/remote-collect.test.mjs` through `tail`, and reported the counts from that tail without the exit status. The Code-review Finding 4 `general` implementer prefixed `bash scripts/typecheck.sh` with a `cd` to the checkout root. Both said in their returns that this went against the conventions. `unit_loop_core.md` → `## The test-run rule` point 6 says these commands are never piped and never wrapped in a `cd`.
- **cost this run:** none measurable. In one unit, the reported test counts rest on a truncated output.
