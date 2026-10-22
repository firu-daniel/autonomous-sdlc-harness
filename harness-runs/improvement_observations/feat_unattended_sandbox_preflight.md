## The Run gates wait form refuses a live run as "no run in flight" under the per-command sandbox
- **category:** tooling-gap
- **evidence:** Phase G round 4. `bash scripts/run-test-suite.sh task_round_4`, issued in the foreground, was moved to the background by the tool layer after 600 s. The follow-up `bash scripts/run-test-suite.sh --wait task_round_4` exited 2 with `run-test-suite.sh: no run in flight for task_round_4`, although `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_4.running` held a pid and `task_round_4.log` was still growing (gate 4 in progress). The wait form's liveness test is `kill -0 "$pid"` (`scripts/run-test-suite.sh`, `run_alive`). Each Bash call runs in its own sandbox, and the probe `kill -0 58081` issued directly was refused, so liveness could not be confirmed from a separate call. The same `--wait` refusal recurred for the relaunched run, a background Bash task with a 2 h limit. Its verdict was then read from the background task's completion notification instead (`fail …task_round_4.log`; round 5 `pass`).
- **cost this run:** the first round-4 run (about 11 min in) was stopped and relaunched, because the tool layer's 10-minute background limit for a foreground-issued command would have killed it before the ~35 min suite finished; the verdict was collected outside the wrapper's wait form on both rounds 4 and 5.
- **hypothesis:** (a guess) `kill -0` on a pid started under a different command's sandbox fails with a permission error rather than "no such process", which `run_alive` cannot tell apart.

## The plan needed 4 review rounds
- **category:** optimization
- **evidence:** plan-convergence rounds across this run's plan-review folders: `harness-runs/task_plan_reviews/feat_unattended_sandbox_preflight/` holds `review_0.md`, `review_1.md`, and `harness-runs/architecture_reviews/feat_unattended_sandbox_preflight/` holds `review_0.md`, `review_1.md` (business-parity review not enabled) — 4 rounds in total. Per-round net-new vs re-raised split: unmeasurable — these review files carry their findings as list items under `## Must Fix` / `## Should Fix` / `## Nice to Have` with no per-finding heading, and the Phase-D read exception admits headings only.
- **cost this run:** 4 plan review dispatches before P1 converged (2 per folder).

## A unit's commit staged only its readiness index and detail file
- **category:** optimization
- **evidence:** `e6e2c386` — Finding 3 of `harness-runs/test_fix_plans/feat_unattended_sandbox_preflight_task_round_1.md`, subject staged-set description `finding file updated, no code change`.
- **cost this run:** one fix-loop unit closed with no work file committed.
