### Task 7 — Give the watcher family's git its clone arm: the copy check syncs in, the commit and the fast-forward sync out

**Goal:** Make the functions `docs/watcher.md` → `### Where the family runs git in a run's copy, and under what pins` lists work on a run copy that is a registered clone:

- `hr_run_main_set_var`;
- `hr_run_copy_check_var`;
- `hr_run_copy_git`;
- the artifact commit (`hr_commit_paths_var`, through `hr_commit_placed`);
- the fast-forward (`hr_run_fast_forward_var`);
- the watchdog's reset (`hr_run_reset_var`);
- the surface check (`hr_run_surface_check_var`).

Their pins stay equivalent to today's, and the worktree and main-checkout arms keep their behaviour byte-for-byte.

**Depends on:**

- **Task 1.**
  - `hr_wrapper_target_check_var <main> <target>` gains a clone arm. It accepts a clone only when all of these hold: the registry records it (`copy_kind=clone`, `worktree=<target>`) for the branch its `HEAD` names; it sits at `hr_worktree_dir <main> <branch>`; its `.git` holds no `commondir`, `config.worktree` or `objects/info/http-alternates`; its alternates name `<main>/.git/objects` only; and its `.git/config` is on the allow-list.
  - On acceptance it sets `HR_TARGET_KIND=clone`, `HR_TARGET_GITDIR=<clone>/.git` and `HR_TARGET_BRANCH`.
  - `hr_wrapper_branch_var` returns that branch without re-reading `HEAD`.
  - `hr_copy_kind <main> <gitdir>` prints `main`, `worktree` or `clone`.
- **Task 2.**
  - `hr_copy_sync_in_var <main> <gitdir> <branch>` is a no-op on `main` and `worktree`. On a clone it fetches the clone's `refs/heads/<branch>` into `<main>` under `hr_run_main_git`'s pins and fast-forwards `<main>`'s ref by compare-and-swap. It refuses a branch checked out in `<main>`, a behind clone and diverged tips. It sets `HR_SYNC_TIP` and `HR_SYNC_REFUSAL`.
  - `hr_copy_sync_out_var <main> <gitdir> <ref> [<expected_old>]` is a no-op on `main` and `worktree`. On a clone it sets the clone's `<ref>` to `<main>`'s value with `update-ref`, as a compare-and-swap against `<expected_old>`.
  - **The globals contract, as Task 2 states it.** Neither function reads or writes `HR_RUN_MAIN`, `HR_RUN_TRUSTED_BASE`, `HR_RUN_REFUSAL` or any `HR_RUN_COPY_*` global, and neither calls `hr_run_main_set_var` or `hr_run_main_git`. Each also leaves every `HR_TARGET_*`, `HR_WRAPPER_*` and `HR_COMMIT_*` global as it found it. Each takes its main checkout from its own `<main>` argument alone. On the `clone` arm only, after `hr_copy_kind` has said `clone`, it canonicalizes `<main>` into a local with `hr_run_main_set_var`'s main-checkout predicate: `cd -P` succeeds, and `<main>/.git` is a real directory, not a symbolic link, holding no `commondir`. When the predicate fails, it returns 1 with `HR_SYNC_REFUSAL` set. Every main-side git call then runs through a private runner, `hr_copy_sync_main_git <canonical-main> …`, carrying exactly `hr_run_main_git`'s pins. The only globals either function sets are `HR_SYNC_TIP` (sync-in only) and `HR_SYNC_REFUSAL`, both cleared at entry. So a caller needs no prior `hr_run_main_set_var`, and a call made after the watcher family's globals are seeded leaves them intact.
  - So the calls below, made after `hr_run_copy_check_var`, `hr_run_fast_forward_var` and `hr_commit_paths_var` have seeded `HR_RUN_COPY_TOP`, `HR_RUN_COPY_GITDIR`, `HR_RUN_COPY_BRANCH`, `HR_RUN_COPY_TIP` and `HR_RUN_TRUSTED_BASE`, leave every one of them as it was.

- **Task 3**, which edits the same file. Task 3 adds *CREATING AND REMOVING A RUN'S CLONE* and `hr_registry_drop`, and extends header write exceptions 2 and 6. This task leaves those untouched. In the header it edits write exceptions 4 and 5 and adds `hr_run_copy_check_var` to the closing *"only reads"* list, a list Task 3 also extends; each task adds only its own names to it.

**The design decision this task carries.** On a clone, the runners keep reading **objects from the main checkout only**. `hr_run_copy_git` stays `GIT_DIR=<main>/.git`, `GIT_INDEX_FILE=<HR_RUN_COPY_GITDIR>/index`, `GIT_WORK_TREE=<copy>`, which for a clone is `<clone>/.git/index`. It is not pointed at the clone's own git dir: reading through the clone's object store would let a loose object planted there reach a `read-tree` that writes a protected path, while the surface check, which compares object ids in the main checkout, still passed. Sync-in brings the clone's commits into the main checkout first, and the main checkout's store is what both sides then read. `hr_run_main_set_var`'s main-checkout predicate (a real `.git` directory holding no `commondir`) is kept unchanged. Its clone arm is clearing the new globals. No caller passes a clone as `<main>`: the watcher family places the main checkout from `MAIN_REPO` or the wrapper's own location.

**Where this task stops.** Its suite is **Task 8's**. The wrappers' arm is **Task 9's**: it reports this task's commit sync-out failure through `HR_COMMIT_SYNC_FAILED`, defined below. `create-worktree.sh`, `autonomous-watcher.sh`, `remote-run.sh` and `cleanup-merged-worktrees.sh` are not edited. They reach the clone arm only through these functions, and only for a clone, which nothing creates yet.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the section *THE WATCHER FAMILY'S GIT IN A RUN'S COPY*, `hr_commit_paths_var`, header write exceptions 4 and 5, and the header's closing *"only reads"* list.

**Work:**

- [ ] **`hr_run_main_set_var` and `hr_run_copy_check_var`.**
  - `hr_run_main_set_var` also clears a new `HR_RUN_COPY_KIND`, and nothing else changes in it.
  - `hr_run_copy_check_var <main> <copy>` sets `HR_RUN_COPY_KIND` from `HR_TARGET_KIND` after the target check. On `main` and `worktree` everything below that point is unchanged, the `worktrees/<name>/HEAD` tip read included.
  - On `clone`, when `HR_RUN_COPY_BRANCH` is set, it calls `hr_copy_sync_in_var "$HR_RUN_MAIN" "$HR_RUN_COPY_GITDIR" "$HR_RUN_COPY_BRANCH"`. A refusal returns 1 with `HR_RUN_REFUSAL` set to the sync refusal.
  - It then takes `HR_RUN_COPY_TIP` from `hr_run_main_git rev-parse --verify --quiet "refs/heads/$HR_RUN_COPY_BRANCH^{commit}"`. After the copy check, the main checkout's ref therefore names the run's tip on both arms, exactly as the shared ref store already guarantees for a worktree.
  - A clone whose branch starts with `-` gets an empty branch and an empty tip, so every caller refuses it as an unusable copy.
- [ ] **The commit syncs out.**
  - In `hr_commit_paths_var`, after `update-ref` moves `refs/heads/<branch>` in the main checkout and before the copy's index is synced, call `hr_copy_sync_out_var <main> <gitdir> "refs/heads/<branch>" "<tip>"` when `hr_copy_kind <main> <gitdir>` is `clone`.
  - On failure, return 1 with `HR_COMMIT_NEW` set to the new commit, the new global `HR_COMMIT_SYNC_FAILED=1`, and `HR_COMMIT_REFUSAL` naming the clone's ref and not a file's contents.
  - Clear `HR_COMMIT_SYNC_FAILED` at the function's top, so it is empty on every other path.
  - `hr_commit_placed`'s return codes and stdout line are unchanged. It already maps any non-0, non-3 status to 1.
- [ ] **The fast-forward syncs out.**
  - In `hr_run_fast_forward_var`, after the second `read-tree` succeeds and `HR_RUN_COPY_TIP` is set, call `hr_copy_sync_out_var "$HR_RUN_MAIN" "$HR_RUN_COPY_GITDIR" "refs/heads/$branch" "$tip"` on a clone.
  - A failure returns **5** with `HR_RUN_FF_REFUSAL` naming the clone's ref. That code already means the branch and the copy's tree disagree.
  - `hr_run_reset_var` moves no ref, so it needs no sync-out, and the copy check's sync-in has already made `HR_RUN_COPY_TIP` the clone's tip. Leave it unchanged, and say so in its comment.
  - `hr_run_surface_check_var` and `hr_run_worktree_diff_var` are unchanged too. They read refs and objects from the main checkout and the copy's working tree through a fresh index, which holds for a clone as it does for a worktree. State that in the section header.
- [ ] **The section header and the file header's write list.** First the section header, re-checked line by line against `docs/watcher.md` §2's **The pins.** paragraph. Restate the four rules for both arms:
  - **no hook runs:** unchanged;
  - **the copy's record is read once, by the checks:** for a clone, the registry, `HEAD`, `alternates` and `.git/config` are read once, and only `<clone>/.git/index` is borrowed;
  - **every call names `refs/heads/<branch>`:** unchanged;
  - **history is read as stored:** unchanged.

  Then add the clone arm's sentence: the main checkout's ref is synced in by the copy check and out after every ref this section moves.

  Then the file header's write list, so "writes nothing" stays true (`.claude/context/cli.md` → `## What "done" means here`: a change satisfies its module's header or amends it in the same edit). On a clone the copy check is a writer, and a caller that uses it as a read-only probe (`remote-run.sh`'s liveness test, `hr_run_copy_check_var "$run_main" "$record_wt" && [ "$HR_RUN_COPY_BRANCH" = "$branch" ]`) must be able to see that from the header.
    - **Write exception 5's writers** gain `hr_run_copy_check_var`, worded as: on a clone only, through `hr_copy_sync_in_var`, it writes objects into the main repository and moves the main checkout's `refs/heads/<branch>` by compare-and-swap; on `main` and `worktree` it writes nothing.
    - **Write exception 5's fence is corrected for the clone arm.** Today's "moved only by a compare-and-swap `update-ref` against the tip `hr_run_copy_check_var` read" stays true for the worktree and main-checkout arms. Add that on a clone the copy check itself first moves that ref, by `hr_copy_sync_in_var`'s compare-and-swap against the main checkout's previous value, and every later move in this section is a compare-and-swap against the tip the copy check read after that sync-in. The fence also gains "and, on a clone, the clone's `refs/heads/<branch>` through `hr_copy_sync_out_var`".
    - **Write exception 4** notes that `hr_commit_paths_var` syncs a clone's ref out through `hr_copy_sync_out_var`. `hr_commit_paths_var` is already listed as a writer there.
    - **The closing *"A caller that calls no … still gets a library that only reads"* list** gains `hr_run_copy_check_var`, with the qualifier that it writes on a clone only. Leave Task 2's `hr_copy_sync_in_var` / `hr_copy_sync_out_var` entries and Task 3's entries as they are.
- [ ] **Floors.** No git flag is added beyond Task 2's, and no bash 4 construct is used. `bash -n` passes.

**Verification:**

- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0, and `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0.
- `git diff --stat cli/test/` shows no change from this task. The existing suites that drive these functions on a worktree — `outer-loop-scripts`, `cleanup-worktree-record`, `create-worktree`, `remote-review-payloads`, `watcher-stall-reset-payloads`, `watcher-review-drop-payloads`, `commit-on-branch-plumbing` — run at Run gates and must pass unedited.
- **Read the header diff for the writer lists.** Every function this task makes a writer — `hr_run_copy_check_var` (a writer on a clone) — appears both in a write exception's *"Written only by"* list (exception 5) and in the closing *"only reads"* list. `hr_commit_paths_var` and `hr_run_fast_forward_var`, already in both, still are. Exception 5's fence no longer states, without a clone qualifier, that the ref is moved only against the tip `hr_run_copy_check_var` read.
- Read the diff. Every inserted line is either selected by `HR_RUN_COPY_KIND` / `hr_copy_kind` being `clone`, or a call that is a no-op on the other arms (`hr_copy_sync_in_var`, `hr_copy_sync_out_var`), apart from the cleared globals and the comment lines of the section header and the file header.
- **Deviations from plan:**
  - The commit's and the fast-forward's `hr_copy_sync_out_var` calls are made unconditionally rather than behind an `hr_copy_kind` / `HR_RUN_COPY_KIND` test: the function's own first step is that `hr_copy_kind` test and it returns 0 on `main` and `worktree`, so behaviour is identical. Gating the fast-forward on `HR_RUN_COPY_KIND` would have skipped the sync-out after `hr_commit_paths_var`, which clears that global through `hr_run_main_set_var` without setting it.
  - The commit's sync-out passes `tip_c` (the `rev-parse`d full id of `<tip>`) as `<expected_old>`, not the raw `<tip>` argument: `hr_copy_sync_out_var` refuses a non-hex expected value.
  - On a sync-in refusal `hr_run_copy_check_var` returns 1 with `HR_RUN_COPY_TOP` / `HR_RUN_COPY_GITDIR` / `HR_RUN_COPY_KIND` / `HR_RUN_COPY_BRANCH` left set, as its existing target-accepted paths do; the plan does not ask for them to be cleared.
  - Verification: the seven existing suites named above are deferred to the Run gates phase (they run under `commands.test`). In their place a throwaway probe, `harness-runs/scratch/task7_clone_arm_probe.py` run through `bash scripts/scratch-run.sh`, built a main checkout, a bare origin and a clone made by `hr_clone_create_var`, and passed 13/13 checks: copy check syncs a clone commit in and reports `clone`; `hr_commit_placed` on a clone syncs the clone's ref out and leaves it clean; a sync-out failure returns 1 with `HR_COMMIT_SYNC_FAILED=1` and `HR_COMMIT_NEW` set; `hr_run_fast_forward_var` on a clone returns 0 and syncs out; the worktree and main arms report `worktree` / `main` with today's tips.
