#!/usr/bin/env bash
# core.sh — the sandbox probe's leg table, its result line (which refuses a row not in its leg's
# rows), the non-pass record (SP_NONPASS_LEGS, read through sp_leg_nonpass), the `not run — leg not
# implemented` fallback, the shared refusal printer and the exit-code accumulator.
# scripts/sandbox-probe.sh sources it first, before every other file under scripts/lib/sandbox-probe/.
#
# SP_LEGS is the single declaration of leg -> rows -> expected -> recorded in. Gate 15 in
# docs/development.md restates it from `sandbox-probe.sh --list`, so edit it here and re-derive there.
# One line per leg, in run order, tab-separated:
#   <leg> <rows, comma-joined> <expected, one sentence> <recorded in: docs/sandbox-verification.md section>
# A leg runs through `sp_leg_<leg>`, each `-` read as `_`. Gate 15 restates every field as a Markdown
# table cell, so no field carries a `|`, a tab, a double quote or a backtick.
#
#   SP_LINUX_ONLY_LEGS                the legs that run only where SP_PLATFORM (platform.sh) is `linux`;
#   sp_leg_linux_only <leg>           status 0 for a leg in that list
#   sp_leg_platform_skip <leg>        one `not run` line per row of <leg>, naming the host's platform
#   sp_leg_row_for <macOS row> <Linux row>  prints the Linux row when SP_PLATFORM is `linux`, else the macOS one
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array.

SP_LEGS=""
SP_FAIL_COUNT=0
SP_NONPASS_LEGS=""
SP_EXIT=0

sp_leg_declare() {
  SP_LEGS="${SP_LEGS}$1"$'\t'"$2"$'\t'"$3"$'\t'"$4"$'\n'
}

sp_leg_declare gates "T2,W7,T3" \
  "the gates, started in the clone through run-test-suite.sh and collected with --wait, reach a pass verdict with no gate failing on its temporary file (T2 on macOS, T3 on Linux), and each of W7's six wrapper calls runs with no permission denial" \
  "§5 Failures and their follow-ups (T2, T3); §4 The profile's denials (W7)"
sp_leg_declare mktemp "TD2,TD4" \
  "on macOS (TD2) the bare, -d and -t mktemp forms are refused with mkstemp failed; on Linux (TD4) the bare and -d forms are written under the session's TMPDIR and -t fails with too few X's, as TD3 found unsandboxed; on both the explicit form spelled with the session's TMPDIR as a literal path is written, and a call refused at the permission layer is not run" \
  "§5 Failures and their follow-ups"
sp_leg_declare scratch "SR1,SR2" \
  "scratch-run.sh runs a probe file sandboxed, and a write outside the allowed roots from inside that file is refused" \
  "§4 The profile's denials"
sp_leg_declare retrieval "MC1" \
  "the harness-docs MCP server answers a search_docs call outside the sandbox, or the leg is not run where no .mcp.json wires it" \
  "§4 The profile's denials"
sp_leg_declare wrappers "CS4,P3,CW2,P1c,CW5,P1b,CW6" \
  "the main checkout's wrappers run outside the sandbox and land on the clone, while the clone's own copies, the compound and both assignment prefixes stay sandboxed or are neutralised, each prefixed call allowed through --allowedTools; a measured call refused at the permission layer is not run, and every P3, CW2, P1c, CW5, P1b and CW6 result names the layer that answered" \
  "§2 The clone layout (owed) (CS4); §3 The wrappers (P3, CW2, P1c, CW5, P1b, CW6)"
sp_leg_declare wrappers-refresh "R0,R1,R2,R3,R4" \
  "refresh-branch.sh on the clone arm runs outside the sandbox: fixture (a) fast-forwards, (b) writes a two-parent merge, (c) exits 4 with nothing written, and the clone's own copy stays sandboxed for its fetch while its --local merge runs in the clone" \
  "§3 The wrappers"
sp_leg_declare planted-config "C1,CW3,C2,K2,CW4,CS15" \
  "each wrapper refuses a scratch repository or a clone whose .git/config carries a planted key before any git call, and no marker is created; a wrapper call refused at the permission layer is not run" \
  "§3 The wrappers (C1, CW3, C2, K2, CW4); §2 The clone layout (owed) (CS15)"
sp_leg_declare planted-files "CS12,CS13,CS14,L1,L2" \
  "commit-on-branch.sh refuses a clone carrying a planted http-alternates, commondir or config.worktree, refresh-branch.sh refuses a dash-leading defaultBranch, and L1 is not run — unreachable on the clone layout" \
  "§2 The clone layout (owed) (CS12, CS13, CS14); §3 The wrappers (L1, L2)"
sp_leg_declare write-protection "CS1,CS2,CS7,W6,W8" \
  "every write to the clone's protected paths, to <main>/.git and to the per-run profile, the per-run profile's Edit included, is refused while its control is written, a dd refused at the permission layer is not run, and neither this leg's debug log nor W7's carries an unmatched-rule line" \
  "§2 The clone layout (owed) (CS1, CS2, CS7); §4 The profile's denials (W6, W8)"
sp_leg_declare git "CS3,CL5" \
  "ordinary git in the clone succeeds under the real per-run profile, git fetch origin is refused by the network allowlist as the clone layout intends, each CL5 write is refused or written as recorded, and a call refused at the permission layer is not run" \
  "§2 The clone layout (owed) (CS3); §2 The per-run clone (2026-10-19) (CL5)"
sp_leg_declare network "N1,N2,N3,N4,N5" \
  "hosts off the allowlist are refused, a loopback listener the probe owns returns no body to the session, a link-local host's curl error line is graded against the same call issued unsandboxed from the probe's own shell and is not run where the two cannot be told apart, and a call carrying allowed_domains does not reach its host" \
  "§4 The profile's denials"
sp_leg_declare retry "RT1" \
  "dangerouslyDisableSandbox: true does not run the call unsandboxed under allowUnsandboxedCommands: false" \
  "§4 The profile's denials"
sp_leg_declare repo-settings "RS1" \
  "a planted <clone>/.claude/settings.local.json loosening changes none of the network, retry and write-protection results" \
  "§4 The profile's denials"
sp_leg_declare credentials "S1,S2,S4,S5" \
  "reads of ~/.ssh are refused, the token variables the profile unsets are absent by a check that prints presence only, whether the SSH agent socket is reachable is recorded, and the leg is not run when its session issued no calls" \
  "§4 The profile's denials"
sp_leg_declare invalid-profile "CS8" \
  "the control's call is refused, on the invalid profile the marker is recorded as written or refused, and the watcher's own run_profile_check refuses a scratch per-run copy whose sandbox.failIfUnavailable is a string while it accepts the unmodified one" \
  "§2 The clone layout (owed)"
sp_leg_declare glob-deny "GW1,GW2" \
  "Linux only: on a scratch per-run profile without the clone's exact entries, a sandboxed dd onto a clone path that only a denyWrite entry containing a star covers is recorded as refused or written, for a path that exists when the session starts (GW1) and one that does not (GW2), while its control is written" \
  "§8 The Linux legs (owed)"
sp_leg_declare registry "RG1,RG2,RG3" \
  "Linux only: a sandboxed dd onto the run registry is refused while a new file beside it is written and an Edit of it is refused (RG1), a rename onto it leaves its inode and shasum unchanged (RG2), and moving its directory aside is refused, the probe restoring it at once if not (RG3)" \
  "§8 The Linux legs (owed)"
sp_leg_declare detached "BG9,WF5" \
  "Linux only: a process started with nohup and disown inside one sandboxed call outlives the call and the session (BG9), and hr_lane_mtime, read in that process through the GNU stat arm, advances (WF5)" \
  "§5 Failures and their follow-ups"
sp_leg_declare loopback "LB1,LB2,LB3,LB4,LB5" \
  "Linux only: the probe's loopback listener is called by 127.0.0.1 and by localhost, each also with --noproxy, on the network scratch profile as generated (LB1, LB2) and with 127.0.0.1 listed (LB3, LB4), and a listener a sandboxed call starts is called from outside the sandbox (LB5); once the listener answered the probe's own request, each row records whether the token came back and the proxy variables' host and port, and grades neither outcome" \
  "§8 The Linux legs (owed)"
sp_leg_declare headless-parity "HP1" \
  "the network, retry and write-protection legs give the same results in an interactive session, from the printed parity script" \
  "§4 The profile's denials"
sp_leg_declare refusal "RF1,RF2,RF3" \
  "Linux only, through the refusal subcommand on a host lacking bwrap or socat: Claude Code's own startup refusal under failIfUnavailable is quoted (RF1), the watcher's launch-time prerequisite probe refuses naming the missing package (RF2), and a session on CS8's invalid profile is recorded as refused at startup or run unsandboxed (RF3)" \
  "§8 The Linux legs (owed)"

sp_legs_print() {
  printf '%s' "$SP_LEGS"
}

sp_leg_names() {
  local leg rest
  while IFS=$'\t' read -r leg rest; do
    [ -n "$leg" ] && printf '%s\n' "$leg"
  done <<<"$SP_LEGS"
}

# sp_leg_rows <leg> — the leg's rows, comma-joined; status 1 for a leg not in the table.
sp_leg_rows() {
  local leg rows rest
  while IFS=$'\t' read -r leg rows rest; do
    if [ "$leg" = "${1:-}" ]; then
      printf '%s\n' "$rows"
      return 0
    fi
  done <<<"$SP_LEGS"
  return 1
}

sp_refuse() {
  echo "sandbox-probe: $*" >&2
}

# sp_exit_raise <code> — keep the highest exit code any step asked for.
sp_exit_raise() {
  if [ "${1:-0}" -gt "$SP_EXIT" ]; then
    SP_EXIT="$1"
  fi
}

# sp_exit_final — fold the counted fails into SP_EXIT (as 4) and leave the result in SP_EXIT.
sp_exit_final() {
  if [ "$SP_FAIL_COUNT" -gt 0 ]; then
    sp_exit_raise 4
  fi
}

# sp_leg_nonpass <leg> — status 0 when the leg printed a fail or not run line, or had a line refused.
sp_leg_nonpass() {
  case $'\n'"$SP_NONPASS_LEGS" in
    *$'\n'"${1:-}"$'\n'*) return 0 ;;
  esac
  return 1
}

sp__nonpass_add() {
  sp_leg_nonpass "$1" || SP_NONPASS_LEGS="${SP_NONPASS_LEGS}$1"$'\n'
}

sp_result_line() {
  local leg="${1:-}" row="${2:-}" verdict="${3:-}" evidence="${4:-}" departure="${5:-}"
  local rows
  # The judge subcommand's line carries no row (judge.sh -> sp_judge_cli).
  if [ "$leg" != judge ] || [ "$row" != - ]; then
    rows="$(sp_leg_rows "$leg")" || rows="none"
    case ",$rows," in
      *",$row,"*) ;;
      *)
        # Whole-row match, so a row fused with its verdict (T2fail) is refused at its source.
        sp_refuse "sp_result_line: row '$row' is not a row of leg '$leg' ($rows)"
        SP_FAIL_COUNT=$((SP_FAIL_COUNT + 1))
        sp__nonpass_add "$leg"
        return 1
        ;;
    esac
  fi
  case "$verdict" in
    pass | fail | "not run") ;;
    *)
      # A malformed verdict counts as a fail, so a caller's bug can never read as a pass.
      sp_refuse "sp_result_line: verdict '$verdict' for $leg $row is not pass, fail or not run"
      SP_FAIL_COUNT=$((SP_FAIL_COUNT + 1))
      sp__nonpass_add "$leg"
      return 1
      ;;
  esac
  [ "$verdict" = fail ] && SP_FAIL_COUNT=$((SP_FAIL_COUNT + 1))
  [ "$verdict" = pass ] || sp__nonpass_add "$leg"
  # Bash 3.2 keeps the backslash of an escaped quote in a replacement; a variable does not.
  local sq="'"
  evidence="${evidence%%$'\n'*}"
  evidence="${evidence//\"/$sq}"
  departure="${departure%%$'\n'*}"
  departure="${departure//\"/$sq}"
  [ -n "$departure" ] || departure="none"
  printf 'leg="%s" row="%s" result="%s" evidence="%s" departure="%s" claude="%s"\n' \
    "$leg" "$row" "$verdict" "$evidence" "$departure" "${SP_VERSION:-unknown}"
}

# sp_leg_missing <leg> — one `not run` line per row of a leg whose sp_leg_<name> is not defined yet.
sp_leg_missing() {
  local rows row
  rows="$(sp_leg_rows "${1:-}")" || return 1
  local IFS=,
  for row in $rows; do
    sp_result_line "$1" "$row" "not run" "leg not implemented" ""
  done
}

SP_LINUX_ONLY_LEGS="glob-deny registry detached loopback refusal"

sp_leg_linux_only() {
  case " $SP_LINUX_ONLY_LEGS " in
    *" ${1:-} "*) [ -n "${1:-}" ] ;;
    *) return 1 ;;
  esac
}

sp_leg_platform_skip() {
  local rows row evidence
  rows="$(sp_leg_rows "${1:-}")" || return 1
  if [ -n "${SP_PLATFORM:-}" ]; then
    evidence="Linux only: this host is ${SP_PLATFORM}"
  else
    evidence="Linux only: this host is not macOS or Linux"
  fi
  local IFS=,
  for row in $rows; do
    sp_result_line "$1" "$row" "not run" "$evidence" ""
  done
}

sp_leg_row_for() {
  if [ "${SP_PLATFORM:-}" = linux ]; then
    printf '%s\n' "${2:-}"
  else
    printf '%s\n' "${1:-}"
  fi
}
