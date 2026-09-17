# User-Review Fix Plan: feat_readme_summary_compact_llms_txt

## Context

**Branch:** `feat_readme_summary_compact_llms_txt`
**Source user review:** `harness-runs/user_reviews/feat_readme_summary_compact_llms_txt_review.md`
**Summary:** The user flagged 1 observation. The commands an adopter runs from the new README checklist, the lettered adoption steps and the `llms.txt` checklist are no longer copiable. They sit inline, joined by ", then", and the fenced blocks of steps A, B, D and E were deleted. The observation was checked against the current tree, and it is valid.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator works through the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only, and the committer never touches them.

Each entry points to a self-contained `harness-runs/user_reviews/feat_readme_summary_compact_llms_txt_fix_plan/finding_<K>.md` file through its `**Finding K**` reference. Entries are sorted from lowest blast radius to widest refactor.

1. [ ] **Finding 1** — Put every adopter command in `README.md` (checklist steps 1–5, steps A/B/D/E/F, the **Published.** caveat) and in the `llms.txt` checklist into fenced blocks, one command per line, with no ", then" joins. _(layer: general)_

---

## Must Fix

### 1. Adopter commands in `README.md` and `llms.txt` cannot be copied and run as written
→ [finding_1.md](feat_readme_summary_compact_llms_txt_fix_plan/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

_None. The only observation is valid._

---

## Source observations

This is a verbatim copy of `harness-runs/user_reviews/feat_readme_summary_compact_llms_txt_review.md`, so this fix plan is self-contained.

1. `README.md` → the checklist at the top, step 1 *Install the plugin* (and step 5 *Start the daemon*): the two commands sit on one line as inline code spans joined by ", then". Inline code gets no copy button on GitHub, and selecting both by hand picks up the ", then" between them, so an adopter cannot copy and run them as written. The branch also deleted the fenced ```bash blocks that steps A, B, D and E under `### Adopting it in your own repository` used to carry, so those steps no longer show a command at all. Every command an adopter is meant to run should be copiable: one command per line in a fenced block. `llms.txt` repeats the checklist; check it for the same problem.
