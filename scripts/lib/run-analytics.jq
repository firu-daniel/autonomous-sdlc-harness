# run-analytics.jq — per-session records from one headless stream file, and Run
# gates round records from a branch's finished rounds.
#
# Owns: turning one `<state_dir>/autonomous_logs/<branch>.stream.jsonl`'s raw
# `stream-json` events into one record per headless session, re-classing
# those records' idle gaps against host suspend intervals, turning sub-agent
# transcripts into final per-request and per-dispatch token figures, and turning
# a branch's finished Run gates round records (mode `rounds`) into round records,
# and its finished Run gates logs (mode `gate_logs`) into lists of possible network
# attempts, deciding which of each are new. It reads no file of
# its own, resolves no path, consults no host and merges nothing: the roll-up and
# the Markdown are lib/run-analytics-report.jq's; locating files, reading suspend
# intervals, merging and writing are run-analytics.sh's, its only caller.
#
# Floor: jq 1.5 — no utf8bytelength, no --rawfile, no $ARGS.named, no regex, no
# jq keyword as a $ variable, . field or object key (jq 1.7 accepts one, jq 1.6
# does not), and every `if` has an `else`.
#
# EVERY MODE TAKES EVERY VARIABLE: $mode, $idle_threshold_s, $known, $redact,
# $suspend, $suspend_source. jq resolves every $name the program references at
# compile time, not when the branch holding it runs, so a call omitting one
# aborts with `$<name> is not defined` whatever its mode — sessions, overlay,
# transcripts, attach, rounds or gate_logs. Each mode ignores the ones it does not
# use; pass those as the neutral values shown. The variable set is unchanged, and a
# variable may be bound by --slurpfile as well as by --arg / --argjson: modes
# `rounds` and `gate_logs` bind $known that way, as the recorded rounds or gate-log
# array wrapped in a one-element array, not session ids. Every other mode keeps
# --argjson known.
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
#     takes the nearest preceding one (the rule devscene-run.yml's
#     THE SELF-PAUSE POINT, MEASURED states).
#   - Every free-text field written (dispatch description, Bash command) goes
#     through `redact`: `redact_text` — each $redact pair replaced literally, in
#     order, then any remaining /Users/<segment> or /home/<segment> -> ~ — then
#     cut to 160 characters. network_refusals' command and line, and mode
#     `gate_logs`' line, go through `redact_text` uncut. The init event's
#     working-directory field is never read.
#     Mode `rounds`' round ids, gate ids and file paths go through `redact_path`,
#     the replace pairs only, with neither the home step nor the 160-character
#     cut, because they are keys and record values, not display text, and the
#     home step matches /home/ inside a relative path.
#
# Mode `overlay`:
#   jq -c -S -f run-analytics.jq --arg mode overlay
#      --argjson idle_threshold_s <int> --argjson known '[]' --argjson redact '[]'
#      --argjson suspend '<[[start_ms, end_ms], …]>'
#      --arg suspend_source <pmset|journalctl|file|none> < <records array>
#   Per record: sets time.suspend_source, and re-classes as host_asleep (context
#   kept) every idle gap overlapping an interval. host_asleep outranks every class.
#
# Mode `transcripts`:
#   jq -n -R -c -S -f run-analytics.jq --arg mode transcripts
#      --argjson idle_threshold_s 1 --argjson known '[]' --argjson redact '[]'
#      --argjson suspend '[]' --arg suspend_source none < <concatenated transcripts>
#   Raw lines, `inputs | fromjson?`. A line {"run_analytics_transcript":"<agent_id>"}
#   starts that agent's transcript; lines before the first marker are ignored.
#   Per agent, each assistant line with a string message.id and an object
#   message.usage counts; the LAST such line per message.id wins.
#   Output: {"<agent_id>": {output_tokens, input_tokens, cache_read_tokens,
#            cache_write_tokens, requests: {"<message_id>": {the same four}}}};
#   the four totals are sums over requests. An agent with no such line is omitted.
#
# Mode `attach`:
#   jq -c -S -f run-analytics.jq --arg mode attach (same neutral variables)
#      < {"records": [<session record>, …], "transcripts": <transcripts output>}
#   Output: the records array. A subagents[] entry whose agent_id is a key of
#   transcripts takes its four totals and token_source "transcript"; a
#   requests.items[] entry whose message_id is in any agent's requests takes those
#   four values. Nothing else changes.
#
# Mode `rounds` (the only mode that reads Run gates records):
#   jq -n -R -c -S -f run-analytics.jq --arg mode rounds
#      --argjson idle_threshold_s 1 --slurpfile known <file holding the document's
#      .rounds array, or []> --argjson redact '<pairs>' --argjson suspend '[]'
#      --arg suspend_source none < <concatenated records>
#   $known reaches this mode through a file, never through argv: one recorded
#   round carries every test file's row, so the recorded rounds of a busy branch
#   outgrow Linux's per-argument limit MAX_ARG_STRLEN (131072 bytes on 4 KiB
#   pages; in the harness's own repository, cli/test/helpers/fixture.mjs →
#   MAX_ARG_STRING_BYTES records it), and an --argjson of them would make exec of
#   jq fail with E2BIG. --slurpfile binds $known to a one-element array holding
#   the file's value, read here as $known[0]; when $known is not exactly one
#   element that is an array, the mode stops with an error, so the call exits
#   non-zero.
#   Input: raw lines, read with `inputs`. A line that `fromjson?` parses to an
#   object with string run_analytics_round (the round's label) and string record
#   starts that record; the lines up to the next such marker are its lines, less
#   exactly one empty line at its end (the caller appends a newline after each
#   file). Lines before the first marker are ignored.
#   Records, as this reader's contract. A gate command may write its own
#   `<label>.<suffix>` records beside the round's log (run-test-suite.sh → WHAT A
#   GATE IS TOLD); in the harness's own repository, scripts/lib/gate-round-lib.sh
#   and scripts/lib/test-timing-reporter.mjs write them. A gate that writes these
#   shapes is read. A record failing a check is unreadable, its reason naming the
#   first failed check:
#   - verdict: exactly one line, `pass`, or `fail` optionally followed by a space
#     and anything; only the first word is kept.
#   - gates.tsv: first line `phase\tgate\tstatus\tseconds`, last line
#     `end\tcomplete` or `end\tstopped`; every row between has four tab-separated
#     fields: phase `focused` or `full`, gate non-empty with no space, status
#     `ok`, `FAIL`, `BLOCKED` or `SKIPPED`, seconds all digits.
#   - focused.tests.tsv, full.tests.tsv: first line
#     `file\tstatus\tseconds\ttests\tfailed`, last line `end`; every row between
#     has five fields: file non-empty, not starting `/`, with no space and no `.`
#     or `..` segment; status `pass` or `fail`; seconds digits, optionally
#     followed by `.` and digits; tests and failed all digits.
#   - any other record name is refused as unknown.
#   The caller's test-file pattern and gate-id set are not checked: they are not
#   known here.
#   A valid <phase>.tests.tsv belongs to the round only when the label's gates.tsv
#   is readable and has a row of that phase; otherwise it is named in skipped only
#   (`no <phase> rows in gates.tsv`, or `no readable gates.tsv`), never in the
#   round's unreadable. A round truncates only its gates.tsv at its start, the
#   per-file record is written only in a phase where the test gate runs, and a
#   finished label re-runs when the tree changed (run-test-suite.sh → ONE RUN PER
#   LABEL), so a per-phase record can be an earlier attempt's.
#   Residual: a stale <phase>.tests.tsv still passes when this attempt's
#   gates.tsv has rows of that phase but the test gate wrote no record in it
#   (BLOCKED by a prerequisite, or the attempt killed first). It is narrow: a
#   label's focus set is computed from the newest other label's record, never its
#   own, so a resumed attempt normally gets the earlier attempt's focus set; the
#   test gate is then in both focused phases or in neither, and the narrowed test
#   gate always runs in full. No file-age test closes it, because no record
#   carries the attempt's start time: gates.tsv's mtime is its last append, which
#   postdates the attempt's own per-file record, and <label>.commit is renamed
#   into place at the run's end, just before .verdict (run-test-suite.sh → BESIDE
#   THE LOG), so a stale record and a fresh one compare the same way against
#   both. Closing it is the producer's: truncate or remove
#   <label>.<phase>.tests.tsv at round start.
#   Output: {"rounds": [<round record>, …], "skipped": [{"record":
#   "<label>.<record>", "reason": "<one line>"}, …]}, skipped sorted by record.
#   Round record: {round_id, verdict: "pass"|"fail", gates: {outcome:
#   "complete"|"stopped", rows: [{phase, gate, status, seconds}]}, tests:
#   {focused?, full?: [{file, status, seconds, tests, failed}]}, unreadable:
#   [<record name>, …] sorted}. Rows keep record order; nothing is sorted by
#   seconds. gates null means no readable gates.tsv, which this mode never emits.
#   A round is emitted only for a label with a readable verdict and a readable
#   gates.tsv; every record of a label not emitted is named in skipped, and so is
#   every unreadable or refused record of one emitted.
#   New versus recorded: the parse's {verdict, gates, tests, unreadable} is
#   compared with the LAST $known[0] entry whose round_id | split("#")[0] is the
#   label. None: emitted as the label. Equal: emitted nowhere. Different: emitted
#   as "<label>#<k + 1>", k the number of entries carrying that label. A recorded
#   entry is never altered. Order: labels ending `_round_<digits>` first, by the
#   text before the last `_round_` and then that number as a number; any other
#   label after them, by its text.
#
# Mode `gate_logs` (the only mode that reads a Run gates log):
#   jq -n -R -c -S -f run-analytics.jq --arg mode gate_logs
#      --argjson idle_threshold_s 1 --slurpfile known <file holding the document's
#      .gate_logs array, or []> --argjson redact '<pairs>' --argjson suspend '[]'
#      --arg suspend_source none < <concatenated logs>
#   $known is bound and checked as in mode `rounds`.
#   Input: raw lines, read with `inputs`. A line that `fromjson?` parses to an
#   object with string run_analytics_gate_log (the round's label) starts that log;
#   the lines up to the next marker are its lines, less exactly one empty line at
#   its end (the caller appends a newline after each file). Lines before the first
#   marker are ignored.
#   Attribution: a line that, after leading spaces, begins `ok `, `not ok ` or
#   `# Subtest: ` is a test-name line: it may set the current test file and is
#   never matched. A line names the test file in its first space-separated token
#   containing `.test.`, `.spec.` or `_test.`, with a leading `file://`, `(`, `'`
#   or `"` removed, cut at the first `:` after that marker, and trailing `)`, `'`,
#   `"` and `,` removed. Every other line first sets the current test file when it
#   names one.
#   Matching: a line carrying a gate_proxy_strings member is kind `proxy`;
#   otherwise one carrying a connect_error_strings member is kind `connect`. Its
#   test_file is the current test file, or null. Identical {kind, test_file, line}
#   are one match with a count, in first-occurrence order.
#   The four connect names are Node's and libc's error-code names, not strings a
#   recorded run measured.
#   Redaction: the label goes through `redact_path`, as mode `rounds`' does.
#   test_file goes through `redact_file`, whose home step is anchored at the
#   start, because the unanchored strip_home would merge two relative test files
#   under a `home/` segment (the comment above `def redact_path`). line is free
#   text in which an absolute path can sit anywhere, so it takes `redact_text`'s
#   unanchored step; two lines differing only in the segment after a `home/` are
#   kept as one match whose count sums both, an accepted residual.
#   Blind spots: a test that catches the error and passes leaves no trace; a plain
#   connect error cannot be told apart from an unreachable host; on macOS,
#   Seatbelt's own violation records go to the system log, not to the test
#   output; a test whose name or output quotes a string is matched too, except on
#   test-name lines.
#   Output: {"gate_logs": [{log_id, matches: [{kind, test_file, line, count}]}]},
#   one entry per log, a log with no match included.
#   New versus recorded: matches is compared with the LAST $known[0] entry whose
#   log_id | split("#")[0] is the label. None: emitted as the label. Equal:
#   emitted nowhere. Different: emitted as "<label>#<k + 1>", k the number of
#   entries carrying that label. Order: as mode `rounds` orders labels.
#
# Session record, of modes sessions, overlay and attach (top-level keys exactly these):
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
#   requests: {items: [{started_at, context, message_id, latency_ms, output_tokens,
#              input_tokens, cache_read_tokens, cache_write_tokens, after_retry}],
#              overall, by_context: {<context>: rollup}}
#     rollup = {count, p50_ms, p90_ms, p99_ms, max_ms, over_threshold}; count is
#     every request, percentiles (nearest rank) over those with a latency.
#     A request is one message.id within a context. An orchestrator request's
#     usage is from its last event; a sub-agent request's four token fields are
#     null, because the stream's sub-agent usage is in-progress (mode attach
#     fills them from the transcript). message_id: message.id, or null.
#     latency_ms: from the last timestamped event in the same context to the
#     request's first event; a sub-agent's first request with no earlier event in
#     its context measures from its dispatching tool_use. after_retry: a
#     system/api_retry of the same context lies between those two points.
#   tools: {items: [{tool, context, started_at, duration_ms, result_bytes,
#           is_error, permission_denied}], by_tool: [{tool, context, count,
#           total_ms, max_ms}], slowest: <top 10 items, Agent/Task excluded>,
#           polling: [{context, command, count, total_ms}]}
#     items and by_tool keep every call, Agent/Task dispatches included.
#   subagents: [{type, description, started_at, duration_ms, requests, agent_id,
#               token_source, output_tokens, input_tokens, cache_read_tokens,
#               cache_write_tokens, wall_share}]
#     agent_id: the dispatch's transcript id, from the closing tool_result's
#     tool_use_result.agentId or a system task_* event's task_id; never redacted.
#     token_source and the four token fields are null here (mode attach fills them).
#     requests is counted from the stream.
#   cost: {total_cost_usd, by_model, token_source, input_tokens, output_tokens,
#          cache_read_tokens, cache_write_tokens, cache_hit_ratio, thinking_tokens,
#          cache_write_5m_tokens, cache_write_1h_tokens}
#          (every value null when complete is false)
#     token_source "model_usage": the four token totals are sums over
#     result.modelUsage's models; "usage": result.usage, only for a session that
#     dispatched nothing and has no modelUsage; otherwise null with the four null.
#     cache_hit_ratio = cache_read / (cache_read + cache_write + input) over those.
#     thinking_tokens and the 5m/1h cache-write split are main-thread figures
#     from result.usage.
#   reliability: {api_retries, api_retry_errors, permission_denials,
#                 subagents_spawned, subagents_failed, subagents_killed,
#                 terminal_reason, stop_reason, num_turns, ttft_ms,
#                 rate_limit_peak}  (the result-event values null when incomplete)
#     rate_limit_peak: max utilization per window, from rate_limit_info's
#     rateLimitType/utilization and from each unifiedWindows.<window>.utilization
#     (measured streams carry a null top-level utilization).
#   network_refusals: [{context, tool, command, started_at, host, port, line}]
#     One entry per tool_result of a known call that counts: (a) is_error is true
#     and some line of its text carries a network_refusal_strings member, or (b)
#     some line begins with `<sandbox_violations>`. The strings are quoted from
#     docs/sandbox-verification.md rows N1, N5, CS3 and P1; N3's returned body and
#     N4's `curl: (7) Failed to connect …` are not matched, nor is a
#     permission-layer refusal. command: the raw Bash command through
#     `redact_text`, null for another tool. line: the first carrying line through
#     `redact_text`. host, port: from the first line naming them (`deny
#     network-outbound <host>:<port>` or `sandbox proxy: <host>:<port>: 403`),
#     else null. Residuals: a refused call whose command swallowed the error and
#     whose result has no line beginning `<sandbox_violations>` is missed; a
#     failing command whose output quotes a string is listed. A record without the
#     key predates the report; [] means scanned, none found.
#     network_refusal_strings mirrors scripts/lib/sandbox-probe/judge.sh →
#     sp__layer's `network` arm plus SP_N5_CANNOT_WIDEN, which exist only in the
#     harness's own repository. A string added there is added here, and
#     cli/test/run-analytics-network-parse.test.mjs fails when one is missing.
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

# The replace pairs alone, for mode rounds' keys and record values. No home step:
# strip_home splits on its prefix anywhere in the string, so the relative
# `src/home/a.test.ts` and `src/home/b.test.ts` would both become `src~`, and
# validation already refuses a file starting with `/`. No cut: it would shorten
# the record and merge two values sharing a 160-character prefix. `redact` is this
# followed by its own home steps and cut, so its output is unchanged.
def redact_path:
  if type != "string" then .
  else
    reduce ($redact[]?
            | select(type == "array" and length == 2
                     and (.[0] | type) == "string" and (.[0] | length) > 0)) as $p
      (.; split($p[0]) | join($p[1] | tostring))
  end;

def redact_text:
  if type != "string" then .
  else redact_path | strip_home("/Users/") | strip_home("/home/")
  end;

def redact:
  redact_text | if type == "string" then .[0:160] else . end;

# strip_home anchored at the string's start: a relative path never begins with `/`.
def strip_home_lead($pre):
  if startswith($pre) then
    .[($pre | length):] as $rest | ($rest | seg_len) as $n | "~" + $rest[$n:]
  else . end;

def redact_file:
  if type != "string" then .
  else redact_path | strip_home_lead("/Users/") | strip_home_lead("/home/")
  end;

def all_digits:
  length > 0 and ([explode[] | select(. < 48 or . > 57)] | length) == 0;

# A mirror: header → network_refusals.
def n5_refusal_string: "allowed_domains cannot widen network access";
def network_refusal_strings:
  ["<sandbox_violations>", "CONNECT tunnel failed", "host is not on the allow list",
   "This proxy requires authentication", n5_refusal_string];
def gate_proxy_strings: network_refusal_strings - [n5_refusal_string];
# Node's and libc's error-code names, not strings a recorded run measured.
def connect_error_strings: ["ECONNREFUSED", "ENETUNREACH", "EHOSTUNREACH", "EAI_AGAIN"];

def carries_any($set): . as $l | [$set[] as $s | $l | contains($s)] | any;

# One line -> {host, port} of the target it names, split at the last `:`.
def host_port:
  (if contains("deny network-outbound ") then split("deny network-outbound ")[1] | split(" ")[0]
   elif contains("sandbox proxy: ") then split("sandbox proxy: ")[1] | split(": 403")[0]
   else null end) as $t
  | if $t == null or $t == "" then {host: null, port: null}
    else
      ($t | split(":")) as $p
      | if ($p | length) < 2 then {host: $t, port: null}
        else {host: ($p[0:-1] | join(":")),
              port: ($p[-1] | if all_digits then tonumber else null end)}
        end
    end;

def result_text:
  if type == "string" then .
  elif type == "array" then
    [.[] | select(type == "object" and .type == "text" and (.text | type) == "string") | .text]
    | join("\n")
  else "" end;

# One tool_result -> {host, port, line} when it counts as a network refusal, else null.
def refusal_fields($r):
  [$r.content | result_text | split("\n")[]] as $lines
  | [$lines[] | select(carries_any(network_refusal_strings))] as $hit
  | if (($r.is_error == true) and ($hit | length) > 0)
       or ([$lines[] | startswith("<sandbox_violations>")] | any)
    then ([$lines[] | host_port | select(.host != null)][0] // {host: null, port: null})
         + {line: ($hit[0] | redact_text)}
    else null end;

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
   dispatch: {}, dispatch_order: [], reqidx: {}, reqs: [],
   calls: {}, corder: [], open: {},
   gaps: [], retries: 0, retry_errors: {}, denied: {}, rl: {}, netref: []};

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
                       command: (if $u.name == "Bash" then ($u.input.command // null | redact) else null end),
                       raw_command: (if $u.name == "Bash" then ($u.input.command // null) else null end)}
    | .corder += [$u.id]
    | .open[$u.id] = $st
    | if $u.name == "Agent" or $u.name == "Task" then
        .dispatch[$u.id] = {type: ($u.input.subagent_type // "subagent"),
                            description: ($u.input.description // null | redact),
                            start_t: $st, started_at: $sat, agent_id: null}
        | .dispatch_order += [$u.id]
      else . end
  end;

def on_assistant($e; $t; $at; $ck):
  ($ck + "|" + ($e.message.id // $e.uuid // "" | tostring)) as $rk
  | (if $ck != "" then
       {output_tokens: null, input_tokens: null, cache_read_tokens: null, cache_write_tokens: null}
     else ($e.message.usage // {}) | req_usage end) as $u
  | (if .reqidx[$rk] == null then
       (if $t == null then null
        elif .ctx[$ck].last_t != null then $t - .ctx[$ck].last_t
        elif $ck != "" and .dispatch[$ck].start_t != null then $t - .dispatch[$ck].start_t
        else null end) as $lat
       | {started_at: $at, context: ctx_name($ck), latency_ms: $lat,
          message_id: ($e.message.id | if type == "string" then . else null end),
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
  | [$e.message.content
     | if type == "array" then .[] else empty end
     | select(type == "object" and .type == "tool_result" and (.tool_use_id | type) == "string")] as $results
  # tool_use_result is one value per event, so it names a dispatch only when the event closes one call.
  | ($e.tool_use_result
     | if type == "object" and (.agentId | type) == "string" and ($results | length) == 1
       then .agentId else null end) as $aid
  | reduce $results[] as $r
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
           | if .dispatch[$id] != null and .dispatch[$id].agent_id == null and $aid != null
             then .dispatch[$id].agent_id = $aid else . end
           | refusal_fields($r) as $nf
           | if $nf == null then .
             else
               .calls[$id] as $c
               | .netref += [{context: $c.context, tool: $c.tool, started_at: $c.started_at,
                              command: ($c.raw_command | redact_text)} + $nf]
             end
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
           slowest: ([$items[] | select(.duration_ms != null and .tool != "Agent" and .tool != "Task")]
                     | sort_by(0 - .duration_ms) | .[0:slowest_limit]),
           polling: ([.corder[] as $id | .calls[$id] | select(.tool == "Bash" and .command != null)]
                     | group_by([.context, .command])
                     | map(select(length >= polling_min_repeats)
                           | {context: .[0].context, command: .[0].command, count: length,
                              total_ms: (durs | add // 0)}))},
   subagents: [.dispatch_order[] as $id | .dispatch[$id] as $d | .calls[$id].duration_ms as $dur
               | ($byp[$id] // []) as $rq
               | {type: $d.type, description: $d.description, started_at: $d.started_at,
                  duration_ms: $dur, requests: ($rq | length),
                  agent_id: $d.agent_id, token_source: null,
                  output_tokens: null, input_tokens: null,
                  cache_read_tokens: null, cache_write_tokens: null,
                  wall_share: (if $dur != null and $wall != null and $wall > 0
                               then ($dur / $wall | round4) else null end)}],
   cost: (if $r == null then
            {total_cost_usd: null, by_model: null, token_source: null,
             input_tokens: null, output_tokens: null, cache_read_tokens: null,
             cache_write_tokens: null, cache_hit_ratio: null, thinking_tokens: null,
             cache_write_5m_tokens: null, cache_write_1h_tokens: null}
          else
            ($r.usage // {}) as $u
            | (($r.modelUsage | type) == "object" and ($r.modelUsage | length) > 0) as $has_mu
            | (if $has_mu then
                 [$r.modelUsage[] | objects] as $m
                 | {token_source: "model_usage",
                    input_tokens: ([$m[] | .inputTokens // 0] | add // 0),
                    output_tokens: ([$m[] | .outputTokens // 0] | add // 0),
                    cache_read_tokens: ([$m[] | .cacheReadInputTokens // 0] | add // 0),
                    cache_write_tokens: ([$m[] | .cacheCreationInputTokens // 0] | add // 0)}
               elif (.dispatch_order | length) == 0 then
                 {token_source: "usage",
                  input_tokens: $u.input_tokens,
                  output_tokens: $u.output_tokens,
                  cache_read_tokens: $u.cache_read_input_tokens,
                  cache_write_tokens: $u.cache_creation_input_tokens}
               else
                 {token_source: null, input_tokens: null, output_tokens: null,
                  cache_read_tokens: null, cache_write_tokens: null}
               end) as $tok
            | (($tok.cache_read_tokens // 0) + ($tok.cache_write_tokens // 0)
               + ($tok.input_tokens // 0)) as $den_t
            | $tok
              + {total_cost_usd: $r.total_cost_usd,
                 by_model: ((if $has_mu
                             then $r.modelUsage else ($r.model_usage_since_last_result // {}) end)
                            | map_values(.costUSD)),
                 thinking_tokens: $u.output_tokens_details.thinking_tokens,
                 cache_write_5m_tokens: $u.cache_creation.ephemeral_5m_input_tokens,
                 cache_write_1h_tokens: $u.cache_creation.ephemeral_1h_input_tokens,
                 cache_hit_ratio: (if $tok.token_source != null and $den_t > 0
                                   then (($tok.cache_read_tokens // 0) / $den_t | round4)
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
                 rate_limit_peak: .rl},
   network_refusals: .netref};

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
      elif $e.type == "system" and ($e.subtype | type) == "string" and ($e.subtype | startswith("task_"))
           and ($e.task_id | type) == "string" and ($e.tool_use_id | type) == "string" then
        if .dispatch[$e.tool_use_id] != null and .dispatch[$e.tool_use_id].agent_id == null
        then .dispatch[$e.tool_use_id].agent_id = $e.task_id else . end
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

def tok_sum($rq):
  {output_tokens: ([$rq[].output_tokens] | add // 0),
   input_tokens: ([$rq[].input_tokens] | add // 0),
   cache_read_tokens: ([$rq[].cache_read_tokens] | add // 0),
   cache_write_tokens: ([$rq[].cache_write_tokens] | add // 0)};

def transcripts:
  reduce (inputs | fromjson? | select(type == "object")) as $e
    ({cur: null, agents: {}};
     if ($e.run_analytics_transcript | type) == "string" then .cur = $e.run_analytics_transcript
     elif .cur != null and $e.type == "assistant" and ($e.message.id | type) == "string"
          and ($e.message.usage | type) == "object" then
       .agents[.cur][$e.message.id] = ($e.message.usage | req_usage)
     else . end)
  | .agents | to_entries
  | map(select((.value | length) > 0)
        | {key, value: (tok_sum([.value[]]) + {requests: .value})})
  | from_entries;

def attach:
  (.transcripts // {} | if type == "object" then . else {} end) as $tr
  | (reduce ($tr[] | objects | .requests | objects | to_entries[]) as $q
       ({}; .[$q.key] = $q.value)) as $bymsg
  | (.records // [])
  | map((if (.subagents | type) == "array" then
          .subagents |= map(if (.agent_id | type) == "string" and ($tr[.agent_id] | type) == "object"
                            then . + ($tr[.agent_id] | {output_tokens, input_tokens, cache_read_tokens,
                                                        cache_write_tokens})
                                   + {token_source: "transcript"}
                            else . end)
        else . end)
        | (if (.requests.items | type) == "array" then
             .requests.items |= map(if (.message_id | type) == "string" and $bymsg[.message_id] != null
                                    then . + $bymsg[.message_id] else . end)
           else . end));

def decimal:
  split(".") as $p
  | (($p | length) == 1 and ($p[0] | all_digits))
    or (($p | length) == 2 and ($p[0] | all_digits) and ($p[1] | all_digits));

def rel_path:
  length > 0 and (startswith("/") | not) and (contains(" ") | not)
  and ([split("/")[] | select(. == "." or . == "..")] | length) == 0;

def shown: split("\t") | join("\\t");

def gate_row_reason:
  split("\t") as $f
  | if ($f | length) != 4 then "expected 4 tab-separated fields"
    elif $f[0] != "focused" and $f[0] != "full" then "phase is neither focused nor full"
    elif $f[1] == "" or ($f[1] | contains(" ")) then "gate is empty or holds a space"
    elif ([$f[2] | . == "ok", . == "FAIL", . == "BLOCKED", . == "SKIPPED"] | any | not)
    then "status is not ok, FAIL, BLOCKED or SKIPPED"
    elif ($f[3] | all_digits | not) then "seconds is not all digits"
    else null end;

def test_row_reason:
  split("\t") as $f
  | if ($f | length) != 5 then "expected 5 tab-separated fields"
    elif ($f[0] | rel_path | not)
    then "file is empty, absolute, holds a space or has a . or .. segment"
    elif $f[1] != "pass" and $f[1] != "fail" then "status is neither pass nor fail"
    elif ($f[2] | decimal | not) then "seconds is not a decimal number"
    elif ($f[3] | all_digits | not) then "tests is not all digits"
    elif ($f[4] | all_digits | not) then "failed is not all digits"
    else null end;

# The first failed check of a header / rows / terminator table, or null.
def table_reason($header; $terminators; row_reason):
  if length == 0 or .[0] != $header then "first line is not \($header | shown)"
  elif length < 2 or ([.[-1] | . == $terminators[]] | any | not)
  then "last line is not \($terminators | map(shown) | join(" or "))"
  else
    [range(1; length - 1) as $i | (.[$i] | row_reason) as $r
     | select($r != null) | "line \($i + 1): \($r)"][0]
  end;

# A record's lines -> {reason: null, value} when valid, else {reason}.
def round_record($rec):
  if $rec == "verdict" then
    if length != 1 then {reason: "expected exactly one line"}
    elif .[0] == "pass" or .[0] == "fail" or (.[0] | startswith("fail "))
    then {reason: null, value: (.[0] | split(" ")[0])}
    else {reason: "line is neither pass nor fail"} end
  elif $rec == "gates.tsv" then
    table_reason("phase\tgate\tstatus\tseconds"; ["end\tcomplete", "end\tstopped"]; gate_row_reason)
      as $r
    | if $r != null then {reason: $r}
      else
        {reason: null,
         value: {outcome: (.[-1] | split("\t")[1]),
                 rows: [.[1:-1][] | split("\t")
                        | {phase: .[0], gate: (.[1] | redact_path), status: .[2],
                           seconds: (.[3] | tonumber)}]}}
      end
  elif $rec == "focused.tests.tsv" or $rec == "full.tests.tsv" then
    table_reason("file\tstatus\tseconds\ttests\tfailed"; ["end"]; test_row_reason) as $r
    | if $r != null then {reason: $r}
      else
        {reason: null,
         value: [.[1:-1][] | split("\t")
                 | {file: (.[0] | redact_path), status: .[1], seconds: (.[2] | tonumber),
                    tests: (.[3] | tonumber), failed: (.[4] | tonumber)}]}
      end
  else {reason: "unknown record name"} end;

def round_sort_key:
  split("_round_") as $p
  | if ($p | length) >= 2 and ($p[-1] | all_digits)
    then [0, ($p[0:-1] | join("_round_")), ($p[-1] | tonumber), .]
    else [1, .] end;

# One label's parsed records -> {sort, round: <round record>|null, skipped}.
def build_round($kn):
  (.[0].name | redact_path) as $lb
  | (map({key: .rec, value: .}) | from_entries) as $by
  | ($by.verdict != null and $by.verdict.reason == null) as $v_ok
  | ($by["gates.tsv"] != null and $by["gates.tsv"].reason == null) as $g_ok
  | def named($reason): {record: ($lb + "." + .rec), reason: $reason};
    if ($v_ok and $g_ok) | not then
      {sort: null, round: null,
       skipped: map(if .reason != null then named(.reason)
                    elif $v_ok | not then named("no readable verdict")
                    else named("no readable gates.tsv") end)}
    else
      [$by["gates.tsv"].value.rows[].phase] as $phases
      | (reduce (.[] | select(.rec == "focused.tests.tsv" or .rec == "full.tests.tsv")) as $t
           ({tests: {}, unreadable: [], skipped: []};
            ($t.rec | split(".")[0]) as $ph
            | if $t.reason != null then
                .unreadable += [$t.rec] | .skipped += [$t | named($t.reason)]
              elif ([$phases[] | . == $ph] | any) then .tests[$ph] = $t.value
              else .skipped += [$t | named("no \($ph) rows in gates.tsv")] end)) as $acc
      | {verdict: $by.verdict.value, gates: $by["gates.tsv"].value, tests: $acc.tests,
         unreadable: ($acc.unreadable | sort)} as $parse
      | [$kn[] | select((.round_id | split("#")[0]) == $lb)] as $same
      | {sort: ($lb | round_sort_key),
         round: (if ($same | length) == 0 then $parse + {round_id: $lb}
                 elif ($same[-1] | {verdict, gates, tests, unreadable}) == $parse then null
                 else $parse + {round_id: ($lb + "#" + (($same | length) + 1 | tostring))} end),
         skipped: ($acc.skipped
                   + [.[] | select(.reason != null and .rec != "focused.tests.tsv"
                                   and .rec != "full.tests.tsv") | named(.reason)])}
    end;

def rounds:
  if ($known | type) != "array" or ($known | length) != 1 or ($known[0] | type) != "array" then
    error("run-analytics.jq: mode rounds needs --slurpfile known naming a file that holds one JSON array")
  else
    [$known[0][] | select(type == "object" and (.round_id | type) == "string")] as $kn
    | reduce inputs as $line ({cur: null, recs: {}};
        [$line | fromjson? | select(type == "object" and (.run_analytics_round | type) == "string"
                                    and (.record | type) == "string")][0] as $m
        | if $m != null then
            ([$m.run_analytics_round, $m.record] | tojson) as $k
            | .cur = $k | .recs[$k] = {name: $m.run_analytics_round, rec: $m.record, lines: []}
          elif .cur != null then .cur as $k | .recs[$k].lines += [$line]
          else . end)
    | [.recs[]
       | .rec as $rc
       | (.lines | if length > 0 and .[-1] == "" then .[0:-1] else . end) as $ls
       | {name, rec} + ($ls | round_record($rc))]
    | group_by(.name)
    | map(build_round($kn))
    | {rounds: ([.[] | select(.round != null)] | sort_by(.sort) | map(.round)),
       skipped: ([.[].skipped[]] | sort_by(.record))}
  end;

def lstrip_spaces: if startswith(" ") then .[1:] | lstrip_spaces else . end;

def lead_trim:
  if startswith("file://") then .[7:] | lead_trim
  elif startswith("(") or startswith("'") or startswith("\"") then .[1:] | lead_trim
  else . end;

def tail_trim:
  if endswith(")") or endswith("'") or endswith("\"") or endswith(",") then .[0:-1] | tail_trim
  else . end;

def test_file_markers: [".test.", ".spec.", "_test."];

# One space-separated token -> the test file it names, or null.
def token_test_file:
  lead_trim
  | . as $t
  | ([test_file_markers[] as $m | select($t | contains($m))
      | ($t | split($m)[0] | length) + ($m | length)] | min) as $at
  | if $at == null then null
    else (.[0:$at] + (.[$at:] | split(":")[0])) | tail_trim | if . == "" then null else . end
    end;

def line_test_file:
  [split(" ")[] | select(. as $w | [test_file_markers[] as $m | $w | contains($m)] | any)][0]
  | if . == null then null else token_test_file end;

def test_name_line:
  lstrip_spaces | (startswith("ok ") or startswith("not ok ") or startswith("# Subtest: "));

# One log's lines -> [{kind, test_file, line, count}], first-occurrence order.
def gate_log_matches:
  reduce .[] as $l ({cur: null, ms: [], idx: {}};
    ($l | line_test_file) as $own
    | (if $own != null then .cur = $own else . end)
    | if ($l | test_name_line) then .
      else
        (if ($l | carries_any(gate_proxy_strings)) then "proxy"
         elif ($l | carries_any(connect_error_strings)) then "connect"
         else null end) as $kind
        | if $kind == null then .
          else
            {kind: $kind, test_file: (.cur | redact_file), line: ($l | redact_text)} as $m
            | ([$m.kind, $m.test_file, $m.line] | tojson) as $k
            | if .idx[$k] != null then .idx[$k] as $i | .ms[$i].count += 1
              else .idx[$k] = (.ms | length) | .ms += [$m + {count: 1}] end
          end
      end)
  | .ms;

def gate_logs:
  if ($known | type) != "array" or ($known | length) != 1 or ($known[0] | type) != "array" then
    error("run-analytics.jq: mode gate_logs needs --slurpfile known naming a file that holds one JSON array")
  else
    [$known[0][] | select(type == "object" and (.log_id | type) == "string")] as $kn
    | reduce inputs as $line ({cur: null, logs: {}};
        [$line | fromjson? | select(type == "object" and (.run_analytics_gate_log | type) == "string")][0]
          as $m
        | if $m != null then $m.run_analytics_gate_log as $k | .cur = $k | .logs[$k] = []
          elif .cur != null then .cur as $k | .logs[$k] += [$line]
          else . end)
    | [.logs | to_entries[]
       | (.key | redact_path) as $lb
       | (.value | if length > 0 and .[-1] == "" then .[0:-1] else . end | gate_log_matches) as $ms
       | [$kn[] | select((.log_id | split("#")[0]) == $lb)] as $same
       | {sort: ($lb | round_sort_key),
          entry: (if ($same | length) == 0 then {log_id: $lb, matches: $ms}
                  elif $same[-1].matches == $ms then null
                  else {log_id: ($lb + "#" + (($same | length) + 1 | tostring)), matches: $ms} end)}]
    | {gate_logs: ([.[] | select(.entry != null)] | sort_by(.sort) | map(.entry))}
  end;

if $mode == "sessions" then
  reduce (inputs | fromjson? | select(type == "object")) as $e
    ({out: [], emitted: {}, seen: {}, active: false,
      known: (reduce ($known[]? | strings) as $k ({}; .[$k] = true))};
     step($e))
  | close_current(false)
  | .out
elif $mode == "overlay" then
  overlay
elif $mode == "transcripts" then
  transcripts
elif $mode == "attach" then
  attach
elif $mode == "rounds" then
  rounds
elif $mode == "gate_logs" then
  gate_logs
else
  error("run-analytics.jq: unknown --arg mode \"\($mode)\"; expected sessions, overlay, transcripts, attach, rounds or gate_logs")
end
