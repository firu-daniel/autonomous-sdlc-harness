# Skeptic Review: chore_thin_prose_family_ui_tests_qa

## Context

**Branch:** `chore_thin_prose_family_ui_tests_qa`
**Date:** 2026-10-13
**Reviewed:** the whole branch diff against `dev`, which is five agent definitions in the `plugin` layer: `plugin/agents/ui-tests-plan-writer.md`, `plugin/agents/ui-tests-plan-reviewer.md`, `plugin/agents/qa-tester.md`, `plugin/agents/qa-tester-mobile-maestro.md` and `plugin/agents/qa-tester-mobile-mcp.md`. 16 run-artifact files excluded from the reviewed diff. I de-duplicated against the committed code review `harness-runs/code_reviews/chore_thin_prose_family_ui_tests_qa_code_review.md` and its one finding (the account-index precondition, now fixed at `4e75fe8f`). There is no parity review (`phases.parity` is `false`) and no architecture review for this branch.

**What I checked adversarially.**
- Every narrowed read resolves to a heading that exists, byte for byte:
  - `## Split output spec (mirror the `task-plan-writer` exactly)`;
  - `### Capability guidance (encode this in every test's `**Capability / MCP:**` line)`;
  - `## Which MCP to use (per-test selection rule — follow verbatim)`;
  - `## Preconditions` → **Second browser for performance tests.**
- Each rule deleted from `qa-tester.md` → `## What you must NOT do`, `## How it tests` and `## Output contract` still has another home. This includes every `### 3. A test blocked` route, the PASS/blocked no-write rules, the namespaced per-dispatch names that `plan_orchestration_instructions_core.md` cites by "Per-single-test invocation", and the `mkdir -p` in `### 2.`.
- Every external citation into the five files still resolves. The `ARCHITECTURE.md` stub quote is intact, the "Park the account you drive" lead is kept, and the `QA_DRIVER_IMPLEMENTED` sweep phrase count is unchanged in every file.

**Headline.** One net-new finding. The branch adds a `## Read first` lead sentence shared by the writer and the reviewer, and it contradicts a rule in each of those files. It is graded Should Fix: the rules each file grades by still resolve against the story and task files.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each to `[x]` as its fix lands. `[ ]` markers anywhere else are informational only.

1. [ ] **Finding 1** — Replace the shared `## Read first` lead that rules out every other layer's conventions document _(layer: plugin)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The new shared `## Read first` lead says no other layer's conventions document is needed, which contradicts the writer's `<convention_symbols>` row and the reviewer's backend-name vocabulary rule
→ [finding_1.md](chore_thin_prose_family_ui_tests_qa_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

Empty: `phases.parity` is `false`, and the branch marks no divergence as intentional.
