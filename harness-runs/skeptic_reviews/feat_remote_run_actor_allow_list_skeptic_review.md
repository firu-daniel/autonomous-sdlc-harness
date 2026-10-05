# Skeptic Review: feat_remote_run_actor_allow_list

## Context

**Branch:** `feat_remote_run_actor_allow_list`
**Date:** 2026-10-05

**What was reviewed.** The whole-branch diff against `dev`: 22 files. 24 run-artifact files excluded from the reviewed diff. The review was adversarial: it tested the run-actor gate in `harness-run.yml`, `authorise_actor` and the `repository_dispatch` sender check in `remote-run.sh`, `doctor`'s list grading, and `init`'s report. Each was checked against every route the task prompt says must not spend the owner's credential.

**De-duplicated against:**
- `harness-runs/code_reviews/feat_remote_run_actor_allow_list_code_review.md` and its five findings.
- No parity review exists, because `phases.parity` is `false`.
- No architecture review exists for this branch.

**What was verified clean:**
- **Wiring.** Every new TypeScript export has a caller.
- **Every harness dispatch names `github-actions[bot]`.** Each one is made with `GITHUB_TOKEN`.
- **A refused `run` launches nothing.** It leaves `SCRIPTS_DIR` unset, so every later `always()` and `!cancelled()` step skips.
- **The `warm` job reads no credential.**
- **The cited research findings exist.** G2, G7 and G8 are in the research document.

**Headline.** One Must Fix. The allow-list is checked against the event's sender. A re-run of a `harness-trigger.yml` or `harness-control.yml` job replays the original event, so its sender is still the person who first acted. That job then dispatches `harness-run.yml` as `github-actions[bot]`, which the gate passes. An unlisted writer can therefore spend the owner's subscription by re-running the owner's trigger or command job. The task prompt names re-runs as a route that must be closed.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Hold a trigger or control job's re-runner (`GITHUB_TRIGGERING_ACTOR`) to `HARNESS_RUN_ACTORS` in `remote-run.sh`, with tests and the two doc sentences _(layer: cli, general)_

---

## Must Fix

### 1. A re-run of a trigger or control job lets an unlisted writer spend the credential, because the scripts check the event's original sender
→ [finding_1.md](feat_remote_run_actor_allow_list_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. The plan makes three decisions on purpose. Each was re-graded and holds:

- **A branch deletion is not held to the list.** A stop spends no credential.
- **The poller is unchanged.** It only re-dispatches a run that is already paused for usage.
- **`HARNESS_PUSH_URL` resolves before the gate.** It is a notification URL, not a credential.
