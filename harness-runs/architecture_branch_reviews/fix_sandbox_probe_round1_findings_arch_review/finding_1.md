### 1. Give stopping a probe-owned process one home in `session.sh`

**Severity:** Should Fix.

**Sites.**
- `scripts/lib/sandbox-probe/session.sh` → `sp__td_stop_pids`, the body that runs `kill "$pid"`, then the `while kill -0 "$pid" 2>/dev/null && [ "$n" -lt "$SP__PID_POLLS" ]` poll at `sleep 0.1`. Its bound is `SP__PID_POLLS=50`.
- `scripts/lib/sandbox-probe/legs-network.sh` → `sp__net_listener_stop`, the body that runs `kill "$pid" 2>/dev/null || return 0`, then the `while kill -0 "$pid" 2>/dev/null && [ "$n" -lt "$SP__NET_LISTENER_POLLS" ]` poll at `sleep 0.1`. Its bound is `SP__NET_LISTENER_POLLS=50`.

**Problem.** This branch adds a process-stop step to the probe in two places. Task 3 added it to `session.sh` as part of teardown's API: `sp_track_pid` registers a process, and `sp__td_stop_pids` sends it TERM and then polls a bounded number of times for it to end. Task 6 added a second, private copy of the same loop to `legs-network.sh` for N3's loopback listener. The copy has its own poll bound (`SP__NET_LISTENER_POLLS`), its own still-running message and its own exit status. The two bounds are equal today, but nothing ties them together. A later change to one (say, a longer wait or a `kill -9` escalation) would leave the other behind, with no test to catch it. `cli/test/sandbox-probe-evidence.test.mjs` exercises only teardown's copy.

The listener does need to stop in the middle of the leg rather than at teardown: the probe's own request runs first, then the listener stops, then N3 is graded. That timing is a reason to call one shared helper mid-leg. It is not a reason for a second copy of the loop.

Rule violated: `.claude/context/conventions.md` → `### Where a new responsibility goes` → **"A responsibility that already has a home does not get a second one."**, and the paragraph after it, **"Before adding a copy of anything, grep for it."** Its example, `cli/src/core/repoPaths.ts`, shows the cost: private copies drifted until two bodies with the same name behaved differently. Shared code belongs on the shared floor, never in both consumers (`.claude/context/conventions.md` → `## Shared code, and where it lives`). For the probe, that floor is `session.sh`, whose header already lists `sp_track_pid` in THE SESSION API.

**Fix.**
1. In `scripts/lib/sandbox-probe/session.sh`, add one public helper beside `sp_track_pid`:
   - Signature: `sp_stop_pid <pid>`.
   - It sends TERM to `<pid>` and polls `kill -0` every 0.1 s, at most `SP__PID_POLLS` times.
   - It returns 0 when the process is gone, or was already gone before the TERM.
   - It returns 1 when the process is still alive after the last poll. It prints nothing; each caller reports in its own way.
   - Add it to THE SESSION API list in the file header.
2. Reduce `sp__td_stop_pids` to a loop that calls `sp_stop_pid "$pid"` for each tracked PID. When the call returns 1, raise the same `sp__td_fail "process $pid the probe started is still running after TERM; stop it with: kill -9 $pid"`, so teardown's exit-5 contract is unchanged.
3. In `scripts/lib/sandbox-probe/legs-network.sh`:
   - Make `sp__net_listener_stop` keep its first steps: read `SP__NET_LISTENER_PID`, clear it, and return 0 when it was empty.
   - Then have it call `sp_stop_pid "$pid"`. On status 1, keep its existing `sp_refuse "N3's loopback listener $pid is still running after TERM; teardown stops it"` and `return 1`.
   - Delete `SP__NET_LISTENER_POLLS` from the stop path. `sp__net_listener_start`'s start-up poll for the `Serving HTTP on …` line may keep its own bound under a name that says what it bounds, such as `SP__NET_LISTENER_START_POLLS`. Update the N3 paragraph in the file header to match.
4. `legs-network.sh` is sourced after `session.sh` (see the fixed source order in `scripts/sandbox-probe.sh`), so the helper is already defined when the leg runs. `cli/test/sandbox-probe-remote-legs.test.mjs` does not source `session.sh`, but none of its cases calls `sp__net_listener_stop`, so it needs no change.

After the change, the only `kill -0` poll loop under `scripts/lib/sandbox-probe/` is the one in `sp_stop_pid`. This edit changes no teardown behaviour and no result line, so it amends no row in `docs/sandbox-verification.md` and nothing in Gate 15.
