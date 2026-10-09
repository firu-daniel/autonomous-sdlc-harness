#!/usr/bin/env bash
# check-typos.sh — fail when `typos` flags a word in the shipped trees that is not a deliberate one.
# Hand-written for this repository, like check-llms-txt.sh; not an `init` output. run-gates.sh runs
# it as gate 6f.
#
# THE RULE. `typos 1.51.1`, with its default configuration (no `--config`, no `_typos.toml`), over
# `cli/templates`, `plugin`, `schemas` and `cli/src`, reports only the deliberate set below. The set
# is keyed on the file and the flagged word, never a line number:
#   cli/src/generators/githubWorkflows.ts and cli/src/commands/init.ts — `UNPARSEABLE` and
#     `unparseable`; cli/src/doctor/checks.ts — `unparseable`. Each sits inside
#     `UNPARSEABLE_CONTROL_RELEASES`, `UNPARSEABLE_CONTROL_IF_LINE` or `unparseableControlRoute`,
#     exported identifiers other files import by name.
#   plugin/agents/docs-reviewer.md — `ines`: the regular expression `[Ll]ines?`.
#   plugin/instructions/mode_contract.md — `Ein`: the `git grep -Ein` flags.
#   plugin/hooks/lib/harness-config-lib.sh — `fo`: the `--fo` option-prefix example.
# typos is taken from PATH when it reports 1.51.1, else from `uvx --from typos@1.51.1 typos`;
# another version's dictionary is not the one this set was measured against.
#
# Usage: check-typos.sh
# Exit: 0 clean · 1 one or more findings, each on stderr as `check-typos: <path> — <word>`, all
#       reported · 2 bad usage · 4 typos 1.51.1 is not available
set -uo pipefail

version="1.51.1"

if [ $# -gt 0 ]; then
  echo "check-typos: expected no arguments" >&2
  echo "  usage: check-typos.sh" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  echo "check-typos: could not resolve a repository root from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi

typos_cmd=()
if command -v typos >/dev/null 2>&1 && [ "$(typos --version 2>/dev/null)" = "typos-cli ${version}" ]; then
  typos_cmd=(typos)
elif command -v uvx >/dev/null 2>&1; then
  if [ "$(uvx --from "typos@${version}" typos --version 2>/dev/null)" = "typos-cli ${version}" ]; then
    typos_cmd=(uvx --from "typos@${version}" typos)
  else
    echo "check-typos: typos ${version} is not available: not on PATH at that version, and uvx did not provide it" >&2
    exit 4
  fi
else
  echo "check-typos: typos ${version} is not available: not on PATH at that version, and uvx is not on PATH" >&2
  exit 4
fi

# typos exits 2 when it reports a hit; any other non-zero is the tool failing, not a hit.
out="$("${typos_cmd[@]}" --format brief cli/templates plugin schemas cli/src)"
status=$?
if [ "$status" -ne 0 ] && [ "$status" -ne 2 ]; then
  echo "check-typos: typos — exited ${status}" >&2
  exit 1
fi

findings=0
hit_re='^(.+):[0-9]+:[0-9]+: error: `([^`]+)`'
while IFS= read -r line; do
  [ -z "$line" ] && continue
  if [[ ! $line =~ $hit_re ]]; then
    echo "check-typos: typos output — a line not in the brief hit form: ${line}" >&2
    findings=$((findings + 1))
    continue
  fi
  path="${BASH_REMATCH[1]}"
  word="${BASH_REMATCH[2]}"
  case "${path}|${word}" in
    "cli/src/generators/githubWorkflows.ts|UNPARSEABLE" | "cli/src/generators/githubWorkflows.ts|unparseable" | \
    "cli/src/commands/init.ts|UNPARSEABLE" | "cli/src/commands/init.ts|unparseable" | \
    "cli/src/doctor/checks.ts|unparseable" | \
    "plugin/agents/docs-reviewer.md|ines" | \
    "plugin/instructions/mode_contract.md|Ein" | \
    "plugin/hooks/lib/harness-config-lib.sh|fo")
      continue
      ;;
  esac
  echo "check-typos: ${path} — ${word}" >&2
  findings=$((findings + 1))
done <<<"$out"

[ "$findings" -eq 0 ] && exit 0
exit 1
