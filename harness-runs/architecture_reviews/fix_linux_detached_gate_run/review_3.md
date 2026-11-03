# Architecture review — iteration 3

Iteration 2's Must Fix 1 is resolved. `task_6_plan.md` now makes `sp__bg9_excluded_profile` a thin wrapper over `scripts/lib/sandbox-probe/session.sh` → `sp_scratch_profile`, and adds no second `jq` writer. Its output path (`$SP_TMP/detached-excluded.json`), its teardown (under `SP_TMP`, like `sbx_lb_ip`) and Task 10's contract (status 1 on a `jq` failure, `<name>` a bare stem) all match the helper's real body. The fixes from iterations 0 and 1 are still in place: the two `cli/src` doc comments in Task 1, the two cores' `<repo_root>` `Used at` cells in Task 3, and register rows 94, 99, 103 and 104.

Layer placement, dependency direction and the test-run rule hold across all 14 tasks:
- Tasks 1, 2 and 9–11 stay under `cli/`, and Task 3 under `plugin/`.
- Tasks 4–8 and 12–14 stay under the catch-all.
- No shell asset sources across the `cli`/`plugin` boundary.
- No Verification bullet runs `bash scripts/test.sh`, `scripts/run-gates.sh`, a tree guard, or a test file its own task does not edit.

## Must Fix
1. **Task 7's PD25 predicate claims to be the trust check's inert shape, but it accepts more than the trust check does.** Offending file: `task_7_plan.md` (`**Work:**` → **PD25**: *"It returns 0 only when `<path>` is a regular file, not a symbolic link, of size 0, and `git -C <clone> config --get --bool extensions.worktreeConfig` does not print `true`. That is the inert shape the trust check already accepts (`hr_run_copy_check_var`)."*). The same restatement appears in `task_11_plan.md` (**Depends on:** → PD25) and `task_12_plan.md` (**Depends on:** → Task 7, PD25). Rules broken: `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"A responsibility that already has a home does not get a second one"*, and *"Before adding a copy of anything, grep for it"*, whose worked cost is copies that drifted). Also `harness-runs/lessons.md` → `## Trust checks` (*"accept only its provably inert shape (regular, empty, not a link, its enabling setting off) and keep refusing every other shape"*).
   The run library already owns the definition of an inert `config.worktree`: `scripts/lib/harness-run-lib.sh` (and its template) → `hr_run_copy_check_var`, in its `for name in config.worktree objects/info/http-alternates` loop and the `extensions.worktreeConfig` test after it. That test reads `git -C / config --file "$gd/config" --bool --get extensions.worktreeConfig` and accepts only two results: exit 1 (key absent), or exit 0 with the value `false`. Any other result is refused, including exit 128 for an unparseable value. Task 7's predicate differs in two ways:
   - It accepts any result that does not print `true`, so an unparseable value counts as inert.
   - It reads the clone's whole config cascade (`git -C <clone> config`), not the clone's own `.git/config` file.

   So the probe gets a second definition of the inert shape that has already drifted from its owner, and the plan cites the owner as if the two were the same. The drift then reaches Task 11's fixture cases and Task 12's record of the fix.
   **Fix:** In `task_7_plan.md`, rewrite the `sp__pf_inert_worktree_config <path> <clone>` bullet so that it accepts exactly what `hr_run_copy_check_var` accepts:
   - `<path>` is a regular file, not a symbolic link, of size 0;
   - `git -C / config --file <clone>/.git/config --bool --get extensions.worktreeConfig` exits 1, or exits 0 printing `false`;
   - every other outcome returns 1, including an unparseable value.

   Have the function's comment name `hr_run_copy_check_var` as the shape it mirrors. In `task_11_plan.md`, add a returns-1 case for an unparseable `extensions.worktreeConfig` value, and change the `true` case's wording to "not held off". In `task_12_plan.md`'s PD25 line, replace *"with `extensions.worktreeConfig` not `true`"* with *"with `extensions.worktreeConfig` absent or `false`"*. If the writer holds that the wider predicate is correct for the probe, drop the claim that it is the trust check's shape, give the reason in that bullet, and record this finding under `## Rejected findings` in the story index.

## Should Fix
_None._

## Nice to Have
_None._
