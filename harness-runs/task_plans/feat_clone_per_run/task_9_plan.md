### Task 9 — Give `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` their clone arm through sync-in, operate, sync-out

**Goal:** Let the three excluded wrappers work against a run copy that is a registered clone, through the model below:

- **sync in:** the main checkout fetches the clone's branch;
- **operate:** the wrapper's existing operation runs in the main checkout, unchanged;
- **sync out:** the clone's ref is set to match.

Their exit contracts and stdout lines stay unchanged, and every refusal they make today still fires on both arms.

**Depends on:**

- **Task 1.**
  - `hr_wrapper_target_check_var <main> <target>` now also sets `HR_TARGET_KIND` (`main` / `worktree` / `clone`). On the clone arm it sets `HR_TARGET_GITDIR=<clone>/.git` and `HR_TARGET_BRANCH`. That arm has already checked the registry record, the derived path, the absence of `commondir`, `config.worktree` and `objects/info/http-alternates`, the alternates and the `.git/config` allow-list.
  - `hr_wrapper_branch_var <main> "$HR_TARGET_GITDIR"` returns `HR_TARGET_BRANCH` on a clone without re-reading `HEAD`.
  - `hr_copy_kind <main> <gitdir>` prints the arm.
- **Task 2.**
  - `hr_copy_sync_in_var <main> <gitdir> <branch>` is a no-op returning 0 on `main` and `worktree`. On a clone it fast-forwards `<main>`'s `refs/heads/<branch>` from the clone, refusing a checked-out branch, a behind clone and diverged tips. It sets `HR_SYNC_TIP` and `HR_SYNC_REFUSAL`.
  - `hr_copy_sync_out_var <main> <gitdir> <ref> [<expected_old>]` is a no-op on `main` and `worktree`. On a clone it sets the clone's `<ref>` to `<main>`'s value, sets `HR_SYNC_REFUSAL` on failure, and accepts `refs/heads/*` and `refs/remotes/origin/*` only.
  - **The globals contract, as Task 2 states it.** Neither function reads or writes `HR_RUN_MAIN`, `HR_RUN_TRUSTED_BASE`, `HR_RUN_REFUSAL` or any `HR_RUN_COPY_*` global, and neither calls `hr_run_main_set_var` or `hr_run_main_git`. Each also leaves every `HR_TARGET_*`, `HR_WRAPPER_*` and `HR_COMMIT_*` global as it found it. Each takes its main checkout from its own `<main>` argument alone. On the `clone` arm only, after `hr_copy_kind` has said `clone`, it canonicalizes `<main>` into a local with `hr_run_main_set_var`'s main-checkout predicate: `cd -P` succeeds, and `<main>/.git` is a real directory, not a symbolic link, holding no `commondir`. When the predicate fails, it returns 1 with `HR_SYNC_REFUSAL` set. Every main-side git call then runs through a private runner, `hr_copy_sync_main_git <canonical-main> …`, carrying exactly `hr_run_main_git`'s pins. The only globals either function sets are `HR_SYNC_TIP` (sync-in only) and `HR_SYNC_REFUSAL`, both cleared at entry. So a caller needs no prior `hr_run_main_set_var`, and a call made after the watcher family's globals are seeded leaves them intact.

- **Task 7.** `hr_commit_paths_var <main> <top> <gitdir> <branch> <tip> …` now syncs out on a clone: when `hr_copy_kind <main> <gitdir>` is `clone`, it calls `hr_copy_sync_out_var <main> <gitdir> refs/heads/<branch> <tip>` right after its `update-ref` moves the main checkout's ref and before it syncs the clone's index. A sync-out failure returns 1, with `HR_COMMIT_NEW` set, `HR_COMMIT_SYNC_FAILED=1` and `HR_COMMIT_REFUSAL` naming the clone's ref. `HR_COMMIT_SYNC_FAILED` is empty on every other path.

**The commit's sync-out is not this task's.** `commit-on-branch.sh` commits through `hr_commit_paths_var`, and **Task 7** added the sync-out inside that library function. This task changes only how the wrapper reports it: see the commit bullet.

**Where this task stops.** The suite is **Task 10's**. The watcher family is **Task 7's**, already landed. Nothing here changes a caller's spelling: no plugin file and no profile entry is touched.

### Targets

- `cli/templates/scripts/commit-on-branch.sh`
- `cli/templates/scripts/push-branch.sh`
- `cli/templates/scripts/refresh-branch.sh`

**Work:**

- [ ] **The common change in all three, placed identically.**
  - `hr_worktree_config_check_var "$top_nogit"` runs exactly as today when `HR_TARGET_KIND` is `main` or `worktree`. On `clone` it is skipped, because the target check's clone arm has already refused a `config.worktree` and held `.git/config` to the allow-list. Every main-checkout and worktree refusal therefore still fires with its sentence byte-identical.
  - After the branch is read, the `-` refusal runs and the protected-branch decision is made, each wrapper calls `hr_copy_sync_in_var "$main_top" "$HR_TARGET_GITDIR" "$branch"` before its first read of `refs/heads/$branch`. A refusal is reported under the wrapper's own prefix and exit contract:
    - `commit-on-branch.sh: refusing to commit: <HR_SYNC_REFUSAL>`, exit 1;
    - `push-branch.sh: refusing to push: <HR_SYNC_REFUSAL>`, exit 0;
    - `refresh-branch.sh: refusing to refresh: <HR_SYNC_REFUSAL>`, exit 1.

  No `hr_run_main_set_var` call is added, and no wrapper sets `HR_RUN_MAIN`: by Task 2's globals contract each sync function takes its main checkout from its `<main>` argument, `"$main_top"`, alone, and on the `main` and `worktree` arms it returns 0 without running git, so the worktree arm's behaviour is unchanged.

  The `wt_git` / `main_git` helpers are unchanged. For a clone, `GIT_INDEX_FILE="$wt_gitdir/index"` is `<clone>/.git/index` and objects still come from `<main>/.git`.
- [ ] **`commit-on-branch.sh`.**
  - The commit itself is unchanged: `hr_commit_paths_var … "$wt_gitdir" …`.
  - On a clone, Task 7's library change makes that call sync the clone's `refs/heads/<branch>` after the ref moves. When that sync-out fails, the function returns 1 with `HR_COMMIT_NEW` set and `HR_COMMIT_REFUSAL` naming the clone's ref.
  - Make the wrapper's catch-all print, for that case only, `commit-on-branch.sh: committed <sha> on <branch>, but <HR_COMMIT_REFUSAL> — the commit stands` on stderr, exit 1. Distinguish it by the global Task 7 sets: `HR_COMMIT_SYNC_FAILED=1`.
  - The worktree arm's existing index-sync message, and every stdout line (`commit-on-branch.sh: committed <short_sha> on <branch>`), stay byte-identical.
  - Exit codes stay 0 / 1 / 2 / 3.
- [ ] **`push-branch.sh`.**
  - The sync-in comes before the deleted-on-its-remote check, so the main checkout pushes the commits the run made in its clone.
  - Every exit stays 0, and every stdout line stays byte-identical, including `push-branch.sh: pushed <branch> to <remote>`.
  - After a successful push only, mirror the remote-tracking ref into the clone, so `origin/<branch>` means there what it means in a worktree: `hr_copy_sync_out_var "$main_top" "$HR_TARGET_GITDIR" "refs/remotes/$remote/$branch"`, called only when `$remote` is `origin`.
  - A mirror failure prints one line, `push-branch.sh: pushed <branch> to <remote>, but the clone's origin/<branch> could not follow: <HR_SYNC_REFUSAL>`, after the success line, and still exits 0.
- [ ] **`refresh-branch.sh`.**
  - The sync-in comes before `old_tip` is read.
  - After the existing `update-ref` and the second `wt_git read-tree` both succeed, it calls `hr_copy_sync_out_var "$main_top" "$wt_gitdir" "refs/heads/$branch" "$old_tip"` before printing `merged <base_ref> into <branch>`.
  - A sync-out failure exits **5** with one stderr line naming the clone's ref, the same state that code already means: the branch does not point at the commit the working copy holds.
  - Without `--local`, also mirror `refs/remotes/origin/$base` into the clone after the fetch, non-fatally.
  - The put-back paths need no sync-out, because the clone's ref was never moved.
  - Exit codes 0 / 1 / 2 / 3 / 4 / 5 and every stdout line stay unchanged.
- [ ] **Headers.**
  - Each wrapper's header gains one paragraph, *A CLONE IS A TARGET TOO*. It says the clone arm is accepted on the library's clone conditions, follows sync-in, operate, sync-out, keeps every refusal, and is created by nothing yet.
  - `push-branch.sh`'s header states the mirror.
  - `refresh-branch.sh`'s header states that exit 5 also covers a failed sync-out.

  Keep the existing paragraphs byte-identical apart from those additions.

**Verification:**

- `bash -n` on each of the three templates exits 0, and `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0.
- `git diff --stat cli/test/` shows no change to any existing suite from this task. The worktree-arm suites — `wrapper-target-check`, `commit-on-branch-target-check`, `commit-on-branch-plumbing`, `push-branch-deleted-upstream`, `push-branch-retry`, `push-branch-worktree-config`, `push-destination` and `refresh-branch-worktree-config` — are run by Run gates, not by this unit (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`).
- Read the diff of each wrapper and confirm two things. Every inserted line is either a clone-only branch selected by `HR_TARGET_KIND` / `hr_copy_kind`, or a call that is a no-op on the other arms. And no existing `echo` text changed.
