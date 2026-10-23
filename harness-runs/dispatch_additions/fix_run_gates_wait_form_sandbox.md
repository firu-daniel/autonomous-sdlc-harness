## [plan-write · iter 1] → task-plan-writer  (#17)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The user, asked live in this session, authorised this revision to also apply the still-open Should Fix findings from earlier plan reviews that the writer's previous returns listed as carried — Should Fix 1 (RUN_TEST_SUITE_STALE lower bound), Should Fix 2 (the stale-window test timing) and Should Fix 4 (Task 4's WF grep check); source: the user's answer to the orchestrator's AskUserQuestion, and the findings in harness-runs/task_plan_reviews/fix_run_gates_wait_form_sandbox/review_0.md … review_3.md.`
- **why the agent could not derive it:** the user's authorisation was given only as a live answer in the orchestrating session, after the 5-revision cap escalated twice; it is recorded in no file the writer reads, and the writer's revision-mode contract applies Must Fix items only without an explicit authorisation

## [C · Item 1 · cli · iter 0] → layer-implementer  (#16)
- **added:** `context_notes:`
- **verbatim:** `context_notes: This finding's readiness entry is tagged `_(layer: cli, general)_` in harness-runs/code_reviews/fix_run_gates_wait_form_sandbox_code_review.md, so the orchestrator dispatches the `general` layer of this same unit immediately after this one, and that dispatch owns the scripts/lib/harness-run-lib.sh copy; the commit lands once, after both layers (source: unit_loop_core.md → ## Layer routing table, multi-layer case).`
- **why the agent could not derive it:** the implementer receives one layer per dispatch and is not shown the readiness entry's multi-layer tag or the orchestrator's dispatch order; the first dispatch (#15) returned a blocker because it could not see that a `general` dispatch of the same unit would edit the second copy

## [C · Item 2 · cli · iter 0] → layer-implementer  (#19)
- **added:** `context_notes:`
- **verbatim:** `context_notes: This finding's readiness entry is tagged `_(layer: cli, general)_` in harness-runs/code_reviews/fix_run_gates_wait_form_sandbox_code_review.md, so the orchestrator dispatches the `general` layer of this same unit immediately after this one, and that dispatch owns the scripts/run-test-suite.sh copy; the commit lands once, after both layers (source: unit_loop_core.md → ## Layer routing table, multi-layer case).`
- **why the agent could not derive it:** same as #16 — the multi-layer tag and dispatch order are in the orchestrator's read set, not the implementer's

## [C · Item 3 · cli · iter 0] → layer-implementer  (#22)
- **added:** `context_notes:`
- **verbatim:** `context_notes: This finding's readiness entry is tagged `_(layer: cli, general)_` in harness-runs/code_reviews/fix_run_gates_wait_form_sandbox_code_review.md, so the orchestrator dispatches the `general` layer of this same unit immediately after this one, and that dispatch owns the scripts/run-test-suite.sh copy; the commit lands once, after both layers (source: unit_loop_core.md → ## Layer routing table, multi-layer case).`
- **why the agent could not derive it:** same as #16

## [C · Item 4 · cli · iter 0] → layer-implementer  (#25)
- **added:** `context_notes:`
- **verbatim:** `context_notes: This finding's readiness entry is tagged `_(layer: cli, general)_` in harness-runs/code_reviews/fix_run_gates_wait_form_sandbox_code_review.md, so the orchestrator dispatches the `general` layer of this same unit immediately after this one, and that dispatch owns the scripts/run-test-suite.sh copy; the commit lands once, after both layers (source: unit_loop_core.md → ## Layer routing table, multi-layer case).`
- **why the agent could not derive it:** same as #16

## [C2 · Item 1 · cli · iter 0] → layer-implementer  (#37)
- **added:** `context_notes:`
- **verbatim:** `context_notes: This finding's readiness entry is tagged `_(layer: cli, general)_` in harness-runs/skeptic_reviews/fix_run_gates_wait_form_sandbox_skeptic_review.md, so the orchestrator dispatches the `general` layer of this same unit immediately after this one, and that dispatch owns the scripts/run-test-suite.sh copy; the commit lands once, after both layers (source: unit_loop_core.md → ## Layer routing table, multi-layer case).`
- **why the agent could not derive it:** same as #16 — the multi-layer tag and dispatch order are in the orchestrator's read set, not the implementer's
