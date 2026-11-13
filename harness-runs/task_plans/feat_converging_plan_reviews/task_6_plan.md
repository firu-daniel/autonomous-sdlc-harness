### Task 6 — Carry `flow-walker-ui-and-reentry.test.mjs` onto round routing, keep case (6)'s counter reset, and pin a fresh cap budget after an answered cap park

**Goal:** Move this suite's task-plan-loop traversals onto round routing while keeping the reset it pins today — case `(6) re-entry mid-loop restarts the counter and continues the findings folder` — and add the case that pins what an answered cap park buys: a fresh five-round cap budget and two `full` rounds, with the round numbering carried on from the branch's earlier rounds.

**Depends on:** Task 3 (every `start` sets the counter to 0; `start --entry plan_writer` sets the round number to one past the highest round file on disk, `0` when there is none; round gates print `arg.iteration: <round number>` and `arg.review_mode:` keyed on the counter; every `plan_writer` dispatch prints `arg.iteration:`, and a revision also one `arg.findings_file:` per file of the closed round; the cap fires on the counter, and its `rounds:` lines count each folder's `FAIL` files over the branch's history). Task 4, which owns `cli/test/helpers/walker.mjs` (`plantReview(dir, folder, n, verdict)`; `run` steps `review: [folder, n, verdict?]` on `PASS` as on `FAIL`).

**Where this task stops.** The UI-test-plan loop's own counter and its `ui_review` index (still the next free index in its folder) are unchanged and stay pinned as they are. The mid-round resume cases are **Task 5**'s.

### Targets

- `cli/test/flow-walker-ui-and-reentry.test.mjs`

**Work:**

- [ ] Every traversal of the task-plan loop in this file (`TO_UI_LOOP`, cases `(5)`, `(6)`, `(7)`, `(10)` and any other that walks a gate) plants each gate's round file on `PASS`, follows round routing (a gate's `FAIL` reaches the next gate, and the round node sends the writer one revision), and expects the gate builders' `arg.review_mode` line, the writer's `arg.iteration` line and the `round: <n> <verdict>` pass-through line.
- [ ] Case `(5)` *"the UI loop starts its counter at 0 after a task-plan loop that FAILed twice"*: restate the two failing rounds under round routing (each round closes once, two writer revisions, counter 2), and keep its point — the UI loop's first dispatch shows iter 0.
- [ ] Case `(6)` keeps its name, `(6) re-entry mid-loop restarts the counter and continues the findings folder`, and its pin: after round 0's files are on disk, `start --entry plan_writer` prints the writer at heartbeat `iter 0` with `arg.iteration: 1`, and the next gate dispatch shows `iter 0` with `arg.iteration: 1` and `arg.review_mode: full`. Restate only its traversal (round routing, as above) and its comment: the core's *"`iteration = 0`. Loop:"* still holds, and `arg.iteration` is 1 because the round numbering continues from the round files on disk, no longer because of a per-folder next free index.
- [ ] New case **`(13) an answered cap park starts a fresh cap budget, and the round series carries on`**: walk five `FAIL` rounds to the cap escalation (rounds 0–4), then `start --entry plan_writer` — the **extend** an answered cap park takes under `plugin/instructions/task_plan_writing_instructions_core.md` → `## Setup (once per session)` step 7 — and assert the writer at `iter 0` with `arg.iteration: 5`; that rounds 5 and 6 dispatch their gates with `arg.review_mode: full` and round 7 with `converging` (the mode follows the counter, not the round number); that rounds 5–8 each end in a writer revision; and that round 9's `FAIL` escalates the cap with `rounds:` counting every `FAIL` file in the folder, rounds 0–9 alike.
- [ ] Update the file header's rule statement so it and the cases agree: `start` resets the loop counter, as today; the round numbering of the three plan gates continues because it is read off the round files, and `ui_review`'s index because it is read off its own folder; add case `(13)` to the closing map against the task prompt's `## Tests` and the restated Part 4 counter rule.

**Verification:**

- `npm test --workspace cli -- test/flow-walker-ui-and-reentry.test.mjs` passes — this task's own edited test file.
- `grep -n "^test('(6) re-entry mid-loop restarts the counter and continues the findings folder'" cli/test/flow-walker-ui-and-reentry.test.mjs` finds the case under its unchanged name, and `grep -n "^test('(13)" cli/test/flow-walker-ui-and-reentry.test.mjs` finds the new one.
