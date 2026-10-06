### Task 9 — The poller waits on a listed bundle it cannot download, bounded, and skips a run that never started

**Goal:** The resume poller (`remote-run.sh poll`, the body of `harness-resume.yml`) stops treating "this run's bundle could not be downloaded" as "nothing is waiting". Gate 12 round 8, finding 3's follow-on effects, and finding 6, suggested fix 6: poller run `37391037312` could not download the bundle of `37363550384`, skipped `feat_invoices_5`, and disabled `harness-resume.yml` because "no branch is waiting".

Two cases sit behind that one line, and this task separates them:
- **A bundle is listed but the download failed.** The bundle exists, so the failure is likely transient. The run counts as **waiting**, bounded by `HARNESS_POLL_MAX_DISPATCH_FAILURES` **consecutive** failed downloads of that run. A later successful download resets the count. At the bound, the poller sends exactly one push notification naming the error and the manual way on, then stops counting the run as waiting. That is the rule in `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded …"*.
- **No bundle is listed, because the `run` job never started.** There is nothing to download and nothing usage-paused to resume. The run is one log line and **not waiting**. **Task 8**'s `collect` posts the one report, so the poller posts none.

**The run's state is unknown on the download path.** Every branch's newest finished run reaches it, delivered, parked and user-paused ones as well as usage-paused ones; only the download failed. So the bound's report asserts no state: it is a push notification only, with no comment and no label change. It never goes through `notify` or `forge_report`, because those would post *"The harness run on `<br>` failed …"* and set `sdlc-harness: failed`, possibly on a pull request that is `done` or a run that is `parked`. Finding 6, suggested fix 6, asks for the failure to be "waiting (or *failed*, reported)", not for the run to be declared failed.

**Depends on:**
- **Task 8**, the previous task to edit `cli/templates/scripts/remote-run.sh`.
- **Task 6**, which provides `run_not_started_var <run_id>`:
  - `0` — the run's `run` job ended `cancelled` or `failure` with no step listed, with `NOT_STARTED_REASON` set;
  - `1` — it started, or no such job is listed;
  - `2` — the lookup failed, with `GH_ERR` set. It never exits.

**Where this task stops.** This task edits the completed-run path of `poll_branch`, the poller state's shape, `notify`'s push half, and the text that describes the poller's count and bound. The unfinished-run path already counts a failed lookup or download as waiting, and stays. `poll_recheck`, the re-enable after a disable, stays too. The adopter document's description of the bound, `docs/remote-execution.md`, is **Task 13's**.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - `poll_branch`'s completed-run path, where `poll_fetch` fails today ("`$branch skipped`");
  - `POLL_STATE`'s comment, `poll_state_put`, and a new `poll_state_downloads_put`;
  - `notify`, split into a new `notify_push` and the existing `forge_report` call;
  - the header paragraph beginning `` `poll`: `HARNESS_REMOTE_STOP` set exits 0 ``;
  - the header paragraph `` `continue` AND `poll` CLOSE THE LOOP WITHOUT THIS MACHINE ``: its `HARNESS_POLL_MAX_DISPATCH_FAILURES` entry and its sentence "Notifications go through the sibling `autonomous-notify.sh`, as `paused` or `failed`, and each is then reported as `report` reports that event".
- `cli/templates/github/workflows/harness-resume.yml`: the header's `WHAT IT READS.` entries `HARNESS_PUSH_URL (optional notifications: the poller's own failed notice when it cannot resume a run)` and `HARNESS_POLL_MAX_DISPATCH_FAILURES (failed re-dispatches of one paused run before the poller gives up on it …)`, and `WHAT IT WRITES.` ("the failed-dispatch count `poll` carries to the next tick").
- `cli/test/remote-run.test.mjs`: the `poll` cases.

**Work:**

- [ ] **Before `poll_fetch` on a completed run,** call `bundle_listed "$id"`:
  - **`1`, none listed.** Call `run_not_started_var "$id"`.
    - On `0`: echo `remote-run.sh: poll: run $id of $branch never started ($NOT_STARTED_REASON); its collect job reports it; not waiting`, and return 1.
    - Otherwise: echo the existing skip line, and return 1, as today.
  - **`2`, the lookup failed.** Echo `remote-run.sh: poll: reading the artifacts of run $id ($branch) failed ($GH_ERR); counted as waiting`, and return 0, as the unfinished path already does.
  - **`0`, listed.** Go on to `poll_fetch`.
- [ ] **The download count, kept apart from the dispatch count.** A new key, `download_failures`, in the branch's `POLL_STATE` entry. The existing `failures` key keeps counting failed re-dispatches only, so a reset here never unbounds a dispatch retry.
  - `poll_state_downloads_put <branch> <run_id> <count>` sets `download_failures` on the entry, starting a fresh `{run_id, failures: "", notified: ""}` entry when the stored `run_id` differs. `poll_state_put` keeps an existing `download_failures` for the same `run_id`. Update `POLL_STATE`'s comment to the four keys. `poll_state_load` already accepts any object entry, so a carried three-key entry reads as `download_failures` empty.
  - **A download that fails** (`poll_fetch` returns non-zero): `n` = the stored `download_failures` for this `run_id`, plus one. Below `POLL_MAX_FAILURES`: when `may_dispatch` is `1`, `poll_state_downloads_put "$branch" "$id" "$n"`; echo `remote-run.sh: poll: the bundle of run $id ($branch) could not be downloaded, attempt $n of $POLL_MAX_FAILURES; still waiting`; return 0. At the bound: when `may_dispatch` is `1`, `poll_state_put "$branch" "$id" "<failures as stored>" 1` and one `notify_push bundle_unreadable "$branch" "The resume poller could not download the state bundle of run $id after $n attempts ($GH_ERR); it no longer watches $branch. Its state is unknown: check the run, then run $RESUME_HINT $branch if it is paused; $(hr_github_resume_route "$branch" "")."`; return 1. With `may_dispatch` `0`, nothing is written and nothing sent, per `poll_branch`'s own header ("With may_dispatch 0 nothing is sent and nothing notified").
  - **A download that succeeds** with a non-empty stored `download_failures` for this `run_id`: when `may_dispatch` is `1`, `poll_state_downloads_put "$branch" "$id" ""`, so only consecutive failures count.

  The existing `notified` check at the top of the completed path keeps the push to exactly one per run. Leave the existing `cannot be downloaded:` line from `poll_fetch` as it is.
- [ ] **`notify_push`.** Split `notify`'s first half (the `HARNESS_REPO_SLUG` export, the `autonomous-notify.sh` call and its two lines) into `notify_push <event> <branch> <detail>`, and have `notify` call it and then `forge_report`, as today. Its comment says it posts no comment and sets no label. The word `bundle_unreadable` is deliberately outside `autonomous-notify.sh`'s seven: none of them is true of a run whose state is unknown. That script's header says an unrecognised word *"is still delivered, under a generic title"*, here `Run (bundle_unreadable) — <branch>`, which is intended.
- [ ] **The text.**
  - The `poll` paragraph: replace "a bundle that cannot be downloaded (one line)" in the skipped list with "a run whose `run` job GitHub never started (one line; its `collect` job reports it)". Add that a listed bundle that cannot be downloaded is waiting, counted per run and reset by a later successful download, and that at `HARNESS_POLL_MAX_DISPATCH_FAILURES` consecutive failures it sends exactly one `bundle_unreadable` push notification, with no comment and no label, and is no longer waiting. Add that a failed artifact lookup on a completed run is waiting.
  - The `continue` / `poll` paragraph: the `HARNESS_POLL_MAX_DISPATCH_FAILURES` entry becomes "`poll` only: failed re-dispatches of one paused run, and consecutive failed downloads of one run's listed bundle, each counted apart, before it gives up; `3` when empty". The "Notifications go through …" sentence adds the one exception, the push-only `bundle_unreadable`.
  - `harness-resume.yml`: the `WHAT IT READS.` `HARNESS_POLL_MAX_DISPATCH_FAILURES` entry gains "or consecutive failed downloads of one run's listed bundle", and the `HARNESS_PUSH_URL` entry becomes "the poller's own notice when it cannot resume a run or cannot download its bundle"; `WHAT IT WRITES.` becomes "the failed-dispatch and failed-download counts `poll` carries to the next tick".
- [ ] **`remote-run.test.mjs`.** Next to the existing `poll` cases, add:
  - **Listed, download failing.** `harness-resume.yml` stays enabled (no `workflow disable` call), and `poll_state.json` records `download_failures: "1"` for that run, with `failures` untouched.
  - **The bound.** Carried state at `download_failures: "2"`, the bound at 3: exactly one push notification under `bundle_unreadable`; **no** comment call and **no** label call; `notified` is `1`; and with nothing else waiting, the poller disables itself.
  - **A delivered run at the bound.** The same, with the item's label stubbed as `sdlc-harness: done`: no label call, so the label is unchanged.
  - **Reset.** Carried `download_failures: "2"` and a download that succeeds of a bundle that is not usage-paused: `download_failures` is empty afterwards.
  - **None listed, never started**, the jobs stub `cancelled` with `steps: []`: the `never started` line; not waiting; nothing notified; nothing posted. **None listed, started:** today's skip line.

**Verification:**

- `npm test --workspace cli -- test/remote-run.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- The listed-but-undownloadable case asserts that the poller keeps itself enabled. That is the path round 8's poller took the wrong way.
- Grep the completed-run path for `notify failed` and `forge_report`: neither appears on the download path. Every `poll_state_*put` and `notify_push` call this task adds sits under `may_dispatch -eq 1`.
