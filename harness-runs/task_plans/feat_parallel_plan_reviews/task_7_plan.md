### Task 7 — Re-pin `flow-walker-resume.test.mjs` to the set and add the partial-return and pause-at-join cases

**Goal:** Pin what a resume dispatches under the fan-out: a continued walk re-prints only the gates whose outcome is not recorded, a `start` dispatches only the gates without a round file when the evidence is consistent and the whole set otherwise, a partial return escalates only after the set and resumes with only the missing gate, and a pause honoured at the join resumes at what the join printed.

**Depends on:** Task 3, whose walker: while a set is pending, `current` prints the blocks of the gates with no recorded outcome, in `gates` order, the first carrying the fan-out's passed-through lines; `start --entry plan_round` reads the round evidence and — no round file: round 0, the whole set; files missing with consistent evidence (no present gate `unreadable`, `plan: not-newer`): records the present verdicts and opens the set with only the missing gates, at counter 0; any other incomplete round: the whole set, each gate replacing its file; a complete round as before; a gate's `error` / `blocker` is held until the set's last outcome, then printed once as `binding: <escalate>` with `held:` lines and no `round:` line. Task 4, whose `helpers/walker.mjs` `run` passes a step's `node` as `--node`. `entries` now names `plan_round` where it named `business_parity_review` (Task 2).

**Where this task stops.** The re-entry reset and the cap budget stay `flow-walker-ui-and-reentry.test.mjs`'s (**Task 8**). Whether a fork continues a walk or falls back to the ledger is prose and stays untested here, as the header already says.

### Targets

- `cli/test/flow-walker-resume.test.mjs`

**Work:**

- [ ] Give the local `gates` steps their `node`, add `set(…)` / `wait(…)` expectation helpers, and set `REVIEW_ENTRY` to `{ start: true, entry: 'plan_round' }`. Re-pin cases `(2)`–`(7)` and `(10)` to the set wherever a gate dispatch is expected, keeping each case's rule and title — `(7)`'s *"is reviewed, never skipped or rewritten"* now expects the whole set.
- [ ] Rename and re-pin `(1)` to `(1) a set in flight is re-printed with only its unrecorded gates, and the counter and the round's recorded findings carry on`: record one gate of round 1's set, assert `current` prints exactly the other gate's block (byte-identical state), then record it and assert the revision carries both files in `gates` order. Rename and re-pin `(8)` to `(8) with the saved walk deleted and two of three round files committed, start dispatches only the third gate at counter 0` (run with `phases.parity` on so the round has three gates; commit two gates' `review_3.md`; `iter 0`, `arg.iteration: 3`), and `(9)` to `(9) inconsistent round evidence dispatches the whole set, and each gate replaces its file` (an unreadable file, and separately a plan commit after the earliest round file: both open the whole set at that round).
- [ ] Add `(11) a partial return: one gate's error escalates after the set, and a start dispatches only the missing gate`: `architecture_review` returns `error` with the two other verdicts recorded (their files planted and committed); assert the held binding, then — the walk finished — `start --entry plan_round` dispatches only `architecture_review` at that round. Add `(12) a pause honoured at the join resumes at the writer revision on a FAIL round and at the UI-test writer on a PASS round`: record a round's whole set, then assert `current` re-prints the join's result unchanged — the writer revision with every file of the round and `round: <n> FAIL`, or `ui_writer` with `round: <n> PASS` and `ledger: P1`.
- [ ] Restate the header's rule (*"mid-round only where that evidence is complete and consistent"* → the missing gates only, the whole set otherwise; `current`'s pending set), the `midRoundFixture` comment (*"architecture is the first gate that runs"*), and the closing scenario map, so no sentence states a first or next gate.

**Verification:**

- `npm test --workspace cli -- test/flow-walker-resume.test.mjs` passes, from the repository root, as one plain foreground command — the task's own test file.
- `grep -n "first gate\|next reviewer\|first reviewer\|entry: 'business_parity_review'" cli/test/flow-walker-resume.test.mjs` finds nothing.
- The test titles of `(1)`, `(8)`, `(9)`, `(11)` and `(12)` are exactly the strings above — **Task 22** cites them in `docs/flow-graph-walker.md`.
