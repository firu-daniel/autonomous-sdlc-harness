### Task 8 — Move `create-worktree.test.mjs` to the clone layout, and the upstream case in `push-branch-worktree-config.test.mjs` with it

**Goal:** Every case in the `create-worktree.sh` suite asserts what the script now does. Each copy is a clone recorded in the registry. Each failure exit after the branch exists leaves nothing behind. The refusals keep their messages. No case is left asserting a linked worktree that can no longer appear. The upstream case that claims to mirror how `create-worktree.sh` leaves a branch moves with it.

**Depends on:** Task 7. This is the behaviour this task asserts:

- **The `[worktree-dir]` override:** refused with exit `1`.
- **A live copy of the branch** (any mode): exit `2`, with the line `create-worktree.sh: branch '<b>' is already checked out at <path> — refusing`.
- **Default mode and `--no-bootstrap` alone:**
  - a clone at `hr_worktree_dir`, with `copy_kind` `clone` in the registry;
  - the branch pushed from the main checkout, with `branch.<b>.merge` = `refs/heads/<b>` in the main `.git/config`;
  - the clone's `refs/remotes/origin/<b>` synced out to the pushed tip, equal to the main checkout's.
  - **A failed mirror sync-out after the push** is exit `2`, naming the sync-out, with the full rollback: the remote branch this run's push created is deleted from the main checkout under a lease on the pushed tip (`push --force-with-lease="refs/heads/<b>:<pushed tip>" origin ":refs/heads/<b>"`), and the main `.git/config`'s `branch.<b>` section the push wrote is removed with the local branch.
- **`--existing`:** a clone at the existing tip, and the remote unchanged.
- **Bootstrapped modes:** bootstrapped by the main checkout's `setup-worktree.sh --target`.
- **Exit `4`** (bootstrap failed), **a failed push** (exit `2`) and **a failed mirror sync-out** (exit `2`): the clone, the branch the run cut, its registry record and a registry directory it made are all removed, and, where the push had landed, the remote branch too.
- **The remaining exits:** `1` and `2` keep their existing messages.

### Targets

- `cli/test/create-worktree.test.mjs`
- `cli/test/push-branch-worktree-config.test.mjs` (case (l) and its header sentences only)

**Work:**

- [ ] `create-worktree.test.mjs` header: restate its rule for the clone layout. Rewrite its `RED ONCE` list for the mutations that now matter: the live-copy test skipped, the rollback skipped, the remote-branch delete skipped, the push made from the copy.
- [ ] Rewrite each case that asserts a linked worktree to assert a clone, through the `.git` directory, the `alternates` file and the registry's `copy_kind`. These are the cases that read `git worktree list`, a `.git` pointer file, `worktree remove`, or a `-b` upstream set to `origin/<base>`. In the default-mode and `--no-bootstrap` success cases, also assert that the clone's `refs/remotes/origin/<b>` equals the main checkout's, and that a `git rev-list --count origin/<b>..HEAD` run in the clone prints `0`: the flows' Phase D push-state read (Task 28) sees the creation push.
- [ ] Add one case per failure-after-branch exit:
  - **Bootstrap failure:** a `setup-worktree.sh` in the fixture's main scripts directory that exits non-zero.
  - **Push failure:** a bare `origin` whose `pre-receive` refuses.
  - **Mirror sync-out failure after a successful push:** a bare `origin` whose `post-receive` hook, on the branch's creation only (old value all zeros), creates the lock file `<derived copy path>/.git/refs/remotes/origin/<b>.lock` (its parent directories included), so the clone's `update-ref` fails. Also assert that `git -C <main> ls-remote origin refs/heads/<b>` prints nothing and that `git -C <main> config --get-regexp '^branch\.<b>\.'` prints nothing.

  Each asserts exit status and first line, then that no `<w>/demo-*` directory, no local branch and no registry record remain. Add a perturbation case in the same fixture where nothing fails and all three exist.
- [ ] Add the override refusal, and the live-copy refusal for every mode. Seed a stale registry record whose `worktree` no longer exists, and assert that it is **not** a live copy. Keep the existing `--existing` payload case: a committed `.claude/settings.json` is refused with nothing created.
- [ ] `push-branch-worktree-config.test.mjs` case (l): it says it mirrors `create-worktree.sh`, which cuts from `origin/trunk` with the base as upstream until the first push. Restate it as a branch cut **by hand** from `origin/trunk`, which is still the condition `push-branch.sh` handles. Add an assertion that a branch `create-worktree.sh` cut is already tracking its own ref. Drop that file's header claims about how `create-worktree.sh` leaves a branch.

**Verification:**

- `npm test --workspace cli -- test/create-worktree.test.mjs` passes.
- `npm test --workspace cli -- test/push-branch-worktree-config.test.mjs` passes.
- Every fixture is under the system temp directory. `git -C <repo root> worktree list` and `git -C <repo root> branch` read the same before and after the run, so no case touched this checkout.
