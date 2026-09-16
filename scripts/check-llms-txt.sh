#!/usr/bin/env bash
# check-llms-txt.sh — fail when a link in `llms.txt` would not resolve on `main`. Hand-written for
# this repository, like run-gates.sh, which runs it as gate 6c; `docs/development.md` §5 gate 6
# states the contract in prose.
#
# THE CONTRACT.
#   1. Line 1 is exactly `# autonomous-sdlc-harness`.
#   2. A line starting `> ` appears before the first line starting `## `.
#   3. Every `](…)` target is `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/<path>`
#      with <path> a tracked file, or `…/tree/main/<path>` with <path> a tracked directory.
#   4. No target carries `#` or `?`, and no target has any other form.
#   5. No <path> equals, or starts with `<entry>/` for, an entry of publish-main.sh's `removed_paths`.
#
# WHY "TRACKED, MINUS removed_paths" IS "ON main". publish-main.sh builds main's tree as dev's tree
# with the `removed_paths` entries force-removed from the index; its only other change rewrites the
# content of .gitignore. So a path tracked here that matches no removed entry is on the tree
# `publish-main.sh --dry-run` builds from this commit. The list is read out of publish-main.sh at
# run time rather than copied, and finding no entries there is a failure, not an empty set.
# Tracked means the index, so this grades the tree about to be committed.
#
# Usage: check-llms-txt.sh [<file>]
#   <file>  repo-relative; default llms.txt
# Exit: 0 every check passes · 1 one or more findings, each on stderr as
#       `check-llms-txt: <target or line> — <reason>`, all reported · 2 bad usage
set -uo pipefail

if [ $# -gt 1 ]; then
  echo "check-llms-txt: expected at most one argument" >&2
  echo "  usage: check-llms-txt.sh [<file>]" >&2
  exit 2
fi
file="${1:-llms.txt}"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  echo "check-llms-txt: could not resolve a repository root from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi

publish_script="scripts/publish-main.sh"
blob_prefix="https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/"
tree_prefix="https://github.com/firu-daniel/autonomous-sdlc-harness/tree/main/"

findings=0
finding() {
  echo "check-llms-txt: $1 — $2" >&2
  findings=$((findings + 1))
}

if [ ! -f "$file" ]; then
  echo "check-llms-txt: $file — file not found" >&2
  exit 1
fi

removed=()
in_list=0
if [ -f "$publish_script" ]; then
  while IFS= read -r raw || [ -n "$raw" ]; do
    entry="${raw#"${raw%%[![:space:]]*}"}"
    entry="${entry%"${entry##*[![:space:]]}"}"
    if [ "$in_list" -eq 0 ]; then
      [ "$entry" = "removed_paths=(" ] && in_list=1
      continue
    fi
    [ "$entry" = ")" ] && break
    [ -n "$entry" ] && removed+=("$entry")
  done <"$publish_script"
fi
if [ ${#removed[@]} -eq 0 ]; then
  echo "check-llms-txt: ${publish_script} — no removed_paths entries found; refusing to pass without them" >&2
  exit 1
fi

line_no=0
first_line=""
quote_seen=0
heading_seen=0
link_re='\]\(([^)]*)\)'
while IFS= read -r line || [ -n "$line" ]; do
  line_no=$((line_no + 1))
  [ "$line_no" -eq 1 ] && first_line="$line"
  case "$line" in
    "## "*) heading_seen=1 ;;
    "> "*) [ "$heading_seen" -eq 0 ] && quote_seen=1 ;;
  esac

  rest="$line"
  while [[ $rest =~ $link_re ]]; do
    target="${BASH_REMATCH[1]}"
    rest="${rest#*"${BASH_REMATCH[0]}"}"

    case "$target" in
      *"#"* | *"?"*)
        finding "$target" "carries a fragment or query"
        continue
        ;;
    esac

    kind=""
    path=""
    case "$target" in
      "$blob_prefix"*) kind=blob; path="${target#"$blob_prefix"}" ;;
      "$tree_prefix"*) kind=tree; path="${target#"$tree_prefix"}" ;;
      *)
        finding "$target" "not a blob/main or tree/main link to this repository"
        continue
        ;;
    esac
    if [ -z "$path" ]; then
      finding "$target" "names no path"
      continue
    fi

    for entry in "${removed[@]}"; do
      case "$path" in
        "$entry" | "$entry"/*)
          finding "$target" "under '${entry}', which ${publish_script} removes from main"
          continue 2
          ;;
      esac
    done

    if [ "$kind" = blob ]; then
      # --error-unmatch also accepts a directory, so a blob path must match no file beneath it.
      if ! git ls-files --error-unmatch -- ":(literal)$path" >/dev/null 2>&1; then
        finding "$target" "'${path}' is not a tracked file"
      elif [ -n "$(git ls-files -- ":(literal)$path/")" ]; then
        finding "$target" "'${path}' is a directory; a blob link needs a file"
      fi
    else
      if [ -z "$(git ls-files -- ":(literal)$path/")" ]; then
        finding "$target" "'${path}' is not a tracked directory"
      fi
    fi
  done
done <"$file"

if [ "$first_line" != "# autonomous-sdlc-harness" ]; then
  finding "line 1 '${first_line}'" "must be exactly '# autonomous-sdlc-harness'"
fi
if [ "$quote_seen" -eq 0 ]; then
  finding "$file" "no line starting '> ' before the first line starting '## '"
fi

[ "$findings" -eq 0 ] && exit 0
exit 1
