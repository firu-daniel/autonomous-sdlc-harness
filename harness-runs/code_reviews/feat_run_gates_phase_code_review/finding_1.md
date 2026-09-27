### 1. `run-test-suite.sh` starts a second concurrent run of a label whose first run is still live

**Severity:** Should Fix

**Site anchors**

- `cli/templates/scripts/run-test-suite.sh`: the run form, from `command_line="$(hr_command "$root" test)"` through the closing `rm -f "$running_file"`, plus the `if [ "$mode" = wait ]; then` block and the `# Exit map:` header lines.
- `scripts/run-test-suite.sh`: the self-adopted mirror. It is byte-identical to the template today and must stay so.
- `plugin/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` → `### G.1 Run the gates`: the numbered list (step 2, *"Run `bash <scripts_dir>/run-test-suite.sh <gate_key>_round_<gate_round>` as one plain command"*) and the bullet *"The STOP check on every re-issue is how a human ends a hung suite."*
- The three supervised statistics points, each with the bullet opening *"If the tool layer moves the run to the background, re-issue the same command"*:
  - `plugin/instructions/code_review_instructions.md` → step 6;
  - `plugin/instructions/code_review_fixes_instructions.md` → `## Phase 3`;
  - `plugin/instructions/user_review_fixes_instructions.md` → `## Phase 3`.
- `cli/test/run-test-suite.test.mjs`: the suite this adds a case to.

**Problem**

The run form never checks whether a run of the same label is already in flight. It unconditionally does four things:

1. Removes `<label>.verdict`.
2. Overwrites `<label>.running` with its own PID.
3. Truncates `<label>.log` (`: > "$log_file"`, then the subshell's `> "$log_file"`).
4. Starts the command.

The G.1 prose makes this reachable. The phase says a STOP check runs before every `--wait` re-issue, and that this check *"is how a human ends a hung suite"*. That is not what STOP does: it halts the **flow**, and the backgrounded wrapper keeps running. In an interactive (semi-autonomous or supervised) session, the backgrounded process outlives the halt. The user deletes STOP and re-invokes the command. Phase G re-enters: G.0 finds no index for the round and runs G.1. G.1 issues the run form for the **same label** while the first run is still alive. The supervised statistics points behave the same way on a re-run of their fixed labels (`task_supervised`, `review_<n>_supervised`).

Once two runs of one label overlap:

- **The log is corrupted.** The first run's subshell still holds `<label>.log` open at its own write offset, so its output interleaves with the second run's over a file the second run truncated. That garbled log is the evidence `test-fix-plan-writer` diagnoses from.
- **The verdict can come from the wrong run.** The first run finishes first. It renames its verdict into `<label>.verdict` and runs `rm -f "$running_file"`, which deletes the **second** run's PID file. The orchestrator's next `--wait` then emits the **first** run's verdict for a round whose tree may since have changed. Any later `--wait` finds no live PID and refuses with *"no run in flight"*, which G.1 escalates as a missing verdict line.
- **The command runs twice**, which is the cost this whole branch exists to remove.

**Fix**

Allow only one run per label. A run form that finds a live run of its label collects that run's verdict instead of starting another. A run removes only its own PID file.

- [ ] **Wrapper — make the wait loop callable.** In `cli/templates/scripts/run-test-suite.sh`, move the body of the `if [ "$mode" = wait ]; then … fi` block unchanged into a function, and dispatch the wait form to it:

  ```bash
  # Poll for the verdict of the run of <label> that is in flight, for at most one
  # wait slice; print it, or `pending`.
  wait_for_verdict() {
    local deadline=$((SECONDS + WAIT_SLICE_SECONDS))
    while :; do
      [ -f "$verdict_file" ] && emit_verdict
      if ! run_alive; then
        # The verdict is renamed into place before `.running` is removed, so a
        # run that finished between the two tests above has left it.
        [ -f "$verdict_file" ] && emit_verdict
        refuse "no run in flight for $label"
      fi
      [ "$SECONDS" -lt "$deadline" ] || break
      sleep 1
    done
    echo pending
    exit 3
  }

  if [ "$mode" = wait ]; then
    wait_for_verdict
  fi
  ```

- [ ] **Wrapper — never start a second run.** Directly before `mkdir -p "$log_dir" || refuse "cannot create '$log_dir'"`, insert:

  ```bash
  # ONE RUN PER LABEL. A live run of this label — a session that re-entered the
  # phase while its earlier, backgrounded run still runs — is never joined by a
  # second: collect that run's verdict instead, exactly as the wait form would.
  if run_alive; then
    wait_for_verdict
  fi
  ```

- [ ] **Wrapper — remove only your own PID file.** Replace the closing `rm -f "$running_file"` with:

  ```bash
  if [ "$(cat "$running_file" 2>/dev/null)" = "$$" ]; then rm -f "$running_file"; fi
  ```

- [ ] **Wrapper header.** Update three places:
  - In `# Exit map:`, replace `#   3  pending (wait form only) — the run is still going; call again` with `#   3  pending — the wait form, or the run form finding a run of the same label already in flight; issue the wait form`.
  - In `# OUTPUT CONTRACT`, replace *"the run form prints exactly one stdout line: `pass` (exit 0) or `fail <log path>` (exit 1)"* with *"the run form prints exactly one stdout line: `pass` (exit 0), `fail <log path>` (exit 1), or — when a run of the same label is already in flight — `pending` (exit 3)"*.
  - Add a paragraph `# ONE RUN PER LABEL.` stating that the run form never starts a second run of a live label and removes only a `.running` file that holds its own PID.
- [ ] **Mirror.** Copy the edited template byte for byte to `scripts/run-test-suite.sh`.
- [ ] **Test.** In `cli/test/run-test-suite.test.mjs`, add a case: *"a run form issued while a run of the same label is live prints `pending` and starts nothing"*.
  - Start `task_round_1` in the background with `STUB_RELEASE` set to a not-yet-existing file, and `pollUntil` its `.running` file exists.
  - Issue a second run form of `task_round_1`. Assert stdout `pending\n`, exit status 3, and `counterLines(dir)` still `['ran']`.
  - Create the release file, and poll until the first run exits.
  - Assert `--wait task_round_1` prints `pass\n`, and `counterLines(dir)` is still `['ran']`.
  - Also update the suite's header rule, which says the wrapper *"runs the configured command exactly once per invocation"*, to *"at most once per invocation, and never while a run of the same label is live"*.
- [ ] **G.1 prose.** In `plan_orchestration_instructions_core.md` → `### G.1 Run the gates`:
  - Under the bold lead *"If the tool layer moves the run to the background"*, rewrite that lead to *"If the tool layer moves the run to the background, or the run form itself prints `pending` — a run of this label is already in flight, because this session re-entered the phase while its earlier run still runs —"*.
  - Replace the sentence *"The STOP check on every re-issue is how a human ends a hung suite."* with *"The STOP check on every re-issue is how a human ends the wait. It does not stop the suite, which runs on until it exits, and a re-entered Phase G collects that same run's verdict rather than starting a second."*
- [ ] **Supervised prose.** In each of the three supervised statistics points named above, rewrite *"If the tool layer moves the run to the background, re-issue the same command"* to *"If the tool layer moves the run to the background, or the command prints `pending`, re-issue the same command"*.

**Verification:** typecheck only. The Run gates phase covers the suite, and the new case is this unit's own test file.

**Deviations from plan:** G.1 lead: the prescribed replacement text, followed by the kept tail *"— the expected case wherever the suite outlasts the Bash tool's foreground window —"*, reads as two stacked dash clauses. Implemented as bold lead *"If the tool layer moves the run to the background, or the run form itself prints `pending`"* followed by *"— the first the expected case wherever the suite outlasts the Bash tool's foreground window, the second meaning a run of this label is already in flight, because this session re-entered the phase while its earlier run still runs —"*. Same content, both conditions kept.
