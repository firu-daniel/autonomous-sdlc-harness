### 1. The sweep's "no run profile path" line blames the slug or the branch even when the real cause is a state directory that cannot be anchored, and the test pins that wrong text

**File:** `cli/templates/scripts/cleanup-merged-worktrees.sh` (`profile_remove`), the line `no run profile path for '$branch' (hr_run_profile_file refused the repository slug or the branch) — no profile removed`. The same line sits in the byte-identical mirror `scripts/cleanup-merged-worktrees.sh` (`profile_remove`). It is asserted in `cli/test/cleanup-run-copies.test.mjs`, in the case `'an unanchorable state directory: the copy and branch are removed, and no profile is'`, on the quoted substring `(hr_run_profile_file refused the repository slug or the branch)`.

`profile_remove` prints this line whenever `slug` is empty or `hr_run_profile_file "$slug" "$branch"` returns non-zero. `hr_run_profile_file` (`cli/templates/scripts/lib/harness-run-lib.sh`) can fail for three reasons. The slug is empty. `hr_sanitize_branch` refuses an empty branch. Or `hr_lane_dir` cannot anchor, because `XDG_STATE_HOME` is empty and `HOME` is empty too, so the base would be `/.local/state`. The message names only the first two.

The third cause is the only one the suite drives: the case runs the sweep under `{ XDG_STATE_HOME: '', HOME: '' }`. The slug resolves and the branch is `feat_gone`, so neither of the causes the line names is true. The test then asserts the misleading text verbatim. An operator who reads this line in `watcher.log` will look at the repository slug and the branch name, when the actual fault is the daemon's environment.

**Fix:** name all three causes in the message, and keep it one line. In `profile_remove`, in `cli/templates/scripts/cleanup-merged-worktrees.sh`, replace

```bash
    echo "cleanup-merged-worktrees.sh: ${pre}no run profile path for '$branch' (hr_run_profile_file refused the repository slug or the branch) — no profile removed"
```

with

```bash
    echo "cleanup-merged-worktrees.sh: ${pre}no run profile path for '$branch' (no repository slug, a branch hr_run_profile_file refuses, or no machine state directory — XDG_STATE_HOME and HOME both unset) — no profile removed"
```

Copy the template over `scripts/cleanup-merged-worktrees.sh` so the two stay byte-identical, and confirm with `cmp cli/templates/scripts/cleanup-merged-worktrees.sh scripts/cleanup-merged-worktrees.sh`.

In `cli/test/cleanup-run-copies.test.mjs`, in the `'an unanchorable state directory: …'` case, change the asserted substring to the new text:

```js
    r.stdout.includes(`${PREFIX}no run profile path for '${GONE}' (no repository slug, a branch hr_run_profile_file refuses, or no machine state directory — XDG_STATE_HOME and HOME both unset) — no profile removed`),
```

`decisions()` matches this line on its `no run profile path ` prefix, so it needs no change. The fix edits one test file, so that is the one test it runs: `npm test --workspace cli -- test/cleanup-run-copies.test.mjs`, from the repository root, as one plain foreground command. The full suite, including the mirror byte-identity check in `cli/test/outer-loop-scripts.test.mjs`, runs later in the Run gates phase.
