# Run analytics — chore_remove_legacy_worktree_arm

## Whole run

| Measure | Value |
|---|---|
| Sessions | 2 (0 incomplete) |
| Span | 52m 51s |
| Wall | 41m 05s |
| Active | 41m 05s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $25.44 |
| Input tokens (uncached) | 906 |
| Total input tokens (incl. cache) | 52054860 |
| Output tokens | 254559 |
| Thinking tokens (main thread) | 2026 |
| Cache read tokens | 50127315 |
| Cache write tokens | 1926639 |
| Cache write tokens, main thread (5m / 1h) | 0 / 227767 |
| Cache hit ratio | 0.963 |
| Requests | 435 |
| Request latency p50 / p90 / p99 / max | 2.7s / 9.0s / 23.4s / 53.0s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 16 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan (resume) — 11m 52s (session 2) |
| Rate-limit peak | seven_day 0.55 |

## Session 1 — 2026-11-07T07:23:23.931Z → 2026-11-07T07:28:52.248Z

Session id: `6fd53afe-3718-41ab-a842-c822f8a45b7c`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 5m 28s | 5m 29s | 5m 09s | 0.0s | 0.0s | 5m 28s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 73 | 2.3s | 7.1s | 13.0s | 13.0s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 52 | 2.8s | 7.6s | 13.0s | 13.0s | 0 |
| orchestrator | 21 | 1.4s | 2.3s | 7.3s | 7.3s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 1 | 4m 13s | 4m 13s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 40 | 11.3s | 1.5s |
| Bash | orchestrator | 14 | 7.5s | 4.5s |
| Edit | orchestrator | 2 | 0.1s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-writer | 22 | 1.5s | 0.3s |
| Read | orchestrator | 5 | 1.0s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.2s | 0.1s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-07T07:23:58.432Z | 4.5s | 469 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:26:48.064Z | 1.5s | 2407 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:26:31.816Z | 1.2s | 2768 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:24:57.016Z | 0.8s | 4536 | false | false |
| Bash | orchestrator | 2026-11-07T07:23:56.101Z | 0.7s | 75 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:24:35.472Z | 0.4s | 948 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:25:46.461Z | 0.4s | 2130 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:26:06.537Z | 0.4s | 1864 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:27:12.893Z | 0.4s | 252 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:27:09.411Z | 0.3s | 1187 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 4m 13s | 52 | 24009 | 106 | 7526090 | 7311637 | 214347 | 0.7726 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $4.42 |
| Cost — claude-opus-5-5 | $4.42 |
| Input tokens (uncached) | 148 |
| Total input tokens (incl. cache) | 9564256 |
| Output tokens | 31500 |
| Thinking tokens (main thread) | 678 |
| Cache read tokens | 9241273 |
| Cache write tokens | 322835 |
| Cache write tokens, main thread (5m / 1h) | 0 / 108488 |
| Cache hit ratio | 0.9662 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 42 | 2038166 | 281 | 1929636 | 108488 |
| sub-agents | 106 | 7526090 | 24009 | 7311637 | 214347 |
| remainder | 0 | 0 | 7210 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents spawned / failed / killed | 1 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 27 |
| Time to first token | 1.5s |
| Rate-limit peak | seven_day 0.54 |

## Session 2 — 2026-11-07T07:40:37.898Z → 2026-11-07T08:16:15.364Z

Session id: `0c75d14f-2e73-4730-8393-153ef4c19cd9`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 35m 37s | 35m 38s | 34m 35s | 0.0s | 0.0s | 35m 37s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 362 | 2.7s | 9.6s | 25.8s | 53.0s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 64 | 1.9s | 6.8s | 23.4s | 23.4s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 114 | 3.0s | 7.8s | 16.0s | 21.9s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 143 | 3.6s | 14.2s | 42.8s | 53.0s | 0 |
| orchestrator | 41 | 1.6s | 2.3s | 11.2s | 11.2s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 13 | 33m 22s | 11m 52s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 40 | 6.2s | 0.3s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 83 | 22.1s | 6.0s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 107 | 26.3s | 3.9s |
| Bash | orchestrator | 23 | 5.2s | 0.3s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 42 | 1.8s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 91 | 3.6s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 93 | 3.4s | 0.4s |
| Read | autonomous-sdlc-harness:task-plan-writer | 40 | 1.3s | 0.2s |
| Read | orchestrator | 7 | 0.8s | 0.3s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 2 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 13 | 0.6s | 0.0s |
| Write | orchestrator | 1 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-07T08:09:40.952Z | 6.0s | 5247 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:45:05.915Z | 3.9s | 3099 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:48:02.135Z | 3.1s | 3832 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-07T07:57:13.945Z | 0.7s | 139 | true | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-07T07:58:11.224Z | 0.7s | 128 | true | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-07T07:44:49.235Z | 0.7s | 347 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-07T07:57:19.861Z | 0.7s | 112 | true | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-07T07:57:17.052Z | 0.6s | 167 | true | false |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-07T08:14:21.701Z | 0.4s | 30171 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-07T08:09:38.062Z | 0.4s | 2285 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.7s |
| autonomous-sdlc-harness:task-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.4s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.7s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_remove_legacy_worktree_arm --outcome FAIL --findings harness-runs/task_plan_reviews/cho | 3 | 0.8s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_remove_legacy_worktree_arm --outcome PASS && ls harness-runs/STOP harness-runs/PAUSE 2> | 3 | 0.7s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_remove_legacy_worktree_arm --outcome returned && ls harness-runs/STOP harness-runs/PAUS | 4 | 0.9s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan (resume) | 11m 52s | 83 | 71687 | 170 | 14894557 | 14611554 | 282833 | 0.3335 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review | 1m 19s | 17 | 8065 | 36 | 1409002 | 1297984 | 110982 | 0.0374 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review | 4m 12s | 57 | 24912 | 116 | 8029088 | 7831843 | 197129 | 0.1183 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 3m 17s | 24 | 20590 | 50 | 1576140 | 1479367 | 96723 | 0.0924 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 1 | 1m 28s | 17 | 9399 | 38 | 1424337 | 1312987 | 111312 | 0.0415 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan iter 2 | 2m 28s | 18 | 18387 | 38 | 982052 | 917834 | 64180 | 0.0694 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 2 | 52.2s | 9 | 5781 | 20 | 643677 | 554183 | 89474 | 0.0244 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan iter 3 | 35.2s | 9 | 3737 | 20 | 288392 | 265871 | 22501 | 0.0165 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 3 | 37.9s | 11 | 3954 | 26 | 786715 | 694722 | 91967 | 0.0177 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review iter 3 | 3m 03s | 40 | 18391 | 84 | 5188872 | 5006101 | 182687 | 0.0856 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan iter 4 | 56.6s | 9 | 6506 | 20 | 345513 | 315987 | 29506 | 0.0265 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 4 | 47.0s | 10 | 5334 | 22 | 554434 | 483588 | 70824 | 0.022 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review iter 4 | 1m 49s | 17 | 11950 | 36 | 1895085 | 1760642 | 134407 | 0.0513 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $21.02 |
| Cost — claude-opus-5-5 | $21.02 |
| Input tokens (uncached) | 758 |
| Total input tokens (incl. cache) | 42490604 |
| Output tokens | 223059 |
| Thinking tokens (main thread) | 1348 |
| Cache read tokens | 40886042 |
| Cache write tokens | 1603804 |
| Cache write tokens, main thread (5m / 1h) | 0 / 119279 |
| Cache hit ratio | 0.9622 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 82 | 4472740 | 1026 | 4353379 | 119279 |
| sub-agents | 676 | 38017864 | 208693 | 36532663 | 1484525 |
| remainder | 0 | 0 | 13340 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 14 |
| Sub-agents spawned / failed / killed | 13 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 47 |
| Time to first token | 1.3s |
| Rate-limit peak | seven_day 0.55 |
