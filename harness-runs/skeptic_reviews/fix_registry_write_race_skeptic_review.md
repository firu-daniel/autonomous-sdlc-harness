# Skeptic Review: fix_registry_write_race

## Context

**Branch:** `fix_registry_write_race`
**Date:** 2026-09-28
**Reviewed:** the whole branch diff against `dev`, 14 files, reviewed adversarially and first-hand:

- the locked, multi-key `hr_registry_set` and the atomic `hr_registry_init` in `cli/templates/scripts/lib/harness-run-lib.sh`, including the serialized stale-lock breaker that code-review Finding 1 added;
- the watcher's paired writes, its tag-before-`PAUSE` ordering, `usage_resume_at_var`'s lost-reset repair and the in-job wait bound in `cli/templates/scripts/autonomous-watcher.sh`;
- `remote-run.sh`'s `set_many_or_fail` and its batched `stop`;
- the test-timeout and `runBash` process-group bound;
- the new and changed suites;
- the `docs/` edits.

18 run-artifact files were excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_registry_write_race_code_review.md` and its two findings, both now applied. No architecture review exists for this branch, and `phases.parity` is `false`, so no parity review ran and check 2's parity leg is inert. `harness-runs/lessons.md` entries are out of scope unless escalated. None is.

**What was verified and holds:**

- **Check 1 (wiring).** Every new writer path is reached:
  - `hr_registry_lock` / `hr_registry_unlock` from `hr_registry_set`;
  - `usage_resume_at_var` from both `usage_gate`'s local resume side and `job_usage_wait_ok`;
  - `USAGE_FALLBACK_RESUME_SECS` at both fallback sites;
  - `set_many_or_fail` from every `verb_sync` outcome.

  A grep over `cli/`, `plugin/` and the root found no registry writer that bypasses the library.
- **Race closure by construction.** The gate writes `paused_by` and `usage_resume_at` in one call before `PAUSE`. `classify_run_exit` writes `pause_reason` and `status` in one call. The lock serializes them.
- **Check 3 (citations).** The quoted lessons-ledger rule in the job suite's header exists verbatim.

**Headline:** no Must Fix. There are two Should Fix items:

- **Finding 1:** the new in-job wait bound does not allow for the usage gate's own throttle. A `REMOTE_WAIT_MAX_SECS` below about 75 s therefore ends waits that were about to resume, with a false notification.
- **Finding 2:** a document-of-record claim about Node's `--test-timeout` cites a test that never reaches that timeout.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Reword `docs/development.md`'s hung-case paragraph so it no longer cites `cli/test/test-timeout.test.mjs` as proof of the `--test-timeout` behaviour, and name the one unbounded job-suite case. _(layer: general)_
2. [ ] **Finding 1** — Measure the in-job usage wait's bound from the gate's last chance to resume (`+ USAGE_CHECK_INTERVAL_SECS + POLL_INTERVAL_SECS`), and amend the watcher header and `docs/remote-execution.md` to match. _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The in-job usage wait's bound ignores the gate's throttle, so any `REMOTE_WAIT_MAX_SECS` under about 75 s ends a wait that was about to resume
→ [finding_1.md](fix_registry_write_race_skeptic_review/finding_1.md)

### 2. `docs/development.md` cites `cli/test/test-timeout.test.mjs` as proof of a `--test-timeout` behaviour the test never reaches
→ [finding_2.md](fix_registry_write_race_skeptic_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from. The one divergence the story plan declares was re-graded and holds: finding 2 of the task prompt offered re-deriving the lost reset time from the stream, and the plan declined it. After a pause the stream holds only the pre-pause events the gate already read, and `usage_assess` skips every record that is not `running`. The gate's own one-hour fallback is the precedent the repair reuses.
