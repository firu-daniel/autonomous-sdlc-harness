## question_1 — how planning continues after the task-plan loop hit its 5-revision cap with the structural plan review still failing
- **raised by:** the planning orchestrator of `/autonomous-sdlc-harness:branch-start-plan-autonomous`, at the `task-plan-reviewer` gate (`plan_review`) of the task-plan writing loop; latest findings `harness-runs/task_plan_reviews/feat_run_analytics_gate_timings/review_1.md` (FAIL, `must_fix_count: 2`)
- **asked:** Q1 — How should planning continue? The rounds that led here:

  | Round | Gate | Verdict |
  |---|---|---|
  | 0 (first draft) | architecture-reviewer | FAIL, 2 Must Fix (`architecture_reviews/…/review_0.md`) |
  | 1 | architecture-reviewer | FAIL, 1 Must Fix (`review_1.md`) |
  | 2 | architecture-reviewer | FAIL, 0 Must Fix, 1 Should Fix left open (`review_2.md`) |
  | 3 | architecture-reviewer: PASS, then task-plan-reviewer | FAIL, 3 Must Fix (`task_plan_reviews/…/review_0.md`) |
  | 4 | architecture-reviewer: PASS, then task-plan-reviewer | FAIL, 2 Must Fix (`task_plan_reviews/…/review_1.md`) |

  The plan then stood at 7 tasks, 93 story points (four `cli`, one `plugin`, two `general`). The writer's choices, from its own returns:

  - The rounds are read in `run-analytics.sh` and its jq libraries, through a new jq mode `rounds`, not in a hook. They are read only when the records exist.
  - A document becomes `schema: 2` only once it holds at least one round. A schema-1 document is read as having no rounds.
  - A resumed label whose record has changed is appended as `<label>#<N>`, and the earlier entry is never rewritten.
  - The report gets a `## Gate rounds` section listing the 10 slowest test files per phase.
  - `branch-status` accepts schema 1 or 2.

  A residual the writer stated in round 4: a stale per-phase `tests.tsv` can still be picked up when `gates.tsv` has rows for that phase but the test gate wrote nothing on the resumed attempt; the full fix needs the record producers to clear old files at round start, which the task prompt forbids.

  Options:

  - **(a) Another revision round.** The writer revises against `review_1.md`, and every gate runs again: architecture, then task-plan review. You can add a ruling on any finding in that file, for example "Must Fix 2 is accepted as a stated residual", and it will be passed to the writer.
  - **(b) Accept the plan as it is.** Planning stops here, and implementation starts on the current plan. The two open Must Fix findings in `review_1.md` are recorded as known, and the branch review deals with them.
  - **(c) Narrow the scope.** Name what to drop or defer, for example the stale-record residual or the `branch-status` change. The writer revises to that scope and the gates run again.
  - **(d) Stop.** Leave the branch parked for planning by hand.
- **answered:** Q1: (a). Must Fix 1: narrow the text check to non-comment lines. Must Fix 2: option (a), sort by seconds descending then file ascending in the report, with an unsorted-input test. Should Fix 1: apply it, using a `redact_path` without the 160-character cut for round ids, gate ids and file paths. The stale per-phase tests.tsv residual is accepted as stated.
- **carries beyond this branch:** the stale per-phase `tests.tsv` residual is accepted as a known limit of the run-analytics round reader; closing it requires the record producers to clear old per-phase files at round start, a change to how a round runs that this branch's task prompt excluded.
