# Code Review: fix_registry_write_race

## Context

**Branch:** `fix_registry_write_race`
**Date:** 2026-09-28
**Reviewed:** the whole branch diff against `dev`, which covers 14 files. By task:

- **Task 1:** the locked multi-key `hr_registry_set`, the atomic `hr_registry_init` and the new `cli/test/registry-writer.test.mjs`.
- **Task 2:** paired writes and tag-before-`PAUSE` ordering in `autonomous-watcher.sh`.
- **Task 3:** `remote-run.sh`'s batched `set_many_or_fail`.
- **Tasks 4 and 5:** `usage_resume_at_var`'s lost-reset repair and the job-mode in-job wait bound, with the new `cli/test/watcher-usage-resume.test.mjs` and the new job-mode cases.
- **Task 6:** `--test-timeout=300000`, `runBash`'s process-group bound and `cli/test/test-timeout.test.mjs`.
- **Task 7:** the job-suite bounds and the `HARNESS_JOB_USAGE_REPEAT` seam.
- **Task 8:** the `docs/` and `autonomous_logs/README.md` edits.

14 run-artifact files were excluded from the reviewed diff.

**Headline conclusions:**

- **Race closed on the main path.** The root cause is closed there: every registry writer in `cli/templates/scripts/` goes through the one library writer, the temp file now sits beside the registry, and every tag or reason is written before its `PAUSE`.
- **Lost values handled.** The lost-value handling separates a lost `usage_resume_at` from a legitimately empty one by `paused_by`, as the story plan requires. It never gives a hand pause a time. It bounds the local launch hold and the job's in-job wait.
- **Tests present.** Every accompanying test the prompt's acceptance criteria name is present. Whether they pass is for the Run gates phase to establish, because this review runs no suite.
- **Documents of record.** The `general` layer's `docs/` edits conform to `.claude/context/conventions.md` → `## Documents of record`, whose first rule is that a measured fact states what was measured, the command and the exact message. The *"under Node 20.19.5"* behaviour in `docs/development.md` names its Node version and the test that reproduces it, `cli/test/test-timeout.test.mjs`. The `HARNESS_JOB_USAGE_REPEAT` paragraph states its command and what a pass and a failure print. It claims no figure: it says *"Not yet measured."*
- **Lessons ledger.** The branch conforms to the `harness-runs/lessons.md` entries that apply: the repeat seam is opt-in and behind an environment variable, the figure is left to be taken by hand, and every retry in the new paths is bounded.
- **Parity.** `phases.parity` is `false`, so no parity review ran.
- **Pass 2.** Pass 2 found no per-unit review folder under `harness-runs/task_plan_point_reviews/fix_registry_write_race_task_plan/`, so its reconciliation was a no-op.

Two findings remain:

- **Finding 1**, the one Must Fix: any number of waiters can break one stale lock at once, and a breaker can rename a lock another waiter has re-taken. Two writers then hold the lock at once and one write is lost. This is the plan's named top risk.
- **Finding 2**, a header rule the three reused-key reset blocks do not yet satisfy.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Clear `paused_by` and `usage_resume_at` in one `registry_set` call in `launch_run`, `launch_remote_run` and `run_job`'s fresh-launch defaults. _(layer: cli)_
2. [ ] **Finding 1** — In `hr_registry_lock`, serialize stale-lock breakers behind `<file>.lock.break` and judge the age again under it. Amend the section comment and add cases `(e)` and `(f)`. _(layer: cli)_

---

## Must Fix

### 1. Two waiters can break one stale lock together, rename a lock one of them has re-taken, and lose a write
→ [finding_1.md](fix_registry_write_race_code_review/finding_1.md)

---

## Should Fix

### 2. Three reset blocks still clear `paused_by` and `usage_resume_at` in two writes, against the watcher header's "in one write"
→ [finding_2.md](fix_registry_write_race_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from, and this section carries no divergence call-outs.
