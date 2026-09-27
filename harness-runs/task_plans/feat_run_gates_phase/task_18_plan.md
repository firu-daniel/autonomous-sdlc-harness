### Task 18 — Describe the Run gates phase in `AUTONOMOUS_FLOW.md` and the whiteboard

**Goal:** Bring the canonical flow document and its whiteboard summary into step with the new phase order. This covers the one-run-per-phase test model, the new wiring (wrapper, fix-plan writer, approving reviewer) and the agent count. Like the rest of `AUTONOMOUS_FLOW.md`, it points at the owning files and restates none of them.

**Depends on:** Tasks 1, 7, 8, 9, 11 and 13. The facts this task describes, and where each lives:
- **The wrapper.** `run-test-suite.sh` in `<scripts_dir>`, an agent-invocable outer-loop script the orchestrating session runs. It prints `pass` or `fail <log>` and logs per round under `<state_dir>/test_run_logs/` (Task 1).
- **The fix-plan writer.** `${CLAUDE_PLUGIN_ROOT}/agents/test-fix-plan-writer.md` (Task 7).
- **The approving reviewer.** `${CLAUDE_PLUGIN_ROOT}/agents/architecture-reviewer.md`, at its fourth insertion point (Task 8).
- **The phase.** `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates`, capped at `MAX_GATE_ROUNDS = 5`, then `<escalate>` (Task 9). The user-review fix core runs it by reference (Task 13).
- **The test-run rule.** `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` (Task 5).
- **The ledger entries.** `G` and `RG` (Task 11).

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md`.
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`.

**Work:**

- [ ] **`AUTONOMOUS_FLOW.md` → `## The wiring table`.**
  - The implementation-core row's *"A → A1.5 → A2 → B → C → C2 → E → D"* becomes *… → E → G → D*.
  - The fix-implementation-core row's *"A → QA → D"* becomes *A → QA → G → D*.
  - Add a row **Run gates phase — the test-suite wrapper, the fix-plan writer and its approving reviewer**, naming `run-test-suite.sh` in `<scripts_dir>`, `test-fix-plan-writer.md` and `architecture-reviewer.md`.
  - Add a row **What a unit runs, and what no plan may ask it to run**, naming `unit_loop_core.md` → `## The test-run rule`.
- [ ] **`## The inner loop of a task-prompt run`.** Insert a step **5. The Run gates phase (Phase G)** before the closing phase, and renumber *"The closing phase (Phase D)"* to 6. The step says, in three or four sentences:
  - the full test command runs here once and nowhere else, and implementers only type-check and run the test files they wrote;
  - a failure is written into a fix plan, gated, fixed through the unit loop, and the gates run again;
  - five runs is the cap, after which the run parks.

  The closing paragraph's walk becomes *planning → A → A2 → B → C → C2 → G → D*.
- [ ] **`## Drop a user review (fix cycle)`.** The sentence listing what the fix cycle does, *"re-runs the interactive-test phase where it is configured on, updates the branch's statistics file"*, gains the Run gates phase between the QA re-run and the statistics update.
- [ ] **`AUTONOMOUS_FLOW_WHITEBOARD.md`.**
  - In the **Implementation.** paragraph, after *"**E** exercises the running application where that phase is on"*, add *"**G** runs the configured test command once and loops any failure through a fix plan"*.
  - Update the row **4. The agent fleet**, whose agent list adds the test fix-plan writer, and its *"twenty-one agent definitions"* count.
  - Update the following paragraph's *"where it returns twenty-one"*.
  - Re-derive both counts with `ls plugin/agents/` and a count of its `.md` entries, never by adding one to the old figure.

**Verification:**

- `grep -n "C2 → E → D\|QA → D" plugin/docs/AUTONOMOUS_FLOW.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` prints nothing.
- Every `${CLAUDE_PLUGIN_ROOT}/…` path and `→` heading the new text cites resolves under `plugin/`, in particular `## Phase G — Run gates`, `## The test-run rule` and `agents/test-fix-plan-writer.md`. Re-run the citer sweep `plugin/docs/README.md` gives for `AUTONOMOUS_FLOW`, and check its output is a subset of the files present.
- The whiteboard's agent count equals the number of `.md` entries `ls plugin/agents/` shows.
