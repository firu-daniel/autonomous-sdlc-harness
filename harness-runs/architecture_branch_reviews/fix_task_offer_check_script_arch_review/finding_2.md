### 2. Self-adopted `scripts/task-offer-check.sh` is committed `100644`, not the row's `0755`

**Severity:** Should Fix

**Site:** `scripts/task-offer-check.sh` (the whole file: its git mode bit only, not its content).

**Problem.** `.claude/context/conventions.md` → `## Documents of record` states that this repository has adopted its own harness, so `scripts/` at the root is `init`'s output in this checkout. The script's row in `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS` declares `mode: 0o755`. `cli/test/outer-loop-scripts.test.mjs` asserts that `init` writes the file with mode `0755` (`TASK_OFFER_CHECK_MODE = 0o755`).

Every other top-level outer-loop script under `scripts/` is committed `100755`, for example `scripts/run-analytics.sh`, `scripts/remote-run.sh` and `scripts/restart-watcher.sh`. Task 8 copied `scripts/task-offer-check.sh` instead and committed it as `100644`, as `git ls-files -s scripts/task-offer-check.sh` shows. So the self-adopted copy is not what `init` would have written. A later forced self-adopt would change its mode, which shows up as unexplained churn.

The content is byte-identical to `cli/templates/scripts/task-offer-check.sh`, and the fence invokes it as `bash scripts/task-offer-check.sh`, so nothing breaks today. That is why this is a Should Fix and not a Must Fix.

**Fix.** Record the executable bit in the index without touching the content. From the repository root, run `git update-index --chmod=+x scripts/task-offer-check.sh`, then commit the mode change. Commit it through the commit wrapper with the explicit path `scripts/task-offer-check.sh`, never `git add -A`. Leave `cli/templates/scripts/task-offer-check.sh` at `100644`: every template under `cli/templates/scripts/` is committed `100644`, and `init` applies the row's mode at write time.

- **Deviations from plan:** The operator ran the `git update-index --chmod=+x` step after Q1 (`harness-runs/clarifications/fix_task_offer_check_script/answer_2.md`, option (a)). The unattended profile refuses that step, so the implementer did not run it. The implementer then checked the result by running commands: `git ls-files -s scripts/task-offer-check.sh` shows index `100755` blob `3fc63a6b…`; `git ls-tree HEAD` shows `100644` with the same blob, so only the mode changes; the worktree file is `-rwxr-xr-x`; `cli/templates/scripts/task-offer-check.sh` is still `100644` with the same blob. The implementer edited no file. The commit is left to the committer.
