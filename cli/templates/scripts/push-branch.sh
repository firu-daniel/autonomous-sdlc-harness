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
# not covered by the guards and stalls an unattended run), which works because a
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
# neither and draws a prompt an unattended run cannot answer.
#
# EVERY FAILURE PATH IS NON-FATAL (exit 0). A non-git directory, a detached
# HEAD, a protected branch, a configuration that cannot be resolved, or a failed
# push (a transient network, say) is made VISIBLE with a one-line message but
# must NEVER abort the calling run — a stale remote is recoverable and a halted
# run is not. That is why this script uses `set -uo pipefail` deliberately
# WITHOUT `set -e`, and why even the fail-closed arm below exits 0: it refuses
# to push, which is the closed outcome here, and says so.
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
# profile — and it takes its protected set from
# `<repo_root>/harness.config.json` at run time through
# `lib/harness-run-lib.sh`, which is where that set is kept in step across all
# of them. There is no second list to keep in sync with: a branch name written
# into this file would enforce the wrong set the moment `protectedBranches`
# changed, and nothing at all in a repository whose integration branch is named
# something else.
#
# WHAT IT NEVER DOES. It performs only a fast-forward push of already-committed
# work: no `--force`, no `--force-with-lease`, no history-rewriting flag, no
# commit of its own, and no non-zero exit.
#
# Usage: push-branch.sh [<repo-dir>]
#   <repo-dir>  worktree/repository to operate in (default: $PWD)
#
# REPRO — reproduce any decision by hand, against a throwaway fixture:
#
#   b=$(mktemp -d)/origin.git; git init -q --bare "$b"
#   d=$(mktemp -d); git -C "$d" init -q -b feat_x; git -C "$d" remote add origin "$b"
#   printf '%s' '{"version":1,"defaultBranch":"trunk","protectedBranches":["trunk","release/*"],"stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$d/harness.config.json"
#   git -C "$d" add -A && git -C "$d" commit -qm "seed"
#
#   no upstream yet   push-branch.sh "$d"   -> exit 0; `git -C "$b" branch` lists
#                     feat_x and the branch now has an upstream
#   nothing new       push-branch.sh "$d"   -> exit 0 ("everything up to date")
#   protected branch  git -C "$d" checkout -q -b trunk; push-branch.sh "$d"
#                     -> exit 0, refusal message, "$b" unchanged
#   unresolvable      printf 'x' > "$d/harness.config.json"; push-branch.sh "$d"
#                     -> exit 0, refusal message, nothing pushed
#   push fails        git -C "$d" remote set-url origin /nonexistent.git
#                     -> exit 0 with a visible failure line

set -uo pipefail

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

# The protected-branch decision, from this repository's configuration. Called
# unsubstituted so the library's per-process cache is warmed here.
hr_branch_is_protected "$top" "$branch"
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
    echo "push-branch.sh: cannot resolve '$top/harness.config.json' — refusing to push"
    exit 0
    ;;
esac

# Push the branch. Use the existing upstream when one is configured; otherwise
# set it on the fly, so a branch with no upstream is still pushed. Fast-forward
# only.
if git -C "$top" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  git -C "$top" push
else
  git -C "$top" push --set-upstream origin "$branch"
fi
push_status=$?

if [ "$push_status" -eq 0 ]; then
  echo "push-branch.sh: pushed $branch to origin"
else
  # Visible but non-blocking: a push problem must never abort the calling run.
  echo "push-branch.sh: push failed for $branch (see output above)"
fi
exit 0
