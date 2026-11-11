# Run analytics — chore_devscene_github_surface

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 21.3s |
| Wall | 21.3s |
| Active | 21.3s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $0.49 |
| Input tokens (uncached) | 16 |
| Total input tokens (incl. cache) | 401820 |
| Output tokens | 2004 |
| Thinking tokens (main thread) | 326 |
| Cache read tokens | 354936 |
| Cache write tokens | 46868 |
| Cache write tokens, main thread (5m / 1h) | 0 / 46868 |
| Cache hit ratio | 0.8833 |
| Requests | 8 |
| Request latency p50 / p90 / p99 / max | 1.7s / 5.5s / 5.5s / 5.5s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 0 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | — |
| Rate-limit peak | seven_day 0.12 |

## Network refusals

1 of 1 sessions scanned.

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
