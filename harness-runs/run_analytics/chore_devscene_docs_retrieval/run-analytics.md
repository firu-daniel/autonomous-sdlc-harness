# Run analytics — chore_devscene_docs_retrieval

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 46m 36s |
| Wall | 46m 36s |
| Active | 46m 36s |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $22.87 |
| Input tokens (uncached) | 804 |
| Total input tokens (incl. cache) | 41348044 |
| Output tokens | 282855 |
| Thinking tokens (main thread) | 3523 |
| Cache read tokens | 39624765 |
| Cache write tokens | 1722475 |
| Cache write tokens, main thread (5m / 1h) | 0 / 222786 |
| Cache hit ratio | 0.9583 |
| Requests | 382 |
| Request latency p50 / p90 / p99 / max | 2.3s / 9.6s / 41.8s / 1m 23s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 17 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | devscene:task-plan-writer — Write the task plan — 11m 45s (session 1) |
| Rate-limit peak | seven_day 0.3 |

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

## Session 1 — 2026-11-12T14:07:42.587Z → 2026-11-12T14:54:19.155Z

Session id: `555234d1-645b-4f57-8d84-365a44291780`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 46m 36s | 46m 37s | 41m 30s | 0.0s | 0.0s | 46m 36s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 382 | 2.3s | 9.6s | 41.8s | 1m 23s | 0 |
| devscene:architecture-reviewer | 28 | 2.0s | 10.4s | 16.9s | 16.9s | 0 |
| devscene:committer | 31 | 1.7s | 4.2s | 6.7s | 6.7s | 0 |
| devscene:layer-implementer | 99 | 2.8s | 7.9s | 36.3s | 36.3s | 0 |
| devscene:prompt-injection-reviewer | 1 | 1.4s | 1.4s | 1.4s | 1.4s | 0 |
| devscene:task-plan-reviewer | 69 | 3.3s | 12.1s | 24.8s | 24.8s | 0 |
| devscene:task-plan-writer | 55 | 5.0s | 22.5s | 1m 23s | 1m 23s | 0 |
| orchestrator | 99 | 1.4s | 2.1s | 19.2s | 19.2s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 19 | 41m 57s | 11m 45s |
| Bash | devscene:architecture-reviewer | 15 | 3.0s | 0.5s |
| Bash | devscene:committer | 42 | 26.8s | 5.8s |
| Bash | devscene:layer-implementer | 98 | 4m 43s | 1m 39s |
| Bash | devscene:task-plan-reviewer | 44 | 8.3s | 0.5s |
| Bash | devscene:task-plan-writer | 43 | 7.7s | 0.4s |
| Bash | orchestrator | 73 | 29.7s | 4.7s |
| Edit | devscene:committer | 4 | 0.1s | 0.0s |
| Edit | devscene:layer-implementer | 70 | 2.9s | 0.0s |
| Edit | devscene:task-plan-writer | 8 | 0.2s | 0.0s |
| Edit | orchestrator | 2 | 0.0s | 0.0s |
| Read | devscene:architecture-reviewer | 57 | 2.5s | 0.3s |
| Read | devscene:committer | 6 | 0.1s | 0.0s |
| Read | devscene:layer-implementer | 70 | 1.6s | 0.3s |
| Read | devscene:prompt-injection-reviewer | 2 | 0.0s | 0.0s |
| Read | devscene:task-plan-reviewer | 78 | 2.7s | 0.3s |
| Read | devscene:task-plan-writer | 27 | 0.8s | 0.2s |
| Read | orchestrator | 11 | 2.2s | 0.5s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | devscene:layer-implementer | 17 | 0.6s | 0.0s |
| Write | devscene:task-plan-reviewer | 2 | 0.0s | 0.0s |
| Write | devscene:task-plan-writer | 12 | 0.3s | 0.0s |
| Write | orchestrator | 3 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | devscene:layer-implementer | 2026-11-12T14:40:29.866Z | 1m 39s | 2247 | false | false |
| Bash | devscene:layer-implementer | 2026-11-12T14:39:40.056Z | 45.1s | 10961 | false | false |
| Bash | devscene:layer-implementer | 2026-11-12T14:36:16.018Z | 34.1s | 18427 | false | false |
| Bash | devscene:layer-implementer | 2026-11-12T14:39:39.454Z | 31.6s | 2184 | false | false |
| Bash | devscene:layer-implementer | 2026-11-12T14:42:14.363Z | 17.9s | 4012 | false | false |
| Bash | devscene:layer-implementer | 2026-11-12T14:37:01.643Z | 8.6s | 508 | false | false |
| Bash | devscene:layer-implementer | 2026-11-12T14:37:00.902Z | 7.4s | 916 | false | false |
| Bash | devscene:committer | 2026-11-12T14:45:18.479Z | 5.8s | 415 | false | false |
| Bash | devscene:committer | 2026-11-12T14:43:25.974Z | 5.0s | 415 | false | false |
| Bash | devscene:committer | 2026-11-12T14:38:05.082Z | 4.9s | 415 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| devscene:architecture-reviewer | git grep -lE 'harness[-_]docs\|HARNESS_(DOCS_)?RETRIEVAL\|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL\|harness:harness\|POSTGRES_(USER\|PASSWORD): harness\|-U "?harness\|postgre | 3 | 1.4s |
| devscene:architecture-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| devscene:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 4 | 20.4s |
| devscene:committer | git branch --show-current | 4 | 0.4s |
| devscene:committer | git log -1 --oneline | 4 | 0.4s |
| devscene:committer | git rev-parse --show-toplevel | 4 | 0.4s |
| devscene:committer | git status --short | 9 | 1.2s |
| devscene:committer | printenv DEVSCENE_MAIN_REPO | 4 | 0.3s |
| devscene:layer-implementer | bash scripts/typecheck.sh | 5 | 13.5s |
| devscene:layer-implementer | git rev-parse --show-toplevel | 5 | 0.5s |
| devscene:task-plan-reviewer | git -C <repo_root> grep -lE 'harness[-_]docs\|HARNESS_(DOCS_)?RETRIEVAL\|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL\|harness:harness\|POSTGRES_(USER\|PASSWORD): harness\|-U "? | 3 | 0.9s |
| devscene:task-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| devscene:task-plan-writer | git grep -lE 'harness[-_]docs\|HARNESS_(DOCS_)?RETRIEVAL\|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL\|harness:harness\|POSTGRES_(USER\|PASSWORD): harness\|-U "?harness\|postgre | 3 | 0.5s |
| devscene:task-plan-writer | git rev-parse --show-toplevel | 3 | 0.3s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 4 | 18.7s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_devscene_docs_retrieval --outcome PASS | 4 | 0.9s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch chore_devscene_docs_retrieval --outcome returned | 3 | 0.6s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 18 | 2.4s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| devscene:prompt-injection-reviewer | Screen task prompt | 4.9s | 1 | 392 | 4 | 28515 | 10425 | 18086 | 0.0018 |
| devscene:task-plan-writer | Write the task plan | 11m 45s | 44 | 80883 | 90 | 6337107 | 6114728 | 222289 | 0.2523 |
| devscene:architecture-reviewer | Architecture review of plan | 58.8s | 8 | 6322 | 18 | 891422 | 749168 | 142236 | 0.0211 |
| devscene:task-plan-reviewer | Structural plan review | 2m 42s | 25 | 16472 | 52 | 2924580 | 2768685 | 155843 | 0.058 |
| devscene:task-plan-writer | Revise task plan | 37.2s | 6 | 4082 | 14 | 244265 | 214817 | 29434 | 0.0133 |
| devscene:architecture-reviewer | Architecture review of plan | 49.9s | 9 | 5070 | 20 | 803765 | 704295 | 99450 | 0.0179 |
| devscene:task-plan-reviewer | Structural plan review | 2m 24s | 22 | 15447 | 46 | 2371279 | 2230103 | 141130 | 0.0518 |
| devscene:task-plan-writer | Revise task plan | 34.7s | 5 | 4055 | 12 | 200699 | 172111 | 28576 | 0.0124 |
| devscene:architecture-reviewer | Architecture review of plan | 1m 08s | 11 | 7065 | 24 | 890472 | 802465 | 87983 | 0.0243 |
| devscene:task-plan-reviewer | Structural plan review | 1m 31s | 22 | 9061 | 46 | 2189395 | 2064584 | 124765 | 0.0326 |
| devscene:layer-implementer | Implement Task 1 (cli) | 1m 10s | 8 | 8277 | 20 | 405392 | 338850 | 66522 | 0.0252 |
| devscene:committer | Commit Task 1 | 30.5s | 9 | 2379 | 20 | 251085 | 223170 | 27895 | 0.0109 |
| devscene:layer-implementer | Implement Task 2 (cli) | 2m 20s | 19 | 9681 | 40 | 908630 | 862622 | 45968 | 0.0502 |
| devscene:committer | Commit Task 2 | 27.8s | 7 | 2290 | 16 | 206223 | 189636 | 16571 | 0.0099 |
| devscene:layer-implementer | Implement Task 3 (cli) | 4m 41s | 19 | 12225 | 40 | 1060234 | 1000999 | 59195 | 0.1006 |
| devscene:committer | Commit Task 3 | 26.8s | 7 | 2123 | 16 | 207778 | 191934 | 15828 | 0.0096 |
| devscene:layer-implementer | Implement Task 4 (plugin) | 1m 07s | 10 | 7186 | 22 | 460797 | 421904 | 38871 | 0.024 |
| devscene:committer | Commit Task 4 | 31.3s | 8 | 2498 | 18 | 225453 | 210404 | 15031 | 0.0112 |
| devscene:layer-implementer | Implement Task 5 (general) | 8m 03s | 43 | 62535 | 88 | 5553860 | 5389756 | 164016 | 0.1729 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $22.87 |
| Cost — claude-opus-5-5 | $22.87 |
| Input tokens (uncached) | 804 |
| Total input tokens (incl. cache) | 41348044 |
| Output tokens | 282855 |
| Thinking tokens (main thread) | 3523 |
| Cache read tokens | 39624765 |
| Cache write tokens | 1722475 |
| Cache write tokens, main thread (5m / 1h) | 0 / 222786 |
| Cache hit ratio | 0.9583 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 198 | 15187093 | 2381 | 14964109 | 222786 |
| sub-agents | 606 | 26160951 | 258043 | 24660656 | 1499689 |
| remainder | 0 | 0 | 22431 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 17 |
| Sub-agents spawned / failed / killed | 19 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 111 |
| Time to first token | 1.3s |
| Rate-limit peak | seven_day 0.3 |
