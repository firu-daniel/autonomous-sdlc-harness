# Code Review: fix_gate_worker_sandbox_start

## Context

**Branch:** `fix_gate_worker_sandbox_start`
**Date:** 2026-11-14
**Reviewed:** the whole branch diff against `origin/dev`. `defaultBranch` is `dev`, and this checkout has no local `dev` ref, so the remote-tracking ref is the diff base. The diff covers:

- the new in-session probe `scripts/gate-worker-start-probe.sh` (Task 1);
- the run form's new launch line and the `<label>.start` contract in `cli/templates/scripts/run-test-suite.sh` (Task 2);
- the lane README template and the run-form suite `cli/test/run-test-suite.test.mjs` (Task 3);
- the probe's suite `cli/test/gate-worker-start-probe.test.mjs` (Task 4);
- this checkout's byte copies `scripts/run-test-suite.sh` and `harness-runs/test_run_logs/README.md` (Task 5; both confirmed identical to their templates with `cmp`);
- F17, the F6/BG2 amendments and rows WS1–WS5 in `docs/sandbox-verification.md` (Task 6).

15 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**

- **The fix follows the probe.** The probe recorded `nohup` exiting 127 with `nohup: can't detach from console: Inappropriate ioctl for device` inside the session's sandbox, while a `trap '' HUP` control started in the same call. The fix is applied only on that reading, and it keeps the worker sandboxed: no profile or `sandbox.excludedCommands` entry was added.
- **Wire strings are unchanged.** `pending`, `the detached run of <label> did not start` and exit codes 0–4 are byte-identical.
- **The new launch line is sound.** HUP is still ignored on the worker's entry, and the new HUP test case would fail if it were trapped instead. `exec` keeps `$!` equal to the worker's `.running` PID.
- **The `<label>.start` contract matches the story index.** The run form clears it before a fresh run; the worker removes it at its claim; the marker line is appended on the start-up refusal; `--no-detach` clears it; a reuse leaves it as found. Each has a test case.
- **Tests:**
  - Every accompanying test the touched layers require is present. Whether they pass is the Run gates phase's question, because this review ran no suite.
  - The new suite reads no tree of files, so it owes no `treeGuards` entry. `cli/test/**/*.mjs` is already covered by `test/main-anchor-isolation.test.mjs`.
  - No fixture is created inside the checkout: the probe suite points `--work`, `HOME` and `TMPDIR` at `os.tmpdir()`.
- **Parity:** `phases.parity` is `false`, so no parity review ran.
- **Pass 0 sweep:** half (a)'s regex list is still the unfilled stub, which is a configuration gap and found nothing. Half (b) found no new exported symbol, because the branch changes no `cli/src` module.
- **Leads checked:** no incidental-findings section exists in this branch's planning rounds. The lessons ledger's evidence entries were checked against the probe: controls that each remove one candidate, writes graded on disk, records shown whole, and teardown of only what the probe created on every exit path. All hold.

The one Should Fix is a claim in the run form's header. BG2's measured survival belongs to the `nohup` shape this branch retired. Whether the new shape outlives its call has not been measured yet; the branch's own Run gates phase will be the first real-shape reading.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` as that fix's commit lands: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry resolves to `harness-runs/code_reviews/fix_gate_worker_sandbox_start_code_review/finding_<K>.md` through its `**Finding K**` reference. Entries are sorted with the smallest, safest edits first.

1. [x] **Finding 3** — Name Task 6 of `fix_gate_worker_sandbox_start` instead of "this task" in the WS block of `docs/sandbox-verification.md` _(layer: general)_
2. [x] **Finding 2** — Re-wrap the two over-long header lines in the run form and its byte copy _(layer: cli, general)_
3. [x] **Finding 1** — Mark BG2 as the `nohup` shape's measurement in the run form's header, and record the `trap '' HUP` shape's survival as owed row WS6 _(layer: cli, general)_

---

## Must Fix

None.

---

## Should Fix

### 1. The run form's header cites BG2 for the new launch shape's survival, which no reading has measured
→ [finding_1.md](fix_gate_worker_sandbox_start_code_review/finding_1.md)

---

## Nice to Have

### 2. Two header lines this branch edited in the run form overrun the header's wrap width
→ [finding_2.md](fix_gate_worker_sandbox_start_code_review/finding_2.md)

### 3. The WS rows of a standing document say "this task" for the re-take, which names no task once the run is over
→ [finding_3.md](fix_gate_worker_sandbox_start_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section has no divergence call-outs.
