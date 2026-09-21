# Outer-loop verification

**Who reads this:** anyone changing a script under `cli/templates/scripts/` — the watcher, the git wrappers, the worktree scripts, the cleanup sweep, the notifier, the four project-command wrappers — or the permission surface that decides which of them an agent may run. It records what those scripts **do** when driven, as rows a later change re-runs rather than re-argues. `docs/guard-verification.md` covers the composed `PreToolUse` guard set; **this file covers the outer loop**, and §3 is the one place they meet.

These are the only shipped assets that mutate a repository — `git commit`, `git push`, `git worktree remove`, `git branch -D`, `kill` — so a claim about them that nothing re-runs is exactly the shape that regresses silently.

**Whole-set run of record: 2026-08-13**, on the machine named in §0. Every row below was produced in that run, not quoted from the task that shipped the script.

**Drift since that stamp, disclosed rather than restamped.** Nine of the eleven files §0 measures changed afterwards — re-derive the set with `git log -1 --date=short --format=%ad` over the `OUTER_LOOP_SCRIPTS` rows and compare each against the stamp above, then grade each changed file's diff against the last commit dated at or before the stamp: `git diff <that commit> HEAD -U0 -- <path> | grep -E '^[+-]' | grep -vE '^[+-][[:space:]]*#'`. A file **created** after the stamp is graded by the same rule, which puts it among the changed with its whole non-comment body as executable change. Four carry executable change:

- `autonomous-watcher.sh` — a conditional `--effort` flag on the launch line §2 drives; `launch_run` clearing `paused_by`, `usage_resume_at` and any left-over `PAUSE`/`RESUME`/`PAUSE_ACK` on a reused branch key; and the **minimal-environment bootstrap replaced** (`fix_harness_watcher_shim_path`) — the unconditional `PATH` prepend is now `PATH="$(hr_path_with_fallbacks)"`, which appends only the fallback directories absent from the inherited value, and the `SCRIPT_DIR`/library-source block moved **above** it and dropped its `dirname` fork. Every row in §1 and §2 that ranges over this script was driven under the old prepend, so each was measured on a `PATH` the shipped file no longer produces.
- `lib/harness-run-lib.sh` — `agentEffort` added to the configuration loader's projection, plus the `hr_agent_effort` accessor that reads it, and `hr_path_with_fallbacks` (`fix_harness_watcher_shim_path`), the pure builtin-only `PATH` policy the watcher's bootstrap now calls. Every row-driving script sources this file.
- `create-worktree.sh` — the default arm's remote precondition (an `origin` check and an `origin/<default branch>` check, each exiting 2, with the fetch between them made tolerant) and the bootstrap resolution's second path with its exit-4 refusal. §1.3 carries both, and every one of those rows was driven on **2026-08-31** in the round §1.3 stamps — on `init`-built fixtures, one per row and one per perturbation.
- `refresh-branch.sh` — created after the stamp, so the whole of it is executable change under the rule above. No row of the 2026-08-13 round ranges over it; §1.8 is its own matrix, driven separately.

The other five — `commit-on-branch.sh`, `push-branch.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh`, `autonomous-notify.sh` — have comment-only diffs since the stamp, so no §1 row's mechanism moved. Any later touch to a template re-stales this count; re-run the recipe rather than editing the number.

**Not re-confirmed by a run:** §2 in full — except §2.4's machine-lane block, re-driven whole on 2026-09-03 and stamped there — and every §1 row that reads configuration through the run library. §0's write precondition is the exception the §1.8 round closed — its generator, `cli/src/generators/outerLoopScripts.ts`, changed after the stamp too, and that round re-ran the precondition for all eleven files on a real `init` fixture. No row here measures the effort flag at all. Restamping means re-running §0's recipe whole; this note is what the re-run deletes, never what it edits. Two cells — the shim-reach sentence in §1.6 and the `hr_main_repo` row of §2.4 — rest on a `node:test` case against an `init`-built fixture rather than a §0 recipe row, and are marked as such where they appear.

---

## 0. Method and fixtures

Every row came from the recipe here. A measurement that does not follow it is not comparable, and replacing a row means re-running the recipe rather than editing the cell.

**The rule that separates this file from a checklist.** A row records an observed outcome **and the perturbation that moves it**. A row with no perturbation is an *assertion*, not a measurement: it says what happened once and cannot tell whether the mechanism named in the row is the mechanism that produced it. Where a row's perturbation is another row, the two are adjacent and the second is marked as the partner. Where a perturbation was driven and **did not** move the row, that is recorded too — it is the more interesting result.

**The fixture repositories.** Built under the system temp directory, never inside a real checkout, and removed in process. Each is:

- `git init` with an initial branch of **`trunk`** — deliberately *not* `main`, so a script that had a branch name remembered in it rather than read from configuration cannot pass;
- one tracked file, committed;
- a local **bare** repository beside it standing in for `origin`, with `trunk` pushed;
- `harness.config.json` written by a real `init` (`--project-name demo --default-branch trunk --state-dir sdlc-harness`), then widened to `protectedBranches: ["trunk", "release/*"]`, so both the exact-name and the pattern arms are live;
- the eleven outer-loop files as `init` writes them, and the state tree, permission profile and committed `githooks/pre-push` that `init` writes with them.

Every fixture is built that way and they differ only in what their rows need: a **primary** one for the wrapper rows; a **worktree** one whose `origin/trunk` really carries the harness commit, so the bootstrap step has something to bootstrap; a **cleanup** one carrying three branches in three upstream states; **watcher** ones, one branch per row so no row inherits the previous row's working copy; a **pair** of repositories sharing one machine-local state directory, for the lane rows in §2.4 — driven under the shipped knob defaults except where a row names `USAGE_LANE_LOCK_ENABLED=1`; and a **guard** one plus a second with a non-default `scriptsDir`, for §3. Keep a pristine copy of the configuration beside each fixture, restore it after any row that breaks it, and diff before trusting the next row.

**Nothing here touches the machine's own state.** `XDG_STATE_HOME` and `XDG_CONFIG_HOME` are pointed at disposable fixture directories for every watcher row, so the machine lane, the operator override file and the credentials file under test are the fixture's and never the ones a live daemon is using. A row that forgets this measures the machine instead of the fixture.

**The agent stub.** The enabler that makes the launch, classify, park, pause, stall and usage paths reachable at all is that the watcher resolves its agent binary through `${HARNESS_AGENT_CLI:-claude}`. The stub is a `/bin/sh` script that saves the prompt it was handed (the argument after `-p`), prints a captured-shape `stream-json` transcript — a `system`/`init` line, an `assistant` text line, a `result` line — and then, per environment variable, sleeps, spins on CPU, or exits with a chosen code. It reproduces the **stream shape and the exit code**. It is not an agent; §4 says what that costs.

**The notification recorder.** `HARNESS_PUSH_CMD` points at a script that appends `HARNESS_PUSH_TITLE` plus its standard input to a file. That is what "one notification fired" means in every row below: a line in that file. It proves the invocation and the payload, not the delivery.

**The pre-1.5 `jq` stand-in.** A script named `jq`, first on `PATH`, that answers `jq --version` with `jq-1.4` and exits 3 for any program. It is the closed-path probe for both configuration loaders. `doctor` reports it (§1.6).

**Shell and versions, named.** `/bin/bash` **3.2.57(1)-release**, arm64 macOS (Darwin 24.6.0), `jq` **1.7.1**, `git` from the same host. These are `bash` 3.2 numbers because 3.2 is the floor the port targets.

**What `init` writes, checked as part of the recipe.** Every row below runs against files an `init` produced, so the write itself is a precondition worth stating: all eleven templates land **byte-identical** to `cli/templates/scripts/`, the ten executed ones land `0755` and the sourced library lands `0644`, while the committed templates are all `0644` (the mode an adopter gets is the generator row's, not the template's). Verified with `cmp -s` and `stat -f '%OLp'` over the ten files of the 2026-08-13 run of record, and over the eleventh — `refresh-branch.sh`, which post-dates that stamp — in the §1.8 round, which re-ran this precondition for all eleven. For ten of the eleven that check exists **only here** — see §4's residuals.

**Where a round's fixtures live.** Under the system temp directory, and they are not durable. Cite this recipe; never a path. Fixture paths appear in this file only as `<fixture>`, `<work_root>` and `<state_dir>`.

---

## 1. The refusal matrix

One row per (script, condition, outcome). "Effect" is what was observed in the repository, not what the message says.

### 1.1 `commit-on-branch.sh` — refuses **loudly**

| Condition | Exit | Effect | Perturbation |
|---|---|---|---|
| ordinary branch, one existing path | **0** | short SHA on stdout; `git log -1 --pretty=%B` shows subject and body as separate paragraphs; `git diff --cached` empty | — (the positive control for every row below) |
| the same command again, nothing changed | **3** | no commit | change the file → 0 |
| HEAD on `trunk` (the `defaultBranch`) | **2** | `git status --porcelain` byte-identical before and after — nothing staged | see the two rows below |
| HEAD on `release/1.0` (matched by the pattern) | **2** | nothing staged | remove `release/*` from `protectedBranches` → **0**, same command, same branch |
| HEAD on `trunk`, `protectedBranches: []` | **2** | nothing staged | the `defaultBranch` is protected whatever the list says; emptying the list does **not** move this row |
| HEAD on `main` — a name not in this fixture's set | **0** | commits | this is the assertion that the set is *configured*, not remembered: the same command refuses on `trunk` two rows up |
| detached HEAD | **1** | no commit | check a branch out → 0 |
| a directory that is not a repository | **1** | no commit | — |
| `harness.config.json` truncated to invalid JSON | **1** | `HEAD` unchanged | restore the file → **0**, same command |
| a pre-1.5 `jq` first on `PATH` | **1** | `HEAD` unchanged; the message is the same unresolvable-configuration one | drop the shim → **0**, same command |
| an existing path plus one that does not exist | **0** | warn-and-skip on stderr for the missing one; `git show --name-only` lists **only** the existing path | — |

The two unresolvable rows are the load-bearing ones: they are the same closed outcome reached two different ways, and their shared perturbation (restore, re-run, it commits) is what attributes the refusal to the configuration read rather than to anything else in the script.

### 1.2 `push-branch.sh` — refuses **visibly and non-fatally**

Every row exits **0**. That is the contract: a stale remote is recoverable, a halted caller is not.

| Condition | Effect | Perturbation |
|---|---|---|
| ordinary branch, no upstream | the branch appears in the bare repository; upstream set to `origin/<branch>` | — (positive control) |
| the same command immediately again | `Everything up-to-date`, then the pushed line — the no-op-after-no-commit property callers depend on | — |
| HEAD on `trunk` | bare repository's refs byte-identical | check out a non-protected branch → pushes |
| detached HEAD | no push | — |
| a directory that is not a repository | no push | — |
| configuration truncated to invalid JSON | the bare `feat_x` ref unchanged with a local commit waiting | restore the file → **the ref moves**, same command |
| a pre-1.5 `jq` first on `PATH` | the bare ref unchanged | drop the shim → the ref moves |
| `origin` pointed at a path that does not exist | git's own `fatal:` is surfaced; exit still 0 | — |

### 1.3 `create-worktree.sh` and `setup-worktree.sh`

| Condition | Exit | Effect | Perturbation |
|---|---|---|---|
| default mode, a new branch | **0** | working copy at `<work_root>/<projectName>-<sanitized-branch>`, on that branch, upstream in the bare repository; bootstrap ran (see below); branch pushed | — |
| `--existing`, branch checked out in another working copy | **2** | names that working copy; creates nothing | remove that working copy → **0**, re-created, and the bare ref is **unchanged** (no push) |
| `--existing`, branch neither local nor on `origin` | **2** | nothing created | — |
| default mode on a branch that already exists | **255** | `fatal: a branch named … already exists` — git's own status, the `*` arm of the header's exit map | pass `--existing` → 0 |
| configuration invalid | **1** | the sibling directory listing is unchanged | restore → **0**, the working copy is created |
| no branch name | **1** | usage | — |
| `$PWD` outside any repository | **0** | **unchanged** — a perturbation that does not move the row, because the anchor is the script's own directory, not `$PWD` | — |
| the whole scripts directory copied outside a repository | **1** | refuses, naming its own directory | this is the row the one above does not cover; `cleanup-merged-worktrees.sh` refuses the same way at exit 0, `commit-on-branch.sh` at exit 1 |

**Driven 2026-08-31 — the default arm's remote precondition.** Not in the whole-set run of record at the head of this file: these rows were added with the refusal itself and the round that closed them came after. Each row and each perturbation got its **own** fixture, built to §0's recipe by a real `init` (`--project-name demo --default-branch trunk --state-dir sdlc-harness --non-interactive`, then `protectedBranches` widened and `commands.depInstall` set to write `deps.marker`), so no row inherits the previous row's working copy or a remote another row repaired. Two constructional notes a re-run has to reproduce: the fixture roots are **unresolved** `$TMPDIR` paths — `/var/folders/…`, an ancestor of which is a symlink to `/private/var/…` — which is the arrangement the second table's drift row needs; and the fixture's own `trunk` pushes carry `--no-verify`, because `init` installs the pre-push backstop and it refuses a direct push to the protected default branch. Nothing a row measures pushes `trunk`.

| Condition | Exit | Effect | Perturbation |
|---|---|---|---|
| default mode, `origin` removed | **2** | refusal naming the missing remote, `git remote add origin <url> && git push -u origin trunk`, and `doctor`'s failing `remote` check; nothing under `<work_root>` — the sibling listing holds the checkout and the bare repository and nothing else | restore the remote → **0**, the working copy is created, bootstrapped and pushed — the positive control the precondition has to stay invisible to |
| default mode, `origin` present but `origin/trunk` absent and unfetchable (`trunk` deleted in the bare repository, tracking ref deleted) | **2** | the tolerated fetch's own `fatal: couldn't find remote ref trunk` reaches stderr first, then the refusal naming the absent `origin/trunk` and `git push -u origin trunk`; nothing created | push `trunk` back → **0**: the same fixture, one ref apart, which is what attributes the refusal to the ref check |
| default mode, `origin` at a path that does not exist, `origin/trunk` still present | **128** — git's own status, the `*` arm | git's fetch `fatal:` reaches stderr and is tolerated, the ref check passes on the surviving tracking ref, and the working copy IS created and fully bootstrapped (`deps.marker` written). The run then ends on the closing `git push -u origin <branch>`, which cannot reach the same unreachable URL: the `128` is that push's status and not the precondition's, and the bare repository does **not** list the branch. What refuses on a bad remote is the ref check, never the fetch | delete the tracking ref as well → **2** with the row above's message and nothing created; point `origin` back at the bare repository → **0** with the branch pushed |

**Driven 2026-08-31 — the bootstrap resolution**, in the same round and on fixtures of the same shape. These are also the only rows the retry has a subject in: the configured `scriptsDir` and the repo-relative path of the checkout the script runs from **are the same string** whenever both checkouts name the same `scriptsDir` — which every ordinary row above satisfies — so the retry re-tests the first path and only the drift row separates them. The refusal's own output is the witness: it prints the `nor at …` second line only when the two spellings differ, so the first row below names one path and the second row's perturbation names two.

| Condition | Exit | Effect | Perturbation |
|---|---|---|---|
| default mode, the base's committed tree carries no `setup-worktree.sh` under either spelling (`git rm -r --cached scripts`, committed and pushed — `--cached`, so the copy the script itself runs from stays on disk) | **4** | refusal naming the one path tried, the missing dependency install and the missing pre-push backstop; the working copy EXISTS at `<work_root>/<projectName>-<sanitized-branch>` and is **left in place**, un-bootstrapped — its listing carries no `deps.marker` — and `git -C <bare> branch` does **not** list the branch, because the exit precedes the push step | restore `scripts/setup-worktree.sh` in the base → **0**, the bootstrap runs and the branch is pushed; the watcher leg is the paragraph below the table |
| default mode, the base's committed `harness.config.json` names `"scriptsDir": "tools"` — a directory its tree lacks — while the checkout the script runs from keeps `scripts` | **0** | the first resolution misses — the new working copy has no `tools/` at all — the retry at this checkout's own repo-relative `scripts/` hits, the bootstrap runs (`deps.marker` written) and the branch is pushed. This is the configuration-drift case the retry exists for, and the only one in which the two resolutions differ. Driven on the unresolved `$TMPDIR` root above, which is the case that makes `script_dir` and git's physical toplevel disagree unless the former is taken with `pwd -P` — a logical path would not strip, and the retry would resolve to the new working copy joined to an absolute one | remove the scripts directory from the base too → **4**, the row above's refusal but naming **both** paths (`tools/`, then `scripts/`), which is what shows the second resolution really was attempted: the retry does not rescue a copy with no scripts directory, because both spellings then resolve inside the same absent tree |

**The watcher leg of the exit-4 refusal, driven in the same round.** One `tick` against a fixture whose base carries no `scripts` in its committed tree, with `HARNESS_AGENT_CLI` on the stub and `XDG_STATE_HOME`/`XDG_CONFIG_HOME` on fixture directories: the pass logs `creating the working copy for '<branch>' via create-worktree.sh` and then `create-worktree.sh failed for '<branch>' — see <log>; archiving the inbox file`, the drop leaves the inbox for `.processed/failed_<ts>_<name>`, the registry records the branch `failed`, one `Run failed` notification reaches the recorder, and the un-bootstrapped working copy is still on disk with the branch absent from the bare repository. The tick itself exits **0** and the agent stub is never launched. That is the reach the pre-fix stderr line never had: the watcher branches on the non-zero status, not on the `4` (see this script's exit-map header).

Bootstrap, observed on the working copy of the first table's first row (default mode, a new branch): the client env file symlinked, the test-account credentials symlinked (`lrwxr-xr-x`, not a copy), `core.hooksPath` pointed at that working copy's own `githooks` with `extensions.worktreeConfig` turned on, then `commands.depInstall` and `commands.build` run in order. `git status --porcelain` shows no tracked modification afterwards — and no untracked entry either, because the managed `.gitignore` block's `<appDir>/.env` rule covers the client env symlink the bootstrap creates.

`setup-worktree.sh` re-run in place, driven against the **working copy's own** configuration (which is what it reads — editing the main checkout's copy does not move these rows):

| Condition | Exit | Effect |
|---|---|---|
| re-run unchanged | **0** | idempotent; the same four lines |
| `commands.build` absent | **0** | prints the skip line and continues |
| `qa` absent | **0** | no symlink attempted |
| configuration invalid | **1** | refuses before any step; restore → **0** |
| main checkout has `<appDir>/.env`, this copy has none | **0** | symlink created, target is the main checkout's file, and ignored by the managed block |
| neither has one | **0** | nothing created anywhere |
| this copy already has its own | **0** | left untouched — and **silently**: the log says nothing about it |

### 1.4 `cleanup-merged-worktrees.sh`

Fixture: `feat_gone` (pushed, remote ref deleted, so `[gone]` after prune, with a working copy), `feat_live` (pushed, remote intact), `release/1.0` (pushed, remote deleted, protected by pattern).

| Condition | Exit | Effect |
|---|---|---|
| `--dry-run` | **0** | names `feat_gone` only; branch list and working-copy list byte-identical afterwards |
| registry marks `feat_gone` `running` | **0** | `skip 'feat_gone' (active run)`; nothing deleted |
| registry marks it `parked` | **0** | same |
| registry marks it `paused` | **0** | same — a paused run still owns its working copy, and `remove --force` would discard the pause note the resumed engine is pointed at |
| configuration invalid | **0** | refuses; nothing deleted |
| pre-1.5 `jq` | **0** | same refusal, same effect |
| registry present but unreadable as a registry | **0** | refuses — it cannot prove nothing is running |
| `--dryrun` (a misspelling of `--dry-run`) | **1** | usage refusal; nothing read, nothing deleted — the misspelling cannot become a real sweep |
| `origin` at a path that does not exist | **0** | `fetch --prune failed (offline, unreachable or timed out); skipping this round` |
| **the real sweep**, everything restored | **0** | `feat_gone`'s working copy removed and its branch deleted; `feat_live` untouched (upstream intact); `release/1.0` untouched (protected, though gone); the main checkout's own branch untouched |

The last row is the shared perturbation partner for the seven refusals above it: same command, nothing blocking, and it deletes. Each refusal row was driven with the sweep's own preconditions otherwise satisfied, so "nothing deleted" is a refusal rather than an empty sweep.

### 1.5 `restart-watcher.sh`

`HARNESS_CLI` points at a recorder that appends its arguments to a file and exits 0.

**What that recorder cannot see, stated rather than implied.** A recorder that exits 0 is byte-for-byte indistinguishable from the CLI's **systemd** arm, which also exits 0 having driven nothing (`docs/cli.md` §9 — launchd is driven, systemd is instructed). So every row here measures *which delegated calls were made and with what status*, and none of them measures a bounce: the `only completed records` row would read identically on a host where the daemon was never touched. The **systemd-shaped** row is the one that ranges over that condition — same call sequence, same exit, and what is measured is the closing **message**.

**The rows range over the process backstop too, not only the registry.** The last three are driven with a live stub process — a sleeping `claude -p <path>`, so `pgrep -f 'claude[ ]-p'` finds it exactly as it finds a real engine — while the registry holds only `completed` records. Any refusal in those three can therefore only come from the probe, and their command lines differ only in the path they name.

| Condition | Exit | Calls recorded |
|---|---|---|
| a `running` record whose pid is live | **2** | **none** |
| only `completed` records | **0** | `daemon stop`, then `daemon install`, in that order |
| a live `running` record, `--force` | **0** | both, plus the "restarting despite the in-flight run" line |
| `HARNESS_CLI` names something not on `PATH` | **1** | none |
| no registry file at all | **0** | both — absent is "nothing in flight"; the process probe still guards it |
| registry present, not readable | **2** | none — it cannot prove nothing is running |
| the recorder made to exit 3 on `stop` | **1** | both. The stop failure is surfaced, the **install is still attempted once** (a stop that failed because nothing was loaded leaves an install to do), and the status stays non-zero. That is deliberate and stated in the script; it is not a retry |
| the recorder in the **systemd shape** — it prints a `systemctl --user …` line per verb, as the CLI does on that backend, and exits 0 having driven nothing | **0** | both. The closing message names the **instruction**, not the restart: `'<cli> daemon stop' and '<cli> daemon install' both succeeded`, then the launchd/systemd split — on launchd that pair succeeding *is* the bounce, on systemd the watcher runs the current file only once the printed lines have been run by hand |
| a live stub `claude -p` naming **another repository's** directory | **0** | both — a foreign repository's run does not refuse this one |
| the same stub naming this fixture's own **main checkout** | **2** | none — this is the run the backstop exists for |
| the same stub naming this fixture's **sibling worktree** `<work_root>/<projectName>-<branch>` | **2** | none — an engine re-launched by hand there has no registry record, so the probe is the only thing that can see it |

Rows one and three are each other's perturbation: identical registry state, one flag apart, opposite outcome.

The last three are each other's perturbation in the same way: one machine, one live process, one string different in its command line, and the exit flips. That is what attributes those rows to the **scoping** rather than to the registry, which is idle in all three. The third is a row rather than a footnote because it is the one that fails if the accept predicate is narrowed back to the main checkout alone — the narrowing would read a hand-relaunched engine as someone else's process and restart on top of it. Their shared perturbation is the pre-fix file, which refuses in all three.

The systemd-shaped row's perturbation is the message at its previous commit, driven against the same systemd-shaped recorder: identical calls (`daemon stop`, then `daemon install`), identical exit **0**, and one closing line — `restarted — the daemon is running the current file` — for a run in which nothing was restarted. That is what fixes the row to the message rather than to the exit status, which no recorder can move.

### 1.6 The `jq` floor: absent, pre-1.5, and how the watcher was driven

`jq` **absent** is a different condition from `jq` **pre-1.5**, and the scripts do not distinguish them: both are "the configuration could not be resolved" and both take the closed path. Driven with a shim directory holding a symlink to every executable on the real `PATH` **except** `jq` — so this is absence rather than a broken `PATH`:

| Script | Exit | Effect |
|---|---|---|
| `commit-on-branch.sh` | **1** | `HEAD` unchanged |
| `push-branch.sh` | **0** | the bare ref unchanged |
| `cleanup-merged-worktrees.sh` | **0** | nothing deleted |

Each is the same outcome and the same message as that script's pre-1.5 row in §1.1–§1.4, which is the point: an adopter cannot tell the two apart from the script's output, and does not need to.

**`autonomous-watcher.sh` was driven with an invalid document instead, not with a shim.** Its bootstrap **appends** the fallback directories **absent** from the inherited `PATH` after the inherited value, so a shim directory placed first on the *caller's* `PATH` — the shape `docs/guard-verification.md` §0 defines — keeps position 1 and **does** reach it; `cli/test/outer-loop-scripts.test.mjs`'s `a decoy git the caller put first on PATH is the one that runs` measures that for `git`. A `jq` shim was **not** driven through the watcher in any round, so nothing is claimed here about a `tick` or a `status` under one. The unresolvable-configuration refusal was driven with an invalid document: **exit 1**, one line naming the file and every condition that could have produced it, nothing created under the state tree. **This is a unit measurement, not a §0 row.** The decoy case runs against an `init`-built temporary fixture from `cli/test/outer-loop-scripts.test.mjs`, not against §0's recipe fixtures, and it carries no perturbation partner; it is cited here because it is what exists, and a §0 round re-driving the watcher under the new bootstrap is still owed.

**`doctor` is what distinguishes them.** In a fixture with the real `jq` it prints one **PASS** row naming the version and the 1.5 floor; with the pre-1.5 stand-in first on `PATH` it prints a **FAIL** row that names the five jq-1.5 constructs both loaders use, says the failure does not announce itself, and says `command -v jq` succeeds throughout. That row is the only diagnostic here that separates "no `jq`" from "a `jq` that makes every configuration read fail closed".

### 1.7 The generated wrappers: arguments, anchor, detached start

Not refusals, but driven under the same rule — each row carries the perturbation that moves it. These three behaviours are the ones no reading of the file reaches, because a wrapper that inherited the caller's directory and one that anchored itself are identical on disk.

Driven on the **primary** fixture with its `commands.test` and `commands.devServer` seeded, before `init`, to two stubs: one appending its `pwd` and its arguments to a file, one echoing the port it was reached with and then `exec sleep 8`. Both are named by **repo-relative** command lines, so a wrapper that did not anchor cannot find its own command at all.

| Condition | Exit | Effect | Perturbation |
|---|---|---|---|
| `bash scripts/test.sh src/thing --name=foo` from the repository root | **0** | the stub records `args=src/thing --name=foo`; one `PASS: test` line | delete `"$@"` from the wrapper → the same command still exits **0** and still prints `PASS: test`, and the stub records `args=` — a filtered run silently became a whole one, which is why this row is about the record rather than about the verdict |
| the absolute form from `nested/deep`, and a sibling worktree's own copy invoked from outside any checkout | **0** | each stub records `cwd=` the root of the checkout **that copy of the script** belongs to — main → main, worktree → worktree — never the caller's directory | from one cwd inside the worktree, the main checkout's copy and the worktree's copy record the two different roots, which attributes the anchor to the script's location rather than to `$PWD`; delete the anchor block → the command is not found, `FAIL: test (exit 127)`, nothing recorded |
| `bash scripts/start-dev-server.sh 54321 --extra` from `nested/deep` | **0** | returns at once (0s elapsed against a stub that lives 8s); prints `STARTING: devServer (pid N)` and `LOG: …/harness-dev-server-54321.log`; that pid is live a second later; the log holds `port=54321 args=--extra`, so the port arrived through the environment and the rest as arguments; killing the printed pid leaves no `sleep` behind | restore the `exec` form → the wrapper does not return for the stub's whole 8s, prints no pid and no log path, and the stub's output lands on the caller's stdout instead of in a file |
| `bash scripts/start-dev-server.sh` with the pre-start line filled (`npm run build`) and the build output absent | **0** | the build runs to completion first and its output is restored — `dist/` is recreated from nothing — and only then does the launch happen: `STARTING: devServer (pid N)` and `LOG: …/harness-dev-server-default.log`, that pid live a second later, the log holding the server's own startup line. The build's stdout precedes both lines | break the build (a file that does not type-check) → exit **1**, `devServer: the pre-start step failed, so the server was not launched` on stderr, **no** pid line and **no** log line, nothing launched; then drop the `|| harness_fail` from that line → exit **0** and the server starts anyway, on the stale output the failed build did not replace |

Two adjacent refusals came out of the same round. The whole scripts directory copied outside any repository exits **1** with one message naming the directory it could not resolve a checkout from — the shape §1.3's last row records for `create-worktree.sh` — and a non-numeric port exits **1** on usage before anything is launched, so a mistyped port can never reach the command as a flag. With no port at all the wrapper still starts, exports nothing, and logs to the `-default` name.

**Re-driven 2026-09-06 (`fix_harness_command_families`), and the row above is the result.** That branch added a synchronous pre-start line above the background launch in `cli/templates/scripts/start-dev-server.sh` (`{{prestart}} || harness_fail …`, the shell no-op `:` for every wrapper with nothing to build first). The pre-start half was driven on the **`preset-api` fixture** under `run-as-daemon.sh` rather than on the primary fixture with a stub, because that preset is the one this release fills the line on and its `npm run build` is a real build whose absence is observable: all three legs the re-drive owed — a succeeding build that lets the launch happen, a failing build that produces the `harness_fail` message with no pid line and no log line, and the perturbation that turns a failed build into a server started on stale output — were measured there and are recorded in the row above. The four observations in the row before it were **not** re-driven; they were measured on the primary fixture before this branch and the pre-start line does not touch the argument, anchor or detach behaviour they record.

### 1.8 `refresh-branch.sh` — the one permitted spelling of the safe direction

**Driven 2026-08-31**, not in the whole-set run of record at the head of this file. Its fixtures were built to §0's *shape* by hand rather than by a real `init` — initial branch `trunk`, a local bare `origin` with `trunk` pushed, `protectedBranches: ["trunk", "release/*"]`, this script and `lib/harness-run-lib.sh` copied in at their generator modes — because the rows need a base that moves under a feature branch, which the shared fixtures do not carry. What that costs is one thing and it was closed separately: the file driven has to be the file `init` writes, so a real `init` fixture was built alongside and `cmp -s` reports the written copy byte-identical to the template at mode `0755` (§0's write precondition, re-run for all eleven rows).

| Condition | Exit | Effect | Perturbation |
|---|---|---|---|
| feature branch behind the base | **0** | fast-forward; `git log --oneline` on the branch carries the base's commit | re-run unchanged → **3**, the row below |
| the same command again | **3** | no merge, no commit | move `trunk` on and push → **0**, same command |
| HEAD on `trunk` (the `defaultBranch`) | **2** | `git rev-parse HEAD` byte-identical before and after; nothing fetched, nothing merged | `git checkout feat_x` → **0**, same command |
| HEAD on `release/1.0` (matched by the pattern) | **2** | HEAD unmoved | drop `release/*` from `protectedBranches` and commit → **0**, same command, same branch — the set is *configured*, not remembered |
| detached HEAD | **1** | no merge | check a branch out → **0** |
| an uncommitted tracked change | **1** | `git status --porcelain --untracked-files=no`, the file's `md5` and `HEAD` all identical afterwards | `git checkout -- <file>` → **0**, same command |
| the base conflicts with the branch | **4** | the abort ran: no `MERGE_HEAD`, no rebase state, `git status` reads `On branch <feature>`, tracked tree and `HEAD` identical to before | put the base's change in a **different file**, keeping the same feature-side edit → **0** |
| `harness.config.json` truncated to invalid JSON | **1** | nothing fetched, nothing merged | restore the file → the row it replaced comes back unchanged, same command |
| `--local`, local `trunk` one commit ahead of `origin/trunk` and unpushed | **0** | the unpushed commit's file lands on the feature branch; no fetch is issued at all | the same command **without** `--local` → **3**, because `origin/trunk` is already contained — which is the whole distinction the flag exists for |
| an unrecognised argument | **1** | usage; nothing read, nothing fetched | — |
| the whole scripts directory copied outside any repository | **1** | refuses, naming the directory it could not resolve a checkout from — the shape §1.3's last row records for `create-worktree.sh` | — |
| `origin` at a path that does not exist and the tracking ref deleted | **1** | git's own fetch `fatal:` on stderr, then a refusal naming the absent `origin/trunk`: what refuses is the missing ref, never the failed fetch | pass `--local` → the local `trunk` is merged, **0** |

**One exit-map entry has no row: `5`, the conflicted merge whose `git merge --abort` also failed.** Its precondition has to arise in the window between the script's own `git merge` and its `git merge --abort`, and nothing outside the script runs there, so it cannot be driven from a fixture built to §0's recipe. The conflict row above stays on `4` — it records an abort that ran — and §4's residuals carry what `5` leaves unmeasured.

The two protected rows are the load-bearing ones. This wrapper exists because the protected-branch guard denies every direct spelling of the merge and `Bash(git merge:*)` is on the profile's `ask` list, so it has to make that refusal itself — and the perturbation on the `release/1.0` row is what attributes it to the configured set rather than to anything remembered in the file.

**Reachability, driven on the `init` fixture.** `grep -n refresh-branch.sh <fixture>/.claude/settings.autonomous.json` returns the three allow forms (repo-relative, repo-root-absolute, sibling-worktree glob) the profile emits for an `agentInvocable` row. The protected-branch guard is **SILENT** (no output, exit 0) on `bash <scripts_dir>/refresh-branch.sh` with and without `--local`, while `git -C <fixture> merge trunk` in that same fixture is **denied** — the pair that shows the sanctioned route is not itself refused. The script-allowlist guard answers `allow` on both the repo-relative and the repo-root-absolute spelling, and stays SILENT on `cleanup-merged-worktrees.sh` in the same fixture, which is the control that the allow is basename-scoped rather than directory-wide.

---

## 2. The run-lifecycle matrix

All rows driven through the agent stub, against a working copy the watcher itself created from a real inbox drop.

### 2.1 Exit classification

`launch_run` called directly, one row per shape, registry read afterwards.

| Condition at exit | Status recorded | Also observed |
|---|---|---|
| rc 0, no sentinels | `completed` | one `Run complete` notification; the per-run log holds formatter output (`💬 working`, `→ Read`, the `✅ success` summary) and the sibling `<branch>.stream.jsonl` holds the raw lines |
| rc 2 | `failed` | the notification names the non-zero exit |
| rc 0, an unanswered `question_1.md` | `parked` | — |
| rc 0, `PAUSE_ACK` **and** an unanswered question | `paused` | **the ordering contract**: pause wins over park. A `RESUME` that existed beforehand is **gone**; `PAUSE_ACK` is left for the resume pass |
| rc 0, `PAUSE_ACK` alone | `paused` | a pre-existing `RESUME` is gone here too — a stale trigger cannot un-pause a fresh pause |

Rows four and three are each other's perturbation: identical clarification state, one sentinel apart, and the status moves.

### 2.2 The launch prompt

Captured as the stub's `-p` argument. Each engine was driven separately.

| Engine | Slash command dispatched | Names | `clarification` mentions |
|---|---|---|---|
| `task` | `/branch-start-plan-autonomous` | `<state_dir>/task_prompts/<branch>_task_prompt.md` | 4 — the channel, how to park, where an answer appears |
| `user_review` | `/branch-start-user-review-fix-autonomous` | `<state_dir>/user_reviews/<branch>_review[_<n>].md` | 4 |
| `docs` | `/branch-start-docs-autonomous` | `<state_dir>/docs_catalog/<branch>_docs.md` | **1, and it is the negation** — "The docs flow has NO clarification channel: a docs-writer that cannot verify a claim marks it unverified and continues — it never parks to ask" |

All three carry the kill switch as an **absolute** path and none carries a line of the prompt file's own contents: the prompt names the file and instructs the engine to read it as untrusted task data. The docs prompt is the shortest of the three, which is the negation clause replacing three sentences.

### 2.3 The recorded pid, and what signalling it actually does

The registry's `pid` is the **subshell** the watcher backgrounds, not the agent. Both directions were driven, and **neither** does what the name suggests:

- **Signal the recorded pid** → the subshell dies at once; the agent process it launched is **orphaned and keeps running**. The subshell never reaches `classify_run_exit`, so it cannot stamp a status the teardown did not intend — which is the property the stall watchdog depends on, and the reason the watchdog collects the descendant set **before** it signals.
- **Kill only the agent** → the subshell **stays alive**, and the registry keeps the run `running` with a pid that is live but has nothing under it. Measured minutes later in this run: the recorded pid still resolves to a live `bash …/autonomous-watcher.sh` process, the record still says `running`, and the repository consequently does **not** release the machine lane (§2.4).

Recorded here because it is the composition of two tasks' behaviour and neither task could see it alone.

### 2.4 Resume, guards and the machine lane

**Pause resume.** A `paused` record with `PAUSE`, `PAUSE_ACK` and `PAUSE_PROGRESS.md` present and **no** `RESUME`: the tick does nothing, the record stays `paused`, every sentinel is still there. Drop `RESUME` and the same tick relaunches: `PAUSE`, `PAUSE_ACK` and `RESUME` are all gone, `PAUSE_PROGRESS.md` is **kept and byte-identical** (`md5` before and after), one `Run resumed — … after pause` notification fires, and the relaunch prompt names `<state_dir>/flow_progress/<branch>_progress.md` and the first-unchecked-entry rule.

**Park resume.** A `parked` record with `question_1.md` and no answer: the tick does nothing and the stub is not launched. Add `answer_1.md` and the same tick flips the record to `running` with `resumed_for_index: "1"`, fires one `Run resumed — … answered clarification #1`, and hands the engine a prompt naming `answer_1.md` — with **both files still at the top level at launch time**, which is the property that makes the answer readable. After the stub exits 0 both are under `clarifications/<branch>/answered/` and `resumed_for_index` is empty.

**The three deferrals**, each with its perturbation:

| Guard | Effect on a fresh drop | Perturbation |
|---|---|---|
| `<state_dir>/AUTONOMOUS_STOP` present | stays in the inbox, no record written; the switch is **still there** afterwards | remove it → the same tick launches |
| `MAX_PARALLEL_RUNS=1` with one live run | stays in the inbox; the log names the cap (`at the cap (1/1 runs)`) | raise the cap → launches |
| the usage hold marker present | stays in the inbox; the log names the marker path | remove it → launches |

The hold-marker row needs `USAGE_CHECK_ENABLED=0` to be driven at all: with the gate on, the gate runs **before** the inbox pass in the same tick, assesses `allowed`, clears the marker it is testing, and the drop launches. That ordering is not a defect — it is the marker being current rather than stale — but a row that does not account for it measures the gate instead of the guard.

An unroutable drop (`notes.md`) is archived as `rejected_<ts>_notes.md` with **no** registry record and one log line naming the three accepted shapes. The state tree's own `README.md` — written by `init` and committed by the adopter — is **exempted from the scan before anything routes it**, and is therefore neither archived nor logged: with that README and a real `feat_x_task_prompt.md` in the inbox together, the tick launches the drop, archives the drop **only**, leaves `README.md` where it is, and leaves `git status --porcelain` in the fixture repository **empty**. The perturbation that attributes it: delete the exemption from the *installed* copy of the watcher and the same tick archives the README as `rejected_<ts>_README.md`, logs the rejection line, and leaves ` D <state_dir>/autonomous_inbox/README.md` in the working tree.

**The machine lane**, two fixture repositories sharing one `XDG_STATE_HOME`. **Driven 2026-09-03**, after the split of the single lane knob into `USAGE_LANE_STATE_ENABLED` (the published record; default `1`) and `USAGE_LANE_LOCK_ENABLED` (the advisory lock; default `0`) — so the shipped configuration publishes and consults a record and takes no lock at all. Every deferral below leaves the drop in the inbox, the registry untouched and no working copy created; that is the only shape a lane deferral has.

**Under the shipped defaults** (`USAGE_LANE_STATE_ENABLED=1`, `USAGE_LANE_LOCK_ENABLED=0`):

| Row | Observed | Perturbation |
|---|---|---|
| A ticks with a live run whose stream carries one `allowed_warning` five-hour event | `usage-state.json` is the **only** entry in the lane directory — no temp residue from the atomic write; `jq -e 'type=="object"'` passes; `.state` is `warning` and `.resume_at` is `resetsAt + 120`, both equal to what A's own `usage` subcommand reports; `.observed_by.repo` is A's slug | a second tick leaves it **byte-identical** (`md5`), still valid JSON, same state |
| a stored `rejected` record with a future `resume_at`, A publishes `allowed` | **byte-identical** — worst wins | back-date that record's `resume_at` into the past → A's next publish **replaces** it with its own `allowed` |
| B is **idle**, its inbox holds a fresh drop, and the stored record is a `rejected` whose `resume_at` is in the future | the drop defers on one line — `machine lane: the shared account state is 'rejected' until <time> (published by 'other')`. **With the lock off**: the record half defers a start by itself | back-date that `resume_at` → the same tick launches with no `machine lane` line |
| both repositories hold a fresh drop | **both launch**; neither inbox retains its drop; neither log carries a `machine lane` line; `run-lane.lock` is never created | `USAGE_LANE_LOCK_ENABLED=1` → A's tick launches and takes the lane, and B's next tick defers again |
| **no** `rate_limit_event` in any live stream in either repository | `usage` reports `state=unknown resume_at_epoch=0`; an absent record reads as `unknown 0` (`published_by=-`); both repositories launch concurrently and neither defers | append one `allowed_warning` with a **future** `resetsAt` to A's live stream and tick A → the record goes `warning` and B's next drop defers naming A's slug |

**With the lock on** (`USAGE_LANE_LOCK_ENABLED=1`). Each row's partner is the same tick at `0`, which is the shipped value:

| Row | Observed | Perturbation |
|---|---|---|
| B ticks with a fresh drop while A holds the lane | one log line naming A's slug, A's pid and when it took the lane: `machine lane: held by '<A slug>' (pid <pid>, since <time>)` | `USAGE_LANE_LOCK_ENABLED=0` → the same tick launches, and the `owner` file is untouched |
| a lock whose owner pid does not exist (`999999`), record fresh | **not** broken; B defers naming `ghost-repo` | age the owner record past `HR_LANE_LOCK_STALE_SECS` (900) → broken, one line naming the previous owner **verbatim** — the whole `<slug> <pid> <acquired_at>` line, not just the slug — and B takes the lane and launches. At `USAGE_LANE_LOCK_ENABLED=0` the fresh ghost lock is not consulted at all: the tick launches and the `owner` file is untouched |
| the machine-local directory not writable (`chmod 500`) | acquisition **fails**: `machine lane: unreachable (<dir>)` and the drop stays put — it does not silently proceed. The record half is closed too and publishes **nothing, silently**, which is the fail-open half doing its job | `USAGE_LANE_LOCK_ENABLED=0` → the same drop launches, still with no record published |

**Where the artifacts land, and what a failed probe costs:**

| Row | Observed | Perturbation |
|---|---|---|
| `XDG_STATE_HOME` at a fixture directory, `HOME` at an empty decoy | `find` over the fixture directory names `autonomous-sdlc-harness/usage-state.json` and `autonomous-sdlc-harness/run-lane.lock/owner` and nothing else; the decoy `HOME` stays **empty** — no `.local/state` is created under it | unset `XDG_STATE_HOME` with the same decoy `HOME` → both artifacts appear under `<home>/.local/state/autonomous-sdlc-harness/` and the fixture directory is unchanged |
| the main checkout on a **detached `HEAD`**, so `hr_current_branch` prints nothing and returns 0 | the publish **succeeds**: `"observed_by":{"repo":"<B slug>","branch":""}` — an unreadable branch costs the field, never the record | re-attach to `trunk` → the next publish carries `"branch":"trunk"` |
| `hr_main_repo` failing — **not driven through the watcher**, and recorded as such | `MAIN_REPO` is derived from `hr_main_repo` above everything else and its own `fatal` refuses the start, so the slug fallback below it is not reachable from a tick — that refusal alone, not the shim's reach: a caller-supplied `git` shim placed first on `PATH` **does** reach the watcher now, since the bootstrap appends only the fallback directories absent from the inherited `PATH`, after it, and so never demotes what the caller put first (measured **outside §0's recipe**, in `cli/test/outer-loop-scripts.test.mjs`'s `a decoy git the caller put first on PATH is the one that runs`, where the decoy wins and the watcher refuses with `is not inside a git repository — refusing to start`). Driven at the library instead: with `worktree list` failing, `hr_repo_slug` on the fixture's `/tmp/…` path still answers a slug, and a **different** one than the resolved main checkout answers — the cost `hr_repo_slug`'s own comment states | drop the shim → both spellings agree again |

The stale-breaker row is the one worth keeping, and the split did not weaken it: "pid gone" alone is **not** sufficient, and the fixture proves why — a one-shot `tick` takes the lane, starts a run that outlives it, and exits within the second. It now lives under the opt-in lock, so a machine running the shipped defaults never reaches it.

The fail-closed **empty-slug** deferral in `lane_blocks_start` was not driven and is not asserted here: it sits below the lock half's early return, and an empty slug cannot be reached from a tick at all because the `MAIN_REPO` refusal above precedes it. Unreachable under the shipped defaults, by construction rather than by measurement.

Nothing the lane does writes inside either repository. After the whole round `git status --porcelain` is **empty** in both fixture main checkouts, and each inbox holds only the `README.md` the scan exempts — the deletion these fixtures showed in an earlier round did not recur, and §4 keeps its record.

### 2.5 The usage gate

**Read-only rows** (`usage` pauses nothing, resumes nothing and neither writes nor removes the marker), driven by writing events to a live run's `<branch>.stream.jsonl`. `resetsAt` is `now + 3600`; `USAGE_RESUME_MARGIN_SECS` is 120, and every `resume_at` below is `resetsAt + 120` exactly.

| Stream tail | Assessment |
|---|---|
| one `allowed` `five_hour`, future reset | `allowed` |
| one `allowed_warning` `five_hour`, future reset | **`warning`** |
| the same event with `resetsAt` in the **past** | **`allowed`** — the staleness downgrade, which is what stops a just-resumed run being re-paused by the pre-pause warning still at its stream tail |
| `seven_day` `allowed_warning`, `utilization: 0.6`, threshold 0.95 | `allowed` |
| the same at `utilization: 0.97` | **`warning`** |
| the same 0.97 with `USAGE_SEVEN_DAY_PAUSE_PCT=0.99` | **`allowed`** — the threshold is the knob, not the number |
| the same 0.97 with `USAGE_SEVEN_DAY_PAUSE_PCT=' 0.99 '` | **`allowed`** — surrounding whitespace is trimmed, so a hand-edited stray space keeps the operator's value rather than the default |
| `USAGE_SEVEN_DAY_PAUSE_PCT=95%` beside a `rejected` `five_hour` window | **`rejected`**, `seven_day_pct=0.95`, and **one** log line naming the knob — a malformed *weekly* threshold falls back rather than reaching `--argjson`, which refuses it and would take every window of every run down with it |
| `seven_day` `rejected` beside a spent `five_hour` window | **`rejected`** — worst-wins across windows |
| `isUsingOverage: true` with `status: allowed` | **`overage`** |
| an unrecognised `rateLimitType` | `warning` — passed through, not dropped |
| a `rate_limit_event` with no `resetsAt` | `warning` with `resume_at_epoch=0` |
| an empty stream, or no live run at all | `unknown` |
| **a good event plus one truncated JSON line** | **`unknown`** — see below |
| a good event plus one non-JSON line | **`unknown`** |

**Two windows, one assessment — which reset the resume time comes from.** Every row above is single-horizon, so none of them can move the `resume_at`. These two are driven with the windows at *different* resets — `five_hour` at `now + 600`, `seven_day` at `now + 200000`, the same margin of 120 — because the horizon is the whole of what separates them. Both assess `rejected` either way; only the `resume_at` moves, which is the point: the *state* was already worst-wins.

| Windows | `resume_at` | Perturbation |
|---|---|---|
| both `rejected`, `five_hour` resetting **sooner** | the **`seven_day`** reset + 120 | the accumulator as committed — updating the reset only on a *strictly* greater rank — gives the **`five_hour`** reset + 120: the run wakes ~12 minutes on and spends its session refused by the weekly window still at its cap |
| `five_hour` `allowed_warning` at the **later** reset, `seven_day` `rejected` at the sooner | the **`seven_day`** reset + 120 | the same copy keeps the larger inherited value and gives the **`allowed_warning`** window's reset + 120 — a horizon belonging to a state that no longer holds |

Stream order does not move either row, and that is measured rather than assumed: both were driven with the events written in each order, and `usage_read_run` emits `five_hour` first whichever way round they arrive, so the unfixed tie resolved to the five-hour window every time. Both perturbations are the *same* file at its previous commit, dropped into the fixture's scripts directory so it resolves the same library and configuration; every read-only row above was re-driven against it and **none of them moved**.

**One window, two horizons — which reset an OVERAGE window's resume time comes from.** The rows above are all *non-overage*, where the binding window and the event's own window are the same thing. While `isUsingOverage` they are not: the window that has to reset before the run can make progress is the overage one, and `resetsAt` then names a window that is routinely already elapsed — often *why* the account moved onto overage. These two are driven with `resetsAt` at `now - 1800`, deliberately in the past. Same perturbation method as the pair above: the same file at its previous commit, in the fixture's scripts directory.

| Stream tail | Assessment | Perturbation |
|---|---|---|
| `isUsingOverage: true`, `status: allowed`, `resetsAt` **elapsed**, `overageResetsAt` = `now + 3600` | `overage`, `resume_at` = **`overageResetsAt` + 120** | the previous commit gives `resetsAt` + 120 — an epoch **already in the past**, which the pause arm's `resume_at <= 0` fallback does not catch. The gate pauses, the very next pass finds `now >= usage_resume_at` and resumes, and the relaunched run meets the same still-binding overage window: a pause/resume loop at one session teardown per cycle |
| the same with **no** `overageResetsAt` | `overage`, `resume_at_epoch=0` — no horizon reported, so the pause arm's one-hour fallback supplies the time | the previous commit gives the same elapsed `resetsAt` + 120, and the same immediate re-resume |

The staleness downgrade does not rescue either row: it is already computed on the binding horizon, so an elapsed `resetsAt` beside a live overage window does **not** downgrade the state to `allowed` — which is correct, and is what leaves the resume time as the whole of the difference. The single-horizon `isUsingOverage` row in the table above measures the **state** only and does not move; its `resume_at` does move to `0` for the reason in the second row here, and no published row measured it before this round.

**Acting rows.** With `USAGE_WARNING_DEBOUNCE=1` and a `warning` assessment, one tick drops `<state_dir>/PAUSE` into the working copy, tags the record `paused_by=usage` with a numeric `usage_resume_at` equal to the assessment's `resume_at`, creates the hold marker, and logs the auto-pause with the expected resume time in local form. The debounce counts **consecutive reads within one process**, so the default of 2 accumulates across the passes of `watch` and never across two one-shot ticks — the row above is driven at 1 for that reason, and the two-pass shape is the other way to reach it.

**Resume.** A `paused` record tagged `paused_by=usage` with `usage_resume_at` in the **future**: nothing happens, no `RESUME`. Put it in the past and the same tick drops `RESUME` and clears **both** tags; the pause-resume pass of §2.4 then relaunches. A `paused` record with an **empty** `paused_by` — what a hand pause looks like — is never touched: driven with its `usage_resume_at` already in the past, and the record came back identical apart from `updated_at`.

### 2.6 The stall watchdog

One branch per row, so no row inherits the previous row's working copy. Staleness is forced by back-dating **both** halves of the liveness signal (`<branch>.log` and `<branch>.stream.jsonl`) with `touch -t`.

| Condition | Observed |
|---|---|
| fresh output, both thresholds far away | nothing logged; `stall_warned` empty |
| back-dated past `STALL_WARN_SECS` only | exactly **one** warn line, naming the last-output timestamp, the elapsed seconds and the kill threshold; `stall_warned=1` |
| a second tick in the same episode | **no** second line |
| `touch` the stream file (output resumed) | `stall_warned` cleared |
| past `STALL_KILL_SECS`, usage hold marker up | the whole pass is **skipped**; no line, run untouched |
| past `STALL_KILL_SECS`, `STALL_CHECK_ENABLED=0` | same |
| past `STALL_KILL_SECS`, the stub **spinning on CPU** | `busy, not hung; deferring the kill`, quoting the tree's CPU share (~98%); the subshell **and its three descendants are still alive** |
| past `STALL_KILL_SECS`, the stub **idle** | the old subshell and every descendant are gone; the working copy's uncommitted edit is discarded (`git status --porcelain` empty, `HEAD` unchanged); `PAUSE_PROGRESS.md` carries the auto-recovery note naming the last-output time and the `reset --hard HEAD`; `stall_restarts=1`; the record is `running` again and the relaunch prompt carries the pause-resume clause naming `<state_dir>/flow_progress/<branch>_progress.md` |
| the same past the ceiling (`STALL_MAX_RESTARTS=0`) | `failed`, the log naming the restart budget; **no** restart |
| the same with the working copy removed first | `failed`, the log naming the missing working copy; no restart |

The idle and spinning rows are each other's perturbation: identical thresholds, identical back-date, one stub behaviour apart, and one of them is killed while the other is not.

---

## 3. The allow/deny surface

This is where the outer loop meets the guard set. `autonomous-script-allowlist-guard.sh` **grants** and never refuses: it emits `allow` or nothing at all. The four denied basenames — `deploy.sh`, `autonomous-watcher.sh`, `restart-watcher.sh`, `cleanup-merged-worktrees.sh` — are removed from what it grants, and the refusal that follows comes from the permission system finding nothing that permits the command.

**The matrix.** 30 rows, each driven twice in one pass — once against the shipped guard, once against a copy of the same file with the **three outer-loop deny entries removed** (`deploy.sh` left in place, since it predates this work). Payload shape and `SILENT` convention are `docs/guard-verification.md` §0's. Regenerate with the §3 driver of this round's recipe; the tallies below are that driver's own output.

**Driven 2026-09-03, re-run whole for this round rather than carried forward**, because a fourth agent-invocable script landed under `scriptsDir` (`scratch-run.sh`) and every group that enumerates the set had to be re-taken with it. The two guard fixtures are §0's: a **primary** one written by a real `init` (`--project-name demo --default-branch trunk --state-dir sdlc-harness --non-interactive`, then `protectedBranches` widened), and a **second** of the same shape whose `harness.config.json` names `"scriptsDir": "tools/harness"` with the directory moved to match. Two constructional notes a re-run has to reproduce. The fixture roots are taken **physically** (`/private/tmp/…` rather than `/tmp/…`): `hc_resolve_repo_root` answers git's resolved toplevel and `under_allowed_scripts` compares textually, so an unresolved root makes every row `SILENT` for a reason that has nothing to do with the deny list. And `init` writes a **deploy wrapper only for a detected `commands.deploy`**, which these fixtures have none of, so `deploy.sh` was copied in beside the others — the guard stats no path, but the row names a file. The perturbed copy is the shipped `plugin/hooks` directory copied whole with the three entries removed from `DENY_SCRIPT_BASENAMES`, so `lib/harness-config-lib.sh` is byte-identical between the two columns and the guard file is the only difference.

| Row group | Shipped | Three entries removed |
|---|---|---|
| `bash <scripts_dir>/{commit-on-branch,push-branch,create-worktree,setup-worktree,autonomous-notify,autonomous-format-stream,scratch-run}.sh` | `allow` ×7 | unchanged |
| `bash <scripts_dir>/{autonomous-watcher,restart-watcher,cleanup-merged-worktrees}.sh` | `SILENT` ×3 | **`allow` ×3** |
| `bash <scripts_dir>/deploy.sh` | `SILENT` | `SILENT` — the control that the perturbation is scoped to the three |
| a denied basename as an absolute path, as a sibling-working-copy path, and quoted | `SILENT` ×3 | **`allow` ×3** — matching is on the basename, not on the string |
| the same three spellings on an **allowed** basename | `allow` ×3 | unchanged — the positive control for those spellings |
| `push-branch.sh && cleanup-merged-worktrees.sh` | `SILENT` | **`allow`** — the guard grants only when *every* script it names is allowable |
| `push-branch.sh && commit-on-branch.sh` | `allow` | unchanged |
| `restart-watcher.sh && deploy.sh` | `SILENT` | `SILENT` |
| `bash <scripts_dir>/scratch-run.sh <state_dir>/scratch/<name>.py` | `allow` | **unchanged**, and that is the row's point — see below |
| a fixture with `scriptsDir: "tools/harness"`: the allowed/denied split **at the configured location** | `allow` ×3, `SILENT` ×2 | the two denied → **`allow`** |
| the same name at the *old* location in that fixture | `SILENT` | `SILENT` — outside the configured directory the guard grants nothing |
| a copy of an allowed script, of a denied one and of the scratch runner outside any configured scripts directory | `SILENT` ×3 | `SILENT` ×3 |

**The scratch-runner row is the one that needs its perturbation stated in the other direction.** Every other `allow` row above is unchanged under the perturbation because it was never denied; this one is unchanged because `scratch-run.sh` is **not on the list to begin with**, which is what makes the guard route cover it on an adoption whose profile has never been regenerated. Its reachability therefore comes from the basename's absence from `DENY_SCRIPT_BASENAMES`, not from the perturbation — and the row that shows the argument is not what earns the allow is the table's last, where the same script at a path outside any configured scripts directory is `SILENT` in both columns.

**What that `allow` reaches, driven rather than described.** Added by code-review finding 1 and driven **2026-09-03** against the shipped guard and the shipped runner, on one §0-recipe fixture (`--project-name demo --default-branch trunk --state-dir sdlc-harness --non-interactive`, root taken physically). Four legs, kept out of the matrix above because they are a separate drive: the first two are guard decisions, the last two are what the runner then does. Leg 4 was re-driven on **2026-09-03** after skeptic finding 3 added `dart:dart` and `php:php` to `SCRATCH_INTERPRETERS`, because the refusal it records quotes the table; the same drive ran a `.dart` probe with a trailing argument (printed the argument, exit **7** — the file's own status) and a `.php` one on a host without `php`, which is the `not on PATH` refusal at exit **69** rather than the table's **66**.

| Leg | Driven against | Result |
|---|---|---|
| the guard on `bash <scripts_dir>/scratch-run.sh <state_dir>/scratch/x.py` | shipped guard, §0's payload | `allow` |
| the guard on the same command with an `x.sh` argument | same | `SILENT` — the second `.sh` token resolves outside `scriptsDir`, so that spelling falls through to the profile, whose 3 allow forms for this script are in the same fixture |
| the runner on an `x.py` whose body is `subprocess.run(["git", "branch", "-D", "victim"])`, in a fixture carrying that branch | shipped runner, from the fixture root | exit **0**, `Deleted branch victim`, and `git branch` afterwards lists `trunk` alone |
| the runner on an `x.sh` carrying the same deletion as a shell line | same | exit **66**, `no interpreter for extension 'sh'`, listing `.py .js .mjs .cjs .rb .dart .php` |

**The consequence, stated as the measurement.** `git branch -D` is an entry of the generated profile's own `deny` floor — read out of the same fixture's profile — and a `deny` is a prefix match anchored at the start of a command string, so the identical words are refused as a **command** and ran as a **probe**. The controls that attribute it: the guard answers `SILENT` to the bare `git branch -D victim` string and to `bash <scripts_dir>/cleanup-merged-worktrees.sh`, so nothing here was granted by the guard's allow — the deletion happened because the runner `exec`s an interpreter and the permission system fires on the Bash tool call rather than on what a subprocess does. Everything the `deny` floor, the `ask` list and `DENY_SCRIPT_BASENAMES` withhold from a command string is reachable this way; the layer that still holds is the `pre-push` hook, exactly as `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`'s protected-branch bullet ranks it. **Leg 4 is not containment and is not recorded as any:** dropping `sh:bash` from the interpreter table removes the one row the guard route never covered (leg 2), and leg 3 is a `.py` reaching the same shell one `subprocess` call further on.

**9 of the 30 rows moved; 21 did not.** That is the attribution: the three entries, and nothing else in the guard, produce every `SILENT` in the denied groups. The previous round recorded 9 of 26 and Task 19's own round recorded 10 of 24 — each is a **different row set**, this one by adding `scratch-run.sh` to the three groups that enumerate the set and one row for the scratch runner's own argument, so the three counts are not comparable and none is wrong. The property every round measures is the same: removing the entries flips exactly the denied-basename rows and leaves every allowed row and every out-of-tree row where it was.

**Nothing moved for any other reason, stated as the measurement rather than as an absence.** All nine moved rows name one of the three basenames; no row whose command names none of them differs between the columns. In particular the narrowed `>` arm this branch also landed moves **no** row here, because no row of this set carries a redirection — the shapes it does move are `docs/guard-verification.md` §3.3's W23–W24, measured there. That the two compose was driven rather than assumed, as one off-matrix control against the shipped guard: `bash <scripts_dir>/scratch-run.sh <state_dir>/scratch/<name>.py 2>&1` is `allow`, as is `bash <scripts_dir>/commit-on-branch.sh --repo . -m "x" 2>&1`.

**Which outer-loop scripts carry a generated permission entry, and which an agent can actually run.** **Four** rows have `agentInvocable: true` in `OUTER_LOOP_SCRIPTS` — the three git wrappers `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`, and `scratch-run.sh` — so those four, and only those four, get an entry in the generated profile. Driven rather than read off the table: `grep -n 'scratch-run.sh\|refresh-branch.sh' <fixture>/.claude/settings.autonomous.json` on §0's primary fixture returns the three allow forms per script the profile emits for an `agentInvocable` row (repo-relative, repo-root-absolute, sibling-worktree glob), the scratch runner's among them. **That flag is not the whole answer to whether an agent can run a script**, because the script-allowlist guard grants independently: it emits `allow` for a `.sh` under the configured `scriptsDir` whose basename is not on `DENY_SCRIPT_BASENAMES`, and a hook `allow` needs no profile entry behind it. That allow is bounded by the *command*, not only by the file: the guard's whole-string construct scan withholds it when anything — a commit subject included — carries `$(…)`, a backtick, `|` (hence `||`), `<`, a braced expansion other than a bare `${IDENT}`, or a `>` that is neither a descriptor duplication nor a redirection to the literal `/dev/null`, and `script_piece_ok` refuses any `.sh` token carrying a `$` in any spelling. The two mechanisms therefore overlap rather than agree. Of the eight non-invocable rows, three — `autonomous-watcher.sh`, `restart-watcher.sh`, `cleanup-merged-worktrees.sh` — are also on the guard's deny list and are genuinely unreachable by an agent: an agent that could start runs could start runs about itself, and one that could run the sweep could delete working copies it was never asked to touch. Four — `create-worktree.sh`, `setup-worktree.sh`, `autonomous-notify.sh`, `autonomous-format-stream.sh` — carry no profile entry and are **still auto-allowed by the guard**, deliberately: none is destructive, and narrowing past a measured need is unjustified. All four were re-driven against the shipped guard on §0's fixture in this round and all four still answer `allow` on a plain `bash <scripts_dir>/<name>.sh …` invocation; each loses that allow to the construct scan exactly as any other wrapper does — `autonomous-notify.sh` carrying a `<placeholder>` in its message, or `create-worktree.sh` handed a `$(git rev-parse …)`, both re-driven `SILENT` here. The guard's own *LEFT ALLOWED* comment names **five** rather than these four, and the fifth is `scratch-run.sh` arriving from the other side of the split: it is the one row that carries a profile entry **and** no deny entry, so the two mechanisms reach it independently — which is exactly what the matrix's scratch-runner row measures. The eighth is `lib/harness-run-lib.sh`, which is sourced rather than invoked (`0644`), so neither mechanism ranges over it. Nothing tests the two against each other: the deny list is a constant in a shell hook, the flag is a field in the CLI, and no test under `cli/test/` reads the hook — which is what would otherwise catch a future row that needs both.

**What this section composes with, and what it still leaves alone.** The earlier round could say `docs/guard-verification.md` was not edited by this work; on this branch that is no longer the subject, because two changes landing beside this re-run do edit it, and this section composes with their rows rather than standing apart from them.

- **The scanned-construct set.** The construct scan's `>` arm is narrowed to a descriptor duplication and a `/dev/null` destination, which supersedes §3.1's N102 and N107's trailing clause and adds §3.3's W23–W24 with their controls. The paragraph above carries the narrowed wording; no row of the matrix does, because none of them carries a redirection.
- **What `allow-safe-compounds.sh` is handed.** A workspace-scoped `git -C <dir> <subcommand>` on its own now reaches that guard's piece loop, which moves §2.4's s4 and the (k) paragraph's edge and adds §3.3's W25–W26 with their deny-floor controls. It reaches no row here: this section drives the script-allowlist guard, and every command above is a `bash <path>.sh` piece rather than a bare `git` statement.
- **What neither touches: §1's whole-set latency baseline.** It stands, and for three separate reasons. The deny entries this section perturbs are an in-process, already-parsed basename comparison. The new outer-loop row adds a **script**, not a per-call cost — no guard reads `OUTER_LOOP_SCRIPTS` at all. And the `>` walk and the `git -C` admission are `case` plus builtin parameter expansion: no new subprocess, no new configuration read and no new `git` invocation in either. The two blocks that landed them each discharge §1's fork half on their own rows.

`docs/guard-verification.md` §3.1 (narrowed, `allow` → `SILENT`) still carries no row for **this** narrowing — the deny list was `deploy.sh` alone when that section was taken, and the case-variant block added later ranges over the comparison rather than over the three entries; adding one is a change to consider there, not a stale claim to correct.

---

## 4. What ships unexercised, and why

Stated plainly, each with the risk it leaves.

**A real headless agent session.** The stub reproduces the `stream-json` shape and the exit code; it is not an agent. Everything in §2 therefore verifies the *watcher's* half of the contract — how it launches, what prompt it hands over, how it reads an exit — and none of the engine's. A change in the agent CLI's flags, in its stream event shape, or in what a real session does to the working tree before exiting would not be caught by any row here. The rows most exposed are §2.2's (the prompt is checked for what it *names*, never for whether an engine acts on it) and §2.1's `paused` row (which assumes the engine writes `PAUSE_ACK` at a clean tracked-tree boundary — the protocol's requirement, not something this file measures).

**A real `launchctl bootstrap` / `systemctl --user enable`.** `daemon install --dry-run` is driven instead, in two fixtures at different paths: it prints the backend it detected, the unit path, the per-repository label, the resolved watcher path — which follows a non-default `scriptsDir` correctly — and the exact `launchctl` line it would run, and the two fixtures produce different labels and different unit paths. So the **rendering, the identity derivation and the paths are exercised; unit loading is not**. A plist or unit file that renders correctly and is rejected by the service manager would pass everything here and fail on an adopter's machine.

**Real desktop and push delivery.** The recorder proves the invocation and the payload — that a title beginning with the repository slug and a body naming the branch reach `HARNESS_PUSH_CMD` on standard input. It proves nothing about the `HARNESS_PUSH_URL` POST reaching an endpoint, about a `terminal-notifier` banner appearing, or about behaviour on a Linux host where the desktop arm degrades to nothing.

**A real provider `rate_limit_event`.** Every §2.5 row is driven against a captured-shape fixture written by hand. The **parser** is exercised across the shapes in that table, malformed ones included; the **transport** is not, and a change in the provider's event shape would leave every row here green while the gate saw nothing.

**Multi-machine and multi-user operation.** Out of scope for the single-lane v1 policy. §2.4's rows are two repositories on one machine sharing one state directory; two machines, or two users on one machine, are not modelled anywhere.

### Residuals — disclosed rather than closed, and the ones this round closed

Each was measured in this round and each is here so a later change picks it up deliberately. All are left as they are except those marked **CLOSED**, whose entries are kept rather than deleted: a closed residual whose evidence is removed becomes an open one again the next time someone reads the note that disclosed it, which is the rule `docs/guard-verification.md` §2.4 keeps its own inventory by.

**Eleven of the twelve outer-loop files have their written mode and byte-identity checked only by hand, and one of the eleven only by half.** `cli/test/outer-loop-scripts.test.mjs` asserts both for **`lib/harness-run-lib.sh`** — the template's bytes and mode `0644`, including after `--force` and at a relocated `scriptsDir` — and `cli/test/profile.test.mjs` asserts the *pairing* rule from `OUTER_LOOP_SCRIPTS` using synthetic fixture rows. Nothing asserts either property for ten of the eleven **executed** scripts: `cli/test/init.test.mjs`'s executable-bit loop runs over the three wrapper names and lists the outer-loop names only as a subtraction. **`scratch-run.sh` is the eleventh, and it sits in the byte-identity half alone:** the same suite asserts its written mode is `0755`, and asserts that a second `init` leaves it byte-identical to its own first copy — never to `cli/templates/scripts/scratch-run.sh`'s bytes, which is the half still open for it. So the `0755` an agent-invocable git wrapper needs, and the verbatim copy that keeps a run-time configuration read from becoming a generation-time substitution, are exercised by §0 of this file and by nothing that runs on a commit. Stated as the property rather than as a bare number: a generator change that routed a template through a renderer still ships green for all eleven; one that dropped the written mode ships green for ten, `scratch-run.sh` excepted. `refresh-branch.sh` joins the residual rather than narrowing it: its row added no assertion under `cli/test/` for either property. `scratch-run.sh` narrows it by half: its row added the mode assertion and no bytes-against-template one. Those are the two dispositions the next row added to `OUTER_LOOP_SCRIPTS` chooses between.

**The scratch runner's reach is measured in §3 and by nothing that runs on a commit.** `cli/test/outer-loop-scripts.test.mjs` drives its path refusals and its interpreter table; no case there executes a probe that reaches a `deny`-floor command, because such a case asserts that the suite deleted something. A change that **widened** the reach — another interpreter row, a relaxed path test — therefore ships green, and §3's four-leg block is the only place a reader is told what the `allow` costs. Narrowing it means deleting the `agentInvocable` row **and** adding the basename to the guard's deny list; either alone leaves the script reachable by the other mechanism.

**The scratch runner reaches seven extensions and no compiled language, and F68's verification is owed on a non-Node repository.** `SCRATCH_INTERPRETERS` is a closed set — `.py .js .mjs .cjs .rb .dart .php` — with no configuration key, no flag and no adopter extension point, and its `<extension>:<interpreter>` entries are single tokens run as `exec "$interpreter" "$target" "$@"`, so no two-word toolchain (`go run`, `cargo`, `dotnet script`) is expressible in it. **That grammar, not the adoption set, is what bounds the table**, and the distinction is the residual: the stacks with no probe route here are the ones whose source file is not run by a single token — Go, Rust, .NET, Swift, the JVM and Android, C++ — and widening to those decides between a config key and a two-token entry shape. Every language a `commandFamilies` function (`cli/src/detect/presets.ts`) covers that DOES run a source file as `<token> <file>` is carried: `nodeCommands`, `pythonCommands`, `bundlerCommands`, `dartCommands` and `composerCommands` — the last two added to the table by skeptic finding 3 of this round, one row each, because `dart <file>.dart` and `php <file>.php` are the `rb:ruby` shape and never needed the grammar change the rest do. Adopters on the single-token stacks reach a probe; the rest get the `exit 66` refusal and the evidence downgrade `plugin/agents/layer-implementer.md` requires — which is the whole of what F68 delivers there. F68's own verification clause asks for a language probe and a mutation check driven **on a non-Node repository**; the suite's executing cases run `.py`, `.js`, `.mjs`, `.dart` and `.php` probes (each skipped where its interpreter is off `PATH`) in a throwaway fixture built from a Node project, so the non-Node **repository** run is still owed. The runner's header states the bound at its interpreter-table paragraph.

**`refresh-branch.sh`'s exit `5` ships undriven.** The status separates the conflicted merge whose abort ran from the one whose `git merge --abort` also failed, because `4`'s published meaning — "the working copy is exactly as it was" — is false on the second and a caller switching on it would resume in a `MERGING` tree. Reaching that path needs the abort to fail against a tree the script itself just conflicted, i.e. the failure state (an unwritable work tree, a held `index.lock`) has to appear between the script's `git merge` and its `git merge --abort`; no hook and no fixture step runs in that window, so §1.8 records the conflict row on `4` and exercises `5` nowhere. What ships unmeasured is one message and one status number on a path that hands the checkout to a human either way; the merge and abort commands surrounding it are §1.8's conflict row.

**`refresh-branch.sh` ships allow-listed and unrouted: its reachability is a permission, not an instruction.** `grep -rl refresh-branch.sh plugin/instructions plugin/commands plugin/agents` returns nothing (exit 1), so §1.8's reachability paragraph measures only that a dispatched agent *may* run the wrapper — the profile emits its three allow forms and neither guard refuses it — while nothing tells one that the route exists. The stale-base case is therefore reachable by an operator and not by the run that hit it: `doctor`'s `base-freshness` remedy names the wrapper, and `doctor` is run before a prompt is dropped, never by the parked run. `docs/watcher.md`'s row states its agent caller conditionally for that reason rather than asserting one. Closing it is one sentence in the instruction fork that owns a run's recovery guidance, beside the park-and-yield handling; the grep above is what shows it landed.

**One malformed line at the tail blinds the usage read.** The tail is slurped as a whole, so a single truncated or non-JSON line among good events yields `unknown` — no assessment and therefore no pause — until it scrolls past the tail window. Two rows in §2.5 measure it. The failure is toward *not pausing*, which is the wrong direction for a gate, and it is invisible: `unknown` is also what an idle machine reports.

**The usage gate's overage resume time is a deliberate divergence from the pre-extraction watcher this script was ported from.** That implementation — not part of this repository, and read-only source material for the port — computes the binding horizon for the staleness downgrade exactly as this one does, and then takes the resume time from the event's **own** `resetsAt` regardless (one `[ "$rs" -gt "$reset" ]` guard, where the port now has two rank-aware arms). So while `isUsingOverage` it resumes on a window that is not the one binding the run. The port takes the **binding** horizon in both arms; the two overage rows in §2.5 measure what the other choice costs, driven against this file's own previous commit, which carried it. The divergence is recorded here rather than fixed there, so a later re-sync that treats the source as the reference does not quietly restore it.

**The usage hold marker flaps between the pause request and the acknowledgement.** The gate creates the marker when it drops `PAUSE`; the run does not go `paused` until it acknowledges and exits. A drop landing in that window is deferred by the marker, but a pass that re-assesses `allowed` in the meantime clears the marker while the pause is still in flight. §2.4's hold-marker row had to disable the gate to be driven at all for exactly this reason.

**`stall_killing` is cleared after the restart is spawned**, so a restarted run that exits inside that window has its classification skipped and is left `running` with a dead pid. The next pass's reconcile heals it — the same path a daemon killed mid-teardown relies on — so the window is self-correcting rather than absorbing.

**`hr_lane_publish` sanitises with collation-sensitive character classes.** `${slug//[!a-zA-Z0-9._-]/-}` and the branch equivalent are ranges, so under a UTF-8 locale an accented branch name keeps its accent in the published lane JSON. Cosmetic here — it is a JSON string value, and the slug arm now receives an already-ASCII slug because `hr_repo_slug` was fixed with a scoped `LC_ALL=C` — but it is the same defect class in the same file, and a second consumer that keyed off the branch field would inherit it.

**CLOSED — two script headers described the guard's refusal imprecisely.** `cleanup-merged-worktrees.sh` and `restart-watcher.sh` each said the script-allowlist guard "denies its basename outright". The capability claim was true — an agent cannot run either script — but §3 is the accurate account: the guard **grants nothing and stays silent**, and the refusal comes from the permission system. The wording mattered because a reader looking for a `deny` decision in that guard will not find one. **Closed by rewording both headers rather than by softening §3**, since §3 is the measured account and the headers were the imprecise restatement of it: `cleanup-merged-worktrees.sh`'s *WHO RUNS IT* paragraph and `restart-watcher.sh`'s *NEVER RUN BY A DISPATCHED AGENT* paragraph now each say the guard "withholds the permit rather than granting one — its basename is on that guard's deny list, and being on it means the guard stays silent", and each names the generated permission profile's absent rule as the other half of the refusal, so the reader is told an agent gets an unanswerable prompt rather than a `deny`. The evidence that holds it closed is that `grep -rn "denies its basename" autonomous-sdlc-harness` now matches only this entry and nothing under `cli/templates/scripts/`; reintroducing the wording in either header restores a hit there.

**CLOSED — the watcher archived the state tree's own `README.md` as a rejected drop.** `init` writes a tracked `<state_dir>/autonomous_inbox/README.md`; the first inbox pass found a file that is not one of the three accepted shapes, logged the rejection, and **moved it** to `.processed/rejected_<ts>_README.md`, so `git status --porcelain` afterwards showed ` D <state_dir>/autonomous_inbox/README.md` — a deletion in the adopter's next `git status`, of the file that explains the directory, made on the very first tick. Reproduced in every watcher fixture in this round. **Closed by the arm that names it:** `tick`'s inbox loop now skips `README.md` before anything routes it. The loop rather than the router, because the router's rejection arm *archives* what it rejects and this file is not a drop at all. The evidence that holds it closed is §2.4's row and its perturbation — a tick with the README and a real drop in the inbox together leaves `git status --porcelain` **empty**, and deleting the exemption from the installed copy restores the deletion and the rejection log line.

**The lane's own residual, stated last because it is a trade rather than a defect.** The stale-lock breaker accepts a small window of double-running in exchange for never wedging: a lock is broken when its owner pid is gone **and** the record is past a short ceiling, or past a long ceiling whatever the pid says. Both ceilings are necessary — §2.4 measures the dead-pid-but-fresh row *not* breaking, which is the case a one-ceiling rule gets wrong — and a lost race is always resolved by deferring rather than by two owners. What remains is that a machine whose clock jumps, or a pid that is recycled inside the long ceiling, can put two repositories on one account budget for one poll interval. That is the failure mode this design chose over a lane that can wedge for the life of the machine.
