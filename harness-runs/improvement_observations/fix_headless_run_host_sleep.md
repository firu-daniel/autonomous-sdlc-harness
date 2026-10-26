## Round-2 gates and test fix plan regenerated after the Phase G pause
- **category:** optimization
- **evidence:** Trip-wire **Rework after resume**. `harness-runs/PAUSE_PROGRESS.md` (second pause, 12:10Z) records the round-2 test fix plan draft `harness-runs/test_fix_plans/fix_headless_run_host_sleep_task_round_2.md` + `harness-runs/test_fix_plans/fix_headless_run_host_sleep_task_round_2/` (8 findings, dispatch #77) as **untracked**, with the architecture gate not yet dispatched. The resumed session took G.0's untracked arm: `bash scripts/run-test-suite.sh task_round_2` printed `pending` (the label's `fail harness-runs/test_run_logs/fix_headless_run_host_sleep/task_round_2.log` verdict from before the pause was not answered back), the gates ran again until a `--wait` printed `fail harness-runs/test_run_logs/fix_headless_run_host_sleep/task_round_2.log`, and `test-fix-plan-writer` (dispatch #78) overwrote the draft with a 10-finding plan.
- **cost this run:** one full gate run (round 2) and one `test-fix-plan-writer` dispatch redone after resume.

## A sub-agent's `printenv HOME` was refused during the test-fix-plan machine-path check
- **category:** tooling-gap
- **evidence:** `test-fix-plan-writer` return (Phase G, round 2, dispatch #78): "Running `printenv HOME` was denied, so I checked the plan for leftover machine paths using `<home>`, the home directory the log shows."
- **cost this run:** the machine-path check ran against a home directory read from a test log rather than from the environment.

## The Phase-D commit-history derivation's `<default_branch>..HEAD` range fails with no local default-branch ref
- **category:** tooling-gap
- **evidence:** In this checkout `git log --format='%h %s' dev..HEAD` failed with `fatal: ambiguous argument 'dev..HEAD': unknown revision or path not in the working tree.`; the orchestrator re-ran it over `origin/dev..HEAD`. `statistics-plan-writer` (dispatch #101) reported the same: "this checkout has no local `dev` branch, only `origin/dev`, so the disposition search ran over `origin/dev..HEAD` instead of `dev..HEAD`."
- **cost this run:** the dispositioned-units and index-only-commit derivations ran over a substituted range; no wrong count resulted.
