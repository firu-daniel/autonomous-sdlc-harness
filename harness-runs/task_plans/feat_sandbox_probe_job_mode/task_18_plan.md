### Task 18 — Test the job launch line, the manifest, the sweep call and the agent-PID token

**Goal:** A new suite holding job mode's two mirrors of the watcher, its launch-line tail and its placeholder manifest, to the contracts `spawn_engine` states (`cli/templates/scripts/autonomous-watcher.sh`):

- **The launch-line tail** (the launch-line comment's *"JOB MODE ONLY: one --add-dir per permissions.additionalDirectories entry of the base profile, in file order, minus empty entries and the two directories above"*).
- **The placeholder manifest** (its *"What was absent before this session"* block, written to `hr_job_absent_file` in job mode, and never under a session-writable root).

The suite also holds `job-sweep`'s invocation and the `@SP_AGENT_PID@` substitution to theirs, and shows the clone-layout launch line is unchanged.

**Depends on:**

- **Task 2 (`job.sh`):**
  - `sp_job_add_dirs <base profile> <cwd> <state root>` sets the array `SP_JOB_ADD_DIRS`;
  - `sp_job_manifest_write <settings file> <add-dir root>...` acts only when `SP_JOB_MODE` is `1` and `SP_JOB_PLACEHOLDER_HOST` is `1`. It writes `RUNNER_TEMP="$SP_JOB_RUNNER_TEMP" hr_job_absent_file "$SP_BRANCH"`, holding `hr_profile_deny_paths <settings>` plus each root's `.mcp.json`, through `hr_placeholder_manifest_write`. It skips the write, with one `sp_refuse` line, when the manifest lies under a root;
  - `sp_job_teardown` runs `HARNESS_JOB_MODE=1 RUNNER_TEMP="$SP_JOB_RUNNER_TEMP" bash "$SP_SCRIPTS/autonomous-watcher.sh" job-sweep "$SP_BRANCH"` from `SP_MAIN`. It prints each output line as `sandbox-probe: job-sweep: <line>`, then `… exit <n>; git status after the sweep: …`. A non-zero exit raises exit 5 through `sp__td_fail`.
- **Task 4 (`session.sh`):**
  - `sp_launch_args <settings> <mode> <cwd> <main> <state dir>` appends `--add-dir <dir>` per `SP_JOB_ADD_DIRS` entry in job mode, reading `SP_JOB_BASE_PROFILE`;
  - `sp_session` calls `sp_job_manifest_write` before launch;
  - `sp_session` replaces `@SP_AGENT_PID@` in the prompt and every `--allowed` rule with the PID the agent CLI runs as, and writes it to `$SP_TMP/<name>.agent-pid`.
- **The run library**, sourced from `WORKSPACE_ROOT/scripts/lib/harness-run-lib.sh`: `hr_job_absent_file`, `hr_profile_deny_paths` and `hr_placeholder_manifest_write`.

**Where this task stops.** One new suite. Setup and teardown against a real checkout are Task 17's.

### Targets

- `cli/test/sandbox-probe-job-launch.test.mjs` (new)

**Work:**

- [ ] **The header** opens with the rule: *job mode's launch line is the clone layout's plus the watcher's job tail and nothing else; its manifest lists exactly what the watcher's would, at the path the job's sweep reads, and is never written where a session could write it; the sweep is the checkout's own `job-sweep`; and the agent's PID reaches the prompt as a literal.* Then what is left out: no real agent CLI, and no real placeholder host.

  Each case runs a `bash -c` through `runBash` sourcing `core.sh`, `platform.sh`, `judge.sh`, `controls.sh`, `session.sh` and `job.sh` from `WORKSPACE_ROOT/scripts/lib/sandbox-probe/`, plus the run library. Fixtures sit under `os.tmpdir()`, removed in process.
- [ ] **`test('the job tail of the launch line')`**:
  - with a base profile whose `additionalDirectories` is `["/a", "", "<cwd>", "<main>/harness-runs/", "/b", "/a"]`, job mode yields the clone layout's arguments, then `--add-dir /a --add-dir /b --add-dir /a`: file order, empty and fixed-directory entries dropped, nothing de-duplicated beyond what `spawn_engine` drops;
  - with no key, an unparsable profile, or an absent file, no tail and status 0;
  - with `SP_JOB_MODE=0` and the same profile, the arguments are byte-identical to the clone layout's, asserted against a literal list.
- [ ] **`test('the job-mode placeholder manifest')`**, with `SP_JOB_PLACEHOLDER_HOST=1` and `SP_JOB_RUNNER_TEMP` a case directory:
  - a profile whose `denyWrite` names one present and two absent paths, and two add-dir roots, one holding a `.mcp.json` → the manifest at `<rt>/autonomous-sdlc-harness-placeholders/<branch>.absent` lists exactly the two absent deny paths and the absent `.mcp.json`;
  - `SP_JOB_RUNNER_TEMP` under one of the roots → no file, and one `sandbox-probe:` line saying so;
  - `SP_JOB_PLACEHOLDER_HOST=0`, or `SP_JOB_MODE=0` → no file and no output.
- [ ] **`test('teardown runs the checkout's own job-sweep')`**. `SP_SCRIPTS` is a case directory holding a stub `autonomous-watcher.sh` that records its arguments, `HARNESS_JOB_MODE` and `RUNNER_TEMP`, prints two lines and exits 0. `SP_MAIN` is a `seedRepository` fixture (`cli/test/helpers/fixture.mjs`).
  - The stub recorded `job-sweep <branch>`, `1` and the runner temp.
  - stderr carries both lines as `sandbox-probe: job-sweep: <line>` and the closing `exit 0; git status after the sweep: clean` line.
  - A stub exiting 3 leaves `SP_EXIT` at 5.
- [ ] **`test('the agent PID token')`**. `SANDBOX_PROBE_AGENT_CLI` is a stub that writes its own `$$`, its prompt argument and each `--allowedTools` value to files, then exits 0. The case calls `sp_session` with a prompt and an `--allowed` rule each carrying `@SP_AGENT_PID@`.
  - Both arrive with the stub's own PID in place of the token.
  - `$SP_TMP/<name>.agent-pid` holds that PID.
  - A second session with no token passes its prompt byte for byte.
  - In job mode the stub's recorded `--add-dir` values are the fixed two followed by the profile's entries.

**Verification:**

- This suite passes: `npm test --workspace cli -- test/sandbox-probe-job-launch.test.mjs`, from the repository root, as one plain foreground command.
- Read the counts and the exit status, not a summary line.
</content>
</invoke>
