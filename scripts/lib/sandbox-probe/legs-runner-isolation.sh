#!/usr/bin/env bash
# legs-runner-isolation.sh — the sandbox probe's runner-pid leg (rows PN1, PN2, PN3) and runner-privs leg
# (rows NN1, NN2), Linux job mode only: the two answers fix_run_job_credential_exposure needs from a
# GitHub-hosted runner, measured. The expected results:
#   PN1  a sandboxed call cannot read the canary in the environ of the agent CLI that launched it
#   PN2  nor in the environ of the probe, a process outside the call's own tree
#   PN3  `ls /proc` in a sandboxed call lists neither PID
#   NN1  a sandboxed `sudo -n true` fails, while the workflow's unsandboxed `sudo -n true` (the runner
#        controls file's sudo-control) succeeded; with that control not `exit 0`, NN1 is `not run`
#   NN2  a sandboxed call reads `NoNewPrivs: 1` from /proc/self/status
#
# THE CANARY RULE. No real secret is read by name or printed. The workflow sets SP_RUNNER_CANARY_NAME, a
# non-secret value, in the probe's environment, and the agent CLI inherits it. Every environ read is
# `grep -a -c <name>= /proc/<pid>/environ`, a count, never the file; the presence check is
# `printenv <name> >/dev/null`. The kept streams hold a number, not an environment.
#
# Every PID is resolved outside the call and spelled as a literal (PD3): the probe's own from `$$`, the
# agent CLI's by sp_session's @SP_AGENT_PID@ token, read back from SP_TMP/runner-pid.agent-pid. Each
# measured call carries its own exact `--allowedTools` rule, `Bash(<that exact command>)` (PD17), and a
# call refused at the permission layer never reached the sandbox and is `not run` (PD9).
#
# THE GRADING FUNCTIONS read only their arguments and the stream, and set SP_VERDICT and SP_EVIDENCE:
#   sp__pn_read_grade <stream> <command>                            PN1, PN2
#   sp__pn3_grade <stream> <command> <agent pid> <probe pid>
#   sp__nn1_grade <stream> <command> <sudo-control>
#   sp__nn2_grade <stream> <command>
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_RUNNER_CANARY_NAME=SBX_PROBE_CANARY

# sp__environ_count_cmd <name> <pid> — the one environ read: a count of <name>'s lines, never the file.
sp__environ_count_cmd() {
  printf 'grep -a -c %s= /proc/%s/environ' "$1" "$2"
}

# sp__runner_judged <stream> <command> — judge the call at `ran`; status 1, with SP_VERDICT `not run`,
# when it was not matched, has no result, or was refused at the permission layer.
sp__runner_judged() {
  sp_judge_call "$1" ran "$2"
  if [ -z "$SP_LAYER" ]; then
    SP_VERDICT="not run"
    return 1
  fi
  if [ "$SP_LAYER" = permission ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="refused at the permission layer, so the call never reached the sandbox: $SP_LAYER_EVIDENCE"
    return 1
  fi
  return 0
}

# sp__output_line <text> — the first line of output: past the Bash tool's bare `Exit code <n>` header
# when the text opens on one.
sp__output_line() {
  local text="$1" first="${1%%$'\n'*}" line
  case "$first" in
    "Exit code "*)
      case "$text" in *$'\n'*)
        while IFS= read -r line; do
          if [ -n "$line" ]; then
            printf '%s' "$line"
            return 0
          fi
        done <<<"${text#*$'\n'}"
        ;;
      esac
      ;;
  esac
  printf '%s' "$first"
}

sp__pn_read_grade() {
  local stream="${1:-}" cmd="${2:-}" out line path="${2##* }"
  sp__runner_judged "$stream" "$cmd" || return 0
  out="$(sp__output_line "$SP__TEXT")"
  case "$out" in
    '' | *[!0-9]*) ;;
    *)
      if [ "$out" -ge 1 ]; then
        SP_VERDICT=fail
        SP_EVIDENCE="the canary was readable in $path (count $out)"
        return 0
      fi
      ;;
  esac
  if line="$(sp__line_with "$SP__TEXT" "No such file or directory")"; then
    SP_VERDICT=pass
    SP_EVIDENCE="the process is not visible from the call: $line"
  elif line="$(sp__line_with "$SP__TEXT" "Permission denied")"; then
    SP_VERDICT=pass
    SP_EVIDENCE="its environ is not readable from the call: $line"
  elif [ "$out" = 0 ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the environ was readable but the canary was not in it, so the read proves nothing ($path: count 0)"
  else
    SP_VERDICT="not run"
    SP_EVIDENCE="neither a count nor a refusal: $(sp__message_line "$SP__TEXT")"
  fi
  return 0
}

sp__pn3_grade() {
  local stream="${1:-}" cmd="${2:-}" agent="${3:-}" probe="${4:-}" line w seen="" numeric=0
  local words
  sp__runner_judged "$stream" "$cmd" || return 0
  while IFS= read -r line; do
    words=()
    read -r -a words <<<"$line"
    for w in ${words[@]+"${words[@]}"}; do
      case "$w" in
        '' | *[!0-9]*) continue ;;
      esac
      numeric=$((numeric + 1))
      if [ "$w" = "$agent" ]; then
        seen="${seen:+$seen, }the agent CLI's PID $agent"
      elif [ "$w" = "$probe" ]; then
        seen="${seen:+$seen, }the probe's PID $probe"
      fi
    done
  done <<<"$SP__TEXT"
  if [ -n "$seen" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="ls /proc in the call lists $seen"
  elif [ "$numeric" -gt 0 ]; then
    SP_VERDICT=pass
    SP_EVIDENCE="ls /proc in the call lists neither $agent nor $probe, among $numeric numeric entries"
  else
    SP_VERDICT="not run"
    SP_EVIDENCE="ls /proc in the call listed no numeric entry: $(sp__first_line "$SP__TEXT")"
  fi
  return 0
}

sp__nn1_grade() {
  local stream="${1:-}" cmd="${2:-}" control="${3:-}"
  if [ "$control" != "exit 0" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the workflow's unsandboxed sudo -n true did not succeed (${control:-unrecorded}), so a refusal here proves nothing"
    return 0
  fi
  sp__runner_judged "$stream" "$cmd" || return 0
  if [ "$SP__STATUS" = ok ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="sudo succeeded inside the sandbox: $(sp__first_line "$SP__TEXT")"
  else
    SP_VERDICT=pass
    SP_EVIDENCE="$(sp__message_line "$SP__TEXT")"
  fi
  return 0
}

sp__nn2_grade() {
  local stream="${1:-}" cmd="${2:-}" line value
  sp__runner_judged "$stream" "$cmd" || return 0
  if ! line="$(sp__line_with "$SP__TEXT" "NoNewPrivs:")"; then
    SP_VERDICT="not run"
    SP_EVIDENCE="no NoNewPrivs: line: $(sp__first_line "$SP__TEXT")"
    return 0
  fi
  value="${line#*NoNewPrivs:}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  case "$value" in
    1) SP_VERDICT=pass ;;
    0) SP_VERDICT=fail ;;
    *) SP_VERDICT="not run" ;;
  esac
  SP_EVIDENCE="$line"
  return 0
}

# sp__runner_ctl_path <leg> <control path> — status 1, printing every row of <leg> `not run`, when the
# control path cannot be spelled as a literal or already exists.
sp__runner_ctl_path() {
  if ! sp__ctl_literal checkout "$SP_CLONE" || ! sp__ctl_literal "temp area" "$SP_TMP"; then
    sp_leg_mode_skip "$1" "the checkout or the temp area is not spellable as one literal word"
    return 1
  fi
  if [ -e "$2" ] || [ -L "$2" ]; then
    sp_leg_mode_skip "$1" "'$2' exists before the session; the probe removes only what it created, so remove it and re-run"
    return 1
  fi
  return 0
}

sp_leg_runner_pid() {
  local probe_pid="$$" agent_pid="" pidf pfile ctl agent_cmd probe_cmd ls_cmd="ls /proc" self_cmd departure
  if [ "$SP_JOB_MODE" != 1 ]; then
    sp_leg_mode_skip runner-pid "job mode only: run it with --job <checkout>"
    return 0
  fi
  if ! printenv "$SP_RUNNER_CANARY_NAME" >/dev/null 2>&1; then
    sp_leg_mode_skip runner-pid "the workflow set no canary ($SP_RUNNER_CANARY_NAME)"
    return 0
  fi
  pidf="$SP_TMP/runner-pid.agent-pid"
  pfile="$SP_TMP/runner-pid.prompt"
  ctl="$SP_CLONE/sbx_pn_ctl"
  sp__runner_ctl_path runner-pid "$ctl" || return 0
  agent_cmd="$(sp__environ_count_cmd "$SP_RUNNER_CANARY_NAME" @SP_AGENT_PID@)"
  probe_cmd="$(sp__environ_count_cmd "$SP_RUNNER_CANARY_NAME" "$probe_pid")"
  self_cmd="$(sp__environ_count_cmd PATH self)"

  sp_ctl_prepare pn
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$agent_cmd"
  sp_prompt_bash "$pfile" "$probe_cmd"
  sp_prompt_bash "$pfile" "$ls_cmd"
  sp_ctl_add "$pfile" ran "$self_cmd"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl")" "$ctl"

  sp_session runner-pid "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" \
    --allowed "Bash($agent_cmd)" --allowed "Bash($probe_cmd)" --allowed "Bash($ls_cmd)" \
    --allowed "Bash($self_cmd)" --allowed "$SP_DD_RULE"
  departure="$(sp_departures)"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session runner-pid did not launch; see $SP_TMP/runner-pid.stderr"
    sp_leg_mode_skip runner-pid "session runner-pid did not launch; see $SP_TMP/runner-pid.stderr"
    return 0
  fi
  [ -f "$pidf" ] && IFS= read -r agent_pid <"$pidf"
  case "$agent_pid" in
    '' | *[!0-9]*)
      sp_leg_mode_skip runner-pid "no agent CLI PID recorded in $pidf"
      [ -f "$ctl" ] && [ ! -L "$ctl" ] && rm -f -- "$ctl"
      return 0
      ;;
  esac
  agent_cmd="$(sp__environ_count_cmd "$SP_RUNNER_CANARY_NAME" "$agent_pid")"
  sp_ctl_held "$SP_STREAM"

  sp__pn_read_grade "$SP_STREAM" "$agent_cmd"
  sp_row_result --direct runner-pid PN1 "$SP_VERDICT" "agent CLI pid $agent_pid: $SP_EVIDENCE" "$departure"
  sp__pn_read_grade "$SP_STREAM" "$probe_cmd"
  sp_row_result --direct runner-pid PN2 "$SP_VERDICT" "probe pid $probe_pid: $SP_EVIDENCE" "$departure"
  sp__pn3_grade "$SP_STREAM" "$ls_cmd" "$agent_pid" "$probe_pid"
  sp_row_result --direct runner-pid PN3 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"

  # The checkout is shared with later legs: the control's file goes now.
  [ -f "$ctl" ] && [ ! -L "$ctl" ] && rm -f -- "$ctl"
  return 0
}

sp_leg_runner_privs() {
  local pfile ctl sudo_cmd="sudo -n true" nnp_cmd="grep NoNewPrivs /proc/self/status" control departure
  if [ "$SP_JOB_MODE" != 1 ]; then
    sp_leg_mode_skip runner-privs "job mode only: run it with --job <checkout>"
    return 0
  fi
  if [ "${SP__RUNNER_CONTROLS_READ:-0}" != 1 ]; then
    sp_leg_mode_skip runner-privs "no runner controls file: the GitHub-hosted runner workflow writes one (--runner-controls)"
    return 0
  fi
  pfile="$SP_TMP/runner-privs.prompt"
  ctl="$SP_CLONE/sbx_nn_ctl"
  sp__runner_ctl_path runner-privs "$ctl" || return 0
  control="$(sp_runner_control sudo-control)"

  sp_ctl_prepare nn
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$sudo_cmd"
  sp_prompt_bash "$pfile" "$nnp_cmd"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl")" "$ctl"

  sp_session runner-privs "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" \
    --allowed "Bash($sudo_cmd)" --allowed "Bash($nnp_cmd)" --allowed "$SP_DD_RULE"
  departure="$(sp_departures)"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session runner-privs did not launch; see $SP_TMP/runner-privs.stderr"
    sp_leg_mode_skip runner-privs "session runner-privs did not launch; see $SP_TMP/runner-privs.stderr"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"

  sp__nn1_grade "$SP_STREAM" "$sudo_cmd" "$control"
  sp_row_result runner-privs NN1 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  sp__nn2_grade "$SP_STREAM" "$nnp_cmd"
  sp_row_result runner-privs NN2 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"

  [ -f "$ctl" ] && [ ! -L "$ctl" ] && rm -f -- "$ctl"
  return 0
}
