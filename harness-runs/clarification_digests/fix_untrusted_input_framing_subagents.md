## question_1 — How to continue with a task plan that hit the plan loop's 5-revision cap with one open Must Fix
- **raised by:** planning phase — `task-plan-reviewer`, via the planning walker's 5-revision cap (`binding: <escalate>`, `reason: cap`); latest findings `harness-runs/task_plan_reviews/fix_untrusted_input_framing_subagents/review_1.md` (`verdict: FAIL`, `must_fix_count: 1`)
- **asked:**
  - **Q1 — How should the run continue with a plan that has one open Must Fix?** Asked rather than assumed because implementation would start from a plan its own structural reviewer still fails, on a branch that rewrites the security framing every agent applies to untrusted text. At the cap the architecture gate was passing (4 reviews: `review_0` FAIL 1 Must Fix → fixed; `review_1` FAIL 0 Must Fix / 3 Should Fix → applied; `review_2` FAIL 0 Must Fix / 1 Should Fix → applied; iteration 3 PASS); the structural gate had 2 reviews (`review_0` FAIL 1 Must Fix → applied; `review_1` FAIL 1 new Must Fix, unaddressed); and an unapplied Should Fix from `task_plan_reviews/…/review_0.md` remained (Task 8 says the report literal lives "in the module only", while Task 6 places it in `docs_orchestration_instructions_autonomous.md`). Options:
    - **(A) Allow more revisions.** The run resumes the plan loop: the writer revises against `review_1.md`, and every gate runs again. Optionally, also tell the writer to apply the Should Fix items it left open (the Task 8 / Task 6 "in the module only" conflict above).
    - **(B) Accept the plan as it is and go to implementation.** The open Must Fix is carried as a known issue for the branch review and skeptic review to catch.
    - **(C) Fix the plan yourself.** You edit the story index or per-task files by hand to resolve `review_1.md`, and the run then sends the edited plan back through review.
    - **(D) Stop the run here.**
- **answered:**

  > Q1: (A) Allow more revisions. Resume the plan loop so the writer revises against review_1.md and every gate runs again. Also apply the open Should Fix: resolve the Task 8 / Task 6 "in the module only" conflict, so Task 8's check does not fail on the report literal Task 6 places in docs_orchestration_instructions_autonomous.md.
- **carries beyond this branch:** nothing beyond this branch
