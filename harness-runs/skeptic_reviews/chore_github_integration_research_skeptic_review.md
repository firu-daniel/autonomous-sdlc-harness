# Skeptic Review: chore_github_integration_research

## Context

**Branch:** `chore_github_integration_research`
**Date:** 2026-09-30
**Reviewed:** the whole branch diff against the default branch `dev`. That is one new file, `docs/github-integration-research.md` (599 lines), in the catch-all `general` layer. 15 run-artifact files were excluded from the reviewed diff. De-duplicated against the committed code review `harness-runs/code_reviews/chore_github_integration_research_code_review.md` and its Findings 1–4, all four already applied. No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch.

Adversarial checks applied to a documentation-only branch:
- **Check 1 (wiring):** nothing to wire.
- **Check 2 (runtime-address leg):** no host or path assembly.
- **Check 3 (citations):** each in-repo citation the document makes was opened and confirmed. These are `docs/remote-execution.md` → `## 2.` (the job does not run `claude-code-action`), `## 5.` (7 inputs), `## 7. Turning it on` step 4 (`claude setup-token`) and `## 11. Security` (*Workflow inputs never become shell source*); `cli/templates/scripts/remote-run.sh` → `REMOTE_INPUT_PAYLOAD_MAX`; the 24,207-character size of `cli/templates/github/workflows/harness-run.yml` (`wc -m`); and `harness-resume.yml` as its own file. All eight refuted-lead quotes trace to `task_6_plan.md`. The §5 route counts match their action lists.
- **Check 4:** nothing marked as an intentional divergence.

**Headline:** one net-new Should Fix. S5 claims that `remote-run.sh`'s payload check "matches" GitHub's count. That claim goes beyond the measurement: only unescaped characters were measured, while every real `answers` payload carries JSON escapes, and `${#payload}` depends on the locale.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Qualify S5's "its check matches" claim to the values actually measured _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. S5 says `remote-run.sh`'s payload check "matches" GitHub's count, but no measurement covered the escaped characters every `answers` payload carries
→ [finding_1.md](chore_github_integration_research_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, and no divergence is marked intentional. This section is empty.
