#!/usr/bin/env bash
# controls.sh — the sandbox probe's positive controls and the gate every refusal row is printed through.
# It carries docs/sandbox-verification.md → `## 0. Method`: "a positive control in the same session for
# every refusal". A refusal row whose session's controls did not all hold prints `not run` with the
# evidence `control did not succeed: <command>: <judgement>`, so a refusal the session itself caused (a
# broken launch, a wrapper that refuses everything, a dead proxy) never reads as `pass`.
#
# THE CONTROL API. It launches no session; each leg names its own controls and issues them after the
# calls it measures, so a session that died part-way leaves its control unissued.
#   sp_ctl_clone             cut the control clone SP_CTL_CLONE on SP_CTL_BRANCH, once; status 1 and
#                            SP_CTL_REFUSAL when it could not be cut
#   sp_ctl_prepare <tag>     before a session: clear the control list and SP_CTL_OK; with a control clone,
#                            write sbx_ctl_<tag>.txt in it and record the ref and origin tip before
#   sp_ctl_add <prompt file> commit <tag> | push | refresh | ran <command> | written <command> <path>
#              | tool <Read|Edit|Write> <path>
#                            append one control call to the prompt and to the control list
#   sp_ctl_held <stream>     after the session: SP_CTL_OK=1 when every control held, 0 with SP_CTL_EVIDENCE
#                            naming the first that did not, empty when the list is empty
#   sp_row_result [--direct] <leg> <row> <verdict> <evidence> <departure>
#                            sp_result_line, gated on SP_CTL_OK
#
# The wrapper controls act on the control clone, never on the measured clone: a control moving the
# measured repository's refs would move what the refusal row is judged by. The control clone is never
# planted and its per-run profile is never a session's --settings. Teardown removes it with every
# registered clone.
#
# A wrapper control is a call to a main-checkout wrapper, so it carries no `$` at all, subject included
# (.claude/context/conventions.md → `## Shell assets`).
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_CTL_CLONE=""
SP_CTL_BRANCH=""
SP_CTL_REFUSAL=""
SP_CTL_REF_BEFORE=""
SP_CTL_TIP_BEFORE=""
SP_CTL_OK=""
SP_CTL_EVIDENCE=""
SP__CTL_TRIED=0
# The control list, one entry per index: kind, the exact Bash command (empty for `tool`, and for a
# wrapper control added without a control clone), the tool name, and the path judged.
SP__CTL_KIND=()
SP__CTL_CMD=()
SP__CTL_TOOL=()
SP__CTL_PATH=()

# sp__ctl_reset — clear the control list and the previous session's verdict.
sp__ctl_reset() {
  SP__CTL_KIND=()
  SP__CTL_CMD=()
  SP__CTL_TOOL=()
  SP__CTL_PATH=()
  SP_CTL_OK=""
  SP_CTL_EVIDENCE=""
}

# sp__ctl_push_entry <kind> <command> <tool> <path>
sp__ctl_push_entry() {
  local i=${#SP__CTL_KIND[@]}
  SP__CTL_KIND[$i]="$1"
  SP__CTL_CMD[$i]="$2"
  SP__CTL_TOOL[$i]="$3"
  SP__CTL_PATH[$i]="$4"
}

# sp__ctl_literal <what> <value> — status 1, refusing, when <value> would not survive as one literal word
# of an exact command: empty, or carrying a `$`, a quote, a backslash, whitespace or a newline.
sp__ctl_literal() {
  case "${2:-}" in
    "" | *'$'* | *"'"* | *'"'* | *'\'* | *[[:space:]]*)
      sp_refuse "sp_ctl: $1 '${2:-}' is empty or not spellable as a literal (no \$, quote, backslash or space)"
      return 1
      ;;
  esac
  return 0
}

sp_ctl_clone() {
  local err line last=""
  if [ "$SP__CTL_TRIED" -eq 1 ]; then
    [ -n "$SP_CTL_CLONE" ] && return 0
    return 1
  fi
  SP__CTL_TRIED=1
  if [ -z "${SP_BRANCH:-}" ] || [ -z "${SP_TMP:-}" ]; then
    SP_CTL_REFUSAL="sp_ctl_clone: no probe branch or temp area (sp_setup has not run)"
    sp_refuse "$SP_CTL_REFUSAL"
    return 1
  fi
  # sp_extra_clone's refusal is its last stderr line; capture it, then replay all of stderr.
  err="$SP_TMP/ctl-clone.stderr"
  if sp_extra_clone "${SP_BRANCH}_ctl" --no-bootstrap 2>"$err"; then
    # Copied at once: the next sp_extra_clone overwrites SP_EXTRA_*.
    SP_CTL_CLONE="$SP_EXTRA_CLONE"
    SP_CTL_BRANCH="${SP_BRANCH}_ctl"
    cat -- "$err" >&2
    return 0
  fi
  while IFS= read -r line; do
    [ -n "$line" ] && last="$line"
  done <"$err"
  cat -- "$err" >&2
  SP_CTL_CLONE=""
  SP_CTL_REFUSAL="${last:-sp_extra_clone refused the control clone with no message}"
  return 1
}

sp_ctl_prepare() {
  local tag="${1:-}" file
  sp__ctl_reset
  SP_CTL_REF_BEFORE=""
  SP_CTL_TIP_BEFORE=""
  [ -n "$SP_CTL_CLONE" ] || return 0
  case "$tag" in
    "" | *[!A-Za-z0-9_-]*)
      sp_refuse "sp_ctl_prepare: tag '$tag' is empty or carries a character outside [A-Za-z0-9_-]"
      return 1
      ;;
  esac
  file="$SP_CTL_CLONE/sbx_ctl_$tag.txt"
  if [ -e "$file" ] || [ -L "$file" ]; then
    sp_refuse "sp_ctl_prepare: '$file' already exists; each session's control file is a new one"
    return 1
  fi
  if ! printf 'sandbox probe control %s\n' "$tag" >"$file" 2>/dev/null; then
    sp_refuse "sp_ctl_prepare: could not write '$file'"
    return 1
  fi
  SP_CTL_REF_BEFORE="$(git -C "$SP_CTL_CLONE" rev-parse --verify -q "refs/heads/$SP_CTL_BRANCH" 2>/dev/null)" ||
    SP_CTL_REF_BEFORE=""
  SP_CTL_TIP_BEFORE="$(sp_remote_tip "$SP_MAIN" "$SP_CTL_BRANCH")"
  return 0
}

sp_ctl_add() {
  local pfile="${1:-}" kind="${2:-}" cmd="" tool="" path="" sentence i has_commit=0
  if [ $# -lt 2 ]; then
    sp_refuse "usage: sp_ctl_add <prompt file> <commit|push|refresh|ran|written|tool> [<arg>...]"
    return 1
  fi
  shift 2
  case "$kind" in
    commit | push | refresh)
      if [ "$kind" = push ]; then
        i=0
        while [ "$i" -lt "${#SP__CTL_KIND[@]}" ]; do
          [ "${SP__CTL_KIND[$i]}" = commit ] && has_commit=1
          i=$((i + 1))
        done
        if [ "$has_commit" -eq 0 ]; then
          sp_refuse "sp_ctl_add: a push control needs a commit control earlier in the same session"
          return 1
        fi
      fi
      if [ "$kind" = commit ]; then
        [ $# -eq 1 ] || { sp_refuse "usage: sp_ctl_add <prompt file> commit <tag>"; return 1; }
        case "$1" in
          "" | *[!A-Za-z0-9_-]*)
            sp_refuse "sp_ctl_add: commit tag '$1' is empty or carries a character outside [A-Za-z0-9_-]"
            return 1
            ;;
        esac
        path="sbx_ctl_$1.txt"
      else
        [ $# -eq 0 ] || { sp_refuse "usage: sp_ctl_add <prompt file> $kind"; return 1; }
      fi
      # Without a control clone the entry is recorded with no call, and sp_ctl_held reports it as not held.
      if [ -z "$SP_CTL_CLONE" ]; then
        sp__ctl_push_entry "$kind" "" "" "$path"
        return 0
      fi
      sp__ctl_literal "scripts directory" "$SP_SCRIPTS" || return 1
      sp__ctl_literal "control clone" "$SP_CTL_CLONE" || return 1
      case "$kind" in
        commit)
          cmd="bash $SP_SCRIPTS/commit-on-branch.sh --repo $SP_CTL_CLONE $path -- \"sandbox probe control $1\""
          ;;
        push) cmd="bash $SP_SCRIPTS/push-branch.sh $SP_CTL_CLONE" ;;
        refresh) cmd="bash $SP_SCRIPTS/refresh-branch.sh $SP_CTL_CLONE" ;;
      esac
      sp_prompt_bash "$pfile" "$cmd" || return 1
      ;;
    ran)
      [ $# -eq 1 ] || { sp_refuse "usage: sp_ctl_add <prompt file> ran <exact command>"; return 1; }
      cmd="$1"
      sp_prompt_bash "$pfile" "$cmd" || return 1
      ;;
    written)
      [ $# -eq 2 ] || { sp_refuse "usage: sp_ctl_add <prompt file> written <exact command> <path>"; return 1; }
      cmd="$1"
      path="$2"
      [ -n "$path" ] || { sp_refuse "sp_ctl_add: written needs a path"; return 1; }
      sp_track "$path" || return 1
      sp_prompt_bash "$pfile" "$cmd" || return 1
      ;;
    tool)
      [ $# -eq 2 ] || { sp_refuse "usage: sp_ctl_add <prompt file> tool <Read|Edit|Write> <path>"; return 1; }
      tool="$1"
      path="$2"
      [ -n "$path" ] || { sp_refuse "sp_ctl_add: tool needs a path"; return 1; }
      case "$tool" in
        Read) sentence="Read, with file_path set to exactly $path." ;;
        Edit) sentence="Edit, with file_path set to exactly $path (after a Read of that same path), appending the line: sandbox probe control" ;;
        Write)
          sp_track "$path" || return 1
          sentence="Write, with file_path set to exactly $path and content set to exactly: sandbox probe control"
          ;;
        *) sp_refuse "sp_ctl_add: tool '$tool' is not Read, Edit or Write"; return 1 ;;
      esac
      sp_prompt_tool "$pfile" "$sentence" || return 1
      ;;
    *)
      sp_refuse "sp_ctl_add: unknown control kind '$kind' (commit, push, refresh, ran, written, tool)"
      return 1
      ;;
  esac
  sp__ctl_push_entry "$kind" "$cmd" "$tool" "$path"
  return 0
}

# sp__ctl_judge <stream> <index> — sets SP__CTL_HELD (1|0) and SP__CTL_WHY for one control.
sp__ctl_judge() {
  local stream="$1" i="$2" kind cmd tool path porcelain
  kind="${SP__CTL_KIND[$i]}"
  cmd="${SP__CTL_CMD[$i]}"
  tool="${SP__CTL_TOOL[$i]}"
  path="${SP__CTL_PATH[$i]}"
  SP__CTL_HELD=0
  SP__CTL_WHY=""
  if [ "$kind" = tool ]; then
    sp_judge_tool "$stream" ran "$tool" "$path"
    [ "$SP_VERDICT" = pass ] && SP__CTL_HELD=1
    SP__CTL_WHY="$tool $path: $SP_EVIDENCE"
    return 0
  fi
  if [ -z "$cmd" ]; then
    SP__CTL_WHY="$kind control: ${SP_CTL_REFUSAL:-control clone not cut}"
    return 0
  fi
  sp_judge_call "$stream" ran "$cmd"
  if [ "$SP_VERDICT" != pass ]; then
    SP__CTL_WHY="$cmd: $SP_EVIDENCE"
    return 0
  fi
  case "$kind" in
    commit)
      sp_judge_ref "$SP_CTL_CLONE" "refs/heads/$SP_CTL_BRANCH" "$SP_CTL_REF_BEFORE" moved
      [ "$SP_VERDICT" = pass ] && SP__CTL_HELD=1
      SP__CTL_WHY="$cmd: $SP_EVIDENCE"
      ;;
    push)
      sp_judge_push "$SP_MAIN" "$SP_CTL_BRANCH" "$SP_CTL_TIP_BEFORE"
      [ "$SP_VERDICT" = pass ] && SP__CTL_HELD=1
      SP__CTL_WHY="$cmd: $SP_EVIDENCE"
      ;;
    refresh)
      # Untracked files are left out: sp_ctl_prepare's control file is untracked until a commit control.
      if porcelain="$(git -C "$SP_CTL_CLONE" status --porcelain --untracked-files=no 2>&1)"; then
        if [ -z "$porcelain" ]; then
          SP__CTL_HELD=1
          SP__CTL_WHY="$cmd: status --porcelain empty"
        else
          SP__CTL_WHY="$cmd: status --porcelain: ${porcelain%%$'\n'*}"
        fi
      else
        SP__CTL_WHY="$cmd: status --porcelain failed: ${porcelain%%$'\n'*}"
      fi
      ;;
    ran)
      SP__CTL_HELD=1
      SP__CTL_WHY="$cmd: $SP_EVIDENCE"
      ;;
    written)
      if [ -e "$path" ]; then
        SP__CTL_HELD=1
        SP__CTL_WHY="$cmd: $path exists"
      else
        SP__CTL_WHY="$cmd: ran, but $path does not exist"
      fi
      ;;
    *)
      SP__CTL_WHY="unknown control kind '$kind'"
      ;;
  esac
}

sp_ctl_held() {
  local stream="${1:-}" i n
  # The judges write SP_VERDICT and friends; a leg's own row verdict survives this call.
  local keep_verdict="$SP_VERDICT" keep_evidence="$SP_EVIDENCE" keep_layer="$SP_LAYER"
  local keep_layer_evidence="$SP_LAYER_EVIDENCE"
  n=${#SP__CTL_KIND[@]}
  if [ "$n" -eq 0 ]; then
    SP_CTL_OK=""
    SP_CTL_EVIDENCE="no positive control in the session"
    return 0
  fi
  SP_CTL_OK=1
  SP_CTL_EVIDENCE=""
  i=0
  while [ "$i" -lt "$n" ]; do
    sp__ctl_judge "$stream" "$i"
    if [ "$SP__CTL_HELD" -ne 1 ]; then
      SP_CTL_OK=0
      SP_CTL_EVIDENCE="$SP__CTL_WHY"
      break
    fi
    i=$((i + 1))
  done
  SP_VERDICT="$keep_verdict"
  SP_EVIDENCE="$keep_evidence"
  SP_LAYER="$keep_layer"
  SP_LAYER_EVIDENCE="$keep_layer_evidence"
  return 0
}

sp_row_result() {
  local direct=0
  if [ "${1:-}" = --direct ]; then
    direct=1
    shift
  fi
  local leg="${1:-}" row="${2:-}" verdict="${3:-}" evidence="${4:-}" departure="${5:-}"
  if [ "${SP_CTL_OK:-}" = 1 ]; then
    sp_result_line "$leg" "$row" "$verdict" "$evidence" "$departure"
    return $?
  fi
  # --direct passes a `fail` only: a fail that is the protection visibly breaking needs no control,
  # while a refusal-shaped `pass` is exactly what a broken session can fake.
  if [ "$direct" -eq 1 ] && [ "$verdict" = fail ]; then
    sp_result_line "$leg" "$row" "$verdict" "$evidence" "$departure"
    return $?
  fi
  sp_result_line "$leg" "$row" "not run" \
    "control did not succeed: ${SP_CTL_EVIDENCE:-no positive control in the session}" "$departure"
}
