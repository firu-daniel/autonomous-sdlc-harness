#!/usr/bin/env bash
# legs-protection.sh — the sandbox probe's write-protection leg (rows CS1, CS2, CS7, W6, W8) and git leg
# (rows CS3, CL5).
#
# The protected set is read off SP_RUN_PROFILE, the profile the session runs on, never re-derived and
# never a literal list (sp_protected_set). Two targets the profile does not carry as its own entries are
# added: SP_RUN_PROFILE itself (CS7) and the installed plugin root (CS1), which the profile carries only
# through permissions.additionalDirectories (cli/src/generators/writeProtection.ts → protectedPaths).
#
# Reading a `.git` refusal (docs/sandbox-verification.md → **Reading a `.git` refusal.**): a file-tool
# refusal grades the profile only when its message is the denied-directory one. A permission-layer
# `… don't ask mode` refusal on a path inside a `.git` directory is the runtime's own guard, recorded as
# such in W6's evidence and neither a pass nor a fail of the profile.
#
# Every new file name a probe call could create is passed to sp_track, and one that landed is removed as
# soon as the session ends, because the git leg runs in the same clone afterwards.
#
# CS7 has two halves on one line: the dd / rename of SP_RUN_PROFILE, and an `Edit` (after a `Read`) of
# it, which must be refused at the file-tool or permission layer. The profile's shasum, taken after the
# session, covers both.
#
# W8 reads two --debug-file logs: this leg's own, and W7's, whose path the gates leg (legs-local.sh)
# leaves in SP_W7_DEBUG once W7's session has launched, empty otherwise.
#
# CS3's `git fetch origin` is an expected refusal: the clone layout has no network route to origin
# (docs/sandbox-verification.md §7 OR2), so it passes at layer `network` and fails at layer `ran`.
#
# THE GRADING FUNCTIONS read only their arguments, the stream and (W8) SP_RUN_PROFILE, and call only
# core.sh, judge.sh, controls.sh and this file's functions:
#   sp__wp_tracked [<exclude>]                         a tracked regular file in the clone, or nothing
#   sp__wp_cs7_edit <stream> <run profile>             CS7's Edit half: SP__WP_EDIT_V, SP__WP_EDIT_E
#   sp__wp_w8 <departure> <write-protection log> <W7 log, or empty>    W8's result line
#   sp__git_cs3_fetch <stream> <command>               CS3's fetch: SP__GIT_FETCH_V, SP__GIT_FETCH_E
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP__WP_PLUGIN_NAME="autonomous-sdlc-harness"

# The dd and rename targets, one per index.
SP__WP_T=()
SP__WP_ROW=()
SP__WP_NEW=()
SP__WP_INO=()
SP__WP_SUM=()
SP__WP_SKIP=()
SP__WP_LANDED=()
SP__WP_STAGE=()
# The Edit / Write targets (W6), one per index.
SP__W6_P=()
SP__W6_TOOL=()
SP__W6_NEW=()
SP__W6_SUM=()
SP__W6_LANDED=()
# Edit-half paths while the set is read: path, and whether a plain or a /** rule named it.
SP__W6R_P=()
SP__W6R_PLAIN=()
SP__W6R_DIR=()

SP__WP_WHY=""
SP__WP_UNMATCHED=""
SP__W6_SKIPPED=""
SP__WP_N_CLONE=0
SP__WP_N_OUT=0
SP__WP_CLONE_LIST=""
SP__WP_OUT_LIST=""
SP__WP_PLUGIN=""
SP__WP_PLUGIN_WHY=""
SP__WP_PLUGIN_LISTED=0
SP__WP_EDIT_V=""
SP__WP_EDIT_E=""
SP__GIT_FETCH_V=""
SP__GIT_FETCH_E=""

# sp__wp_expand <path> — print <path> with a sibling-copy glob re-rooted at SP_CLONE. Status 1 when the
# clone does not match the glob, 2 when the path carries more than one `*` segment.
sp__wp_expand() {
  local p="$1" head rest seg tail prefix
  case "$p" in
    *'*'*) ;;
    *)
      printf '%s\n' "$p"
      return 0
      ;;
  esac
  head="${p%%\**}"
  rest="${p#*\*}"
  seg="${rest%%/*}"
  case "$rest" in
    */*) tail="/${rest#*/}" ;;
    *) tail="" ;;
  esac
  case "$tail" in *'*'*) return 2 ;; esac
  prefix="$head*$seg"
  # shellcheck disable=SC2053
  if [[ $SP_CLONE == $prefix ]]; then
    printf '%s\n' "$SP_CLONE$tail"
    return 0
  fi
  return 1
}

# sp__wp_canon <path> — the canonical path of an existing directory, or <path> as given.
sp__wp_canon() {
  local c
  if [ -d "$1" ]; then
    c="$(CDPATH= cd -P -- "$1" 2>/dev/null && pwd -P)" || c=""
    [ -n "$c" ] && {
      printf '%s\n' "$c"
      return 0
    }
  fi
  printf '%s\n' "$1"
}

# sp__wp_inode <path> — the inode number, or nothing.
sp__wp_inode() {
  local out ino rest
  out="$(ls -di -- "$1" 2>/dev/null)" || return 0
  read -r ino rest <<<"$out"
  printf '%s\n' "$ino"
}

# sp__wp_sum <path> — the sha256, or nothing.
sp__wp_sum() {
  local out
  out="$(shasum -a 256 -- "$1" 2>/dev/null)" || return 0
  printf '%s\n' "${out%% *}"
}

# sp__wp_add <row> <target> — one dd and rename target, once.
sp__wp_add() {
  local row="$1" t="$2" i=0 n=${#SP__WP_T[@]} new=0 skip=""
  while [ "$i" -lt "$n" ]; do
    [ "${SP__WP_T[$i]}" = "$t" ] && return 0
    i=$((i + 1))
  done
  if [ -e "$t" ] || [ -L "$t" ]; then
    [ -f "$t" ] || skip="$t exists and is not a regular file"
  else
    new=1
  fi
  if [ -z "$skip" ] && ! sp__ctl_literal "target" "$t" 2>/dev/null; then
    skip="$t is not spellable as a literal"
  fi
  SP__WP_T[$n]="$t"
  SP__WP_ROW[$n]="$row"
  SP__WP_NEW[$n]="$new"
  SP__WP_SKIP[$n]="$skip"
  SP__WP_INO[$n]=""
  SP__WP_SUM[$n]=""
  SP__WP_LANDED[$n]=0
  SP__WP_STAGE[$n]=""
  if [ "$new" -eq 0 ] && [ -z "$skip" ]; then
    SP__WP_INO[$n]="$(sp__wp_inode "$t")"
    SP__WP_SUM[$n]="$(sp__wp_sum "$t")"
  fi
  [ "$new" -eq 1 ] && sp_track "$t"
  return 0
}

# sp__wp_entry_target <row> <entry> <new file name> — an existing regular file is its own target; a
# directory on disk is probed at <new file name> inside it; an absent path at its own path.
sp__wp_entry_target() {
  local row="$1" p="$2" name="$3"
  if [ -d "$p" ] && [ ! -L "$p" ]; then
    if [ -e "$p/$name" ] || [ -L "$p/$name" ]; then
      SP__WP_UNMATCHED="${SP__WP_UNMATCHED:+$SP__WP_UNMATCHED; }$p/$name exists before the session"
      return 0
    fi
    sp__wp_add "$row" "$p/$name"
  else
    sp__wp_add "$row" "$p"
  fi
}

# sp__wp_w6_note <path> <plain|dir> — record one Edit-half rule against its path.
sp__wp_w6_note() {
  local p="$1" kind="$2" i=0 n=${#SP__W6R_P[@]}
  while [ "$i" -lt "$n" ]; do
    [ "${SP__W6R_P[$i]}" = "$p" ] && break
    i=$((i + 1))
  done
  if [ "$i" -eq "$n" ]; then
    SP__W6R_P[$n]="$p"
    SP__W6R_PLAIN[$n]=0
    SP__W6R_DIR[$n]=0
  fi
  if [ "$kind" = dir ]; then SP__W6R_DIR[$i]=1; else SP__W6R_PLAIN[$i]=1; fi
}

# sp__wp_w6_add <tool> <path> — one W6 call.
sp__wp_w6_add() {
  local n=${#SP__W6_P[@]}
  if ! sp__ctl_literal "W6 target" "$2" 2>/dev/null; then
    SP__W6_SKIPPED="${SP__W6_SKIPPED:+$SP__W6_SKIPPED; }$2 is not spellable as a literal"
    return 0
  fi
  SP__W6_P[$n]="$2"
  SP__W6_TOOL[$n]="$1"
  SP__W6_LANDED[$n]=0
  if [ "$1" = Write ]; then
    SP__W6_NEW[$n]=1
    SP__W6_SUM[$n]=""
    sp_track "$2"
  else
    SP__W6_NEW[$n]=0
    SP__W6_SUM[$n]="$(sp__wp_sum "$2")"
  fi
}

# sp__wp_plugin_root — resolve the installed plugin root from the install record into SP__WP_PLUGIN, or
# set SP__WP_PLUGIN_WHY. The entry for the clone's path is preferred, then the main checkout's, then the
# user-scope one: the session runs with cwd = the clone.
sp__wp_plugin_root() {
  local rec="$HOME/.claude/plugins/installed_plugins.json" p
  SP__WP_PLUGIN=""
  SP__WP_PLUGIN_WHY=""
  SP__WP_PLUGIN_LISTED=0
  if [ ! -r "$rec" ]; then
    SP__WP_PLUGIN_WHY="the install record $rec is absent or unreadable"
    return 1
  fi
  p="$(jq -r --arg n "$SP__WP_PLUGIN_NAME" --arg c "$SP_CLONE" --arg m "$SP_MAIN" '
    [ (.plugins // {}) | to_entries[] | select(.key | startswith($n + "@")) | .value[]?
      | select(type == "object" and (.installPath | type) == "string") ] as $e
    | ([ $e[] | select(.projectPath? == $c) ] + [ $e[] | select(.projectPath? == $m) ]
       + [ $e[] | select(.scope? == "user") ]) | .[0].installPath // empty' "$rec" 2>/dev/null)" || p=""
  p="${p%%$'\n'*}"
  if [ -z "$p" ]; then
    SP__WP_PLUGIN_WHY="$rec names no installPath for $SP__WP_PLUGIN_NAME for the clone, the main checkout or user scope"
    return 1
  fi
  if [ ! -d "$p" ]; then
    SP__WP_PLUGIN_WHY="the install path $p is not a directory"
    return 1
  fi
  SP__WP_PLUGIN="${p%/}"
  if [ "$(jq --arg p "$SP__WP_PLUGIN" \
    '[.sandbox.filesystem.denyWrite[]? | select(type == "string")] | any(. == $p or ($p | startswith(. + "/")))' \
    "$SP_RUN_PROFILE" 2>/dev/null)" = true ]; then
    SP__WP_PLUGIN_LISTED=1
  fi
  return 0
}

# sp_protected_set — read the dd / rename set and the Edit / Write set off SP_RUN_PROFILE into the
# SP__WP_* and SP__W6_* arrays. Status 1 with SP__WP_WHY when the profile cannot be read.
sp_protected_set() {
  local entries rules entry p rc main_git main_c rule i n
  SP__WP_T=() SP__WP_ROW=() SP__WP_NEW=() SP__WP_INO=() SP__WP_SUM=() SP__WP_SKIP=() SP__WP_LANDED=()
  SP__WP_STAGE=()
  SP__W6_P=() SP__W6_TOOL=() SP__W6_NEW=() SP__W6_SUM=() SP__W6_LANDED=()
  SP__W6R_P=() SP__W6R_PLAIN=() SP__W6R_DIR=()
  SP__WP_WHY="" SP__WP_UNMATCHED="" SP__W6_SKIPPED="" SP__WP_CLONE_LIST="" SP__WP_OUT_LIST=""
  SP__WP_N_CLONE=0
  SP__WP_N_OUT=0
  if [ -z "${SP_RUN_PROFILE:-}" ] || [ ! -r "$SP_RUN_PROFILE" ]; then
    SP__WP_WHY="the per-run profile '${SP_RUN_PROFILE:-}' is missing or unreadable"
    return 1
  fi
  if ! entries="$(jq -r '.sandbox.filesystem.denyWrite[]' "$SP_RUN_PROFILE" 2>/dev/null)"; then
    SP__WP_WHY="jq could not read .sandbox.filesystem.denyWrite from $SP_RUN_PROFILE"
    return 1
  fi
  if ! rules="$(jq -r '.permissions.deny[] | select(startswith("Edit("))' "$SP_RUN_PROFILE" 2>/dev/null)"; then
    SP__WP_WHY="jq could not read the Edit deny rules from $SP_RUN_PROFILE"
    return 1
  fi
  main_git="$SP_MAIN/.git"
  main_c="$(sp__wp_canon "$SP_MAIN")/.git"

  while IFS= read -r entry; do
    [ -n "$entry" ] || continue
    p="$(sp__wp_expand "$entry")"
    rc=$?
    if [ "$rc" -ne 0 ]; then
      if [ "$rc" -eq 2 ]; then
        SP__WP_UNMATCHED="${SP__WP_UNMATCHED:+$SP__WP_UNMATCHED; }$entry carries more than one glob segment"
      else
        SP__WP_UNMATCHED="${SP__WP_UNMATCHED:+$SP__WP_UNMATCHED; }$entry does not match the clone $SP_CLONE"
      fi
      continue
    fi
    p="${p%/}"
    if [ "$p" = "$main_git" ] || [ "$p" = "$main_c" ]; then
      sp__wp_add CS2 "$p/sbx_cs2_new"
      sp__wp_add CS2 "$p/refs/heads/sbx_cs2_probe"
      sp__wp_add CS2 "$p/objects/sbx_cs2_probe"
      continue
    fi
    if [ "$p" = "$SP_RUN_PROFILE" ]; then
      sp__wp_add CS7 "$p"
      continue
    fi
    case "$p" in
      "$SP_CLONE"/*)
        # Counted per entry, not per expanded path: a glob and the per-run append can name one path.
        SP__WP_N_CLONE=$((SP__WP_N_CLONE + 1))
        case ",$SP__WP_CLONE_LIST," in
          *",${p#"$SP_CLONE"/},"*) ;;
          *) SP__WP_CLONE_LIST="${SP__WP_CLONE_LIST:+$SP__WP_CLONE_LIST,}${p#"$SP_CLONE"/}" ;;
        esac
        ;;
      *)
        SP__WP_N_OUT=$((SP__WP_N_OUT + 1))
        case "$p" in
          "$SP_MAIN"/*) SP__WP_OUT_LIST="${SP__WP_OUT_LIST:+$SP__WP_OUT_LIST,}<main>/${p#"$SP_MAIN"/}" ;;
          *) SP__WP_OUT_LIST="${SP__WP_OUT_LIST:+$SP__WP_OUT_LIST,}$p" ;;
        esac
        ;;
    esac
    sp__wp_entry_target CS1 "$p" sbx_cs1_new
  done <<EOF
$entries
EOF

  # CS7's target: the per-run profile is not one of its own entries.
  sp__wp_add CS7 "$SP_RUN_PROFILE"

  if sp__wp_plugin_root; then
    sp__wp_entry_target CS1 "$SP__WP_PLUGIN" sbx_cs1_plugin_new
  fi

  # The Edit half (W6): `Edit(//<abs>)` reads as the absolute root; a trailing `/**` is a directory entry.
  while IFS= read -r rule; do
    [ -n "$rule" ] || continue
    p="${rule#Edit(}"
    p="${p%)}"
    case "$p" in
      //*) p="${p#/}" ;;
      *)
        SP__W6_SKIPPED="${SP__W6_SKIPPED:+$SP__W6_SKIPPED; }$rule is not an absolute-root rule"
        continue
        ;;
    esac
    case "$p" in
      */\*\*) p="${p%/\*\*}"; rc=dir ;;
      *) rc=plain ;;
    esac
    if ! p="$(sp__wp_expand "$p")"; then
      SP__W6_SKIPPED="${SP__W6_SKIPPED:+$SP__W6_SKIPPED; }$rule does not match the clone $SP_CLONE"
      continue
    fi
    sp__wp_w6_note "$p" "$rc"
  done <<EOF
$rules
EOF
  i=0
  n=${#SP__W6R_P[@]}
  while [ "$i" -lt "$n" ]; do
    p="${SP__W6R_P[$i]}"
    if [ -d "$p" ] && [ ! -L "$p" ]; then
      if [ -e "$p/sbx_w6_new" ] || [ -L "$p/sbx_w6_new" ]; then
        SP__W6_SKIPPED="${SP__W6_SKIPPED:+$SP__W6_SKIPPED; }$p/sbx_w6_new exists before the session"
      else
        sp__wp_w6_add Write "$p/sbx_w6_new"
      fi
    elif [ -f "$p" ]; then
      sp__wp_w6_add Edit "$p"
    elif [ "${SP__W6R_PLAIN[$i]}" -eq 1 ]; then
      sp__wp_w6_add Write "$p"
    else
      sp__wp_w6_add Write "$p/sbx_w6_new"
    fi
    i=$((i + 1))
  done
  return 0
}

# sp__wp_helper <file> — write the rename helper: per target, a staged sibling in <clone>/.git (CL5
# measured new files writable there), a `cp -p` byte copy of an existing target or an empty file for a
# new name, then `mv` onto the target. One `sbx_wp_mv <index> …` line per target.
sp__wp_helper() {
  local f="$1" i=0 n=${#SP__WP_T[@]} t s src
  {
    cat <<'EOF'
#!/usr/bin/env bash
# Written by scripts/lib/sandbox-probe/legs-protection.sh for one session, then removed.
sbx_mv() {
  local out
  if [ -n "$4" ]; then
    out="$(cp -p -- "$4" "$3" 2>&1)" || { printf 'sbx_wp_mv %s stage failed: %s\n' "$1" "${out%%$'\n'*}"; return 0; }
  else
    out="$( { : >"$3"; } 2>&1)" || { printf 'sbx_wp_mv %s stage failed: %s\n' "$1" "${out%%$'\n'*}"; return 0; }
  fi
  if out="$(mv -f -- "$3" "$2" 2>&1)"; then
    printf 'sbx_wp_mv %s landed\n' "$1"
  else
    printf 'sbx_wp_mv %s refused: %s\n' "$1" "${out%%$'\n'*}"
  fi
  rm -f -- "$3"
}
EOF
    while [ "$i" -lt "$n" ]; do
      if [ -z "${SP__WP_SKIP[$i]}" ]; then
        t="${SP__WP_T[$i]}"
        s="$SP_CLONE/.git/sbx_wp_mv_$i"
        src=""
        [ "${SP__WP_NEW[$i]}" -eq 0 ] && src="$t"
        printf 'sbx_mv %s %q %q %q\n' "$i" "$t" "$s" "$src"
      fi
      i=$((i + 1))
    done
  } >"$f" 2>/dev/null
}

# sp__wp_dd <target> — the exact dd call.
sp__wp_dd() {
  printf 'dd if=/dev/null of=%s conv=notrunc' "$1"
}

# sp__wp_in_git <path> — status 0 for a path inside a `.git` directory, or the `.git` itself.
sp__wp_in_git() {
  case "$1" in
    */.git | */.git/*) return 0 ;;
  esac
  return 1
}

# sp__wp_mv_line <helper text> <index> — the helper's line for one target, or nothing.
sp__wp_mv_line() {
  local line
  while IFS= read -r line; do
    case "$line" in
      "sbx_wp_mv $2 "*)
        printf '%s' "$line"
        return 0
        ;;
    esac
  done <<EOF
$1
EOF
  return 1
}

# sp__wp_cleanup — remove at once every new name a probe call landed, and every staged sibling, so the
# git leg in the same clone is not run against a planted file.
sp__wp_cleanup() {
  local i=0 n=${#SP__WP_T[@]} t
  while [ "$i" -lt "$n" ]; do
    t="${SP__WP_T[$i]}"
    if [ "${SP__WP_NEW[$i]}" -eq 1 ] && [ -z "${SP__WP_SKIP[$i]}" ] && { [ -e "$t" ] || [ -L "$t" ]; }; then
      SP__WP_LANDED[$i]=1
      [ -f "$t" ] && rm -f -- "$t"
    fi
    if [ -n "${SP__WP_STAGE[$i]}" ]; then
      rm -f -- "${SP__WP_STAGE[$i]}"
    fi
    i=$((i + 1))
  done
  i=0
  n=${#SP__W6_P[@]}
  while [ "$i" -lt "$n" ]; do
    t="${SP__W6_P[$i]}"
    if [ "${SP__W6_NEW[$i]}" -eq 1 ] && { [ -e "$t" ] || [ -L "$t" ]; }; then
      SP__W6_LANDED[$i]=1
      [ -f "$t" ] && rm -f -- "$t"
    fi
    i=$((i + 1))
  done
}

# sp__wp_judge_row <row> <stream> <helper command> — sets SP__WP_RV and SP__WP_RE from every dd and
# rename target of <row>.
sp__wp_judge_row() {
  local row="$1" stream="$2" hcmd="$3" i=0 n=${#SP__WP_T[@]} t cmd mv_text="" mv_seen=0 line ino sum
  local fails="" notrun="" passed=0 why
  sp_judge_call "$stream" sandbox "$hcmd"
  if [ "$SP__COUNT" -gt 0 ] && [ "$SP__STATUS" != none ]; then
    mv_seen=1
    mv_text="${SP__TEXT:-}"
  fi
  while [ "$i" -lt "$n" ]; do
    if [ "${SP__WP_ROW[$i]}" != "$row" ]; then
      i=$((i + 1))
      continue
    fi
    t="${SP__WP_T[$i]}"
    if [ -n "${SP__WP_SKIP[$i]}" ]; then
      notrun="${notrun:+$notrun; }${SP__WP_SKIP[$i]}"
      i=$((i + 1))
      continue
    fi
    why=""
    # The dd.
    cmd="$(sp__wp_dd "$t")"
    sp_judge_call "$stream" sandbox "$cmd"
    case "$SP_VERDICT" in
      fail) why="dd $t: $SP_LAYER: $SP_EVIDENCE" ;;
      "not run") notrun="${notrun:+$notrun; }dd $t: $SP_EVIDENCE" ;;
    esac
    # The rename.
    if [ "$mv_seen" -eq 0 ]; then
      notrun="${notrun:+$notrun; }rename onto $t: the helper call has no tool_result"
    elif ! line="$(sp__wp_mv_line "$mv_text" "$i")"; then
      notrun="${notrun:+$notrun; }rename onto $t: no sbx_wp_mv $i line in the helper's output"
    else
      case "$line" in
        *" landed") why="${why:+$why; }rename onto $t landed" ;;
        *" stage failed: "*) notrun="${notrun:+$notrun; }rename onto $t: ${line#* stage failed: }" ;;
        *"Operation not permitted"*) ;;
        *) why="${why:+$why; }rename onto $t: not a sandbox refusal: ${line#sbx_wp_mv $i }" ;;
      esac
    fi
    # The target's own state.
    if [ "${SP__WP_NEW[$i]}" -eq 1 ]; then
      [ "${SP__WP_LANDED[$i]}" -eq 1 ] && why="${why:+$why; }$t was created (removed after the session)"
    else
      ino="$(sp__wp_inode "$t")"
      sum="$(sp__wp_sum "$t")"
      [ "$ino" = "${SP__WP_INO[$i]}" ] || why="${why:+$why; }$t inode ${SP__WP_INO[$i]:-none}..${ino:-none}"
      [ "$sum" = "${SP__WP_SUM[$i]}" ] || why="${why:+$why; }$t shasum changed"
    fi
    if [ -n "$why" ]; then
      fails="${fails:+$fails; }$why"
    else
      passed=$((passed + 1))
    fi
    i=$((i + 1))
  done
  if [ -n "$fails" ]; then
    SP__WP_RV=fail
    SP__WP_RE="$fails"
  elif [ -n "$notrun" ]; then
    SP__WP_RV="not run"
    SP__WP_RE="$notrun"
  elif [ "$passed" -eq 0 ]; then
    SP__WP_RV="not run"
    SP__WP_RE="no target for $row in the per-run profile"
  else
    SP__WP_RV=pass
    SP__WP_RE="$passed target(s): every dd and rename refused with Operation not permitted, every inode and shasum unchanged, no new name created"
  fi
}

# sp__wp_plugin_init <stream> — the session's own init event's plugin path, against SP__WP_PLUGIN.
sp__wp_plugin_init() {
  local got got_c want_c
  got="$(jq -n -R -r --arg n "$SP__WP_PLUGIN_NAME" '
    [inputs | fromjson? | select(type == "object" and .type == "system" and .subtype == "init")] | .[0]
    | select(. != null) | .plugins[]? | select(type == "object")
    | select((.name // "") | test("^" + $n + "(@|$)")) | .path // empty' "$1" 2>/dev/null)" || got=""
  got="${got%%$'\n'*}"
  if [ -z "$got" ]; then
    printf '%s' "the session's init event names no $SP__WP_PLUGIN_NAME plugin"
    return 0
  fi
  got_c="$(sp__wp_canon "${got%/}")"
  want_c="$(sp__wp_canon "$SP__WP_PLUGIN")"
  if [ "$got_c" = "$want_c" ]; then
    printf '%s' "the session's init event agrees"
  else
    printf '%s' "disagreement: the session's init event names $got"
  fi
}

# sp__wp_w6 <stream> — sets SP__WP_RV and SP__WP_RE for W6.
sp__wp_w6() {
  local stream="$1" i=0 n=${#SP__W6_P[@]} p tool fails="" notrun="" graded=0 runtime="" sum why
  while [ "$i" -lt "$n" ]; do
    p="${SP__W6_P[$i]}"
    tool="${SP__W6_TOOL[$i]}"
    why=""
    sp_judge_tool "$stream" file-tool "$tool" "$p"
    case "$SP_VERDICT" in
      pass) graded=$((graded + 1)) ;;
      "not run") notrun="${notrun:+$notrun; }$tool $p: $SP_EVIDENCE" ;;
      fail)
        case "$SP_LAYER:$SP_EVIDENCE" in
          permission:*"don't ask mode"*)
            if sp__wp_in_git "$p"; then
              runtime="${runtime:+$runtime,}$p"
            else
              why="$tool $p: permission: $SP_EVIDENCE"
            fi
            ;;
          *) why="$tool $p: $SP_LAYER: $SP_EVIDENCE" ;;
        esac
        ;;
    esac
    if [ "${SP__W6_NEW[$i]}" -eq 1 ]; then
      [ "${SP__W6_LANDED[$i]}" -eq 1 ] && why="${why:+$why; }$p was created (removed after the session)"
    else
      sum="$(sp__wp_sum "$p")"
      [ "$sum" = "${SP__W6_SUM[$i]}" ] || why="${why:+$why; }$p shasum changed"
    fi
    [ -z "$why" ] || fails="${fails:+$fails; }$why"
    i=$((i + 1))
  done
  if [ -n "$fails" ]; then
    SP__WP_RV=fail
    SP__WP_RE="$fails"
  elif [ -n "$notrun" ]; then
    SP__WP_RV="not run"
    SP__WP_RE="$notrun"
  elif [ "$graded" -eq 0 ]; then
    SP__WP_RV="not run"
    SP__WP_RE="no Edit-half path was refused with the denied-directory message${runtime:+; the runtime's don't-ask guard refused $runtime}"
  else
    SP__WP_RV=pass
    SP__WP_RE="$graded of $n call(s) refused with the denied-directory message, the profile's layer"
  fi
  if [ -n "$SP__W6_SKIPPED" ]; then
    [ "$SP__WP_RV" = fail ] || SP__WP_RV="not run"
    SP__WP_RE="$SP__WP_RE; not probed: $SP__W6_SKIPPED"
  fi
  if [ -n "$runtime" ] && [ "$SP__WP_RV" != "not run" ]; then
    SP__WP_RE="$SP__WP_RE; refused by the runtime's .git guard (permission layer, don't ask mode), not graded against the profile: $runtime"
  fi
}

# sp__wp_w8_scan <log> <rules> — the unmatched-rule / mixed-prefix test over one log: SP__W8_BAD (the
# first such line naming a rule in <rules>, or empty), SP__W8_OTHER (such lines naming none) and
# SP__W8_TOTAL (the log's line count).
sp__wp_w8_scan() {
  local log="$1" rules="$2" hits line rule
  SP__W8_BAD=""
  SP__W8_OTHER=0
  hits="$(grep -F -e 'is not matched by file permission checks' -e 'mixes * with the trailing :* prefix syntax' \
    -- "$log" 2>/dev/null)"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    rule=""
    while IFS= read -r rule; do
      [ -n "$rule" ] || continue
      case "$line" in *"$rule"*) break ;; esac
      rule=""
    done <<EOF
$rules
EOF
    if [ -n "$rule" ]; then
      [ -n "$SP__W8_BAD" ] || SP__W8_BAD="$line"
    else
      SP__W8_OTHER=$((SP__W8_OTHER + 1))
    fi
  done <<EOF
$hits
EOF
  SP__W8_TOTAL="$(wc -l <"$log" 2>/dev/null)"
  SP__W8_TOTAL="${SP__W8_TOTAL//[[:space:]]/}"
}

# sp__wp_w8 <departure> <write-protection log> <W7 log, or empty> — W8's line.
sp__wp_w8() {
  local departure="$1" rules name log bad="" missing="" counts=""
  rules="$(jq -r '[.permissions.allow[]?, .permissions.deny[]?, .permissions.ask[]?] | .[] | select(type == "string")' \
    "$SP_RUN_PROFILE" 2>/dev/null)" || rules=""
  if [ -z "$rules" ]; then
    sp_result_line write-protection W8 "not run" "no permission rule read from $SP_RUN_PROFILE" "$departure"
    return 0
  fi
  for name in write-protection W7; do
    if [ "$name" = W7 ]; then log="${3:-}"; else log="${2:-}"; fi
    if [ -z "$log" ] || [ ! -s "$log" ]; then
      if [ "$name" = W7 ]; then
        missing="${missing:+$missing; }W7's --debug-file log is missing or empty (the gates leg did not run its W7 session in this run)"
      else
        missing="${missing:+$missing; }the write-protection session's --debug-file log ${log:-(not given)} is missing or empty"
      fi
      continue
    fi
    sp__wp_w8_scan "$log" "$rules"
    [ -n "$bad" ] || [ -z "$SP__W8_BAD" ] || bad="$name log: $SP__W8_BAD"
    counts="${counts:+$counts; }$name log: ${SP__W8_TOTAL:-?} line(s), $SP__W8_OTHER unmatched-rule or mixed-prefix line(s) for a rule the profile does not carry"
  done
  if [ -n "$bad" ]; then
    sp_result_line write-protection W8 fail "$bad" "$departure"
  elif [ -n "$missing" ]; then
    sp_result_line write-protection W8 "not run" "$missing${counts:+; $counts}" "$departure"
  else
    sp_result_line write-protection W8 pass \
      "no unmatched-rule or mixed-prefix line for any per-run profile rule in either log; $counts" "$departure"
  fi
}

# sp__wp_cs7_edit <stream> <run profile> — CS7's Edit half: SP__WP_EDIT_V and SP__WP_EDIT_E.
sp__wp_cs7_edit() {
  local stream="$1" prof="$2"
  sp_judge_tool "$stream" file-tool Edit "$prof"
  case "$SP_LAYER" in
    file-tool | permission)
      SP__WP_EDIT_V=pass
      SP__WP_EDIT_E="Edit refused at the $SP_LAYER layer: $SP_EVIDENCE"
      ;;
    ran)
      SP__WP_EDIT_V=fail
      SP__WP_EDIT_E="the Edit of $prof was not refused: $SP_EVIDENCE"
      ;;
    "")
      SP__WP_EDIT_V="not run"
      SP__WP_EDIT_E="Edit: $SP_EVIDENCE"
      ;;
    *)
      SP__WP_EDIT_V="not run"
      SP__WP_EDIT_E="Edit refused at the $SP_LAYER layer, not the file-tool or permission layer: $SP_EVIDENCE"
      ;;
  esac
}

# sp__wp_tracked [<exclude>] — a tracked regular file in the clone, README.md first; nothing when none.
sp__wp_tracked() {
  local f list
  list="$(git -C "$SP_CLONE" ls-files 2>/dev/null)" || return 0
  if [ "${1:-}" != README.md ] &&
    case $'\n'"$list"$'\n' in *$'\n'README.md$'\n'*) true ;; *) false ;; esac &&
    [ -f "$SP_CLONE/README.md" ] && [ ! -L "$SP_CLONE/README.md" ]; then
    printf '%s\n' README.md
    return 0
  fi
  while IFS= read -r f; do
    case "$f" in "" | .* | */.*) continue ;; esac
    [ "$f" = "${1:-}" ] && continue
    [ -f "$SP_CLONE/$f" ] && [ ! -L "$SP_CLONE/$f" ] || continue
    sp__ctl_literal "tracked file" "$f" 2>/dev/null || continue
    printf '%s\n' "$f"
    return 0
  done <<EOF
$list
EOF
}

sp__wp_all() {
  local verdict="$1" evidence="$2" row
  for row in CS1 CS2 CS7 W6 W8; do
    sp_result_line write-protection "$row" "$verdict" "$evidence" ""
  done
}

sp_leg_write_protection() {
  local pfile helper hcmd dbg tracked i n t departure plugin_clause init_clause ev v
  if ! sp__ctl_literal "clone" "$SP_CLONE" || ! sp__ctl_literal "temp area" "$SP_TMP"; then
    sp__wp_all "not run" "the clone or the temp area is not spellable as a literal"
    return 0
  fi
  if ! sp_protected_set; then
    sp__wp_all "not run" "$SP__WP_WHY"
    return 0
  fi
  tracked="$(sp__wp_tracked)"
  if [ -z "$tracked" ]; then
    sp__wp_all "not run" "no tracked regular file in $SP_CLONE for the dd control"
    return 0
  fi
  helper="$SP_TMP/wp-rename.sh"
  if ! sp__wp_helper "$helper"; then
    sp__wp_all "not run" "could not write the rename helper $helper"
    return 0
  fi
  i=0
  n=${#SP__WP_T[@]}
  while [ "$i" -lt "$n" ]; do
    if [ -z "${SP__WP_SKIP[$i]}" ]; then
      SP__WP_STAGE[$i]="$SP_CLONE/.git/sbx_wp_mv_$i"
      sp_track "${SP__WP_STAGE[$i]}"
    fi
    i=$((i + 1))
  done
  hcmd="bash $helper"
  dbg="$SP_TMP/write-protection.debug.log"
  sp_track "$dbg"

  sp_ctl_prepare wp
  pfile="$SP_TMP/write-protection.prompt"
  sp_prompt_new "$pfile"
  i=0
  while [ "$i" -lt "$n" ]; do
    [ -z "${SP__WP_SKIP[$i]}" ] && sp_prompt_bash "$pfile" "$(sp__wp_dd "${SP__WP_T[$i]}")"
    i=$((i + 1))
  done
  sp_prompt_bash "$pfile" "$hcmd"
  i=0
  n=${#SP__W6_P[@]}
  while [ "$i" -lt "$n" ]; do
    t="${SP__W6_P[$i]}"
    if [ "${SP__W6_TOOL[$i]}" = Edit ]; then
      sp_prompt_tool "$pfile" "Edit, with file_path set to exactly $t (after a Read of that same path), appending the line: sandbox probe W6"
    else
      sp_prompt_tool "$pfile" "Write, with file_path set to exactly $t and content set to exactly: sandbox probe W6"
    fi
    i=$((i + 1))
  done
  sp_prompt_tool "$pfile" "Edit, with file_path set to exactly $SP_RUN_PROFILE (after a Read of that same path), appending the line: sandbox probe CS7"
  sp_ctl_add "$pfile" written "dd if=/dev/null of=$SP_CLONE/.git/sbx_wp_ctl conv=notrunc" "$SP_CLONE/.git/sbx_wp_ctl"
  sp_ctl_add "$pfile" ran "dd if=/dev/null of=$SP_CLONE/$tracked conv=notrunc"
  sp_ctl_add "$pfile" tool Write "$SP_CLONE/sbx_wp_tool_ctl.txt"

  sp_session write-protection "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" \
    --allowed "Bash(dd:*)" --allowed "Bash($hcmd)" --debug-file "$dbg"
  departure="$(sp_departures)"
  departure="${departure:+$departure; }--debug-file $dbg"
  sp__wp_cleanup
  rm -f -- "$helper"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session write-protection did not launch; see $SP_TMP/write-protection.stderr"
    sp__wp_all "not run" "session write-protection did not launch; see $SP_TMP/write-protection.stderr"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"

  # CS1, with the entry counts, the unmatched entries and the plugin root's clause.
  sp__wp_judge_row CS1 "$SP_STREAM" "$hcmd"
  if [ -z "$SP__WP_PLUGIN" ]; then
    plugin_clause="plugin root unresolved: $SP__WP_PLUGIN_WHY"
    [ "$SP__WP_RV" = fail ] || SP__WP_RV="not run"
  else
    init_clause="$(sp__wp_plugin_init "$SP_STREAM")"
    if [ "$SP__WP_PLUGIN_LISTED" -eq 1 ]; then
      plugin_clause="plugin root $SP__WP_PLUGIN: listed by the profile; $init_clause"
    else
      plugin_clause="plugin root $SP__WP_PLUGIN: additionalDirectories holds no plugin root on this repository; refused only by the runtime's write roots; $init_clause"
    fi
  fi
  if [ -n "$SP__WP_UNMATCHED" ] && [ "$SP__WP_RV" != fail ]; then
    SP__WP_RV="not run"
  fi
  ev="$((SP__WP_N_CLONE + SP__WP_N_OUT)) profile entries: $SP__WP_N_CLONE under the clone (${SP__WP_CLONE_LIST:-none}), $SP__WP_N_OUT outside it (${SP__WP_OUT_LIST:-none}); $SP__WP_RE; $plugin_clause"
  [ -z "$SP__WP_UNMATCHED" ] || ev="$ev; not probed: $SP__WP_UNMATCHED"
  sp_row_result --direct write-protection CS1 "$SP__WP_RV" "$ev" "$departure"

  sp__wp_judge_row CS2 "$SP_STREAM" "$hcmd"
  sp_row_result --direct write-protection CS2 "$SP__WP_RV" "<main>/.git: $SP__WP_RE" "$departure"

  sp__wp_judge_row CS7 "$SP_STREAM" "$hcmd"
  sp__wp_cs7_edit "$SP_STREAM" "$SP_RUN_PROFILE"
  if [ "$SP__WP_RV" = fail ] || [ "$SP__WP_EDIT_V" = fail ]; then
    v=fail
  elif [ "$SP__WP_RV" = "not run" ] || [ "$SP__WP_EDIT_V" = "not run" ]; then
    v="not run"
  else
    v=pass
  fi
  sp_row_result --direct write-protection CS7 "$v" \
    "$SP_RUN_PROFILE: dd and rename: $SP__WP_RE; $SP__WP_EDIT_E" "$departure"

  sp__wp_w6 "$SP_STREAM"
  sp_row_result --direct write-protection W6 "$SP__WP_RV" "$SP__WP_RE" "$departure"

  # W8 reads logs, not a refusal: no control gates it.
  sp__wp_w8 "$departure" "$dbg" "${SP_W7_DEBUG:-}"
}

# sp__git_rule <prefix> — status 0 when SP_RUN_PROFILE's allow list carries `Bash(<prefix>:*)`.
sp__git_rule() {
  [ "$(jq --arg r "Bash($1:*)" '[.permissions.allow[]?] | any(. == $r)' "$SP_RUN_PROFILE" 2>/dev/null)" = true ]
}

# sp__git_probe <git argument>... — the probe's own git in the clone: no hook, no fsmonitor.
sp__git_probe() {
  git -C "$SP_CLONE" -c core.hooksPath=/dev/null -c core.fsmonitor=false "$@"
}

# sp__git_cs3_fetch <stream> <command> — CS3's fetch, an expected network refusal: SP__GIT_FETCH_V and
# SP__GIT_FETCH_E.
sp__git_cs3_fetch() {
  sp_judge_call "$1" network "$2"
  case "$SP_LAYER" in
    network)
      SP__GIT_FETCH_V=pass
      SP__GIT_FETCH_E="refused by the network allowlist, as the clone layout intends (§7 OR2): $SP_EVIDENCE"
      ;;
    ran)
      SP__GIT_FETCH_V=fail
      SP__GIT_FETCH_E="git fetch origin reached origin from inside the sandbox: $SP_EVIDENCE"
      ;;
    "")
      SP__GIT_FETCH_V="not run"
      SP__GIT_FETCH_E="$SP_EVIDENCE"
      ;;
    *)
      SP__GIT_FETCH_V="not run"
      SP__GIT_FETCH_E="refused at the $SP_LAYER layer, not the network allowlist: $SP_EVIDENCE"
      ;;
  esac
}

sp_leg_git() {
  local a b x marker ref before_stash after_stash pfile departure prefix cmd text
  local c_add c_commit c_url c_fetch c_push c_pop c_switch c_cl5 c_ctl
  local allowed parts="" fails="" notrun="" url="" head after got
  allowed=()
  x="sbx_cs3_switch"
  marker="sandbox probe CS3"
  if ! sp__ctl_literal "clone" "$SP_CLONE"; then
    sp_result_line git CS3 "not run" "the clone is not spellable as a literal" ""
    sp_result_line git CL5 "not run" "the clone is not spellable as a literal" ""
    return 0
  fi
  a="$(sp__wp_tracked)"
  b=""
  [ -z "$a" ] || b="$(sp__wp_tracked "$a")"
  if [ -z "$a" ] || [ -z "$b" ]; then
    sp_result_line git CS3 "not run" "fewer than two tracked regular files in $SP_CLONE" ""
    sp_result_line git CL5 "not run" "fewer than two tracked regular files in $SP_CLONE" ""
    return 0
  fi
  if git -C "$SP_CLONE" show-ref --verify --quiet "refs/heads/$x"; then
    sp_result_line git CS3 "not run" "refs/heads/$x exists in the clone before the session" ""
    sp_result_line git CL5 "not run" "refs/heads/$x exists in the clone before the session" ""
    return 0
  fi
  ref="$(git -C "$SP_CLONE" rev-parse --verify -q "refs/heads/$SP_BRANCH" 2>/dev/null)" || ref=""
  if [ -z "$ref" ]; then
    sp_result_line git CS3 "not run" "no refs/heads/$SP_BRANCH in the clone" ""
    sp_result_line git CL5 "not run" "no refs/heads/$SP_BRANCH in the clone" ""
    return 0
  fi
  before_stash="$(git -C "$SP_CLONE" stash list 2>/dev/null | wc -l | tr -d ' ')"
  # <a> gives the add and commit a change; <b> stays modified for the stash push and pop.
  if ! printf '%s\n' "$marker" >>"$SP_CLONE/$a" 2>/dev/null || ! printf '%s\n' "$marker" >>"$SP_CLONE/$b" 2>/dev/null; then
    sp_result_line git CS3 "not run" "could not edit $a or $b in the clone" ""
    sp_result_line git CL5 "not run" "could not edit $a or $b in the clone" ""
    return 0
  fi

  c_add="git add $a"
  c_commit='git commit -m "chore: Sandbox probe CS3"'
  c_url="git remote get-url origin"
  c_fetch="git fetch origin"
  c_push="git stash push"
  c_pop="git stash pop"
  c_switch="git switch -c $x"
  c_cl5="git config sbx.probe true"
  c_ctl="git status --porcelain"
  for prefix in "git add" "git commit" "git remote get-url" "git fetch" "git stash" "git switch" "git config" \
    "git status"; do
    if ! sp__git_rule "$prefix"; then
      allowed[${#allowed[@]}]=--allowed
      allowed[${#allowed[@]}]="Bash($prefix:*)"
    fi
  done

  sp_ctl_prepare git
  pfile="$SP_TMP/git.prompt"
  sp_prompt_new "$pfile"
  for cmd in "$c_add" "$c_commit" "$c_url" "$c_fetch" "$c_push" "$c_pop" "$c_switch" "$c_cl5"; do
    sp_prompt_bash "$pfile" "$cmd"
  done
  sp_ctl_add "$pfile" ran "$c_ctl"
  sp_session git "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" ${allowed[@]+"${allowed[@]}"}
  departure="$(sp_departures)"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session git did not launch; see $SP_TMP/git.stderr"
    sp_result_line git CS3 "not run" "session git did not launch; see $SP_TMP/git.stderr" "$departure"
    sp_result_line git CL5 "not run" "session git did not launch; see $SP_TMP/git.stderr" "$departure"
    return 0
  fi

  # --- CS3, judged by ref, stash and branch state; the tool results only name the layer.
  for cmd in "$c_add" "$c_commit" "$c_url" "$c_push" "$c_pop" "$c_switch"; do
    sp_judge_call "$SP_STREAM" ran "$cmd"
    case "$SP_VERDICT" in
      "not run") notrun="${notrun:+$notrun; }$cmd: $SP_EVIDENCE" ;;
      fail) fails="${fails:+$fails; }$cmd: $SP_LAYER: $SP_EVIDENCE" ;;
      pass)
        text="${SP__TEXT:-}"
        case "$cmd" in
          "$c_url") url="$(sp__first_line "$text")" ;;
          "$c_push")
            sp__line_with "$text" "Saved working directory" >/dev/null ||
              fails="${fails:+$fails; }$cmd: no 'Saved working directory' line: $(sp__first_line "$text")"
            ;;
          "$c_pop")
            sp__line_with "$text" "Dropped" >/dev/null ||
              fails="${fails:+$fails; }$cmd: no 'Dropped' line: $(sp__first_line "$text")"
            ;;
        esac
        ;;
    esac
  done
  sp__git_cs3_fetch "$SP_STREAM" "$c_fetch"
  case "$SP__GIT_FETCH_V" in
    fail) fails="${fails:+$fails; }$c_fetch: $SP__GIT_FETCH_E" ;;
    "not run") notrun="${notrun:+$notrun; }$c_fetch: $SP__GIT_FETCH_E" ;;
  esac
  sp_judge_ref "$SP_CLONE" "refs/heads/$SP_BRANCH" "$ref" moved
  parts="commit: $SP_EVIDENCE"
  if [ "$SP_VERDICT" != pass ]; then
    fails="${fails:+$fails; }commit: $SP_EVIDENCE"
  else
    after="$(git -C "$SP_CLONE" rev-parse --verify -q "refs/heads/$SP_BRANCH" 2>/dev/null)" || after=""
    if [ -z "$(git -C "$SP_CLONE" diff --name-only "$ref" "$after" -- "$a" 2>/dev/null)" ]; then
      fails="${fails:+$fails; }the commit does not carry $a"
    fi
  fi
  after_stash="$(git -C "$SP_CLONE" stash list 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$after_stash" != "$before_stash" ]; then
    fails="${fails:+$fails; }stash list $before_stash..$after_stash entries"
  elif ! grep -qxF -- "$marker" "$SP_CLONE/$b" 2>/dev/null; then
    fails="${fails:+$fails; }the stash pop did not restore the change to $b"
  else
    parts="$parts; stash: the change to $b restored, stash list $after_stash entries"
  fi
  head="$(git -C "$SP_CLONE" rev-parse --abbrev-ref HEAD 2>/dev/null)" || head=""
  if [ "$head" = "$x" ]; then
    parts="$parts; switch: HEAD is $x"
  else
    fails="${fails:+$fails; }switch: HEAD is '${head:-unreadable}', not $x"
  fi
  parts="$parts; origin: ${url:-not read}"
  [ "$SP__GIT_FETCH_V" != pass ] || parts="$parts; fetch: $SP__GIT_FETCH_E"
  if [ -n "$fails" ]; then
    sp_result_line git CS3 fail "$fails; $parts" "$departure"
  elif [ -n "$notrun" ]; then
    sp_result_line git CS3 "not run" "$notrun; $parts" "$departure"
  else
    sp_result_line git CS3 pass "$parts" "$departure"
  fi

  # --- CL5, gated on the control issued after it.
  sp_ctl_held "$SP_STREAM"
  got="$(sp__git_probe config --local --get sbx.probe 2>/dev/null)" || got=""
  if [ -n "$got" ]; then
    sp__git_probe config --local --unset sbx.probe >/dev/null 2>&1 ||
      sp_refuse "git leg: sbx.probe is left in $SP_CLONE/.git/config"
    sp_row_result --direct git CL5 fail "sbx.probe=$got landed in $SP_CLONE/.git/config (unset after the session)" \
      "$departure"
  else
    sp_judge_call "$SP_STREAM" sandbox "$c_cl5"
    if [ "$SP_VERDICT" = pass ] && ! sp__line_with "${SP__TEXT:-}" "could not lock config file" >/dev/null; then
      SP_VERDICT=fail
      SP_EVIDENCE="refused, but with no 'could not lock config file' line: $SP_EVIDENCE"
    fi
    sp_row_result --direct git CL5 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  fi

  # Put the clone back on its run branch for the legs after this one.
  sp__git_probe switch -q "$SP_BRANCH" >/dev/null 2>&1 || sp_refuse "git leg: could not switch $SP_CLONE back to $SP_BRANCH"
  sp__git_probe checkout -q -- "$b" >/dev/null 2>&1 || sp_refuse "git leg: could not restore $b in $SP_CLONE"
  sp__git_probe branch -q -D "$x" >/dev/null 2>&1
}
