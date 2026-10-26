## [A · Task 2 · cli · iter 0] → layer-implementer  (#3)
- **added:** `context_notes:`
- **verbatim:** `context_notes: The Task 1 implementer reported that the three `result` events sharing session_id 2651f418-… in the main checkout's harness-runs/autonomous_logs/feat_unattended_sandbox_preflight.stream.jsonl carry total_cost_usd 2.11, 5.67, 7.62 in stream order (source: that stream file; Task 1's deviation note on repeated session ids is in harness-runs/task_plans/feat_run_analytics/task_1_plan.md).`
- **why the agent could not derive it:** the cost values were measured by the Task 1 implementer and appear only in its return, not in task_2_plan.md or the story index; the stream file lives in the main checkout, outside the Task 2 read set

## [A · Task 3 · cli · iter 0] → layer-implementer  (#5)
- **added:** `context_notes:`
- **verbatim:** `context_notes: Tasks 1 and 2 landed with recorded deviations from plan (repeated session ids keyed as `<id>#N`; cumulative result fields de-duplicated in the run roll-up) — see the `**Deviations from plan:**` sections of harness-runs/task_plans/feat_run_analytics/task_1_plan.md and task_2_plan.md (commits 628c1814, a5e40e37).`
- **why the agent could not derive it:** task_3_plan.md was written before Tasks 1–2 ran; their deviations live only in sibling task files outside Task 3's stated read set

## [A · Task 5 · cli · iter 0] → layer-implementer  (#9)
- **added:** `context_notes:`
- **verbatim:** `context_notes: Task 3 landed `run-analytics.sh` with recorded deviations from plan (exit codes, an added `recorded 0 session(s) for <branch>` result line, branch-name validation) — see the `**Deviations from plan:**` section of harness-runs/task_plans/feat_run_analytics/task_3_plan.md (commit d9cb57cf).`
- **why the agent could not derive it:** task_5_plan.md predates Task 3's implementation; the deviation lives only in task_3_plan.md

## [A · Task 6 · cli · iter 0] → layer-implementer  (#11)
- **added:** `context_notes:`
- **verbatim:** `context_notes: Tasks 1–3 landed with recorded deviations from plan (session-id `#N` keys, cumulative result fields de-duplicated in the roll-up, an added `recorded 0 session(s) for <branch>` result line, branch-name validation, duration formatting) — see the `**Deviations from plan:**` sections of harness-runs/task_plans/feat_run_analytics/task_1_plan.md, task_2_plan.md and task_3_plan.md (commits 628c1814, a5e40e37, d9cb57cf).`
- **why the agent could not derive it:** task_6_plan.md predates Tasks 1–3's implementation; the deviations live only in sibling task files

## [A · Task 7 · cli · iter 0] → layer-implementer  (#13)
- **added:** `context_notes:`
- **verbatim:** `context_notes: Tasks 3 and 5 landed with recorded deviations from plan — see the `**Deviations from plan:**` sections of harness-runs/task_plans/feat_run_analytics/task_3_plan.md and task_5_plan.md (commits d9cb57cf, fdbb467c).`
- **why the agent could not derive it:** task_7_plan.md predates Tasks 3 and 5's implementation; the deviations live only in sibling task files

## [A · Task 8 · plugin · iter 0] → layer-implementer  (#15)
- **added:** `context_notes:`
- **verbatim:** `context_notes: Tasks 1–3 landed with recorded deviations from plan that bear on `run-analytics.json`'s keys (session ids may carry a `#N` suffix; run totals de-duplicate cumulative result fields) — see the `**Deviations from plan:**` sections of harness-runs/task_plans/feat_run_analytics/task_1_plan.md, task_2_plan.md and task_3_plan.md (commits 628c1814, a5e40e37, d9cb57cf).`
- **why the agent could not derive it:** task_8_plan.md predates Tasks 1–3's implementation; the deviations live only in sibling task files

## [A · Task 10 · general · iter 0] → layer-implementer  (#19)
- **added:** `context_notes:`
- **verbatim:** `context_notes: Tasks 1–9 landed with recorded deviations from plan — see the `**Deviations from plan:**` sections of the per-task files under harness-runs/task_plans/feat_run_analytics/ (commits 628c1814 … 2fbfcbcd).`
- **why the agent could not derive it:** task_10_plan.md predates Tasks 1–9's implementation; the deviations live only in sibling task files
