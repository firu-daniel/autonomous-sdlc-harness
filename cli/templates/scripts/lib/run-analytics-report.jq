# run-analytics-report.jq — the whole-run roll-up and run-analytics.md.
#
# Owns: recomputing a run-analytics document's `.run` from its `.sessions`, and
# rendering the document as Markdown. It reads no stream, file or host, and
# builds no document: merging sessions, ordering them and writing either file
# are run-analytics.sh's, its only caller. Same document in, same bytes out.
#
# Floor: jq 1.5 — no regex, no ceil/round/abs, no unary minus, no $__loc__.
#
# Document: {schema: 1, branch, sessions: [<session record>, …], run}, sessions
# oldest first, each record as lib/run-analytics.jq's header states it. A schema
# other than 1 is an error naming it.
#
# Mode `rollup`:   jq -S -f run-analytics-report.jq --arg mode rollup
#   document in -> the same document with `.run` replaced:
#   {sessions, complete_sessions, first_at, last_at, span_ms, wall_ms,
#    duration_ms, duration_api_ms, host_suspended_ms, idle_ms, active_ms,
#    total_cost_usd, input_tokens, output_tokens, thinking_tokens,
#    cache_read_tokens, cache_write_5m_tokens, cache_write_1h_tokens,
#    cache_hit_ratio, requests, api_retries, permission_denials,
#    subagents_failed, subagents_killed, slowest_subagent, rate_limit_peak}
#   Sums skip null (null when every session's value is null). span_ms = last
#   session's last_at - first session's first_at. cache_hit_ratio = read /
#   (read + write_5m + write_1h + input), 4 decimals, null on zero. requests =
#   {count, p50_ms, p90_ms, p99_ms, max_ms, over_threshold} over every session's
#   requests.items pooled, nearest rank, each item against its own session's
#   idle_threshold_s. slowest_subagent = {type, description, duration_ms,
#   session (1-based position in .sessions)} or null. rate_limit_peak = max per
#   window. branch-status reads wall_ms, active_ms, host_suspended_ms, idle_ms,
#   sessions, total_cost_usd, cache_hit_ratio and slowest_subagent: fixed names.
#
# Mode `markdown`: jq -r -f run-analytics-report.jq --arg mode markdown
#   document in -> Markdown text: `## Whole run`, then `## Session <k>` per
#   session, oldest first. `.run` is recomputed, never read. Nothing in the text
#   varies between two renders of one document.
#
# RESUMED SESSIONS. A record keyed "<session_id>#<N>" is a resume, and its result
# event reports total_cost_usd, by_model cost, duration_api_ms and the sub-agent
# spawned/failed/killed counts cumulatively over the earlier occurrences
# (measured: 2.11, 5.67, 7.62 USD over one session's three results). Both modes
# use each occurrence's share: its value minus the nearest earlier occurrence's.

def round4: (. * 10000 + 0.5 | floor) / 10000;
def round6: (. * 1000000 + 0.5 | floor) / 1000000;

def ts_ms:
  if type == "string" and length >= 19 then
    try (((.[0:19] + "Z") | fromdateiso8601) * 1000
         + (if .[19:20] == "." then
              ((.[20:] | split("Z")[0] | split("+")[0] | split("-")[0]) + "000")[0:3] | tonumber
            else 0 end))
    catch null
  else null end;

def num_sum(f): [.[] | f | numbers] | if length == 0 then null else add end;

# Nearest rank over an ascending array: sorted[ceil(n*p/100) - 1].
def rank($l; $p):
  ($l | length) as $n
  | if $n == 0 then null else $l[((($n * $p) + 99) / 100 | floor) - 1] end;

def less($prev):
  if type != "number" then null
  elif ($prev | type) == "number" then . - $prev
  else . end;

# Input: .sessions. Output: one {total_cost_usd, by_model, duration_api_ms,
# subagents_spawned, subagents_failed, subagents_killed} per session, its own share.
def shares:
  . as $ss
  | reduce range(0; $ss | length) as $i ({prev: {}, out: []};
      $ss[$i] as $s
      | ($s.session_id | tostring | split("#")[0]) as $b
      | (.prev[$b] // {}) as $p
      | {total_cost_usd: $s.cost.total_cost_usd,
         by_model: $s.cost.by_model,
         duration_api_ms: $s.time.duration_api_ms,
         subagents_spawned: $s.reliability.subagents_spawned,
         subagents_failed: $s.reliability.subagents_failed,
         subagents_killed: $s.reliability.subagents_killed} as $v
      | .out += [{
          total_cost_usd: ($v.total_cost_usd | less($p.total_cost_usd) | if . == null then . else round6 end),
          by_model: ($v.by_model
                     | if type != "object" then null
                       else ($p.by_model // {}) as $pm
                         | reduce keys[] as $k (.; .[$k] |= (less($pm[$k]) | if . == null then . else round6 end))
                       end),
          duration_api_ms: ($v.duration_api_ms | less($p.duration_api_ms)),
          subagents_spawned: ($v.subagents_spawned | less($p.subagents_spawned)),
          subagents_failed: ($v.subagents_failed | less($p.subagents_failed)),
          subagents_killed: ($v.subagents_killed | less($p.subagents_killed))}]
      | .prev[$b] = ($p + ($v | with_entries(select(.value != null)))))
  | .out;

def pooled_requests:
  [.[] | .time.idle_threshold_s as $th | (.requests.items // [])[] | {l: .latency_ms, th: $th}] as $it
  | ([$it[] | .l | numbers] | sort) as $l
  | {count: ($it | length),
     p50_ms: rank($l; 50), p90_ms: rank($l; 90), p99_ms: rank($l; 99),
     max_ms: (if ($l | length) == 0 then null else $l[-1] end),
     over_threshold: ([$it[] | select((.l | type) == "number" and (.th | type) == "number"
                                      and .l > (.th * 1000))] | length)};

# Input: .sessions. Output: the `.run` object the header lists.
def run_of:
  . as $ss
  | shares as $sh
  | ($ss | num_sum(.cost.input_tokens)) as $in
  | ($ss | num_sum(.cost.cache_read_tokens)) as $cr
  | ($ss | num_sum(.cost.cache_write_5m_tokens)) as $w5
  | ($ss | num_sum(.cost.cache_write_1h_tokens)) as $w1
  | (($cr // 0) + ($w5 // 0) + ($w1 // 0) + ($in // 0)) as $den
  | ($ss | if length == 0 then null else .[0].first_at end) as $first
  | ($ss | if length == 0 then null else .[-1].last_at end) as $last
  | {sessions: ($ss | length),
     complete_sessions: ([$ss[] | select(.complete == true)] | length),
     first_at: $first,
     last_at: $last,
     span_ms: (($first | ts_ms) as $a | ($last | ts_ms) as $z
               | if $a != null and $z != null then $z - $a else null end),
     wall_ms: ($ss | num_sum(.time.wall_ms)),
     duration_ms: ($ss | num_sum(.time.duration_ms)),
     duration_api_ms: ($sh | num_sum(.duration_api_ms)),
     host_suspended_ms: ($ss | num_sum(.time.host_suspended_ms)),
     idle_ms: ($ss | num_sum(.time.idle_ms)),
     active_ms: ($ss | num_sum(.time.active_ms)),
     total_cost_usd: ($sh | num_sum(.total_cost_usd) | if . == null then . else round6 end),
     input_tokens: $in,
     output_tokens: ($ss | num_sum(.cost.output_tokens)),
     thinking_tokens: ($ss | num_sum(.cost.thinking_tokens)),
     cache_read_tokens: $cr,
     cache_write_5m_tokens: $w5,
     cache_write_1h_tokens: $w1,
     cache_hit_ratio: (if $den > 0 then (($cr // 0) / $den | round4) else null end),
     requests: ($ss | pooled_requests),
     api_retries: ($ss | num_sum(.reliability.api_retries)),
     permission_denials: ($ss | num_sum(.reliability.permission_denials)),
     subagents_failed: ($sh | num_sum(.subagents_failed)),
     subagents_killed: ($sh | num_sum(.subagents_killed)),
     slowest_subagent: ([range(0; $ss | length) as $i
                         | ($ss[$i].subagents // [])[]
                         | select((.duration_ms | type) == "number")
                         | {type, description, duration_ms, session: ($i + 1)}]
                        | if length == 0 then null else (sort_by(0 - .duration_ms) | .[0]) end),
     rate_limit_peak: (reduce ($ss[] | .reliability.rate_limit_peak
                               | if type == "object" then to_entries[] else empty end
                               | select((.value | type) == "number")) as $w
                         ({}; .[$w.key] = ([.[$w.key], $w.value] | max)))};

def check_doc:
  if type != "object" then error("run-analytics-report.jq: input is not a run-analytics document")
  elif .schema != 1 then
    error("run-analytics-report.jq: document schema \(.schema | tojson) is not supported; expected 1")
  elif (.sessions | type) != "array" then error("run-analytics-report.jq: .sessions is not an array")
  else . end;

# --- Markdown -----------------------------------------------------------------

def pad2: tostring | if length < 2 then "0" + . else . end;

# XhYYm from an hour up, Ym SSs from a minute up, S.Ds below a minute.
def fmt_dur:
  if type != "number" then "—"
  elif . < 0 then "-" + ((0 - .) | fmt_dur)
  else (. | floor) as $ms
    | if $ms >= 3600000 then "\($ms / 3600000 | floor)h\(($ms % 3600000) / 60000 | floor | pad2)m"
      elif $ms >= 60000 then "\($ms / 60000 | floor)m \(($ms % 60000) / 1000 | floor | pad2)s"
      else ($ms / 100 | floor) as $ds | "\($ds / 10 | floor).\($ds % 10)s" end
  end;

def fmt_usd:
  if type != "number" then "—"
  else (. * 100 + 0.5 | floor) as $c | "$\($c / 100 | floor).\($c % 100 | pad2)" end;

def fmt: if . == null then "—" else tostring end;

def fmt_map: if type == "object" and length > 0 then . as $o | [keys[] | "\(.) \($o[.] | fmt)"] | join(", ") else "—" end;

def cell: fmt | split("|") | join("\\|") | split("\r\n") | join(" ") | split("\n") | join(" ") | split("\r") | join(" ");

def row: "| " + (map(cell) | join(" | ")) + " |";

def table($head; $rows):
  if ($rows | length) == 0 then ["None."]
  else [($head | row), "|" + ($head | map("---|") | join(""))] + [$rows[] | row] end;

def latency_row($label): [$label, .count, (.p50_ms | fmt_dur), (.p90_ms | fmt_dur),
                          (.p99_ms | fmt_dur), (.max_ms | fmt_dur), .over_threshold];

def whole_run($b):
  run_of as $r
  | ["# Run analytics — \($b | fmt)", "", "## Whole run", ""]
    + table(["Measure", "Value"]; [
        ["Sessions", "\($r.sessions) (\($r.sessions - $r.complete_sessions) incomplete)"],
        ["Span", ($r.span_ms | fmt_dur)],
        ["Wall", ($r.wall_ms | fmt_dur)],
        ["Active", ($r.active_ms | fmt_dur)],
        ["Host-suspended", ($r.host_suspended_ms | fmt_dur)],
        ["Idle", ($r.idle_ms | fmt_dur)],
        ["Cost", ($r.total_cost_usd | fmt_usd)],
        ["Input tokens", $r.input_tokens],
        ["Output tokens", $r.output_tokens],
        ["Thinking tokens", $r.thinking_tokens],
        ["Cache read tokens", $r.cache_read_tokens],
        ["Cache write tokens (5m / 1h)", "\($r.cache_write_5m_tokens | fmt) / \($r.cache_write_1h_tokens | fmt)"],
        ["Cache hit ratio", $r.cache_hit_ratio],
        ["Requests", $r.requests.count],
        ["Request latency p50 / p90 / p99 / max",
         "\($r.requests.p50_ms | fmt_dur) / \($r.requests.p90_ms | fmt_dur) / \($r.requests.p99_ms | fmt_dur) / \($r.requests.max_ms | fmt_dur)"],
        ["Requests over the idle threshold", $r.requests.over_threshold],
        ["API retries", $r.api_retries],
        ["Permission denials", $r.permission_denials],
        ["Sub-agents failed / killed", "\($r.subagents_failed | fmt) / \($r.subagents_killed | fmt)"],
        ["Slowest sub-agent",
         ($r.slowest_subagent
          | if . == null then null
            else "\(.type | fmt) — \(.description | fmt) — \(.duration_ms | fmt_dur) (session \(.session))" end)],
        ["Rate-limit peak", ($r.rate_limit_peak | fmt_map)]]);

def session_md($k; $sh):
  .time as $t
  | .requests as $q
  | .tools as $tl
  | .cost as $c
  | .reliability as $rl
  | (.session_id | tostring | split("#") | length > 1) as $resumed
  | ["## Session \($k) — \(.first_at | fmt) → \(.last_at | fmt)"
       + (if .complete == false then " (incomplete — no result event)" else "" end),
     "", "Session id: `\(.session_id | fmt)`", ""]
    + (if $resumed then
         ["A resume of an earlier session: the result event's cost, per-model cost, `duration_api_ms` and sub-agent counts are cumulative, so this section shows this occurrence's share.", ""]
       else [] end)
    + ["### Time", ""]
    + table(["Wall", "duration_ms", "duration_api_ms", "Host-suspended", "Idle", "Active", "Suspend source"];
            [[($t.wall_ms | fmt_dur), ($t.duration_ms | fmt_dur), ($sh.duration_api_ms | fmt_dur),
              ($t.host_suspended_ms | fmt_dur), ($t.idle_ms | fmt_dur), ($t.active_ms | fmt_dur),
              $t.suspend_source]])
    + ["", "### Idle gaps (over \($t.idle_threshold_s | fmt) s)", ""]
    + table(["Start", "Length", "Context", "Class"];
            [($t.idle_gaps // [])[] | [.start_at, (.length_ms | fmt_dur), .context, .class]])
    + ["", "### Request latency", ""]
    + table(["Context", "Requests", "p50", "p90", "p99", "Max", "Over threshold"];
            ([$q.overall // empty | latency_row("all")]
             + [($q.by_context // {}) as $bc | $bc | keys[] as $x | $bc[$x] | latency_row($x)]))
    + ["", "### Tool time", ""]
    + table(["Tool", "Context", "Calls", "Total", "Max"];
            [($tl.by_tool // [])[] | [.tool, .context, .count, (.total_ms | fmt_dur), (.max_ms | fmt_dur)]])
    + ["", "#### Slowest calls", ""]
    + table(["Tool", "Context", "Started", "Duration", "Result bytes", "Error", "Permission denied"];
            [($tl.slowest // [])[] | [.tool, .context, .started_at, (.duration_ms | fmt_dur),
                                       .result_bytes, .is_error, .permission_denied]])
    + ["", "#### Polling loops", ""]
    + table(["Context", "Command", "Count", "Total"];
            [($tl.polling // [])[] | [.context, .command, .count, (.total_ms | fmt_dur)]])
    + ["", "### Sub-agents", ""]
    + table(["Type", "Description", "Duration", "Requests", "Output tokens", "Input tokens",
             "Cache read tokens", "Cache write tokens", "Wall share"];
            [(.subagents // [])[] | [.type, .description, (.duration_ms | fmt_dur), .requests,
                                     .output_tokens, .input_tokens, .cache_read_tokens,
                                     .cache_write_tokens, .wall_share]])
    + ["", "### Cost and tokens", ""]
    + table(["Measure", "Value"];
            [["Cost", ($sh.total_cost_usd | fmt_usd)]]
            + [($sh.by_model // {}) as $bm | $bm | keys[] as $m | ["Cost — \($m)", ($bm[$m] | fmt_usd)]]
            + [["Input tokens", $c.input_tokens],
               ["Output tokens", $c.output_tokens],
               ["Thinking tokens", $c.thinking_tokens],
               ["Cache read tokens", $c.cache_read_tokens],
               ["Cache write tokens (5m / 1h)", "\($c.cache_write_5m_tokens | fmt) / \($c.cache_write_1h_tokens | fmt)"],
               ["Cache hit ratio", $c.cache_hit_ratio]])
    + ["", "### Reliability", ""]
    + table(["Measure", "Value"];
            [["API retries", "\($rl.api_retries | fmt)"
                             + ($rl.api_retry_errors
                                | if type == "object" and length > 0
                                  then . as $e | " (by error: \([keys[] | "\(.) ×\($e[.])"] | join(", ")))"
                                  else "" end)],
             ["Permission denials", $rl.permission_denials],
             ["Sub-agents spawned / failed / killed",
              "\($sh.subagents_spawned | fmt) / \($sh.subagents_failed | fmt) / \($sh.subagents_killed | fmt)"],
             ["terminal_reason", $rl.terminal_reason],
             ["stop_reason", $rl.stop_reason],
             ["Turns", $rl.num_turns],
             ["Time to first token", ($rl.ttft_ms | fmt_dur)],
             ["Rate-limit peak", ($rl.rate_limit_peak | fmt_map)]]);

def markdown:
  .branch as $b
  | .sessions as $ss
  | ($ss | shares) as $sh
  | ($ss | whole_run($b))
    + [range(0; $ss | length) as $i | ([""] + ($ss[$i] | session_md($i + 1; $sh[$i])))[]]
  | join("\n");

check_doc
| if $mode == "rollup" then .run = (.sessions | run_of)
  elif $mode == "markdown" then markdown
  else error("run-analytics-report.jq: unknown --arg mode \"\($mode)\"; expected rollup or markdown")
  end
