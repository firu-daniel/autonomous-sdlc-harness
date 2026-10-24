# Code Review: fix_committer_plain_push_call

## Context

**Branch:** `fix_committer_plain_push_call`
**Date:** 2026-10-24
**Reviewed:** the whole branch diff against the default branch `dev`. No local `dev` ref exists in this run copy, so the diff base is `origin/dev`. The diff covers Task 1 (`plugin/agents/committer.md`: the **Once, alone** definition in step 4, and steps 5 and 6 reworded so the verify reads and the push are each their own call), Task 2 (`plugin/instructions/autonomous_pause_and_ledger.md` §1.6: the same definition copied in, and the "newline-separated" permission removed), and Task 3 (the new source guard `cli/test/committer-wrapper-calls.test.mjs`). 6 run-artifact files excluded from the reviewed diff.

The definition sentence matches the story index's wording in both copies once whitespace is collapsed. `### ui_test_pass procedure` steps f–h pick it up by reference with no new words. No constraint from the task prompt is broken: the diff does not touch `push-branch.sh`, `commit-on-branch.sh`, `harness-run-lib.sh` or the generated profile, and the `pushed: yes | no | failed` contract is unchanged. I checked every row of the scope register's `no-change` set and agree with each disposition. The only remaining mention of "newline-separated" is in `plugin/hooks/allow-safe-compounds.sh`'s header, and that one correctly describes the guard's own behaviour. The new suite opens with the rule it enforces, explains why it is a source guard and states what it does not cover. It pins `DEFINITION` as a literal instead of reading it from `committer.md`, and no other `cli/test` suite already quoted `committer.md`, so a new file was the right choice. This review ran no suite; the Run gates phase establishes whether it passes. `phases.parity` is `false`, so no parity cross-check applies. Pass 0 found no new exported symbol and no escape-class hit on the added lines. Pass 2 had no per-unit review folder to reconcile. One finding remains.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Make step 6's "never `<repo_root>`" read "never `<repo_root>` in its place" so it cannot forbid the push's own argument _(layer: plugin)_

---

## Must Fix

_None._

---

## Should Fix

### 1. Step 6's "never `<repo_root>`" reads as forbidding the push's own argument, and as contradicting `<MAIN_REPO>` in a single-checkout run
→ [finding_1.md](fix_committer_plain_push_call_code_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

_Empty: `phases.parity` is `false`, so there is no reference implementation to diverge from._
