# Run analytics — feat_sandbox_probe_linux_legs

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 3h31m |
| Wall | 3h31m |
| Active | 3h22m |
| Host-suspended | 0.0s |
| Idle | 8m 52s |
| Cost | $91.90 |
| Input tokens (uncached) | 3178 |
| Total input tokens (incl. cache) | 218508020 |
| Output tokens | 1001658 |
| Thinking tokens (main thread) | 3358 |
| Cache read tokens | 212875370 |
| Cache write tokens | 5629472 |
| Cache write tokens, main thread (5m / 1h) | 0 / 378325 |
| Cache hit ratio | 0.9742 |
| Requests | 1515 |
| Request latency p50 / p90 / p99 / max | 2.6s / 10.9s / 45.8s / 3m 41s |
| Requests over the idle threshold | 3 |
| API retries | 0 |
| Permission denials | 56 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 28m 17s (session 1) |
| Rate-limit peak | five_hour 0.6, seven_day 0.2 |

## Session 1 — 2026-10-28T11:48:28.126Z → 2026-10-28T15:20:00.221Z

Session id: `d22c1ace-7403-4d2a-b2b4-ba2bc69e7745`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 3h31m | 3h31m | 2h44m | 0.0s | 8m 52s | 3h22m | none |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-10-28T11:52:00.143Z | 3m 02s | autonomous-sdlc-harness:task-plan-writer | in_flight_request |
| 2026-10-28T11:58:27.737Z | 3m 41s | autonomous-sdlc-harness:task-plan-writer | in_flight_request |
| 2026-10-28T13:07:16.413Z | 2m 08s | autonomous-sdlc-harness:layer-implementer | in_flight_request |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 1515 | 2.6s | 10.9s | 45.8s | 3m 41s | 3 |
| autonomous-sdlc-harness:architecture-reviewer | 41 | 3.2s | 10.0s | 37.3s | 37.3s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 64 | 3.9s | 13.3s | 24.3s | 24.3s | 0 |
| autonomous-sdlc-harness:committer | 239 | 1.9s | 3.5s | 7.1s | 7.5s | 0 |
| autonomous-sdlc-harness:layer-implementer | 480 | 3.3s | 10.3s | 57.2s | 2m 08s | 1 |
| autonomous-sdlc-harness:review-plan-reviewer | 36 | 3.6s | 8.8s | 15.6s | 15.6s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 65 | 3.7s | 21.8s | 37.0s | 37.0s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 8 | 2.3s | 20.1s | 20.1s | 20.1s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 108 | 4.8s | 15.1s | 35.1s | 49.5s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 120 | 6.2s | 34.7s | 3m 02s | 3m 41s | 2 |
| orchestrator | 354 | 1.4s | 2.2s | 7.7s | 11.8s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 73 | 2h39m | 28m 17s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 25 | 3.4s | 0.1s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 46 | 6.4s | 0.2s |
| Bash | autonomous-sdlc-harness:committer | 345 | 3m 38s | 6.4s |
| Bash | autonomous-sdlc-harness:layer-implementer | 348 | 6m 16s | 34.2s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 32 | 4.6s | 0.2s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 55 | 7.7s | 0.2s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 9 | 1.1s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 64 | 8.4s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 55 | 10.0s | 1.3s |
| Bash | orchestrator | 287 | 38m 49s | 1m 02s |
| Edit | autonomous-sdlc-harness:committer | 25 | 0.6s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 126 | 3.0s | 0.1s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 42 | 0.8s | 0.0s |
| Edit | orchestrator | 13 | 7.2s | 3.6s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 70 | 2.6s | 0.3s |
| Read | autonomous-sdlc-harness:branch-reviewer | 23 | 1.2s | 0.3s |
| Read | autonomous-sdlc-harness:committer | 33 | 0.7s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 190 | 12.0s | 0.3s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 30 | 2.0s | 0.3s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 17 | 0.7s | 0.2s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 2 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 101 | 2.3s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 45 | 1.2s | 0.2s |
| Read | orchestrator | 13 | 6.5s | 4.1s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 4 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:layer-implementer | 43 | 1.1s | 0.1s |
| Write | autonomous-sdlc-harness:review-plan-reviewer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:skeptic-reviewer | 3 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 27 | 0.6s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-10-28T14:43:36.503Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-10-28T14:52:15.430Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-28T14:55:31.311Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-28T14:45:47.429Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-28T14:53:21.393Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-28T15:12:36.943Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-28T14:44:42.612Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-10-28T14:59:49.964Z | 1m 00s | 19 | true | false |
| Bash | orchestrator | 2026-10-28T14:51:10.826Z | 1m 00s | 19 | true | false |
| Bash | orchestrator | 2026-10-28T14:56:36.487Z | 1m 00s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/feat_sandbox_probe_linux_legs_story_plan.md cli/test/fixtures/sandbox-p | 3 | 1.8s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/feat_sandbox_probe_linux_legs_story_plan.md harness-runs/task_plans/fea | 12 | 12.5s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 32 | 2m 28s |
| autonomous-sdlc-harness:committer | git branch --show-current | 31 | 5.1s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 31 | 5.1s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 31 | 4.7s |
| autonomous-sdlc-harness:committer | git show --stat --format= HEAD | 3 | 0.3s |
| autonomous-sdlc-harness:committer | git status --short | 68 | 12.3s |
| autonomous-sdlc-harness:committer | grep -n "scriptsDir\\|stateDir" <repo_root>/harness.config.json | 5 | 0.6s |
| autonomous-sdlc-harness:committer | grep -n -i "^## .*commit" <repo_root>/.claude/context/conventions.md | 4 | 0.5s |
| autonomous-sdlc-harness:committer | grep -n -i "commit" <repo_root>/.claude/context/conventions.md | 4 | 0.5s |
| autonomous-sdlc-harness:committer | grep -n -i "commit" <repo_root>/.claude/context/conventions.md \| head -40 | 3 | 0.3s |
| autonomous-sdlc-harness:committer | grep -n -i -A40 "^## .*commit" <repo_root>/.claude/context/conventions.md | 6 | 1.2s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 31 | 4.8s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 27 | 2m 22s |
| autonomous-sdlc-harness:layer-implementer | git diff --name-only HEAD | 5 | 5.9s |
| autonomous-sdlc-harness:layer-implementer | git diff --name-only HEAD; git ls-files --others --exclude-standard | 5 | 13.7s |
| autonomous-sdlc-harness:layer-implementer | git ls-files --others --exclude-standard | 5 | 5.5s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 28 | 4.4s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/main-anchor-isolation.test.mjs | 8 | 14.0s |
| autonomous-sdlc-harness:review-plan-reviewer | git rev-parse --show-toplevel | 3 | 0.3s |
| autonomous-sdlc-harness:task-plan-writer | git grep -nE 'Linux legs\|roadmap item 21\|Linux is unmeasured\|Linux may skip\|no Linux host\|Linux or WSL2 host\|private loopback\|probe measures the macOS\|sandbox p | 3 | 0.7s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/feat_sandbox_probe_linux_legs_progress.md" -- "chore: Flow progress  | 13 | 5.9s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 17 | 1m 18s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_sandbox_probe_linux_legs --outcome PASS | 3 | 0.7s |
| orchestrator | bash scripts/run-test-suite.sh --wait task_round_1 | 36 | 36m 05s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 38 | 6.8s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; echo checked | 36 | 13.3s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE <main_repo>/harness-runs/AUTONOMOUS_STOP 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 32 | 24.3s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 28m 17s | 83 | 175057 | 168 | 25849562 | 25380936 | 468458 | 0.1337 |
| autonomous-sdlc-harness:architecture-reviewer | Plan architecture review | 1m 53s | 12 | 9782 | 26 | 1436235 | 1260576 | 175633 | 0.0089 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review | 7m 30s | 52 | 40697 | 106 | 9128523 | 8875289 | 253128 | 0.0355 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 7m 22s | 37 | 50719 | 76 | 3538316 | 3400565 | 137675 | 0.0348 |
| autonomous-sdlc-harness:architecture-reviewer | Plan architecture review | 1m 30s | 11 | 9575 | 24 | 982762 | 825085 | 157653 | 0.0072 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review | 7m 34s | 56 | 41638 | 114 | 11734866 | 11448358 | 286394 | 0.0358 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 | 1m 41s | 12 | 9217 | 26 | 773999 | 699068 | 74905 | 0.008 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 32.1s | 6 | 2211 | 14 | 201267 | 168518 | 32735 | 0.0025 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 | 2m 31s | 20 | 14693 | 42 | 1776479 | 1680632 | 95805 | 0.012 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 25.4s | 7 | 2091 | 16 | 219509 | 201672 | 17821 | 0.002 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 | 1m 32s | 17 | 9939 | 36 | 1292618 | 1217808 | 74774 | 0.0073 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 30.7s | 8 | 2599 | 18 | 239538 | 222220 | 17300 | 0.0024 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 4 | 2m 24s | 17 | 16121 | 36 | 1292004 | 1211502 | 80466 | 0.0114 |
| autonomous-sdlc-harness:committer | Commit Task 4 | 29.3s | 8 | 2447 | 18 | 215235 | 201536 | 13681 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 5 | 2m 22s | 24 | 13895 | 50 | 2119402 | 2021424 | 97928 | 0.0113 |
| autonomous-sdlc-harness:committer | Commit Task 5 | 26.1s | 8 | 2046 | 18 | 215789 | 202220 | 13551 | 0.0021 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 22 | 1m 27s | 15 | 8305 | 32 | 1092761 | 1021506 | 71223 | 0.0069 |
| autonomous-sdlc-harness:committer | Commit Task 22 | 25.4s | 5 | 2185 | 12 | 149004 | 134639 | 14353 | 0.002 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 6 | 3m 46s | 26 | 22581 | 54 | 2877380 | 2750139 | 127187 | 0.0178 |
| autonomous-sdlc-harness:committer | Commit Task 6 | 27.3s | 8 | 2281 | 18 | 228351 | 212226 | 16107 | 0.0022 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 7 | 6m 13s | 26 | 36326 | 54 | 2923491 | 2786868 | 136569 | 0.0294 |
| autonomous-sdlc-harness:committer | Commit Task 7 | 38.1s | 8 | 2380 | 18 | 214375 | 188417 | 25940 | 0.003 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 8 | 4m 19s | 18 | 22605 | 38 | 1780952 | 1666450 | 114464 | 0.0205 |
| autonomous-sdlc-harness:committer | Commit Task 8 | 34.8s | 9 | 2146 | 20 | 235428 | 222359 | 13049 | 0.0027 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 9 | 5m 17s | 27 | 32019 | 56 | 2743079 | 2621970 | 121053 | 0.025 |
| autonomous-sdlc-harness:committer | Commit Task 9 | 28.6s | 8 | 1956 | 18 | 216712 | 190335 | 26359 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 10 | 2m 20s | 13 | 14568 | 28 | 1071646 | 975457 | 96161 | 0.011 |
| autonomous-sdlc-harness:committer | Commit Task 10 | 28.4s | 9 | 2359 | 20 | 239312 | 225969 | 13323 | 0.0022 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 11 | 4m 45s | 43 | 28892 | 88 | 4559373 | 4422221 | 137064 | 0.0225 |
| autonomous-sdlc-harness:committer | Commit Task 11 | 25.2s | 7 | 1973 | 16 | 207737 | 192153 | 15568 | 0.002 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 12 | 1m 22s | 10 | 7910 | 22 | 463612 | 425029 | 38561 | 0.0065 |
| autonomous-sdlc-harness:committer | Commit Task 12 | 30.7s | 9 | 2258 | 20 | 240985 | 227405 | 13560 | 0.0024 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 13 | 2m 09s | 16 | 11021 | 34 | 955730 | 896761 | 58935 | 0.0102 |
| autonomous-sdlc-harness:committer | Commit Task 13 | 27.9s | 8 | 2209 | 18 | 222846 | 208270 | 14558 | 0.0022 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 14 | 1m 36s | 16 | 8674 | 34 | 1243932 | 1168917 | 74981 | 0.0076 |
| autonomous-sdlc-harness:committer | Commit Task 14 | 28.2s | 8 | 2211 | 18 | 220068 | 205665 | 14385 | 0.0022 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 15 | 1m 36s | 16 | 9242 | 34 | 782088 | 735019 | 47035 | 0.0076 |
| autonomous-sdlc-harness:committer | Commit Task 15 | 33.5s | 10 | 2670 | 22 | 275583 | 260501 | 15060 | 0.0026 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 16 | 2m 12s | 18 | 14568 | 38 | 1087596 | 1023716 | 63842 | 0.0104 |
| autonomous-sdlc-harness:committer | Commit Task 16 | 31.7s | 9 | 2433 | 20 | 249897 | 234101 | 15776 | 0.0025 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 17 | 1m 53s | 15 | 11446 | 32 | 1030567 | 961032 | 69503 | 0.0089 |
| autonomous-sdlc-harness:committer | Commit Task 17 | 25.4s | 8 | 1930 | 18 | 219997 | 205787 | 14192 | 0.002 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 23 | 1m 01s | 9 | 5720 | 20 | 377640 | 344768 | 32852 | 0.0048 |
| autonomous-sdlc-harness:committer | Commit Task 23 | 31.0s | 10 | 2332 | 22 | 301791 | 283753 | 18016 | 0.0024 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 18 | 3m 32s | 22 | 21988 | 46 | 1923595 | 1814123 | 109426 | 0.0168 |
| autonomous-sdlc-harness:committer | Commit Task 18 | 36.8s | 9 | 2386 | 20 | 265040 | 247749 | 17271 | 0.0029 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 19 | 2m 26s | 15 | 17049 | 32 | 1001600 | 931122 | 70446 | 0.0115 |
| autonomous-sdlc-harness:committer | Commit Task 19 | 28.3s | 8 | 2261 | 18 | 226655 | 210918 | 15719 | 0.0022 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 20 | 1m 33s | 14 | 10086 | 30 | 738975 | 687529 | 51416 | 0.0074 |
| autonomous-sdlc-harness:committer | Commit Task 20 | 28.9s | 8 | 2253 | 18 | 233682 | 217940 | 15724 | 0.0023 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 21 | 4m 22s | 23 | 29399 | 48 | 3296036 | 3126257 | 169731 | 0.0207 |
| autonomous-sdlc-harness:committer | Commit Task 21 | 31.1s | 7 | 2058 | 16 | 190597 | 177554 | 13027 | 0.0025 |
| autonomous-sdlc-harness:architecture-reviewer | Branch architecture review | 1m 41s | 18 | 10637 | 38 | 1659939 | 1518478 | 141423 | 0.008 |
| autonomous-sdlc-harness:committer | Commit arch review index | 20.2s | 5 | 1516 | 12 | 142597 | 130121 | 12464 | 0.0016 |
| autonomous-sdlc-harness:layer-implementer | Fix arch Finding 1 | 1m 29s | 14 | 8767 | 30 | 616219 | 581034 | 35155 | 0.0071 |
| autonomous-sdlc-harness:committer | Commit arch Finding 1 | 28.0s | 8 | 2305 | 18 | 222562 | 208062 | 14482 | 0.0022 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch code review | 7m 58s | 64 | 43821 | 130 | 11820753 | 11550020 | 270603 | 0.0377 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 54.1s | 8 | 5438 | 18 | 557497 | 461162 | 96317 | 0.0043 |
| autonomous-sdlc-harness:committer | Commit code review | 22.0s | 5 | 1567 | 12 | 138071 | 113737 | 24322 | 0.0017 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 3 | 33.0s | 9 | 2655 | 20 | 391603 | 345141 | 46442 | 0.0026 |
| autonomous-sdlc-harness:committer | Commit code-review Finding 3 | 30.4s | 7 | 2615 | 16 | 191308 | 177496 | 13796 | 0.0024 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 2 | 41.8s | 9 | 3339 | 20 | 499095 | 448616 | 50459 | 0.0033 |
| autonomous-sdlc-harness:committer | Commit code-review Finding 2 | 28.3s | 7 | 2347 | 16 | 199226 | 183576 | 15634 | 0.0022 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review Finding 1 | 43.0s | 8 | 3654 | 18 | 352115 | 318199 | 33898 | 0.0034 |
| autonomous-sdlc-harness:committer | Commit code-review Finding 1 | 28.6s | 8 | 2196 | 18 | 217639 | 203646 | 13975 | 0.0023 |
| autonomous-sdlc-harness:skeptic-reviewer | Adversarial skeptic review | 8m 18s | 53 | 43513 | 108 | 8642953 | 8387212 | 255633 | 0.0393 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review skeptic review | 1m 26s | 15 | 7959 | 32 | 1020034 | 925539 | 94463 | 0.0068 |
| autonomous-sdlc-harness:skeptic-reviewer | Adjust skeptic review | 1m 05s | 12 | 7640 | 26 | 459840 | 425186 | 34628 | 0.0052 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review skeptic review | 1m 15s | 13 | 7012 | 28 | 954841 | 872889 | 81924 | 0.0059 |
| autonomous-sdlc-harness:committer | Commit skeptic review | 23.2s | 5 | 1802 | 12 | 139897 | 115304 | 24581 | 0.0018 |
| autonomous-sdlc-harness:layer-implementer | Fix skeptic Finding 1 | 42.8s | 8 | 3633 | 18 | 397038 | 341576 | 55444 | 0.0034 |
| autonomous-sdlc-harness:committer | Commit skeptic Finding 1 | 33.1s | 9 | 2151 | 20 | 249744 | 234570 | 15154 | 0.0026 |
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 41.3s | 8 | 4912 | 18 | 291475 | 251450 | 40007 | 0.0033 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $91.90 |
| Cost — claude-opus-5-5 | $91.90 |
| Input tokens (uncached) | 3178 |
| Total input tokens (incl. cache) | 218508020 |
| Output tokens | 1001658 |
| Thinking tokens (main thread) | 3358 |
| Cache read tokens | 212875370 |
| Cache write tokens | 5629472 |
| Cache write tokens, main thread (5m / 1h) | 0 / 378325 |
| Cache hit ratio | 0.9742 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 710 | 94239357 | 9920 | 93860322 | 378325 |
| sub-agents | 2468 | 124268663 | 924886 | 119015048 | 5251147 |
| remainder | 0 | 0 | 66852 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 56 |
| Sub-agents spawned / failed / killed | 73 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 391 |
| Time to first token | 1.5s |
| Rate-limit peak | five_hour 0.6, seven_day 0.2 |
