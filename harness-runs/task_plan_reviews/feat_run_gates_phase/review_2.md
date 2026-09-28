# Task plan review — iteration 2

The three Must Fix findings from `review_1.md` are resolved in the revised plan:
- E2 is widened, and row 79 plus Task 19's fourth file are added.
- Task 19 now plans the `**Phase G:**` bullet.
- Tasks 6, 7, 8, 15 and 16 either keep the declaring row or name the test command in words, with a grep that proves it.

Every derivation entry E1–E6 was re-run verbatim, and E7/E8 were re-walked. Every site reached is a row, so the closure invariant holds. The finding below is new.

## Must Fix

1. **Task 23's criterion-5 walk is set up to report a failure that is not one** — `task_23_plan.md`
   The **Criterion 5** Work bullet sets the check like this: *"Show the rule's pointer in every writer and reviewer the story index `## Scope register` rows 31–44 mark `change` … `grep -ln "The test-run rule" plugin/agents` must list that set. Name any register-change agent it does not list as a failure of this criterion."*
   Rows 31–44 include row 34, `plugin/agents/committer.md` → `### Which caller sends which mode`. That row is `change`, owned by Task 10. But the committer is neither a plan writer nor a plan reviewer:
   - Task 10 adds only caller-table rows to it.
   - Task 5's roster for `## The test-run rule` deliberately leaves it out.
   - So no task gives `committer.md` a pointer to the rule.

   Run as written against the landed tree, the grep will not list `committer.md`. The bullet then tells the unit to record criterion 5 as **failed**, and that false failure goes into the story index's `## Acceptance walk`, the record the task prompt's `## Acceptance` section names.
   The set is also wrong in the other direction. It leaves out two agents that do carry the pointer: `layer-implementer.md` (row 7) and `test-fix-plan-writer.md` (row 59). The bullet's second check, the roster comparison, does cover them.
   **Fix:** In `task_23_plan.md`, define the expected set as the agent members of the `## The test-run rule` roster that Task 5 fixes, not as "rows 31–44 marked `change`". Those members are `layer-implementer`, `test-fix-plan-writer`, `architecture-reviewer`, `business-parity-reviewer`, `task-plan-writer`, `task-plan-reviewer`, `user-review-fix-plan-writer`, `review-plan-reviewer`, `branch-reviewer` and `skeptic-reviewer`. Alternatively, keep the register reference but exclude row 34 by name, and say why: the committer writes and grades no plan. Either way, `grep -ln "The test-run rule" plugin/agents` must then equal that set exactly.

## Should Fix

1. **The log path's branch segment is still spelled two ways** (carried over from `review_0.md` / `review_1.md`; not addressed and not recorded under `## Rejected findings`).
   - `task_1_plan.md` and `task_2_plan.md` → **Depends on** use `<sanitized branch>`, through `hr_sanitize_branch`.
   - `task_2_plan.md` → **Pass and fail cases**, `task_3_plan.md`, `task_9_plan.md`, `task_17_plan.md` and the Context's log bullet use `<branch>`.

   Pick one spelling and restate it the same way everywhere.
2. **Task 2 still does not test two of the five refusals** (carried over). The **Depends on** block now lists an unresolvable configuration and an unset `commands.test`, but the **Refusals.** Work bullet has no case for either. A fixture can build both by editing `harness.config.json`.
3. **Where `G` / `RG` sit in the ledger's `[-]` paragraph** (carried over) — `task_11_plan.md`. The Work bullet still puts them in the *"safety-floor enumeration"* while giving the `P3` / `A` category's reason (*"a step no directive addresses and no flag gates"*). `run_mode_instructions.md` → `## The safety floor — what a run mode may never skip` does not name the gate run. Either place `G` / `RG` with `P3` / `A`, or target that file too.
4. **Task 5's "five fix rows" rename covers less than its Verification checks** (carried over) — `task_5_plan.md`. The Work bullet updates only the heading and the *cells* that cite it. Three prose uses in `unit_loop_core.md` are not cells:
   - the ⚠️ note's *"the five fix rows `task_heading: <finding_heading>`"*;
   - the `UR-A` review-prompt cell's *"not the five fix rows' …"*;
   - `#### Row UR-A` → **Review prompt first line.**

   `grep -rn "five fix rows" plugin/instructions` must print nothing, so name these three in the Work bullet.
5. **Task 8 does not extend the other sub-case-indexed parts of the file to (c)** (carried over) — `task_8_plan.md`. Three parts are not updated:
   - `### Plan-review mode FAIL (insertion points 1 and 3)` gets no (c) → `test-fix-plan-writer` consumer bullet, with its offending-file names;
   - the key table's `story_path` and `task_files_dir` rows get no (c) values;
   - *"Neither dispatch carries a `diff_base`, so the mode selector resolves both …"* still counts two dispatches.
6. **Criterion 6's pointer may name a ledger entry this branch never writes** (carried over) — `task_23_plan.md`. The plugin a run loads is the main checkout's copy. `harness-runs/flow_progress/feat_run_gates_phase_progress.md` was created without a `G.` line, and Task 11's rule gives a pre-existing ledger no flip. State a pointer that resolves either way.
7. **Task 9's and Task 13's `test_cmd` grep expectation conflicts with the Setup step 3 edit** (carried over). Each edit drops only the *"`<test_cmd>` (with the path to test appended) and"* clause. Step 3 still says *"the `<test_cmd>` / `<typecheck_cmd>` row above states what to run then"*, so each grep will hit outside `## Resolved values` / `## Phase G`. Say how that clause is reworded, or widen the expectation.
8. **G.1's "wait for it to exit" names no waiting mechanism** — `task_9_plan.md`. The autonomous fork's §2.5 paragraph (`plan_orchestration_instructions_autonomous.md` → `## Override G` → **Self-pause on API overload.**) forbids three things: scheduling a `Monitor`, sleeping for minutes, and ending the turn intending to continue. A backgrounded gate run in a headless session must be waited on without any of them. Say which permitted mechanism G.1 uses, so the implementer does not have to choose one.
9. **The supervised gate run can never pass in this repository's main checkout** — `task_17_plan.md`. `docs/development.md` → gate 6 records that the self-adopted main checkout's machine-local `.claude/settings.autonomous.json` carries every `$HOME` hit, and that `scripts/run-gates.sh` reports `FAIL 6a` there by design. A supervised flow run from the main checkout would therefore always stop before statistics. Consider giving the human an explicit way to proceed past an environmental `fail`, or state the known limitation.

## Nice to Have

1. Adopters who upgrade the plugin without re-running `init` have no `<scripts_dir>/run-test-suite.sh`. For them Phase G escalates on its "no verdict line" arm. A sentence in the adopter-facing docs from Task 4 or Task 22 would help: re-run `init` to receive the new script, in a fenced block, per the lessons ledger.
2. `task_12_plan.md`: `## Override I`'s per-item layer-reviewer roots sentence could list `<test_fix_findings_root>` (carried over).
3. `task_13_plan.md`: `## Setup` step 5's phase list (*"Phases are: **A** … → **QA** …"*) could gain Phase G.
4. `task_5_plan.md`: the `unit_loop_core.md` heartbeat-label footnote could name row `G.4`'s `Item <N>` label.
5. `task_21_plan.md`: the planted `harness-runs/scratch/test_run_logs/probe.log` could be removed after the check, so no `$HOME`-bearing file is left in the tree.
