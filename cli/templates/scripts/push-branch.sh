#!/usr/bin/env bash
# push-branch.sh — push the current non-protected branch to its upstream, and
# never abort the run that called it.
#
# WHAT IT IS FOR. This is the single mechanism every unattended commit point
# calls right after a commit lands, so the remote branch reflects the local
# commit chain no matter where the run stops — the watcher after its task-prompt
# commit, the `committer` agent's opt-in push, and the task, user-review-fix and
# planning orchestrators. It is invoked as a SEPARATE statement from the commit
# (never `if commit-on-branch.sh …; then push-branch.sh; fi`: that compound is
# not covered by the guards, and an unattended run refuses it), which works because a
# push with nothing new to send is a harmless no-op — so callers may run it
# unconditionally, including after a commit wrapper that made no commit.
#
# WHY A WRAPPER EXISTS AT ALL. Same reason as its sibling: an invocation of a
# script path under the configured scripts directory is allow-listed literally
# by the generated permission profile and auto-allowed by the script-allowlist
# guard (when its basename is not on that guard's deny list, in a command
# carrying none of `$(…)`, a backtick, `|`, `<`, a braced form other than a bare
# `${IDENT}`, or a `>` that is neither a descriptor duplication (`2>&1`, `>&2`,
# `2>&-`) nor a redirection to the literal `/dev/null`), where a `git push`
# command line assembled with a shell expansion is matched statically by
# neither and is refused in an unattended run.
#
# EVERY FAILURE PATH IS NON-FATAL (exit 0). A non-git directory, a detached
# HEAD, a protected branch, a configuration that cannot be resolved, a target
# it does not trust, a per-working-copy configuration it does not trust, a
# hooks directory it will not pin, a branch name starting with `-`, or a failed
# push (a transient network, say) is made VISIBLE with a one-line message but
# must NEVER abort the calling
# run — a stale remote is recoverable and a halted run is not. That is why this script uses `set -uo pipefail` deliberately
# WITHOUT `set -e`, and why even the fail-closed arm below exits 0: it refuses
# to push, which is the closed outcome here, and says so. A push the remote
# refused for any reason but a `[rejected]` ref is attempted up to
# PUSH_ATTEMPTS times in all — waiting PUSH_RETRY_DELAY_SECS before the second
# attempt and three times that before the third — and is still never fatal once
# given up. PUSH_RETRY_DELAY_SECS is read from the environment as a test and
# tuning seam: default 5, and anything but a non-negative integer falls back to
# 5 with one line.
#
# A BRANCH ITS REMOTE DELETED STAYS DELETED. A branch this checkout tracks on
# its remote is never pushed when that remote no longer lists it. It tracks one
# when `branch.<branch>.merge` is set, or when `refs/remotes/origin/<branch>`
# resolves; a branch with neither is a first push and is not checked. The remote
# asked is `branch.<branch>.remote` (else `origin`), for `branch.<branch>.merge`
# (else `refs/heads/<branch>`), once with `ls-remote --exit-code` before any
# push attempt. Exit 2 (not listed) skips the push with one line naming the hand
# push that publishes it again; any other failure is not evidence of a deletion,
# so the push goes ahead and reports its own result. Reason: Gate 12 round 9,
# finding 1 — a run stopped because its branch was deleted had that branch
# re-created by the job's `always()` push step. Accepted costs: a deletion that
# lands between the `ls-remote` and the push is still pushed back; and a local
# branch reusing the name of one deleted on origin is not pushed while its stale
# `refs/remotes/origin/<branch>` survives — the skip line names the hand push.
#
# DEFENCE IN DEPTH, NOT THE SOLE GUARD. The caller-agnostic backstop is the
# committed pre-push hook `init` writes into the configured `githooksDir`, which
# git runs on every push GIT PERFORMS, however it was started. That backstop is
# caller-agnostic WITHIN GIT: a tool that implements push against the git backend
# itself, as `jj git push` does, performs no git push and runs no git hook. The
# plugin's protected-branch guard refuses an agent-submitted push only when it
# can PROVE the target is protected, and is silent on the rest — and it is the
# layer that sees a `jj git push` and refuses one that NAMES a protected target,
# so the two cover different callers. Neither covers an argument-less
# `jj git push`, which runs no git hook and gives that guard nothing to prove;
# only a forge-side ruleset does. This
# script refuses too, so it is safe when called from outside an unattended
# profile — and it takes its protected set from the MAIN checkout's
# `harness.config.json` at run time (THE TARGET'S `harness.config.json` IS NOT
# TRUSTED EITHER below) through `lib/harness-run-lib.sh`, which is where that
# set is kept in step across all of them. There is no second list to keep in sync with: a branch name written
# into this file would enforce the wrong set the moment `protectedBranches`
# changed, and nothing at all in a repository whose integration branch is named
# something else.
#
# THE TARGET IS NOT TRUSTED. The permission profile runs the main checkout's
# copy of this script OUTSIDE the sandbox under a rule ending in `:*`, which
# takes any argument, so a sandboxed command could hand it a repository whose
# own configuration runs a program. Before its first git call this script
# refuses (exit 0, a "refusing to push:" line) unless the target is the main
# checkout this file sits in — derived from this file's own location, never
# from the argument — or a worktree that main repository lists (conditions:
# `lib/harness-run-lib.sh` → `hr_wrapper_target_check_var`). That covers a
# rewritten `.git` pointer and a rewritten `commondir` as well as a foreign
# repository. The main checkout itself is placed by
# `lib/harness-run-lib.sh` → `hr_wrapper_main_of`, which refuses a `.git`
# directory holding a `commondir`: the sandbox can create that file, and
# following it would let a sandboxed command name the main checkout — and with
# it the configuration and the hooks pin below.
#
# THE TARGET'S `harness.config.json` IS NOT TRUSTED EITHER. A worktree's own
# copy is a tracked file in a sandbox-writable tree, so a sandboxed command
# could commit one whose `protectedBranches` drops the branch it is on. So the
# protected set — `protectedBranches` and `defaultBranch` — is read from the
# MAIN checkout's `harness.config.json`, as the pin's `githooksDir` is: the checkout the target check above derives from this
# file's own location, and a file the permission profile write-protects. The
# target's own copy is never read for it, whichever checkout is the target, and
# a main checkout whose configuration cannot be read is a refusal (exit 0, a
# "refusing to push" line), never a fall-back to the target's. The committed
# pre-push hook the pin runs is the backstop behind this check, not a reason to
# skip it.
#
# THE PER-WORKING-COPY CONFIG IS NOT TRUSTED. The main checkout's copy of this
# script runs OUTSIDE the sandbox, so any git configuration a sandboxed command
# could write would run with the wrapper's reach. In a linked worktree that is
# `.git/worktrees/<name>/config.worktree`: the sandbox can write it, and its path
# differs per worktree, so no profile entry can name it. `setup-worktree.sh`
# writes exactly one key there, `core.hooksPath`, so before its first git call
# this script refuses unless that file is absent, empty, or holds that one key at
# the value `setup-worktree.sh` writes (`hr_worktree_config_check_var`); a
# refusal names each offending key and never its value. Every git call after
# the check then pins `core.hooksPath` to the MAIN repository's configured hooks
# directory (`hr_pinned_hooks_path`), not the worktree's: the worktree's hooks
# directory is sandbox-writable, and on Linux the globbed `denyWrite` that would
# cover it is skipped. The pin accepts only `<main>/<githooksDir>` or
# `<main>/.git/hooks` — the two directories the permission profile
# write-protects on both sides — compared against the main checkout's own
# `harness.config.json`, which the profile also protects; any other directory,
# such as a foreign `core.hooksPath` `init` left in place, is refused. The pin is
# exported as `GIT_CONFIG_COUNT` for the library's git calls, which needs git
# 2.31 or newer — an older git ignores it — and every git call this file spells
# also carries an explicit `-c core.hooksPath`, which pins on any git. The one
# configured value read from the worktree is the `githooksDir` the check
# compares that `core.hooksPath` against, and it is inert: a rewritten copy can
# only make the check accept a different `core.hooksPath`, which the pin then
# overrides on every call, while any other key is refused whatever it says.
# Residual: the watcher's **own** git calls in a worktree a sandboxed session has
# written to are outside this branch's two wrappers. Examples are its staging
# and commit of a dropped user review, and its `status`, `fetch` and `merge`
# there. They still read that worktree's `config.worktree` and its hooks
# directory.
#
# THE INHERITED GIT ENVIRONMENT IS DROPPED. Before anything else this script
# unsets `GIT_DIR`, `GIT_COMMON_DIR` and `GIT_WORK_TREE`, which would point
# every git call somewhere other than the checked target; `GIT_CONFIG_PARAMETERS`
# and `GIT_CONFIG_COUNT`, which would add configuration the checks never saw (the
# pin exports its own `GIT_CONFIG_COUNT` afterwards); and `GIT_EXEC_PATH`, which
# would choose the git programs run. It keeps `GIT_SSH_COMMAND`: the environment
# reaching an excluded command is the agent runner's, not one a sandboxed
# command can set — an assignment prefix or a compound is a different command
# string, which stays sandboxed — and an operator may rely on it for the SSH
# push this script exists to make outside the sandbox.
#
# WHAT IT NEVER DOES. It performs only a fast-forward push of already-committed
# work: no `--force`, no `--force-with-lease`, no history-rewriting flag, no
# commit of its own, and no non-zero exit, and never pushes back a branch it
# tracks after its remote deleted it. It never retries a push git reports
# as `! [rejected]` (non-fast-forward, fetch first), and never fetches or
# rebases: a push that lost a race fails loudly, which is the run-control rule
# of record (docs/github-run-control.md -> "A push that loses a race fails
# loudly, and is never fetched, rebased or retried").
#
# Usage: push-branch.sh [<repo-dir>]
#        bash <main checkout>/<scripts_dir>/push-branch.sh <worktree>
#   <repo-dir>  worktree/repository to operate in (default: $PWD)
#   The second form, the main checkout's copy aimed at a worktree, is the one
#   the permission profile runs unsandboxed.
#
# REPRO — reproduce any decision by hand, against a throwaway fixture:
#
#   b=$(mktemp -d)/origin.git; git init -q --bare "$b"
#   d=$(mktemp -d); git -C "$d" init -q -b feat_x; git -C "$d" remote add origin "$b"
#   printf '%s' '{"version":1,"defaultBranch":"trunk","protectedBranches":["trunk","release/*"],"stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$d/harness.config.json"
#   mkdir -p "$d/scripts"; cp -R <this script> <its lib/> "$d/scripts/"
#   git -C "$d" add -A && git -C "$d" commit -qm "seed"
#   # `push-branch.sh` below is `bash "$d/scripts/push-branch.sh"`: a copy
#   # outside the checkout it is aimed at refuses (THE TARGET IS NOT TRUSTED).
#
#   no upstream yet   push-branch.sh "$d"   -> exit 0; `git -C "$b" branch` lists
#                     feat_x and the branch now has an upstream
#   nothing new       push-branch.sh "$d"   -> exit 0 ("everything up to date")
#   deleted on origin git -C "$b" update-ref -d refs/heads/feat_x; push-branch.sh "$d"
#                     -> exit 0, a "no longer has feat_x" line, and
#                     `git -C "$b" branch` lists no feat_x
#   protected branch  git -C "$d" checkout -q -b trunk; push-branch.sh "$d"
#                     -> exit 0, refusal message, "$b" unchanged
#   unresolvable      printf 'x' > "$d/harness.config.json"; push-branch.sh "$d"
#                     -> exit 0, refusal message, nothing pushed
#   push fails        git -C "$d" remote set-url origin /nonexistent.git
#                     -> exit 0 with a visible failure line
#   refused once      printf '%s\n' '#!/bin/sh' 'c="$GIT_DIR/refusals"' \
#                       '[ -e "$c" ] && exit 0' ': > "$c"; exit 1' > "$b/hooks/pre-receive"
#                     chmod +x "$b/hooks/pre-receive"
#                     git -C "$d" commit -qm x --allow-empty
#                     PUSH_RETRY_DELAY_SECS=0 push-branch.sh "$d"
#                     -> exit 0, one "retrying" line, and `git -C "$b" rev-parse
#                     feat_x` equals `git -C "$d" rev-parse HEAD`
#   remote moved      c=$(mktemp -d); git clone -q -b feat_x "$b" "$c"
#                     git -C "$c" commit -qm other --allow-empty; git -C "$c" push -q
#                     git -C "$d" commit -qm mine --allow-empty; push-branch.sh "$d"
#                     -> exit 0, a "(not retried)" line, one push attempt
#
#   The per-working-copy check and the pin, from a linked worktree (`githooksDir`
#   takes its default, `githooks`):
#   mkdir -p "$d/githooks"
#   printf '%s\n' '#!/bin/sh' "echo main >> $d.marker" > "$d/githooks/pre-push"
#   chmod +x "$d/githooks/pre-push"; git -C "$d" config core.hooksPath githooks
#   git -C "$d" add -A && git -C "$d" commit -qm hooks
#   w=$(mktemp -d)/wt; git -C "$d" worktree add -q -b feat_w "$w"
#   git -C "$w" config extensions.worktreeConfig true
#   git -C "$w" config --worktree core.hooksPath "$(cd -P "$w" && pwd -P)/githooks"
#   printf '%s\n' '#!/bin/sh' "echo wt >> $d.marker" > "$w/githooks/pre-push"
#
#   clean worktree    bash "$d/scripts/push-branch.sh" "$w"
#                     -> exit 0; `git -C "$b" rev-parse feat_w` equals
#                     `git -C "$w" rev-parse HEAD`
#   the pin           cat "$d.marker"   -> `main` only: the worktree's own
#                     pre-push hook never ran
#   a foreign key     git -C "$w" config --worktree user.name x
#                     bash "$d/scripts/push-branch.sh" "$w"
#                     -> exit 0, a "refusing to push:" line naming user.name and
#                     not its value, "$b" unchanged
#   wrong hooks value git -C "$w" config --worktree --unset user.name
#                     git -C "$w" config --worktree core.hooksPath /tmp
#                     bash "$d/scripts/push-branch.sh" "$w"
#                     -> exit 0, a "refusing to push:" line, "$b" unchanged
#   a foreign pin     git -C "$d" config core.hooksPath .husky; re-run on a
#                     clean worktree
#                     -> exit 0, a "refusing to push:" line naming "$d/.husky",
#                     "$b" unchanged
#
#   The target check, on a clean worktree as above; each row starts from it:
#   s=$(mktemp -d); git -C "$s" init -q -b feat_x; git -C "$s" remote add origin "$b"
#   git -C "$s" commit -qm s --allow-empty
#   git -C "$s" config core.sshCommand "touch $s.marker; ssh"
#
#   a scratch repo    bash "$d/scripts/push-branch.sh" "$s"
#                     -> exit 0, a "refusing to push:" line, no "$s.marker",
#                     "$b" unchanged
#   rewritten pointer printf 'gitdir: %s\n' "$s/.git" > "$w/.git"
#                     bash "$d/scripts/push-branch.sh" "$w"
#                     -> exit 0, a "refusing to push:" line, "$b" unchanged
#   rewritten         printf '%s\n' "$s/.git" > "$d/.git/worktrees/wt/commondir"
#   commondir         bash "$d/scripts/push-branch.sh" "$w"
#                     -> exit 0, a "refusing to push:" line, "$b" unchanged
#   planted main      printf '%s\n' "$s/.git" > "$d/.git/commondir"
#   commondir         bash "$d/scripts/push-branch.sh" "$w"
#                     -> exit 0, "refusing to push: cannot place this script in
#                     a main checkout", "$b" unchanged, no "$s.marker"
#   clean worktree    the clean worktree row above: it pushes
#
#   The protected set is the main checkout's, on a clean worktree as above:
#   git -C "$w" checkout -q -b release/x
#   printf '%s' '{"version":1,"defaultBranch":"trunk","protectedBranches":[],"stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$w/harness.config.json"
#   git -C "$w" commit -qam "drop the protected set"
#
#   a dropped pattern bash "$d/scripts/push-branch.sh" "$w"
#                     -> exit 0, "branch 'release/x' is protected", "$b"
#                     unchanged: `release/*` is in "$d"'s list, whatever "$w"'s
#                     says

set -uo pipefail

# THE INHERITED GIT ENVIRONMENT IS DROPPED (header). GIT_SSH_COMMAND is kept.
unset GIT_DIR GIT_COMMON_DIR GIT_WORK_TREE GIT_CONFIG_PARAMETERS GIT_CONFIG_COUNT GIT_EXEC_PATH

# Attempts in all, and the wait before the second; the third waits three times
# that (EVERY FAILURE PATH IS NON-FATAL above).
PUSH_ATTEMPTS=3
PUSH_RETRY_DELAY_SECS="${PUSH_RETRY_DELAY_SECS:-5}"
case "$PUSH_RETRY_DELAY_SECS" in
  '' | *[!0-9]*)
    echo "push-branch.sh: PUSH_RETRY_DELAY_SECS='$PUSH_RETRY_DELAY_SECS' is not a non-negative integer — using 5"
    PUSH_RETRY_DELAY_SECS=5
    ;;
  *)
    # Base 10, so a leading zero is not read as octal.
    PUSH_RETRY_DELAY_SECS=$((10#$PUSH_RETRY_DELAY_SECS))
    ;;
esac

# The library is reached by a path computed from this script's own location — no
# session root, and no runtime-substituted token, is assumed. Not finding it is
# non-fatal like everything else here.
hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "push-branch.sh: cannot read '$hr_lib' — refusing to push"
  exit 0
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

repo_dir="${1:-$PWD}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# THE PER-WORKING-COPY CONFIG IS NOT TRUSTED (header): settled before the first
# git call, each function called directly so its variables survive.
top_nogit="$(hr_checkout_top_nogit "$repo_dir")" || top_nogit=""
if [ -z "$top_nogit" ]; then
  echo "push-branch.sh: '$repo_dir' is not a git repository — nothing to push"
  exit 0
fi
# THE TARGET IS NOT TRUSTED (header).
if ! main_top="$(hr_wrapper_main_of "$script_dir")"; then
  echo "push-branch.sh: refusing to push: cannot place this script in a main checkout (its .git is a symbolic link, or a directory holding a commondir)"
  exit 0
fi
if ! hr_wrapper_target_check_var "$main_top" "$top_nogit"; then
  echo "push-branch.sh: refusing to push: $HR_TARGET_REFUSAL"
  exit 0
fi
if ! hr_worktree_config_check_var "$top_nogit"; then
  echo "push-branch.sh: refusing to push: $HR_WT_CONFIG_REFUSAL"
  exit 0
fi
# The main checkout's hooks, whatever the target: never re-derived through a
# worktree record the sandbox can rewrite.
if ! hr_pinned_hooks_path "$main_top"; then
  if [ -n "$HR_PINNED_HOOKS_REFUSAL" ]; then
    echo "push-branch.sh: refusing to push: $HR_PINNED_HOOKS_REFUSAL"
  else
    echo "push-branch.sh: refusing to push: could not resolve the hooks directory to pin for '$top_nogit'"
  fi
  exit 0
fi
pinned="$HR_PINNED_HOOKS_PATH"
# Pins the library helpers' git calls below; every call spelled here also
# carries `-c`, which an older git than 2.31 still honours.
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0="$pinned"

# Resolve the repository top. Not a git repository => warn and skip (non-fatal).
top="$(hr_repo_root "$repo_dir")"
if [ -z "$top" ]; then
  echo "push-branch.sh: '$repo_dir' is not a git repository — nothing to push"
  exit 0
fi

# Current branch. Empty => detached HEAD => refuse (non-fatal skip).
branch="$(hr_current_branch "$top")"
if [ -z "$branch" ]; then
  echo "push-branch.sh: detached HEAD — refusing to push"
  exit 0
fi

# A branch name git would parse as an option (THE TARGET IS NOT TRUSTED): a
# worktree's HEAD is sandbox-writable, and no branch git creates starts with `-`.
case "$branch" in
  -*)
    echo "push-branch.sh: branch '$branch' starts with '-', which git would read as an option — refusing to push"
    exit 0
    ;;
esac

# The protected-branch decision, from the MAIN checkout's configuration (THE
# TARGET'S `harness.config.json` IS NOT TRUSTED EITHER, header), never the
# target's.
cfg_root="$main_top"
hr_branch_is_protected "$cfg_root" "$branch"
protected=$?
case "$protected" in
  0)
    echo "push-branch.sh: branch '$branch' is protected — refusing to push"
    exit 0
    ;;
  2)
    # Fail closed, and stay non-fatal: a configuration that cannot be read is a
    # branch that cannot be judged, so the push does not happen — but the run
    # that called this is not stopped over it.
    echo "push-branch.sh: cannot resolve '$cfg_root/harness.config.json' — refusing to push"
    exit 0
    ;;
esac

# A BRANCH ITS REMOTE DELETED STAYS DELETED (header). Once, before the retry
# loop; a branch tracking nothing is a first push and skips the check.
track_merge="$(git -C "$top" -c core.hooksPath="$pinned" config --get "branch.$branch.merge" 2>/dev/null)"
if [ -n "$track_merge" ] ||
  git -C "$top" -c core.hooksPath="$pinned" rev-parse --verify --quiet "refs/remotes/origin/$branch" >/dev/null 2>&1; then
  track_remote="$(git -C "$top" -c core.hooksPath="$pinned" config --get "branch.$branch.remote" 2>/dev/null)"
  [ -n "$track_remote" ] || track_remote=origin
  track_ref="${track_merge:-refs/heads/$branch}"
  git -C "$top" -c core.hooksPath="$pinned" ls-remote --exit-code --heads "$track_remote" "$track_ref" >/dev/null 2>&1
  ls_status=$?
  case "$ls_status" in
    0) ;;
    2)
      echo "push-branch.sh: $track_remote no longer has $branch, which this checkout tracks; not pushing it back (a branch deleted on its remote stays deleted). To publish it again on purpose: git push --set-upstream $track_remote $branch"
      exit 0
      ;;
    *)
      echo "push-branch.sh: could not ask $track_remote whether it still has $branch (ls-remote exited $ls_status); pushing as before"
      ;;
  esac
fi

# Push the branch; the deleted-on-its-remote check above has already run. Use
# the existing upstream when one is configured; otherwise set it on the fly, so
# a branch with no upstream is still pushed. Fast-forward only.
if git -C "$top" -c core.hooksPath="$pinned" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  push_cmd=(git -C "$top" -c core.hooksPath="$pinned" push)
else
  push_cmd=(git -C "$top" -c core.hooksPath="$pinned" push --set-upstream origin "$branch")
fi

# Every failure line keeps the `push failed for <branch>` prefix: logs and
# Gate 12 records quote it.
attempt=1
delay="$PUSH_RETRY_DELAY_SECS"
while :; do
  push_out="$("${push_cmd[@]}" 2>&1)"
  push_status=$?
  # git writes its ref-status lines to stderr; keep them there.
  [ -n "$push_out" ] && printf '%s\n' "$push_out" >&2

  if [ "$push_status" -eq 0 ]; then
    echo "push-branch.sh: pushed $branch to origin"
    break
  fi
  # A here-string, not a pipe: `grep -q` exiting early would fail a pipeline
  # under pipefail.
  if grep -q '^ ! \[rejected\]' <<<"$push_out"; then
    echo "push-branch.sh: push failed for $branch: origin has commits this branch does not (not retried)"
    break
  fi
  if [ "$attempt" -ge "$PUSH_ATTEMPTS" ]; then
    echo "push-branch.sh: push failed for $branch after $PUSH_ATTEMPTS attempts (see output above)"
    break
  fi
  echo "push-branch.sh: push failed for $branch (attempt $attempt of $PUSH_ATTEMPTS); retrying in ${delay}s"
  sleep "$delay"
  attempt=$((attempt + 1))
  delay=$((delay * 3))
done
exit 0
