#!/usr/bin/env bash
# grade-plant.sh — the `grade` subcommand's dispatch (g12_grade_cmd), and the grades of the three
# rows a pushed plant decides from its own job: JS1, JS4 and RJ2 of docs/sandbox-verification.md ->
# ## 10. Each reads its runs through runs.sh and nothing else, and prints one result line per row.
#
# THE DISPATCH, restated by Tasks 8 and 13:
#   without --full-run   g12_grade_full_run is never called. Each selected FR row prints `not run`
#                        with `needs --full-run <branch>`. Then each grader of G12_GRADERS, when
#                        defined, grades its own selected rows; a selected row whose grader is not
#                        defined, or that no grader owns, prints `not run` with `grader not implemented`.
#   --full-run <branch>  only g12_grade_full_run <branch>, which prints FR1-FR7; when it is not
#                        defined, each FR row prints `not run` with `grader not implemented`.
#   --full-run and --row a usage error, exit 1, no result line.
# A selected row is one named by --row, or every row when none is.
#
# ARMS FOLD INTO ONE LINE. `fail` if any arm fails, else `not run` or `expired` if any arm is, else
# `pass`; the evidence names the deciding arm. A row that does not pass appends its full record
# through g12_evidence and names that file; a passing row writes none, except JS4's Bootstrap the
# checkout marker lines, a reading kept in full on a pass too. A failed gh call makes its arm
# `not run` and raises 3.
#
#   g12_row_selected <row>   0 when <row> is selected
#   g12_grade_plant          JS1, JS4 and RJ2, each when selected
#   g12_grade_cmd            the `grade` subcommand
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array.

# One line per grader: its function, then the rows it prints. The FR rows are g12_grade_full_run's.
G12_GRADERS="g12_grade_plant JS1 JS4 RJ2
g12_grade_state SB2 SB4 JS3 JS3N SB3 RJ3"

# The `run` job's step names, from cli/templates/github/workflows/harness-run.yml.
G12_STEP_REFUSE="Refuse a branch that changed the job's own files"
G12_STEP_CONFIG="Read the configuration"
G12_STEP_BOOTSTRAP="Bootstrap the checkout"
G12_STEP_HARNESS="Run the harness"
G12_JS4_STEPS="$G12_STEP_REFUSE
Install the claude CLI when absent
Generate the job's permission profile
Preflight with doctor"

g12_row_selected() {
  [ -n "$G12_ROWS_SELECTED" ] || return 0
  case " $G12_ROWS_SELECTED " in
    *" $1 "*) return 0 ;;
  esac
  return 1
}

# ---------------------------------------------------------------------------------------------
# One arm's verdict, then the fold. g12_arm_set <result> <summary> [<record>]; the record is what
# g12_evidence keeps when the row does not pass.
G12_ARM_RESULT=""
G12_ARM_EVIDENCE=""
G12_ARM_RECORD=""
G12_ARM_BRANCH=""
G12_ARM_ID=""

g12_arm_set() {
  G12_ARM_RESULT="$1"
  G12_ARM_EVIDENCE="$2"
  G12_ARM_RECORD="${3:-}"
}

g12_arm_gh_failed() {
  g12_exit_raise 3
  g12_arm_set "not run" "a gh call reading run $G12_ARM_ID failed (named on stderr)"
}

G12_FOLD_RESULT=""
G12_FOLD_EVIDENCE=""
G12_FOLD_PASSES=""
G12_FOLD_RECORD=""
G12_FOLD_ARMS=0

g12_fold_reset() {
  G12_FOLD_RESULT=pass
  G12_FOLD_EVIDENCE=""
  G12_FOLD_PASSES=""
  G12_FOLD_RECORD=""
  G12_FOLD_ARMS="$1"
}

g12_fold_add() {
  local arm="$1" said="$G12_ARM_EVIDENCE"
  [ "$G12_FOLD_ARMS" -le 1 ] || said="$arm: $said"
  G12_FOLD_RECORD="${G12_FOLD_RECORD}[$arm] $G12_ARM_RESULT: $G12_ARM_EVIDENCE"$'\n'
  [ -z "$G12_ARM_RECORD" ] || G12_FOLD_RECORD="${G12_FOLD_RECORD}${G12_ARM_RECORD}"$'\n'
  case "$G12_ARM_RESULT" in
    pass) G12_FOLD_PASSES="${G12_FOLD_PASSES:+$G12_FOLD_PASSES; }$said" ;;
    fail)
      if [ "$G12_FOLD_RESULT" != fail ]; then
        G12_FOLD_RESULT=fail
        G12_FOLD_EVIDENCE="$said"
      fi
      ;;
    *)
      if [ "$G12_FOLD_RESULT" = pass ]; then
        G12_FOLD_RESULT="$G12_ARM_RESULT"
        G12_FOLD_EVIDENCE="$said"
      fi
      ;;
  esac
}

# g12_fold_print <row> [<extra record>] [<departure>] — the row's one line. <extra record> is appended
# to a non-passing row's record; the caller writes a passing row's kept reading itself.
g12_fold_print() {
  local row="$1" extra="${2:-}" departure="${3:-}" path evidence
  if [ "$G12_FOLD_RESULT" = pass ]; then
    g12_result_line "$row" pass "$G12_FOLD_PASSES" "$departure"
    return
  fi
  evidence="$G12_FOLD_EVIDENCE"
  if path="$(g12_evidence "$row" "${G12_FOLD_RECORD}${extra}")"; then
    evidence="$evidence; record in $path"
  else
    evidence="$evidence; the record could not be written"
  fi
  g12_result_line "$row" "$G12_FOLD_RESULT" "$evidence" "$departure"
}

# g12_arm_run <row> <arm> — sets G12_ARM_BRANCH and G12_ARM_ID from the state file's newest runs[]
# entry for the arm, and returns 0 once that run is completed; otherwise sets the arm's verdict.
g12_arm_run() {
  local row="$1" arm="$2" line status
  G12_ARM_BRANCH=""
  G12_ARM_ID=""
  line="$(g12_state_get '[.runs[] | select(.row == $r and .arm == $a)] | last
    | if . == null then "" else "\(.branch)\t\(.run_id // "null")" end' --arg r "$row" --arg a "$arm")" ||
    { g12_exit_raise 3; g12_arm_set "not run" "the state file could not be read"; return 1; }
  if [ -z "$line" ]; then
    g12_arm_set "not run" "no recorded run: plant $row first"
    return 1
  fi
  IFS=$'\t' read -r G12_ARM_BRANCH G12_ARM_ID <<<"$line"
  if [ "$G12_ARM_ID" = null ]; then
    G12_ARM_ID=""
    g12_arm_set "not run" "the run of $G12_ARM_BRANCH was never found (run_id null)"
    return 1
  fi
  status="$(g12_run_status "$G12_ARM_ID")" || { g12_arm_gh_failed; return 1; }
  if [ "$status" != completed ]; then
    g12_arm_set "not run" "run $G12_ARM_ID is $status"
    return 1
  fi
}

# g12_arm_log <step> — the step's lines into G12_ARM_LOG; otherwise sets the arm's verdict.
G12_ARM_LOG=""
g12_arm_log() {
  local rc
  G12_ARM_LOG="$(g12_step_log "$G12_ARM_ID" "$1")"
  rc=$?
  case "$rc" in
    0) return 0 ;;
    2) g12_arm_set expired "the log of run $G12_ARM_ID is gone: re-take the step" ;;
    4) g12_arm_set "not run" "the log of run $G12_ARM_ID has no line attributed to $1" ;;
    *) g12_arm_gh_failed ;;
  esac
  return 1
}

g12_trim() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

# ---------------------------------------------------------------------------------------------
# JS1: a plumbing commit of a job surface, refused at the refusal step.
g12_js1_arm() {
  local arm="$1" path concl steps name later="" seen=0 errs named art out rc line state
  case "$arm" in
    settings) path=.claude/settings.json ;;
    remote-run) path="$G12_SCRIPTS_DIR/remote-run.sh" ;;
    *) g12_arm_set fail "JS1 has no arm '$arm'"; return ;;
  esac
  g12_arm_run JS1 "$arm" || return 0

  concl="$(g12_step_conclusion "$G12_ARM_ID" "$G12_STEP_REFUSE")" || { g12_arm_gh_failed; return; }
  case "$concl" in
    failure) ;;
    success) g12_arm_set fail "$G12_STEP_REFUSE concluded success in run $G12_ARM_ID: the branch was not refused"; return ;;
    *) g12_arm_set "not run" "$G12_STEP_REFUSE did not run in run $G12_ARM_ID (${concl:-absent})"; return ;;
  esac
  concl="$(g12_run_conclusion "$G12_ARM_ID")" || { g12_arm_gh_failed; return; }
  [ "$concl" = failure ] ||
    { g12_arm_set fail "run $G12_ARM_ID concluded '$concl', not failure"; return; }

  # harness-run.yml THE JOB'S OWN FILES: the refusal leaves SCRIPTS_DIR unset, which only `Read the
  # configuration` sets, so it and every step after it must be skipped. The runner's own `Post …`
  # and `Complete job` steps are not the workflow's.
  steps="$(g12_run_steps "$G12_ARM_ID")" || { g12_arm_gh_failed; return; }
  while IFS=$'\t' read -r name concl; do
    [ "$name" != "$G12_STEP_CONFIG" ] || seen=1
    [ "$seen" -eq 1 ] || continue
    case "$name" in
      "Post "* | "Complete job") continue ;;
    esac
    [ "$concl" = skipped ] || later="${later}$name: ${concl:-in progress}"$'\n'
  done <<<"$steps"
  [ "$seen" -eq 1 ] ||
    { g12_arm_set fail "run $G12_ARM_ID lists no step $G12_STEP_CONFIG" "$steps"; return; }
  if [ -n "$later" ]; then
    g12_arm_set fail "a step after the refusal ran in run $G12_ARM_ID: ${later%%$'\n'*}" "$later"
    return
  fi

  art="$(g12_artifact "$G12_ARM_ID")" || { g12_arm_gh_failed; return; }
  case "$art" in
    none) ;;
    expired) g12_arm_set expired "run $G12_ARM_ID's harness-state artifact is expired"; return ;;
    *) g12_arm_set fail "run $G12_ARM_ID uploaded a harness-state artifact, kept in $art"; return ;;
  esac

  g12_arm_log "$G12_STEP_REFUSE" || return 0
  # The step's `run:` block is echoed into its log, `echo "::error::…"` included, and any failing
  # step logs `##[error]Process completed…`: so the annotation is that step's own message, on a
  # line that is not the echo.
  errs="$(printf '%s\n' "$G12_ARM_LOG" | grep -F -e '::error::' -e '##[error]' |
    grep -F "this branch's own commits changed files the job runs or loads" | grep -v -F 'echo "::error::')"
  [ -n "$errs" ] ||
    { g12_arm_set fail "$G12_STEP_REFUSE's log in run $G12_ARM_ID carries no ::error:: annotation" "$G12_ARM_LOG"; return; }
  named="$(printf '%s\n' "$G12_ARM_LOG" | grep -F -- "$path")"
  [ -n "$named" ] ||
    { g12_arm_set fail "$G12_STEP_REFUSE's log in run $G12_ARM_ID does not name $path" "$G12_ARM_LOG"; return; }

  # status_from_github prints `  state: <x>` (printf '  state: %s\n' "$RS_STATE") after `remote-run.sh:
  # no local record; state from GitHub (newest run):`; verb_status reaches it when the branch has no
  # local record, as a refused branch never synced has none (cli/templates/scripts/remote-run.sh).
  # verb_status's local-record arm prints `  status: <x>`, which this does not match.
  out="$(cd "$G12_ROOT" && bash "$G12_ROOT/$G12_SCRIPTS_DIR/remote-run.sh" status "$G12_ARM_BRANCH" 2>&1 </dev/null)"
  rc=$?
  [ "$rc" -eq 0 ] ||
    { g12_arm_set fail "remote-run.sh status $G12_ARM_BRANCH exited $rc" "$out"; return; }
  line="$(printf '%s\n' "$out" | grep -E '^[[:space:]]*state:[[:space:]]*' | head -n 1)"
  [ -n "$line" ] || { g12_arm_set fail "remote-run.sh status printed no state" "$out"; return; }
  state="$(g12_trim "${line#*state:}")"
  [ "$state" = failed ] ||
    { g12_arm_set fail "remote-run.sh status $G12_ARM_BRANCH: $(g12_trim "$line")" "$out"; return; }

  g12_arm_set pass "run $G12_ARM_ID refused at $G12_STEP_REFUSE naming $path, every later step skipped, no harness-state artifact, status state: failed"
}

g12_grade_js1() {
  local arms arm
  arms="$(g12_row_arms JS1)"
  g12_fold_reset "$(printf '%s\n' "$arms" | grep -c .)"
  for arm in $arms; do
    g12_js1_arm "$arm"
    g12_fold_add "$arm"
  done
  g12_fold_print JS1 "" \
    "read through status, not sync: sync refuses a branch with no local record (remote-run.sh header exit map, exit 2)"
}

# ---------------------------------------------------------------------------------------------
# JS4: a branch's .npmrc or node_modules/ must not load the marker in the job's own npm steps.
G12_JS4_RESIDUAL=""

g12_js4_arm() {
  local arm="$1" step concl ran=1 missing="" found="" lines
  g12_arm_run JS4 "$arm" || return 0
  while IFS= read -r step; do
    concl="$(g12_step_conclusion "$G12_ARM_ID" "$step")" || { g12_arm_gh_failed; return; }
    case "$concl" in
      success | failure) ;;
      *) ran=0; missing="${missing:+$missing; }$step (${concl:-absent})" ;;
    esac
  done <<<"$G12_JS4_STEPS"

  while IFS= read -r step; do
    case "; $missing" in *"; $step ("*) continue ;; esac
    g12_arm_log "$step" || return 0
    lines="$(printf '%s\n' "$G12_ARM_LOG" | grep -F -- "$G12_JS4_MARKER")"
    [ -z "$lines" ] || found="${found}$step:"$'\n'"$lines"$'\n'
  done <<<"$G12_JS4_STEPS"

  # docs/cli.md §6, residual 1: Bootstrap the checkout's install and build read the branch's files.
  if g12_step_ran "$G12_ARM_ID" "$G12_STEP_BOOTSTRAP"; then
    g12_arm_log "$G12_STEP_BOOTSTRAP" || return 0
    lines="$(printf '%s\n' "$G12_ARM_LOG" | grep -F -- "$G12_JS4_MARKER")"
    [ -z "$lines" ] || G12_JS4_RESIDUAL="${G12_JS4_RESIDUAL}[$arm] run $G12_ARM_ID $G12_STEP_BOOTSTRAP:"$'\n'"$lines"$'\n'
  fi

  if [ -n "$found" ]; then
    g12_arm_set fail "the marker loaded in run $G12_ARM_ID: ${found%%:$'\n'*}" "$found"
  elif [ "$ran" -eq 0 ]; then
    g12_arm_set "not run" "did not run in run $G12_ARM_ID: $missing"
  else
    g12_arm_set pass "no marker in run $G12_ARM_ID's four checked steps"
  fi
}

g12_grade_js4() {
  local arms arm n path extra=""
  arms="$(g12_row_arms JS4)"
  G12_JS4_RESIDUAL=""
  g12_fold_reset "$(printf '%s\n' "$arms" | grep -c .)"
  for arm in $arms; do
    g12_js4_arm "$arm"
    g12_fold_add "$arm"
  done
  if [ "$G12_FOLD_RESULT" != pass ]; then
    [ -z "$G12_JS4_RESIDUAL" ] || extra="residual, not a failure:"$'\n'"$G12_JS4_RESIDUAL"
    g12_fold_print JS4 "$extra"
  elif [ -z "$G12_JS4_RESIDUAL" ]; then
    g12_fold_print JS4
  else
    n="$(printf '%s' "$G12_JS4_RESIDUAL" | grep -F -c -- "$G12_JS4_MARKER")"
    if path="$(g12_evidence JS4 "$G12_JS4_RESIDUAL")"; then
      g12_result_line JS4 pass "residual: $n marker line(s) in $G12_STEP_BOOTSTRAP, kept in $path"
    else
      g12_result_line JS4 pass "residual: $n marker line(s) in $G12_STEP_BOOTSTRAP, which could not be kept"
    fi
  fi
}

# ---------------------------------------------------------------------------------------------
# RJ2: a branch whose profile fails the launch check. Its one plant is itself a job surface, so the
# refusal step normally ends it first (plants.sh, g12_plant_rj2).
g12_rj2_arm() {
  local arm="$1" concl launch notl art status
  g12_arm_run RJ2 "$arm" || return 0
  concl="$(g12_step_conclusion "$G12_ARM_ID" "$G12_STEP_REFUSE")" || { g12_arm_gh_failed; return; }
  case "$concl" in
    success) ;;
    failure)
      g12_arm_set "not run" "refused before launch: .claude/settings.autonomous.json is a job surface (writeProtection.ts protectedPaths, PROFILE_PATH)" \
        "$G12_STEP_REFUSE concluded failure in run $G12_ARM_ID"
      return
      ;;
    *) g12_arm_set "not run" "$G12_STEP_REFUSE did not run in run $G12_ARM_ID (${concl:-absent})"; return ;;
  esac
  concl="$(g12_step_conclusion "$G12_ARM_ID" "$G12_STEP_HARNESS")" || { g12_arm_gh_failed; return; }
  case "$concl" in
    success | failure) ;;
    *) g12_arm_set "not run" "$G12_STEP_HARNESS did not run in run $G12_ARM_ID (${concl:-absent})"; return ;;
  esac
  g12_arm_log "$G12_STEP_HARNESS" || return 0

  # run_job logs `job: launching run for '<branch>'` and then calls spawn_engine, whose launch check
  # refuses through spawn_refuse's `not launching '<branch>': <reason>`
  # (cli/templates/scripts/autonomous-watcher.sh). A launch line is a fail only with no refusal after it.
  launch="$(printf '%s\n' "$G12_ARM_LOG" | grep -n -F -- "job: launching run for '$G12_ARM_BRANCH'" | tail -n 1)"
  notl="$(printf '%s\n' "$G12_ARM_LOG" | grep -n -F -- "not launching '$G12_ARM_BRANCH': " | tail -n 1)"
  if [ -z "$notl" ] || { [ -n "$launch" ] && [ "${notl%%:*}" -lt "${launch%%:*}" ]; }; then
    if [ -n "$launch" ]; then
      g12_arm_set fail "run $G12_ARM_ID launched: ${launch#*:}" "$G12_ARM_LOG"
    else
      g12_arm_set fail "$G12_STEP_HARNESS in run $G12_ARM_ID carries no not launching '$G12_ARM_BRANCH' line" "$G12_ARM_LOG"
    fi
    return
  fi

  art="$(g12_artifact "$G12_ARM_ID")" || { g12_arm_gh_failed; return; }
  case "$art" in
    expired) g12_arm_set expired "run $G12_ARM_ID's harness-state artifact is expired: re-take the step"; return ;;
    none) g12_arm_set "not run" "run $G12_ARM_ID has no harness-state artifact, so its recorded status was not read"; return ;;
  esac
  status="$(jq -r '.status // empty' "$art/status.json" 2>/dev/null)" ||
    { g12_arm_set fail "$art/status.json is absent or does not parse" "${notl#*:}"; return; }
  [ "$status" = failed ] ||
    { g12_arm_set fail "$art/status.json status is '${status:-none}', not failed" "${notl#*:}"; return; }
  g12_arm_set pass "${notl#*:}; status.json status failed"
}

g12_grade_rj2() {
  local arms arm
  arms="$(g12_row_arms RJ2)"
  g12_fold_reset "$(printf '%s\n' "$arms" | grep -c .)"
  for arm in $arms; do
    g12_rj2_arm "$arm"
    g12_fold_add "$arm"
  done
  g12_fold_print RJ2
}

# ---------------------------------------------------------------------------------------------
g12_grade_plant() {
  local row path
  path="$(g12_state_path)"
  for row in JS1 JS4 RJ2; do
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
      JS1) g12_grade_js1 ;;
      JS4) g12_grade_js4 ;;
      RJ2) g12_grade_rj2 ;;
    esac
  done
}

g12_grade_cmd() {
  local row line grader rows owned=" "
  if [ -n "$G12_FULL_RUN_BRANCH" ] && [ -n "$G12_ROWS_SELECTED" ]; then
    g12_refuse "grade: --full-run grades FR1-FR7 together and takes no --row"
    g12_exit_raise 1
    return 1
  fi

  if [ -n "$G12_FULL_RUN_BRANCH" ]; then
    if declare -F g12_grade_full_run >/dev/null; then
      g12_grade_full_run "$G12_FULL_RUN_BRANCH"
      return
    fi
    for row in $(g12_row_names); do
      [ "$(g12_row_field "$row" 3)" = full-run ] || continue
      g12_result_line "$row" "not run" "grader not implemented"
    done
    return
  fi

  for row in $(g12_row_names); do
    [ "$(g12_row_field "$row" 3)" = full-run ] || continue
    owned="$owned$row "
    g12_row_selected "$row" || continue
    g12_result_line "$row" "not run" "needs --full-run <branch>"
  done
  while IFS= read -r line; do
    grader="${line%% *}"
    rows="${line#* }"
    owned="$owned$rows "
    if declare -F "$grader" >/dev/null; then
      "$grader"
      continue
    fi
    for row in $rows; do
      g12_row_selected "$row" && g12_result_line "$row" "not run" "grader not implemented"
    done
  done <<<"$G12_GRADERS"
  for row in $(g12_row_names); do
    case "$owned" in *" $row "*) continue ;; esac
    g12_row_selected "$row" && g12_result_line "$row" "not run" "grader not implemented"
  done
  return 0
}
