# Skeptic Review: fix_sandbox_probe_round1_findings

## Context

**Branch:** `fix_sandbox_probe_round1_findings`
**Date:** 2026-10-27
**Reviewed:** the whole-branch diff against `dev`. No local `dev` branch exists in this checkout, so the diff base is `origin/dev` (merge base `550c981d`). The diff covers 37 files:
- the probe: `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/{core,judge,session,legs-*}.sh`;
- six suites and nineteen fixtures under `cli/test/`;
- Gate 15 in `docs/development.md` and the amended rows in `docs/sandbox-verification.md`.

The diff includes the fix commits for the code review's Findings 1–4 and the architecture review's Finding 1. 29 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- `harness-runs/code_reviews/fix_sandbox_probe_round1_findings_code_review.md` (Findings 1–4);
- `harness-runs/architecture_branch_reviews/fix_sandbox_probe_round1_findings_arch_review.md` (Finding 1).

`phases.parity` is `false`, so there is no parity review, and the parity leg of check 2 is inert.

**What was checked:**
- **Callers.** Every new grading function and teardown helper has a caller.
- **Citations.** The prompt's thirteen defects, §5 F2, §7 OR2 / OR6 and PD1–PD13 all exist and say what the code claims.
- **The `run-test-suite.sh` lane T2 reads.** `<stateDir>/test_run_logs/<sanitized branch>/<label>.{verdict,running,log}`, a `.running` holding the worker's PID, and `.verdict` holding `pass` or `fail <log>`. All of these match the script.
- **`refresh-branch.sh [--local] [<repo-dir>]`.** Matches R4's `--local` call.
- **The row check.** It accepts every `sp_result_line` call site, including `judge -`.

**Headline conclusion:** one net-new defect. The branch's new `sp_untrack_pid` contract, *"so teardown never stops a reused PID"*, is applied to T2's gate worker but not to N3's loopback listener. The listener is stopped mid-leg and then TERMed again at teardown (Finding 1, Should Fix). There is no Must Fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Untrack N3's loopback listener once `sp__net_listener_stop` has stopped it _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. N3's loopback listener stays registered for teardown after the leg has stopped it, so teardown TERMs its PID again, possibly a reused one
→ [finding_1.md](fix_sandbox_probe_round1_findings_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

- **CS7's `Edit` half passes on a permission-layer refusal** (`legs-protection.sh` → `sp__wp_cs7_edit`). W6, in the same file, does not count a `don't ask mode` refusal as the profile's layer. CS7's row measures something different: whether the session can change its own per-run profile under the real launch line, and `dontAsk` is part of that line. Neither leg of check 4 fails. The plan states this and the code follows it.
- **N4 reads every un-refused curl error as `not run`** (`legs-network.sh` → `sp__net_n4_grade`). Curl's error lines cannot tell a refused connect from an unreachable host, which is the case the prompt's defect 6 says to grade `not run`. The row's expected column says the same.
