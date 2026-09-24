`feat_orchestrator_flow_graph_planning_pilot` replaces the routing prose of the planning loop with a declared
**flow graph** and a small **walker** script. The orchestrator still runs the loop, inside the same Claude Code
session and on the same subscription, but it no longer works out the next step by reading prose. It calls the
walker, which reads the graph and prints the next step. The pilot covers one flow, task-plan writing, and changes
none of its behaviour.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

---

## Why

`chore_withdraw_second_runtime_port` concluded that the harness's orchestrator-walked loop beats a port to a graph
runtime such as LangGraph. The reasons were billing, the progress ledgers the harness already has, and the
orchestrator's judgment under the dispatch discipline. That decision named one weakness it did not fix: **routing
is enforced by prose that an agent follows, not by code.**

`plugin/instructions/task_plan_writing_instructions_core.md` → `## Loop` states the planning state machine in
sentences:

- the gate order;
- a FAIL from any gate goes back to the writer, and every gate runs again;
- one `iteration` counter is shared across all gates, capped at 5;
- two different skip semantics;
- the `## Questions` route;
- the escalation payload;
- the per-folder `iteration:` argument, which "is not this counter — never conflate the two".

The orchestrator has not been seen to misroute. But this prose costs tokens every session, nothing checks it
mechanically, and it can drift from the ledger template it has to agree with.

The pilot moves **routing** into code and leaves **judgment** with the orchestrator:

- **The walker owns:** the next node, the counters, the cap, and what escalates.
- **The orchestrator owns:** dispatching agents, passing the reviewer's verdict to the walker, applying the
  mode-contract bindings (`<ask>`, `<escalate>`, `<terminal_handoff>`, …), and composing dispatch prompts under
  `plugin/instructions/dispatch_discipline_instructions.md`, including the `context_notes:` line when an agent's
  return affects the next agent's work. A graph runtime cannot do that last part, and it is why the orchestrator
  stays.

## The loop being modelled (as it stands on 2026-09-24)

From `task_plan_writing_instructions_core.md`. Treat the file, not this summary, as the authority:

- **`## Loop`:** `task-plan-writer` → business-parity gate → architecture gate → `task-plan-reviewer`.
  - Any `verdict: FAIL` increments `iteration` and loops back to the writer with the revision prompt. Every gate
    then runs again.
  - `iteration >= 5` → `<escalate>`, carrying the latest findings path, each gate's own round count
    (`ls <findings_folder> | grep -c '^review_'`), which gate was open, and the story index's
    `## Rejected findings` / `## Scope register` evidence where present.
- **Two skip semantics, which must stay distinct:**
  - **Skipped:** `phases.parity: false` means the gate records no pass and reports none at convergence.
  - **Passed by exclusion:** a run-mode skip (`parity` or `architecture` among the durable record's skipped ids,
    `plugin/instructions/run_mode_instructions.md` → `## The closed directive set`) falls through exactly as a
    PASS does, and is disclosed at convergence.
  - The run mode is **re-read at the point of use**, at each gate.
- **Writer `## Questions`** → `<ask>` verbatim, then re-dispatch the writer with the answers.
- **`error:` or `blocker:`** from any agent → `<escalate>`.
- **`## UI-test-plan write loop`:**
  - `ui-tests-plan-writer` → `ui-tests-plan-reviewer`, with `iteration` reset and the same cap.
  - `no_ui: true` short-circuits it.
  - It never runs when `phases.qa` is `false` or `qa` is a skipped run-mode id.
- **`## Safety contract`:** STOP check, then the `.dispatch_counter` increment against `MAX_TOTAL_DISPATCHES = 40`,
  then the heartbeat, then composing the prompt. The autonomous fork folds a PAUSE check in after STOP
  (`plugin/instructions/autonomous_pause_and_ledger.md` §2.2).
- **`## Convergence`:** both loops done, followed by the dispatch-additions record, then `<terminal_handoff>`. The
  autonomous fork flips `P1` and `P2` in the flow-progress ledger (`autonomous_pause_and_ledger.md` §1.3 task-engine
  template).

## What to deliver

1. **A flow-graph format.**
   - Declarative, machine-readable, with a JSON schema under `schemas/` (named per `.claude/CLAUDE.md`'s file
     naming table) and negative fixtures under `schemas/negative/`.
   - It must be able to express everything above:
     - nodes that dispatch an agent;
     - the outcomes each node declares (`PASS`, `FAIL`, `questions`, `no_ui`, `error`/`blocker`);
     - edges on those outcomes;
     - a counter a FAIL edge increments, a cap on it, and a reset point;
     - both skip semantics as separate constructs, one gated on a `harness.config.json` phase flag and one on a
       run-mode id;
     - terminal edges that name a mode-contract binding (`<ask>`, `<escalate>`, `<terminal_handoff>`) without
       resolving it. Resolving bindings stays the fork's job, per `plugin/instructions/mode_contract.md`.
2. **The planning graph.** The two loops and convergence of `task_plan_writing_instructions_core.md` written in
   that format. Decide whether each node's dispatch block (agent name plus its argument lines) moves into the graph
   or stays in the core. Either way it must have exactly one home, and you should record why you chose it.
3. **The walker.**
   - A script the orchestrator calls with the graph, the branch and the outcome of the node that just ran. It
     prints the next action in a fixed, line-oriented form the orchestrator acts on: dispatch this agent with these
     arguments and this heartbeat, or take this binding with this payload.
   - It resolves each gate's `iteration:` argument (the next free `review_<n>` index per findings folder), applies
     both skip semantics, increments and caps the counter, and assembles the escalation payload.
   - It rejects an outcome the current node does not declare.
   - It prints nothing to be interpreted beyond its own fixed form.
3a. **Walker state.**
   - The walker's own state (current node, the shared `iteration`) is machine-local under `<state_dir>/`, next to
     `.dispatch_counter` and like it never committed.
   - The flow-progress ledger stays the only durable record of phase progress. The walker never becomes a second
     one.
   - Establish what the loop does with `iteration` on re-entry today (the autonomous fork's
     `## Override 2 — resumability`), and have the walker reproduce exactly that.
4. **The safety contract.** Decide whether the dispatch-counter increment and the STOP (and, in the autonomous
   fork, PAUSE) checks move into the walker or stay orchestrator steps. Moving them is attractive, because it turns
   the "two separate, plain commands exactly as written" rule into code. The halt messages and their
   plain-report-not-escalation semantics must not change. Record the decision.
5. **The core rewritten around the walker.**
   - `## Loop`, `## UI-test-plan write loop` and the routing parts of `## Convergence` and `## Stop conditions`
     become: call the walker, do what it prints, pass back the outcome.
   - Every rule that is not routing stays in prose next to the node it governs. That includes path-only
     discipline, the `## Questions` verbatim rule, the writer's `## Parity exclusions / deferrals` return, the
     dispatch discipline, the disclosure lines and `## What you must NOT do`.
   - The semi-autonomous and autonomous forks keep their binding tables. Change them only where they cite a core
     anchor this rewrite moves.
   - Re-derive every file that cites the moved anchors:
     `grep -rn "task_plan_writing_instructions_core" plugin cli/templates`.
6. **Allow-listing, so an unattended run can call the walker.** Place the walker where the autonomous permission
   profile can grant it as a literal. The profile's entries cannot name a path through `${CLAUDE_PLUGIN_ROOT}`
   (`ARCHITECTURE.md` §6, the permission-model paragraph). The generated wrapper scripts under `scriptsDir` are the
   precedent: `commit-on-branch.sh` is granted in `cli/templates/claude/settings.autonomous.json`. Add the entry
   through `cli/src/generators/permissionProfile.ts`'s template, and add this repository's own `scripts/` copy the
   way its other outer-loop scripts are mirrored. How the walker finds the graph file is part of this decision: the
   orchestrator resolves the plugin root and passes the path as an argument, or the graph ships beside the walker.
7. **Static checks in `scripts/run-gates.sh`.** The pilot's point is that the flow becomes checkable:
   - the planning graph validates against its schema;
   - every node is reachable from the start node and can reach a terminal;
   - every FAIL cycle passes through a capped counter;
   - every run-mode id the graph gates on is in `run_mode_instructions.md`'s closed set;
   - every ledger id the graph flips exists in `autonomous_pause_and_ledger.md` §1.3's task-engine template.
8. **Walker tests** under `cli/test/` (named per `.claude/CLAUDE.md`). Scripted outcome sequences in, the sequence
   of printed actions out, with the expected sequence derived from the current prose, not from the new graph. At
   minimum:
   - all gates pass first time;
   - parity FAIL once, then PASS, and every gate re-runs;
   - architecture FAIL until the cap, then `<escalate>` naming the architecture gate with each gate's round count;
   - `phases.parity: false` (skipped, no pass recorded);
   - run-mode `parity` skip (passed by exclusion, disclosed);
   - writer `## Questions`, then `<ask>`, then writer re-dispatch;
   - `no_ui: true`;
   - `phases.qa: false`;
   - run-mode `qa` skip;
   - `blocker:` from a reviewer;
   - a gapped `review_<n>` series in a findings folder (the next free index, never back-filled);
   - re-entry mid-loop.

## Establish, do not assume

- **Which runtime the walker is written in.** The shipped outer-loop scripts are bash, and some use `jq`; the CLI
  is Node. An adopter's unattended run must be able to execute it with what `doctor` already checks. Choose, and
  add a `doctor` check if the choice needs a tool nothing checks today.
- **Whether the supervised `/autonomous-sdlc-harness:branch-start-plan`** reaches this core at all. If it does not,
  it is untouched.
- **Whether any agent definition quotes routing text from the core** (`plugin/agents/task-plan-writer.md`,
  `task-plan-reviewer.md`, `architecture-reviewer.md`, `business-parity-reviewer.md`, `ui-tests-plan-writer.md`,
  `ui-tests-plan-reviewer.md` all cite it). Wire strings those agents return, such as `verdict: PASS`, `no_ui: true`
  and `## Questions`, must not change.
- **The token effect.** Measure the core's size before and after, and state honestly how much prose left and what
  stayed.

## Out of scope

- Every other orchestrated loop: the unit loop, branch-review fix loops, the user-review fix-plan flow, QA, docs.
  They are candidates only after this pilot is judged.
- Any change to what the loop does: gate order, the cap value, the re-run-every-gate rule, the skip semantics, the
  escalation payload, the ledger entries.
- The watcher, and any runtime other than Claude Code.
- The dispatch discipline's rules.

## Acceptance

1. The planning graph, its schema and negative fixtures exist, and `scripts/run-gates.sh` runs the static checks in
   item 7. Each check fails on a negative fixture built for it.
2. The walker tests in item 8 pass. The expected action sequences match what the pre-change core prescribes.
3. `task_plan_writing_instructions_core.md` no longer states the loop's routing in prose. Every non-routing rule it
   carried is still present.
4. The autonomous permission profile grants the walker, and an unattended planning run reaches convergence without
   a stall on the walker's command.
5. `bash scripts/run-gates.sh` prints no new failure.
6. The branch records, in a document this repository's conventions place, the before/after size of the core, the
   decisions in items 2, 3a, 4 and 6, and what a second flow would need before it adopts the walker.
