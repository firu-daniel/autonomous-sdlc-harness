### Task 4 — Give `refresh-branch.sh` the clone-first swap and `push-branch.sh` a pre-push clone check, map the new statuses in `commit-on-branch.sh`, and prove all three on a clone

**Goal:** Change the three excluded wrappers so that a commit landing in a clone between sync-in and the wrapper's own update refuses with nothing moved on either side. Then prove that a forced sync-out failure no longer strands the clone: the next ordinary wrapper call succeeds. A diverged clone is still refused.

**Depends on:** Task 1, which defines these library functions:
- **`hr_copy_ref_swap_var <main> <gitdir> <ref> <new> <old> <reflog>`:**
  - `0` both moved;
  - `4` nothing moved;
  - `5` the clone moved, the main checkout did not, and the rollback failed;
  - `<new>` equal to `<old>` is the verify-only form, a locked compare-and-swap of the clone's ref onto itself.
- **`hr_commit_paths_var`:** reports helper `5` through its landed path (`HR_COMMIT_SYNC_FAILED=1`).
- **`hr_copy_sync_in_var`:** heals a strictly-behind clone.

Every wrapper's exit map and stdout lines stay as they are. Each change below is an internal reordering or one extra refusal sentence inside an existing exit.

### Targets

- `cli/templates/scripts/refresh-branch.sh`
- `cli/templates/scripts/push-branch.sh`
- `cli/templates/scripts/commit-on-branch.sh`
- `cli/test/wrapper-clone-arm.test.mjs`

**Work:**

- [ ] **`refresh-branch.sh`.** Replace the `main_git update-ref … "refs/heads/$branch" "$new_tip" "$old_tip"` and the later `hr_copy_sync_out_var … "refs/heads/$branch" "$old_tip"` with one `hr_copy_ref_swap_var` call before the real `read-tree`. Map its results:
  - `4` → the existing *"moved while it was being refreshed"* exit `1`;
  - `5` → exit `5`.

  The put-back after a refused real `read-tree` becomes the reverse swap: `0` → the existing exit `1`, anything else → exit `5`. Leave the fetched-base mirror into the clone (`refs/remotes/origin/<base>`) as it is, and say in the header's **A CLONE IS A TARGET TOO** paragraph that it is the one ref still moved main-first, a remote-tracking ref no run commits to. Rewrite that paragraph's *"No shipped script creates such a clone yet"* to name `create-worktree.sh` as the creator.
- [ ] **`push-branch.sh`.** After `hr_copy_sync_in_var` and the remote checks, and immediately before the push loop, verify the clone's `refs/heads/<branch>` still holds `HR_SYNC_TIP` through the verify-only `hr_copy_ref_swap_var`. On anything but `0`, print one `push-branch.sh: refusing to push: …` line naming the moved ref and exit `0`, as every push refusal does. Nothing is pushed and no ref moves. The `origin/<branch>` mirror after a landed push stays main-first.
  - Header: rewrite *"No shipped script creates such a clone yet"*.
  - The deleted-on-its-remote comment says `create-worktree.sh` cuts a branch from `origin/<base>`, so a new branch's `branch.<branch>.merge` is `refs/heads/<base>` until its first push. Restate it: a branch `create-worktree.sh` cuts is pushed from the main checkout with `--set-upstream` when it is created (Task 7), and a branch cut by hand from `origin/<base>` keeps `refs/heads/<base>` until its first push, which is not tracking.
- [ ] **`commit-on-branch.sh`.**
  - The landed exit `1` line (`commit-on-branch.sh: committed <short_sha> on <branch>, but …`) now also covers the clone-ahead state that `hr_commit_paths_var` reports through `HR_COMMIT_SYNC_FAILED=1`. Word its tail so it says the main checkout's ref will follow on the next wrapper call. The leading wire stays byte-for-byte.
  - Rewrite the header's **A CLONE IS A TARGET TOO** paragraph for the clone-first order, and replace *"No shipped script creates such a clone"* with `create-worktree.sh`.
- [ ] **`wrapper-clone-arm.test.mjs`, the four-operations race at wrapper level.** Use the existing `git` shim technique: the shim commits once in the clone after sync-in and before the wrapper's own update. Add one case for each of `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`. Each asserts:
  - the wrapper's documented refusal status and line;
  - both copies' `refs/heads/<branch>` unchanged;
  - for the push, `git ls-remote origin <branch>` unchanged.

  Re-stage the existing failed-sync-out cases, which move the clone's ref right after the main checkout's `update-ref -m`, to the outcome the clone-first order gives. Keep no assertion that can no longer fail.
- [ ] **`wrapper-clone-arm.test.mjs`, the heal and the diverged refusal.**
  - **Heal:** force a sync-out failure on one wrapper call. Use the push's `origin/<branch>` mirror, the one path still main-first, or hand-move the clone's `refs/heads/<branch>` back one commit so the clone is strictly behind. Then an ordinary `commit-on-branch.sh` call exits `0`, and both refs are equal at the new commit.
  - **Diverged:** a clone with a commit of its own, beside a main checkout that moved independently, is refused by all three wrappers with nothing moved.

  Update the header's `RED ONCE` list.

**Verification:**

- `npm test --workspace cli -- test/wrapper-clone-arm.test.mjs` passes.
- Each wrapper's own `REPRO` block, run by hand against a throwaway fixture under the system temp directory, still produces the outcomes it states. Each worktree-arm control in the suite still matches its clone case's exit status and stdout line, which shows the worktree arm is untouched.
- `bash -n` of each wrapper under macOS `/bin/bash` (3.2) exits 0.

- **Deviations from plan:**
  - `refresh-branch.sh`'s branch update now runs through `hr_copy_ref_swap_var`, whose main-side runner pins `core.hooksPath=/dev/null`, so a `reference-transaction` hook in the main checkout's pinned hooks directory no longer fires for the branch move (the fetch still fires it). The header's PER-WORKING-COPY and MERGE-IS-BUILT-FROM-PLUMBING paragraphs now say so. `cli/test/refresh-branch-worktree-config.test.mjs` cases (a) and (d) assert `markers == ['main-rt']` after a fetching refresh; that file is not this unit's and was not run — deferred to the Run gates phase.
  - The diverged-clone refusal for all three wrappers extends the existing case (i) (push only) instead of adding a new case, so no assertion is duplicated.
  - Evidence downgrade: the REPRO verification ran the main-checkout rows of the three blocks (refresh behind → 0, again → 3, protected → 2, fast-forward → 0, conflict → 4 with the tip unchanged; commit → 0, again → 3; first push and nothing-new push → 0 with the pushed line) by a throwaway probe under `harness-runs/scratch/`. The worktree, target-check and configuration rows were not run by hand; they rest on this suite's (p) worktree control, which passed, and on `wrapper-target-check.test.mjs`, `refresh-branch-worktree-config.test.mjs`, `push-branch-*.test.mjs` and `commit-on-branch-*.test.mjs`, which this unit did not edit and did not run — deferred to the Run gates phase. The refresh stderr substrings those suites match (`moved while it was being refreshed, or its ref could not be locked (see output above) — nothing was merged, working copy unchanged`, `was put back where it was, nothing was merged`, `putting '<branch>' back failed too`) are kept byte-for-byte.
