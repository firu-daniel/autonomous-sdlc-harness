## [A · Task 12 · general · iter 0] → layer-implementer  (#25)
- **added:** `context_notes:`
- **verbatim:** context_notes: Task 11's implementer recorded that the real run profile denies `Bash(curl:*)`, and `--allowedTools` cannot lift that deny, so its network sessions run on a scratch profile from `sp_scratch_profile sbx_net '.permissions.deny -= ["Bash(curl:*)"]'` — source: harness-runs/task_plans/feat_unattended_sandbox_measurement/task_11_plan.md **Deviations from plan:**, commit d7fb9de7 (scripts/lib/sandbox-probe/legs-network.sh)
- **why the agent could not derive it:** the deviation is recorded only in `task_11_plan.md`'s `**Deviations from plan:**` note, which is outside Task 12's read set (its own detail file and the story index); `task_12_plan.md` still names the real run profile for RS1's curl control.

## [C2 · skeptic-meta · iter 0] → review-plan-reviewer  (#66)
- **added:** `context_notes:`
- **verbatim:** context_notes: Three Phase A implementers recorded, in their detail files' deviation notes, that sourcing `scripts/lib/sandbox-probe/session.sh` under bash 3.2.57 prints `line 313: syntax error near unexpected token '<'` — source: harness-runs/task_plans/feat_unattended_sandbox_measurement/task_5_plan.md:49, task_7_plan.md:64, task_9_plan.md:54
- **why the agent could not derive it:** the three per-task detail files are outside the meta-reviewer's read set (the skeptic index, its finding files and the story index), and neither the code review nor the skeptic review mentioned the parse failure; the meta-reviewer's own `bash -n` was refused in this session's permission mode, so it could not re-measure it either.
