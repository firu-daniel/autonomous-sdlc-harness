# Run analytics — chore_rename_to_devscene

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 42m 26s |
| Wall | 42m 26s |
| Active | 39m 30s |
| Host-suspended | 0.0s |
| Idle | 2m 56s |
| Cost | $24.33 |
| Input tokens (uncached) | 724 |
| Total input tokens (incl. cache) | 47644372 |
| Output tokens | 279797 |
| Thinking tokens (main thread) | 1267 |
| Cache read tokens | 45812922 |
| Cache write tokens | 1830726 |
| Cache write tokens, main thread (5m / 1h) | 0 / 136968 |
| Cache hit ratio | 0.9616 |
| Requests | 346 |
| Request latency p50 / p90 / p99 / max | 2.5s / 14.4s / 35.8s / 2m 56s |
| Requests over the idle threshold | 1 |
| API retries | 0 |
| Permission denials | 10 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 18m 33s (session 1) |
| Rate-limit peak | seven_day 0.09 |

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

## Session 1 — 2026-11-11T06:47:11.025Z → 2026-11-11T07:29:37.547Z

Session id: `1a1ac0c2-ee17-4d35-8253-360f3a878c74`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 42m 26s | 42m 28s | 41m 39s | 0.0s | 2m 56s | 39m 30s | none |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-11-11T06:56:17.354Z | 2m 56s | autonomous-sdlc-harness:task-plan-writer | in_flight_request |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 346 | 2.5s | 14.4s | 35.8s | 2m 56s | 1 |
| autonomous-sdlc-harness:architecture-reviewer | 82 | 2.1s | 16.9s | 29.9s | 29.9s | 0 |
| autonomous-sdlc-harness:prompt-injection-reviewer | 1 | 1.9s | 1.9s | 1.9s | 1.9s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 80 | 3.3s | 9.6s | 27.8s | 27.8s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 122 | 4.3s | 18.1s | 1m 16s | 2m 56s | 1 |
| orchestrator | 61 | 1.3s | 1.8s | 8.8s | 8.8s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 13 | 39m 41s | 18m 33s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 46 | 6.2s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 49 | 7.2s | 0.3s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 76 | 19.9s | 7.6s |
| Bash | orchestrator | 50 | 12.3s | 4.6s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 32 | 1.1s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 183 | 5.2s | 0.2s |
| Read | autonomous-sdlc-harness:prompt-injection-reviewer | 2 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 95 | 2.8s | 0.5s |
| Read | autonomous-sdlc-harness:task-plan-writer | 35 | 1.6s | 0.2s |
| Read | orchestrator | 6 | 1.2s | 0.4s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 2 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 32 | 1.0s | 0.0s |
| Write | orchestrator | 3 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-11T06:50:30.461Z | 7.6s | 16326 | false | false |
| Bash | orchestrator | 2026-11-11T06:47:57.312Z | 4.6s | 445 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-11T06:52:01.273Z | 0.8s | 7221 | false | false |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-11T07:08:42.477Z | 0.5s | 40017 | false | false |
| Bash | orchestrator | 2026-11-11T06:47:55.208Z | 0.4s | 67 | false | false |
| Read | orchestrator | 2026-11-11T06:47:41.998Z | 0.4s | 30457 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-11T06:50:06.636Z | 0.3s | 18213 | false | false |
| Bash | orchestrator | 2026-11-11T07:29:05.953Z | 0.3s | 1511 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-writer | 2026-11-11T06:49:18.781Z | 0.3s | 5448 | false | false |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 2026-11-11T07:10:22.614Z | 0.3s | 3671 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.6s |
| autonomous-sdlc-harness:architecture-reviewer | mkdir -p <repo_root>/harness-runs/architecture_reviews/chore_rename_to_devscene | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.6s |
| autonomous-sdlc-harness:task-plan-writer | ls -la <repo_root>/harness-runs/task_plans/chore_rename_to_devscene/ <repo_root>/harness-runs/architecture_reviews/chore_rename_to_devscene/ <repo_root>/harness | 3 | 0.3s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_rename_to_devscene --outcome FAIL --findings harness-runs/architecture_reviews/chore_re | 3 | 0.5s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_rename_to_devscene --outcome returned | 5 | 1.0s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 12 | 1.6s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:prompt-injection-reviewer | Screen task prompt | 4.2s | 1 | 338 | 4 | 28442 | 10548 | 17890 | 0.0017 |
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 18m 33s | 83 | 125497 | 170 | 17720850 | 17385508 | 335172 | 0.4374 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 36s | 15 | 10642 | 32 | 1645462 | 1489165 | 156265 | 0.0378 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan review | 3m 54s | 40 | 24645 | 84 | 5879858 | 5682916 | 196858 | 0.092 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 1m 50s | 12 | 14034 | 26 | 699516 | 629392 | 70098 | 0.0436 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 2m 18s | 17 | 15018 | 36 | 1847301 | 1693998 | 153267 | 0.0545 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch) | 41.3s | 5 | 5067 | 12 | 218359 | 181295 | 37052 | 0.0162 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 2m 16s | 20 | 15186 | 42 | 2237694 | 2088438 | 149214 | 0.0534 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch r1) | 1m 26s | 15 | 9637 | 32 | 665039 | 622400 | 42607 | 0.034 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 45s | 19 | 11739 | 40 | 1922741 | 1783363 | 139338 | 0.0412 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan (arch r2) | 32.5s | 7 | 3630 | 16 | 253284 | 227974 | 25294 | 0.0128 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 00s | 11 | 6799 | 24 | 956860 | 803236 | 153600 | 0.0236 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan re-review | 3m 41s | 40 | 21668 | 84 | 6470614 | 6253427 | 217103 | 0.0869 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $24.33 |
| Cost — claude-opus-5-5 | $24.33 |
| Input tokens (uncached) | 724 |
| Total input tokens (incl. cache) | 47644372 |
| Output tokens | 279797 |
| Thinking tokens (main thread) | 1267 |
| Cache read tokens | 45812922 |
| Cache write tokens | 1830726 |
| Cache write tokens, main thread (5m / 1h) | 0 / 136968 |
| Cache hit ratio | 0.9616 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 122 | 7098352 | 1260 | 6961262 | 136968 |
| sub-agents | 602 | 40546020 | 263900 | 38851660 | 1693758 |
| remainder | 0 | 0 | 14637 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 10 |
| Sub-agents spawned / failed / killed | 13 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 75 |
| Time to first token | 1.5s |
| Rate-limit peak | seven_day 0.09 |
