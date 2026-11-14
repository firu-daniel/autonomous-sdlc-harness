### Task 5 — Add `flow-walker-fan-out.test.mjs`: any-order joins, refusals, skipped gates and the held binding

**Goal:** Pin the parallel round's own rules — the ones the walker now owns and no driver may restate — through the walker's CLI alone, the way the #159 script will drive it: no orchestrator prose, only `start`, `next --node` and `current`.

**Depends on:** Task 3, whose walker prints the set (one dispatch block per due gate in `gates` order; the passed-through lines in the first block only), records `next … --node <gate> --outcome <PASS|FAIL|error|blocker> [--findings <path>]` in any order, prints `action: wait` / `node: plan_round` / `recorded: <gate> <outcome>` / `pending: <gate>`… while gates are out, refuses with exit 1 and a byte-identical state file a missing `--node` while a set is pending, a node not pending in the round and a second outcome for one gate, and at the join prints either the round's result or — when any gate's outcome was `error` or `blocker` — `action: binding` / `binding: <escalate>` / `node:` and `agent:` of the first held gate in `gates` order / `reason:` / one `held: <gate> <outcome>` per held gate, with no `round:` line. Task 4, whose `helpers/walker.mjs` `run` passes a step's `node` as `--node` and exports `blocksOf(action)`.

**Where this task stops.** Re-pinning the existing suites is **Tasks 4, 7 and 8**'s; simultaneous calls are **Task 6**'s. This task creates one new suite and edits no helper.

### Targets

- `cli/test/flow-walker-fan-out.test.mjs` (new)

**Work:**

- [ ] Header: the rule this suite exists to enforce — *a round's due gates are dispatched as one set, their outcomes are recorded in any order, the round closes exactly once at the last of them, and an outcome the round does not await is refused and changes nothing* — plus *"driven through the walker's CLI alone, as a second driver would"*, the fixture rule (built under the system temp directory, torn down in process, never this checkout), and every expected action written as a literal citing its rule by heading and quoted substring, never read out of the graph.
- [ ] Cases `(1) the writer's return dispatches every non-skipped gate as one set` (three blocks, `gates` order, one shared `arg.iteration`, `blocksOf` giving three); `(2) outcomes recorded in any order close the round only at the last` (record `plan_review`, `business_parity_review`, `architecture_review`: two `wait` actions whose `pending:` lines shrink, then the round's result); `(3) an outcome for a gate not pending in the round, or a second outcome for one gate, is refused and changes no state` (each asserted on the state file's bytes, as `cli/test/config-command.test.mjs`'s refusals are).
- [ ] Cases `(4) a skipped gate is absent from the set and counts as passed` (`phases.parity` off: two blocks, the first carrying `skip: business_parity_review skipped`; two `PASS` outcomes close the round `PASS`); `(5) a gate's error with two verdicts recorded is held until the set is in, then escalates once, and the round files stand` (record `architecture_review` `error` first: `wait`; then two verdicts: the held binding with its `held:` line and no `round:` line; both planted round files still on disk; a further `next` exits 1 because the walk finished); `(6) --node is required while a set is pending` (exit 1, state unchanged).

**Verification:**

- `npm test --workspace cli -- test/flow-walker-fan-out.test.mjs` passes, from the repository root, as one plain foreground command — the task's own test file.
- `grep -c "^test(" cli/test/flow-walker-fan-out.test.mjs` prints `6`.
