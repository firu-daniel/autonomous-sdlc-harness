### Task 6 — `remote_state` recognises a run whose `run` job GitHub never started

**Goal:** The one derivation every reader shares can tell a job that died mid-run from a job GitHub never started, and it names GitHub's reason. That derivation is `remote_state`, used by `sync`, `fetch`, `status`, `control` and `collect`.

Gate 12 round 8, finding 3, is the evidence. Round 4's run `37363550384` had its `run` job cancelled with *"The job was not acquired by Runner of type hosted even after multiple attempts"*. No step ran. `collect` then read the state as `paused (killed)`, with the detail "ended with no state bundle (killed, cancelled or replaced)", and said nothing anyone could act on.

**Depends on:** Task 5, the previous task to edit `cli/templates/scripts/remote-run.sh`.

**Where this task stops.** This task detects the run and describes it. It does not fill in an engine: **Task 7** does that, inside `remote_state`, for a run this task marks. **Task 7** also makes a Case 5 run that never started resumable once its engine is recovered: it moves `RS_STATE` from `failed` to `paused` with `RS_PAUSE_REASON` `killed`, and adds one sentence saying so to each of the two header paragraphs this task edits. This task leaves Case 5 at `failed`, which is correct until Task 7 ships, and writes its header text so that Task 7's sentence can follow it. It does not report the run: **Task 8** does that in `collect`. The poller's use is **Task 9's**. Each consumes exactly the interface below.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - a new helper, `run_not_started_var`;
  - `remote_state`'s Cases 4 and 5, and its `RS_*` initialisation;
  - the header paragraphs `` THE `killed` AND `expired` MAPPINGS `` and `` `sync` READS THE NEWEST `harness run <branch>` RUN `` (cases 4 and 5).
- `cli/test/remote-run.test.mjs`: `fetch` and `status` (no record) cases on a never-started run.
- Any further `cli/test/*.test.mjs` that the grep in the last Work bullet finds asserting an exact `gh` call list on a no-bundle path.

**Work:**

- [ ] **`run_not_started_var <run_id>`**, the interface Tasks 7, 8 and 9 consume. It reads `gh_call api "repos/{owner}/{repo}/actions/runs/<run_id>/jobs"` and takes the job named `RUN_JOB_NAME`. It returns:
  - `0` — that job's `conclusion` is `cancelled` or `failure` **and** its `steps` array is absent or empty. Set `NOT_STARTED_REASON` to the first `message` of `gh_call api "repos/{owner}/{repo}/check-runs/<job id>/annotations"`. A job's `id` is its check run's id. When that lookup fails, or carries no message, use ``its `run` job ended `<conclusion>` with no step run``;
  - `1` — the job started, or no such job is listed;
  - `2` — the jobs lookup failed or was not the expected JSON. `GH_ERR` is set, and the helper never exits.

  Write a doc comment that states the predicate and says the annotation is best-effort.
- [ ] **`remote_state`.** Initialise `RS_NOT_STARTED=0` and `RS_RUN_CREATED_AT` (the newest run's `.createdAt` from `RS_RUNS`, ISO 8601) with the other `RS_*` values. Then:
  - In Case 4 (no bundle on this run, one on an older run) and Case 5 (no bundle anywhere), call `run_not_started_var "$RS_RUN_ID"`.
  - On `0`, set `RS_NOT_STARTED=1`. Keep `RS_STATE` and `RS_PAUSE_REASON` as each case already sets them: Case 4 is `paused` / `killed`, Case 5 is `failed`. Set `RS_DETAIL` to `GitHub did not start the job of run $RS_RUN_ID ($NOT_STARTED_REASON): $RS_RUN_URL`.
  - On `1`, change nothing.
  - On `2`, print one stderr line naming `GH_ERR`, and change nothing else.

  Cases 1 to 3 never call the helper. A run with a bundle started by definition.
- [ ] **The two header paragraphs.**
  - `` THE `killed` AND `expired` MAPPINGS ``: a finished run with no bundle whose `run` job GitHub never started maps to the same states. That is `paused` / `killed` when an older run carries a bundle, else `failed`. Its detail names GitHub's reason instead of "killed, cancelled or replaced".
  - The `sync` paragraph's case 4: after "a job that died before its upload", add "or that GitHub never started (the detail says so)".
- [ ] **`remote-run.test.mjs`.** Find the suite's `gh` stub answers for `actions/runs/<id>/jobs` and `artifacts`, and add a `check-runs/<id>/annotations` answer if the stub has none. Add these cases:
  - **Case 4, never started.** An older completed run carries a bundle. The newest run is completed with no artifact, and its `run` job is `{"name":"run","status":"completed","conclusion":"cancelled","steps":[],"id":555}`. The annotation answer is `[{"message":"The job was not acquired by Runner of type hosted even after multiple attempts"}]`. `fetch` prints `state: paused`, `pause_reason: killed`, and `detail: GitHub did not start the job of run <id> (The job was not acquired by Runner of type hosted even after multiple attempts): <url>`.
  - **Case 4, started.** The same, with one step listed: the detail is the existing `ended with no state bundle (killed, cancelled or replaced)` one.
  - **Case 5, never started, no annotation.** `status` with no record prints `state: failed`, and a detail carrying ``its `run` job ended `cancelled` with no step run``.
  - **The jobs lookup fails.** The state and detail are those of today, and stderr names the failure.
- [ ] **Other suites that pin exact `gh` call lists.** A completed run with no bundle now costs one jobs call, and an annotations call when it never started. Grep for suites that may assert the old sequence:

  ```
  git grep -nE "no state bundle|paused \(killed\)|left no bundle|killed" -- cli/test
  ```

  Read each hit that asserts an exact sequence or count of `gh` calls on a no-bundle path, and update it. Make sure each such stub answers the jobs endpoint; an unstubbed endpoint must take the `2` path rather than crash. Name in your return each suite you edited and each you judged and left alone.

**Verification:**

- `npm test --workspace cli -- test/remote-run.test.mjs`, from the repository root, passes. Run each further suite this task edited the same way, one file at a time.
- `bash scripts/typecheck.sh` exits 0.
- Grep `remote_state` for `run_not_started_var`: it appears only in the no-bundle cases.
