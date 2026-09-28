# Task plan review — iteration 2

Both Must Fix findings from iteration 1 are resolved in the artifact:
- `task_6_plan.md` now resolves `sync` through four ordered cases. The new case 3 records a newer run that has no bundle as `paused` / `killed`, restores nothing, and re-points `remote_run_id`. The short-circuit is limited to the case where the newest finished run is itself the synced one. The dead-newer-run test case is present.
- Derivation entry 6 carries the wider command. Rows 72–74 dispose of the three sites it newly reaches. `task_30_plan.md` targets the patterns-table row, `task_24_plan.md` targets Override 3, and `task_11_plan.md` names the two watcher comments.

The structural checks still hold:
- 33 index entries map one to one onto 33 files, and every `### Task N` heading matches its filename and its entry.
- Every entry carries a single-layer tag and at most 20 points.
- Every file has at most 5 `**Work:**` bullets, plus a Goal, `### Targets` and `**Verification:**`.
- The order is bottom-up: `cli`, then `plugin`, then `general`.
- No task targets a conventions document, and all three `## Corpus staleness` entries are typed `stale-rule`.

I re-ran derivation entries 2 through 8 verbatim, and every hit is a row. I walked entries 1 and 9: entry 1 reaches rows 1–7, and entry 9 reaches no row.

## Must Fix

1. **`remote-run.sh stop` does not reach a usage-paused run that is waiting for the poller, and the poller later resumes it** — `task_5_plan.md` (with `task_8_plan.md` and `task_15_plan.md`).
   The task prompt requires that stopping a remote run outright reaches it: *"`/autonomous-sdlc-harness:branch-pause` must reach a remote run too, and so must stopping one outright"*. It also requires, at minimum, that *"a chain of jobs must stop re-dispatching itself once the user has cancelled it"*.

   Task 5's `stop` only cancels runs whose status is `queued`, `in_progress` or `waiting`, and then sets the **local** record to `failed`. Consider a run on a hosted runner that hit a usage limit whose reset is more than `REMOTE_WAIT_MAX_SECS` away:
   - Task 10 writes `wait-poller`, and Task 8's `continue` enables `harness-resume.yml`.
   - The job ends, so no run of that branch is queued or in progress.
   - `stop` therefore cancels nothing on GitHub.
   - Task 8's `poll` reads only GitHub-side state: the newest `harness run <branch>` run, and a bundle saying `paused` / `usage` with a reset that has passed. At the next tick after the reset it dispatches `resume: pause`.

   The run the user stopped then continues, and it bills the user's subscription and runner minutes. The only way to prevent this is `HARNESS_REMOTE_STOP`, and that stops every branch. This is the ordinary path for a 5-hour limit on a hosted runner, not an edge case.

   **Fix:** In `task_5_plan.md`, make `stop` leave a stop marker that GitHub can see and `poll` reads. For example, have `stop` also dispatch `action: stop` on the branch, as `pause` does: its `run` job is skipped, no minute is billed, and the run is titled `harness stop <branch>` by the existing `run-name`. Add `stop` to the `action` values in the input-contract table.
   - In `task_8_plan.md`, have `poll` skip a branch whose newest `harness stop <branch>` run is newer than its newest `harness run <branch>` run. Give `continue` the same test before it dispatches.
   - Restate the new `action` value in `task_15_plan.md`'s input list and in its workflow-template test.
   - Add cases. In Task 5: `stop` sends `action=stop` even when no run is in progress. In Task 8: a due usage-paused branch with a newer `harness stop` run is not dispatched, and the poller disables itself when that branch was the only one waiting.
   - Another mechanism is acceptable if it has the same property: the user's stop reaches a run that no job is currently executing.

## Should Fix

1. **`task_24_plan.md` — the `### 2.0` table's API-overload row still says it never auto-resumes.** The row reads *"no — an outage has no predictable reset; waits for `/autonomous-sdlc-harness:branch-resume`"*. Work bullet 2 adds the bounded remote auto-resume to `### 2.5`, but Work bullet 1 edits only the operator, usage and new budget rows of the `### 2.0` table. The same file would then contradict itself. Qualify the overload row's `Auto-resumes?` cell: no for a local run, bounded by `REMOTE_AUTO_RESUME_MAX` in a remote job.
2. **`task_5_plan.md` / `task_28_plan.md` — a dispatched run uses the workflow file as it exists on the `--ref` branch.** The dispatch sends `--ref <branch>` for `run`, `pause` and the poller's resumes, and GitHub runs the workflow definition from that ref. So:
   - A branch created before `harness-run.yml` reached the default branch cannot be dispatched.
   - An adopter's later tuning on the default branch does not reach existing branches.

   The failure is reported (exit 3, then a `failed` record and notification), so it is not silent. It should still be stated in `remote-run.sh`'s header and in `docs/remote-execution.md` `## 4.` or `## 6.`, and recorded as a Gate 12 observation (Task 31).
3. **`task_11_plan.md` — an unresolvable `execution.target` is still treated as `local`** (carried from iterations 0 and 1, neither resolved nor recorded under `## Rejected findings`). `hr_execution_target` exits 2 for this case, and the library header warns against a consumer that treats 2 as 1. Prefer `fail_before_launch` naming the value, or record the rejection with its reason.
4. **`task_15_plan.md` — the plugin pin assumes the CLI and plugin versions move in lockstep** (carried from iterations 0 and 1). Cite the rule that makes this true, or record in the template header that the job enforces it as an assumption.
5. **`task_20_plan.md` — link form** (carried from iterations 0 and 1). `cli/README.md` line 11 states that *"every repository link on this page is an absolute URL"*, because the tarball does not carry `docs/`. State that the `docs/remote-execution.md` pointer takes the `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/…` form.
6. **`task_18_plan.md` — `origin/<defaultBranch>` is not GitHub's default branch** (carried from iteration 1). Task 5 itself says GitHub's default branch *"may differ from the configured `defaultBranch`"*. Test `origin/HEAD` when git records it, or name in the detail which branch was tested.
7. **`task_21_plan.md` / `task_28_plan.md` — the verb lists omit `run-created-at`** (carried from iteration 1). Task 10 adds `remote-run.sh run-created-at`. Task 21's per-entry reason list and Task 28's job-side verb list name `pause-requested` but not `run-created-at`.

## Nice to Have

1. **Story index — the register still skips row 38.**
