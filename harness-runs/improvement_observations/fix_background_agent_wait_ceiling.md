## Run gates round 1 failed 47 tests that passed in round 2 with no code change between the rounds
- **category:** flow-efficiency
- **evidence:** `harness-runs/test_fix_plans/fix_background_agent_wait_ceiling_task_round_1.md` (committed in 5ab1dc29) lists 47 findings, each _(layer: cli, general)_. Findings 1–11 were closed one commit each (09e1a160 … 625884db) with the subject `Mark Finding <N> already passing — passed after an earlier fix`, and each commit changed only that index. Findings 12–47 were closed together in 93bc8552 (`Mark Findings 12-47 done for a full gate re-run`), which also changed only the index. `git diff --stat 5ab1dc29 HEAD -- . ':!harness-runs'` prints nothing, so no file outside `harness-runs/` changed after the round-1 fix plan. `bash scripts/run-test-suite.sh --wait task_round_2` then printed `pass` in this session.
- **cost this run:** one 47-finding test fix plan written and committed, 11 G.4 unit-loop passes (implementer + committer each) that changed no code, a manual index commit to clear the other 36, and a pause in between; a full extra gate round was spent.
- **hypothesis:** (guess) the round-1 failures were time bounds exceeded on a loaded host, not defects on the branch.

## Skeptic review (C2) needed 3 review rounds; the second meta-review round raised a net-new finding
- **category:** optimization
- **evidence:** C2 round artifacts: `harness-runs/skeptic_reviews/fix_background_agent_wait_ceiling_skeptic_review.md` (unsuffixed, 1 skeptic round) and `harness-runs/skeptic_review_plan_reviews/fix_background_agent_wait_ceiling/` with `review_0.md` and `review_1.md` (2 meta-review rounds), 3 in total. Comparing `review_1.md` with `review_0.md` by finding title only: review_1 has 1 Must Fix finding, which is net-new (not in review_0), and 0 re-raised. review_0 had 1 Must Fix and 1 Nice to Have.
- **cost this run:** 2 meta-review rounds, each carrying a Must Fix, before C2m closed.
