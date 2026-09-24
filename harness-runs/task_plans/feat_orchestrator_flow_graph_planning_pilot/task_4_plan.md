### Task 4 — Add the walker `flow-walker.sh`

**Goal:** Write the script the orchestrator calls instead of working out its next step from prose. It is given the flow, the branch and the outcome of the node that just ran. It prints the next action in one fixed, line-oriented form: *dispatch this agent with these arguments and this heartbeat*, or *take this binding with this payload*. It owns the next node, the shared counter, the cap, both skip semantics, each gate's `iteration:` argument and the escalation payload. It rejects any outcome the current node does not declare.

**Depends on:**

- **Task 1**, which writes `cli/templates/scripts/flows/task_plan_writing.graph.json` in the format that file states. What this task consumes from it:
  - `formatVersion` `1` and `flow`;
  - `start` and `entries`;
  - `counters.iteration.cap`;
  - `paths` (`story_index`, `ui_test_index`) and the ordered `reports` keys;
  - per dispatch node: `agent`, a `heartbeat` carrying `{iteration}`, optional `prompts` (`initial` / `revision`), optional `findingsFolder` (a `{state_dir}` / `{branch}` template), an ordered `skip` array of `{construct: "skipped", phase, to, report}` / `{construct: "passedByExclusion", runModeId, to, report}` evaluated first-applies-wins, and `outcomes`;
  - per edge: `to`, `increment`, `reset`, `prompt`, `ledger`, `report` and `onCap`, or a binding edge `{binding: "<ask>", resume}` / `{binding: "<escalate>", reason, summary?, roundCounts?, evidence?}`;
  - the terminal node's `binding`.
- **Task 3**, which writes `lib/flow-walker-gates.sh`. It provides `fw_next_review_index <folder_abs>`, `fw_round_count <folder_abs>`, `fw_run_mode_skipped <repo_root> <state_dir> <branch> <flag_value>` (which returns 1 when there is no record), `fw_id_in_list <id> <csv>`, `fw_phase_on <repo_root> <phase>` (0/1/2) and `fw_index_evidence <index_abs>`, which prints `evidence:` / `evidence.open:` lines.

**Where this layer stops.** The walker neither runs the safety contract nor resolves a binding. The STOP check, the `.dispatch_counter` increment, the PAUSE check and the halt messages stay orchestrator steps, which **Task 9** keeps in the core; the decision and its reasons are recorded by **Task 16**. So the walker prints the heartbeat with the literal slot `(#<total_dispatches>)`, which the orchestrator fills from its own counter step. It prints a binding's **name**, such as `<escalate>`, and never that binding's value. The fork resolves that, per `plugin/instructions/mode_contract.md`. It composes no dispatch prompt either: the dispatch blocks stay in the core, and the walker supplies only the values they are missing (`arg.iteration`, `arg.findings_file`) plus the prompt variant.

### Targets

- `cli/templates/scripts/flow-walker.sh` (new, executable once Task 5 ships it).

**The interface.** **Tasks 6, 7 and 9** restate this contract. Each invocation is one literal command, run from the repository root, carrying none of `$(`, a backtick, `|`, `<`, `>` or a braced expansion. The script-allowlist guard withholds its allow from any of those.

```
bash <scripts_dir>/flow-walker.sh start   --flow task_plan_writing --branch <branch> [--entry <node>] [--skipped <ids|none>]
bash <scripts_dir>/flow-walker.sh next    --flow task_plan_writing --branch <branch> --outcome <outcome> [--findings <path>] [--skipped <ids|none>]
bash <scripts_dir>/flow-walker.sh current --flow task_plan_writing --branch <branch>
```

- `<outcome>` is one of `returned`, `PASS`, `FAIL`, `questions`, `no_ui`, `error`, `blocker`, or `answered`. `answered` is legal only while an `<ask>` is pending.
- `--findings` is required with `FAIL`: it carries the reviewer's own `findings_file:` return.
- `--skipped` is needed only when no flow-progress ledger exists.
- The graph resolves from the script's own location, as `<dir of BASH_SOURCE[0]>/flows/<flow>.graph.json`. It is never passed as a path.
- The repository root comes from a bare `git rev-parse --show-toplevel` in the working directory, via `hr_repo_root`. `stateDir` comes from `hr_state_dir`.

**The fixed output form** (stdout, `key: value` lines, always in this order):

- **dispatch:** `action: dispatch`, `node: <id>`, `agent: <name>`, then `prompt: <initial|revision>` (writer nodes only), `arg.iteration: <n>` (reviewer nodes only: the next free index in the node's own findings folder), `arg.findings_file: <path>` (only with `prompt: revision`), then zero or more `skip: <node> <skipped|passed-by-exclusion>` and `ledger: <id>` lines for what the walk passed through, and last `heartbeat: <rendered template>  (#<total_dispatches>)`.
- **binding:** `action: binding` and `binding: <ask|escalate|terminal_handoff in angle brackets>`, then `node: <id>`, then:
  - for `<ask>`: `agent:` and `resume: <node>`;
  - for `<escalate>`: `agent:`, `reason: <cap|error|blocker>`, then for a cap only `findings_file:`, `rounds: <node> <count>` per `roundCounts` entry (omitting a node this walk recorded as `skipped`), the `fw_index_evidence` lines for the `evidence` path, and `summary: <text with {cap} rendered>`;
  - for `<terminal_handoff>`: one `report: <key> <value>` per recorded key, in `reports` order.

  Every binding then closes with its `skip:` / `ledger:` lines.
- **refusal:** exit 1 and one `flow-walker: <cause>` line on stderr, with the state file unchanged. The refused cases are an undeclared outcome, a missing required flag, `next` before `start`, a branch or flow different from the state's, an unknown flow, a `formatVersion` other than `1`, `FAIL` without `--findings`, and no run-mode record. An unresolvable configuration or graph exits 2 with a message. Every non-zero exit names its cause (`.claude/context/conventions.md` → `## Output, logging and errors`).

**Work:**

- [ ] Argument parsing and graph load. The subcommands `start` / `next` / `current` and the flags above, with every flag's value taken as the next argument and nothing else parsed. `start` rejects an `--entry` that is not in `entries`, and defaults to `start`. Load the graph once per call with `jq`, which `doctor`'s `jq` check already guarantees (1.5 or newer). The shebang is `#!/usr/bin/env bash` and the dialect is bash 3.2. Source `lib/harness-run-lib.sh` and `lib/flow-walker-gates.sh` from `${BASH_SOURCE[0]}`'s directory, the resolution `.claude/context/conventions.md` → `## Shared code, and where it lives` requires of a shell asset.
- [ ] State. The file is `<state_dir>/.flow_walker_state`: flat, machine-local, `key=value` lines holding `flow`, `branch`, the pending `node`, `awaiting` (`dispatch` / `answer` / `done`), each counter's value, the pending node's prompt variant, the last findings file and the recorded `report` values. `start` **overwrites** it and resets every counter to 0. That reproduces today's re-entry behaviour: the core sets `iteration = 0` at each loop's start, and nothing persists it across sessions. **Task 16** records the evidence for this. `current` re-prints the pending action and changes nothing, which is the re-issue route for a dispatch that died on an API error and is not an outcome. `next` refuses when there is no state or when the flow or branch does not match. Write the file with a temp-and-`mv` replace so a killed call never leaves it half-written.
- [ ] Transitions.
  - `next` validates `--outcome` against the pending node's `outcomes` keys, or against `answered` while an ask is pending, and follows the edge: apply `reset`, then `increment`; take `onCap` when the counter is `>= cap` after the increment, which is the core's *"increment `iteration`. If `>= 5`, `<escalate>`"*; record `report` and `ledger`; set the next prompt variant from `prompt`; and keep `--findings` as the last findings file.
  - On arrival at any node, evaluate its `skip` array in order. `skipped` applies when `fw_phase_on` returns 1. `passedByExclusion` applies when `fw_id_in_list` finds its id in `fw_run_mode_skipped`'s answer, which is **re-read on every arrival and never cached**, per `plugin/instructions/run_mode_instructions.md` → `## Re-read at the point of use`. An applying entry records its `report`, emits a `skip:` line and moves to its `to`, where the loop continues until a dispatch node that is not skipped, or a binding, is reached. A status-2 phase answer, or a missing run-mode record, is a refusal.
- [ ] Rendering. Resolve `arg.iteration` with `fw_next_review_index` over the node's rendered `findingsFolder` (`{state_dir}` / `{branch}` substituted), never from the counter: the core says *"The `iteration:` argument … is not this counter — never conflate the two"*. The heartbeat's `{iteration}` **is** the counter. Build the escalation lines with `fw_round_count` and `fw_index_evidence`. An `<ask>`'s `answered` re-dispatches its `resume` node with the prompt variant that node last had. Output is exactly the fixed form above, and nothing else goes to stdout.
- [ ] Header. Following `cli/templates/scripts/commit-on-branch.sh`'s shape, open with a `# flow-walker.sh — …` line, then `USAGE`, the fixed output form, the exit codes, the state file and its reset rule, and a `REPRO` block walking one PASS-everywhere pass in a throwaway fixture. The header must say that the walker **routes** and the orchestrator **judges**, and must name the safety contract as deliberately not the walker's.

**Verification:**

- In a throwaway `git init` fixture carrying `harness.config.json` (`phases.parity: true`, `phases.qa: true`), a copy of this script and of the two `lib/` files, and `flows/task_plan_writing.graph.json` beside it, the `REPRO` walk prints a writer dispatch, then parity, architecture and plan-review dispatches each carrying `arg.iteration: 0`, then the UI writer, the UI reviewer, and `binding: <terminal_handoff>` with four `report:` lines. **Tasks 6 and 7** cover every scenario the task prompt lists, against expected sequences taken from the pre-change core.
- `next --outcome no_ui` while the parity reviewer is pending exits 1 with a `flow-walker:` line and leaves `<state_dir>/.flow_walker_state` byte-identical: an undeclared outcome is rejected.
- `bash -n` passes. `grep -n 'declare -A\|mapfile' cli/templates/scripts/flow-walker.sh` finds nothing. None of the three invocation forms carries a construct the script-allowlist guard refuses. Check that by running `plugin/hooks/autonomous-script-allowlist-guard.sh`'s own `REPRO` recipe (`plugin/hooks/README.md` → `## Reproducing a decision by hand`) with each form as the command.
