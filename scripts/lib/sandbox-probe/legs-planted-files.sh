#!/usr/bin/env bash
# legs-planted-files.sh — the sandbox probe's planted-files leg (rows CS12, CS13, CS14, L1, L2). CS12-CS14:
# commit-on-branch.sh, aimed at the files-plant clone ${SP_BRANCH}_files carrying a planted
# .git/objects/info/http-alternates, .git/commondir or .git/config.worktree, refuses before any git call and
# the clone's branch ref does not move. L1 is printed `not run`: unreachable on the clone layout. L2: a scratch
# main checkout's copy of refresh-branch.sh refuses a defaultBranch starting with `-`.
# The .git/config plants are legs-planted.sh's; this file neither sources nor calls it.
#
# Every plant is a `printf` the probe makes outside any session, the terminal-equivalent fixture
# docs/sandbox-verification.md → `## 0. Method` → **Three deliberate departures** permits; each row's departure
# names it. One file is planted at a time: hr_clone_target_check_var stops at the first of commondir,
# config.worktree, http-alternates it finds, so two plants together would both be refused on one name.
# A plant is removed before any probe git call judges the row.
#
# JOB MODE (SP_JOB_MODE=1). CS12, CS13, CS14 and L2 are printed `not run` by sp_job_skip_clone_rows; only
# L1 runs. On a main-checkout target push-branch.sh reaches its dash check through
# hr_wrapper_target_check_var, hr_worktree_config_check_var (its clone arm skipped), hr_pinned_hooks_path
# and hr_wrapper_branch_var, none of which looks the branch up in the run registry, so L1 is taken by
# pointing the checkout's own HEAD at refs/heads/-sbxdash. The probe refuses when -sbxdash already exists
# locally or on origin, and registers sp__pf_l1_restore before it creates the ref or moves HEAD; the
# restore removes only a local or remote -sbxdash at the commit the probe gave it. Anything other than
# the dash refusal answering prints L1 `not run`, naming what answered.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_PF_L1_COMMIT=""
SP_PF_L1_REMOTE_ABSENT=0
SP__PF_L1_TIP=""
SP__PF_V=()
SP__PF_E=()
SP__PF_D=()
SP__PF_OK=()
SP__PF_CE=()
SP__PF_PLANT=()
SP__PF_I=0
SP__PF_WHY=""
SP__PF_DIRTY=0
SP__PF_CLONE=""
SP__PF_CLONE_C=""
SP__PF_BRANCH=""
SP__PF_PROFILE=""
SP__PF_RV=""
SP__PF_RE=""

# sp__pf_i <row> — set SP__PF_I to the row's slot; status 1 for a row not in this leg.
sp__pf_i() {
  case "$1" in
    CS12) SP__PF_I=0 ;;
    CS13) SP__PF_I=1 ;;
    CS14) SP__PF_I=2 ;;
    *) return 1 ;;
  esac
}

# sp__pf_set <row> <verdict> <evidence> <departure> <plant path> — keep the row with the session's control
# verdict as sp_ctl_held left it.
sp__pf_set() {
  sp__pf_i "$1" || return 1
  SP__PF_V[$SP__PF_I]="$2"
  SP__PF_E[$SP__PF_I]="$3"
  SP__PF_D[$SP__PF_I]="$4"
  SP__PF_PLANT[$SP__PF_I]="$5"
  SP__PF_OK[$SP__PF_I]="${SP_CTL_OK:-}"
  SP__PF_CE[$SP__PF_I]="${SP_CTL_EVIDENCE:-}"
}

# sp__pf_stop <row> <why> [<departure>] [<plant path>] — a row stopped before its session was judged. Its
# control verdict is set to held, so the line names the real cause rather than a control never issued.
sp__pf_stop() {
  sp__pf_i "$1" || return 1
  SP__PF_V[$SP__PF_I]="not run"
  SP__PF_E[$SP__PF_I]="$2"
  SP__PF_D[$SP__PF_I]="${3:-}"
  SP__PF_PLANT[$SP__PF_I]="${4:-}"
  SP__PF_OK[$SP__PF_I]=1
  SP__PF_CE[$SP__PF_I]=""
}

sp__pf_init() {
  local row
  SP__PF_DIRTY=0
  SP__PF_WHY=""
  for row in CS12 CS13 CS14; do
    sp__pf_stop "$row" "the leg stopped before this row"
  done
}

# sp__pf_lower <text> — ASCII lower case.
sp__pf_lower() {
  printf '%s' "$1" | LC_ALL=C tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz'
}

# sp__pf_git <repo> <git argument>... — the probe's own git: no hook, no fsmonitor, a fixed identity, unsigned.
# Every setting is a -c, so nothing is written into the repository's .git/config.
sp__pf_git() {
  local repo="$1"
  shift
  git -C "$repo" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c user.name="sandbox probe" \
    -c user.email="sandbox-probe@invalid" -c commit.gpgSign=false "$@"
}

# sp__pf_clone — cut the files-plant clone once. Status 1 with SP__PF_WHY.
sp__pf_clone() {
  local err line last=""
  err="$SP_TMP/planted-files-clone.stderr"
  if ! sp_extra_clone "${SP_BRANCH}_files" --no-bootstrap 2>"$err"; then
    while IFS= read -r line; do
      [ -n "$line" ] && last="$line"
    done <"$err"
    cat -- "$err" >&2
    SP__PF_WHY="${last:-sp_extra_clone ${SP_BRANCH}_files refused with no message}"
    return 1
  fi
  cat -- "$err" >&2
  # Copied at once: the next sp_extra_clone overwrites SP_EXTRA_*.
  SP__PF_CLONE="$SP_EXTRA_CLONE"
  SP__PF_PROFILE="$SP_EXTRA_PROFILE"
  SP__PF_BRANCH="${SP_BRANCH}_files"
  if ! sp__ctl_literal "files-plant clone" "$SP__PF_CLONE"; then
    SP__PF_WHY="the files-plant clone path '$SP__PF_CLONE' is not spellable as a literal"
    return 1
  fi
  # The wrapper names the clone by its canonical path in its refusal.
  SP__PF_CLONE_C="$(CDPATH= cd -P -- "$SP__PF_CLONE" 2>/dev/null && pwd -P)" || SP__PF_CLONE_C=""
  if [ -z "$SP__PF_CLONE_C" ]; then
    SP__PF_WHY="the files-plant clone '$SP__PF_CLONE' has no canonical path"
    return 1
  fi
  return 0
}

# sp__pf_refusal <stream> <exact command> <wanted text> — pass when the wrapper ran and printed a line carrying
# `refusing to commit:` and then <wanted text>; a refusal naming another file or reason is fail, quoted. Sets
# SP__PF_RV and SP__PF_RE.
sp__pf_refusal() {
  local stream="$1" cmd="$2" prefix want text line low other=""
  prefix="refusing to commit:"
  want="$(sp__pf_lower "$3")"
  sp_judge_call "$stream" ran "$cmd"
  if [ "$SP_VERDICT" = "not run" ]; then
    SP__PF_RV="not run"
    SP__PF_RE="$SP_EVIDENCE"
    return 0
  fi
  text="${SP__TEXT:-}"
  if [ "$SP_LAYER" != ran ]; then
    SP__PF_RV=fail
    SP__PF_RE="the wrapper did not run: refused at $SP_LAYER: $SP_EVIDENCE"
    return 0
  fi
  while IFS= read -r line; do
    low="$(sp__pf_lower "$line")"
    case "$low" in
      *"$prefix"*"$want"*)
        SP__PF_RV=pass
        SP__PF_RE="$line"
        return 0
        ;;
      *"$prefix"*) [ -n "$other" ] || other="$line" ;;
    esac
  done <<EOF
$text
EOF
  SP__PF_RV=fail
  if [ -n "$other" ]; then
    SP__PF_RE="refused on another file or reason: $other"
  else
    SP__PF_RE="no '$prefix … $3' line, so the wrapper did not refuse on the plant: $(sp__first_line "$text")"
  fi
}

# sp__pf_row <row> <name under .git> <content> — plant one file in the files-plant clone, one measured commit
# call, its control last; the plant removed after the session and before any judgement.
sp__pf_row() {
  local row="$1" name="$2" content="$3" tag plant file abs pfile cmd want departure d ref launched=1 out
  tag="$(sp__pf_lower "$row")"
  plant="$SP__PF_CLONE/.git/$name"
  departure="fixture planted by the probe outside any session: printf '$content' > $plant"
  if [ "$SP__PF_DIRTY" -eq 1 ]; then
    sp__pf_stop "$row" "$SP__PF_WHY" "$departure"
    return 0
  fi
  sp_ctl_prepare "$tag"
  # An uncommitted new file, so a commit that ran would move the ref.
  file="sbx_pf_$tag.txt"
  abs="$SP__PF_CLONE/$file"
  if [ -e "$abs" ] || [ -L "$abs" ] || [ -e "$plant" ] || [ -L "$plant" ]; then
    sp__pf_stop "$row" "$abs or $plant exists before the session" "$departure"
    return 0
  fi
  if ! printf 'sandbox probe planted-files %s\n' "$tag" >"$abs" 2>/dev/null; then
    sp__pf_stop "$row" "could not write $abs" "$departure"
    return 0
  fi
  ref="$(git -C "$SP__PF_CLONE" rev-parse --verify -q "refs/heads/$SP__PF_BRANCH" 2>/dev/null)" || ref=""
  if [ -z "$ref" ]; then
    sp__pf_stop "$row" "no refs/heads/$SP__PF_BRANCH in the files-plant clone" "$departure"
    return 0
  fi
  if ! out="$(printf '%s\n' "$content" 2>&1 >"$plant")"; then
    sp__pf_stop "$row" "could not plant $plant: ${out%%$'\n'*}" "$departure"
    return 0
  fi
  sp_track "$plant"
  cmd="bash $SP_SCRIPTS/commit-on-branch.sh --repo $SP__PF_CLONE $file -- \"chore: Sandbox probe $row\""
  want="'$SP__PF_CLONE_C' is a clone, but $SP__PF_CLONE_C/.git/$name exists, and a clone the harness made has none"
  pfile="$SP_TMP/planted-files-$tag.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$cmd"
  sp_ctl_add "$pfile" commit "$tag"
  sp_session "planted-files-$tag" "$SP__PF_PROFILE" "$pfile" --cwd "$SP__PF_CLONE"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    launched=0
    SP__PF_WHY="session planted-files-$tag did not launch; see $SP_TMP/planted-files-$tag.stderr"
    sp_refuse "$SP__PF_WHY"
  fi
  d="$(sp_departures)"
  departure="${d:+$d; }$departure"
  rm -f -- "$plant"
  if [ -e "$plant" ] || [ -L "$plant" ]; then
    SP__PF_DIRTY=1
    SP__PF_WHY="the planted $plant could not be removed, so no later row runs"
    sp_refuse "$SP__PF_WHY"
  fi
  if [ "$launched" -eq 0 ]; then
    sp__pf_stop "$row" "session planted-files-$tag did not launch; see $SP_TMP/planted-files-$tag.stderr" \
      "$departure" "$plant"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"
  sp__pf_refusal "$SP_STREAM" "$cmd" "$want"
  if [ "$SP__PF_RV" != "not run" ]; then
    sp_judge_ref "$SP__PF_CLONE" "refs/heads/$SP__PF_BRANCH" "$ref" unchanged
    if [ "$SP_VERDICT" != pass ]; then
      SP__PF_RV=fail
      SP__PF_RE="the commit landed: $SP_EVIDENCE; $SP__PF_RE"
    else
      SP__PF_RE="$SP__PF_RE; $SP_EVIDENCE"
    fi
  fi
  sp__pf_set "$row" "$SP__PF_RV" "$SP__PF_RE (measured against the clone)" "$departure" "$plant"
}

# sp__pf_print — the plant-removed assertion, then one line per clone row through sp_row_result.
sp__pf_print() {
  local row p
  for row in CS12 CS13 CS14; do
    sp__pf_i "$row"
    SP_CTL_OK="${SP__PF_OK[$SP__PF_I]}"
    SP_CTL_EVIDENCE="${SP__PF_CE[$SP__PF_I]}"
    p="${SP__PF_PLANT[$SP__PF_I]}"
    if [ -n "$p" ] && { [ -e "$p" ] || [ -L "$p" ]; }; then
      sp_result_line planted-files "$row" fail \
        "the planted $p was not removed after its session; ${SP__PF_E[$SP__PF_I]}" "${SP__PF_D[$SP__PF_I]}"
    else
      sp_row_result planted-files "$row" "${SP__PF_V[$SP__PF_I]}" "${SP__PF_E[$SP__PF_I]}" \
        "${SP__PF_D[$SP__PF_I]}"
    fi
  done
  SP_CTL_OK=""
  SP_CTL_EVIDENCE=""
}

# sp__pf_l1 — no session: the clone arm refuses a dash-leading branch for its missing registry record first.
sp__pf_l1() {
  sp_result_line planted-files L1 "not run" \
    "unreachable on the clone layout: push-branch.sh's clone arm (hr_clone_target_check_var) looks up the run registry by the branch HEAD names and refuses a clone with no clone record for it, before the dash check; and hr_clone_create_var, the only route to such a record, refuses a branch starting with '-'; L1's 2026-10-14 worktree result stands" \
    ""
}

# sp__pf_l1_remote — origin's tip for refs/heads/-sbxdash into SP__PF_L1_TIP, empty when origin has none;
# status 1 when origin could not be read, so a failed read never counts as absent.
sp__pf_l1_remote() {
  local out rc
  SP__PF_L1_TIP=""
  out="$(git -C "$SP_MAIN" ls-remote --exit-code origin refs/heads/-sbxdash 2>/dev/null)"
  rc=$?
  case "$rc" in
    0)
      out="${out%%$'\n'*}"
      SP__PF_L1_TIP="${out%%[[:space:]]*}"
      ;;
    2) ;;
    *) return 1 ;;
  esac
  return 0
}

# sp__pf_l1_restore <head ref> — job mode: HEAD back to <head ref>; then the local refs/heads/-sbxdash
# removed only at SP_PF_L1_COMMIT; then origin's only when SP_PF_L1_REMOTE_ABSENT is 1 and its tip is
# SP_PF_L1_COMMIT, by refspec because a dash-leading name cannot go through --delete. Idempotent; status 1,
# naming what is left and its hand command, when a step fails.
sp__pf_l1_restore() {
  local head="${1:-}" cur rc=0
  if [ -z "$head" ]; then
    sp_refuse "L1 restore: no HEAD ref to restore '$SP_MAIN' to"
    return 1
  fi
  cur="$(git -C "$SP_MAIN" symbolic-ref -q HEAD 2>/dev/null)" || cur=""
  if [ "$cur" != "$head" ] && ! git -C "$SP_MAIN" symbolic-ref HEAD "$head" >/dev/null 2>&1; then
    sp_refuse "L1 restore: '$SP_MAIN' HEAD is left on ${cur:-an unreadable ref}; restore it with: git -C $SP_MAIN symbolic-ref HEAD $head"
    rc=1
  fi
  # Deleting the ref HEAD still names would leave HEAD unborn.
  if [ "$rc" -eq 0 ]; then
    cur="$(git -C "$SP_MAIN" rev-parse --verify -q refs/heads/-sbxdash 2>/dev/null)" || cur=""
    if [ -n "$cur" ] && [ "$cur" = "$SP_PF_L1_COMMIT" ]; then
      if ! git -C "$SP_MAIN" update-ref -d refs/heads/-sbxdash "$SP_PF_L1_COMMIT" >/dev/null 2>&1; then
        sp_refuse "L1 restore: refs/heads/-sbxdash is left in '$SP_MAIN'; remove it with: git -C $SP_MAIN update-ref -d refs/heads/-sbxdash"
        rc=1
      fi
    elif [ -n "$cur" ]; then
      sp_refuse "L1 restore: refs/heads/-sbxdash in '$SP_MAIN' is at $cur, not the probe's ${SP_PF_L1_COMMIT:-commit}; left untouched"
    fi
  fi
  if [ "$SP_PF_L1_REMOTE_ABSENT" = 1 ]; then
    if ! sp__pf_l1_remote; then
      sp_refuse "L1 restore: could not read origin for refs/heads/-sbxdash; if the probe's push landed, remove it with: git -C $SP_MAIN push origin :refs/heads/-sbxdash"
      rc=1
    elif [ -n "$SP__PF_L1_TIP" ] && [ "$SP__PF_L1_TIP" = "$SP_PF_L1_COMMIT" ]; then
      if ! git -C "$SP_MAIN" push origin :refs/heads/-sbxdash >/dev/null 2>&1; then
        sp_refuse "L1 restore: refs/heads/-sbxdash is left on origin; remove it with: git -C $SP_MAIN push origin :refs/heads/-sbxdash"
        rc=1
      fi
    elif [ -n "$SP__PF_L1_TIP" ]; then
      sp_refuse "L1 restore: origin's refs/heads/-sbxdash is at $SP__PF_L1_TIP, not the probe's ${SP_PF_L1_COMMIT:-commit}; left untouched"
    fi
  fi
  return "$rc"
}

# sp__pf_l1_grade <stream> <command> <remote dash ref before> <remote dash ref after> — sets SP_VERDICT and
# SP_EVIDENCE.
sp__pf_l1_grade() {
  local stream="$1" cmd="$2" before="$3" after="$4" line
  sp_judge_call "$stream" ran "$cmd"
  [ "$SP_VERDICT" = "not run" ] && return 0
  if [ "$SP_LAYER" = permission ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="refused at the permission layer, so it never reached push-branch.sh: $SP_LAYER_EVIDENCE"
    return 0
  fi
  if [ -n "$before" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="origin carried refs/heads/-sbxdash at $before before the session"
    return 0
  fi
  if [ -n "$after" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="the push landed: ls-remote refs/heads/-sbxdash none..$after; $(sp__message_line "${SP__TEXT:-}")"
    return 0
  fi
  if line="$(sp__line_with "${SP__TEXT:-}" "starts with '-', which git would read as an option — refusing to push")"; then
    SP_VERDICT=pass
    SP_EVIDENCE="$line; ls-remote: no refs/heads/-sbxdash on origin before or after"
    return 0
  fi
  SP_VERDICT="not run"
  SP_EVIDENCE="unreachable in job mode: $(sp__message_line "${SP__TEXT:-}")"
}

# sp__pf_l1_job — L1 in job mode: the checkout's HEAD pointed at refs/heads/-sbxdash, one push-branch.sh
# call aimed at the checkout, its control last; restored before the judgement.
sp__pf_l1_job() {
  local head cmd pfile ctl="$SP_CLONE/sbx_pf_l1_ctl" before="" after="" read_ok=1 restored=1 d ev note
  local departure="fixture set by the probe outside any session: refs/heads/-sbxdash created at HEAD's commit in $SP_MAIN and HEAD pointed at it"
  note="$(sp_job_git_note)"
  SP_PF_L1_REMOTE_ABSENT=0
  SP_PF_L1_COMMIT=""
  if ! sp__ctl_literal "scripts directory" "$SP_SCRIPTS" || ! sp__ctl_literal checkout "$SP_CLONE"; then
    sp_result_line planted-files L1 "not run" \
      "the scripts directory or the checkout path is not spellable as a literal$note" "$departure"
    return 0
  fi
  if [ -e "$ctl" ] || [ -L "$ctl" ]; then
    sp_result_line planted-files L1 "not run" \
      "'$ctl' exists before the session; the probe removes only what it created, so remove it and re-run$note" \
      "$departure"
    return 0
  fi
  if git -C "$SP_MAIN" rev-parse --verify -q refs/heads/-sbxdash >/dev/null 2>&1; then
    sp_result_line planted-files L1 "not run" \
      "refs/heads/-sbxdash exists in '$SP_MAIN' before the row; the probe removes only what it created$note" \
      "$departure"
    return 0
  fi
  if ! sp__pf_l1_remote; then
    sp_result_line planted-files L1 "not run" \
      "could not read origin for refs/heads/-sbxdash, so a push that landed could not be told from one already there$note" \
      "$departure"
    return 0
  fi
  if [ -n "$SP__PF_L1_TIP" ]; then
    sp_result_line planted-files L1 "not run" \
      "refs/heads/-sbxdash exists on origin at $SP__PF_L1_TIP before the row; the probe removes only what it created$note" \
      "$departure"
    return 0
  fi
  SP_PF_L1_REMOTE_ABSENT=1
  head="$(git -C "$SP_MAIN" symbolic-ref -q HEAD 2>/dev/null)" || head=""
  SP_PF_L1_COMMIT="$(git -C "$SP_MAIN" rev-parse --verify -q 'HEAD^{commit}' 2>/dev/null)" || SP_PF_L1_COMMIT=""
  if [ -z "$head" ] || [ -z "$SP_PF_L1_COMMIT" ]; then
    sp_result_line planted-files L1 "not run" "'$SP_MAIN' HEAD names no branch or no commit$note" "$departure"
    return 0
  fi
  # Registered before the ref and HEAD change, so an interrupted run removes both -sbxdash refs too.
  if ! sp_restore_register sp__pf_l1_restore "$head"; then
    sp_result_line planted-files L1 "not run" "could not register the L1 restore$note" "$departure"
    return 0
  fi
  if ! git -C "$SP_MAIN" update-ref refs/heads/-sbxdash "$SP_PF_L1_COMMIT" "" >/dev/null 2>&1 ||
    ! git -C "$SP_MAIN" symbolic-ref HEAD refs/heads/-sbxdash >/dev/null 2>&1; then
    sp__pf_l1_restore "$head" && sp_restore_clear
    sp_result_line planted-files L1 "not run" \
      "could not create refs/heads/-sbxdash or point HEAD at it in '$SP_MAIN'$note" "$departure"
    return 0
  fi

  cmd="bash $SP_SCRIPTS/push-branch.sh $SP_CLONE"
  sp_ctl_prepare pf_l1
  pfile="$SP_TMP/planted-files-l1.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$cmd"
  sp_track "$ctl"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl")" "$ctl"
  sp__pf_l1_remote || read_ok=0
  before="$SP__PF_L1_TIP"
  sp_session planted-files-l1 "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" \
    --allowed "Bash($cmd)" --allowed "$SP_DD_RULE"
  d="$(sp_departures)"
  departure="${d:+$d; }$departure"
  sp__pf_l1_remote || read_ok=0
  after="$SP__PF_L1_TIP"
  if sp__pf_l1_restore "$head"; then
    sp_restore_clear
  else
    restored=0
  fi
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session planted-files-l1 did not launch; see $SP_TMP/planted-files-l1.stderr"
    sp_result_line planted-files L1 "not run" \
      "session planted-files-l1 did not launch; see $SP_TMP/planted-files-l1.stderr$note" "$departure"
    return 0
  fi
  sp_ctl_held "$SP_STREAM"
  [ -f "$ctl" ] && [ ! -L "$ctl" ] && rm -f -- "$ctl"

  if [ "$read_ok" -eq 1 ]; then
    sp__pf_l1_grade "$SP_STREAM" "$cmd" "$before" "$after"
  else
    SP_VERDICT="not run"
    SP_EVIDENCE="could not read origin for refs/heads/-sbxdash before or after the session"
  fi
  ev="$SP_EVIDENCE"
  [ "$restored" -eq 1 ] || ev="$ev; the restore did not complete, so teardown retries it (see stderr)"
  sp_row_result --direct planted-files L1 "$SP_VERDICT" "$ev$note" "$departure"
  return 0
}

# sp__pf_l2 — a scratch main checkout under SP_TMP carrying copies of refresh-branch.sh and lib/, its
# defaultBranch "-x"; the probe calls its copy directly, since refresh-branch.sh reads the configuration of
# the main checkout its own location places. core.hooksPath stays unset, so hr_pinned_hooks_path resolves
# .git/hooks before the defaultBranch read.
sp__pf_l2() {
  local dir="$SP_TMP/dashrepo" dir_c out rc departure want want_c line got=""
  departure="fixture built by the probe: $dir, a scratch main checkout with byte-for-byte copies of $SP_SCRIPTS/refresh-branch.sh and $SP_SCRIPTS/lib/ and a harness.config.json whose defaultBranch is -x; the call is the probe's own from the terminal, not a session's"
  if [ -e "$dir" ] || [ -L "$dir" ]; then
    sp_result_line planted-files L2 "not run" "$dir exists before the row" "$departure"
    return 0
  fi
  if ! out="$(git -c init.defaultBranch=sbx_probe init -q "$dir" 2>&1)"; then
    sp_result_line planted-files L2 "not run" "git init $dir failed: ${out%%$'\n'*}" "$departure"
    return 0
  fi
  sp_track "$dir"
  if ! printf 'sandbox probe planted-files L2\n' >"$dir/sbx_pf_l2.txt" 2>/dev/null ||
    ! out="$(sp__pf_git "$dir" add -- sbx_pf_l2.txt 2>&1)" ||
    ! out="$(sp__pf_git "$dir" commit -q --no-verify -m "chore: Sandbox probe L2" 2>&1)"; then
    sp_result_line planted-files L2 "not run" "the scratch commit in $dir failed: ${out%%$'\n'*}" "$departure"
    return 0
  fi
  if ! mkdir -- "$dir/scripts" 2>/dev/null ||
    ! cp -p -- "$SP_SCRIPTS/refresh-branch.sh" "$dir/scripts/refresh-branch.sh" 2>/dev/null ||
    ! cp -pR -- "$SP_SCRIPTS/lib" "$dir/scripts/lib" 2>/dev/null; then
    sp_result_line planted-files L2 "not run" "could not copy refresh-branch.sh and lib/ into $dir/scripts" \
      "$departure"
    return 0
  fi
  if ! jq '.defaultBranch = "-x"' "$SP_MAIN/harness.config.json" >"$dir/harness.config.json" 2>/dev/null; then
    sp_result_line planted-files L2 "not run" "jq could not write $dir/harness.config.json" "$departure"
    return 0
  fi
  dir_c="$(CDPATH= cd -P -- "$dir" 2>/dev/null && pwd -P)" || dir_c="$dir"
  want="refresh-branch.sh: defaultBranch '-x' in '$dir/harness.config.json' starts with '-', which git would read as an option — refusing to merge"
  want_c="refresh-branch.sh: defaultBranch '-x' in '$dir_c/harness.config.json' starts with '-', which git would read as an option — refusing to merge"
  out="$(bash "$dir/scripts/refresh-branch.sh" 2>&1 >/dev/null)"
  rc=$?
  while IFS= read -r line; do
    if [ "$line" = "$want" ] || [ "$line" = "$want_c" ]; then
      got="$line"
      break
    fi
  done <<EOF
$out
EOF
  if [ -n "$got" ] && [ "$rc" -eq 1 ]; then
    sp_result_line planted-files L2 pass "$got (exit 1)" "$departure"
  elif [ -n "$got" ]; then
    sp_result_line planted-files L2 fail "$got, but exit $rc, not 1" "$departure"
  else
    sp_result_line planted-files L2 fail "exit $rc, no defaultBranch '-x' refusal: $(sp__first_line "$out")" \
      "$departure"
  fi
}

sp_leg_planted_files() {
  local row
  if [ "$SP_JOB_MODE" = 1 ]; then
    sp_job_skip_clone_rows planted-files
    sp__pf_l1_job
    return 0
  fi
  sp__pf_init
  if ! sp__ctl_literal "scripts directory" "$SP_SCRIPTS" || ! sp__ctl_literal "temp area" "$SP_TMP"; then
    for row in CS12 CS13 CS14; do
      sp__pf_stop "$row" "the scripts directory or the temp area is not spellable as a literal"
    done
  elif ! sp__pf_clone; then
    for row in CS12 CS13 CS14; do
      sp__pf_stop "$row" "$SP__PF_WHY"
    done
  else
    sp_ctl_clone
    sp__pf_row CS12 objects/info/http-alternates "https://sbx-probe.invalid/objects"
    # "." names the git directory itself as the common directory, so the agent CLI's own start-up git in
    # this cwd reads the same repository.
    sp__pf_row CS13 commondir "."
    sp__pf_row CS14 config.worktree "[sbx]"
  fi
  sp__pf_print
  sp__pf_l1
  sp__pf_l2
}
