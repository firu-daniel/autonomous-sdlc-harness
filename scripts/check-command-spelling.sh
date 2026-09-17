#!/usr/bin/env bash
# check-command-spelling.sh — fail when a plugin command is spelled with a bare slash instead of
# `/autonomous-sdlc-harness:<name>`. Hand-written for this repository, like run-gates.sh, which runs
# it as gate 6d; `docs/development.md` §5 gate 6 states the contract in prose.
#
# THE CONTRACT.
#   1. Scan set: `git grep --untracked` over tracked and untracked-unignored files, excluding
#      `.claude/`, `examples/notes-app/.claude/`, `examples/notes-app/sdlc-harness/`, `harness-runs/`
#      and this script.
#   2. Pattern: PATTERN below. A path citation (`commands/branch-start-plan.md`) and the qualified
#      spelling do not match; a sentence-final bare spelling does.
#   3. A matching line is exempt when an EXEMPTIONS entry `<path>|<kind>|<text>` covers it: `line`
#      covers a line equal to <text> once trailing whitespace is stripped, `contains` covers a line
#      holding <text> as an exact substring.
#   4. Every entry covers exactly one line of its file, counted over all its lines. None is
#      `<path>:0 — stale exemption: <text>`; more than one is `<path>:<line> — ambiguous exemption:
#      <text>`, once per covered line.
#   5. Not caught: a second bare spelling added inside a line an entry already covers.
#
# Usage: check-command-spelling.sh   (no arguments)
# Exit: 0 no findings · 1 one or more findings, each on stderr as
#       `check-command-spelling: <path>:<line> — <reason>`, all reported · 2 bad usage
#
# REPRO. Each plant was appended as the file's last line, the check was run as
# `bash scripts/check-command-spelling.sh`, and the plant was removed until `git diff` on the file was
# empty. The `<path>:<line>` coordinates are the output of that one run, not anchors into the current
# file.
#   docs/cli.md, plant: Run `/harness-analyze` here.
#     exit 1; check-command-spelling: docs/cli.md:447 — bare command spelling; write /autonomous-sdlc-harness:<name>
#     reverted, rerun: exit 0, no output
#   docs/development.md, outside the gate-8 block, plant: Run `/harness-analyze` here.
#     exit 1; check-command-spelling: docs/development.md:495 — bare command spelling; write /autonomous-sdlc-harness:<name>
#   docs/cli.md, plant: Then run /branch-status.
#     exit 1; check-command-spelling: docs/cli.md:447 — bare command spelling; write /autonomous-sdlc-harness:<name>
set -uo pipefail

if [ $# -gt 0 ]; then
  echo "check-command-spelling: expected no arguments" >&2
  echo "  usage: check-command-spelling.sh" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  echo "check-command-spelling: could not resolve a repository root from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi

PATTERN='(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)'

EXEMPTIONS=(
  # (a) the gate-8 fenced block, typed by a person in a session with the plugin installed
  'docs/development.md|line|/harness-analyze --dry-run'
  'docs/development.md|line|/harness-analyze'
  # (b) a bare spelling quoted as the measured subject of a record
  'docs/development.md|contains|**A third debt belongs to no row at all, and it is paid:**'
  'cli/templates/scripts/autonomous-watcher.sh|contains|#   "/branch-start-plan-autonomous": exit 0'
  'cli/templates/scripts/autonomous-watcher.sh|contains|#     `/branch-start-plan-autonomous`. The instructions'
  'scripts/autonomous-watcher.sh|contains|#   "/branch-start-plan-autonomous": exit 0'
  'scripts/autonomous-watcher.sh|contains|#     `/branch-start-plan-autonomous`. The instructions'
  'cli/src/commands/init.ts|contains|claude -p "/harness-analyze" --permission-mode plan'
  'docs/outer-loop-verification.md|contains|| `task` | `/branch-start-plan-autonomous` |'
  'docs/outer-loop-verification.md|contains|| `user_review` | `/branch-start-user-review-fix-autonomous` |'
  'docs/outer-loop-verification.md|contains|| `docs` | `/branch-start-docs-autonomous` |'
  # (c) the watcher first-message strings, while the measured route is `bare`
  'cli/templates/scripts/autonomous-watcher.sh|line|ENGINE_COMMAND_TASK="/branch-start-plan-autonomous"'
  'cli/templates/scripts/autonomous-watcher.sh|line|ENGINE_COMMAND_USER_REVIEW="/branch-start-user-review-fix-autonomous"'
  'cli/templates/scripts/autonomous-watcher.sh|line|ENGINE_COMMAND_DOCS="/branch-start-docs-autonomous"'
  'cli/templates/scripts/autonomous-watcher.sh|line|#   <branch>_task_prompt.md   -> /branch-start-plan-autonomous'
  'cli/templates/scripts/autonomous-watcher.sh|line|#   <branch>_review[_<n>].md  -> /branch-start-user-review-fix-autonomous'
  'cli/templates/scripts/autonomous-watcher.sh|line|#   <branch>_docs.md          -> /branch-start-docs-autonomous'
  'scripts/autonomous-watcher.sh|line|ENGINE_COMMAND_TASK="/branch-start-plan-autonomous"'
  'scripts/autonomous-watcher.sh|line|ENGINE_COMMAND_USER_REVIEW="/branch-start-user-review-fix-autonomous"'
  'scripts/autonomous-watcher.sh|line|ENGINE_COMMAND_DOCS="/branch-start-docs-autonomous"'
  'scripts/autonomous-watcher.sh|line|#   <branch>_task_prompt.md   -> /branch-start-plan-autonomous'
  'scripts/autonomous-watcher.sh|line|#   <branch>_review[_<n>].md  -> /branch-start-user-review-fix-autonomous'
  'scripts/autonomous-watcher.sh|line|#   <branch>_docs.md          -> /branch-start-docs-autonomous'
  'docs/watcher.md|contains|| `<branch>_task_prompt.md` | `/branch-start-plan-autonomous` |'
  'docs/watcher.md|contains|| `<branch>_review[_<n>].md` | `/branch-start-user-review-fix-autonomous` |'
  'docs/watcher.md|contains|| `<branch>_docs.md` | `/branch-start-docs-autonomous` |'
)

findings=0
finding() {
  echo "check-command-spelling: $1 — $2" >&2
  findings=$((findings + 1))
}

# Newline-separated `<path>:<line>` keys covered by an entry that covers exactly one line.
exempt_keys=$'\n'

for entry in "${EXEMPTIONS[@]+"${EXEMPTIONS[@]}"}"; do
  e_path="${entry%%|*}"
  rest="${entry#*|}"
  e_kind="${rest%%|*}"
  e_text="${rest#*|}"
  covered=()
  if [ -f "$e_path" ]; then
    n=0
    while IFS= read -r line || [ -n "$line" ]; do
      n=$((n + 1))
      case "$e_kind" in
        line)
          stripped="${line%"${line##*[![:space:]]}"}"
          [ "$stripped" = "$e_text" ] && covered+=("$n")
          ;;
        contains)
          case "$line" in *"$e_text"*) covered+=("$n") ;; esac
          ;;
        *)
          finding "${e_path}:0" "unknown exemption kind '${e_kind}': ${e_text}"
          continue 2
          ;;
      esac
    done <"$e_path"
  fi
  if [ ${#covered[@]} -eq 0 ]; then
    finding "${e_path}:0" "stale exemption: ${e_text}"
  elif [ ${#covered[@]} -gt 1 ]; then
    for n in "${covered[@]}"; do
      finding "${e_path}:${n}" "ambiguous exemption: ${e_text}"
    done
  else
    exempt_keys+="${e_path}:${covered[0]}"$'\n'
  fi
done

# -I skips binary files, whose "Binary file … matches" line carries no line number to report.
matches="$(git --no-pager grep --untracked --no-color -I -nE -e "$PATTERN" -- . \
  ':(exclude).claude/' \
  ':(exclude)examples/notes-app/.claude/' \
  ':(exclude)examples/notes-app/sdlc-harness/' \
  ':(exclude)harness-runs/' \
  ':(exclude)scripts/check-command-spelling.sh')"
status=$?
if [ "$status" -gt 1 ]; then
  echo "check-command-spelling: git grep failed (exit ${status})" >&2
  exit 1
fi

if [ -n "$matches" ]; then
  while IFS= read -r hit; do
    m_path="${hit%%:*}"
    rest="${hit#*:}"
    m_line="${rest%%:*}"
    case "$exempt_keys" in
      *$'\n'"${m_path}:${m_line}"$'\n'*) continue ;;
    esac
    finding "${m_path}:${m_line}" "bare command spelling; write /autonomous-sdlc-harness:<name>"
  done <<<"$matches"
fi

[ "$findings" -eq 0 ] && exit 0
exit 1
