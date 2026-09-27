### Task 23 — Record the acceptance walk in this story index

**Goal:** Show each of the task prompt's six acceptance criteria with its evidence. Behaviour that lives in code is shown by the `cli/test/` suite. Behaviour that lives in instruction prose is shown by a step-by-step walk of the landed instructions. The results are recorded in the story index's `## Acceptance walk` section, which the prompt names as the record.

**Depends on:** every earlier task, Tasks 1–22. This is the catch-all task, and it ships last because it walks what the others built. The facts it walks, restated:
- **The wrapper and its suite.** `run-test-suite.sh` (Task 1) and `cli/test/run-test-suite.test.mjs` (Task 2), whose cases cover pass, fail, per-round log versioning and exactly one command run per invocation.
- **The rule.** `plugin/instructions/unit_loop_core.md` → `## The test-run rule` and row `G.4` (Task 5), and `plugin/agents/layer-implementer.md` (Task 6).
- **The phase and its ledger.** `plugin/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` with `### G.0` to `### G.5` and `MAX_GATE_ROUNDS = 5` (Task 9), its family-3 citation (Task 13), and the ledger entries `G` / `RG` (Task 11).
- **The writers and reviewers.** Tasks 7, 8, 15 and 16.

### Targets

- `harness-runs/story_plans/feat_run_gates_phase_story_plan.md` → `## Acceptance walk` only. That means its six numbered criteria and the italic lead line. The `## Phase 2 Readiness — Ordered Fix List` section and every other section are untouched.

**Work:**

- [ ] **Criteria 1 and 2, from code and prose.**
  - For **2**, cite the `cli/test/run-test-suite.test.mjs` case titles that assert the one-line output and the per-round log.
  - For **1**, cite the case asserting exactly one command run per invocation, then walk the flow: `## Phase G` → `### G.1` is the only step issuing the wrapper, and a green first round leaves the phase. Every instruction that `grep -rn "run-test-suite.sh" plugin` finds invoking the wrapper is Phase G or one of the supervised statistics points. Other hits only name it. `grep -rn "test_cmd" plugin` shows no instruction for a unit to run it. `layer-implementer.md`'s output item 5 still reports `<typecheck_cmd>`.
- [ ] **Criteria 3 and 4, by walk.** Walk `### G.1` `fail` → G.2 → G.3 → G.4 → G.5 → G.1 as the orchestrator, naming each step's one prescribed action.
  - Walk a `fail` at every round up to the fifth: `<escalate>`, with no sixth fix loop.
  - Walk a resume after an answered park: G.0 yields a round of at least 5, so one gate run follows, and a `fail` escalates again.
- [ ] **Criterion 5, by grep and walk.** The expected set is the agent members of the `## The test-run rule` roster that Task 5 fixes, and nothing else: `plugin/agents/layer-implementer.md`, `plugin/agents/test-fix-plan-writer.md`, `plugin/agents/architecture-reviewer.md`, `plugin/agents/business-parity-reviewer.md`, `plugin/agents/task-plan-writer.md`, `plugin/agents/task-plan-reviewer.md`, `plugin/agents/user-review-fix-plan-writer.md`, `plugin/agents/review-plan-reviewer.md`, `plugin/agents/branch-reviewer.md` and `plugin/agents/skeptic-reviewer.md`. Do **not** derive the set from the story index's `## Scope register` rows marked `change`: those rows include `plugin/agents/committer.md` (row 34, Task 10's caller-table rows), which is not in the set because the committer writes and grades no plan, so no task gives it a pointer.
  - `grep -ln "The test-run rule" plugin/agents` must print **exactly** that set. A listed file outside it, or a member it does not list, is a failure of this criterion. Name it.
  - Show `layer-implementer.md`'s skip-without-blocker clause.
  - Then compare the rule's own roster against the landed tree. `grep -rln "The test-run rule" plugin` must print exactly the documents that `## The test-run rule`'s closing *who may cite this* paragraph enumerates, plus `plugin/instructions/unit_loop_core.md` itself. A hit off the roster, or a roster member with no hit, is a failure of this criterion. Name it.
- [ ] **Criterion 6, by pointer — this unit runs no gate.** This unit never executes the gate script, `<test_cmd>` or any test file (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points (1) and (4)). Criterion 6's evidence is the verdict the flow itself produces over the finished tree, after this unit, in its own gate run. Write the criterion's line to say exactly that, explicitly and not as *pending*:
  - that criterion 6 is shown by the flow's own gate run over the finished tree, not by a run of this unit;
  - where that verdict is recorded: the gate-run entry of this branch's flow-progress ledger, `harness-runs/flow_progress/feat_run_gates_phase_progress.md` (the `G.` entry once the running flow carries the Run gates phase), which flips only on a `pass`, while a `fail` opens the fix loop or parks the run instead;
  - no timing and no gate names, because this unit has observed no run (`harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session"*).
- [ ] **Write the section.** Replace each criterion's *pending* with its evidence: the case titles, the grep commands with what they printed, the walked step sequence, and for criterion 6 the pointer above. Replace the italic lead line with the date the walk was taken and the commit it was taken at, from `git rev-parse --short HEAD`.

**Verification:**

- Every criterion line in `## Acceptance walk` carries its evidence, and none still reads *pending*: `grep -n "pending" harness-runs/story_plans/feat_run_gates_phase_story_plan.md` prints no line inside `## Acceptance walk`. Criterion 6's line names the flow's own gate run and the ledger path above.
- No line this unit wrote asks for or reports a run of the gate script: `grep -n "run-gates.sh" harness-runs/story_plans/feat_run_gates_phase_story_plan.md` prints, inside `## Acceptance walk`, only criterion 6's own quoted wording.
- `git diff -- harness-runs/story_plans/feat_run_gates_phase_story_plan.md` shows changes inside `## Acceptance walk` only.
