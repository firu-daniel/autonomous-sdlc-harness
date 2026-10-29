# Run analytics — fix_clone_main_repo_resolution

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 39m 45s |
| Wall | 39m 45s |
| Active | 39m 45s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $20.98 |
| Input tokens (uncached) | 700 |
| Total input tokens (incl. cache) | 41145295 |
| Output tokens | 243125 |
| Thinking tokens (main thread) | 2195 |
| Cache read tokens | 39593711 |
| Cache write tokens | 1550884 |
| Cache write tokens, main thread (5m / 1h) | 0 / 145653 |
| Cache hit ratio | 0.9623 |
| Requests | 335 |
| Request latency p50 / p90 / p99 / max | 2.5s / 14.2s / 47.0s / 1m 15s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 10 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write the task plan — 16m 38s (session 1) |
| Rate-limit peak | five_hour 0.24, seven_day 0.26 |

## Session 1 — 2026-10-29T13:38:29.619Z → 2026-10-29T14:18:14.733Z

Session id: `2a11d4af-1f64-4320-a1fa-0982f5b4a89d`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 39m 45s | 39m 47s | 39m 05s | 0.0s | 0.0s | 39m 45s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 335 | 2.5s | 14.2s | 47.0s | 1m 15s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 65 | 2.2s | 14.8s | 30.1s | 30.1s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 105 | 3.2s | 15.3s | 24.1s | 40.2s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 106 | 3.4s | 26.0s | 1m 02s | 1m 15s | 0 |
| orchestrator | 59 | 1.8s | 2.5s | 10.2s | 10.2s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 13 | 36m 33s | 16m 38s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 37 | 4.8s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 80 | 13.1s | 0.7s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 82 | 11.6s | 0.2s |
| Bash | orchestrator | 52 | 12.9s | 4.6s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 24 | 0.4s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 96 | 4.7s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 65 | 2.2s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-writer | 29 | 0.9s | 0.2s |
| Read | orchestrator | 7 | 1.1s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 3 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 13 | 0.2s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-10-29T13:39:09.783Z | 4.6s | 462 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-10-29T14:03:52.974Z | 0.7s | 122 | true | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-10-29T14:03:56.006Z | 0.6s | 278 | false | false |
| Bash | orchestrator | 2026-10-29T13:39:07.542Z | 0.4s | 73 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-10-29T14:02:58.182Z | 0.3s | 10047 | false | false |
| Bash | orchestrator | 2026-10-29T14:17:33.178Z | 0.3s | 499 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-10-29T14:14:40.582Z | 0.3s | 31120 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-10-29T14:00:48.129Z | 0.3s | 31120 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-10-29T13:56:27.642Z | 0.3s | 31120 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-10-29T14:07:29.575Z | 0.3s | 31120 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.6s |
| autonomous-sdlc-harness:architecture-reviewer | grep -n "^## " <main_repo>/plugin/instructions/unit_loop_core.md | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_clone_main_repo_resolution --outcome FAIL --findings harness-runs/task_plan_reviews/fix_c | 3 | 0.7s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_clone_main_repo_resolution --outcome PASS | 3 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_clone_main_repo_resolution --outcome returned | 5 | 1.1s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 12 | 1.6s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write the task plan | 16m 38s | 83 | 104806 | 168 | 14419077 | 14151220 | 267689 | 0.4185 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 42s | 18 | 10330 | 38 | 1498595 | 1384081 | 114476 | 0.043 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan per arch findings | 37.1s | 4 | 4548 | 10 | 161150 | 131766 | 29374 | 0.0156 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 17s | 12 | 8086 | 26 | 1001596 | 896459 | 105111 | 0.0326 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan per arch findings | 22.4s | 4 | 2457 | 10 | 156663 | 130679 | 25974 | 0.0094 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 58.1s | 9 | 6114 | 20 | 797588 | 695437 | 102131 | 0.0244 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural review of task plan | 4m 05s | 41 | 23719 | 86 | 5358609 | 5175194 | 183329 | 0.1029 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan per review findings | 47.6s | 7 | 4905 | 16 | 291500 | 245835 | 45649 | 0.02 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 10s | 14 | 7112 | 30 | 976888 | 862477 | 114381 | 0.0296 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural re-review of task plan | 5m 15s | 44 | 31417 | 90 | 6380291 | 6198284 | 181917 | 0.1323 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan per review findings | 42.7s | 8 | 4383 | 18 | 280163 | 242849 | 37296 | 0.0179 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 04s | 12 | 6516 | 26 | 903705 | 797123 | 106556 | 0.0269 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural re-review of task plan | 1m 50s | 20 | 11464 | 44 | 1424915 | 1333523 | 91348 | 0.0464 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $20.98 |
| Cost — claude-opus-5-5 | $20.98 |
| Input tokens (uncached) | 700 |
| Total input tokens (incl. cache) | 41145295 |
| Output tokens | 243125 |
| Thinking tokens (main thread) | 2195 |
| Cache read tokens | 39593711 |
| Cache write tokens | 1550884 |
| Cache write tokens, main thread (5m / 1h) | 0 / 145653 |
| Cache hit ratio | 0.9623 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 118 | 7494555 | 1200 | 7348784 | 145653 |
| sub-agents | 582 | 33650740 | 225857 | 32244927 | 1405231 |
| remainder | 0 | 0 | 16068 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 10 |
| Sub-agents spawned / failed / killed | 13 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 77 |
| Time to first token | 1.9s |
| Rate-limit peak | five_hour 0.24, seven_day 0.26 |
