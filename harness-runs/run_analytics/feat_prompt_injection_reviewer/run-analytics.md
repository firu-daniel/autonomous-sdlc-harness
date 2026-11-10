# Run analytics — feat_prompt_injection_reviewer

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 48m 05s |
| Wall | 48m 05s |
| Active | 48m 05s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $23.37 |
| Input tokens (uncached) | 610 |
| Total input tokens (incl. cache) | 49253052 |
| Output tokens | 304029 |
| Thinking tokens (main thread) | 1146 |
| Cache read tokens | 47793289 |
| Cache write tokens | 1459153 |
| Cache write tokens, main thread (5m / 1h) | 0 / 145723 |
| Cache hit ratio | 0.9704 |
| Requests | 295 |
| Request latency p50 / p90 / p99 / max | 3.4s / 19.8s / 1m 01s / 1m 37s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 4 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write the task plan — 20m 20s (session 1) |
| Rate-limit peak | seven_day 0.01 |

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
