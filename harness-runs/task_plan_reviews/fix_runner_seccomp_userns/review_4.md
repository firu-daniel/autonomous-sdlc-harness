# Task plan review — iteration 4

`review_3.md` Must Fix 1 is resolved. The story index's `## Context`, `task_3_plan.md` (the THE SANDBOX PREREQUISITES bullet and case (l)) and `task_8_plan.md` (the restated install-step facts) now say what the tree does:
- `run_not_started_var` answers `started` for a job whose install step failed.
- `collect` passes through its ordinary stops.
- The run's one notification is `continue`'s no-`status.json` arm.
- `deliver` sends nothing.

I re-ran both derivation entries of the `## Scope register` verbatim:
- Entry 1 reaches `ROADMAP.md` and `docs/{cli,config,development,remote-execution,sandbox-placeholder-upstream-report,sandbox-verification,watcher}.md`.
- Entry 2 reaches RF1–RF4, DP1–DP7, IS1–IS4 and FR2.

Every site either entry reaches is a row, so closure holds.

I also confirmed that every symbol the plan cites resolves in the tree: `readHostFile`, `resolvesOnPath`, `locateOnPath`, `probeSandboxHost`, `probeKeepAwakeHost`, `remoteExecutionApplies`, `KEEP_AWAKE_LOCK_PROBE_ENV` in `fixture.mjs`, `hr_sandbox_opted_out`, `hr_sandbox_prereq_judge_var`, `hr_sandbox_prereq_probe_var` and `run_not_started_var`. `scripts/lib/harness-run-lib.sh` and `scripts/autonomous-watcher.sh` are byte-identical to their templates today, as Task 9 states.

## Must Fix

1. **`review_3.md` Should Fix 1 was neither applied nor recorded under `## Rejected findings`.** Files: `task_3_plan.md` (the stub-world bullet) and the story index (`fix_runner_seccomp_userns_story_plan.md`) if you reject it.
   **The ledger entry this repeats** (`harness-runs/lessons.md` → `## Unattended control loops`): *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."* _(taught by: fix_linux_detached_gate_run)_
   **Where it stands:**
   - The story index has no `## Rejected findings` section.
   - `task_3_plan.md`'s stub-world bullet still does not say what happens when `present` lists `bwrap`.
   **Why it still matters.** In the tree, `cli/test/workflow-sandbox-install.test.mjs` → `world()` runs `for (const binary of present) stub(binary, 'exit 0');` after its recorders. Case (e) passes `present: SANDBOX_HOST_BINARIES.map((entry) => entry.binary)`, which includes `bwrap`, and case (i) describes the same "both binaries" world. If that loop overwrites the new recording `bwrap` stub, three things go wrong:
   - **(i)** (`nested: 'fail'`) exits 0.
   - **(e)** records no verification call.
   - Any case that grades on `bwrap.calls` being absent or empty passes whether or not `bwrap` was called.
   **Fix:** Pick one of these.
   - **(a)** In `task_3_plan.md`'s stub-world bullet, state three things:
     - A `bwrap` listed in `present` is written as the recording stub driven by `nested`, never as the plain `exit 0` stub. Either the `present` loop skips `bwrap` and the recording stub is written after it, or the loop writes the recording stub for that name.
     - `nested` defaults to `'pass'`.
     - Case (i) passes `nested: 'fail'` with `bwrap` in `present`.
   - **(b)** Add a trailing `## Rejected findings` section to the story index that records `review_3.md` Should Fix 1 with its reason.

## Should Fix

None.

## Nice to Have

1. **`review_3.md` Nice to Have 1 (the probe runner skips `Record the readings after the install step` when the copied install step fails) is still unaddressed.** Files: `task_6_plan.md` or `task_7_plan.md`. A sentence in Task 7's §9 block would tell the Gate 12 redo's reader to expect IS1–IS4 to read `not run` on a failed step. Alternatively, Task 6 could state that this loss is accepted.
