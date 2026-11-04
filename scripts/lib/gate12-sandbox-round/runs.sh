#!/usr/bin/env bash
# runs.sh — the Gate 12 round driver's readers of one recorded `harness run` run: its `run` job's
# steps, a step's log lines, its `harness-state` artifact, and the per-row evidence file. Every
# grader reads a run through these and nothing else, so docs/sandbox-verification.md -> ## 10. ->
# Reading a result. is applied in one place:
#   a step whose conclusion is not `success` or `failure` did not run, and its row is `not run`;
#   a log or artifact GitHub has expired is `expired`, never a pass and never an absence.
#
# Every path is built on g12_scratch_dir (state.sh), never on its literal:
#   runs/<id>/view.json       the `--json status,conclusion,jobs` answer, cached once completed
#   runs/<id>/log.txt         the whole `--log` answer, cached on the first read
#   runs/<id>/harness-state/  the downloaded artifact; a failed download leaves a
#                             harness-state.XXXXXX sibling, never a partial harness-state/
#   evidence/<row>.log        g12_evidence's records, appended
#
#   g12_run_status <id>          prints the run's status
#   g12_run_conclusion <id>      prints the run's conclusion, empty while it runs
#   g12_run_done <id>            0 when the status is `completed`, 1 when not
#   g12_run_steps <id>           the `run` job's steps, `<step name>\t<conclusion>` per line
#   g12_step_conclusion <id> <step>  prints that step's conclusion, nothing when it is absent
#   g12_step_ran <id> <step>     0 only for `success` or `failure`; 1 for skipped, cancelled,
#                                absent, or a step or run still in progress
#   g12_step_log <id> <step>     prints the step's lines, each with its job and step fields cut
#   g12_artifact <id>            prints `none`, `expired`, or the downloaded directory
#   g12_evidence <row> <text>    appends one record to evidence/<row>.log and prints that path
# Status 3, after a g12_refuse line, is a gh call that failed or answered what jq cannot read; each
# reader is called inside `$(…)`, so it raises no exit code and the caller raises 3.
# g12_step_log's own statuses: 2 the log is gone (HTTP 410, or a message naming log retention), so
# the row is `expired`; 4 the log holds no line for that step. A step that ran always logs its
# `Run …` group line, so 4 means gh could not attribute the lines (a step name it renders
# differently) and the row is `not run`: an absent marker in an unattributed log is not a pass.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array.

# harness-run.yml's `run` job has no `name:`, so GitHub names it by its key (that file's DECLARED
# MIRRORS -> RUN_JOB_NAME in remote-run.sh).
G12_RUN_JOB=run

g12_run_dir() {
  local id="${1:-}"
  case "$id" in
    "" | *[!0-9]*) g12_refuse "run id '$id' is not a number"; return 1 ;;
  esac
  printf '%s/runs/%s\n' "$(g12_scratch_dir)" "$id"
}

# g12_cache_put <path> — stdin into a mktemp sibling, then mv over <path>.
g12_cache_put() {
  local path="$1" tmp
  mkdir -p "${path%/*}" || { g12_refuse "could not create '${path%/*}'"; return 1; }
  tmp="$(mktemp "$path.XXXXXX")" || { g12_refuse "could not create a temporary file beside '$path'"; return 1; }
  if ! cat >"$tmp" || ! mv -f "$tmp" "$path"; then
    rm -f "$tmp"
    g12_refuse "could not write '$path'"
    return 1
  fi
}

g12_run_view() {
  local id="${1:-}" dir json
  dir="$(g12_run_dir "$id")" || return 3
  if [ -f "$dir/view.json" ]; then
    cat "$dir/view.json"
    return 0
  fi
  json="$(gh run view "$id" --repo "$G12_REPO" --json status,conclusion,jobs </dev/null)" ||
    { g12_refuse "gh run view $id --repo $G12_REPO --json status,conclusion,jobs failed"; return 3; }
  jq -e 'type == "object" and (.status | type == "string")' >/dev/null 2>&1 <<<"$json" ||
    { g12_refuse "gh run view $id --repo $G12_REPO printed what jq cannot read"; return 3; }
  # A run still in flight changes, so only a completed one is cached.
  if [ "$(jq -r .status <<<"$json")" = completed ]; then
    printf '%s\n' "$json" | g12_cache_put "$dir/view.json" || true
  fi
  printf '%s\n' "$json"
}

g12_run_status() {
  local json
  json="$(g12_run_view "${1:-}")" || return 3
  jq -r '.status' <<<"$json"
}

g12_run_conclusion() {
  local json
  json="$(g12_run_view "${1:-}")" || return 3
  jq -r '.conclusion // ""' <<<"$json"
}

g12_run_done() {
  local status
  status="$(g12_run_status "${1:-}")" || return 3
  [ "$status" = completed ]
}

g12_run_steps() {
  local json
  json="$(g12_run_view "${1:-}")" || return 3
  jq -r --arg job "$G12_RUN_JOB" \
    '.jobs[]? | select(.name == $job) | .steps[]? | "\(.name)\t\(.conclusion // "")"' <<<"$json" ||
    { g12_refuse "the jobs of run ${1:-} could not be read"; return 3; }
}

g12_step_conclusion() {
  local steps name concl
  steps="$(g12_run_steps "${1:-}")" || return 3
  while IFS=$'\t' read -r name concl; do
    if [ "$name" = "${2:-}" ]; then
      printf '%s\n' "$concl"
      return 0
    fi
  done <<<"$steps"
}

g12_step_ran() {
  local concl
  concl="$(g12_step_conclusion "${1:-}" "${2:-}")" || return 3
  case "$concl" in
    success | failure) return 0 ;;
  esac
  return 1
}

g12_step_log() {
  local id="${1:-}" step="${2:-}" dir log tmp err msg lines
  dir="$(g12_run_dir "$id")" || return 3
  log="$dir/log.txt"
  if [ ! -f "$log" ]; then
    mkdir -p "$dir" || { g12_refuse "could not create '$dir'"; return 3; }
    tmp="$(mktemp "$log.XXXXXX")" && err="$(mktemp "$dir/log.err.XXXXXX")" ||
      { [ -z "${tmp:-}" ] || rm -f "$tmp"; g12_refuse "could not create a temporary file in '$dir'"; return 3; }
    if ! gh run view "$id" --repo "$G12_REPO" --log >"$tmp" 2>"$err" </dev/null; then
      msg="$(cat "$err")"
      rm -f "$tmp" "$err"
      case "$msg" in
        *"HTTP 410"* | *[Rr]etention*) return 2 ;;
      esac
      g12_refuse "gh run view $id --repo $G12_REPO --log failed: ${msg%%$'\n'*}"
      return 3
    fi
    rm -f "$err"
    mv -f "$tmp" "$log" || { rm -f "$tmp"; g12_refuse "could not write '$log'"; return 3; }
  fi
  # Each line is `<job>\t<step>\t<text>`; the step name goes through the environment, since awk -v
  # would read a backslash in it as an escape.
  lines="$(G12_AWK_JOB="$G12_RUN_JOB" G12_AWK_STEP="$step" awk -F'\t' '
    $1 == ENVIRON["G12_AWK_JOB"] && $2 == ENVIRON["G12_AWK_STEP"] {
      sub(/^[^\t]*\t[^\t]*\t/, ""); print
    }' "$log")" || { g12_refuse "awk could not read '$log'"; return 3; }
  [ -n "$lines" ] || return 4
  printf '%s\n' "$lines"
}

g12_artifact() {
  local id="${1:-}" dir json kind tmp err msg
  dir="$(g12_run_dir "$id")" || return 3
  if [ -d "$dir/harness-state" ]; then
    printf '%s\n' "$dir/harness-state"
    return 0
  fi
  json="$(gh api "repos/$G12_REPO/actions/runs/$id/artifacts" </dev/null)" ||
    { g12_refuse "gh api repos/$G12_REPO/actions/runs/$id/artifacts failed"; return 3; }
  # The upload step sets `overwrite: true`, so a run holds one; any unexpired copy is downloadable.
  kind="$(jq -r '[.artifacts[]? | select(.name == "harness-state")]
    | if length == 0 then "none" elif any(.[]; .expired != true) then "present" else "expired" end' \
    <<<"$json" 2>/dev/null)" ||
    { g12_refuse "gh api repos/$G12_REPO/actions/runs/$id/artifacts printed what jq cannot read"; return 3; }
  case "$kind" in
    none | expired)
      printf '%s\n' "$kind"
      return 0
      ;;
  esac
  mkdir -p "$dir" || { g12_refuse "could not create '$dir'"; return 3; }
  tmp="$(mktemp -d "$dir/harness-state.XXXXXX")" && err="$(mktemp "$dir/download.err.XXXXXX")" ||
    { [ -z "${tmp:-}" ] || rmdir "$tmp" 2>/dev/null; g12_refuse "could not create a download directory in '$dir'"; return 3; }
  if ! gh run download "$id" --repo "$G12_REPO" -n harness-state -D "$tmp" >/dev/null 2>"$err" </dev/null; then
    msg="$(cat "$err")"
    rm -f "$err"
    rmdir "$tmp" 2>/dev/null
    # Listed unexpired, then gone by the download: GitHub expired it in between.
    case "$msg" in
      *"HTTP 410"* | *[Ee]xpired*)
        printf 'expired\n'
        return 0
        ;;
    esac
    g12_refuse "gh run download $id --repo $G12_REPO -n harness-state failed: ${msg%%$'\n'*}"
    return 3
  fi
  rm -f "$err"
  mv "$tmp" "$dir/harness-state" || { g12_refuse "could not move '$tmp' to '$dir/harness-state'"; return 3; }
  printf '%s\n' "$dir/harness-state"
}

g12_evidence() {
  local row="${1:-}" text="${2:-}" dir path
  g12_row_field "$row" 1 >/dev/null || { g12_refuse "g12_evidence: row '$row' is not a row of G12_ROWS"; return 1; }
  dir="$(g12_scratch_dir)/evidence"
  path="$dir/$row.log"
  mkdir -p "$dir" || { g12_refuse "could not create '$dir'"; return 1; }
  # Appended, so a separator dates each grade's record.
  { printf -- '--- %s %s\n' "$row" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" && printf '%s\n' "$text"; } >>"$path" ||
    { g12_refuse "could not append to '$path'"; return 1; }
  printf '%s\n' "$path"
}
