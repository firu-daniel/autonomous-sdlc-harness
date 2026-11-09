# User-Review Fix Plan: fix_run_job_credential_exposure

## Context

**Branch:** `fix_run_job_credential_exposure`
**Source user review:** `harness-runs/user_reviews/fix_run_job_credential_exposure_review.md`
**Summary:** The user flagged 1 observation. `push-branch.sh` refuses a workflow-file change only in a GitHub job, and it should refuse one in every unattended run. The observation is valid, and the fix also updates the documents the user named.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committer flips each one to `[x]` when that fix's commit lands. Only the committing role flips a marker. `[ ]` markers anywhere else, including the sub-step bullets inside the per-finding files, are informational only and the committer never touches them.

Each entry resolves to a self-contained `harness-runs/user_reviews/fix_run_job_credential_exposure_fix_plan/finding_<K>.md` file through its `**Finding K**` reference. Entries are sorted from lowest blast radius to widest refactor.

1. [x] **Finding 1** — Make `push-branch.sh` refuse a `.github/workflows/` change in every unattended run, not only in a job, through the same refusal record. Retire the job push-credential marker, whose only reader that check was, and say "workflow edits are supervised-only" in `harness-run.yml`'s header, `docs/remote-execution.md` (upgrade note included), `docs/watcher.md` and the other citations. _(layer: cli, general)_

---

## Must Fix

### 1. `push-branch.sh` refuses a workflow-file change only in a GitHub job; a local unattended run still pushes it
→ [finding_1.md](fix_run_job_credential_exposure_fix_plan/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

_None. The single observation was verified against the current tree. In `cli/templates/scripts/push-branch.sh`, the send check is gated on `hr_push_credential_is_job_token "$main_top"`, and the marker that predicate reads is written only by `remote-run.sh push-credential store`._

---

## Source observations

Verbatim copy of `harness-runs/user_reviews/fix_run_job_credential_exposure_review.md`. The implement flow does not re-read that file.

1. Workflow-file changes must be refused by every unattended run, not only in a GitHub job. `push-branch.sh` now refuses a push whose commits change a file under `.github/workflows/` only when it runs in a GitHub job. A local unattended run still pushes such a commit with the operator's own credentials, which may carry the `workflow` scope `init` asks for (`gh auth refresh -s workflow`). Only an attacker would want an unattended run to change CI; an operator who wants a workflow edited makes it in a supervised session. Extend the refusal to every unattended run, local and GitHub alike, through the same refusal record, so the watcher fails the run visibly at the first such push (the wrapper still exits 0). Templates under `cli/templates/github/workflows/` are ordinary files and stay unaffected. Update `harness-run.yml`'s header, `docs/remote-execution.md`, `docs/watcher.md` and the upgrade note to say workflow edits are supervised-only.
