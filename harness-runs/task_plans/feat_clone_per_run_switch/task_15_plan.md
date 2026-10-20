### Task 15 — Move `watcher-review-drop-payloads.test.mjs` to the clone layout, keeping each worktree-only plant as a clone equivalent or a migration case

**Goal:** The review-drop payload suite runs on the copy `create-worktree.sh` now cuts, a clone. Each payload a sandboxed run could plant in its copy is planted where a clone's run could plant it, and is refused, or does not fire, as the suite already asserts. A plant that only a linked worktree has (a record's `config.worktree` under `extensions.worktreeConfig`, the `.git` pointer, the record's `HEAD`) moves to its clone equivalent, or stays as a legacy-worktree case labelled as migration coverage. No assertion is left that can no longer fail.

**Depends on:** Task 13 and, through it, Tasks 1 and 7.
- **A task drop:** the watcher cuts the copy with `create-worktree.sh`, a clone with `copy_kind` `clone`.
- **Review reuse:** goes through `hr_run_copy_check_var`, which on a clone checks the registry, the clone's `HEAD`, `objects/info/alternates`, and a `.git/config` within `hr_clone_config_spec`, and refuses a planted `commondir`, `config.worktree` or `objects/info/http-alternates`. It then syncs in clone-first.
- **Each launch:** gets a per-run profile, under the fixture's `XDG_STATE_HOME`.

### Targets

- `cli/test/watcher-review-drop-payloads.test.mjs`

**Work:**

- [x] Read each case and classify its plant:
  - clone-applicable: a committed protected path, `.gitattributes`, a nested repository;
  - worktree-only: `config.worktree` fsmonitor, the pointer, the record `HEAD`.

  Record the classification in the header, as a list.
- [x] Re-point each clone-applicable case at the clone the drop cut. Its assertions keep their meaning: refused, the marker never fires, the main checkout's refs unchanged.
- [x] Give each worktree-only plant its clone equivalent where one exists:
  - a `core.fsmonitor` in the clone's `.git/config`, off the allow-list;
  - a planted `.git/config.worktree`;
  - a planted `.git/commondir`.

  Each asserts the clone check's refusal sentence and that no marker fires.
- [x] Keep the original worktree plant as one legacy case where no clone equivalent exists. Build it with a linked worktree and a registry record carrying no `copy_kind`, and title it as migration coverage.
- [x] Update the header's rule, fixture description (*"working copy cut by `create-worktree.sh`"* → a clone) and `RED ONCE` list.

**Verification:**

- `npm test --workspace cli -- test/watcher-review-drop-payloads.test.mjs` passes.
- Each re-pointed clone case fails when the clone check's matching refusal is removed from a temp copy of the library inside the fixture. Confirm that once, never by editing the template, and record it in `RED ONCE`.
- **Deviations from plan:**
  - Three legacy migration cases kept, not one: (L1, legacy), (L7, legacy) and (R1, legacy). Each asserts a worktree-arm behaviour that a parked legacy run still depends on and the clone layout cannot reach: the pinned clean test not reading `config.worktree`, the `is on branch 'other'` message, and `push-branch.sh`'s own refusal. Keeping them means each one's RED ONCE mutation still has a case that fails. Every worktree-only plant also has its clone equivalent: (L1) a planted `.git/config.worktree`, (L1c) `core.fsmonitor` in `.git/config`, (L11) a planted `.git/commondir`, (L7) the clone's own `.git/HEAD`, and (R1) a planted `.git/config.worktree` on the remote arm.
  - (L4) now asserts a refusal, not a launch. On a clone, a filter driver can only be defined in `.git/config` or a planted `config.worktree`, and the clone trust check refuses both before the clean test runs.
  - (L3) removes the `submodule.sub` section that `git submodule add` writes into the clone's `.git/config`, because the allow-list would refuse it. The payload stays in the submodule's own `.git/modules/sub/config`.
  - RED ONCE was re-measured on the clone layout for every case, not only for the clone-check ones. Each mutation was applied to the fixture's own written `autonomous-watcher.sh` / `lib/harness-run-lib.sh` by a throwaway Python harness under `harness-runs/scratch/`, run through `scripts/scratch-run.sh`. The template was never touched, and the test file was restored after each run. Results:
    - (R2)'s first mutation now fails on `refs/heads/feat_x moved`, not on markers.
    - (R3)'s recorded mutation (the commit through `commit-on-branch.sh --repo`) no longer fails, because that wrapper runs no commit hook. It was replaced by an unpinned `git add` / `git commit` in the clone, which fails holding `R3-commit-msg` and `R3-pre-commit`.
  - The scratch harness directory `harness-runs/scratch/t15/` was left in place: removing it was refused. It is gitignored.
