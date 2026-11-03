### Task 17 — State the launcher and the `--no-detach` form in `docs/watcher.md`'s shipped-scripts table

**Goal:** `docs/watcher.md`'s table of shipped scripts describes the gate launcher as a row of its own, and mentions `run-test-suite.sh`'s new form in that script's row. The **Not read.** paragraph's account of how the excluded scripts place the main checkout names the launcher too. The watcher's own behaviour does not change: the launcher's allow twin rides the per-run copy's existing twin rule, so `### The per-run profile` needs no edit.

**Depends on:**

- **Task 1.** `run-test-suite.sh --no-detach <label>` runs the run form's start-up work and then both gates in its own process. Only the launcher issues it, inside its own sandbox.
- **Task 2.** `launch-sandboxed-gates.sh <target> <label>`, run from the main checkout through an excluded command:
  - it checks its target as the git wrappers do, placing the main checkout from its own location through `hr_wrapper_main_of`;
  - off a bubblewrap host, or under the opt-out, it answers `in-session` and starts nothing;
  - on one, it starts `run-test-suite.sh --no-detach` under its own `bwrap` sandbox, with no network and the target its only writable root, through a detached supervisor, and answers `pending`;
  - it refuses where `bwrap` is missing or cannot start.
- **Task 3.** The row, agent-invocable and `runsUnsandboxed`.
- **Task 16.** It adds `docs/cli.md` §6 residual 13, *"On a bubblewrap host the gate run is sandboxed by the launcher, not by Claude Code."*, which this file cites rather than restates.

**This is a catch-all task** (`path` `"."`). Its implementer reads every configured layer's conventions document.

### Targets

`docs/watcher.md`, these sites only: register rows 46 and 79.

- the shipped-scripts table's `run-test-suite.sh` row;
- a new `launch-sandboxed-gates.sh` row after it;
- the **Not read.** paragraph's sentence *"The excluded wrappers place the main checkout from their own location through `hr_wrapper_main_of`"*.

**Work:**

- [ ] **The `run-test-suite.sh` row.** After *"Its run form starts both gates detached from the calling session"*, add that its `--no-detach` form runs them in its own process, for the gate launcher alone. Keep the row's other cells.
- [ ] **The new row**, in the table's columns:
  - **What it does:** on a bubblewrap host it starts the round's gates under its own `bwrap` sandbox and answers `pending`; off one it answers `in-session`; it refuses where `bwrap` cannot run. Cite `docs/cli.md` §6 residual 13.
  - **Who runs it:** the orchestrating session's Phase G, the main checkout's copy, through `<gate_launcher>`.
  - **Agent-invocable:** **yes**, matching the column's existing values.
- [ ] **The Not read. paragraph** (register row 79). *"The excluded wrappers place the main checkout …"* becomes *"The excluded scripts, the three git wrappers and the gate launcher, place the main checkout …"*: the launcher takes it through `hr_wrapper_main_of` too (Task 2). Keep the rest of the paragraph byte-identical.

**Verification:**

- `git diff -U0 -- docs/watcher.md` shows hunks only at the sites named under `### Targets`: the `run-test-suite.sh` row, one added row, and the **Not read.** sentence.
- Every `docs/watcher.md` hit of the story index's register entries E2 and E3 is a register row, and only rows 46 and 79 differ from `HEAD`.
