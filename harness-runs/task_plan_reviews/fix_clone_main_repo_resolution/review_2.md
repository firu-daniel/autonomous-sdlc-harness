# Task plan review — iteration 2

Both iteration-1 Must Fix items are resolved: `task_4_plan.md` drops the word-count hold and argues it from `.claude/context/plugin.md` → `## Writing agent prose`, and `task_8_plan.md` now gives the corpus row and the roster check one mutation each, with both red runs recorded. The scope register was re-derived: D1–D4, re-run verbatim against this tree, reach only sites that already appear as rows 1–39. D1 reaches 22 files, and `branch-start-user-review-fix-autonomous.md` is the one that carries the clause twice. D5 was walked again over `harness-runs/lessons.md` and `harness-runs/improvement_suggestions.md` and reaches no entry.

## Must Fix

1. **`task_5_plan.md`: a Verification sentence limits the task's test runs and cancels point 7's guard run.**
   - **Verification:**, first bullet, ends: *"Run no test file: this task creates or edits none."*
   - Task 5 edits `cli/src/doctor/checks.ts` and `cli/src/generators/permissionProfile.ts`. Both match the `covers` glob `cli/src/**/*.ts` of the `harness.config.json` tree guard `{ "test": "test/retrieval-loading.test.mjs", "covers": "cli/src/**/*.ts" }`. So `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 7 selects that guard for this unit.
   - Point 4 reads: *"no plan sentence limiting a unit's test runs (*"that is the only test file this task runs"*) cancels point 7: the guard run is the loop's, never the plan's … every reviewer of one raises a breach as a **Must Fix**."* "Run no test file" is exactly such a sentence. An implementer who follows it literally skips the guard run that this change is meant to trigger.

   **Fix:** In `task_5_plan.md` → **Verification:**, first bullet, delete *"Run no test file: this task creates or edits none."* Do not replace it with anything about which tests run, and do not name the guard file. The bullet then ends after *"…and the trailing rule line."*

## Should Fix

1. **`task_1_plan.md`: say that `jq` is needed only on the clone arm** (re-raised from iterations 0 and 1). This is still neither resolved in the file nor recorded under `## Rejected findings`.
   - The problem text: **Work:** *"Every other outcome exits non-zero. That includes … no git and no `jq`"*, and the `CLAUDE.md` wording *"and so does a missing `jq`"*.
   - Both can still be read as silencing the offer in a main checkout that has no `jq`, which breaks *"Today's answer is unchanged in the main checkout and in a linked worktree"*.
   - State that the F2 arm uses no `jq`. Optionally, add a `task_7_plan.md` case that runs the F2 arm with `jq` taken off `PATH`.
2. **Story index → `## Scope register`, rows 24, 26 and 28: `line 5` is a line coordinate** (re-raised). Use the quoted anchor *"at the main worktree's root"* instead. The same applies to:
   - `task_1_plan.md` → `### Targets` (*"the line-5 paragraph"*) and its **Verification:** diff bullet;
   - `task_12_plan.md` → `### Targets` and **Verification:**.
3. **`task_12_plan.md`: a possible README edit is missing from `### Targets`** (re-raised). **Work:** → **Recount only if needed.** may edit `examples/notes-app/README.md`. Either list it as a conditional target, or have the task stop with a blocker if a recount differs.
4. **`task_6_plan.md`: case (f2) has no stated mutation** (re-raised). The mutation *"make the clone arm return `<root>`"* is recorded against (f) only. It also turns (f2) red, because the lock lands in the clone. Say so, and record (f2)'s red run alongside (f)'s.
5. **`task_2_plan.md`, fifth **Verification:** bullet: the whole-file `grep -o '\${CLAUDE_PLUGIN_ROOT}/…'` can list more than the 21 roster files** (re-raised). The module must also carry a sentence citing `dispatch_discipline_instructions.md`'s `## Activation`. Scope the grep to the lines under `## Who may cite this`, as `task_8_plan.md` does, or require that sentence to cite repo-relative.
6. **`task_10_plan.md`: *"Cite no roadmap item number"* sits uneasily with `.claude/context/conventions.md` → `## Documents of record`** (re-raised). That section says *"A deferral cites a numbered roadmap item, and the number owes a row"*.
   - Either cite the existing `docs/development.md` → `## 6` item 21 (measuring what the unattended sandbox breaks), which owns the owed measurement;
   - or state in the task why rows owed to a hand measurement are not deferrals under that rule. The G4–G7 "owed measurements" precedent in `docs/sandbox-verification.md` is the argument.

## Nice to Have

1. **`task_3_plan.md`: say the tree is red between Tasks 3 and 6** (carried). After Task 3, `cli/test/qa-user-locks.test.mjs` case (f) fails until Task 6 rewrites it. No unit in between runs that file, and it is not a tree guard. A sentence under **Where this task stops.** would save a later reader from investigating it.
