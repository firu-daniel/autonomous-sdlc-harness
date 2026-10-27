#!/usr/bin/env bash
# legs-local.sh — the sandbox probe's gates, mktemp, scratch and retrieval legs (rows T2, W7, TD2, SR1,
# SR2, MC1): each launches its sessions in the probe clone and prints one result line per row.
#
# The scratch file is `.mjs`, not the `.sh` the task plan named: scripts/scratch-run.sh refuses a `.sh`
# file with exit 66, so a shell probe would measure that refusal rather than the sandbox.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.

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

sp_leg_gates() {
  local scripts_rel pfile cmd text line verdict evidence departure
  if ! scripts_rel="$(hr_scripts_dir "$SP_CLONE")"; then
    sp_result_line gates T2 "not run" "scriptsDir unresolvable in the clone" ""
    sp_result_line gates W7 "not run" "scriptsDir unresolvable in the clone" ""
    return 0
  fi

  # --- T2: the gates as one exact call, cwd = the clone.
  cmd="bash $scripts_rel/test.sh"
  pfile="$SP_TMP/gates-t2.prompt"
  sp_prompt_new "$pfile"
  sp_prompt_bash "$pfile" "$cmd"
  sp__local_session gates-t2 "$pfile"
  departure="$(sp_departures)"
  sp_judge_call "$SP_STREAM" ran "$cmd"
  verdict="$SP_VERDICT"
  evidence="$SP_EVIDENCE"
  if [ "$SP__COUNT" -gt 0 ] && [ "$SP__STATUS" != none ]; then
    text="$(sp__local_text)"
    if line="$(sp__line_with "$text" "mkstemp failed" "Operation not permitted")"; then
      verdict=fail
      evidence="$line"
    elif [ "$verdict" = pass ]; then
      # test.sh prints exactly one verdict line; a sandboxed FAIL is what T2's second sentence files.
      if line="$(sp__line_with "$text" "FAIL: test")"; then
        verdict=fail
        evidence="$line; compare with the same call unsandboxed on the same tree before filing its row"
      elif line="$(sp__line_with "$text" "PASS: test")"; then
        evidence="$line"
      else
        verdict="not run"
        evidence="no PASS: test or FAIL: test verdict line in the result (the output may be truncated): $(sp__first_line "$text")"
      fi
    fi
  fi
  sp_result_line gates T2"$verdict" "$evidence" "$departure"

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
  sp__local_session gates-w7 "$pfile"
  departure="$(sp_departures)"
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
  local pfile departure cmd form line ok=1 notrun=0 summary="" text
  # The explicit form is single-quoted here so the session, not this script, expands TMPDIR.
  local c_bare='mktemp' c_dir='mktemp -d' c_t='mktemp -t harness-gates'
  local c_explicit='mktemp "${TMPDIR:-/tmp}/harness-gates.XXXXXX"'
  pfile="$SP_TMP/mktemp-td2.prompt"
  sp_prompt_new "$pfile"
  for cmd in "$c_bare" "$c_dir" "$c_t" "$c_explicit"; do
    sp_prompt_bash "$pfile" "$cmd"
  done
  sp__local_session mktemp-td2 "$pfile" --allowed "Bash(mktemp:*)"
  departure="$(sp_departures)"

  for form in bare -d -t explicit; do
    case "$form" in
      bare) cmd="$c_bare" ;;
      -d) cmd="$c_dir" ;;
      -t) cmd="$c_t" ;;
      explicit) cmd="$c_explicit" ;;
    esac
    if [ "$form" = explicit ]; then
      sp_judge_call "$SP_STREAM" ran "$cmd"
    else
      sp_judge_call "$SP_STREAM" sandbox "$cmd"
    fi
    line=""
    if [ "$SP__COUNT" -gt 0 ] && [ "$SP__STATUS" != none ]; then
      text="$(sp__local_text)"
      line="$(sp__first_line "$text")"
    fi
    # A form that ran created something outside the probe's temp area: register a file, remove an
    # empty directory.
    case "$line" in
      /*)
        if [ -f "$line" ] && [ ! -L "$line" ]; then
          sp_track "$line"
        elif [ -d "$line" ] && [ ! -L "$line" ]; then
          rmdir -- "$line" 2>/dev/null || sp_refuse "mktemp leg: '$line' is left; remove it by hand"
        fi
        ;;
    esac
    case "$SP_VERDICT" in
      "not run") notrun=1 ;;
      fail) ok=0 ;;
      pass)
        if [ "$form" = explicit ]; then
          case "$line" in
            /*/harness-gates.*) ;;
            *) ok=0 ;;
          esac
        else
          case "$SP_EVIDENCE" in
            *"mkstemp failed"*) ;;
            *) ok=0 ;;
          esac
        fi
        ;;
    esac
    [ -z "$summary" ] || summary="$summary; "
    if [ "$form" = explicit ]; then
      summary="$summary$form: ${SP_LAYER:-not run} $line"
    else
      summary="$summary$form: ${SP_LAYER:-not run} $SP_EVIDENCE"
    fi
  done
  if [ "$ok" -eq 0 ]; then
    sp_result_line mktemp TD2 fail "$summary" "$departure"
  elif [ "$notrun" -eq 1 ]; then
    sp_result_line mktemp TD2 "not run" "$summary" "$departure"
  else
    sp_result_line mktemp TD2 pass "$summary" "$departure"
  fi
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
