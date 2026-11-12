### Task 13 — Respell the first half of the plugin instruction documents

**Goal:** Make the first fifteen instruction documents, alphabetically, name `devscene.config.json`, the `devscene/` and `devscene-scripts/` defaults, `/devscene:analyze` and the `devscene pause <branch>` run title.

**Depends on:** Tasks 1, 4, 6 and 11. These fix the names and defaults the instructions describe, the run title the pause poll matches and the command file's path.

**Where this task stops.** The second half of the instructions, the samples and `plugin/docs/` are Task 14's. No `## ` heading, binding name, `<placeholder>`, fixed commit subject or quoted wire literal changes apart from the table's substrings (`.claude/context/plugin.md` → `## Writing agent prose`; `.claude/context/conventions.md` → `## Commit-message policy`).

### Targets

`plugin/instructions/`: `autonomous_pause_and_ledger.md`, `clarification_digest_instructions.md`, `code_review_fixes_instructions.md`, `code_review_instructions.md`, `dispatch_discipline_instructions.md`, `docs_orchestration_instructions_autonomous.md`, `docs_phase_instructions.md`, `improvement_observations_instructions.md`, `main_repo_resolution.md`, `mode_contract.md`, `plan_orchestration_instructions.md`, `plan_orchestration_instructions_autonomous.md`, `plan_orchestration_instructions_core.md`, `plan_orchestration_instructions_semi_autonomous.md`, `prompt_injection_screen.md`.

**Work:**

- [ ] Every file: the `<state_dir>` row's *"Default `sdlc-harness/`"* becomes *"Default `devscene/`"*, and row 1 of `## Context`'s spelling table applies to every config-file mention in the body.
- [ ] `prompt_injection_screen.md`: the `<scripts_dir>` row's *"`scripts/` when the key is absent"* becomes *"`devscene-scripts/` when the key is absent"* (row 14).
- [ ] `autonomous_pause_and_ledger.md`: the remote pause sentence names *"the `devscene pause <branch>` dispatch"* (row 12). `plan_orchestration_instructions_autonomous.md`: its corpus-staleness route names `/devscene:analyze` (row 6). It is a fork, so a slash-command name is admissible there. No core gains one (`plugin/instructions/mode_contract.md` rule 4).
- [ ] `mode_contract.md`: respell only its `## Resolved values` row and any config-file mention. Its anchors and rosters are unchanged.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-analyze|harness (run|pause|stop)( [^a-z ]|[^ a-z]| [a-z]+_)|`scripts/` when the key is absent' -- plugin/instructions/autonomous_pause_and_ledger.md plugin/instructions/clarification_digest_instructions.md plugin/instructions/code_review_fixes_instructions.md plugin/instructions/code_review_instructions.md plugin/instructions/dispatch_discipline_instructions.md plugin/instructions/docs_orchestration_instructions_autonomous.md plugin/instructions/docs_phase_instructions.md plugin/instructions/improvement_observations_instructions.md plugin/instructions/main_repo_resolution.md plugin/instructions/mode_contract.md plugin/instructions/plan_orchestration_instructions.md plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/plan_orchestration_instructions_core.md plugin/instructions/plan_orchestration_instructions_semi_autonomous.md plugin/instructions/prompt_injection_screen.md` prints nothing.
- `git diff -U0 -- plugin/instructions` shows no changed `## ` heading line.
