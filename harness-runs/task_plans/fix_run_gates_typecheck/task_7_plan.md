### Task 7 — Autonomous forks and ledger templates: new `G` / `RG` wording and the verification-gate sentence

**Goal:** Change the wording of the `G` and `RG` ledger rows, and of the two autonomous forks' flip rules that quote it, so that a ticked row says both gates passed. Make the two forks' `<app_root>` rows say that Phase G's wrapper runs both configured verification commands. Make the autonomous task fork's "the Run gates phase is the verification gate" sentence agree with Task 6's implementer rule.

**The new row wording, byte-exact.** The ids and the column padding stay as they are:

- task engine: `- [ ] G.      Run gates passed (the Run gates wrapper printed pass for typecheck and test)`
- user-review engine: `- [ ] RG. Run gates passed (the Run gates wrapper printed pass for typecheck and test)`

The flip rules quote the parenthetical exactly: *"Run gates passed (the Run gates wrapper printed pass for typecheck and test)"*. The ids `G` / `RG` must not change: `harness-run-lib.sh` parses rows by id, `cli/test/ledger-phases.test.mjs` and `cli/test/remote-progress.test.mjs` pin the ids, and `scripts/check-flow-graph.sh`'s `ledger-id-known` check reads the task-engine template's ids. None of them reads the wording.

**Depends on:**

- Task 4, whose Phase G passes a round only when the one `run-test-suite.sh` call ran the whole-tree `<typecheck_cmd>` (or recorded it not run for `<none>`) and `<test_cmd>`, and both passed. "Printed pass for typecheck and test" is true of exactly that verdict.
- Task 6, whose `unit_loop_core.md` → `## The test-run rule` point 2 states that a unit's whole-tree `<typecheck_cmd>` failure lying wholly outside its change is an evidence downgrade that Phase G's whole-tree run verifies. The fork sentence below points at that point and restates none of it.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md`: `### 1.3 Templates`, the `G.` and `RG.` lines only.
- `plugin/instructions/plan_orchestration_instructions_autonomous.md`: the `<app_root>` row; the sentence "the Run gates phase is the verification gate"; the `G` flip rule.
- `plugin/instructions/user_review_fixes_instructions_autonomous.md`: the `<app_root>` row; the `RG` flip rule.

**Work:**

- [ ] `autonomous_pause_and_ledger.md` → `### 1.3 Templates`: replace the two lines with the byte-exact rows above. Leave the "**The Run gates entries.**" resume paragraph unchanged.
- [ ] `plan_orchestration_instructions_autonomous.md` → the `G` flip rule: quote the new parenthetical, and say the flip happens once Phase G's wrapper prints `pass`, which now covers both gates. `user_review_fixes_instructions_autonomous.md` → the `RG` flip rule: the same change.
- [ ] The two forks' `<app_root>` rows, each in its own fork's vocabulary — the rest of each row is unchanged:
  - **Task fork** (`plan_orchestration_instructions_autonomous.md`, whose `## Resolved values` already declares the `<test_cmd>` / `<typecheck_cmd>` row): "Phase G's wrapper runs `<test_cmd>`" becomes "Phase G's wrapper runs `<typecheck_cmd>` over the whole tree and then `<test_cmd>`, both from `$REPO_ROOT`".
  - **User-review fork** (`user_review_fixes_instructions_autonomous.md`, whose `## Resolved values` declares **neither** token and whose `<app_root>` row deliberately spells the configuration keys): "the cited Phase G's wrapper runs the configured `commands.test` string" becomes "the cited Phase G's wrapper runs the configured `commands.typecheck` string over the whole tree and then the configured `commands.test` string, both from `$REPO_ROOT`". Introduce no `<typecheck_cmd>` / `<test_cmd>` token in this fork, so its `## Resolved values` table stays untouched (`.claude/context/plugin.md` → `## The placeholder vocabulary`).
- [ ] `plan_orchestration_instructions_autonomous.md`: extend the bullet "The implementer runs `<typecheck_cmd>` and only the test files … the Run gates phase is the verification gate." to name what that gate runs (the whole-tree `<typecheck_cmd>` and `<test_cmd>`). Add that a unit's whole-tree type-check failure outside its change is recorded as a downgrade that phase verifies, per `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` point 2. This fork is on that section's citer roster, so the pointer is admissible.

**Verification:**

- `git grep -n 'Run gates passed (the' -- plugin` prints only the new parenthetical, in the template file and the two forks, and no line still carries "the test-suite wrapper printed pass".
- `git grep -nE '^- \[ \] R?G\.' -- plugin/instructions/autonomous_pause_and_ledger.md` shows the ids `G.` and `RG.` with their original padding.
- `scripts/check-flow-graph.sh` is not run here, because it is a gate script. Its `ledger-id-known` check reads ids only, and the id grep above is the evidence that the ids are intact.
- `grep -nE '<(typecheck|test)_cmd>' plugin/instructions/user_review_fixes_instructions_autonomous.md` prints no line; if it prints any, the same file's `## Resolved values` table must carry a declaring `<test_cmd>` / `<typecheck_cmd>` row, and since this task adds none, any hit is a defect to remove.
- `grep -n 'commands.typecheck' plugin/instructions/user_review_fixes_instructions_autonomous.md` shows the `<app_root>` row naming the configured `commands.typecheck` string ahead of `commands.test`.
- `grep -n 'verification gate' plugin/instructions/plan_orchestration_instructions_autonomous.md` names both commands and points to `## The test-run rule` without copying its text.
