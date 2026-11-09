# Run analytics — fix_test_timing_attribution

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 1h14m |
| Wall | 1h14m |
| Active | 1h14m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $25.38 |
| Input tokens (uncached) | 1044 |
| Total input tokens (incl. cache) | 57480549 |
| Output tokens | 236276 |
| Thinking tokens (main thread) | 1996 |
| Cache read tokens | 55756705 |
| Cache write tokens | 1722800 |
| Cache write tokens, main thread (5m / 1h) | 0 / 295596 |
| Cache hit ratio | 0.97 |
| Requests | 495 |
| Request latency p50 / p90 / p99 / max | 1.7s / 5.4s / 34.4s / 1m 36s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 10 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 9m 18s (session 1) |
| Rate-limit peak | seven_day 0.74 |

## Gate rounds

Wait is the orchestrator's wait on `run-test-suite.sh --wait <label>`, summed over every polling row whose command ends in that label; — when none matches, as for a label waited on fewer than three times in a session (no polling row is written for it) or a command cut at 160 characters.

A phase's test-file total sums each file's own seconds, so it exceeds the gate's wall time when files run in parallel.

### Round task_round_1 — pass

| Measure | Value |
|---|---|
| Wait (every run of task_round_1) | 27m 20s |
| Gate rows | 29 (complete) |
| Test files — full | 174 files, 12744.4 s summed |

| Phase | Gate | Status | Seconds |
|---|---|---|---|
| full | 1 | ok | 0 s |
| full | 2a | ok | 1 s |
| full | 2b | ok | 0 s |
| full | 2c | ok | 0 s |
| full | 2d | ok | 0 s |
| full | 2e | ok | 0 s |
| full | 3a | ok | 0 s |
| full | 3b | ok | 1 s |
| full | 3c | ok | 1 s |
| full | 3d | ok | 0 s |
| full | 3e | ok | 0 s |
| full | 3f | ok | 1 s |
| full | 4 | ok | 1664 s |
| full | 6a | ok | 2 s |
| full | 6b | ok | 0 s |
| full | 6c | ok | 1 s |
| full | 6d | ok | 2 s |
| full | 6e | ok | 0 s |
| full | 6f | ok | 1 s |
| full | 11 | ok | 15 s |
| full | 13a | BLOCKED | 0 s |
| full | 13b | BLOCKED | 0 s |
| full | 13c | BLOCKED | 0 s |
| full | 13d | SKIPPED | 0 s |
| full | 14a | ok | 1 s |
| full | 14b | ok | 0 s |
| full | 14c | ok | 1 s |
| full | 14d | SKIPPED | 0 s |
| full | 16 | ok | 2 s |

#### Slowest test files — full (10 of 174)

| File | Status | Seconds | Tests | Failed |
|---|---|---|---|---|
| test/watcher-review-drop-payloads.test.mjs | pass | 806.8 | 21 | 0 |
| test/watcher-remote-job.test.mjs | pass | 668.8 | 29 | 0 |
| test/watcher-placeholder-host.test.mjs | pass | 616.6 | 27 | 0 |
| test/watcher-remote-dispatch.test.mjs | pass | 564.3 | 14 | 0 |
| test/remote-run.test.mjs | pass | 547.1 | 130 | 0 |
| test/watcher-run-profile.test.mjs | pass | 530.8 | 21 | 0 |
| test/remote-control.test.mjs | pass | 484.7 | 83 | 0 |
| test/watcher-stall-reset-payloads.test.mjs | pass | 471.3 | 18 | 0 |
| test/remote-control-review.test.mjs | pass | 468.4 | 33 | 0 |
| test/doctor.test.mjs | pass | 438.3 | 1 | 0 |

## Session 1 — 2026-11-09T06:38:41.419Z → 2026-11-09T07:53:24.503Z

Session id: `175aee41-b17c-42e0-a146-96c6f3af299b`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h14m | 1h14m | 37m 09s | 0.0s | 0.0s | 1h14m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 495 | 1.7s | 5.4s | 34.4s | 1m 36s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 19 | 1.9s | 7.8s | 11.6s | 11.6s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 24 | 3.4s | 14.3s | 20.9s | 20.9s | 0 |
| autonomous-sdlc-harness:committer | 77 | 1.6s | 4.1s | 6.6s | 6.6s | 0 |
| autonomous-sdlc-harness:layer-implementer | 111 | 2.1s | 4.1s | 7.7s | 24.4s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 7 | 2.4s | 7.4s | 7.4s | 7.4s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 22 | 2.7s | 6.2s | 20.8s | 20.8s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 8 | 1.6s | 17.2s | 17.2s | 17.2s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 23 | 2.8s | 16.6s | 22.2s | 22.2s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 34 | 3.8s | 45.6s | 1m 36s | 1m 36s | 0 |
| orchestrator | 170 | 1.4s | 2.0s | 6.1s | 7.1s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 27 | 39m 25s | 9m 18s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 15 | 2.0s | 0.1s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 20 | 3.2s | 0.3s |
| Bash | autonomous-sdlc-harness:committer | 111 | 1m 02s | 4.8s |
| Bash | autonomous-sdlc-harness:layer-implementer | 90 | 9m 25s | 1m 38s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 6 | 0.8s | 0.1s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 22 | 3.9s | 0.6s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 9 | 1.1s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 16 | 2.7s | 0.4s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 25 | 4.2s | 0.4s |
| Bash | orchestrator | 146 | 29m 23s | 1m 01s |
| Edit | autonomous-sdlc-harness:committer | 9 | 0.3s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 50 | 2.0s | 0.0s |
| Edit | orchestrator | 13 | 17.4s | 3.5s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 20 | 1.4s | 0.2s |
| Read | autonomous-sdlc-harness:branch-reviewer | 9 | 0.5s | 0.2s |
| Read | autonomous-sdlc-harness:committer | 10 | 0.1s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 40 | 2.3s | 0.3s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 9 | 0.6s | 0.2s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 4 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 2 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 23 | 0.8s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 18 | 0.7s | 0.2s |
| Read | orchestrator | 14 | 9.9s | 3.9s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:layer-implementer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 8 | 0.3s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T06:56:27.839Z | 1m 38s | 2231 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T07:16:59.020Z | 1m 35s | 2230 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T06:53:50.880Z | 1m 31s | 159 | false | false |
| Bash | orchestrator | 2026-11-09T07:26:12.874Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T07:41:57.292Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T07:34:37.394Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T07:28:19.365Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T07:35:40.701Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T07:32:31.990Z | 1m 00s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T07:44:03.601Z | 1m 00s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 10 | 45.6s |
| autonomous-sdlc-harness:committer | git branch --show-current | 10 | 1.2s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 10 | 1.1s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 10 | 1.1s |
| autonomous-sdlc-harness:committer | git status --short | 23 | 3.3s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 10 | 1.1s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 9 | 21.0s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 9 | 1.1s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/main-anchor-isolation.test.mjs | 4 | 6.4s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/fix_test_timing_attribution_progress.md" -- "chore: Flow progress C2 | 3 | 1.2s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 17 | 1m 15s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; bash scripts/run-test-suite.sh --wait task_round_1 | 28 | 27m 20s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 25 | 14.8s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 9m 18s | 34 | 57993 | 70 | 3861194 | 3669675 | 191449 | 0.1246 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 53.2s | 10 | 5521 | 22 | 595593 | 507291 | 88280 | 0.0119 |
| autonomous-sdlc-harness:task-plan-reviewer | Review task plan | 2m 35s | 23 | 15407 | 48 | 2330451 | 2196746 | 133657 | 0.0347 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 | 5m 11s | 24 | 10386 | 50 | 1281742 | 1216042 | 65650 | 0.0696 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 29.2s | 8 | 2427 | 18 | 216460 | 190126 | 26316 | 0.0065 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 | 3m 01s | 16 | 8628 | 34 | 714810 | 678307 | 36469 | 0.0404 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 26.1s | 7 | 2140 | 16 | 199490 | 184570 | 14904 | 0.0058 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 | 47.4s | 9 | 5128 | 20 | 469823 | 423203 | 46600 | 0.0106 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 26.7s | 8 | 2076 | 18 | 235266 | 219391 | 15857 | 0.006 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 4 | 1m 11s | 10 | 8160 | 22 | 528720 | 483179 | 45519 | 0.0161 |
| autonomous-sdlc-harness:committer | Commit Task 4 | 27.9s | 7 | 2434 | 16 | 195308 | 181297 | 13995 | 0.0062 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 5 | 1m 07s | 10 | 7693 | 22 | 499329 | 455856 | 43451 | 0.0151 |
| autonomous-sdlc-harness:committer | Commit Task 5 | 28.8s | 10 | 2315 | 22 | 278396 | 261700 | 16674 | 0.0064 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 6 | 51.6s | 11 | 5477 | 24 | 517437 | 476186 | 41227 | 0.0115 |
| autonomous-sdlc-harness:committer | Commit Task 6 | 27.8s | 9 | 2192 | 20 | 239776 | 226749 | 13007 | 0.0062 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 7 | 50.6s | 12 | 4870 | 26 | 723342 | 667794 | 55522 | 0.0113 |
| autonomous-sdlc-harness:committer | Commit Task 7 | 28.6s | 8 | 2297 | 18 | 224526 | 209397 | 15111 | 0.0064 |
| autonomous-sdlc-harness:architecture-reviewer | Branch architecture review | 34.5s | 9 | 3392 | 20 | 682349 | 578877 | 103452 | 0.0077 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch code review | 2m 49s | 24 | 17037 | 50 | 2595753 | 2459953 | 135750 | 0.0378 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 43.8s | 7 | 4746 | 16 | 352300 | 268196 | 84088 | 0.0098 |
| autonomous-sdlc-harness:committer | Commit code review file | 18.9s | 5 | 1416 | 12 | 145382 | 132234 | 13136 | 0.0042 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 2 | 2m 06s | 9 | 2658 | 20 | 314648 | 277968 | 36660 | 0.0283 |
| autonomous-sdlc-harness:committer | Commit code-review Finding 2 | 26.6s | 7 | 2279 | 16 | 221097 | 201827 | 19254 | 0.0059 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 1 | 33.7s | 10 | 3055 | 22 | 558987 | 508028 | 50937 | 0.0075 |
| autonomous-sdlc-harness:committer | Commit code-review Finding 1 | 28.3s | 8 | 2338 | 18 | 215402 | 201435 | 13949 | 0.0063 |
| autonomous-sdlc-harness:skeptic-reviewer | Adversarial skeptic review | 1m 43s | 22 | 9806 | 46 | 1120362 | 1046244 | 74072 | 0.023 |
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 35.2s | 8 | 4274 | 18 | 237955 | 205719 | 32218 | 0.0079 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $25.38 |
| Cost — claude-opus-5-5 | $25.38 |
| Input tokens (uncached) | 1044 |
| Total input tokens (incl. cache) | 57480549 |
| Output tokens | 236276 |
| Thinking tokens (main thread) | 1996 |
| Cache read tokens | 55756705 |
| Cache write tokens | 1722800 |
| Cache write tokens, main thread (5m / 1h) | 0 / 295596 |
| Cache hit ratio | 0.97 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 340 | 37924651 | 4243 | 37628715 | 295596 |
| sub-agents | 704 | 19555898 | 196145 | 18127990 | 1427204 |
| remainder | 0 | 0 | 35888 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 10 |
| Sub-agents spawned / failed / killed | 27 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 205 |
| Time to first token | 1.4s |
| Rate-limit peak | seven_day 0.74 |
