# Code Review: fix_inbox_drop_branch_refusal

## Context

**Branch:** `fix_inbox_drop_branch_refusal`
**Date:** 2026-11-09
**Reviewed:** the whole branch diff against `defaultBranch` `dev` (taken as `origin/dev`, merge base `4f61eab1`, because this run copy has no local `dev` ref): the new `hr_inbox_branch_refusal_var` in `cli/templates/scripts/lib/harness-run-lib.sh` and its library-header entries (Task 1), its call at the top of `process_inbox_file` in `cli/templates/scripts/autonomous-watcher.sh` with the header's REMOTE DISPATCH bullet, the `routing` hand-test entry, the `reject_preserving_status` comment, and the inbox README template (Task 2), the unit case in `cli/test/outer-loop-scripts.test.mjs` and three intake cases in `cli/test/watcher-remote-dispatch.test.mjs` (Task 3), and `docs/watcher.md` §1 step 2 (Task 4). 6 files, +248/-9. 7 run-artifact files excluded from the reviewed diff.

The refusal does what the task prompt asks. It sits immediately after routing and before the kill switch (`process_inbox_file`'s own `GLOBAL_STOP` check), before the `execution.target` read, the run-log name and any `remote-run.sh sync`. It reuses `hr_branch_is_protected` with no second matcher, maps status 2 to a refusal, and closes the `@{-N}` expansion hole by requiring `check-ref-format --branch` to print back the name it was given. Every accompanying test the prompt names is present: a protected name and two invalid names across all three patterns with a valid drop still launching, a GitHub-bound refusal making no `gh` call, an unresolvable protected set, and the library unit case including `@{-1}` against a fixture with a previous checkout. This review ran no suite; whether the suites pass is the Run gates phase's to establish. Pass 0: the grep half's sweep list is an unfilled stub in this agent's definition, a configuration gap, so it ran nothing. The caller check found one new exported symbol, `hr_inbox_branch_refusal_var`, with its caller outside its defining file (`process_inbox_file`). Leaving this checkout's self-adopted `scripts/` and `harness-runs/autonomous_inbox/README.md` unchanged is deliberate, and recorded in the story's scope register. `phases.parity` is `false`, so no parity cross-check ran. Pass 2: `per_task_findings_root` holds no per-unit review folders, so nothing was carried over. The five findings below are what is left. There is no Must Fix. The two Should Fix findings on the new notification are the most consequential.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Make the intake-refusal notification's remedy correct for the unresolvable-configuration reason _(layer: cli)_
2. [x] **Finding 4** — Restore the `README.md` column alignment in the watcher header's `routing` hand-test entry _(layer: cli)_
3. [x] **Finding 5** — Assert the exit status of the unresolvable-set case's inline watcher pass _(layer: cli)_
4. [x] **Finding 2** — Name `watcher.log` rather than a never-written run log in the intake-refusal notification _(layer: cli)_
5. [ ] **Finding 3** — Restate why the intake refusal sits ahead of the deferring guards so it holds for the unresolvable reason _(layer: cli, general)_

---

## Must Fix

None.

---

## Should Fix

### 2. The intake refusal's notification names a run log that is never written; the reason is in `watcher.log`
→ [finding_2.md](fix_inbox_drop_branch_refusal_code_review/finding_2.md)

### 1. The intake refusal's notification tells the user to rename the branch even when the cause is an unresolvable protected set
→ [finding_1.md](fix_inbox_drop_branch_refusal_code_review/finding_1.md)

### 3. "A property of the name, which no waiting changes" is false for the unresolvable-configuration refusal
→ [finding_3.md](fix_inbox_drop_branch_refusal_code_review/finding_3.md)

---

## Nice to Have

### 4. The watcher header's `routing` test-plan entry for `README.md` lost one column of alignment
→ [finding_4.md](fix_inbox_drop_branch_refusal_code_review/finding_4.md)

### 5. The unresolvable-set watcher case drops its pass's exit status and diagnostics
→ [finding_5.md](fix_inbox_drop_branch_refusal_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section carries no parity call-out.
