### Task 4 — Give the walker test driver `--node` and concurrent calls, and re-pin `flow-walker.test.mjs` to the set

**Goal:** Carry the walker's main suite onto the fan-out — each of its sixteen cases asserting the set, the `wait` lines and the join's result instead of one reviewer after another — and give every walker suite the driver it needs to record a gate's outcome by name and to issue simultaneous calls.

**Depends on:** Task 3, whose walker prints, after the writer's `returned`, one dispatch block per due gate in `gates` order — `action: dispatch` / `node:` / `agent:` / `arg.iteration: <round>` / `arg.review_mode:` / the passed-through `skip:` / `round:` / `ledger:` lines **in the first block only** / `heartbeat:` — and records an outcome with `next … --node <gate> --outcome <o> [--findings <path>]`, printing `action: wait` / `node: plan_round` / `recorded: <gate> <outcome>` / one `pending: <gate>` per gate still out, until the set's last outcome prints the round's result exactly as a closing round did before (writer revision with `round: <n> FAIL`, UI-test writer with `round: <n> PASS` and `ledger: P1`, the hand-off, or the cap escalation from `plan_round`).

**Where this task stops.** This task owns `cli/test/helpers/walker.mjs`; **Tasks 5–8** consume its two additions and edit no line of it. New fan-out cases beyond re-pinning are **Task 5**'s, concurrency is **Task 6**'s.

### Targets

- `cli/test/helpers/walker.mjs`
- `cli/test/flow-walker.test.mjs`

**Work:**

- [ ] `helpers/walker.mjs` → `run`: a step may carry `node`, passed as `--node <node>` before `--outcome`; the step type's JSDoc and the module header say so. Nothing else in `run` changes: a gate's file is still planted before its verdict is fed.
- [ ] `helpers/walker.mjs`: export `runConcurrently(dir, steps, options)` — the same argument building as `run`, every step's file planted first, then every `next` issued **at once** (`Promise.all` over `walk`), resolving to each call's `{ status, stdout, stderr, action }` in step order without asserting a status — and export `blocksOf(action)`, which splits one parsed action into its `action:`-headed blocks. State in the header that the walker under test is still the copy `init` shipped (the module's rule).
- [ ] `flow-walker.test.mjs`: add expectation helpers beside the existing `writer` / `gate` ones — `set(...blocks)` (concatenated blocks, the passed lines in the first block) and `wait(recorded, pending)` (`['action','wait'], ['node','plan_round'], ['recorded', …], ['pending', …]…`) — and give the local `gates(n, verdicts)` steps their `node`. Re-pin every case `(1)`–`(16)` to the set: the writer's `returned` yields one `set(…)` action, the first two gate steps yield `wait(…)`, the last yields what the round's result was before. Move the parity skip lines of cases `(4)`–`(6)` into the set's first block. Case `(16)` keeps its refusal of `PASS` without `--findings`, now with `--node`.
- [ ] `flow-walker.test.mjs`: restate every case title and comment that describes a sequence — `(1)`'s *"writer, parity, architecture, plan review, then the hand-off"*, `(2)`'s *"still dispatches architecture and plan review"*, `(11)`'s *"every later reviewer is still dispatched"*, and the `### 2` *"Business parity comes **before** architecture"* comment — so each states what the set and the join do; restate the header's rule and its *"Not covered here"* line (resume, the UI-test loop, re-entry, `current`, the fan-out's refusals and the concurrent recording are other suites'), and the closing scenario map.

**Verification:**

- `npm test --workspace cli -- test/flow-walker.test.mjs` passes, from the repository root, as one plain foreground command — the task's own test file.
- `grep -n "then the hand-off\|still dispatches\|every later reviewer\|comes \*\*before\*\*" cli/test/flow-walker.test.mjs` finds nothing.
- No expectation in the file is read out of the graph: every expected action is a literal, as the header's rule requires.
