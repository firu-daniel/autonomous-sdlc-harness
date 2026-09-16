#!/usr/bin/env bash
# create-worktree.sh — create the sibling working copy a run executes in, and
# bootstrap it by handing off to setup-worktree.sh.
#
# THE TWO MODES, AND WHEN EACH IS USED.
#
#   default      Start a NEW branch: fetch the configured default branch, add a
#                worktree with `-b <branch>` off `origin/<default branch>`,
#                bootstrap it, then PUSH the branch so the remote has it from
#                the first moment. This is what the watcher calls when a prompt
#                arrives for a branch that does not exist yet.
#   --existing   Check out an EXISTING branch — local, or DWIM-created from
#                `origin/<branch>` when only the remote ref exists — bootstrap
#                it, and NEVER push. This is what the watcher calls to recreate
#                a working copy for a branch whose original one was removed (a
#                merged-and-cleaned-up branch coming back for a follow-up run),
#                and the asymmetry is the point: the branch already has a
#                history somebody else may have advanced, so this mode reads the
#                remote and never writes to it. It also never names the default
#                branch.
#
# WHERE THE WORKTREE GOES. `<work_root>/<projectName>-<sanitized branch>`,
# derived by the shared library rather than assembled here — the SAME
# derivation the generated permission profile's sibling-worktree glob is
# materialized from, so a working copy this creates is one an unattended run's
# profile matches. The optional second argument overrides the directory, and an
# override is for a person: a path outside that derivation is not what the
# profile matches, so an unattended run passes none.
#
# WHY `set -e` IS RIGHT HERE, AND NOWHERE ELSE IN THIS SET. Every other script
# written into the scripts directory runs `set -uo pipefail` without `-e`,
# because a wrapper or a long-lived watcher that exits on the first non-zero
# probe stops doing its job. This one is a short, strictly ordered sequence in
# which every step is a precondition of the next: bootstrapping a half-created
# worktree, or pushing a branch whose dependency install failed, is worse than
# stopping. So a failing step aborts the script with that step's own status —
# and the worktree it had already created is LEFT IN PLACE for inspection,
# because removing a working copy is a decision this script does not get to
# make silently.
#
# FAIL CLOSED ON A CONFIGURATION IT CANNOT READ. The directory name, the default
# branch and the bootstrap path all come from `harness.config.json` at run time,
# through `lib/harness-run-lib.sh`, and none of them has a remembered fallback:
# a guessed default branch would branch a run off the wrong history, and a
# guessed directory would create a working copy the permission profile does not
# match. An unreadable or absent configuration is therefore a refusal that
# creates nothing.
#
# WHAT IT NEVER DOES. It never pushes in `--existing` mode. It never deletes,
# empties, reuses or moves an existing directory, and never passes a force flag
# to `git worktree add`. It never checks out a branch that is already checked
# out somewhere — it names that working copy and refuses, because git would
# refuse anyway and a bare git error does not say what to do about it. It is run
# by the watcher or by a person, not by a dispatched agent, so it has no entry
# in the generated permission profile — a CALLING CONVENTION, NOT A GATE: its
# basename is not on the script-allowlist guard's `DENY_SCRIPT_BASENAMES`, and
# that guard grants independently of the profile, so an agent invoking this path
# under `scriptsDir` is auto-allowed today — but only in a PLAIN invocation:
# that guard's construct scan withholds the allow, silently, from any command
# carrying `$(…)` (a branch name taken from `$(git rev-parse …)`, say), a
# backtick, `|`, `<`, a braced form other than a bare `${IDENT}`, or a `>` that
# is neither a descriptor duplication (`2>&1`, `>&2`, `2>&-`) nor a redirection
# to the literal `/dev/null`.
#
# Usage: create-worktree.sh [--existing] <branch-name> [worktree-dir]
#   --existing     check out an existing branch instead of creating a new one
#   <branch-name>  the branch to run on
#   [worktree-dir] optional override; relative paths resolve against $PWD
#
# Exit map a caller can switch on:
#
#   0  the worktree is ready (and, in default mode, the branch was pushed)
#   1  usage error / the library or the configuration could not be read
#   2  refusal — nothing was created: `--existing` and the branch is nowhere;
#      the branch is already checked out in another working copy (which is
#      named); or default mode with no `origin` remote, or no
#      `origin/<default branch>` to branch from
#   4  the working copy was created but could not be bootstrapped — it has no
#      dependency install and no pre-push backstop, is LEFT IN PLACE for
#      inspection, and in default mode the branch was NOT pushed, because this
#      exit precedes the push step. In default mode the local
#      `refs/heads/<branch>` that `worktree add -b` created is left behind WITH
#      the directory and is NOT deleted by `git worktree remove`, so `4` denotes
#      two artefacts and a re-run that clears only the first refuses with git's
#      own `a branch named … already exists`. What buys the reach is exiting
#      NON-ZERO at all — the watcher branches on that at each of its three call
#      sites, logs a `create-worktree.sh … failed for '<branch>'` line and
#      archives the drop, which a line on stderr never reached. The distinct
#      status is for a caller that wants to tell an un-bootstrapped working copy
#      apart from a refusal that created nothing; no shipped caller does that yet
#   *  any other status is the failing `git` or bootstrap step's own (`set -e`);
#      the worktree may exist and be un-bootstrapped. Kept deliberately broad
#      when the remote cases moved up to 2: the remote is the common cause, not
#      the only one, and every other step still surfaces as git's own status
#
# REPRO — reproduce any decision by hand, against a throwaway fixture:
#
#   w=$(mktemp -d); b="$w/origin.git"; git init -q --bare "$b"
#   d="$w/demo"; git init -q -b trunk "$d"; git -C "$d" remote add origin "$b"
#   printf '%s' '{"version":1,"projectName":"demo","defaultBranch":"trunk","stateDir":"sdlc-harness/","layers":[],"commands":{"depInstall":"printf x > deps.marker"}}' > "$d/harness.config.json"
#   mkdir -p "$d/scripts/lib"   # copy this script + setup-worktree.sh + lib/ there
#   git -C "$d" add -A && git -C "$d" commit -qm seed && git -C "$d" push -q -u origin trunk
#
#   new branch     bash "$d/scripts/create-worktree.sh" feat/x
#                  -> "$w/demo-feat-x" on feat/x, bootstrapped, and `git -C "$b"
#                     branch` now lists feat/x
#   already there  bash "$d/scripts/create-worktree.sh" --existing feat/x
#                  -> exit 2 naming "$w/demo-feat-x"; nothing created
#   recreate       git -C "$d" worktree remove "$w/demo-feat-x"
#                  bash "$d/scripts/create-worktree.sh" --existing feat/x
#                  -> re-created from origin/feat/x, and "$b" is UNCHANGED
#   no remote      git -C "$d" remote remove origin
#                  bash "$d/scripts/create-worktree.sh" feat/y
#                  -> exit 2 naming the missing remote; nothing created
#                  (git -C "$d" remote add origin "$b" restores the fixture)
#   no base ref    git -C "$b" update-ref -d refs/heads/trunk
#                  git -C "$d" update-ref -d refs/remotes/origin/trunk
#                  bash "$d/scripts/create-worktree.sh" feat/y
#                  -> exit 2 naming origin/trunk; the failed fetch is tolerated
#                     and the absent ref is what refuses
#                  (git -C "$d" push -q origin trunk restores the fixture)
#   no bootstrap   # drop it from the COMMITTED tree only, so the copy this
#                  # script runs from stays on disk — `--cached` is the point
#                  git -C "$d" rm -qr --cached scripts
#                  git -C "$d" commit -qm drop && git -C "$d" push -q origin trunk
#                  bash "$d/scripts/create-worktree.sh" feat/z
#                  -> exit 4 naming the path(s) tried; "$w/demo-feat-z" EXISTS,
#                     un-bootstrapped (no deps.marker), and `git -C "$b" branch`
#                     does NOT list feat/z
#                  (git -C "$d" add scripts, commit and push restores the
#                   fixture; clear BOTH artefacts first — git -C "$d" worktree
#                   remove "$w/demo-feat-z" && git -C "$d" branch -D feat/z —
#                   because `worktree remove` does not delete the local branch
#                   `add -b` made, and re-running without the second command
#                   exits on `a branch named 'feat/z' already exists`)
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
  echo "  usage: create-worktree.sh [--existing] <branch-name> [worktree-dir]" >&2
}

existing=0
if [ "${1:-}" = "--existing" ]; then
  existing=1
  shift
fi

if [ "$#" -lt 1 ] || [ -z "${1:-}" ]; then
  echo "create-worktree.sh: no branch name given" >&2
  usage
  exit 1
fi
branch="$1"
shift

override="${1:-}"
if [ "$#" -gt 1 ]; then
  echo "create-worktree.sh: unexpected extra arguments after the worktree directory" >&2
  usage
  exit 1
fi

# --- Anchors. Derived, never remembered: this script may be running in the main
# checkout or in any sibling working copy of the same repository. `pwd -P` rather
# than `pwd`, because `top` below is git's own physical toplevel and the two are
# subtracted from each other at the bootstrap resolution: a logical path taken
# through a symlinked ancestor would not strip, and the difference would be
# spelled as an absolute path inside the new working copy. (`hr_lib` above keeps
# a plain `pwd` — it only builds a path to source and never subtracts.)
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
top="$(hr_repo_root "$script_dir")" || top=""
if [ -z "$top" ]; then
  echo "create-worktree.sh: '$script_dir' is not inside a git repository — refusing" >&2
  exit 1
fi

# This script's own repo-relative directory — the bootstrap resolution's second
# spelling. Subtracted once, here, and refused if the strip did not land: an
# unstripped result is still absolute, and joining it to the new working copy
# would produce a path that concatenates two absolute ones rather than fail.
# Refused BEFORE anything is created, because the derivation is knowable now.
if [ "$script_dir" = "$top" ]; then
  script_dir_rel="."   # a `scriptsDir` of "." — the toplevel is not its own prefix
else
  script_dir_rel="${script_dir#"$top"/}"
fi
case "$script_dir_rel" in
  /*)
    echo "create-worktree.sh: '$script_dir' is not under '$top' — cannot derive this checkout's repo-relative scripts path, refusing" >&2
    exit 1
    ;;
esac

# Every configured value is read from the MAIN checkout: it is where `init` ran,
# so its `projectName` is the stem the permission profile's worktree glob was
# materialized from, and its `defaultBranch` is the one the flow branches off.
# Reading them from a feature branch's own copy would let a branch move where
# the next run's working copy lands.
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

if [ -n "$override" ]; then
  # `git -C <repo>` would resolve a relative path against the repository, not
  # against the caller's directory; anchor it where the caller meant it.
  case "$override" in
    /*) worktree_dir="$override" ;;
    *) worktree_dir="$PWD/$override" ;;
  esac
else
  worktree_dir="$(hr_worktree_dir "$main_repo" "$branch")" || worktree_dir=""
  if [ -z "$worktree_dir" ]; then
    echo "create-worktree.sh: could not derive the worktree directory for '$branch' — refusing" >&2
    exit 1
  fi
fi

if [ "$existing" -eq 1 ]; then
  # Existing-branch mode: tolerate a failed fetch (offline) iff the local branch
  # already exists; otherwise the branch must be on the remote.
  fetch_ok=1
  git -C "$main_repo" fetch origin "$branch" || fetch_ok=0
  if ! git -C "$main_repo" show-ref --verify --quiet "refs/heads/$branch"; then
    if [ "$fetch_ok" -ne 1 ] || ! git -C "$main_repo" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
      echo "create-worktree.sh: branch '$branch' is not local and not on origin — cannot check out an existing branch" >&2
      exit 2
    fi
  fi

  # A branch can only be checked out in ONE working copy. If it already is —
  # typically in the main checkout after a supervised session — `worktree add`
  # would fail with a message that does not say what to do, so detect it first
  # and name the checkout. The porcelain list is parsed without splitting on
  # whitespace, because a working copy's path may contain spaces.
  existing_wt=""
  wt_list="$(git -C "$main_repo" worktree list --porcelain)" || wt_list=""
  current=""
  while IFS= read -r line; do
    case "$line" in
      "worktree "*) current="${line#worktree }" ;;
      "branch refs/heads/$branch")
        existing_wt="$current"
        break
        ;;
    esac
  done <<EOF
$wt_list
EOF
  if [ -n "$existing_wt" ]; then
    echo "create-worktree.sh: branch '$branch' is already checked out at $existing_wt — refusing" >&2
    echo "  switch that checkout to another branch (or run there instead) and retry" >&2
    exit 2
  fi

  # No `-b`: this checks out the existing local branch, or DWIM-creates a local
  # branch tracking origin/<branch> when only the remote ref exists.
  git -C "$main_repo" worktree add "$worktree_dir" "$branch"
else
  default_branch="$(hr_default_branch "$main_repo")" || default_branch=""
  if [ -z "$default_branch" ]; then
    echo "create-worktree.sh: no defaultBranch in '$main_repo/harness.config.json' — refusing" >&2
    exit 1
  fi
  # The working copy is branched FROM `origin/<default branch>`, so the remote
  # is a precondition and not a step. Refuse both states `doctor`'s `remote`
  # check grades, in this script's own voice: unguarded, `set -e` would end the
  # run at four lines of git naming neither this script, nor a remedy, nor the
  # check that would have said so first.
  if ! git -C "$main_repo" remote get-url origin >/dev/null 2>&1; then
    echo "create-worktree.sh: '$main_repo' has no 'origin' remote — a working copy is created from origin/$default_branch, so there is nothing to branch from" >&2
    echo "  add one: git remote add origin <url> && git push -u origin $default_branch" >&2
    echo "  (\`npx autonomous-sdlc-harness doctor\` reports this as a failing \`remote\` check)" >&2
    exit 2
  fi
  # Tolerate a failed fetch the way the `--existing` arm above does — offline,
  # with the ref already present, is still a working copy this can create — and
  # judge the ref the next line names rather than the fetch. git's own fetch
  # stderr still reaches the log above whichever outcome follows.
  git -C "$main_repo" fetch origin "$default_branch" || true
  if ! git -C "$main_repo" show-ref --verify --quiet "refs/remotes/origin/$default_branch"; then
    echo "create-worktree.sh: '$main_repo' has an 'origin' remote but no origin/$default_branch to branch from" >&2
    echo "  push the default branch: git push -u origin $default_branch" >&2
    echo "  (\`npx autonomous-sdlc-harness doctor\` reports this as a failing \`remote\` check)" >&2
    exit 2
  fi
  git -C "$main_repo" worktree add -b "$branch" "$worktree_dir" "origin/$default_branch"
fi

# --- Bootstrap by running the NEW checkout's own setup-worktree.sh, which is
# the single source for what bootstrapping means (it also installs the
# worktree-scoped pre-push backstop). Its scripts directory is read from the new
# checkout's configuration, falling back to this script's own repo-relative path
# when that configuration is unreadable; the resolution is then judged on the
# BOOTSTRAP PATH, and an unreadable one is retried once at this script's own
# repo-relative path.
#
# WHAT THE RETRY COVERS, AND WHAT IT DOES NOT. It covers a working copy whose
# configuration names a DIFFERENT `scriptsDir` than this checkout's — the only
# case in which the two spellings differ at all. It does NOT rescue a working
# copy that carries no scripts directory: both spellings then resolve inside the
# same absent tree, and that case is the refusal below, not a skip. The origin
# checkout's own copy is not run instead — setup-worktree.sh anchors on its own
# location and takes no arguments, so running it would bootstrap THIS checkout
# rather than the new one.
scripts_rel="$(hr_scripts_dir "$worktree_dir")" || scripts_rel=""
if [ -z "$scripts_rel" ]; then
  scripts_rel="$script_dir_rel"
fi
bootstrap="$worktree_dir/$scripts_rel/setup-worktree.sh"
bootstrap_retry="$worktree_dir/$script_dir_rel/setup-worktree.sh"
if [ -r "$bootstrap" ]; then
  bash "$bootstrap"
elif [ -r "$bootstrap_retry" ]; then
  bash "$bootstrap_retry"
else
  # LOUD, NOT A SKIPPED LINE ON stderr. An un-bootstrapped working copy cannot
  # satisfy any commit gate, and a warning here reaches no operator; a non-zero
  # status reaches the watcher log, which is what a caller acts on.
  echo "create-worktree.sh: no bootstrap script at '$bootstrap'" >&2
  if [ "$bootstrap_retry" != "$bootstrap" ]; then
    echo "  nor at '$bootstrap_retry' (this checkout's own repo-relative path)" >&2
  fi
  echo "  the working copy at $worktree_dir was created but NOT bootstrapped: no dependency install, so it cannot satisfy any commit gate, and no pre-push backstop" >&2
  echo "  it is left in place for inspection, and this exit precedes the push step, so in default mode '$branch' was not pushed" >&2
  echo "  commit a scripts directory carrying setup-worktree.sh (and its lib/) on the base this copy was cut from, then clear BOTH things this exit left behind before re-creating: 'git -C $main_repo worktree remove $worktree_dir' and, in default mode, 'git -C $main_repo branch -D $branch' — the copy was created with 'worktree add -b', so the local branch outlives the directory and 'worktree remove' does not delete it; a re-run that skips the second command refuses with git's own \"a branch named '$branch' already exists\"" >&2
  exit 4
fi

if [ "$existing" -eq 1 ]; then
  echo "create-worktree.sh: worktree ready at $worktree_dir"
  echo "create-worktree.sh: branch $branch (existing branch; not pushed)"
else
  git -C "$worktree_dir" push -u origin "$branch"
  echo "create-worktree.sh: worktree ready at $worktree_dir"
  echo "create-worktree.sh: branch $branch (pushed to origin)"
fi
exit 0
