### Task 14 — Wire Phase G into the user-review fix autonomous and semi-autonomous forks

**Goal:** Make both user-review fix forks run A → QA → **G** → D. Have the autonomous fork flip the ledger entry `RG`, cover Phase G's commits in its push classes, and name the round's test fix plans as a trip-wire round source.

**Depends on:** Task 11 and Task 13.
- **From Task 11:** the user-review-engine ledger entry `- [ ] RG. Run gates passed (the test-suite wrapper printed pass)`, between `R4.` and `R5.`. The fixes fork flips it, and it is never `[-]`-eligible.
- **From Task 13:** `user_review_fixes_instructions_core.md` → `## Phase G — Run gates`, which runs family 1's Phase G by reference with this family's `## Setup` placeholders: `<gate_key>` = `review_<n>`, `<test_fix_plan_path>`, `<test_fix_findings_dir>`, `<test_fix_review_folder>` and `<test_fix_findings_root>`. Its commit dispatches are G.3's `review_plan_file` and row `G.4`'s `review_item`. It adds no binding.

### Targets

- `plugin/instructions/user_review_fixes_instructions_autonomous.md`.
- `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md`.

**Work:**

- [ ] **Phase lists in both forks.**
  - The opening sentence *"Phases **A → QA → D** verbatim by reference"* becomes *A → QA → G → D*.
  - The autonomous fork's `## What this file does NOT redefine` bullet *"Phases A, QA (incl. the E.0–E.4 loop …), and D bodies"* adds G, which runs family 1's `## Phase G` by reference.
  - The semi-autonomous fork's *"Every phase body — **A, QA (the QA.0 augment and the QA.1+ loop), D**"* adds G.
- [ ] **Autonomous `<app_root>` binding row.** *"the core's Setup step 3 runs the configured `commands.test` string (with the relative test path appended) and the configured `commands.typecheck` string from `$REPO_ROOT`"* becomes: Setup step 3 runs the configured `commands.typecheck` string, and the cited Phase G's wrapper runs `commands.test`, both from `$REPO_ROOT`. Keep the rest of the row verbatim.
- [ ] **Autonomous `### <committer_push>` subsection.** Its enumeration *"the Phase A `mode: review_item` per-finding fix commits, and Phase QA's …"* adds Phase G's `mode: review_plan_file` test-fix-plan commit and its `mode: review_item` test-fix commits.
- [ ] **Autonomous ledger override** (the section whose bullets flip `R3`, `R4` and `R5`). Add an `RG` bullet between `R4` and `R5`: flip once the cited Phase G's gate run prints `pass`. It is never seeded `[-]`. A Phase G escalation leaves it `[ ]`, and a resume re-enters Phase G, whose `### G.0` derives the round. The `R5` bullet's ordering is unchanged.
- [ ] **Autonomous trip-wire roots.** In *"This fork's units and review artifacts (for the trip-wire diff)"*, add a bullet **Test-fix rounds (Phase G)**: the index at `<test_fix_plan_path>` for each round this cycle created, with its findings under `<test_fix_findings_dir>` and, when per-unit review runs, per-item reviewer findings under `<test_fix_findings_root>`. Name them by placeholder, as the ⚠️ sentence there requires. Count only the rounds of this cycle's `<gate_key>`.

**Verification:**

- `grep -n "A → QA → D\|QA, D\*\*\|and D bodies" plugin/instructions/user_review_fixes_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` prints nothing, and every phase list names G.
- `grep -n "relative test path appended" plugin/instructions/user_review_fixes_instructions_autonomous.md` prints nothing.
- The `RG` bullet's entry text matches the template line in `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3`.
