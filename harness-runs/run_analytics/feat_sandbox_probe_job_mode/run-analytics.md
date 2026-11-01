# Run analytics — feat_sandbox_probe_job_mode

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 4h43m |
| Wall | 4h43m |
| Active | 4h38m |
| Host-suspended | 0.0s |
| Idle | 4m 46s |
| Cost | $124.31 |
| Input tokens (uncached) | 4238 |
| Total input tokens (incl. cache) | 311992600 |
| Output tokens | 1301150 |
| Thinking tokens (main thread) | 5127 |
| Cache read tokens | 304793112 |
| Cache write tokens | 7195250 |
| Cache write tokens, main thread (5m / 1h) | 0 / 446234 |
| Cache hit ratio | 0.9769 |
| Requests | 2024 |
| Request latency p50 / p90 / p99 / max | 2.0s / 9.3s / 43.8s / 2m 41s |
| Requests over the idle threshold | 2 |
| API retries | 0 |
| Permission denials | 64 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 28m 54s (session 1) |
| Rate-limit peak | seven_day 0.57 |

## Session 1 — 2026-11-01T09:09:40.911Z → 2026-11-01T13:52:49.819Z

Session id: `f1e6a226-c947-4a2b-a839-7f27c4e1ef5a`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 4h43m | 4h43m | 3h16m | 0.0s | 4m 46s | 4h38m | none |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-11-01T09:16:07.924Z | 2m 41s | autonomous-sdlc-harness:task-plan-writer | in_flight_request |
| 2026-11-01T09:23:12.064Z | 2m 04s | autonomous-sdlc-harness:task-plan-writer | in_flight_request |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 2024 | 2.0s | 9.3s | 43.8s | 2m 41s | 2 |
| autonomous-sdlc-harness:architecture-reviewer | 96 | 2.4s | 13.4s | 45.2s | 45.2s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 105 | 4.9s | 17.9s | 41.3s | 45.3s | 0 |
| autonomous-sdlc-harness:committer | 264 | 1.6s | 3.3s | 7.1s | 8.4s | 0 |
| autonomous-sdlc-harness:layer-implementer | 650 | 2.7s | 9.4s | 52.2s | 1m 36s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 79 | 3.2s | 11.3s | 17.3s | 17.3s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 50 | 3.6s | 21.9s | 37.3s | 37.3s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 6 | 1.8s | 19.2s | 19.2s | 19.2s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 115 | 4.3s | 15.8s | 44.4s | 1m 02s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 133 | 4.4s | 28.4s | 2m 04s | 2m 41s | 2 |
| autonomous-sdlc-harness:test-fix-plan-writer | 19 | 2.1s | 10.1s | 18.5s | 18.5s | 0 |
| orchestrator | 507 | 1.3s | 1.7s | 4.4s | 12.5s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 94 | 3h08m | 28m 54s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 62 | 8.3s | 0.2s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 80 | 11.3s | 0.2s |
| Bash | autonomous-sdlc-harness:committer | 379 | 3m 35s | 5.1s |
| Bash | autonomous-sdlc-harness:layer-implementer | 494 | 5m 46s | 15.3s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 58 | 7.8s | 0.1s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 38 | 5.1s | 0.2s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 7 | 0.9s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 78 | 10.6s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 73 | 14.4s | 1.2s |
| Bash | autonomous-sdlc-harness:test-fix-plan-writer | 11 | 1.3s | 0.1s |
| Bash | orchestrator | 420 | 1h18m | 1m 01s |
| Edit | autonomous-sdlc-harness:committer | 31 | 1.1s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 199 | 8.0s | 0.0s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 54 | 2.2s | 0.0s |
| Edit | orchestrator | 13 | 17.4s | 3.7s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 138 | 5.8s | 0.3s |
| Read | autonomous-sdlc-harness:branch-reviewer | 33 | 1.0s | 0.2s |
| Read | autonomous-sdlc-harness:committer | 29 | 0.4s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 199 | 12.0s | 0.6s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 58 | 2.1s | 0.3s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 23 | 1.1s | 0.4s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 3 | 0.3s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 98 | 2.8s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 51 | 2.4s | 0.3s |
| Read | autonomous-sdlc-harness:test-fix-plan-writer | 11 | 0.1s | 0.0s |
| Read | orchestrator | 14 | 13.3s | 3.7s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 5 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 14 | 0.6s | 0.0s |
| Write | autonomous-sdlc-harness:layer-implementer | 52 | 2.1s | 0.0s |
| Write | autonomous-sdlc-harness:review-plan-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 2 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 29 | 1.2s | 0.0s |
| Write | autonomous-sdlc-harness:test-fix-plan-writer | 2 | 0.1s | 0.0s |
| Write | orchestrator | 3 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-01T13:14:18.344Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-01T13:28:17.262Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-01T12:41:24.318Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-01T12:36:00.563Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-01T12:44:38.527Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-01T13:27:12.250Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-01T13:22:53.329Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-01T12:39:13.625Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-01T12:40:18.982Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-01T13:42:04.859Z | 1m 01s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 6 | 0.6s |
| autonomous-sdlc-harness:branch-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/code_reviews/feat_sandbox_probe_job_mode_code_review.md harness-runs/code_reviews/f | 5 | 2.7s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/feat_sandbox_probe_job_mode_story_plan.md harness-runs/task_plans/feat_ | 14 | 7.2s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/feat_sandbox_probe_job_mode_story_plan.md scripts/lib/sandbox-probe/leg | 3 | 1.4s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 35 | 2m 37s |
| autonomous-sdlc-harness:committer | git branch --show-current | 34 | 4.2s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 34 | 4.0s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 35 | 4.2s |
| autonomous-sdlc-harness:committer | git status --short | 79 | 11.1s |
| autonomous-sdlc-harness:committer | grep -n -i "^## .*commit" <repo_root>/.claude/context/conventions.md | 3 | 0.3s |
| autonomous-sdlc-harness:committer | grep -n -i -A30 "^## .*commit" <repo_root>/.claude/context/conventions.md | 4 | 0.4s |
| autonomous-sdlc-harness:committer | grep -n -i -A40 "^## .*commit" <repo_root>/.claude/context/conventions.md | 5 | 0.6s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 35 | 4.0s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 29 | 1m 07s |
| autonomous-sdlc-harness:layer-implementer | git -C <repo_root> diff --stat | 3 | 0.4s |
| autonomous-sdlc-harness:layer-implementer | git diff --name-only HEAD | 3 | 2.3s |
| autonomous-sdlc-harness:layer-implementer | git diff --name-only HEAD; git ls-files --others --exclude-standard | 4 | 3.1s |
| autonomous-sdlc-harness:layer-implementer | git ls-files --others --exclude-standard | 3 | 1.7s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 37 | 4.5s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/main-anchor-isolation.test.mjs | 12 | 19.7s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/sandbox-probe-git-and-legs.test.mjs | 3 | 14.4s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/sandbox-probe-job-launch.test.mjs | 3 | 21.6s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/sandbox-probe-runner-legs.test.mjs | 3 | 6.7s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/sandbox-probe-runner-workflow.test.mjs | 4 | 6.8s |
| autonomous-sdlc-harness:review-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 4 | 0.4s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/feat_sandbox_probe_job_mode_progress.md" -- "chore: Flow progress C2 | 3 | 1.3s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 18 | 1m 20s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_sandbox_probe_job_mode --outcome PASS | 4 | 1.0s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_sandbox_probe_job_mode --outcome returned | 4 | 0.9s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_1 | 38 | 37m 19s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_2 | 39 | 38m 24s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>&1 | 78 | 23.3s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>&1; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 90 | 19.9s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 28m 54s | 100 | 195199 | 202 | 28803916 | 28355107 | 448607 | 0.1021 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 3m 03s | 17 | 20365 | 36 | 2103369 | 1938876 | 164457 | 0.0108 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 49.6s | 9 | 5694 | 20 | 324967 | 298396 | 26551 | 0.0029 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 39s | 11 | 10880 | 24 | 1273733 | 1128942 | 144767 | 0.0059 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural review of plan | 6m 03s | 37 | 38077 | 76 | 5851248 | 5622651 | 228521 | 0.0214 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 3m 31s | 20 | 25358 | 42 | 1451676 | 1357472 | 94162 | 0.0124 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 2m 21s | 15 | 15263 | 32 | 1692377 | 1517875 | 174470 | 0.0083 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural review of plan | 5m 50s | 44 | 36620 | 90 | 6116117 | 5903200 | 212827 | 0.0206 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 35.6s | 4 | 4141 | 10 | 187081 | 135765 | 51306 | 0.0021 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 2m 41s | 19 | 17147 | 40 | 2202732 | 2032015 | 170677 | 0.0095 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural review of plan | 3m 49s | 34 | 23455 | 70 | 4473105 | 4302322 | 170713 | 0.0135 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 | 1m 32s | 15 | 10621 | 32 | 856966 | 792277 | 64657 | 0.0054 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 26.2s | 8 | 2157 | 18 | 213431 | 187513 | 25900 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 | 2m 30s | 18 | 17441 | 38 | 1561614 | 1463535 | 98041 | 0.0089 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 27.4s | 8 | 2266 | 18 | 212877 | 199749 | 13110 | 0.0016 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 | 3m 06s | 19 | 21631 | 40 | 1662611 | 1562088 | 100483 | 0.011 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 22.2s | 8 | 1691 | 18 | 221785 | 207642 | 14125 | 0.0013 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 4 | 2m 39s | 23 | 18310 | 48 | 2079768 | 1979029 | 100691 | 0.0094 |
| autonomous-sdlc-harness:committer | Commit Task 4 | 25.8s | 7 | 1865 | 16 | 197109 | 182658 | 14435 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 5 | 2m 42s | 21 | 17708 | 44 | 1480929 | 1400484 | 80401 | 0.0096 |
| autonomous-sdlc-harness:committer | Commit Task 5 | 25.9s | 7 | 2144 | 16 | 244817 | 222833 | 21968 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 6 | 52.5s | 10 | 5654 | 22 | 651950 | 585943 | 65985 | 0.0031 |
| autonomous-sdlc-harness:committer | Commit Task 6 | 25.1s | 7 | 2093 | 16 | 197970 | 184060 | 13894 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 7 | 2m 11s | 16 | 15034 | 34 | 1089336 | 1018640 | 70662 | 0.0077 |
| autonomous-sdlc-harness:committer | Commit Task 7 | 22.6s | 7 | 1744 | 16 | 189349 | 176555 | 12778 | 0.0013 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 8 | 3m 33s | 21 | 24147 | 44 | 1920668 | 1814383 | 106241 | 0.0126 |
| autonomous-sdlc-harness:committer | Commit Task 8 | 26.8s | 8 | 2190 | 18 | 215765 | 202259 | 13488 | 0.0016 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 9 | 3m 09s | 25 | 20855 | 52 | 2438459 | 2323720 | 114687 | 0.0111 |
| autonomous-sdlc-harness:committer | Commit Task 9 | 27.3s | 9 | 2186 | 20 | 249470 | 233851 | 15599 | 0.0016 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 10 | 1m 31s | 11 | 9630 | 24 | 690253 | 632141 | 58088 | 0.0054 |
| autonomous-sdlc-harness:committer | Commit Task 10 | 24.2s | 9 | 1681 | 20 | 252947 | 237840 | 15087 | 0.0014 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 11 | 2m 06s | 16 | 13109 | 34 | 1134975 | 1061944 | 72997 | 0.0075 |
| autonomous-sdlc-harness:committer | Commit Task 11 | 26.3s | 7 | 2263 | 16 | 196728 | 181984 | 14728 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 12 | 2m 57s | 26 | 18506 | 54 | 2276175 | 2181642 | 94479 | 0.0104 |
| autonomous-sdlc-harness:committer | Commit Task 12 | 23.8s | 6 | 1853 | 14 | 171767 | 157615 | 14138 | 0.0014 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 13 | 4m 39s | 28 | 30972 | 58 | 3090788 | 2956689 | 134041 | 0.0165 |
| autonomous-sdlc-harness:committer | Commit Task 13 | 28.6s | 9 | 1849 | 20 | 239912 | 226578 | 13314 | 0.0017 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 14 | 3m 03s | 18 | 21569 | 38 | 1567269 | 1474832 | 92399 | 0.0108 |
| autonomous-sdlc-harness:committer | Commit Task 14 | 25.1s | 7 | 2139 | 16 | 197292 | 183511 | 13765 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 15 | 2m 23s | 23 | 15657 | 48 | 1995543 | 1898821 | 96674 | 0.0084 |
| autonomous-sdlc-harness:committer | Commit Task 15 | 21.4s | 7 | 1687 | 16 | 247434 | 224890 | 22528 | 0.0013 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 16 | 1m 33s | 17 | 10352 | 36 | 1018679 | 959607 | 59036 | 0.0055 |
| autonomous-sdlc-harness:committer | Commit Task 16 | 27.5s | 8 | 2178 | 18 | 274720 | 253315 | 21387 | 0.0016 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 17 | 3m 24s | 26 | 20943 | 54 | 2832728 | 2700267 | 132407 | 0.0121 |
| autonomous-sdlc-harness:committer | Commit Task 17 | 25.1s | 9 | 2032 | 20 | 249533 | 233725 | 15788 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 18 | 2m 47s | 19 | 17965 | 40 | 1272747 | 1198639 | 74068 | 0.0099 |
| autonomous-sdlc-harness:committer | Commit Task 18 | 30.5s | 8 | 2614 | 18 | 227196 | 211621 | 15557 | 0.0018 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 19 | 2m 58s | 25 | 17400 | 52 | 1799390 | 1719844 | 79494 | 0.0105 |
| autonomous-sdlc-harness:committer | Commit Task 19 | 24.2s | 6 | 1998 | 14 | 174891 | 160523 | 14354 | 0.0014 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 20 | 4m 11s | 20 | 31808 | 42 | 1459453 | 1359708 | 99703 | 0.0148 |
| autonomous-sdlc-harness:committer | Commit Task 20 | 25.7s | 6 | 2260 | 14 | 173019 | 159033 | 13972 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 21 | 6m 07s | 41 | 42237 | 84 | 3882142 | 3762122 | 119936 | 0.0216 |
| autonomous-sdlc-harness:committer | Commit Task 21 | 28.8s | 7 | 2538 | 16 | 197773 | 170702 | 27055 | 0.0017 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 22 | 2m 41s | 19 | 17434 | 40 | 1295220 | 1220682 | 74498 | 0.0095 |
| autonomous-sdlc-harness:committer | Commit Task 22 | 24.2s | 8 | 2015 | 18 | 215183 | 202272 | 12893 | 0.0014 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 23 | 2m 47s | 24 | 17801 | 50 | 4352775 | 4146992 | 205733 | 0.0098 |
| autonomous-sdlc-harness:committer | Commit Task 23 | 24.8s | 9 | 1864 | 20 | 235308 | 222398 | 12890 | 0.0015 |
| autonomous-sdlc-harness:architecture-reviewer | Branch architecture review | 2m 29s | 26 | 15167 | 54 | 2600402 | 2437535 | 162813 | 0.0088 |
| autonomous-sdlc-harness:committer | Commit architecture review | 18.3s | 5 | 1321 | 12 | 139772 | 127777 | 11983 | 0.0011 |
| autonomous-sdlc-harness:layer-implementer | Fix arch finding 2 | 1m 25s | 17 | 8023 | 36 | 941315 | 881242 | 60037 | 0.005 |
| autonomous-sdlc-harness:committer | Commit arch fix item 1 | 23.6s | 7 | 1898 | 16 | 188047 | 175400 | 12631 | 0.0014 |
| autonomous-sdlc-harness:layer-implementer | Fix arch finding 1 | 2m 21s | 24 | 14504 | 50 | 1932897 | 1834978 | 97869 | 0.0084 |
| autonomous-sdlc-harness:committer | Commit arch fix item 2 | 23.4s | 7 | 1952 | 16 | 189245 | 176445 | 12784 | 0.0014 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch code review | 10m 28s | 72 | 66776 | 146 | 15729512 | 15413052 | 316314 | 0.037 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 2m 35s | 31 | 16092 | 64 | 2613000 | 2488388 | 124548 | 0.0092 |
| autonomous-sdlc-harness:branch-reviewer | Adjust code review | 1m 57s | 15 | 13612 | 32 | 1091015 | 1008879 | 82104 | 0.0069 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 3m 01s | 31 | 19300 | 64 | 3371736 | 3236948 | 134724 | 0.0107 |
| autonomous-sdlc-harness:branch-reviewer | Adjust code review | 2m 36s | 18 | 19522 | 38 | 1020779 | 957102 | 63639 | 0.0092 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 1m 08s | 17 | 7331 | 36 | 1427748 | 1336530 | 91182 | 0.004 |
| autonomous-sdlc-harness:committer | Commit code review | 20.6s | 6 | 1614 | 14 | 161537 | 137010 | 24513 | 0.0012 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 4 | 26.9s | 7 | 2582 | 16 | 311403 | 264152 | 47235 | 0.0016 |
| autonomous-sdlc-harness:committer | Commit code-review item 1 | 32.8s | 10 | 2597 | 22 | 263205 | 249498 | 13685 | 0.0019 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 5 (cli) | 19.3s | 3 | 1899 | 8 | 110425 | 90418 | 19999 | 0.0011 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 5 (general) | 42.8s | 11 | 4078 | 24 | 518965 | 482136 | 36805 | 0.0025 |
| autonomous-sdlc-harness:committer | Commit code-review item 2 | 25.1s | 9 | 2223 | 20 | 238967 | 225470 | 13477 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 6 (cli) | 18.3s | 5 | 1771 | 12 | 187394 | 158297 | 29085 | 0.0011 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 6 (general) | 55.8s | 11 | 5348 | 24 | 573462 | 524712 | 48726 | 0.0033 |
| autonomous-sdlc-harness:committer | Commit code-review item 3 | 23.9s | 7 | 2104 | 16 | 192712 | 179477 | 13219 | 0.0014 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 3 (cli) | 56.7s | 14 | 5374 | 30 | 631887 | 592140 | 39717 | 0.0033 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 3 (general) | 1m 03s | 14 | 6427 | 30 | 745317 | 696082 | 49205 | 0.0037 |
| autonomous-sdlc-harness:committer | Commit code-review item 4 | 25.4s | 6 | 2190 | 14 | 170695 | 156818 | 13863 | 0.0015 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 1 (cli) | 1m 01s | 11 | 5633 | 24 | 504266 | 457824 | 46418 | 0.0036 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 1 (general) | 1m 23s | 14 | 8334 | 30 | 994664 | 921818 | 72816 | 0.0049 |
| autonomous-sdlc-harness:committer | Commit code-review item 5 | 30.8s | 10 | 2683 | 22 | 267718 | 253430 | 14266 | 0.0018 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 2 (cli) | 1m 17s | 13 | 7092 | 28 | 586229 | 544205 | 41996 | 0.0046 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 2 (general) | 1m 23s | 17 | 8432 | 36 | 1012940 | 956005 | 56899 | 0.0049 |
| autonomous-sdlc-harness:committer | Commit code-review item 6 | 26.5s | 8 | 2312 | 18 | 248914 | 231155 | 17741 | 0.0016 |
| autonomous-sdlc-harness:skeptic-reviewer | Adversarial skeptic review | 7m 07s | 50 | 43818 | 102 | 9130932 | 8869437 | 261393 | 0.0252 |
| autonomous-sdlc-harness:test-fix-plan-writer | Write test fix plan round 1 | 1m 33s | 19 | 10102 | 40 | 1004647 | 930360 | 74247 | 0.0055 |
| autonomous-sdlc-harness:architecture-reviewer | Review test fix plan round 1 | 26.5s | 8 | 2718 | 18 | 348853 | 280154 | 68681 | 0.0016 |
| autonomous-sdlc-harness:committer | Commit test fix plan round 1 | 22.4s | 7 | 1870 | 16 | 191897 | 165846 | 26035 | 0.0013 |
| autonomous-sdlc-harness:layer-implementer | Fix test-fix finding 1 | 47.5s | 8 | 3036 | 18 | 297823 | 262439 | 35366 | 0.0028 |
| autonomous-sdlc-harness:committer | Commit test-fix item 1 | 21.1s | 7 | 1719 | 16 | 184048 | 172412 | 11620 | 0.0012 |
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 36.6s | 6 | 4760 | 14 | 250200 | 204017 | 46169 | 0.0022 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $124.31 |
| Cost — claude-opus-5-5 | $124.31 |
| Input tokens (uncached) | 4238 |
| Total input tokens (incl. cache) | 311992600 |
| Output tokens | 1301150 |
| Thinking tokens (main thread) | 5127 |
| Cache read tokens | 304793112 |
| Cache write tokens | 7195250 |
| Cache write tokens, main thread (5m / 1h) | 0 / 446234 |
| Cache hit ratio | 0.9769 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 1016 | 159730997 | 13007 | 159283747 | 446234 |
| sub-agents | 3222 | 152261603 | 1202504 | 145509365 | 6749016 |
| remainder | 0 | 0 | 85639 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 64 |
| Sub-agents spawned / failed / killed | 94 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 547 |
| Time to first token | 1.3s |
| Rate-limit peak | seven_day 0.57 |
