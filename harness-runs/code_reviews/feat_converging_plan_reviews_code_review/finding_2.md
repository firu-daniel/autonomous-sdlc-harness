### 2. `plugin/instructions/README.md` still counts thirty-one instruction files and omits `plan_review_rounds.md` from the later-added list

**File:** `plugin/instructions/README.md` (the opening paragraph) — "Roadmap item 3 landed twenty-four of the thirty-one instruction files beside this README (the `.md` files here, minus this README; the run-mode, dispatch-discipline, clarification-digest, mention-reading, main-checkout resolution, untrusted-input and prompt-injection screen files came later)"

This branch adds `plugin/instructions/plan_review_rounds.md`. That makes 32 `.md` files in `plugin/instructions/` besides the README: `ls plugin/instructions/*.md` without `README.md` counts 32 on this branch and 31 on the default branch. The README's arithmetic is that 24 came with roadmap item 3 and the named files came later. Its stated total and its "came later" list are now both wrong: a reader who checks the directory against the sentence finds one file the sentence does not account for.

**Fix:** in that sentence, change `twenty-four of the thirty-one instruction files` to `twenty-four of the thirty-two instruction files`, and extend the parenthetical's list so it reads:

```
(the `.md` files here, minus this README; the run-mode, dispatch-discipline, clarification-digest, mention-reading, main-checkout resolution, untrusted-input, prompt-injection screen and plan-review-rounds files came later)
```

Leave the rest of the paragraph unchanged. This is a prose-only fix and runs no test.
