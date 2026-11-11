# Run analytics — chore_devscene_github_surface

## Whole run

| Measure | Value |
|---|---|
| Sessions | 2 (0 incomplete) |
| Span | 9m 01s |
| Wall | 6m 06s |
| Active | 6m 06s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $4.47 |
| Input tokens (uncached) | 156 |
| Total input tokens (incl. cache) | 7536299 |
| Output tokens | 34243 |
| Thinking tokens (main thread) | 1118 |
| Cache read tokens | 7167716 |
| Cache write tokens | 368427 |
| Cache write tokens, main thread (5m / 1h) | 0 / 170106 |
| Cache hit ratio | 0.9511 |
| Requests | 75 |
| Request latency p50 / p90 / p99 / max | 2.0s / 8.6s / 27.1s / 27.1s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | devscene:task-plan-writer — Write task plan — 3m 53s (session 2) |
| Rate-limit peak | seven_day 0.12 |

## Network refusals

2 of 2 sessions scanned.

No refused network call.

## Possible network attempts in gate logs (best effort)

Lines in finished Run gates logs that carry a proxy refusal string or a plain connect error (`ECONNREFUSED`, `ENETUNREACH`, `EHOSTUNREACH`, `EAI_AGAIN`). They are listed as possible attempts, not refusals. What this list cannot show:

- a test that catches the error and passes leaves no trace;
- a plain connect error cannot be told apart from a host that is unreachable for another reason;
- on macOS, Seatbelt's own violation records go to the system log, not to the test output;
- a test whose name or output quotes one of these strings is listed too.

No Run gates round log was scanned.

## Session 1 — 2026-11-11T12:53:51.765Z → 2026-11-11T12:54:13.086Z

Session id: `3289775f-8e9d-4c66-a937-9c481c49fcf9`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 21.3s | 23.1s | 21.9s | 0.0s | 0.0s | 21.3s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 8 | 1.7s | 5.5s | 5.5s | 5.5s | 0 |
| orchestrator | 8 | 1.7s | 5.5s | 5.5s | 5.5s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Bash | orchestrator | 4 | 1.1s | 0.5s |
| Read | orchestrator | 3 | 0.0s | 0.0s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-11T12:53:54.712Z | 0.5s | 3160 | false | false |
| Bash | orchestrator | 2026-11-11T12:53:58.159Z | 0.2s | 7230 | false | false |
| Bash | orchestrator | 2026-11-11T12:54:02.237Z | 0.1s | 348 | true | false |
| Bash | orchestrator | 2026-11-11T12:54:05.792Z | 0.1s | 79 | false | false |
| Read | orchestrator | 2026-11-11T12:53:56.965Z | 0.0s | 7103 | false | false |
| Read | orchestrator | 2026-11-11T12:54:00.478Z | 0.0s | 14990 | false | false |
| Skill | orchestrator | 2026-11-11T12:53:51.774Z | 0.0s | 54 | false | false |
| Read | orchestrator | 2026-11-11T12:54:07.493Z | 0.0s | 2750 | false | false |

#### Polling loops

None.

### Sub-agents

None.

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $0.49 |
| Cost — claude-opus-5-5 | $0.49 |
| Input tokens (uncached) | 16 |
| Total input tokens (incl. cache) | 401820 |
| Output tokens | 2004 |
| Thinking tokens (main thread) | 326 |
| Cache read tokens | 354936 |
| Cache write tokens | 46868 |
| Cache write tokens, main thread (5m / 1h) | 0 / 46868 |
| Cache hit ratio | 0.8833 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 16 | 401820 | 598 | 354936 | 46868 |
| sub-agents | 0 | 0 | 0 | 0 | 0 |
| remainder | 0 | 0 | 1406 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 0 |
| Sub-agents spawned / failed / killed | 0 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 10 |
| Time to first token | 1.8s |
| Rate-limit peak | seven_day 0.12 |

## Session 2 — 2026-11-11T12:57:08.240Z → 2026-11-11T13:02:53.037Z

Session id: `1465b751-b557-46a9-9c84-4169d0343edd`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 5m 44s | 5m 46s | 5m 27s | 0.0s | 0.0s | 5m 44s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 67 | 2.0s | 9.3s | 27.1s | 27.1s | 0 |
| devscene:prompt-injection-reviewer | 2 | 2.0s | 2.7s | 2.7s | 2.7s | 0 |
| devscene:task-plan-writer | 35 | 3.2s | 11.9s | 27.1s | 27.1s | 0 |
| orchestrator | 30 | 1.8s | 2.6s | 8.5s | 8.5s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 3 | 4m 04s | 3m 53s |
| Bash | devscene:task-plan-writer | 32 | 7.1s | 1.4s |
| Bash | orchestrator | 21 | 19.9s | 4.6s |
| Read | devscene:prompt-injection-reviewer | 5 | 0.0s | 0.0s |
| Read | devscene:task-plan-writer | 14 | 0.6s | 0.2s |
| Read | orchestrator | 7 | 0.9s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | orchestrator | 4 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-11T12:57:51.333Z | 4.6s | 415 | false | false |
| Bash | orchestrator | 2026-11-11T12:58:26.714Z | 4.5s | 415 | false | false |
| Bash | orchestrator | 2026-11-11T12:58:27.235Z | 4.0s | 31 | false | false |
| Bash | orchestrator | 2026-11-11T12:58:27.926Z | 3.4s | 152 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-11T13:00:53.088Z | 1.4s | 1319 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-11T12:59:04.173Z | 0.4s | 3664 | false | false |
| Bash | orchestrator | 2026-11-11T12:57:49.182Z | 0.4s | 72 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-11T12:59:01.025Z | 0.4s | 2186 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-11T13:00:38.710Z | 0.4s | 2373 | false | false |
| Bash | orchestrator | 2026-11-11T12:58:24.412Z | 0.4s | 72 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| devscene:prompt-injection-reviewer | Screen task prompt | 4.8s | 1 | 319 | 4 | 27633 | 10441 | 17188 | 0.0141 |
| devscene:prompt-injection-reviewer | Screen answer file | 6.2s | 1 | 458 | 4 | 27617 | 15882 | 11731 | 0.018 |
| devscene:task-plan-writer | Write task plan | 3m 53s | 35 | 22381 | 72 | 4314587 | 4145113 | 169402 | 0.6775 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $3.99 |
| Cost — claude-opus-5-5 | $3.99 |
| Input tokens (uncached) | 140 |
| Total input tokens (incl. cache) | 7134479 |
| Output tokens | 32239 |
| Thinking tokens (main thread) | 792 |
| Cache read tokens | 6812780 |
| Cache write tokens | 321559 |
| Cache write tokens, main thread (5m / 1h) | 0 / 123238 |
| Cache hit ratio | 0.9549 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 60 | 2764642 | 1261 | 2641344 | 123238 |
| sub-agents | 80 | 4369837 | 23158 | 4171436 | 198321 |
| remainder | 0 | 0 | 7820 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents spawned / failed / killed | 3 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 38 |
| Time to first token | 1.5s |
| Rate-limit peak | seven_day 0.12 |
