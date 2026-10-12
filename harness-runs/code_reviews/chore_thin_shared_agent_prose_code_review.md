# Code Review: chore_thin_shared_agent_prose

## Context

**Branch:** `chore_thin_shared_agent_prose`
**Date:** 2026-10-12
**Reviewed:** the whole branch diff against `dev`: 21 files, 235 insertions and 215 deletions, all in the `plugin` layer.

- Task 1 thinned `plugin/instructions/unit_loop_core.md` → `## The test-run rule`.
- Tasks 2–9 thinned the blocks that agents from more than one family share, in 20 agent definitions. These cover:
  - `## Unsolicited dispatch guidance` and its return-contract pointers
  - the `<docs_root>`, `<docs_retrieval>`, `<state_dir>`, `<repo_root>` / `<app_dir>`, `<parity_vocabulary>` / `<reference_impl>`, `<default_branch>`, `<scripts_dir>`, `<layer_names>`, `<convention_symbols>` and `iteration` rows
  - the docs-retrieval tool bullet
  - the severity ladder, `**Guard carve-out.**` and `**Prose volume — the receiving side.**`
  - the rejected-findings rules on both sides, and the "If there are Must Fix issues" line
- Task 10 added the read-list precedence sentence to ten agents.

16 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**

- **Copies match:** every thinned shared block is byte-identical across its copies. The differences that remain are the per-agent ones the story index lists.
- **Headings intact:** no heading in any changed file was altered.
- **Wire literals intact:**
  - The literals `scripts/lib/flow-walker-gates.sh` parses, `## Rejected findings` and `call stands`, survive in every writer and reviewer that teaches them.
  - The point numbering of `## The test-run rule`, which `layer-implementer.md`, `layer-reviewer.md` and `unit_loop_core.md` cite by point, is preserved.
- **Word counts:** no agent definition's word count rose (checked against `dev`). The test-run rule section fell from 732 to 597 words.
- **Tests:** no test file is in scope. This is a prose-only branch, and whether `cli/test` and `scripts/run-gates.sh` pass is the Run gates phase's to establish.
- **Parity:** `phases.parity` is `false`, so no parity review applies.

**Pass 0.** This project's sweep list has no regexes filled in, so the grep half found nothing. The caller check had no new exported symbols to check, because the diff adds prose only.

**Pass 2.** The per-unit findings root `harness-runs/task_plan_point_reviews/chore_thin_shared_agent_prose_task_plan/` does not exist, so the reconciliation was a no-op.

Two findings remain. One is a behaviour change in the shared steering block, which the task prompt's "Behaviour does not change" constraint forbids. The other is a grammar break that one file's own tail picked up from the thinned shared sentence.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Change "and so are the changed paths" to "and so do the changed paths" in review-plan-reviewer's `<repo_root>` / `<app_dir>` row _(layer: plugin)_
2. [x] **Finding 1** — Restore the steering block's full sanctioned-dispatch scope ("plus what the instruction file … defines") in all ten copies _(layer: plugin)_

---

## Must Fix

### 1. The thinned steering block limits a sanctioned dispatch to "the block", so a prompt an instruction file defines in prose is now graded as steering
→ [finding_1.md](chore_thin_shared_agent_prose_code_review/finding_1.md)

---

## Should Fix

### 2. review-plan-reviewer's thinned `<repo_root>` / `<app_dir>` row leaves "and so are the changed paths" with no predicate to refer back to
→ [finding_2.md](chore_thin_shared_agent_prose_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section holds no parity call-outs.
