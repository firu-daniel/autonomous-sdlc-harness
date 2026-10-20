### Task 7 — Make `create-worktree.sh` create a clone in all three modes, bootstrap it through the main checkout's `setup-worktree.sh --target`, and roll back everything it created on failure

**Goal:** Every run copy `create-worktree.sh` makes is a clone, in default mode, under `--no-bootstrap` and under `--existing` alike.
- It is made by the library's `hr_clone_create_var` at the derived path, and bootstrapped through the **main** checkout's `setup-worktree.sh --target <clone>`.
- A new branch is pushed from the main checkout.
- On every failure exit after the branch exists, it removes everything it created (the clone, the remote branch its own push created, the branch it cut with the upstream configuration its push wrote, the registry record and a registry directory it made) and nothing it did not create (`harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path…"*).
- Its deliberate refusals keep their messages. The script name stays.

**Depends on:** Task 1, which defines `hr_run_copy_live_var <main> <branch>`: `0` with `HR_LIVE_COPY` / `HR_LIVE_COPY_WHY` set when a live run copy of `<branch>` exists, `1` when none does, `2` when it cannot tell. The existing `hr_clone_create_var <main> <branch> <start>` sets `HR_CLONE_DIR`, or `HR_CLONE_REFUSAL` with its own rollback: it cuts `refs/heads/<branch>` at `<start>` only when the main checkout lacks it, and records `worktree` and `copy_kind` `clone` in the registry. The existing `hr_clone_remove_var <main> <dir>` removes a registered clone. Task 1 also restates three library comments so this task's calls are declared ones:
- `hr_registry_drop`'s comment names `create-worktree.sh`'s failure rollback among its callers (rollback step 4 below);
- `hr_registry_restore`'s comment names `create-worktree.sh`'s failure rollback among its callers (rollback step 4, "put the previous one back");
- `hr_clone_create_var`'s refusal of a missing registry directory names `create-worktree.sh` beside the watcher as a creator of that directory (the `mkdir -p` below). The refusal itself is unchanged, so this script creates the directory **before** calling `hr_clone_create_var`.

**Where this task stops.** It does not change the library, the watcher's call sites (they already branch on a non-zero exit), or `remote-run.sh`'s use of `--no-bootstrap` (Task 11). The suite is Task 8's.

### Targets

- `cli/templates/scripts/create-worktree.sh`
- `cli/templates/scripts/setup-worktree.sh` (header sentence only: *"Nothing creates a clone yet."*)

**Work:**

- [ ] **Before anything is created, in every mode.**
  - Refuse the optional `[worktree-dir]` override with one line saying a run copy lives only at the derived path, because the clone arm of the wrappers' trust check accepts no other. Exit `1`, as a usage error, and update the usage line.
  - Run `hr_run_copy_live_var`. On `0`, refuse with the existing message, `create-worktree.sh: branch '$branch' is already checked out at $HR_LIVE_COPY — refusing` and its second line, exit `2`, in default mode as in `--existing`. On `2`, refuse, naming that the live-copy test could not be answered.
  - Every mode now runs only from the main checkout's own scripts directory (the existing `--existing` placement test), because each one bootstraps through **this** directory's `setup-worktree.sh --target`. Check that bootstrap script is readable here too, before creation.
  - If `<stateDir>/autonomous_logs/` under the main checkout does not exist, create it (`mkdir -p`) and remember that this run made it. `hr_clone_create_var` refuses a missing registry directory, and a trigger job's fresh checkout has none.
- [ ] **Default and `--no-bootstrap` alone (a new branch).**
  - Keep the `origin` checks and `hr_run_trusted_base_var` exactly as they are, with their messages.
  - Replace `worktree add -b` and the `--set-upstream-to` line with `hr_clone_create_var "$main_repo" "$branch" "$HR_RUN_TRUSTED_BASE"`.
  - Push from the main checkout, not from the copy: `git -C "$main_repo" push --set-upstream origin "refs/heads/$branch:refs/heads/$branch"`. The clone's `origin` has the same URL, because `hr_clone_create_var` copies `remote.origin.url` from the main checkout's `.git/config` (`hr_clone_config_spec`). Pushing from the main checkout is still right for three reasons: the main checkout's `pre-push` hook runs as it did, the upstream lands in the main `.git/config`, and the clone's sandbox-reachable configuration never decides the push.
  - Then sync the pushed tip's remote-tracking ref out to the clone: `hr_copy_sync_out_var "$main_repo" "$HR_CLONE_DIR/.git" "refs/remotes/origin/$branch" ""` (empty expected-old: the clone must not have it yet). The flows' Phase D push-state read is `git rev-list --count origin/<branch>..HEAD` in the run copy (Task 28), and a clone has no `branch.<branch>.*` upstream keys, so this mirror is what that read sees from the run's first moment. `push-branch.sh` keeps it current after every later push. Once the push has succeeded, record its tip (`pushed_tip`, the tip this run cut) and that this run's push created `refs/heads/<branch>` on `origin`; the origin checks above already proved the remote branch absent before the push. A failed sync-out is a failure exit **after the push landed**, so the rollback below covers it, the remote branch included (exit `2`, naming the step). It is the only failure exit that can follow a successful push: the push was the script's last step before this branch.
- [ ] **`--existing`.** Keep the fetch, the local-or-origin test and the one tip read.
  - When only `origin/<branch>` exists, create `refs/heads/<branch>` at that tip in the main checkout by compare-and-swap from nothing, and remember that this run made it.
  - Then `hr_clone_create_var "$main_repo" "$branch" ""`, which takes the existing tip and runs the protected-surface check itself.
  - Check `HR_CLONE_DIR`'s branch and tip as today, through `hr_run_copy_check_var`.
  - Remove the `worktree add --no-checkout`, `read-tree` population and `existing_undo`'s `git worktree remove`, because the library's creation populates and rolls back on its own failures.

  `--existing` never pushes.
- [ ] **One rollback for every failure exit after the branch exists**, set as an `EXIT` trap once creation succeeds and cleared on the success exit, replacing `set -e`'s leave-it-in-place behaviour. It covers a failed bootstrap (the existing exit `4`), a failed push (now exit `2`, naming the push) and a failed mirror sync-out after a successful push (exit `2`, naming the sync-out). In order:
  1. **Only when this run's push landed:** delete the remote branch with a lease on the pushed tip, from the main checkout: `git -C "$main_repo" push --force-with-lease="refs/heads/$branch:$pushed_tip" origin ":refs/heads/$branch"`. The lease makes it delete only the ref this run pushed, never one another writer has moved since. The main checkout's `pre-push` hook runs on it as on the creation push.
  2. `hr_clone_remove_var` on the clone;
  3. delete the local branch, by compare-and-swap from the tip this run cut or created, only when this run made it. When this run's push wrote the upstream (`branch.<branch>.remote` / `.merge` in the main `.git/config`), remove that section too (`git -C "$main_repo" config --remove-section "branch.$branch"`), because `update-ref -d` leaves it behind;
  4. drop the registry record when none existed before (`hr_registry_drop`), or put the previous one back;
  5. `rmdir` a registry directory this run made, if it is empty.

  Each undo that fails prints one line naming what is left and the command to clear it; for step 1 that is the remote branch and the same lease-guarded delete. Bootstrapped modes run `bash "$script_dir/setup-worktree.sh" --target "$HR_CLONE_DIR"`. Exit `4` keeps its first line and now says the copy and the branch were removed.
- [ ] **Header and `REPRO`.** Rewrite the header for clones:
  - *THE TWO MODES* and *WHERE THE WORKTREE GOES*, keeping the title and the script name;
  - *WHY `set -e` IS RIGHT HERE*, which now ends in a rollback instead of leaving the copy for inspection;
  - *WHAT IT NEVER DOES* (no `--local`, no hardlinks, never a second live copy);
  - the exit map, where `4` now removes what it made, and `2` now also covers a failed push (nothing left on `origin`) and a failed mirror sync-out after the push (the remote branch this run pushed is deleted under its lease, with everything else it made).

  Rewrite each `REPRO` arm to the clone layout: `hr_clone_remove_var` replaces `git worktree remove`, and `git -C "$b" branch` still shows what was pushed. In `setup-worktree.sh`, replace *"Nothing creates a clone yet."* with `create-worktree.sh` as the caller.

**Verification:**

- Each rewritten `REPRO` arm, run by hand against its own throwaway fixture under the system temp directory, produces the outcome it states. Each arm leaves no `<w>/demo-*` directory, no local branch and no registry record behind on a refusal or a rolled-back failure.
- `bash -n` of both scripts under macOS `/bin/bash` (3.2) exits 0.
- After a successful default-mode run in the fixture:
  - `git -C <copy> rev-parse --git-dir` prints `.git`, a directory, not a pointer;
  - the copy's `.git/objects/info/alternates` names the main checkout's objects;
  - `jq -r '.runs["feat/x"].copy_kind' <main>/sdlc-harness/autonomous_logs/registry.json` prints `clone`;
  - `git -C <main> config branch.feat/x.merge` prints `refs/heads/feat/x`;
  - `git -C <copy> rev-parse refs/remotes/origin/feat/x` equals `git -C <main> rev-parse refs/remotes/origin/feat/x`, and a bare `git rev-list --count origin/feat/x..HEAD` run in the copy prints `0`.
- In a fresh fixture, force the mirror sync-out to fail after the push: give the bare `origin` a `post-receive` hook that, on the branch's creation only (old value all zeros), creates the lock file `<derived copy path>/.git/refs/remotes/origin/feat/x.lock`, its parent directories included. The run exits `2` naming the sync-out, and afterwards `git -C <main> ls-remote origin refs/heads/feat/x` prints nothing, `git -C <main> config --get-regexp '^branch\.feat/x\.'` prints nothing, and no copy, local branch or registry record is left.

- **Deviations from plan:**
  - The plan says the origin checks "already proved the remote branch absent before the push". They do not: `hr_run_trusted_base_var` reads only `refs/heads/<defaultBranch>`. Default mode therefore runs `ls-remote --exit-code origin refs/heads/<branch>` before creating anything. Exit `2` from it means absent. Exit `0` means present, and the rollback then never deletes the remote branch. Any other status refuses with exit `2`, and nothing is created. `push_created` is set only when the push succeeded and the branch was absent beforehand, so the lease-guarded delete never removes a branch this run did not create.
  - Default mode now refuses an existing local `refs/heads/<branch>` (exit `2`, nothing created). Before, `worktree add -b` failed with git's own status. Without this, `hr_clone_create_var` would clone the existing tip, and the rollback would treat as its own a branch this run did not cut.
  - The `branch.<branch>` section is removed on rollback only when the push succeeded and neither `branch.<branch>.remote` nor `.merge` existed before. A pre-existing section is not this run's to remove.
  - An unreadable `setup-worktree.sh` beside the script is now checked before creation, as the plan asks. It refuses with exit `1` and nothing created. Its first line is the old `no bootstrap script at '<path>', this main checkout's own` line. Exit `4` now means the bootstrap ran and failed, with a first line naming the failed `--target` bootstrap and its status. The old exit-`4` first line described a missing script, which can no longer reach exit `4`.
  - When this run made the registry directory, the rollback also removes `registry.json` if it holds no run (`.runs == {}`), then `rmdir`s the directory. `hr_registry_set` creates that file, so without this step the directory is never empty and the "a registry directory it made" undo could not happen.
  - The placement test (main checkout's own scripts directory) runs before `hr_run_copy_live_var`. The live-copy test answers `2` (cannot tell) for a non-main checkout, which would hide the placement refusal's message.
  - A `hr_clone_create_var` refusal exits `2` and quotes `HR_CLONE_REFUSAL`. Before, a `worktree add` failure exited with git's own status.
  - `--existing` with only `origin/<branch>` now creates the local branch by compare-and-swap with no upstream configuration. `worktree add`'s DWIM used to set `branch.<branch>` to track `origin/<branch>`. The plan names no upstream write for this mode.
  - `setup-worktree.sh`: besides the targeted sentence, two more header sentences are rewritten because this change made them false. *WHO RUNS IT* said a default-mode cut runs the new copy's own script. *WHY NO `set -e`* said `create-worktree.sh`'s `set -e` acts on the status, and that a failed install is merely not pushed.
