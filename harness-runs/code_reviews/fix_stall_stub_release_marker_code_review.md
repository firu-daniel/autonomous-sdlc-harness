# Code Review: fix_stall_stub_release_marker

## Context

**Branch:** `fix_stall_stub_release_marker`
**Date:** 2026-11-04
**Reviewed:** the whole branch diff against the default branch `dev`. This run copy has no local `dev` ref, so the diff base was `origin/dev`. Four files changed. `cli/test/helpers/watcher.mjs` gains the shared release-aware `HUNG_BODY` (`hungBody`), `HUNG_RELEASE` / `HUNG_RELEASE_MISSED`, the scaled `HUNG_RELEASE_BOUND_SECS`, the job-mode trigger `stallVerdictNotified`, `assertHungReleased`, and choice 7 in its header (Task 1). `cli/test/helpers/timing.mjs` drops the old `sleep 60` from its fixed-bounds list. `cli/test/watcher-stall-reset-payloads.test.mjs` adds the release after the second `tick` in `localStall` and the notification-poll trigger in `jobStall` through `stalled()` (Task 2). `cli/test/watcher-placeholder-host.test.mjs` makes the same changes in `stalledPass` and in `jobFixture` → `job` (Task 3). 6 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** The mechanism matches the story index.
- **The release lands after the watchdog acts.** Each release follows an event that comes strictly after the watchdog's kill: the end of the second `tick`, or the `failed` / `resumed` notification. I checked this against `cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs`. Both `notify failed … "(stall-watchdog: $why)"` call sites and the closing `notify resumed … "(stall-watchdog restart #…)"` come after `kill -9 "$pid"`. The recorder writes `$1`, `$2` and `${4-}`, which is the shape `stallVerdictNotified` reads.
- **The bound and the release check are wired into every hung-stub case.** Every case that sets `HUNG_BODY` goes through `stalled()`, `stalledPass` or `job` with a plant. Each calls `assertHungReleased` before its status assertion and before any of the case's own assertions. No private `HUNG_BODY` copy and no `sleep 60` is left in the tree.
- **The two `sleep 30` suites were correctly left alone.** `watcher-remote-job.test.mjs` and `watcher-remote-park-sequence.test.mjs` spawn with `detached: true` and `stdio: 'ignore'`, and they end the job with `process.kill(-child.pid, 'SIGKILL')`. So they hold no test pipe and do not depend on `pgrep`.
- **Exports and tests.** Every new export is either imported by a suite or is a planned Task 1 export used inside its own module. No test runs were owed or taken in this review. Run gates establishes whether the suites pass. Parity is off (`phases.parity` is `false`).

Two Should Fix findings remain, both about comment text. Pass 2 found no per-unit review folder at the supplied `per_task_findings_root`, so it carried nothing over.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Drop the in-session "about 13 s" figure from the stall-reset header's `(release)` mutation entry _(layer: cli)_
2. [ ] **Finding 1** — Correct `HUNG_RELEASE_BOUND_SECS`'s "never below 60 s" claim and state its reason instead of citing the task prompt _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `HUNG_RELEASE_BOUND_SECS`'s doc comment says the bound is never below 60 s, which is false at a time scale below 2/3, and it cites "the task prompt", which a reader of the code cannot find
→ [finding_1.md](fix_stall_stub_release_marker_code_review/finding_1.md)

### 2. The `(release)` mutation entry in the stall-reset header records an in-session wall-clock figure ("about 13 s") that no reader acts on
→ [finding_2.md](fix_stall_stub_release_marker_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
