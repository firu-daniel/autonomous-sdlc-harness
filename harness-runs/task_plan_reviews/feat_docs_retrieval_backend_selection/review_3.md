# Task plan review — iteration 3

The Must Fix from iteration 2 is resolved, by the route the prompt asks for:

- `task_3_plan.md` adds `hr_docs_retrieval_applies` and the `docs.retrieval` scalar in `hr_config_load`, with the same boolean guard the `phases.*` lines use (checked against `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_config_load`, `hr_phase_enabled`).
- `task_4_plan.md` asks for the gate before it reads the key. It takes today's TypeScript `exec` when the gate is closed, states the gate in **WHICH SERVER**, and adds the gate-closed test case.

I re-ran command entries 1, 3, 4, 5 and 8 verbatim and re-walked procedure entries 2, 6 and 7. Every site they reach is already a row. Task 10's fixture is retrieval-on (`docs-retrieval-service/tests/ts_bridge.py` → `TsFixture`: *"A retrieval-on repository"*), so its Python routing still opens the gate.

One new Must Fix follows. The gate was added to the producer side, but one consumer file still prescribes the old contract verbatim.

## Must Fix

1. **`task_14_plan.md`: the prescribed `docs/watcher.md` row text and the Task 4 contract it restates leave out the retrieval gate, so the shipped row would be false in the state iteration 2's fix was about**

   **What Task 4 now does** (`task_4_plan.md`, Goal and Work bullet 1):
   - It reads `docs.retrievalBackend` only when `hr_docs_retrieval_applies` answers 0.
   - With the gate closed, it `exec`s the TypeScript runtime *"whatever the key holds"*. That includes `python` and an out-of-enum value. In that state there is no exit `1` for an unknown value and no `serve-mcp`.

   **What `task_14_plan.md` still says:**
   - **Depends on**, the Task 4 bullet: *"The launcher reads `docs.retrievalBackend` at run time and `exec`s `docs serve` for `typescript`. For `python` it runs `harness-docs-retrieval serve-mcp` … or `1` for an out-of-enum value."* There is no gate.
   - **Work**, the `docs/watcher.md` bullet, gives the row text verbatim: *"… or by running `harness-docs-retrieval serve-mcp` when `docs.retrievalBackend` is `python`"*, and *"exits … `1` when … the key holds an unknown value"*.

   Both statements are unconditional. Both are false when retrieval is off and the key is left behind, which is the state iteration 2 showed is reachable: `.mcp.json`'s `harness-docs` entry outlives turning retrieval off. A durable document of record would then contradict `config`'s warning (Task 1: *"selects nothing until both are on"*) and Task 11's row (*"read only while `phases.docs` and `docs.retrieval` are both true"*). It is also a cross-task interface restated incorrectly on the consumer side.

   **Fix:** in `task_14_plan.md`:
   - Restate Task 4's contract with the gate in the Depends-on bullet. The key is read only when `phases.docs` and `docs.retrieval` are both true (`hr_docs_retrieval_applies`). Otherwise the runtime is `exec`ed whatever the key holds.
   - Reword the prescribed row so that `serve-mcp` is taken *"when retrieval is on and `docs.retrievalBackend` is `python`"*, and the unknown-value exit `1` applies *"with retrieval on"*.
   - Make the `docs/cli.md` §11 `### docs serve` bullet carry the same condition.

## Should Fix

1. **`task_12_plan.md` and `task_10_plan.md`: the Task 4 restatements also leave out the gate.**
   - Task 12's Depends-on says the launcher *"reads the key at run time"*, and Work bullet 2 asks the writer to *"restate the launcher's routing"* in `docs/retrieval.md` → **Launcher and registration.** Add the gate to the Depends-on bullet so the restated routing carries it.
   - Task 10's Depends-on names only `hr_docs_retrieval_backend` from Task 3. Add `hr_docs_retrieval_applies`, and say that the fixture's retrieval-on config is what opens the gate. The case is correct today only because `ts_fixture` happens to be retrieval-on.
2. **Story index `## Context`: the forward-link window to `## Turning on the Python backend` is still not recorded.** This was iteration 1 and iteration 2, Should Fix 1. Task 5's remedy text, Task 7's note and Task 8's schema `description` all cite that heading before Task 13 creates it. Task 13's last Verification bullet still checks only `docs/config.md` and `docs/retrieval.md`. Widen it to `cli/src/doctor/checks.ts`, `cli/src/retrieval/setup.ts` and `schemas/harness.config.schema.json`, and record the window in Context.
3. **`task_4_plan.md`: iteration 0's Should Fix 3 and 4 are still neither applied nor answered.**
   - `INT` is forwarded to a background child of a non-interactive shell, where `SIGINT` starts ignored, and `serve_mcp` handles only `SIGTERM`.
   - A key-absent adopter whose configuration is unresolvable (for example, no `jq`) gets a new stderr line on every server start, where today the launcher needs neither `jq` nor the config.

   State a reason for each in the file, or record them under `## Rejected findings` in the story index.

## Nice to Have

1. **`task_15_plan.md`**: the last Verification bullet (*"shows small line counts, read against the two paragraphs"*) is not checkable. Assert that the hunks of `git diff dev...HEAD -- ARCHITECTURE.md docs/remote-execution.md` fall only inside the two named paragraphs.
2. **`task_6_plan.md`**: *"a literal array of the 40 ids"*. The array is the contract, and the count goes stale if a sibling branch adds a check first.
