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
#   1. removes the working copy checked out on it (`git worktree remove --force`;
#      a failure is reported and the sweep continues, because a directory left
#      behind is a smaller problem than a sweep that stops half-way through the
#      set), then
#   2. force-deletes the local branch (`git branch -D`),
#
# and then runs `git worktree prune` to drop the administrative records of
# working copies whose directories are already gone.
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
#     `{"runs": {"<branch>": {"status": …}}}`) says `running`, `parked`,
#     `park_loop` or `paused`. All four own a working copy the watcher will come
#     back to: a parked run is waiting for a clarification answer, a `park_loop`
#     one for an operator to clear it, and a paused one for a RESUME sentinel, and `worktree remove --force` would discard the pause
#     note the resumed engine is pointed at.
#
# CAVEAT: `: gone` + force-delete also catches an ABANDONED branch whose remote
# was deleted WITHOUT merging — its unmerged local commits would be lost. For a
# strict merge-then-delete-remote flow this is a non-issue. Use --dry-run to
# preview.
#
# `--dry-run` IS THE PREVIEW, AND IT DELETES NOTHING. It reports the branch (and
# the working copy) each decision would remove; no branch is deleted, no working
# copy removed, and it does not even `worktree prune`. It is NOT read-only: the
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
# this script either — so an agent that tries to run it gets a prompt it cannot
# answer, never a permit. Nothing about that is negotiable — an agent asked to
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
# REPRO — reproduce any decision by hand, against a throwaway fixture:
#
#   w=$(mktemp -d); b="$w/origin.git"; git init -q --bare "$b"
#   d="$w/demo"; git init -q -b trunk "$d"; git -C "$d" remote add origin "$b"
#   printf '%s' '{"version":1,"projectName":"demo","defaultBranch":"trunk","protectedBranches":["trunk","release/*"],"stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$d/harness.config.json"
#   mkdir -p "$d/scripts/lib"   # copy this script + lib/ there
#   git -C "$d" add -A && git -C "$d" commit -qm seed
#   git -C "$d" push -q -u origin trunk
#   for r in feat_gone feat_live release/1.0; do git -C "$d" branch "$r"; \
#     git -C "$d" push -q -u origin "$r"; done
#   git -C "$d" worktree add -q "$w/demo-feat_gone" feat_gone
#   git -C "$b" branch -q -D feat_gone; git -C "$b" branch -q -D release/1.0
#
#   preview       bash "$d/scripts/cleanup-merged-worktrees.sh" --dry-run
#                 -> names feat_gone and its working copy; `git -C "$d" branch`
#                    is unchanged and "$w/demo-feat_gone" is still there
#   sweep         bash "$d/scripts/cleanup-merged-worktrees.sh"
#                 -> "$w/demo-feat_gone" removed and feat_gone deleted;
#                    feat_live untouched (its upstream is not gone) and
#                    release/1.0 untouched (protected, though it IS gone)
#   active run    mkdir -p "$d/sdlc-harness/autonomous_logs"
#                 printf '%s' '{"runs":{"feat_gone":{"status":"running"}}}' \
#                   > "$d/sdlc-harness/autonomous_logs/registry.json"
#                 -> the skip line for feat_gone; nothing deleted (same with
#                    "parked", "park_loop" and "paused")
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
# was started from: if the main-checkout probe does not answer, the working-copy
# enumeration below cannot be trusted either, and the closed outcome is to stop.
main_repo="$(hr_main_repo "$top")" || main_repo=""
if [ -z "$main_repo" ]; then
  echo "cleanup-merged-worktrees.sh: could not determine the main checkout of '$top' — refusing to delete anything"
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

# --- The active-run set. A HARD PRECONDITION, not a best-effort read: the
# question it answers is whether a branch about to be force-deleted has a run
# writing to it.
registry="$(hr_state_path "$main_repo" autonomous_logs/registry.json)" || registry=""
if [ -z "$registry" ]; then
  echo "cleanup-merged-worktrees.sh: could not derive the run registry path — refusing to delete anything"
  exit 0
fi

active=""
if [ -e "$registry" ]; then
  if [ ! -r "$registry" ]; then
    echo "cleanup-merged-worktrees.sh: '$registry' is not readable — refusing to delete anything"
    exit 0
  fi
  # Enumerated through the `.runs` wrapper the whole flow writes and reads. A
  # document without it is a registry this cannot enumerate, so `jq` fails and
  # the refusal below fires — which is the point: reading such a file as "no
  # active runs" would delete a branch a run is still working on.
  if ! active="$(jq -r '.runs | to_entries[] | select(.value.status == "running" or .value.status == "parked" or .value.status == "park_loop" or .value.status == "paused") | .key' "$registry" 2>/dev/null)"; then
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
# unparseable or out-of-range string as readily as for a number that fails the
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

# The working copy checked out on <branch>, from the porcelain listing. Parsed
# line-wise rather than by whitespace fields, because a working copy's path may
# contain spaces. Prints nothing when there is none.
worktree_for_branch() {
  local branch="${1-}" list line current=""
  [ -n "$branch" ] || return 0
  list="$(git -C "$main_repo" worktree list --porcelain 2>/dev/null)" || return 0
  while IFS= read -r line; do
    case "$line" in
      "worktree "*) current="${line#worktree }" ;;
      "branch refs/heads/$branch")
        printf '%s\n' "$current"
        return 0
        ;;
    esac
  done <<EOF
$list
EOF
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

  wt="$(worktree_for_branch "$branch")"

  if [ "$dry_run" -eq 1 ]; then
    if [ -n "$wt" ]; then
      echo "cleanup-merged-worktrees.sh: [dry-run] would delete branch '$branch' and remove worktree $wt"
    else
      echo "cleanup-merged-worktrees.sh: [dry-run] would delete branch '$branch'"
    fi
    continue
  fi

  if [ -n "$wt" ] && [ "$wt" != "$main_repo" ]; then
    # git's own message is captured and reported rather than printed raw, so a
    # failure names the directory a person now has to remove by hand.
    if err="$(git -C "$main_repo" worktree remove --force "$wt" 2>&1 >/dev/null)"; then
      echo "cleanup-merged-worktrees.sh: removed worktree $wt"
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
