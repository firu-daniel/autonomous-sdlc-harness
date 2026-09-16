# Skeptic Review: feat_readme_summary_compact_llms_txt

## Context

**Branch:** `feat_readme_summary_compact_llms_txt`
**Date:** 2026-09-17
**Reviewed:** the whole branch diff against `dev` (`defaultBranch`), adversarially: 13 files, 369 insertions and 150 deletions. 20 run-artifact files excluded from the reviewed diff. This review was de-duplicated against the committed code review, `harness-runs/code_reviews/feat_readme_summary_compact_llms_txt_code_review.md`, and its five per-finding files. There is no parity review, because `phases.parity` is `false`. There is no architecture branch review for this branch.

**What was checked first-hand:**

- **Wiring.** `scripts/check-llms-txt.sh` is reached: `scripts/run-gates.sh` runs it as gate `6c`, and `commands.test` runs it through `scripts/test.sh`. The script exits 0 on the current tree.
- **The spec's own claims.** The repository slug `firu-daniel/autonomous-sdlc-harness` matches `origin`, `.claude-plugin/marketplace.json` and `plugin/.claude-plugin/plugin.json`. `origin/main` carries `.claude-plugin`, `plugin`, `cli`, `docs`, `evals`, `examples`, `schemas`, `LICENSE` and `NOTICE`, so the checklist's step 1 and every `llms.txt` link resolve there. The `:(literal).claude` removal pathspec matches only `.claude/…` and not `.claude-plugin/`. The story's claim that `removed_paths` has seven entries holds.
- **Citations.** Every section the new README cites exists by heading: `docs/analyze.md` §3 and §9, `docs/cli.md` §2, §7 and §9, `docs/watcher.md` §1–§5 and §7, `docs/config.md` §3 and §5, `docs/development.md` §1, §5 and §6, and `ARCHITECTURE.md` `## 8`.
- **Moved facts.** A sample of the facts compacted out of the README is present at the linked destinations. That sample covers the lessons ledger's writer and readers, why the ledger lives in the run-artifact tree, the one-intake-per-branch merge-conflict rationale, the `extraKnownMarketplaces` / `--marketplace` rule and the `sdlc-harness/` default.
- **Roadmap numbering.** Renumbering the `ROADMAP.md` index breaks no citation. The tree's `item N` citations resolve against the separate legend in `docs/development.md` §6, not against roadmap priorities.

**Conclusion:** one net-new finding. The new link gate compares the raw URL path against `removed_paths` but checks the git-normalized path for tracking. A `..` or `./` path into a removed directory therefore passes gate 6c and would return a 404 on `main`.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Make `check-llms-txt.sh` refuse a link path with an empty, `.` or `..` segment _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `check-llms-txt.sh` passes a non-normalized link path (`..`, `.` or an empty segment) into a path `publish-main.sh` removes
→ [finding_1.md](feat_readme_summary_compact_llms_txt_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so no reference divergence applies. The story plan records one deliberate choice: `llms.txt` is not listed in the npm package's `files`. That choice survives scrutiny. `cli/package.json` is published from `cli/`, and its `files` entries are relative to that directory, so a root-level file cannot be listed there.
