### Task 3 — Switch the six other library-sourcing scripts to `hr_script_root`

**Goal:** Every outer-loop script that places its root from its own directory through the library does it through `hr_script_root`, so none of them can be stopped by a placeholder `.git` at the scripts directory. Some run sandboxed: `docs-search-server.sh` under an MCP launch in a session, and `autonomous-notify.sh` from a job. The others run unsandboxed, from the watcher or by a person: `setup-worktree.sh`, `create-worktree.sh`, `cleanup-merged-worktrees.sh` and `restart-watcher.sh`. For those, the change also means a host leftover at `<main>/<scriptsDir>/.git` no longer stops them, because their answer no longer comes from git's discovery out of the scripts directory.

**Depends on:** Task 1. It adds `hr_script_root <script_dir>` to `cli/templates/scripts/lib/harness-run-lib.sh` with this contract:

- It walks from the physical `<script_dir>` upward.
- At each directory holding a regular `harness.config.json`, it runs `git -C <dir> rev-parse --show-toplevel`. The first directory whose answer equals itself is printed, with status 0.
- When none confirms, it returns `hr_repo_root "<script_dir>"`'s answer and status, which is today's.

**Task 2** switches `run-test-suite.sh` and `scratch-run.sh`, and this task touches neither. **Task 4** handles the four wrappers, which source no library.

### Targets

- `cli/templates/scripts/docs-search-server.sh`, `autonomous-notify.sh`, `setup-worktree.sh`, `create-worktree.sh`, `cleanup-merged-worktrees.sh`, `restart-watcher.sh`: each one's `hr_repo_root "$script_dir"` call.
- `cli/test/script-root-callers.test.mjs` (new): the source check.

**Work:**

- [ ] `docs-search-server.sh` (`if ! root="$(hr_repo_root "$script_dir")"; then`) and `autonomous-notify.sh` (`root="$(hr_repo_root "$script_dir")" || root=""`): call `hr_script_root` instead. Every surrounding branch and message stays as it is.
- [ ] `setup-worktree.sh` (`top="$(hr_repo_root "$script_dir")" || top=""`) and `create-worktree.sh` (`top="$(hr_repo_root "$script_dir")" || top=""`): the same swap. These scripts run outside the sandbox, so one comment line at each call says the answer does not come from git's discovery out of the scripts directory. The main checkout these scripts trust is still placed by the functions they already call for it, which this task does not touch.
- [ ] `cleanup-merged-worktrees.sh` and `restart-watcher.sh` (`top="$(hr_repo_root "$script_dir")" || top=""` in each): the same swap.
- [ ] `script-root-callers.test.mjs`: a source guard, written as the last resort the testing bar allows. Its header gives the reason: the six scripts need a watcher, a daemon, an MCP runtime, a notifier or a live worktree set to run, and Task 1's suite already holds `hr_script_root`'s behaviour. It reads **these eight files by exact path, and no directory**: the six above plus Task 2's `run-test-suite.sh` and `scratch-run.sh`, all under `cli/templates/scripts/`. For each, it asserts that the file carries `hr_script_root "$script_dir"` and neither `hr_repo_root "$script_dir"` nor `git -C "$script_dir" rev-parse`. The header states the boundary: the suite reads a fixed list and walks no tree, so a script added later is not read. That is why the behavioural suites, not this one, carry the contract.

**Verification:**

- `cli/test/script-root-callers.test.mjs` passes, and fails when any one of the eight lines is reverted. Check this once with a throwaway revert, then restore.
- `git grep -n 'hr_repo_root "\$script_dir"' -- cli/templates/scripts` prints no line.
- Each of the six diffs changes the one placement line, plus a comment line where the bullets above say so.
