`feat_remote_execution_github_actions` lets an autonomous run execute on a GitHub Actions runner instead of the
local machine. A switch picks the runner. By default the run goes to a GitHub-hosted runner. An adopter can point
it at a self-hosted runner instead: their own VPS, VM, container, Kubernetes pod, or any machine they already own.
Local execution stays as it is, and it stays the default for anyone who does not opt in.

This is the **execution** half of roadmap item **Cloud / CI execution** (`ROADMAP.md` →
`## Engines, environments and integrations`). The **trigger** half — starting a run from a GitHub issue, a PR, a PR
comment, Jira and so on — is a separate branch, `feat_forge_run_triggers`, and is out of scope here.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** It was gathered on 2026-09-24 from vendor docs and
> this tree. The planner and the reviewers must re-verify each lead against the live source before relying on it,
> and must agree on the design themselves. Where a lead turns out wrong, say so in the plan and design around what
> is true.

---

## The goal

1. **An opt-in setting chooses where a run executes: local or remote.** Remote means a GitHub Actions job.
   Nobody pays anything unless they opt in. A user who leaves it off gets exactly today's behaviour.
2. **One workflow serves both runner kinds.** The runner is picked by a repository variable, named
   `HARNESS_RUNNER` in the research. When it is unset, the job runs on a GitHub-hosted runner. When it is set, the
   job runs on the adopter's self-hosted runner with that label. The harness can name the GitHub-hosted runner
   choices it supports.
3. **A run longer than the hosted job limit continues across jobs.** It uses the harness's existing pause/resume
   mechanism, not a re-split of the flow into smaller phases. Single sessions in this repository have run for more
   than 10 hours, and no phase has a predictable duration.
4. **Subscription billing is supported, and so is API billing.** The same run works with a Claude subscription
   token or with an API key, whichever the adopter provides.
5. **The adopter owns the runner, the accounts and the payments.** The harness never holds, pays for or
   intermediates anyone's compute or Claude usage. It may generate the workflow, document how to set up a
   self-hosted runner, and check the setup.

## Leads (re-verify every one)

### Runners, limits and cost

- **Choosing the runner is one line.** The research sketch is
  `runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}`. A self-hosted runner registers with GitHub's runner
  installer (`./config.sh --url <repo> --token <registration token> --labels <label>`, then `./svc.sh install`)
  and needs Node and the `claude` CLI installed next to it.
- **Job limits:**
  - GitHub-hosted runners stop a job at **6h**.
  - Self-hosted runners stop a job at **5 days**.
  - A workflow run can last 35 days.
  - Source: https://docs.github.com/en/actions/reference/limits
- **Hosted runner prices** after the 1 Jan 2026 change, from
  https://docs.github.com/en/billing/reference/actions-runner-pricing:
  - Linux 2-core: $0.006/min.
  - Linux 4-core larger runner: $0.012/min.
  - Standard runners are free on public repositories.
  - Private repositories get included minutes: Free 2,000/month, Pro and Team 3,000.
  - **Unverified:** whether larger runners need a Team or Enterprise plan, and whether they skip the included
    minutes.
- **Self-hosted runner minutes are free today.** GitHub announced a $0.002/min platform fee on 2025-12-16, then
  postponed it within days (https://github.blog/changelog/2025-12-16-coming-soon-simpler-pricing-and-a-better-experience-for-github-actions/).
  Treat it as a live risk, not a settled price.
- **Reference figure for the docs**, one heavy user: 3 sessions of 6h a day, 20 days a month, 360h.
  - Hosted 2-core: ~$112–130/month.
  - Hosted 4-core: ~$259/month.
  - A self-hosted Hetzner CX33 (4 vCPU / 8 GB): €8.49/month flat.
  - Light use fits inside the hosted runners' included minutes.
  - The Hetzner price is from https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/.
    Hetzner bills by the hour, capped at the monthly price; that is unverified.

### Auth and billing

- **Subscription token.** `claude setup-token` makes a long-lived OAuth token that is documented for CI and scripts,
  on Pro, Max, Team and Enterprise plans. In CI it is passed as `CLAUDE_CODE_OAUTH_TOKEN`
  (https://code.claude.com/docs/en/authentication, https://code.claude.com/docs/en/github-actions).
  `ANTHROPIC_API_KEY` takes precedence over a subscription login when both are present, so which credential the
  adopter supplies decides the billing.
- **The terms.** https://code.claude.com/docs/en/legal-and-compliance permits an end user signing the *unmodified*
  Claude Code binary in with their own subscription, *"including where a platform hosts Claude Code"*.
  - Products must not route other people's usage through subscription credentials.
  - Pro and Max limits assume "ordinary, individual usage".
- **A paused billing change.** https://support.claude.com/en/articles/15036540 announced that from 2026-06-15,
  `claude -p`, Agent SDK and GitHub Actions usage would draw on a separate monthly credit instead of the plan's
  limits: $20 Pro, $100 Max 5x, $200 Max 20x. The page now says the change is **paused**. If it resumes, it
  affects remote *and* local headless runs alike. Record it as a known risk.

### Running the harness in a job

- **`anthropics/claude-code-action`** takes `plugin_marketplaces`, `plugins`, `settings`, `claude_args` and
  `claude_code_oauth_token` inputs (https://code.claude.com/docs/en/github-actions). A plain step running today's
  `claude -p` launch line may fit better, because the watcher's launch contract is flag-for-flag
  (`ARCHITECTURE.md` → `## 5. Where the engine is reached — the launch path`): the generated permission profile via
  `--settings`, `--permission-mode`, `--output-format stream-json`, the model and the effort level. Decide which
  fits better, and why.
- **The existing mechanism for runs longer than 6h.**
  - The run takes a checkpoint before every sub-agent dispatch
    (`plugin/docs/AUTONOMOUS_FLOW.md`, the paragraph beginning *"The run's side of a pause is a checkpoint it takes
    before every dispatch"*).
  - On a `PAUSE` marker, and only with no uncommitted tracked changes, it writes `PAUSE_ACK` and ends its session.
  - `/autonomous-sdlc-harness:branch-pause` and `/autonomous-sdlc-harness:branch-resume`, plus the usage gate
    (`docs/watcher.md` → `## 4.`), already drive this.
  - The lead is for the job to drop its own `PAUSE` at about 5h, let the run yield at the next dispatch boundary,
    commit and push the ledger, and re-dispatch the workflow; the next job resumes from the committed ledger.
  - Establish how long one dispatch can take, and size the margin from that.
  - On a self-hosted runner the self-pause should not be needed. Decide whether it is disabled there or merely
    never reached.
- **Chaining jobs.** Events raised with `GITHUB_TOKEN` do not start new workflow runs, *except* `workflow_dispatch`
  and `repository_dispatch` (https://docs.github.com/en/actions/concepts/security/github_token). So a job can
  re-dispatch itself with `gh workflow run` and `actions: write`. Pushes made with `GITHUB_TOKEN` also start no
  CI, which matters if the adopter's own checks should run on the pushed branch.
- **How a remote run starts, without triggers.** Triggers are out of scope, but something must start the job.
  - **The existing inbox drop is the required route, if it can be built.** With the setting on remote, every
    drop that starts or continues a run today (`/autonomous-sdlc-harness:branch-prompt`, `branch-user-review`,
    `branch-answer`, `branch-resume`) must still work. The drop is dispatched to the workflow instead of
    spawning a local session. The adopter should not need a second way to start a remote run.
  - `/autonomous-sdlc-harness:branch-pause` must reach a remote run too, and so must stopping one outright
    (for example `gh run cancel`). Both are one-way actions the user takes, like the drops above (see
    `### A remote run supervises itself`).
  - If some part of that cannot be built, say which part and why in the plan. Then fall back to the second route
    for that part only.
  - **A manual `gh workflow run` / `workflow_dispatch`** with the branch and the drop's content is optional. Add
    it if it costs little beside the inbox route, for example because the inbox route already calls it.
  Keep the seam the trigger branch will plug into obvious.
- **Check the task offer against the route you pick.** The offer's answer 1, `Run it autonomously`, invokes
  `/autonomous-sdlc-harness:branch-prompt`, so with the setting on remote it starts a remote run
  (`cli/templates/claude/harness-task-offer.md` → `## Answer 1`). Check that its wording still holds: the option's
  description (*"Queued for the harness's run watcher"*) and the caveat that the watcher launches the run. It
  holds if the watcher dispatches the drop. The remote job itself never reads the offer, because it runs without
  `AskUserQuestion`.

### A remote run supervises itself

**The real scenario:** the user drops a file into the inbox, the local watcher dispatches the remote job, and the
user shuts their machine down. From that point the local machine may be off for the whole run.

- **The rule.** Traffic from local to remote is one-way, and only ever a user's action: start, answer, resume,
  pause, stop. No local component watches, gates, restarts or resumes a remote run, and the design must not
  depend on one being on. Remote-side controls (pausing or answering from GitHub itself) belong to
  `feat_forge_run_triggers`, not here.
- **What the local watcher does for a local run, the job must do for itself**, or the plan must say it is
  dropped and why (`docs/watcher.md` → `## 4. Pausing, parking and the usage gate`, and the stall watchdog in
  `cli/templates/scripts/autonomous-watcher.sh`):
  - **The usage gate.** The job copies its own stream to a file and applies the same policy to it
    (`USAGE_PAUSE_TRIGGER` and the related settings). Rate-limit events describe the account, not the session.
    So a remote job and a local run on the same subscription each see the same state and pause independently.
    No coordination between machines is needed, and the machine-level lane (`docs/watcher.md` → `## 5.`) stays
    local-only.
  - **API errors.** The `claude` CLI already retries transient errors itself. What reaches the job is a non-zero
    exit or an error result on the stream. Today a local non-zero exit is simply `failed` (`classify_run_exit`).
    Decide which failures earn a bounded automatic resume from the committed ledger, and which stay `failed`.
    Say whether local runs gain the same behaviour; they do not have to.
  - **Stalls.** The watchdog's warn/kill/restart policy (`STALL_WARN_SECS`, `STALL_KILL_SECS`,
    `STALL_MAX_RESTARTS`) moves into the job, with the job's `timeout-minutes` as the backstop. On a hosted runner
    a hung session otherwise burns paid minutes until the 6h cap.
  - **The park-loop guard.** Its count must survive a job boundary, since a remote park-and-answer always crosses
    one. Decide where it lives.
  - **Notifications.** With the machine off, the desktop banner in `autonomous-notify.sh` reaches no one. Its
    push arm works from anywhere. The job sends every lifecycle event (`parked`, `paused`, `failed`,
    `completed`, ...) through it. Decide how the job gets the push configuration.
  - **The kill switch.** `AUTONOMOUS_STOP` lives in the local main checkout, and a remote run cannot read it.
    Decide the remote equivalent. At minimum, a chain of jobs must stop re-dispatching itself once the user has
    cancelled it.
- **Resuming without the local watcher.** A run paused on a rate limit must resume on its own once the limit
  resets. Leads (unverified):
  - **A paused hosted job most likely should end, not wait.** Nothing appears to need the VM after the session
    has written `PAUSE_ACK` and exited. If the job then commits and pushes the ledger, records the resume time
    and finishes, GitHub releases the VM and billing stops. Hosted minutes look to be billed per job and rounded
    up to the minute (https://docs.github.com/en/billing/reference/actions-runner-pricing). A limit hit after 2h
    would then cost about 2h, not the 6h cap. Verify, and decide.
  - **Waiting inside the job** looks worth it only where waiting is free: a self-hosted runner, up to its 5-day
    cap, or a reset only minutes away. On a hosted runner the wait is billed and still bounded by the 6h cap.
  - **A `schedule` workflow is not a one-shot timer.** It looks like a recurring cron line read from the workflow
    file on the default branch. There is no "run once at time X", so there is no furthest-ahead limit to chain
    around. Scheduling a specific time would mean committing a new cron line to the default branch, which the
    never-push-protected-branches guard forbids. Other limits, per
    https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows:
    - runs at most every 5 minutes;
    - often starts late under load, especially at the top of the hour, and can be dropped;
    - always runs the default branch's latest commit;
    - is disabled in public repositories after 60 days without activity.
  - **So the likely shape is a poller.** A cron every N minutes reads each paused run's committed resume time and
    dispatches the runs that are due. Each tick is a job billed at a minimum of one minute on private
    repositories: every 15 min is ~2,900 min/month (more than the Free plan's 2,000 included), every 30 min is
    ~1,440, hourly is ~720. Public repositories pay nothing.
  - **The poller could run only while something is paused.** A job that pauses on a usage limit enables the
    poller (`gh workflow enable`), and the poller disables itself when no paused run is left. Ticks are then paid
    only during a pause. Unverified: whether `GITHUB_TOKEN` with `actions: write` may enable and disable
    workflows.
  - **An external scheduler the adopter owns** (Google Cloud Scheduler, cron-job.org and so on) could call
    `repository_dispatch` at the exact resume time. It fits goal 5, but adds a dependency outside GitHub. If
    offered at all, it is optional.
  - **An environment wait timer** delays a job without using runner minutes, but it is fixed per environment
    rather than per run, and may need a paid plan on private repositories
    (https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment).
  - If none of these works, say so in the plan. The run then stays paused until the user resumes it; do not
    fall back on the local watcher.
- **When the job is killed.** GitHub cancelling a job, whether it hit the time cap, a billing or payment
  problem, or a runner failure, is **not** the harness's concern to detect. Do not check for GitHub account or
  billing states. A killed process can do nothing more, so the handling is best-effort and generic:
  - Push after every commit, so a kill loses at most the in-flight unit. Today `push-branch.sh` runs where each
    flow calls it; establish whether that is often enough on a runner.
  - The next start, whoever makes it, resumes from the last pushed ledger with no cleanup of the dead job.
  - A cleanup step that runs after cancellation (`if: cancelled()` or `always()`) may send a `failed`
    notification. Do not rely on it running.
- **Status.** `/autonomous-sdlc-harness:branch-status` may read the remote state when the user asks, for
  example from GitHub's run list or from what the job pushed. That read is a user action, not supervision.

### What in the local design breaks on an ephemeral runner

`ARCHITECTURE.md` → `## 7. The seam: what an adapter would have to carry` lists what the outer loop assumes. Some
of it assumes one long-lived machine:

- **Liveness.** It comes from a process probe (`restart-watcher.sh` → `agent_probe`, `pgrep`). §7 operation 8
  names the alternative: make the run registry the sole liveness source. A local registry entry for a remote run
  is written when the user dispatches it and is never kept current by the local machine.
- **Central state.** The registry, the logs, the notifications and the kill switch all live under `<MAIN_REPO>`
  (`docs/watcher.md` → `## 1. The loop in one page`, step 1). Decide what a remote run reports back, and where.
  It may only be somewhere the user can read on demand, never something the local watcher must receive
  (`### A remote run supervises itself`).
- **The usage gate.** It reads the local `stream.jsonl`. A remote run gates itself
  (`### A remote run supervises itself`).
- **Retrieval.** The docs-retrieval runtime and model cache
  (`${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/`) is empty in every new job. The
  **Cloud / CI execution** row says CI cache restore is the whole fix.
  - GitHub caches cannot be read across sibling branches, so seed the cache from the default branch
    (https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching).
- **Plugin install.** The run needs the plugin installed in the job, pinned to a known version.
- **Guards.** Protected branches, the never-merge rule and the push guards must hold unchanged in the job.
- **The permission profile.** `.claude/settings.autonomous.json` is git-ignored and machine-specific. `init`
  generates it with this checkout's absolute paths (`docs/development.md`, the paragraph beginning *"The `$HOME`
  half is a different matter"*). So the job has no profile until it makes one, and today's launch line passes it
  with `--settings`.
  - Decide how the job gets a profile for its own checkout path, for example by running `init` in the job.
  - The profile also needs the `Read(//…/plugin/**)` entry for the resolved plugin root that `doctor`'s
    `plugin-permissions` check asks for (`docs/cli.md` → the permission-profile row). Check that the job's plugin
    install produces a root `init` can resolve.
  - Adopter-tuned `allow` entries added to fix stalls exist only on the adopter's machine. Say how an adopter keeps
    them for remote runs, or state that remote runs do without them.
- **The walker state.** `<state_dir>/.flow_walker_state` is git-ignored and machine-local, so each new job starts
  without it (`docs/flow-graph-walker.md` → `### Item 3a`). The committed flow-progress ledger stays the durable
  record. A lost walker state only matters when a job boundary falls inside the planning flow. Then the next job
  re-runs one review round and restarts the loop cap. It does not repeat planning that the ledger records as done.
  - Decide whether to carry the file between chained jobs (an Actions artifact or cache entry), or to accept the
    loss and say so. Do not commit it: the ignore rule exists on purpose.
  - `<state_dir>/.dispatch_counter` needs nothing. Every flow resets it on every session entry, a resume included
    (`plugin/instructions/improvement_observations_instructions.md` → **(a) Cap pressure is a percentage**).

### Security (document it for adopters)

- **GitHub-hosted runners:** each job gets a fresh VM that GitHub destroys afterwards. The checkout lives on that
  VM's disk. The token lives in GitHub Secrets. Anything cached is stored by GitHub.
- **Self-hosted runners:** the code persists on the adopter's disk unless ephemeral runners are configured. A
  persistent self-hosted runner on a *public* repository is a risk if fork pull requests can run workflows on it.
- **Every option:** code the agents read goes to the Anthropic API, as it does locally today.

## Establish, do not assume

- **The configuration key(s).** Name them and give them their reader in this same branch. `ARCHITECTURE.md` →
  `## 8. Declaring a seam before building it` sets the rule: a seam may be declared before it is built only with a
  reporter. `forge` and `design.source` show what happens otherwise. Decide what `doctor` checks, for example the
  workflow file, the secret, the runner label, and GitHub's reachability, and what `init` generates.
- **Whether `forge` gains its first reader here** (`docs/config.md` → `## 5. Key reference`, the `forge` row), or
  whether that stays with the trigger branch. Do not add a reader that nothing needs.
- **Where the workflow template lives, and how an adopter receives it.** `context/cli.md` →
  `## What this layer owns, and what it is not` separates what this tool does from what an adopter receives.
- **What "done" looks like for a remote run.** Today a run ends at a pushed branch, and `push-branch.sh` opens no
  pull request. Keep that unless there is a reason not to. A draft-PR output belongs with the forge coupling.

## Out of scope

- Triggers of any kind beyond starting the job by hand or from the existing inbox drop. That is
  `feat_forge_run_triggers`.
- Anthropic cloud sessions or routines, GitLab CI, and other orchestrators (LangGraph, Temporal and so on).
  Mention them in the docs only if a reader would otherwise ask.
- Changing the flow's phases or the planning loop. This does not depend on `feat_orchestrator_flow_graph_planning_pilot`.
- Controlling a remote run from the remote side (GitHub's UI, comments, a phone). That is `feat_forge_run_triggers`.
- Detecting GitHub account, billing or payment problems. A job GitHub kills is handled only by the generic
  best-effort rules under `### A remote run supervises itself`.

## Acceptance

1. With the setting off, a run behaves exactly as today, and nothing new is required of the adopter.
2. With the setting on and `HARNESS_RUNNER` unset, a run executes on a GitHub-hosted runner. A run longer than the
   job limit continues across chained jobs through pause/resume, and ends at a pushed branch.
3. With `HARNESS_RUNNER` set, the same workflow runs on a self-hosted runner, and a run longer than 6h completes
   in one job.
4. Both a subscription token and an API key work, and the docs say which one billing follows.
5. `doctor` reports the remote setup's state, including a setting that is on but incomplete.
6. The adopter docs cover setting up a self-hosted runner, the cost reference figures with their sources and
   retrieval date, the security notes and the paused billing change.
7. `ROADMAP.md` → **Cloud / CI execution** says what shipped and what stays open (the trigger half).
8. Once the remote job is dispatched, the run completes with the local machine switched off. That covers a
   rate-limit pause and its resume, or the plan names the part GitHub cannot support and the run then waits for
   the user's resume. Its `parked`, `paused`, `failed` and `completed` events reach the user through the push
   notification.
9. A job killed mid-run leaves the branch at its last pushed commit, and the next start resumes from the pushed
   ledger without manual cleanup.
10. `bash scripts/run-gates.sh` prints no new failure.
