# Task plan review — iteration 3

Iteration 2's Must Fix is resolved. `run_gate`'s outer subshell now captures `s=$?` before the gate-done write and ends on `exit "$s"`. The file is an empty flag that nothing reads. `task_1_plan.md` and `task_2_plan.md` both tie the change to the existing non-zero-exit cases.

I re-ran D1 verbatim. It reaches 19 files, and every one is a row (rows 3–21). Rows 1–2 come from D2. D3 reaches no lesson; I re-walked it against the ledger. The register is closed.

Index structure, the 1:1 correspondence, single-layer tags, bottom-up order, the points and bullet budgets, and the test-run rule all hold. No task targets a conventions document.

## Must Fix

1. **Moving each gate into a background subshell changes the gate's signal handling. An interrupt then leaves the gate running while the label is reported free.** Files: `task_1_plan.md`, the third and fourth `**Work:**` bullets (*"The run form heartbeats from its own foreground loop…"* and *"A trapped termination drops the heartbeat at once"*), and `task_2_plan.md`, the `**Depends on:**` contract line *"`SIGTERM`, `SIGINT` or `SIGHUP` to the run form. It removes `.running` while the file holds its own PID, kills its own gate child, and writes no verdict."*

   Today each gate runs as a **foreground** subshell, so an interrupt sent to the run form's process group (a terminal Ctrl-C, or a tool that interrupts the group with `SIGINT`) stops the gate as well. The plan starts each gate inside `( … ) &` instead. In a non-interactive shell, bash starts every command of a background list with `SIGINT` and `SIGQUIT` ignored, and that disposition is inherited by the eval'd gate. I measured both points here, on this host's bash:
   - A `SIGINT` sent to an `eval 'sleep 31'` gate started in that shape left the gate running.
   - Adding `trap - INT` inside the subshell did not restore the signal: the gate still survived.
   - The plan's handler sends `TERM` to `gate_pid`, which is the **outer** subshell only. With exactly the plan's shape, `kill -TERM "$gate_pid"` killed that subshell, and the eval'd `sleep 30` was still running afterwards.

   Here is what follows. An interrupt to the group fires the new trap, which removes `.running` and exits. Every shell layer of the gate ignores the interrupt and keeps going, for example `bash scripts/test.sh` → `run-gates.sh` moving on to its next gate. The next `--wait` refuses `no run in flight`, and a re-issued run form starts a second gate run of the same label, truncating the log the orphan is still writing. That breaks the task prompt's constraint *"The wrapper still never runs a second gate run of a live label"*. The behaviour is new: under today's foreground subshell, the same interrupt stops the gate.

   `task_2_plan.md`'s contract (*"kills its own gate child"*) and its trapped-termination case cannot detect this. The case signals only the run form's PID, writes the release file afterwards, and never checks whether the stub is still alive.

   **Fix:**
   - In `task_1_plan.md`, change `run_gate` so that a signal stopping the run form also stops the gate command, and so that the gate is not left with `SIGINT` / `SIGQUIT` ignored. Then correct the handler bullet and the header bullets so they claim no more than the shape delivers.
   - Pick the design, and state its measured signal behaviour in the header. Two directions, with what I measured:
     - **Keep the gate in the foreground, as today.** Move the heartbeat into a background toucher whose life is tied to the run form's without a signal. The gate's copy of whatever ties them must be closed, so an orphaned gate cannot keep the heartbeat fresh. Note that bash 3.2's `read -t` returns 1 on both timeout and EOF, so it cannot drive that test.
     - **Keep the async gate, but give it its own process group.** Wrap only the `&` in `set -m` … `set +m`. Here that gave the subshell its own group, `wait` still reported the gate's own status (4), `SIGINT` was no longer ignored, and nothing was printed to stderr. The handler would then send `TERM` to `-"$gate_pid"`. The trade-off must be stated: a `SIGKILL` sent to the run form's group, such as `runBash`'s abort in Task 2's *Killed* case or a tool killing a backgrounded task's group, no longer reaches the gate.
   - In `task_2_plan.md`, rewrite the contract line to say exactly what the run form stops.
   - In `task_2_plan.md`, add to the trapped-termination case an assertion that the gate command itself has stopped before the release file is written. For example, the stub records its own `$$` (a one-for-one line edit inside the line 1–88 budget, or a second stub below line 88), and the test asserts that `process.kill(stubPid, 0)` throws `ESRCH` once the run form has exited.

## Should Fix

These items have been raised since iteration 0 or 1. None appears in the artifact or in a `## Rejected findings` entry.

1. **`RUN_TEST_SUITE_STALE`'s accepted range still contradicts the header** (`task_1_plan.md`, the constants bullet and the header bullet; `task_2_plan.md`, `**Depends on:**`).
   - The constants bullet accepts any value `>= 1`. The header must say the value *"must exceed `HEARTBEAT_SECONDS`"*.
   - mtimes are whole seconds, so a live run's age reads up to 2.
   - Accept only values `>= 3` and fall back to the default otherwise, or state why `1` and `2` are kept. Restate the range in `task_2_plan.md`.
2. **Task 2's "outlives the window" case is still tight enough to be flaky** (`task_2_plan.md`, fourth `**Work:**` bullet).
   - With `RUN_TEST_SUITE_STALE: '2'`, a stall of about 1 s in the run form's `touch` / `sleep` loop under a parallel `node --test` run makes a healthy run read dead.
   - Use a window of at least 3–5 s and hold the run for about twice that. Keep the *Killed* case consistent with the range from item 1.
3. **The crash bound is still misstated** (`task_1_plan.md` header bullet, *"so one `--wait` call ends `pending` for a crashed run"*, which says the opposite of what is meant; story index `## Context`, *"A crashed run is refused within one `--wait` call"*).
   - What holds: a crashed run is refused no later than about `STALE_SECONDS` after its last heartbeat, so a call issued after a crash refuses within its slice, and `--wait` never prints `pending` forever.
   - Restate it that way in both places, because the header sentence is written into the shipped script.
4. **Task 4's `WF` grep check still cannot pass as written** (`task_4_plan.md`, second `**Verification:**` bullet).
   - This same task writes WF ids outside the rows: the `**Stamp.**` line, the sentence under the table, F5's *"Owed: WF2–WF4. WF5 not run."* and §6's *"and WF5"*.
   - List each of those places as allowed.

## Nice to Have

1. `task_1_plan.md` `### Targets` still ends the run-form range at *"through the two gate blocks"*. The new `run_gate` definition and the `trap - TERM INT HUP` line before the verdict rename lie outside that range; name both.
2. `task_3_plan.md` says *"apart from the rendered `test.sh` and `typecheck.sh`"*. `cmp` shows that `scripts/start-dev-server.sh` and `scripts/deploy.sh` also differ from their templates. Say "apart from the rendered wrappers".
3. `heartbeat_age` takes `$(date +%s)` without saying what happens if `date` fails or prints nothing. Map that case to the same non-zero return as an unreadable mtime, as `hr_registry_set` already does (`now=$(date +%s 2>/dev/null) || now=0`).
