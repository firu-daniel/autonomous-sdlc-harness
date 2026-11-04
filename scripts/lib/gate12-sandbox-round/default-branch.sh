#!/usr/bin/env bash
# default-branch.sh — round step 8, JS3's default-branch leg: make a new branch cut from the GitHub
# default's tip the GitHub default, lower the stall thresholds, plant and dispatch JS3, wait for its
# job to start, then put the default branch and the thresholds back.
#
# It changes, on GitHub, in the Gate 12 repository only: the default branch (to G12_OTHER_BRANCH) and
# the repository variables STALL_WARN_SECS and STALL_KILL_SECS (to G12_STALL_WARN_SECS and
# G12_STALL_KILL_SECS). Every one of those changes is undone by g12_db_restore, which a trap installed
# before the first change runs on every exit path, an interrupt included, whatever happens after it.
# It also pushes G12_OTHER_BRANCH and the JS3 branch to origin, each recorded in the state file before
# its push and kept until teardown: the JS3 job's checkout already holds the other branch.
#
# harness-run.yml fixes HARNESS_GITHUB_DEFAULT_BRANCH when the run is dispatched and its run job reads
# vars.STALL_WARN_SECS / vars.STALL_KILL_SECS when the job starts, so the default is switched before
# the dispatch and the variables are kept lowered until the run is in_progress or completed, or until
# G12_WAIT_SECS has passed.
#
#   g12_js3_files <branch> <dir>
#       JS3's honest task prompt and an empty manifest, so g12_branch_build makes the prompt commit only.
#   g12_db_restore <why>
#       Runs once: the default branch, then each variable, back to what was recorded; `restored: true`
#       per variable. <why> is `return` (the leg's own end), EXIT, INT, TERM or HUP. A failed step prints
#       the command that finishes it by hand and raises 5. After an interrupt it exits 130, or 5 when a
#       step failed.
#   g12_default_branch_cmd
#       The `default-branch` subcommand. Stdout: `planted JS3 stall <branch> run <id|null>`, then
#       `run <id> is <status>` once the job has started, then `restored ...` per restored change.
#
# Refusals, before anything changes, raise 2: a recorded run still in flight; a recorded default_branch
# that differs from the live one; a recorded other_branch; G12_OTHER_BRANCH already on origin.
# A failed gh or git call raises 3.
#
# Test seam, read from the environment:
#   G12_DB_POLL_SECS   seconds between the wait's status polls, default 10
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array, so each variable's recorded state is
# held in G12_DB_PRESENT_<NAME>, G12_DB_VALUE_<NAME> and G12_DB_TOUCHED_<NAME>.

G12_DB_VARIABLES="STALL_WARN_SECS STALL_KILL_SECS"
G12_DB_DONE=0
G12_DB_DEFAULT=""
G12_DB_SWITCHED=0
G12_DB_RUN_ID=""

g12_js3_files() {
  local branch="${1:-}" dir="${2:-}"
  [ -n "$branch" ] && [ -d "$dir" ] || { g12_refuse "g12_js3_files needs <branch> <dir>"; return 1; }
  : >"$dir/manifest" || { g12_refuse "could not write '$dir/manifest'"; return 1; }
  printf 'Add a line to README.md naming the date this repository was last checked.\n' >"$dir/task_prompt.md" ||
    { g12_refuse "could not write '$dir/task_prompt.md'"; return 1; }
}

g12_db_refuse() {
  g12_refuse "refusing default-branch: $*"
  g12_exit_raise 2
  return 2
}

g12_db_failed() {
  g12_refuse "$*"
  g12_exit_raise 3
  return 3
}

# A run whose ID was never found is checked by its branch instead: runs[] outlives teardown.
g12_db_runs_idle() {
  local lines id branch statuses status
  lines="$(g12_state_get '.runs[] | "\(.run_id // "null")\t\(.branch)"')" || { g12_exit_raise 3; return 3; }
  while IFS=$'\t' read -r id branch; do
    [ -n "$id" ] || continue
    if [ "$id" = null ]; then
      statuses="$(gh run list --repo "$G12_REPO" --workflow harness-run.yml --branch "$branch" \
        --json status --jq '.[].status' </dev/null)" ||
        { g12_db_failed "gh run list --repo $G12_REPO --branch $branch failed"; return; }
    else
      statuses="$(gh run view "$id" --repo "$G12_REPO" --json status --jq .status </dev/null)" ||
        { g12_db_failed "gh run view $id --repo $G12_REPO failed"; return; }
    fi
    for status in $statuses; do
      case "$status" in
        queued | waiting | requested | pending | in_progress)
          g12_db_refuse "run $id of $branch is $status; step 8 is the last job leg, so it waits until every other run has ended"
          return
          ;;
      esac
    done
  done <<<"$lines"
}

g12_db_record() {
  local recorded json name present value
  recorded="$(g12_state_get '.default_branch // empty')" || { g12_exit_raise 3; return 3; }
  if [ -n "$recorded" ] && [ "$recorded" != "$G12_GITHUB_DEFAULT" ]; then
    g12_db_refuse "the state file records default branch $recorded but GitHub's is $G12_GITHUB_DEFAULT: a previous leg was left unrestored; restore it with: gh repo edit $G12_REPO --default-branch $recorded"
    return
  fi
  recorded="$(g12_state_get '.other_branch // empty')" || { g12_exit_raise 3; return 3; }
  if [ -n "$recorded" ]; then
    g12_db_refuse "the state file already records other branch $recorded; run teardown before taking this leg again"
    return
  fi
  # Recording a branch someone else pushed would hand it to teardown.
  recorded="$(git -C "$G12_ROOT" ls-remote --heads origin "refs/heads/$G12_OTHER_BRANCH")" ||
    { g12_db_failed "git ls-remote --heads origin $G12_OTHER_BRANCH failed in '$G12_ROOT'"; return; }
  if [ -n "$recorded" ]; then
    g12_db_refuse "$G12_OTHER_BRANCH already exists on origin; name a new one with --other-branch"
    return
  fi

  json="$(gh variable list --repo "$G12_REPO" --json name,value)" ||
    { g12_db_failed "gh variable list --repo $G12_REPO failed"; return; }
  for name in $G12_DB_VARIABLES; do
    present="$(jq -r --arg n "$name" 'any(.[]; .name == $n)' <<<"$json")" &&
      value="$(jq -r --arg n "$name" 'map(select(.name == $n)) | first | .value // ""' <<<"$json")" ||
      { g12_db_failed "gh variable list --repo $G12_REPO printed what jq could not read"; return; }
    printf -v "G12_DB_PRESENT_$name" '%s' "$present"
    printf -v "G12_DB_VALUE_$name" '%s' "$value"
    printf -v "G12_DB_TOUCHED_$name" '%s' 0
  done
  G12_DB_DEFAULT="$G12_GITHUB_DEFAULT"
  g12_state_update '.default_branch = $d
    | reduce ($names | split(" ")[]) as $n (.;
        .variables[$n] = (($list | map(select(.name == $n)) | first) as $v
          | if $v == null then {present: false, value: null, restored: false}
            else {present: true, value: $v.value, restored: false} end))' \
    --arg d "$G12_DB_DEFAULT" --arg names "$G12_DB_VARIABLES" --argjson list "$json" ||
    { g12_db_failed "could not record the default branch and the variables in the state file; nothing was changed"; return; }
}

# g12_db_hand <command>... — a restore step left undone: name it, raise 5.
g12_db_hand() {
  local cmd
  printf -v cmd '%q ' "$@"
  g12_refuse "a restore step failed; finish it by hand with: ${cmd% }"
  g12_exit_raise 5
}

g12_db_restore() {
  local status=$? why="${1:-return}" failed=0 name present value touched
  if [ "$G12_DB_DONE" -eq 0 ]; then
    G12_DB_DONE=1
    # A second interrupt must not cut the restore short.
    trap '' INT TERM HUP
    if [ "$G12_DB_SWITCHED" -eq 1 ]; then
      if gh repo edit "$G12_REPO" --default-branch "$G12_DB_DEFAULT" >&2; then
        printf 'restored default branch %s\n' "$G12_DB_DEFAULT"
      else
        g12_db_hand gh repo edit "$G12_REPO" --default-branch "$G12_DB_DEFAULT"
        failed=1
      fi
    fi
    for name in $G12_DB_VARIABLES; do
      present="G12_DB_PRESENT_$name"
      present="${!present:-}"
      value="G12_DB_VALUE_$name"
      value="${!value:-}"
      touched="G12_DB_TOUCHED_$name"
      touched="${!touched:-0}"
      [ -n "$present" ] || continue
      if [ "$touched" != 1 ]; then
        g12_state_update '.variables[$n].restored = true' --arg n "$name" || { g12_exit_raise 5; failed=1; }
        continue
      fi
      if [ "$present" = true ]; then
        if ! gh variable set "$name" --repo "$G12_REPO" --body "$value" >&2; then
          g12_db_hand gh variable set "$name" --repo "$G12_REPO" --body "$value"
          failed=1
          continue
        fi
        printf 'restored variable %s\n' "$name"
      else
        if ! gh variable delete "$name" --repo "$G12_REPO" >&2; then
          g12_db_hand gh variable delete "$name" --repo "$G12_REPO"
          failed=1
          continue
        fi
        printf 'restored variable %s (deleted: it was absent)\n' "$name"
      fi
      if ! g12_state_update '.variables[$n].restored = true' --arg n "$name"; then
        g12_refuse "$name is restored on GitHub but the state file still records restored: false"
        g12_exit_raise 5
        failed=1
      fi
    done
    trap - EXIT INT TERM HUP
  fi
  case "$why" in
    return) return "$failed" ;;
    EXIT)
      g12_exit_raise "$status"
      exit "$G12_EXIT"
      ;;
    *)
      [ "$failed" -eq 0 ] || exit 5
      exit 130
      ;;
  esac
}

g12_db_wait() {
  local id="$1" poll="${G12_DB_POLL_SECS:-10}" deadline status="" left
  case "$poll" in "" | 0* | *[!0-9]*) g12_refuse "G12_DB_POLL_SECS '$poll' is not a positive integer"; poll=10 ;; esac
  deadline=$((SECONDS + G12_WAIT_SECS))
  if [ -n "$id" ]; then
    while :; do
      status="$(gh run view "$id" --repo "$G12_REPO" --json status --jq .status)" || status=""
      case "$status" in
        in_progress | completed)
          printf 'run %s is %s\n' "$id" "$status"
          return 0
          ;;
      esac
      left=$((deadline - SECONDS))
      [ "$left" -gt 0 ] || break
      [ "$left" -ge "$poll" ] || poll="$left"
      sleep "$poll"
    done
  fi
  g12_refuse "run ${id:-null} of $2 did not start within ${G12_WAIT_SECS}s (last status '${status:-unknown}'): restoring anyway, so the job may not have read the lowered STALL_WARN_SECS and STALL_KILL_SECS"
  g12_state_update '.runs |= map(if .row == "JS3" and .branch == $b then .stall_values_unconfirmed = true else . end)' \
    --arg b "$2" || { g12_refuse "could not record stall_values_unconfirmed on the run of $2"; g12_exit_raise 3; }
  return 0
}

g12_db_leg() {
  local name value branch dir commit status=0
  git -C "$G12_ROOT" fetch --quiet origin || { g12_db_failed "git fetch origin failed in '$G12_ROOT'"; return; }

  g12_state_update '.other_branch = $o' --arg o "$G12_OTHER_BRANCH" ||
    { g12_db_failed "could not record other branch $G12_OTHER_BRANCH in the state file; it was not pushed"; return; }
  git -C "$G12_ROOT" push --no-verify origin \
    "refs/remotes/origin/$G12_DB_DEFAULT:refs/heads/$G12_OTHER_BRANCH" ||
    { g12_db_failed "git push of $G12_OTHER_BRANCH failed; it stays recorded for teardown"; return; }

  G12_DB_SWITCHED=1
  gh repo edit "$G12_REPO" --default-branch "$G12_OTHER_BRANCH" >&2 ||
    { g12_db_failed "gh repo edit $G12_REPO --default-branch $G12_OTHER_BRANCH failed"; return; }

  for name in $G12_DB_VARIABLES; do
    # Set before the call: a set that succeeded but was interrupted still owes its restore.
    printf -v "G12_DB_TOUCHED_$name" '%s' 1
    case "$name" in
      STALL_WARN_SECS) value="$G12_STALL_WARN_SECS" ;;
      STALL_KILL_SECS) value="$G12_STALL_KILL_SECS" ;;
    esac
    gh variable set "$name" --repo "$G12_REPO" --body "$value" >&2 ||
      { g12_db_failed "gh variable set $name --repo $G12_REPO failed"; return; }
  done

  branch="gate12_js3_stall_$(date -u +%Y%m%d%H%M%S)"
  dir="$(mktemp -d "${TMPDIR:-/tmp}/gate12-plant.XXXXXX")" ||
    { g12_db_failed "could not create a temporary plant directory"; return; }
  if ! g12_js3_files "$branch" "$dir"; then
    g12_exit_raise 3
    status=3
  elif ! commit="$(g12_branch_build "$branch" "$dir")"; then
    g12_exit_raise 3
    status=3
  fi
  g12_plant_dir_remove "$dir"
  [ "$status" -eq 0 ] || return "$status"

  g12_branch_push JS3 stall "$branch" "$commit" || return
  g12_dispatch JS3 stall "$branch"
  status=$?
  G12_DB_RUN_ID="$G12_DISPATCHED_RUN_ID"
  # A failed remote-run.sh dispatch records no run, so there is nothing to wait on. A failed run-ID
  # lookup records run_id null: the job may be running, so it is marked unconfirmed like a timeout.
  if [ -z "$G12_DB_RUN_ID" ] &&
    [ -z "$(g12_state_get '.runs[] | select(.row == "JS3" and .branch == $b) | .branch' --arg b "$branch")" ]; then
    return "$status"
  fi
  printf 'planted JS3 stall %s run %s\n' "$branch" "${G12_DB_RUN_ID:-null}"
  g12_db_wait "$G12_DB_RUN_ID" "$branch"
  return "$status"
}

g12_default_branch_cmd() {
  g12_need g12_state_init g12_state_get g12_state_update g12_branch_build g12_branch_push g12_dispatch \
    g12_plant_dir_remove
  g12_state_init || { g12_exit_raise 3; return 3; }
  g12_db_runs_idle || return
  g12_db_record || return

  trap 'g12_db_restore EXIT' EXIT
  trap 'g12_db_restore INT' INT
  trap 'g12_db_restore TERM' TERM
  trap 'g12_db_restore HUP' HUP

  g12_db_leg
  g12_db_restore return
}
