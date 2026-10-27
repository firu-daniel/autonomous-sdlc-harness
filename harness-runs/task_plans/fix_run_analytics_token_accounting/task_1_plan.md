### Task 1 — Record true token sources, transcript links and dispatch-free slowest calls in `lib/run-analytics.jq`

**Goal:** Make the per-session record that `cli/templates/scripts/lib/run-analytics.jq` emits truthful about tokens. The work has five parts:

- session totals from `result.modelUsage`;
- sub-agent stream usage dropped as partial;
- each dispatch linked to its transcript's `agentId`;
- `tools.slowest` without sub-agent dispatches;
- two new modes, `transcripts` and `attach`, that turn sub-agent transcripts into final per-request and per-dispatch figures.

**Where this task stops.** This task changes the record and the jq modes only. It locates no file and runs nothing:

- **Task 3** finds the transcripts, concatenates them and calls the two new modes from `cli/templates/scripts/run-analytics.sh`.
- **Task 2** does every roll-up, share, label and Markdown change in `lib/run-analytics-report.jq`.
- **Task 4** owns the tests that prove this file, including the update to `cli/test/run-analytics.test.mjs`'s `agent.output_tokens` assertion, which this task makes stale.
- **Task 5** copies this file to `scripts/lib/run-analytics.jq`.

Do not edit `scripts/lib/run-analytics.jq` here.

### Targets

- `cli/templates/scripts/lib/run-analytics.jq`. The `sessions` mode, the header's *Record* block, and the two new modes.

**Work:**

- [ ] **Session token totals, in `finalize` → `cost`.** Read `$r.modelUsage` when it is a non-empty object.
  - Set `input_tokens`, `output_tokens`, `cache_read_tokens` and the new `cache_write_tokens` to the sums over its values of `inputTokens`, `outputTokens`, `cacheReadInputTokens` and `cacheCreationInputTokens`, each `// 0` per model. Set the new `token_source` to `"model_usage"`.
  - When `modelUsage` is absent or empty and the session dispatched nothing (`.dispatch_order` empty), take the four from `$r.usage` (`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`) with `token_source: "usage"`.
  - Otherwise all four are `null` and `token_source` is `null`.
  - `cache_hit_ratio` = `cache_read_tokens / (cache_read_tokens + cache_write_tokens + input_tokens)` over those four, `round4`, and `null` when they are null or the denominator is 0.
  - `thinking_tokens`, `cache_write_5m_tokens` and `cache_write_1h_tokens` stay read from `$r.usage` unchanged, and the header calls them main-thread figures.
  - `by_model` is unchanged.
  - An incomplete session (`$r == null`) emits every `cost` key, the two new ones included, as `null`.
- [ ] **Sub-agent request usage is not recorded from the stream.** In `on_assistant`, a request in a sub-agent context (`$ck != ""`) gets `output_tokens`, `input_tokens`, `cache_read_tokens` and `cache_write_tokens` all `null`. The stream's sub-agent usage is in-progress, not final. An orchestrator request keeps `req_usage` from its last event, as today.
  - Every request item gains `message_id`: `$e.message.id` when it is a string, else `null`. Keep the internal `_parent` handling as is.
  - In `finalize` → `subagents[]`, each entry's four token fields become `null`, and each entry gains `agent_id` (below) and `token_source: null`. `requests` is still counted from the stream.
- [ ] **Link each dispatch to its `agentId`.** There are two carriers. Both are *unverifiable here*, so read both, and do not overwrite an `agent_id` already set:
  - In `on_user`, when a `tool_result` closes a dispatch (`.dispatch[$id] != null`), set `.dispatch[$id].agent_id` from `$e.tool_use_result.agentId`. Guard the type first: `tool_use_result` can be a string for an errored call, so read `.agentId` only when it is an object, and take the value only when it is a string. Take it only when that `user` event carries exactly one `tool_result`, because `tool_use_result` is one value per event.
  - In `step`, a `system` event whose `subtype` is a string that `startswith("task_")` and carries string `task_id` and `tool_use_id`, where `.dispatch[tool_use_id]` exists, sets that dispatch's `agent_id` to `task_id`.
  - Initialize `agent_id: null` in `add_call`'s dispatch object.
  - Emit it verbatim as `subagents[].agent_id`. It is an identifier, not free text, so it is not redacted.
  - Never use `tool_use_result.usage` or `tool_use_result.totalTokens` for tokens. They are the sub-agent's last turn only.
- [ ] **`tools.slowest` excludes sub-agent dispatches.** Filter out items whose `tool` is `"Agent"` or `"Task"` before the sort and the `slowest_limit` cut. `tools.items` and `tools.by_tool` keep every call, `Agent` included, with their field names unchanged.
- [ ] **Two new modes, beside `sessions` and `overlay`.** Both take every variable as neutral values. Each adds no new `$name`, so the header's "every variable" rule holds unchanged. Rename its heading from *BOTH MODES* to *EVERY MODE*.
  - **`transcripts`** — called as `jq -n -R -c -S -f run-analytics.jq --arg mode transcripts --argjson idle_threshold_s 1 --argjson known '[]' --argjson redact '[]' --argjson suspend '[]' --arg suspend_source none < <file>`.
    - **Input:** raw lines, `inputs | fromjson?`. A line `{"run_analytics_transcript":"<agent_id>"}` starts that agent's transcript. Lines before the first marker are ignored.
    - **Rule:** for each `type == "assistant"` line with a string `message.id` and an object `message.usage`, the **last** such line per `message.id` wins.
    - **Output:** one JSON object `{"<agent_id>": {"output_tokens", "input_tokens", "cache_read_tokens", "cache_write_tokens", "requests": {"<message_id>": {the same four}}}}`, mapped from the usage keys exactly as `req_usage` maps them. The four totals are the sums over `requests`. An agent with no qualifying line is omitted.
  - **`attach`** — called as `jq -c -S -f run-analytics.jq --arg mode attach` with the same neutral variables, on stdin `{"records": [<session record>, …], "transcripts": <the transcripts-mode object>}`.
    - **Output:** the records array.
    - **Per dispatch:** each `subagents[]` entry whose `agent_id` is a key of `transcripts` takes that entry's four totals and `token_source: "transcript"`.
    - **Per request:** each `requests.items[]` entry whose `message_id` appears in any agent's `requests` takes those four values.
    - Nothing else changes, and `requests.overall` / `by_context` stay as they are, since they hold latency only.
  - The unknown-mode error names all four modes.
  - Rewrite the header's *Record* block for every new key and every semantic change above: `cost.token_source`, `cost.cache_write_tokens`, the main-thread note, `requests.items[].message_id` and its null sub-agent tokens, `subagents[].agent_id` / `token_source`, and `slowest` excluding dispatches. Add both new mode usages under the existing two. Keep the jq 1.5 floor line, and use no regex, `--rawfile` or `$ARGS.named`.

**Verification:**

- Two command checks, each read for the invariant it states:
  - `git grep -nE 'test\(|match\(|capture\(|splits\(|sub\(|gsub\(|\$ARGS|rawfile' -- cli/templates/scripts/lib/run-analytics.jq` prints only the header's own `# Floor: jq 1.5 — …` line. That is the 1.5 floor.
  - `git grep -n 'tool_use_result' -- cli/templates/scripts/lib/run-analytics.jq` hits only the `agentId` read, never `.usage` or `.totalTokens`.
- **Smoke run, by hand.** Run the two-session fixture through the `sessions` mode, passing the file as jq's file argument rather than through a redirect: `jq -n -R -c -S -f cli/templates/scripts/lib/run-analytics.jq --arg mode sessions --argjson idle_threshold_s 120 --argjson known '[]' --argjson redact '[]' --argjson suspend '[]' --arg suspend_source none cli/test/fixtures/run-analytics-two-sessions.jsonl`. In its output:
  - `sess-two`'s `subagents[0]` has `agent_id: null`, `token_source: null` and `output_tokens: null`;
  - both sessions' `cost.token_source` is `null` for `sess-two`, which dispatched and has no `modelUsage`, and `"usage"` for `sess-one`;
  - no `tools.slowest` entry has `tool` `Agent`.
- The `transcripts` mode returns 342 for a message, not 343 and not 1, when fed a scratch file under `harness-runs/scratch/` holding a marker line plus two `assistant` lines for one `message.id` (output 1, then 342). Pass the file as jq's file argument. Delete the scratch file afterwards.
- No test file is edited here. The behavioural cases are Task 4's.
