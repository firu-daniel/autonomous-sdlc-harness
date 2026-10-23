#!/usr/bin/env bash
# run-test-suite.sh — run the configured `commands.typecheck` (whole tree, no
# path argument) and `commands.test` strings once each and decide one verdict
# for the pair, `pass` or `fail`, so the Run gates phase's orchestrator reads
# that verdict and never either gate's output.
#
# OUTPUT CONTRACT — one stdout line. The run form prints `pending` (exit 3) once
# it has started a detached run of the label and that run has claimed `.running`
# or already written `.verdict` (the next `--wait` reads it); for a label already
# in flight it prints what the wait form would. A verdict is `pass` (exit 0) only
# when the typecheck passed or was not run for `<none>` AND the test passed, else
# `fail <log path>` (exit 1), the path repo-relative. No gate output reaches
# stdout or stderr; the orchestrator never reads the log, only hands its path on.
#
# TWO GATES, ONE VERDICT. Typecheck first, then test, each from the repository
# root with stdin from /dev/null, into the same log under these marker lines —
# a wire `test-fix-plan-writer` reads, so they are byte-exact:
#   == run-test-suite.sh: gate typecheck (commands.typecheck) ==
#   == run-test-suite.sh: gate typecheck exited <status> ==
#   == run-test-suite.sh: gate typecheck not run: commands.typecheck is <none> ==
#   == run-test-suite.sh: gate test (commands.test) ==
#   == run-test-suite.sh: gate test exited <status> ==
#
# RUN BOTH, REPORT BOTH. The test runs after a failing typecheck: MAX_GATE_ROUNDS
# counts gate runs, so a branch broken both ways spends one run and gets one fix
# plan, not two.
#
# `<none>` IS NOT A PASS. A `commands.typecheck` whose trimmed value is exactly
# `<none>` writes the header and the not-run line and runs nothing; the verdict
# then rests on the test alone. The sentinel is never `eval`-ed — it would parse
# as a shell redirect.
#
# THE NAME IS KEPT although it now runs two gates: renaming would reach
# `OUTER_LOOP_SCRIPTS`, two test pins and every adopter's permission profile.
#
# THE LOG IS VERSIONED PER ROUND, NOT OVERWRITTEN:
#   <state_dir>/test_run_logs/<sanitized branch>/<label>.log
# The caller passes `<gate_key>_round_<gate_round>` as the label, so each round
# keeps its own log and a fix planned against round N still finds round N's
# output after round N+1 ran. Only a re-run of the SAME label — a resumed round —
# truncates that label's log.
#
# THE WAIT FORM, AND WHY IT EXISTS. The run form never runs the gates itself: it
# re-invokes this script as a WORKER detached from the calling shell (`nohup`,
# stdin, stdout and stderr all away from the caller, then `disown`) and answers
# `pending`. A gate run is therefore not a tool task, and no tool-level time
# limit applies to it (`docs/sandbox-verification.md` → row BG2: Claude Code
# 2.1.309, macOS, headless, sandboxed). Every round is collected by
# `--wait <label>` issued as a foreground call, repeatedly, until it prints a
# verdict; those repeated calls are what keep a session's turn open and its STOP
# and PAUSE checks running. Each call polls for at most one wait slice and then
# prints `pending`. No caller's correctness depends on the slice's length:
# `pending` means only "issue the same call again", so the suite may take any
# length of time.
#
# ONE RUN PER LABEL. The run form never starts a second run of a label whose
# run is live: it collects that run's verdict as the wait form would. A run
# removes a `.running` file only while it still holds its own PID. `.running`'s
# content is the worker's PID as an ownership token; its MTIME IS THE
# HEARTBEAT, refreshed every HEARTBEAT_SECONDS while the worker is alive. A
# reader judges liveness from the files alone: `.verdict` present means
# finished; `.running` with a heartbeat no older than STALE_SECONDS means live;
# anything else means no run in flight, including a run that died without a
# verdict. A stall watchdog's kill-and-resume kills the session's PID and the
# descendants it can enumerate; the worker has been reparented away from them,
# so it survives, and the resumed session's run form for the same label
# collects it rather than starting a second run.
#
# WHY NOT A SIGNAL. Measured 2026-10-23, Claude Code 2.1.309, macOS, headless
# sandboxed session under the live profile: `kill -0` from a later call on a
# process another call started was refused (`kill: (68252) - Operation not
# permitted`, exit 1), and so was it on a process the wrapper had detached
# itself (`nohup … &`, `disown`: `kill: (70347) - Operation not permitted`);
# `kill -0` within one call on that call's own child exited 0; `ps -p` was
# refused even within one call (`/bin/ps: Operation not permitted`, exit 126).
# Observed separately, not in that session, by a sandboxed run of a test that
# reads the process list: `pgrep` could not read it (`pgrep: Cannot get process
# list`, exit 3). So no signal or process-table check can tell a later call
# whether a run is alive, and this script sends no signal and lists no process.
#
# HOW THE RUN FORM WAS STARTED DOES NOT MATTER. Whatever becomes of the call
# that issued the run form, the gates run in the worker, which no tool tracks.
# START-UP: the run form waits, bounded by STALE_SECONDS, until the worker has
# claimed `.running` OR has already written `.verdict` — a gate pair fast enough
# to finish between two polls, whose `.running` is already gone — and answers
# `pending` in both cases. Only seeing neither within the window is the refusal
# `the detached run of <label> did not start`. The poll bounds a process that
# has not begun, never a gate. The heartbeat process reads a pipe whose only
# write end is the worker's fd 3 and stops at that pipe's end of file; each gate
# runs with `3>&-`, so a gate orphaned by the worker's death cannot keep it
# fresh.
#
# RESIDUALS OF THE DETACHED SHAPE. A gate that never exits keeps the heartbeat
# fresh, so `--wait` prints `pending` indefinitely: nothing in this script
# bounds a live run, by design, and a STOP file ends the wait, not the run.
# A worker that claims `.running` after the start-up window has closed sits
# behind a run form that already exited 2 with `the detached run of <label> did
# not start`, which G.1 escalates. Nothing here kills it: it runs its gates to a
# verdict and removes its `.running` as any worker does, and whoever next looks
# at the label — a `--wait`, or a run form re-issued by a resumed session after
# the escalation is answered — finds the run live and starts nothing. The one
# unguarded case is a run form re-issued INSIDE the gap between the refusal and
# the late claim: it finds no live run, starts a second worker, and the two race
# for `.running`. G.1 does not re-issue the run form within a session, so this
# needs a human or a resumed session to re-issue in that gap; it is recorded,
# not handled.
#
# SIGNALS. Measured 2026-10-23, Claude Code 2.1.309 (`claude --version`), macOS,
# GNU bash 3.2.57, SANDBOXED, within one Bash call: a Node driver run through
# `scratch-run.sh` started the run form in a throwaway fixture and signalled the
# worker its own descendant had started, with the gate held on a release file.
# No signal was refused by the sandbox.
#   - TERM to the worker's PID alone: bash runs a trap only once its foreground
#     command returns, so the gate kept running and `--wait` printed `pending`
#     until the gate was released; then `.running` was removed, no verdict and
#     no further marker were written, and the next `--wait` refused `no run in
#     flight`. Unchanged from the unsandboxed run-form measurement.
#   - KILL to the worker's PID alone: the worker ended at once; the gate
#     survived orphaned until released; `.running` stayed and no verdict was
#     written. CHANGED: the heartbeat did not reliably stop. In 6 of 8 runs it
#     stayed fresh after both the worker and the orphaned gate had ended, for as
#     long as observed (24 s), so `--wait` kept printing `pending`; in 2 of 8 it
#     stopped and the label read free after STALE_SECONDS. The pre-detach run
#     form, KILLed the same way, showed the same split (3 of 4 fresh), so the
#     detach did not cause it; its cause was not established.
#   - INT to the calling shell's process group: in 7 of 7 runs the worker, the
#     gate and the calling shell's own `exec sleep` kept running, and once the
#     gate was released the verdict `pass` was written and `.running` removed.
#     CHANGED: INT no longer stops the gate; and in 2 of 7 runs the heartbeat
#     stopped within 3 s while the worker and gate ran on, so the label read
#     free once stale (`--wait` refused `no run in flight` with STALE_SECONDS at
#     5) while the run still ran; its cause was not established. Under that
#     call a plain `sleep` also survived INT to its own PID, so INT was ignored
#     on entry by every process measured, and this case does not isolate the
#     background-job rule.
#   - HUP to the worker's PID alone: no effect; once the gate was released the
#     verdict `pass` was written and `.running` removed.
# A worker stopped by TERM therefore never reports its label free while its gate
# runs, and once the trap ran the next `--wait` refuses at once.
# Residuals: after a KILL to the worker's PID alone, the label may read live
# with no run behind it (above), or free once the heartbeat is stale while the
# orphaned gate still runs; after an INT to the calling group, the label may
# read free while the run still runs (above); a KILL sent to the internal
# heartbeat process alone stops the heartbeat while the gate runs; a host
# suspended mid-run can wake with a stale heartbeat before the heartbeat process
# refreshes it.
#
# THE BOUND. STALE_SECONDS (30) is below WAIT_SLICE_SECONDS (60), so one
# `--wait` call ends for a crashed run. RUN_TEST_SUITE_STALE is its test seam,
# accepted only as digits with a value >= 3, else the default stands: mtimes are
# whole seconds, so a live run's age reads up to 2 and a smaller bound would
# judge it dead. The mtime is read through the library's `hr_lane_mtime`, which
# picks the BSD or GNU `stat` spelling on the value rather than the exit status;
# this script carries no `stat` of its own.
#
# BESIDE THE LOG, in the same directory:
#   <label>.running  the worker's own PID (ownership token), present while the
#                    gates run; its mtime is the heartbeat
#   <label>.verdict  the verdict line, renamed into place whole once both gates
#                    finished, so a reader never sees half a line
#   <label>.running.stop.<pid>
#                    transient: the heartbeat's own stop signal, written at the
#                    end of a run and removed once the heartbeat has stopped
# A refusal writes neither file, and no log.
#
# Usage:
#   run-test-suite.sh <label>          start typecheck then test detached and print `pending`; label ^[A-Za-z0-9][A-Za-z0-9._-]*$
#   run-test-suite.sh --wait <label>   read the verdict of a run of <label>; never runs anything
#
# Exit map:
#   0  pass (wait form reading a `pass` verdict, or run form collecting a run already in flight)
#   1  fail (likewise)
#   2  refusal — one stderr line `run-test-suite.sh: <reason>`, nothing on stdout:
#      bad arguments, a label outside the pattern, an unresolvable configuration,
#      `commands.typecheck` or `commands.test` unset, no current branch,
#      (wait form) no run in flight — no `.running`, or a heartbeat older than
#      STALE_SECONDS — or (either form) a `.running` whose heartbeat cannot be
#      read: `cannot read the heartbeat of '<path>'` — or (run form) a worker
#      that neither claimed `.running` nor wrote `.verdict` within STALE_SECONDS:
#      `the detached run of <label> did not start`
#   3  pending — the run form's normal answer once its detached run has started, or the wait form (or run form) while a run is in flight; issue the wait form

# Deliberately no `-e`: this script has to outlive the command's failure long
# enough to write and print the verdict.
set -uo pipefail

# Read and dropped before anything else, so no gate ever inherits the marker:
# this repository's own suite spawns this wrapper with a gate label.
worker_marker="${RUN_TEST_SUITE_WORKER-}"
unset RUN_TEST_SUITE_WORKER

# The wait form's poll bound. Far inside the Bash tool's default foreground
# window, so a `--wait` call is never itself moved to the background.
WAIT_SLICE_SECONDS=60
if [[ "${RUN_TEST_SUITE_WAIT_SLICE-}" =~ ^[0-9]+$ ]]; then
  WAIT_SLICE_SECONDS="$RUN_TEST_SUITE_WAIT_SLICE"
fi

HEARTBEAT_SECONDS=1
STALE_SECONDS=30
if [[ "${RUN_TEST_SUITE_STALE-}" =~ ^[0-9]+$ ]] && [ "$RUN_TEST_SUITE_STALE" -ge 3 ] 2>/dev/null; then
  STALE_SECONDS="$RUN_TEST_SUITE_STALE"
fi

LOG_SUBDIR='test_run_logs'
LABEL_PATTERN='^[A-Za-z0-9][A-Za-z0-9._-]*$'
# Mirrors COMMAND_NONE_SENTINEL in the CLI's config model: exact and
# case-sensitive on the whitespace-trimmed value.
TYPECHECK_NONE_SENTINEL='<none>'

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
heartbeat_stop_file="$running_file.stop.$$"

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

# Print the heartbeat's age in whole seconds; fail, printing nothing, when the
# mtime cannot be read (`hr_lane_mtime` prints 0 for that and for a missing path).
heartbeat_age() {
  local mtime now
  mtime="$(hr_lane_mtime "$running_file")"
  [ "$mtime" != 0 ] || return 1
  now="$(date +%s)"
  if [ "$now" -gt "$mtime" ]; then
    printf '%s\n' "$((now - mtime))"
  else
    printf '0\n'
  fi
}

run_alive() {
  local age
  [ -f "$running_file" ] || return 1
  if age="$(heartbeat_age)"; then
    [ "$age" -le "$STALE_SECONDS" ]
    return
  fi
  # Vanished since the first test: the run finished, and the caller re-checks
  # for its verdict. Still present: unreadable, which is never guessed.
  [ -f "$running_file" ] || return 1
  refuse "cannot read the heartbeat of '$running_file'"
}

# The heartbeat process: runs on the read end of the worker's fd 3 and ends at
# that pipe's end of file. `read` without `-t`, because bash 3.2's `read -t`
# returns 1 on both timeout and EOF; hence the separate touch loop. `touch -c`
# never recreates a `.running` the worker already removed, and the loop also
# ends once `.running` is gone, so a stop file that cannot be written (its
# directory removed mid-run) never leaves it touching forever.
heartbeat_loop() {
  local toucher _
  (
    while [ ! -e "$heartbeat_stop_file" ] && [ -e "$running_file" ]; do
      touch -c "$running_file"
      sleep "$HEARTBEAT_SECONDS"
    done
  ) &
  toucher=$!
  while IFS= read -r _; do :; done
  : > "$heartbeat_stop_file"
  wait "$toucher"
  rm -f "$heartbeat_stop_file"
}

# A gate inherits the worker's dispositions; INT reached it ignored when
# measured (SIGNALS above). `3>&-` drops its copy of the heartbeat pipe, so an orphaned gate cannot
# keep the heartbeat fresh. `set +u +o pipefail` grades the command under the
# options a plain `bash -c` would give it, not this script's.
run_gate() {
  ( set +u +o pipefail; eval "$1" ) 3>&- < /dev/null >> "$log_file" 2>&1
  return $?
}

# Sends no signal: exiting closes fd 3, which ends the heartbeat.
on_signal() {
  if [ "$(cat "$running_file" 2>/dev/null)" = "$$" ]; then rm -f "$running_file"; fi
  exit $((128 + $1))
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

typecheck_line="$(hr_command "$root" typecheck)"
case $? in
  0) ;;
  2) refuse "cannot resolve '$root/harness.config.json'" ;;
  *) typecheck_line="" ;;
esac
[ -n "$typecheck_line" ] || refuse "commands.typecheck is not set in harness.config.json"

typecheck_trimmed="${typecheck_line#"${typecheck_line%%[![:space:]]*}"}"
typecheck_trimmed="${typecheck_trimmed%"${typecheck_trimmed##*[![:space:]]}"}"
typecheck_is_none=0
if [ "$typecheck_trimmed" = "$TYPECHECK_NONE_SENTINEL" ]; then typecheck_is_none=1; fi

if [ "$worker_marker" != "$label" ]; then
  # ONE RUN PER LABEL. A live run of this label — a session that re-entered the
  # phase while its earlier detached run still runs — is never joined by a
  # second: collect that run's verdict instead, exactly as the wait form would.
  if run_alive; then
    wait_for_verdict
  fi

  mkdir -p "$log_dir" || refuse "cannot create '$log_dir'"
  rm -f "$verdict_file" "$verdict_file.tmp"

  # `nohup` by name on PATH: the suite shadows it to exercise the refusal below.
  RUN_TEST_SUITE_WORKER="$label" nohup bash "$script_dir/$(basename "${BASH_SOURCE[0]}")" "$label" </dev/null >/dev/null 2>&1 &
  worker_pid=$!
  disown

  # A `.verdict` is this worker's: the stale one was removed above. A worker
  # whose gates finish between two polls has already removed its `.running`.
  start_deadline=$((SECONDS + STALE_SECONDS))
  while :; do
    if [ -f "$verdict_file" ] || [ "$(cat "$running_file" 2>/dev/null)" = "$worker_pid" ]; then
      echo pending
      exit 3
    fi
    [ "$SECONDS" -lt "$start_deadline" ] || break
    sleep 1
  done
  refuse "the detached run of $label did not start"
fi

printf '%s\n' "$$" > "$running_file"
trap 'on_signal 15' TERM
trap 'on_signal 2' INT
trap 'on_signal 1' HUP
rm -f "$heartbeat_stop_file"
exec 3> >(heartbeat_loop > /dev/null 2>&1)
: > "$log_file"

marker() {
  printf '== run-test-suite.sh: %s ==\n' "$1" >> "$log_file"
}

marker "gate typecheck (commands.typecheck)"
if [ "$typecheck_is_none" -eq 1 ]; then
  typecheck_status=0
  marker "gate typecheck not run: commands.typecheck is <none>"
else
  run_gate "$typecheck_line"
  typecheck_status=$?
  marker "gate typecheck exited $typecheck_status"
fi

marker "gate test (commands.test)"
run_gate "$command_line"
test_status=$?
marker "gate test exited $test_status"

status=0
if [ "$typecheck_status" -ne 0 ] || [ "$test_status" -ne 0 ]; then status=1; fi

if [ "$status" -eq 0 ]; then
  verdict="pass"
else
  verdict="fail $log_file"
fi

trap - TERM INT HUP
printf '%s\n' "$verdict" > "$verdict_file.tmp" && mv -f "$verdict_file.tmp" "$verdict_file"
if [ "$(cat "$running_file" 2>/dev/null)" = "$$" ]; then rm -f "$running_file"; fi
exec 3>&-

# The worker's stdout is /dev/null; the run form and `--wait` read `.verdict`.
echo "$verdict"
[ "$status" -eq 0 ] && exit 0
exit 1
