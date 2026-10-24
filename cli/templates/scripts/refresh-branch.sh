#!/usr/bin/env bash
# refresh-branch.sh — merge the configured default branch INTO the branch this
# checkout has out, so a run whose base went stale can catch up. One direction
# only: into the working branch, never into the integration line.
#
# WHY IT EXISTS. The plugin's protected-branch guard denies a `git merge` or
# `git rebase` whose target argument names a protected branch, and the generated
# permission profile puts `Bash(git merge:*)` on `ask` — which an unattended run's
# mode refuses. Both fire on the SAFE direction too, because the safe direction
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
# decision itself, from the MAIN checkout's `harness.config.json` at run time
# through `lib/harness-run-lib.sh` rather than from a branch name written into
# this file, and refuses (exit 2) before anything is fetched or merged. The
# library's unresolvable answer is a refusal here too, never a permit.
#
# WHAT IT NEVER DOES. It never pushes. It never checks out, resets, updates or
# deletes the base branch — the refs it writes are the remote-tracking
# `refs/remotes/origin/<base>` a fetch updates and `refs/heads/<branch>` itself,
# moved only from the tip the merge was built on. It never rebases and never
# rewrites history. A conflict is found before anything is written, so there is
# no half-done merge to abort and a refused or conflicted refresh leaves the
# working copy and the branch exactly as they were — with one exception it
# reports as its own status rather than hiding: exit 5 below.
#
# THE MERGE IS BUILT FROM PLUMBING. There is no `git merge`: the merge result is
# computed from objects alone by `git merge-tree --write-tree` (git 2.38 or
# newer — an older git is refused, exit 1, before anything is fetched or merged),
# written as a two-parent commit by `git commit-tree` with the message `git
# merge` would have used, and then applied in an order that catches a branch
# moved under this script before anything is written: a dry run of the two-tree
# `git read-tree -m -u` (`-n`, which writes nothing and still refuses an
# untracked file or an out-of-date path in the way); the move of
# `refs/heads/<branch>` guarded by its old value (`lib/harness-run-lib.sh` →
# `hr_copy_ref_swap_var`), a compare-and-swap whose failure means the branch
# moved; and only then the real `read-tree`, whose failure puts the branch back
# with the reverse swap. The swap runs no hook. The ref
# update writes `logs/refs/heads/<branch>` and, for a linked worktree, no entry
# in that worktree's `logs/HEAD`: `git reflog <branch>` shows a refresh, a bare
# `git reflog` there does not. A branch the base is ahead of
# is fast-forwarded to it, as `git merge` does by default; `merge.ff` and
# `branch.<branch>.mergeOptions` are not consulted. A conflict is `merge-tree`'s
# exit 1, before any write. The commit takes its identity from the main
# checkout's configuration (`user.*`) as the merge did, and is unsigned, because
# `commit-tree` never reads `commit.gpgSign` and is passed no `-S`; and an unset
# identity is a refusal (exit 1) with nothing written. No merge hook runs — not
# `pre-merge-commit`, `prepare-commit-msg`, `commit-msg` nor `post-merge`.
#
# `--local` MERGES THE LOCAL `<base>` REF AND MAKES NO NETWORK CALL. Default mode
# fetches and merges `origin/<base>`. `--local` is for the state where the local
# base is AHEAD of the remote one — commits landed in the main checkout and were
# not pushed — which is exactly the state a worktree cut from `origin/<base>` is
# stale against while `origin/<base>` looks current.
#
# THE TARGET IS NOT TRUSTED. The permission profile runs the main checkout's
# copy of this script OUTSIDE the sandbox under a rule ending in `:*`, which
# takes any argument. So before its first git call this script refuses (exit 1,
# a "refusing to refresh:" line) unless the target is the main checkout this
# file sits in — derived from this file's own location, never from the
# argument — or a worktree that main repository lists (conditions:
# `lib/harness-run-lib.sh` → `hr_wrapper_target_check_var`; the reasoning:
# `push-branch.sh` → the paragraph of the same name). The main checkout itself
# is placed by `lib/harness-run-lib.sh` → `hr_wrapper_main_of`, which refuses a
# `.git` directory holding a `commondir` the sandbox could have planted.
# Residual: the defence against a `.git` pointer FILE planted at
# `<main>/<scripts_dir>/.git` is the permission profile alone (`push-branch.sh`
# → the paragraph of the same name).
#
# GIT NEVER RE-READS THE TARGET'S RECORDS. The checks read a worktree's `.git`
# pointer, its record's `commondir` and `gitdir`, and its `config.worktree`
# once, and a sandboxed process still running when this script starts could
# rewrite one before git reads it again. So after its checks this script reads
# the branch once from the main checkout (`lib/harness-run-lib.sh` →
# `hr_wrapper_branch_var`); the fetch, the ref lookups, the ancestry tests, the
# merge and the ref update run as `git -C <main checkout>`, naming
# `refs/heads/<branch>` and never a `HEAD`; and the calls that need the working
# tree — the clean-tree test and the `read-tree` — run with `GIT_DIR` set to
# `<main>/.git`, `GIT_INDEX_FILE` to the index in the record the target check
# accepted and `GIT_WORK_TREE` to the target. So git reads nothing of the
# record but that index: not the `.git` pointer, not the record's `commondir`
# or `HEAD`, and not its `config.worktree` — a `core.fsmonitor` or a filter
# driver written there after the check never runs. Its configuration is the
# main repository's (and the main `.git/config.worktree`, which the permission
# profile write-protects, when `extensions.worktreeConfig` is on), as are its
# hooks and objects. A `HEAD` flipped to another branch after the read is not
# followed: only `refs/heads/<branch>` moves.
#
# A REMOTE WITH NO CONFIGURED URL IS REFUSED. Before a fetch this script
# refuses (exit 1) unless the main `.git/config` names `remote.origin.url`
# (`hr_remote_url_configured`; the reasoning: `push-branch.sh` → the paragraph
# of the same name). `--local` makes no network call and is not checked.
#
# THE TARGET'S `harness.config.json` IS NOT TRUSTED EITHER. A worktree's own
# copy is a tracked file in a sandbox-writable tree, so a sandboxed command
# could commit one that names any ref as `defaultBranch` — which this
# unsandboxed script would then fetch and merge — or that drops a branch from
# `protectedBranches`. So `defaultBranch` and the protected set are read from
# the MAIN checkout's `harness.config.json` — the checkout the target check
# above derives from this file's own location, and a file the permission
# profile write-protects — whichever checkout is the target; the target's own
# copy is never read for them. A main checkout whose configuration cannot be
# read is a refusal (exit 1), never a fall-back to the target's. The `-*`
# refusal on `defaultBranch` below stays as defence in depth.
#
# THE PER-WORKING-COPY CONFIG IS NOT TRUSTED. The main checkout's copy of this
# script runs OUTSIDE the sandbox, and a linked worktree's
# `.git/worktrees/<name>/config.worktree` is sandbox-writable. So before its
# first git call this script refuses (exit 1) unless that file is absent, empty,
# or holds only the `core.hooksPath` `setup-worktree.sh` writes
# (`hr_worktree_config_check_var`); a refusal names each offending key and never
# its value. Every git call after the check pins `core.hooksPath` to the MAIN
# repository's hooks directory, never the worktree's — exported as
# `GIT_CONFIG_COUNT` for the library's calls, and as `-c core.hooksPath` on every
# call spelled here (derivation: `lib/harness-run-lib.sh` →
# `hr_pinned_hooks_path`; the reasoning: `push-branch.sh` → the paragraph of the
# same name). No merge hook runs (THE MERGE IS BUILT FROM PLUMBING above), but
# the fetch runs `reference-transaction`, so the pin still matters. The clean-tree test passes `--ignore-submodules`, so git never runs
# inside a nested repository a sandboxed command could have planted, and the
# fetch and both `read-tree` calls pass `--no-recurse-submodules` for the same
# reason; every call also carries `-c submodule.recurse=false`. So a
# `submodule.recurse` in the main configuration never has the checkout run git
# in a submodule under its `.git/modules/<name>/config`, which a sandboxed
# command can write. The check compares that `core.hooksPath` against the
# `githooksDir` in the worktree's own `harness.config.json` — the one
# configured value read from the worktree, and an inert one: a rewritten copy
# can only make the check accept a different
# `core.hooksPath`, which the pin overrides on every call.
#
# A CLONE IS A TARGET TOO. The target may also be a run copy made as a clone,
# accepted only on the library's clone conditions (`lib/harness-run-lib.sh` →
# `hr_clone_target_check_var`). Those conditions already refuse a
# `config.worktree` and hold `.git/config` to an allow-list, so
# `hr_worktree_config_check_var` is skipped on that arm alone. The refresh goes
# sync-in, operate, swap: after the protected-branch decision, and before the
# branch's tip is read, the main checkout takes the clone's
# `refs/heads/<branch>` (`hr_copy_sync_in_var`, which also heals a clone
# strictly behind it; a refusal reported as `refusing to refresh:`, exit 1);
# the merge is then built exactly as for a worktree; and before the real
# `read-tree` the branch moves through `hr_copy_ref_swap_var`, the clone's
# `refs/heads/<branch>` first and the main checkout's second. A commit landing
# in the clone after sync-in loses the clone's compare-and-swap with nothing
# moved on either side: the exit 1 of a branch moved under this script. The
# put-back after a refused `read-tree` is the reverse swap. Without `--local`,
# the fetched `refs/remotes/origin/<base>` is mirrored into the clone after the
# fetch (`hr_copy_sync_out_var`) — the one ref this script still moves
# main-first, a remote-tracking ref no run commits to; a mirror that fails
# prints one line and changes nothing else. Every refusal in this header holds
# on that arm too. `create-worktree.sh` creates such a clone.
#
# THE INHERITED GIT ENVIRONMENT IS DROPPED. As its first statement after
# sourcing the library, before any git call, this script drops through
# `lib/harness-run-lib.sh` → `hr_git_env_drop` the same `GIT_*` names
# `push-branch.sh` does, every `GIT_TRACE*` included, and keeps
# `GIT_SSH_COMMAND`; `PATH` and `BASH_ENV` are trusted as they arrive (the list and the reasoning: `push-branch.sh` → the paragraph of
# the same name, which also carries the measured basis for keeping
# `GIT_SSH_COMMAND`). It sets `GIT_DIR`, `GIT_INDEX_FILE` and `GIT_WORK_TREE` itself
# afterwards, for the working-tree calls only.
#
# Usage: refresh-branch.sh [--local] [<repo-dir>]
#        bash <main checkout>/<scripts_dir>/refresh-branch.sh <worktree>
#   --local     merge the local `<base>` branch instead of `origin/<base>`, and
#               skip the fetch
#   <repo-dir>  the checkout to refresh is the one holding it. Default: THIS
#               FILE's own location, never $PWD, because the caller runs it from
#               wherever it happens to be. The second form, the main checkout's
#               copy aimed at a worktree, is the one the permission profile runs
#               unsandboxed.
#
# Exit map a caller can switch on:
#
#   0  the current branch now contains the base (the merge landed, or the
#      branch was fast-forwarded to it)
#   1  usage error / not a git repository / detached HEAD / git older than
#      2.38 / the working tree
#      has uncommitted tracked changes / a target this script does not trust,
#      or a main checkout it cannot place (THE TARGET IS NOT TRUSTED above) /
#      the main checkout's configuration could not be read (THE TARGET'S
#      `harness.config.json` IS NOT TRUSTED EITHER above) /
#      a per-working-copy configuration or a hooks directory this script does
#      not trust (THE PER-WORKING-COPY CONFIG IS NOT TRUSTED above) / a
#      `defaultBranch` or a branch starting with `-` / a fetch from a remote
#      whose URL the main `.git/config` does not name (A REMOTE WITH NO
#      CONFIGURED URL IS REFUSED above)
#   2  protected-branch refusal — HEAD is ON a protected branch, so this would be
#      a merge INTO the integration line; nothing was attempted
#   3  nothing to do — the current branch already contains the base
#   4  the base conflicts with the branch; nothing was written, the conflicted
#      paths are listed, and the working copy is exactly as it was
#   5  the branch had been moved to the merge result, the working tree then
#      refused it (something changed in the tree after the dry run), and
#      putting the branch back ALSO failed because something else moved it in
#      between — the working copy is the old tip's while the branch is not: the
#      one row of this map on which the "leaves the branch and the working copy
#      as they were" guarantee does not hold, and the one that needs a human
#      before anything else runs in this checkout
#      On a clone (A CLONE IS A TARGET TOO above) exit 5 also covers the
#      swap's own failure: the clone's `refs/heads/<branch>` moved to the merge
#      result, the main checkout's could not follow, and rolling the clone's
#      back failed — before the working tree was touched, so the working copy
#      holds the old tip while the clone's branch does not
#
# Conditions outside that list land on 1 as well, for the same reason every
# other row of it does — the script cannot proceed and changed nothing: the base
# ref named by the mode is not present; `merge-tree` failed for a reason other
# than a conflict; the merge commit could not be written (an unset identity, a
# failed signature); the working tree would not take the merge result (an
# untracked file in its way), found by the dry run before anything is written;
# the branch moved after its tip was read — on a clone, a commit landing in
# the clone after sync-in — found by the swap before the working tree is
# touched; and the working tree refused the merge
# result after the branch moved to it, with the branch put back.
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
#                     -> exit 4, "conflicted: f.txt", `git -C "$d" status`
#                     shows no MERGING state and feat_x's tip is unchanged
#   fast-forward      git -C "$d" reset -q --hard <the seed commit> on feat_x;
#                     same call -> exit 0, feat_x now IS trunk's tip
#   old git (1)       a git older than 2.38 first on PATH -> exit 1, "needs
#                     git 2.38 or newer", nothing fetched
#   put back failed   no fixture row: the tree has to change after the dry run
#   (5)               and the branch has to move after this script's own
#                     swap, both before its `read-tree`, and nothing
#                     outside the script runs there (cli/test/
#                     wrapper-target-check.test.mjs case (p3) stages it with a
#                     `git` shim, and cases (p) and (p2) the two exit-1 paths)
#   unresolvable      printf 'x' > "$d/harness.config.json"; same call -> exit 1,
#                     nothing merged; restore -> exit 0
#   --local           commit on trunk WITHOUT pushing, then from feat_x:
#                     bash "$d/scripts/refresh-branch.sh" --local -> exit 0
#                     the same call without --local                -> exit 3
#
#   The main checkout's copy refreshing a linked worktree (`githooksDir` takes
#   its default, `githooks`), on a fresh fixture built as above up to the
#   `checkout -q -b feat_x` line, with `"$d/scripts"` populated and committed:
#   mkdir -p "$d/githooks"; git -C "$d" config core.hooksPath githooks
#   printf '%s\n' '#!/bin/sh' "echo main >> $d.marker" > "$d/githooks/post-merge"
#   chmod +x "$d/githooks/post-merge"; git -C "$d" add -A; git -C "$d" commit -qm hooks
#   w=$(mktemp -d)/wt; git -C "$d" worktree add -q -b feat_w "$w"
#   git -C "$w" config extensions.worktreeConfig true
#   git -C "$w" config --worktree core.hooksPath "$(cd -P "$w" && pwd -P)/githooks"
#   printf '%s\n' '#!/bin/sh' "echo wt >> $d.marker" > "$w/githooks/post-merge"
#   chmod +x "$w/githooks/post-merge"
#   # move trunk on and publish it, as above
#
#   a worktree        bash "$d/scripts/refresh-branch.sh" "$w" -> exit 0; `git -C
#                     "$w" log --oneline` shows the base commit, and "$d"'s HEAD
#                     and branch are unchanged
#   no merge hook     cat "$d.marker"   -> no such file: neither post-merge hook
#                     ran (a `reference-transaction` hook in "$d/githooks" would)
#   a foreign key     git -C "$w" config --worktree user.name x; the same call
#                     -> exit 1, a "refusing to refresh:" line naming user.name
#                     and not its value; `git -C "$w" rev-parse HEAD` unchanged
#
#   The target check, on a clean worktree as above; each row starts from it:
#   s=$(mktemp -d); git -C "$s" init -q -b feat_s; git -C "$s" remote add origin "$b"
#   git -C "$s" commit -qm s --allow-empty
#   git -C "$s" config core.sshCommand "touch $s.marker; ssh"
#
#   a scratch repo    bash "$d/scripts/refresh-branch.sh" "$s"
#                     -> exit 1, a "refusing to refresh:" line, no "$s.marker",
#                     `git -C "$s" rev-parse HEAD` unchanged
#   rewritten pointer printf 'gitdir: %s\n' "$s/.git" > "$w/.git"; the same
#                     call on "$w" -> exit 1, a "refusing to refresh:" line
#   rewritten         printf '%s\n' "$s/.git" > "$d/.git/worktrees/wt/commondir";
#   commondir         the same call on "$w" -> exit 1, a "refusing to refresh:"
#                     line
#   planted monitor   git -C "$w" config --worktree core.fsmonitor "touch $s.marker"
#                     -> exit 1 (refused by name); written AFTER the check
#                     instead, as a racing sandboxed process could, it is never
#                     read: no "$s.marker" (cli/test/wrapper-target-check.test.mjs
#                     cases (k2) and (k3) stage that race)
#   planted main      printf '%s\n' "$s/.git" > "$d/.git/commondir"; the same
#   commondir         call on "$w" -> exit 1, "refusing to refresh: cannot place
#                     this script in a main checkout", no "$s.marker"
#   legacy remote     git -C "$d" config --unset remote.origin.url
#                     mkdir -p "$d/.git/remotes"
#                     printf 'URL: %s\n' "$s/.git" > "$d/.git/remotes/origin"
#                     the same call on "$w" -> exit 1, "refusing to refresh:
#                     ... names no URL for remote 'origin'", nothing fetched
#   clean worktree    the "a worktree" row above: it refreshes
#
#   The configuration is the main checkout's, on a clean worktree as above:
#   git -C "$d" branch other trunk; git -C "$d" push -q origin other
#   printf '%s' '{"version":1,"defaultBranch":"other","protectedBranches":[],"stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$w/harness.config.json"
#   git -C "$w" commit -qam "rewrite config"
#
#   another base      bash "$d/scripts/refresh-branch.sh" "$w" -> exit 0, a
#                     "merged origin/trunk into feat_w" line: the worktree's
#                     `defaultBranch` was never read
#   a dropped pattern git -C "$w" checkout -q -b release/x; the same call
#                     -> exit 2: `release/*` is protected by "$d"'s list,
#                     whatever "$w"'s says

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
# THE INHERITED GIT ENVIRONMENT IS DROPPED (header). GIT_SSH_COMMAND is kept.
hr_git_env_drop

use_local=0
target=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --local)
      use_local=1
      shift
      ;;
    -*)
      echo "refresh-branch.sh: unknown argument '$1'" >&2
      echo "  usage: refresh-branch.sh [--local] [<repo-dir>]" >&2
      exit 1
      ;;
    *)
      if [ -n "$target" ]; then
        echo "refresh-branch.sh: unexpected second checkout argument '$1'" >&2
        echo "  usage: refresh-branch.sh [--local] [<repo-dir>]" >&2
        exit 1
      fi
      target="$1"
      shift
      ;;
  esac
done

# Without an argument the checkout being refreshed is where THIS FILE lives —
# never $PWD, which belongs to whoever invoked it.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -n "$target" ] || target="$script_dir"

# THE PER-WORKING-COPY CONFIG IS NOT TRUSTED (header): settled before the first
# git call, each function called directly so its variables survive.
top_nogit="$(hr_checkout_top_nogit "$target")" || top_nogit=""
if [ -z "$top_nogit" ]; then
  echo "refresh-branch.sh: '$target' is not inside a git repository — refusing to merge" >&2
  exit 1
fi
# THE TARGET IS NOT TRUSTED (header).
if ! main_top="$(hr_wrapper_main_of "$script_dir")"; then
  echo "refresh-branch.sh: refusing to refresh: cannot place this script in a main checkout (its .git is a symbolic link, or a directory holding a commondir)" >&2
  exit 1
fi
if ! hr_wrapper_target_check_var "$main_top" "$top_nogit"; then
  echo "refresh-branch.sh: refusing to refresh: $HR_TARGET_REFUSAL" >&2
  exit 1
fi
# A CLONE IS A TARGET TOO (header): the clone arm judged its configuration.
if [ "$HR_TARGET_KIND" != clone ] && ! hr_worktree_config_check_var "$top_nogit"; then
  echo "refresh-branch.sh: refusing to refresh: $HR_WT_CONFIG_REFUSAL" >&2
  exit 1
fi
# The main checkout's hooks, whatever the target: never re-derived through a
# worktree record the sandbox can rewrite.
if ! hr_pinned_hooks_path "$main_top"; then
  if [ -n "$HR_PINNED_HOOKS_REFUSAL" ]; then
    echo "refresh-branch.sh: refusing to refresh: $HR_PINNED_HOOKS_REFUSAL" >&2
  else
    echo "refresh-branch.sh: refusing to refresh: could not resolve the hooks directory to pin for '$top_nogit'" >&2
  fi
  exit 1
fi
pinned="$HR_PINNED_HOOKS_PATH"
# Pins the library helpers' git calls below; every call spelled here also
# carries `-c`, which an older git than 2.31 still honours.
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0="$pinned"

# GIT NEVER RE-READS THE TARGET'S RECORDS (header). The checkout and its git
# directory are the values the checks above judged, taken once: a call that
# needs no working tree runs in the main checkout, and one that does goes
# through `wt_git`, which runs git against the MAIN repository's git directory
# with only the target's index and working tree borrowed — so git reads neither
# the target's `.git` pointer nor anything in its record but the index: not its
# `commondir`, not its `HEAD`, not its `config.worktree`.
top="$top_nogit"
wt_gitdir="$HR_TARGET_GITDIR"
# `-c submodule.recurse=false` on both, and `--no-recurse-submodules` on every
# call that could recurse, so no call here runs git inside a submodule (THE
# PER-WORKING-COPY CONFIG IS NOT TRUSTED, header).
main_git() {
  git -C "$main_top" -c core.hooksPath="$pinned" -c submodule.recurse=false "$@"
}
wt_git() {
  GIT_DIR="$main_top/.git" GIT_INDEX_FILE="$wt_gitdir/index" GIT_WORK_TREE="$top" \
    git -C "$top" -c core.hooksPath="$pinned" -c submodule.recurse=false "$@"
}

# THE MERGE IS BUILT FROM PLUMBING (header), and `git merge-tree --write-tree`
# is git 2.38's. Refused before anything is fetched or merged on an older git,
# rather than discovered as a usage error halfway through.
git_version="$(git --version 2>/dev/null)" || git_version=""
git_major=""
git_minor=""
case "$git_version" in
  "git version "[0-9]*.[0-9]*)
    git_nums="${git_version#git version }"
    git_major="${git_nums%%.*}"
    git_nums="${git_nums#*.}"
    git_minor="${git_nums%%[!0-9]*}"
    ;;
esac
if [ -z "$git_major" ] || [ -z "$git_minor" ] ||
  [ "$git_major" -lt 2 ] || { [ "$git_major" -eq 2 ] && [ "$git_minor" -lt 38 ]; }; then
  echo "refresh-branch.sh: needs git 2.38 or newer (for 'git merge-tree --write-tree'); 'git --version' printed '$git_version' — refusing to merge" >&2
  exit 1
fi

# THE TARGET'S `harness.config.json` IS NOT TRUSTED EITHER (header): every
# configured value below is read at the main checkout, never at "$top".
cfg_root="$main_top"

# Warm the library's cache once, unsubstituted, and fail closed here rather than
# letting each reader below fail separately: a configuration that cannot be read
# is a protected set that cannot be judged.
if ! hr_config_load "$cfg_root"; then
  echo "refresh-branch.sh: cannot resolve '$cfg_root/harness.config.json' — refusing to merge" >&2
  echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)" >&2
  exit 1
fi

base="$(hr_default_branch "$cfg_root")" || base=""
if [ -z "$base" ]; then
  echo "refresh-branch.sh: no defaultBranch in '$cfg_root/harness.config.json' — refusing to merge" >&2
  exit 1
fi
# A base git would parse as an option. Defence in depth: the main checkout's
# harness.config.json is write-protected from the sandbox, and no branch git
# creates starts with `-`.
case "$base" in
  -*)
    echo "refresh-branch.sh: defaultBranch '$base' in '$cfg_root/harness.config.json' starts with '-', which git would read as an option — refusing to merge" >&2
    exit 1
    ;;
esac

# Read once, and named as `refs/heads/<branch>` wherever a call can name it.
if ! hr_wrapper_branch_var "$main_top" "$wt_gitdir"; then
  echo "refresh-branch.sh: detached HEAD — refusing to merge" >&2
  exit 1
fi
branch="$HR_WRAPPER_BRANCH"
case "$branch" in
  -*)
    echo "refresh-branch.sh: branch '$branch' starts with '-', which git would read as an option — refusing to merge" >&2
    exit 1
    ;;
esac

# The direction check, and the reason this wrapper is safe to allow-list. It
# refuses on the branch the guard's dangerous case is about, and it takes the
# library's unresolvable answer as a refusal rather than as a permit.
hr_branch_is_protected "$cfg_root" "$branch"
protected=$?
case "$protected" in
  0)
    patterns="$(hr_protected_patterns "$cfg_root")" || patterns=""
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
    echo "  protected set (from '$cfg_root/harness.config.json'): $protected_set" >&2
    echo "  this wrapper only merges '$base' INTO a working branch; check one out and re-run" >&2
    exit 2
    ;;
  2)
    echo "refresh-branch.sh: cannot resolve '$cfg_root/harness.config.json' — refusing to merge" >&2
    exit 1
    ;;
esac

# A CLONE IS A TARGET TOO (header): sync in before the branch's tip is read; a
# no-op on the main checkout and a worktree.
if ! hr_copy_sync_in_var "$main_top" "$HR_TARGET_GITDIR" "$branch"; then
  echo "refresh-branch.sh: refusing to refresh: $HR_SYNC_REFUSAL" >&2
  exit 1
fi

# The tip the merge is built on, read once: every later step names this commit,
# and the ref moves only if it still points here.
old_tip="$(main_git rev-parse --verify --quiet "refs/heads/$branch^{commit}")" || old_tip=""
if [ -z "$old_tip" ]; then
  echo "refresh-branch.sh: '$branch' does not resolve to a commit in '$main_top' — refusing to merge" >&2
  exit 1
fi

# A merge writes the working tree, so an uncommitted tracked change is refused
# before anything is fetched: the caller's own edit must not be carried into a
# merge commit, and the working tree must be exactly the branch's tip for the
# two-tree update below to be a pure move to the merge result. The index is
# compared against the branch's tip, never against a `HEAD`.
# `--ignore-submodules` on the working-tree diff: without it git runs `git
# status` inside every gitlink's directory, under that nested repository's own
# configuration, which a sandboxed command can write. A merge never touches a
# submodule's working tree here, so its state is not this check's concern.
if ! wt_git diff --quiet --ignore-submodules || ! wt_git diff-index --cached --quiet "$old_tip" --; then
  echo "refresh-branch.sh: uncommitted tracked changes in '$top' — refusing to merge" >&2
  echo "  commit them (bash \"$script_dir/commit-on-branch.sh\" …) and re-run" >&2
  exit 1
fi

if [ "$use_local" -eq 1 ]; then
  base_ref="$base"
  ref_path="refs/heads/$base"
  merge_msg="Merge branch '$base' into $branch"
else
  base_ref="origin/$base"
  ref_path="refs/remotes/origin/$base"
  merge_msg="Merge remote-tracking branch 'origin/$base' into $branch"
  # A REMOTE WITH NO CONFIGURED URL IS REFUSED (header).
  if ! hr_remote_url_configured "$main_top" origin; then
    echo "refresh-branch.sh: refusing to refresh: $main_top/.git/config names no URL for remote 'origin' (git would read one from .git/remotes or .git/branches, which a sandboxed command can write)" >&2
    exit 1
  fi
  # Tolerate a failed fetch the way create-worktree.sh does — offline with the
  # ref already present is still a refresh this can do — and judge the ref the
  # next block names rather than the fetch. git's own stderr still reaches the
  # caller's log whichever outcome follows. `--no-recurse-submodules`: an
  # on-demand fetch would run git in the main checkout's submodules, under
  # configuration a sandboxed command can write.
  main_git fetch --no-recurse-submodules origin "$base" || true
fi

base_tip="$(main_git rev-parse --verify --quiet "$ref_path^{commit}")" || base_tip=""
if [ -z "$base_tip" ]; then
  echo "refresh-branch.sh: no '$base_ref' in '$top' — nothing to merge from" >&2
  if [ "$use_local" -eq 1 ]; then
    echo "  --local merges the local '$base' branch; drop the flag to merge origin/$base" >&2
  else
    echo "  push the default branch (git push -u origin $base), or pass --local to merge the local one" >&2
  fi
  exit 1
fi
# A CLONE IS A TARGET TOO (header): the fetched base mirrored into the clone,
# non-fatally; a no-op on the main checkout and a worktree.
if [ "$use_local" -eq 0 ] &&
  ! hr_copy_sync_out_var "$main_top" "$wt_gitdir" "refs/remotes/origin/$base"; then
  echo "refresh-branch.sh: the clone's origin/$base could not follow the fetch: $HR_SYNC_REFUSAL" >&2
fi

# Already contained => a distinct, dedicated status, so a caller can tell "the
# base is already here" apart from a refusal.
if main_git merge-base --is-ancestor "$base_tip" "$old_tip"; then
  echo "refresh-branch.sh: '$branch' already contains $base_ref — nothing to do"
  exit 3
fi

# THE MERGE IS BUILT FROM PLUMBING (header). A branch the base is ahead of is
# fast-forwarded to it, as `git merge` would; anything else gets a merge commit
# built from objects alone. A conflict is found before anything is written, so
# there is nothing to abort.
if main_git merge-base --is-ancestor "$old_tip" "$base_tip"; then
  new_tip="$base_tip"
else
  merge_out="$(main_git merge-tree --write-tree --name-only --no-messages "$old_tip" "$base_tip")"
  merge_status=$?
  case "$merge_status" in
    0) ;;
    1)
      echo "refresh-branch.sh: $base_ref conflicts with $branch — nothing was merged, working copy unchanged" >&2
      # The conflicted paths, one per line after the tree id.
      printf '%s\n' "$merge_out" | sed -n '2,$p' | while IFS= read -r path; do
        [ -n "$path" ] && printf '  conflicted: %s\n' "$path" >&2
      done
      exit 4
      ;;
    *)
      echo "refresh-branch.sh: 'git merge-tree' failed (exit $merge_status, see output above) — nothing was merged" >&2
      exit 1
      ;;
  esac
  merge_tree="$(printf '%s\n' "$merge_out" | sed -n '1p')"
  new_tip="$(main_git commit-tree "$merge_tree" -p "$old_tip" -p "$base_tip" -m "$merge_msg")" || new_tip=""
  if [ -z "$new_tip" ]; then
    echo "refresh-branch.sh: could not write the merge commit (see output above; an unset user.name/user.email is the usual cause) — nothing was merged" >&2
    exit 1
  fi
fi

# The branch moves before the working tree does, so a branch that moved under
# this script is caught before anything is written. First a dry run of the
# two-tree update: it refuses, writing nothing, when it would overwrite an
# untracked file or a path that is not up to date.
if ! wt_git read-tree -n --no-recurse-submodules -m -u "$old_tip" "$new_tip"; then
  echo "refresh-branch.sh: could not update '$top' to the merge result (see output above) — nothing was merged, working copy unchanged" >&2
  exit 1
fi
# Then the branch, as a compare-and-swap (`hr_copy_ref_swap_var`): it moves
# `refs/heads/<branch>` and nothing else, and only from the tip the merge was
# built on — on a clone, the clone's ref first (A CLONE IS A TARGET TOO,
# header).
swap=0
hr_copy_ref_swap_var "$main_top" "$wt_gitdir" "refs/heads/$branch" "$new_tip" "$old_tip" "refresh-branch.sh: merge $base_ref" || swap=$?
case "$swap" in
  0) ;;
  5)
    echo "refresh-branch.sh: could not move '$branch' to the merge result: $HR_SYNC_REFUSAL — the working copy still holds the old tip, which the clone's '$branch' no longer points at" >&2
    echo "  inspect it yourself (git log -1 $branch, git status), then re-run" >&2
    exit 5
    ;;
  *)
    echo "refresh-branch.sh: '$branch' moved while it was being refreshed, or its ref could not be locked (see output above) — nothing was merged, working copy unchanged" >&2
    [ -z "$HR_SYNC_REFUSAL" ] || echo "  $HR_SYNC_REFUSAL" >&2
    exit 1
    ;;
esac
# Then the working tree and index. `read-tree` checks every path before it
# writes one, so a refusal here — something changed in the tree since the dry
# run — has written nothing, and the branch is put back by the reverse swap.
if wt_git read-tree --no-recurse-submodules -m -u "$old_tip" "$new_tip"; then
  echo "refresh-branch.sh: merged $base_ref into $branch"
  exit 0
fi
if hr_copy_ref_swap_var "$main_top" "$wt_gitdir" "refs/heads/$branch" "$old_tip" "$new_tip" "refresh-branch.sh: undo merge $base_ref"; then
  echo "refresh-branch.sh: could not update '$top' to the merge result (see output above) — '$branch' was put back where it was, nothing was merged" >&2
  exit 1
fi
echo "refresh-branch.sh: could not update '$top' to the merge result, and putting '$branch' back failed too ($HR_SYNC_REFUSAL) — '$branch' does not point at the commit the working copy holds" >&2
echo "  inspect it yourself (git log -1 $branch, git status), then re-run" >&2
exit 5
