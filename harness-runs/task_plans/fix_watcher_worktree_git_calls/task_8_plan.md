### Task 8 — `cleanup-merged-worktrees.sh` removes only the run's own working copy

**Goal:** Close the one exposed call in `cli/templates/scripts/cleanup-merged-worktrees.sh`.

| Site (anchor) | Class today | Payloads that reach it | After this task |
|---|---|---|---|
| `worktree_for_branch` → `git -C "$main_repo" worktree remove --force "$wt"` | (c), a destructive misdirection rather than code execution | the `.git` pointer or record (Linux): a rewritten `<main>/.git/worktrees/<name>/gitdir` makes `worktree list` name any directory, which `--force` then deletes. On every platform, a record's `HEAD` (writable) rewritten to `ref: refs/heads/<gone branch>` makes a live run's copy read as the gone branch's. | removed only when `$wt` passes `hr_wrapper_target_check_var` against the placed main checkout, **and** equals `hr_worktree_dir "$main_repo" "$branch"` canonically. Otherwise skipped with one line, and the branch is still deleted as today. |
| `fetch --prune`, `for-each-ref`, `worktree list`, `branch -D`, `worktree prune` | (a) main checkout only | — | unchanged |

`restart-watcher.sh` runs no git in or on a run's copy. Its `hr_repo_root` and `hr_main_repo` calls are on its own main checkout, class (a). It is not edited.

**Depends on:** Task 1. This task calls only helpers that already ship in `cli/templates/scripts/lib/harness-run-lib.sh` — `hr_wrapper_main_of <script_dir>`, `hr_wrapper_target_check_var <main> <target>` (0, or 1 with `HR_TARGET_REFUSAL`) and `hr_worktree_dir <main> <branch>` — plus Task 1's `hr_git_env_drop`, which unsets the inherited `GIT_*` environment and is called first.

### Targets

- `cli/templates/scripts/cleanup-merged-worktrees.sh`
- `cli/test/cleanup-worktree-record.test.mjs` (new)

**Work:**

- [x] **Placement.**
  - Call `hr_git_env_drop` first after sourcing the library.
  - Place `main_top` with `hr_wrapper_main_of "$script_dir"`. When it fails, or differs from `main_repo` canonically, print `cleanup-merged-worktrees.sh: cannot place this script in a main checkout — removing no working copy` and exit 0. That is the script's existing contract for a refusal: nothing deleted, exit 0.
- [x] **The removal guard:** the first table row's rule, applied before `worktree remove --force` and in the `--dry-run` line alike, as `[dry-run] would skip …`. The skip line is `cleanup-merged-worktrees.sh: skip removing $wt for '$branch' — it is not that branch's working copy as this repository derives it (<reason>)`. The branch deletion that follows is unchanged. Update the header with the rule, the reason and a REPRO row.
- [x] **`cli/test/cleanup-worktree-record.test.mjs`.** It opens with the rule it enforces: *the sweep removes a directory only when it is the gone branch's own derived working copy and a worktree the main repository lists*. It drives the `init`-written script against a fixture with a bare origin, where the gone branch's remote ref is deleted. The cases:
  - **(C1) Honest:** the gone branch's own copy is removed and its branch deleted.
  - **(C2) Rewritten record `gitdir`, victim outside:** the record points at a victim directory outside the fixture that holds a sentinel file. The victim and its sentinel survive, and the skip line names it. Both guards refuse it: the victim is neither a listed worktree's real top nor the derived path.
  - **(C3) Rewritten record `gitdir`, victim at the derived path** — the case that reaches the target check alone. Move the gone branch's real copy away from the derived path. Put the victim there instead: a plain directory, with no `.git` pointer, holding the sentinel, at exactly the path `hr_worktree_dir "$main_repo" "<gone branch>"` prints. Rewrite the record's `gitdir` to `<that path>/.git`. The derived-path equality now passes, and only `hr_wrapper_target_check_var` refuses. The victim and its sentinel survive, and the skip line names it.
  - **(C4) Rewritten `HEAD`:** a second, live copy's record `HEAD` is rewritten to `ref: refs/heads/<gone branch>`. That copy survives.
- [x] **A `RED ONCE` block in the test file's header, one line per case.** Apply each once, run the file, record the failing assertion, and revert.
  - **(C1)** make the guard skip every copy → the honest copy survives, so the "removed" assertion fails.
  - **(C2)** drop both the target check and the derived-path equality → the outside victim is deleted.
  - **(C3)** drop the target check alone → the victim at the derived path is deleted.
  - **(C4)** drop the derived-path equality alone → the live copy is deleted.

  **A mutation that leaves its case green:** check by hand that the fixture reaches the guard it names (for (C3), that `worktree list` prints the derived path for the rewritten record), and fix the fixture. Never drop a line.

**Verification:**

- `npm test --workspace cli -- test/cleanup-worktree-record.test.mjs` passes, and both `RED ONCE` mutations were run and observed failing as recorded.
- `bash -n cli/templates/scripts/cleanup-merged-worktrees.sh` exits 0.
- **Deviations from plan:**
  - (C2) and (C3) victims are not plain directories. Git's own `worktree remove --force` refuses a directory whose `.git` does not point back at the record (probed with `harness-runs/scratch/t8_probe.py` under git 2.50.1: `fatal: validation failed, cannot remove working tree: '<victim>/.git' does not exist`), so a plain victim leaves the (C2) and (C3) mutations green. Each victim's `.git` is instead a symbolic link to a gitfile `gitdir: <record>`: git follows it and removes the victim (same probe: rc 0, victim gone), and `hr_wrapper_target_check_var` refuses it (`its .git is not a regular pointer file`). In (C3) the record's `gitdir` already named `<derived>/.git` before the rewrite, because the moved copy was created there.
  - (C2) also asserts the `--dry-run` skip line, run after the real sweep so that the C2 mutation fails on the sentinel assertion first. The record survives the guarded sweep because `branch -D` refuses a branch a listed worktree still has out.
  - The test drives the `init`-written script (`runCli init` on a `createFixture` repository) and pushes its branches with `--no-verify`, because `init` installs a `pre-push` hook that refuses the default branch.
  - RED ONCE results, each mutation applied to `own_worktree_check` by `harness-runs/scratch/t8_mutate.py`, the file run with `npm test --workspace cli -- test/cleanup-worktree-record.test.mjs`, then reverted: (C1) `return 1` at the top → C1 fails `the gone branch's own copy was not removed`; (C2) both checks dropped → C2 fails `the outside victim's sentinel was deleted`, and C3 and C4 fail too; (C3) target check dropped → C3 fails `the victim at the derived path was deleted`, and C2 fails `the target check did not refuse`; (C4) derived-path equality dropped → C4 fails `the live copy was deleted`. After the revert: `# pass 4`, `# fail 0`.
