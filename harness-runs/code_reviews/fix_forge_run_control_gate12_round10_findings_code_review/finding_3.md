### 3. Gate 12 (xiv)(j) claims steps 1 and 10 settle a clause neither step exercises

**Site:** `docs/development.md` → Gate 12 → (xiv) leg (j) → **What it settles.**, the sentence opening "Steps 1 and 10 together settle *A step's `$GITHUB_OUTPUT` line is read by a later step's `if:`".

**Problem.** The new `docs/github-run-control.md` → `## 8. What is not verified here` row has two clauses:

1. a step's `$GITHUB_OUTPUT` line is read by a later step's `if:` as `steps.<id>.outputs.<name>`;
2. a `continue-on-error` step that failed leaves it empty.

The sentence says steps 1 and 10 together settle the whole row. Step 1's agent check succeeds and writes `agent=yes`. Step 10's agent check succeeds and writes `agent=no`. In neither job does the `Decide whether the comment needs the agent` step fail, so neither one observes clause 2. A round that passes steps 1 and 10 would move the whole row to *Verified*, including a clause no step looked at. That clause is the one the row's fail-open column depends on ("An unreadable output compares unequal to `no` …").

**Fix.** Replace that sentence with:

> Steps 1 and 10 together settle the first clause of *A step's `$GITHUB_OUTPUT` line is read by a later step's `if:` as `steps.<id>.outputs.<name>`, and a `continue-on-error` step that failed leaves it empty*: step 1's job ran the three comment-only steps, and step 10's skipped them. No step makes the agent check fail, so its second clause stays unverified.

Leave the `docs/github-run-control.md` row unchanged.
