# Code Review: fix_forge_run_control_gate12_round10_findings

## Context

**Branch:** `fix_forge_run_control_gate12_round10_findings`
**Date:** 2026-10-07
**Reviewed:** the whole diff against `dev`, task by task:
- Task 1: `remote-run.sh control --needs-agent`. It adds the shared `control_gates`, `control_needs_agent` and `control_needs_agent_no` functions, a parser case, usage text and header/REPRO text in `cli/templates/scripts/remote-run.sh`, and the new suite `cli/test/remote-control-needs-agent.test.mjs`.
- Task 2: the `Decide whether the comment needs the agent` step and the gated `if:`s in `cli/templates/github/workflows/harness-control.yml`, with the updated `cli/test/workflow-templates.test.mjs`.
- Task 3: `docs/github-run-control.md` §1, §6 and §8.
- Task 4: `docs/development.md` Gate 12, (xiv)(j) and (xv)(d)/(d′).

9 run-artifact files excluded from the reviewed diff.

**Headline conclusions:**
- **Tests.** Every test the `cli` conventions require is present. The new suite opens with its rule, builds its fixtures under the system temp directory, and ties the `--needs-agent` reason to plain `control`'s reply for the same refusal. This review runs no suite.
- **The gate refactor.** It preserves `control`'s refusal texts, their order and exit 2.
- **The workflow step.** It fails open: anything but exit 2 installs as before. The act step stays the authority.
- **Coverage of the gate.** The exact-form arms need no agent binary, plugin or Node. The job-level `env:` gives the new step the same `HARNESS_RUN_ACTORS`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_ALLOWED_BOTS` and `GH_TOKEN` that the act step reads.
- **Parity.** `phases.parity` is `false`, so no parity review ran.
- **Pass 0.** The grep sweep list is still the unfilled stub, so half (a) found nothing. The diff adds no TypeScript export, so half (b) had nothing to check.
- **Findings.** The three below are all in the Gate 12 procedure Task 4 wrote.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Add the `gh run view <run id> --log` command to Gate 12 (xv)(d), whose pass condition reads the `needs-agent:` log line. _(layer: general)_
2. [x] **Finding 3** — Narrow (xiv)(j)'s **What it settles** to the first clause of the new `$GITHUB_OUTPUT` row. _(layer: general)_
3. [ ] **Finding 1** — Make Gate 12 (xiv)(j) step 11 fail a `Grep` or `Glob` result that names `outside.txt`, and pass a confined result that is not a refusal. _(layer: general)_

---

## Must Fix

### 1. Gate 12 (xiv)(j) step 11 grades a `Grep` or `Glob` breach as neither pass nor fail
→ [finding_1.md](fix_forge_run_control_gate12_round10_findings_code_review/finding_1.md)

---

## Should Fix

### 2. Gate 12 (xv)(d) requires the `needs-agent:` log line but fetches no log
→ [finding_2.md](fix_forge_run_control_gate12_round10_findings_code_review/finding_2.md)

### 3. Gate 12 (xiv)(j) claims steps 1 and 10 settle a clause neither step exercises
→ [finding_3.md](fix_forge_run_control_gate12_round10_findings_code_review/finding_3.md)

---

## Nice to Have

None.

---

## Intentional divergences to confirm

None. `phases.parity` is `false`, so there is no reference implementation to diverge from.
