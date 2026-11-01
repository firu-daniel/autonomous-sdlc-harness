### 1. In job mode the `wrappers` leg never cuts its control clone, so P1c, CW5, P1b and CW6 can never print `pass`

**File:** `scripts/lib/sandbox-probe/legs-wrappers.sh` (`sp_leg_wrappers`), at "sp__wr_compound\n    sp__wr_prefix\n    return 0" inside the `if [ "$SP_JOB_MODE" = 1 ]; then` arm.

**Problem.** `sp__wr_compound` and `sp__wr_prefix` each end their prompt with a wrapper commit control and a wrapper push control (`sp_ctl_add "$pfile" commit wr_compound` / `sp_ctl_add "$pfile" push`, and the same pair tagged `wr_prefix`). Those controls act on the control clone `SP_CTL_CLONE`.

When `SP_CTL_CLONE` is empty, `controls.sh` → `sp_ctl_add` records them with an empty command ("Without a control clone the entry is recorded with no call, and sp_ctl_held reports it as not held"). Then:
- `sp__ctl_judge` reports `commit control: control clone not cut`.
- `sp_ctl_held` sets `SP_CTL_OK=0`.
- `sp_row_result` turns every refusal-shaped `pass` into `not run`, with the evidence `control did not succeed: …`.

Only a `fail` gets through, because `--direct` lets a `fail` pass without a control.

`sp_ctl_clone` is the only call that cuts the control clone. In the clone layout the leg calls it from `sp__wr_own` (`sp_ctl_clone` / `sp_ctl_prepare wr_own`), which runs before `sp__wr_compound`. The job arm this branch adds skips `sp__wr_cs4` and `sp__wr_own` and calls `sp__wr_compound` and `sp__wr_prefix` directly. No other leg cuts the clone earlier in job mode: the `sp_ctl_clone` in `legs-planted-files.sh` comes after that file's own job-mode return.

So on the runner and in a local `run --job`, the four job rows of `wrappers` (`--list --job`: P1c, CW5, P1b, CW6) can only read `not run` or `fail`. `docs/sandbox-verification.md` → `## 9. The GitHub-hosted runner legs` expects a `pass` for each of them. No test drives `sp_leg_wrappers` in job mode, so nothing catches this.

**This fix departs from the story index's first job-mode difference, "No clone, no per-run profile."** (`harness-runs/story_plans/feat_sandbox_probe_job_mode_story_plan.md` → `## Context`). The departure is deliberate.

- **What still holds.** The parts of that difference that define the measurement are unchanged. `SP_CLONE` and `SP_MAIN` are both the checkout, and every measured session's `--settings` is the base profile `SP_RUN_PROFILE`, checked with no copy.
- **What no longer holds.** Its letter does. `sp_ctl_clone` calls `sp_extra_clone "${SP_BRANCH}_ctl" --no-bootstrap` (`session.sh` → `sp_extra_clone`), which does four things:
  - cuts a clone through `sp__create`;
  - registers it in the run registry;
  - runs `sp__render`, which writes a per-run profile under the machine lane;
  - lets the `push` control publish `<branch>_ctl` to the checkout's origin. On the runner, that origin is the adopted repository's real remote, the same remote the probe branch is already published to.
- **Why no clone-free target exists.**
  - `controls.sh`'s header forbids aiming a wrapper control at the measured repository: "a control moving the measured repository's refs would move what the refusal row is judged by". In job mode the measured repository is the checkout.
  - `sp_ctl_add`'s `commit` and `push` kinds have no target other than `SP_CTL_CLONE`.
  - A `ran` or `written` control would only prove that the session runs a call. It would not prove that the main checkout's commit and push wrappers land, and that is what a refusal-shaped `pass` on P1c, CW5, P1b and CW6 has to rule out.
- **Why the control clone is not measured.** It is control apparatus. It is never planted, and its per-run profile is never a session's `--settings` (`controls.sh` header). Teardown's clone loop removes all of it (`session.sh` → `sp_teardown`, steps 1 to 5).

The sites that state "cuts no clone" as a fact are rewritten below to "measures no clone", so the code, `--help` and the document of record agree with what job mode now does.

**Fix.** Cut the control clone in the job arm, as the clone layout does before its compound and prefix sessions, then amend every site that states the old invariant. Each step gives the exact replacement.

1. In `scripts/lib/sandbox-probe/legs-wrappers.sh` → `sp_leg_wrappers`, inside the job-mode arm, after the `sp__ctl_literal` check, add `sp_ctl_clone` on its own line before `sp__wr_compound`:

   ```bash
   if [ "$SP_JOB_MODE" = 1 ]; then
     sp_job_skip_clone_rows wrappers
     if ! sp__ctl_literal "scripts directory" "$SP_SCRIPTS" || ! sp__ctl_literal "checkout" "$SP_CLONE"; then
       sp__wr_notrun "the scripts directory or the checkout path is not spellable as a literal" P1c CW5 P1b CW6
       return 0
     fi
     # The commit and push controls act on the control clone, as in the clone layout's sp__wr_own.
     sp_ctl_clone
     sp__wr_compound
     sp__wr_prefix
     return 0
   fi
   ```

   Leave out the status check. As in `sp__wr_own`, a control clone that could not be cut is reported through the controls' own `not run` evidence (`SP_CTL_REFUSAL`).
2. In the same file, in the `# JOB MODE (SP_JOB_MODE=1).` header paragraph, add this sentence after "their sessions are never launched.": `The commit and push controls act on the control clone <branch>_ctl, which sp_ctl_clone cuts beside the checkout with its run-registry record and per-run profile, and teardown removes with its branch locally and on origin, as in the clone layout; it is never measured.`
3. In `scripts/lib/sandbox-probe/session.sh` → `sp_teardown`, replace the comment "# Job mode registered no clone, so the clone loop then removes nothing and the tracked-branch pass\n  # deletes the probe branch, no longer checked out." with `# In job mode the only registered clone is the wrappers leg's control clone, which the clone loop removes; the tracked-branch pass deletes the probe branch, no longer checked out.`
4. In `scripts/sandbox-probe.sh`, replace the two header lines "# Job mode cuts no clone; it changes the probe branch in the checkout and on its origin, the checkout's\n# HEAD and the job-mode placeholder manifest under RUNNER_TEMP, each restored or removed at teardown." with these four:

   ```bash
   # Job mode measures no clone; it changes the probe branch in the checkout and on its origin, the checkout's
   # HEAD, the job-mode placeholder manifest under RUNNER_TEMP, and the wrappers leg's control clone with its
   # run-registry record, its per-run profile and its <branch>_ctl branch in the checkout and on origin, each
   # restored or removed at teardown.
   ```
5. In `scripts/sandbox-probe.sh` → the `--help` text, replace "  --job <checkout>       job mode: measure <checkout> itself under its base profile, cutting no clone;" with `  --job <checkout>       job mode: measure <checkout> itself under its base profile, not a clone;`. Keep the continuation line as it is.
6. In `scripts/sandbox-probe.sh` → the run loop, replace `sp_leg_mode_skip "$sp_leg" "not a job-mode leg: job mode cuts no clone"` with `sp_leg_mode_skip "$sp_leg" "not a job-mode leg: job mode measures no clone"`. `cli/test/sandbox-probe-job-mode.test.mjs` matches only the prefix `not a job-mode leg`, so it needs no change.
7. In `scripts/lib/sandbox-probe/job.sh`, replace the header lines "# base profile, as a `harness-run.yml` job's session does, cutting no clone and rendering no per-run\n# profile. session.sh calls in through hooks only; nothing here forks its code." with:

   ```bash
   # base profile, as a `harness-run.yml` job's session does, measuring no clone and launching no session on a
   # per-run profile; the one clone cut is the wrappers leg's control clone (controls.sh), never measured.
   # session.sh calls in through hooks only; nothing here forks its code.
   ```
8. In `scripts/lib/sandbox-probe/core.sh`, make three replacements:
   - In the header, replace "wrappers' clone arm CS4, P3 and CW2) do not carry over: job mode cuts no clone." with `wrappers' clone arm CS4, P3 and CW2) do not carry over: job mode measures no clone.`
   - In `sp_result_line`, replace the comment above the job-row check, "# Job mode cuts no clone, so a clone-layout row it measured would be a result it never took.", with `# Job mode measures no clone, so a clone-layout row it measured would be a result it never took.`
   - In `sp_job_skip_clone_rows`, replace the evidence string `"clone layout only: job mode cuts no clone and measures the checkout itself"` with `"clone layout only: job mode measures no clone, only the checkout itself"`.
9. Make the same string replacement in the two tests that assert the old evidence:
   - `cli/test/sandbox-probe-job-legs.test.mjs` → `const CLONE_ONLY = 'clone layout only: job mode cuts no clone and measures the checkout itself';` becomes `const CLONE_ONLY = 'clone layout only: job mode measures no clone, only the checkout itself';`
   - `cli/test/sandbox-probe-git-and-legs.test.mjs` → the case `sp_job_skip_clone_rows prints the clone-only rows in job mode, and nothing outside it`: replace `'clone layout only: job mode cuts no clone and measures the checkout itself'` with `'clone layout only: job mode measures no clone, only the checkout itself'`.
10. In `scripts/lib/sandbox-probe/legs-job.sh`, replace the header text "checkout and run copy, and job mode cuts no clone." with `checkout and run copy, and job mode measures no clone.`
11. In `docs/development.md` → **Gate 15**, make two replacements:
    - In the **Job mode** sentence, replace ": no clone is cut and no per-run profile is rendered." with `: no clone is measured and no session runs on a per-run profile; the one clone cut is the \`wrappers\` leg's control clone, named in the footprint below.`
    - In the sentence beginning "**Its footprint** is the probe branch in the checkout and on its origin, published with no upstream;", insert `the \`wrappers\` leg's control clone, cut beside the checkout as on the clone layout, with its run-registry record, its rendered per-run profile and its branch \`<probe branch>_ctl\` in the checkout and on its origin;` after "published with no upstream;".
12. In `cli/test/sandbox-probe-job-legs.test.mjs` → `test('the carried-over legs in job mode', …)`, add the case `sp_leg_wrappers in job mode cuts the control clone before its first session`:
    - **Setup.** Use the file's `sourced` helper with `{ SP_JOB_MODE: '1', SP_SCRIPTS: dir, SP_CLONE: dir }`, where `dir` is the case directory.
    - **Body.** Redefine `sp_job_skip_clone_rows() { :; }`, `sp_ctl_clone() { echo ctl; }`, `sp__wr_compound() { echo compound; }` and `sp__wr_prefix() { echo prefix; }`, then run `sp_leg_wrappers`.
    - **Assertions.** Status 0, empty stderr, and stdout `ctl\ncompound\nprefix\n`.

    The fix edits this file and `cli/test/sandbox-probe-git-and-legs.test.mjs`, so those are the test files the fix runs.

**Deviations from plan:**
- `cli` layer pass (steps 9 and 12 only; steps 1–8, 10 and 11 are the `general` layer's). After it, before the `general` layer's edits: `npm test --workspace cli -- test/sandbox-probe-job-legs.test.mjs` → `# pass 27`, `# fail 3`. The failures are the new case `sp_leg_wrappers in job mode cuts the control clone before its first session` (stdout `compound\nprefix\n`, no `ctl`, so the case catches the defect) and `sp_job_skip_clone_rows prints exactly the clone-only rows, as not run, in job mode` (`core.sh` still prints the old evidence). `npm test --workspace cli -- test/sandbox-probe-git-and-legs.test.mjs` → `# pass 49`, `# fail 2`: the case `sp_job_skip_clone_rows prints the clone-only rows in job mode, and nothing outside it`, on the same `core.sh` string. Both files should pass once steps 1 and 8 land, and need a rerun after the `general` layer.
- `general` layer pass (steps 1–8, 10 and 11, applied as written). Rerun after it: `npm test --workspace cli -- test/sandbox-probe-job-legs.test.mjs` → `# pass 30`, `# fail 0`; `npm test --workspace cli -- test/sandbox-probe-git-and-legs.test.mjs` → `# pass 51`, `# fail 0`; tree guard `test/main-anchor-isolation.test.mjs` → `# pass 2`, `# fail 0`; `bash scripts/typecheck.sh` → `PASS: typecheck` (its shell-parse check covers the edited `.sh` files). A standalone `bash -n` over the edited scripts was refused by the permission layer and not run; the shell-parse result in `bash scripts/typecheck.sh` is the evidence instead. After the edits, `grep -rn "cuts no clone\|cutting no clone\|no clone is cut"` over the checkout, excluding `harness-runs`, `node_modules` and `.git`, returned no match.
