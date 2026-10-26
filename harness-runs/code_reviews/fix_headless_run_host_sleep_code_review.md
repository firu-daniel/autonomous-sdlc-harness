# Code Review: fix_headless_run_host_sleep

## Context

**Branch:** `fix_headless_run_host_sleep`
**Date:** 2026-10-26
**Reviewed:** the whole branch diff against the default branch `dev`. This run copy has no local `dev` ref, so the base was `origin/dev` (merge base `c7d4cec4`). The diff covers 24 files across Tasks 1–10:
- `cli`: `execution.keepAwake` in `cli/src/config/model.ts` and `cli/src/config/check.ts`; the run library's keep-awake primitives and the extracted `hr_host_kind_var` in `cli/templates/scripts/lib/harness-run-lib.sh`; the watcher's launch hold, its per-pass `keep_awake_pass`, its status lines and its `host_wake_pass` wake discount in `cli/templates/scripts/autonomous-watcher.sh`; `cli/src/doctor/keepAwake.ts` and `doctor`'s `keep-awake` check; and six new or edited suites and helpers.
- `general`: the schema property, `docs/cli.md`, `docs/config.md`, `docs/watcher.md` and `docs/remote-execution.md`, and the `scripts/` mirror.

15 run-artifact files excluded from the reviewed diff.

`scripts/` and `cli/templates/scripts/` are byte-identical (checked with `cmp` on both changed files). The configuration key sits in all four places it has to (schema, model, check, `docs/config.md` §5) and has its consumers. Every new exported symbol has a caller outside its defining file. Every new behaviour has an accompanying suite. Whether those suites pass is for the Run gates phase to establish, because this review ran none. The exec'd launch head keeps `rc=${PIPESTATUS[0]}` reading the engine's own status, and the hold waits on the engine's own pid. `phases.parity` is `false`, so no parity cross-check ran and the call-out section is empty.

The main defect is Finding 1. Once a running record's hold has been released to `off`, the per-pass hold check never takes it again. That happens when the key is turned back on, and also after a single pass that failed to read the configuration. Pass 2 was a no-op: the supplied `per_task_findings_root` (`harness-runs/task_plan_point_reviews/fix_headless_run_host_sleep_task_plan/`) does not exist, so there were no per-unit findings to reconcile.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Read `GITHUB_ACTIONS` through a named constant in `probeKeepAwakeHost` _(layer: cli)_
2. [x] **Finding 5** — Name WSL1 rather than `linux` in the `keep-awake` sentence for a WSL1 host _(layer: cli)_
3. [ ] **Finding 4** — Give `localStall` the silent keep-awake probe override so no suite takes a real logind lock _(layer: cli)_
4. [ ] **Finding 3** — Report an unreadable configuration as unreadable, not as "`execution.keepAwake` is not a boolean" _(layer: cli, general)_
5. [ ] **Finding 1** — Re-take the hold on a running record whose hold was released to `off` once the mode holds again _(layer: cli, general)_

---

## Must Fix

### 1. A hold released to `off` mid-run is never taken again — not when the key is turned back on, and not after one unreadable config pass
→ [finding_1.md](fix_headless_run_host_sleep_code_review/finding_1.md)

### 2. `probeKeepAwakeHost` reads the `GITHUB_ACTIONS` environment variable as a retyped literal
→ [finding_2.md](fix_headless_run_host_sleep_code_review/finding_2.md)

---

## Should Fix

### 3. An unreadable `harness.config.json` is reported as "`execution.keepAwake` is not a boolean"
→ [finding_3.md](fix_headless_run_host_sleep_code_review/finding_3.md)

### 4. `watcher-stall-reset-payloads`'s `localStall` takes a real logind lock on a Linux host, against the test tree's stated rule
→ [finding_4.md](fix_headless_run_host_sleep_code_review/finding_4.md)

---

## Nice to Have

### 5. The `keep-awake` sentence for a WSL1 host names the platform as `linux`
→ [finding_5.md](fix_headless_run_host_sleep_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section is empty.
