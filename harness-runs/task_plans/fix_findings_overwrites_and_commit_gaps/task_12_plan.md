### Task 12 — Parse the per-test blocked marker in the task-plan flow's Phase E

**Goal:** Fix the family-1 caller half of defect 8. `plugin/instructions/plan_orchestration_instructions_core.md` → `## Phase E — QA testing` treats every per-test `error:` as a stop condition, including "an auth-gated test blocked with no credentials". After this task, Phase E matches the qa-tester's per-test blocked line, keeps the phase running, leaves that test `[ ]`, and reports it. Only an unmarked `error:` still halts. Phase E is also run by reference from the user-review flow's Phase QA, so this one edit covers both.

**Depends on:** Task 11, which defines the return in `plugin/agents/qa-tester.md`. Also Task 5, which edits B.2 / C2.2 / G.2 of the same file; this task edits Phase E, `### D.2 Done summary` and `## Stop conditions` only.

**The return this task parses, exactly as Task 11 defines it:**

- `verdict: PASS`: mark passing (unchanged).
- `verdict: FAIL` + `findings_file:` + `must_fix_count:`: a failing test (unchanged).
- `error: blocked — test <T>: <one-line cause>`: **a per-test blocked test.** Match the literal prefix `error: blocked — ` and never the cause's wording. It wrote no file, it is neither a pass nor a failure, and the phase continues.
- `error: <reason>` without that marker: run-wide, stop and `<escalate>` (unchanged). **The fail-safe direction is halt**: an `error:` line that does not begin with the exact marker is the halting kind.

### Targets

- `plugin/instructions/plan_orchestration_instructions_core.md` (`### E.1`, `### E.2`, `### E.4`, `### D.2 Done summary` → the QA bullet, `## Stop conditions` → the per-test `error:` bullet)

**Work:**

- [ ] `### E.1`:
  - add the blocked line to "Collect each dispatch's short return (…)", and say a blocked test gets no mark-pass dispatch;
  - rewrite the "**Where `test_credentials` come from**" paragraph's closing sentences. They currently say the absent-credentials case is relayed "through the existing **E.2** per-test `error:`/`blocked` handling (a per-test `error:`/`blocked` is already a stop condition …)". Say instead that it arrives as the per-test blocked line and takes E.2's blocked arm, which is not a stop.
- [ ] `### E.2`:
  - add a **per-test blocked** arm: record `<T>` and its cause for the round, roll it into the merged index's Context pass/fail/blocked count when the round FAILs, and continue;
  - rewrite **Round PASS** to "no `[ ]` entry remains in `<ui_test_index>` except tests that returned the blocked line this round". Tear down and go to Phase G as today, carrying the blocked list to D.2;
  - narrow the **per-test `error:`** arm to an unmarked `error:` and drop its "an auth-gated test blocked with no credentials" example;
  - **Round FAIL** stays "at least one `verdict: FAIL`".
- [ ] `### E.4`: one sentence. A re-test round re-dispatches still-`[ ]` tests, the previously blocked ones included, since an account may have freed. `MAX_QA_ROUNDS` still counts FAIL rounds only, so a blocked-only remainder ends the phase rather than looping. That is the lessons-ledger rule that every unattended retry is bounded.
- [ ] `### D.2 Done summary` → the **QA (Phase E)** bullet: append the clause `; N test(s) blocked — Test <T> — <cause>[, …]`, omitted entirely when N is 0. Task 13 writes the same clause in `user_review_fixes_instructions_core.md` → `### D.2 Done summary`, so the two Done summaries agree. `## Stop conditions` → the "Any per-test `qa-tester` dispatch returns `error:`" bullet: say an unmarked `error:`, and drop the credentials example.

**Verification:**

- `git grep -n 'error: blocked — ' -- plugin/instructions/plan_orchestration_instructions_core.md` shows E.1, E.2 and D.2 matching the exact literal Task 11 defined in `plugin/agents/qa-tester.md`. A byte comparison of the two literals passes.
- `git grep -n 'blocked with no credentials' -- plugin/instructions/plan_orchestration_instructions_core.md` returns nothing.
- Walk a round on paper: test 1 passes and is marked; test 2 returns the blocked line, so it is recorded and stays `[ ]`; test 3 passes. The round is PASS with one blocked, there is no E.3 and no re-test, and D.2 lists `Test 2 — <cause>`. Then the same round with test 3 FAILing: it is a Round FAIL, the merged index Context counts test 2 as blocked, and E.4 re-runs tests 2 and 3.
