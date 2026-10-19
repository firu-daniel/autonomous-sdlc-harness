### Task 10 — Add `cli/test/wrapper-clone-arm.test.mjs`: the three wrappers against a clone, with exit contracts and stdout lines unchanged

**Goal:** Prove that the main checkout's `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` work against a registered clone through sync-in, operate, sync-out, and refuse an unregistered or tampered one. Every exit status and stdout line must be the one they emit for a worktree today.

**Depends on:** Task 9, which gives the three templates their clone arm:

- **Before their first git call.** All three run `hr_wrapper_target_check_var`, whose clone arm sets `HR_TARGET_KIND=clone`. They skip `hr_worktree_config_check_var` on that arm only, because the clone arm already refuses `config.worktree` and holds `.git/config` to the allow-list.
- **After the protected-branch decision.** All three call `hr_copy_sync_in_var` and refuse under their own prefix and exit code:
  - commit: `refusing to commit:`, exit 1;
  - push: `refusing to push:`, exit 0;
  - refresh: `refusing to refresh:`, exit 1.
- **`commit-on-branch.sh`** commits through `hr_commit_paths_var`, which on a clone syncs the clone's `refs/heads/<branch>` out (Task 7). A failed sync-out prints `commit-on-branch.sh: committed <sha> on <branch>, but … — the commit stands` on stderr and exits 1. Exits stay 0 / 1 / 2 / 3, and the stdout line stays `commit-on-branch.sh: committed <short_sha> on <branch>`.
- **`push-branch.sh`** pushes the synced-in branch from the main checkout. After a successful push it mirrors `refs/remotes/origin/<branch>` into the clone, and a failed mirror adds one line. It always exits 0, and `push-branch.sh: pushed <branch> to <remote>` is unchanged.
- **`refresh-branch.sh`** syncs the clone's `refs/heads/<branch>` out after a successful merge, and a failed sync-out exits 5. Without `--local` it mirrors `refs/remotes/origin/<base>`. Exits stay 0 / 1 / 2 / 3 / 4 / 5.

Clones come from Task 3's `hr_clone_create_var <main> <branch> <start>`.

**Where this task stops.** The worktree arm is already proved by the existing suites, which this task leaves **unedited**. This suite drives the clone arm only, plus one control per wrapper on a worktree in the same fixture. This task changes no script.

### Targets

- `cli/test/wrapper-clone-arm.test.mjs` (new)

**Work:**

- [ ] **Header first.** State the rule:
  - the main checkout's three excluded wrappers act on a registered clone only through the main checkout: sync-in, the unchanged operation, then sync-out;
  - every refusal they make on a worktree still fires on a clone;
  - their exit statuses and stdout lines are the worktree arm's.

  Follow `cli/test/wrapper-target-check.test.mjs`'s fixture shape: a hand-built main checkout, the three templates and `lib/` copied from `cli/templates/scripts` into its scripts directory, a local bare origin with an `ssh://`-free URL, and `user.name` / `user.email` set in the main checkout.
- [ ] **`commit-on-branch.sh --repo <clone> <path> -- "<subject>"`, run as the main checkout's copy.**
  - (a) An edited tracked file commits: exit 0, the stdout line, and the main checkout's and the clone's `refs/heads/<branch>` both moved. `git -C <clone> status --porcelain` is empty.
  - (b) A commit the run made earlier with plain `git commit` in the clone is the parent of the wrapper's commit, because sync-in brought it.
  - (c) A protected branch exits 2.
  - (d) The branch checked out in the main checkout: exit 1 and `refusing to commit:`.
  - (e) The clone's `.git/config` gains `core.fsmonitor` naming a marker command: exit 1, naming the key and not the value. The marker is never created, and both refs are unchanged.
  - (f) A failed sync-out, staged with a `git` shim that moves the clone's ref at the commit's `update-ref`: exit 1, with the "the commit stands" line on stderr.
- [ ] **`push-branch.sh <clone>`.**
  - (g) After a commit made in the clone, the bare origin's `refs/heads/<branch>` equals the clone's tip. Judge it with `git ls-remote`, never the exit status, which is 0 by contract. The stdout line is unchanged, and the clone's `refs/remotes/origin/<branch>` equals the main checkout's.
  - (h) An unregistered scratch repository at the derived path: exit 0 with `refusing to push:` and today's `… nor a worktree it lists` prefix. The origin is unchanged.
  - (i) Diverged tips: exit 0 with `refusing to push:`. The origin is unchanged.
- [ ] **`refresh-branch.sh <clone>`.** The fixture's default branch is `trunk`, as in `wrapper-target-check.test.mjs`.
  - (j) A fast-forward from `origin/trunk`: exit 0 and `merged origin/trunk into <branch>`. The clone's ref, index and tree, and the main checkout's ref, all reach the merge.
  - (k) A two-parent merge: exit 0, with git's default message.
  - (l) A conflict: exit 4 with `conflicted:` lines, and both refs, the clone's index file hash and its tracked files unchanged.
  - (m) `--local`: exit 0.
  - (n) A failed sync-out, staged with a shim: exit 5.
  - (o) The clone's branch protected: exit 2.
- [ ] **One worktree control per wrapper, in the same fixture.** A linked worktree on another branch goes through each wrapper once, with the same exit status and stdout line as on the clone. Its `config.worktree` carrying `core.sshCommand` is still refused by `hr_worktree_config_check_var` (`… sets core.sshcommand, and only core.hooksPath may be set there`). This shows the skip on the clone arm did not reach the worktree arm.

**Verification:**

- `npm test --workspace cli -- test/wrapper-clone-arm.test.mjs`, from the repository root, as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status. Every case passes, and `# fail 0`.
- Mutate once by hand, then revert, with `git diff` clean afterwards. Remove `push-branch.sh`'s sync-in call. Case (g) must then fail, with the origin missing the clone's commit.
