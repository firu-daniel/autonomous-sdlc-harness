# Architecture review — feat_gate12_sandbox_round_driver

## Context

**Branch and scope.** Branch `feat_gate12_sandbox_round_driver`, reviewed 2026-11-04, iteration 0. The diff base `dev` was resolved as `origin/dev`, because this run copy has no local `dev` branch. The reviewed diff is 22 files:
- **`general` layer:** the hand-written driver `scripts/gate12-sandbox-round.sh` and its eleven libraries under `scripts/lib/gate12-sandbox-round/`, the Gate 12 round text in `docs/development.md`, and the follow-up task prompt under `harness-runs/task_prompts/`.
- **`cli` layer:** seven suites under `cli/test/gate12-sandbox-round-*.test.mjs`, and the shared fixture `cli/test/helpers/gate12-round.mjs`.

31 run-artifact files were excluded from the reviewed diff.

**What already conforms.** Placement follows the `scripts/sandbox-probe.sh` + `scripts/lib/sandbox-probe/` precedent:
- the driver is hand-written and outside `cli/templates/`;
- every file opens with `#!/usr/bin/env bash`;
- `set -u` is set only at the entry point, and the libraries set no shell option;
- no recursive removal is shelled out;
- dispatch goes through the Gate 12 repository's own `remote-run.sh` rather than composing `gh workflow run`;
- neither shipped half is reached at run time;
- the tests use throwaway fixtures under `os.tmpdir()` and build on `cli/test/helpers/fixture.mjs` rather than copying it.

**Headline conclusion.** One responsibility gets a second home. The driver hand-rolls its read of the Gate 12 repository's `harness.config.json` and its state-directory path join. The sibling `scripts/lib/harness-run-lib.sh` already owns both, and the model this branch names sources it for exactly that purpose. The hand-rolled copies already differ from it.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — The round driver re-derives the Gate 12 configuration read instead of using `harness-run-lib.sh`'s readers _(layer: general)_
2. [x] **Finding 2** — The scratch root is joined by hand instead of through `hr_state_path` _(layer: general)_

## Must Fix

### 1. The round driver re-derives the Gate 12 configuration read instead of using `harness-run-lib.sh`'s readers
→ [finding_1.md](feat_gate12_sandbox_round_driver_arch_review/finding_1.md)

### 2. The scratch root is joined by hand instead of through `hr_state_path`
→ [finding_2.md](feat_gate12_sandbox_round_driver_arch_review/finding_2.md)

## Should Fix

None.

## Nice to Have

None.
