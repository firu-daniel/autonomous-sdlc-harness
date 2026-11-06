# Architecture review — iteration 0

Reviewed: `harness-runs/story_plans/fix_phase_g_resume_answer_reads_and_park_loop_window_story_plan.md` (`## Context`, readiness list, `## Scope register`) and `task_1_plan.md` … `task_6_plan.md`, against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md` and `plugin/instructions/unit_loop_core.md` → `## The test-run rule`.

Layer placement holds for every task. Tasks 1, 2 and 5 touch only `cli/templates/` and `cli/test/` and are tagged `cli`. Tasks 3 and 4 touch only `plugin/agents/` and `plugin/instructions/` and are tagged `plugin`. Task 6 touches only `docs/` and `ARCHITECTURE.md` and is tagged `general`. Neither shipped half executes the other: Task 5's pins read plugin prose as text, which the existing `cli/test/run-gates-park-answer.test.mjs` already does. The ship order 1–6 follows the contract-before-consumer rule (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`). Every `**Verification:**` bullet names only the task's own created or edited test file, or a `git grep` / `bash -n` check, so none breaches the test-run rule. No task adds a tree-reading test, so rule 8 is not triggered. The self-adopted `scripts/autonomous-watcher.sh` is correctly left as a `no-change` row (`.claude/context/conventions.md` → `## Documents of record`).

## Must Fix

_None._

## Should Fix

1. **Task 6 describes `test-fix-plan-writer` as the Phase G answer's only reader without the "before Phase D" scope** — `task_6_plan.md`.
   The story index's `## Context` → **Decision — Phase D's clarification digest stays the one later reader** scopes every no-read rule to *before Phase D*, and it names the digest as the one later reader. W3, W5 and Task 1's watcher comment all carry that scope. Task 6 drops it in two places:
   - the **Depends on** bullet **Task 1 (the prompt)**: "…is never opened or quoted by the session, because G.0 passes that pair's paths to `test-fix-plan-writer`, its only reader."
   - the **Parking is the same shape, on a different file.** work bullet: "…is read only by `test-fix-plan-writer`, through G.0."
   As written, `docs/watcher.md` §4 would state an unscoped exclusive-reader rule. That contradicts `plugin/instructions/clarification_digest_instructions.md` → `## The entry format` → **answered:**, which quotes every answer verbatim, Phase G pairs included. It would also break Task 6's own verification bullet, which reads the doc sentence against `resume_clause` and expects them to agree.
   **Fix:** In both places in `task_6_plan.md`, restate the rule as W5 ships it: before Phase D, the session never opens or quotes such an answer; G.0 passes the pair's paths to `test-fix-plan-writer`, its only reader until Phase D's clarification digest quotes it. Add `plugin/instructions/clarification_digest_instructions.md` to the paragraph's repo-relative citations, beside `### G.0 Resolve the round`.

## Nice to Have

1. **W5 is the first place the watcher template quotes plugin-internal names, and nothing pins that copy against a plugin rename** — `task_1_plan.md` / `task_5_plan.md`.
   W5 puts `G.0`, `test-fix-plan-writer`, `Phase G`, `Phase D` and "clarification digest" into `cli/templates/scripts/autonomous-watcher.sh`. At `HEAD`, that file names none of them. The coupling direction is sanctioned: it is prose contract, not execution (`.claude/context/conventions.md` → `## The layers`). However, the rename sweep that file prescribes for a plugin wire string greps `plugin/` only (`### The order files are created, so a half-built feature is still coherent` → *"grep -rn the exact string across `plugin/`"*). So if the `### G.0 Resolve the round` heading or the `test-fix-plan-writer` agent is later renamed, the cli-side quote is stranded without anything noticing. Task 5 explicitly declines to pin the prompt against the plugin.
   **Fix (optional):** In Task 5's case (f), also assert that `plugin/instructions/plan_orchestration_instructions_core.md` still carries the `### G.0 Resolve the round` heading and that `plugin/agents/test-fix-plan-writer.md` exists. Have Task 1's watcher comment say that those two names are quoted from the plugin and are pinned there.
