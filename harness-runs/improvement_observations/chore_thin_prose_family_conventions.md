## A Phase-A implementer skipped the whole-tree type check, citing the plan's verification list
- **category:** agent-contract
- **evidence:** Task 3's `layer-implementer` return reported "Typecheck: not run. The plan's verification does not ask for it and the change is prose-only under `plugin/`." `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 2 states "A unit runs `<typecheck_cmd>` as written, with no path argument: the whole tree." The other seven Phase-A units and the Phase-C unit each ran `bash scripts/typecheck.sh` and reported `PASS: typecheck`. Commit 7713a726.
- **cost this run:** Task 3 landed with no unit-level type-check evidence; Phase G's round-1 whole-tree run (`pass`) covered it.
- **hypothesis:** (guess) the implementer read the per-task `**Verification:**` list as the full set of checks owed.

## A fix-loop implementer reverted its own edit with `git checkout`
- **category:** agent-contract
- **evidence:** The Phase C `layer-implementer` for code-review Finding 1 reported "my first attempt used the wrong line ranges and pulled in a blank separator line. I reverted it with `git checkout` and re-ran with the corrected ranges". `plugin/instructions/improvement_observations_instructions.md` → `## Commit mechanics` records that `git restore` / `git checkout` sit in the unattended profile's `ask` list. This run was the manual entry point, so the command ran. Commit 0c4da3a2.
- **cost this run:** none here; under the headless entry point the same revert would have met an `ask` prompt.

## Story-task commits carry `chore:` while the project commit policy designates no prefix for that class
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A` sets `commit_prefix` "from the branch name: `feat_` → `feat`, `fix_` → `fix`, `refactor_` → `refactor`, else `chore`", so this `chore_` branch's Task 1–8 commits were dispatched with `commit_prefix: chore` (ed6414b7, 8837d522, 7713a726, 82c619dd, 84f8caee, 16a1f0af, cd11a941, bc838fe5). `.claude/context/conventions.md` → `## Commit-message policy` lists "Adding new work — a story task's commit" as prefix **`none`** and reserves `chore` for the flow's fixed-form run-artifact subjects. The Phase C fix commit 0c4da3a2, dispatched with `commit_prefix: none` per the fix-row designation, follows the policy.
- **cost this run:** eight story-task subjects deviate from the repository's own commit policy.

## Index-only commit
- **category:** optimization
- **evidence:** one unit's commit staged only the story index: Task 8, bc838fe5, "Mark Task 8 done — after word counts and family check PASS recorded" (changed files: `harness-runs/story_plans/chore_thin_prose_family_conventions_story_plan.md`).
- **cost this run:** none; Task 8's work is the story-index measurement record itself.
