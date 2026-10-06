### 1. `sync` throws away the engine it recovered for a run GitHub never started, so a local resume can dispatch the wrong engine

**File:** `cli/templates/scripts/remote-run.sh` (`verb_sync`) — "# Case 4 — a newer run with no bundle, while some bundle exists."

Task 7 made `remote_state` recover a never-started run's engine from its dispatch's comment. It sets `RS_ENGINE`, and it turns case 5 into `paused` / `killed` when an engine is found. `verb_sync` then records cases 4 and 5 through this block:

```bash
  if [ "$RS_STATE" = paused ]; then
    set_many_or_fail status paused pause_reason killed remote_run_id "$id" remote_run_url "$url" \
      remote_detail "$RS_DETAIL" remote_synced_at "$now"
```

That block writes no `engine`, so the recovered engine never reaches the registry record. `/autonomous-sdlc-harness:branch-resume` (`plugin/commands/branch-resume.md` → step 2, **The route.**, and step 6) takes the GitHub route "with its synced `status`, `pause_reason` and `engine`". `<engine>` there is "the record's `engine` field or `fetch`'s `engine:`", and the record field comes first.

The record's `engine` is written only by a case-3 `sync` (read from a bundle) and by a local `review`. A round placed from GitHub (`control`'s or `collect`'s `review`) never touches the local record. Take round 8's own finding 3. Round 4 was placed by a control job, and its `user_review` run never started. On a machine whose record last synced the completed task run, `sync` records `paused` / `killed` with the stale `engine: task`. `branch-resume` then dispatches `--engine task --resume pause`, which runs the wrong flow on the branch while the review round never runs. When the record carries no engine, `branch-resume` reports the GitHub route and stops, even though an engine was recovered. This is the story index's second top risk ("a wrong engine on a recovered resume").

**Fix:** in `verb_sync`'s case-4 block, write the recovered engine when the run never started and the engine is valid:

```bash
  # Case 4 — a newer run with no bundle, while some bundle exists; also a run
  # GitHub never started whose engine its dispatch's comment records.
  if [ "$RS_STATE" = paused ]; then
    if [ "$RS_NOT_STARTED" = 1 ] && valid_engine "$RS_ENGINE"; then
      set_many_or_fail status paused pause_reason killed remote_run_id "$id" remote_run_url "$url" \
        remote_detail "$RS_DETAIL" remote_synced_at "$now" engine "$RS_ENGINE"
    else
      set_many_or_fail status paused pause_reason killed remote_run_id "$id" remote_run_url "$url" \
        remote_detail "$RS_DETAIL" remote_synced_at "$now"
    fi
    echo "remote-run.sh: run $id of $branch left no bundle; the record is paused (killed), nothing restored"
    return 0
  fi
```

- [x] Amend the header paragraph `` `sync` READS THE NEWEST `harness run <branch>` RUN ``, case 4. After "`paused` / `killed`, `remote_run_id` / `remote_run_url` re-pointed at THIS run, nothing restored", add: "and, for a run GitHub never started whose dispatch's comment records its engine, `engine` set to that engine".
- [x] Add a case to `cli/test/remote-run.test.mjs`. Set it up with:
  - a local remote record whose `engine` is `task`;
  - a newest completed `harness run feat_x` run whose `run` job ended `cancelled` with an empty `steps`;
  - an older run carrying a bundle;
  - a `github-actions[bot]` comment on the branch's pull request whose last line is the `round` marker, posted after the newest run's `createdAt`. Stub it as the never-started cases in `cli/test/remote-control.test.mjs` stub theirs.

  Run `sync`, then assert that the record reads `status: paused`, `pause_reason: killed` and `engine: user_review`. Run `npm test --workspace cli -- test/remote-run.test.mjs` from the repository root. That is the only test this fix runs.
