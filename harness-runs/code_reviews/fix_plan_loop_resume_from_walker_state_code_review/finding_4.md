### 4. The fix-plan fork still says its ledger resume composes "exactly as the task planner's does", a composition this branch removed

**File:** `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → the **Resume-from-ledger.** paragraph, the phrase "Override 2's resumability composes with the ledger exactly as the task planner's does (canonical-doc §1.7)"

**The problem.** On this branch the task planner's **Resume-from-ledger (planning).** stopped composing a readiness-list heuristic with the ledger. It now reads "Override 2 reads the `## Planning` entries directly rather than merely composing with them", and it adds a saved-walk precedence and a review-the-draft case (d). The fix-plan fork keeps its own index heuristic, which is deliberately out of scope (story index → `## Scope register` row 16). But it still points a reader at the planner as the model: "exactly as the task planner's does". A reader who follows that pointer to learn how the fix-plan resume composes finds rules that flow does not have: a walker, a saved walk and a case (d). They could apply them to a flow that has no walker. Scope register row 16 argues that the sentence "still holds, because `R1`/`R2` `[x]` still skip". That covers the skip. It does not cover the words "exactly as".

The change edits one clause of a citation and does not change the fix-plan flow's behaviour, so it stays within the task prompt's `## Out of scope` ("Every flow other than task-plan writing").

**Fix.** Replace "Override 2's resumability composes with the ledger exactly as the task planner's does (canonical-doc §1.7):" with:

> Override 2's resumability composes with the ledger (canonical-doc §1.7):

Leave the rest of the paragraph unchanged.
