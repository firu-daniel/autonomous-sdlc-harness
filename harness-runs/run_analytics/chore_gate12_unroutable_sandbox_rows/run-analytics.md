# Run analytics — chore_gate12_unroutable_sandbox_rows

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 7m 26s |
| Wall | 7m 26s |
| Active | 7m 26s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $3.78 |
| Input tokens (uncached) | 102 |
| Total input tokens (incl. cache) | 5720502 |
| Output tokens | 41461 |
| Thinking tokens (main thread) | 930 |
| Cache read tokens | 5413853 |
| Cache write tokens | 306547 |
| Cache write tokens, main thread (5m / 1h) | 0 / 111901 |
| Cache hit ratio | 0.9464 |
| Requests | 50 |
| Request latency p50 / p90 / p99 / max | 2.4s / 23.3s / 58.5s / 58.5s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 1 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 6m 00s (session 1) |
| Rate-limit peak | seven_day 0.38 |

## Session 1 — 2026-11-05T20:08:17.393Z → 2026-11-05T20:15:43.396Z

Session id: `746c42be-445a-4a68-b9a4-27d34c150d40`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 7m 26s | 7m 28s | 7m 15s | 0.0s | 0.0s | 7m 26s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 50 | 2.4s | 23.3s | 58.5s | 58.5s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 31 | 2.7s | 27.5s | 58.5s | 58.5s | 0 |
| orchestrator | 19 | 1.5s | 4.3s | 9.2s | 9.2s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 1 | 6m 00s | 6m 00s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 20 | 2.6s | 0.1s |
| Bash | orchestrator | 14 | 9.1s | 5.4s |
| Read | autonomous-sdlc-harness:task-plan-writer | 21 | 0.9s | 0.2s |
| Read | orchestrator | 6 | 1.0s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-05T20:08:48.128Z | 5.4s | 481 | false | false |
| Bash | orchestrator | 2026-11-05T20:08:44.979Z | 1.5s | 79 | false | false |
| Bash | orchestrator | 2026-11-05T20:08:19.345Z | 0.4s | 79 | false | false |
| Read | orchestrator | 2026-11-05T20:08:33.710Z | 0.2s | 30457 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-05T20:09:09.917Z | 0.2s | 42029 | false | false |
| Read | orchestrator | 2026-11-05T20:08:28.753Z | 0.2s | 40575 | false | false |
| Read | orchestrator | 2026-11-05T20:08:26.956Z | 0.2s | 61931 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-05T20:09:11.066Z | 0.2s | 31120 | false | false |
| Read | orchestrator | 2026-11-05T20:08:35.525Z | 0.2s | 34767 | false | false |
| Bash | orchestrator | 2026-11-05T20:08:24.056Z | 0.1s | 1540 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 6m 00s | 31 | 32926 | 64 | 3864319 | 3669609 | 194646 | 0.8075 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $3.78 |
| Cost — claude-opus-5-5 | $3.78 |
| Input tokens (uncached) | 102 |
| Total input tokens (incl. cache) | 5720502 |
| Output tokens | 41461 |
| Thinking tokens (main thread) | 930 |
| Cache read tokens | 5413853 |
| Cache write tokens | 306547 |
| Cache write tokens, main thread (5m / 1h) | 0 / 111901 |
| Cache hit ratio | 0.9464 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 38 | 1856183 | 943 | 1744244 | 111901 |
| sub-agents | 64 | 3864319 | 32926 | 3669609 | 194646 |
| remainder | 0 | 0 | 7592 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 1 |
| Sub-agents spawned / failed / killed | 1 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 26 |
| Time to first token | 2.3s |
| Rate-limit peak | seven_day 0.38 |
