# Run analytics — feat_gate12_sandbox_round_driver

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 50m 30s |
| Wall | 50m 30s |
| Active | 50m 30s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $24.63 |
| Input tokens (uncached) | 784 |
| Total input tokens (incl. cache) | 43887757 |
| Output tokens | 321388 |
| Thinking tokens (main thread) | 1989 |
| Cache read tokens | 42010810 |
| Cache write tokens | 1876163 |
| Cache write tokens, main thread (5m / 1h) | 0 / 138921 |
| Cache hit ratio | 0.9572 |
| Requests | 378 |
| Request latency p50 / p90 / p99 / max | 2.6s / 14.1s / 48.3s / 1m 47s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 13 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write the task plan — 15m 01s (session 1) |
| Rate-limit peak | seven_day 0.18 |

## Session 1 — 2026-11-04T15:16:46.120Z → 2026-11-04T16:07:16.212Z

Session id: `0ed01e56-c293-4174-b639-61b11a4152a4`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 50m 30s | 50m 31s | 49m 50s | 0.0s | 0.0s | 50m 30s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 378 | 2.6s | 14.1s | 48.3s | 1m 47s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 66 | 2.4s | 19.4s | 34.6s | 34.6s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 134 | 3.1s | 15.3s | 39.2s | 58.2s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 123 | 3.2s | 14.1s | 1m 08s | 1m 47s | 0 |
| orchestrator | 55 | 1.4s | 1.8s | 9.6s | 9.6s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 13 | 47m 40s | 15m 01s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 44 | 6.3s | 0.3s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 89 | 12.6s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 75 | 10.3s | 0.2s |
| Bash | orchestrator | 51 | 16.9s | 4.6s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 76 | 3.2s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 121 | 4.6s | 0.5s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 103 | 2.3s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 63 | 1.6s | 0.3s |
| Read | orchestrator | 3 | 0.7s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 19 | 0.7s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-04T15:17:15.089Z | 4.6s | 497 | false | false |
| Bash | orchestrator | 2026-11-04T15:17:15.574Z | 4.2s | 31 | false | false |
| Bash | orchestrator | 2026-11-04T15:17:12.873Z | 0.5s | 75 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-04T15:53:30.540Z | 0.5s | 42029 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-04T16:02:23.546Z | 0.3s | 42029 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-04T15:32:38.511Z | 0.3s | 42029 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-04T15:42:14.002Z | 0.3s | 42029 | false | false |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 2026-11-04T15:33:31.341Z | 0.3s | 3496 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-04T15:17:31.930Z | 0.3s | 42029 | false | false |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-04T15:34:40.089Z | 0.2s | 42029 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.6s |
| autonomous-sdlc-harness:task-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_gate12_sandbox_round_driver --outcome FAIL --findings harness-runs/task_plan_reviews/fea | 3 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_gate12_sandbox_round_driver --outcome PASS | 3 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_gate12_sandbox_round_driver --outcome returned | 5 | 1.1s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 12 | 1.6s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write the task plan | 15m 01s | 62 | 95944 | 128 | 10372691 | 10082848 | 289715 | 0.2976 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 28s | 10 | 9444 | 22 | 998339 | 869739 | 128578 | 0.0293 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan structural review | 6m 00s | 45 | 37605 | 92 | 6419432 | 6212427 | 206913 | 0.119 |
| autonomous-sdlc-harness:task-plan-writer | Revise the task plan | 1m 42s | 11 | 11912 | 24 | 574977 | 507908 | 67045 | 0.0339 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 33s | 13 | 9499 | 28 | 1217988 | 1092256 | 125704 | 0.0308 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan structural review | 4m 24s | 43 | 26835 | 88 | 4373058 | 4224386 | 148584 | 0.0873 |
| autonomous-sdlc-harness:task-plan-writer | Revise the task plan | 4m 57s | 30 | 33389 | 62 | 2430108 | 2317427 | 112619 | 0.0982 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 26s | 11 | 9450 | 24 | 906563 | 777728 | 128811 | 0.0286 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan structural review | 5m 04s | 46 | 31266 | 94 | 5832688 | 5646892 | 185702 | 0.1006 |
| autonomous-sdlc-harness:task-plan-writer | Revise the task plan | 1m 59s | 14 | 13467 | 30 | 848664 | 775376 | 73258 | 0.0396 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 47s | 16 | 11334 | 34 | 1411899 | 1284407 | 127458 | 0.0356 |
| autonomous-sdlc-harness:task-plan-writer | Revise the task plan | 24.0s | 6 | 2393 | 14 | 194797 | 175454 | 19329 | 0.0079 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 47s | 16 | 11837 | 34 | 1522550 | 1398990 | 123526 | 0.0355 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $24.63 |
| Cost — claude-opus-5-5 | $24.63 |
| Input tokens (uncached) | 784 |
| Total input tokens (incl. cache) | 43887757 |
| Output tokens | 321388 |
| Thinking tokens (main thread) | 1989 |
| Cache read tokens | 42010810 |
| Cache write tokens | 1876163 |
| Cache write tokens, main thread (5m / 1h) | 0 / 138921 |
| Cache hit ratio | 0.9572 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 110 | 6784003 | 1228 | 6644972 | 138921 |
| sub-agents | 674 | 37103754 | 304375 | 35365838 | 1737242 |
| remainder | 0 | 0 | 15785 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 13 |
| Sub-agents spawned / failed / killed | 13 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 72 |
| Time to first token | 1.7s |
| Rate-limit peak | seven_day 0.18 |
