### 1. The canonical code-review sample still asks a fix to re-run another task's verification, and claims the suite is green

**Severity:** Should Fix

**Site anchors**

- `plugin/samples/sample_code_review/finding_1.md`: the last sentence of the fix, *"Re-run Task 1's own `**Verification:**` step ("`fetchRecentSearches` returns records in most-recent-first order for a store holding more documents than `limit`") against a store seeded with more than `limit` records rather than the two-record fixture."*
- `plugin/samples/sample_code_review.md`: the Context paragraph opening *"Every accompanying test the touched layers' conventions documents require is present and green:"*.

**Problem**

This branch makes `plugin/instructions/unit_loop_core.md` → `## The test-run rule` binding on every writer of a findings index. Point 4 reads: *"A `**Verification:**` bullet, a finding's fix and a sub-step never name `<test_cmd>`, a gate script, or a test file the unit neither creates nor edits."* Per point 1, the suite runs only in `## Phase G — Run gates`.

The two sample files above are the canonical format reference for three agents:

- `branch-reviewer.md` and `skeptic-reviewer.md` each say their output is *"byte-compatible with it"*.
- `review-plan-reviewer.md` grades findings against it.

The branch did not change either sample. The story index's scope-register derivations (E1–E8) grep for `test_cmd`, `commands.test`, phase-order strings and rosters, so none of them reach `plugin/samples/`. Both sentences now contradict the contract this branch shipped:

1. **The fix asks for a test run the rule forbids.** Finding 1's fix edits `src/data/search/searchService.ts` and `SearchPanel.tsx`, and names no test file for the fix to create or edit. It then says to *"Re-run Task 1's own `**Verification:**` step"*. That step is covered by Task 1's test, a file this fix neither creates nor edits. A `branch-reviewer` or `skeptic-reviewer` that copies this pattern ("re-run Task N's verification") writes a finding that:
   - `review-plan-reviewer` must grade **Must Fix**, under its new bullet *"A finding whose fix or sub-step asks for a test run the rule forbids … is a **Must Fix**"*;
   - `layer-implementer` must refuse and record as *deferred to the Run gates phase* (its **What you run, in every mode.** paragraph).

   The result is meta-review churn from the reference file itself. The sentence's intent is sound: the two-record fixture hides the defect. That intent survives if the fix **edits** the test, because running an edited file is exactly the allowance point 3 gives.
2. **The sample review claims a suite verdict no one has produced.** Under this branch no unit runs the suite before Phase G, and the reviewer runs none either. This branch's own code review says so: *"Nothing here claims a suite verdict, because this review runs no suite."* The sample's Context still asserts every accompanying test is *"present and green"*, so a reviewer that follows it states a pass that nothing established.

**Fix**

Do not point either sample at `## The test-run rule`: its **Who may cite this.** roster forbids any citer outside the roster, and `plugin/samples/` is not on it.

- [ ] In `plugin/samples/sample_code_review/finding_1.md`, replace the sentence
  *"Re-run Task 1's own `**Verification:**` step ("`fetchRecentSearches` returns records in most-recent-first order for a store holding more documents than `limit`") against a store seeded with more than `limit` records rather than the two-record fixture."*
  with
  *"Then extend Task 1's test, `src/data/search/records/recentSearchRecord.test.ts`, with a case that seeds the store with more than `limit` records and asserts that `fetchRecentSearches` returns them most-recent-first, because the two-record fixture is too small to show this defect. That test file is one this fix edits, so it is the only test the fix runs; the full suite runs later, in the Run gates phase."*
- [ ] In `plugin/samples/sample_code_review.md`'s Context paragraph, replace
  *"Every accompanying test the touched layers' conventions documents require is present and green:"*
  with
  *"Every accompanying test the touched layers' conventions documents require is present. Whether they pass is the Run gates phase's to establish, because this review runs no suite:"*
  and leave the rest of the sentence (*"the record's stored round-trip and the extracted label's own test."*) unchanged.
- [ ] Leave the index's readiness entry for Finding 1 and its `_(layer: data, presentation)_` tag unchanged. The test file sits under `src/data`, a layer the tag already names.

**Verification:** typecheck only. Both edits are sample prose, and no test file is created or edited.
