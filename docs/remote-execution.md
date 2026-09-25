# Remote execution on GitHub Actions

**Who reads this:** a maintainer deciding whether to run the harness's unattended runs in a GitHub Actions job instead of on their own machine, and anyone changing the remote path — the watcher's dispatch, `remote-run.sh`, the two workflow templates. It owns the design of record: what happens between a dropped file and a pushed branch when a run executes remotely, each decision the design took and its reason, and the GitHub behaviours the design rests on without having verified them. Setup, runner choices, credentials, costs and security are §7 onward.

It cites rather than restates. The key's contract is [`config.md`](config.md) → `## 5. Key reference`; the workflows `init` writes, `init --plugin-root-entries` and `doctor`'s `remote-execution` and `remote-github` checks are [`cli.md`](cli.md); the pause/resume protocol is `plugin/instructions/autonomous_pause_and_ledger.md`; the local watcher is [`watcher.md`](watcher.md). The code of record is `cli/templates/scripts/remote-run.sh` (its header states every verb and its exit map), `cli/templates/scripts/autonomous-watcher.sh` → the header's `REMOTE DISPATCH` and `JOB MODE` blocks, the headers of `cli/templates/github/workflows/harness-run.yml` and `harness-resume.yml`, and `cli/templates/scripts/lib/harness-run-lib.sh` → `THE REMOTE STATE BUNDLE`.

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
3. **Dispatch.** The watcher calls `remote-run.sh dispatch <branch> --engine <kind>`, which sends `workflow_dispatch` to `harness-run.yml` with `action: run` and `chain: 0`. The registry record is written with `execution: github-actions` and an empty `pid`; a run keeps the execution it started with for its whole life, and every later pass reads the record's field, never the current key. From here the local working copy is a **mirror** that only `remote-run.sh sync` fills.
4. **The job's setup**, in the order `harness-run.yml` runs it: compute the time budget from `runner.environment`; stop if `HARNESS_REMOTE_STOP` is set; check out the branch; check for `jq` and `gh`; read `scriptsDir` and whether docs retrieval applies from `harness.config.json` at run time; set up Node; install the `claude` CLI when absent; refuse when neither credential secret is set; install the plugin and refuse on a version other than the one the workflow was rendered for; restore the retrieval cache when retrieval applies; generate the job's permission profile with `init --plugin-root-entries` and fail if that changed a tracked file; run `doctor` as a preflight; bootstrap the checkout with `setup-worktree.sh`; and `remote-run.sh restore` the previous job's state bundle.
5. **The run.** `autonomous-watcher.sh job <branch> <engine> <resume>` launches one session through the watcher's own `spawn_engine` and supervises it (§3). It writes `status.json` with decision `continue` before the launch, so a job killed mid-run still leaves a bundle that says *continue*.
6. **The end of the job.** Under `always()`: `push-branch.sh`, then `remote-run.sh save` and the upload of the bundle as the Actions artifact `harness-state`. Under `!cancelled()`: `remote-run.sh continue`. Under `cancelled()`: a best-effort `failed` notification.
7. **The decision.** `continue` reads the bundle's `decision`. `continue` re-dispatches the same workflow with `resume: pause` and `chain` one higher; `wait-poller` enables `harness-resume.yml`; `stop` does nothing, because job mode has already notified.
8. **Done.** A run that completes ends with status `completed`, decision `stop`, a `completed` notification and its branch pushed. No pull request is opened (§5).

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
  U -->|"drop, answer, resume, pause"| IN
  U --> M
  IN --> W
  M --> W
  W ==>|"one-way: push the drop"| BR
  W --> RR
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
  RR -.->|"sync, status: on request"| AR
```

The thick arrows are the only edges from this machine to GitHub, and each is a user's action relayed. The dotted arrows are reads. Nothing flows from GitHub to this machine unless the user asks: once the dispatch is sent, the machine can be switched off for the rest of the run.

**What each local command does for a remote run.** Every command that reads a remote record first runs `remote-run.sh sync` on each remote record not already `completed` or `failed`, so it acts on the job's newest state; the exception is `branch-status`, which never syncs.

| Command | What it does for a remote run |
|---|---|
| `/autonomous-sdlc-harness:branch-prompt` | Unchanged: it writes the inbox file, and the watcher is what dispatches it (steps 2–3). |
| `/autonomous-sdlc-harness:branch-user-review` | Writes the review into the inbox. The watcher fast-forwards the working copy to `origin/<branch>` — the job, not this copy, is where the branch advanced — commits the review as `chore: add user review for <branch>`, pushes it and dispatches `engine: user_review`. A local run leaves the review for the flow's own commits; a remote one cannot, because a job boundary before that commit would lose it. |
| `/autonomous-sdlc-harness:branch-answer` | Writes the answer into the mirror. Once every open question of the park has its answer, the watcher dispatches `resume: answer` carrying the answers as one JSON input, and refuses, naming the limit, a payload over GitHub's `workflow_dispatch` limit of 65,535 characters. An answer travels as an input because clarification files are gitignored by design. |
| `/autonomous-sdlc-harness:branch-resume` | Writes `RESUME` into the mirror; the watcher dispatches `resume: pause`. A record synced as `paused` with `pause_reason: killed` — a job that ended mid-run — resumes the same way. |
| `/autonomous-sdlc-harness:branch-pause` | Writes `PAUSE` into the mirror; the watcher relays it as `remote-run.sh pause`, a jobless run titled `harness pause <branch>`. The job finds it by polling and drops its own `PAUSE`, and the run yields at its next clean checkpoint exactly as a local one does (§3). |
| `/autonomous-sdlc-harness:branch-status` | Runs `remote-run.sh status` once — the newest runs with their URLs and the last-synced record — and reads the synced `<branch>.remote.log`. It writes nothing and never syncs. |
| `remote-run.sh stop <branch>` | Stops the run outright (§3, *The kill switch and stopping*). |
| `gh run cancel <run id>` | Cancels one job. Its chain stops, because the re-dispatch step runs only under `!cancelled()`, but a usage-paused run waiting for the poller has no job to cancel and would still be resumed. Use `remote-run.sh stop` to reach both. |

Each relay is a dispatch with `chain: 0` that takes no cap slot and consults no lane. A refusal or a `gh` failure is one log line, the mirror file stays, and the next watcher pass retries. So a relay needs the local watcher running at the moment the user acts, and at no other time.

To stop a run, with the default `scriptsDir` of `scripts`:

```
bash scripts/remote-run.sh stop <branch>
```

---

## 2. Why the job runs the watcher

**The job runs `autonomous-watcher.sh job`, not `anthropics/claude-code-action`.** What the local watcher does for a local run, the job must do for itself, and the watcher is already the thing that does it: the launch line flag for flag (`--settings`, `--permission-mode`, the conditional `--model` and `--effort`, `--output-format stream-json`, the two `--add-dir`), the teed stream the usage gate parses, `classify_run_exit`, the park-loop guard and the stall watchdog. The action wraps its own launch and permission handling and exposes no teed stream to gate on, so each of those would have to be rebuilt around it.

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

### The park-loop guard

**Decision:** its count, `park_loop_cycles`, and the resume baseline `resume_max_question_index` ride in the bundle's `status.json` and are seeded into the next job's registry record. A clear taken locally (`PARK_LOOP_CLEAR` in the mirror) reaches the job as the input `park_loop_clear`. **Reason:** a remote park and its answer always cross a job boundary — the parked job ends, and the answer arrives in a new one — so a count kept only in the job's registry would reset on every cycle and never trip.

### Notifications

**Decision:** the job sends lifecycle events through `autonomous-notify.sh`, unchanged, with `HARNESS_PUSH_URL` taken from a repository secret; titles carry the repository name rather than a runner path, and each message names the user's next action — `/autonomous-sdlc-harness:branch-answer <branch>` for a park, `/autonomous-sdlc-harness:branch-status <branch>` for a park loop, `/autonomous-sdlc-harness:branch-resume <branch>` for a user or exhausted overload pause, the reset time for a usage pause. **Reason:** with the machine off the desktop banner reaches no one, while the push arm works from anywhere. A `budget` pause (the self-pause below) sends no `paused` and the next job no `resumed`: a chained continuation is not an event the user acts on. The `cancelled()` step's `failed` notification is best-effort and nothing relies on it.

### The kill switch and stopping

**Decision:** the remote kill switch is the repository variable `HARNESS_REMOTE_STOP`; any non-empty value makes every job, and every poller tick, exit before launching or dispatching anything. The local `AUTONOMOUS_STOP` still stops the local watcher from dispatching. **Reason:** a job cannot read a file on this machine, and a repository variable is what every job reads.

**Stopping one run** is `remote-run.sh stop <branch>`, which does three things in order. It first always dispatches `action: stop`, a jobless run titled `harness stop <branch>` that GitHub keeps as a stop marker; then cancels every queued, waiting or in-progress run of the branch; then, only when both succeeded, marks the local record `failed`. The marker comes first because it is the only part that reaches a usage-paused run waiting for the poller, which has no job to cancel: `continue` and `poll` dispatch nothing, and enable nothing, for a branch whose newest `harness stop` run is newer than its newest `harness run` run. A user's later dispatch is newer than the marker, so it un-stops the branch with no extra step. A partial stop leaves the record alone and exits non-zero, and running `stop` again is the remedy.

**Pausing one run** travels as a workflow run for the same reason. `GITHUB_TOKEN` can neither read nor write repository variables, so the relayed `remote-run.sh pause` dispatches `action: pause`, whose job is skipped and whose run is titled `harness pause <branch>`. The job polls its own workflow's runs every `REMOTE_CONTROL_POLL_SECS` (default 60) for such a run created after a lower bound: this run's own creation time for a user's dispatch, the previous job's last poll (`control_polled_at`, carried in the bundle) for an automatic continuation. So a pause sent while the job was queued, or across a chained continuation, is not lost. On a hit the job drops `PAUSE` into its checkout, the run yields at its next clean checkpoint, and the decision is `stop`.

### Runs longer than a job

A GitHub-hosted job is stopped at its limit, and a single session of this repository has run for more than ten hours, so a run must continue across jobs. It does so through the existing pause/resume rather than by splitting the flow: **on a hosted runner the job drops its own `PAUSE`** at a set point, the run yields at its next dispatch boundary, the job pushes and uploads its bundle, and `continue` re-dispatches with `resume: pause`; the next job resumes from the pushed ledger.

**The point is sized from a measurement**, recorded in `harness-run.yml`'s header: the longest single sub-agent dispatch in this repository's own main-checkout stream logs, taken on 2026-09-25 over 17 logs with this command from the repository root:

```
jq -n 'def e: .[0:19]+"Z"|fromdateiso8601; reduce inputs as $v ({f:null,t:null,s:{},d:[]}; (if .f!=input_filename then .f=input_filename|.t=null|.s={} else . end) | .t=($v.timestamp//.t) | .t as $t | if $v.type=="assistant" then reduce ($v.message.content[]? | objects | select(.type=="tool_use" and (.name=="Agent" or .name=="Task"))) as $u (.; .s[$u.id]=$t) elif $v.type=="user" then reduce ($v.message.content[]? | objects | select(.type=="tool_result")) as $r (.; if .s[$r.tool_use_id] then .d+=[($t|e)-(.s[$r.tool_use_id]|e)] | del(.s[$r.tool_use_id]) else . end) else . end) | .d|sort|length as $n|{dispatches:$n,longest_min:(.[-1]/60),p95_min:(.[(($n*95+99)/100|floor)-1]/60)}' harness-runs/autonomous_logs/*.stream.jsonl
```

It found 957 sub-agent dispatches, the longest 73.05 minutes and the 95th percentile 15.5 minutes. The margin is 73.05 rounded up to the next 15 (75) plus 15 for the pause bookkeeping and the post-steps: 90 minutes. The hosted step timeout is the 360-minute hosted job limit less a 30-minute allowance for the steps around it, 330 minutes, so **the default self-pause is 240 minutes after the job started**, floored at 60 when a smaller step timeout is configured. The repository variable `HARNESS_SELF_PAUSE_AFTER_MINUTES` overrides it, and `HARNESS_STEP_TIMEOUT_MINUTES` overrides the step timeout.

**The backstop is the step timeout.** A dispatch that overruns the window left after the self-pause is killed by it, and the later `always()` and `!cancelled()` steps still push, upload and re-dispatch. Because job mode wrote decision `continue` at the start, the continuation resumes from the pushed ledger: an overrun costs its in-flight unit, never the run.

**On a self-hosted runner the self-pause is disabled, not merely never reached.** The workflow leaves `REMOTE_SELF_PAUSE_AFTER_SECS` unset there, since the self-hosted job limit is five days and chaining a job that can simply keep running only adds setup cost. The step timeout defaults to that limit less the same allowance, and is the backstop there as on hosted. The job tells the two kinds apart at run time from `runner.environment`, because `HARNESS_RUNNER` may also name a hosted label.

**The chain limit.** Every automatic re-dispatch increments `chain`, read from the bundle rather than from any input. Once `chain + 1` would exceed `HARNESS_MAX_CHAIN` (default 24), the job stops chaining and notifies `failed`, which also bounds a job that is killed every time. A user's own dispatch resets `chain` to 0.

### Resuming without the local watcher

When the usage gate pauses a run, the job has two ways to resume it, and chooses per pause:

- **Wait in the job** when the reset falls before the job's deadline and either the runner is self-hosted, or the wait is at most `REMOTE_WAIT_MAX_SECS` (default 600). The gate's own resume then relaunches the run in the same job. A self-hosted job's wait costs nothing; a hosted job bills for every minute it waits, but a short wait is still cheaper than a new job's setup plus the poller's latency.
- **Hand it to the poller** otherwise: the job ends with decision `wait-poller`, so billing stops with it, and `continue` enables `harness-resume.yml`. The poller is a `schedule` workflow, every 30 minutes as shipped, whose one step is `remote-run.sh poll`: it downloads each branch's latest bundle, dispatches `resume: pause` for every usage-paused run whose recorded reset has passed, and **disables itself** once no run is left waiting. Ticks are therefore paid only while something is paused. On a private repository each tick is billed at least one minute while the poller is enabled — up to 48 minutes a day at the shipped interval — and a run resumes up to one interval after its reset; on a public repository the ticks cost nothing. The interval is the adopter's to edit in the workflow file.

**The enable is unverified.** Whether `GITHUB_TOKEN` with `actions: write` may enable and disable a workflow was not confirmed (§6). If the enable fails, the job's `paused` notification says auto-resume is unavailable, and the run waits for `/autonomous-sdlc-harness:branch-resume`. It never falls back on the local watcher.

**Not built:** an external scheduler calling `repository_dispatch` at the exact reset time adds a dependency outside GitHub, and an environment wait timer is fixed per environment rather than per run. A `schedule` trigger cannot serve as a one-shot timer either: it is a recurring cron read from the default branch, and scheduling a specific time would mean committing a cron line to a protected branch.

---

## 4. What the local design assumed, and what changed

`ARCHITECTURE.md` → `## 7. The seam: what an adapter would have to carry` lists what the outer loop assumes, and some of it assumes one long-lived machine.

**Liveness.** Locally it comes from a process probe; a remote run has no local process. A remote record carries an empty `pid`, and the registry is its only liveness source: the watcher's vanished-process reconcile, cap count and stall watchdog skip it, and `restart-watcher.sh` lists it as `remote (not affected by a restart)` instead of counting it as in flight, so a restart is never refused on its account.

**Central state.** Locally the registry, logs and notifications live under the main checkout. A job's registry is its checkout's own, gitignored and discarded with the job. What must cross a job boundary, and what the user may want to read, is the **state bundle** every job uploads as the artifact `harness-state`: `status.json` (the job's record reduced to a fixed schema, with its decision and the counters above), the branch's clarification directory, `PAUSE_PROGRESS.md`, the walker state, and the readable run log. `remote-run.sh sync` downloads the newest bundle into the mirror and the local record, on the user's request only. A job that ended without uploading one — killed before the upload, or finished while its bundle still said `running` — syncs as `paused` with `pause_reason: killed`, not `failed`, because a `failed` record has no resume path while the ledger on the branch is intact; `/autonomous-sdlc-harness:branch-resume` continues from it. A run with no bundle anywhere syncs as `failed`, and re-dropping the artifact is the recovery.

**The usage gate.** Locally it reads the local `stream.jsonl`. The job runs the same gate on its own stream (§3).

**Retrieval.** The docs-retrieval runtime and model cache under `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/` is empty in every new job. When retrieval applies, the job restores it with `actions/cache/restore`, keyed on the runner's OS and the rendered CLI version, and `init` installs only what is missing. A cache saved on a feature branch cannot be read by its siblings, so a run job never saves one; `remote-run.sh warm` dispatches `action: warm` on GitHub's own default branch, whose job only provisions and saves the cache every branch can restore.

**Plugin install, and its pin.** The job installs the plugin explicitly: `claude plugin marketplace add` with the source named in the committed `.claude/settings.json`, then `claude plugin install`. Neither command's `--help` offers a ref or a version (measured on Claude Code 2.1.282, recorded in `harness-run.yml`'s header), so the pin is a check rather than a request: the job refuses to run, naming both versions, when `claude plugin list --json` reports a version other than the CLI version the workflow was rendered with.

**Guards.** Unchanged in the job. The plugin's `PreToolUse` guards load with the installed plugin, and the job's `init` points `core.hooksPath` at the repository's hooks directory, so the pre-push hook refuses a protected branch there as it does locally. `push-branch.sh` still refuses protected branches, and the flow still never merges.

**The permission profile.** `.claude/settings.autonomous.json` is gitignored and carries one checkout's absolute paths, so the job has none until it makes one. It runs `npx autonomous-sdlc-harness@<rendered version> init --plugin-root-entries`, which generates the profile for the job's own checkout path together with the `Read` and `Bash` entries for the plugin roots its install produced, and the step fails if `init` changed any tracked file. `doctor` then runs as a preflight, so any check `doctor` fails stops the job before launch rather than mid-run. Entries an adopter added to their own machine's profile do not travel; §7 says which of them can.

**The walker state.** `<state_dir>/.flow_walker_state` stays gitignored and is never committed. It is carried in the bundle as `flow_walker_state`, without its dot, because `actions/upload-artifact` skips hidden files by default, and a job restore puts it back under its dotted name; a mirror restore does not place it. `<state_dir>/.dispatch_counter` needs nothing, because every flow resets it on every session entry.

**Push frequency — a finding, not a change.** The prompt asked whether pushing only where each flow calls `push-branch.sh` is often enough on a runner that can be killed. Re-derive the answer from the repository root:

```
grep -n "Post-commit push" plugin/instructions/plan_orchestration_instructions_autonomous.md
```

The paragraph it reaches states that in the autonomous forks **every** commit point is followed by a push: each `committer` dispatch carries `push: true`, and each direct commit is followed by a single `push-branch.sh` call. That push is best-effort. So a killed job loses at most its in-flight unit's uncommitted work and any commit whose push failed, and the job's final `push-branch.sh` under `always()` retries the second whenever that step still runs. Nothing was added to the flows.

**The task offer — checked, unchanged.** Answer 1 of `cli/templates/claude/harness-task-offer.md` describes the drop as *"Queued for the harness's run watcher"*, and its caveat says the command *"queues the drop and does not launch the run — the watcher does"*. Both still hold with remote on: the watcher still consumes the drop and is what dispatches it. The job itself never reads the offer.

---

## 5. The seam, and what stays open

**The `workflow_dispatch` inputs are the seam the trigger half plugs into.** A run is started, continued, paused or stopped by one dispatch of `harness-run.yml`, whatever sends it. On the shell side `remote-run.sh dispatch` is the one producer; a trigger would send the same inputs.

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

**"Done" is still a pushed branch.** `push-branch.sh` opens no pull request, and `forge` gains no reader here: `execution.target` already names the platform the job runs on, while `forge` describes pull-request and remote conventions, whose reader is the draft-PR and trigger coupling.

**What stays open** is the trigger half of `ROADMAP.md` → *Cloud / CI execution*: starting a run from an issue, a pull request, a comment or another tracker, and controlling a remote run from GitHub's side rather than from this machine.

---

## 6. What is not verified here

The design rests on these GitHub behaviours. None was verified against a real repository in the branch that built it, and each is exposed as a tunable or a degradable path so that a wrong one costs a setting rather than the design. Gate 12 in [`development.md`](development.md) → `## 5. Verifying a change` is the hand-run that records each against a real repository. Every source below is **carried from the task prompt's research, retrieved 2026-09-24**, and was not re-fetched here, except where the row says otherwise.

| Behaviour | What rests on it | Source | If it is wrong |
|---|---|---|---|
| A `workflow_dispatch` sent with `GITHUB_TOKEN` starts a new run, unlike most events that token raises; a push it makes starts none | `continue` and `poll` chaining jobs; a pushed branch triggering no CI unless `HARNESS_GIT_TOKEN` is set | https://docs.github.com/en/actions/concepts/security/github_token, retrieved 2026-09-24 (carried) | No chain: a long run stops at the first self-pause, and a usage-paused one waits for `/autonomous-sdlc-harness:branch-resume` |
| A GitHub-hosted job is stopped at 6 hours, a self-hosted one at 5 days | The 360- and 7200-minute limits the time budget is computed from | https://docs.github.com/en/actions/reference/limits, retrieved 2026-09-24 (carried) | `HARNESS_STEP_TIMEOUT_MINUTES` and `HARNESS_SELF_PAUSE_AFTER_MINUTES` re-size the budget |
| A job skipped by its `if:` runs no runner and bills no minutes | The jobless `harness pause` and `harness stop` marker runs | None retrieved: the prompt's research cited per-job, per-minute billing (https://docs.github.com/en/billing/reference/actions-runner-pricing, retrieved 2026-09-24, carried) but no statement about a skipped job | Each pause or stop costs one billed minute on a private repository; nothing else changes |
| A step's `timeout-minutes` accepts an expression, here one over `env`, computed from `runner.environment` | The harness step's timeout, the backstop on both runner kinds | None retrieved: the template's header records that the workflow-syntax page could not be checked. Where to check: https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions (not retrieved) | Not known until Gate 12 runs: GitHub may reject the workflow outright. The remedy is a literal `timeout-minutes` in the adopter's own copy of the workflow |
| `gh workflow enable` and `disable` succeed under `GITHUB_TOKEN` with `actions: write` | The poller enabling on a usage pause and disabling itself | None: the prompt's research left it unverified, with no source | The `paused` notification says auto-resume is unavailable, and the run waits for `/autonomous-sdlc-harness:branch-resume` (§3) |
| The plugin cannot be pinned by a ref at install | The version check after install rather than a pinned install | Measured, not retrieved: `claude plugin marketplace add --help` and `claude plugin install --help` on Claude Code 2.1.282, recorded in `harness-run.yml`'s header | If a later CLI accepts a ref, the check still holds; a pinned install could replace it |
| A cache saved on one branch cannot be restored by a sibling | `remote-run.sh warm` saving the retrieval cache on the default branch | https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching, retrieved 2026-09-24 (carried) | A feature branch could save its own cache; `warm` stays harmless |
| A `schedule` trigger is a recurring cron on the default branch, at most every 5 minutes, often late and sometimes dropped, and disabled in a public repository after 60 days without activity | The poller's shape, and its tolerance for a late or dropped tick | https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows, retrieved 2026-09-24 (carried) | A late tick delays a resume by one interval; the self-disabling poller is re-enabled by the next pausing job |
| A `workflow_dispatch` inputs payload is limited to 65,535 characters | `dispatch --resume answer` refusing a larger payload | https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#onworkflow_dispatchinputs, quoted in `remote-run.sh` → `REMOTE_INPUT_PAYLOAD_MAX`; retrieval date not recorded there | A different limit moves the refusal point; the constant is the one place to change |
| An environment wait timer is fixed per environment and may need a paid plan on a private repository | The decision not to build one (§3) | https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment, retrieved 2026-09-24 (carried) | Nothing built depends on it |
