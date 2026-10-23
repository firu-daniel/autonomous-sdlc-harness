## An orchestrator `cd` into the run-artifact tree left a file-less `.claude/` there, and gate 6b failed a round on it
- **category:** silent-failure
- **evidence:** in the session resumed from park 2, the orchestrator's third Bash call began with `cd harness-runs`. The session's primary working directory then stayed `harness-runs/` (the session transcript) until a later `cd` back to the checkout root. `harness-runs/.claude/.cc-writes/` (an empty directory, no file) carries mtime 17:37:33, inside that window. Run gates round 2 failed on gate `6b no template in the dot-namespace`, which printed `./harness-runs/.claude` (`harness-runs/test_run_logs/fix_run_gates_background_run_handling/task_round_2.log`). The round-2 test fix plan (`harness-runs/test_fix_plans/fix_run_gates_background_run_handling_task_round_2.md`, Finding 1) changed gate 6b to skip file-less `.claude/` directories, in commit 7c40c192. In the same window, the round-1 Finding 1 implementer's `npm test --workspace cli -- test/watcher-remote-job.test.mjs` failed with `No workspaces found` because its shell started in `harness-runs/`.
- **cost this run:** one extra gate round (round 2, about 35 min) plus five dispatches (#6–#10: writer, architecture gate, plan commit, implementer, fix commit). Round-1 Finding 1 also shipped without its test-file run.
- **hypothesis:** guess: a `cd` in one Bash call persists as the session's working directory, and the tool layer creates `<cwd>/.claude/.cc-writes` there.

## A committer push was blocked by the sandbox proxy while the pushes around it landed
- **category:** tooling-gap
- **evidence:** the committer for G.4 round-1 Finding 2 (commit 9d509bf7) returned `pushed: failed`: the sandbox network proxy refused `github-firu:22` with "host is not on the allow list". Committer pushes for 4a1c5c95, 258898ab and 7c40c192 in the same session returned `pushed: yes`. That committer also reported that `HARNESS_MAIN_REPO` was unset and that it ran `scripts/push-branch.sh` from this run copy. The orchestrator's own bare `printenv HARNESS_MAIN_REPO` printed the main checkout in the same session.
- **cost this run:** 9d509bf7 stayed unpushed until the orchestrator's direct `push-branch.sh` after commit 7d4ca10b.

## Read-only verification commands were refused inside sub-agents, so several fixes reached the gates unverified
- **category:** tooling-gap
- **evidence:** sub-agent returns in this session: `bash -n scripts/run-gates.sh` was refused (G.4 round-2 Finding 1 implementer, #9); `bash -n` on `cli/templates/scripts/run-test-suite.sh` was refused (#3); `cp` from the template to `scripts/run-test-suite.sh` was refused (#4, so the file was written with the file tool instead); the `--prefix <repo_root>` form of the test-file command was refused (#1); the statistics writer's `awk`/`grep` counting command was refused (#11, so it counted by hand); `printenv HOME` was refused (test-fix-plan writer, #6).
- **cost this run:** round-1 Finding 1 and round-2 Finding 1 were committed without their own test or syntax check. Both were verified only by the next gate round.

## The task plan needed 7 review rounds before convergence
- **category:** optimization
- **evidence:** `harness-runs/task_plan_reviews/fix_run_gates_background_run_handling/` holds `review_0.md`–`review_5.md` (6 rounds) and `harness-runs/architecture_reviews/fix_run_gates_background_run_handling/` holds `review_0.md` (1 round), so 7 in total. The business-parity root is absent (`phases.parity` is `false`). The per-round net-new versus re-raised split is unmeasurable: each file's only headings are its severity sections (`## Must Fix` / `## Should Fix` / `## Nice to Have`), and its findings are list items, not headings.
- **cost this run:** 7 plan-gate rounds in the planning half (a pre-park session).
