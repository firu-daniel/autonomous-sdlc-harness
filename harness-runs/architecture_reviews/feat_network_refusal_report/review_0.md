# Architecture review — iteration 0

Reviewed: `harness-runs/story_plans/feat_network_refusal_report_story_plan.md` (`## Context`, `## Phase 2 Readiness — Ordered Fix List`, `## Scope register`) and every file in `harness-runs/task_plans/feat_network_refusal_report/` (`task_1_plan.md` to `task_7_plan.md`), against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md`, `plugin/instructions/unit_loop_core.md` → `## The test-run rule` and `plugin/instructions/untrusted_input.md` → `## The laundering check`.

Placement, ownership and dependency direction hold:
- Tasks 1–4 sit under `cli/`, tagged `cli`. Task 5 sits under `plugin/`, tagged `plugin`. Tasks 6–7 sit at the root outside `cli/` and `plugin/`, tagged `general`, last in the order.
- The decision logic stays in `lib/run-analytics.jq` and `lib/run-analytics-report.jq`. The driver only discovers, calls and merges, and the lane is still resolved by `hr_test_run_lane_dir` alone.
- The contract comes before its consumer: Tasks 1 and 2, then Task 3, then the `plugin` reader in Task 5, then the self-adopted copies in Task 6.
- `plugin/commands/branch-status.md` only reads what the `cli` templates write. This is the direction `.claude/context/conventions.md` → `## The layers` allows.
- No new script, `OUTER_LOOP_SCRIPTS` row, written artifact or permission is added.
- The new suites read fixed files and none of them is a tree guard.
- No `**Verification:**` bullet asks for a test run outside the unit's own new or edited test files.

## Must Fix

None.

## Should Fix

1. **`task_1_plan.md`: mode `gate_logs` sends `test_file` through the home step that the module's header excludes from file paths.** Mode `gate_logs` → **Matching** says "`line` and `test_file` go through `redact_text`". The plan defines `redact_text` as `redact_path` followed by the two `strip_home` steps. In `cli/templates/scripts/lib/run-analytics.jq`, the comment above `def redact_path` gives the reason mode `rounds`' file paths take no home step. It says that "strip_home splits on its prefix anywhere in the string, so the relative `src/home/a.test.ts` and `src/home/b.test.ts` would both become `src~`". It also says a cut "would … merge two values". Mode `gate_logs` merges identical `{kind, test_file, line}` into one entry with a `count`. So two relative test files under a `home/` segment would be recorded as one file, which is the merge that header warns about. `.claude/context/cli.md` → `## What "done" means here` says a change either satisfies the rule its module's header states or amends the header in the same edit. (This is a correctness issue spotted in passing, not a layering violation, so it is graded Should Fix.)
   **Fix:** In `task_1_plan.md` → mode `gate_logs` → **Matching**, choose one of these:
   - send `test_file` through `redact_path`, which has no home step, the way mode `rounds` treats its file paths, and say why in the `Mode gate_logs` header block; or
   - keep `redact_text` and add a sentence to that header block naming this collapse as an accepted residual, with a gate-log case in `cli/test/run-analytics-network-parse.test.mjs` that asserts the chosen behaviour.

## Nice to Have

None.
