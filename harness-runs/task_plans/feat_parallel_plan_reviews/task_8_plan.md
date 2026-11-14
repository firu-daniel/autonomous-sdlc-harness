### Task 8 — Re-pin `flow-walker-ui-and-reentry.test.mjs` where it assumes a single next reviewer

**Goal:** Carry the UI-loop and re-entry suite onto the fan-out wherever it expects one task-plan reviewer after another, keeping every rule it pins — the UI loop's own counter, the re-entry reset, the refused entry, `current`'s byte-identical re-print and the fresh cap budget after an answered cap park.

**Depends on:** Task 3, whose walker prints the task-plan round as a set (one dispatch block per due gate, `gates` order, passed-through lines in the first block only), records gate outcomes with `next … --node <gate>`, prints `action: wait` / `node: plan_round` / `recorded:` / `pending:` until the set's last outcome prints the round's result as before (including the cap escalation from `plan_round` with its `{open_gates}` summary), and accepts `--entry` only for `plan_writer`, `plan_round`, `ui_writer`, `ui_review` and `convergence`. Task 4, whose `helpers/walker.mjs` `run` passes a step's `node` as `--node`.

**Where this task stops.** The UI-test-plan loop is unchanged: `ui_writer` and `ui_review` cases that never reach a task-plan gate keep their expectations byte for byte.

### Targets

- `cli/test/flow-walker-ui-and-reentry.test.mjs`

**Work:**

- [ ] Give the local `gates` steps — and so `TO_UI_LOOP` — their `node`, and add `set(…)` / `wait(…)` expectation helpers. Re-pin cases `(1)`–`(4)` only where their expected actions include the task-plan round they pass through on the way to the UI loop; their UI-loop expectations stay byte for byte. Re-pin cases `(5)`, `(6)` and `(13)` to the set: `(6)`'s re-entry `start --entry plan_writer` then `returned` now yields the set at round 1, counter 0, `full`; `(13)`'s `dispatchesOf` filters read the gate blocks out of each set action with `blocksOf` (from `helpers/walker.mjs`), and its review-mode list is unchanged.
- [ ] Re-pin `(9)` to refuse `--entry architecture_review` — a gate, which is no entry — and restate its comment (*"a draft sent back for review always starts at its loop's first gate"*) to: a draft sent back for review enters at its loop's round node, `plan_round`, never at a gate. Re-pin `(10)` so `current` re-prints the pending set byte-identically after the writer's `returned`; `(11)` and `(12)` touch no gate and stay as they are.
- [ ] Restate the closing scenario map's lines that read as a sequence (*"parity FAIL once, then PASS, every gate re-runs"*) so they name the set; keep every case number.

**Verification:**

- `npm test --workspace cli -- test/flow-walker-ui-and-reentry.test.mjs` passes, from the repository root, as one plain foreground command — the task's own test file.
- `grep -n "first gate" cli/test/flow-walker-ui-and-reentry.test.mjs` finds nothing.
- `git diff -U0 cli/test/flow-walker-ui-and-reentry.test.mjs` shows no change inside cases `(7)`, `(8)`, `(11)` and `(12)`.
