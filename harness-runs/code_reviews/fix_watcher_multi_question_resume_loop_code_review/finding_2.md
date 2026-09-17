### 2. `ARCHITECTURE.md`'s `classify_run_exit` inventory still describes the pre-branch branching order and park signal

**File:** `ARCHITECTURE.md`. The row in the §5 inventory table whose first cell starts "`autonomous-watcher.sh` → `classify_run_exit`", and the paragraph that starts "**[shipped]** The honest negative result of this inventory is that exit classification is its least engine-bound site".

**Problem.** Both are marked `[shipped]` and describe what `classify_run_exit` branches on. The branch changed that function in two ways, and neither text was updated. The scope register missed this file because derivation entries C1–C4 do not search `ARCHITECTURE.md`.

- **The park signal is no longer "an unanswered `question_<n>.md`".** After archiving the `resumed_for_index` set, the function now sets `parked=1` for **any** numbered top-level `question_<n>.md`, answered or not (the loop after the comment "A pair still at the top level after the archival above => parked too").
- **A new branch sits between the park decision and the `parked` status.** THE PARK-LOOP GUARD reads the watcher's own registry fields `resume_kind`, `resume_max_question_index`, `resumed_at_epoch` and `park_loop_cycles`, plus the highest question index on disk, and it can end the classification with `park_loop` instead of `parked`.

The row currently reads "A process exit status, and four filesystem signals: the `stall_killing` registry flag, `PAUSE_ACK`, the `question_<n>.md` / `answer_<n>.md` pairing, then `rc -eq 0` against non-zero." The paragraph currently says "on an unanswered `question_<n>.md` in the clarification channel". Both are now inaccurate as statements of shipped behaviour. The paragraph's engine-coupling conclusion still holds: every field the guard reads is the watcher's own, like `stall_killing`.

**Fix.**

- [ ] In the table row, replace the second cell's text `A process exit status, and four filesystem signals: the `stall_killing` registry flag, `PAUSE_ACK`, the `question_<n>.md` / `answer_<n>.md` pairing, then `rc -eq 0` against non-zero.` with:

  `A process exit status, and four signals: the `stall_killing` registry flag, `PAUSE_ACK`, any `question_<n>.md` left at the top level once the resumed-for pairs are archived — judged for a park-resumed session by the park-loop guard, which reads only the watcher's own registry fields — then `rc -eq 0` against non-zero.`

- [ ] In the paragraph, replace `on an unanswered `question_<n>.md` in the clarification channel,` with:

  `on any `question_<n>.md` still at the top level of the clarification channel once the pairs a park-resume consumed are archived — where, for a session the park resume launched, the park-loop guard can turn that park into `park_loop` using only the watcher's own registry fields (`resume_kind`, `resume_max_question_index`, `resumed_at_epoch`, `park_loop_cycles`) —`

  Leave the rest of the sentence, including "every one of those four but the last is a **filesystem sentinel**", as it is.
