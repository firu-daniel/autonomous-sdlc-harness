#!/usr/bin/env bash
# gate-worker-start-probe.sh — measure, from inside the calling session's own sandbox, whether the Run
# gates worker starts, capture the worker's own stderr, and separate `nohup` from detaching by controls
# that each remove one candidate. Answers the task prompt `fix_gate_worker_sandbox_start`. Hand-written
# for this repository, like scripts/sandbox-probe.sh and scripts/probe-plugin-cli.sh: not in the set
# `init --force` regenerates, and not a cli/templates/ file.
#
# Usage:
#   gate-worker-start-probe.sh [--work <base>]        run the seven legs below, in order
#   gate-worker-start-probe.sh judge <leg> <records>  re-grade one leg from <records> alone; print its summary line
#   gate-worker-start-probe.sh --help
# Issue it from the checkout root as one plain foreground command with no `$` in it, so the
# script-allowlist guard permits it.
#
# WORK AREA. <base> defaults to <root>/<state_dir>/scratch, <root> placed by `hr_script_root` and
# <state_dir> by `hr_state_dir` (scripts/lib/harness-run-lib.sh). One fresh `mktemp -d
# "<base>/gwsp.XXXXXX"` directory holds `records/` and the fixture `repo/`; it, and nothing else, is
# removed on every exit path (EXIT, INT, TERM, HUP). A <base> that is absent or cannot hold it is a
# refusal: exit 2, nothing created.
#
# LEGS. Each prints its records whole under `== gwsp: <leg> ==`, then one line
# `gwsp: <leg>: <verdict> — <evidence>`, newlines in quoted text written as a literal `\n`.
#   env          info. `claude --version`, `uname -sr`, `sw_vers -productVersion` where present,
#                $BASH_VERSION, the date.
#   sandbox      sandboxed | unsandboxed | not run. Writes $HOME/.gwsp-sandbox-check.<pid>, graded on
#                disk; removed at once when present. Residual: a profile that grants $HOME reads unsandboxed.
#   nohup        pass | fail | not run. `nohup true` beside `( trap '' HUP; exec true )`, in the call.
#                fail: nohup non-zero while the control exits 0; pass: both 0.
#   detach       pass | fail | not run. A detached (`&`, `disown`) `nohup bash -c` arm beside a detached
#                `( trap '' HUP; exec bash -c )` arm, each writing a marker; waits at most 10 s.
#                fail: only the trap arm wrote; pass: both wrote.
#   launch-line  pass | fail | not run. Builds the fixture, does the run form's lane setup (lane computed
#                by the fixture's copied library, `mkdir -p`, `rm -f` of gwsp_launch.{verdict,verdict.tmp,
#                commit,commit.tmp,running,start}), then issues the run form's pre-fix launch line with
#                stderr to a record, and waits at most 15 s for gwsp_launch.verdict. pass: verdict on
#                disk; fail: none. A setup command that fails is `not run`, never `fail`.
#   run-form     pass | fail | not run. `bash <fixture>/scripts/run-test-suite.sh gwsp_run`; on `pending`,
#                `--wait gwsp_run` with RUN_TEST_SUITE_WAIT_SLICE=10 at most 3 times (a departure from the
#                shipped 60 s slice, to stay inside one foreground call). pass: pending, then pass;
#                fail: exit 2 with `the detached run of gwsp_run did not start`. Records
#                gwsp_run.start when present (only once the fix has landed).
#   tmpdir       pass | fail. $TMPDIR, its `pwd -P` form, `mktemp "${TMPDIR:-/tmp}/gwsp.XXXXXX"` and a
#                bare `mktemp -d`, each graded on disk and removed. fail: either created nothing.
#
# FIXTURE (<work>/repo): a hand-laid .git (HEAD on refs/heads/gwsp-probe, empty objects/ and refs/, no
# commit) that `git rev-parse --show-toplevel` must place at <work>/repo itself, a
# devscene.config.json (stateDir devscene, scriptsDir scripts, one catch-all layer, commands.typecheck
# `<none>`, commands.test `true`), and copies of this checkout's cli/templates/scripts/run-test-suite.sh
# and cli/templates/scripts/lib/harness-run-lib.sh. This checkout's own scripts/run-test-suite.sh never runs.
#
# RECORDS, one file each, read by `judge` and nothing else (<x>.status holds a decimal status;
# <x>.ondisk holds `present` or `absent`):
#   sandbox      sandbox.write.{target,status,stderr} sandbox.ondisk
#   nohup        nohup.nohup.{status,stderr} nohup.control.{status,stderr}
#   detach       detach.nohup.stderr detach.trap.stderr; markers detach.nohup.marker detach.trap.marker
#   launch-line  launch-line.setup.{status,stderr,command,stdout} (stdout: the lane directory; command:
#                the failing setup command) launch-line.lane.pre-listing launch-line.lane.listing
#                launch-line.lane.names launch-line.launch.stderr launch-line.ondisk.running
#                launch-line.ondisk.verdict
#   run-form     run-form.run.{status,stdout,stderr} run-form.wait<1-3>.{status,stdout,stderr}
#                run-form.lane.listing run-form.lane.names run-form.ondisk.start run-form.start
#   tmpdir       tmpdir.value.stdout tmpdir.canonical.{status,stdout,stderr} tmpdir.file.{status,stdout,
#                stderr} tmpdir.file.ondisk tmpdir.dir.{status,stdout,stderr} tmpdir.dir.ondisk
# A record a grade needs and does not find grades `not run` (`fail` for tmpdir), naming it.
#
# Exit: 0 every leg printed a summary line, whatever the verdicts · 1 usage · 2 a refusal before any
#       leg ran, nothing created · 5 teardown could not remove something, named on stderr.
#
# Standalone, which .claude/context/conventions.md → `## Not determined` leaves open: `set -u` and no
# `-e`, because a leg's failing command is a reading to print and teardown must still run. Bash 3.2 floor.
# Every temp path the probe uses names an explicit XXXXXX template, but one: the tmpdir leg's bare
# `mktemp -d` is a measurement, not a path the probe uses. It reproduces the default-template call
# behind the prompt's `mktemp: mkdtemp failed on /var/folders/…/T/…` symptom; keep it bare.
#
# REPRO, by hand from a terminal (unsandboxed) or a session's call (sandboxed):
#   sandbox      printf x > "$HOME/.gwsp-sandbox-check.1"; ls "$HOME/.gwsp-sandbox-check.1"
#                listed: unsandboxed (then rm it); refused and not listed: sandboxed
#   nohup        nohup true </dev/null >/dev/null; echo $?            non-zero here, and 0 from
#                ( trap '' HUP; exec true ) </dev/null >/dev/null; echo $?   reads fail; both 0 reads pass
#   detach       nohup bash -c 'echo > m1' </dev/null >/dev/null 2>e1 & disown
#                ( trap '' HUP; exec bash -c 'echo > m2' ) </dev/null >/dev/null 2>e2 & disown
#                only m2 written: fail; both: pass
#   launch-line  the unsandboxed control, `bash scripts/gate-worker-start-probe.sh` from a terminal, is
#                expected to read `launch-line: pass`
#   any leg      plant its records in an empty directory <d> and run
#                bash scripts/gate-worker-start-probe.sh judge <leg> <d>; e.g. nohup.nohup.status 1 and
#                nohup.control.status 0 read `fail`; an empty <d> reads `not run` (tmpdir: `fail`)
set -u

GWSP_LEGS="env sandbox nohup detach launch-line run-form tmpdir"
GWSP_JUDGE_LEGS="sandbox nohup detach launch-line run-form tmpdir"
GWSP_EXIT=0
GWSP_WORK=""
GWSP_BASE=""

usage() {
  cat <<'EOF'
Usage: gate-worker-start-probe.sh [--work <base>]
       gate-worker-start-probe.sh judge <leg> <records dir>
       gate-worker-start-probe.sh --help

  --work <base>   create the one gwsp.XXXXXX work directory under <base>
                  (default <root>/<state_dir>/scratch)
  judge           re-grade <leg> (sandbox, nohup, detach, launch-line, run-form, tmpdir)
                  from <records dir> alone and print its summary line

Exit: 0 every leg printed a summary line; 1 usage; 2 refusal, nothing created;
5 teardown could not remove something.
EOF
}

usage_error() {
  echo "gate-worker-start-probe: $*" >&2
  usage >&2
  GWSP_EXIT=1
  exit 1
}

# The EXIT trap exits with GWSP_EXIT, so every exit path sets it first.
refuse() {
  echo "gate-worker-start-probe: $*" >&2
  GWSP_EXIT=2
  exit 2
}

teardown_fail() {
  echo "gate-worker-start-probe: teardown could not remove '$1'" >&2
  GWSP_EXIT=5
}

# ---------------------------------------------------------------------------
# Record readers, shared by the live run and `judge`.

# rd <dir> <name> — print the record's content, trailing newline stripped; status 1 when absent.
rd() {
  [ -f "$1/$2" ] || return 1
  local v
  v="$(cat "$1/$2" 2>/dev/null)" || return 1
  printf '%s' "$v"
}

# flat <text> — one line: each newline written as a literal `\n`; `(empty)` for nothing.
flat() {
  local t="${1-}"
  [ -n "$t" ] || { printf '(empty)'; return 0; }
  printf '%s' "${t//$'\n'/\\n}"
}

# q <dir> <name> — the record flattened, or `(no record <name>)`.
q() {
  local v
  if v="$(rd "$1" "$2")"; then flat "$v"; else printf '(no record %s)' "$2"; fi
}

is_status() {
  case "${1-}" in '' | *[!0-9]*) return 1 ;; esac
  return 0
}

line() {
  printf 'gwsp: %s: %s — %s\n' "$1" "$2" "$3"
}

# ---------------------------------------------------------------------------
# Grading, one function per leg, each reading only <dir>.

grade_sandbox() {
  local d="$1" on st
  on="$(rd "$d" sandbox.ondisk)" || { line sandbox "not run" "no record sandbox.ondisk: $(q "$d" sandbox.write.stderr)"; return; }
  st="$(q "$d" sandbox.write.status)"
  case "$on" in
    present) line sandbox unsandboxed "the write to $(q "$d" sandbox.write.target) reached the disk (status $st)" ;;
    absent) line sandbox sandboxed "the write to $(q "$d" sandbox.write.target) did not reach the disk (status $st): $(q "$d" sandbox.write.stderr)" ;;
    *) line sandbox "not run" "sandbox.ondisk holds '$(flat "$on")'" ;;
  esac
}

grade_nohup() {
  local d="$1" n c ev
  n="$(rd "$d" nohup.nohup.status)"
  c="$(rd "$d" nohup.control.status)"
  ev="nohup true exited $(q "$d" nohup.nohup.status), stderr: $(q "$d" nohup.nohup.stderr); trap '' HUP control exited $(q "$d" nohup.control.status), stderr: $(q "$d" nohup.control.stderr)"
  if is_status "$n" && is_status "$c"; then
    if [ "$n" -ne 0 ] && [ "$c" -eq 0 ]; then line nohup fail "$ev"; return; fi
    if [ "$n" -eq 0 ] && [ "$c" -eq 0 ]; then line nohup pass "$ev"; return; fi
  fi
  line nohup "not run" "$ev"
}

grade_detach() {
  local d="$1" n=0 t=0 ev
  [ -f "$d/detach.nohup.marker" ] && n=1
  [ -f "$d/detach.trap.marker" ] && t=1
  ev="nohup arm $([ $n -eq 1 ] && echo started || echo 'not started'), stderr: $(q "$d" detach.nohup.stderr); trap arm $([ $t -eq 1 ] && echo started || echo 'not started'), stderr: $(q "$d" detach.trap.stderr)"
  if [ $n -eq 0 ] && [ $t -eq 1 ]; then line detach fail "$ev"
  elif [ $n -eq 1 ] && [ $t -eq 1 ]; then line detach pass "$ev"
  else line detach "not run" "$ev"
  fi
}

grade_launch_line() {
  local d="$1" st v r ev
  st="$(rd "$d" launch-line.setup.status)" || { line launch-line "not run" "no record launch-line.setup.status"; return; }
  if ! is_status "$st" || [ "$st" -ne 0 ]; then
    line launch-line "not run" "setup command '$(q "$d" launch-line.setup.command)' exited $(flat "$st"): $(q "$d" launch-line.setup.stderr)"
    return
  fi
  v="$(rd "$d" launch-line.ondisk.verdict)" || { line launch-line "not run" "no record launch-line.ondisk.verdict"; return; }
  r="$(q "$d" launch-line.ondisk.running)"
  ev="lane $(q "$d" launch-line.setup.stdout) listed: $(q "$d" launch-line.lane.names); gwsp_launch.running $r, gwsp_launch.verdict $(flat "$v"); launch stderr: $(q "$d" launch-line.launch.stderr)"
  case "$v" in
    present) line launch-line pass "$ev" ;;
    absent) line launch-line fail "$ev" ;;
    *) line launch-line "not run" "$ev" ;;
  esac
}

grade_run_form() {
  local d="$1" st out err i ws wo ev
  st="$(rd "$d" run-form.run.status)" || { line run-form "not run" "no record run-form.run.status"; return; }
  out="$(rd "$d" run-form.run.stdout)"
  err="$(rd "$d" run-form.run.stderr)"
  ev="run form exited $(flat "$st"), stdout: $(q "$d" run-form.run.stdout), stderr: $(q "$d" run-form.run.stderr)"
  if [ "$st" = 2 ]; then
    case "$err" in
      *"the detached run of gwsp_run did not start"*)
        line run-form fail "$ev; lane listed: $(q "$d" run-form.lane.names); gwsp_run.start $(q "$d" run-form.ondisk.start): $(q "$d" run-form.start)"
        return
        ;;
    esac
  fi
  if [ "$st" = 3 ] && [ "$out" = pending ]; then
    for i in 1 2 3; do
      ws="$(rd "$d" "run-form.wait$i.status")" || break
      wo="$(rd "$d" "run-form.wait$i.stdout")"
      ev="$ev; wait $i exited $(flat "$ws"), stdout: $(q "$d" "run-form.wait$i.stdout"), stderr: $(q "$d" "run-form.wait$i.stderr")"
      if [ "$ws" = 0 ] && [ "$wo" = pass ]; then line run-form pass "$ev"; return; fi
    done
  fi
  line run-form "not run" "$ev; lane listed: $(q "$d" run-form.lane.names)"
}

grade_tmpdir() {
  local d="$1" f g ev
  f="$(rd "$d" tmpdir.file.ondisk)"
  g="$(rd "$d" tmpdir.dir.ondisk)"
  ev="TMPDIR $(q "$d" tmpdir.value.stdout) (pwd -P: $(q "$d" tmpdir.canonical.stdout)); mktemp template exited $(q "$d" tmpdir.file.status), created $(q "$d" tmpdir.file.stdout) $(q "$d" tmpdir.file.ondisk), stderr: $(q "$d" tmpdir.file.stderr); bare mktemp -d exited $(q "$d" tmpdir.dir.status), created $(q "$d" tmpdir.dir.stdout) $(q "$d" tmpdir.dir.ondisk), stderr: $(q "$d" tmpdir.dir.stderr)"
  if [ "$f" = present ] && [ "$g" = present ]; then line tmpdir pass "$ev"; else line tmpdir fail "$ev"; fi
}

grade() {
  case "$1" in
    sandbox) grade_sandbox "$2" ;;
    nohup) grade_nohup "$2" ;;
    detach) grade_detach "$2" ;;
    launch-line) grade_launch_line "$2" ;;
    run-form) grade_run_form "$2" ;;
    tmpdir) grade_tmpdir "$2" ;;
  esac
}

# ---------------------------------------------------------------------------
# The live run.

# rec <name> <cmd>... — run <cmd> with stdin from /dev/null into <name>.{stdout,stderr,status}.
rec() {
  local n="$1"
  shift
  "$@" </dev/null >"$R/$n.stdout" 2>"$R/$n.stderr"
  printf '%s\n' "$?" >"$R/$n.status"
}

ondisk() {
  if [ -e "$2" ]; then echo present >"$R/$1"; else echo absent >"$R/$1"; fi
}

show_records() {
  local f
  for f in "$R/$1".*; do
    [ -e "$f" ] || continue
    printf -- '-- %s:\n' "${f##*/}"
    if [ -s "$f" ]; then
      cat "$f"
      [ -z "$(tail -c 1 "$f")" ] || echo
    else
      echo '(empty)'
    fi
  done
}

leg_env() {
  local v
  if command -v claude >/dev/null 2>&1; then
    rec env.claude claude --version
  else
    echo 'not found' >"$R/env.claude.stdout"
  fi
  rec env.uname uname -sr
  if command -v sw_vers >/dev/null 2>&1; then rec env.sw_vers sw_vers -productVersion; fi
  printf '%s\n' "${BASH_VERSION-}" >"$R/env.bash.stdout"
  rec env.date date -u '+%Y-%m-%dT%H:%M:%SZ'
  show_records env
  v="claude $(q "$R" env.claude.stdout); $(q "$R" env.uname.stdout)"
  [ -f "$R/env.sw_vers.stdout" ] && v="$v; macOS $(q "$R" env.sw_vers.stdout)"
  line env info "$v; bash $(q "$R" env.bash.stdout); $(q "$R" env.date.stdout)"
}

leg_sandbox() {
  local p
  if [ -z "${HOME-}" ]; then
    echo 'HOME is unset' >"$R/sandbox.write.stderr"
  else
    p="$HOME/.gwsp-sandbox-check.$$"
    printf '%s\n' "$p" >"$R/sandbox.write.target"
    if [ -e "$p" ]; then
      echo "'$p' already exists; not written, not removed" >"$R/sandbox.write.stderr"
    else
      (printf 'gwsp\n' >"$p") 2>"$R/sandbox.write.stderr"
      printf '%s\n' "$?" >"$R/sandbox.write.status"
      ondisk sandbox.ondisk "$p"
      if [ -e "$p" ]; then
        rm -f -- "$p"
        [ ! -e "$p" ] || teardown_fail "$p"
      fi
    fi
  fi
  show_records sandbox
  grade_sandbox "$R"
}

leg_nohup() {
  nohup true </dev/null >/dev/null 2>"$R/nohup.nohup.stderr"
  printf '%s\n' "$?" >"$R/nohup.nohup.status"
  (trap '' HUP; exec true) </dev/null >/dev/null 2>"$R/nohup.control.stderr"
  printf '%s\n' "$?" >"$R/nohup.control.status"
  show_records nohup
  grade_nohup "$R"
}

leg_detach() {
  local i
  # shellcheck disable=SC2016
  nohup bash -c 'printf "%s\n" started > "$1"' gwsp "$R/detach.nohup.marker" </dev/null >/dev/null 2>"$R/detach.nohup.stderr" &
  disown
  # shellcheck disable=SC2016
  (trap '' HUP; exec bash -c 'printf "%s\n" started > "$1"' gwsp "$R/detach.trap.marker") </dev/null >/dev/null 2>"$R/detach.trap.stderr" &
  disown
  for i in 1 2 3 4 5 6 7 8 9 10; do
    [ -f "$R/detach.nohup.marker" ] && [ -f "$R/detach.trap.marker" ] && break
    sleep 1
  done
  show_records detach
  grade_detach "$R"
}

write_config() {
  cat >"$FIX/devscene.config.json" <<'EOF'
{
  "version": 1,
  "defaultBranch": "main",
  "stateDir": "devscene",
  "scriptsDir": "scripts",
  "layers": [
    { "name": "general", "path": ".", "conventions": "CONVENTIONS.md" }
  ],
  "commands": {
    "typecheck": "<none>",
    "test": "true"
  }
}
EOF
}

write_head() {
  printf 'ref: refs/heads/gwsp-probe\n' >"$FIX/.git/HEAD"
}

# Without its own repository the fixture's root walk would land on this checkout and run its gates.
fixture_is_own_repo() {
  local top
  top="$(git -C "$FIX" rev-parse --show-toplevel)" || return 1
  [ "$top" = "$FIX" ] && return 0
  echo "git -C $FIX rev-parse --show-toplevel answered '$top'" >&2
  return 1
}

# lane_compute — in a subshell from the fixture root, the lane directory as the worker computes it,
# through the fixture's copied library. A failing command's text goes to fd 3.
lane_compute() {
  local sd br
  cd "$FIX" || { echo "cd $FIX" >&3; return 1; }
  # shellcheck source=/dev/null
  . scripts/lib/harness-run-lib.sh || { echo ". scripts/lib/harness-run-lib.sh" >&3; return 1; }
  sd="$(hr_state_dir "$FIX")" || { echo "hr_state_dir $FIX" >&3; return 1; }
  br="$(hr_current_branch "$FIX")"
  [ -n "$br" ] || { echo "hr_current_branch $FIX (printed nothing)" >&3; return 1; }
  hr_test_run_lane_dir "$sd" "$br" || { echo "hr_test_run_lane_dir $sd $br" >&3; return 1; }
}

# step <cmd>... — one setup command; on failure record it, its status and its stderr.
step() {
  "$@" </dev/null >/dev/null 2>"$R/launch-line.setup.stderr"
  local st=$?
  [ "$st" -eq 0 ] && return 0
  printf '%s\n' "$*" >"$R/launch-line.setup.command"
  printf '%s\n' "$st" >"$R/launch-line.setup.status"
  return 1
}

launch_setup() {
  local st f
  step mkdir "$FIX" || return 1
  # Not `git init`: the sandbox refuses its writes to .git/hooks and .git/config. HEAD, objects/ and
  # refs/ are all git needs to place a repository.
  step mkdir -p "$FIX/.git/objects" "$FIX/.git/refs/heads" || return 1
  step write_head || return 1
  step fixture_is_own_repo || return 1
  step write_config || return 1
  step mkdir -p "$FIX/scripts/lib" || return 1
  step cp "$ROOT/cli/templates/scripts/run-test-suite.sh" "$FIX/scripts/run-test-suite.sh" || return 1
  step cp "$ROOT/cli/templates/scripts/lib/harness-run-lib.sh" "$FIX/scripts/lib/harness-run-lib.sh" || return 1
  FIX_OK=1
  LANE="$( (lane_compute) 3>"$R/launch-line.setup.command" 2>"$R/launch-line.setup.stderr")"
  st=$?
  if [ "$st" -ne 0 ] || [ -z "$LANE" ]; then
    [ "$st" -ne 0 ] || st=1
    printf '%s\n' "$st" >"$R/launch-line.setup.status"
    LANE=""
    return 1
  fi
  printf '%s\n' "$LANE" >"$R/launch-line.setup.stdout"
  step mkdir -p "$FIX/$LANE" || return 1
  for f in verdict verdict.tmp commit commit.tmp running start; do
    step rm -f "$FIX/$LANE/gwsp_launch.$f" || return 1
  done
  : >"$R/launch-line.setup.command"
  echo 0 >"$R/launch-line.setup.status"
}

leg_launch_line() {
  local i lane_abs
  if launch_setup; then
    lane_abs="$FIX/$LANE"
    ls -la "$lane_abs" >"$R/launch-line.lane.pre-listing" 2>&1
    cd "$FIX" || true
    RUN_TEST_SUITE_WORKER=gwsp_launch nohup bash "$FIX/scripts/run-test-suite.sh" gwsp_launch </dev/null >/dev/null 2>"$R/launch-line.launch.stderr" &
    disown
    cd "$WORK" || true
    for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
      [ -f "$lane_abs/gwsp_launch.verdict" ] && break
      sleep 1
    done
    ls -la "$lane_abs" >"$R/launch-line.lane.listing" 2>&1
    ls -A "$lane_abs" >"$R/launch-line.lane.names" 2>&1
    ondisk launch-line.ondisk.running "$lane_abs/gwsp_launch.running"
    ondisk launch-line.ondisk.verdict "$lane_abs/gwsp_launch.verdict"
  fi
  show_records launch-line
  grade_launch_line "$R"
}

leg_run_form() {
  local i lane_abs
  if [ "$FIX_OK" = 1 ]; then
    rec run-form.run bash "$FIX/scripts/run-test-suite.sh" gwsp_run
    if [ "$(rd "$R" run-form.run.status)" = 3 ] && [ "$(rd "$R" run-form.run.stdout)" = pending ]; then
      for i in 1 2 3; do
        RUN_TEST_SUITE_WAIT_SLICE=10 rec "run-form.wait$i" bash "$FIX/scripts/run-test-suite.sh" --wait gwsp_run
        [ "$(rd "$R" "run-form.wait$i.status")" = 3 ] || break
      done
    fi
    if [ -n "$LANE" ]; then
      lane_abs="$FIX/$LANE"
      ls -la "$lane_abs" >"$R/run-form.lane.listing" 2>&1
      ls -A "$lane_abs" >"$R/run-form.lane.names" 2>&1
      ondisk run-form.ondisk.start "$lane_abs/gwsp_run.start"
      [ -f "$lane_abs/gwsp_run.start" ] && cp "$lane_abs/gwsp_run.start" "$R/run-form.start"
    fi
  fi
  show_records run-form
  grade_run_form "$R"
}

leg_tmpdir() {
  local f g
  printf '%s\n' "${TMPDIR-(unset)}" >"$R/tmpdir.value.stdout"
  if [ -n "${TMPDIR-}" ]; then
    rec tmpdir.canonical sh -c 'cd -P -- "$1" && pwd -P' gwsp "$TMPDIR"
  fi
  f="$(mktemp "${TMPDIR:-/tmp}/gwsp.XXXXXX" 2>"$R/tmpdir.file.stderr")"
  printf '%s\n' "$?" >"$R/tmpdir.file.status"
  printf '%s\n' "$f" >"$R/tmpdir.file.stdout"
  if [ -n "$f" ] && [ -f "$f" ]; then
    echo present >"$R/tmpdir.file.ondisk"
    rm -f -- "$f"
    [ ! -e "$f" ] || teardown_fail "$f"
  else
    echo absent >"$R/tmpdir.file.ondisk"
  fi
  # Bare on purpose: see the header.
  g="$(mktemp -d 2>"$R/tmpdir.dir.stderr")"
  printf '%s\n' "$?" >"$R/tmpdir.dir.status"
  printf '%s\n' "$g" >"$R/tmpdir.dir.stdout"
  if [ -n "$g" ] && [ -d "$g" ]; then
    echo present >"$R/tmpdir.dir.ondisk"
    rmdir -- "$g"
    [ ! -e "$g" ] || teardown_fail "$g"
  else
    echo absent >"$R/tmpdir.dir.ondisk"
  fi
  show_records tmpdir
  grade_tmpdir "$R"
}

teardown() {
  [ -n "$GWSP_WORK" ] || return 0
  cd "$GWSP_BASE" 2>/dev/null || cd / || true
  rm -rf -- "$GWSP_WORK" 2>/dev/null
  if [ -e "$GWSP_WORK" ]; then
    # A detached worker may still be writing into the fixture: one retry.
    sleep 1
    rm -rf -- "$GWSP_WORK" 2>/dev/null
  fi
  [ ! -e "$GWSP_WORK" ] || teardown_fail "$GWSP_WORK"
  GWSP_WORK=""
}

# ---------------------------------------------------------------------------
# Entry.

case "${1-}" in
  -h | --help)
    [ $# -eq 1 ] || usage_error "--help takes no argument"
    usage
    exit 0
    ;;
  judge)
    [ $# -eq 3 ] || usage_error "judge takes <leg> <records dir>"
    case " $GWSP_JUDGE_LEGS " in *" $2 "*) ;; *) usage_error "unknown leg '$2'" ;; esac
    [ -d "$3" ] || usage_error "'$3' is not a directory"
    grade "$2" "$3"
    exit 0
    ;;
esac

opt_work=""
while [ $# -gt 0 ]; do
  case "$1" in
    --work)
      [ $# -ge 2 ] && [ -n "$2" ] || usage_error "--work needs a non-empty <base>"
      [ -z "$opt_work" ] || usage_error "--work given twice"
      opt_work="$2"
      shift 2
      ;;
    *) usage_error "unknown argument '$1'" ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -r "$script_dir/lib/harness-run-lib.sh" ] || refuse "cannot read '$script_dir/lib/harness-run-lib.sh'"
# shellcheck source=lib/harness-run-lib.sh
. "$script_dir/lib/harness-run-lib.sh"
ROOT="$(hr_script_root "$script_dir")" || refuse "'$script_dir' is not inside a git repository"
if [ -n "$opt_work" ]; then
  base="$opt_work"
else
  state_dir="$(hr_state_dir "$ROOT")" || refuse "cannot resolve '$ROOT/devscene.config.json'"
  base="$ROOT/$state_dir/scratch"
fi
[ -d "$base" ] || refuse "work base '$base' is not a directory"
GWSP_BASE="$(cd -P -- "$base" && pwd -P)" || refuse "cannot enter work base '$base'"

trap 'teardown; exit "$GWSP_EXIT"' EXIT
trap 'GWSP_EXIT=129; exit 129' HUP
trap 'GWSP_EXIT=130; exit 130' INT
trap 'GWSP_EXIT=143; exit 143' TERM

GWSP_WORK="$(mktemp -d "$GWSP_BASE/gwsp.XXXXXX" 2>/dev/null)"
if [ -z "$GWSP_WORK" ] || [ ! -d "$GWSP_WORK" ]; then
  GWSP_WORK=""
  refuse "work base '$GWSP_BASE' cannot hold a gwsp.XXXXXX directory"
fi
WORK="$GWSP_WORK"
R="$WORK/records"
FIX="$WORK/repo"
FIX_OK=0
LANE=""
mkdir "$R" || refuse "cannot create '$R'"
cd "$WORK" || refuse "cannot enter '$WORK'"

for leg in $GWSP_LEGS; do
  echo "== gwsp: $leg =="
  "leg_${leg//-/_}"
done

exit 0
