# Architecture review — iteration 0

Layer placement, the `_(layer: …)_` tags and dependency direction hold across all thirteen tasks:

- `cli/package.json`, `cli/src/retrieval/store.ts`, `cli/test/docs-retrieval-store-upgrade.test.mjs`, `cli/test/docs-retrieval-store.test.mjs` and `cli/test/fixtures/…` are tagged `cli`.
- The root `package-lock.json`, `docs-retrieval-service/**`, `evals/**` and `docs/**` are tagged `general`, the catch-all at `.` (`.claude/context/conventions.md` → `## The layers`).
- The old-index handling sits in the store's own open path, it is exported from its owner `store.ts`, and it is ported to `store.py` under that file's existing parity rule.
- No module crosses the `cli`/`plugin` boundary.

One test-run breach remains.

## Must Fix

1. **Task 7 asks the unit to run gate 13a and gate 13b** — `task_7_plan.md`, the sub-step **Run the two edited test files and the Python gates** (its third and fourth bullets) and the `**Verification:**` bullet `bash scripts/python-service.sh lint and bash scripts/python-service.sh typecheck pass.` This violates `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, points 1 and 4.
   `commands.test` is `bash scripts/test.sh`, which runs `scripts/run-gates.sh`. That script runs these exact commands as gates: `python_gate "13a Python lint" noskip bash scripts/python-service.sh lint` and `python_gate "13b Python typecheck" noskip bash scripts/python-service.sh typecheck`. So each is a gate script that `<test_cmd>` runs. Point 1 bars a unit from running one, and point 4 bars a plan from naming one in a sub-step or a `**Verification:**` bullet. The point 5 carve-out covers `<typecheck_cmd>` only, which here is `bash scripts/typecheck.sh`. It does not cover the Python wrapper's `typecheck` sub-command. The sub-step's own heading, "the Python gates", says the same.
   **Fix:** In `task_7_plan.md`, delete the `bash scripts/python-service.sh lint` and `bash scripts/python-service.sh typecheck` bullets from that sub-step. Rename the sub-step to "Run the two edited test files". Delete the `**Verification:**` bullet that requires lint and typecheck to pass, or replace it with a statement that both run at the Run gates phase as gates 13a and 13b. Keep the two runs of the files the unit edits, `tests/test_store_statements.py` and `tests/test_store_postgres.py`: point 3 permits those. Keep `bash scripts/typecheck.sh` wherever another task asks for it.

## Should Fix

1. **Task 1's machine-path check does not reach the committed archive** — `task_1_plan.md`, the last `**Verification:**` bullet. The rule is `.claude/context/conventions.md` → `## The testing bar`: *"The self-containment gate binds every commit: nothing in this tree may name a location on the machine that wrote it."* The plan greps only the `.mjs` for `$HOME`, and it notes itself that the archive is gzip. Gate 6a's text grep therefore cannot see inside `docs-index-pg-textsearch-1.3.1.tar.gz`, and the PGlite data directory was built under `os.tmpdir()` on the build machine. **Fix:** add a read-back step that decompresses the archive to a stream and counts hits for `$HOME` and for the build's temporary-directory prefix (for example `gzip -dc … | grep -ac "$HOME"` run in the scratch probe). Require `0` hits, and record the result in the module's **What the archive holds** paragraph.
