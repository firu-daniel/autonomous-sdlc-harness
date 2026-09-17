# The watcher

**Who reads this:** someone running the outer loop — arming a repository's watcher, debugging why a dropped file did not become a run, or writing a component that has to agree with the watcher about machine-scoped state. It answers what the watcher does with what it finds, what it refuses, and where its state lives.

---

## 1. The loop in one page

A run starts as a **file** and ends as a **notification**. There is no queue server, no webhook and no scheduler in between: a file appears in the inbox, and the next poll pass acts on it. Everything the watcher itself decides is in the eight steps below; everything a run then does — planning, implementing, reviewing, shipping — belongs to the engine command the drop is bound to, which the watcher launches and never inspects.

1. **The drop.** One file is written into `<MAIN_REPO>/<state_dir>/autonomous_inbox/` — by `/branch-prompt`, by `/branch-user-review`, or by hand for a docs checklist, which no shipped command writes. `<MAIN_REPO>` is the first working copy `git worktree list` reports, and every central artifact lives under it — the inbox, the logs, the registry, the kill switch — whichever sibling working copy a run executes in.
2. **The filename decides the run.** It selects the engine command, the working-copy strategy and where the dropped file lands, all three at once (the table below). The three patterns are anchored suffixes and mutually exclusive, so a branch whose own name contains `review` or `task_prompt` is not mis-routed. A name matching none of them is archived as `rejected_<timestamp>_<name>` and no registry record is written for it.
3. **The guards, in one order.** The global kill switch `<state_dir>/AUTONOMOUS_STOP`, then the usage hold, then the per-repository concurrency cap (`MAX_PARALLEL_RUNS`), then a duplicate drop for a branch already running, then a `parked` or `paused` record that already owns this branch's working copy, and **last**, only when `USAGE_LANE_LOCK_ENABLED=1`, the machine-level lane lock (§5) — taken immediately before the first step that creates anything, because taking it commits the whole machine to this repository. That knob is off by default, so as shipped the last guard passes without taking anything. The kill switch, the usage hold, the cap and the lane all **defer**: the file stays in the inbox, no record is written, and a later pass picks it up with nothing to re-drop by hand. The duplicate drop and the branch-owning record are **archived** instead, because waiting would not make either a different file — and the owning record is left byte-identical, so its own resume path still works.
4. **The working copy is prepared** by the strategy the pattern names — a fresh sibling copy off `defaultBranch` (`create-worktree.sh`), or the branch's existing copy reused in place when it is clean and usable, else recreated for that existing branch (`create-worktree.sh --existing`, which never pushes).
5. **The artifact is placed, and for two of the three patterns committed.** A task prompt and a docs checklist are copied in and committed through `commit-on-branch.sh`, then pushed as a separate statement through `push-branch.sh`; a review file is placed and deliberately not committed, because the flow's own commits pick it up. Either commit path is non-blocking — a failed commit or push is one warning line in the run log and the run launches anyway. The inbox file is archived as `.processed/<timestamp>_<name>`.
6. **The engine is launched headless**, in a detached subshell whose working directory is the prepared copy: one `-p` session of the bound slash command, run with the generated permission profile through `--settings`, the model from `agentModel`, the effort level from `agentEffort` when that key is set, and `--output-format stream-json`. The raw events are teed to `<state_dir>/autonomous_logs/<branch>.stream.jsonl` — the copy the usage gate parses — and the same stream is formatted into the readable `<branch>.log` by `autonomous-format-stream.sh`.
7. **The session's exit is classified** from the engine's own exit code plus the sentinels it left behind, into one of the four terminal states in the table below, recorded in `<state_dir>/autonomous_logs/registry.json`.
8. **One notification per lifecycle event** — `launched`, `completed`, `parked`, `paused`, `failed`, `resumed` — through `autonomous-notify.sh`, whose header is where that vocabulary is normative.

**The three patterns.**

| Inbox filename | Engine command | Working copy | The dropped file lands at |
|---|---|---|---|
| `<branch>_task_prompt.md` | `/branch-start-plan-autonomous` | fresh, off `defaultBranch`, branch pushed | `<state_dir>/task_prompts/<branch>_task_prompt.md` — **committed** before launch |
| `<branch>_review[_<n>].md` | `/branch-start-user-review-fix-autonomous` | the branch's existing copy when it is usable, else recreated for that branch | `<state_dir>/user_reviews/<the dropped filename>` — **not committed**, round suffix intact |
| `<branch>_docs.md` | `/branch-start-docs-autonomous` | fresh, as the task path | `<state_dir>/docs_catalog/<branch>_docs.md` — **committed** before launch |

The watcher derives only the **branch** from the name, never the review round: the engine resolves the latest round inside the working copy, so nothing out here has to remember one.

**The status vocabulary — one live state and four a session ends in.** The registry is a single object shaped `{"runs": {"<branch>": {…}}}` and this vocabulary is a contract — `/branch-status`, `/branch-answer`, `/branch-pause`, `/branch-resume` and `restart-watcher.sh` all read it — stated normatively in the watcher's own header.

| `status` | Reached when | What ends it |
|---|---|---|
| `running` | the run was launched or resumed | one of the four below, or the reconcile pass when its process vanished |
| `completed` | the session ended cleanly with no park or pause signal — the branch is ready for review | an operator. A later review drop re-uses the same record, flipping it back to `running` |
| `parked` | the run wrote an unanswered clarification question and yielded | `/branch-answer` writes the paired `answer_<n>.md`; the park-resume pass re-launches the same engine in the same working copy |
| `paused` | the run honored a `PAUSE` request and yielded at a clean checkpoint (§4) | a `RESUME` sentinel — dropped by `/branch-resume`, or by the usage gate for a run it paused itself |
| `failed` | a non-zero exit, a vanished process, or a stall past the restart cap | an operator; nothing re-launches a failed run |

A `parked` or `paused` run costs nothing while it waits: its session is over, and the resume passes are what bring the same engine back in the same working copy.

---

## 2. The scripts

Two families ship into the adopter's configured `scriptsDir`, and the difference between them is what a re-run of `init` means for each.

- **Project-command wrappers** — type-check, test, dev-server and deploy — are *rendered*: their body is the command line stack detection resolved, substituted when the file is written. They are documented in `cli/templates/scripts/README.md`.
- **Outer-loop scripts** — this table — carry **no token at all** and are copied verbatim. Each one resolves `<repo_root>/harness.config.json` at run time through the one shared library beside them, so **changing a configuration key takes effect on the next invocation without regenerating anything**. That is not a convenience: a protected-branch set frozen into a file when `init` ran would enforce the wrong set the moment `protectedBranches` changed, and silently. For an adopter upgrading the CLI, who would otherwise read a plain re-run as picking a fix up: these files are written `create-if-absent`, so a fix shipped in a later release reaches a checkout that already has the file only through `init --force` — which copies it to a `.bak` sibling and re-writes it — or by deleting the file and re-running `init`, and §3's restart is still owed after either (`docs/cli.md` §3 states the policy and this corollary).

| File | What it does | Who runs it | Profile allow entry |
|---|---|---|---|
| `lib/harness-run-lib.sh` | The one reader of `harness.config.json` for this family: anchors, state paths, the protected-branch answer, the machine-level lane primitives | sourced by every row below; never executed, and it ships without an executable bit | no |
| `commit-on-branch.sh` | Stages exactly the paths it was given and commits, refusing a protected branch | dispatched agents, and the watcher's own artifact commit | **yes** |
| `push-branch.sh` | Pushes the current non-protected branch, and never aborts its caller | the same callers, always as a separate statement | **yes** |
| `refresh-branch.sh` | Merges the configured default branch **into** the checked-out branch, refusing when HEAD is on a protected one; never pushes | an operator repairing a stale base; a dispatched agent once an instruction names it — no shipped instruction does yet (`docs/outer-loop-verification.md` §4) | **yes** |
| `scratch-run.sh` | Runs one file in the interpreter that file's extension names, refusing any argument that does not resolve inside `<state_dir>/scratch/` | a dispatched agent running a language probe or a mutation check | **yes** |
| `create-worktree.sh` | Creates the sibling working copy a run executes in, then hands off to `setup-worktree.sh` | the watcher; an operator by hand | no |
| `setup-worktree.sh` | Bootstraps the checkout it sits in — machine-local links, the pre-push backstop, dependencies, build | `create-worktree.sh`; an operator repairing a stale checkout | no |
| `docs-search-server.sh` | Starts the docs-retrieval MCP server for the checkout it sits in, by `exec`ing the machine-shared runtime's `docs serve`; exits 1 naming `init` when no runtime is installed (`docs/retrieval.md` → `## How it fits together`) | the agent runner, from `.mcp.json`, when `docs.retrieval` is on | no |
| `cleanup-merged-worktrees.sh` | Removes the working copy and local branch of a run whose remote branch is `[gone]` | the watcher, throttled at the end of a pass | no — also **withheld** by the script-allowlist guard |
| `autonomous-format-stream.sh` | Turns `stream-json` events into one short line per event | the watcher, as the tail of the launch pipeline | no |
| `autonomous-notify.sh` | Turns a lifecycle event into a desktop banner and a best-effort push | the watcher; an operator checking delivery | no |
| `autonomous-watcher.sh` | The loop in §1 | the service manager, or an operator for one `tick` / `status` / `usage` | no — also **withheld** by the script-allowlist guard |
| `restart-watcher.sh` | Bounces this repository's daemon after one of these files is edited (§3) | an operator | no — also **withheld** by the script-allowlist guard |

**Why only four carry a profile entry, and why that is not the reachability answer.** The generated permission profile emits allow entries for exactly the rows marked yes, in the three literal forms a caller may spell them — that flag is declared once, in `cli/src/generators/outerLoopScripts.ts`, and the profile derives its entries from it, so a script cannot be allow-listed without a row saying it should be. The rest are run by the watcher process, the agent runner or a person — the agent runner starts `docs-search-server.sh` from `.mcp.json` when `docs.retrieval` is on — and three of them (plus the deploy wrapper) are **withheld by basename from the script-allowlist guard's allow**. Being on that guard's deny list is not a refusal by it — it is the withdrawal of a permit: the guard grants nothing, emits nothing, and the invocation falls through to the permission profile, which carries no rule of any kind for these three and an `ask` for the deploy wrapper. So a dispatched agent that reaches for one gets a prompt it cannot answer, never a silent permit, and those four basenames stay unreachable **as commands**: no command string an unattended run composes starts a run about itself, bounces the daemon supervising it, or reaches the sweep's `git branch -D`. **That is a bound on command strings, not on the run.** `scratch-run.sh` is agent-invocable and `exec`s an interpreter on a file the agent wrote a moment earlier, so what a deny-listed basename does is reachable from inside a probe — its own header says so under *WHAT THIS DOES NOT CONTAIN*, and `docs/outer-loop-verification.md` §3 records the reach beside the split it measures. The layer that holds for a subprocess is the `pre-push` git hook. **That guard auto-allows the other five `no` rows — `create-worktree.sh`, `setup-worktree.sh`, `autonomous-format-stream.sh`, `autonomous-notify.sh` and `docs-search-server.sh` — deliberately**, and `scratch-run.sh` beside them: its `yes` row carries no deny entry either, which is what reaches it on an adoption whose profile has never been regenerated. Those six are the left-allowed set `plugin/hooks/README.md` and the guard's own `DENY_SCRIPT_BASENAMES` comment both name. All of it is bounded by the construct scan exactly as the four yes rows are: a `no` in this column withholds a profile entry, never reachability. `plugin/hooks/README.md`'s `## The deny list` is the long form, with the per-entry reasons; `docs/outer-loop-verification.md` §3 measures both halves of the split against the shipped guard.

Each script's own header carries the rest — what it deliberately never does, its exit-code map where a caller switches on one, and a REPRO block that reproduces every one of its decisions by hand against a throwaway fixture. Those headers are authoritative; nothing here restates them.

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

**The watcher's half is the cleanup and the re-launch.** A run honors a `PAUSE` by appending to `PAUSE_PROGRESS.md`, writing `PAUSE_ACK` and ending its session — after which nothing that run could do would remove anything, because it is gone. So the **watcher** is what removes `PAUSE`, `RESUME` and `PAUSE_ACK` when it acts on a resume, and what deliberately keeps `PAUSE_PROGRESS.md`: the ledger is the resumed run's input, and the sentinels are spent state that would otherwise re-trigger the same decision on the next pass. It then re-launches the same engine in the same working copy through the same launch path a fresh drop takes.

**Parking is the same shape, on a different file.** A run that reaches a decision it must not take alone writes a `question_<n>.md` in its working copy's clarifications directory and ends its session; the watcher classifies that as `parked` from the unanswered question alone, whatever the exit code. When `/branch-answer` lands the paired `answer_<n>.md`, the park-resume pass re-launches the same engine for the lowest answered index — and **leaves the pair at the top level** where the re-entering run reads it, archiving it into `answered/` only once that resumed session has exited. The watcher never writes an answer and never removes a question ahead of the run that has to consume it; a resume is also a launch as far as the kill switch, the cap and the lane are concerned, and a deferral there leaves every file exactly where the next pass expects it.

The per-run brake `<state_dir>/STOP` inside one working copy is read by the run itself, not by the watcher; the watcher's brake is the global `<state_dir>/AUTONOMOUS_STOP` in the main checkout, which it honors before launching or resuming anything and **never removes** — a watcher that cleared its own brake would restart the very runs it was told to stop.

**The usage gate acts on the one signal no run can observe about itself.** Rate limits are account-global and are reported as `rate_limit_event` records on a run's *own* headless stream, which that run cannot read because it is producing it. The watcher tees every stream to `<branch>.stream.jsonl`, so it is the only component positioned to see the account's state — and it makes one decision from the newest events across every live run, applies it to all of them **through the ordinary pause protocol and nothing else**, and never kills anything. While a usage pause is in effect the hold marker is up, which is what defers a fresh inbox drop and skips the stall watchdog. A run paused **by hand** is never auto-resumed: the resume side acts on the `paused_by=usage` tag alone.

Its policy knobs, by name: `USAGE_CHECK_ENABLED`, `USAGE_CHECK_INTERVAL_SECS`, `USAGE_PAUSE_TRIGGER`, `USAGE_WARNING_DEBOUNCE`, `USAGE_RESUME_MARGIN_SECS`, `USAGE_SEVEN_DAY_PAUSE_PCT`, `USAGE_LANE_STATE_ENABLED`, `USAGE_LANE_LOCK_ENABLED` — and, for the stall watchdog that shares the same hold marker, `STALL_CHECK_ENABLED`, `STALL_WARN_SECS`, `STALL_KILL_SECS`, `STALL_MAX_RESTARTS`, `STALL_BUSY_CPU_PCT`. **Their defaults are the watcher's**, stated in its header and printed live by `autonomous-watcher.sh status`; that command's output is the answer to what a given machine is actually running with.

**None of them bounds burn rate:** parallelism × model × effort is the adopter's call, several concurrent high-effort runs will exhaust a rate-limit window that one would not, the lane bounds neither, and `MAX_PARALLEL_RUNS` is **per repository** — so the machine's ceiling is the sum of the caps of whatever is running at once.

**Changing one is an operator action, not a file edit.** `${XDG_CONFIG_HOME:-$HOME/.config}/autonomous-sdlc-harness/watcher.env` is sourced when it is a file and its absence is a silent no-op. Its scope is those tunables and nothing else — it is sourced after the anchors are resolved, so it cannot move the inbox, the logs or the kill switch — and a value in it **wins over the same variable inherited from the environment**, which is the opposite of the credential file's rule and worth knowing before an ad-hoc test disagrees with `status`. Credentials do not belong in it; they have their own file beside it (§6).

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
└── run-lane.lock/     a DIRECTORY; holds one `owner` file
```

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

**2. Configure notifications, or accept getting none.** Delivery is **opt-in and defaults to nothing pushed**: the shipped example (`cli/templates/claude/push-notify.env.example`) ships both keys empty, and with neither filled the notifier degrades to a desktop banner where one is available and still exits 0. Fill them in one of two places, in this order — the machine-local `${XDG_CONFIG_HOME:-$HOME/.config}/autonomous-sdlc-harness/push.env` first, the repository's configured `pushEnvPath` second; the first that exists wins and the other is not read. Machine-local comes first on purpose: a push token belongs to a person and a machine rather than to a checkout, and from there it cannot be committed by accident. **Filling that machine-local file is no longer only a hand step: `init --notifications --push-url <url>` writes it for you**, and on a terminal `init` asks (`docs/cli.md` §2). Given the opt-in and no endpoint it writes nothing at all and prints the setup instead — an empty machine-local file would win this very precedence over a `pushEnvPath` that already has values. Writing either file by hand stays exactly as supported as it was. The keys, what each delivery arm does with them and how a value already in the environment interacts with the file are `autonomous-notify.sh`'s header and that example file; nothing here restates them. Desktop banners are macOS-only and degrade to nothing on a Linux host, so on a systemd machine the push arms are the notification.

**3. Hand-add the permission entries the plugin's install root needs.** The helpers under the plugin's `scripts/` directory are invoked through `${CLAUDE_PLUGIN_ROOT}`, and the instruction files an unattended run reads its contracts from are resolved under the same root — a root that is machine-local and carries the plugin version in its path. `init` does not generate an entry naming it, and an unknowable root is not the reason — it is recorded per plugin in the agent runner's own `installed_plugins.json`; what stops the generator is that `init` may run before the plugin is enabled, and that a version-carrying path written once goes silently stale on the next upgrade. **The step is no longer one you have to know to look for: `doctor`'s `plugin-permissions` check resolves the root on every run and prints the exact lines to paste** (`docs/cli.md` §7), so run it and paste what it prints. It re-resolves rather than remembering, which is also what catches a plugin upgrade that has quietly moved the root out from under entries you pasted against the previous one. **What you paste survives a re-run of `init`, forced or not**: the profile is create-if-absent, so a plain re-run keeps the whole file, and the one run that does replace it — `init --force` — re-reads it first and carries forward every entry naming a plugin root this machine still resolves (`docs/cli.md` §3). An entry naming a root that has moved is the one exception, and only where the plugin does resolve here: the forced run drops it and names what it left behind, and `doctor` names it on every run after that, so a stale entry is reported rather than silently carried. On a machine where **no** plugin root resolves at all, nothing distinguishes such an entry from one you pasted this morning, so the forced run carries every absolute entry outside the checkout forward **unverified** and says so — what you pasted survives that shell too. `plugin/scripts/README.md` states the entry form, which helpers it covers — all of them — and the one qualification still standing on the measurement behind it. What a missing entry costs is a **silent stall** rather than a refusal, which is why it is worth doing before the first unattended run rather than after one parks with no error.

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
