`fix_watcher_multi_question_resume_loop` fixes a watcher defect. After a run that parked with several questions
is resumed once and then parks again, the watcher resumes it again on each answer it had already consumed. The
branch also adds a guard that stops any park/resume loop, whatever its cause.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

---

## The defect, as observed

Run `feat_docs_catalog_retrieval`, 2026-09-17. The planner parked before planning with three questions,
`question_1.md` to `question_3.md`, and all three answers were written. Then `watcher.log` shows:

```
13:30:34 resuming parked run 'feat_docs_catalog_retrieval' (answer_1.md found)
14:20:38 run 'feat_docs_catalog_retrieval' parked (clarification waiting) — rc=0
14:20:44 resuming parked run 'feat_docs_catalog_retrieval' (answer_2.md found)
14:21:25 run 'feat_docs_catalog_retrieval' parked (clarification waiting) — rc=0
14:21:30 resuming parked run 'feat_docs_catalog_retrieval' (answer_3.md found)
14:22:09 run 'feat_docs_catalog_retrieval' parked (clarification waiting) — rc=0
```

- **The first resume was correct.** The re-entered engine read all three answers and planned for 50 minutes. It
  then parked legitimately on a new `question_4.md`, because the plan loop reached its revision cap.
- **The next two resumes were spurious.** Each re-entered engine found its answer already used, stayed parked
  and ended. Together they cost about $1.80, plus a "resumed" and a "parked" notification each.
- **The mechanism, as read from the code; confirm it, do not take it from here:**
  - `resume_parked_run` in `autonomous-watcher.sh` records a single `resumed_for_index`, the lowest answered
    index.
  - When the run exits, `classify_run_exit` archives only that one pair into `answered/`.
  - The engine reads every top-level answer it finds (`task_plan_writing_instructions_autonomous.md` →
    `## Override 2 — resumability`, whose case (a) still says "a sibling answer file" in the singular).
  - So pairs 2 and 3 stayed at the top level, used but not archived. When the run parked again, each one looked
    like a fresh answer.

**Why it had not been seen before.** Expause runs an older copy of the same watcher, and its `resumed_for_index`
and `archive_answered_pair` logic are the same. This was checked by hand before this prompt was written; this
run cannot read that repository. Expause's watcher log shows exactly two multi-question parks:
`fix_chat_message_encryption_parity` and `feat_harness_init_command_visibility`, two questions each. Both runs
were resumed once and completed without parking again, so the leftover answers were never offered for a resume.
Every other park there had a single question. The defect needs a multi-question park followed by a second park,
and `feat_docs_catalog_retrieval` was the first run to do both.

## What to deliver

1. **One exchange per park, answered once.** A park should be answered as a unit and consumed as a unit.
   - **Preferred design:** a park writes one clarification file holding every question it raises, and the
     operator answers it in one answer file.
   - **Keep one file per question** only if the plan shows the current layout is needed. For example: agents
     that raise independent questions on different tasks while the run is still active, or questions written
     after the run has already parked. If the layout stays, the watcher must:
     - resume only when every outstanding question of the park has an answer, not on the first one;
     - archive exactly the set of pairs that existed when it resumed, and never an answer written while the
       resumed run was active, which that run never read;
     - handle a question file that appears after the park was recorded.
   - Record which design was chosen and why, and keep every consumer of the channel consistent with it (below).
2. **The consumed set is recorded and archived as a whole.** Whichever layout is chosen, the resume records every
   index or file the re-entered engine will see, and the exit archives exactly that set.
3. **A loop guard that holds even for causes nobody has foreseen.**
   - It detects a resume that makes no progress: the run parks again with no new question and nothing
     consumed, or it cycles within a short window.
   - After a bounded number of such cycles, the watcher stops resuming that run.
   - It gives the run a distinct registry status that `/autonomous-sdlc-harness:branch-status` shows, sends one
     notification that names the loop, and logs the evidence.
   - An operator action clears the status: define it, document it, and make `branch-status` name it.
   - Set the threshold from what a real resume looks like, so a run that parks twice for real reasons is never
     caught.
4. **Every consumer of the channel moves together.** Re-derive the set with
   `grep -rln "question_<n>\|answer_<n>" plugin cli/src cli/templates cli/test docs README.md`. On 2026-09-17 it
   was:
   - the watcher, whose `cli/templates/scripts/` copy and this repository's `scripts/` copy are byte-identical;
   - the autonomous planning, fix-plan and fix-implementation instruction forks;
   - `mode_contract.md`, `autonomous_pause_and_ledger.md` and `clarification_digest_instructions.md`;
   - the `branch-answer`, `branch-status`, `branch-start-plan-autonomous` and
     `branch-start-user-review-fix-autonomous` commands;
   - `plugin/docs/AUTONOMOUS_FLOW.md`;
   - both `clarifications/` and `clarification_digests/` state-dir READMEs;
   - `docs/watcher.md`.

   `/autonomous-sdlc-harness:branch-answer` must still work as a single command. If it answers a whole park,
   say how an operator answers one question of several.
5. **In-flight runs survive the upgrade.** A run parked under the old layout, with pairs at the top level and
   possibly already partly archived, still resumes correctly once, and is not caught by the loop guard.
6. **Tests.** Cover the observed sequence with the watcher's existing test approach (`cli/test/`):
   - a three-question park, answered, resumed once, parked again on a new question, and then **not** resumed
     until that new question is answered;
   - the loop guard firing on a forced no-progress cycle;
   - an answer written during a resumed session not being archived.

## Establish, do not assume

- **The mechanism above,** from `resume_parked_run`, `classify_run_exit` and `archive_answered_pair`, and from how
  the engine's Override 2 actually scans the directory.
- **Whether any agent writes question files while the run keeps going,** as opposed to at the moment it parks.
  That answer decides item 1.
- **How the clarification digest keys its entries.** It currently keys them on the question index, so check what a
  combined file does to the committed digest format and to digests that already exist.
- **Whether the notification kinds** (`parked`, `resumed`) need a new kind for the loop guard, and where that kind
  is declared.

## Out of scope

- Changing when a flow decides to park, or the revision caps that lead to a park.
- The pause/resume path (`PAUSE`/`RESUME` markers), except where the loop guard has to tell the two apart.

## Acceptance

1. The observed sequence, replayed in a test, produces exactly one resume per answered park.
2. A forced no-progress resume cycle stops after the documented bound, with the distinct status, one
   notification and a log line naming the loop.
3. An operator can clear that status with the documented action, and the run resumes normally.
4. A run parked under the old layout resumes once after the upgrade.
5. Every file in the re-derived consumer set describes the same channel. A grep for the retired form, whichever
   it is, finds it only in historical records.
6. `bash scripts/run-gates.sh` prints no new failure.
