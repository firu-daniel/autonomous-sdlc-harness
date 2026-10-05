### Task 2 — Add test-run rule point 6: a unit's run stays in the foreground, and one moved to the background is not waited on

**Goal:** Give the unit loop the one rule it lacks for a per-unit run (`<typecheck_cmd>`, `<test_file_cmd>`) that leaves the foreground: what shape to issue the run in, what a refusal does **not** license, and that a run the tool layer moved to the background is recorded as not run rather than waited on. It goes in the file that already owns what a unit runs, `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, as a new point appended after point 5.

**Where this task stops.** This task states the rule and the **condition name**, *moved to the background*. It does not spell the implementer's return strings. **Task 3** owns those, in `plugin/agents/layer-implementer.md` → `## Output contract` item 5, as `skipped: moved to the background` for a test file and `not run: moved to the background` for `<typecheck_cmd>`. This file's rule says the unit "records it in its return as moved to the background", and Task 3 restates that phrase byte for byte.

**Why this rule and not a wrapper wait.** The story index `## Context` states the decision. In short:

- `run-test-suite.sh --wait` serves `commands.test` only, so a unit has no verdict file to poll.
- `<test_file_cmd>` is conventions-document prose, not a configured string a wrapper may run.
- A unit's return ends its dispatch and not the session, so G.1's teardown reason for never ending the turn mid-run does not transfer. What the unit leaves behind is its own result, which Phase G re-establishes.

### Targets

- `plugin/instructions/unit_loop_core.md` — `## The test-run rule`, a new point 6 appended after point 5.

**Work:**

- [ ] Append point 6 after point 5 (*"`<typecheck_cmd>` is not a test run."*) and before the `**Who may cite this.**` paragraph. Use this text, tightened only where `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` requires (no slash-command name, no machine path, no mode literal):

  > 6. **A unit's run stays in the foreground, and a run moved to the background is not waited on.** Run `<typecheck_cmd>` and `<test_file_cmd>` each as one foreground command whose output returns to you — never redirected to a file, never piped, never started in the background. A refusal is handled as a refusal (point 3, for a test file), never as a reason to reshape the command or move it to the background. When the tool layer moves a run to the background on its own, do not collect it: `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates` forbids a `Monitor` and a `sleep` by name, and both are forbidden here, as is any loop that reads the run's output for a completion line — that output is the runner's, and its format can differ when captured. Record the run in your return as moved to the background — not run, never a pass — raise no blocker, and continue; Phase G runs the suite anyway. Nothing here depends on how long the run takes: a unit has no verdict to poll, and its return ends its dispatch, not the session.

- [ ] Leave points 1–5, the section heading `## The test-run rule` and the `**Who may cite this.**` roster byte-identical. Points are cited by number (`#### Row G.4 — test-fix items` cites *"`## The test-run rule` point 1"*; `#### The already-passing close` cites *"`## The test-run rule` point 1's row-`G.4` exception"*; point 3 cites *"point 1's row-`G.4` run"*), and the heading is a roster-bound wire. Appending as point 6 renumbers nothing.
- [ ] Add no `## Resolved values` row and no binding: point 6 uses only `<typecheck_cmd>` and `<test_file_cmd>`, both already declared in this file's table.

**Verification:**

- `grep -nE '^[0-9]\. \*\*' plugin/instructions/unit_loop_core.md` lists points 1–6 inside `## The test-run rule`, in that order. Points 1–5 are unchanged from `git show HEAD:plugin/instructions/unit_loop_core.md`, which `git diff -- plugin/instructions/unit_loop_core.md` confirms by showing only added lines.
- `git grep -n "The test-run rule" -- plugin` re-derives every citer of the heading. The heading text is unchanged, so every citer still resolves, and no new citer is added (the roster is closed).
- The cited anchor resolves: `grep -n '^### G.1 Run the gates' plugin/instructions/plan_orchestration_instructions_core.md` prints one line, and the quoted *"Forbidden here, by name"* bullet under it names `Monitor` and `sleep`.
- `grep -n 'moved to the background' plugin/instructions/unit_loop_core.md` hits point 6. Task 3's verification checks the same phrase in `plugin/agents/layer-implementer.md`.
- Run `commands.typecheck` as configured. This task creates and edits no test file, so it runs no test (`## The test-run rule` point 3).
