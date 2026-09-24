### Task 13 — Static checker `scripts/check-flow-graph.sh`

**Goal:** Make the planning flow checkable beyond its schema. The pilot exists for this. `scripts/check-flow-graph.sh` runs seven named checks over a flow graph and exits non-zero naming every one that fails:

1. every node is reachable from `start`;
2. every node can reach a terminal;
3. every FAIL cycle passes through a capped counter;
4. every run-mode id the graph gates on is in the closed set;
5. every ledger id the graph flips exists in the task-engine template;
6. every findings folder the graph resolves appears in the core's `## Setup` path table;
7. the graph's `counters.iteration.cap` equals every cap value the core's retained prose states.

With `--negatives`, it proves that each check rejects the fixture built for it.

**Depends on:** Task 12, which writes seven schema-valid fixtures in their own directory, `schemas/flow-graph-check/flow-graph-check-<check-id>.json` — **not** under `schemas/negative/`, whose documents are schema negatives only. Each is a one-change copy of the planning graph, for the check ids `reachable-from-start`, `reaches-terminal`, `fail-cycle-capped`, `run-mode-id-known`, `ledger-id-known`, `findings-folder-in-core` and `cap-matches-core`. Task 12 also writes `schemas/flow-graph.schema.json`, which already guarantees the shape this checker assumes. That shape is Task 1's format:

- `start`;
- `counters.<name>.cap`;
- `nodes.<id>.kind` of `dispatch` or `terminal`;
- `outcomes.<outcome>` edges, each either `{to, increment?, ledger?, onCap?}` or a binding edge `{binding, resume?}`;
- `skip[]` entries, each `{construct, phase | runModeId, to}`;
- `findingsFolder` templates carrying `{state_dir}` / `{branch}`.

**Where this task stops.** The checker reads the graph and three plugin documents (the run-mode closed set, the ledger templates and the planning core) and changes nothing. It does not validate the schema, which is `npm run validate:flow-graph` (Task 12). It is not wired into `scripts/run-gates.sh`, which is **Task 14**. The core's `## Setup` step 2 table (read by check 6), and its `## Setup` step 4 sizing sentence and `## Safety contract` step 2 halt message (read by check 7), are kept byte-identical by Task 9, which names the latter two as retained **descriptions** of the graph's cap.

### Targets

- `scripts/check-flow-graph.sh` (new). It is hand-written for this repository like `scripts/check-llms-txt.sh`, is not an `init` output, and does not ship to `main` (`scripts` is in `scripts/publish-main.sh`'s `removed_paths`).

**Work:**

- [ ] **Interface and header.** The shape mirrors `scripts/check-llms-txt.sh`:
  - a `# check-flow-graph.sh — …` line;
  - `THE CONTRACT`, listing the seven check ids and their exact definitions, `cap-matches-core` included;
  - the usage line: `check-flow-graph.sh [<graph>]`, whose default is `cli/templates/scripts/flows/task_plan_writing.graph.json`, or `check-flow-graph.sh --negatives`;
  - the exits: 0 clean; 1 one or more findings, each on stderr as `check-flow-graph: <graph> — <check-id>: <detail>`, all reported; 2 bad usage.

  The script resolves the repository root from its own location (`git -C "$script_dir" rev-parse --show-toplevel`), runs `set -uo pipefail` as `scripts/run-gates.sh` does, needs only bash, `jq`, `grep` and `sed`, and runs **no** pipe into a pager.
- [ ] **Graph checks, in `jq`.**
  - `reachable-from-start`: every node id is reached from `start` over `to`, `onCap`-less `to` edges, `skip[].to` and `<ask>` `resume`.
  - `reaches-terminal`: from every node, some path over those same edges reaches a `terminal` node or a binding edge `<escalate>`, where an `onCap` escalation counts as that path.
  - `fail-cycle-capped`: for every `FAIL` edge `u → v` that carries no `increment` of a counter with a `cap`, `u` is not reachable from `v` once every capped-incrementing edge and every binding edge is removed.

  The `<ask>` resume loop is exempt, being a binding bounded by `MAX_TOTAL_DISPATCHES` rather than by a counter. The core's sizing sentence says that budget *"absorb[s] writer clarification re-dispatches"*.
- [ ] **Cross-document checks.**
  - `run-mode-id-known`: every `skip[].runModeId` appears as a `` | `<id>` | `` row of the table under `plugin/instructions/run_mode_instructions.md` → `## The closed directive set — the only four things a run mode may switch off`, extracted from that heading to the next `## `.
  - `ledger-id-known`: every edge `ledger` value appears as a `- [ ] <ID>.` entry of the **task-engine** template block in `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3 Templates`, between its `**Task engine**` line and its `**User-review engine**` line. A user-review id such as `R1` therefore does **not** satisfy it.
  - `findings-folder-in-core`: every `findingsFolder`, with `{state_dir}` / `{branch}` written back as `<state_dir>` / `<branch>`, appears as a backticked path in the core's `## Setup (once per session)` step 2 table. The core per flow is a small table inside this script, with the single row `task_plan_writing` → `plugin/instructions/task_plan_writing_instructions_core.md`. Kept here rather than in the graph, it means a file shipped to adopters never names a `plugin/` path.

  An owner document that yields an **empty** set is a failure, never an empty pass. `scripts/check-llms-txt.sh` says the same of its `removed_paths` read.
- [ ] **`cap-matches-core`**, extracted the way `findings-folder-in-core` extracts the step 2 table, from the same per-flow core:
  - From `## Setup (once per session)`, take the step-4 line carrying `MAX_TOTAL_DISPATCHES = ` (bounded to that section, heading to next `## `), and extract every integer from its `` `iteration >= <N>` `` and `caps at <N> revisions` phrases.
  - From `## Safety contract — applies before EVERY Agent dispatch`, take step 2's halt-message line (`Halted: exceeded MAX_TOTAL_DISPATCHES`), and extract the integer from its `<N>-revision caps` phrase.
  - Fail with `cap-matches-core: graph cap <G>, core states <N> at <anchor>` for each extracted value that differs from `counters.iteration.cap`. Fail too when either anchor yields **no** value, so a reworded sentence cannot pass empty.

  The cap's owner is the graph. These core sentences are retained descriptions of it (Task 9), and this check is what holds the two in agreement, the way `findings-folder-in-core` holds the folder templates.
- [ ] **`--negatives`.** For each `schemas/flow-graph-check/flow-graph-check-*.json`, derive the check id from the file name, run the checks, and require that the fixture fails **with that id**. A fixture that passes, or that fails only on a different id, is itself a finding. Also require every check id in `THE CONTRACT` to have a fixture, so that deleting one cannot silently leave a check unproved.

**Verification:**

- `bash scripts/check-flow-graph.sh` exits 0 on the planning graph.
- `bash scripts/check-flow-graph.sh --negatives` exits 0, meaning each of the seven fixtures was refused by its own check.
- Mutation checks, each reverted:
  - Comment out the `fail-cycle-capped` block and `--negatives` exits 1 naming `flow-graph-check-fail-cycle-capped.json`.
  - Rename the task-engine `P1` entry in a scratch **copy** of `autonomous_pause_and_ledger.md`, pointed at by a temporary edit to the script's owner path, and the real graph fails `ledger-id-known`.
  - In a scratch **copy** of the core, pointed at by a temporary edit to the per-flow core table, change step 4's `caps at 5 revisions` to `caps at 4 revisions`, and the real graph fails `cap-matches-core`. Delete the phrase instead, and it fails on the empty extraction.
- `bash -n scripts/check-flow-graph.sh` passes. Grep the script for `$HOME` and find nothing (gate 6a). Grep it for `schemas/negative` and find nothing: the checker never reads the schema-negative directory.
