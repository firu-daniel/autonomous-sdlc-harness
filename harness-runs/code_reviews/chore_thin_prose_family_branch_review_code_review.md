# Code Review: chore_thin_prose_family_branch_review

## Context

**Branch:** `chore_thin_prose_family_branch_review`
**Date:** 2026-10-12
**Reviewed:** the whole branch diff against `dev` (merge base `433f312c`, the base commit the story index names): 3 files, +82/-90, all in the `plugin` layer. They are `plugin/agents/branch-reviewer.md` (Tasks 1–4), `plugin/agents/skeptic-reviewer.md` (Tasks 1, 5 and 6) and `plugin/agents/review-plan-reviewer.md` (Tasks 7–9). No `cli/` file and no root file changes. 13 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** The thinning keeps every rule, wire and anchor the scope register names, and it lowers each definition's word count.

- **Frozen text.** An independent probe written for this review compared each definition at `433f312c` with the working tree. It checked every 10-word window that also occurs in a non-family agent definition at `433f312c`, the words between two such runs in one sentence, every bold lead another agent carries verbatim, every heading line and each frontmatter block. Nothing is missing. The probe found one span difference, in `review-plan-reviewer`'s `review_path` row: the dropped clause carried the `## Must Fix` / `## Should Fix` / `## Nice to Have` run, and that run still occurs elsewhere in the same file.
- **Task 1's shared blocks.** The implementability paragraph, `**Checkbox discipline.**` and the `## Findings format` lead sentence are byte-identical in `branch-reviewer` and `skeptic-reviewer`. The two `**Re-dispatch on a failed meta-review.**` paragraphs differ only in their own phase and dispatch sentence.
- **Wires.** Every dispatch block and every `Adjust …` sentence is unchanged. So are the reconciliation line ending `skipped M (already covered) and K (stale).` with its "not written into any saved file" clause, the `## Questions` literal, the `verdict:` lines, `### Pass 2` (cited by `plugin/agents/layer-reviewer.md`), each `## Unsolicited dispatch guidance` section, each `## The test-run rule` pointer, each `${CLAUDE_PLUGIN_ROOT}/samples/…` pointer and each `tools:` line.
- **Removed citations.** The only `${CLAUDE_PLUGIN_ROOT}` citations removed are agent-to-agent path citations: `branch-reviewer` → `layer-reviewer`, `skeptic-reviewer` and `review-plan-reviewer`; `skeptic-reviewer` → `review-plan-reviewer`; `review-plan-reviewer` → both writers. No sweep, roster or test depends on them. `git grep` over `cli/test`, `cli/src`, `scripts`, `evals` and `schemas` finds no reference to the family. `plugin/agents/README.txt` names the three files only in its docs-retrieval grant roster, which reads the unchanged `tools:` lines.
- **Removed text quoted elsewhere.** A 7-word-window search found no removed wording that another file quotes as this family's text. Two matches are restatements in their own words: `plan_orchestration_instructions_autonomous.md`'s "degrades to a **no-op**" and `plan_orchestration_instructions_core.md`'s "most prone to false positives". Both behaviours are still stated in the definitions.
- **State-directory READMEs.** The behaviours the READMEs describe all still hold. A reviewer adjusts the files its meta-review names (and now says *only* those files, which matches `cli/templates/state-dir/code_reviews/README.md` in substance). `review-plan-reviewer` takes its family from `review_path` / `findings_dir` (**Stay index-agnostic**). An empty `per_task_findings_root` makes Pass 2 a no-op. The skeptic treats the task prompt, the story index and the reference as claims and emits only net-new findings.
- **Word counts.** `wc -w` gives 5884 → 5183 (`branch-reviewer`), 5099 → 4577 (`skeptic-reviewer`) and 4191 → 3821 (`review-plan-reviewer`). These match the story index's `## Up-front word counts` table. The branch edits nothing under `plugin/instructions/` or `plugin/samples/`, so each up-front count falls by the same amount.

Pass 0 had nothing to sweep. Half (a)'s regex table is an unfilled stub here, and half (b) has no subject: the diff adds no exported symbol, only Markdown prose. `phases.parity` is `false`, so no parity cross-check applies. Whether the suite and `scripts/run-gates.sh` pass is for the Run gates phase to establish. This review runs neither.

**No findings.** Pass 2 reconciliation was a no-op: `harness-runs/task_plan_point_reviews/chore_thin_prose_family_branch_review_task_plan/` does not exist.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` when that fix's commit lands.

_No entries — this review raised no fixable finding._

---

## Must Fix

_None._

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section is empty.
