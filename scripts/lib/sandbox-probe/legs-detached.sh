#!/usr/bin/env bash
# legs-detached.sh — the sandbox probe's detached leg (rows BG9, WF5), Linux only: the two liveness facts
# fix_run_gates_background_run_handling and fix_run_gates_wait_form_sandbox rest on
# (docs/sandbox-verification.md §5). The macOS baselines:
#   BG9  BG2's Linux counterpart: a process started with `nohup … </dev/null >/dev/null 2>&1 &` plus
#        `disown` inside one sandboxed call outlives the call and the session. BG2 ran its full 1524 s.
#   WF5  narrowed to its Linux question: hr_lane_mtime (scripts/lib/harness-run-lib.sh), called from a
#        sandboxed process, reads an advancing mtime through its GNU `stat -c %Y` arm, the one reached
#        when `stat -f %m` prints no integer. macOS answers through the `stat -f %m` arm.
#
# One session, `detached`, issues `bash <SP_TMP>/bg9-start.sh`, which detaches <SP_TMP>/bg9-worker.sh.
# The worker runs SP_BG9_SECONDS iterations of one `touch` and one `sleep 1`, and writes in the clone:
#   sbx_bg9.pid     its own $$, never signalled: on Linux it may be a PID-namespace number
#   sbx_bg9.beat    touched every iteration; its mtime, read from outside, is BG9's last beat
#   sbx_wf5.mtimes  `stat -f %m: <first line>`, then `mtime <n>` from hr_lane_mtime in iterations 2 and 5
#   sbx_bg9.done    written after the last iteration
# The probe polls from outside for sbx_bg9.done for at most SP_BG9_SECONDS + 10 seconds after the session.
# SP_BG9_SECONDS is 60, LB5's bound: BG9 can pass only when the session ends within about 59 s of the
# start call, and a longer session reads `not run`, never `pass` or `fail`.
# A detached run that dies with the session is a finding (`fail`) for a follow-up task prompt, never a
# probe change.
#
# THE GRADING FUNCTIONS read only their arguments, the stream and (sp__wf5_grade) the file, and set
# SP_VERDICT and SP_EVIDENCE:
#   sp__bg9_grade <stream> <start command> <session end epoch> <last beat epoch> <done: 1|0>
#   sp__wf5_grade <mtimes file>
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_BG9_SECONDS=60

sp__bg9_grade() {
  local stream="${1:-}" cmd="${2:-}" end="${3:-}" last="${4:-}" fin="${5:-}" delta
  sp_judge_call "$stream" ran "$cmd"
  if [ -z "$SP_LAYER" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the start call: $SP_EVIDENCE"
    return 0
  fi
  if [ "$SP_LAYER" = permission ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the start call was refused at the permission layer, so nothing was detached: $SP_LAYER_EVIDENCE"
    return 0
  fi
  if ! sp__line_with "$SP__TEXT" sbx_bg9_started >/dev/null; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the start call printed no sbx_bg9_started line: $SP_LAYER_EVIDENCE"
    return 0
  fi
  case "$end" in '' | *[!0-9]*) end="" ;; esac
  case "$last" in '' | *[!0-9]*) last="" ;; esac
  if [ -n "$end" ] && [ -n "$last" ]; then
    delta=$((last - end))
    if [ "$fin" = 1 ] && [ "$last" -gt "$end" ]; then
      SP_VERDICT=pass
      SP_EVIDENCE="outlived the call and the session: last beat ${delta}s after the session ended, the worker finished"
      return 0
    fi
    if [ "$fin" = 0 ] && [ "$last" -le $((end + 1)) ]; then
      SP_VERDICT=fail
      if [ "$last" -eq 0 ]; then
        SP_EVIDENCE="the detached process did not outlive the session: no beat was written, no done marker"
      else
        SP_EVIDENCE="the detached process did not outlive the session: last beat ${delta}s after it ended, no done marker"
      fi
      return 0
    fi
  fi
  SP_VERDICT="not run"
  SP_EVIDENCE="neither outlived nor died with the session: session end '${3:-}', last beat '${4:-}', done '${5:-}'"
  return 0
}

sp__wf5_grade() {
  local file="${1:-}" line raw="" a="" b="" n=0
  if [ ! -f "$file" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the worker did not reach the hr_lane_mtime calls: no $file"
    return 0
  fi
  while IFS= read -r line; do
    case "$line" in
      "stat -f %m: "*) [ -n "$raw" ] || raw="${line#stat -f %m: }" ;;
      "mtime "*)
        n=$((n + 1))
        if [ "$n" -eq 1 ]; then a="${line#mtime }"; elif [ "$n" -eq 2 ]; then b="${line#mtime }"; fi
        ;;
    esac
  done <"$file"
  if [ "$n" -lt 2 ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the worker did not reach the hr_lane_mtime calls: $n mtime line(s) in $file"
    return 0
  fi
  case "$a" in '' | *[!0-9]*) n=0 ;; esac
  case "$b" in '' | *[!0-9]*) n=0 ;; esac
  if [ "$n" -eq 0 ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="hr_lane_mtime printed no integer: '$a', then '$b' (the worker may not have sourced the run library)"
    return 0
  fi
  if [ "$a" -eq 0 ] || [ "$b" -eq 0 ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="neither stat arm answered: hr_lane_mtime printed $a, then $b"
    return 0
  fi
  if [ "$b" -le "$a" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="hr_lane_mtime did not advance: $a, then $b"
    return 0
  fi
  case "$raw" in
    *[0-9]*)
      case "$raw" in
        *[!0-9]*) ;;
        *)
          SP_VERDICT="not run"
          SP_EVIDENCE="hr_lane_mtime advanced $a..$b, but stat -f %m gave '$raw', so the BSD arm answered and the GNU stat -c %Y arm was not reached"
          return 0
          ;;
      esac
      ;;
  esac
  SP_VERDICT=pass
  SP_EVIDENCE="hr_lane_mtime advanced $a..$b in a sandboxed process (stat -f %m gave '$raw', so the GNU stat -c %Y arm answered)"
  return 0
}

# sp__bg9_helpers <worker> <start> <clone> <run library> — write both helpers, every path a literal.
sp__bg9_helpers() {
  {
    printf '%s\n' '#!/usr/bin/env bash' \
      '# Written by scripts/lib/sandbox-probe/legs-detached.sh for one session, then removed.'
    printf 'clone=%q\nlib=%q\nn=%q\n' "$3" "$4" "$SP_BG9_SECONDS"
    cat <<'EOF'
printf '%s\n' "$$" >"$clone/sbx_bg9.pid"
i=1
while [ "$i" -le "$n" ]; do
  touch "$clone/sbx_bg9.beat"
  if [ "$i" -eq 2 ] || [ "$i" -eq 5 ]; then
    if [ "$i" -eq 2 ]; then
      raw="$(stat -f %m "$clone/sbx_bg9.beat" 2>/dev/null)"
      printf 'stat -f %%m: %s\n' "${raw%%$'\n'*}" >>"$clone/sbx_wf5.mtimes"
    fi
    . "$lib"
    printf 'mtime %s\n' "$(hr_lane_mtime "$clone/sbx_bg9.beat")" >>"$clone/sbx_wf5.mtimes"
  fi
  sleep 1
  i=$((i + 1))
done
: >"$clone/sbx_bg9.done"
EOF
  } >"$1" 2>/dev/null || return 1
  {
    printf '%s\n' '#!/usr/bin/env bash' \
      '# Written by scripts/lib/sandbox-probe/legs-detached.sh for one session, then removed.'
    printf 'nohup bash %q </dev/null >/dev/null 2>&1 &\n' "$1"
    printf '%s\n' 'disown' "printf 'sbx_bg9_started\\n'" 'exit 0'
  } >"$2" 2>/dev/null
}

# sp__bg9_both <evidence> — BG9 and WF5 `not run`, with no session.
sp__bg9_both() {
  sp_result_line detached BG9 "not run" "$1" ""
  sp_result_line detached WF5 "not run" "$1" ""
}

sp_leg_detached() {
  local scripts_rel lib worker="$SP_TMP/bg9-worker.sh" start="$SP_TMP/bg9-start.sh" scmd pfile p
  local pidf="$SP_CLONE/sbx_bg9.pid" beat="$SP_CLONE/sbx_bg9.beat" donef="$SP_CLONE/sbx_bg9.done"
  local mtimes="$SP_CLONE/sbx_wf5.mtimes" ctl="$SP_CLONE/sbx_bg9_ctl" end last fin=0 i=0 pid departure
  if ! scripts_rel="$(hr_scripts_dir "$SP_CLONE")" || [ -z "$scripts_rel" ]; then
    sp__bg9_both "cannot resolve scriptsDir from '$SP_CLONE/harness.config.json'"
    return 0
  fi
  lib="$SP_CLONE/$scripts_rel/lib/harness-run-lib.sh"
  if ! sp__ctl_literal clone "$SP_CLONE" || ! sp__ctl_literal "temp area" "$SP_TMP" ||
    ! sp__ctl_literal "run library" "$lib"; then
    sp__bg9_both "the clone, the temp area or the clone's run library is not spellable as one literal word"
    return 0
  fi
  for p in "$pidf" "$beat" "$donef" "$mtimes" "$ctl"; do
    if [ -e "$p" ] || [ -L "$p" ]; then
      sp__bg9_both "'$p' exists before the session; the probe removes only what it created, so remove it and re-run"
      return 0
    fi
  done
  sp_track "$worker"
  sp_track "$start"
  if ! sp__bg9_helpers "$worker" "$start" "$SP_CLONE" "$lib"; then
    sp__bg9_both "could not write the helpers $worker and $start"
    return 0
  fi
  for p in "$pidf" "$beat" "$donef" "$mtimes"; do
    sp_track "$p"
  done

  scmd="bash $start"
  sp_ctl_prepare bg9
  pfile="$SP_TMP/detached.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$scmd"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl")" "$ctl"

  sp_session detached "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" \
    --allowed "Bash($scmd)" --allowed "$SP_DD_RULE"
  end="$(date +%s)"
  departure="$(sp_departures)"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session detached did not launch; see $SP_TMP/detached.stderr"
    sp__bg9_both "session detached did not launch; see $SP_TMP/detached.stderr"
    return 0
  fi
  while [ ! -e "$donef" ] && [ "$i" -lt $((SP_BG9_SECONDS + 10)) ]; do
    sleep 1
    i=$((i + 1))
  done
  [ -e "$donef" ] && fin=1
  last="$(hr_lane_mtime "$beat")"
  pid=""
  [ -f "$pidf" ] && IFS= read -r pid <"$pidf"
  sp_ctl_held "$SP_STREAM"
  if [ -f "$mtimes" ] && cp -p -- "$mtimes" "$SP_TMP/detached.wf5.mtimes" 2>/dev/null; then
    sp_keep_file "$SP_TMP/detached.wf5.mtimes"
  fi

  sp__bg9_grade "$SP_STREAM" "$scmd" "$end" "$last" "$fin"
  sp_row_result --direct detached BG9 "$SP_VERDICT" "worker pid ${pid:-none}: $SP_EVIDENCE" "$departure"
  sp__wf5_grade "$mtimes"
  sp_row_result detached WF5 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"

  # The clone is shared with later legs: what this leg's worker and control wrote goes now.
  for p in "$pidf" "$beat" "$donef" "$mtimes" "$ctl"; do
    [ -f "$p" ] && [ ! -L "$p" ] && rm -f -- "$p"
  done
  return 0
}
