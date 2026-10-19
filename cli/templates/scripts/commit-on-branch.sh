#!/usr/bin/env bash
# commit-on-branch.sh — the deterministic commit wrapper every dispatched
# agent's unattended commit point calls (the run watcher's own artifact commit
# does not go through it: it calls `lib/harness-run-lib.sh` → `hr_commit_placed`
# directly): commit exactly the paths it was given, on the branch the target
# checkout has out, refuse a branch the main checkout's configuration protects,
# and take the message as ordinary positional arguments.
#
# WHY A WRAPPER EXISTS AT ALL. In an unattended run a command the profile does
# not allow is refused, and `git commit -m "$(…)"` is refused twice over: a
# command carrying a shell expansion (`$VAR` / `${…}` / `$(…)`) cannot be
# matched statically, so it reaches the commit branch-guard
# (`plugin/hooks/git-commit-branch-guard.sh`), which is fail-closed and answers
# `ask` for anything it could not read — and a `$(…)` in the message defeats a
# literal allow entry as well. An invocation of a SCRIPT PATH has neither
# problem: the generated permission profile allow-lists
# `bash <scripts_dir>/commit-on-branch.sh` in literal forms, and the commit
# guard's parser never matches it. A run in a linked worktree calls the MAIN
# checkout's copy, `bash <main>/<scripts_dir>/commit-on-branch.sh --repo
# <worktree> …` (WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX below);
# from a worktree the script-allowlist guard does not vouch for that copy, so
# the profile's literal `allow` entry is its only grant, and MESSAGE ARGUMENTS
# below states what that costs the caller. Either way the caller's command line
# carries NO heredoc and NO `$(…)`: the subject and every body paragraph are
# ordinary positional arguments.
#
# WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX. A sandboxed git cannot
# write a linked worktree's record, `<main>/.git/worktrees/<name>/`: `git add`
# and `git commit` there fail with `Operation not permitted` on `index.lock`
# (docs/sandbox-verification.md -> G1, G2 and F1, measured on Claude Code
# 2.1.299, macOS, headless). So the permission profile names the main
# checkout's copy in `sandbox.excludedCommands`, beside `push-branch.sh` and
# `refresh-branch.sh`, and an excluded command runs with full access. Every
# paragraph from THE TARGET IS NOT TRUSTED to NO FILTER DRIVER RUNS is what that
# access costs. A worktree's own copy sits in a sandbox-writable tree, is never
# excluded, and still fails on the record.
#
# SAFETY-CRITICAL CONSEQUENCE. Not reaching the commit branch-guard also means
# not reaching its protected-branch refusal, so this script MUST make that
# decision itself — and it makes it from the MAIN checkout's
# `harness.config.json` at run time (THE TARGET'S `harness.config.json` IS NOT
# TRUSTED EITHER below), through `lib/harness-run-lib.sh`, never from a list of
# branch names written into this file. A remembered list enforces the wrong set
# the moment `protectedBranches` changes, and enforces nothing at all in a
# repository whose integration branch is named something else. The library
# answers three states — protected, not protected, unresolvable — and all three
# are closed here.
#
# THE TARGET IS NOT TRUSTED. The profile's excluded rule ends in `:*`, which
# takes any argument. So before its first git call this script refuses (exit 1,
# a "refusing to commit:" line) unless the target is the main checkout this
# file sits in — placed from this file's own location by
# `lib/harness-run-lib.sh` → `hr_wrapper_main_of`, never from the argument — or
# a worktree that main repository lists (`hr_wrapper_target_check_var`). The
# reasoning and the residual are `push-branch.sh` → the paragraph of the same
# name.
#
# GIT NEVER RE-READS THE TARGET'S RECORDS. The checks read the target's `.git`
# pointer, its record's `commondir` and `gitdir`, and its `config.worktree`
# once (the reasoning: `push-branch.sh` → the paragraph of the same name). After
# them the branch is read once from the main checkout (`hr_wrapper_branch_var`)
# and named as `refs/heads/<branch>` from then on; every call that needs no
# working tree runs as `git -C <main checkout>`; and the calls that read the
# working tree (`ls-files`, `check-attr`, and the commit's index sync) run with
# `GIT_DIR=<main>/.git`, `GIT_INDEX_FILE=<record>/index` and
# `GIT_WORK_TREE=<target>`. So git reads nothing of the record but its `index`:
# not the `.git` pointer, not the record's `commondir`, `HEAD` or
# `config.worktree`. A `HEAD` flipped to another branch after the read is not
# followed: only `refs/heads/<branch>` moves.
#
# THE TARGET'S `harness.config.json` IS NOT TRUSTED EITHER. A worktree's own
# copy is a tracked file in a sandbox-writable tree, so a sandboxed command
# could commit one whose `protectedBranches` drops the branch it is on. The
# protected set is read from the MAIN checkout's `harness.config.json`, a file
# the permission profile write-protects, whichever checkout is the target; a
# main checkout whose configuration cannot be read is a refusal (exit 1), never
# a fall-back to the target's (`push-branch.sh` → the paragraph of the same
# name).
#
# THE PER-WORKING-COPY CONFIG IS NOT TRUSTED. Before its first git call this
# script refuses (exit 1) unless the target's `config.worktree` is absent,
# empty, or holds only the `core.hooksPath` `setup-worktree.sh` writes
# (`hr_worktree_config_check_var`); a refusal names each offending key and never
# its value. Every later git call pins `core.hooksPath` to the MAIN repository's
# hooks directory (`hr_pinned_hooks_path`) — exported as `GIT_CONFIG_COUNT` for
# the library's calls and spelled `-c core.hooksPath` on every call here — and
# carries `-c submodule.recurse=false` (the reasoning: `push-branch.sh` → the
# paragraph of the same name).
#
# THE INHERITED GIT ENVIRONMENT IS DROPPED. As its first statement after
# sourcing the library, before any git call, this script drops through
# `lib/harness-run-lib.sh` → `hr_git_env_drop` the same `GIT_*` names
# `push-branch.sh` does, every `GIT_TRACE*` included, and keeps
# `GIT_SSH_COMMAND`; `PATH` and `BASH_ENV` are trusted as they arrive (the list
# and the reasoning: `push-branch.sh` → the paragraph of the same name). It sets
# `GIT_DIR`, `GIT_INDEX_FILE` and `GIT_WORK_TREE` itself afterwards, for the
# working-tree calls only.
#
# THE COMMIT IS BUILT FROM PLUMBING, AND NO COMMIT HOOK RUNS. A hook runs
# project content, which would run here with full access. The commit is
# `lib/harness-run-lib.sh` → `hr_commit_paths_var`'s, the same owner
# `hr_commit_placed` uses; this script owns only its paths and its messages. Its
# runners pin `core.hooksPath=/dev/null`, so no hook of any kind runs during the
# commit: not `pre-commit`, `prepare-commit-msg`, `commit-msg`, `post-commit`
# nor `reference-transaction`. This script's own git calls before it
# (`rev-parse`, `ls-tree`, `ls-files`, `check-attr`) carry the pinned `<main>`
# hooks directory, and none of them starts a hook. The message lands exactly as
# given, one paragraph per argument, because `commit-tree` does no clean-up.
# The identity and the signing are the main repository's configuration
# (`user.*`, `commit.gpgSign`). The ref update is logged in
# `logs/refs/heads/<branch>` (reflog subject `commit-on-branch.sh: <subject>`),
# and no `logs/HEAD` entry is written for a linked worktree.
#
# NO FILTER DRIVER RUNS. Every blob is hashed under `hr_commit_paths_var`'s
# filter policy, so content is stored exactly as the working tree holds it:
# neither a clean filter nor an eol (`text` / `eol`) conversion is applied.
# Before hashing, this script refuses (exit 1) a path whose attributes select a
# `filter` (`check-attr`, read as data only), naming the path and never the
# driver: an LFS-tracked path is never committed raw without anyone noticing.
# Safety does not rest on that check — `--no-filters` holds even if the
# attributes are rewritten after it.
#
# LOUD-FAILURE CONTRACT (the KEY difference from push-branch.sh). push-branch.sh
# makes every failure non-fatal because a stale remote is tolerable. A commit
# caller cannot tolerate that ambiguity: if a commit did NOT land, the caller
# must NOT proceed as if it did. Exit-code map a caller can switch on:
#
#   0  committed. Stdout is exactly
#      `commit-on-branch.sh: committed <short_sha> on <branch>`
#   1  a usage error / a non-git directory / a detached HEAD / a configuration
#      that cannot be resolved / a refused target or `config.worktree` / a
#      refused hooks pin / a branch starting with `-` / a branch with no commit
#      yet / a path whose attributes select a filter driver / a path reached
#      through a symbolic link, or that is neither a regular file nor a
#      symbolic link (a submodule, a special file) / a git failure / the branch
#      moving under this script / a commit that landed but whose working
#      copy's index could not take the committed paths — the only exit 1 after
#      which `refs/heads/<branch>` has moved, reported on stderr as
#      `committed <short_sha> on <branch>, but …`. Only the branch moving under
#      this script leaves the given paths staged, the same residue a failed
#      `git commit` left
#   2  protected-branch refusal, with nothing staged
#   3  nothing to commit: the given paths match the branch's tip. The paths are
#      still synced into the working copy's index, so a second call re-stages a
#      file reverted after a failed one
#
# Every refusal is one stderr line beginning `commit-on-branch.sh: refusing to
# commit: ` that names its reason, except four lines kept byte-identical:
# `detached HEAD — refusing to commit`, `'<dir>' is not a git repository —
# refusing to commit`, `branch '<branch>' is protected — refusing to commit`
# (followed by its `protected set` line) and `cannot resolve
# '<main>/harness.config.json' — refusing to commit` (followed by its
# parenthesised causes). A usage error keeps its own line and its usage hint.
# The exit-1 `committed <short_sha> on <branch>, but …` line is not a refusal
# and does not begin with that prefix.
#
# WHAT IT NEVER DOES. It never pushes (that is push-branch.sh, called as a
# SEPARATE statement — an `if …; then push; fi` block is a compound the guards
# do not cover, which an unattended run refuses). It never flips a plan
# checkbox: callers own that. It never commits anything it was not given —
# nothing the working copy had staged before is swept in. It never runs a
# commit hook, never runs a filter driver, and never retries a failed commit.
#
# STAGING POLICY, AND THE ONE TRAP IN IT. Only the explicit paths passed before
# `--` are committed, and the commit is exactly the branch's tip plus those
# paths as the working tree holds them. A path that does not exist is
# skip-with-warning rather than a hard error, and that tolerance is what lets
# callers pass their paths UNCONDITIONALLY: an optional-but-absent one (an empty
# per-finding folder, say) must not fail the commit, and a caller-side
# `if [ -d … ]; then` existence check would reintroduce the refusal described
# under WHY A WRAPPER EXISTS AT ALL — a shell conditional cannot be matched
# statically, so it reaches the fail-closed guards and an unattended run
# refuses it. Callers were deliberately stripped of those checks; do not
# restore one. The existence check is made against `<repo_top>/<path>`, never a
# cwd-relative path. A directory (not a symbolic link) stands for every path
# the tip holds under it plus every tracked or untracked, not ignored, path the
# working copy holds there — except a gitlink (a submodule), which is carried
# from the tip unchanged, and an untracked embedded repository, which is left
# out; anything else stands for itself. THE TRAP: a path
# that was DELETED does not exist either, so passing the exact deleted path
# commits nothing and the deletion is silently left out. Pass the PARENT
# DIRECTORY of a deletion instead — the tip's entries under it that the working
# tree no longer holds are committed as removals. This is source behaviour
# carried across deliberately rather than fixed: the existence check is what
# keeps an absent optional path from failing a commit.
#
# MESSAGE ARGUMENTS, AND THE BYTES ONE MAY NOT CARRY. The subject and every body
# line arrive as ordinary shell arguments, so none of them may carry `$(…)`, a
# backtick, `|`, `>`, `<`, or a braced expansion other than a bare `${IDENT}`.
# Two independent reasons, either one fatal on its own. THE SHELL: inside the
# caller's double quotes `$(…)` and a backtick are substituted before this
# script is reached, and any `$` spelling is expanded — so a `$`, a backtick or
# a placeholder meant as TEXT is not text by the time it lands. THE GUARD: the
# script-allowlist guard (`autonomous-script-allowlist-guard.sh`, shipped with the
# plugin)
# scans the WHOLE command string for `$(…)`, a backtick, `|`, `<`, a braced form
# other than a bare `${IDENT}`, and a `>` that is neither a descriptor
# duplication (`2>&1`, `>&2`, `2>&-`) nor a redirection to the literal
# `/dev/null`, and silences the invocation on a match, which, unattended, is the
# refusal described under WHY A WRAPPER EXISTS AT ALL.
# That scanned set is the set above minus the two `>` shapes a MESSAGE cannot
# be, which is why the rule here stays whole-byte for `>`. The guard reads the
# raw string, so quoting and escaping rescue nothing: `|`, `<` and a prose `>`
# are inert to the shell inside quotes and still silence the command, and an
# escaped backtick matches exactly as a bare one does. The ONE admitted
# expansion is a bare `${IDENT}`, bought back by the guard's narrowed `${` arm —
# but only for a call the guard vouches for. THE MAIN CHECKOUT'S COPY, called
# from a worktree, is granted only by the profile's literal `allow` entry, which
# a command carrying any shell expansion does not match: that caller spells its
# main checkout, its `--repo` and every message token literally, and its command
# carries no `$` at all. THIS SCRIPT ENFORCES NONE OF THIS: it validates no
# message, rewrites no message, and passes each one to the commit exactly as
# given. The constraint binds the CALLER, and the caller's own contract states
# what to do with a title that cannot satisfy it.
#
# Usage: commit-on-branch.sh [--repo <repo-dir>] <path>... -- <subject> [<body-line>...]
#        bash <main checkout>/<scripts_dir>/commit-on-branch.sh --repo <worktree> <path>... -- <subject>
#   --repo <repo-dir>  worktree/repository to operate in (default: $PWD)
#   <path>...          explicit paths to commit (before `--`); missing paths warn+skip
#   --                 separates the path list from the message lines
#   <subject>          first token after `--` — the commit subject; see
#                      MESSAGE ARGUMENTS for the bytes it may not carry
#   <body-line>...     each remaining token — one additional body paragraph,
#                      under that same constraint
#   The second form, the main checkout's copy aimed at a worktree, is the one
#   the permission profile runs unsandboxed.
#
# REPRO — reproduce any decision by hand, against a throwaway fixture:
#
#   d=$(mktemp -d); git -C "$d" init -q -b feat_x
#   printf '%s' '{"version":1,"defaultBranch":"trunk","protectedBranches":["trunk","release/*"],"stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$d/harness.config.json"
#   mkdir -p "$d/scripts"; cp -R <this script> <its lib/> "$d/scripts/"
#   git -C "$d" add -A && git -C "$d" commit -qm seed
#   printf 'x\n' > "$d/f.txt"
#   # `commit-on-branch.sh` below is `bash "$d/scripts/commit-on-branch.sh"`: a
#   # copy outside the checkout it is aimed at refuses (THE TARGET IS NOT TRUSTED).
#
#   ordinary branch   commit-on-branch.sh --repo "$d" f.txt -- "feat: x" "body"
#                     -> exit 0, prints the new short SHA
#                     re-run with nothing changed                     -> exit 3
#   protected branch  git -C "$d" checkout -q -b trunk; same call     -> exit 2,
#                     and `git -C "$d" status --porcelain` is unchanged
#   not in the set    git -C "$d" checkout -q -b main; printf 'y\n' >> "$d/f.txt";
#                     same call -> exit 0 (the set is configured, not remembered)
#   unresolvable      printf 'x' > "$d/harness.config.json"; same call -> exit 1,
#                     no commit; then `git -C "$d" checkout -q -- harness.config.json`
#   deleted path      rm "$d/f.txt"; passing `f.txt` -> a "skipping" line,
#                     exit 3, the deletion NOT committed; passing `.` instead
#                     -> exit 0, and `git -C "$d" ls-files f.txt` prints nothing
#   no commit hook    mkdir -p "$d/githooks"; git -C "$d" config core.hooksPath githooks
#                     printf '%s\n' '#!/bin/sh' "touch $d.hook" > "$d/githooks/pre-commit"
#                     chmod +x "$d/githooks/pre-commit"; printf 'z\n' > "$d/h.txt"
#                     commit-on-branch.sh --repo "$d" h.txt -- "feat: h" -> exit 0,
#                     and no "$d.hook"
#   a filtered path   printf 'h.txt filter=marker\n' > "$d/.gitattributes"
#                     git -C "$d" config filter.marker.clean "touch $d.filter; cat"
#                     printf 'w\n' >> "$d/h.txt"; the call above -> exit 1, a
#                     "refusing to commit: 'h.txt' selects a filter driver" line,
#                     and no "$d.filter"; then `rm "$d/.gitattributes"`
#
#   The main checkout's copy committing in a linked worktree:
#   w=$(mktemp -d)/wt; git -C "$d" worktree add -q -b feat_w "$w"
#   printf 'g\n' > "$w/g.txt"
#
#   a worktree        commit-on-branch.sh --repo "$w" g.txt -- "feat: g" "body"
#                     -> exit 0; `git -C "$w" status --porcelain` is empty, and
#                     `git -C "$w" log -1 --pretty=%B` shows "feat: g", a blank
#                     line, then "body"
#   a scratch repo    s=$(mktemp -d); git -C "$s" init -q -b feat_s
#                     git -C "$s" commit -qm s --allow-empty; printf 's\n' > "$s/s.txt"
#                     commit-on-branch.sh --repo "$s" s.txt -- "feat: s"
#                     -> exit 1, a "refusing to commit:" line,
#                     `git -C "$s" rev-parse HEAD` unchanged
#   a planted monitor git -C "$w" config extensions.worktreeConfig true
#                     git -C "$w" config --worktree core.fsmonitor "touch $s.marker"
#                     printf 'g2\n' >> "$w/g.txt"; the "a worktree" call
#                     -> exit 1, a "refusing to commit:" line naming
#                     core.fsmonitor and not its value, and no "$s.marker"

set -uo pipefail

# The library is reached by a path computed from this script's own location, so
# a copy that was moved with its `lib/` still finds it, and no session root or
# runtime-substituted token is assumed.
hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "commit-on-branch.sh: cannot read '$hr_lib' — refusing to commit" >&2
  exit 1
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"
# THE INHERITED GIT ENVIRONMENT IS DROPPED (header). GIT_SSH_COMMAND is kept.
hr_git_env_drop

repo_dir="$PWD"

# --- Parse args: optional --repo, then <path>... up to `--`, then message lines.
paths=()
msgs=()
saw_sep=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      if [ "$#" -lt 2 ]; then
        echo "commit-on-branch.sh: --repo requires a directory argument" >&2
        exit 1
      fi
      repo_dir="$2"
      shift 2
      ;;
    --)
      saw_sep=1
      shift
      break
      ;;
    *)
      paths+=("$1")
      shift
      ;;
  esac
done

if [ "$saw_sep" -ne 1 ]; then
  echo "commit-on-branch.sh: missing '--' separator before the commit message" >&2
  echo "  usage: commit-on-branch.sh [--repo <dir>] <path>... -- <subject> [<body-line>...]" >&2
  exit 1
fi

# Everything after `--` is the message: the first token is the subject, the rest
# are additional body paragraphs.
while [ "$#" -gt 0 ]; do
  msgs+=("$1")
  shift
done

# An empty subject is refused here because `commit-tree`, unlike `git commit`,
# would record it.
if [ "${#msgs[@]}" -eq 0 ] || [ -z "${msgs[0]}" ]; then
  echo "commit-on-branch.sh: no commit subject after '--'" >&2
  exit 1
fi

# THE TARGET IS NOT TRUSTED and THE PER-WORKING-COPY CONFIG IS NOT TRUSTED
# (header): settled before the first git call, each function called directly so
# its variables survive. A non-git directory keeps its loud non-zero error.
top_nogit="$(hr_checkout_top_nogit "$repo_dir")" || top_nogit=""
if [ -z "$top_nogit" ]; then
  echo "commit-on-branch.sh: '$repo_dir' is not a git repository — refusing to commit" >&2
  exit 1
fi
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! main_top="$(hr_wrapper_main_of "$script_dir")"; then
  echo "commit-on-branch.sh: refusing to commit: cannot place this script in a main checkout (its .git is a symbolic link, or a directory holding a commondir)" >&2
  exit 1
fi
if ! hr_wrapper_target_check_var "$main_top" "$top_nogit"; then
  echo "commit-on-branch.sh: refusing to commit: $HR_TARGET_REFUSAL" >&2
  exit 1
fi
wt_gitdir="$HR_TARGET_GITDIR"
if ! hr_worktree_config_check_var "$top_nogit"; then
  echo "commit-on-branch.sh: refusing to commit: $HR_WT_CONFIG_REFUSAL" >&2
  exit 1
fi
# Fail closed: a configuration that cannot be read is a branch that cannot be
# judged. Loaded here, unsubstituted, so the pin and the protected-branch
# decision below read the warmed cache, and so this is the refusal a broken
# main configuration gets rather than the pin's.
if ! hr_config_load "$main_top"; then
  echo "commit-on-branch.sh: cannot resolve '$main_top/harness.config.json' — refusing to commit" >&2
  echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)" >&2
  exit 1
fi
if ! hr_pinned_hooks_path "$main_top"; then
  if [ -n "$HR_PINNED_HOOKS_REFUSAL" ]; then
    echo "commit-on-branch.sh: refusing to commit: $HR_PINNED_HOOKS_REFUSAL" >&2
  else
    echo "commit-on-branch.sh: refusing to commit: could not resolve the hooks directory to pin for '$top_nogit'" >&2
  fi
  exit 1
fi
pinned="$HR_PINNED_HOOKS_PATH"
# Pins the library helpers' git calls below; every call spelled here also
# carries `-c`, which an older git than 2.31 still honours.
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0="$pinned"

# GIT NEVER RE-READS THE TARGET'S RECORDS (header).
top="$top_nogit"
main_git() {
  git -C "$main_top" -c core.hooksPath="$pinned" -c submodule.recurse=false "$@"
}
wt_git() {
  GIT_DIR="$main_top/.git" GIT_INDEX_FILE="$wt_gitdir/index" GIT_WORK_TREE="$top" \
    git -C "$top" -c core.hooksPath="$pinned" -c submodule.recurse=false "$@"
}

# Read once, from the main checkout, and named as `refs/heads/<branch>` from
# here on.
if ! hr_wrapper_branch_var "$main_top" "$wt_gitdir"; then
  echo "commit-on-branch.sh: detached HEAD — refusing to commit" >&2
  exit 1
fi
branch="$HR_WRAPPER_BRANCH"
case "$branch" in
  -*)
    echo "commit-on-branch.sh: refusing to commit: branch '$branch' starts with '-', which git would read as an option" >&2
    exit 1
    ;;
esac

# THE TARGET'S `harness.config.json` IS NOT TRUSTED EITHER (header): the
# protected-branch decision is the main checkout's. Called unsubstituted so the
# library's per-process cache is warmed here and the `$(hr_protected_patterns …)`
# in the refusal message below re-reads nothing.
hr_branch_is_protected "$main_top" "$branch"
protected=$?
case "$protected" in
  0)
    # Name the resolved set as well as the branch: the adopter configured it, so
    # a refusal that only names the branch cannot be acted on.
    patterns="$(hr_protected_patterns "$main_top")" || patterns=""
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
    echo "commit-on-branch.sh: branch '$branch' is protected — refusing to commit" >&2
    echo "  protected set (from harness.config.json): $protected_set" >&2
    exit 2
    ;;
  2)
    # Fail closed: a configuration that cannot be read is a branch that cannot
    # be judged.
    echo "commit-on-branch.sh: cannot resolve '$main_top/harness.config.json' — refusing to commit" >&2
    echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)" >&2
    exit 1
    ;;
esac

# The tip the commit is built on, read once: the ref moves only if it still
# points here.
old_tip="$(main_git rev-parse --verify --quiet "refs/heads/$branch^{commit}")" || old_tip=""
if [ -z "$old_tip" ]; then
  echo "commit-on-branch.sh: refusing to commit: '$branch' has no commit yet in '$main_top'" >&2
  exit 1
fi

# The path lists are NUL-separated files, because a path may hold any byte but
# NUL; the directory goes with this process.
if ! work="$(mktemp -d "${TMPDIR:-/tmp}/commit-on-branch.XXXXXX")"; then
  echo "commit-on-branch.sh: refusing to commit: cannot create a temporary directory" >&2
  exit 1
fi
trap 'rm -rf "$work"' EXIT
: >"$work/paths"

# STAGING POLICY (header). The count guard is required: on bash 3.2 (the
# floor) `"${paths[@]}"` on an EMPTY array under `set -u` raises `unbound
# variable` instead of expanding to nothing, which would abort a legal
# zero-path call before it could reach the nothing-to-commit exit 3.
if [ "${#paths[@]}" -gt 0 ]; then
  for p in "${paths[@]}"; do
    if [ ! -e "$top/$p" ]; then
      echo "commit-on-branch.sh: path '$p' does not exist under '$top' — skipping" >&2
      continue
    fi
    case "$p" in
      /*)
        echo "commit-on-branch.sh: refusing to commit: '$p' is not a path relative to '$top'" >&2
        exit 1
        ;;
    esac
    # The repo-relative form the commit's records need: no empty or `.`
    # segment. A `..` segment is refused.
    rel=""
    rest="$p"
    while [ -n "$rest" ]; do
      seg="${rest%%/*}"
      if [ "$seg" = "$rest" ]; then rest=""; else rest="${rest#*/}"; fi
      case "$seg" in
        '' | .) ;;
        ..)
          echo "commit-on-branch.sh: refusing to commit: '$p' has a '..' segment" >&2
          exit 1
          ;;
        *) rel="${rel:+$rel/}$seg" ;;
      esac
    done
    if [ -d "$top/$p" ] && [ ! -L "$top/$p" ]; then
      [ -n "$rel" ] || rel=.
      # A gitlink (a submodule) under a passed directory is carried from the tip
      # unchanged: this wrapper never commits one, and an unchanged one must not
      # refuse the rest of the directory. An untracked embedded repository,
      # which `ls-files --others` lists as `<path>/`, is left out the same way.
      if ! main_git ls-tree -r -z "$old_tip" -- "$rel" >"$work/listing"; then
        echo "commit-on-branch.sh: refusing to commit: git could not list '$p' at '$branch' (see output above)" >&2
        exit 1
      fi
      while IFS= read -r -d '' entry; do
        case "$entry" in 160000\ *) continue ;; esac
        printf '%s\0' "${entry#*	}" >>"$work/paths"
      done <"$work/listing"
      if ! wt_git ls-files -z --stage -- "$rel" >"$work/listing"; then
        echo "commit-on-branch.sh: refusing to commit: git could not list '$p' in '$top' (see output above)" >&2
        exit 1
      fi
      while IFS= read -r -d '' entry; do
        case "$entry" in 160000\ *) continue ;; esac
        printf '%s\0' "${entry#*	}" >>"$work/paths"
      done <"$work/listing"
      if ! wt_git ls-files -z --others --exclude-standard -- "$rel" >"$work/listing"; then
        echo "commit-on-branch.sh: refusing to commit: git could not list '$p' in '$top' (see output above)" >&2
        exit 1
      fi
      while IFS= read -r -d '' entry; do
        case "$entry" in */) continue ;; esac
        printf '%s\0' "$entry" >>"$work/paths"
      done <"$work/listing"
    else
      printf '%s\0' "$rel" >>"$work/paths"
    fi
  done
fi
if ! LC_ALL=C sort -z -u "$work/paths" >"$work/sorted"; then
  echo "commit-on-branch.sh: refusing to commit: could not sort the path list" >&2
  exit 1
fi
commit_paths=()
while IFS= read -r -d '' rel; do
  commit_paths+=("$rel")
done <"$work/sorted"

# NO FILTER DRIVER RUNS (header): attributes are read as data, and a path that
# selects a filter is refused rather than committed raw.
if [ "${#commit_paths[@]}" -gt 0 ]; then
  if ! wt_git check-attr -z --stdin filter <"$work/sorted" >"$work/attrs"; then
    echo "commit-on-branch.sh: refusing to commit: git could not read the attributes of the given paths (see output above)" >&2
    exit 1
  fi
  while IFS= read -r -d '' a_path && IFS= read -r -d '' _ && IFS= read -r -d '' a_value; do
    case "$a_value" in
      unspecified | unset) ;;
      *)
        echo "commit-on-branch.sh: refusing to commit: '$a_path' selects a filter driver, which this wrapper never runs" >&2
        exit 1
        ;;
    esac
  done <"$work/attrs"
fi

# THE COMMIT IS BUILT FROM PLUMBING, AND NO COMMIT HOOK RUNS (header).
status=0
hr_commit_paths_var "$main_top" "$top" "$wt_gitdir" "$branch" "$old_tip" auto always \
  "commit-on-branch.sh: ${msgs[0]}" ${commit_paths[@]+"${commit_paths[@]}"} -- "${msgs[@]}" || status=$?
case "$status" in
  0)
    sha="$(main_git rev-parse --short "$HR_COMMIT_NEW")" || sha="$HR_COMMIT_NEW"
    echo "commit-on-branch.sh: committed $sha on $branch"
    exit 0
    ;;
  3)
    echo "commit-on-branch.sh: nothing to commit" >&2
    exit 3
    ;;
  4)
    echo "commit-on-branch.sh: refusing to commit: '$branch' moved under this wrapper, or its ref could not be locked — no commit made, and the given paths are left staged" >&2
    exit 1
    ;;
  *)
    if [ -n "$HR_COMMIT_NEW" ]; then
      sha="$(main_git rev-parse --short "$HR_COMMIT_NEW")" || sha="$HR_COMMIT_NEW"
      echo "commit-on-branch.sh: committed $sha on $branch, but the index of '$top' could not take the committed paths — the commit stands; the same call again re-syncs the index and exits 3" >&2
    else
      echo "commit-on-branch.sh: refusing to commit: $HR_COMMIT_REFUSAL" >&2
    fi
    exit 1
    ;;
esac
