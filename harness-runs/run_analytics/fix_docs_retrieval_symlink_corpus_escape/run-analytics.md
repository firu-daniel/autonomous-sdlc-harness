# Run analytics — fix_docs_retrieval_symlink_corpus_escape

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 2h00m |
| Wall | 2h00m |
| Active | 2h00m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $27.57 |
| Input tokens (uncached) | 1088 |
| Total input tokens (incl. cache) | 69783375 |
| Output tokens | 225912 |
| Thinking tokens (main thread) | 2793 |
| Cache read tokens | 68082707 |
| Cache write tokens | 1699580 |
| Cache write tokens, main thread (5m / 1h) | 0 / 309438 |
| Cache hit ratio | 0.9756 |
| Requests | 518 |
| Request latency p50 / p90 / p99 / max | 2.9s / 5.5s / 23.5s / 55.8s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 7 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 5m 11s (session 1) |
| Rate-limit peak | five_hour 0.12, seven_day 0.23 |

## Session 1 — 2026-10-29T08:17:57.178Z → 2026-10-29T10:17:59.082Z

Session id: `7bafb403-3483-44d8-a6e3-afe254954284`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 2h00m | 2h00m | 42m 30s | 0.0s | 0.0s | 2h00m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 518 | 2.9s | 5.5s | 23.5s | 55.8s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 20 | 2.7s | 5.9s | 9.4s | 9.4s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 25 | 3.9s | 17.2s | 23.5s | 23.5s | 0 |
| autonomous-sdlc-harness:committer | 66 | 2.3s | 3.8s | 7.0s | 7.0s | 0 |
| autonomous-sdlc-harness:layer-implementer | 93 | 2.9s | 8.3s | 21.8s | 21.8s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 9 | 3.4s | 4.9s | 4.9s | 4.9s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 14 | 3.2s | 15.6s | 15.9s | 15.9s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 6 | 2.2s | 16.6s | 16.6s | 16.6s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 20 | 3.0s | 7.2s | 40.6s | 40.6s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 29 | 4.3s | 27.8s | 55.8s | 55.8s | 0 |
| autonomous-sdlc-harness:test-fix-plan-writer | 20 | 2.9s | 6.1s | 16.2s | 16.2s | 0 |
| orchestrator | 216 | 2.9s | 3.5s | 5.9s | 8.7s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 26 | 34m 38s | 5m 11s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 18 | 2.6s | 0.1s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 22 | 3.8s | 0.4s |
| Bash | autonomous-sdlc-harness:committer | 97 | 55.0s | 4.6s |
| Bash | autonomous-sdlc-harness:layer-implementer | 79 | 6m 13s | 1m 50s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 8 | 1.3s | 0.1s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 14 | 2.2s | 0.2s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 8 | 0.9s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 14 | 2.2s | 0.3s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 20 | 3.1s | 0.3s |
| Bash | autonomous-sdlc-harness:test-fix-plan-writer | 14 | 2.5s | 0.3s |
| Bash | orchestrator | 186 | 1h12m | 1m 01s |
| Edit | autonomous-sdlc-harness:committer | 7 | 0.1s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 16 | 0.3s | 0.0s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 1 | 0.0s | 0.0s |
| Edit | autonomous-sdlc-harness:test-fix-plan-writer | 1 | 0.0s | 0.0s |
| Edit | orchestrator | 13 | 13.6s | 3.4s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 19 | 1.7s | 0.3s |
| Read | autonomous-sdlc-harness:branch-reviewer | 7 | 0.6s | 0.3s |
| Read | autonomous-sdlc-harness:committer | 9 | 0.1s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 33 | 2.3s | 0.3s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 5 | 0.3s | 0.2s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 1 | 0.3s | 0.3s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 20 | 0.5s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 15 | 0.6s | 0.2s |
| Read | autonomous-sdlc-harness:test-fix-plan-writer | 11 | 0.1s | 0.0s |
| Read | orchestrator | 12 | 2.6s | 0.3s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:layer-implementer | 3 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 5 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:test-fix-plan-writer | 3 | 0.0s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-10-29T09:32:53.706Z | 1m 50s | 9376 | true | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-10-29T09:35:16.203Z | 1m 50s | 748 | false | false |
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-10-29T09:35:15.213Z | 1m 49s | 8260 | false | false |
| Bash | orchestrator | 2026-10-29T09:47:51.287Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-29T08:54:04.679Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-29T08:58:22.345Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-29T09:52:09.475Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-29T09:45:42.633Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-29T09:54:18.572Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-29T09:00:32.627Z | 1m 01s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/test_fix_plans/fix_docs_retrieval_symlink_corpus_escape_task_round_1.md harness-run | 3 | 1.5s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 9 | 40.1s |
| autonomous-sdlc-harness:committer | git branch --show-current | 9 | 1.1s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 9 | 1.1s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 9 | 1.1s |
| autonomous-sdlc-harness:committer | git status --short | 20 | 2.8s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 9 | 1.0s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 6 | 15.7s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 7 | 0.9s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/fix_docs_retrieval_symlink_corpus_escape_progress.md" -- "chore: Flo | 13 | 6.1s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 17 | 1m 16s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; bash scripts/run-test-suite.sh --wait task_round_1 | 36 | 35m 25s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; bash scripts/run-test-suite.sh --wait task_round_2 | 36 | 35m 17s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 23 | 10.3s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 5m 11s | 29 | 31617 | 60 | 3258306 | 3099230 | 159016 | 0.0432 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 40.1s | 5 | 3946 | 12 | 299388 | 222353 | 77023 | 0.0056 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan review | 2m 21s | 20 | 13678 | 42 | 1613252 | 1505502 | 107708 | 0.0196 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 (cli) | 1m 25s | 10 | 8201 | 22 | 444229 | 396332 | 47875 | 0.0118 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 33.3s | 8 | 2386 | 18 | 216616 | 190089 | 26509 | 0.0046 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 (general) | 2m 38s | 24 | 14517 | 50 | 1708066 | 1638020 | 69996 | 0.022 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 38.7s | 10 | 2744 | 22 | 280445 | 264346 | 16077 | 0.0054 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 (general) | 1m 54s | 19 | 10732 | 40 | 1213687 | 1154606 | 59041 | 0.0159 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 31.6s | 8 | 2316 | 18 | 217198 | 203369 | 13811 | 0.0044 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 4 (general) | 28.7s | 6 | 2296 | 14 | 263803 | 232588 | 31201 | 0.004 |
| autonomous-sdlc-harness:committer | Commit Task 4 | 30.9s | 8 | 2160 | 18 | 216677 | 202905 | 13754 | 0.0043 |
| autonomous-sdlc-harness:architecture-reviewer | Branch architecture review | 35.0s | 8 | 2858 | 18 | 536094 | 451754 | 84322 | 0.0049 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch code review | 3m 15s | 25 | 17701 | 52 | 2258013 | 2134911 | 123050 | 0.0271 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 45.7s | 9 | 4100 | 20 | 365561 | 301859 | 63682 | 0.0063 |
| autonomous-sdlc-harness:committer | Commit code review file | 23.1s | 5 | 1425 | 12 | 146073 | 120056 | 26005 | 0.0032 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 1 | 36.2s | 9 | 2883 | 20 | 497833 | 433432 | 64381 | 0.005 |
| autonomous-sdlc-harness:committer | Commit code-review fix 1 | 32.5s | 8 | 2331 | 18 | 285095 | 262194 | 22883 | 0.0045 |
| autonomous-sdlc-harness:skeptic-reviewer | Adversarial skeptic review | 1m 27s | 14 | 8221 | 30 | 597221 | 541216 | 55975 | 0.0122 |
| autonomous-sdlc-harness:test-fix-plan-writer | Write test fix plan round 1 | 1m 57s | 20 | 11739 | 42 | 811240 | 752826 | 58372 | 0.0163 |
| autonomous-sdlc-harness:architecture-reviewer | Arch gate on test fix plan | 37.6s | 7 | 3479 | 16 | 293537 | 230772 | 62749 | 0.0052 |
| autonomous-sdlc-harness:committer | Commit test fix plan round 1 | 22.6s | 5 | 1540 | 12 | 137672 | 113457 | 24203 | 0.0031 |
| autonomous-sdlc-harness:layer-implementer | Fix test-fix Finding 1 | 45.1s | 11 | 3444 | 24 | 623187 | 562666 | 60497 | 0.0063 |
| autonomous-sdlc-harness:committer | Commit test-fix item 1 | 30.8s | 7 | 2254 | 16 | 254447 | 230742 | 23689 | 0.0043 |
| autonomous-sdlc-harness:layer-implementer | Fix test-fix Finding 2 | 4m 50s | 14 | 6587 | 30 | 646932 | 605595 | 41307 | 0.0404 |
| autonomous-sdlc-harness:committer | Commit test-fix item 2 | 29.6s | 7 | 2263 | 16 | 216241 | 186275 | 29950 | 0.0041 |
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 34.4s | 6 | 3869 | 14 | 161372 | 134292 | 27066 | 0.0048 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $27.57 |
| Cost — claude-opus-5-5 | $27.57 |
| Input tokens (uncached) | 1088 |
| Total input tokens (incl. cache) | 69783375 |
| Output tokens | 225912 |
| Thinking tokens (main thread) | 2793 |
| Cache read tokens | 68082707 |
| Cache write tokens | 1699580 |
| Cache write tokens, main thread (5m / 1h) | 0 / 309438 |
| Cache hit ratio | 0.9756 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 432 | 52221190 | 5271 | 51911320 | 309438 |
| sub-agents | 656 | 17562185 | 169287 | 16171387 | 1390142 |
| remainder | 0 | 0 | 51354 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 7 |
| Sub-agents spawned / failed / killed | 26 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 242 |
| Time to first token | 3.0s |
| Rate-limit peak | five_hour 0.12, seven_day 0.23 |
