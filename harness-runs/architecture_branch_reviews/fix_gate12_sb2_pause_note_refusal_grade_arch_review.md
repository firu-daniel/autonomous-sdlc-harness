# Architecture review — fix_gate12_sb2_pause_note_refusal_grade — iteration 0

## Context

Branch `fix_gate12_sb2_pause_note_refusal_grade`, reviewed 2026-11-06 against diff base `dev`. That ref does not exist in this checkout, so the diff was taken against `origin/dev`, which is the same branch. Five files were reviewed in two segments. The grader segment is `general`: `scripts/lib/gate12-sandbox-round/grade-state.sh` and `scripts/lib/gate12-sandbox-round/core.sh`, plus its suite `cli/test/gate12-sandbox-round-grade.test.mjs`, which is `cli`. The documentation segment is `general`: `docs/development.md` and `docs/sandbox-verification.md`. 7 run-artifact files excluded from the reviewed diff. Headline: each file sits in the layer that owns it. The refusal rule lives in the grade library that already owns SB2's verdict, and no change crosses into `plugin/`, `cli/src/` or `cli/templates/`. The one violation is a new retyped copy of a plant literal that `plants.sh` already owns. That library is sourced earlier into the same shell, so the grader can reference the value instead of copying it.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Take the pause-note token file's name from `plants.sh` instead of retyping it in `grade-state.sh` _(layer: general)_

## Must Fix

### 1. Take the pause-note token file's name from `plants.sh` instead of retyping it in `grade-state.sh`
→ [finding_1.md](fix_gate12_sb2_pause_note_refusal_grade_arch_review/finding_1.md)
