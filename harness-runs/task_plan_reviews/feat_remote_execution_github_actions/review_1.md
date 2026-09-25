# Task plan review — iteration 1

All five Must Fix findings from iteration 0 are resolved in the artifact:
- Task 11 now blocks the dispatch when the commit or push fails on the remote arm.
- The `chain` count has one source: Task 9 sets it and Task 8 reads it, and both have cases.
- `auto_resumes` is reset when a user dispatches (Tasks 9 and 10).
- Task 10 sets the pause lower bound from `control_polled_at` or the run's `createdAt`.
- Task 6 no longer re-applies a bundle it has already synced.

The structural checks still hold:
- 33 index entries map one to one onto 33 files.
- Every task carries a single-layer tag and at most 20 points.
- Every task has at most 5 `**Work:**` bullets.
- The tasks are ordered bottom-up, as `cli`, then `plugin`, then `general`.
- No task targets a conventions document, and the `## Corpus staleness` entries are typed.

I re-ran derivation entries 2 through 8 verbatim, and every hit is a row. I walked entry 9, and it reaches no row. Two new Must Fix findings follow. One is a stuck state that the new sync short-circuit introduces. The other is an under-inclusive entry 6.

## Must Fix

1. **`sync` can leave a dead remote run stuck at `running`, and nothing the user can run gets it out** — `task_6_plan.md`.
   `sync` takes the newest `harness run <branch>` run. When that run has finished, `sync` "walks the finished runs newest first until one has a `harness-state` artifact". If the selected run's id equals `remote_run_id`, it "rewrites no record field except `remote_synced_at`".
   That walk silently skips a newest finished run that has **no** bundle. The task prompt names three such cases:
   - a runner failure (`### A remote run supervises itself` → **When the job is killed**, *"a runner failure"*), where no `always()` step runs, so nothing is uploaded;
   - a job cancelled while it was still queued;
   - a pending run that GitHub replaced in the concurrency group.

   Here is the path that gets stuck:
   - Job A parks, and `sync` applies its bundle, so `remote_run_id` is A.
   - The user answers. Task 12 relays the answer, which sets the record to `running`, and a later `sync` also writes `running` while B is in progress.
   - B dies with no bundle.
   - Every later `sync` walks past B, selects A, short-circuits, and leaves the record at `running`.

   From then on the user has no command that recovers the run:
   - `/autonomous-sdlc-harness:branch-resume` refuses a `running` record.
   - `/autonomous-sdlc-harness:branch-status` reports it as running.
   - A re-drop is archived as a duplicate, because Task 11 says *"a remote record still `running` after the sync is archived as a duplicate"*.

   The only way out is an undocumented `remote-run.sh stop` followed by a re-drop. That breaks Acceptance 9 (*"the next start resumes from the pushed ledger without manual cleanup"*). The mapping this task already has for a job that ended mid-run (`paused` / `killed`) never fires, because it is keyed on a bundle that says `running`, and here there is no bundle.

   **Fix:** In `task_6_plan.md`, state that the newest finished run decides the status whenever it is newer than `remote_run_id` and carries no bundle. `sync` then records `status: paused` and `pause_reason: killed`, sets `remote_run_id` / `remote_run_url` to that run, names its URL in the detail, and restores nothing, so no mirror file moves and the answer-survives property holds. The next `/autonomous-sdlc-harness:branch-resume` then dispatches `resume: pause`, and Task 7's `restore` picks up the newest earlier bundle.
   - Limit the already-synced short-circuit to the case where the **newest finished** run is itself the synced one.
   - Keep the existing `failed` mapping only for "no bundle in any run", or state why that case stays `failed`.
   - Add a case: sync a parked bundle from run A, add a newer finished run B with no artifact to the canned list, and sync again. The record must be `paused` / `killed` with B's URL, `answer_1.md` must still be in the mirror, and nothing new may appear under `remote_superseded/`.

2. **Scope register: derivation entry 6 misses three sites that say the watcher does not commit a dropped review** — story index (`feat_remote_execution_github_actions_story_plan.md`), `## Scope register`.
   Entry 6's class is "sites stating which dropped artifacts are committed". Task 11 changes the answer for a remote run: the watcher now commits the review as `chore: add user review for <branch>`. Entry 6's regex does not reach these three sites, and none of them is a row:
   - `docs/watcher.md` → **The three patterns** table, the `<branch>_review[_<n>].md` row, whose last cell reads *"— **not committed**, round suffix intact"*. Task 30 edits step 5 but not this table, and register row 54 does not list it.
   - `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3 — commit the fix plan + source review after the gates converge`, the paragraph **"Why a commit is needed here."**, which says: *"the **source review file** the watcher copied into the worktree before launch (`autonomous-watcher.sh` defers committing it to "the flow's normal commits") is likewise never committed"*.
   - `plugin/commands/branch-start-user-review-fix-autonomous.md` → step 5, **"Tree-state precondition."**, which says: *"Untracked files under `<state_dir>/` (the dropped review file, fix-plan files from a parked run) are **expected**"*.

   A corrected entry 6, strictly wider than the one on the page:

   ```
   git grep -n -i -E "deliberately not committed|placed and deliberately|placed and NEVER committed|is placed and not committed|for two of the three patterns committed|\*\*not committed\*\*|defers committing|flow's normal commits" -- . ":!harness-runs" ":!examples/notes-app" ":!scripts" ":!cli/templates/scripts/*.sh"
   ```

   It reaches the existing row 45 plus the three sites above.

   **Fix:** In the story index, replace entry 6's command with the wider one above. Add one row per newly reached site, each with a disposition: `change` naming the owning task, or `no-change` with a reason. A `no-change` reason could be that Override 3 stages an already-tracked, unchanged review harmlessly. The `docs/watcher.md` table row is naturally Task 30's; if it goes there, add it to `task_30_plan.md`'s Targets and `**Work:**`. If the watcher header comment *"THE WATCHER DELIBERATELY DOES NOT COMMIT THIS ONE"* in `process_inbox_file` is to be qualified, name that in `task_11_plan.md`'s Targets too.

## Should Fix

1. **`task_11_plan.md` — an unresolvable `execution.target` is still treated as `local`** (carried from iteration 0, and not recorded as rejected). `hr_execution_target` exits 2 for an out-of-enum value, and the library header argues against treating 2 as 1. Silently running a typo'd remote setting locally bills the local subscription. Prefer `fail_before_launch` naming the value, or record the rejection with its reason.
2. **`task_15_plan.md` — the plugin pin assumes the CLI and plugin versions move in lockstep** (carried from iteration 0). Cite the rule, or record in the template header that the job enforces it as an assumption.
3. **`task_20_plan.md` — link form** (carried from iteration 0). Every link in `cli/README.md` is an absolute `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/…` URL, because the file is published to npm. State that the `docs/remote-execution.md` pointer takes that form.
4. **`task_18_plan.md` — `origin/<defaultBranch>` is not GitHub's default branch.** Task 5 itself notes that GitHub's default branch *"may differ from the configured `defaultBranch`"*, and workflow dispatch keys on GitHub's. The offline `warn` row should test `origin/HEAD` when git records it, and fall back to the configured branch only when it does not. Alternatively, the detail can say which branch it tested.
5. **`task_21_plan.md` / `task_28_plan.md` — the verb lists omit `run-created-at`.** Task 10 adds `remote-run.sh run-created-at`. Task 21's per-entry reason list and Task 28's job-side verb list name `pause-requested` but not `run-created-at`.

## Nice to Have

1. **Story index — the register still skips row 38.**
