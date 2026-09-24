# Architecture review — iteration 1

Both iteration-0 Must Fix findings are resolved in the plan:
- The check fixtures now live in `schemas/flow-graph-check/` (Task 12). Task 13's `--negatives` reads only that directory, and Task 13's verification greps for `schemas/negative` and expects no hit.
- The core's two retained cap descriptions are now named as descriptions of the graph's cap (Task 9). They are exempted from the routing grep, held by `cap-matches-core` (Task 13 with its Task 12 fixture), and recorded by Task 16.

## Must Fix

1. **`<scripts_dir>` enters two command files whose `## Resolved values` tables do not declare it for this use** — `task_11_plan.md`. Rule source: `.claude/context/plugin.md` → `## The sections an asset carries`: *"Every agent, command and instruction file an asset loads carries a `## Resolved values` table, declaring each configuration- or runtime-derived token once, ahead of the body that uses it as an ordinary placeholder."* See also `## The placeholder vocabulary` (*"A token that resolves from somewhere else needs a class stated, not a blank cell"*).
   Task 11's Goal and Work have all three targets say the routing and caps *"are walked by `<scripts_dir>/flow-walker.sh` over the planning graph"*. The two command files have a problem with that:
   - `plugin/commands/branch-start-plan-semi-autonomous.md` → `## Resolved values` declares only `<state_dir>` and `<parity_vocabulary>` / `<reference_impl>`. It has **no** `<scripts_dir>` row, and the file uses the token nowhere today. The split step-3 sentence Task 11 prescribes would bring in an undeclared config token.
   - `plugin/commands/branch-start-plan-autonomous.md` → `## Resolved values` does declare `<scripts_dir>`, but its cell pins the file's use of it: *"This file names two of them — `autonomous-watcher.sh`, … and `push-branch.sh`, … — and invokes neither."* Naming the walker in step 5 and the `**Planning**` bullet makes that cell false.

   Task 10 has the same exposure for `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md`. That fork's table also has no `<scripts_dir>` row, and "make the same two corrections" as the autonomous fork invites the same `<scripts_dir>/flow-walker.sh` spelling. (`plugin/docs/AUTONOMOUS_FLOW.md` and the autonomous fork already declare the token, and Task 9 adds it to the core, so those are fine.)

   **Fix:** In `task_11_plan.md`, add both `## Resolved values` tables to Targets:
   - For `branch-start-plan-semi-autonomous.md`, add a `<scripts_dir>` row (`config value`, `scriptsDir`) that states this file names the walker and the graph as the owners of the loop's routing and invokes neither.
   - For `branch-start-plan-autonomous.md`, amend the existing `<scripts_dir>` cell so it also names `flow-walker.sh` and `flows/task_plan_writing.graph.json`, still invoked by neither.
   - Add a verification line: every file Task 11 writes `<scripts_dir>` into has a `<scripts_dir>` row in its `## Resolved values`.

   In `task_10_plan.md`, do one of two things for the semi-autonomous fork. Either say its `## What this fork does NOT redefine` corrections name "the planning graph" and "the walker" without the `<scripts_dir>` path, or add the same `<scripts_dir>` row to its `## Resolved values` table and list that table under Targets.

## Should Fix

1. **The outer-loop table's own header and doc comments still go false when a data file and a second library join it** — `task_5_plan.md`, carried from iteration 0 and still unaddressed. Rule source: `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header … the change either satisfies it or amends the header in the same edit."* Task 5 amends only the `agentInvocable` doc comment. `cli/src/generators/outerLoopScripts.ts` also states things the new rows make false:
   - the module header's *"the shared library they all source"* and *"Every one of these scripts reads `<repo_root>/harness.config.json` at run time through the one shared library"*;
   - `OUTER_LOOP_SCRIPTS`'s *"the shared library first, because every other row sources it"*;
   - the `subdir` comment: *"Absent means directly in `scriptsDir`, which is where every *invoked* script lives"*;
   - the `mode` comment: `0o644` is *"for one that is only ever sourced"*.

   The JSON graph is neither sourced nor run, and it also gets a meaningless `invocation` in `written`. Add those sites to Task 5's Targets and amend them in the same edit. The re-run policy for the graph also needs stating: `cli/src/core/writer.ts`'s re-run-contract table names "wrapper scripts" but no outer-loop row and no data file (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, row *A generated or copied artifact*). The module header's *"verbatim copies … `create-if-absent`"* is the only statement of that policy, so either extend it to cover a `flows/` data row or add the row to the writer table.

2. **The walker's reverse-direction reads of plugin-owned shapes are not recorded where a renamer would find them** — `task_3_plan.md` and `task_16_plan.md`, carried from iteration 0. Rule sources: `.claude/context/conventions.md` → `### The order files are created…` (*"`grep -rn` the exact string across `plugin/`"*) and `.claude/context/plugin.md` → `## The placeholder vocabulary` (*"Changing a shape is a change to every reader of it, inside this tree and outside it"*). `fw_run_mode_skipped` and `fw_index_evidence` key on literals whose owners are plugin documents:
   - the ledger's `## Run mode` block and its `- skipped: ` line (owned by `plugin/instructions/autonomous_pause_and_ledger.md`, per `run_mode_instructions.md` → `## The durable record`);
   - `## Rejected findings`, `## Scope register` and the `call stands` marker (`plugin/agents/task-plan-writer.md`);
   - the `review_<n>.md` naming.

   These reads sit under `cli/templates/`, so the prescribed `grep -rn … plugin/` sweep never reaches them, and Task 13 guards none of them. Have Task 3's header list each keyed-on literal with its owning file and anchor. Have Task 16's decision record name this cli-reads-plugin dependency and which of these literals no check holds.

3. **The new schema's negatives are wired outside the chain the conventions document names** — `task_12_plan.md` / `task_14_plan.md`, carried from iteration 0. `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` names `package.json` → `validate:config:negative` as the assertion for a negative schema fixture. Task 12 uses a new `validate:flow-graph:negative`, which Task 14's arm 3d runs. The wiring meets the rule's purpose (a fixture no assertion wires in is never run), but it departs from the written text. Raise it as a `stale-rule` entry for a supervised `/harness-analyze` re-run, as that document prescribes, and record it in the task's notes.

## Nice to Have

- `task_9_plan.md`: the core's `### 5.` / UI `### 3.` text says a `ledger:` line is *"the fork's to act on and a no-op where no ledger is kept"*. That keeps the P1/P2 flip with the autonomous fork, which owns it today: the core currently names no ledger id. Keep the wording that way, so the core never gains a ledger step that one mode deletes (`plugin/instructions/mode_contract.md` rule 4, as restated in `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`).
