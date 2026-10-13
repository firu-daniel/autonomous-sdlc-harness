## Unit-loop row A's branch-name commit_prefix rule disagrees with the adopter's commit-message policy
- **category:** agent-contract
- **evidence:** Every Phase A `committer` dispatch passed `commit_prefix: chore`, from `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` cell ("from the branch name: … else `chore`"; branch `chore_thin_prose_family_fix-plan_statistics_writers`). Three of the six committer returns (Task 1 → `5175360d`, Task 4 → `8cae6137`, Task 6 → `264604b7`) carried a note that `.claude/context/conventions.md` → `## Commit-message policy` assigns a story task's commit the prefix `none` (line 163: "**Adding new work** — a story task's commit | **`none`**") and reserves `chore` for fixed-form run-artifact subjects. The committer applied the passed value each time, so all six task commits on the branch carry `chore:`.
- **cost this run:** six story-task commits landed with a prefix the repository's own policy does not designate for them; the orchestrator had no rule letting it follow the committer's note instead of row `A`'s cell.
- **hypothesis:** (guess) row `A`'s cell predates the fix rows' "by designation" rule, which defers to `committer.md`'s policy, and was not brought in line with it.

## Index-only commit
- **category:** optimization
- **evidence:** `git log --format='%h %s%n%b' --name-only dev..HEAD` shows one unit commit with a `mark … done — ` subject: `Task 6`, `264604b7`, staged set "record up-front word counts in story index" (the commit's only changed file is `harness-runs/story_plans/chore_thin_prose_family_fix-plan_statistics_writers_story_plan.md`).
- **cost this run:** none beyond the commit itself; the task's detail file states the story index is its only output.
