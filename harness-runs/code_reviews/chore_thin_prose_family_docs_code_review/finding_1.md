### 1. The narrowed writer read says every check grades a rule in the six sections, but check 13's ripple rule sits in `### Survey`, outside them

> **Self-contained per-finding file** for the `chore_thin_prose_family_docs` code-review index (`harness-runs/code_reviews/chore_thin_prose_family_docs_code_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `plugin/agents/docs-reviewer.md` (`## Invocation contract`) — "Every check below grades a rule those sections state"

Task 4 narrowed the reviewer's read of `docs-writer.md` to six sections (`## Entry-point hints are STARTING POINTS, not boundaries`, `## Research methodology (apply every time)`, `## Mode 1 — catalog`, `` ### Write / update (`mode: update`) `` and the two `## Template —` sections), and the sentence after the list now says: *"Every check below grades a rule those sections state"*. Before the branch the sentence read *"Every check below targets a rule that file actually states"*, which was true because the reviewer read the whole file.

The narrowed sentence is false for check 13 (`**Ripple not missed**`). The writer rule that check 13 corresponds to is the `**Ripple:**` bullet ("a change to a shared service, stored-data set, or backend operation may touch several documents — trace it … and list every document it lands in"). That bullet lives in `plugin/agents/docs-writer.md` → `` ### Survey (`mode: survey`) ``, which is not one of the six sections. Every other check (1–12) does map to text inside the six sections: the anchor, line-number, `reachable?` and `⚠️ unverified` rules are in research step 5; research depth is in the entry-point hints and steps 2–3; the merge rule is in `## Mode 1 — catalog`; the update and preserve rules are in `### Write / update`; and the per-layer sub-sections and sync direction are in the feature template.

Check 13's own text is enough to run it ("if the diff plausibly affects *another* document that was NOT in this target, note it"), so no verdict changes. The citation sentence still overstates what the read covers. A reviewer who takes it literally finds no matching writer rule for check 13. This is wrong but changes no decision, so it is a Should Fix.

**Fix:** in `plugin/agents/docs-reviewer.md` → `## Invocation contract`, replace the four words that open the sentence and leave the rest of it as it is:

- old: `Every check below grades a rule those sections state; take the strings from it rather than from memory, so writer and reviewer cannot disagree.`
- new: `Checks 1–12 grade a rule those sections state; take the strings from it rather than from memory, so writer and reviewer cannot disagree.`

`take the strings from it rather than from memory, so writer and reviewer cannot disagree.` is shared word for word with `plugin/agents/conventions-reviewer.md`, so keep that tail byte for byte. The edit removes one word from the definition, so the up-front count does not rise. Do not add `### Survey` to the read list: that would raise the reviewer's up-front count to cover a check that needs no writer text.

When the edit is in, re-run the family probe with no file argument, `bash scripts/scratch-run.sh harness-runs/scratch/docs_family_check.mjs`, and confirm it still prints `PASS`. The edit does not touch its `ADDED` literals (`the only sections of it you read:` and the six backticked headings). This fix runs no test suite.
