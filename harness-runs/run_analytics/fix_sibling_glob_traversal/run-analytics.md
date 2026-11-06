# Run analytics — fix_sibling_glob_traversal

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 3m 18s |
| Wall | 3m 18s |
| Active | 3m 18s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $3.26 |
| Input tokens (uncached) | 88 |
| Total input tokens (incl. cache) | 5003170 |
| Output tokens | 18383 |
| Thinking tokens (main thread) | 765 |
| Cache read tokens | 4694812 |
| Cache write tokens | 308270 |
| Cache write tokens, main thread (5m / 1h) | 0 / 137180 |
| Cache hit ratio | 0.9384 |
| Requests | 43 |
| Request latency p50 / p90 / p99 / max | 1.8s / 3.7s / 7.1s / 7.1s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 2m 09s (session 1) |
| Rate-limit peak | seven_day 0.5 |

## Session 1 — 2026-11-06T22:03:28.316Z → 2026-11-06T22:06:46.437Z

Session id: `42f27908-26fc-418d-acf8-9c723962d4e8`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 3m 18s | 3m 19s | 3m 08s | 0.0s | 0.0s | 3m 18s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 43 | 1.8s | 3.7s | 7.1s | 7.1s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 25 | 2.2s | 4.0s | 5.3s | 5.3s | 0 |
| orchestrator | 18 | 1.5s | 3.7s | 7.1s | 7.1s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 1 | 2m 09s | 2m 09s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 15 | 2.4s | 0.3s |
| Bash | orchestrator | 14 | 7.0s | 4.4s |
| Read | autonomous-sdlc-harness:task-plan-writer | 17 | 1.5s | 0.2s |
| Read | orchestrator | 6 | 1.1s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.2s | 0.1s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-06T22:03:59.262Z | 4.4s | 451 | false | false |
| Bash | orchestrator | 2026-11-06T22:03:57.153Z | 0.5s | 69 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-06T22:04:57.904Z | 0.3s | 13986 | false | false |
| Read | orchestrator | 2026-11-06T22:03:41.142Z | 0.2s | 62190 | false | false |
| Bash | orchestrator | 2026-11-06T22:03:29.906Z | 0.2s | 69 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-06T22:05:13.700Z | 0.2s | 31 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-06T22:04:39.871Z | 0.2s | 40489 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-06T22:04:16.334Z | 0.2s | 42029 | false | false |
| Read | orchestrator | 2026-11-06T22:03:37.887Z | 0.2s | 61151 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-06T22:04:51.203Z | 0.2s | 31755 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 2m 09s | 25 | 11422 | 52 | 3075969 | 2904827 | 171090 | 0.6546 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $3.26 |
| Cost — claude-opus-5-5 | $3.26 |
| Input tokens (uncached) | 88 |
| Total input tokens (incl. cache) | 5003170 |
| Output tokens | 18383 |
| Thinking tokens (main thread) | 765 |
| Cache read tokens | 4694812 |
| Cache write tokens | 308270 |
| Cache write tokens, main thread (5m / 1h) | 0 / 137180 |
| Cache hit ratio | 0.9384 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 36 | 1927201 | 281 | 1789985 | 137180 |
| sub-agents | 52 | 3075969 | 11422 | 2904827 | 171090 |
| remainder | 0 | 0 | 6680 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents spawned / failed / killed | 1 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 26 |
| Time to first token | 1.5s |
| Rate-limit peak | seven_day 0.5 |
