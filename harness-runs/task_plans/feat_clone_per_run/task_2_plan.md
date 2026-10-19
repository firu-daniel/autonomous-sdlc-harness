### Task 2 — Add the sync pair `hr_copy_sync_in_var` / `hr_copy_sync_out_var`: objects reach the main checkout only by a pinned fetch

**Goal:** Give the library the two halves of the clone model. **Sync-in** brings a clone's `refs/heads/<branch>` into the main checkout by a fetch, which hashes every object it receives. **Sync-out** sets a clone's ref to the main checkout's after a ref moves there. Both are no-ops for a worktree and for the main checkout.

**Depends on:** Task 1, which adds `hr_copy_kind <main> <gitdir>`. That function prints `main` for `<main>/.git`, `worktree` for a path directly under `<main>/.git/worktrees/`, and `clone` otherwise, and is called only on a gitdir `hr_wrapper_target_check_var` accepted. When it accepts a clone, that check sets `HR_TARGET_KIND=clone`, `HR_TARGET_GITDIR=<clone>/.git` and `HR_TARGET_BRANCH`. This task calls no check itself: **every caller runs the target check first** (Tasks 7, 9 and 11), so the clone's configuration has already passed the allow-list when either function runs.

**The globals contract (binding on both functions, restated word for word by Tasks 5, 7 and 9).** Neither function reads or writes `HR_RUN_MAIN`, `HR_RUN_TRUSTED_BASE`, `HR_RUN_REFUSAL` or any `HR_RUN_COPY_*` global, and neither calls `hr_run_main_set_var` or `hr_run_main_git`. Each also leaves every `HR_TARGET_*`, `HR_WRAPPER_*` and `HR_COMMIT_*` global as it found it. Each takes its main checkout from its own `<main>` argument alone. On the `clone` arm only, after `hr_copy_kind` has said `clone`, it canonicalizes `<main>` into a local with `hr_run_main_set_var`'s main-checkout predicate: `cd -P` succeeds, and `<main>/.git` is a real directory, not a symbolic link, holding no `commondir`. When the predicate fails, it returns 1 with `HR_SYNC_REFUSAL` set. Every main-side git call then runs through a private runner, `hr_copy_sync_main_git <canonical-main> …`, carrying exactly `hr_run_main_git`'s pins. The only globals either function sets are `HR_SYNC_TIP` (sync-in only) and `HR_SYNC_REFUSAL`, both cleared at entry. So a caller needs no prior `hr_run_main_set_var`, and a call made after the watcher family's globals are seeded leaves them intact.

**Where this task stops.** It does not call these functions from any wrapper or watcher function: Tasks 7 and 9 do. Its suite, including the measurement of which clone-side configuration a local fetch honours, is **Task 5's**.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — a new section, *THE CLONE ARM'S SYNC*, after *THE WATCHER FAMILY'S GIT IN A RUN'S COPY*, plus write exception 6 in the file header.

**Work:**

- [ ] **`hr_copy_sync_in_var <main> <gitdir> <branch>`.** On `main` or `worktree` (`hr_copy_kind`), it returns 0 and does nothing, leaving `HR_SYNC_TIP` empty. On `clone`, with `<clone>` the parent of `<gitdir>`:
  - It refuses a `<branch>` that is empty or starts with `-`.
  - It refuses when **the main checkout has `<branch>` checked out**: the main checkout's own `HEAD`, or any linked worktree in `git -C <main> worktree list --porcelain`. This replaces the free guard git's one-branch-one-checkout rule gives a worktree.
  - It refuses when `<main>` has no `refs/heads/<branch>`, because creation always cuts it there first.
  - It reads the clone's value of the ref into a shell variable, then fetches it from the clone **with no destination**. It then proves with `cat-file -e <oid>^{commit}` in `<main>` that the fetch brought that exact commit. This follows the pattern `hr_run_trusted_base_var` already uses, so nothing the sandbox can write, such as `FETCH_HEAD`, is ever read back.
  - It classifies the clone's commit against the main checkout's:
    - **equal**: nothing to do;
    - **main is an ancestor of the clone**: `update-ref refs/heads/<branch> <oid> <main_old>` in `<main>`, as a compare-and-swap;
    - **the clone is behind**: refuse, naming that a sync-out did not complete;
    - **diverged**: refuse, naming both short ids.
  - It sets `HR_SYNC_TIP` to the main checkout's `refs/heads/<branch>` commit afterwards. Each refusal returns 1 with `HR_SYNC_REFUSAL` set to one sentence naming the branch and the failed step, never a file's contents.
- [ ] **The fetch's pins.** Every git call runs as `GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null git -C <main> -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false -c advice.graftFileDeprecated=false …`, the pins `hr_run_main_git` already carries, through the private runner the globals contract above names, never through `hr_run_main_git` itself. The fetch adds `--no-tags --no-recurse-submodules`, and runs the clone side's `git-upload-pack` with the same `-c core.hooksPath=/dev/null -c core.fsmonitor=false` pins through `--upload-pack`. The task prompt leaves two questions open:
  - which of the clone's own config keys a local-transport fetch honours;
  - whether a hook, filter or fsmonitor in the clone runs during it.

  Task 5 measures both, and Task 15 records the outcome in `docs/cli.md` §6, the document of record for it. Write the section header so it states the pins and cites `docs/cli.md` §6 for the measured outcome, naming `cli/test/clone-sync.test.mjs` only as the suite that re-checks it; assert no outcome nobody has observed. Task 15 lands after this task, so word the citation so a mid-branch reader sees the gap: *"`docs/cli.md` §6, the measured fetch pins (added by this branch)"*.
- [ ] **`hr_copy_sync_out_var <main> <gitdir> <ref> [<expected_old>]`.** On `main` or `worktree` it returns 0 and does nothing. On `clone`:
  - `<ref>` must be `refs/heads/<name>` or `refs/remotes/origin/<name>`, and must resolve to a commit in `<main>`. Read that value with `hr_copy_sync_main_git` on the canonical `<main>`.
  - It sets the clone's `<ref>` to that value with `update-ref`, as a compare-and-swap against `<expected_old>` when one is given.
  - The `update-ref` runs with `GIT_DIR=<gitdir> GIT_COMMON_DIR=<gitdir> GIT_OBJECT_DIRECTORY=<canonical-main>/.git/objects`, `GIT_NO_REPLACE_OBJECTS=1`, `-c core.hooksPath=/dev/null -c core.fsmonitor=false`.
    - `GIT_COMMON_DIR` keeps a `commondir` planted after the check from redirecting the write.
    - `GIT_OBJECT_DIRECTORY` keeps the object-existence test on the main checkout's store.
    - The pinned hooks path stops the `reference-transaction` hook.
  - It returns 1 with `HR_SYNC_REFUSAL` on any failure.
- [ ] **The header.** Add write exception 6 to the library's file header list (*THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES*):
  - **sync-in** writes objects and `refs/heads/<branch>` in the main repository, the latter only by a compare-and-swap `update-ref`;
  - **sync-out** writes the one named ref in a clone's own `.git`;
  - **written only by** `hr_copy_sync_in_var` and `hr_copy_sync_out_var`.

  Add both functions to the closing *"A caller that calls no … still gets a library that only reads"* list.
- [ ] **Floors.** Every flag used — `fetch --no-tags`, `--no-recurse-submodules`, `--upload-pack`, `update-ref` with an old value, `cat-file -e` — is available at git 2.23. Do not use `fetch --no-write-fetch-head`, which is newer than that floor. No bash 4 construct.

**Verification:**

- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0, and `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0.
- **A by-hand probe under the system temp directory, never in this checkout.** Build a main repository, `git clone --shared` it, commit once in the clone, then source the library and call `hr_copy_sync_in_var`. Confirm that the main checkout's `refs/heads/<branch>` moved to the clone's commit and that `HR_SYNC_TIP` names it. Then check out that branch in the main checkout, and confirm the same call refuses with the ref unchanged. Before each call, set `HR_RUN_MAIN`, `HR_RUN_TRUSTED_BASE` and `HR_RUN_COPY_TOP` to sentinel strings, and confirm all three read the same afterwards.
- `git diff` shows no line of *THE WATCHER FAMILY'S GIT IN A RUN'S COPY* or of the wrappers changed by this task.
