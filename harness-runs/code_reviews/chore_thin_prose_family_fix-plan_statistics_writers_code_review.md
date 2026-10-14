# Code Review: chore_thin_prose_family_fix-plan_statistics_writers

## Context

**Branch:** `chore_thin_prose_family_fix-plan_statistics_writers`
**Date:** 2026-10-13
**Reviewed:** the whole branch diff against `dev` (merge base `13a2ed4c`, the base commit the story index names): 3 files, +68/-89, all in the `plugin` layer. They are `plugin/agents/user-review-fix-plan-writer.md` (Tasks 1–2), `plugin/agents/test-fix-plan-writer.md` (Task 3) and `plugin/agents/statistics-plan-writer.md` (Tasks 4–5). No file under `cli/`, `plugin/instructions/`, `plugin/samples/` or the repository root changes. 9 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** The thinning keeps every rule, wire and anchor the story index names, and each definition's word count goes down.

- **Frozen text.** This review ran its own probe against `13a2ed4c`. It checked every 10-word window, inside one blank-line-delimited paragraph, that also occurs in a non-family agent definition at `13a2ed4c`: 825 in `user-review-fix-plan-writer`, 394 in `test-fix-plan-writer` and 172 in `statistics-plan-writer`. All of them are still present in the working tree. Every bold lead and every heading line is unchanged, in order. So is every fenced block: the dispatch prompts, the log marker lines, both `awk` pipelines, the arm greps, the `git log` command and the return blocks. No frontmatter line changed.
- **Wires and anchors.** `user-review-fix-plan-writer`'s `## Process` step 6 still carries the ledger append and its initial-write-only rule, which `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` cites as *"→ step 6"*. The `**Review comments:**` line and bullet suffix, the `comments=` quality check and `## Out of scope / verified-OK` are byte-identical. So is `test-fix-plan-writer`'s **Rewrite machine paths before quoting.** bold lead, which `plugin/agents/architecture-reviewer.md` cites twice. The `**Failing test:**` and `**Suspected shared cause:**` lines, `## Not fixable on this branch`, `## Source failures` and `## Quality checks before returning` are unchanged too. Both fix-plan writers still point at `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, whose `**Who may cite this.**` roster lists them both. The statistics weights `15` / `5` / `2`, the formula, the `record disposition of ` substring with its ` — ` delimiter, and the five parsed return lines are all intact.
- **Removed sentences.** Every rule a removed sentence carried is still stated somewhere else in the same file. `statistics-plan-writer`'s missing-story-index rule is in `## Output contract`'s `error:` block. The per-task points, `dispositioned_points` tokens and per-observation weight evidence are in `## Output` → `## Counts breakdown`. `test-fix-plan-writer`'s unreadable-input `blocker:` rule is in its frozen `**A cited path you cannot read…**` paragraph. `user-review-fix-plan-writer` had three Read-on-demand bullets for cited artifacts. They are now one pointer to `## Process` step 2, which still carries the latest-suffix and cited-round selection rules. The quality checks it dropped are each a restatement of a step 3 or step 4 rule. A search for the removed wording found no other file quoting it as this family's text.
- **The sample read.** `test-fix-plan-writer` now consults the user-review fix-plan sample only for a split-format question its own text leaves open. Every index section, readiness-entry form and per-finding field the test fix plan carries is spelled out in `## Process` step 6. The sample-pointer demand (`plugin/agents/README.txt` → `Sample fixture pointers`) still resolves.
- **Word counts.** `wc -w` gives 4005 → 3390 (`user-review-fix-plan-writer`), 2391 → 2251 (`test-fix-plan-writer`) and 2928 → 2053 (`statistics-plan-writer`). These match the story index's `## Up-front word counts` table. No read file changed, so every up-front count goes down.

Pass 0 had nothing to sweep. Half (a)'s regex table is an unfilled stub here, and half (b) has no subject: the diff adds only Markdown prose, no exported symbol. An extra sweep of the added lines for line coordinates, machine paths and the literal state directory found nothing. `phases.parity` is `false`, so no parity cross-check applies. This review runs neither the suite nor `scripts/run-gates.sh`; whether they pass is for the Run gates phase to establish.

**No findings.** Pass 2 reconciliation was a no-op: `harness-runs/task_plan_point_reviews/chore_thin_prose_family_fix-plan_statistics_writers_task_plan/` does not exist.

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

## Intentional divergences from the reference implementation

_None — `phases.parity` is `false`._
