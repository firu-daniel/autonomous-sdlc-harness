### Task 5 — The user-review fix core describes and reports the two-gate Phase G

**Goal:** Make `plugin/instructions/user_review_fixes_instructions_core.md` match the two-gate Phase G it runs by reference. Its opening paragraph, its `<test_cmd>` / `<typecheck_cmd>` row, its `## Phase G — Run gates` pointer and its Done summary each say that a round runs the whole-tree `<typecheck_cmd>` and `<test_cmd>`, and passes only when both pass.

**Depends on:** Task 4, which rewrites the cited `plan_orchestration_instructions_core.md` → `## Phase G — Run gates`. That section now states that each round's one `run-test-suite.sh <gate_key>_round_<gate_round>` call runs `commands.typecheck` (whole tree, no path argument) and then `commands.test`. The test runs even when the typecheck failed, and the one verdict line is `pass` only when both passed, or when the typecheck was not run for `<none>` and the test passed. Its G.5 states the run-both decision and that a round broken both ways spends one of `MAX_GATE_ROUNDS = 5`. Its Done bullet reports which gates the pass covered, from configuration. This file **points** at that section and restates none of it (`mode_contract.md` rule (5)).

### Targets

- `plugin/instructions/user_review_fixes_instructions_core.md`

**Work:**

- [ ] Opening paragraph: change "then the Run gates phase, which runs the configured test command once and loops its failures back" to the two-gate wording, matching Task 4's opening paragraph in substance.
- [ ] `## Resolved values` → the `<test_cmd>` / `<typecheck_cmd>` row: keep "**Only the cited `## Phase G — Run gates`'s wrapper consumes `<test_cmd>`**" and add that the same wrapper also runs `<typecheck_cmd>` over the whole tree once per round, applying the row's own `<none>` rule.
- [ ] `## Phase G — Run gates`: change "it is the only step of this flow that runs `<test_cmd>`, through its wrapper" to say it is the only step that runs `<test_cmd>`, and the only one that runs `<typecheck_cmd>` over the whole tree on the flow's behalf, both through the one wrapper call. "(G.0–G.5) **verbatim**" and the substitutions table are unchanged.
- [ ] `## Phase D — Done`: in "**Run gates (Phase G): passed on round N, with X test fixes landed across the rounds**", add the same which-gates clause Task 4 adds: "type check and tests", or "tests; type check not run (`commands.typecheck` is `<none>`)", taken from configuration and never from a log. Change "Phase G is where the suite runs" to "Phase G is where the type check and the suite run".

**Verification:**

- `grep -nE 'runs the configured test command once|only step of this flow that runs' plugin/instructions/user_review_fixes_instructions_core.md` prints no line naming `<test_cmd>` without `<typecheck_cmd>`.
- The Done-summary bullet here and the one in `plugin/instructions/plan_orchestration_instructions_core.md` carry the same which-gates wording. Compare the two lines found by `grep -n 'Run gates (Phase G): passed on round' plugin/instructions/plan_orchestration_instructions_core.md plugin/instructions/user_review_fixes_instructions_core.md`.
- No Phase G step text is copied into this file: the section still runs the cited core "**verbatim**" by pointer.
