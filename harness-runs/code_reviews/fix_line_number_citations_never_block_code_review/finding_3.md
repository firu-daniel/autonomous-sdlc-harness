### 3. The parity-review README's citation sentence opens an aside it never closes

**File:** [cli/templates/state-dir/business_parity_reviews/README.md:9](cli/templates/state-dir/business_parity_reviews/README.md#L9). Anchor: `cli/templates/state-dir/business_parity_reviews/README.md` — "has to trace to an anchored source in the reference implementation". The line number is only a hint.

**Problem.** Task 1 replaced *"a source line in the reference implementation"* with the text the plan specified. That replacement ends in an em-dash aside, but the original sentence goes on with *", and a behaviour the reference has …"*, so the aside is never closed. The sentence now reads:

> … has to trace to an anchored source in the reference implementation — its path and symbol, never a line number, and a behaviour the reference has that no per-task file covers is a Must Fix of the same grade as a wrong field.

This README is what `init` writes into every adopting repository.

**Who gets it wrong, and how.** An adopter reads this to learn why a parity round was lost. Because the dash is never closed, the sentence parses as one list: *"its path and symbol, never a line number, and a behaviour the reference has …"*. The second rule, that an uncovered reference behaviour is a Must Fix, gets swallowed into the description of a citation. Also, *"never a line number"* says flatly that a line number is forbidden. The rewritten `task-plan-writer.md` step 2 explicitly allows a line range *"as a navigation hint"*.

**Fix.** Put the aside in parentheses so the second clause stands alone again, and match the hint rule:

- [ ] Replace *"has to trace to an anchored source in the reference implementation — its path and symbol, never a line number, and a behaviour"* with *"has to trace to an anchored source in the reference implementation (its path and symbol, never a line number in their place), and a behaviour"*.
- [ ] Change no other sentence. No test pins this text: a `grep` for the sentence over `cli/test` and `cli/src` finds nothing, and the template is copied rather than rendered, so no `{{…}}` token is involved.
