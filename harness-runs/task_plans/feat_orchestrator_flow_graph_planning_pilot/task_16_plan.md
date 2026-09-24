### Task 16 — Record the pilot's decisions and measurements in `docs/flow-graph-walker.md`

**Goal:** Put acceptance item 6 on record in the one place this repository's conventions send a decision of record, `docs/` (`.claude/context/conventions.md` → `### Where a new responsibility goes`). The record covers:

- the planning core's size before and after, measured;
- the decisions for items 2 (the dispatch block's home), 3a (walker state and re-entry), 4 (the safety contract) and 6 (placement and how the graph is found);
- the runtime choice;
- the three "establish, do not assume" findings;
- what a second flow would need before it adopts the walker.

Also name the walker in `docs/cli.md`'s outer-loop family and link the new document from `llms.txt`.

**Depends on:** Task 9, Task 13, Task 14 and Task 7.

- **Task 9** rewrites `plugin/instructions/task_plan_writing_instructions_core.md`. It keeps every heading, adds `## Setup` step 7 and `## The walker — routing is its, judgement is yours`, and leaves STOP, the counter and the heartbeat's count slot with the orchestrator.
- **Task 14** wires gates 3c–3f.
- **Task 13**'s `scripts/check-flow-graph.sh` defines seven check ids in its `THE CONTRACT`, including `cap-matches-core`, which compares the graph's `counters.iteration.cap` with the integers in the core's `## Setup` step 4 sizing sentence and `## Safety contract` step 2 halt message. Its fixtures live in `schemas/flow-graph-check/` (Task 12), apart from the schema negatives in `schemas/negative/`.
- **Task 7**'s case (6) is the executable evidence for the re-entry rule: `start` resets every counter to 0, and the per-folder review index continues.

The facts this document records are these tasks' facts. It restates their outcomes and cites them by path and anchor. It does not re-decide them.

**Where this task stops.** The *what a second flow would need* section is a **proposal to the maintainer**, not deferred work. Per the lessons ledger (*"A decision rule's outcome is a proposal to the maintainer, not a settled future … never write the change into other documents as pending work"*), it adds no `docs/development.md` → `## 6` roadmap row and no pending-work line anywhere else.

### Targets

- `docs/flow-graph-walker.md` (new)
- `docs/cli.md`: the paragraph opening *"**Two families land in `scriptsDir`, and only one of them is generated.**"*
- `llms.txt`: one entry in the docs list

**Work:**

- [ ] **Open `docs/flow-graph-walker.md` and record the measurement.** It opens with a `**Who reads this:**` statement, *a maintainer deciding whether a second orchestrated flow adopts the walker, or debugging a planning run's routing*, and says what it owns (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, the `docs/` row).
  - Record the size as a measured fact: what was measured, the command, and the exact output (`## Documents of record`).
  - Before: `git cat-file -s <merge-base>:plugin/instructions/task_plan_writing_instructions_core.md`, which printed `38036` at planning.
  - After: `wc -c plugin/instructions/task_plan_writing_instructions_core.md`.
  - Be honest about the split: which sections lost prose and which kept it, the non-routing rules being the latter. Say that the orchestrator now also reads each walker output per call, and that the graph itself is read by the walker, not by the orchestrator. No figure measured on a fixture stands in for the real file (lessons ledger, *Evidence and measurement*).
- [ ] **The decisions, each with its reason and its cost.**
  - **Item 2: the dispatch blocks stay in the core.** The key names are wire strings the six planning agents' `## Invocation contract` sections quote. The walker supplies values (`arg.iteration`, `arg.findings_file`, the prompt variant), never lines. The findings-folder duplication with the graph is held by `findings-folder-in-core`.
  - **Item 3a: walker state is machine-local** at `<state_dir>/.flow_walker_state`, ignored beside `.dispatch_counter`, and never a second phase record: the ledger stays the only durable one. `start` resets it. Why that reproduces today's re-entry: the core's *"`iteration = 0`. Loop:"*, the counter held only in context, and Override 2(a)'s *"continue the loop normally"*. Task 7 case (6) is the evidence.
  - **Item 4: STOP, the counter and PAUSE stay orchestrator steps.** The autonomous fork's PAUSE check sits **between** STOP and the increment, and it carries a judgement (the tracked-tree inspection). So moving its two neighbours would either reorder STOP and PAUSE, a behaviour change, or need a new mode binding, which item 5 forbids the forks' tables. The halt messages also name `<reentry_command>`, a binding the walker must not resolve.
  - **Item 6: the walker and graph ship from `cli/templates/scripts/` into `scriptsDir`,** granted as an `agentInvocable` outer-loop row. The graph is found **beside the walker** by flow id, not passed as a path. That keeps every invocation a plain literal and spares the orchestrator a plugin-root resolution `docs/development.md` → `## 2. The one authoring rule that follows` records as done by hand. The cost: an adopter's copies are `create-if-absent`, and they lag a plugin upgrade until `init` is re-run. A missing walker is a loud non-zero, which the core routes to `<escalate>`.
  - **The iteration cap's owner is the graph; the core keeps two descriptions of it, held by a check.** `counters.iteration.cap` in `cli/templates/scripts/flows/task_plan_writing.graph.json` owns the cap. The core's `## Setup` step 4 sizing sentence (*"`iteration >= 5` caps … caps at 5 revisions"*, from which `MAX_TOTAL_DISPATCHES = 40` is sized) and its `## Safety contract` step 2 halt message (*"5-revision caps"*) stay byte-identical: step 4 is cited from `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`, and the task prompt freezes the halt messages. That is a duplication, so it is guarded rather than accepted: `scripts/check-flow-graph.sh` → `cap-matches-core` fails when the graph's cap and either core statement disagree, or when either statement no longer yields a number. The cost: changing the cap is a three-place edit (the graph and both core sentences) plus a re-sizing of `MAX_TOTAL_DISPATCHES`, which no check derives. Cite Task 9's retained-descriptions bullet and Task 13's check definition.
  - **The runtime: bash 3.2 and `jq` 1.5.** These are what `doctor`'s `jq` check already guarantees, so no new `doctor` check.
- [ ] **The three "establish, do not assume" findings.**
  - The supervised `/autonomous-sdlc-harness:branch-start-plan` does not reach the core: `plugin/commands/branch-start-plan.md` names no instruction file.
  - No planning agent quotes the core's routing as its own rule. Each cites a preserved heading, and every returned wire string is unchanged.
  - The run-mode precedence at the parity gate is the core's textual order, run mode before config, pinned by Task 6 case (6).
- [ ] **What a second flow would need before it adopts the walker, stated as a proposal to the maintainer:**
  - its own graph, and a flow id row in `scripts/check-flow-graph.sh`'s core table;
  - any outcome or construct the format lacks today, for example the per-unit loop's readiness-list iteration;
  - its own ledger template's ids for `ledger-id-known`, which reads only the task-engine template today;
  - its own safety-contract decision;
  - scenario tests derived from its pre-change prose.
- [ ] **`docs/cli.md` and `llms.txt`.** In `docs/cli.md`'s two-families paragraph, add the walker to the outer-loop enumeration, and add it to the agent-invocable list with the reason (*run by the orchestrating session on the unattended planning path*). Add `- [docs/flow-graph-walker.md](https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/flow-graph-walker.md): …` to `llms.txt`, after the `docs/outer-loop-verification.md` entry, in that list's one-line style.

**Verification:**

- `bash scripts/check-llms-txt.sh` exits 0. The new link resolves because the file is tracked and no `removed_paths` entry covers `docs/`.
- `bash scripts/check-command-spelling.sh` exits 0, with every slash command in its prefixed form. Gate 6a finds no machine path in the new document.
- Every figure in the document carries its command and output, and every decision cites the file and anchor it rests on.
- `git grep -n "second flow" docs/development.md ROADMAP.md` finds nothing this task added: the proposal stays in its own document.

**Deviations from plan:**

- `bash scripts/check-llms-txt.sh` was run before commit and exited 1 with `'docs/flow-graph-walker.md' is not a tracked file` (the same finding as gate 6c in `bash scripts/test.sh`); the implementer does not stage files, so the exit-0 claim rests on the check's own tracked-file rule and is met only once the committer stages the new file. Re-run it after the commit.
- The honest-split paragraph publishes a per-heading byte table measured by an `awk` command stated in the document, in addition to the two whole-file figures the plan names.
