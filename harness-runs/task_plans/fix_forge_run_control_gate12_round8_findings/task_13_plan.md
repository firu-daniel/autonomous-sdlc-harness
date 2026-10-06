### Task 13 — `docs/remote-execution.md`: the poll bound, push retries, jobs GitHub never starts, the runner wait, and round 8's verified rows

**Goal:** `docs/remote-execution.md` is the design of record for a remote run. This task makes it state what Tasks 1 to 12 built, and moves the `## 6.` row halves that Gate 12 round 8 settled into a *Verified in Gate 12 round 8* table, the form rounds 2 to 4 used.

**Depends on:** Tasks 1 to 12, and Task 16. The facts each one shipped, restated so this file needs no other:
- **Task 1.** `remote-run.sh pause-requested` exits `0` for a pause, `5` for "no pause", `1` for a usage error and `3` for a failed `gh` read.
- **Task 2.** The job's control poll moves `control_polled_at` to the larger of its starting bound and the epoch before the query less `CONTROL_POLL_OVERLAP_SECS` (300). It reads `1` as a failed poll, and logs one line per poll to the job log.
- **Task 3.** `push-branch.sh` retries a refused push, `PUSH_ATTEMPTS` (3) attempts in all, waiting `PUSH_RETRY_DELAY_SECS` (5) and then three times that. It never retries a `[rejected]` push (non-fast-forward or fetch-first). Every path still exits 0.
- **Task 4.** `hr_push_landed` answers `1` for a refused push and `2` for a moved remote, and `start` and `review` name which.
- **Tasks 5 to 7.** A dispatch's engine is recoverable for a run whose `run` job GitHub never started:
  - the trigger's `started` comment means `task`;
  - a `round` comment means `user_review`;
  - `control`'s post-dispatch reply carries ` engine=<engine>`;
  - the newest such bot-authored marker on the run's issue or pull request, no earlier than `DISPATCH_MARKER_SLACK_SECS` (120) before the run's `createdAt`, gives `remote_state` its engine.

  "Never started" means the `run` job ended `cancelled` or `failure` with no step listed. Its reason is the job's first check-run annotation. Such a run is `paused` / `killed` when an older run carries a bundle **or** its engine is recovered, so `resume` accepts it, a branch's first run included; with no bundle anywhere and no engine it is `failed`. `sync` records it the same way. A first run's branch carries no flow-progress ledger, because `start` commits only the task prompt: when it is resumed, `restore` finds no previous bundle and the job starts as the branch's first.
- **Task 8.** `collect` reports such a run once, as `not_started`, labelled `paused`, or `failed` when no bundle exists anywhere and no engine is recorded. The comment names `@sdlc-harness resume` when the engine is recorded, else the Run workflow form.
- **Task 9.** The poller counts a listed bundle it cannot download as waiting. `HARNESS_POLL_MAX_DISPATCH_FAILURES` now also bounds **consecutive** failed downloads of one run's bundle, counted apart from failed re-dispatches and reset by a later successful download. At the bound the poller sends one push notification, `bundle_unreadable`, with no comment and no label change, because the run's own state is unknown. A never-started run is one line and not waiting.
- **Task 10.** `control` accepts a branch whose tip carries the ledger; or, for a command on an issue, the branch that issue's genuine `started` marker names; or one whose `harness run` is queued or in progress. So a first run GitHub never started is resumable from its issue.
- **Task 16.** `/autonomous-sdlc-harness:branch-resume`'s `paused` bullet says the same of a `killed` first run.
- **Task 11.** The job logs `HARNESS_JOB_STARTED_EPOCH` less the run's `createdAt` as its runner wait. A wait of at least 300 s is noted on its `resumed` comment.
- **Task 12.** The gate's refusal cites §7 step 4 and §11.
- **Declined: a generic retry around `gh` calls and dispatches** (story index → `## Context`). A 5xx answer to a `POST` does not say whether the write landed, so a retried dispatch or comment could start two runs or post two.

**Where this task stops.** `docs/github-run-control.md` (Task 14) owns the GitHub-side wording: branch recognition, the `not_started` comment row and the push rule of record. This file cites it rather than restating it. `docs/development.md`'s round 8 record is **Task 15's**.

### Targets

- `docs/remote-execution.md`:
  - `## 1.` → the command table's `/autonomous-sdlc-harness:branch-resume` row;
  - `## 3.` → `### The kill switch and stopping` → **Pausing one run**;
  - `## 4.` → **Central state.**, its two sentences on a run that left no bundle;
  - `## 3.` → `### Resuming without the local watcher`;
  - `## 3.` → `### Runs longer than a job`;
  - a new `## 3.` → `### When GitHub fails or lags`, placed after `### Stalls`;
  - `## 6.`: its opening paragraph, its table, and a new `### Verified in Gate 12 round 8` after `### Verified in Gate 12 round 4`;
  - `## 7.` → `### Every secret and variable` → the `HARNESS_POLL_MAX_DISPATCH_FAILURES` table row.

**Work:**

- [ ] **Pausing one run.** Replace "for such a run created after a lower bound: … So a pause sent while the job was queued, or across a chained continuation, is not lost." with the bound as it now is. It starts at the run's own creation (a user's dispatch) or the previous job's carried `control_polled_at` (a chained continuation). Each poll re-reads the last `CONTROL_POLL_OVERLAP_SECS` (300) and never drops below that start, because GitHub's run listing can show a just-created run late (Gate 12 round 8, finding 1). Add that a `pause-requested` usage error is a failed poll, never "no pause", and that each poll's result is one line in the job log.
- [ ] **`### When GitHub fails or lags` (new).** State, each as a **Decision:** with its **Reason:**, in the file's existing form:
  - a refused push is retried by `push-branch.sh`, and a push that lost a race is never retried (cite `github-run-control.md` → `## 2.` for the rule of record);
  - placement names "refused" or "moved";
  - a `run` job GitHub never started is reported once by the same workflow's `collect` job, the engine is recovered from the dispatch's comment, and the comment names `resume` or the form;
  - a branch's first run that GitHub never started is resumable by `@sdlc-harness resume` once the trigger's `started` comment gives it engine `task`: with no bundle anywhere the resumed job starts as the branch's first, which is safe;
  - a chained or poller dispatch posts no comment, so its never-started run still needs the Run workflow form;
  - **Not built:** a generic `gh` retry, with the reason above; and the poller reporting a never-started run, because two reporters would post two comments. If `collect` itself never gets a runner, nothing reports the run. Say so plainly.
- [ ] **The two §3 subsections, and the §7 variable row.**
  - `### Resuming without the local watcher`: after **A re-dispatch that keeps failing is bounded.**, add that a finished run's listed bundle that cannot be downloaded is waiting, that `HARNESS_POLL_MAX_DISPATCH_FAILURES` consecutive failed downloads, counted apart from failed dispatches and reset by a success, end it with one push notification that sets no label and posts no comment, because the run's state is unknown, and that a run whose job never started is not waiting.
  - `## 7.` → `### Every secret and variable`: the `HARNESS_POLL_MAX_DISPATCH_FAILURES` row's *Read by* cell becomes "`remote-run.sh poll`: failed re-dispatches of one paused run, and consecutive failed downloads of one run's listed bundle, each counted apart, before the poller gives up on it".
  - `### Runs longer than a job`: add the logged runner wait and the `resumed` note. The budget already starts at `HARNESS_JOB_STARTED_EPOCH`, so a queue wait costs none.
- [ ] **What `killed` now covers: `## 1.` and `## 4.`** After Tasks 6 and 7, `paused` with `pause_reason: killed` also means a run whose job GitHub never started, and for a first run one with no ledger.
  - `## 4.` → **Central state.** Two sentences go false:
    - "A job that ended without uploading one — killed before the upload, or finished while its bundle still said `running` — syncs as `paused` with `pause_reason: killed`, not `failed`, because a `failed` record has no resume path while the ledger on the branch is intact". Keep it for a job that ran. Add that a run whose job GitHub never started syncs the same way when an older run carries a bundle or its dispatch's comment records its engine, and that for a first run there is no ledger yet: `restore` finds no previous bundle and the resumed job starts as the branch's first.
    - "A run with no bundle anywhere syncs as `failed`, and re-dropping the artifact is the recovery." Qualify it: unless its job never started and its engine is recovered, as above.

    Link `### When GitHub fails or lags` for the detail.
  - `## 1.` → the `/autonomous-sdlc-harness:branch-resume` row: "A run `paused` with `pause_reason: killed` — a job that ended mid-run — resumes the same way" becomes "a job that ended mid-run, or one GitHub never started — resumes the same way; a first run that never started has no ledger yet and starts as the branch's first (§4)".
- [ ] **`## 6.`**
  - The row "A `remote-run.sh continue` chain and a `harness-resume.yml` poller dispatch name `github-actions[bot]` …" keeps only its poller-dispatch half. Gate 12 round 8, observation (xv)(f), did not observe a poller dispatch.
  - Move the `continue`-chain half and the `owner.type` half to a new `### Verified in Gate 12 round 8` table (`| Behaviour | What rests on it | Evidence | Date |`). The evidence is legs (e) and (g), quoted from the task prompt's round 8 paragraph:
    - (e): chained run `37414238278` named `github-actions[bot]` as both actors, and its gate logged `@github-actions[bot] passes: every harness dispatch is made with GITHUB_TOKEN and names it.`;
    - (g): the owner's dispatch logged `@firu-daniel passes: HARNESS_RUN_ACTORS is unset, which admits the owner of this user-owned repository alone.`.

    Dates: 2026-10-06.
  - Add two rows to the not-verified table:
    - a job no runner acquired lists no steps in the jobs API and carries its reason as a check-run annotation (what rests on it: Task 6's detection; if wrong: such a run reads as killed with today's detail, and `resume` falls back to the Run workflow form);
    - git prints `! [rejected]` for a lost race and `! [remote rejected]` or no ref line for a server-side refusal (what rests on it: Task 3's retry choice; if wrong: a lost race is retried and fails again three times, still exiting 0 and still never forcing).
  - Name round 8 in the opening paragraph's list of rounds.

**Verification:**

- Grep `docs/remote-execution.md` for `section 9` (none should point at the allow-list), `CONTROL_POLL_OVERLAP_SECS`, `PUSH_ATTEMPTS`, `not_started`, `bundle_unreadable` and `Verified in Gate 12 round 8`: each of the last five is present.
- `git grep -nE "HARNESS_POLL_MAX_DISPATCH_FAILURES" -- docs`: every prose hit names the download count as well as the dispatch count.
- `git grep -nE "pause_reason: killed|ended mid-run" -- docs`: every hit in `## 1.` and `## 4.` also names a job GitHub never started; the hit in `### The kill switch and stopping` (**Closing or deleting stops a run too.**) is unchanged and stays true.
- Every constant, exit code and default named here matches the template that owns it. Grep `cli/templates/scripts/remote-run.sh`, `autonomous-watcher.sh` and `push-branch.sh` for each name and value.
- Every `[`…`](github-run-control.md)` link this task adds names a heading that exists in that file.
