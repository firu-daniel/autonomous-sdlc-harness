## Row A's branch-name commit_prefix rule disagrees with this repo's commit-message policy for story tasks
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A` derives `commit_prefix` from the branch name (`chore_` → `chore`), so every Phase-A `committer` dispatch this run carried `commit_prefix: chore`. `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for the "Adding new work — a story task's commit" class and reserves `chore` for fixed-form run-artifact subjects. The `committer` flagged the mismatch in its return notes on the Task 1, Task 2, Task 5 and Task 10 commits (43f72c8e, 149dbac6, 520aaad7, e7f57379), and used `chore` as passed, per its contract's "use the value given". All 11 Task commits on this branch carry `chore:` (43f72c8e … dc34fe18). The fix-row commits, which follow `committer.md`'s designation rule, carry no prefix (4e75fe8f, 4d9dfcd2).
- **cost this run:** 11 story-task subjects carry a prefix the repository policy says they should not; the committer repeated the same advisory note four times.
- **hypothesis:** (guess) row A's rule predates the per-class prefix designation the fix rows now read, and the two were not reconciled.

## Index-only commit
- **category:** optimization
- **evidence:** `git log --format='%h %s%n%b' --name-only dev..HEAD` shows one unit commit whose subject is framed `mark … done — `: `Task 11`, dc34fe18, staged set "measurements recorded in the story index" (the only path it changed is `harness-runs/story_plans/chore_thin_prose_family_ui_tests_qa_story_plan.md`). The committer's return carried `staged: index-only`.
- **cost this run:** none observed — the task's own detail file names the story index as its only output.
