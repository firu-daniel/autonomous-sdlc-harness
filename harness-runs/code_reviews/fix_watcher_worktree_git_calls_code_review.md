# Code Review: fix_watcher_worktree_git_calls

## Context

**Branch:** `fix_watcher_worktree_git_calls`
**Date:** 2026-10-14
**Reviewed:** the whole diff against `dev`, in 27 files. 26 run-artifact files were left out of the reviewed diff.

What the diff covers:
- **The run library's hardened primitives** (`cli/templates/scripts/lib/harness-run-lib.sh`): the copy check, the pinned runners, the trusted base from `ls-remote`, the surface check, the fast-forward, the reset, the plumbing artifact commit and `hr_git_env_drop`.
- **The scripts moved onto those primitives:** the watcher's review drop, artifact commits and stall watchdog; `create-worktree.sh` in both modes and `setup-worktree.sh --target`; `remote-run.sh review` and `start`; `cleanup-merged-worktrees.sh`'s removal guard.
- **The two wrappers' `GIT_*` drop**, now taken from the library.
- **`doctor --job-surfaces`**, with `copySurfacePaths` and `jobSurfacePaths` in `cli/src/generators/writeProtection.ts`.
- **The `harness-run.yml` refusal and the record step.**
- **The eight changed or new test suites, and `docs/cli.md`, `docs/watcher.md` and `docs/remote-execution.md`.**

Pass 2 had nothing to reconcile: the `per_task_findings_root` holds no per-unit review folders.

Every exposed call that the inventory names has a planted-payload case, and each of those cases records its `RED ONCE` mutation. Whether the cases pass is for the Run gates phase to establish; this review ran no suite. `phases.parity` is `false`, so there was no parity review.

The one Must Fix comes from a probe this review ran. The working-tree side of the surface check judges a copy through the run's own index. So does the watchdog's `read-tree --reset`. That index is sandbox-writable, and a skip-worktree bit in it hides a session-written protected file from both. The exposure therefore rests on the Linux worktree glob, which the task prompt forbids the design to rely on. The other two findings are documentation and wording.

**Convention checks with no finding.** Each check below was run against the diff and passed. Each names the conventions-document section it comes from.

- **`cli`, the `git` monopoly** (`.claude/context/conventions.md` → `### Where a new responsibility goes`). The new `git` reads `mergeBase`, `fileAtRef`, `commitResolves` and `changedPathsBetween` live in `cli/src/core/git.ts`. `cli/src/doctor/checks.ts` → `JOB_SURFACES_CHECK` imports them and adds no `git` invocation of its own. Each read uses a fixed argument vector and refuses a revision that starts with `-` (`looksLikeOption`).
- **`cli`, `doctor` asks, grades and repairs nothing, and the error classes** (`.claude/context/cli.md` → `## How a module in this layer is written`). `JOB_SURFACES_CHECK` writes nothing and reaches no network. It reads the configuration through `config/io.ts` → `loadConfigText` and the path set through `writeProtection.ts` → `jobSurfacePaths`, so nothing is a second copy. Every condition it reports comes back as a `fail` or an `unevaluated` result, which `runChecks` turns into the exit status. `cli/src/commands/doctor.ts` → `parseJobSurfaces` and `parseOptions` reject a bad or combined `--job-surfaces=` value with an ordinary `HarnessError` that names the option. That is an adopter-fixable refusal, so it never goes through `internal()`.
- **`cli`, the test bar** (`.claude/context/cli.md` → `## What "done" means here`). `cli/test/doctor-job-surfaces.test.mjs` → `originFixture` builds a bare origin and a clone under `tmpdir()` and tears them down in `t.after`. It drives the compiled CLI through `runCli`. The bytes-on-disk rule binds a refused write, and `doctor --job-surfaces` writes nothing, so its cases correctly assert on the exit status. The suite opens with its rule and a `RED ONCE` list (`.claude/context/conventions.md` → `## The testing bar`).
- **`cli`, module headers** (`.claude/context/cli.md` → `## Naming and file layout` and `## What "done" means here`, "A reviewer holds a change to its module's own header"). Each changed `cli/src/` module either keeps its header's stated rule or amends the header in the same diff:
  - `core/git.ts` adds the three-reads paragraph. The new functions are read-only, so the header's "two exceptions" claim about mutation still holds.
  - `core/json.ts` adds `parseJsonText` as the one parse.
  - `config/io.ts` stays "the only place that checks `harness.config.json`".
  - `doctor/checks.ts` says why `JOB_SURFACES_CHECK` sits beside `CHECKS` rather than in it.
  - `commands/doctor.ts` adds the `JOB_SURFACES_FLAG` bullet.
  - `generators/writeProtection.ts` declares its one shell mirror, `hr_run_protected_rel_paths` in `cli/templates/scripts/lib/harness-run-lib.sh` (its own header: "A mirror this header does not declare is a defect"). `cli/test/outer-loop-scripts.test.mjs` → `hr_run_protected_rel_paths is copySurfacePaths` holds the two equal.
- **`cli`, the shell rules** (`.claude/context/conventions.md` → `## Shell assets`). The added lines of `harness-run-lib.sh` contain no `set`, `shopt` or `trap`. A sweep of the added lines under `cli/templates/scripts/` found no 4.x construct: no associative array, case-folding expansion, `mapfile`, `readarray`, nameref, `|&`, `&>>` or `coproc`. The library header's `BASH 3.2 IS THE FLOOR` paragraph still holds. The one array expansion that is new, `"${paths[@]}"` in `hr_run_surface_check_var`, sits behind that function's empty-set refusal, so `set -u` under bash 3.2 never meets an empty array. `hr_commit_placed` and `stall_job_surfaces_ok` remove their temporary directories with `rm -rf` inside the script. The "never shell out to a recursive removal" rule is about a command string that a permission deny can match, and a removal inside a wrapper script is not such a string. The shipped `cli/templates/scripts/remote-run.sh` on `dev` already removes this way.
- **`general`, documents of record** (`.claude/context/conventions.md` → `## Documents of record`). The one measured fact the diff adds is `docs/cli.md` §6 residual 1, item 5. It names the git version (2.50.1, Apple Git-155), the commands (`git read-tree --reset -u HEAD`, `git cat-file -p`, `git fsck --full`) and the exact message (`hash-path mismatch, found at: .git/objects/<xx>/<rest>`, exit `3`). Residual 1's items 1 to 4 and the two residuals in `docs/remote-execution.md` §11 each state an exposure that stays open, with its reason. None of them puts off content to later work, so none owes a roadmap item. The §11 bullet "The check on a real GitHub job is a post-release follow-up, not yet run" is a hand-run verification step that the task prompt (**The GitHub part needs a release, not `dev`.**) and the story plan (**The post-release GitHub check**) require. It does not defer a deliverable. Its precedent is `docs/sandbox-verification.md` → `## 5. Failures and their follow-ups`, which records follow-ups without a roadmap number.
- **`harness-runs/lessons.md`: "A script that creates a temporary working copy or branch removes it on every exit path…"**
  - `create-worktree.sh --existing` sets `existing_undo` on `EXIT`, and `exit 2` on `HUP`/`INT`/`TERM`, straight after `worktree add --no-checkout`. That removes the copy on every refusal until the population, and deletes the local branch only when `local_existed` is `0`, so it never removes one this run did not create. The copy left in place after a failed bootstrap is the deliverable, not a temporary copy, and the script header states why it is kept. `dev` already carries that behaviour.
  - `stall_job_surfaces_ok` captures the status of its `mktemp -d` scratch subshell into `rc` and removes the scratch directory before it returns, on success and failure alike.
  - `hr_commit_placed` removes its temporary index directory before its first post-write check, on both branches of the `read-tree`/`update-index` test.
- **`harness-runs/lessons.md`: "Every automatic retry in an unattended path is bounded…"** The watchdog's resume is still bounded by `STALL_MAX_RESTARTS`. The diff adds new give-up routes in `check_stalled_runs`: a refused copy check, a failed `stall_job_surfaces_ok`, or a `hr_run_reset_var` return of `1`. Each sets the record `failed`, sends exactly one `notify failed` naming the cause and the log path, and does not resume. A reset that fails after its check passed still resumes, but it increments `stall_restarts`, so it counts against the same cap.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 3** — Point the watcher header's job-mode bullet at `JOB MODE` without the wrong direction word. _(layer: cli)_
2. [ ] **Finding 2** — State that `remote-run.sh save` follows a session-planted symbolic link and uploads its target. _(layer: general)_
3. [ ] **Finding 1** — Judge the copy's working tree on the protected set through a fresh index, in both `copy` and `reset` mode. _(layer: cli, general)_

---

## Must Fix

### 1. The working-tree side of the surface check, and the watchdog's reset, trust the run's own index, so a skip-worktree bit hides a session-written protected file
→ [finding_1.md](fix_watcher_worktree_git_calls_code_review/finding_1.md)

---

## Should Fix

### 2. `remote-run.sh save` is classified as reading state files "as data", but it follows a session-planted symbolic link and uploads the target
→ [finding_2.md](fix_watcher_worktree_git_calls_code_review/finding_2.md)

### 3. The watcher header points at "JOB MODE above", but that section is below
→ [finding_3.md](fix_watcher_worktree_git_calls_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section is empty.
