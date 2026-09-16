#!/usr/bin/env bash
# refresh-branch.sh — merge the configured default branch INTO the branch this
# checkout has out, so a run whose base went stale can catch up. One direction
# only: into the working branch, never into the integration line.
#
# WHY IT EXISTS. The plugin's protected-branch guard denies a `git merge` or
# `git rebase` whose target argument names a protected branch, and the generated
# permission profile puts `Bash(git merge:*)` on `ask` — which an unattended run
# cannot answer. Both fire on the SAFE direction too, because the safe direction
# still spells the protected branch as its argument. So a run cut from a stale
# base had no permitted way to refresh it, and the only route left was evasion.
# This wrapper is the sanctioned route: `bash <scripts_dir>/refresh-branch.sh` is
# allow-listed in three literal forms by the generated permission profile (its
# row in `cli/src/generators/outerLoopScripts.ts` carries `agentInvocable: true`)
# and auto-allowed by the script-allowlist guard, and it carries no `merge` token
# on the caller's command line for the protected-branch guard to judge.
#
# IT IS NOT A WAY AROUND THAT GUARD — IT RE-IMPLEMENTS ITS INTENT. The guard's
# dangerous case is a merge or rebase issued while HEAD is ON a protected branch,
# which would put unreviewed work on the integration line. This script makes that
# decision itself, from `<repo_root>/harness.config.json` at run time through
# `lib/harness-run-lib.sh` rather than from a branch name written into this file,
# and refuses (exit 2) before anything is fetched or merged. The library's
# unresolvable answer is a refusal here too, never a permit.
#
# WHAT IT NEVER DOES. It never pushes. It never checks out, resets, updates or
# deletes the base branch — the only ref it writes is the remote-tracking
# `refs/remotes/origin/<base>` a fetch updates. It never rebases and never
# rewrites history. It leaves a conflicted merge aborted rather than half-done,
# so a failed run's working copy is exactly what it was — with one exception it
# reports as its own status rather than hiding: exit 5 below, where the abort
# itself failed and the tree is left mid-merge.
#
# `--local` MERGES THE LOCAL `<base>` REF AND MAKES NO NETWORK CALL. Default mode
# fetches and merges `origin/<base>`. `--local` is for the state where the local
# base is AHEAD of the remote one — commits landed in the main checkout and were
# not pushed — which is exactly the state a worktree cut from `origin/<base>` is
# stale against while `origin/<base>` looks current.
#
# Usage: refresh-branch.sh [--local]
#   --local   merge the local `<base>` branch instead of `origin/<base>`, and
#             skip the fetch
#   No repository argument: the checkout is THIS FILE's own location, never $PWD,
#   because the caller runs it from wherever it happens to be.
#
# Exit map a caller can switch on:
#
#   0  the current branch now contains the base (the merge landed)
#   1  usage error / not a git repository / detached HEAD / the configuration
#      could not be read / the working tree has uncommitted tracked changes
#   2  protected-branch refusal — HEAD is ON a protected branch, so this would be
#      a merge INTO the integration line; nothing was attempted
#   3  nothing to do — the current branch already contains the base
#   4  the merge conflicted and was aborted; the working copy is exactly as it was
#   5  the merge conflicted and `git merge --abort` ALSO failed, so the working
#      copy is left mid-merge and is NOT what it was — the one row of this map on
#      which this script's "leaves a conflicted merge aborted rather than
#      half-done" guarantee does not hold, and the one that needs a human before
#      anything else runs in this checkout
#
# Two conditions outside that list land on 1 as well, for the same reason every
# other row of it does — the script cannot proceed and changed nothing: the base
# ref named by the mode is not present, and a merge that failed for a reason
# other than a conflict.
#
# REPRO — reproduce every row by hand, against a throwaway fixture:
#
#   b=$(mktemp -d)/origin.git; git init -q --bare "$b"
#   d=$(mktemp -d); git -C "$d" init -q -b trunk; git -C "$d" remote add origin "$b"
#   printf '%s' '{"version":1,"defaultBranch":"trunk","protectedBranches":["trunk","release/*"],"stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$d/harness.config.json"
#   printf 'a\n' > "$d/f.txt"; git -C "$d" add -A; git -C "$d" commit -qm seed
#   git -C "$d" push -q -u origin trunk
#   git -C "$d" checkout -q -b feat_x
#   mkdir -p "$d/scripts/lib"   # copy this script + lib/ there
#   # move trunk on and publish it, so feat_x is behind:
#   git -C "$d" checkout -q trunk; printf 'b\n' >> "$d/f.txt"
#   git -C "$d" commit -qam base; git -C "$d" push -q; git -C "$d" checkout -q feat_x
#
#   behind the base   bash "$d/scripts/refresh-branch.sh"   -> exit 0, and
#                     `git -C "$d" log --oneline` shows the base commit
#   already current   the same call again                   -> exit 3
#   protected HEAD    git -C "$d" checkout -q trunk; same call -> exit 2, nothing
#                     merged; `git -C "$d" checkout -q feat_x` -> exit 0 again
#   detached HEAD     git -C "$d" checkout -q --detach; same call -> exit 1
#   dirty tree        printf 'x\n' >> "$d/f.txt"; same call -> exit 1, and
#                     `git -C "$d" status --porcelain` is byte-identical after
#   conflict          edit the same line on trunk and on feat_x, commit both
#                     -> exit 4, and `git -C "$d" status` shows no MERGING state
#   failed abort (5)  no fixture row: the state that makes `git merge --abort`
#                     fail has to arise between this script's own merge and its
#                     abort, and nothing outside the script runs in that window
#   unresolvable      printf 'x' > "$d/harness.config.json"; same call -> exit 1,
#                     nothing merged; restore -> exit 0
#   --local           commit on trunk WITHOUT pushing, then from feat_x:
#                     bash "$d/scripts/refresh-branch.sh" --local -> exit 0
#                     the same call without --local                -> exit 3

set -uo pipefail

# The library is reached by a path computed from this script's own location, so a
# copy that was moved with its `lib/` still finds it, and no session root or
# runtime-substituted token is assumed.
hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "refresh-branch.sh: cannot read '$hr_lib' — refusing to merge" >&2
  exit 1
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

use_local=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --local)
      use_local=1
      shift
      ;;
    *)
      echo "refresh-branch.sh: unknown argument '$1'" >&2
      echo "  usage: refresh-branch.sh [--local]" >&2
      exit 1
      ;;
  esac
done

# The checkout being refreshed is where THIS FILE lives — never $PWD, which
# belongs to whoever invoked it.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
top="$(hr_repo_root "$script_dir")" || top=""
if [ -z "$top" ]; then
  echo "refresh-branch.sh: '$script_dir' is not inside a git repository — refusing to merge" >&2
  exit 1
fi

# Warm the library's cache once, unsubstituted, and fail closed here rather than
# letting each reader below fail separately: a configuration that cannot be read
# is a protected set that cannot be judged.
if ! hr_config_load "$top"; then
  echo "refresh-branch.sh: cannot resolve '$top/harness.config.json' — refusing to merge" >&2
  echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)" >&2
  exit 1
fi

base="$(hr_default_branch "$top")" || base=""
if [ -z "$base" ]; then
  echo "refresh-branch.sh: no defaultBranch in '$top/harness.config.json' — refusing to merge" >&2
  exit 1
fi

branch="$(hr_current_branch "$top")"
if [ -z "$branch" ]; then
  echo "refresh-branch.sh: detached HEAD — refusing to merge" >&2
  exit 1
fi

# The direction check, and the reason this wrapper is safe to allow-list. It
# refuses on the branch the guard's dangerous case is about, and it takes the
# library's unresolvable answer as a refusal rather than as a permit.
hr_branch_is_protected "$top" "$branch"
protected=$?
case "$protected" in
  0)
    patterns="$(hr_protected_patterns "$top")" || patterns=""
    protected_set=""
    while IFS= read -r pattern; do
      [ -n "$pattern" ] || continue
      if [ -z "$protected_set" ]; then
        protected_set="$pattern"
      else
        protected_set="$protected_set $pattern"
      fi
    done <<EOF
$patterns
EOF
    echo "refresh-branch.sh: HEAD is on protected branch '$branch' — refusing to merge into it" >&2
    echo "  protected set (from harness.config.json): $protected_set" >&2
    echo "  this wrapper only merges '$base' INTO a working branch; check one out and re-run" >&2
    exit 2
    ;;
  2)
    echo "refresh-branch.sh: cannot resolve '$top/harness.config.json' — refusing to merge" >&2
    exit 1
    ;;
esac

# A merge writes the working tree, so an uncommitted tracked change is refused
# before anything is fetched: the caller's own edit must not be carried into a
# merge commit, and an aborted merge must be able to restore what was there.
if ! git -C "$top" diff --quiet || ! git -C "$top" diff --cached --quiet; then
  echo "refresh-branch.sh: uncommitted tracked changes in '$top' — refusing to merge" >&2
  echo "  commit them (bash \"$script_dir/commit-on-branch.sh\" …) and re-run" >&2
  exit 1
fi

if [ "$use_local" -eq 1 ]; then
  base_ref="$base"
  ref_path="refs/heads/$base"
else
  base_ref="origin/$base"
  ref_path="refs/remotes/origin/$base"
  # Tolerate a failed fetch the way create-worktree.sh does — offline with the
  # ref already present is still a refresh this can do — and judge the ref the
  # next block names rather than the fetch. git's own stderr still reaches the
  # caller's log whichever outcome follows.
  git -C "$top" fetch origin "$base" || true
fi

if ! git -C "$top" show-ref --verify --quiet "$ref_path"; then
  echo "refresh-branch.sh: no '$base_ref' in '$top' — nothing to merge from" >&2
  if [ "$use_local" -eq 1 ]; then
    echo "  --local merges the local '$base' branch; drop the flag to merge origin/$base" >&2
  else
    echo "  push the default branch (git push -u origin $base), or pass --local to merge the local one" >&2
  fi
  exit 1
fi

# Already contained => a distinct, dedicated status, so a caller can tell "the
# base is already here" apart from a refusal.
if git -C "$top" merge-base --is-ancestor "$base_ref" HEAD; then
  echo "refresh-branch.sh: '$branch' already contains $base_ref — nothing to do"
  exit 3
fi

if git -C "$top" merge --no-edit "$base_ref"; then
  echo "refresh-branch.sh: merged $base_ref into $branch"
  exit 0
fi

# A failed merge is one of two things, and they are distinguished by whether a
# merge is in progress: a conflict leaves MERGE_HEAD behind, anything else (a
# refused fast-forward, a hook, an unmergeable ref) never started one.
if git -C "$top" rev-parse --verify --quiet MERGE_HEAD >/dev/null; then
  if git -C "$top" merge --abort; then
    echo "refresh-branch.sh: $base_ref conflicts with $branch — merge aborted, working copy unchanged" >&2
    exit 4
  fi
  echo "refresh-branch.sh: $base_ref conflicts with $branch and 'git merge --abort' failed — the working copy is LEFT MID-MERGE and is NOT what it was" >&2
  echo "  resolve or abandon it yourself (git status, git merge --abort), then re-run" >&2
  exit 5
fi

echo "refresh-branch.sh: 'git merge $base_ref' failed (see output above) — nothing was merged" >&2
exit 1
