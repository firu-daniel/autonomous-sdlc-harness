#!/usr/bin/env bash
# job.sh — what the sandbox probe does differently in job mode: it runs in the checkout itself, on the
# base profile, as a `harness-run.yml` job's session does, cutting no clone and rendering no per-run
# profile. session.sh calls in through hooks only; nothing here forks its code.
#
# Each function reproduces a piece of the watcher (cli/templates/scripts/autonomous-watcher.sh); keep
# each in step with the code it names:
#   setup         spawn_engine's job-mode `--settings` file: $SETTINGS_PROFILE, checked by
#                 run_profile_check with no copy
#   add-dirs      spawn_engine's "JOB MODE ONLY: every permissions.additionalDirectories entry of the
#                 base profile" block, building extra_dirs (the launch-line comment's bracketed tail)
#   manifest      spawn_engine's "What was absent before this session" block, its job-mode half, with
#                 placeholder_manifest_writable_root
#   sweep         the job's `Sweep the sandbox placeholders` step:
#                 `HARNESS_JOB_MODE=1 autonomous-watcher.sh job-sweep <branch>` (job_sweep)
#
#   sp_job_setup              status 0, or 2 through sp__setup_refuse naming the refusal. Sets
#                             SP_JOB_BASE_PROFILE and SP_RUN_PROFILE (the base profile), SP_CLONE
#                             (SP_MAIN), SP_JOB_ORIG_BRANCH, SP__JOB_SWITCHED, SP_JOB_RUNNER_TEMP and
#                             SP_JOB_PLACEHOLDER_HOST; switches SP_MAIN to SP_BRANCH and pushes it with a
#                             plain refspec. Needs SP_MAIN, SP_TMP, SP_SCRIPTS and SP_BRANCH set.
#   sp_job_add_dirs <base profile> <cwd> <state root>
#                             sets the array SP_JOB_ADD_DIRS; never fails
#   sp_job_manifest_write <settings file> <add-dir root>...
#                             writes the placeholder manifest on a placeholder host; the first root is
#                             the session's cwd. A failed or refused step is one stderr line; status 0
#   sp_job_teardown           the sweep, its output on stderr as `sandbox-probe: job-sweep: <line>`, then
#                             the switch back to SP_JOB_ORIG_BRANCH; failures go through sp__td_fail.
#                             Called once by sp_teardown, after its pending restore, before its clone loop
#   sp_job_git_note           prints `; read before the placeholder sweep`, for a leg's git-state evidence
# Every function is a no-op returning 0 (sp_job_git_note printing nothing, SP_JOB_ADD_DIRS empty) when
# SP_JOB_MODE is not 1.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_JOB_BASE_PROFILE=""
SP_JOB_ORIG_BRANCH=""
SP_JOB_RUNNER_TEMP=""
SP_JOB_PLACEHOLDER_HOST=0
SP_JOB_ADD_DIRS=()
SP__JOB_SWITCHED=0
SP__JOB_SETUP_RAN=0

sp_job_setup() {
  [ "${SP_JOB_MODE:-0}" = 1 ] || return 0
  local out rc canon_out canon_base
  SP__JOB_SETUP_RAN=1

  # 1. The base profile, through the watcher's own check with no copy.
  SP_JOB_BASE_PROFILE="$SP_MAIN/.claude/settings.autonomous.json"
  out="$(cd "$SP_MAIN" && bash -c '
    . "$1" status >/dev/null 2>&1
    if ! run_profile_check "$SETTINGS_PROFILE"; then printf "%s\n" "$RUN_PROFILE_REFUSAL"; exit 1; fi
    printf "%s\n" "$SETTINGS_PROFILE"' _ "$SP_SCRIPTS/autonomous-watcher.sh" 2>/dev/null)"
  rc=$?
  out="${out%%$'\n'*}"
  if [ "$rc" -ne 0 ] || [ -z "$out" ]; then
    [ -n "$out" ] || out="the watcher's check printed nothing"
    sp__setup_refuse "the base profile '$SP_JOB_BASE_PROFILE' was refused: $out"
    return 2
  fi
  canon_out="$(hr_canonical_path_nogit "$out")" || canon_out=""
  canon_base="$(hr_canonical_path_nogit "$SP_JOB_BASE_PROFILE")" || canon_base=""
  if [ -z "$canon_out" ] || [ "$canon_out" != "$canon_base" ]; then
    sp__setup_refuse "the watcher checked '$out', not the base profile '$SP_JOB_BASE_PROFILE'"
    return 2
  fi
  SP_RUN_PROFILE="$SP_JOB_BASE_PROFILE"

  # 2. No clone.
  SP_CLONE="$SP_MAIN"

  # 3. The probe branch, in the checkout itself.
  SP_JOB_ORIG_BRANCH="$(git -C "$SP_MAIN" symbolic-ref --short HEAD 2>/dev/null)" || SP_JOB_ORIG_BRANCH=""
  if [ -z "$SP_JOB_ORIG_BRANCH" ]; then
    sp__setup_refuse "'$SP_MAIN' has no branch checked out, so teardown could not switch back"
    return 2
  fi
  if sp__branch_taken "$SP_BRANCH"; then
    sp__setup_refuse "the probe branch '$SP_BRANCH' already exists locally or on origin"
    return 2
  fi
  if ! sp_track_branch "$SP_BRANCH"; then
    sp__setup_refuse "the probe branch '$SP_BRANCH' could not be registered for teardown"
    return 2
  fi
  if ! git -C "$SP_MAIN" switch -q -c "$SP_BRANCH" >/dev/null 2>&1; then
    sp__setup_refuse "could not switch '$SP_MAIN' to a new branch '$SP_BRANCH'"
    return 2
  fi
  SP__JOB_SWITCHED=1
  # No upstream is set: .git/config is under the shasum guard.
  if ! git -C "$SP_MAIN" push -q origin "refs/heads/$SP_BRANCH:refs/heads/$SP_BRANCH" >/dev/null 2>&1; then
    sp__setup_refuse "could not push the probe branch '$SP_BRANCH' to origin"
    return 2
  fi

  # 4. The runner temp: the job's own, or one under SP_TMP that goes with it.
  case "${RUNNER_TEMP:-}" in
    /*) SP_JOB_RUNNER_TEMP="$RUNNER_TEMP" ;;
    *)
      SP_JOB_RUNNER_TEMP="$SP_TMP/runner-temp"
      if ! mkdir -p -- "$SP_JOB_RUNNER_TEMP" 2>/dev/null; then
        sp__setup_refuse "could not create the runner temp '$SP_JOB_RUNNER_TEMP'"
        return 2
      fi
      ;;
  esac

  # 5. The host.
  hr_placeholder_host_probe_var
  SP_JOB_PLACEHOLDER_HOST="$HR_PLACEHOLDER_HOST"
  return 0
}

sp_job_add_dirs() {
  local profile="${1:-}" cwd="${2:-}" state="${3:-}" dirs dir
  SP_JOB_ADD_DIRS=()
  [ "${SP_JOB_MODE:-0}" = 1 ] || return 0
  dirs="$(jq -r '.permissions.additionalDirectories[]? // empty' "$profile" 2>/dev/null)" || dirs=""
  while IFS= read -r dir; do
    [ -n "$dir" ] || continue
    case "${dir%/}" in
      "${cwd%/}" | "${state%/}") continue ;;
    esac
    SP_JOB_ADD_DIRS[${#SP_JOB_ADD_DIRS[@]}]="$dir"
  done <<EOF
$dirs
EOF
  return 0
}

# sp__job_writable_root <manifest> <cwd> <root>... — placeholder_manifest_writable_root, line for line.
sp__job_writable_root() {
  local m r root abs cwd="${2-}"
  m="$(hr_canonical_path_nogit "${1-}")" || {
    printf '%s\n' "${1-}"
    return 0
  }
  shift
  for root in "$@"; do
    [ -n "$root" ] || continue
    case "$root" in
      /*) abs="$root" ;;
      "~/"*) abs="${HOME-}/${root#\~/}" ;;
      *) abs="${cwd%/}/$root" ;;
    esac
    r="$(hr_canonical_path_nogit "$abs")" || {
      printf '%s\n' "$root"
      return 0
    }
    if [ "$r" = "/" ]; then
      printf '%s\n' "$root"
      return 0
    fi
    case "$m" in
      "$r" | "$r"/*)
        printf '%s\n' "$root"
        return 0
        ;;
    esac
  done
  return 1
}

sp_job_manifest_write() {
  [ "${SP_JOB_MODE:-0}" = 1 ] || return 0
  [ "$SP_JOB_PLACEHOLDER_HOST" = 1 ] || return 0
  local settings="${1:-}" manifest root line deny_paths paths
  shift
  paths=()
  manifest="$(RUNNER_TEMP="$SP_JOB_RUNNER_TEMP" hr_job_absent_file "$SP_BRANCH")" || manifest=""
  if [ -z "$manifest" ]; then
    sp_refuse "placeholder manifest: no path for '$SP_BRANCH' — the sweep removes nothing for this session"
    return 0
  fi
  if root="$(sp__job_writable_root "$manifest" "$@")"; then
    sp_refuse "placeholder manifest: not writing $manifest, under the session-writable root $root — the sweep removes nothing for this session"
    return 0
  fi
  if ! deny_paths="$(hr_profile_deny_paths "$settings")"; then
    sp_refuse "placeholder manifest: could not read the denyWrite list of $settings — the sweep removes nothing for this session"
    return 0
  fi
  while IFS= read -r line; do
    [ -n "$line" ] && paths[${#paths[@]}]="$line"
  done <<EOF
$deny_paths
EOF
  for root in "$@"; do
    paths[${#paths[@]}]="${root%/}/.mcp.json"
  done
  if ! hr_placeholder_manifest_write "$manifest" ${paths[@]+"${paths[@]}"}; then
    sp_refuse "placeholder manifest: could not write $manifest — the sweep removes nothing for this session"
  fi
  return 0
}

sp_job_teardown() {
  [ "${SP_JOB_MODE:-0}" = 1 ] || return 0
  local out rc line status

  # 1. The sweep, as the job's `if: always()` step runs it; off a placeholder host it finds no manifest.
  if [ "$SP__JOB_SETUP_RAN" = 1 ]; then
    out="$(cd "$SP_MAIN" && HARNESS_JOB_MODE=1 RUNNER_TEMP="$SP_JOB_RUNNER_TEMP" \
      bash "$SP_SCRIPTS/autonomous-watcher.sh" job-sweep "$SP_BRANCH" </dev/null 2>&1)"
    rc=$?
    while IFS= read -r line; do
      [ -n "$line" ] && sp_refuse "job-sweep: $line"
    done <<EOF
$out
EOF
    status="$(git -C "$SP_MAIN" status --porcelain 2>/dev/null)"
    status="${status%%$'\n'*}"
    sp_refuse "job-sweep: exit $rc; git status after the sweep: ${status:-clean}"
    [ "$rc" -eq 0 ] || sp__td_fail "the job-sweep of '$SP_BRANCH' exited $rc"
  fi

  # 2. The switch back. Preflight refused tracked changes, so only the probe's own edits are discarded.
  if [ "$SP__JOB_SWITCHED" = 1 ]; then
    if git -C "$SP_MAIN" switch -q --discard-changes "$SP_JOB_ORIG_BRANCH" >/dev/null 2>&1; then
      SP__JOB_SWITCHED=0
    else
      sp__td_fail "'$SP_MAIN' is left on '$SP_BRANCH'; switch back with: git -C $SP_MAIN switch --discard-changes $SP_JOB_ORIG_BRANCH"
    fi
  fi
  return 0
}

sp_job_git_note() {
  [ "${SP_JOB_MODE:-0}" = 1 ] || return 0
  printf '%s' '; read before the placeholder sweep'
}
