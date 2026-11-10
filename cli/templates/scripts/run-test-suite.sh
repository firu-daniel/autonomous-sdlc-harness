#!/usr/bin/env bash
# run-test-suite.sh — run the configured `commands.typecheck` (whole tree, no
# path argument) and `commands.test` strings once each and decide one verdict
# for the pair, `pass` or `fail`, so the Run gates phase's orchestrator reads
# that verdict and never either gate's output.
#
# OUTPUT CONTRACT — one stdout line. The run form prints `pending` (exit 3) once
# it has started a detached run of the label and that run has claimed `.running`
# or already written `.verdict` (the next `--wait` reads it); for a label already
# in flight it prints what the wait form would, and for a label whose finished
# verdict it reuses (ONE RUN PER LABEL) it answers that verdict at once, as the
# wait form would. A verdict is `pass` (exit 0) only
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
# WHAT A GATE IS TOLD. Both gates run with RUN_TEST_SUITE_LABEL set to the
# round's label and RUN_TEST_SUITE_LOG_DIR set to the directory holding its log,
# `<state_dir>/test_run_logs/<sanitized branch>`, repo-relative as `stateDir` is
# configured. A gate command may write its own per-round records beside the log,
# named `<label>.<suffix>` with a suffix BESIDE THE LOG does not list; this
# script reads none of them. A gate run by hand gets neither variable, and no
# gate gets RUN_TEST_SUITE_WORKER.
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
# truncates that label's log, unless the run form reuses that label's finished
# verdict (ONE RUN PER LABEL), which leaves the log as it is.
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
# THE NO-DETACH FORM, AND WHO ISSUES IT. `--no-detach <label>` is for
# `launch-sandboxed-gates.sh` alone. That script runs it as the one command of
# its own `bwrap` sandbox on a bubblewrap host, because a process detached inside
# a sandboxed call there did not outlive the call (`docs/sandbox-verification.md`
# §5 F10; BG9, LB5, T3), and a worker detached inside a PID namespace would end
# with it. So this form does the run form's checks, then runs both gates in its
# own process and writes `.verdict`. Its checks include the reuse (ONE RUN PER
# LABEL); reusing, it rewrites `.verdict` with its own content through
# `.verdict.tmp`, so the file's mtime is the current second — the launcher's
# `started()` accepts only a verdict stamped at or after its own call — and
# prints it. Issued from a session's foreground call it
# is bounded by the Bash tool's limits (F6), so Phase G never issues it.
# `.running` then holds the worker's PID inside its own namespace, which only
# this script ever compares, against its own `$$`.
#
# ONE RUN PER LABEL. The run form never starts a second run of a label whose
# run is live: it collects that run's verdict as the wait form would. Nor does
# it re-run a label whose finished verdict was reached with nothing the gates
# read changed since: it answers that verdict as the wait form would, starts
# nothing, and leaves the log, `.verdict` and `.commit` as they are. "Nothing
# the gates read has changed" means HEAD equals `.commit`'s line, and
# `git status --porcelain --untracked-files=all` over the repository with the
# state directory excluded printed nothing at the worker's start, at its finish
# and at reuse time. The state directory is excluded because the session
# writes run artifacts there during and between rounds, and the gates do not
# test them. Ignored files do not count: no commit carries them, and the status
# query does not list them. Residual: a gate that scans the state directory's
# committable files does not re-scan a change made there after the run. A
# session can write `.commit` as it can write `.verdict`, so reuse adds no trust
# surface. Not reusing, the run form removes `.verdict` and `.commit` before it
# starts a run, so a stale `.commit` never outlives its verdict. A run
# removes a `.running` file only while it still holds its own PID. `.running`'s
# content is the worker's PID as an ownership token; its MTIME IS THE
# HEARTBEAT, refreshed every HEARTBEAT_SECONDS while the worker is alive. A
# reader judges liveness from the files alone: `.verdict` present means
# finished; `.running` with a heartbeat no older than STALE_SECONDS means live;
# anything else means no run in flight, including a run that died without a
# verdict. A stall watchdog's kill-and-resume kills the session's PID and the
# descendants it can enumerate; the worker has been reparented away from them,
# so it survives, and the resumed session's run form for the same label
# collects it rather than starting a second run — while its heartbeat stays
# fresh (RESIDUALS OF THE DETACHED SHAPE).
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
# whether a run is alive, and this script sends no signal to a process another
# call started, and lists no process.
#
# HOW THE RUN FORM WAS STARTED DOES NOT MATTER. Whatever becomes of the call
# that issued the run form, the gates run in the worker, which no tool tracks.
# START-UP: the run form waits, bounded by STALE_SECONDS, until the worker has
# claimed `.running` OR has already written `.verdict` — a gate pair fast enough
# to finish between two polls, whose `.running` is already gone — and answers
# `pending` in both cases. Only seeing neither within the window is the refusal
# `the detached run of <label> did not start`. The poll bounds a process that
# has not begun, never a gate. The worker refreshes `.running` while it waits on
# its own gate, so the heartbeat stops when the worker stops.
#
# RESIDUALS OF THE DETACHED SHAPE. A gate that never exits keeps the heartbeat
# fresh, so `--wait` prints `pending` indefinitely: nothing in this script
# bounds a live run, by design, and a STOP file ends the wait, not the run.
# A worker that claims `.running` after the start-up window has closed sits
# behind a run form that already exited 2 with `the detached run of <label> did
# not start`, which G.1 escalates. Nothing here kills it: it runs its gates to a
# verdict and removes its `.running` as any worker does, and whoever next looks
# at the label — a `--wait`, or a run form re-issued by a resumed session after
# the escalation is answered — finds the run live and starts nothing. Another
# unguarded case is a run form re-issued INSIDE the gap between the refusal and
# the late claim: it finds no live run, starts a second worker, and the two race
# for `.running`. G.1 does not re-issue the run form within a session, so this
# needs a human or a resumed session to re-issue in that gap; it is recorded,
# not handled.
#
# A heartbeat stall with NO signal sent was observed with the former separate
# heartbeat process — a toucher fed by a pipe on the worker's fd 3: in a
# sandboxed macOS fixture (2026-10-23) `.running`'s mtime stopped advancing
# while the worker and its gate were both alive, in 2 of 14 holder runs, 1 of
# them with no signal sent; the cause was not established. That process has
# been removed. A stalled heartbeat would make the label read free after
# STALE_SECONDS while the run still runs: `--wait` refuses `no run in flight`,
# and a run form issued then starts a second worker that races the first for
# `.running`. Measured for the current shape on 2026-11-06, Claude Code
# 2.1.319, macOS 15.7.4, GNU bash 3.2.57, SANDBOXED (`docs/sandbox-verification.md`
# → the paragraph after row BG10): 16 holder runs of a detached
# `bash -c '<run form>; exec sleep 600'`, four at a time, each gate held 40 s on
# a release file, `.running`'s mtime read every 100 ms: the largest lag behind
# the clock while the worker lived was 1.02 s over 6321 readings, no `--wait`
# refused while a gate ran, and every run ended `pass`. Row BG10's real run,
# watched from outside, peaked at 1.05 s over 252 s.
#
# SIGNALS. Measured 2026-11-06, Claude Code 2.1.319 (`claude --version`), macOS
# 15.7.4, GNU bash 3.2.57, SANDBOXED, one Bash call per case, 8 runs each: a
# Node driver run through `scratch-run.sh` laid out a throwaway fixture as
# `init` writes it (this script and `lib/harness-run-lib.sh`), started the run
# form with the gate held on a release file and RUN_TEST_SUITE_STALE at 5,
# signalled 1.5 s after the gate started, read the files 1 s and 4 s later,
# issued `--wait`, released the gate, and read them again STALE_SECONDS + 2 s
# later. No signal was refused by the sandbox, and no run was a setup fault.
#   - TERM to the worker's PID alone (8 of 8): bash runs a trap only once its
#     foreground command returns, so the worker and the gate ran on, the
#     heartbeat kept advancing and `--wait` printed `pending` until the gate was
#     released; then `.running` was removed, no verdict and no further marker
#     were written, and the next `--wait` refused `no run in flight`.
#   - KILL to the worker's PID alone (8 of 8): the worker ended at once and the
#     heartbeat stopped with it; the gate survived orphaned until released;
#     `.running` stayed and no verdict was written; `--wait`, once the heartbeat
#     was stale, refused `no run in flight`. The former toucher's 6-of-8 fresh
#     heartbeat after a KILL is gone with it.
#   - INT to the calling shell's process group (8 of 8): the worker, the gate and
#     the calling shell's own `exec sleep` kept running, the heartbeat kept
#     advancing, `--wait` printed `pending`, and once the gate was released the
#     verdict `pass` was written and `.running` removed. The former toucher's
#     2-of-7 stall under INT did not recur.
#   - HUP to the worker's PID alone (8 of 8): no effect; once the gate was
#     released the verdict `pass` was written and `.running` removed.
# A worker stopped by TERM therefore never reports its label free while its gate
# runs, and once the trap ran the next `--wait` refuses at once.
# Residuals: after a KILL to the worker's PID alone, the heartbeat stops with
# the worker, and the label reads free after STALE_SECONDS while an orphaned
# gate may still run — row WF3 measured it on a real run, the gate and its
# subshell orphaned and running on; a host suspended mid-run can wake with a
# stale heartbeat before the worker refreshes it.
#
# THE BOUND. STALE_SECONDS, the run library's HR_TEST_RUN_STALE_SECONDS (30),
# is below WAIT_SLICE_SECONDS (60), so one
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
#   <label>.commit   the commit the gates ran against, one line, renamed into
#                    place before `.verdict` and only by a worker that found the
#                    tree clean outside the state directory on that same commit
#                    at its start and its finish; what the reuse compares
# A refusal writes none of these files, and no log.
#
# Usage:
#   run-test-suite.sh <label>          start typecheck then test detached and print `pending`, or print a finished verdict of <label> it reuses; label matching the run library's HR_TEST_RUN_LABEL_PATTERN
#   run-test-suite.sh --wait <label>   read the verdict of a run of <label>; never runs anything
#   run-test-suite.sh --no-detach <label>   run typecheck then test in this process and print the verdict; for `launch-sandboxed-gates.sh` alone
#
# Exit map:
#   0  pass (wait form reading a `pass` verdict, run form collecting a run already in flight, or run form reusing a finished verdict of its label)
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
# The no-detach form exits 3 for a live label, and otherwise with the verdict exit, 0 or 1 — of the verdict it reuses, or of its own run.

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

refuse() {
  echo "run-test-suite.sh: $1" >&2
  exit 2
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
hr_lib="$script_dir/lib/harness-run-lib.sh"
[ -r "$hr_lib" ] || refuse "cannot read '$hr_lib'"
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

HEARTBEAT_SECONDS=1
STALE_SECONDS="$HR_TEST_RUN_STALE_SECONDS"
if [[ "${RUN_TEST_SUITE_STALE-}" =~ ^[0-9]+$ ]] && [ "$RUN_TEST_SUITE_STALE" -ge 3 ] 2>/dev/null; then
  STALE_SECONDS="$RUN_TEST_SUITE_STALE"
fi

# Mirrors COMMAND_NONE_SENTINEL in the CLI's config model: exact and
# case-sensitive on the whitespace-trimmed value.
TYPECHECK_NONE_SENTINEL='<none>'

usage='usage: run-test-suite.sh <label> | run-test-suite.sh --wait <label> | run-test-suite.sh --no-detach <label>'
mode=run
case "$#" in
  1) label="$1" ;;
  2)
    case "$1" in
      --wait) mode=wait ;;
      --no-detach) mode=nodetach ;;
      *) refuse "$usage" ;;
    esac
    label="$2"
    ;;
  *) refuse "$usage" ;;
esac
[ "$label" != "--no-detach" ] || refuse "$usage"
[[ "$label" =~ $HR_TEST_RUN_LABEL_PATTERN ]] || refuse "label '$label' does not match $HR_TEST_RUN_LABEL_PATTERN"

# F15: inside a sandbox `<scriptsDir>/.git` is a placeholder git's discovery
# dies on, so the root is placed by `hr_script_root`, which never starts there.
root="$(hr_script_root "$script_dir")" || refuse "'$script_dir' is not inside a git repository"
cd "$root" || refuse "cannot enter '$root'"

state_dir="$(hr_state_dir "$root")" || refuse "cannot resolve '$root/harness.config.json'"

branch="$(hr_current_branch "$root")"
[ -n "$branch" ] || refuse "no current branch (detached HEAD?)"
log_dir="$(hr_test_run_lane_dir "$state_dir" "$branch")" || refuse "no current branch (detached HEAD?)"
log_file="$log_dir/$label.log"
running_file="$log_dir/$label.running"
verdict_file="$log_dir/$label.verdict"
commit_file="$log_dir/$label.commit"

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

# clean_tree_commit_var <name> — set the variable <name> to HEAD's commit when
# nothing outside the state directory is dirty, untracked files included, else
# to empty; always empty for a state directory at the repository root, which
# would exclude everything (ONE RUN PER LABEL). The only `status` call site.
# `--no-optional-locks`: under the launcher `.git` is bound read-only, and a
# plain `status` tries to write `.git/index.lock`.
clean_tree_commit_var() {
  local dir="$state_dir" head dirty
  printf -v "$1" '%s' ''
  while [ "${dir#./}" != "$dir" ]; do dir="${dir#./}"; done
  case "$dir" in ''|.) return 0 ;; esac
  head="$(git rev-parse --verify -q HEAD 2>/dev/null)" || return 0
  dirty="$(git --no-optional-locks status --porcelain --untracked-files=all -- . ":(exclude)$dir" 2>/dev/null)" || return 0
  [ -z "$dirty" ] || return 0
  printf -v "$1" '%s' "$head"
}

# True when `.verdict` holds a verdict line and `.commit` names the commit a
# clean tree is on now: that verdict answers this label without a run.
verdict_reusable() {
  local line recorded now
  [ -f "$verdict_file" ] && [ -f "$commit_file" ] || return 1
  line="$(cat "$verdict_file" 2>/dev/null)" || return 1
  case "$line" in
    pass|"fail "?*) ;;
    *) return 1 ;;
  esac
  recorded="$(cat "$commit_file" 2>/dev/null)" || return 1
  clean_tree_commit_var now
  [ -n "$now" ] && [ "$recorded" = "$now" ]
}

run_alive() {
  local age
  [ -f "$running_file" ] || return 1
  if age="$(hr_heartbeat_age "$running_file")"; then
    [ "$age" -le "$STALE_SECONDS" ]
    return
  fi
  # Vanished since the first test: the run finished, and the caller re-checks
  # for its verdict. Still present: unreadable, which is never guessed.
  [ -f "$running_file" ] || return 1
  refuse "cannot read the heartbeat of '$running_file'"
}

# A gate inherits the worker's dispositions; INT reached it ignored when
# measured (SIGNALS above), and a non-interactive `&` job starts with INT and
# QUIT ignored besides. `set +u +o pipefail` grades the command under the
# options a plain `bash -c` would give it, not this script's. The worker is the
# only process that refreshes the heartbeat, so it stops when the worker stops;
# `kill -0` goes only to the worker's own child (WHY NOT A SIGNAL). `touch -c`
# never recreates a `.running` already removed.
run_gate() {
  local gate_pid
  (
    set +u +o pipefail
    export RUN_TEST_SUITE_LABEL="$label" RUN_TEST_SUITE_LOG_DIR="$log_dir"
    eval "$1"
  ) < /dev/null >> "$log_file" 2>&1 &
  gate_pid=$!
  while kill -0 "$gate_pid" 2>/dev/null; do
    touch -c "$running_file"
    sleep "$HEARTBEAT_SECONDS"
  done
  wait "$gate_pid"
}

# Records the signal only: the worker keeps refreshing the heartbeat until its
# gate returns, and finish_signalled then ends the run with no verdict.
signalled=
on_signal() {
  signalled=$1
}

# Called after each gate returns and before its `exited` marker, so a signalled
# worker never starts the next gate and writes no further marker.
finish_signalled() {
  [ -n "$signalled" ] || return 0
  if [ "$(cat "$running_file" 2>/dev/null)" = "$$" ]; then rm -f "$running_file"; fi
  exit $((128 + signalled))
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

# THE NO-DETACH FORM: the block below up to its detach, then this process is the
# worker. Nothing reads its stdout, so a live label answers `pending` at once
# rather than through `wait_for_verdict`.
if [ "$mode" = nodetach ] && [ "$worker_marker" != "$label" ]; then
  if run_alive; then
    echo pending
    exit 3
  fi
  if verdict_reusable; then
    reused="$(cat "$verdict_file" 2>/dev/null)" || refuse "cannot read '$verdict_file'"
    printf '%s\n' "$reused" > "$verdict_file.tmp" && mv -f "$verdict_file.tmp" "$verdict_file" \
      || refuse "cannot rewrite '$verdict_file'"
    emit_verdict
  fi
  mkdir -p "$log_dir" || refuse "cannot create '$log_dir'"
  rm -f "$verdict_file" "$verdict_file.tmp" "$commit_file" "$commit_file.tmp"
  worker_marker="$label"
fi

if [ "$worker_marker" != "$label" ]; then
  # ONE RUN PER LABEL. A live run of this label — a session that re-entered the
  # phase while its earlier detached run still runs — is never joined by a
  # second: collect that run's verdict instead, exactly as the wait form would.
  if run_alive; then
    wait_for_verdict
  fi
  if verdict_reusable; then
    emit_verdict
  fi

  mkdir -p "$log_dir" || refuse "cannot create '$log_dir'"
  rm -f "$verdict_file" "$verdict_file.tmp" "$commit_file" "$commit_file.tmp"

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
clean_tree_commit_var start_commit
trap 'on_signal 15' TERM
trap 'on_signal 2' INT
trap 'on_signal 1' HUP
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
  finish_signalled
  marker "gate typecheck exited $typecheck_status"
fi

finish_signalled
marker "gate test (commands.test)"
run_gate "$command_line"
test_status=$?
finish_signalled
marker "gate test exited $test_status"
clean_tree_commit_var finish_commit

status=0
if [ "$typecheck_status" -ne 0 ] || [ "$test_status" -ne 0 ]; then status=1; fi

if [ "$status" -eq 0 ]; then
  verdict="pass"
else
  verdict="fail $log_file"
fi

trap - TERM INT HUP
finish_signalled
if [ -n "$start_commit" ] && [ "$start_commit" = "$finish_commit" ]; then
  printf '%s\n' "$start_commit" > "$commit_file.tmp" && mv -f "$commit_file.tmp" "$commit_file"
fi
printf '%s\n' "$verdict" > "$verdict_file.tmp" && mv -f "$verdict_file.tmp" "$verdict_file"
if [ "$(cat "$running_file" 2>/dev/null)" = "$$" ]; then rm -f "$running_file"; fi

# The worker's stdout is /dev/null; the run form and `--wait` read `.verdict`.
echo "$verdict"
[ "$status" -eq 0 ] && exit 0
exit 1
