# The watcher

**Who reads this:** someone running the outer loop — arming a repository's watcher, debugging why a dropped file did not become a run, or writing a component that has to agree with the watcher about machine-scoped state. It answers what the watcher does with what it finds, what it refuses, and where its state lives.

---

## 1. The loop in one page

A run starts as a **file** and ends as a **notification**. There is no queue server, no webhook and no scheduler in between: a file appears in the inbox, and the next poll pass acts on it. Everything the watcher itself decides is in the eight steps below; everything a run then does — planning, implementing, reviewing, shipping — belongs to the engine command the drop is bound to, which the watcher launches and never inspects. That is the local path, and the default. With `execution.target` set to `github-actions`, the next poll pass still prepares the drop on this machine, then dispatches it to a GitHub Actions job instead of launching it here; the steps below mark where the two paths differ, and [`remote-execution.md`](remote-execution.md) is the design of record for everything after the dispatch.

1. **The drop.** One file is written into `<MAIN_REPO>/<state_dir>/autonomous_inbox/` — by `/autonomous-sdlc-harness:branch-prompt`, by `/autonomous-sdlc-harness:branch-user-review`, or by hand for a docs checklist, which no shipped command writes. `<MAIN_REPO>` is the main checkout, which the watcher places from its own location and hands to every session it launches as `HARNESS_MAIN_REPO` (§2, *The main-checkout anchor*), and every central artifact lives under it — the inbox, the logs, the registry, the kill switch — whichever sibling working copy a run executes in.
2. **The filename decides the run.** It selects the engine command, the working-copy strategy and where the dropped file lands, all three at once (the table below). The three patterns are anchored suffixes and mutually exclusive, so a branch whose own name contains `review` or `task_prompt` is not mis-routed. A name matching none of them is archived as `rejected_<timestamp>_<name>` and no registry record is written for it.
3. **The guards, in one order.** The global kill switch `<state_dir>/AUTONOMOUS_STOP`, then the usage hold, then the per-repository concurrency cap (`MAX_PARALLEL_RUNS`), then a duplicate drop for a branch already running, then a `parked`, `paused` or `park_loop` record that already owns this branch's working copy, then the host check — whether this machine can start the sandbox the run needs, judged against the table `doctor` grades as `sandbox-prerequisites` ([`cli.md`](cli.md) §6) — and **last**, only when `USAGE_LANE_LOCK_ENABLED=1`, the machine-level lane lock (§5) — taken immediately before the first step that creates anything, because taking it commits the whole machine to this repository. That knob is off by default, so as shipped the last guard passes without taking anything. The kill switch, the usage hold, the cap and the lane all **defer**: the file stays in the inbox, no record is written, and a later pass picks it up with nothing to re-drop by hand. The duplicate drop and the branch-owning record are **archived** instead, because waiting would not make either a different file — and the owning record is left byte-identical, so its own resume path still works. For a `park_loop` record the rejection names the `PARK_LOOP_CLEAR` clear action (§4) rather than an answer, because answering does not release it. The host check is **archived** too, as a failure: a definite missing piece archives the drop as `failed_<ts>_<name>`, sets the record to `failed` and sends one `failed` notification naming the piece and its install command. It never defers, because a host does not install its own packages, so waiting would not change the answer. An uncertain AppArmor answer never refuses. A taken `sandbox.optOut` exempts the drop, and it is read from the main checkout's `harness.config.json`, never from a run copy's. A resume and job mode are not judged here; the profile's `failIfUnavailable` covers them. A **remote** drop skips the usage hold, the cap, the host check and the lane, because the job gates itself — it runs the watcher's own usage gate on its own stream, and its `doctor --remote-job` preflight judges the runner's sandbox prerequisites — and no local component gates a remote run; the kill switch still defers it, and a branch-owning record still rejects it. Before the duplicate test on a record carrying `execution: github-actions`, which has no local process to look at, the watcher refreshes that record's status with a best-effort `remote-run.sh sync`, so a still-`running` remote run makes the drop a duplicate.
4. **The working copy is prepared** by the strategy the pattern names — a fresh clone cut from `defaultBranch`'s commit as origin reports it (`create-worktree.sh`), or the branch's existing copy reused in place when it is clean and usable, else recreated for that existing branch as a clone (`create-worktree.sh --existing`, which never pushes). Every copy `create-worktree.sh` makes, in every mode, is a `git clone --shared` of the main checkout at the derived sibling path, recorded in the run registry with `copy_kind` `clone` (`hr_clone_create_var`), and bootstrapped by the **main** checkout's `setup-worktree.sh --target <clone>`, never the branch's own. `--existing` checks the branch's tip before it writes any tree and populates the clone from that commit with no hook running. A reused copy can still be a legacy linked worktree (§2, *Migration: both layouts until no worktree run is left*). Every git call here runs as §2's *Where the family runs git in a run's copy, and under what pins* states.
5. **The artifact is placed, and for two of the three patterns committed — all three on a remote run.** A copy that changes a protected path against the default branch, or whose own `stateDir` differs from the main checkout's, is refused before launch. A task prompt and a docs checklist are copied in and committed by the watcher's plumbing commit (`hr_commit_placed`), which commits that one path over the branch's tip and runs no hook, then pushed as a separate statement through `push-branch.sh`; a review file is placed and deliberately not committed, because the flow's own commits pick it up. Either commit path is non-blocking — a failed commit or push is one warning line in the run log and the run launches anyway. **A remote run commits all three**, and blocks on them. The job checks out `origin/<branch>` and sees only what was pushed, so a review left uncommitted would never reach it; the working copy is first fast-forwarded to `origin/<branch>` by plumbing, after the protected-surface check, because the job is where the branch advanced, and the review is committed as `chore: add user review for <branch>`. A failed commit, or a push that did not land, stops the dispatch with one `failed` notification. The inbox file is archived as `.processed/<timestamp>_<name>`.
6. **The engine is launched headless**, in a detached subshell whose working directory is the prepared copy: one `-p` session of the bound slash command, run with this run's per-run copy of the generated permission profile through `--settings` (§2, *The per-run profile*) and with `HARNESS_MAIN_REPO` set to the main checkout in the session's environment, the model from `agentModel`, the effort level from `agentEffort` when that key is set, and `--output-format stream-json`. The raw events are teed to `<state_dir>/autonomous_logs/<branch>.stream.jsonl` — the copy the usage gate parses — and the same stream is formatted into the readable `<branch>.log` by `autonomous-format-stream.sh`. The copy is rendered and checked before every launch and resume; a copy that cannot be rendered or fails the check starts nothing, and the record ends `failed` with one `failed` notification naming the reason. A **remote** drop is not launched: it is dispatched through `remote-run.sh dispatch`, which opens no live-log window and spawns nothing here, and its record carries `execution: github-actions` and no `pid`.
7. **The session's exit is classified** from the engine's own exit code plus the sentinels it left behind, into one of the five terminal states in the table below, recorded in `<state_dir>/autonomous_logs/registry.json`. On a clone, the run's branch is first synced into the main checkout (`hr_run_copy_check_var`), so the main checkout's branch shows what the run committed; a refused sync is one `watcher.log` line and never changes the classification. A remote run's exit is classified in the job, by the same `classify_run_exit`, under `autonomous-watcher.sh job`; the local record learns the result only when `remote-run.sh sync` reads the job's state bundle.
8. **One notification per lifecycle event** — `launched`, `completed`, `parked`, `paused`, `failed`, `resumed`, `park_loop` — through `autonomous-notify.sh`, whose header is where that vocabulary is normative. In a job with `forge` `github`, each event except `failed` is also passed to `remote-run.sh report` as it happens, and `failed` is passed once, when the job ends `failed` (its automatic resumes ruled out); `report` comments on the run's issue or pull request ([`github-run-control.md`](github-run-control.md) → `## 5.`); the notification itself is unchanged.

**The three patterns.**

| Inbox filename | Engine command | Working copy | The dropped file lands at |
|---|---|---|---|
| `<branch>_task_prompt.md` | `/branch-start-plan-autonomous` | fresh, off `defaultBranch`, branch pushed | `<state_dir>/task_prompts/<branch>_task_prompt.md` — **committed** before launch |
| `<branch>_review[_<n>].md` | `/branch-start-user-review-fix-autonomous` | the branch's existing copy when it is usable, else recreated for that branch | `<state_dir>/user_reviews/<the dropped filename>`, round suffix intact — **not committed** for a local run; committed as `chore: add user review for <branch>` and pushed for a remote one |
| `<branch>_docs.md` | `/branch-start-docs-autonomous` | fresh, as the task path | `<state_dir>/docs_catalog/<branch>_docs.md` — **committed** before launch |

The watcher derives only the **branch** from the name, never the review round: the engine resolves the latest round inside the working copy, so nothing out here has to remember one.

**The status vocabulary — one live state and five a session ends in.** The registry is a single object shaped `{"runs": {"<branch>": {…}}}` and this vocabulary is a contract — `/autonomous-sdlc-harness:branch-status`, `/autonomous-sdlc-harness:branch-answer`, `/autonomous-sdlc-harness:branch-pause`, `/autonomous-sdlc-harness:branch-resume` and `restart-watcher.sh` all read it, and `remote-run.sh` reads and writes it (`sync`, `stop`) — stated normatively in the watcher's own header. Every writer — the watcher, the watcher's own engine subshell and `remote-run.sh` — goes through the one library writer, which serializes on a lock beside the file while readers take none; a pair of fields a reader decides on, such as a status and its reason, is written in one step, and `paused_by` / `pause_reason` are recorded before the `PAUSE` they describe. The rules live in `cli/templates/scripts/lib/harness-run-lib.sh` → `THE RUN REGISTRY.`. A record the watcher dispatched also carries the field `execution` with the value `github-actions`; every later pass reads that field, never the current `execution.target`, so a run keeps the execution it started with. `restart-watcher.sh` lists such records rather than refusing over them, since a restart cannot reach a job.

| `status` | Reached when | What ends it |
|---|---|---|
| `running` | the run was launched or resumed | one of the five below, or the reconcile pass when its process vanished |
| `completed` | the session ended cleanly with no park or pause signal — the branch is ready for review | an operator. A later review drop re-uses the same record, flipping it back to `running` |
| `parked` | the run wrote an unanswered clarification question and yielded | `/autonomous-sdlc-harness:branch-answer` writes the park's `answer_<n>.md`; the park-resume pass re-launches the same engine in the same working copy once every open question file is answered |
| `park_loop` | consecutive park-resumes made no progress (§4) | the operator's clear action (§4), after which the record is `parked` again |
| `paused` | the run honored a `PAUSE` request and yielded at a clean checkpoint (§4) | a `RESUME` sentinel — dropped by `/autonomous-sdlc-harness:branch-resume`, or by the usage gate for a run it paused itself |
| `failed` | a non-zero exit, a vanished process, or a stall past the restart cap | an operator; nothing re-launches a failed run |

A `parked` or `paused` run costs nothing while it waits: its session is over, and the resume passes are what bring the same engine back in the same working copy.

---

## 2. The scripts

Two families ship into the adopter's configured `scriptsDir`, and the difference between them is what a re-run of `init` means for each.

- **Project-command wrappers** — type-check, test, dev-server and deploy — are *rendered*: their body is the command line stack detection resolved, substituted when the file is written. They are documented in `cli/templates/scripts/README.md`.
- **Outer-loop scripts** — this table — carry **no token at all** and are copied verbatim. Each one resolves `<repo_root>/harness.config.json` at run time through the one shared library beside them, so **changing a configuration key takes effect on the next invocation without regenerating anything**. That is not a convenience: a protected-branch set frozen into a file when `init` ran would enforce the wrong set the moment `protectedBranches` changed, and silently. For an adopter upgrading the CLI, who would otherwise read a plain re-run as picking a fix up: these files are written `create-if-absent`, so a fix shipped in a later release reaches a checkout that already has the file only through `init --force` — which copies it to a `.bak` sibling and re-writes it — or by deleting the file and re-running `init`, and §3's restart is still owed after either (`docs/cli.md` §3 states the policy and this corollary).

| File | What it does | Who runs it | Profile allow entry |
|---|---|---|---|
| `lib/harness-run-lib.sh` | The one reader of `harness.config.json` for this family: anchors, state paths, the protected-branch answer, the machine-level lane primitives | sourced by every script row below; never executed, and it ships without an executable bit | no |
| `commit-on-branch.sh` | Stages exactly the paths it was given and commits them by plumbing, refusing a protected branch; the main checkout's copy is a `sandbox.excludedCommands` entry, so it runs outside the sandbox (`docs/cli.md` §6) | dispatched agents only | **yes** |
| `push-branch.sh` | Pushes the current non-protected branch, and never aborts its caller | dispatched agents, and the watcher after its artifact commit, always as a separate statement | **yes** |
| `refresh-branch.sh` | Merges the configured default branch **into** the checked-out branch, refusing when HEAD is on a protected one; never pushes | an operator repairing a stale base; a dispatched agent once an instruction names it — no shipped instruction does yet (`docs/outer-loop-verification.md` §4) | **yes** |
| `scratch-run.sh` | Runs one file in the interpreter that file's extension names, refusing any argument that does not resolve inside `<state_dir>/scratch/` | a dispatched agent running a language probe or a mutation check | **yes** |
| `lib/flow-walker-gates.sh` | The walker's gate predicates | sourced by `flow-walker.sh`; never executed, and it ships without an executable bit | no |
| `flows/task_plan_writing.graph.json` | The planning loop's declared flow graph: its nodes, their outcomes, the `iteration` counter and its cap, the escalation payloads | read by `flow-walker.sh` from beside itself, by flow id; never executed | no |
| `flow-walker.sh` | Walks a declared flow graph and prints the planning loop's next action (`start`, `next`, `current`) | the orchestrating session of a planning flow | **yes** |
| `run-test-suite.sh` | Runs the whole-tree `commands.typecheck` and then `commands.test`, once each, writes both outputs to a per-round log under `<state_dir>/test_run_logs/`, under a marker line per gate. Its run form starts both gates detached from the calling session and prints `pending`; `--wait <label>`, re-issued after each `pending`, prints `pass` or `fail <log path>` | the orchestrating session, once per Run gates round | **yes** |
| `create-worktree.sh` | Creates the clone a run executes in — a `git clone --shared` at the derived sibling path, recorded with `copy_kind` `clone` (`hr_clone_create_var`) — and bootstraps it, in every mode, through the **main** checkout's `setup-worktree.sh --target <clone>`, never the branch's own. It refuses a second live copy of the branch (`hr_run_copy_live_var`) and a `[worktree-dir]` override. A new branch is pushed from the main checkout with `--set-upstream`, and the clone's `origin/<branch>` mirror is then synced out to the pushed tip. With `--no-bootstrap` it cuts and pushes the new branch without the bootstrap, for `remote-run.sh start`, whose copy runs nothing. With `--existing` it checks the branch's tip, populates the clone from that commit, and never pushes. Every failure after the branch exists removes what this run created: the clone, the branch it cut with the upstream section its push wrote, its registry record, a registry directory it made and, after a successful push, the remote branch that push created, under a lease on the pushed tip | the watcher; `remote-run.sh`; an operator by hand | no |
| `setup-worktree.sh` | Bootstraps the checkout it sits in, or with `--target <dir>` the run copy at `<dir>`, using its own checkout's configuration — machine-local links, the pre-push backstop (on a clone, as `core.hooksPath` in the clone's own `.git/config`), dependencies, build | `create-worktree.sh`, always as the main checkout's copy with `--target <clone>`; the run job's `Bootstrap the checkout`, with no argument; an operator repairing a stale checkout | no |
| `docs-search-server.sh` | Starts the docs-retrieval MCP server for the checkout it sits in: by `exec`ing the machine-shared runtime's `docs serve` by default, or by running `harness-docs-retrieval serve-mcp` when retrieval is on and `docs.retrievalBackend` is `python`; `docs.retrievalBackend` is read only while `phases.docs` and `docs.retrieval` are both true. Exits 1 naming `init` when no runtime is installed, or, with retrieval on, naming `doctor` when the key holds an unknown value; exits 3 when the Python backend is selected but cannot serve (`docs/retrieval.md` → `## How it fits together`) | the agent runner, from `.mcp.json`, when `docs.retrieval` is on | no |
| `cleanup-merged-worktrees.sh` | Removes the run copy, that run's per-run profile (§2, *The per-run profile*) and the local branch of a run whose remote branch is `[gone]`. The copy is the one the branch's run-registry record names, never one `git worktree list` finds: a clone through `hr_clone_remove_var`, a legacy worktree (a record with no `copy_kind`) through its worktree arm. `--dry-run` decides by the same rule | the watcher, throttled at the end of a pass | no — also **withheld** by the script-allowlist guard |
| `autonomous-format-stream.sh` | Turns `stream-json` events into one short line per event | the watcher, as the tail of the launch pipeline | no |
| `autonomous-notify.sh` | Turns a lifecycle event into a desktop banner and a best-effort push | the watcher; an operator checking delivery | no |
| `autonomous-watcher.sh` | The loop in §1; under `job`, exactly one run inside a remote job's own checkout | the service manager, or an operator for one `tick` / `status` / `usage`; the remote job for `job` | no — also **withheld** by the script-allowlist guard |
| `restart-watcher.sh` | Bounces this repository's daemon after one of these files is edited (§3) | an operator | no — also **withheld** by the script-allowlist guard |
| `remote-run.sh` | Every call from this machine, or from a job, to GitHub for a harness run — locally `dispatch`, `pause`, `stop`, `sync`, `status`, `warm`, `fetch`, a read of one branch's newest state, `review`, which places, commits and dispatches a user review — in the branch's existing copy when it is trusted, else in a clone it cuts and then removes with the local branch, registry record and registry directory that cut created — `list`, the runs on GitHub with no local record, and `discard`, which removes one of the commands' directories under `<state_dir>/scratch/` and nothing outside it; in the run job `restore`, `save`, `continue`, `poll`, `open`, which opens the run's draft pull request when the job starts, `report`, which posts a lifecycle comment and moves the run's state label, and keeps the run's progress comment, and `deliver`, which marks the draft pull request ready and posts the `completed` comment on it and on the source issue; in the trigger job `trigger`, which turns a GitHub event into a branch and a task text, and `start`, which places that prompt in a clone it cuts and dispatches it, removing the clone, the local branch, the registry record and the registry directory the cut created; in the control job `control`, which turns a comment or a review into a harness action; among others; it reads and writes the run registry (`sync`, `stop`). Its header states every verb and its exit map | the watcher, for a remote drop and, in job mode, from `notify`; the remote job; the trigger job; the control job; a `branch-*` command, for `fetch`, `list`, `pause`, `dispatch`, `review` and `discard`; an operator by hand | no — also **withheld** by the script-allowlist guard |

**Why only the `yes` rows carry a profile entry, and why that is not the reachability answer.** The generated permission profile emits allow entries for exactly the rows marked yes, in two literal forms in the base — the repo-relative invocation and its repo-root-absolute twin — plus, in each run's per-run copy, the run copy's exact twin of the second (`### The per-run profile` below) — that flag is declared once, in `cli/src/generators/outerLoopScripts.ts`, and the profile derives its entries from it, so a script cannot be allow-listed without a row saying it should be. The rest are run by the watcher process, the remote job, the agent runner or a person — the agent runner starts `docs-search-server.sh` from `.mcp.json` when `docs.retrieval` is on — except the walker's two: its gate library is sourced and its graph is read, both by `flow-walker.sh`, and neither is run. Four of the `no` rows (plus the deploy wrapper) are **withheld by basename from the script-allowlist guard's allow**. Being on that guard's deny list is not a refusal by it — it is the withdrawal of a permit: the guard grants nothing, emits nothing, and the invocation falls through to the permission profile, which carries no rule of any kind for these four and an `ask` for the deploy wrapper. So a dispatched agent that reaches for one is refused, never permitted, and those five basenames stay unreachable **as commands**: no command string an unattended run composes starts a run about itself, bounces the daemon supervising it, reaches the sweep's `git branch -D`, or dispatches, pauses or cancels a remote run through `remote-run.sh`. **That is a bound on command strings, not on the run.** `scratch-run.sh` is agent-invocable and `exec`s an interpreter on a file the agent wrote a moment earlier, so what a deny-listed basename does is reachable from inside a probe — its own header says so under *WHAT THIS DOES NOT CONTAIN*, and `docs/outer-loop-verification.md` §3 records the reach beside the split it measures. The layer that holds for a subprocess is the `pre-push` git hook. **That guard auto-allows the `no` rows that are run and not withheld — `create-worktree.sh`, `setup-worktree.sh`, `autonomous-format-stream.sh`, `autonomous-notify.sh` and `docs-search-server.sh` — deliberately**, and `scratch-run.sh` beside them: its `yes` row carries no deny entry either, which is what reaches it on an adoption whose profile has never been regenerated. Those six are the left-allowed set `plugin/hooks/README.md` and the guard's own `DENY_SCRIPT_BASENAMES` comment both name. `flow-walker.sh` is reached by both mechanisms on the same ground as `scratch-run.sh` — a `yes` row with no deny entry — through that row rather than through that list. All of it is bounded by the construct scan exactly as the yes rows are: a `no` in this column withholds a profile entry, never reachability. `plugin/hooks/README.md`'s `## The deny list` is the long form, with the per-entry reasons; `docs/outer-loop-verification.md` §3 measures both halves of the split against the shipped guard.

Each script's own header carries the rest — what it deliberately never does, its exit-code map where a caller switches on one, and a REPRO block that reproduces every one of its decisions by hand against a throwaway fixture. Those headers are authoritative; nothing here restates them.

### Where the family runs git in a run's copy, and under what pins

These scripts run outside the sandbox, and a run's working copy is a tree a sandboxed session wrote, whose commits can carry any content at any path. The classes: **(a)** a trusted tree — a fresh cut from the default branch's commit as origin reports it, or the main checkout's refs alone; **(b)** reads only — nothing the call reads can run code; **(c)** exposed — a planted payload reaches the call.

A run's copy is a clone: every copy `create-worktree.sh`, `remote-run.sh start` and `remote-run.sh review` make is one, recorded in the run registry with `copy_kind` `clone`. The legacy worktree arm holds until no worktree run is left (*Migration: both layouts until no worktree run is left*, below). Every row below holds on both arms, with the differences the `clone arm` rows and **The pins.** state.

| Site | Class before | What reached it | How it runs now |
|---|---|---|---|
| `autonomous-watcher.sh`, review reuse: the copy's branch | (b) | the `.git` pointer or worktree record (Linux) | read once from the main checkout (`hr_run_copy_check_var`) |
| review reuse: the clean test, formerly `status --short` | (c) | `config.worktree`'s fsmonitor; a nested repository's config; `modules/*/config`; `.gitattributes`; the pointer or record | pinned `diff` / `diff-index` with no hook and no fsmonitor (`hr_run_copy_clean`), plus the `copy` surface check |
| remote arm: `fetch` | (c) | `config.worktree` (`core.sshCommand`, `remote.*`); hooks; `modules/*/config` | `git -C <main>`, pinned, with the URL required in the main `.git/config` |
| remote arm: `merge --ff-only` | (c) | committed protected paths; `post-merge` / `reference-transaction`; fsmonitor; `.gitattributes` | plumbing fast-forward after the surface check (`hr_run_fast_forward_var`) |
| the artifact commit, formerly through `commit-on-branch.sh` | (c) on the review path, (a) on task and docs | commit hooks, which the wrapper ran then and runs none of now; `config.worktree`; the run's other staged paths | plumbing commit of one path, no hook (`hr_commit_placed`, through `hr_commit_paths_var`, the core `commit-on-branch.sh` now commits through too) |
| `hr_push_landed` | (c) through its fetch | `config.worktree`; hooks | reads and fetch in the main checkout |
| stall watchdog: `reset --hard HEAD` | (c) | committed protected paths; `reference-transaction`; fsmonitor; submodules; in job mode, the outer-loop scripts the post-session steps run | the copy check, then `doctor --job-surfaces` in job mode, then a surface-checked `read-tree --reset` (`hr_run_reset_var`) |
| `footprint_grade`: `rev-parse --show-toplevel` | (b) | nothing | unchanged |
| `create-worktree.sh`, default mode | (c) offline: a failed fetch was tolerated and the cut came from `refs/remotes/origin/<defaultBranch>` as it stood | a forged `refs/remotes/origin/<defaultBranch>` | (a): the branch cut in the main checkout from the commit origin reports (`hr_run_trusted_base_var`), exit 2 when that cannot be established; then cloned (`hr_clone_create_var`), bootstrapped by the main checkout's `setup-worktree.sh --target`, pushed from the main checkout, and the clone's `origin/<branch>` synced out |
| `create-worktree.sh --existing`, formerly `worktree add` and the branch's `setup-worktree.sh` | (c) | committed hooks (the branch's `reference-transaction` ran, probed while planning); committed protected paths; the branch's own scripts and configuration | surface check on the tip, a clone populated from that commit by `read-tree` under the main checkout's `GIT_DIR` with no hook (`hr_clone_create_var`, which repeats the surface check), and the main checkout's `setup-worktree.sh --target` |
| `setup-worktree.sh`, the branch's own | (c) | the branch's `commands.*` | run only as the main checkout's copy for an existing branch; its `commands.depInstall` and `commands.build` remain |
| `commit-on-branch.sh`, as the watcher called it | (c) | as the artifact commit | no longer called by the watcher. The wrapper now runs no commit hook and commits through the same `hr_commit_paths_var`, but the watcher still does not call it: it stages into the run's index, syncing the given paths there even when nothing is committed, and judges the run's copy, where `hr_commit_placed` leaves what the run staged alone |
| `cleanup-merged-worktrees.sh`: removing the copy | (c), destructive | the pointer or record (Linux); a record's `HEAD`; a clone's `HEAD` | the copy is the one the gone branch's registry record names, never one `git worktree list` finds. A clone: `hr_clone_remove_var`, which runs no git in it and removes it only when exactly one `copy_kind` `clone` record names it and it is `hr_worktree_dir` for that record's branch. A legacy worktree: `worktree remove --force` after the target check, plus equality with the gone branch's derived directory (`hr_worktree_dir`) |
| `restart-watcher.sh` | runs no git on a copy | — | unchanged |
| `remote-run.sh review`: mirror detection, `fetch`, `merge --ff-only`, `ls-tree HEAD`, `rev-parse HEAD`, the commit | (b) / (c) | as the watcher's rows | the same primitives |
| `remote-run.sh start`: the commit in a fresh cut | (a) | — | the same primitive |
| `remote-run.sh`: `lineage_commits_var`, and every `refs/remotes/origin/*` read | (b) / (a) | nothing | unchanged |
| `harness-run.yml`, the `run` job | (c) | the branch's own scripts, configuration, `.claude/settings*.json`, `.mcp.json` and hooks | a `doctor --job-surfaces` step before any of them ([`remote-execution.md`](remote-execution.md)). The job cuts no run copy: job mode treats the job's own checkout as both the main checkout and the run's copy, and on a runner that runs exactly one run a clone would add a copy and a sync for a checkout nothing else shares (the template's *WHY THE RUN JOB CUTS NO RUN COPY*) |
| every `run`-job `npm` / `npx` step, and the job-mode watchdog's `npx` | (c) when run in the checkout | a project `.npmrc` (`registry=`, `node-options=`) or `node_modules/` the run wrote | run from `runner.temp` / a `mktemp -d` directory, naming the repository with `--cwd`; the bootstrap's `commands.depInstall` and `commands.build` remain |
| clone arm: sync-in at the copy check, in each wrapper and at every run exit | (c) | the clone's `.git/config`; its hooks; a planted `shallow` or `info/grafts`; a substituted loose object | `git -C <main>` fetches the clone's `refs/heads/<branch>` with no destination under the family's pins, `cat-file -e` proves the tip arrived, then a compare-and-swap `update-ref` moves the main checkout's ref forward. A clone strictly behind the main checkout is healed by a compare-and-swap fast-forward of the clone's ref through `hr_clone_git`, its index and working tree moved with it by a two-tree `read-tree -m -u`, refused with nothing moved when a changed file is in the way; a diverged one is refused (`hr_copy_sync_in_var`, from `hr_run_copy_check_var` and the wrappers); the clone-side keys and programs measured against it are `docs/cli.md` §6, *the measured fetch pins* |
| clone arm: a branch move | (c) | the clone's `.git/config`; a planted `commondir`; a commit landing in the clone after sync-in | clone first: a compare-and-swap of the clone's `refs/heads/<branch>` against the tip sync-in read, then of the main checkout's; a failed main swap rolls the clone back by compare-and-swap (`hr_copy_ref_swap_var`: `0` both moved, `4` nothing moved, `5` the clone ahead and its rollback failed). Its callers are `hr_commit_paths_var`, `hr_run_fast_forward_var` and `refresh-branch.sh`; `push-branch.sh` runs its verify-only form, proving the clone's ref still holds the sync-in tip, before it pushes. Each clone-side `update-ref` runs through `hr_clone_git`: `GIT_DIR` and `GIT_COMMON_DIR` the clone's `.git`, `GIT_OBJECT_DIRECTORY` the main checkout's objects, no hook |
| clone arm: sync-out of a remote-tracking mirror | (c) | the clone's `.git/config`; a planted `commondir` | the two refs still moved main-first: `origin/<branch>` (`push-branch.sh`, and `create-worktree.sh` after the creation push) and `refresh-branch.sh`'s fetched base, each then set in the clone by `update-ref` through `hr_clone_git` (`hr_copy_sync_out_var`). Both are remote-tracking refs no run commits to |

**The pins.** Every call above that runs git in a run's copy runs no hook (`-c core.hooksPath=/dev/null`), with `-c core.fsmonitor=false -c submodule.recurse=false`, and `--ignore-submodules` / `--no-recurse-submodules` where it could recurse. Each runs either as `git -C <main>` (`hr_run_main_git`) or with `GIT_DIR=<main>/.git`, `GIT_INDEX_FILE=<record>/index` and `GIT_WORK_TREE=<copy>` (`hr_run_copy_git`), and names `refs/heads/<branch>`, never `HEAD`, so git never reads the record's `config.worktree`, `commondir` or `HEAD`, or the copy's `.git` pointer. On a clone the order is: sync in, healing a clone strictly behind the main checkout and refusing a diverged one; operate in the main checkout; move the clone's ref first, by compare-and-swap against the tip sync-in read, then the main checkout's, rolling the clone back on a failed main swap. The runners are the same — `git -C <main>` or `GIT_DIR=<main>/.git` — borrowing `<clone>/.git/index` where a worktree's record `index` is borrowed, so no runner call reads the clone's object store, `.git/config` or hooks; the clone-arm rows above are the exceptions: sync-in's fetch runs `git-upload-pack` in the clone, which reads its `.git/config`, refs and objects (through `objects/info/alternates`) under the measured fetch pins, and every clone-side `update-ref` — the heal, the swap and its rollback, sync-out — reads its `.git/config`, as do `hr_clone_create_var`'s own calls in the clone it has just made, before any session ran there; the clone itself is checked by `hr_wrapper_target_check_var`'s clone arm (a registry record naming it for its `HEAD`'s branch at `hr_worktree_dir`'s path, no planted `commondir`, `config.worktree` or `objects/info/http-alternates`, alternates naming the main checkout's objects only, and a `.git/config` within `hr_clone_config_spec`'s allow-list), and its branch is read once, from the registry-checked `HEAD`; `setup-worktree.sh --target <clone>` writes its hooks path into the clone's own `.git/config`. The main checkout is placed by `hr_wrapper_main_of`, the copy is checked by `hr_wrapper_target_check_var`, and the branch is read once by `hr_wrapper_branch_var`. Before a fast-forward, a reset or `--existing` writes a tree, that tree must equal the default branch at their merge base on the protected paths — `<githooksDir>`, `.mcp.json`, `.claude/settings.json` and `.claude/settings.local.json`, plus `<scriptsDir>/docs-search-server.sh` and `<scriptsDir>/lib` where docs retrieval applies, read from the main checkout's configuration (`hr_run_protected_rel_paths`, the mirror of `copySurfacePaths`) — and the copy's working tree must match too — for a reuse and before the watchdog's reset — judged through a fresh index read from the tip rather than the record's own `index`, whose skip-worktree and assume-unchanged bits a sandboxed session can set, with nothing untracked there. The default branch there is the commit origin reports at that moment (`hr_run_trusted_base_var`: `ls-remote`, then a fetch with no destination and `cat-file -e`), never a local ref, which a sandboxed session can write; an unreachable origin is a refusal. Every one of those calls also reads history as stored — `GIT_NO_REPLACE_OBJECTS=1` and `GIT_GRAFT_FILE=/dev/null` — because `refs/replace/` and `info/grafts` are sandbox-writable too, and a replace ref or a graft on the merge base would make the protected-path diff empty while the reset or fast-forward still writes the run's own tree. The default-mode cut of a new branch, and `doctor --job-surfaces`'s reads, do the same. A difference is refused, never restored. The artifact commit refuses a protected branch from the main checkout's configuration, hashes with `--no-filters` and leaves the copy's index clean; the state directory a dropped file is placed under is the main checkout's. The code is `lib/harness-run-lib.sh` → the section *The watcher family's git in a run's copy*.

What this leaves open — the bootstrap's configured commands, filter drivers, the copy check's one read, the bundle restore's writes, the bundle save's test-to-copy window and the trusted `stateDir` a checkout's own can differ from — is `docs/cli.md` §6 → *"Residuals, stated rather than hidden"*, the item opening *"The watcher family's git calls in a working copy a sandboxed session has written to"*. A clone borrows the main checkout's object store through `objects/info/alternates`, and its own objects reach that store only through sync-in's fetch, which hashes each one.

**Branch visibility.** On a clone the main checkout's `refs/heads/<branch>` moves at every wrapper commit, push and refresh (each syncs in first, and a commit or refresh then moves the clone's ref before the main checkout's) and at every run exit (§1, step 7). It can lag the clone in two cases only. A sandboxed commit made directly in the clone, which no flow issues, leaves it behind until the next of those moves. A branch move whose main-checkout swap and clone rollback both failed (`hr_copy_ref_swap_var`'s `5`: `commit-on-branch.sh`'s landed exit `1`, `refresh-branch.sh`'s exit `5`) leaves the clone ahead until the next sync-in carries the main checkout forward.

### The per-run profile

**Where it is.** Outside job mode the watcher never hands a session the base profile, `.claude/settings.autonomous.json`. At every spawn — a fresh launch, a park-resume and a pause-resume — it renders a per-run copy and passes that file as the one `--settings`, because Claude Code takes one. The path is the one `lib/harness-run-lib.sh` → `hr_run_profile_file <repo slug> <branch>` prints, under §5's machine state directory:

```
${XDG_STATE_HOME:-$HOME/.local/state}/autonomous-sdlc-harness/run-profiles/<repo slug>/<sanitized branch>.json
```

That directory is outside the run copy, the state directory and every other root the profile lets a session write, so a session cannot rewrite its own protection. The copy is re-rendered at every spawn, so a resume gets one derived from the current base.

**When it is removed.** `cleanup-merged-worktrees.sh` deletes the file once it has removed that run's copy, on the clone arm and the worktree arm alike, and before `git branch -D`. It finds the file at the path above through `hr_run_profile_file`, with the slug of the main checkout (`hr_repo_slug`), never through a glob. It keeps the file when the copy was not removed: a refused or skipped copy, a failed `worktree remove`, or a record whose copy is already gone. It also keeps the file when a record in a live status — `running`, `parked`, `park_loop` or `paused` — maps to the same file on a re-read of the registry just before the deletion. `--dry-run` prints `would remove run profile <file> for '<branch>'` and deletes nothing. Job mode writes no file, so there is nothing to sweep (`cleanup-merged-worktrees.sh`'s header, step 2; `cli/test/cleanup-run-copies.test.mjs`).

**Leftovers from before this fix.** Profiles left by runs swept before this release are not migrated, because the sweep finds a file only through a run's record and a file name cannot be mapped back to a branch. Remove them by hand while no run of this repository has status `running`:

```
rm -f -- "${XDG_STATE_HOME:-$HOME/.local/state}/autonomous-sdlc-harness/run-profiles/<repo slug>/"*.json
```

The watcher re-renders a run's profile at every spawn, so a parked, paused or not-yet-swept run gets a fresh one when it resumes. `<repo slug>` is the `this_repo=` field on the `machine lane:` line this command prints, run from the main checkout with `<scripts_dir>` your configured `scriptsDir`:

```
bash <scripts_dir>/autonomous-watcher.sh usage
```

**What it adds.** The base profile with exact paths appended to `sandbox.filesystem.denyWrite`, their `Edit` rules appended to `permissions.deny`, and the run copy's wrapper twins appended to `permissions.allow` and `permissions.ask`, each only when absent; nothing else changes (`autonomous-watcher.sh` → `run_profile_entries`, `run_profile_render`):

- the run copy's own protected surface (`hr_run_protected_rel_paths`, the mirror of `copySurfacePaths`), re-rooted from the base's sibling glob to the copy's exact path, because the Linux sandbox may skip a `denyWrite` entry containing `*` (`docs/cli.md` §6 → *"Residuals, stated rather than hidden"*);
- on a clone, its `.git/config`, `.git/hooks`, `.git/objects/info/alternates`, `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` — what `hr_wrapper_target_check_var`'s clone arm reads or refuses before an unsandboxed wrapper runs git there;
- on a legacy worktree, its `.git` pointer;
- the `.git` pointer of every other live linked worktree `git worktree list` names, which the base profile's sibling-glob `Edit` allow would otherwise reach;
- for every base `permissions.allow` and `permissions.ask` entry starting `Bash(bash <MAIN_REPO>/<scripts_dir>/`, its twin starting `Bash(bash <copy>/<scripts_dir>/`, appended to the same list in base order — the run copy's own wrappers by exact path, which the base cannot spell as a glob (`docs/cli.md` §6 → *"Every wrapper is allow-listed in two forms in the base"*), with the `ask` twins keeping a run copy's deploy wrapper asked about.

**The launch check.** Before every launch the watcher checks the file it is about to pass (`autonomous-watcher.sh` → `run_profile_check`), and refuses the launch unless:

- the base and the copy each parse as exactly one JSON object;
- the sandbox is on and strict — `sandbox.enabled` and `sandbox.failIfUnavailable` `true`, `sandbox.allowUnsandboxedCommands` `false` — or the profile's `_README` carries the sandbox opt-out's marker line and the opt-out's shape;
- removing exactly the entries appended to those four arrays gives back the base, compared as JSON;
- every entry appended to `sandbox.filesystem.denyWrite` or `permissions.deny` is a string;
- every entry appended to `permissions.allow` or `permissions.ask` is the run copy's twin of a base wrapper rule in the same list, else the refusal reads *"appends a permissions.allow or permissions.ask entry that is not the run copy's twin of a base wrapper rule"*. The job-mode check names no run copy, so it accepts no such entry.

Claude Code silently ignores a `--settings` file that fails its validation under `-p`, so the check reduces the copy's validity to the base's, which `doctor` grades. A refused check, or a copy that cannot be rendered, starts nothing: `watcher.log` carries `not launching '<branch>': <reason>`, and the record goes to `failed` with one `failed` notification naming the reason. What the check cannot reach — a base that itself fails Claude Code's validation — is the per-run profile's base-validity residual in `docs/cli.md` §6 → *"Residuals, stated rather than hidden"*.

**Job mode is the exception.** Under `autonomous-watcher.sh job` no per-run copy is rendered and nothing is written under the machine state directory: the same launch check runs on the base profile, which then goes to `--settings` unchanged. Two reasons, both in the watcher's *JOB MODE* header: job mode keeps the machine lane (both halves) off, and a per-run copy would equal the base, because in a job the run copy is the main checkout and the job's fresh checkout has no other linked worktree. A base that fails the check launches nothing, and the job records `failed`. `cli/test/watcher-remote-job.test.mjs` holds both.

### Migration: both layouts until no worktree run is left

A run-registry record with no `copy_kind` is a **legacy worktree run**: its copy is a linked worktree a release before the clone layout made. Nothing migrates it. A parked or paused one resumes in its worktree, under a per-run profile that protects its `.git` pointer; it commits and pushes through the wrappers' worktree arm; and `cleanup-merged-worktrees.sh` sweeps it from its registry record through the worktree arm, all unchanged, except that the worktree arm now removes the run's per-run profile after the worktree, as the clone arm does (§2, *The per-run profile*) (`cli/test/run-copy-migration.test.mjs`). Every copy made from here on is a clone.

To list the legacy runs a repository still has, run this from the main checkout, with `<state_dir>` your configured `stateDir`:

```bash
jq -r '.runs | to_entries[] | select(.value.copy_kind != "clone") | .key' <state_dir>/autonomous_logs/registry.json
```

The worktree arm's removal, in a later release, waits for that list to be empty: let each listed run finish under it first.

### The main-checkout anchor

**Set.** `spawn_engine` exports `HARNESS_MAIN_REPO` set to `<MAIN_REPO>` inside the engine subshell, unconditionally, so a value the watcher inherited is overwritten and no other child of the watcher sees it; every local launch, park-resume and pause-resume, and every `job`-mode run and automatic resume, goes through it (`autonomous-watcher.sh` → `spawn_engine`). `<MAIN_REPO>` itself is `hr_main_repo` of the watcher's own directory. The one other agent session the family starts, `remote-run.sh`'s mention session (`control_mention_session`), carries none, because its tool set is `Read,Grep,Glob` and runs no command.

**Read.** The plugin's readers resolve `<MAIN_REPO>` as the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain` (`plugin/instructions/dispatch_discipline_instructions.md` → `## Resolved values`). The generated profile allow-lists exactly that read as `Bash(printenv HARNESS_MAIN_REPO)` (`cli/src/core/mainRepoAnchor.ts` → `MAIN_REPO_ANCHOR_RULE`). The QA-lock helpers read the variable through `hc_main_root` (`plugin/hooks/lib/harness-config-lib.sh`) when it is an absolute directory whose `.git` is a directory with no `commondir`, and otherwise take the common-dir answer; no guard calls that function. A sandboxed command's `export` does not reach the session's next call, so a run cannot change the value it reads later. That, and the read from a linked worktree and from a clone, are `docs/sandbox-verification.md` → `### The main-checkout anchor (2026-10-20)`, rows AN1–AN4, all of which pass.

**Not read.** No outer-loop script reads it. The excluded wrappers place the main checkout from their own location through `hr_wrapper_main_of`, and every script the watcher runs places it through that or `hr_main_repo`, neither of which reads the variable (`lib/harness-run-lib.sh` → `hr_main_repo`): an assignment prefix on a call that runs outside the sandbox could set it.

**Graded.** `doctor`'s `profile-main-anchor` warns, and never fails, when the rule is missing from `permissions.allow` or sits in `ask` or `deny` (`docs/cli.md` §7).

**A session no launcher started.** A supervised session, a `claude` started by hand in a run copy, or a session whose profile lacks the rule gets no path from the read and resolves the fallback: from the main checkout or a linked worktree that is the main checkout, as before; in a clone it is the clone itself. Every run copy the launchers now make is a clone, so a session started by hand in one sets the variable on that one launch, from that clone, naming the main checkout with no trailing slash:

```bash
HARNESS_MAIN_REPO=/absolute/path/to/main/checkout claude
```

Never `export` it in a shell you go on using: every later session in that terminal, in any repository, would read it and act on this main checkout's inbox, registry, kill switch and QA locks.

---

## 3. The daemon

**Every verb of the `daemon` command is `docs/cli.md` §9's** — installing, starting and stopping this repository's daemon, and listing the ones installed on this machine — as are the backend detection, the launchd-is-driven / systemd-is-instructed split and the `--watcher` override. Three things belong to the loop rather than to the command:

**A daemon's identity is the repository it was installed from.** The launchd label `com.autonomous-sdlc-harness.watcher.<slug>` and the systemd unit `harness-watcher@<slug>.service` are keyed on a slug of that repository's own absolute path (the derivation is `docs/config.md` §4's `<launchd_label>` row) — the same slug every notification's title carries and the machine-level lane records as `observed_by.repo`. So a second repository on the machine installs a watcher of its own rather than overwriting the first, and identifying which daemon a message came from needs nothing but the message.

**Where its output goes.** All of it is under `<state_dir>/autonomous_logs/` in the main checkout:

| Path | Contents |
|---|---|
| `watcher.log` | the watcher's own line-per-decision log — what it routed, deferred, launched, killed |
| `watcher.out.log` / `watcher.err.log` | the service manager's capture of the process's stdout and stderr, named by the unit templates |
| `<branch>.log` | one run's readable transcript, formatted live and tailable while the run is going |
| `<branch>.stream.jsonl` | that run's raw `stream-json` events — the deep-debug copy, and what the usage gate reads |

The refusal lines a watcher prints when it will not start at all — an unreadable library, a location outside a repository, an unresolvable `harness.config.json` — go to **stderr**, and therefore to `watcher.err.log`, precisely because the log location is the thing that could not be resolved.

**A restart costs the runs in flight.** The service manager tears down the job's whole process tree — the watcher, each run's subshell and its agent child — and a killed run does **not** auto-resume: the reconcile pass marks it `failed` on the next tick, and only cleanly parked or paused runs are ever re-launched. Committed work is safe on the branch; continuing a killed run means re-launching its engine by hand in its working copy. That is why `restart-watcher.sh` **refuses by default** while a run is in flight and `--force` is how you say you meant it — and why it treats "the registry is there but cannot be read" as a refusal too, since reading *cannot tell* as *nothing is running* is a killed run. It delegates the stop/install pair to the CLI from the main checkout rather than composing a service label of its own, so the daemon can never be installed under one name and addressed by another. On a systemd host that delegation prints the `systemctl --user` commands rather than running them (`docs/cli.md` §9), so the bounce is complete only once you have run them — the script says so on the way out.

A restart is needed more often than that makes it sound: the service manager starts the watcher once and bash parses the file once, so **an edit to any script in §2 is inert in the live daemon until it is restarted**.

---

## 4. Pausing, parking and the usage gate

**The protocol is not defined here.** `plugin/instructions/autonomous_pause_and_ledger.md` is the canonical definition of the pause/resume protocol and of the flow-progress ledger a resumed run picks up from — the four sentinels, which are flat under `<state_dir>/`, who writes each one, and what a run must do before it yields. This section describes only the watcher's side of that lifecycle.

**The watcher's half is the cleanup and the re-launch.** A run honors a `PAUSE` by appending to `PAUSE_PROGRESS.md`, writing `PAUSE_ACK` and ending its session — after which nothing that run could do would remove anything, because it is gone. So the **watcher** is what removes `PAUSE`, `RESUME` and `PAUSE_ACK` when it acts on a resume, and what deliberately keeps `PAUSE_PROGRESS.md`: the ledger is the resumed run's input, and the sentinels are spent state that would otherwise re-trigger the same decision on the next pass. It then re-launches the same engine in the same working copy through the same launch path a fresh drop takes. In job mode a carried `PAUSE_PROGRESS.md` is not always kept; that rule is [`remote-execution.md`](remote-execution.md) → `### Resuming without the local watcher`, *The pause note belongs to the run that wrote it*.

**Parking is the same shape, on a different file.** A run that reaches a decision it must not take alone writes a `question_<n>.md` in its working copy's clarifications directory and ends its session; the watcher classifies that as `parked` from the question file alone, whatever the exit code — any numbered `question_<n>.md` still at the top level once the pairs a resume consumed are archived, answered or not, because an answered pair still there was written during the session and never read by it. A park is **one** question file holding every question of that park; a park written before that layout, as several files, follows the same rule. `/autonomous-sdlc-harness:branch-answer` lands the paired `answer_<n>.md`, and the park-resume pass re-launches the same engine once **every** open top-level question file has its answer, naming all of those answers in the resume prompt. It **leaves the pairs at the top level** where the re-entering run reads them while that session runs, and once it has exited by anything but a pause archives into `answered/` **every pair answered when that session launched** — the registry's `launch_answered_set`, written at every launch — with the resume's named set, `resumed_for_index`, among them. A pair written during the resumed session stays at the top level and waits for the next resume; a pause exit archives nothing and leaves both fields set. The protocol itself is the plugin's (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`). The watcher never writes an answer and never removes a question ahead of the run that has to consume it; a resume is also a launch as far as the kill switch, the cap and the lane are concerned, and a deferral there leaves every file exactly where the next pass expects it.

**A resume that makes no progress is bounded.** A session the park-resume pass launched that parks again is a **no-progress cycle** when either detector fires: it raised no question file above the highest index present at resume time, or it parked again less than `PARK_LOOP_WINDOW_SECS` (default `300`; `0` judges on the index alone) after the resume. Each cycle writes `resume made no progress (cycle <c>/<max>: <reason>)` to `watcher.log`. After `PARK_LOOP_MAX_CYCLES` (default `2`; `0` disables the guard) consecutive cycles the record becomes `park_loop` instead of `parked`, `watcher.log` carries `park loop — <c> consecutive resumes made no progress; not resuming it again`, one `park_loop` notification is sent, and no resume pass offers the run again. A progress cycle, a `completed` exit or a `failed` exit resets the count; a session the pause-resume pass launched is never counted. Answering a question does not release the hold. The clear action is to create the marker in the run's working copy, which `/autonomous-sdlc-harness:branch-status` prints with the real paths:

```
touch <worktree>/<state_dir>/clarifications/<branch>/PARK_LOOP_CLEAR
```

The next pass removes the marker, resets the count and sets the record back to `parked`, and the run resumes in that same pass when its park is answered.

The defaults are sized from this repository's own `watcher.log`, read on 2026-09-17: real park-resumed sessions ran 50m04s, 38m28s and 3h01m56s, and the spurious ones ran 41s and 39s, so a `300`-second window separates the two classes by a wide margin on both sides, and `2` cycles holds a loop after one repeat without holding a run whose single fast re-park was legitimate. The guard and the one-file-per-park layout exist because of the `feat_docs_catalog_retrieval` run that same day: it parked with three questions, was resumed once, parked again on `question_4.md`, and was then resumed twice more for answers it had already consumed — those two sessions are the 41s and 39s above. Branch `fix_watcher_multi_question_resume_loop` fixed it. This paragraph is the only place those timings are written.

The per-run brake `<state_dir>/STOP` inside one working copy is read by the run itself, not by the watcher; the watcher's brake is the global `<state_dir>/AUTONOMOUS_STOP` in the main checkout, which it honors before launching or resuming anything and **never removes** — a watcher that cleared its own brake would restart the very runs it was told to stop.

**The usage gate acts on the one signal no run can observe about itself.** Rate limits are account-global and are reported as `rate_limit_event` records on a run's *own* headless stream, which that run cannot read because it is producing it. The watcher tees every stream to `<branch>.stream.jsonl`, so it is the only component positioned to see the account's state — and it makes one decision from the newest events across every live run, applies it to all of them **through the ordinary pause protocol and nothing else**, and never kills anything. While a usage pause is in effect the hold marker is up, which is what defers a fresh inbox drop and skips the stall watchdog. A run the gate paused whose recorded reset time is missing is never left paused indefinitely: it is given the gate's one-hour fallback, which is logged and notified once. The hold marker is therefore bounded by the recorded or repaired time: a run stops holding it on the pass that drops its `RESUME`. A run paused **by hand** is never auto-resumed: the resume side acts on the `paused_by=usage` tag alone.

Its policy knobs, by name: `USAGE_CHECK_ENABLED`, `USAGE_CHECK_INTERVAL_SECS`, `USAGE_PAUSE_TRIGGER`, `USAGE_WARNING_DEBOUNCE`, `USAGE_RESUME_MARGIN_SECS`, `USAGE_SEVEN_DAY_PAUSE_PCT`, `USAGE_LANE_STATE_ENABLED`, `USAGE_LANE_LOCK_ENABLED` — and, for the stall watchdog that shares the same hold marker, `STALL_CHECK_ENABLED`, `STALL_WARN_SECS`, `STALL_KILL_SECS`, `STALL_MAX_RESTARTS`, `STALL_BUSY_CPU_PCT` — and, for the park-loop guard above, `PARK_LOOP_MAX_CYCLES`, `PARK_LOOP_WINDOW_SECS` — and, for the mode every run is launched in, `PERMISSION_MODE`. **Their defaults are the watcher's**, stated in its header and printed live by `autonomous-watcher.sh status`; that command's output is the answer to what a given machine is actually running with.

**None of them bounds burn rate:** parallelism × model × effort is the adopter's call, several concurrent high-effort runs will exhaust a rate-limit window that one would not, the lane bounds neither, and `MAX_PARALLEL_RUNS` is **per repository** — so the machine's ceiling is the sum of the caps of whatever is running at once.

**With `phases.qa` on, a test finding no free account is reported `blocked`, so give the credentials file at least as many accounts as runs you expect in their interactive-test phase at once — `MAX_PARALLEL_RUNS` is the upper bound.** Each interactive test locks its account under `<main>/<stateDir>/qa_user_locks/`, one lock set shared by every run of the repository, and a test that finds every account locked is not queued. A crashed run's lock is reclaimed by the next reserve that tries its slot once the lock is older than `QA_USER_LOCK_TTL` (default 7200 s).

**Changing one is an operator action, not a file edit.** `${XDG_CONFIG_HOME:-$HOME/.config}/autonomous-sdlc-harness/watcher.env` is sourced when it is a file and its absence is a silent no-op. Its scope is those tunables and nothing else — it is sourced after the anchors are resolved, so it cannot move the inbox, the logs or the kill switch — and a value in it **wins over the same variable inherited from the environment**, which is the opposite of the credential file's rule and worth knowing before an ad-hoc test disagrees with `status`. Credentials do not belong in it; they have their own file beside it (§6).

**`PERMISSION_MODE` defaults to `dontAsk`.** Under it a call the generated profile neither allows nor denies, or one that hits an `ask` rule, is refused at once, so a profile gap shows up as a refusal in the run's stream rather than as a session waiting on a prompt; it also refuses a host outside the sandbox's allowed domains, which is what holds where `strictAllowlist` is not honoured. A remote job reads the same variable, so it launches under `dontAsk` too. To restore prompting, set this line in `watcher.env`:

```
PERMISSION_MODE=acceptEdits
```

Under it such a call prompts, which an unattended run cannot answer, so it stalls the run. Neither value is a permission-bypass mode, deliberately: the generated profile's deny floor is what keeps an unattended run inside its lane, and bypassing it would make every refusal in that profile decorative.

**A remote run gets these mechanisms in the job, not from this daemon.** The usage gate, the stall watchdog and the park-loop guard run **inside the job**, as the watcher's own code under `autonomous-watcher.sh job`, on the job's own stream and knobs mapped from repository variables. The local passes skip every record carrying `execution: github-actions`: the vanished-process reconcile, the cap count, the stall watchdog and both halves of the usage gate. Nothing is relayed: `/autonomous-sdlc-harness:branch-pause`, `-resume` and `-answer` send a remote run's pause, resume and answers to GitHub themselves through `remote-run.sh`, and the parked, paused and park-loop passes skip a remote record, so a `PAUSE`, `RESUME`, answer file or `PARK_LOOP_CLEAR` in its mirror is never acted on. `AUTONOMOUS_STOP` gates none of those dispatches; the job-side brake is `HARNESS_REMOTE_STOP`. The machine lane stays local: job mode turns both halves off. What the job does after its own gate pauses a run is [`remote-execution.md`](remote-execution.md) → `### Resuming without the local watcher`.

**The gate above is per repository. §5 is per machine.** They bound different things, neither is derivable from the other, and §5's policy subsection is where that distinction is stated.

---

## 5. Machine-level usage lane

The rate-limit window an unattended run consumes belongs to the **account**. Every pause and resume decision the watcher makes is taken from **per-repository** files. Two watchers on one machine therefore each compute a resume time as though they were the sole consumer of that window: repository A pauses, repository B keeps spending it, A's resume time arrives already stale, A wakes, re-hits its own gate and pauses again — wake/pause churn with a wrong estimate on both sides.

The lane is the machine-scoped state those watchers agree through, in two halves. The **published assessment** is the record every watcher writes and reads, and it is on by default. The **advisory lock** is opt-in and off by default; when it is enabled it makes one repository the active one and the rest defer.

### The two paths

Both live in one machine-local directory, created `0700` and outside every repository:

```
${XDG_STATE_HOME:-$HOME/.local/state}/autonomous-sdlc-harness/
├── usage-state.json   the worst assessment any watcher has published
├── run-lane.lock/     a DIRECTORY; holds one `owner` file
└── run-profiles/      a DIRECTORY; the per-run settings copy the watcher re-renders at every spawn
```

`run-profiles/<slug>/<branch>.json` is not part of the lane: it is §2's *The per-run profile*, whose path `lib/harness-run-lib.sh` → `hr_run_profile_file` owns.

It is a plain path rather than a plugin option because the components that must reach it — the watcher (a shell script) and the CLI — cannot read plugin `userConfig` at all (`docs/development.md` §4). Machine-local here means a machine-local *path*.

### `usage-state.json`

```json
{
  "schema": 1,
  "state": "allowed|warning|overage|rejected|unknown",
  "resume_at": 1786575859,
  "observed_at": 1786575259,
  "observed_by": { "repo": "<repo slug>", "branch": "<branch>" }
}
```

| Field | Meaning |
|---|---|
| `schema` | Format version. A reader that does not recognise it treats the record as unreadable, which is the fail-open path below. |
| `state` | The publisher's account-level assessment. `unknown` means "no information", not "fine". |
| `resume_at` | Unix epoch second the triggering window is expected to have reset, margin included. `0` means the publisher reported no reset time. |
| `observed_at` | Unix epoch second the record was written. |
| `observed_by.repo` | The publishing repository's slug — the same identifier the daemon label and every notification carry. |
| `observed_by.branch` | The branch of the publishing checkout. A breadcrumb for an operator; nothing keys off it. |

The file is written **atomically** — a temp file in the same directory plus a rename — so a reader sees the previous record or the new one and never a half-written line. Both identity fields are reduced to a safe character set before they are written, because the record is produced with `printf` rather than a JSON writer.

**The merge rule — worst-wins.** A publisher replaces the stored record only when:

1. its own `state` ranks higher (`rejected` > `overage` > `warning` > `allowed` > `unknown`); or
2. the state ranks the **same** and its `resume_at` is **later** — the same state binding for longer is the worse fact for every consumer; or
3. the stored record is **spent**: its `resume_at` has passed, or it named no reset time at all (`resume_at` of `0`) and has aged past `HR_LANE_STATE_MAX_AGE_SECS` (default 21600 — one 5-hour window plus slack). Without that last clause a record naming no reset would pin the file for the life of the machine.

Otherwise the stored record stands and the publisher reports success: the shared record already carries something worse, which is the point.

**Reading it fails open.** An absent, unreadable, non-object or unparseable record reads as `unknown 0`, which defers nobody. Pausing on an unreadable machine-local file would put a machine-scoped fault in charge of run state; each repository's own usage gate is what pauses its runs. A consumer treats a state as a reason to hold off only while that state's `resume_at` is still in the future.

### `run-lane.lock`

A **directory**, holding one `owner` file whose single line is:

```
<repo slug> <pid> <acquired_at epoch>
```

It is a directory because `mkdir` is the atomic test-and-set available everywhere this ships: `flock(1)` is a util-linux program and is absent on macOS, and `noclobber` redirection is defeated by an inherited shell option. `mkdir` fails when the name exists — on both platforms and on the bash 3.2 floor.

**The protocol.**

| Step | Behaviour |
|---|---|
| Acquire | `mkdir` the lock directory; on success write `owner` and proceed. It **never blocks and never sleeps** — a caller that cannot take the lane defers and asks again on its next pass. |
| Already ours | A lock whose owner slug is our own is ours; the record is re-stamped so a restarted daemon's pid is the one liveness is tested against. |
| Held | A foreign owner within the ceilings below means "defer" — not an error, and nothing is written. |
| Release | Only the owner releases, and only once its repository has **no live run**. A watcher that cleared a lane it does not own would put two repositories on the machine at once. |

**The stale-breaker.** A lock is broken and re-taken when its owning pid no longer exists **and** its record has aged past `HR_LANE_LOCK_STALE_SECS` (default 900), or — whatever the pid says — when the record has aged past `HR_LANE_LOCK_MAX_AGE_SECS` (default 86400). Neither signal is sufficient alone:

- **A dead pid is not an idle machine.** A one-shot pass takes the lane, starts a run that outlives it, and exits; its pid is gone within the second while its run continues. Breaking on that alone would put two repositories on the machine every time.
- **A live pid is not a live holder.** Pids are recycled, so the long ceiling is what stops a lane being held by whatever process inherited the number.

Breaking **renames the lock directory aside** before emptying it, so a competing breaker that has already re-created the lock cannot have its fresh `owner` removed. For the same reason a lock too young to be stale is honored even when its `owner` file has not been written yet. A lost race is always resolved by *deferring*, never by two owners. The broken lock's previous owner is reported to the caller, which logs it — the shared library itself prints nothing.

### The policy: a coordinating record, and an opt-in lock

**Two mechanisms, two knobs, and one is not the other's switch.** The published assessment (`USAGE_LANE_STATE_ENABLED`, default `1`) *coordinates*: it carries the one fact a single repository cannot see for itself — what the rest of the machine has already observed of the shared window — it fails open, and by itself it defers nobody. The advisory lock (`USAGE_LANE_LOCK_ENABLED`, default `0`) *serializes*: it is deliberate single-file execution for a single-account operator who wants it, and as shipped it is not taken at all.

Two consequences worth stating plainly:

- **With the lock enabled, a second repository queues rather than fails.** A watcher that cannot take the lane leaves the dropped file in its inbox, writes no registry record, creates no working copy and touches no pause sentinel — the same deferral it makes for its own concurrency cap. Its next pass tries again. With the lock off, nothing here defers.
- **The lane is not a second concurrency cap.** The per-repository cap (`MAX_PARALLEL_RUNS`) bounds *how many* runs one repository has in flight; the lock bounds *which repository* runs at all. A repository holding the lock still obeys its own cap, and a repository that cannot take it starts nothing however much of its own capacity is free. Neither limit can be derived from the other.

**Which knob gates which path.** With `USAGE_LANE_STATE_ENABLED=1` the watcher consults the record before each of the three actions that start work — a fresh inbox drop, a park resume and a pause resume — and publishes its assessment on every usage-gate pass; at `0` it neither publishes nor consults. With `USAGE_LANE_LOCK_ENABLED=1` it also takes the lock immediately before the first step that creates anything and releases it as soon as it has no live run, so a repository waiting on it waits one poll interval rather than a whole run; at `0`, the default, no lock is taken or released.

### For a consumer written in TypeScript

**This section is the format of record.** A component in this package that has to read or write either artifact reads the two paths, the JSON shape, the merge rule and the lock protocol here rather than re-deriving one — the shell implementation in the outer-loop library (`hr_lane_*` in the generated `lib/harness-run-lib.sh`) and any second implementation must agree byte for byte on the directory name, both filenames, the `owner` line's three fields and the JSON keys above, or two components will each believe they hold the machine. Resolve the home directory through `cli/src/core/paths.ts` (`homeRoot()`), which is the CLI's single definition of it, and honor `XDG_STATE_HOME` first exactly as the shell half does.

**The machine-local registry of initialized repositories is a different artifact and is not defined here.** That one exists so cross-repository reporting can enumerate what is armed on this machine; it is not consulted before starting a run, it is not this lane, and nothing in this section describes it. It is defined in **§7**, which is its format of record as this section is the lane's: same directory, separate file, different writer and a different failure mode.

---

## 6. What a human must do, and what ships unexercised

`init` writes every script in §2, and `doctor` reports on what it can see from the repository — the watcher's presence, the daemon backend, the `jq` floor those scripts share. Three steps are still an operator's and cannot be generated. A repository that has been `init`-ed and left at that has an inbox nobody watches.

**Two of the three are reported by `doctor`, so running it is how you find out you owe them**: step 1 by the `repo-registry` check, which warns while no daemon has been installed from this checkout, and step 3 by `plugin-permissions`, which resolves the plugin's install root and prints the exact entries to paste (`docs/cli.md` §7). Step 2 is the one `doctor` grades but cannot make you owe — delivery is opt-in, and a repository with none configured is correctly configured.

**1. Install the daemon.** `daemon install` from the repository root, per `docs/cli.md` §9 — on systemd the unit is written and the `systemctl --user` commands are printed for you to run. Until then nothing polls the inbox: a dropped file simply sits there. Repeat it per repository; identity is per repository (§3), so there is no machine-wide arm-everything step.

**2. Configure notifications, or accept getting none.** Delivery is **opt-in and defaults to nothing pushed**: the shipped example (`cli/templates/claude/push-notify.env.example`) ships both keys empty, and with neither filled the notifier degrades to a desktop banner where one is available and still exits 0. Fill them in one of two places, in this order — the machine-local `${XDG_CONFIG_HOME:-$HOME/.config}/autonomous-sdlc-harness/push.env` first, the repository's configured `pushEnvPath` second; the first that exists wins and the other is not read. Machine-local comes first on purpose: a push token belongs to a person and a machine rather than to a checkout, and from there it cannot be committed by accident. **Filling that machine-local file is no longer only a hand step: `init` writes it for you from either an ntfy topic name or the full URL of any endpoint that accepts a POST**, and on a terminal `init` asks (`docs/cli.md` §2):

```bash
npx autonomous-sdlc-harness init --notifications --push-url <url-or-ntfy-topic>
```

Given the opt-in and no endpoint it writes nothing at all and prints the setup instead — an empty machine-local file would win this very precedence over a `pushEnvPath` that already has values. Writing either file by hand stays exactly as supported as it was, and by hand the file takes a full URL: an ntfy topic is written `https://ntfy.sh/<your-topic>`, and a URL containing shell characters such as `&` is single-quoted, because the file is sourced. The notifier itself is unchanged by the topic route, because what it reads is always a URL. The keys, what each delivery arm does with them and how a value already in the environment interacts with the file are `autonomous-notify.sh`'s header and that example file; nothing here restates them. Desktop banners are macOS-only and degrade to nothing on a Linux host, so on a systemd machine the push arms are the notification.

**3. Hand-add the permission entries the plugin's install root needs.** The helpers under the plugin's `scripts/` directory are invoked through `${CLAUDE_PLUGIN_ROOT}`, and the instruction files an unattended run reads its contracts from are resolved under the same root — a root that is machine-local and carries the plugin version in its path. `init` does not generate an entry naming it, and an unknowable root is not the reason — it is recorded per plugin in the agent runner's own `installed_plugins.json`; what stops the generator is that `init` may run before the plugin is enabled, and that a version-carrying path written once goes silently stale on the next upgrade. **The step is no longer one you have to know to look for: `doctor`'s `plugin-permissions` check resolves the root on every run and prints the exact lines to paste** (`docs/cli.md` §7), so run it and paste what it prints. It re-resolves rather than remembering, which is also what catches a plugin upgrade that has quietly moved the root out from under entries you pasted against the previous one. **What you paste survives a re-run of `init`, forced or not**: the profile is create-if-absent, so a plain re-run keeps the whole file, and the one run that does replace it — `init --force` — re-reads it first and carries forward every entry naming a plugin root this machine still resolves (`docs/cli.md` §3). An entry naming a root that has moved is the one exception, and only where the plugin does resolve here: the forced run drops it and names what it left behind, and `doctor` names it on every run after that, so a stale entry is reported rather than silently carried. On a machine where **no** plugin root resolves at all, nothing distinguishes such an entry from one you pasted this morning, so the forced run carries every absolute entry outside the checkout forward **unverified** and says so — what you pasted survives that shell too. `plugin/scripts/README.md` states the entry form, which helpers it covers — all of them — and the one qualification still standing on the measurement behind it. What a missing entry costs is a **refusal** at the first helper the run reaches, which is why it is worth doing before the first unattended run rather than after one is refused.

**Remote execution adds steps only the adopter can take, on GitHub** — committing the two workflows to the default branch, setting a credential secret, choosing a runner — and [`remote-execution.md`](remote-execution.md) → `## 7. Turning it on` lists them. `doctor`'s `remote-execution` check reports whether the ones visible from the checkout are owed, and `doctor --check-github` asks GitHub about the secrets and variables (`docs/cli.md` §7). The daemon from step 1 is still needed: it is what dispatches a remote run's start from a drop; an answer, resume, pause or user review is sent by the command itself, and nothing local has to be running while the job executes.

**What has been exercised, and what has not**, is not claimed here: `docs/outer-loop-verification.md` publishes it row by row — which of these scripts and paths are driven against fixtures, what each row's evidence is, and which parts of this loop ship unexercised because exercising them needs a real service manager, a real headless session or a real rate-limit window.

---

## 7. The repository registry

**Not the run registry.** `<state_dir>/autonomous_logs/registry.json` (§1) is per repository and records *runs*; this one is per machine and records *installations*. It holds no run state and answers one question: **which repositories on this machine have a daemon installed?** Cross-repository reporting is the whole of what it exists for — `daemon list` enumerates it, `doctor` reports whether the repository it was run in is in it, and the verbs are `docs/cli.md` §9's.

**This section is the format of record**, as §5 is the lane's. `cli/src/machine/registry.ts` is its only reader and its only writer in this package, and that module's header states the same rules in the same order; a second implementation, in any language, agrees with both or it is wrong.

### The path

```
${XDG_STATE_HOME:-$HOME/.local/state}/autonomous-sdlc-harness/repos.json
```

The same machine-local directory as §5's two artifacts — created `0700`, outside every repository — and a **separate file** in it, never merged into `usage-state.json`. The two have different writers, different lifetimes and different failure modes, and one file behind one merge rule would serve neither. The file is created `0600`: it names an account's checkouts.

### `repos.json`

```json
{
  "schema": 1,
  "repos": {
    "users-me-work-acme": {
      "root": "/Users/me/work/acme",
      "projectName": "acme",
      "label": "com.autonomous-sdlc-harness.watcher.users-me-work-acme",
      "backend": "launchd",
      "unitPath": "/Users/me/Library/LaunchAgents/com.autonomous-sdlc-harness.watcher.users-me-work-acme.plist",
      "registered_at": 1786575259
    }
  }
}
```

| Field | Meaning |
|---|---|
| `schema` | Format version. A reader that does not recognise it treats the whole record as unreadable, which is the fail-open path below — and is how a later release adds a field or a backend value without an older CLI half-understanding it. |
| *key* | The repository's slug: **the same `<slug>` the daemon's own identity is built from** (§3), derived from the repository root by the one function that names the unit. Keying on it is what makes an entry and the unit it describes unable to disagree, and what makes two checkouts unable to collide. |
| `root` | The repository root the daemon was installed from, absolute, as `git rev-parse --show-toplevel` answered it. |
| `projectName` | The descriptive name the unit file carries. For a human reading a listing; nothing keys off it. |
| `label` | The launchd label or systemd unit name — the string the service manager addresses this daemon by. |
| `backend` | `launchd` or `systemd`. |
| `unitPath` | Absolute path of the installed unit file, so a reader can tell whether it is still installed. |
| `registered_at` | Unix epoch second the entry was written. A breadcrumb; nothing keys off it. |

Entries are written in slug order, so the file is stable regardless of the order repositories were registered in. It is written **atomically** — a temp file in the same directory plus a rename — so a reader sees the previous record or the new one and never a half-written line, exactly as §5's state file is.

**Reading it fails open.** An absent, unreadable, unparseable, non-object or unrecognised-`schema` file reads as "no repositories are registered", and a single malformed entry is dropped rather than hiding the rest. Nothing consults this file before starting a run (below), so there is nothing a fault in it could correctly block — and it is *derived* state: every entry can be recreated by re-running `daemon install` in the repository it names, which is what makes rebuilding it from what was readable an acceptable trade rather than a loss.

### Who writes it

**`daemon install`, and nothing else.** The three commands that plausibly might, and why they do not:

| Command | Why not |
|---|---|
| `init` | A wired repository with no daemon polls nothing. Registering at `init` would list repositories that never run. |
| `doctor` | It repairs nothing and writes nothing — that is the contract that makes it safe in CI, and a read-only command must not mutate machine state. |
| `daemon stop` | The unit file survives a stop. This is an index of **installed** units, not of running ones. |

### When an entry goes stale

A registered repository can move, be deleted, stop being a repository, or have its unit removed by hand. Each is **reported and never removed by a read**:

| State | What it means |
|---|---|
| `ok` | The root is still a repository root and the unit file is still there. |
| `root-missing` | Nothing is at `root` any more — including an unmounted volume, which is why nothing is dropped on the strength of it. |
| `not-a-repository` | Something is at `root`, but it is not a repository root any more (a deleted-and-recreated directory, a pruned worktree). |
| `unit-missing` | The repository is fine; `unitPath` is gone, so the daemon is registered and not installed. |

One state per entry, graded in that order: a root that is gone makes "is it still a repository" unanswerable rather than false. **Pruning is an explicit action, `daemon list --prune`** — never a side effect of listing or of a `doctor` run.

### What is reported from it

Two consumers render it and only render it: `autonomous-watcher.sh status` and `doctor`'s `machine-footprint` check. Each prints, per entry, the **slug, `projectName`, `root` and state**, then — for an `ok` entry — its **model, effort, live-run count and per-repository cap**, then one summary of **armed / stale / live** counts. A stale entry carries no model, effort or live cell: the checkout those are read from is gone or is no longer a repository, so `doctor` omits them and `autonomous-watcher.sh status` prints `—` in their place.

An `ok` entry whose `harness.config.json` cannot be read is the third row shape: it carries **no model and no effort** — `doctor` prints `unknown` with the read's reason, `autonomous-watcher.sh status` prints `—` — and its **live cell is `0` in both halves**, because neither can locate a `stateDir` to read a run registry from and neither guesses the schema default. It is still counted **armed**: the grade is the registry entry's, not the configuration's.

The cap cell carries the machine-local `watcher.env` default a daemon inherits (§4), not that daemon's effective cap: a foreign daemon's own environment override is not derivable from the report. `autonomous-watcher.sh status` is the one exception, on **its own** row only, where it prints the value it actually resolved. That is a limit of the report, not a change of the cap's scope — `MAX_PARALLEL_RUNS` is per repository either way.

An entry whose state is not `ok` is reported **stale** rather than counted as armed. Both consumers grade by the four-state table above, and both take the same value in every cell of the three row shapes above, so the shell half and `cli/src/machine/registry.ts` cannot report one machine differently. The two differ only in **wording**: the cap cell's own-row exception and the `unknown` / `—` spelling of an unread model or effort.

### What it is not

- **It is not consulted before starting a run.** That is §5's lane, and only §5's. Nothing in this file may become a precondition of anything: at worst a stale registry costs a wrong line in a listing — and the report above is advisory and fail-soft on the same terms, so deleting, truncating or corrupting the file leaves every run start unaffected and degrades `doctor` to a warning.
- **A daemon installed from a git worktree registers that worktree, which is correct rather than a bug.** A daemon's identity is the repository it was installed from (§3), and the unit it installs both runs in and works from that same checkout — so the entry has to describe the checkout the unit does. Two worktrees of one repository are two rows here, exactly as they are two daemons.
