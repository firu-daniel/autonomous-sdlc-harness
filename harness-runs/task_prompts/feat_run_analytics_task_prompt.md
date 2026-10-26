`feat_run_analytics` adds a measurement script that turns each headless session's raw event stream into a per-run analytics file, `run-analytics`. The file covers where wall time went: stalls and idle time, per-request latency, per-tool-call and per-sub-agent time, and per-session cost and tokens. Today that takes an ad-hoc forensic pass over a multi-megabyte `.stream.jsonl`. The motivating case was a three-file branch that took 132 min. Half of that turned out to be host sleep, which no artifact recorded.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The anchors were true at `ff0d612d` (`origin/dev`). Re-verify each one in the merged code before planning on it.

## What is there today

- `scripts/autonomous-watcher.sh` → `spawn_engine` tees every headless session's raw `--output-format stream-json --verbose` events to `<state_dir>/autonomous_logs/<branch>.stream.jsonl` in the main checkout. That file is **appended** across the launch and every resume, so it holds several sessions back to back, each starting with a `system`/`init` event carrying its own `session_id`. It is machine-local and not committed.
- `classify_run_exit` runs in the same subshell right after the engine exits. It is the one place that already knows a session has just ended.
- `cli/templates/github/workflows/harness-run.yml` → `THE SELF-PAUSE POINT, MEASURED` holds a one-off `jq` that measures sub-agent dispatch durations over the stream logs. It is the only existing stream measurement, and this feature should supersede or reuse it.
- `<state_dir>/branch_statistics/<branch>/statistics.md` is the success-rate report. It is about user-review cost, not time, and stays as it is.

## Facts about the stream (checked on 2026-10-24 logs)

- `assistant`, `user` and most `system` events carry an ISO-8601 UTC `timestamp`. `tool_progress`, `system/task_progress` and `system/thinking_tokens` events carry none.
- Sub-agent events carry `parent_tool_use_id`, which is the `Agent`/`Task` `tool_use` id that dispatched them. Events with no parent belong to the orchestrator.
- One API request equals one `message.id`. Its assistant events repeat `usage`, and output tokens grow across them, so take the **last** event per `message.id` for output tokens.
- **Per-request latency** is the time from the last timestamped event in the same context (orchestrator, or one `parent_tool_use_id`) to the first assistant event with a new `message.id` in that context.
  - Over the two 2026-10-24 runs, p50 was 3.1–3.5 s and p90 7.3–8.6 s.
  - Twelve outliers of 4–17 min were all host sleep.
- The `result` event, one per headless session, carries:
  - `duration_ms`, from a **monotonic clock that excludes host suspend**, and `duration_api_ms`;
  - `num_turns`, `total_cost_usd`;
  - `usage`, including `cache_read_input_tokens`, `cache_creation_input_tokens` with its `ephemeral_5m`/`ephemeral_1h` split, `output_tokens` and `output_tokens_details.thinking_tokens`;
  - `modelUsage`/`model_usage_since_last_result` per model with `costUSD`;
  - `subagent_stats` (spawned, completed, failed, killed, `by_type`), `permission_denials`, `ttft_ms`, `terminal_reason`, `stop_reason`.
- **Host-suspended time ≈ (last timestamp − first timestamp) − `duration_ms`.** Confirmed at 65.9 min and about 66 min on the two runs, against `pmset -g log`'s sleep intervals.
- `system/api_retry` events (`attempt`, `error_status`, `retry_delay_ms`), `system/permission_denied` events and `rate_limit_event` events (utilization per window) are all present.
- A headless `-p` session has exactly one `result`. So for an unattended run, "after each turn" is "after each headless session ends": the launch, every resume, and every GitHub Actions job.

## The goal

1. **A script, `scripts/run-analytics.sh`** (bash + `jq`, like the rest of the outer loop, mirrored to `cli/templates/scripts/`). Given a stream file and a branch, it computes the metrics below for each session in the file. It is **idempotent per `session_id`**: re-running it over a stream that already has a recorded session neither duplicates nor changes that session's entry.
2. **Run it after every session**:
   - locally, from the `spawn_engine` subshell after the engine exits and before or beside `classify_run_exit`;
   - remotely, wherever the GitHub Actions job ends a headless session.

   The script is best-effort. A failure is one log line, and it never changes the run's classification, exit code or notifications.
3. **The output: the `run-analytics` file**, a harness run artifact for the branch: `<state_dir>/run_analytics/<branch>/run-analytics.md` for people, plus a machine-readable `run-analytics.json` beside it that holds one record per session and is the source of truth.
   - The `.md` is regenerated from the `.json` every time.
   - It opens with a whole-run summary, then one section per session, oldest first.
   - It must accumulate across sessions both locally and on GitHub Actions, where each job may start on a fresh runner.

   **Open question for the plan:** how the file reaches the branch and survives between sessions without dirtying the run copy in a way that trips the next resume or a reviewer. Options include a commit through `commit-on-branch.sh` at session end, or carrying it in the remote state bundle beside `run.log`. Check this against `.claude/context/cli.md` and the existing artifact-commit paths before picking one.
4. **The metrics**, per session and rolled up per run:
   - **Time:**
     - wall span;
     - `duration_ms`;
     - `duration_api_ms`;
     - **host-suspended time**: wall − `duration_ms`;
     - **idle time**: periods with no stream event for longer than a threshold, default 120 s, each listed with its start, length and context. Each is classified as **host asleep** when it overlaps a suspend interval, **in-flight request** when one context has an outstanding request, **tool running** when a tool call is open, or **unknown**. On macOS the suspend intervals come from `pmset -g log` Sleep/Wake lines when readable; on Linux from `journalctl` suspend and resume entries when readable; otherwise only the wall − `duration_ms` total is recorded.
   - **Per API request:** latency, context (orchestrator or sub-agent type), output tokens, cache read and cache write tokens, and whether it followed an `api_retry`. Roll-ups give the p50, p90, p99 and max latency for the session and per context, plus the requests over the idle threshold.
   - **Per tool call:** tool name, context, start, duration (from `tool_use` to its `tool_result`), result size in bytes, `is_error`, and whether it was permission-denied. Roll-ups give count and total and max time per tool name per context, the top 10 slowest calls, and any polling loop, meaning the same command repeated N times; the gates wait is one example.
   - **Per sub-agent dispatch:** type, description, duration, request count, tokens, and its share of the session's wall time.
   - **Cost and tokens:** `total_cost_usd`, per-model `costUSD`, input, output and thinking tokens, cache read and cache write (5 m and 1 h), and the cache hit ratio, read / (read + write + input).
   - **Reliability:** `api_retry` count and errors, `permission_denials`, `subagent_stats` failed and killed counts, `terminal_reason`, and peak rate-limit utilization per window.
5. **`/autonomous-sdlc-harness:branch-status`**: in the focused single-branch view, show a three-line digest from the run's `run-analytics.json` when it exists: wall time, active time, host-suspended time, idle time, cost, and the slowest sub-agent. It stays read-only.
6. **Tests**: a `cli/test` suite with a small fixture stream of two sessions. It must cover:
   - a stalled request;
   - an `api_retry`;
   - a sub-agent dispatch;
   - a tool call;
   - a `result` whose `duration_ms` is shorter than the wall span;
   - a re-run over the same fixture, which must change nothing.

   It pins idempotence, the per-request latency rule and the suspended-time arithmetic.

## Constraints

- **Measurement only.** Nothing in this branch kills, retries or delays a request, a tool call or a session based on these numbers. Killing a session discards uncommitted work in the run copy.
- The raw `.stream.jsonl` stays where and as it is. The analytics are derived from it and never replace it.
- No network calls, and no new runtime dependency beyond `bash`, `jq` and coreutils. `pmset` and `journalctl` are optional readers, absent on most hosts.
- No machine paths in committed output, per gate 6a: record repo-relative or `<state_dir>`-relative paths only, and no usernames or home directories.
- The script must finish in seconds on a 10 MB stream.
