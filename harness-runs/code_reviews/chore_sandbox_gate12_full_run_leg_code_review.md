# Code Review: chore_sandbox_gate12_full_run_leg

**Branch:** `chore_sandbox_gate12_full_run_leg`
**Date:** 2026-11-04
**Reviewed:** the whole branch diff against the configured `defaultBranch` (`dev`). No local `dev` ref exists in this run copy, so the base was `origin/dev`. The diff touches five `general`-layer documents of record:

- `docs/sandbox-verification.md` gains a new §10 holding the FR1–FR7, JS1/JS3/JS3N/JS4, SB2–SB4 and RJ2/RJ3 rows (Task 1).
- `docs/development.md` gains Gate 12's **The sandbox series round (#170 step 4) — not yet run.** and observation **(xvi)**, plus pointer updates (Task 2).
- `docs/remote-execution.md` gains three new `## 6` rows and three pointers into the round (Task 3).
- `docs/cli.md` and `docs/outer-loop-verification.md` record the `sandbox1h` checks (Task 4).

9 run-artifact files excluded from the reviewed diff.

No code, test, template, plugin asset or configuration changed, and no new exported symbol was added, so the Pass 0 caller check found nothing to check. The grep sweep list is empty, which disables only that half of Pass 0. Every added Observed and Verdict cell reads *not yet measured*. No added line carries a line coordinate or a machine-local path. Every cited heading, bold lead, step name and quoted log line was resolved against `cli/templates/github/workflows/harness-run.yml`, `cli/templates/scripts/autonomous-watcher.sh`, `cli/templates/scripts/remote-run.sh` and the cited docs, and all resolve, with two exceptions found in the substance:

- FR1's "Read from" names a launch line that does not exist (Finding 1).
- FR7's architecture-gate clause is unreachable from the planning park the full-run leg uses (Finding 2).

Beyond those two, the round assigns one `sandbox1h` §2 check to a step that does not perform it (Finding 3). Parity is off (`phases.parity: false`), so no reference-implementation cross-check applies. Pass 2 had nothing to reconcile: the per-unit findings root does not exist for this branch.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 4** — Move the new `sandbox1h` §1 paragraph in `docs/cli.md` §5 below the "That first arm" paragraph _(layer: general)_
2. [ ] **Finding 5** — Put observation (xvi)'s `branch-prompt` drop command in its own fenced block _(layer: general)_
3. [ ] **Finding 3** — Add a fresh-`init` command block to the round's step 4 for `sandbox1h` §2's managed-block check _(layer: general)_
4. [ ] **Finding 1** — Correct FR1's "Read from" in both documents: no launch line carries `--settings`, and the session's output is not in the step log _(layer: general)_
5. [ ] **Finding 2** — State in FR7 that the full-run leg's planning park does not reach the architecture gate's test-log clause _(layer: general)_

---

## Must Fix

### 1. FR1's "Read from" names a launch line carrying `--settings` that the watcher never prints
→ [finding_1.md](chore_sandbox_gate12_full_run_leg_code_review/finding_1.md)

### 2. FR7's architecture-gate clause cannot be reached by the planning park observation (xvi) drops
→ [finding_2.md](chore_sandbox_gate12_full_run_leg_code_review/finding_2.md)

### 3. `sandbox1h` §2's fresh-`init` check is assigned to step 4, which runs no fresh `init`
→ [finding_3.md](chore_sandbox_gate12_full_run_leg_code_review/finding_3.md)

---

## Should Fix

### 4. The new `sandbox1h` §1 paragraph in `docs/cli.md` §5 cuts "That first arm" off from the precedence it refers to
→ [finding_4.md](chore_sandbox_gate12_full_run_leg_code_review/finding_4.md)

### 5. Observation (xvi) gives `/autonomous-sdlc-harness:branch-prompt` inline in prose, against the branch's own fenced-block rule
→ [finding_5.md](chore_sandbox_gate12_full_run_leg_code_review/finding_5.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section is empty.
