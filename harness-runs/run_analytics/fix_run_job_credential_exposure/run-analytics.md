# Run analytics — fix_run_job_credential_exposure

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 1h06m |
| Wall | 1h06m |
| Active | 1h06m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $29.61 |
| Input tokens (uncached) | 852 |
| Total input tokens (incl. cache) | 60467762 |
| Output tokens | 366702 |
| Thinking tokens (main thread) | 1859 |
| Cache read tokens | 58440686 |
| Cache write tokens | 2026224 |
| Cache write tokens, main thread (5m / 1h) | 0 / 151913 |
| Cache hit ratio | 0.9665 |
| Requests | 413 |
| Request latency p50 / p90 / p99 / max | 4.1s / 16.7s / 54.3s / 1m 28s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 13 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 24m 10s (session 1) |
| Rate-limit peak | seven_day 0.67 |

## Session 1 — 2026-11-08T12:26:47.457Z → 2026-11-08T13:33:31.089Z

Session id: `ec176904-815b-4a02-9739-3b19a38641d0`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h06m | 1h06m | 1h05m | 0.0s | 0.0s | 1h06m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 413 | 4.1s | 16.7s | 54.3s | 1m 28s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 107 | 4.0s | 15.6s | 31.3s | 33.7s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 89 | 4.4s | 13.7s | 40.8s | 40.8s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 155 | 5.3s | 29.7s | 1m 19s | 1m 28s | 0 |
| orchestrator | 62 | 2.6s | 5.4s | 10.9s | 10.9s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 12 | 1h02m | 24m 10s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 62 | 13.8s | 0.6s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 75 | 16.5s | 0.4s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 89 | 21.2s | 0.7s |
| Bash | orchestrator | 45 | 14.6s | 4.5s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 76 | 5.2s | 0.1s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 123 | 6.3s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 56 | 2.6s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-writer | 59 | 3.3s | 0.3s |
| Read | orchestrator | 6 | 1.0s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 3 | 0.3s | 0.1s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 2 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 16 | 1.8s | 0.1s |
| Write | orchestrator | 2 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-08T12:27:22.506Z | 4.5s | 466 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-08T12:36:07.214Z | 0.7s | 414 | false | false |
| Bash | orchestrator | 2026-11-08T12:27:19.796Z | 0.6s | 74 | false | false |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 2026-11-08T13:13:23.297Z | 0.6s | 31 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-08T12:31:01.536Z | 0.6s | 724 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-08T12:30:23.423Z | 0.5s | 111 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-08T13:20:15.847Z | 0.4s | 2572 | false | false |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 2026-11-08T13:11:29.192Z | 0.4s | 4115 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-08T12:39:23.633Z | 0.4s | 2359 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-08T12:34:01.809Z | 0.4s | 3474 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.8s |
| autonomous-sdlc-harness:architecture-reviewer | grep -n "^## " <main_repo>/plugin/instructions/unit_loop_core.md | 3 | 0.4s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.7s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_run_job_credential_exposure --outcome FAIL --findings harness-runs/architecture_reviews/f | 3 | 0.8s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_run_job_credential_exposure --outcome returned | 5 | 1.5s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 12 | 2.4s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 24m 10s | 82 | 142536 | 168 | 20606097 | 20213823 | 392106 | 0.3623 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 3m 46s | 26 | 17641 | 54 | 3133035 | 2971291 | 161690 | 0.0565 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch) | 2m 38s | 13 | 14800 | 28 | 746086 | 686332 | 59726 | 0.0395 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review iter 1 | 2m 23s | 16 | 10207 | 34 | 1492861 | 1365493 | 127334 | 0.036 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review iter 0 | 6m 34s | 55 | 34899 | 112 | 8886851 | 8678967 | 207772 | 0.0984 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (review) | 2m 32s | 21 | 16506 | 44 | 1373854 | 1287191 | 86619 | 0.038 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review iter 2 | 3m 22s | 25 | 17820 | 52 | 3275987 | 3106081 | 169854 | 0.0506 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch 1) | 2m 01s | 16 | 12245 | 34 | 1004743 | 943060 | 61649 | 0.0303 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review iter 3 | 1m 40s | 12 | 9527 | 26 | 1199846 | 1067558 | 132262 | 0.0251 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review iter 1 | 5m 02s | 34 | 26478 | 70 | 4862320 | 4670626 | 191624 | 0.0756 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (review 1) | 4m 40s | 23 | 29827 | 48 | 1924749 | 1817940 | 106761 | 0.0701 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review iter 4 | 3m 18s | 28 | 18166 | 58 | 3595865 | 3418893 | 176914 | 0.0496 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $29.61 |
| Cost — claude-opus-5-5 | $29.61 |
| Input tokens (uncached) | 852 |
| Total input tokens (incl. cache) | 60467762 |
| Output tokens | 366702 |
| Thinking tokens (main thread) | 1859 |
| Cache read tokens | 58440686 |
| Cache write tokens | 2026224 |
| Cache write tokens, main thread (5m / 1h) | 0 / 151913 |
| Cache hit ratio | 0.9665 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 124 | 8365468 | 1253 | 8213431 | 151913 |
| sub-agents | 728 | 52102294 | 350652 | 50227255 | 1874311 |
| remainder | 0 | 0 | 14797 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 13 |
| Sub-agents spawned / failed / killed | 12 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 68 |
| Time to first token | 2.1s |
| Rate-limit peak | seven_day 0.67 |
