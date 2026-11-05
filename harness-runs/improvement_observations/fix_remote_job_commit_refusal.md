## A commit-wrapper subject carrying a word that begins with `=` is refused at the permission layer before the wrapper runs
- **category:** tooling-gap
- **evidence:** Phase C, Item 1 (code-review Finding 5). The `committer` dispatch (#35) returned `error:`: its call `bash scripts/commit-on-branch.sh (main checkout) --repo <this run copy's root> harness-runs/code_reviews/fix_remote_job_commit_refusal_code_review.md cli/test/watcher-remote-park-sequence.test.mjs -- "fix: Add the missing space in const job3 =await for Finding 5"` was refused twice with "Permission to use Bash has been denied because Claude Code is running in don't ask mode", and the committer reverted its checkbox flip. The orchestrator then sent the same wrapper call with an exit-3 path (`harness-runs/flow_progress/fix_remote_job_commit_refusal_progress.md`) and the subject `"chore: Flow progress probe job3 =await"`. It was refused the same way. Every other wrapper call this run, none of whose subjects had a word beginning with `=`, ran. Re-dispatch #36 committed as 96456500, with the subject reworded by the committer to "fix: Add the missing space in the job3 assignment for Finding 5".
- **cost this run:** one extra `committer` dispatch, and one `context_notes:` addition recorded in `harness-runs/dispatch_additions/fix_remote_job_commit_refusal.md`
- **hypothesis:** the permission matcher may read the ` =word` token inside the quoted subject as an assignment or an expansion, so the profile's literal `allow` entry stops matching. This is a guess.

## The branch reviewer's deterministic sweep ran only its new-symbol caller check, because the sweep table's regex cells were empty placeholders
- **category:** silent-failure
- **evidence:** Phase B.1 `branch-reviewer` return (#29), verbatim: "The grep half of the deterministic sweep did not run because the sweep table's regex cells are still empty placeholders; that needs filling in. The new-symbol caller check did run, and both new exported symbols have callers." The return names no file for the sweep table.
- **cost this run:** the end-of-branch review ran without its grep sweep. The B.2 meta-review passed the review without remarking on the gap.

## A layer implementer reported "no tree guard was selected" for a change to a path two `treeGuards` globs cover
- **category:** agent-contract
- **evidence:** Phase C, Item 4, `cli` layer (#41, code-review Finding 2). The implementer changed `cli/templates/scripts/lib/harness-run-lib.sh` and its return said "No tree guard was selected." The `treeGuards` in `harness.config.json` select `test/shipped-scripts-mktemp.test.mjs` (covers `cli/templates/scripts/**/*.sh`) and `test/watcher-main-anchor.test.mjs` (covers `cli/templates/scripts/**`) for that path. Neither guard was run in that unit. The round-1 Run gates passed afterwards.
- **cost this run:** none measurable: the Run gates' full suite covered both guards.

## A Task 1 manual reproduction was refused as an inline compound command, and its fixture commit was blocked by the commit-branch guard
- **category:** tooling-gap
- **evidence:** Phase A, Task 1 `layer-implementer` return (#10): "The inline compound Bash form was refused, so I ran the same steps as a probe through `scripts/scratch-run.sh` … An earlier inline attempt that made a fixture commit was blocked by the commit-branch guard hook." The deviation is recorded in `harness-runs/task_plans/fix_remote_job_commit_refusal/task_1_plan.md`.
- **cost this run:** the reproduction was rerouted through a scratch probe. The unit still landed (ba6b4d95).

## The architecture reviewer was dispatched four times and wrote no finding
- **category:** optimization
- **evidence:** `architecture-reviewer` ran three times as the plan gate (#2, #5, #8) and once as Phase A2 on the implemented branch (#28). It returned `verdict: PASS` each time. `harness-runs/architecture_reviews/fix_remote_job_commit_refusal/` and `harness-runs/architecture_branch_reviews/fix_remote_job_commit_refusal_arch_review.md` do not exist.
- **cost this run:** 4 dispatches with no finding
