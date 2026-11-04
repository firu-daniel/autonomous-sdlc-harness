# Skeptic Review: chore_sandbox_gate12_full_run_leg

## Context

**Branch:** `chore_sandbox_gate12_full_run_leg`
**Date:** 2026-11-04

**What was reviewed.** The whole branch diff against the configured `defaultBranch` (`dev`). This run copy has no local `dev` ref, so the base was `origin/dev`. The diff changes five `general`-layer documents of record: `docs/sandbox-verification.md`, `docs/development.md`, `docs/remote-execution.md`, `docs/cli.md` and `docs/outer-loop-verification.md`. 15 run-artifact files were excluded from the reviewed diff.

**De-duplicated against.** The committed code review, `harness-runs/code_reviews/chore_sandbox_gate12_full_run_leg_code_review.md`, and its Findings 1–5, all applied. No parity review exists (`phases.parity` is `false`), and no architecture branch review exists for this branch.

**How it was checked.** The branch adds no code, so check 1 (wiring) has nothing to check, and check 2's parity leg is inert. Every log string, step name, function and flag the new rows and round steps cite was traced to the shipped source: `cli/templates/scripts/autonomous-watcher.sh` (`run_job`, `spawn_engine`), `cli/templates/scripts/remote-run.sh`, `cli/templates/scripts/autonomous-format-stream.sh`, `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_remote_bundle_write`), `cli/templates/scripts/lib/run-analytics.jq` and `cli/templates/github/workflows/harness-run.yml`. All resolve, with three exceptions:

- FR4's statement that no shipped surface carries a denied call's input off the runner is false. The `harness-state` artifact's `run.log` holds a clipped input descriptor for every call (Finding 1).
- Step 8's default-branch leg never says where `<other branch>` comes from. The job refuses unless that branch carries the adoption (Finding 2).
- FR1's three copy and machine-state claims have no named surface (Finding 3).

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Name where FR1's copy and machine-state clauses are read from, in both documents _(layer: general)_
2. [ ] **Finding 2** — Create `<other branch>` from the default branch's tip before step 8 sets it as the GitHub default, and delete it after _(layer: general)_
3. [ ] **Finding 1** — Correct FR4: the `harness-state` artifact's `run.log` carries each call's clipped input descriptor, in both documents _(layer: general)_

---

## Must Fix

### 1. FR4 says no shipped surface carries a denied call's input off the runner, but the `harness-state` artifact's `run.log` carries a descriptor of every call
→ [finding_1.md](chore_sandbox_gate12_full_run_leg_skeptic_review/finding_1.md)

---

## Should Fix

### 2. Step 8's `<other branch>` is never created, and the job refuses on a GitHub default branch that does not carry the adoption
→ [finding_2.md](chore_sandbox_gate12_full_run_leg_skeptic_review/finding_2.md)

### 3. FR1's "Read from" covers its `--settings` clause, but not "cuts no copy", "renders no per-run copy" or "writes nothing under the machine state directory"
→ [finding_3.md](chore_sandbox_gate12_full_run_leg_skeptic_review/finding_3.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. No divergence on this branch is marked intentional, so check 4 had nothing to re-grade.
