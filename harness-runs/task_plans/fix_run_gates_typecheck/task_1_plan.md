### Task 1 — `run-test-suite.sh` runs the whole-tree `commands.typecheck` then `commands.test` under one verdict

**Goal:** Make the harness-owned Run gates wrapper run `commands.typecheck` (whole tree, no path argument) and then `commands.test` on every run, writing both outputs into the round's one log under per-gate marker lines. It still prints exactly one verdict, which is `pass` only when both gates pass.

**What this task does not do.** It does not touch any test. `cli/test/run-test-suite.test.mjs` is **Task 2's**, and the existing cases there must keep passing unchanged against this wrapper: they seed `typecheck: 'echo typecheck'`, which exits 0. The plugin prose that tells the orchestrator and `test-fix-plan-writer` about the change belongs to Tasks 4–10. The repository's own `scripts/run-test-suite.sh` copy is **Task 12's**. An adopter's rendered `typecheck.sh` / `test.sh` is never touched.

### Targets

- `cli/templates/scripts/run-test-suite.sh`: the behaviour and its header contract.
- `cli/src/config/model.ts`: the doc comment on `isNoneSentinel` only. It gains the wrapper's shell mirror of `COMMAND_NONE_SENTINEL` among "the sides that must agree on this answer".

**The contract this task produces.** Tasks 2, 4, 8 and 12 consume it, and each restates it.

- Invocation unchanged: `run-test-suite.sh <label>` and `run-test-suite.sh --wait <label>`, the label pattern `^[A-Za-z0-9][A-Za-z0-9._-]*$`, stdout `pass` (exit 0) / `fail <log path>` (exit 1) / `pending` (exit 3), and the log at `<state_dir>/test_run_logs/<sanitized branch>/<label>.log` beside `<label>.running` and `<label>.verdict`.
- Order: typecheck first, then test, **each exactly once per run form**, both from the repository root with stdin from `/dev/null`. **The test runs even when the typecheck failed** (run both, report both).
- Verdict: `pass` exactly when the typecheck exited 0 (or was not run for `<none>`) **and** the test exited 0. Otherwise `fail <log path>`.
- Log marker lines, byte-exact:
  - `== run-test-suite.sh: gate typecheck (commands.typecheck) ==`, the typecheck output, `== run-test-suite.sh: gate typecheck exited <status> ==`
  - with `<none>`: `== run-test-suite.sh: gate typecheck (commands.typecheck) ==` followed only by `== run-test-suite.sh: gate typecheck not run: commands.typecheck is <none> ==`
  - `== run-test-suite.sh: gate test (commands.test) ==`, the test output, `== run-test-suite.sh: gate test exited <status> ==`
- New refusal: `commands.typecheck` unset or empty → exit 2, stderr exactly `run-test-suite.sh: commands.typecheck is not set in harness.config.json`, nothing on stdout, and no log, `.running` or `.verdict` written. Like the existing `commands.test` refusal, it is resolved **before** `mkdir` and before the run-alive check.

**Work:**

- [ ] Resolve both command lines before anything is written. Keep the existing `hr_command "$root" test` resolution and its refusal, and add `hr_command "$root" typecheck` with the same three-way `case $?` (0 / 2 → the existing config refusal / otherwise empty), refusing with the message above when empty. Recognise the sentinel by comparing the **whitespace-trimmed** typecheck value exactly to a script-level constant `TYPECHECK_NONE_SENTINEL='<none>'`, matching `isNoneSentinel` in `cli/src/config/model.ts`, which is exact and case-sensitive on the trimmed value. Never `eval` the sentinel: it would parse as a shell redirect.
- [ ] Replace the single `eval` subshell with two runs into the same `$log_file`. Each is wrapped by its marker lines and run in its own `( set +u +o pipefail; eval "$line" ) < /dev/null >> "$log_file" 2>&1` subshell, so each command keeps the options a plain `bash -c` would give it. Keep the log truncation (`: > "$log_file"`) before the first marker, so a re-run of the same label still replaces the log. Record each status separately. For `<none>`, write the header and the not-run line and run nothing. Compute the verdict from both statuses. The `.verdict` tmp-and-rename, the PID-guarded `.running` removal and the final `echo` are unchanged.
- [ ] Rewrite the header comment. Its first line becomes "run the configured `commands.typecheck` (whole tree, no path argument) and `commands.test` strings once each and decide one verdict for the pair". Update the OUTPUT CONTRACT, Usage and Exit map (add `commands.typecheck` unset among the exit-2 causes), and add four short paragraphs:
  - **TWO GATES, ONE VERDICT**: the marker lines above are a wire `test-fix-plan-writer` reads.
  - **RUN BOTH, REPORT BOTH**: the test runs after a failing typecheck because `MAX_GATE_ROUNDS` counts gate runs, so a branch broken both ways spends one run and gets one fix plan, not two.
  - **`<none>` IS NOT A PASS**: the not-run line, and why the sentinel is never `eval`-ed.
  - **THE NAME IS KEPT**: renaming would reach `OUTER_LOOP_SCRIPTS`, two test pins and every adopter's permission profile.
- [ ] `cli/src/config/model.ts`: in the `isNoneSentinel` doc comment, extend "The sides that must agree on this answer" with the shell mirror `TYPECHECK_NONE_SENTINEL` in `cli/templates/scripts/run-test-suite.sh`. That template is one an adopter receives rather than an import site, so it cannot import the constant. This declaration is how the conventions document's owned-constant rule is kept for it. No code change in that file.

**Verification:**

- `bash -n cli/templates/scripts/run-test-suite.sh` exits 0.
- `<typecheck_cmd>`, run as written from the repository root, passes. It compiles `cli/src`, which covers the `model.ts` comment edit.
- `grep -n 'TYPECHECK_NONE_SENTINEL' cli/templates/scripts/run-test-suite.sh cli/src/config/model.ts` finds the constant in the template and its mirror declaration in the doc comment.
- Reading the template: no path in which the typecheck line is `eval`-ed with arguments, no early exit between the two runs, and no write before both command lines resolve.
- The behaviour is exercised end to end by Task 2's cases, which run this wrapper in throwaway fixtures. That task, not this one, owns the behavioural evidence: this task neither creates nor edits a test file, so it runs none.

**Deviations from plan:**

- Evidence downgrade: the `bash -n cli/templates/scripts/run-test-suite.sh` verification was refused by the permission layer ("This command requires approval"). The syntax claim rests on reading the edited template, not on running it. Task 2's fixture cases, which execute the wrapper, are the first executed evidence.
