### 41. sandbox refusal (b): a taken optOut launches the stub

**Site:** `cli/test/watcher-sandbox-refusal.test.mjs` → `test('(b) a taken sandbox.optOut exempts the drop: the stub is launched', …)` (near line 127); code under test `cli/templates/scripts/autonomous-watcher.sh` → the sandbox preflight ahead of `spawn_engine`.

**Failing test:** `cli/test/watcher-sandbox-refusal.test.mjs` — `(b) a taken sandbox.optOut exempts the drop: the stub is launched`

**Failure (log):**

```
        not ok 1342 - (b) a taken sandbox.optOut exempts the drop: the stub is launched
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against. This is a test of the watcher's own sandbox *preflight* against a stubbed probe, not a sandbox refusal of the gate run: the log carries no `Operation not permitted` or other refusal signature.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case regenerates the profile with `init --force` from a taken `sandbox.optOut`, feeds a probe reporting a missing piece, and asserts one prompt and no `not launching` line. The branch does not touch the preflight or the opt-out. Cases (a), (c) and (e) of the same file are not among the failures. The run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed; a scaled `TICK_TIMEOUT_MS` exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass or `init --force` killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — a `not launching` line or a missing launch caused by the branch's `spawn_engine` or `launch_run` changes: change `cli/templates/scripts/autonomous-watcher.sh` so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh`. Leave the test file unchanged.
