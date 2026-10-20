### Task 24 — Record the owed re-runs in `docs/outer-loop-verification.md` and `docs/guard-verification.md`, and the per-run `--settings` argument in `ARCHITECTURE.md`

**Goal:** The two hand-run verification records say which of their rows this branch's changes leave owed a re-run, and why. `ARCHITECTURE.md`'s launch-path inventory states what `--settings` now names.
- **`docs/outer-loop-verification.md`:** its §1.3 rows (`create-worktree.sh` and `setup-worktree.sh`) and §1.4 rows (`cleanup-merged-worktrees.sh`) were driven on the linked-worktree layout and are owed a re-drive on the clone layout. One §1.3 row's expected outcome changed: exit `4` now removes the copy and the branch. The wrapper rows' existing *"Owed a re-drive"* note gains the clone arm.
- **`docs/guard-verification.md`:** no guard and no shared-library function changed on this branch. But the guards now run in sessions whose cwd is a clone, not a linked worktree, so its standing decision matrices are owed a re-run from a clone cwd. Its per-Bash-call latency rows are not, because no guard code moved.
- **`ARCHITECTURE.md` §5:** `--settings`' argument is the per-run copy, not the fixed `SETTINGS_PROFILE`.

**Depends on:** Tasks 7, 9 and 13. Their behaviour, restated:
- **`create-worktree.sh`**, every mode:
  - makes a clone, bootstrapped through the main checkout's `setup-worktree.sh --target`;
  - refuses a `[worktree-dir]` override (exit `1`) and a live copy (exit `2`, with the existing *"already checked out at"* line);
  - on a failed bootstrap (exit `4`), a failed push (exit `2`) or a failed mirror sync-out after the push (exit `2`), removes the clone, the branch it cut and its registry record, and, where its push had landed, deletes the remote branch under a lease on the pushed tip.
- **`cleanup-merged-worktrees.sh`:** finds copies from the registry and removes a clone through `hr_clone_remove_var`, or a legacy worktree through its existing arm.
- **The watcher:** passes `--settings` a per-run copy at `<lane dir>/run-profiles/<slug>/<sanitized branch>.json`, derived from `SETTINGS_PROFILE` at every spawn, and refuses the launch when the copy fails its check.

### Targets

- `docs/outer-loop-verification.md`
- `docs/guard-verification.md`
- `ARCHITECTURE.md`

**Work:**

- [ ] **`docs/outer-loop-verification.md` §1.3:** add an **Owed a re-drive on the clone layout** note above the table, in the shape of the existing *"Owed a re-drive"* note. It names which rows' mechanism moved and why:
  - the copy is a clone;
  - the bootstrap is always the main checkout's `--target`;
  - the override is refused;
  - the exit-`4` row now expects the copy and the branch removed;
  - a failed push, or a failed mirror sync-out after the push, is now exit `2` with the same rollback, the latter also deleting the remote branch its push created.

  Mark the exit-`4` row's cells as the record of their date. Do not rewrite them; the note states the new expectation. Restate the file-header paragraph that names which templates changed since the stamp: re-run its recipe rather than editing a number (*"re-run the recipe rather than editing the number"*).
- [ ] **`docs/outer-loop-verification.md` §1.4 and the wrapper rows:**
  - §1.4 gets the same kind of note: candidates come from the registry, a clone is removed through the library, and `--dry-run` decides by the same rule.
  - The existing *"Owed a re-drive"* note for the wrapper rows adds the clone arm's clone-first order and `push-branch.sh`'s pre-push check.
  - In the paragraph that says which outer-loop scripts carry a profile entry (*"Which outer-loop scripts carry a generated permission entry"*), check every sentence naming the sibling-worktree glob still holds. The allow forms are unchanged, and only the `.git` protection moved.
- [ ] **`docs/guard-verification.md`:** add a dated note beside *"2026-10-20: `hc_main_root` changed, and no guard calls it"*, in that note's shape. It says:
  - `feat_clone_per_run_switch` changed no file under `plugin/hooks/`;
  - give the commands that show it in their own fenced block, one command per line (`harness-runs/lessons.md` → `## Adopter-facing documentation`): first the merge-base read, `git merge-base HEAD origin/dev` (`dev` is this repository's `defaultBranch` in `harness.config.json`; read it there rather than assuming it), then `git diff --stat <merge-base>..HEAD -- plugin/hooks` with `<merge-base>` standing for the hash the first line printed, which prints nothing. Say in the prose before the block that the placeholder is that hash;
  - the §1.2 latency rows are therefore not re-taken;
  - the §2 standing decision matrices were taken with the session's cwd in a linked worktree and are owed a re-run with the cwd in a clone, because a guard's own `git` calls now resolve the clone's `.git`, not a worktree's pointer.

  Leave the measured rows themselves untouched.
- [ ] **`ARCHITECTURE.md` §5:**
  - In the `spawn_engine` invocation row, `--settings` names the per-run copy.
  - In the paragraph beginning *"Two flags in the invocation row name more than a value"*, its argument is the per-run copy the watcher renders from `SETTINGS_PROFILE` at every spawn, under the machine state directory, and refuses to launch on when the copy fails its check. Keep `SETTINGS_PROFILE` as the base it derives from.

  Keep the `[shipped]` / `[designed]` markers on every sentence you touch. Re-run the section's own derivation (*"Re-run the derivation from this folder's root"*) and confirm every site it reaches is still a row or a dispositioned sentence.

**Verification:**

- `git grep -nF 'a fixed `.claude/` dot-path under the main checkout' -- ARCHITECTURE.md` prints nothing, or prints only a sentence that now names the per-run copy as the argument.
- Re-run verbatim from the repository root, the `grep -rnE …` derivation that `ARCHITECTURE.md` §5 prints reaches no site that is neither a row nor named in that section's dispositioning sentence.
- `git diff -U0 docs/guard-verification.md docs/outer-loop-verification.md` adds notes only. No measured cell changed.
