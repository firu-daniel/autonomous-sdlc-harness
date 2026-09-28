# Task plan review — iteration 2

Both Must Fix findings from iteration 1 are resolved:

- Task 12 now owns the worktree behaviour. It ships first, and the Context records the decision.
- Task 9 now targets the `docs/cli.md` §7 check table, and register row 2 names it.

I re-ran derivation entries A, B and C verbatim. Every file A and B list, and every rule C reaches, appears as a row, so the closure invariant holds.

The index structure, the 1:1 correspondence between the index and the task files, single-layer tags, points (all ≤ 20) and Work-bullet counts (all ≤ 5) are all clean. The finding below is new.

## Must Fix

1. **The untrack remedy ends in a push that the `pre-push` hook refuses, which repeats finding 6** — `task_5_plan.md`, `task_4_plan.md`, `task_8_plan.md`, `task_9_plan.md`.
   The plan's remedy for a committed profile is three commands: `git rm --cached .claude/settings.autonomous.json`, a commit, and a push.
   - In `task_5_plan.md` → *The check's contract*, the push goes *"to the branch the job checks out"*.
   - In `task_4_plan.md`, the `profile-paths` failure says *"commit, and push"*.
   - Task 8's §7 untrack block and Task 9's `profile-tracked` bullet restate it with no target and no route.

   The job checks out `origin/<branch>`. That branch is cut from `origin/<defaultBranch>` (`cli/templates/scripts/create-worktree.sh` → `git -C "$main_repo" worktree add -b "$branch" "$worktree_dir" "origin/$default_branch"`). So the untrack has to reach the default branch, or every new run's branch carries the profile again, and `profile-tracked` fails the next job too.

   A push to the default branch is refused by the hook `init` wires: `cli/templates/githooks/pre-push` → *"pre-push: refusing to push to protected branch '$target' - land the change through a pull request"*, and `defaultBranch` is always in its `case` set. Task 11 already argues this about the workflow push, and fixes that one with `--no-verify`.

   So the `FAIL` that acceptance criterion two requires names a fix that either:
   - is refused, if the adopter pushes to the default branch as the §7 setup implies, or
   - covers only one run, if they push to the run branch as Task 5's wording implies.

   The first is the defect class of finding 6, re-created in new remedy text. Acceptance criterion four (*"agree with what the code does about … the default-branch push"*) is unmet for it.

   **Fix:** Pick one route for the untrack and state it identically in every place:
   - Either `git push --no-verify origin <defaultBranch>`, with Task 11's one-sentence reason: this is the adopter's deliberate push, and the harness never makes it.
   - Or a pull request into the default branch.

   Then apply it:
   - `task_5_plan.md` → the contract: replace *"a push of that commit to the branch the job checks out"* with the chosen command, and say it must land on the default branch because every run's branch is cut from `origin/<defaultBranch>`. Add a `cli/test/doctor.test.mjs` assertion that the `profile-tracked` message names that route and contains no bare `git push origin ` form.
   - `task_4_plan.md` → the `profile-paths` `fail` arm under `--remote-job`: the same route, restated.
   - `task_8_plan.md` → the §7 untrack block: the third fenced command spelled exactly as Task 5 prints it.
   - `task_9_plan.md` → the `profile-tracked` bullet and table row: the same route. Add the untrack's push to the byte-alignment Verification bullets beside Task 11's four commands.

## Should Fix

1. **`task_11_plan.md`, the ship-order paragraph** says the task ships *"eighth"*. The story index puts it ninth (readiness entry 9, after Task 7 at entry 8). The index's Context also says *"ninth"*. Correct the task file.
2. **`task_11_plan.md`, Verification bullet 3 is still wrong (iteration 1, Should Fix 4, unaddressed).** `grep -n "git push origin" cli/src/doctor/checks.ts` also returns `JJ_REPOSITORY_CHECK`'s doc comment (*"the identical refusal `git push origin <protected>` draws"*). That belongs to neither `base-freshness` nor `remote`. State only the part that carries weight: no hit inside `REMOTE_EXECUTION_CHECK`.
3. **`task_3_plan.md`: the "nothing written" outcome is still unspecified (iteration 0 and iteration 1, Should Fix 1, unaddressed and not recorded as rejected).**
   - Say which `PluginRootEntriesOutcome` value a render reports when every entry was filtered out, or add a fourth value.
   - Say whether a root dropped for a `FORBIDDEN_IN_ENTRY` character still goes into `permissions.additionalDirectories`.
   - Add a `**Work:**` test case that drives the last Verification bullet. That can be folded into the existing test bullet, which keeps the task at 5 bullets.
4. **`task_2_plan.md`, Work bullet 2 (iteration 1, Should Fix 3, unaddressed).** State that `root` and `runtimeRoot` in `PLUGIN_PERMISSIONS_CHECK.run` are both un-normalized, so `root === runtimeRoot` compares like with like. The generator bullet states its side.

## Nice to Have

1. `cli/test/init.test.mjs` → the `PLUGIN_PERMISSIONS_GRADED` doc comment cites the *"not graded at this machine's plugin root"* pass. Task 2 removes that pass, so the comment becomes stale. Task 2 edits that file, and could reword the comment in the same edit.
2. Carried from iterations 0 and 1: `REMOTE_CHECK`'s `git push -u origin ${branch}` remedies push the default branch too. Also, this repository's hand-added profile rule in the root `.gitignore` will duplicate the managed-block rule on the next `init`.
