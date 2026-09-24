# The flow-graph walker — the planning pilot's decisions and measurements

**Who reads this:** a maintainer deciding whether a second orchestrated flow adopts the walker, or debugging a planning run's routing.

**What it owns.** The decisions of record for the pilot that moved the task-plan-writing loop's **routing** out of `plugin/instructions/task_plan_writing_instructions_core.md` and into a declared graph, `cli/templates/scripts/flows/task_plan_writing.graph.json`, walked by `cli/templates/scripts/flow-walker.sh`; and the core's measured size before and after. It does not restate how to call the walker (its own header, and the core's `## The walker — routing is its, judgement is yours`), the graph's shape (`schemas/flow-graph.schema.json`), the static checks (`scripts/check-flow-graph.sh` → `THE CONTRACT`) or the outer-loop file table (`docs/watcher.md` → `## 2. The scripts`).

---

## 1. The core's size, measured

Measured on the real file, never on a fixture. The baseline is commit `1fd5ce9`, the branch's merge base with `main` (`git merge-base main HEAD`); the core last changed on this branch in `1c38ba3` (`git log --format='%h %s' 1fd5ce9..HEAD -- plugin/instructions/task_plan_writing_instructions_core.md`).

| When | Command | Exact output |
|---|---|---|
| Before | `git cat-file -s 1fd5ce9:plugin/instructions/task_plan_writing_instructions_core.md` | `38036` |
| After | `wc -c plugin/instructions/task_plan_writing_instructions_core.md` | `   35066 plugin/instructions/task_plan_writing_instructions_core.md` |

The core is 2970 bytes smaller. That is the net of two movements, and the gross split matters more than the net. Bytes per heading, each line counted up to the next line that starts with `#`, from this command on the working file (for the baseline, pipe `git show 1fd5ce9:plugin/instructions/task_plan_writing_instructions_core.md` into the same `awk`):

```
LC_ALL=C awk '/^#/{h=$0} {if(!(h in b))k[++n]=h; b[h]+=length($0)+1} END{for(i=1;i<=n;i++)printf "%6d  %s\n",b[k[i]],k[i]}' plugin/instructions/task_plan_writing_instructions_core.md
```

| Heading | Before | After |
|---|---|---|
| `# Task-plan writing loop — core (mode-free)` | 688 | 688 |
| `## Resolved values` | 1724 | 1887 |
| `## Mode contract — bindings this file uses` | 2480 | 2686 |
| `## Setup (once per session)` | 5301 | 5657 |
| `## The walker — routing is its, judgement is yours` | — | 3411 |
| `## Safety contract — applies before EVERY Agent dispatch` | 3011 | 3308 |
| `## Loop` | 1260 | 437 |
| `` ### 1. Spawn `task-plan-writer` `` | 1384 | 1473 |
| `### 2. Business-parity review (plan-review mode)` | 3239 | 940 |
| `### 3. Architecture review (plan-review mode)` | 2805 | 797 |
| `` ### 4. Spawn `task-plan-reviewer` `` | 542 | 395 |
| `### 5. Parse the reviewer's return` | 736 | 511 |
| `## UI-test-plan write loop` | 950 | 348 |
| `` ### 1. Spawn `ui-tests-plan-writer` `` | 2645 | 2052 |
| `` ### 2. Spawn `ui-tests-plan-reviewer` `` | 1665 | 1368 |
| `### 3. Parse the reviewer's return` | 455 | 156 |
| `## Convergence` | 5364 | 5390 |
| `## Stop conditions` | 1432 | 967 |
| `## What you must NOT do` | 2355 | 2595 |

**Where prose left.** The routing sections: `## Loop` and its five steps, the UI-test-plan loop and its three steps, and `## Stop conditions`. What went is the gate order, the fall-through and loop-back sentences, the counter and its cap, both skip semantics and the per-folder `iteration:` derivation.

**Where prose stayed or grew.** Every non-routing rule stayed beside the node it governs: the dispatch blocks, path-only discipline, the `## Questions` verbatim rule, the writer's `## Parity exclusions / deferrals` return, the dispatch discipline, the disclosure lines, `## Convergence` and `## What you must NOT do`. The new `## The walker` section, `## Setup` step 7 and the `<scripts_dir>` row are new text the walker costs.

**What these figures do not count.** The orchestrator now also reads each walker call's printed output, once per call; that read is not in the figures above and was not measured on a real run. The graph is read by the walker through `jq`, never by the orchestrator: `wc -c cli/templates/scripts/flows/task_plan_writing.graph.json` prints `    7075 cli/templates/scripts/flows/task_plan_writing.graph.json`, and none of it enters the orchestrator's context.

---

## 2. The decisions

Each one restates an outcome the tasks that built it settled, with its reason and its cost.

### Item 2 — each node's dispatch block stays in the core

**Decision.** The agent name and argument lines of every dispatch stay in the core's `## Loop` and `## UI-test-plan write loop` steps. The walker supplies values, never lines: `arg.iteration`, `arg.findings_file` and the prompt variant (`prompt: initial` or `revision`), per the core's `## The walker` → **`action: dispatch`**.

**Reason.** The block's key names are wire strings the six planning agents' `## Invocation contract` sections quote (`plugin/agents/task-plan-writer.md`, `task-plan-reviewer.md`, `business-parity-reviewer.md`, `architecture-reviewer.md`, `ui-tests-plan-writer.md`, `ui-tests-plan-reviewer.md`). Moving them into the graph would move a contract those agents cite into a file they cannot cite.

**Cost.** Each gate's findings folder is written twice: in the graph's `findingsFolder` and in the core's `## Setup` step 2 table. That duplication is held by `scripts/check-flow-graph.sh` → `findings-folder-in-core`.

### Item 3a — walker state is machine-local, and re-entry resets it

**Decision.** The walker's state lives at `<state_dir>/.flow_walker_state`, ignored beside `.dispatch_counter` (`cli/src/generators/repoRoot.ts` lists both; this checkout's `.gitignore` carries both). It is never a second phase record: the flow-progress ledger stays the only durable one. `start` overwrites it and resets every counter to 0 (`flow-walker.sh` → the header's `STATE` paragraph).

**Reason.** That reproduces what re-entry does today. The pre-change core opened its loop with *"`iteration = 0`. Loop:"* (`git show 1fd5ce9:plugin/instructions/task_plan_writing_instructions_core.md` → `## Loop`), and held the counter only in context. A resumed session re-entered through `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` case (a), *"Then continue the loop normally from that point"*. So `iteration` restarted at 0 while each findings folder's `review_<n>.md` series continued.

**Evidence.** `cli/test/flow-walker-ui-and-reentry.test.mjs` → case `(6) re-entry mid-loop restarts the counter and continues the findings folder`: after `start` again, the heartbeat's counter is 0 and the architecture gate's `arg.iteration` is 1, because `review_0.md` is on disk.

**Cost.** A counter that survives a session boundary would need the ledger or a second record; the pilot deliberately has neither, because today's loop has neither.

### Item 4 — STOP, the counter and PAUSE stay orchestrator steps

**Decision.** The STOP check, the `.dispatch_counter` increment and, in the autonomous fork, the PAUSE check stay in the core's `## Safety contract — applies before EVERY Agent dispatch`. The walker's heartbeat carries the literal slot `(#<total_dispatches>)` for the orchestrator to fill (`flow-walker.sh` → `THE SAFETY CONTRACT IS DELIBERATELY NOT THE WALKER'S`).

**Reason.** The autonomous fork's PAUSE check sits **between** STOP and the increment (`task_plan_writing_instructions_autonomous.md` → `## Override 5 — pause/resume + flow-progress ledger (planning half)`, *"immediately after it"*), and it carries a judgement: pausing at the next clean tracked-tree boundary. Moving its two neighbours into the walker would either reorder STOP and PAUSE, which is a behaviour change, or need a new mode binding for PAUSE, which the task prompt's item 5 rules out by freezing the forks' binding tables. The halt messages also name `<reentry_command>`, a binding the walker must not resolve.

**Cost.** The "two separate, plain commands exactly as written" rule for the increment stays prose an agent follows, not code.

### Item 6 — the walker and graph ship into `scriptsDir`, and the graph is found beside the walker

**Decision.** `flow-walker.sh`, `lib/flow-walker-gates.sh` and `flows/task_plan_writing.graph.json` ship from `cli/templates/scripts/` into the adopter's `scriptsDir`. The walker's row in `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS` is `agentInvocable: true`, so the autonomous profile grants it. The walker finds its graph **beside itself** by flow id, at `<this script's dir>/flows/<flow>.graph.json`; no path is passed.

**Reason.** Every invocation stays one plain literal command, which the permission profile can grant and the script-allowlist guard does not withhold. And the orchestrator never has to resolve the plugin root, which `docs/development.md` → `## 2. The one authoring rule that follows` records a real orchestrator doing by hand, with `find`, after its own `${CLAUDE_PLUGIN_ROOT}` citations were refused.

**Cost.** An adopter's copies are written `create-if-absent` (`outerLoopScripts.ts` → the re-run contract), so they lag a plugin upgrade until `init` is re-run. A missing walker is a loud non-zero exit, which the core's `## The walker` routes to `<escalate>` with `bash`'s own line. A `lib/harness-run-lib.sh` kept from an `init` that predates the walker is kept by that same `create-if-absent` contract. The walker refuses it at `start` with a line naming the file and the remedy: delete it and re-run `init`.

### The iteration cap — the graph owns it, the core keeps two descriptions held by a check

**Decision.** `counters.iteration.cap` in `cli/templates/scripts/flows/task_plan_writing.graph.json` owns the cap. The core keeps two descriptions of it, byte-identical to the merge base: `## Setup (once per session)` step 4's sizing sentence (*"`iteration >= 5` caps"* … *"caps at 5 revisions"*, from which `MAX_TOTAL_DISPATCHES = 40` is sized) and `## Safety contract` step 2's halt message (*"5-revision caps"*).

**Reason.** Step 4 is cited from `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`, and the task prompt freezes the halt messages (`harness-runs/task_plans/feat_orchestrator_flow_graph_planning_pilot/task_9_plan.md`, the bullet keeping step 4's sizing sentence as a retained **description**).

**Cost, and how it is guarded.** That is a duplication, so it is checked rather than accepted: `scripts/check-flow-graph.sh` → `THE CONTRACT` item 7, `cap-matches-core`, fails when the graph's cap and any of the three phrases disagree, or when a phrase no longer yields a number. Changing the cap is still a three-place edit (the graph and both core sentences) plus a re-sizing of `MAX_TOTAL_DISPATCHES`, which no check derives.

### The runtime — bash 3.2 and `jq` 1.5

**Decision.** The walker and its gate library are bash with a 3.2 floor and `jq` 1.5 (`flow-walker.sh` → `BASH 3.2 AND JQ 1.5 ARE THE FLOORS`).

**Reason.** That is what an adopter's unattended run already has: `doctor`'s `jq` check fails a `jq` older than 1.5 (`cli/src/doctor/checks.ts` → `JQ_CHECK`), and the shared library every outer-loop script sources already holds the same bash floor (`cli/templates/scripts/lib/harness-run-lib.sh` → `BASH 3.2 IS THE FLOOR`). So the walker needs no new `doctor` check.

---

## 3. Three findings established rather than assumed

- **The supervised `/autonomous-sdlc-harness:branch-start-plan` does not reach the core.** `plugin/commands/branch-start-plan.md` names no instruction file (`grep -n "instructions/" plugin/commands/branch-start-plan.md` prints nothing), so it was left untouched.
- **No planning agent quotes the core's routing as its own rule.** Each of the six cites a heading the rewrite preserved (`harness-runs/story_plans/feat_orchestrator_flow_graph_planning_pilot_story_plan.md` → `## Scope register`, rows 12–17), and every wire string they return — `verdict: PASS`, `no_ui: true`, `## Questions` and the rest — is unchanged.
- **The run-mode precedence at the parity gate is the core's textual order: run mode before config.** The pre-change `### 2. Business-parity review (plan-review mode)` opens on *"Before anything else in this step, re-read the run mode"* and only then states *"Skip this gate unless `phases.parity` is `true`"*. `cli/test/flow-walker.test.mjs` → case `(6) with both parity switches off, passed-by-exclusion wins` pins it.

---

## 4. What a second flow would need before it adopts the walker

A proposal to the maintainer, not scheduled work. Every other orchestrated loop was out of the pilot's scope, and none is a candidate until the pilot is judged (`harness-runs/task_prompts/feat_orchestrator_flow_graph_planning_pilot_task_prompt.md` → `## Out of scope`). A flow that adopts the walker would need:

- **its own graph**, and a flow-id row in `scripts/check-flow-graph.sh` → `core_for_flow`;
- **any outcome or construct the format lacks today** — for example the per-unit loop's iteration over a readiness list;
- **its own ledger template's ids for `ledger-id-known`**, which reads only the task-engine template today;
- **its own safety-contract decision**, since item 4's reasoning rests on this flow's STOP / PAUSE / increment order;
- **scenario tests derived from its pre-change prose**, as `cli/test/flow-walker.test.mjs` and `cli/test/flow-walker-ui-and-reentry.test.mjs` were, never from the graph.
