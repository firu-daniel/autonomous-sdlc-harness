### 3. Five commit points still describe the wrapper as staging with `git add` and as declining `--no-verify`

**Sites** (each substring occurs once in its file, except where noted):

- `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` — "(`git add -- …`, never `git add -A`/`.`)"
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **Exact staging + commit.** — "the wrapper stages only that path with `git add -- <path>` and never `git add -A` / `git add .`", and "and never passes `--no-verify`"
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` → **Exact staging + commit.** — the same two substrings
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → "and never passes `--no-verify`", twice: the Override 3 UI-test-plan paragraph and the Override 4 "Make **one** commit" paragraph
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → the **whole-commit idempotency** paragraph — "and never passes `--no-verify`"

The rebuilt `commit-on-branch.sh` runs no `git add` at all. It builds the commit by plumbing in a temporary index (`cli/templates/scripts/commit-on-branch.sh` → THE COMMIT IS BUILT FROM PLUMBING, AND NO COMMIT HOOK RUNS), and it runs no commit hook of any kind. The sentences above still describe the old mechanism. They say the wrapper stages with `git add -- <path>`, and that it "never passes `--no-verify`", which implies hooks still run. This branch already rewrote the same sentence in `plugin/instructions/improvement_observations_instructions.md` → **Exact staging + commit.** to "the wrapper commits exactly that path, never a blanket staging", ending "the wrapper builds the message from the positional args after `--` only (subject only here) and runs no commit hook". The sites above were missed.

**Fix:** use the wording `improvement_observations_instructions.md` now carries:

- In `docs_orchestration_instructions_autonomous.md`, replace "(`git add -- …`, never `git add -A`/`.`)" with "(never a blanket staging)".
- In `plan_orchestration_instructions_autonomous.md` and `user_review_fixes_instructions_autonomous.md`, replace "the wrapper stages only that path with `git add -- <path>` and never `git add -A` / `git add .`" with "the wrapper commits exactly that path, never a blanket staging".
- At all six "and never passes `--no-verify`" sites, replace that substring with "and runs no commit hook". Leave the leading "No `Co-Authored-By:` / trailer and no `--no-verify` / hook-skip flag — the wrapper enforces both:" unchanged.

These are prose edits to instruction files and run no test.

- **Deviations from plan:** The finding's site list omits three more sentences in the same commit points that make the same stale claim: "the wrapper stages them with `git add -- <path>` and never `git add -A` / `git add .`" in `task_plan_writing_instructions_autonomous.md` (Override 3 and Override 4 **Exact staging + commit.**) and in `user_review_fix_plan_writing_instructions_autonomous.md` (**Exact staging + commit.**). Without them the finding's title would still hold, so they were rewritten in the plural form of the finding's wording: "the wrapper commits exactly those paths, never a blanket staging". The verification sweep `grep -rn 'git add -- <path>\|never passes `--no-verify`' plugin` now returns no matches.
