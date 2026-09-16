### 2. The code-review sample's secondary `SearchPanel` citation breaks the precision clause the fixture exists to demonstrate

**File:** [plugin/samples/sample_code_review/finding_1.md:7](plugin/samples/sample_code_review/finding_1.md#L7), with a second site at [plugin/samples/sample_code_review/finding_1.md:18](plugin/samples/sample_code_review/finding_1.md#L18). Anchors: `plugin/samples/sample_code_review/finding_1.md` — "before rendering (`src/presentation/search/components/SearchPanel.tsx` (`SearchPanel`))" and "Then delete the in-memory sort in `SearchPanel`". The line numbers are only hints.

**Problem.** The site-anchor clause this branch puts into seven finding contracts requires *"a quoted substring beside any symbol whose body spans more than the change"*. This fixture's second fix site is the in-memory sort inside the `SearchPanel` component. The `**Fix:**` says *"Then delete the in-memory sort in `SearchPanel`"*. But the fixture cites that site as `` `src/presentation/search/components/SearchPanel.tsx` (`SearchPanel`) `` with no quoted substring. The component's body spans far more than one sort call, so an implementer holding only this file has no string to grep for.

The sibling fixture gets this right. `sample_code_review/finding_2.md` cites the same component as `` (`SearchPanel`) — "useSearchHistory(" ``.

**Who gets it wrong, and how.** `review-plan-reviewer.md` → `## Read first` treats `sample_code_review/finding_1.md` as the per-finding format specification, and resolves any disagreement between a check and the fixture *"in the fixture's favour"*. A meta-reviewer checking a real finding that cites a large symbol with no quoted substring will point to this fixture and pass it. A writer copying the canonical shape will leave the substring out as well.

**Fix.** Add the quoted substring at both sites, in the anchor form the other fixtures use:

- [ ] Description paragraph: replace `` (`src/presentation/search/components/SearchPanel.tsx` (`SearchPanel`)) `` with `` (`src/presentation/search/components/SearchPanel.tsx` (`SearchPanel`) — ".sort(") ``.
- [ ] `**Fix:**` follow-up sentence: replace *"Then delete the in-memory sort in `SearchPanel` —"* with *"Then delete the in-memory sort in `SearchPanel` (".sort(") —"*.
- [ ] No other fixture quotes this sentence. `sample_code_review.md`'s readiness entry says only *"drop the panel's in-memory sort"*, so nothing else changes.
