## question_1 — How should planning proceed past the plan loop's 5-revision cap with the architecture gate still open?
- **raised by:** planning phase, task-plan writing loop — `architecture-reviewer` (plan-review mode) gate, via the planning walker (`scripts/flow-walker.sh`, flow `task_plan_writing`), `reason: cap`; latest findings `harness-runs/architecture_reviews/fix_run_gates_answered_park_resume/review_3.md` (1 Must Fix). Scope-register rows in dispute: 2, 3, 5, 9, 20, 22, 23, 29 — the `<park_answer_lookup>` binding introduction and its ship ordering.
- **asked:** Q1 — How should planning proceed past the cap? Options:
  1. **Another bounded round of revisions.** Resume the writer on `review_3.md` with a fresh 5-revision cap, no other change.
  2. **Overrule the open finding.** Have the writer record `review_3.md`'s Must Fix under `## Rejected findings` (with your reason) and let the gates re-run once; implementation proceeds if they pass.
  3. **Change the design to stop the churn.** E.g. drop the new `<park_answer_lookup>` binding and instead have the G.0 lookup live entirely in the autonomous forks' `<escalate>` reroute prose (an existing binding), or another shape you name. The writer re-plans on that basis with a fresh cap.
  4. **Stop the run** here and plan this branch by hand.
- **answered:** "Q1: Option 1 — another bounded round of revisions."
- **carries beyond this branch:** nothing beyond this branch
