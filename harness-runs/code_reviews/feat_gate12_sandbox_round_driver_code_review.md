# Code Review: feat_gate12_sandbox_round_driver

## Context

**Branch:** `feat_gate12_sandbox_round_driver`
**Date:** 2026-11-04
**Reviewed:** the whole branch diff against `dev` (`origin/dev...HEAD`, 22 files):
- the hand-run driver `scripts/gate12-sandbox-round.sh` and its eleven libraries under `scripts/lib/gate12-sandbox-round/`: the row table, preflight, state file, plumbing plant and dispatch, the per-arm plants, the default-branch leg, the run readers, the three graders and teardown;
- the seven `cli/test/gate12-sandbox-round-*.test.mjs` suites and their shared `cli/test/helpers/gate12-round.mjs` fixture;
- the Gate 12 round's driver paragraphs and restated row table in `docs/development.md`;
- the follow-up task prompt `harness-runs/task_prompts/chore_gate12_unroutable_sandbox_rows_task_prompt.md`.

34 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- Every log line, step name and artifact field the graders match was checked against the shipped source it cites, and matches:
  - `cli/templates/github/workflows/harness-run.yml` (step names, `run-name`, the refusal's `::error::` text, the `if:` gating that skips every step after a refusal);
  - `cli/templates/scripts/autonomous-watcher.sh` (`job: launching run for`, `not launching`, `job: parked stop`, `job: <final> <decision>`, `job: resuming parked run`, the `stall-watchdog:` outcome lines);
  - `cli/templates/scripts/remote-run.sh` (`status_from_github`'s `  state:` line, `saved the bundle of`, `restored the bundle of run`, `placed <n> planning file(s)`, `wrote answer_<n>.md`);
  - `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_remote_copy_tree`'s skip line);
  - `cli/templates/scripts/lib/run-analytics.jq` (`sessions[].tools.items[].permission_denied`).
- The exceptions are FR2's warning form (Finding 2) and FR5's undeclared departure (Finding 6).
- The default-branch leg installs its restore trap before the first change, and teardown deletes only recorded names.
- No measured result is written anywhere: every `## 10.` row stays *not yet measured*.
- Every test the conventions documents require is present: each script task has a suite driving it against a throwaway fixture under the system temp directory. Whether they pass is the Run gates phase's to establish. One existing case is now broken by the architecture-review fix that moved the configuration read onto `harness-run-lib.sh` (Finding 1).
- No new test reads a tree, so no `treeGuards` entry is owed.
- `phases.parity` is `false`, so no parity review ran.
- `per_task_findings_root` (`harness-runs/task_plan_point_reviews/feat_gate12_sandbox_round_driver_task_plan/`) does not exist, so Pass 2 had no per-unit findings to reconcile.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. Each entry resolves to `harness-runs/code_reviews/feat_gate12_sandbox_round_driver_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable identity.

1. [x] **Finding 7** — Drop the unused `export` from `INSTALL_STEP` in the Gate 12 test helper. _(layer: cli)_
2. [x] **Finding 1** — Copy `scripts/lib/harness-run-lib.sh` into the fixture in the copied-script preflight case, so it reaches check 2 again. _(layer: cli)_
3. [x] **Finding 5** — Check `g12_scratch_dir`'s status in `g12_run_dir` and `g12_evidence` before joining on it. _(layer: general)_
4. [x] **Finding 6** — Give FR5's result line the departure that it is graded on step conclusions, not logs. _(layer: general)_
5. [x] **Finding 3** — Reword the exit-2 contract in the header, the usage text and `docs/development.md` to cover a refused `plant` arm. _(layer: general)_
6. [ ] **Finding 4** — Make preflight refuse any checkout carrying `scripts/lib/gate12-sandbox-round/core.sh`, matching its header, with a case. _(layer: cli, general)_
7. [ ] **Finding 2** — Match `##[warning]` in FR2's install-step read, and add a case with a warning line. _(layer: cli, general)_

---

## Must Fix

### 1. The copied-script preflight case now refuses at the run-library check, so its stderr assertion fails
→ [finding_1.md](feat_gate12_sandbox_round_driver_code_review/finding_1.md)

---

## Should Fix

### 2. FR2 looks for the `::warning::` spelling, but a step log shows a warning as `##[warning]`, so FR2 misreports the install step's outcome
→ [finding_2.md](feat_gate12_sandbox_round_driver_code_review/finding_2.md)

### 3. `plant` exits 2, documented as "nothing created", after it has pushed and dispatched other arms
→ [finding_3.md](feat_gate12_sandbox_round_driver_code_review/finding_3.md)

### 4. Preflight check 2 claims to refuse "any copy carrying the script", but it only refuses the checkout the running script sits in
→ [finding_4.md](feat_gate12_sandbox_round_driver_code_review/finding_4.md)

---

## Nice to Have

### 5. `g12_run_dir` and `g12_evidence` join on an unchecked `$(g12_scratch_dir)`, so a failure would make their paths root-relative
→ [finding_5.md](feat_gate12_sandbox_round_driver_code_review/finding_5.md)

### 6. FR5 is graded on the two steps' conclusions, not the step logs its Read from names, and its line declares no departure
→ [finding_6.md](feat_gate12_sandbox_round_driver_code_review/finding_6.md)

### 7. `INSTALL_STEP` is exported from the Gate 12 test helper, but no suite imports it
→ [finding_7.md](feat_gate12_sandbox_round_driver_code_review/finding_7.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section carries no parity call-out.
