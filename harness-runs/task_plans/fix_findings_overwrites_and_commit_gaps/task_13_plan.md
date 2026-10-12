### Task 13 — Parse the per-test blocked marker in the supervised QA flow and the user-review fixes core

**Goal:** Fix the remaining caller sites of defect 8. The supervised QA flow aggregates per-test returns itself, in `plugin/instructions/qa_test_instructions.md` → `### 4.`. The user-review fixes core has its own Done summary and stop conditions (`plugin/instructions/user_review_fixes_instructions_core.md`). Both still treat every per-test `error:` as a stop, and neither reports a blocked test.

**Depends on:** Task 11, which defines the return in `plugin/agents/qa-tester.md`. Task 15 edits the augment parts of these two files and depends on this task.

**The return this task parses, exactly as Task 11 defines it:**

- `error: blocked — test <T>: <one-line cause>`: a per-test blocked test. Match the literal prefix `error: blocked — `. It wrote no file, the test stays `[ ]`, and the QA round continues.
- `error: <reason>` without that marker: run-wide, stop (unchanged). Halt is the fail-safe direction for anything that does not begin with the exact marker.
- `verdict: PASS` and `verdict: FAIL` + `findings_file:` + `must_fix_count:`: unchanged.

### Targets

- `plugin/instructions/qa_test_instructions.md` (`### 3. Bind this round's findings folder, then dispatch `qa-tester` once per UI-test case` → the "Collect each dispatch's short return keyed by test number; …" sentence after the dispatch block; `### 4. Aggregate the per-test returns, present findings to the user, and STOP`; the "**Where `test_credentials` come from**" paragraph)
- `plugin/instructions/user_review_fixes_instructions_core.md` (`### D.2 Done summary` → the QA (Phase QA) bullet; `## Stop conditions` → the "`qa-tester` returns `error:`" bullet)

**Work:**

- [ ] `qa_test_instructions.md` → `### 4.`, three edits.
  - Add a **per-test blocked** arm: collect each blocked test's `<T>` and cause, do not stop, and report them to the user alongside the round outcome.
  - Rewrite **Round PASS** to "every per-test dispatch returned `verdict: PASS` or the blocked line", reporting the blocked tests by id and cause.
  - Narrow the **per-test `error:`** arm to an unmarked `error:` and drop its "an auth-gated test blocked with no credentials" example.
  - `### 3.` → the "Collect each dispatch's short return keyed by test number; do not branch to step 4 until you have looped every test in the index (except on a per-test `error:`, which you surface immediately per step 4)" sentence: narrow the parenthesised early-exit clause to an **unmarked** per-test `error:`, one that does not begin with the exact literal `error: blocked — `. State that a blocked return is collected keyed by test number like any other return, and the loop goes on to dispatch the next test. Without this edit step 3 exits the loop on the first blocked test, before step 4's continue arm can run.

  **Round FAIL** keeps its merge-and-present steps, and the merged index's Context roll-up counts blocked tests.
- [ ] `qa_test_instructions.md` → the credentials paragraph (it says the qa-tester self-reads the file): if it says or implies absent credentials stop the run, say instead that each auth-gated test returns the blocked line.
- [ ] `user_review_fixes_instructions_core.md` → `### D.2 Done summary` → the **QA (Phase QA)** bullet: add the blocked-test clause `Test <T> — <cause>` per blocked test, omitted when none. Use the same wording as the task-plan core's QA (Phase E) bullet that Task 12 writes, so the two Done summaries agree. The bullet text is quoted under **Interfaces** below.
- [ ] `user_review_fixes_instructions_core.md` → `## Stop conditions` → "**`qa-tester` returns `error:`** (dev server unreachable, an auth-gated test blocked with no credentials)": say an unmarked `error:`, and drop the credentials example.

**Interfaces.** The blocked clause both Done summaries carry: `; N test(s) blocked — Test <T> — <cause>[, …]`, appended to the QA bullet's pass/skip text and omitted entirely when N is 0. Task 12 writes the same clause in `plan_orchestration_instructions_core.md` → `### D.2 Done summary`.

**Verification:**

- `git grep -n 'error: blocked — ' -- plugin/instructions/qa_test_instructions.md plugin/instructions/user_review_fixes_instructions_core.md` matches the literal in `plugin/agents/qa-tester.md` byte for byte. And `git grep -n 'per-test .error:' -- plugin/instructions/qa_test_instructions.md`: every remaining hit, including the `### 3.` collect sentence and the `### 4.` arm, is qualified as an unmarked `error:` (one not beginning with `error: blocked — `). No hit may leave a blocked return able to end the dispatch loop.
- `git grep -n 'blocked with no credentials' -- plugin/instructions` returns nothing, once Task 12 has landed too.
- Supervised walk on paper: three tests. Test 1 passes, test 2 is blocked, test 3 passes. Step 3 collects test 2's blocked line and **still dispatches test 3**. Step 4 then reports PASS with `Test 2 — <cause>`, assembles no index and commits nothing, as the supervised flow never does.
