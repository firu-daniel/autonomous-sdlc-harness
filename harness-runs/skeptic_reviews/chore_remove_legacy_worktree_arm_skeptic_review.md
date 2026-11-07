# Skeptic Review: chore_remove_legacy_worktree_arm

## Context

**Branch:** `chore_remove_legacy_worktree_arm`
**Date:** 2026-11-07
**Diff base:** `dev`. This checkout has no local `dev` branch, so the base resolved to the remote-tracking ref `origin/dev`.

**Reviewed:** the whole branch diff, 37 files (529 insertions, 881 deletions), adversarially. 27 run-artifact files excluded from the reviewed diff.

The review covered:

- the run library's new `hr_run_target_check_var` and its three callers;
- the watcher's no-`copy_kind` skip and its `clone`-only per-run profile, plus the launch backstop;
- the sweep's skip arm;
- the reworded wrapper headers;
- the `cli/src` comments;
- the test rewrites;
- the three plugin commit clauses;
- the docs.

**De-duplicated against:**

- `harness-runs/code_reviews/chore_remove_legacy_worktree_arm_code_review.md` and its Findings 1 and 2;
- `harness-runs/architecture_branch_reviews/chore_remove_legacy_worktree_arm_arch_review.md` and its Finding 1 (the notes-app render);
- `harness-runs/lessons.md`.

No parity review exists, because `phases.parity` is `false`.

**What was verified first-hand:**

- **The decision behind the scope deviation.** The plan departs from the task prompt's "A linked worktree is refused" for the three git wrappers. That departure is authorized: `harness-runs/clarifications/chore_remove_legacy_worktree_arm/answered/answer_1.md` reads "Q1: Option A …". It also confirms that only CS5 is closed and that the other sandbox rows are re-targeted at a hand-made worktree, which `docs/sandbox-verification.md` now carries.
- **Every caller of the new check.** `hr_run_target_check_var` is reached from `hr_run_copy_check_var`, `launch-sandboxed-gates.sh` check 6 and `setup-worktree.sh --target`.
- **The launch backstop's claim.** The `spawn_engine` backstop says every caller skips a record with no `copy_kind` or has it refused first. That holds:
  - the parked and paused resumes call `record_has_no_copy_kind`;
  - the review-reuse path and the stall watchdog go through `hr_run_copy_check_var`;
  - every fresh or recreated copy gets `copy_kind` `clone` from `hr_clone_create_var`;
  - job mode bypasses the backstop.
- **The removed git command.** No shipped template still runs `git worktree remove`.

**Headline conclusion.** One net-new finding, a Should Fix: a wrong claim in the new function's doc comment. No Must Fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Correct `hr_run_target_check_var`'s doc comment: its clone acceptance reads the run registry through `hr_clone_target_check_var` _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `hr_run_target_check_var`'s doc comment says it reads no run registry, but its clone acceptance is a registry read
→ [finding_1.md](chore_remove_legacy_worktree_arm_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from.

**Call-out: an intentional divergence from the task prompt.** The three git wrappers, `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`, still accept a linked worktree that a person made by hand. The task prompt said such a worktree is refused. The user chose this in clarification park 1, Option A, and the answer file says so verbatim. Every path that treats a linked worktree as a run copy now refuses it or skips it. This is listed so the user can confirm it. It is not a fix.
