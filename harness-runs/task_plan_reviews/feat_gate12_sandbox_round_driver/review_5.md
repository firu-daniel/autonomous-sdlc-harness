# Task plan review — iteration 5

The Must Fix from `review_4.md` is resolved in the files:
- `task_6_plan.md` → `g12_evidence` now names exactly which passing rows keep an evidence file: JS4's `Bootstrap the checkout` marker lines, and FR2 and FR4 (Task 8).
- JS4's bullet writes those lines through `g12_evidence JS4` even when JS4 passes.
- `task_13_plan.md` restates that exception under **Depends on:** → Task 6.
- Task 13 limits the no-evidence-file assertion to JS1, and asserts that two residual lines are kept whole.

The two **Should Fix** findings from `review_4.md` were not applied. Neither was recorded under a `## Rejected findings` section, and the story index has none. So both are unaddressed and are raised again below.

On a fresh reading, each one is a contradiction between two per-task files, and the test task cannot resolve it from its own file. That is the same class as round 4's Must Fix, so both are now graded **Must Fix**. `harness-runs/lessons.md` → *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."*

Re-run of the Scope register:
- **Entry 1:** re-ran verbatim. It reaches 22 sites, and each is a row (rows 1–22).
- **Entry 2:** re-walked. The table under **Reading a result.** has 16 body rows: FR1–FR7, JS1, JS3, JS3N, JS4, SB2, SB3, SB4, RJ2 and RJ3. They are rows 23–38.
- **Entry 3:** re-walked. It reaches rows 1, 2 and 39.
- The closure holds, and no count is baked in.

Structure checks:
- The index and the per-task files correspond 1:1, 18 to 18.
- Each task has one layer tag and is at or under 20 points and 5 `**Work:**` bullets.
- No `**Depends on:**` points forward, and no task targets a conventions document.
- No Verification bullet runs `commands.test`, a gate script, or a test file the task does not create.
- No new suite reads a tree: Tasks 13 and 17 read fixed files.

## Must Fix

1. **JS1's `pass` cannot be reached in Task 13's fixture. Neither file states the `remote-run.sh status` output the grader parses** — `task_6_plan.md` and `task_13_plan.md`.
   - **Task 6, the producer.** `grade-plant.sh` → JS1 requires `bash <scriptsDir>/remote-run.sh status <branch>` to print the state `failed`. It does not say which line it parses. The real verb prints `state: <x>`: `status_from_github` prints `  state: %s` after `remote-run.sh: no local record; state from GitHub (newest run):`, and `verb_status` prints `state: %s` (`cli/templates/scripts/remote-run.sh`).
   - **Task 10, the fixture.** Its stub `<scriptsDir>/remote-run.sh` *"appends its argv to a log and exits `remoteRunExit`"*. It prints nothing.
   - **Task 13, the consumer.** It asserts *"The expected shape on both arms is `pass`"* for JS1, and it uses JS1 at that shape as its no-evidence-file case. Task 13 restates the check only as *"`remote-run.sh status` printing `failed`"*. It does not say how its fixture makes the stub print that, or in what form.
   - **The result.** As written, the stub prints nothing, so JS1 grades `fail` or `not run`, and Task 13's JS1 cases and its evidence-file case cannot pass.
   - **Why this is a cross-task contract.** Each implementer reads only their own file, so the two would choose the line format independently. That is a contract stated on neither side.

   **Fix:**
   - In `task_6_plan.md` → JS1, name the line the grader parses, by symbol: the `state: <x>` line printed by `verb_status` / `status_from_github` in `cli/templates/scripts/remote-run.sh`, matched with leading whitespace allowed. Say what a missing `state:` line grades as. For example: `fail`, with the evidence `remote-run.sh status printed no state`.
   - In `task_13_plan.md`, restate that format under **Depends on:** → Task 6. Add a Work sub-bullet: the suite overwrites the fixture checkout's stub `<scriptsDir>/remote-run.sh` in the working tree so that `status <branch>` prints `state: failed`.
   - In `task_13_plan.md`, add a case where the stub prints `state: paused` and JS1 grades `fail`.

2. **What a plain `grade` does with FR1–FR7 is stated two contradictory ways** — `task_6_plan.md` and `task_8_plan.md`.
   - **Task 6.** `g12_grade_cmd` *"calls, each only if defined: `g12_grade_plant` …, `g12_grade_state` … and `g12_grade_full_run` …. With `--full-run` it runs only the last."* Without `--full-run`, then, it calls `g12_grade_full_run`, with no branch to pass.
   - **Task 8.** Task 6 *"calls `g12_grade_full_run <branch>` for `--full-run`"*, and `<branch>` is required throughout: `gh run list … --branch <branch>`, and `git fetch origin <branch>` for FR4.
   - **The consequence.** Every plain `grade` in Tasks 7 and 13 depends on how this is resolved. Examples are Task 7's *"`grade` with no `--row` prints SB4 exactly once"* and Task 13's *"The exit status is 4 whenever any line printed `fail`, and 0 otherwise"*. If an empty-branch `git fetch` raises 3, Task 13's exit-0 assertion breaks. If the FR rows print `fail`, the exit is 4. Neither test file can settle it, because neither owns the dispatch.
   - **What is unspecified.** `grade --row FR1` without `--full-run`, and `--full-run` combined with `--row`.

   **Fix:** state one rule in both `task_6_plan.md` (`g12_grade_cmd`) and `task_8_plan.md` (**Depends on:**). For example:
   - Without `--full-run`, `g12_grade_full_run` is never called. Each FR row that is selected, or listed when no `--row` is given, prints `not run` with the evidence `needs --full-run <branch>`.
   - `--full-run` given together with `--row` is a usage error (exit 1).

   Then restate the rule in `task_13_plan.md` → **Depends on:** → Task 6, so its exit-status assertion covers the FR lines a plain `grade` prints.

## Nice to Have

- As in rounds 0–4, the readiness list puts the catch-all `general` Tasks 1–9 ahead of the `cli` tests, because each test drives a script that must already exist. No `**Depends on:**` points forward, and the **Ship order.** paragraph argues the order. Noted, not graded.
- The story index's `## Context` carries a Markdown route table. The sample's Context is prose. It is not a listed format break and is left as it is.
