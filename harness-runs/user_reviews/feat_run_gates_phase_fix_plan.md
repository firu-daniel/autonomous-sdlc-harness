# User-Review Fix Plan: feat_run_gates_phase

## Context

**Branch:** `feat_run_gates_phase`
**Source user review:** `harness-runs/user_reviews/feat_run_gates_phase_review.md`
**Summary:** The user flagged 2 observations about the Run gates phase's `G.4` fix loop. When one regression fails many tests, each test's unit re-does or invents a fix that an earlier unit already landed. The user wants a per-unit "still failing?" check with its own `already passing — ` close route (Must Fix). Separately, the test fix plan writer may add an advice-only suspected-shared-cause note and order findings to match (Should Fix). Both were verified against the current tree and both are valid.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom, and the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only, and the committer never touches them.

Each entry resolves to a self-contained `harness-runs/user_reviews/feat_run_gates_phase_fix_plan/finding_<K>.md` file via its `**Finding K**` reference. Sorted lowest blast-radius first, wider changes last.

1. [ ] **Finding 2** — Let `test-fix-plan-writer` add an advice-only "suspected shared cause" note to a finding, and order the likely root-cause finding first, without ever merging findings. _(layer: plugin)_
2. [ ] **Finding 1** — Give a row `G.4` unit a before/after check of its own named test, through a narrow exception to the test-run rule, plus a new `already passing — ` close marker that takes the dispositioned route under its own commit record. _(layer: plugin)_

---

## Must Fix

### 1. A `G.4` unit re-fixes a test an earlier unit's fix already cleared, with no way to close it as already passing
→ [finding_1.md](feat_run_gates_phase_fix_plan/finding_1.md)

---

## Should Fix

### 2. `test-fix-plan-writer` cannot flag a suspected shared cause between failing tests
→ [finding_2.md](feat_run_gates_phase_fix_plan/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

_None._ Both observations were verified against the current tree and are valid.

---

## Source observations

Verbatim copy of `harness-runs/user_reviews/feat_run_gates_phase_review.md`, so this fix plan is self-contained. The implement flow does not re-read the user-review file.

1. **One regression that fails many tests runs a full fix unit for every failing test, even after the first fix has cleared them all**

   The gate run executes the whole suite once and `test-fix-plan-writer` writes one finding per failing test. That part is right. The failure is what happens next. Say one regression makes 10 tests fail: the plan gets 10 findings, and row `G.4` walks 10 fix units, each one implement → review → commit. The fix for Finding 1 usually clears most or all of the other nine. Findings 2–10 then reach an implementer with nothing left to fix. The best outcome is nine wasted units. The worse ones are an implementer that returns a blocker on a no-op, or one that invents an edit so it has something to commit.

   Keep one finding per failing test. Do **not** make the writer group failures by a shared cause. A test log shows what failed, not why, so the writer can get a shared cause wrong. Two tests with different causes merged into one finding means one of them silently loses its fix until the next gate round. A fix can also clear some tests and leave others failing, and per-test findings handle that correctly.

   Instead, let the `G.4` implementer check whether its own test still fails, before it edits anything and again after:

   - **Before editing:** run the test file(s) the finding names through `<test_file_cmd>`.
     - If the named test now passes, an earlier unit's fix already covered it. Make no edit and close the unit with the cause "already passing after an earlier fix".
     - If it still fails, implement the fix. Then run the same file(s) again to confirm the named test passes, and report the result in the return.
   - **When no single-file command is stated, or it is refused:** check whether the finding's fix site already carries the fix. If it does, close the unit the same way. If not, implement it. Either way, the next gate round is the backstop.

   This needs a narrow exception to `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point (1), which today lets a unit run only test files it created or edited. The rule's reason for that limit is *"choosing one means searching for and understanding what each test covers"*. That reason does not apply to a `G.4` unit, because the finding names the test, so there is nothing to search for. Limit the exception to row `G.4` and to the test file(s) the finding names. It must not let the unit run `<test_cmd>`, the gate script, or any other test file.

   Do **not** solve this by having an implementer re-run the full suite after its fix, or by having `run-test-suite.sh` write per-test result files that a later unit checks for. A full suite per unit multiplies the suite's run time by the number of failures, which is what the test-run rule exists to prevent. Per-test result files would mean parsing every test runner's output format, and the wrapper is deliberately runner-agnostic: it sees only the command's exit code.

   The "already passing" close needs its own route in the unit loop. Do not reuse the `prohibited — ` dispositioned outcome. That outcome means the work is *"impossible for any agent in this flow"*, so reusing it would put the wrong reason on the record. Add a second marker, for example `already passing — `, that takes the same route:

   - the review step is skipped;
   - the readiness entry flips `[ ]`→`[x]`;
   - the committer commits the index and the detail file with that cause on the commit record.

   `layer-implementer.md`, `committer.md` and `unit_loop_core.md` → `### The dispositioned outcome` each need to state it. Update every file that quotes the marker set.

2. **Let the test fix plan writer flag a suspected shared cause, as advice only**

   Separately from observation 1, and cheap: `test-fix-plan-writer` may add a *suspected shared cause* note to a finding, for example "likely the same cause as Finding K". It may also order the likely root-cause finding ahead of the findings it probably clears. This is advice only, never a merge. Every failing test keeps its own finding and its own readiness entry. The point is that observation 1's "already passing" close fires more often, so fewer units do redundant work.
