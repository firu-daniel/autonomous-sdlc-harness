# Code Review: fix_remote_job_commit_refusal

## Context

**Branch:** `fix_remote_job_commit_refusal`
**Date:** 2026-11-05
**Reviewed:** the whole branch diff against `dev` (taken as `origin/dev`, because this run copy has no local `dev`). That covers 23 files: the new `hr_worktree_config_drop_inert_sparse_var` in `cli/templates/scripts/lib/harness-run-lib.sh` and its caller in `cli/templates/scripts/setup-worktree.sh` (Task 1), the checkout-replay suite `cli/test/setup-worktree-checkout-sparse.test.mjs` (Task 2), the ledger-less reclassification in `classify_run_exit` (Task 3) with its job-mode and local test changes (Tasks 4 and 5, `cli/test/helpers/watcher.mjs` → `finishedLedgerBody`), the `Push the branch` annotation step in `cli/templates/github/workflows/harness-run.yml` and its test (Task 6), the `plugin/commands/branch-status.md` `unfinished` bullet (Task 9), the self-adopted `scripts/` copies (Task 7), and the records in `docs/` and `ARCHITECTURE.md` (Task 8). 14 run-artifact files were excluded from the reviewed diff.

**Headline conclusions.**
- **The fix is sound.** The library removes only the three keys, only when each is set exactly once at the literal `false`, and refuses a symbolic link or a non-regular file. That is the "provably inert shape" the *Trust checks* lesson in `harness-runs/lessons.md` asks for, and `hr_worktree_config_check_var` is unchanged.
- **The reclassification covers both execution modes.** In job mode it routes through the bounded `job_auto_resume`. A first launch keeps `completed`.
- **The copies match.** The self-adopted `scripts/` copies of the library, `setup-worktree.sh` and the watcher are blob-identical to their templates.
- **The scope register closes.** Re-running derivation entry 1 found no site outside the register.
- **Tests and checks.** Every required accompanying test is present. This review runs no suite, so whether they pass is the Run gates phase's to establish.
- **Commits.** Every commit subject is within the cap and carries no trailer.
- **Hygiene.** Added lines name no machine path, and `git diff --check` is clean.
- **Parity.** `phases.parity` is `false`, so no parity review applies.
- **Plugin layer.** The Task 9 `unfinished` bullet in `plugin/commands/branch-status.md` was checked against `.claude/context/plugin.md` and passes clean. *Never paraphrase a wire literal or a cited anchor*: the bullet's quoted log literal `not classifying it completed` matches the watcher's `classify:` log line in `classify_run_exit` byte for byte, in `cli/templates/scripts/autonomous-watcher.sh` and in its blob-identical self-adopted copy `scripts/autonomous-watcher.sh` alike. Its other two quoted literals, `paused (unfinished)` and `stopped background tasks`, match the watcher's log lines too. The bullet's three causes (a resume, a stall restart, an earlier park) are the three values that line's `$why` takes. *No adopter's value is ever a literal here*: the bullet keeps `<state_dir>`, `<MAIN_REPO>` and `<branch>` as placeholders and introduces no adopter literal.

**Pass 0.** The grep half was skipped: the sweep table's regex cells are still the stub, which is a configuration gap to close. The caller check found callers outside the defining file for both new exported symbols: `finishedLedgerBody` in six suites, and `hr_worktree_config_drop_inert_sparse_var` in `setup-worktree.sh`.

**Pass 2.** No per-unit findings were carried over: `harness-runs/task_plan_point_reviews/fix_remote_job_commit_refusal_task_plan/` does not exist.

**What is left** is the five findings below: two Should Fix and three Nice to Have.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 5** — Add the missing space in `const job3 =await` in the remote park-sequence suite _(layer: cli)_
2. [x] **Finding 4** — Name `git --version` when the replay of the checkout's two commands itself fails _(layer: cli)_
3. [x] **Finding 3** — Stream `push-branch.sh`'s output through `tee` in `Push the branch` so a killed step still shows it _(layer: cli)_
4. [x] **Finding 2** — Cite the document of record, not this repository's task prompt, in the new library function's comment _(layer: cli, general)_
5. [x] **Finding 1** — Stop the local `paused` notification for a ledger-less exit from saying "continue from the ledger" _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. A ledger-less resumed exit's local `paused` notification tells the user to "continue from the ledger" that does not exist
→ [finding_1.md](fix_remote_job_commit_refusal_code_review/finding_1.md)

### 2. The shipped library comment cites this repository's task prompt as the source of a measured fact, instead of the document of record
→ [finding_2.md](fix_remote_job_commit_refusal_code_review/finding_2.md)

---

## Nice to Have

### 3. `Push the branch` buffers the wrapper's output to a file, so a cancelled or timed-out step shows none of it
→ [finding_3.md](fix_remote_job_commit_refusal_code_review/finding_3.md)

### 4. The replay's precondition names `git --version` only when the key list differs, not when the replayed commands themselves fail
→ [finding_4.md](fix_remote_job_commit_refusal_code_review/finding_4.md)

### 5. `const job3 =await` is missing a space
→ [finding_5.md](fix_remote_job_commit_refusal_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section has no parity call-outs.
