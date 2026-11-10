# Architecture review — iteration 3

Both of iteration 2's Must Fix items are resolved:
- **Task 8 no longer edits a `cli/` file.** Its Targets are under `plugin/` only. The corpus-test entry is now Task 19, which is tagged `cli` and sits at walk position 9, directly after Task 8. I checked the authorisation the plan quotes against `harness-runs/clarifications/feat_prompt_injection_reviewer/question_2.md` and `answer_2.md`. The quotes in `task_8_plan.md`, `task_19_plan.md` and the story index's **Ordering** paragraph match the answer word for word. That answer is what iteration 2's fix asked for: it was taken to the user through the plan's `## Questions` route. It also explicitly requires Task 8 to quote the authorisation in its own detail file, so the guard's name in Task 8's **Where this task stops** paragraph is authorised and is not a breach of `unit_loop_core.md` → `## The test-run rule` point 4. That paragraph also states that it asks for no test run and limits none.
- **Task 9 no longer names the corpus guard.** Its Verification bullet now spells out the `RED ONCE (<what was mutated>) — <date>, <what failed>` form directly.

Every target sits inside the `layers[].path` of its tagged layer:
- Tasks 1–7, 9 and 19 are under `cli/`.
- Tasks 8 and 10–15 are under `plugin/`.
- Tasks 16–18 touch `scripts/`, `harness-runs/`, `evals/`, `README.md` and `docs/`, all in the `general` catch-all.

No task crosses the `cli`/`plugin` run-time boundary (`.claude/context/conventions.md` → `## The layers`). No plan file asks for a test run that the test-run rule forbids, and none fails the laundering check.

This review has no Must Fix. Iteration 2's three Should Fix items are still neither applied nor recorded. The story index has no `## Rejected findings` section, so each is raised again below. The lessons ledger requires each one to be applied, or recorded with its reason, in this revision round (`harness-runs/lessons.md` → *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason."*).

## Must Fix

None.

## Should Fix

1. **Task 10's citer roster names a fork that never points at the module.** This is raised for the third time. Files: `task_10_plan.md` (`## Who may cite this`) and `task_13_plan.md`. Sources:
   - `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`: "A policy file is activated by pointer and never restated".
   - `.claude/context/plugin.md` → `## What accompanies a new unit of each kind`, the shared-instruction-module row: the roster lists "those documents", meaning the documents that point at the module.

   The roster lists `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md`. Task 13's edits to that fork are the Override 4 create/re-seed and flip bullets and the Override 2 exclusion. They cite canonical-doc §1.4 and quote the `Raised by:` line, and none of them cites `prompt_injection_screen.md`. Every other roster member does get a pointer from its owning task (Tasks 11, 12, 13's command, 14 and 15).

   **Fix:** Do one of these, or record the finding under `## Rejected findings` with a reason:
   - drop that fork from Task 10's roster; or
   - in `task_13_plan.md`, have the Override 2 exclusion bullet cite `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## Edit and resume` as the source of the discard-and-re-ask rule, which that bullet already relies on.

2. **Task 10 adds a narration line of its own.** This is raised for the third time. File: `task_10_plan.md`, `## The steps` step 3, the bullet "Print `[screen · <path>] → prompt-injection-reviewer`". Source: `.claude/context/plugin.md` → `## Wires: dispatch in, return out`: "Narration surfaces are prescribed, and an asset adds none of its own".

   **Fix:** Do one of these, or record the finding under `## Rejected findings` with a reason:
   - drop the bullet; or
   - state that it is the entry core's safety-contract heartbeat, with `screen` as the phase and the path as the unit, and say why it has no `(#N)` counter, citing the module's own `## No override` dispatch-cost bullet.

3. **Task 8's `## Resolved values` declares the wrong token.** This is raised for the third time. File: `task_8_plan.md`, the **Frontmatter and frame** bullet ("**`## Resolved values`**, declaring `<state_dir>`"). Source: `.claude/context/plugin.md` → `## The sections an asset carries` (each token declared once, ahead of the body that uses it).

   The planned body never uses `<state_dir>`. The `foreign-execution` row in the same file does use `<scripts_dir>` ("the wrappers in `<scripts_dir>`"), and nothing declares it.

   **Fix:** Declare `<scripts_dir>` (config value, `scriptsDir`) instead of `<state_dir>`, or record the finding under `## Rejected findings` with a reason.

## Nice to Have

None.
