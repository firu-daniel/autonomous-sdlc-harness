# Review plan meta-review — iteration 0

## Must Fix
1. **Finding 1's fix cuts a clone and renders a per-run profile in job mode, breaking the branch's stated "no clone, no per-run profile" invariant, and amends only two of the places that state it** — refers to review finding #1. File to change: `harness-runs/code_reviews/feat_sandbox_probe_job_mode_code_review/finding_1.md`.
   The defect the finding diagnoses is real. I checked it against the code: the job arm of `sp_leg_wrappers` in `scripts/lib/sandbox-probe/legs-wrappers.sh` calls `sp__wr_compound` / `sp__wr_prefix` with no `sp_ctl_clone`. `sp_ctl_add` then records the commit and push controls with no call, and `sp_row_result` in `controls.sh` turns every `pass` into `not run`. The prescribed fix is the problem.
   - **It reverses a planned invariant without saying so.** `sp_ctl_clone` calls `sp_extra_clone "${SP_BRANCH}_ctl" --no-bootstrap` (`session.sh` → `sp_extra_clone`). That creates a run copy through `sp__create`, registers it in the run registry and runs `sp__render`, which writes a per-run profile under the machine lane. The `push` control then publishes `<branch>_ctl` to the checkout's origin, which on the runner is the adopted repository's real remote. The story index lists **"No clone, no per-run profile."** as the first of job mode's four differences from the clone layout. The finding prescribes the opposite and never acknowledges that it departs from the plan.
   - **It leaves the invariant stated as fact in places it does not amend.** Step 3 rewrites the comment in `session.sh` and step 4 the header in `scripts/sandbox-probe.sh`. These still say the opposite after the fix:
     - `scripts/lib/sandbox-probe/job.sh` header: "cutting no clone and rendering no per-run profile"
     - `scripts/sandbox-probe.sh` `--help`: "--job <checkout> … cutting no clone"
     - `scripts/sandbox-probe.sh`: the skip text "not a job-mode leg: job mode cuts no clone"
     - `scripts/lib/sandbox-probe/core.sh`: the header line "job mode cuts no clone" and the comment above its row check
     - `scripts/lib/sandbox-probe/legs-job.sh` header: "and job mode cuts no clone"
     - Gate 15 in `docs/development.md`: "no clone is cut and no per-run profile is rendered"
   - **Step 5's footprint is incomplete.** It names the control clone "with its branch". It leaves out the rendered per-run profile, the run-registry record and the `<branch>_ctl` branch on origin.
   As written, the fix loop would land code that contradicts its own module headers, `--help` and the document of record.
   **Fix:** In `finding_1.md`, do one of these:
   - (a) Re-scope the fix to give the job arm's commit and push controls a target that cuts no clone and renders no profile. Name that target, and quote the `controls.sh` mechanism it uses.
   - (b) Keep `sp_ctl_clone`, and state explicitly that it departs from the story index's "No clone, no per-run profile" difference, and why. Then add a numbered step for each site listed above with its exact replacement text. Also extend step 5's footprint sentence, and the step 4 header line, to name the control clone's run-registry record, its rendered per-run profile and the `<branch>_ctl` branch on origin, each removed at teardown.
   The index needs no change unless the title changes under (a). If it does, update the `### 1.` pointer heading and readiness entry 4's short title to match.
