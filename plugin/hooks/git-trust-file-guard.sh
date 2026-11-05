#!/usr/bin/env bash
# git-trust-file-guard.sh — PreToolUse guard for `Edit`, `Write` and
# `NotebookEdit`: refuse a file-tool call whose target is `.git/commondir`,
# `.git/config.worktree` or `.git/objects/info/http-alternates`, or a path under
# one, however the path is spelled; stay SILENT on every other path. Each of the
# three redirects git to another repository or another config, so a run copy
# must never carry one a session wrote (docs/cli.md §6 residual 12). On a
# bubblewrap host the run copy's own `Edit` rules for these paths are dropped
# (`autonomous-watcher.sh` → `run_profile_edit_drops`), and this guard is what
# refuses the file tools there.
#
# NO JURISDICTION TEST, DELIBERATELY. This guard reads no `harness.config.json`
# and does not source `lib/harness-config-lib.sh`: it applies on every platform
# and in every session that loads the plugin, adopted repository or not. What it
# protects is git's own redirection files in any repository, and refusing a
# file-tool write to them costs nothing anywhere.
#
# NO TOP-LEVEL STRING FILTER, DELIBERATELY. Every other guard but
# `allow-qa-credentials-read.sh` runs a cheap string test before `jq`; this one
# runs none, for two reasons. A filter on the three names would let a non-JSON
# payload through silently, and malformed input must be refused, not silenced.
# And a symlinked leaf (`<repo>/innocent` → `.git/config.worktree`) carries no
# trio name in its path, so a name filter would miss it. The cost, per `Edit`,
# `Write` or `NotebookEdit` call in every session that loads the plugin, is one
# `jq`, plus the `cd -P` / `pwd -P` subshell, plus `readlink` on the
# symlinked-leaf branch only — and nothing on a Bash call, which never reaches
# this guard. That cost is DERIVED from the code, not measured; the measured
# latency is owed in `docs/guard-verification.md`.
#
# ONE BINARY BEYOND `git` AND `jq`. A target that is itself a symbolic link is
# followed with `readlink` (no `-f`, which macOS's older `readlink` lacks), at
# most 8 hops. Only that branch runs it; a missing or failing `readlink`, or a
# chain past the hop limit, is refused (plugin/hooks/README.md →
# ## Prerequisites records the exception).
#
# NO SANDBOX MOUNT. The guard creates nothing and mounts nothing, so the
# sandbox's placeholder mounts are untouched by it. Measured on Linux: AP1–AP6
# pass on this guard's head, with the same placeholders as before it
# (docs/sandbox-verification.md §5, 2026-10-31, Claude Code 2.1.316).
#
# WHAT IS CHECKED. The target (`.tool_input.file_path`, or
# `.tool_input.notebook_path` for `NotebookEdit`) is made absolute against
# `.cwd`, else `$PWD`, and then tested in each of these forms:
#   - LEXICAL: repeated `/` collapsed, `.` dropped, `..` resolved by text,
#     trailing `/` stripped;
#   - PHYSICAL: the deepest existing ancestor directory of the path as written,
#     `..` included, resolved by `cd -P` / `pwd -P`, with the remaining segments
#     appended and normalised lexically — catches a symlinked parent and a `..`
#     that crosses one;
#   - SYMLINKED LEAF: when the path as written, or its lexical form, is an
#     existing symbolic link, the chain's end, in both forms above.
# A form that ends in one of the three, or carries one followed by `/`, is
# refused. The match ignores case: on macOS's default filesystem
# `.GIT/COMMONDIR` is the same file.
#
# FAIL-CLOSED TABLE — this guard emits `deny` or nothing:
#
#   a target in any form above ending in, or under, one of the three -> deny
#   payload not JSON, or not exactly one JSON object                  -> deny
#   `.tool_name` not `Edit`, `Write` or `NotebookEdit`                -> deny
#   the expected path field missing, not a string, or empty           -> deny
#   `jq` absent, or exiting non-zero (too old, or cannot run)         -> deny
#   `readlink` absent or failing, or more than 8 hops                 -> deny
#   the existing ancestor directory not resolvable by `cd -P`         -> deny
#   anything else                                                     -> SILENT
#
# A MISSING `jq` THEREFORE REFUSES EVERY FILE-TOOL CALL in a session that loads
# the plugin, with a reason naming `jq`. The `jq` expression below uses nothing
# past the 1.5 floor, so an older `jq` either decides as usual or refuses —
# never goes silent. The refusal is printed without `jq`.
#
# REPRO — reproduce any decision by hand; the payload goes in on stdin. Build a
# fixture first: `git init /tmp/r`, `mkdir -p /tmp/r/.git/objects/info /tmp/r/sub`,
# `ln -s /tmp/r/.git /tmp/gl`.
#
#   printf '{"tool_name":"Write","tool_input":{"file_path":"/tmp/r/.git/commondir"},"cwd":"/tmp"}' \
#     | bash plugin/hooks/git-trust-file-guard.sh
#
#   file_path /tmp/r/.git/commondir                      -> permissionDecision "deny"
#   file_path /tmp/r/.git/config.worktree                -> "deny"
#   file_path /tmp/r/.git/objects/info/http-alternates   -> "deny"
#   tool_name "Edit" with the same file_path             -> "deny"
#   tool_name "NotebookEdit", tool_input
#     {"notebook_path":"/tmp/r/.git/commondir"}          -> "deny"
#   file_path /tmp/r/.git/commondir/x                    -> "deny" (under one)
#   file_path /tmp/r/sub/../.git/config.worktree         -> "deny" (a `..` form)
#   file_path /tmp/gl/commondir                          -> "deny", reason naming
#                                                           /tmp/r/.git/commondir
#   file_path /tmp/r/.git/config.worktree.bak            -> no output, exit 0
#   file_path /tmp/r/commondir                           -> no output, exit 0
#
#   A non-JSON payload is refused:
#
#   printf 'not json' | bash plugin/hooks/git-trust-file-guard.sh   -> "deny"
#
#   With `jq` off PATH every payload is refused, with a reason naming jq:
#
#   printf '{}' | PATH=/nonexistent /bin/bash plugin/hooks/git-trust-file-guard.sh
#
#   A symlinked leaf: `ln -s .git/config.worktree /tmp/r/innocent`, then
#   file_path /tmp/r/innocent                            -> "deny"

set -u
set -f

GUARD=git-trust-file-guard

# A JSON string body, built without `jq` so a missing `jq` can still be refused.
json_string() {
  local s=$1 out="" c i code bs='\'
  s=${s//"$bs"/"$bs$bs"}
  s=${s//\"/\\\"}
  if [[ $s == *[[:cntrl:]]* ]]; then
    local LC_ALL=C
    for ((i = 0; i < ${#s}; i++)); do
      c=${s:i:1}
      if [[ $c == [[:cntrl:]] ]]; then
        printf -v code '\\u%04x' "'$c"
        out=$out$code
      else
        out=$out$c
      fi
    done
    s=$out
  fi
  printf '%s' "$s"
}

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' \
    "$(json_string "$GUARD: $1")"
  exit 0
}

command -v jq >/dev/null 2>&1 \
  || deny "jq 1.5 or newer is not on PATH, so the target path cannot be read; refusing (plugin/hooks/README.md → ## Prerequisites)"

payload=$(cat)

# One `jq`, 1.5 constructs only: `-s` so trailing input is judged too, `@sh` so
# a path carrying a newline or a quote reaches bash intact.
fields=$(printf '%s' "$payload" | jq -rs '
  def bad(r): ["bad", r] | @sh;
  def nul: type == "string" and ((explode | map(select(. == 0)) | length) > 0);
  if length != 1 then bad("the payload is not exactly one JSON value")
  elif (.[0] | type) != "object" then bad("the payload is not a JSON object")
  else .[0]
  | (.tool_name) as $t
  | (.tool_input | if type == "object" then . else {} end) as $ti
  | (if $t == "NotebookEdit" then "notebook_path" else "file_path" end) as $k
  | ($ti | .[$k]) as $p
  | (.cwd | if type == "string" then . else "" end) as $c
  | if ($t == "Edit" or $t == "Write" or $t == "NotebookEdit") | not then
      bad("tool_name is not Edit, Write or NotebookEdit")
    elif ($p | type) != "string" then bad("tool_input.\($k) is missing or not a string")
    elif $p == "" then bad("tool_input.\($k) is empty")
    elif ($p | nul) or ($c | nul) then bad("the path or cwd carries a NUL byte")
    else ["ok", $t, $c, $p] | @sh
    end
  end' 2>/dev/null) \
  || deny "the payload could not be parsed by jq (not JSON, or a jq older than 1.5 or unable to run), so the target path cannot be read; refusing"

[ -n "$fields" ] || deny "jq printed nothing for the payload, so the target path cannot be read; refusing"
eval "set -- $fields"
[ "${1-}" = ok ] || deny "${2:-the payload could not be read}; refusing"
tool=$2
cwd=$3
given=$4

# Lexical normalisation: no filesystem access.
lexical() {
  local IFS=/ seg out="" n=0 i
  local -a parts=()
  for seg in $1; do
    case $seg in
      '' | .) ;;
      ..) [ "$n" -gt 0 ] && n=$((n - 1)) ;;
      *) parts[n]=$seg; n=$((n + 1)) ;;
    esac
  done
  for ((i = 0; i < n; i++)); do out=$out/${parts[i]}; done
  printf '%s' "${out:-/}"
}

# Physical form: deepest existing ancestor directory of the path as written,
# resolved by the kernel, plus the remaining segments normalised lexically.
physical() {
  local p=$1 rest="" base
  while [ "${#p}" -gt 1 ] && [ "${p%/}" != "$p" ]; do p=${p%/}; done
  while [ ! -d "$p" ]; do
    rest=/${p##*/}$rest
    p=${p%/*}
    [ -n "$p" ] || p=/
  done
  base=$(CDPATH= cd -P -- "$p" 2>/dev/null && pwd -P) || return 1
  lexical "$base$rest"
}

# The end of a symbolic-link chain starting at $1, at most 8 hops.
follow_leaf() {
  local t=$1 link hops=0
  while [ -L "$t" ]; do
    hops=$((hops + 1))
    [ "$hops" -le 8 ] || return 2
    link=$(readlink -- "$t" 2>/dev/null) || return 1
    [ -n "$link" ] || return 1
    case $link in
      /*) t=$link ;;
      *) t=${t%/*}/$link ;;
    esac
  done
  printf '%s' "$t"
}

case $given in
  /*) abs=$given ;;
  *)
    abs=${cwd:-$PWD}/$given
    case $abs in /*) ;; *) abs=$PWD/$abs ;; esac
    ;;
esac

written=$abs
while [ "${#written}" -gt 1 ] && [ "${written%/}" != "$written" ]; do written=${written%/}; done
lex=$(lexical "$abs")
phys=$(physical "$abs") \
  || deny "refusing $tool on $given: the directory holding it could not be resolved with cd -P"

forms=("$lex" "$phys")
for start in "$written" "$lex"; do
  [ -L "$start" ] || continue
  command -v readlink >/dev/null 2>&1 \
    || deny "refusing $tool on $given: it is a symbolic link and readlink is not on PATH, so its target cannot be checked"
  end=$(follow_leaf "$start")
  case $? in
    0) ;;
    2) deny "refusing $tool on $given: its symbolic-link chain is longer than 8 hops" ;;
    *) deny "refusing $tool on $given: readlink could not read its symbolic-link chain" ;;
  esac
  end_phys=$(physical "$end") \
    || deny "refusing $tool on $given: the directory holding its link target could not be resolved with cd -P"
  forms+=("$(lexical "$end")" "$end_phys")
done

shopt -s nocasematch
for form in "${forms[@]}"; do
  for trio in /.git/commondir /.git/config.worktree /.git/objects/info/http-alternates; do
    if [[ $form == *"$trio" || $form == *"$trio"/* ]]; then
      resolved=""
      [ "$form" = "$given" ] || resolved=" (resolves to $form)"
      deny "refusing $tool on $given$resolved: .git/commondir, .git/config.worktree and .git/objects/info/http-alternates redirect git to another repository or config; a run copy must never carry one written by a session (docs/cli.md §6 residual 12)"
    fi
  done
done

exit 0
