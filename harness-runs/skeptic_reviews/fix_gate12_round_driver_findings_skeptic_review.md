# Skeptic Review: fix_gate12_round_driver_findings

## Context

**Branch:** `fix_gate12_round_driver_findings`
**Date:** 2026-11-05
**Reviewed:** the whole branch diff, adversarially. Configuration names `dev` as the default branch, but this run copy has no local `dev`, so the diff base was `origin/dev`. The diff covers:

- the preflight's `ssh -G` host-alias acceptance (`scripts/lib/gate12-sandbox-round/preflight.sh`);
- FR3's wrapper-refusal arm and FR6's artifact-gated `placed` clause (`scripts/lib/gate12-sandbox-round/grade-full-run.sh`), and the FR3 `--list` note (`core.sh`);
- the two suites' new cases (`cli/test/gate12-sandbox-round-cli.test.mjs`, `cli/test/gate12-sandbox-round-full-run.test.mjs`);
- the FR3 and FR6 text in `docs/development.md` and `docs/sandbox-verification.md` §10.

10 run-artifact files were excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_gate12_round_driver_findings_code_review.md` and its one finding (the em-dash `commit-on-branch.sh` case, already applied). There is no parity review (`phases.parity` is `false`) and no architecture review for this branch. The lessons ledger carries no entry this review re-raises.

**Headline conclusion.** One net-new finding, and it is Must Fix. FR3's new `commit-on-branch.sh` arm reads the `Run the harness` step log, and no shipped path ever writes a session's commit refusal there. Session output goes to the run's log file through `autonomous-format-stream.sh`, which drops `tool_result` bodies. So FR3 still passes a run whose session commits were refused, while the docs now say it would fail. The other changes checked out:

- **Preflight.** It still refuses any repository other than `--repo`: the slug comparison runs after the alias resolution.
- **FR6.** Its regular-file count agrees with `hr_remote_bundle_restore`'s `PLACED + KEPT` condition.
- **FR3's push arm.** It reads the right step, and the round-13 replay grades as the prompt requires.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — State that FR3's Run the harness log never carries a session's commit-on-branch.sh refusal _(layer: cli, general)_

---

## Must Fix

### 1. FR3's commit-on-branch.sh arm reads a step log that never carries a session's commit refusal
→ [finding_1.md](fix_gate12_round_driver_findings_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Intentional divergences to confirm

_None. `phases.parity` is `false`, and the branch marks no divergence as intentional._
