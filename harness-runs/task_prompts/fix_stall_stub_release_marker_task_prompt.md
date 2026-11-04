`fix_stall_stub_release_marker` stops the stall-watchdog tests from waiting out the hung stub's `sleep 60` inside the sandbox. Each stub stays hung until the test releases it, right after the watchdog's last check.

## What was measured (2026-11-03/04)

- In one sandboxed Run gates pass (#240 → `## Measured`), `watcher-stall-reset-payloads.test.mjs` took **1298 s** for 19 cases run one after another. It was the last file to finish, so it sets a floor of about 22 minutes on every sandboxed round.
- Three of its cases (`an honest hung run resumes…`, `(S1)…`, `(S2)…`), run alone and sandboxed (a headless session on the watcher's launch line, starting the run through `scratch-run.sh`):

  | Stub body | Per case | 3 cases |
  |---|---|---|
  | `dev` as is (`sleep 60`) | 68.5 s | 206.5 s |
  | `sleep 60 </dev/null >/dev/null 2>&1` | 68.5 s | 206.2 s |
  | `sleep 15` (an experiment only, see Constraints) | 23.8 s | 71.6 s |

  So each case is about 8.5 s of work plus the whole of the stub's sleep. All runs passed.
- Inside the sandbox, `pgrep -P <own pid>` with a live child exits 3: `sysmon request failed with error: sysmond service not found` / `pgrep: Cannot get process list`.

## Why the sleep is waited out

1. The registry's `pid` is the launch subshell `( … ) &` in `autonomous-watcher.sh` (the block ending `registry_set "$branch" pid "$!"`). The stub (`HARNESS_AGENT_CLI`) runs below it, in `{ … exec "$AGENT_CLI" -p … } | tee … | "$formatter"`.
2. The watchdog's kill (`stall-watchdog: '$b' is hung … — killing its process tree`) runs `kill -9 "$pid"`, then `kill -9` on `collect_descendants "$pid"`, which is built on `pgrep -P`. Inside the sandbox that list is empty.
3. So only the subshell dies. The stub runs its `HUNG_BODY` to the end, `sleep 60` included, and `tee` and the formatter keep the test's pipes open until it exits. The test's `wait` and `runBash` return only then.

Outside the sandbox `pgrep` works, the stub is killed, and the sleep's length does not matter. Real runs are not affected: the watcher runs outside the sandbox.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `cli/test/watcher-stall-reset-payloads.test.mjs`: the header, `HUNG_BODY`, `HUNG_WAIT_MS`, `RUN_TIMEOUT_MS`, `stalled()`, `localStall` (its script: `tick`, the wait for `silent`, the back-date, `tick`, `wait`) and `jobStall`.
- `cli/test/watcher-placeholder-host.test.mjs`: the same `HUNG_BODY` with `sleep 60`, in every case that sets it.
- `cli/test/watcher-remote-job.test.mjs` (`setStub('sleep 30')`) and `cli/test/watcher-remote-park-sequence.test.mjs` (`job2Stub: 'sleep 30'`): check whether they wait out their sleep the same way.
- `cli/test/helpers/watcher.mjs`: the recording stub (`agent-stub.sh` sourcing `agent-stub-body.sh`) and `tick`.
- `scripts/autonomous-watcher.sh`: `collect_descendants`, the stall watchdog's kill, and the session launch block.

## The goal

1. A hung stub no longer ends on a timer. It stays hung, still writing nothing, until the test creates a release file. The test creates it once the watchdog has done what the case checks: in `localStall`, right after the second `tick`, before `wait`. `jobStall` and every other case using a hung stub need their own trigger, and the plan names it per case.
2. Outside the sandbox nothing changes: the watchdog kills the stub before the release, and the release finds nothing to free.
3. The same change in `watcher-placeholder-host.test.mjs`, and in the `sleep 30` stubs of `watcher-remote-job` and `watcher-remote-park-sequence` if they wait out their sleep the same way. The plan states what it found for each.
4. Measured afterwards, sandboxed, the way the table above was taken, with the per-case times recorded in the PR: the three cases above, then each changed file as a whole.

## Constraints

- **Do not lower the sleep.** 60 s was reached by raising it step by step, because the cases failed when several headless sessions ran the gates at once: under load, a shorter sleep can end before the watchdog's second check, and the run then reads as finished, not hung. The release file removes that race, because the stub stays hung for as long as the check takes.
- The stub still has an upper bound, so a missing release cannot hang a case forever. When the bound is hit, the case fails with a message naming the missing release, never a silent pass. The bound sits below the case's own timeout (`RUN_TIMEOUT_MS`), scaled by `scaleBound` like the existing ones.
- Every case keeps asserting what it asserts today.
- Not this branch: the sandboxed tests never check that the watchdog's kill takes down the session's whole process tree, because inside the sandbox it never does.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
