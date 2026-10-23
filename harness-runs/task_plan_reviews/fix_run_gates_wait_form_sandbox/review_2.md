# Task plan review — iteration 2

Iteration 1's Must Fix is resolved. The heartbeat loop now ends on a gate-done file and sends no signal, the story index `## Context` claim is corrected, and WF2 and WF4 now hold the run past `STALE_SECONDS`. I re-ran D1 verbatim. It reaches 19 files, and every one is a row (rows 3–21). Rows 1–2 come from D2, and D3 reaches no lesson. The register is closed.

## Must Fix

1. **`run_gate` returns the wrong exit status: every failing gate would read as a pass.** File: `task_1_plan.md`, third `**Work:**` bullet (*"The run form heartbeats from its own foreground loop, and that loop sends no signal"*).
   The bullet prescribes this outer subshell:
   `( ( set +u +o pipefail; eval "$1" ) < /dev/null >> "$log_file" 2>&1; printf '%s\n' "$?" > "$gate_done_file" ) &`
   It then says to `wait "$gate_pid"` and *"return the status `wait` reported. `wait` is the authoritative status."* But the outer subshell's exit status is the status of its last command, the `printf`. That is 0 whatever the gate returned. So `wait "$gate_pid"` reports 0 for a failing gate. `typecheck_status` and `test_status` then become 0, and the wrapper prints `pass` for a failing suite. That breaks the wire Task 1 must keep (`fail <log>`, exit 1).
   I reproduced it in a scratch shell with that exact shape and an `eval "exit 3"` gate. The result was `wait=0 file=3`.
   Task 2's existing case *"a non-zero command prints exactly `fail <log path>` and exits 1"* would catch this. But Task 2 says a failure there is fixed *"in Task 1's file under Task 1's contract"*, and that contract is what is wrong.
   There is also a second hazard if the writer reads the status from the file instead. `until [ -e "$gate_done_file" ]` becomes true as soon as the redirection creates the file, which can be before `printf` has written to it.
   **Fix:** In `task_1_plan.md`, have the outer subshell capture the gate's status and exit with it, so `wait` really is authoritative. For example: `( ( set +u +o pipefail; eval "$1" ) < /dev/null >> "$log_file" 2>&1; s=$?; : > "$gate_done_file"; exit "$s" ) &`. The file then serves only as the "gate ended" flag, and its content is never read. Keep the sentence that `wait` is authoritative, but say *why* it holds (the outer subshell `exit`s with the gate's status). Also add a `**Verification:**` bullet to `task_1_plan.md` or `task_2_plan.md` that ties this edit to the existing non-zero-exit cases: they must still print `fail …` and exit 1 under the new `run_gate`.

## Should Fix

1. **`RUN_TEST_SUITE_STALE`'s accepted range still contradicts the header** (`task_1_plan.md` constants bullet and header bullet; `task_2_plan.md` `**Depends on:**`). This was raised in iterations 0 and 1, and it appears neither in the artifact nor in a `## Rejected findings` entry. The constants bullet accepts `>= 1`. The header must say the value *"must exceed `HEARTBEAT_SECONDS`"*. mtimes are whole seconds, so a live run's age reads up to 2. Accept only values `>= 3` and fall back to the default otherwise. Restate that range in `task_2_plan.md`.
2. **Task 2's "outlives the window" case is still tight enough to be flaky** (`task_2_plan.md`, fourth `**Work:**` bullet; carried from iteration 1). `RUN_TEST_SUITE_STALE: '2'` judges a healthy run dead on one scheduling hiccup, because its age can already read 2. Use a window of at least 3–5 s, hold the run for about twice that, and keep the *Killed* case consistent with the range from Should Fix 1.
3. **The "one `--wait` call" bound is still overstated** (story index `## Context`, *"A crashed run is refused within one `--wait` call"*; `task_1_plan.md` header bullet, *"so one `--wait` call ends `pending` for a crashed run"*, which is also garbled; carried from iteration 1). A crash late in a call's slice can still end that call `pending`. What holds is weaker: a crashed run is refused no later than about `STALE_SECONDS` after its last heartbeat, so `--wait` never prints `pending` forever. Restate it that way in both places.
4. **Task 4's `WF` grep check still cannot pass as written** (`task_4_plan.md`, second `**Verification:**` bullet; carried from iterations 0 and 1). This task itself writes WF ids into places that are not rows: the `**Stamp.**` line, the sentence under the table, F5's *"Owed: WF2–WF4. WF5 not run."* and §6's *"and WF5"*. List each of those places as allowed.

## Nice to Have

1. `task_3_plan.md`: *"Every other `cli/templates/scripts/*.sh` and `lib/*.sh` copy already matches, apart from the rendered `test.sh` and `typecheck.sh`"* leaves out `scripts/start-dev-server.sh`, which also differs from its template (a rendered wrapper too). Name it, or say "apart from the rendered wrappers".
2. `task_1_plan.md` `### Targets` still ends the run-form range at *"through the two gate blocks"*. The new `run_gate` function and the `trap - TERM INT HUP` line before the verdict rename lie outside that range. Name both (carried from iterations 0 and 1).
3. `heartbeat_age` takes `$(date +%s)` without saying what happens if `date` fails or prints nothing. Map that case to the same non-zero return as an unreadable mtime, so the refusal path covers it.
