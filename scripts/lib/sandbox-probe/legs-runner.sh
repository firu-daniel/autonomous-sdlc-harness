#!/usr/bin/env bash
# legs-runner.sh — the runner controls file, the runner stamp, and the sandbox probe's runner-install
# leg (rows IS1, IS2, IS3, IS4), Linux job mode only. Every reading this leg grades was taken by the
# GitHub-hosted runner workflow in its own unsandboxed steps, some before the probe is on disk, so the
# leg launches no session.
#
# THE RUNNER CONTROLS FILE — this file owns its contract; the workflow writes exactly these keys.
#   One `<key>\t<value>` line per reading, the value kept whole. A value never carries a tab or a newline:
#   the workflow replaces either with a space. An unknown key is ignored; a repeated key keeps its last
#   value. The keys, closed:
#     the stamp:      image-os, image-version, uname-r, probe-commit, cli-version
#     before the install step:
#                     sysctl-before            /proc/sys/kernel/apparmor_restrict_unprivileged_userns, or `absent`
#                     apparmor-profile-before  /etc/apparmor.d/bwrap: `present` (carrying a `userns,` line),
#                                              `present without userns`, or `absent`
#                     bwrap-before, socat-before  the `command -v` path, or `absent`
#     the controls:   sudo-control             `exit <n>` of the workflow's own unsandboxed `sudo -n true`
#                     imds-control             `http <code>` or `no answer: curl exit <n>`
#     after the install step:
#                     sysctl-after, apparmor-profile-after, bwrap-after, socat-after  as their -before keys
#                     bwrap-version            the first line of `bwrap --version`, or `absent`
#                     bwrap-start              `exit 0` or `exit <n>: <first stderr line>` of
#                                              `bwrap --ro-bind / / --dev /dev --unshare-all --proc /proc true`,
#                                              run as the runner user
#                     ssh-config               `created` or `existed`
#
#   sp_runner_controls_read <file>    keeps the file's lines in SP__RUNNER_CONTROLS; status 1, with an
#                                     sp_refuse line, when the file is unreadable or holds no `<key>\t<value>` line
#   sp_runner_control <key>           the value; `unrecorded` with status 1 when the key is absent or no file was read
#   sp_runner_stamp                   `sandbox-probe: stamp: runner <key>: <value>` on stderr for image-os,
#                                     image-version, uname-r, bwrap-version, probe-commit, cli-version;
#                                     nothing when no file was read
#
# THE GRADING FUNCTIONS read only their arguments and set SP_VERDICT and SP_EVIDENCE. An argument that is
# `unrecorded` gives `not run`, naming its key:
#   sp__is1_grade <sysctl-before>
#   sp__is2_grade <bwrap-before> <socat-before> <bwrap-after> <socat-after> <bwrap-version>
#   sp__is3_grade <sysctl-before> <apparmor-profile-before> <apparmor-profile-after>
#   sp__is4_grade <bwrap-start> <sandbox-prerequisites line of doctor --remote-job>
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP__RUNNER_KEYS="image-os image-version uname-r probe-commit cli-version sysctl-before apparmor-profile-before bwrap-before socat-before sudo-control imds-control sysctl-after apparmor-profile-after bwrap-after socat-after bwrap-version bwrap-start ssh-config"
SP__RUNNER_CONTROLS=""
SP__RUNNER_CONTROLS_READ=0

sp_runner_controls_read() {
  local file="${1:-}" line key shaped=0 kept=""
  SP__RUNNER_CONTROLS=""
  SP__RUNNER_CONTROLS_READ=0
  if [ -z "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ]; then
    sp_refuse "the runner controls file '$file' is not readable"
    return 1
  fi
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      *$'\t'*) ;;
      *) continue ;;
    esac
    key="${line%%$'\t'*}"
    [ -n "$key" ] || continue
    shaped=1
    case " $SP__RUNNER_KEYS " in
      *" $key "*) kept="${kept}${line}"$'\n' ;;
    esac
  done <"$file"
  if [ "$shaped" -ne 1 ]; then
    sp_refuse "the runner controls file '$file' holds no <key><tab><value> line"
    return 1
  fi
  SP__RUNNER_CONTROLS="$kept"
  SP__RUNNER_CONTROLS_READ=1
  return 0
}

sp_runner_control() {
  local want="${1:-}" line value="" found=0
  if [ "$SP__RUNNER_CONTROLS_READ" = 1 ] && [ -n "$want" ]; then
    while IFS= read -r line; do
      if [ "${line%%$'\t'*}" = "$want" ]; then
        value="${line#*$'\t'}"
        found=1
      fi
    done <<<"$SP__RUNNER_CONTROLS"
  fi
  if [ "$found" -ne 1 ]; then
    printf '%s\n' unrecorded
    return 1
  fi
  printf '%s\n' "$value"
}

sp_runner_stamp() {
  local key
  [ "$SP__RUNNER_CONTROLS_READ" = 1 ] || return 0
  for key in image-os image-version uname-r bwrap-version probe-commit cli-version; do
    echo "sandbox-probe: stamp: runner $key: $(sp_runner_control "$key")" >&2
  done
  return 0
}

# sp__runner_unrecorded <key> <value> [<key> <value>]... — status 0, with SP_VERDICT `not run` and
# SP_EVIDENCE naming each unrecorded key, when any value is `unrecorded`.
sp__runner_unrecorded() {
  local names=""
  while [ $# -ge 2 ]; do
    [ "$2" = unrecorded ] && names="${names:+$names, }$1"
    shift 2
  done
  [ -n "$names" ] || return 1
  SP_VERDICT="not run"
  SP_EVIDENCE="the runner controls file records no $names"
  return 0
}

sp__is1_grade() {
  local before="${1:-}"
  sp__runner_unrecorded sysctl-before "$before" && return 0
  SP_VERDICT=pass
  SP_EVIDENCE="kernel.apparmor_restrict_unprivileged_userns before the install step: $before"
}

sp__is2_grade() {
  local bb="${1:-}" sb="${2:-}" ba="${3:-}" sa="${4:-}" ver="${5:-}" missing="" odd="" name before after said=""
  sp__runner_unrecorded bwrap-before "$bb" socat-before "$sb" bwrap-after "$ba" socat-after "$sa" \
    bwrap-version "$ver" && return 0
  [ "$ba" = absent ] && missing="bwrap"
  [ "$sa" = absent ] && missing="${missing:+$missing and }socat"
  if [ -n "$missing" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="$missing absent from PATH after the install step (bwrap-after: $ba; socat-after: $sa)"
    return 0
  fi
  case "$ba" in /*) ;; *) odd="bwrap-after '$ba'" ;; esac
  case "$sa" in /*) ;; *) odd="${odd:+$odd, }socat-after '$sa'" ;; esac
  if [ -n "$odd" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="neither a path nor absent: $odd"
    return 0
  fi
  for name in bwrap socat; do
    if [ "$name" = bwrap ]; then before="$bb"; after="$ba"; else before="$sb"; after="$sa"; fi
    if [ "$before" = absent ]; then
      said="${said:+$said; }$name installed by the step at $after"
    else
      said="${said:+$said; }$name already at $before, at $after after the step"
    fi
  done
  SP_VERDICT=pass
  SP_EVIDENCE="$said; bwrap --version: $ver"
}

sp__is3_grade() {
  local sysctl="${1:-}" pb="${2:-}" pa="${3:-}"
  sp__runner_unrecorded sysctl-before "$sysctl" apparmor-profile-before "$pb" \
    apparmor-profile-after "$pa" && return 0
  # The step writes /etc/apparmor.d/bwrap exactly when the sysctl reads 1 and the file is absent or carries no userns, line.
  if [ "$sysctl" = 1 ] && [ "$pa" != present ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="the sysctl read 1 before the install step and /etc/apparmor.d/bwrap is $pa after it (before: $pb)"
  elif [ "$sysctl" = 1 ] && [ "$pb" = absent ] && [ "$pa" = present ]; then
    SP_VERDICT=pass
    SP_EVIDENCE="written: the sysctl read 1 and the step wrote /etc/apparmor.d/bwrap"
  elif [ "$sysctl" = 1 ] && [ "$pb" = "present without userns" ] && [ "$pa" = present ]; then
    SP_VERDICT=pass
    SP_EVIDENCE="written: the sysctl read 1 and the step rewrote /etc/apparmor.d/bwrap, which carried no userns rule"
  elif [ "$pb" = present ] && [ "$pa" = present ]; then
    SP_VERDICT=pass
    SP_EVIDENCE="not needed: /etc/apparmor.d/bwrap was present before the install step (sysctl: $sysctl)"
  elif [ "$sysctl" != 1 ] && [ "$pb" = "present without userns" ] && [ "$pa" = "present without userns" ]; then
    SP_VERDICT=pass
    SP_EVIDENCE="not needed: the sysctl read $sysctl, and /etc/apparmor.d/bwrap was present before the install step, carrying no userns rule"
  elif [ "$sysctl" != 1 ] && [ "$pb" = absent ] && [ "$pa" = absent ]; then
    SP_VERDICT=pass
    SP_EVIDENCE="not needed: the sysctl read $sysctl, and the step wrote no /etc/apparmor.d/bwrap"
  else
    SP_VERDICT="not run"
    SP_EVIDENCE="no rule fits sysctl-before '$sysctl', apparmor-profile-before '$pb', apparmor-profile-after '$pa'"
  fi
}

sp__is4_grade() {
  local start="${1:-}" prereq="${2:-}" f1 rest
  sp__runner_unrecorded bwrap-start "$start" "sandbox-prerequisites line" "$prereq" && return 0
  read -r f1 rest <<<"$prereq"
  case "$start" in
    "exit 0")
      if [ "$f1" = PASS ]; then
        SP_VERDICT=pass
        SP_EVIDENCE="bwrap starts as the runner user (exit 0), and doctor --remote-job: $prereq"
        return 0
      fi ;;
    "exit "*)
      SP_VERDICT=fail
      SP_EVIDENCE="bwrap does not start as the runner user: $start"
      return 0 ;;
  esac
  if [ -z "$prereq" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="doctor --remote-job printed no sandbox-prerequisites line (bwrap-start: $start)"
    return 0
  fi
  SP_VERDICT="not run"
  SP_EVIDENCE="no rule fits bwrap-start '$start' with the sandbox-prerequisites line: $prereq"
}

sp_leg_runner_install() {
  local sb pb bb sob ba soa pa ver start
  if [ "$SP_JOB_MODE" != 1 ]; then
    sp_leg_mode_skip runner-install "job mode only: run it with --job <checkout>"
    return 0
  fi
  if [ "$SP__RUNNER_CONTROLS_READ" != 1 ]; then
    sp_leg_mode_skip runner-install "no runner controls file: the GitHub-hosted runner workflow writes one (--runner-controls)"
    return 0
  fi
  sb="$(sp_runner_control sysctl-before)"
  pb="$(sp_runner_control apparmor-profile-before)"
  pa="$(sp_runner_control apparmor-profile-after)"
  bb="$(sp_runner_control bwrap-before)"
  sob="$(sp_runner_control socat-before)"
  ba="$(sp_runner_control bwrap-after)"
  soa="$(sp_runner_control socat-after)"
  ver="$(sp_runner_control bwrap-version)"
  start="$(sp_runner_control bwrap-start)"
  sp__is1_grade "$sb"
  sp_result_line runner-install IS1 "$SP_VERDICT" "$SP_EVIDENCE" none
  sp__is2_grade "$bb" "$sob" "$ba" "$soa" "$ver"
  sp_result_line runner-install IS2 "$SP_VERDICT" "$SP_EVIDENCE" none
  sp__is3_grade "$sb" "$pb" "$pa"
  sp_result_line runner-install IS3 "$SP_VERDICT" "$SP_EVIDENCE" none
  sp__is4_grade "$start" "${SP_JOB_PREREQ_LINE:-}"
  sp_result_line runner-install IS4 "$SP_VERDICT" "$SP_EVIDENCE" none
}
