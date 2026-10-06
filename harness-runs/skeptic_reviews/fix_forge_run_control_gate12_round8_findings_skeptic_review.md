# Skeptic Review: fix_forge_run_control_gate12_round8_findings

## Context

**Branch:** `fix_forge_run_control_gate12_round8_findings`
**Date:** 2026-10-06
**Reviewed:** the whole branch diff against `dev`, adversarially:
- `cli/templates/scripts/remote-run.sh`, `autonomous-watcher.sh`, `push-branch.sh` and `lib/harness-run-lib.sh`;
- `harness-run.yml` and `harness-resume.yml`, and `cli/src/remote/githubActions.ts`;
- `plugin/commands/branch-resume.md`;
- `docs/remote-execution.md`, `docs/github-run-control.md` and `docs/development.md`;
- the `cli/test` suites that ship with them.

34 run-artifact files were excluded from the reviewed diff.

**De-duplicated against:**
- the committed code review `harness-runs/code_reviews/fix_forge_run_control_gate12_round8_findings_code_review.md` and its eight findings, all applied;
- the plan-stage architecture review `harness-runs/architecture_reviews/fix_forge_run_control_gate12_round8_findings/review_0.md`, which covers the fence, `COMMENT_MARKER`, `checks: read`, the notifier vocabulary and the "never fetched" rule;
- `harness-runs/lessons.md`.

`phases.parity` is `false`, so no parity review exists and check 2's parity leg is inert.

**Checks run:**
- **Wiring.** Every new function and global has a live caller: `run_not_started_var`, `forge_dispatch_engine_var`, `control_run_in_flight`, `notify_push`, `poll_state_downloads_put`, `job_runner_wait`, `CONTROL_REPLY_ENGINE` and `REPORT_NOT_STARTED_*`.
- **Runtime addresses.** The jobs, check-run annotations, artifacts and issue-comments REST paths compose correctly.
- **Comment markers.** `forge_marker`'s new single `printf` emits the `started` marker with the same bytes `control_issue_branch_var` matches.
- **Citations.** The gate's §7 step 4 and §11 pointer resolves.
- **Recovery paths.** The first-run resume path is reachable: `fetch` recovers the engine for a branch with no local record, `verb_restore` starts the job as the branch's first, and the engine creates an absent ledger.
- **Control poll.** The overlap-and-floor bound behaves as stated.

**Conclusion:** one net-new defect remains. The runner-wait note sticks for the whole job, so it reappears on every later automatic-resume comment.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else are informational and are never the iteration source.

Each entry resolves to `harness-runs/skeptic_reviews/fix_forge_run_control_gate12_round8_findings_skeptic_review/finding_<K>.md` through its `**Finding K**` reference.

1. [ ] **Finding 1** — Clear the runner-wait note after the job's start-of-job launch, so an automatic resume's `resumed` comment never carries it _(layer: cli, general)_

---

## Must Fix

None.

---

## Should Fix

### 1. The runner-wait note rides on every later automatic-resume comment of the job, blaming GitHub's queue for a restart it did not delay
→ [finding_1.md](fix_forge_run_control_gate12_round8_findings_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

- **Survived check 4: the poller does not report a never-started run.** `docs/remote-execution.md` → `### When GitHub fails or lags` → **Not built** states it, along with the failure it leaves: if `collect` never gets a runner either, nothing reports the run. `docs/github-run-control.md` → `## 8.` carries the same assumption as an unverified row with that consequence. There is also a reason beyond the duplicate-comment one: the poller is enabled only by a usage pause, so it is not a reliable reporter in any case. It is a disclosed limitation, not a fix.
- **Survived check 4: no generic retry around `gh` POSTs.** The non-idempotence reason holds. A retried dispatch or comment can double-write, and the one transient error round 8 met (a push) is covered.
