## The plan needed 4 task-plan-reviewer rounds; every FAIL round's single Must Fix was net-new
- **category:** optimization
- **evidence:** Convergence churn trip-wire. Roots: `harness-runs/task_plan_reviews/chore_withdraw_second_runtime_port/` holds `review_0.md`, `review_1.md`, `review_2.md` (FAIL each, `must_fix_count: 1`), round 3 returned PASS and wrote no file; `architecture_reviews/…` and `business_parity_reviews/…` hold no files (architecture PASS on all 4 revisions, parity gate off). Round-over-round, by finding title: round 1 vs 0 — Must Fix 1 net-new / 0 re-raised (scope register entry D vs entry B), Should Fix 0 net-new / 3 re-raised, Nice to Have 1 net-new / 1 re-raised; round 2 vs 1 — Must Fix 1 net-new / 0 re-raised (scope register entry F), Should Fix 0 net-new / 3 re-raised, Nice to Have 0 net-new / 2 re-raised.
- **cost this run:** 3 extra writer + architecture-reviewer + task-plan-reviewer revisions (9 dispatches, #4–#12 of the planning session).
- **hypothesis:** (guess) each round's Must Fix was a different scope-register derivation entry reaching a site with no row, surfaced one entry per round.

## A plan-review Should Fix re-raised in all 3 FAIL rounds was never applied, then filed again as a code-review finding
- **category:** flow-efficiency
- **evidence:** `task_1_plan.md: the stated read command does not do the planning-only selection` appears under Should Fix in `task_plan_reviews/chore_withdraw_second_runtime_port/review_0.md`, `review_1.md` and `review_2.md`; the writer's revision returns state revision rounds apply Must Fix only. The same defect was then raised by the branch-reviewer as code-review Finding 1 (`harness-runs/code_reviews/chore_withdraw_second_runtime_port_code_review.md`) and fixed in Phase C, commit 399a8d2.
- **cost this run:** 2 Phase C dispatches (implementer + committer) for a defect known since planning round 0.

## `bash scripts/test.sh` exits 1 on gate 1a on every implementer dispatch, on a file this branch does not touch
- **category:** tooling-gap
- **evidence:** All 9 `layer-implementer` returns (Tasks 1–4, code-review Findings 1–3, skeptic Findings 1–2) report `bash scripts/test.sh` exit 1 with `1a plugin manifest` failing: `claude plugin validate --strict` turns 6 warnings about unquoted `${CLAUDE_PLUGIN_ROOT}` in `plugin/hooks/hooks.json` into errors. `git diff --stat origin/dev..HEAD -- plugin/ cli/` prints nothing; `plugin/hooks/hooks.json` last changed on `origin/dev` in 2c01123 (2026-09-09). `6a no machine paths` also fails on the worktree `.git` pointer file, as earlier intake files record.
- **cost this run:** every unit shipped with a red test gate; acceptance item 4 ("no new failure") had to be judged by each implementer rather than read off the gate.
- **hypothesis:** (guess) the installed `claude plugin validate` started warning on unquoted hook-command placeholders after 2026-09-09.

## Row A's branch-name `commit_prefix` conflicts with the repository's commit policy, and committers resolved it differently
- **category:** agent-contract
- **evidence:** `unit_loop_core.md` row `A` derives `commit_prefix` from the branch name (`chore_` → `chore`), which was passed to all 4 task commits. `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for a story task's commit. The Task 1 committer dropped the prefix (3bb961a `Write the decision record docs/second-runtime-port-decision.md`, its return citing that policy); the Task 2–4 committers used it (2b8aa4b, 2afcea4, 4ec651b, each `chore: …`). The five fix commits were passed `none` per the policy's fix-class designation and all rendered without a prefix.
- **cost this run:** 4 story-task commit subjects on one branch in two different shapes.
