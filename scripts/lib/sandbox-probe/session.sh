#!/usr/bin/env bash
# session.sh — the sandbox probe's clone, per-run profile, session launcher, prompt builders, scratch
# profiles and every-exit teardown. Tasks 5-12's legs consume this API; it runs no leg itself.
#
# THE SESSION API.
#   sp_setup                 cut the probe clone SP_CLONE on branch SP_BRANCH and render its per-run
#                            profile SP_RUN_PROFILE; installs the EXIT/INT/TERM teardown trap first
#   sp_session <name> <settings> <prompt file> [--mode dontAsk|acceptEdits] [--allowed <rule>]...
#              [--debug-file <f>] [--cwd <dir>]
#                            one headless session on the watcher's launch line; sets SP_STREAM
#   sp_departures            the last session's --allowedTools rules, as a result line's departure
#   sp_prompt_new / sp_prompt_bash / sp_prompt_tool       build a prompt file
#   sp_scratch_profile <name> <jq filter> [<base>]        a derived profile under SP_TMP
#   sp_extra_clone <branch> [--no-bootstrap] [--existing] another clone; sets SP_EXTRA_CLONE, SP_EXTRA_PROFILE
#   sp_track <path> / sp_track_branch <name>              register for teardown
#   sp_teardown              remove exactly what was registered; idempotent
#
# THE POSITIVE-CONTROL RULE (docs/sandbox-verification.md → `## 0. Method`: "a positive control in the
# same session for every refusal"). Every session that measures a refusal row also issues a positive
# control, after the calls it measures, and the row prints `not run` with evidence
# `control did not succeed: …` when its control did not succeed. sp_session launches whatever prompt it
# is given and judges nothing; controls.sh carries the rule's helpers, and each leg names its controls.
#
# The probe never edits the main checkout's base profile or SP_RUN_PROFILE: a scratch profile is a new
# file under SP_TMP.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_BRANCH=""
SP_CLONE=""
SP_RUN_PROFILE=""
SP_STREAM=""
SP_EXTRA_CLONE=""
SP_EXTRA_PROFILE=""
SP_STATE_DIR=""
SP_REGISTRY=""
SP_AGENT_MODEL=""
SP_AGENT_EFFORT=""
SP_SCRIPTS=""
SP_SLUG=""
SP_SESSION_ALLOWED=""
SP__TEARDOWN_DONE=0
SP__TRAP_SET=0
# Registered clones, in creation order: branch and path at the same index (path empty until known).
SP__CLONE_BRANCHES=()
SP__CLONE_PATHS=()
# Newline-separated registrations.
SP__TRACKED=""
SP__TRACKED_BRANCHES=""
SP__RENDERED=""
SP__RENDER_REFUSAL=""
SP__CREATE_LINE=""

# sp__on_exit — the EXIT trap: tear down if nothing has yet, and let a teardown failure raise the status.
sp__on_exit() {
  local rc=$?
  [ "$SP__TEARDOWN_DONE" -eq 1 ] && return 0
  sp_teardown
  sp_exit_final
  [ "$SP_EXIT" -gt "$rc" ] && exit "$SP_EXIT"
  exit "$rc"
}

# sp__on_signal <signal number> — tear down, then exit 128+n, so an interrupted run never reads as 0.
sp__on_signal() {
  sp_teardown
  exit $((128 + ${1:-1}))
}

sp__install_trap() {
  [ "$SP__TRAP_SET" -eq 1 ] && return 0
  trap 'sp__on_exit' EXIT
  trap 'sp__on_signal 2' INT
  trap 'sp__on_signal 15' TERM
  SP__TRAP_SET=1
}

# sp__branch_taken <branch> — status 0 when <branch> exists locally in SP_MAIN or on origin.
sp__branch_taken() {
  git -C "$SP_MAIN" show-ref --verify --quiet "refs/heads/${1:-}" && return 0
  [ -n "$(sp_remote_tip "$SP_MAIN" "${1:-}")" ] && return 0
  return 1
}

# sp__create <log name> <create-worktree.sh argument>... — run create-worktree.sh from SP_MAIN, its output
# to SP_TMP/<log name>.log; on failure SP__CREATE_LINE is its last non-empty line.
sp__create() {
  local log="$SP_TMP/$1.log" rc line last=""
  shift
  sp_refuse "running create-worktree.sh $* (log: $log)"
  (cd "$SP_MAIN" && bash "$SP_SCRIPTS/create-worktree.sh" "$@") </dev/null >"$log" 2>&1
  rc=$?
  SP__CREATE_LINE=""
  if [ "$rc" -ne 0 ]; then
    while IFS= read -r line; do
      [ -n "$line" ] && last="$line"
    done <"$log"
    SP__CREATE_LINE="create-worktree.sh exited $rc: ${last:-no output}"
  fi
  return "$rc"
}

# sp__clone_path <branch> — the registry's worktree for <branch>, checked to be a clone; status 1 otherwise.
sp__clone_path() {
  local path kind
  path="$(hr_registry_peek "$SP_REGISTRY" "${1:-}" worktree)" || return 1
  kind="$(hr_registry_peek "$SP_REGISTRY" "${1:-}" copy_kind)" || return 1
  [ -n "$path" ] && [ "$kind" = clone ] || return 1
  printf '%s\n' "$path"
}

# sp__render <branch> <clone> — the watcher's own render and check, in a child shell that sourced
# `autonomous-watcher.sh status`. Sets SP__RENDERED, or SP__RENDER_REFUSAL quoting RUN_PROFILE_REFUSAL.
sp__render() {
  local out rc
  SP__RENDERED=""
  SP__RENDER_REFUSAL=""
  out="$(bash -c '
    . "$1" status >/dev/null 2>&1
    if ! run_profile_render "$2" "$3" clone; then printf "%s\n" "$RUN_PROFILE_REFUSAL"; exit 1; fi
    if ! run_profile_check "$RUN_PROFILE_FILE" "$3"; then printf "%s\n" "$RUN_PROFILE_REFUSAL"; exit 1; fi
    printf "%s\n" "$RUN_PROFILE_FILE"' _ "$SP_SCRIPTS/autonomous-watcher.sh" "$1" "$2" 2>/dev/null)"
  rc=$?
  out="${out%%$'\n'*}"
  if [ "$rc" -ne 0 ] || [ -z "$out" ]; then
    [ -n "$out" ] || out="the watcher's render printed nothing"
    SP__RENDER_REFUSAL="the per-run profile for '$1' was refused: $out"
    return 1
  fi
  SP__RENDERED="$out"
}

# sp__register_clone <branch> — add a clone slot; its path is filled by sp__clone_set_path.
sp__register_clone() {
  SP__CLONE_BRANCHES[${#SP__CLONE_BRANCHES[@]}]="$1"
  SP__CLONE_PATHS[${#SP__CLONE_PATHS[@]}]=""
}

sp__clone_set_path() {
  local i=$((${#SP__CLONE_PATHS[@]} - 1))
  [ "$i" -ge 0 ] && SP__CLONE_PATHS[$i]="$1"
}

sp__setup_refuse() {
  sp_refuse "refusing to start: $*"
  return 2
}

sp_setup() {
  local rc
  SP_BRANCH="chore_sbx_probe_$(date -u +%Y%m%d%H%M%S)"

  # The four configured reads, each the library's own; 2 is "configuration unresolvable".
  SP_STATE_DIR="$(hr_state_dir "$SP_MAIN")" || {
    sp__setup_refuse "cannot resolve stateDir from '$SP_MAIN/harness.config.json'"
    return 2
  }
  SP_REGISTRY="$(hr_state_path "$SP_MAIN" autonomous_logs/registry.json)" || {
    sp__setup_refuse "cannot resolve the run registry under '$SP_MAIN'"
    return 2
  }
  SP_AGENT_MODEL="$(hr_agent_model "$SP_MAIN")"
  rc=$?
  case "$rc" in
    0) ;;
    1) SP_AGENT_MODEL="" ;;
    *)
      sp__setup_refuse "cannot resolve agentModel from '$SP_MAIN/harness.config.json'"
      return 2
      ;;
  esac
  # Status 1 is an unset agentEffort: an ordinary project, so the flag stays off the line.
  SP_AGENT_EFFORT="$(hr_agent_effort "$SP_MAIN")"
  rc=$?
  case "$rc" in
    0) ;;
    1) SP_AGENT_EFFORT="" ;;
    *)
      sp__setup_refuse "cannot resolve agentEffort from '$SP_MAIN/harness.config.json'"
      return 2
      ;;
  esac
  export SP_STATE_DIR SP_REGISTRY SP_AGENT_MODEL SP_AGENT_EFFORT

  local scripts_rel
  scripts_rel="$(hr_scripts_dir "$SP_MAIN")" || {
    sp__setup_refuse "cannot resolve scriptsDir from '$SP_MAIN/harness.config.json'"
    return 2
  }
  SP_SCRIPTS="$SP_MAIN/$scripts_rel"
  # The watcher's own slug, so teardown deletes the profile at the path the render wrote.
  SP_SLUG="$(bash -c '. "$1" status >/dev/null 2>&1; printf "%s\n" "$HARNESS_REPO_SLUG"' _ \
    "$SP_SCRIPTS/autonomous-watcher.sh" 2>/dev/null)" || SP_SLUG=""
  SP_SLUG="${SP_SLUG%%$'\n'*}"
  if [ -z "$SP_SLUG" ]; then
    sp__setup_refuse "the watcher at '$SP_SCRIPTS/autonomous-watcher.sh' gave no repository slug"
    return 2
  fi

  if sp__branch_taken "$SP_BRANCH"; then
    sp__setup_refuse "the probe branch '$SP_BRANCH' already exists locally or on origin"
    return 2
  fi

  sp__install_trap
  sp__register_clone "$SP_BRANCH"
  if ! sp__create probe-clone "$SP_BRANCH"; then
    sp__setup_refuse "$SP__CREATE_LINE"
    return 2
  fi
  if ! SP_CLONE="$(sp__clone_path "$SP_BRANCH")"; then
    SP_CLONE=""
    sp__setup_refuse "the run registry '$SP_REGISTRY' has no clone record for '$SP_BRANCH'"
    return 2
  fi
  sp__clone_set_path "$SP_CLONE"
  if ! sp__render "$SP_BRANCH" "$SP_CLONE"; then
    sp__setup_refuse "$SP__RENDER_REFUSAL"
    return 2
  fi
  SP_RUN_PROFILE="$SP__RENDERED"
  return 0
}

# sp_extra_clone <branch> [--no-bootstrap] [--existing] — another clone, its per-run profile rendered and
# both registered for teardown. Default mode refuses a <branch> that already exists. --existing needs a
# <branch> this probe created and registered with sp_track_branch first, so teardown never deletes a
# branch the probe did not create. Status 1 with SP_EXTRA_CLONE empty and the refusal quoted on stderr.
sp_extra_clone() {
  local branch="" existing=0 nobootstrap=0 args
  SP_EXTRA_CLONE=""
  SP_EXTRA_PROFILE=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --existing) existing=1 ;;
      --no-bootstrap) nobootstrap=1 ;;
      -*) sp_refuse "sp_extra_clone: unknown option '$1'"; return 1 ;;
      *)
        [ -z "$branch" ] || { sp_refuse "sp_extra_clone: more than one branch"; return 1; }
        branch="$1"
        ;;
    esac
    shift
  done
  [ -n "$branch" ] || { sp_refuse "sp_extra_clone: no branch"; return 1; }
  if [ "$existing" -eq 1 ]; then
    if ! printf '%s' "$SP__TRACKED_BRANCHES" | grep -qxF -- "$branch"; then
      sp_refuse "sp_extra_clone: '$branch' was not registered with sp_track_branch, so --existing will not adopt it"
      return 1
    fi
  elif sp__branch_taken "$branch"; then
    sp_refuse "sp_extra_clone: '$branch' already exists locally or on origin"
    return 1
  fi
  # The script's own usage order: [--existing] [--no-bootstrap] <branch>.
  args=()
  [ "$existing" -eq 1 ] && args[${#args[@]}]=--existing
  [ "$nobootstrap" -eq 1 ] && args[${#args[@]}]=--no-bootstrap
  args[${#args[@]}]="$branch"
  sp__register_clone "$branch"
  if ! sp__create "extra-clone-$(hr_sanitize_branch "$branch")" "${args[@]}"; then
    sp_refuse "sp_extra_clone: $SP__CREATE_LINE"
    return 1
  fi
  if ! SP_EXTRA_CLONE="$(sp__clone_path "$branch")"; then
    SP_EXTRA_CLONE=""
    sp_refuse "sp_extra_clone: the run registry has no clone record for '$branch'"
    return 1
  fi
  sp__clone_set_path "$SP_EXTRA_CLONE"
  if ! sp__render "$branch" "$SP_EXTRA_CLONE"; then
    sp_refuse "sp_extra_clone: $SP__RENDER_REFUSAL"
    SP_EXTRA_CLONE=""
    return 1
  fi
  SP_EXTRA_PROFILE="$SP__RENDERED"
  return 0
}

# sp_track <path> — remove at teardown: a plain file by name, a directory through sp_rm_tree.
sp_track() {
  case "${1:-}" in
    "" | *$'\n'*) sp_refuse "sp_track: empty path, or one carrying a newline"; return 1 ;;
  esac
  SP__TRACKED="$SP__TRACKED$1"$'\n'
}

# sp_track_branch <name> — delete at teardown, locally and on origin. A protected branch is refused.
sp_track_branch() {
  case "${1:-}" in
    "" | *$'\n'*) sp_refuse "sp_track_branch: empty name, or one carrying a newline"; return 1 ;;
  esac
  # hr_branch_is_protected: 1 is the only "not protected"; 2 (unresolvable) refuses too.
  hr_branch_is_protected "$SP_MAIN" "$1"
  if [ $? -ne 1 ] || [ "$1" = "${SP_DEFAULT_BRANCH:-}" ]; then
    sp_refuse "sp_track_branch: '$1' is the default or a protected branch, or the protected set is unresolvable"
    return 1
  fi
  SP__TRACKED_BRANCHES="$SP__TRACKED_BRANCHES$1"$'\n'
}

# sp_session <name> <settings file> <prompt file> [--mode dontAsk|acceptEdits] [--allowed <rule>]...
#            [--debug-file <f>] [--cwd <dir>]
# The watcher's launch line (autonomous-watcher.sh → spawn_engine), departing only by the --allowedTools
# and --debug-file flags named. Status is the agent CLI's.
sp_session() {
  local name="${1:-}" settings="${2:-}" pfile="${3:-}" mode=dontAsk cwd="$SP_CLONE" debug="" prompt cli rc
  local allowed_args model_args effort_args debug_args
  allowed_args=()
  debug_args=()
  SP_SESSION_ALLOWED=""
  SP_STREAM=""
  if [ $# -lt 3 ]; then
    sp_refuse "usage: sp_session <name> <settings file> <prompt file> [options]"
    return 1
  fi
  shift 3
  while [ $# -gt 0 ]; do
    case "$1" in
      --mode)
        case "${2:-}" in
          dontAsk | acceptEdits) mode="$2" ;;
          *) sp_refuse "sp_session: --mode '${2:-}' is not dontAsk or acceptEdits"; return 1 ;;
        esac
        shift 2
        ;;
      --allowed)
        [ $# -ge 2 ] || { sp_refuse "sp_session: --allowed needs a rule"; return 1; }
        allowed_args[${#allowed_args[@]}]=--allowedTools
        allowed_args[${#allowed_args[@]}]="$2"
        SP_SESSION_ALLOWED="$SP_SESSION_ALLOWED$2"$'\n'
        shift 2
        ;;
      --debug-file)
        [ $# -ge 2 ] || { sp_refuse "sp_session: --debug-file needs a path"; return 1; }
        debug="$2"
        shift 2
        ;;
      --cwd)
        [ $# -ge 2 ] || { sp_refuse "sp_session: --cwd needs a directory"; return 1; }
        cwd="$2"
        shift 2
        ;;
      *) sp_refuse "sp_session: unknown option '$1'"; return 1 ;;
    esac
  done
  case "$name" in
    "" | */* | *$'\n'*) sp_refuse "sp_session: name '$name' is empty or carries a '/'"; return 1 ;;
  esac
  if [ ! -r "$settings" ] || [ ! -r "$pfile" ] || [ ! -d "$cwd" ]; then
    sp_refuse "sp_session $name: settings '$settings', prompt '$pfile' or cwd '$cwd' is missing"
    return 1
  fi
  [ -z "$debug" ] || debug_args=(--debug-file "$debug")
  model_args=()
  effort_args=()
  if [ -n "$SP_AGENT_MODEL" ]; then
    model_args=(--model "$SP_AGENT_MODEL")
  fi
  if [ -n "$SP_AGENT_EFFORT" ]; then
    effort_args=(--effort "$SP_AGENT_EFFORT")
  fi
  prompt="$(cat -- "$pfile")"
  cli="${SANDBOX_PROBE_AGENT_CLI:-}"
  [ -n "$cli" ] || cli=claude
  SP_STREAM="$SP_TMP/$name.stream.jsonl"
  (
    cd "$cwd" || exit 97
    export HARNESS_MAIN_REPO="$SP_MAIN"
    exec "$cli" -p "$prompt" \
      --settings "$settings" \
      --permission-mode "$mode" \
      ${model_args[@]+"${model_args[@]}"} \
      ${effort_args[@]+"${effort_args[@]}"} \
      --output-format stream-json --verbose \
      --add-dir "$cwd" \
      --add-dir "$SP_MAIN/$SP_STATE_DIR" \
      ${allowed_args[@]+"${allowed_args[@]}"} \
      ${debug_args[@]+"${debug_args[@]}"}
  ) </dev/null >"$SP_STREAM" 2>"$SP_TMP/$name.stderr"
  rc=$?
  return "$rc"
}

# sp_departures — the last session's departures from the watcher's line, or nothing.
sp_departures() {
  local rule out=""
  while IFS= read -r rule; do
    [ -n "$rule" ] || continue
    [ -z "$out" ] || out="$out; "
    out="$out--allowedTools $rule"
  done <<EOF
$SP_SESSION_ALLOWED
EOF
  [ -n "$out" ] && printf '%s\n' "$out"
  return 0
}

# sp__prompt_next <file> — the next call number in a prompt file.
sp__prompt_next() {
  local n
  n="$(grep -c '^Call [0-9]' "$1" 2>/dev/null)" || n=0
  printf '%s\n' $((n + 1))
}

sp_prompt_new() {
  [ -n "${1:-}" ] || { sp_refuse "sp_prompt_new: no file"; return 1; }
  cat >"$1" <<'EOF'
Issue each call below exactly as written, one tool call per call, in the order given. Do not retry a
call, do not work around a refusal, do not add any command or tool call of your own, and do not append
anything to a command (no `; echo $?`). A refused call is a result, not a problem to solve. Stop after
the last call.

EOF
}

# sp_prompt_bash <file> <command> — one Bash call; the command sits alone on its own line.
sp_prompt_bash() {
  local n
  case "${2:-}" in
    "" | *$'\n'*) sp_refuse "sp_prompt_bash: empty command, or one carrying a newline"; return 1 ;;
  esac
  n="$(sp__prompt_next "$1")"
  printf 'Call %s. Bash, with the command parameter set to exactly the next line, byte for byte:\n%s\n\n' "$n" "$2" >>"$1"
}

# sp_prompt_tool <file> <sentence> — one non-Bash call, e.g. `Edit <path> (after Read)`.
sp_prompt_tool() {
  local n
  case "${2:-}" in
    "" | *$'\n'*) sp_refuse "sp_prompt_tool: empty sentence, or one carrying a newline"; return 1 ;;
  esac
  n="$(sp__prompt_next "$1")"
  printf 'Call %s. %s\n\n' "$n" "$2" >>"$1"
}

# sp_scratch_profile <name> <jq filter> [<base, default SP_RUN_PROFILE>] — print SP_TMP/<name>.json.
sp_scratch_profile() {
  local name="${1:-}" filter="${2:-}" base="${3:-$SP_RUN_PROFILE}" out
  case "$name" in
    "" | */* | *$'\n'*) sp_refuse "sp_scratch_profile: name '$name' is empty or carries a '/'"; return 1 ;;
  esac
  out="$SP_TMP/$name.json"
  if ! jq "$filter" "$base" >"$out" 2>/dev/null; then
    rm -f -- "$out"
    sp_refuse "sp_scratch_profile: jq '$filter' failed on '$base'"
    return 1
  fi
  printf '%s\n' "$out"
}

sp__td_fail() {
  sp_refuse "teardown: $*"
  sp_exit_raise 5
}

# sp__td_branch <branch> — teardown steps 4 and 5.
sp__td_branch() {
  local b="$1" tip
  if git -C "$SP_MAIN" show-ref --verify --quiet "refs/heads/$b"; then
    git -C "$SP_MAIN" branch -D "$b" >/dev/null 2>&1
    if git -C "$SP_MAIN" show-ref --verify --quiet "refs/heads/$b"; then
      sp__td_fail "local branch '$b' is left; remove it with: git -C $SP_MAIN branch -D $b"
    fi
  fi
  tip="$(sp_remote_tip "$SP_MAIN" "$b")"
  if [ -n "$tip" ]; then
    git -C "$SP_MAIN" push origin --delete "$b" >/dev/null 2>&1
    if [ -n "$(sp_remote_tip "$SP_MAIN" "$b")" ]; then
      sp__td_fail "origin branch '$b' is left; remove it with: git -C $SP_MAIN push origin --delete $b"
    fi
  fi
}

# sp_rm_tree <dir> — remove a directory under SP_TMP.
sp_rm_tree() {
  # The one recursive removal in the probe, and the exception hr_clone_remove_var
  # (scripts/lib/harness-run-lib.sh) already takes for a clone, since bash has no in-process
  # recursive removal. The `## Shell assets` rule against shelling out to one exists because a
  # user-level permissions.deny matches the command string an agent's Bash tool issues; this probe
  # is started by a person from a terminal or as `! bash …`, outside the agent permission system,
  # so no deny rule reaches a line inside it. Bounded like the library's: a real directory, not a
  # symbolic link, whose canonical path is SP_TMP or lies under it.
  local dir="${1:-}" c tmpc
  if [ -z "$dir" ] || [ -L "$dir" ] || [ ! -d "$dir" ]; then
    sp__td_fail "refusing to remove '$dir': not a directory, or a symbolic link"
    return 1
  fi
  c="$(CDPATH= cd -P -- "$dir" 2>/dev/null && pwd -P)" || c=""
  tmpc=""
  if [ -n "${SP_TMP:-}" ]; then
    tmpc="$(CDPATH= cd -P -- "$SP_TMP" 2>/dev/null && pwd -P)" || tmpc=""
  fi
  if [ -z "$c" ] || [ -z "$tmpc" ] || [ "$tmpc" = / ]; then
    sp__td_fail "refusing to remove '$dir': it or SP_TMP has no canonical path"
    return 1
  fi
  case "$c" in
    "$tmpc" | "$tmpc"/*) ;;
    *)
      sp__td_fail "refusing to remove '$dir': '$c' is not under SP_TMP '$tmpc'"
      return 1
      ;;
  esac
  rm -rf -- "$c" 2>/dev/null
  if [ -e "$c" ] || [ -L "$c" ]; then
    sp__td_fail "'$c' is left; remove it by hand"
    return 1
  fi
  return 0
}

# sp_teardown — remove every registered clone (last created first) with its record, per-run profile and
# branch; then tracked branches, tracked files and directories, and SP_TMP; then sp_snapshot_check. Every
# step runs after a failed one; each failure is named on stderr and raises exit 5. Idempotent.
sp_teardown() {
  [ "$SP__TEARDOWN_DONE" -eq 1 ] && return 0
  SP__TEARDOWN_DONE=1
  trap '' INT TERM
  local i b path profile p

  i=$((${#SP__CLONE_BRANCHES[@]} - 1))
  while [ "$i" -ge 0 ]; do
    b="${SP__CLONE_BRANCHES[$i]}"
    path="${SP__CLONE_PATHS[$i]}"
    [ -n "$path" ] || path="$(hr_registry_peek "$SP_REGISTRY" "$b" worktree 2>/dev/null)" || path=""
    # 1. The clone, only through the run library.
    if [ -n "$path" ] && { [ -e "$path" ] || [ -L "$path" ]; }; then
      if ! hr_clone_remove_var "$SP_MAIN" "$path"; then
        sp__td_fail "$HR_CLONE_REFUSAL"
      fi
    fi
    # 2. Its registry record.
    if hr_registry_peek "$SP_REGISTRY" "$b" worktree >/dev/null 2>&1; then
      if ! hr_registry_drop "$SP_REGISTRY" "$b"; then
        sp__td_fail "the registry record for '$b' in '$SP_REGISTRY' is left"
      fi
    fi
    # 3. Its per-run profile.
    if profile="$(hr_run_profile_file "$SP_SLUG" "$b")" && [ -n "$profile" ]; then
      rm -f -- "$profile"
      [ ! -e "$profile" ] || sp__td_fail "the per-run profile '$profile' is left"
    else
      sp__td_fail "no per-run profile path for '$b' (slug '$SP_SLUG')"
    fi
    # 4 and 5. Its branch, locally and on origin.
    sp__td_branch "$b"
    i=$((i - 1))
  done

  while IFS= read -r b; do
    [ -n "$b" ] && sp__td_branch "$b"
  done <<EOF
$SP__TRACKED_BRANCHES
EOF

  # Plain files first, by name; directories after, through sp_rm_tree.
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    if [ -d "$p" ] && [ ! -L "$p" ]; then
      continue
    fi
    rm -f -- "$p"
    if [ -e "$p" ] || [ -L "$p" ]; then
      sp__td_fail "'$p' is left; remove it by hand"
    fi
  done <<EOF
$SP__TRACKED
EOF
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    if [ -d "$p" ] && [ ! -L "$p" ]; then
      sp_rm_tree "$p"
    fi
  done <<EOF
$SP__TRACKED
EOF
  if [ -n "${SP_TMP:-}" ] && { [ -e "$SP_TMP" ] || [ -L "$SP_TMP" ]; }; then
    sp_rm_tree "$SP_TMP" && {
      SP_TMP=""
      SP_SNAPSHOT_FILE=""
    }
  fi

  SP__CLONE_BRANCHES=()
  SP__CLONE_PATHS=()
  SP__TRACKED=""
  SP__TRACKED_BRANCHES=""
  sp_snapshot_check
  return 0
}
