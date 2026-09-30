# Skeptic Review: fix_upgrade_route_gate12_findings

## Context

**Branch:** `fix_upgrade_route_gate12_findings`
**Date:** 2026-09-30
**Reviewed:** the whole-branch diff against `dev`, 13 files. `cli/src`: `IN_FLIGHT_RUNS_NOTE` and its two callers, `doctor`'s version-warning join, the ungated `.bak` ignore rules and the upgrade-specific report. `cli/templates`: the `advice.detachedHead` clone, the reworded `upgrade_route` and the `gitignore` block. Their tests. The `### Upgrading`, `docs/cli.md` and `docs/development.md` prose. 16 run-artifact files excluded from the reviewed diff. De-duplicated against `harness-runs/code_reviews/fix_upgrade_route_gate12_findings_code_review.md` and its two findings, `harness-runs/architecture_reviews/fix_upgrade_route_gate12_findings/review_0.md`, and `harness-runs/lessons.md`. `phases.parity` is `false`, so there is no parity review and check 2's parity leg is inert.

**Headline.** Check 1: both callers of the one new export exist (`cli/src/commands/init.ts`, `cli/src/doctor/checks.ts`). The upgrade's `mergedPaths` filter covers every `merge-lines` / `merge-json` target in `cli/src`, which are `.gitignore`, `.claude/settings.json` and `.mcp.json`. Check 3: every cited anchor resolves. That covers the `gh_call workflow run … --ref "$branch"` line, `push-branch.sh`'s "EVERY FAILURE PATH IS NON-FATAL", the `Generate the job's permission profile` step and its `untracked-files=no` test, and "section 7, Upgrading". One net-new defect is left, in the in-flight move route that the code review already corrected on two other points. The route's `git checkout origin/<default branch> -- … .gitignore` replaces the whole file, so it silently discards any `.gitignore` edit the run made on its own branch.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Take only the two workflows from the default branch in the in-flight move route, and produce the merged `.gitignore` / settings lines by running the new version's `init` on the branch _(layer: general)_

---

## Must Fix

### 1. The in-flight move route checks `.gitignore` out wholesale from the default branch, silently reverting any `.gitignore` edit the run itself committed on its branch
→ [finding_1.md](fix_upgrade_route_gate12_findings_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Intentional divergences to confirm

_None. `phases.parity` is `false`. The one deliberate choice the branch documents, that a run in flight keeps its version, is the task prompt's own stated intent and passes both legs of check 4._
