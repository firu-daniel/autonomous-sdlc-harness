### Task 17 — Test job mode's preflight, setup and teardown

**Goal:** A new suite that holds job mode's start and end to their contracts:

- **Refusal:** `preflight --job` refuses each checkout job mode must not measure, before creating anything.
- **Leaving no trace:** a job-mode `run` leaves the checkout exactly as it found it, its branch, `HEAD`, `.git/config` and origin included, on a normal exit and on an interrupt.
- **The sweep:** teardown runs the checkout's own `job-sweep`.

No case launches `claude`. Every agent CLI is a stub through `SANDBOX_PROBE_AGENT_CLI`, and every `doctor` is a stub through `SANDBOX_PROBE_DOCTOR`.

**Depends on:**

- **Task 3:** job mode's preflight. Each refusal is one `sandbox-probe: refusing to start: <reason>` line with exit 2, in order:
  - check 1: not a git checkout; the probe's own checkout (compared straight after the git top resolves, before the next two); a linked worktree; a checkout carrying `.git/objects/info/alternates`;
  - check 3: off `defaultBranch`, or a tracked change;
  - check 6: `doctor --remote-job` exiting non-zero, naming its first `!! FAIL` line, or printing no `PASS` for one of `profile-sandbox`, `profile-write-protection`, `profile-main-anchor`, `sandbox-prerequisites`;
  - check 8: a `--runner-controls` path that is not a readable regular file.

  `SANDBOX_PROBE_DOCTOR` replaces job mode's doctor command, run in the checkout.
- **Task 2:**
  - `sp_job_setup` checks the base profile with the checkout's own watcher's `run_profile_check`, with no copy;
  - it cuts `chore_sbx_probe_<ts>` with `git switch -c` and pushes it with a plain refspec and no upstream;
  - `sp_job_teardown` runs `HARNESS_JOB_MODE=1 … autonomous-watcher.sh job-sweep <branch>`, printing each output line as `sandbox-probe: job-sweep: <line>` and then `sandbox-probe: job-sweep: exit <n>; git status after the sweep: …`, and switches back with `--discard-changes`;
  - the existing tracked-branch pass deletes the branch locally and on origin.
- **Task 4:** `sp_setup` installs the trap before `sp_job_setup`, and `sp_teardown` calls `sp_job_teardown` before its clone loop.
- **Task 5:** `run --job <checkout> [--leg <name>]` and `preflight --job <checkout>`; the stamp line `sandbox-probe: stamp: mode: job (<checkout>)`; and in job mode a selected leg with no job rows prints `not run`, *not a job-mode leg*.

**Where this task stops.** One new suite. The launch line, the manifest and the PID token are Task 18's.

### Targets

- `cli/test/sandbox-probe-job-mode.test.mjs` (new)

**Work:**

- [ ] **The header** opens with the rule: *job mode refuses, before creating anything, a checkout it must not measure, and leaves the checkout it measured as it found it on every exit path: its branch, its `HEAD`, its `.git/config`, its tracked files and its origin.* Then what is deliberately left out: no session is real, and no case reaches a placeholder host's manifest, which is Task 18's.
- [ ] **The fixture.** An adopted fixture from `createWatcherFixture` (`cli/test/helpers/watcher.mjs`), which carries the checkout's own watcher and run library. Give it a bare origin under the same `os.tmpdir()` directory, a pushed `defaultBranch`, and a generated `.claude/settings.autonomous.json` that `run_profile_check` accepts, as `sandbox-probe-shell.test.mjs`'s `probeFixture` builds its adopted copy.
  - The probe runs **in place** from `WORKSPACE_ROOT/scripts/sandbox-probe.sh`, with `--job <fixture>`, because job mode places `SP_MAIN` from the argument, not from its own location. Each case's `TMPDIR` is its own directory, read afterwards for a leftover `sandbox-probe.*`.
  - Spawn through `runBash` (`cli/test/helpers/fixture.mjs`), which blanks the main-checkout anchor.
  - **A second fixture, the probe's own copy**, for the probe's-own refusal only: another `createWatcherFixture` under `os.tmpdir()` into which `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/` are copied from `WORKSPACE_ROOT` and committed, on its `defaultBranch` with a clean tree, exactly as `sandbox-probe-shell.test.mjs`'s `probeFixture` builds its copy (`cp` of `PROBE_FILE` and `PROBE_LIB` under `INIT_SCRIPTS_DIR`, an adoption commit, `checkout -B <defaultBranch>`). The probe runs from that copy, so its own checkout is the fixture, never this repository.
  - No fixture is created inside this checkout, and no case passes `WORKSPACE_ROOT` (or any path inside this checkout) as `--job`'s argument: no case's outcome depends on what kind of checkout this repository is.
- [ ] **`test('preflight --job refuses, creating nothing')`**, one subtest per refusal in Task 3's order:
  - the probe's own checkout: run the **copy** in the second fixture (`<copy>/scripts/sandbox-probe.sh preflight --job <copy root>`), and assert the refusal *"job mode measures another checkout; the probe's own is not one"*;
  - a linked worktree of the adopted fixture, run in place;
  - a `git clone --shared` of the adopted fixture, run in place;
  - the fixture off its default branch;
  - the fixture with a tracked file modified;
  - a doctor stub that prints a `!! FAIL  profile-paths …` line and exits 1;
  - a doctor stub that prints `PASS` for three of the four ids;
  - `--runner-controls` naming a missing path.

  Each asserts exit 2, exactly one `refusing to start:` line naming the cause, and no `sandbox-probe.*` left in the case's `TMPDIR`. One more subtest, with a passing doctor stub, asserts exit 0.
- [ ] **`test('a job-mode run leaves the checkout as it found it')`**. Run `run --job <fixture> --leg git`, a leg with no job rows, so setup and teardown run in full and no session is launched. Assert:
  - exit 0;
  - one `leg="git" … result="not run" evidence="not a job-mode leg…"` line per row;
  - stderr carries `sandbox-probe: stamp: mode: job (` and `sandbox-probe: job-sweep: exit 0`;
  - afterwards, `HEAD` is on `defaultBranch`;
  - no `chore_sbx_probe_*` branch exists locally, and none on the bare origin;
  - `.git/config`'s bytes equal those read before the run;
  - `git status --porcelain --untracked-files=no` is empty.

  A second subtest runs it with `SANDBOX_PROBE_DOCTOR` failing and asserts that nothing at all was created: no branch, `HEAD` unmoved.
- [ ] **`test('an interrupted job-mode run still tears down')`**.
  - Run `run --job <fixture> --leg job-layout` with an agent-CLI stub that writes a `started` marker under the case directory, then sleeps 2 s and exits 0.
  - Once the marker exists, send `SIGTERM` to the probe.
  - Assert exit 143, then the same restored state as above, with `sbx_cs6.txt` absent from the checkout.

**Verification:**

- This suite passes: `npm test --workspace cli -- test/sandbox-probe-job-mode.test.mjs`, from the repository root, as one plain foreground command.
- Read the counts and the exit status, not a summary line.
- Every case on a host without the watcher fixture's prerequisites is skipped as `createWatcherFixture` skips, never passed.
</content>
</invoke>
