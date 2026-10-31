### 2. `ARCHITECTURE.md` still states that `classify_run_exit` branches on four signals and that completion survives an engine change untouched

**File:** `ARCHITECTURE.md` → `## 5. Where the engine is reached — the launch path`: the `classify_run_exit` table row (*"A process exit status, and four signals"*) and the **[shipped]** paragraph after the table (*"The honest negative result of this inventory"*); and `## 7.` operation 7, **Exit with a status.** (*"two by the session under the plugin's instructions"*)

After Task 3, `classify_run_exit` does not end on `rc -eq 0` against non-zero. A zero exit is `completed` only when `hr_run_ledger_state` reads the run's own ledger as finished: `<state_dir>/flow_progress/<branch>_progress.md` for the task and user-review engines, and the checklist `<state_dir>/docs_catalog/<branch>_docs.md` for docs. An unfinished ledger makes it `paused` (`unfinished`). The flow writes that ledger under the plugin's instructions, so it is a session-authored filesystem sentinel, the same kind as `PAUSE_ACK` and `question_<n>.md`.

`ARCHITECTURE.md` still says otherwise, in shipped-fact terms, at three places:

- The table row lists four signals that end on `rc -eq 0`.
- The paragraph says the classifier branches "only then on `rc -eq 0` against non-zero", and concludes *"Stall and completion therefore survive an engine change untouched — that is the part of the outer loop a second runtime gets for free"*.
- Operation 7 counts two session-written sentinels.

A reader sizing a second runtime from §7 would conclude that `completed` needs nothing from the session. In fact a runtime that does not execute the same flow assets would leave no ledger, and every exit would fall into the absent-ledger arm.

The task prompt's goal 6 asks for every document that states when a run is marked `completed` to be updated. The scope register's derivation greps (`stamps the run`, `stamped \`completed\``, `classified \`completed\``) do not match this phrasing, which is how it was missed. Task 7 updated only the `spawn_engine` row.

**Fix:** edit `ARCHITECTURE.md` in three places.

1. In the `classify_run_exit` row, replace the "What it binds" cell's `— then \`rc -eq 0\` against non-zero.` with:

   `— then \`rc -eq 0\` against non-zero, and on a zero exit the run's own ledger (\`hr_run_ledger_state\`: the flow-progress ledger, or the docs checklist), which splits it into \`completed\` and \`paused\` (\`unfinished\`); an absent or unreadable ledger keeps \`completed\`.`

2. In the **[shipped]** paragraph after the table:
   - Replace `and only then on \`rc -eq 0\` against non-zero — and every one of those four but the last is a` with `then on \`rc -eq 0\` against non-zero, and on a zero exit on the run's own ledger (the flow-progress ledger, or the docs checklist) — and every one of those signals but the exit status is a`.
   - Replace `while \`PAUSE_ACK\` and \`question_<n>.md\` are written by the **session**` with `while \`PAUSE_ACK\`, \`question_<n>.md\` and the ledger are written by the **session**`.
   - Replace `**[designed]** Stall and completion therefore survive an engine change untouched — that is the part of the outer loop a second runtime gets for free, and a section that listed only couplings would have hidden it.` with `**[designed]** Stall therefore survives an engine change untouched — that is the part of the outer loop a second runtime gets for free, and a section that listed only couplings would have hidden it. Completion survives only as far as the session writes the same ledger; a session that writes none is still classified \`completed\` on its exit status, because an absent ledger keeps \`completed\`.`
   - Replace the closing sentence's `**[designed]** Pause and park do not come free in the same way:` with `**[designed]** Pause, park and the ledger's half of completion do not come free in the same way:`.
3. In `## 7.` operation 7, replace `two by the session under the plugin's instructions (\`PAUSE_ACK\`, \`question_<n>.md\`)` with `three by the session under the plugin's instructions (\`PAUSE_ACK\`, \`question_<n>.md\`, and the run's ledger, read on a zero exit)`.

No test covers `ARCHITECTURE.md`, so this fix runs none.
