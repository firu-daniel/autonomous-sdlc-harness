# Remote execution on GitHub Actions

**Who reads this:** a maintainer deciding whether to run the harness's unattended runs in a GitHub Actions job instead of on their own machine, and anyone changing the remote path — the watcher's dispatch, `remote-run.sh`, the two workflow templates. It owns the design of record: what happens between a dropped file and a pushed branch when a run executes remotely, each decision the design took and its reason, and the GitHub behaviours the design rests on without having verified them. Setup, runner choices, credentials, costs and security are §7 onward.

It cites rather than restates. The key's contract is [`config.md`](config.md) → `## 5. Key reference`; the workflows `init` writes, `init --plugin-root-entries` and `doctor`'s `remote-execution` and `remote-github` checks are [`cli.md`](cli.md); the pause/resume protocol is `plugin/instructions/autonomous_pause_and_ledger.md`; the local watcher is [`watcher.md`](watcher.md); starting a run from a GitHub issue is [`github-issue-trigger.md`](github-issue-trigger.md); working a run from GitHub through comments, reviews and its draft pull request is [`github-run-control.md`](github-run-control.md). The code of record is `cli/templates/scripts/remote-run.sh` (its header states every verb and its exit map), `cli/templates/scripts/autonomous-watcher.sh` → the header's `REMOTE DISPATCH` and `JOB MODE` blocks, the headers of `cli/templates/github/workflows/harness-run.yml` and `harness-resume.yml`, and `cli/templates/scripts/lib/harness-run-lib.sh` → `THE REMOTE STATE BUNDLE`.

---

## Turning it on, in short

Remote execution is off unless `harness.config.json` carries `execution.target` set to `github-actions`. Absent or `local`, nothing in this document happens: `init` writes no workflow, the watcher launches every run on this machine as before, and nothing new is asked of anyone. The switch:

```
npx autonomous-sdlc-harness config set execution.target github-actions
```

With it on, the watcher still runs on this machine — it is what dispatches — and the run itself executes in a job on a GitHub-hosted runner, or on a self-hosted runner when the repository variable `HARNESS_RUNNER` names its runner label. The workflows must then be written, committed and pushed to GitHub's default branch and a credential secret set before the first drop; §7 gives every step, secret and variable, and §8 the runner choices.

---

## 1. The lifecycle of a remote run

From a drop to a pushed branch:

1. **The drop.** The user runs `/autonomous-sdlc-harness:branch-prompt` (or answers `Run it autonomously` to the task offer, which invokes it). The file lands in the main checkout's inbox exactly as it does for a local run.
2. **Preparation.** The watcher's inbox pass reads `execution.target` from the configuration in effect for that drop, then does what it does locally: creates the working copy, copies the artifact in, commits it and pushes the branch. For a remote run a failed commit or push **blocks** the dispatch, because the job sees only what was pushed; locally it never blocks. The usage hold, the concurrency cap and the machine lane are skipped, since the job gates itself. The kill switch `AUTONOMOUS_STOP` still defers the drop.
3. **Dispatch.** The watcher calls `remote-run.sh dispatch <branch> --engine <kind>`, which sends `workflow_dispatch` to `harness-run.yml` with `action: run` and `chain: 0`. The registry record is written with `execution: github-actions` and an empty `pid`; a run keeps the execution it started with for its whole life, and every later pass reads the record's field, never the current key. From here the local working copy is a **mirror** that only `remote-run.sh sync` fills, and that `remote-run.sh review` fast-forwards to place a user review.
4. **The job's setup**, in the order `harness-run.yml` runs it: compute the time budget from `runner.environment`; stop if `HARNESS_REMOTE_STOP` is set; check out the branch; check for `jq` and `gh`; read `scriptsDir` and whether docs retrieval applies from `harness.config.json` at run time; set up Node; install the `claude` CLI when absent; refuse when neither credential secret is set; install the plugin from the marketplace repository's release tag for the workflow's version, and refuse when that tag is absent or the installed version differs (§4); restore the retrieval cache when retrieval applies; generate the job's permission profile with `init --plugin-root-entries` and fail if that changed a tracked file; run `doctor --remote-job` as a preflight, which stops the job on a committed profile, on one whose paths name another checkout, or on a missing plugin-root grant (§4); bootstrap the checkout with `setup-worktree.sh`; and `remote-run.sh restore` the previous job's state bundle of the branch's current lineage (§4, **Central state.**).
5. **The run.** `autonomous-watcher.sh job <branch> <engine> <resume>` launches one session through the watcher's own `spawn_engine` and supervises it (§3). It writes `status.json` with decision `continue` before the launch, so a job killed mid-run still leaves a bundle that says *continue*.
6. **The end of the job.** Under `always()`: `push-branch.sh`, which pushes nothing back for a branch origin no longer has, so a run stopped because its branch was deleted does not re-create it, then `remote-run.sh save` and the upload of the bundle as the Actions artifact `harness-state`. Under `!cancelled()`: `remote-run.sh continue`. Under `cancelled()`: a best-effort `failed` notification.
7. **The decision.** `continue` reads the bundle's `decision`. `continue` re-dispatches the same workflow with `resume: pause` and `chain` one higher; `wait-poller` enables `harness-resume.yml`; `stop` does nothing, because job mode has already notified.
8. **Done.** A run that completes ends with status `completed`, decision `stop`, a `completed` notification and its branch pushed. With `forge` set to `github`, the run's draft pull request was opened when the run started, by the run workflow's `Open the draft pull request` step (`remote-run.sh open`), naming the issue the run was started from when there is one; the job's `deliver` step now marks it ready for review and posts the `completed` comment on it and on the source issue, and opens one only when none is open at completion ([`github-run-control.md`](github-run-control.md) → `## 4. The draft pull request`). Without `forge` `github` none is opened, and the flow itself opens none either way (§5). With `phases.qa` on, the interactive-test phase was skipped rather than run, and the branch still owes it a local run (§3, *The interactive-test phase*).

```mermaid
flowchart LR
  subgraph local["This machine"]
    U["User"]
    IN["Inbox"]
    W["Local watcher"]
    M["Mirror working copy"]
    RR["remote-run.sh"]
  end
  subgraph gh["GitHub"]
    WD["workflow_dispatch<br/>harness-run.yml"]
    RL["Run list<br/>harness run / pause / stop"]
    AR["Artifact harness-state"]
    BR["Branch on origin"]
    PO["harness-resume.yml<br/>poller"]
  end
  subgraph job["The job"]
    J["Workflow steps"]
    X["autonomous-watcher.sh job"]
  end
  U -->|"drop"| IN
  U -->|"answer, resume, pause, review"| RR
  IN --> W
  W ==>|"one-way: push the drop"| BR
  W --> RR
  RR ==>|"one-way: push a review"| BR
  RR ==>|"one-way: dispatch, pause, stop, warm"| WD
  WD --> RL
  WD --> J
  J --> X
  X -.->|"poll for harness pause"| RL
  X -->|"push after every commit"| BR
  J -->|"upload"| AR
  J -->|"continue: re-dispatch"| WD
  J -->|"enable on a usage pause"| PO
  PO -->|"resume: pause"| WD
  RR -.->|"sync, status, fetch: on request"| AR
  RR -->|"sync fills; review commits"| M
```

The thick arrows are the only edges from this machine to GitHub, and each is a user's action, sent by the command itself. The dotted arrows are reads. Nothing flows from GitHub to this machine unless the user asks: once the dispatch is sent, the machine can be switched off for the rest of the run.

**What each local command does for a remote run.** `/autonomous-sdlc-harness:branch-answer`, `-resume`, `-pause` and `-user-review` act on GitHub directly: they write no file into a mirror, nothing relays them, and no local watcher takes part. A run takes this route when its record carries `execution: github-actions`, or when it has no local record and the command's `<branch>:` prefix names a branch with a `harness run <branch>` run on GitHub; without a prefix the candidates are the registry's, so a run with no record — one started from an issue, or dispatched from another machine — is reached only through the prefix. A remote record is first brought current with `remote-run.sh sync`; a branch with no record is read with `remote-run.sh fetch`, which downloads the newest bundle into the command's scratch directory `<stateDir>/scratch/<command>-<branch_fold>/` and writes nothing else. `<branch_fold>` is the branch with every character outside `A-Za-z0-9_-` replaced by `_`, so a `feat/x` branch never makes two directory levels. The command creates that directory, removes it with `remote-run.sh discard` on every path, and stops on a leftover from an interrupted invocation, naming the `discard` command rather than removing a directory it did not create; `discard` removes only a directory strictly inside `<stateDir>/scratch/`. **Reason:** Gate 12 round 5, finding 3, in [`development.md`](development.md): an out-of-tree `mktemp -d` directory, made by a composed `$(mktemp -d)` command and removed with `rm -rf`, was refused in an auto-mode session. `branch-status` never syncs (`remote-run.sh` → the header's `` `fetch` IS THE COMMANDS' READ OF ONE BRANCH ON GITHUB `` paragraph).

| Command | What it does for a remote run |
|---|---|
| `/autonomous-sdlc-harness:branch-prompt` | Unchanged: it writes the inbox file, and the watcher is what dispatches it (steps 2–3). |
| `/autonomous-sdlc-harness:branch-user-review` | Runs `remote-run.sh review`, which refuses a branch whose newest run is anything but `completed` or `failed`. It places the next round on the branch tip — in the record's mirror fast-forwarded to `origin/<branch>`, or in a temporary copy it removes, never bootstrapped — commits it as `chore: add user review for <branch>`, pushes it and dispatches `engine: user_review`. A local run leaves the review for the flow's own commits; a remote one cannot, because a job boundary before that commit would lose it. |
| `/autonomous-sdlc-harness:branch-answer` | Reads the park's questions from the job's newest bundle through `remote-run.sh fetch`, never from a mirror, and collects the answer to every open question file in one invocation: one declined answer sends nothing. It then dispatches `resume: answer` carrying the answers as one JSON input; `remote-run.sh` refuses, naming the limit, a payload over GitHub's `workflow_dispatch` limit of 65,535 characters. A `park_loop` hold is cleared with the answers only on the user's confirmation. An answer travels as an input because clarification files are gitignored by design. |
| `/autonomous-sdlc-harness:branch-resume` | Dispatches `resume: pause` for a `paused` run, or, for a `park_loop` run, the same dispatch with `park_loop_clear` once the user confirms clearing the hold. A run `paused` with `pause_reason: killed` — a job that ended mid-run, or one GitHub never started — resumes the same way; a first run that never started has no ledger yet and starts as the branch's first (§4). So does one with `pause_reason: expired` — its state bundle expired, so its carried counts, clarification history and any planning drafts not yet committed are lost (§4). |
| `/autonomous-sdlc-harness:branch-pause` | Runs `remote-run.sh pause` for a `running` run, which dispatches a jobless run titled `harness pause <branch>`. The job finds it by polling and drops its own `PAUSE`, and the run yields at its next clean checkpoint exactly as a local one does (§3). |
| `/autonomous-sdlc-harness:branch-status` | Runs `remote-run.sh status` once — the newest runs with their URLs and the last-synced record — and reads the synced `<branch>.remote.log`. With no argument it also runs `remote-run.sh list` once, which lists each unprotected branch still live on `origin` whose newest `harness run <branch>` run has no local record, as `on GitHub, no local record: <branch> <url>`. For a branch the registry does not hold, `status` answers from GitHub alone: it reads the newest bundle into a temporary directory it removes on exit and prints the run's state, pause reason and open questions. It writes nothing and never syncs. |
| `remote-run.sh stop <branch>` | Stops the run outright (§3, *The kill switch and stopping*). |
| `gh run cancel <run id>` | Cancels one job. Its chain stops, because the re-dispatch step runs only under `!cancelled()`, but a usage-paused run waiting for the poller has no job to cancel and would still be resumed. Use `remote-run.sh stop` to reach both. |

Each command's dispatch is `chain: 0`, takes no cap slot and consults no lane. A refusal or a `gh` failure is reported by the command, and nothing retries it. A chain-0 `resume: answer` or `resume: pause` sets an existing remote record `running`; the next `sync` remains the record's authority. The local kill switch `AUTONOMOUS_STOP` gates none of these dispatches; the job-side brake is `HARNESS_REMOTE_STOP` (§3, *The kill switch and stopping*).

To stop a run, with the default `scriptsDir` of `scripts`:

```
bash scripts/remote-run.sh stop <branch>
```

### Working a run from GitHub alone

With `forge` set to `github`, a person the allow-list `HARNESS_RUN_ACTORS` admits (§7, *Every secret and variable*) who has no local setup — no checkout, no watcher — works a run by `@sdlc-harness` comments on its issue or pull request and by reviews that request changes ([`github-run-control.md`](github-run-control.md) → `## The GitHub entry point`).

The fallback, which works with or without `forge`, is the **Run workflow** form of `harness-run.yml` on the repository's Actions page — for example when a park's bundle must be read in full, or when the control workflow is not installed. The form's inputs are `## 5.`'s table. A `run` dispatched from the form, or re-run, by a person the allow-list does not admit launches nothing: the job's first step refuses it (§11, *Who can spend the credential*). Every action below picks the run's branch under *Use workflow from*, as `remote-run.sh` does with `--ref` (§7, *Upgrading*), and sets the `branch` input to it. A `run` or `pause` dispatched from any other ref fails at once in a `wrong-ref` job naming the ref to use, and starts nothing: GitHub lists a run under the ref it was dispatched from, so no lookup of the branch would find it (Gate 12 round 6, finding 6, in [`development.md`](development.md) → Gate 12 → Round 6; `harness-run.yml` → the header's `THE REF CHECK`). `stop` and `warm` are exempt. A `stop` is accepted from the default branch, because that is how a deleted branch, whose own ref is gone, is stopped.

- **Answering a park.** Take the question from the run's `harness-state` artifact, under `clarifications/<branch>/question_<n>.md`: download it from the run page's *Artifacts*, or with the GitHub CLI:

  ```
  gh run download <run id> -n harness-state
  ```

  Then **Run workflow** with `action` `run`, `engine` the run's own, `resume` `answer`, and `answers` a JSON object `{"<n>": "<answer text>"}` with one entry per open question. For a park loop, add `park_loop_clear` `true`. A run whose bundle has expired can no longer be answered (`## 4.`); `resume` `pause` continues it from the committed ledger instead.
- **Resuming a pause.** The same form, with `resume` `pause`.
- **Pausing.** `action` `pause`.
- **Stopping.** `action` `stop`. This dispatches the stop marker only; cancel the running job from its run page as well, which is the part `remote-run.sh stop` does for a local maintainer (§3, *The kill switch and stopping*).

The form's equivalent from the GitHub CLI, here resuming a paused task run:

```
gh workflow run harness-run.yml --ref <branch> -f action=run -f branch=<branch> -f engine=task -f resume=pause -f chain=0
```

---

## 2. Why the job runs the watcher

**The job runs `autonomous-watcher.sh job`, not `anthropics/claude-code-action`.** What the local watcher does for a local run, the job must do for itself, and the watcher is already the thing that does it: the launch line flag for flag (`--settings`, `--permission-mode`, the conditional `--model` and `--effort`, `--output-format stream-json`, the two `--add-dir` plus, in job mode only, one more per `permissions.additionalDirectories` entry of the profile), the teed stream the usage gate parses, `classify_run_exit`, the park-loop guard and the stall watchdog. The action wraps its own launch and permission handling and exposes no teed stream to gate on, so each of those would have to be rebuilt around it.

**Job mode runs exactly one run, in the job's own checkout**, where the main checkout and the working copy are the same directory. It is refused unless `HARNESS_JOB_MODE=1`, which only the workflow sets, because the stall watchdog's `git reset --hard HEAD` would act on whatever checkout it ran in. It turns off the inbox pass, the cleanup sweep, the live-log window and both halves of the machine lane. The lane coordinates the repositories on one machine, and a hosted runner's lane directory would not outlive the job; the other three have nothing to act on in a single-run job. They are forced off after the tunables are read, so no environment value turns them back on.

**`ARCHITECTURE.md` → `## 5. Where the engine is reached — the launch path` gains no site.** Job mode reaches the engine only through the existing `spawn_engine`, so the launch-path inventory is unchanged.

---

## 3. A remote run supervises itself

Once dispatched, nothing on this machine watches, gates, restarts or resumes a remote run. The watcher's reconcile pass, its cap count, its stall watchdog, both halves of its usage gate and the lane's idle release all skip records whose `execution` is `github-actions`. Each concern below is therefore the job's.

### The usage gate

**Decision:** the job runs the watcher's own usage gate on its own teed stream, unchanged, with the machine lane off. **Reason:** rate-limit events describe the account, not the session, so a remote job and a local run on the same subscription each see the same state and pause independently; no coordination between machines is needed. The policy knobs are the same (`USAGE_PAUSE_TRIGGER` and its siblings, mapped from repository variables through the workflow's `env:`). What the job does once the gate has paused the run is *Resuming without the local watcher* below.

### API errors

**Decision:** two failure shapes earn a bounded automatic resume in the job — a session that exits non-zero (`failed`), and a session that self-paused on API overload (a `PAUSE_ACK` nobody requested, recorded as `overload`). Each is resumed from the committed ledger after `REMOTE_AUTO_RESUME_DELAY_SECS` (default 300), at most `REMOTE_AUTO_RESUME_MAX` times per run (default 2), and only while the delay still ends before the job's deadline. The count rides in the bundle across chained jobs and resets on any user action. Past the cap the run stays `failed` or `paused` and notifies. A `failed` run is not auto-resumed when the stall watchdog gave up on it. **Reason:** the `claude` CLI already retries transient errors itself, so what reaches the job is either a longer outage, which a delayed resume helps, or a persistent fault such as a revoked credential, whose cost the cap bounds. **Local runs gain nothing:** local classification is unchanged, because a person is at hand to resume.

### Stalls

**Decision:** the watcher's stall watchdog runs in job mode unchanged — warn, kill, `git reset --hard HEAD` and restart, under `STALL_WARN_SECS`, `STALL_KILL_SECS` and `STALL_MAX_RESTARTS` read from repository variables — with the harness step's `timeout-minutes` as the backstop. **Reason:** on a hosted runner a hung session otherwise burns paid minutes until the job limit. The restart count rides in the bundle.

### When GitHub fails or lags

Gate 12 round 8 in [`development.md`](development.md) met a push GitHub refused once and a `run` job GitHub never started. Each case below is the design for one of them.

**Decision:** `push-branch.sh` retries a push the remote refused, `PUSH_ATTEMPTS` (3) attempts in all, waiting `PUSH_RETRY_DELAY_SECS` (default 5) before the second and three times that before the third. It never retries a push git reports as `! [rejected]` — non-fast-forward or fetch-first, meaning the remote moved — and every path still exits 0. **Reason:** round 8, finding 2: `collect` gave up a review round on one transient refusal. A push that lost a race is the other case, and the rule of record keeps it failing loudly, never fetched, rebased or retried ([`github-run-control.md`](github-run-control.md) → `## 2. A review that requests changes starts a round`, *A push that loses a race fails loudly, and is never fetched, rebased or retried*).

**Decision:** when `remote-run.sh start` or `review` finds its push did not land, it names which case it was: the push was **refused**, or `origin/<branch>` **moved** to a commit that is not an ancestor of `HEAD` (`harness-run-lib.sh` → `hr_push_landed`, which answers `1` and `2`). **Reason:** the earlier `origin/<branch> is not HEAD` told neither case from the other, and they differ in who acts: a moved remote means something else pushed, while a refusal is the remote's own and `push-branch.sh` names it above the failure line.

**Decision:** a `run` job GitHub never started is reported once, by the same workflow run's `collect` job, as the event `not_started`. "Never started" means the `run` job ended `cancelled` or `failure` and the jobs API lists no step for it; GitHub's reason is the job's first check-run annotation, which in round 8 read `The job was not acquired by Runner of type hosted even after multiple attempts`, and the conclusion when none can be read. The run's engine is recovered from the comment its dispatch posted: the trigger's `started` comment means `task`, a `round` comment means `user_review`, and `control`'s reply after a dispatch carries ` engine=<engine>` in its marker. Only the newest such marker authored by `github-actions[bot]`, matched exactly and posted no earlier than `DISPATCH_MARKER_SLACK_SECS` (120) before the run's `createdAt`, counts. The run is then `paused` with `pause_reason: killed` when an older run carries a bundle or its engine is recovered, and `failed` when neither holds; `sync` records it the same way, and the comment names `@sdlc-harness resume` when the engine is recorded, else the Run workflow form (§1, *Working a run from GitHub alone*). Its wording and label are [`github-run-control.md`](github-run-control.md) → `## 5. Lifecycle comments and state labels`. **Reason:** round 8, finding 3: such a run left no bundle, no comment and no label, so nothing said it had not run.

**Decision:** a branch's first run that GitHub never started is resumable with `@sdlc-harness resume` on its issue once the trigger's `started` comment gives it engine `task`. `control` accepts that branch although its tip carries no flow-progress ledger, because `start` commits only the task prompt ([`github-run-control.md`](github-run-control.md) → `## 1. Commands in a comment`, *Who and where*). **Reason:** with no bundle anywhere, `restore` finds no previous bundle and the resumed job starts as the branch's first, which is what the never-started job would have done; nothing is lost or replayed.

**Decision:** a run dispatched by a chained `continue` or by the poller posts no comment, so no engine is recorded for it, and a never-started run of that kind is still resumed from the Run workflow form. **Reason:** recording the engine in the run's title was declined, because `harness <action> <branch>` is matched exactly by the pause poll, `continue`, `poll`, `status` and `stop` (§5).

**Not built:**

- **A generic retry around `gh` calls and dispatches.** A 5xx answer to a `POST` does not say whether the write landed, so a retried dispatch or comment could start two runs or post two comments. The one transient error round 8 met was a push, which the retry above covers.
- **The poller reporting a never-started run.** `collect` already reports it, and two reporters would post two comments for one event. **If `collect` itself never gets a runner, nothing reports the run**: no comment, no label and no notification says it did not run.

### The park-loop guard

**Decision:** its count, `park_loop_cycles`, and the resume baseline `resume_max_question_index` ride in the bundle's `status.json` and are seeded into the next job's registry record. A clear taken locally — `/autonomous-sdlc-harness:branch-resume <branch>` or `/autonomous-sdlc-harness:branch-answer <branch>: …`, each after the user confirms clearing the hold — reaches the job as the input `park_loop_clear`; a `PARK_LOOP_CLEAR` file in the mirror is never read (§1). **Reason:** a remote park and its answer always cross a job boundary — the parked job ends, and the answer arrives in a new one — so a count kept only in the job's registry would reset on every cycle and never trip.

### Notifications

**Decision:** the job sends lifecycle events through `autonomous-notify.sh`, unchanged, with `HARNESS_PUSH_URL` taken from a repository secret; titles carry the repository name rather than a runner path, and each message names the user's next action — `/autonomous-sdlc-harness:branch-answer <branch>` for a park, `/autonomous-sdlc-harness:branch-status <branch>` for a park loop, `/autonomous-sdlc-harness:branch-resume <branch>` for a user or exhausted overload pause, the reset time for a usage pause. For a remote run the same message also names the GitHub route (§1, *Working a run from GitHub alone*), since a maintainer who works only from GitHub has no local command to run. A `parked` detail, for example, reads:

```
answer with /autonomous-sdlc-harness:branch-answer <branch>; or from GitHub: take the question from the run's `harness-state` artifact, then Run workflow on harness-run.yml from the branch `<branch>` (Use workflow from), with action run, branch `<branch>`, engine `<engine>`, resume answer and answers `{"<n>": "<your answer>"}` (docs/remote-execution.md, section 1)
```

With `forge` set to `github`, each lifecycle event the job sends also reaches the run's pull request, else its issue, as a comment naming the next GitHub action, and moves the run's `sdlc-harness: <state>` label. The notification itself and its text are unchanged, so a maintainer gets both. The job also keeps one progress comment on the run's pull request, edited in place as the run passes its four main phases; `execution.progressComments: false` turns it off ([`config.md`](config.md) → `## 5.`). A `budget` continuation sends neither notification nor lifecycle comment, and the progress comment shows a phase, never the continuation ([`github-run-control.md`](github-run-control.md) → `## 5. Lifecycle comments and state labels`).

**Reason:** with the machine off the desktop banner reaches no one, while the push arm works from anywhere. A `budget` pause (the self-pause below) sends no `paused` and the next job no `resumed`: a chained continuation is not an event the user acts on. The `cancelled()` step's `failed` notification is best-effort and nothing relies on it.

### The kill switch and stopping

**Decision:** the remote kill switch is the repository variable `HARNESS_REMOTE_STOP`; any non-empty value makes every job, and every poller tick, exit before launching or dispatching anything. The local `AUTONOMOUS_STOP` still stops the local watcher from dispatching. **Reason:** a job cannot read a file on this machine, and a repository variable is what every job reads.

**Stopping one run** is `remote-run.sh stop <branch>`, which does three things in order. It first always dispatches `action: stop`, a jobless run titled `harness stop <branch>` that GitHub keeps as a stop marker; then cancels every queued, waiting or in-progress run of the branch; then, only when both succeeded, marks the local record `failed`. The marker comes first because it is the only part that reaches a usage-paused run waiting for the poller, which has no job to cancel: `continue` and `poll` dispatch nothing, and enable nothing, for a branch whose newest `harness stop` run is newer than its newest `harness run` run. A user's later dispatch is newer than the marker, so it un-stops the branch with no extra step. A partial stop leaves the record alone and exits non-zero, and running `stop` again is the remedy. Gate 12 round 2 in [`development.md`](development.md) observed a stop on 2026-09-29: the marker was dispatched, the running job was cancelled while its post-steps still saved and uploaded the bundle, and nothing new started.

**Closing or deleting stops a run too.** With `forge` set to `github`, closing the run's issue or pull request, or deleting its branch, stops an unfinished run through the same `remote-run.sh stop`. Which actor counts and which runs are stopped are [`github-run-control.md`](github-run-control.md) → `## 5. Lifecycle comments and state labels`, *Closed or deleted*, and `## 6. Who can act, and pull requests from forks`, *Closing and deleting*. A deleted branch's stop marker is dispatched from GitHub's default branch, its own ref being gone, which is why `harness-run.yml` accepts a `stop` from any ref (§1, *Working a run from GitHub alone*). The poller and a job's `continue` never re-dispatch, or enable the poller for, a branch absent on `origin`: each logs one line and sends nothing (`remote-run.sh` → the header's `continue` and `poll` paragraphs). After a stop, every command reply names the run `stopped` for as long as the branch's newest `harness stop` run is newer than its newest `harness run` run, though a stop leaves the bundle as it was, so the state read from it may still be `paused` — `paused` with `pause_reason: killed` when the cancelled job's bundle still said `running` (§4, **Central state.**; `remote-run.sh` → the header's `A STOPPED RUN IS NAMED` sentence; [`github-run-control.md`](github-run-control.md) → `## 2. A review that requests changes starts a round`, *A run in flight*).

**Decision:** `push-branch.sh` never pushes back a branch this checkout tracks once its remote no longer lists it, and the deletion's stop reports on the run's unfinished pull request as well as on its issue. **Reason:** Gate 12 round 9, findings 1 and 3, in [`development.md`](development.md): the cancelled job's `always()` push re-created a deleted branch, and the pull request GitHub closed with the deletion kept `sdlc-harness: running`. **What it costs:** a deletion that lands between the check and the push is still pushed back, and a local branch reusing a deleted branch's name is not pushed while its stale remote-tracking ref survives; the line `push-branch.sh` prints then names the hand push that publishes it again (`push-branch.sh` → the header's `A BRANCH ITS REMOTE DELETED STAYS DELETED.`; [`github-run-control.md`](github-run-control.md) → `## 5. Lifecycle comments and state labels`, *Closed or deleted*).

**Pausing one run** travels as a workflow run for the same reason. `GITHUB_TOKEN` can neither read nor write repository variables, so the `remote-run.sh pause` that `/autonomous-sdlc-harness:branch-pause` sends dispatches `action: pause`, whose job is skipped and whose run is titled `harness pause <branch>`. The job polls its own workflow's runs every `REMOTE_CONTROL_POLL_SECS` (default 60) for such a run created after a lower bound, `control_polled_at`. The bound starts at this run's own creation for a user's dispatch, or at the previous job's carried `control_polled_at` (in the bundle) for a chained continuation, so a pause sent while the job was queued, or across a chained continuation, is not lost. After each poll it moves to the larger of that start and the epoch taken just before the query less `CONTROL_POLL_OVERLAP_SECS` (300, not a tunable): each poll re-reads the last five minutes, because GitHub's run listing can show a just-created run late, and the bound never drops below where the job started, so a marker from before the job is never re-read. **Reason:** Gate 12 round 8, finding 1, in [`development.md`](development.md): the running job never saw a `harness pause` run sent to it, and did not pause; the likely cause, not confirmed, is a poll that moved the bound past the marker before the listing showed it. `remote-run.sh pause-requested` exits `0` for a pause and `5` for none; any other exit, a usage error's `1` included, is a failed poll, which moves no bound and pauses nothing, never "no pause". Each poll's result is one line in the job log, `job: control poll of '<branch>' since <since> (exit <rc>): …`. On a hit the job drops `PAUSE` into its checkout, the run yields at its next clean checkpoint, and the decision is `stop`. Gate 12 round 2 in [`development.md`](development.md) measured it on 2026-09-29: the running job found a `harness pause` run 47 s after that run's creation, and ended with decision `stop`.

### Runs longer than a job

A GitHub-hosted job is stopped at its limit, and a single session of this repository has run for more than ten hours, so a run must continue across jobs. It does so through the existing pause/resume rather than by splitting the flow: **on a hosted runner the job drops its own `PAUSE`** at a set point, the run yields at its next dispatch boundary, the job pushes and uploads its bundle, and `continue` re-dispatches with `resume: pause`; the next job resumes from the pushed ledger.

**The point is sized from a measurement**, recorded in `harness-run.yml`'s header: the longest single sub-agent dispatch in this repository's own main-checkout stream logs, taken on 2026-09-25 over 17 logs with this command from the repository root:

```
jq -n 'def e: .[0:19]+"Z"|fromdateiso8601; reduce inputs as $v ({f:null,t:null,s:{},d:[]}; (if .f!=input_filename then .f=input_filename|.t=null|.s={} else . end) | .t=($v.timestamp//.t) | .t as $t | if $v.type=="assistant" then reduce ($v.message.content[]? | objects | select(.type=="tool_use" and (.name=="Agent" or .name=="Task"))) as $u (.; .s[$u.id]=$t) elif $v.type=="user" then reduce ($v.message.content[]? | objects | select(.type=="tool_result")) as $r (.; if .s[$r.tool_use_id] then .d+=[($t|e)-(.s[$r.tool_use_id]|e)] | del(.s[$r.tool_use_id]) else . end) else . end) | .d|sort|length as $n|{dispatches:$n,longest_min:(.[-1]/60),p95_min:(.[(($n*95+99)/100|floor)-1]/60)}' harness-runs/autonomous_logs/*.stream.jsonl
```

It found 957 sub-agent dispatches, the longest 73.05 minutes and the 95th percentile 15.5 minutes. The margin is 73.05 rounded up to the next 15 (75) plus 15 for the pause bookkeeping and the post-steps: 90 minutes. The hosted step timeout is the 360-minute hosted job limit less a 30-minute allowance for the steps around it, 330 minutes, so **the default self-pause is 240 minutes after the job started**, floored at 60 when a smaller step timeout is configured. The repository variable `HARNESS_SELF_PAUSE_AFTER_MINUTES` overrides it, and `HARNESS_STEP_TIMEOUT_MINUTES` overrides the step timeout. Gate 12 round 2 in [`development.md`](development.md) observed the self-pause on 2026-09-29 with `HARNESS_SELF_PAUSE_AFTER_MINUTES=5`: the job dropped `PAUSE` at exactly 300 s, reason `budget`, and a new job was chained.

**The backstop is the step timeout.** A dispatch that overruns the window left after the self-pause is killed by it, and the later `always()` and `!cancelled()` steps still push, upload and re-dispatch. Because job mode wrote decision `continue` at the start, the continuation resumes from the pushed ledger: an overrun costs its in-flight unit, never the run.

**The runner wait is logged.** The job logs how long GitHub took to start it, `HARNESS_JOB_STARTED_EPOCH` less this run's `createdAt`, and a wait of at least `RUNNER_WAIT_NOTE_SECS` (300) is noted on the `resumed` comment the job posts as it starts, never on a later automatic resume's. A re-run attempt keeps the run's first `createdAt`, so its wait is not measured and its `resumed` comment carries no note. The budget already starts at `HARNESS_JOB_STARTED_EPOCH`, so a queue wait costs none of it. **Reason:** Gate 12 round 8, finding 6, suggested fix 5 (queue-time awareness), in [`development.md`](development.md). The comment's note reads `GitHub took <n> minutes to start this job, so nothing moved until then.` (`autonomous-watcher.sh` → the header's `THE RUNNER WAIT` bullet).

**On a self-hosted runner the self-pause is disabled, not merely never reached.** The workflow leaves `REMOTE_SELF_PAUSE_AFTER_SECS` unset there, since the self-hosted job limit is five days and chaining a job that can simply keep running only adds setup cost. The step timeout defaults to that limit less the same allowance, and is the backstop there as on hosted. The job tells the two kinds apart at run time from `runner.environment`, because `HARNESS_RUNNER` may also name a hosted label.

**The chain limit.** Every automatic re-dispatch increments `chain`, read from the bundle rather than from any input. Once `chain + 1` would exceed `HARNESS_MAX_CHAIN` (default 24), the job stops chaining and notifies `failed`, which also bounds a job that is killed every time. A user's own dispatch resets `chain` to 0.

**Planning drafts cross the job boundary in the bundle.** Before this change, a pause during planning lost the untracked planning drafts, because the next job starts in a fresh checkout. The saved walk was then unusable and the writer re-ran from scratch; in Gate 12 round 2 that happened in three consecutive jobs. **Decision:** the bundle carries the untracked planning drafts, and a job restore puts them back, never over a committed file and only from a bundle of the branch's current lineage (§4, **Central state.**). **Reason:** the alternative, committing the drafts before the job yields, would put unconverged plans into branch history, and it would split the meaning of "converged and committed" the plan phase relies on across the ledger, the walker's unusable-walk check and the plugin's resume overrides, all for a defect only a remote run has. It would expose nothing less, since a pushed draft is as public as an artifact. **What it costs:** the drafts are readable wherever the artifact is (§11), and they expire with the bundle (§4). **Scope:** only planning is carried, because only planning has a saved walk; a review index a pause interrupts before its commit is regenerated rather than resumed. **Observed:** Gate 12 round 3 in [`development.md`](development.md), on 2026-09-29 with CLI 0.4.2, saw a job that paused during planning followed by one whose restore logged `placed 6 planning file(s) for feat_invoices; kept 0 the checkout already carries`, and whose session continued the saved walk with the plan reviewers rather than writing the plan again.

### Resuming without the local watcher

When the usage gate pauses a run, the job has two ways to resume it, and chooses per pause:

- **Wait in the job** when the reset falls before the job's deadline and either the runner is self-hosted, or the wait is at most `REMOTE_WAIT_MAX_SECS` (default 600). The gate's own resume then relaunches the run in the same job. A self-hosted job's wait costs nothing; a hosted job bills for every minute it waits, but a short wait is still cheaper than a new job's setup plus the poller's latency. A pause whose recorded reset time was lost is first given the gate's one-hour fallback, so the choice is made on that time — on a hosted runner at the default, the poller. Every in-job wait, self-hosted included, is bounded: once it is still paused `REMOTE_WAIT_MAX_SECS` past the gate's last chance to resume it (the later of the reset and its own start, plus the gate's check interval and the job's poll interval, 75 seconds at the defaults), the job ends with decision `wait-poller` and one notification naming `/autonomous-sdlc-harness:branch-resume` as the way on.
- **Hand it to the poller** otherwise, or when an in-job wait reaches that bound: the job ends with decision `wait-poller`, so billing stops with it, and `continue` enables `harness-resume.yml`. The poller is a `schedule` workflow, every 30 minutes as shipped, whose one step is `remote-run.sh poll`: it downloads each branch's latest bundle, dispatches `resume: pause` for every usage-paused run whose recorded reset has passed, and **disables itself** once no run is left waiting. A scheduled tick is GitHub's to deliver: Gate 12 round 9 saw none in about 2.5 hours on a workflow record GitHub reused after the file was deleted and added again (§6), and a tick can always be started by hand:

  ```
  gh workflow run harness-resume.yml
  ```

  A job that ends on a usage pause uploads its bundle before it enables the poller, so a tick that disables re-lists the runs once and re-enables the poller when a still-running job's usage-paused bundle appeared meanwhile; such a run is never dispatched until its run has completed. An ordinary running job carries no bundle until its final steps and never keeps the poller enabled. Ticks are therefore paid only while something is paused. On a private repository each tick is billed at least one minute while the poller is enabled — up to 48 minutes a day at the shipped interval — and a run resumes up to one interval after its reset; on a public repository the ticks cost nothing. The interval is the adopter's to edit in the workflow file.

**A re-dispatch that keeps failing is bounded.** A failed dispatch is retried on later ticks until `HARNESS_POLL_MAX_DISPATCH_FAILURES` dispatches of the same paused run have failed (default 3, counting the first; the same variable bounds failed downloads of a bundle, counted apart, below), or until the recorded reset is more than `HARNESS_POLL_GIVE_UP_AFTER_MINUTES` (default 360) in the past, whichever comes first. The poller then sends one `paused` notification naming `gh`'s error and `/autonomous-sdlc-harness:branch-resume <branch>`, and stops counting that branch as waiting, so it can disable itself. The count travels from one tick to the next in the `harness-poll-state` artifact, kept 7 days. A new run of the branch starts the count again. If the artifact is lost, the deadline bound alone still ends the retries.

**A bundle that cannot be downloaded is waited on, and bounded the same way.** A finished run whose bundle GitHub lists but `gh run download` cannot fetch, or whose artifact list cannot be read, counts as waiting, so the poller stays enabled for it. `HARNESS_POLL_MAX_DISPATCH_FAILURES` consecutive failed downloads of that run's bundle — counted apart from failed dispatches, and reset by a later successful download — end it: the poller sends one push notification, `bundle_unreadable`, naming `gh`'s error, and sets no label and posts no comment, because only the download failed and the run's own state is unknown. A finished run whose job GitHub never started is one log line and not waiting, because its own `collect` job reports it (*When GitHub fails or lags* below).

**The disable is verified; the enable is not observed.** Gate 12 round 2 in [`development.md`](development.md) confirmed on 2026-09-29 that `GITHUB_TOKEN` with `actions: write` disables the poller: a hand-started tick logged `poll: no branch is waiting; disabled harness-resume.yml`, and the workflow's state became `disabled_manually`. No job in that round ended on a usage pause, so the enable was never reached (§6). If the enable fails, the job's `paused` notification says auto-resume is unavailable, and the run waits for `/autonomous-sdlc-harness:branch-resume`. It never falls back on the local watcher.

**Not built:** an external scheduler calling `repository_dispatch` at the exact reset time adds a dependency outside GitHub, and an environment wait timer is fixed per environment rather than per run. A `schedule` trigger cannot serve as a one-shot timer either: it is a recurring cron read from the default branch, and scheduling a specific time would mean committing a cron line to a protected branch.

**The pause note belongs to the run that wrote it.** `PAUSE_PROGRESS.md` travels in the bundle (§4, **Central state.**), so a resumed job finds the previous job's note. In job mode, a carried `PAUSE_PROGRESS.md` is kept only when the job's `resume` is `pause`, the restored `remote_status.json` says `status: paused`, and its `engine` equals the job's engine. In every other case — a fresh launch (`resume none`), an answer resume (`resume answer`), a pause resume whose previous job did not pause (a stop or a kill), or a different engine — it is moved aside, never deleted, to `<state_dir>/autonomous_logs/remote_superseded/<epoch>[-<n>]/PAUSE_PROGRESS.md`. A pause resume whose previous job did not pause, or paused for a different engine, is re-launched with a clause saying there is no pause note, whether or not a note was carried. **Reason:** Gate 12 round 6, finding 8, in [`development.md`](development.md) → Gate 12 → Round 6: a resume after a stop launched the user-review engine as a resume from a pause, with the task engine's stale note (`autonomous-watcher.sh` → the header's `THE PAUSE NOTE` bullet).

### The interactive-test phase

**Decision:** a remote run skips the interactive-test phase — Phase E of a task run, Phase QA (`R4`) of a user-review round — and still ends at "ready for review". **Reason:** the job can run none of what the phase needs. The runner has no display, and `cli/templates/repo/mcp.json` declares both browser servers (`playwright`, `chrome-devtools`) with no headless flag. The job installs none of the application's own dependencies beyond `setup-worktree.sh`, so `commands.devServer` may not start. And the gitignored `qa.credentialsPath` file is not in the job, so every auth-gated test would report `blocked`. The UI-test plan is still written, so the local run has a plan to execute. A docs run has no such phase and is unaffected.

**What the run records.** With `phases.qa` true, job mode adds one clause to the task and `user_review` launch prompts (`autonomous-watcher.sh` → the header's `JOB MODE` block), and a local launch gets none. From it:

- the ledger's `## Run mode` block carries `remote-skipped: qa`, and the phase's entry (`E`, or `R4`) is seeded `[-]`, while a task run's UI-test plan entry `P2` still runs and flips `[x]`. The line's contract is `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3`. It binds this run only: a later round of the same branch run locally re-records the line and is not excluded;
- the Done summary's QA line reads `QA (Phase E): skipped — this run executed on GitHub Actions …` (`QA (Phase QA): … this round …` for a user-review round) and ends by naming the local route. Each autonomous fork's `## Override K — remote-job QA skip (autonomous fork only)` owns that wording;
- the single `completed` notification's detail reads `ready for review; interactive tests skipped (unsupported on GitHub Actions): run /autonomous-sdlc-harness:branch-qa-test <branch> locally`. No second event is sent.

`doctor`'s `remote-execution` check warns whenever remote execution is on and `phases.qa` is true, so a plain `doctor`, `doctor --check-github` and the job's own `Preflight with doctor` step all print it. It is a `warn`, so it fails none of them.

**The local route.** Run `/autonomous-sdlc-harness:branch-qa-test <branch>` before merging, either in the mirror after `remote-run.sh sync` or in any checkout of the pushed branch.

**Not built:** running the phase in the job. It needs three things: the browser servers launched headless in job mode (or wrapped in `xvfb-run`), a step that installs the adopter application's own dependencies, and a secret written to `qa.credentialsPath`. This repository runs with `phases.qa` false, so none of the three could be exercised here, and each would ship unverified.

---

## 4. What the local design assumed, and what changed

`ARCHITECTURE.md` → `## 7. The seam: what an adapter would have to carry` lists what the outer loop assumes, and some of it assumes one long-lived machine.

**Liveness.** Locally it comes from a process probe; a remote run has no local process. A remote record carries an empty `pid`, and the registry is its only liveness source: the watcher's vanished-process reconcile, cap count and stall watchdog skip it, and `restart-watcher.sh` lists it as `remote (not affected by a restart)` instead of counting it as in flight, so a restart is never refused on its account.

**Central state.** Locally the registry, logs and notifications live under the main checkout. A job's registry is its checkout's own, gitignored and discarded with the job. What must cross a job boundary, and what the user may want to read, is the **state bundle** every job uploads as the artifact `harness-state`: `status.json` (the job's record reduced to a fixed schema, with its decision and the counters above), the branch's clarification directory, `PAUSE_PROGRESS.md`, the walker state, the readable run log, and, under `planning/`, whichever of the branch's planning drafts exist under `<stateDir>`: `story_plans/<branch>_story_plan.md`, `task_plans/<branch>/`, `ui_test_plans/<branch>_ui_test_plan.md`, `ui_test_plans/<branch>/`, `task_plan_reviews/<branch>/`, `business_parity_reviews/<branch>/`, `architecture_reviews/<branch>/` and `ui_test_plan_reviews/<branch>/` (`harness-run-lib.sh` → `hr_remote_planning_paths`). A **job** restore places each carried draft only where the checkout has nothing at that path, so a committed copy always wins, and `restore` prints `placed <n> planning file(s) …; kept <m> the checkout already carries`. **A job restore takes state only from the branch's current lineage.** Gate 12 round 5, finding 1, in [`development.md`](development.md) → Gate 12 → Round 5: a run on a reused branch name restored the bundle of an earlier, deleted branch's run and committed its inherited planning drafts as its own plan. **Decision:** a finished `harness run <branch>` run is a restore candidate only when its `headSha` is one of the commits `git rev-list refs/remotes/origin/<defaultBranch>..HEAD` lists in the job's checkout; a run outside that list, or with no `headSha`, is dropped before the walk, and `restore` prints `skipped <n> finished run(s) of <branch> from before its current lineage`. **Reason:** `headSha` is a stamp GitHub already records on every run, so no bundle needs one; a `createdAt` bound compares the committing machine's clock with GitHub's, and one running fast drops a run's own bundle; a fork-point bound admits an earlier lineage wherever the default branch was reset to an older commit, as Gate 12's standing repository is between rounds. **Every own-lineage run is a candidate** — a resume after a pause, a chain of jobs, a user-review round and `--resume answer` alike — because each is dispatched on a tip that descends from the branch's first own commit: the job checks out with `fetch-depth: 0`, `push-branch.sh` never forces and `refresh-branch.sh` merges rather than rebases. A `--resume answer` that finds no bundle refuses, naming the current lineage. **When the list cannot be formed** — the configuration unreadable, `origin/<defaultBranch>` absent, or `HEAD` carrying no commit beyond it — selection is unbounded, as before the bound, and `restore` prints `the lineage of <branch> is not bounded (<reason>); every finished run of it is a candidate`. **Not bounded:** `sync`, `fetch`, `status`, `list` and `review` read the branch's newest run, which for a recreated branch is its own once GitHub lists it; `restore` is the one place here that treats an older run as authoritative. A **mirror** restore (`sync`) places none: an untracked draft left in the mirror would make its later fast-forward to `origin/<branch>` refuse, because the draft's own convergence commit adds the same path. **Answered pairs are archived from what the session launched with.** On every exit but a pause, a job archives into `answered/` every top-level answered pair present when its session launched (`launch_answered_set`), together with the set a park resume named (`resumed_for_index`), so a pair answered in one job and read by a session in a later one is archived there rather than taken for a new park. **Reason:** Gate 12 round 6, finding 1, in [`development.md`](development.md) → Gate 12 → Round 6: a park answered, then paused, then resumed ended `parked`, because the archive read only `resumed_for_index`, which a job's discarded registry had lost. The bundle carries neither field, and needs neither: each job's launch re-derives `launch_answered_set` from the clarification directory the bundle restored (`autonomous-watcher.sh` → the registry field table's `launch_answered_set` row). The bundle schema stays `1`. `remote-run.sh sync` downloads the newest bundle into the mirror and the local record, on the user's request only. A job that ended without uploading one — killed before the upload, or finished while its bundle still said `running` — syncs as `paused` with `pause_reason: killed`, not `failed`, because a `failed` record has no resume path while the ledger on the branch is intact; `/autonomous-sdlc-harness:branch-resume` continues from it. A run whose job GitHub never started syncs the same way when an older run carries a bundle or its dispatch's comment records its engine. For a branch's first run there is no ledger yet: `restore` finds no previous bundle and the resumed job starts as the branch's first (§3, *When GitHub fails or lags*). A cancelled job's post-steps still upload its bundle, and Gate 12 round 2 in [`development.md`](development.md) observed on 2026-09-29 a later resume restoring the bundle of a job `remote-run.sh stop` had cancelled. A run with no bundle anywhere syncs as `failed`, and re-dropping the artifact is the recovery, unless its job GitHub never started and its engine is recovered, as above.

**The bundle expires.** It lives as long as the repository's artifact retention — 90 days by default, configurable from 1 to 400 — and `harness-run.yml` uploads it with `retention-days: 400`, so the repository's setting is the bound (the header's `WHY retention-days IS SET`). An expired bundle takes with it the park-loop, auto-resume and stall counts, the clarification history and any planning drafts not yet committed; the ledger on the branch is untouched, and a planning phase whose drafts were lost runs its writer again from the committed ledger. `remote-run.sh` tells an expired bundle from a missing one, and never falls back to an older copy, which would be staler state:

- `restore` under `--resume answer` refuses with exit 2, naming the run and its expiry date and pointing at `/autonomous-sdlc-harness:branch-resume`; under `--resume none` or `pause` the job continues from the committed ledger and says so in a `::warning::` line naming what was lost.
- `sync` records the run `paused` with `pause_reason: expired`, and `remote_detail` carries the way on — resume from the committed ledger with `/autonomous-sdlc-harness:branch-resume`, or re-drop the task. A `parked`, `park_loop` or `paused` record already synced is re-checked, so a bundle that expired after its sync flips it the same way.
- `/autonomous-sdlc-harness:branch-status` shows the expired line `remote-run.sh status` prints, and `/autonomous-sdlc-harness:branch-answer` treats an `expired` record as no candidate and reports that way on instead of writing an answer.

`doctor --check-github` reads the repository's retention and warns below 30 days, since a parked run waits on a person and 30 days covers an ordinary absence; a caller without admin access to the setting gets a note that it was not checked ([`cli.md`](cli.md)).

**The usage gate.** Locally it reads the local `stream.jsonl`. The job runs the same gate on its own stream (§3).

**Retrieval.** The docs-retrieval runtime and model cache under `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/` is empty in every new job. When retrieval applies, the job restores it with `actions/cache/restore`, keyed on the runner's OS and the rendered CLI version, and `init` installs only what is missing. A cache saved on a feature branch cannot be read by its siblings, so a run job never saves one; `remote-run.sh warm` dispatches `action: warm` on GitHub's own default branch, whose job only provisions and saves the cache every branch can restore. A job restores and provisions the TypeScript backend only: it installs no Python package, fetches no Python weights and starts no Postgres. So with `docs.retrievalBackend: "python"` the job's `Preflight with doctor` step fails `retrieval-python-dependencies`, `retrieval-python-model-cache` and `retrieval-python-index`, because the job has no `harness-docs-retrieval` on `PATH`. Like any check `doctor --remote-job` fails, that stops the job before launch (**The permission profile.** below), so no remote run starts. The Python backend is a local-machine option, and a repository that runs remote jobs keeps the default ([`retrieval.md`](retrieval.md) → `## Turning on the Python backend`).

**Plugin install, and its pin.** The job installs exactly the version its workflow names. Its `Install the pinned plugin` step clones the marketplace repository named in the committed `.claude/settings.json` at the release tag `autonomous-sdlc-harness--v<version>`, where `<version>` is the workflow's `HARNESS_CLI_VERSION`, into `$RUNNER_TEMP/harness-marketplace`. It adds the clone as a directory-sourced marketplace with `claude plugin marketplace add ./harness-marketplace`, then runs `claude plugin install` from it. So the pin is now a request, and the version check after it is its guard. The job refuses before installing when the tag is absent, and refuses to run when `claude plugin list --json` reports a version other than the pinned one. Both refusals name the upgrade route (§7, *Upgrading*). The clone is the plugin's runtime root and the runner's plugin cache is its install root ([`development.md`](development.md) → `## 1. Source types and the plugin root`). `init --plugin-root-entries` grants both roots and `doctor --remote-job` grades both (**The permission profile.** below). Two designs were not taken. A native ref, meaning a ref in the marketplace source or a version on install, has not been measured to exist in the agent-runner CLI (§6). A reusable workflow the adopter calls would pin nothing by itself, because the called workflow still has to install the plugin, and it would move the adopter's tuning into inputs.

**Guards.** Unchanged in the job. The plugin's `PreToolUse` guards load with the installed plugin, and the job's `init` points `core.hooksPath` at the repository's hooks directory, so the pre-push hook refuses a protected branch there as it does locally. `push-branch.sh` still refuses protected branches, and the flow still never merges.

**The permission profile.** `.claude/settings.autonomous.json` carries one checkout's absolute paths, and `init` writes it into the managed `.gitignore` block, so a job's checkout carries none until the job makes one. It runs `npx autonomous-sdlc-harness@<rendered version> init --plugin-root-entries`, which generates the profile for the job's own checkout path, adds a `Read` grant at the plugin's runtime root — required there even where the runtime root is also the install root, as it is for every GitHub-sourced marketplace — with, while `phases.qa` is true, the `Bash` entries for the interactive-test phase's helper scripts, and adds every resolved plugin root to `permissions.additionalDirectories`; the step fails if `init` changed any tracked file. In job mode the watcher repeats each of those roots as an `--add-dir` at launch (§2). `doctor --remote-job` then runs as a preflight, so any check it fails stops the job before launch rather than mid-run; under that option `profile-paths`, `plugin-permissions` and `profile-tracked` fail where a plain `doctor` only warns.

**A profile an earlier release committed is not replaced.** `init` is create-if-absent, so the job's `init` keeps a tracked profile carrying another machine's paths, and the step that runs it refuses a rewrite of a tracked file. `profile-tracked` fails the preflight on it, and the remedy is the untrack in §7 step 3.

**What a profile with no plugin-root grant cost — measured.** Gate 12 round 1, on 2026-09-28, ran three jobs on a GitHub-hosted runner (runs `36425634480`, `36426447207` and `36428382006`) under a profile carrying no plugin-root grant: every `Read` of the plugin's instruction files was refused, and `cat` and `ls` there were refused as *"outside the allowed working directory"* (`cli/src/doctor/checks.ts` → the doc comment on `PLUGIN_PERMISSIONS_CHECK`). Gate 12 round 2, on 2026-09-29 with CLI 0.4.1 and the grant above, ran one job that took a task from planning to "branch ready for review", which no session does without reading the plugin's instruction files. The preflight's verbatim output lines from that round were not carried into this repository; Gate 12 round 3, on 2026-09-29 with CLI 0.4.2, recorded them, `PASS profile-paths`, `PASS profile-tracked` and `PASS plugin-permissions`, under Gate 12 in [`development.md`](development.md).

Entries an adopter added to their own machine's profile do not travel; §7 says what becomes of them.

**The walker state.** `<state_dir>/.flow_walker_state` stays gitignored and is never committed. It is carried in the bundle as `flow_walker_state`, without its dot, because `actions/upload-artifact` skips hidden files by default, and a job restore puts it back under its dotted name; a mirror restore does not place it. The walk it records is usable in the next job because the planning drafts it walked travel in the same bundle (**Central state.** above). `<state_dir>/.dispatch_counter` needs nothing, because every flow resets it on every session entry.

**Push frequency — a finding, not a change.** The prompt asked whether pushing only where each flow calls `push-branch.sh` is often enough on a runner that can be killed. Re-derive the answer from the repository root:

```
grep -n "Post-commit push" plugin/instructions/plan_orchestration_instructions_autonomous.md
```

The paragraph it reaches states that in the autonomous forks **every** commit point is followed by a push: each `committer` dispatch carries `push: true`, and each direct commit is followed by a single `push-branch.sh` call. That push is best-effort. So a killed job loses at most its in-flight unit's uncommitted work and any commit whose push failed, and the job's final `push-branch.sh` under `always()` retries the second whenever that step still runs, unless origin no longer has the branch, which that push then leaves deleted (§3, *Closing or deleting stops a run too*). Nothing was added to the flows.

**The task offer — checked, unchanged.** Answer 1 of `cli/templates/claude/harness-task-offer.md` describes the drop as *"Queued for the harness's run watcher"*, and its caveat says the command *"queues the drop and does not launch the run — the watcher does"*. Both still hold with remote on: the watcher still consumes the drop and is what dispatches it. The job itself never reads the offer.

---

## 5. The seam, and what stays open

**The `workflow_dispatch` inputs are the seam, and the trigger and control halves have both plugged into it.** A run is started, continued, paused or stopped by one dispatch of `harness-run.yml`, whatever sends it. On the shell side `remote-run.sh dispatch` is still the one producer: `remote-run.sh start`, which the issue trigger calls ([`github-issue-trigger.md`](github-issue-trigger.md)), sends the same inputs through it, and so does `remote-run.sh control`, which `harness-control.yml` calls ([`github-run-control.md`](github-run-control.md)), through the existing `dispatch`, `pause`, `stop` and `review` verbs. No input was added for either: the issue a run was started from is read from the task prompt's provenance line on the branch, and the pull request is looked up when a comment is posted.

| Input | Values | Sent with |
|---|---|---|
| `action` | `run` \| `pause` \| `warm` \| `stop` | every dispatch. Only `run` and `warm` start a job; `pause` and `stop` are jobless marker runs |
| `branch` | the run's branch; for `warm`, GitHub's default branch | every dispatch |
| `engine` | `task` \| `user_review` \| `docs` | `action: run` |
| `resume` | `none` \| `answer` \| `pause` | `action: run` |
| `answers` | a JSON object `{"<n>": "<answer text>"}` | `resume: answer` |
| `park_loop_clear` | `true` clears the restored park-loop count | a resume after a local clear |
| `chain` | automatic dispatches since the last user action | `action: run`; 0 from a user |

The workflow's `run-name` is `harness <action> <branch>`, and the job's pause poll, `continue` and `poll` match runs by that title, so its spelling is part of the contract.

**The draft pull request is the job's, not the flow's.** `push-branch.sh` still opens no pull request, and the flow runs unchanged wherever it executes. With `forge` set to `github`, the run workflow's `Open the draft pull request` step opens a draft pull request when the run starts, and its `deliver` step marks it ready and posts `completed` on it and on the source issue once a completed run's branch is pushed ([`github-run-control.md`](github-run-control.md) → `## 4. The draft pull request`); without it, none is opened and a run ends at a pushed branch. `execution.target` still names where the job runs, and `forge` names the forge it reports to.

**What stays open**: adapters for forges beyond GitHub, and running the interactive-test phase remotely (`ROADMAP.md`'s *Cloud QA* row; §3, *The interactive-test phase*).

---

## 6. What is not verified here

The design rests on these GitHub behaviours, each exposed as a tunable or a degradable path so that a wrong one costs a setting rather than the design. Gate 12 round 2 (2026-09-29, CLI 0.4.1) verified the rows moved to *Verified in Gate 12 round 2* below against a real repository, round 3 (2026-09-29, CLI 0.4.2) those moved to *Verified in Gate 12 round 3*, round 4 (2026-09-30, the pinned plugin install before its release) the one moved to *Verified in Gate 12 round 4*, and round 8 (2026-10-05 to 2026-10-06, CLI 0.6.2) the two moved to *Verified in Gate 12 round 8*; the rest remain as stated. Gate 12 in [`development.md`](development.md) → `## 5. Verifying a change` is the hand-run that records each against a real repository. Every source below is **carried from the task prompt's research, retrieved 2026-09-24**, and was not re-fetched here, except where the row says otherwise.

| Behaviour | What rests on it | Source | If it is wrong |
|---|---|---|---|
| A GitHub-hosted job is stopped at 6 hours, a self-hosted one at 5 days | The 360- and 7200-minute limits the time budget is computed from | https://docs.github.com/en/actions/reference/limits, retrieved 2026-09-24 (carried). Gate 12 round 2: not measured: the longest job was 30 m 35 s | `HARNESS_STEP_TIMEOUT_MINUTES` and `HARNESS_SELF_PAUSE_AFTER_MINUTES` re-size the budget |
| `gh workflow enable` succeeds under `GITHUB_TOKEN` with `actions: write` | The poller enabling on a usage pause | None: the prompt's research left it unverified, with no source. Gate 12 round 2: not observed: no job ended on a usage pause | The `paused` notification says auto-resume is unavailable, and the run waits for `/autonomous-sdlc-harness:branch-resume` (§3) |
| An `actions/upload-artifact` artifact, at the major the run workflow pins (its header's `# ACTION PINS.` block), is listed by `repos/{owner}/{repo}/actions/runs/<id>/artifacts` and downloadable with `gh run download` while its run is still in progress | The poller's post-disable re-check, which counts a still-running job carrying a usage-paused bundle as waiting (§3) | None retrieved: where to check is the `actions/upload-artifact` README, https://github.com/actions/upload-artifact (not retrieved). Gate 12 round 2: not observed: no job ended on a usage pause | The listing shows no in-progress artifact, the re-check finds nothing, and a job that enables the poller while a tick is disabling it can still be left with no poller, exactly as before the re-check existed; it then waits for `/autonomous-sdlc-harness:branch-resume`. Gate 12 observation (v) records which it is |
| The agent-runner CLI offers no ref and no version when it adds a marketplace or installs a plugin, so the pin is a clone of the release tag | The clone-and-check install (§4), which rests on none of the forms *The plugin-install probe* below lists as not established | Measured, not retrieved: `bash scripts/probe-plugin-cli.sh` on Claude Code 2.1.284, 2026-09-29; the help lines are quoted under *The plugin-install probe* below | A later CLI that accepts a ref or a version could replace the clone, and the version check still holds |
| On a self-hosted runner whose home persists across jobs, an earlier job's marketplace entry, which names a `$RUNNER_TEMP` clone that no longer exists, does not disturb the next job's add and install | The install step on such a runner (§8) | None: not measured. Gate 12 observation (vii), the self-hosted runner, has not run | Not known which of the add and the install then fails; whatever installs, the version check refuses a version other than the pinned one |
| A cache saved on one branch cannot be restored by a sibling | `remote-run.sh warm` saving the retrieval cache on the default branch | https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching, retrieved 2026-09-24 (carried) | A feature branch could save its own cache; `warm` stays harmless |
| A `schedule` trigger is a recurring cron on the default branch, at most every 5 minutes, often late and sometimes dropped, and disabled in a public repository after 60 days without activity | The poller's shape, and its tolerance for a late or dropped tick | https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows, retrieved 2026-09-24 (carried) | A late tick delays a resume by one interval; the self-disabling poller is re-enabled by the next pausing job |
| A `schedule` workflow whose record GitHub reused, `deleted` and then `active` again on the same path, ticks on its schedule | The poller resuming a usage-paused run (§3, *Resuming without the local watcher*) | Not verified. Gate 12 round 9, finding 4, in [`development.md`](development.md): record `370113793` came back `active` after round 8 deleted its file, and no scheduled run followed in about 2.5 hours, while a hand dispatch ran. The cause is unknown: GitHub not re-registering the schedule, or its best-effort delays. Gate 12 (xiv)'s setup records it next round | A usage-paused run waits until the poller is dispatched by hand or until `/autonomous-sdlc-harness:branch-resume` |
| A `workflow_dispatch` inputs payload is limited to 65,535 characters | `dispatch --resume answer` refusing a larger payload | https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#onworkflow_dispatchinputs, quoted in `remote-run.sh` → `REMOTE_INPUT_PAYLOAD_MAX`; retrieval date not recorded there | A different limit moves the refusal point; the constant is the one place to change |
| An environment wait timer is fixed per environment and may need a paid plan on a private repository | The decision not to build one (§3) | https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment, retrieved 2026-09-24 (carried) | Nothing built depends on it |
| A `permissions.allow` or `permissions.additionalDirectories` entry in the committed `.claude/settings.json` applies to the job's session | Nothing: the job's grants come from the profile it generates and the watcher's launch flags (§4) | Measured negative, not retrieved: in Gate 12 round 1 Run 3 (run `36428382006`, 2026-09-28) entries there naming a path outside the checkout did not apply in the job. Not measured for an entry that names no path | Nothing changes: the job's grants already come from its own profile and launch flags. Why the Run 3 entries did not apply was not established |
| A `workflow_dispatch` run's `headSha` in `gh run list` is the commit the dispatched ref pointed at when it was dispatched | `restore`'s lineage bound (§4, **Central state.**), and the trigger comment's run lookup | Not retrieved in this branch, because unattended runs have no web access; Gate 12 (xiii) leg (d) in [`development.md`](development.md) records it | An own-lineage run is excluded, so `restore` logs a first job, or `--resume answer` refuses naming the lineage, and the trigger comments the filtered run list. Neither outcome restores another lineage's state |
| A `harness-resume.yml` poller dispatch names `github-actions[bot]` as `actor` and `triggering_actor` | The run job's gate admitting the poller's dispatches (§11, *Who can spend the credential*) | The 2026-10-05 measurement of the other routes, [`team-accounts-research.md`](team-accounts-research.md) → `### The repository facts the options rest on`, *Who a run names*: the trigger, the comment commands and `collect`'s next round each named `github-actions[bot]`, and Gate 12 round 8 leg (e) observed a `continue` chain doing the same (below). Round 8's observation (xv) leg (f) did not observe a poller dispatch | A poller dispatch is refused with the gate's `::error::` line, and the run waits for its owner's manual dispatch; the gate's bot exemption must then widen |
| A `run` job no runner acquired lists no steps in the jobs API, and carries its reason as a check-run annotation | Recognising a run whose job GitHub never started (§3, *When GitHub fails or lags*) | Gate 12 round 8, finding 3, in [`development.md`](development.md): one such job, whose annotation read `The job was not acquired by Runner of type hosted even after multiple attempts`. One observation, not a documented contract | Such a run reads as killed with today's detail, and `resume` falls back to the Run workflow form |
| git prints `! [rejected]` for a push that lost a race, and `! [remote rejected]` or no ref line for a refusal on the server's side | `push-branch.sh` retrying a refused push and never a lost race (§3, *When GitHub fails or lags*) | None retrieved, and not a documented contract: `push-branch.sh` → the header's `REPRO` block reproduces both cases against a local bare repository (*refused once*, *remote moved*) | A lost race is retried and fails again, three attempts in all, still exiting 0 and still never forcing |

### The plugin-install probe

On 2026-09-29, `bash scripts/probe-plugin-cli.sh`, run from the repository root, printed `2.1.284 (Claude Code)` for `claude --version`. It then ran `claude plugin --help`, `claude plugin marketplace --help`, `claude plugin marketplace add --help` and `claude plugin install --help`, each exiting 0. The relevant lines follow, as printed. First, two entries of `claude plugin --help`'s command list:

```
  install|i [options] <plugin>         Install a plugin from available
                                       marketplaces (use plugin@marketplace for
                                       specific marketplace)
  tag [options] [path]                 Create a {name}--v{version} git tag for a
                                       plugin release, validating that
                                       plugin.json and any enclosing marketplace
                                       entry agree
```

Then `claude plugin marketplace add --help`, in full:

```
Usage: claude plugin marketplace add [options] <source>

Add a marketplace from a URL, path, or GitHub repo

Options:
  --claudeai           Add the marketplace of this name that claude.ai hosts for
                       you, by its listed name or its local name (see: claude
                       plugin marketplace list)
  -h, --help           Display help for command
  --scope <scope>      Where to declare the marketplace: user (default),
                       project, or local
  --sparse <paths...>  Limit checkout to specific directories via git
                       sparse-checkout (for monorepos). Example: --sparse
                       .claude-plugin plugins
```

Then the usage line of `claude plugin install --help`:

```
Usage: claude plugin install|i [options] <plugin>
```

`claude plugin install`'s other options are `--accept-command <sha256>`, `--config <key=value>`, `-h, --help`, `--json`, `--registry <url>`, `-s, --scope <scope>` and `-y, --yes`. None of them names a ref or a version.

**Established.** The release tag's shape. `autonomous-sdlc-harness--v0.1.0` was created by hand: annotated, SSH-signed by the maintainer on 2026-09-09, with the message `autonomous-sdlc-harness 0.1.0`, on the initial commit. This command shows it:

```
git cat-file -p autonomous-sdlc-harness--v0.1.0
```

It is the `{name}--v{version}` form the `tag` line above names. Later tags are made by `scripts/tag-release.sh` ([`development.md`](development.md) → `## 7. Releasing`).

**Not established.** Four forms are not established: a `#<ref>` suffix on `marketplace add`'s source, a `ref` in a marketplace source, a version on `plugin install`, and whether the runtime resolves anything from `<plugin>--v<version>` tags. The help above documents none of them, and none was tried. The chosen install rests on none of them.

### Verified in Gate 12 round 2

Round 2 of Gate 12 in [`development.md`](development.md) ran on 2026-09-29 against the private scratch repository `firu-daniel/harness-gate12-r2`, with CLI 0.4.1, a GitHub-hosted runner, `phases.qa`, `docs` and `parity` off, and the task `feat_invoice_totals`. Each row below was in the table above until that round.

| Behaviour | What rests on it | Evidence | Date |
|---|---|---|---|
| A `workflow_dispatch` sent with `GITHUB_TOKEN` starts a new run, unlike most events that token raises | `continue` and `poll` chaining jobs | Job 1's `remote-run.sh continue` logged `dispatched action=run engine=task resume=pause`, and a new `harness run <branch>` run started, restored the bundle and resumed | 2026-09-29 |
| A job skipped by its `if:` runs no runner and bills no minutes | The jobless `harness pause` and `harness stop` marker runs | On the `harness pause` marker run both jobs were `skipped`, and `actions/runs/<id>/timing` returned `"billable":{"UBUNTU":{"total_ms":0,"jobs":2,…}}` | 2026-09-29 |
| A step's `timeout-minutes` accepts an expression, here one over `env`, computed from `runner.environment` | The harness step's timeout, the backstop on both runner kinds | Every `harness-run.yml` run was accepted and its `Run the harness` step ran | 2026-09-29 |
| `gh workflow disable` succeeds under `GITHUB_TOKEN` with `actions: write` | The poller disabling itself | A hand-started tick logged `poll: no branch is waiting; disabled harness-resume.yml`, and the workflow's state became `disabled_manually` | 2026-09-29 |
| `actions/upload-artifact` caps a `retention-days` above the repository's maximum at that maximum, rather than failing the step | `retention-days: 400` on `Upload the state bundle` meaning "as long as this repository allows" (§4) | Observed on `upload-artifact@v4`: the artifact's `expires_at` was 90 days after creation, and the repository's `artifact-and-log-retention` was `{"days":90,"maximum_allowed_days":400}`. Round 3 observed the same on the major the template now pins, below | 2026-09-29 |

### Verified in Gate 12 round 3

Round 3 of Gate 12 in [`development.md`](development.md) ran on 2026-09-29 against the private scratch repository `firu-daniel/harness-gate12`, with CLI 0.4.2, a GitHub-hosted runner, `phases.qa`, `docs` and `parity` off, and the task `feat_invoices`. It ran observations (ii), (iii), (iv), (vi) and (viii) only. The first row below was in the table above until that round; the second extends a round 2 row to the major the template now pins.

| Behaviour | What rests on it | Evidence | Date |
|---|---|---|---|
| A push made with `GITHUB_TOKEN` starts no workflow | A pushed branch triggering no CI unless `HARNESS_GIT_TOKEN` is set | With `HARNESS_GIT_TOKEN` unset, an `on: push` probe workflow ran for the two commits pushed with the operator's own credential and for none of the six commits the jobs pushed as `github-actions[bot]` | 2026-09-29 |
| `actions/upload-artifact@v6` caps a `retention-days` above the repository's maximum at that maximum, rather than failing the step | `retention-days: 400` on `Upload the state bundle` meaning "as long as this repository allows" (§4) | The artifact's `expires_at` was 90 days after the run's creation, the step succeeded, and the run carried the annotation `Retention days cannot be greater than the maximum allowed retention set within the repository. Using 90 instead.` | 2026-09-29 |

### Verified in Gate 12 round 4

Round 4 of Gate 12 in [`development.md`](development.md) ran on 2026-09-30 against the private scratch repository `firu-daniel/harness-gate12`, before the pinned plugin install was released: the local `init`, `init --upgrade-workflows` and `doctor` calls ran the fix branch's CLI build, and the jobs cloned the backfilled release tags. It ran observations (i), (ii), (vi) and (xii) only. The row below was in the table above until that round.

| Behaviour | What rests on it | Evidence | Date |
|---|---|---|---|
| At session start the runtime uses the user-scope *directory* marketplace the job added, not the project-scope *github* entry of the same name in the committed `.claude/settings.json` | The session running the plugin version the install step checked (§4) | Claude Code 2.1.285. In runs `36671794632` (pin 0.4.2) and `36672854611` (pin 0.4.1), the preflight's `plugin-permissions` resolved the plugin root as `/home/runner/work/_temp/harness-marketplace/plugin`, and each session read every plugin instruction file from under that path | 2026-09-30 |

### Verified in Gate 12 round 8

Round 8 of Gate 12 in [`development.md`](development.md) ran from 2026-10-05 to 2026-10-06 against `firu-daniel/harness-gate12`, with CLI 0.6.2. It ran observations (xiv) and (xv). Both halves below were one row of the table above until that round; its poller half stays there.

| Behaviour | What rests on it | Evidence | Date |
|---|---|---|---|
| A `remote-run.sh continue` chain names `github-actions[bot]` as `actor` and `triggering_actor` | The run job's gate admitting a chained continuation (§11, *Who can spend the credential*) | Leg (e): chained run `37414238278` named `github-actions[bot]` as both actors, and its gate logged `@github-actions[bot] passes: every harness dispatch is made with GITHUB_TOKEN and names it.` | 2026-10-06 |
| `github.event.repository.owner.type` reads `User` on a user-owned repository's `workflow_dispatch` run | The gate's owner-only default when `HARNESS_RUN_ACTORS` is unset (§11, *Who can spend the credential*) | Leg (g): the owner's dispatch logged `@firu-daniel passes: HARNESS_RUN_ACTORS is unset, which admits the owner of this user-owned repository alone.` | 2026-10-06 |

**What round 2 did not reach.** Three observations were skipped, so each behaviour they cover is not verified and stays as stated: (vii), the self-hosted runner (§8); (ix), `ANTHROPIC_API_KEY` precedence when both credentials are set (§9); and (x), the remote interactive-test skip (§3, *The interactive-test phase*). Running the interactive-test phase remotely is `ROADMAP.md`'s *Cloud QA* row.

---

## 7. Turning it on

The commands below run from the repository root, on the machine the local watcher runs on. That machine needs the GitHub CLI `gh`, logged in to an account that can push to the repository and dispatch its workflows: the watcher sends every remote run through it, and `doctor` fails without it.

**1. Switch it on.**

```
npx autonomous-sdlc-harness config set execution.target github-actions
```

**2. Write the two workflows.** `init` writes `.github/workflows/harness-run.yml` and `.github/workflows/harness-resume.yml`, each only if absent ([`cli.md`](cli.md) → `## 3.`). The run workflow is pinned to this CLI's version, and the job installs exactly that version of the plugin (§4). With `forge` set to `github`, `init` writes two forge workflows beside them: `.github/workflows/harness-trigger.yml`, which starts a run from a labelled issue ([`github-issue-trigger.md`](github-issue-trigger.md)), and `.github/workflows/harness-control.yml`, which acts on `@sdlc-harness` comments and on reviews that request changes ([`github-run-control.md`](github-run-control.md)).

```
npx autonomous-sdlc-harness init
```

The job installs the plugin from the marketplace repository named in the committed `.claude/settings.json`, and refuses to start when there is none. That repository must carry the release tags `autonomous-sdlc-harness--v<version>`, which the job clones. A fork named with `--marketplace` must carry its own. When `init` reports that it could not resolve the owner, name the source yourself:

```
npx autonomous-sdlc-harness init --marketplace <owner>/<repo>
```

**3. Commit the workflows and push them to GitHub's default branch.** GitHub dispatches only a workflow its default branch carries. The harness never pushes a protected branch, so this step is yours; include `.claude/settings.json` if `init` changed it.

```
git add .github/workflows/harness-run.yml .github/workflows/harness-resume.yml
```

```
git commit -m "Add the harness workflows"
```

```
gh auth refresh -s workflow
```

```
git push --no-verify origin <default branch>
```

Pushing a `.github/workflows/*.yml` file over HTTPS with a `gh` token needs the token's `workflow` scope, which the third command adds. The push to the default branch is refused by the `pre-push` hook `init` wires through `core.hooksPath`; `--no-verify` skips that hook for this one push, which you make on purpose and the harness never makes.

**A repository adopted before this release** may carry `.claude/settings.autonomous.json` committed, which the job keeps and its preflight then fails under `profile-tracked` (§4). Stop tracking it, on the default branch:

```
git rm --cached .claude/settings.autonomous.json
```

```
git commit -m "Stop tracking the machine-local permission profile"
```

```
git push --no-verify origin <default branch>
```

It lands on the default branch because every run's branch is cut from `origin/<default branch>`, so an untrack pushed only to a run branch covers that one run; and it skips the hook for the same reason as the push above. Then re-render the two workflows at this CLI's version with `init --upgrade-workflows`, so the job's preflight is `doctor --remote-job`. *Upgrading* below gives the commands. The same run also merges this release's ignore rule for the profile, with its comment, into the managed `.gitignore` block, and nothing that block already carries changes. Commit `.gitignore` with the workflows: left uncommitted, the job's own `init` makes the same change, and its setup step fails on any changed tracked file. The same route updates the action pins. Because the workflows are create-if-absent, a copy written before this release keeps its Node 20 action majors until `--upgrade-workflows` re-renders it or it is edited by hand. Each template header's `# ACTION PINS.` block names the current majors.

**4. Set a credential secret.** One of the two is required (§9 says which one billing follows). For a Claude subscription, make a long-lived token, then store it; `gh secret set` asks for the value, so it stays out of your shell history:

```
claude setup-token
```

```
gh secret set CLAUDE_CODE_OAUTH_TOKEN
```

For API billing instead:

```
gh secret set ANTHROPIC_API_KEY
```

Then name who may spend it: the allow-list, the repository variable `HARNESS_RUN_ACTORS`, a comma-separated list of GitHub logins. It decides who may start, command, answer and review a run, from GitHub and through the **Run workflow** form alike (§11, *Who can spend the credential*). Unset, it admits the repository owner alone in a repository a personal account owns, and **nobody** in one an organisation owns, so an organisation-owned repository must set it. Name the people:

```
gh variable set HARNESS_RUN_ACTORS --body <login>,<login>
```

Or, for a credential that is not one person's, such as a Claude API organisation's key, admit every collaborator with write access:

```
gh variable set HARNESS_RUN_ACTORS --body '*'
```

§9, *Two set-ups*, says which value fits which credential.

**5. Optionally, the notification endpoint and the runner.** Without `HARNESS_PUSH_URL` a remote run's `parked`, `paused`, `failed` and `completed` events reach no one, because the desktop banner is on no machine you are at. The runner is §8.

```
gh secret set HARNESS_PUSH_URL
```

```
gh variable set HARNESS_RUNNER --body <runner label>
```

**5a. Optionally, with `forge` set to `github`, let the job open its pull request.** Switch on *Allow GitHub Actions to create and approve pull requests* (Settings → Actions → General → Workflow permissions), so the run can open its draft pull request, when it starts, with the job's own token. It is not needed when `HARNESS_GIT_TOKEN` is set, which opens it instead ([`github-run-control.md`](github-run-control.md) → `## 4. The draft pull request`). There is no command for this step: the `gh api` call that writes the setting also overwrites the repository's default token permissions.

**6. Check the setup against GitHub.**

```
npx autonomous-sdlc-harness doctor --check-github
```

**7. Only where docs retrieval is on: warm the cache** on the default branch, so the first job does not provision the retrieval runtime from nothing (§4). With the default `scriptsDir` of `scripts`:

```
bash scripts/remote-run.sh warm
```

The first drop after that runs remotely.

### Every secret and variable

All are set on the GitHub repository (Settings → Secrets and variables → Actions), never in `harness.config.json` ([`config.md`](config.md) → `## 2.`). An unset variable reaches the job empty, and the script that reads it applies the default below.

| Name | Kind | Read by | Default | Required |
|---|---|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | secret | `harness-run.yml`: the credential check and the harness step, which exports it only when non-empty; and `harness-control.yml`'s act step, on `issue_comment` events only, for the mention agent ([`github-run-control.md`](github-run-control.md) → `## 6.`) | none | one of this and `ANTHROPIC_API_KEY`; the `harness-run.yml` job fails before launch when neither is set |
| `ANTHROPIC_API_KEY` | secret | as above | none | as above |
| `HARNESS_PUSH_URL` | secret | `autonomous-notify.sh` in the run job and in the resume poller: an endpoint that accepts a POST whose body is the message | none: no push notification | no, but `doctor --check-github` warns without it |
| `HARNESS_GIT_TOKEN` | secret | `harness-run.yml`'s checkout, so the job's pushes use it; its `Open the draft pull request` step (`remote-run.sh open`), which opens the draft pull request with it when the run starts, and its `deliver` step (`remote-run.sh deliver`), which does so only when none is open at completion | `GITHUB_TOKEN` | no. Set it when your own CI must run on the pushed branch: pushes made with `GITHUB_TOKEN` start no workflow (§6). Set it also so your CI runs on the draft pull request without an approval click, from the run's first push onwards. To open the pull request it needs *Pull requests* write beside *Contents* write and, for workflow files, *Workflows* write as a fine-grained token, or `repo` plus `workflow` as a classic token ([`github-integration-research.md`](github-integration-research.md) → S2); a token without *Pull requests* write opens no pull request, and the `completed` comment names `gh`'s error. The pull request's author is then the token's owner, who cannot request changes on it, so use a token of a machine account, or start rounds locally with `/autonomous-sdlc-harness:branch-user-review` ([`github-run-control.md`](github-run-control.md) → `## 4. The draft pull request`) |
| `HARNESS_RUNNER` | variable | `runs-on` in both workflows | `ubuntu-latest` | no (§8) |
| `HARNESS_REMOTE_STOP` | variable | every job and every poller tick | empty | no. Any value stops every job and tick before it launches or dispatches anything (§3) |
| `HARNESS_MAX_CHAIN` | variable | `remote-run.sh continue` and `poll` | 24 | no (§3, *Runs longer than a job*) |
| `HARNESS_POLL_MAX_DISPATCH_FAILURES` | variable | `remote-run.sh poll`: failed re-dispatches of one paused run, and consecutive failed downloads of one run's listed bundle, each counted apart, before the poller gives up on it | 3 | no (§3, *Resuming without the local watcher*) |
| `HARNESS_POLL_GIVE_UP_AFTER_MINUTES` | variable | `remote-run.sh poll`: minutes after the recorded reset past which the poller gives up | 360 | no (§3, *Resuming without the local watcher*) |
| `HARNESS_STEP_TIMEOUT_MINUTES` | variable | `harness-run.yml`'s time budget | 330 hosted, 7170 self-hosted | no |
| `HARNESS_SELF_PAUSE_AFTER_MINUTES` | variable | as above, hosted runners only | 240 | no |
| `STALL_WARN_SECS` | variable | the watcher's stall watchdog, in job mode | 1200 | no |
| `STALL_KILL_SECS` | variable | as above | 2700 | no |
| `STALL_MAX_RESTARTS` | variable | as above | 2 | no |
| `USAGE_PAUSE_TRIGGER` | variable | the watcher's usage gate, in job mode ([`watcher.md`](watcher.md) → `## 4.`) | `warning` | no |
| `USAGE_WARNING_DEBOUNCE` | variable | as above | 2 | no |
| `USAGE_RESUME_MARGIN_SECS` | variable | as above | 120 | no |
| `USAGE_SEVEN_DAY_PAUSE_PCT` | variable | as above | 0.95 | no |
| `PARK_LOOP_MAX_CYCLES` | variable | the watcher's park-loop guard, in job mode | 2 | no |
| `PARK_LOOP_WINDOW_SECS` | variable | as above | 300 | no |
| `REMOTE_WAIT_MAX_SECS` | variable | job mode: the longest usage-pause wait a hosted job takes in the job, and how far past the gate's last resume pass after the reset any in-job wait, self-hosted included, stays paused before it ends in `wait-poller` | 600 | no |
| `REMOTE_AUTO_RESUME_MAX` | variable | job mode: automatic resumes per run after a failure or an overload pause | 2 | no |
| `REMOTE_AUTO_RESUME_DELAY_SECS` | variable | job mode: the wait before each automatic resume | 300 | no |
| `REMOTE_CONTROL_POLL_SECS` | variable | job mode: how often the job looks for a `harness pause` run | 60 | no |
| `HARNESS_TRIGGER_LABEL` | variable | `harness-trigger.yml`'s job filter and `remote-run.sh trigger` | `sdlc-harness`; `harness` in a workflow written by an earlier release | no |
| `HARNESS_TRIGGER_ALLOWED_BOTS` | variable | `remote-run.sh trigger`, and `remote-run.sh control` in `harness-control.yml`: a listed bot's commands and reviews are obeyed too | empty: no bot may start a run | no |
| `HARNESS_RUN_ACTORS` | variable | `harness-run.yml`'s gate step, the first step of the `run` and `collect` jobs; `remote-run.sh trigger`, `control` and `collect`: the allow-list of people who may start, command, answer and review a run. Comma-separated logins, matched case-insensitively; `*` admits every writer (§7 step 4) | unset: the repository owner alone in a user-owned repository, nobody in an organisation-owned one | yes in an organisation-owned repository; otherwise no |

The list of record is the `env:` block of the `run` job in `harness-run.yml`, for a review round's collection that of its `collect` job, for the poller's own variables that of the `poll` job in `harness-resume.yml`, for the trigger's that of the `trigger` job in `harness-trigger.yml`, and for the control workflow's that of the `control` job in `harness-control.yml`; a tunable the watcher reads and that block does not map is not reachable from a repository variable.

### Your own allow entries

Entries you added to this machine's `.claude/settings.autonomous.json` — typically to stop a stall on a command the generated profile did not allow — do not reach the job, which generates its own profile for its own checkout (§4). An entry moved into the committed `.claude/settings.json` applies on a person's machine, where the runtime merges that file beside the profile passed with `--settings`. In the job it is not established: Gate 12 round 1 observed entries there naming a path outside the checkout not applying, and an entry naming no path is unmeasured there (§6). The job's plugin-root grants come from its generated profile and its launch flags (§4), not from that file.

### Upgrading

**The model.** A job runs exactly the version its workflow names (§4). A release of the harness changes nothing for a repository that has not upgraded, and moving to a new version is a deliberate act.

**Runs already in flight.** An upgrade applies to the runs dropped after it is pushed, and a run already in flight finishes on the version it started with. `remote-run.sh` dispatches every run with `--ref <branch>` (`cli/templates/scripts/remote-run.sh`, the `gh_call workflow run "$WORKFLOW_RUN_FILE" --ref "$branch"` line), and GitHub runs the workflow file as that ref carries it. A run's branch is cut from the default branch when its task is dropped, so it keeps the workflows, and with them the pin, that were current then. That holds through every later dispatch of the run: a self-pause continuation, a `/autonomous-sdlc-harness:branch-resume` and an answered park all clone that run's own tag, whatever the default branch now carries. This is deliberate. The pin exists so that a run never changes plugin version under itself, which is why dispatching from the default branch was not taken.

**The commands**, from the repository root, with `<version>` the version you are moving to. Re-render the two workflows at that version:

```
npx autonomous-sdlc-harness@<version> init --upgrade-workflows
```

It replaces `.github/workflows/harness-run.yml` and `.github/workflows/harness-resume.yml`, each after a `.bak`, and only when the run workflow's `HARNESS_CLI_VERSION` differs from `<version>`. Otherwise it reports that nothing was upgraded. Then see what changed:

```
git status --short
```

```
git add <every path on the git add line the upgrade's report prints>
```

Take the paths from the `git add` line the upgrade's report prints. That line names every tracked file the upgrade changed, `.gitignore` included when the run merged new ignore rules into it, and leaving one out fails the next job, because the job's own `init` refuses a changed tracked file. Then:

```
git commit -m "Upgrade the harness workflows to <version>"
```

```
gh auth refresh -s workflow
```

```
git push --no-verify origin <default branch>
```

The last two are needed for the reason step 3 above gives: the `workflow` scope, and the `pre-push` hook.

**What it carries, and what it does not.**

- **It carries** the resume poller's schedule: the `- cron:` lines of your `harness-resume.yml` go into the re-render.
- **It adds the `Open the draft pull request` step** to `harness-run.yml`, which opens the run's draft pull request when the run starts ([`github-run-control.md`](github-run-control.md) → `## 4. The draft pull request`). The step calls `remote-run.sh open`, a script verb this upgrade does not write: until the outer-loop scripts are re-rendered too, with `init --force` (below), the verb is missing, the `continue-on-error` step does nothing, and the pull request opens at completion as before. The step arrives with:

  ```
  npx autonomous-sdlc-harness@<version> init --upgrade-workflows
  ```
- **It does not touch** the runner, the timeouts, the stop switch or any other tunable in *Every secret and variable* above. All of them are repository variables.
- **Any other edit survives only in the `.bak`.** `init` prints one diff command per replaced workflow, for example:

  ```
  git diff --no-index .github/workflows/harness-run.yml.bak .github/workflows/harness-run.yml
  ```

  Carry over what you need by hand. The managed `.gitignore` block ignores both workflow `.bak` files, so `git add -A` leaves them out; delete them once compared.
- **It does not re-render `harness-trigger.yml` or `harness-control.yml`.** Neither carries a version pin, and both call the scripts on the default branch, so both share the scripts' route, `init --force`, like the outer-loop scripts in the next bullet. A repository that re-renders the two pinned workflows without `--force` gets a `deliver` step whose script verb is missing until `--force` runs; that step is `continue-on-error`, so the run still finishes.

  **One exception: a `harness-control.yml` that 0.6.1 wrote.** GitHub cannot parse that copy, so it runs for no event ([`development.md`](development.md) → Gate 12 → Round 7, finding 1). Any `init`, this upgrade included, replaces a copy byte for byte the one 0.6.1 wrote, after a `.bak`, and the upgrade's `git add` line then names it. Compare it with:

  ```
  git diff --no-index .github/workflows/harness-control.yml.bak .github/workflows/harness-control.yml
  ```

  That `.bak` is not in the managed `.gitignore` block, so delete it once compared. An edited copy that still carries 0.6.1's job `if:` is kept, with a warning naming the hand fix — the `if:` as a folded block scalar, `if: >-` with the expression on the next line — and the forced re-run, which regenerates every generated file after a `.bak`:

  ```
  npx autonomous-sdlc-harness@<version> init --force
  ```

  `doctor --check-github` fails on any harness workflow GitHub lists by its path rather than its name, which is how GitHub lists a file it could not parse.
- **It does not re-render the outer-loop scripts** under `<scriptsDir>`. They stay create-if-absent ([`cli.md`](cli.md) → `## 3. The re-run contract`), so `init --force` remains their route. It also regenerates every other generated file after a `.bak`, including `.claude/CLAUDE.md` and the conventions documents the analyze command filled.
- **The allow-list reaches each file only by that file's route.** What a copy written before `HARNESS_RUN_ACTORS` does until it is re-rendered:
  - **An old `harness-run.yml`**, re-rendered by `--upgrade-workflows`: its `run` job checks no one's dispatch or re-run, so any writer's **Run workflow**, `gh workflow run` or re-run launches. Its `collect` job passes the scripts no list: with old scripts every writer's review still starts a round, and with re-rendered scripts a round's authors are held to the unset default.
  - **An old `harness-trigger.yml` or `harness-control.yml`**, re-rendered by `init --force` with the scripts: it passes the scripts no list. With old scripts every writer still starts and commands a run. With re-rendered scripts every start and command is held to the unset default: the repository owner alone, or nobody in an organisation-owned repository.
  - **A run already in flight** keeps its branch's copy of `harness-run.yml`, and with it no gate, as *Runs already in flight* above explains, until it is moved on purpose (below).
  - **An organisation-owned repository** is refused for every person after either upgrade until it sets the list, because unset there admits nobody. Set it before you push the upgrade:

    ```
    gh variable set HARNESS_RUN_ACTORS --body <login>,<login>
    ```

  `doctor` warns about an old copy and names its route: the `remote-execution` check about `harness-run.yml`, with `--upgrade-workflows`, and the `forge` check about the two forge workflows, with `init --force`.
- **Mentions reach each file only by that file's route too** ([`github-run-control.md`](github-run-control.md) → `## 1.`, *Mentions read by an agent*). What a copy written before mentions does until it is re-rendered:
  - **An old `harness-control.yml`** with re-rendered scripts passes the mention agent no credential, so every mention is answered that it was not read, while the `@sdlc-harness <verb>` commands still work ([`github-run-control.md`](github-run-control.md) → `## 6.`). The `forge` check warns about it. Its route is the forced re-run:

    ```
    npx autonomous-sdlc-harness@<version> init --force
    ```
  - **A `harness-run.yml` pinned to a release older than mentions** leaves the control job's plugin without the mention command, so a mention is answered that the plugin carrying it is not available. Its route is the `--upgrade-workflows` re-render under *The commands* above.

**Moving a run in flight to the new version, on purpose.** Do it only after the upgrade is pushed to the default branch, and only while no job of that run is executing: the run is paused, parked or stopped. A job pushes the branch after every commit and at its end (`cli/templates/scripts/push-branch.sh`), and a push that fails because the remote moved is non-fatal by that script's own header (*"EVERY FAILURE PATH IS NON-FATAL"*). So a commit pushed beside a running job leaves the job's later commits off the remote without stopping it.

**This switches the plugin version mid-run.** The work the run already did was written by the old version and is continued by the new one.

With `<branch>` the run's branch:

```
git fetch origin
```

```
git switch --detach origin/<branch>
```

The switch is detached on purpose: `origin/<branch>` is where the run's jobs pushed, the local branch of that name lags it, and the run's mirror working copy may hold that branch checked out, which git refuses to switch a second checkout onto.

Take only the two workflows from the default branch. Once the branch carries them, its next job runs the new version's `init` (`cli/templates/github/workflows/harness-run.yml`, step `Generate the job's permission profile`, `init --plugin-root-entries`), which merges any ignore lines or settings keys the new version adds into the branch's tracked `.gitignore`, `.claude/settings.json` or `.mcp.json`. That step's `git status --porcelain --untracked-files=no` test then fails the job on a changed tracked file (`init … changed tracked files`). So run that `init` here first and commit what it merges, as the job's own error tells you to. Do not check those files out from the default branch: a checkout replaces the whole file, and would discard any edit the run itself made to it on its branch.

```
git checkout origin/<default branch> -- .github/workflows/harness-run.yml .github/workflows/harness-resume.yml
```

```
npx autonomous-sdlc-harness@<version> init
```

```
git status --short
```

Stage every tracked file it lists as modified, the two workflows included:

```
git add <every path git status --short lists as modified>
```

```
git commit -m "Move <branch> to the harness workflows at <version>"
```

```
gh auth refresh -s workflow
```

```
git push origin HEAD:<branch>
```

The push needs no `--no-verify`: the `pre-push` hook refuses only protected branches. The next dispatch of that run runs the new version.

Then return this checkout to where it was:

```
git switch -
```

**`doctor` says when you have not moved.** While the run workflow names a version other than the CLI running `doctor`, its `remote-execution` check warns, and names this route and the way to stay. The warning also states that a run already in flight keeps its version, and points back to this section. It is a `warn`, so it fails nothing.

**When a job cannot install its version**, the `Install the pinned plugin` step refuses with one of two errors. Each names this route and cites this section.

- **The source repository has no release tag `autonomous-sdlc-harness--v<version>`.** Either `<version>` was released without its tag, which its maintainer fixes ([`development.md`](development.md) → `## 7. Releasing`), or the source is a fork that does not carry the tag. Upgrading to a version whose tag exists also clears it.
- **The installed plugin is another version than the one the workflow was rendered for.** The tag was cloned, but what was installed does not match it. Two causes fit: the plugin manifest at the tag names another version, or the install resolved something other than the clone (§6). The job does not run on a plugin it did not pin.

**Why there is no auto-update.** Upgrading means committing the workflows to the default branch. The harness never commits on your behalf, and every protected-branch guard and the `pre-push` hook refuse a push to the default branch.

---

## 8. Choosing a runner

The runner is one repository variable, read by `runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}` in both workflows, so the resume poller runs where the jobs do. Unset, a run goes to a GitHub-hosted `ubuntu-latest` runner.

**A run started from GitHub, on your own hardware.** A run started from an issue always executes through `harness-run.yml`, because GitHub cannot reach your machine to launch it there. A self-hosted runner registered on that machine and named in `HARNESS_RUNNER` runs it there, which is the way to run a GitHub-triggered run locally.

**GitHub-hosted runners that work:** a standard Linux runner by label (`ubuntu-latest`, `ubuntu-24.04`), or a Linux larger runner by the runner label you gave it when you created it. **Not supported:** macOS and Windows GitHub-hosted runners — the outer-loop scripts and the job's `jq` / `gh` bootstrap are Linux-shaped.

### Setting up a self-hosted runner

A self-hosted runner is any Linux machine you own that runs GitHub's runner application: a VPS, a VM, a container, a Kubernetes pod. The harness never provisions, pays for or reaches it; the job simply runs there.

**Register it.** On GitHub, Settings → Actions → Runners → New self-hosted runner shows the download commands for the runner application and a short-lived registration token. On the machine, in the directory you unpacked it into, register it with a runner label of your choosing:

```
./config.sh --url https://github.com/<owner>/<repo> --token <registration token> --labels <label>
```

Then install it as a service and start it, so it survives a reboot:

```
sudo ./svc.sh install
```

```
sudo ./svc.sh start
```

**Install the prerequisites beside it**, for the user the service runs as: `git`, `jq` 1.5 or newer, `gh`, Node, the `claude` CLI, and whatever toolchain your own `commands.*` lines need, since the job bootstraps the checkout and runs your verification commands there. The runner application itself must be version 2.327.1 or newer: every action the two workflows pin (each header's `# ACTION PINS.` block) runs on Node 24 and names that minimum in its release notes, so leave the runner's automatic update on, or update it by hand before re-rendering the workflows. The job stops before launch, naming what is missing, when `jq` or `gh` is absent. It runs `actions/setup-node` for Node, and installs the `claude` CLI with npm when it does not resolve — which needs write access to npm's global prefix — so installing it yourself avoids that:

```
npm install -g @anthropic-ai/claude-code
```

**Point the harness at it:**

```
gh variable set HARNESS_RUNNER --body <label>
```

**An ephemeral runner** — registered with `--ephemeral` added to the `config.sh` line — takes one job and then unregisters, so nothing persists between jobs (§11). Something must then register a fresh runner for every job: a chained or resumed run is a new job, and so is every poller tick. Without that, the next job waits in the queue with no runner. GitHub's own guide to autoscaling is https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/autoscaling-with-self-hosted-runners (not retrieved in this branch).

### What differs on a self-hosted runner

- **No self-pause.** It is disabled, not merely unreached (§3): the job limit is five days, so a run of many hours completes in one job. The step timeout defaults to 7170 minutes and is the backstop.
- **Usage-pause waits happen in the job** whenever the reset falls before the job's deadline, since waiting there costs nothing; only a reset past the deadline goes to the poller.
- **One runner runs one job at a time.** Two branches' runs, or a poller tick, queue behind a running job on a single runner; register more runners under the same label to run them side by side.
- **The job tells the kinds apart from `runner.environment`**, not from the variable, so a hosted label in `HARNESS_RUNNER` still gets the hosted budget.

---

## 9. Credentials and billing

**Which credential the run uses.** The job exports each credential secret that is non-empty and fails before launch when neither is. When both are set, `ANTHROPIC_API_KEY` takes precedence over the subscription token, so **billing follows `ANTHROPIC_API_KEY` whenever both are set**; set only the one you mean to pay with. `CLAUDE_CODE_OAUTH_TOKEN` is the long-lived token `claude setup-token` makes, documented for CI and scripts on the Pro, Max, Team and Enterprise plans. Sources: https://code.claude.com/docs/en/authentication and https://code.claude.com/docs/en/github-actions, retrieved 2026-09-24 (carried from the task prompt's research, not re-fetched).

**The terms.** Anthropic's legal and compliance page permits an end user to sign the **unmodified** Claude Code in with their own subscription, *"including where a platform hosts Claude Code"* — which covers a GitHub Actions job running the stock `claude` CLI under the adopter's own token. The same page says products must not route other people's usage through subscription credentials, and that Pro and Max limits assume *"ordinary, individual usage"*. So a subscription token in a repository secret is for the subscriber's own runs; a repository whose runs are started on behalf of other people belongs on an API key. Source: https://code.claude.com/docs/en/legal-and-compliance, retrieved 2026-09-24 (carried from the task prompt's research, not re-fetched). A team whose members each have their own Claude account will find whose credential a teammate's run may use, and the options weighed for it, in [`team-accounts-research.md`](team-accounts-research.md#5-options-for-the-harness).

**Two set-ups.** The allow-list `HARNESS_RUN_ACTORS` (§7 step 4) is what keeps a credential to the people it may serve. Both set-ups are weighed in [`team-accounts-research.md`](team-accounts-research.md) → `## 5. Options for the harness`, options B and C.

- **One driver.** The owner's subscription token in `CLAUDE_CODE_OAUTH_TOKEN`, with the list left unset, which in a user-owned repository admits the owner alone. Other writers work locally, each signed in with their own Claude account (option C).
- **Several drivers.** A Claude API organisation, with a workspace that has spend and rate limits, and a service account whose key goes in `ANTHROPIC_API_KEY`. The list is `*`, or the team's logins. The organisation sets this up itself, the harness provisions none of it, and each member signs in locally with their own account (option B).

**The residual risk, in both set-ups.** The list screens every route the harness offers, but any writer can still read the credential secret by dispatching an edited workflow from a branch ([`team-accounts-research.md`](team-accounts-research.md) → G7). On a private repository, a push ruleset restricting the workflow paths and the scripts they run closes that route, by the research's inference (G8). GitHub documents push rulesets for private and internal repositories only (G8), so on a public repository only withholding `write` closes it. A writer who edits a workflow can also dispatch as `github-actions[bot]`, which the gate admits; that is the same exposure, not a new one, because that writer can already read the secret.

**`doctor --check-github` reports the set-up.** It names the effective list as a note, and warns when it is unset in an organisation-owned repository, when it is `*` while `CLAUDE_CODE_OAUTH_TOKEN` is set, and, while that token is set, when a collaborator with write access is beyond the list ([`cli.md`](cli.md)).

**The harness is never in the money path.** The GitHub account, the runner, the Claude account and every payment are the adopter's. The harness generates the workflows, documents the setup and checks it; it never holds a credential outside the adopter's own repository secrets, and never pays for or intermediates anyone's compute or Claude usage.

**A paused billing change — a known risk.** Anthropic announced that from 2026-06-15, usage through `claude -p`, the Agent SDK and GitHub Actions would draw on a separate monthly credit — $20 on Pro, $100 on Max 5x, $200 on Max 20x — instead of the plan's own limits. The page now says the change is **paused**. Every unattended run, local or remote, is a headless `claude -p` session, so if it resumes it affects remote **and** local headless runs alike: a subscription would then cover unattended runs only up to that credit. Source: https://support.claude.com/en/articles/15036540, retrieved 2026-09-24 (carried from the task prompt's research, not re-fetched).

---

## 10. What it costs

**Every figure in this section is carried from the task prompt's research, retrieved 2026-09-24, and was not re-fetched in this branch**, except the storage and disk figures, whose paragraph states its own provenance; prices change, so check each source before relying on it. The only figures computed here are products of those, and each shows its arithmetic.

**GitHub-hosted runners**, after GitHub's 1 January 2026 price change (source: https://docs.github.com/en/billing/reference/actions-runner-pricing, retrieved 2026-09-24, carried):

| Item | Figure |
|---|---|
| Linux 2-core standard runner | $0.006 per minute |
| Linux 4-core larger runner | $0.012 per minute |
| Standard runners on a public repository | free |
| Included minutes per month, private repositories | Free plan 2,000; Pro and Team 3,000 |
| Billing unit | per job, rounded up to the minute — the research's reading, not verified here |

**Unverified:** whether larger runners need a Team or Enterprise plan, and whether their minutes count against the included minutes at all. The figures below assume they do not.

**Self-hosted runners** cost no GitHub minutes today. GitHub announced a platform fee of $0.002 per minute for them on 2025-12-16 and postponed it within days (source: https://github.blog/changelog/2025-12-16-coming-soon-simpler-pricing-and-a-better-experience-for-github-actions/, retrieved 2026-09-24, carried). Treat it as a live risk, not a settled price: at that rate the 360-hour reference month below would add 21,600 × $0.002 = $43.20.

**The resume poller** is billed only while it is enabled — while a run is waiting on a usage pause (§3) — and only on a private repository, at least one minute per tick on the runner `HARNESS_RUNNER` selects (billing unit: same source as the table above, retrieved 2026-09-24, carried). Per month of continuous enablement, 30 days:

| Interval | Ticks a day | Minutes a month |
|---|---|---|
| every 15 minutes | 96 | 2,880 |
| every 30 minutes (shipped) | 48 | 1,440 |
| hourly | 24 | 720 |

On a 2-core hosted runner, 1,440 minutes past the included allowance would be 1,440 × $0.006 = $8.64.

**The reference figure: one heavy user**, 3 sessions of 6 hours a day, 20 days a month — 360 hours, or 21,600 minutes (the usage profile is the task prompt's, retrieved 2026-09-24):

| Runner | Monthly cost | Arithmetic and source |
|---|---|---|
| Hosted Linux 2-core | about $112–130 | 21,600 × $0.006 = $129.60 with no included minutes; $111.60 after Pro's or Team's 3,000. https://docs.github.com/en/billing/reference/actions-runner-pricing, retrieved 2026-09-24 (carried) |
| Hosted Linux 4-core larger runner | about $259 | 21,600 × $0.012 = $259.20, assuming no included minutes apply. Same source, retrieved 2026-09-24 (carried) |
| Self-hosted on a Hetzner CX33 (4 vCPU, 8 GB) | €8.49 flat | The server's monthly price, plus nothing from GitHub while the platform fee stays postponed. https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/, retrieved 2026-09-24 (carried). **Unverified:** that Hetzner bills by the hour, capped at the monthly price |

Light use fits inside a private repository's included minutes: the Free plan's 2,000 minutes are about 33 hours of 2-core runner time a month (source as the table above, retrieved 2026-09-24, carried). None of these figures includes Claude usage, which §9 covers and which is the same whether a run is local or remote.

**Storage.** The figures in this paragraph and the next are carried from the user review of 2026-09-28 and were not re-fetched in this branch. Artifact storage is included per plan — Free 500 MB, Pro 1 GB, Team 2 GB, Enterprise Cloud 50 GB — then $0.25 per GB-month; cache storage is 10 GB per repository, then $0.07 per GB-month; on a public repository both are free (sources: https://docs.github.com/en/billing/concepts/product-billing/github-actions and https://docs.github.com/en/actions/reference/limits). The harness's own use is negligible against those: a `harness-state` bundle of a few KB per job, and about 300 MB of retrieval cache when docs retrieval is on (§4). How long a bundle is kept is a separate limit, §4 → **Central state**.

**Disk on a hosted runner.** A standard GitHub-hosted Linux runner has a 14 GB SSD (source: https://docs.github.com/en/actions/reference/runners/github-hosted-runners), and the checkout, the toolchain, the plugin, the retrieval runtime and your own dependencies and build output all share it. A repository too large for that belongs on a self-hosted runner (§8); the harness does nothing about repository size beyond saying so here.

---

## 11. Security

**On a GitHub-hosted runner** each job gets a fresh VM that GitHub destroys after the job. The checkout lives on that VM's disk for the job's duration; the credential lives in GitHub Secrets and reaches the job as an environment variable; the docs-retrieval cache, when used, is stored by GitHub. This is the task prompt's research, which gave no source; GitHub's page is https://docs.github.com/en/actions/concepts/runners/github-hosted-runners (not retrieved in this branch).

**On a self-hosted runner** the code persists on your disk between jobs — the checkout, the installed plugin and anything the run wrote — unless the runner is ephemeral (§8). A persistent self-hosted runner on a **public** repository is a risk if pull requests from forks can run workflows on it: a `pull_request` workflow runs the file as the pull request has it, so a fork can add a job whose `runs-on` names your runner label. `harness-control.yml` can be started that way: it listens to `pull_request_review`, which runs the workflow file as the pull request's merge commit has it, so a fork can rewrite its `runs-on:` ([`github-integration-research.md`](github-integration-research.md) → C2). The other harness workflows cannot: they trigger only on `workflow_dispatch`, which needs write access, `schedule`, and, for `harness-trigger.yml`, a labelled issue and `repository_dispatch`. Any workflow a fork adds can target the label too. What prevents it: keep self-hosted runners off public repositories, or require approval for fork pull request workflows from outside contributors (Settings → Actions → General, the fork pull request approval setting), and at organization level restrict the runner through a runner group to the repositories and workflows that need it. GitHub's statement is https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#self-hosted-runner-security (not retrieved in this branch; check the setting's current wording there).

**Pull requests from forks.** The shipped `if:` of `harness-control.yml` skips a fork's review, but a fork's review runs the fork's copy of that file, so the `if:` is a saving rather than a guard; such a job has a read-only token and no secret. A comment on a fork's pull request is refused by `remote-run.sh control`, because an `issue_comment` job carries the repository's secrets. `pull_request_target` is used in none of the harness's workflows, and no step checks out or runs a pull request's head, though a review event's workflow definition is the pull request's own ([`github-integration-research.md`](github-integration-research.md) → C2; [`github-run-control.md`](github-run-control.md) → `## 6. Who can act, and pull requests from forks`).

**What a reader of the repository's Actions runs can see.** The `harness-state` artifact — the clarification questions and answers, `PAUSE_PROGRESS.md`, the readable run log, which quotes the code and commands the agents worked with, and the unconverged planning drafts and plan-review findings (§3, *Runs longer than a job*) — the job logs, the step summary and each run's inputs, including the `answers` a `/autonomous-sdlc-harness:branch-answer` dispatch carries, are readable by anyone who can read the repository's Actions runs. On a public repository that is everyone. With `forge` set to `github`, park questions, answers and review text also become comments on the issue or the pull request, public on a public repository.

**Workflow inputs never become shell source.** Every input, variable and secret reaches a shell line through `env:`, never through a GitHub expression interpolated into `run:`, so an input shaped like a command is data (`harness-run.yml` → the header's `TWO RULES EVERY EDIT KEEPS`). Keep that rule in any edit you make to your copy.

**Who can spend the credential.** Only the people the allow-list `HARNESS_RUN_ACTORS` admits (§7 step 4). The comment commands, the issue trigger and a review round's collection check it in `remote-run.sh`, but the **Run workflow** form, `gh workflow run` and a re-run reach none of those checks, so the first step of `harness-run.yml`'s `run` job holds `github.triggering_actor` to the list and refuses anyone else before any credential step; `github-actions[bot]`, which every harness dispatch names, passes. A re-run of a trigger or control job replays the original event, whose sender the list already admitted, so `remote-run.sh` also holds that job's `GITHUB_TRIGGERING_ACTOR` to the list on any attempt after the first. The `collect` job opens with the same step. The gate is a step in each job rather than a job of its own because a partial re-run does not repeat an upstream job that succeeded, so a gate job would never see the re-runner ([`team-accounts-research.md`](team-accounts-research.md) → G2; `harness-run.yml` → the header's `THE RUN-ACTOR GATE`). The job-level `HARNESS_PUSH_URL` secret is resolved when the job starts, before the gate; it spends no credential. What the list cannot close is §9, *The residual risk, in both set-ups*.

**The issue trigger** ([`github-issue-trigger.md`](github-issue-trigger.md)):

- The `trigger` job reads untrusted issue text only through its event file and the environment, and references no secret.
- A labelled issue's text becomes the task of a run job that holds the credential secrets, which is why only a person with `write` or `admin` permission whom the allow-list `HARNESS_RUN_ACTORS` admits, or a listed bot, may start one ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 3. Who can start a run` and `## 4. What the labeller vouches for`).
- A run whose task edits `.github/workflows/*` cannot push that edit without a workflow-capable `HARNESS_GIT_TOKEN`: `GITHUB_TOKEN` cannot write a workflow file under any `permissions:` setting, and the push is refused with ``refusing to allow a GitHub App to create or update workflow … without `workflows` permission`` ([`github-integration-research.md`](github-integration-research.md) → S1).

**On every option, the code the agents read goes to the Anthropic API**, exactly as it does when the run executes on your own machine. Choosing a remote runner changes where the session runs, not what it sends.
