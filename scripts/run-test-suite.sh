#!/usr/bin/env bash
# run-test-suite.sh — run the configured `commands.test` string once and decide
# one verdict for it, `pass` or `fail`, so the Run gates phase's orchestrator
# reads that verdict and never the suite's output.
#
# OUTPUT CONTRACT — the run form prints exactly one stdout line: `pass` (exit 0),
# `fail <log path>` (exit 1), or — when a run of the same label is already in
# flight — `pending` (exit 3), the log path repo-relative. Nothing the command
# prints reaches stdout or stderr; all of it goes to the log. The orchestrator
# never reads the log — it hands the path on to whatever plans the fix.
#
# THE LOG IS VERSIONED PER ROUND, NOT OVERWRITTEN:
#   <state_dir>/test_run_logs/<sanitized branch>/<label>.log
# The caller passes `<gate_key>_round_<gate_round>` as the label, so each round
# keeps its own log and a fix planned against round N still finds round N's
# output after round N+1 ran. Only a re-run of the SAME label — a resumed round —
# truncates that label's log.
#
# THE WAIT FORM, AND WHY IT EXISTS. A headless session is torn down when its turn
# ends (`plugin/instructions/autonomous_pause_and_ledger.md` → §2.5), so a caller
# whose run the Bash tool moved to the background must not end its turn, sleep,
# or hand the wait to a `Monitor` to collect the verdict. It issues
# `--wait <label>` as a foreground call instead, repeatedly, until that prints a
# verdict. Each call polls for at most one wait slice and then prints `pending`.
# No caller's correctness depends on the slice's length: `pending` means only
# "issue the same call again", so the suite may take any length of time.
#
# ONE RUN PER LABEL. The run form never starts a second run of a label whose
# run is live: it collects that run's verdict as the wait form would. A run
# removes a `.running` file only while it still holds its own PID.
#
# BESIDE THE LOG, in the same directory:
#   <label>.running  the run form's own PID, present while the command runs
#   <label>.verdict  the verdict line, renamed into place whole once the command
#                    exits, so a reader never sees half a line
# A refusal writes neither file, and no log.
#
# Usage:
#   run-test-suite.sh <label>          run the suite; label ^[A-Za-z0-9][A-Za-z0-9._-]*$
#   run-test-suite.sh --wait <label>   read the verdict of a run of <label>; never runs anything
#
# Exit map:
#   0  pass (run form, or wait form reading a `pass` verdict)
#   1  fail (likewise)
#   2  refusal — one stderr line `run-test-suite.sh: <reason>`, nothing on stdout:
#      bad arguments, a label outside the pattern, an unresolvable configuration,
#      `commands.test` unset, no current branch, or (wait form) no run in flight
#   3  pending — the wait form, or the run form finding a run of the same label already in flight; issue the wait form

# Deliberately no `-e`: this script has to outlive the command's failure long
# enough to write and print the verdict.
set -uo pipefail

# The wait form's poll bound. Far inside the Bash tool's default foreground
# window, so a `--wait` call is never itself moved to the background.
WAIT_SLICE_SECONDS=60
if [[ "${RUN_TEST_SUITE_WAIT_SLICE-}" =~ ^[0-9]+$ ]]; then
  WAIT_SLICE_SECONDS="$RUN_TEST_SUITE_WAIT_SLICE"
fi

LOG_SUBDIR='test_run_logs'
LABEL_PATTERN='^[A-Za-z0-9][A-Za-z0-9._-]*$'

refuse() {
  echo "run-test-suite.sh: $1" >&2
  exit 2
}

mode=run
case "$#" in
  1) label="$1" ;;
  2)
    [ "$1" = "--wait" ] || refuse "usage: run-test-suite.sh <label> | run-test-suite.sh --wait <label>"
    mode=wait
    label="$2"
    ;;
  *) refuse "usage: run-test-suite.sh <label> | run-test-suite.sh --wait <label>" ;;
esac
[[ "$label" =~ $LABEL_PATTERN ]] || refuse "label '$label' does not match $LABEL_PATTERN"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
hr_lib="$script_dir/lib/harness-run-lib.sh"
[ -r "$hr_lib" ] || refuse "cannot read '$hr_lib'"
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

root="$(hr_repo_root "$script_dir")" || refuse "'$script_dir' is not inside a git repository"
cd "$root" || refuse "cannot enter '$root'"

state_dir="$(hr_state_dir "$root")" || refuse "cannot resolve '$root/harness.config.json'"

branch="$(hr_current_branch "$root")"
[ -n "$branch" ] || refuse "no current branch (detached HEAD?)"
safe_branch="$(hr_sanitize_branch "$branch")" || refuse "no current branch (detached HEAD?)"

log_dir="$state_dir/$LOG_SUBDIR/$safe_branch"
log_file="$log_dir/$label.log"
running_file="$log_dir/$label.running"
verdict_file="$log_dir/$label.verdict"

# Print a verdict file's line and exit with its status.
emit_verdict() {
  local line
  line="$(cat "$verdict_file" 2>/dev/null)" || refuse "cannot read '$verdict_file'"
  case "$line" in
    pass) echo "$line"; exit 0 ;;
    "fail "?*) echo "$line"; exit 1 ;;
  esac
  refuse "'$verdict_file' holds no verdict line"
}

run_alive() {
  local pid
  [ -f "$running_file" ] || return 1
  pid="$(cat "$running_file" 2>/dev/null)" || return 1
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

# Poll for the verdict of the run of <label> that is in flight, for at most one
# wait slice; print it, or `pending`.
wait_for_verdict() {
  local deadline=$((SECONDS + WAIT_SLICE_SECONDS))
  while :; do
    [ -f "$verdict_file" ] && emit_verdict
    if ! run_alive; then
      # The verdict is renamed into place before `.running` is removed, so a
      # run that finished between the two tests above has left it.
      [ -f "$verdict_file" ] && emit_verdict
      refuse "no run in flight for $label"
    fi
    [ "$SECONDS" -lt "$deadline" ] || break
    sleep 1
  done
  echo pending
  exit 3
}

if [ "$mode" = wait ]; then
  wait_for_verdict
fi

command_line="$(hr_command "$root" test)"
case $? in
  0) ;;
  2) refuse "cannot resolve '$root/harness.config.json'" ;;
  *) command_line="" ;;
esac
[ -n "$command_line" ] || refuse "commands.test is not set in harness.config.json"

# ONE RUN PER LABEL. A live run of this label — a session that re-entered the
# phase while its earlier, backgrounded run still runs — is never joined by a
# second: collect that run's verdict instead, exactly as the wait form would.
if run_alive; then
  wait_for_verdict
fi

mkdir -p "$log_dir" || refuse "cannot create '$log_dir'"
rm -f "$verdict_file" "$verdict_file.tmp"
printf '%s\n' "$$" > "$running_file"
: > "$log_file"

# `set +u +o pipefail` inside the subshell grades the command under the options
# a plain `bash -c` would give it, not this script's.
(
  set +u +o pipefail
  eval "$command_line"
) < /dev/null > "$log_file" 2>&1
status=$?

if [ "$status" -eq 0 ]; then
  verdict="pass"
else
  verdict="fail $log_file"
fi

printf '%s\n' "$verdict" > "$verdict_file.tmp" && mv -f "$verdict_file.tmp" "$verdict_file"
if [ "$(cat "$running_file" 2>/dev/null)" = "$$" ]; then rm -f "$running_file"; fi

echo "$verdict"
[ "$status" -eq 0 ] && exit 0
exit 1
