### Task 2 — Report planning drafts in `remote-run.sh` restore and prove a pause-then-restore across two job checkouts continues the saved walk

**Goal:** Make `remote-run.sh restore` say what it placed and what it kept, and name the lost drafts when a bundle has expired. Then prove the acceptance criterion end to end. A job that pauses mid-planning saves its bundle. A second job in a **different, fresh** checkout restores it. That second checkout's saved walk is then usable: `flow-walker.sh current` re-prints the pending reviewer dispatch, and the story index that dispatch works on is on disk. The walk no longer falls back to re-running the writer.

**Depends on:** Task 1. That task defines and implements, in `cli/templates/scripts/lib/harness-run-lib.sh`:

- `hr_remote_bundle_write <root> <branch> <registry_file> <out_dir>` now also writes `<out_dir>/planning/<path under state_dir>` for each of the eight planning paths present: `story_plans/<branch>_story_plan.md`, `task_plans/<branch>`, `ui_test_plans/<branch>_ui_test_plan.md`, `ui_test_plans/<branch>`, `task_plan_reviews/<branch>`, `business_parity_reviews/<branch>`, `architecture_reviews/<branch>`, `ui_test_plan_reviews/<branch>`.
- `hr_remote_bundle_restore <bundle_dir> <root> <branch> job` places each carried file only where the checkout has nothing at that path, and assigns `HR_REMOTE_PLANNING_PLACED` / `HR_REMOTE_PLANNING_KEPT`, two integers that are `0` in `mirror` mode. Exit codes are unchanged: `0` restored, `1` failed copy, `2` unrecognised bundle, touching nothing.

This task calls those as they are, and changes nothing in the library.

### Targets

- `cli/templates/scripts/remote-run.sh` — `verb_restore`, and the header's `restore` / `save` / `sync` / `WHAT IT NEVER DOES` / `REPRO` text.
- `cli/templates/scripts/autonomous-watcher.sh` — the registry-field comment for `pause_reason`, its `expired` value only.
- `cli/test/remote-run.test.mjs` — the file header's restore/save rule, two new cases, and one extended assertion.

**Work:**

- [ ] **`verb_restore`.** Change two outputs.
  - **After a successful restore.** Straight after the existing `remote-run.sh: restored the bundle of run $id into $root` line (the `0)` arm), print one more line:
    `remote-run.sh: placed $HR_REMOTE_PLANNING_PLACED planning file(s) for $branch; kept $HR_REMOTE_PLANNING_KEPT the checkout already carries`.
    Print it only when their sum is above zero.
  - **The expired-bundle `::warning::` line.** Add the drafts to what is lost. It becomes:
    *"…: the park-loop, auto-resume and stall counts, the clarification history and any planning drafts not yet committed that it carried are lost; this job continues from the committed ledger"*.
    Keep the existing prefix, `run $id expired on $BUNDLE_EXPIRES_AT` and `committed ledger`, byte-identical, because the existing test's regex keys on them. A draft lost to expiry is reported **as an expiry**, never as a fresh start (`harness-runs/lessons.md` → *"State held only in an expiring store must be reported plainly as expired…"*).
- [ ] **Header text of `remote-run.sh`.**
  - The `restore` paragraph (*"`restore` SELECTS the newest `completed` run …"*): state that a job-mode restore also places the carried planning drafts, **never over a file the checkout already has**, and prints the placed/kept line. Its expired sentence names the lost drafts beside *"the lost counts and clarification history"*.
  - The `sync` case 3 sentence: add that a `mirror` restore places no planning draft.
  - `WHAT IT NEVER DOES`: `restore`'s writes now include the planning drafts in the job's checkout.
  - The `REPRO` block's `save` and `restore` lines: `save` lists `planning/` when drafts are present, and `restore` places them.
- [ ] **`autonomous-watcher.sh`'s `pause_reason` comment, the `expired` value.** Its parenthesis currently reads *"(the job can no longer take an answer, and the carried counts are lost)"*. Name the uncommitted planning drafts beside the carried counts, in the same words the `::warning::` line above uses. Change nothing else in that comment block and no code in the file: the value, its derivation and its mapping to `paused` are unchanged.
- [ ] **New case in `remote-run.test.mjs`: pause, then restore in a second checkout, and the walk continues.** Use `remoteFixture`, `remoteRun`, `syncEnv`, `ghRun` and `downloads`, as the existing restore cases do.
  - **Checkout A.**
    - Start and advance a planning walk with the fixture's own walker, run through `runBash` from A's root: `scripts/flow-walker.sh start --flow task_plan_writing --branch feat_x --skipped none`, then `next --flow task_plan_writing --branch feat_x --outcome returned --skipped none`. The pending node is then a reviewer, not `plan_writer`. With the fixture's `phases.parity` off, confirm by reading the printed `node:` that it is `architecture_review`.
    - Plant `sdlc-harness/story_plans/feat_x_story_plan.md` and `sdlc-harness/task_plans/feat_x/task_1_plan.md`, which are untracked, as the writer would leave them.
    - Write a status through `hr_remote_status_write` as `save after a job-mode status write …` does, then `remoteRun(A, ['save', 'feat_x', out])`.
  - **Checkout B** is a **second** `remoteFixture` that has never seen A's files.
    - Serve A's `out` directory as run 401's `harness-state` through `syncEnv({ runs: [ghRun(401, 'completed', 1)], artifacts: { 401: ['harness-state'] }, bundles: { 401: out } })`, with `GITHUB_RUN_ID: '999'`.
    - Run `restore feat_x --resume pause`.
  - **Assert:**
    - exit 0;
    - the placed line reports `placed 2`;
    - both drafts exist in B byte-for-byte;
    - `runBash(B.dir, ['scripts/flow-walker.sh', 'current', '--flow', 'task_plan_writing', '--branch', 'feat_x'])` exits 0 and prints `action: dispatch` with the same `node:` A's walk was pending on.
  - This is exactly the state in which `plugin/instructions/task_plan_writing_instructions_core.md` → **Continuing a saved walk.** finds the walk usable: its pending reviewer's artifact, the story index, is on disk.
  - **Control.** Run the same restore into a third fresh fixture from a copy of `out` with `planning/` removed. The same `current` succeeds, but the story index is absent there, which is the pre-fix state the core treats as an unusable walk. It shows the assertion above is what the bundle bought, not an artifact of the fixture.
- [ ] **New case, plus two header and assertion updates in `remote-run.test.mjs`.**
  - **New case: a path the fresh checkout already carries is kept.** In B, commit `sdlc-harness/story_plans/feat_x_story_plan.md` with different content first, through `execFileSync('git', …)` in the fixture. Restore a bundle carrying a draft of the same path. Assert:
    - the committed file is byte-identical afterwards;
    - `git status --porcelain` in B shows it unmodified;
    - the placed line reports `kept 1`.
  - **Extend the assertion of** `restore --resume pause with the newest bundle expired warns, …` to also match `planning drafts`.
  - **Add to the file header's restore/save rule** that drafts cross a job boundary only into a job checkout and never over a file the checkout has.

**Verification:**

- `bash -n cli/templates/scripts/remote-run.sh` and `bash -n cli/templates/scripts/autonomous-watcher.sh` exit 0.
- `remote-run.test.mjs`, the test file this task edits, passes when run on its own through the single-file test command the conventions state. Where none is stated, skip it and record the skip (`plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 3). That includes the new two-checkout case, the kept-file case and every existing restore and save case unchanged.
- `commands.typecheck` exits 0.
- In the two-checkout case, the pending `node:` printed in B equals the one printed in A, and B's `downloads(fx)` shows exactly one `run download 401 -n harness-state …`. This is the end-to-end exercise of Task 1's writer and restorer through the verb the workflow actually calls.
- `git diff cli/templates/scripts/autonomous-watcher.sh` touches only comment lines inside the `pause_reason` field description.
