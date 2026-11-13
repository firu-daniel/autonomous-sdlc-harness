# Code Review: feat_converging_plan_reviews

## Context

**Branch:** `feat_converging_plan_reviews`
**Date:** 2026-11-13
**Reviewed:** the whole branch diff against the default branch. This run copy has no local `dev` ref, so the diff base is `origin/dev`, the remote-tracking ref of that same branch. 79 files outside the run artifacts, reviewed in five segments:
- the walker, its gate library, the planning graph, the remote bundle's restore and their self-adopted copies (`cli/templates/scripts/`, `scripts/`);
- the `plan_revisions` state-directory row and the plan-gate READMEs;
- the `cli/test/` suites;
- the plugin contracts: the new shared module `plugin/instructions/plan_review_rounds.md`, both loop cores and their forks, the five plan agents, the pause module, the end-of-branch reviewers, the implementation-flow readers, the commands and the flow documents;
- the `general` layer: the format-2 schema with its fixtures, `scripts/check-flow-graph.sh`, `package.json`, `docs/`, `README.md` and `ROADMAP.md`.

50 run-artifact files excluded from the reviewed diff.

Headline: the walker keeps the loop counter and the round number apart as the story index states. Every gate runs every round, and `plan_round` closes the round on its gates' recorded verdicts. `start` reads the round evidence from `fw_round_evidence` and falls back to the round's first gate whenever the evidence is incomplete. The self-adopted scripts are byte-identical to their templates. Every plugin citer of `plan_review_rounds.md` is on its roster, after the architecture review's two fixes. Every new shell function has a caller outside its defining file. The accompanying tests are present: walker routing, resume, re-entry, the gate library, the per-round commit path sets and the Gate 12 FR6 grader. The new negative schema fixture and the new check fixture are wired into `package.json`. This review runs no suite; whether the tests pass is for the Run gates phase to establish.

Three findings remain:
- The fix-plan loop's initial-write step resets its round index, so a supervised **rewrite** overwrites the user-review round's earlier round files.
- Two directory READMEs carry counts this branch made stale.

`phases.parity` is `false`, so no parity cross-check ran. `per_task_findings_root` names a folder that does not exist (per-unit review was off), so the Pass 2 reconciliation carried nothing over. The planning rounds' `## Incidental findings (not gating)` sections yielded no leads: no round file on this branch carries one.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Restate `plugin/instructions/README.md`'s instruction-file count and later-added list to include `plan_review_rounds.md` _(layer: plugin)_
2. [x] **Finding 3** — Restate `schemas/negative/README.md` to five `flow-graph-schema-*` negatives and describe `flow-graph-schema-round-without-gates.json` _(layer: general)_
3. [x] **Finding 1** — Make the fix-plan core's step 5 continue `fix_round` from the round files on disk instead of resetting it to 0 _(layer: plugin)_

---

## Must Fix

### 1. A fix-plan rewrite restarts `fix_round` at 0 and overwrites the user-review round's earlier round files
→ [finding_1.md](feat_converging_plan_reviews_code_review/finding_1.md)

---

## Should Fix

### 2. `plugin/instructions/README.md` still counts thirty-one instruction files and omits `plan_review_rounds.md` from the later-added list
→ [finding_2.md](feat_converging_plan_reviews_code_review/finding_2.md)

### 3. `schemas/negative/README.md` still describes four `flow-graph-schema-*` negatives; the new `flow-graph-schema-round-without-gates.json` is unlisted
→ [finding_3.md](feat_converging_plan_reviews_code_review/finding_3.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `devscene.config.json`, so there is no reference implementation to diverge from and this section is empty.
