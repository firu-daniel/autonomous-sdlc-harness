### Task 7 — Walker tests: the UI-test loop, re-entry and the re-print subcommand

**Goal:** Cover the rest of the task prompt's minimum scenario list: the UI-test loop's four terminal states, re-entry mid-loop, and `current`. As in Task 6, every expectation is a literal traced to a quoted sentence of the **pre-change** `plugin/instructions/task_plan_writing_instructions_core.md` and, for re-entry, of `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` and `## Override 5`.

**Depends on:** Task 6, which writes `cli/test/helpers/walker.mjs` exporting `walkerFixture({ parity, qa, branch })`, `walk(dir, args)` → `{ status, stdout, stderr, action }`, `plantReview(dir, folder, n)`, `plantLedger(dir, branch, skippedCsv)` and `run(dir, steps)`. This suite imports that helper and redefines none of it. The walker's interface and fixed output form are Task 4's:

- **Invocations:** `start` / `next` / `current`, each with `--flow task_plan_writing --branch <b>`; `start --entry <plan_writer|ui_writer|convergence>`; `next --outcome <o> [--findings <p>]`.
- **dispatch output:** `action: dispatch` … `heartbeat: … (#<total_dispatches>)`.
- **binding output:** `action: binding`, `binding:` …, with `report: ui_test <passed|no_ui|qa-phase-off|run-mode-skipped>` at `<terminal_handoff>` and `ledger: P2` where the walk flips it.
- **state:** `start` overwrites `<state_dir>/.flow_walker_state` and resets every counter to 0.

### Targets

- `cli/test/flow-walker-ui-and-reentry.test.mjs` (new).

**Work:**

- [x] Header. State the rule this suite enforces: the same rule as Task 6's suite, scoped to the UI loop and re-entry. It also names the one behaviour it pins that the prose states only by absence: **re-entry resets the loop counter**. The core sets *"`iteration = 0`. Loop:"* at the loop's start and *"`iteration` is reset to 0 at the start of this loop"* for the UI loop. The counter lives only in the orchestrator's context, and Override 2(a) re-enters the loop (*"Then continue the loop normally from that point"*). The per-folder review indices, by contrast, continue, because they are read off disk.
- [x] UI-loop cases (with `parity: false` to keep the sequences short):
  - (1) **`no_ui: true`.** `ui_writer` `no_ui` → `<terminal_handoff>` with `ledger: P2` and `report: ui_test no_ui`, and **no** `ui_review` dispatch: *"skip the `ui-tests-plan-reviewer` dispatch and the rest of this loop entirely"*.
  - (2) **`phases.qa: false`.** plan review PASS → `<terminal_handoff>` with `skip: ui_writer skipped`, `report: ui_test qa-phase-off`, and **no** `ledger: P2`. §1.3 seeds `P2` `[-]`, and the walk never flips it.
  - (3) **Run-mode `qa` skip** via `--skipped qa` with **no** ledger planted, which exercises the no-ledger record route. The result is `skip: ui_writer passed-by-exclusion` and `report: ui_test run-mode-skipped`, never the `no_ui` wording: *"keep the fourth distinct from the second"*.
  - (4) **UI reviewer FAIL until the cap.** Five FAILs → `<escalate>`, `reason: cap`, the summary *"5 UI-test-plan-review iterations did not converge"*, and **no** `rounds:` lines. The UI loop's step 3 names none.
  - (5) **The UI counter resets.** After a task-plan loop that FAILed twice, the first `ui_writer` heartbeat reads `iter 0`.
- [x] Re-entry cases:
  - (6) **Mid-loop re-entry.** Walk writer → architecture FAIL (plant `review_0.md`) → writer, then call `start --entry plan_writer` as a resumed session would. The writer is dispatched with `prompt: initial` and heartbeat `iter 0`, and the next architecture dispatch carries `arg.iteration: 1`, continuing the folder, not restarting it.
  - (7) **Re-entry past a converged task-plan loop.** `start --entry ui_writer`, the resume-from-ledger case *"if `P1` is `[x]` skip the task-plan loop"*: the first action is the `ui-tests-plan-writer` dispatch.
  - (8) **Everything resolved.** `start --entry convergence` prints `<terminal_handoff>` immediately.
  - (9) **`--entry` outside `entries`** exits 1.
- [x] `current` cases:
  - (10) `current` twice after a dispatch prints byte-identical output and leaves the state file byte-identical. This is the re-issue route for a dispatch that died on an API overload, which §2.5 of `plugin/instructions/autonomous_pause_and_ledger.md` says *"does **not** advance any `>= 5` iteration cap"*.
  - (11) `next` with a different `--branch` than `start` exits 1.

**Verification:**

- `bash scripts/test.sh` exits 0.
- Mutation check: in the fixture's copied graph only, drop `reset` from the `plan_review` PASS edge and case (5) fails. Remove `ledger` from `no_ui` and case (1) fails. Revert both.
- Together with Task 6's suite, every scenario the task prompt's item 8 lists has a named case. Walk that list and name the case for each in a closing comment block of this suite.

**Deviations from plan:**
- `bash scripts/test.sh` exits 1, not 0: gate `4 npm test` passes (all 11 new cases included), and the two failing gates are `1a plugin manifest` (six unquoted `${CLAUDE_PLUGIN_ROOT}` warnings in `plugin/hooks/hooks.json`) and `6a no machine paths` (the worktree's `.git` pointer and existing `harness-runs/` artifacts). This task's diff touches neither.
- Mutation check was run with `harness-runs/scratch/walker_ui_mutation_probe.mjs` (the Task 6 probe's shape), editing only each fixture's copied graph after `init`: `drop-reset` fails only case (5), and `drop-no-ui-ledger` fails only case (1). The template graph was never edited, so nothing needed reverting.
- Case (9) asserts the refused `start --entry plan_review` leaves an existing walk's state byte-identical rather than only checking exit 1, per the walker's "leaves the state file byte-identical" exit contract.
