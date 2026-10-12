# Architecture review — iteration 2

Iteration 1's Must Fix is resolved. `task_3_plan.md` → `protectedPaths` items 2 and 4 now build every `<scriptsDir>` path through `outerLoopScriptPath` / `outerLoopScriptsDir` / `outerLoopRelativePath`, say that no item joins `scriptsDir` by hand, and add the trailing-slash `scriptsDir` case to `profile.test.mjs`. The test-run rule holds in every task: each `**Verification:**` bullet runs only a test file that task creates or edits, and each suite the task does not touch is explicitly left to Run gates.

## Must Fix
1. **The run library gets three git-free derivations of one checkout's git common dir, and a second "main checkout of `<dir>`" function beside the one it already has.** Offending files: `task_4_plan.md` (the **Library contract** table) and `task_24_plan.md` (the **Library contract** table). Rules violated: `.claude/context/conventions.md` → `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it."* (the `cli/src/core/repoPaths.ts` drift story), and `.claude/context/cli.md` → `## Naming and file layout` → *"A new responsibility gets its own module with its own header rather than widening a neighbour"*.
   Both tasks write into `cli/templates/scripts/lib/harness-run-lib.sh`:
   - Task 4's `hr_pinned_hooks_path` derives the git common dir with no git: a directory `.git` is itself; for a pointer, `<gitdir>/commondir` resolved against `<gitdir>`, else `<gitdir>`; return 1 unless its basename is `.git`. `hr_worktree_config_file` parses the same `gitdir: <p>` pointer line separately.
   - Task 24's `hr_main_checkout_of` derives the same common dir again, by the same rule (*"`<p>/commondir` resolved against `<p>`, else `<p>`; it must be named `.git`"*), but canonicalised with `cd -P … && pwd -P`, where Task 4's form is not. `hr_wrapper_target_check_var` parses the pointer a fourth time.
   - The library already has a function that answers "the main checkout of `<dir>`": `hr_main_repo` (`cli/templates/scripts/lib/harness-run-lib.sh`, *"Print the MAIN checkout of the repository containing <dir>"*). It uses `git worktree list`. A git-free twin is justified here, because the git call would load a configuration the wrapper does not yet trust. But neither task names `hr_main_repo` or states that reason, so a later reader sees two functions with one job and no reason they differ.

   This matters because Task 24's target check and Task 4's hooks pin then each decide *which repository is the main one* by their own copy of the rule. If one copy changes (a canonicalisation, a `.git` naming rule, a separate-git-dir layout) and the other does not, the wrappers validate one repository and read `core.hooksPath` from another's configuration. Nothing would fail, and no test would catch it.

   **Fix:**
   - In `task_4_plan.md` → **Library contract**, add two git-free rows and make the other rows use them:
     - `hr_gitdir_nogit <top>`: prints the gitdir. `<top>/.git` itself when it is a directory. For a pointer file whose first line is `gitdir: <p>`, prints `<p>` resolved against `<top>`. Canonical. Returns 1 otherwise.
     - `hr_common_dir_nogit <top>`: takes `hr_gitdir_nogit`'s answer. Prints `<gitdir>/commondir` resolved against the gitdir when that file exists, else the gitdir itself. Canonical. Returns 1 unless the basename is `.git`.
     - `hr_worktree_config_file` and `hr_pinned_hooks_path` call these two rows rather than parsing the pointer or `commondir` themselves.
   - In `task_24_plan.md` → **Library contract**:
     - `hr_main_checkout_of` becomes the parent of `hr_common_dir_nogit "$(hr_checkout_top_nogit <dir>)"`. Its doc comment names `hr_main_repo` and says why this twin does not run git.
     - `hr_wrapper_target_check_var` takes the target's gitdir from `hr_gitdir_nogit` and its common dir from `hr_common_dir_nogit`, then compares them with `<main_top>/.git/worktrees/…` and `<main_top>/.git`. It reads directly only the `<p>/gitdir` back-pointer, which nothing else in the library reads.
   - Add one sentence to each task: no function in the library parses a `.git` pointer or `commondir` except these two.

## Should Fix
1. **Planned runtime import cycles (carried from iterations 0 and 1, still not addressed)**: `task_2_plan.md` (`sandboxProfile.ts` ↔ `permissionProfile.ts`) and `task_3_plan.md` (`writeProtection.ts` → `repoRoot.ts` → `permissionProfile.ts` → `writeProtection.ts`). `.claude/context/cli.md` → `## Dependencies, and which way they point` shows this layer arranging its imports to avoid runtime cycles. Its `## Not determined` leaves runtime edges unsettled, which argues for keeping new edges acyclic. There are two ways to avoid the cycles:
   - `renderProfile` passes `bashScriptRule` and `assertUsableInEntry` into `applySandbox` / `applyWriteProtection` as arguments;
   - or the two modules return data that `renderProfile` merges.

   This is non-blocking.
2. **Task 11's citation still names no heading (carried, not addressed)**: `task_11_plan.md` → the `test-fix-plan-writer.md` → `## Process` step 4 bullet. `.claude/context/plugin.md` → `## Citation` says *"A citation names the file *and* the heading it is taking content from."* Write it as `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → `### Semi-autonomous and autonomous modes` → **A sandbox refusal is the boundary working, in every mode.**, and change the Verification grep to match.
3. **Task 26 still cites a route no conventions document names (carried, not addressed)**: `task_26_plan.md` → `**Work:**`, first bullet: *"through the scratch-run route the conventions document names for running a file there"*.
   - None of `.claude/context/conventions.md`, `.claude/context/cli.md` or `.claude/context/plugin.md` names a scratch route.
   - `cli/templates/scripts/scratch-run.sh` runs one file under `<state_dir>/scratch/` in its extension's interpreter. It does not run the CLI's `init`.
   - The step builds a git repository inside this checkout. That runs against `.claude/context/conventions.md` → `## The testing bar` (*"No fixture is ever created inside this checkout"*).

   Either drop the false citation and render under the system temp directory, or make the plan's own fallback (applying the template diffs by hand) the primary route.

## Nice to Have
1. The schema (Task 12, `general`) lands after its model, its check, its consumers and the plugin text that names its keys (Task 11). That reverses `.claude/context/conventions.md` → `### The order files are created…`, item 1, and `## The layers` (*"a plugin contract reading a shape the schema does not carry is a defect"*) holds only once Task 12 lands. The story index's **Order** paragraph argues this order, so it is recorded here for visibility only.
