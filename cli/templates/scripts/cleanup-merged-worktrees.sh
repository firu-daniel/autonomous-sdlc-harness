#!/usr/bin/env bash
# cleanup-merged-worktrees.sh — housekeeping: remove the sibling working copy and
# the local branch of a run whose pull request was merged and whose remote branch
# was then deleted.
#
# THE TRIGGER IS AN UPSTREAM THAT IS GONE. After `git fetch --prune`, git marks a
# local branch whose remote counterpart no longer exists as `[gone]` — visible as
# `git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads/`.
# That is exactly the merge-the-pull-request-then-delete-the-remote-branch flow,
# so it is the signal this sweep acts on, and it is the only one. For each such
# branch it
#
#   1. removes the run copy its run-registry record names (`worktree`), by the
#      record's `copy_kind`: a clone through `hr_clone_remove_var`, a record
#      with no `copy_kind` — a legacy linked worktree — through `git worktree
#      remove --force`; only when it is that branch's OWN copy (below). A
#      failure is reported and the sweep continues, because a directory left
#      behind is a smaller problem than a sweep that stops half-way through
#      the set. No record, or no `worktree` in it, is no copy to remove; a
#      `worktree` naming a path that no longer exists is reported as already
#      gone. Then it
#   2. deletes that run's per-run profile — `hr_run_profile_file "$slug"
#      "$branch"`, i.e. `${XDG_STATE_HOME:-$HOME/.local/state}/
#      autonomous-sdlc-harness/run-profiles/<slug>/<sanitized branch>.json`,
#      with `slug` from `hr_repo_slug "$main_repo"` (never the inherited
#      `HARNESS_REPO_SLUG`, which this sweep does not read: in job mode the
#      watcher sets it to the remote slug). No glob, no hand-built path. Three
#      gates, all of them: this sweep removed the run's copy in step 1 (a
#      refusal, a skip, a failed removal, an already-gone `worktree` or no
#      record removes no profile); the path is the one the watcher writes; and
#      no record in a live status maps to that same file — the registry is
#      re-read just before the `rm`, and a second branch `hr_sanitize_branch`
#      folds onto the same name keeps it too. Leftovers from earlier releases
#      are not migrated: `docs/watcher.md` → `### The per-run profile`. Then it
#   3. force-deletes the local branch (`git branch -D`),
#
# and then runs `git worktree prune` to drop the administrative records of
# linked worktrees whose directories are already gone.
#
# THE COPY IS FOUND IN THE REGISTRY, NEVER IN `git worktree list`: a clone is
# not listed there. Both layouts are swept until no worktree run is left.
#
# WHERE IT RUNS. In the MAIN checkout, always — that is where every working copy
# and every branch of this repository is administered, and where the run registry
# and the configuration live. The script derives that anchor rather than assuming
# it, so it behaves identically whether it is started from the main checkout or
# from a sibling working copy that is about to be swept away.
#
# THE THREE REFUSALS. It never touches
#
#   * a PROTECTED branch — the set resolved at run time from this repository's
#     `harness.config.json` (`protectedBranches`, or that key's schema default,
#     unioned with `defaultBranch`), through lib/harness-run-lib.sh. There is no
#     list of branch names in this file: one written here would delete branches
#     an adopter had protected, the moment their configuration named anything
#     else;
#   * the branch the MAIN checkout itself has checked out, nor the main
#     checkout's own directory;
#   * a branch with an ACTIVE RUN — one whose record in the run registry
#     (`<state_dir>/autonomous_logs/registry.json`, shaped
#     `{"runs": {"<branch>": {"status": …}}}`) is in one of THE LIVE STATUSES:
#     `running`, `parked`, `park_loop` or `paused`. They are what
#     `autonomous-watcher.sh` → `process_inbox_file` treats as owning a run
#     copy: it refuses a fresh launch over a `parked`, `paused` or `park_loop`
#     record and over a `running` one with a live pid. `live_runs` is their one
#     list. A parked run is waiting for a clarification answer, a `park_loop`
#     one for an operator to clear it, and a paused one for a RESUME sentinel,
#     and `worktree remove --force` would discard the pause note the resumed
#     engine is pointed at.
#
# ONLY THE BRANCH'S OWN WORKING COPY IS REMOVED, by either arm.
#
#   * A CLONE is removed only when `hr_clone_remove_var` accepts it: exactly one
#     registry record has `copy_kind` `clone` and a `worktree` canonically that
#     directory, and the directory is `hr_worktree_dir` for that record's
#     branch. Its reason is `HR_CLONE_REFUSAL`.
#   * A LEGACY WORKTREE's directory is backed by records a sandboxed run can
#     write: a rewritten `<main>/.git/worktrees/<name>/gitdir` names any
#     directory, and a rewritten record `HEAD` makes a live run's copy read as
#     the gone branch's. So it is removed only when it passes
#     `hr_wrapper_target_check_var` against the main checkout this script's own
#     location gives (`hr_wrapper_main_of`), AND equals `hr_worktree_dir
#     "$main_repo" "$branch"` canonically.
#   * Any other `copy_kind` is refused: it names no arm this sweep has.
#
# A refusal is one line — `skip removing <dir> for '<branch>' — it is not that
# branch's working copy as this repository derives it (<reason>)`,
# `[dry-run] would skip …` under --dry-run — and the branch deletion still
# follows. A script that cannot be
# placed in a main checkout, or whose placement differs from `worktree list`'s,
# removes nothing: one line, exit 0. The inherited `GIT_*` environment is dropped
# before the first git call (`hr_git_env_drop`).
#
# CAVEAT: `: gone` + force-delete also catches an ABANDONED branch whose remote
# was deleted WITHOUT merging — its unmerged local commits would be lost. For a
# strict merge-then-delete-remote flow this is a non-issue. Use --dry-run to
# preview.
#
# `--dry-run` IS THE PREVIEW, AND IT DELETES NOTHING. It runs the same decision
# for both arms and reports the branch (and the copy) each would remove, or the
# skip line each would print; for each copy it would remove it makes step 2's
# decision and prints `[dry-run] would remove run profile <file> for
# '<branch>'` (or the keep line). No branch is deleted, no copy or profile
# removed, and it does not even `worktree prune`. The clone arm's would-decision applies
# `hr_clone_remove_var`'s refusal conditions — the registry match and the
# derived path — without calling it. It is NOT read-only: the
# `fetch --prune` that establishes which upstreams are gone runs first either
# way, so remote-tracking refs for deleted upstreams are removed and FETCH_HEAD
# is written. Preview the decisions, not the repository's ref state.
#
# FAIL CLOSED, AND HERE THAT MEANS DELETING NOTHING. This is the most destructive
# script in the set — `git branch -D` and `git worktree remove --force` are not
# recoverable from this side — so every input it cannot resolve ends the run
# instead of being worked around:
#
#   * the shared library, or `<repo_root>/harness.config.json`, cannot be read
#     (absent, unreadable, invalid JSON, more than one document, no
#     `defaultBranch`, or `jq` missing or older than 1.5) — it cannot prove any
#     branch is unprotected;
#   * the registry file is present and cannot be read as a registry (unreadable,
#     invalid JSON, or no `.runs` wrapper) — it cannot prove any branch is idle.
#     A registry that is simply ABSENT is a different answer and not an error: a
#     repository the watcher has never run in has no registry, and no active run
#     either. But a registry that is there in a shape this cannot enumerate is
#     refused rather than read as "nothing is running", because that misreading
#     is a deleted branch with a run still writing to it;
#   * the protected-branch answer for a specific branch comes back unresolvable
#     mid-sweep.
#
# Each of those prints one line and exits 0 having deleted nothing. Exit 0
# because this sweep is housekeeping invoked from a loop that must keep running,
# and a refusal is a successful refusal.
#
# WHO RUNS IT. The watcher, on its own schedule, and a person by hand. NEVER a
# dispatched agent: the script-allowlist guard withholds the permit rather than
# granting one (its basename is on that guard's deny list, and being on it means
# the guard stays silent), and the generated permission profile emits no rule for
# this script either — so an agent that tries to run it is refused, never
# permitted. Nothing about that is negotiable — an agent asked to
# change one file has no business deleting branches.
#
# Usage: cleanup-merged-worktrees.sh [--dry-run]
#   --dry-run   report what would be removed; remove nothing
#
# Environment:
#   HARNESS_FETCH_TIMEOUT   seconds to allow the `fetch --prune` before it is
#                           killed and the round skipped (default 60, clamped to
#                           1..3600; anything else falls back to the default).
#                           The bound exists because this sweep runs inside the
#                           watcher's loop — see the paragraph on it below.
#
# Exit map a caller can switch on:
#
#   0  the sweep ran, or refused and deleted nothing (the message says which)
#   1  usage error — an unrecognized or extra argument. Nothing was read and
#      nothing was deleted; in particular a misspelled `--dry-run` is refused
#      here rather than silently becoming a real sweep
#
# REPRO — reproduce any decision by hand, against a throwaway fixture. The
# clone is made by `hr_clone_create_var`, which records it in the registry:
#
#   export XDG_STATE_HOME=$(mktemp -d)
#   w=$(mktemp -d); b="$w/origin.git"; git init -q --bare "$b"
#   d="$w/demo"; git init -q -b trunk "$d"; git -C "$d" remote add origin "$b"
#   printf '%s' '{"version":1,"projectName":"demo","defaultBranch":"trunk","protectedBranches":["trunk","release/*"],"stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$d/harness.config.json"
#   mkdir -p "$d/scripts/lib"   # copy this script + lib/ there
#   git -C "$d" add -A && git -C "$d" commit -qm seed
#   git -C "$d" push -q -u origin trunk
#   for r in feat_gone feat_old feat_live release/1.0; do git -C "$d" branch "$r"; \
#     git -C "$d" push -q -u origin "$r"; done
#   mkdir -p "$d/sdlc-harness/autonomous_logs"
#   bash -c '. "$1/scripts/lib/harness-run-lib.sh"
#     hr_clone_create_var "$1" feat_gone trunk || echo "$HR_CLONE_REFUSAL"' _ "$d"
#   bash -c '. "$1/scripts/lib/harness-run-lib.sh"; r=$(hr_state_path "$1" \
#     autonomous_logs/registry.json); p=$(hr_worktree_dir "$1" feat_old)
#     git -C "$1" worktree add -q "$p" feat_old
#     hr_registry_set "$r" feat_old worktree "$p"' _ "$d"   # legacy: no copy_kind
#   for r in feat_gone feat_old release/1.0; do git -C "$b" branch -q -D "$r"; done
#
#   profile       before the preview, plant feat_gone's per-run profile:
#                 bash -c '. "$1/scripts/lib/harness-run-lib.sh"
#                   f=$(hr_run_profile_file "$(hr_repo_slug "$1")" feat_gone)
#                   mkdir -p "${f%/*}" && printf "{}" > "$f"' _ "$d"
#                 -> `$XDG_STATE_HOME/autonomous-sdlc-harness/run-profiles/
#                    <slug>/feat_gone.json`; the preview names it, the sweep
#                    removes it
#   preview       bash "$d/scripts/cleanup-merged-worktrees.sh" --dry-run
#                 -> `would delete branch … and remove clone "$w/demo-feat_gone"`
#                    then `[dry-run] would remove run profile <file> for
#                    'feat_gone'`, and `… and remove worktree "$w/demo-feat_old"`;
#                    `git -C "$d" branch` is unchanged and both copies and the
#                    profile are still there
#   sweep         bash "$d/scripts/cleanup-merged-worktrees.sh"
#                 -> the clone "$w/demo-feat_gone" and the legacy worktree
#                    "$w/demo-feat_old" removed, `removed run profile <file> for
#                    'feat_gone'` between feat_gone's `removed clone` and
#                    `deleted merged branch` lines and the file gone, feat_gone
#                    and feat_old deleted; feat_live untouched (its upstream is
#                    not gone) and release/1.0 untouched (protected, though it
#                    IS gone)
#   active run    before the sweep, set feat_gone's status:
#                 bash -c '. "$1/scripts/lib/harness-run-lib.sh"
#                   hr_registry_set "$(hr_state_path "$1" \
#                   autonomous_logs/registry.json)" feat_gone status running' _ "$d"
#                 -> the skip line for feat_gone; its clone, branch and planted
#                    profile are untouched (same with "parked", "park_loop" and
#                    "paused")
#   unresolvable  printf 'x' > "$d/harness.config.json"
#                 -> one line, exit 0, nothing deleted
#   offline       git -C "$d" remote set-url origin /nonexistent.git
#                 -> the fetch message, exit 0, nothing deleted

set -uo pipefail

# The library is reached by a path computed from this script's own location — no
# session root and no runtime-substituted token is assumed. Not finding it is a
# refusal: without it there is no protected set to check a branch against.
hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "cleanup-merged-worktrees.sh: cannot read '$hr_lib' — refusing to delete anything"
  exit 0
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"
hr_git_env_drop

dry_run=0
case "${1:-}" in
  --dry-run)
    dry_run=1
    shift
    ;;
  '') ;;
  *)
    echo "cleanup-merged-worktrees.sh: unrecognized argument '$1'" >&2
    echo "  usage: cleanup-merged-worktrees.sh [--dry-run]" >&2
    exit 1
    ;;
esac
if [ "$#" -gt 0 ]; then
  echo "cleanup-merged-worktrees.sh: unexpected extra arguments" >&2
  echo "  usage: cleanup-merged-worktrees.sh [--dry-run]" >&2
  exit 1
fi

# --- Anchors. Derived, never remembered: this copy of the script may be sitting
# in the main checkout or in a sibling working copy of the same repository.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
top="$(hr_repo_root "$script_dir")" || top=""
if [ -z "$top" ]; then
  echo "cleanup-merged-worktrees.sh: '$script_dir' is not inside a git repository — refusing to delete anything"
  exit 0
fi

# The sweep administers working copies and branches, so it runs in the MAIN
# checkout. Unlike its siblings this one does NOT fall back to the checkout it
# was started from: if the main-checkout probe does not answer, the registry and
# branch enumeration below cannot be trusted either, and the closed outcome is
# to stop.
main_repo="$(hr_main_repo "$top")" || main_repo=""
if [ -z "$main_repo" ]; then
  echo "cleanup-merged-worktrees.sh: could not determine the main checkout of '$top' — refusing to delete anything"
  exit 0
fi

# The anchor the removal guard checks a working copy against: the main checkout
# this script's own location gives, without asking git. It must be the one
# `worktree list` named, or neither can be trusted.
main_top="$(hr_wrapper_main_of "$script_dir")" || main_top=""
main_canon="$( CDPATH= cd -P -- "$main_repo" 2>/dev/null && pwd -P )" || main_canon=""
if [ -z "$main_top" ] || [ "$main_top" != "$main_canon" ]; then
  echo "cleanup-merged-worktrees.sh: cannot place this script in a main checkout — removing no working copy"
  exit 0
fi

# Warm the library's per-process cache once, unsubstituted, and make the
# fail-closed decision here rather than letting each reader fail separately.
cfg_status=0
hr_config_load "$main_repo" || cfg_status=$?
if [ "$cfg_status" -ne 0 ]; then
  echo "cleanup-merged-worktrees.sh: cannot resolve '$main_repo/harness.config.json' — refusing to delete anything"
  echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)"
  exit 0
fi

# The repository slug the per-run profile path is keyed on, derived here. The
# inherited `HARNESS_REPO_SLUG` is never read: in job mode the watcher sets it
# to the remote slug. Empty makes `profile_remove` remove nothing.
slug="$(hr_repo_slug "$main_repo")" || slug=""

# --- The active-run set. A HARD PRECONDITION, not a best-effort read: the
# question it answers is whether a branch about to be force-deleted has a run
# writing to it.
registry="$(hr_state_path "$main_repo" autonomous_logs/registry.json)" || registry=""
if [ -z "$registry" ]; then
  echo "cleanup-merged-worktrees.sh: could not derive the run registry path — refusing to delete anything"
  exit 0
fi

# live_runs <registry> — print the branch of every record in a live status, one
# per line. The one list of the live statuses: the start-of-sweep read and
# `profile_remove`'s re-check both call it. An absent registry prints nothing
# and returns 0. Enumerated through the `.runs` wrapper the whole flow writes
# and reads, so a present document without it — or one that cannot be read —
# makes `jq` fail and this return non-zero: reading such a file as "no live
# runs" would delete a branch, or a profile, a run is still using.
live_runs() {
  [ -e "${1-}" ] || return 0
  jq -r '.runs | to_entries[] | select(.value.status == "running" or .value.status == "parked" or .value.status == "park_loop" or .value.status == "paused") | .key' "$1" 2>/dev/null
}

active=""
if [ -e "$registry" ]; then
  if [ ! -r "$registry" ]; then
    echo "cleanup-merged-worktrees.sh: '$registry' is not readable — refusing to delete anything"
    exit 0
  fi
  if ! active="$(live_runs "$registry")"; then
    echo "cleanup-merged-worktrees.sh: '$registry' could not be read as a run registry — refusing to delete anything"
    exit 0
  fi
fi

# --dry-run's clone arm counts the clone records naming a directory, as
# `hr_clone_remove_var` does, from this one enumeration: `<branch><TAB><worktree>`
# per record with `copy_kind` `clone`, both `@tsv`-escaped.
clones=""
if [ "$dry_run" -eq 1 ] && [ -e "$registry" ]; then
  if ! clones="$(jq -r '.runs | to_entries[]
      | select((.value | type) == "object" and .value.copy_kind == "clone" and (.value.worktree | type) == "string")
      | [.key, .value.worktree] | @tsv' "$registry" 2>/dev/null)"; then
    echo "cleanup-merged-worktrees.sh: '$registry' could not be read as a run registry — refusing to delete anything"
    exit 0
  fi
fi

# Run one command with a WALL-CLOCK CEILING, and report a timeout as 124 the way
# GNU `timeout` does. Written out here rather than taken from `timeout`, which is
# not on a stock macOS, nor from lib/harness-run-lib.sh, which an adopter's
# `scriptsDir` may be carrying at an older revision than this file — a sweep that
# dies on an unbound function is a worse failure than the hang it closes.
#
# The command runs in the BACKGROUND and is polled, because `wait` alone cannot be
# bounded in POSIX shell. On expiry the child gets a TERM, then a KILL two seconds
# later if it is still there, so it is asked before it is forced.
#
# THE SIGNAL GOES TO THE PROCESS GROUP, NOT THE CHILD — `kill -TERM -$pid`, with
# the negative pid — and `set -m` is what makes that possible, by giving the
# background job a process group of its own whose id is that pid. Signalling the
# child alone is not enough and was measured not to be: `git fetch` spawns the
# transport (`ssh`, `git-remote-https`) as its own child, and that grandchild
# INHERITS THIS SCRIPT'S STDOUT. Kill only git and the transport survives, holding
# the write end of the pipe the watcher is reading, so the watcher blocks on a
# sweep that already printed its verdict — the original hang, moved rather than
# closed. Against a fetch stalled for 3 seconds under a 3-second ceiling, the
# child-only version returned its message on time and did not let the script exit
# for 144 seconds; the group kill ends it in the 2 the escalation costs.
#
# Job control is restored to whatever it was, since a script that leaves `-m` on
# behind it changes how every later background command here reports.
#
# run_bounded <seconds> <command> [args…]
# NOT GROUPED WHEN A PERSON IS WATCHING. `set -m` puts the child in a process
# group that is not the terminal's foreground one, so a child that reads the
# CONTROLLING TERMINAL is stopped with SIGTTIN instead of being answered — and
# `ssh` reads a key passphrase from `/dev/tty` directly, which `GIT_TERMINAL_PROMPT=0`
# does not cover because it is not git asking. `kill -0` keeps succeeding on a
# stopped process, so a by-hand sweep on a passphrase-protected key would burn the
# whole ceiling and report a network failure that never happened. The header's
# "WHO RUNS IT" names a person by hand as a supported caller, so that path keeps
# the child in this script's own group and signals the child alone: the pipe a
# surviving transport could hold is a terminal the person is looking at, and they
# can end it themselves. The watcher is daemonised with no controlling terminal,
# so it takes the grouped path, which is the one the orphaned-transport hang
# needed.
run_bounded() {
  local limit="$1" pid waited=0 job_control=0 grouped=1
  shift
  if { : > /dev/tty; } 2>/dev/null; then grouped=0; fi
  case "$-" in *m*) job_control=1 ;; esac
  [ "$grouped" -eq 1 ] && set -m
  "$@" &
  pid=$!
  [ "$job_control" -eq 1 ] || set +m
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$limit" ]; then
      if [ "$grouped" -eq 1 ]; then
        kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || :
        sleep 2
        # Only while the group is still there. Once it is gone the negative form
        # fails, and retrying the bare pid would aim an unconditional SIGKILL at a
        # number the kernel may already have handed to somebody else.
        kill -0 "-$pid" 2>/dev/null && { kill -KILL "-$pid" 2>/dev/null || :; }
      else
        kill -TERM "$pid" 2>/dev/null || :
        sleep 2
        kill -0 "$pid" 2>/dev/null && { kill -KILL "$pid" 2>/dev/null || :; }
      fi
      wait "$pid" 2>/dev/null || :
      return 124
    fi
    sleep 1
    waited=$((waited + 1))
  done
  wait "$pid"
}

# Refresh remote-tracking refs so a deleted upstream becomes `[gone]`. A failed
# fetch (offline, or an unreachable remote) skips this round rather than sweeping
# on stale tracking information, which would report every branch as gone.
#
# BOUNDED, BECAUSE THIS SWEEP RUNS INSIDE THE WATCHER'S LOOP.
# `autonomous-watcher.sh` calls this script synchronously, so a fetch that HANGS
# rather than fails stalls the whole loop — no inbox pass, no drop picked up,
# nothing written to `watcher.log`, and the watcher still alive and healthy-looking
# in `ps`. The paragraph above anticipated a fetch that FAILS and skips the round;
# a stale TCP connection left behind by a network change or a laptop sleep never
# fails, and an unbounded `git fetch` sits in it indefinitely. The ceiling turns
# that second mode into the first, which this script already handles.
#
# `GIT_TERMINAL_PROMPT=0` closes the other hang of the same shape: a credential
# prompt, on a remote whose authentication has lapsed, blocks on a terminal that
# no unattended run is watching.
#
# SIXTY SECONDS, AND OVERRIDABLE. The default is generous next to a healthy fetch
# of a repository this size and short next to `CLEANUP_INTERVAL_SECS` (300), the
# interval the watcher runs this sweep on, so a hung remote costs a fraction of
# that round rather than the loop. It is NOT short next to `POLL_INTERVAL_SECS`
# (15): a sweep that spends the whole ceiling does hold the loop for it, which is
# the price of bounding the fetch at all and the reason the ceiling is not larger.
# `HARNESS_FETCH_TIMEOUT` raises it for an adopter on a link where 60 s is not
# generous, and lowers it for the test that drives this ceiling.
#
# VALIDATED BY VALUE, NOT BY SHAPE. An earlier form of this clause tested the
# string for non-digits, which let through two values the sentence below calls
# impossible. A 19-digit number is all digits, and `[ "$waited" -ge <huge> ]` does
# not compare false — it ERRORS, and a non-zero status reads as false, so the
# timeout branch never fires and the poll loop runs forever: unbounded, which is
# the one thing this knob must not express. `00` is all digits and is not the
# string `0`, and `[ 0 -ge 00 ]` is true on the first iteration, so every sweep
# kills its own fetch before it starts, blames the network, and never cleans up
# another branch. Comparing the VALUE closes both: `[ ]` returns non-zero for an
# unparsable or out-of-range string as readily as for a number that fails the
# test, and the default is what survives either way. The upper clamp is what keeps
# a fat-fingered value from expressing "wait forever" in seconds.
fetch_timeout="${HARNESS_FETCH_TIMEOUT:-60}"
if ! { [ "$fetch_timeout" -ge 1 ] && [ "$fetch_timeout" -le 3600 ]; } 2>/dev/null; then
  fetch_timeout=60
fi

if ! GIT_TERMINAL_PROMPT=0 run_bounded "$fetch_timeout" git -C "$main_repo" fetch --prune --quiet 2>/dev/null; then
  echo "cleanup-merged-worktrees.sh: fetch --prune failed (offline, unreachable or timed out); skipping this round"
  exit 0
fi

current_branch="$(hr_current_branch "$main_repo")"

# Return 0 when <dir> is <branch>'s own working copy: a worktree the main
# checkout lists by its own records, at the path this repository derives for
# <branch>. Return 1 otherwise, with `guard_reason` set. Call it directly.
own_worktree_check() {
  local branch="${1-}" dir="${2-}" want dir_c want_c
  guard_reason=""
  if ! hr_wrapper_target_check_var "$main_top" "$dir"; then
    guard_reason=$HR_TARGET_REFUSAL
    return 1
  fi
  if ! want="$(hr_worktree_dir "$main_repo" "$branch")"; then
    guard_reason="its derived working copy path could not be computed"
    return 1
  fi
  dir_c="$(hr_canonical_path_nogit "$dir")" || dir_c=""
  want_c="$(hr_canonical_path_nogit "$want")" || want_c=""
  if [ -z "$dir_c" ] || [ "$dir_c" != "$want_c" ]; then
    guard_reason="the derived path is $want"
    return 1
  fi
  return 0
}

# --dry-run's stand-in for `hr_clone_remove_var "$main_repo" <dir>`: the same
# refusal conditions, in the same order and with the same `HR_CLONE_REFUSAL`
# text, removing nothing. Return 0 when that call would remove <dir>. Call it
# directly.
clone_would_remove_var() {
  local dir="${1-}" why main cdir line w wc b branch="" count=0 want
  HR_CLONE_REFUSAL=""
  while :; do
    case "$dir" in
      ?*/) dir=${dir%/} ;;
      *) break ;;
    esac
  done
  why="cannot remove the clone '$dir'"
  if ! main=$(hr_copy_sync_main_of "$main_repo"); then
    HR_CLONE_REFUSAL="$why: '$main_repo' is not a main checkout"
    return 1
  fi
  if [ -z "$dir" ] || [ -L "$dir" ] || [ -L "$dir/.git" ] || [ ! -d "$dir/.git" ]; then
    HR_CLONE_REFUSAL="$why: it or its .git is a symbolic link, or its .git is not a directory"
    return 1
  fi
  if ! cdir=$( CDPATH= cd -P -- "$dir" 2>/dev/null && pwd -P ) || [ "$cdir" = "$main" ]; then
    HR_CLONE_REFUSAL="$why: it is not a directory, or it is the main checkout $main"
    return 1
  fi
  while IFS= read -r line; do
    case "$line" in *"$tab"*) ;; *) continue ;; esac
    hr_tsv_unescape_var "${line#*"$tab"}"
    w=$HR_CFG_VALUE
    wc=$(hr_canonical_path_nogit "$w") || continue
    [ "$wc" = "$cdir" ] || continue
    hr_tsv_unescape_var "${line%%"$tab"*}"
    b=$HR_CFG_VALUE
    count=$((count + 1))
    branch=$b
  done <<EOF
$clones
EOF
  if [ "$count" -ne 1 ]; then
    HR_CLONE_REFUSAL="$why: $count run registry records name a clone at $cdir, not exactly one"
    return 1
  fi
  if ! want=$(hr_worktree_dir "$main" "$branch") || ! want=$(hr_canonical_path_nogit "$want") || [ "$want" != "$cdir" ]; then
    HR_CLONE_REFUSAL="$why: it is not the path hr_worktree_dir derives from $main for the branch '$branch' its record names"
    return 1
  fi
  return 0
}

# Print one skip line for <dir> and <branch> with <reason>, in this run's mode.
say_skip() {
  local line="skip removing ${1-} for '${2-}' — it is not that branch's working copy as this repository derives it (${3-})"
  if [ "$dry_run" -eq 1 ]; then
    echo "cleanup-merged-worktrees.sh: [dry-run] would $line"
  else
    echo "cleanup-merged-worktrees.sh: $line"
  fi
}

# profile_remove <branch> — delete <branch>'s per-run profile, in this run's
# mode. Call it only once <branch>'s copy has been removed (or, under --dry-run,
# would be). The registry is re-read here rather than trusting `active`: a sweep
# run by hand can race a watcher launch, and a live branch whose sanitized name
# folds onto the same file keeps it too. Prints at most one line; never stops
# the sweep.
profile_remove() {
  local branch="${1-}" file live b bfile pre=""
  [ "$dry_run" -eq 1 ] && pre="[dry-run] "
  if [ -z "$slug" ] || ! file="$(hr_run_profile_file "$slug" "$branch")"; then
    echo "cleanup-merged-worktrees.sh: ${pre}no run profile path for '$branch' (no repository slug, a branch hr_run_profile_file refuses, or no machine state directory — XDG_STATE_HOME and HOME both unset) — no profile removed"
    return 0
  fi
  [ -f "$file" ] || [ -L "$file" ] || return 0
  if ! live="$(live_runs "$registry")"; then
    echo "cleanup-merged-worktrees.sh: ${pre}keep run profile $file for '$branch' — the run registry could not be re-read"
    return 0
  fi
  while IFS= read -r b; do
    [ -n "$b" ] || continue
    bfile="$(hr_run_profile_file "$slug" "$b")" || continue
    if [ "$bfile" = "$file" ]; then
      echo "cleanup-merged-worktrees.sh: ${pre}keep run profile $file for '$branch' — the live run '$b' uses that file"
      return 0
    fi
  done <<EOF
$live
EOF
  if [ "$dry_run" -eq 1 ]; then
    echo "cleanup-merged-worktrees.sh: [dry-run] would remove run profile $file for '$branch'"
  elif rm -f -- "$file"; then
    echo "cleanup-merged-worktrees.sh: removed run profile $file for '$branch'"
  else
    echo "cleanup-merged-worktrees.sh: FAILED to remove run profile $file for '$branch' — remove it by hand"
  fi
  return 0
}

# One record per local branch as `<name><TAB><upstream track>`; the tab keeps the
# two apart without splitting on whitespace.
gone_list="$(git -C "$main_repo" for-each-ref --format='%(refname:short)%09%(upstream:track)' refs/heads/ 2>/dev/null)" || gone_list=""

nl="
"
tab=$'\t'
cleaned=0

# Fed by a here-document rather than a pipeline, so `cleaned` is counted in THIS
# shell — a `|` would run the loop in a subshell and the total would always be 0.
while IFS= read -r record; do
  [ -n "$record" ] || continue
  branch="${record%%"$tab"*}"
  track="${record#*"$tab"}"
  [ -n "$branch" ] || continue
  [ "$track" = "[gone]" ] || continue

  hr_branch_is_protected "$main_repo" "$branch"
  protected=$?
  case "$protected" in
    0) continue ;;
    2)
      # The configuration resolved a moment ago, so this is it changing under a
      # running sweep. Stop; do not fall through to a delete.
      echo "cleanup-merged-worktrees.sh: cannot tell whether '$branch' is protected — stopping; nothing further deleted"
      exit 0
      ;;
  esac

  if [ "$branch" = "$current_branch" ]; then
    continue
  fi

  # Newline-delimited membership: the registry enumeration returns one branch per
  # line, so both the haystack and the needle are wrapped in newlines. Matching
  # on spaces instead would only ever recognize the first and last entry.
  case "$nl$active$nl" in
    *"$nl$branch$nl"*)
      echo "cleanup-merged-worktrees.sh: skip '$branch' (active run)"
      continue
      ;;
  esac

  # The run copy, from the branch's registry record. A present-but-unreadable
  # registry was refused above, so a peek's 1 here means no record.
  wt="$(hr_registry_peek "$registry" "$branch" worktree)" || wt=""
  kind=""
  if [ -n "$wt" ]; then
    kind="$(hr_registry_peek "$registry" "$branch" copy_kind)" || kind=""
    if [ ! -e "$wt" ] && [ ! -L "$wt" ]; then
      if [ "$dry_run" -eq 1 ]; then
        echo "cleanup-merged-worktrees.sh: [dry-run] $wt for '$branch' is already gone"
      else
        echo "cleanup-merged-worktrees.sh: $wt for '$branch' is already gone"
      fi
      wt=""
    fi
  fi
  if [ -n "$wt" ]; then
    case "$kind" in
      clone)
        # The real sweep lets `hr_clone_remove_var` decide at removal time.
        if [ "$dry_run" -eq 1 ] && ! clone_would_remove_var "$wt"; then
          say_skip "$wt" "$branch" "$HR_CLONE_REFUSAL"
          wt=""
        fi
        ;;
      '')
        if ! own_worktree_check "$branch" "$wt"; then
          say_skip "$wt" "$branch" "$guard_reason"
          wt=""
        fi
        ;;
      *)
        say_skip "$wt" "$branch" "its record's copy_kind '$kind' names no arm this sweep has"
        wt=""
        ;;
    esac
  fi

  if [ "$dry_run" -eq 1 ]; then
    if [ -n "$wt" ]; then
      if [ "$kind" = clone ]; then
        echo "cleanup-merged-worktrees.sh: [dry-run] would delete branch '$branch' and remove clone $wt"
      else
        echo "cleanup-merged-worktrees.sh: [dry-run] would delete branch '$branch' and remove worktree $wt"
      fi
      profile_remove "$branch"
    else
      echo "cleanup-merged-worktrees.sh: [dry-run] would delete branch '$branch'"
    fi
    continue
  fi

  if [ -n "$wt" ] && [ "$kind" = clone ]; then
    if hr_clone_remove_var "$main_repo" "$wt"; then
      echo "cleanup-merged-worktrees.sh: removed clone $wt"
      profile_remove "$branch"
    else
      say_skip "$wt" "$branch" "$HR_CLONE_REFUSAL"
    fi
  elif [ -n "$wt" ] && [ "$wt" != "$main_repo" ]; then
    # git's own message is captured and reported rather than printed raw, so a
    # failure names the directory a person now has to remove by hand.
    if err="$(git -C "$main_repo" worktree remove --force "$wt" 2>&1 >/dev/null)"; then
      echo "cleanup-merged-worktrees.sh: removed worktree $wt"
      profile_remove "$branch"
    else
      echo "cleanup-merged-worktrees.sh: FAILED to remove worktree $wt: ${err:-no error output} — the directory may be left behind; remove it by hand"
    fi
  fi

  if git -C "$main_repo" branch -D "$branch" >/dev/null 2>&1; then
    echo "cleanup-merged-worktrees.sh: deleted merged branch '$branch'"
    cleaned=$((cleaned + 1))
  else
    echo "cleanup-merged-worktrees.sh: could not delete branch '$branch' — left in place"
  fi
done <<EOF
$gone_list
EOF

if [ "$dry_run" -eq 0 ]; then
  git -C "$main_repo" worktree prune 2>/dev/null || true
  if [ "$cleaned" -gt 0 ]; then
    echo "cleanup-merged-worktrees.sh: $cleaned merged branch(es) removed"
  fi
fi
exit 0
