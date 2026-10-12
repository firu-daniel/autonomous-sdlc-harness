### 2. The Done summary's blocked-test clause is fed only from session memory, so a resumed session drops it and reports a clean QA pass

**Files:**
- `plugin/instructions/plan_orchestration_instructions_core.md` (`### D.2 Done summary`, the **QA (Phase E)** bullet) — "omit the clause entirely when N is 0"
- `plugin/instructions/user_review_fixes_instructions_core.md` (`### D.2 Done summary`, the **QA (Phase QA)** bullet) — "omit the clause entirely when N is 0. This phase runs Phase E verbatim"

E.2's Round PASS arm now says "carrying this round's blocked list to `### D.2 Done summary`" (`plan_orchestration_instructions_core.md` → `### E.2`). Both D.2 QA bullets add the matching clause: `; N test(s) blocked — Test <T> — <cause>[, …]`, "omit the clause entirely when N is 0". A blocked test writes no file (`plugin/agents/qa-tester.md` → `## Output contract` → `### 3. A test blocked`), and a passing round assembles no merged index. So the blocked list exists **only in the session that walked Phase E**.

Both D.2 sections open with the rule that every figure is "computed here by a named command, taken from an agent's contract return, or counted off an artifact this session itself walked". They also say that a re-entered session states an unreachable figure as unreachable rather than dropping it. The new clause breaks that rule. An autonomous run that passes Phase E (or Phase QA) with blocked tests and then parks, say at a Phase G gate-cap, resumes in a fresh session. That session holds no blocked list, reads "omit the clause entirely when N is 0", and emits "QA passed on round N" with no clause. A test that never ran is then reported as a clean pass. `cli/templates/state-dir/qa_reviews/README.md` names this exact mistake ("rolled into a pass it hides a test that never ran at all"), and the README itself names the Done summary as one of the two places a blocked test is recorded.

The **count** and the **ids** can be recovered from the tree. A Round PASS leaves `[ ]` only on the tests blocked in that round, so after Phase E resolves on a pass, the `**Test <T>**` entries still `[ ]` in `<ui_test_index>` are exactly the blocked set. The causes cannot be recovered.

**Fix:** in **both** files, replace the clause's last sentence, "omit the clause entirely when N is 0", with the text below. Keep the rest of each bullet byte-identical. In `plan_orchestration_instructions_core.md` the bullet also loses its missing terminal period, because the replacement ends with one.

```markdown
omit the clause entirely when N is 0. A session that did not itself walk the passing round takes `N` and the ids off the tree instead — the `**Test <T>**` entries still `[ ]` in `<ui_test_index>` (`grep -E '^[0-9]+\. \[ \]' <ui_test_index>`), which after a Round PASS are exactly that round's blocked tests — and writes each cause as `cause unreachable (session re-entered after the QA phase)`; it never omits the clause on the ground that it holds no list.
```

In `user_review_fixes_instructions_core.md`, the existing sentence "This phase runs Phase E verbatim, so it inherits …" follows the replacement unchanged.

- [ ] `plan_orchestration_instructions_core.md` → `### D.2 Done summary`, QA (Phase E) bullet
- [ ] `user_review_fixes_instructions_core.md` → `### D.2 Done summary`, QA (Phase QA) bullet

No test file is involved, so this fix runs no test.
