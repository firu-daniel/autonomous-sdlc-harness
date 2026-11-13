# Task plan review — iteration 3

Review 2's Must Fix 1 is resolved in `task_7_plan.md`:
- `cli/test/remote-run.test.mjs` is now a target.
- Its fifth Work bullet re-pins the `restore keeps a planning file …` case to the tracked arm.
- `verb_restore` gains two new lines of its own, and the placed/kept line stays byte-identical, so `cli/test/gate12-sandbox-round-full-run.test.mjs`'s extraction still matches.

Review 2's Should Fix and Nice to Have items are recorded under `## Rejected findings`. Their reason holds: it is the user's ruling in `harness-runs/clarifications/feat_converging_plan_reviews/answer_1.md`.

## Must Fix

1. **Task 7's withheld arm makes the Gate 12 FR6 grader fail a correct restore, and no task updates the grader or the FR6 contract.** Applies to `task_7_plan.md` plus a new catch-all task (story index readiness list, `## Scope register`).
   **Raised against:** `task_7_plan.md`: "**Tracked:** every regular file under the six task-plan paths … is **withheld**, placed nowhere, and counted in a new `HR_REMOTE_PLANNING_WITHHELD`". Also: "the existing restored and placed/kept line are left byte-identical".
   **Must hold:** every reader that grades or specifies the restore's output accepts the new withheld outcome as a pass. This applies to a resumed job whose parked bundle holds task-plan files the checkout already tracks.

   `scripts/lib/gate12-sandbox-round/grade-full-run.sh` → `g12_fr6_restore` checks for a `placed [0-9]+ planning file\(s\)` line. If that line is missing, it reads the parked job's artifact at `planning/`. When that artifact holds any regular file, it grades FR6 **fail**:
   - `"… carries no placed <n> planning file(s) line, but run … bundle holds $count planning file(s)"`.

   Task 7 changes what a restore prints here. Save still copies every existing planning file, tracked or not (`hr_remote_bundle_write` → `hr_remote_planning_paths`). So any park after this branch's first round commit gives the following sequence:
   - The parked job's bundle holds task-plan files.
   - The next job's checkout tracks the story index.
   - The restore withholds every task-plan file. It prints `withheld <n> planning file(s) …` and no placed/kept line, because `PLACED + KEPT` is 0.
   - The grader grades that correct restore `fail`.

   This covers a writer-question park in a revision round, a cap park, and a pause or self-pause after a round commit.

   The FR6 contract states the old behaviour in three places, and none of them is a target of any task:
   - `docs/sandbox-verification.md`, the FR6 row: "`placed <n> planning file(s)` where the parked job's bundle holds a planning file".
   - `docs/development.md`, at the two FR6 specification bullets (`sandbox1c2` §1 step 6 row FR6, and the observation (xvi) **FR6** bullet): "`verb_restore` prints the `placed` line only when it placed or kept a file".
   - The grader's own comment above `g12_fr6_save`: "verb_restore prints the placed line only when HR_REMOTE_PLANNING_PLACED + HR_REMOTE_PLANNING_KEPT is non-zero".

   No `cli/test/gate12-sandbox-round-*.test.mjs` case pins the withheld outcome either.

   Register: E1–E5 do not reach these sites. None of them names a plan-review folder, a core or the plan-loop prose. They are readers of the restore output that Task 7 changes. All of these sites are newly reached and owe rows:
   - `scripts/lib/gate12-sandbox-round/grade-full-run.sh` (`g12_fr6_restore` and its comment);
   - `docs/sandbox-verification.md` (the FR6 row);
   - `docs/development.md` (the two FR6 specification bullets).

   The historical round transcripts in `docs/development.md` are `no-change`, because they are records. A corrected derivation entry that is strictly wider than E1–E5: add **E6 (command)**: `git grep -lE "planning file\(s\)|HR_REMOTE_PLANNING_(PLACED|KEPT)|kept <[nm]> the checkout" -- docs scripts plugin cli/templates ':!docs/work-report-research'`. This command reaches every reader of the restore's placed/kept output.

   **Fix:** Add a catch-all (`general`) task, ordered after Task 27 so `scripts/remote-run.sh` is already level, that:
   - restates `g12_fr6_restore` so that a `withheld <n> planning file(s) for <branch>; the checkout tracks its story index` line passes FR6, naming the withheld count the way the placed arm names its count. Only a restore with neither a placed nor a withheld line falls through to the artifact read.
   - restates the grader's comment to match;
   - restates the FR6 row in `docs/sandbox-verification.md` and the two FR6 specification bullets in `docs/development.md` to name the withheld outcome.

   That task, or a `cli`-layer task ordered before it, must also add a `cli/test/gate12-sandbox-round-full-run.test.mjs` case. In that case, a resumed job's restore log carries the withheld line (read out of `verb_restore` at test time, as the suite reads its other lines), the parked bundle holds planning files, and FR6 passes. In `task_7_plan.md`, name the new task under **Where this task stops** as the owner of the FR6 readers. In the story index, add E6 and a row for each site above.

## Should Fix

1. **`task_7_plan.md` leaves `remote-run.sh`'s header description of `restore` stale.** The header comment above the command list says that a job-mode restore "places the bundle's `planning/` drafts at their paths …, never over a file the checkout already has, and when it placed or kept any prints `placed <n> planning file(s) for <branch>; kept <n> the checkout already carries`". Task 7's `remote-run.sh` target covers only `verb_restore`'s `0)` arm. The fix is to add the header's restore sentence to that target and to name the withheld arm and its two new lines there. Task 27 then copies the result to `scripts/remote-run.sh`.
