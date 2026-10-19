### Task 6 — Add `cli/test/clone-create-remove.test.mjs`: creation's invariants, the second-copy refusal, rollback, and the removal guard

**Goal:** Prove four things about a clone the library creates:

- it is `--shared` and borrows its objects;
- it is recorded before any check reads it, and its `origin` and remote-tracking refs mean what they mean in a worktree;
- a failed creation removes exactly what it created;
- removal refuses every path but a registered clone's derived one, and still works when the clone's config has been tampered with.

**Depends on:** Task 3, which adds these to `cli/templates/scripts/lib/harness-run-lib.sh`:

- **`hr_clone_create_var <main> <branch> <start>`** sets `HR_CLONE_DIR` and `HR_CLONE_REFUSAL`.
  - **Refusals, before any write:** a protected or invalid branch; a missing registry directory; an existing derived path; a registry `worktree` that exists; `<branch>` checked out in `<main>` or in one of its worktrees.
  - **Order of creation:**
    1. it writes the registry record `worktree <derived path>` and `copy_kind clone` in one `hr_registry_set` call;
    2. it cuts `refs/heads/<branch>` at `<start>` only when that ref is absent, and surface-checks an existing tip with `hr_run_surface_check_var <tip> tree`;
    3. it runs `git clone --shared --no-checkout --template= --no-tags`;
    4. it rewrites `.git/config` to `hr_clone_config_spec`'s set. It sets the refs so that `refs/heads/` holds only `<branch>` at the main checkout's tip and `refs/remotes/origin/*` equals the main checkout's, and `HEAD` names `<branch>`;
    5. it populates the clone with `read-tree --reset -u` under `GIT_DIR=<main>/.git`;
    6. it passes `hr_wrapper_target_check_var`.
  - **On failure** it removes the directory and the branch only if it created them, and restores or drops the registry record.
- **`hr_clone_remove_var <main> <dir>`** refuses when:
  - `<dir>` or its `.git` is a symbolic link;
  - `<dir>` is `<main>`;
  - no record has `copy_kind=clone` and `worktree=<dir>`;
  - `<dir>` is off that record's derived path.

  It runs no config check and no git in the clone, removes the directory, and leaves the registry and the branch alone.
- **`hr_registry_drop <file> <branch>`** deletes one record under the registry lock.

The check that judges a created clone is Task 1's `hr_wrapper_target_check_var`, which sets `HR_TARGET_KIND=clone`.

**Where this task stops.** The check's own refusals are **Task 4's**, and sync is **Task 5's**. This task changes no script.

### Targets

- `cli/test/clone-create-remove.test.mjs` (new)

**Work:**

- [ ] **Header first.** State the rule:
  - a clone is created only for an unprotected branch with no live run copy, recorded before any check reads it, with its objects borrowed and never hardlinked;
  - a failed creation leaves the main checkout, the registry and the filesystem as it found them;
  - removal touches only a registered clone's derived path, never the main checkout and never through a symbolic link.

  Cite `harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create."*
- [ ] **Creation's invariants**, on a fixture under the system temp directory with a local bare origin and `harness.config.json`, the library sourced through `runBash`, and every clone at `hr_worktree_dir` inside the temp tree. Assert, in case (a):
  - `HR_TARGET_KIND=clone` from the target check;
  - `objects/info/alternates` is exactly `<main>/.git/objects`;
  - `find <clone>/.git/objects -type f` lists only `info/alternates`;
  - no object file in the clone shares an inode with one in `<main>/.git/objects` (`stat` each candidate);
  - `refs/heads/` holds `<branch>` only;
  - `refs/remotes/origin/*` equals the main checkout's, compared as two `for-each-ref` listings;
  - `remote.origin.url` equals the main checkout's;
  - `git -C <clone> status --porcelain` is empty;
  - the registry record carries `worktree` and `copy_kind=clone`.

  Then (a2): an existing branch is cloned at its own tip rather than at `<start>`.
- [ ] **Refusals before any write.** For each case, assert that the registry, `git -C <main> for-each-ref` and the temp tree's listing are byte-identical before and after:
  - (b) a branch the main configuration protects;
  - (c) a missing `autonomous_logs/` directory;
  - (d) a derived path that already exists as a directory, and as a symbolic link;
  - (e) a registry record whose `worktree` exists;
  - (f) the branch checked out in the main checkout, and in a linked worktree;
  - (g) an existing branch whose tip changes a protected path (`<githooksDir>/pre-push`) against the default branch, which the surface check refuses.
- [ ] **Rollback.** Force a failure after each write, using a `git` shim first on `PATH` that fails a chosen call. `cli/test/wrapper-target-check.test.mjs` uses that technique. Cases:
  - (h) the clone fails, with a new branch and no prior record. The branch is deleted, the record dropped, and no directory is left;
  - (i) the population fails, with an existing branch and a prior record carrying a stale `worktree`. The branch is untouched, the record's prior `worktree` and `copy_kind` are restored, and the directory is removed;
  - (j) the final target check fails. The same full rollback happens.

  In each case, a directory or branch that existed before the call survives it.
- [ ] **Removal.**
  - (k) A registered clone is removed, and the registry and the branch are unchanged.
  - (l) A registered clone whose `.git/config` gained `core.fsmonitor` pointing at a marker command is still removed, and the marker is never created.
  - (m) Refused, with nothing removed:
    - the main checkout passed as `<dir>`;
    - a scratch directory at another branch's derived path with no record;
    - a clone whose `.git` was replaced by a symbolic link;
    - `<dir>` itself a symbolic link to the clone;
    - a record whose `worktree` names a path other than the derived one.

  Each refusal case asserts that a sentinel file inside the would-be victim still exists.

**Verification:**

- `npm test --workspace cli -- test/clone-create-remove.test.mjs`, from the repository root, as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status. Every case passes, and `# fail 0`.
- Mutate once by hand, then revert, with `git diff` clean afterwards:
  - make `hr_clone_create_var` skip deleting the branch it cut. Case (h) must then fail;
  - make `hr_clone_remove_var` skip the derived-path comparison. The off-path case in (m) must then fail.
