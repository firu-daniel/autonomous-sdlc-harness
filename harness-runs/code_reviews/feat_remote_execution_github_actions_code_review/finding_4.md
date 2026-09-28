### 4. `remote-run.sh stop` also cancels the jobless marker runs, its own stop marker included, which can turn a successful stop into a "partial" one

**File:** `cli/templates/scripts/remote-run.sh` (`verb_stop`) — "select(.status == \"queued\" or .status == \"in_progress\" or .status == \"waiting\")"

**Problem.** `verb_stop` works in this order:

1. It dispatches the `action=stop` marker for the branch.
2. It lists the branch's runs with `--json databaseId,status`.
3. It cancels every run whose status is `queued`, `in_progress` or `waiting`.

The listing does not look at `displayTitle`, so step 3 also selects jobless marker runs: the `harness stop <branch>` run that step 1 just created, and any `harness pause <branch>` run still settling. A marker run starts no job and completes within seconds. If it moves to `completed` between the listing and its `gh run cancel`, GitHub refuses to cancel a completed run and `gh` exits non-zero. `verb_stop` then:

- sets `failed=1`;
- reports "stop of '<branch>' is partial; the local record is unchanged, run stop again";
- exits 3;
- leaves `remote_stopped_at` / `status failed` unwritten.

Every real run was in fact cancelled. The suggested remedy of running `stop` again dispatches a fresh marker and reopens the same race.

Cancelling a marker also buys nothing. A marker has no job to stop, and `remote_branch_stopped` matches markers by title and `createdAt` whatever their conclusion. Only `harness run <branch>` runs carry a job.

**Fix.** Cancel only the branch's `harness run` runs.

- [ ] In `verb_stop`, change the listing and the selection:
  ```bash
  gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch "$branch" --json databaseId,displayTitle,status --limit 100 || gh_fail "listing the runs of '$branch' failed"
  ids=$(printf '%s' "$GH_OUT" | jq -r --arg t "harness run $branch" '.[] | select(.displayTitle == $t and (.status == "queued" or .status == "in_progress" or .status == "waiting")) | .databaseId' 2>/dev/null) || {
  ```
  Leave the rest of the function as it is.
- [ ] Header, `stop` DOES THREE THINGS: in step (2), change "cancels each one whose status is `queued`, `in_progress` or `waiting`" to "cancels each run titled `harness run <branch>` whose status is `queued`, `in_progress` or `waiting` — never a jobless `harness stop` / `harness pause` marker, which has no job to stop and may complete before its cancel lands".
- [ ] Header REPRO: in the stub's `"run list"` answer, change `[{\"databaseId\":7,\"status\":\"in_progress\"}]` to `[{\"databaseId\":7,\"displayTitle\":\"harness run feat_x\",\"status\":\"in_progress\"}]`, so the `stop` entry still records `run cancel 7`.
- [ ] In `cli/test/remote-run.test.mjs`:
  - Give each element of `ACTIVE_RUNS` `displayTitle: 'harness run feat_x'`.
  - Add a fifth element, `{ databaseId: 15, displayTitle: 'harness stop feat_x', status: 'queued' }`.
  - In `'stop sends the marker first, cancels exactly the active runs, and flips an existing record to failed'`, assert that no `run cancel 15` was recorded.

**Deviations from plan:** The header's usage exit-0 line for `stop` ("every queued, waiting or in-progress run of that branch was asked to cancel") also narrowed to "`harness run` run", so the header still matches `verb_stop` (`.claude/context/cli.md` → a change satisfies its module's header or amends it).
