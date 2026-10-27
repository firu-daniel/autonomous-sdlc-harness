# Story: True token counts and an honest `### Tool time` in run analytics

## Context

This branch fixes two defects in run analytics. The first is in `lib/run-analytics.jq` and `lib/run-analytics-report.jq`, the programs `run-analytics.sh` drives. Sub-agent token figures are taken from the headless stream, whose sub-agent `assistant` events carry in-progress usage rather than the final value, and session totals are taken from `result.usage`, which covers the main thread only. The second is that `### Tool time` reports an `Agent` / `Task` call's `tool_use` → `tool_result` span, which is the whole sub-agent run, as orchestrator tool time. The run proves the fix with fixtures under `cli/test/` only. Acceptance against real run data is the operator's, after merge. Every design choice below rests on the operator's real-data measurements in the task prompt, never on a fixture figure.

**The token sources this plan chooses.** This is the prompt's option (a), with a reconciliation.

- **Session totals come from `result.modelUsage`, summed across models.** Each session record's `cost.input_tokens`, `cost.output_tokens`, `cost.cache_read_tokens` and a new `cost.cache_write_tokens` are the sums of `inputTokens`, `outputTokens`, `cacheReadInputTokens` and `cacheCreationInputTokens`. A new `cost.token_source` names where the four came from:
  - `"model_usage"` when `modelUsage` is present;
  - `"usage"` when it is absent and the session dispatched no sub-agent, so `result.usage` covers everything;
  - `null` otherwise, with all four set to `null`. That is an explicit "not available", never a main-thread-only number standing in for a total.
- **Some `cost` fields still come from `result.usage`.** `thinking_tokens` and the 5m / 1h cache-write split are read there, because `modelUsage` carries neither. They are relabelled as main-thread figures. The per-model cost split (`by_model`) is unchanged.
- **Per-sub-agent figures come from the on-disk sub-agent transcripts.** The transcript is `<claude home>/projects/*/<session_id>/subagents/agent-<agentId>.jsonl`, located by `session_id` and `agentId`. The `<slug>` segment is matched by `*` and never derived. Each figure is the last usage per `message.id`, summed. The same per-message values replace the token fields of that sub-agent's `requests.items`.
- **A dispatch with no transcript gets `null` tokens and `token_source: null`.** The stream's partial sub-agent usage is never recorded. The report renders `—` with a note.
- **Orchestrator `requests.items` keep their stream usage**, which the prompt states is final for the main thread.
- **Linking a transcript to its dispatch is Task 1's.** The link is the orchestrator-side `user` event's `tool_use_result.agentId`, or else a `system` `task_*` event's `task_id` paired with its `tool_use_id`. Both carriers are *unverifiable here*, so Task 1 reads both and Task 4's fixture encodes both.
- **Locating and feeding transcripts is `run-analytics.sh`'s (Task 3)**, per the jq header's division of labour. It hands them to two new jq modes, `transcripts` and `attach`, which mirror the existing `sessions` → `overlay` pattern. The stream is still read in one pass.

**No silent mixing (prompt goal 2).** Each session's `### Cost and tokens` gains a `#### Token attribution` table with three rows:

- **orchestrator:** the stream's main-thread requests;
- **sub-agents:** the transcript sums;
- **remainder:** the session total minus both. This is the check: a remainder that is large or negative is visible, not hidden.

When any dispatch lacks a transcript, the sub-agent row and the remainder are `—` and a note says how many dispatches lack one. Whole-run token sums skip a session without a token total and say so: `.run.token_sessions` counts the sessions that have one, and the Markdown suffixes `(k of n sessions)`. A record written before this branch has no `cost.token_source` key. It is treated as "not available" rather than summed, because its figures are the undercounted ones.

**Transcripts on GitHub runs (verified).** `--no-session-persistence` in `remote-run.sh` is on the mention-reading session (`control_mention`) only. The run's own engine launch is `autonomous-watcher.sh` → `spawn_engine` in both local and job mode, and it carries no such flag. So a job's transcripts exist on the runner for that job's life, and `record_run_analytics` runs there after each session. A session recorded by a *later* job on a fresh runner has no transcripts, and neither does any run whose transcripts were removed. Both are reported as `null` / `—`, never as a small number.

**Resumed sessions.** The report already treats a resume's `total_cost_usd` and per-model `costUSD` as cumulative over earlier occurrences (`run-analytics-report.jq` → `shares`). `modelUsage`'s token counts sit in the same object that `costUSD` is computed from, so Task 2 gives them the same share treatment. That cumulativeness is *unverifiable here*. Task 2's header states the assumption, and no fixture depends on it.

**`### Tool time`: relabel, not split.** The `Agent` / `Task` rows stay in `tools.by_tool` with unchanged field names. The Markdown names them `Agent — sub-agent wall time` and adds a note saying what they are. `tools.slowest` keeps its name but excludes `Agent` / `Task` at source (Task 1), and the report filters them for older records too (Task 2), so `#### Slowest calls` shows real tool calls. Relabelling was chosen for three reasons:

- it keeps every JSON name stable, so no consumer needs to be listed or changed;
- it matches the operator's lean;
- the orchestrator's "own" tool time cannot be derived honestly while a dispatch's wait overlaps the orchestrator's other work.

`tools.by_tool` and `tools.slowest` are read only by `run-analytics-report.jq` and `cli/test/`. `plugin/commands/branch-status.md` reads `.run` → `wall_ms`, `active_ms`, `host_suspended_ms`, `idle_ms`, `sessions`, `total_cost_usd`, `cache_hit_ratio` and `slowest_subagent`. Their names do not change, and `cache_hit_ratio` becomes true.

**Template parity (verified).** Two things were checked:

- `cli/test/outer-loop-scripts.test.mjs` asserts that `init` writes `cli/templates/scripts/{run-analytics.sh,lib/run-analytics.jq,lib/run-analytics-report.jq}` verbatim.
- Nothing automated compares this checkout's `scripts/` with `cli/templates/scripts/`. The established routes are a hand mirror in the same change (`d6bdbdaa`, which edited both copies) or the forced self-adopt run in `docs/development.md` → *Regenerating this repository's adoption*.

So Tasks 1–3 edit the templates, and every test drives the templates through an `init`-adopted fixture. Task 5 copies the three files to `scripts/` and proves them identical with `cmp`. The jq 1.5 floor binds both programs: no `--rawfile`, no `$ARGS.named`, no regex. `--slurpfile` and `startswith` are 1.5 and allowed.

**Ship order.** The three template tasks come first, in contract-before-consumer order: the record (Task 1), its rendering (Task 2), its driver (Task 3). The tests follow (Task 4), then the catch-all mirror and documentation (Task 5). Between Task 1's commit and Task 4's, `cli/test/run-analytics.test.mjs`'s existing `agent.output_tokens === 16` assertion is knowingly stale: the value becomes `null` with no transcript. Task 4 owns that edit, and the closing Run gates round is the first full-suite run.

**Top risks:**

- **Wrong figures behind a plausible table.** Task 2's attribution table makes any gap visible. Task 4's `usage`-versus-`modelUsage` case and its hand-computed remainder are the guard.
- **The transcript ↔ dispatch link.** It rests on stream fields this run cannot observe. Task 1 takes both candidate carriers and degrades to `null`. Task 4 fixtures both, places the transcript under a deliberately arbitrary slug, and states which assumption each fixture encodes.
- **The shipped templates and this checkout's `scripts/` drifting apart.** Task 5's `cmp` of all three pairs is its closing check.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, or the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets in per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_run_analytics_token_accounting/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [ ] **Task 1** — Record true token sources, transcript links and dispatch-free slowest calls in `lib/run-analytics.jq` _(layer: cli)_ _(points: 20)_
2. [ ] **Task 2** — Roll up and render true tokens, the token attribution check and the relabelled `Agent` rows in `lib/run-analytics-report.jq` _(layer: cli)_ _(points: 20)_
3. [ ] **Task 3** — Locate sub-agent transcripts in `run-analytics.sh` and feed them through the `transcripts` and `attach` modes _(layer: cli)_ _(points: 15)_
4. [ ] **Task 4** — Fixture streams, transcripts and cases proving the token and tool-time fixes, each with its red-turning mutation _(layer: cli)_ _(points: 20)_
5. [ ] **Task 5** — Mirror the three run-analytics files into `scripts/` and document the token sources _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"True token counts, everywhere the report shows tokens: whole run, per session, per context in `### Request latency`'s underlying `requests.items`, and per row of `### Sub-agents`."* The corpus sites below are those that describe what run analytics reads or records. A site falls under the predicate when its text would become false once the report's tokens or tool-time rows change source or meaning.

**Derivation entry — corpus files (command).** Re-run verbatim from the checkout root: `git grep -lE "run-analytics|run_analytics|Run analytics" -- . ":!cli/test" ":!cli/src" ":!scripts" ":!cli/templates/scripts/*.sh" ":!cli/templates/scripts/lib" ":!plugin/hooks/*.sh" ":!harness-runs"`

**Derivation entry — standing run-artifact files (command).** Re-run verbatim from the checkout root: `git grep -lE "run-analytics|run_analytics|Run analytics" -- "harness-runs/*README.md" "harness-runs/lessons.md"`

**Derivation entry — standing-artifact rows (procedure).**

- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** the lessons ledger.
- **Traversal:** its topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it names run analytics, token counts, the `stream-json` stream or tool time.

This walk reached no rule on this branch, so it contributes no row below.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `ARCHITECTURE.md` → the `autonomous-format-stream.sh` row of the engine-binding table ("The run-analytics reader also reads each event's `timestamp` and `parent_tool_use_id`…") | — | corpus command | `change` | Task 5. The reader now also reads `result.modelUsage`, `tool_use_result.agentId`, the `task_*` events' `task_id` / `tool_use_id`, and the on-disk sub-agent transcripts. |
| 2 | `cli/README.md` ("the run-analytics script … to record that session's time, cost and reliability") | — | corpus command | `no-change` | It names the script and its purpose, and both stay true. It states no token source. |
| 3 | `cli/templates/scripts/README.md` (the outer-loop family paragraph naming `run-analytics.sh`) | — | corpus command | `no-change` | It lists the family and the copy-verbatim rule, which this branch keeps. It states no token source. |
| 4 | `cli/templates/state-dir/run_analytics/README.md` ("the raw `<state_dir>/autonomous_logs/<branch>.stream.jsonl` they were derived from stays the deep-debug copy") | template | corpus command | `no-change` | It names the stream as the deep-debug copy, which stays true. Where token figures come from is stated in `run-analytics.sh`'s header (Task 3) and `docs/watcher.md` (Task 5). |
| 5 | `harness-runs/run_analytics/README.md` (same sentence) | self-adopted | standing-file command | `no-change` | This is the self-adopted copy of row 4, for row 4's reason. |
| 6 | `docs/cli.md` → *"Two families land in `scriptsDir`"* (lists the run-analytics script with its two `jq` programs) | — | corpus command | `no-change` | It covers the family and the profile treatment only. Neither changes. |
| 7 | `docs/remote-execution.md` ("the run-analytics record committed after each session") | — | corpus command | `no-change` | Commit timing is unchanged. |
| 8 | `docs/watcher.md` → `### Run analytics` ("What it records", "Measurement only") | — | corpus command | `change` | Task 5. It gains where the token figures come from, the read-only transcript read, and the `—` rendering when none is found. |
| 9 | `plugin/commands/branch-status.md` → the run-analytics bullet (reads `.run` → `wall_ms` … `cache_hit_ratio`, `slowest_subagent`) | — | corpus command | `no-change` | Every field it reads keeps its name. `cache_hit_ratio` keeps its meaning and now gets its true value. |
| 10 | `plugin/docs/AUTONOMOUS_FLOW.md` (the "Run analytics" row) | — | corpus command | `no-change` | It points at the script and its header as the format of record. Both stand. |
| 11 | `plugin/hooks/README.md` → `## The deny list` (names `run-analytics.sh` among the left-allowed scripts) | — | corpus command | `no-change` | The script stays non-destructive. The transcript read is a read outside the checkout, not a write. |
