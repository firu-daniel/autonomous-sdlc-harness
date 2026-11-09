# Skeptic Review: fix_untrusted_input_framing_subagents

## Context

**Branch:** `fix_untrusted_input_framing_subagents`
**Date:** 2026-11-09
**Reviewed:** the whole branch diff against the default branch, adversarially. `dev` does not resolve in this run copy, which carries only `remotes/origin/dev`, so the diff was taken as `origin/dev...HEAD`: 35 files, among them the new module `plugin/instructions/untrusted_input.md`, the reader pointers, the marker wrapping at the inline sites, the plan reviewers' laundering check, and the contract test `cli/test/untrusted-input-corpus.test.mjs` with its `treeGuards` entry. 29 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_untrusted_input_framing_subagents_code_review.md` (Findings 1–6, all applied) and `harness-runs/architecture_branch_reviews/fix_untrusted_input_framing_subagents_arch_review.md` (Findings 1–2, all applied). `phases.parity` is `false`, so there is no parity review and check 2's parity leg is inert.

**Verified, no finding:**
- Every heading the module cites resolves: `mode_contract.md` → `### Bindings vs. path placeholders` and rule (5), `run_mode_instructions.md` → `## The closed directive set — …` and `## Conflicts, and what happens on one`, `test-fix-plan-writer.md` → `## Process` step 7's `**Authorised by:**` line, `mention_reading.md` → `## Deciding` / `## Output contract`, and `docs/sandbox-record.md`.
- The mention session can read the module: `remote-run.sh` (`control_mention`) launches it with `--add-dir "$HARNESS_MENTION_PLUGIN_DIR/instructions"`, and `harness-control.yml` sets that directory to the full plugin cloned at the pinned tag.
- The `## Source observations` markers do not break `remote-run.sh`'s `deliver` parse, which uses `## Source observations` only as a terminator.

**Headline conclusion:** one net-new Must Fix. The module sends `layer-implementer`'s untrusted-instruction report to its `## Output contract` item 7, but no unit loop reads that item. `unit_loop_core.md` → `## The unit loop` reads only the implementer's blocker line, so the report is dropped silently. Code-review Finding 3 fixed the same kind of drop for `docs-writer`; this route was not covered.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Carry `layer-implementer`'s untrusted-instruction report onto the unit loop's progress line _(layer: plugin)_

---

## Must Fix

### 1. `layer-implementer`'s untrusted-instruction report goes to output item 7, which no unit loop reads
→ [finding_1.md](fix_untrusted_input_framing_subagents_skeptic_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section has no call-outs.
