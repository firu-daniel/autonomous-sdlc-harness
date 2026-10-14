# Task plan review — iteration 1

Iteration 0's five Must Fix findings are resolved:

- **Task 9:** the refusal step now precedes `Read the configuration`, and the second test case pins that.
- **The register:** both command entries are the wider ones. Rows 21–24 are present. I re-ran entries 1 and 2 verbatim, and every hit is a row.
- **Tasks 11, 12 and 13:** each payload case has its own mutation line, plus a fallback for a mutation that stays green. Task 13 adds (M3) and (M4) for the verb-level `copy` check.

Index structure, the 1:1 correspondence (15 entries, 15 files, headings matching), the layer tags, the bottom-up order, the points and the five-bullet ceiling all hold. No task targets a conventions document. No `**Verification:**` bullet asks for a forbidden test run.

## Must Fix

1. **The new `doctor --job-surfaces` call runs `npx` inside the tree the run controls, so the check executes code the run chose** — `task_6_plan.md` and `task_9_plan.md`, with the dependent statements in `task_12_plan.md`, `task_14_plan.md` and `task_15_plan.md`.
   - **The watchdog.** Task 6's job-mode watchdog runs `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" doctor --job-surfaces=…` "from `$MAIN_REPO`". In job mode that is the checkout the sandboxed session has just been writing.
   - **The workflow step.** Task 9's new step runs the same `npx` with the branch's checkout as its working directory.
   - **Why that matters.** npm reads a project-level `.npmrc` from the nearest directory holding a `package.json`. I checked this: in a scratch directory holding `package.json` and `.npmrc` with `registry=http://127.0.0.1:9/`, `npm config get registry` printed `http://127.0.0.1:9/` (npm 10.9.8). A project `.npmrc` can set `registry` to a host that serves any code under the pinned version, or `node-options=--require …`. Either runs code in the unsandboxed caller.
   - **Nothing in the plan stops it.** `.npmrc` is in neither `jobSurfacePaths` nor `copySurfacePaths`, and no write protection covers it. In job mode, the session can write it **directly**, with no commit, and then bring on a stall at will (task prompt, *"An agent can bring on a stall at will"*). This branch would add a new unsandboxed code-execution route on exactly the path it is hardening.
   - **On GitHub,** a `.npmrc` committed by an earlier job reaches the refusal step itself. It also reaches `Generate the job's permission profile` and `Preflight with doctor`. Task 9's inventory classes those as closed by the new check, but the check does not cover this payload. The table does not classify the new step at all.

   **Fix:**
   - In `task_6_plan.md` and `task_9_plan.md`, run each `npx … doctor --job-surfaces` from a directory outside the checkout: `working-directory: ${{ runner.temp }}` on the step, or a `cd` to `$RUNNER_TEMP` / a `mktemp -d` directory in the watcher. Name the repository with the CLI's existing global `--cwd <path>` option (`cli/src/cli.ts` → `GLOBAL_OPTIONS`, `{ key: 'cwd', aliases: ['--cwd'] }`), so no project `.npmrc` or `node_modules` is in reach.
   - Add the project `.npmrc` and a committed `node_modules/` to Task 9's inventory as a payload class. Either close the existing `npx` steps the same way, or record them as a stated residual with the reason (goal 4: *"Otherwise narrow it and record it"*).
   - Update `task_9_plan.md`'s rendered-template assertions: the step's body and its `working-directory`.
   - Update `task_12_plan.md`'s (J3) recorded argv, and add a case: a session-written `.npmrc` in the copy whose `node-options` would write a marker. Expect no marker. Give it a mutation line: run the `npx` from the copy, and the marker appears.
   - Carry the result into `task_15_plan.md`'s §11 paragraph and `task_14_plan.md`'s residual list.

2. **Task 5's `RED ONCE` block: the `--no-checkout` mutation cannot turn red, and most new cases have no mutation** — `task_5_plan.md`.
   - **The `--no-checkout` mutation.** The line "drop `--no-checkout` → `reference-transaction` marker appears" fails twice over.
     - Every payload case is refused at step 5, `hr_run_surface_check_var <tip> tree`, before step 6's `worktree add` runs. Dropping `--no-checkout` changes nothing those cases reach.
     - Even past the check, step 6 runs through `hr_run_main_git`, whose `-c core.hooksPath=/dev/null` reaches the child checkout `worktree add` spawns, so no committed hook can fire.
   - **The missing lines.** The block promises "one line per new case" but gives three lines for six cases. The `githooks/post-checkout` case, the `.mcp.json` case and the `--existing --no-bootstrap` case have no mutation. Goal 5 requires each test to state the mutation that turns it red, and that it was run red once.

   **Fix:** Bind each payload case to a mutation that reaches it. For example: skip the surface check **and** restore the unpinned `git -C "$main_repo" worktree add "$worktree_dir" "$branch"` → the `reference-transaction` and `post-checkout` markers appear. Skip the surface check → the `.mcp.json` / `.claude/settings.json` payload is populated and the exit is 0. Make the bootstrap run under `--no-bootstrap` → `deps.marker` appears. Write one line per case, or add the same "a mutation that leaves its case green" fallback paragraph Tasks 11–13 carry.

3. **Task 8's "drop the target check" mutation cannot turn red** — `task_8_plan.md`.
   - The guard removes `$wt` only when it passes `hr_wrapper_target_check_var` **and** equals `hr_worktree_dir "$main_repo" "$branch"` canonically. `hr_worktree_dir` prints `<work_root>/<project>-<sanitized branch>` (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_worktree_dir`).
   - The rewritten-`gitdir` case points the record at "a victim directory outside the fixture". That victim fails the derived-path equality as well as the target check. Drop the target check and the equality still skips it, so the victim survives and the case stays green.
   - The line "drop the target check → the `gitdir` case loses the victim" will not be observed. Nothing in the suite would then exercise the target check.

   **Fix:** In `task_8_plan.md`, make the `gitdir` case reach only the target check. Move the gone branch's real copy away. Put the victim (a plain directory with no `.git` pointer, holding the sentinel) **at** the derived path `hr_worktree_dir` prints, and point the record's `gitdir` there. Equality then passes and only `hr_wrapper_target_check_var` refuses. Alternatively, keep the outside victim, add this second case, and bind the mutation to it.

4. **Task 10's "drop `-c core.hooksPath=/dev/null` → the marker appears" cannot turn red** — `task_10_plan.md`.
   - The new case plants a marker-writing `githooks/pre-commit`. `hr_commit_placed` (Task 1) commits through `hash-object`, `read-tree` / `update-index` / `write-tree` on a temporary index, `commit-tree` and `update-ref`. **None of those runs `pre-commit` or `commit-msg`**, whatever `core.hooksPath` says.
   - Of the hooks a commit can run, only `reference-transaction` fires on `update-ref`. That call runs as `git -C <main>`, where a repo-relative `core.hooksPath` resolves in the main checkout, not the branch's tree.
   - Dropping the pin therefore leaves the case green. Goal 5 requires each listed mutation to have been run red.

   **Fix:** In `task_10_plan.md`, bind the hook assertion to a mutation that reaches it: replace the plumbing commit with `git -C "$worktree" commit` (porcelain, unpinned) → the `pre-commit` marker appears. If the pin itself is to be shown load-bearing, plant a `reference-transaction` that writes a marker in the **main** checkout's hooks directory, and assert it does not fire with the pin and does without it.

## Should Fix

1. **Raised in iteration 0, neither resolved nor recorded under `## Rejected findings`: `task_5_plan.md`'s bootstrap claim.** The plan says the bootstrap uses "this checkout's own copy, which is the main checkout's once step 1 above has passed". That is false when `create-worktree.sh` runs from a linked worktree's `scriptsDir`. `main_repo` is `hr_main_repo "$top"`, the first `worktree list` entry, and `hr_wrapper_main_of "$script_dir"` follows the worktree's `.git` pointer to the same main checkout. Step 1 passes, and `$script_dir/setup-worktree.sh` is the worktree's copy. Require `hr_checkout_top_nogit "$script_dir"` to equal `main_repo`, or run `$main_repo/<main scriptsDir>/setup-worktree.sh`.
2. **Raised in iteration 0, neither resolved nor recorded: `task_3_plan.md`'s `fileAtRef`** is specified as "untrimmed" and "through the module's private `runGit`", which trims. Pick one, and say which.
3. **Raised in iteration 0, neither resolved nor recorded: a changed site with no register row.** `task_14_plan.md`'s second bullet edits `docs/cli.md` → `**The excluded rule's `:*` accepts any argument …**`, but the story index's `## Scope register` has no row for it.
4. **Raised in iteration 0, neither resolved nor recorded: an honest reused copy holding an ignored `.claude/settings.local.json` is now refused** — `task_1_plan.md` (`copy` and `reset` modes include ignored files) / `task_6_plan.md`. State it as a deliberate change to an honest outcome in `Top risks:`, or narrow the untracked test.
5. **Task 11 (L5) is caught by the clean test before the surface check** — `task_11_plan.md`. A plumbing commit that leaves the working-tree file untouched leaves the copy's working tree differing from its index. So `hr_run_copy_clean` refuses it with *"uncommitted tracked changes"*, and the (L5) mutation (drop the surface check) stays green. To model the Linux glob gap the surface check exists for, write the working-tree file in the fixture as well, so only the surface check refuses.
6. **`hr_push_landed`'s fetch leaves out `-c core.fsmonitor=false` and restates its pins inline** — `task_1_plan.md`. The story index's decision says *"Both forms also carry `-c core.fsmonitor=false -c submodule.recurse=false`"*. Run the fetch through `hr_run_main_git` after `hr_run_main_set_var`.

## Nice to Have

1. `task_4_plan.md` → `**Verification:**` diffs `checks.ts` against `main`, but `defaultBranch` is `dev`. Diff against the branch's merge base with `dev`.
