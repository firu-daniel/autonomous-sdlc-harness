### 1. `docs/development.md`'s new clarifying sentence says "until this change", which reads as the measured concurrency change

**File:** `docs/development.md` → `## 5. Verifying a change`, the **Run time, measured.** paragraphs — "until this change the record credited every suite opened through the helper"

Task 7 added a clarifying sentence after the recorded measurement ("The four it adds are `fixture-template.test.mjs`'s three cases and one entry for the new helper `helpers/concurrency.mjs` …"):

> That count is `node --test`'s, not the per-file timing record's: until this change the record credited every suite opened through the helper to the helper's own path, and now each suite is opened with `describe` in its own file and the helper's row carries no tests.

Everything around this sentence describes the measured change, the one that introduced the concurrent suites and the helper (measured against `fe17b4e2293f`). So a reader takes "this change" to mean that change. They then conclude that the concurrency change itself fixed the attribution, when in fact it introduced the misattribution, and a later branch fixed it. This is a document of record. "This change" has no referent once the branch has merged. The same document names the branch behind a later fix in its own text: the stall-watchdog paragraph cites "`452aaedf` (`fix_stall_stub_release_marker`)".

**Fix:** replace the sentence with this one, which names the branch and keeps every other word:

```markdown
That count is `node --test`'s, not the per-file timing record's: until `fix_test_timing_attribution` the record credited every suite opened through the helper to the helper's own path; since that branch each suite is opened with `describe` in its own file and the helper's row carries no tests.
```

Leave the measured sentence before it and the "Beside them are the three suites …" sentence after it unchanged. This fix edits prose only and runs no test.
