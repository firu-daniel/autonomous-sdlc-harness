# Skeptic Review: feat_converging_plan_reviews

## Context

**Branch:** `feat_converging_plan_reviews`
**Date:** 2026-11-13
**Reviewed:** the whole branch diff against the default branch. This run copy has no local `dev` ref, so the diff base is `origin/dev`, the remote-tracking ref of that same branch. 81 files outside the run artifacts were reviewed adversarially, in five segments: the walker (`start_round`, `close_round`, the round-gate `next` path), its gate library (`fw_review_verdict`, `fw_fail_count`, `fw_round_evidence`), the planning graph, and the bundle restore's withhold path; the run-artifact READMEs; the `cli/test/` suites; the plugin contracts (the shared `plan_review_rounds.md`, both loop cores and their forks, the five plan agents, the pause module, the commit-point register); and the `general` layer (schema, fixtures, `scripts/check-flow-graph.sh`, the Gate 12 grader, `docs/`, `ROADMAP.md`). 55 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/feat_converging_plan_reviews_code_review.md` (Findings 1–3) and `harness-runs/architecture_branch_reviews/feat_converging_plan_reviews_arch_review.md` (Findings 1–2). `phases.parity` is `false`, so no parity review exists and check 2's parity leg is inert. No planning round on this branch carries an `## Incidental findings (not gating)` section, so there were no leads to verify.

**Headline:** every new shell function is called from the path that should call it, and the walker keeps the counter and the round number apart in every `start` arm. `start_round` reads the evidence from `fw_round_evidence` and restarts the round at its first gate whenever that evidence is incomplete. The restore's withhold keeps a committed round from being mixed with newer drafts. The self-adopted scripts are byte-identical to their templates. Two findings remain, both in the fix-plan loop's prose:
- The code review's Finding 1 fixed the `fix_round` reset at step 5, but the autonomous fork's answered-park resume (Override 2(a)) enters step 11 in a new session with `fix_round` never set. On the common path, an answered fix-plan cap park, the next rounds therefore reuse indices that are already on disk.
- The commit-point register describes entry 18's path set without the revision-notes folder.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Name `<state_dir>/plan_revisions/<branch>/` in commit-point entry 18's path-set description _(layer: plugin)_
2. [ ] **Finding 1** — Make the fix-plan core's step 11 recover `fix_round` from the round files on every entry that has not set it, the autonomous fork's Override 2(a) answered-park resume included _(layer: plugin)_

---

## Must Fix

### 1. An answered fix-plan park resumes through step 11 with `fix_round` never set, so the resumed rounds reuse round indices already on disk
→ [finding_1.md](feat_converging_plan_reviews_skeptic_review/finding_1.md)

---

## Should Fix

### 2. Commit-point entry 18 lists the fix-plan round commit's path set without `<state_dir>/plan_revisions/<branch>/`
→ [finding_2.md](feat_converging_plan_reviews_skeptic_review/finding_2.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `devscene.config.json`, so there is no reference implementation to diverge from and no divergence survived check 4 to call out.
