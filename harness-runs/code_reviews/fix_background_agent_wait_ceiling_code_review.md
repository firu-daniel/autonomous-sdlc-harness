# Code Review: fix_background_agent_wait_ceiling

## Context

**Branch:** `fix_background_agent_wait_ceiling`
**Date:** 2026-10-30
**Reviewed:** the whole branch diff against the default branch `dev`. No local `dev` ref exists in this run copy, so the base is `origin/dev`. The diff covers 21 files. The `cli` layer has `hr_run_ledger_state` and the bundle's `unfinished` vocabulary in `cli/templates/scripts/lib/harness-run-lib.sh` (Task 1); the `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` export and `log_stopped_background_tasks` in `spawn_engine` (Task 2); the ledger split of `classify_run_exit`'s zero-exit arm and the `pause_reason` hygiene (Task 3); job mode's `unfinished)` arm (Task 4); and the `autonomous-notify.sh` wording. Its tests are the two new suites, `watcher-background-wait.test.mjs` and `watcher-ledger-classification.test.mjs`, plus additions to `ledger-phases.test.mjs` and `watcher-remote-job.test.mjs`. The `plugin` layer has `branch-status.md` (Task 5) and the consequence clauses in §2.0, §2.5, the five autonomous forks and the plan core's G.1 (Task 6). The `general` layer has `docs/watcher.md`, `ARCHITECTURE.md`, `docs/remote-execution.md` (Tasks 7–8) and the `scripts/` renders (Task 9). 13 run-artifact files excluded from the reviewed diff.

Every accompanying test the task prompt's goal 5 asks for is present. The launch environment is covered with an inherited value and with a `watcher.env` value. Finished, unfinished and absent ledgers are covered for the task, user-review and docs engines, along with the stale user-review round, the order against park and pause, the stopped-agents line, and the job-mode arm with its user-pause precedence. Each new suite's header records the mutation that turned it red. This review ran no suite; whether the tests pass is for the Run gates phase to establish. Neither new suite reads this tree, so neither owes a `treeGuards` registration.

The three `scripts/` copies have the same blob ids as their templates (`git ls-tree HEAD`). Both new shell functions have callers outside their own definitions: `hr_run_ledger_state` is called from `classify_run_exit`, and `log_stopped_background_tasks` from `spawn_engine`. The Pass 0 grep sweep has no regexes configured for this project, so only its caller-check half ran. Parity does not apply (`phases.parity` is `false`). No per-unit review files exist under the supplied `per_task_findings_root`, so Pass 2 had nothing to carry over.

Two findings are Must Fix:

- In job mode, the new `unfinished` arm keeps only a `user` reason. A pending `usage` or `budget` pause is overwritten and then deleted by the auto-resume (Finding 1).
- `ARCHITECTURE.md` still states, as shipped fact, that classification ends on the exit code and that completion survives an engine change untouched (Finding 2).

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. Each entry resolves 1:1 to `harness-runs/code_reviews/fix_background_agent_wait_ceiling_code_review/finding_<K>.md`. The leading `N.` is the fix order. `K` is the finding's stable number.

1. [x] **Finding 5** — Restore the registry field list's `log_path` row alignment in the watcher header, and re-copy `scripts/autonomous-watcher.sh` _(layer: cli, general)_
2. [x] **Finding 4** — Drop "until a human resumes it" / "awaiting human resume" from the five autonomous forks and the plan core's G.1 clause (c) _(layer: plugin)_
3. [x] **Finding 2** — Add the zero-exit ledger read to `ARCHITECTURE.md`'s `classify_run_exit` row, its negative-result paragraph and operation 7 _(layer: general)_
4. [ ] **Finding 3** — Correct the "carries no `paused_by` / only `branch-resume` resumes it" statements for a local `unfinished` pause the usage gate had requested _(layer: cli, plugin, general)_
5. [ ] **Finding 1** — Keep a pending `usage` or `budget` pause over `unfinished` in job mode, in the `PAUSE_ACK` arm's order, with two `watcher-remote-job` cases _(layer: cli, general)_

---

## Must Fix

### 1. In job mode a zero exit over an unfinished ledger overwrites a pending `usage` or `budget` pause, so `job_auto_resume` deletes that PAUSE and relaunches the run
→ [finding_1.md](fix_background_agent_wait_ceiling_code_review/finding_1.md)

### 2. `ARCHITECTURE.md` still states that `classify_run_exit` branches on four signals and that completion survives an engine change untouched
→ [finding_2.md](fix_background_agent_wait_ceiling_code_review/finding_2.md)

---

## Should Fix

### 3. The header and the docs say a local `unfinished` record carries no `paused_by` and only `branch-resume` resumes it, which is false when the usage gate had requested a pause
→ [finding_3.md](fix_background_agent_wait_ceiling_code_review/finding_3.md)

### 4. The corrected consequence clauses say an `unfinished` pause waits "until a human resumes it", but in a GitHub job it is auto-resumed
→ [finding_4.md](fix_background_agent_wait_ceiling_code_review/finding_4.md)

---

## Nice to Have

### 5. The registry field list's `log_path` row lost one space of its alignment
→ [finding_5.md](fix_background_agent_wait_ceiling_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section holds no parity call-outs.
