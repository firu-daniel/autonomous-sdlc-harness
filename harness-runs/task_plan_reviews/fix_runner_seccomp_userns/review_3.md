# Task plan review — iteration 3

`review_2.md`'s findings are resolved in the files:

- **Must Fix 1:** Task 3 now writes the `NESTED_USERNS_HELPER` stub by default. Its `helper: false` option and case (k2) cover the case where the helper is absent.
- **Should Fix 1:** Task 2 and Task 3 now list `NESTED_USERNS_HELPER` in both DECLARED MIRRORS entries and in Task 3's `**Depends on:**`.

I re-ran both derivation entries of the Scope register:

- Entry 1 reaches `ROADMAP.md` and `docs/{cli,config,development,remote-execution,sandbox-placeholder-upstream-report,sandbox-verification,watcher}.md`.
- Entry 2 reaches DP1–DP7, IS1–IS4, RF1–RF4 and FR2.

Every site either entry reaches is a row. I also grepped the non-Markdown tree for the retired literals (`systemctl reload apparmor`, `APPARMOR_RELOAD_COMMAND`, `has not yet run on GitHub`, *"AppArmor is not mirrored"*, *"does not read AppArmor"*). Every hit is a target of Task 2, 3, 5, 6 or 9.

The finding below is new. It concerns the `collect` claim the plan added in response to `review_1.md` Must Fix 2.

## Must Fix

1. **The plan says `collect` reports a failed install step's run as `not_started`. It does not: that arm only fires for a job GitHub never started.** Files: the story index (`fix_runner_seccomp_userns_story_plan.md`), `task_3_plan.md` and `task_8_plan.md`.
   **Where the plan makes the claim:**
   - **Story index**, `## Context`: *"its separate `collect` job, which reports the run as not started"*.
   - **`task_3_plan.md`**, `**Work:**` → **THE SANDBOX PREREQUISITES** bullet: *"Its `remote-run.sh collect` finds the run's job never started, reports it as `not_started` on the pull request or issue with one push notification, and collects no round, as after a failed `Preflight with doctor`"*.
   - **`task_3_plan.md`**, case (l)'s third bullet: *"For a run whose harness step never started, `remote-run.sh collect` … reaches the 'newest run's job never started' stop. When that run is this one, it calls `report`'s `not_started` … and sends one push notification. It collects no round and exits 0."*
   - **`task_8_plan.md`**, the restated facts → **The install step (Task 3)**: *"For a job that never launched, `collect` reports the run as not started on its pull request or issue, sends one push notification, and collects no round."*

   **What the tree does instead.** The plan conflates two different conditions:
   - **`collect`'s `not_started` stop** is gated on `BS_NOT_STARTED` (`cli/templates/scripts/remote-run.sh`, `collect` verb: `if [ "$BS_NOT_STARTED" = 1 ]; then … notify not_started …`).
   - **That flag** comes from `run_not_started_var`. Its header reads: *"whether GitHub never started the run's RUN_JOB_NAME job: 0 when that job's `conclusion` is `cancelled` or `failure` and its `steps` array is absent or empty"*. Its jq filter tests `(($j.steps // []) | … length …) == 0`, and otherwise answers `started`.
   - **A `run` job whose `Install the sandbox prerequisites` step failed** has run a dozen steps, so its `steps` array is not empty. So does a job whose `Preflight with doctor` failed. Either way the answer is `started`. `collect` never takes the `not_started` arm. It passes through its ordinary stops: no pull request, the settledness read, and `round_collect` finding no review.
   - **What actually reports such a run** is the `run` job's own `Continue, wait or stop` step. The `continue` verb's header reads *"no status.json — the harness step never started: one `failed` naming the run URL, no dispatch"*. `Open the pull request and report` runs `deliver`, which for *"no status.json, is one line and nothing sent"*.

   **What goes wrong if the plan is followed.** No test catches it, because case (l) asserts only the parsed `needs` and `if:`. But Task 3 would write the false claim into the shipped `harness-run.yml` header that every adopter receives. Task 8 would write it into `docs/remote-execution.md`. An adopter whose install step fails would then look for a `not_started` comment on the pull request or issue that never comes.

   **Fix:**
   - **In `task_3_plan.md`:**
     - Rewrite the THE SANDBOX PREREQUISITES bullet's `collect` sentence and case (l)'s third bullet to say what the tree does. After a failed install step, the job has started, so `run_not_started_var` answers `started`, and `collect` runs its ordinary stops exactly as after a failed `Preflight with doctor`. The run's one notification is `continue`'s no-`status.json` arm: one `failed` naming the run URL, and no dispatch. `deliver` sends nothing.
     - Keep case (l)'s structural assertions on `collect`'s `needs` and `if:`.
     - Cite `run_not_started_var` by name, not by line, so the implementer does not restate the `not_started` path.
   - **In `task_8_plan.md`**, replace the restated `collect` fact the same way.
   - **In the story index's `## Context`**, replace *"which reports the run as not started"* with the same correction.

## Should Fix

1. **Task 3's stub world does not say which `bwrap` stub wins when `present` lists `bwrap`.** File: `task_3_plan.md`, `**Work:**` → the stub-world bullet.
   - **Today's behaviour:** `world()` writes every name in `present` as `stub(binary, 'exit 0')`.
   - **Cases (e) and (i)** pass `present: SANDBOX_HOST_BINARIES.map(entry => entry.binary)`, which includes `bwrap`.
   - **Case (i)** also needs `nested: 'fail'` to make the step fail on the present path.
   - **The risk:** if the `present` loop's `exit 0` stub overwrites the new recording stub, or is written instead of it, (i) exits 0 and passes for the wrong reason, or fails.

   **Fix:** State in the stub-world bullet that a `bwrap` listed in `present` is written as the recording stub driven by `nested`, never as the plain `exit 0` stub. State also that `nested` defaults to `pass`.

## Nice to Have

1. **The probe runner skips `Record the readings after the install step` when the install step fails.** File: `task_6_plan.md` (and `task_1_plan.md`'s rule).
   - **The cause:** that step has no `if:`, so the copied step's new `exit 1` skips it.
   - **The cost:** the Gate 12 redo loses the after-install IS readings in exactly the case it would diagnose. The `::error::` line keeps only the `attr/current` reading and the stderr.

   **Fix:** Either say in Task 6 that this loss is accepted, or note it in Task 7's §9 block so the redo's reader expects IS1–IS4 to read `not run` on a failed step.
