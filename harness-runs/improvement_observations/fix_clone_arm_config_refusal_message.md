## The plan unit needed 3 task-plan-review rounds, each raising only net-new findings
- **category:** optimization
- **evidence:** `harness-runs/task_plan_reviews/fix_clone_arm_config_refusal_message/` holds `review_0.md`, `review_1.md`, `review_2.md` (each a FAIL, one Must Fix each); the fourth task-plan-reviewer dispatch passed and wrote no file. `harness-runs/business_parity_reviews/…` (parity off) and `harness-runs/architecture_reviews/fix_clone_arm_config_refusal_message/` (every architecture gate PASS) hold none. Round count across the plan's roots: 3. Finding-title diff, round over round in that one root: round 1 vs 0 — 2 net-new, 0 re-raised; round 2 vs 1 — 2 net-new, 0 re-raised.
- **cost this run:** 3 extra task-plan-writer revisions plus 3 extra architecture-reviewer and 3 extra task-plan-reviewer dispatches (12 planning dispatches in total for a 3-task plan).
- **hypothesis:** (guess) round 1's Must Fix was about round 0's Should Fix items left unapplied, so part of the churn came from the revision-mode rule on Should Fix items rather than from new defects.

## Task 3's implementer reported no tree guard selected although its changed `.md` paths match a configured guard
- **category:** silent-failure
- **evidence:** Task 3 (`harness-runs/task_plans/fix_clone_arm_config_refusal_message/task_3_plan.md`) changed `docs/outer-loop-verification.md` and `docs/cli.md`; its return said "this task wrote and edited no test file, and no tree guard was selected". `harness.config.json` → `treeGuards` has `{ "test": "test/no-container-home-paths.test.mjs", "covers": "**/*.md" }`, which both paths match. The Phase C implementer for code-review Finding 1, also a `docs/outer-loop-verification.md`-only change, did select and run that guard (1/1 pass).
- **cost this run:** the guard did not run at the unit level for Task 3 (commit f920077d); the Phase G round 1 full suite later passed, so nothing shipped broken.

## Task 1's implementer ran its tests with a `cd` prefix and piped output, against the foreground rule
- **category:** agent-contract
- **evidence:** Task 1's implementer return (commit 826840ac): "each run was prefixed with `cd <repo_root> &&` and its output piped through `tail` or `grep`. The conventions say not to do either." Rule cited: `unit_loop_core.md` → `## The test-run rule` point 6.
- **cost this run:** none visible; the counts it reported came from TAP summaries that the pipe could have truncated.

## The configured `defaultBranch` has no local ref in the run copy, so `dev..HEAD` ranges fail
- **category:** tooling-gap
- **evidence:** At Phase D, `git log --format='%h %s%n%b' --name-only dev..HEAD` exited 128 with `fatal: ambiguous argument 'dev..HEAD': unknown revision or path not in the working tree.`. The branch-reviewer ("`dev` from the config doesn't exist as a local branch in this copy, so I diffed against `origin/dev`") and the statistics-plan-writer ("the `dev..HEAD` disposition scan ran against `origin/dev..HEAD` instead") each made the same substitution on their own.
- **cost this run:** three participants each re-derived the same `origin/dev` fallback; the Phase-D disposition and index-only scans ran against `origin/dev..HEAD`.

## The branch-reviewer's grep-sweep regex list is still an unfilled template
- **category:** silent-failure
- **evidence:** The Phase B branch-reviewer return: "the regex list for the automated grep sweep is still an unfilled template, so that half of the first pass checked nothing."
- **cost this run:** half of the branch-reviewer's Pass 1 (the automated grep sweep) checked nothing on this branch.
