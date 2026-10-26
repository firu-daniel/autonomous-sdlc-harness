### 12. Stall host sleep (d): the missing last-pass file case fails

**Site:** `cli/test/watcher-stall-host-sleep.test.mjs` → `test('(d) a missing or non-integer last-pass file records no wake and never defers a kill'` (near line 291). Its session script is bounded by `const SESSION_TIMEOUT_MS = 180_000;`, and its polls by `const WAIT_MS = 30_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh`:
- `host_wake_pass() {`: its `case "$last" in '' | *[!0-9]*) last="" ;; esac`.
- `check_stalled_runs`: `case "$woke" in '' | *[!0-9]*) woke=0 ;; esac`.

**Failing test:** `cli/test/watcher-stall-host-sleep.test.mjs` — `(d) a missing or non-integer last-pass file records no wake and never defers a kill`

**The failure, quoted from the log:**

```
        not ok 1181 - (d) a missing or non-integer last-pass file records no wake and never defers a kill
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case launches a hung stub from a task drop, which cuts a clone. It runs passes with `.host_last_tick` absent, then holding `garbage`, and `.host_woke_at` holding `garbage`. It asserts that no `host-wake:` line is logged and that the kill still lands. No isolated result for this file is on record.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs`, the same drop, launch and stall pass fails for the first seven local cases, and then passes for the six that follow.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the same stall pass passed later in the run in `cli/test/watcher-stall-reset-payloads.test.mjs`.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **A `host-wake:` line from an absent or non-integer file, or a deferred kill:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `host_wake_pass`'s or `check_stalled_runs`'s integer screens. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror `scripts/autonomous-watcher.sh` needs the same edit until `cmp` exits 0.
  - **A bare timeout:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **(a) Named test and file run:** `(d) a missing or non-integer last-pass file records no wake and never defers a kill`, in `cli/test/watcher-stall-host-sleep.test.mjs`, run on `79aa5c3f`.
- **(b) Command and result:** `npm test --workspace cli -- test/watcher-stall-host-sleep.test.mjs`, from the repository root, in the foreground: `ok 3 - (d) a missing or non-integer last-pass file records no wake and never defers a kill` (`duration_ms: 12545.233583`); file totals `# tests 3`, `# pass 3`, `# fail 0`.
- **(c) No code file edited:** neither `cli/templates/scripts/autonomous-watcher.sh` nor its mirror `scripts/autonomous-watcher.sh`, nor any other code file, was changed; this record is the only write.
