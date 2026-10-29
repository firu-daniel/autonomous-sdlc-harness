# Run analytics — fix_linux_sandbox_deny_placeholders

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 51m 33s |
| Wall | 51m 33s |
| Active | 49m 19s |
| Host-suspended | 0.0s |
| Idle | 2m 13s |
| Cost | $25.14 |
| Input tokens (uncached) | 772 |
| Total input tokens (incl. cache) | 46316664 |
| Output tokens | 325116 |
| Thinking tokens (main thread) | 1480 |
| Cache read tokens | 44457959 |
| Cache write tokens | 1857933 |
| Cache write tokens, main thread (5m / 1h) | 0 / 149706 |
| Cache hit ratio | 0.9599 |
| Requests | 372 |
| Request latency p50 / p90 / p99 / max | 2.5s / 18.4s / 1m 08s / 2m 13s |
| Requests over the idle threshold | 1 |
| API retries | 0 |
| Permission denials | 7 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 17m 53s (session 1) |
| Rate-limit peak | five_hour 0.15, seven_day 0.25 |

## Session 1 — 2026-10-29T13:01:16.802Z → 2026-10-29T13:52:49.983Z

Session id: `372092c2-488c-4f31-bc99-82246e05cdfb`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 51m 33s | 51m 35s | 50m 52s | 0.0s | 2m 13s | 49m 19s | none |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-10-29T13:04:26.885Z | 2m 13s | autonomous-sdlc-harness:task-plan-writer | in_flight_request |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 372 | 2.5s | 18.4s | 1m 08s | 2m 13s | 1 |
| autonomous-sdlc-harness:architecture-reviewer | 73 | 2.5s | 13.1s | 24.4s | 24.4s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 121 | 3.4s | 15.8s | 29.0s | 41.8s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 124 | 3.3s | 30.3s | 1m 42s | 2m 13s | 1 |
| orchestrator | 54 | 1.4s | 1.9s | 8.4s | 8.4s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 13 | 48m 47s | 17m 53s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 56 | 8.0s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 78 | 12.2s | 0.3s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 75 | 10.8s | 0.3s |
| Bash | orchestrator | 49 | 12.6s | 4.6s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 48 | 0.8s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 78 | 4.3s | 0.4s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 86 | 2.7s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-writer | 59 | 1.5s | 0.2s |
| Read | orchestrator | 6 | 1.0s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 3 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 14 | 0.3s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-10-29T13:01:45.490Z | 4.6s | 477 | false | false |
| Bash | orchestrator | 2026-10-29T13:01:43.471Z | 0.4s | 78 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-10-29T13:20:12.972Z | 0.4s | 41881 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-10-29T13:27:15.683Z | 0.3s | 41881 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-10-29T13:48:16.490Z | 0.3s | 684 | false | false |
| Bash | orchestrator | 2026-10-29T13:52:10.480Z | 0.3s | 514 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-10-29T13:08:08.984Z | 0.3s | 4013 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-10-29T13:20:14.965Z | 0.3s | 31120 | false | false |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 2026-10-29T13:29:02.601Z | 0.3s | 41881 | false | false |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 2026-10-29T13:47:05.086Z | 0.3s | 31120 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | cat <repo_root>/harness.config.json; ls <repo_root>/harness-runs/task_plans/fix_linux_sandbox_deny_placeholders/ | 3 | 0.3s |
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.6s |
| autonomous-sdlc-harness:task-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.4s |
| autonomous-sdlc-harness:task-plan-writer | git grep -lE 'Linux sandbox treats\|Linux sandbox may skip\|Linux may skip\|blocked: F9\|§5 F9\|\\| F9 \\|' -- docs plugin README.md ARCHITECTURE.md examples/notes-app | 3 | 0.5s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_linux_sandbox_deny_placeholders --outcome FAIL --findings harness-runs/task_plan_reviews/ | 3 | 0.7s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_linux_sandbox_deny_placeholders --outcome PASS | 3 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_linux_sandbox_deny_placeholders --outcome returned | 5 | 1.1s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 13 | 1.8s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 17m 53s | 57 | 109887 | 116 | 11439023 | 11131272 | 307635 | 0.3471 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 32s | 17 | 9452 | 36 | 1496146 | 1379507 | 116603 | 0.0299 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review | 3m 50s | 40 | 23952 | 84 | 4803132 | 4638042 | 165006 | 0.0746 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 1m 22s | 15 | 9313 | 32 | 664372 | 609115 | 55225 | 0.0265 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 26s | 11 | 9323 | 24 | 1049925 | 930775 | 119126 | 0.0278 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review | 3m 45s | 35 | 23360 | 72 | 4343223 | 4186470 | 156681 | 0.0728 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 6m 21s | 32 | 41508 | 66 | 2842071 | 2712517 | 129488 | 0.1233 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 59s | 19 | 12597 | 40 | 1918929 | 1792733 | 126156 | 0.0388 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 58.7s | 9 | 6904 | 20 | 390042 | 354423 | 35599 | 0.019 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 28s | 14 | 9734 | 30 | 1280928 | 1161908 | 118990 | 0.0287 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 1m 30s | 11 | 11219 | 24 | 521252 | 479252 | 41976 | 0.0291 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 03s | 12 | 6573 | 26 | 1080088 | 967912 | 112150 | 0.0204 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review | 5m 35s | 46 | 34140 | 94 | 7185005 | 6961319 | 223592 | 0.1086 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $25.14 |
| Cost — claude-opus-5-5 | $25.14 |
| Input tokens (uncached) | 772 |
| Total input tokens (incl. cache) | 46316664 |
| Output tokens | 325116 |
| Thinking tokens (main thread) | 1480 |
| Cache read tokens | 44457959 |
| Cache write tokens | 1857933 |
| Cache write tokens, main thread (5m / 1h) | 0 / 149706 |
| Cache hit ratio | 0.9599 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 108 | 7302528 | 1192 | 7152714 | 149706 |
| sub-agents | 664 | 39014136 | 307962 | 37305245 | 1708227 |
| remainder | 0 | 0 | 15962 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 7 |
| Sub-agents spawned / failed / killed | 13 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 73 |
| Time to first token | 1.8s |
| Rate-limit peak | five_hour 0.15, seven_day 0.25 |
