# Architecture review — iteration 1

Iteration 0's Must Fix (Task 5's undeclared `<…_index>` names) is resolved. `task_5_plan.md` now fixes `<meta_review_index>` and `<test_fix_review_index>` and declares each one where it is bound.

## Must Fix

1. **Task 13 leaves the supervised QA flow's `### 3.` collect sentence breaking out of the test loop on any per-test `error:`, so a blocked test still cuts the round short.** Offending file: `task_13_plan.md`. Rule sources:
   - `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`: *"The plugin corpus quotes its own literal wire strings across files, so a rename is an edit to every quoting file … A literal only one side knows about is a silent contract break"*.
   - `.claude/context/plugin.md` → `## The placeholder vocabulary`: *"Changing a shape is a change to every reader of it"*.
   - `.claude/context/plugin.md` → `## Wires: dispatch in, return out`, where the `error:` marker is *"a wire the caller discriminates on"*.

   Task 11 changes the qa-tester's return contract. A per-test blocked test now returns `error: blocked — test <T>: <cause>`, and the caller must **continue** the round. `plugin/instructions/qa_test_instructions.md` reads that return in two places:
   - `### 4. Aggregate the per-test returns, present findings to the user, and STOP`. Task 13 rewrites this one.
   - `### 3. Bind this round's findings folder, then dispatch `qa-tester` once per UI-test case`, in the sentence after the dispatch block: *"Collect each dispatch's short return keyed by test number; do not branch to step 4 until you have looped every test in the index (except on a per-test `error:`, which you surface immediately per step 4)."* Task 13 does not target this one.

   The new blocked line starts with `error:`. So after Task 13, step 3 still tells the orchestrator to leave the dispatch loop the moment a test is blocked, and the tests after it are never dispatched. Step 4's new "continue" arm cannot repair that, because the loop has already exited. The consumer is then only half migrated to the new wire. Task 12 handles the equivalent sentence in the task-plan core: its `### E.1` bullet edits "Collect each dispatch's short return (…)". Task 13 has no matching edit for the supervised flow.

   **Fix:** In `task_13_plan.md`:
   - Add `### 3. Bind this round's findings folder, then dispatch `qa-tester` once per UI-test case` → the "Collect each dispatch's short return …" sentence to `### Targets`.
   - Add a `**Work:**` sub-bullet under the existing `qa_test_instructions.md` bullet, to stay within the five-bullet ceiling. It narrows the early-exit clause to an **unmarked** `error:`, meaning one that does not begin with the exact literal `error: blocked — `. It also says that a blocked return is collected like any other return and the loop goes on to the next test.
   - Extend the first `**Verification:**` bullet so that `git grep -n 'per-test .error:' -- plugin/instructions/qa_test_instructions.md` shows every remaining hit qualified as unmarked.
   - Extend the supervised on-paper walk to three tests where test 2 is blocked, and confirm that test 3 is still dispatched.

## Should Fix

1. **Task 10 makes `## The unit loop` step 5 read `<per_unit_review>`, but the binding table's `Used at` cell is not updated.** This was raised in iteration 0 and is still unaddressed: the index has no `## Rejected findings` entry for it. Offending file: `task_10_plan.md`. Rule sources:
   - `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`;
   - `plugin/instructions/mode_contract.md` → *"The citing core must declare, in its own binding table, every binding its cited sections consume"*.

   The `<per_unit_review>` row of `plugin/instructions/unit_loop_core.md` → `## Mode contract — bindings this file uses` lists its uses as step 4, `### Per-unit review step` and `## Layer routing table`. After Task 10, step 5 reads it too, to decide whether to send `unit_findings_folder:`.

   **Fix:** Add a sub-bullet under the existing step-5 Work bullet that extends that row's `Used at` cell with "`## The unit loop` step 5 (whether to send `unit_findings_folder:`)".

2. **Task 9 adds the dispatch key `unit_findings_folder` but does not add it to `committer.md`'s `## Resolved values` list of dispatch keys.** This was raised in iteration 0 and is still unaddressed. Offending file: `task_9_plan.md`. Rule source: `.claude/context/plugin.md` → `## The sections an asset carries` / `## The placeholder vocabulary`.

   The lead sentence of `plugin/agents/committer.md` → `## Resolved values` lists the dispatch keys the body resolves where they appear (`plan_path`, `task_file`, `meta_findings_folder`, `mode`, …).

   **Fix:** Add a sub-bullet under the `## Invocation contract` Work bullet that inserts `unit_findings_folder` into that list, beside `meta_findings_folder`.

3. **Parity/staleness note, not blocking.** Task 5 corrects B.3 / C2.3's explanation that a first-pass PASS "created no folder". `plugin/agents/committer.md` → the `meta_findings_folder` bullet carries the same now-incomplete reason: *"since a meta-review that passed on its first iteration wrote no findings and created no folder"*. On a later round the folder already holds an earlier round's tracked files. Behaviour does not change, because the caller-side guard still decides. The reason given there goes stale, though. Consider having Task 9, which already edits `committer.md`'s `## Invocation contract`, adjust that clause.

## Nice to Have

None.
