## The plan needed 3 review rounds; the structural reviewer re-raised its 4 Should Fix items unchanged and two of them shipped into the code review
- **category:** optimization
- **evidence:** plan-review rounds on disk: `harness-runs/task_plan_reviews/fix_profile_inert_permission_rules/review_0.md`, `review_1.md`, and `harness-runs/architecture_reviews/fix_profile_inert_permission_rules/review_0.md` — 3 round artifacts for the plan unit (the business-parity gate was skipped by `phases.parity: false`). Task-plan-reviewer round 1 vs round 0 (same root, titles only): Must Fix 1 net-new / 0 re-raised; Should Fix 0 net-new / 4 re-raised (Task 7 `docs/cli.md` sentences, `checks.ts` doc comments, the `run_profile_check` `delta` refusal sentence, W7 not isolating the profile rule). The architecture root has a single round, so no predecessor to diff. Two of the re-raised Should Fix items reappeared after implementation as code-review findings (`harness-runs/code_reviews/fix_profile_inert_permission_rules_code_review.md` → Finding 2 `delta` refusal, Finding 1 W7) and were fixed in Phase C.
- **cost this run:** 4 writer revisions in planning (dispatches #4, #7, #9 plus the initial write) and 2 implement + 2 commit dispatches in Phase C for items already known at planning time.
- **hypothesis:** guess — the writer's returns (dispatches #4 and #7) each said it applies Should Fix "only when the orchestrator says so", and the dispatch-discipline rule leaves the orchestrator no sanctioned way to say so.

## The unit loop's row-A `commit_prefix` rule (branch name → `fix`) was refused by the committer under this repository's commit policy
- **category:** agent-contract
- **evidence:** Phase A dispatch #2 (`[A · Task 1 · commit] → committer`) passed `commit_prefix: fix`, derived per `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A` ("from the branch name: `feat_` → `feat`, `fix_` → `fix` …"). The committer returned `error: commit_prefix fix is not in the commit_conventions vocabulary` citing `.claude/context/conventions.md` → `## Commit-message policy`, which designates `none` for a story task. Re-dispatched as #3 with `commit_prefix: none`, which landed `d05691c2`.
- **cost this run:** one committer dispatch redone; every later Phase A commit had to override row A's rule.

## Two task plans asked for a `.sh` probe driver run through `scripts/scratch-run.sh`, which refuses `.sh`
- **category:** agent-contract
- **evidence:** Task 5 (`harness-runs/task_plans/fix_profile_inert_permission_rules/task_5_plan.md`) and Task 8 (`task_8_plan.md`) each specified a `.sh` driver under `harness-runs/scratch/` run through `scripts/scratch-run.sh`; both implementers reported the runner refuses `.sh` (Task 8: exit 66) and recorded a `**Deviations from plan:**` note after writing a `.py` driver instead.
- **cost this run:** a plan deviation on 2 of 10 tasks; no rework.

## A layer-implementer's `rm -rf` cleanup of its own scratch copy was refused, leaving files behind
- **category:** tooling-gap
- **evidence:** Task 5's implementer return (Phase A dispatch #10) reported that a copy of the pre-branch guard and its library remains under `harness-runs/scratch/old/` because its `rm -rf` was refused; the directory is git-ignored and was not committed.
- **cost this run:** a leftover untracked directory the operator has to delete by hand.
