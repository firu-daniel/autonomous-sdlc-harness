# Code Review: fix_sandbox_worktree_record_writes

## Context

**Branch:** `fix_sandbox_worktree_record_writes`
**Date:** 2026-10-19
**Reviewed:** the whole branch diff against `dev` (`git diff dev...HEAD`), 33 files.

- **`cli`:** the rebuilt `commit-on-branch.sh` and the `hr_commit_paths_var` / `hr_run_blob_var` core it shares with `hr_commit_placed` in `lib/harness-run-lib.sh`; the `runsUnsandboxed` flag, the `doctor` message and the write-protection header; the profile template's `_README`; the watcher comment; the two new suites, `commit-on-branch-target-check.test.mjs` and `commit-on-branch-plumbing.test.mjs`; and the edited profile and doctor suites.
- **`plugin`:** the committer, implementer and reviewer contracts; every commit point moved to the `<MAIN_REPO>` spelling; the `git mv` and bare `git add` replacements.
- **`general`:** `docs/cli.md`, `docs/watcher.md`, the two verification records, and the re-rendered `examples/notes-app` profile.

19 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**

- **Tests.** Every new behaviour ships with the test the conventions require: the wrapper's refusals, its exit contract, the index sync, the no-hook and no-filter properties, and the race outcomes in two new suites. `doctor`'s missing-entry message and the excluded set are covered in the edited profile and doctor suites. Whether they pass is the Run gates phase's to establish: this review ran no suite.
- **The route.** The excluded main-checkout wrapper carries every check its two siblings carry: `hr_git_env_drop`, `hr_wrapper_main_of`, `hr_wrapper_target_check_var`, `hr_worktree_config_check_var`, `hr_pinned_hooks_path`, `hr_wrapper_branch_var`, and the protected set read from the main checkout. Past those checks, git reads nothing of the record but its `index`.
- **The commit spelling.** Every `commit-on-branch.sh` invocation in `plugin/` is now the literal `<MAIN_REPO>` spelling with `--repo <repo_root>`, and none carries `$REPO_ROOT` or `${branch}`.
- **Parity.** `phases.parity` is `false`, so no parity check ran.
- **Pass 0.** Half (a) is disabled: this agent's sweep table carries no project regexes. That is a configuration gap, not a clean sweep. Half (b) found no new exported TypeScript symbol. The two new library functions are each called outside their own definition: `hr_commit_paths_var` by the wrapper and by `hr_commit_placed`, `hr_run_blob_var` by `hr_commit_paths_var` and by `hr_commit_placed`.
- **Pass 2** carried nothing: the per-task findings root does not exist for this branch.

What remains:

- **Must Fix:** one regression in the wrapper's directory expansion. A submodule, or an untracked embedded repository, under a passed directory makes the whole commit exit 1.
- **Should Fix:** four prose sites the spelling change left stale.
- **Nice to Have:** one exit-1 message that reports a landed commit as a refusal.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 4** — Replace `docs/cli.md`'s stale "left writable because a run's own git writes" record rationale _(layer: general)_
2. [x] **Finding 5** — Correct `plugin/hooks/README.md`'s claim that the corpus's commit invocation carries `${branch}` _(layer: plugin)_
3. [x] **Finding 2** — Make the four autonomous forks' `<repo_root>` rows say the wrapper invocations spell it literally _(layer: plugin)_
4. [x] **Finding 3** — Replace the stale `git add -- <path>` and "never passes `--no-verify`" wrapper descriptions _(layer: plugin)_
5. [x] **Finding 6** — Report a landed commit whose index sync failed as committed, not as a refusal _(layer: cli)_
6. [x] **Finding 1** — Leave gitlinks and untracked embedded repositories out of a passed directory's expansion _(layer: cli)_

---

## Must Fix

### 1. A directory passed to the commit wrapper is refused whole when it holds a submodule
→ [finding_1.md](fix_sandbox_worktree_record_writes_code_review/finding_1.md)

---

## Should Fix

### 2. Four autonomous forks still declare `<repo_root>` as "written `$REPO_ROOT` in the invocations below"
→ [finding_2.md](fix_sandbox_worktree_record_writes_code_review/finding_2.md)

### 3. Five commit points still describe the wrapper as staging with `git add` and as declining `--no-verify`
→ [finding_3.md](fix_sandbox_worktree_record_writes_code_review/finding_3.md)

### 4. `docs/cli.md` still says a worktree record's files are left writable because a run's own git writes them
→ [finding_4.md](fix_sandbox_worktree_record_writes_code_review/finding_4.md)

### 5. `plugin/hooks/README.md` still says the corpus's own commit invocation carries `${branch}` and is auto-allowed by the script-allowlist guard
→ [finding_5.md](fix_sandbox_worktree_record_writes_code_review/finding_5.md)

---

## Nice to Have

### 6. A commit that landed, but whose index sync failed, is reported as "refusing to commit"
→ [finding_6.md](fix_sandbox_worktree_record_writes_code_review/finding_6.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section carries no parity call-out.
