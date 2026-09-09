#!/usr/bin/env bash
# git-commit-branch-guard.sh — PreToolUse guard for `git commit`: auto-allow the
# commit when the repository it names is on an ordinary branch, and ask for
# confirmation when that branch is one the repository's own
# `harness.config.json` protects, when HEAD is detached, or when the protected
# set cannot be resolved at all. No branch name is baked into this file: a
# repository whose default branch is not the usual one gets its own answer.
#
# SELF-VERIFYING — it reads the command out of the hook payload and stays SILENT
# (exit 0, no output) unless a piece of that command really is a `git … commit`.
# It therefore needs NO `if:` condition wherever it is registered, and takes NO
# arguments; a spurious fire is harmless.
#
# TWO DEFECTS THIS SHAPE ALREADY FIXED — both worth keeping in mind before
# anyone reintroduces a condition or a path:
#
#   1. A `${…}` substitution in a command defeats static command matching, so an
#      `if:` condition fires conservatively on commands that are not commits at
#      all — a plain `echo ${SOME_VAR}/scripts/probe.sh` drew a commit refusal.
#      Hence: no condition, and the command is parsed here instead.
#
#   2. A registration that passed a hardcoded repository path judged the WRONG
#      REPOSITORY — the primary checkout, permanently on the default branch —
#      every time a commit was made in a sibling worktree on a feature branch.
#      Interactively that is a stray prompt; in an unattended run an `ask`
#      cannot be answered, so it is a silent stall. Hence: the repository is
#      resolved from the command and the payload, never from a path in this
#      file, so one registration serves every checkout.
#
# WHICH PARSER THIS KEEPS. The compound split, the "only a piece whose own
# command word is `git`" test and the global-option walker that captures `-C`
# come from the shared library (`hc_split_command`, `hc_clean_piece`,
# `hc_git_piece_parts`) — the same code the source guard carried inline, so
# every guard splits a compound into the same pieces. What this file does NOT
# use is `hc_repo_dir_from_command`: that helper returns the first `git -C <dir>`
# anywhere in the compound, which for `git -C <a> log && git -C <b> commit` is
# the *log*'s directory. The commit piece's own `-C` wins here, because the
# repository being committed to is the one this guard must judge; only when the
# commit piece carries no `-C` does the full command go to
# `hc_resolve_repo_root`, which applies the settled order (a leading `cd <dir>`,
# else the payload's `.cwd`, else `$PWD`).
#
# FAIL-CLOSED TABLE — this guard never emits `allow` on anything it could not
# read:
#
#   detached HEAD, or a branch in the protected set -> ask
#   configuration unresolvable          -> ask   (invalid JSON, more than one
#     (within jurisdiction)                       document, no `defaultBranch`)
#   payload unparseable, or `jq` absent -> SILENT (no command to judge)
#   no config, or one that cannot be read -> SILENT (both out of jurisdiction)
#   anything else                       -> allow
#
# JURISDICTION IS A DELIBERATE SCOPING DECISION, NOT AN OVERSIGHT. A repository
# with no `harness.config.json` at its resolved root has not adopted the
# harness, so this guard emits neither `allow` nor `ask` there — a plugin hook
# fires in EVERY session the plugin is enabled for, including repositories that
# never ran `init`, and a guard that answered them would either nag or grant in
# a repository that never asked for it. The caller-agnostic backstop for those
# is the adopter's own committed pre-push hook. That backstop is caller-agnostic
# WITHIN GIT: git runs it on every push git performs, and a tool that implements
# push against the git backend itself, as `jj git push` does, performs no git
# push and runs no git hook. The same silence covers a path that is not in a git
# repository, and a config file `[ -r ]` cannot read.
#
# REPRO — reproduce any decision by hand; the payload goes in on stdin:
#
#   printf '{"tool_input":{"command":"git -C <dir> commit -m x"},"cwd":"<dir>"}' \
#     | bash plugin/hooks/git-commit-branch-guard.sh
#
#   <dir> on a feature branch            -> permissionDecision "allow"
#   <dir> on a configured protected one  -> "ask", reason naming the branch
#   <dir> on a detached HEAD             -> "ask"
#   <dir>'s config invalid JSON          -> "ask", reason naming the config
#   <dir> with no harness.config.json    -> no output, exit 0
#
#   The worktree case, with no `-C` in the command — the payload's own cwd is
#   what gets judged, not the directory this process happens to run in:
#
#   printf '{"tool_input":{"command":"git commit -m x"},"cwd":"<worktree>"}' \
#     | bash plugin/hooks/git-commit-branch-guard.sh

set -u

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-config-lib.sh"

payload=$(cat)

# Cheapest possible filter first: these hooks fire on every Bash call, and a
# payload with no "commit" byte anywhere cannot carry a commit. This runs before
# any `jq` or `git` subprocess.
case "$payload" in
  *commit*) ;;
  *) exit 0 ;;
esac

# ONE `jq` for both payload fields — see `hc_payload_fields`.
hc_payload_fields "$payload" || exit 0
cmd="$HC_PAYLOAD_CMD"

case "$cmd" in
  *commit*) ;;
  *) exit 0 ;;
esac

# Walk the compound looking for a real `git … commit`, and remember that piece
# together with its own `-C` argument. A piece whose command word is not `git`
# is skipped, which is what keeps `echo "git commit"` and a wrapper script named
# on the command line out of scope.
found=0
commit_piece=""
commit_dir=""

while IFS= read -r piece; do
  p=$(hc_clean_piece "$piece")
  hc_git_piece_parts "$p" || continue
  case "$HC_GIT_REST" in
    commit|commit\ *)
      found=1
      commit_piece="$p"
      commit_dir="$HC_GIT_DIR"
      break
      ;;
  esac
done <<EOF
$(hc_split_command "$cmd")
EOF

[ "$found" -eq 1 ] || exit 0

cwd="$HC_PAYLOAD_CWD"

# The commit piece's own `-C` when it has one; otherwise the whole command, so a
# leading `cd <dir>` still counts before the payload cwd does.
if [ -n "$commit_dir" ]; then
  root=$(hc_resolve_repo_root "$commit_piece" "$cwd") || exit 0
else
  root=$(hc_resolve_repo_root "$cmd" "$cwd") || exit 0
fi

# Jurisdiction: no config at that root means the harness was never adopted here.
hc_config_file "$root" >/dev/null || exit 0

# Warm the per-process configuration cache HERE, in this shell: every reader
# below runs inside a `$(…)` subshell, which inherits the cache but cannot
# write one back. Decides nothing — see the cache header in the library.
hc_config_load "$root" || :

emit() {
  jq -nc --arg d "${1-}" --arg r "${2-}" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: $d,
      permissionDecisionReason: $r
    }
  }'
}

patterns=$(hc_protected_patterns "$root") || patterns=""
patterns_desc=$(printf '%s' "$patterns" | tr '\n' ',' | sed 's/,/, /g; s/, *$//')
[ -n "$patterns_desc" ] || patterns_desc="unresolved"

branch=$(hc_current_branch "$root")

if [ -z "$branch" ]; then
  emit ask "HEAD is detached — no branch to check against the protected set ($patterns_desc); confirm commit manually"
  exit 0
fi

hc_branch_is_protected "$root" "$branch"
case $? in
  0)
    emit ask "Branch $branch is protected ($patterns_desc) or detached — confirm commit manually"
    ;;
  1)
    emit allow "Auto-allowed commit on branch $branch"
    ;;
  *)
    emit ask "Could not resolve protectedBranches for $root — confirm commit manually"
    ;;
esac

exit 0
