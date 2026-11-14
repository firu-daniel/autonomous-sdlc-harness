### Task 17 — Restate `autonomous_pause_and_ledger.md` for a round's set: `R1`, resume fallback, PAUSE and overload

**Goal:** Make the canonical pause/resume module describe a plan round whose gates go out together: the `R1` condition it quotes, the planning resume's fallback, where a PAUSE is checked and honoured around a set, and what an overload that kills part of a set leaves behind.

**Depends on:** Task 16, whose fix-plan fork's `R1` bullet now reads exactly `when **both gates PASS** (business-parity step 7 and architecture step 8, one round)`. Task 13, whose task-plan fork checks PAUSE once before a set and honours a PAUSE placed during it at the join, and whose overload rule re-dispatches only a set's dead gates. Task 12, whose core sends a printed set in one message after the per-block safety-contract steps.

**Where this task stops.** This module states the mechanism once; the forks name their own path sets and subjects and are not restated here. The implementation-phase pause rules are untouched.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.5 Who flips` (the **Passed by exclusion.** bullet), `### 1.7 Resume-from-ledger (every fork, on every (re-)entry)` step 4, `### 2.2 Honoring a PAUSE (driving fork, folded into the safety contract)`, `### 2.3 Resuming`, `### 2.5 Self-pause on sustained API overload (no `PAUSE` request involved)`.

**Work:**

- [ ] `### 1.5`: the quoted condition *"when **both gates PASS** (business-parity step 7, then architecture step 8)"* becomes *"when **both gates PASS** (business-parity step 7 and architecture step 8, one round)"*, byte-identical to Task 16's `R1` bullet. `### 1.7` step 4: *"with the round's first reviewer as the fallback"* becomes with the round's whole set of due reviewers as the fallback.
- [ ] `### 2.2`: add, after the numbered checks, a paragraph — **A round's set.** A plan-writing fork whose next action is a set of gate dispatches runs this check once, before the set's first dispatch, never between two of them. A PAUSE placed while a set is out is honoured at the join: the set's returns are all in and recorded, the round's commit has landed, and the check before the next dispatch pauses, its **Planning artifacts only** commit exiting 3; `<n>` / `<k>` is the set's round. In the **Planning artifacts only** step, *"the round of the dispatch the pause interrupts"* gains *"— for a set, the set's round"*. Restate the granularity note's last sentences to say a plan round's set returns as a whole before the check runs again.
- [ ] `### 2.3`: *"so the resumed walk continues at the interrupted dispatch with the round's files committed"* gains: after a pause at a set's join, at the dispatch the join printed — the writer's revision after a `FAIL` round, the UI-test writer after a `PASS` round. `### 2.5` **Action** step 0: *"with `<n>` / `<k>` the round of the dispatch that died"* gains: where some dispatches of a set returned and others died, the returned verdicts are recorded first, their round files stand and are committed, and a resume dispatches only the gates still pending.

**Verification:**

- `grep -nF '(business-parity step 7 and architecture step 8, one round)' plugin/instructions/autonomous_pause_and_ledger.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` finds one hit in each file, the same literal.
- `grep -n "first reviewer\|step 7, then architecture" plugin/instructions/autonomous_pause_and_ledger.md` finds nothing.
- Every `###` heading in the file is unchanged (`git diff` shows no heading line): the forks cite `§2.2`, `§2.5` and `§1.7` by number and heading.
