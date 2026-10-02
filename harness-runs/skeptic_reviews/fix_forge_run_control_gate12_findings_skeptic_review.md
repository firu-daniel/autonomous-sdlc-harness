# Skeptic Review: fix_forge_run_control_gate12_findings

## Context

**Branch:** `fix_forge_run_control_gate12_findings`
**Date:** 2026-10-02
**Reviewed:** the whole-branch diff against `dev` (27 files, +2537/−265), adversarially. Items 7, 12, 9, 11, 1, 5 and 2 were read from their hunks in `cli/templates/scripts/autonomous-watcher.sh`, `cli/templates/scripts/remote-run.sh`, `cli/templates/scripts/lib/harness-run-lib.sh`, `cli/templates/github/workflows/harness-run.yml`, `harness-control.yml` and `cli/src/remote/githubActions.ts`. The plugin and `docs/` edits were read too. 36 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- `harness-runs/code_reviews/fix_forge_run_control_gate12_findings_code_review.md` and its six findings, all applied.
- `harness-runs/lessons.md`.

No branch-level architecture review exists for this branch. Only the plan-time `harness-runs/architecture_reviews/fix_forge_run_control_gate12_findings/review_0.md` exists, and its findings were folded into Tasks 5, 8, 9 and 20. Parity is off (`phases.parity: false`), so there is no parity review, and check 2's parity leg is inert.

**What was verified first-hand and holds:**
- **Check 1 (callers):** every new function has a caller on the path that needs it.
  - `top_level_answered_pairs` is called by `spawn_engine`, at every launch in local and job mode, before the spawn.
  - `classify_run_exit` archives the union and clears `launch_answered_set`.
  - `hr_remote_move_aside` is called by `run_job` and `hr_remote_bundle_restore`.
  - `pause_note_stale` is written by `run_job`, read by `spawn_engine` in job mode, and cleared by the job-mode pause arm.
  - `remote_branch_exists` is called by `continue_redispatch`, `continue_wait_poller`, `poll_branch` and `control_close`.
  - `github_default_branch_var` and `forge_issue_at_commit_var` are reached from `verb_stop --branch-gone` and `forge_report`.
  - `control_status` and `control_close` are routed from `verb_control`.
- **Item 7 across job boundaries:** the High's sequence was traced by hand, park → answer → pause → resume, then the stop-and-cancel variants. The launch set is re-derived from the restored channel each job, so the answered pair is archived on the completing job's exit, with nothing carried in `status.json`.
- **Check 3 (citations):** "finding 5", "finding 6" and "finding 8" of Round 6 match the task prompt's item map (items 8, 9 and 12). `remote_branch_stopped` does read `list_all_runs`, which takes no `--branch` filter. That is what the `stop` exemption from the ref check and the default-branch deletion marker rely on.
- **The item 2 mapping:** `|| [ $? -eq 2 ]` sees the script's own status. `EXIT_USAGE` is 1, so a usage error still fails the step.

**Headline:** one net-new finding. A close of a run's pull request that has a merge conflict starts no job, so it stops nothing, while §5 says every close stops the run.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else (sub-step bullets inside the per-finding files) are informational only.

1. [x] **Finding 1** — Record that closing a conflicting pull request starts no job and stops nothing, with the way on, in §5, §8 and the control workflow's header _(layer: cli, general)_

---

## Must Fix

None.

---

## Should Fix

### 1. Closing a run's pull request that has a merge conflict starts no `pull_request` job, so it stops nothing, but §5 says every close stops the run
→ [finding_1.md](fix_forge_run_control_gate12_findings_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

Check 4's two-leg test was applied to the plan's own decisions, and none of them fails it:
- Item 8 is accepted and documented, with Development-panel linking as a proposal.
- Item 10 takes option (d).
- Item 9 fails fast rather than rewriting the lookups, with `stop` exempt.
- Items 4, 13 and 6 are split off to roadmap item 19.

Each is authorised by the task prompt's own wording: the fixes are *"candidates, not instructions"*, item 8 says *"Or accept it"*, item 10 says *"keep the current behaviour, (d)"*, and *"If the plan judges the whole set too large … proposes a split"*. No project precedent sets a different convention. A `parked` report with no open question now ends in an `::error::` line, with no comment and no label. In job mode, after Task 1, that classification is no longer reachable by the observed route, and it is listed here for the maintainer to confirm rather than as a fix.
