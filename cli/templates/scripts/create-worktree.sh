#!/usr/bin/env bash
# create-worktree.sh — create the sibling working copy a run executes in, and
# bootstrap it by handing off to setup-worktree.sh.
#
# Every copy it makes is a clone (`hr_clone_create_var`: `git clone --shared`,
# the main checkout's objects borrowed through `alternates`, the configuration
# held to the library's allow-list, recorded in the run registry with
# `copy_kind` `clone`), and every bootstrap runs THIS checkout's
# `setup-worktree.sh --target <clone>`, so every configured value and the
# bootstrap script itself come from the main checkout. It therefore runs, in
# every mode, only from the main checkout's own scripts directory.
#
# THE TWO MODES, AND WHEN EACH IS USED.
#
#   default      Start a NEW branch: cut `refs/heads/<branch>` in the main
#                checkout at the default branch's commit AS ORIGIN REPORTS IT
#                (`hr_run_trusted_base_var`: `ls-remote`, then a fetch of that
#                object), never off a local ref a sandboxed session can write;
#                clone it, bootstrap the clone, then PUSH the branch from the
#                main checkout (`push --set-upstream`, so the main checkout's
#                `pre-push` hook runs and the upstream lands in the main
#                `.git/config`) and sync the pushed tip's
#                `refs/remotes/origin/<branch>` out to the clone, so the flows'
#                push-state read in the copy sees the push. Origin unreachable,
#                or carrying no default branch, is a refusal; so is a local
#                `refs/heads/<branch>` that already exists. This is what the
#                watcher calls when a prompt arrives for a branch that does not
#                exist yet.
#   --no-bootstrap  Skip the bootstrap. Alone, a variant of default mode: cut,
#                push and sync out the new branch the same way. With
#                `--existing`, check out the existing branch and never push. Its
#                callers are `remote-run.sh start` (a new branch) and
#                `remote-run.sh review` (an existing one), each of which only
#                places and commits one file: such a copy runs nothing, so a
#                dependency install would cost minutes and could fail the
#                placement for a reason unrelated to the task. It installs no
#                pre-push backstop in the copy — every later commit goes through
#                `commit-on-branch.sh` and `push-branch.sh`, which refuse a
#                protected branch themselves.
#   --existing   Check out an EXISTING branch — local, or created in the main
#                checkout by compare-and-swap from nothing at `origin/<branch>`
#                when only the remote ref exists — bootstrap it, and NEVER push.
#                This is what the watcher calls to recreate a working copy for a
#                branch whose original one was removed (a merged-and-cleaned-up
#                branch coming back for a follow-up run), and the asymmetry is
#                the point: the branch already has a history somebody else may
#                have advanced, so this mode reads the remote and never writes
#                to it. The branch is one a run wrote, and a run's commits can
#                carry any content at any path, so it reads the tip once and
#                refuses it unless the protected set (`hr_run_surface_check_var
#                … tree`) equals origin's default branch at their merge base —
#                before anything is created; `hr_clone_create_var` repeats the
#                check on the tip it clones; and the finished copy must be on
#                the branch at that same tip (`hr_run_copy_check_var`).
#
# WHERE THE WORKTREE GOES. `<work_root>/<projectName>-<sanitized branch>`,
# derived by the shared library rather than assembled here — the SAME
# derivation the generated permission profile's sibling-worktree glob is
# materialized from. There is no override: the clone arm of the wrappers' trust
# check accepts a clone only at that derived path, so a copy anywhere else is
# one no wrapper would commit or push from.
#
# WHY `set -e` IS RIGHT HERE, AND NOWHERE ELSE IN THIS SET. Every other script
# written into the scripts directory runs `set -uo pipefail` without `-e`,
# because a wrapper or a long-lived watcher that exits on the first non-zero
# probe stops doing its job. This one is a short, strictly ordered sequence in
# which every step is a precondition of the next: bootstrapping a half-created
# copy, or pushing a branch whose dependency install failed, is worse than
# stopping. So a failing step aborts the script — and from the first thing it
# creates, an `EXIT` trap ROLLS BACK everything this run created and nothing
# else, in order: the remote branch its own push created (deleted from the main
# checkout under a lease on the pushed tip, so a ref another writer has moved
# since is left alone); the clone (`hr_clone_remove_var`); the local branch it
# cut or created (a compare-and-swap from that tip), with the `branch.<branch>`
# section its push wrote; the registry record (dropped, or the previous one put
# back); and a registry directory it made, when nothing else is left in it.
# Each undo that fails prints one line naming what is left and the command
# that clears it. The trap is cleared only on the success exit.
#
# FAIL CLOSED ON A CONFIGURATION IT CANNOT READ. The directory name, the default
# branch and the registry path all come from `harness.config.json` at run time,
# through `lib/harness-run-lib.sh`, and none of them has a remembered fallback:
# a guessed default branch would branch a run off the wrong history, and a
# guessed directory would create a working copy the permission profile does not
# match. An unreadable or absent configuration is therefore a refusal that
# creates nothing.
#
# WHAT IT NEVER DOES. It never makes a `--local` clone or hardlinks an object,
# whose inodes would be the main checkout's own, and never dissociates a clone.
# It never makes a second live copy of a branch (`hr_run_copy_live_var`: the
# derived path existing, a registry record naming a path that exists, or a
# checkout of the main repository having the branch checked out) — it names
# that copy and refuses. It never pushes in `--existing` mode, never writes a
# branch's tree before the protected-surface check has passed on the tip it
# read, never runs a hook from that tree, and never runs the branch's own
# `setup-worktree.sh` or `commands.*`. It never deletes, empties, reuses or
# moves a directory it did not create. It is run by the watcher or by a
# person, not by a dispatched agent, so it has no entry in the generated
# permission profile — a CALLING CONVENTION, NOT A GATE: its basename is not on
# the script-allowlist guard's `DENY_SCRIPT_BASENAMES`, and that guard grants
# independently of the profile, so an agent invoking this path under
# `scriptsDir` is auto-allowed today — but only in a PLAIN invocation: that
# guard's construct scan withholds the allow, silently, from any command
# carrying `$(…)` (a branch name taken from `$(git rev-parse …)`, say), a
# backtick, `|`, `<`, a braced form other than a bare `${IDENT}`, or a `>` that
# is neither a descriptor duplication (`2>&1`, `>&2`, `2>&-`) nor a redirection
# to the literal `/dev/null`.
#
# Usage: create-worktree.sh [--existing] [--no-bootstrap] <branch-name>
#   --existing     check out an existing branch instead of creating a new one
#   --no-bootstrap skip the bootstrap: alone, create and push a new branch; with
#                  --existing, check out the existing branch and never push
#   <branch-name>  the branch to run on
#
# Exit map a caller can switch on:
#
#   0  the clone is ready (and, in default mode or under `--no-bootstrap`
#      without `--existing`, the branch was pushed and the clone's
#      `refs/remotes/origin/<branch>` mirrors the pushed tip)
#   1  usage error, a `[worktree-dir]` argument included / the library or the
#      configuration could not be read / run from anywhere but the main
#      checkout's own scripts directory, or a main checkout whose `.git` is not
#      a real directory / a bootstrapped mode with no readable
#      `setup-worktree.sh` beside this script — nothing was created
#   2  refusal or failure — nothing was created, or what was created was
#      removed: a live run copy of the branch exists (it is named), or whether
#      one does cannot be told; `--existing` and the branch is nowhere;
#      `--existing` and the tip's protected surface differs from origin's
#      default branch at their merge base, or that base cannot be established
#      (the refusal names each path); default mode with no `origin` remote, no
#      default-branch commit origin reports (origin unreachable included), a
#      local branch of that name already there, or no answer from origin on
#      whether the branch exists there; the clone could not be created
#      (`hr_clone_create_var`'s refusal is quoted) or failed its check; the
#      push failed (nothing is left on `origin`); or the mirror sync-out
#      failed after the push (the remote branch this run's push created is
#      deleted under its lease, with everything else this run made)
#   4  the clone was created but its bootstrap failed (never under
#      `--no-bootstrap`) — the clone, the branch this run cut or created, the
#      registry record and a registry directory this run made are removed,
#      and nothing was pushed, because this exit precedes the push step
#   *  any other status is a failing step's own (`set -e`), after the same
#      rollback once anything was created
#
# REPRO — reproduce any decision by hand, against a throwaway fixture (needs
# `jq`):
#
#   w=$(mktemp -d); b="$w/origin.git"; git init -q --bare "$b"
#   d="$w/demo"; git init -q -b trunk "$d"; git -C "$d" remote add origin "$b"
#   printf '%s' '{"version":1,"projectName":"demo","defaultBranch":"trunk","stateDir":"sdlc-harness/","layers":[],"commands":{"depInstall":"printf x > deps.marker"}}' > "$d/harness.config.json"
#   mkdir -p "$d/scripts/lib"   # copy this script + setup-worktree.sh + lib/ there
#   git -C "$d" add -A && git -C "$d" commit -qm seed && git -C "$d" push -q -u origin trunk
#   rm_copy() { ( . "$d/scripts/lib/harness-run-lib.sh"; hr_clone_remove_var "$d" "$1" ); }
#   reg="$d/sdlc-harness/autonomous_logs/registry.json"
#
#   new branch     bash "$d/scripts/create-worktree.sh" feat/x
#                  -> "$w/demo-feat-x" on feat/x, its `.git` a directory and
#                     `.git/objects/info/alternates` naming "$d/.git/objects",
#                     bootstrapped (deps.marker); `jq -r '.runs["feat/x"].copy_kind'
#                     "$reg"` is clone; `git -C "$b" branch` lists feat/x;
#                     `git -C "$d" config branch.feat/x.merge` is
#                     refs/heads/feat/x; and `git rev-list --count
#                     origin/feat/x..HEAD` in the copy prints 0
#   no-bootstrap   bash "$d/scripts/create-worktree.sh" --no-bootstrap feat/q
#                  -> "$w/demo-feat-q" on feat/q, no deps.marker, and
#                     `git -C "$b" branch` lists feat/q
#   existing, no bootstrap   rm_copy "$w/demo-feat-q"; git -C "$d" branch -D feat/q
#                  bash "$d/scripts/create-worktree.sh" --existing --no-bootstrap feat/q
#                  -> "$w/demo-feat-q" on feat/q at origin's tip, populated, no
#                     deps.marker, and "$b" UNCHANGED
#   already there  bash "$d/scripts/create-worktree.sh" --existing feat/x
#                  -> exit 2 naming "$w/demo-feat-x"; nothing created
#   recreate       rm_copy "$w/demo-feat-x"
#                  bash "$d/scripts/create-worktree.sh" --existing feat/x
#                  -> re-created at the local feat/x, bootstrapped by
#                     "$d/scripts/setup-worktree.sh --target", and "$b" is
#                     UNCHANGED
#   override       bash "$d/scripts/create-worktree.sh" feat/o "$w/elsewhere"
#                  -> exit 1; nothing created
#   no remote      git -C "$d" remote remove origin
#                  bash "$d/scripts/create-worktree.sh" feat/y
#                  -> exit 2 naming the missing remote; nothing created
#                  (git -C "$d" remote add origin "$b" restores the fixture)
#   no base ref    git -C "$b" update-ref -d refs/heads/trunk
#                  bash "$d/scripts/create-worktree.sh" feat/y
#                  -> exit 2 naming origin; `ls-remote` finding no
#                     refs/heads/trunk is what refuses; nothing created
#                  (git -C "$d" push -q origin trunk restores the fixture)
#   payload        # commit .claude/settings.json through plumbing, never
#                  # writing it to "$d"'s working tree, on a pushed branch
#                  o=$(printf '{}' | git -C "$d" hash-object -w --stdin)
#                  i="$w/idx"; GIT_INDEX_FILE="$i" git -C "$d" read-tree trunk
#                  GIT_INDEX_FILE="$i" git -C "$d" update-index --add --cacheinfo "100644,$o,.claude/settings.json"
#                  t=$(GIT_INDEX_FILE="$i" git -C "$d" write-tree)
#                  c=$(git -C "$d" commit-tree "$t" -p trunk -m payload)
#                  git -C "$d" push -q origin "$c:refs/heads/feat/p"
#                  bash "$d/scripts/create-worktree.sh" --existing feat/p
#                  -> exit 2 naming .claude/settings.json; no "$w/demo-feat-p",
#                     and no local feat/p
#   bootstrap fails  mv "$d/scripts/setup-worktree.sh" "$w/setup.keep"
#                  printf 'exit 3\n' > "$d/scripts/setup-worktree.sh"
#                  bash "$d/scripts/create-worktree.sh" feat/z
#                  -> exit 4; no "$w/demo-feat-z", no local feat/z, no
#                     .runs["feat/z"] in "$reg", and `git -C "$b" branch` does
#                     NOT list feat/z
#                  (mv "$w/setup.keep" "$d/scripts/setup-worktree.sh" restores it)
#   push refused   printf '#!/bin/sh\nexit 1\n' > "$b/hooks/pre-receive"; chmod +x "$b/hooks/pre-receive"
#                  bash "$d/scripts/create-worktree.sh" feat/r
#                  -> exit 2 naming the push; no "$w/demo-feat-r", no local
#                     feat/r, no record, and feat/r is not on "$b"
#                  (rm "$b/hooks/pre-receive" restores the fixture)
#   sync-out fails # on the branch's creation only, lock the clone's mirror ref
#                  printf '#!/bin/sh\nz=0000000000000000000000000000000000000000\nwhile read o n r; do [ "$r" = refs/heads/feat/s ] && [ "$o" = "$z" ] && mkdir -p "%s/.git/refs/remotes/origin/feat" && : > "%s/.git/refs/remotes/origin/feat/s.lock"; done\nexit 0\n' "$w/demo-feat-s" "$w/demo-feat-s" > "$b/hooks/post-receive"; chmod +x "$b/hooks/post-receive"
#                  bash "$d/scripts/create-worktree.sh" feat/s
#                  -> exit 2 naming the sync-out; `git -C "$d" ls-remote origin
#                     refs/heads/feat/s` and `git -C "$d" config --get-regexp
#                     '^branch\.feat/s\.'` print nothing; no copy, local branch
#                     or record is left
#                  (rm "$b/hooks/post-receive" restores the fixture)
#   unresolvable   printf 'x' > "$d/harness.config.json"; either mode -> exit 1,
#                  nothing created

set -euo pipefail

# The library is reached by a path computed from this script's own location, so
# a copy that was moved with its `lib/` still finds it, and no session root or
# runtime-substituted token is assumed.
hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "create-worktree.sh: cannot read '$hr_lib' — refusing to create a worktree" >&2
  exit 1
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

usage() {
  echo "  usage: create-worktree.sh [--existing] [--no-bootstrap] <branch-name>" >&2
}

existing=0
no_bootstrap=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --existing) existing=1; shift ;;
    --no-bootstrap) no_bootstrap=1; shift ;;
    *) break ;;
  esac
done
if [ "$#" -lt 1 ] || [ -z "${1:-}" ]; then
  echo "create-worktree.sh: no branch name given" >&2
  usage
  exit 1
fi
branch="$1"
shift
if [ "$#" -gt 0 ]; then
  echo "create-worktree.sh: a run copy lives only at the path derived from the main checkout's configuration, because the clone arm of the wrappers' trust check accepts no other — refusing the directory argument '$1'" >&2
  usage
  exit 1
fi

# --- Anchors. Derived, never remembered. `pwd -P`, because the placement test
# below compares this directory's checkout with the main checkout canonically.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
top="$(hr_repo_root "$script_dir")" || top=""
if [ -z "$top" ]; then
  echo "create-worktree.sh: '$script_dir' is not inside a git repository — refusing" >&2
  exit 1
fi

# Every configured value is read from the MAIN checkout: it is where `init` ran,
# so its `projectName` is the stem the permission profile's worktree glob was
# materialized from, and its `defaultBranch` is the one the flow branches off.
main_repo="$(hr_main_repo "$top")" || main_repo=""
[ -n "$main_repo" ] || main_repo="$top"

# Warm the library's per-process cache once, unsubstituted, and make the
# fail-closed decision here rather than letting each reader fail separately.
cfg_status=0
hr_config_load "$main_repo" || cfg_status=$?
if [ "$cfg_status" -ne 0 ]; then
  echo "create-worktree.sh: cannot resolve '$main_repo/harness.config.json' — refusing to create a worktree" >&2
  echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)" >&2
  exit 1
fi

# --- Before anything is created, in every mode. Every mode bootstraps (or, under
# `--no-bootstrap`, places) through THIS directory, so this copy must be the
# main checkout's own.
placed="$(hr_wrapper_main_of "$script_dir")" || placed=""
main_c="$( CDPATH= cd -P -- "$main_repo" 2>/dev/null && pwd -P )" || main_c=""
top_c="$( CDPATH= cd -P -- "$top" 2>/dev/null && pwd -P )" || top_c=""
if [ -z "$placed" ] || [ "$placed" != "$main_c" ] || [ "$placed" != "$top_c" ]; then
  echo "create-worktree.sh: runs only from the main checkout's own scripts directory, and '$script_dir' does not place as $main_repo — refusing" >&2
  exit 1
fi
if ! hr_run_main_set_var "$main_repo"; then
  echo "create-worktree.sh: $HR_RUN_REFUSAL — refusing" >&2
  exit 1
fi
bootstrap="$script_dir/setup-worktree.sh"
if [ "$no_bootstrap" -eq 0 ] && [ ! -r "$bootstrap" ]; then
  echo "create-worktree.sh: no bootstrap script at '$bootstrap', this main checkout's own — refusing; nothing was created" >&2
  echo "  restore setup-worktree.sh beside this script and re-run" >&2
  exit 1
fi

worktree_dir="$(hr_worktree_dir "$main_repo" "$branch")" || worktree_dir=""
if [ -z "$worktree_dir" ]; then
  echo "create-worktree.sh: could not derive the worktree directory for '$branch' — refusing" >&2
  exit 1
fi
registry="$(hr_state_path "$main_repo" autonomous_logs/registry.json)" || registry=""
if [ -z "$registry" ]; then
  echo "create-worktree.sh: cannot resolve the run registry's path from '$main_repo/harness.config.json' — refusing" >&2
  exit 1
fi
regdir="$(hr_registry_dir "$registry")"

live=0
hr_run_copy_live_var "$main_repo" "$branch" || live=$?
case "$live" in
  0)
    echo "create-worktree.sh: branch '$branch' is already checked out at $HR_LIVE_COPY — refusing" >&2
    echo "  switch that checkout to another branch (or run there instead) and retry" >&2
    exit 2
    ;;
  1) ;;
  *)
    echo "create-worktree.sh: cannot tell whether a live run copy of '$branch' exists — $HR_LIVE_COPY_WHY; refusing, nothing was created" >&2
    exit 2
    ;;
esac

if [ "$existing" -eq 1 ]; then
  # Existing-branch mode: tolerate a failed fetch (offline) iff the local branch
  # already exists; otherwise the branch must be on the remote.
  fetch_ok=1
  git -C "$main_repo" fetch origin "$branch" || fetch_ok=0
  local_existed=1
  if ! git -C "$main_repo" show-ref --verify --quiet "refs/heads/$branch"; then
    local_existed=0
    if [ "$fetch_ok" -ne 1 ] || ! git -C "$main_repo" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
      echo "create-worktree.sh: branch '$branch' is not local and not on origin — cannot check out an existing branch" >&2
      exit 2
    fi
  fi

  # The tip is read ONCE; the check, the local branch this run may create and
  # the finished copy's test all name this object id, so a ref moved in between
  # is refused rather than checked out.
  if [ "$local_existed" -eq 1 ]; then
    tip_ref="refs/heads/$branch"
  else
    tip_ref="refs/remotes/origin/$branch"
  fi
  tip="$(hr_run_main_git rev-parse --verify --quiet "$tip_ref^{commit}" 2>/dev/null)" || tip=""
  if [ -z "$tip" ]; then
    echo "create-worktree.sh: $tip_ref does not name a commit — refusing; nothing was created" >&2
    exit 2
  fi
  if ! hr_run_surface_check_var "$tip" tree; then
    echo "create-worktree.sh: refusing to check out '$branch' at $tip — $HR_RUN_SURFACE_REFUSAL" >&2
    echo "  nothing was created: a run's commits can carry any content at a protected path, and this copy would be bootstrapped outside the sandbox" >&2
    exit 2
  fi
  start=""
else
  default_branch="$(hr_default_branch "$main_repo")" || default_branch=""
  if [ -z "$default_branch" ]; then
    echo "create-worktree.sh: no defaultBranch in '$main_repo/harness.config.json' — refusing" >&2
    exit 1
  fi
  # The copy is branched from the default branch's commit as origin reports
  # it, so the remote is a precondition and not a step. Refuse a missing origin
  # here, and below an origin that cannot say what that commit is, in this
  # script's own voice: unguarded, `set -e` would end the run at four lines of
  # git naming neither this script, nor a remedy, nor the check that would have
  # said so first.
  if ! git -C "$main_repo" remote get-url origin >/dev/null 2>&1; then
    echo "create-worktree.sh: '$main_repo' has no 'origin' remote — a working copy is created from origin/$default_branch, so there is nothing to branch from" >&2
    echo "  add one: git remote add origin <url> && git push -u origin $default_branch" >&2
    echo "  (\`npx autonomous-sdlc-harness doctor\` reports this as a failing \`remote\` check)" >&2
    exit 2
  fi
  # This fetch only keeps origin/<default branch> current for the clone's copy
  # of it; the cut is from the commit origin reports, never from a local ref a
  # sandboxed session can write, so an unreachable origin is a refusal.
  git -C "$main_repo" fetch origin "$default_branch" || true
  if ! hr_run_main_set_var "$main_repo"; then
    echo "create-worktree.sh: $HR_RUN_REFUSAL — refusing" >&2
    exit 1
  fi
  if ! hr_run_trusted_base_var; then
    echo "create-worktree.sh: cannot establish $default_branch on origin to branch from — $HR_RUN_REFUSAL; nothing was created" >&2
    echo "  reach origin, or push the default branch: git push -u origin $default_branch" >&2
    echo "  (\`npx autonomous-sdlc-harness doctor\` reports a missing origin/$default_branch as a failing \`remote\` check; it does not contact origin, so an unreachable one passes there)" >&2
    exit 2
  fi
  start="$HR_RUN_TRUSTED_BASE"
  # A new branch is one this run cuts: an existing local one would be cloned at
  # its own tip and pushed as if it were new.
  if hr_run_main_git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
    echo "create-worktree.sh: a local branch '$branch' already exists in $main_repo — refusing; nothing was created" >&2
    echo "  check it out with --existing, or delete it first: git -C $main_repo branch -D $branch" >&2
    exit 2
  fi
  # Whether `origin` already has the branch decides whether the rollback may
  # delete it there: only a remote branch this run's push created is removed.
  remote_status=0
  hr_run_main_git ls-remote --exit-code origin "refs/heads/$branch" >/dev/null 2>&1 || remote_status=$?
  case "$remote_status" in
    0) remote_absent=0 ;;
    2) remote_absent=1 ;;
    *)
      echo "create-worktree.sh: 'git ls-remote origin refs/heads/$branch' failed (exit $remote_status) — cannot tell whether origin has '$branch'; refusing, nothing was created" >&2
      exit 2
      ;;
  esac
  had_upstream=0
  if git -C "$main_repo" config --get "branch.$branch.remote" >/dev/null 2>&1 \
    || git -C "$main_repo" config --get "branch.$branch.merge" >/dev/null 2>&1; then
    had_upstream=1
  fi
fi

had_record=0
prev_json=""
if hr_registry_peek "$registry" "$branch" branch >/dev/null; then
  had_record=1
  if ! prev_json="$(jq -c --arg b "$branch" '.runs[$b]' "$registry" 2>/dev/null)" || [ -z "$prev_json" ]; then
    echo "create-worktree.sh: reading the existing registry record of '$branch' in $registry failed — refusing; nothing was created" >&2
    exit 2
  fi
fi

# --- The rollback. Armed before the first thing this run creates; each flag
# records one thing created, so the undo touches nothing else.
made_regdir=0
made_branch=0
cut_tip=""
clone_dir=""
recorded=0
push_created=0
pushed_tip=""
upstream_written=0

rollback() {
  local st=$?
  trap - EXIT HUP INT TERM
  set +e
  echo "create-worktree.sh: removing what this run created for '$branch'" >&2
  if [ "$push_created" -eq 1 ]; then
    if ! git -C "$main_repo" push --force-with-lease="refs/heads/$branch:$pushed_tip" origin ":refs/heads/$branch" >/dev/null 2>&1; then
      echo "  left: refs/heads/$branch on origin at $pushed_tip — clear it with: git -C $main_repo push --force-with-lease=refs/heads/$branch:$pushed_tip origin :refs/heads/$branch" >&2
    fi
  fi
  if [ -n "$clone_dir" ] && ! hr_clone_remove_var "$main_repo" "$clone_dir"; then
    echo "  left: the clone at $clone_dir ($HR_CLONE_REFUSAL) — clear it with: rm -rf $clone_dir" >&2
  fi
  if [ "$made_branch" -eq 1 ] && ! hr_copy_sync_main_git "$main_c" update-ref -d "refs/heads/$branch" "$cut_tip" >/dev/null 2>&1; then
    echo "  left: refs/heads/$branch in $main_repo — clear it with: git -C $main_repo update-ref -d refs/heads/$branch $cut_tip" >&2
  fi
  if [ "$upstream_written" -eq 1 ] && ! git -C "$main_repo" config --remove-section "branch.$branch" >/dev/null 2>&1; then
    echo "  left: the branch.$branch section in $main_repo/.git/config — clear it with: git -C $main_repo config --remove-section branch.$branch" >&2
  fi
  if [ "$recorded" -eq 1 ]; then
    if [ "$had_record" -eq 1 ]; then
      hr_registry_restore "$registry" "$branch" "$prev_json" 2>/dev/null \
        || echo "  left: '$branch''s record in $registry is this run's, not its previous one — set .runs[\"$branch\"] back to: $prev_json" >&2
    else
      hr_registry_drop "$registry" "$branch" 2>/dev/null \
        || echo "  left: '$branch''s record in $registry — clear it with: jq 'del(.runs[\"$branch\"])' on that file" >&2
    fi
  fi
  if [ "$made_regdir" -eq 1 ]; then
    # The registry file inside it is this run's when it holds no run at all.
    if [ -f "$registry" ] && jq -e '.runs == {}' "$registry" >/dev/null 2>&1; then
      rm -f -- "$registry"
    fi
    rmdir -- "$regdir" 2>/dev/null || :
  fi
  exit "$st"
}
trap rollback EXIT
trap 'exit 2' HUP INT TERM

# `hr_clone_create_var` refuses a missing registry directory, and a trigger
# job's fresh checkout has none.
if [ ! -d "$regdir" ]; then
  if ! mkdir -p -- "$regdir"; then
    echo "create-worktree.sh: could not create the run registry's directory $regdir" >&2
    exit 2
  fi
  made_regdir=1
fi

if [ "$existing" -eq 1 ] && [ "$local_existed" -eq 0 ]; then
  if ! hr_run_main_git update-ref "refs/heads/$branch" "$tip" "" >/dev/null 2>&1; then
    echo "create-worktree.sh: could not create refs/heads/$branch at $tip in $main_repo — refusing" >&2
    exit 2
  fi
  made_branch=1
  cut_tip="$tip"
fi

if ! hr_clone_create_var "$main_repo" "$branch" "$start"; then
  echo "create-worktree.sh: $HR_CLONE_REFUSAL" >&2
  exit 2
fi
clone_dir="$HR_CLONE_DIR"
recorded=1
if [ "$existing" -eq 0 ]; then
  made_branch=1
  cut_tip="$start"
fi

if [ "$existing" -eq 1 ]; then
  if ! hr_run_copy_check_var "$main_repo" "$clone_dir"; then
    echo "create-worktree.sh: the clone just created is not one this script trusts — $HR_RUN_REFUSAL" >&2
    exit 2
  fi
  if [ "$HR_RUN_COPY_BRANCH" != "$branch" ]; then
    echo "create-worktree.sh: the clone just created at $clone_dir is not on '$branch' — refusing" >&2
    exit 2
  fi
  if [ "$HR_RUN_COPY_TIP" != "$tip" ]; then
    echo "create-worktree.sh: refs/heads/$branch is ${HR_RUN_COPY_TIP:-unreadable}, not the checked tip $tip — refusing" >&2
    exit 2
  fi
fi

# --- Bootstrap. setup-worktree.sh is the single source for what bootstrapping
# means (it also installs the pre-push backstop in the clone's own
# `.git/config`); THIS checkout's copy runs, with `--target`.
if [ "$no_bootstrap" -eq 0 ]; then
  bs_status=0
  bash "$bootstrap" --target "$clone_dir" || bs_status=$?
  if [ "$bs_status" -ne 0 ]; then
    echo "create-worktree.sh: the bootstrap '$bootstrap --target $clone_dir' failed (exit $bs_status) — the working copy was created but NOT bootstrapped" >&2
    echo "  the copy and the branch this run created are removed below; '$branch' was not pushed" >&2
    exit 4
  fi
fi

if [ "$existing" -eq 1 ]; then
  trap - EXIT HUP INT TERM
  if [ "$no_bootstrap" -eq 1 ]; then
    echo "create-worktree.sh: worktree ready at $clone_dir (not bootstrapped)"
  else
    echo "create-worktree.sh: worktree ready at $clone_dir"
  fi
  echo "create-worktree.sh: branch $branch (existing branch; not pushed)"
  exit 0
fi

# --- Push, from the main checkout: its `pre-push` hook runs, the upstream lands
# in its `.git/config`, and nothing the clone's configuration says decides it.
if ! git -C "$main_repo" push --set-upstream origin "refs/heads/$branch:refs/heads/$branch"; then
  echo "create-worktree.sh: pushing '$branch' to origin from $main_repo failed — nothing was left on origin" >&2
  exit 2
fi
pushed_tip="$cut_tip"
push_created="$remote_absent"
[ "$had_upstream" -eq 1 ] || upstream_written=1

# The flows read push state in the copy as `origin/<branch>..HEAD`, and a clone
# carries no upstream keys, so its mirror must hold the pushed tip from the
# start. Empty expected-old: the clone must not have it yet.
if ! hr_copy_sync_out_var "$main_repo" "$clone_dir/.git" "refs/remotes/origin/$branch" ""; then
  echo "create-worktree.sh: the mirror sync-out of refs/remotes/origin/$branch to the clone failed after the push — $HR_SYNC_REFUSAL" >&2
  exit 2
fi

trap - EXIT HUP INT TERM
if [ "$no_bootstrap" -eq 1 ]; then
  echo "create-worktree.sh: worktree ready at $clone_dir (not bootstrapped)"
else
  echo "create-worktree.sh: worktree ready at $clone_dir"
fi
echo "create-worktree.sh: branch $branch (pushed to origin)"
exit 0
