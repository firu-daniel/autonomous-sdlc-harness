# Run analytics — feat_doctor_protected_branch_ruleset_check

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 1h22m |
| Wall | 1h22m |
| Active | 1h22m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $34.49 |
| Input tokens (uncached) | 1470 |
| Total input tokens (incl. cache) | 83225552 |
| Output tokens | 320199 |
| Thinking tokens (main thread) | 2262 |
| Cache read tokens | 81033314 |
| Cache write tokens | 2190768 |
| Cache write tokens, main thread (5m / 1h) | 0 / 305679 |
| Cache hit ratio | 0.9737 |
| Requests | 698 |
| Request latency p50 / p90 / p99 / max | 1.7s / 5.6s / 36.0s / 1m 11s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 9 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 8m 12s (session 1) |
| Rate-limit peak | seven_day 0.8 |

## Gate rounds

Wait is the orchestrator's wait on `run-test-suite.sh --wait <label>`, summed over every polling row whose command ends in that label; — when none matches, as for a label waited on fewer than three times in a session (no polling row is written for it) or a command cut at 160 characters.

A phase's test-file total sums each file's own seconds, so it exceeds the gate's wall time when files run in parallel.

### Round task_round_1 — pass

| Measure | Value |
|---|---|
| Wait (every run of task_round_1) | 26m 41s |
| Gate rows | 29 (complete) |
| Test files — full | 177 files, 12352.9 s summed |

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
| full | 3e | ok | 0 s |
| full | 3f | ok | 0 s |
| full | 4 | ok | 1617 s |
| full | 6a | ok | 1 s |
| full | 6b | ok | 0 s |
| full | 6c | ok | 1 s |
| full | 6d | ok | 2 s |
| full | 6e | ok | 1 s |
| full | 6f | ok | 0 s |
| full | 11 | ok | 17 s |
| full | 13a | BLOCKED | 0 s |
| full | 13b | BLOCKED | 0 s |
| full | 13c | BLOCKED | 0 s |
| full | 13d | SKIPPED | 0 s |
| full | 14a | ok | 1 s |
| full | 14b | ok | 0 s |
| full | 14c | ok | 2 s |
| full | 14d | SKIPPED | 0 s |
| full | 16 | ok | 1 s |

#### Slowest test files — full (10 of 177)

| File | Status | Seconds | Tests | Failed |
|---|---|---|---|---|
| test/watcher-review-drop-payloads.test.mjs | pass | 786.0 | 21 | 0 |
| test/watcher-remote-job.test.mjs | pass | 619.9 | 29 | 0 |
| test/watcher-placeholder-host.test.mjs | pass | 604.4 | 27 | 0 |
| test/watcher-remote-dispatch.test.mjs | pass | 583.4 | 17 | 0 |
| test/remote-run.test.mjs | pass | 548.3 | 130 | 0 |
| test/watcher-run-profile.test.mjs | pass | 519.6 | 21 | 0 |
| test/watcher-stall-reset-payloads.test.mjs | pass | 474.8 | 18 | 0 |
| test/remote-control.test.mjs | pass | 465.8 | 83 | 0 |
| test/remote-control-review.test.mjs | pass | 458.0 | 33 | 0 |
| test/doctor.test.mjs | pass | 423.3 | 1 | 0 |

## Session 1 — 2026-11-09T18:11:30.653Z → 2026-11-09T19:33:39.928Z

Session id: `f39eef6e-6094-4744-9d0a-2c24c483f139`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h22m | 1h22m | 48m 42s | 0.0s | 0.0s | 1h22m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 698 | 1.7s | 5.6s | 36.0s | 1m 11s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 18 | 1.8s | 11.5s | 13.5s | 13.5s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 30 | 2.5s | 18.2s | 37.5s | 37.5s | 0 |
| autonomous-sdlc-harness:committer | 118 | 1.6s | 4.0s | 7.0s | 8.0s | 0 |
| autonomous-sdlc-harness:layer-implementer | 185 | 2.1s | 5.4s | 33.6s | 48.4s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 15 | 2.4s | 3.9s | 9.6s | 9.6s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 30 | 2.2s | 11.8s | 26.0s | 26.0s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 6 | 1.5s | 17.0s | 17.0s | 17.0s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 27 | 2.6s | 8.4s | 14.9s | 14.9s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 47 | 3.0s | 27.1s | 1m 11s | 1m 11s | 0 |
| orchestrator | 222 | 1.2s | 1.9s | 3.2s | 7.8s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 37 | 46m 07s | 8m 12s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 14 | 2.1s | 0.1s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 21 | 3.1s | 0.3s |
| Bash | autonomous-sdlc-harness:committer | 162 | 1m 34s | 4.9s |
| Bash | autonomous-sdlc-harness:layer-implementer | 139 | 3m 46s | 1m 34s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 15 | 2.1s | 0.1s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 25 | 3.2s | 0.1s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 8 | 0.9s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 24 | 3.5s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 33 | 6.9s | 2.0s |
| Bash | orchestrator | 161 | 28m 21s | 1m 01s |
| Edit | autonomous-sdlc-harness:committer | 12 | 0.4s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 64 | 2.5s | 0.0s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 3 | 0.1s | 0.0s |
| Edit | orchestrator | 13 | 0.5s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 17 | 1.2s | 0.3s |
| Read | autonomous-sdlc-harness:branch-reviewer | 15 | 0.6s | 0.2s |
| Read | autonomous-sdlc-harness:committer | 17 | 0.2s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 76 | 4.7s | 1.8s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 20 | 1.0s | 0.2s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 11 | 0.4s | 0.2s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 14 | 0.4s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 18 | 1.2s | 0.2s |
| Read | orchestrator | 12 | 2.6s | 0.4s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 5 | 0.2s | 0.0s |
| Write | autonomous-sdlc-harness:layer-implementer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:skeptic-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 6 | 0.2s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | autonomous-sdlc-harness:layer-implementer | 2026-11-09T18:29:47.917Z | 1m 34s | 2248 | false | false |
| Bash | orchestrator | 2026-11-09T19:08:18.357Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T19:25:01.048Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T19:19:47.691Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T19:17:41.324Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T19:18:44.549Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T19:12:27.745Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T19:15:36.105Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T19:29:11.685Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-09T19:27:06.434Z | 1m 01s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/architecture_branch_reviews/feat_doctor_protected_branch_ruleset_check_arch_review. | 3 | 1.4s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> harness-runs/story_plans/feat_doctor_protected_branch_ruleset_check_story_plan.md harness-runs/t | 4 | 2.0s |
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 18 | 1m 10s |
| autonomous-sdlc-harness:committer | git branch --show-current | 13 | 1.6s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 14 | 1.6s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 14 | 1.7s |
| autonomous-sdlc-harness:committer | git status --short | 30 | 4.3s |
| autonomous-sdlc-harness:committer | grep -n -i -E 'scriptsDir\|stateDir' <repo_root>/harness.config.json | 3 | 0.3s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 14 | 1.6s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 10 | 24.2s |
| autonomous-sdlc-harness:layer-implementer | git diff --name-only HEAD | 3 | 4.7s |
| autonomous-sdlc-harness:layer-implementer | git ls-files --others --exclude-standard | 3 | 3.7s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 13 | 1.5s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/doctor-branch-protection.test.mjs | 3 | 14.1s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/main-anchor-isolation.test.mjs | 4 | 6.3s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/no-container-home-paths.test.mjs | 5 | 13.0s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/retrieval-loading.test.mjs | 6 | 30.9s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/feat_doctor_protected_branch_ruleset_check_progress.md" -- "chore: F | 13 | 5.5s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 17 | 1m 18s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; bash scripts/run-test-suite.sh --wait task_round_1 | 27 | 26m 41s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 33 | 4.5s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 8m 12s | 47 | 52431 | 96 | 7976732 | 7735847 | 240789 | 0.0999 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 36.9s | 7 | 3859 | 16 | 399049 | 321060 | 77973 | 0.0075 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural plan review | 2m 11s | 27 | 13360 | 56 | 2418347 | 2296052 | 122239 | 0.0267 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 | 2m 31s | 16 | 17576 | 34 | 886989 | 821851 | 65104 | 0.0308 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 29.6s | 10 | 2557 | 22 | 269589 | 242315 | 27252 | 0.006 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 | 4m 30s | 37 | 18849 | 76 | 2813248 | 2727679 | 85493 | 0.0548 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 28.7s | 9 | 2407 | 20 | 252241 | 236167 | 16054 | 0.0058 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 | 46.8s | 9 | 4892 | 20 | 357652 | 327964 | 29668 | 0.0095 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 26.4s | 7 | 2321 | 16 | 232519 | 212640 | 19863 | 0.0054 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 4 | 2m 47s | 23 | 18212 | 48 | 1577306 | 1492400 | 84858 | 0.0339 |
| autonomous-sdlc-harness:committer | Commit Task 4 | 26.5s | 9 | 2209 | 20 | 250580 | 234905 | 15655 | 0.0054 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 5 | 1m 53s | 25 | 12398 | 52 | 2105778 | 2008352 | 97374 | 0.023 |
| autonomous-sdlc-harness:committer | Commit Task 5 | 28.7s | 7 | 2540 | 16 | 202203 | 187235 | 14952 | 0.0058 |
| autonomous-sdlc-harness:architecture-reviewer | Branch architecture review | 1m 18s | 11 | 8820 | 24 | 887942 | 784283 | 103635 | 0.0158 |
| autonomous-sdlc-harness:committer | Commit architecture review | 21.8s | 6 | 1774 | 14 | 161318 | 149669 | 11635 | 0.0044 |
| autonomous-sdlc-harness:layer-implementer | Fix arch finding 1 | 42.5s | 9 | 4151 | 20 | 336994 | 310481 | 26493 | 0.0086 |
| autonomous-sdlc-harness:committer | Commit arch finding 1 fix | 29.7s | 7 | 2716 | 16 | 217637 | 198928 | 18693 | 0.006 |
| autonomous-sdlc-harness:layer-implementer | Fix arch finding 2 | 38.7s | 10 | 4143 | 22 | 365466 | 339644 | 25800 | 0.0079 |
| autonomous-sdlc-harness:committer | Commit arch finding 2 fix | 27.0s | 8 | 2348 | 18 | 214303 | 200942 | 13343 | 0.0055 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch code review | 4m 20s | 30 | 27626 | 62 | 2993678 | 2843207 | 150409 | 0.0529 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 38.3s | 9 | 4276 | 20 | 441526 | 360119 | 81387 | 0.0078 |
| autonomous-sdlc-harness:committer | Commit code review | 21.3s | 6 | 1712 | 14 | 165927 | 140620 | 25293 | 0.0043 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 4 | 24.5s | 9 | 1798 | 20 | 368042 | 326394 | 41628 | 0.005 |
| autonomous-sdlc-harness:committer | Commit code-review finding 4 | 28.1s | 8 | 2546 | 18 | 216359 | 202739 | 13602 | 0.0057 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 3 | 34.2s | 10 | 2959 | 22 | 461452 | 426729 | 34701 | 0.007 |
| autonomous-sdlc-harness:committer | Commit code-review finding 3 | 26.3s | 8 | 2288 | 18 | 213701 | 200355 | 13328 | 0.0053 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 2 | 50.6s | 11 | 4322 | 24 | 442221 | 411696 | 30501 | 0.0103 |
| autonomous-sdlc-harness:committer | Commit code-review finding 2 | 27.4s | 9 | 2301 | 20 | 238130 | 224636 | 13474 | 0.0056 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 1 | 56.0s | 11 | 5940 | 24 | 467011 | 430643 | 36344 | 0.0114 |
| autonomous-sdlc-harness:committer | Commit code-review finding 1 | 31.6s | 10 | 2680 | 22 | 261667 | 247999 | 13646 | 0.0064 |
| autonomous-sdlc-harness:skeptic-reviewer | Adversarial skeptic review | 3m 11s | 30 | 19275 | 62 | 1978646 | 1876824 | 101760 | 0.0389 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review skeptic review | 33.1s | 6 | 3461 | 14 | 291292 | 213085 | 78193 | 0.0067 |
| autonomous-sdlc-harness:committer | Commit skeptic review | 23.2s | 7 | 1866 | 16 | 194307 | 180721 | 13570 | 0.0047 |
| autonomous-sdlc-harness:layer-implementer | Fix skeptic finding 1 (cli) | 36.5s | 8 | 3180 | 18 | 311245 | 268860 | 42367 | 0.0074 |
| autonomous-sdlc-harness:layer-implementer | Fix skeptic finding 1 (general) | 36.7s | 7 | 3149 | 16 | 374675 | 319640 | 55019 | 0.0075 |
| autonomous-sdlc-harness:committer | Commit skeptic finding 1 | 27.0s | 7 | 2380 | 16 | 196696 | 182132 | 14548 | 0.0055 |
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 30.8s | 6 | 3909 | 14 | 167467 | 139007 | 28446 | 0.0063 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $34.49 |
| Cost — claude-opus-5-5 | $34.49 |
| Input tokens (uncached) | 1470 |
| Total input tokens (incl. cache) | 83225552 |
| Output tokens | 320199 |
| Thinking tokens (main thread) | 2262 |
| Cache read tokens | 81033314 |
| Cache write tokens | 2190768 |
| Cache write tokens, main thread (5m / 1h) | 0 / 305679 |
| Cache hit ratio | 0.9737 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 444 | 51515617 | 5841 | 51209494 | 305679 |
| sub-agents | 1026 | 31709935 | 273231 | 29823820 | 1885089 |
| remainder | 0 | 0 | 41127 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 9 |
| Sub-agents spawned / failed / killed | 37 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 228 |
| Time to first token | 1.4s |
| Rate-limit peak | seven_day 0.8 |
