### Task 10 — Prove the registry-driven sweep for clones and legacy worktrees, and re-aim `cleanup-worktree-record.test.mjs` at it

**Goal:** Lock in Task 9.
- The sweep removes a gone branch's clone and branch.
- It keeps an active run's clone.
- It removes a legacy worktree run's copy.
- It refuses a registry record that names a directory which is not the branch's own copy.
- `--dry-run` reports the same decisions and changes nothing.

Then re-aim the existing record-tampering suite: it planted `worktree list` records, which the sweep no longer reads, so as written its "removes nothing" assertions could no longer fail.

**Depends on:** Task 9. This is the behaviour this task asserts:
- **Candidates:** the gone branches that pass the existing refusals. The copy is the registry record's `worktree`.
- **`copy_kind` `clone`:** removed through `hr_clone_remove_var`; a refusal is the line `skip removing <dir> for '<branch>' — … (<reason>)`.
- **No `copy_kind`:** the legacy worktree arm, as before.
- **`--dry-run`:** prints `[dry-run] would remove …` or `[dry-run] would skip …` and removes nothing.

### Targets

- `cli/test/cleanup-run-copies.test.mjs` (new)
- `cli/test/cleanup-worktree-record.test.mjs`

**Work:**

- [ ] `cleanup-run-copies.test.mjs`: build a fixture with a bare `origin`, a `harness.config.json`, the template scripts and library copied in, and a registry. Make clones with `hr_clone_create_var`. Open with the rule: *a run copy is found from the registry and removed by its kind; nothing the registry does not name as the branch's own copy is removed*.
- [ ] **Cases:**
  - a gone branch with a clone and a `completed` record: the clone and the branch are removed;
  - the same with a `running` record, and with `parked`: nothing is removed;
  - a gone branch whose clone record names the derived path of **another** branch: skipped, naming the reason, and the other directory survives;
  - a gone branch with no record: no removal, and the branch is still deleted.
- [ ] **The legacy case:** a linked worktree made with `git worktree add` at the derived path, with a record carrying no `copy_kind`, is removed with its branch. A worktree listed by `git worktree list` with **no** record is left in place, which proves the sweep no longer reads that list.
- [ ] **`--dry-run`:** for the cases above, the printed decisions match the real sweep's, and every directory, branch and registry byte is unchanged afterwards.
- [ ] `cleanup-worktree-record.test.mjs`: give each tampered-record case a registry record naming the victim directory, so the sweep reaches the check that refuses it, and assert the refusal line and the victim's survival. Update its header to say candidates now come from the registry and the record tampering is the legacy arm's.

**Verification:**

- `npm test --workspace cli -- test/cleanup-run-copies.test.mjs` passes.
- `npm test --workspace cli -- test/cleanup-worktree-record.test.mjs` passes.
- Each tampered-record case fails when the legacy arm's target check is removed from a temp copy of the script. Confirm that once, against the copy in the fixture, never by editing the template, and record it in the header's `RED ONCE`.
