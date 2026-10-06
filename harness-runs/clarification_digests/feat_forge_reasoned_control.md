## question_1 — The task-plan loop reached its 5-revision cap with one Must Fix open; how should planning continue?
- **raised by:** the planning walker (`flow-walker.sh`, flow `task_plan_writing`) at node `plan_review` (`task-plan-reviewer`), `reason: cap`; latest findings `harness-runs/task_plan_reviews/feat_forge_reasoned_control/review_2.md` (1 Must Fix open), plan `harness-runs/story_plans/feat_forge_reasoned_control_story_plan.md` (11 tasks, 154 points)
- **asked:** Q1 — How should the planning loop continue? The round history the park carried:

  | Round | Gate | Verdict | Findings |
  |---|---|---|---|
  | 0 | architecture | FAIL (1 Must Fix): mention-agent prompt placed in the `cli` layer | `architecture_reviews/…/review_0.md` |
  | 1 | architecture | PASS (agent moved to `plugin/agents/mention-reader.md`) | — |
  | 1 | task-plan | FAIL (2 Must Fix): scope-register searches too narrow; credential env reaching non-agent calls | `task_plan_reviews/…/review_0.md` |
  | 2 | architecture | FAIL (1 Must Fix): an agent definition that no plugin instruction or command dispatches | `architecture_reviews/…/review_1.md` |
  | 3 | architecture | PASS (reader is now slash command `plugin/commands/harness-read-mention.md` + `plugin/instructions/mention_reading.md`) | — |
  | 3 | task-plan | FAIL (1 Must Fix): the D3 command-list search missed some lists | `task_plan_reviews/…/review_1.md` |
  | 4 | architecture | PASS | — |
  | 4 | task-plan | FAIL (1 Must Fix) — **open now** | `task_plan_reviews/…/review_2.md` |

  Options: (a) give it more rounds — resume the writer with `review_2.md` and a fresh 5-revision budget, optionally fewer rounds and optionally applying the open Should Fix items; (b) rule on the open finding directly, recorded in the story index's `## Rejected findings` if dismissed, then a fresh review pass; (c) stop and revise the plan or task prompt by hand.
- **answered:** "Q1: (a) Give it 3 more rounds."
- **carries beyond this branch:** nothing beyond this branch
