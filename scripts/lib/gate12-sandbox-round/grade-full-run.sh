#!/usr/bin/env bash
# grade-full-run.sh — `grade --full-run <branch>`: FR1-FR7 of docs/sandbox-verification.md -> ## 10.,
# round step 6, from the hand-driven full run of observation (xvi). The full run is not in the state
# file; only its branch is given. Each row reads exactly what its **Read from** names: the branch's
# `harness run <branch>` jobs through runs.sh, and, for FR4, the committed run-analytics.json. A
# clause whose Read from is a source file prints a `source` line naming the file and symbol and is
# not graded. grade-plant.sh's g12_grade_cmd calls g12_grade_full_run with a non-empty branch only;
# this file uses that file's step names and its arm and fold helpers, and grade-state.sh's step names.
#
# THE JOBS. Oldest first, those whose title is `harness run <branch>`:
#   parked job   the first whose Run the harness log carries `job: parked stop`
#   resumed job  the first later one whose Run the harness log carries
#                `job: resuming parked run '<branch>' (answers `
# A job not completed, or whose log is gone or unattributed, ends the search there: every row that
# reads the job searched for takes that job's `not run` or `expired`.
#
#   g12_full_run_jobs <branch>   G12_FR_JOBS: `<id>` per line, oldest first; status 1 with the verdict
#                                in G12_ARM_RESULT / G12_ARM_EVIDENCE
#   g12_grade_full_run <branch>  FR1, FR1's `source` line, then FR2-FR7
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array.

G12_STEP_INSTALL="Install the sandbox prerequisites"
G12_STEP_PREFLIGHT="Preflight with doctor"
G12_STEP_RECORD="Record the default branch's commit"
G12_STEP_PUSH="Push the branch"
G12_FR1_SOURCE="cli/templates/scripts/autonomous-watcher.sh spawn_engine job-mode arm: --settings is the base profile unchanged; reaches neither hr_run_profile_file nor run_profile_render"
G12_FR4_DEPARTURE="the denied call's full input is not carried off the runner (docs/cli.md §6, residual 1, item 5)"
G12_FR5_DEPARTURE="graded on the two steps' conclusions, not their logs: Record the default branch's commit writes HARNESS_GITHUB_DEFAULT_COMMIT and HARNESS_DEFAULT_BRANCH_COMMIT to GITHUB_ENV, which its log does not show, and exits 1 on each failure"
G12_FR7_TAIL="second clause not graded: a planning park reaches no gate round; recorded not run unless the run parked at run gates (observation (xvi))"

G12_FR_JOBS=""
G12_FR_PARKED=""
G12_FR_PARKED_RESULT=""
G12_FR_PARKED_WHY=""
G12_FR_RESUMED=""
G12_FR_RESUMED_RESULT=""
G12_FR_RESUMED_WHY=""

g12_full_run_jobs() {
  local branch="$1" json
  G12_FR_JOBS=""
  json="$(gh run list --repo "$G12_REPO" --workflow harness-run.yml --branch "$branch" \
    --json databaseId,createdAt,displayTitle,status --limit 100 </dev/null)" || {
    g12_refuse "gh run list --repo $G12_REPO --workflow harness-run.yml --branch $branch failed"
    g12_exit_raise 3
    g12_arm_set "not run" "the runs of $branch could not be listed (named on stderr)"
    return 1
  }
  G12_FR_JOBS="$(jq -r --arg t "harness run $branch" \
    '[.[] | select(.displayTitle == $t)] | sort_by(.createdAt) | .[] | "\(.databaseId)"' \
    <<<"$json" 2>/dev/null)" || {
    g12_refuse "gh run list --repo $G12_REPO --branch $branch printed what jq cannot read"
    g12_exit_raise 3
    g12_arm_set "not run" "the runs of $branch could not be read (named on stderr)"
    return 1
  }
  if [ -z "$G12_FR_JOBS" ]; then
    g12_arm_set "not run" "no harness run $branch run on $branch"
    return 1
  fi
}

# g12_fr_done <id> — 0 when the run is completed; otherwise sets the arm's verdict.
g12_fr_done() {
  local status
  G12_ARM_ID="$1"
  status="$(g12_run_status "$1")" || { g12_arm_gh_failed; return 1; }
  [ "$status" = completed ] && return 0
  g12_arm_set "not run" "run $1 is $status"
  return 1
}

# g12_fr_ran <step> — 0 when the step of run G12_ARM_ID ran; otherwise sets the arm's verdict.
g12_fr_ran() {
  local concl
  concl="$(g12_step_conclusion "$G12_ARM_ID" "$1")" || { g12_arm_gh_failed; return 1; }
  case "$concl" in
    success | failure) return 0 ;;
  esac
  g12_arm_set "not run" "$1 did not run in run $G12_ARM_ID (${concl:-absent})"
  return 1
}

g12_fr_find() {
  local branch="$1" id want=parked
  G12_FR_PARKED=""
  G12_FR_RESUMED=""
  G12_FR_PARKED_RESULT="not run"
  G12_FR_PARKED_WHY="no job of $branch logs job: parked stop in $G12_STEP_HARNESS"
  G12_FR_RESUMED_RESULT="not run"
  G12_FR_RESUMED_WHY="no job after the parked one logs job: resuming parked run '$branch' in $G12_STEP_HARNESS"
  while IFS= read -r id; do
    [ -n "$id" ] || continue
    if ! g12_fr_done "$id" ||
      { g12_step_ran "$id" "$G12_STEP_HARNESS" && ! g12_arm_log "$G12_STEP_HARNESS"; }; then
      if [ "$want" = parked ]; then
        G12_FR_PARKED_RESULT="$G12_ARM_RESULT"
        G12_FR_PARKED_WHY="$G12_ARM_EVIDENCE"
      else
        G12_FR_RESUMED_RESULT="$G12_ARM_RESULT"
        G12_FR_RESUMED_WHY="$G12_ARM_EVIDENCE"
      fi
      break
    fi
    # g12_step_ran's status 3 (a failed gh call) falls through here as `did not run`; g12_fr_ran
    # raises it when a row reads the step.
    g12_step_ran "$id" "$G12_STEP_HARNESS" || continue
    if [ "$want" = parked ]; then
      if printf '%s\n' "$G12_ARM_LOG" | grep -q -F 'job: parked stop'; then
        G12_FR_PARKED="$id"
        want=resumed
      fi
    elif printf '%s\n' "$G12_ARM_LOG" | grep -q -F "job: resuming parked run '$branch' (answers "; then
      G12_FR_RESUMED="$id"
      break
    fi
  done <<<"$G12_FR_JOBS"
  if [ -z "$G12_FR_PARKED" ]; then
    G12_FR_RESUMED_RESULT="$G12_FR_PARKED_RESULT"
    G12_FR_RESUMED_WHY="no parked job: $G12_FR_PARKED_WHY"
  fi
}

# g12_fr_job parked|resumed — G12_ARM_ID is that job; otherwise sets the arm's verdict.
g12_fr_job() {
  if [ "$1" = parked ]; then
    G12_ARM_ID="$G12_FR_PARKED"
    [ -n "$G12_ARM_ID" ] && return 0
    g12_arm_set "$G12_FR_PARKED_RESULT" "parked job: $G12_FR_PARKED_WHY"
  else
    G12_ARM_ID="$G12_FR_RESUMED"
    [ -n "$G12_ARM_ID" ] && return 0
    g12_arm_set "$G12_FR_RESUMED_RESULT" "resumed job: $G12_FR_RESUMED_WHY"
  fi
  return 1
}

# g12_fr_print <row> [<tail>] [<departure>] — g12_fold_print, with <tail> ending the evidence after
# the record path.
g12_fr_print() {
  local row="$1" tail="${2:-}" departure="${3:-}" path evidence
  if [ "$G12_FOLD_RESULT" = pass ]; then
    evidence="$G12_FOLD_PASSES"
  else
    evidence="$G12_FOLD_EVIDENCE"
    if path="$(g12_evidence "$row" "$G12_FOLD_RECORD")"; then
      evidence="$evidence; record in $path"
    else
      evidence="$evidence; the record could not be written"
    fi
  fi
  [ -z "$tail" ] || evidence="$evidence; $tail"
  g12_result_line "$row" "$G12_FOLD_RESULT" "$evidence" "$departure"
}

# ---------------------------------------------------------------------------------------------
# FR1: run_job logs `job: launching run for '<branch>' (engine=…) in <worktree> (log: …)`, and
# spawn_refuse's `not launching '<branch>': <reason>` when spawn_engine's launch check refuses
# (cli/templates/scripts/autonomous-watcher.sh).
g12_fr1_arm() {
  local branch="$1" launch notl wt
  g12_fr_job parked || return 0
  g12_fr_ran "$G12_STEP_HARNESS" || return 0
  g12_arm_log "$G12_STEP_HARNESS" || return 0
  launch="$(printf '%s\n' "$G12_ARM_LOG" | grep -n -F -- "job: launching run for '$branch'" | head -n 1)"
  notl="$(printf '%s\n' "$G12_ARM_LOG" | grep -n -F -- "not launching '$branch': " | tail -n 1)"
  if [ -n "$notl" ] && { [ -z "$launch" ] || [ "${notl%%:*}" -gt "${launch%%:*}" ]; }; then
    g12_arm_set fail "run $G12_ARM_ID refused the launch: $(g12_trim "${notl#*:}")" "$G12_ARM_LOG"
    return
  fi
  if [ -z "$launch" ]; then
    g12_arm_set fail "$G12_STEP_HARNESS in run $G12_ARM_ID carries no job: launching run for '$branch' line" "$G12_ARM_LOG"
    return
  fi
  wt="${launch#*) in }"
  wt="${wt%% (log: *}"
  g12_arm_set pass "run $G12_ARM_ID launched in $wt, no not launching line after it"
}

# FR2: the install step's outcome line, or each of its ::warning:: lines, is kept on a pass too. The
# step's `run:` block is echoed into its log, so a line carrying `echo "` is the echo, not the output.
g12_fr2() {
  local inst pre lines n path evidence
  g12_fold_reset 1
  if g12_fr_job parked && g12_fr_ran "$G12_STEP_INSTALL" && g12_fr_ran "$G12_STEP_PREFLIGHT"; then
    pre="$(g12_step_conclusion "$G12_ARM_ID" "$G12_STEP_PREFLIGHT")"
    if [ "$pre" = failure ]; then
      g12_arm_set fail "$G12_STEP_PREFLIGHT concluded failure in run $G12_ARM_ID" \
        "$(g12_step_log "$G12_ARM_ID" "$G12_STEP_PREFLIGHT" 2>/dev/null)"
    elif g12_arm_log "$G12_STEP_INSTALL"; then
      inst="$G12_ARM_LOG"
      lines="$(printf '%s\n' "$inst" |
        grep -F -e 'The sandbox prerequisites are present.' -e '::warning::' | grep -v -F 'echo "')"
      if [ -n "$lines" ]; then
        n="$(printf '%s\n' "$lines" | grep -c .)"
        evidence="$G12_STEP_PREFLIGHT concluded success in run $G12_ARM_ID; $n $G12_STEP_INSTALL line(s)"
      else
        lines="$G12_STEP_INSTALL logged neither its present line nor a ::warning:: line; its whole log:"$'\n'"$inst"
        evidence="$G12_STEP_PREFLIGHT concluded success in run $G12_ARM_ID; $G12_STEP_INSTALL logged no outcome line"
      fi
      if path="$(g12_evidence FR2 "run $G12_ARM_ID $G12_STEP_INSTALL:"$'\n'"$lines")"; then
        g12_result_line FR2 pass "$evidence, recorded in $path"
      else
        g12_result_line FR2 pass "$evidence, which could not be recorded"
      fi
      return
    fi
  fi
  g12_fold_add parked
  g12_fr_print FR2
}

# FR5: graded on the two steps' conclusions.
g12_fr5_arm() {
  local refuse record
  g12_fr_job parked || return 0
  g12_fr_ran "$G12_STEP_REFUSE" || return 0
  refuse="$(g12_step_conclusion "$G12_ARM_ID" "$G12_STEP_REFUSE")"
  if [ "$refuse" = failure ]; then
    g12_arm_set fail "$G12_STEP_REFUSE concluded failure in run $G12_ARM_ID: the honest branch was refused"
    return
  fi
  g12_fr_ran "$G12_STEP_RECORD" || return 0
  record="$(g12_step_conclusion "$G12_ARM_ID" "$G12_STEP_RECORD")"
  if [ "$record" = failure ]; then
    g12_arm_set fail "$G12_STEP_RECORD concluded failure in run $G12_ARM_ID"
    return
  fi
  g12_arm_set pass "$G12_STEP_REFUSE and $G12_STEP_RECORD concluded success in run $G12_ARM_ID"
}

# ---------------------------------------------------------------------------------------------
# FR3: Run the harness concludes success even on a failed run, because run_job ends
# `echo "job: $final $decision"` then `exit 0`, and its parked-on-answer stop prints `job: parked stop`
# then `exit 0`; `decision` is `stop` by default and set to `continue` or `wait-poller` in its
# supervision loop (run_job in cli/templates/scripts/autonomous-watcher.sh). So the verdict is the
# last such line of each job's log.
g12_fr3_arm() {
  local id="$1" line final push
  g12_fr_done "$id" || return 0
  g12_fr_ran "$G12_STEP_HARNESS" || return 0
  g12_fr_ran "$G12_STEP_PUSH" || return 0
  g12_arm_log "$G12_STEP_HARNESS" || return 0
  line="$(printf '%s\n' "$G12_ARM_LOG" |
    grep -E '(^|[[:space:]])job: [^[:space:]]+ (stop|continue|wait-poller)[[:space:]]*$' | tail -n 1)"
  if [ -z "$line" ]; then
    g12_arm_set fail "run $id: $G12_STEP_HARNESS ran but carries no job: <final> <decision> line" "$G12_ARM_LOG"
    return
  fi
  line="job: $(g12_trim "${line##*job: }")"
  final="${line#job: }"
  final="${final%% *}"
  if [ "$final" = failed ]; then
    g12_arm_set fail "run $id: $line" "$line"
    return
  fi
  push="$(g12_step_conclusion "$id" "$G12_STEP_PUSH")"
  if [ "$push" = failure ]; then
    g12_arm_set fail "run $id: $G12_STEP_PUSH concluded failure" "$line"
    return
  fi
  g12_arm_set pass "run $id: $line"
}

g12_fr3() {
  local id
  # One arm per job, each naming its run, so the fold adds no arm prefix.
  g12_fold_reset 1
  while IFS= read -r id; do
    [ -n "$id" ] || continue
    g12_fr3_arm "$id"
    g12_fold_add "run $id"
  done <<<"$G12_FR_JOBS"
  g12_fr_print FR3
}

# ---------------------------------------------------------------------------------------------
# FR4: the per-call records are run-analytics.sh's sessions[].tools.items[], each carrying
# permission_denied (cli/templates/scripts/lib/run-analytics.jq, the Record block).
g12_fr4() {
  local branch="$1" rel="$G12_STATE_DIR/run_analytics/$1/run-analytics.json" ref="origin/$1"
  local json denied n path
  if ! git -C "$G12_ROOT" fetch --quiet origin "$branch" </dev/null; then
    g12_refuse "git -C $G12_ROOT fetch origin $branch failed"
    g12_exit_raise 3
    g12_result_line FR4 "not run" "git fetch origin $branch failed (named on stderr)" "$G12_FR4_DEPARTURE"
    return
  fi
  if ! git -C "$G12_ROOT" cat-file -e "$ref:$rel" 2>/dev/null; then
    g12_result_line FR4 "not run" "$rel is absent on $ref" "$G12_FR4_DEPARTURE"
    return
  fi
  json="$(git -C "$G12_ROOT" show "$ref:$rel")" || {
    g12_refuse "git -C $G12_ROOT show $ref:$rel failed"
    g12_exit_raise 3
    g12_result_line FR4 "not run" "git show $ref:$rel failed (named on stderr)" "$G12_FR4_DEPARTURE"
    return
  }
  denied="$(jq -s -c 'if length != 1 then error("not one document")
    else .[0] | if type == "object" and (.sessions | type) == "array"
      then [.sessions[] | .tools.items[]? | select(.permission_denied == true)]
      else error("not the run-analytics shape") end end' <<<"$json" 2>/dev/null)"
  if [ -z "$denied" ]; then
    if path="$(g12_evidence FR4 "$ref:$rel does not parse as one run-analytics document:"$'\n'"$json")"; then
      g12_result_line FR4 fail "$ref:$rel does not parse; record in $path" "$G12_FR4_DEPARTURE"
    else
      g12_result_line FR4 fail "$ref:$rel does not parse; the record could not be written" "$G12_FR4_DEPARTURE"
    fi
    return
  fi
  n="$(jq 'length' <<<"$denied")"
  # Kept on a pass: the quote is the row's result.
  if path="$(g12_evidence FR4 "$n denied call(s) in $ref:$rel:"$'\n'"$(jq -c '.[]' <<<"$denied")")"; then
    g12_result_line FR4 pass "$n denied call(s), quoted in $path" "$G12_FR4_DEPARTURE"
  else
    g12_result_line FR4 pass "$n denied call(s), which could not be quoted" "$G12_FR4_DEPARTURE"
  fi
}

# ---------------------------------------------------------------------------------------------
# FR6: the save step prints two skip forms, each failing the row: `remote-run.sh: save: skipped …`
# (save_link_free and verb_save in cli/templates/scripts/remote-run.sh) and
# `remote state bundle: skipped …` (hr_remote_copy_tree and hr_remote_bundle_source_ok in
# cli/templates/scripts/lib/harness-run-lib.sh, run by hr_remote_bundle_write). The saved, restored
# and placed lines are verb_save's and verb_restore's in remote-run.sh.
g12_fr6_save() {
  local branch="$1" skipped
  g12_fr_job parked || return 0
  g12_fr_ran "$G12_STEP_SAVE" || return 0
  g12_arm_log "$G12_STEP_SAVE" || return 0
  skipped="$(printf '%s\n' "$G12_ARM_LOG" | grep -F skipped)"
  if [ -n "$skipped" ]; then
    g12_arm_set fail "run $G12_ARM_ID: $(g12_trim "${skipped%%$'\n'*}")" "$skipped"
    return
  fi
  if ! printf '%s\n' "$G12_ARM_LOG" | grep -q -F -- "saved the bundle of $branch"; then
    g12_arm_set fail "$G12_STEP_SAVE in run $G12_ARM_ID carries no saved the bundle of $branch line" "$G12_ARM_LOG"
    return
  fi
  g12_arm_set pass "run $G12_ARM_ID saved the bundle of $branch with no skipped line"
}

g12_fr6_restore() {
  local restored placed
  g12_fr_job resumed || return 0
  g12_fr_ran "$G12_STEP_RESTORE" || return 0
  g12_arm_log "$G12_STEP_RESTORE" || return 0
  restored="$(printf '%s\n' "$G12_ARM_LOG" | grep -F -- "restored the bundle of run $G12_FR_PARKED " | head -n 1)"
  placed="$(printf '%s\n' "$G12_ARM_LOG" | grep -E 'placed [0-9]+ planning file\(s\)' | head -n 1)"
  if [ -z "$restored" ]; then
    g12_arm_set fail "$G12_STEP_RESTORE in run $G12_ARM_ID carries no restored the bundle of run $G12_FR_PARKED line" "$G12_ARM_LOG"
  elif [ -z "$placed" ]; then
    g12_arm_set fail "$G12_STEP_RESTORE in run $G12_ARM_ID carries no placed <n> planning file(s) line" "$G12_ARM_LOG"
  else
    placed="placed${placed#*placed}"
    g12_arm_set pass "run $G12_ARM_ID restored the bundle of run $G12_FR_PARKED; ${placed%% for *}"
  fi
}

# FR7: graded on the resumed job's Run the harness alone. verb_restore's `wrote answer_<n>.md for
# <branch>` (remote-run.sh) is quoted beside it as context and decides nothing.
g12_fr7_arm() {
  local branch="$1" line wrote
  g12_fr_job resumed || return 0
  g12_fr_ran "$G12_STEP_HARNESS" || return 0
  g12_arm_log "$G12_STEP_HARNESS" || return 0
  line="$(printf '%s\n' "$G12_ARM_LOG" | grep -F -- "job: resuming parked run '$branch' (answers " | head -n 1)"
  if [ -z "$line" ]; then
    g12_arm_set fail "$G12_STEP_HARNESS in run $G12_ARM_ID carries no job: resuming parked run '$branch' line" "$G12_ARM_LOG"
    return
  fi
  line="job: $(g12_trim "${line#*job: }")"
  wrote="$(g12_step_log "$G12_ARM_ID" "$G12_STEP_RESTORE" 2>/dev/null |
    grep -E "wrote answer_[0-9]+\.md for " | grep -F -- " for $branch" | head -n 1)"
  [ -z "$wrote" ] || line="$line; context, not graded: wrote${wrote#*wrote}"
  g12_arm_set pass "run $G12_ARM_ID: $line"
}

# ---------------------------------------------------------------------------------------------
g12_grade_full_run() {
  local branch="${1:-}" result why
  if ! g12_full_run_jobs "$branch"; then
    result="$G12_ARM_RESULT"
    why="$G12_ARM_EVIDENCE"
    g12_result_line FR1 "$result" "$why"
    g12_result_line FR1 source "$G12_FR1_SOURCE"
    g12_result_line FR2 "$result" "$why"
    g12_result_line FR3 "$result" "$why"
    g12_fr4 "$branch"
    g12_result_line FR5 "$result" "$why" "$G12_FR5_DEPARTURE"
    g12_result_line FR6 "$result" "$why"
    g12_result_line FR7 "$result" "$why; $G12_FR7_TAIL"
    return 0
  fi
  g12_fr_find "$branch"

  g12_fold_reset 1
  g12_fr1_arm "$branch"
  g12_fold_add parked
  g12_fr_print FR1
  g12_result_line FR1 source "$G12_FR1_SOURCE"

  g12_fr2
  g12_fr3
  g12_fr4 "$branch"

  g12_fold_reset 1
  g12_fr5_arm
  g12_fold_add parked
  g12_fr_print FR5 "" "$G12_FR5_DEPARTURE"

  g12_fold_reset 2
  g12_fr6_save "$branch"
  g12_fold_add save
  g12_fr6_restore
  g12_fold_add restore
  g12_fr_print FR6

  g12_fold_reset 1
  g12_fr7_arm "$branch"
  g12_fold_add resumed
  g12_fr_print FR7 "$G12_FR7_TAIL"
  return 0
}
