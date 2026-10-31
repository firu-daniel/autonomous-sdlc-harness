#!/usr/bin/env bash
# legs-glob.sh — the sandbox probe's glob-deny leg (rows GW1, GW2), Linux only: how the Linux sandbox
# treats a `sandbox.filesystem.denyWrite` entry containing `*` (docs/sandbox-verification.md §6; the
# generated profile's `_README` stated, until `fix_linux_sandbox_sibling_glob_trio`, that it "may skip
# one, or expand it to the paths that exist when the sandbox starts").
#
# The session runs on a scratch profile, SP__GW_PROFILE, not SP_RUN_PROFILE: the per-run profile also
# carries exact entries for the clone's own paths (autonomous-watcher.sh → THE PER-RUN PROFILE: "The
# base's glob entries are not relied on for the run's own copy"), so a path in the clone is covered by
# a glob alone only once those are removed. The scratch profile drops every denyWrite entry and every
# `Edit(…)` deny rule that carries no `*` (a rule's trailing `/**` aside) and names the clone or a path
# under it; every entry containing a `*` stays.
#
# The rows, each a sandboxed `dd` onto a clone path only a `*` entry covers, recorded as refused or
# written and graded on neither outcome (both are `pass`); each needs the session's control written:
#   GW1  a path that exists when the session starts: an existing file, or a new file in an existing
#        directory
#   GW2  a path that does not exist when the session starts, in a directory that does
# A path under the clone's `.git` is never a target: the runtime refuses writes there with no profile
# entry naming them (docs/sandbox-verification.md §2 CL5), so a refusal would not show the `*` entry
# acted.
#
# THE GRADING AND TARGET FUNCTIONS read only their arguments, the stream and (sp__gw_targets) the
# filesystem:
#   sp__gw_targets <profile> <clone>   SP__GW_EXISTING, SP__GW_ABSENT, SP__GW_EXISTING_ENTRY,
#                                      SP__GW_ABSENT_ENTRY; status 1 when no `*` entry yields a candidate
#   sp__gw_grade <stream> <dd command> SP_VERDICT, SP_EVIDENCE
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP__GW_PROFILE=""
SP__GW_WHY=""
SP__GW_EXISTING=""
SP__GW_ABSENT=""
SP__GW_EXISTING_ENTRY=""
SP__GW_ABSENT_ENTRY=""

# sp__gw_profile — write $SP_TMP/sbx_gw.json and set SP__GW_PROFILE; status 1 with SP__GW_WHY.
sp__gw_profile() {
  local out="$SP_TMP/sbx_gw.json"
  SP__GW_PROFILE=""
  SP__GW_WHY=""
  if ! jq --arg clone "$SP_CLONE" '
    def under($p): $p == $clone or ($p | startswith($clone + "/"));
    def exact_under: type == "string" and (contains("*") | not) and under(.);
    def edit_exact_under:
      type == "string" and startswith("Edit(") and endswith(")")
      and (.[5:-1] | (if endswith("/**") then .[:-3] else . end)
           | (contains("*") | not) and (under(.) or (startswith("//") and under(.[1:]))));
    (if (.sandbox.filesystem.denyWrite | type) == "array"
     then .sandbox.filesystem.denyWrite |= map(select(exact_under | not)) else . end)
    | (if (.permissions.deny | type) == "array"
       then .permissions.deny |= map(select(edit_exact_under | not)) else . end)
    ' "$SP_RUN_PROFILE" 2>/dev/null >"$out"; then
    rm -f -- "$out"
    SP__GW_WHY="could not derive the glob scratch profile from '$SP_RUN_PROFILE'"
    return 1
  fi
  SP__GW_PROFILE="$out"
  return 0
}

sp__gw_targets() {
  local profile="${1:-}" clone="${2%/}" entries entry rest cand kept=0
  SP__GW_EXISTING=""
  SP__GW_ABSENT=""
  SP__GW_EXISTING_ENTRY=""
  SP__GW_ABSENT_ENTRY=""
  [ -n "$clone" ] || return 1
  entries="$(jq -r '.sandbox.filesystem.denyWrite[]? | select(type == "string" and contains("*"))' \
    "$profile" 2>/dev/null)" || return 1
  while IFS= read -r entry; do
    case "$entry" in *'*/'*) ;; *) continue ;; esac
    rest="${entry#*\*/}"
    [ -n "$rest" ] || continue
    cand="$clone/$rest"
    # A candidate still carrying a `*` is not one literal path a dd can name.
    case "$cand" in *'*'*) continue ;; esac
    case "$cand" in $entry) ;; *) continue ;; esac
    case "$cand" in "$clone/.git" | "$clone/.git/"*) continue ;; esac
    kept=1
    if [ -e "$cand" ] || [ -L "$cand" ]; then
      if [ -z "$SP__GW_EXISTING" ]; then
        if [ -d "$cand" ]; then
          SP__GW_EXISTING="$cand/sbx_gw1_new"
        else
          SP__GW_EXISTING="$cand"
        fi
        SP__GW_EXISTING_ENTRY="$entry"
      fi
    elif [ -z "$SP__GW_ABSENT" ] && [ -d "${cand%/*}" ]; then
      SP__GW_ABSENT="$cand"
      SP__GW_ABSENT_ENTRY="$entry"
    fi
  done <<EOF
$entries
EOF
  [ "$kept" -eq 1 ]
}

sp__gw_grade() {
  sp_judge_call "${1:-}" sandbox "${2:-}"
  [ "$SP_VERDICT" = "not run" ] && return 0
  case "$SP_LAYER" in
    sandbox)
      SP_VERDICT=pass
      SP_EVIDENCE="refused: $SP_EVIDENCE"
      ;;
    ran)
      if [ "${SP__STATUS:-}" = error ]; then
        SP_VERDICT="not run"
        SP_EVIDENCE="the call returned an error carrying no refusal string, so neither refused nor written: $SP_EVIDENCE"
      else
        SP_VERDICT=pass
        SP_EVIDENCE="written: the open for writing succeeded, so no entry protected the path: $SP_EVIDENCE"
      fi
      ;;
    permission | file-tool)
      SP_VERDICT="not run"
      SP_EVIDENCE="refused at the $SP_LAYER layer, so it never reached the sandbox: $SP_EVIDENCE"
      ;;
    network)
      SP_VERDICT="not run"
      SP_EVIDENCE="refused at the network layer, which a write to a local path never reaches: $SP_EVIDENCE"
      ;;
    *)
      SP_VERDICT="not run"
      SP_EVIDENCE="unrecognised layer '$SP_LAYER': $SP_EVIDENCE"
      ;;
  esac
  return 0
}

# sp__gw_both <evidence> — GW1 and GW2 `not run`, with no session.
sp__gw_both() {
  sp_result_line glob-deny GW1 "not run" "$1" ""
  sp_result_line glob-deny GW2 "not run" "$1" ""
}

sp_leg_glob_deny() {
  local pfile t1="" t2="" e1="" e2="" w1="" w2="absent" new1=0 ctl="$SP_CLONE/sbx_gw_ctl" departure d
  local c1="" c2=""
  if ! sp__ctl_literal clone "$SP_CLONE"; then
    sp__gw_both "the clone '$SP_CLONE' is not spellable as one literal word"
    return 0
  fi
  if ! sp__gw_profile; then
    sp__gw_both "no scratch profile: $SP__GW_WHY"
    return 0
  fi
  if ! sp__gw_targets "$SP__GW_PROFILE" "$SP_CLONE"; then
    sp__gw_both "the run profile carries no denyWrite entry containing a star that covers a path in the clone"
    return 0
  fi
  t1="$SP__GW_EXISTING"
  e1="$SP__GW_EXISTING_ENTRY"
  t2="$SP__GW_ABSENT"
  e2="$SP__GW_ABSENT_ENTRY"
  if [ -n "$t1" ] && ! sp__ctl_literal "GW1 target" "$t1"; then t1=""; e1="not spellable as one literal word"; fi
  if [ -n "$t2" ] && ! sp__ctl_literal "GW2 target" "$t2"; then t2=""; e2="not spellable as one literal word"; fi
  if [ -z "$t1" ] && [ -z "$t2" ]; then
    sp_result_line glob-deny GW1 "not run" "no existing clone path covered only by a star entry${e1:+: $e1}" ""
    sp_result_line glob-deny GW2 "not run" "no absent clone path with an existing parent covered only by a star entry${e2:+: $e2}" ""
    return 0
  fi

  if [ -n "$t1" ]; then
    if [ -e "$t1" ] || [ -L "$t1" ]; then
      w1="existed"
    else
      w1="a new file in ${t1%/*}, which existed"
      new1=1
      sp_track "$t1"
    fi
    c1="$(sp_dd_cmd "$t1")"
  fi
  if [ -n "$t2" ]; then
    sp_track "$t2"
    c2="$(sp_dd_cmd "$t2")"
  fi

  sp_ctl_prepare gw
  pfile="$SP_TMP/glob-deny.prompt"
  sp_prompt_new "$pfile"
  [ -z "$c1" ] || sp_prompt_bash "$pfile" "$c1"
  [ -z "$c2" ] || sp_prompt_bash "$pfile" "$c2"
  sp_ctl_add "$pfile" written "dd if=/dev/null of=$ctl conv=notrunc" "$ctl"

  sp_session glob-deny "$SP__GW_PROFILE" "$pfile" --cwd "$SP_CLONE" --allowed "$SP_DD_RULE"
  d="$(sp_departures)"
  departure="--settings $SP__GW_PROFILE (SP_RUN_PROFILE without its exact entries under the clone)${d:+; $d}"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session glob-deny did not launch; see $SP_TMP/glob-deny.stderr"
    sp__gw_both "session glob-deny did not launch; see $SP_TMP/glob-deny.stderr"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"
  # The clone is shared with later legs: a file this leg's calls created is removed now.
  [ "$new1" -eq 1 ] && [ -f "$t1" ] && rm -f -- "$t1"
  [ -n "$t2" ] && [ -f "$t2" ] && rm -f -- "$t2"
  [ -f "$ctl" ] && rm -f -- "$ctl"

  if [ -n "$t1" ]; then
    sp__gw_grade "$SP_STREAM" "$c1"
    sp_row_result glob-deny GW1 "$SP_VERDICT" \
      "$t1 (covered only by $e1; $w1 when the session started): $SP_EVIDENCE" "$departure"
  else
    sp_result_line glob-deny GW1 "not run" "no existing clone path covered only by a star entry${e1:+: $e1}" "$departure"
  fi
  if [ -n "$t2" ]; then
    sp__gw_grade "$SP_STREAM" "$c2"
    sp_row_result glob-deny GW2 "$SP_VERDICT" \
      "$t2 (covered only by $e2; $w2 when the session started): $SP_EVIDENCE" "$departure"
  else
    sp_result_line glob-deny GW2 "not run" "no absent clone path with an existing parent covered only by a star entry${e2:+: $e2}" "$departure"
  fi
  return 0
}
