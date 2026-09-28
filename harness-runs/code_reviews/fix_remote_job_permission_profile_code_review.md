# Code Review: fix_remote_job_permission_profile

## Context

**Branch:** `fix_remote_job_permission_profile`
**Date:** 2026-09-28
**Reviewed:** the whole branch diff against `dev` (20 files, 971 insertions, 219 deletions). This covers:
- the runtime-root `Read` grant and the `permissions.additionalDirectories` grant in `cli/src/generators/permissionProfile.ts` (Tasks 2, 3);
- the managed `.gitignore` rule for the profile and `init`'s rewritten notes (Tasks 1, 3);
- `doctor --remote-job`, `profile-tracked` and the linked-worktree profile resolution through `cli/src/core/git.ts` → `mainWorktreeRoot` (Tasks 12, 4, 5);
- the job's `doctor --remote-job` preflight (Task 6);
- the job-mode `--add-dir` extras in `autonomous-watcher.sh` → `spawn_engine` (Task 7);
- the single-producer `cli/src/core/defaultBranchPush.ts` (Tasks 4, 11);
- the documentation in `README.md`, `ARCHITECTURE.md`, `docs/cli.md`, `docs/development.md` and `docs/remote-execution.md` (Tasks 8–10).

21 run-artifact files excluded from the reviewed diff.

Every behaviour the branch adds has a test that drives the compiled CLI or the watcher against a throwaway fixture. The GitHub-sourced marketplace case the task prompt's acceptance criteria require has one on both sides: `init --plugin-root-entries` in `cli/test/init.test.mjs`, and `doctor --remote-job` in `cli/test/doctor.test.mjs`. This review ran no suite; whether the tests pass is for the Run gates phase to establish. The new exports all have a caller outside their defining file: `defaultBranchPushCommand`, `defaultBranchPushReason`, `WORKFLOW_SCOPE_COMMAND`, `WORKFLOW_SCOPE_REASON`, `mainWorktreeRoot`, `pluginRootDirectories` and the widened `buildCheckContext`. `grep "no-verify origin" cli/src` finds the spelling only in `core/defaultBranchPush.ts`, as the story index intends. `mainWorktreeRoot` mirrors `harness-run-lib.sh` → `hr_main_repo` line for line. The Pass 0 grep sweep's regex list is an unfilled stub in this configuration, so half (a) found nothing by construction. The mechanical sweep for `console`, `process.exit`, `shell: true`, `rm -rf` and `git add -A` over the added lines was clean. `phases.parity` is `false`, so no parity review ran.

One cross-unit consequence of the gitignore decision reaches a plugin asset that the branch's scope register did not enumerate: Finding 1. The other four findings are wording in the CLI's own report text and documents. Two-pass mode: the per-unit findings root holds only its `README.md`, so Pass 2 had nothing to reconcile.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, such as sub-step bullets inside a per-finding file, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry resolves to `harness-runs/code_reviews/fix_remote_job_permission_profile_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable identity.

1. [ ] **Finding 2** — Name `profile-tracked` among the checks `--remote-job` moves, in `doctor --help` and three doc comments _(layer: cli)_
2. [ ] **Finding 5** — Stop `profile-tracked`'s pass text claiming the profile is ignored _(layer: cli)_
3. [ ] **Finding 3** — Give the `plugin-permissions` failure a job remedy under `--remote-job` instead of "init does not generate them" _(layer: cli)_
4. [ ] **Finding 1** — Point `qa-tester`'s `browser_route` grant check at the main checkout's profile _(layer: plugin)_
5. [ ] **Finding 4** — Re-render the workflows by deleting them and running a plain `init`, not `init --force` _(layer: general)_

---

## Must Fix

### 1. `qa-tester` checks `browser_route` against a profile that a run's worktree no longer has
→ [finding_1.md](fix_remote_job_permission_profile_code_review/finding_1.md)

---

## Should Fix

### 2. `doctor --help` and three doc comments say `--remote-job` moves two checks; it moves three
→ [finding_2.md](fix_remote_job_permission_profile_code_review/finding_2.md)

### 3. Under `--remote-job`, the `plugin-permissions` failure says `init` does not generate the entries and tells the operator to paste lines into a job's profile
→ [finding_3.md](fix_remote_job_permission_profile_code_review/finding_3.md)

### 4. The upgrade step in `docs/remote-execution.md` §7 re-renders the workflows with `init --force` and does not say what else that replaces
→ [finding_4.md](fix_remote_job_permission_profile_code_review/finding_4.md)

---

## Nice to Have

### 5. `profile-tracked`'s pass text says the profile is ignored, which the check never tests
→ [finding_5.md](fix_remote_job_permission_profile_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section records no parity call-out.
