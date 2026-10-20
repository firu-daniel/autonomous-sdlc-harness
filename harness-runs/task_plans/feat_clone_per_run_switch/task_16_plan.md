### Task 16 — Move `watcher-stall-reset-payloads.test.mjs` to the clone layout on the same terms

**Goal:** The stall-watchdog reset suite runs on the clone `create-worktree.sh` now cuts. Its payloads are planted where a clone's run could plant them, and are refused before the reset writes anything. Worktree-only plants move to a clone equivalent, or stay as a labelled legacy-worktree migration case. No assertion is left that can no longer fail.

**Depends on:** Task 13 and, through it, Tasks 1 and 7.
- **The watchdog's reset:** runs `hr_run_copy_check_var`, which on a clone runs the clone trust check and syncs in clone-first. It then runs `hr_run_reset_var`, whose surface check compares the copy's working tree on the protected set with the tip and refuses a difference.
- **A task drop:** cut as a clone with `copy_kind` `clone`.
- **Each launch:** gets a per-run profile, under the fixture's `XDG_STATE_HOME`.

### Targets

- `cli/test/watcher-stall-reset-payloads.test.mjs`

**Work:**

- [ ] Classify each case's plant as clone-applicable or worktree-only, as Task 15 does for its suite, and record the list in the header.
- [ ] Re-point each clone-applicable case at the clone. Keep each assertion's meaning: no reset written, the marker never fires, the refusal line logged.
- [ ] Give each worktree-only plant its clone equivalent (an off-allow-list `.git/config` key, a planted `.git/config.worktree` or `.git/commondir`), asserting the clone check's refusal and that the reset wrote nothing.
- [ ] Keep one labelled legacy-worktree case where no clone equivalent exists, built from a linked worktree and a registry record with no `copy_kind`.
- [ ] Update the header's rule, fixture description and `RED ONCE` list.

**Verification:**

- `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs` passes.
- Each re-pointed clone case fails against a temp copy of the library, inside the fixture, with the matching refusal removed. Confirm that once and record it in `RED ONCE`.
