# Architecture review — chore_remove_legacy_worktree_arm

## Context

- **Branch and date:** `chore_remove_legacy_worktree_arm`, reviewed 2026-11-07, implemented-solution mode, iteration 0.
- **Diff base:** `dev`. `dev` has no local branch in this checkout, so it was resolved to its remote-tracking ref `origin/dev`.
- **What was reviewed:** 37 files (525 insertions, 877 deletions), grouped into five segments:
  - `cli/src` comment and doctor-message rewording;
  - the outer-loop script templates and their run library under `cli/templates/scripts/`, including the new `hr_run_target_check_var`;
  - the `cli/test` suites, with two suites deleted;
  - three `plugin/instructions` commit-instruction clauses;
  - the `docs/` documents of record.
- **Run-artifact exclusion:** 22 run-artifact files excluded from the reviewed diff.

**Headline conclusion.** The layering holds.

- Every change sits in the layer its tag names.
- The rule "a linked worktree is never a run copy" has one owner: `hr_run_target_check_var` in the shared run library `cli/templates/scripts/lib/harness-run-lib.sh`. The run-copy check and the two direct-target scripts (`launch-sandboxed-gates.sh` and `setup-worktree.sh --target`) call it; none of them re-derives it.
- No module or shell asset reaches across the `cli`/`plugin` boundary.
- Each new refusal and skip lands with its own test case.

One accompanying-set item is missing. The `examples/notes-app` rendered profile was not re-rendered alongside the token-carrying template change; Task 10 was dispositioned on a tool-layer refusal.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — The notes-app example's rendered profile was not re-rendered with the token-carrying template it is rendered from _(layer: general)_

## Must Fix

### 1. The notes-app example's rendered profile was not re-rendered with the token-carrying template it is rendered from
→ [finding_1.md](chore_remove_legacy_worktree_arm_arch_review/finding_1.md)
