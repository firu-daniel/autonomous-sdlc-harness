# Architecture review — fix_sandbox_probe_round1_findings

## Context

Branch `fix_sandbox_probe_round1_findings`, reviewed 2026-10-27. The diff base is `dev`. No local `dev` branch exists in this checkout, so the review used `origin/dev` (merge base `550c981d`), which is the same branch as tracked from the remote. Reviewed: 37 changed files (+1909 / −230). They are the probe under `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/*.sh` (`general`), four new and two edited suites under `cli/test/` with their fixtures under `cli/test/fixtures/sandbox-probe/` (`cli`), and Gate 15 plus the amended rows in `docs/development.md` and `docs/sandbox-verification.md` (`general`). 21 run-artifact files excluded from the reviewed diff.

Headline: the layering holds.
- Every changed file sits in the layer whose path owns it.
- Nothing under `cli/src/`, `cli/templates/` or `plugin/` is touched, so neither shipped half reaches into the other.
- The new suites follow the existing sandbox-probe suites' shape: each opens with the rule it enforces, works under `os.tmpdir()`, and takes fixtures that hold no machine path.
- Each new grading function lives in the leg file whose rows it grades.

One responsibility added on this branch has two homes: stopping a process the probe started. Finding 1 (Should Fix) covers it. There is no Must Fix.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Give stopping a probe-owned process one home in `session.sh` _(layer: general)_

## Must Fix

_None._

## Should Fix

### 1. Give stopping a probe-owned process one home in `session.sh`
→ [finding_1.md](fix_sandbox_probe_round1_findings_arch_review/finding_1.md)

## Nice to Have

_None._
