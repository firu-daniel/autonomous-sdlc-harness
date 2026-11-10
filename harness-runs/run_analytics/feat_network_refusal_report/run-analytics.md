# Run analytics — feat_network_refusal_report

## Whole run

| Measure | Value |
|---|---|
| Sessions | 2 (0 incomplete) |
| Span | 2h04m |
| Wall | 1h51m |
| Active | 1h51m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $48.81 |
| Input tokens (uncached) | 1852 |
| Total input tokens (incl. cache) | 100806586 |
| Output tokens | 531038 |
| Thinking tokens (main thread) | 7703 |
| Cache read tokens | 97345508 |
| Cache write tokens | 3459226 |
| Cache write tokens, main thread (5m / 1h) | 0 / 473280 |
| Cache hit ratio | 0.9657 |
| Requests | 883 |
| Request latency p50 / p90 / p99 / max | 1.9s / 7.9s / 40.5s / 1m 39s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 19 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 12m 32s (session 1) |
| Rate-limit peak | seven_day 0.83 |

## Gate rounds

Wait is the orchestrator's wait on `run-test-suite.sh --wait <label>`, summed over every polling row whose command ends in that label; — when none matches, as for a label waited on fewer than three times in a session (no polling row is written for it) or a command cut at 160 characters.

A phase's test-file total sums each file's own seconds, so it exceeds the gate's wall time when files run in parallel.

### Round task_round_1 — pass

| Measure | Value |
|---|---|
| Wait (every run of task_round_1) | 26m 54s |
| Gate rows | 29 (complete) |
| Test files — full | 180 files, 12671.4 s summed |

| Phase | Gate | Status | Seconds |
|---|---|---|---|
| full | 1 | ok | 0 s |
| full | 2a | ok | 2 s |
| full | 2b | ok | 0 s |
| full | 2c | ok | 0 s |
| full | 2d | ok | 0 s |
| full | 2e | ok | 0 s |
| full | 3a | ok | 0 s |
| full | 3b | ok | 1 s |
| full | 3c | ok | 0 s |
| full | 3d | ok | 1 s |
| full | 3e | ok | 0 s |
| full | 3f | ok | 0 s |
| full | 4 | ok | 1647 s |
| full | 6a | ok | 2 s |
| full | 6b | ok | 0 s |
| full | 6c | ok | 1 s |
| full | 6d | ok | 2 s |
| full | 6e | ok | 0 s |
| full | 6f | ok | 0 s |
| full | 11 | ok | 14 s |
| full | 13a | BLOCKED | 0 s |
| full | 13b | BLOCKED | 0 s |
| full | 13c | BLOCKED | 0 s |
| full | 13d | SKIPPED | 0 s |
| full | 14a | ok | 1 s |
| full | 14b | ok | 0 s |
| full | 14c | ok | 2 s |
| full | 14d | SKIPPED | 0 s |
| full | 16 | ok | 1 s |

#### Slowest test files — full (10 of 180)

| File | Status | Seconds | Tests | Failed |
|---|---|---|---|---|
| test/watcher-review-drop-payloads.test.mjs | pass | 783.2 | 21 | 0 |
| test/watcher-remote-job.test.mjs | pass | 626.8 | 29 | 0 |
| test/watcher-placeholder-host.test.mjs | pass | 602.1 | 27 | 0 |
| test/watcher-remote-dispatch.test.mjs | pass | 579.5 | 17 | 0 |
| test/remote-run.test.mjs | pass | 561.1 | 130 | 0 |
| test/watcher-run-profile.test.mjs | pass | 515.9 | 21 | 0 |
| test/remote-control.test.mjs | pass | 485.3 | 83 | 0 |
| test/watcher-stall-reset-payloads.test.mjs | pass | 476.5 | 18 | 0 |
| test/remote-control-review.test.mjs | pass | 475.6 | 33 | 0 |
| test/doctor.test.mjs | pass | 441.2 | 1 | 0 |

## Session 1 — 2026-11-09T20:15:50.560Z → 2026-11-09T21:23:45.873Z

Session id: `d17adafa-054c-4679-adbf-672bc63858ad`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h07m | 1h07m | 1h04m | 0.0s | 0.0s | 1h07m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 648 | 2.0s | 9.6s | 43.0s | 1m 39s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 69 | 2.2s | 12.7s | 27.7s | 27.7s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 52 | 2.9s | 15.9s | 27.2s | 27.2s | 0 |
| autonomous-sdlc-harness:committer | 58 | 1.5s | 4.6s | 6.0s | 6.0s | 0 |
| autonomous-sdlc-harness:layer-implementer | 143 | 2.5s | 7.4s | 58.2s | 1m 38s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 15 | 1.9s | 4.4s | 4.8s | 4.8s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 105 | 3.0s | 11.1s | 25.2s | 25.8s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 93 | 2.9s | 27.6s | 1m 39s | 1m 39s | 0 |
| orchestrator | 113 | 1.3s | 2.0s | 8.3s | 8.4s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 31 | 1h02m | 12m 32s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 49 | 6.7s | 0.1s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 44 | 6.8s | 1.3s |
| Bash | autonomous-sdlc-harness:committer | 88 | 46.1s | 4.8s |
| Bash | autonomous-sdlc-harness:layer-implementer | 121 | 2m 09s | 8.1s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 9 | 1.2s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 85 | 11.2s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 61 | 8.5s | 0.3s |
| Bash | orchestrator | 112 | 55.6s | 4.8s |
| Edit | autonomous-sdlc-harness:committer | 6 | 0.2s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 105 | 4.1s | 0.0s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 23 | 0.9s | 0.0s |
| Edit | orchestrator | 5 | 7.3s | 3.6s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 78 | 4.3s | 0.4s |
| Read | autonomous-sdlc-harness:branch-reviewer | 14 | 1.0s | 0.2s |
| Read | autonomous-sdlc-harness:committer | 6 | 0.1s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 44 | 2.1s | 0.3s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 15 | 0.6s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 83 | 2.7s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 48 | 1.3s | 0.2s |
| Read | orchestrator | 11 | 5.3s | 3.7s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 6 | 0.2s | 0.0s |
| Write | autonomous-sdlc-harness:layer-implementer | 4 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 8 | 0.3s | 0.0s |
| Write | orchestrator | 2 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T20:58:17.139Z | 8.1s | 911 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T21:02:47.755Z | 7.8s | 29 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T21:05:04.760Z | 7.8s | 916 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T21:02:58.418Z | 7.8s | 4186 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T21:02:08.173Z | 7.3s | 2772 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T20:55:19.900Z | 6.0s | 912 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T21:03:19.219Z | 5.9s | 3172 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T21:01:59.888Z | 5.4s | 1724 | false | false |
| Bash | autonomous-sdlc-harness:committer | 2026-11-09T21:05:46.945Z | 4.8s | 454 | false | false |
| Bash | orchestrator | 2026-11-09T20:16:27.589Z | 4.8s | 454 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 6 | 0.7s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 8 | 32.7s |
| autonomous-sdlc-harness:committer | git branch --show-current | 8 | 0.9s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 8 | 1.0s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 8 | 0.9s |
| autonomous-sdlc-harness:committer | git status --short | 18 | 2.5s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 8 | 0.9s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 7 | 19.2s |
| autonomous-sdlc-harness:layer-implementer | git diff --name-only HEAD | 4 | 4.5s |
| autonomous-sdlc-harness:layer-implementer | git ls-files --others --exclude-standard | 4 | 1.5s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 7 | 0.8s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/no-container-home-paths.test.mjs | 5 | 14.2s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/watcher-main-anchor.test.mjs | 3 | 22.0s |
| autonomous-sdlc-harness:task-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.5s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 7 | 32.2s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_network_refusal_report --outcome PASS | 4 | 1.0s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_network_refusal_report --outcome returned | 5 | 1.1s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 29 | 7.8s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 12m 32s | 58 | 81922 | 118 | 10974277 | 10698316 | 275843 | 0.1847 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 31s | 14 | 9646 | 30 | 1053889 | 943376 | 110483 | 0.0226 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch) | 53.8s | 9 | 5670 | 20 | 366104 | 333314 | 32770 | 0.0132 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review iter 1 | 1m 29s | 11 | 9848 | 24 | 970651 | 869445 | 101182 | 0.022 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan iter 2 | 48.7s | 10 | 5526 | 22 | 447887 | 407988 | 39877 | 0.012 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review iter 2 | 48.1s | 9 | 5338 | 20 | 708726 | 613076 | 95630 | 0.0118 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review iter 0 | 4m 27s | 48 | 27799 | 98 | 7179359 | 6977505 | 201756 | 0.0656 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan iter 3 | 28.2s | 7 | 3150 | 16 | 264593 | 225584 | 38993 | 0.0069 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review iter 3 | 51.7s | 8 | 5836 | 18 | 588987 | 481271 | 107698 | 0.0127 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review iter 1 | 4m 24s | 46 | 27650 | 94 | 7044929 | 6849044 | 195791 | 0.0649 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan iter 4 | 49.6s | 9 | 6050 | 20 | 343547 | 299782 | 43745 | 0.0122 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review iter 4 | 36.0s | 8 | 3807 | 18 | 561327 | 457266 | 104043 | 0.0088 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review iter 2 | 1m 03s | 11 | 7097 | 24 | 936030 | 823964 | 112042 | 0.0157 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 (cli) | 6m 05s | 30 | 42677 | 62 | 3006916 | 2866044 | 140810 | 0.0898 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 23.6s | 7 | 2014 | 16 | 191084 | 165256 | 25812 | 0.0058 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 (cli) | 2m 25s | 17 | 16330 | 36 | 1078351 | 1013153 | 65162 | 0.0357 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 31.9s | 7 | 2949 | 16 | 198832 | 184763 | 14053 | 0.0078 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 (cli) | 4m 20s | 31 | 27543 | 64 | 2865443 | 2757299 | 108080 | 0.0639 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 27.2s | 8 | 2397 | 18 | 225903 | 211121 | 14764 | 0.0067 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 4 (cli) | 1m 02s | 13 | 5938 | 28 | 547791 | 515256 | 32507 | 0.0154 |
| autonomous-sdlc-harness:committer | Commit Task 4 | 25.4s | 7 | 2150 | 16 | 213415 | 196721 | 16678 | 0.0062 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 5 (plugin) | 52.6s | 13 | 5275 | 28 | 634697 | 591847 | 42822 | 0.0129 |
| autonomous-sdlc-harness:committer | Commit Task 5 | 26.9s | 8 | 2399 | 18 | 240155 | 223408 | 16729 | 0.0066 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 6 (general) | 3m 02s | 18 | 24893 | 38 | 1566274 | 1462635 | 103601 | 0.0447 |
| autonomous-sdlc-harness:committer | Commit Task 6 | 26.7s | 8 | 2316 | 18 | 249580 | 229439 | 20123 | 0.0066 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 7 (general) | 1m 39s | 21 | 10934 | 44 | 1401911 | 1331911 | 69956 | 0.0245 |
| autonomous-sdlc-harness:committer | Commit Task 7 | 25.0s | 7 | 2153 | 16 | 192083 | 178725 | 13342 | 0.0061 |
| autonomous-sdlc-harness:architecture-reviewer | Branch architecture review | 1m 15s | 19 | 7385 | 40 | 1540127 | 1415509 | 124578 | 0.0185 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch code review | 6m 14s | 52 | 38695 | 106 | 7487454 | 7270899 | 216449 | 0.0919 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 55.3s | 15 | 5659 | 32 | 986912 | 896995 | 89885 | 0.0136 |
| autonomous-sdlc-harness:committer | Commit code review file | 24.3s | 6 | 2429 | 14 | 160791 | 136460 | 24317 | 0.006 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $37.86 |
| Cost — claude-opus-5-5 | $37.86 |
| Input tokens (uncached) | 1358 |
| Total input tokens (incl. cache) | 73787192 |
| Output tokens | 436985 |
| Thinking tokens (main thread) | 2978 |
| Cache read tokens | 70945896 |
| Cache write tokens | 2839938 |
| Cache write tokens, main thread (5m / 1h) | 0 / 240417 |
| Cache hit ratio | 0.9615 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 226 | 19559167 | 3365 | 19318524 | 240417 |
| sub-agents | 1132 | 54228025 | 403475 | 51627372 | 2599521 |
| remainder | 0 | 0 | 30145 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 16 |
| Sub-agents spawned / failed / killed | 31 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 164 |
| Time to first token | 1.6s |
| Rate-limit peak | seven_day 0.82 |

## Session 2 — 2026-11-09T21:36:04.041Z → 2026-11-09T22:19:51.155Z

Session id: `ef5324b5-cef9-480d-921f-7f377c3cf682`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 43m 47s | 43m 48s | 14m 42s | 0.0s | 0.0s | 43m 47s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 235 | 1.6s | 4.8s | 22.0s | 31.1s | 0 |
| autonomous-sdlc-harness:committer | 31 | 1.6s | 3.9s | 4.3s | 4.3s | 0 |
| autonomous-sdlc-harness:layer-implementer | 33 | 1.9s | 3.2s | 5.1s | 5.1s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 52 | 3.0s | 13.5s | 31.1s | 31.1s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 6 | 1.8s | 17.9s | 17.9s | 17.9s | 0 |
| orchestrator | 113 | 1.5s | 2.2s | 9.1s | 11.8s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 11 | 10m 26s | 5m 13s |
| Bash | autonomous-sdlc-harness:committer | 45 | 25.6s | 4.8s |
| Bash | autonomous-sdlc-harness:layer-implementer | 32 | 51.5s | 7.5s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 43 | 6.2s | 0.3s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 7 | 0.8s | 0.1s |
| Bash | orchestrator | 134 | 28m 19s | 1m 01s |
| Edit | autonomous-sdlc-harness:committer | 4 | 0.1s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 6 | 0.2s | 0.0s |
| Edit | orchestrator | 8 | 7.7s | 3.9s |
| Read | autonomous-sdlc-harness:committer | 2 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 15 | 0.6s | 0.2s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 15 | 0.3s | 0.2s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 3 | 0.0s | 0.0s |
| Read | orchestrator | 19 | 1.9s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-09T22:02:43.171Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T21:56:24.372Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T22:06:57.415Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T21:52:11.427Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T22:00:36.379Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T21:54:18.468Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T22:05:53.758Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T22:12:12.596Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T21:53:15.316Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T21:50:04.825Z | 1m 00s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 4 | 18.8s |
| autonomous-sdlc-harness:committer | git branch --show-current | 4 | 0.5s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 4 | 0.4s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 4 | 0.5s |
| autonomous-sdlc-harness:committer | git status --short | 9 | 1.3s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 4 | 0.4s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 5 | 0.6s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 12 | 56.8s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_1 | 27 | 26m 54s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 10 | 1.4s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; echo checked | 27 | 15.3s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:layer-implementer | Fix Finding 4 (plugin) | 24.3s | 5 | 2334 | 12 | 156123 | 125894 | 30217 | 0.0093 |
| autonomous-sdlc-harness:committer | Commit Finding 4 fix | 31.2s | 7 | 2759 | 16 | 195373 | 168709 | 26648 | 0.0119 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 3 (cli) | 26.9s | 7 | 2440 | 16 | 206768 | 192901 | 13851 | 0.0103 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 3 (general) | 46.5s | 9 | 3239 | 20 | 381161 | 351034 | 30107 | 0.0177 |
| autonomous-sdlc-harness:committer | Commit Finding 3 fix | 29.6s | 7 | 2555 | 16 | 188953 | 176454 | 12483 | 0.0113 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 1 (plugin) | 25.0s | 6 | 2446 | 14 | 236090 | 210947 | 25129 | 0.0095 |
| autonomous-sdlc-harness:committer | Commit Finding 1 fix | 32.7s | 9 | 2805 | 20 | 240592 | 227286 | 13286 | 0.0125 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 2 (cli) | 35.2s | 6 | 3217 | 14 | 245728 | 217122 | 28592 | 0.0134 |
| autonomous-sdlc-harness:committer | Commit Finding 2 fix | 27.9s | 8 | 2378 | 18 | 218578 | 204616 | 13944 | 0.0106 |
| autonomous-sdlc-harness:skeptic-reviewer | Skeptic review of branch | 5m 13s | 52 | 30860 | 106 | 4932332 | 4782343 | 149883 | 0.1192 |
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 33.7s | 6 | 4289 | 14 | 239839 | 197540 | 42285 | 0.0129 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $10.96 |
| Cost — claude-opus-5-5 | $10.96 |
| Input tokens (uncached) | 494 |
| Total input tokens (incl. cache) | 27019394 |
| Output tokens | 94053 |
| Thinking tokens (main thread) | 4725 |
| Cache read tokens | 26399612 |
| Cache write tokens | 619288 |
| Cache write tokens, main thread (5m / 1h) | 0 / 232863 |
| Cache hit ratio | 0.9771 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 228 | 19777857 | 2564 | 19544766 | 232863 |
| sub-agents | 266 | 7241537 | 59322 | 6854846 | 386425 |
| remainder | 0 | 0 | 32167 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 3 |
| Sub-agents spawned / failed / killed | 11 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 177 |
| Time to first token | 1.4s |
| Rate-limit peak | seven_day 0.83 |
