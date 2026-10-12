# Skeptic Review: fix_findings_overwrites_and_commit_gaps

## Context

**Branch:** `fix_findings_overwrites_and_commit_gaps`
**Date:** 2026-10-12

**Reviewed.** The whole-branch diff against `dev` (`defaultBranch`): 37 files, +241/−163. That is 15 state-dir README templates under `cli/templates/state-dir/` and 22 agent and instruction contracts under `plugin/`, read from the hunks with first-hand reads of the callers and cited sources. 34 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- the committed code review (`harness-runs/code_reviews/fix_findings_overwrites_and_commit_gaps_code_review.md`, Findings 1–4, all applied);
- the architecture review (`harness-runs/architecture_branch_reviews/fix_findings_overwrites_and_commit_gaps_arch_review.md`, Findings 1–4, all applied);
- `harness-runs/lessons.md`.

`phases.parity` is `false`, so no parity review exists and check 2's parity leg is inert.

**Checks that held.**
- **Wired.** Every new wire has a live producer and a live consumer: `unit_findings_folder` (unit loop step 5 → committer step 3 / **Subject reconciliation**), `error: blocked — ` (qa-tester `### 3.` → E.1/E.2, `qa_test_instructions.md` `### 3.`/`### 4.`, both `## Stop conditions`, the fork's `<escalate>` list), `<review_index>` / `<meta_review_index>` / `<test_fix_review_index>` / `<parity_review_index>` / `<arch_review_index>`, and the two new commit points registered as entries 13 and 14.
- **Fix iterations.** The unit loop's fix iteration reads the `findings_file:` that `layer-reviewer` actually returns on FAIL.
- **Citations.** Override 5's citation of the writer's step 6 and QA.0's no-re-review rationale both check out against their sources.
- **Gate counters.** Resetting the gates' cap counter only at the start of a revision chain fixes an old contradiction rather than introducing a divergence.

**Headline.** One net-new defect. `Override L` excludes the `## Questions` augment return, and gives a reason that does not hold. A QA.0 `<ask>` park therefore leaves modified tracked UI-test files behind, and the resumed fused command halts at its own tree-state precondition before it can reach QA.0. The sibling `Override 5` already handles the identical case the opposite way.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Fire `Override L` on a `## Questions` augment return, before the `<ask>` park _(layer: plugin)_

---

## Must Fix

### 1. `Override L` skips the `## Questions` augment return, so a QA.0 `<ask>` park leaves modified tracked UI-test files and the resumed run halts at its own tree-state precondition
→ [finding_1.md](fix_findings_overwrites_and_commit_gaps_skeptic_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

The task prompt asked that the augmented plan's missing re-review be either added or justified, and QA.0 now justifies its absence. Checked against `plugin/agents/ui-tests-plan-reviewer.md` → `## Read first`: that reviewer grades against the task prompt, the story index and the per-task files. The stated reason is accurate, so this is not a finding. The story index's out-of-scope item (a), the semi-autonomous fork's uncommitted QA.0 augment, is a declared scope decision, and this review does not re-grade it.
