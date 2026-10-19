# Skeptic Review: feat_clone_per_run

## Context

**Branch:** `feat_clone_per_run`
**Date:** 2026-10-19
**Reviewed:** the whole branch diff against `dev`, 23 files. In `cli/templates/scripts/lib/harness-run-lib.sh`, that covers:
- the clone trust check and its `.git/config` allow-list;
- the sync pair;
- creation, removal and the registry's drop and restore;
- the watcher family's clone arm.

It also covers the clone arm of `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh` and `setup-worktree.sh --target`; the registry's write protection and its constants in `cli/src/generators/`; the new and edited suites under `cli/test/`; `docs/cli.md`, `docs/watcher.md` and `docs/sandbox-verification.md`; and the re-rendered worked example. 36 run-artifact files were excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/feat_clone_per_run_code_review.md` (findings 1–7) and `harness-runs/architecture_branch_reviews/feat_clone_per_run_arch_review.md` (findings 1–2). `phases.parity` is `false`, so there is no parity review and check 2's parity leg did not run.

**What was checked first-hand:**
- **Wiring.** `hr_clone_create_var`, `hr_clone_remove_var` and `hr_registry_drop` have no caller outside the tests. That matches task prompt goal 6, *"`create-worktree.sh` does **not** call this yet"*. Every other new function and global has a caller on its path. One exception: `HR_SYNC_TIP` is read only by the tests, because the copy check re-reads the ref instead.
- **Ordering.** Every wrapper's sync-in runs after its protected-branch decision. `hr_commit_paths_var` takes `HR_RUN_MAIN` from its own `hr_run_main_set_var` call before it syncs out.
- **Citations.** The cited rows CL5 and RG1–RG3, and `docs/cli.md`'s *measured fetch pins*, exist and say what the code claims.

**Headline:** no Must Fix. There are two Should Fix findings:
- The clone allow-list cannot describe a SHA-256 repository, so creation always fails there. Reproduced on a temp fixture, and the proposed fix verified on a scratch copy of the library.
- A third statement of the "no re-read of the clone" claim, which code-review finding 4 did not reach.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Name sync-in's and sync-out's reads of the clone in `docs/watcher.md`'s **The pins.** sentence about clones _(layer: general)_
2. [ ] **Finding 1** — List `extensions.objectformat` (with `core.repositoryformatversion` `=1`) in the clone allow-list when the main checkout names one, and write it on creation _(layer: cli)_

---

## Must Fix

None.

---

## Should Fix

### 1. The clone allow-list pins `core.repositoryformatversion` to `0` and has no `extensions.objectformat`, so a SHA-256 main checkout can never get a clone
→ [finding_1.md](feat_clone_per_run_skeptic_review/finding_1.md)

### 2. `docs/watcher.md`'s **The pins.** says no call on a clone reads the clone's object store or `.git/config`, though sync-in and sync-out do
→ [finding_2.md](feat_clone_per_run_skeptic_review/finding_2.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. No divergence the plan or the code marks intentional failed check 4's precedent leg. Skipping `hr_worktree_config_check_var` on the clone arm holds, because the clone conditions refuse `config.worktree` and the allow-list refuses `extensions.worktreeConfig`.
