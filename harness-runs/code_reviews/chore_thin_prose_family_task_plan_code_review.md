# Code review — chore_thin_prose_family_task_plan

**Context.** This review covers branch `chore_thin_prose_family_task_plan`, reviewed 2026-10-12 against `dev` (merge base `8c519ab6`, whose two family files are byte-identical to the plan's `4cbe7f72` baseline). The branch thins `plugin/agents/task-plan-writer.md` (6335 → 4249 words) and `plugin/agents/task-plan-reviewer.md` (5776 → 4247 words), and moves `plugin/samples/sample_task_plan.md` from an up-front read to an on-demand one in both. Those two files are the whole reviewed diff. 14 run-artifact files were excluded from the reviewed diff. I compared both definitions sentence by sentence against the baseline.

What holds:
- Every anchor the story index lists survives byte for byte. That includes `## Revision mode` with its rejected-findings line formats and `call stands`, the `## Scope register` and `## Rejected findings` headings, the `**Scope closure:**` and `**Conventions-document prohibition:**` labels, the `## Corpus staleness` heading with `stale-rule` / `undescribed-layer`, both prompt blocks and the five reviewer dispatch keys, both citations of `unit_loop_core.md` → `## The test-run rule`, and the writer's step numbers 1–9.
- Every frozen line the per-task files enumerate is intact.
- The Task 8 word counts reproduce exactly.

What fails:
- A cross-agent probe of the baseline's dropped sentences against the other 26 agent definitions finds two shared blocks the thinning forked: the unreadable-input blocker paragraph (Finding 1) and the writer's third `## Resolved values` intro sentence (Finding 2). `.claude/context/plugin.md` → `## Writing agent prose` requires both to stay byte for byte.
- The story-point scale lost two calibration examples that changed what the writer splits (Finding 3).
- The reviewer's new pointer at the writer's `**Scope closure:**` bullet is a new input that its blocker rule does not cover (Finding 4).

No test or gate was run, because none is in scope for a branch-level review. `phases.parity` is `false`, so this review has no parity conclusion. Pass 0 found nothing: the grep-sweep half has no regexes configured for this repository, and the caller check has no exported symbols to check in a Markdown-only diff. `per_task_findings_root` does not exist on disk because per-unit review was off, so Pass 2 had nothing to reconcile.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Restore the shared unreadable-input blocker wording in both family definitions _(layer: plugin)_
2. [x] **Finding 4** — Cover the writer definition in the reviewer's unreadable-input blocker rule _(layer: plugin)_
3. [ ] **Finding 2** — Restore the shared `## Resolved values` placeholder sentence in the writer _(layer: plugin)_
4. [ ] **Finding 3** — Restore the multi-file split-signal examples in the writer's story-point scale _(layer: plugin)_
5. [ ] **Finding 5** — Restore the committing-role clause in the writer's readiness lead-paragraph rule _(layer: plugin)_

## Must Fix

### 1. Restore the shared unreadable-input blocker wording in both family definitions
→ [finding_1.md](chore_thin_prose_family_task_plan_code_review/finding_1.md)

### 2. Restore the shared `## Resolved values` placeholder sentence in the writer
→ [finding_2.md](chore_thin_prose_family_task_plan_code_review/finding_2.md)

## Should Fix

### 3. Restore the multi-file split-signal examples in the writer's story-point scale
→ [finding_3.md](chore_thin_prose_family_task_plan_code_review/finding_3.md)

### 4. Cover the writer definition in the reviewer's unreadable-input blocker rule
→ [finding_4.md](chore_thin_prose_family_task_plan_code_review/finding_4.md)

## Nice to Have

### 5. Restore the committing-role clause in the writer's readiness lead-paragraph rule
→ [finding_5.md](chore_thin_prose_family_task_plan_code_review/finding_5.md)

## Intentional divergences (call-outs)

None. `phases.parity` is `false`, so this review has no reference implementation to diverge from.
