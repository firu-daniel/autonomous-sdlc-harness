#!/usr/bin/env bash
# legs-refusal.sh — the sandbox probe's refusal leg (rows RF1, RF2, RF3), run only through
# `sandbox-probe.sh refusal`, whose preflight (SP_PREFLIGHT_PREREQ=absent) admits only a Linux host on
# which doctor's sandbox-prerequisites prints no PASS and `sp_prereq_cmd bwrap` or `sp_prereq_cmd socat`
# does not resolve:
#   RF1  Claude Code's own startup refusal under `failIfUnavailable: true`, quoted. One call on the run
#        profile; that call running at all is `fail`.
#   RF2  the watcher's launch-time prerequisite decision, taken as spawn's host check takes it
#        (scripts/autonomous-watcher.sh, "The sandbox preflight"): hr_sandbox_opted_out <main>, then
#        hr_sandbox_prereq_probe_var in the probe's own shell and PATH. Launches nothing; a passing probe
#        is `fail`.
#   RF3  CS8's invalid profile (sandbox.failIfUnavailable the string "true") on this host: recorded as
#        ignored (the helper's $HOME marker written), refused at startup, or started sandboxed and refused.
#
# NO POSITIVE CONTROL. There is no sandbox on this host to control for: RF1's call is the startup check
# itself, RF3's outcome is recorded whichever way it falls, and RF2 launches nothing. So no row goes
# through the control gate.
#
# THE GRADING FUNCTIONS read only their arguments, the stream and the stderr file, and set SP_VERDICT and
# SP_EVIDENCE:
#   sp__rf1_grade <stream> <stderr file> <agent exit status> <command>
#   sp__rf2_grade <status: 0 passes, 1 refuses, 3 opted out> <refusal> [<main>]
#   sp__rf3_grade <stream> <stderr file> <agent exit status> <command> <marker written: 1|0>
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

# sp__rf_startup_line <stream> <stderr file> — the stderr file's first non-empty line, else the first
# non-empty line of the stream's `result` event text, else `(no message)`.
sp__rf_startup_line() {
  local line text
  if [ -r "${2:-}" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      if [ -n "$line" ]; then
        printf '%s' "$line"
        return 0
      fi
    done <"$2"
  fi
  text="$(jq -n -R -r '[inputs | fromjson? | select(type == "object" and .type == "result")
    | .result? | select(type == "string")] | .[0] // empty' "${1:-}" 2>/dev/null)"
  while IFS= read -r line; do
    if [ -n "$line" ]; then
      printf '%s' "$line"
      return 0
    fi
  done <<<"$text"
  printf '%s' "(no message)"
}

# sp__rf_result_text <stream> — the first line of the stream's `result` event text, or `(no result text)`.
sp__rf_result_text() {
  local text
  text="$(jq -n -R -r '[inputs | fromjson? | select(type == "object" and .type == "result")
    | .result? | select(type == "string")] | .[0] // empty' "${1:-}" 2>/dev/null)"
  [ -n "$text" ] || text="(no result text)"
  printf '%s' "${text%%$'\n'*}"
}

sp__rf1_grade() {
  local stream="${1:-}" errf="${2:-}" rc="${3:-}" cmd="${4:-}"
  SP_LAYER=""
  sp__match_read "$stream" Bash command "$cmd"
  if [ "$SP__COUNT" -gt 0 ]; then
    if [ "$SP__STATUS" = none ]; then
      SP_VERDICT="not run"
      SP_EVIDENCE="the call was issued but has no tool_result$(sp__issued "$SP__COUNT")"
      return 0
    fi
    sp__layer "$SP__TEXT" command "$cmd" "$stream"
    if [ "$SP_LAYER" = permission ]; then
      SP_VERDICT="not run"
      SP_EVIDENCE="the call was refused at the permission layer, so it says nothing of the startup check: $SP_LAYER_EVIDENCE"
    else
      SP_VERDICT=fail
      SP_EVIDENCE="the session ran its call although failIfUnavailable is true and the sandbox cannot start: $(sp__first_line "$SP__TEXT")"
    fi
    return 0
  fi
  if [ "$rc" != 0 ]; then
    SP_VERDICT=pass
    SP_EVIDENCE="refused at startup (exit $rc): $(sp__rf_startup_line "$stream" "$errf")"
  else
    SP_VERDICT="not run"
    SP_EVIDENCE="no call issued and the agent CLI exited 0: $(sp__rf_result_text "$stream")"
  fi
}

sp__rf2_grade() {
  local st="${1:-}" refusal="${2:-}" main="${3:-<main>}"
  case "$st" in
    0)
      SP_VERDICT=fail
      SP_EVIDENCE="the watcher's prerequisite probe passes on a host lacking bwrap or socat" ;;
    1)
      case "$refusal" in
        *bwrap* | *socat*)
          SP_VERDICT=pass
          SP_EVIDENCE="the watcher would refuse the launch: $refusal" ;;
        *)
          SP_VERDICT="not run"
          SP_EVIDENCE="the watcher's prerequisite probe refused, naming neither bwrap nor socat: ${refusal:-(no refusal text)}" ;;
      esac ;;
    3)
      SP_VERDICT="not run"
      SP_EVIDENCE="sandbox.optOut is taken in $main's harness.config.json, so the watcher does not judge the host" ;;
    *)
      SP_VERDICT="not run"
      SP_EVIDENCE="the watcher's prerequisite probe returned status '$st': ${refusal:-(no refusal text)}" ;;
  esac
}

sp__rf3_grade() {
  local stream="${1:-}" errf="${2:-}" rc="${3:-}" cmd="${4:-}" written="${5:-0}"
  SP_LAYER=""
  if [ "$written" = 1 ]; then
    SP_VERDICT=pass
    SP_EVIDENCE="the invalid file was ignored: failIfUnavailable was never read, and the session ran unsandboxed with no startup refusal"
    return 0
  fi
  sp__match_read "$stream" Bash command "$cmd"
  if [ "$SP__COUNT" -eq 0 ]; then
    if [ "$rc" != 0 ]; then
      SP_VERDICT=pass
      SP_EVIDENCE="refused at startup (exit $rc): $(sp__rf_startup_line "$stream" "$errf")"
    else
      SP_VERDICT="not run"
      SP_EVIDENCE="no call issued, the marker absent, and the agent CLI exited 0: $(sp__rf_result_text "$stream")"
    fi
    return 0
  fi
  if [ "$SP__STATUS" = none ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the call was issued but has no tool_result$(sp__issued "$SP__COUNT")"
    return 0
  fi
  sp__layer "$SP__TEXT" command "$cmd" "$stream"
  case "$SP_LAYER" in
    sandbox)
      SP_VERDICT=pass
      SP_EVIDENCE="started sandboxed and refused the write: $SP_LAYER_EVIDENCE" ;;
    permission)
      SP_VERDICT="not run"
      SP_EVIDENCE="the call was refused at the permission layer, so it never reached the sandbox: $SP_LAYER_EVIDENCE" ;;
    *)
      SP_VERDICT="not run"
      SP_EVIDENCE="the call returned at the $SP_LAYER layer with the marker absent: $SP_LAYER_EVIDENCE" ;;
  esac
}

# sp__rf_lookups — `bwrap ...; socat ...`: whether each sp_prereq_cmd name resolves on this PATH, naming
# the seam's value where it differs from the real name the watcher's probe looks up.
sp__rf_lookups() {
  local name c what out=""
  for name in bwrap socat; do
    c="$(sp_prereq_cmd "$name")" || c="$name"
    what="$name"
    [ "$c" = "$name" ] || what="$name (looked up as $c)"
    if command -v "$c" >/dev/null 2>&1; then what="$what resolves"; else what="$what does not resolve"; fi
    out="${out:+$out, }$what"
  done
  printf '%s' "$out"
}

sp__rf1() {
  local target cmd pfile rc departure
  target="$SP_CLONE/sbx_rf1_ctl"
  if ! sp__ctl_literal clone "$SP_CLONE"; then
    sp_result_line refusal RF1 "not run" "the clone is not spellable as one literal word" ""
    return 0
  fi
  if [ -e "$target" ] || [ -L "$target" ]; then
    sp_result_line refusal RF1 "not run" "$target exists before the session; remove it and re-run" ""
    return 0
  fi
  sp_track "$target"
  cmd="$(sp_dd_cmd "$target")"
  pfile="$SP_TMP/refusal-rf1.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$cmd"
  sp_session refusal-rf1 "$SP_RUN_PROFILE" "$pfile" --allowed "$SP_DD_RULE"
  rc=$?
  departure="$(sp_departures)"
  rm -f -- "$target"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_result_line refusal RF1 "not run" "session refusal-rf1 did not launch; see $SP_TMP/refusal-rf1.stderr" "$departure"
    return 0
  fi
  sp__rf1_grade "$SP_STREAM" "$SP_TMP/refusal-rf1.stderr" "$rc" "$cmd"
  sp_result_line refusal RF1 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
}

sp__rf2() {
  local st=0 refusal=""
  if hr_sandbox_opted_out "$SP_MAIN"; then
    st=3
  elif ! hr_sandbox_prereq_probe_var; then
    st=1
    refusal="$HR_SANDBOX_REFUSAL"
  fi
  sp__rf2_grade "$st" "$refusal" "$SP_MAIN"
  sp_result_line refusal RF2 "$SP_VERDICT" "$SP_EVIDENCE; on this PATH: $(sp__rf_lookups)" ""
}

sp__rf3() {
  local bad helper hcmd marker pfile rc departure written=0
  helper="$SP_TMP/rf3-helper.sh"
  marker="$HOME/sbx_rf3_marker"
  if [ -e "$marker" ] || [ -L "$marker" ]; then
    sp_result_line refusal RF3 "not run" "$marker exists before the session; remove it and re-run" ""
    return 0
  fi
  if ! sp__ctl_literal marker "$marker" || ! sp__ctl_literal "temp area" "$SP_TMP"; then
    sp_result_line refusal RF3 "not run" "'$marker' or the temp area is not spellable as one literal word" ""
    return 0
  fi
  if ! bad="$(sp_scratch_profile sbx_rf3 '.sandbox.failIfUnavailable = "true"')"; then
    sp_result_line refusal RF3 "not run" "could not derive the invalid profile from '$SP_RUN_PROFILE'" ""
    return 0
  fi
  sp_track "$helper"
  sp_track "$marker"
  if ! printf '#!/usr/bin/env bash\nprintf %s >%s\n' "'sandbox probe RF3\\n'" "$marker" >"$helper" 2>/dev/null; then
    sp_result_line refusal RF3 "not run" "could not write the helper $helper" ""
    return 0
  fi
  hcmd="bash $helper"
  pfile="$SP_TMP/refusal-rf3.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$hcmd"
  sp_session refusal-rf3 "$bad" "$pfile" --allowed "Bash($hcmd)"
  rc=$?
  [ -e "$marker" ] && written=1
  rm -f -- "$marker"
  departure="--settings $bad (failIfUnavailable the string \"true\"); $(sp_departures)"
  if [ "$written" -ne 1 ] && { [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; }; then
    sp_result_line refusal RF3 "not run" "session refusal-rf3 did not launch; see $SP_TMP/refusal-rf3.stderr" "$departure"
    return 0
  fi
  sp__rf3_grade "$SP_STREAM" "$SP_TMP/refusal-rf3.stderr" "$rc" "$hcmd" "$written"
  sp_result_line refusal RF3 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
}

sp_leg_refusal() {
  sp__rf1
  sp__rf2
  sp__rf3
}
