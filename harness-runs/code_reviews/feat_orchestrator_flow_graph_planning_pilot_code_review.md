# Code Review: feat_orchestrator_flow_graph_planning_pilot

## Context

**Branch:** `feat_orchestrator_flow_graph_planning_pilot`
**Date:** 2026-09-24
**Reviewed:** the whole branch diff against the default branch `dev`, covering all three configured layers. **`cli`:** the walker `cli/templates/scripts/flow-walker.sh`, its gate library `lib/flow-walker-gates.sh`, the planning graph `flows/task_plan_writing.graph.json`, `hr_phase_enabled` in `lib/harness-run-lib.sh`, the three new `OUTER_LOOP_SCRIPTS` rows in `cli/src/generators/outerLoopScripts.ts`, the run-control ignore entry (`.flow_walker_state` added to `RUN_CONTROL_ARTIFACTS` in `cli/src/generators/repoRoot.ts`, with its doc comment amended, and to `.gitignore`), the profile `_README` text, the two walker suites and their shared driver `cli/test/helpers/walker.mjs`, and the `init` and outer-loop test edits. **`plugin`:** the planning core rewritten around `## The walker — routing is its, judgement is yours`, the two planning forks, the two planning commands and `AUTONOMOUS_FLOW.md`. **`general`:** `schemas/flow-graph.schema.json` with its 4 schema negatives and 7 check fixtures, the `schemas/README.md` paragraph on the second schema, the `validate:flow-graph` and `validate:flow-graph:negative` scripts in the root `package.json` (every one of the 7 check fixtures and 4 schema negatives is wired in), `scripts/check-flow-graph.sh`, gate 3c–3f in `scripts/run-gates.sh`, the self-adopted `scripts/` mirrors, `docs/flow-graph-walker.md`, and the `docs/watcher.md`, `docs/cli.md`, `docs/development.md`, `cli/README.md`, `cli/templates/scripts/README.md` and `llms.txt` edits. 24 run-artifact files excluded from the reviewed diff.

**Headline.** The pilot works and keeps the planning loop's behaviour. Checks run for this review:
- `node --test` over `cli/test/flow-walker.test.mjs` and `cli/test/flow-walker-ui-and-reentry.test.mjs`: 21 of 21 pass. Every case the task prompt's item 8 asks for is present.
- `init.test.mjs`, `profile.test.mjs` and `outer-loop-scripts.test.mjs`: 351 of 351 pass.
- `bash scripts/check-flow-graph.sh` and `--negatives`: both exit 0.
- The four `scripts/` mirrors are byte-identical to their templates, and each carries the mode its template's row declares.

The walker was checked by reading it against the pre-change core. It keeps:
- the gate order;
- the shared counter and its `>= 5` cap;
- the UI loop's counter reset;
- run-mode-before-config at the parity gate, and config-before-run-mode at the UI loop;
- the never-back-filled `review_<n>` index;
- `start` resetting the counter on re-entry.

Every invocation form stays a plain literal, and the new `agentInvocable: true` row grants it.

**Outer-loop accompanying set, all three rows.** `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` → *An outer-loop script* asks for a deliberate `agentInvocable`, the profile entries it implies, and a `DENY_SCRIPT_BASENAMES` entry where a row must not be agent-runnable. `flow-walker.sh` is `true`, carries its profile entries, and has no deny entry because the orchestrating session must reach it. The two `agentInvocable: false` rows need no deny entry either. `lib/flow-walker-gates.sh` holds only function definitions: running it through the guard's auto-allow defines `fw_*` functions and exits, so nothing destructive happens. `flows/task_plan_writing.graph.json` is not a `.sh`, so the guard's auto-allow does not apply to it at all. That is the same disposition as the unlisted `lib/harness-run-lib.sh`.

**Lessons ledger — clean pass on the three categories this diff exhibits.** `harness-runs/lessons.md` was read before grading. Each rule was checked at the sites it governs:
- *Adopter-facing documentation — "Every command an adopter is meant to run sits in a fenced block, one command per line".* `docs/development.md` → `**Gate 3 — configuration and flow-graph schemas.**`: the four new commands are added one per line inside the existing fenced block, and the prose after it only refers back to them. `cli/templates/scripts/README.md` (*"**One of them is run by the orchestrating session:**"*), `cli/README.md` (the outer-loop family sentence) and `docs/cli.md` (*"**Two families land in `scriptsDir`…**"*) name `flow-walker.sh` as a file the orchestrating session runs. None of them gives an adopter a command to run. The inline `git` / `wc` forms in `docs/flow-graph-walker.md` → `## 1. The core's size, measured` show how each measurement was produced for a maintainer. They are not steps an adopter runs, and the multi-token `awk` there is fenced anyway. No violation.
- *Adopter-facing documentation — "Name an adopter-facing surface with the term adopters already arrive with".* The adopter never operates *flow walker* or *flow graph*: the orchestrating session runs the walker. In prose the terms are the file and schema identifiers `flow-walker.sh`, `flows/`, `flow-graph.schema.json`, and the rule forbids renaming wire identifiers. *Flow* is the term the adopter-facing `README.md` already uses for the harness's supervised, semi-autonomous and autonomous flows. No violation.
- *Evidence and measurement — "A figure measured under a test stub or a fixture-sized corpus never justifies a design decision".* `docs/flow-graph-walker.md` → `## 1. The core's size, measured` measures the real core, not a fixture. The figures are `git cat-file -s` at merge base `1fd5ce9` (38036) and `wc -c` on the working file (35066), and the per-heading split comes from the fenced `awk` run on the same real file. No design decision rests on a stubbed figure. No violation.
- *Evidence and measurement — "A decision rule's outcome is a proposal to the maintainer".* `docs/flow-graph-walker.md` → `## 4. What a second flow would need before it adopts the walker` opens with "A proposal to the maintainer, not scheduled work". A grep of every added line outside that document for second-flow, adoption, follow-up or TODO wording finds only the neutral `llms.txt` description line, so the proposal is not written into any other document as pending work. No violation.

`phases.parity` is `false`, so no parity cross-check ran and the call-out section is empty. Pass 0's grep half has no regexes configured. Its caller check found a caller for every new function: `hr_phase_enabled` ← `fw_phase_on` ← the walker, every `fw_*` function ← the walker, the walker ← the core's `## The walker`, and the checker ← `scripts/run-gates.sh`. Pass 2 had nothing to reconcile: the per-unit findings root does not exist, because this flow runs with per-unit review off.

The five findings below are all prose or data out of step with the code or with the rewritten core. None of them changes routing.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix lands. Each entry resolves to `harness-runs/code_reviews/feat_orchestrator_flow_graph_planning_pilot_code_review/finding_<K>.md`.

1. [x] **Finding 3** — State in the flow-graph schema that `roundCounts` names dispatch nodes, not report slots _(layer: general)_
2. [ ] **Finding 2** — Move the `no_ui` short-circuit and the `phases.qa` gate to the planning graph in both planning forks' "does NOT redefine" lists _(layer: plugin)_
3. [ ] **Finding 1** — Repoint the core's `## Setup` step 2 "reached only when" parentheticals at the graph's skip gates _(layer: plugin)_
4. [ ] **Finding 5** — Drop `## Loop` steps 2 and 3 from the `<escalate>` sites in the core's bindings table and the autonomous fork's `<escalate>` row _(layer: plugin)_
5. [ ] **Finding 4** — Cite the planning core as `${CLAUDE_PLUGIN_ROOT}/…` in the shipped graph's `description`, and in its mirror and fixture copies _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `## Setup` step 2 sends a reader to `## Loop` step 2 and `## UI-test-plan write loop` for their phase gates, and neither section states one any more
→ [finding_1.md](feat_orchestrator_flow_graph_planning_pilot_code_review/finding_1.md)

### 2. Both planning forks say the `no_ui` short-circuit and the `phases.qa` gate are canonical in the core, but the graph owns them now
→ [finding_2.md](feat_orchestrator_flow_graph_planning_pilot_code_review/finding_2.md)

### 3. The flow-graph schema says `roundCounts` names report slots, but the walker reads each entry as a node id
→ [finding_3.md](feat_orchestrator_flow_graph_planning_pilot_code_review/finding_3.md)

### 4. The shipped planning graph names a `plugin/` path. The checker's header says the design avoids exactly that, and every other template cites the plugin through `${CLAUDE_PLUGIN_ROOT}`
→ [finding_4.md](feat_orchestrator_flow_graph_planning_pilot_code_review/finding_4.md)

---

## Nice to Have

### 5. The `<escalate>` sites still list `## Loop` steps 2 and 3, which now only pass their verdict to step 5
→ [finding_5.md](feat_orchestrator_flow_graph_planning_pilot_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are not fixes and are not in the Phase 2 Readiness list. `phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section is empty.
