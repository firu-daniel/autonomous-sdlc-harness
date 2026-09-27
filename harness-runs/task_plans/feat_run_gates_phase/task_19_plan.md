### Task 19 — Update `/autonomous-sdlc-harness:branch-status` and the engine commands' phase lists

**Goal:** The commands an operator runs describe the new phase order, in every form they state it (arrow string, per-phase bullet list, or prose), and the status digest surfaces the Run gates phase's artifacts next to the review artifacts it already summarises.

**Depends on:** Task 9, Task 12, Task 13 and Task 14.
- The orders are now A → A1.5 → A2 → B → C → C2 → E → **G** → D (family 1 core) and A → QA → **G** → D (user-review fix core). Task 12 wires G into the semi-autonomous task-engine fork, and Task 14 into the semi-autonomous user-review fix fork, so both semi-autonomous commands below run it.
- Phase G's body lives at `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` (Task 9). It runs the configured test command once through `bash <scripts_dir>/run-test-suite.sh <label>`; a `fail` is looped through a test fix plan (written by `test-fix-plan-writer`, approved by `architecture-reviewer`), and the loop is capped at `MAX_GATE_ROUNDS = 5` gate runs. The user-review fix core runs it by reference (Task 13).
- Phase G prints `[G · gates · round <gate_round>] → run-test-suite.sh` before each gate run and `[G · gates · round <gate_round>] pass|fail <log>` after it, and commits one test fix plan index per failing round, at `<state_dir>/test_fix_plans/<branch>_<gate_key>_round_<gate_round>.md`, with its readiness list.

### Targets

- `plugin/commands/branch-status.md` → `## Steps` step 5.
- `plugin/commands/branch-start-plan-autonomous.md`.
- `plugin/commands/branch-start-user-review-fix-autonomous.md`.
- `plugin/commands/branch-implement-plan-semi-autonomous.md`.
- `plugin/commands/branch-implement-user-review-semi-autonomous.md`.

**Work:**

- [ ] **`branch-status.md` step 5.** Its **End-of-branch reviews** bullet lists the review directories to read. Add `<state_dir>/test_fix_plans/`. From each round's index, pull the `## Must Fix` items with their `[x]` / `[ ]` state, like the others, plus the `## Not fixable on this branch` list, which is the likeliest reason a run parked there. Step 4's *"current phase / heartbeat line"* already surfaces the `[G · gates · …]` lines unchanged. The command stays read-only.
- [ ] **`branch-start-plan-autonomous.md`.** Both phase lists, *"the **core's** Phases A → A1.5 → A2 → B → C → C2 → E → D"* in `## Context` and the one in step 6, become *… → E → G → D*.
- [ ] **`branch-start-user-review-fix-autonomous.md`.** Both *"Phases A → QA → D"* lists become *A → QA → G → D*.
- [ ] **`branch-implement-plan-semi-autonomous.md`.** Two statements of the order:
  - its *"`A → A1.5 → A2 → B → C → C2 → E → D`"* becomes *… → E → G → D*;
  - in the per-phase bullet list, add a `- **Phase G:**` bullet between `- **Phase E:**` and `- **Phase D:**`, in that list's own style (bold lead, one or two sentences). It says the configured test command runs once through the `run-test-suite.sh` wrapper, that a failure is looped through a test fix plan and re-run, and that the loop is capped at five gate runs, and it points at `plan_orchestration_instructions_core.md` → `## Phase G — Run gates`. It restates nothing else of the phase, and it names the test command in words, not as the `<test_cmd>` token (this file declares no such token).
- [ ] **`branch-implement-user-review-semi-autonomous.md`.** Put the Run gates phase between Phase QA and Phase D in all three statements of the order:
  - `description:` *"… then run the QA phase (semi-autonomous variant)"* becomes *"… then run the QA phase and the Run gates phase (semi-autonomous variant)"*;
  - the paragraph opening **"Phase A (fixes) followed by a QA phase."** becomes **"Phase A (fixes) followed by a QA phase and a Run gates phase."**, and gains one sentence after the Phase QA description: after QA, **Phase G** runs the configured test command once through the `run-test-suite.sh` wrapper and loops any failure through a test fix plan, capped at five gate runs (`user_review_fixes_instructions_core.md`, which runs `plan_orchestration_instructions_core.md` → `## Phase G — Run gates` by reference);
  - step 4's *"The canonical loop for Phase A and the subsequent Phase QA (UI-test augment + QA loop) — and for Phase D —"* becomes *"… Phase QA (UI-test augment + QA loop), Phase G (Run gates) — and for Phase D —"*, and the sentence's closing citation chain adds that the gate loop is canonical in `plan_orchestration_instructions_core.md` → `## Phase G — Run gates`.

**Verification:**

- `grep -rn "C2 → E → D\|A → QA → D" plugin/commands` prints nothing.
- `grep -n "^- \*\*Phase [A-Z0-9.]*:\*\*" plugin/commands/branch-implement-plan-semi-autonomous.md` lists the bullets in order, and the `**Phase G:**` line sits after the `**Phase E:**` line and before the `**Phase D:**` line.
- `grep -nE "then run the QA phase \(|followed by a QA phase\.|Phase QA \(UI-test augment \+ QA loop\) — and for Phase D" plugin/commands/branch-implement-user-review-semi-autonomous.md` prints nothing: no statement in that file still goes from QA straight to D. `grep -n "Run gates\|Phase G" plugin/commands/branch-implement-user-review-semi-autonomous.md` shows a hit in the `description:`, in the Phase A paragraph, and in step 4.
- `grep -n "test_cmd" plugin/commands/branch-implement-plan-semi-autonomous.md plugin/commands/branch-implement-user-review-semi-autonomous.md` prints nothing, or prints only lines each file's own `## Resolved values` declares.
- Every `## Phase G — Run gates` citation resolves: `grep -n "^## Phase G — Run gates" plugin/instructions/plan_orchestration_instructions_core.md`.
- `grep -n "test_fix_plans" plugin/commands/branch-status.md` shows the new read, and the command's closing line still states it writes nothing.
