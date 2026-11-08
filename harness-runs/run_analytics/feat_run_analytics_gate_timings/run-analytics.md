# Run analytics — feat_run_analytics_gate_timings

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 36m 30s |
| Wall | 36m 30s |
| Active | 36m 30s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $16.64 |
| Input tokens (uncached) | 570 |
| Total input tokens (incl. cache) | 29379444 |
| Output tokens | 199503 |
| Thinking tokens (main thread) | 1970 |
| Cache read tokens | 28057219 |
| Cache write tokens | 1321655 |
| Cache write tokens, main thread (5m / 1h) | 0 / 144047 |
| Cache hit ratio | 0.955 |
| Requests | 273 |
| Request latency p50 / p90 / p99 / max | 3.1s / 15.7s / 57.0s / 1m 38s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 8 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write the task plan — 10m 19s (session 1) |
| Rate-limit peak | seven_day 0.64 |

## Session 1 — 2026-11-08T07:23:43.730Z → 2026-11-08T08:00:13.744Z

Session id: `29d2a7ad-5e0e-41fa-936b-32aefacbf7f9`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 36m 30s | 36m 32s | 35m 41s | 0.0s | 0.0s | 36m 30s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 273 | 3.1s | 15.7s | 57.0s | 1m 38s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 66 | 3.1s | 13.5s | 18.8s | 18.8s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 68 | 4.1s | 19.9s | 40.4s | 40.4s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 74 | 4.5s | 24.7s | 1m 38s | 1m 38s | 0 |
| orchestrator | 65 | 2.3s | 3.5s | 11.7s | 11.7s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 12 | 32m 10s | 10m 19s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 45 | 9.1s | 0.6s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 49 | 12.7s | 0.5s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 50 | 11.9s | 0.5s |
| Bash | orchestrator | 59 | 24.0s | 4.4s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 38 | 2.6s | 0.1s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 65 | 3.6s | 0.4s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 45 | 1.8s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 29 | 0.9s | 0.2s |
| Read | orchestrator | 6 | 1.0s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 3 | 0.4s | 0.1s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 2 | 0.1s | 0.1s |
| Write | autonomous-sdlc-harness:task-plan-writer | 8 | 0.7s | 0.1s |
| Write | orchestrator | 2 | 0.2s | 0.1s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-08T07:24:32.301Z | 4.4s | 466 | false | false |
| Bash | orchestrator | 2026-11-08T07:24:32.871Z | 3.9s | 31 | false | false |
| Bash | orchestrator | 2026-11-08T07:24:33.554Z | 3.4s | 173 | true | false |
| Bash | orchestrator | 2026-11-08T07:45:28.639Z | 0.6s | 157 | false | false |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 2026-11-08T07:45:14.098Z | 0.6s | 360 | false | false |
| Bash | orchestrator | 2026-11-08T07:41:58.409Z | 0.5s | 216 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-08T07:58:40.959Z | 0.5s | 1955 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-08T07:26:09.899Z | 0.5s | 2500 | false | false |
| Bash | orchestrator | 2026-11-08T07:24:28.952Z | 0.5s | 74 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-08T07:46:00.467Z | 0.5s | 2510 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.9s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.8s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_run_analytics_gate_timings --outcome FAIL --findings harness-runs/architecture_reviews/f | 3 | 0.7s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_run_analytics_gate_timings --outcome returned | 5 | 1.7s |
| orchestrator | cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 12 | 2.0s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null | 12 | 2.0s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write the task plan | 10m 19s | 40 | 60549 | 82 | 6199359 | 5974070 | 225207 | 0.2827 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review | 2m 10s | 19 | 11633 | 40 | 1676238 | 1566157 | 110041 | 0.0595 |
| autonomous-sdlc-harness:task-plan-writer | Revise the task plan | 34.4s | 5 | 3471 | 12 | 172079 | 150603 | 21464 | 0.0157 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 1 | 1m 54s | 17 | 10246 | 36 | 1435691 | 1342639 | 93016 | 0.0522 |
| autonomous-sdlc-harness:task-plan-writer | Revise the task plan iter 2 | 1m 17s | 9 | 8404 | 20 | 381442 | 346834 | 34588 | 0.0352 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 2 | 1m 15s | 11 | 6995 | 24 | 892727 | 783123 | 109580 | 0.0343 |
| autonomous-sdlc-harness:task-plan-writer | Revise the task plan iter 3 | 35.7s | 7 | 3002 | 16 | 221569 | 203685 | 17868 | 0.0163 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 3 | 57.0s | 10 | 4897 | 22 | 634229 | 553765 | 80442 | 0.026 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural task plan review | 4m 41s | 32 | 25304 | 66 | 4004034 | 3833162 | 170806 | 0.1286 |
| autonomous-sdlc-harness:task-plan-writer | Revise the task plan iter 4 | 3m 35s | 13 | 22462 | 28 | 730571 | 654507 | 76036 | 0.0986 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 4 | 49.4s | 9 | 4461 | 20 | 522089 | 439709 | 82360 | 0.0226 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural task plan review iter 1 | 4m 00s | 36 | 21111 | 74 | 4245317 | 4089043 | 156200 | 0.1099 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $16.64 |
| Cost — claude-opus-5-5 | $16.64 |
| Input tokens (uncached) | 570 |
| Total input tokens (incl. cache) | 29379444 |
| Output tokens | 199503 |
| Thinking tokens (main thread) | 1970 |
| Cache read tokens | 28057219 |
| Cache write tokens | 1321655 |
| Cache write tokens, main thread (5m / 1h) | 0 / 144047 |
| Cache hit ratio | 0.955 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 130 | 8264099 | 1269 | 8119922 | 144047 |
| sub-agents | 440 | 21115345 | 182535 | 19937297 | 1177608 |
| remainder | 0 | 0 | 15699 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 8 |
| Sub-agents spawned / failed / killed | 12 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 82 |
| Time to first token | 2.6s |
| Rate-limit peak | seven_day 0.64 |
