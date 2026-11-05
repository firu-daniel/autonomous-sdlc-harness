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
# agent CLI's by sp_session's @SP_AGENT_PID@ token, substituted into sbx_pn_agent.sh through
# --token-file and read back from SP_TMP/runner-pid.agent-pid.
#
# EVERY /proc READ GOES THROUGH A FILE (PD31). In round 14, under `dontAsk`, every Bash call naming a
# /proc path was refused at the permission layer although its exact rule was in --allowedTools: "Permission
# to use Bash has been denied because Claude Code is running in don't ask mode". Each /proc read, its
# control included, is therefore one line in a file the probe writes into SP_CLONE before the session
# (sp__runner_scripts_write), issued as `bash <file>` under its own rule `Bash(bash <file>)` (PD17), so
# no command string the permission layer judges names /proc; the read still runs inside the sandboxed
# call. Whether a runner's permission layer allows this route is not yet measured. A call refused at the
# permission layer never reached the sandbox and is `not run` (PD9). NN1's `sudo -n true` and the `dd`
# control name no /proc path and are issued directly.
#
# THE GRADING FUNCTIONS read only their arguments and the stream, and set SP_VERDICT and SP_EVIDENCE.
# <proc path> is the /proc path the file reads, named in the evidence in place of the script path; absent,
# PN1/PN2 take it from the command's last word and NN2 names none.
#   sp__pn_read_grade <stream> <command> [<proc path>]              PN1, PN2
#   sp__pn3_grade <stream> <command> <agent pid> <probe pid>
#   sp__nn1_grade <stream> <command> <sudo-control>
#   sp__nn2_grade <stream> <command> [<proc path>]
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_RUNNER_CANARY_NAME=SBX_PROBE_CANARY

# sp__environ_count_cmd <name> <pid> — the one environ read: a count of <name>'s lines, never the file.
sp__environ_count_cmd() {
  printf 'grep -a -c %s= /proc/%s/environ' "$1" "$2"
}

# sp__runner_judged <stream> <command> [<proc path>] — judge the call at `ran`; status 1, with SP_VERDICT
# `not run`, when it was not matched, has no result, or was refused at the permission layer; the evidence
# then ends `(it reads <proc path>)` when one is given.
sp__runner_judged() {
  local reads=""
  [ -z "${3:-}" ] || reads=" (it reads $3)"
  sp_judge_call "$1" ran "$2"
  if [ -z "$SP_LAYER" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="$SP_EVIDENCE$reads"
    return 1
  fi
  if [ "$SP_LAYER" = permission ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="refused at the permission layer, so the call never reached the sandbox: $SP_LAYER_EVIDENCE$reads"
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
  local stream="${1:-}" cmd="${2:-}" out line path="${3:-${2##* }}"
  sp__runner_judged "$stream" "$cmd" "${3:-}" || return 0
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
  sp__runner_judged "$stream" "$cmd" /proc || return 0
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
  local stream="${1:-}" cmd="${2:-}" path="${3:-}" line value prefix=""
  [ -z "$path" ] || prefix="$path: "
  sp__runner_judged "$stream" "$cmd" "$path" || return 0
  if ! line="$(sp__line_with "$SP__TEXT" "NoNewPrivs:")"; then
    SP_VERDICT="not run"
    SP_EVIDENCE="${prefix}no NoNewPrivs: line: $(sp__first_line "$SP__TEXT")"
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
  SP_EVIDENCE="$prefix$line"
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

# sp__runner_scripts_rm <file>... — remove each regular file named; the legs call it only on files
# sp__runner_scripts_write created.
sp__runner_scripts_rm() {
  local f
  for f in "$@"; do
    [ -f "$f" ] && [ ! -L "$f" ] && rm -f -- "$f"
  done
  return 0
}

# sp__runner_scripts_write <leg> <file> <command> [<file> <command>]... — write each <command> as the one
# line of its <file>, each registered with sp_track for an interrupted run. Status 1, every row of <leg>
# printed `not run` and nothing written left behind, when a path fails sp__runner_ctl_path or a write fails.
sp__runner_scripts_write() {
  local leg="${1:-}" pairs n i j
  shift
  pairs=("$@")
  n=${#pairs[@]}
  i=0
  while [ "$i" -lt "$n" ]; do
    sp__runner_ctl_path "$leg" "${pairs[$i]}" || return 1
    i=$((i + 2))
  done
  i=0
  while [ "$i" -lt "$n" ]; do
    if ! printf '%s\n' "${pairs[$((i + 1))]}" >"${pairs[$i]}" 2>/dev/null; then
      j=0
      while [ "$j" -le "$i" ]; do
        sp__runner_scripts_rm "${pairs[$j]}"
        j=$((j + 2))
      done
      sp_leg_mode_skip "$leg" "could not write the call's script file '${pairs[$i]}'"
      return 1
    fi
    sp_track "${pairs[$i]}"
    i=$((i + 2))
  done
  return 0
}

sp_leg_runner_pid() {
  local probe_pid="$$" agent_pid="" pidf pfile ctl agent_cmd probe_cmd ls_cmd="ls /proc" self_cmd departure
  local agent_sh probe_sh ls_sh self_sh agent_proc probe_proc rc
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
  agent_sh="$SP_CLONE/sbx_pn_agent.sh"
  probe_sh="$SP_CLONE/sbx_pn_probe.sh"
  ls_sh="$SP_CLONE/sbx_pn_ls.sh"
  self_sh="$SP_CLONE/sbx_pn_self.sh"
  sp__runner_ctl_path runner-pid "$ctl" || return 0
  probe_proc="/proc/$probe_pid/environ"
  sp__runner_scripts_write runner-pid \
    "$agent_sh" "$(sp__environ_count_cmd "$SP_RUNNER_CANARY_NAME" @SP_AGENT_PID@)" \
    "$probe_sh" "$(sp__environ_count_cmd "$SP_RUNNER_CANARY_NAME" "$probe_pid")" \
    "$ls_sh" "$ls_cmd" \
    "$self_sh" "$(sp__environ_count_cmd PATH self)" || return 0
  agent_cmd="bash $agent_sh"
  probe_cmd="bash $probe_sh"
  ls_cmd="bash $ls_sh"
  self_cmd="bash $self_sh"

  sp_ctl_prepare pn
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$agent_cmd"
  sp_prompt_bash "$pfile" "$probe_cmd"
  sp_prompt_bash "$pfile" "$ls_cmd"
  sp_ctl_add "$pfile" ran "$self_cmd"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl")" "$ctl"

  sp_session runner-pid "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" --token-file "$agent_sh" \
    --allowed "Bash($agent_cmd)" --allowed "Bash($probe_cmd)" --allowed "Bash($ls_cmd)" \
    --allowed "Bash($self_cmd)" --allowed "$SP_DD_RULE"
  rc=$?
  departure="$(sp_departures)"
  # The checkout is shared with later legs: the call scripts go now, the control's file once judged.
  sp__runner_scripts_rm "$agent_sh" "$probe_sh" "$ls_sh" "$self_sh"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session runner-pid did not launch; see $SP_TMP/runner-pid.stderr"
    sp_leg_mode_skip runner-pid "session runner-pid did not launch; see $SP_TMP/runner-pid.stderr"
    return 0
  fi
  if [ "$rc" -eq 96 ]; then
    sp_leg_mode_skip runner-pid "session runner-pid could not place the agent CLI PID; see $SP_TMP/runner-pid.stderr"
    sp__runner_scripts_rm "$ctl"
    return 0
  fi
  [ -f "$pidf" ] && IFS= read -r agent_pid <"$pidf"
  case "$agent_pid" in
    '' | *[!0-9]*)
      sp_leg_mode_skip runner-pid "no agent CLI PID recorded in $pidf"
      sp__runner_scripts_rm "$ctl"
      return 0
      ;;
  esac
  agent_proc="/proc/$agent_pid/environ"
  sp_ctl_held "$SP_STREAM"

  sp__pn_read_grade "$SP_STREAM" "$agent_cmd" "$agent_proc"
  sp_row_result --direct runner-pid PN1 "$SP_VERDICT" "agent CLI pid $agent_pid: $SP_EVIDENCE" "$departure"
  sp__pn_read_grade "$SP_STREAM" "$probe_cmd" "$probe_proc"
  sp_row_result --direct runner-pid PN2 "$SP_VERDICT" "probe pid $probe_pid: $SP_EVIDENCE" "$departure"
  sp__pn3_grade "$SP_STREAM" "$ls_cmd" "$agent_pid" "$probe_pid"
  sp_row_result --direct runner-pid PN3 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  sp__runner_scripts_rm "$ctl"
  return 0
}

sp_leg_runner_privs() {
  local pfile ctl sudo_cmd="sudo -n true" nnp_proc=/proc/self/status nnp_sh nnp_cmd control departure
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
  nnp_sh="$SP_CLONE/sbx_nn_nnp.sh"
  sp__runner_ctl_path runner-privs "$ctl" || return 0
  sp__runner_scripts_write runner-privs "$nnp_sh" "grep NoNewPrivs $nnp_proc" || return 0
  nnp_cmd="bash $nnp_sh"
  control="$(sp_runner_control sudo-control)"

  sp_ctl_prepare nn
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$sudo_cmd"
  sp_prompt_bash "$pfile" "$nnp_cmd"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl")" "$ctl"

  sp_session runner-privs "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" \
    --allowed "Bash($sudo_cmd)" --allowed "Bash($nnp_cmd)" --allowed "$SP_DD_RULE"
  departure="$(sp_departures)"
  sp__runner_scripts_rm "$nnp_sh"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session runner-privs did not launch; see $SP_TMP/runner-privs.stderr"
    sp_leg_mode_skip runner-privs "session runner-privs did not launch; see $SP_TMP/runner-privs.stderr"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"

  sp__nn1_grade "$SP_STREAM" "$sudo_cmd" "$control"
  sp_row_result runner-privs NN1 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  sp__nn2_grade "$SP_STREAM" "$nnp_cmd" "$nnp_proc"
  sp_row_result runner-privs NN2 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"

  sp__runner_scripts_rm "$ctl"
  return 0
}
