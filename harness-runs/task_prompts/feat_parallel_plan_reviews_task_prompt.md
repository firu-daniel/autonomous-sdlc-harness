`feat_parallel_plan_reviews` makes the plan-review gates of a round run at the same time instead of one after another, in the task-plan loop and in the user-review fix-plan loop. The plan writer then reads every findings file of the round, as it already does. The goal is less wall time per planning round. Tokens, FAIL rounds and what each reviewer checks stay the same.

> ⚠️ **Find every anchor in this prompt by its quoted text or symbol name, never by line number.** Verify every claim marked *verify* before planning on it.

---

## Why

`feat_converging_plan_reviews` (#364, #365) did most of the groundwork:

- Every gate runs every round, and a `round` node (`plan_round` in `cli/templates/scripts/flows/task_plan_writing.graph.json`) closes the round once.
- Every gate writes `review_<round>.md` every round, PASS included, under one round number shared by every gate's folder.
- The writer's revision already takes every findings file of the round, groups the Must Fix items by target file, reads each against the file's unchanged text, and resolves conflicts by precedence (`plugin/instructions/plan_review_rounds.md` → `## The writer's revision`).
- A gate never reads another gate's file **from the same round**. In converging mode it reads another gate's file only from the previous round (`## Converging mode`, item 4). *Verify* that nothing in the three reviewers' plan-review modes reads a file from the same round.

So nothing in a round depends on the order of its gates any more. Running them in sequence only costs wall time: a round takes the sum of three reviewer dispatches when it could take the longest one. `docs/flow-graph-walker.md` → `### Item 7` already anticipated this step: "a later fan-out … is an edge change in the graph, not a walker change".

**Decided:** the plan writer reads every findings file. No merging agent. Its revision contract stays as it is.

## What changes

### 1. The task-plan loop fans out and joins

**Driver-neutral by design.** Two drivers will walk this graph: today's orchestrator session, and the script of the script-driven planning pilot (#159, ROADMAP `Script-driven planning pilot` / `Script-driven autonomous flow`), which runs every dispatch as its own headless session. That script gets parallel sessions almost for free, as long as everything about the fan-out sits in the graph and the walker, not in the orchestrator's prose. So:

- **The graph** declares that a round's gates are independent and **may** run at the same time. Whether a driver actually runs them concurrently or one by one is the driver's choice, and changes nothing in the graph or the walker.
- **The walker** owns every rule of a parallel round: which gates are due, which outcomes are still missing, when the round closes, when a binding fires, and what a resume dispatches.
- **The orchestrator core** owns only what #159 moves to the script anyway: the safety contract, heartbeats, PAUSE, commits, and how it sends several dispatches at once.

Nothing in Parts 1–2 may need the orchestrator session in order to work. Every rule must be one the #159 script can follow by reading the walker's output and calling the walker.

- **Graph.** After `plan_writer` returns, every gate in `plan_round.gates` is dispatched together. Each gate's `PASS` and `FAIL` route to `plan_round`, which closes the round only after every gate of the round has recorded an outcome. The round's outcomes, the counter, the cap, `onCap`'s `{open_gates}` and `convergingFrom` stay as they are. *Verify* whether this fits format 2 or needs a new construct, for example a `parallel: true` on the round node or the writer's `returned` edge targeting the round node's fan-out. If the format changes, `formatVersion`, `schemas/flow-graph.schema.json` and `scripts/check-flow-graph.sh` change with it (`gate-in-round`, `fail-cycle-capped`, `cap-matches-core`, plus a negative fixture under `schemas/negative/`). Correct `### Item 7`'s "edge change, not a walker change" sentence to describe what actually changed.
- **Walker.** `flow-walker.sh` prints the whole set in one fixed form: one dispatch block per gate, each with its own `node:`, `agent:`, `arg.iteration:` (the same round number), `arg.review_mode:` and heartbeat. It also needs a way to record each gate's outcome **in any order**. Today `next` keys on the single pending node, so it must name the gate it records (for example `next --node <gate> --outcome … --findings …`). The planner chooses the form and states the reason. It rejects an outcome for a gate that is not pending in the current round, and an outcome recorded twice. **Recording is safe under concurrent calls.** The walker serialises its own state writes, for example with a lock on `.flow_walker_state` taken through a portable primitive that works on macOS and Linux. A driver that runs one session per gate can then record each outcome as its session ends. The orchestrator happens to record them one after another, but no rule may rely on that. Until the round closes, `next` for a gate prints what is still pending (for example `action: wait` naming the gates still out). The set's last outcome prints the round's result.
- **Skips first.** `passedByExclusion` and `skipped` are resolved before the fan-out. A skipped gate is never in the set and counts as passed, as now.
- **Partial returns.** If one gate returns `error` or `blocker`, or the session self-pauses on overload while others returned a verdict, the verdicts already returned are recorded and their round files stand. The **walker** holds the `error`/`blocker` binding until every gate of the set has recorded an outcome, then prints it once. No driver has to restate that rule. On resume, the walker's `start` and `current` print only the gates without a valid round file.

### 2. The orchestrator side

- **Safety contract per dispatch, then one message.** The STOP check, the `.dispatch_counter` increment and the heartbeat run for every dispatch of the set. Then all the dispatches go out in a single message, so they run concurrently. `MAX_TOTAL_DISPATCHES` and the sizing sentence in `task_plan_writing_instructions_core.md` → `## Setup` step 4 stay as they are, because a round still dispatches exactly four agents. *Verify* this and restate the sentence if its wording assumes an order.
- ***Verify* headless concurrency** in a `claude -p` orchestrator session. Several Agent calls in one message must run concurrently and return all their results before the session's next step, and a background subagent's completion must not end or stall the turn. State in the core the exact dispatch form that guarantees this. If that is not possible, the orchestrator dispatches the set one by one, with the reason stated. That is a driver choice, so the graph and the walker stay unchanged.
- **Pause.** A PAUSE is checked once before the fan-out and honoured at the join. There is no "between two reviewers" any more. A PAUSE placed during the fan-out waits for every dispatch of the set to return, commits the round's files through the existing planning-pause commit (`autonomous_pause_and_ledger.md`, `task_plan_writing_instructions_autonomous.md` → "Honoring a PAUSE during planning") and then pauses. Correct every sentence that describes a pause between gates.
- **Mid-round resume.** The round evidence rule (`fw_round_evidence`, `docs/flow-graph-walker.md` → "What `start` reads") changes from "the next due reviewer" to "every due reviewer". The evidence is consistent when every gate that has a round file holds exactly one verdict line and no plan file postdates the round's earliest review file. In that case the gates without a file are dispatched together. In any other case the round restarts with the whole set, and every gate replaces its own file. "First gate in gate order" no longer has a meaning, so restate it.
- **Per-round commit** (autonomous fork) happens at the join, unchanged.

### 3. The user-review fix-plan loop

In `plugin/instructions/user_review_fix_plan_writing_instructions_core.md`, steps 7 and 8 are dispatched together in one message once step 6 has cleared. The round close runs after both verdicts are recorded (or a gate's skip or exclusion is noted). Remove the sequential rationale: "before the architecture gate … before architecture-review effort is spent" in step 7, and "step 7 has recorded the business-parity gate's verdict" as step 8's precondition. Keep the step numbers, because they are cited from outside. Restate the "first half / second half of review round" wording. The writer's revision prompt keeps its gate order (business parity, then architecture) as the **listing** order of `<findings_files>`; it is no longer an execution order. Its autonomous fork's pause and resume rules get the same changes as Part 2.

Keep this part to the minimum. The loop has no graph yet, so every rule written in its prose is one that a later port to a graph has to translate. Do not add parallel-round machinery here that Part 1 puts in the walker. State the loop's few rules in one place, written so they map one-to-one onto the walker's: the same "due gates", "join" and "held binding" terms. Its routing stays in prose; moving it onto a graph remains out of scope.

### 4. Run analytics

*Verify* that `cli/templates/scripts/run-analytics.sh` attributes overlapping sub-agents correctly: per-sub-agent wall time, the planning phase's wall time (now shorter than the sum of its dispatches), and tokens per agent. Fix whatever assumes sub-agents run one at a time.

## Out of scope

- **The end-of-branch reviews** (Phases A1.5, A2 and B, then C2's skeptic in `plan_orchestration_instructions_core.md`). Each of those reviews sees the branch after the previous review's fixes, and it has no shared writer to reconcile conflicting findings. That is a separate decision.
- The UI-test-plan loop, which has a single gate.

## Tests

- **Walker / graph:** a round dispatches every non-skipped gate in one action. Outcomes recorded in any order close the round only once the last gate reports. An outcome for a non-pending gate, or a duplicate outcome, is rejected. The counter increments once per FAIL round. The cap escalation names every open gate. A skipped gate is absent from the set and counts as passed. `arg.review_mode` is unchanged (rounds 1–2 `full`, then `converging`).
- **Partial returns:** one gate `error` with two verdicts recorded escalates after the set, and the two round files stand. On resume only the missing gate is dispatched.
- **Resume:** with the saved walk deleted and two of three round files committed, `start` dispatches only the third gate, at counter 0. With inconsistent evidence the whole set is dispatched and each gate replaces its file. Re-pin `cli/test/flow-walker-resume.test.mjs` cases `(1)`, `(8)` and `(9)` and `flow-walker-ui-and-reentry.test.mjs` where they assume a single next reviewer.
- **Pause:** a PAUSE during the fan-out is honoured after the join, with the round's files committed and pushed. Resuming continues at the writer revision (FAIL round) or `ui_writer` (PASS round).
- **Concurrent recording:** several gate outcomes recorded by simultaneous `next` calls all land, none is lost, and exactly one call prints the round's result.
- **Driver-neutral:** the walker tests drive a parallel round through the walker's CLI alone, with no orchestrator prose, the way a #159 script would.
- **`check-flow-graph.sh`:** its existing cases still pass, plus a negative fixture for whatever new construct the format gains.

## Docs

- `docs/flow-graph-walker.md`: the fan-out, the join, the outcome-recording form, the concurrency guarantee and the resume rule, plus `### Item 7`'s sentence. Say what a second driver must do to run a round in parallel, as the input for #159.
- `plugin/instructions/plan_review_rounds.md`, wherever it implies an order.
- The two loop cores and their autonomous and semi-autonomous forks.
- `autonomous_pause_and_ledger.md`.
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`, wherever it draws the plan loop's gates in sequence.

*Verify* every other place that says a gate runs "then" or "before" another gate in plan-review mode, and correct it in the same branch.

**Roadmap.** In `ROADMAP.md`, set the `Parallel plan reviews` row to `Done` and restate it as shipped: gates fan out, the round node joins, and the writer reads every findings file. Drop the "or a merging agent" alternative. Update the `Parallel dispatch in waves` row's "On the planning side it starts with **Parallel plan reviews**" to match. Check the numbered index at the top of the file.
