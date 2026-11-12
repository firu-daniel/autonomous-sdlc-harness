### Task 12 — Respell the plugin agent definitions

**Goal:** Make every agent definition name `devscene.config.json`, the `devscene/` state-directory default, the `devscene-scripts/` scripts-directory default and `/devscene:analyze`, and cite the renamed command file.

**Depends on:**
- Task 11, which moved the analyze command to `plugin/commands/analyze.md` and, in the same commit, respelled the three citations of its path in `conventions-writer.md` and `conventions-reviewer.md` to `${CLAUDE_PLUGIN_ROOT}/commands/analyze.md`. Those three lines are already done. This task respells every other table substring in those two files.
- Task 1, which made `devscene-scripts` the `scriptsDir` default.

**Where this task stops.** Only these definitions' prose changes. No frontmatter key, `tools:` entry, `## ` heading, `<placeholder>`, return-field name or quoted wire literal is touched apart from the table's substrings (`.claude/context/plugin.md` → `## Writing agent prose`, *"Never paraphrase a wire literal"*). The instructions are Tasks 13–14.

### Targets

The twenty-three files under `plugin/agents/` the scope register lists (rows 170–192): `architecture-reviewer.md`, `branch-reviewer.md`, `business-parity-reviewer.md`, `committer.md`, `conventions-reviewer.md`, `conventions-writer.md`, `docs-reviewer.md`, `docs-writer.md`, `layer-implementer.md`, `layer-reviewer.md`, `prompt-injection-reviewer.md`, `qa-tester-mobile-maestro.md`, `qa-tester-mobile-mcp.md`, `qa-tester.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`, `statistics-plan-writer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`, `test-fix-plan-writer.md`, `ui-tests-plan-reviewer.md`, `ui-tests-plan-writer.md`, `user-review-fix-plan-writer.md`.

**Work:**

- [ ] Every file: in its `## Resolved values` table, the `<state_dir>` row's *"Default `sdlc-harness/`"* becomes *"Default `devscene/`"* (row 2 of `## Context`'s spelling table). Apply row 1 to every `devscene.config.json` mention in the body.
- [ ] `layer-implementer.md`, `layer-reviewer.md`, `prompt-injection-reviewer.md`, `task-plan-writer.md`: the `<scripts_dir>` row's *"`scripts/` when the key is absent"* becomes *"`devscene-scripts/` when the key is absent"* (row 14).
- [ ] `conventions-writer.md`, `conventions-reviewer.md`, `task-plan-writer.md`, `committer.md`: apply row 6 to every `/devscene:harness-analyze` (the `stale-rule` / `undescribed-layer` route sentences included; the dispatcher citations are already Task 11's), and row 9 to any marker spelling.
- [ ] Add no word beyond the respelling: a definition's up-front word count does not grow (`.claude/context/plugin.md` → `## Writing agent prose`).

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-analyze|harness:unfilled|harness:setup-pending|`scripts/` when the key is absent' -- plugin/agents` prints nothing.
- `git grep -nF 'commands/analyze.md' -- plugin/agents` names both conventions agents' dispatcher citations.
- `git diff --word-diff=porcelain -- plugin/agents` lists only removed/added word pairs that are table substrings, so no definition gained a word.
