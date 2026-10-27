`fix_run_analytics_token_accounting` makes the token counts in `run-analytics.md` / `run-analytics.json` true, and makes the `### Tool time` table stop presenting sub-agent wall time as tool time. Both defects are in `scripts/lib/run-analytics.jq` (with its template twin `cli/templates/scripts/lib/run-analytics.jq`) and `scripts/lib/run-analytics-report.jq`. Both were found reading the `feat_unattended_sandbox_measurement` report on 2026-10-27.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Verify every claim marked *verify* before planning on it.

> **Evidence you cannot open.** The figures below were measured on the operator's machine from files this run has no access to: the `feat_unattended_sandbox_measurement` report and its `.stream.jsonl`, and the sub-agent transcripts under `~/.claude/projects/…`. Take them as given and do not try to read those paths. Claims about the real stream that only those files could settle are marked *unverifiable here*: design so the fix is correct whichever way they fall, and say in the plan which assumption each fixture encodes.

---

## What is wrong today

### 1. Sub-agent tokens are undercounted by roughly two orders of magnitude

`run-analytics.jq` reads one headless `stream-json` file (`<state_dir>/autonomous_logs/<branch>.stream.jsonl`). It takes each request's usage from the last `assistant` event carrying that `message.id` (`def req_usage`, and `on_assistant`, "usage from its last event"). For the **orchestrator** that works. For **sub-agent** messages (events with a `parent_tool_use_id`), the stream carries in-progress usage, not the final value:

| Same request, `msg_011CgRaKub7nRiJSyZLhTKkc` (first task-plan-writer) | `output_tokens` |
|---|---|
| headless stream (`…stream.jsonl`) | 21 |
| sub-agent transcript on disk (`~/.claude/projects/<slug>/<session>/subagents/agent-a70bd67b5381e6a24.jsonl`) | 342 |

Effect on the `feat_unattended_sandbox_measurement` report:

| Figure | Report | Truth | Source of truth |
|---|---|---|---|
| task-plan-writer "Write task plan": output tokens | 677 | 100,845 | its transcript, last usage per `message.id`, summed |
| task-plan-writer "Write task plan": input tokens | 134 (exactly 2 per request) | not measured | its transcript |
| Session 1 output tokens | 16,574 | 344,953 | `result.modelUsage`, summed across models |
| Session 1 cache read tokens | 7,924,985 | 43,536,569 | `result.modelUsage` |
| Session 2 output tokens | 99,035 | 1,131,563 | `result.modelUsage` |

Every sub-agent row in `### Sub-agents` shows the same pattern. The session `### Cost and tokens` totals look like `result.usage`, which in this stream appears to cover only the main thread (*unverifiable here*), not `result.modelUsage`, which covers everything. Cost (`total_cost_usd`, and per model from `modelUsage`) is correct: $23.81 + $4.39 = $28.20. The cache hit ratio and `Thinking tokens` are computed from the wrong totals too (*verify* in the jq).

Sources investigated that do **not** carry final per-sub-agent totals:
- `system/task_progress` and `system/task_notification` carry `usage.total_tokens`, `tool_uses` and `duration_ms` only, with no input/output/cache split.
- The orchestrator-side `user` event's `tool_use_result.usage` for an `Agent` call is the sub-agent's **last turn** only (e.g. `output_tokens: 1024` for the 100k-output writer). `tool_use_result.totalTokens` looks like the final turn's context size, not a cumulative sum (*unverifiable here*).

Sources that do:
- **`result.modelUsage`**, per session and per model: `inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens`, `costUSD`.
- **The on-disk sub-agent transcripts** `~/.claude/projects/<slug>/<session_id>/subagents/agent-<agentId>.jsonl`. Each `assistant` line has the final `message.usage`, plus `message.model` and `requestedModel`. The `agentId` links a transcript to its dispatch (the `task_*` events' `task_id`, and `tool_use_result.agentId`).

**Constraint on transcripts:** `remote-run.sh` launches GitHub runs with `--no-session-persistence` (*verify* where, and whether the local watcher ever does). A GitHub run has no transcripts, so any design that depends on them must degrade cleanly there. It must also not depend on the `<slug>` spelling Claude Code uses for a project directory: derive it, or locate the file by `session_id` and `agentId`, and say in the plan which.

### 2. `### Tool time` reports sub-agent wall time as orchestrator tool time

A tool call's duration is `tool_use` → `tool_result` (`add_call` / `on_user`). For `Agent`/`Task` that span is the whole sub-agent run. So the report's top row was:

| Tool | Context | Calls | Total | Max |
|---|---|---|---|---|
| Agent | orchestrator | 12 | 59m 04s | 21m 27s |

in a 1h03m session, and 3h02m in a 4h01m one. It reads as the orchestrator spending an hour in tools. It also double-counts everything the sub-agents' own rows already show. `#### Slowest calls` is consequently just the sub-agent list again: all ten rows are `Agent`.

## The goal

1. **True token counts, everywhere the report shows tokens:** whole run, per session, per context in `### Request latency`'s underlying `requests.items`, and per row of `### Sub-agents`. The plan chooses the source:
   - (a) session totals from `result.modelUsage`, plus per-sub-agent figures from transcripts when present;
   - (b) transcripts as the single source, with the stream as fallback;
   - (c) something better found while planning.

   Whatever it picks, it must say how a run with no transcripts (GitHub, `--no-session-persistence`) is reported. That means an explicit "not available" (`null`, rendered as `—` or with a note), **never** a silently small number. Keep the per-model cost split.
2. **No silent mixing.** If session totals come from `modelUsage` and per-context figures from somewhere else, the report must not show per-context numbers that cannot add up to the totals without saying so. Decide whether a reconciliation line or a check (sum of contexts vs session total, with the orchestrator as the remainder) is worth carrying.
3. **The `Agent` row: relabel or split. The plan decides.** The operator leans towards **relabelling**: keep the row, but name it as what it is (sub-agent wall time, the time the orchestrator was blocked on dispatches), and keep `Agent` calls out of `#### Slowest calls` or mark them there. Splitting (moving `Agent` out of `### Tool time` into its own table, or deriving the orchestrator's own tool time) is the alternative. Whichever the plan picks, state why, and keep the JSON field names stable unless a rename is required. If one is, list every consumer of `tools.by_tool` and `tools.slowest`; `branch-status` reads run-analytics fields (`run-analytics-report.jq` header).
4. **Template parity.** `scripts/lib/run-analytics*.jq` and `cli/templates/scripts/lib/run-analytics*.jq` stay byte-identical, by whatever route the repository already enforces that (*verify*). Keep the jq 1.5 floor stated in the file header: no `--rawfile`, no `$ARGS.named`, no regex. If transcripts are read, `run-analytics.sh` locates and feeds them, per the header's division of labour ("locating files … are run-analytics.sh's").
5. **Tests.** Fixture streams (and transcripts, if used) under `cli/test/` covering:
   - a sub-agent whose stream usage is partial and whose transcript is final;
   - a session with no transcripts;
   - a `result` whose `usage` and `modelUsage` disagree, as they do in real runs;
   - an `Agent` call in `### Tool time`, asserting the chosen label or layout.

   For each test, name the mutation that turns it red, and record that it was run red once.
6. **The run proves the fix with goal 5's fixtures only.** It does not re-measure any earlier branch's real stream. Acceptance against real run data is the operator's, after merge.

## Out of scope

- Permission-denial, committer-overhead and planning-churn findings from the same report.
