# Run analytics — fix_docs_flow_main_repo_binding

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 1h15m |
| Wall | 1h15m |
| Active | 1h15m |
| Host-suspended | 0.0s |
| Idle | 0.0s |
| Cost | $30.81 |
| Input tokens (uncached) | 1250 |
| Total input tokens (incl. cache) | 71476191 |
| Output tokens | 280013 |
| Thinking tokens (main thread) | 2691 |
| Cache read tokens | 69390023 |
| Cache write tokens | 2084918 |
| Cache write tokens, main thread (5m / 1h) | 0 / 302154 |
| Cache hit ratio | 0.9708 |
| Requests | 592 |
| Request latency p50 / p90 / p99 / max | 1.9s / 5.2s / 28.0s / 1m 43s |
| Requests over the idle threshold | 0 |
| API retries | 0 |
| Permission denials | 15 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 9m 20s (session 1) |
| Rate-limit peak | seven_day 0.08 |

## Network refusals

1 of 1 sessions scanned.

No refused network call.

## Possible network attempts in gate logs (best effort)

Lines in finished Run gates logs that carry a proxy refusal string or a plain connect error (`ECONNREFUSED`, `ENETUNREACH`, `EHOSTUNREACH`, `EAI_AGAIN`). They are listed as possible attempts, not refusals. What this list cannot show:

- a test that catches the error and passes leaves no trace;
- a plain connect error cannot be told apart from a host that is unreachable for another reason;
- on macOS, Seatbelt's own violation records go to the system log, not to the test output;
- a test whose name or output quotes one of these strings is listed too.

No possible network attempt in 1 round logs.

## Gate rounds

Wait is the orchestrator's wait on `run-test-suite.sh --wait <label>`, summed over every polling row whose command ends in that label; — when none matches, as for a label waited on fewer than three times in a session (no polling row is written for it) or a command cut at 160 characters.

A phase's test-file total sums each file's own seconds, so it exceeds the gate's wall time when files run in parallel.

### Round task_round_1 — pass

| Measure | Value |
|---|---|
| Wait (every run of task_round_1) | 27m 25s |
| Gate rows | 29 (complete) |
| Test files — full | 185 files, 12748.9 s summed |

| Phase | Gate | Status | Seconds |
|---|---|---|---|
| full | 1 | ok | 1 s |
| full | 2a | ok | 1 s |
| full | 2b | ok | 0 s |
| full | 2c | ok | 0 s |
| full | 2d | ok | 0 s |
| full | 2e | ok | 0 s |
| full | 3a | ok | 0 s |
| full | 3b | ok | 1 s |
| full | 3c | ok | 1 s |
| full | 3d | ok | 0 s |
| full | 3e | ok | 0 s |
| full | 3f | ok | 1 s |
| full | 4 | ok | 1661 s |
| full | 6a | ok | 2 s |
| full | 6b | ok | 0 s |
| full | 6c | ok | 1 s |
| full | 6d | ok | 4 s |
| full | 6e | ok | 0 s |
| full | 6f | ok | 1 s |
| full | 11 | ok | 18 s |
| full | 13a | BLOCKED | 0 s |
| full | 13b | BLOCKED | 0 s |
| full | 13c | BLOCKED | 0 s |
| full | 13d | SKIPPED | 0 s |
| full | 14a | ok | 1 s |
| full | 14b | ok | 0 s |
| full | 14c | ok | 2 s |
| full | 14d | SKIPPED | 0 s |
| full | 16 | ok | 1 s |

#### Slowest test files — full (10 of 185)

| File | Status | Seconds | Tests | Failed |
|---|---|---|---|---|
| test/watcher-review-drop-payloads.test.mjs | pass | 779.9 | 21 | 0 |
| test/watcher-remote-job.test.mjs | pass | 623.3 | 29 | 0 |
| test/watcher-placeholder-host.test.mjs | pass | 598.2 | 27 | 0 |
| test/watcher-remote-dispatch.test.mjs | pass | 575.2 | 17 | 0 |
| test/remote-run.test.mjs | pass | 552.1 | 130 | 0 |
| test/watcher-run-profile.test.mjs | pass | 512.1 | 21 | 0 |
| test/remote-control-review.test.mjs | pass | 467.2 | 33 | 0 |
| test/watcher-stall-reset-payloads.test.mjs | pass | 466.7 | 18 | 0 |
| test/remote-control.test.mjs | pass | 464.1 | 83 | 0 |
| test/doctor.test.mjs | pass | 462.7 | 1 | 0 |

## Session 1 — 2026-11-10T18:10:33.062Z → 2026-11-10T19:25:40.576Z

Session id: `74fcf31a-bfdd-4087-b670-f0375d928398`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h15m | 1h15m | 42m 58s | 0.0s | 0.0s | 1h15m | none |

### Idle gaps (over 120 s)

None.

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 592 | 1.9s | 5.2s | 28.0s | 1m 43s | 0 |
| autonomous-sdlc-harness:architecture-reviewer | 22 | 2.0s | 8.2s | 15.6s | 15.6s | 0 |
| autonomous-sdlc-harness:branch-reviewer | 33 | 3.4s | 12.4s | 29.6s | 29.6s | 0 |
| autonomous-sdlc-harness:committer | 91 | 1.7s | 4.4s | 5.8s | 5.8s | 0 |
| autonomous-sdlc-harness:layer-implementer | 129 | 2.2s | 3.7s | 7.5s | 10.1s | 0 |
| autonomous-sdlc-harness:prompt-injection-reviewer | 1 | 1.8s | 1.8s | 1.8s | 1.8s | 0 |
| autonomous-sdlc-harness:review-plan-reviewer | 14 | 2.2s | 4.0s | 11.5s | 11.5s | 0 |
| autonomous-sdlc-harness:skeptic-reviewer | 27 | 2.7s | 12.4s | 17.9s | 17.9s | 0 |
| autonomous-sdlc-harness:statistics-plan-writer | 7 | 1.8s | 18.6s | 18.6s | 18.6s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 30 | 3.6s | 12.6s | 26.8s | 26.8s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 41 | 3.8s | 28.0s | 1m 43s | 1m 43s | 0 |
| orchestrator | 197 | 1.5s | 2.0s | 7.6s | 8.7s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent — sub-agent wall time | orchestrator | 33 | 38m 17s | 9m 20s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 15 | 2.1s | 0.2s |
| Bash | autonomous-sdlc-harness:branch-reviewer | 24 | 4.4s | 0.6s |
| Bash | autonomous-sdlc-harness:committer | 143 | 1m 20s | 4.7s |
| Bash | autonomous-sdlc-harness:layer-implementer | 111 | 2m 58s | 23.8s |
| Bash | autonomous-sdlc-harness:review-plan-reviewer | 12 | 1.6s | 0.1s |
| Bash | autonomous-sdlc-harness:skeptic-reviewer | 21 | 2.8s | 0.3s |
| Bash | autonomous-sdlc-harness:statistics-plan-writer | 8 | 1.0s | 0.1s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 24 | 5.9s | 2.4s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 27 | 4.2s | 0.5s |
| Bash | orchestrator | 170 | 29m 43s | 1m 02s |
| Edit | autonomous-sdlc-harness:committer | 9 | 0.2s | 0.0s |
| Edit | autonomous-sdlc-harness:layer-implementer | 64 | 2.4s | 0.0s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 2 | 0.1s | 0.0s |
| Edit | orchestrator | 13 | 15.7s | 4.2s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 21 | 2.2s | 0.3s |
| Read | autonomous-sdlc-harness:branch-reviewer | 13 | 0.7s | 0.2s |
| Read | autonomous-sdlc-harness:committer | 8 | 0.1s | 0.0s |
| Read | autonomous-sdlc-harness:layer-implementer | 39 | 2.6s | 0.4s |
| Read | autonomous-sdlc-harness:prompt-injection-reviewer | 2 | 0.0s | 0.0s |
| Read | autonomous-sdlc-harness:review-plan-reviewer | 19 | 1.8s | 0.4s |
| Read | autonomous-sdlc-harness:skeptic-reviewer | 10 | 0.6s | 0.3s |
| Read | autonomous-sdlc-harness:statistics-plan-writer | 4 | 0.4s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 21 | 0.9s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 29 | 1.2s | 0.3s |
| Read | orchestrator | 14 | 10.2s | 4.0s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:branch-reviewer | 3 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:skeptic-reviewer | 2 | 0.1s | 0.0s |
| Write | autonomous-sdlc-harness:statistics-plan-writer | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 7 | 0.2s | 0.0s |
| Write | orchestrator | 4 | 0.1s | 0.0s |

`Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool.

#### Slowest calls (sub-agent dispatches excluded)

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Bash | orchestrator | 2026-11-10T18:59:27.340Z | 1m 02s | 19 | true | false |
| Bash | orchestrator | 2026-11-10T19:02:38.226Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-10T19:01:34.449Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-10T19:13:07.456Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-10T18:58:23.495Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-10T19:06:50.437Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-10T19:05:47.338Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-10T19:20:25.726Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-10T19:08:56.238Z | 1m 01s | 19 | true | false |
| Bash | orchestrator | 2026-11-10T19:16:15.368Z | 1m 01s | 19 | true | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:committer | bash <main_repo>/scripts/push-branch.sh <repo_root> | 13 | 1m 00s |
| autonomous-sdlc-harness:committer | git branch --show-current | 13 | 1.5s |
| autonomous-sdlc-harness:committer | git log -1 --oneline | 13 | 1.6s |
| autonomous-sdlc-harness:committer | git rev-parse --show-toplevel | 13 | 1.5s |
| autonomous-sdlc-harness:committer | git show --stat --format= HEAD | 3 | 0.3s |
| autonomous-sdlc-harness:committer | git status --short | 32 | 4.6s |
| autonomous-sdlc-harness:committer | grep -n -i -A40 "^## .*commit" <repo_root>/.claude/context/conventions.md | 6 | 0.7s |
| autonomous-sdlc-harness:committer | printenv HARNESS_MAIN_REPO | 13 | 1.5s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh | 4 | 29.6s |
| autonomous-sdlc-harness:layer-implementer | bash scripts/typecheck.sh 2>&1 \| tail -15 | 3 | 7.6s |
| autonomous-sdlc-harness:layer-implementer | git grep -c -F "printenv HARNESS_MAIN_REPO" -- plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructi | 3 | 0.3s |
| autonomous-sdlc-harness:layer-implementer | git rev-parse --show-toplevel | 10 | 1.1s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/main-repo-resolution-corpus.test.mjs | 12 | 39.0s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/no-container-home-paths.test.mjs | 3 | 28.4s |
| autonomous-sdlc-harness:layer-implementer | npm test --workspace cli -- test/untrusted-input-corpus.test.mjs | 3 | 30.8s |
| orchestrator | bash <main_repo>/scripts/commit-on-branch.sh --repo <repo_root> "harness-runs/flow_progress/fix_docs_flow_main_repo_binding_progress.md" -- "chore: Flow progres | 13 | 5.5s |
| orchestrator | bash <main_repo>/scripts/push-branch.sh <repo_root> | 18 | 1m 24s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; bash scripts/run-test-suite.sh --wait task_round_1 | 28 | 27m 25s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 20 | 11.0s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0; head -1 harness-runs/task_plans/fix_docs_flow_mai | 5 | 0.6s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens (uncached) | Total input tokens (incl. cache) | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:prompt-injection-reviewer | Screen task prompt | 4.4s | 1 | 370 | 4 | 30318 | 10577 | 19737 | 0.001 |
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 9m 20s | 41 | 64607 | 84 | 6915336 | 6647061 | 268191 | 0.1244 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 47.9s | 10 | 5038 | 22 | 820864 | 713174 | 107668 | 0.0106 |
| autonomous-sdlc-harness:task-plan-reviewer | Task plan review | 3m 10s | 30 | 18305 | 62 | 3501517 | 3339651 | 161804 | 0.0424 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 1 | 1m 19s | 14 | 8163 | 30 | 751915 | 690283 | 61602 | 0.0177 |
| autonomous-sdlc-harness:committer | Commit Task 1 | 26.5s | 7 | 2275 | 16 | 194721 | 168192 | 26513 | 0.0059 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 2 | 1m 03s | 14 | 5772 | 30 | 695607 | 654557 | 41020 | 0.0142 |
| autonomous-sdlc-harness:committer | Commit Task 2 | 27.3s | 8 | 2361 | 18 | 219128 | 205009 | 14101 | 0.0061 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 3 | 1m 17s | 16 | 8596 | 34 | 864697 | 814063 | 50600 | 0.0172 |
| autonomous-sdlc-harness:committer | Commit Task 3 | 25.2s | 7 | 2107 | 16 | 192112 | 178818 | 13278 | 0.0056 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 4 | 45.2s | 8 | 4566 | 18 | 371400 | 334550 | 36832 | 0.01 |
| autonomous-sdlc-harness:committer | Commit Task 4 | 28.0s | 8 | 2426 | 18 | 269704 | 249089 | 20597 | 0.0062 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 5 | 30.6s | 6 | 3137 | 14 | 244251 | 216907 | 27330 | 0.0068 |
| autonomous-sdlc-harness:committer | Commit Task 5 | 27.1s | 8 | 2222 | 18 | 213521 | 200432 | 13071 | 0.006 |
| autonomous-sdlc-harness:layer-implementer | Implement Task 6 | 2m 23s | 31 | 14511 | 64 | 1810633 | 1744234 | 66335 | 0.0319 |
| autonomous-sdlc-harness:committer | Commit Task 6 | 26.8s | 8 | 2206 | 18 | 231045 | 214631 | 16396 | 0.006 |
| autonomous-sdlc-harness:architecture-reviewer | Branch architecture review | 1m 17s | 12 | 7959 | 26 | 978776 | 850370 | 128380 | 0.0172 |
| autonomous-sdlc-harness:committer | Commit arch review index | 21.8s | 6 | 1547 | 14 | 165048 | 152799 | 12235 | 0.0048 |
| autonomous-sdlc-harness:layer-implementer | Fix arch finding 1 | 58.1s | 9 | 3693 | 20 | 380886 | 347366 | 33500 | 0.0129 |
| autonomous-sdlc-harness:committer | Commit arch finding 1 fix | 27.7s | 7 | 2399 | 16 | 191598 | 178194 | 13388 | 0.0062 |
| autonomous-sdlc-harness:branch-reviewer | End-of-branch review | 3m 26s | 33 | 21514 | 68 | 3516176 | 3363987 | 152121 | 0.0457 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review code review | 32.2s | 6 | 3445 | 14 | 380661 | 292325 | 88322 | 0.0071 |
| autonomous-sdlc-harness:committer | Commit code review | 18.7s | 5 | 1459 | 12 | 140828 | 128661 | 12155 | 0.0042 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 2 | 21.9s | 5 | 1940 | 12 | 192256 | 154658 | 37586 | 0.0049 |
| autonomous-sdlc-harness:committer | Commit code-review finding 2 | 24.9s | 7 | 2226 | 16 | 209005 | 193008 | 15981 | 0.0055 |
| autonomous-sdlc-harness:layer-implementer | Fix code-review finding 1 | 57.4s | 13 | 5209 | 28 | 499040 | 471030 | 27982 | 0.0128 |
| autonomous-sdlc-harness:committer | Commit code-review finding 1 | 24.8s | 7 | 2147 | 16 | 189088 | 176209 | 12863 | 0.0055 |
| autonomous-sdlc-harness:skeptic-reviewer | Adversarial skeptic review | 2m 23s | 27 | 15111 | 56 | 2188696 | 2075305 | 113335 | 0.0318 |
| autonomous-sdlc-harness:review-plan-reviewer | Meta-review skeptic review | 37.1s | 8 | 3904 | 18 | 427171 | 338551 | 88602 | 0.0082 |
| autonomous-sdlc-harness:committer | Commit skeptic review | 18.7s | 5 | 1432 | 12 | 137478 | 126181 | 11285 | 0.0042 |
| autonomous-sdlc-harness:layer-implementer | Fix skeptic finding 1 | 54.5s | 13 | 5260 | 28 | 549941 | 518188 | 31725 | 0.0121 |
| autonomous-sdlc-harness:committer | Commit skeptic finding 1 | 28.0s | 8 | 2362 | 18 | 214571 | 201259 | 13294 | 0.0062 |
| autonomous-sdlc-harness:statistics-plan-writer | Write branch statistics | 38.2s | 7 | 4706 | 16 | 293462 | 248511 | 44935 | 0.0085 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $30.81 |
| Cost — claude-opus-5-5 | $30.81 |
| Input tokens (uncached) | 1250 |
| Total input tokens (incl. cache) | 71476191 |
| Output tokens | 280013 |
| Thinking tokens (main thread) | 2691 |
| Cache read tokens | 69390023 |
| Cache write tokens | 2084918 |
| Cache write tokens, main thread (5m / 1h) | 0 / 302154 |
| Cache hit ratio | 0.9708 |
| Token source | result.modelUsage |

#### Token attribution

| Context | Input tokens (uncached) | Total input tokens (incl. cache) | Output tokens | Cache read tokens | Cache write tokens |
|---|---|---|---|---|---|
| orchestrator | 394 | 43494741 | 4672 | 43192193 | 302154 |
| sub-agents | 856 | 27981450 | 232975 | 26197830 | 1782764 |
| remainder | 0 | 0 | 42366 | 0 | 0 |

Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 15 |
| Sub-agents spawned / failed / killed | 33 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 237 |
| Time to first token | 1.7s |
| Rate-limit peak | seven_day 0.08 |
