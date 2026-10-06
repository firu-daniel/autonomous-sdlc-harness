### 3. The poller waits on a completed run whose artifact lookup fails, with no bound

**File:** `cli/templates/scripts/remote-run.sh` (`poll_branch`) — "counted as waiting\"; return 0 ;;" in the second `bundle_listed "$id"` case, the one after the `notified` check

Task 9 added a `bundle_listed` lookup ahead of the download for a `completed` run. Its failure arm is:

```bash
    2) echo "remote-run.sh: poll: reading the artifacts of run $id ($branch) failed ($GH_ERR); counted as waiting"; return 0 ;;
```

This arm returns "waiting" on every tick and counts nothing. A run whose artifact list keeps failing to read therefore keeps the poller enabled for good. Each tick is billed at least a minute on a private repository, nothing is ever notified, and the poller never disables itself. Before this branch a completed run had no lookup here: any failure to fetch its bundle was "skipped", so this unbounded wait is new. The header says so too: "A failed artifact lookup on a `completed` run is one line and waiting."

That breaks the lessons-ledger rule in `harness-runs/lessons.md` → *Unattended control loops*: "Every automatic retry in an unattended path is bounded by a count or a deadline. When the bound is reached, send exactly one notification naming the error and the manual way on, then stop retrying." The same function already has the bound and the notification for a failed **download**, `download_failures` against `HARNESS_POLL_MAX_DISPATCH_FAILURES`, ending in one `bundle_unreadable` push. A failed lookup is a failure to read that same bundle and belongs under the same count.

**Fix:** route a failed lookup into the download-failure count.
- [ ] Add `listed` to `poll_branch`'s `local` line.
- [ ] Replace the second `bundle_listed "$id"` / `case $? in … esac` block, and the `if ! poll_fetch "$id"; then` line under it, with:

```bash
  bundle_listed "$id"
  listed=$?
  if [ "$listed" -eq 1 ]; then
    if run_not_started_var "$id"; then
      echo "remote-run.sh: poll: run $id of $branch never started ($NOT_STARTED_REASON); its collect job reports it; not waiting"
    else
      echo "remote-run.sh: poll: $branch skipped"
    fi
    return 1
  fi
  [ "$listed" -ne 2 ] || echo "remote-run.sh: poll: reading the artifacts of run $id ($branch) failed ($GH_ERR)"
  downloads=""
  [ "$(poll_state_get "$branch" run_id)" != "$id" ] || downloads=$(poll_state_get "$branch" download_failures)
  if [ "$listed" -eq 2 ] || ! poll_fetch "$id"; then
```

  The body of that `if` (the counting, the bound and the `bundle_unreadable` push) is unchanged.
- [ ] In the header paragraph `` `poll`: `HARNESS_REMOTE_STOP` set exits 0 … ``, replace "A failed artifact lookup on a `completed` run is one line and waiting." with "A failed artifact lookup on a `completed` run counts as a failed download of its bundle, below."
- [ ] In `docs/remote-execution.md` → `### Resuming without the local watcher` → **A bundle that cannot be downloaded is waited on, and bounded the same way.**, change "A finished run whose bundle GitHub lists but `gh run download` cannot fetch counts as waiting" to "A finished run whose bundle GitHub lists but `gh run download` cannot fetch, or whose artifact list cannot be read, counts as waiting".
- [ ] Add a case to `cli/test/remote-run.test.mjs` shaped like "poll at the download bound sends one push-only bundle_unreadable, posts nothing, and disables itself". Make the stub fail the `actions/runs/<id>/artifacts` call for the completed run instead of the download, and extend the stub with a switch for that if it has none. Assert that the `download_failures` count increases tick by tick, and that at the bound one `bundle_unreadable` notification is sent and the poller disables itself. Run `npm test --workspace cli -- test/remote-run.test.mjs` from the repository root. That is the only test this fix runs.
