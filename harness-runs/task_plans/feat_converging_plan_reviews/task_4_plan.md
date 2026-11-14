### Task 4 — Re-pin `flow-walker.test.mjs` to round routing and add the every-gate, once-per-round, cap and review-mode cases

**Goal:** Pin the walker's new routing from the outside, with every expected action a literal written in the test and never read off the graph: a gate that fails no longer short-circuits the round, the counter moves once per round, the cap names every open gate, the review mode switches at round 3, and a round of three `PASS` files reaches the UI-test-plan writer.

**Depends on:** Task 3, whose walker prints, for a round gate, `arg.iteration: <round number>` then `arg.review_mode: full|converging` (converging from **counter** 2); for every dispatch of `plan_writer`, `arg.iteration: <round number>`, and for a revision also `prompt: revision` and one `arg.findings_file: <path>` per findings file the closed round recorded, in gate order — the round number equals the counter in every walk this suite starts, because each starts with no round file on disk (Task 3 → **Two numbers, kept apart**); a `round: <n> <PASS|FAIL>` pass-through line when a round closes; a cap escalation with `node: plan_round`, no `agent:` line, one `findings_file:` per file of the closing round, `rounds: <gate> <count of FAIL files>` and `summary: the plan loop reached its 5-revision cap; the gates open when it fired: <ids>`; and requires `--findings` with `PASS` and `FAIL` at a round gate. Task 2's graph supplies the node ids `plan_round`, `business_parity_review`, `architecture_review`, `plan_review`, `plan_writer`, `ui_writer`.

**Where this task stops.** The resume cases are **Task 5**'s and the UI-loop / re-entry suite is **Task 6**'s; both reuse the helper this task changes, so this task owns `cli/test/helpers/walker.mjs` and they depend on it.

**Forward citation, by design.** `helpers/walker.mjs`'s `plantReview` comment cites `plugin/instructions/plan_review_rounds.md` → `## The round file`, which **Task 10** creates later in ship order (the `cli` layer ships before `plugin`). Until then the citation points at nothing; it is a comment, and nothing reads it at run time.

### Targets

- `cli/test/flow-walker.test.mjs`
- `cli/test/helpers/walker.mjs`

**Work:**

- [ ] `helpers/walker.mjs`: `plantReview(dir, folder, n, verdict = 'FAIL')` writes a round file in the shape `plugin/instructions/plan_review_rounds.md` → `## The round file` fixes — `# review <n>`, then `verdict: <verdict>`, then `review_mode: full` — and `run`'s step shape accepts `review: [folder, n, verdict?]` on a `PASS` step as on a `FAIL` step, planting the file and passing `--findings`. Restate the module header's *"A findings file is planted **before** the `FAIL` it stands for is fed"* to say every round gate's verdict, `PASS` included, is planted first.
- [ ] Re-pin cases `(1)`–`(10)` to the new output: the gate action builders (`parity`, `architecture`, `planReview`) carry `arg.review_mode`; `writer` carries `arg.iteration` on every dispatch and, on a revision, a list of findings files; every `PASS` at a gate plants its round file; `(2)` now reads *"a parity FAIL still dispatches architecture and plan review, then one revision carries every file of the round"*; `(3)` reaches the cap once per round and asserts the new payload literally; `(9)`'s *"rounds count files"* becomes *"rounds count FAIL files"* with a `PASS` file in the folder that is not counted. Keep each case's citation of the rule it pins, restated against `plugin/instructions/task_plan_writing_instructions_core.md` → `## The walker — routing is its, judgement is yours` and the round contract.
- [ ] New case: **a middle gate fails and every later reviewer is still dispatched** — `architecture_review` `FAIL`, then `plan_review` is dispatched with `arg.iteration: 0`, then `plan_review` `PASS` prints `round: 0 FAIL` and the writer revision with `arg.iteration: 1` and exactly the two files the round recorded — the architecture `FAIL` file and the plan-review `PASS` file — in gate order.
- [ ] New cases: **the counter moves once per round** (a round in which two gates fail shows heartbeat `iter 1` on the next writer dispatch, not `iter 2`); **the cap names every open gate** (fail parity and plan review in round 4 and the summary lists exactly those two ids); **the review mode switches at round 3** (rounds 0 and 1 dispatch gates with `full`, round 2 with `converging`); **three PASS files reach the UI-test-plan writer** (`round: 0 PASS`, `ledger: P1`, `ui_writer` with `prompt: initial`, and each gate folder holds its `review_0.md`).
- [ ] New refusal case: `next --outcome PASS` at a round gate without `--findings` exits 1 with one `flow-walker:` line and leaves the state file byte-identical. Update the file header's rule statement to the round routing, and the closing list mapping the task prompt's `## Tests` → **Walker / graph** bullets to the case that covers each.

**Verification:**

- `npm test --workspace cli -- test/flow-walker.test.mjs` passes — this task's own edited test file.
- Every expected action in the file is a literal: `grep -n "graph.json\|WALKER_GRAPH_PATH" cli/test/flow-walker.test.mjs` finds nothing, and every `readFileSync` in it reads the walker's state file for a byte-identity assertion, never the graph.
