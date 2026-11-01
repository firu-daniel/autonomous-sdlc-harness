#!/usr/bin/env bash
# legs-job.sh — the sandbox probe's job-layout leg (row CS6, docs/sandbox-verification.md §2), job mode
# only. Expected: in a session whose cwd is the checkout, on its base profile, `git status` exits 0;
# `git add sbx_cs6.txt` is refused under <checkout>/.git (`Operation not permitted` on macOS,
# `Read-only file system` or another PD23 shape on Linux) with the index unchanged; and
# `bash <checkout>/<scriptsDir>/commit-on-branch.sh --repo <checkout> sbx_cs6.txt -- "sbx probe CS6"`
# lands, refs/heads/<branch> moving to a commit whose only change is sbx_cs6.txt (docs/cli.md §6's job
# settlement). Outside job mode the row is `not run`: only job mode makes the checkout both main
# checkout and run copy, and job mode measures no clone. Every reading is taken before the placeholder sweep.
#
# Two sessions, because the wrapper syncs <checkout>/.git/index after its commit
# (cli/templates/scripts/commit-on-branch.sh → wt_git): an index reading taken across the wrapper call
# would change when CS6 behaves as expected. Session job-layout-add issues `git status` and `git add`;
# session job-layout-commit issues the wrapper call. Each ends on its own `written` dd control.
#
# THE GRADING FUNCTION reads only its arguments and the stream (and SP_BRANCH, SP_PLATFORM through the
# judge, for evidence text), and sets SP_VERDICT and SP_EVIDENCE — never from an exit status:
#   sp__cs6_grade <stream> <status cmd> <add cmd> <wrapper cmd> <index sum unchanged: 1|0>
#                 <staged set after> <ref before> <ref after> <change set>
#     <stream>                 both sessions' streams concatenated, job-layout-add's first
#     <index sum unchanged>,   bracket job-layout-add only: the index shasum taken before it and after
#     <staged set after>       it, and `diff --cached --name-only` after it, all before job-layout-commit
#                              launches, so the wrapper's index sync never reaches them
#     <ref before>, <ref after>, <change set>
#                              bracket job-layout-commit: the probe branch's rev-parse before and after
#                              it, and `diff-tree --no-commit-id --name-only -r <after>`
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_CS6_FILE="sbx_cs6.txt"

# sp__cs6_join <newline-separated list> — the entries, `, `-joined, or `(empty)`.
sp__cs6_join() {
  local line out=""
  while IFS= read -r line; do
    [ -n "$line" ] && out="${out:+$out, }$line"
  done <<<"${1:-}"
  printf '%s' "${out:-(empty)}"
}

sp__cs6_grade() {
  local stream="${1:-}" c_status="${2:-}" c_add="${3:-}" c_wrap="${4:-}" unchanged="${5:-}"
  local staged="${6:-}" before="${7:-}" after="${8:-}" changes="${9:-}"
  local st_status st_layer st_line add_status add_layer add_line wrap_line notrun="" cmd line
  local branch="refs/heads/${SP_BRANCH:-<branch>}"

  # Each call's reading, kept: the next sp_judge_call overwrites the judge's globals.
  for cmd in "$c_status" "$c_add" "$c_wrap"; do
    if [ "$cmd" = "$c_add" ]; then
      sp_judge_call "$stream" sandbox "$cmd"
    else
      sp_judge_call "$stream" ran "$cmd"
    fi
    case "$SP_LAYER" in
      "") notrun="${notrun:+$notrun; }$cmd: $SP_EVIDENCE" ;;
      permission) notrun="${notrun:+$notrun; }$cmd: refused at the permission layer, so it never reached the sandbox: $SP_EVIDENCE" ;;
    esac
    line="$SP_LAYER_EVIDENCE"
    case "$cmd" in
      "$c_status") st_status="$SP__STATUS" st_layer="$SP_LAYER" st_line="$line" ;;
      "$c_add") add_status="$SP__STATUS" add_layer="$SP_LAYER" add_line="$line" ;;
      "$c_wrap") wrap_line="$(sp__message_line "${SP__TEXT:-}")" ;;
    esac
  done

  if [ -n "$notrun" ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="$notrun"
    return 0
  fi
  if [ "$unchanged" != 1 ] || sp__line_with "$staged" "$SP_CS6_FILE" >/dev/null; then
    SP_VERDICT=fail
    SP_EVIDENCE="git add reached the checkout's index (index shasum unchanged: ${unchanged:-unread}; staged: $(sp__cs6_join "$staged")): $add_line"
    return 0
  fi
  if [ -z "$after" ] || [ "$after" = "$before" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="the wrapper did not land: rev-parse $branch ${before:-none}..${after:-none}: $wrap_line"
    return 0
  fi
  if [ "$changes" != "$SP_CS6_FILE" ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="the wrapper's commit changes $(sp__cs6_join "$changes"), not exactly $SP_CS6_FILE: rev-parse $branch $before..$after"
    return 0
  fi
  if [ "$st_status" != ok ] || [ "$st_layer" != ran ]; then
    SP_VERDICT=fail
    SP_EVIDENCE="git status errored: $st_line"
    return 0
  fi
  if [ "$add_status" = ok ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the call reported success and nothing reached the index: $add_line"
    return 0
  fi
  if [ "$add_layer" != sandbox ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="git add errored with no refusal string the judge knows: $add_line"
    return 0
  fi
  SP_VERDICT=pass
  SP_EVIDENCE="git status: $st_line; git add refused at layer $add_layer, index unchanged, nothing staged: $add_line; rev-parse $branch $before..$after; change set: $changes"
}

# sp__cs6_session <name> <prompt file> <rule>... — one CS6 session in the checkout on SP_RUN_PROFILE;
# status 1 when no stream was written.
sp__cs6_session() {
  local name="$1" pfile="$2" rule allowed
  allowed=()
  shift 2
  for rule in "$@" "$SP_DD_RULE"; do
    allowed[${#allowed[@]}]=--allowed
    allowed[${#allowed[@]}]="$rule"
  done
  sp_session "$name" "$SP_RUN_PROFILE" "$pfile" --cwd "$SP_CLONE" "${allowed[@]}"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session $name did not launch; see $SP_TMP/$name.stderr"
    return 1
  fi
  return 0
}

# sp__cs6_rm <path> — remove a control file the probe created, as soon as its session is judged.
sp__cs6_rm() {
  [ -f "$1" ] && [ ! -L "$1" ] && rm -f -- "$1"
  return 0
}

sp_leg_job_layout() {
  local file ctl_add ctl_commit c_status="git status" c_add c_wrap pfile departure dep2
  local stream1 stream2 stream sum_before sum_after unchanged staged before after changes=""
  local ok1 ev1 f
  if [ "$SP_JOB_MODE" != 1 ]; then
    sp_leg_mode_skip job-layout "job mode only: run it with --job <checkout>"
    return 0
  fi
  if ! sp__ctl_literal checkout "$SP_CLONE" || ! sp__ctl_literal "scripts directory" "$SP_SCRIPTS"; then
    sp_result_line job-layout CS6 "not run" "the checkout or its scripts directory is not spellable as one literal word" ""
    return 0
  fi
  file="$SP_CLONE/$SP_CS6_FILE"
  ctl_add="$SP_CLONE/sbx_cs6_ctl_add"
  ctl_commit="$SP_CLONE/sbx_cs6_ctl_commit"
  for f in "$file" "$ctl_add" "$ctl_commit"; do
    if [ -e "$f" ] || [ -L "$f" ]; then
      sp_result_line job-layout CS6 "not run" \
        "'$f' exists before the session; the probe removes only what it created, so remove it and re-run" ""
      return 0
    fi
  done
  sp_track "$file"
  sp_track "$ctl_add"
  sp_track "$ctl_commit"
  if ! printf 'sandbox probe CS6\n' >"$file" 2>/dev/null; then
    sp_result_line job-layout CS6 "not run" "could not write $file" ""
    return 0
  fi
  c_add="git add $SP_CS6_FILE"
  c_wrap="bash $SP_SCRIPTS/commit-on-branch.sh --repo $SP_CLONE $SP_CS6_FILE -- \"sbx probe CS6\""

  # --- Session 1, bracketed by the index readings.
  sum_before="$(sp__wp_sum "$SP_CLONE/.git/index")"
  sp_ctl_prepare cs6add
  pfile="$SP_TMP/job-layout-add.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$c_status"
  sp_prompt_bash "$pfile" "$c_add"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl_add")" "$ctl_add"
  if ! sp__cs6_session job-layout-add "$pfile" "Bash($c_status)" "Bash($c_add)"; then
    sp_result_line job-layout CS6 "not run" "session job-layout-add did not launch; see $SP_TMP/job-layout-add.stderr" \
      "$(sp_departures)"
    return 0
  fi
  departure="$(sp_departures)"
  stream1="$SP_STREAM"
  sum_after="$(sp__wp_sum "$SP_CLONE/.git/index")"
  if [ "$sum_after" = "$sum_before" ]; then unchanged=1; else unchanged=0; fi
  staged="$(git -C "$SP_CLONE" diff --cached --name-only 2>/dev/null)" || staged=""
  before="$(git -C "$SP_CLONE" rev-parse --verify -q "refs/heads/$SP_BRANCH" 2>/dev/null)" || before=""
  sp_ctl_held "$stream1"
  ok1="$SP_CTL_OK"
  ev1="$SP_CTL_EVIDENCE"
  sp__cs6_rm "$ctl_add"

  # --- Session 2: the wrapper. No index reading is taken after it.
  sp_ctl_prepare cs6commit
  pfile="$SP_TMP/job-layout-commit.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$c_wrap"
  sp_ctl_add "$pfile" written "$(sp_dd_cmd "$ctl_commit")" "$ctl_commit"
  if ! sp__cs6_session job-layout-commit "$pfile" "Bash($c_wrap)"; then
    sp_result_line job-layout CS6 "not run" \
      "session job-layout-commit did not launch; see $SP_TMP/job-layout-commit.stderr" "$departure"
    return 0
  fi
  dep2="$(sp_departures)"
  [ -z "$dep2" ] || departure="${departure:+$departure; }$dep2"
  stream2="$SP_STREAM"
  after="$(git -C "$SP_CLONE" rev-parse --verify -q "refs/heads/$SP_BRANCH" 2>/dev/null)" || after=""
  if [ -n "$after" ] && [ "$after" != "$before" ]; then
    changes="$(git -C "$SP_CLONE" diff-tree --no-commit-id --name-only -r "$after" 2>/dev/null)" || changes=""
  fi
  sp_ctl_held "$stream2"
  # A failed control in either session withholds a refusal-shaped verdict.
  if [ "$ok1" != 1 ]; then
    SP_CTL_OK="$ok1"
    SP_CTL_EVIDENCE="$ev1"
  fi
  sp__cs6_rm "$ctl_commit"

  stream="$SP_TMP/job-layout.stream.jsonl"
  cat -- "$stream1" "$stream2" >"$stream" 2>/dev/null
  sp__cs6_grade "$stream" "$c_status" "$c_add" "$c_wrap" "$unchanged" "$staged" "$before" "$after" "$changes"
  SP_EVIDENCE="$SP_EVIDENCE$(sp_job_git_note)"
  sp_row_result --direct job-layout CS6 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"
  return 0
}
