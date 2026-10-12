# Dispatch additions — feat_unattended_bash_sandbox

## [A · Task 12 · general · iter 0] → layer-implementer  (#45)
- **added:** `context_notes:`
- **verbatim:** context_notes: cli/src/config/check.ts (landed in commit fb5470b0) rejects a `reason` that is blank after trim() — whitespace-only included — for both `sandbox.allowedDomains[].reason` and `sandbox.optOut.reason`; source: the `**Deviations from plan:**` note in harness-runs/task_plans/feat_unattended_bash_sandbox/task_1_plan.md
- **why the agent could not derive it:** the fact is recorded only in Task 1's per-task file (`task_1_plan.md` → `**Deviations from plan:**`), which is outside Task 12's read set; Task 12's own plan gave each `reason` only `minLength: 1`
