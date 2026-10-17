# Task plan review — iteration 0

## Must Fix

1. **No stated mutation turns cases (D), (U) or (P)'s directory half red** — `task_3_plan.md`, `**Work:**` → **Red once, recorded in the header.**
   The task prompt (goal 4) requires that *"Each case states the mutation that turns it red"* and that each mutation is *"run red once and recorded."* The plan's mapping gets this wrong for three cases:
   - **(M2)** (`cp -R` restored for directory sources) is said to fail *"(D), (P) and (U) on the sentinel or a link."* It cannot. Task 1's contract (`task_1_plan.md` → `hr_remote_bundle_write` rewrite) runs `hr_remote_link_free_var "$root" "<state_dir>/<source rel>"` **before each source is tested or copied**, and that function tests every prefix component. So:
     - in (D), `clarifications/feat_x` is a link;
     - in (U), its parent `clarifications` is a link;
     - in (P)'s directory half, `task_plans/feat_x` is a link.

     In each, the source is rejected by the link test before any copy runs, whichever copy (`cp -R` or `hr_remote_copy_tree`) sits behind it. Under M2 all three stay green. Only (N), whose links sit below a real directory, reaches the copy.
   - **(M1)** drops the link test *"restoring the plain `[ -f ]` + `cp` for file sources"* only, so it does not reach the directory sources either.

   The suite would therefore ship three cases (D, U, P-dir) with no mutation that turns them red. An implementer following the plan would record M2 as reddening cases that it does not redden.

   (D) and (P)-dir are also guarded twice. With the link test dropped, `hr_remote_copy_tree` is handed a source that is itself a link. A `find` with no `-H`/`-L` does not descend into it, so the copy's own link refusal may keep the case green too. The mutation for those cases has to defeat both guards.

   **Fix:** In `task_3_plan.md`, rewrite the `RED ONCE` list so every case maps to a mutation that actually turns it red, and state each expectation precisely:
   - Make M1 drop `hr_remote_bundle_write`'s link test for file sources only. Expect (F) and (P)'s file half.
   - Add a mutation that drops the link test for directory sources. Expect (U). Expect (D) and (P)-dir too, but only if `hr_remote_copy_tree` would then follow a linked top-level source. Otherwise state the combined mutation for those two: link test dropped **and** `cp -R` restored, which copies the link itself and fails the no-link walk.
   - Narrow M2 to (N).
   - Keep M3 and M4.
   - Require the implementer to record the failing assertion each mutation produced, not the expected one.

## Should Fix

1. **`HR_REMOTE_STATE_WHY` has no consumer** — `task_1_plan.md` / `task_2_plan.md`.
   Task 1's contract defines `HR_REMOTE_STATE_WHY` (*"one sentence naming the source and why it applies"*), and Task 2 restates it. No task reads or prints it:
   - Task 2's difference line uses `HR_REMOTE_STATE_FROM`, `HR_REMOTE_STATE_CHECKOUT` and `HR_REMOTE_STATE_DIR` only.
   - Goal 3's *"Outside a job … say which source applies and why"* is met through the header comment and Task 4's docs.

   **Fix:** Either have Task 2's `save` / `restore` print the sentence (for example, on stdout in checkout mode, so a local `sync`/mirror reader sees which source applied), or drop the variable from Task 1's contract and Task 2's restatement.

2. **Temporary-directory cleanup on failure paths is implicit** — `task_1_plan.md`, `hr_remote_state_dir_var`.
   The contract says the function *"removes that file and `rmdir`s the directory"*, then lists failure exits: an unreadable blob, or a configuration `hr_state_dir` cannot resolve. It does not say the cleanup also runs on those exits. The ledger rule *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike"* (`harness-runs/lessons.md` → `## Remote and branch-scoped operations`) is the nearest lesson.
   **Fix:** State that the private `mktemp -d` directory, and the file in it if one was written, is removed on every return path after it is created, including each `2`.

3. **M4's `verb_save` half may not be observable through (T)** — `task_3_plan.md`, case (T) and (M4).
   In (T), the trusted directory holds an honest `remote_status.json`. Reverting only `verb_save`'s two path builds to the checkout's `stateDir` therefore still produces a trusted-sourced bundle:
   - `hr_remote_bundle_write` keeps reading the trusted directory;
   - with a status source present, it never reads the registry;
   - the difference line is printed by Task 2's separate shared function.

   The mutation reddens (T) only when the setup gate's `hr_remote_state_dir_var` call is reverted with it. That leaves `verb_save`'s own reads unproven.
   **Fix:** Add a (T) variant in which the trusted directory has no status source but has a registry, while the checkout's directory holds a sentinel-carrying status and registry. `verb_save`'s own registry and never-started decisions then depend on which directory it read. Record M4's `verb_save`-only half against that variant.

4. **Existing suites inherit an ambient `HARNESS_GITHUB_DEFAULT_COMMIT`** — `task_3_plan.md`.
   `cli/test/helpers/fixture.mjs` → `run` builds the child environment as `{ ...process.env, ...ISOLATED_ENV, ...env }`. If the gates ever run inside a GitHub job, where `Record the default branch's commit` has written the variable to `GITHUB_ENV`, existing `save` / `restore` cases in `cli/test/remote-run.test.mjs` would switch to trusted mode. They would then return `2` against a commit the fixture lacks. Task 3 guards only its own suite by passing `HARNESS_GITHUB_DEFAULT_COMMIT: ''`.
   **Fix:** Have Task 3 add `HARNESS_GITHUB_DEFAULT_COMMIT: ''` to `remoteRun`'s defaults in `cli/test/remote-run.test.mjs`, adding that file to its `### Targets`, or explain in the new suite's header why the existing suites are not exposed.

## Nice to Have

1. **Two skip lines for one linked `remote_status.json`** — `task_2_plan.md`. When the status source is linked and a registry exists, two lines name the same path: `verb_save` prints its `remote-run.sh: save: skipped …` line, then `hr_remote_bundle_write` prints `remote state bundle: skipped …`. Goal 1 asks for one line per skipped path. Consider having one of the two stay silent for that path, or say in the header that both appear.
2. **A default branch that moved `stateDir` after the run's branch forked** — story index `Top risks:`. The checkout's `harness.config.json` equals the merge-base copy, because the job-surfaces check refuses a branch change to it. The trusted copy is the GitHub default branch's tip. If the default branch changed `stateDir` after the branch point, an honest session writes under one directory and `save` reads the other. This is the prompt's mandated behaviour, and the difference line logs it. Naming it as a risk, and in Task 4's narrowed residual, would make it visible.
