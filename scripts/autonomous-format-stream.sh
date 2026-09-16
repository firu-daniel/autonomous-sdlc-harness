#!/usr/bin/env bash
# autonomous-format-stream.sh — turn a headless agent run's `stream-json` events
# into ONE short line per meaningful event, so the run's log reads like an
# interactive session and stays tailable while the run is still going.
#
# WHO PIPES INTO IT. The watcher, and only the watcher: it starts the agent CLI
# with `--output-format stream-json --verbose`, tees the raw events to
# `<state_dir>/autonomous_logs/<branch>.stream.jsonl` (which the usage gate
# parses for `rate_limit_event`) and pipes the same stream through this filter
# into the human-readable run log. Nothing here writes a file, opens a network
# connection, reads configuration or takes an argument — stdin to stdout, once.
#
# WHAT IT DELIBERATELY DROPS, AND WHY. A raw transcript of a multi-hour run is
# tens of megabytes and unreadable, and the three biggest contributors carry the
# least operator value:
#
#   * thinking blocks — unbounded, and the decision they lead to is in the text
#     or the tool call that follows;
#   * `tool_result` bodies — a file read is the whole file;
#   * `system` / init envelopes — one-time setup noise.
#
# WHAT IT KEEPS is what answers "what is this run doing right now":
#
#   * assistant text, which is where an orchestrator's `[A · Task N · …]`
#     heartbeat line appears — trimmed, newlines folded to `⏎` so one event
#     stays one line, and clipped to 300 characters;
#   * `tool_use` dispatches: the tool name plus one short descriptor, taken from
#     the first of `subagent_type` / `description` / `command` / `file_path`
#     that the call carries, clipped to 160 characters;
#   * the final `result` envelope: the subtype, the turn count, the cost and the
#     four-way token split (input / output / cache-write / cache-read).
#
# A LINE THAT IS NOT JSON IS A NO-OP, BY DESIGN. `fromjson? // empty` swallows
# it. The stream this reads is interleaved with whatever the CLI writes to the
# same descriptor — a warning, a partial line at a truncated write — and a
# filter that died on one of those would take the run's log with it just when
# something is going wrong. `--unbuffered` is what keeps a `tail -f` live rather
# than arriving in 4 KB bursts.
#
# `jq` IS A HARD PREREQUISITE, the same one the guard hooks and the shared
# library carry; `doctor` checks its version. Without it this exits non-zero on
# the first byte and the run's log is empty while the raw `.jsonl` beside it is
# intact — which is the recoverable half of the pair, and the reason the watcher
# tees rather than only filtering.
#
# Usage: <agent CLI> … --output-format stream-json --verbose | autonomous-format-stream.sh
#
# Exit map: this process IS `jq` (`exec`), so the status is `jq`'s — 0 on a
# clean end of stream, non-zero when `jq` itself could not start or the program
# failed to compile. No caller in the flow switches on it: the watcher reads the
# agent CLI's status, not this filter's.
#
# REPRO — reproduce any line by hand, with no run and no repository:
#
#   printf '%s\n' \
#     '{"type":"assistant","message":{"content":[{"type":"text","text":"hello"}]}}' \
#     '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Task","input":{"subagent_type":"general-implementer","description":"port a script"}}]}}' \
#     '{"type":"assistant","message":{"content":[{"type":"thinking","thinking":"dropped"}]}}' \
#     'not json at all' \
#     '{"type":"user","message":{"content":[{"type":"tool_result","content":"dropped"}]}}' \
#     '{"type":"result","subtype":"success","num_turns":3,"total_cost_usd":0.5,"usage":{"input_tokens":10,"output_tokens":20,"cache_creation_input_tokens":30,"cache_read_input_tokens":40}}' \
#     | bash <repo>/<scripts_dir>/autonomous-format-stream.sh
#
#   -> exactly three lines (the text, the dispatch, the result summary), in that
#      order, with the thinking block, the malformed line and the tool result
#      absent, and exit 0.

set -u

exec jq -Rr --unbuffered '
  (fromjson? // empty)
  | if .type == "assistant" then
      ( .message.content[]? |
        if .type == "text" then
          ( .text | gsub("^\\s+|\\s+$"; "") ) as $t
          | if ($t | length) > 0 then "💬 " + ($t | gsub("\n"; " ⏎ ") | .[0:300]) else empty end
        elif .type == "tool_use" then
          "→ " + .name + "  "
          + ( ( (.input.subagent_type // "") + " "
                + (.input.description // .input.command // .input.file_path // "") )
              | tostring | gsub("\n"; " ") | gsub("^\\s+|\\s+$"; "") | .[0:160] )
        else empty end )
    elif .type == "result" then
      (.usage.input_tokens // 0) as $in
      | (.usage.output_tokens // 0) as $out
      | (.usage.cache_creation_input_tokens // 0) as $cw
      | (.usage.cache_read_input_tokens // 0) as $cr
      | "✅ " + (.subtype // "done")
      + "  turns=" + ((.num_turns // 0) | tostring)
      + "  cost=$" + ((.total_cost_usd // 0) | tostring)
      + "  tokens=" + (($in + $out + $cw + $cr) | tostring)
      + " (in:" + ($in | tostring) + " out:" + ($out | tostring)
      + " cache-w:" + ($cw | tostring) + " cache-r:" + ($cr | tostring) + ")"
    else empty end
'
