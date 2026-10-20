### Task 17 — Move `watcher-remote-dispatch.test.mjs` to the clone layout

**Goal:** The remote-dispatch suite cuts a real run copy with `create-worktree.sh` before `remote-run.sh dispatch`. It now asserts that copy is a clone, and that the re-drop refusal still comes from `create-worktree.sh`, now through the one-live-copy rule. No assertion still reads a linked worktree that can no longer appear.

**Depends on:**
- **Task 13:** each launch gets a per-run profile.
- **Task 11:** `remote-run.sh`'s cut and removal of clones.
- **Task 7:** `create-worktree.sh` refuses a second live copy of a branch with `create-worktree.sh: branch '<b>' is already checked out at <path> — refusing`, exit `2`. That refusal comes from `hr_run_copy_live_var`: the derived path exists, the registry's `worktree` exists, or a checkout has the branch.

### Targets

- `cli/test/watcher-remote-dispatch.test.mjs`

**Work:**

- [ ] Wherever the suite reads the cut copy, through `git worktree list`, a `.git` pointer or `worktree remove`, assert the clone instead: a `.git` directory, `alternates` naming the main checkout's objects, and `copy_kind` `clone` in the record.
- [ ] The case that says a task or docs re-drop never reaches the placement because `create-worktree.sh` refuses the branch now asserts the live-copy refusal line. Add its perturbation: the live copy removed, then the drop proceeds.
- [ ] Update the header's fixture description (*"`create-worktree.sh` cuts a real sibling working copy"* → a clone) and its rule.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-dispatch.test.mjs` passes.
