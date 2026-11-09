# Code Review: fix_untrusted_input_framing_subagents

## Context

**Branch:** `fix_untrusted_input_framing_subagents`
**Date:** 2026-11-09
**Reviewed:** the whole branch diff against the default branch. `dev` does not resolve in this run copy, which carries only `remotes/origin/dev`, so the diff was taken as `origin/dev...HEAD`. The diff covers 34 files:
- the new shared module `plugin/instructions/untrusted_input.md`;
- one-line pointers in 15 agent definitions, 1 command, 2 flow documents, 11 instruction files and 1 sample;
- marker wrapping at the inline answer-relay and docs-blob sites;
- the laundering check in the four plan reviewers;
- the contract test `cli/test/untrusted-input-corpus.test.mjs` and its `treeGuards` registration in `harness.config.json`.

22 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** The canonical module, its roster and the test agree with each other. Every pointer is the pinned sentence, every cited heading resolves, and the corpus test ships registered as a tree guard. This review runs no suite, so whether the tests pass is the Run gates phase's to establish. `phases.parity` is `false`, so no parity cross-check applies.

Three Must Fix findings remain:
- The rule's closed-authority exception omits the mention reader, which the branch points at a rule its own contract cannot obey.
- One inline answer-relay site, the supervised QA flow's step 4, is unwrapped and missing from the scope register, the roster and the test.
- The docs loop drops a `docs-writer` untrusted-instruction report on the PASS path and on the INDEX dispatch.

One Should Fix and two Nice to Have findings cover wording and placement. Pass 2 found no per-unit review folder at the supplied `per_task_findings_root`, so there was nothing to carry over.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 5** — Move `statistics-plan-writer`'s pointer out of the inputs list _(layer: plugin)_
2. [x] **Finding 6** — Move the laundering-check bullet to each plan reviewer's `### Completeness` group _(layer: plugin)_
3. [x] **Finding 4** — Replace "never interprets it" with "never follows it as an instruction" in `## Where a report goes` _(layer: plugin)_
4. [x] **Finding 1** — Add the mention reader's `## Deciding` as the third closed-authority instance in `## The rule` item 2 _(layer: plugin)_
5. [x] **Finding 3** — Record `docs-writer` untrusted-instruction reports on every dispatch, the PASS path and the INDEX included _(layer: plugin)_
6. [x] **Finding 2** — Wrap the supervised QA flow's relayed answers in the markers, and add the site to the roster and the corpus test _(layer: plugin, cli)_

---

## Must Fix

### 1. The rule's closed-authority exception lists two instances and leaves out the mention reader, whose whole job is to act on the comment
→ [finding_1.md](fix_untrusted_input_framing_subagents_code_review/finding_1.md)

### 2. The supervised QA flow still re-dispatches `ui-tests-plan-writer` with the user's live answers inline and unwrapped
→ [finding_2.md](fix_untrusted_input_framing_subagents_code_review/finding_2.md)

### 3. The docs loop records a `docs-writer` untrusted-instruction report only inside step 3's FAIL branch, and never for the INDEX dispatch
→ [finding_3.md](fix_untrusted_input_framing_subagents_code_review/finding_3.md)

---

## Should Fix

### 4. "never interprets it" contradicts the clarification digest, which has to read the ruling it quotes
→ [finding_4.md](fix_untrusted_input_framing_subagents_code_review/finding_4.md)

---

## Nice to Have

### 5. `statistics-plan-writer`'s pointer is a nested bullet that splits the three-item inputs sentence
→ [finding_5.md](fix_untrusted_input_framing_subagents_code_review/finding_5.md)

### 6. The laundering-check bullet sits in an index-only group in `ui-tests-plan-reviewer` and a per-task-file-only group in `task-plan-reviewer`
→ [finding_6.md](fix_untrusted_input_framing_subagents_code_review/finding_6.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section has no call-outs.
