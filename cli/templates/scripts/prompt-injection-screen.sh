#!/usr/bin/env bash
# prompt-injection-screen.sh — the deterministic half of the prompt-injection
# screen: flag, in the untrusted input files a person added to a run, the byte
# classes an LLM is the wrong tool for, and print the SHA-256 the screen's
# record keys on.
#
# A TRIPWIRE, NOT A BOUNDARY. It grants nothing: no exit status, verdict or
# record of this script is a permission for anything, and an adaptive input can
# get past it. The containment that holds is the permission profile, the guard
# hooks, the protected-branch refusals and the sandbox (`docs/sandbox-record.md`).
#
# WHO RUNS IT. The orchestrating session, as
# `bash <scriptsDir>/prompt-injection-screen.sh <verb> …` from the repository
# root, allow-listed by this file's row in `cli/src/generators/outerLoopScripts.ts`.
# It runs the MAIN checkout's copy, never a run copy's: a run copy's scripts are
# writable from inside the sandbox it screens for. It needs no network, runs
# sandboxed, and is never a `sandbox.excludedCommands` entry.
#
# USAGE
#
#   prescan --repo <dir> <repo-relative path>…
#
#   `plan`, `park` and `verdict` are reserved verbs: this copy answers each with
#   the usage error.
#
# PRESCAN OUTPUT — stdout, per path in argument order:
#
#   file <path> sha256 <64 lowercase hex>
#   hit <id> <path>:<line> "<excerpt>"      (zero or more)
#
#   Under `LC_ALL=C`, each id is one `grep -n -E` over the file's UTF-8 bytes,
#   one hit per matching line, ids in this order:
#
#   prescan-invisible     Tags block U+E0000–E007F, U+200B–200D, U+2060, and
#                         U+FEFF anywhere but byte 0 of the file
#   prescan-bidi          U+202A–202E, U+2066–2069
#   prescan-html-comment  `<!--`
#   prescan-encoded-blob  ≥120 of `[A-Za-z0-9+/]` (any `=` padding after it is
#                         irrelevant to the match), or ≥128 hex digits
#   prescan-marker        `=== BEGIN UNTRUSTED DATA` / `=== END UNTRUSTED DATA`
#                         (`plugin/instructions/untrusted_input.md` → `## The markers`)
#
#   The excerpt is the hit line through `pis_excerpt`, which every verb that
#   prints or writes an excerpt uses.
#
# EXIT CODES
#
#   prescan  0  no path has a hit
#            1  at least one path has a hit
#            2  bad usage; a path absent, unreadable, not a regular file, a
#               symbolic link, absolute, or resolving outside `--repo`; neither
#               `sha256sum` nor `shasum` resolves. Every path is checked before
#               anything is printed, so exit 2 prints nothing on stdout.
#   any other verb  2  the usage error.
#   Every exit 2 prints one `prompt-injection-screen: <cause>` line on stderr.
#
# FLOORS. Bash 3.2; no `jq` for `prescan`, which reads no configuration; every
# `mktemp` names an explicit template.
#
# REPRO — in a throwaway fixture wired by `autonomous-sdlc-harness init`:
#
#   printf 'clean\n' > ok.md
#   bash scripts/prompt-injection-screen.sh prescan --repo . ok.md; echo $?
#     -> file ok.md sha256 <hex>, then 0
#   printf 'a <!-- b\n' > bad.md
#   bash scripts/prompt-injection-screen.sh prescan --repo . bad.md; echo $?
#     -> file … then hit prescan-html-comment bad.md:1 "a &lt;!-- b", then 1
#   bash scripts/prompt-injection-screen.sh prescan --repo . ../x.md; echo $?
#     -> one cause line on stderr, 2

set -u

export LC_ALL=C

pis_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -r "$pis_dir/lib/harness-run-lib.sh" ]; then
  printf 'prompt-injection-screen: cannot read %s\n' "$pis_dir/lib/harness-run-lib.sh" >&2
  exit 2
fi
# shellcheck source=/dev/null
. "$pis_dir/lib/harness-run-lib.sh"

PIS_USAGE='usage: prompt-injection-screen.sh prescan --repo <dir> <repo-relative path>…'

pis_usage() {
  printf 'prompt-injection-screen: %s\n%s\n' "$1" "$PIS_USAGE" >&2
  exit 2
}

pis_fault() {
  printf 'prompt-injection-screen: %s\n' "$1" >&2
  exit 2
}

# ERE byte patterns. Each `$'…'` yields raw bytes; under `LC_ALL=C` a bracket
# range over them is a byte range.
PIS_RE_TAGS=$'\xf3\xa0[\x80\x81][\x80-\xbf]'
PIS_RE_ZW=$'\xe2\x80[\x8b-\x8d]'
PIS_RE_WJ=$'\xe2\x81\xa0'
PIS_BOM=$'\xef\xbb\xbf'
PIS_RE_INVISIBLE="$PIS_RE_TAGS|$PIS_RE_ZW|$PIS_RE_WJ|$PIS_BOM"
PIS_RE_BIDI=$'\xe2\x80[\xaa-\xae]|\xe2\x81[\xa6-\xa9]'
PIS_RE_HTML='<!--'
PIS_RE_BLOB='[A-Za-z0-9+/]{120,}|[0-9A-Fa-f]{128,}'
PIS_RE_MARKER='=== (BEGIN|END) UNTRUSTED DATA'

PIS_EXCERPT_MAX=160
PIS_NL='
'

# stateDir of <repo>, for the verbs that write under it — the library's reader,
# the one `autonomous-watcher.sh` → `run_state_dir` uses. Needs `jq`.
pis_state_dir() {
  hr_state_dir "${1-}"
}

# Print <text> made safe to quote: newlines, tabs and CRs become spaces,
# invisible bytes `<invisible>`, bidi bytes `<bidi>`, `<!--` `&lt;!--`, a marker
# string `[marker removed]`; then capped at 160 characters plus `…`, cut only
# before a UTF-8 lead byte. The substitutions run before the cap, so a cut never
# lands inside a neutralised sequence.
pis_excerpt() {
  local s
  s=$(printf '%s' "${1-}" | tr '\n\t\r' '   ' | sed -E \
    -e "s/$PIS_RE_INVISIBLE/<invisible>/g" \
    -e "s/$PIS_RE_BIDI/<bidi>/g" \
    -e 's/<!--/\&lt;!--/g' \
    -e "s/$PIS_RE_MARKER/[marker removed]/g")
  pis_cap "$s"
}

# Print <s> cut to PIS_EXCERPT_MAX characters, `…` appended when cut. A byte
# 0x80–0xBF continues a character and is never the cut point.
pis_cap() {
  local s="${1-}" n i=0 chars=0 b v
  n=${#s}
  while [ "$i" -lt "$n" ]; do
    b=${s:$i:1}
    printf -v v '%d' "'$b"
    [ "$v" -ge 0 ] || v=$((v + 256))
    if [ "$v" -lt 128 ] || [ "$v" -gt 191 ]; then
      [ "$chars" -lt "$PIS_EXCERPT_MAX" ] || break
      chars=$((chars + 1))
    fi
    i=$((i + 1))
  done
  if [ "$i" -lt "$n" ]; then
    printf '%s…' "${s:0:$i}"
  else
    printf '%s' "$s"
  fi
}

# Print the lowercase SHA-256 of <file>; return 2 when no hashing tool resolves
# or its output is not 64 lowercase hex.
pis_sha256() {
  local out h
  if command -v sha256sum >/dev/null 2>&1; then
    out=$(sha256sum < "$1") || return 2
  elif command -v shasum >/dev/null 2>&1; then
    out=$(shasum -a 256 < "$1") || return 2
  else
    return 2
  fi
  h=${out%% *}
  [ "${#h}" -eq 64 ] || return 2
  case "$h" in *[!0-9a-f]*) return 2 ;; esac
  printf '%s\n' "$h"
}

# Set PIS_RESOLVED to <repo_abs>/<rel> made physical, or call pis_fault.
pis_resolve() {
  local repo_abs="$1" rel="$2" full parent base pdir
  case "$rel" in
    '') pis_fault "an empty path was given" ;;
    /*) pis_fault "'$rel' is absolute: paths are relative to --repo" ;;
    *"$PIS_NL"*) pis_fault "a path carries a newline" ;;
  esac
  full="$repo_abs/$rel"
  parent=$(dirname -- "$full")
  base=$(basename -- "$full")
  case "$base" in
    .|..) pis_fault "'$rel' is not a regular file" ;;
  esac
  pdir=$(cd -P -- "$parent" 2>/dev/null && pwd -P) || pis_fault "'$rel' does not exist"
  PIS_RESOLVED="$pdir/$base"
  case "$PIS_RESOLVED" in
    "$repo_abs"/*) ;;
    *) pis_fault "'$rel' resolves outside --repo ($repo_abs)" ;;
  esac
  [ ! -L "$PIS_RESOLVED" ] || pis_fault "'$rel' is a symbolic link"
  [ -e "$PIS_RESOLVED" ] || pis_fault "'$rel' does not exist"
  [ -f "$PIS_RESOLVED" ] || pis_fault "'$rel' is not a regular file"
  [ -r "$PIS_RESOLVED" ] || pis_fault "'$rel' is not readable"
}

PIS_TMP=""
pis_cleanup() {
  [ -z "$PIS_TMP" ] || rm -f -- "$PIS_TMP"
}
trap pis_cleanup EXIT

# Print one `hit` line per line of <scan> matching <re>; return 0 when any
# printed, 1 when none, 2 on a grep fault.
pis_hits() {
  local id="$1" re="$2" rel="$3" scan="$4" out line n status
  out=$(grep -a -n -E -e "$re" -- "$scan")
  status=$?
  [ "$status" -le 1 ] || return 2
  [ "$status" -eq 0 ] || return 1
  printf '%s\n' "$out" | while IFS= read -r line; do
    n=${line%%:*}
    printf 'hit %s %s:%s "%s"\n' "$id" "$rel" "$n" "$(pis_excerpt "${line#*:}")"
  done
  return 0
}

pis_prescan() {
  local repo="" repo_abs rel hash lead scan status=0 r
  local resolved_list="" sep="$PIS_NL"
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --repo)
        [ "$#" -ge 2 ] || pis_usage "--repo needs a directory"
        repo="$2"
        shift 2
        ;;
      --) shift; break ;;
      -*) pis_usage "unknown option '$1'" ;;
      *) break ;;
    esac
  done
  [ -n "$repo" ] || pis_usage "--repo is required"
  [ "$#" -gt 0 ] || pis_usage "no path given"
  repo_abs=$(cd -P -- "$repo" 2>/dev/null && pwd -P) || pis_fault "--repo '$repo' is not a directory"

  command -v sha256sum >/dev/null 2>&1 || command -v shasum >/dev/null 2>&1 \
    || pis_fault "neither sha256sum nor shasum resolves"

  for rel in "$@"; do
    pis_resolve "$repo_abs" "$rel"
    resolved_list="$resolved_list$PIS_RESOLVED$sep"
  done

  for rel in "$@"; do
    PIS_RESOLVED=${resolved_list%%"$sep"*}
    resolved_list=${resolved_list#*"$sep"}
    hash=$(pis_sha256 "$PIS_RESOLVED") || pis_fault "cannot hash '$rel'"
    printf 'file %s sha256 %s\n' "$rel" "$hash"

    # A BOM at byte 0 is not a hit: scan a copy without it. Line numbers are
    # unchanged, since the BOM holds no newline.
    scan="$PIS_RESOLVED"
    lead=$(head -c 3 -- "$PIS_RESOLVED" 2>/dev/null) || lead=""
    if [ "$lead" = "$PIS_BOM" ]; then
      pis_cleanup
      PIS_TMP=$(mktemp "${TMPDIR:-/tmp}/prompt-injection-screen.XXXXXX") \
        || pis_fault "cannot create a temporary file"
      tail -c +4 -- "$PIS_RESOLVED" > "$PIS_TMP" || pis_fault "cannot copy '$rel'"
      scan="$PIS_TMP"
    fi

    for r in \
      "prescan-invisible $PIS_RE_INVISIBLE" \
      "prescan-bidi $PIS_RE_BIDI" \
      "prescan-html-comment $PIS_RE_HTML" \
      "prescan-encoded-blob $PIS_RE_BLOB" \
      "prescan-marker $PIS_RE_MARKER"; do
      pis_hits "${r%% *}" "${r#* }" "$rel" "$scan"
      case $? in
        0) status=1 ;;
        1) ;;
        *) pis_fault "cannot scan '$rel'" ;;
      esac
    done
  done
  return "$status"
}

[ "$#" -gt 0 ] || pis_usage "missing verb"
pis_verb="$1"
shift
case "$pis_verb" in
  prescan) pis_prescan "$@"; exit $? ;;
  plan|park|verdict) pis_usage "verb '$pis_verb' is not available in this copy" ;;
  *) pis_usage "unknown verb '$pis_verb'" ;;
esac
