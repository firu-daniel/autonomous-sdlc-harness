### Task 7 — Bring this checkout's root `run-test-suite.sh`, run library and new launcher level with their templates

**Goal:** This checkout's adopted copies are byte-identical to the templates Tasks 1 and 2 changed or added:

- `scripts/run-test-suite.sh`;
- `scripts/lib/harness-run-lib.sh`;
- the new `scripts/launch-sandboxed-gates.sh`.

A probe run from the main checkout issues `bash <main>/scripts/launch-sandboxed-gates.sh` (T3 and the `gate-sandbox` leg, Tasks 8–9). The launcher runs the clone's own `run-test-suite.sh --no-detach`, so the root copies must exist and match.

**Depends on:**

- **Task 1** added the `--no-detach <label>` form to `cli/templates/scripts/run-test-suite.sh`.
- **Task 2** added `cli/templates/scripts/launch-sandboxed-gates.sh`, and `hr_placeholder_sweep_paths_var` to `cli/templates/scripts/lib/harness-run-lib.sh`.

The templates are the source. This task makes no change of its own. Before this branch each existing pair was byte-identical.

**This is a catch-all task** (the `layers[]` row whose `path` is `"."`). Its implementer reads every configured layer's conventions document. All three targets are this repository's own adopted outer-loop scripts.

### Targets

- `scripts/run-test-suite.sh`
- `scripts/lib/harness-run-lib.sh`
- `scripts/launch-sandboxed-gates.sh` (new)

**Work:**

- [ ] **Copy the templates' bytes.** Give each target exactly its template's bytes. Keep the two existing files' modes: read `git ls-files -s` for them before the edit, and flip no mode.
- [ ] **The new file's mode.** Give the new file mode `0755`, the mode `OUTER_LOOP_SCRIPTS` gives it, with `chmod 755 scripts/launch-sandboxed-gates.sh`.
  - If that call is refused, record it in the report and go on. The script is always invoked as `bash <path>`, so it runs either way.
  - The story index's **Manual setup required** `init --force` writes it at `0755`.
- [ ] Touch no other file under `scripts/`.

**Verification:**

- `cmp scripts/run-test-suite.sh cli/templates/scripts/run-test-suite.sh`, `cmp scripts/lib/harness-run-lib.sh cli/templates/scripts/lib/harness-run-lib.sh` and `cmp scripts/launch-sandboxed-gates.sh cli/templates/scripts/launch-sandboxed-gates.sh` each exit 0.
- `git diff --summary -- scripts/` reports no mode change to an existing file. `git status --porcelain -- scripts/` lists only the three targets.
- `bash scripts/typecheck.sh` passes.
