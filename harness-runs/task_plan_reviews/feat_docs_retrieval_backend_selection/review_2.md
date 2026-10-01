# Task plan review — iteration 2

All three Must Fix items from iteration 1 are resolved:

- `task_10_plan.md`'s exit-3 case now states its whole environment and why each part is needed.
- `task_11_plan.md` now names its forward reference and leaves the check to Tasks 13 and 15.
- The story index's `## Scope register` now has entries 7 and 8 and rows 43–50.

I re-ran command entries 1, 3, 4, 5 and 8 verbatim and re-walked procedure entries 2, 6 and 7. Every site they reach is a row, and every cited symbol and heading resolves in the tree. One new Must Fix follows.

## Must Fix

1. **`task_4_plan.md` (and `task_3_plan.md`): the launcher reads `docs.retrievalBackend` outside the `retrievalApplies` gate, which goes against deliverable 1 and makes Task 1's warning text false**

   **What the prompt and the plan require.**
   - Deliverable 1 says the key "is read only inside" `retrievalApplies` (*"`retrievalApplies` still requires `phases.docs` and `docs.retrieval` both true, and this key is read only inside that"*).
   - The story index's Context repeats this: *"It is read only inside `retrievalApplies`"*.
   - Task 1's `checkRetrievalBackend` warning tells the adopter that with retrieval off the key *"selects nothing until both are on"*.
   - Task 6 and Task 11 promise that `doctor` reports all six retrieval checks `RETRIEVAL_OFF` in that state.

   **What the plan actually does.**
   - Task 3's `hr_docs_retrieval_backend` deliberately *"does **not** consult `phases.docs` / `docs.retrieval`, so a caller needing the gate asks for it separately"*.
   - Task 4 never asks for the gate. It routes on the reader's answer alone: `typescript` or absent → `exec` the runtime, `python` → start `harness-docs-retrieval serve-mcp`.

   **Why that state is reachable.** The launcher runs whenever `.mcp.json`'s `harness-docs` entry exists. That entry outlives turning retrieval off: `init` merges `.mcp.json` and removes nothing (`cli/src/generators/repoRoot.ts`, "adds the lines that are not already there and removes none"). So an adopter can set `docs.retrieval: false` with `docs.retrievalBackend: "python"` left in place. Here is what happens then:
   - The TypeScript path refuses where retrieval is off (`docs/cli.md` → `## 11. \`docs\``: *"The sub-verbs that read the index refuse, before loading anything, where retrieval is off"*).
   - The Python path starts a server and writes into the configured database.
   - `config` and `doctor` tell the adopter the key selects nothing.

   This is a key read outside the gate the prompt fixes, with a user-visible message that contradicts it.

   **Fix:** in `task_4_plan.md`, take the Python branch only when retrieval applies:
   - Read `phases.docs` (the existing `hr_phase_enabled`) and `docs.retrieval`. The latter needs one more emitted scalar in `hr_config_load`, which `task_3_plan.md` must then add, with a `hr_docs_retrieval_backend` comment and a test case to match.
   - When the gate is closed, take today's TypeScript `exec` unchanged, whatever the key holds.
   - Add a test case to `outer-loop-scripts.test.mjs`: `"python"` with `docs.retrieval: false` execs the planted runtime, and the fake `harness-docs-retrieval` is never invoked.
   - State the gate in the launcher header's **WHICH SERVER** paragraph.

   Alternatively, keep the ungated read. In that case:
   - record it in the story index's Context as a departure from deliverable 1, with its reason;
   - in `task_1_plan.md`, reword the warning so it no longer claims the key "selects nothing";
   - in `task_5_plan.md`, have the Python checks grade under `python` whatever the gate says.

   The first route is the one the prompt asks for.

## Should Fix

1. **Story index `## Context`: the forward-link window to `## Turning on the Python backend` is still not recorded (iteration 1, Should Fix 1).** These all cite that heading before Task 13 creates it:
   - Task 5's `retrieval-python-dependencies` remedy text;
   - Task 7's `init` note;
   - Task 8's schema `description`;
   - Task 11's row and Task 12's prose.

   Task 13's last Verification bullet re-checks only `docs/config.md` and `docs/retrieval.md`. Record the window beside the schema window in Context. Then widen Task 13's check to cover the strings in `cli/src/doctor/checks.ts`, `cli/src/retrieval/setup.ts` and `schemas/harness.config.schema.json`, since a renamed heading in Task 13 would otherwise leave those three dangling with no check.
2. **`task_4_plan.md`: iteration 0's Should Fix 3 and 4 are still neither applied nor answered.**
   - `INT` forwarded to a background child in a non-interactive shell, which starts with `SIGINT` ignored. `serve_mcp` handles only `SIGTERM`.
   - A new stderr line on every server start for a key-absent adopter whose configuration is unresolvable (for example, no `jq`), where today the launcher needs neither `jq` nor the configuration.

   State a reason for each in the file, or record them under a `## Rejected findings` section in the story index.

## Nice to Have

1. **`task_15_plan.md`**: the last Verification bullet, *"shows small line counts, read against the two paragraphs"*, is still not checkable. Assert that `git diff dev...HEAD -- ARCHITECTURE.md docs/remote-execution.md` has hunks only inside the two named paragraphs.
2. **`task_6_plan.md`**: the case freezes *"a literal array of the 40 ids"*. `CHECKS` does hold 40 today. The array literal is the contract, so the "40" in the prose adds nothing, and it goes stale if a sibling branch adds a check first.
