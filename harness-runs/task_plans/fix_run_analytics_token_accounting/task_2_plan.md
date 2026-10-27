### Task 2 — Roll up and render true tokens, the token attribution check and the relabelled `Agent` rows in `lib/run-analytics-report.jq`

**Goal:** Make `run-analytics.md` and the document's `.run` show true token counts or an explicit "not available", never a silently small number. Show a per-session check of how the context figures add up to the session total, and stop presenting sub-agent wall time as tool time.

**Depends on:** Task 1. That task produces the record fields this task reads, named exactly as follows:

- `cost.input_tokens`, `cost.output_tokens`, `cost.cache_read_tokens` and `cost.cache_write_tokens`. These are session totals from `result.modelUsage`, cumulative across a resume's earlier occurrences exactly as `total_cost_usd` is, or `null`.
- `cost.token_source`, one of `"model_usage"`, `"usage"` or `null`. **A record with no `token_source` key at all was written before this branch.**
- `cost.thinking_tokens`, `cost.cache_write_5m_tokens` and `cost.cache_write_1h_tokens`. These are main-thread figures from `result.usage`.
- `requests.items[]` with `context`, plus `message_id` and four token fields. Orchestrator items carry stream usage. Sub-agent items carry transcript values or `null`.
- `subagents[]` with four token fields (transcript totals or `null`), `agent_id` and `token_source` (`"transcript"` or `null`).
- `tools.by_tool` / `tools.slowest`, with unchanged shapes. `slowest` excludes `Agent` / `Task` in new records only.

This task changes nothing in `lib/run-analytics.jq` (Task 1's), in `run-analytics.sh` (Task 3's) or in any test (Task 4's). The `scripts/lib/` mirror is Task 5's.

### Targets

- `cli/templates/scripts/lib/run-analytics-report.jq`. `shares`, `run_of`, `whole_run`, `session_md` and the header.

**Work:**

- [ ] **`shares` gains the four session token totals.** Add `input_tokens`, `output_tokens`, `cache_read_tokens` and `cache_write_tokens`, each through `less($p.<field>)` like `total_cost_usd`, so a resume shows its own occurrence's share.
  - A session whose `cost` has no `token_source` key is pre-branch. Its four values are taken as `null`, because its figures are the undercounted ones.
  - Also carry a `token_source` per share: the record's value, or `"legacy"` for a record without the key.
  - The header's *RESUMED SESSIONS* paragraph states the assumption: `modelUsage` token counts are cumulative because they share the object `costUSD` is computed from. Mark that assumption *unverifiable here*.
- [ ] **`run_of`.**
  - `input_tokens`, `output_tokens`, `cache_read_tokens` and the new `cache_write_tokens` are `num_sum` over the **shares**, not the raw records.
  - The new `token_sessions` is the count of shares whose `output_tokens` is a number.
  - `cache_hit_ratio` = `cr / (cr + cache_write_tokens + in)` over those sums, 4 decimals, `null` on zero. It no longer uses the 5m / 1h split.
  - `thinking_tokens`, `cache_write_5m_tokens` and `cache_write_1h_tokens` stay summed from the records.
  - Every existing `.run` key keeps its name. Add the two new keys to the header's key list. The header's sentence about the fields `branch-status` reads stays true and unedited.
- [ ] **Markdown, whole run and `### Cost and tokens`.**
  - In `## Whole run`, the four token rows (`Input tokens`, `Output tokens`, `Cache read tokens`, and a new `Cache write tokens` row) render the sum. When `token_sessions` is less than `sessions`, they render the sum suffixed ` (<token_sessions> of <sessions> sessions)`, or `—` when no session has one.
  - Relabel `Thinking tokens` to `Thinking tokens (main thread)`, and `Cache write tokens (5m / 1h)` to `Cache write tokens, main thread (5m / 1h)`, in both the whole-run table and each session's table.
  - In each session's `### Cost and tokens`, take the four totals from the share `$sh`, add the `Cache write tokens` row, and add a `Token source` row:
    - `result.modelUsage` for `"model_usage"`;
    - `result.usage (no sub-agent dispatched)` for `"usage"`;
    - `not available` for `null`;
    - `recorded before token accounting` for `"legacy"`.
- [ ] **`#### Token attribution`, after each session's cost table.** It is a table `Context | Input tokens | Output tokens | Cache read tokens | Cache write tokens` with three rows:
  - **`orchestrator`:** the sums of `requests.items` whose `context` is `"orchestrator"`.
  - **`sub-agents`:** the sums over `subagents[]`. Every cell is `—` when any entry's `token_source` is not `"transcript"`.
  - **`remainder`:** the share total minus both. A cell is `—` when either operand is null, and a negative value renders as it is.
  - When dispatches lack a transcript, add one line under the table: `<k> of <n> sub-agent dispatches have no transcript; their tokens are in the session total only.`
  - Always add the line `Remainder: tokens the session total holds that neither the orchestrator's requests nor the dispatches' transcripts account for.`
  - A session with no sub-agents renders the `sub-agents` row as `0`.
- [ ] **`### Sub-agents`, `### Tool time` and `#### Slowest calls`.**
  - **Sub-agents:** null token cells already render `—`. When any row has `token_source` other than `"transcript"`, add the line `— in a token column: no transcript was found for this dispatch, and the stream's own sub-agent usage is partial, so none is shown.`
  - **Tool time:** a `by_tool` row whose `tool` is `Agent` or `Task` renders its Tool cell as `Agent — sub-agent wall time` (respectively `Task — …`). When any such row exists, add the line ``` `Agent` / `Task` rows are sub-agent wall time: how long the orchestrator was blocked on each dispatch, which `### Sub-agents` breaks down per dispatch. They are not time spent in a tool. ```
  - **Slowest calls:** rename the heading to `#### Slowest calls (sub-agent dispatches excluded)`, and filter `Agent` / `Task` out of `tools.slowest` before rendering, so pre-branch records render the same way.
  - Update the header for every rendering rule above.

**Verification:**

- `git grep -nE 'test\(|match\(|capture\(|splits\(|sub\(|gsub\(|\$ARGS|rawfile|\|[[:space:]]*(ceil|round|abs)([^0-9a-z_]|$)' -- cli/templates/scripts/lib/run-analytics-report.jq` prints no line. That is this file's stated 1.5 floor, which also rules out `ceil`, `round` and `abs` as filters; the existing `round4` / `round6` calls and the header's `ceil/round/abs` wording do not match.
- **By hand**, run `--arg mode markdown` with the document passed as jq's file argument. The document is a scratch file under `harness-runs/scratch/`, holding two sessions:
  - one with `cost.token_source` absent (legacy);
  - one with `"model_usage"` totals and one sub-agent with `token_source: null`.

  Its `## Whole run` `Output tokens` row carries ` (1 of 2 sessions)`. The second session's `Token source` row reads `result.modelUsage`. Its attribution `sub-agents` and `remainder` cells are `—`, with the `1 of 1 sub-agent dispatches` line. Delete the scratch file afterwards.
- The literal labels above are the contract Task 4 asserts. Keep them byte-for-byte.
