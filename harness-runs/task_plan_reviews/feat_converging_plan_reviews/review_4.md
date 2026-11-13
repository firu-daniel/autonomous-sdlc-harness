# Task plan review — iteration 4

Review 3's Must Fix 1 is resolved:
- Task 32 (`general`) restates `g12_fr6_restore`, its comment, the FR6 row of `docs/sandbox-verification.md` and both FR6 bullets of `docs/development.md`.
- Task 33 (`cli`) pins the withheld pass in `cli/test/gate12-sandbox-round-full-run.test.mjs`. It extracts the line out of `verb_restore` with the pattern the suite already uses.
- `task_7_plan.md` names both tasks under **Where this task stops**.
- The index carries E6 and rows 78–83.

I verified the following against the tree:
- `g12_fr6_restore`'s current `placed [0-9]+ planning file\(s\)` read and its `fail` evidence.
- The suite's `extract(verbRestore, …)` idiom, `fullRun({ placed })`, `PLANNED_BUNDLE`'s two files, and the existing `no placed line … is fail naming the count` case.
- `cli/test/remote-run.test.mjs`'s `restore keeps a planning file …` case. Its fixture commits the story index.
- `cli/test/gate12-sandbox-round-docs.test.mjs`. It reads only the `--list` row table, so Task 32's doc edits do not touch it.

Review 3's Should Fix 1 (the `remote-run.sh` header's `restore` description) is now a Task 7 target and Work item.

I re-ran E1, E2, E3 and E6 verbatim and re-walked E4 and E5. Every site any of them reaches is a register row.

I tested the `## Rejected findings` entries. Each defers a Should Fix or Nice to Have under the user's ruling in `harness-runs/clarifications/feat_converging_plan_reviews/answer_1.md`. That reason holds, and none of them is graded Must Fix.

## Must Fix

1. **`task_32_plan.md` — a Verification sentence limits the task's test runs so that it excludes the tree-guard run.**
   **Raised against:** `task_32_plan.md` → **Verification**, first bullet: "This task runs no test suite: its one consumer test, `cli/test/gate12-sandbox-round-full-run.test.mjs`, is Task 33's edit and Task 33's run."
   **Must hold:** no plan sentence limits a unit's test runs in a way that cancels the loop's tree-guard run (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 4 and 7). Task 32 may say which test file it does not edit. It never states that the unit runs no test.

   Task 32 edits `docs/sandbox-verification.md` and `docs/development.md`. Both match the `covers` glob `**/*.md` of the `treeGuards` entry `test/no-container-home-paths.test.mjs` in `devscene.config.json`. Point 7 therefore selects that guard for this unit, and the unit must run it after its own test runs, on every row. "This task runs no test suite" tells the implementer the opposite. Point 4 names this exact shape: *"no plan sentence limiting a unit's test runs (… "that is the only test file this task runs") cancels point 7: the guard run is the loop's, never the plan's"*. Point 4 grades it a Must Fix for every reviewer.

   **Fix:** In `task_32_plan.md` → **Verification**, delete the sentence "This task runs no test suite: its one consumer test, `cli/test/gate12-sandbox-round-full-run.test.mjs`, is Task 33's edit and Task 33's run." If the ownership point is still wanted, replace it with a sentence that limits only edits. For example: "This task creates and edits no test file. `cli/test/gate12-sandbox-round-full-run.test.mjs` is Task 33's edit." It must not say what the unit runs. Make no other change to Task 32.

## Nice to Have

1. **The index's `## Context`: one more reader of the committed story index, checked and found unaffected.** `cli/templates/scripts/remote-run.sh` → `control_review_story` refuses a user-review round unless origin's tip carries the story index ("which a user-review round reads"). After this branch, a pushed but unconverged plan also satisfies that check. The check runs only after `branch_settled_var` finds the run settled, though, and a run is not settled mid-planning or while parked. So the "has planned its stories" premise still holds. This is outside E1–E6's reach and not a defect. A one-line `no-change` register row would record that the task prompt's Part 4 "*verify* every reader that infers convergence … from committed plan files" covered it.
