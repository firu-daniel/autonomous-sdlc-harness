# Run analytics — fix_linux_detached_gate_run

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 47m 17s |
| Wall | 47m 17s |
| Active | 47m 17s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $25.05 |
| Input tokens (uncached) | 700 |
| Total input tokens (incl. cache) | 53925824 |
| Output tokens | 300952 |
| Thinking tokens (main thread) | 1863 |
| Cache read tokens | 52289751 |
| Cache write tokens | 1635373 |
| Cache write tokens, main thread (5m / 1h) | 0 / 130240 |
| Cache hit ratio | 0.9697 |
| Requests | 338 |
| Request latency p50 / p90 / p99 / max | 2.7s / 16.5s / 59.4s / 1m 37s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 8 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 24m 37s (session 1) |
| Rate-limit peak | seven_day 0.61 |

## Session 1 — 2026-11-02T14:21:00.269Z → 2026-11-02T15:08:17.857Z

Session id: `648962d5-d1db-4574-b23a-077af8004196`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 47m 17s | 47m 19s | 46m 37s | 0.0s | 0.0s | 47m 17s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 338 | 2.7s | 16.5s | 59.4s | 1m 37s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 70 | 2.4s | 15.8s | 28.5s | 28.5s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 49 | 3.8s | 11.1s | 28.9s | 28.9s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 160 | 4.1s | 22.7s | 1m 13s | 1m 37s | 0 |
| orchestrator | 59 | 1.3s | 1.9s | 8.6s | 8.6s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 11 | 44m 33s | 24m 37s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 40 | 5.5s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 41 | 6.0s | 0.3s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 120 | 17.4s | 0.4s |
| Bash | orchestrator | 47 | 11.9s | 4.4s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 55 | 2.4s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 112 | 5.2s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 34 | 1.4s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 42 | 2.7s | 0.3s |
| Read | orchestrator | 7 | 1.0s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 4 | 0.2s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 15 | 0.6s | 0.0s |
| Write | orchestrator | 2 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-02T14:21:33.858Z | 4.4s | 468 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-02T14:32:50.061Z | 0.4s | 6827 | false | false |
| Bash | orchestrator | 2026-11-02T14:21:31.861Z | 0.4s | 70 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-02T14:59:56.736Z | 0.3s | 33756 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-02T14:46:40.306Z | 0.3s | 29851 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-02T14:58:01.537Z | 0.3s | 1428 | false | false |
| Bash | orchestrator | 2026-11-02T15:07:37.864Z | 0.2s | 505 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-02T14:49:11.538Z | 0.2s | 29851 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-02T14:52:05.017Z | 0.2s | 32486 | false | false |
| Read | orchestrator | 2026-11-02T14:21:10.921Z | 0.2s | 61931 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.6s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_linux_detached_gate_run --outcome FAIL --findings harness-runs/architecture_reviews/fix_l | 4 | 0.8s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_linux_detached_gate_run --outcome returned | 5 | 1.1s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 10 | 1.4s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 24m 37s | 109 | 155000 | 220 | 28946324 | 28513777 | 432327 | 0.5207 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 2m 20s | 16 | 15584 | 34 | 1892557 | 1745078 | 147445 | 0.0497 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 1m 11s | 10 | 8264 | 22 | 481284 | 437213 | 44049 | 0.0251 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 31s | 13 | 10211 | 28 | 1270563 | 1149841 | 120694 | 0.0324 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 1m 26s | 12 | 10770 | 26 | 651360 | 602022 | 49312 | 0.0305 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 58.6s | 8 | 6488 | 18 | 583018 | 476943 | 106057 | 0.0207 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan review | 5m 04s | 49 | 29685 | 100 | 8134636 | 7923687 | 210849 | 0.1074 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 3m 18s | 22 | 22377 | 48 | 1569252 | 1465544 | 103660 | 0.07 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 24s | 16 | 9232 | 34 | 1427185 | 1289863 | 137288 | 0.0297 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 56.3s | 7 | 6371 | 16 | 255545 | 230007 | 25522 | 0.0198 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 42s | 17 | 10907 | 36 | 1611782 | 1483816 | 127930 | 0.0361 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $25.05 |
| Cost — claude-opus-5-5 | $25.05 |
| Input tokens (uncached) | 700 |
| Total input tokens (incl. cache) | 53925824 |
| Output tokens | 300952 |
| Thinking tokens (main thread) | 1863 |
| Cache read tokens | 52289751 |
| Cache write tokens | 1635373 |
| Cache write tokens, main thread (5m / 1h) | 0 / 130240 |
| Cache hit ratio | 0.9697 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 118 | 7102318 | 1288 | 6971960 | 130240 |
| sub-agents | 582 | 46823506 | 284889 | 45317791 | 1505133 |
| remainder | 0 | 0 | 14775 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 8 |
| Sub-agents spawned / failed / killed | 11 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 70 |
| Time to first token | 1.9s |
| Rate-limit peak | seven_day 0.61 |
