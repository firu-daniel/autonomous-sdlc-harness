### Task 8 — `test-fix-plan-writer` reads the per-gate log sections and tells a static failure from a test failure

**Goal:** Teach `plugin/agents/test-fix-plan-writer.md` the two-section log, so that a failing round's fix plan separates whole-tree type-check failures (format, lint, type errors) from test failures. Each kind gets the right `**Failing test:**` line, and the agent's description and its never-run rule name both configured commands.

**Depends on:** Task 1, which fixes the log this agent reads. The marker lines are a wire and are restated here byte-exact:

- `== run-test-suite.sh: gate typecheck (commands.typecheck) ==` … the type-check output … `== run-test-suite.sh: gate typecheck exited <status> ==`
- or, where `commands.typecheck` is `<none>`: `== run-test-suite.sh: gate typecheck (commands.typecheck) ==` then `== run-test-suite.sh: gate typecheck not run: commands.typecheck is <none> ==`
- then `== run-test-suite.sh: gate test (commands.test) ==` … the test output … `== run-test-suite.sh: gate test exited <status> ==`

The test section is present even when the typecheck failed (run both, report both). The log path shape `<state_dir>/test_run_logs/<sanitized branch>/<gate_key>_round_<gate_round>.log` is unchanged, so this agent's derivation of `<gate_key>` and `<gate_round>` from the filename is unchanged.

**What this task does not change.** The finding-file shape, the `## Not fixable on this branch` route, the index template, the machine-path rewrite and the lessons-ledger prohibition. `layer-implementer.md`'s handling of a `none — <gate name>` finding through its fix-site fallback is **Task 6's**, and it already admits a non-test gate.

### Targets

- `plugin/agents/test-fix-plan-writer.md`

**Work:**

- [ ] `description:`: say that the agent reads the log of a failed Run gates round, whose sections hold the whole-tree type check and the test suite, and diagnoses each failing type-check finding or test. Keep "Writes only the fix-plan files and never runs a test or a gate", the dispatch site and the phase gate.
- [ ] `## Process` step 1, "**Read the log end-to-end** and list every failing gate and every failing test it names": add that the log has one section per gate, delimited by the marker lines above. A section whose closing marker shows a non-zero status is a failing gate, and the typecheck section's failures are **static** failures. A not-run line is neither a failure nor a pass, and it never yields a finding.
- [ ] The per-finding `**Failing test:**` rule: a failure from the typecheck section takes `none — typecheck`, followed by the failing tool or check the log names where it names one (e.g. `none — typecheck (the formatter check)`, written in the project's own vocabulary). That is the existing `none — <gate name>` form, so `layer-implementer.md`'s fix-site fallback takes it unchanged. In `## Source failures`, list typecheck-section failures under their gate.
- [ ] "**Never run the configured test command, a gate, or a test file.**": name both commands by their configuration keys, not by token — e.g. "never run the configured `commands.typecheck` or `commands.test` string, a gate, or a test file" — and keep "Phase G re-runs the gates itself". This file's `## Resolved values` table declares no `<test_cmd>` / `<typecheck_cmd>` row, and this task adds none: **no new token is introduced** anywhere in the file, so the body keeps spelling the configuration keys as it does today (`.claude/context/plugin.md` → `## The placeholder vocabulary`: the token in the body is the token in the table).

**Verification:**

- `grep -n 'run-test-suite.sh: gate' plugin/agents/test-fix-plan-writer.md` prints the marker lines exactly as Task 1's header contract states them (compare against `grep -n 'run-test-suite.sh: gate' cli/templates/scripts/run-test-suite.sh`).
- `grep -n 'none — typecheck' plugin/agents/test-fix-plan-writer.md` finds the static-failure form.
- `grep -nE '<(typecheck|test)_cmd>' plugin/agents/test-fix-plan-writer.md` prints no line: the file introduces neither token, so its `## Resolved values` table needs no new row.
- The frontmatter keys are still exactly `name`, `description`, `tools`, `model`, and `tools:` is unchanged.
