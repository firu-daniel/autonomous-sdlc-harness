# Task plan review — round 0

verdict: FAIL
review_mode: full

## Must Fix

1. **`task_9_plan.md` — the run-analytics verification stops at the report note and leaves idle-gap attribution, which assumes one dispatch at a time, unexamined**
   The task prompt's Part 4 asks the plan to verify how `run-analytics.sh` attributes overlapping sub-agents and to *"Fix whatever assumes sub-agents run one at a time."* Task 9's Goal names one such assumption (the `Agent` / `Task` note's *"how long the orchestrator was blocked on each dispatch"*) and treats it as the only one. The two `jq` programs carry a second one. `cli/templates/scripts/lib/run-analytics.jq` → `on_user` ends with `.ctx[$ck].awaiting = true` for every user event. In serial dispatch that is right, because a tool result in the orchestrator's context means the orchestrator's next request is in flight. With two `Agent` calls in one assistant event, and each `tool_result` in **its own** user event (the exact shape Task 9's own fixture encodes: one at `:40`, one at `:60`), the first result marks the orchestrator context `awaiting` while the orchestrator is still blocked on the second dispatch. `classify_gap` then takes `max_by(.value.last_seq)` over the awaiting contexts. Any idle gap in that window (`RUN_ANALYTICS_IDLE_SECS`, default 120 s) therefore gets the wrong label in two cases:
   - The remaining reviewer is mid-tool. The gap reads `in_flight_request` / `orchestrator`, when it is `tool_running` in that reviewer.
   - The remaining reviewer has a long API request in flight that started before the first result. The gap is attributed to `orchestrator` instead of that reviewer, because the orchestrator's `last_seq` is higher.

   This is a per-context time attribution that `### Time`'s idle-gap table renders. The plan neither fixes it nor states why it holds, so a prompt requirement is only partly mapped.
   **Raised against:** "fix what assumes one sub-agent at a time: the report's claim that the summed `Agent` time is how long the orchestrator was blocked, which overlap makes false."
   **Must hold:** The plan accounts for every place in `run-analytics.jq` / `run-analytics-report.jq` where overlapping dispatches change an attribution, idle-gap classification (`on_user`'s `awaiting` flag and `classify_gap`) included. Each such place is either fixed, with a case in the overlap suite that fails without the fix, or recorded with the verified reason it still holds.
   **Fix:** In `task_9_plan.md`, add the idle-gap classification to the Goal and the Work. For example: do not mark the orchestrator context `awaiting` while a dispatch it opened is still in `.open`. Then add a fixture gap over the threshold between the two results, with a case that asserts that gap's `class` and `context`. If that pushes the task past 20 points or 5 `**Work:**` bullets, split the analytics work into two single-layer `cli` tasks, update the readiness list, and give Task 21 a `**Depends on:**` on both.

## Should Fix

1. **Story index (`feat_parallel_plan_reviews_story_plan.md`) — the `current` rule is recorded as a decision the prompt left open, but the prompt stated it.** `## Context` says *"The two decisions above that the task prompt left to the planner … and `current` keyed on recorded outcomes rather than files"*. The task prompt's **Partial returns** bullet states the rule directly: *"On resume, the walker's `start` and `current` print only the gates without a valid round file."* The plan's reason holds: `current` is read-only, so a gate it skipped by file would never be recorded and the round could never close. In every case the prompt names, the two rules give the same result. Record it as a deliberate deviation from the prompt's wording, with that reason and the one case where the two rules differ (a file written but its `next` never run). Do the same in Task 22's **Reason**, so the decision record does not say the prompt left it open.
2. **`task_12_plan.md` — one Verification grep can never match.** The pattern ``business_parity_review\`, whose skip`` does not match the step-7 sentence it is meant to catch. The core currently reads *"`business_parity_review` for the task-plan draft, whose skip gates pass the walk to `architecture_review`"*, so the check passes whether or not the sentence was removed. Use a pattern taken from the text being deleted, for example `` `business_parity_review` for the task-plan draft `` or `pass the walk to`.

## Nice to Have

1. **`task_6_plan.md` — wrong attribution in `**Depends on:**`.** It credits Task 4 with exporting `walkerStatePath(dir)`. `cli/test/helpers/walker.mjs` already exports it, and Task 4's Work does not add it. Say instead that it already exists in the helper.
