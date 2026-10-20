### Task 15 — Move `watcher-review-drop-payloads.test.mjs` to the clone layout, keeping each worktree-only plant as a clone equivalent or a migration case

**Goal:** The review-drop payload suite runs on the copy `create-worktree.sh` now cuts, a clone. Each payload a sandboxed run could plant in its copy is planted where a clone's run could plant it, and is refused, or does not fire, as the suite already asserts. A plant that only a linked worktree has (a record's `config.worktree` under `extensions.worktreeConfig`, the `.git` pointer, the record's `HEAD`) moves to its clone equivalent, or stays as a legacy-worktree case labelled as migration coverage. No assertion is left that can no longer fail.

**Depends on:** Task 13 and, through it, Tasks 1 and 7.
- **A task drop:** the watcher cuts the copy with `create-worktree.sh`, a clone with `copy_kind` `clone`.
- **Review reuse:** goes through `hr_run_copy_check_var`, which on a clone checks the registry, the clone's `HEAD`, `objects/info/alternates`, and a `.git/config` within `hr_clone_config_spec`, and refuses a planted `commondir`, `config.worktree` or `objects/info/http-alternates`. It then syncs in clone-first.
- **Each launch:** gets a per-run profile, under the fixture's `XDG_STATE_HOME`.

### Targets

- `cli/test/watcher-review-drop-payloads.test.mjs`

**Work:**

- [ ] Read each case and classify its plant:
  - clone-applicable: a committed protected path, `.gitattributes`, a nested repository;
  - worktree-only: `config.worktree` fsmonitor, the pointer, the record `HEAD`.

  Record the classification in the header, as a list.
- [ ] Re-point each clone-applicable case at the clone the drop cut. Its assertions keep their meaning: refused, the marker never fires, the main checkout's refs unchanged.
- [ ] Give each worktree-only plant its clone equivalent where one exists:
  - a `core.fsmonitor` in the clone's `.git/config`, off the allow-list;
  - a planted `.git/config.worktree`;
  - a planted `.git/commondir`.

  Each asserts the clone check's refusal sentence and that no marker fires.
- [ ] Keep the original worktree plant as one legacy case where no clone equivalent exists. Build it with a linked worktree and a registry record carrying no `copy_kind`, and title it as migration coverage.
- [ ] Update the header's rule, fixture description (*"working copy cut by `create-worktree.sh`"* → a clone) and `RED ONCE` list.

**Verification:**

- `npm test --workspace cli -- test/watcher-review-drop-payloads.test.mjs` passes.
- Each re-pointed clone case fails when the clone check's matching refusal is removed from a temp copy of the library inside the fixture. Confirm that once, never by editing the template, and record it in `RED ONCE`.
