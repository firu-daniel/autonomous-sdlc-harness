# Skeptic Review: fix_watcher_worktree_git_calls

## Context

**Branch:** `fix_watcher_worktree_git_calls`
**Date:** 2026-10-14
**Reviewed:** the whole diff against `dev`: 27 files, reviewed adversarially. 31 run-artifact files were excluded from the reviewed diff. The segments were:
- the run library's hardened primitives (`cli/templates/scripts/lib/harness-run-lib.sh`);
- the watcher's review drop, artifact commits and stall watchdog;
- `create-worktree.sh` in both modes, and `setup-worktree.sh --target`;
- `remote-run.sh review` and `start`;
- `cleanup-merged-worktrees.sh`;
- `doctor --job-surfaces`, with `cli/src/core/git.ts` and `cli/src/generators/writeProtection.ts`;
- the `harness-run.yml` refusal and record steps;
- the docs.

**De-duplicated against:** `harness-runs/code_reviews/fix_watcher_worktree_git_calls_code_review.md` and its three findings:
- the skip-worktree bit in the record's index;
- `remote-run.sh save` following a planted symbolic link;
- the "JOB MODE above" wording.

There is no architecture review for this branch. `phases.parity` is `false`, so there is no parity review. None of the findings below repeats one already filed.

**Headline.** The branch treats a commit id taken from `ls-remote` as a trusted base. Git, however, reads that id's commit through two things the sandbox can write:
- `refs/replace/`, under the common directory's writable `refs/`;
- `info/grafts`, under its writable `info/`.

A probe showed either one makes every protected-surface check pass on a payload tip. That covers the library's `tree`, `copy` and `reset` modes and the job-mode `doctor --job-surfaces=<branch>@<commit>`. The same probe showed either one also swaps the tree of the default-mode "trusted" cut. That is Finding 1.

Separately, the job-mode watchdog takes its merge base from the GitHub default branch's recorded commit, not from the configured `defaultBranch`. When the two branches differ, as they do in this repository (`main` and `dev`), an honest stalled job is given up rather than resumed. A probe against the built CLI shows it. That is Finding 2.

**Checked, no finding:**
- **Wiring.** Every new library function the inventory names has a caller (check 1). `hr_run_worktree_diff_var` and `hr_run_protected_rel_paths` are reached through `hr_run_surface_check_var`.
- **`--cwd` placement.** `--cwd` placed before a verb in the workflow's `npx` lines is parsed as a global option (`cli/src/cli.ts` → `parseArgv`).
- **The job's checkout.** It fetches with `fetch-depth: 0`, so `refs/remotes/origin/<defaultBranch>` exists for the job-start check.
- **Version floors.** Each new git form stays within the 2.23 floor: `worktrees/<id>/HEAD`, `worktree add --no-checkout`, `read-tree --no-recurse-submodules`, and the comma form of `update-index --cacheinfo`.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Read history as stored (`GIT_NO_REPLACE_OBJECTS=1`, `GIT_GRAFT_FILE=/dev/null`) in every pinned runner, the default-mode cut and `doctor`'s job-surface reads. _(layer: cli, general)_
2. [x] **Finding 2** — Record the configured `defaultBranch`'s commit and take the job-mode watchdog's merge base from it (`--job-surfaces=<branch>@<commit>@<base>`). _(layer: cli, general)_

---

## Must Fix

### 1. A `refs/replace/` ref or an `info/grafts` line, both sandbox-writable, defeats every protected-surface check and swaps the "trusted" fresh cut
→ [finding_1.md](fix_watcher_worktree_git_calls_skeptic_review/finding_1.md)

### 2. The job-mode watchdog takes its merge base from the GitHub default branch rather than `defaultBranch`, so an honest stalled job is given up
→ [finding_2.md](fix_watcher_worktree_git_calls_skeptic_review/finding_2.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

**Verified-OK: refusal over restore.** The story plan chose to refuse rather than restore. It was re-graded under check 4's two-leg test. Leg 1: a restore would leave a dirty tracked tree that wedges the engine's clean-tree precondition, so dropping it discards no intended behaviour. Leg 2: `refresh-branch.sh` and `push-branch.sh` already refuse rather than repair. The divergence stands.
