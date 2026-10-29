## question_1 — The task-plan loop hit its 5-revision cap with the plan-review gate still failing, and the root `.claude/` re-render was deferred
- **raised by:** planning phase, `task-plan-reviewer` gate (`/autonomous-sdlc-harness:branch-start-plan-autonomous`, task-plan write loop), at the walker's cap escalation (`reason: cap`; rounds: architecture_review 2, plan_review 3). Latest findings: `harness-runs/task_plan_reviews/fix_clone_main_repo_resolution/review_2.md` (must_fix_count: 1).
- **asked:**
  - **Q1 — How should planning continue past the cap?** Options: (a) one more revision round against `review_2.md` with every gate re-run, saying whether the writer also applies the carried-forward Should Fix items (`task_1` and `jq`, the line-5 coordinates, the `task_12` README target); (b) accept the plan as it stands and go to implementation, leaving the open Must Fix to the end-of-branch reviews; (c) stop the run.
  - **Q2 — Scope register rows 25–26: may this repository's own `.claude/` render be left to a manual step?** The plan marked rows 25 (`.claude/CLAUDE.md` → `## Where a change request runs`, item 4) and 26 (`.claude/harness-task-offer.md` → line 5 and answer 4) `no-change`, because the tool layer refuses an agent's write under the root `.claude/`, and moved the re-render to `## Manual setup required`. Options: (a) accept the deferral; (b) do it in this branch, naming the route (grant the write, or another route an unattended run may use).
- **answered:**
  > Q1: (a) One more revision round. The writer should also apply the Should Fix items carried forward unapplied, including the three repeat items (task_1 and jq, the line-5 coordinates, and the task_12 README target).
  > Q2: (a) Accept the deferral. Rows 25–26 stay no-change with the manual step; I will do the re-render before merge.
- **carries beyond this branch:** an unattended run is not granted writes under this repository's root `.claude/`; re-rendering those copies is a maintainer step before merge.

## question_2 — The one authorised extra revision round also failed the plan-review gate
- **raised by:** planning phase, `task-plan-reviewer` gate (`/autonomous-sdlc-harness:branch-start-plan-autonomous`, task-plan write loop), on the resume that consumed `answer_1.md`. Latest findings: `harness-runs/task_plan_reviews/fix_clone_main_repo_resolution/review_3.md` (must_fix_count: 1); the architecture gate had passed.
- **asked:**
  - **Q1 — How should planning continue after the authorised extra round also failed?** Options: (a) continue the loop until it converges or reaches its cap (up to four more rounds), saying whether reaching the cap again parks or falls through to (b); (b) one more single revision round, parking again on failure; (c) accept the plan as it stands; (d) stop the run.
- **answered:**
  > Q1: (a) Continue the loop until it converges or reaches its cap. Reaching the cap again should park (the default), not fall through to (b).
- **carries beyond this branch:** nothing beyond this branch
