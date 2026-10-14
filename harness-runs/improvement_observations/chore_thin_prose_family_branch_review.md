## Row A's branch-derived commit_prefix disagreed with the repository's commit policy for story-task commits
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`, `commit_prefix rule` cell: "from the branch name: `feat_` → `feat`, `fix_` → `fix`, `refactor_` → `refactor`, else `chore`". The Task 1 dispatch passed `commit_prefix: chore` on that rule, and commit `2373da79` landed as `chore: Task 1 — thin shared reviewer blocks, write family check probe`. The committer's return noted that `.claude/context/conventions.md` → the commit policy table gives a story task's commit the prefix `none`, and keeps `chore` for the flow's fixed-form subjects. Tasks 2–10 were dispatched with `commit_prefix: none` and landed without a prefix (`5db6dd1f` … `1e1907b3`), so the branch carries both forms.
- **cost this run:** one task commit carries a prefix the repository's policy does not designate for its class; no rework.
- **hypothesis:** the fix rows already defer to the committer's designation (`### Named exceptions` → **The fix rows**), while row `A` still hardcodes a branch-name mapping.

## Index-only commit: Task 10
- **category:** optimization
- **evidence:** `git log --format='%h %s%n%b' --name-only dev..HEAD` matches one `mark … done — ` subject among this run's readiness units: `Task 10`, `1e1907b3`, staged set `record after word counts in story index` (the committer's return carried `staged: index-only — harness-runs/story_plans/chore_thin_prose_family_branch_review_story_plan.md was the whole diff`). Task 10's own detail file planned it as an index-only measurement task.
- **cost this run:** none; the unit's work was the story-index edit itself.
