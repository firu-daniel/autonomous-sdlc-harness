### 45. Stall reset: the honest hung run resume fails

**Site:** `cli/test/watcher-stall-reset-payloads.test.mjs` → `test('an honest hung run resumes: the edit discarded, the branch unmoved, the note written'` (near line 419). It runs `f.localStall(…)`, whose script defines `hr_sandbox_prereq_probe_var` and `hr_keep_awake_probe_var` (`DEFAULT_KEEP_AWAKE_PROBE`). The script then runs `tick`, waits for the hung session, back-dates both liveness files, and runs `tick` again. The run is bounded by `const RUN_TIMEOUT_MS = 180_000;`, and the hung session's wait by `const HUNG_WAIT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh`:
- `tick() {`, now running `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass`.
- `spawn_engine`'s new launch head.
- `check_stalled_runs`, with its new wake discount.

**Failing test:** `cli/test/watcher-stall-reset-payloads.test.mjs` — `an honest hung run resumes: the edit discarded, the branch unmoved, the note written`

**The failure, quoted from the log:**

```
        not ok 1182 - an honest hung run resumes: the edit discarded, the branch unmoved, the note written
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

This is the file's first local case. Cases in this file run in series. The first seven local cases fail (this one, then S1, S2, S3, S5, S6 and S7). The next six pass through the identical `localStall` drop, launch, back-dated pass and `check_stalled_runs` kill: S8, S9, S4, S4c, S10 and the S4 legacy case. A defect in that shared path fails every case that crosses it. Here the failures stop part-way through the file. The suite ran for `# duration_ms 2757435.082709`.

The wake discount cannot defer this kill. With no `.host_last_tick` from an earlier pass, `host_wake_pass` records no wake, and `woke` stays `0`.

The likely cause is a transient condition on the gate host during the first part of this file's run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the same `localStall` pass passed for the six local cases after the seventh in this file.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **The kill, the reset, the resume or the note:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (`check_stalled_runs`, `host_wake_pass` or the launch head) or in `cli/templates/scripts/lib/harness-run-lib.sh`. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **`the session did not hang within 60000 ms`, or a bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`feat_run_analytics`). Findings 1–13 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `32a6e551`.
