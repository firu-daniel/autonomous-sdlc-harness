### Task 4 — Fixture streams, transcripts and cases proving the token and tool-time fixes, each with its red-turning mutation

**Goal:** Prove the branch's fix with fixtures only, through the `init`-written `run-analytics.sh` run against a throwaway fixture repository. Four cases are required:

- a sub-agent whose stream usage is partial and whose transcript is final;
- a session with no transcript;
- a `result` whose `usage` and `modelUsage` disagree;
- an `Agent` call in `### Tool time`.

Each case names the mutation that turns it red and records that it was run red once. The two existing suites are brought in line with the new record.

**Depends on:** Tasks 1, 2 and 3. Each produces part of what this task asserts:

- **Task 1:** the record's `cost.token_source`, `cost.cache_write_tokens`, `subagents[].agent_id` / `token_source`, `requests.items[].message_id` with `null` sub-agent tokens, and `tools.slowest` without `Agent`. Transcript linking comes from `tool_use_result.agentId` or a `system` `task_*` event's `task_id` + `tool_use_id`.
- **Task 2:** the `.run` keys `cache_write_tokens` and `token_sessions`, and these literal Markdown strings:
  - `Agent — sub-agent wall time`, plus the `` `Agent` / `Task` rows are sub-agent wall time: … `` note;
  - `#### Slowest calls (sub-agent dispatches excluded)`;
  - `#### Token attribution`, with rows `orchestrator` / `sub-agents` / `remainder`;
  - `<k> of <n> sub-agent dispatches have no transcript; their tokens are in the session total only.`;
  - `— in a token column: no transcript was found for this dispatch, …`;
  - the `Token source` values `result.modelUsage` and `not available`.
- **Task 3:** the transcript at `$CLAUDE_CONFIG_DIR/projects/*/<session_id>/subagents/agent-<agentId>.jsonl`.

This task edits no template and no `cli/src` file. A mutation run edits a template only temporarily, and that edit is reverted before the task ends.

### Targets

- `cli/test/fixtures/run-analytics-tokens.jsonl` (new). The two-session token stream.
- `cli/test/fixtures/run-analytics-transcripts/agent-a70bd67b5381e6a24.jsonl` (new). One sub-agent transcript.
- `cli/test/run-analytics-tokens.test.mjs` (new). The four cases.
- `cli/test/run-analytics.test.mjs`. Isolate the claude home, and update the sub-agent token assertion.
- `cli/test/watcher-run-analytics.test.mjs`. Isolate the claude home.

**Work:**

- [ ] **`run-analytics-tokens.jsonl`.** Two sessions. Timestamps are 2026-01-01 UTC, and usage keys are the stream's `output_tokens` / `input_tokens` / `cache_read_input_tokens` / `cache_creation_input_tokens`.
  - **Session `sess-tok` (transcript present, linked by `tool_use_result.agentId` only, with no `task_*` event):**
    - user 00:00:00.
    - assistant `m1` 00:00:01, usage out 40 / in 6 / read 1000 / write 200, `tool_use` `ag1` `Agent`, `subagent_type` `task-plan-writer`.
    - sub-agent (`parent_tool_use_id` `ag1`) assistant `sa1` at :03 (out 1, in 2) and again at :04 (out 21, in 2). The stream's last value is 21. Then `sa2` at :06 (out 3, in 2).
    - orchestrator user `tool_result` for `ag1` at :10. Its `tool_use_result` is `{"agentId":"a70bd67b5381e6a24","usage":{"output_tokens":1024},"totalTokens":99999}`, and the usage and total are decoys.
    - assistant `m2` :11 (out 10 / in 4 / read 1200 / write 0), `tool_use` `tb1` `Bash` `true`, with its `tool_result` at :12.
    - assistant `m3` :13 (out 5 / in 3 / read 1300 / write 0).
    - `result` :20, `duration_ms` 20000, `total_cost_usd` 1.0, `usage` {in 13, out 55, read 3500, write 200}.
    - `modelUsage`: `claude-opus-test` {inputTokens 17, outputTokens 897, cacheReadInputTokens 13800, cacheCreationInputTokens 500, costUSD 0.9} and `claude-haiku-test` {inputTokens 100, outputTokens 20, cacheReadInputTokens 0, cacheCreationInputTokens 0, costUSD 0.1}.
  - **Session `sess-bare` (no transcript, linked by a `task_*` event only):**
    - user 01:00:00.
    - assistant `m4` 01:00:01 (out 8, in 2), `tool_use` `ag2` `Agent`, `subagent_type` `code-reviewer`.
    - `{"type":"system","subtype":"task_started","task_id":"b0000000000000001","tool_use_id":"ag2"}`.
    - sub-agent assistant `sb1` :03 (out 2).
    - orchestrator `tool_result` for `ag2` at :08, with no `tool_use_result`.
    - assistant `m5` :09 (out 4, in 1).
    - `result` :10, `duration_ms` 10000, `total_cost_usd` 0.2, `usage` {in 3, out 12, read 0, write 0}, `modelUsage` `claude-opus-test` {in 50, out 300, read 0, write 0, costUSD 0.2}.
- [ ] **`agent-a70bd67b5381e6a24.jsonl`.** Claude Code transcript lines, in order:
  - a `user` line;
  - `assistant` `sa1` with usage out 1, in 2;
  - `assistant` `sa1` with out 342 / in 2 / read 5000 / write 300 (the final value);
  - one non-JSON line;
  - `assistant` `sa2` with out 500 / in 2 / read 5300 / write 0.

  Each `assistant` line carries `message.model` and `requestedModel`, as real ones do. Final per-dispatch totals are out 842, in 4, read 10300, write 300.
- [ ] **`run-analytics-tokens.test.mjs`.** Mirror `cli/test/run-analytics.test.mjs` → `adopted`: `createFixture` with `init`, then the stream copied to `<stateDir>/autonomous_logs/feat_x.stream.jsonl`, and every run with `RUN_ANALYTICS_SUSPEND_SOURCE: 'none'` and `--main-repo`. Every run also passes `CLAUDE_CONFIG_DIR` pointing at a fresh directory under `os.tmpdir()`, removed in `t.after`. For the transcript case, copy the transcript to `<home>/projects/-an-unrelated-slug/sess-tok/subagents/agent-a70bd67b5381e6a24.jsonl`. The slug is deliberately not one Claude Code would derive. No path inside this checkout is ever written to. The cases:
  - **(A) Partial stream, final transcript.** For `sess-tok`:
    - `subagents[0]` has `agent_id` `a70bd67b5381e6a24`, `token_source` `"transcript"`, `output_tokens` 842 (not 21 + 3, not 1024), `input_tokens` 4, `cache_read_tokens` 10300, `cache_write_tokens` 300;
    - the items with `message_id` `sa1` / `sa2` carry out 342 / 500.
  - **(B) No transcript.** For `sess-bare`:
    - `subagents[0].agent_id` is `b0000000000000001`, which proves the `task_*` carrier;
    - its four token fields and `token_source` are `null`, and item `sb1`'s tokens are `null`;
    - the Markdown's `### Sub-agents` row shows `—` and the `— in a token column: …` note;
    - its `#### Token attribution` `sub-agents` and `remainder` rows are `—`, with `1 of 1 sub-agent dispatches have no transcript; …`.

    Run the whole fixture a second time with an **empty** `CLAUDE_CONFIG_DIR`, and `sess-tok`'s sub-agent is `null` too.
  - **(C) `usage` and `modelUsage` disagree.**
    - `sess-tok`'s `cost` is in 117, out 917, read 13800, `cache_write_tokens` 500, `token_source` `"model_usage"`, and `cache_hit_ratio` 0.9572 (13800 / 14417). That is not `usage`'s out 55.
    - `cost.by_model` keeps both models' cost.
    - The attribution rows are orchestrator 13 / 55 / 3500 / 200, sub-agents 4 / 842 / 10300 / 300, remainder 100 / 20 / 0 / 0.
    - `.run.output_tokens` is 1217, `.run.token_sessions` 2, and the session `Token source` row reads `result.modelUsage`.
  - **(D) `Agent` in `### Tool time`.**
    - `sess-tok`'s `tools.by_tool` still holds `{tool: "Agent", context: "orchestrator", count: 1, total_ms: 9000, max_ms: 9000}` with its field names unchanged.
    - `tools.slowest` holds the `Bash` call and no `Agent`.
    - The Markdown carries the row `| Agent — sub-agent wall time | orchestrator | 1 | 9.0s | 9.0s |`, the `` `Agent` / `Task` rows are sub-agent wall time: `` note and the `#### Slowest calls (sub-agent dispatches excluded)` heading, and no `#### Slowest calls` row whose Tool cell is `Agent`.
- [ ] **Header and red runs.** The file opens with the rule it enforces: *a token figure in the record is either final or `null`, never the stream's partial sub-agent usage or a main-thread total standing in for the session's*. The header also states:
  - the hand-computed values above;
  - which *unverifiable here* assumption each fixture encodes: the two link carriers, transcript lines carrying `message.id` and `message.usage` as in the prompt, and `result.usage` as main-thread-only, which the `sess-tok` numbers are built to match;
  - that the resume-share assumption is deliberately not covered, and why.

  Per case, it names the mutation and records `run red once on fix_run_analytics_token_accounting`:
  - **A:** `transcripts` mode keeps the **first** usage per `message.id`.
  - **B:** `sessions` mode records sub-agent request usage from the stream again.
  - **C:** `cost` token totals read `$r.usage` instead of `modelUsage`.
  - **D:** the report drops the `— sub-agent wall time` relabel; separately, `slowest` stops excluding `Agent`.

  Apply each mutation to the template file, run this test file, see it fail, then restore the file with `git restore --source=HEAD -- <file>`.
- [ ] **Existing suites.**
  - **`run-analytics.test.mjs`:** every run passes `CLAUDE_CONFIG_DIR` set to a fresh empty temporary directory, so no case reads the real account home.
    - The sub-agent assertion `agent.output_tokens === 16` becomes `null`, with `agent.token_source === null`, and the header's sub-agent line explains why.
    - Add `two.cost.token_source === null` (dispatched, no `modelUsage`) and `one.cost.token_source === 'usage'` (no dispatch).
  - **`watcher-run-analytics.test.mjs`:** `PASS_ENV` gains `CLAUDE_CONFIG_DIR` naming a directory under `os.tmpdir()` that is never created.

**Verification:**

- `npm test --workspace cli -- test/run-analytics-tokens.test.mjs` passes, as one plain foreground command from the repository root.
- `npm test --workspace cli -- test/run-analytics.test.mjs` passes, as one plain foreground command from the repository root.
- `npm test --workspace cli -- test/watcher-run-analytics.test.mjs` passes, as one plain foreground command from the repository root.
- Each of the five mutations above was run once against `test/run-analytics-tokens.test.mjs` and turned it red, and each red run is recorded in that file's header.
- After the mutation runs, `git diff --exit-code -- cli/templates/scripts` exits 0, so no mutation survives.

- **Deviations from plan:** The plan restores each mutated template with `git restore --source=HEAD -- <file>`. The permission profile refused that command, both bare and with a `cd` in front. Each mutation was reverted with an exact Edit instead. Before every red run, `git diff -- cli/templates/scripts` showed only that run's mutation. After the last revert, `git diff --exit-code -- cli/templates/scripts` exited 0. One slip happened along the way: the first refused restore left mutation A in place when B was applied. A was reverted by Edit and the diff checked before the B run, so every recorded red run had exactly one mutation live.
