### Task 12 — Planted-payload fixtures for the stall watchdog's reset, local and in job mode

**Goal:** Plant each payload the inventory names for the stall watchdog's reset, which used to be `git -C "$worktree" reset --hard HEAD`. Drive the real `check_stalled_runs` path of the `init`-written `autonomous-watcher.sh` with a hung stub session. Assert that no marker appears, and that the outcome is the one specified:

- **resumed**: the record is `running`, `stall_restarts` + 1, and a `resumed` notification;
- **given up**: the record is `failed`, with a `failed` notification naming the reason.

**Depends on:** Task 6. After it, the watchdog in `cli/templates/scripts/autonomous-watcher.sh` runs this sequence after its three existing give-up conditions:

1. `hr_run_copy_check_var "$RUN_MAIN" "$worktree"`. Refused → give up.
2. **Job mode only:** `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" doctor --cwd "$MAIN_REPO" --job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH@$HARNESS_GITHUB_DEFAULT_COMMIT"`, run in a subshell whose working directory is a fresh `mktemp -d` directory, never the checkout, which it removes afterwards. With the `@<commit>` form, `doctor` (Task 4) reads the trusted configuration from `<commit>:harness.config.json` and takes `merge-base(HEAD, <commit>)` as the base, reading no `refs/remotes/origin/*` ref. A non-zero exit, a failed `mktemp`, or an empty `HARNESS_CLI_VERSION`, `HARNESS_GITHUB_DEFAULT_BRANCH`, `HARNESS_GITHUB_DEFAULT_COMMIT` or `MAIN_REPO` → give up.
3. `hr_run_reset_var`. It refuses (1 → give up) when the tip's tree changes `<githooksDir>`, `.mcp.json`, `.claude/settings.json` or `.claude/settings.local.json` against `merge-base(<tip>, HR_RUN_TRUSTED_BASE)`, or when anything is untracked under them. `HR_RUN_TRUSTED_BASE` is the commit `ls-remote origin refs/heads/<defaultBranch>` reported, fetched without a destination and checked with `cat-file -e` (Task 1's `hr_run_trusted_base_var`); no local ref of the default branch is read, and an unreachable origin is a refusal. Otherwise it runs `read-tree --reset -u --no-recurse-submodules <tip>` with `GIT_DIR=<main>/.git`, the record's index, `GIT_WORK_TREE=<copy>`, `-c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false`. A `read-tree` failure (3) → today's *"reset failed … resuming anyway"*.

It writes `PAUSE_PROGRESS.md` only through a symlink-free path, and otherwise gives up.

### Targets

- `cli/test/watcher-stall-reset-payloads.test.mjs` (new)

**Work:**

- [x] **The header and the fixture.**
  - The header states the rule: *the watchdog's reset never runs code a sandboxed session planted, and never installs a run-authored protected path before a resumed session loads it; a hung honest run still resumes from its committed ledger*.
  - Stage the hung run with the watchdog's shipped tunables lowered through the watcher's environment override channel. `cli/test/helpers/watcher.mjs` and the watcher header's `a stall` REPRO row show the staging.
  - Commit every payload through `hash-object` / `update-index` / `commit`, without writing the working-tree file.
  - The main `.git/config` sets `extensions.worktreeConfig=true` and the repo-relative `core.hooksPath` `githooks` that `init` writes, so an unpinned call in the copy reads the record's `config.worktree` and resolves hooks inside the copy. The `RED ONCE` mutations below depend on both. Each case carries a label the `RED ONCE` block cites.
- [x] **Local mode — one case per payload:**
  - **(S1)** `githooks/reference-transaction` committed on the branch → **given up**, no marker, and the working-tree `githooks/` unchanged;
  - **(S2)** `.claude/settings.json` committed with a `hooks` entry writing a marker → **given up**, and the working-tree file still the default branch's;
  - **(S3)** a nested repository behind a gitlink, with `core.fsmonitor` → **resumed**, no marker;
  - **(S4)** `config.worktree` `core.fsmonitor` → **resumed**, no marker;
  - **(S5)** `<stateDir>/PAUSE_PROGRESS.md` a symlink to a file outside the fixture → **given up**, and the outside file is unchanged;
  - **(S6) A forged base.** `.claude/settings.json` committed with a marker-writing `hooks` entry, then the main repository's `refs/remotes/origin/<defaultBranch>` **and** `refs/heads/<defaultBranch>` pointed at that tip with `update-ref` → **given up**, and the working-tree file still the default branch's; the bare origin's `<defaultBranch>` is unchanged.
- [x] **Job mode**, staged as `cli/test/watcher-remote-job.test.mjs` stages `job`. (J1)–(J3) put a recording `npx` stub on `PATH` that records its argv and its `$PWD`; (J6) puts a stub there that runs the built CLI; (J4) and (J5) use the real `npx` that ships with the test's `node`:
  - **(J1)** `HARNESS_GITHUB_DEFAULT_BRANCH` unset → **given up**, and `npx` not called.
  - **(J2)** The stub exiting 1 → **given up**, and the reset not attempted: the uncommitted edit still present.
  - **(J3)** The stub exiting 0 on an honest branch → **resumed**. The stub recorded exactly `--yes autonomous-sdlc-harness@<HARNESS_CLI_VERSION> doctor --cwd <the job checkout> --job-surfaces=<HARNESS_GITHUB_DEFAULT_BRANCH>@<HARNESS_GITHUB_DEFAULT_COMMIT>`, and its recorded `$PWD`, canonicalised, lies outside the job checkout and no longer exists after the tick.
  - **(J4)** **A session-written `.npmrc`**, run through the **real** `npx` rather than the stub. The session writes, uncommitted, a `package.json`, an `.npmrc` whose `node-options=--require <fixture>/npmrc-payload.cjs` writes `npmrc.marker`, and a `node_modules/autonomous-sdlc-harness/` at the pinned version whose bin exits 0 and writes nothing. The test's environment sets `npm_config_offline=true`, `npm_config_cache=<fixture>/npm-cache` and `npm_config_userconfig=<fixture>/empty.npmrc`, so the real `npx` needs no network and reads no developer configuration. Expect **given up**, because the offline fetch from the temporary directory fails, and no `npmrc.marker`.
  - **(J6) A forged base in the job checkout.** `HARNESS_GITHUB_DEFAULT_COMMIT` is set to the default branch's real commit. The run branch commits a changed `<scriptsDir>/remote-run.sh` through plumbing — a job surface that is not in the copy's protected set, so only `doctor` can refuse it — and leaves one uncommitted tracked edit elsewhere. Then the job checkout's `refs/remotes/origin/<github default>` is pointed at that tip with `update-ref`, as a session could. The `npx` on `PATH` is a stub that drops its `--yes` and package-spec arguments and runs the repository's own built CLI (`node <repo>/cli/dist/cli.js "$@"`), so the **real** `doctor --job-surfaces` judges. Expect **given up** and the reset not attempted: the uncommitted edit still present.
  - **(J5)** **A session-written `node_modules/`**, with the same real `npx` and environment: a `package.json` and a `node_modules/autonomous-sdlc-harness/` at the pinned version whose bin writes `node-modules.marker` and exits 0. Expect **given up** and no `node-modules.marker`.
- [x] **Honest case.** A hung run with an uncommitted tracked edit and no payload is **resumed**. The edit is discarded, `refs/heads/<branch>` is unchanged, and `PAUSE_PROGRESS.md` says the dispatch was reset to the last commit.
- [x] **A `RED ONCE` block in the header, one line per case above.** Run each mutation once against the case it names, record the assertion that failed, and revert. **A mutation that leaves its case green** means one of two things. First, check by hand that the fixture reaches the payload, and fix the fixture if it does not. If the payload genuinely never reached the pre-Task-6 call either, the case is a regression guard. Record that in the header as *"regression guard: the pre-hardening reset did not reach this payload"*, and give it a second mutation that does turn it red, for example a `git -C "$worktree" status --short` added ahead of the reset, which the plan-time probe showed reaching a nested repository's `core.fsmonitor`. Never drop a line.
  - **(S1)** replace `hr_run_reset_var` with the old `git -C "$worktree" reset --hard HEAD` → the `reference-transaction` marker appears, as the plan-time probe observed.
  - **(S2)** drop the surface check from `hr_run_reset_var` → the case resumes, and the working-tree `.claude/settings.json` is the branch's.
  - **(S3)** run the reset's `read-tree` without `-c core.fsmonitor=false -c submodule.recurse=false` and `--no-recurse-submodules`, with `submodule.recurse=true` added to the fixture's main config for this mutation → the nested repository's `core.fsmonitor` marker appears.
  - **(S4)** run the reset without the `GIT_DIR` / `GIT_INDEX_FILE` / `GIT_WORK_TREE` pin, as `git -C "$worktree" reset --hard HEAD`, so git reads the record's `config.worktree` → the `config.worktree` `core.fsmonitor` marker appears.
  - **(S5)** skip `hr_run_path_safe` on the `PAUSE_PROGRESS.md` write → the outside file is overwritten.
  - **(J1)** drop the empty-variable test before the `npx` call → the stub records a call with `--job-surfaces=`, so the "`npx` not called" assertion fails.
  - **(J2)** skip the `npx` call in job mode → the case resumes and the uncommitted edit is discarded.
  - **(J3)** pass `--job-surfaces` the main checkout's `defaultBranch` instead of `$HARNESS_GITHUB_DEFAULT_BRANCH`, with the fixture's two values set to differ → the recorded-argv assertion fails. A second mutation: drop the `cd "$scratch"` → the recorded-`$PWD` assertion fails.
  - **(J4)** run the `npx` from `$MAIN_REPO` instead of the temporary directory → `npmrc.marker` appears. Record `npm --version` beside the observed failure.
  - **(J5)** the same mutation → `node-modules.marker` appears, and the case resumes.
  - **(S6)** use the local `refs/remotes/origin/<defaultBranch>` as the base in `hr_run_surface_check_var` in place of `HR_RUN_TRUSTED_BASE` → the case resumes, and the working-tree `.claude/settings.json` is the branch's.
  - **(J6)** pass `--job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH"` without the `@$HARNESS_GITHUB_DEFAULT_COMMIT`, so `doctor` takes the base from the job checkout's local `refs/remotes/origin/<github default>` → the case resumes and the uncommitted edit is discarded.

**Verification:**

- `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs` passes, and every `RED ONCE` mutation was run once and observed failing as recorded in the header.

**Deviations from plan:**

- **Driving the stall.** The hung session must outlive the pass that launched it and the payload must land after the copy is cut, so neither the shared `tick` (which `wait`s) nor seeding the record fits. Locally, one shell runs `tick`, waits for the session's `silent` file, back-dates the log and stream, runs a second `tick` and `wait`s; the test plants while the session reports `hung`. In job mode the same session keeps its stream fresh with `{}` lines until `go`, then falls silent, so the job's own watchdog kills it after `STALL_KILL_SECS=2`. `STALL_BUSY_CPU_PCT` is raised so a just-started stub is never deferred as busy.
- **"Resumed: the record is `running`".** After the pass the relaunched session has exited and been classified `completed`, so `running` and `stall_restarts` 1 are asserted on the registry snapshot the relaunched session takes at its start.
- **The recorder directory is excluded** through `.git/info/exclude` before the fixture's adoption commit: committed, the job-mode reset put the stub body back to its committed `:` and the relaunch ran it.
- **(J3) `$PWD`.** The recorder writes `pwd -P`, so the recorded directory is already canonical; the test cannot canonicalise it afterwards because it no longer exists.
- **(J4), (J5)** The session-written `package.json` is the fixture's tracked one, edited with the pinned dependency; a `node_modules/.bin` link is planted beside the package. The payload `npmrc-payload.cjs`, `empty.npmrc` and the npm cache sit in the fixture's sibling payload directory rather than inside the checkout.
- **(J6)** The job surface is `<INIT_SCRIPTS_DIR>/remote-run.sh`, the directory `init` wrote with no seeded config.
- **RED ONCE outcomes that differ from the plan's prediction.** (S2), (S5) and (S6) fail first on the record's `status` (`completed`, not `failed`), which is the "case resumes" the plan names, before the working-tree and outside-file assertions are reached. (J1) asserts `npx` not called ahead of the outcome so its mutation fails on that assertion. (S3) stayed green under its mutation and under the old `reset --hard`; its second mutation, `git -C "$worktree" status --short` ahead of the reset, turned it red, so the header records it as a regression guard. The honest case, which the plan's mutation list omits, carries its own line: skipping the reset fails `the uncommitted edit survived the reset`.
- **RED ONCE mechanics.** Each mutation was applied by `harness-runs/scratch/t12_mutate.py` through `scripts/scratch-run.sh`, run against its named case with `--test-name-pattern`, and reverted in a `finally`; `git status` showed the templates unchanged afterwards.
- **Verification.** `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs` was run as `npm test -- test/watcher-stall-reset-payloads.test.mjs` from `cli/`, the same script: 13 pass, 0 fail.
