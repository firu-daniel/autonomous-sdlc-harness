### Task 11 — Gate launcher: refuse a linked-worktree target

**Goal:** `launch-sandboxed-gates.sh` runs gates only in the main checkout (job mode) or a run copy, which is a registered clone. It refuses a target `hr_wrapper_target_check_var` classifies as `worktree`, through the library's one home for that rule, `hr_run_target_check_var`. Today such a target reaches step 8 as a run copy and is launched under a leftover legacy record's `run_profile`.

**Depends on:** Task 1, which adds `hr_run_target_check_var <main> <dir>` to `cli/templates/scripts/lib/harness-run-lib.sh`. The contract this task calls: it runs `hr_wrapper_target_check_var "$1" "$2"`; on that check's failure it returns 1 with that check's `HR_TARGET_REFUSAL`; on `HR_TARGET_KIND=worktree` it returns 1 with `HR_TARGET_REFUSAL` set to `'<dir>' is a linked worktree of <main>, and a run copy is a clone the run registry records`; otherwise it returns 0 with `HR_TARGET_KIND` (`main` or `clone`), `HR_TARGET_GITDIR` and `HR_TARGET_BRANCH` exactly as `hr_wrapper_target_check_var` set them. It reads no registry and no tip. This task does not switch the launcher to `hr_run_copy_check_var`, whose registry and tip reads the launcher does not need, and writes no refusal sentence of its own.

**Where this task stops.** It changes `cli/templates/scripts/launch-sandboxed-gates.sh` (check 6's target-check call and its header text) and `cli/test/launch-sandboxed-gates.test.mjs` (one new case). It does not touch the git wrappers. By clarification park 1, Option A, `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` keep accepting a linked worktree a person made by hand, and Task 5 owns their headers. `setup-worktree.sh --target` is Task 12's. `docs/cli.md` §6's *"all four excluded scripts check their target first"* paragraph is Task 8's, which restates this refusal.

### Targets

- `cli/templates/scripts/launch-sandboxed-gates.sh` — check 6 and the header.
- `cli/test/launch-sandboxed-gates.test.mjs` — a new linked-worktree refusal case.

**Work:**

- [ ] `launch-sandboxed-gates.sh`, check 6: replace `hr_wrapper_target_check_var "$main" "$target" || refuse "$HR_TARGET_REFUSAL"` with `hr_run_target_check_var "$main" "$target" || refuse "$HR_TARGET_REFUSAL"` — the same exit route (`refuse`, exit 2), now also taken for a linked worktree with the library's sentence. Add no inline `HR_TARGET_KIND = worktree` test. The `HR_TARGET_KIND = main` registry block that follows is unchanged. The refusal comes before check 7, so no branch, registry `run_profile`, lane or `bwrap` is read. The supervisor re-runs checks 1–9, so `--supervise` refuses the same way, and nothing else changes.
- [ ] Header. In **WHY IT MAY BE EXCLUDED**, *"`hr_wrapper_target_check_var` accepts only the main checkout or a run copy it lists"* becomes: the target check is `hr_run_target_check_var`, which runs `hr_wrapper_target_check_var` — accepting the main checkout, a clone the run registry records, or a worktree the main repository lists — and then refuses the linked worktree, because a run copy is a clone. In **THE CHECKS**, item 6 names `hr_run_target_check_var <main> <target>` in place of `hr_wrapper_target_check_var` and gains the same refusal: *"a target it classifies as a linked worktree is a refusal"*. In the exit map's code-2 list, *"a refused target"* becomes *"a refused target (a linked worktree included)"*. Item 8's *"else the per-run copy … `run_profile`"* stays: after this task only a clone reaches it.
- [ ] `launch-sandboxed-gates.test.mjs`: add a case beside (k)/(o), titled e.g. *"(u) a linked worktree is refused at the target check, its recorded run_profile notwithstanding"*. Make a linked worktree of `f.dir` with `runGit(f.dir, ['worktree', 'add', '--quiet', '-b', 'feat_wt', <path under f.root>])`. Write a valid per-run profile for it, one JSON object such as a copy of the base profile, under the case's own scratch. Record that profile as the branch's `run_profile` with `f.recordProfile('feat_wt', <path>)`, so only the new refusal stands between the target and a launch. Then assert `assertRefusal(await f.launch([<worktree>, LABEL]), 'is a linked worktree')`. Assert, as case (o) does, that `bwrap` is never called past its preflight and that nothing is written to the worktree's lane. Add the case to the header's list of covered cases, where the header names them.

**Verification:**

- `launch-sandboxed-gates.test.mjs` passes, the one test file this task edits, the new case included.
- `bash -n cli/templates/scripts/launch-sandboxed-gates.sh` exits 0.
- `git diff -- cli/templates/scripts/launch-sandboxed-gates.sh` changes one executable line, check 6's target-check call from `hr_wrapper_target_check_var` to `hr_run_target_check_var`, and changes comment lines only otherwise.
- `grep -n -E 'HR_TARGET_KIND.*worktree' cli/templates/scripts/launch-sandboxed-gates.sh` prints nothing — the kind test and its sentence live only in the library.

**Deviations from plan:**

- Verification bullet `bash -n cli/templates/scripts/launch-sandboxed-gates.sh exits 0` was not executed: the command was refused by the tool layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The claim rests instead on `bash scripts/typecheck.sh`, whose `check-shell-parse` step reported `122 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` and ended `PASS: typecheck`, and on `launch-sandboxed-gates.test.mjs` passing 21 of 21 cases, each of which executes the launcher.
