# Code Review: chore_gate12_unroutable_sandbox_rows

## Context

**Branch:** `chore_gate12_unroutable_sandbox_rows`
**Date:** 2026-11-06
**Reviewed:** the whole branch diff against the default branch, `dev`. This checkout has no local `dev`, so the diff base is `origin/dev`. The diff covers 16 files:
- `hr_remote_status_write`'s link removal and directory refusal, in the template library and in this repository's self-adopted copy, which is byte-identical to the template.
- The Gate 12 round driver's new `source` route, the SB2 `pause-note` arm and its grade, and RJ2's regrade on its refusal (`scripts/lib/gate12-sandbox-round/`).
- The four `cli/test` suites that drive the driver and the status write.
- The prose in `docs/sandbox-verification.md` §10, `docs/development.md` Gate 12, `docs/cli.md` §6 and `docs/remote-execution.md`.

14 run-artifact files excluded from the reviewed diff.

**Headline conclusions:**
- **Tests.** Every changed behaviour lands with cases. The W1–W4 status-write cases grade on what reached the disk, and the docs suite now holds `source` rows to `--list`. This review ran no suite.
- **Recorded cells.** No recorded round 14 or round 15 `Observed` or `Verdict` cell in §10 changed.
- **Cited symbols resolve.** These were spot-checked: `protectedPaths`, its `CONFIG_FILENAME` and `PROFILE_PATH` entries, `placeholderProtectedPaths`, `jobSurfacePaths`, the `.git` protection, `run_profile_check`, `sandbox.filesystem.allowWrite` naming only `{{stateDirAbs}}`, and `scratch-run.sh`'s `mjs:node` row.
- **Premise correction.** No other corpus text still claims a session cannot make a link.
- **Parity.** `phases.parity` is `false`, so no parity review ran.
- **Per-unit reviews.** The per-unit findings root does not exist on disk, so the reconciliation pass carried nothing over.

**Defect.** One grading defect matters: removing SB2's forced `not run` lets SB2 print `pass` while its next-job clause has not run (Finding 1).

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Can the `pause-note` arm's skip line from `hr_remote_bundle_source_ok`, the function that prints it, not from `hr_remote_copy_tree` _(layer: cli)_
2. [x] **Finding 3** — Restore the plain-grade case's total line count at 19 _(layer: cli)_
3. [ ] **Finding 1** — Fold SB2's next-job clause into the row's verdict, after the `pause-note` arm, so a next job not yet run makes SB2 `not run`, and update the grade suite's expectations _(layer: cli, general)_

---

## Must Fix

### 1. SB2 now grades `pass` while its `clarifications` arm's next-job clause is `not run`
→ [finding_1.md](chore_gate12_unroutable_sandbox_rows_code_review/finding_1.md)

---

## Should Fix

### 2. The `pause-note` arm's canned skip line is read out of `hr_remote_copy_tree`, but `hr_remote_bundle_source_ok` prints it
→ [finding_2.md](chore_gate12_unroutable_sandbox_rows_code_review/finding_2.md)

---

## Nice to Have

### 3. The plain-grade case dropped its total line count instead of updating it
→ [finding_3.md](chore_gate12_unroutable_sandbox_rows_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section has no call-outs.
