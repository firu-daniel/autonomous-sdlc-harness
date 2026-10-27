#!/usr/bin/env bash
# legs-local.sh — the sandbox probe's gates, mktemp, scratch and retrieval legs (rows T2, W7, TD2, SR1,
# SR2, MC1): each launches its sessions in the probe clone and prints one result line per row.
#
# T2 takes the Run gates phase's route (docs/sandbox-verification.md §7 OR6): one session issues
# `run-test-suite.sh sbx_probe_t2`, then `run-test-suite.sh --wait sbx_probe_t2`, repeated while it
# prints `pending`, up to SP_T2_MAX_WAITS times. T2 is graded from the lane's .verdict and .log, never
# from a call's output. A worker still running after the session is tracked for teardown and polled for
# up to SP_T2_COLLECT_SECONDS, so teardown never removes the clone under it, interrupted or not.
#
# W7's session carries `--debug-file`, a departure from the watcher's line; its path is exported as
# SP_W7_DEBUG once that session has launched, for the write-protection leg's W8.
#
# TD2 runs two sessions. `mktemp-tmpdir` issues `printenv TMPDIR` alone (departure
# `--allowedTools Bash(printenv TMPDIR)`), and `mktemp-td2` issues the four mktemp forms, the explicit
# one spelled with that TMPDIR as a literal path, so `Bash(mktemp:*)` matches every call. A call refused
# at the permission layer never reached the sandbox and is `not run`, never `fail`.
#
# THE GRADING FUNCTIONS read only their arguments and the stream, and call only core.sh, judge.sh,
# controls.sh and this file's functions:
#   sp__t2_grade <stream> <run command> <verdict file> <log file>   T2's verdict
#   sp__td2_tmpdir <stream> <command>    the printed TMPDIR, no trailing slash; status 1, printing nothing
#   sp__td2_grade <stream> <tmpdir>      TD2's verdict
#
# The scratch file is `.mjs`, not the `.sh` the task plan named: scripts/scratch-run.sh refuses a `.sh`
# file with exit 66, so a shell probe would measure that refusal rather than the sandbox.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

SP_T2_LABEL=sbx_probe_t2
SP_T2_MAX_WAITS=40
SP_T2_COLLECT_SECONDS=1800
SP_T2_POLL_SECONDS=5
SP_W7_DEBUG=""

# sp__local_session <name> <prompt file> [sp_session option]... — launch on SP_RUN_PROFILE; status 1,
# naming the session on stderr, when no stream file was written.
sp__local_session() {
  local name="$1" pfile="$2"
  shift 2
  sp_session "$name" "$SP_RUN_PROFILE" "$pfile" "$@"
  if [ -z "$SP_STREAM" ] || [ ! -f "$SP_STREAM" ]; then
    sp_refuse "session $name did not launch; see $SP_TMP/$name.stderr"
    return 1
  fi
  return 0
}

# sp__local_text — the matched call's result text from the last judge. SP__TEXT is judge.sh's
# sp__match_read output; read it before any later judge overwrites it.
sp__local_text() {
  printf '%s' "${SP__TEXT:-}"
}

# sp__t2_grade <stream> <run command> <verdict file> <log file> — sets SP_VERDICT and SP_EVIDENCE.
sp__t2_grade() {
  local stream="${1:-}" cmd="${2:-}" vfile="${3:-}" log="${4:-}" vline="" line n
  sp_judge_call "$stream" ran "$cmd"
  if [ "${SP__COUNT:-0}" -eq 0 ] || [ "$SP_LAYER" = permission ]; then
    SP_VERDICT="not run"
    SP_EVIDENCE="the run form did not reach the gates: $SP_EVIDENCE"
  elif [ ! -f "$vfile" ]; then
    SP_VERDICT="not run"
    if [ -f "$log" ]; then
      SP_EVIDENCE="no verdict for the gate run: $vfile is absent, and the log $log exists"
    else
      SP_EVIDENCE="no verdict for the gate run: $vfile is absent, and so is the log $log"
    fi
  else
    IFS= read -r vline <"$vfile" || true
    case "$vline" in
      pass)
        SP_VERDICT=pass
        SP_EVIDENCE="run-test-suite.sh verdict pass"
        ;;
      "fail "?*)
        SP_VERDICT=fail
        line=""
        if [ -f "$log" ]; then
          line="$(grep -m 1 -F -e 'mkstemp failed' -e 'Operation not permitted' -- "$log" 2>/dev/null)" ||
            line="$(grep -m 1 -E '^== run-test-suite\.sh: gate .* exited [1-9][0-9]* ==$' -- "$log" 2>/dev/null)" ||
            line=""
        fi
        [ -n "$line" ] || line="$vline (no mkstemp failed, Operation not permitted or non-zero gate exit line in the log)"
        SP_EVIDENCE="$line; compare with the same call unsandboxed on the same tree before filing its row"
        ;;
      *)
        SP_VERDICT="not run"
        SP_EVIDENCE="the verdict file holds no pass or fail line: '$vline'"
        ;;
    esac
  fi
  # The session's own outbound denials (api.anthropic.com, datadoghq.com): recorded, never graded.
  if [ -f "$log" ]; then
    n="$(grep -c -F -e '<sandbox_violations>' -e 'host is not on the allow list' -- "$log" 2>/dev/null)" || true
    case "$n" in '' | *[!0-9]*) n=0 ;; esac
    SP_EVIDENCE="$SP_EVIDENCE; network denials in the log, recorded and not graded: $n"
    if [ "$n" -gt 0 ]; then
      line="$(grep -m 1 -F -e '<sandbox_violations>' -e 'host is not on the allow list' -- "$log" 2>/dev/null)"
      SP_EVIDENCE="$SP_EVIDENCE, first: $line"
    fi
  else
    SP_EVIDENCE="$SP_EVIDENCE; network denials in the log, recorded and not graded: no log to count them in"
  fi
  # Claude Code annotates a sandboxed call's denials on that call's tool_result, so the session stream is
  # where they appear (docs/sandbox-verification.md row T2, the 2026-10-27 run); the lane log rarely holds one.
  n="$(grep -c -F -e '<sandbox_violations>' -e 'host is not on the allow list' -- "$stream" 2>/dev/null)" || true
  case "$n" in '' | *[!0-9]*) n=0 ;; esac
  SP_EVIDENCE="$SP_EVIDENCE; network denials in the session stream, recorded and not graded: $n event(s)"
}

# sp__td2_tmpdir <stream> <command> — print the TMPDIR the call printed, without a trailing slash;
# status 1, printing nothing, when it cannot be one literal path.
sp__td2_tmpdir() {
  local line
  sp_judge_call "${1:-}" ran "${2:-}"
  [ "$SP_VERDICT" = pass ] || return 1
  line="$(sp__first_line "$(sp__local_text)")"
  while [ "$line" != / ] && [ "${line%/}" != "$line" ]; do
    line="${line%/}"
  done
  case "$line" in /*) ;; *) return 1 ;; esac
  sp__ctl_literal "the session's TMPDIR" "$line" || return 1
  # sp__ctl_literal admits a brace, which no TD2 call may carry.
  case "$line" in *[{}]*) return 1 ;; esac
  printf '%s\n' "$line"
}

# sp__td2_grade <stream> <tmpdir> — sets SP_VERDICT and SP_EVIDENCE from TD2's four forms.
sp__td2_grade() {
  local stream="${1:-}" tmpdir="${2:-}" form cmd first clause summary="" perm=0 bad=0 absent=0
  for form in bare -d -t explicit; do
    case "$form" in
      bare) cmd="mktemp" ;;
      -d) cmd="mktemp -d" ;;
      -t) cmd="mktemp -t harness-gates" ;;
      explicit) cmd="mktemp $tmpdir/harness-gates.XXXXXX" ;;
    esac
    sp_judge_call "$stream" ran "$cmd"
    if [ "${SP__COUNT:-0}" -eq 0 ] || [ -z "$SP_LAYER" ]; then
      absent=1
      clause="$form: not run $SP_EVIDENCE"
    else
      first="$(sp__first_line "$(sp__local_text)")"
      if [ "$SP_LAYER" = permission ]; then
        perm=1
        clause="$form: refused at the permission layer, so it never reached the sandbox: $SP_LAYER_EVIDENCE"
      else
        clause="$form: $SP_LAYER $first"
        if [ "$form" = explicit ]; then
          if [ "$SP_LAYER" != ran ]; then
            bad=1
          else
            case "$first" in "$tmpdir/harness-gates."?*) ;; *) bad=1 ;; esac
          fi
        else
          case "$(sp__local_text)" in
            *"mkstemp failed"* | *"mkdtemp failed"*) ;;
            *) bad=1 ;;
          esac
        fi
      fi
    fi
    [ -z "$summary" ] || summary="$summary; "
    summary="$summary$clause"
  done
  if [ "$perm" -eq 1 ]; then
    SP_VERDICT="not run"
  elif [ "$bad" -eq 1 ]; then
    SP_VERDICT=fail
  elif [ "$absent" -eq 1 ]; then
    SP_VERDICT="not run"
  else
    SP_VERDICT=pass
  fi
  SP_EVIDENCE="$summary"
}

sp_leg_gates() {
  local scripts_rel state_rel lane pfile cmd wait_cmd verdict evidence departure waited pid note
  SP_W7_DEBUG=""
  if ! scripts_rel="$(hr_scripts_dir "$SP_CLONE")"; then
    sp_result_line gates T2 "not run" "scriptsDir unresolvable in the clone" ""
    sp_result_line gates W7 "not run" "scriptsDir unresolvable in the clone" ""
    return 0
  fi

  # --- T2: the gates through run-test-suite.sh, cwd = the clone.
  if ! state_rel="$(hr_state_dir "$SP_CLONE")"; then
    sp_result_line gates T2 "not run" "stateDir unresolvable in the clone" ""
  else
    lane="$SP_CLONE/$state_rel/test_run_logs/$(hr_sanitize_branch "$SP_BRANCH")/$SP_T2_LABEL"
    cmd="bash $scripts_rel/run-test-suite.sh $SP_T2_LABEL"
    wait_cmd="bash $scripts_rel/run-test-suite.sh --wait $SP_T2_LABEL"
    pfile="$SP_TMP/gates-t2.prompt"
    sp_prompt_new "$pfile"
    printf '%s\n\n' "One exception to \"do not retry\": each time the --wait call below prints pending, issue it again, exactly as written, until it prints anything else, at most $SP_T2_MAX_WAITS times in all." >>"$pfile"
    sp_prompt_bash "$pfile" "$cmd"
    sp_prompt_bash "$pfile" "$wait_cmd"
    sp__local_session gates-t2 "$pfile"
    departure="$(sp_departures)"
    note=""
    if [ ! -f "$lane.verdict" ] && [ -f "$lane.running" ]; then
      # Tracked before the wait, so the EXIT/INT/TERM teardown stops a live worker before it removes the
      # clone under it on every exit path, not only when the wait runs out.
      pid=""
      IFS= read -r pid <"$lane.running" || true
      case "$pid" in '' | *[!0-9]*) pid="" ;; *) sp_track_pid "$pid" ;; esac
      waited=0
      while [ ! -f "$lane.verdict" ] && [ -f "$lane.running" ] && [ "$waited" -lt "$SP_T2_COLLECT_SECONDS" ]; do
        sleep "$SP_T2_POLL_SECONDS"
        waited=$((waited + SP_T2_POLL_SECONDS))
      done
      if [ -f "$lane.verdict" ]; then
        note="the verdict was collected by the probe after the session, ${waited}s later"
        [ -z "$pid" ] || sp_untrack_pid "$pid"
      elif [ -f "$lane.running" ]; then
        note="no verdict ${waited}s after the session and the gate worker still holds .running"
      else
        note="the gate worker removed .running ${waited}s after the session without a verdict"
        [ -z "$pid" ] || sp_untrack_pid "$pid"
      fi
    fi
    if [ -f "$lane.log" ] && cp -- "$lane.log" "$SP_TMP/gates-t2.lane.log" 2>/dev/null; then
      sp_keep_file "$SP_TMP/gates-t2.lane.log"
    fi
    sp__t2_grade "$SP_STREAM" "$cmd" "$lane.verdict" "$lane.log"
    verdict="$SP_VERDICT"
    evidence="$SP_EVIDENCE"
    [ -z "$note" ] || evidence="$evidence; $note"
    sp_result_line gates T2 "$verdict" "$evidence" "$departure"
  fi

  # --- W7: six wrapper calls by absolute path, no --allowedTools. Only the `'<probe>'` call withdraws
  # the script-allowlist guard's permit, so only it reaches the per-run twin.
  local arg script n_fail=0 n_notrun=0 probe_denied=0 other_denied=0 summary="" label
  pfile="$SP_TMP/gates-w7.prompt"
  sp_prompt_new "$pfile"
  for script in typecheck.sh test.sh; do
    sp_prompt_bash "$pfile" "bash $SP_CLONE/$scripts_rel/$script"
    sp_prompt_bash "$pfile" "bash $SP_CLONE/$scripts_rel/$script sbx_probe"
    sp_prompt_bash "$pfile" "bash $SP_CLONE/$scripts_rel/$script '<probe>'"
  done
  if sp__local_session gates-w7 "$pfile" --debug-file "$SP_TMP/gates-w7.debug.log"; then
    SP_W7_DEBUG="$SP_TMP/gates-w7.debug.log"
  fi
  departure="$(sp_departures)"
  departure="${departure:+$departure; }--debug-file $SP_TMP/gates-w7.debug.log"
  for script in typecheck.sh test.sh; do
    for arg in "" sbx_probe "'<probe>'"; do
      cmd="bash $SP_CLONE/$scripts_rel/$script"
      [ -z "$arg" ] || cmd="$cmd $arg"
      sp_judge_call "$SP_STREAM" ran "$cmd"
      case "$arg" in
        "") label="$script none" ;;
        sbx_probe) label="$script plain" ;;
        *) label="$script <probe>" ;;
      esac
      case "$SP_VERDICT" in
        pass) label="$label ran" ;;
        fail)
          # W7 grades permission denials only; any other layer is the gate's own output once granted.
          if [ "$SP_LAYER" = permission ]; then
            n_fail=$((n_fail + 1))
            label="$label permission"
            if [ "$arg" = "'<probe>'" ]; then probe_denied=1; else other_denied=1; fi
          else
            label="$label ran ($SP_LAYER in its output)"
          fi
          ;;
        *)
          n_notrun=$((n_notrun + 1))
          label="$label not run ($SP_EVIDENCE)"
          ;;
      esac
      [ -z "$summary" ] || summary="$summary; "
      summary="$summary$label"
    done
  done
  if [ "$n_fail" -gt 0 ]; then
    verdict=fail
  elif [ "$n_notrun" -gt 0 ]; then
    verdict="not run"
  else
    verdict=pass
  fi
  evidence="$summary — the no-argument and plain calls are guard-granted; only the <probe> calls test the per-run twin"
  if [ "$probe_denied" -eq 1 ] && [ "$other_denied" -eq 0 ]; then
    evidence="$evidence; denied on <probe> alone: the twin does not match"
  fi
  sp_result_line gates W7 "$verdict" "$evidence" "$departure"
}

sp_leg_mktemp() {
  local pfile departure tdep cmd tmpdir line verdict evidence
  # --- Session mktemp-tmpdir: the session's TMPDIR, read so TD2's explicit form can carry it as a literal.
  cmd="printenv TMPDIR"
  pfile="$SP_TMP/mktemp-tmpdir.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$cmd"
  sp__local_session mktemp-tmpdir "$pfile" --allowed "Bash(printenv TMPDIR)"
  tdep="$(sp_departures)"
  if ! tmpdir="$(sp__td2_tmpdir "$SP_STREAM" "$cmd")"; then
    sp_judge_call "$SP_STREAM" ran "$cmd"
    line="$SP_EVIDENCE"
    [ -z "$SP_LAYER" ] || line="$SP_LAYER $line"
    sp_result_line mktemp TD2 "not run" \
      "the session's TMPDIR could not be read as a literal path: $cmd: $line" "$tdep"
    return 0
  fi

  # --- Session mktemp-td2: the four forms, each a literal Bash(mktemp:*) matches.
  pfile="$SP_TMP/mktemp-td2.prompt"
  sp_prompt_new "$pfile"
  for cmd in "mktemp" "mktemp -d" "mktemp -t harness-gates" "mktemp $tmpdir/harness-gates.XXXXXX"; do
    sp_prompt_bash "$pfile" "$cmd"
  done
  sp__local_session mktemp-td2 "$pfile" --allowed "Bash(mktemp:*)"
  departure="$(sp_departures)"
  departure="${tdep:+$tdep; }$departure"

  sp__td2_grade "$SP_STREAM" "$tmpdir"
  verdict="$SP_VERDICT"
  evidence="$SP_EVIDENCE"

  # A form that ran created something outside the probe's temp area: register a file, remove an
  # empty directory.
  for cmd in "mktemp" "mktemp -d" "mktemp -t harness-gates" "mktemp $tmpdir/harness-gates.XXXXXX"; do
    sp_judge_call "$SP_STREAM" ran "$cmd"
    [ "$SP_VERDICT" = pass ] || continue
    line="$(sp__first_line "$(sp__local_text)")"
    case "$line" in
      /*)
        if [ -f "$line" ] && [ ! -L "$line" ]; then
          sp_track "$line"
        elif [ -d "$line" ] && [ ! -L "$line" ]; then
          rmdir -- "$line" 2>/dev/null || sp_refuse "mktemp leg: '$line' is left; remove it by hand"
        fi
        ;;
    esac
  done
  sp_result_line mktemp TD2 "$verdict" "$evidence" "$departure"
}

sp_leg_scratch() {
  local state_rel scripts_rel scratch_rel scratch_abs in_marker out_marker pfile cmd departure
  local in_js text line sr1_verdict sr1_evidence
  out_marker="$HOME/sbx_probe_scratch_marker"
  in_marker="$SP_CLONE/sbx_sr1_marker"
  if ! state_rel="$(hr_state_dir "$SP_CLONE")"; then
    sp_result_line scratch SR1 "not run" "stateDir unresolvable in the clone" ""
    sp_result_line scratch SR2 "not run" "stateDir unresolvable in the clone" ""
    return 0
  fi
  if ! scripts_rel="$(hr_scripts_dir "$SP_CLONE")"; then
    sp_result_line scratch SR1 "not run" "scriptsDir unresolvable in the clone" ""
    sp_result_line scratch SR2 "not run" "scriptsDir unresolvable in the clone" ""
    return 0
  fi
  # A marker already there would read as a write that landed, and teardown would delete a file the
  # probe did not create.
  if [ -e "$out_marker" ] || [ -L "$out_marker" ]; then
    sp_result_line scratch SR1 "not run" "$out_marker exists before the session; remove it and re-run" ""
    sp_result_line scratch SR2 "not run" "$out_marker exists before the session; remove it and re-run" ""
    return 0
  fi
  scratch_rel="$state_rel/scratch/sbx_probe.mjs"
  scratch_abs="$SP_CLONE/$scratch_rel"
  in_js="$(jq -n --arg p "$in_marker" '$p')"
  if ! mkdir -p -- "$SP_CLONE/$state_rel/scratch" 2>/dev/null || [ -z "$in_js" ] ||
    ! cat >"$scratch_abs" <<EOF; then
import { writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
console.log('sbx_sr1_ran');
writeFileSync($in_js, '');
const outside = (process.env.HOME || homedir()) + '/sbx_probe_scratch_marker';
try {
  writeFileSync(outside, '');
  console.log('sbx_sr2_written ' + outside);
} catch (e) {
  console.log('sbx_sr2_refused ' + e.message);
}
EOF
    sp_result_line scratch SR1 "not run" "could not write the scratch file $scratch_abs" ""
    sp_result_line scratch SR2 "not run" "could not write the scratch file $scratch_abs" ""
    return 0
  fi
  sp_track "$scratch_abs"
  sp_track "$out_marker"

  # One call: SR1's measurement and SR2's positive control.
  cmd="bash $scripts_rel/scratch-run.sh $scratch_rel"
  sp_ctl_prepare scratch
  pfile="$SP_TMP/scratch.prompt"
  sp_prompt_new "$pfile"
  sp_ctl_add "$pfile" written "$cmd" "$in_marker"
  sp__local_session scratch "$pfile"
  departure="$(sp_departures)"

  sp_judge_call "$SP_STREAM" ran "$cmd"
  sr1_verdict="$SP_VERDICT"
  sr1_evidence="$SP_EVIDENCE"
  text=""
  [ "$SP__COUNT" -gt 0 ] && [ "$SP__STATUS" != none ] && text="$(sp__local_text)"
  if [ "$sr1_verdict" = pass ]; then
    if line="$(sp__line_with "$text" sbx_sr1_ran)"; then
      sr1_evidence="$line"
    else
      sr1_verdict=fail
      sr1_evidence="no sbx_sr1_ran line: $(sp__first_line "$text")"
    fi
  fi
  sp_result_line scratch SR1 "$sr1_verdict" "$sr1_evidence" "$departure"

  sp_ctl_held "$SP_STREAM"
  if [ -e "$out_marker" ]; then
    sp_row_result --direct scratch SR2 fail "$out_marker exists: the outside write from the scratch file landed" "$departure"
  elif line="$(sp__line_with "$text" sbx_sr2_written)"; then
    sp_row_result --direct scratch SR2 fail "the outside write landed: $line" "$departure"
  elif line="$(sp__line_with "$text" sbx_sr2_refused)"; then
    sp_row_result --direct scratch SR2 pass "$out_marker absent; $line" "$departure"
  else
    sp_row_result --direct scratch SR2 "not run" \
      "no sbx_sr2_refused or sbx_sr2_written line, so the outside write was never attempted: $(sp__first_line "$text")" "$departure"
  fi
}

sp_leg_retrieval() {
  local f wired="" pfile
  for f in "$SP_CLONE/.mcp.json" "$SP_MAIN/.mcp.json"; do
    if [ -f "$f" ] && jq -e '.mcpServers["harness-docs"] | type == "object"' "$f" >/dev/null 2>&1; then
      wired="$f"
      break
    fi
  done
  if [ -z "$wired" ]; then
    sp_result_line retrieval MC1 "not run" \
      "no harness-docs server in .mcp.json (docs retrieval is not wired in this repository)" ""
    return 0
  fi
  pfile="$SP_TMP/retrieval.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_tool "$pfile" "mcp__harness-docs__search_docs, with query set to exactly: sandbox, and k set to exactly 1."
  sp__local_session retrieval "$pfile"
  sp_judge_mcp "$SP_STREAM" mcp__harness-docs__search_docs
  sp_result_line retrieval MC1 "$SP_VERDICT" "$SP_EVIDENCE (server from $wired)" "$(sp_departures)"
}
