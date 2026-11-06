# Code Review: fix_gate12_sb2_pause_note_refusal_grade

## Context

**Branch:** `fix_gate12_sb2_pause_note_refusal_grade`
**Date:** 2026-11-06
**Reviewed:** the whole branch diff against `dev`, with three segments. The configured `defaultBranch` `dev` is not a local ref in this checkout, so the diff base is `origin/dev` (merge base `ae9b3d0d`). The grader segment is `general`: `scripts/lib/gate12-sandbox-round/grade-state.sh` (`g12_sb2pn_refusal`, `g12_sb2pn_questions` and the new `pass` branch of `g12_sb2pn_arm`), `scripts/lib/gate12-sandbox-round/core.sh` (SB2's `--list` note) and `scripts/lib/gate12-sandbox-round/plants.sh` (`G12_SB2PN_TOKEN_FILE`). The test segment is `cli`: `cli/test/gate12-sandbox-round-grade.test.mjs` and `cli/test/gate12-sandbox-round-plant.test.mjs`. The documentation segment is `general`: `docs/development.md` (step 7, the restated `--list` row and the owed-checks SB2 bullet) and `docs/sandbox-verification.md` (§10 SB2's *Expected* cell and one phrase of its *Observed* cell). 9 run-artifact files excluded from the reviewed diff.

**Headline.** The refusal rule is the one the story index defines. It keeps the link and token checks ahead of it, and it requires all four of these: `status.json` `parked`, `Save the state bundle` concluded `success` with no skip line, a top-level `question_*.md` that names the plant, and refusal wording in that same question. A refusal outside the vocabulary grades `not run`, and every top-level question goes into the record. SB2 still prints exactly one `source` line. The `--list` note and its restatement in `docs/development.md` match byte for byte. The §10 *Observed* measurement is kept as recorded. Every scope-register site was re-derived and is dispositioned. The architecture review's Finding 1 has landed: `grade-state.sh` reads `G12_SB2PN_TOKEN_FILE` from `plants.sh`, which is sourced first. Tests: every changed behaviour has a case, including each refusal precondition removed in turn, an `answered/`-only question, a link and the token under a refusal park, and the skip line as a pass of its own. This review runs no suite: whether they pass is for the gates. Parity: `phases.parity` is `false`, so nothing was compared. Pass 2: the per-unit findings root holds no folders, so nothing was carried over. The two findings below are what is left.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. Only the committing role flips a marker to `[x]` as that fix's commit lands: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else are informational only.

Each entry resolves 1:1 to `harness-runs/code_reviews/fix_gate12_sb2_pause_note_refusal_grade_code_review/finding_<K>.md`.

1. [ ] **Finding 1** — Make `plants.sh` own the scratch file's name as `G12_SB2PN_SCRIPT` and have `grade-state.sh` read it instead of retyping it _(layer: general)_
2. [ ] **Finding 2** — Hold the token-file and scratch-file names of the refusal rule's plant-name list with one case each _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The refusal rule matches on a retyped copy of the scratch file's name, which `plants.sh` spells on its own
→ [finding_1.md](fix_gate12_sb2_pause_note_refusal_grade_code_review/finding_1.md)

---

## Nice to Have

### 2. Only one of the three plant names the refusal rule accepts is held by a case
→ [finding_2.md](fix_gate12_sb2_pause_note_refusal_grade_code_review/finding_2.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false`, so this section is empty.
