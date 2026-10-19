## The architecture reviewer returned `verdict: FAIL` with `must_fix_count: 0`, and the walker treated each one as a revision round
- **category:** agent-contract
- **evidence:** plan-mode dispatches #4 and #12 returned `verdict: FAIL`, `must_fix_count: 0` (`harness-runs/architecture_reviews/feat_clone_per_run/review_1.md`, `review_2.md`); the implemented-branch dispatch (A2.1) did the same (`harness-runs/architecture_branch_reviews/feat_clone_per_run_arch_review.md`). In both plan files the only numbered finding sits under `## Should Fix` (the `repoRoot.ts` / `RUN_LOGS_DIR` item); the `## Must Fix` section holds unnumbered check bullets. The walker passed `--outcome FAIL` each time: dispatch #5 (`task-plan-writer`, revision 2) returned "no edits this round", and dispatch #12's FAIL was the one that hit the 5-revision cap (`binding: <escalate>`, `reason: cap`, `node: architecture_review`).
- **cost this run:** one `task-plan-writer` dispatch that changed nothing; the plan loop stopped at its cap and needed a live user decision (re-entered at the review gates, dispatches #13–#14, both PASS on the unchanged plan).
- **hypothesis:** guess only — the reviewer's FAIL criterion counts Should Fix items, while the writer's revision mode applies Must Fix only.

## Planning-phase Should Fix items, left unapplied by the revision writer, came back as implementation-phase findings
- **category:** flow-efficiency
- **evidence:** the `repoRoot.ts` retyped `'autonomous_logs'` item was raised in `harness-runs/architecture_reviews/feat_clone_per_run/review_0.md`, `review_1.md`, `review_2.md` (Should Fix) and again as Finding 1 of `harness-runs/architecture_branch_reviews/feat_clone_per_run_arch_review.md`; the SHA-256 `extensions.objectformat` item was raised in `harness-runs/task_plan_reviews/feat_clone_per_run/review_0.md` and `review_1.md` (Should Fix, "carried from iteration 0, still unaddressed") and again as Finding 1 of `harness-runs/skeptic_reviews/feat_clone_per_run_skeptic_review.md`. Writer returns for dispatches #3, #5, #8 and #11 each state Should Fix items were not applied "since I was not told to apply them".
- **cost this run:** two items reached the code before being fixed — four extra dispatches (implementer + committer each, A2 item 1 and C2 item 2) on top of the plan-loop rounds that re-raised them.

## The committer refused unit-loop row A's branch-derived `commit_prefix: feat`
- **category:** agent-contract
- **evidence:** dispatch #2 (`committer`, `mode: task`, Task 1, `commit_prefix: feat` — row A's rule "from the branch name: `feat_` → `feat`") returned `error: commit_prefix feat is not a legal value; the commit-message policy designates none for a story task's commit and lists only chore, so nothing was committed`, citing `.claude/context/conventions.md` → `## Commit-message policy`. Dispatch #3 with `commit_prefix: none` landed `3f84f687`.
- **cost this run:** one redone committer dispatch; every later task and fix commit used `none`.

## An architecture reviewer wrote a machine path into a committed plan-review file, and only the Run gates caught it
- **category:** agent-contract
- **evidence:** `harness-runs/architecture_reviews/feat_clone_per_run/review_2.md` (written by plan-mode dispatch #12, committed in `7c5e5539`… `chore: Add task plan for feat_clone_per_run`) carried an absolute home-directory path in its "Test-run rule" bullet. Run gates round 1 failed (`harness-runs/test_run_logs/feat_clone_per_run/task_round_1.log`); `harness-runs/test_fix_plans/feat_clone_per_run_task_round_1.md` Finding 1 rewrote it to `${CLAUDE_PLUGIN_ROOT}/…` (`f6a10b79`); round 2 printed `pass`.
- **cost this run:** one extra gate round and five dispatches, #67–#71 (`test-fix-plan-writer`, `architecture-reviewer`, `committer`, `layer-implementer`, `committer`).

## A layer implementer's `rm -rf` of its own temp fixture was refused, leaving the fixture behind
- **category:** tooling-gap
- **evidence:** Task 17's implementer (dispatch #34) built a throwaway `init` fixture under the system temp directory to re-render `examples/notes-app/.claude/settings.autonomous.json`; its return states "the permission layer refused my `rm -rf` of it" and that the fixture "needs removing by hand".
- **cost this run:** a stray directory left outside the checkout for the operator to remove.

## The plan needed 5 review rounds across its review folders
- **category:** optimization
- **evidence:** round artifacts on disk — `harness-runs/architecture_reviews/feat_clone_per_run/` holds `review_0.md`, `review_1.md`, `review_2.md`; `harness-runs/task_plan_reviews/feat_clone_per_run/` holds `review_0.md`, `review_1.md` (business-parity skipped, `phases.parity` false). Per round, by numbered finding title: architecture r0 2 net-new; r1 0 net-new / 1 re-raised; r2 0 net-new / 1 re-raised. Plan review r0 4 net-new; r1 3 net-new / 3 re-raised. Four further gate dispatches returned PASS and wrote no file (architecture ×3, plan review ×1).
- **cost this run:** 14 planning dispatches of the planning cap of 40, including the cap escalation above.
