---
description: Run the end-of-branch code review on the current branch and present the findings to the user.
---

# Scope: Review the work on the current branch

## Resolved values

The two tokens below are not ordinary path placeholders: they resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses them as ordinary placeholders.

| Token | Class | How to resolve it |
|---|---|---|
| `<parity_vocabulary>` / `<reference_impl>` | config value | `parity.referenceName` / `parity.referenceImplPath` — the name of the reference implementation this project is kept in parity with, and the path to it. Read **only** when `phases.parity` is `true`. |

---

## Context: A branch review is a full pre-merge read of everything this branch changed — the diff against the default branch, judged against the project's own conventions and the task prompt it was meant to satisfy — presented to the user rather than auto-fixed.

**Skip the parity framing unless `phases.parity` is `true` in `harness.config.json`.** When it is on, this project is kept in parity with `<reference_impl>` — the `<parity_vocabulary>` reference implementation — whose UX and business logic are the source of truth: follow them strictly, except where the prompt asked for something different or where the reference is demonstrably wrong.

## Steps
1. **Read `${CLAUDE_PLUGIN_ROOT}/instructions/code_review_instructions.md`** to get context.
2. If anything missing or unclear, don't make assumptions, just ask questions to clarify.
