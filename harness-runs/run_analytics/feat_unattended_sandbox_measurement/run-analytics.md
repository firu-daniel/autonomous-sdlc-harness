# Run analytics — feat_unattended_sandbox_measurement

## Whole run

| Measure | Value |
|---|---|
| Sessions | 1 (0 incomplete) |
| Span | 1h03m |
| Wall | 1h03m |
| Active | 1h00m |
| Host-suspended | 0.0s |
| Idle | 2m 45s |
| Cost | $28.20 |
| Input tokens | 130 |
| Output tokens | 16574 |
| Thinking tokens | 1771 |
| Cache read tokens | 7924985 |
| Cache write tokens (5m / 1h) | 0 / 138646 |
| Cache hit ratio | 0.9828 |
| Requests | 346 |
| Request latency p50 / p90 / p99 / max | 4.0s / 19.8s / 1m 14s / 2m 45s |
| Requests over the idle threshold | 1 |
| API retries | 0 |
| Permission denials | 14 |
| Sub-agents failed / killed | 0 / 0 |
| Slowest sub-agent | autonomous-sdlc-harness:task-plan-writer — Write task plan — 21m 27s (session 1) |
| Rate-limit peak | five_hour 0.09, seven_day 0.61 |

## Session 1 — 2026-10-26T21:40:00.135Z → 2026-10-26T22:43:02.966Z

Session id: `662e7279-d9bf-448c-81e5-0aff577a3888`

### Time

| Wall | duration_ms | duration_api_ms | Host-suspended | Idle | Active | Suspend source |
|---|---|---|---|---|---|---|
| 1h03m | 1h03m | 1h01m | 0.0s | 2m 45s | 1h00m | none |

### Idle gaps (over 120 s)

| Start | Length | Context | Class |
|---|---|---|---|
| 2026-10-26T21:47:31.239Z | 2m 45s | autonomous-sdlc-harness:task-plan-writer | in_flight_request |

### Request latency

| Context | Requests | p50 | p90 | p99 | Max | Over threshold |
|---|---|---|---|---|---|---|
| all | 346 | 4.0s | 19.8s | 1m 14s | 2m 45s | 1 |
| autonomous-sdlc-harness:architecture-reviewer | 75 | 3.4s | 15.0s | 26.6s | 26.6s | 0 |
| autonomous-sdlc-harness:task-plan-reviewer | 69 | 5.7s | 26.6s | 1m 18s | 1m 18s | 0 |
| autonomous-sdlc-harness:task-plan-writer | 137 | 6.0s | 24.9s | 1m 23s | 2m 45s | 1 |
| orchestrator | 65 | 2.2s | 3.4s | 9.9s | 9.9s | 0 |

### Tool time

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent | orchestrator | 12 | 59m 04s | 21m 27s |
| Bash | autonomous-sdlc-harness:architecture-reviewer | 39 | 5.2s | 0.2s |
| Bash | autonomous-sdlc-harness:task-plan-reviewer | 49 | 14.4s | 5.9s |
| Bash | autonomous-sdlc-harness:task-plan-writer | 78 | 14.5s | 0.7s |
| Bash | orchestrator | 49 | 16.3s | 4.5s |
| Edit | autonomous-sdlc-harness:task-plan-writer | 73 | 1.5s | 0.0s |
| Read | autonomous-sdlc-harness:architecture-reviewer | 128 | 4.9s | 0.3s |
| Read | autonomous-sdlc-harness:task-plan-reviewer | 74 | 2.2s | 0.2s |
| Read | autonomous-sdlc-harness:task-plan-writer | 66 | 2.6s | 0.4s |
| Read | orchestrator | 7 | 1.2s | 0.3s |
| Skill | orchestrator | 1 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:architecture-reviewer | 3 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-reviewer | 2 | 0.0s | 0.0s |
| Write | autonomous-sdlc-harness:task-plan-writer | 31 | 0.7s | 0.0s |
| Write | orchestrator | 2 | 0.0s | 0.0s |

#### Slowest calls

| Tool | Context | Started | Duration | Result bytes | Error | Permission denied |
|---|---|---|---|---|---|---|
| Agent | orchestrator | 2026-10-26T21:41:07.193Z | 21m 27s | 3520 | false | false |
| Agent | orchestrator | 2026-10-26T22:23:58.966Z | 9m 56s | 4438 | false | false |
| Agent | orchestrator | 2026-10-26T22:35:40.976Z | 6m 35s | 897 | false | false |
| Agent | orchestrator | 2026-10-26T22:17:34.574Z | 6m 12s | 897 | false | false |
| Agent | orchestrator | 2026-10-26T22:02:47.436Z | 2m 41s | 3166 | false | false |
| Agent | orchestrator | 2026-10-26T22:11:21.957Z | 2m 10s | 900 | false | false |
| Agent | orchestrator | 2026-10-26T22:13:43.247Z | 2m 07s | 4087 | false | false |
| Agent | orchestrator | 2026-10-26T22:07:37.412Z | 1m 51s | 900 | false | false |
| Agent | orchestrator | 2026-10-26T22:05:41.168Z | 1m 45s | 3797 | false | false |
| Agent | orchestrator | 2026-10-26T22:09:40.145Z | 1m 30s | 4472 | false | false |

#### Polling loops

| Context | Command | Count | Total |
|---|---|---|---|
| autonomous-sdlc-harness:architecture-reviewer | git rev-parse --show-toplevel | 5 | 0.6s |
| autonomous-sdlc-harness:task-plan-writer | git rev-parse --show-toplevel | 5 | 0.6s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_unattended_sandbox_measurement --outcome FAIL --findings harness-runs/architecture_revie | 3 | 0.5s |
| orchestrator | bash scripts/flow-walker.sh next --flow task_plan_writing --branch feat_unattended_sandbox_measurement --outcome returned | 5 | 1.1s |
| orchestrator | ls harness-runs/STOP harness-runs/PAUSE 2>/dev/null; cat harness-runs/.dispatch_counter 2>/dev/null \|\| echo 0 | 11 | 1.5s |

### Sub-agents

| Type | Description | Duration | Requests | Output tokens | Input tokens | Cache read tokens | Cache write tokens | Wall share |
|---|---|---|---|---|---|---|---|---|
| autonomous-sdlc-harness:task-plan-writer | Write task plan | 21m 27s | 67 | 677 | 134 | 12761915 | 541496 | 0.3404 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture review of plan | 2m 41s | 16 | 167 | 32 | 1543211 | 148708 | 0.0427 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 1m 45s | 12 | 144 | 24 | 451703 | 52813 | 0.028 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 51s | 16 | 175 | 32 | 1155837 | 109812 | 0.0294 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 1m 30s | 9 | 83 | 18 | 325915 | 39805 | 0.0238 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 2m 10s | 19 | 201 | 38 | 1838844 | 129614 | 0.0345 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 2m 07s | 14 | 141 | 28 | 656931 | 56189 | 0.0337 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 23s | 13 | 156 | 26 | 934646 | 112117 | 0.0219 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural review of task plan | 6m 12s | 35 | 309 | 70 | 4746772 | 207505 | 0.0986 |
| autonomous-sdlc-harness:task-plan-writer | Revise task plan | 9m 56s | 35 | 335 | 70 | 3516947 | 167927 | 0.1577 |
| autonomous-sdlc-harness:architecture-reviewer | Architecture re-review of plan | 1m 22s | 11 | 100 | 22 | 840148 | 139145 | 0.0219 |
| autonomous-sdlc-harness:task-plan-reviewer | Structural re-review of task plan | 6m 35s | 34 | 325 | 68 | 4866892 | 232920 | 0.1045 |

### Cost and tokens

| Measure | Value |
|---|---|
| Cost | $28.20 |
| Cost — claude-opus-4-8 | $4.39 |
| Cost — claude-opus-5-5 | $23.81 |
| Input tokens | 130 |
| Output tokens | 16574 |
| Thinking tokens | 1771 |
| Cache read tokens | 7924985 |
| Cache write tokens (5m / 1h) | 0 / 138646 |
| Cache hit ratio | 0.9828 |

### Reliability

| Measure | Value |
|---|---|
| API retries | 0 |
| Permission denials | 14 |
| Sub-agents spawned / failed / killed | 12 / 0 / 0 |
| terminal_reason | completed |
| stop_reason | end_turn |
| Turns | 73 |
| Time to first token | 3.1s |
| Rate-limit peak | five_hour 0.09, seven_day 0.61 |
