`fix_run_gates_background_run_handling` makes Phase G's gate run survive however long the suite takes, and collect its verdict reliably. Today G.1 relies on the Bash tool moving an over-running foreground call to the background, and the tool stops a moved command 10 minutes later. This repository's suite needs about 37–40 minutes sandboxed. The branch also corrects the flow's account of what happens when a headless turn ends while a background task is still running.

It starts from a `dev` that carries `sandbox2b fix_run_gates_wait_form_sandbox`, the file-based liveness signal this branch builds on.

## What earlier branches decided, and what was measured

Before changing anything, read the rationale already recorded:
- `cli/templates/scripts/run-test-suite.sh` → `THE WAIT FORM, AND WHY IT EXISTS` and `ONE RUN PER LABEL`;
- `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`;
- `plugin/instructions/autonomous_pause_and_ledger.md` → §2.5, the paragraph opening *"A backoff is not a resumption mechanism, and neither is a `Monitor`."*;
- `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6;
- `harness-runs/story_plans/feat_run_gates_phase_story_plan.md` and `fix_background_test_wait_story_plan.md`.

**Evidence, from two sources:**
- **The run.** `feat_unattended_sandbox_preflight`, 2026-10-22: Claude Code 2.1.308, macOS, headless, sandboxed, through the watcher. Source: its `harness-runs/autonomous_logs/feat_unattended_sandbox_preflight.stream.jsonl` and `watcher.log`.
- **The probes.** Taken 2026-10-23 on Claude Code **2.1.309**: four headless sessions on the watcher's launch line, under this checkout's live profile, watched from outside the sandbox. Raw results: `<home>/Work/harness-sandbox-tests/sbx2-results-20261023-083639/` (`timeline.log`, a stream per session), produced by `sbx2-probes.sh` beside it.

| Decision, and where it comes from | What the evidence shows |
|---|---|
| **The gate verdict comes from the wrapper's verdict file, never from the suite's output** (`feat_run_gates_phase`, #34; `fix_background_test_wait`, #71). | **Holds.** Keep it. |
| **A foreground `--wait` call bounded by `WAIT_SLICE_SECONDS`, re-issued on `pending`, with no wall-clock constant to get right** (#34). | **The design holds.** Under the sandbox it failed only because of its `kill -0` liveness check, which `sandbox2b` replaced. Keep it. |
| **"If the tool layer moves the run to the background … the expected case": the moved run keeps going and `--wait` collects it** (G.1). | **Disproved.** The move message itself says *"If it is still running after 10m in the background, it will be stopped and you will be notified."* Probe B1: moved at 120 s, stopped 600 s later, `task_notification` `status: "stopped"`, *"stopped after reaching its background time limit"*. The run's round 1 matches: `timeout` 600000, moved at 10 minutes, stopped at 20. |
| *(the session's improvisation)* **An explicit `run_in_background` launch with a large `timeout`.** | **It works only because of a wall-clock constant.** With no `timeout` it is stopped at 600 s (probe C1). With `timeout` 300000 it is stopped at 300 s (C2). With 7200000 it ran its full 30 minutes (C3). The stop notification adds: *"If it already had the longest `timeout` allowed, do not restart it"*, so a maximum exists, and its value was not measured. This form ties survival to a number being large enough, which #34 set out to avoid. |
| *(not decided anywhere)* **The wrapper detaching the gate run itself.** | **Survives with no limit.** Probe A2: started with `nohup … </dev/null >/dev/null 2>&1 &` plus `disown` inside one sandboxed call. It outlived that call and the session's own exit, and ran its full 1524 s to completion. No tool-level limit applies, because the Bash tool never tracked it. Like any other process, it cannot be signalled from a later sandboxed call (`kill -0`: `Operation not permitted`), so its liveness comes from `sandbox2b`'s file-based signal. |
| **One run per label: a re-entered phase collects the live run's verdict instead of starting a second** (`ONE RUN PER LABEL`). | Its `kill -0` failure under the sandbox is fixed by `sandbox2b`. Keep the rule. |
| **No `Monitor` and no `sleep` in the agent's own command** (G.1; `unit_loop_core.md` point 6). | Not contradicted. Keep it. |
| **"A headless `claude -p` session is torn down when its turn ends"**, so ending the turn with a run in flight gives an `rc=0` exit classified `completed` behind a success notification (§2.5 since the initial commit, 2026-09-09, with no measurement cited; G.1 cites it). | **True only when nothing is pending:**<ul><li>**Nothing pending** (probe A): the process exits `rc=0` right after the turn ends.</li><li>**A background Bash task pending** (probe E): the process stays alive. When the task completes the session is woken, runs a second turn (`E-woken`, a second `result` event), then exits `rc=0`.</li><li>**A `Monitor` pending** (probe F): the same. It is woken when the Monitor's stream ends.</li></ul>The run's round 4 matches the background-task case. |
| **A unit's own run stays in the foreground. If it is moved, the unit does not collect it and records the run as not done** (#71, `unit_loop_core.md` point 6). | Not affected: it never waits. Leave it. |
| *(side effect)* The stall watchdog while a session waits idle. | In the run it warned at 1203 s and 1212 s (`kill and resume at 2700s`) while the session sat silent behind a pending gate run. It did not kill. Whether `STALL_BUSY_CPU_PCT` would spare a longer wait is unmeasured. |

## The goal

1. **Make the run form detach the gates itself and return `pending` at once.** Every round is then collected through the wait form, and the Bash tool's backgrounding never matters.
   - Keep the wire exactly: `pass` / `fail <log>` / `pending`, the exit map, `.running` / `.verdict`, the log path, and one run per label.
   - The detached process carries `sandbox2b`'s liveness signal. Do not add a second signal.
   - Redirect the detached process's stdin, stdout and stderr away from the calling shell, as probe A2 did, so the Bash call returns.
   - **Check what the stall watchdog does to it.** The watchdog's kill-and-resume kills the run's process tree. A detached gate run is reparented away from that tree, so it may outlive the session that started it. In that case the resumed session's G.1 must collect its verdict through one-run-per-label rather than start a second run. Test that path.
   - Extend `cli/test/run-test-suite.test.mjs` to cover detaching, the immediate `pending`, and collection by a later `--wait`.
2. **Rewrite G.1**, and the same paragraph in every flow that runs Phase G by reference (`code_review_instructions.md`, `code_review_fixes_instructions.md`, `user_review_fixes_instructions.md`, and the user-review fix core):
   - drop "If the tool layer moves the run to the background … the expected case";
   - the run form is one plain foreground call that returns `pending`, then `--wait` until a verdict;
   - a gate run in flight is never stopped or re-launched, whatever the session believes about a time limit;
   - name no wall-clock figure. The 10-minute and timeout figures above are recorded measurements of one CLI version, not inputs to the flow.
3. **Correct the teardown passages in §2.5 and G.1** to the measured three cases.
   - Keep the rule against ending the turn with a run in flight. Its reasons are now:
     - a silent wait gives the stall watchdog no output, and a wait longer than `STALL_KILL_SECS` (2700 s) is exposed to a kill-and-resume;
     - the STOP and PAUSE checks on each `--wait` re-issue stop working;
     - a detached run is not a tool task, so nothing would wake the session when it finishes. With nothing pending, the turn's end is the process's end (probe A).
   - Keep the `rc=0` → `completed` account for the nothing-pending case, citing probe A.
   - Measure `STALL_BUSY_CPU_PCT`'s effect, or record it as not measured.
4. **Make the Done summary and the improvement observations report** a gate run that was stopped, re-launched or lost to a time limit.
5. **Record the probe results** in `docs/sandbox-verification.md`, with the version, as rows the corrected passages cite. Re-run `sbx2-probes.sh` only if the installed CLI version has changed by then, and record both versions if the results differ.

## Constraints

- Do not undo a decision the table marks as holding.
- Do not use "end the turn and wait for the completion notification" as the mechanism, even though probes E and F show the session is woken. That depends on the waited-for thing being a tool task or a Monitor, and a detached run is neither. Record the wake-up as observed CLI behaviour only.
- Do not base the design on an explicit background `timeout`, at any value.
- Leave `unit_loop_core.md` point 6 alone, except to update its citation of the teardown claim if that wording changes.
- Every claim about CLI behaviour carries the version it was measured on. The Linux sandbox was not measured, so record it as not taken rather than inferring it from macOS.
