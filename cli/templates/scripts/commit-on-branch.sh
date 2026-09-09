#!/usr/bin/env bash
# commit-on-branch.sh — the deterministic commit wrapper every unattended commit
# point calls: stage exactly the paths it was given, refuse a branch this
# repository's own configuration protects, and commit with the message supplied
# as ordinary positional arguments.
#
# WHY A WRAPPER EXISTS AT ALL. An unattended run cannot answer a permission
# prompt, so a command that draws one is a silent stall rather than a refusal.
# `git commit -m "$(…)"` draws one twice over: a command carrying a shell
# expansion (`$VAR` / `${…}` / `$(…)`) cannot be matched statically, so it
# reaches the commit branch-guard (`plugin/hooks/git-commit-branch-guard.sh`),
# which is fail-closed and answers `ask` for anything it could not read — and a
# `$(…)` in the message defeats a literal allow entry as well. An invocation of
# a SCRIPT PATH has neither problem: `bash <scripts_dir>/commit-on-branch.sh …`
# is allow-listed in three literal forms by the generated permission profile,
# is auto-allowed by the script-allowlist guard (a script resolving under the
# configured scripts directory whose basename is not on that guard's deny list,
# in a command carrying none of `$(…)`, a backtick, `|`, `<`, a braced form
# other than a bare `${IDENT}`, or a `>` that is neither a descriptor
# duplication (`2>&1`, `>&2`, `2>&-`) nor a redirection to the literal
# `/dev/null` — which is what the rule below enforces),
# and is never matched by the commit guard's parser — even when the path or the
# arguments carry expansions. So the caller's command line carries NO heredoc
# and NO `$(…)`: the subject and every body paragraph are ordinary positional
# arguments and this script builds the commit from repeated `-m` flags itself.
#
# SAFETY-CRITICAL CONSEQUENCE. Not reaching the commit branch-guard also means
# not reaching its protected-branch refusal, so this script MUST make that
# decision itself — and it makes it from `<repo_root>/harness.config.json` at
# run time, through `lib/harness-run-lib.sh`, never from a list of branch names
# written into this file. A remembered list enforces the wrong set the moment
# `protectedBranches` changes, and enforces nothing at all in a repository whose
# integration branch is named something else. The library answers three states —
# protected, not protected, unresolvable — and all three are closed here.
#
# LOUD-FAILURE CONTRACT (the KEY difference from push-branch.sh). push-branch.sh
# makes every failure non-fatal because a stale remote is tolerable. A commit
# caller cannot tolerate that ambiguity: if a commit did NOT land, the caller
# must NOT proceed as if it did. A non-git directory, a detached HEAD, a
# configuration that cannot be resolved, a protected-branch refusal and a
# git-level hook failure are therefore all non-zero exits. Exit-code map a
# caller can switch on:
#
#   0  commit landed (the new short SHA is printed to stdout)
#   1  usage error / non-git directory / detached HEAD / the configuration could
#      not be resolved / `git commit` failed (a hook, or any commit-time check)
#   2  protected-branch refusal (no staging, no commit)
#   3  nothing to commit (the paths staged cleanly and produced no staged
#      change) — a DISTINCT, non-crashing status so a caller can tell "nothing
#      staged" apart from a protected-branch refusal or a hook failure
#
# WHAT IT NEVER DOES. It never pushes (that is push-branch.sh, called as a
# SEPARATE statement — an `if …; then push; fi` block is a compound the guards
# do not cover and stalls an unattended run). It never flips a plan checkbox:
# callers own that. It never stages anything it was not given — no `git add -A`,
# no `git add .`. It never passes `--no-verify` or any other hook-skip flag, and
# it never retries a failed commit.
#
# STAGING POLICY, AND THE ONE TRAP IN IT. Only the explicit paths passed before
# `--` are staged, one `git add -- <path>` each. A path that does not exist is
# skip-with-warning rather than a hard error, and that tolerance is what lets
# callers pass their paths UNCONDITIONALLY: an optional-but-absent one (an empty
# per-finding folder, say) must not fail the commit, and a caller-side
# `if [ -d … ]; then` existence check would reintroduce the stall described
# under WHY A WRAPPER EXISTS AT ALL — a shell conditional cannot be matched
# statically, so it reaches the fail-closed guards and an unattended run cannot
# answer the prompt it draws. Callers were deliberately stripped of those
# checks; do not restore one. THE TRAP: a path that was DELETED does not
# exist either, so passing the exact deleted path stages nothing and the
# deletion is silently left out of the commit. Pass the PARENT DIRECTORY of a
# deletion instead — `git add -- <dir>` stages the removal. This is source
# behaviour carried across deliberately rather than fixed: the existence check
# is what keeps an absent optional path from failing a commit, and it is checked
# against `<repo_top>/<path>` — the same base `git -C <top> add` resolves
# against — so a path is staged if and only if it is the one git would resolve.
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
# `/dev/null`, and silences the invocation on a match, which is the permission
# prompt described under WHY A WRAPPER EXISTS AT ALL and, unattended, a stall.
# That scanned set is the set above minus the two `>` shapes a MESSAGE cannot
# be, which is why the rule here stays whole-byte for `>`. The guard reads the
# raw string, so quoting and escaping rescue nothing: `|`, `<` and a prose `>`
# are inert to the shell inside quotes and still silence the command, and an
# escaped backtick matches exactly as a bare one does. The ONE admitted
# expansion is a bare `${IDENT}`,
# bought back by the guard's narrowed `${` arm because the corpus's canonical
# subject spells its branch token that way — it is allowed AND expanded, so pass
# it only when expansion is what you want. THIS SCRIPT ENFORCES NONE OF THIS: it
# validates no message, rewrites no message, and builds the commit from repeated
# `-m` flags exactly as given. The constraint binds the CALLER, and the caller's
# own contract states what to do with a title that cannot satisfy it.
#
# Usage: commit-on-branch.sh [--repo <repo-dir>] <path>... -- <subject> [<body-line>...]
#   --repo <repo-dir>  worktree/repository to operate in (default: $PWD)
#   <path>...          explicit paths to stage (before `--`); missing paths warn+skip
#   --                 separates the stage-path list from the message lines
#   <subject>          first token after `--` — the commit subject (`-m`); see
#                      MESSAGE ARGUMENTS for the bytes it may not carry
#   <body-line>...     each remaining token — one additional `-m` body paragraph,
#                      under that same constraint
#
# REPRO — reproduce any decision by hand, against a throwaway fixture:
#
#   d=$(mktemp -d); git -C "$d" init -q -b feat_x
#   printf '%s' '{"version":1,"defaultBranch":"trunk","protectedBranches":["trunk","release/*"],"stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$d/harness.config.json"
#   printf 'x\n' > "$d/f.txt"
#
#   ordinary branch   commit-on-branch.sh --repo "$d" f.txt -- "feat: x" "body"
#                     -> exit 0, prints the new short SHA
#                     re-run with nothing changed                     -> exit 3
#   protected branch  git -C "$d" checkout -q -b trunk; same call     -> exit 2,
#                     and `git -C "$d" status --porcelain` is unchanged
#   not in the set    git -C "$d" checkout -q -b main; same call      -> exit 0
#                     (the set is configured, not remembered)
#   unresolvable      printf 'x' > "$d/harness.config.json"; same call -> exit 1,
#                     no commit
#   deleted path      git -C "$d" rm -q f.txt; passing `f.txt`  -> the deletion is
#                     NOT staged; pass its parent directory instead

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

if [ "${#msgs[@]}" -eq 0 ]; then
  echo "commit-on-branch.sh: no commit subject after '--'" >&2
  exit 1
fi

# Resolve the repository top. A non-git directory is a loud non-zero error (a
# commit caller cannot tolerate "not a repository" the way a best-effort push
# can).
top="$(hr_repo_root "$repo_dir")"
if [ -z "$top" ]; then
  echo "commit-on-branch.sh: '$repo_dir' is not a git repository — refusing to commit" >&2
  exit 1
fi

# Current branch. Empty => detached HEAD => loud refusal, no staging, no commit.
branch="$(hr_current_branch "$top")"
if [ -z "$branch" ]; then
  echo "commit-on-branch.sh: detached HEAD — refusing to commit" >&2
  exit 1
fi

# The protected-branch decision, from this repository's configuration. Called
# unsubstituted so the library's per-process cache is warmed here and the
# `$(hr_protected_patterns …)` in the refusal message below re-reads nothing.
hr_branch_is_protected "$top" "$branch"
protected=$?
case "$protected" in
  0)
    # Name the resolved set as well as the branch: the adopter configured it, so
    # a refusal that only names the branch cannot be acted on.
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
    echo "commit-on-branch.sh: branch '$branch' is protected — refusing to commit" >&2
    echo "  protected set (from harness.config.json): $protected_set" >&2
    exit 2
    ;;
  2)
    # Fail closed. The configuration is what says which branches are protected,
    # so a configuration that cannot be read is a branch that cannot be judged —
    # and committing on it would be exactly the mutation this wrapper exists to
    # gate.
    echo "commit-on-branch.sh: cannot resolve '$top/harness.config.json' — refusing to commit" >&2
    echo "  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)" >&2
    exit 1
    ;;
esac

# Stage ONLY the explicit paths — never `git add -A` / `git add .`. A missing
# path is skip-with-warning, not a hard error. The count guard is required: on
# bash 3.2 (the floor) `"${paths[@]}"` on an EMPTY array under `set -u` raises
# `unbound variable` instead of expanding to nothing, which would abort a legal
# zero-path call before it could reach the nothing-to-commit exit 3.
if [ "${#paths[@]}" -gt 0 ]; then
  for p in "${paths[@]}"; do
    # The existence check MUST use the same base as the staging command below
    # (`git -C "$top" add` resolves $p relative to $top, not the caller's cwd).
    # Checking `$top/$p` only — never a cwd-relative $p — guarantees a path is
    # staged if and only if it is the same path `git add` will resolve.
    if [ ! -e "$top/$p" ]; then
      echo "commit-on-branch.sh: path '$p' does not exist under '$top' — skipping" >&2
      continue
    fi
    if ! git -C "$top" add -- "$p"; then
      echo "commit-on-branch.sh: 'git add -- $p' failed — no commit made" >&2
      exit 1
    fi
  done
fi

# Nothing staged => a distinct, dedicated non-zero status, so a caller can tell
# this apart from a protected-branch refusal or a hook failure.
if git -C "$top" diff --cached --quiet; then
  echo "commit-on-branch.sh: nothing to commit" >&2
  exit 3
fi

# Build the commit from repeated -m flags, WITHOUT `--no-verify` or any other
# hook-skip flag, so the repository's own commit hooks still run.
commit_args=()
for m in "${msgs[@]}"; do
  commit_args+=(-m "$m")
done

if ! git -C "$top" commit "${commit_args[@]}"; then
  # A hook (or any other commit-time check) failed. Surface it loudly; do NOT
  # retry, do NOT add --no-verify, do NOT leave a partial or bypassing commit.
  echo "commit-on-branch.sh: 'git commit' failed (see output above) — no commit made" >&2
  exit 1
fi

sha="$(git -C "$top" rev-parse --short HEAD)"
echo "commit-on-branch.sh: committed $sha on $branch"
exit 0
