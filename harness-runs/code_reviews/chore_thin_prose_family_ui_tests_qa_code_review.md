# Code Review: chore_thin_prose_family_ui_tests_qa

## Context

**Branch:** `chore_thin_prose_family_ui_tests_qa`
**Date:** 2026-10-13
**Reviewed:** the whole branch diff against `dev` (merge base `13a2ed4c`, the base the story index names). That is five agent definitions under the `plugin` layer:
- `plugin/agents/ui-tests-plan-writer.md` (Tasks 1–4);
- `plugin/agents/ui-tests-plan-reviewer.md` (Tasks 5–6);
- `plugin/agents/qa-tester.md` (Tasks 7–9);
- `plugin/agents/qa-tester-mobile-maestro.md` and `plugin/agents/qa-tester-mobile-mcp.md` (Task 10).

The diff is 145 insertions and 173 deletions. 14 run-artifact files excluded from the reviewed diff. Task 11 is story-index-only and falls inside that exclusion.

**Headline.** No tests are owed: the branch is prose only and adds no exported symbol, so the Pass 0 caller check had nothing to enumerate. The plugin manifest gate and `cli/test` belong to the Run gates phase, and this review ran neither. Parity is not reviewed, because `phases.parity` is `false`.

**Probe.** The branch's read-only family check probe, `harness-runs/scratch/ui_tests_qa_family_check.mjs`, was run with no arguments and returned `PASS`. It confirms against `13a2ed4c`:
- frozen ten-word windows, shared bold leads, headings, frontmatter, `SHARED` strings and wire literals all hold;
- no file outside the five definitions changed;
- every definition's word count fell, and so did every per-driver up-front figure the story index records.

**Contracts checked by hand:**
- every dispatch block, return literal and cited anchor the scope register lists;
- the narrowed reads — the writer's two sections and `qa-tester.md` → `## Which MCP to use (per-test selection rule — follow verbatim)` — still carry every rule their readers grade or annotate from;
- every rule deleted from `qa-tester.md` → `## What you must NOT do` survives at its other home;
- the stubs' sentences that `ARCHITECTURE.md` quotes are intact.

One behaviour change got through, in the writer's account-precondition wording. It is the single finding below.

**Not this branch's.** Three orchestrator files cite `qa-tester.md`, "Which user", a label the file does not carry; its paragraph is **Which account.** The files are `plugin/instructions/plan_orchestration_instructions_core.md`, `plugin/instructions/plan_orchestration_instructions_autonomous.md` and `plugin/instructions/qa_test_instructions.md`. The citation predates the branch, the story index declares it out of scope, and nothing in this diff touches it, so it is noted here and is not graded.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each to `[x]` as its fix lands. `[ ]` markers anywhere else are informational only.

1. [ ] **Finding 1** — Restore the multi-account condition on the writer's account-index precondition sentence _(layer: plugin)_

---

## Must Fix

### 1. The writer's `### Test data` now makes every account precondition name an account index, which pins tests the qa-tester would run on any free account
→ [finding_1.md](chore_thin_prose_family_ui_tests_qa_code_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

Empty: `phases.parity` is `false`, so there is no reference implementation to diverge from.
