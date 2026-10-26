### 10. Stall host sleep (a)(b): the long-sleep case fails

**Site:** `cli/test/watcher-stall-host-sleep.test.mjs` → `test('(a)(b) a long host sleep is not silence at the first pass after wake` (near line 230). Its session script is bounded by `const SESSION_TIMEOUT_MS = 180_000;`, and its polls by `const WAIT_MS = 30_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh`:
- `host_wake_pass() {` (near line 3632).
- `check_stalled_runs`'s discount: `[ "$woke" -gt "$since" ] && since="$woke"` and the `measuring silence from the wake` line.

**Failing test:** `cli/test/watcher-stall-host-sleep.test.mjs` — `(a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills`

**The failure, quoted from the log:**

```
        not ok 1179 - (a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The suite is the branch's own (Task 6). Its pass script launches a hung stub from a task drop, and that launch cuts a clone (`harness-runs/task_plans/fix_headless_run_host_sleep/task_6_plan.md` → **Deviations from plan:**). The case then back-dates the liveness files and `.host_last_tick` 4000 s and asserts:
- on the first pass, one `host-wake:` line, one `measuring silence from the wake` line, and no `is hung` line;
- on the next pass, with `.host_woke_at` moved 120 s back, the kill.

No isolated result for this file is on record.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs`, the same drop, launch and back-dated stall pass fails for the first seven local cases. It then passes for S8, S9, S4, S4c, S10 and the S4 legacy case, all of which run the same `check_stalled_runs` this case exercises.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the same stall pass passed later in the run in `cli/test/watcher-stall-reset-payloads.test.mjs`.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **A `host-wake:` or `measuring silence from the wake` line, a premature kill, or a missing kill on the second pass:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `host_wake_pass` or `check_stalled_runs`'s `since` / `staleness` arithmetic. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror `scripts/autonomous-watcher.sh` needs the same edit until `cmp` exits 0.
  - **A bare timeout:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **(a) Named test and file run:** `(a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills`, in `cli/test/watcher-stall-host-sleep.test.mjs`, run against `fb680bd9`.
- **(b) Command and result:** `npm test --workspace cli -- test/watcher-stall-host-sleep.test.mjs` from the repository root, in the foreground. The named test reported `ok 1 - (a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills` (`duration_ms: 16761.069917`). The whole file reported `# tests 3`, `# pass 3`, `# fail 0`.
- **(c) No code file was edited.** This record is the only write.
