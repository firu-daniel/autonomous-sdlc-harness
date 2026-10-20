### Task 17 — Move `watcher-remote-dispatch.test.mjs` to the clone layout

**Goal:** The remote-dispatch suite cuts a real run copy with `create-worktree.sh` before `remote-run.sh dispatch`. It now asserts that copy is a clone, and that the re-drop refusal still comes from `create-worktree.sh`, now through the one-live-copy rule. No assertion still reads a linked worktree that can no longer appear.

**Depends on:**
- **Task 13:** each launch gets a per-run profile.
- **Task 11:** `remote-run.sh`'s cut and removal of clones.
- **Task 7:** `create-worktree.sh` refuses a second live copy of a branch with `create-worktree.sh: branch '<b>' is already checked out at <path> — refusing`, exit `2`. That refusal comes from `hr_run_copy_live_var`: the derived path exists, the registry's `worktree` exists, or a checkout has the branch.

### Targets

- `cli/test/watcher-remote-dispatch.test.mjs`

**Work:**

- [x] Wherever the suite reads the cut copy, through `git worktree list`, a `.git` pointer or `worktree remove`, assert the clone instead: a `.git` directory, `alternates` naming the main checkout's objects, and `copy_kind` `clone` in the record.
- [x] The case that says a task or docs re-drop never reaches the placement because `create-worktree.sh` refuses the branch now asserts the live-copy refusal line. Add its perturbation: the live copy removed, then the drop proceeds.
- [x] Update the header's fixture description (*"`create-worktree.sh` cuts a real sibling working copy"* → a clone) and its rule.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-dispatch.test.mjs` passes.

**Deviations from plan:**

- No assertion in the suite read the cut copy through `git worktree list`, a `.git` pointer or `worktree remove`, so there was nothing to replace; the clone assertion (`assertClone`: `.git` a directory, `objects/info/alternates` naming the main checkout's `.git/objects`, record `copy_kind` `clone`) was added where the suite already reads the cut copy — the first remote task drop, both key-absent cases, and the new re-drop case.
- The re-drop case is a new `test` (three subtests) rather than an edit of the identical-re-drop case, which drops a review and never reached `create-worktree.sh`; the old comment above it now introduces both.
- The perturbation needs two steps. Removing only the clone leaves a task re-drop at `create-worktree.sh`'s next guard (`a local branch 'feat_x' already exists`), so the second subtest asserts the live-copy line is gone and that guard answers instead; the drop proceeds (cut, committed, pushed, dispatched, a clone again) only in the third subtest, once the main checkout's `refs/heads/feat_x`, its `refs/remotes/origin/feat_x` and origin's `refs/heads/feat_x` are deleted too.
- Observed while writing it: with only the local and origin branches deleted, a stale `refs/remotes/origin/feat_x` in the main checkout makes the re-cut fail — `create-worktree.sh: the mirror sync-out of refs/remotes/origin/feat_x to the clone failed after the push — … update-ref to <oid> failed`, then rollback (the sync-out's empty expected-old meets the ref the clone inherited). The test deletes that ref; `create-worktree.sh` was not changed (outside this unit's target).
