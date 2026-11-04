# Skeptic Review: feat_gate12_sandbox_round_driver

## Context

**Branch:** `feat_gate12_sandbox_round_driver`
**Date:** 2026-11-04

**What was reviewed.** The whole-branch diff against `dev`, taken as `origin/dev...HEAD` because this run copy has no local `dev` branch. It is 22 files:
- the driver `scripts/gate12-sandbox-round.sh` and its eleven libraries under `scripts/lib/gate12-sandbox-round/`;
- the seven `cli/test/gate12-sandbox-round-*.test.mjs` suites and `cli/test/helpers/gate12-round.mjs`;
- the Gate 12 round text in `docs/development.md`;
- `harness-runs/task_prompts/chore_gate12_unroutable_sandbox_rows_task_prompt.md`.

43 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- the committed code review, `harness-runs/code_reviews/feat_gate12_sandbox_round_driver_code_review.md`, Findings 1–7;
- the architecture review, `harness-runs/architecture_branch_reviews/feat_gate12_sandbox_round_driver_arch_review.md`, Findings 1–2.

`phases.parity` is `false`, so there is no parity review and no parity leg.

**What was verified first-hand and holds:**
- **Wiring.** Every subcommand function, grader and plant is reached: `G12_GRADERS`, the `case` dispatch in the entry point, and `g12_need` before each call.
- **Cited sources.** These exist and say what the code claims:
  - `writeProtection.ts` → `protectedPaths`'s `PROFILE_PATH` and `CONFIG_FILENAME` entries, and `jobSurfacePaths` derived from `placeholderProtectedPaths`;
  - the watcher header's *"THE PAUSE NOTE belongs to the run that wrote it"* and *"IT WRITES `remote_status.json`"*;
  - `hr_remote_status_write`'s *"replaces <out_json> by rename"*;
  - `remote-run.sh`'s *"one place a `gh workflow run` of the run workflow is composed"* and its exit map for `status` and `sync`;
  - the two `harness-runs/lessons.md` entries quoted.
- **Matched strings.** Each one the graders match is present in the shipped source:
  - `job: launching run for`, `not launching '<branch>': `, `job: parked stop` (both producers), `job: resuming parked run`, `stall-watchdog: '<b>' -> reset … (restart #` and `-> failed (`;
  - `remote state bundle: skipped <p>: <p> is a symbolic link`, `restored the bundle of run <id> `, `placed <n> planning file(s)`, `wrote answer_<n>.md for`;
  - `The sandbox prerequisites are present.`
- **The JS1 skipped-step check.** Every `run`-job step after `Read the configuration` is gated on `env.SCRIPTS_DIR != ''` or the default `success()`.
- **The default-branch leg.** Its trap is installed before the first change. Teardown deletes only recorded names.

**Headline conclusion.** One net-new defect. Round step 7 never tells the operator to answer SB2's deliberately parked job, so the row's next-job clause is unreachable in a round taken as written. No Must Fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Tell the operator, in round step 7, to answer SB2's parked job so its next job runs _(layer: general)_

---

## Must Fix

None.

## Should Fix

### 1. Round step 7 never tells the operator to answer SB2's parked job, so SB2's next-job clause can never be graded in a round taken as written
→ [finding_1.md](feat_gate12_sandbox_round_driver_skeptic_review/finding_1.md)

## Nice to Have

None.

---

## Intentional divergences that survived the two-leg test (call-outs, not fixes)

- **JS1 is read through `remote-run.sh status`, not `sync`.** The departure is declared on the result line and in `g12_grade_js1`. Leg 1: the row's `sync` reading is not wrong. It refuses a branch with no local record, which a never-synced planted branch is (`remote-run.sh` header exit map, exit 2). Leg 2: there is no sibling grader in this repository that reads a planted branch's record a different way. Please confirm.
- **FR5 is graded on the two steps' conclusions, not their logs.** This is declared through `G12_FR5_DEPARTURE` (code-review Finding 6, applied). `Record the default branch's commit` writes to `GITHUB_ENV`, which its log does not show. Please confirm.
