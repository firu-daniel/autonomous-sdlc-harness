`fix_remote_job_commit_refusal` fixes two defects that the Gate 12 sandbox series round (#170 step 4, round 13, 2026-11-05) found in the 0.6.8 release. Together they stop every remote run from landing any work, and then report that run as finished.

The first defect: in a GitHub Actions job, `commit-on-branch.sh` and `push-branch.sh` refuse every call, because `actions/checkout` leaves keys in `.git/config.worktree` that the wrappers' single-key rule rejects. The second: a resumed session that exits 0 before writing its ledger is classified `completed — branch ready for review`.

The third defect that round found, that no sandboxed Bash call runs on the `ubuntu-26.04` runner, is its own issue (#261, sandbox3b6). This branch does not depend on it: both defects here reproduce without a session running any Bash.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `cli/templates/github/workflows/harness-run.yml`: the steps `Check out the run's branch`, `Bootstrap the checkout`, `Run the harness` and `Push the branch`. Also every other job in the four templates that checks out a branch and later runs a wrapper.
- `cli/templates/scripts/setup-worktree.sh`: where it sets `extensions.worktreeConfig true` and `config --worktree core.hooksPath`, and the `NOTE:` on why that extension is one-way and repository-global.
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_worktree_config_check_var`, `hr_worktree_config_file`, `hr_worktree_hooks_path`. Then the callers in `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` (`if [ "$HR_TARGET_KIND" != clone ] && ! hr_worktree_config_check_var …`).
- `cli/templates/scripts/autonomous-watcher.sh`: the classification after a session's exit 0. That is the block that logs `classify: '<branch>' has no readable ledger (…) — classifying on the exit code alone` and then `run '<branch>' completed — branch ready for review`. Also the `paused (unfinished)` arm just above it, and `run_job`.
- `push-branch.sh`'s header, **EVERY FAILURE PATH IS NON-FATAL (exit 0)**.

## What was measured (2026-11-05, verbatim)

The job was `firu-daniel/harness-gate12`, adopted at 0.6.7 and upgraded to 0.6.8. Its first job was run `41980764647`, `harness run feat_money_split`, on `ubuntu-26.04` `20261101.64.1` with `actions/checkout@3d3c42e5…` (v7.0.1).

- `Check out the run's branch` logs `[command]/usr/bin/git sparse-checkout disable`, then `[command]/usr/bin/git config --local --unset-all extensions.worktreeConfig`. The first command writes `core.sparseCheckout`, `core.sparseCheckoutCone` and `index.sparse` (each `false`) into `.git/config.worktree`. The second turns the extension off, but leaves the file in place.
- `Bootstrap the checkout` runs `setup-worktree.sh`. That turns `extensions.worktreeConfig` on again and adds `core.hooksPath`, so git reads the sparse keys again.
- The session's first commit failed:

  ```
  commit-on-branch.sh: refusing to commit: /home/runner/work/harness-gate12/harness-gate12/.git/config.worktree sets core.sparsecheckout, core.sparsecheckoutcone, index.sparse, and only core.hooksPath may be set there; remove the file, then re-run setup-worktree.sh in that working copy
  ```

  The session parked, and raised this refusal as a blocker question.
- `Push the branch` printed `push-branch.sh: refusing to push: …` with the same sentence, and the step still concluded `success`. The same refusal hit every later job: the resumed job `41981613528`, the round's six planted jobs, and the sandbox probe's CS6 row (`fail`, run `41980588326`).
- **The resumed job** (`41981613528`, `resume answer`): its session stopped after 8 turns, because no Bash call ran (#261, sandbox3b6), and exited 0. The ledger had never been committed, so the watcher logged:

  ```
  classify: 'feat_money_split' has no readable ledger (absent: no ledger at flow_progress/feat_money_split_progress.md) — classifying on the exit code alone
  run 'feat_money_split' completed — branch ready for review
  ```

  The job then printed `job: completed stop`. Nothing had been planned or implemented.

## The findings this branch fixes

1. **The job's checkout must reach the session with a `config.worktree` the wrappers accept.** The single-key rule (`core.hooksPath` only) stays as it is. Settle in the plan where the clean-up belongs:
   - `setup-worktree.sh`, which already owns this file and turns the extension on;
   - a workflow step between the checkout and the bootstrap;
   - or a checkout input that writes no such keys.

   The plan must also cover the local paths: `create-worktree.sh` working copies, the main checkout under self-adoption, and clones. None of them may lose a key a user set on purpose. Removing exactly the three `false` sparse keys `actions/checkout` writes is a different act from deleting the file, and the plan says which it does and why. Every template job that checks out and then runs a wrapper gets the same treatment. Add a test that replays checkout's two commands (`git sparse-checkout disable`, then `git config --local --unset-all extensions.worktreeConfig`) on a fixture repository, runs `setup-worktree.sh`, and then shows `commit-on-branch.sh` and `push-branch.sh` accepting the target.
2. **A ledger-less exit 0 is not "branch ready for review".** At the least, a resumed run (`resume answer`, `resume pause`, a stall restart) or a run that has parked before, which then exits 0 with an absent or unreadable ledger, must not be classified `completed`. Decide in the plan between `paused` with `pause_reason unfinished`, as the unfinished-ledger arm already does, and `failed`. Show how it reaches `run_job`'s decision and the job's `job: <final> <decision>` line. A first launch whose engine legitimately writes no ledger (check the docs engine and every other engine) keeps its current behaviour, and the plan names which engines write which ledger. Add tests for the resumed case, in local mode and in job mode.
3. **A refused push is visible in the job's result.** Today `Push the branch` concludes `success` on a refusal, and a reader of the run page sees a green job. Keep `push-branch.sh` non-fatal, as its header requires. But make the refusal surface, for example as a `::warning::` or `::error::` annotation the step prints when the wrapper's output carries `refusing to push:`, or in the job summary. The plan picks the form.

## The goal

1. In a GitHub Actions job rendered by this branch, the session's commits and `Push the branch` succeed on an honest branch. The fixture test reproduces the measured sequence.
2. A resumed run that never reached its ledger is never reported as ready for review.
3. A refused push is visible on the run page.
4. The rule in `hr_worktree_config_check_var` and every wrapper refusal are unchanged for any other key.
5. `docs/remote-execution.md` and `docs/sandbox-verification.md` §9 and §10 record the cause (CS6 (runner) and FR3) with confirmation owed to the next Gate 12 round. **No measured result is invented.**

## Constraints

- No new `excludedCommands` entry. The wrappers' trust checks do not loosen; a fix that needs one changed parks with the reason.
- This repository's own copies of the changed scripts and workflows follow the templates, as self-adoption requires.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
- The GitHub result is taken afterwards in the Gate 12 redo, after the next release. This branch does not take it.
