# Code Review: chore_github_integration_research

## Context

**Branch:** `chore_github_integration_research`
**Date:** 2026-09-30
**Reviewed:** the whole branch diff against the default branch `dev` (`harness.config.json` → `defaultBranch`). That is one new file, `docs/github-integration-research.md` (599 lines, Tasks 1–6), in the catch-all `general` layer. 10 run-artifact files excluded from the reviewed diff.

The deliverable meets the task prompt's structural acceptance items. All 28 question IDs (S1–S6, T1–T6, C1–C4, A1–A12) have an entry with a verdict. Every non-`unverified` entry carries a dated source with a quote, or a measurement. §5 gives a count for every evaluated route, and each count matches its action list. Each §6 item names its lead and its prompt. No file outside the document changes. A line-by-line comparison against the per-task files found every evidence line verbatim, except four where the implementer changed a code span to double backticks so that its inner backticks render. Those four quotes are unchanged. All 38 in-document anchors resolve. The cited `docs/remote-execution.md` sections exist: `## 5.` (7 inputs), `## 6.` (the 65,535 row), `## 7. Turning it on`, `## 11. Security` and the Gate 12 round 2/3 headings. So do `docs/analyze.md` → `## 3. What it may write` and `remote-run.sh` → `REMOTE_INPUT_PAYLOAD_MAX`. The machine-path grep prints nothing. Whether `bash scripts/run-gates.sh` passes is for the Run gates phase to decide; this review runs no gate. `phases.parity` is `false`, so no parity check applies.

What is left is four Should Fix items, all prose in this one file. Two entries give a `verified` verdict while stating an unverified part, which the document's own rule forbids. One refuted-lead item states corrections that have no evidence. One pointer names a section that does not say what the entry claims. One count reads as wrong without its net-of-API-key basis. Pass 2 carried over one per-unit item and folded one into a Pass 1 finding.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Point A11's consequence at `## 7. Turning it on`, step 4, where `claude setup-token` actually appears _(layer: general)_
2. [x] **Finding 4** — Say that the subscription detour's count in §5 is net of the API-key action it replaces _(layer: general)_
3. [x] **Finding 2** — Trim refuted lead 7 to the part A7's evidence supports _(layer: general)_
4. [x] **Finding 1** — Grade S6 and A6 `partly true`, as the document's own verdict rule requires, in the entries and the summary table _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. S6 and A6 are graded `verified` while their own verdict lines state an unverified part
→ [finding_1.md](chore_github_integration_research_code_review/finding_1.md)

### 2. Refuted lead 7 states two corrections that A7's evidence does not carry
→ [finding_2.md](chore_github_integration_research_code_review/finding_2.md)

### 3. A11's consequence cites `### Every secret and variable` for `claude setup-token`, which that section does not mention
→ [finding_3.md](chore_github_integration_research_code_review/finding_3.md)

### 4. §5's subscription detour lists six steps and says "5 more actions" without saying the figure is net
→ [finding_4.md](chore_github_integration_research_code_review/finding_4.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section is empty.
