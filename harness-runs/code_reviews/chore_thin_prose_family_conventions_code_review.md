# Code Review: chore_thin_prose_family_conventions

## Context

**Branch:** `chore_thin_prose_family_conventions`
**Date:** 2026-10-13
**Reviewed:** the whole branch diff against `dev` (merge base `25e2382a`). That covers the thinning of `plugin/agents/conventions-writer.md` (Tasks 1–2), `plugin/agents/conventions-reviewer.md` (Tasks 3–4) and `plugin/commands/harness-analyze.md` (Tasks 5–7). Task 8 was measurement only and touched no tracked source. 11 run-artifact files excluded from the reviewed diff.

**Conclusions.** I compared every hunk with its `dev` text. No rule, edge case, dispatch value, return field or wire literal was lost:

- **Wire literals.** `Reviewer finding not applied — `, `Layer-writer divergence — `, `<!-- harness:unfilled -->`, `<!-- harness:setup-pending -->` and *"Field names byte-stable"* are each still present in every family file that carried them before the branch.
- **Headings and bold leads.** Heading counts are unchanged (7 / 7 / 4). No bold lead was lost; the bold-lead differences between the two versions are only lines re-wrapped mid-paragraph.
- **Fenced blocks and other files.** None of the three files has a fenced block, before or after. No file under `plugin/` outside the three family files changed.
- **The reviewer's narrower read of the writer.** `conventions-reviewer` now reads only `## Scope`, `## The document`, `## The fix dispatch` and `## House rules` of the writer. I checked every writer rule the reviewer still relies on:
  - The census shapes and the rule carve-out that check (9) used to restate are all present in the writer under **Never a census.** and **The carve-out — a claim that *is* a rule stays.** That includes the "count of the differences between two shapes" case and the uniqueness-as-measurement case.
  - The stack-restatement shapes and carve-out are under **Never a restatement of the stack.**
  - The harvested-intent carry-over that check (3) now cites is in the writer's `## Scope` → **Reconciling `harvested_sources` against the code.**
  - The probe exemption that check (7) now points at is in the reviewer's **own** `<scripts_dir>` row, which includes the "no other rule may be derived from that directory" edge case. It does not depend on the writer's `## Resolved values`, which the reviewer no longer reads.
- **Quotes and citations elsewhere.**
  - The writer's dispatch-count sentence that `(4d.0)` quotes as "the receiving contract's own words" still matches.
  - Every passage `.claude/context/plugin.md` quotes is still present.
  - Every `→ ##` citation of the family in `docs/analyze.md` and `docs/development.md` still resolves.
  - No quoted string anywhere else in the repository lost its source.
- **Word counts.** Each file's word count fell: 5097→4373, 5882→4954 and 8297→6790.
- **Tests and parity.** The branch changes no code and no test. The verification bar belongs to the Run gates phase. `phases.parity` is `false`, so no parity review ran.

**Pass 0.** The grep-sweep list in this reviewer's definition is still the unedited stub, so half (a) did not run. Half (b) found no new exported symbol, because the diff is Markdown only.

**Pass 2.** There is nothing to reconcile: the folder `harness-runs/task_plan_point_reviews/chore_thin_prose_family_conventions_task_plan/` does not exist.

The one finding below is cosmetic.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Re-flow the four unwrapped paragraphs in `harness-analyze.md` to the file's hard-wrap width _(layer: plugin)_

---

## Must Fix

None.

---

## Should Fix

None.

---

## Nice to Have

### 1. Four thinned paragraphs in `harness-analyze.md` were left unwrapped against the file's hard-wrapped prose
→ [finding_1.md](chore_thin_prose_family_conventions_code_review/finding_1.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

None. `phases.parity` is `false`, so there is no reference implementation to diverge from.
