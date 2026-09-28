### Task 12 — Wire Phase G into the task-engine autonomous and semi-autonomous forks

**Goal:** Make both task-engine forks run the core's new phase order, A → A1.5 → A2 → B → C → C2 → E → G → D. Have the autonomous fork flip the ledger entry `G`, count Phase G's commits among its push classes, and name the per-round test fix plans as a trip-wire round source.

**Depends on:** Task 9 and Task 11.
- **From Task 9:** `## Phase G — Run gates` in `plan_orchestration_instructions_core.md`. Its commit dispatches are G.3, which uses `review_plan_file`, and row `G.4`'s `review_item`. Its escalation points all go through `<escalate>`. It binds no new binding, so no binding row changes.
- **From Task 11:** the task-engine ledger entry `- [ ] G.      Run gates passed (the test-suite wrapper printed pass)`, between `E.` and `D.`, flipped by the orchestrator and never `[-]`-eligible.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md`.
- `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md`.

**Work:**

- [ ] **Phase lists in both forks.**
  - The opening sentence *"Phases **A → A1.5 → A2 → B → C → C2 → E → D** verbatim by reference"* becomes *… → E → G → D*.
  - In the autonomous fork, update the same list in `## What this file does NOT redefine`, whose bullet *"Phases A, A1.5, A2, B, C, C2, E, D bodies"* adds G.
  - In the semi-autonomous fork, add G to its own does-not-redefine list if that list enumerates phases.
- [ ] **Autonomous `<app_root>` binding row and `## Override F`.**
  - `<app_root>`: *"the core's Setup step 3 runs `<test_cmd>` (with the relative test path appended) and `<typecheck_cmd>` from `$REPO_ROOT`"* becomes: Setup step 3 runs `<typecheck_cmd>`, and Phase G's wrapper runs `<test_cmd>`, both from `$REPO_ROOT`.
  - Override F, *"The implementer self-verifies per its existing contract (it builds / runs tests where it can and reports a blocker otherwise)"*: the implementer runs `<typecheck_cmd>` and only the test files its unit wrote, per `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, and the Run gates phase is the verification gate.
  - Override F's **Scope** list, *"all six unit-loop substitution rows"*, becomes seven and adds **`G.4`** (per test-fix item).
- [ ] **Autonomous `<committer_push>` subsection.** Add G.3's `review_plan_file` dispatch to the *"every `mode: review_plan_file` dispatch"* bullet, and row `G.4`'s fix commits to the *"every `mode: review_item` dispatch"* bullet.
- [ ] **Autonomous `## Override G` flip points.**
  - Add a bullet between `E` and `D`: `G` — flip once Phase G's gate run prints `pass`. It is never seeded `[-]`. A cap-exhaustion or other Phase G escalation leaves it `[ ]`, and resume re-enters Phase G, whose `### G.0` derives the round.
  - The `D` bullet's ordering is unchanged.
  - In `## Override I` → *"This fork's units and review artifacts"* group (b), add the test fix plan indices, one per round in the `<test_fix_plan_path>` shape, and name them by that placeholder, never by a `<state_dir>/…` expansion.

**Verification:**

- `grep -n "C2 → E → D\|E, D bodies" plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` prints nothing, and every phase list the two files carry names G between E and D.
- `grep -n "relative test path appended\|runs tests where it can" plugin/instructions/plan_orchestration_instructions_autonomous.md` prints nothing.
- The `G` flip bullet's wording matches the ledger entry text in `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3`.
