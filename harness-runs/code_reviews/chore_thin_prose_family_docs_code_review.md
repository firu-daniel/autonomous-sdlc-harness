# Code Review: chore_thin_prose_family_docs

## Context

**Branch:** `chore_thin_prose_family_docs`
**Date:** 2026-10-13
**Reviewed:** the whole branch diff against `dev` (merge base `25e2382a`). It covers the thinning of `plugin/agents/docs-writer.md` (Tasks 1–3: intro, disabled-phase gate, `**Fix round.**`, `## Project layout`, entry-point hints, `## Research methodology (apply every time)`, the `## Mode 2` intro, the feature-template lead and `## Output contract`) and of `plugin/agents/docs-reviewer.md` (Tasks 4–5: intro, `## Invocation contract` including the narrowed six-section read of `docs-writer.md`, `## Project layout`, `## What to verify (accuracy first, then depth, then completeness)` and `## Output contract`). 9 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- **Behaviour is preserved.** Every sentence the branch drops was checked. Each is either rationale the agent does not act on, or a rule still stated once elsewhere in the same file:
  - the `<repo_root>` bare-probe rule and the repo-relative resolution of `layers[].path` are in each file's `## Resolved values` row;
  - the disabled-phase return shape is in each `## Output contract`;
  - the reviewer's "shallow document is a FAIL" rule is in its `**FAIL**` bullet;
  - check 7's "absence is not a finding" is in the reviewer's `<reference_impl>` row;
  - the reviewer's concrete-correction rule is in `Write findings_path (each finding: the claim, the file that contradicts it, the correction)`.
- **No file outside the two definitions quotes a removed phrase.** This was confirmed with `git grep` across the tree, excluding `harness-runs/` and `docs/work-report-research/`.
- **Every graded writer rule survives:** the anchor forms, the line-number ban, both markers, and the merge and update disciplines. Every heading the reviewer now cites exists byte for byte in `docs-writer.md`.
- **The probe passes.** `bash scripts/scratch-run.sh harness-runs/scratch/docs_family_check.mjs` printed `PASS` with these counts:
  - `WORDS docs-writer.md before=3433 after=2939`;
  - `WORDS docs-reviewer.md before=2422 after=2123`;
  - `UPFRONT docs-reviewer.md before=5855 after=3460`.

  The probe checks frozen windows, bold leads, headings, fences, frontmatter and wire literals, and it confirms that neither up-front count rises.
- **No `cli/` file changed and no test file applies.** The Run gates phase owns the branch bar.
- **The parity checks did not run.** `phases.parity` is `false`.
- **Half (a) of Pass 0 found nothing to check.** Its regex table is still the unfilled stub, which is a configuration gap and not a clean result. The added lines carry no machine path and no line coordinate.
- **Half (b) of Pass 0 found no new exported symbol.** The diff is Markdown only.
- **No per-unit findings were carried over.** The per-unit findings root holds no files.

One Should Fix finding remains.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Scope `docs-reviewer`'s narrowed-read citation sentence to checks 1–12, because check 13's ripple rule sits outside the six sections it reads _(layer: plugin)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The narrowed writer read says every check grades a rule in the six sections, but check 13's ripple rule sits in `### Survey`, outside them
→ [finding_1.md](chore_thin_prose_family_docs_code_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
