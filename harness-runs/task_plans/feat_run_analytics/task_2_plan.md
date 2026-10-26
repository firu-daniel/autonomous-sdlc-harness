### Task 2 — Roll sessions up and render `run-analytics.md` in `lib/run-analytics-report.jq`

**Goal:** Ship the `jq` program that takes the merged run-analytics document and (a) recomputes its whole-run roll-up `.run` from `.sessions`, and (b) renders the human-readable `run-analytics.md` from the document — deterministically, so the same JSON always yields the same bytes.

**Depends on:** Task 1, which emits each session record with exactly the top-level keys `session_id, complete, first_at, last_at, time, requests, tools, subagents, cost, reliability`, where `time` = `{wall_ms, duration_ms, duration_api_ms, host_suspended_ms, idle_ms, active_ms, idle_threshold_s, suspend_source, idle_gaps: [{start_at, length_ms, context, class}]}`, `requests` = `{items: [{started_at, context, latency_ms, output_tokens, input_tokens, cache_read_tokens, cache_write_tokens, after_retry}], overall, by_context}` (each stats object `{count, p50_ms, p90_ms, p99_ms, max_ms, over_threshold}`), `tools` = `{items, by_tool, slowest, polling}`, `subagents` = `[{type, description, started_at, duration_ms, requests, output_tokens, input_tokens, cache_read_tokens, cache_write_tokens, wall_share}]`, `cost` = `{total_cost_usd, by_model, input_tokens, output_tokens, thinking_tokens, cache_read_tokens, cache_write_5m_tokens, cache_write_1h_tokens, cache_hit_ratio}` and `reliability` = `{api_retries, api_retry_errors, permission_denials, subagents_spawned, subagents_failed, subagents_killed, terminal_reason, stop_reason, num_turns, ttft_ms, rate_limit_peak}`; result-derived values are `null` on a `complete: false` session. This program reads those keys and computes nothing per session.

**Where this file stops.** It never reads the stream, the filesystem or the host. Building the document — merging new sessions into the existing ones by `session_id`, ordering them — and writing either file are **Task 3's** (`run-analytics.sh`), this program's only caller.

### Targets

- `cli/templates/scripts/lib/run-analytics-report.jq` (new) — the program. This repository's own `scripts/lib/` copy is Task 9's.

**Work:**

- [ ] **Header and contract.** A `#` header comment stating what it owns, its two modes, the document shape it takes and returns, and the `jq` 1.5 floor. The document is `{schema: 1, branch, sessions: [<session record>, …], run}` with `sessions` oldest first. Invocations by Task 3: `jq -S -f run-analytics-report.jq --arg mode rollup` (document in → document out, `.run` replaced) and `jq -r -f run-analytics-report.jq --arg mode markdown` (document in → Markdown text out). A document whose `schema` is not `1` is an error naming the schema, never a guess.
- [ ] **Mode `rollup`.** `.run` = `{sessions, complete_sessions, first_at, last_at, span_ms (last session's last_at − first session's first_at), wall_ms, duration_ms, duration_api_ms, host_suspended_ms, idle_ms, active_ms, total_cost_usd, input_tokens, output_tokens, thinking_tokens, cache_read_tokens, cache_write_5m_tokens, cache_write_1h_tokens, cache_hit_ratio, requests, api_retries, permission_denials, subagents_failed, subagents_killed, slowest_subagent, rate_limit_peak}`: sums over sessions skipping `null`; `cache_hit_ratio` recomputed from the summed tokens (read / (read + write5m + write1h + input), 4 decimals, `null` on zero); `requests` the same stats object recomputed over **all** sessions' `requests.items` pooled (nearest rank); `slowest_subagent` = `{type, description, duration_ms, session}` for the longest dispatch across sessions, `session` its 1-based position in `.sessions`, `null` when none; `rate_limit_peak` the per-window maximum. These keys are the ones Task 8's `branch-status` digest reads — `wall_ms`, `active_ms`, `host_suspended_ms`, `idle_ms`, `sessions`, `total_cost_usd`, `cache_hit_ratio`, `slowest_subagent` — so their names are fixed here.
- [ ] **Mode `markdown`, whole-run summary.** Opens `# Run analytics — <branch>`, then `## Whole run`: sessions (and how many incomplete), span, wall, active, host-suspended, idle, cost, token totals with the cache hit ratio, pooled request latency p50/p90/p99/max, retries, permission denials, failed/killed sub-agents, slowest sub-agent, rate-limit peaks. Durations as `XhYYm` / `Ym SSs`, money as `$0.00`. No wall-clock "generated at" line and nothing that varies between two renders of the same document.
- [ ] **Mode `markdown`, one section per session, oldest first.** `## Session <k> — <first_at> → <last_at>` (plus `(incomplete — no result event)` when `complete` is `false`), carrying: a time table (wall, `duration_ms`, `duration_api_ms`, host-suspended, idle, active, suspend source); the idle-gap table (start, length, context, class); request latency per context (count, p50, p90, p99, max, over threshold); tool time per tool per context, the 10 slowest calls, and any polling loops; the sub-agent table (type, description, duration, requests, tokens, wall share); cost by model and tokens; reliability (retries by error, permission denials, sub-agent failed/killed, `terminal_reason`, `stop_reason`, rate-limit peaks). Every text cell is the record's already-redacted value with `|` escaped, so a description cannot break a table.

**Verification:**

- A probe under `<state_dir>/scratch/` run through `bash <scripts_dir>/scratch-run.sh` builds a two-session document by hand, runs `rollup` then `markdown`, and shows: `.run.wall_ms` equal to the two sessions' sum; `slowest_subagent.session` pointing at the right session; the Markdown opening with `## Whole run` before `## Session 1`, and `## Session 1` before `## Session 2`.
- Running both modes twice over the same document gives byte-identical output (`cmp`).
- A document with `schema: 2` is refused with a message naming the schema.

**Deviations from plan:**

- **A resumed session's cumulative figures count once.** The plan says the program "computes nothing per session" and sums over sessions. But a resume's `result` event repeats earlier totals. Measured on the main checkout's `harness-runs/autonomous_logs/feat_unattended_sandbox_preflight.stream.jsonl`: the three results for `2651f418-…` (Task 1 records `2651f418-…`, `…#2`, `…#3`) report:
  - `total_cost_usd` and `modelUsage` cost of 2.11 / 5.67 / 7.62, which is cumulative.
  - `duration_api_ms` of 187698 / 609343 / 792440, which is cumulative. The third is larger than its own wall time of 203522.
  - `subagent_stats.spawned` of 0 / 7 / 8, which is cumulative. Task 1 counted 0 / 7 / 1 `Agent` dispatches, and `by_type` grows by one entry.
  - `usage` tokens (in 68 / 44 / 48, out 13805 / 8958 / 12901), `duration_ms`, `num_turns` and `permission_denials`, which are per occurrence.

  So both modes take, for `total_cost_usd`, `by_model`, `duration_api_ms` and `subagents_spawned` / `failed` / `killed`, each record's value minus the nearest earlier record with the same base id (the part before `#`) that has a value. Shares are rounded to 6 decimals. Summing as written gives $15.40 for that session instead of $7.62, and the whole stream gives $211.64 instead of $203.86. The per-session Markdown shows the share and says so. The roll-up's key names are unchanged.
- **Durations under a minute render as `S.Ds`** (for example `3.8s`). The plan gives only `XhYYm` and `Ym SSs`. With `0m 03s`, the latency columns lose most of what they report: the real stream's pooled p50 / p90 are 3834 / 8267 ms.
- **Table cells also turn newlines into spaces**, as well as escaping `|`. An unescaped newline would also break a table row.
- **`markdown` recomputes the roll-up and never reads `.run`.** As a result, a stale `.run` cannot make the Markdown disagree with the sessions. The probe showed byte-identical output for a document with `run: null` and for its rolled-up form.
- **Byte-identity was checked in the probe with `Buffer.compare` on two runs' stdout, not with `cmp`.** It is the same byte comparison. `cmp` is not on this run's command allowlist as a compound command.
- **Evidence downgrade: the jq 1.5 floor is reasoned, not executed.** The only `jq` on this host is 1.8.2. The program uses no regex, `ceil`, `round`, `abs`, unary minus, `$__loc__`, `$ENV`, `walk`, `IN` or `--rawfile`. Nothing has run it under 1.5.
- **Probe evidence** (`bash scripts/scratch-run.sh harness-runs/scratch/<probe>.mjs <repo_root> [<stream>]`, the probe stays in the gitignored scratch directory because deleting it was refused) printed `ALL PASS`:
  - `.run.wall_ms` = 5400000, the two sessions' sum.
  - `slowest_subagent.session` = 2, the session holding the longer dispatch.
  - `## Whole run` came before `## Session 1`, which came before `## Session 2`.
  - Both modes, run twice, gave byte-identical output.
  - `schema: 2` was refused in both modes with `document schema 2 is not supported; expected 1`.
  - `|` in a description and in a polling command was escaped.
  - An incomplete session got its heading suffix.
  - A three-occurrence resume summed to its last cumulative cost.
  - Over Task 1's records for the real stream above (4 sessions), `rollup` finished in 58 ms with:
    - `total_cost_usd` 203.860041
    - `cache_hit_ratio` 0.9988
    - pooled requests 2609, p50 3834 ms, p90 8267 ms, p99 27400 ms
    - slowest sub-agent `task-plan-writer`, 918600 ms, session 1
