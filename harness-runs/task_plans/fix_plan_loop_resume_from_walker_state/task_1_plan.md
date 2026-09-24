### Task 1 — Graph entries for the review re-entry, and the walker header's re-entry contract

**Goal:** Let a planning re-entry `start` the walk at the first gate of either loop, so that an unreviewed draft can be sent back through review. State in the walker's own header that `current` is how a re-entry finds a saved walk, how its output shows which `awaiting` value is saved, and that only `start` resets the counter.

**Where this layer stops.** This task changes **no walker code and no routing**. Every edge, gate, cap, skip construct and escalation payload in the graph stays byte-identical, and so does every line of `flow-walker.sh` below its header comment. When a saved walk is continued, whether it is usable, and which record wins over it are the **plugin** layer's rules: Task 4 writes them in the planning core and Task 5 in the autonomous fork. The tests that drive the new entries are Task 2's. This checkout's own copies under `scripts/` are Task 8's.

### Targets

- `cli/templates/scripts/flows/task_plan_writing.graph.json` — the `entries` array only.
- `cli/templates/scripts/flow-walker.sh` — the header comment only (`USAGE`, `EXIT CODES`, `STATE`).

**Work:**

- [ ] `task_plan_writing.graph.json`: change `"entries": ["plan_writer", "ui_writer", "convergence"]` to `"entries": ["plan_writer", "business_parity_review", "ui_writer", "ui_review", "convergence"]`. Keep that exact order, which is the graph's walk order. Nothing else in the file changes. `business_parity_review` is the task-plan loop's first gate. Its two existing `skip` constructs, `passedByExclusion` on `parity` and then `skipped` on `phases.parity`, pass the walk on to `architecture_review` as they already do. `ui_review` is the UI-test-plan loop's only gate. `plan_review` and `architecture_review` stay **out** of `entries`: a draft sent back for review is always reviewed from its loop's first gate, which matches the loop's rule that every gate runs again.
- [ ] `flow-walker.sh` header, `USAGE` block: under the `current` usage line, add a short paragraph stating these points:
  - `current` is read-only. It re-prints the saved pending action, byte for byte.
  - A planning (re-)entry issues `current` to find a saved walk to continue.
  - What it prints tells the saved `awaiting` value: `action: dispatch` means `awaiting=dispatch`, `binding: <ask>` means `awaiting=answer`, and any other `binding:` (`<escalate>` or `<terminal_handoff>`) means `awaiting=done`, a walk that has finished.
  - A finished walk is re-printed too, but nothing continues it. `next` refuses it with exit 1.
- [ ] `flow-walker.sh` header, `EXIT CODES`: in the exit-1 list, add "`current` with no walk saved" beside "`next` before `start`". This is the existing `load_state` refusal *"no walk in progress at … run 'start' first"*, now named as the answer a re-entry reads as "no saved walk".
- [ ] `flow-walker.sh` header, `STATE` paragraph: replace *"`start` overwrites it and resets every counter to 0."* with a statement of these points:
  - **Only `start`** overwrites the state and resets every counter to 0. That includes a fresh write, an **extend**, a **review** of a draft, and a **skip** past a loop.
  - A re-entry that continues a saved walk, with `current` then `next` or a re-dispatch of the printed action, keeps the state. `counter.iteration`, the prompt variants and the last findings file therefore survive a session boundary.
  - The state is a position, never a phase record. The flow-progress ledger stays the only durable record.

**Verification:**

- `npm run validate:flow-graph` exits 0: the graph is still schema-valid.
- `bash scripts/check-flow-graph.sh` exits 0. `reachable-from-start` and `reaches-terminal` still hold, because both new entries are nodes `start` already reaches, and no other check reads `entries`.
- `git diff -U0 cli/templates/scripts/flow-walker.sh` shows changed lines only above `set -uo pipefail`, which is the header. `git diff -U0 cli/templates/scripts/flows/task_plan_writing.graph.json` shows exactly one changed line, the `entries` line.
- `bash scripts/test.sh` exits 0. `cli/test/outer-loop-scripts.test.mjs` still finds the fixture's walker and graph byte-identical to these templates. `cli/test/flow-walker-ui-and-reentry.test.mjs` → case `(9)` still refuses `--entry plan_review`.
- The header's `REPRO` walk, run by hand in a throwaway fixture as its own lines state, still prints the actions it lists. Then `bash s/flow-walker.sh start --flow task_plan_writing --branch feat_x --entry ui_review --skipped none` prints `action: dispatch` / `node: ui_review`.

**Deviations from plan:**

- `bash scripts/test.sh` exited 1, not 0: gates `1a plugin manifest` (validator warnings on `plugin/hooks/hooks.json`) and `6a no machine paths` (pre-existing hits in `harness-runs/` and the worktree's `.git` pointer) failed; neither reads a file this task changed. Gate `4 npm test`, which runs `cli/test/outer-loop-scripts.test.mjs` and `cli/test/flow-walker-ui-and-reentry.test.mjs`, passed.
- The `REPRO` walk ran from a Python probe via `scripts/scratch-run.sh` in a `mktemp` fixture, not as hand-typed shell lines (the compound shell command was refused). It printed every action the header lists, plus: `current` before `start` exit 1 with the `no walk in progress` refusal; `current` after the finish re-printed `<terminal_handoff>`; `next` after the finish exit 1; `--entry ui_review` and `--entry business_parity_review` dispatched their node at `arg.iteration: 0`; `--entry plan_review` exit 1.
