#!/usr/bin/env bash
# legs-refresh.sh — the sandbox probe's wrappers-refresh leg (rows R0, R1, R2, R3, R4): the main checkout's
# refresh-branch.sh aimed at a clone behind the default, in the three fixtures of
# docs/sandbox-verification.md → `## 3. The wrappers` rows R1-R3, plus R0 read off R1's call and R4, the
# probe clone's own copy. Each refresh is judged by the ref and the working copy; R3's exit 4 is read only
# together with its no-write comparison.
#
# R4 is two sessions on SP_RUN_PROFILE, printed as one line gated on both sessions' controls:
# wrappers-refresh-r4 (the fetch, judged by the branch staying unchanged) and then
# wrappers-refresh-r4-local (`refresh-branch.sh --local <clone>`), so the merge cannot disturb the fetch's
# judgement. Before the second, the probe ensures the clone has refs/heads/<default>, creating it at
# refs/remotes/origin/<default> where absent. `sp__rf_r4_local_grade <stream> <command>` grades the --local
# half from its arguments and the stream alone.
#
# A fixture is a branch at the default's tip~1 (plus, for R2 and R3, one commit of its own) built in a
# scratch clone under SP_TMP and fetched into <main> as refs/heads/<fx> — the leg's only write to <main> —
# then cut as its own clone with `sp_extra_clone <fx> --existing`, because create-worktree.sh's default
# mode cuts at the default's tip. Each fixture branch is registered with sp_track_branch before the ref is
# written, so teardown deletes it; it is never pushed.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP__RF_SRC=""
SP__RF_TIP=""
SP__RF_CLONE=""
SP__RF_PROFILE=""
SP__RF_BRANCH=""
SP__RF_WHY=""
SP__RF_C_FILE=""
SP__RF_C_LINE=""
SP__RF_SNAP_REFS=""
SP__RF_SNAP_INDEX=""
SP__RF_SNAP_FILES=""
SP__RF_SNAP_STATUS=""

# sp__rf_src <git argument>... — git in the scratch clone, hooks off.
sp__rf_src() {
  git -C "$SP__RF_SRC" -c core.hooksPath=/dev/null "$@"
}

# sp__rf_src_commit <message> — commit what is staged in the scratch clone with a fixed identity, unsigned.
sp__rf_src_commit() {
  sp__rf_src -c user.name="sandbox probe" -c user.email="sandbox-probe@invalid" -c commit.gpgSign=false \
    commit -q --no-verify -m "$1"
}

# sp__rf_last_line <file> — the file's last non-empty line.
sp__rf_last_line() {
  local line last=""
  while IFS= read -r line; do
    [ -n "$line" ] && last="$line"
  done <"$1"
  printf '%s' "$last"
}

# sp__rf_prepare_src — read the default's tip as origin reports it and clone the scratch source once.
# Status 1 with SP__RF_WHY.
sp__rf_prepare_src() {
  local out
  SP__RF_WHY=""
  SP__RF_TIP="$(sp_remote_tip "$SP_MAIN" "$SP_DEFAULT_BRANCH")"
  if [ -z "$SP__RF_TIP" ]; then
    SP__RF_WHY="ls-remote: no refs/heads/$SP_DEFAULT_BRANCH on origin"
    return 1
  fi
  if ! git -C "$SP_MAIN" rev-parse --verify -q "$SP__RF_TIP~1^{commit}" >/dev/null 2>&1; then
    SP__RF_WHY="the default's tip $SP__RF_TIP has no parent readable in $SP_MAIN"
    return 1
  fi
  SP__RF_SRC="$SP_TMP/fxsrc"
  if ! out="$(git clone -q --no-checkout --shared "$SP_MAIN" "$SP__RF_SRC" 2>&1)"; then
    SP__RF_WHY="could not clone the fixture source $SP__RF_SRC: ${out%%$'\n'*}"
    SP__RF_SRC=""
    return 1
  fi
  sp_track "$SP__RF_SRC"
  return 0
}

# sp__rf_protected <path> <protected set, one per line> — status 0 when <path> is, or lies under, an entry.
sp__rf_protected() {
  local p
  while IFS= read -r p; do
    p="${p%/}"
    [ -n "$p" ] || continue
    case "$1" in "$p" | "$p"/*) return 0 ;; esac
  done <<EOF
$2
EOF
  return 1
}

# sp__rf_pick_conflict — set SP__RF_C_FILE and SP__RF_C_LINE to the first text file the default's last
# commit modifies outside the protected set, and an old-side line inside one of its hunks; status 1 if none,
# or when the protected set is unresolvable.
sp__rf_pick_conflict() {
  local f num hunk old start count prot
  SP__RF_C_FILE=""
  SP__RF_C_LINE=""
  SP__RF_WHY=""
  if ! prot="$(hr_run_protected_rel_paths "$SP_MAIN")"; then
    SP__RF_WHY="the protected set is unresolvable from $SP_MAIN/harness.config.json"
    return 1
  fi
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    sp__rf_protected "$f" "$prot" && continue
    num="$(git -C "$SP_MAIN" diff --numstat "$SP__RF_TIP~1" "$SP__RF_TIP" -- "$f" 2>/dev/null)" || continue
    case "$num" in -*) continue ;; esac
    # The first hunk that removes or replaces an old line: an edit to that line overlaps the default's.
    while IFS= read -r hunk; do
      case "$hunk" in "@@ -"*) ;; *) continue ;; esac
      old="${hunk#@@ -}"
      old="${old%% *}"
      start="${old%%,*}"
      count=1
      case "$old" in *,*) count="${old#*,}" ;; esac
      case "$start$count" in *[!0-9]*) continue ;; esac
      if [ "$count" -gt 0 ] && [ "$start" -gt 0 ]; then
        SP__RF_C_FILE="$f"
        SP__RF_C_LINE="$start"
        return 0
      fi
    done <<EOF
$(git -C "$SP_MAIN" diff -U0 --no-color "$SP__RF_TIP~1" "$SP__RF_TIP" -- "$f" 2>/dev/null)
EOF
  done <<EOF
$(git -C "$SP_MAIN" -c core.quotePath=false diff --name-only --diff-filter=M "$SP__RF_TIP~1" "$SP__RF_TIP" 2>/dev/null)
EOF
  return 1
}

# sp__rf_fixture <suffix> <a|b|c> — build fixture <kind> as ${SP_BRANCH}_<suffix> and cut its clone.
# Sets SP__RF_BRANCH, SP__RF_CLONE and SP__RF_PROFILE; status 1 with SP__RF_WHY.
sp__rf_fixture() {
  local fx="${SP_BRANCH}_$1" kind="$2" out err file tmp
  SP__RF_BRANCH="$fx"
  SP__RF_CLONE=""
  SP__RF_PROFILE=""
  SP__RF_WHY=""
  if sp__branch_taken "$fx"; then
    SP__RF_WHY="the fixture branch '$fx' already exists locally or on origin"
    return 1
  fi
  if ! sp_track_branch "$fx"; then
    SP__RF_WHY="sp_track_branch refused the fixture branch '$fx'"
    return 1
  fi

  # 1. The fixture's commits, in the scratch clone.
  if ! out="$(sp__rf_src checkout -q -b "$fx" "$SP__RF_TIP~1" 2>&1)"; then
    SP__RF_WHY="checkout of $fx at $SP__RF_TIP~1 in the fixture source failed: ${out%%$'\n'*}"
    return 1
  fi
  case "$kind" in
    b)
      file="sbx_refresh_r2.txt"
      if git -C "$SP_MAIN" cat-file -e "$SP__RF_TIP:$file" 2>/dev/null; then
        SP__RF_WHY="the default's tip already carries $file, so the fixture's commit would not be its own file"
        return 1
      fi
      if ! printf 'sandbox probe refresh fixture b\n' >"$SP__RF_SRC/$file" 2>/dev/null ||
        ! out="$(sp__rf_src add -- "$file" 2>&1)" ||
        ! out="$(sp__rf_src_commit "chore: Sandbox probe refresh fixture b" 2>&1)"; then
        SP__RF_WHY="the fixture b commit of $file failed: ${out%%$'\n'*}"
        return 1
      fi
      ;;
    c)
      file="$SP__RF_C_FILE"
      tmp="$SP_TMP/fxsrc-r3.edit"
      if ! awk -v n="$SP__RF_C_LINE" 'NR == n { print "sandbox probe refresh fixture c"; next } { print }' \
        "$SP__RF_SRC/$file" >"$tmp" 2>/dev/null || ! cat -- "$tmp" >"$SP__RF_SRC/$file" ||
        ! out="$(sp__rf_src add -- "$file" 2>&1)" ||
        ! out="$(sp__rf_src_commit "chore: Sandbox probe refresh fixture c" 2>&1)"; then
        rm -f -- "$tmp"
        SP__RF_WHY="the fixture c edit of $file line $SP__RF_C_LINE failed: ${out:-awk or write failed}"
        SP__RF_WHY="${SP__RF_WHY%%$'\n'*}"
        return 1
      fi
      rm -f -- "$tmp"
      ;;
  esac

  # 2. refs/heads/<fx> in <main>: a ref write, never <main>'s config or working tree.
  if ! out="$(git -C "$SP_MAIN" fetch -q --no-write-fetch-head "$SP__RF_SRC" "$fx:refs/heads/$fx" 2>&1)"; then
    SP__RF_WHY="git -C $SP_MAIN fetch of $fx from the fixture source failed: ${out%%$'\n'*}"
    return 1
  fi

  # 3. Its clone.
  err="$SP_TMP/rf-clone-$1.stderr"
  if ! sp_extra_clone "$fx" --existing 2>"$err"; then
    cat -- "$err" >&2
    SP__RF_WHY="$(sp__rf_last_line "$err")"
    [ -n "$SP__RF_WHY" ] || SP__RF_WHY="sp_extra_clone $fx --existing refused with no message"
    return 1
  fi
  cat -- "$err" >&2
  # Copied at once: the next sp_extra_clone overwrites SP_EXTRA_*.
  SP__RF_CLONE="$SP_EXTRA_CLONE"
  SP__RF_PROFILE="$SP_EXTRA_PROFILE"
  if ! sp__ctl_literal "fixture clone" "$SP__RF_CLONE"; then
    SP__RF_WHY="the fixture clone path '$SP__RF_CLONE' is not spellable as a literal"
    return 1
  fi
  return 0
}

# sp__rf_session <name> <settings> <prompt file> <cwd> — status 1, with SP__RF_WHY, when no stream was written.
sp__rf_session() {
  sp_session "$1" "$2" "$3" --cwd "$4"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    SP__RF_WHY="session $1 did not launch; see $SP_TMP/$1.stderr"
    sp_refuse "$SP__RF_WHY"
    return 1
  fi
  return 0
}

# sp__rf_porcelain <clone> — `git status --porcelain`; status 1 when git failed.
sp__rf_porcelain() {
  git -C "$1" status --porcelain 2>&1
}

# sp__rf_snapshot <clone> <branch> — R3's no-write state: every ref of the clone and <main>'s
# refs/heads/<branch>, the clone's index, the tracked files' contents and `git status --porcelain`.
sp__rf_snapshot() {
  local clone="$1" branch="$2" gitdir
  SP__RF_SNAP_REFS="$({
    git -C "$clone" symbolic-ref -q HEAD
    git -C "$clone" for-each-ref --format='%(objectname) %(refname)'
    git -C "$SP_MAIN" rev-parse --verify -q "refs/heads/$branch"
  } 2>/dev/null | shasum)"
  gitdir="$(git -C "$clone" rev-parse --absolute-git-dir 2>/dev/null)" || gitdir=""
  SP__RF_SNAP_INDEX="$(shasum <"$gitdir/index" 2>/dev/null)" || SP__RF_SNAP_INDEX="unreadable"
  SP__RF_SNAP_FILES="$(cd "$clone" 2>/dev/null && git ls-files -z | xargs -0 shasum 2>/dev/null | shasum)"
  SP__RF_SNAP_STATUS="$(sp__rf_porcelain "$clone" | shasum)"
}

# sp__rf_r0_r1 — fixture (a): one session, one call; R0 judges where it ran, R1 the fast-forward.
sp__rf_r0_r1() {
  local clone branch profile before after pfile call departure status text porcelain
  if ! sp__rf_fixture r1 a; then
    sp_result_line wrappers-refresh R0 "not run" "from R1's call: $SP__RF_WHY" ""
    sp_result_line wrappers-refresh R1 "not run" "$SP__RF_WHY" ""
    return 0
  fi
  clone="$SP__RF_CLONE"
  branch="$SP__RF_BRANCH"
  profile="$SP__RF_PROFILE"
  before="$(git -C "$clone" rev-parse --verify -q HEAD 2>/dev/null)" || before=""
  call="bash $SP_SCRIPTS/refresh-branch.sh $clone"
  pfile="$SP_TMP/wrappers-refresh-r1.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$call"
  if ! sp__rf_session wrappers-refresh-r1 "$profile" "$pfile" "$clone"; then
    sp_result_line wrappers-refresh R0 "not run" "from R1's call: $SP__RF_WHY" ""
    sp_result_line wrappers-refresh R1 "not run" "$SP__RF_WHY" ""
    return 0
  fi
  departure="$(sp_departures)"

  # R0: pass when the result carries no refusal layer.
  sp_judge_call "$SP_STREAM" ran "$call"
  status="${SP__STATUS:-}"
  text="${SP__TEXT:-}"
  case "$SP_VERDICT" in
    pass) sp_result_line wrappers-refresh R0 pass "from R1's call: ran outside the sandbox: $SP_EVIDENCE" "$departure" ;;
    fail) sp_result_line wrappers-refresh R0 fail "from R1's call: refused at $SP_LAYER: $SP_EVIDENCE" "$departure" ;;
    *) sp_result_line wrappers-refresh R0 "not run" "from R1's call: $SP_EVIDENCE" "$departure" ;;
  esac
  if [ "$SP_VERDICT" = "not run" ]; then
    sp_result_line wrappers-refresh R1 "not run" "$SP_EVIDENCE" "$departure"
    return 0
  fi

  # R1: the ref fast-forwarded to the default's tip and the working copy is clean.
  sp_judge_ref "$clone" HEAD "$before" moved
  if [ "$SP_VERDICT" != pass ]; then
    sp_result_line wrappers-refresh R1 fail "$SP_EVIDENCE; refresh said: $(sp__first_line "$text")" "$departure"
    return 0
  fi
  after="$(git -C "$clone" rev-parse --verify -q HEAD 2>/dev/null)" || after=""
  if [ "$after" != "$SP__RF_TIP" ]; then
    sp_result_line wrappers-refresh R1 fail \
      "$SP_EVIDENCE, not a fast-forward to origin/$SP_DEFAULT_BRANCH $SP__RF_TIP" "$departure"
    return 0
  fi
  if ! porcelain="$(sp__rf_porcelain "$clone")" || [ -n "$porcelain" ]; then
    sp_result_line wrappers-refresh R1 fail "$SP_EVIDENCE; git status --porcelain: ${porcelain%%$'\n'*}" "$departure"
    return 0
  fi
  if [ "$status" != ok ]; then
    sp_result_line wrappers-refresh R1 fail \
      "$SP_EVIDENCE and clean, but the call exited non-zero: $(sp__first_line "$text")" "$departure"
    return 0
  fi
  sp_result_line wrappers-refresh R1 pass \
    "exit 0, fast-forward of $branch: $SP_EVIDENCE; git status --porcelain empty" "$departure"
}

# sp__rf_r2 — fixture (b): a two-parent merge carrying `git merge`'s default message.
sp__rf_r2() {
  local clone branch profile before after pfile call departure parents subject want porcelain text
  if ! sp__rf_fixture r2 b; then
    sp_result_line wrappers-refresh R2 "not run" "$SP__RF_WHY" ""
    return 0
  fi
  clone="$SP__RF_CLONE"
  branch="$SP__RF_BRANCH"
  profile="$SP__RF_PROFILE"
  before="$(git -C "$clone" rev-parse --verify -q HEAD 2>/dev/null)" || before=""
  call="bash $SP_SCRIPTS/refresh-branch.sh $clone"
  pfile="$SP_TMP/wrappers-refresh-r2.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$call"
  if ! sp__rf_session wrappers-refresh-r2 "$profile" "$pfile" "$clone"; then
    sp_result_line wrappers-refresh R2 "not run" "$SP__RF_WHY" ""
    return 0
  fi
  departure="$(sp_departures)"
  sp_judge_call "$SP_STREAM" ran "$call"
  text="${SP__TEXT:-}"
  if [ "$SP_VERDICT" = "not run" ]; then
    sp_result_line wrappers-refresh R2 "not run" "$SP_EVIDENCE" "$departure"
    return 0
  fi
  sp_judge_ref "$clone" HEAD "$before" moved
  if [ "$SP_VERDICT" != pass ]; then
    sp_result_line wrappers-refresh R2 fail "$SP_EVIDENCE; refresh said: $(sp__first_line "$text")" "$departure"
    return 0
  fi
  after="$(git -C "$clone" rev-parse --verify -q HEAD 2>/dev/null)" || after=""
  parents="$(git -C "$clone" rev-list --parents -n 1 "$after" 2>/dev/null)" || parents=""
  parents="${parents#* }"
  if [ "$parents" != "$before $SP__RF_TIP" ]; then
    sp_result_line wrappers-refresh R2 fail \
      "$SP_EVIDENCE; parents '${parents:-none}', not '$before $SP__RF_TIP'" "$departure"
    return 0
  fi
  subject="$(git -C "$clone" log -1 --format=%s "$after" 2>/dev/null)" || subject=""
  want="Merge remote-tracking branch 'origin/$SP_DEFAULT_BRANCH' into $branch"
  if [ "$subject" != "$want" ]; then
    sp_result_line wrappers-refresh R2 fail "$SP_EVIDENCE; two parents, message '$subject', not '$want'" "$departure"
    return 0
  fi
  if ! porcelain="$(sp__rf_porcelain "$clone")" || [ -n "$porcelain" ]; then
    sp_result_line wrappers-refresh R2 fail "$SP_EVIDENCE; git status --porcelain: ${porcelain%%$'\n'*}" "$departure"
    return 0
  fi
  sp_result_line wrappers-refresh R2 pass \
    "$SP_EVIDENCE; $after parents=$parents '$subject'; git status --porcelain empty" "$departure"
}

# sp__rf_r3 — fixture (c): exit 4 with `conflicted:` paths, read together with the no-write comparison.
sp__rf_r3() {
  local clone branch profile pfile call departure status text line exitline changed=""
  local refs index files porcelain
  if ! sp__rf_pick_conflict; then
    # Bash 3.2 reads a quote inside a "${x:-…}" default as opening one, so the default is a variable.
    line="the default's last commit changes no file a fixture may edit"
    sp_result_line wrappers-refresh R3 "not run" "${SP__RF_WHY:-$line}" ""
    return 0
  fi
  if ! sp__rf_fixture r3 c; then
    sp_result_line wrappers-refresh R3 "not run" "$SP__RF_WHY" ""
    return 0
  fi
  clone="$SP__RF_CLONE"
  branch="$SP__RF_BRANCH"
  profile="$SP__RF_PROFILE"
  sp__rf_snapshot "$clone" "$branch"
  refs="$SP__RF_SNAP_REFS"
  index="$SP__RF_SNAP_INDEX"
  files="$SP__RF_SNAP_FILES"
  porcelain="$SP__RF_SNAP_STATUS"
  call="bash $SP_SCRIPTS/refresh-branch.sh $clone"
  pfile="$SP_TMP/wrappers-refresh-r3.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$call"
  if ! sp__rf_session wrappers-refresh-r3 "$profile" "$pfile" "$clone"; then
    sp_result_line wrappers-refresh R3 "not run" "$SP__RF_WHY" ""
    return 0
  fi
  departure="$(sp_departures)"
  sp_judge_call "$SP_STREAM" ran "$call"
  status="${SP__STATUS:-}"
  text="${SP__TEXT:-}"
  if [ "$SP_VERDICT" = "not run" ]; then
    sp_result_line wrappers-refresh R3 "not run" "$SP_EVIDENCE" "$departure"
    return 0
  fi
  if [ "$SP_VERDICT" != pass ]; then
    sp_result_line wrappers-refresh R3 fail "refused at $SP_LAYER: $SP_EVIDENCE" "$departure"
    return 0
  fi

  # The no-write check first: a written conflict fails whatever the exit status said.
  sp__rf_snapshot "$clone" "$branch"
  [ "$refs" = "$SP__RF_SNAP_REFS" ] || changed="$changed refs,"
  [ "$index" = "$SP__RF_SNAP_INDEX" ] || changed="$changed index,"
  [ "$files" = "$SP__RF_SNAP_FILES" ] || changed="$changed tracked files' shasum,"
  [ "$porcelain" = "$SP__RF_SNAP_STATUS" ] || changed="$changed git status --porcelain,"
  if [ -n "$changed" ]; then
    sp_result_line wrappers-refresh R3 fail \
      "written:${changed%,} changed; refresh said: $(sp__first_line "$text")" "$departure"
    return 0
  fi
  # Exit 4: a non-zero result carrying a `conflicted:` line that names the fixture's file.
  if [ "$status" != error ] || ! line="$(sp__line_with "$text" "conflicted:")"; then
    sp_result_line wrappers-refresh R3 fail \
      "nothing written, but no exit 4 with conflicted: paths: $(sp__first_line "$text")" "$departure"
    return 0
  fi
  case "$line" in
    *"$SP__RF_C_FILE"*) ;;
    *)
      sp_result_line wrappers-refresh R3 fail \
        "nothing written, but '$line' does not name $SP__RF_C_FILE" "$departure"
      return 0
      ;;
  esac
  exitline="$(sp__line_with "$text" "Exit code")" || exitline="non-zero exit"
  sp_result_line wrappers-refresh R3 pass \
    "$exitline; $line; refs, index, tracked files' shasum and git status --porcelain identical before and after" \
    "$departure"
}

# sp__rf_r4_local_grade <stream> <command> — R4's --local half: sets SP_VERDICT and SP_EVIDENCE from the
# stream alone.
sp__rf_r4_local_grade() {
  local stream="${1:-}" cmd="${2:-}" line
  sp_judge_call "$stream" ran "$cmd"
  [ "$SP_VERDICT" = "not run" ] && return 0
  case "$SP_LAYER" in
    permission | file-tool)
      SP_VERDICT="not run"
      SP_EVIDENCE="answered at the $SP_LAYER layer: $SP_LAYER_EVIDENCE"
      return 0
      ;;
    sandbox)
      SP_VERDICT=fail
      SP_EVIDENCE="the --local merge was refused sandboxed in the clone: $SP_EVIDENCE"
      return 0
      ;;
  esac
  if [ "$SP__STATUS" = ok ]; then
    SP_VERDICT=pass
    SP_EVIDENCE="--local exit 0: $(sp__first_line "$SP__TEXT")"
    return 0
  fi
  line="$(sp__line_with "$SP__TEXT" "Exit code")" || line=""
  case "$line" in
    *"Exit code 3")
      line="$(sp__line_with "$SP__TEXT" "refresh-branch.sh:")" || line="$(sp__first_line "$SP__TEXT")"
      SP_VERDICT=pass
      SP_EVIDENCE="--local exit 3, nothing to do: $line"
      return 0
      ;;
  esac
  SP_VERDICT="not run"
  SP_EVIDENCE="--local errored: $(sp__first_line "$SP__TEXT")"
}

# sp__rf_r4 — the probe clone's own copy, in the two sessions the header names; each ends with its own
# refresh control.
sp__rf_r4() {
  local scripts_rel before pfile call lcall departure ldeparture layer dirty out
  local fverdict fevidence fctl_ok fctl_evidence lverdict levidence lctl_ok lctl_evidence lnote="" verdict
  if ! scripts_rel="$(hr_scripts_dir "$SP_CLONE")" || ! sp__ctl_literal "clone scriptsDir" "$scripts_rel"; then
    sp_result_line wrappers-refresh R4 "not run" "scriptsDir unresolvable in the clone, or not spellable as a literal" ""
    return 0
  fi
  # The wrappers leg leaves uncommitted edits in the probe clone, and refresh-branch.sh refuses a dirty
  # tree before its fetch, which would read as R4's call having run.
  if ! dirty="$(git -C "$SP_CLONE" status --porcelain --untracked-files=no 2>&1)"; then
    sp_result_line wrappers-refresh R4 "not run" "git status in the clone failed: ${dirty%%$'\n'*}" ""
    return 0
  fi
  if [ -n "$dirty" ]; then
    if ! out="$(git -C "$SP_CLONE" -c core.hooksPath=/dev/null reset -q --hard HEAD 2>&1)"; then
      sp_result_line wrappers-refresh R4 "not run" "could not clean the clone's tracked edits: ${out%%$'\n'*}" ""
      return 0
    fi
  fi
  sp_ctl_clone
  sp_ctl_prepare refresh_own
  before="$(git -C "$SP_CLONE" rev-parse --verify -q "refs/heads/$SP_BRANCH" 2>/dev/null)" || before=""
  call="bash $SP_CLONE/$scripts_rel/refresh-branch.sh $SP_CLONE"
  pfile="$SP_TMP/wrappers-refresh-r4.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$call"
  sp_ctl_add "$pfile" refresh
  if ! sp__rf_session wrappers-refresh-r4 "$SP_RUN_PROFILE" "$pfile" "$SP_CLONE"; then
    sp_result_line wrappers-refresh R4 "not run" "$SP__RF_WHY" ""
    return 0
  fi
  departure="$(sp_departures)"
  sp_ctl_held "$SP_STREAM"
  sp_judge_call "$SP_STREAM" network "$call"
  if [ "$SP_VERDICT" = "not run" ]; then
    fverdict="not run"
    fevidence="$SP_EVIDENCE"
  else
    layer="$SP_LAYER: $SP_LAYER_EVIDENCE"
    case "$SP_LAYER" in
      network | sandbox)
        sp_judge_ref "$SP_CLONE" "refs/heads/$SP_BRANCH" "$before" unchanged
        if [ "$SP_VERDICT" = pass ]; then
          fverdict=pass
          fevidence="$SP_EVIDENCE; call answered by $layer"
        else
          fverdict=fail
          fevidence="the branch moved: $SP_EVIDENCE; call answered by $layer"
        fi
        ;;
      *)
        sp_judge_ref "$SP_CLONE" "refs/heads/$SP_BRANCH" "$before" unchanged
        fverdict=fail
        fevidence="the fetch was not refused sandboxed: answered by $layer; $SP_EVIDENCE"
        ;;
    esac
  fi
  fctl_ok="${SP_CTL_OK:-}"
  fctl_evidence="$SP_CTL_EVIDENCE"

  # The --local half, after the fetch half is judged, so its merge cannot move what that judged.
  lcall="bash $SP_CLONE/$scripts_rel/refresh-branch.sh --local $SP_CLONE"
  ldeparture=""
  lctl_ok=0
  lctl_evidence=""
  lverdict=""
  if ! git -C "$SP_CLONE" rev-parse --verify -q "refs/heads/$SP_DEFAULT_BRANCH" >/dev/null 2>&1; then
    if out="$(git -C "$SP_CLONE" -c core.hooksPath=/dev/null branch "$SP_DEFAULT_BRANCH" \
      "refs/remotes/origin/$SP_DEFAULT_BRANCH" 2>&1)"; then
      lnote="local $SP_DEFAULT_BRANCH created by the probe at origin/$SP_DEFAULT_BRANCH; "
    else
      lverdict="not run"
      levidence="could not create a local $SP_DEFAULT_BRANCH at origin/$SP_DEFAULT_BRANCH: ${out%%$'\n'*}"
      lctl_evidence="$levidence"
    fi
  fi
  if [ -z "$lverdict" ]; then
    sp_ctl_prepare refresh_own_local
    pfile="$SP_TMP/wrappers-refresh-r4-local.prompt"
    sp_prompt_new "$pfile"
    sp_prompt_bash "$pfile" "$lcall"
    sp_ctl_add "$pfile" refresh
    if sp__rf_session wrappers-refresh-r4-local "$SP_RUN_PROFILE" "$pfile" "$SP_CLONE"; then
      ldeparture="$(sp_departures)"
      sp_ctl_held "$SP_STREAM"
      lctl_ok="${SP_CTL_OK:-}"
      lctl_evidence="$SP_CTL_EVIDENCE"
      sp__rf_r4_local_grade "$SP_STREAM" "$lcall"
      lverdict="$SP_VERDICT"
      levidence="$lnote$SP_EVIDENCE"
    else
      lverdict="not run"
      levidence="$lnote$SP__RF_WHY"
      lctl_evidence="$SP__RF_WHY"
    fi
  fi

  if [ "$fverdict" = fail ] || [ "$lverdict" = fail ]; then
    verdict=fail
  elif [ "$fverdict" = "not run" ] || [ "$lverdict" = "not run" ]; then
    verdict="not run"
  else
    verdict=pass
  fi
  if [ "$fctl_ok" != 1 ]; then
    SP_CTL_OK=0
    SP_CTL_EVIDENCE="wrappers-refresh-r4: ${fctl_evidence:-no positive control in the session}"
  elif [ "$lctl_ok" != 1 ]; then
    SP_CTL_OK=0
    SP_CTL_EVIDENCE="wrappers-refresh-r4-local: ${lctl_evidence:-no positive control in the session}"
  else
    SP_CTL_OK=1
    SP_CTL_EVIDENCE=""
  fi
  if [ -n "$departure" ] && [ -n "$ldeparture" ]; then
    departure="$departure; $ldeparture"
  else
    departure="$departure$ldeparture"
  fi
  sp_row_result --direct wrappers-refresh R4 "$verdict" "fetch: $fevidence; --local: $levidence" "$departure"
}

sp_leg_wrappers_refresh() {
  local row
  if ! sp__ctl_literal "scripts directory" "$SP_SCRIPTS" || ! sp__ctl_literal "probe clone" "$SP_CLONE"; then
    for row in R0 R1 R2 R3 R4; do
      sp_result_line wrappers-refresh "$row" "not run" \
        "the scripts directory or the probe clone path is not spellable as a literal" ""
    done
    return 0
  fi
  if sp__rf_prepare_src; then
    sp__rf_r0_r1
    sp__rf_r2
    sp__rf_r3
  else
    sp_result_line wrappers-refresh R0 "not run" "from R1's call: $SP__RF_WHY" ""
    for row in R1 R2 R3; do
      sp_result_line wrappers-refresh "$row" "not run" "$SP__RF_WHY" ""
    done
  fi
  sp__rf_r4
}
