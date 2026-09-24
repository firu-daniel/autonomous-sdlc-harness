### Task 6 — Walker tests: the task-plan loop, derived from the pre-change core

**Goal:** Prove the walker routes the task-plan loop exactly as `plugin/instructions/task_plan_writing_instructions_core.md` prescribed at this branch's merge base. The test feeds in scripted outcome sequences and asserts the sequence of printed actions. Every expected action is written as a literal in the test and traced to a quoted sentence of the **pre-change** core, never read out of the graph. A test that derived its expectation from the graph would prove only that the walker agrees with itself.

**Depends on:** Task 5, which makes `init` write `scripts/flow-walker.sh`, `scripts/lib/flow-walker-gates.sh` and `scripts/flows/task_plan_writing.graph.json` into a fixture. Each test drives that **shipped copy**. The interface is Task 4's, restated here so this file stands alone:

- **Invocations:** `bash scripts/flow-walker.sh start|next|current --flow task_plan_writing --branch <b> [--entry <node>] [--outcome <o>] [--findings <path>] [--skipped <ids|none>]`.
- **dispatch output:** `action: dispatch`, `node:`, `agent:`, `prompt:` (writers), `arg.iteration:` (reviewers), `arg.findings_file:` (revision), then `skip: <node> <skipped|passed-by-exclusion>` / `ledger: <id>` lines, and last `heartbeat: … (#<total_dispatches>)`.
- **binding output:** `action: binding`, `binding: <…>`, `node:`, then either `agent:` / `resume:` for `<ask>`; or `agent:`, `reason:`, and for a cap `findings_file:`, `rounds: <node> <n>`, `evidence:` / `evidence.open:` lines and `summary:` for `<escalate>`; or `report: <key> <value>` for `<terminal_handoff>`.
- **refusal:** exit 1, one `flow-walker: …` stderr line, state unchanged.

### Targets

- `cli/test/helpers/walker.mjs` (new). It exports:
  - `walkerFixture({ parity, qa, branch })`: `createFixture` and `init` via `runCli`, then set `phases` in the fixture's `harness.config.json`;
  - `walk(dir, args)`, which returns `{ status, stdout, stderr, action }`, where `action` is the ordered `[key, value]` pairs parsed from stdout;
  - `plantReview(dir, folder, n)`, which writes the `review_<n>.md` a FAIL leaves behind;
  - `plantLedger(dir, branch, skippedCsv)`, which writes a ledger carrying only the `## Run mode` block `plugin/instructions/autonomous_pause_and_ledger.md` §1.3 fixes;
  - `run(dir, steps)`, which drives a whole scripted sequence and returns every action.
- `cli/test/flow-walker.test.mjs` (new).

**Work:**

- [ ] Header. Open the suite with the rule it enforces: *the walker reproduces the pre-change core's routing, and every expectation cites the pre-change sentence it comes from, by heading and quoted substring*. Also state:
  - which documented behaviours are deliberately not covered here: the UI loop, re-entry and `current`, which are Task 7's;
  - that the fixture repository lives under the system temp directory and the test is never aimed at this checkout (`.claude/context/conventions.md` → `## The testing bar`).
- [ ] Write the helper above. Use `cli/test/helpers/fixture.mjs`'s `createFixture` / `runCli` / `runBash` rather than a second fixture builder. Plant a review file **before** feeding the `FAIL` it stands for, so `arg.iteration` is asserted against real folder contents.
- [ ] Cases, each with its expected action list as a literal array:
  - (1) **All gates pass first time** (`parity: true`, `qa: false`). writer → parity (`arg.iteration: 0`) → architecture (0) → plan review (0) → `<terminal_handoff>` with `ledger: P1`, `skip: ui_writer skipped`, `report: … passed` for the three gates and `report: ui_test qa-phase-off`.
  - (2) **Parity FAIL once, then PASS; every gate re-runs.** writer → parity FAIL → writer `prompt: revision` carrying that `arg.findings_file`, heartbeat `iter 1` → parity (`arg.iteration: 1`) → architecture → plan review. This comes from step 2's *"then re-run the parity review (then the architecture review, then the structural reviewer) on the revised plan"*.
  - (3) **Architecture FAIL until the cap.** Five architecture FAILs (the counter reaches 5, per *"increment `iteration`. If `>= 5`, `<escalate>`"*) end in `binding: <escalate>`, `reason: cap`, the fifth `findings_file`, `rounds: business_parity_review 0`, `rounds: architecture_review 5`, `rounds: plan_review 0` and the summary *"the plan loop reached its 5-revision cap; the architecture gate was open when it fired"*.
  - (4) **`phases.parity: false`.** No parity dispatch at all, `skip: business_parity_review skipped` on the architecture dispatch, and **no** `report: business_parity_review passed` at convergence. The pre-change sentence is *"A skipped gate is **not** a converged gate … records no pass for it, and reports none"*.
- [ ] More cases:
  - (5) **Run-mode `parity` skip**, via `plantLedger(…, 'parity')` with `phases.parity: true`. No parity dispatch, `skip: business_parity_review passed-by-exclusion` and `report: business_parity_review passed-by-exclusion`: *"fall through to step 3 exactly as a `verdict: PASS` does"*.
  - (6) **Both parity switches at once**, pinning the core's textual order: `passed-by-exclusion` wins, because *"Before anything else in this step"* puts the run-mode gate first.
  - (7) **Writer `## Questions`.** `questions` → `binding: <ask>`, `resume: plan_writer` → `answered` → the writer is re-dispatched with the **same** prompt variant it had.
  - (8) **`blocker:` from a reviewer.** Architecture `blocker` → `<escalate>`, `reason: blocker`, `agent: architecture-reviewer`.
  - (9) **Gapped series.** Pre-plant `review_0.md` and `review_3.md` in `architecture_reviews/<branch>/`: the architecture dispatch carries `arg.iteration: 4` (*"never back-filled"*), and after one FAIL the rounds count counts files, not indices.
  - (10) **Undeclared outcome.** `no_ui` while the parity reviewer is pending exits 1 and leaves `.flow_walker_state` byte-identical.

**Verification:**

- `bash scripts/test.sh` exits 0, which runs `npm test` as gate 4 of `scripts/run-gates.sh`.
- Mutation check: temporarily swap the two parity `skip` entries in the **fixture's** copied graph (never the template) and case (6) fails. Temporarily change the fixture graph's `cap` to 4 and case (3) fails. Revert both. Run these as a probe under `<state_dir>/scratch/` through `scratch-run.sh` if a script is needed.
- Every expected array carries a comment quoting its pre-change core sentence. Grep the test file for `graph.json` and find it only in the helper's fixture path, never read into an expectation.
