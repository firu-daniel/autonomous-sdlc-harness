# Run analytics — feat_converging_plan_reviews

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 1h02m |
| Wall | 1h02m |
| Active | 1h02m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $35.47 |
| Input tokens (uncached) | 858 |
| Total input tokens (incl. cache) | 82196323 |
| Output tokens | 395238 |
| Thinking tokens (main thread) | 1238 |
| Cache read tokens | 79963941 |
| Cache write tokens | 2231524 |
| Cache write tokens, main thread (5m / 1h) | 0 / 137916 |
| Cache hit ratio | 0.9728 |
| Requests | 415 |
| Request latency p50 / p90 / p99 / max | 3.2s / 18.1s / 1m 13s / 1m 51s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 12 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | devscene:task-plan-writer — Write the task plan — 28m 04s (session 1) |
| Rate-limit peak | seven_day 0.35 |

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

## Session 1 — 2026-11-13T16:41:37.341Z → 2026-11-13T17:44:32.141Z

Session id: `10a15037-0fbf-4cbf-b7f7-e0c81f7fbbb4`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h02m | 1h02m | 1h02m | 0.0s | 0.0s | 1h02m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 415 | 3.2s | 18.1s | 1m 13s | 1m 51s | 0 |
| devscene:architecture-reviewer | 84 | 2.8s | 19.1s | 37.5s | 37.5s | 0 |
| devscene:prompt-injection-reviewer | 1 | 1.3s | 1.3s | 1.3s | 1.3s | 0 |
| devscene:task-plan-reviewer | 126 | 4.0s | 17.2s | 37.3s | 44.4s | 0 |
| devscene:task-plan-writer | 147 | 4.6s | 26.9s | 1m 45s | 1m 51s | 0 |
| orchestrator | 57 | 1.2s | 1.9s | 8.2s | 8.2s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 13 | 1h00m | 28m 04s |
| Bash | devscene:architecture-reviewer | 52 | 7.8s | 0.4s |
| Bash | devscene:task-plan-reviewer | 87 | 13.4s | 0.4s |
| Bash | devscene:task-plan-writer | 76 | 12.2s | 0.4s |
| Bash | orchestrator | 51 | 13.0s | 4.9s |
| Edit | devscene:task-plan-writer | 51 | 1.9s | 0.0s |
| Read | devscene:architecture-reviewer | 193 | 5.9s | 0.3s |
| Read | devscene:prompt-injection-reviewer | 2 | 0.0s | 0.0s |
| Read | devscene:task-plan-reviewer | 103 | 2.9s | 0.3s |
| Read | devscene:task-plan-writer | 57 | 3.8s | 0.3s |
| Read | orchestrator | 5 | 1.1s | 0.3s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | devscene:architecture-reviewer | 3 | 0.0s | 0.0s |
| Write | devscene:task-plan-reviewer | 2 | 0.1s | 0.0s |
| Write | devscene:task-plan-writer | 32 | 1.2s | 0.0s |
| Write | orchestrator | 3 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-13T16:42:20.890Z | 4.9s | 418 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-13T16:46:33.012Z | 0.4s | 26630 | false | false |
| Bash | devscene:task-plan-reviewer | 2026-11-13T17:38:35.581Z | 0.4s | 11859 | false | false |
| Bash | orchestrator | 2026-11-13T16:42:19.169Z | 0.4s | 71 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-13T17:34:26.503Z | 0.4s | 2 | false | false |
| Bash | devscene:task-plan-reviewer | 2026-11-13T17:25:29.741Z | 0.4s | 15487 | false | false |
| Bash | devscene:architecture-reviewer | 2026-11-13T17:12:47.875Z | 0.4s | 669 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-13T16:49:10.707Z | 0.4s | 16530 | false | false |
| Bash | devscene:task-plan-reviewer | 2026-11-13T17:39:01.913Z | 0.3s | 19087 | false | false |
| Bash | orchestrator | 2026-11-13T17:43:59.435Z | 0.3s | 478 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| devscene:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.6s |
| devscene:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_converging_plan_reviews --outcome FAIL --findings harness-runs/architecture_reviews/feat | 3 | 0.5s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_converging_plan_reviews --outcome returned | 5 | 1.0s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 12 | 1.6s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| devscene:prompt-injection-reviewer | Screen task prompt | 4.0s | 1 | 351 | 4 | 32852 | 10429 | 22419 | 0.0011 |
| devscene:task-plan-writer | Write the task plan | 28m 04s | 108 | 179196 | 218 | 39606769 | 39054354 | 552197 | 0.4462 |
| devscene:architecture-reviewer | Architecture plan review | 2m 58s | 19 | 18698 | 40 | 2394178 | 2232114 | 162024 | 0.0473 |
| devscene:task-plan-writer | Revise task plan (arch) | 1m 33s | 10 | 10909 | 22 | 436528 | 396825 | 39681 | 0.0247 |
| devscene:architecture-reviewer | Architecture plan review 1 | 2m 28s | 16 | 16255 | 34 | 2004581 | 1846149 | 158398 | 0.0393 |
| devscene:task-plan-writer | Revise task plan (arch 1) | 30.4s | 6 | 3262 | 14 | 249181 | 220084 | 29083 | 0.0081 |
| devscene:architecture-reviewer | Architecture plan review 2 | 1m 37s | 13 | 10591 | 28 | 1363430 | 1222246 | 141156 | 0.0258 |
| devscene:task-plan-reviewer | Task plan review 0 | 8m 36s | 67 | 50000 | 136 | 14147688 | 13830344 | 317208 | 0.1368 |
| devscene:task-plan-writer | Revise task plan (review 0) | 1m 23s | 12 | 9776 | 26 | 569275 | 512598 | 56651 | 0.0222 |
| devscene:architecture-reviewer | Architecture plan review 3 | 3m 01s | 23 | 19351 | 48 | 3090905 | 2908673 | 182184 | 0.0482 |
| devscene:task-plan-writer | Revise task plan (arch 2) | 1m 04s | 11 | 7323 | 24 | 532162 | 492252 | 39886 | 0.0172 |
| devscene:architecture-reviewer | Architecture plan review 4 | 1m 27s | 13 | 9602 | 28 | 1224002 | 1075752 | 148222 | 0.0231 |
| devscene:task-plan-reviewer | Task plan review 1 | 7m 27s | 59 | 44392 | 120 | 9719695 | 9475076 | 244499 | 0.1185 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $35.47 |
| Cost — claude-opus-5-5 | $35.47 |
| Input tokens (uncached) | 858 |
| Total input tokens (incl. cache) | 82196323 |
| Output tokens | 395238 |
| Thinking tokens (main thread) | 1238 |
| Cache read tokens | 79963941 |
| Cache write tokens | 2231524 |
| Cache write tokens, main thread (5m / 1h) | 0 / 137916 |
| Cache hit ratio | 0.9728 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 116 | 6825077 | 1250 | 6687045 | 137916 |
| sub-agents | 742 | 75371246 | 379706 | 73276896 | 2093608 |
| remainder | 0 | 0 | 14282 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 12 |
| Sub-agents spawned / failed / killed | 13 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 75 |
| Time to first token | 1.3s |
| Rate-limit peak | seven_day 0.35 |
