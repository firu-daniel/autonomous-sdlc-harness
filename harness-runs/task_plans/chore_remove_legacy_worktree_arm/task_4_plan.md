### Task 4 — Sweep: remove the `git worktree remove` arm and skip a record with no `copy_kind`

**Goal:** `cleanup-merged-worktrees.sh` removes a gone branch's copy only through the clone arm; a record with no `copy_kind` is skipped with one line, never removed through `git worktree remove`, never pruned from the registry, and its branch deletion follows as for every other skip.

**Where this task stops.** The sweep and its tests. The watcher's skip is Task 2's; `docs/watcher.md`'s description of the sweep is Task 8's.

### Targets

- `cli/templates/scripts/cleanup-merged-worktrees.sh`
- `cli/test/cleanup-run-copies.test.mjs` — the legacy case, rewritten; header.
- `cli/test/cleanup-worktree-record.test.mjs` — deleted.

**Work:**

- [ ] **The arm.** In the per-branch loop, the `''` case of `case "$kind"` no longer calls `own_worktree_check`: it prints one line — `skip removing <wt> for '<branch>' — its run-registry record carries no copy_kind: a linked worktree from before the clone layout, which this sweep no longer removes; remove it by hand`, `[dry-run] would skip …` under `--dry-run` (a sibling of `say_skip` with its own wording, or `say_skip` given a parameter for the lead) — and clears `wt`, so no profile is removed and the branch deletion still follows (git refuses to delete a branch still checked out in that worktree, and the existing `could not delete branch` line reports it). Remove `own_worktree_check`, the `elif` arm that runs `git worktree remove --force`, the dry-run `… and remove worktree $wt` line, and any variable only they used (check `main_top`'s other uses before removing it). The *"already gone"* path for a `worktree` that no longer exists is unchanged. Keep the closing `git worktree prune`, and reword its comment: it drops the records of any linked worktree whose directory is gone.
- [ ] **The header.** Rewrite step 1 (*"a record with no `copy_kind` — a legacy linked worktree — through `git worktree remove --force`"*), *"Both layouts are swept until no worktree run is left"*, the **ONLY THE BRANCH'S OWN WORKING COPY IS REMOVED** bullets (drop the LEGACY WORKTREE bullet; add the no-`copy_kind` skip), the live-status paragraph's *"`worktree remove --force` would discard the pause note"* reason (the clone arm's removal discards it equally), the FAIL CLOSED paragraph's `git worktree remove --force` mention, and the `--dry-run` paragraph's *"for both arms"*. In REPRO, drop `feat_old`'s legacy worktree setup or keep it and change the **preview** and **sweep** expectations to the new skip line, with `feat_old`'s worktree left in place.
- [ ] **The tests.** In `cleanup-run-copies.test.mjs`, replace *"legacy: a recorded worktree is removed with its branch; one with no record is left in place"* with a case where `feat_old` has a linked worktree at its derived path and a record with no `copy_kind`, plus a planted per-run profile: under the real sweep and under `--dry-run` (the suite's `sweepBoth`), stdout carries the new skip line for `feat_old` exactly once, the worktree directory and the planted profile are still there, and no `removed worktree` line appears. Keep the unrecorded-worktree (`feat_stray`) half: left in place. Update the header's first paragraph (*"over clones and legacy linked worktrees"*, *"through the legacy worktree arm"*) and its RED ONCE list (drop the `own_worktree_check` mutation; add one that removes the skip, e.g. the `''` arm falling through to removal). Delete `cli/test/cleanup-worktree-record.test.mjs`.

**Verification:**

- `cleanup-run-copies.test.mjs` passes — the test file this task edits.
- `grep -n 'worktree remove' cli/templates/scripts/cleanup-merged-worktrees.sh` prints no command line, only prose that states the arm is gone, if any.
- `cli/test/cleanup-worktree-record.test.mjs` no longer exists.
