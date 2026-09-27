### Task 17 — Run the gates once before statistics in the three supervised statistics points

**Goal:** Implementers no longer run the suite per unit, and that holds in the supervised flows too. So the supervised flows run the gates once, at each point where they would otherwise write statistics over an unverified tree. A `fail` is handed to the human with its log path, and statistics wait.

The supervised flows get no writer/reviewer fix loop. They are human-gated item loops with no safety contract and no reviewer agents (`plugin/instructions/plan_orchestration_instructions.md`'s own opening note), so the fix route is the human's. The story index `## Context` records this decision.

**Depends on:** Tasks 1, 5 and 9. Task 9 supplies the heading `### G.1 Run the gates` in `plugin/instructions/plan_orchestration_instructions_core.md`, which states the backgrounded-run wait this task cites.
- **Task 1 — the wrapper.**
  - Invocation: `bash <scripts_dir>/run-test-suite.sh <label>`.
  - Output: exactly one stdout line, `pass` or `fail <repo-relative log path>`. A refusal is exit 2 with one `run-test-suite.sh: <reason>` stderr line and nothing on stdout.
  - Log: `<state_dir>/test_run_logs/<branch>/<label>.log`, replaced when the same label runs again. Beside it the wrapper leaves `<label>.verdict`, holding the line it printed, and `<label>.running` while the command is in flight.
  - Wait form: `bash <scripts_dir>/run-test-suite.sh --wait <label>` never runs the command. It prints the verdict line (`pass` or `fail <log>`) once one exists, returns `pending` (exit 3) after at most one bounded wait slice while the run is still going, and refuses (exit 2, nothing on stdout) when no run is in flight.
- **Task 5:** `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, which the supervised implementer dispatches also follow.

### Targets

- `plugin/instructions/code_review_instructions.md` → step 6.
- `plugin/instructions/code_review_fixes_instructions.md` → `## Phase 3`.
- `plugin/instructions/user_review_fixes_instructions.md` → `## Phase 3`.

**Work:**

- [ ] **The gate run, stated once per file.** Before each file's `statistics-plan-writer` dispatch, add a gate run: run `bash <scripts_dir>/run-test-suite.sh <label>` from `<repo_root>` and read only its line.
  - The labels are `task_supervised` in the two code-review files and `review_<n>_supervised` in the user-review one, where `<n>` is the active fix plan's round and the unsuffixed plan is round 1.
  - `pass` → dispatch the statistics writer as now.
  - `fail <log>` → do not write statistics. Tell the user the gates failed, name the log path, and stop. The same command re-runs this step once the failure is fixed.
  - No line → report the wrapper's stderr line and stop.
  - If the tool layer moves the run to the background, re-issue `bash <scripts_dir>/run-test-suite.sh --wait <label>` as a plain foreground command after each `pending` until it prints the verdict line — the same mechanism as `plan_orchestration_instructions_core.md` → `### G.1 Run the gates`, cited by that heading rather than restated. No `Monitor` and no `sleep`. A `--wait` refusal is the no-line case.
  - Each file gains a `<scripts_dir>` row in its `## Resolved values` table, class `config value`, key `scriptsDir`.
  - The gate-run step's lead sentence gives its reason by pointer only: the implementers this flow dispatched ran no suite, per `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`. It restates none of the rule. The three files are on that section's roster (Task 5).
- [ ] **`code_review_instructions.md` step 6**, the clean-pass statistics write: its `fail` report names `/autonomous-sdlc-harness:branch-implement-review` as the command whose Phase 3 re-runs the gates, because a clean pass has no fix flow to return to.
- [ ] **`code_review_fixes_instructions.md` and `user_review_fixes_instructions.md` → `## Phase 3`**: each phase's guard stays *"every `[ ]` entry … is now `[x]`"*. The gate run is the phase's first step, and the statistics dispatch its second.

**Verification:**

- `grep -n "run-test-suite.sh" plugin/instructions/code_review_instructions.md plugin/instructions/code_review_fixes_instructions.md plugin/instructions/user_review_fixes_instructions.md` shows exactly one invocation per file, each before that file's `Write branch statistics` / `Update branch statistics` block.
- Walk the supervised user-review flow as the orchestrator with a failing gate. The text stops before statistics, names the log, and names the re-run route. With a passing gate it proceeds to statistics unchanged.
- `grep -ln "The test-run rule" plugin/instructions/code_review_instructions.md plugin/instructions/code_review_fixes_instructions.md plugin/instructions/user_review_fixes_instructions.md` lists all three files.
- None of the three files gains a binding table: `grep -n "Mode contract" plugin/instructions/code_review_instructions.md plugin/instructions/code_review_fixes_instructions.md plugin/instructions/user_review_fixes_instructions.md` prints nothing, because supervised files declare none.
