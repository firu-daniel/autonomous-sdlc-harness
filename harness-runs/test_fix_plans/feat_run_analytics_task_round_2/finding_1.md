### 1. watcher-run-analytics: a launch commits run-analytics.json then run-analytics.md on the branch (persisting)

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()`, and its call `record_run_analytics "$branch" "$worktree" "$log_path"` inside `spawn_engine()`'s background subshell, between `rc=${PIPESTATUS[0]}` and `classify_run_exit`. Its commits go through `watcher_commit` → `hr_commit_placed` → `hr_commit_paths_var` in `cli/templates/scripts/lib/harness-run-lib.sh`. That function's return `4` means "the swap was lost or could not be locked". The script the hook runs is `cli/templates/scripts/run-analytics.sh`. Each of these files has a byte-identical mirror under `scripts/` (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`, `scripts/run-analytics.sh`).

**Failing test:** `cli/test/watcher-run-analytics.test.mjs`, `the session's analytics are committed on the run's branch, and a failing step changes no outcome` → subtest `a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout`

**Failure (from the log):**

```
not ok 1 - a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout
not ok 1145 - the session's analytics are committed on the run's branch, and a failing step changes no outcome
```

The log has no assertion message for it.

**Diagnosis (persisting: failed in round 1 as `not ok 1142` with the same four subtests):** Round 1 closed this as already passing. The evidence was one run of this file on its own, which passed 5/5 with no code edited. The full suite failed it again in round 2, even though #178 doubled `tick`'s bound to 120 000 ms. It is the only suite that drives this branch's new hook through a real session and two commits. It is also the only round-1 failure that recurred in full: all four subtests failed in both rounds. A load-only flake with no branch cause would be expected to thin out the way round 1's other ten failures did.

The subtest asserts, in order:

1. `copy_kind` is `clone`, and one prompt was sent.
2. The clone's `feat_x` has exactly two `chore: Record run analytics for feat_x` commits, touching `…/run-analytics.md` and then `…/run-analytics.json`.
3. The main checkout has the same commits and the same tip.
4. The status is not `failed`, and the notifications are `launched` plus one outcome.
5. `git status --porcelain` under `sdlc-harness/run_analytics/` is empty in the clone.

The most likely load-dependent cause on the current tree is a concurrency window the hook opened. The helper's stub sleeps only `0.3` s (`cli/test/helpers/watcher.mjs`, choice 1). That sleep exists so the session stays `running` until the rest of the pass is done. Under a full-suite load, the pass after `spawn_engine` (the rest of the inbox loop, `lane_release_if_idle`) can outlast that 0.3 s. When it does, `record_run_analytics` runs concurrently with the foreground pass. This hook is the first post-session step that moves refs. It moves the clone's `refs/heads/feat_x` and then the main checkout's, through `hr_copy_ref_swap_var`, and it updates the clone's index. A ref or index lock held by a concurrent git call in the pass, or a lost compare-and-swap, makes `hr_commit_paths_var` return `4` or `1`. The hook then only logs `run analytics: could not commit … (exit N)` and returns 0, so assertion 2 sees fewer than two commits. That is consistent with a pass alone and a fail under load.

Other candidates, each producing a different watcher-log line:

- `run-analytics.sh` exits non-zero (`run analytics: 'feat_x' not recorded (exit N)`), for example on a `mktemp` under a contended `TMPDIR`, or a `jq` failure.
- The `tick` itself exceeds its bound. The test would then fail with `the watcher pass exited …` before any analytics assertion.

**Fix:**

- [ ] Run the named test's file on its own (`## The test-run rule` point 1's row-G.4 exception) and read the assertion message and the fixture's watcher log. **Do not close this finding as already passing on a lone pass alone.** Round 1 did that, and the full suite failed it again. Close it that way only if the cause is shown to lie outside this branch's code.
- [ ] Find in the current tree whether any git call in the pass after `spawn_engine` returns can take a ref lock or index lock on `refs/heads/<branch>` of the clone or the main checkout, or on the clone's index. Check the same for anything else that can run while the session subshell is in `record_run_analytics`.
- [ ] Make the hook robust to that overlap without changing its contract. The hook stays best-effort: it always returns 0, never touches `rc` and never notifies. One option: when `watcher_commit` returns `4` (lost or unlockable swap), retry the commit a bounded number of times against the re-read tip. Another option: serialize the hook against the pass through a lock the watcher already holds. Choose the narrowest change that removes the race. Edit `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` only if the retry belongs there), and make the identical edit in the `scripts/` mirror.
- [ ] If the assertion message names a different cause from the candidates above, fix that cause at the site the message names, in the template and its mirror.
- [ ] Do not weaken, skip or delete any assertion in the test, and do not lengthen the stub's sleep or any bound to hide the race.
