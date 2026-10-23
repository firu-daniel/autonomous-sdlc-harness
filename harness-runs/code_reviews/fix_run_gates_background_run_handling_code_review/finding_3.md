### 3. `docs/sandbox-verification.md` still lists WF4 as owed in its headline and its F5 row, though its own stamp says BG10 superseded it

**File:** `docs/sandbox-verification.md` — the headline bullet "WF2–WF4, the sandboxed re-runs, are owed (§5)" and the `## 5. Failures and their follow-ups` F5 row "Owed: WF2–WF4. WF5 not run."

**Problem.** This branch changed the Run gates wait form's stamp to *"WF2 and WF3 not taken · WF4 superseded by BG10 · WF5 not run"*, and gave row WF4 the verdict **superseded by BG10**. Two places in the same document still list WF4 as owed:

- the fourth bullet of **The headline, before the rows.**: *"`fix_run_gates_wait_form_sandbox` makes the mtime of `<label>.running` the liveness signal; WF2–WF4, the sandboxed re-runs, are owed (§5)."*
- the F5 row's last cell: *"Owed: WF2–WF4. WF5 not run."*

The document's own **Who reads this:** says *"A later change re-runs a row rather than re-arguing it."* A maintainer working through the owed list from the headline or from F5 would take WF4, the self-detached `nohup` call issued through `--allowedTools`, which this branch retired in favour of BG10.

**Fix.** Edit only those two spans:

- headline: `WF2–WF4, the sandboxed re-runs, are owed (§5)` → `WF2 and WF3, the sandboxed re-runs, are owed, and WF4 is superseded by BG10 (§5)`;
- F5 row: `Owed: WF2–WF4. WF5 not run.` → `Owed: WF2 and WF3; WF4 superseded by BG10. WF5 not run.`

Leave the rest of the F5 row as it is: it records what `fix_run_gates_wait_form_sandbox` shipped at the time. This is a prose-only edit, and no test runs for it.
