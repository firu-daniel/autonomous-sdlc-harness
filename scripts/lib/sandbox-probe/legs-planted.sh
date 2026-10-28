#!/usr/bin/env bash
# legs-planted.sh — the sandbox probe's planted-config leg (rows C1, CW3, C2, K2, CW4, CS15): each main-checkout
# wrapper aimed at a repository whose .git/config carries a planted key must refuse before any git call, and
# no marker a planted command would create may appear. C1 and CW3 plant a scratch repository under SP_TMP;
# C2, K2, CW4 and CS15 plant the config-plant clone ${SP_BRANCH}_cfg, never SP_CLONE, one key at a time.
# The planted files and dash-leading names are legs-planted-files.sh's.
#
# Every plant is a `git config --file` the probe makes outside any session, the terminal-equivalent fixture
# docs/sandbox-verification.md → `## 0. Method` → **Three deliberate departures** permits; each row's
# departure names it. Each clone row seeds a commit first, so the clone is ahead of origin and a push that
# ran would move the tip, and leaves an uncommitted edit, so a commit that ran would move the ref.
#
# CW4's session runs from SP_CLONE, not the config-plant clone: the agent CLI's own start-up `git status` in
# its cwd would run a planted core.fsmonitor and create the marker with no wrapper call.
#
# Rows are judged as their sessions end and printed together after the leg, once the marker check has run;
# each row's control verdict is kept beside it and restored into SP_CTL_OK / SP_CTL_EVIDENCE for its
# sp_row_result. A row stopped before its session keeps SP_CTL_OK=1 with verdict `not run`, so its line
# names the real cause instead of a control that was never issued.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP__PC_V=()
SP__PC_E=()
SP__PC_D=()
SP__PC_OK=()
SP__PC_CE=()
SP__PC_MARK=()
SP__PC_I=0
SP__PC_WHY=""
SP__PC_DIRTY=0
SP__PC_CFG=""
SP__PC_CFG_C=""
SP__PC_CFG_BRANCH=""
SP__PC_CFG_PROFILE=""
SP__PC_FILE=""
SP__PC_REF=""
SP__PC_TIP=""
SP__PC_RV=""
SP__PC_RE=""

# sp__pc_i <row> — set SP__PC_I to the row's slot; status 1 for a row not in this leg.
sp__pc_i() {
  case "$1" in
    C1) SP__PC_I=0 ;;
    CW3) SP__PC_I=1 ;;
    C2) SP__PC_I=2 ;;
    K2) SP__PC_I=3 ;;
    CW4) SP__PC_I=4 ;;
    CS15) SP__PC_I=5 ;;
    *) return 1 ;;
  esac
}

# sp__pc_set <row> <verdict> <evidence> <departure> <marker or empty> — keep the row with the session's
# control verdict as sp_ctl_held left it.
sp__pc_set() {
  sp__pc_i "$1" || return 1
  SP__PC_V[$SP__PC_I]="$2"
  SP__PC_E[$SP__PC_I]="$3"
  SP__PC_D[$SP__PC_I]="$4"
  SP__PC_MARK[$SP__PC_I]="$5"
  SP__PC_OK[$SP__PC_I]="${SP_CTL_OK:-}"
  SP__PC_CE[$SP__PC_I]="${SP_CTL_EVIDENCE:-}"
}

# sp__pc_stop <row> <why> [<departure>] [<marker>] — a row stopped before its session was judged.
sp__pc_stop() {
  sp__pc_i "$1" || return 1
  SP__PC_V[$SP__PC_I]="not run"
  SP__PC_E[$SP__PC_I]="$2"
  SP__PC_D[$SP__PC_I]="${3:-}"
  SP__PC_MARK[$SP__PC_I]="${4:-}"
  SP__PC_OK[$SP__PC_I]=1
  SP__PC_CE[$SP__PC_I]=""
}

sp__pc_init() {
  local row
  SP__PC_DIRTY=0
  SP__PC_WHY=""
  for row in C1 CW3 C2 K2 CW4 CS15; do
    sp__pc_stop "$row" "the leg stopped before this row"
  done
}

# sp__pc_print — the marker check, then one line per row through sp_row_result.
sp__pc_print() {
  local row m
  for row in C1 CW3 C2 K2 CW4 CS15; do
    sp__pc_i "$row"
    SP_CTL_OK="${SP__PC_OK[$SP__PC_I]}"
    SP_CTL_EVIDENCE="${SP__PC_CE[$SP__PC_I]}"
    m="${SP__PC_MARK[$SP__PC_I]}"
    if [ -n "$m" ] && { [ -e "$m" ] || [ -L "$m" ]; }; then
      sp_row_result --direct planted-config "$row" fail \
        "marker $m exists, so a planted command ran; ${SP__PC_E[$SP__PC_I]}" "${SP__PC_D[$SP__PC_I]}"
    else
      sp_row_result planted-config "$row" "${SP__PC_V[$SP__PC_I]}" "${SP__PC_E[$SP__PC_I]}" \
        "${SP__PC_D[$SP__PC_I]}"
    fi
  done
  SP_CTL_OK=""
  SP_CTL_EVIDENCE=""
}

# sp__pc_lower <text> — ASCII lower case; git prints a config name's section and key in lower case.
sp__pc_lower() {
  printf '%s' "$1" | LC_ALL=C tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz'
}

# sp__pc_git <repo> <git argument>... — the probe's own git: no hook, no fsmonitor, a fixed identity, unsigned.
sp__pc_git() {
  local repo="$1"
  shift
  git -C "$repo" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c user.name="sandbox probe" \
    -c user.email="sandbox-probe@invalid" -c commit.gpgSign=false "$@"
}

# sp__pc_departure <file> <key> <value> — the row's departures: the session's, then the plant.
sp__pc_departure() {
  local d
  d="$(sp_departures)"
  printf '%s\n' "${d:+$d; }fixture planted by the probe outside any session: git config --file $1 $2 $3"
}

# sp__pc_helper <path> <marker> <last line> — a /bin/sh command that touches <marker>; both tracked.
sp__pc_helper() {
  if [ -e "$1" ] || [ -L "$1" ] || [ -e "$2" ] || [ -L "$2" ]; then
    SP__PC_WHY="$1 or its marker $2 exists before the session"
    return 1
  fi
  if ! printf '#!/bin/sh\n: >"%s"\n%s\n' "$2" "$3" >"$1" 2>/dev/null || ! chmod +x "$1"; then
    SP__PC_WHY="could not write the planted command $1"
    return 1
  fi
  sp_track "$1"
  sp_track "$2"
  return 0
}

# sp__pc_plant <config file> <key> <value>
sp__pc_plant() {
  local out
  if ! out="$(git config --file "$1" "$2" "$3" 2>&1)"; then
    SP__PC_WHY="git config --file $1 $2 failed: ${out%%$'\n'*}"
    return 1
  fi
  return 0
}

# sp__pc_unplant <config file> <key> <had 0|1> <original value> — restore the key, or remove it; on failure
# SP__PC_DIRTY=1, so no later clone row runs on two keys.
sp__pc_unplant() {
  local f="$1" key="$2" had="$3" orig="$4" now
  if [ "$had" -eq 1 ]; then
    git config --file "$f" "$key" "$orig" >/dev/null 2>&1
    now="$(git config --file "$f" --get "$key" 2>/dev/null)" || now=""
    [ "$now" = "$orig" ] && return 0
  else
    git config --file "$f" --unset "$key" >/dev/null 2>&1
    git config --file "$f" --get "$key" >/dev/null 2>&1 || return 0
  fi
  SP__PC_DIRTY=1
  SP__PC_WHY="the planted $key could not be removed from $f, so no later clone row runs"
  sp_refuse "$SP__PC_WHY"
  return 1
}

# sp__pc_session <name> <settings> <prompt file> <cwd> — status 1, with SP__PC_WHY, when no stream was written.
sp__pc_session() {
  sp_session "$1" "$2" "$3" --cwd "$4"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    SP__PC_WHY="session $1 did not launch; see $SP_TMP/$1.stderr"
    sp_refuse "$SP__PC_WHY"
    return 1
  fi
  return 0
}

# sp__pc_refusal <stream> <exact command> <prefix> <wanted text> — pass when the wrapper ran and printed a
# line carrying <prefix> and then <wanted text>, compared case-insensitively; not run when the call was refused
# at the permission layer. Sets SP__PC_RV and SP__PC_RE.
sp__pc_refusal() {
  local stream="$1" cmd="$2" prefix want text line low
  prefix="$(sp__pc_lower "$3")"
  want="$(sp__pc_lower "$4")"
  sp_judge_call "$stream" ran "$cmd"
  if [ "$SP_VERDICT" = "not run" ]; then
    SP__PC_RV="not run"
    SP__PC_RE="$SP_EVIDENCE"
    return 0
  fi
  text="${SP__TEXT:-}"
  if [ "$SP_LAYER" = permission ]; then
    SP__PC_RV="not run"
    SP__PC_RE="refused at the permission layer, so it never reached the wrapper: $SP_EVIDENCE"
    return 0
  fi
  if [ "$SP_LAYER" != ran ]; then
    SP__PC_RV=fail
    SP__PC_RE="the wrapper did not run: refused at $SP_LAYER: $SP_EVIDENCE"
    return 0
  fi
  while IFS= read -r line; do
    low="$(sp__pc_lower "$line")"
    case "$low" in *"$prefix"*"$want"*)
      SP__PC_RV=pass
      SP__PC_RE="$line"
      return 0
      ;;
    esac
  done <<EOF
$text
EOF
  SP__PC_RV=fail
  SP__PC_RE="no '$3 … $4' line, so the wrapper did not refuse on the plant: $(sp__first_line "$text")"
}

# sp__pc_scratch <dir> <file> — a scratch repository with one commit of <file>; tracked. Status 1 with SP__PC_WHY.
sp__pc_scratch() {
  local dir="$1" file="$2" out
  if [ -e "$dir" ] || [ -L "$dir" ]; then
    SP__PC_WHY="$dir exists before the row"
    return 1
  fi
  if ! out="$(git -c init.defaultBranch=sbx_probe init -q "$dir" 2>&1)"; then
    SP__PC_WHY="git init $dir failed: ${out%%$'\n'*}"
    return 1
  fi
  sp_track "$dir"
  if ! printf 'sandbox probe planted-config scratch\n' >"$dir/$file" 2>/dev/null ||
    ! out="$(sp__pc_git "$dir" add -- "$file" 2>&1)" ||
    ! out="$(sp__pc_git "$dir" commit -q --no-verify -m "chore: Sandbox probe scratch" 2>&1)"; then
    SP__PC_WHY="the scratch commit of $file in $dir failed: ${out%%$'\n'*}"
    return 1
  fi
  return 0
}

# sp__pc_c1 — a scratch repository whose .git/config sets core.sshCommand; push through the main wrapper.
sp__pc_c1() {
  local dir="$SP_TMP/scr_sshcmd" helper="$SP_TMP/sbx_pc_c1_ssh.sh" marker="$SP_TMP/sbx_pc_c1.marker"
  local f pfile cmd departure
  f="$dir/.git/config"
  departure="$(sp__pc_departure "$f" core.sshCommand "$helper")"
  sp_ctl_prepare c1
  if ! sp__pc_scratch "$dir" sbx_pc_c1.txt || ! sp__pc_helper "$helper" "$marker" "exit 1" ||
    ! sp__pc_plant "$f" remote.origin.url ssh://sbx-probe.invalid/sbx.git ||
    ! sp__pc_plant "$f" core.sshCommand "$helper"; then
    sp__pc_stop C1 "$SP__PC_WHY" "$departure" "$marker"
    return 0
  fi
  cmd="bash $SP_SCRIPTS/push-branch.sh $dir"
  pfile="$SP_TMP/planted-c1.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$cmd"
  sp_ctl_add "$pfile" commit c1
  sp_ctl_add "$pfile" push
  if ! sp__pc_session planted-c1 "$SP_RUN_PROFILE" "$pfile" "$SP_CLONE"; then
    sp__pc_stop C1 "$SP__PC_WHY" "$departure" "$marker"
    return 0
  fi
  departure="$(sp__pc_departure "$f" core.sshCommand "$helper")"
  departure="$departure, after remote.origin.url ssh://sbx-probe.invalid/sbx.git"
  sp_ctl_held "$SP_STREAM"
  sp__pc_refusal "$SP_STREAM" "$cmd" "refusing to push:" "is neither the main checkout"
  # The scratch repository has no reachable origin: a push that ran shows as the marker, read at print time.
  [ "$SP__PC_RV" = "not run" ] || SP__PC_RE="$SP__PC_RE; no reachable origin, so the marker is the push's evidence"
  sp__pc_set C1 "$SP__PC_RV" "$SP__PC_RE" "$departure" "$marker"
}

# sp__pc_cw3 — a scratch repository whose .git/config sets core.fsmonitor; commit through the main wrapper.
sp__pc_cw3() {
  local dir="$SP_TMP/scr" helper="$SP_TMP/sbx_pc_cw3_fsmonitor.sh" marker="$SP_TMP/sbx_pc_cw3.marker"
  local file=sbx_pc_cw3.txt f pfile cmd departure before
  f="$dir/.git/config"
  departure="$(sp__pc_departure "$f" core.fsmonitor "$helper")"
  sp_ctl_prepare cw3
  if ! sp__pc_scratch "$dir" "$file"; then
    sp__pc_stop CW3 "$SP__PC_WHY" "$departure" "$marker"
    return 0
  fi
  if ! printf 'sandbox probe planted-config cw3 changed\n' >>"$dir/$file" 2>/dev/null; then
    sp__pc_stop CW3 "could not edit $dir/$file" "$departure" "$marker"
    return 0
  fi
  before="$(git -C "$dir" rev-parse --verify -q HEAD 2>/dev/null)" || before=""
  if ! sp__pc_helper "$helper" "$marker" "exit 1" || ! sp__pc_plant "$f" core.fsmonitor "$helper"; then
    sp__pc_stop CW3 "$SP__PC_WHY" "$departure" "$marker"
    return 0
  fi
  cmd="bash $SP_SCRIPTS/commit-on-branch.sh --repo $dir $file -- \"chore: Sandbox probe CW3\""
  pfile="$SP_TMP/planted-cw3.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$cmd"
  sp_ctl_add "$pfile" commit cw3
  if ! sp__pc_session planted-cw3 "$SP_RUN_PROFILE" "$pfile" "$SP_CLONE"; then
    sp__pc_stop CW3 "$SP__PC_WHY" "$departure" "$marker"
    return 0
  fi
  departure="$(sp__pc_departure "$f" core.fsmonitor "$helper")"
  sp_ctl_held "$SP_STREAM"
  sp__pc_refusal "$SP_STREAM" "$cmd" "refusing to commit:" "is neither the main checkout"
  if [ "$SP__PC_RV" != "not run" ]; then
    # The probe's own rev-parse reads no index, so the plant stays in place for it.
    sp_judge_ref "$dir" HEAD "$before" unchanged
    if [ "$SP_VERDICT" != pass ]; then
      SP__PC_RV=fail
      SP__PC_RE="the scratch HEAD moved: $SP_EVIDENCE; $SP__PC_RE"
    else
      SP__PC_RE="$SP__PC_RE; $SP_EVIDENCE"
    fi
  fi
  sp__pc_set CW3 "$SP__PC_RV" "$SP__PC_RE" "$departure" "$marker"
}

# sp__pc_cfg_clone — cut the config-plant clone once. Status 1 with SP__PC_WHY.
sp__pc_cfg_clone() {
  local err line last=""
  err="$SP_TMP/planted-cfg-clone.stderr"
  if ! sp_extra_clone "${SP_BRANCH}_cfg" --no-bootstrap 2>"$err"; then
    while IFS= read -r line; do
      [ -n "$line" ] && last="$line"
    done <"$err"
    cat -- "$err" >&2
    SP__PC_WHY="${last:-sp_extra_clone ${SP_BRANCH}_cfg refused with no message}"
    return 1
  fi
  cat -- "$err" >&2
  # Copied at once: the next sp_extra_clone overwrites SP_EXTRA_*.
  SP__PC_CFG="$SP_EXTRA_CLONE"
  SP__PC_CFG_PROFILE="$SP_EXTRA_PROFILE"
  SP__PC_CFG_BRANCH="${SP_BRANCH}_cfg"
  if ! sp__ctl_literal "config-plant clone" "$SP__PC_CFG"; then
    SP__PC_WHY="the config-plant clone path '$SP__PC_CFG' is not spellable as a literal"
    return 1
  fi
  # The wrappers name the clone by its canonical path in their refusals.
  SP__PC_CFG_C="$(CDPATH= cd -P -- "$SP__PC_CFG" 2>/dev/null && pwd -P)" || SP__PC_CFG_C=""
  if [ -z "$SP__PC_CFG_C" ]; then
    SP__PC_WHY="the config-plant clone '$SP__PC_CFG' has no canonical path"
    return 1
  fi
  return 0
}

# sp__pc_seed <tag> — commit a new sbx_pc_<tag>.txt in the config-plant clone, then edit it uncommitted. Sets
# SP__PC_FILE, SP__PC_REF and SP__PC_TIP; status 1 with SP__PC_WHY, including when the clone is not ahead.
sp__pc_seed() {
  local rel="sbx_pc_$1.txt" abs out
  abs="$SP__PC_CFG/$rel"
  SP__PC_FILE=""
  SP__PC_REF=""
  SP__PC_TIP=""
  if [ -e "$abs" ] || [ -L "$abs" ]; then
    SP__PC_WHY="$abs already exists before the session"
    return 1
  fi
  if ! printf 'sandbox probe planted-config %s\n' "$1" >"$abs" 2>/dev/null ||
    ! out="$(sp__pc_git "$SP__PC_CFG" add -- "$rel" 2>&1)" ||
    ! out="$(sp__pc_git "$SP__PC_CFG" commit -q --no-verify -m "chore: Seed sandbox probe $1" -- "$rel" 2>&1)"; then
    SP__PC_WHY="the seed commit of $rel in the config-plant clone failed: ${out:-a write failed}"
    SP__PC_WHY="${SP__PC_WHY%%$'\n'*}"
    return 1
  fi
  if ! printf 'sandbox probe planted-config %s changed\n' "$1" >>"$abs" 2>/dev/null; then
    SP__PC_WHY="could not edit $abs"
    return 1
  fi
  SP__PC_REF="$(git -C "$SP__PC_CFG" rev-parse --verify -q "refs/heads/$SP__PC_CFG_BRANCH" 2>/dev/null)" ||
    SP__PC_REF=""
  SP__PC_TIP="$(sp_remote_tip "$SP_MAIN" "$SP__PC_CFG_BRANCH")"
  if [ -z "$SP__PC_REF" ]; then
    SP__PC_WHY="no refs/heads/$SP__PC_CFG_BRANCH in the config-plant clone after the seed commit"
    return 1
  fi
  if [ "$SP__PC_REF" = "$SP__PC_TIP" ]; then
    SP__PC_WHY="the config-plant clone is not ahead of origin after the seed commit, so a push could not be told from none"
    return 1
  fi
  SP__PC_FILE="$rel"
  return 0
}

# sp__pc_held <push|commit> <ref before> <tip before> — after a refusal line: fail when the remote tip (push)
# or refs/heads/<cfg branch> (commit) moved. Rewrites SP__PC_RV and SP__PC_RE.
sp__pc_held() {
  if [ "$1" = push ]; then
    sp_judge_push "$SP_MAIN" "$SP__PC_CFG_BRANCH" "$3"
    if [ "$SP_VERDICT" = pass ]; then
      SP__PC_RV=fail
      SP__PC_RE="the push landed: $SP_EVIDENCE; $SP__PC_RE"
      return 0
    fi
  else
    sp_judge_ref "$SP__PC_CFG" "refs/heads/$SP__PC_CFG_BRANCH" "$2" unchanged
    if [ "$SP_VERDICT" != pass ]; then
      SP__PC_RV=fail
      SP__PC_RE="the commit landed: $SP_EVIDENCE; $SP__PC_RE"
      return 0
    fi
  fi
  SP__PC_RE="$SP__PC_RE; $SP_EVIDENCE"
}

# sp__pc_clone_row <row> <key> <value> <push|commit> <wanted text> <marker or empty> <settings> <cwd> — one
# planted key in the config-plant clone, one measured call, its control last; the key restored after.
sp__pc_clone_row() {
  local row="$1" key="$2" value="$3" kind="$4" want="$5" marker="$6" settings="$7" cwd="$8"
  local tag f had=0 orig="" pfile cmd prefix departure ref tip launched=1
  tag="$(sp__pc_lower "$row")"
  f="$SP__PC_CFG/.git/config"
  departure="$(sp__pc_departure "$f" "$key" "$value")"
  if [ "$SP__PC_DIRTY" -eq 1 ]; then
    sp__pc_stop "$row" "$SP__PC_WHY" "$departure" "$marker"
    return 0
  fi
  sp_ctl_prepare "$tag"
  if ! sp__pc_seed "$tag"; then
    sp__pc_stop "$row" "$SP__PC_WHY" "$departure" "$marker"
    return 0
  fi
  ref="$SP__PC_REF"
  tip="$SP__PC_TIP"
  orig="$(git config --file "$f" --get "$key" 2>/dev/null)" && had=1
  if ! sp__pc_plant "$f" "$key" "$value"; then
    sp__pc_unplant "$f" "$key" "$had" "$orig"
    sp__pc_stop "$row" "$SP__PC_WHY" "$departure" "$marker"
    return 0
  fi
  if [ "$kind" = push ]; then
    cmd="bash $SP_SCRIPTS/push-branch.sh $SP__PC_CFG"
    prefix="refusing to push:"
  else
    cmd="bash $SP_SCRIPTS/commit-on-branch.sh --repo $SP__PC_CFG $SP__PC_FILE -- \"chore: Sandbox probe $row\""
    prefix="refusing to commit:"
  fi
  pfile="$SP_TMP/planted-$tag.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$cmd"
  sp_ctl_add "$pfile" commit "$tag"
  [ "$kind" = push ] && sp_ctl_add "$pfile" push
  sp__pc_session "planted-$tag" "$settings" "$pfile" "$cwd" || launched=0
  departure="$(sp__pc_departure "$f" "$key" "$value")"
  # Removed before any judgement, so no probe git call reads the plant.
  sp__pc_unplant "$f" "$key" "$had" "$orig"
  if [ "$launched" -eq 0 ]; then
    sp__pc_stop "$row" "$SP__PC_WHY" "$departure" "$marker"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"
  sp__pc_refusal "$SP_STREAM" "$cmd" "$prefix" "$want"
  [ "$SP__PC_RV" = "not run" ] || sp__pc_held "$kind" "$ref" "$tip"
  sp__pc_set "$row" "$SP__PC_RV" "$SP__PC_RE (measured against the clone, not a worktree)" "$departure" "$marker"
}

# sp__pc_k2_hooks — a hooks directory whose pre-push and pre-commit touch the K2 marker; tracked.
sp__pc_k2_hooks() {
  local dir="$1" marker="$2"
  if [ -e "$dir" ] || [ -L "$dir" ]; then
    SP__PC_WHY="$dir exists before the row"
    return 1
  fi
  if ! mkdir "$dir" 2>/dev/null; then
    SP__PC_WHY="could not create the planted hooks directory $dir"
    return 1
  fi
  sp_track "$dir"
  sp__pc_helper "$dir/pre-push" "$marker" "exit 1" || return 1
  # A copy, because sp__pc_helper refuses a marker that already exists.
  if ! cp -- "$dir/pre-push" "$dir/pre-commit" 2>/dev/null || ! chmod +x "$dir/pre-commit"; then
    SP__PC_WHY="could not write $dir/pre-commit"
    return 1
  fi
  return 0
}

# sp__pc_cs15 — sbx.cs15, a key git gives no meaning to: push then commit in one session, the controls last.
sp__pc_cs15() {
  local f key=sbx.cs15 want pfile push commit departure ref tip launched=1 pv pe cv ce
  f="$SP__PC_CFG/.git/config"
  departure="$(sp__pc_departure "$f" "$key" true)"
  if [ "$SP__PC_DIRTY" -eq 1 ]; then
    sp__pc_stop CS15 "$SP__PC_WHY" "$departure"
    return 0
  fi
  sp_ctl_prepare cs15
  if ! sp__pc_seed cs15; then
    sp__pc_stop CS15 "$SP__PC_WHY" "$departure"
    return 0
  fi
  ref="$SP__PC_REF"
  tip="$SP__PC_TIP"
  if ! sp__pc_plant "$f" "$key" true; then
    sp__pc_unplant "$f" "$key" 0 ""
    sp__pc_stop CS15 "$SP__PC_WHY" "$departure"
    return 0
  fi
  want="$SP__PC_CFG_C/.git/config sets $key, which the clone allow-list does not hold, so this clone's configuration is not trusted"
  push="bash $SP_SCRIPTS/push-branch.sh $SP__PC_CFG"
  commit="bash $SP_SCRIPTS/commit-on-branch.sh --repo $SP__PC_CFG $SP__PC_FILE -- \"chore: Sandbox probe CS15\""
  pfile="$SP_TMP/planted-cs15.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$push"
  sp_prompt_bash "$pfile" "$commit"
  sp_ctl_add "$pfile" commit cs15
  sp_ctl_add "$pfile" push
  sp__pc_session planted-cs15 "$SP__PC_CFG_PROFILE" "$pfile" "$SP__PC_CFG" || launched=0
  departure="$(sp__pc_departure "$f" "$key" true)"
  sp__pc_unplant "$f" "$key" 0 ""
  if [ "$launched" -eq 0 ]; then
    sp__pc_stop CS15 "$SP__PC_WHY" "$departure"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"
  sp__pc_refusal "$SP_STREAM" "$push" "refusing to push:" "$want"
  [ "$SP__PC_RV" = "not run" ] || sp__pc_held push "$ref" "$tip"
  pv="$SP__PC_RV"
  pe="$SP__PC_RE"
  sp__pc_refusal "$SP_STREAM" "$commit" "refusing to commit:" "$want"
  [ "$SP__PC_RV" = "not run" ] || sp__pc_held commit "$ref" "$tip"
  cv="$SP__PC_RV"
  ce="$SP__PC_RE"
  if [ "$pv" = fail ] || [ "$cv" = fail ]; then
    SP__PC_RV=fail
  elif [ "$pv" = pass ] && [ "$cv" = pass ]; then
    SP__PC_RV=pass
  else
    SP__PC_RV="not run"
  fi
  sp__pc_set CS15 "$SP__PC_RV" "push: $pe; commit: $ce (measured against the clone)" "$departure" ""
}

sp_leg_planted_config() {
  local row k2_marker k2_hooks c2_helper c2_marker cw4_helper cw4_marker
  sp__pc_init
  if ! sp__ctl_literal "scripts directory" "$SP_SCRIPTS" || ! sp__ctl_literal "temp area" "$SP_TMP"; then
    for row in C1 CW3 C2 K2 CW4 CS15; do
      sp__pc_stop "$row" "the scripts directory or the temp area is not spellable as a literal"
    done
    sp__pc_print
    return 0
  fi
  sp_ctl_clone
  sp__pc_c1
  sp__pc_cw3

  if ! sp__pc_cfg_clone; then
    for row in C2 K2 CW4 CS15; do
      sp__pc_stop "$row" "$SP__PC_WHY"
    done
    sp__pc_print
    return 0
  fi

  c2_helper="$SP_TMP/sbx_pc_c2_ssh.sh"
  c2_marker="$SP_TMP/sbx_pc_c2.marker"
  if sp__pc_helper "$c2_helper" "$c2_marker" 'exec ssh "$@"'; then
    sp__pc_clone_row C2 core.sshCommand "$c2_helper" push \
      "$SP__PC_CFG_C/.git/config sets core.sshCommand, which the clone allow-list does not hold, so this clone's configuration is not trusted" \
      "$c2_marker" "$SP__PC_CFG_PROFILE" "$SP__PC_CFG"
  else
    sp__pc_stop C2 "$SP__PC_WHY" "" "$c2_marker"
  fi

  k2_hooks="$SP_TMP/sbx_pc_k2_hooks"
  k2_marker="$SP_TMP/sbx_pc_k2.marker"
  if sp__pc_k2_hooks "$k2_hooks" "$k2_marker"; then
    sp__pc_clone_row K2 core.hooksPath "$k2_hooks" push \
      "$SP__PC_CFG_C/.git/config sets core.hooksPath to a value the clone allow-list does not allow" \
      "$k2_marker" "$SP__PC_CFG_PROFILE" "$SP__PC_CFG"
  else
    sp__pc_stop K2 "$SP__PC_WHY" "" "$k2_marker"
  fi

  cw4_helper="$SP_TMP/sbx_pc_cw4_fsmonitor.sh"
  cw4_marker="$SP_TMP/sbx_pc_cw4.marker"
  if sp__pc_helper "$cw4_helper" "$cw4_marker" "exit 1"; then
    sp__pc_clone_row CW4 core.fsmonitor "$cw4_helper" commit \
      "$SP__PC_CFG_C/.git/config sets core.fsmonitor, which the clone allow-list does not hold, so this clone's configuration is not trusted" \
      "$cw4_marker" "$SP_RUN_PROFILE" "$SP_CLONE"
  else
    sp__pc_stop CW4 "$SP__PC_WHY" "" "$cw4_marker"
  fi

  sp__pc_cs15
  sp__pc_print
}
