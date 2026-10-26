# run-analytics.jq — per-session records from one headless stream file.
#
# Owns: turning one `<state_dir>/autonomous_logs/<branch>.stream.jsonl`'s raw
# `stream-json` events into one record per headless session, and re-classing
# those records' idle gaps against host suspend intervals. It reads no file of
# its own, resolves no path, consults no host and merges nothing: the roll-up and
# the Markdown are lib/run-analytics-report.jq's; locating files, reading suspend
# intervals, merging and writing are run-analytics.sh's, its only caller.
#
# Floor: jq 1.5 — no utf8bytelength, no --rawfile, no $ARGS.named, no regex.
#
# BOTH MODES TAKE EVERY VARIABLE: $mode, $idle_threshold_s, $known, $redact,
# $suspend, $suspend_source. jq resolves every $name the program references at
# compile time, not when the branch holding it runs, so a call omitting one
# aborts with `$<name> is not defined` whatever its mode. Each mode ignores the
# ones it does not use; pass those as the neutral values shown.
#
# Mode `sessions`:
#   jq -n -R -c -S -f run-analytics.jq --arg mode sessions
#      --argjson idle_threshold_s <int> --argjson known '<["<session_id>", …]>'
#      --argjson redact '<[["<from>", "<to>"], …]>' --argjson suspend '[]'
#      --arg suspend_source none < <stream file>
#   One pass over `inputs | fromjson?`: a non-JSON or truncated line is skipped.
#   Output: one JSON array of NEW session records, oldest first.
#   - A session is the run of events from one system/init event to the next;
#     events before the first init are dropped.
#   - session_id is the init event's session_id; a resume reuses that id, so its
#     Nth occurrence in the stream (N >= 2) is recorded as "<session_id>#<N>".
#   - A session_id in $known, or already emitted in this pass, is emitted nowhere.
#   - A session with no `result` event is emitted (complete: false) only when a
#     later session follows it; the stream's last one is left for a later run.
#   - Timestamps: whole seconds from `.timestamp[0:19] + "Z" | fromdateiso8601`
#     plus three fractional digits. An event with no timestamp is ignored for
#     every time computation, except that a tool_use or tool_result with none
#     takes the nearest preceding one (the rule harness-run.yml's
#     THE SELF-PAUSE POINT, MEASURED states).
#   - Every free-text field written (dispatch description, Bash command) goes
#     through `redact`: each $redact pair replaced literally, in order, then any
#     remaining /Users/<segment> or /home/<segment> -> ~, then cut to 160
#     characters. The init event's working-directory field is never read.
#
# Mode `overlay`:
#   jq -c -S -f run-analytics.jq --arg mode overlay
#      --argjson idle_threshold_s <int> --argjson known '[]' --argjson redact '[]'
#      --argjson suspend '<[[start_ms, end_ms], …]>'
#      --arg suspend_source <pmset|journalctl|file|none> < <records array>
#   Per record: sets time.suspend_source, and re-classes as host_asleep (context
#   kept) every idle gap overlapping an interval. host_asleep outranks every class.
#
# Record (top-level keys exactly these):
#   session_id, complete, first_at, last_at  (ISO timestamps, verbatim)
#   time: {wall_ms, duration_ms, duration_api_ms, host_suspended_ms, idle_ms,
#          active_ms, idle_threshold_s, suspend_source,
#          idle_gaps: [{start_at, length_ms, context, class}]}
#     host_suspended_ms = max(0, wall_ms - duration_ms); duration_ms is the result
#     event's monotonic clock, which excludes suspend. active_ms = wall - idle.
#     A gap is consecutive timestamped events, any context, further apart than
#     idle_threshold_s. Class at its start: in_flight_request (some context's last
#     event is a user event or the init, with no assistant event after it; context
#     = the most recently active such) > tool_running (an open tool call; context
#     = the latest-started's) > unknown (context = the last event's).
#   requests: {items: [{started_at, context, latency_ms, output_tokens,
#              input_tokens, cache_read_tokens, cache_write_tokens, after_retry}],
#              overall, by_context: {<context>: rollup}}
#     rollup = {count, p50_ms, p90_ms, p99_ms, max_ms, over_threshold}; count is
#     every request, percentiles (nearest rank) over those with a latency.
#     A request is one message.id within a context; usage from its last event.
#     latency_ms: from the last timestamped event in the same context to the
#     request's first event; a sub-agent's first request with no earlier event in
#     its context measures from its dispatching tool_use. after_retry: a
#     system/api_retry of the same context lies between those two points.
#   tools: {items: [{tool, context, started_at, duration_ms, result_bytes,
#           is_error, permission_denied}], by_tool: [{tool, context, count,
#           total_ms, max_ms}], slowest: <top 10 items>, polling: [{context,
#           command, count, total_ms}]}
#   subagents: [{type, description, started_at, duration_ms, requests,
#               output_tokens, input_tokens, cache_read_tokens,
#               cache_write_tokens, wall_share}]
#   cost: {total_cost_usd, by_model, input_tokens, output_tokens, thinking_tokens,
#          cache_read_tokens, cache_write_5m_tokens, cache_write_1h_tokens,
#          cache_hit_ratio}  (every value null when complete is false)
#   reliability: {api_retries, api_retry_errors, permission_denials,
#                 subagents_spawned, subagents_failed, subagents_killed,
#                 terminal_reason, stop_reason, num_turns, ttft_ms,
#                 rate_limit_peak}  (the result-event values null when incomplete)
#     rate_limit_peak: max utilization per window, from rate_limit_info's
#     rateLimitType/utilization and from each unifiedWindows.<window>.utilization
#     (measured streams carry a null top-level utilization).
#   A context is `orchestrator` (no parent_tool_use_id) or the dispatching
#   Agent/Task tool_use's input.subagent_type (`subagent` when absent).

# A Bash command issued this many times in one context is a polling loop.
def polling_min_repeats: 3;
def slowest_limit: 10;

def round4: (. * 10000 + 0.5 | floor) / 10000;

def ts_ms:
  if type == "string" and length >= 19 then
    try (((.[0:19] + "Z") | fromdateiso8601) * 1000
         + (if .[19:20] == "." then
              ((.[20:] | split("Z")[0] | split("+")[0] | split("-")[0]) + "000")[0:3] | tonumber
            else 0 end))
    catch null
  else null end;

def utf8len:
  reduce explode[] as $c (0;
    . + (if $c < 128 then 1 elif $c < 2048 then 2 elif $c < 65536 then 3 else 4 end));

def result_bytes:
  if type == "string" then utf8len
  elif type == "array" then
    ([.[] | select(type == "object" and (.text | type) == "string") | .text | utf8len] | add // 0)
  else 0 end;

def seg_len:
  reduce explode[] as $c ({n: 0, open: true};
    if .open and (($c >= 48 and $c <= 57) or ($c >= 65 and $c <= 90)
                  or ($c >= 97 and $c <= 122) or $c == 45 or $c == 46 or $c == 95)
    then .n += 1 else .open = false end)
  | .n;

def strip_home($pre):
  split($pre)
  | (.[0] // "") + (.[1:] | map(seg_len as $n | "~" + .[$n:]) | join(""));

def redact:
  if type != "string" then .
  else
    reduce ($redact[]?
            | select(type == "array" and length == 2
                     and (.[0] | type) == "string" and (.[0] | length) > 0)) as $p
      (.; split($p[0]) | join($p[1] | tostring))
    | strip_home("/Users/") | strip_home("/home/")
    | .[0:160]
  end;

def req_usage:
  {output_tokens: (.output_tokens // 0),
   input_tokens: (.input_tokens // 0),
   cache_read_tokens: (.cache_read_input_tokens // 0),
   cache_write_tokens: (.cache_creation_input_tokens // 0)};

# Session fields live at the top of the reduce state, beside out/emitted/seen/known,
# so each event's update is a shallow path assignment rather than a nested copy.
def new_session($key; $skip):
  {key: $key, skip: $skip, result: null, seq: 0,
   tmin: null, tmax: null, at_min: null, at_max: null,
   prev_t: null, prev_at: null, prev_ckey: "",
   ctx: {"": {last_t: null, last_seq: 0, retry: false, awaiting: true}},
   dispatch: {}, dorder: [], reqidx: {}, reqs: [],
   calls: {}, corder: [], open: {},
   gaps: [], retries: 0, retry_errors: {}, denied: {}, rl: {}};

def ctx_name($k):
  if $k == "" then "orchestrator" else (.dispatch[$k].type // "subagent") end;

def classify_gap:
  ([.ctx | to_entries[] | select(.value.awaiting == true)] | max_by(.value.last_seq)) as $w
  | if $w != null then {class: "in_flight_request", context: ctx_name($w.key)}
    elif (.open | length) > 0 then
      (.open | to_entries | max_by(.value) | .key) as $id
      | {class: "tool_running", context: .calls[$id].context}
    else {class: "unknown", context: ctx_name(.prev_ckey)} end;

def on_time($t; $at; $ck):
  if $t == null then .
  else
    (if .prev_t != null and ($t - .prev_t) > ($idle_threshold_s * 1000) then
       .gaps += [classify_gap + {start_at: .prev_at, length_ms: ($t - .prev_t)}]
     else . end)
    | .seq += 1
    | .prev_t = $t | .prev_at = $at | .prev_ckey = $ck
    | (if .tmin == null or $t < .tmin then .tmin = $t | .at_min = $at else . end)
    | (if .tmax == null or $t > .tmax then .tmax = $t | .at_max = $at else . end)
  end;

def add_call($u; $ck; $t; $at):
  if .calls[$u.id] != null then .
  else
    (if $t != null then $t else .prev_t end) as $st
    | (if $at != null then $at else .prev_at end) as $sat
    | ctx_name($ck) as $ctx
    | .calls[$u.id] = {tool: ($u.name // "unknown"), context: $ctx, started_at: $sat,
                       start_t: $st, duration_ms: null, result_bytes: null, is_error: null,
                       command: (if $u.name == "Bash" then ($u.input.command // null | redact) else null end)}
    | .corder += [$u.id]
    | .open[$u.id] = $st
    | if $u.name == "Agent" or $u.name == "Task" then
        .dispatch[$u.id] = {type: ($u.input.subagent_type // "subagent"),
                            description: ($u.input.description // null | redact),
                            start_t: $st, started_at: $sat}
        | .dorder += [$u.id]
      else . end
  end;

def on_assistant($e; $t; $at; $ck):
  ($ck + "|" + ($e.message.id // $e.uuid // "" | tostring)) as $rk
  | (($e.message.usage // {}) | req_usage) as $u
  | (if .reqidx[$rk] == null then
       (if $t == null then null
        elif .ctx[$ck].last_t != null then $t - .ctx[$ck].last_t
        elif $ck != "" and .dispatch[$ck].start_t != null then $t - .dispatch[$ck].start_t
        else null end) as $lat
       | {started_at: $at, context: ctx_name($ck), latency_ms: $lat,
          after_retry: (.ctx[$ck].retry == true), _parent: $ck} as $req
       | .reqidx[$rk] = (.reqs | length)
       | .reqs += [$req + $u]
     else
       .reqidx[$rk] as $i | .reqs[$i] = (.reqs[$i] + $u)
     end)
  | reduce ($e.message.content
            | if type == "array" then .[] else empty end
            | select(type == "object" and .type == "tool_use" and (.id | type) == "string")) as $c
      (.; add_call($c; $ck; $t; $at))
  | .ctx[$ck].awaiting = false;

def on_user($e; $t; $ck):
  (if $t != null then $t else .prev_t end) as $et
  | reduce ($e.message.content
            | if type == "array" then .[] else empty end
            | select(type == "object" and .type == "tool_result" and (.tool_use_id | type) == "string")) as $r
      (.;
       $r.tool_use_id as $id
       | if .calls[$id] == null or .calls[$id].duration_ms != null then .
         else
           (if $et != null and .calls[$id].start_t != null then $et - .calls[$id].start_t else null end) as $d
           | .calls[$id].duration_ms = $d
           | .calls[$id].result_bytes = ($r.content | result_bytes)
           | .calls[$id].is_error = ($r.is_error == true)
           | del(.open[$id])
           | if .dispatch[$id] != null and .ctx[$id] != null then .ctx[$id].awaiting = false else . end
         end)
  | .ctx[$ck].awaiting = true;

def finalize:
  .result as $r
  | (if .tmin != null then .tmax - .tmin else null end) as $wall
  | ([.gaps[].length_ms] | add // 0) as $idle
  | (reduce (($r.permission_denials // [])[] | .tool_use_id | strings) as $id
       (.denied; .[$id] = true)) as $den
  | [.reqs[] | del(._parent)] as $ri
  | (.reqs | group_by(._parent) | map({key: .[0]._parent, value: .}) | from_entries) as $byp
  | [.corder[] as $id | .calls[$id]
     | {tool, context, started_at, duration_ms, result_bytes, is_error,
        permission_denied: ($den[$id] == true)}] as $items
  | def rollup:
      ([.[] | .latency_ms | numbers] | sort) as $l
      | ($l | length) as $n
      | def rank($p): if $n == 0 then null else $l[((($n * $p) + 99) / 100 | floor) - 1] end;
      {count: length, p50_ms: rank(50), p90_ms: rank(90), p99_ms: rank(99),
       max_ms: (if $n == 0 then null else $l[-1] end),
       over_threshold: ([$l[] | select(. > ($idle_threshold_s * 1000))] | length)};
    def durs: [.[] | .duration_ms | numbers];
  {session_id: .key,
   complete: ($r != null),
   first_at: .at_min,
   last_at: .at_max,
   time: {wall_ms: $wall,
          duration_ms: $r.duration_ms,
          duration_api_ms: $r.duration_api_ms,
          host_suspended_ms: (if $wall != null and ($r.duration_ms | type) == "number"
                              then ([0, $wall - $r.duration_ms] | max) else null end),
          idle_ms: $idle,
          active_ms: (if $wall != null then $wall - $idle else null end),
          idle_threshold_s: $idle_threshold_s,
          suspend_source: "none",
          idle_gaps: .gaps},
   requests: {items: $ri,
              overall: ($ri | rollup),
              by_context: ($ri | group_by(.context) | map({key: .[0].context, value: rollup}) | from_entries)},
   tools: {items: $items,
           by_tool: ($items | group_by([.tool, .context])
                     | map({tool: .[0].tool, context: .[0].context, count: length,
                            total_ms: (durs | add // 0), max_ms: (durs | max)})),
           slowest: ([$items[] | select(.duration_ms != null)] | sort_by(0 - .duration_ms) | .[0:slowest_limit]),
           polling: ([.corder[] as $id | .calls[$id] | select(.tool == "Bash" and .command != null)]
                     | group_by([.context, .command])
                     | map(select(length >= polling_min_repeats)
                           | {context: .[0].context, command: .[0].command, count: length,
                              total_ms: (durs | add // 0)}))},
   subagents: [.dorder[] as $id | .dispatch[$id] as $d | .calls[$id].duration_ms as $dur
               | ($byp[$id] // []) as $rq
               | {type: $d.type, description: $d.description, started_at: $d.started_at,
                  duration_ms: $dur, requests: ($rq | length),
                  output_tokens: ([$rq[].output_tokens] | add // 0),
                  input_tokens: ([$rq[].input_tokens] | add // 0),
                  cache_read_tokens: ([$rq[].cache_read_tokens] | add // 0),
                  cache_write_tokens: ([$rq[].cache_write_tokens] | add // 0),
                  wall_share: (if $dur != null and $wall != null and $wall > 0
                               then ($dur / $wall | round4) else null end)}],
   cost: (if $r == null then
            {total_cost_usd: null, by_model: null, input_tokens: null, output_tokens: null,
             thinking_tokens: null, cache_read_tokens: null, cache_write_5m_tokens: null,
             cache_write_1h_tokens: null, cache_hit_ratio: null}
          else
            ($r.usage // {}) as $u
            | (($u.cache_read_input_tokens // 0) + ($u.cache_creation_input_tokens // 0)
               + ($u.input_tokens // 0)) as $den_t
            | {total_cost_usd: $r.total_cost_usd,
               by_model: ((if ($r.modelUsage | type) == "object" and ($r.modelUsage | length) > 0
                           then $r.modelUsage else ($r.model_usage_since_last_result // {}) end)
                          | map_values(.costUSD)),
               input_tokens: $u.input_tokens,
               output_tokens: $u.output_tokens,
               thinking_tokens: $u.output_tokens_details.thinking_tokens,
               cache_read_tokens: $u.cache_read_input_tokens,
               cache_write_5m_tokens: $u.cache_creation.ephemeral_5m_input_tokens,
               cache_write_1h_tokens: $u.cache_creation.ephemeral_1h_input_tokens,
               cache_hit_ratio: (if $den_t > 0
                                 then (($u.cache_read_input_tokens // 0) / $den_t | round4)
                                 else null end)}
          end),
   reliability: {api_retries: .retries,
                 api_retry_errors: .retry_errors,
                 permission_denials: ($r.permission_denials | if type == "array" then length else null end),
                 subagents_spawned: $r.subagent_stats.spawned,
                 subagents_failed: $r.subagent_stats.failed,
                 subagents_killed: ($r.subagent_stats.killed
                                    | if type == "object" then ([.[] | numbers] | add // 0) else . end),
                 terminal_reason: $r.terminal_reason,
                 stop_reason: $r.stop_reason,
                 num_turns: $r.num_turns,
                 ttft_ms: $r.ttft_ms,
                 rate_limit_peak: .rl}};

def close_current($followed):
  if .active == true and .skip != true and (.result != null or $followed) then
    .out += [finalize] | .emitted[.key] = true
  else . end;

def open_session($sid):
  ($sid // "unknown" | tostring) as $sid
  | ((.seen[$sid] // 0) + 1) as $n
  | (if $n == 1 then $sid else $sid + "#" + ($n | tostring) end) as $key
  | .seen[$sid] = $n
  | (.known[$key] == true or .emitted[$key] == true) as $skip
  | . + new_session($key; $skip) + {active: true};

def step($e):
  if $e.type == "system" and $e.subtype == "init" then
    close_current(true) | open_session($e.session_id)
  elif .active != true or .skip == true then .
  else
    ($e.parent_tool_use_id // "" | tostring) as $ck
    | ($e.timestamp | if type == "string" then . else null end) as $at
    | ($at | ts_ms) as $t
    | ($e.type == "system" and $e.subtype == "api_retry") as $retry
    | on_time($t; $at; $ck)
    | if $e.type == "assistant" then on_assistant($e; $t; $at; $ck)
      elif $e.type == "user" then on_user($e; $t; $ck)
      elif $retry then
        .ctx[$ck].retry = true
        | .retries += 1
        | .retry_errors[$e.error_status | tostring] += 1
      elif $e.type == "system" and $e.subtype == "permission_denied" then
        if ($e.tool_use_id | type) == "string" then .denied[$e.tool_use_id] = true else . end
      elif $e.type == "rate_limit_event" then
        ($e.rate_limit_info // {}) as $i
        | reduce ([$i.rateLimitType, $i.utilization],
                  ($i.unifiedWindows // {} | if type == "object" then to_entries[] else empty end
                   | [.key, .value.utilization?])
                  | select((.[0] | type) == "string" and (.[1] | type) == "number")) as $w
            (.; .rl[$w[0]] = ([.rl[$w[0]], $w[1]] | max))
      elif $e.type == "result" then .result = ($e | del(.result))
      else . end
    | if $t == null then .
      else
        .ctx[$ck].last_t = $t
        | .ctx[$ck].last_seq = .seq
        | if $retry then . else .ctx[$ck].retry = false end
      end
  end;

def overlay:
  [$suspend[]?
   | select(type == "array" and length >= 2 and (.[0] | type) == "number" and (.[1] | type) == "number")] as $iv
  | map(.time.suspend_source = $suspend_source
        | .time.idle_gaps |= ((. // [])
            | map((.start_at | ts_ms) as $s | .length_ms as $len
                  | if $s != null and ([$iv[] | select(.[0] < ($s + $len) and $s < .[1])] | length) > 0
                    then .class = "host_asleep" else . end)));

if $mode == "sessions" then
  reduce (inputs | fromjson? | select(type == "object")) as $e
    ({out: [], emitted: {}, seen: {}, active: false,
      known: (reduce ($known[]? | strings) as $k ({}; .[$k] = true))};
     step($e))
  | close_current(false)
  | .out
elif $mode == "overlay" then
  overlay
else
  error("run-analytics.jq: unknown --arg mode \"\($mode)\"; expected sessions or overlay")
end
