# Skeptic Review: chore_sbx_flow_probe

## Context

**Branch:** `chore_sbx_flow_probe`
**Date:** 2026-11-06
**Reviewed:** the whole branch diff against the default branch `dev`. This checkout has no local `dev` ref, so the diff base is `origin/dev`. The diff is one added paragraph in `docs/watcher.md` → `### The per-run profile` (Task 1, `general` layer), as it stands after the code review's Findings 1 and 2 were applied. 8 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/chore_sbx_flow_probe_code_review.md` and its `finding_1.md` and `finding_2.md`. No parity review exists, because `phases.parity` is `false`, and no architecture review exists for this branch.

**Headline.** I re-checked every claim in the sentence against `cli/templates/scripts/autonomous-watcher.sh` first-hand. `scripts/autonomous-watcher.sh` does not differ from it on any line that names `spawn_engine`, `run_profile` or a launch line. I checked these call sites of `spawn_engine`: `launch_run`, `resume_parked_run`, `resume_paused_run`, the stall-watchdog relaunch, job mode's auto-resume, and `run_job`'s three arms. Every pre-spawn log line comes before `spawn_engine`. `begin_park_resume` and `begin_pause_resume` cannot return early. The stall-watchdog give-up is the only path that logs a launch-type line and then reaches no spawn, and code-review Finding 1 already covers it. In job mode `log` tees to the same `watcher.log`. One net-new defect remains, and it was introduced by the code review's own Finding 2. That fix framed the `run_profile` field as "also" a record that the spawn passed. A refused spawn never clears or rewrites that field, and every spawn of a branch renders to the same path, so the field cannot serve as that record after a branch's first spawn.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Stop presenting the `run_profile` field as a second record that this spawn passed _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. "`run_profile` field also names the rendered file" presents a field that a refused spawn leaves set as a second record that this spawn passed
→ [finding_1.md](chore_sbx_flow_probe_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

_Empty: `phases.parity` is `false`, and the branch marks no divergence as intentional._
