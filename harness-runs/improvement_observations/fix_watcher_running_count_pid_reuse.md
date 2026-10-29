## The plan reports two directories only the `general` catch-all describes (corpus staleness)
- **category:** tooling-gap
- **evidence:** the `task-plan-writer`'s first return (dispatch #1) carried a `## Corpus staleness` section with two `undescribed-layer` entries: `docs/`, which holds the documents of record including `docs/sandbox-verification.md`, which Task 3 edited, and which `doctor`'s `layer-drift` check lists; and `scripts/`, this checkout's adopted copy of the outer-loop scripts, including `scripts/autonomous-watcher.sh`, which Task 3 edited, described by `.claude/context/conventions.md` → `## Documents of record` but not by a `layers[]` row.
- **cost this run:** none to this branch. Both owe the supervised remedy in the writer's own spelling: run `/autonomous-sdlc-harness:harness-analyze` in a session in this repository, answering `skip` for every already-filled document (not `--yes`), then `npx autonomous-sdlc-harness config set layers` if a row is wanted.

## Four implementer shell commands were refused by the unattended permission profile
- **category:** tooling-gap
- **evidence:** from the implementers' own returns: `bash -n` on `cli/templates/scripts/autonomous-watcher.sh` refused (`[A · Task 1 · cli · iter 0]`, #13); `bash -n cli/templates/scripts/remote-run.sh` refused (`[A · Task 2 · cli · iter 0]`, #15); a compound `cp` copying the templates over the root `scripts/` copies refused (`[A · Task 3 · general · iter 0]`, #17); a `sed` mutation of `cli/templates/scripts/autonomous-watcher.sh` for a mutation check refused (`[C2 · Item 1 · cli · iter 0]`, #30).
- **cost this run:** each was worked around: the `bash -n` parse claims rest on `bash scripts/typecheck.sh`'s shell-parse step instead, recorded as an evidence downgrade; the copies and the mutation were done with the file-edit tool.

## The run copy has no local `dev` ref, so four agents diffed against `origin/dev` instead
- **category:** tooling-gap
- **evidence:** `harness.config.json` `defaultBranch` is `dev`; the `branch-reviewer` (#20), `review-plan-reviewer` (#21), `skeptic-reviewer` (#27) and `statistics-plan-writer` (#32) each reported no local `dev` ref in this checkout and fell back to `origin/dev` (merge base `2ace325d`, per the branch-reviewer).
- **cost this run:** none observed; each agent named the fallback base in its return.

## The branch-reviewer's mechanical sweep has no grep patterns configured
- **category:** tooling-gap
- **evidence:** the `branch-reviewer` return (#20): "The grep half of the mechanical sweep did not run. This project has no search patterns configured for it".
- **cost this run:** that half of the sweep was not run on this branch.

## A layer-implementer refused the first layer of a multi-layer finding instead of doing its half
- **category:** agent-contract
- **evidence:** code-review Finding 1 is tagged `_(layer: cli, general)_` (`harness-runs/code_reviews/fix_watcher_running_count_pid_reuse_code_review.md`). The `cli` dispatch `[C · Item 1 · cli · iter 0] → layer-implementer (#23)` returned an unmarked `blocker:` asking for the unit to be re-dispatched as `general` because the root copy is outside the `cli` path. Re-dispatched as #24 with a `context_notes:` line stating that a `general` dispatch follows in the same unit (recorded in `harness-runs/dispatch_additions/fix_watcher_running_count_pid_reuse.md`); #24 edited the template and #25 (`general`) the root copy.
- **cost this run:** one extra implementer dispatch, plus one dispatch addition.
- **hypothesis:** the implementer has no way to see that a multi-layer unit's later layers are dispatched in the same unit.

## The task plan needed 3 review rounds with findings before passing
- **category:** optimization
- **evidence:** `harness-runs/task_plan_reviews/fix_watcher_running_count_pid_reuse/` holds `review_0.md`, `review_1.md`, `review_2.md` (each FAIL, one Must Fix each); the business-parity folder does not exist (phase off) and the architecture plan-review folder does not exist (4 PASS dispatches, no file); a fourth task-plan-reviewer dispatch (#12) passed and wrote none. Title comparison round over round: `review_0` 4 findings (first round); `review_1` 2 net-new (its Must Fix and one Nice to Have), 2 re-raised (its Should Fix and one Nice to Have, each titled as raised in iteration 0); `review_2` 1 net-new (its Must Fix), 3 re-raised (its Should Fix and both Nice to Have). Every round's Must Fix was net-new. Titles were matched by their own reference to the earlier round, not by identical wording.
- **cost this run:** 12 planning dispatches (4 writer, 4 architecture, 4 task-plan-reviewer).

## The architecture reviewer produced no finding across all 5 of its dispatches
- **category:** optimization
- **evidence:** `architecture-reviewer` ran 4 times in the planning loop (#2, #5, #8, #11) and once in Phase A2 (#19), with `verdict: PASS` every time; neither `harness-runs/architecture_reviews/fix_watcher_running_count_pid_reuse/` nor `harness-runs/architecture_branch_reviews/fix_watcher_running_count_pid_reuse_arch_review.md` exists. Units passed: the plan (4 rounds) and the branch (1).
- **cost this run:** 5 dispatches with no change.
