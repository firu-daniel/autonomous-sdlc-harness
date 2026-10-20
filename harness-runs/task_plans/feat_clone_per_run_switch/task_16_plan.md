### Task 16 — Move `watcher-stall-reset-payloads.test.mjs` to the clone layout on the same terms

**Goal:** The stall-watchdog reset suite runs on the clone `create-worktree.sh` now cuts. Its payloads are planted where a clone's run could plant them, and are refused before the reset writes anything. Worktree-only plants move to a clone equivalent, or stay as a labelled legacy-worktree migration case. No assertion is left that can no longer fail.

**Depends on:** Task 13 and, through it, Tasks 1 and 7.
- **The watchdog's reset:** runs `hr_run_copy_check_var`, which on a clone runs the clone trust check and syncs in clone-first. It then runs `hr_run_reset_var`, whose surface check compares the copy's working tree on the protected set with the tip and refuses a difference.
- **A task drop:** cut as a clone with `copy_kind` `clone`.
- **Each launch:** gets a per-run profile, under the fixture's `XDG_STATE_HOME`.

### Targets

- `cli/test/watcher-stall-reset-payloads.test.mjs`

**Work:**

- [x] Classify each case's plant as clone-applicable or worktree-only, as Task 15 does for its suite, and record the list in the header.
- [x] Re-point each clone-applicable case at the clone. Keep each assertion's meaning: no reset written, the marker never fires, the refusal line logged.
- [x] Give each worktree-only plant its clone equivalent (an off-allow-list `.git/config` key, a planted `.git/config.worktree` or `.git/commondir`), asserting the clone check's refusal and that the reset wrote nothing.
- [x] Keep one labelled legacy-worktree case where no clone equivalent exists, built from a linked worktree and a registry record with no `copy_kind`.
- [x] Update the header's rule, fixture description and `RED ONCE` list.

**Verification:**

- `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs` passes.
- Each re-pointed clone case fails against a temp copy of the library, inside the fixture, with the matching refusal removed. Confirm that once and record it in `RED ONCE`.
- **Deviations from plan:**
  - Classification recorded in the header. Clone-applicable, re-pointed: honest, S1, S2, S3, S5, S6, S7, S8, S9. Worktree-only S4 has clone equivalents (S4) a planted `.git/config.worktree`, (S4c) `core.fsmonitor` in `.git/config`, and (S10) a planted `.git/commondir`. Each asserts the clone check's refusal sentence, no marker, the session's uncommitted edit still there (no reset ran), no resume note, and the branch unmoved. Job cases J1 to J6 are unchanged, because their copy is the job checkout, never a clone.
  - One legacy case: (S4, legacy). The fixture's `legacy` option swaps the clone for a linked worktree and drops `copy_kind` while the session hangs, because `localStall` cuts the copy during its first `tick`.
  - `commitInCopy` now commits in the clone: `commit-tree` with a command-line identity and `update-ref` of the clone's own ref. A new `fetchCopy` brings the clone's objects into the main repository for the plants made there (S6, S8, S9).
  - (S6) now also writes the payload into the clone's working tree, as S8 and S9 already did, and its working-tree-equals-default assertion became a tip-unmoved assertion. Without that change, the old mutation (merge base against the local `refs/remotes/origin/<default>`) stayed green on the clone layout: the working-tree compare refused the tip under any base, so the case did not isolate the base check.
  - (S9)'s mutation was narrowed to the surface check's merge-base, run without `GIT_GRAFT_FILE=/dev/null`. With the pin removed from `hr_copy_sync_main_git` entirely, the grafts make the sync-in refuse first (`have diverged`), so the case fails on the refusal's wording instead of on a resume. Both outcomes are in `RED ONCE`.
  - RED ONCE was re-measured on the clone layout for every local case. Each mutation was applied to the fixture's own written watcher or library by a throwaway Python driver under `harness-runs/scratch/t16/`, run through `scripts/scratch-run.sh`. The template was never edited, and the test file was restored after each run. The S3 regression-guard note and the J1 to J6 entries were not re-measured, and the header says so.

