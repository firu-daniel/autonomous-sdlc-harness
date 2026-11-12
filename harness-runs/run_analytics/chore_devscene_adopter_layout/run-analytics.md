# Run analytics — chore_devscene_adopter_layout

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 57m 41s |
| Wall | 57m 41s |
| Active | 53m 52s |
| Host-suspended | 0.0s |
| Idle | 3m 49s |
| Cost | $31.00 |
| Input tokens (uncached) | 824 |
| Total input tokens (incl. cache) | 63545087 |
| Output tokens | 379916 |
| Thinking tokens (main thread) | 1909 |
| Cache read tokens | 61417511 |
| Cache write tokens | 2126752 |
| Cache write tokens, main thread (5m / 1h) | 0 / 159879 |
| Cache hit ratio | 0.9665 |
| Requests | 399 |
| Request latency p50 / p90 / p99 / max | 3.0s / 15.3s / 36.4s / 3m 49s |
| Requests over the idle threshold | 1 |
| API retries | 0 |
| Permission denials | 17 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | devscene:task-plan-writer — Write task plan — 27m 22s (session 1) |
| Rate-limit peak | seven_day 0.22 |

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

## Session 1 — 2026-11-12T06:50:59.487Z → 2026-11-12T07:48:40.673Z

Session id: `59c942c9-9bd4-4b1e-93d4-f400c61a9164`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 57m 41s | 57m 43s | 56m 38s | 0.0s | 3m 49s | 53m 52s | none |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-11-12T07:05:27.363Z | 3m 49s | devscene:task-plan-writer | in_flight_request |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 399 | 3.0s | 15.3s | 36.4s | 3m 49s | 1 |
| devscene:architecture-reviewer | 86 | 2.4s | 13.0s | 36.4s | 36.4s | 0 |
| devscene:prompt-injection-reviewer | 1 | 2.1s | 2.1s | 2.1s | 2.1s | 0 |
| devscene:task-plan-reviewer | 81 | 4.5s | 13.5s | 23.1s | 23.1s | 0 |
| devscene:task-plan-writer | 161 | 4.8s | 20.5s | 55.3s | 3m 49s | 1 |
| orchestrator | 70 | 1.5s | 2.0s | 8.1s | 8.1s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 13 | 54m 34s | 27m 22s |
| Bash | devscene:architecture-reviewer | 44 | 5.9s | 0.1s |
| Bash | devscene:task-plan-reviewer | 58 | 9.7s | 0.6s |
| Bash | devscene:task-plan-writer | 122 | 31.1s | 4.6s |
| Bash | orchestrator | 51 | 12.8s | 4.6s |
| Edit | devscene:task-plan-writer | 50 | 2.0s | 0.0s |
| Read | devscene:architecture-reviewer | 186 | 6.3s | 0.3s |
| Read | devscene:prompt-injection-reviewer | 2 | 0.0s | 0.0s |
| Read | devscene:task-plan-reviewer | 96 | 2.5s | 0.2s |
| Read | devscene:task-plan-writer | 39 | 2.2s | 0.2s |
| Read | orchestrator | 7 | 1.3s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | devscene:architecture-reviewer | 3 | 0.1s | 0.0s |
| Write | devscene:task-plan-reviewer | 2 | 0.1s | 0.0s |
| Write | devscene:task-plan-writer | 38 | 1.5s | 0.0s |
| Write | orchestrator | 3 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-12T06:51:45.415Z | 4.6s | 415 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-12T07:05:22.732Z | 4.6s | 400 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-12T07:17:38.111Z | 1.1s | 579 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-12T06:58:08.780Z | 1.1s | 1625 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-12T07:02:39.145Z | 1.0s | 4570 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-12T07:01:59.837Z | 1.0s | 2690 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-12T06:59:31.839Z | 0.7s | 4944 | false | false |
| Bash | devscene:task-plan-reviewer | 2026-11-12T07:45:02.472Z | 0.6s | 5395 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-12T06:53:45.815Z | 0.6s | 6329 | false | false |
| Bash | devscene:task-plan-reviewer | 2026-11-12T07:35:01.669Z | 0.6s | 5395 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| devscene:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.5s |
| devscene:task-plan-reviewer | git grep -lE 'harness\.config\|sdlc-harness\|harness-scripts\|harness-task-offer\|harness-no-offer\|harness-analyze\|harness-read-mention\|harness-watcher@\|harness:unf | 3 | 1.0s |
| devscene:task-plan-writer | git grep -lE 'harness\.config\|sdlc-harness\|harness-scripts\|harness-task-offer\|harness-no-offer\|harness-analyze\|harness-read-mention\|harness-watcher@\|harness:unf | 3 | 1.6s |
| devscene:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.5s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_devscene_adopter_layout --outcome FAIL --findings harness-runs/architecture_reviews/cho | 3 | 0.5s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_devscene_adopter_layout --outcome returned | 5 | 1.1s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE <main_repo>/harness-runs/AUTONOMOUS_STOP 2>&1; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 11 | 1.6s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| devscene:prompt-injection-reviewer | Screen task prompt | 5.3s | 1 | 395 | 4 | 28350 | 10409 | 17937 | 0.0015 |
| devscene:task-plan-writer | Write task plan | 27m 22s | 106 | 187689 | 214 | 27189766 | 26739055 | 450497 | 0.4745 |
| devscene:architecture-reviewer | Architecture review of plan | 2m 37s | 16 | 16811 | 34 | 2015998 | 1837995 | 177969 | 0.0454 |
| devscene:task-plan-writer | Revise task plan | 3m 14s | 21 | 23319 | 44 | 1626193 | 1544325 | 81824 | 0.0562 |
| devscene:architecture-reviewer | Architecture re-review of plan | 2m 00s | 19 | 12954 | 40 | 2042843 | 1879284 | 163519 | 0.0347 |
| devscene:task-plan-writer | Revise task plan | 58.9s | 8 | 6614 | 18 | 481739 | 426202 | 55519 | 0.017 |
| devscene:architecture-reviewer | Architecture re-review of plan | 2m 11s | 22 | 13778 | 46 | 2656664 | 2495373 | 161245 | 0.0381 |
| devscene:task-plan-writer | Revise task plan | 43.2s | 6 | 4750 | 14 | 320738 | 276057 | 44667 | 0.0125 |
| devscene:architecture-reviewer | Architecture re-review of plan | 1m 29s | 16 | 9667 | 34 | 1569750 | 1418848 | 150868 | 0.0259 |
| devscene:task-plan-reviewer | Structural review of plan | 5m 11s | 43 | 32026 | 88 | 7417831 | 7187176 | 230567 | 0.0899 |
| devscene:task-plan-writer | Revise task plan | 2m 46s | 20 | 18284 | 42 | 1471468 | 1378506 | 92920 | 0.048 |
| devscene:architecture-reviewer | Architecture re-review of plan | 1m 12s | 13 | 7282 | 28 | 1114607 | 988715 | 125864 | 0.021 |
| devscene:task-plan-reviewer | Structural re-review of plan | 4m 41s | 38 | 29545 | 78 | 5724665 | 5511110 | 213477 | 0.0812 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $31.00 |
| Cost — claude-opus-5-5 | $31.00 |
| Input tokens (uncached) | 824 |
| Total input tokens (incl. cache) | 63545087 |
| Output tokens | 379916 |
| Thinking tokens (main thread) | 1909 |
| Cache read tokens | 61417511 |
| Cache write tokens | 2126752 |
| Cache write tokens, main thread (5m / 1h) | 0 / 159879 |
| Cache hit ratio | 0.9665 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 140 | 9884475 | 1404 | 9724456 | 159879 |
| sub-agents | 684 | 53660612 | 363114 | 51693055 | 1966873 |
| remainder | 0 | 0 | 15398 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 17 |
| Sub-agents spawned / failed / killed | 13 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 77 |
| Time to first token | 1.9s |
| Rate-limit peak | seven_day 0.22 |
