# Code Review: chore_remove_legacy_worktree_arm

## Context

**Branch:** `chore_remove_legacy_worktree_arm`
**Date:** 2026-11-07
**Diff base:** `dev`. This checkout has no local `dev` branch, so the base resolved to the remote-tracking ref `origin/dev`.

**Reviewed:** the whole branch diff, 37 files (525 insertions, 877 deletions), in five segments:

- the run library and the outer-loop script templates under `cli/templates/scripts/`: the new `hr_run_target_check_var`, the run-copy check calling it, the gate launcher's and `setup-worktree.sh --target`'s switch to it, the watcher's skip of a record with no `copy_kind` plus its `clone`-only per-run profile and launch backstop, the sweep's removed `git worktree remove` arm and its skip line, and the reworded wrapper headers;
- the `cli/src` comment and `doctor` message rewording, and the autonomous profile template;
- the `cli/test` suites, with two deleted (`run-copy-migration.test.mjs`, `cleanup-worktree-record.test.mjs`);
- the three `plugin/instructions` commit clauses;
- the `docs/` documents of record.

24 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**

- **No code path accepts a linked worktree as a run copy.** `hr_run_target_check_var` is the only place the rule lives. `hr_run_copy_check_var` calls it, and so do `launch-sandboxed-gates.sh` check 6 and `setup-worktree.sh --target`. The watcher renders a `clone`-only per-run profile and refuses any other kind at launch. The sweep removes only a clone.
- **Option A holds.** The three git wrappers still accept a linked worktree a person made by hand, and their prose now says so.
- **A record with no `copy_kind` is skipped.** The watcher's parked and paused resumes and the sweep skip it with a one-line note. Nothing writes to the registry for it and nothing errors on it.
- **Every new refusal and skip has its own case:**
  - `run-copy-clone-arm.test.mjs` (i);
  - `launch-sandboxed-gates.test.mjs` (u);
  - `setup-worktree-clone-target.test.mjs` (c) and `setup-worktree-checkout-sparse.test.mjs` (e);
  - the two `watcher-run-profile.test.mjs` skip cases;
  - the `cleanup-run-copies.test.mjs` no-`copy_kind` case;
  - `watcher-review-drop-payloads.test.mjs` (W1);
  - `remote-review-payloads.test.mjs` (M5).
- **Nothing still references the deleted suites**, and the scope register's derivation entry 1, re-run, reaches only rows it already lists.
- **Not established here:** whether the tests pass. That belongs to the Run gates phase, because this review runs no suite.
- **No parity check.** `phases.parity` is `false`.

**Pass 2:** the per-unit findings root (`harness-runs/task_plan_point_reviews/chore_remove_legacy_worktree_arm_task_plan/`) does not exist, so nothing was carried over.

**Still outstanding, and not filed here:** `examples/notes-app/.claude/settings.autonomous.json` still carries the `in a legacy worktree run, it cannot write the linked worktree's record` clause. This branch changed that clause in the template the file is rendered from. The architecture review filed this as its Finding 1. Its fix was then dispositioned because the tool layer refuses an `Edit` under a `.claude/` path, and that finding file records the operator remedy. Filing it again here would send the fix loop into the same refusal, so it is left for a person.

The two findings below are what remains.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Update the run library's three stale comments: the module header's `setup-worktree.sh --target` check, and the "record's index" wording in `hr_run_worktree_diff_var` and `hr_run_surface_check_var` _(layer: cli)_
2. [ ] **Finding 2** — Drop the duplicate main-checkout `config.worktree` entry from `setup-worktree.sh --target`'s non-clone `sparse_files` arm _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The run library's comments still describe a linked worktree's record as a run copy's index, and name the wrong target check for `setup-worktree.sh --target`
→ [finding_1.md](chore_remove_legacy_worktree_arm_code_review/finding_1.md)

---

## Nice to Have

### 2. `setup-worktree.sh --target` still queues the main checkout's `config.worktree` twice in its non-clone arm, which only the main checkout reaches now
→ [finding_2.md](chore_remove_legacy_worktree_arm_code_review/finding_2.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
