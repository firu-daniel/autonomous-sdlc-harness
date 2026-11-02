# Run analytics — fix_sandbox_probe_linux_recipe_gaps

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 1h20m |
| Wall | 1h20m |
| Active | 1h20m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $29.60 |
| Input tokens (uncached) | 1072 |
| Total input tokens (incl. cache) | 66430639 |
| Output tokens | 259501 |
| Thinking tokens (main thread) | 2949 |
| Cache read tokens | 64302323 |
| Cache write tokens | 2127244 |
| Cache write tokens, main thread (5m / 1h) | 0 / 304043 |
| Cache hit ratio | 0.968 |
| Requests | 509 |
| Request latency p50 / p90 / p99 / max | 1.8s / 5.9s / 27.8s / 1m 39s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 8 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 7m 13s (session 1) |
| Rate-limit peak | seven_day 0.59 |

## Session 1 — 2026-11-02T08:23:03.668Z → 2026-11-02T09:43:52.519Z

Session id: `698ec757-0b5a-4b14-b4cc-225c9d7055b0`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h20m | 1h20m | 40m 08s | 0.0s | 0.0s | 1h20m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 509 | 1.8s | 5.9s | 27.8s | 1m 39s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 33 | 2.0s | 5.5s | 9.2s | 9.2s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 23 | 2.9s | 20.7s | 48.1s | 48.1s | 0 |
| autonomous-sdlc-harness:committer | 54 | 1.7s | 3.6s | 8.0s | 8.0s | 0 |
| autonomous-sdlc-harness:layer-implementer | 57 | 2.6s | 5.5s | 24.2s | 24.2s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 20 | 2.2s | 4.0s | 16.3s | 16.3s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 19 | 3.5s | 16.6s | 20.2s | 20.2s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 6 | 2.1s | 17.6s | 17.6s | 17.6s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 54 | 3.1s | 13.7s | 59.8s | 59.8s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 40 | 3.0s | 19.1s | 1m 39s | 1m 39s | 0 |
| orchestrator | 203 | 1.5s | 2.1s | 4.6s | 13.0s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 27 | 33m 43s | 7m 13s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 26 | 3.6s | 0.1s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 19 | 2.6s | 0.1s |
| Bash | autonomous-sdlc-harness:committer | 75 | 45.7s | 5.2s |
| Bash | autonomous-sdlc-harness:layer-implementer | 46 | 30.2s | 4.4s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 17 | 2.4s | 0.1s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 15 | 3.8s | 1.6s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 6 | 0.7s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 40 | 5.9s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 24 | 4.1s | 0.5s |
| Bash | orchestrator | 198 | 39m 24s | 1m 01s |
| Edit | autonomous-sdlc-harness:committer | 5 | 0.2s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 19 | 0.7s | 0.0s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 10 | 0.4s | 0.0s |
| Edit | orchestrator | 13 | 0.6s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 35 | 3.0s | 0.4s |
| Read | autonomous-sdlc-harness:branch-reviewer | 11 | 0.7s | 0.3s |
| Read | autonomous-sdlc-harness:committer | 6 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 17 | 1.1s | 0.3s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 16 | 1.3s | 0.4s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 6 | 0.3s | 0.2s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 3 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 48 | 2.3s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 26 | 1.8s | 0.2s |
| Read | orchestrator | 15 | 6.6s | 4.1s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:layer-implementer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:skeptic-reviewer | 2 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 4 | 0.2s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-02T09:17:26.278Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-02T09:05:49.373Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-02T09:13:12.348Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-02T09:22:42.350Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-02T09:18:30.459Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-02T09:10:02.571Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-02T09:16:22.824Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-02T09:14:16.494Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-02T09:37:19.855Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-02T09:11:06.600Z | 1m 00s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 4 | 0.5s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 7 | 34.2s |
| autonomous-sdlc-harness:committer | git branch --show-current | 7 | 0.8s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 6 | 0.7s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 7 | 0.8s |
| autonomous-sdlc-harness:committer | git status --short | 15 | 2.1s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 7 | 0.8s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 3 | 7.3s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 5 | 0.6s |
| autonomous-sdlc-harness:task-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 3 | 0.3s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/fix_sandbox_probe_linux_recipe_gaps_progress.md" -- "chore: Flow pro | 13 | 5.8s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 17 | 1m 23s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_sandbox_probe_linux_recipe_gaps --outcome PASS | 4 | 1.0s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_sandbox_probe_linux_recipe_gaps --outcome returned | 3 | 0.6s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_1 | 37 | 36m 26s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 22 | 3.1s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; echo checked | 36 | 13.6s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 7m 13s | 30 | 47679 | 62 | 4317487 | 4090392 | 227033 | 0.0894 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan review | 33.1s | 6 | 3547 | 14 | 369904 | 261088 | 108802 | 0.0068 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review | 2m 08s | 17 | 13785 | 36 | 1745116 | 1604315 | 140765 | 0.0266 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 34.2s | 5 | 4030 | 12 | 197652 | 170579 | 27061 | 0.0071 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan re-review | 33.4s | 10 | 3361 | 22 | 585255 | 509267 | 75966 | 0.0069 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan re-review | 3m 04s | 21 | 19938 | 44 | 2236884 | 2102935 | 133905 | 0.0381 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 35.6s | 5 | 3948 | 12 | 208405 | 177355 | 31038 | 0.0074 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture plan re-review | 33.8s | 8 | 3298 | 18 | 484671 | 416607 | 68046 | 0.007 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan re-review | 1m 31s | 16 | 9714 | 34 | 1480298 | 1364423 | 115841 | 0.0188 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 (cli) | 51.7s | 7 | 5044 | 16 | 322603 | 277593 | 44994 | 0.0107 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 31.6s | 9 | 2753 | 20 | 240568 | 214084 | 26464 | 0.0065 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 (general) | 1m 36s | 16 | 10318 | 34 | 1183970 | 1099006 | 84930 | 0.0198 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 29.0s | 10 | 2414 | 22 | 264127 | 250341 | 13764 | 0.006 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 (general) | 1m 46s | 18 | 11954 | 38 | 1135272 | 1071291 | 63943 | 0.022 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 28.5s | 8 | 2458 | 18 | 217518 | 203641 | 13859 | 0.0059 |
| autonomous-sdlc-harness:architecture-reviewer | Branch architecture review | 32.7s | 9 | 3311 | 20 | 445579 | 347198 | 98361 | 0.0067 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch review | 3m 25s | 23 | 22366 | 48 | 2297295 | 2170669 | 126578 | 0.0424 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 59.0s | 13 | 5567 | 28 | 724044 | 633922 | 90094 | 0.0122 |
| autonomous-sdlc-harness:committer | Commit code review file | 21.1s | 6 | 1554 | 14 | 161871 | 137473 | 24384 | 0.0044 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 1 | 37.4s | 7 | 3486 | 16 | 252836 | 215392 | 37428 | 0.0077 |
| autonomous-sdlc-harness:committer | Commit Finding 1 fix | 29.4s | 8 | 2464 | 18 | 231508 | 215356 | 16134 | 0.0061 |
| autonomous-sdlc-harness:skeptic-reviewer | Adversarial skeptic review | 2m 07s | 19 | 12681 | 40 | 1119481 | 1043282 | 76159 | 0.0264 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review skeptic review | 39.5s | 7 | 4040 | 16 | 458372 | 382021 | 76335 | 0.0081 |
| autonomous-sdlc-harness:committer | Commit skeptic review file | 21.3s | 6 | 1645 | 14 | 161257 | 149654 | 11589 | 0.0044 |
| autonomous-sdlc-harness:layer-implementer | Fix skeptic Finding 1 | 35.2s | 9 | 3393 | 20 | 424814 | 388612 | 36182 | 0.0073 |
| autonomous-sdlc-harness:committer | Commit skeptic Finding 1 fix | 27.1s | 7 | 2296 | 16 | 204854 | 188890 | 15948 | 0.0056 |
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 34.6s | 6 | 4406 | 14 | 213604 | 175992 | 37598 | 0.0071 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $29.60 |
| Cost — claude-opus-5-5 | $29.60 |
| Input tokens (uncached) | 1072 |
| Total input tokens (incl. cache) | 66430639 |
| Output tokens | 259501 |
| Thinking tokens (main thread) | 2949 |
| Cache read tokens | 64302323 |
| Cache write tokens | 2127244 |
| Cache write tokens, main thread (5m / 1h) | 0 / 304043 |
| Cache hit ratio | 0.968 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 406 | 44745394 | 4803 | 44440945 | 304043 |
| sub-agents | 666 | 21685245 | 211450 | 19861378 | 1823201 |
| remainder | 0 | 0 | 43248 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 8 |
| Sub-agents spawned / failed / killed | 27 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 258 |
| Time to first token | 1.6s |
| Rate-limit peak | seven_day 0.59 |
