#!/usr/bin/env bash
# launch-sandboxed-gates.sh — start a Run gates round of <label> for the run
# copy <target> under a `bwrap` sandbox of this script's own, detached so it
# outlives the calling Bash call, and answer `pending` once it has started.
#
# Used by: the Phase G binding `<gate_launcher>`
# (`plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run
# the gates`), issued before the run form on every autonomous fork.
#
# WHY IT EXISTS. On a bubblewrap host a process detached inside a sandboxed Bash
# call did not outlive the call (`docs/sandbox-verification.md` §5 F10; BG9,
# LB5, T3), so `run-test-suite.sh`'s run form never reaches a verdict there. The
# MAIN checkout's copy of this script is a `sandbox.excludedCommands` entry: it
# runs outside Claude Code's sandbox, so what it detaches survives. A gate run
# executes session-written code, which never runs unsandboxed, so this script
# runs no byte of the target itself: its one command of the target's is run
# inside the `bwrap` sandbox it builds below (`docs/sandbox-verification.md`
# §5 F10, the user's ruling: route 1, the run copy's own `run-test-suite.sh`
# never excluded).
#
# WHY IT MAY BE EXCLUDED: the git wrappers' two grounds. It is run from the main
# checkout, which the profile write-protects as it does the git wrappers, and it
# carries their checks: `hr_wrapper_main_of` places the main checkout from this
# file's own location, `hr_git_env_drop` drops the inherited git environment,
# `hr_run_target_check_var` runs `hr_wrapper_target_check_var` — accepting the
# main checkout, a clone the run registry records, or a worktree the main
# repository lists — and then refuses the linked worktree, because a run copy
# is a clone, and `hr_wrapper_branch_var` reads the branch from the main checkout.
# `hr_pinned_hooks_path` and `hr_worktree_config_check_var` are not called: they
# guard git commands run in or for the target, and this script runs none — its
# only git calls are the library's, in the main checkout.
#
# THE TARGET IS READ AS DATA ONLY. Outside the `bwrap` vector nothing here
# executes, sources or `eval`s a path under <target>. It reads the target's git
# records through the target check, its `harness.config.json` through
# `hr_state_dir` (for `stateDir` alone), and its lane files through `-f`, `-e`
# and `hr_lane_mtime`. `scriptsDir` and both profiles are read from the main
# checkout and the machine lane, never from the target.
#
# NO ENVIRONMENT VARIABLE DECIDES TRUST IN THE TARGET. An assignment prefix on
# an excluded call could set one, as `autonomous-watcher.sh`'s header says of
# `HARNESS_MAIN_REPO`; nothing here reads that or any other `HARNESS_*` name.
# What the environment does reach, as residuals:
#   - `PATH` finds `bwrap`, `jq`, `git` and `setsid`, the trust
#     `docs/sandbox-record.md` residual 5 states for the wrappers; `BASH_ENV`
#     arrives as it does for them.
#   - `HOME` reads a credential path's `~/`. The account's passwd home, where
#     `getent` answers, is masked as well, so redirecting `HOME` unmasks
#     nothing that path names.
# What keeps an assignment prefix from setting these is measured, not
# structural: a prefixed call does not match the `excludedCommands` entry and
# stays sandboxed (`docs/sandbox-verification.md` P1b, macOS, runs 2 and 3;
# P1b (Linux), `pass`, answered by F9's earlier refusal, the answer after F9's
# fix not traced). Both rows measure `push-branch.sh`; this script's own
# spelling is not measured, and no row takes it.
#
# The label pattern, the staleness bound, the lane layout and the heartbeat
# reader are the run library's (`HR_TEST_RUN_LABEL_PATTERN`,
# `HR_TEST_RUN_STALE_SECONDS`, `hr_test_run_lane_dir`, `hr_heartbeat_age`);
# `RUN_TEST_SUITE_STALE` is not honoured here.
#
# THE CHECKS, in this order, every one before anything is started:
#   1. the library beside this file, then `hr_git_env_drop`;
#   2. the argument count and form, and the label against HR_TEST_RUN_LABEL_PATTERN;
#   3. the main checkout, `hr_wrapper_main_of` this file's directory;
#   4. `hr_placeholder_host_probe_var`: not a bubblewrap host is `in-session`;
#   5. the base profile, `<main>/.claude/settings.autonomous.json` (the path
#      `autonomous-watcher.sh`'s SETTINGS_PROFILE defaults to): one JSON object
#      (`hr_json_single_object`, as in step 8), else a refusal; `.sandbox.enabled` `false` is `in-session`;
#   6. `hr_run_target_check_var <main> <target>` — a target it classifies as a
#      linked worktree is a refusal — and, when the target is
#      the main checkout, `hr_registry_foreign_copy_var` over the main
#      checkout's run registry: a live record naming another working copy is a
#      refusal (local mode); the main checkout is the target only in job mode;
#   7. `hr_wrapper_branch_var`, refusing a failure or a branch starting `-`;
#   8. the session's own profile: the base when the target is the main checkout,
#      which check 6 has established is job mode, else the per-run copy whose absolute path the watcher
#      recorded in the branch's run-registry record (`run_profile`), which must
#      be a regular, non-link, readable file holding one JSON object;
#   9. the lane: `scriptsDir` from the main checkout, `stateDir` from the
#      target, and `log_dir` (`hr_test_run_lane_dir`, with the branch check 7
#      read), whose canonical form must lie under <target>/;
#  10. the live check: a `<label>.running` heartbeat no older than
#      HR_TEST_RUN_STALE_SECONDS is `pending`;
#  11. `bwrap` on `PATH`, an absolute path to an executable file;
#  12. the preflight, `bwrap --ro-bind / / --dev /dev --unshare-all --proc /proc
#      true`, the recipe's own check (§0, PD20).
#
# THE BWRAP VECTOR (`lsg_bwrap_args_var`), against the ruling's requirements:
#   --new-session --unshare-all --die-with-parent
#       NO NETWORK: `--unshare-all` takes a new network namespace, and the
#       vector never carries `--share-net`.
#   --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --bind <target> <target>
#       WRITES ONLY TO THE TARGET: every root is read-only but <target>; `/tmp`
#       is a private tmpfs, gone with the sandbox.
#   --ro-bind <p> <p>, or --ro-bind /dev/null <p> for an absent <p>
#       NO WRITE TO A PATH THE SESSION ITSELF CANNOT WRITE: every exact
#       `.sandbox.filesystem.denyWrite` entry of the session's own profile under
#       <target>/. An absent one is pinned by a read-only placeholder, as
#       bubblewrap does for the session (§5 AP2); one whose parent is absent is
#       a refusal. The supervisor sweeps its placeholders after `bwrap` exits.
#       A `<target>/<scripts_dir>/.git` entry is pinned like every other absent
#       one, and the worker's scripts place their root past it from the nearest
#       confirmed `harness.config.json` (`lib/harness-run-lib.sh` →
#       `hr_script_root`), never by git's discovery from the scripts
#       directory (F15).
#   --ro-bind <target>/.claude <target>/.claude, and --ro-bind <p> <p> or
#   --ro-bind /dev/null <p> for each root-level built-in <p>
#       NO WRITE TO CLAUDE CODE'S OWN PROTECTED PATHS: the session's sandbox
#       write-protects them at its root whatever the profile says
#       (`docs/sandbox-verification.md`, "Claude Code's built-in protected
#       paths"); `.claude` whole, after the entries above, and `.bash_profile`,
#       `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.profile`,
#       `.ripgreprc`, `.vscode`, `.zprofile`, `.zshrc` by path.
#   --ro-bind <target>/.git <target>/.git, after the entries above
#       NO WRITE TO THE RUN COPY'S GIT RECORDS: it closes `.git/commondir`,
#       `.git/config.worktree` and `.git/objects/info/http-alternates`, which a
#       per-run profile leaves out of `denyWrite` on a bubblewrap host and no
#       placeholder may pin (§5 F9). It comes last so the placeholders above
#       are created before `.git` turns read-only.
#   --tmpfs <dir> / --ro-bind /dev/null <file>, --unsetenv <name>
#       NO READ OF A DENIED CREDENTIAL: each base-profile
#       `.sandbox.credentials.files` path that exists, and its canonical form,
#       is masked; each `.sandbox.credentials.envVars` name, and
#       `RUN_TEST_SUITE_WORKER`, is unset.
#   --setenv TMPDIR /tmp --chdir <target>
#     -- bash <target>/<scripts_dir>/run-test-suite.sh --no-detach <label>
#       EVERY SESSION-WRITTEN BYTE ONLY INSIDE IT: the target's own
#       `run-test-suite.sh` and every gate it runs are the sandbox's one command.
#
# START, SUPERVISE, WAIT. The launch form detaches the supervisor, this file
# re-invoked with `--supervise`, through `nohup`, `setsid` where it resolves,
# `</dev/null` and `disown`, then polls the lane each second for at most
# HR_TEST_RUN_STALE_SECONDS. The supervisor re-runs checks 1–9 and 11, runs `bwrap` in its
# own foreground, sweeps its placeholders through
# `hr_placeholder_sweep_paths_var`, and exits with `bwrap`'s status, printing
# nothing on stdout. Issued directly, `--supervise` only runs that same
# sandboxed gate run in the caller's foreground, so it needs no guard of its
# own.
#
# Usage:
#   launch-sandboxed-gates.sh <target> <label>               start a sandboxed gate run of <label> in <target>
#   launch-sandboxed-gates.sh --supervise <target> <label>   the detached supervisor; runs `bwrap` in the foreground
#
# Exit map (the launch form prints one stdout line, or nothing on a refusal):
#   2  refusal — one stderr line `launch-sandboxed-gates.sh: <reason>`, nothing
#      on stdout: bad arguments, a label outside HR_TEST_RUN_LABEL_PATTERN, an unplaceable
#      main checkout, an unparsable base or per-run profile, a refused target
#      (a linked worktree included), the main checkout as the target outside job mode, an unreadable run
#      registry, an unreadable branch, a lane outside <target>, an unreadable heartbeat,
#      `bwrap` not on `PATH`, `bwrap` unable to start a sandbox, a protected
#      path whose parent is absent, or a run that did not start
#   3  `pending` — a run of <label> is live, or this call's run claimed
#      `.running` or wrote `.verdict` at or after this call's start second;
#      collect it with `run-test-suite.sh --wait <label>`
#   4  `in-session` — not a bubblewrap host, or the base profile's
#      `.sandbox.enabled` is `false`; issue the run form in the session
# The supervisor exits with `bwrap`'s status, 2 on a refusal and 4 in-session,
# printing nothing on stdout.

set -uo pipefail

refuse() {
  echo "launch-sandboxed-gates.sh: $1" >&2
  exit 2
}

# 1.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
hr_lib="$script_dir/lib/harness-run-lib.sh"
[ -r "$hr_lib" ] || refuse "cannot read '$hr_lib'"
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"
hr_git_env_drop

# 2.
usage='usage: launch-sandboxed-gates.sh <target> <label> | launch-sandboxed-gates.sh --supervise <target> <label>'
mode=launch
case "$#" in
  2) target_arg="$1" label="$2" ;;
  3)
    [ "$1" = --supervise ] || refuse "$usage"
    mode=supervise
    target_arg="$2" label="$3"
    ;;
  *) refuse "$usage" ;;
esac
[ -n "$target_arg" ] || refuse "$usage"
[[ "$label" =~ $HR_TEST_RUN_LABEL_PATTERN ]] || refuse "label '$label' does not match $HR_TEST_RUN_LABEL_PATTERN"

in_session() {
  [ "$mode" = supervise ] || echo in-session
  exit 4
}

# 3.
main="$(hr_wrapper_main_of "$script_dir")" ||
  refuse "cannot place this script in a main checkout (its .git is a symbolic link, or a directory holding a commondir)"

# 4.
hr_placeholder_host_probe_var
[ "$HR_PLACEHOLDER_HOST" = 1 ] || in_session

# 5.
base="$main/.claude/settings.autonomous.json"
[ -f "$base" ] && [ -r "$base" ] && hr_json_single_object "$base" ||
  refuse "cannot read '$base' as one JSON object (absent, unreadable, invalid JSON, or jq missing)"
enabled="$(jq -r 'if .sandbox.enabled == false then "off" else "on" end' "$base" 2>/dev/null)" ||
  refuse "cannot read '$base' as one JSON object (absent, unreadable, invalid JSON, or jq missing)"
[ "$enabled" != off ] || in_session

# 6. The canonical form is the one every later path is built on.
target="$( CDPATH= cd -P -- "$target_arg" 2>/dev/null && pwd -P )" ||
  refuse "the target '$target_arg' is not a directory"
hr_run_target_check_var "$main" "$target" || refuse "$HR_TARGET_REFUSAL"
if [ "$HR_TARGET_KIND" = main ]; then
  registry="$(hr_state_path "$main" autonomous_logs/registry.json)" ||
    refuse "cannot resolve the run registry of '$main' to tell job mode from local mode"
  hr_registry_foreign_copy_var "$registry" "$main"
  case $? in
    0) ;;
    1) refuse "the target '$target' is the main checkout, accepted only in job mode, and the run registry records the live run $HR_REGISTRY_FOREIGN" ;;
    *) refuse "cannot read the run registry '$registry' to tell job mode from local mode" ;;
  esac
fi

# 7.
hr_wrapper_branch_var "$main" "$HR_TARGET_GITDIR" ||
  refuse "cannot read the branch of '$target' (detached HEAD?)"
branch="$HR_WRAPPER_BRANCH"
case "$branch" in
  -*) refuse "branch '$branch' starts with '-'" ;;
esac

# 8.
if [ "$HR_TARGET_KIND" = main ]; then
  profile="$base"
else
  registry="$(hr_state_path "$main" autonomous_logs/registry.json)" || registry=""
  profile=""
  [ -z "$registry" ] || profile="$(hr_registry_peek "$registry" "$branch" run_profile)" || profile=""
  case "$profile" in
    *$'\n'*) profile="" ;;
    /*) ;;
    *) profile="" ;;
  esac
  [ -n "$profile" ] ||
    refuse "the run registry records no per-run profile for '$branch': the gate sandbox takes its protected paths from the session's own profile"
  if [ ! -f "$profile" ] || [ -L "$profile" ] || [ ! -r "$profile" ] ||
    ! hr_json_single_object "$profile"; then
    refuse "no per-run profile for '$branch' at $profile: the gate sandbox takes its protected paths from the session's own profile"
  fi
fi

# 9.
scripts_dir="$(hr_scripts_dir "$main")" || refuse "cannot resolve scriptsDir from '$main/harness.config.json'"
state_dir="$(hr_state_dir "$target")" || refuse "cannot resolve stateDir from '$target/harness.config.json'"
case "$state_dir" in
  /*) refuse "stateDir '$state_dir' in '$target/harness.config.json' is not repo-relative" ;;
esac
log_dir="$target/$(hr_test_run_lane_dir "$state_dir" "$branch")" ||
  refuse "cannot read the branch of '$target' (detached HEAD?)"
canonical_log_dir="$(hr_canonical_path_nogit "$log_dir")" || canonical_log_dir=""
case "$canonical_log_dir" in
  "$target"/?*) ;;
  *) refuse "the lane '$log_dir' does not lie under '$target'" ;;
esac
running_file="$log_dir/$label.running"
verdict_file="$log_dir/$label.verdict"

# Set `LSG_ARGS` to the `bwrap` vector (THE BWRAP VECTOR, header) and
# `LSG_PLACEHOLDERS` to the newline-joined placeholder paths it mounts; 1 with
# `LSG_REFUSAL` set when it cannot be built.
lsg_bwrap_args_var() {
  local target="$1" label="$2" scripts_dir="$3" profile="$4" base="$5"
  local list p c leaf home homes h rel name script nl='
'
  LSG_ARGS=(--new-session --unshare-all --die-with-parent
    --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --bind "$target" "$target")
  LSG_PLACEHOLDERS=""
  LSG_REFUSAL=""

  if ! list="$(jq -r '.sandbox.filesystem.denyWrite
      | if type == "array" then .[] | strings | select(contains("\n") | not)
        else error("denyWrite is not a list") end' "$profile" 2>/dev/null)"; then
    LSG_REFUSAL="cannot read .sandbox.filesystem.denyWrite as a list from '$profile'"
    return 1
  fi
  while IFS= read -r p; do
    case "$p" in /*) ;; *) continue ;; esac
    case "$p" in *'*'*) continue ;; esac
    # Canonical parent, literal leaf, so a link entry is bound as itself.
    while [ "$p" != / ] && [ "${p%/}" != "$p" ]; do p="${p%/}"; done
    leaf="${p##*/}"
    case "$leaf" in
      '' | . | ..) c="$(hr_canonical_path_nogit "$p")" || continue ;;
      *)
        c="$(hr_canonical_path_nogit "${p%/*}/")" || continue
        c="${c%/}/$leaf"
        ;;
    esac
    case "$c" in "$target"/?*) ;; *) continue ;; esac
    if [ -e "$c" ] || [ -L "$c" ]; then
      LSG_ARGS+=(--ro-bind "$c" "$c")
    elif [ -d "${c%/*}" ]; then
      LSG_ARGS+=(--ro-bind /dev/null "$c")
      LSG_PLACEHOLDERS="$LSG_PLACEHOLDERS$c$nl"
    else
      LSG_REFUSAL="cannot protect '$p' in the gate sandbox: its parent directory is absent"
      return 1
    fi
  done <<EOF
$list
EOF

  # Claude Code's own protected paths at the target's root, which its sandbox
  # write-protects whatever the profile says (`docs/sandbox-verification.md`,
  # the paragraph "Claude Code's built-in protected paths, new in this
  # session."): `.claude` whole, read-only after the loop so the loop's
  # placeholders under it are created first, and each root-level one by path.
  # `.mcp.json` is left out: every profile's exact list carries it.
  for rel in .bash_profile .bashrc .gitconfig .gitmodules .idea .profile .ripgreprc .vscode .zprofile .zshrc; do
    c="$target/$rel"
    if [ -e "$c" ] || [ -L "$c" ]; then
      LSG_ARGS+=(--ro-bind "$c" "$c")
    else
      LSG_ARGS+=(--ro-bind /dev/null "$c")
      LSG_PLACEHOLDERS="$LSG_PLACEHOLDERS$c$nl"
    fi
  done
  if [ -e "$target/.claude" ] || [ -L "$target/.claude" ]; then
    LSG_ARGS+=(--ro-bind "$target/.claude" "$target/.claude")
  else
    LSG_ARGS+=(--ro-bind /dev/null "$target/.claude")
    LSG_PLACEHOLDERS="$LSG_PLACEHOLDERS$target/.claude$nl"
  fi

  # The run copy's `.git`, read-only and last among the target's binds: it
  # closes the `omit` trio (`autonomous-watcher.sh` → RUN_PROFILE_COPY_GIT_PATHS),
  # which no placeholder may pin (F9), and comes after the loop so bwrap can
  # still create the loop's placeholder mount points under it.
  if [ -e "$target/.git" ] || [ -L "$target/.git" ]; then
    LSG_ARGS+=(--ro-bind "$target/.git" "$target/.git")
  fi

  if ! list="$(jq -r '(.sandbox.credentials.files // [])
      | if type == "array" then .[] | objects | .path | strings | select(contains("\n") | not)
        else error("files is not a list") end' "$base" 2>/dev/null)"; then
    LSG_REFUSAL="cannot read .sandbox.credentials.files as a list from '$base'"
    return 1
  fi
  homes=""
  case "${HOME-}" in /?*) homes="${HOME%/}" ;; esac
  home="$(getent passwd "$(id -u)" 2>/dev/null | cut -d: -f6)" || home=""
  case "$home" in
    /?*) [ "${home%/}" = "$homes" ] || homes="${homes:+$homes$nl}${home%/}" ;;
  esac
  while IFS= read -r p; do
    case "$p" in
      '~/'?*)
        rel="${p#\~/}"
        while IFS= read -r h; do
          [ -n "$h" ] || continue
          lsg_mask_credential "$h/$rel"
        done <<EOF
$homes
EOF
        ;;
      /*) lsg_mask_credential "$p" ;;
    esac
  done <<EOF
$list
EOF

  if ! list="$(jq -r '(.sandbox.credentials.envVars // [])
      | if type == "array" then .[] | objects | .name | strings | select(length > 0 and (contains("\n") | not))
        else error("envVars is not a list") end' "$base" 2>/dev/null)"; then
    LSG_REFUSAL="cannot read .sandbox.credentials.envVars as a list from '$base'"
    return 1
  fi
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    LSG_ARGS+=(--unsetenv "$name")
  done <<EOF
$list
EOF
  LSG_ARGS+=(--unsetenv RUN_TEST_SUITE_WORKER)

  if [ "$scripts_dir" = . ]; then
    script="$target/run-test-suite.sh"
  else
    script="$target/$scripts_dir/run-test-suite.sh"
  fi
  LSG_ARGS+=(--setenv TMPDIR /tmp --chdir "$target" -- bash "$script" --no-detach "$label")
  LSG_PLACEHOLDERS="${LSG_PLACEHOLDERS%"$nl"}"
  return 0
}

# Mask one credential path, and its canonical form when that differs: a
# directory by a tmpfs, a regular file by `/dev/null`; an absent path adds
# nothing.
lsg_mask_credential() {
  local p="$1" c
  lsg_mask_one "$p"
  c="$(hr_canonical_path_nogit "$p")" || return 0
  [ "$c" = "$p" ] || lsg_mask_one "$c"
}

lsg_mask_one() {
  if [ -d "$1" ]; then
    LSG_ARGS+=(--tmpfs "$1")
  elif [ -f "$1" ]; then
    LSG_ARGS+=(--ro-bind /dev/null "$1")
  fi
}

# 10.
if [ "$mode" = launch ] && [ -f "$running_file" ]; then
  if age="$(hr_heartbeat_age "$running_file")"; then
    if [ "$age" -le "$HR_TEST_RUN_STALE_SECONDS" ]; then
      echo pending
      exit 3
    fi
  elif [ -f "$running_file" ]; then
    refuse "cannot read the heartbeat of '$running_file'"
  fi
fi

# 11.
bwrap="$(command -v bwrap 2>/dev/null)" || bwrap=""
case "$bwrap" in
  /*) [ -f "$bwrap" ] && [ -x "$bwrap" ] || bwrap="" ;;
  *) bwrap="" ;;
esac
[ -n "$bwrap" ] ||
  refuse "bwrap is not on PATH, so the gate run cannot be sandboxed on this bubblewrap host, and Run gates do not run here unsandboxed (docs/cli.md §6)"

if [ "$mode" = supervise ]; then
  lsg_bwrap_args_var "$target" "$label" "$scripts_dir" "$profile" "$base" || refuse "$LSG_REFUSAL"
  "$bwrap" "${LSG_ARGS[@]}" >/dev/null
  status=$?
  placeholders=()
  while IFS= read -r p; do
    [ -n "$p" ] && placeholders+=("$p")
  done <<EOF
$LSG_PLACEHOLDERS
EOF
  hr_placeholder_sweep_paths_var ${placeholders[@]+"${placeholders[@]}"}
  exit "$status"
fi

# 12.
if ! preflight_err="$("$bwrap" --ro-bind / / --dev /dev --unshare-all --proc /proc true 2>&1 >/dev/null)"; then
  preflight_err="${preflight_err%%$'\n'*}"
  refuse "bwrap cannot start a sandbox here: ${preflight_err:-no message}; on a host whose kernel.apparmor_restrict_unprivileged_userns is 1, unprivileged user namespaces need an AppArmor profile for bwrap (docs/cli.md §6)"
fi

# The vector is built here as well, so a refusal it carries reaches the caller
# rather than the supervisor's discarded stderr.
lsg_bwrap_args_var "$target" "$label" "$scripts_dir" "$profile" "$base" || refuse "$LSG_REFUSAL"

t0="$(date +%s)"
errfile="$(mktemp "${TMPDIR:-/tmp}/launch-sandboxed-gates.XXXXXX")" ||
  refuse "cannot create a temporary file under '${TMPDIR:-/tmp}'"
trap 'rm -f "$errfile"' EXIT

# `setsid` without `-f`: a background job of a non-interactive shell is no
# process-group leader, so it execs in place and `$!` stays the supervisor.
setsid_bin="$(command -v setsid 2>/dev/null)" || setsid_bin=""
case "$setsid_bin" in
  /*) nohup "$setsid_bin" bash "$script_dir/launch-sandboxed-gates.sh" --supervise "$target" "$label" </dev/null >/dev/null 2>"$errfile" & ;;
  *) nohup bash "$script_dir/launch-sandboxed-gates.sh" --supervise "$target" "$label" </dev/null >/dev/null 2>"$errfile" & ;;
esac
supervisor_pid=$!
disown

# A lane file stamped at or after t0 is this call's run.
started() {
  [ -f "$verdict_file" ] && [ "$(hr_lane_mtime "$verdict_file")" -ge "$t0" ] && return 0
  [ -f "$running_file" ] && [ "$(hr_lane_mtime "$running_file")" -ge "$t0" ] && return 0
  return 1
}

deadline=$((SECONDS + HR_TEST_RUN_STALE_SECONDS))
while :; do
  if started; then
    echo pending
    exit 3
  fi
  # `kill -0` goes only to this shell's own child.
  if ! kill -0 "$supervisor_pid" 2>/dev/null; then
    if started; then
      echo pending
      exit 3
    fi
    first=""
    IFS= read -r first <"$errfile" 2>/dev/null || :
    first="${first#launch-sandboxed-gates.sh: }"
    refuse "the sandboxed gate run of $label did not start: ${first:-no message}"
  fi
  [ "$SECONDS" -lt "$deadline" ] || break
  sleep 1
done
refuse "the sandboxed gate run of $label did not start within ${HR_TEST_RUN_STALE_SECONDS}s"
