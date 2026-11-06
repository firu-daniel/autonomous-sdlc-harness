# Run analytics — chore_sbx_flow_probe

## Whole run

| Measure | Value |
|---|---|
| Sessions | 3 (0 incomplete) |
| Span | 566h52m |
| Wall | 1h41m |
| Active | 1h41m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $24.81 |
| Input tokens (uncached) | 994 |
| Total input tokens (incl. cache) | 55543453 |
| Output tokens | 177350 |
| Thinking tokens (main thread) | 7568 |
| Cache read tokens | 53776403 |
| Cache write tokens | 1766056 |
| Cache write tokens, main thread (5m / 1h) | 0 / 557449 |
| Cache hit ratio | 0.9682 |
| Requests | 474 |
| Request latency p50 / p90 / p99 / max | 1.7s / 4.0s / 16.7s / 30.5s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 16 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 2m 35s (session 2) |
| Rate-limit peak | five_hour 0.03, seven_day 0.5 |

## Session 1 — 2026-10-14T06:19:52.232Z → 2026-10-14T06:20:47.263Z

Session id: `c969b7e6-9cf0-42cc-b5ad-cf009eea3b06`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 55.0s | 57.0s | 55.1s | 0.0s | 0.0s | 55.0s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 13 | 1.8s | 6.5s | 6.8s | 6.8s | 0 |
| orchestrator | 13 | 1.8s | 6.5s | 6.8s | 6.8s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Bash | orchestrator | 8 | 1.4s | 0.3s |
| Read | orchestrator | 6 | 1.3s | 0.3s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Read | orchestrator | 2026-10-14T06:20:09.034Z | 0.3s | 30845 | false | false |
| Read | orchestrator | 2026-10-14T06:20:01.270Z | 0.3s | 60226 | false | false |
| Read | orchestrator | 2026-10-14T06:20:08.728Z | 0.3s | 33473 | false | false |
| Bash | orchestrator | 2026-10-14T06:19:54.873Z | 0.3s | 1891 | false | false |
| Read | orchestrator | 2026-10-14T06:20:03.263Z | 0.2s | 40575 | false | false |
| Bash | orchestrator | 2026-10-14T06:20:18.625Z | 0.1s | 296 | true | false |
| Bash | orchestrator | 2026-10-14T06:20:01.090Z | 0.1s | 6 | false | false |
| Bash | orchestrator | 2026-10-14T06:20:25.703Z | 0.1s | 296 | true | false |
| Bash | orchestrator | 2026-10-14T06:19:58.336Z | 0.1s | 1404 | true | false |
| Bash | orchestrator | 2026-10-14T06:20:06.596Z | 0.1s | 1494 | false | false |

#### Polling loops

None.

### Sub-agents

None.

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $1.18 |
| Cost — claude-opus-5-5 | $1.18 |
| Input tokens (uncached) | 26 |
| Total input tokens (incl. cache) | 1153027 |
| Output tokens | 5858 |
| Thinking tokens (main thread) | 876 |
| Cache read tokens | 1045857 |
| Cache write tokens | 107144 |
| Cache write tokens, main thread (5m / 1h) | 0 / 107144 |
| Cache hit ratio | 0.9071 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 26 | 1153027 | 190 | 1045857 | 107144 |
| sub-agents | 0 | 0 | 0 | 0 | 0 |
| remainder | 0 | 0 | 5668 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 1 |
| Sub-agents spawned / failed / killed | 0 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 19 |
| Time to first token | 1.9s |
| Rate-limit peak | five_hour 0.03, seven_day 0.04 |

## Session 2 — 2026-11-06T19:28:39.129Z → 2026-11-06T20:28:48.822Z

Session id: `f56e75da-bbbf-44fb-a4d5-95edda720a78`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h00m | 1h00m | 22m 52s | 0.0s | 0.0s | 1h00m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 379 | 1.7s | 4.1s | 16.7s | 30.5s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 24 | 1.9s | 3.4s | 6.7s | 6.7s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 16 | 1.9s | 11.5s | 15.6s | 15.6s | 0 |
| autonomous-sdlc-harness:committer | 43 | 1.7s | 2.9s | 6.2s | 6.2s | 0 |
| autonomous-sdlc-harness:layer-implementer | 46 | 1.9s | 3.5s | 4.5s | 4.5s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 15 | 2.0s | 3.3s | 3.8s | 3.8s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 22 | 2.5s | 10.8s | 12.3s | 12.3s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 38 | 2.4s | 4.8s | 12.7s | 12.7s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 29 | 2.9s | 16.7s | 30.5s | 30.5s | 0 |
| orchestrator | 146 | 1.5s | 2.2s | 7.6s | 17.7s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 21 | 17m 30s | 2m 35s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 22 | 3.5s | 0.2s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 10 | 1.6s | 0.2s |
| Bash | autonomous-sdlc-harness:committer | 63 | 37.7s | 4.7s |
| Bash | autonomous-sdlc-harness:layer-implementer | 35 | 31.7s | 3.5s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 12 | 1.8s | 0.2s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 16 | 2.5s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 27 | 3.9s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 19 | 3.0s | 0.4s |
| Bash | orchestrator | 179 | 36m 41s | 1m 05s |
| Edit | autonomous-sdlc-harness:committer | 4 | 0.2s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 4 | 0.2s | 0.1s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 5 | 0.2s | 0.0s |
| Edit | orchestrator | 13 | 15.0s | 3.8s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 9 | 1.4s | 0.3s |
| Read | autonomous-sdlc-harness:branch-reviewer | 17 | 0.7s | 0.2s |
| Read | autonomous-sdlc-harness:committer | 6 | 0.1s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 24 | 2.2s | 0.3s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 24 | 1.5s | 0.4s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 14 | 0.2s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 32 | 1.1s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 18 | 0.7s | 0.2s |
| Read | orchestrator | 19 | 9.9s | 4.0s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 3 | 0.2s | 0.1s |
| Write | autonomous-sdlc-harness:skeptic-reviewer | 2 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 2 | 0.1s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-06T19:54:36.105Z | 1m 05s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T19:57:54.801Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T19:55:45.239Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T19:59:00.361Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T19:53:29.904Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:06:27.041Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:01:08.879Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:11:46.217Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:13:53.296Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:09:38.500Z | 1m 01s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 3 | 0.4s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 6 | 27.3s |
| autonomous-sdlc-harness:committer | git branch --show-current | 6 | 0.7s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 6 | 0.7s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 6 | 0.8s |
| autonomous-sdlc-harness:committer | git status --short | 12 | 1.8s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 6 | 0.7s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 4 | 11.3s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 4 | 0.5s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/no-container-home-paths.test.mjs | 4 | 10.9s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 13 | 59.8s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_sbx_flow_probe --outcome PASS | 3 | 0.8s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_1 | 35 | 34m 42s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE | 52 | 38.7s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 2m 35s | 21 | 16231 | 44 | 1830964 | 1713825 | 117095 | 0.0431 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 20.4s | 7 | 1781 | 16 | 299125 | 226704 | 72405 | 0.0057 |
| autonomous-sdlc-harness:task-plan-reviewer | Review task plan | 1m 30s | 24 | 8744 | 50 | 1908105 | 1804210 | 103845 | 0.025 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 54.9s | 8 | 6506 | 18 | 295296 | 267091 | 28187 | 0.0152 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 23.2s | 9 | 2129 | 20 | 364648 | 320622 | 44006 | 0.0064 |
| autonomous-sdlc-harness:task-plan-reviewer | Re-review task plan | 57.6s | 14 | 5754 | 30 | 805290 | 738459 | 66801 | 0.016 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 | 54.9s | 13 | 4995 | 28 | 945089 | 855398 | 89663 | 0.0152 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 27.7s | 8 | 2436 | 18 | 231381 | 203254 | 28109 | 0.0077 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of branch | 27.0s | 8 | 2683 | 18 | 334547 | 275580 | 58949 | 0.0075 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch code review | 1m 44s | 16 | 11642 | 34 | 1049431 | 952544 | 96853 | 0.0289 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review the code review | 47.1s | 9 | 4945 | 20 | 494648 | 415881 | 78747 | 0.0131 |
| autonomous-sdlc-harness:committer | Commit code review file | 22.2s | 7 | 1730 | 16 | 191319 | 177645 | 13658 | 0.0062 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 1 | 38.9s | 10 | 3268 | 22 | 568911 | 503528 | 65361 | 0.0108 |
| autonomous-sdlc-harness:committer | Commit Finding 1 fix | 25.7s | 8 | 2074 | 18 | 208704 | 196297 | 12389 | 0.0071 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 2 | 37.8s | 13 | 3034 | 28 | 714658 | 665400 | 49230 | 0.0105 |
| autonomous-sdlc-harness:committer | Commit Finding 2 fix | 27.4s | 8 | 2346 | 18 | 223373 | 207832 | 15523 | 0.0076 |
| autonomous-sdlc-harness:skeptic-reviewer | Adversarial skeptic review | 1m 58s | 22 | 12650 | 46 | 1157238 | 1080122 | 77070 | 0.0329 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review skeptic review | 29.6s | 6 | 3241 | 14 | 334380 | 252990 | 81376 | 0.0082 |
| autonomous-sdlc-harness:committer | Commit skeptic review file | 18.6s | 5 | 1462 | 12 | 145972 | 132710 | 13250 | 0.0052 |
| autonomous-sdlc-harness:layer-implementer | Fix skeptic Finding 1 | 42.4s | 10 | 3202 | 22 | 561456 | 510868 | 50566 | 0.0118 |
| autonomous-sdlc-harness:committer | Commit skeptic Finding 1 fix | 25.7s | 7 | 2177 | 16 | 186459 | 173867 | 12576 | 0.0071 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $19.17 |
| Cost — claude-opus-5-5 | $19.17 |
| Input tokens (uncached) | 800 |
| Total input tokens (incl. cache) | 42461001 |
| Output tokens | 145126 |
| Thinking tokens (main thread) | 3893 |
| Cache read tokens | 41011697 |
| Cache write tokens | 1448504 |
| Cache write tokens, main thread (5m / 1h) | 0 / 272845 |
| Cache hit ratio | 0.9659 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 292 | 29610007 | 3391 | 29336870 | 272845 |
| sub-agents | 508 | 12850994 | 103030 | 11674827 | 1175659 |
| remainder | 0 | 0 | 38705 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 12 |
| Sub-agents spawned / failed / killed | 21 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 237 |
| Time to first token | 1.7s |
| Rate-limit peak | seven_day 0.5 |

## Session 3 — 2026-11-06T20:31:37.708Z → 2026-11-06T21:12:03.007Z

Session id: `782849fd-a9bb-4ae5-867f-553a7920e12f`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 40m 25s | 40m 26s | 4m 07s | 0.0s | 0.0s | 40m 25s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 82 | 1.7s | 2.5s | 16.7s | 16.7s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 6 | 1.6s | 16.7s | 16.7s | 16.7s | 0 |
| orchestrator | 76 | 1.7s | 2.5s | 9.1s | 9.1s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 1 | 32.6s | 32.6s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 9 | 1.3s | 0.1s |
| Bash | orchestrator | 114 | 36m 45s | 1m 06s |
| Edit | orchestrator | 2 | 0.1s | 0.0s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 2 | 0.0s | 0.0s |
| Read | orchestrator | 11 | 0.9s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-06T20:36:55.151Z | 1m 06s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:34:41.545Z | 1m 05s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:40:14.618Z | 1m 03s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:39:09.076Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:50:56.309Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:41:21.202Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:38:03.953Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:43:31.106Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:46:42.032Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-06T20:42:26.933Z | 1m 02s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 5 | 22.7s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_1 | 35 | 35m 44s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE | 35 | 28.9s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 32.6s | 6 | 4210 | 14 | 193625 | 160663 | 32948 | 0.0135 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $4.46 |
| Cost — claude-opus-5-5 | $4.46 |
| Input tokens (uncached) | 168 |
| Total input tokens (incl. cache) | 11929425 |
| Output tokens | 26366 |
| Thinking tokens (main thread) | 2799 |
| Cache read tokens | 11718849 |
| Cache write tokens | 210408 |
| Cache write tokens, main thread (5m / 1h) | 0 / 177460 |
| Cache hit ratio | 0.9823 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 154 | 11735800 | 1338 | 11558186 | 177460 |
| sub-agents | 14 | 193625 | 4210 | 160663 | 32948 |
| remainder | 0 | 0 | 20818 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 3 |
| Sub-agents spawned / failed / killed | 1 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 133 |
| Time to first token | 1.4s |
| Rate-limit peak | seven_day 0.5 |
