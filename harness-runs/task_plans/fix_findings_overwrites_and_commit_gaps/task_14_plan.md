### Task 14 — Let the `E` / `R4` ledger entries resolve over a blocked-only remainder

**Goal:** Close the ledger consequence of defect 8. After Tasks 11–13, a QA phase can finish with some tests still `[ ]` because each of them returned the per-test blocked line `error: blocked — test <T>: <cause>`. Today the autonomous forks flip the QA ledger entries only when the UI-test index is **all `[x]`**:

- `E` (task flow): `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Override G`, the `E` bullet;
- `R4` (user-review flow): `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override G — pause/resume + flow-progress ledger (fixing half)`, the `R4` bullet.

The canonical ledger template's entry text (`plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3`) says the same. A blocked-only remainder would therefore leave `E` / `R4` `[ ]`. That fails the `### 1.8` completion check, and a resume re-enters a phase with nothing fixable in it. After this task, a QA phase whose last round left only blocked tests `[ ]` is resolved, and the entries flip.

**Depends on:** Task 11 (the blocked line), and Task 4 (an appended entry in `plan_orchestration_instructions_autonomous.md`; this task edits that file's `## Override G` `E` bullet only). Task 16 edits other parts of `user_review_fixes_instructions_autonomous.md` and `plan_orchestration_instructions_autonomous.md` and depends on this task.

**What "resolved" means, stated once for both entries:** the phase's last E.2 round decided PASS, where PASS is now "no `[ ]` entry remains except tests that returned `error: blocked — ` this round" (Task 12's E.2 rewrite). Each blocked test is reported in D.2's QA bullet. **Ledger ids `E` and `R4` do not change**: `cli/templates/scripts/lib/harness-run-lib.sh` parses the ids, never the entry text.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md` (`## Override G` → the `E` bullet)
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` (`## Override G` → the `R4` bullet)
- `plugin/instructions/autonomous_pause_and_ledger.md` (`### 1.3` → the `E.` and `R4.` template lines)

**Work:**

- [ ] `plan_orchestration_instructions_autonomous.md` → `## Override G` → the `E` bullet: add to the list of resolved outcomes "QA passed with only per-test-blocked tests left `[ ]` (E.2's round PASS)". Leave its `[-]`-seeding and never-flipped text unchanged.
- [ ] `user_review_fixes_instructions_autonomous.md` → `## Override G` → the `R4` bullet: add the same outcome to "the UI-test index all `[x]`, or `no_ui`, or a no-op augment".
- [ ] `autonomous_pause_and_ledger.md` → `### 1.3` templates: in `- [ ] E.      QA passed (UI-test index all [x] / no_ui)` and `- [ ] R4. QA passed (UI-test index all [x] / no_ui / no-op augment)`, change only the parenthetical, to add "or only blocked tests left". Keep the leading `- [ ] E.` / `- [ ] R4.` token, its spacing and every other template line byte-identical.

**Verification:**

- `git grep -n -E -e '^- \[ \] (E\.|R4\.)' -- plugin/instructions/autonomous_pause_and_ledger.md` shows the two edited lines with ids and leading spacing unchanged against `git show HEAD:plugin/instructions/autonomous_pause_and_ledger.md`.
- Grep `cli/templates/scripts/lib/harness-run-lib.sh` for how it reads ledger lines, and confirm it keys on the id and the marker only, never the entry text. If it does key on the text, stop and report a blocker instead of editing the template.
- Walk an autonomous user-review round on paper: Phase QA ends with test 4 blocked and the rest `[x]`. `R4` flips `[x]`, `### 1.8`'s completion check passes, and D.2 lists `Test 4 — <cause>`.
