# Skeptic Review: feat_clone_per_run_switch

## Context

**Branch:** `feat_clone_per_run_switch`
**Date:** 2026-10-20
**Reviewed:** the whole-branch diff against the configured default branch `dev`, `git diff dev...HEAD`: 50 files after the exclusion. Checked adversarially:

- **The run library:** `hr_copy_ref_swap_var`, sync-in's heal, `hr_run_copy_live_var`, the narrowed remote-ref set of `hr_clone_create_var` and `hr_run_profile_file`.
- **The three wrappers:** the clone-first swap and the verify-only pre-push check.
- **`create-worktree.sh`:** clone creation in all three modes, and its rollback.
- **The registry-driven `cleanup-merged-worktrees.sh`.**
- **`remote-run.sh`:** `start` and `review`.
- **The watcher:** its per-run profile, its launch check, its exit sync and the `spawn_refused` paths.
- **The write-protection generator** and `doctor`'s retired-entry grading.
- **The six `plugin/` files**, and the docs of record.

44 run-artifact files excluded from the reviewed diff.

**De-duplicated against** `harness-runs/code_reviews/feat_clone_per_run_switch_code_review.md` and its three findings: the `start` upstream section, the unanchored exit sync's log line, and `branch-prompt.md`'s run-copy name. No business-parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch. `harness-runs/lessons.md` was read as the earlier reviewers' routine checks.

**What was checked:**

- **Check 1, wiring.** Every new library function and generator export has a live caller.
- **Check 3, citations.** Every citation in the diff resolves: `hr_run_trusted_base_var` in the two Phase D cores; `docs/sandbox-verification.md` CL4, CL5 and CL6, which say what `writeProtection.ts` and the story claim; and `hr_copy_ref_swap_var` in the wrapper headers.
- **Check 4, divergences.** The two refs still moved main-first, `push-branch.sh`'s `origin/<branch>` mirror and `refresh-branch.sh`'s fetched base, are remote-tracking refs no run commits to. So the clone-first rule's reason does not reach them, and no sibling precedent moves one clone-first.

**Headline.** One net-new Must Fix. Sync-in's new heal fast-forwards a behind clone's ref and leaves its index and working tree at the old tip. That is safe only for the shape the heal tests construct. It is wrong for the shape that is still reachable: a branch moved in the main checkout. A clone is not a linked worktree, so git's own guard no longer stops that move.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else are informational and never the iteration source.

Each entry resolves to `harness-runs/skeptic_reviews/feat_clone_per_run_switch_skeptic_review/finding_<K>.md` through its `**Finding K**` reference.

1. [ ] **Finding 1** — Move a healed clone's index and working tree with its ref in `hr_copy_sync_in_var`, refusing with nothing moved when a file is in the way _(layer: cli, general)_

---

## Must Fix

### 1. Sync-in's heal moves only the clone's ref, so a clone left behind by a main-checkout move reads as reverting that move, and the next wrapper commit can write the revert
→ [finding_1.md](feat_clone_per_run_switch_skeptic_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. No divergence marked intentional survived as a call-out. The two main-first remote-tracking mirrors passed check 4 (Context above), and they are not fixes.
