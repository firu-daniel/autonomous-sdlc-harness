Remove the legacy worktree arm. Run copies are clones only, with no backwards compatibility for a run made as a linked worktree.

## Why

Every run since `feat_clone_per_run_switch` uses a clone. The worktree arm still ships so a run started before that switch could finish. None is in flight: on 2026-11-07, no checkout that uses the harness had a legacy run in progress. In this repository's registry, the 11 records with no `copy_kind` are all `completed`, and none of their copies is on disk.

The harness has no known outside adopters.

#275 §7 decided on 2026-11-07 to close the legacy worktree rows rather than build a legacy run to measure them. That decision depends on this branch: the arm goes, so the rows describe nothing that ships.

## What goes

- **The wrappers' worktree arm.** `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` accept only the main checkout or a clone the registry records. "A worktree the main repository lists" is no longer an accepted target. A linked worktree is refused with the clone arm's refusal. This covers:
  - the target check's worktree branch (`hr_wrapper_target_check_var`);
  - the `worktrees/<name>/HEAD` branch read (`hr_wrapper_branch_var`);
  - the per-working-copy `config.worktree` check (`hr_worktree_config_check_var`), if a clone no longer needs it (a clone's planted `config.worktree` is already refused by the clone check);
  - the worktree side of `hr_copy_kind` and its callers.
- **The watcher's legacy path.** A registry record with no `copy_kind` no longer defaults to `worktree` (`autonomous-watcher.sh`, around the per-run profile render). The per-run profile's worktree-only entries go too, starting with the `.git` pointer.
- **The sweep's worktree arm.** `cleanup-merged-worktrees.sh` no longer removes a record with no `copy_kind` through `git worktree remove`.
- **The profile.** Drop the entries and comments that exist only for a legacy worktree record. The main checkout's whole `.git` stays write-denied, because it protects the clone layout too.
- **Tests.** Delete or rewrite the suites that exercise the worktree arm: `run-copy-migration.test.mjs`, `cleanup-worktree-record.test.mjs`, `push-branch-worktree-config.test.mjs`, `refresh-branch-worktree-config.test.mjs` and the worktree cases elsewhere. Each refusal gets a test with a linked worktree as the target.
- **Docs.**
  - `docs/cli.md` §6: the legacy worktree sentences go, including residual 1's item 3. One sentence states that the worktree arm was removed and a linked worktree is refused.
  - `docs/watcher.md`: remove `### Migration: both layouts until no worktree run is left`.
  - `docs/sandbox-verification.md` §2 and §3: CS5, CW1, CW2's worktree form, the `config.worktree` arms of C2, K2 and CW4, G1, G4, G7 and WR2–WR4 are marked closed, with the reason, rather than `not run — owed`. Rows that recorded a past measurement stay as history and are marked as describing a removed layout.
  - The script headers that describe the worktree case (`commit-on-branch.sh` → WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX, among others).

## Registry records with no `copy_kind`

After this branch, a record with no `copy_kind` names no arm. Decide one of these, and test it:
- the watcher and the sweep skip it with a one-line note;
- or a one-time prune removes `completed` records with no `copy_kind`.

In either case, it is never treated as a clone, and nothing errors on it.

## What stays

- The script names `create-worktree.sh`, `setup-worktree.sh` and `cleanup-merged-worktrees.sh`, and the registry's `worktree` field. Renaming them touches every adopter's profile and every flow that spells them, so it is not part of this branch.
- `git worktree list` checks that guard something other than a run copy, such as the sync-in refusal of a branch a worktree of the main checkout has checked out. A person can still make a linked worktree by hand.

## Check before removing

- Does anything other than a legacy run send a linked worktree to the wrappers? A hand-made `git worktree add` copy that calls `commit-on-branch.sh --repo <wt>` would be refused after this branch. Plain `git commit` in such a copy is unaffected. If something relies on the wrappers accepting a copy like that, say what and keep it working.

## Done when

- No code path accepts a linked worktree as a run copy.
- The tests named above are gone or rewritten, and the suite passes.
- The documents above no longer describe a worktree arm that ships.

## After merge, by hand

This repository's own outer-loop scripts under `scripts/` are self-adopted copies, and a run does not rewrite them: this branch changes only `cli/templates/scripts/`. The branch's closing summary states that after merge, the self-adopted copies need a forced self-adopt `init` re-render by hand.
