### 6. `committer`'s "Both templates are free-form" now sits after three templates

**File:** `plugin/agents/committer.md` (`## Commit-message policy`, the **Subject reconciliation** bullet), "**Both templates are free-form, not fixed-form:**"

**Problem.** On `dev` the **Subject reconciliation** bullet had two templates on its **No** path: `record disposition of …` and `mark … done — …`. The `already_passing` template lived in a separate paragraph with its own placement rule, so "Both templates" counted correctly.

Task 10 folded `already_passing` into the same **No** list. It now has three templates:
- `record disposition of <unit token> — <cause>`
- `mark <unit token> already passing — <cause>`
- `mark <unit token> done — <what the staged set shows>`

The sentence still says "**Both templates are free-form, not fixed-form:** their leading word takes `<commit_conventions>`'s capitalisation." A committer working out which templates take the policy's capitalisation can read "both" as the first two, or the old two, and leave `mark … already passing` out.

**Fix.** Replace

```markdown
  **Both templates are free-form, not fixed-form:** their leading word takes `<commit_conventions>`'s capitalisation. A body line is written lower-case.
```

with

```markdown
  **Each template is free-form, not fixed-form:** its leading word takes `<commit_conventions>`'s capitalisation. A body line is written lower-case.
```

The word count is unchanged.

The fix runs no test.
