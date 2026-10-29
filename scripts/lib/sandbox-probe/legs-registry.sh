#!/usr/bin/env bash
# legs-registry.sh — the sandbox probe's registry leg (rows RG1, RG2, RG3), Linux only: the main checkout's
# run registry, SP_REGISTRY (<main>/<stateDir>/autonomous_logs/registry.json), under the per-run profile
# (docs/sandbox-verification.md §4 *The run registry*). Taken by hand on macOS on 2026-10-20, all `pass`:
#   RG1  a sandboxed dd onto the registry is refused while a new file beside it is written (the session's
#        control), and an Edit of it after a Read is refused
#   RG2  a rename onto the registry leaves its inode and shasum unchanged: (a) a direct mv, which macOS
#        stopped at the permission layer, and (b) a helper that stages a copy beside it and renames it
#        back, the library's own mktemp + mv pattern
#   RG3  moving the registry's directory aside from inside the sandbox is refused
#
# On Linux every write deny is a read-only bind mount, so a rename onto the bound file, or of its parent,
# may fail with a message no macOS row shows (`Device or resource busy`, say). RG2 and RG3 are therefore
# graded on the registry's own state, its inode and shasum, and on the rename having failed; the message
# is quoted, never matched.
#
# THE RESTORE RULE. RG3 runs in a session of its own, last, and the probe puts the directory back from
# outside the sandbox at once, through sp__rg_restore. It is registered with session.sh's pending-restore
# slot before that session launches, so an EXIT, INT or TERM during or right after it restores the
# directory before teardown's clone loop reads the registry.
#
# THE GRADING FUNCTIONS read only their arguments and the stream, and set SP_VERDICT and SP_EVIDENCE:
#   sp__rg1_grade <stream> <dd command> <registry path> <sum unchanged: 1|0>
#   sp__rg2_grade <stream> <direct mv command> <helper command> <inode unchanged: 1|0> <sum unchanged: 1|0>
#   sp__rg3_grade <stream> <mv command> <moved: 1|0> <sum unchanged: 1|0> [<restored: 1|0, default 1>]
# and
#   sp__rg_restore <dir>   put <dir>.aside back as <dir>; status 1, naming what is left and raising exit 5
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

sp__rg1_grade() {
  local stream="${1:-}" dd="${2:-}" reg="${3:-}" sum_ok="${4:-0}" dd_v dd_e state
  sp_judge_call "$stream" sandbox "$dd"
  case "$SP_LAYER" in
    sandbox)
      dd_v=pass
      dd_e="dd refused: $SP_EVIDENCE"
      ;;
    "" | unrecognised)
      dd_v="not run"
      dd_e="dd: $SP_EVIDENCE"
      ;;
    permission)
      dd_v="not run"
      dd_e="dd refused at the permission layer, so it never reached the sandbox: $SP_EVIDENCE"
      ;;
    ran)
      if [ "$SP__STATUS" = error ]; then
        dd_v="not run"
        dd_e="dd errored with no refusal string, so neither refused nor written: $SP_LAYER_EVIDENCE"
      else
        dd_v=fail
        dd_e="the dd of $reg was not refused: $SP_LAYER_EVIDENCE"
      fi
      ;;
    *)
      dd_v="not run"
      dd_e="dd refused at the $SP_LAYER layer, not the sandbox: $SP_EVIDENCE"
      ;;
  esac
  # CS7's Edit grade: a permission refusal passes, the Edit tool's read-before-write refusal is `not run`.
  sp__wp_cs7_edit "$stream" "$reg"
  if [ "$sum_ok" = 1 ]; then state="shasum unchanged"; else state="shasum changed"; fi
  if [ "$dd_v" = fail ] || [ "$SP__WP_EDIT_V" = fail ] || [ "$sum_ok" != 1 ]; then
    SP_VERDICT=fail
  elif [ "$dd_v" = "not run" ] || [ "$SP__WP_EDIT_V" = "not run" ]; then
    SP_VERDICT="not run"
  else
    SP_VERDICT=pass
  fi
  SP_EVIDENCE="$dd_e; $SP__WP_EDIT_E; $state"
  return 0
}

sp__rg2_grade() {
  local stream="${1:-}" mv_a="${2:-}" hcmd="${3:-}" ino_ok="${4:-0}" sum_ok="${5:-0}" a_e b_v b_e line state
  sp_judge_call "$stream" sandbox "$mv_a"
  case "$SP_LAYER" in
    "") a_e="(a) $SP_EVIDENCE" ;;
    ran)
      if [ "$SP__STATUS" = error ]; then
        a_e="(a) failed with no refusal string: $SP_LAYER_EVIDENCE"
      else
        a_e="(a) ran, not refused: $SP_LAYER_EVIDENCE"
      fi
      ;;
    *) a_e="(a) refused at the $SP_LAYER layer: $SP_LAYER_EVIDENCE" ;;
  esac
  sp_judge_call "$stream" sandbox "$hcmd"
  if [ -z "$SP_LAYER" ]; then
    b_v="not run"
    b_e="(b) $SP_EVIDENCE"
  elif [ "$SP_LAYER" = permission ]; then
    b_v="not run"
    b_e="(b) refused at the permission layer, so the helper never ran: $SP_LAYER_EVIDENCE"
  elif line="$(sp__line_with "$SP__TEXT" "sbx_rg2_mv ")"; then
    case "$line" in
      "sbx_rg2_mv landed"*)
        b_v=fail
        b_e="(b) the helper's rename landed on the registry: $line"
        ;;
      "sbx_rg2_mv refused: "*)
        b_v=pass
        b_e="(b) $line"
        ;;
      *)
        b_v="not run"
        b_e="(b) the helper's line is neither landed nor refused: $line"
        ;;
    esac
  else
    b_v="not run"
    b_e="(b) the helper printed no sbx_rg2_mv line: $(sp__message_line "$SP__TEXT")"
  fi
  if [ "$ino_ok" = 1 ]; then state="inode unchanged"; else state="inode changed"; fi
  if [ "$sum_ok" = 1 ]; then state="$state, shasum unchanged"; else state="$state, shasum changed"; fi
  if [ "$ino_ok" != 1 ] || [ "$sum_ok" != 1 ] || [ "$b_v" = fail ]; then
    SP_VERDICT=fail
  elif [ "$b_v" = "not run" ]; then
    SP_VERDICT="not run"
  else
    SP_VERDICT=pass
  fi
  SP_EVIDENCE="$a_e; $b_e; $state"
  return 0
}

sp__rg3_grade() {
  local stream="${1:-}" mv="${2:-}" moved="${3:-0}" sum_ok="${4:-0}" restored="${5:-1}"
  if [ "$moved" = 1 ]; then
    SP_VERDICT=fail
    if [ "$restored" = 1 ]; then
      SP_EVIDENCE="the registry's directory was moved aside from inside the sandbox; the probe restored it"
    else
      SP_EVIDENCE="the registry's directory was moved aside from inside the sandbox; the probe could not restore it"
    fi
    return 0
  fi
  sp_judge_call "$stream" sandbox "$mv"
  if [ "$sum_ok" != 1 ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="the registry's shasum changed, though its directory was not moved aside: ${SP_LAYER_EVIDENCE:-$SP_EVIDENCE}"
    return 0
  fi
  case "$SP_LAYER" in
    "")
      SP_VERDICT="not run"
      SP_EVIDENCE="the mv was not issued: $SP_EVIDENCE"
      ;;
    permission)
      SP_VERDICT="not run"
      SP_EVIDENCE="the mv was refused at the permission layer, so it never reached the sandbox: $SP_LAYER_EVIDENCE"
      ;;
    ran)
      if [ "$SP__STATUS" = error ]; then
        SP_VERDICT=pass
        SP_EVIDENCE="refused: $SP_LAYER_EVIDENCE"
      else
        SP_VERDICT="not run"
        SP_EVIDENCE="the mv reported success, yet the directory was not found moved aside: $SP_LAYER_EVIDENCE"
      fi
      ;;
    *)
      SP_VERDICT=pass
      SP_EVIDENCE="refused: $SP_LAYER_EVIDENCE"
      ;;
  esac
  return 0
}

# sp__rg_restore <dir> — acts only when <dir>.aside exists; idempotent. Never a recursive removal
# (.claude/context/conventions.md → `## Shell assets`): only the session's zero-byte dd file and an empty
# <dir> are removed. An absent <dir> means an interrupt landed between the mv and the mkdir.
sp__rg_restore() {
  local dir="${1%/}" aside out
  [ -n "$dir" ] || return 0
  aside="$dir.aside"
  [ -e "$aside" ] || [ -L "$aside" ] || return 0
  if [ -d "$dir" ] && [ ! -L "$dir" ]; then
    if [ -f "$dir/registry.json" ] && [ ! -L "$dir/registry.json" ] && [ ! -s "$dir/registry.json" ]; then
      rm -f -- "$dir/registry.json"
    fi
    rmdir -- "$dir" 2>/dev/null
  fi
  if [ -e "$dir" ] || [ -L "$dir" ]; then
    sp_refuse "registry restore: '$dir' is left and not an empty directory, so '$aside' was not moved back; restore it by hand"
    sp_exit_raise 5
    return 1
  fi
  if ! out="$(mv -- "$aside" "$dir" 2>&1)"; then
    sp_refuse "registry restore: mv '$aside' '$dir' failed: ${out%%$'\n'*}; restore it by hand"
    sp_exit_raise 5
    return 1
  fi
  if [ -e "$aside" ] || [ -L "$aside" ]; then
    sp_refuse "registry restore: '$aside' is left; restore it by hand"
    sp_exit_raise 5
    return 1
  fi
  return 0
}

# sp__rg_helper <file> <registry> <copy> — the RG2 (b) helper: one `sbx_rg2_mv landed` or
# `sbx_rg2_mv refused: <mv's message>` line; a failed stage prints no sbx_rg2_mv line.
sp__rg_helper() {
  {
    printf '%s\n' '#!/usr/bin/env bash' \
      '# Written by scripts/lib/sandbox-probe/legs-registry.sh for one session, then removed.'
    printf 'reg=%q\ncopy=%q\n' "$2" "$3"
    cat <<'EOF'
out="$(cp -p -- "$reg" "$copy" 2>&1)" || { printf 'sbx_rg2_stage failed: %s\n' "${out%%$'\n'*}"; exit 0; }
if out="$(mv -f -- "$copy" "$reg" 2>&1)"; then
  printf 'sbx_rg2_mv landed\n'
else
  printf 'sbx_rg2_mv refused: %s\n' "${out%%$'\n'*}"
fi
EOF
  } >"$1" 2>/dev/null
}

# sp__rg_row <row> <verdict> <evidence> — one row with no session behind it.
sp__rg_row() {
  sp_result_line registry "$1" "$2" "$3" ""
}

# sp__rg_session — RG1 and RG2, in session `registry`.
sp__rg_session() {
  local dir="$1" reg="$SP_REGISTRY" sib="$1/sbx_rg2_sib" copy="$1/sbx_rg2_copy" ctl="$1/sbx_rg1_ctl"
  local helper="$SP_TMP/rg2-helper.sh" hcmd pfile c_dd c_mv p row ino0 sum0 ino_ok=0 sum_ok=0 departure
  for p in "$sib" "$copy" "$ctl"; do
    if [ -e "$p" ] || [ -L "$p" ]; then
      for row in RG1 RG2; do
        sp__rg_row "$row" "not run" "'$p' exists before the session; the probe removes only what it created, so remove it and re-run"
      done
      return 0
    fi
  done
  hcmd="bash $helper"
  sp_track "$sib"
  sp_track "$copy"
  if ! cp -p -- "$reg" "$sib" 2>/dev/null; then
    sp__rg_row RG1 "not run" "could not copy the registry to '$sib' for RG2 (a)"
    sp__rg_row RG2 "not run" "could not copy the registry to '$sib' for RG2 (a)"
    return 0
  fi
  if ! sp__rg_helper "$helper" "$reg" "$copy"; then
    rm -f -- "$sib"
    sp__rg_row RG1 "not run" "could not write the rename helper $helper"
    sp__rg_row RG2 "not run" "could not write the rename helper $helper"
    return 0
  fi
  ino0="$(sp__wp_inode "$reg")"
  sum0="$(sp__wp_sum "$reg")"
  if [ -z "$ino0" ] || [ -z "$sum0" ]; then
    rm -f -- "$sib" "$helper"
    sp__rg_row RG1 "not run" "could not take the inode and shasum of $reg"
    sp__rg_row RG2 "not run" "could not take the inode and shasum of $reg"
    return 0
  fi

  c_dd="$(sp_dd_cmd "$reg")"
  c_mv="mv $sib $reg"
  sp_ctl_prepare rg
  pfile="$SP_TMP/registry.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$c_dd"
  sp_prompt_tool "$pfile" "Read, with file_path set to exactly $reg."
  sp_prompt_tool "$pfile" "Edit, with file_path set to exactly $reg (the file the previous call read), appending the line: sandbox probe RG1"
  sp_prompt_bash "$pfile" "$c_mv"
  sp_prompt_bash "$pfile" "$hcmd"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl")" "$ctl"

  sp_session registry "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" \
    --allowed "$SP_DD_RULE" --allowed "Bash(mv:*)" --allowed "Bash($hcmd)" \
    --allowed "$(sp__wp_cs7_read_rule "$reg")"
  departure="$(sp_departures)"
  rm -f -- "$helper"
  [ "$(sp__wp_inode "$reg")" = "$ino0" ] && ino_ok=1
  [ "$(sp__wp_sum "$reg")" = "$sum0" ] && sum_ok=1
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    rm -f -- "$sib" "$copy"
    sp_refuse "session registry did not launch; see $SP_TMP/registry.stderr"
    sp__rg_row RG1 "not run" "session registry did not launch; see $SP_TMP/registry.stderr"
    sp__rg_row RG2 "not run" "session registry did not launch; see $SP_TMP/registry.stderr"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"
  # The registry's directory is live and RG3 moves it next: what this session left there goes now.
  for p in "$sib" "$copy" "$ctl"; do
    [ -f "$p" ] && [ ! -L "$p" ] && rm -f -- "$p"
  done

  sp__rg1_grade "$SP_STREAM" "$c_dd" "$reg" "$sum_ok"
  sp_row_result registry RG1 "$SP_VERDICT" "$reg: $SP_EVIDENCE" "$departure"
  sp__rg2_grade "$SP_STREAM" "$c_mv" "$hcmd" "$ino_ok" "$sum_ok"
  sp_row_result registry RG2 "$SP_VERDICT" "$reg: $SP_EVIDENCE" "$departure"
  return 0
}

# sp__rg3_session <dir> — RG3, in session `registry-rg3`, last.
sp__rg3_session() {
  local dir="$1" reg="$SP_REGISTRY" ctl="$SP_CLONE/sbx_rg3_ctl" pfile c_mv sum0 sum_ok=0 moved=0 restored=1
  local departure
  if [ -e "$dir.aside" ] || [ -L "$dir.aside" ]; then
    sp__rg_row RG3 "not run" "'$dir.aside' exists before the session; the probe restores only what it moved, so remove it and re-run"
    return 0
  fi
  if [ -e "$ctl" ] || [ -L "$ctl" ]; then
    sp__rg_row RG3 "not run" "'$ctl' exists before the session; the probe removes only what it created, so remove it and re-run"
    return 0
  fi
  sum0="$(sp__wp_sum "$reg")"
  if [ -z "$sum0" ]; then
    sp__rg_row RG3 "not run" "could not take the shasum of $reg"
    return 0
  fi
  c_mv="mv $dir $dir.aside"
  sp_ctl_prepare rg3
  pfile="$SP_TMP/registry-rg3.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$c_mv"
  sp_prompt_bash "$pfile" "mkdir $dir"
  sp_prompt_bash "$pfile" "$(sp_dd_cmd "$reg")"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl")" "$ctl"

  sp_restore_register sp__rg_restore "$dir"
  sp_session registry-rg3 "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" \
    --allowed "Bash(mv:*)" --allowed "Bash(mkdir:*)" --allowed "$SP_DD_RULE"
  departure="$(sp_departures)"
  { [ -e "$dir.aside" ] || [ -L "$dir.aside" ]; } && moved=1
  if sp__rg_restore "$dir"; then
    sp_restore_clear
  else
    restored=0
  fi
  [ "$(sp__wp_sum "$reg")" = "$sum0" ] && sum_ok=1
  if { [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; } && [ "$moved" -eq 0 ]; then
    sp_refuse "session registry-rg3 did not launch; see $SP_TMP/registry-rg3.stderr"
    sp__rg_row RG3 "not run" "session registry-rg3 did not launch; see $SP_TMP/registry-rg3.stderr"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"
  [ -f "$ctl" ] && [ ! -L "$ctl" ] && rm -f -- "$ctl"

  sp__rg3_grade "$SP_STREAM" "$c_mv" "$moved" "$sum_ok" "$restored"
  sp_row_result --direct registry RG3 "$SP_VERDICT" "$dir: $SP_EVIDENCE" "$departure"
  return 0
}

sp_leg_registry() {
  local dir row backup
  if [ -z "${SP_REGISTRY:-}" ] || [ ! -f "$SP_REGISTRY" ]; then
    for row in RG1 RG2 RG3; do
      sp__rg_row "$row" "not run" "the run registry '${SP_REGISTRY:-}' is empty or absent"
    done
    return 0
  fi
  dir="${SP_REGISTRY%/*}"
  if ! sp__ctl_literal "registry" "$SP_REGISTRY" || ! sp__ctl_literal "clone" "$SP_CLONE" ||
    ! sp__ctl_literal "temp area" "$SP_TMP"; then
    for row in RG1 RG2 RG3; do
      sp__rg_row "$row" "not run" "the registry, the clone or the temp area is not spellable as a literal"
    done
    return 0
  fi
  # A byte copy kept with the leg's evidence when it does not pass, so a registry a failing call
  # changed can be put back by hand.
  backup="$SP_TMP/registry.backup.json"
  cp -p -- "$SP_REGISTRY" "$backup" 2>/dev/null && sp_keep_file "$backup"
  sp__rg_session "$dir"
  sp__rg3_session "$dir"
  return 0
}
