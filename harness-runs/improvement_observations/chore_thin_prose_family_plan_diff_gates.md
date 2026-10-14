## Unit-loop row `A`'s branch-derived `commit_prefix` contradicts the repository's commit policy for story-task commits
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table`, row `A`, `commit_prefix rule` cell: "from the branch name: `feat_` → `feat`, `fix_` → `fix`, `refactor_` → `refactor`, else `chore`". `.claude/context/conventions.md` → `## Commit-message policy`: "**Adding new work** — a story task's commit | **`none`**". The orchestrator followed row `A` and passed `commit_prefix: chore` on all seven Phase-A `mode: task` dispatches, and the committer's return on the first (commit 9572f5d3) and last (commit 6718a82d) flagged the conflict and named `none` as the policy's value. Commits 9572f5d3, 4f1bdab8, 457502a1, be45b65a, fd38c888, f855324f and 6718a82d carry `chore:`. The fix rows' designation rule resolved `none` for Phase C (commit 2d592d02), so the branch now mixes both forms.
- **cost this run:** seven story-task subjects carry a prefix the repository policy says they should not carry.
- **hypothesis:** row `A` predates the per-commit-class designation that the fix rows already read from `<commit_conventions>`.

## A plan reviewer returned its verdict while one of its own background shells was still running
- **category:** silent-failure
- **evidence:** the planning-loop `task-plan-reviewer` dispatch (heartbeat `[plan-write · iter 0] → task-plan-reviewer  (#3)`) returned `verdict: PASS`, and its completion notice said it "stopped with background work of its own still running". A shell it had started, titled "Re-running scope register derivation commands", was still running well into implementation Phase A2. The operator noticed it and stopped it by hand. No file was left under `harness-runs/task_plan_reviews/chore_thin_prose_family_plan_diff_gates/` and the tree stayed clean.
- **cost this run:** one orphaned shell that needed an operator to stop it; in a headless run nobody would have.

## Index-only commit
- **category:** optimization
- **evidence:** `git log --format='%h %s%n%b' --name-only dev..HEAD` lists one `mark … done — ` subject among this run's units: 6718a82d `chore: Mark Task 7 done — word counts recorded in story index` (unit `Task 7`). That task's only work product was the story index's word-count table, so the committer's `staged: index-only` return was expected by the plan.
- **cost this run:** none; recorded as the trip-wire's measurement.
