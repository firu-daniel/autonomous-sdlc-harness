# Run analytics — fix_runner_seccomp_userns

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 3m 49s |
| Wall | 3m 49s |
| Active | 3m 49s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $3.12 |
| Input tokens (uncached) | 92 |
| Total input tokens (incl. cache) | 4727606 |
| Output tokens | 21827 |
| Thinking tokens (main thread) | 343 |
| Cache read tokens | 4437024 |
| Cache write tokens | 290490 |
| Cache write tokens, main thread (5m / 1h) | 0 / 114391 |
| Cache hit ratio | 0.9385 |
| Requests | 45 |
| Request latency p50 / p90 / p99 / max | 1.7s / 6.4s / 22.6s / 22.6s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 1 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 2m 43s (session 1) |
| Rate-limit peak | seven_day 0.26 |

## Session 1 — 2026-11-05T08:51:19.268Z → 2026-11-05T08:55:08.755Z

Session id: `067fd0ba-997b-445d-9294-6999442918c8`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 3m 49s | 3m 51s | 3m 41s | 0.0s | 0.0s | 3m 49s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 45 | 1.7s | 6.4s | 22.6s | 22.6s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 26 | 2.0s | 16.2s | 22.6s | 22.6s | 0 |
| orchestrator | 19 | 1.5s | 2.1s | 5.8s | 5.8s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 1 | 2m 43s | 2m 43s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 17 | 2.6s | 0.2s |
| Bash | orchestrator | 13 | 10.8s | 4.5s |
| Read | autonomous-sdlc-harness:task-plan-writer | 20 | 0.7s | 0.2s |
| Read | orchestrator | 5 | 0.9s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-05T08:51:51.665Z | 4.5s | 448 | false | false |
| Bash | orchestrator | 2026-11-05T08:51:52.196Z | 4.0s | 31 | false | false |
| Bash | orchestrator | 2026-11-05T08:51:48.703Z | 0.4s | 68 | false | false |
| Bash | orchestrator | 2026-11-05T08:54:51.148Z | 0.3s | 92 | false | false |
| Bash | orchestrator | 2026-11-05T08:51:21.637Z | 0.3s | 2531 | false | false |
| Read | orchestrator | 2026-11-05T08:51:34.993Z | 0.2s | 59236 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-05T08:52:10.005Z | 0.2s | 42029 | false | false |
| Read | orchestrator | 2026-11-05T08:51:37.070Z | 0.2s | 30457 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-05T08:52:11.051Z | 0.2s | 31120 | false | false |
| Read | orchestrator | 2026-11-05T08:51:30.188Z | 0.2s | 40575 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 2m 43s | 26 | 16048 | 54 | 2852198 | 2676045 | 176099 | 0.7114 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $3.12 |
| Cost — claude-opus-5-5 | $3.12 |
| Input tokens (uncached) | 92 |
| Total input tokens (incl. cache) | 4727606 |
| Output tokens | 21827 |
| Thinking tokens (main thread) | 343 |
| Cache read tokens | 4437024 |
| Cache write tokens | 290490 |
| Cache write tokens, main thread (5m / 1h) | 0 / 114391 |
| Cache hit ratio | 0.9385 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 38 | 1875408 | 334 | 1760979 | 114391 |
| sub-agents | 54 | 2852198 | 16048 | 2676045 | 176099 |
| remainder | 0 | 0 | 5445 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 1 |
| Sub-agents spawned / failed / killed | 1 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 24 |
| Time to first token | 2.2s |
| Rate-limit peak | seven_day 0.26 |
