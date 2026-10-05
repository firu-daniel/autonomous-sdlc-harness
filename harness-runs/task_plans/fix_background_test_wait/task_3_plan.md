### Task 3 — Carry the background case into `layer-implementer`'s return contract, fallback and evidence-downgrade rules

**Goal:** Make the implementer, the agent that actually runs the per-unit commands, able to report a run that left the foreground. Today its return contract (`## Output contract` item 5) has no wording for that case, and its row-`G.4` fix-site fallback and evidence-downgrade rule do not name it. Without that wording, the observed agent improvised a poll loop instead of reporting.

**Depends on:** Task 2. Task 2 appends point 6 to `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, which says a run the tool layer moved to the background is not waited on and is recorded in the unit's return *as moved to the background — not run, never a pass*. This task owns the exact return strings for that condition and restates the condition phrase byte for byte:

- `skipped: moved to the background` for a test file;
- `not run: moved to the background` for `<typecheck_cmd>`.

This file already cites `## The test-run rule` (`**What you run, in every mode.**`), so it adds no new citation of that heading and does not restate point 6's body. That body is Task 2's. Per `.claude/context/plugin.md` → `## Frontmatter` and the agent-definition bar in this file's own `## Minimal prose — every line carries a rule`, every added clause states a rule, not the argument for it.

### Targets

- `plugin/agents/layer-implementer.md` — `## Output contract` item 5; the row-`G.4` `**Fix-site fallback**` bullet; `**An evidence downgrade is recorded, in every mode.**`.

**Work:**

- [ ] `## Output contract` item 5, first sub-bullet (the `<typecheck_cmd>` result): after *"or, where `commands.typecheck` holds `<none>`, **not run, because the key says there is none**"*, add *"or **not run: moved to the background**"*.
- [ ] `## Output contract` item 5, second sub-bullet (each test file this unit created or edited): extend the list *"or **skipped: no single-file command stated**, or **skipped: the stated command was refused**"* with *", or **skipped: moved to the background**"*. In the third sub-bullet (row `G.4`), the existing *"the same `skipped: …` wording naming the reason"* then covers the new reason without an edit.
- [ ] Row-`G.4` `**Fix-site fallback**` bullet: extend its trigger list *"no `<test_file_cmd>` stated, the stated one refused, or a finding naming no test file"* to *"no `<test_file_cmd>` stated, the stated one refused, the run moved to the background, or a finding naming no test file"*. A backgrounded named-test run proves no pass, so the close must rest on the fix site.
- [ ] `**An evidence downgrade is recorded, in every mode.**`: extend its example list *"a refused command, an interpreter that is not on PATH, a probe you could not run"* with *", a run moved to the background"*. This brings the implementer's own `scratch-run.sh` probe under the same no-wait-and-record route (story index `## Context` → the inventory's probe bullet).

**Verification:**

- `grep -n 'moved to the background' plugin/agents/layer-implementer.md` hits all four edited sites, and `grep -n 'moved to the background' plugin/instructions/unit_loop_core.md` hits Task 2's point 6. The invariant: the condition phrase is spelled identically in both files.
- `grep -nF 'skipped: moved to the background' plugin/agents/layer-implementer.md` and `grep -nF 'not run: moved to the background' plugin/agents/layer-implementer.md` each hit `## Output contract` item 5.
- The frontmatter is unchanged (`git diff -- plugin/agents/layer-implementer.md` touches no line between the `---` fences). Its `tools:` allowlist in particular gains nothing: the rule asks the agent to stop waiting, not to use a new tool.
- `git diff -- plugin/agents/layer-implementer.md` shows only the four edits above. In particular, `**The row-\`G.4\` check, before any edit.**`'s first bullet and the `**Already passing**` return form are untouched.
- Run `commands.typecheck` as configured. This task creates and edits no test file, so it runs no test (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` point 3).
