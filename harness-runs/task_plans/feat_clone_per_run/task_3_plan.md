### Task 3 — Add `hr_clone_create_var`, `hr_clone_remove_var` and `hr_registry_drop`: a `--shared` clone recorded before any check reads it, a guarded removal, and a full rollback

**Goal:** Give the library, and only the library, a way to create a run's clone that Task 1's trust check accepts, and a way to remove one. The removal keeps working when a tampered clone no longer passes that check. **`create-worktree.sh` does not call any of this**, and no other script does either.

**Depends on:** Task 1. Its interfaces, restated exactly:

- `hr_clone_config_spec <main> <top>` prints the clone `.git/config` allow-list, one `<lowercase key><TAB><rule>` line per key. A rule is `=<exact value>` or `bool`. The required keys are:
  - `core.repositoryformatversion=0`;
  - `core.bare=false`;
  - `remote.origin.fetch=+refs/heads/*:refs/remotes/origin/*`;
  - `remote.origin.url=<main's own>`, when the main checkout names one.

  The optional keys are `core.logallrefupdates=true`, the four platform booleans and `core.hookspath=<top>/<githooksDir>`.
- `hr_clone_config_check_var <main> <top>` sets `HR_CLONE_CONFIG_REFUSAL`.
- `hr_registry_peek <file> <branch> <key>` reads without creating.
- `hr_wrapper_target_check_var`'s clone arm accepts `<target>` only under all of these conditions:
  - the registry at `hr_state_path <main> autonomous_logs/registry.json` records `copy_kind=clone` and `worktree=<target>` for the branch `<target>/.git/HEAD` names;
  - `<target>` is `hr_worktree_dir <main> <branch>`;
  - `.git` is a real directory holding no `commondir`, no `config.worktree` and no `objects/info/http-alternates`;
  - `objects/info/alternates` holds exactly `<main>/.git/objects`;
  - the config passes the allow-list.

This task's creator must produce exactly that, and **Task 1's check, not this task, is the judge of it**.

It also depends on **Task 2**, which edits the same file. Task 2 adds the section *THE CLONE ARM'S SYNC*, which this task's new section follows, and write exception 6 in the file header, whose fence this task extends. This task calls neither sync function.

**Where this task stops.** The sync pair is **Task 2's**, and this task needs none of it. The suite is **Task 6's**. `setup-worktree.sh --target`'s clone arm, which adds `core.hooksPath` afterwards, is **Task 11's**.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the RUN REGISTRY section (`hr_registry_drop`) and a new section, *CREATING AND REMOVING A RUN'S CLONE*, after Task 2's *THE CLONE ARM'S SYNC*; header write exceptions 2 and 6, and the header's closing *"only reads"* list.

**Work:**

- [ ] **`hr_registry_drop <file> <branch>`.** It deletes `.runs[<branch>]` under the same lock, `mktemp` and `mv` that `hr_registry_set` uses. It returns 1, writing nothing, when it cannot take the lock. Add it to write exception 2's list of writers and to the closing *"only reads"* list. It exists only for creation's rollback.
- [ ] **`hr_clone_create_var <main> <branch> <start>`, the refusals, all before anything is written.** It sets `HR_CLONE_DIR` (the canonical created path) and `HR_CLONE_REFUSAL`. `<main>` must pass `hr_run_main_set_var`. Refuse, writing nothing:
  - a `<branch>` that is empty, starts with `-`, fails `check-ref-format`, or is protected by the **main** checkout's configuration (`hr_branch_is_protected <main>`);
  - a registry whose directory does not exist. The watcher makes that directory, and this function never does;
  - **a second live run copy for the branch**, which replaces git's one-branch-one-checkout rule:
    - the derived path `hr_worktree_dir <main> <branch>` exists in any form, a symbolic link included;
    - or the registry's `worktree` for the branch names a path that exists;
    - or `<main>` or any of its linked worktrees has `<branch>` checked out.
- [ ] **`hr_clone_create_var`, creation, in this order.**
  1. **Record first, before any check reads it.** In one `hr_registry_set` call, write `worktree <derived path>` and `copy_kind clone`. Remember whether a record existed, and its previous `worktree` and `copy_kind` values.
  2. **Cut the branch only if it is absent.** If `<main>` has no `refs/heads/<branch>`, create it at `<start>`, which must resolve to a commit there, and remember that it did. If the branch exists, take its tip, and refuse unless `hr_run_surface_check_var <tip> tree` passes, as `create-worktree.sh --existing` does before it writes a run's tree.
  3. **Clone, never with hardlinks.** Run `git clone --shared --no-checkout --template= --no-tags` from the canonical `<main>` to the derived path, with the hooks, fsmonitor and submodule pins of `hr_run_main_git`. Never use `--local` hardlinks: a hardlinked object file is the main checkout's own inode.
  4. **Make origin mean what it means in a worktree.**
     - Rewrite `<clone>/.git/config` to exactly `hr_clone_config_spec`'s required keys, plus whichever optional platform booleans the main checkout's own `.git/config` sets to `true` or `false`, written with `git -C / config --file`.
     - The clone's refs end as follows: `refs/heads/` holds only `<branch>` at the main checkout's tip, `refs/remotes/origin/*` equals the main checkout's `refs/remotes/origin/*`, and `HEAD` is `ref: refs/heads/<branch>`.
     - `objects/info/alternates` holds exactly `<main>/.git/objects`, canonical.
  5. **Populate.** Write the tree into the clone's index and working tree with `read-tree --reset -u <tip>` under `GIT_DIR=<main>/.git`, `GIT_INDEX_FILE=<clone>/.git/index` and `GIT_WORK_TREE=<clone>` and the same pins: the `hr_run_copy_git` shape, objects read from the main checkout's store.
  6. **Self-check.** Finish with `hr_wrapper_target_check_var <main> <clone>`. A refusal there is a creation failure, never a success.
- [ ] **Failure rolls back everything it created, and nothing it did not** (`harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create."*). On any failure after the first write:
  - remove the clone directory, only if this call created it;
  - delete `refs/heads/<branch>` in `<main>`, only if this call created it, and as a compare-and-swap from `<start>`;
  - restore the registry record. Use `hr_registry_drop` when no record existed before. Otherwise put back its previous `worktree` and `copy_kind` values in one `hr_registry_set` call.

  Then return 1 with `HR_CLONE_REFUSAL` naming the failed step.
- [ ] **`hr_clone_remove_var <main> <dir>`, guarded, and possible for a tampered clone.** Refuse, removing nothing, when:
  - `<dir>` or `<dir>/.git` is a symbolic link, or `<dir>/.git` is not a real directory;
  - `<dir>`, canonically, is `<main>`;
  - no registry record has `copy_kind=clone` and `worktree` canonically equal to `<dir>`. Find the record by reading the file without creating it (`jq` over `.runs`), never by the clone's own `HEAD`;
  - `<dir>` is not `hr_worktree_dir <main> <that record's branch>`.

  **It does not run the config check or the trust check, and runs no git in the clone**, so a registered clone whose config was tampered with can still be removed. Remove with `rm -rf -- <canonical dir>`, a script-internal call like the library's existing temp-directory removals. Leave the registry and the branch untouched: cleanup from the registry belongs to a later branch. Then:
  - add write exception 6's creation and removal fences to the header: the derived path, `refs/heads/<branch>` in `<main>` when this call cut it, and the registry through `hr_registry_set` and `hr_registry_drop`;
  - add `hr_clone_create_var` and `hr_clone_remove_var` to write exception 6's *"written only by"* list, after Task 2's `hr_copy_sync_in_var` and `hr_copy_sync_out_var`, so it no longer names the sync pair alone;
  - add `hr_clone_create_var` and `hr_clone_remove_var` to the header's closing *"A caller that calls no … still gets a library that only reads"* list, beside `hr_registry_drop`, so a caller of either is not told it gets a library that only reads (`.claude/context/cli.md` → `## What "done" means here`: a change satisfies its module's header or amends it in the same edit);
  - check every flag against git 2.23 and use no bash 4 construct.

**Verification:**

- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0, and `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0.
- **Read the header diff for the writer lists.** Every writer this task adds — `hr_registry_drop`, `hr_clone_create_var` and `hr_clone_remove_var` — appears both in a write exception's *"written only by"* list (`hr_registry_drop` in exception 2, the other two in exception 6) and in the closing *"only reads"* list.
- **A by-hand probe under the system temp directory, never in this checkout.** Build a main repository with a `harness.config.json`, its `autonomous_logs` directory, and a local bare origin, then call `hr_clone_create_var`. Confirm all of the following:
  - `hr_wrapper_target_check_var` accepts the clone;
  - `find <clone>/.git/objects -type f` lists only `info/alternates`, so the object store is borrowed, not copied;
  - removing the registry's directory makes a second creation for another branch refuse with nothing written.
