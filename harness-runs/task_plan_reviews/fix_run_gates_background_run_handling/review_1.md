# Task plan review — iteration 1

Round-0 Must Fix 1 (sandboxed measurement) and Must Fix 2 (`grep -c` count) are resolved in the artifact. The scope register's D1, D2, D3 and D5 entries were re-run verbatim and D4 was re-walked. Every site they reach is a row, so there is no closure finding.

## Must Fix

1. **`task_1_plan.md`: the `SIGNALS` measurement route is one the unattended profile refuses, so the plan steers Task 1 into its own blocker**
   The `**Header — SIGNALS.**` Work bullet says: *"Write a throwaway measurement script with the `Write` tool outside the repository … and run it with one plain `bash <its absolute path>` call"*. It then adds: *"If the one call itself is refused by the permission layer … stop and return a blocker"*. The unattended profile refuses both steps, so in an autonomous run that fallback is the certain outcome, not an edge case:
   - **The `Write` is refused.** `cli/templates/claude/settings.autonomous.json` → `permissions.allow` grants `Edit` only for `{{repoRoot}}` and `{{worktreeGlob}}`, plus `additionalDirectories` `{{stateDirAbs}}`. Its `_README` line *"THE `Edit` PAIR IS THE GRANT FOR CREATING A FILE TOO"* says `Write` is governed by those rules. A file "outside the repository" matches neither.
   - **The `bash` call is refused.** No allow entry matches `bash <arbitrary absolute path>`, and `defaultMode` is `dontAsk`: *"a tool call that is neither allowed nor denied is refused at once"*.

   The profile already names the sanctioned route, in its `_README` line *"THE PROBE ROUTE GRANTS AN INTERPRETER AT ONE REMOVE"*: write the file under `<state_dir>/scratch/`, then run `bash <scripts_dir>/scratch-run.sh <file>` (`scripts/scratch-run.sh` → `# Usage: scratch-run.sh <file-under-state-dir-scratch> [<arg>...]`).

   The bullet also leaves unstated what the wrapper is aimed at. The run form resolves `harness.config.json` from the repository its cwd sits in. Aimed at this checkout, the "held stub gate" would instead be this repository's real `commands.typecheck` / `commands.test`, started detached. That is a run `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 1 forbids. It would also break `.claude/context/conventions.md` → `## The testing bar`: *"No fixture is ever created inside this checkout, and no test is ever aimed at this repository."*
   **Fix:** In `task_1_plan.md`, rewrite the bullet's route:
   - Write the measurement script with the `Write` tool at `<state_dir>/scratch/<name>.sh`, which is gitignored by contents and never committed.
   - Run it with one plain `bash scripts/scratch-run.sh <state_dir>/scratch/<name>.sh` call. That is still one sandboxed Bash call.
   - Inside the script, build a throwaway git fixture under `$TMPDIR` with its own `harness.config.json`, whose `commands.test` is the held stub gate. Run the edited template wrapper from inside that fixture, never against this checkout.

   Keep the blocker fallback, but only for a refusal of that sanctioned call.

2. **`task_7_plan.md`: the replacement clause makes a CLI-behaviour claim with no version, against an explicit task-prompt constraint**
   The replacement text says *"with nothing pending, the headless process exits when the turn ends"*. That is probe A's measured CLI behaviour. The Work bullet *"Name no duration and no Claude Code version in the replacement"* then forbids attaching the version.

   The task prompt's `## Constraints` says: *"Every claim about CLI behaviour carries the version it was measured on."* The parenthetical pointer to §2.5 does not carry a version. Task 6's own Verification bullet sets the bar this clause fails: a sentence passes only if it *"names `2.1.309` … or cites a BG row that does"*.

   This was raised in round 0 as Should Fix 1. It was neither resolved in the artifact nor recorded under `## Rejected findings`. I grade it Must Fix here because the plan directs a breach of a stated prompt constraint in five shipped files.
   **Fix:** In `task_7_plan.md`, change the replacement string so it carries the version or cites the row. For example: *"with nothing pending, the headless process exits when the turn ends (Claude Code 2.1.309, macOS; `docs/sandbox-verification.md` → BG1; §2.5 states what a pending task or `Monitor` changes, and why neither is a resumption mechanism), so that exit is"*. Keep the string byte-identical across all five forks.
   - Replace the *"Name no … Claude Code version"* bullet with *"Name no duration."*
   - Update the second Verification `grep -rlF` string to match the new text.
   - Have Task 11's Verification bullet *"Every `BG<n>` id the plugin cites"* cover the new citation. It already does, since BG1 is in the set.

## Should Fix

1. **`task_2_plan.md`: the new start-up refusal is still not covered** (re-raised from round 0, Should Fix 2). Task 1 adds a refusal (exit 2, *"the detached run of <label> did not start"*) to the exit map, and Task 2 re-grounds only the existing refusals. Either add a case that makes the worker never claim `.running` and asserts the refusal on the bytes on disk (`.claude/context/cli.md` → *"A refusal is asserted on the bytes on disk"*), or name the case under the header's `Not covered here` with the reason.

2. **`task_1_plan.md`: a worker that claims `.running` after the start-up window has returned its refusal** (re-raised from round 0, Should Fix 4). A live run would then sit behind a refusal that G.1 escalates. State what happens: for example, the worker still runs, and a re-issued run form collects it through one-run-per-label. Record it among the header's residuals.

3. **`task_4_plan.md`: the plan core's D.2 bullet has no closing period.** `plugin/instructions/plan_orchestration_instructions_core.md`'s *"Run gates (Phase G): passed on round N"* bullet ends *"… never a remembered number"* with no period. `user_review_fixes_instructions_core.md`'s copy ends with one.

   Appending the clause *"after its last sentence"* therefore needs a separator that the Work bullet does not specify. Say whether to insert `. ` before *"Then report"*. Then check that Task 8's byte-identity span, which starts at *"Then report"*, is unaffected.

## Nice to Have

1. **`task_6_plan.md` / `task_4_plan.md`: rows cited before they exist.** Both cite BG rows that only Task 11, the last task, creates, so every commit between them carries dangling citations. The plan states this openly, and the configured layer order forces it. A line in the story index's `## Context` saying the interim commits are knowingly inconsistent would help a per-commit reviewer.
