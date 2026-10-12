### 3. qa-tester's new priority rule admits PASS only when "nothing was noted", which conflicts with its own instruction to note a performed setup

**File:** `plugin/agents/qa-tester.md` (`## Output contract`, the **Priority — one return per dispatch.** paragraph) — "`### 1.` only when every assertion held and nothing was noted."

Related site: the same file, `## How it tests` → **Authentication** → the **Don't report `blocked` for something a peer sign-in or a UI setup step would reach.** sub-bullet — "note in your return or finding what setup you performed."

Task 11 added the priority paragraph: FAIL over blocked over PASS, and "`### 1.` only when every assertion held and nothing was noted." The sub-bullet above tells the tester to perform a documented UI setup (create data until a list crosses the page size, sign in as a peer) and then to "note in your return or finding what setup you performed." Doing that setup is the sanctioned path, not a defect, and the test can then pass. But the PASS return is fixed at exactly one line (`verdict: PASS`, per `### 1. All tests pass` and the "1 line on PASS" rule), so it cannot carry a note. Read literally, the new rule says a test that performed and noted setup is not eligible for `### 1.`. The only return that can carry the note is then `### 2.`: a `verdict: FAIL` with a non-defect "finding". That leaves the test `[ ]`, sends a non-defect through the E.3 fix loop, and repeats on every re-test round until `MAX_QA_ROUNDS` escalates.

The paragraph's own context shows what "noted" was meant to cover: the sentence just before it is "a blocked part of the same test is then noted in the index's Context paragraph." Say that directly, and stop the setup sub-bullet from asking for a note the PASS shape cannot hold.

**Fix:**

- [ ] In the **Priority** paragraph, replace `` `### 1.` only when every assertion held and nothing was noted. `` with:

  ```markdown
  `### 1.` only when every assertion held and no part of the test was blocked; a documented setup the test performed is not a finding and never moves a passing test off `### 1.`.
  ```

- [ ] In the **Don't report `blocked` …** sub-bullet, replace `note in your return or finding what setup you performed.` with:

  ```markdown
  note what setup you performed in the finding when the test produces one; a passing test's return stays the single `verdict: PASS` line.
  ```

Change nothing else. No test file is involved, so this fix runs no test.
