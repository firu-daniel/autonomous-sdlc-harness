# Run analytics — fix_gate_worker_sandbox_start

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 3h01m |
| Wall | 3h01m |
| Active | 2h58m |
| Host-suspended | 0.0s |
| Idle | 2m 40s |
| Cost | $63.85 |
| Input tokens (uncached) | 2406 |
| Total input tokens (incl. cache) | 170004319 |
| Output tokens | 588978 |
| Thinking tokens (main thread) | 6167 |
| Cache read tokens | 166480667 |
| Cache write tokens | 3521246 |
| Cache write tokens, main thread (5m / 1h) | 0 / 384895 |
| Cache hit ratio | 0.9793 |
| Requests | 1143 |
| Request latency p50 / p90 / p99 / max | 1.8s / 7.2s / 35.0s / 1m 35s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 26 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | devscene:task-plan-writer — Write task plan — 14m 22s (session 1) |
| Rate-limit peak | seven_day 0.44 |

## Network refusals

1 of 1 sessions scanned.

No refused network call.

## Possible network attempts in gate logs (best effort)

Lines in finished Run gates logs that carry a proxy refusal string or a plain connect error (`ECONNREFUSED`, `ENETUNREACH`, `EHOSTUNREACH`, `EAI_AGAIN`). They are listed as possible attempts, not refusals. What this list cannot show:

- a test that catches the error and passes leaves no trace;
- a plain connect error cannot be told apart from a host that is unreachable for another reason;
- on macOS, Seatbelt's own violation records go to the system log, not to the test output;
- a test whose name or output quotes one of these strings is listed too.

No possible network attempt in 2 round logs.

## Gate rounds

Wait is the orchestrator's wait on `run-test-suite.sh --wait <label>`, summed over every polling row whose command ends in that label; — when none matches, as for a label waited on fewer than three times in a session (no polling row is written for it) or a command cut at 160 characters.

A phase's test-file total sums each file's own seconds, so it exceeds the gate's wall time when files run in parallel.

### Round task_round_1 — fail

| Measure | Value |
|---|---|
| Wait (every run of task_round_1) | 28m 05s |
| Gate rows | 28 (complete) |
| Test files — full | 188 files, 13604.5 s summed |

| Phase | Gate | Status | Seconds |
|---|---|---|---|
| full | 1 | ok | 0 s |
| full | 2a | ok | 1 s |
| full | 2b | ok | 1 s |
| full | 2c | ok | 0 s |
| full | 2d | ok | 0 s |
| full | 2e | ok | 0 s |
| full | 3a | ok | 0 s |
| full | 3b | ok | 1 s |
| full | 3c | ok | 1 s |
| full | 3d | ok | 1 s |
| full | 3e | ok | 0 s |
| full | 3f | ok | 0 s |
| full | 4 | FAIL | 1765 s |
| full | 6a | FAIL | 1 s |
| full | 6b | ok | 0 s |
| full | 6c | ok | 1 s |
| full | 6d | ok | 3 s |
| full | 6e | ok | 1 s |
| full | 6f | ok | 0 s |
| full | 11 | ok | 14 s |
| full | 13a | BLOCKED | 1 s |
| full | 13b | BLOCKED | 0 s |
| full | 13c | BLOCKED | 0 s |
| full | 13d | SKIPPED | 0 s |
| full | 14a | ok | 1 s |
| full | 14c | ok | 2 s |
| full | 14d | SKIPPED | 0 s |
| full | 16 | ok | 2 s |

#### Slowest test files — full (10 of 188)

| File | Status | Seconds | Tests | Failed |
|---|---|---|---|---|
| test/watcher-review-drop-payloads.test.mjs | pass | 815.2 | 21 | 0 |
| test/watcher-remote-job.test.mjs | pass | 646.3 | 29 | 0 |
| test/remote-run.test.mjs | pass | 633.9 | 130 | 0 |
| test/watcher-placeholder-host.test.mjs | pass | 614.7 | 27 | 0 |
| test/watcher-remote-dispatch.test.mjs | pass | 595.9 | 17 | 0 |
| test/remote-control.test.mjs | pass | 564.0 | 83 | 0 |
| test/remote-control-review.test.mjs | pass | 540.5 | 33 | 0 |
| test/watcher-run-profile.test.mjs | pass | 529.6 | 21 | 0 |
| test/watcher-stall-reset-payloads.test.mjs | pass | 491.0 | 18 | 0 |
| test/doctor.test.mjs | pass | 468.7 | 1 | 0 |

### Round task_round_2 — pass

| Measure | Value |
|---|---|
| Wait (every run of task_round_2) | 32m 21s |
| Gate rows | 29 (complete) |
| Test files — focused | 1 files, 60.0 s summed |
| Test files — full | 188 files, 15448.5 s summed |

| Phase | Gate | Status | Seconds |
|---|---|---|---|
| focused | 4 | ok | 61 s |
| focused | 6a | ok | 1 s |
| full | 1 | ok | 1 s |
| full | 2a | ok | 1 s |
| full | 2b | ok | 0 s |
| full | 2c | ok | 0 s |
| full | 2d | ok | 0 s |
| full | 2e | ok | 0 s |
| full | 3a | ok | 1 s |
| full | 3b | ok | 1 s |
| full | 3c | ok | 1 s |
| full | 3d | ok | 0 s |
| full | 3e | ok | 0 s |
| full | 3f | ok | 1 s |
| full | 4 | ok | 1981 s |
| full | 6b | ok | 1 s |
| full | 6c | ok | 1 s |
| full | 6d | ok | 4 s |
| full | 6e | ok | 0 s |
| full | 6f | ok | 0 s |
| full | 11 | ok | 16 s |
| full | 13a | BLOCKED | 0 s |
| full | 13b | BLOCKED | 0 s |
| full | 13c | BLOCKED | 0 s |
| full | 13d | SKIPPED | 0 s |
| full | 14a | ok | 2 s |
| full | 14c | ok | 1 s |
| full | 14d | SKIPPED | 1 s |
| full | 16 | ok | 2 s |

#### Slowest test files — focused (1 of 1)

| File | Status | Seconds | Tests | Failed |
|---|---|---|---|---|
| test/launch-sandboxed-gates.test.mjs | pass | 60.0 | 21 | 0 |

#### Slowest test files — full (10 of 188)

| File | Status | Seconds | Tests | Failed |
|---|---|---|---|---|
| test/watcher-review-drop-payloads.test.mjs | pass | 825.5 | 21 | 0 |
| test/remote-run.test.mjs | pass | 657.2 | 130 | 0 |
| test/watcher-remote-job.test.mjs | pass | 656.7 | 29 | 0 |
| test/doctor.test.mjs | pass | 628.1 | 1 | 0 |
| test/watcher-placeholder-host.test.mjs | pass | 621.6 | 27 | 0 |
| test/watcher-remote-dispatch.test.mjs | pass | 603.7 | 17 | 0 |
| test/remote-control.test.mjs | pass | 582.9 | 83 | 0 |
| test/remote-control-review.test.mjs | pass | 555.0 | 33 | 0 |
| test/watcher-run-profile.test.mjs | pass | 538.3 | 21 | 0 |
| test/watcher-stall-reset-payloads.test.mjs | pass | 490.8 | 18 | 0 |

## Session 1 — 2026-11-14T10:41:38.402Z → 2026-11-14T13:42:40.642Z

Session id: `0250645a-210a-41c0-90d2-0c9923fc1126`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 3h01m | 3h01m | 1h34m | 0.0s | 2m 40s | 2h58m | none |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-11-14T11:28:49.287Z | 2m 40s | devscene:layer-implementer | tool_running |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 1143 | 1.8s | 7.2s | 35.0s | 1m 35s | 0 |
| devscene:architecture-reviewer | 58 | 2.2s | 8.5s | 23.5s | 23.5s | 0 |
| devscene:branch-reviewer | 36 | 3.0s | 16.0s | 32.8s | 32.8s | 0 |
| devscene:committer | 157 | 1.7s | 4.5s | 7.6s | 8.7s | 0 |
| devscene:layer-implementer | 271 | 2.4s | 6.6s | 52.2s | 1m 25s | 0 |
| devscene:prompt-injection-reviewer | 1 | 1.9s | 1.9s | 1.9s | 1.9s | 0 |
| devscene:review-plan-reviewer | 9 | 3.1s | 8.6s | 8.6s | 8.6s | 0 |
| devscene:skeptic-reviewer | 33 | 4.0s | 13.2s | 25.2s | 25.2s | 0 |
| devscene:statistics-plan-writer | 8 | 1.5s | 18.2s | 18.2s | 18.2s | 0 |
| devscene:task-plan-reviewer | 77 | 3.7s | 20.9s | 43.1s | 43.1s | 0 |
| devscene:task-plan-writer | 76 | 4.4s | 25.7s | 1m 35s | 1m 35s | 0 |
| devscene:test-fix-plan-writer | 30 | 2.5s | 15.2s | 24.5s | 24.5s | 0 |
| orchestrator | 387 | 1.4s | 2.1s | 3.9s | 13.6s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 60 | 1h43m | 14m 22s |
| Bash | devscene:architecture-reviewer | 42 | 6.2s | 0.2s |
| Bash | devscene:branch-reviewer | 28 | 4.6s | 0.3s |
| Bash | devscene:committer | 229 | 2m 26s | 5.7s |
| Bash | devscene:layer-implementer | 230 | 20m 41s | 2m 40s |
| Bash | devscene:review-plan-reviewer | 9 | 1.5s | 0.2s |
| Bash | devscene:skeptic-reviewer | 28 | 4.4s | 0.2s |
| Bash | devscene:statistics-plan-writer | 10 | 1.5s | 0.1s |
| Bash | devscene:task-plan-reviewer | 63 | 10.0s | 0.3s |
| Bash | devscene:task-plan-writer | 52 | 9.8s | 1.2s |
| Bash | devscene:test-fix-plan-writer | 26 | 4.0s | 0.2s |
| Bash | orchestrator | 325 | 1h03m | 1m 02s |
| Edit | devscene:committer | 20 | 0.7s | 0.0s |
| Edit | devscene:layer-implementer | 77 | 2.9s | 0.0s |
| Edit | devscene:task-plan-writer | 22 | 0.8s | 0.0s |
| Edit | orchestrator | 15 | 33.7s | 4.0s |
| Read | devscene:architecture-reviewer | 55 | 2.8s | 0.3s |
| Read | devscene:branch-reviewer | 17 | 0.7s | 0.3s |
| Read | devscene:committer | 17 | 0.2s | 0.0s |
| Read | devscene:layer-implementer | 91 | 4.7s | 0.3s |
| Read | devscene:prompt-injection-reviewer | 2 | 0.0s | 0.0s |
| Read | devscene:review-plan-reviewer | 9 | 0.6s | 0.2s |
| Read | devscene:skeptic-reviewer | 11 | 0.5s | 0.2s |
| Read | devscene:statistics-plan-writer | 3 | 0.0s | 0.0s |
| Read | devscene:task-plan-reviewer | 44 | 1.5s | 0.2s |
| Read | devscene:task-plan-writer | 25 | 0.9s | 0.2s |
| Read | devscene:test-fix-plan-writer | 11 | 0.1s | 0.0s |
| Read | orchestrator | 16 | 1.5s | 0.3s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | devscene:architecture-reviewer | 2 | 0.0s | 0.0s |
| Write | devscene:branch-reviewer | 4 | 0.2s | 0.0s |
| Write | devscene:layer-implementer | 2 | 0.1s | 0.0s |
| Write | devscene:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | devscene:task-plan-reviewer | 2 | 0.0s | 0.0s |
| Write | devscene:task-plan-writer | 8 | 0.4s | 0.0s |
| Write | devscene:test-fix-plan-writer | 12 | 0.5s | 0.0s |
| Write | orchestrator | 4 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | devscene:layer-implementer | 2026-11-14T11:28:49.287Z | 2m 40s | 12813 | false | false |
| Bash | devscene:layer-implementer | 2026-11-14T12:57:06.062Z | 1m 02s | 5691 | false | false |
| Bash | orchestrator | 2026-11-14T13:08:34.677Z | 1m 02s | 19 | true | false |
| Bash | devscene:layer-implementer | 2026-11-14T12:43:23.701Z | 1m 02s | 5698 | false | false |
| Bash | orchestrator | 2026-11-14T13:13:01.616Z | 1m 02s | 19 | true | false |
| Bash | devscene:layer-implementer | 2026-11-14T12:50:51.177Z | 1m 02s | 5693 | false | false |
| Bash | devscene:layer-implementer | 2026-11-14T12:59:05.392Z | 1m 02s | 5693 | false | false |
| Bash | devscene:layer-implementer | 2026-11-14T12:53:02.203Z | 1m 02s | 5695 | false | false |
| Bash | devscene:layer-implementer | 2026-11-14T13:01:16.606Z | 1m 02s | 5688 | false | false |
| Bash | devscene:layer-implementer | 2026-11-14T12:55:01.653Z | 1m 02s | 5694 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| devscene:architecture-reviewer | git rev-parse --show-toplevel | 4 | 0.5s |
| devscene:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/fix_gate_worker_sandbox_start_story_plan.md harness-runs/task_plans/fix | 4 | 2.1s |
| devscene:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/test_fix_plans/fix_gate_worker_sandbox_start_task_round_1.md harness-runs/test_fix_ | 12 | 6.1s |
| devscene:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 22 | 1m 49s |
| devscene:committer | git branch --show-current | 21 | 2.8s |
| devscene:committer | git log -1 --oneline | 22 | 3.0s |
| devscene:committer | git rev-parse --show-toplevel | 21 | 2.8s |
| devscene:committer | git status --short | 45 | 7.2s |
| devscene:committer | grep -n -i -A40 "^## .*commit" <repo_root>/.claude/context/conventions.md | 5 | 0.6s |
| devscene:committer | printenv DEVSCENE_MAIN_REPO | 21 | 2.6s |
| devscene:layer-implementer | bash scripts/gate-worker-start-probe.sh | 6 | 3m 17s |
| devscene:layer-implementer | bash scripts/typecheck.sh | 16 | 43.6s |
| devscene:layer-implementer | git diff --name-only HEAD | 7 | 2.6s |
| devscene:layer-implementer | git ls-files --others --exclude-standard | 7 | 2.2s |
| devscene:layer-implementer | git rev-parse --show-toplevel | 24 | 3.1s |
| devscene:layer-implementer | npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs | 11 | 11m 06s |
| devscene:layer-implementer | npm test --workspace cli -- test/main-anchor-isolation.test.mjs | 3 | 4.9s |
| devscene:layer-implementer | npm test --workspace cli -- test/no-container-home-paths.test.mjs | 11 | 33.9s |
| devscene:layer-implementer | npm test --workspace cli -- test/shipped-scripts-mktemp.test.mjs | 3 | 9.1s |
| devscene:layer-implementer | npm test --workspace cli -- test/watcher-main-anchor.test.mjs | 3 | 24.7s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/dispatch_additions/fix_gate_worker_sandbox_start.md" -- "chore: Log dispatch addit | 3 | 1.4s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/fix_gate_worker_sandbox_start_progress.md" -- "chore: Flow progress  | 13 | 5.7s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/story_plans/fix_gate_worker_sandbox_start_story_plan.md" "harness-runs/task_plans/ | 3 | 2.0s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 22 | 1m 43s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_1 | 28 | 28m 05s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_2 | 32 | 32m 21s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 57 | 28.7s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; echo checked | 57 | 38.7s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| devscene:prompt-injection-reviewer | Screen task prompt | 4.4s | 1 | 354 | 4 | 27711 | 10483 | 17224 | 0.0004 |
| devscene:task-plan-writer | Write task plan | 14m 22s | 62 | 85217 | 126 | 10284026 | 10028498 | 255402 | 0.0794 |
| devscene:architecture-reviewer | Architecture plan review | 1m 31s | 15 | 8976 | 32 | 1433118 | 1304994 | 128092 | 0.0084 |
| devscene:task-plan-reviewer | Task plan review | 5m 47s | 41 | 34100 | 84 | 5689979 | 5507826 | 182069 | 0.032 |
| devscene:task-plan-writer | Revise task plan r1 | 2m 17s | 14 | 15005 | 30 | 699902 | 636329 | 63543 | 0.0126 |
| devscene:architecture-reviewer | Architecture plan review r1 | 1m 17s | 15 | 7717 | 32 | 1290027 | 1182142 | 107853 | 0.0071 |
| devscene:task-plan-reviewer | Task plan review r1 | 5m 12s | 36 | 29686 | 74 | 4771315 | 4609163 | 162078 | 0.0287 |
| devscene:layer-implementer | Implement Task 1 | 6m 58s | 24 | 37013 | 50 | 2340789 | 2209138 | 131601 | 0.0385 |
| devscene:committer | Commit Task 1 | 28.0s | 8 | 2108 | 18 | 217118 | 190817 | 26283 | 0.0026 |
| devscene:layer-implementer | Implement Task 2 | 3m 33s | 17 | 12781 | 36 | 1095340 | 1029866 | 65438 | 0.0197 |
| devscene:committer | Commit Task 2 | 28.1s | 8 | 2268 | 18 | 229710 | 214341 | 15351 | 0.0026 |
| devscene:layer-implementer | Implement Task 3 | 4m 46s | 19 | 13080 | 40 | 1439847 | 1355338 | 84469 | 0.0264 |
| devscene:committer | Commit Task 3 | 29.7s | 9 | 2178 | 20 | 254039 | 237662 | 16357 | 0.0027 |
| devscene:layer-implementer | Implement Task 4 | 3m 17s | 16 | 14636 | 34 | 1102508 | 1032991 | 69483 | 0.0182 |
| devscene:committer | Commit Task 4 | 25.2s | 7 | 1914 | 16 | 188794 | 176199 | 12579 | 0.0023 |
| devscene:layer-implementer | Implement Task 5 | 1m 16s | 14 | 8501 | 30 | 682134 | 640087 | 42017 | 0.007 |
| devscene:committer | Commit Task 5 | 28.4s | 7 | 2298 | 16 | 213660 | 197133 | 16511 | 0.0026 |
| devscene:layer-implementer | Implement Task 6 | 3m 59s | 30 | 21752 | 62 | 3253297 | 3123919 | 129316 | 0.022 |
| devscene:committer | Commit Task 6 | 30.0s | 8 | 2382 | 18 | 220367 | 206748 | 13601 | 0.0028 |
| devscene:architecture-reviewer | Branch architecture review | 1m 20s | 19 | 7453 | 40 | 1313913 | 1204822 | 109051 | 0.0074 |
| devscene:branch-reviewer | Branch code review | 5m 12s | 36 | 31690 | 74 | 4079136 | 3905583 | 173479 | 0.0287 |
| devscene:review-plan-reviewer | Meta-review code review | 48.8s | 9 | 5025 | 20 | 614773 | 530397 | 84356 | 0.0045 |
| devscene:committer | Commit code review | 19.5s | 5 | 1339 | 12 | 147219 | 121042 | 26165 | 0.0018 |
| devscene:layer-implementer | Fix code-review Finding 3 | 29.3s | 9 | 2497 | 20 | 400704 | 353898 | 46786 | 0.0027 |
| devscene:committer | Commit Finding 3 fix | 30.1s | 10 | 2476 | 22 | 280116 | 264070 | 16024 | 0.0028 |
| devscene:layer-implementer | Fix Finding 2 (cli) | 34.1s | 7 | 3711 | 16 | 259336 | 234111 | 25209 | 0.0031 |
| devscene:layer-implementer | Fix Finding 2 (general) | 41.4s | 10 | 4051 | 22 | 330360 | 309633 | 20705 | 0.0038 |
| devscene:committer | Commit Finding 2 fix | 25.2s | 5 | 2025 | 12 | 145745 | 132565 | 13168 | 0.0023 |
| devscene:layer-implementer | Fix Finding 1 (cli) | 30.5s | 8 | 2754 | 18 | 287905 | 265606 | 22281 | 0.0028 |
| devscene:layer-implementer | Fix Finding 1 (general) | 50.0s | 11 | 4447 | 24 | 548009 | 506553 | 41432 | 0.0046 |
| devscene:committer | Commit Finding 1 fix | 27.4s | 7 | 2394 | 16 | 191575 | 178081 | 13478 | 0.0025 |
| devscene:skeptic-reviewer | Skeptic review | 3m 57s | 33 | 23425 | 68 | 3580287 | 3422626 | 157593 | 0.0219 |
| devscene:test-fix-plan-writer | Write test fix plan r1 | 4m 26s | 30 | 31164 | 62 | 2322167 | 2203912 | 118193 | 0.0245 |
| devscene:architecture-reviewer | Arch-review test fix plan | 51.8s | 9 | 5717 | 20 | 609529 | 516457 | 93052 | 0.0048 |
| devscene:committer | Commit test fix plan r1 | 21.1s | 6 | 1592 | 14 | 162154 | 137481 | 24659 | 0.0019 |
| devscene:layer-implementer | Test-fix Finding 1 (cli) | 16.8s | 3 | 1584 | 8 | 109861 | 80652 | 29201 | 0.0016 |
| devscene:layer-implementer | Test-fix Finding 1 (general) | 1m 09s | 14 | 6950 | 30 | 732860 | 687238 | 45592 | 0.0064 |
| devscene:committer | Commit test-fix Finding 1 | 27.6s | 10 | 2281 | 22 | 266200 | 252370 | 13808 | 0.0025 |
| devscene:layer-implementer | Test-fix Finding 2 (cli) | 20.2s | 3 | 2040 | 8 | 113626 | 92798 | 20820 | 0.0019 |
| devscene:layer-implementer | Test-fix Finding 2 (general) | 3m 34s | 21 | 10375 | 44 | 1605870 | 1521499 | 84327 | 0.0198 |
| devscene:committer | Commit test-fix Finding 2 | 31.4s | 8 | 2667 | 18 | 236191 | 220394 | 15779 | 0.0029 |
| devscene:layer-implementer | Test-fix Finding 3 | 1m 48s | 12 | 4104 | 26 | 484897 | 454325 | 30546 | 0.01 |
| devscene:committer | Commit Finding 3 close | 32.9s | 8 | 2724 | 18 | 219950 | 205763 | 14169 | 0.003 |
| devscene:layer-implementer | Test-fix Finding 4 | 1m 34s | 8 | 2914 | 18 | 323306 | 293829 | 29459 | 0.0087 |
| devscene:committer | Commit Finding 4 close | 26.4s | 6 | 2247 | 14 | 203672 | 183451 | 20207 | 0.0024 |
| devscene:layer-implementer | Test-fix Finding 5 | 1m 35s | 8 | 3091 | 18 | 328067 | 297574 | 30475 | 0.0088 |
| devscene:committer | Commit Finding 5 close | 27.2s | 7 | 2197 | 16 | 200558 | 186130 | 14412 | 0.0025 |
| devscene:layer-implementer | Test-fix Finding 6 | 1m 23s | 6 | 2253 | 14 | 240167 | 215506 | 24647 | 0.0077 |
| devscene:committer | Commit Finding 6 close | 24.2s | 7 | 1951 | 16 | 187424 | 175208 | 12200 | 0.0022 |
| devscene:layer-implementer | Test-fix Finding 7 | 1m 17s | 5 | 1525 | 12 | 186413 | 162868 | 23533 | 0.0072 |
| devscene:committer | Commit Finding 7 close | 32.2s | 8 | 2782 | 18 | 228819 | 212921 | 15880 | 0.003 |
| devscene:layer-implementer | Test-fix Finding 8 | 1m 22s | 5 | 2142 | 12 | 193296 | 168094 | 25190 | 0.0076 |
| devscene:committer | Commit Finding 8 close | 23.8s | 6 | 1996 | 14 | 171898 | 158032 | 13852 | 0.0022 |
| devscene:layer-implementer | Test-fix Finding 9 | 1m 33s | 8 | 2592 | 18 | 302113 | 277267 | 24828 | 0.0086 |
| devscene:committer | Commit Finding 9 close | 26.5s | 6 | 2246 | 14 | 173672 | 159743 | 13915 | 0.0024 |
| devscene:layer-implementer | Test-fix Finding 10 | 1m 24s | 6 | 2064 | 14 | 216275 | 194237 | 22024 | 0.0078 |
| devscene:committer | Commit Finding 10 close | 23.5s | 5 | 1987 | 12 | 139238 | 126937 | 12289 | 0.0022 |
| devscene:layer-implementer | Test-fix Finding 11 | 1m 29s | 7 | 2228 | 16 | 262781 | 238620 | 24145 | 0.0082 |
| devscene:committer | Commit Finding 11 close | 24.8s | 6 | 2042 | 14 | 161686 | 150085 | 11587 | 0.0023 |
| devscene:statistics-plan-writer | Write branch statistics | 38.1s | 8 | 4697 | 18 | 289121 | 250535 | 38568 | 0.0035 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $63.85 |
| Cost — claude-opus-5-5 | $63.85 |
| Input tokens (uncached) | 2406 |
| Total input tokens (incl. cache) | 170004319 |
| Output tokens | 588978 |
| Thinking tokens (main thread) | 6167 |
| Cache read tokens | 166480667 |
| Cache write tokens | 3521246 |
| Cache write tokens, main thread (5m / 1h) | 0 / 384895 |
| Cache hit ratio | 0.9793 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 774 | 111719749 | 10373 | 111334080 | 384895 |
| sub-agents | 1632 | 58284570 | 507405 | 55146587 | 3136351 |
| remainder | 0 | 0 | 71200 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 26 |
| Sub-agents spawned / failed / killed | 60 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 423 |
| Time to first token | 1.9s |
| Rate-limit peak | seven_day 0.44 |
