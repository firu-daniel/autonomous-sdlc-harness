## The plan unit needed 7 review rounds across two planning walks, every round's Must Fix net-new
- **category:** optimization
- **evidence:** Convergence churn trip-wire. Plan-review round artifacts: `harness-runs/task_plan_reviews/fix_run_gates_wait_form_sandbox/review_0.md` … `review_3.md` (4 FAIL rounds) and `harness-runs/architecture_reviews/fix_run_gates_wait_form_sandbox/review_0.md`, `review_1.md` (2 FAIL rounds), plus the final PASS round that wrote no file — 7 rounds, 7 `task-plan-writer` dispatches. The first walk hit the `>= 5` cap and escalated (`binding: <escalate>`, `reason: cap`); the operator authorised one more round, which failed again (`review_3.md`), then a second extra round converged. Per round, by Must Fix title: review_0 scope-register derivation; review_1 the heartbeat loop's own `kill -0`; review_2 `run_gate` returning the wrong status (introduced by the revision that answered review_1); review_3 the background gate subshell's signal handling (introduced by the revision that answered review_2); arch review_0 a second mtime reader beside `hr_lane_mtime`; arch review_1 a stale `stat` line in the story index's `## Context`. No title repeats across rounds — every round net-new. The arch review_1 item was named in advance by the preceding writer return, which left it unedited because the findings did not name the index.
- **cost this run:** 2 cap escalations surfaced to the operator; 14 planning dispatches beyond the first converging-shape round.
- **hypothesis:** (guess) two of the net-new Must Fixes were defects introduced by the previous round's redesign rather than missed by the previous review.

## Plan writers applied only Must Fix items, so Should Fix findings carried across rounds until the operator authorised them
- **category:** agent-contract
- **evidence:** `task-plan-writer` returns on revision dispatches #4, #7, #9 and #14 (planning counter) each stated it left the Should Fix / Nice to Have items unapplied "because I was not told to"; the same Should Fix 1, 2 and 4 were reported carried from review_0/review_1 through review_3. They were applied only on dispatch #17 after the operator's live authorisation, carried as a `context_notes:` line (`harness-runs/dispatch_additions/fix_run_gates_wait_form_sandbox.md` → `## [plan-write · iter 1] → task-plan-writer  (#17)`). One writer return (#9) also named an index line it knew was now stale and left it, which the next architecture round raised as its Must Fix.
- **cost this run:** one architecture round spent on a stale line the writer had already identified; an operator decision needed mid-planning.

## A cli-layer implementer blocked on a two-layer unit because it could not see the general layer would follow
- **category:** agent-contract
- **evidence:** Phase C dispatch #15 (`[C · Item 1 · cli · iter 0] → layer-implementer`) on code-review Finding 5, tagged `_(layer: cli, general)_`, returned `blocker: finding 5 requires editing scripts/lib/harness-run-lib.sh, which lies outside the dispatched cli layer path …` with no edits. It was re-dispatched (#16) with a `context_notes:` line stating the `general` layer of the same unit runs next; the same line was then added to #19, #22, #25, #37 and #43 (all `_(layer: cli, general)_` units), and none of those blocked. All six additions are recorded in `harness-runs/dispatch_additions/fix_run_gates_wait_form_sandbox.md`.
- **cost this run:** 1 wasted dispatch; 6 dispatch-prompt additions.

## No local `dev` ref in the checkout, so every `diff_base: dev` reviewer fell back to `origin/dev` on its own
- **category:** tooling-gap
- **evidence:** `harness.config.json` `defaultBranch` is `dev`; the core's A2.1 / B.1 / C2.1 dispatch blocks pass `diff_base: <default_branch>`. The `branch-reviewer` (#10), `skeptic-reviewer` (#34) and `statistics-plan-writer` (#46) returns each reported "this run copy has no local `dev`" and that it diffed or ranged against `origin/dev` instead (branch-reviewer: merge base `498eb8e8`). The `architecture-reviewer` (#9) returned a bare PASS, so which base it used is not recorded.
- **cost this run:** none observed; each agent improvised the same fallback independently.

## The branch-reviewer's mechanical grep sweep did nothing: its escape-class table has empty regex cells
- **category:** tooling-gap
- **evidence:** `branch-reviewer` return on dispatch #10: "The grep half of the mechanical sweep did nothing: the escape-class table in my definition still has empty regex cells, a configuration gap. The new-export check found no added exports."
- **cost this run:** the code review ran without its grep-based escape-class sweep.
