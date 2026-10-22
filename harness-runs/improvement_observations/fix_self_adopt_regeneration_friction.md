## The plan writer reported `docs/` as an undescribed layer
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return for this run (dispatch #1 of the planning half) carried a `## Corpus staleness` section with one `undescribed-layer` entry: the directory `docs/`, which holds `docs/development.md`, `docs/cli.md` and `docs/outer-loop-verification.md` (all edited by Task 7), is covered only by the catch-all `general` row (`path: "."`) of `harness.config.json` → `layers`. The writer noted that `harness.config.json` → `detection.review` records a deliberate `applied` verdict routing it there. It reported no `stale-rule` entries.
- **cost this run:** none; it is a follow-up. If the routing should be revisited, the remedy the writer named is a supervised `/autonomous-sdlc-harness:harness-analyze` run in this repository that answers `skip` for every already-filled document (never `--yes`), applying any profile change through `npx autonomous-sdlc-harness config set layers`.

## A plan-review architecture-reviewer dispatch returned a false "conventions unreadable" blocker
- **category:** agent-contract
- **evidence:** planning dispatch #2 (`[plan-write · arch · iter 0] → architecture-reviewer`) returned `blocker: cited conventions documents are unreadable (path not found)`, saying `ls .claude/context` and `ls context` failed with "No such file or directory". It also listed only `task_1_plan.md` through `task_4_plan.md` when the directory held six. The orchestrator then confirmed `.claude/context/cli.md`, `.claude/context/plugin.md` and `.claude/context/conventions.md` exist and are tracked (`ls -la .claude/context`, `git ls-files .claude`) and that six task files exist. The same review was re-dispatched as #3 with a `context_notes:` path correction, recorded in `harness-runs/dispatch_additions/fix_self_adopt_regeneration_friction.md`, and returned `verdict: PASS`.
- **cost this run:** one wasted planning dispatch, plus one `context_notes:` addition that a later Run gates round had to rewrite (see the next entry).
- **hypothesis:** the reviewer's shell commands ran from a working directory other than the checkout root.

## The dispatch-additions record's verbatim quote tripped the no-machine-paths gate
- **category:** agent-contract
- **evidence:** at planning convergence the orchestrator wrote `harness-runs/dispatch_additions/fix_self_adopt_regeneration_friction.md`. Its `verbatim:` line quoted the `context_notes:` text exactly as dispatched, and that text spelled the checkout root as an absolute path. Run gates round 1 (`harness-runs/test_run_logs/fix_self_adopt_regeneration_friction/task_round_1.log`) failed gate 6a on that line. Test fix plan `harness-runs/test_fix_plans/fix_self_adopt_regeneration_friction_task_round_1.md` → Finding 1 rewrote the prefix to `<repo_root>/` (commit `07201af1`). The test-fix-plan writer itself noted the rewrite departs from the record README's "quoted, never paraphrased" rule for `verbatim:`.
- **cost this run:** shared one Run gates round with a real test regression. The extra cost was one implementer and one committer dispatch.
- **hypothesis:** `dispatch_discipline_instructions.md` → `## The entry format`'s "`verbatim:` means verbatim" does not say how to quote an addition that itself carries a machine path.

## A Task 4 verification command was refused by the permission layer
- **category:** tooling-gap
- **evidence:** the `layer-implementer` return for Task 4 (`[A · Task 4 · cli · iter 0]`, commit `9d7f35f1`) reported that its command reproducing the `REPRO` rows in `cli/templates/scripts/restart-watcher.sh`'s header by hand was refused with "Permission to use Bash with command … has been denied". It recorded an evidence downgrade in `harness-runs/task_plans/fix_self_adopt_regeneration_friction/task_4_plan.md` and rested the claim on test cases (a), (d) and (e) of `cli/test/restart-watcher-cli.test.mjs`. The Task 7 implementer later measured the same rows through a probe run with `bash scripts/scratch-run.sh`.
- **cost this run:** the hand reproduction was skipped in Task 4; the rows were measured three units later.

## The branch-reviewer's Pass 0 sweep regex list is still the unfilled stub
- **category:** tooling-gap
- **evidence:** the `branch-reviewer` return for Phase B (`[B · review-plan · iter 0]`, index `harness-runs/code_reviews/fix_self_adopt_regeneration_friction_code_review.md`) reported "this agent's sweep regex list is still the unfilled stub, so the grep half ran no regexes", and called it a configuration gap. It ran an ad-hoc sweep of the added lines instead (`console`, `process.exit`, `fs` writes, shell strings, `.sh` literals).
- **cost this run:** Pass 0's configured grep half did not run.

## Run gates passed with the docs-retrieval gates blocked
- **category:** tooling-gap
- **evidence:** the `test-fix-plan-writer` return for round 1 listed gates 13a–13c as BLOCKED because the Python docs-retrieval environment is not set up on this machine. It placed them under `## Not fixable on this branch` in `harness-runs/test_fix_plans/fix_self_adopt_regeneration_friction_task_round_1.md`, with `bash scripts/python-service.sh sync` as the remedy. Gate 13d was SKIPPED as opt-in only. Round 2 (`task_round_2`) printed `pass` with the environment unchanged by this run.
- **cost this run:** the three docs-retrieval gates did not run on this branch.
