## A plan-prescribed `cp` mirror step is refused in the unattended permission mode
- **category:** tooling-gap
- **evidence:** Task 4's plan (`harness-runs/task_plans/fix_swept_run_profile_leak/task_4_plan.md`) prescribed copying `cli/templates/scripts/cleanup-merged-worktrees.sh` and `cli/templates/scripts/lib/harness-run-lib.sh` over their `scripts/` mirrors; the `layer-implementer` reported the `cp` refused in don't-ask mode and re-applied Task 1's diff to each mirror by hand with the file-edit tool, confirming with `cmp`. Code-review Finding 1's general-layer fix (`harness-runs/code_reviews/fix_swept_run_profile_leak_code_review/finding_1.md`) hit the same refusal on `cp … && cmp …` and did the same hand edit.
- **cost this run:** two mirror updates done as hand-replayed edits instead of a byte copy; byte-identity rested on a follow-up `cmp` and on Phase G's mirror test.

## Implementer verification commands refused in the unattended permission mode
- **category:** tooling-gap
- **evidence:** Task 1's `layer-implementer` reported a direct `bash -n` on the sweep script, a hand-run of its header REPRO block and an `rm` of its probe file all refused; it ran the first two through `harness-runs/scratch/sweep_profile_repro.mjs` via `bash scripts/scratch-run.sh`. Task 2's implementer reported an `rm` of `harness-runs/scratch/red_once_profile_remove.generated.mjs` refused, and the compound that would have echoed the test command's exit status refused.
- **cost this run:** verification routed through scratch probes; probe files left behind in the gitignored `harness-runs/scratch/`; one test run's exit status not printed separately.

## A committer landed a subject over the commit-policy length cap
- **category:** agent-contract
- **evidence:** commit 4a9e0e85 (`fix: Correct § 1.4 What moved sentence on the cleanup test fixture, Finding 3`, 77 characters); the `committer` return stated it exceeds the 72-character cap in `.claude/context/conventions.md` → `## Commit-message policy` and was noticed only after the commit was pushed.
- **cost this run:** one pushed commit off-policy, left in place.

## The branch-reviewer's Pass-0 regex table is an unfilled template
- **category:** tooling-gap
- **evidence:** the Phase B `branch-reviewer` return (index `harness-runs/code_reviews/fix_swept_run_profile_leak_code_review.md`) reported the grep half of its Pass-0 mechanical check did nothing because the regex table is still an unfilled template.
- **cost this run:** Pass 0's grep half ran no checks on this diff.

## Agents diffing against the default branch found no local `dev` ref in the run copy
- **category:** agent-contract
- **evidence:** the `branch-reviewer` and the `skeptic-reviewer` each reported no local `dev` (the configured `defaultBranch`) and diffed against `origin/dev`; the `statistics-plan-writer` reported `git log dev..HEAD` failed and ran its disposition scan over `origin/dev..HEAD`, recording it in `harness-runs/branch_statistics/fix_swept_run_profile_leak/statistics.md` → `## Notes`.
- **cost this run:** three agents each re-derived the fallback base; none failed.
