### 1. A `G.4` unit re-fixes a test an earlier unit's fix already cleared, with no way to close it as already passing

> **Self-contained per-finding file** for `harness-runs/user_reviews/feat_run_gates_phase_fix_plan.md`. The implementer reads only this file to apply the fix. The committer flips this finding's entry in the index's `## Phase 2 Readiness — Ordered Fix List`, never here. Every edit lands under `plugin/` (the `plugin` layer). This is a wire change, so follow `.claude/context/plugin.md` → `## Verifying a change in this layer`: re-derive the readers with grep, and do not rely on reading only the files you changed.

**Files and site anchors (all grep-verified in the current tree):**

- `plugin/instructions/unit_loop_core.md`:
  - `## The test-run rule`, point 1 — "No unit runs `<test_cmd>`, a gate script it runs, or a test file the unit did not create or edit."
  - `## The unit loop` step 3 — "Receive its return and read a blocker line in **two arms**"
  - `### The dispositioned outcome`
  - `## Mode contract — bindings this file uses` — the `<escalate>` row, and "**The third unit outcome adds none either.**"
  - step 6 — "**When any layer of this unit took `### The dispositioned outcome`, the line gains one more clause**"
  - `## Resolved values` — the `<test_file_cmd>` row
  - `#### Row G.4 — test-fix items`
- `plugin/agents/layer-implementer.md`:
  - `## Resolved values` — the `<test_file_cmd>` row, "Used only for test files this unit created or edited"
  - `## Working modes` — "**What you run, in every mode.**"
  - `## Output contract` — item 5, and the two named blocker forms ("in **one of two named forms**")
- `plugin/agents/committer.md`:
  - the `disposition` argument bullet — "`disposition` — (optional; `task` / `review_item` only)"
  - `## Commit-message policy` → the **Subject reconciliation** bullet — "with a `disposition` argument, `<commit_prefix>: record disposition of <unit token> — <cause>`"
- `plugin/agents/test-fix-plan-writer.md`:
  - `## Process` step 6, the `**Per-finding files**` paragraph — "the failure quoted from the log, rewritten per step 5"
- `plugin/instructions/plan_orchestration_instructions_core.md`:
  - `## Stop conditions` — "**One exclusion:** a blocker the unit loop closes the unit on under"
- `plugin/instructions/user_review_fixes_instructions_core.md`:
  - `## Stop conditions` — "**Not one kind:** the blocker the cited `unit_loop_core.md` → `### The dispositioned outcome` closes an item on"
  - `## Mode contract` — the `<escalate>` row, "a marked one takes `### The dispositioned outcome` and never reaches this binding"

## Problem

Phase G runs the full suite once, and `test-fix-plan-writer` writes one finding per failing test. That is correct and stays. Row `G.4` then walks one implement → review → commit unit per finding. When one regression fails ten tests, the fix for the first finding usually clears the other nine. Those nine units then reach `layer-implementer` with nothing left to fix. Today the implementer has no way to find that out:

- `## The test-run rule` point 1 forbids running any test file the unit did not create or edit. The named failing test is exactly such a file.
- The only non-escalating close is the `prohibited — ` dispositioned outcome. Its meaning is *"impossible for **any** agent in this flow"*, and `layer-implementer.md` admits it only for a standing prohibition or an unsatisfiable gate. An already-cleared test is neither.

So the unit either redoes an edit that is already in the tree, returns an ordinary `blocker:` on a no-op (which `<escalate>`s and halts the loop), or invents an edit so it has something to commit. The best case is nine wasted units. The other two cases halt the run or land a spurious change.

Point 1 gives its own reason for the limit: *"choosing one means searching for and understanding what each test covers"*. That reason does not hold for a `G.4` unit, because the finding names the test, so the unit has nothing to search for.

The user explicitly **rejected** these alternatives. Do not implement any of them:

- grouping failures by shared cause in the writer;
- a full-suite re-run per unit;
- per-test result files written by `run-test-suite.sh`. That wrapper stays runner-agnostic and sees only an exit code.

## Fix

### A. The test-run rule gains a narrow row-`G.4` exception (`unit_loop_core.md` → `## The test-run rule`)

- [ ] Amend point 1 so that it reads, in substance: *no unit runs `<test_cmd>`, a gate script, or a test file it did not create or edit — except a row `G.4` unit, which may run the test file(s) its finding names, through `<test_file_cmd>` only.* Add one sentence saying why the exception fits the rule's own reason: the finding names the test, so nothing is searched for. State the bounds explicitly. The exception covers **only** row `G.4` and **only** the file(s) the finding names, and it never covers `<test_cmd>`, a gate script or any other test file. Point 3's "the one exception" wording must no longer say *one*: either renumber it as a second exception or reword it. Do not leave two statements that contradict each other.
- [ ] Leave point 4 unchanged: no plan asks for a test run. This check comes from the rule, not from the finding's text, so the test fix plan still never writes "run the test" into a fix.
- [ ] Update the `<test_file_cmd>` row of `## Resolved values` in this file, which says the command is for a unit's own test files, so that it also names the row-`G.4` use.
- [ ] Keep the heading `## The test-run rule` byte-identical. Its roster citers point and never restate, so a heading change would strand them. Grep the roster citers for any that restate point 1's scope: the reviewers' "a test file the task/fix neither creates nor edits" bullets grade **plans**, which fall under point 4, and need no change. Correct any citer that restates point 1 itself.

### B. The implementer's check (`layer-implementer.md`)

- [ ] Under `## Working modes` → "**What you run, in every mode.**", add the row-`G.4` check. The implementer knows it is on row `G.4` by matching its dispatched detail-file path against the `Detail file` cell of `unit_loop_core.md` → `## Substitution table`. That is the same derivation the unsatisfiable-gate paragraph already uses, so the dispatch needs no new argument.
  - **Before editing.** Run the test file(s) the finding names through `<test_file_cmd>`, and judge the **named test's** result, not the file's exit code alone. Other findings may still fail in the same file.
    - **If the named test passes:** make no code edit. Append the record from part C to the detail file, and return the `already passing — ` form.
    - **If it still fails:** implement the fix, run the same file(s) again, and report the named test's after-result in the return.
    - **If the runner output cannot separate the named test's result from the others:** treat the run as not proving a pass, and use the fix-site fallback below.
  - **No single-file command is stated, or the stated one is refused.** Read the finding's site anchor. If the fix site already carries the fix, close the unit the same way and record in the detail file that the close rests on reading the fix site, not on a test run. If it does not, implement the fix. Either way, record the skipped run as the existing evidence-downgrade rule requires. The next gate round is the backstop.
  - **A finding that names no test file** (a failing gate that is not a test) takes the same fix-site fallback. Running a gate script stays forbidden.
  - **A `**Suspected shared cause:**` note** (Finding 2) is advice to the writer's ordering only. It is **never** a reason to close: the close rests on this check alone.
  - **After the fix, the named test still fails.** Report that in the return. It is not a blocker on its own account, because the next gate round re-runs it. The existing blocker for "a failing test file this unit wrote" does not apply, since this unit did not write that file.
- [ ] Update the `<test_file_cmd>` row of `## Resolved values`, which says the command is for test files this unit created or edited, to name the row-`G.4` use as well.
- [ ] Extend `## Output contract` item 5 to add a line for each named test file the row-`G.4` check ran: its before-result and, when a fix landed, its after-result. Otherwise the line reports the skip reason, using the existing `skipped: …` wording.
- [ ] `## Output contract`: change the blocker forms "in **one of two named forms**" to **three**. The new third form is:

  `blocker: already passing — <one-line cause>; record appended to <detail_file>`

  Rules for the third form:
  - It is admitted **only** on a row-`G.4` dispatch, and only after the check above closed the unit.
  - The default cause is `already passing after an earlier fix`, followed by how that was established: the single-file run, or reading the fix site.
  - It follows the same one-line, newline-free and delimiter-free rule as the `prohibited` cause, with the delimiter here being `; record appended to `.

  State that `already passing` is a wire exactly as `prohibited` is. Also state that the two markers are mutually exclusive on one return: a layer that is both refused and already passing is dispositioned.

### C. The detail-file record

- [ ] The implementer appends a `## Already passing` section to the unit's detail file, using the same licence over that file the `## Disposition` record carries. It holds one sub-bullet each for:
  - **(a)** the named test and the file(s) run, or the fix site read;
  - **(b)** the command run and the named test's result, or the fix-site evidence quoted;
  - **(c)** that no code file was edited.

  No readiness marker is touched. That stays the committing role's job.

### D. The unit loop's route (`unit_loop_core.md`)

- [ ] **Step 3's blocker parse** becomes **three arms**:
  - `prohibited — ` takes `### The dispositioned outcome`, unchanged;
  - `already passing — ` takes the same outcome's route, **only on row `G.4`**;
  - anything else `<escalate>`s.

  On any row other than `G.4`, an `already passing — ` return is the escalating kind. This keeps the existing fail-safe direction. Match the new marker as a literal, as the existing one is matched.
- [ ] **`### The dispositioned outcome`**: keep the heading byte-identical, because it is cited across the tree. Add a paragraph that states the second marker and names what it shares and what differs:
  - **Shared with the dispositioned route:** the review step is skipped, the loop continues to the next layer or to step 5, it never parks or escalates, and the readiness entry flips `[ ]`→`[x]`.
  - **Different:** its meaning (the named test already passes after an earlier unit's fix, not *impossible for any agent*); its detail-file record (`## Already passing`); its commit argument (part E); and its step-6 clause.

  Update the "row-neutral" sentence, because this marker is row-scoped. Also update the "third exit" wording, and the `## Mode contract` paragraph "**The third unit outcome adds none either.**", so that it says the new marker adds no binding either.
- [ ] **Step 5.** When any layer of the unit took the `already passing — ` close and **no** layer was dispositioned, the committer dispatch also carries `already_passing: <one-line cause>`. The cause is extracted by position, as `disposition:` is: the text after the first `already passing — ` and before the last `; record appended to `. When a layer was dispositioned, only `disposition:` goes, and the already-passing fact stays in the detail file.
- [ ] **Step 6.** Add the matching progress-line clause `already passing: <cause>`, appended verbatim, with no halt and no `<escalate>`, in the same shape as the `dispositioned:` clause.
- [ ] **`#### Row G.4 — test-fix items`.** Add one bullet pointing at the part-A exception and the part-D route. Point at them rather than restating them.
- [ ] **`## Mode contract` `<escalate>` row.** It currently says a blocker "does **not** carry the `prohibited — ` marker". Name both markers there.

### E. The committer's record (`committer.md`)

- [ ] Add an optional `already_passing` argument beside `disposition`, for `review_item` only, since only row `G.4` sends it. It carries the one-line cause, and like `disposition` it adds no column to `### Which caller sends which mode`. The committer never receives both arguments at once, because part D sends one or the other.
- [ ] In `## Commit-message policy` → **Subject reconciliation**, add the matching template. On the index-only (`No`) path the subject is `<commit_prefix>: mark <unit token> already passing — <cause>`. When other files landed, it becomes a body line carrying the same substring, mirroring the disposition invariant: never in both places and never in neither. Normalise `<cause>` exactly as a disposition cause is normalised. The record must **never** contain the substring `record disposition of `. That substring is parsed by `plugin/agents/statistics-plan-writer.md` and `plugin/instructions/improvement_observations_instructions.md` as an *impossible for any agent* close, and an already-passing unit must not be counted as one. Neither of those two files changes.

### F. Every other quoter of the marker set

- [ ] `plugin/instructions/plan_orchestration_instructions_core.md` → `## Stop conditions` "**One exclusion:**", and `plugin/instructions/user_review_fixes_instructions_core.md` → `## Stop conditions` "**Not one kind:**". Each must also exclude the `already passing — ` close. Otherwise the orchestrator halts on a unit the loop has just closed.
- [ ] `plugin/instructions/user_review_fixes_instructions_core.md` → the `<escalate>` binding row. Name both markers, as in part D.
- [ ] `plugin/agents/test-fix-plan-writer.md` → the `**Per-finding files**` paragraph. Every finding must carry a `**Failing test:**` line naming the failing test file(s), repo-relative, and the test's name as the log reports it. Write `none — <gate name>` for a failing gate that is not a test. The part-A exception is bounded by "the file(s) the finding names", so the finding has to name them explicitly. The rule "No finding asks for a test run" stays as it is.
- [ ] Re-derive the reader set before you finish. Grep for `prohibited — `, `### The dispositioned outcome`, `dispositioned outcome` and `two arms` across `plugin/`, `cli/templates/` and `docs/`. Give every hit that enumerates the close markers or the step-3 arms the new marker. Leave the hits that are about the disposition class alone. This includes the `plugin/docs/` flow documents and `.claude/context/plugin.md`'s `prohibited` wire example, which needs no change unless it claims the marker set is closed.

## Verification

- `claude plugin validate --strict plugin`.
- Run the part-F grep sweep again after the edits. Every enumeration of the close markers should name both.
- Grep `unit_loop_core.md` → `## The test-run rule` and confirm the exception names row `G.4`, `<test_file_cmd>` and "the file(s) the finding names", and that it excludes `<test_cmd>` and gate scripts.
- Grep `committer.md` for `mark <unit token> already passing — ` and confirm `record disposition of ` does not appear in the new template.
