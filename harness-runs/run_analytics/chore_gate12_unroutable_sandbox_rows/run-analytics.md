# Run analytics — chore_gate12_unroutable_sandbox_rows

## Whole run

| Measure | Value |
|---|---|
| Sessions | 2 (0 incomplete) |
| Span | 2h54m |
| Wall | 2h00m |
| Active | 1h58m |
| Host-suspended | 0.0s |
| Idle | 2m 04s |
| Cost | $50.89 |
| Input tokens (uncached) | 2010 |
| Total input tokens (incl. cache) | 117113546 |
| Output tokens | 502188 |
| Thinking tokens (main thread) | 4074 |
| Cache read tokens | 113757188 |
| Cache write tokens | 3354348 |
| Cache write tokens, main thread (5m / 1h) | 0 / 437631 |
| Cache hit ratio | 0.9713 |
| Requests | 957 |
| Request latency p50 / p90 / p99 / max | 2.0s / 8.3s / 26.8s / 2m 04s |
| Requests over the idle threshold | 1 |
| API retries | 0 |
| Permission denials | 23 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan with answers — 11m 19s (session 2) |
| Rate-limit peak | seven_day 0.4 |

## Session 1 — 2026-11-05T20:08:17.393Z → 2026-11-05T20:15:43.396Z

Session id: `746c42be-445a-4a68-b9a4-27d34c150d40`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 7m 26s | 7m 28s | 7m 15s | 0.0s | 0.0s | 7m 26s | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 50 | 2.4s | 23.3s | 58.5s | 58.5s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 31 | 2.7s | 27.5s | 58.5s | 58.5s | 0 |
| orchestrator | 19 | 1.5s | 4.3s | 9.2s | 9.2s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 1 | 6m 00s | 6m 00s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 20 | 2.6s | 0.1s |
| Bash | orchestrator | 14 | 9.1s | 5.4s |
| Read | autonomous-sdlc-harness:task-plan-writer | 21 | 0.9s | 0.2s |
| Read | orchestrator | 6 | 1.0s | 0.2s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-05T20:08:48.128Z | 5.4s | 481 | false | false |
| Bash | orchestrator | 2026-11-05T20:08:44.979Z | 1.5s | 79 | false | false |
| Bash | orchestrator | 2026-11-05T20:08:19.345Z | 0.4s | 79 | false | false |
| Read | orchestrator | 2026-11-05T20:08:33.710Z | 0.2s | 30457 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-05T20:09:09.917Z | 0.2s | 42029 | false | false |
| Read | orchestrator | 2026-11-05T20:08:28.753Z | 0.2s | 40575 | false | false |
| Read | orchestrator | 2026-11-05T20:08:26.956Z | 0.2s | 61931 | false | false |
| Read | autonomous-sdlc-harness:task-plan-writer | 2026-11-05T20:09:11.066Z | 0.2s | 31120 | false | false |
| Read | orchestrator | 2026-11-05T20:08:35.525Z | 0.2s | 34767 | false | false |
| Bash | orchestrator | 2026-11-05T20:08:24.056Z | 0.1s | 1540 | false | false |

#### Polling loops

None.

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 6m 00s | 31 | 32926 | 64 | 3864319 | 3669609 | 194646 | 0.8075 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $3.78 |
| Cost — claude-opus-5-5 | $3.78 |
| Input tokens (uncached) | 102 |
| Total input tokens (incl. cache) | 5720502 |
| Output tokens | 41461 |
| Thinking tokens (main thread) | 930 |
| Cache read tokens | 5413853 |
| Cache write tokens | 306547 |
| Cache write tokens, main thread (5m / 1h) | 0 / 111901 |
| Cache hit ratio | 0.9464 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 38 | 1856183 | 943 | 1744244 | 111901 |
| sub-agents | 64 | 3864319 | 32926 | 3669609 | 194646 |
| remainder | 0 | 0 | 7592 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 1 |
| Sub-agents spawned / failed / killed | 1 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 26 |
| Time to first token | 2.3s |
| Rate-limit peak | seven_day 0.38 |

## Session 2 — 2026-11-05T21:10:30.570Z → 2026-11-05T23:03:09.822Z

Session id: `080fe297-a5d0-4587-846c-b04ed938197a`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h52m | 1h52m | 1h11m | 0.0s | 2m 04s | 1h50m | none |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-11-05T21:17:42.025Z | 2m 04s | autonomous-sdlc-harness:task-plan-writer | in_flight_request |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 907 | 2.0s | 7.4s | 23.0s | 2m 04s | 1 |
| autonomous-sdlc-harness:architecture-reviewer | 27 | 2.5s | 8.7s | 18.1s | 18.1s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 52 | 3.3s | 12.6s | 18.9s | 18.9s | 0 |
| autonomous-sdlc-harness:committer | 118 | 1.6s | 3.6s | 5.8s | 5.8s | 0 |
| autonomous-sdlc-harness:layer-implementer | 251 | 2.6s | 7.5s | 26.8s | 45.7s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 55 | 3.2s | 6.9s | 10.9s | 10.9s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 43 | 3.0s | 16.7s | 25.8s | 25.8s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 7 | 2.0s | 17.1s | 17.1s | 17.1s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 53 | 2.9s | 7.2s | 19.2s | 19.2s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 69 | 3.0s | 20.3s | 2m 04s | 2m 04s | 1 |
| orchestrator | 232 | 1.4s | 1.9s | 9.8s | 12.1s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 44 | 1h10m | 11m 19s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 24 | 3.4s | 0.2s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 43 | 6.4s | 0.5s |
| Bash | autonomous-sdlc-harness:committer | 171 | 1m 40s | 4.8s |
| Bash | autonomous-sdlc-harness:layer-implementer | 194 | 6m 34s | 32.1s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 46 | 7.1s | 0.3s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 33 | 4.8s | 0.2s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 8 | 1.0s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 39 | 9.8s | 4.4s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 38 | 20.4s | 6.5s |
| Bash | orchestrator | 183 | 33m 46s | 1m 02s |
| Edit | autonomous-sdlc-harness:committer | 12 | 0.5s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 100 | 4.6s | 0.0s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 1 | 0.0s | 0.0s |
| Edit | orchestrator | 13 | 0.5s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 21 | 1.6s | 0.3s |
| Read | autonomous-sdlc-harness:branch-reviewer | 15 | 0.7s | 0.2s |
| Read | autonomous-sdlc-harness:committer | 11 | 0.4s | 0.2s |
| Read | autonomous-sdlc-harness:layer-implementer | 85 | 5.2s | 0.3s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 27 | 1.2s | 0.3s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 12 | 0.4s | 0.2s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 2 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 32 | 1.1s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 40 | 1.0s | 0.2s |
| Read | orchestrator | 19 | 15.0s | 5.1s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 5 | 0.2s | 0.0s |
| Write | autonomous-sdlc-harness:layer-implementer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:review-plan-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:skeptic-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 11 | 0.5s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-05T22:41:41.059Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-05T22:32:10.420Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-05T22:38:30.367Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-05T22:33:15.216Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-05T22:31:05.983Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-05T22:51:10.430Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-05T22:34:19.037Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-05T22:54:18.745Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-05T22:46:58.690Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-05T22:40:37.746Z | 1m 01s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/chore_gate12_unroutable_sandbox_rows_story_plan.md cli/test/gate12-sand | 3 | 1.5s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/chore_gate12_unroutable_sandbox_rows_story_plan.md harness-runs/task_pl | 5 | 2.6s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 16 | 1m 13s |
| autonomous-sdlc-harness:committer | git branch --show-current | 16 | 2.0s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 16 | 2.0s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 16 | 2.0s |
| autonomous-sdlc-harness:committer | git status --short | 36 | 5.4s |
| autonomous-sdlc-harness:committer | grep -n -i -A30 "^## .*commit" <repo_root>/.claude/context/conventions.md | 3 | 0.4s |
| autonomous-sdlc-harness:committer | grep -n -i -A40 "^## .*commit" <repo_root>/.claude/context/conventions.md | 4 | 0.5s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 16 | 2.0s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 12 | 1m 08s |
| autonomous-sdlc-harness:layer-implementer | git ls-files --others --exclude-standard | 3 | 2.4s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 15 | 1.8s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/gate12-sandbox-round-docs.test.mjs | 3 | 6.7s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/main-anchor-isolation.test.mjs | 3 | 4.8s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/no-container-home-paths.test.mjs | 5 | 12.8s |
| autonomous-sdlc-harness:review-plan-reviewer | git rev-parse --show-toplevel | 4 | 0.5s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/chore_gate12_unroutable_sandbox_rows_progress.md" -- "chore: Flow pr | 13 | 5.9s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 17 | 1m 18s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; bash scripts/run-test-suite.sh --wait task_round_1 | 30 | 29m 37s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 39 | 16.7s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan with answers | 11m 19s | 69 | 70042 | 142 | 13061112 | 12768615 | 292355 | 0.1005 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 39s | 14 | 10201 | 30 | 1106451 | 996103 | 110318 | 0.0147 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan structural review | 4m 16s | 53 | 24979 | 110 | 6469250 | 6268703 | 200437 | 0.0379 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 (cli) | 2m 24s | 19 | 11972 | 40 | 1409051 | 1309326 | 99685 | 0.0214 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 26.6s | 8 | 2192 | 18 | 216031 | 189671 | 26342 | 0.0039 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 (general) | 51.1s | 13 | 5261 | 28 | 755455 | 701680 | 53747 | 0.0076 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 26.7s | 8 | 2336 | 18 | 241505 | 222715 | 18772 | 0.004 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 (general) | 2m 17s | 19 | 15005 | 40 | 1663646 | 1571615 | 91991 | 0.0203 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 30.0s | 10 | 2532 | 22 | 273749 | 257952 | 15775 | 0.0044 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 4 (general) | 2m 02s | 20 | 12040 | 42 | 1366104 | 1299606 | 66456 | 0.0181 |
| autonomous-sdlc-harness:committer | Commit Task 4 | 26.5s | 6 | 2005 | 14 | 173999 | 160157 | 13828 | 0.0039 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 5 (general) | 3m 43s | 24 | 23902 | 50 | 2491280 | 2374425 | 116805 | 0.033 |
| autonomous-sdlc-harness:committer | Commit Task 5 | 26.1s | 8 | 2256 | 18 | 216354 | 202736 | 13600 | 0.0039 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 6 (cli) | 1m 20s | 10 | 7217 | 22 | 459090 | 419386 | 39682 | 0.0119 |
| autonomous-sdlc-harness:committer | Commit Task 6 | 23.1s | 6 | 1992 | 14 | 193512 | 174928 | 18570 | 0.0034 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 7 (cli) | 4m 48s | 22 | 23002 | 46 | 1882007 | 1791980 | 89981 | 0.0427 |
| autonomous-sdlc-harness:committer | Commit Task 7 | 25.5s | 8 | 2121 | 18 | 231188 | 202574 | 28596 | 0.0038 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 8 (general) | 2m 37s | 30 | 15022 | 62 | 2808941 | 2704178 | 104701 | 0.0233 |
| autonomous-sdlc-harness:committer | Commit Task 8 | 25.5s | 7 | 2325 | 16 | 197988 | 183423 | 14549 | 0.0038 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 9 (general) | 2m 52s | 30 | 19822 | 62 | 2590261 | 2492671 | 97528 | 0.0255 |
| autonomous-sdlc-harness:committer | Commit Task 9 | 24.2s | 8 | 2076 | 18 | 228179 | 212923 | 15238 | 0.0036 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 10 (cli) | 44.5s | 13 | 3923 | 28 | 515914 | 485465 | 30421 | 0.0066 |
| autonomous-sdlc-harness:committer | Commit Task 10 | 23.8s | 7 | 2039 | 16 | 192348 | 178803 | 13529 | 0.0035 |
| autonomous-sdlc-harness:architecture-reviewer | A2 branch architecture review | 45.2s | 13 | 4303 | 28 | 1019662 | 885550 | 134084 | 0.0067 |
| autonomous-sdlc-harness:branch-reviewer | B.1 branch code review | 5m 23s | 48 | 32159 | 98 | 6532368 | 6341528 | 190742 | 0.0479 |
| autonomous-sdlc-harness:review-plan-reviewer | B.2 meta-review of code review | 1m 26s | 17 | 9007 | 36 | 1197168 | 1103019 | 94113 | 0.0128 |
| autonomous-sdlc-harness:branch-reviewer | Adjust code review per meta | 22.8s | 4 | 2824 | 10 | 130120 | 115830 | 14280 | 0.0034 |
| autonomous-sdlc-harness:review-plan-reviewer | B.2 meta-review round 2 | 1m 13s | 14 | 7519 | 30 | 754448 | 690588 | 63830 | 0.0109 |
| autonomous-sdlc-harness:committer | B.3 commit code review | 15.6s | 4 | 1082 | 10 | 112638 | 89076 | 23552 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 2 | 1m 21s | 11 | 4916 | 24 | 445122 | 400896 | 44202 | 0.012 |
| autonomous-sdlc-harness:committer | Commit Finding 2 fix | 27.9s | 8 | 2327 | 18 | 267908 | 245580 | 22310 | 0.0041 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 3 | 1m 03s | 9 | 3158 | 20 | 316810 | 294519 | 22271 | 0.0094 |
| autonomous-sdlc-harness:committer | Commit Finding 3 fix | 25.1s | 7 | 2123 | 16 | 261694 | 234468 | 27210 | 0.0037 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 1 (cli layer) | 1m 30s | 13 | 6483 | 28 | 548607 | 510618 | 37961 | 0.0134 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 1 (general layer) | 1m 08s | 7 | 4409 | 16 | 327031 | 287139 | 39876 | 0.0102 |
| autonomous-sdlc-harness:committer | Commit Finding 1 fix | 24.4s | 7 | 2237 | 16 | 207150 | 190930 | 16204 | 0.0036 |
| autonomous-sdlc-harness:skeptic-reviewer | C2.1 skeptic review | 4m 38s | 38 | 28584 | 78 | 3658936 | 3504662 | 154196 | 0.0413 |
| autonomous-sdlc-harness:review-plan-reviewer | C2.2 skeptic meta-review | 54.0s | 14 | 5628 | 30 | 646667 | 585356 | 61281 | 0.008 |
| autonomous-sdlc-harness:skeptic-reviewer | Adjust skeptic review per meta | 31.0s | 5 | 4135 | 12 | 159701 | 141819 | 17870 | 0.0046 |
| autonomous-sdlc-harness:review-plan-reviewer | C2.2 skeptic meta round 2 | 45.5s | 10 | 4774 | 22 | 533595 | 467406 | 66167 | 0.0067 |
| autonomous-sdlc-harness:committer | C2.3 commit skeptic review | 22.2s | 7 | 1737 | 16 | 185544 | 160877 | 24651 | 0.0033 |
| autonomous-sdlc-harness:layer-implementer | Fix skeptic Finding 1 | 46.4s | 11 | 4541 | 24 | 522451 | 471506 | 50921 | 0.0069 |
| autonomous-sdlc-harness:committer | Commit skeptic Finding 1 fix | 27.6s | 9 | 2348 | 20 | 236197 | 223110 | 13067 | 0.0041 |
| autonomous-sdlc-harness:statistics-plan-writer | D.1 branch statistics | 33.1s | 7 | 4182 | 16 | 200441 | 170048 | 30377 | 0.0049 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $47.11 |
| Cost — claude-opus-5-5 | $47.11 |
| Input tokens (uncached) | 1908 |
| Total input tokens (incl. cache) | 111393044 |
| Output tokens | 460727 |
| Thinking tokens (main thread) | 3144 |
| Cache read tokens | 108343335 |
| Cache write tokens | 3047801 |
| Cache write tokens, main thread (5m / 1h) | 0 / 325730 |
| Cache hit ratio | 0.9726 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 466 | 54385371 | 6390 | 54059175 | 325730 |
| sub-agents | 1442 | 57007673 | 402738 | 54284160 | 2722071 |
| remainder | 0 | 0 | 51599 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 22 |
| Sub-agents spawned / failed / killed | 44 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 264 |
| Time to first token | 1.1s |
| Rate-limit peak | seven_day 0.4 |
