# Task plan review — iteration 2

All four Must Fix findings from `review_1.md` are resolved in the files:
- JS3 is graded on `check_stalled_runs`'s two `log` lines, and its temporary-directory clause is a `source` line.
- SB4 has route `reads-SB2`, restated in Tasks 3, 7, 16 and 17.
- `g12_branch_push` is the one producer of `branches[]`, called by Task 5 and asserted in Task 12.
- Both round-0 Should Fixes are applied: RJ2 is settled from the source, and `runRound` builds on `runBash`.

Round 1's Should Fix on SB2's `PAUSE_PROGRESS.md` arm is applied in the route table, Task 16 and Task 18.

I re-ran the Scope register's entry 1 verbatim and re-walked entries 2 and 3. Every site they reach is a row.

The findings below are new.

## Must Fix

1. **Task 14 is over the granularity budget** — `task_14_plan.md`.
   Its `**Work:**` list has six sub-task bullets:
   1. Header.
   2. The three-run branch.
   3. The FR7 restore-log case.
   4. Without the resumed run / FR2 / FR1 / FR6.
   5. HTTP 410 / FR4.
   6. `--full-run` prints no JS, SB or RJ line.

   The ceiling is 5 bullets per task.
   **Fix:** Fold the FR7 restore-log case into the "Without the resumed run…" bullet, or fold the last bullet into the three-run-branch bullet. That brings `**Work:**` to five bullets or fewer and keeps every case. Alternatively, split the task into two single-layer `cli` tasks.

2. **The `gh` stub cannot answer the run-ID lookup for a branch whose name it cannot know in advance** — `task_10_plan.md`, with consumers `task_11_plan.md` and `task_12_plan.md`.
   - **The lookup.** `g12_dispatch` (Task 3) finds the run ID with `gh run list … --branch <branch> --json databaseId,createdAt,displayTitle` and takes the run whose `displayTitle` is `harness run <branch>`.
   - **The branch name.** Every planted branch, JS3's included, is named `gate12_<row>_<arm>_<UTC yyyymmddHHMMSS>`, stamped at run time, and no seam fixes the stamp.
   - **The stub's contract.** Task 10 only answers "from a routes file keyed by argv prefix (stdout, stderr, exit code)", with mutable state only for `repo edit` and `variable set/delete/list`. That is the static-answer shape of `cli/test/watcher-remote-dispatch.test.mjs`'s `GH_STUB`, which answers `run list` with a fixed `[]`.
   - **The effect.** A static answer can never carry the right title, so the lookup always runs out of tries and exits 3 with `run_id: null`. Task 11's success case would fail: it requires "the state's `runs[]` holds each branch with the stub's run ID". So would Task 12's success case, which needs a JS3 `runs[]` entry and then a `gh run view` poll on its ID. Neither consumer task lists the helper among its `### Targets`, so neither can add the missing capability. Each implementer would have to edit another task's file, or guess.

   **Fix:**
   - In `task_10_plan.md`, add to `ghStub`'s contract a stated way to answer `run list … --branch <b>` with a run whose `displayTitle` is `harness run <b>` and a fixed or sequential `databaseId`. For example, a route whose stdout is a template that substitutes the argv's `--branch` value, or a mode that synthesises one run per branch the stub `remote-run.sh` log records as dispatched.
   - Restate that capability, and the IDs it yields, under **Depends on:** in `task_11_plan.md` and `task_12_plan.md`.

3. **Three Verification bullets cannot pass until a later task lands** — `task_3_plan.md`, `task_1_plan.md` and `task_2_plan.md`.
   - **Task 3 needs Task 4's content.** `task_3_plan.md`'s Verification runs `plant --repo <slug> --row JS1` and expects two branches, "each carr[ying] exactly the prompt commit plus one plant commit". Task 3 states that it "does not decide any branch's content" and calls `g12_plant_files`, which Task 4 defines. Task 4 comes after it, so Task 3's own Verification depends on a later task.
   - **Task 2 may need Task 6's command.** `task_1_plan.md` says the entry point "checks the subcommand's functions with `g12_need` and calls them", without saying whether `g12_need` runs over both functions before anything is called. If it does, which is the natural reading of a "usage refusal naming the missing function", then once Task 2 lands, `grade --repo a/b` still exits 1, naming `g12_grade_cmd` (Task 6). That breaks `task_2_plan.md`'s Verification, which expects exit 2 naming the checkout refusal.

   **Fix:**
   - In `task_3_plan.md`, verify the mechanics without Task 4. Drive `g12_branch_build`, `g12_branch_push` and `g12_dispatch` against the fixture with a hand-written manifest and prompt, or with a test-local `g12_plant_files` defined before the libraries are sourced. Assert the two commits, the push, the dispatch and the `branches[]` / `runs[]` entries. Move the `plant --row JS1` end-to-end check to `task_4_plan.md`'s Verification.
   - In `task_1_plan.md`, state the call order explicitly: `g12_need g12_preflight`, run `g12_preflight` and stop on its refusal, then `g12_need <subcommand fn>` and call it. Restate that order in `task_2_plan.md`'s **Depends on:**, so its exit-2 check holds before Task 6 exists.

## Should Fix

- **FR3 passes on step conclusions alone** (`task_8_plan.md`, `task_14_plan.md`).
  - **The problem.** FR3's Expected says *"no sandboxed git write is refused in a way that stops the run"*, and its Read from is the `Run the harness` and `Push the branch` step logs. Task 8 grades only that both steps ran, and that `Push the branch` did not fail. But `Run the harness` concludes `success` even when the run ends `failed`, because `run_job` in `cli/templates/scripts/autonomous-watcher.sh` ends `echo "job: $final $decision"` then `exit 0`. So a run stopped by a refused git write grades FR3 `pass`.
  - **The fix.** Read each job's `job: <final> <decision>` line from the `Run the harness` log, and make a `failed` final a `fail` that quotes the line. Add the matching case to Task 14.
- **A local ref can be left behind unrecorded** (`task_3_plan.md`; lesson *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create."*).
  - **The problem.** `g12_branch_build` runs `git update-ref refs/heads/<branch>` before `g12_branch_push` records the name in `branches[]`. If the script exits between the two (an interrupt, or a failed `g12_state_update`), the local ref is one it created but never recorded, so `teardown` never removes it.
  - **The fix.** Record the name before the `update-ref`, or have `g12_branch_build`'s caller delete the ref it just created when the recording step fails. Say which one in the Work bullet.

## Nice to Have

- As in rounds 0 and 1, the readiness list puts the catch-all `general` Tasks 1–9 ahead of the `cli` tests, because each test drives a script that must already exist. The **Ship order.** paragraph argues this. Noted, not graded.
