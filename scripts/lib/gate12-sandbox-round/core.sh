#!/usr/bin/env bash
# core.sh — the Gate 12 round driver's row table, its result line (which refuses a row not in the
# table and a result outside its five), the shared refusal printer, the missing-function check and
# the exit-code accumulator. scripts/gate12-sandbox-round.sh sources it first, before every other
# file under scripts/lib/gate12-sandbox-round/.
#
# G12_ROWS is the single declaration of row -> round step -> route -> arms -> note. The rows are those
# of docs/sandbox-verification.md -> ## 10., and docs/development.md -> Gate 12 restates this table
# from `gate12-sandbox-round.sh --list`, so edit it here and re-derive there. One line per row, in
# --list order, tab-separated:
#   <row> <round step: 6, 7, 8 or 9> <route> <arms, comma-joined, or -> <note>
# The route is stated here once; every later library reads it and never re-decides it:
#   full-run        graded from the hand-driven full run named by `grade --full-run <branch>`
#   plant           a pushed plumbing branch per arm (`plant`), graded from its job
#   reads-SB2       SB4 alone: no plant and no hand row of its own; `grade` reads SB2's planted job
#   default-branch  JS3 alone: the `default-branch` leg
#   hand            a hand step the script cannot take; `grade` prints it `not run` with its note
# The gate restates every field as a Markdown table cell, so no field carries a `|`, a tab, a
# double quote, a backtick or an angle bracket (Markdown reads `<word>` as an HTML tag).
#
#   g12_rows_print            prints G12_ROWS verbatim (--list)
#   g12_row_names             one row id per line, in table order
#   g12_row_field <row> <n>   field <n> (1-5) of <row>; status 1 for a row not in the table or a bad <n>
#   g12_row_arms <row>        one arm per line, nothing for `-`; status 1 for a row not in the table
#   g12_result_line <row> <result> <evidence> [<departure>]
#                             row="<ID>" result="<r>" evidence="<e>" departure="<d|none>"
#   g12_refuse <text>...      one stderr line prefixed `gate12-sandbox-round: `
#   g12_need <fn>...          exit 1 naming every function not defined yet
#   g12_exit_raise <code>     keep the highest code asked for in G12_EXIT
#   g12_exit_final            fold the counted fails (G12_FAIL_COUNT) into G12_EXIT as 4
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array.

G12_ROWS=""
G12_FAIL_COUNT=0
G12_EXIT=0

g12_row_declare() {
  G12_ROWS="${G12_ROWS}$1"$'\t'"$2"$'\t'"$3"$'\t'"$4"$'\t'"$5"$'\n'
}

g12_row_declare FR1 6 full-run - \
  "the job's copy, its profile and the launch check, graded from the full run that grade --full-run names"
g12_row_declare FR2 6 full-run - \
  "Install the sandbox prerequisites on the hosted runner and the doctor preflight after it, graded from the full run that grade --full-run names"
g12_row_declare FR3 6 full-run - \
  "commits and pushes through the wrappers, graded on the job: line of the Run the harness step log and on a wrapper's refusing line, since push-branch.sh exits 0 on a refusal and Run the harness concludes success even on a failed run"
g12_row_declare FR4 6 full-run - \
  "the permission_denials of the calls the flow needs, each quoted, graded from the full run that grade --full-run names"
g12_row_declare FR5 6 full-run - \
  "the job-surface check on an honest branch and the recorded default-branch commit, graded from the full run that grade --full-run names"
g12_row_declare FR6 6 full-run - \
  "the state bundle saved by the parked job and restored by the next, graded from the full run that grade --full-run names"
g12_row_declare FR7 6 full-run - \
  "the park answered through the GitHub route and the resume in answer mode, graded from the full run that grade --full-run names"
g12_row_declare JS1 7 plant settings,remote-run \
  "a pushed plumbing commit of .claude/settings.json, and separately of remote-run.sh under scriptsDir, refused at Refuse a branch that changed the job's own files"
g12_row_declare JS4 7 plant npmrc,node-modules \
  "a pushed plumbing commit of a .npmrc, and separately of node_modules/autonomous-sdlc-harness, whose marker must not appear in the job's npm steps"
g12_row_declare SB2 7 plant clarifications \
  "plants the second link inside the branch's clarifications directory; its PAUSE_PROGRESS.md arm, moved aside by hr_remote_move_aside before the session, and its autonomous_logs/remote_status.json variant, replaced by hr_remote_status_write, are hand steps"
g12_row_declare SB4 7 reads-SB2 - \
  "no plant and no hand step of its own for the bundle half: grade reads it from SB2's planted job's harness-state artifact; its optional half, a throwaway upload workflow and a background process, stays a hand step"
g12_row_declare RJ2 7 plant profile \
  "plants .claude/settings.autonomous.json with sandbox.enabled false and no opt-out marker; that profile is itself a job surface (protectedPaths, its PROFILE_PATH entry, kept by jobSurfacePaths), so Refuse a branch that changed the job's own files refuses the branch before the launch check, and the launch-check clause has no route"
g12_row_declare JS3 8 default-branch stall \
  "lowered STALL_WARN_SECS and STALL_KILL_SECS set as repository variables while the GitHub default branch differs from defaultBranch, both restored afterwards"
g12_row_declare JS3N 8 hand - \
  "a hand step, because every job surface is a write-protected path in the session (jobSurfacePaths derives from placeholderProtectedPaths), so the session cannot commit one and a pushed one is JS1's refusal"
g12_row_declare SB3 7 hand - \
  "a hand step, because harness.config.json is write-protected in the job's base profile (protectedPaths, its CONFIG_FILENAME entry) and a committed rewrite is a job surface (jobSurfacePaths) that the job refuses"
g12_row_declare RJ3 9 hand - \
  "a hand step on round step 9, a local leg: remote-run.sh start and review run from a mirror of the Gate 12 repository on the operator's machine, not through a job"

g12_rows_print() {
  printf '%s' "$G12_ROWS"
}

g12_row_names() {
  local row rest
  while IFS=$'\t' read -r row rest; do
    [ -n "$row" ] && printf '%s\n' "$row"
  done <<<"$G12_ROWS"
}

g12_row_field() {
  local want="${1:-}" n="${2:-}" line f1 f2 f3 f4 f5
  case "$n" in
    1 | 2 | 3 | 4 | 5) ;;
    *) return 1 ;;
  esac
  [ -n "$want" ] || return 1
  while IFS= read -r line; do
    IFS=$'\t' read -r f1 f2 f3 f4 f5 <<<"$line"
    if [ "$f1" = "$want" ]; then
      case "$n" in
        1) printf '%s\n' "$f1" ;;
        2) printf '%s\n' "$f2" ;;
        3) printf '%s\n' "$f3" ;;
        4) printf '%s\n' "$f4" ;;
        5) printf '%s\n' "$f5" ;;
      esac
      return 0
    fi
  done <<<"$G12_ROWS"
  return 1
}

g12_row_arms() {
  local arms arm
  arms="$(g12_row_field "${1:-}" 4)" || return 1
  [ "$arms" != - ] || return 0
  local IFS=,
  for arm in $arms; do
    printf '%s\n' "$arm"
  done
}

g12_refuse() {
  echo "gate12-sandbox-round: $*" >&2
}

g12_need() {
  local fn missing=0
  for fn in "$@"; do
    if ! declare -F "$fn" >/dev/null; then
      g12_refuse "$fn is not present: its library file under scripts/lib/gate12-sandbox-round/ has not shipped"
      missing=1
    fi
  done
  [ "$missing" -eq 0 ] || exit 1
}

g12_exit_raise() {
  if [ "${1:-0}" -gt "$G12_EXIT" ]; then
    G12_EXIT="$1"
  fi
}

g12_exit_final() {
  if [ "$G12_FAIL_COUNT" -gt 0 ]; then
    g12_exit_raise 4
  fi
}

g12_result_line() {
  local row="${1:-}" result="${2:-}" evidence="${3:-}" departure="${4:-}"
  if [ -z "$row" ] || ! g12_row_field "$row" 1 >/dev/null; then
    # A refusal counts as a fail, so a caller's bug can never read as a pass.
    g12_refuse "g12_result_line: row '$row' is not a row of G12_ROWS (see --list)"
    G12_FAIL_COUNT=$((G12_FAIL_COUNT + 1))
    return 1
  fi
  case "$result" in
    pass | fail | "not run" | expired | source) ;;
    *)
      g12_refuse "g12_result_line: result '$result' for $row is not pass, fail, not run, expired or source"
      G12_FAIL_COUNT=$((G12_FAIL_COUNT + 1))
      return 1
      ;;
  esac
  [ "$result" = fail ] && G12_FAIL_COUNT=$((G12_FAIL_COUNT + 1))
  # The line is a summary: the full record goes to the row's evidence file, never only here.
  # Bash 3.2 keeps the backslash of an escaped quote in a replacement; a variable does not.
  local sq="'"
  evidence="${evidence%%$'\n'*}"
  evidence="${evidence//\"/$sq}"
  departure="${departure%%$'\n'*}"
  departure="${departure//\"/$sq}"
  [ -n "$departure" ] || departure="none"
  printf 'row="%s" result="%s" evidence="%s" departure="%s"\n' "$row" "$result" "$evidence" "$departure"
}
