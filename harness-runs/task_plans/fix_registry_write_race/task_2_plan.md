### Task 2 — Write the watcher's paired registry keys in one call, and record every pause tag or reason before its `PAUSE`

**Goal:** Remove the two watcher-side windows that no lock can close. First, a pair of keys that a concurrent reader decides on must land in one write. Second, the tag or reason a pause is classified by must be in the registry **before** the `PAUSE` sentinel exists. Otherwise an engine that acknowledges inside the window is classified by `classify_run_exit` as `overload`: auto-resumed in job mode, and consuming `REMOTE_AUTO_RESUME_MAX`.

**Depends on:** Task 1, which widens `hr_registry_set` to `hr_registry_set <file> <branch> <key> <value> [<key> <value> …]`: one lock, one `jq`, one `mv`, returning 1 and writing nothing on an odd pair count. The watcher reaches it through its wrapper `registry_set() { hr_registry_set "$REGISTRY" "$@"; }` unchanged, so `registry_set <branch> k1 v1 k2 v2` is the call form this task uses. Task 1 also created `cli/test/registry-writer.test.mjs` and owns it; this task appends one case to it.

**Where this task stops.** It changes **when** and **how many at once** the watcher writes, never **what** it decides. The treatment of an empty `usage_resume_at`, meaning the fallback repair and the in-job wait bound, is **Task 4's**. `remote-run.sh` is **Task 3's**.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` → `usage_gate`, `classify_run_exit`, `job_control_poll`, `job_budget_pass`, `job_auto_resume`, the registry field comments `paused_by`, `usage_resume_at` and `pause_reason`, and the `registry_set <branch> <key> <value>` wrapper comment.
- `cli/test/helpers/watcher.mjs` → module header choice 1 (*"The stub sleeps before its body runs."*).
- `cli/test/registry-writer.test.mjs` (appends one case; created by Task 1).

**Work:**

- [ ] `usage_gate`: write each pair in **one** `registry_set` call:
  - the pause side's `paused_by usage` + `usage_resume_at "$resume_at"`;
  - the resume side's clear (`paused_by ""` + `usage_resume_at ""`, beside `touch "$state_abs/RESUME"`);
  - the stale-tag clear in the `running` arm.

  On the pause side, move that one write **before** `touch "$wt/$state_rel/PAUSE"`. Keep the *"Tagged BEFORE the engine acknowledges"* comment, sharpened to say the tag now precedes the sentinel too. A tag whose `touch` then fails is a `running` record with no `PAUSE`, which the stale-tag sweep in part (1) already clears on the next pass. Say so in the comment.
- [ ] `classify_run_exit`, the `JOB_MODE` pause branch: write `pause_reason "$reason"` and `status paused` in one call. The local pause branch's single `status paused` write is unchanged.
- [ ] Record the reason before the sentinel in the three job passes:
  - `job_control_poll`: `registry_set "$branch" pause_reason user` goes before `touch "$state_abs/PAUSE"`.
  - `job_budget_pass`: the `pause_reason budget` write (still skipped when `user` is recorded) goes before its `touch`.
  - `job_auto_resume`: the budget re-drop's `pause_reason budget` goes before its `touch`.

  None of them changes what is decided.
- [ ] **The watcher's header, where it describes the registry writer.**
  - The `paused_by` field comment says it is written together with `usage_resume_at` in one write, **before** `PAUSE` is dropped.
  - The `usage_resume_at` field comment keeps *"written and cleared together with `paused_by`"*, now true in one write.
  - The `pause_reason` field comment's *"`user` and `budget` are written when the PAUSE is dropped"* becomes *"before"*.
  - The wrapper comment shows the multi-pair form.

  In `cli/test/helpers/watcher.mjs`, rewrite choice 1. The stub still sleeps, but the reason is no longer a lost update: the writes are serialized (Task 1). Keep the sleep only if the case still needs it for a reason you can state, and state it.
- [ ] Append a case to `cli/test/registry-writer.test.mjs` for **the local watcher's pair**, looped enough iterations to show the invariant rather than to get lucky. In each iteration, two processes run at once against one fixture that `createWatcherFixture` wired:
  - (i) the gate's pause write, in the form `bash -c '. "$1" status >/dev/null; registry_set feat_x paused_by usage usage_resume_at <epoch>'`, the watcher header's own REPRO form;
  - (ii) `classify_run_exit feat_x <worktree> <log> 0` sourced the same way, with `PAUSE_ACK` present and `HARNESS_JOB_MODE` unset, which writes `status paused` through the local pause branch.

  Every iteration ends with all three of `status paused`, `paused_by usage` and a numeric `usage_resume_at`.

**Verification:**

- Your new case in `cli/test/registry-writer.test.mjs` passes, and so do Task 1's cases, unchanged.
- Read `usage_gate`'s pause loop: no `touch …/PAUSE` precedes the `registry_set` that writes `paused_by`. Grep the job functions: in each of the three, the `pause_reason` write comes before its `touch "$state_abs/PAUSE"`.
- Grep `usage_gate` and `classify_run_exit` for two consecutive single-pair `registry_set` calls on `paused_by`/`usage_resume_at` or `pause_reason`/`status`, and find none.
- `bash scripts/typecheck.sh` passes.
