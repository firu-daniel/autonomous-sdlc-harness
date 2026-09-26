# User-Review Fix Plan: chore_test_suite_run_time

## Context

**Branch:** `chore_test_suite_run_time`
**Source user review:** `harness-runs/user_reviews/chore_test_suite_run_time_review.md`
**Summary:** The user flagged one observation. Gate 4's run-time record in `docs/development.md` was measured inside a headless run on a loaded machine, so it overstates the gain at about 2×. The user re-measured by hand on a free machine (about a third) and asks that the record carry those figures, one run per side, with the reason written down.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only. The committer never touches them.

Each entry resolves to a self-contained `harness-runs/user_reviews/chore_test_suite_run_time_fix_plan/finding_<K>.md` file through its `**Finding K**` reference. Entries are sorted from lowest blast radius first to wider refactors last.

1. [x] **Finding 1** — Replace Gate 4's host run-time row with the user's hand-measured figures (`npm test` 170 s → 118 s, `run-gates.sh` 208 s → 135 s). Update the provenance (date, Node v22.23.2, `--runs 1`, after at branch `HEAD`), and record why one run per side, taken outside any headless session, is deliberate. _(layer: general)_

---

## Must Fix

### 1. Gate 4's host run-time row was measured on a loaded machine and overstates the gain
→ [finding_1.md](chore_test_suite_run_time_fix_plan/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

- **Observation 1, last paragraph: the `11 docs-retrieval relevance floor` gate failure.** The user states it is not a finding on this branch. Confirmed: `docs/development.md` Gate 4 already records it as failing identically at `fe17b4e2293f` and at `HEAD`, and `harness-runs/improvement_observations/chore_test_suite_run_time.md` traces it to the machine-wide retrieval runtime. No change.
- **Observation 1: aligning Task 7's "three consecutive runs" wording.** This was a conditional request, and the condition does not hold. `git grep` finds "three consecutive" only in run artifacts (`harness-runs/task_prompts/chore_test_suite_run_time_task_prompt.md`, `harness-runs/task_plans/chore_test_suite_run_time/task_7_plan.md`, `task_4_plan.md`), never in `docs/` or another document of record. The only document-of-record trace of three runs is the `--runs 3` commands and the "All three after `npm test` runs exited 0" sentence, and Finding 1 replaces both.

---

## Source observations

Verbatim copy of `harness-runs/user_reviews/chore_test_suite_run_time_review.md`. The implement flow does not re-read the user-review file.

## 1. The gate-4 host figures were measured on a machine other sessions were loading, so they overstate the gain

`docs/development.md` → Gate 4 → **Run time, measured.** records the host row from runs taken inside the headless run, while other sessions were running their own test suites and processes on the same machine (the paragraph itself notes a 1-minute load of 20.86 before the before run). Those figures read as roughly 2× faster for `npm test` (376–494 s → 209–217 s). On a free machine the gain is about a third.

I re-measured both sides outside any headless session, with no other heavy process running, one run each, the before right after the after, from the branch worktree with the branch's own wrapper:

```
bash scripts/measure-suite.sh --runs 1
bash scripts/measure-suite.sh --ref fe17b4e2293f --runs 1
```

Host: Darwin arm64, `os.availableParallelism()` 10, Node v22.23.2, git 2.50.1 (Apple Git-155). 1-minute load average 2.47 before the after run, 2.25 before the before run. Measured 2026-09-26. The script's own `measure-suite:` lines:

```
measure-suite: host cpus=10 ref=19417ce9a6c1 npm-test run 1/1: 117.83 s, exit 0
measure-suite: host cpus=10 ref=19417ce9a6c1 run-gates run 1/1: 135.32 s, exit 1
  run-gates: 1 failed, 19 passed
measure-suite: host cpus=10 ref=fe17b4e2293f npm-test run 1/1: 170.48 s, exit 0
measure-suite: host cpus=10 ref=fe17b4e2293f run-gates run 1/1: 208.22 s, exit 1
  run-gates: 1 failed, 19 passed
    - 11 docs-retrieval relevance floor
```

`19417ce9a6c1` was the branch's `HEAD` at the time (`chore: Flow progress D for chore_test_suite_run_time`).

Replace the host row with these figures: `npm test` 170 s → 118 s (−31%), `run-gates.sh` 208 s → 135 s (−35%). Update the provenance around it to match: the date, the Node version (the record says v20.19.5; these were taken on v22.23.2), the `--runs 1` commands, and the after column's commit — say it was measured at the branch's `HEAD` rather than naming a branch-only SHA, which the squash merge drops (the code review's Finding 1). Replace the "Read the host row as a range, not a point…" paragraph's load explanation with the reason below. Keep the "nothing was lost" test-count evidence as it is.

**One run per side is deliberate; do not re-measure and do not require three runs.** Record why in the document: a measurement taken inside a harness session is unstable and unpredictable, because other sessions can be running their own tests and other processes on the same machine at the same time, and the session that runs the measurement adds to the load itself. So the recorded figures are taken by hand, outside any headless session, on a machine with no other heavy process running — and repeating them inside a run would not make them more trustworthy. Align Task 7's acceptance wording (three consecutive runs) in the plan artifacts with this if it is quoted anywhere in the document of record.

The one failing gate on both sides is the same and pre-exists the branch: `11 docs-retrieval relevance floor`, because the machine-wide retrieval runtime does not match the local version. It is not a finding on this branch and needs no change here.
