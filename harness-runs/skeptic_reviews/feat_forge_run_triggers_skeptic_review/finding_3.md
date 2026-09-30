### 3. A run adopted while its job is still running keeps the placeholder engine `task` forever, so relays resume a `user_review` or `docs` run as a task run

> **Self-contained per-finding file** for the `feat_forge_run_triggers` skeptic-review index (`harness-runs/skeptic_reviews/feat_forge_run_triggers_skeptic_review.md`). The implementer reads only this file. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**Files:**

- `cli/templates/scripts/remote-run.sh` (`adopt_one`): "hr_remote_record_init \"$registry\" \"$b\" \"$worktree\" \"$log_path\" task" and "# Every trigger-started run is `task`; a run another machine dropped may not be."
- `cli/templates/scripts/remote-run.sh` (`verb_sync`, case 3): "set_many_or_fail status \"$status\" pause_reason \"$reason\" usage_resume_at \"$resume_at\""
- `cli/templates/scripts/remote-run.sh`, the header paragraph "`sync` READS THE NEWEST `harness run <branch>` RUN", item 3.

**Problem.** `adopt` exists for runs no local watcher dispatched: "a trigger's, or another machine's" (the header's `adopt` paragraph). It writes the record with the placeholder engine `task`. It then corrects the engine **only** when its own `sync` downloaded a bundle, that is, when `remote_run_id` is set and `remote_download/<b>/<run_id>/status.json` exists.

When the newest `harness run <b>` run is still `queued` or `in_progress` at adoption, `sync` takes its first branch ("the record is running, nothing downloaded"). `adopt_one`'s engine block then does nothing. `cli/test/remote-adopt.test.mjs` shows this state: `feat_x`'s newest run is `in_progress`, and the test asserts `record.engine === 'task'`.

Nothing corrects the engine afterwards. `verb_sync`'s case 3 downloads the bundle and writes `status`, `pause_reason`, `usage_resume_at`, `park_loop_cycles` and the `remote_*` fields, but not `engine`. Adopted records are never adopted again, because `adopt` skips recorded branches. The watcher's relays read the engine from the record: `remote_relay_call "$log_path" dispatch "$branch" --engine "$(registry_get "$branch" engine)"`, both for the answer relay and for the resume relay.

**How it is reached.** Another machine drops a `docs` or `user_review` run with remote execution. Or a remote-only maintainer dispatches one from the form. This machine then runs any of `/autonomous-sdlc-harness:branch-answer`, `-pause`, `-resume` or `-user-review`, for any branch, while that job runs. Each of them adopts every candidate before it acts. When the run later parks or pauses, the answer or resume relayed from this machine dispatches `engine=task` on that branch. The task engine then re-enters a docs or review branch.

The adopt code states the intent to handle exactly this case ("a run another machine dropped may not be"), and the intent holds only when the job had already finished at adoption.

**Fix.** Have case 3 of `sync` write the engine the downloaded bundle names. A bundle's `engine` is the engine of the job that produced it. Case 3 already overwrites `status` from that same bundle, so this adds no new race.

- [ ] In `cli/templates/scripts/remote-run.sh` → `verb_sync`, add `engine_value` to the second `local` line (`local status reason detail resume_at cycles` becomes `local status reason detail resume_at cycles engine_value`).
- [ ] In case 3, directly after the line `cycles=$(hr_remote_status_get "$status_file" park_loop_cycles) || cycles=""`, replace the single `set_many_or_fail status "$status" pause_reason "$reason" usage_resume_at "$resume_at" \` … `remote_detail "$detail" remote_synced_at "$now"` call with:

  ```bash
      engine_value=$(hr_remote_status_get "$status_file" engine) || engine_value=""
      if valid_engine "$engine_value"; then
        set_many_or_fail status "$status" pause_reason "$reason" usage_resume_at "$resume_at" \
          park_loop_cycles "$cycles" remote_run_id "$id" remote_run_url "$url" \
          remote_detail "$detail" remote_synced_at "$now" engine "$engine_value"
      else
        set_many_or_fail status "$status" pause_reason "$reason" usage_resume_at "$resume_at" \
          park_loop_cycles "$cycles" remote_run_id "$id" remote_run_url "$url" \
          remote_detail "$detail" remote_synced_at "$now"
      fi
  ```

  `valid_engine` is defined later in the file. It is resolved at call time, so it is already available when `verb_sync` runs. Leave `adopt_one` unchanged.
- [ ] In the header paragraph "`sync` READS THE NEWEST `harness run <branch>` RUN", item 3, change "`status`, `pause_reason`, `usage_resume_at`, `park_loop_cycles`, `remote_run_id`, `remote_run_url`, `remote_detail` and `remote_synced_at` written." to "`status`, `pause_reason`, `usage_resume_at`, `park_loop_cycles`, `remote_run_id`, `remote_run_url`, `remote_detail` and `remote_synced_at` written, and `engine` when the bundle names `task`, `user_review` or `docs` — which is what corrects the placeholder `task` of a record `adopt` wrote while that run's job was still running." Keep the `#` comment prefix and the item's indentation.
- [ ] In `cli/test/remote-run.test.mjs`, give the `bundle()` helper an `engine = 'task'` option beside `status`, `questions` and `detail`. Write `engine` into its `status.json` in place of the literal `'task'`. Then add this case after `sync applies a parked bundle, and a second sync of the same run downloads nothing`:

  ```js
  test('sync takes the engine the downloaded bundle names', async (t) => {
    const fx = await remoteFixture(t);
    remoteRecord(fx, { engine: 'task' });
    const env = syncEnv({ runs: [ghRun(101, 'completed', 1)], artifacts: { 101: ['harness-state'] }, bundles: { 101: bundle(fx, 'e', { engine: 'docs' }) } });
    const result = await remoteRun(fx, ['sync', 'feat_x'], env);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(record(fx).engine, 'docs');
  });
  ```

- [ ] Run only that edited file, from `cli/`: `npm test -- test/remote-run.test.mjs`.
