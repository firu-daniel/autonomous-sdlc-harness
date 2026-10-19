### Task 8 — Add `cli/test/run-copy-clone-arm.test.mjs`: the copy check, the artifact commit, the fast-forward, the reset and the surface check on a clone

**Goal:** Prove that the watcher family's git works on a registered clone with the same pins and refusals it has on a worktree, and that every object it writes into the clone's working tree came from the main checkout's store.

**Depends on:** Task 7. Its changes to `cli/templates/scripts/lib/harness-run-lib.sh`, restated:

- **`hr_run_copy_check_var <main> <copy>`** sets `HR_RUN_COPY_KIND` (`main` / `worktree` / `clone`). On a clone with a usable branch, it calls `hr_copy_sync_in_var`, which fetches the clone's `refs/heads/<branch>` into `<main>` and fast-forwards it. It refuses a branch checked out in `<main>`, a behind clone and diverged tips. It then sets `HR_RUN_COPY_TIP` from `<main>`'s `refs/heads/<branch>`. A sync refusal returns 1 with `HR_RUN_REFUSAL` set.
- **`hr_run_main_set_var`** clears `HR_RUN_COPY_KIND`.
- **`hr_run_copy_git`** is unchanged: `GIT_DIR=<main>/.git`, `GIT_INDEX_FILE=<HR_RUN_COPY_GITDIR>/index` (for a clone, `<clone>/.git/index`) and `GIT_WORK_TREE=<copy>`. It never reads the clone's object store or `.git/config`.
- **`hr_commit_paths_var`**, on a clone, calls `hr_copy_sync_out_var … refs/heads/<branch> <tip>` after its `update-ref`. A failure returns 1 with `HR_COMMIT_NEW` set and `HR_COMMIT_SYNC_FAILED=1`. **`hr_commit_placed`** keeps its codes: 0, 3, 2, 1.
- **`hr_run_fast_forward_var <ref>`**, on a clone, syncs out after the second `read-tree`. A sync-out failure returns 5.
- **`hr_run_reset_var`**, **`hr_run_surface_check_var`** and **`hr_run_worktree_diff_var`** are unchanged.

Clones come from Task 3's `hr_clone_create_var <main> <branch> <start>`, which sets `HR_CLONE_DIR`.

**Where this task stops.** The wrappers on a clone are **Task 10's** suite, and sync in isolation is **Task 5's**. This task changes no script.

### Targets

- `cli/test/run-copy-clone-arm.test.mjs` (new)

**Work:**

- [ ] **Header first.** State the rule:
  - on a clone, the watcher family's git runs under the same pins as on a worktree: no hook, no fsmonitor, no submodule recursion, history as stored, and `refs/heads/<branch>` named;
  - it reads objects from the main checkout alone, syncs the run's ref in at the copy check and out after every ref it moves, and refuses a protected-path change exactly as on a worktree.

  Name the fixture technique: the library sourced through `runBash`, with a local bare origin standing in for the network that `hr_run_trusted_base_var` asks.
- [ ] **The fixture, under the system temp directory and torn down in process.** It holds:
  - a main checkout with a hand-written `harness.config.json` whose `githooksDir` is `githooks`, its `autonomous_logs/` directory, and a local bare origin whose default branch carries a committed `githooks/pre-push`;
  - a clone made by `hr_clone_create_var` at `hr_worktree_dir`.

  Cases:
  - (a) **The copy check on a clone.** After a plain `git commit` in the clone:
    - the check returns 0 with `HR_RUN_COPY_KIND=clone`;
    - `HR_RUN_COPY_TIP` is the clone's commit;
    - the main checkout's `refs/heads/<branch>` now names it;
    - `hr_run_copy_clean` returns 0.
  - (b) **The copy check refuses** with the branch checked out in the main checkout, and with the clone's `refs/heads/<branch>` rewound behind the main checkout's.
- [ ] **The artifact commit on a clone** (`hr_commit_placed <main> <clone> <rel> <subject>`):
  - (c) it exits 0 and prints `committed <short> on <branch>`;
  - the main checkout's ref and the clone's own `refs/heads/<branch>` both name the new commit;
  - `git -C <clone> status --porcelain` is empty;
  - a `pre-commit` and a `reference-transaction` hook placed in the clone's configured `githooks/` directory each write a marker, and neither marker exists afterwards;
  - (c2) a second identical drop exits 3.
  - (d) **A failed sync-out:** make the clone's `refs/heads/<branch>` move under the call, using a `git` shim first on `PATH` that rewrites it at the commit's `update-ref`, the technique `cli/test/wrapper-target-check.test.mjs` uses. `hr_commit_paths_var` then returns 1 with `HR_COMMIT_SYNC_FAILED=1` and `HR_COMMIT_NEW` set, and the main checkout's commit stands.
- [ ] **The fast-forward, the reset and the surface check on a clone.**
  - (e) `hr_run_fast_forward_var refs/remotes/origin/<branch>`, after the bare origin's branch gains a commit, returns 0. The clone's ref, index and tree all reach the new commit, and the main checkout's ref matches.
  - (f) **A target commit that changes `githooks/pre-push`** against the default branch is refused (1). The clone's ref, tree and the main checkout's ref are unchanged.
  - (g) The watchdog's reset (`hr_run_reset_var`) restores a tracked file the clone's working tree changed. It refuses (1) when the clone's working tree changed `githooks/pre-push`, including when that change is marked skip-worktree in `<clone>/.git/index`.
- [ ] **Objects come from the main checkout only.**
  - (h) Before a fast-forward, plant a loose object in `<clone>/.git/objects/<xx>/<rest>` under the name of a blob the target commit carries, holding a different blob's compressed bytes, by the method `docs/cli.md` §6 residual 6 describes.
  - The fast-forward writes the **true** bytes into the clone's working tree: the file's `git hash-object` equals its name. `git -C <main> fsck --full` reports no hash-path mismatch.
  - This is the case that shows the runners never read the clone's store.

**Verification:**

- `npm test --workspace cli -- test/run-copy-clone-arm.test.mjs`, from the repository root, as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status. Every case passes, and `# fail 0`.
- Mutate once by hand, then revert, with `git diff` clean afterwards:
  - point `hr_run_copy_git`'s `GIT_DIR` at `$HR_RUN_COPY_GITDIR` when the kind is `clone`. Case (h) must then fail;
  - drop the fast-forward's sync-out. Case (e) must then fail on the clone's own ref.

- **Deviations from plan:** Case (c) asserts `git -C <clone> status --porcelain` is empty after removing the two hook files it placed in the clone's tracked `githooks/` directory, since they are untracked files there; it also sets the clone's `core.hooksPath` to `<clone>/githooks` (an allow-listed key) and proves the hook armed with an unpinned `update-ref` before the call. The two mutation runs wrote their output to a scratchpad file to read the counts back; the verifying run of the file was the plain foreground command (`# tests 11`, `# pass 11`, `# fail 0`, exit 0).
