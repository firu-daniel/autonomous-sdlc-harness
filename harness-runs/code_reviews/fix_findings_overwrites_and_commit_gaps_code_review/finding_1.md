### 1. The user-review core's `### QA.1+` still states the old Round PASS condition, contradicting E.2's blocked-remainder PASS

**File:** `plugin/instructions/user_review_fixes_instructions_core.md` (`### QA.1+ Run the QA loop (Phase E, E.0–E.4)`, closing paragraph) — "When the round verdict is PASS (no `[ ]` entries remain in `<ui_test_index>` after the run, E.2)"

This branch redefined Phase E's Round PASS (Task 12, `plugin/instructions/plan_orchestration_instructions_core.md` → `### E.2`, the **Round PASS** bullet): a round passes when no `[ ]` entry remains in `<ui_test_index>` **except tests that returned the per-test blocked line this round**. E.4 relies on that too: "a round whose only remaining `[ ]` tests are blocked ones is a Round PASS that ends the phase". The autonomous fork's `R4` flip (`plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override G`) and the `R4.` ledger template line (`plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3`) were updated to admit the "only blocked tests left" outcome.

The user-review core's own `### QA.1+` section was not updated. Its closing paragraph restates the round-PASS condition the old way: no `[ ]` entries remain. This is the paragraph that tells the user-review orchestrator when to tear down the dev server and go to Phase G. A Phase QA round with a blocked test left `[ ]` passes under E.2 but not under this sentence. The orchestrator then has two conflicting definitions. Following this one, it treats the round as not passed and keeps re-testing until `MAX_QA_ROUNDS` escalates, on a round that E.2, E.4 and the `R4` flip all call resolved. The same section's lead-in says not to restate E's mechanics "differently here", and this sentence is now exactly such a restatement.

**Fix:** replace the parenthetical so it states E.2's condition:

```markdown
When the round verdict is PASS (no `[ ]` entry remains in `<ui_test_index>` after the run except tests that returned the per-test blocked line `error: blocked — test <T>: <one-line cause>` this round, E.2), tear down the dev server and go to Phase G. On any halt during this phase, tear the dev server down before stopping.
```

Change nothing else in the paragraph. No test file is involved, so this fix runs no test.
