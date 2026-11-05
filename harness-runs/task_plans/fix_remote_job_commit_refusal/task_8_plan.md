### Task 8 — Record the cause and the fixes in `docs/sandbox-verification.md` §9 and §10, `docs/remote-execution.md`, `docs/watcher.md` and `ARCHITECTURE.md`, confirmation owed to the next Gate 12 round

**Goal:** Write round 13's measured failure, its cause and this branch's fixes into the documents of record, with the GitHub confirmation recorded as owed to the next Gate 12 round. Restate every corpus sentence the branch's behaviour falsifies. These are the `change` rows of the story index's `## Scope register`, which is the full site list.

**Depends on:** Task 1, Task 3 and Task 6, whose behaviour this task describes and does not change.
- **Task 1:** `setup-worktree.sh` removes `core.sparseCheckout`, `core.sparseCheckoutCone` and `index.sparse` from a `config.worktree` it makes live only when each sits there once at `false`, printing `setup-worktree.sh: removed <names> (each false) from <file>, …`. It covers the bootstrapped checkout and, when the switch it flips makes it live, the main checkout's. It never touches a clone, and it leaves every other key for the unchanged `hr_worktree_config_check_var` to refuse.
- **Task 3:** `classify_run_exit` records a zero exit with an absent or unreadable ledger as `paused` / `unfinished` after a resume, a stall restart or an earlier park, logging `… after <why> — not classifying it completed`. A first launch keeps `completed`. In a job that reaches `job_auto_resume`, bounded by `REMOTE_AUTO_RESUME_MAX`, and then `job: paused stop`.
- **Task 6:** `Push the branch` prints `::error title=Push the branch::<line>` and a `$GITHUB_STEP_SUMMARY` line for each line carrying `refusing to push` or a given-up `push failed for`, and still exits 0.

**No measured result is invented.** Every measured fact below is quoted from `harness-runs/task_prompts/fix_remote_job_commit_refusal_task_prompt.md` → `## What was measured (2026-11-05, verbatim)`, and is cited there. The effect of the fixes on GitHub is **not yet measured**. A stamp field that source does not give, such as the Claude Code version or the probe run's runner image, is written as not recorded here, never filled in.

**How the catch-all implementer reads the conventions.** This is the `general` task. Read `.claude/context/conventions.md` → `## Documents of record`: *"A measured fact states what was measured, the command and the exact message"*. A deferral cites a numbered roadmap item: #261 is cited as the issue that tracks the no-Bash stop, not as this branch's deferral.

### Targets

- `docs/sandbox-verification.md` — §9 row `CS6 (runner)`, §10 row `FR3`.
- `docs/remote-execution.md` — `### API errors`, `### When GitHub fails or lags`, `## 6. What is not verified here`.
- `docs/watcher.md` — §1 step 7, the terminal-states table's `completed` and `paused` rows, and the `setup-worktree.sh` row of the scripts table.
- `ARCHITECTURE.md` — the `classify_run_exit` inventory row, and the **[shipped]** negative-result paragraph.

**Work:**

- [ ] **`docs/sandbox-verification.md` §9, row `CS6 (runner)`.** Its `Observed` cell becomes **fail**: Gate 12 round 13, 2026-11-05, the round's sandbox probe, run `41980588326`, CLI 0.6.8. The wrapper refused with the same sentence FR3 quotes. Cite the task prompt; the probe's own evidence lines are not recorded here. Then state the cause, in four steps:
  1. `actions/checkout` v7.0.1's `git sparse-checkout disable` wrote the three keys, each `false`, into `.git/config.worktree`;
  2. its `git config --local --unset-all extensions.worktreeConfig` turned the extension off and left the file;
  3. `Bootstrap the checkout`'s `setup-worktree.sh` turned the extension on again;
  4. `hr_worktree_config_check_var` then refused the file.

  Name the fix (`fix_remote_job_commit_refusal`: `setup-worktree.sh` removes exactly those three keys at `false`) and its local evidence (`cli/test/setup-worktree-checkout-sparse.test.mjs`). The `Verdict` cell becomes `fail (round 13); cause found and fixed, re-take owed to the next Gate 12 round`. The `Expected` and baseline cells are unchanged.
- [ ] **`docs/sandbox-verification.md` §10, row `FR3`.**
  - **`Observed`:** run `41980764647`, `harness run feat_money_split`, `ubuntu-26.04` `20261101.64.1`, `actions/checkout@3d3c42e5…` (v7.0.1). Quote the session's first commit refusal verbatim, with the runner's checkout path written `<checkout>` and stated to be the job's `$GITHUB_WORKSPACE`, because no document in this tree names a location on the machine that wrote it: `commit-on-branch.sh: refusing to commit: <checkout>/.git/config.worktree sets core.sparsecheckout, core.sparsecheckoutcone, index.sparse, and only core.hooksPath may be set there; remove the file, then re-run setup-worktree.sh in that working copy`. Then: `Push the branch` printed `push-branch.sh: refusing to push: …` with the same sentence and concluded `success`, and the same refusal hit every later job of the round. Add the same cause and fix as CS6 (runner), and add that a refused push now carries an `::error::` annotation and a job-summary line (Task 6).
  - **`Verdict`:** `fail (round 13); fixed on this branch, re-take owed to the next Gate 12 round`.
  - **`Read from`:** gains *"and the `Push the branch` step's `::error::` annotations"*.
- [ ] **`docs/remote-execution.md`.**
  - **In `### API errors`,** after the sentence naming the third failure shape, add one sentence: a session that exits 0 with an absent or unreadable ledger after a resume, a stall restart or an earlier park is recorded the same way, `paused` with `pause_reason` `unfinished`, and auto-resumed under the same cap, ending `job: paused stop`. A first launch's ledger-less exit keeps `completed`. Cite round 13's resumed job `41981613528`, whose session stopped after 8 turns, exited 0 with no ledger, and was logged `run 'feat_money_split' completed — branch ready for review` and `job: completed stop`. That 8-turn stop itself is issue #261.
  - **In `### When GitHub fails or lags`,** add one sentence: `Push the branch` keeps `push-branch.sh` non-fatal, and turns each refusal or given-up push into an `::error::` annotation and a job-summary line, so the run page shows it while the step still succeeds.
  - **In `## 6. What is not verified here`,** add one table row, in the table's four columns:
    - **behaviour:** `actions/checkout` v7.0.1 leaves `core.sparseCheckout`, `core.sparseCheckoutCone` and `index.sparse`, each `false`, in `.git/config.worktree`, and turns `extensions.worktreeConfig` off without removing the file;
    - **what rests on it:** `setup-worktree.sh`'s removal of exactly those three keys, which lets the wrappers' unchanged single-key rule accept the job's checkout;
    - **source:** measured in Gate 12 round 13, 2026-11-05, run `41980764647`'s `Check out the run's branch` log, with the two commands quoted. The fix's effect is not yet measured: the next Gate 12 round's FR3 and CS6 (runner), in `sandbox-verification.md` §10 and §9, take it;
    - **if it is wrong:** a checkout that writes another key or another value is still refused with the wrappers' own sentence, and `Push the branch` carries the `::error::` annotation that names it.

    Update the section's opening paragraph's count of rows the sandbox series round takes, so it stays true.
- [ ] **`docs/watcher.md`.**
  - **§1 step 7,** "**The session's exit is classified**": replace *"a ledger that is absent or unreadable … keeps `completed` and writes one `classify: '<branch>' has no readable ledger …` line"*. It keeps `completed`, with that line, only on a first launch. After a resume, a stall restart or an earlier park it is `paused` with `pause_reason` `unfinished`, with the `… — not classifying it completed` line.
  - **The terminal-states table, `completed` row:** replace *"— or its ledger is absent or unreadable (step 7) —"* with a clause that keeps `completed` for an absent or unreadable ledger only on a first launch. After a resume, a stall restart or an earlier park, that run is `paused` / `unfinished` (step 7).
  - **The terminal-states table, `paused` row:** after *"or its session exited 0 before its ledger finished (`pause_reason` `unfinished`, §4)"*, add the second way to reach `unfinished`: the session exited 0 with an absent or unreadable ledger after a resume, a stall restart or an earlier park (step 7). Leave the row's `cleared by` cell unchanged.
  - **The §4 paragraph headed "A zero exit over an unfinished ledger is a pause, not a completion." is not edited.** It is register row 26 (`no-change`).
  - **The `setup-worktree.sh` row of the scripts table:** add, inside its description cell, that the pre-push step first removes the three sparse keys `actions/checkout` leaves at `false` from each `config.worktree` it makes live, and never touches a clone's.
- [ ] **`ARCHITECTURE.md`.**
  - **The `classify_run_exit` inventory row:** *"an absent or unreadable ledger keeps `completed`"* becomes *"an absent or unreadable ledger keeps `completed` only on a first launch, and is `unfinished` after a resume, a stall restart or an earlier park"*.
  - **The **[shipped]** negative-result paragraph:** *"a session that writes none is still classified `completed` on its exit status, because an absent ledger keeps `completed`"* becomes the same first-launch-only statement.

  Keep both sites' **[shipped]** / **[designed]** tags as they are.

**Verification:**

- Re-run the story index's scope-register derivation entries 1–5 verbatim from the checkout root. Every hit is a register row. Entry 1's hits on `ARCHITECTURE.md` and on `docs/watcher.md`'s §1 step 7 and `completed` row now read *"only on a first launch"*, and its hit on the `paused` row names the ledger-less resume. The `plugin/commands/branch-status.md` hit is Task 9's, not this task's.
- `git grep -n "not yet measured" -- docs/sandbox-verification.md` no longer lists the `CS6 (runner)` or `FR3` row's `Observed` cell. `git grep -nE "re-take owed to the next Gate 12 round" -- docs/sandbox-verification.md` lists both rows.
- `git grep -nE "41980764647|41980588326|41981613528" -- docs ARCHITECTURE.md` shows each run id only beside the fact the task prompt attributes to it.
- `git grep -n "/home/runner" -- docs/sandbox-verification.md docs/remote-execution.md` prints no line this task added. Each quoted refusal carries `<checkout>` in place of the runner's path.
