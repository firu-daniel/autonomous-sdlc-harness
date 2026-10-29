#!/usr/bin/env bash
# preflight.sh — the sandbox probe's start-up refusals (`sp_preflight`) and the shasum guard over the
# main checkout's three protected files (`sp_snapshot_take`, `sp_snapshot_check`, `sp_snapshot_release`).
#
# THE REFUSALS, IN ORDER. Each prints one line `sandbox-probe: refusing to start: <reason>` on stderr and
# makes `sp_preflight` return 2. Nothing is created before check 1 passes; the snapshot's temp directory
# (SP_TMP) is the only thing created after it, and a later refusal re-checks the snapshot and removes
# that directory before returning, so a refusal, an interrupt or an early exit leaves nothing behind.
#   1. The probe's own checkout is not the main checkout: create-worktree.sh's own placement predicate
#      (hr_repo_root, hr_main_repo, hr_wrapper_main_of compared canonically, then hr_run_main_set_var),
#      plus a checkout carrying .git/objects/info/alternates, which is a `git clone --shared` run copy
#      that predicate accepts as a main checkout. Sets SP_MAIN.
#      -> sp_snapshot_take runs here, before check 2.
#   2. Neither macOS nor Linux (`uname -s` is not Darwin or Linux; sets SP_PLATFORM through sp_platform_of).
#      Under SP_PREFLIGHT_PREREQ=absent, also anything but Linux.
#   3. <main> is not on `defaultBranch` (hr_default_branch; sets SP_DEFAULT_BRANCH).
#   4. The watcher has a run in flight (its running_count, in a child shell that sourced
#      `<main>/<scriptsDir>/autonomous-watcher.sh status`).
#   5. The watcher's cleanup sweep (cleanup-merged-worktrees.sh) has a branch to delete: a local branch
#      of <main> whose upstream is gone, or would be after the sweep's fetch
#      (sp_preflight_cleanup_pending). The sweep's `git branch -D` removes that branch's
#      `[branch "<b>"]` section from <main>/.git/config, which trips the guard mid-run although no
#      session wrote the file (2026-10-27, run 2). Also refused when the remote the
#      sweep fetches cannot be listed.
#   6. doctor prints no PASS line for one of profile-sandbox, profile-write-protection,
#      profile-main-anchor, sandbox-prerequisites (its exit status is ignored), or the watcher's
#      SETTINGS_PROFILE is not <main>/.claude/settings.autonomous.json, the file doctor grades.
#      Under SP_PREFLIGHT_PREREQ=absent, sandbox-prerequisites must print a line that is not PASS
#      instead, and the check also refuses when both `sp_prereq_cmd bwrap` and `sp_prereq_cmd socat`
#      resolve on PATH.
#   7. The agent CLI does not resolve on PATH. Sets SP_VERSION from one `<agent cli> --version`.
#
# SP_PREFLIGHT_PREREQ selects checks 2 and 6: `present` (also when empty or unset) for preflight and run,
# `absent` for the refusal subcommand, which measures a Linux host lacking bwrap or socat. The entry
# point assigns it before every sp_preflight call; it is never read from the caller's environment.
#
# TEST-ONLY SEAMS. An unset or empty value means the default.
#   SANDBOX_PROBE_UNAME      replaces the output of `uname -s`
#   SANDBOX_PROBE_DOCTOR     a command line run by `bash -c` in <main>, replacing
#                            `node <main>/cli/dist/cli.js doctor`
#   SANDBOX_PROBE_AGENT_CLI  replaces `claude`, as HARNESS_AGENT_CLI does for the watcher
#   SANDBOX_PROBE_BWRAP      replaces `bwrap` in check 6 under `absent` (platform.sh → sp_prereq_cmd)
#   SANDBOX_PROBE_SOCAT      replaces `socat` likewise
#
# The probe never edits <main>/.claude/settings.autonomous.json; the guard exists to prove it.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_SNAPSHOT=""
SP_SNAPSHOT_FILE=""
SP_SNAPSHOT_REFUSAL=""

# sp_preflight_refuse <reason> — print the refusal; when a snapshot was taken, check it and release it.
sp_preflight_refuse() {
  sp_refuse "refusing to start: $*"
  if [ -n "$SP_SNAPSHOT" ]; then
    sp_snapshot_check
    sp_snapshot_release
  fi
  return 2
}

sp_preflight() {
  local lib probe_scripts top main_repo placed main_c top_c uname_s head watcher out count settings
  local doctor_out id line status want cli f1 f2 f3 rest s_dir

  # --- 1. The probe's own checkout is the main checkout.
  probe_scripts="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)" || probe_scripts=""
  lib="$probe_scripts/lib/harness-run-lib.sh"
  if [ -z "$probe_scripts" ] || [ ! -r "$lib" ]; then
    sp_preflight_refuse "cannot read the run library at '$lib'"
    return 2
  fi
  # shellcheck source=../harness-run-lib.sh
  . "$lib"
  top="$(hr_repo_root "$probe_scripts")" || top=""
  if [ -z "$top" ]; then
    sp_preflight_refuse "'$probe_scripts' is not inside a git repository"
    return 2
  fi
  main_repo="$(hr_main_repo "$top")" || main_repo=""
  [ -n "$main_repo" ] || main_repo="$top"
  placed="$(hr_wrapper_main_of "$probe_scripts")" || placed=""
  main_c="$(CDPATH= cd -P -- "$main_repo" 2>/dev/null && pwd -P)" || main_c=""
  top_c="$(CDPATH= cd -P -- "$top" 2>/dev/null && pwd -P)" || top_c=""
  if [ -z "$placed" ] || [ "$placed" != "$main_c" ] || [ "$placed" != "$top_c" ]; then
    sp_preflight_refuse "the probe's checkout '$top' is not the main checkout (its scripts directory places as '${placed:-nothing}', the main checkout is '$main_repo')"
    return 2
  fi
  if ! hr_run_main_set_var "$main_repo"; then
    sp_preflight_refuse "the probe's checkout '$top' is not the main checkout: $HR_RUN_REFUSAL"
    return 2
  fi
  if [ -e "$HR_RUN_MAIN/.git/objects/info/alternates" ] || [ -L "$HR_RUN_MAIN/.git/objects/info/alternates" ]; then
    sp_preflight_refuse "the probe's checkout '$top' is not the main checkout: it borrows objects through .git/objects/info/alternates, so it is a run copy; run the main checkout's own scripts/sandbox-probe.sh"
    return 2
  fi
  SP_MAIN="$HR_RUN_MAIN"

  if ! sp_snapshot_take; then
    sp_preflight_refuse "$SP_SNAPSHOT_REFUSAL"
    return 2
  fi

  # --- 2. macOS or Linux; Linux alone under `absent`.
  uname_s="${SANDBOX_PROBE_UNAME:-}"
  [ -n "$uname_s" ] || uname_s="$(uname -s 2>/dev/null)"
  SP_PLATFORM="$(sp_platform_of "$uname_s")" || SP_PLATFORM=""
  if [ -z "$SP_PLATFORM" ]; then
    sp_preflight_refuse "this probe measures the macOS and Linux sandboxes and 'uname -s' is '$uname_s'"
    return 2
  fi
  if [ "${SP_PREFLIGHT_PREREQ:-present}" = absent ] && [ "$SP_PLATFORM" != linux ]; then
    sp_preflight_refuse "the refusal subcommand measures a Linux host lacking bwrap or socat, and 'uname -s' is '$uname_s'"
    return 2
  fi

  # --- 3. <main> on the default branch.
  SP_DEFAULT_BRANCH="$(hr_default_branch "$SP_MAIN")" || SP_DEFAULT_BRANCH=""
  if [ -z "$SP_DEFAULT_BRANCH" ]; then
    sp_preflight_refuse "cannot read defaultBranch from '$SP_MAIN/harness.config.json' (absent, invalid, or jq missing)"
    return 2
  fi
  head="$(git -C "$SP_MAIN" symbolic-ref --short HEAD 2>/dev/null)" || head=""
  if [ "$head" != "$SP_DEFAULT_BRANCH" ]; then
    sp_preflight_refuse "the main checkout '$SP_MAIN' is on '${head:-a detached HEAD}', not the default branch '$SP_DEFAULT_BRANCH'"
    return 2
  fi

  # --- 4. No watcher run in flight; SETTINGS_PROFILE read in the same child shell for check 6.
  watcher="$probe_scripts/autonomous-watcher.sh"
  if [ ! -r "$watcher" ]; then
    sp_preflight_refuse "cannot read the watcher at '$watcher'"
    return 2
  fi
  out="$(bash -c '. "$1" status >/dev/null; running_count; printf "%s\n" "$SETTINGS_PROFILE"' _ "$watcher" 2>/dev/null)" || out=""
  count="${out%%$'\n'*}"
  settings="${out#*$'\n'}"
  settings="${settings%%$'\n'*}"
  case "$count" in
    '' | *[!0-9]*)
      sp_preflight_refuse "the watcher's running_count gave no count (sourced '$watcher' status)"
      return 2
      ;;
  esac
  if [ "$count" -ne 0 ]; then
    sp_preflight_refuse "the watcher has $count run(s) in flight; wait for them or stop them first"
    return 2
  fi

  # --- 5. Nothing for the cleanup sweep to delete while the probe runs.
  if ! sp_preflight_cleanup_pending "$SP_MAIN"; then
    sp_preflight_refuse "$SP__PENDING_WHY"
    return 2
  fi
  if [ -n "$SP__PENDING" ]; then
    sp_preflight_refuse "the main checkout '$SP_MAIN' has local branch(es) whose upstream is gone, which the watcher's cleanup sweep would delete mid-run, changing .git/config: $SP__PENDING; wait for the watcher's next cleanup pass, or run 'bash $probe_scripts/cleanup-merged-worktrees.sh' from the main checkout, then retry"
    return 2
  fi

  # --- 6. The profile doctor grades is the live one.
  if [ -n "${SANDBOX_PROBE_DOCTOR:-}" ]; then
    doctor_out="$(cd "$SP_MAIN" && bash -c "$SANDBOX_PROBE_DOCTOR" 2>&1)"
  else
    if [ ! -f "$SP_MAIN/cli/dist/cli.js" ]; then
      sp_preflight_refuse "'$SP_MAIN/cli/dist/cli.js' is missing; run 'npm run build' in the main checkout first"
      return 2
    fi
    doctor_out="$(cd "$SP_MAIN" && node "$SP_MAIN/cli/dist/cli.js" doctor 2>&1)"
  fi
  for want in profile-sandbox profile-write-protection profile-main-anchor sandbox-prerequisites; do
    status=""
    line=""
    while IFS= read -r line; do
      # doctor prints `PASS  <id>  …`, `! WARN  <id>  …`, `!! FAIL  <id>  …`.
      read -r f1 f2 f3 rest <<<"$line"
      case "$f1" in
        '!' | '!!') f1="$f2"; id="$f3" ;;
        *) id="$f2" ;;
      esac
      if [ "$id" = "$want" ]; then
        status="$f1"
        break
      fi
    done <<<"$doctor_out"
    if [ "${SP_PREFLIGHT_PREREQ:-present}" = absent ] && [ "$want" = sandbox-prerequisites ]; then
      if [ -z "$status" ]; then
        sp_preflight_refuse "doctor printed no line for $want"
        return 2
      fi
      if [ "$status" = PASS ]; then
        sp_preflight_refuse "doctor passes sandbox-prerequisites, so this host can start the sandbox and the refusal subcommand has nothing to measure: $line"
        return 2
      fi
      continue
    fi
    if [ "$status" != PASS ]; then
      if [ -n "$status" ]; then
        sp_preflight_refuse "doctor does not pass $want: $line"
      else
        sp_preflight_refuse "doctor printed no line for $want"
      fi
      return 2
    fi
  done
  if [ "${SP_PREFLIGHT_PREREQ:-present}" = absent ] \
    && command -v "$(sp_prereq_cmd bwrap)" >/dev/null 2>&1 \
    && command -v "$(sp_prereq_cmd socat)" >/dev/null 2>&1; then
    sp_preflight_refuse "the refusal subcommand needs bwrap or socat missing from PATH, and both resolve"
    return 2
  fi
  want="$SP_MAIN/.claude/settings.autonomous.json"
  if [ "$settings" != "$want" ]; then
    # MAIN_REPO in the watcher need not be spelled canonically; compare the directory canonically.
    s_dir="$(CDPATH= cd -P -- "$(dirname -- "$settings")" 2>/dev/null && pwd -P)" || s_dir=""
    if [ -z "$settings" ] || [ "$s_dir/$(basename -- "$settings")" != "$want" ]; then
      sp_preflight_refuse "the watcher's SETTINGS_PROFILE is '${settings:-empty}', not '$want', the file doctor grades"
      return 2
    fi
  fi

  # --- 7. The agent CLI resolves on PATH.
  cli="${SANDBOX_PROBE_AGENT_CLI:-}"
  [ -n "$cli" ] || cli=claude
  if ! command -v "$cli" >/dev/null 2>&1; then
    sp_preflight_refuse "the agent CLI '$cli' does not resolve on PATH"
    return 2
  fi
  SP_VERSION="$("$cli" --version 2>/dev/null)" || SP_VERSION=""
  SP_VERSION="${SP_VERSION%%$'\n'*}"
  return 0
}

# sp_preflight_cleanup_pending <main> — set SP__PENDING to the local branches of <main> that
# cleanup-merged-worktrees.sh would delete on its next pass, as `'<b>' (upstream <upstream> gone)`
# joined by `, `; empty when there are none. Status 1 with SP__PENDING_WHY when the remote the sweep
# fetches cannot be listed.
#
# THE SWEEP'S DECISION, MIRRORED. It runs `git fetch --prune` with no remote, which refreshes the remote
# of the branch <main> has checked out (the default branch, check 3): `branch.<defaultBranch>.remote`, or
# `origin` when that is unset. Then it deletes every local branch whose `%(upstream:track)` reads
# `[gone]`, whatever the upstream's remote (a branch tracking a deleted local branch, remote `.`,
# included), except a protected branch (hr_branch_is_protected), the branch <main> has checked out, and a
# branch whose run-registry record is in a live status. Those three exclusions are applied first here.
#
# WHAT IS PENDING. A branch already reading `[gone]` is pending. A branch whose upstream is on the
# fetched remote is also pending when its upstream ref is not among that remote's heads: the fetch would
# turn it `[gone]`, and the stale local tracking state alone misses a branch deleted on the remote since
# the last fetch, which is the case that tripped the guard. A branch tracking any other remote, or none,
# is pending only on a local `[gone]`, since the fetch does not touch its tracking ref.
#
# READ-ONLY, SO NO FETCH. A `fetch --prune` would delete remote-tracking refs and write FETCH_HEAD in the
# main checkout; `git ls-remote --heads <remote>` asks the same question and writes nothing. It runs once,
# only when a candidate tracks the fetched remote. A remote that cannot be listed refuses rather than
# passes, because the sweep runs again while the probe does. It cannot prompt: GIT_TERMINAL_PROMPT=0 for
# HTTPS, and for SSH `BatchMode=yes` and `ConnectTimeout=15` appended to the user's own GIT_SSH_COMMAND,
# or core.sshCommand, or `ssh` (left alone when only GIT_SSH is set, which GIT_SSH_COMMAND would
# override); an HTTPS transfer slower than 1 byte/s for 30 s is aborted. The person who started the probe
# is watching, so it carries no wall-clock bound of its own.
SP__PENDING=""
SP__PENDING_WHY=""
sp_preflight_cleanup_pending() {
  local main="$1" refs line branch track remote rref up current registry live="" out head
  local default fetched ssh_cmd heads="" listed=0 tab=$'\t'
  SP__PENDING=""
  SP__PENDING_WHY=""
  refs="$(git -C "$main" for-each-ref \
    --format='%(refname:short)%09%(upstream:track)%09%(upstream:remotename)%09%(upstream:remoteref)%09%(upstream:short)' \
    refs/heads/ 2>/dev/null)" || refs=""
  current="$(git -C "$main" symbolic-ref --short HEAD 2>/dev/null)" || current=""
  default="${SP_DEFAULT_BRANCH:-$current}"
  fetched="$(git -C "$main" config --get "branch.$default.remote" 2>/dev/null)" || fetched=""
  [ -n "$fetched" ] || fetched=origin
  registry="$(hr_state_path "$main" autonomous_logs/registry.json 2>/dev/null)" || registry=""
  if [ -n "$registry" ] && [ -r "$registry" ]; then
    # A mirror of cleanup-merged-worktrees.sh → live_runs: keep the status list in step with it.
    live="$(jq -r '.runs | to_entries[] | select(.value.status == "running" or .value.status == "parked" or .value.status == "park_loop" or .value.status == "paused") | .key' "$registry" 2>/dev/null)" || live=""
  fi
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    branch="${line%%"$tab"*}"
    line="${line#*"$tab"}"
    track="${line%%"$tab"*}"
    line="${line#*"$tab"}"
    remote="${line%%"$tab"*}"
    line="${line#*"$tab"}"
    rref="${line%%"$tab"*}"
    up="${line#*"$tab"}"
    # The sweep's three exclusions, first.
    [ "$branch" != "$current" ] || continue
    hr_branch_is_protected "$main" "$branch" && continue
    case $'\n'"$live"$'\n' in *$'\n'"$branch"$'\n'*) continue ;; esac
    if [ "$track" != "[gone]" ]; then
      # Not gone yet: only the fetched remote can turn it so.
      [ "$remote" = "$fetched" ] && [ -n "$rref" ] || continue
      if [ "$listed" -eq 0 ]; then
        if [ -n "${GIT_SSH_COMMAND:-}" ]; then
          ssh_cmd="$GIT_SSH_COMMAND"
        else
          ssh_cmd="$(git -C "$main" config --get core.sshCommand 2>/dev/null)" || ssh_cmd=""
          [ -n "$ssh_cmd" ] || ssh_cmd=ssh
        fi
        if [ -n "${GIT_SSH:-}" ] && [ -z "${GIT_SSH_COMMAND:-}" ]; then
          out="$(GIT_TERMINAL_PROMPT=0 git -C "$main" -c http.lowSpeedLimit=1 -c http.lowSpeedTime=30 \
            ls-remote --heads "$fetched" 2>/dev/null)"
        else
          out="$(GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="$ssh_cmd -o BatchMode=yes -o ConnectTimeout=15" \
            git -C "$main" -c http.lowSpeedLimit=1 -c http.lowSpeedTime=30 ls-remote --heads "$fetched" 2>/dev/null)"
        fi
        # $? is the status of the ls-remote substitution in whichever arm ran.
        if [ $? -ne 0 ]; then
          SP__PENDING_WHY="cannot list the branches on remote '$fetched', the one the watcher's cleanup sweep fetches ('git ls-remote --heads $fetched' failed), so whether it would delete '$branch' mid-run cannot be told"
          return 1
        fi
        listed=1
        while IFS= read -r head; do
          [ -n "$head" ] && heads="$heads${head#*"$tab"}"$'\n'
        done <<EOF
$out
EOF
      fi
      case $'\n'"$heads" in *$'\n'"$rref"$'\n'*) continue ;; esac
    fi
    SP__PENDING="${SP__PENDING:+$SP__PENDING, }'$branch' (upstream ${up:-$remote/${rref#refs/heads/}} gone)"
  done <<EOF
$refs
EOF
  return 0
}

# sp_snapshot_line <path> — `<path>\t<sha256>`, or `<path>\tmissing`; status 1 when an existing file
# cannot be hashed.
sp_snapshot_line() {
  local path="$1" sum
  if [ ! -e "$path" ] && [ ! -L "$path" ]; then
    printf '%s\tmissing\n' "$path"
    return 0
  fi
  sum="$(shasum -a 256 "$path" 2>/dev/null)" || return 1
  sum="${sum%% *}"
  [ -n "$sum" ] || return 1
  printf '%s\t%s\n' "$path" "$sum"
}

sp_snapshot_paths() {
  printf '%s\n' "$SP_MAIN/harness.config.json" "$SP_MAIN/.git/config" "$SP_MAIN/.claude/settings.autonomous.json"
}

# sp_snapshot_take — create SP_TMP, the probe's only temp area, and record the three files' hashes in
# SP_TMP/snapshot.tsv and in SP_SNAPSHOT. The check reads SP_SNAPSHOT, so it still works after the
# teardown has removed SP_TMP. Status 1 with SP_SNAPSHOT_REFUSAL set, SP_TMP removed, on failure.
sp_snapshot_take() {
  local path line snap=""
  SP_SNAPSHOT_REFUSAL=""
  # An explicit template: macOS mktemp ignores TMPDIR otherwise (docs/sandbox-verification.md §5 F2).
  SP_TMP="$(mktemp -d "${TMPDIR:-/tmp}/sandbox-probe.XXXXXX")" || SP_TMP=""
  if [ -z "$SP_TMP" ]; then
    SP_SNAPSHOT_REFUSAL="cannot create a temp directory under '${TMPDIR:-/tmp}'"
    return 1
  fi
  # Until sp_setup's sp__install_trap replaces these, an interrupt or an early exit still releases SP_TMP.
  trap 'sp_snapshot_release' EXIT
  trap 'sp_snapshot_release; exit 130' INT
  trap 'sp_snapshot_release; exit 143' TERM
  while IFS= read -r path; do
    if ! line="$(sp_snapshot_line "$path")"; then
      SP_SNAPSHOT_REFUSAL="cannot hash '$path' with 'shasum -a 256'"
      sp_snapshot_release
      return 1
    fi
    snap="$snap$line"$'\n'
  done <<EOF
$(sp_snapshot_paths)
EOF
  SP_SNAPSHOT_FILE="$SP_TMP/snapshot.tsv"
  if ! printf '%s' "$snap" >"$SP_SNAPSHOT_FILE"; then
    SP_SNAPSHOT_REFUSAL="cannot write '$SP_SNAPSHOT_FILE'"
    sp_snapshot_release
    return 1
  fi
  SP_SNAPSHOT="$snap"
  return 0
}

# sp_snapshot_check — re-hash the three files; on any difference print one FAILED line per changed file,
# raise exit 3 and return 3. Returns 0 when no snapshot was taken.
sp_snapshot_check() {
  local path recorded now changed=0
  [ -n "$SP_SNAPSHOT" ] || return 0
  while IFS=$'\t' read -r path recorded; do
    [ -n "$path" ] || continue
    now="$(sp_snapshot_line "$path")" || now="$path"$'\t'"unreadable"
    if [ "$now" != "$path"$'\t'"$recorded" ]; then
      echo "sandbox-probe: FAILED: $path changed during the probe" >&2
      changed=1
    fi
  done <<EOF
$SP_SNAPSHOT
EOF
  if [ "$changed" -ne 0 ]; then
    sp_exit_raise 3
    return 3
  fi
  return 0
}

# sp_snapshot_release — remove the snapshot file and SP_TMP when nothing else is in it, without a
# recursive removal; for a path that ends with the snapshot (preflight alone, or a refusal after it).
# Anything left is named on stderr with exit 5.
sp_snapshot_release() {
  [ -n "${SP_TMP:-}" ] || return 0
  [ -d "$SP_TMP" ] || { SP_TMP=""; return 0; }
  if [ -n "$SP_SNAPSHOT_FILE" ] && [ -f "$SP_SNAPSHOT_FILE" ]; then
    rm -f -- "$SP_SNAPSHOT_FILE"
  fi
  if ! rmdir -- "$SP_TMP" 2>/dev/null; then
    sp_refuse "could not remove '$SP_TMP'; remove it by hand"
    sp_exit_raise 5
    return 1
  fi
  SP_TMP=""
  SP_SNAPSHOT_FILE=""
  return 0
}
