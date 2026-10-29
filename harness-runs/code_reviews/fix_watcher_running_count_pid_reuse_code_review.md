# Code Review: fix_watcher_running_count_pid_reuse

## Context

**Branch:** `fix_watcher_running_count_pid_reuse`
**Date:** 2026-10-28
**Reviewed:** the whole branch diff against `dev` (`origin/dev`, merge base `2ace325d`; this checkout has no local `dev` ref). That covers the `running_count` status filter and the terminal-write `pid ""` clears in `cli/templates/scripts/autonomous-watcher.sh` (Task 1); the `remote-run.sh stop` pid clear, the refusal-4 probe cases in `cli/test/sandbox-probe-shell.test.mjs`, and the two corrected comments in `cli/src/doctor/checks.ts` and `cli/test/doctor.test.mjs` (Task 2); and the root copies `scripts/autonomous-watcher.sh` and `scripts/remote-run.sh` with PD19's follow-up cell in `docs/sandbox-verification.md` (Task 3). The tests come with them: the new `cli/test/watcher-running-count.test.mjs`, plus the edited `cli/test/remote-run.test.mjs` and `cli/test/watcher-remote-dispatch.test.mjs`. 9 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** The fix does what the task prompt asks.
- `running_count` now skips any record that is not `running` before its `kill -0`.
- Every terminal write a session or the watcher makes drops the `pid` in the same `registry_set` call as the status. Finding 1 is the one exception, and it is in a site the branch did not touch.
- `remote-run.sh stop` drops it the same way.
- The audit of the other `kill -0` sites on a registry pid holds when re-read: `reconcile_stale_runs`, `footprint_live_runs`, `keep_awake_pass`, `check_stalled_runs`, `process_inbox_file`'s duplicate test and `usage_running_alive` all test `status = running` first.
- No reader of a terminal record's `pid` is left (`print_status` only displays it), so leaving out a migration is sound.
- Both root copies are byte-identical to their templates (`cmp`), and no file mode changed.
- Every test goal 5 asks for is present: completed and failed records with a live child pid count 0, a running record with a live pid counts 1, and preflight refusal 4 passes on the first case and refuses on the second.

This review ran no suite. Whether the tests pass is for the Run gates phase to establish. Pass 0's grep half had no project regexes configured. Its caller check found no new exported symbol in the diff. Two-pass mode was requested, but the supplied `per_task_findings_root` (`harness-runs/task_plan_point_reviews/fix_watcher_running_count_pid_reuse_task_plan/`) does not exist, so Pass 2 carried nothing over. `phases.parity` is `false`, so no parity review ran.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Put `spawn_refused`'s `status failed` and `pid ""` into one `registry_set` call, in the template and the root copy _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The registry header says every `failed` write clears `pid` in the same write, but `spawn_refused` still clears it in a second write
→ [finding_1.md](fix_watcher_running_count_pid_reuse_code_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
