# Skeptic Review: chore_gate12_unroutable_sandbox_rows

## Context

**Branch:** `chore_gate12_unroutable_sandbox_rows`
**Date:** 2026-11-06

**Reviewed:** the whole branch diff against the default branch, `dev`. This checkout has no local `dev`, so the diff base is `origin/dev`. The diff covers 16 files:
- `hr_remote_status_write`'s link removal and directory refusal, in both copies.
- The Gate 12 driver's `source` route, the SB2 `pause-note` plant and grade, and the RJ2 regrade through `g12_refused_arm`.
- The four driver and status-write suites under `cli/test`.
- The documentation in `docs/sandbox-verification.md` §10, `docs/development.md` Gate 12, `docs/cli.md` §6 and `docs/remote-execution.md`.

19 run-artifact files excluded from the reviewed diff.

**De-duplicated against** the committed code review `harness-runs/code_reviews/chore_gate12_unroutable_sandbox_rows_code_review.md` and its three findings: SB2's next-job fold, the `pause-note` skip line's source function, and the 19-line count. No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch.

**Checked first-hand and found sound:**
- **Wiring.** The `pause-note` arm reaches `g12_plant_sb2` through `g12_plant_files`, and its run reaches `g12_sb2pn_read` through `g12_arm_run SB2 pause-note`. The `source` loop in `g12_grade_state` is reached.
- **The `pause-note` route, against the shipped sources.**
  - `scratch-run.sh` runs a `.mjs` under `<stateDir>/scratch/`.
  - `allowWrite` names the state directory.
  - In job mode the session runs in the job's checkout (`run_job` → `worktree="$MAIN_REPO"`), the same root `verb_save` reads.
  - `hr_remote_bundle_source_ok` prints `skipped <root>/<state>/PAUSE_PROGRESS.md: <same> is a symbolic link`, which matches the grader's leaf and `p1 = p2` test.
  - Nothing after the session reads or moves the pause note before `Save the state bundle`.
  - The relative link target composes to the root token file.
- **`hr_remote_status_write`.** It removes only the link itself (`rm -f`, no trailing slash), refuses only a real directory, and still writes.
- **Cited symbols.** `protectedPaths`' `CONFIG_FILENAME` and `PROFILE_PATH` entries, `jobSurfacePaths` derived from `placeholderProtectedPaths`, and `run_profile_check` all resolve.

**Headline conclusion:** one net-new Must Fix. SB3's rewritten source-read row names a second ground, that the session's processes write only under `sandbox.filesystem.allowWrite`. That is false, because the session's working directory, the job's checkout, is also a write root. The corpus's own AP6 and `docs/remote-execution.md` say so.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Drop SB3's false `allowWrite` ground from its `--list` note, the restated table, the step 7 bullet and the §10 row, keeping `protectedPaths` as the ground _(layer: general)_

---

## Must Fix

### 1. SB3's source-read grounds claim the session writes only under `allowWrite`, but the session's cwd, the job's checkout, is a write root too
→ [finding_1.md](chore_gate12_unroutable_sandbox_rows_skeptic_review/finding_1.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation, and no divergence was marked intentional. Nothing survives check 4 to call out. The `restore` rename onto a linked `autonomous_logs/remote_status.json` is left unchanged and is declared in `docs/cli.md` §6 residual 1, item 4, as the story plan states. It is a stated residual, not a finding.
