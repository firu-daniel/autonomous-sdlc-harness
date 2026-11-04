# Task plan review — iteration 4

Both Must Fix findings from `review_3.md` are resolved in the files:
- Task 10's `makeGate12Fixture` seeds a `.gitignore` holding `<stateDir>/scratch/*`. That is the rule `contentsIgnoredDirectory(stateDir, 'scratch').contents` renders through `{{scratchGlob}}` (`cli/src/generators/repoRoot.ts`, `cli/templates/repo/gitignore`). Task 10 asserts it with its own case, and Tasks 3, 4 and 11 restate it.
- Task 5 refuses (2) when `other_branch` is already recorded, and records `other_branch` before the push. Task 12 restates both and tests the refusal.

The round-3 Should Fix is applied as well: Task 10 has a `remoteRunExit` option, and Task 12 restates it.

Re-run of the Scope register:
- **Entry 1:** re-ran verbatim. It reaches 22 sites, every one a row (rows 1–22):
  - `docs/cli.md` lines 186, 198, 323 and 482;
  - `docs/development.md` lines 221, 1147, 2378, 2421 and 2795;
  - `docs/outer-loop-verification.md` lines 217, 225 and 226;
  - `docs/remote-execution.md` lines 328, 347, 348, 349, 775, 930 and 947;
  - `docs/sandbox-verification.md` lines 17, 859, 913 and 915.
- **Entry 2:** re-walked. The 16 §10 body rows are rows 23–38.
- **Entry 3:** re-walked. It reaches rows 1, 2 and 39.

Structure checks:
- The index and the per-task files correspond 1:1 (18 and 18).
- Every task carries one layer tag and is at or under 20 points and 5 `**Work:**` bullets.
- No `**Depends on:**` points forward.
- No task targets a conventions document.
- No Verification bullet runs a test file the task does not create.

## Must Fix

1. **JS4's residual evidence file: Task 13 asserts what Task 6 says it will never write** — `task_6_plan.md` and `task_13_plan.md`.
   - **Task 6 says no file.** `runs.sh` → `g12_evidence` says: *"Rows that pass keep no evidence file: it is written only after the verdict is known."* JS4's bullet only says *"A marker line in `Bootstrap the checkout` goes into the evidence as the known residual … **not** a fail"*. It names no exception to that rule. So Task 6's implementer writes nothing to `evidence/JS4.log` when JS4 passes.
   - **Task 13 asserts a file.** Its JS4 bullet: *"The marker only in `Bootstrap the checkout` is a `pass`, and the evidence file names the residual."* Its last bullet: *"A passing row leaves no `evidence/<row>.log` on disk"*. The two contradict each other, and the first contradicts Task 6.
   - **Why Task 13 cannot fix it.** Task 13 is a `cli` task whose only target is `cli/test/gate12-sandbox-round-grade.test.mjs`. It cannot change `scripts/lib/gate12-sandbox-round/grade-plant.sh`, so its case can only fail or be weakened.
   - **What the ledger requires.** The residual lines are a reading. `harness-runs/lessons.md` → *"A measurement script stores and reports every reading in full; truncation belongs to a display, never to the record a verdict is read from."* The result line cuts its evidence at the first newline (Task 1). So writing the residual only into that field truncates it.
   - **The same gap in Task 8.** Task 8 already writes an evidence file on a pass for FR2 (the install step's lines) and FR4 (the denied calls). Task 6's general rule names neither exception.

   **Fix:**
   - In `task_6_plan.md`, change the `g12_evidence` bullet to: rows that pass keep no evidence file, **except** a pass whose evidence is itself a reading kept in full. Name the exceptions: JS4's `Bootstrap the checkout` marker lines (here), and FR2 and FR4 (Task 8).
   - In JS4's bullet in `task_6_plan.md`, say that those marker lines go through `g12_evidence JS4` in full, even when JS4 passes. The result line's evidence names the file.
   - In `task_13_plan.md`, restate that exception under **Depends on:** → Task 6.
   - In `task_13_plan.md`, limit the *"A passing row leaves no `evidence/<row>.log`"* assertion to a row with no such exception, for example JS1 passing. Keep the JS4 assertion that the file holds the residual line in full.

## Should Fix

- **Task 13's JS1 `pass` has no stated way to make the stub `remote-run.sh status` print `failed`** (`task_13_plan.md`).
  - **What the grade reads.** Task 6 grades JS1 partly on `bash <scriptsDir>/remote-run.sh status <branch>` printing the state `failed`. The real verb prints `state: <x>`: `verb_status` and `status_from_github` in `cli/templates/scripts/remote-run.sh`, the latter indented as `  state: <x>`.
  - **What the stub does.** Task 10's stub `remote-run.sh` only logs its argv and exits `remoteRunExit`. It prints nothing.
  - **The gap.** Task 13 asserts JS1 `pass` on both arms, but states neither the `state:` line format nor how its fixture makes the stub print one.
  - **The fix.** Do both:
    - In `task_6_plan.md`, cite the `state: <x>` line the grader parses, by symbol.
    - In `task_13_plan.md`, state that the suite rewrites the stub `remote-run.sh` in the fixture's working tree so that `status <branch>` prints `state: failed`. Add a case where it prints `state: paused`, which makes JS1 `fail`.
- **What `grade` without `--full-run` does with FR1–FR7 is not stated** (`task_6_plan.md`, `task_8_plan.md`).
  - **The ambiguity.** Task 6's `g12_grade_cmd` calls `g12_grade_plant`, `g12_grade_state` and `g12_grade_full_run`, and with `--full-run` only the last. So without `--full-run`, it seems to call `g12_grade_full_run` with no branch. Task 8 takes `<branch>` as a required argument.
  - **What is unspecified:**
    - a plain `grade`, and `grade --row FR1` without `--full-run`;
    - whether a `--full-run` given together with `--row` is refused.
  - **The fix.** State one answer in both files. For example: without `--full-run`, `g12_grade_full_run` is not called, and each FR row that is selected or listed prints `not run` with `needs --full-run <branch>`.

## Nice to Have

- As in rounds 0–3, the readiness list puts the catch-all `general` Tasks 1–9 ahead of the `cli` tests, because each test drives a script that must already exist. No `**Depends on:**` points forward, and the **Ship order.** paragraph argues the order. Noted, not graded.
