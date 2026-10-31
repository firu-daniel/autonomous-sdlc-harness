# Code Review: fix_run_analytics_jq16

## Context

**Branch:** `fix_run_analytics_jq16`
**Date:** 2026-10-31
**Reviewed:** the whole branch diff against the default branch. The `dev` ref does not exist in this run copy, so the diff base is `origin/dev`. The diff covers:
- the `latency_row` parameter rename and the widened `# Floor:` headers in both run-analytics `jq` templates (Task 1);
- the new `cli/test/jq-floor.test.mjs` source guard (Task 2);
- the self-adopted `scripts/lib/` copies and the guard's `treeGuards` entry (Task 3);
- Gate 4's by-hand jq 1.6 paragraph in `docs/development.md` (Task 4);
- Task 5's recorded disposition.

8 run-artifact files excluded from the reviewed diff.

**Headline conclusions:**

- **The jq 1.6 defect is fixed.** `$label` is now `$row_label` in both copies, and its callers pass it positionally, so none of them changes. The `scripts/lib/` copies are byte-identical to the templates (checked with `cmp`).
- **Both run-analytics programs use only jq 1.5 builtins.** Every non-comment builtin they call was read. The only post-1.5 names that a grep turns up (`ceil`, `round`, `abs`, `utf8bytelength`) occur in comments.
- **The new tree-reading test is registered** in `harness.config.json` → `treeGuards`, with a `covers` glob matching exactly what it reads.
- **Pass 0:** the sweep's regex table is empty in this agent's stub, so half (a) ran nothing. Half (b) found no new exported symbol: the test exports nothing, and the `jq` change renames a parameter only.
- **Task 5's fixture edit did not land.** The tool layer's `.claude/**` guard refused it. `harness-runs/task_plans/fix_run_analytics_jq16/task_5_plan.md` → `## Disposition` records the one-paste operator remedy, which is the path the task prompt sanctions. I checked that each of the remedy's splice anchors occurs exactly once in the current fixture and README. Pasting it is the story's `Manual setup required` item 2.
- **Tests:** whether the suite passes is the Run gates phase's to establish, because this review runs none. The jq 1.6 container run (`Manual setup required` item 1) is still owed before merge.
- **Parity:** `phases.parity` is `false`, so no parity review ran.

Two findings remain, both Should Fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — State the property the jq-floor scanner checks in its rule sentence and test title, not "parses on jq 1.5 and 1.6" _(layer: cli)_
2. [ ] **Finding 2** — Name Gate 4's hand-run jq 1.6 leg in `scripts/run-gates.sh`'s hand-run block and closing line, and in §5's count sentence _(layer: general)_

---

## Must Fix

None.

---

## Should Fix

### 1. The jq-floor suite's test title and rule sentence claim "parses on jq 1.5 and 1.6", more than the scanner checks
→ [finding_1.md](fix_run_analytics_jq16_code_review/finding_1.md)

### 2. `scripts/run-gates.sh` does not name Gate 4's new hand-run jq 1.6 leg, so a green run reads as Gate 4 done
→ [finding_2.md](fix_run_analytics_jq16_code_review/finding_2.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section is empty.
