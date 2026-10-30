# Skeptic Review: fix_background_agent_wait_ceiling

## Context

**Branch:** `fix_background_agent_wait_ceiling`
**Date:** 2026-10-30
**Reviewed:** the whole branch diff against the default branch `dev`. This run copy has no local `dev` ref, so the base is `origin/dev`. The diff covers 21 files: `hr_run_ledger_state` and the bundle vocabulary in `harness-run-lib.sh`, the wait-ceiling export, `log_stopped_background_tasks`, the ledger split of `classify_run_exit`'s zero-exit arm and job mode's `unfinished)` arm in `autonomous-watcher.sh`, the `autonomous-notify.sh` wording, the four test suites, `branch-status.md`, the consequence clauses in the plugin instructions, `docs/watcher.md`, `docs/remote-execution.md`, `ARCHITECTURE.md`, and the `scripts/` renders. 19 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** the committed code review `harness-runs/code_reviews/fix_background_agent_wait_ceiling_code_review.md` and its five findings, all fixed on the branch. Those findings cover job-mode `usage` / `budget` precedence, `ARCHITECTURE.md`'s `classify_run_exit` row, the `paused_by=usage` claims, the "until a human resumes it" wording and the header alignment. No parity review exists (`phases.parity` is `false`), and no architecture branch review exists for this branch.

**What was verified first-hand, and holds:**

- Both new functions have callers: `hr_run_ledger_state` is called from `classify_run_exit`, and `log_stopped_background_tasks` from `spawn_engine`'s launch subshell.
- The export comes after `watcher.env` and the inherited environment, inside the subshell.
- The flow ledger is created at Setup, before the first dispatch, so the incident shape has a ledger to read (`task_plan_writing_instructions_autonomous.md` → **Create the ledger at Setup.**).
- The docs checklist's box form matches its parse contract.
- The user-review round rule matches the fix-plan fork's re-seed rule.
- `hr_remote_status_write` is the only closed `pause_reason` list in the shipped scripts.
- The QA dev server and the Run gates wrapper are started detached, not as tool background tasks, so the zero ceiling cannot make a finished session wait on them.

**Headline:** one net-new finding. This branch adds two `paused` writes for a session that exited 0 over an unfinished ledger without a `PAUSE_ACK`, so that session wrote no pause note:

- the `unfinished` write;
- job mode's held-reason write, which keeps a pending `user`, `usage` or `budget` pause over `unfinished` (added by the code review's Finding 1, commit `efbe3e4e`).

Every relaunch after either one is still handed the clause naming `PAUSE_PROGRESS.md`. Four paths reach that clause:

- job mode's in-job auto-resume (`job_auto_resume`), after `unfinished`;
- job mode's in-job usage relaunch (`usage_gate` → `resume_paused_run`), after a held `usage` pause;
- a local `/autonomous-sdlc-harness:branch-resume` (`resume_paused_run`), because `spawn_engine` reads `pause_note_stale` only in job mode;
- a later job's `resume pause`, after any of the bundle outcomes `unfinished`, `budget`, `user` or `usage`. That job reads the bundle's `status: paused` as a real pause and keeps a carried note. The reason alone cannot tell a held pause from an acknowledged one, so the fix carries `pause_note_stale` in the bundle.

This reopens the stale-note defect the project's pause-note rule was written to close. The finding fixes all four paths, as `harness-runs/lessons.md` → `## Unattended control loops` requires.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. Each entry resolves 1:1 to `harness-runs/skeptic_reviews/fix_background_agent_wait_ceiling_skeptic_review/finding_<K>.md`. The leading `N.` is the fix order. `K` is the finding's stable number.

1. [ ] **Finding 1** — Give every relaunch after a zero exit over an unfinished ledger the no-note clause (the in-job auto-resume, the in-job usage relaunch, the local resume and the cross-job resume), carrying `pause_note_stale` in the bundle, with the rule's three statements and cases in `watcher-remote-job` and `watcher-ledger-classification` _(layer: cli, plugin, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. Every relaunch after a zero exit over an unfinished ledger is told to read a pause note no pause wrote — the in-job auto-resume, the in-job usage relaunch, the local resume and the cross-job resume
→ [finding_1.md](fix_background_agent_wait_ceiling_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no parity call-outs. No divergence on this branch is marked intentional.
