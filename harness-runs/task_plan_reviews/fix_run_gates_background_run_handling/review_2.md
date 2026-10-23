# Task plan review — iteration 2

Round-1 Must Fix 1 (route the `SIGNALS` measurement through `scratch-run.sh` against a `$TMPDIR` fixture) and Must Fix 2 (version on Task 7's fork clause) are applied in the artifact. I re-ran the scope register's D1, D2, D3 and D5 entries verbatim and re-walked D4. Every site they reach is a row, so there is no closure finding. Round 1's Should Fix items were neither resolved nor recorded under `## Rejected findings`, so they are raised again below at their original severity.

## Must Fix

1. **`task_1_plan.md`: `scratch-run.sh` refuses a `.sh` file, so the `SIGNALS` route is certain to block Task 1**
   The `**Header — SIGNALS.**` Work bullet, steps 1–2, says to write the measurement script at `<repo_root>/harness-runs/scratch/<name>.sh` and run it with `bash scripts/scratch-run.sh harness-runs/scratch/<name>.sh`. `scratch-run.sh` picks the interpreter from the file's extension, and `sh` is not in its table:
   - `scripts/scratch-run.sh` (byte-identical to `cli/templates/scripts/scratch-run.sh`) → `SCRATCH_INTERPRETERS='py:python3 js:node mjs:node cjs:node rb:ruby dart:dart php:php'`.
   - The `.sh` case is refused with `scratch-run.sh: '<name>.sh' has no interpreter for extension 'sh'` and exit 66.
   - `cli/test/outer-loop-scripts.test.mjs` → `scratchFixture` confirms the refusal is on purpose: *"`.sh` is the extension the table drops on purpose, so it is refused by the same branch as `.pl` rather than run under `bash`."*

   The same bullet then says that a refusal of that call by `scratch-run.sh` means *"stop and return a blocker … never fall back to another route"*. Followed as written, the plan therefore stops at its first task every time. Task 2's signal assertions rest on this measurement, so they fail with it. (Round 1's suggested fix named a `.sh` file. That suggestion was wrong, and this finding corrects it.)
   **Fix:** In `task_1_plan.md`, `**Header — SIGNALS.**`:
   - Write the measurement driver in an extension the table carries, for example `harness-runs/scratch/<name>.mjs` run by `node`.
   - Have the driver do everything step 3 describes through `child_process` with fixed argument vectors (`spawnSync('git', ['init', …])`, `spawn('bash', [<fixture copy of run-test-suite.sh>, <label>], { cwd: <fixture> })`, `process.kill(<pid>, 'SIGTERM')` and so on). The run is still one sandboxed Bash call: `bash scripts/scratch-run.sh harness-runs/scratch/<name>.mjs`.
   - For the INT-to-the-calling-shell's-group case, have the driver spawn a `bash` child as the calling shell (`detached: true`, so it leads its own group), let that child issue the run form, then signal `-<child pgid>`.
   - Update step 2's command, the *"never write the script outside `harness-runs/scratch/`"* sentence and the blocker sentence to the new filename. The blocker sentence should also name exit 66 (no interpreter), so an implementer can tell a wrong extension apart from a genuine refusal.

## Should Fix

1. **`task_2_plan.md`: the start-up refusal Task 1 adds is still not covered** (raised in rounds 0 and 1). Task 1 adds the exit-2 refusal *"the detached run of <label> did not start"*, but no case in Task 2 asserts it. Either add a case where the worker never claims `.running` and assert the bytes on disk (`.claude/context/cli.md` → *"A refusal is asserted on the bytes on disk"*), or name the case under the header's `Not covered here` with the reason.

2. **`task_1_plan.md`: a worker that claims `.running` after the start-up window has closed** (raised in rounds 0 and 1). The run form would already have returned the refusal, which G.1 escalates, while a live run sits behind it. State what happens next, for example that a re-issued run form collects the run through one-run-per-label, and record it among the header's residuals.

3. **`task_4_plan.md`: no separator before the appended clause** (raised in round 1). In `plugin/instructions/plan_orchestration_instructions_core.md`, the D.2 *"Run gates (Phase G): passed on round N"* bullet ends *"… never a remembered number"* with no period. Appending *"Then report …"* straight after it runs two sentences together. Specify `. ` before *"Then report"*. Task 8's byte-identity span starts at *"Then report"*, so it is unaffected.

4. **`task_4_plan.md` / `task_8_plan.md`: "re-launched" conflicts with G.1's own re-entry case.** Task 4's step 2 keeps the case where *"this session … re-entered the phase while it runs"* and re-issues the run form, which one-run-per-label then answers harmlessly. The Done-summary clause counts exactly that as **re-launched** (*"this session issuing the run form for a label it had already issued it for"*). Task 4's new bullet also forbids *"a second run form for a label whose `--wait` says `pending`"*. Do one of two things: drop *"this session or"* from step 2, so only an earlier session's run is collected that way, or narrow the clause's **re-launched** definition so that a run form answered `pending` by an already-live run is not counted.

5. **`task_2_plan.md`: a 3-second start-up window under a loaded sandboxed suite.** The watchdog-kill case sets `RUN_TEST_SUITE_STALE` to `3`. Task 1 bounds the run form's start-up poll by `STALE_SECONDS`, so in that case the worker has 3 s to claim `.running`. Phase G runs this suite sandboxed alongside the whole tree, where a slower start-up would make the case flake with the new refusal. Either pass the shortened stale value only to the later `--wait` calls, or state why 3 s is safe.

6. **`task_1_plan.md`: fixture cleanup on every exit path.** Step 4 removes the `$TMPDIR` fixture *"before exiting"*. `harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike"*. Remove it in an exit handler (`try`/`finally` in the driver), and release or kill the held stub gate first, so a failed case does not leave a `sleep` orphan behind.
