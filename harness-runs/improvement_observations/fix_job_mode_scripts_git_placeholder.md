## The watcher-committed task prompt carried an absolute home path, and gate 6a failed on it at Run gates round 1
- **category:** flow-efficiency
- **evidence:** Run gates round 1 (`harness-runs/test_run_logs/fix_job_mode_scripts_git_placeholder/task_round_1.log`) failed gate 6a ("no machine paths") on one line of `harness-runs/task_prompts/fix_job_mode_scripts_git_placeholder_task_prompt.md`, committed by `a1ccf8d4 chore: add task prompt for fix_job_mode_scripts_git_placeholder` before the engine started. It took test fix plan `harness-runs/test_fix_plans/fix_job_mode_scripts_git_placeholder_task_round_1.md` Finding 1 and commit `d5b6df6e` to replace it.
- **cost this run:** one of the two failing findings in Run gates round 1; the full suite ran a second time (round 2) partly for it, plus three dispatches (test-fix implementer and committer for Finding 1, and its share of the plan writer).
- **hypothesis:** nothing checks a prompt for machine paths before it is committed to the branch.

## Sub-agents found plain read-only or copy commands refused by the permission layer and worked around them
- **category:** tooling-gap
- **evidence:** sub-agent returns this run reported these refusals: a bare `bash -n <file>` (Task 6 and Task 8 implementers); `cp` (Task 10 implementer, which reproduced ten template copies by Edit instead); a `diff <(grep …) <(grep …)` comparison (Task 4 implementer); a compound `git diff --no-index` check (Task 10 implementer); `printenv HOME` (round-1 `test-fix-plan-writer`); and the compare and hash commands the Phase A2 `architecture-reviewer` used to check that `scripts/` copies match `cli/templates/scripts/` (it could not confirm byte-identity).
- **cost this run:** the Task 6 and Task 8 parse checks rest on the typecheck's shell-parse leg rather than a direct `bash -n`; the A2 reviewer left byte-identity unconfirmed (the Phase B `branch-reviewer` later confirmed it); Task 10's copy was done by hand-applying edits.

## An implementer piped its test runs through grep against the test-run rule's foreground, unpiped rule
- **category:** agent-contract
- **evidence:** the Task 1 `layer-implementer` return says the three tree-guard runs and the rerun after its mutation revert "were piped through `grep` to show only the summary lines. That breaks the test-run rule's no-pipe requirement", citing `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6.
- **cost this run:** four of Task 1's test runs are reported as summary lines only; with per-unit review off, nothing checked them before commit `6eb3aa96`.

## The branch-reviewer's mechanical grep sweep ran with no patterns configured for this project
- **category:** tooling-gap
- **evidence:** the Phase B `branch-reviewer` return: "The grep half of the mechanical sweep did nothing: none of its search patterns are filled in for this project."
- **cost this run:** the code review (`harness-runs/code_reviews/fix_job_mode_scripts_git_placeholder_code_review.md`) had no pattern-sweep coverage.

## The configured default branch has no local ref in the run copy, so several agents re-based their diff on origin/dev themselves
- **category:** agent-contract
- **evidence:** Phase A2 was dispatched with `diff_base: dev` (`harness.config.json` `defaultBranch`). The `architecture-reviewer` ("`dev` exists here only as `origin/dev`"), the `branch-reviewer` ("There is no local `dev` branch in this checkout, so I diffed against `origin/dev`") and the `statistics-plan-writer` (commit search over `origin/dev..HEAD`) each said in their returns that they substituted the remote-tracking ref.
- **cost this run:** none measured; each agent chose the same substitute on its own judgement.
