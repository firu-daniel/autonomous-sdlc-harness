### 1. S6 and A6 are graded `verified` while their own verdict lines state an unverified part

**File:** `docs/github-integration-research.md`, in four places:
- `### S6. The maximum length of an issue or PR comment body.` → its `**Verdict:**` line and `**Answer:**` paragraph;
- `### A6. GitHub Apps: what one needs hosted, …` → its `**Verdict:**` line and `**Answer:**` paragraph;
- `## Summary` → the `[S6](#s6-…)` row;
- `## Summary` → the `[A6](#a6-…)` row.

**Problem.** `## How this was researched` → **What a verdict grades.** states the document's rule: *"where an answer has a verified part and an unverified part, the verdict is `partly true` and the Answer names which part is which."* Two entries break that rule:

- **S6.** The question asks about *"an issue or PR comment body"*. The verdict line reads *"`verified` for an issue comment created through the REST API; a PR review comment and a PR conversation comment were not measured separately."* So the PR half is unverified by the entry's own account. The Answer does not say so: it states *"262,144 bytes of UTF-8"* for comments in general.
- **A6.** The verdict line reads *"`verified`, except the permission's UI wording."* That is an unverified part, but the Answer never names it.

The summary table then drops both qualifiers and shows a bare `verified` for S6 and for A6. The opening paragraph tells readers that *"An answer marked `verified` … is to be cited rather than re-verified"*. A `feat_forge_run_control` planner who reads the summary would therefore cite 262,144 bytes as a verified limit for a PR review comment, which nobody measured. The entry's verdict line does carry the qualifier, and no measured value is wrong, so this is Should Fix rather than Must Fix.

**Fix.** Make four edits in `docs/github-integration-research.md`. Leave every quote and every evidence line unchanged.

- [ ] S6 `**Verdict:**` line. Replace
  `**Verdict:** \`verified\` for an issue comment created through the REST API; a PR review comment and a PR conversation comment were not measured separately.`
  with
  `**Verdict:** \`partly true\` — verified for an issue comment created through the REST API; a PR review comment and a PR conversation comment were not measured separately.`
- [ ] S6 `**Answer:**`. After its last sentence (*"docs.github.com states no limit on its REST pages."*), append:
  ` This is measured for an issue comment created through the REST API; the limit for a PR review comment and a PR conversation comment is unverified.`
- [ ] A6 `**Verdict:**` line. Replace
  `**Verdict:** \`verified\`, except the permission's UI wording.`
  with
  `**Verdict:** \`partly true\` — verified, except the permission's UI wording.`
- [ ] A6 `**Answer:**`. After its last sentence (*"The adopter's own workflows already receive issue, comment and review events without an app."*), append:
  ` Not established: the permission's UI wording.`
- [ ] `## Summary`. In the S6 row and the A6 row, change the Verdict cell from `` `verified` `` to `` `partly true` ``. Change nothing else in either row.

After the edit, confirm that every row in `## Summary` has the same verdict word as its entry's `**Verdict:**` line. This is a prose-only change, so no test runs.
