# User-Review Fix Plan: fix_linux_sandbox_deny_placeholders

## Context

**Branch:** `fix_linux_sandbox_deny_placeholders`
**Source user review:** `harness-runs/user_reviews/fix_linux_sandbox_deny_placeholders_review.md`
**Summary:** The user wants the placeholder recovery extended to job mode, so a stall kill inside a remote job no longer breaks the rest of that job. The observation is valid, and the current code makes it worse than stated. The watchdog's reset surface-checks the working tree, untracked files included, so a leftover `.claude/settings.local.json` gives the run up as `failed` before the resumed session or the push is reached. The fix is split three ways:

- **Finding 1:** the job-mode manifest and sweep in the watcher and the library.
- **Finding 2:** a post-session sweep step for a job whose watcher is killed along with its session.
- **Finding 3:** the docs, the story index and the self-adopted script copies.

The user's suggestions were checked against the code. Four hold, and the fix keeps them: the manifest under `$RUNNER_TEMP`, the sweep in the KILL tier, the test case, and the docs rewrite. One does not hold, and the fix does not take it: the launch check in job mode. A job renders no per-run copy and omits none of the trio, and its whole `.git` is an exact `denyWrite` directory entry that exists. Finding 1 gives the full reasoning.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker:** the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry resolves to a self-contained `harness-runs/user_reviews/fix_linux_sandbox_deny_placeholders_fix_plan/finding_<K>.md` via its `**Finding K**` reference. The order runs from lowest blast radius to widest, with the catch-all layer last.

1. [ ] **Finding 1** — Extend the absent-path manifest (under `$RUNNER_TEMP`) and the leftover sweep to job mode. The sweep runs at the head of the job's `spawn_engine` arm, in the stall watchdog's KILL tier before the recovery's copy check and reset, at `run_job`'s exit, and in a job-mode start-up recovery. No launch check is added. Job-mode tests come with it. _(layer: cli)_
2. [ ] **Finding 2** — Add a `job-sweep` watcher subcommand and a `Sweep the sandbox placeholders` workflow step before `Push the branch`, so a cancelled or timed-out job still pushes. _(layer: cli)_
3. [ ] **Finding 3** — Rewrite `docs/cli.md` §6 residual 12's **Job mode** item and the story index's `## Context` job-mode bullet to describe the job-mode coverage. Re-scope the *"outside job mode"* statements in `docs/cli.md` and `docs/watcher.md`, name the new step in `docs/remote-execution.md`, and refresh the self-adopted `scripts/` copies. _(layer: general)_

---

## Must Fix

### 1. A stall kill inside a job leaves placeholder leftovers that break the rest of that job, because the manifest and the sweep skip job mode
→ [finding_1.md](fix_linux_sandbox_deny_placeholders_fix_plan/finding_1.md)

### 3. The docs and the story index still say job mode is a goal case the branch does not meet, and the self-adopted scripts lag the templates
→ [finding_3.md](fix_linux_sandbox_deny_placeholders_fix_plan/finding_3.md)

---

## Should Fix

### 2. A job whose watcher is itself killed (a `stop` cancel, a step timeout) still hands `Push the branch` a leftover `<scriptsDir>/.git`
→ [finding_2.md](fix_linux_sandbox_deny_placeholders_fix_plan/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

No observation was invalid. One of the user's sub-suggestions was checked against the code and is not taken. It is recorded here so the user can check the reasoning:

- **Observation 1, suggestion 3: "Check whether the launch check … applies in job mode."** It does not apply, so no launch check is added in job mode.
  - **Nothing is omitted in a job.** The bubblewrap route drops the exact `denyWrite` entries for `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` only from a clone's per-run copy (`run_profile_entries`). Job mode renders no per-run copy and passes the base profile (`spawn_engine` → `settings_file="$SETTINGS_PROFILE"`). The base carries the trio rows only under the sibling-run-copy glob, which names no path in a job's checkout.
  - **The trio stays sandbox-refused.** The job's run copy is its main checkout, and the base profile write-denies that checkout's whole `.git` as one directory (`cli/src/generators/writeProtection.ts` → `protectedPaths`, "`objects reach it only through sync-in's fetch`"). The directory exists, so bubblewrap mounts no placeholder for it, and a sandboxed write to any trio file under it stays refused. That is owed as `docs/sandbox-verification.md` CS6's *"`git add <file>` refused … under `<job>/.git`"*.
  - **The checks have nothing to catch.** `hr_run_copy_check_var` on a job takes the main-checkout arm, which has no clone condition 3, and `hr_wrapper_main_of` already refuses a `commondir` in a main `.git`.

---

## Source observations

1. Job mode is left out of the placeholder recovery, and it should be covered. The branch skips job mode in the sweep, the launch check and the start-up recovery (Task 4, Task 11), and Task 9 documents the gap: a job-mode stall-watchdog kill leaves the job checkout's absent `denyWrite` paths behind as read-only empty files, and the leftover `<scriptsDir>/.git` makes `commit-on-branch.sh` in the resumed session and the job's post-session `push-branch.sh` refuse for the rest of that job. That means the fix does not reach remote CI jobs, which are where adopters run on Linux. I want the recovery extended to job mode, so a stall kill inside a job no longer breaks the rest of that job.

   Suggestions for the fix plan to verify against the code, not constraints — keep what holds, replace what does not, and say why:
   - Write the job's manifest somewhere a job can write, for example under `$RUNNER_TEMP`, since the machine state directory is off in job mode.
   - Run the sweep in the job-mode stall watchdog's KILL tier, before its reset and resume, and consider whether the start of a job's session or the post-session `push-branch.sh` step needs the same sweep.
   - Check whether the launch check (the planted `commondir` / `config.worktree` / `http-alternates` refusal before launch and resume) applies in job mode, where the run copy is the main checkout and has no clone trust files of its own.
   - Add a job-mode case to `watcher-placeholder-host.test.mjs`.
   - Rewrite Task 9's **Job mode** item in `docs/cli.md` §6 and the story index's `## Context` bullet that lists job mode as a goal case not met, so they describe what the branch then does.
