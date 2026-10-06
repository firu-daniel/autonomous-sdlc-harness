# Code Review: fix_forge_run_control_gate12_round9_findings

## Context

**Branch:** `fix_forge_run_control_gate12_round9_findings`
**Date:** 2026-10-06
**Reviewed:** the whole branch diff against `dev` (`defaultBranch`), commits `e03f40c` to `a99b904`, read in three segments.
- **Segment 1, the end-of-job push (Task 1).** The deleted-on-its-remote skip in `cli/templates/scripts/push-branch.sh`, the comment above the `Push the branch` step of `cli/templates/github/workflows/harness-run.yml`, and the new suite `cli/test/push-branch-deleted-upstream.test.mjs`.
- **Segment 2, the stop and park reports (Tasks 2 to 4).** In `cli/templates/scripts/remote-run.sh`: `forge_progress_stopped`, `forge_progress_comment_var`, `forge_gone_prs_var`, `forge_report_text`, `PAUSE_FOLDED_NOTE` and the header paragraphs. Also the `pause_reason` entry of `cli/templates/scripts/autonomous-watcher.sh`'s registry field list, and the edited suites `remote-progress`, `remote-report`, `remote-run` and `remote-control-close`.
- **Segment 3, the record (Tasks 5 to 9).** `docs/github-run-control.md`, `docs/remote-execution.md`, `docs/development.md` (Gate 12 legs (f) and (h), the setup's poller check, and the round 9 record) and `docs/outer-loop-verification.md`.

15 run-artifact files excluded from the reviewed diff.

**What was checked.**
- **Task 1.** The check runs only for a branch that tracks a remote branch, before the bounded retry loop. It treats only `ls-remote` exit 2 as a deletion and exits 0 on every path. It holds for a job's `actions/checkout`, which sets `branch.<b>.merge`. The new suite covers a first push and a branch origin still has as positive controls.
- **Task 2.** The stopped rewrite edits only the bot's progress comment. It matches a task-run marker and a numeric round marker for the same branch only. The cancelled job's own final progress pass is withheld by `remote_branch_stopped`, so it cannot overwrite the rewrite.
- **Task 3.** The pull-request listing for a deleted branch picks only same-repository, unmerged pull requests that still carry `running`, `parked` or `paused`. `harness-control.yml` already grants `pull-requests: write` and `issues: write`.
- **Task 4.** The folded-pause line reads `pause_reason` before `run_job` clears it at the job's end, because `classify_run_exit` sends `notify parked` from inside the run.
- **Tasks 5 to 9.** Task 9's re-grade of the drift block was re-run from `2c01123`, the commit that added the scripts. `cleanup-merged-worktrees.sh` and `autonomous-notify.sh` carry non-comment change, and `commit-on-branch.sh` and `setup-worktree.sh` carry none, which matches the new lists and the count of seven. The new blocks in `docs/remote-execution.md` and Gate 12 put one command in each fenced block.
- **Pass 0.** Half (a)'s sweep list carries no project regexes, so it found nothing. Half (b) found no new exported symbol: the four new shell functions are file-local to `remote-run.sh`, and each has a caller there.
- **Tests.** Every changed behaviour ships with a test case in the edited or new suites. Whether they pass is the Run gates phase's to establish: this review runs no suite.
- **Parity.** `phases.parity` is `false`, so no parity check ran.

Two findings are left: one Should Fix and one Nice to Have.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. That role is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as the sub-step bullets inside a per-finding file, are informational only, and the committer never touches them.

Each entry resolves to `harness-runs/code_reviews/fix_forge_run_control_gate12_round9_findings_code_review/finding_<K>.md`. The list runs from the smallest, safest fix to the widest.

1. [ ] **Finding 2** — Re-wrap the overlong line in `forge_report`'s function comment _(layer: cli)_
2. [ ] **Finding 1** — Give a `park_loop` comment its own folded-pause line, which says the hold continues on `clear`, not on an answer _(layer: cli, general)_

---

## Must Fix

None.

---

## Should Fix

### 1. The folded-pause line on a `park_loop` comment says the run continues once answered, but a hold continues only on `clear`
→ [finding_1.md](fix_forge_run_control_gate12_round9_findings_code_review/finding_1.md)

---

## Nice to Have

### 2. `forge_report`'s function comment carries one line far past the file's comment wrap
→ [finding_2.md](fix_forge_run_control_gate12_round9_findings_code_review/finding_2.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

This section is empty. `phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from.
