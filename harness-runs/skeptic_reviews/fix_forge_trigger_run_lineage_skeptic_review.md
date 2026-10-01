# Skeptic Review: fix_forge_trigger_run_lineage

## Context

**Branch:** `fix_forge_trigger_run_lineage`
**Date:** 2026-10-01
**Reviewed:** an adversarial second pass over the whole branch diff against `dev` (20 files). 24 run-artifact files were excluded from the reviewed diff. The pass covered:
- the `headSha` lineage bound (`lineage_commits_var`, `previous_bundle_run`, `verb_restore`);
- the trigger comment's `headSha` lookup (`trigger_run_url`, and the `refs/remotes/origin/<branch>` read in `verb_trigger`);
- the run-history "taken" reason (`hr_branch_run_history`, `hr_branch_taken_judge`, `hr_derive_branch`);
- `hr_scratch_path_var` and both of its callers;
- the `remote-github` / `forge` doctor changes;
- the four `branch-*` commands' scratch sequence, followed end to end through every `remote-run.sh` verb they invoke;
- Gate 12 (xiii) leg (d) and the other documents of record.

The pass was de-duplicated against the committed code review `harness-runs/code_reviews/fix_forge_trigger_run_lineage_code_review.md` and its four findings, the architecture review `harness-runs/architecture_reviews/fix_forge_trigger_run_lineage/review_0.md`, and the lessons ledger. No parity review exists because `phases.parity` is `false`, and no architecture branch review exists for this branch.

**Headline.** The lineage bound, the trigger lookup and the run-history probe hold up under adversarial reading:
- The job checks out with `fetch-depth: 0`, so `origin/<defaultBranch>..HEAD` is complete.
- `trigger_run_url` reads the remote-tracking ref that `start`'s `hr_push_landed` already requires.
- Each new shell function has a live caller.

One net-new defect remains, and it is in the scratch-directory change. `branch-answer` now passes a repo-relative `--answers-from`. `dispatch` resolves that path against the main checkout rather than the caller's checkout, so the answer route fails in every linked-worktree session.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Resolve a relative `dispatch --answers-from` against the caller's directory, as `--review-file` already is _(layer: cli)_

---

## Must Fix

### 1. `branch-answer`'s GitHub route now passes a relative `--answers-from`, which `dispatch` resolves against the main checkout, so in a linked-worktree session no answer is ever sent
→ [finding_1.md](fix_forge_trigger_run_lineage_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Intentional divergences (call-outs, not fixes)

- **The lineage bound uses `headSha`, where the task prompt suggested `createdAt`.** The prompt presents its approaches as candidates and asks for a better one, so this is not a divergence from an instruction. Both legs of the test hold:
  - **Leg 1.** The prompt's own fork-point variant is wrong on a default branch that has been reset, as Gate 12's has, so the bound does not drop an intended slice.
  - **Leg 2.** No sibling lookup in `remote-run.sh` sets a conflicting convention. The pause check's `createdAt` bound measures a different thing: a marker created after a known run.
- **One edge for the user to confirm.** Suppose a branch's own commits reach `origin/<defaultBranch>` through a **merge commit**, and work then continues on the same branch. Its earlier own runs fall outside `origin/<defaultBranch>..HEAD` and are skipped, so that restore starts as a first job. The story plan accepts this outright ("Commits that were merged into the default branch are excluded by the range"). It is not filed as a finding.
