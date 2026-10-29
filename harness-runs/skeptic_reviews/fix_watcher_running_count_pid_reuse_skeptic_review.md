# Skeptic Review: fix_watcher_running_count_pid_reuse

## Context

**Branch:** `fix_watcher_running_count_pid_reuse`. **Date:** 2026-10-28. **Reviewed:** the whole branch diff against `dev`. The diff was taken against `origin/dev`, because this checkout has no local `dev` ref. It covers 11 files: the `running_count` status filter and the terminal-write `pid ""` clears in `cli/templates/scripts/autonomous-watcher.sh`, the `remote-run.sh stop` clear, the doctor comment corrections, the root copies (byte-identical to their templates by `cmp`), PD19's follow-up cell, and the new and edited tests under `cli/test/`. 12 run-artifact files excluded from the reviewed diff. **De-duplicated against:** `harness-runs/code_reviews/fix_watcher_running_count_pid_reuse_code_review.md` and its `finding_1.md` (the `spawn_refused` two-write form, since fixed). No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch.

**Headline conclusion.** The runtime fix holds up under adversarial checking:
- **Check 1 (callers).** `running_count` is reached from every capacity read: the idle report, the park-resume and pause-resume gates, and `process_inbox_file`.
- **Status-before-pid ordering.** It holds on every launch and resume path, so the filter cannot count out a run being launched.
- **Terminal writers.** Every local writer of a terminal status now clears `pid` in the same write. The one exception is `launch_remote_run`'s `status failed`, which is on a remote record that has no pid.
- **Goal 4 audit.** Re-run first-hand, it holds: every other `kill -0` on a registry pid is gated on `status = running` first.

The one net-new finding is in the tests. The two cases titled "drops its pid", which are the only ones that drive `classify_run_exit`'s terminal writes, pass unchanged if that `pid ""` is reverted.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Make the resumed-run pid-drop tests fail when `classify_run_exit`'s `pid ""` is reverted _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The two "resumed run ... drops its pid" tests pass with `classify_run_exit`'s `pid ""` reverted
→ [finding_1.md](fix_watcher_running_count_pid_reuse_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference divergence to re-grade. The story plan names one known limit and leaves it out of scope: a `running` record whose process died while the watcher was down, and whose pid was then reused, still reads as live. That is pre-existing. Note that `check_stalled_runs` sends `kill -9` to such a pid after the status gate, so the limit could reach an unrelated process, not only a slot count. It is recorded here for the user to weigh, not as a fix for this branch.
