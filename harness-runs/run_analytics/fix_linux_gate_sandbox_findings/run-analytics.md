# Run analytics — fix_linux_gate_sandbox_findings

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 3h13m |
| Wall | 3h13m |
| Active | 3h10m |
| Host-suspended | 0.0s |
| Idle | 3m 01s |
| Cost | $70.39 |
| Input tokens (uncached) | 2700 |
| Total input tokens (incl. cache) | 174596141 |
| Output tokens | 659461 |
| Thinking tokens (main thread) | 6549 |
| Cache read tokens | 170195782 |
| Cache write tokens | 4397659 |
| Cache write tokens, main thread (5m / 1h) | 0 / 388008 |
| Cache hit ratio | 0.9748 |
| Requests | 1286 |
| Request latency p50 / p90 / p99 / max | 1.9s / 7.4s / 27.9s / 1m 28s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 29 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 16m 23s (session 1) |
| Rate-limit peak | seven_day 0.12 |

## Session 1 — 2026-11-03T22:54:39.550Z → 2026-11-04T02:07:43.583Z

Session id: `1b4df74b-02bf-4f4b-a11a-a275a4fe4565`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 3h13m | 3h13m | 1h42m | 0.0s | 3m 01s | 3h10m | none |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-11-03T23:41:33.818Z | 3m 01s | autonomous-sdlc-harness:layer-implementer | tool_running |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 1286 | 1.9s | 7.4s | 27.9s | 1m 28s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 69 | 2.1s | 9.4s | 26.6s | 26.6s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 46 | 4.0s | 13.5s | 37.0s | 37.0s | 0 |
| autonomous-sdlc-harness:committer | 158 | 1.6s | 3.9s | 7.0s | 7.1s | 0 |
| autonomous-sdlc-harness:layer-implementer | 296 | 2.4s | 6.7s | 24.6s | 32.2s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 28 | 2.5s | 10.7s | 12.1s | 12.1s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 60 | 4.7s | 11.8s | 27.5s | 27.5s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 6 | 1.9s | 18.1s | 18.1s | 18.1s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 147 | 3.1s | 10.4s | 27.9s | 28.8s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 110 | 3.9s | 19.6s | 1m 28s | 1m 28s | 0 |
| autonomous-sdlc-harness:test-fix-plan-writer | 13 | 2.7s | 6.4s | 16.3s | 16.3s | 0 |
| orchestrator | 353 | 1.4s | 1.9s | 9.4s | 14.1s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 64 | 1h40m | 16m 23s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 50 | 22.5s | 1.6s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 37 | 5.5s | 0.4s |
| Bash | autonomous-sdlc-harness:committer | 222 | 2m 30s | 6.2s |
| Bash | autonomous-sdlc-harness:layer-implementer | 225 | 8m 18s | 3m 01s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 22 | 3.4s | 0.2s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 56 | 8.1s | 0.4s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 8 | 1.0s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 113 | 1m 03s | 5.8s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 62 | 33.1s | 14.2s |
| Bash | autonomous-sdlc-harness:test-fix-plan-writer | 8 | 1.0s | 0.2s |
| Bash | orchestrator | 366 | 1h19m | 1m 02s |
| Edit | autonomous-sdlc-harness:committer | 19 | 1.1s | 0.1s |
| Edit | autonomous-sdlc-harness:layer-implementer | 116 | 5.4s | 0.1s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 24 | 1.7s | 0.3s |
| Edit | orchestrator | 13 | 0.8s | 0.2s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 100 | 8.0s | 0.9s |
| Read | autonomous-sdlc-harness:branch-reviewer | 12 | 0.6s | 0.2s |
| Read | autonomous-sdlc-harness:committer | 23 | 0.4s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 111 | 6.4s | 0.3s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 23 | 1.3s | 0.4s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 8 | 0.7s | 0.2s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 125 | 7.3s | 0.7s |
| Read | autonomous-sdlc-harness:task-plan-writer | 50 | 1.3s | 0.3s |
| Read | autonomous-sdlc-harness:test-fix-plan-writer | 6 | 0.3s | 0.2s |
| Read | orchestrator | 15 | 6.3s | 3.7s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 6 | 0.2s | 0.0s |
| Write | autonomous-sdlc-harness:layer-implementer | 7 | 0.3s | 0.1s |
| Write | autonomous-sdlc-harness:review-plan-reviewer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 16 | 0.6s | 0.0s |
| Write | autonomous-sdlc-harness:test-fix-plan-writer | 2 | 0.1s | 0.0s |
| Write | orchestrator | 3 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-03T23:41:33.818Z | 3m 01s | 4920 | false | false |
| Bash | orchestrator | 2026-11-04T00:50:42.834Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-04T00:54:56.877Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-04T00:46:30.743Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-04T01:39:40.298Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-04T01:36:30.315Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-04T01:40:44.559Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-04T01:38:36.792Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-04T00:44:23.718Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-04T00:47:34.873Z | 1m 01s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 6 | 2.1s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/code_reviews/fix_linux_gate_sandbox_findings_code_review.md harness-runs/code_revie | 3 | 1.4s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/fix_linux_gate_sandbox_findings_story_plan.md harness-runs/task_plans/f | 9 | 5.4s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 21 | 1m 40s |
| autonomous-sdlc-harness:committer | git branch --show-current | 21 | 4.1s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 21 | 3.8s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 21 | 3.7s |
| autonomous-sdlc-harness:committer | git status --short | 44 | 9.5s |
| autonomous-sdlc-harness:committer | grep -n "scriptsDir\\|stateDir" <repo_root>/harness.config.json | 3 | 0.8s |
| autonomous-sdlc-harness:committer | grep -n -i "commit" <repo_root>/.claude/context/conventions.md | 3 | 0.3s |
| autonomous-sdlc-harness:committer | grep -n -i -A12 "commit" <repo_root>/.claude/context/conventions.md | 3 | 0.3s |
| autonomous-sdlc-harness:committer | grep -n -i -A40 "^## .*commit" <repo_root>/.claude/context/conventions.md | 4 | 0.8s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 21 | 4.0s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 17 | 1m 30s |
| autonomous-sdlc-harness:layer-implementer | git diff --name-only HEAD | 4 | 4.4s |
| autonomous-sdlc-harness:layer-implementer | git ls-files --others --exclude-standard | 4 | 3.4s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 22 | 4.1s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/main-anchor-isolation.test.mjs | 5 | 40.6s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs | 3 | 24.7s |
| autonomous-sdlc-harness:task-plan-reviewer | git -C <repo_root> grep -l -e '~[e]' | 3 | 6.3s |
| autonomous-sdlc-harness:task-plan-reviewer | git rev-parse --show-toplevel | 4 | 1.2s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 4 | 0.8s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/fix_linux_gate_sandbox_findings_progress.md" -- "chore: Flow progres | 13 | 10.0s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 13 | 1m 02s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_linux_gate_sandbox_findings --outcome FAIL --findings harness-runs/task_plan_reviews/fix_ | 3 | 1.4s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_linux_gate_sandbox_findings --outcome PASS | 5 | 3.9s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch fix_linux_gate_sandbox_findings --outcome returned | 4 | 3.5s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_1 | 39 | 38m 22s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_2 | 39 | 38m 35s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>&1 | 79 | 22.6s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>&1; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 59 | 18.6s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 16m 23s | 79 | 100448 | 160 | 16979559 | 16646388 | 333011 | 0.0849 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 59.1s | 11 | 6489 | 24 | 1080059 | 960663 | 119372 | 0.0051 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan review | 5m 13s | 51 | 31892 | 104 | 7351329 | 7144047 | 207178 | 0.027 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 37.2s | 5 | 4492 | 12 | 193176 | 155777 | 37387 | 0.0032 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 48.7s | 9 | 5407 | 20 | 611824 | 512021 | 99783 | 0.0042 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan review | 3m 15s | 36 | 20059 | 74 | 4518617 | 4365955 | 152588 | 0.0169 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 2m 29s | 21 | 14310 | 44 | 1324282 | 1261345 | 62893 | 0.0129 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 2m 00s | 18 | 11399 | 38 | 2293467 | 2144831 | 148598 | 0.0104 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan review | 2m 53s | 28 | 16397 | 58 | 2878988 | 2749157 | 129773 | 0.015 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 20.0s | 5 | 1790 | 12 | 150680 | 122504 | 28164 | 0.0017 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 1m 26s | 15 | 8338 | 32 | 1312055 | 1205488 | 106535 | 0.0075 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan review | 3m 04s | 32 | 15883 | 66 | 3218140 | 3095661 | 122413 | 0.016 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 (cli) | 2m 07s | 11 | 6251 | 24 | 567003 | 506673 | 60306 | 0.011 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 34.5s | 7 | 2438 | 16 | 195639 | 169216 | 26407 | 0.003 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 (cli) | 4m 33s | 14 | 7054 | 30 | 681661 | 638354 | 43277 | 0.0236 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 32.7s | 8 | 2398 | 18 | 260262 | 240914 | 19330 | 0.0028 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 (general) | 1m 40s | 12 | 9648 | 26 | 708073 | 653044 | 55003 | 0.0086 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 31.0s | 9 | 2440 | 20 | 253008 | 237517 | 15471 | 0.0027 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 4 (general) | 1m 52s | 22 | 11443 | 46 | 1391904 | 1323152 | 68706 | 0.0097 |
| autonomous-sdlc-harness:committer | Commit Task 4 | 29.7s | 8 | 2687 | 18 | 223283 | 208695 | 14570 | 0.0026 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 5 (general) | 2m 07s | 18 | 13688 | 38 | 1637296 | 1540743 | 96515 | 0.011 |
| autonomous-sdlc-harness:committer | Commit Task 5 | 24.8s | 7 | 2206 | 16 | 194162 | 180497 | 13649 | 0.0021 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 6 (general) | 2m 46s | 22 | 18466 | 46 | 2001827 | 1903922 | 97859 | 0.0143 |
| autonomous-sdlc-harness:committer | Commit Task 6 | 27.0s | 7 | 2495 | 16 | 209493 | 192130 | 17347 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 7 (cli) | 1m 57s | 15 | 12041 | 32 | 812078 | 760840 | 51206 | 0.0101 |
| autonomous-sdlc-harness:committer | Commit Task 7 | 26.4s | 7 | 2356 | 16 | 213893 | 197245 | 16632 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 8 (cli) | 1m 46s | 19 | 11040 | 40 | 1110319 | 1042649 | 67630 | 0.0092 |
| autonomous-sdlc-harness:committer | Commit Task 8 | 26.1s | 8 | 2193 | 18 | 221201 | 206688 | 14495 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 9 (cli) | 1m 59s | 17 | 12411 | 36 | 1329481 | 1250362 | 79083 | 0.0103 |
| autonomous-sdlc-harness:committer | Commit Task 9 | 26.6s | 8 | 2259 | 18 | 219110 | 204883 | 14209 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 10 (cli) | 1m 01s | 12 | 6340 | 26 | 563701 | 522145 | 41530 | 0.0053 |
| autonomous-sdlc-harness:committer | Commit Task 10 | 24.1s | 7 | 2118 | 16 | 228383 | 209357 | 19010 | 0.0021 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 11 (general) | 1m 17s | 13 | 8168 | 28 | 703668 | 654807 | 48833 | 0.0067 |
| autonomous-sdlc-harness:committer | Commit Task 11 | 30.4s | 9 | 2690 | 20 | 253476 | 237253 | 16203 | 0.0026 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 12 (general) | 1m 12s | 13 | 8306 | 28 | 726556 | 675048 | 51480 | 0.0063 |
| autonomous-sdlc-harness:committer | Commit Task 12 | 25.0s | 7 | 2246 | 16 | 231918 | 212213 | 19689 | 0.0022 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 13 (general) | 2m 30s | 26 | 17489 | 54 | 2665208 | 2550979 | 114175 | 0.013 |
| autonomous-sdlc-harness:committer | Commit Task 13 | 27.1s | 8 | 2331 | 18 | 222105 | 207337 | 14750 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 14 (cli) | 56.6s | 11 | 5296 | 24 | 485250 | 450827 | 34399 | 0.0049 |
| autonomous-sdlc-harness:committer | Commit Task 14 | 25.3s | 9 | 2174 | 20 | 260655 | 243186 | 17449 | 0.0022 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 15 (general) | 26.2s | 6 | 2678 | 14 | 313500 | 264168 | 49318 | 0.0023 |
| autonomous-sdlc-harness:committer | Commit Task 15 | 23.1s | 7 | 1892 | 16 | 227722 | 208789 | 18917 | 0.002 |
| autonomous-sdlc-harness:architecture-reviewer | Branch architecture review | 48.2s | 10 | 4769 | 22 | 957662 | 821195 | 136445 | 0.0042 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch code review | 5m 22s | 41 | 34921 | 84 | 5354641 | 5173801 | 180756 | 0.0278 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 1m 14s | 13 | 7812 | 28 | 933532 | 843324 | 90180 | 0.0064 |
| autonomous-sdlc-harness:branch-reviewer | Adjust code review | 25.7s | 5 | 3194 | 12 | 161201 | 146309 | 14880 | 0.0022 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 1m 10s | 15 | 7175 | 32 | 1036750 | 949974 | 86744 | 0.0061 |
| autonomous-sdlc-harness:committer | Commit code review file | 20.4s | 6 | 1636 | 14 | 161378 | 136823 | 24541 | 0.0018 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 1 | 1m 06s | 16 | 6293 | 34 | 584790 | 542417 | 42339 | 0.0057 |
| autonomous-sdlc-harness:committer | Commit Finding 1 fix | 25.7s | 7 | 2135 | 16 | 187780 | 175095 | 12669 | 0.0022 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 3 (cli layer) | 17.0s | 4 | 1680 | 10 | 142039 | 123061 | 18968 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 3 (general layer) | 41.7s | 10 | 3557 | 22 | 432191 | 400291 | 31878 | 0.0036 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 3 (cli layer, retry) | 43.6s | 8 | 3677 | 18 | 319631 | 290529 | 29084 | 0.0038 |
| autonomous-sdlc-harness:committer | Commit Finding 3 fix | 26.1s | 8 | 2225 | 18 | 237164 | 220925 | 16221 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 2 (cli layer) | 20.3s | 4 | 2105 | 10 | 148006 | 126800 | 21196 | 0.0018 |
| autonomous-sdlc-harness:layer-implementer | Fix Finding 2 (general layer) | 1m 13s | 12 | 7222 | 26 | 660495 | 612966 | 47503 | 0.0063 |
| autonomous-sdlc-harness:committer | Commit Finding 2 fix | 25.7s | 8 | 2262 | 18 | 213595 | 200290 | 13287 | 0.0022 |
| autonomous-sdlc-harness:skeptic-reviewer | Adversarial skeptic review | 6m 45s | 60 | 39042 | 122 | 8405911 | 8185739 | 220050 | 0.035 |
| autonomous-sdlc-harness:test-fix-plan-writer | Write round-1 test fix plan | 1m 09s | 13 | 6605 | 28 | 698223 | 635553 | 62642 | 0.006 |
| autonomous-sdlc-harness:architecture-reviewer | Arch gate on test fix plan | 28.3s | 6 | 3097 | 14 | 275851 | 202485 | 73352 | 0.0024 |
| autonomous-sdlc-harness:committer | Commit round-1 test fix plan | 20.5s | 5 | 1615 | 12 | 137157 | 113040 | 24105 | 0.0018 |
| autonomous-sdlc-harness:layer-implementer | Fix test-fix Finding 1 | 40.4s | 11 | 3639 | 24 | 525364 | 475673 | 49667 | 0.0035 |
| autonomous-sdlc-harness:committer | Commit test-fix Finding 1 | 28.9s | 8 | 2479 | 18 | 227744 | 212297 | 15429 | 0.0025 |
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 35.7s | 6 | 4606 | 14 | 186487 | 153901 | 32572 | 0.0031 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $70.39 |
| Cost — claude-opus-5-5 | $70.39 |
| Input tokens (uncached) | 2700 |
| Total input tokens (incl. cache) | 174596141 |
| Output tokens | 659461 |
| Thinking tokens (main thread) | 6549 |
| Cache read tokens | 170195782 |
| Cache write tokens | 4397659 |
| Cache write tokens, main thread (5m / 1h) | 0 / 388008 |
| Cache hit ratio | 0.9748 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 706 | 91584538 | 9681 | 91195824 | 388008 |
| sub-agents | 1994 | 83011603 | 573892 | 78999958 | 4009651 |
| remainder | 0 | 0 | 75888 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 29 |
| Sub-agents spawned / failed / killed | 64 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 464 |
| Time to first token | 1.4s |
| Rate-limit peak | seven_day 0.12 |
