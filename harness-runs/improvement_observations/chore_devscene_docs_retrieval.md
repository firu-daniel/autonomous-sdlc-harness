## Task 8 closed without a fix: the write to the notes-app permission profile was refused
- **category:** tooling-gap
- **evidence:** commit `dd930446`. Its body line reads `record disposition of Task 8 — tool-layer guard refused the write to examples/notes-app/.claude/settings.autonomous.json`. The diagnosis is in `harness-runs/task_plans/chore_devscene_docs_retrieval/task_8_plan.md` → `## Disposition`.
- **cost this run:** Task 8 was closed without a fix to `examples/notes-app/.claude/settings.autonomous.json`. The task's other files did land in the same commit.

## Architecture-review Finding 1 closed without a fix: the Edit to the notes-app permission profile was refused
- **category:** tooling-gap
- **evidence:** commit `160c78aa`, subject `fix: Record disposition of Finding 1 — tool-layer guard refused the Edit to examples/notes-app/.claude/settings.autonomous.json under its .claude/ path segment`. The diagnosis is in `harness-runs/architecture_branch_reviews/chore_devscene_docs_retrieval_arch_review/finding_1.md` → `## Disposition`.
- **cost this run:** the unit was closed without a fix.

## Code-review Finding 1 closed without a fix: the Edit to the notes-app permission profile was refused
- **category:** tooling-gap
- **evidence:** commit `7676233b`, subject `fix: Record disposition of Finding 1 — tool-layer guard refused the Edit to examples/notes-app/.claude/settings.autonomous.json under its .claude/ path segment`. The diagnosis is in `harness-runs/code_reviews/chore_devscene_docs_retrieval_code_review/finding_1.md` → `## Disposition`.
- **cost this run:** the unit was closed without a fix.

## Architecture review and code review raised the same finding on the branch
- **category:** optimization
- **evidence:** Reviewer overlap trip-wire, from the two readiness-index titles. `harness-runs/architecture_branch_reviews/chore_devscene_docs_retrieval_arch_review.md` entry 1 (architecture-reviewer, Phase A2) and `harness-runs/code_reviews/chore_devscene_docs_retrieval_code_review.md` entry 1 (branch-reviewer, Phase B) both carry the title "Re-render the notes-app permission profile's `harness-docs` sentence to match its template". This is the same file whose write Task 8 had already dispositioned (`dd930446`).
- **cost this run:** one refused write was dispositioned three times, in three separate commits (`dd930446`, `160c78aa`, `7676233b`), and none of them changed the file.
- **hypothesis:** (guess) the later reviewers had no signal that a unit had already dispositioned this write.
