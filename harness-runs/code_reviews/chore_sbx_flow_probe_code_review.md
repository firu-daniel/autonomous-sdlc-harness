# Code Review: chore_sbx_flow_probe

## Context

**Branch:** `chore_sbx_flow_probe`
**Date:** 2026-11-06
**Reviewed:** the whole branch diff against the default branch `dev` (as `origin/dev`, because this checkout has no local `dev` ref). That is one added paragraph in `docs/watcher.md` → `### The per-run profile` (Task 1, `general` layer), which says what `watcher.log` carries when the per-run profile renders and passes its launch check. 5 run-artifact files excluded from the reviewed diff.

The diff adds lines only: one sentence as its own paragraph, in the place the task prompt names. Nothing else in the document changes. No test applies: the change is prose under `docs/`, and no tree guard keyed on it changes outcome (the added text carries no machine path and no line coordinate). `phases.parity` is `false`, so no parity review ran. I checked each claim in the sentence against `cli/templates/scripts/autonomous-watcher.sh` (`launch_run`, `spawn_engine`, `spawn_refuse`, `run_profile_render`, `run_profile_check`, and every `spawn_engine` call site: park-resume, pause-resume, stall-watchdog, job auto-resume, job dispatch). `scripts/autonomous-watcher.sh` differs from the template only in park-loop and resume-prompt hunks that touch none of those functions.

- **Claim 1 holds:** a render and a check that pass log nothing of their own.
- **Claim 3 holds:** `run_profile` is written outside job mode only, after the check.
- **The launch-line ordering holds** on every path that reaches `spawn_engine`. The stall-watchdog restart has a path that logs its restart line and then gives the run up without spawning, so the sentence's inference is false there (Finding 1).
- **The sentence's closing clause** is ambiguous in two ways (Finding 2).

Pass 2 found no per-task review folder at the supplied root, so it carried nothing over.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Exclude the stall-watchdog restart that gives the run up before the spawn from the "passed" record _(layer: general)_
2. [ ] **Finding 2** — Point "that line" at the launch line and split the `run_profile` fact out of the `because` clause _(layer: general)_

---

## Must Fix

### 1. The stall-watchdog restart line can be followed by a `-> failed` line with no spawn, so "no `not launching` line after it" does not prove the profile passed
→ [finding_1.md](chore_sbx_flow_probe_code_review/finding_1.md)

---

## Should Fix

### 2. "because that line … and outside job mode …" reads as if the `run_profile` fact were part of the reason, and "that line" points at the wrong line
→ [finding_2.md](chore_sbx_flow_probe_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

_Empty: `phases.parity` is `false`._
