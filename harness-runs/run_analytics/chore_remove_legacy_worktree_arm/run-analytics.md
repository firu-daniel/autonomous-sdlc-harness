# Run analytics — chore_remove_legacy_worktree_arm

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 5m 28s |
| Wall | 5m 28s |
| Active | 5m 28s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $4.42 |
| Input tokens (uncached) | 148 |
| Total input tokens (incl. cache) | 9564256 |
| Output tokens | 31500 |
| Thinking tokens (main thread) | 678 |
| Cache read tokens | 9241273 |
| Cache write tokens | 322835 |
| Cache write tokens, main thread (5m / 1h) | 0 / 108488 |
| Cache hit ratio | 0.9662 |
| Requests | 73 |
| Request latency p50 / p90 / p99 / max | 2.3s / 7.1s / 13.0s / 13.0s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 4m 13s (session 1) |
| Rate-limit peak | seven_day 0.54 |

## Session 1 — 2026-11-07T07:23:23.931Z → 2026-11-07T07:28:52.248Z

Session id: `6fd53afe-3718-41ab-a842-c822f8a45b7c`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 5m 28s | 5m 29s | 5m 09s | 0.0s | 0.0s | 5m 28s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 73 | 2.3s | 7.1s | 13.0s | 13.0s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 52 | 2.8s | 7.6s | 13.0s | 13.0s | 0 |
| orchestrator | 21 | 1.4s | 2.3s | 7.3s | 7.3s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 1 | 4m 13s | 4m 13s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 40 | 11.3s | 1.5s |
| Bash | orchestrator | 14 | 7.5s | 4.5s |
| Edit | orchestrator | 2 | 0.1s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-writer | 22 | 1.5s | 0.3s |
| Read | orchestrator | 5 | 1.0s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.2s | 0.1s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-07T07:23:58.432Z | 4.5s | 469 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:26:48.064Z | 1.5s | 2407 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:26:31.816Z | 1.2s | 2768 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:24:57.016Z | 0.8s | 4536 | false | false |
| Bash | orchestrator | 2026-11-07T07:23:56.101Z | 0.7s | 75 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:24:35.472Z | 0.4s | 948 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:25:46.461Z | 0.4s | 2130 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:26:06.537Z | 0.4s | 1864 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:27:12.893Z | 0.4s | 252 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:27:09.411Z | 0.3s | 1187 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 4m 13s | 52 | 24009 | 106 | 7526090 | 7311637 | 214347 | 0.7726 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $4.42 |
| Cost — claude-opus-5-5 | $4.42 |
| Input tokens (uncached) | 148 |
| Total input tokens (incl. cache) | 9564256 |
| Output tokens | 31500 |
| Thinking tokens (main thread) | 678 |
| Cache read tokens | 9241273 |
| Cache write tokens | 322835 |
| Cache write tokens, main thread (5m / 1h) | 0 / 108488 |
| Cache hit ratio | 0.9662 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 42 | 2038166 | 281 | 1929636 | 108488 |
| sub-agents | 106 | 7526090 | 24009 | 7311637 | 214347 |
| remainder | 0 | 0 | 7210 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents spawned / failed / killed | 1 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 27 |
| Time to first token | 1.5s |
| Rate-limit peak | seven_day 0.54 |
