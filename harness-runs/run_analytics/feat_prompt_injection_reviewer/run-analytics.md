# Run analytics — feat_prompt_injection_reviewer

## Whole run

| Measure | Value |
|---|---|
| Sessions | 4 (0 incomplete) |
| Span | 1h42m |
| Wall | 1h18m |
| Active | 1h18m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $40.97 |
| Input tokens (uncached) | 1136 |
| Total input tokens (incl. cache) | 80191414 |
| Output tokens | 498906 |
| Thinking tokens (main thread) | 4575 |
| Cache read tokens | 77365776 |
| Cache write tokens | 2824502 |
| Cache write tokens, main thread (5m / 1h) | 0 / 462683 |
| Cache hit ratio | 0.9648 |
| Requests | 549 |
| Request latency p50 / p90 / p99 / max | 3.1s / 17.0s / 51.9s / 1m 37s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 11 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write the task plan — 20m 20s (session 1) |
| Rate-limit peak | seven_day 0.02 |

## Network refusals

4 of 4 sessions scanned.

No refused network call.

## Possible network attempts in gate logs (best effort)

Lines in finished Run gates logs that carry a proxy refusal string or a plain connect error (`ECONNREFUSED`, `ENETUNREACH`, `EHOSTUNREACH`, `EAI_AGAIN`). They are listed as possible attempts, not refusals. What this list cannot show:

- a test that catches the error and passes leaves no trace;
- a plain connect error cannot be told apart from a host that is unreachable for another reason;
- on macOS, Seatbelt's own violation records go to the system log, not to the test output;
- a test whose name or output quotes one of these strings is listed too.

No Run gates round log was scanned.

## Session 1 — 2026-11-10T12:48:16.372Z → 2026-11-10T13:36:21.918Z

Session id: `8e095419-50db-4b00-9250-1921e5f0f03c`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 48m 05s | 48m 06s | 47m 28s | 0.0s | 0.0s | 48m 05s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 295 | 3.4s | 19.8s | 1m 01s | 1m 37s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 44 | 2.4s | 20.8s | 1m 01s | 1m 01s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 62 | 4.5s | 15.2s | 40.0s | 40.0s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 146 | 4.4s | 24.7s | 1m 29s | 1m 37s | 0 |
| orchestrator | 43 | 1.2s | 1.8s | 7.8s | 7.8s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 8 | 46m 04s | 20m 20s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 27 | 3.6s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 50 | 7.3s | 0.4s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 109 | 16.6s | 0.8s |
| Bash | orchestrator | 33 | 9.6s | 4.4s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 43 | 1.6s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 77 | 2.6s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 30 | 1.0s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-writer | 42 | 1.7s | 0.2s |
| Read | orchestrator | 6 | 1.3s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 2 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 22 | 0.9s | 0.0s |
| Write | orchestrator | 2 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-10T12:48:50.535Z | 4.4s | 463 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-10T13:29:21.108Z | 0.8s | 1679 | false | false |
| Bash | orchestrator | 2026-11-10T12:48:49.694Z | 0.4s | 73 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-10T13:21:15.946Z | 0.4s | 1375 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-10T12:56:29.874Z | 0.4s | 621 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-10T13:29:33.452Z | 0.4s | 1375 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-10T13:21:50.587Z | 0.3s | 71 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-10T12:56:53.969Z | 0.3s | 1078 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-10T13:09:37.771Z | 0.3s | 41569 | false | false |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-10T13:17:38.085Z | 0.3s | 41569 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 4 | 0.5s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_prompt_injection_reviewer --outcome returned | 3 | 0.6s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 8 | 1.1s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write the task plan | 20m 20s | 89 | 129355 | 182 | 22432335 | 22020648 | 411505 | 0.423 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 0 | 3m 14s | 17 | 20742 | 36 | 2277560 | 2099310 | 178214 | 0.0673 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch findings) | 26.2s | 7 | 2843 | 16 | 311174 | 277988 | 33170 | 0.0091 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 1 | 1m 51s | 12 | 12663 | 26 | 1125454 | 998334 | 127094 | 0.0385 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch findings 1) | 25.6s | 5 | 2940 | 12 | 220468 | 186817 | 33639 | 0.0089 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review iter 2 | 1m 22s | 15 | 8806 | 32 | 1499329 | 1380469 | 118828 | 0.0286 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review iter 0 | 8m 17s | 62 | 47847 | 126 | 10199843 | 9973496 | 226221 | 0.1724 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (plan review 0) | 10m 06s | 45 | 66787 | 92 | 5457097 | 5272246 | 184759 | 0.2102 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $23.37 |
| Cost — claude-opus-5-5 | $23.37 |
| Input tokens (uncached) | 610 |
| Total input tokens (incl. cache) | 49253052 |
| Output tokens | 304029 |
| Thinking tokens (main thread) | 1146 |
| Cache read tokens | 47793289 |
| Cache write tokens | 1459153 |
| Cache write tokens, main thread (5m / 1h) | 0 / 145723 |
| Cache hit ratio | 0.9704 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 88 | 5729792 | 895 | 5583981 | 145723 |
| sub-agents | 522 | 43523260 | 291983 | 42209308 | 1313430 |
| remainder | 0 | 0 | 11151 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 4 |
| Sub-agents spawned / failed / killed | 8 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 52 |
| Time to first token | 1.2s |
| Rate-limit peak | seven_day 0.01 |

## Session 2 — 2026-11-10T13:41:38.470Z → 2026-11-10T13:52:46.540Z

Session id: `b7e10aa4-b3d9-40c5-8c80-c8d022e9c13e`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 11m 08s | 11m 09s | 11m 02s | 0.0s | 0.0s | 11m 08s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 77 | 2.2s | 11.5s | 51.9s | 51.9s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 16 | 2.4s | 26.5s | 51.8s | 51.8s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 36 | 3.8s | 21.1s | 51.9s | 51.9s | 0 |
| orchestrator | 25 | 1.5s | 2.7s | 11.5s | 11.5s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 3 | 9m 50s | 6m 30s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 8 | 1.0s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 18 | 2.4s | 0.1s |
| Bash | orchestrator | 18 | 2.9s | 0.2s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 46 | 1.7s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 29 | 1.2s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-writer | 15 | 0.6s | 0.2s |
| Read | orchestrator | 5 | 0.6s | 0.3s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 1 | 0.0s | 0.0s |
| Write | orchestrator | 1 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Read | orchestrator | 2026-11-10T13:41:46.975Z | 0.3s | 62301 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-10T13:49:07.933Z | 0.3s | 41569 | false | false |
| Bash | orchestrator | 2026-11-10T13:41:41.001Z | 0.2s | 2744 | false | false |
| Read | orchestrator | 2026-11-10T13:41:49.152Z | 0.2s | 40775 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-10T13:42:28.114Z | 0.2s | 32328 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-10T13:49:47.066Z | 0.2s | 30298 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-10T13:51:46.218Z | 0.2s | 35203 | false | false |
| Bash | orchestrator | 2026-11-10T13:48:52.889Z | 0.2s | 216 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-10T13:49:08.531Z | 0.2s | 31120 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-10T13:49:11.929Z | 0.2s | 35203 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 3 | 0.4s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Revise task plan with answer | 6m 30s | 29 | 42359 | 60 | 2615996 | 2488438 | 127498 | 0.5846 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review | 2m 28s | 16 | 15991 | 34 | 1846364 | 1671110 | 175220 | 0.2223 |
| autonomous-sdlc-harness:task-plan-writer | Revise plan per arch findings | 51.3s | 7 | 5954 | 16 | 301068 | 263942 | 37110 | 0.0769 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $5.27 |
| Cost — claude-opus-5-5 | $5.27 |
| Input tokens (uncached) | 160 |
| Total input tokens (incl. cache) | 7097340 |
| Output tokens | 72584 |
| Thinking tokens (main thread) | 659 |
| Cache read tokens | 6658913 |
| Cache write tokens | 438267 |
| Cache write tokens, main thread (5m / 1h) | 0 / 98439 |
| Cache hit ratio | 0.9382 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 50 | 2333912 | 987 | 2235423 | 98439 |
| sub-agents | 110 | 4763428 | 64304 | 4423490 | 339828 |
| remainder | 0 | 0 | 7293 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents spawned / failed / killed | 3 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 30 |
| Time to first token | 1.6s |
| Rate-limit peak | seven_day 0.02 |

## Session 3 — 2026-11-10T13:59:01.573Z → 2026-11-10T14:04:49.611Z

Session id: `93469e13-c0d5-49f3-8d20-d37153e949b0`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 5m 48s | 5m 49s | 5m 43s | 0.0s | 0.0s | 5m 48s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 58 | 1.9s | 10.0s | 27.5s | 27.5s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 22 | 1.8s | 10.0s | 27.5s | 27.5s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 16 | 3.2s | 11.1s | 21.5s | 21.5s | 0 |
| orchestrator | 20 | 1.5s | 7.6s | 12.0s | 12.0s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 2 | 4m 27s | 2m 13s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 12 | 1.3s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 10 | 2.0s | 0.7s |
| Bash | orchestrator | 13 | 2.2s | 0.2s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 7 | 0.3s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 30 | 1.4s | 0.4s |
| Read | autonomous-sdlc-harness:task-plan-writer | 6 | 0.3s | 0.2s |
| Read | orchestrator | 4 | 0.9s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 1 | 0.0s | 0.0s |
| Write | orchestrator | 1 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-10T14:00:48.453Z | 0.7s | 1679 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-10T14:02:07.285Z | 0.4s | 41569 | false | false |
| Bash | orchestrator | 2026-11-10T14:04:16.978Z | 0.2s | 514 | false | false |
| Bash | orchestrator | 2026-11-10T13:59:04.538Z | 0.2s | 2641 | false | false |
| Read | orchestrator | 2026-11-10T13:59:14.579Z | 0.2s | 40775 | false | false |
| Read | orchestrator | 2026-11-10T13:59:12.625Z | 0.2s | 62301 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-10T13:59:43.938Z | 0.2s | 35051 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-10T14:02:07.837Z | 0.2s | 31120 | false | false |
| Read | orchestrator | 2026-11-10T13:59:05.027Z | 0.2s | 61084 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-10T14:02:32.586Z | 0.2s | 30267 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Revise task plan with park-2 answer | 2m 13s | 16 | 14893 | 34 | 1006115 | 926044 | 80037 | 0.3844 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan (iter 4) | 2m 13s | 22 | 14366 | 46 | 2732050 | 2560271 | 171733 | 0.383 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $4.07 |
| Cost — claude-opus-5-5 | $4.07 |
| Input tokens (uncached) | 122 |
| Total input tokens (incl. cache) | 5886233 |
| Output tokens | 37782 |
| Thinking tokens (main thread) | 1441 |
| Cache read tokens | 5515897 |
| Cache write tokens | 370214 |
| Cache write tokens, main thread (5m / 1h) | 0 / 118444 |
| Cache hit ratio | 0.9371 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 42 | 2148068 | 275 | 2029582 | 118444 |
| sub-agents | 80 | 3738165 | 29259 | 3486315 | 251770 |
| remainder | 0 | 0 | 8248 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 3 |
| Sub-agents spawned / failed / killed | 2 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 23 |
| Time to first token | 1.5s |
| Rate-limit peak | seven_day 0.02 |

## Session 4 — 2026-11-10T14:16:59.143Z → 2026-11-10T14:30:34.830Z

Session id: `1e122526-8acb-4f06-a330-f506f67195ca`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 13m 35s | 13m 37s | 13m 23s | 0.0s | 0.0s | 13m 35s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 119 | 3.0s | 12.9s | 47.6s | 47.8s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 13 | 2.2s | 3.8s | 5.1s | 5.1s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 73 | 4.4s | 18.4s | 47.8s | 47.8s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 10 | 2.9s | 3.9s | 4.6s | 4.6s | 0 |
| orchestrator | 23 | 1.4s | 3.9s | 10.4s | 10.4s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 3 | 12m 06s | 10m 19s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 6 | 0.8s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 62 | 8.8s | 0.7s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 4 | 0.6s | 0.1s |
| Bash | orchestrator | 24 | 3.4s | 0.2s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 6 | 0.2s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 28 | 1.0s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 35 | 1.2s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 5 | 0.0s | 0.0s |
| Read | orchestrator | 6 | 0.8s | 0.3s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 1 | 0.0s | 0.0s |
| Write | orchestrator | 1 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-10T14:22:12.229Z | 0.7s | 1679 | false | false |
| Read | orchestrator | 2026-11-10T14:17:22.130Z | 0.3s | 30457 | false | false |
| Read | orchestrator | 2026-11-10T14:17:16.194Z | 0.2s | 40775 | false | false |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-10T14:19:59.149Z | 0.2s | 36111 | false | false |
| Read | orchestrator | 2026-11-10T14:17:08.321Z | 0.2s | 62301 | false | false |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-10T14:20:02.252Z | 0.2s | 41569 | false | false |
| Bash | orchestrator | 2026-11-10T14:17:00.961Z | 0.2s | 73 | false | false |
| Read | autonomous-sdlc-harness:architecture-reviewer | 2026-11-10T14:18:49.184Z | 0.2s | 41569 | false | false |
| Bash | orchestrator | 2026-11-10T14:19:43.652Z | 0.2s | 157 | false | false |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-10T14:20:03.233Z | 0.2s | 31120 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Task plan writer: extend per park 3 | 45.2s | 10 | 5159 | 22 | 349984 | 312416 | 37546 | 0.0554 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 02s | 13 | 6851 | 28 | 1254500 | 1107209 | 147263 | 0.076 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review | 10m 19s | 73 | 62477 | 148 | 14221859 | 13949729 | 271982 | 0.7591 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $8.26 |
| Cost — claude-opus-5-5 | $8.26 |
| Input tokens (uncached) | 244 |
| Total input tokens (incl. cache) | 17954789 |
| Output tokens | 84511 |
| Thinking tokens (main thread) | 1329 |
| Cache read tokens | 17397677 |
| Cache write tokens | 556868 |
| Cache write tokens, main thread (5m / 1h) | 0 / 100077 |
| Cache hit ratio | 0.969 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 46 | 2128446 | 1085 | 2028323 | 100077 |
| sub-agents | 198 | 15826343 | 74487 | 15369354 | 456791 |
| remainder | 0 | 0 | 8939 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents spawned / failed / killed | 3 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 37 |
| Time to first token | 1.9s |
| Rate-limit peak | seven_day 0.02 |
