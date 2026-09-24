### Task 17 — Add the walker, its gate library and its graph to `docs/watcher.md` §2

**Goal:** `docs/watcher.md` → `## 2. The scripts` is the table of record for every outer-loop file `init` copies into `scriptsDir` (`plugin/docs/AUTONOMOUS_FLOW.md` names this document as the watcher's format of record). After Task 5 it lacks three of them, and its paragraph *"**Why only four carry a profile entry, and why that is not the reachability answer.**"* becomes false, because five rows will carry one. Add the three rows and correct the paragraph so it holds for the table as shipped.

**Depends on:** Task 5, with Tasks 2, 3 and 4 behind it. Task 5 adds three rows to `OUTER_LOOP_SCRIPTS` in `cli/src/generators/outerLoopScripts.ts`:

- `flow-walker.sh`: mode `0o755`, `agentInvocable: true`, **no** `DENY_SCRIPT_BASENAMES` entry. So the generated autonomous profile grants it in the three literal forms, and the script-allowlist guard also auto-allows a plain invocation of it.
- `lib/flow-walker-gates.sh`: `subdir: 'lib'`, mode `0o644`, `agentInvocable: false`. It is sourced by the walker, never executed (Task 3).
- `flows/task_plan_writing.graph.json`: `subdir: 'flows'`, mode `0o644`, `agentInvocable: false`. It is data the walker reads from beside itself by flow id (Task 1).

The walker also sources `lib/harness-run-lib.sh`, whose `phases.*` reader Task 2 adds. Its three invocation forms are `bash <scripts_dir>/flow-walker.sh start|next|current --flow task_plan_writing --branch <branch> …` (Task 4). It is run by the orchestrating session of the planning flows that read `plugin/instructions/task_plan_writing_instructions_core.md` (Task 9).

**Where this task stops.** It edits `docs/watcher.md` §2 only. `docs/cli.md`'s outer-loop family paragraph is **Task 16**'s, and `plugin/docs/AUTONOMOUS_FLOW.md` is **Task 11**'s. `docs/outer-loop-verification.md` is not edited: its §3 and §4 paragraphs are dated measurement records of the round that drove them (see the story index's `## Scope register`). The guard's own `LEFT ALLOWED, DELIBERATELY` comment in `plugin/hooks/autonomous-script-allowlist-guard.sh` is not a target either. This task does not claim the walker is in that list.

### Targets

- `docs/watcher.md` → `## 2. The scripts`: the `| File | What it does | Who runs it | Profile allow entry |` table and the paragraph under it opening *"**Why only four carry a profile entry, and why that is not the reachability answer.**"*

**Work:**

- [ ] **Add the three rows**, in the table's own column shape:
  - `lib/flow-walker-gates.sh`: the walker's gate predicates; sourced by `flow-walker.sh`, never executed, with no executable bit; `no`.
  - `flows/task_plan_writing.graph.json`: the planning loop's declared flow graph (nodes, outcomes, the `iteration` counter and its cap, escalation payloads); read by `flow-walker.sh` from beside itself; `no`.
  - `flow-walker.sh`: walks a declared flow graph and prints the next action of the planning loop; run by the orchestrating session of a planning flow; **yes**.
  
  Place each library before the script that sources it, as the table does today. `lib/harness-run-lib.sh`'s *"sourced by every row below"* cell must stay true: the graph row is data, not a script, so either place that row where the cell's claim still holds or narrow the cell to *"sourced by every script row below"*.
- [ ] **Correct the paragraph under the table** so it holds for the new table:
  - Replace *"Why only four carry a profile entry"* with a count-free heading sentence, for example *"Why only the `yes` rows carry a profile entry"*. Do not substitute another cardinal.
  - *"The rest are run by the watcher process, the agent runner or a person"* is false for the two new `no` rows. Say that the gate library is sourced and the graph is read, both by the walker, and that neither is run.
  - Where the paragraph says `scratch-run.sh` is reached by both mechanisms (a `yes` row with no deny entry), add `flow-walker.sh` on the same ground. Keep *"Those six are the left-allowed set `plugin/hooks/README.md` and the guard's own `DENY_SCRIPT_BASENAMES` comment both name"* true as written: it names the six, and the walker is reached through its `yes` row, not through that list.
  - *"the four yes rows"* in the construct-scan sentence becomes *"the yes rows"*.

**Verification:**

- `grep -n "flow-walker" docs/watcher.md` hits all three new rows and the paragraph.
- Every row of the §2 table names a file in `OUTER_LOOP_SCRIPTS` (`grep -n "Object.freeze({ file:" cli/src/generators/outerLoopScripts.ts`, with the `DOCS_SEARCH_SERVER_SCRIPT_NAME` row read as `docs-search-server.sh` and a `subdir` prefixed to the file name), and every such file has a row. Each row's *Profile allow entry* cell is **yes** exactly when that file's row carries `agentInvocable: true`.
- `grep -nE "only (four|five)|the (four|five) yes rows" docs/watcher.md` has no hit.
- `bash scripts/check-command-spelling.sh` exits 0, and gate 6a finds no machine path in the edited section.
