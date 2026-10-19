### Task 3 — Add `cli/test/commit-on-branch-plumbing.test.mjs`: the commit wrapper's exit contract, index sync, no commit hook, and records rewritten after its checks

**Goal:** Prove that the plumbing commit Task 1 built behaves exactly as the old `git add` / `git commit` wrapper did, from every caller's point of view, when the target is a linked worktree. That covers the same exits, the same stdout line, the same staging policy and a clean working copy after exit 0. Also prove that the target's records are never read again after the checks.

**Depends on:** Task 1, whose contract this suite asserts. The cases re-prove `docs/outer-loop-verification.md` §1.1 on a linked worktree:

- **exit 0:** the stdout line is exactly `commit-on-branch.sh: committed <short_sha> on <branch>`;
- **exit 3:** `nothing to commit`, and the working copy's own index is still synced for the given paths;
- **exit 1 when the branch moves:** if `update-ref` loses its compare-and-swap, the result is "no commit made", `refs/heads/<branch>` is unchanged, and the given paths are left staged;
- **no commit hook runs:** not `pre-commit`, `prepare-commit-msg`, `commit-msg` or `post-commit`;
- **only the tip plus the given paths are committed.** Something staged earlier is not swept in, and a deletion is staged by passing its parent directory;
- **no filter driver runs:** every blob is hashed with `--no-filters` by the library's `hr_commit_paths_var`, which Task 1 factored out of `hr_commit_placed` and both now share. A path whose attributes select a `filter` is refused with exit 1 and the line `commit-on-branch.sh: refusing to commit: '<path>' selects a filter driver, which this wrapper never runs`. This is the one place the new wrapper deliberately differs from the old `git add`.

The refusal cases are **Task 2's** file. Nothing here re-tests a target or `config.worktree` refusal.

### Targets

- `cli/test/commit-on-branch-plumbing.test.mjs` (new)

**Work:**

- [ ] **Header**, stating the rule: from a linked worktree, the main checkout's commit wrapper produces exactly what the old wrapper produced. It never asks git to read the worktree's `.git` pointer, its record's `HEAD`, its `commondir` or its `config.worktree` after its checks, and it runs no commit hook. Say that the rewritten-records cases stage a race deterministically with a `git` shim, as `cli/test/wrapper-target-check.test.mjs`'s header explains for (i)–(k).
- [ ] **The fixture**, built the same way as Task 2's, but in this file: no fixture helper is shared between the two new suites, as `.claude/context/cli.md` → `## Not determined` leaves that open. It is a main checkout with the three wrappers and `lib/` copied in, a configured identity, and a linked worktree on an unprotected branch with `setup-worktree.sh`'s `config.worktree`. Build it under the temp directory and tear it down in process.
- [ ] **The exit contract, on the worktree:**
  - (a) One existing path with a subject and a body. The result is exit 0, and the stdout line is matched exactly. `git -C <wt> log -1 --pretty=%B` shows two paragraphs. `git -C <wt> status --porcelain` is empty. `git -C <wt> rev-parse HEAD` equals `refs/heads/<branch>` read in the main checkout.
  - (b) The same call again, which exits 3 with no new commit.
  - (c) An existing path plus a missing one. The missing one draws the warn-and-skip line, and `git show --name-only` lists only the existing path.
  - (d) A tracked file deleted, with its parent directory passed. The deletion is committed.
  - (e) A second file staged earlier (only possible by hand in a fixture) is **not** in the commit, and stays staged.
  - (f) Exit-3 index sync: edit a tracked file, stage it by hand, revert it with a plain file write, then call the wrapper with that path. The result is exit 3, and `status --porcelain` is empty afterwards. Task 7 replaces the bare `git add` re-stage with exactly this call.
- [ ] **No commit hook, and nothing re-read.**
  - (g) A `pre-commit`, `prepare-commit-msg`, `commit-msg` and `post-commit` hook, each writing a marker, sit in the pinned `<main>/<githooksDir>`. After a committing call, none of the markers exists.
  - (h) A `git` shim first on `PATH` acts at the wrapper's first git call after its checks: it rewrites the worktree's `.git` pointer, its record's `commondir`, and its `config.worktree` (adding `core.fsmonitor`, a marker command). The commit still lands on the real branch, in the real repository, and the marker is never created. Model the shim on `cli/test/wrapper-target-check.test.mjs` cases (i) and (k2).
  - (i) The same shim flips the record's `HEAD` to another branch. Only `refs/heads/<branch>` moves.
  - (j) The shim moves `refs/heads/<branch>` just before `update-ref`. The result is exit 1 with "no commit made", the ref is where the shim left it, and the paths are staged.
  - (k) A tracked path gets a `.gitattributes` entry `filter=marker`, and the main `.git/config` defines `filter.marker.clean` as a command that writes a marker. A call naming that path exits 1 with the filter refusal line. The marker is never created, and `refs/heads/<branch>` is unchanged.

**Verification:**

- `npm test --workspace cli -- test/commit-on-branch-plumbing.test.mjs`, from the repository root, as one plain foreground command. Read the counts and the exit status, and expect `# fail 0`.
- `cli/test/flow-walker-resume.test.mjs` case (3) also drives the wrapper (main checkout as the target, then the exit-3 re-flip). That file is neither created nor edited here, so it is left to the run's closing gate rather than run by this task.
- `hr_commit_placed` now commits through the same `hr_commit_paths_var`. Its existing suites, `cli/test/outer-loop-scripts.test.mjs`, `cli/test/watcher-review-drop-payloads.test.mjs` and `cli/test/remote-review-payloads.test.mjs`, must stay green **unedited**. That is the evidence its behaviour did not change. No task edits them, so they too are left to the run's closing gate and are not run here. Do not adjust any of them to make a case pass. A failure there is a Task 1 defect.
  - **Deviations from plan:** `cli/test/flow-walker-resume.test.mjs`, `cli/test/outer-loop-scripts.test.mjs`, `cli/test/watcher-review-drop-payloads.test.mjs` and `cli/test/remote-review-payloads.test.mjs` were not run by this task (neither created nor edited here): deferred to the Run gates phase, as the plan states. Case (h)'s shim fires at the wrapper's first git call that is not a check's `git -C / config --file` read (the branch read's `symbolic-ref` through `<main>`); case (i)'s fires at the tip read (`rev-parse --verify --quiet refs/heads/…`), because a `HEAD` flipped before the branch read is a different branch by design, not a re-read.
