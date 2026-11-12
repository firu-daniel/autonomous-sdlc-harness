#!/usr/bin/env bash
# run-analytics.sh — record every not-yet-recorded headless session of one
# run's `stream-json` file into `<state_dir>/run_analytics/<branch>/run-analytics.json`
# and regenerate `run-analytics.md` beside it, together with every finished,
# not-yet-recorded Run gates round of the branch. It decides which sessions are
# new (by `session_id`, the merge key), whether host suspend intervals are worth
# reading, and whether either file's bytes changed. Which rounds are new is
# decided by `lib/run-analytics.jq`'s mode `rounds`, not here: this script only
# finds the round records, hands them over and appends what comes back. The
# record also lists each session's refused network calls (decided in
# `lib/run-analytics.jq` mode `sessions`) and each finished round log's possible
# network attempts (mode `gate_logs`).
#
# THREE FILES, ONE DRIVER. `lib/run-analytics.jq` computes the session records
# (`sessions` mode), re-classes idle gaps against suspend intervals
# (`overlay`), sums sub-agent transcripts per agent id (`transcripts`),
# attaches those sums to the new records (`attach`), parses and validates
# the round records and decides which rounds are new (`rounds`), and lists a
# finished round log's possible network attempts and decides which are new
# (`gate_logs`); `lib/run-analytics-report.jq`
# recomputes `.run` (`rollup`) and renders the Markdown (`markdown`). Both
# headers state their calls; this script makes them as stated and resolves both
# beside itself under `lib/`.
#
# SUB-AGENT TRANSCRIPTS. A dispatch's final token figures are read from
# `<claude_home>/projects/*/<session_id>/subagents/agent-<agent_id>.jsonl`, where
# `<claude_home>` is `${CLAUDE_CONFIG_DIR}` when non-empty, else `$HOME/.claude`,
# one trailing slash stripped — a shell mirror of `claudeHome()` in
# `cli/src/machine/paths.ts`, so a change to either is an edit to both. The file
# is located by `session_id` (a resume's `#<N>` stripped) and `agentId` only; the
# project slug is the glob's `*`, never derived. A token outside `A-Za-z0-9_-`
# is skipped. A run without them — a later job on a fresh runner, or removed
# transcripts — records `null` tokens rather than stream figures. The engine
# launch in the watcher's `spawn_engine` carries no `--no-session-persistence`;
# only `remote-run.sh`'s mention session sets it.
#
# GATE ROUNDS. The lane is `<state_dir>/test_run_logs/<sanitized branch>/`,
# resolved by the library's one owner of that path, `hr_test_run_lane_dir
# "<state_dir>" "$branch"`, with `<state_dir>` from `hr_state_dir "$top"` and a
# relative answer anchored to `$top`, as `run-test-suite.sh` does — never
# assembled from `hr_state_path`, `HR_TEST_RUN_LOG_SUBDIR` and
# `hr_sanitize_branch`, never a retyped directory name. A non-zero return from
# either function, or no lane directory, means no rounds, silently. A finished
# round is a regular, non-symlink `<label>.verdict` whose label matches
# `HR_TEST_RUN_LABEL_PATTERN`; a running round has no `.verdict` yet and is
# picked up by a later call. Read beside it, each only when a regular,
# non-symlink file: `<label>.gates.tsv`, `<label>.focused.tests.tsv`,
# `<label>.full.tests.tsv`. Only a label with at least one of the three
# contributes a round, so a lane of logs and verdicts alone records no round;
# its logs are read under GATE LOGS. Handed over is not
# recorded: a `<phase>.tests.tsv` an earlier attempt of the label left is
# refused by mode `rounds` unless this attempt's `gates.tsv` has rows of that
# phase (its header states the rule and the residual); no file-age test is added
# here, because no lane file carries an attempt's start time. The recorded
# rounds reach the mode through a file (`--slurpfile known`), never an
# argument: their size outgrows Linux's per-argument limit. No failure on this
# path stops the run: it is named on stderr and the sessions are still written.
#
# GATE LOGS. Every finished label's `<label>.log`, when a regular, non-symlink
# file, is handed to mode `gate_logs`, whether or not the round wrote records.
# Only the log's matching lines reach the record, redacted and uncut; which
# lines match, and which entries are new, is the mode's decision. The recorded
# entries reach the mode through a file (`--slurpfile known`), as the rounds do.
# A failure on this path is one stderr line and never stops the sessions.
#
# WHERE IT STOPS. It writes those two files in the named checkout and nothing
# else: it commits nothing, pushes nothing, notifies nothing and never touches
# the stream. It reads the agent runner's sub-agent transcripts, never writes
# there. The watcher commits the result after each session, and outside a job
# pushes it.
#
# THE MERGE. A recorded session or round is never rewritten, reordered or
# re-derived: new records are appended in stream order, new rounds in the order
# mode `rounds` returns them — a changed record under a recorded label as
# `<label>#<N>`. A recorded gate-log entry is never rewritten either: new
# entries are appended in the order mode `gate_logs` returns them. Then `.run`
# and the Markdown are regenerated from the whole document every time, so a
# hand-deleted `.md` comes back. A document is schema 3 exactly when it carries
# a gate-log entry, with `gate_logs` and a `rounds` array (possibly empty)
# beside it; otherwise, when it carries a round, schema 2; otherwise schema
# 1. An existing schema-1 or schema-2 document is read and extended. An
# existing `run-analytics.json` that does not parse as one schema-1 document
# with neither `rounds` nor `gate_logs`, one schema-2 document without
# `gate_logs` whose `rounds` is an array of objects with a string `round_id`,
# or one schema-3 document whose `rounds` is such an array and whose
# `gate_logs` is an array of objects with a string `log_id`, is refused and
# left byte-for-byte as it is — it is the only copy of
# the sessions it holds. A file is replaced only when its bytes differ, and
# nothing written carries a wall-clock value, so a re-run over the same stream
# leaves both files byte-identical.
#
# PATHS IN THE RECORD. Every free-text field is redacted by these pairs, longest
# `from` first so a clone at `<main>-<branch>` is matched before its main
# checkout's prefix: the checkout's top -> `<repo_root>`; the main checkout ->
# `<main_repo>`, unless it is the checkout itself; then `$HOME` -> `~`. The main
# checkout is `--main-repo` when given and non-empty, else `hr_main_repo`'s
# answer for the checkout — which, inside a clone, is the clone itself, so the
# watcher passes `--main-repo` explicitly. `DEVSCENE_MAIN_REPO` is never read.
# Round ids, gate ids and round file paths pass through the same pairs,
# through mode `rounds`' `redact_path`: the pairs only, without the home step and without
# the 160-character cut free-text fields get, so a long path or label is
# recorded in full and a relative path containing `/home/` is not collapsed.
# Gate-log fields split (`lib/run-analytics.jq` → `Mode gate_logs`): the log id
# goes through `redact_path`; a `test_file` through `redact_file`, the pairs
# plus the anchored home step; a `line` through `redact_text`, uncut.
#
# TUNABLES, from the environment:
#   RUN_ANALYTICS_IDLE_SECS       idle-gap threshold in seconds; default 120, a
#                                 positive integer, else exit 2.
#   RUN_ANALYTICS_SUSPEND_SOURCE  unset = read the host (`pmset -g log` on
#                                 Darwin, `journalctl -k` elsewhere); `none` =
#                                 read nothing; any other value = a file of
#                                 `<start ISO-8601 UTC> <end ISO-8601 UTC>`
#                                 lines, one interval each (suspend_source
#                                 `file`). A source is read only when a new
#                                 session has host-suspended time and an idle
#                                 gap, and only over the new sessions' span. A
#                                 host reader that fails or is absent leaves
#                                 suspend_source `none`; an unreadable or
#                                 malformed file is an exit 1.
#
# Usage: run-analytics.sh <stream_file> <branch> [--repo <checkout>] [--main-repo <main_checkout>]
#   <checkout>       default: the top of the checkout the current directory is in
#   <main_checkout>  an absolute path
#
# Exit map, each with exactly one line:
#   0  stdout: `recorded <n> session(s) for <branch>` (n is 0 when only
#      regenerated bytes or new gate-log entries changed the record, which
#      this line does not count), `recorded <n> session(s) and <m> round(s)
#      for <branch>` when m new rounds were recorded, `unchanged: no new
#      session for <branch>`, or `no session in <stream_file>` (no session, no
#      new round, no new gate-log entry and no record: nothing written). stderr
#      may also carry `run-analytics: round record skipped: <label>.<record> —
#      <reason>` lines, one `run-analytics: round records not read: <reason>`
#      line and one `run-analytics: gate logs not read: <reason>` line.
#   1  stderr: `run-analytics: <reason>` — nothing was replaced
#   2  stderr: `run-analytics: <reason>; usage: …` — bad usage
#
# REPRO — against a throwaway fixture:
#
#   d=$(mktemp -d); git -C "$d" init -q -b feat_x
#   printf '%s' '{"version":1,"defaultBranch":"main","stateDir":"devscene/","layers":[],"commands":{}}' > "$d/devscene.config.json"
#   cp -R <scripts_dir>/. "$d/scripts/"   # this file and its lib/
#   printf '%s\n' \
#     '{"type":"system","subtype":"init","session_id":"s1"}' \
#     '{"type":"assistant","timestamp":"2026-01-01T00:00:00.000Z","message":{"id":"m1","content":[]}}' \
#     '{"type":"result","timestamp":"2026-01-01T00:00:05.000Z","duration_ms":5000}' > "$d/s.jsonl"
#   export RUN_ANALYTICS_SUSPEND_SOURCE=none
#
#   record     (cd "$d" && bash scripts/run-analytics.sh s.jsonl feat_x)
#                -> `recorded 1 session(s) for feat_x`, both files under
#                   devscene/run_analytics/feat_x/
#   re-run     same call                       -> `unchanged: no new session for feat_x`
#   md back    rm the .md; same call           -> `recorded 0 session(s) for feat_x`
#   nothing    a stream with no init event, no record -> `no session in …`, no file
#   corrupt    printf x > …/run-analytics.json; same call -> exit 1, file still `x`
#   usage      RUN_ANALYTICS_IDLE_SECS=0, same call     -> exit 2
#   transcript no record yet, s.jsonl carrying a sub-agent dispatch whose agentId
#              is a1, its transcript at $d/home/projects/x/s1/subagents/agent-a1.jsonl;
#              CLAUDE_CONFIG_DIR=$d/home, same call
#                -> that dispatch's subagents[] entry carries the transcript's four
#                   token totals and token_source `transcript`
#   round      no record yet; l=$d/devscene/test_run_logs/feat_x; mkdir -p "$l"
#              printf 'pass\n' > "$l/r_round_1.verdict"
#              printf 'phase\tgate\tstatus\tseconds\nfull\ttest\tok\t3\nend\tcomplete\n' > "$l/r_round_1.gates.tsv"
#              same call -> `recorded 1 session(s) and 1 round(s) for feat_x`, schema 2
#   running    as `round` without the .verdict      -> `recorded 1 session(s) for feat_x`,
#              schema 1; write the .verdict, same call -> `recorded 0 session(s) and 1 round(s) for feat_x`
#   gate log   no record yet; l as in `round`; mkdir -p "$l"
#              printf 'Error: connect ECONNREFUSED 127.0.0.1:443\n' > "$l/r_round_1.log"
#              printf 'pass\n' > "$l/r_round_1.verdict"
#              same call -> `recorded 1 session(s) for feat_x`, schema 3, one `connect` match

# Deliberately no `-e`: every failure below is an explicit exit with its line.
set -uo pipefail

usage_line='usage: run-analytics.sh <stream_file> <branch> [--repo <checkout>] [--main-repo <main_checkout>]'

die() {
  printf 'run-analytics: %s\n' "$1" >&2
  exit 1
}

bad_usage() {
  printf 'run-analytics: %s; %s\n' "$1" "$usage_line" >&2
  exit 2
}

work=""
json_tmp=""
md_tmp=""
cleanup() {
  [ -z "$json_tmp" ] || rm -f "$json_tmp"
  [ -z "$md_tmp" ] || rm -f "$md_tmp"
  if [ -n "$work" ] && [ -d "$work" ]; then
    rm -f "$work"/*
    rmdir "$work" 2>/dev/null
  fi
  return 0
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

strip_slashes() {
  local v="${1-}"
  while [ "$v" != "/" ] && [ "${v%/}" != "$v" ]; do v=${v%/}; done
  printf '%s' "$v"
}

# --- Arguments.
stream=""
branch=""
repo_arg=""
repo_given=0
main_arg=""
npos=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      [ "$#" -ge 2 ] && [ -n "${2-}" ] || bad_usage "--repo needs a directory"
      repo_arg="$2"; repo_given=1; shift 2 ;;
    --main-repo)
      [ "$#" -ge 2 ] || bad_usage "--main-repo needs a directory"
      main_arg="$2"; shift 2 ;;
    -*)
      bad_usage "unknown option '$1'" ;;
    *)
      npos=$((npos + 1))
      case "$npos" in
        1) stream="$1" ;;
        2) branch="$1" ;;
        *) bad_usage "unexpected argument '$1'" ;;
      esac
      shift ;;
  esac
done
[ "$npos" -eq 2 ] || bad_usage "a stream file and a branch are required"
[ -n "$stream" ] || bad_usage "the stream file is empty"

# The branch names a directory under run_analytics/, so it must be a ref name:
# no `..`, no leading `/` or `.`, no empty component.
case "$branch" in
  '' | -*) bad_usage "'$branch' is not a branch name" ;;
esac
git check-ref-format "refs/heads/$branch" >/dev/null 2>&1 || bad_usage "'$branch' is not a branch name"

idle="${RUN_ANALYTICS_IDLE_SECS-120}"
case "$idle" in
  '' | 0* | *[!0-9]*) bad_usage "RUN_ANALYTICS_IDLE_SECS='$idle' is not a positive integer" ;;
esac
[ "${#idle}" -le 9 ] || bad_usage "RUN_ANALYTICS_IDLE_SECS='$idle' is out of range"

if [ -n "$main_arg" ]; then
  case "$main_arg" in
    /*) ;;
    *) bad_usage "--main-repo '$main_arg' is not an absolute path" ;;
  esac
  main_arg=$(strip_slashes "$main_arg")
  [ "$main_arg" != "/" ] || bad_usage "--main-repo may not be '/'"
fi

# --- The library and the two programs, beside this file.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
hr_lib="$script_dir/lib/harness-run-lib.sh"
[ -r "$hr_lib" ] || die "cannot read '$hr_lib'"
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"
sessions_jq="$script_dir/lib/run-analytics.jq"
report_jq="$script_dir/lib/run-analytics-report.jq"
[ -r "$sessions_jq" ] || die "cannot read '$sessions_jq'"
[ -r "$report_jq" ] || die "cannot read '$report_jq'"
hr_have_jq || die "jq is not on PATH"

# --- The checkout, its output directory and the redaction pairs.
if [ "$repo_given" -eq 1 ]; then
  [ -d "$repo_arg" ] || die "--repo '$repo_arg' is not a directory"
  top=$(hr_repo_root "$repo_arg") || die "'$repo_arg' is not inside a git repository"
  top_logical=$(cd "$repo_arg" && pwd)
  top_seen=$(cd "$repo_arg" && pwd -P)
else
  top=$(hr_repo_root) || die "'${PWD-.}' is not inside a git repository"
  top_logical="${PWD-}"
  top_seen=$(pwd -P)
fi
# A logical spelling of the top (a symlinked TMPDIR, say) is redacted too.
[ "$top_seen" = "$top" ] || top_logical=""

out_dir=$(hr_state_path "$top" "run_analytics/$branch")
case "$?" in
  0) ;;
  2) die "cannot resolve '$top/devscene.config.json' (absent, invalid, no defaultBranch, or jq older than 1.5)" ;;
  *) die "cannot resolve the state directory of '$top'" ;;
esac
json_out="$out_dir/run-analytics.json"
md_out="$out_dir/run-analytics.md"

if [ -n "$main_arg" ]; then
  main="$main_arg"
else
  main=$(hr_main_repo "$top") || main=""
fi
main_phys=""
[ -z "$main" ] || [ ! -d "$main" ] || main_phys=$(cd "$main" && pwd -P) || main_phys=""
if [ "$main" = "$top" ] || [ "$main_phys" = "$top" ]; then
  main=""
  main_phys=""
fi
home=$(strip_slashes "${HOME-}")
[ "$home" != "/" ] || home=""

redact=$(jq -n -c --arg top "$top" --arg topl "$top_logical" --arg main "$main" \
  --arg mainp "$main_phys" --arg home "$home" '
  ([[$top, "<repo_root>"], [$topl, "<repo_root>"], [$main, "<main_repo>"], [$mainp, "<main_repo>"]]
   | map(select(.[0] != "")) | unique_by(.[0]) | sort_by(.[0] | length) | reverse)
  + (if $home == "" then [] else [[$home, "~"]] end)') || die "cannot build the redaction pairs"

# --- Inputs, all read and checked before anything is written.
[ -f "$stream" ] && [ -r "$stream" ] || die "'$stream' is not a readable file"
for f in "$json_out" "$md_out"; do
  if [ -e "$f" ] && [ ! -f "$f" ]; then die "'$f' exists and is not a regular file"; fi
done

work=$(mktemp -d "${TMPDIR:-/tmp}/run-analytics.XXXXXX") || die "cannot create a working directory"

have_record=0
if [ -e "$json_out" ]; then
  have_record=1
  jq -s -e 'def rounds_ok: (.rounds | type) == "array"
              and all(.rounds[]; type == "object" and (.round_id | type) == "string");
            length == 1 and (.[0] | type == "object"
            and ((.schema == 1 and (has("rounds") | not) and (has("gate_logs") | not))
                 or (.schema == 2 and (has("gate_logs") | not) and rounds_ok)
                 or (.schema == 3 and rounds_ok and (.gate_logs | type) == "array"
                     and all(.gate_logs[]; type == "object" and (.log_id | type) == "string")))
            and (.sessions | type) == "array"
            and all(.sessions[]; type == "object" and (.session_id | type) == "string"))' \
    "$json_out" >/dev/null 2>&1 \
    || die "'$json_out' is not a schema-1, schema-2 or schema-3 run-analytics document; left untouched"
  cp "$json_out" "$work/old.json" || die "cannot read '$json_out'"
else
  printf '%s\n' '{"schema":1,"sessions":[]}' > "$work/old.json" || die "cannot write the working copy"
fi
known=$(jq -c '[.sessions[].session_id]' "$work/old.json") || die "cannot read the recorded session ids"

if ! jq -n -R -c -S -f "$sessions_jq" --arg mode sessions --argjson idle_threshold_s "$idle" \
     --argjson known "$known" --argjson redact "$redact" --argjson suspend '[]' \
     --arg suspend_source none < "$stream" > "$work/new.json" 2> "$work/err"; then
  IFS= read -r why < "$work/err" || why=""
  die "lib/run-analytics.jq failed over '$stream': ${why:-no message}"
fi
n=$(jq 'length' "$work/new.json") || die "lib/run-analytics.jq wrote no array"

# --- Gate rounds (GATE ROUNDS above): nothing on this path reaches `die`.
m=0
rounds_err=""
rounds_file=/dev/null
g=0
gate_logs_err=""
gate_logs_file=/dev/null
lane=""
if state_dir=$(hr_state_dir "$top") && lane=$(hr_test_run_lane_dir "$state_dir" "$branch"); then
  case "$lane" in
    /*) ;;
    *) lane="$top/$lane" ;;
  esac
else
  lane=""
fi
if [ -n "$lane" ] && [ -d "$lane" ]; then
  for v in "$lane"/*.verdict; do
    [ -f "$v" ] && [ ! -L "$v" ] || continue
    label=${v##*/}
    label=${label%.verdict}
    [[ "$label" =~ $HR_TEST_RUN_LABEL_PATTERN ]] || continue
    if [ -f "$lane/$label.log" ] && [ ! -L "$lane/$label.log" ]; then
      { printf '{"run_analytics_gate_log":"%s"}\n' "$label" \
          && cat "$lane/$label.log" && printf '\n'; } >> "$work/gate_logs.jsonl" 2>/dev/null \
        || gate_logs_err="cannot copy '$label.log' into the working copy"
    fi
    recs=""
    for r in gates.tsv focused.tests.tsv full.tests.tsv; do
      if [ -f "$lane/$label.$r" ] && [ ! -L "$lane/$label.$r" ]; then recs="$recs $r"; fi
    done
    [ -n "$recs" ] || continue
    for r in verdict $recs; do
      { printf '{"run_analytics_round":"%s","record":"%s"}\n' "$label" "$r" \
          && cat "$lane/$label.$r" && printf '\n'; } >> "$work/rounds.jsonl" 2>/dev/null \
        || rounds_err="cannot copy '$label.$r' into the working copy"
    done
  done
fi
if [ -z "$rounds_err" ] && [ -s "$work/rounds.jsonl" ]; then
  if ! jq -c '.rounds // []' "$work/old.json" > "$work/known_rounds.json" 2> "$work/err"; then
    IFS= read -r why < "$work/err" || why=""
    rounds_err="${why:-cannot write the recorded rounds}"
  elif ! jq -n -R -c -S -f "$sessions_jq" --arg mode rounds --argjson idle_threshold_s 1 \
       --slurpfile known "$work/known_rounds.json" --argjson redact "$redact" --argjson suspend '[]' \
       --arg suspend_source none < "$work/rounds.jsonl" > "$work/rounds_out.json" 2> "$work/err"; then
    IFS= read -r why < "$work/err" || why=""
    rounds_err="${why:-lib/run-analytics.jq rounds failed}"
  elif ! m=$(jq '.rounds | length' "$work/rounds_out.json" 2>/dev/null); then
    rounds_err="lib/run-analytics.jq rounds wrote no rounds array"
  else
    jq -r '.skipped[]? | "run-analytics: round record skipped: \(.record) — \(.reason)"' \
      "$work/rounds_out.json" >&2 2>/dev/null
    rounds_file="$work/rounds_out.json"
  fi
fi
if [ -n "$rounds_err" ]; then
  printf 'run-analytics: round records not read: %s\n' "$rounds_err" >&2
  m=0
  rounds_file=/dev/null
fi
case "$m" in '' | *[!0-9]*) m=0; rounds_file=/dev/null ;; esac

# --- Gate logs (GATE LOGS above): nothing on this path reaches `die` either.
if [ -z "$gate_logs_err" ] && [ -s "$work/gate_logs.jsonl" ]; then
  if ! jq -c '.gate_logs // []' "$work/old.json" > "$work/known_gate_logs.json" 2> "$work/err"; then
    IFS= read -r why < "$work/err" || why=""
    gate_logs_err="${why:-cannot write the recorded gate logs}"
  elif ! jq -n -R -c -S -f "$sessions_jq" --arg mode gate_logs --slurpfile known "$work/known_gate_logs.json" \
       --argjson idle_threshold_s 1 --argjson redact "$redact" --argjson suspend '[]' \
       --arg suspend_source none < "$work/gate_logs.jsonl" > "$work/gate_logs_out.json" 2> "$work/err"; then
    IFS= read -r why < "$work/err" || why=""
    gate_logs_err="${why:-lib/run-analytics.jq gate_logs failed}"
  elif ! g=$(jq '.gate_logs | length' "$work/gate_logs_out.json" 2>/dev/null); then
    gate_logs_err="lib/run-analytics.jq gate_logs wrote no gate_logs array"
  else
    gate_logs_file="$work/gate_logs_out.json"
  fi
fi
if [ -n "$gate_logs_err" ]; then
  printf 'run-analytics: gate logs not read: %s\n' "$gate_logs_err" >&2
  g=0
  gate_logs_file=/dev/null
fi
case "$g" in '' | *[!0-9]*) g=0; gate_logs_file=/dev/null ;; esac

if [ "$n" -eq 0 ] && [ "$m" -eq 0 ] && [ "$g" -eq 0 ] && [ "$have_record" -eq 0 ]; then
  printf 'no session in %s\n' "$stream"
  exit 0
fi

# --- Sub-agent transcripts, located by session_id + agent_id; absent ones are skipped.
claude_home="${CLAUDE_CONFIG_DIR-}"
if [ -z "$claude_home" ]; then
  if [ -n "${HOME-}" ]; then claude_home="$HOME/.claude"; else claude_home=""; fi
fi
claude_home="${claude_home%/}"
if [ "$n" -gt 0 ] && [ -n "$claude_home" ]; then
  pairs=$(jq -r '.[] | ((.session_id // "") | tostring | split("#")[0]) as $s
           | (.subagents // [])[]? | select((.agent_id | type) == "string")
           | "\($s) \(.agent_id)"' "$work/new.json") || die "cannot read the new sessions' agent ids"
  : > "$work/transcripts.jsonl" || die "cannot write the working copy"
  while IFS=' ' read -r sid aid rest; do
    [ -z "$rest" ] || continue
    case "$sid" in '' | *[!A-Za-z0-9_-]*) continue ;; esac
    case "$aid" in '' | *[!A-Za-z0-9_-]*) continue ;; esac
    for t in "$claude_home"/projects/*/"$sid"/subagents/agent-"$aid".jsonl; do
      if [ -f "$t" ] && [ -r "$t" ]; then
        { printf '{"run_analytics_transcript":"%s"}\n' "$aid" && cat "$t" && printf '\n'; } \
          >> "$work/transcripts.jsonl" || die "cannot write the working copy"
        break
      fi
    done
  done <<EOF
$pairs
EOF
  if [ -s "$work/transcripts.jsonl" ]; then
    if ! jq -n -R -c -S -f "$sessions_jq" --arg mode transcripts --argjson idle_threshold_s "$idle" \
         --argjson known '[]' --argjson redact '[]' --argjson suspend '[]' \
         --arg suspend_source none < "$work/transcripts.jsonl" > "$work/transcripts.json" 2> "$work/err"; then
      IFS= read -r why < "$work/err" || why=""
      die "lib/run-analytics.jq transcripts failed: ${why:-no message}"
    fi
    jq -n -c --slurpfile r "$work/new.json" --slurpfile t "$work/transcripts.json" \
      '{records: $r[0], transcripts: $t[0]}' > "$work/attach_in.json" 2> "$work/err" \
      || die "cannot build the attach input"
    if ! jq -c -S -f "$sessions_jq" --arg mode attach --argjson idle_threshold_s "$idle" \
         --argjson known '[]' --argjson redact '[]' --argjson suspend '[]' \
         --arg suspend_source none < "$work/attach_in.json" > "$work/attached.json" 2> "$work/err"; then
      IFS= read -r why < "$work/err" || why=""
      die "lib/run-analytics.jq attach failed: ${why:-no message}"
    fi
    mv "$work/attached.json" "$work/new.json" || die "cannot replace the working copy"
  fi
fi

# --- Host suspend intervals, only when they can change a gap's class.
# `<need> <start_ms> <end_ms>` over the new sessions' overall span.
window=$(jq -r '
  def ms: if type == "string" and length >= 19 then
      try (((.[0:19] + "Z") | fromdateiso8601) * 1000
           + (if .[19:20] == "." then ((.[20:] | split("Z")[0] | split("+")[0] | split("-")[0]) + "000")[0:3] | tonumber else 0 end))
      catch null
    else null end;
  ([.[] | select((.time.host_suspended_ms // 0) > 0 and ((.time.idle_gaps // []) | length) > 0)] | length > 0) as $need
  | [.[] | (.first_at, .last_at) | ms | numbers] as $t
  | if $need and ($t | length) > 0 then "\($t | min | floor) \($t | max | floor)" else "" end' "$work/new.json") \
  || die "cannot read the new sessions' span"

src="none"
intervals='[]'
if [ -n "$window" ]; then
  ws=${window% *}
  we=${window#* }
  # Each reader prints a JSON array of [start_ms, end_ms] overlapping the window.
  pair_jq='reduce .[] as $e ({open: null, out: []};
             if $e.ev == "start" then (if .open == null then .open = $e.ms else . end)
             elif .open != null then .out += [[.open, $e.ms]] | .open = null
             else . end)
           | [.out[] | select(.[0] < $we and .[1] > $ws)]'
  offset_jq='def off_s: (if . == "Z" or . == "" then "+0000" else (split(":") | join("")) end) as $o
               | if ($o | length) == 5 and ($o[0:1] == "+" or $o[0:1] == "-")
                 then (($o[1:3] | tonumber) * 3600 + ($o[3:5] | tonumber) * 60) as $s
                      | (if $o[0:1] == "-" then 0 - $s else $s end)
                 else error("offset") end;'
  case "${RUN_ANALYTICS_SUSPEND_SOURCE-}" in
    none) ;;
    '')
      if [ "$(uname -s 2>/dev/null)" = "Darwin" ]; then
        if command -v pmset >/dev/null 2>&1 && pmset -g log > "$work/host" 2>/dev/null; then
          if iv=$(jq -n -R -c --argjson ws "$ws" --argjson we "$we" "$offset_jq"'
                [inputs | split("\t") | join(" ") | split(" ") | map(select(length > 0))
                 | select(length >= 4 and (.[3] == "Sleep" or .[3] == "Wake")) | . as $f
                 | (try ((($f[0] + "T" + $f[1] + "Z") | fromdateiso8601) - ($f[2] | off_s)) catch null) as $s
                 | select($s != null)
                 | {ev: (if $f[3] == "Sleep" then "start" else "end" end), ms: ($s * 1000)}]
                | '"$pair_jq" < "$work/host" 2>/dev/null); then
            src="pmset"; intervals="$iv"
          fi
        fi
      elif command -v journalctl >/dev/null 2>&1 \
           && journalctl -k -o short-iso --no-pager --since "@$((ws / 1000))" \
                --until "@$(((we + 999) / 1000))" > "$work/host" 2>/dev/null; then
        if iv=$(jq -n -R -c --argjson ws "$ws" --argjson we "$we" "$offset_jq"'
              [inputs | select(contains("PM: suspend entry") or contains("PM: suspend exit"))
               | . as $l | split(" ")[0] as $ts
               | (try ((($ts[0:19] + "Z") | fromdateiso8601) - ($ts[19:] | off_s)) catch null) as $s
               | select($s != null)
               | {ev: (if ($l | contains("PM: suspend entry")) then "start" else "end" end), ms: ($s * 1000)}]
              | '"$pair_jq" < "$work/host" 2>/dev/null); then
          src="journalctl"; intervals="$iv"
        fi
      fi
      ;;
    *)
      sfile="$RUN_ANALYTICS_SUSPEND_SOURCE"
      [ -f "$sfile" ] && [ -r "$sfile" ] || die "RUN_ANALYTICS_SUSPEND_SOURCE '$sfile' is not a readable file"
      intervals=$(jq -n -R -c --argjson ws "$ws" --argjson we "$we" '
        def iso_ms: if type == "string" and length >= 20 and .[10:11] == "T" and .[-1:] == "Z"
                       and (.[19:20] == "Z" or .[19:20] == ".")
                    then try (((.[0:19] + "Z") | fromdateiso8601) * 1000
                              + (if .[19:20] == "." then ((.[20:-1] + "000")[0:3] | tonumber) else 0 end))
                         catch null
                    else null end;
        [inputs | split("\r") | join("") | split("\t") | join(" ") | split(" ") | map(select(length > 0))
         | select(length > 0)
         | if length == 2 and (.[0] | iso_ms) != null and (.[1] | iso_ms) != null
              and (.[0] | iso_ms) <= (.[1] | iso_ms)
           then [(.[0] | iso_ms), (.[1] | iso_ms)]
           else error("a line is not `<start ISO-8601 UTC> <end ISO-8601 UTC>`") end]
        | [.[] | select(.[0] < $we and .[1] > $ws)]' < "$sfile" 2>/dev/null) \
        || die "RUN_ANALYTICS_SUSPEND_SOURCE '$sfile' holds a line that is not '<start ISO-8601 UTC> <end ISO-8601 UTC>'"
      src="file"
      ;;
  esac
fi

if [ "$src" != "none" ]; then
  if ! jq -c -S -f "$sessions_jq" --arg mode overlay --argjson idle_threshold_s "$idle" \
       --argjson known '[]' --argjson redact '[]' --argjson suspend "$intervals" \
       --arg suspend_source "$src" < "$work/new.json" > "$work/overlaid.json" 2> "$work/err"; then
    IFS= read -r why < "$work/err" || why=""
    die "lib/run-analytics.jq overlay failed: ${why:-no message}"
  fi
  mv "$work/overlaid.json" "$work/new.json" || die "cannot replace the working copy"
fi

# --- Merge, roll up, render.
# `$rounds_file` and `$gate_logs_file` are `/dev/null` (slurped as `[]`) when their step
# recorded nothing.
jq -n -S --arg branch "$branch" --slurpfile old "$work/old.json" --slurpfile new "$work/new.json" \
  --slurpfile r "$rounds_file" --slurpfile gl "$gate_logs_file" \
  '(($old[0].rounds // []) + ($r[0].rounds // [])) as $rounds
   | (($old[0].gate_logs // []) + ($gl[0].gate_logs // [])) as $gate_logs
   | {schema: 1, branch: $branch, sessions: ($old[0].sessions + $new[0]), run: null}
   | if ($gate_logs | length) > 0 then .schema = 3 | .gate_logs = $gate_logs | .rounds = $rounds
     elif ($rounds | length) > 0 then .schema = 2 | .rounds = $rounds
     else . end' \
  > "$work/merged.json" 2> "$work/err" || die "cannot merge the new sessions"
if ! jq -S -f "$report_jq" --arg mode rollup < "$work/merged.json" > "$work/doc.json" 2> "$work/err"; then
  IFS= read -r why < "$work/err" || why=""
  die "lib/run-analytics-report.jq rollup failed: ${why:-no message}"
fi
if ! jq -r -f "$report_jq" --arg mode markdown < "$work/doc.json" > "$work/doc.md" 2> "$work/err"; then
  IFS= read -r why < "$work/err" || why=""
  die "lib/run-analytics-report.jq markdown failed: ${why:-no message}"
fi

# --- Byte-stable write: a file is replaced only when its bytes differ.
mkdir -p "$out_dir" || die "cannot create '$out_dir'"
json_tmp=$(mktemp "$out_dir/.run-analytics.json.XXXXXX") || die "cannot create a temporary file in '$out_dir'"
md_tmp=$(mktemp "$out_dir/.run-analytics.md.XXXXXX") || die "cannot create a temporary file in '$out_dir'"
cp "$work/doc.json" "$json_tmp" && cp "$work/doc.md" "$md_tmp" || die "cannot write into '$out_dir'"
chmod 644 "$json_tmp" "$md_tmp" || die "cannot set the mode of the files in '$out_dir'"

changed=0
if ! cmp -s "$json_tmp" "$json_out"; then
  mv -f "$json_tmp" "$json_out" || die "cannot replace '$json_out'"
  json_tmp=""
  changed=1
fi
if ! cmp -s "$md_tmp" "$md_out"; then
  mv -f "$md_tmp" "$md_out" || die "cannot replace '$md_out'"
  md_tmp=""
  changed=1
fi

if [ "$m" -gt 0 ]; then
  printf 'recorded %s session(s) and %s round(s) for %s\n' "$n" "$m" "$branch"
elif [ "$n" -gt 0 ] || [ "$changed" -eq 1 ]; then
  printf 'recorded %s session(s) for %s\n' "$n" "$branch"
else
  printf 'unchanged: no new session for %s\n' "$branch"
fi
exit 0
