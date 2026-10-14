# Task plan review — iteration 2

Iteration 1's four Must Fix findings are resolved:

- **`npx` outside the checkout:** Task 6 runs the watchdog's `doctor --job-surfaces` from a `mktemp -d` directory with `--cwd "$MAIN_REPO"`. Task 9 gives every `run`-job `npm` / `npx` step `working-directory: ${{ runner.temp }}`, classes the project `.npmrc` / `node_modules/` payload, and pins it with a third test case. Task 12 adds (J3)–(J5). I confirmed that `--cwd` is a global option `parseArgv` consumes before the subcommand sees its argv (`cli/src/cli.ts` → `GLOBAL_OPTIONS`, `parseArgv`).
- **Task 5:** (E1)–(E6) each have a mutation that reaches their payload, plus the fallback paragraph.
- **Task 8:** (C3) puts the victim at the derived path, so only the target check refuses it.
- **Task 10:** the hook assertion is bound to a porcelain-commit mutation, and a main-side `reference-transaction` shows the pin is load-bearing.

These checks hold:

- **Index and correspondence.** The index structure is correct. Its 15 entries match the 15 files 1:1, and each file's heading agrees with its filename.
- **Tags, order and budgets.** Every task carries a single layer tag, with `cli` ×13 and then `general` ×2 last. The `**Depends on:**` links all point backwards. Every task has 20 points or fewer and 5 `**Work:**` bullets or fewer.
- **Conventions documents.** No task targets one.
- **Test runs.** No `**Verification:**` bullet asks for a forbidden test run. Each task runs only its own test file, plus `commands.typecheck`, which is not a test run.
- **Scope register.** I re-ran derivation entries 1 and 2 verbatim, and every hit is a row: entry 1 reaches rows 1, 2, 4–9, 14, 15, 20, 23 and 24, and entry 2 reaches rows 3, 10–13, 16–19, 21 and 22. Entry 3 reaches no rule in `harness-runs/lessons.md`.

## Must Fix

1. **The plan says the dependency install is the only run-authored code still executed unsandboxed, and the only npm run left in the checkout. The configured build runs one too.** Files to change: `task_14_plan.md`, `task_15_plan.md`, `task_9_plan.md`, `task_5_plan.md`, and the story index's `## Context` (`fix_watcher_worktree_git_calls_story_plan.md`).
   `cli/templates/scripts/setup-worktree.sh` runs `commands.depInstall` and then `commands.build` (`run_configured depInstall …`, then `run_configured build "build"`; its header's step 5 says *"`commands.depInstall`, then `commands.build`"*). The configured build is not inert. It is commonly `npm run build`, as in this repository's own `harness.config.json`, so it runs the `scripts.build` / `prebuild` / `postbuild` the **run's own** `package.json` carries. It also starts npm inside the checkout, where a run-written project `.npmrc` (`node-options=--require …`) applies. Both sites execute that unsandboxed:
   - `create-worktree.sh --existing`'s bootstrap. Task 5 runs the main checkout's `setup-worktree.sh --target <copy>` with the main checkout's `commands.build`, but in the copy, against the copy's manifest.
   - The job's `Bootstrap the checkout`.

   `package.json` is in neither `copySurfacePaths` nor `jobSurfacePaths`, so neither check sees a run that changes `scripts.build`. Even so, the plan states only the install:
   - The story index's decision says *"The dependency install of a run's own manifest is a stated residual"*.
   - Task 5 says *"State the residual: the dependency install still runs the copy's own manifest"*.
   - Task 9's header bullet and payload-class row say the install *"is the one npm run left in the checkout"*.
   - Task 14's fact list says *"No `npm` or `npx` the family or the job runs starts in a run's checkout, but the dependency install"*, and its residual item 1 says the install *"alone still reads a run-written project `.npmrc`"*.
   - Task 15's §11 residual and its "every `run`-job `npm` / `npx` runs outside the checkout" fact say the same.

   As written, `docs/cli.md` §6, `docs/remote-execution.md` §11 and the `harness-run.yml` header would ship a security residual that understates the exposure. Goal 3 says such a step is *"a code-execution step by nature. Either run it sandboxed or record it as a stated residual with its reason. Do not leave it unstated."*

   **Fix:** In every place listed above, widen the residual from "the dependency install" to **the bootstrap's configured commands, `commands.depInstall` and `commands.build`, run against the run's own manifest**. Give the same reason: a package manager runs the manifest's lifecycle and script entries by nature, and no out-of-session sandbox runtime ships. Correct the "only npm run left in the checkout" sentences in `task_9_plan.md` (the header bullet and the `.npmrc` payload-class row), `task_14_plan.md` (the fact bullet and residual item 1) and `task_15_plan.md` (the "every `run`-job `npm` / `npx`" fact and the §11 residual). They should name both bootstrap commands as the npm runs that stay in the checkout and still read a run-written `.npmrc` / `node_modules/`. In `task_5_plan.md`'s `setup-worktree.sh --target` bullet, state the residual for both commands.

## Should Fix

1. **Raised in iterations 0 and 1. It is neither resolved nor recorded under a `## Rejected findings` section.**
   - **The bootstrap claim** — `task_5_plan.md`. The claim is *"this checkout's own copy, which is the main checkout's once step 1 above has passed"*. That is false when `create-worktree.sh` runs from a linked worktree's `scriptsDir`: `hr_wrapper_main_of` follows the `.git` pointer to the main checkout. Require `hr_checkout_top_nogit "$script_dir"` to equal `main_repo`, or reword the claim.
2. **Raised in iterations 0 and 1, and still unaddressed: `fileAtRef`** — `task_3_plan.md`. It is specified as both "untrimmed" and routed through `runGit`, which trims (`cli/src/core/git.ts` → `runGit`). Pick one.
3. **Raised in iterations 0 and 1, and still unaddressed: the register has no row for a changed site.** `task_14_plan.md`'s second bullet edits `docs/cli.md` → "**The excluded rule's `:*` accepts any argument …**". The story index's `## Scope register` carries no row for it.
4. **Raised in iterations 0 and 1, and still unaddressed: ignored files** — `task_1_plan.md` (`copy` / `reset` modes, *"ignored files included"*) and `task_6_plan.md`. An honest reused copy holding a person-written, gitignored `.claude/settings.local.json` is now refused. State this in `Top risks:` as a deliberate change to an honest outcome, or narrow the untracked test to exclude ignored files.
5. **Raised in iteration 1, and still unaddressed: Task 11 (L5) is caught by the clean test** — `task_11_plan.md`. A plumbing commit that leaves the working-tree file untouched makes the working tree differ from the index, so `hr_run_copy_clean` refuses first. The (L5) mutation, dropping the surface check, then stays green. Write the working-tree file in the fixture as well, so only the surface check refuses.
6. **Raised in iteration 1, and still unaddressed: `hr_push_landed`'s fetch** — `task_1_plan.md`. It restates its pins inline and leaves out `-c core.fsmonitor=false`, against the story index's *"Both forms also carry `-c core.fsmonitor=false -c submodule.recurse=false`"*. Run it through `hr_run_main_git` after `hr_run_main_set_var`.
7. **Task 8's verification miscounts its mutations** — `task_8_plan.md`. `**Verification:**` says "both `RED ONCE` mutations", but the block now has four, (C1)–(C4). Say "every".

## Nice to Have

1. `task_4_plan.md` → `**Verification:**` diffs `checks.ts` against `main`, but `defaultBranch` is `dev`. Diff against the merge base with `dev`. This was raised in iteration 1.
