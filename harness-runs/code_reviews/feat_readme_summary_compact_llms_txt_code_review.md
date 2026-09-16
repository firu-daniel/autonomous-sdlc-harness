# Code Review: feat_readme_summary_compact_llms_txt

## Context

**Branch:** `feat_readme_summary_compact_llms_txt`
**Date:** 2026-09-17
**Reviewed:** the whole branch diff against `dev`: 13 files, 351 insertions and 150 deletions. That covers the `cli/` comment re-points (Task 1), the caveats moved into `docs/cli.md`, `docs/development.md` and `docs/analyze.md` (Tasks 2–4), the new `README.md` opening and the compacted README (Tasks 5–6), the `ARCHITECTURE.md` and item 9 row re-points (Task 7), `llms.txt` (Task 8), `scripts/check-llms-txt.sh` wired in as gate 6c (Task 9) and the `ROADMAP.md` bookkeeping (Task 10). 14 run-artifact files excluded from the reviewed diff.

The branch mostly delivers what it set out to do. `README.md` opens with three plain lines and a five-step checklist, and no caveat comes before the checklist ends. The README went from 5,827 words to 2,881. Every heading and named bullet that another file cites is still there, and every new citation resolves: `docs/development.md` §6's third-debt paragraph, `docs/analyze.md` `## 3. What it may write`, `docs/cli.md` §7's `jj-repository` and `remote` bullets, `docs/outer-loop-verification.md` `## 1. The refusal matrix` and `plugin/instructions/plan_orchestration_instructions_core.md` `### D.2 Done summary`. The four long measured caveats and the *git only* bullet were each checked against their destinations, and the measured facts (versions, commands, exact messages, fixture figures) all arrived. `bash scripts/check-llms-txt.sh` exits 0 on the current tree. The only TypeScript changes are doc comments, so the branch adds no exported symbol. The `ROADMAP.md` index is renumbered 1–46 with no gaps, and no file cites a roadmap index number. `phases.parity` is `false`, so no parity check applies. Pass 2 found no per-task review folder at the supplied root, so there was nothing to carry over.

What is left: a false-pass gap in the new link check, an `llms.txt` section that departs from the llmstxt.org format, and a few README sentences that lost a qualifier when they were compacted.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 4** — Restore the "offers to create one" qualifier to the README's *git only* bullet _(layer: general)_
2. [x] **Finding 3** — Restore the allowed values and the check's silence to the README's *Forge-agnostic* and *Design→code* bullets _(layer: general)_
3. [ ] **Finding 2** — Move `llms.txt`'s five numbered quick-start steps out of the `## Quick start` link section _(layer: general)_
4. [ ] **Finding 5** — Move the gate 6c paragraph in `docs/development.md` §5 below the `$HOME` discussion _(layer: general)_
5. [ ] **Finding 1** — Make `check-llms-txt.sh` fail a `tree/main` link whose every tracked file `publish-main.sh` removes _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `check-llms-txt.sh` passes a `tree/main` directory link that will be empty on `main`
→ [finding_1.md](feat_readme_summary_compact_llms_txt_code_review/finding_1.md)

### 2. `llms.txt`'s `## Quick start` section holds a numbered list that has no links, which the llmstxt.org file-list format does not allow
→ [finding_2.md](feat_readme_summary_compact_llms_txt_code_review/finding_2.md)

### 3. The README's *Forge-agnostic* bullet mentions "the three allowed" values without listing them, and the *Design→code* bullet dropped the check's silence
→ [finding_3.md](feat_readme_summary_compact_llms_txt_code_review/finding_3.md)

### 4. The README's *git only* bullet now says `init` "refuses" outside a repository, dropping "offering to create one"
→ [finding_4.md](feat_readme_summary_compact_llms_txt_code_review/finding_4.md)

---

## Nice to Have

### 5. The new gate 6c paragraph splits `docs/development.md` §5's discussion of the `$HOME` and `.claude` checks
→ [finding_5.md](feat_readme_summary_compact_llms_txt_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section is empty.
