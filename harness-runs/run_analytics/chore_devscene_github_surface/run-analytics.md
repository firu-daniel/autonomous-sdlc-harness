# Run analytics — chore_devscene_github_surface

## Whole run

| Measure | Value |
|---|---|
| Sessions | 4 (0 incomplete) |
| Span | 7h51m |
| Wall | 4h08m |
| Active | 3h44m |
| Host-suspended | 11.6s |
| Idle | 23m 18s |
| Cost | $88.86 |
| Input tokens (uncached) | 3778 |
| Total input tokens (incl. cache) | 203899235 |
| Output tokens | 858745 |
| Thinking tokens (main thread) | 7037 |
| Cache read tokens | 197966401 |
| Cache write tokens | 5929056 |
| Cache write tokens, main thread (5m / 1h) | 0 / 810031 |
| Cache hit ratio | 0.9709 |
| Requests | 1796 |
| Request latency p50 / p90 / p99 / max | 1.9s / 5.7s / 22.1s / 3m 21s |
| Requests over the idle threshold | 1 |
| API retries | 0 |
| Permission denials | 70 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | devscene:layer-implementer — Implement Task 14 (cli) — 16m 56s (session 3) |
| Rate-limit peak | seven_day 0.17 |

## Network refusals

4 of 4 sessions scanned.

No refused network call.

## Possible network attempts in gate logs (best effort)

Lines in finished Run gates logs that carry a proxy refusal string or a plain connect error (`ECONNREFUSED`, `ENETUNREACH`, `EHOSTUNREACH`, `EAI_AGAIN`). They are listed as possible attempts, not refusals. What this list cannot show:

- a test that catches the error and passes leaves no trace;
- a plain connect error cannot be told apart from a host that is unreachable for another reason;
- on macOS, Seatbelt's own violation records go to the system log, not to the test output;
- a test whose name or output quotes one of these strings is listed too.

No possible network attempt in 2 round logs.

## Gate rounds

Wait is the orchestrator's wait on `run-test-suite.sh --wait <label>`, summed over every polling row whose command ends in that label; — when none matches, as for a label waited on fewer than three times in a session (no polling row is written for it) or a command cut at 160 characters.

A phase's test-file total sums each file's own seconds, so it exceeds the gate's wall time when files run in parallel.

### Round task_round_1 — pass

| Measure | Value |
|---|---|
| Wait (every run of task_round_1) | 24m 47s |
| Gate rows | 29 (complete) |
| Test files — full | 185 files, 11925.8 s summed |

| Phase | Gate | Status | Seconds |
|---|---|---|---|
| full | 1 | ok | 0 s |
| full | 2a | ok | 2 s |
| full | 2b | ok | 0 s |
| full | 2c | ok | 0 s |
| full | 2d | ok | 0 s |
| full | 2e | ok | 0 s |
| full | 3a | ok | 0 s |
| full | 3b | ok | 1 s |
| full | 3c | ok | 1 s |
| full | 3d | ok | 0 s |
| full | 3e | ok | 1 s |
| full | 3f | ok | 0 s |
| full | 4 | ok | 1528 s |
| full | 6a | ok | 1 s |
| full | 6b | ok | 0 s |
| full | 6c | ok | 1 s |
| full | 6d | ok | 2 s |
| full | 6e | ok | 0 s |
| full | 6f | ok | 0 s |
| full | 11 | ok | 12 s |
| full | 13a | BLOCKED | 0 s |
| full | 13b | BLOCKED | 0 s |
| full | 13c | BLOCKED | 0 s |
| full | 13d | SKIPPED | 0 s |
| full | 14a | ok | 1 s |
| full | 14b | ok | 0 s |
| full | 14c | ok | 1 s |
| full | 14d | SKIPPED | 1 s |
| full | 16 | ok | 1 s |

#### Slowest test files — full (10 of 185)

| File | Status | Seconds | Tests | Failed |
|---|---|---|---|---|
| test/watcher-review-drop-payloads.test.mjs | pass | 686.3 | 21 | 0 |
| test/watcher-remote-job.test.mjs | pass | 573.5 | 29 | 0 |
| test/remote-run.test.mjs | pass | 563.0 | 130 | 0 |
| test/watcher-placeholder-host.test.mjs | pass | 535.8 | 27 | 0 |
| test/watcher-remote-dispatch.test.mjs | pass | 517.2 | 17 | 0 |
| test/remote-control.test.mjs | pass | 493.0 | 83 | 0 |
| test/remote-control-review.test.mjs | pass | 476.7 | 33 | 0 |
| test/watcher-run-profile.test.mjs | pass | 464.7 | 21 | 0 |
| test/doctor.test.mjs | pass | 419.1 | 1 | 0 |
| test/watcher-stall-reset-payloads.test.mjs | pass | 415.7 | 18 | 0 |

### Round review_1_round_1 — pass

| Measure | Value |
|---|---|
| Wait (every run of review_1_round_1) | 26m 29s |
| Gate rows | 28 (complete) |
| Test files — full | 185 files, 12395.4 s summed |

| Phase | Gate | Status | Seconds |
|---|---|---|---|
| full | 1 | ok | 0 s |
| full | 2a | ok | 2 s |
| full | 2b | ok | 0 s |
| full | 2c | ok | 0 s |
| full | 2d | ok | 0 s |
| full | 2e | ok | 0 s |
| full | 3a | ok | 0 s |
| full | 3b | ok | 1 s |
| full | 3c | ok | 1 s |
| full | 3d | ok | 0 s |
| full | 3e | ok | 1 s |
| full | 3f | ok | 0 s |
| full | 4 | ok | 1607 s |
| full | 6a | ok | 2 s |
| full | 6b | ok | 0 s |
| full | 6c | ok | 1 s |
| full | 6d | ok | 2 s |
| full | 6e | ok | 0 s |
| full | 6f | ok | 1 s |
| full | 11 | ok | 15 s |
| full | 13a | BLOCKED | 0 s |
| full | 13b | BLOCKED | 0 s |
| full | 13c | BLOCKED | 0 s |
| full | 13d | SKIPPED | 0 s |
| full | 14a | ok | 1 s |
| full | 14c | ok | 2 s |
| full | 14d | SKIPPED | 0 s |
| full | 16 | ok | 2 s |

#### Slowest test files — full (10 of 185)

| File | Status | Seconds | Tests | Failed |
|---|---|---|---|---|
| test/watcher-review-drop-payloads.test.mjs | pass | 752.1 | 21 | 0 |
| test/watcher-remote-job.test.mjs | pass | 607.0 | 29 | 0 |
| test/remote-run.test.mjs | pass | 592.4 | 130 | 0 |
| test/watcher-placeholder-host.test.mjs | pass | 571.2 | 27 | 0 |
| test/watcher-remote-dispatch.test.mjs | pass | 560.4 | 17 | 0 |
| test/remote-control.test.mjs | pass | 516.6 | 83 | 0 |
| test/remote-control-review.test.mjs | pass | 504.5 | 33 | 0 |
| test/watcher-run-profile.test.mjs | pass | 492.1 | 21 | 0 |
| test/watcher-stall-reset-payloads.test.mjs | pass | 451.6 | 18 | 0 |
| test/doctor.test.mjs | pass | 415.6 | 1 | 0 |

## Session 1 — 2026-11-11T12:53:51.765Z → 2026-11-11T12:54:13.086Z

Session id: `3289775f-8e9d-4c66-a937-9c481c49fcf9`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 21.3s | 23.1s | 21.9s | 0.0s | 0.0s | 21.3s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 8 | 1.7s | 5.5s | 5.5s | 5.5s | 0 |
| orchestrator | 8 | 1.7s | 5.5s | 5.5s | 5.5s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Bash | orchestrator | 4 | 1.1s | 0.5s |
| Read | orchestrator | 3 | 0.0s | 0.0s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-11T12:53:54.712Z | 0.5s | 3160 | false | false |
| Bash | orchestrator | 2026-11-11T12:53:58.159Z | 0.2s | 7230 | false | false |
| Bash | orchestrator | 2026-11-11T12:54:02.237Z | 0.1s | 348 | true | false |
| Bash | orchestrator | 2026-11-11T12:54:05.792Z | 0.1s | 79 | false | false |
| Read | orchestrator | 2026-11-11T12:53:56.965Z | 0.0s | 7103 | false | false |
| Read | orchestrator | 2026-11-11T12:54:00.478Z | 0.0s | 14990 | false | false |
| Skill | orchestrator | 2026-11-11T12:53:51.774Z | 0.0s | 54 | false | false |
| Read | orchestrator | 2026-11-11T12:54:07.493Z | 0.0s | 2750 | false | false |

#### Polling loops

None.

### Sub-agents

None.

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $0.49 |
| Cost — claude-opus-5-5 | $0.49 |
| Input tokens (uncached) | 16 |
| Total input tokens (incl. cache) | 401820 |
| Output tokens | 2004 |
| Thinking tokens (main thread) | 326 |
| Cache read tokens | 354936 |
| Cache write tokens | 46868 |
| Cache write tokens, main thread (5m / 1h) | 0 / 46868 |
| Cache hit ratio | 0.8833 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 16 | 401820 | 598 | 354936 | 46868 |
| sub-agents | 0 | 0 | 0 | 0 | 0 |
| remainder | 0 | 0 | 1406 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 0 |
| Sub-agents spawned / failed / killed | 0 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 10 |
| Time to first token | 1.8s |
| Rate-limit peak | seven_day 0.12 |

## Session 2 — 2026-11-11T12:57:08.240Z → 2026-11-11T13:02:53.037Z

Session id: `1465b751-b557-46a9-9c84-4169d0343edd`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 5m 44s | 5m 46s | 5m 27s | 0.0s | 0.0s | 5m 44s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 67 | 2.0s | 9.3s | 27.1s | 27.1s | 0 |
| devscene:prompt-injection-reviewer | 2 | 2.0s | 2.7s | 2.7s | 2.7s | 0 |
| devscene:task-plan-writer | 35 | 3.2s | 11.9s | 27.1s | 27.1s | 0 |
| orchestrator | 30 | 1.8s | 2.6s | 8.5s | 8.5s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 3 | 4m 04s | 3m 53s |
| Bash | devscene:task-plan-writer | 32 | 7.1s | 1.4s |
| Bash | orchestrator | 21 | 19.9s | 4.6s |
| Read | devscene:prompt-injection-reviewer | 5 | 0.0s | 0.0s |
| Read | devscene:task-plan-writer | 14 | 0.6s | 0.2s |
| Read | orchestrator | 7 | 0.9s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | orchestrator | 4 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-11T12:57:51.333Z | 4.6s | 415 | false | false |
| Bash | orchestrator | 2026-11-11T12:58:26.714Z | 4.5s | 415 | false | false |
| Bash | orchestrator | 2026-11-11T12:58:27.235Z | 4.0s | 31 | false | false |
| Bash | orchestrator | 2026-11-11T12:58:27.926Z | 3.4s | 152 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-11T13:00:53.088Z | 1.4s | 1319 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-11T12:59:04.173Z | 0.4s | 3664 | false | false |
| Bash | orchestrator | 2026-11-11T12:57:49.182Z | 0.4s | 72 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-11T12:59:01.025Z | 0.4s | 2186 | false | false |
| Bash | devscene:task-plan-writer | 2026-11-11T13:00:38.710Z | 0.4s | 2373 | false | false |
| Bash | orchestrator | 2026-11-11T12:58:24.412Z | 0.4s | 72 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| devscene:prompt-injection-reviewer | Screen task prompt | 4.8s | 1 | 319 | 4 | 27633 | 10441 | 17188 | 0.0141 |
| devscene:prompt-injection-reviewer | Screen answer file | 6.2s | 1 | 458 | 4 | 27617 | 15882 | 11731 | 0.018 |
| devscene:task-plan-writer | Write task plan | 3m 53s | 35 | 22381 | 72 | 4314587 | 4145113 | 169402 | 0.6775 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $3.99 |
| Cost — claude-opus-5-5 | $3.99 |
| Input tokens (uncached) | 140 |
| Total input tokens (incl. cache) | 7134479 |
| Output tokens | 32239 |
| Thinking tokens (main thread) | 792 |
| Cache read tokens | 6812780 |
| Cache write tokens | 321559 |
| Cache write tokens, main thread (5m / 1h) | 0 / 123238 |
| Cache hit ratio | 0.9549 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 60 | 2764642 | 1261 | 2641344 | 123238 |
| sub-agents | 80 | 4369837 | 23158 | 4171436 | 198321 |
| remainder | 0 | 0 | 7820 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 2 |
| Sub-agents spawned / failed / killed | 3 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 38 |
| Time to first token | 1.5s |
| Rate-limit peak | seven_day 0.12 |

## Session 3 — 2026-11-11T13:10:27.035Z → 2026-11-11T16:00:17.753Z

Session id: `d0e2b789-b0f4-4635-9aed-ae3fe7e9faa4`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 2h49m | 2h49m | 1h37m | 11.6s | 23m 18s | 2h26m | pmset |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-11-11T13:44:01.654Z | 3m 21s | devscene:layer-implementer | in_flight_request |
| 2026-11-11T14:19:25.212Z | 2m 25s | devscene:layer-implementer | tool_running |
| 2026-11-11T14:21:54.310Z | 2m 59s | devscene:layer-implementer | tool_running |
| 2026-11-11T14:25:04.937Z | 3m 00s | devscene:layer-implementer | tool_running |
| 2026-11-11T14:35:29.544Z | 3m 18s | devscene:layer-implementer | in_flight_request |
| 2026-11-11T14:40:28.529Z | 3m 29s | devscene:layer-implementer | tool_running |
| 2026-11-11T14:44:01.345Z | 4m 43s | devscene:layer-implementer | tool_running |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 1274 | 1.9s | 5.8s | 23.1s | 3m 21s | 1 |
| devscene:architecture-reviewer | 36 | 2.1s | 11.8s | 18.1s | 18.1s | 0 |
| devscene:branch-reviewer | 73 | 3.7s | 13.2s | 24.5s | 24.5s | 0 |
| devscene:committer | 212 | 1.6s | 3.7s | 6.7s | 7.1s | 0 |
| devscene:layer-implementer | 452 | 2.1s | 4.6s | 14.7s | 3m 21s | 1 |
| devscene:prompt-injection-reviewer | 1 | 2.2s | 2.2s | 2.2s | 2.2s | 0 |
| devscene:review-plan-reviewer | 10 | 2.7s | 6.5s | 9.7s | 9.7s | 0 |
| devscene:skeptic-reviewer | 31 | 3.0s | 14.3s | 1m 34s | 1m 34s | 0 |
| devscene:statistics-plan-writer | 7 | 2.3s | 18.0s | 18.0s | 18.0s | 0 |
| devscene:task-plan-reviewer | 73 | 3.0s | 9.1s | 23.1s | 23.1s | 0 |
| devscene:task-plan-writer | 85 | 5.2s | 18.2s | 1m 23s | 1m 23s | 0 |
| orchestrator | 294 | 1.3s | 2.1s | 7.9s | 11.2s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 66 | 2h11m | 16m 56s |
| Bash | devscene:architecture-reviewer | 23 | 3.8s | 0.3s |
| Bash | devscene:branch-reviewer | 62 | 9.9s | 0.7s |
| Bash | devscene:committer | 292 | 2m 51s | 5.8s |
| Bash | devscene:layer-implementer | 413 | 58m 02s | 5m 28s |
| Bash | devscene:review-plan-reviewer | 9 | 1.5s | 0.2s |
| Bash | devscene:skeptic-reviewer | 29 | 4.7s | 0.6s |
| Bash | devscene:statistics-plan-writer | 8 | 1.0s | 0.1s |
| Bash | devscene:task-plan-reviewer | 60 | 9.7s | 0.6s |
| Bash | devscene:task-plan-writer | 63 | 10.9s | 0.6s |
| Bash | orchestrator | 233 | 27m 18s | 1m 01s |
| Edit | devscene:committer | 24 | 0.9s | 0.0s |
| Edit | devscene:layer-implementer | 261 | 9.9s | 0.0s |
| Edit | devscene:task-plan-writer | 8 | 0.3s | 0.0s |
| Edit | orchestrator | 14 | 24.7s | 8.2s |
| Read | devscene:architecture-reviewer | 69 | 3.0s | 0.2s |
| Read | devscene:branch-reviewer | 12 | 1.1s | 0.2s |
| Read | devscene:committer | 30 | 0.4s | 0.0s |
| Read | devscene:layer-implementer | 159 | 6.0s | 0.2s |
| Read | devscene:prompt-injection-reviewer | 3 | 0.0s | 0.0s |
| Read | devscene:review-plan-reviewer | 6 | 0.6s | 0.3s |
| Read | devscene:skeptic-reviewer | 4 | 0.3s | 0.2s |
| Read | devscene:statistics-plan-writer | 2 | 0.0s | 0.0s |
| Read | devscene:task-plan-reviewer | 69 | 2.4s | 0.2s |
| Read | devscene:task-plan-writer | 14 | 1.1s | 0.2s |
| Read | orchestrator | 23 | 32.5s | 7.9s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | devscene:branch-reviewer | 5 | 0.2s | 0.0s |
| Write | devscene:layer-implementer | 8 | 0.2s | 0.0s |
| Write | devscene:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | devscene:task-plan-reviewer | 1 | 0.0s | 0.0s |
| Write | devscene:task-plan-writer | 25 | 0.9s | 0.0s |
| Write | orchestrator | 3 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | devscene:layer-implementer | 2026-11-11T14:44:01.345Z | 5m 28s | 1407 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T14:44:00.550Z | 4m 44s | 17489 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T14:34:09.196Z | 4m 38s | 10039 | true | false |
| Bash | devscene:layer-implementer | 2026-11-11T14:40:28.529Z | 3m 29s | 29 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T14:25:04.937Z | 3m 00s | 335 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T14:21:54.310Z | 2m 59s | 10112 | true | false |
| Bash | devscene:layer-implementer | 2026-11-11T14:19:25.212Z | 2m 25s | 10040 | true | false |
| Bash | devscene:layer-implementer | 2026-11-11T14:13:57.824Z | 2m 05s | 8145 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T14:09:02.411Z | 1m 52s | 18412 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T14:00:47.609Z | 1m 41s | 2247 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| devscene:architecture-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| devscene:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/chore_devscene_github_surface_story_plan.md harness-runs/task_plans/cho | 10 | 5.0s |
| devscene:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 29 | 2m 08s |
| devscene:committer | cat <repo_root>/harness.config.json | 3 | 0.3s |
| devscene:committer | git -C <repo_root> branch --show-current | 4 | 0.4s |
| devscene:committer | git -C <repo_root> log -1 --oneline | 6 | 0.7s |
| devscene:committer | git -C <repo_root> status --short | 13 | 1.9s |
| devscene:committer | git branch --show-current | 20 | 2.3s |
| devscene:committer | git branch --show-current; git status --short; git rev-parse --show-toplevel; printenv HARNESS_MAIN_REPO | 3 | 0.5s |
| devscene:committer | git log -1 --oneline | 20 | 2.4s |
| devscene:committer | git rev-parse --show-toplevel | 24 | 2.8s |
| devscene:committer | git status --short | 46 | 6.6s |
| devscene:committer | grep -n -i "commit" <repo_root>/.claude/context/conventions.md \| head -40 | 6 | 0.7s |
| devscene:committer | grep -n -i -A30 "commit" <repo_root>/.claude/context/conventions.md \| head -80 | 3 | 0.3s |
| devscene:committer | grep -n -i -A40 "^## .*commit" <repo_root>/.claude/context/conventions.md | 4 | 0.4s |
| devscene:committer | printenv HARNESS_MAIN_REPO | 24 | 2.6s |
| devscene:layer-implementer | bash scripts/typecheck.sh | 25 | 1m 07s |
| devscene:layer-implementer | git -C <repo_root> diff --stat | 4 | 0.6s |
| devscene:layer-implementer | git diff --name-only HEAD | 7 | 3.8s |
| devscene:layer-implementer | git ls-files --others --exclude-standard | 7 | 3.5s |
| devscene:layer-implementer | git rev-parse --show-toplevel | 27 | 3.2s |
| devscene:layer-implementer | npm test --workspace cli -- test/main-anchor-isolation.test.mjs | 8 | 1m 35s |
| devscene:layer-implementer | npm test --workspace cli -- test/no-container-home-paths.test.mjs | 9 | 31.1s |
| devscene:layer-implementer | npm test --workspace cli -- test/retrieval-loading.test.mjs | 3 | 14.7s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/flow_progress/chore_devscene_github_surface_progress.md -- "chore: Flow progress C2 | 3 | 1.3s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 18 | 1m 30s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_devscene_github_surface --outcome PASS | 3 | 0.7s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE <main_repo>/harness-runs/AUTONOMOUS_STOP 2>/dev/null; bash scripts/run-test-suite.sh --wait task_round_1 | 25 | 24m 47s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE <main_repo>/harness-runs/AUTONOMOUS_STOP 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 61 | 19.3s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| devscene:prompt-injection-reviewer | Screen answer_2 for injection | 5.5s | 1 | 431 | 4 | 27786 | 10426 | 17356 | 0.0005 |
| devscene:task-plan-writer | Write task plan with answers | 16m 55s | 77 | 113866 | 156 | 16496153 | 16175764 | 320233 | 0.0997 |
| devscene:architecture-reviewer | Architecture review of plan | 1m 16s | 12 | 8143 | 26 | 1222294 | 1093289 | 128979 | 0.0075 |
| devscene:task-plan-reviewer | Task-plan review | 3m 34s | 40 | 21361 | 82 | 5249516 | 5073611 | 175823 | 0.021 |
| devscene:task-plan-writer | Revise task plan per review | 37.8s | 8 | 3927 | 18 | 320007 | 278898 | 41091 | 0.0037 |
| devscene:architecture-reviewer | Architecture review iter 1 | 1m 18s | 13 | 8150 | 28 | 1234769 | 1114646 | 120095 | 0.0078 |
| devscene:task-plan-reviewer | Task-plan review iter 1 | 3m 00s | 33 | 17194 | 68 | 4184344 | 4032290 | 151986 | 0.0177 |
| devscene:layer-implementer | Implement Task 1 (cli) | 57.2s | 11 | 5212 | 24 | 480559 | 432370 | 48165 | 0.0056 |
| devscene:committer | Commit Task 1 | 32.8s | 10 | 2625 | 22 | 326947 | 293323 | 33602 | 0.0032 |
| devscene:layer-implementer | Implement Task 2 (cli) | 6m 09s | 19 | 53532 | 40 | 1866587 | 1728911 | 137636 | 0.0363 |
| devscene:committer | Commit Task 2 | 25.8s | 7 | 2029 | 16 | 193090 | 166681 | 26393 | 0.0025 |
| devscene:layer-implementer | Implement Task 3 (cli) | 1m 40s | 20 | 9172 | 42 | 932409 | 888691 | 43676 | 0.0099 |
| devscene:committer | Commit Task 3 | 28.4s | 9 | 2374 | 20 | 248100 | 232510 | 15570 | 0.0028 |
| devscene:layer-implementer | Implement Task 4 (cli) | 1m 01s | 12 | 5348 | 26 | 747341 | 689881 | 57434 | 0.006 |
| devscene:committer | Commit Task 4 | 29.5s | 9 | 2332 | 20 | 257781 | 240216 | 17545 | 0.0029 |
| devscene:layer-implementer | Implement Task 5 (cli) | 1m 39s | 17 | 10949 | 36 | 783050 | 737282 | 45732 | 0.0097 |
| devscene:committer | Commit Task 5 | 25.6s | 8 | 2145 | 18 | 261773 | 242132 | 19623 | 0.0025 |
| devscene:layer-implementer | Implement Task 6 (cli) | 1m 26s | 14 | 10456 | 30 | 664633 | 620951 | 43652 | 0.0085 |
| devscene:committer | Commit Task 6 | 29.1s | 8 | 2414 | 18 | 224514 | 210006 | 14490 | 0.0029 |
| devscene:layer-implementer | Implement Task 7 (cli) | 1m 47s | 19 | 8746 | 40 | 1018533 | 956180 | 62313 | 0.0105 |
| devscene:committer | Commit Task 7 | 28.2s | 7 | 2475 | 16 | 225832 | 207201 | 18615 | 0.0028 |
| devscene:layer-implementer | Implement Task 8 (cli) | 3m 05s | 19 | 8864 | 40 | 850831 | 812681 | 38110 | 0.0182 |
| devscene:committer | Commit Task 8 | 25.3s | 6 | 1911 | 14 | 196202 | 177002 | 19186 | 0.0025 |
| devscene:layer-implementer | Implement Task 9 (cli) | 2m 32s | 13 | 7337 | 28 | 560342 | 521446 | 38868 | 0.0149 |
| devscene:committer | Commit Task 9 | 27.2s | 7 | 2239 | 16 | 207823 | 192480 | 15327 | 0.0027 |
| devscene:layer-implementer | Implement Task 10 (cli) | 4m 38s | 17 | 7027 | 36 | 1121511 | 1042200 | 79275 | 0.0273 |
| devscene:committer | Commit Task 10 | 25.6s | 7 | 1972 | 16 | 222734 | 204612 | 18106 | 0.0025 |
| devscene:layer-implementer | Implement Task 11 (cli) | 4m 33s | 14 | 5398 | 30 | 681849 | 635363 | 46456 | 0.0268 |
| devscene:committer | Commit Task 11 | 26.7s | 7 | 2152 | 16 | 227189 | 208089 | 19084 | 0.0026 |
| devscene:layer-implementer | Implement Task 12 (cli) | 11m 28s | 23 | 11056 | 48 | 1398173 | 1331252 | 66873 | 0.0676 |
| devscene:committer | Commit Task 12 | 24.8s | 7 | 2011 | 16 | 196008 | 169186 | 26806 | 0.0024 |
| devscene:layer-implementer | Implement Task 13 (cli) | 3m 17s | 16 | 5992 | 34 | 732828 | 688265 | 44529 | 0.0193 |
| devscene:committer | Commit Task 13 | 23.7s | 7 | 1885 | 16 | 203590 | 188474 | 15100 | 0.0023 |
| devscene:layer-implementer | Implement Task 14 (cli) | 16m 56s | 24 | 11167 | 50 | 1349989 | 1204374 | 145565 | 0.0998 |
| devscene:committer | Commit Task 14 | 27.8s | 9 | 2321 | 20 | 278405 | 244357 | 34028 | 0.0027 |
| devscene:layer-implementer | Implement Task 15 (plugin) | 30.4s | 6 | 2872 | 14 | 240004 | 213123 | 26867 | 0.003 |
| devscene:committer | Commit Task 15 | 25.1s | 8 | 1956 | 18 | 222674 | 208335 | 14321 | 0.0025 |
| devscene:layer-implementer | Implement Task 16 (general) | 1m 48s | 20 | 12171 | 42 | 1024032 | 976595 | 47395 | 0.0106 |
| devscene:committer | Commit Task 16 | 27.1s | 7 | 2198 | 16 | 243328 | 220220 | 23092 | 0.0027 |
| devscene:layer-implementer | Implement Task 17 (general) | 1m 21s | 16 | 9141 | 34 | 878680 | 829146 | 49500 | 0.008 |
| devscene:committer | Commit Task 17 | 29.4s | 7 | 2532 | 16 | 221295 | 203218 | 18061 | 0.0029 |
| devscene:layer-implementer | Implement Task 18 (general) | 1m 21s | 18 | 8831 | 38 | 827825 | 787559 | 40228 | 0.008 |
| devscene:committer | Commit Task 18 | 31.7s | 10 | 2457 | 22 | 287792 | 271217 | 16553 | 0.0031 |
| devscene:layer-implementer | Implement Task 19 (cli) | 2m 02s | 6 | 3427 | 14 | 224575 | 193781 | 30780 | 0.012 |
| devscene:committer | Commit Task 19 | 25.0s | 7 | 1969 | 16 | 191229 | 177887 | 13326 | 0.0025 |
| devscene:layer-implementer | Implement Task 20 (general) | 40.7s | 11 | 3627 | 24 | 489079 | 455454 | 33601 | 0.004 |
| devscene:committer | Commit Task 20 | 26.1s | 8 | 1998 | 18 | 208035 | 195721 | 12296 | 0.0026 |
| devscene:layer-implementer | Implement Task 21 (general) | 1m 43s | 24 | 9572 | 50 | 1903194 | 1814475 | 88669 | 0.0102 |
| devscene:committer | Commit Task 21 | 28.2s | 10 | 2193 | 22 | 267175 | 251882 | 15271 | 0.0028 |
| devscene:layer-implementer | Implement Task 22 (general) | 1m 57s | 27 | 11775 | 56 | 1825275 | 1757795 | 67424 | 0.0115 |
| devscene:committer | Commit Task 22 | 30.7s | 9 | 2593 | 20 | 258914 | 241494 | 17400 | 0.003 |
| devscene:layer-implementer | Implement Task 23 (general) | 2m 08s | 38 | 12912 | 78 | 2203742 | 2149135 | 54529 | 0.0126 |
| devscene:committer | Commit Task 23 | 31.6s | 11 | 2408 | 24 | 293197 | 277376 | 15797 | 0.0031 |
| devscene:layer-implementer | Implement Task 24 (general) | 1m 36s | 23 | 10075 | 48 | 1685579 | 1606436 | 79095 | 0.0095 |
| devscene:committer | Commit Task 24 | 30.2s | 7 | 2660 | 16 | 203599 | 189110 | 14473 | 0.003 |
| devscene:architecture-reviewer | Branch architecture review | 51.7s | 11 | 4929 | 24 | 846544 | 748347 | 98173 | 0.0051 |
| devscene:branch-reviewer | End-of-branch code review | 7m 33s | 73 | 44616 | 148 | 11900131 | 11668343 | 231640 | 0.0445 |
| devscene:review-plan-reviewer | Meta-review code review | 54.2s | 10 | 5356 | 22 | 506881 | 432239 | 74620 | 0.0053 |
| devscene:committer | Commit code review file | 19.6s | 5 | 1376 | 12 | 134206 | 110721 | 23473 | 0.0019 |
| devscene:layer-implementer | Fix code-review Finding 1 | 34.1s | 8 | 2829 | 18 | 403263 | 348614 | 54631 | 0.0033 |
| devscene:committer | Commit code-review Finding 1 | 26.7s | 7 | 2215 | 16 | 205051 | 189588 | 15447 | 0.0026 |
| devscene:layer-implementer | Fix Finding 2 (cli layer) | 42.7s | 9 | 3481 | 20 | 347662 | 320400 | 27242 | 0.0042 |
| devscene:layer-implementer | Fix Finding 2 (general layer) | 29.6s | 8 | 2557 | 18 | 339111 | 309311 | 29782 | 0.0029 |
| devscene:committer | Commit code-review Finding 2 | 27.4s | 8 | 2253 | 18 | 243560 | 225131 | 18411 | 0.0027 |
| devscene:skeptic-reviewer | Adversarial skeptic review | 4m 14s | 31 | 15918 | 64 | 2623146 | 2500500 | 122582 | 0.025 |
| devscene:statistics-plan-writer | Write branch statistics | 36.1s | 7 | 4373 | 16 | 225958 | 191231 | 34711 | 0.0035 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $62.60 |
| Cost — claude-opus-5-5 | $62.60 |
| Input tokens (uncached) | 2684 |
| Total input tokens (incl. cache) | 149717270 |
| Output tokens | 630488 |
| Thinking tokens (main thread) | 2728 |
| Cache read tokens | 145775877 |
| Cache write tokens | 3938709 |
| Cache write tokens, main thread (5m / 1h) | 0 / 375536 |
| Cache hit ratio | 0.9737 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 590 | 72945893 | 7702 | 72569767 | 375536 |
| sub-agents | 2092 | 76668228 | 561483 | 73109424 | 3556712 |
| remainder | 2 | 103149 | 61303 | 96686 | 6461 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 58 |
| Sub-agents spawned / failed / killed | 66 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 342 |
| Time to first token | 1.4s |
| Rate-limit peak | seven_day 0.16 |

## Session 4 — 2026-11-11T19:32:53.073Z → 2026-11-11T20:44:59.405Z

Session id: `3e635bc5-fb18-4175-9ea7-03b4169b6da3`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h12m | 1h12m | 30m 15s | 0.0s | 0.0s | 1h12m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 447 | 2.0s | 5.4s | 16.4s | 31.1s | 0 |
| devscene:architecture-reviewer | 29 | 3.0s | 8.4s | 14.7s | 14.7s | 0 |
| devscene:committer | 22 | 1.5s | 5.0s | 7.0s | 7.0s | 0 |
| devscene:layer-implementer | 138 | 2.1s | 4.6s | 7.4s | 10.0s | 0 |
| devscene:layer-reviewer | 74 | 2.4s | 5.4s | 7.4s | 7.4s | 0 |
| devscene:prompt-injection-reviewer | 2 | 1.5s | 4.7s | 4.7s | 4.7s | 0 |
| devscene:statistics-plan-writer | 7 | 2.0s | 21.6s | 21.6s | 21.6s | 0 |
| devscene:user-review-fix-plan-writer | 53 | 3.5s | 12.8s | 31.1s | 31.1s | 0 |
| orchestrator | 122 | 1.6s | 2.1s | 7.8s | 9.5s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 21 | 39m 25s | 5m 53s |
| Bash | devscene:architecture-reviewer | 26 | 6.1s | 0.8s |
| Bash | devscene:committer | 31 | 20.5s | 4.9s |
| Bash | devscene:layer-implementer | 117 | 10m 46s | 2m 55s |
| Bash | devscene:layer-reviewer | 70 | 5m 10s | 1m 19s |
| Bash | devscene:statistics-plan-writer | 10 | 1.2s | 0.1s |
| Bash | devscene:user-review-fix-plan-writer | 30 | 7.7s | 1.2s |
| Bash | orchestrator | 100 | 27m 44s | 1m 01s |
| Edit | devscene:committer | 3 | 0.1s | 0.0s |
| Edit | devscene:layer-implementer | 68 | 2.7s | 0.0s |
| Edit | devscene:user-review-fix-plan-writer | 15 | 0.6s | 0.0s |
| Edit | orchestrator | 6 | 0.2s | 0.0s |
| Grep | devscene:prompt-injection-reviewer | 1 | 0.1s | 0.1s |
| Read | devscene:architecture-reviewer | 23 | 1.1s | 0.2s |
| Read | devscene:committer | 2 | 0.0s | 0.0s |
| Read | devscene:layer-implementer | 42 | 1.1s | 0.2s |
| Read | devscene:layer-reviewer | 22 | 1.9s | 0.4s |
| Read | devscene:prompt-injection-reviewer | 2 | 0.0s | 0.0s |
| Read | devscene:statistics-plan-writer | 5 | 0.3s | 0.3s |
| Read | devscene:user-review-fix-plan-writer | 37 | 0.8s | 0.2s |
| Read | orchestrator | 16 | 14.3s | 4.3s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | devscene:architecture-reviewer | 1 | 0.0s | 0.0s |
| Write | devscene:layer-reviewer | 4 | 0.1s | 0.0s |
| Write | devscene:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | devscene:user-review-fix-plan-writer | 4 | 0.1s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | devscene:layer-implementer | 2026-11-11T19:53:46.596Z | 2m 55s | 2241 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T19:47:37.937Z | 1m 36s | 2246 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T20:02:19.393Z | 1m 36s | 2246 | false | false |
| Bash | devscene:layer-reviewer | 2026-11-11T19:58:00.515Z | 1m 19s | 11132 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T19:53:46.126Z | 1m 17s | 8099 | false | false |
| Bash | devscene:layer-implementer | 2026-11-11T19:46:19.348Z | 1m 16s | 29 | false | false |
| Bash | devscene:layer-reviewer | 2026-11-11T19:50:37.411Z | 1m 14s | 156 | false | false |
| Bash | devscene:layer-reviewer | 2026-11-11T20:05:10.140Z | 1m 01s | 29 | false | false |
| Bash | orchestrator | 2026-11-11T20:34:05.501Z | 1m 01s | 118 | true | false |
| Bash | orchestrator | 2026-11-11T20:37:14.576Z | 1m 01s | 118 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| devscene:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/user_reviews/chore_devscene_github_surface_fix_plan.md harness-runs/user_reviews/ch | 3 | 2.7s |
| devscene:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 3 | 14.4s |
| devscene:committer | git branch --show-current | 3 | 0.3s |
| devscene:committer | git log -1 --oneline | 3 | 0.3s |
| devscene:committer | git rev-parse --show-toplevel | 3 | 0.3s |
| devscene:committer | git status --short | 6 | 0.9s |
| devscene:committer | printenv HARNESS_MAIN_REPO | 3 | 0.3s |
| devscene:layer-implementer | bash scripts/typecheck.sh | 5 | 13.1s |
| devscene:layer-implementer | git rev-parse --show-toplevel | 6 | 0.7s |
| devscene:layer-implementer | npm test --workspace cli -- test/doctor.test.mjs | 3 | 6m 08s |
| devscene:layer-implementer | npm test --workspace cli -- test/main-anchor-isolation.test.mjs | 3 | 5.2s |
| devscene:layer-implementer | npm test --workspace cli -- test/no-container-home-paths.test.mjs | 3 | 22.9s |
| devscene:layer-implementer | npm test --workspace cli -- test/retrieval-loading.test.mjs | 3 | 17.3s |
| devscene:layer-reviewer | git rev-parse --show-toplevel | 6 | 0.7s |
| devscene:layer-reviewer | git status --short && git diff HEAD --stat | 4 | 0.8s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/chore_devscene_github_surface_progress.md" -- "chore: Flow progress  | 5 | 2.1s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 10 | 46.6s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>&1; bash scripts/run-test-suite.sh --wait review_1_round_1 | 27 | 26m 29s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE <main_repo>/harness-runs/AUTONOMOUS_STOP 2>&1; ls harness-runs/user_review_fix_plan_point_reviews/chore_devscene_github_ | 6 | 0.7s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| devscene:prompt-injection-reviewer | Screen user review file | 8.6s | 2 | 676 | 6 | 45442 | 26880 | 18556 | 0.002 |
| devscene:user-review-fix-plan-writer | Write user-review fix plan | 5m 53s | 43 | 36424 | 88 | 5185030 | 4988079 | 196863 | 0.0817 |
| devscene:architecture-reviewer | Architecture gate on fix plan | 1m 25s | 15 | 8724 | 32 | 1368237 | 1254521 | 113684 | 0.0198 |
| devscene:user-review-fix-plan-writer | Revise fix plan per arch findings | 57.1s | 10 | 6926 | 22 | 437649 | 397971 | 39656 | 0.0132 |
| devscene:architecture-reviewer | Architecture gate re-review | 1m 13s | 14 | 7089 | 30 | 1281247 | 1179678 | 101539 | 0.017 |
| devscene:layer-implementer | Implement Item 1 cli layer | 5m 07s | 29 | 14186 | 60 | 1831061 | 1754709 | 76292 | 0.0711 |
| devscene:layer-reviewer | Review Item 1 cli layer | 3m 05s | 17 | 4286 | 36 | 777775 | 725964 | 51775 | 0.0428 |
| devscene:layer-implementer | Implement Item 1 general layer | 4m 15s | 15 | 6951 | 32 | 674655 | 633575 | 41048 | 0.0591 |
| devscene:layer-reviewer | Review Item 1 general layer | 2m 01s | 10 | 4039 | 22 | 681082 | 609048 | 72012 | 0.0282 |
| devscene:committer | Commit Item 1 | 28.6s | 9 | 2262 | 20 | 256080 | 226580 | 29480 | 0.0066 |
| devscene:layer-implementer | Implement Item 2 cli layer | 4m 22s | 35 | 17132 | 72 | 2762696 | 2673615 | 89009 | 0.0608 |
| devscene:layer-reviewer | Review Item 2 cli layer | 1m 48s | 9 | 3819 | 20 | 466714 | 417359 | 49335 | 0.025 |
| devscene:layer-implementer | Implement Item 2 general layer | 1m 32s | 18 | 9483 | 38 | 1134440 | 1077476 | 56926 | 0.0214 |
| devscene:layer-reviewer | Review Item 2 general layer | 33.4s | 9 | 2799 | 20 | 520926 | 469721 | 51185 | 0.0077 |
| devscene:committer | Commit Item 2 | 27.0s | 7 | 2109 | 16 | 193779 | 167267 | 26496 | 0.0062 |
| devscene:layer-implementer | Implement Item 3 general layer | 2m 20s | 36 | 14191 | 74 | 3036826 | 2945550 | 91202 | 0.0326 |
| devscene:layer-reviewer | Review Item 3 general layer | 48.1s | 10 | 4552 | 22 | 723594 | 641312 | 82260 | 0.0111 |
| devscene:layer-implementer | Fix Item 3 per review | 19.0s | 5 | 1719 | 12 | 166765 | 151320 | 15433 | 0.0044 |
| devscene:layer-reviewer | Re-review Item 3 general layer | 1m 22s | 19 | 6866 | 40 | 1199329 | 1124571 | 74718 | 0.0192 |
| devscene:committer | Commit Item 3 | 24.3s | 6 | 2059 | 14 | 177610 | 150218 | 27378 | 0.0056 |
| devscene:statistics-plan-writer | Update branch statistics | 48.1s | 7 | 6120 | 16 | 318632 | 265932 | 52684 | 0.0111 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $21.79 |
| Cost — claude-opus-5-5 | $21.79 |
| Input tokens (uncached) | 938 |
| Total input tokens (incl. cache) | 46645666 |
| Output tokens | 194014 |
| Thinking tokens (main thread) | 3191 |
| Cache read tokens | 45022808 |
| Cache write tokens | 1621920 |
| Cache write tokens, main thread (5m / 1h) | 0 / 264389 |
| Cache hit ratio | 0.9652 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 246 | 23406097 | 2836 | 23141462 | 264389 |
| sub-agents | 692 | 23239569 | 162412 | 21881346 | 1357531 |
| remainder | 0 | 0 | 28766 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 10 |
| Sub-agents spawned / failed / killed | 21 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 148 |
| Time to first token | 1.5s |
| Rate-limit peak | seven_day 0.17 |
