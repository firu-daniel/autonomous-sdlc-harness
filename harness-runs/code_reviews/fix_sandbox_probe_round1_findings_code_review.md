# Code Review: fix_sandbox_probe_round1_findings

## Context

**Branch:** `fix_sandbox_probe_round1_findings`
**Date:** 2026-10-27
**Reviewed:** the whole branch diff against `dev`. No local `dev` branch exists in this checkout, so the diff base is `origin/dev`. The diff covers 37 files, +1914 / −230:
- **The probe** (`general`): `scripts/sandbox-probe.sh`, plus `core.sh`, `judge.sh`, `session.sh` and the six leg files under `scripts/lib/sandbox-probe/`. This includes the arch-review fix commit that moved stopping a process into `session.sh` → `sp_stop_pid`.
- **The tests** (`cli`): four new suites and two edited ones under `cli/test/`, with nineteen fixtures under `cli/test/fixtures/sandbox-probe/`.
- **The docs** (`general`): Gate 15 and its leg table in `docs/development.md`, and the amended rows in `docs/sandbox-verification.md`.

23 run-artifact files excluded from the reviewed diff.

**All thirteen defects in the task prompt are addressed.** Each fix puts its decision in a named grading function that its suite drives from recorded streams, and no test launches `claude`:
- T2's result line is unfused and runs the `run-test-suite.sh` route.
- TD2's control is a literal.
- The file-tool text now outranks `permission_denials`.
- N5's `cannot widen` refusal grades as a pass.
- N3 has its own listener, and N4 is graded on curl's error line.
- The credentials leg has a no-calls check.
- Evidence is kept for non-passing legs.
- CS3's fetch is an expected refusal.
- The pipe in `sp__wp_tracked` is gone.
- P1b has a permission screen.
- CS7's `Edit`, W7's debug log and R4's `--local` half are all taken.
- CS4 needs no code change, as the plan argued.

The leg table and Gate 15 change together, and the amended rows keep their Observed and Verdict cells. Every new function has a caller outside its defining file. None of the new suites reads a tree of repository files, so none owes a `treeGuards` entry. Whether the suites pass is the Run gates phase's to establish; this review runs nothing. `phases.parity` is `false`, so no parity check applies.

**Lessons-ledger checks on bounded waits and the probe's own processes.** The diff adds waits and starts processes, so two `harness-runs/lessons.md` entries apply: *"Every automatic retry in an unattended path is bounded…"* (`## Unattended control loops`) and *"A script that creates a temporary working copy or branch removes it on every exit path…"* (`## Remote and branch-scoped operations`). They are the story index's scope-register rows 27 and 26.

(a) **Every new wait is bounded, and reaching the bound is reported once:**
- **T2's `--wait` reissues** (`legs-local.sh`, `SP_T2_MAX_WAITS=40`). The prompt caps them at 40 calls ("at most $SP_T2_MAX_WAITS times in all"). This bound is on the session. The probe does not rely on it alone: the collect loop below runs after the session ends, however it ended.
- **The T2 collect loop** (`while [ ! -f "$lane.verdict" ] && [ -f "$lane.running" ] && [ "$waited" -lt "$SP_T2_COLLECT_SECONDS" ]`). It polls every `SP_T2_POLL_SECONDS=5` and stops at `SP_T2_COLLECT_SECONDS=1800`. At the bound, T2 prints `not run` with "no verdict for the gate run: … is absent", followed by the note "no verdict Ns after the session and the gate worker still holds .running". The probe does not wait again.
- **The listener start-up poll** (`legs-network.sh`, `SP__NET_LISTENER_START_POLLS=50`). It makes 50 polls 0.1 s apart and stops early if the listener has exited. At the bound, `sp__net_listener_start` stops the listener and returns 1, and N3 prints `not run` with `SP__NET_LISTENER_WHY`. That reason names the bound and the listener log.
- **The PID stop poll** (`session.sh`, `SP__PID_POLLS=50`, in `sp_stop_pid`). It TERMs once, then makes 50 polls 0.1 s apart, and returns status 1 at the bound. Mid-leg, `sp__net_listener_stop` reports that with `sp_refuse`. At teardown, `sp__td_stop_pids` reports it through `sp__td_fail`: the message names the PID and the `kill -9 <pid>` way on, and the exit code is raised to 5.

(b) **Every process the probe starts is stopped on every exit path:**
- **The trap.** `sp__install_trap` installs `trap 'sp__on_exit' EXIT` and INT/TERM handlers that call `sp_teardown`. `sp_teardown` runs `sp__td_stop_pids` before it removes any clone.
- **The N3 listener** (`python3 -u -m http.server`). It is registered with `sp_track_pid "$!"` on the line after it starts, before the first poll. It is stopped mid-leg on both the start-failure path and the graded path. If the leg is interrupted, the trap stops it. This check holds.
- **The T2 gate worker.** It is registered with `sp_track_pid "$pid"` only after the collect loop has used up its 1800 s. An INT or TERM *during* that wait removes the clone under a live worker and leaves the worker running. This check does not hold → **Finding 4**.
- **The kept evidence directory** (`${TMPDIR:-/tmp}/sandbox-probe-evidence.XXXXXX`). This is the one exception the plan names (scope-register rows 26 and 31). It is not a working copy or a branch. It is created only when some leg did not pass. `sp__td_keep_evidence` refuses to create it inside `SP_MAIN` or `SP_CLONE` and removes it again if nothing was kept. Teardown prints its path as the last stderr line, so it is deliberately left behind and named, not leaked.

What remains:
- One process left running on an interrupted run. T2's gate worker is not tracked during the collect wait (Finding 4).
- Two evidence gaps. T2's network denials are counted where they do not land (Finding 1). W8's W7 log is not kept with the leg it fails (Finding 2).
- One prompt sentence that contradicts its own prompt (Finding 3).

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Reword the credentials measurement paragraph so it no longer says every call is refused or prints nothing _(layer: general)_
2. [ ] **Finding 2** — Keep W7's debug log with the write-protection leg, whose W8 row grades it _(layer: general)_
3. [ ] **Finding 4** — Track T2's gate worker for teardown before the collect wait, and untrack it once it ends on its own _(layer: general)_
4. [ ] **Finding 1** — Count T2's network denials in the session stream as well as the lane log, with its test case and row wording _(layer: cli, general)_

---

## Must Fix

### 4. T2's gate worker is tracked for teardown only after the collect wait runs out, so an INT or TERM during the wait removes the clone under a live worker and leaves it running
→ [finding_4.md](fix_sandbox_probe_round1_findings_code_review/finding_4.md)

---

## Should Fix

### 1. T2 counts network denials only in the gate lane's log, but the 2026-10-27 denials showed up in the session stream
→ [finding_1.md](fix_sandbox_probe_round1_findings_code_review/finding_1.md)

### 2. A W8 `fail` or `not run` caused by W7's debug log does not keep that log
→ [finding_2.md](fix_sandbox_probe_round1_findings_code_review/finding_2.md)

---

## Nice to Have

### 3. The credentials prompt tells the session that every call will be refused or print nothing, but three of them print by design
→ [finding_3.md](fix_sandbox_probe_round1_findings_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section has no call-outs.
