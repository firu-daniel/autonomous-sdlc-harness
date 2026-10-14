## Unit-loop row A's branch-derived `commit_prefix` disagrees with this repository's commit-message policy for story-task commits
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` cell derives the prefix from the branch name (`chore_` → `chore`), so every Phase-A `committer` dispatch this run carried `commit_prefix: chore`. `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for the class "Adding new work — a story task's commit" and reserves `chore` for the flow's fixed-form subjects. The `committer` flagged the conflict in its return for Task 1 (`9f800d61`) and again for Task 6 (`84ee29be`), and committed with `chore:` as passed. All six task commits (`9f800d61`, `b14c5f21`, `25e7a309`, `8ce81fb3`, `937a10cc`, `84ee29be`) carry `chore:`, while the Phase C fix commit `c4a21932`, whose fix-row rule reads the policy's designation, carries no prefix.
- **cost this run:** six story-task commit subjects carry a prefix the repository policy reserves for flow-emitted artifacts.
- **hypothesis:** (guess) row A's rule predates the policy's per-class prefix designation that the fix rows already read.

## Index-only commit: one unit's commit staged only its readiness index
- **category:** optimization
- **evidence:** `git log --format='%h %s%n%b' --name-only dev..HEAD` — `Task 6`, `84ee29be`, staged set as its subject gives it: "story index records word counts and probe PASS" (the commit's only path is `harness-runs/story_plans/chore_thin_prose_family_docs_story_plan.md`).
- **cost this run:** none beyond the commit; the committer returned `staged: index-only`.
