### Task 22 — Update `docs/cli.md`, `docs/config.md`, `docs/watcher.md` and `ARCHITECTURE.md` for the new script, phase and agent

**Goal:** Bring the four developer and architecture documents that enumerate what this branch extends into step with it: the agent-invocable outer-loop scripts, the point at which `commands.test` runs, and the docs-retrieval search-tool roster.

**Depends on:** Tasks 1, 7 and 9.
- **Task 1:** `run-test-suite.sh`, an outer-loop script with `agentInvocable: true` and no deny-list entry, run by the orchestrating session. It runs the configured test command once, logs per round under `<stateDir>/test_run_logs/`, and prints `pass` or `fail <log>`.
- **Task 7:** `test-fix-plan-writer`, whose allowlist carries `mcp__harness-docs__search_docs` because `plugin/agents/README.txt` grants it to every plan writer.
- **Task 9:** `## Phase G — Run gates`, the only place in the flow that runs `commands.test`, once per phase. Implementers run `commands.typecheck` per unit.

### Targets

- `docs/cli.md` → `## 5.`, the paragraph beginning *"**Two families land in `scriptsDir`, and only one of them is generated.**"*.
- `docs/config.md` → `## 5.`, the `commands.test` row, and the `docs.retrieval` row (*"served over MCP to the ten plan-writer and reviewer agents"*).
- `docs/watcher.md` → `## 2. The scripts`, the **Outer-loop scripts** table.
- `ARCHITECTURE.md` → the bullet beginning *"**[shipped]** **Reachable by the agents granted it, and by nothing else in the tree.**"*.

**Work:**

- [ ] **`docs/cli.md`.** In that paragraph's enumeration of the outer-loop set, add the test-suite runner. In its sentence listing which rows are agent-invocable (*"true of the git wrappers …, and of `scratch-run.sh`, … and of `flow-walker.sh`, …"*), add `run-test-suite.sh`, which the orchestrating session runs once per Run gates phase, in that sentence's style.
- [ ] **`docs/config.md`.** The `commands.test` row reads *"Automated-test command that must exit zero before a change counts as done."* Keep that, and add that the flow runs it once per Run gates phase through `run-test-suite.sh`, never per implemented unit, while `commands.typecheck` still runs per unit. The key, its type and its required status are unchanged. In the `docs.retrieval` row, *"the ten plan-writer and reviewer agents"* becomes eleven, the count Task 7 sets.
- [ ] **`docs/watcher.md`.** Add a `run-test-suite.sh` row to the `## 2. The scripts` table, after the `flow-walker.sh` row, in the table's four columns: **File** `run-test-suite.sh`; **What it does** — runs the configured test command once, writes its full output to a per-round log under `<state_dir>/test_run_logs/`, and prints only `pass` or `fail <log path>`; **Who runs it** — the orchestrating session, once per Run gates phase; **Profile allow entry** — **yes**. Keep the table's other rows and the paragraphs under it unchanged; the *"Why only the `yes` rows carry a profile entry"* paragraph stays true as written.
- [ ] **`ARCHITECTURE.md`.** *"`mcp__harness-docs__search_docs` is in the other ten — `architecture-reviewer`, …, `user-review-fix-plan-writer`"* becomes eleven and adds `test-fix-plan-writer` in alphabetical order. Re-derive the list with the bullet's own command, `grep -ln "^tools:.*mcp__" plugin/agents/*.md`, and write what it prints, minus `qa-tester`, as the bullet already does.

**Verification:**

- `grep -ln "^tools:.*mcp__" plugin/agents/*.md` lists exactly the agents `ARCHITECTURE.md`'s bullet names, plus `qa-tester`.
- `grep -n "run-test-suite.sh" docs/cli.md docs/config.md` shows the new mentions. No sentence in either file still states that implementers run `commands.test`: check with `grep -n "commands.test" docs/config.md docs/cli.md`.
- `grep -n "run-test-suite.sh" docs/watcher.md` shows the new table row with `**yes**` in its last column, and every `agentInvocable: true` row of `cli/src/generators/outerLoopScripts.ts` (`grep -n "agentInvocable: true" cli/src/generators/outerLoopScripts.ts`) has a **yes** row in that table.
- `grep -nw "ten" docs/config.md` prints no line in the `docs.retrieval` row.
- No configuration key, schema property or CLI verb is documented as changed. This branch adds none.
