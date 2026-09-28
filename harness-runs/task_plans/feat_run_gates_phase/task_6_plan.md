### Task 6 — Make `layer-implementer` run `<typecheck_cmd>` per unit and only its own test files

**Goal:** Stop the per-unit suite run at its source. The implementer runs `<typecheck_cmd>` (or nothing, on `<none>`) and only the test files its unit created or edited, through the single-file command a conventions document states. It skips that run without a blocker when no such command is stated, and refuses a plan bullet that asks for any other test run.

**Depends on:** Task 5, which adds `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`. That section is the canonical statement; this file points at it and restates none of it. The rule this file applies:
- no `<test_cmd>`, no gate script, and no test file the unit did not create or edit;
- `<typecheck_cmd>` per unit, or nothing on `<none>`;
- the unit's own test files through `<test_file_cmd>`, meaning the single-file command stated in the dispatched layer's conventions document or in the catch-all layer's (the entry whose `path` is `"."`);
- no command stated, or the command refused, means skip, record, and raise no blocker.

### Targets

- `plugin/agents/layer-implementer.md`.

**Work:**

- [ ] **`## Resolved values`:**
  - Keep the `<test_cmd>` / `<typecheck_cmd>` row, so the token the new paragraph below still names stays declared. Reword only its run statement: `<typecheck_cmd>` is what the unit runs; `<test_cmd>` is declared so this file can name it, and the unit does **not** run it (`## The test-run rule`). Keep its refused-string and `<none>` sentences verbatim.
  - Add a `<test_file_cmd>` row, class `conventions document`: the single-file test command stated in the dispatched layer's `layers[].conventions` document or in the catch-all layer's. It is used only for test files this unit created or edited, per `## The test-run rule`.
- [ ] **The rule, by pointer.** In `## Working modes` → `### Semi-autonomous and autonomous modes`, add a paragraph headed `**What you run, in every mode.**`. It applies `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` and adds only this file's own consequence: a detail-file `**Verification:**` bullet that asks for `<test_cmd>`, a gate script, or a test file this unit neither created nor edited is **not** carried out. It is recorded under `**Deviations from plan:**` as *deferred to the Run gates phase*. That is the implementer-side backstop for a plan that slipped past its reviewers.
- [ ] **`**The probe route, in every mode.**`:** the clause *"a mutation is **reverted before you run `<test_cmd>` and `<typecheck_cmd>` for this unit**, not at the end of the unit, because the committer sees that suite and it has to be clean"* becomes *"reverted before you run this unit's own verification — `<typecheck_cmd>` and any test file this unit wrote — because the Run gates phase runs the full suite over the committed tree"*.
- [ ] **`**Standing-prohibition disposition.**`:** in the transient list, *"a failing `<test_cmd>` or `<typecheck_cmd>`"* becomes *"a failing `<typecheck_cmd>` or a failing test file this unit wrote"*.
- [ ] **`## Output contract`, item 5:** report:
  - the `<typecheck_cmd>` result, run as written, from `<repo_root>`;
  - where `commands.typecheck` holds `<none>`, *not run, because the key says there is none*;
  - each test file this unit created or edited, with its `<test_file_cmd>` result, or *skipped: no single-file command stated*, or *skipped: the stated command was refused*.

  Keep the existing rule that the return never reports a pass for a gate that was not run. The item must read correctly for a unit with `<none>` and no stated command: both are reported as not run, which is the prompt's *"Establish, do not assume"* check on the `<none>` case.

**Verification:**

- `grep -n "test_cmd" plugin/agents/layer-implementer.md` shows no instruction to run `<test_cmd>`. The only hits are the `## Resolved values` row that declares it (and says the unit does not run it) and the **What you run, in every mode.** paragraph's statement that a bullet asking for it is not carried out — every `<test_cmd>` hit in the file has that declaring `## Resolved values` row.
- Read item 5 twice, once as a unit on a repository with `commands.typecheck` = `<none>` and no stated `<test_file_cmd>`, and once as a unit on this repository. Each reading produces a report with no gate claimed as passed that did not run. Record both readings in the detail file under `**Deviations from plan:**` only if one of them does not hold.
- `grep -n "The test-run rule" plugin/agents/layer-implementer.md` prints the pointer line, and its heading resolves: `grep -n "^## The test-run rule" plugin/instructions/unit_loop_core.md`.

**Deviations from plan:**
- The `<test_file_cmd>` row sits after the parity row, beside the other `conventions document` rows, and the table's lead sentence now reads "the last three, which resolve from a conventions document" — the old "last two … this dispatch names" would have misclassified the new row, which may also resolve from the catch-all layer's document. The `<test_cmd>` row's pointer is written as the full `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` citation, since the bare heading does not resolve inside this file.
