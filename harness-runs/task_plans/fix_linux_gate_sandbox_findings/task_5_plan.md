### Task 5 — PD29: give the `gate-sandbox` leg a clone of its own, check it against the clone allow-list, and name the writer in the header

**Goal:** In the clone layout, the `gate-sandbox` leg (GS1–GS4, WF5) runs on an extra probe clone that no earlier leg has touched, rather than on the shared probe clone. Before its session it checks that target against the clone allow-list, so a probe defect prints as one and never reaches the launcher. Job mode is unchanged.

**The finding (docs/sandbox-verification.md §5 PD29).** On 2026-11-03 the launcher refused the leg's call: `launch-sandboxed-gates.sh: <clone>/.git/config sets branch.dev.remote, branch.dev.merge, which the clone allow-list does not hold, so this clone's configuration is not trusted`. T3's launcher call on the same clone, earlier in the run, was accepted. The refusal is correct and does not change.

**The writer, traced.** `scripts/lib/sandbox-probe/legs-refresh.sh` → `sp__rf_r4`, the `wrappers-refresh` leg's R4, runs before `gate-sandbox` in the leg table. When the shared probe clone has no local `<defaultBranch>`, it runs `git -C "$SP_CLONE" -c core.hooksPath=/dev/null branch "$SP_DEFAULT_BRANCH" "refs/remotes/origin/$SP_DEFAULT_BRANCH"`. With a remote-tracking start point and git's default `branch.autoSetupMerge` (`true`), that records `branch.<defaultBranch>.remote` and `branch.<defaultBranch>.merge` in `<clone>/.git/config`. Neither key is in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_clone_config_spec`. Task 9 pins that git behaviour. **R4 is not changed:** changing what it leaves in the shared clone could move a macOS verdict, and goal 4 forbids that.

**The choice, stated in the header: an extra clone, not a reorder.** Moving the leg before every leg that changes the clone would tie its correctness to the leg order and to what every future leg leaves behind. An extra clone is what `planted-files` (`${SP_BRANCH}_files`) and `wrappers-refresh` (R3's fixture clones) already do.

**The interface Task 9 tests.**

- A new function `sp__gs_target` sets `SP__GS_TARGET` and `SP__GS_PROFILE`. In job mode (`SP_JOB_MODE=1`) these are `SP_CLONE` (the checkout, as `job.sh` sets it) and `SP_RUN_PROFILE`, and the function creates nothing. In the clone layout it calls `sp_extra_clone "${SP_BRANCH}_gs" --no-bootstrap`, capturing the refusal as `legs-planted-files.sh` does, and copies `SP_EXTRA_CLONE` / `SP_EXTRA_PROFILE` at once. It returns status 1 with `SP__GS_WHY` set when the clone cannot be made. `--no-bootstrap` is sufficient: the launcher runs `run-test-suite.sh --no-detach`, whose rewritten `commands` are `<none>` and `bash <target>/sbx_gs_test.sh`, and nothing needs a build.
- A new function `sp__gs_target_check <main> <target>`. In job mode it returns 0 without a check: the launcher's main-checkout arm reads no clone allow-list. In the clone layout it runs `hr_clone_config_check_var "$main" "$target"` and returns 0 when that passes. Otherwise it returns 1 with `SP__GS_WHY` set to `the gate-sandbox target's .git/config is outside the clone allow-list before the launch: <HR_CLONE_CONFIG_REFUSAL>`.
- `sp_leg_gate_sandbox` calls `sp__gs_target`, then `sp__gs_target_check "$SP_MAIN" "$SP__GS_TARGET"`, as its first steps. On either failure it prints every row `not run` through `sp__gs_all "$SP__GS_WHY"` and launches nothing.

### Targets

- `scripts/lib/sandbox-probe/legs-gate-sandbox.sh`

**Work:**

- [ ] Add `sp__gs_target` and `sp__gs_target_check` as the interface states, and list both under the header's `THE FUNCTIONS` block with their signatures.
- [ ] In `sp_leg_gate_sandbox` and `sp__gs_body`, replace every use of `SP_CLONE` as the leg's target with `SP__GS_TARGET`, and the session's `SP_RUN_PROFILE` with `SP__GS_PROFILE`. That covers the outside-paths call, `scripts_rel`, `state_rel`, the branch, lane, run library, records directory and test script, the saved and restored `harness.config.json` and `.git/config`, the two `.git/config` shasums, the launch command (`bash $SP_SCRIPTS/launch-sandboxed-gates.sh $SP__GS_TARGET $SP_GS_LABEL`), the session's `--cwd`, and the test script's target argument. The main checkout passed to `sp__gs2_outside_paths` stays `SP_MAIN`, so GS2's outside paths keep their meaning: home, the target's parent and the main checkout in the clone layout.
- [ ] Rewrite the header paragraph that opens `# The target is SP_CLONE in both layouts`. In the clone layout the target is the leg's own extra clone `${SP_BRANCH}_gs`, cut with `--no-bootstrap`, and in job mode it is the checkout itself, as before. Then name the writer this leg is protected from (R4's `git branch`, `branch.autoSetupMerge`, the two keys), state that the leg checks its target against the clone allow-list before launching, and say why an extra clone was chosen over a reorder. Cite `docs/sandbox-verification.md` §5 PD29.
- [ ] Keep every grading function, `SP_GS_LABEL`, `SP_GS_HOLD_SECONDS` and the restore contract unchanged. Teardown of the extra clone and its branch is `sp_extra_clone`'s registration, so add no removal of your own.

**Verification:**

- `git grep -n 'SP_CLONE' -- scripts/lib/sandbox-probe/legs-gate-sandbox.sh`: every hit is inside `sp__gs_target`'s job-mode arm or in a header sentence about job mode.
- `git grep -n 'SP_RUN_PROFILE' -- scripts/lib/sandbox-probe/legs-gate-sandbox.sh`: every hit is inside `sp__gs_target`.
- `scripts/lib/sandbox-probe/core.sh` is not in this task's diff: `sp_leg_declare gate-sandbox` and `sp_job_declare gate-sandbox` are unchanged, so `docs/development.md`'s leg tables that restate them stay true.
