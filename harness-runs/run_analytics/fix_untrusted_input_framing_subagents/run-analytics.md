# Run analytics — fix_untrusted_input_framing_subagents

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 35m 16s |
| Wall | 35m 16s |
| Active | 35m 16s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $19.18 |
| Input tokens (uncached) | 608 |
| Total input tokens (incl. cache) | 35023805 |
| Output tokens | 227507 |
| Thinking tokens (main thread) | 2057 |
| Cache read tokens | 33525598 |
| Cache write tokens | 1497599 |
| Cache write tokens, main thread (5m / 1h) | 0 / 143460 |
| Cache hit ratio | 0.9572 |
| Requests | 292 |
| Request latency p50 / p90 / p99 / max | 2.4s / 14.3s / 58.6s / 1m 41s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 9 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 13m 15s (session 1) |
| Rate-limit peak | seven_day 0.75 |

## Session 1 — 2026-11-09T09:59:26.987Z → 2026-11-09T10:34:43.243Z

Session id: `7d2f72a3-fbab-482e-bcc2-251a7f823b4c`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 35m 16s | 35m 18s | 34m 40s | 0.0s | 0.0s | 35m 16s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 292 | 2.4s | 14.3s | 58.6s | 1m 41s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 67 | 2.2s | 14.3s | 36.3s | 36.3s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 74 | 3.4s | 15.9s | 23.9s | 23.9s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 87 | 3.1s | 25.7s | 1m 41s | 1m 41s | 0 |
| orchestrator | 64 | 1.4s | 2.3s | 11.8s | 11.8s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 12 | 32m 26s | 13m 15s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 40 | 5.3s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 58 | 9.6s | 0.4s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 58 | 8.4s | 0.4s |
| Bash | orchestrator | 49 | 12.8s | 5.0s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 23 | 0.9s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 93 | 4.1s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 37 | 1.6s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 34 | 1.1s | 0.2s |
| Read | orchestrator | 6 | 1.0s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 2 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 10 | 0.4s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-09T10:00:02.080Z | 5.0s | 484 | false | false |
| Bash | orchestrator | 2026-11-09T10:00:00.038Z | 0.5s | 80 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-09T10:32:15.468Z | 0.4s | 1295 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-09T10:32:18.199Z | 0.4s | 1412 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-09T10:24:51.393Z | 0.4s | 286 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-09T10:04:19.307Z | 0.4s | 1754 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-09T10:13:47.716Z | 0.3s | 42029 | false | false |
| Bash | orchestrator | 2026-11-09T10:34:06.634Z | 0.3s | 520 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-09T10:28:37.905Z | 0.3s | 1148 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-09T10:19:46.648Z | 0.3s | 64903 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | cat harness.config.json && ls harness-runs/task_plans/fix_untrusted_input_framing_subagents/ harness-runs/architecture_reviews/fix_untrusted_input_framing_subag | 4 | 0.5s |
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.4s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_untrusted_input_framing_subagents --outcome FAIL --findings harness-runs/architecture_rev | 3 | 0.5s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_untrusted_input_framing_subagents --outcome returned | 5 | 1.0s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 12 | 1.6s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 13m 15s | 61 | 86757 | 124 | 9930939 | 9673494 | 257321 | 0.3761 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 32s | 10 | 10619 | 22 | 872089 | 754518 | 117549 | 0.0436 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch) | 1m 01s | 7 | 7186 | 16 | 338018 | 295704 | 42298 | 0.0291 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 58s | 19 | 12778 | 40 | 1796470 | 1680315 | 116115 | 0.056 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch 2) | 39.7s | 6 | 4799 | 14 | 260793 | 226248 | 34531 | 0.0188 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 05s | 10 | 7197 | 22 | 791811 | 674183 | 117606 | 0.0311 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan review | 5m 01s | 43 | 30665 | 88 | 6249804 | 6041285 | 208431 | 0.1425 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (structural) | 47.7s | 8 | 5688 | 18 | 381842 | 328282 | 53542 | 0.0226 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 37s | 16 | 10415 | 34 | 1356253 | 1241696 | 114523 | 0.0459 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch 3) | 37.7s | 5 | 4299 | 12 | 200480 | 172245 | 28223 | 0.0179 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 06s | 12 | 7371 | 26 | 1063815 | 953277 | 110512 | 0.0315 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan re-review | 3m 41s | 31 | 23483 | 64 | 3531009 | 3377457 | 153488 | 0.1047 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $19.18 |
| Cost — claude-opus-5-5 | $19.18 |
| Input tokens (uncached) | 608 |
| Total input tokens (incl. cache) | 35023805 |
| Output tokens | 227507 |
| Thinking tokens (main thread) | 2057 |
| Cache read tokens | 33525598 |
| Cache write tokens | 1497599 |
| Cache write tokens, main thread (5m / 1h) | 0 / 143460 |
| Cache hit ratio | 0.9572 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 128 | 8250482 | 1259 | 8106894 | 143460 |
| sub-agents | 480 | 26773323 | 211257 | 25418704 | 1354139 |
| remainder | 0 | 0 | 14991 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 9 |
| Sub-agents spawned / failed / killed | 12 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 72 |
| Time to first token | 1.7s |
| Rate-limit peak | seven_day 0.75 |
