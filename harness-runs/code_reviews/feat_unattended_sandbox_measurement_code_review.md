# Code Review: feat_unattended_sandbox_measurement

## Context

**Branch:** `feat_unattended_sandbox_measurement`
**Date:** 2026-10-27
**Reviewed:** the whole branch diff against `origin/dev`. The configured `defaultBranch` is `dev`, and this checkout has no local `dev` ref, so the diff base is the remote-tracking `origin/dev`. In the `general` layer: the probe entry point `scripts/sandbox-probe.sh` and its thirteen libraries under `scripts/lib/sandbox-probe/` (Tasks 1-12 and 19), the new and re-targeted rows in `docs/sandbox-verification.md` (Task 16), Gate 15 in `docs/development.md` §5 (Task 17), and the gate-count edits in `docs/development.md` and `scripts/run-gates.sh` (Task 18). In the `cli` layer: the three new suites `cli/test/sandbox-probe-judge.test.mjs`, `cli/test/sandbox-probe-shell.test.mjs` and `cli/test/sandbox-probe-git-and-legs.test.mjs`, with their fourteen stream fixtures (Tasks 13-15). 31 run-artifact files excluded from the reviewed diff.

The constraints hold. No row records a measured result, and every new row says *not yet measured*. No profile, generator, wrapper, guard or watcher file is edited. No test launches `claude`. The probe sources the watcher and the run library rather than copying them. The gate-count derivation entries 1-3 in the story index were re-run, and every hit is either brought in line or carries a stated `no-change`. The new suites execute the probe rather than reading a tree of repository files as text, so no `treeGuards` entry is owed. `phases.parity` is `false`, so no parity review ran. Whether the suites pass is for the Run gates phase to establish: this review ran none of them.

The `harness-runs/lessons.md` rule that a script creating a temporary working copy or branch removes it on every exit path and never removes one it did not create holds for every clone and branch the probe makes. On removal, `sp_setup` calls `scripts/lib/sandbox-probe/session.sh` → `sp__install_trap` (the `EXIT` / `INT` / `TERM` traps) before `sp__register_clone` and `sp__create`. Every `sp_extra_clone` and fixture branch is created after that. `sp_teardown`'s *"Every step runs after a failed one"* contract walks every registered clone, registry record, per-run profile and branch on the success, failure and signal paths, and its `trap '' INT TERM` keeps a second signal from cutting the teardown short. On creation, `sp_setup` and `sp_extra_clone` refuse a branch that `sp__branch_taken` finds locally or on origin. `--existing` adopts only a branch already registered through `sp_track_branch`, and `legs-refresh.sh` → `sp__rf_fixture` runs `sp__branch_taken` before it calls `sp_track_branch`. Every `sp_track` call site either checks that its path did not exist before, or names a path inside a probe-created clone or `SP_TMP`. `sp_rm_tree` refuses any directory whose canonical path `"is not under SP_TMP"`. The one gap is outside the clones and branches: the temp area `SP_TMP` is created in preflight before any trap exists, so an interrupt there leaves it behind (finding 9).

The nine findings below are where the probe would print a verdict its own row contradicts, where a shipped pointer does not resolve, or where the probe leaves something behind. Five of them would make the person running Gate 15 record the wrong result.

Pass 2 ran against `harness-runs/task_plan_point_reviews/feat_unattended_sandbox_measurement_task_plan/`, which does not exist: per-unit review was off, so there was nothing to carry over.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 5** — Cite roadmap item 21 instead of the in-tree-unresolvable "sandbox3b" wherever the Linux legs are deferred _(layer: cli, general)_
2. [x] **Finding 4** — Make SR2 pass only on its `sbx_sr2_refused` line, and fail on an `sbx_sr2_written` line _(layer: general)_
3. [x] **Finding 3** — Grade S1's permission-layer refusal as the pass its row records, not `not run` _(layer: general)_
4. [x] **Finding 6** — Count only a permission-layer answer as a W7 failure _(layer: general)_
5. [x] **Finding 7** — Put CS8's marker at the row's `$HOME/sbx_cs8_marker`, not under the probe's temp area _(layer: general)_
6. [x] **Finding 2** — Read the SSH proxy refusal `This proxy requires authentication` as the network layer, so R4 is not failed on its expected outcome _(layer: cli, general)_
7. [x] **Finding 8** — Assert that Gate 15's leg table matches `sandbox-probe.sh --list` _(layer: cli)_
8. [x] **Finding 1** — Keep the probe clone and its profiles alive for the headless-parity script, and run its network step on the network scratch profile _(layer: general)_
9. [ ] **Finding 9** — Release the probe's temp area on an interrupt or early exit before `sp_setup` installs its teardown trap _(layer: general)_

---

## Must Fix

### 1. The headless-parity script cannot be followed: its clone is already torn down, and its network step runs on a profile that denies `curl`
→ [finding_1.md](feat_unattended_sandbox_measurement_code_review/finding_1.md)

### 2. R4 is failed on its expected outcome when the SSH proxy refusal reads `This proxy requires authentication`
→ [finding_2.md](feat_unattended_sandbox_measurement_code_review/finding_2.md)

### 3. S1 prints `not run` for the permission-layer refusal its row records as `pass`
→ [finding_3.md](feat_unattended_sandbox_measurement_code_review/finding_3.md)

### 4. SR2 prints `pass` with no `sbx_sr2_refused` line, against its row's Expected
→ [finding_4.md](feat_unattended_sandbox_measurement_code_review/finding_4.md)

### 5. The Linux-legs deferral cites "sandbox3b", which resolves to nothing in the tree, instead of a numbered roadmap item
→ [finding_5.md](feat_unattended_sandbox_measurement_code_review/finding_5.md)

---

## Should Fix

### 6. W7 counts a sandbox-layer string in a gate's own output as a failure, though W7 grades permission denials only
→ [finding_6.md](feat_unattended_sandbox_measurement_code_review/finding_6.md)

### 7. CS8's marker sits under the probe's temp area rather than at the `$HOME` path its row names, an unnamed departure
→ [finding_7.md](feat_unattended_sandbox_measurement_code_review/finding_7.md)

### 9. An interrupt during preflight leaves the probe's temp area behind: no trap covers `SP_TMP` until `sp_setup` installs one
→ [finding_9.md](feat_unattended_sandbox_measurement_code_review/finding_9.md)

---

## Nice to Have

### 8. Nothing checks Gate 15's restated leg table against `SP_LEGS`
→ [finding_8.md](feat_unattended_sandbox_measurement_code_review/finding_8.md)

---

## Intentional divergences to confirm

None. `phases.parity` is `false`, so there is no reference implementation to diverge from.
