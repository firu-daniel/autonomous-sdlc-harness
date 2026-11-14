# Task plan review — iteration 2

Review 1's four Must Fix items are resolved:
- Register rows 21, 23 and 24 are `change` under Task 21, and row 22's reason is restated.
- Review 0's three open Should Fix items are recorded under `## Rejected findings`. Their reason holds: `harness-runs/clarifications/feat_converging_plan_reviews/answer_1.md` → *"Should Fix items are not gating. Record the three in `## Rejected findings` as deferred to issue #254"*.
- The counter rule follows the user's ruling: Task 3's **Two numbers, kept apart**, Task 6's case `(13)` and Task 19's Override 2.
- Task 7 adds the withheld restore arm, Task 18 and Task 19 add the overload self-pause commit, and Task 29 restates what the bundle carries.

Review 1's Should Fix 2 and 3 are applied.

I re-ran the register's derivation entries E1–E5. Every site they reach is a row.

## Must Fix

1. **Task 7's withheld arm breaks an existing `remote-run.test.mjs` case that no task re-pins** — `task_7_plan.md`.
   `cli/test/remote-run.test.mjs` → `test('restore keeps a planning file the fresh checkout already carries, and reports it kept', …)` sets up a fixture checkout `b`. It commits the story index there (`runGit(b.dir, ['add', '--force', STORY_INDEX])`, then `commit`), restores a job bundle whose story index differs, and asserts:
   - `assert.match(restored.stdout, /placed 0 planning file\(s\) for feat_x; kept 1/)`.

   This is exactly the **Tracked** arm that Task 7's second Work bullet adds. Once the checkout tracks the story index, every task-plan file in the bundle is withheld and counted in `HR_REMOTE_PLANNING_WITHHELD`, not in `HR_REMOTE_PLANNING_KEPT`. So `KEPT` is `0`, `PLACED` is `0`, and `remote-run.sh` → `verb_restore` prints its placed/kept line only when `$((HR_REMOTE_PLANNING_PLACED + HR_REMOTE_PLANNING_KEPT))` is non-zero. Task 7 says that line *"reads only the two existing names and is not changed"*, so the restore prints no line at all, and the assertion fails.

   Task 7's targets name only `cli/test/outer-loop-scripts.test.mjs`. No per-task file targets `cli/test/remote-run.test.mjs`. The unit loop runs only a task's own test files and the tree guards, and this file is neither, so the break first appears in Phase G's full-suite run.

   The case also pins a contract the branch is changing: *"a committed copy always wins … reports it kept"*. Task 29 restates that contract in `docs/remote-execution.md`, but the test stays as it is.

   **Fix:** Add `cli/test/remote-run.test.mjs` to Task 7's `### Targets`. Task 7 has four Work bullets, so add a fifth that re-pins this case to the tracked arm. The re-pinned case asserts:
   - the committed story index is byte-identical after the restore;
   - `git status --porcelain` on it stays empty;
   - the stdout is whatever the restore now prints for a withheld file.

   Decide whether an operator should see withheld files. Either extend `verb_restore`'s log line to report `HR_REMOTE_PLANNING_WITHHELD` and `HR_REMOTE_WALKER_WITHHELD`, and add `cli/templates/scripts/remote-run.sh` to the targets, or state in Task 7 why a silent withhold is acceptable. If the line changes, check that `cli/test/gate12-sandbox-round-full-run.test.mjs`, which extracts that line's text from `verb_restore`, still matches. Add the re-pinned file to Task 7's Verification, as that task's own edited test file.

## Should Fix

1. **Converging mode's diff step names only the task plan's paths** — `task_10_plan.md`. The `## Converging mode` bullet tells a converging reviewer to diff the plan with `git diff <sha> -- <story_path> <task_files_dir>` plus `git status --porcelain -- <task_files_dir>`. Those are dispatch keys of the task-plan loop only. A fix-plan converging reviewer (Task 16 and Task 17, sub-case (b)) has neither key: its plan is the fix-plan index and its per-finding folder, at `fix_plan_path`. The module serves both loops, and its fix-plan commit subject is already in the same bullet. State the diff's paths for each loop, or describe them as the plan paths the reviewer's own dispatch block names.

## Nice to Have

1. `task_11_plan.md` and `task_28_plan.md`: this repeats review 1's Nice to Have 1, which was neither applied nor recorded. The text says *"exactly four agents per round"*, but a round has three agents whenever the parity gate is skipped. *"At most four"* keeps the sizing argument true.
2. `task_21_plan.md`: `plugin/commands/branch-start-user-review-fix-autonomous.md` → the `<repo_root>` / `<app_root>` binding paragraph says the fix-plan fork's *"Override 3 / Override 4 commit and push both name the main checkout's copies"*. After Task 20, Override 6 and the planning-pause commit name them too. Consider naming Override 6 there as well, so this list matches the two overrides lists Task 21 already updates.
