# Skeptic Review: feat_run_analytics

## Context

**Branch:** `feat_run_analytics`
**Date:** 2026-10-26
**Reviewed:** the whole branch diff against the default branch `dev`. The checkout has no local `dev` ref, so the diff base is `origin/dev`. The diff is 28 files. 22 run-artifact files were excluded from the reviewed diff. The review was adversarial and first-hand, from the diff hunks and targeted reads of:
- the three run-analytics files: `run-analytics.sh`, `lib/run-analytics.jq` and `lib/run-analytics-report.jq`;
- the watcher's `record_run_analytics` hook, traced through `watcher_commit`, `hr_commit_placed`, `hr_run_copy_check_var` and `hr_wrapper_target_check_var` for both the local arm and the job-mode arm;
- the `branch-status` digest after the code-review fix round;
- the `scripts/` mirror;
- the cited `THE SELF-PAUSE POINT, MEASURED` block in `harness-run.yml`.

**De-duplicated against:**
- `harness-runs/code_reviews/feat_run_analytics_code_review.md` and its four findings;
- `harness-runs/architecture_reviews/feat_run_analytics/review_0.md`.

No branch-level architecture review exists for this branch. `phases.parity` is `false`, so no parity review exists and check 2's parity leg did not run.

**Headline.** Two net-new Must Fix findings:
- This repository's own mirror of the script is committed non-executable, so the watcher's `! -x` guard skips every session here, locally and on GitHub.
- The code review's Finding 1 fix left the remote digest gated on the mirror's file, which is the file Finding 1 showed is never there. Its `git show` path also fails on the default `stateDir`'s trailing slash.

The other claims checked out:
- the job-mode commit path accepts the job checkout as its own main checkout;
- the commit never touches `rc`;
- the cited self-pause rule exists and says what the header claims.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else (sub-step bullets inside individual per-finding files) are informational progress markers for the implementer agent — they are NEVER the iteration source and the committer does NOT touch them.

Each entry resolves to a self-contained `harness-runs/skeptic_reviews/feat_run_analytics_skeptic_review/finding_<K>.md` file via its `**Finding K**` reference. Sorted lowest blast-radius first; the leading `N.` is the fix order and `K` is the finding's stable number.

1. [x] **Finding 1** — Commit this repository's `scripts/run-analytics.sh` mirror with its executable bit (`100755`) _(layer: general)_
2. [x] **Finding 2** — Rewrite the `branch-status` digest's lead-in so each arm reads its own source, and strip the trailing `/` from `<state_dir>` in the `git show` path _(layer: plugin)_

---

## Must Fix

### 1. This repository's own `scripts/run-analytics.sh` is committed without its executable bit, so the watcher records nothing here, locally or on GitHub
→ [finding_1.md](feat_run_analytics_skeptic_review/finding_1.md)

### 2. The `branch-status` digest's remote arm is still gated on the mirror's file, and its `git show` path breaks on the default `stateDir`
→ [finding_2.md](feat_run_analytics_skeptic_review/finding_2.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false`, so there is no reference implementation to diverge from.

- **Verified-OK: the job-mode commit path.** In a job, `<worktree>` is the job checkout and `RUN_MAIN` is that same checkout. `hr_wrapper_target_check_var` accepts a target equal to the main checkout (`HR_TARGET_KIND=main`), so `hr_commit_placed` commits there, and the workflow's `Push the branch` step, under `always()`, pushes it. This holds once Finding 1 is fixed for this repository.
- **Verified-OK: the citation in the `lib/run-analytics.jq` header.** The header says a tool_use or tool_result with no timestamp takes the nearest preceding one, "the rule harness-run.yml's THE SELF-PAUSE POINT, MEASURED states". That block does say so: "a tool_use event with no timestamp would inherit the nearest preceding one".
- **Verified-OK: the analytics commit leaves the park-loop guard alone.** That guard judges progress by question index and elapsed time, not by commits, so it is unaffected by the analytics commit.
