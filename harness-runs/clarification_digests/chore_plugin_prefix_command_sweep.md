## question_1 — The task-plan loop hit its 5-revision cap without a PASS: allow more revision rounds, implement the plan as it stands, or stop?
- **raised by:** `/autonomous-sdlc-harness:branch-start-plan-autonomous`, planning phase → `task_plan_writing_instructions_core.md` → `## Loop` step 5 (`task-plan-reviewer`), `<escalate>` on the `iteration >= 5` cap. The plan-review (structural) gate was the open gate.
- **asked:** Nothing had been implemented yet. Gate round counts at the park:

  | Gate | Rounds with findings | Last verdict |
  |---|---|---|
  | business-parity | not run (`phases.parity` is `false`) | — |
  | architecture-reviewer | 1 (`review_0.md`, 2 Must Fix — both fixed; every later round PASS) | PASS |
  | task-plan-reviewer | 4 (`review_0.md` … `review_3.md`) | FAIL |

  Must Fix count per `task-plan-reviewer` round was 4 → 2 → 2 → 1. Each round found new, narrower issues, and 1 Must Fix was still open in `review_3.md`. The options were:
  1. Allow one more revision round.
  2. Accept the plan as it stands and implement, carrying the open Must Fix as a known gap.
  3. Stop and leave the plan to be edited by hand.
- **answered:** "1, extended: allow up to 3 more revision rounds (not just one). Resume the writer against review_3.md and re-run the architecture and task-plan review gates each round. Stop as soon as a round passes and go on to implementation. If the task-plan reviewer still fails after the third extra round, park again."
- **carries beyond this branch:** nothing beyond this branch
