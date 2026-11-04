#!/usr/bin/env bash
# grade-state.sh — the grades of the bundle rows SB2 and SB4 and the default-branch row JS3 of
# docs/sandbox-verification.md -> ## 10., read from the planted runs through runs.sh, and a `not run`
# line naming the note for every `hand` row (JS3N, SB3, RJ3), so `grade` covers every row of ## 10.
# grade-plant.sh's g12_grade_cmd calls g12_grade_state; this file uses that file's arm and fold helpers.
#
#   SB2   never `pass`: its PAUSE_PROGRESS.md arm and remote_status.json variant are hand steps. `fail`
#         when a planted-arm check fails, `expired` when a log or the artifact is, else `not run`.
#   SB4   the bundle half of SB2's artifact: no link and no token is `pass`.
#   JS3   only the watchdog lines that reach the `Run the harness` step log, and status.json; then one
#         `source` line for the "from a temporary directory" clause.
#
#   g12_grade_state   SB2, SB4, JS3 and each hand row, each when selected
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array.

G12_STEP_SAVE="Save the state bundle"
G12_STEP_RESTORE="Restore the previous job's state"
G12_SB4_OPTIONAL="optional half: a hand step (throwaway upload workflow, background process)"

# ---------------------------------------------------------------------------------------------
# SB2's planted run, read once for SB2 and SB4. G12_SB2_ART is `none`, `expired`, `error` (a failed
# gh call) or the downloaded directory; it stays empty when the run is not done, with the reason in
# G12_ARM_RESULT / G12_ARM_EVIDENCE.
G12_SB2_READ=0
G12_SB2_ID=""
G12_SB2_BRANCH=""
G12_SB2_NOTDONE_RESULT=""
G12_SB2_NOTDONE_WHY=""
G12_SB2_ART=""
G12_SB2_TOKEN=""
G12_SB2_LINKS=""
G12_SB2_HITS=""

g12_sb2_read() {
  [ "$G12_SB2_READ" -eq 0 ] || return 0
  G12_SB2_READ=1
  if ! g12_arm_run SB2 clarifications; then
    G12_SB2_NOTDONE_RESULT="$G12_ARM_RESULT"
    G12_SB2_NOTDONE_WHY="$G12_ARM_EVIDENCE"
    return 0
  fi
  G12_SB2_ID="$G12_ARM_ID"
  G12_SB2_BRANCH="$G12_ARM_BRANCH"
  G12_SB2_TOKEN="$(g12_state_get '.tokens.SB2 // empty')" || { g12_exit_raise 3; G12_SB2_TOKEN=""; }
  G12_SB2_ART="$(g12_artifact "$G12_SB2_ID")" || { g12_exit_raise 3; G12_SB2_ART=error; }
  case "$G12_SB2_ART" in
    none | expired | error) return 0 ;;
  esac
  G12_SB2_LINKS="$(find "$G12_SB2_ART" -type l 2>/dev/null)"
  [ -z "$G12_SB2_TOKEN" ] ||
    G12_SB2_HITS="$(grep -r -l -F -- "$G12_SB2_TOKEN" "$G12_SB2_ART" 2>/dev/null)"
}

# g12_sb2_bundle — the bundle-half verdict, shared by SB2's artifact clause and SB4.
g12_sb2_bundle() {
  if [ -z "$G12_SB2_ID" ]; then
    g12_arm_set "$G12_SB2_NOTDONE_RESULT" "SB2's planted run: $G12_SB2_NOTDONE_WHY"
    return
  fi
  case "$G12_SB2_ART" in
    error) g12_arm_set "not run" "a gh call reading run $G12_SB2_ID's artifact failed (named on stderr)"; return ;;
    expired) g12_arm_set expired "run $G12_SB2_ID's harness-state artifact is expired: re-take the step"; return ;;
    none) g12_arm_set "not run" "run $G12_SB2_ID has no harness-state artifact"; return ;;
  esac
  if [ -n "$G12_SB2_LINKS" ]; then
    g12_arm_set fail "run $G12_SB2_ID's harness-state artifact holds a link: ${G12_SB2_LINKS%%$'\n'*}" \
      "links:"$'\n'"$G12_SB2_LINKS"$'\n'"token files:"$'\n'"$G12_SB2_HITS"
    return
  fi
  if [ -z "$G12_SB2_TOKEN" ]; then
    g12_arm_set "not run" "the state file records no tokens.SB2, so run $G12_SB2_ID's artifact was not searched for it"
    return
  fi
  if [ -n "$G12_SB2_HITS" ]; then
    g12_arm_set fail "run $G12_SB2_ID's harness-state artifact holds the SB2 token: ${G12_SB2_HITS%%$'\n'*}" \
      "token files:"$'\n'"$G12_SB2_HITS"
    return
  fi
  g12_arm_set pass "run $G12_SB2_ID's harness-state artifact holds no link and no token"
}

# ---------------------------------------------------------------------------------------------
# SB2. Each clause is one arm of a fold; the fold's verdict is never printed as `pass`.
#
# The skip line is hr_remote_copy_tree's (cli/templates/scripts/lib/harness-run-lib.sh), run by
# hr_remote_bundle_write over the clarifications/<branch>/ directory source, which verb_save in
# cli/templates/scripts/remote-run.sh calls. It names the link itself in both fields. `remote-run.sh:
# save: skipped …` is printed only for a linked registry or remote_status.json, neither planted here.
G12_SB2_SKIP_PREFIX="remote state bundle: skipped "
G12_SB2_SKIP_SUFFIX=" is a symbolic link"

g12_sb2_save_clause() {
  local concl leaf line body p1 p2
  G12_ARM_ID="$G12_SB2_ID"
  concl="$(g12_step_conclusion "$G12_SB2_ID" "$G12_STEP_SAVE")" || { g12_arm_gh_failed; return; }
  case "$concl" in
    success) ;;
    failure) g12_arm_set fail "$G12_STEP_SAVE concluded failure in run $G12_SB2_ID"; return ;;
    *) g12_arm_set "not run" "$G12_STEP_SAVE did not run in run $G12_SB2_ID (${concl:-absent})"; return ;;
  esac
  g12_arm_log "$G12_STEP_SAVE" || return 0
  leaf="/clarifications/$G12_SB2_BRANCH/gate12-link.md"
  while IFS= read -r line; do
    body="${line#*"$G12_SB2_SKIP_PREFIX"}"
    case "$body" in *"$G12_SB2_SKIP_SUFFIX") ;; *) continue ;; esac
    body="${body%"$G12_SB2_SKIP_SUFFIX"}"
    p1="${body%%: *}"
    p2="${body#*: }"
    if [ "$p1" = "$p2" ]; then
      case "$p1" in
        *"$leaf")
          g12_arm_set pass "$G12_STEP_SAVE concluded success in run $G12_SB2_ID and skipped $p1 as a symbolic link"
          return
          ;;
      esac
    fi
  done <<<"$(printf '%s\n' "$G12_ARM_LOG" | tr -d '\r' | grep -F -- "$G12_SB2_SKIP_PREFIX")"
  g12_arm_set fail "$G12_STEP_SAVE's log in run $G12_SB2_ID carries no ${G12_SB2_SKIP_PREFIX}<path>: <path>${G12_SB2_SKIP_SUFFIX} line for a path ending $leaf" \
    "$G12_ARM_LOG"
}

# The next job is the first `harness run <branch>` run created after the planted one.
g12_sb2_restore_clause() {
  local json next log rc
  json="$(gh run list --repo "$G12_REPO" --workflow harness-run.yml --branch "$G12_SB2_BRANCH" \
    --json databaseId,displayTitle --limit 20 </dev/null)" ||
    { g12_refuse "gh run list --repo $G12_REPO --branch $G12_SB2_BRANCH failed"; G12_ARM_ID="$G12_SB2_ID"; g12_arm_gh_failed; return; }
  next="$(jq -r --arg t "harness run $G12_SB2_BRANCH" --argjson id "$G12_SB2_ID" \
    '[.[]? | select(.displayTitle == $t and .databaseId > $id) | .databaseId] | sort | first // empty' \
    <<<"$json" 2>/dev/null)" ||
    { g12_refuse "gh run list --repo $G12_REPO --branch $G12_SB2_BRANCH printed what jq cannot read"; G12_ARM_ID="$G12_SB2_ID"; g12_arm_gh_failed; return; }
  if [ -z "$next" ]; then
    g12_arm_set "not run" "no later harness run $G12_SB2_BRANCH run"
    return
  fi
  G12_ARM_ID="$next"
  g12_run_done "$next"
  rc=$?
  case "$rc" in
    0) ;;
    1) g12_arm_set "not run" "the next job, run $next, is not completed"; return ;;
    *) g12_arm_gh_failed; return ;;
  esac
  g12_step_ran "$next" "$G12_STEP_RESTORE"
  rc=$?
  case "$rc" in
    0) ;;
    1) g12_arm_set "not run" "$G12_STEP_RESTORE did not run in the next job, run $next"; return ;;
    *) g12_arm_gh_failed; return ;;
  esac
  g12_arm_log "$G12_STEP_RESTORE" || return 0
  log="$G12_ARM_LOG"
  # verb_restore's line (cli/templates/scripts/remote-run.sh).
  if printf '%s\n' "$log" | grep -q -F -- "restored the bundle of run $G12_SB2_ID"; then
    g12_arm_set pass "the next job, run $next, restored the bundle of run $G12_SB2_ID"
  else
    g12_arm_set fail "$G12_STEP_RESTORE in the next job, run $next, carries no restored the bundle of run $G12_SB2_ID line" "$log"
  fi
}

g12_grade_sb2() {
  local note path evidence result restore=""
  note="$(g12_row_field SB2 5)"
  g12_sb2_read
  if [ -z "$G12_SB2_ID" ]; then
    g12_arm_set "$G12_SB2_NOTDONE_RESULT" "$G12_SB2_NOTDONE_WHY"
    g12_fold_reset 1
    g12_fold_add clarifications
  else
    g12_fold_reset 2
    g12_sb2_save_clause
    g12_fold_add "$G12_STEP_SAVE"
    g12_sb2_bundle
    g12_fold_add artifact
    g12_sb2_restore_clause
    # A next job that never ran is reported `not run` and leaves the planted arm's verdict standing.
    if [ "$G12_ARM_RESULT" = "not run" ]; then
      restore="next job not run: $G12_ARM_EVIDENCE"
      G12_FOLD_RECORD="${G12_FOLD_RECORD}[next job] not run: $G12_ARM_EVIDENCE"$'\n'
    else
      g12_fold_add "next job"
    fi
  fi

  if [ "$G12_FOLD_RESULT" = pass ]; then
    evidence="planted arm (clarifications, run $G12_SB2_ID) passed: $G12_FOLD_PASSES"
    result="not run"
  else
    evidence="planted arm (clarifications${G12_SB2_ID:+, run $G12_SB2_ID}) $G12_FOLD_RESULT: $G12_FOLD_EVIDENCE"
    result="$G12_FOLD_RESULT"
  fi
  [ -z "$restore" ] || evidence="$evidence; $restore"
  evidence="$evidence; the PAUSE_PROGRESS.md arm and the remote_status.json variant are hand steps: $note"
  if path="$(g12_evidence SB2 "$G12_FOLD_RECORD")"; then
    evidence="$evidence; record in $path"
  else
    evidence="$evidence; the record could not be written"
  fi
  g12_result_line SB2 "$result" "$evidence"
}

g12_grade_sb4() {
  local path evidence
  g12_sb2_read
  g12_sb2_bundle
  evidence="$G12_ARM_EVIDENCE"
  if [ "$G12_ARM_RESULT" = fail ]; then
    if path="$(g12_evidence SB4 "$G12_ARM_RECORD")"; then
      evidence="$evidence; record in $path"
    else
      evidence="$evidence; the record could not be written"
    fi
  fi
  g12_result_line SB4 "$G12_ARM_RESULT" "$evidence; $G12_SB4_OPTIONAL"
}

# ---------------------------------------------------------------------------------------------
# JS3. check_stalled_runs (cli/templates/scripts/autonomous-watcher.sh) runs stall_job_surfaces_ok
# >>"$log_path", so the doctor report goes to the per-branch run log (the bundle's run.log), never to
# the step log; only the watcher's `log` lines, tee'd to stdout, reach `Run the harness`. The two
# outcome lines matched below are check_stalled_runs's own.
G12_JS3_SURFACE_REASON="the branch's own commits change a job surface, or that could not be checked"
G12_JS3_ART=""

g12_js3_arm() {
  local b concl lines failed reset why status
  G12_JS3_ART=""
  if ! g12_arm_run JS3 stall; then
    case "$G12_ARM_EVIDENCE" in
      "no recorded run"*) g12_arm_set "not run" "no recorded run: take the default-branch leg first" ;;
    esac
    return 0
  fi
  b="$G12_ARM_BRANCH"
  concl="$(g12_step_conclusion "$G12_ARM_ID" "$G12_STEP_HARNESS")" || { g12_arm_gh_failed; return; }
  case "$concl" in
    success | failure) ;;
    *) g12_arm_set "not run" "$G12_STEP_HARNESS did not run in run $G12_ARM_ID (${concl:-absent})"; return ;;
  esac
  g12_arm_log "$G12_STEP_HARNESS" || return 0
  lines="$(printf '%s\n' "$G12_ARM_LOG" | tr -d '\r' | grep -F -- "stall-watchdog: '$b'")"
  if [ -z "$lines" ]; then
    g12_arm_set "not run" "no stall-watchdog: '$b' line in run $G12_ARM_ID's $G12_STEP_HARNESS log: no stall happened, so the arm was not exercised"
    return
  fi

  failed="$(printf '%s\n' "$lines" | grep -F -- "stall-watchdog: '$b' -> failed (" | head -n 1)"
  if [ -n "$failed" ]; then
    why="${failed#*"-> failed ("}"
    why="${why%)}"
    case "$why" in
      *"$G12_JS3_SURFACE_REASON"*)
        g12_arm_set fail "run $G12_ARM_ID's watchdog refused the reset on its job-surfaces check: $why" "$lines" ;;
      *)
        g12_arm_set fail "run $G12_ARM_ID's watchdog gave the run up: $why" "$lines" ;;
    esac
    return
  fi

  reset="$(printf '%s\n' "$lines" | grep -F -- "stall-watchdog: '$b' -> reset to the last commit and resume (restart #" | head -n 1)"
  if [ -z "$reset" ]; then
    g12_arm_set "not run" "run $G12_ARM_ID's watchdog lines for '$b' carry no outcome line: the stall never reached the kill" "$lines"
    return
  fi
  reset="stall-watchdog:${reset#*stall-watchdog:}"

  G12_JS3_ART="$(g12_artifact "$G12_ARM_ID")" || { G12_JS3_ART=error; g12_arm_gh_failed; return; }
  case "$G12_JS3_ART" in
    expired) g12_arm_set expired "run $G12_ARM_ID logged $reset, but its harness-state artifact is expired, so its status was not read" "$lines"; return ;;
    none) g12_arm_set "not run" "run $G12_ARM_ID logged $reset, but has no harness-state artifact, so its status was not read" "$lines"; return ;;
  esac
  status="$(jq -r '.status // empty' "$G12_JS3_ART/status.json" 2>/dev/null)" ||
    { g12_arm_set fail "$G12_JS3_ART/status.json is absent or does not parse" "$lines"; return; }
  if [ "$status" = failed ]; then
    g12_arm_set fail "run $G12_ARM_ID logged $reset, but its status.json status is failed" "$lines"
    return
  fi
  g12_arm_set pass "run $G12_ARM_ID: $reset; status.json status ${status:-none}"
}

g12_grade_js3() {
  local unconfirmed departure="" extra=""
  unconfirmed="$(g12_state_get '[.runs[] | select(.row == "JS3" and .arm == "stall")] | last
    | if . == null then false else (.stall_values_unconfirmed // false) end')" || unconfirmed=false
  [ "$unconfirmed" != true ] ||
    departure="stall_values_unconfirmed: the run did not start within the default-branch leg's wait, so the lowered STALL_WARN_SECS and STALL_KILL_SECS may not have reached the job"

  g12_fold_reset 1
  g12_js3_arm
  g12_fold_add stall

  # The artifact's run.log carries the doctor report: evidence only, never a verdict check.
  if [ "$G12_FOLD_RESULT" != pass ] && [ -n "$G12_ARM_ID" ] && [ -z "$G12_JS3_ART" ] &&
    g12_run_done "$G12_ARM_ID" 2>/dev/null; then
    G12_JS3_ART="$(g12_artifact "$G12_ARM_ID")" || { g12_exit_raise 3; G12_JS3_ART=error; }
  fi
  if [ "$G12_FOLD_RESULT" != pass ]; then
    case "$G12_JS3_ART" in
      "") ;;
      none | expired | error) extra="run.log (doctor report, evidence only): artifact $G12_JS3_ART"$'\n' ;;
      *)
        if [ -f "$G12_JS3_ART/run.log" ]; then
          extra="run.log (doctor report, evidence only):"$'\n'"$(cat "$G12_JS3_ART/run.log")"$'\n'
        else
          extra="run.log (doctor report, evidence only): absent from $G12_JS3_ART"$'\n'
        fi
        ;;
    esac
  fi
  g12_fold_print JS3 "$extra" "$departure"
  g12_result_line JS3 source \
    "cli/templates/scripts/autonomous-watcher.sh stall_job_surfaces_ok: mktemp -d then cd into it before doctor --job-surfaces"
}

# ---------------------------------------------------------------------------------------------
g12_grade_state() {
  local row path
  g12_need g12_arm_run g12_arm_log g12_fold_print g12_artifact g12_step_log g12_evidence
  path="$(g12_state_path)"
  G12_SB2_READ=0
  for row in SB2 SB4 JS3; do
    g12_row_selected "$row" || continue
    if [ ! -f "$path" ]; then
      g12_result_line "$row" "not run" "no state file at $path: run plant first"
      continue
    fi
    if ! g12_state_repo_check "$path"; then
      g12_exit_raise 3
      g12_result_line "$row" "not run" "the state file at $path is not this repository's"
      continue
    fi
    case "$row" in
      SB2) g12_grade_sb2 ;;
      SB4) g12_grade_sb4 ;;
      JS3) g12_grade_js3 ;;
    esac
  done
  for row in $(g12_row_names); do
    [ "$(g12_row_field "$row" 3)" = hand ] || continue
    g12_row_selected "$row" || continue
    g12_result_line "$row" "not run" "hand step: $(g12_row_field "$row" 5)"
  done
}
