# Task plan review — iteration 1

Every Must Fix from iteration 0 is resolved in the artifact. Task 2 now has five `**Work:**` bullets. Task 7 makes a never-started first run resumable. Task 9 keeps a separate consecutive download count and reports only by push. Register row 79 and rows 80 to 87 exist, along with D14. Task 8's `forge_report not_started` arm composes the way on. The architecture review's two Must Fixes are also resolved: Task 4 amends fence entry 4, and Task 5 updates the `COMMENT_MARKER` doc comment, with `cli/src` in D8.

All fifteen readiness entries map 1:1 to their files. Each entry carries one layer and a points value of 20 or less, no file has more than five `**Work:**` bullets, and the order runs bottom-up with `general` last. I re-ran D1 to D8 and D14 word for word, and every site they reach is a row. Three new Must Fixes follow.

## Must Fix

1. **A first run that GitHub never started still cannot be resumed from GitHub: `control_check_branch` refuses its branch before `resume` is reached.** Files: `task_10_plan.md`, `task_7_plan.md` and `task_8_plan.md`, plus the story index's `## Context` (finding 3 bullet and finding 5 paragraph).
   - `verb_start` commits only the task prompt (`hr_place_artifact` / `hr_commit_placed` on `$rel`, the prompt path). So a branch whose first job never ran has no flow-progress ledger on origin.
   - Every `@sdlc-harness` command passes `control_check_branch`, which refuses when `forge_recognised` fails: "`<b>` is not a harness branch: its tip carries no flow-progress ledger".
   - Task 10 widens that test only to a `harness run <branch>` run that is `queued`, `in_progress`, `waiting`, `requested` or `pending`. A never-started run is `completed` (its `run` job ended `cancelled`), so it is still refused.

   The result: the comment Task 8 posts on the issue for a first run ("Comment `@sdlc-harness resume` …") leads straight to a "not a harness branch" refusal. That is the misleading-refusal failure finding 6 lists. Task 7's promotion of Case 5 to `paused` / `killed` can then never be reached from GitHub, so finding 3's and finding 6's **Expected** lines are still unmet for that case.

   The tests would not catch it. `cli/test/remote-control.test.mjs` → `pushBranch` pushes `feat_x` **with** its ledger by default (`ledger = true`). Task 7's "A first run that never started" case and Task 8's first-run cases pass a recognition test that the real branch fails.

   **Fix:**
   - In `task_10_plan.md`, widen `control_check_branch` so a branch whose newest `harness run <branch>` run never started is commanded. Choose one:
     - the task prompt's own alternative, *"or when the issue carries the `started` marker for it"*. On the issue path, `control_branch_from_issue` has already verified a genuine bot `started` marker for exactly this branch;
     - or accept any listed `harness run <branch>` run, not only an unfinished one.
   - State which one in the `THE BRANCH.` text.
   - Add a case that uses `pushBranch('feat_y', { ledger: false })`, a completed run whose `run` job is `cancelled` with `steps: []`, and a bot `started` marker on the issue. `@sdlc-harness resume` on the issue must dispatch `engine=task resume=pause`.
   - Then fix the order. Either move that end-to-end case out of `task_7_plan.md` into `task_10_plan.md`, or move the recognition change ahead of Task 7. Task 7's first-run case must not run on a branch that carries a ledger.
   - Carry the chosen rule into the facts that `task_14_plan.md` (`**Who and where.**`) and `task_13_plan.md` restate.

2. **Task 7 tells the implementer to leave the `review` clause of `remote-run.sh` → `WHAT IT NEVER DOES.` alone, but `review` reaches the new fetch.** File: `task_7_plan.md`, and register row 79 in the story index.
   - `verb_review` calls `branch_settled_var` (`remote-run.sh`, `branch_settled_var "" "$allow_no_run"`), which calls `remote_state`.
   - For a never-started newest run, Task 7 then calls `forge_dispatch_engine_var` → `forge_fetch_branch`. That is a `git fetch` force-writing `refs/remotes/origin/<branch>` in `$root`, which is the main checkout for a local `/autonomous-sdlc-harness:branch-user-review`.
   - Task 4's addition to the `review` clause covers only the landed check's fetch "after a push that did not land", which is a different trigger.
   - The Work bullet says "Leave the `start`, `review` and `collect` clauses alone". The task's own verification says "every verb that reaches `forge_dispatch_engine_var` names the fetch's write". Both cannot hold. As planned, the header guarantee goes out false, which `.claude/context/cli.md` → `## What "done" means here` forbids: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit."*

   **Fix:**
   - In `task_7_plan.md`, add `review` to the clauses this task amends. It appends the never-started fetch after Task 4's text, and leaves Task 4's text unchanged.
   - Update `### Targets` to match.
   - In register row 79, list `review` among Task 7's clauses.

3. **Scope register, disposition (ii): no derivation entry reaches the sites that define `killed` as a job that ran and died. Tasks 6 and 7 make `killed` also mean a job GitHub never started, and for a first run, one with no ledger at all.** File: the story index (`fix_forge_run_control_gate12_round8_findings_story_plan.md`), `## Scope register`.
   - Rule (f) of D9 traverses only template headers. D10 traverses only `remote-execution.md` → `## 3.`, `## 6.` and `## 7.`, and `github-run-control.md`. No command entry matches the `killed` wording.
   - The sites newly reached:
     - `docs/remote-execution.md` → `## 4.` → **Central state.** (*"A job that ended without uploading one — killed before the upload, or finished while its bundle still said `running` — syncs as `paused` with `pause_reason: killed`, not `failed`, because a `failed` record has no resume path while the ledger on the branch is intact"*). After Task 7, a job that never ran syncs the same way, including a first run that has no ledger. The stated reason becomes false for that case.
     - `docs/remote-execution.md` → `## 1.` → the `/autonomous-sdlc-harness:branch-resume` row (*"A run `paused` with `pause_reason: killed` — a job that ended mid-run — resumes the same way"*).
     - `plugin/commands/branch-resume.md` → the `paused` bullet (*"A `pause_reason: killed` — a job that ended mid-run — resumes exactly like any other paused run, from the committed ledger"*). This one is false for a promoted first run.
     - `docs/remote-execution.md` → `### The kill switch and stopping` → **Closing or deleting stops a run too.** (*"`paused` with `pause_reason: killed` when the cancelled job's bundle still said `running`"*). This one is still true and owes a `no-change` row.
     - `cli/templates/scripts/remote-run.sh` → `remote_state`'s Case 3 literal `the job ended mid-run (its bundle still says running)`. Code, `no-change`.

   **Fix:**
   - Add a command entry, re-run word for word: `git grep -nE "pause_reason: killed|ended mid-run" -- docs plugin cli/templates README.md ARCHITECTURE.md`.
   - Add one row per site above.
   - Give **Central state.** a `change` disposition owned by Task 13, and add it to `task_13_plan.md`'s `### Targets`.
   - Give the `branch-resume` row in `remote-execution.md` → `## 1.` and the `plugin/commands/branch-resume.md` bullet each a disposition and owner. For the plugin site, either a `plugin` task or a stated reason. If the reason is "no task touches `plugin`", it must address the "from the committed ledger" claim, which a promoted first run makes false.

## Should Fix

- **The annotation read has no `checks` permission.** Files: `task_6_plan.md`, `task_12_plan.md`. This is the architecture review's Should Fix 1, and it is still unaddressed. `harness-run.yml`'s `permissions:` lists only `contents`, `actions`, `issues` and `pull-requests`, and its header says every unlisted permission is `none`. So `check-runs/<id>/annotations` will fail in `collect`, `control` and `poll`, and "GitHub's reason" will always fall back to the conclusion. Task 13 would then document a reason that never appears. Either add `checks: read`, with its header line, to every workflow whose job reaches `run_not_started_var`, or state in Tasks 6 and 13 that the fallback is the expected path under the shipped permissions.
- **`notify not_started` sends a word outside `autonomous-notify.sh`'s seven.** File: `task_8_plan.md`. This is the iteration-0 and architecture-review Should Fix, still unaddressed in Task 8. Task 9 states its own `bundle_unreadable` exception, and Task 8 should do the same: either state that the generic title is intended, or send the push under `paused` / `failed` and keep `not_started` for `forge_report` alone.
- **Task 14's `answer`-row addition would document a false behaviour.** File: `task_14_plan.md`. `control_answer` accepts only `parked`, and a never-started run is `paused` / `killed` or `failed`. So `answer` never acts on such a run; `resume` is the route. Drop the `answer`-row addition, or reword it to say that an answer whose dispatch never started is recovered with `resume`.
- **Task 7's "resuming it is safe" rests only on `verb_restore`.** File: `task_7_plan.md`. With `--resume pause` and no previous bundle, the job launches with `spawn_engine`'s pause-resume clause, which tells the engine to "resume strictly from the committed flow-progress ledger `<state_dir>/flow_progress/<branch>_progress.md`". For a first run, that file does not exist. Verify that the engine starts cleanly in that case and cite where, or dispatch a no-bundle-anywhere first run with `--resume none`.

## Nice to Have
