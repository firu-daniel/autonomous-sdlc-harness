# Code Review: feat_clone_per_run_switch

## Context

**Branch:** `feat_clone_per_run_switch`
**Date:** 2026-10-20
**Reviewed:** the whole branch diff against the configured default branch `dev` (`git diff dev...HEAD`): 50 files, +4572 / −1242. The changes reviewed:

- the run library's clone-first swap (`hr_copy_ref_swap_var`), sync-in's heal, the one-live-copy rule (`hr_run_copy_live_var`), the narrowed remote-ref set of a new clone and `hr_run_profile_file`;
- `create-worktree.sh` creating clones in all three modes, with its rollback;
- the clone-first moves in `commit-on-branch.sh` / `refresh-branch.sh`, and the verify-only form in `push-branch.sh`;
- the registry-driven `cleanup-merged-worktrees.sh`;
- `remote-run.sh start` / `review` on clones;
- the watcher's per-run profile, its launch check, the job-mode base check and the exit sync;
- `writeProtection.ts` write-denying the main checkout's whole `.git` and narrowing the glob `.git` entry to `COPY_GIT_PATHS`, with `doctor`'s retired-entry grading;
- `harness-run.yml`'s no-copy statement;
- the six `plugin/` files: `plugin/commands/branch-prompt.md` (the new `<sanitized_branch>` row and the collision guard), `plugin/instructions/plan_orchestration_instructions_core.md` and `plugin/instructions/user_review_fixes_instructions_core.md` (the Phase D push-state read moved to `origin/<branch>..HEAD`, and the branch-cut citation repointed to `hr_run_trusted_base_var`), and `plugin/instructions/autonomous_pause_and_ledger.md`, `plugin/instructions/docs_orchestration_instructions_autonomous.md` and `plugin/instructions/improvement_observations_instructions.md` (the reworded sandbox-commit sentence);
- the docs of record (`docs/watcher.md`, `docs/cli.md` §6/§7, `docs/sandbox-verification.md`, `docs/outer-loop-verification.md`, `docs/guard-verification.md`, `ARCHITECTURE.md`) and the worked example's re-rendered profile and figures;
- the 21 test suites that came with these changes.

39 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** Every task in the story index's readiness list has landed and carries the suites its plan named. This review ran no suite; whether they pass is the Run gates phase's to establish. I reproduced a few things by hand against throwaway fixtures under the system temp directory:

- the worked example's README figures, all of which match its profile: 212 occurrences, 173 lines, 181 `/workspace/notes-app`, 59 glob, 30 home, 1 bare;
- a clone cut where `origin/HEAD` names a ref other than `defaultBranch`, which still passes the trust check;
- `update-ref -d` leaving a branch's upstream section in place, which is Finding 1.

`phases.parity` is `false`, so no parity review ran.

Pass 0:

- The grep sweep's added-line hits (`rm -rf "$tmpdir"` in `hr_commit_paths_var`, and an operator hint line in `create-worktree.sh`'s rollback) are pre-existing patterns that moved, not new removals.
- Every new exported symbol has a caller outside its defining file, or is the type of an exported constant: `COPY_GIT_PATHS`, `retiredProtectedPaths`, `hr_copy_ref_swap_var`, `hr_run_copy_live_var` and `hr_run_profile_file`.

`plugin` layer, checked against `.claude/context/plugin.md`:

- **`## The placeholder vocabulary`.** The `<sanitized_branch>` row is a three-column row with the class `derived at runtime`. Its definition, `/` replaced by `-`, matches `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sanitize_branch`, and the intro's count ("two are derived at runtime") matches the table's two such rows. The command's opening paragraph still names the run copy `<work_root>/<project_name>-<branch>`; that is Finding 3.
- **`## Citation` and `## Writing agent prose`.** The collision guard cites `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_copy_live_var`. That is the repo-relative-plus-symbol form required for a citation outside the plugin, and it has precedent in `plugin/commands/harness-read-mention.md`. The restatement names its owner and does not compete with it. A command cannot call the library function, so it has to spell out the bare checks. Each condition matches the function: the derived path with `-e` / `-L`, the registry's `worktree` path, and `branch refs/heads/<branch>` in `worktree list --porcelain`. The function's separate `symbolic-ref HEAD` arm is subsumed, because the porcelain list includes the main checkout's own entry.
- **`## Cores, forks and the single-owner rule` and `## Verifying a change in this layer`.** I diffed the `Branch delivery` bullet in `plan_orchestration_instructions_core.md` against the one in `user_review_fixes_instructions_core.md`. The reworded push-state and branch-cut text is byte-identical. The only difference is a trailing period, which already differs on `dev`. Both cores declare `<scripts_dir>` in their `## Resolved values`, and the new text adds no absolute path, slash-command name or escalation phrase.
- **Factual accuracy of the reworded sandbox-commit sentence** in the three other instruction files. `cli/src/generators/writeProtection.ts` write-denies the main checkout's whole `.git`, so a sandboxed commit cannot move the main checkout's branch. A legacy worktree's record lives under that same `.git`. The sentence is accurate in all three files.

Pass 2: the per-unit findings root `harness-runs/task_plan_point_reviews/feat_clone_per_run_switch_task_plan/` does not exist in this checkout, so the reconciliation was a no-op.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else are informational and never the iteration source.

Each entry resolves to `harness-runs/code_reviews/feat_clone_per_run_switch_code_review/finding_<K>.md` through its `**Finding K**` reference.

1. [ ] **Finding 3** — Name the run copy `<work_root>/<project_name>-<sanitized_branch>` in `branch-prompt.md`'s opening paragraph _(layer: plugin)_
2. [ ] **Finding 2** — Log `RUN_MAIN_REFUSAL` when the watcher's exit sync cannot be anchored, and add the exit sync to the header's class list _(layer: cli)_
3. [ ] **Finding 1** — Remove the `branch.<branch>` upstream section `start`'s cut wrote, when it was absent before, and assert it in `remote-start.test.mjs` _(layer: cli)_

---

## Must Fix

### 1. `remote-run.sh start` leaves the `branch.<branch>` upstream section its cut wrote in the main checkout's `.git/config`
→ [finding_1.md](feat_clone_per_run_switch_code_review/finding_1.md)

---

## Should Fix

### 2. The watcher's new exit sync skips silently on an unplaced main checkout, and its header's class list omits it
→ [finding_2.md](feat_clone_per_run_switch_code_review/finding_2.md)

### 3. `branch-prompt.md`'s opening paragraph still names the run copy `<work_root>/<project_name>-<branch>`, not the `<sanitized_branch>` form the branch added
→ [finding_3.md](feat_clone_per_run_switch_code_review/finding_3.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
