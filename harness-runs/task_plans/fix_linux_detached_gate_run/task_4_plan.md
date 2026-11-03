### Task 4 — Test the launcher end to end against a recording `bwrap` stub

**Goal:** Pin the launcher's contract on any host, macOS included. The cases cover:

- which host and profile answers `in-session`;
- every refusal;
- the exact `bwrap` argument vector;
- that nothing from the target runs outside `bwrap`;
- the start-up wait;
- the supervisor's placeholder sweep;
- that a run it starts is collected by the target's ordinary `--wait`.

Not tested here, because no suite can show it: whether the detached supervisor outlives a Bash call on Linux. That is GS1's row (Task 9).

**Depends on:**

- **Task 1.** `run-test-suite.sh --no-detach <label>` prints `pending` and exits 3 for a live label, and otherwise runs both gates in-process and writes `.verdict`.
- **Task 2.** `launch-sandboxed-gates.sh <target> <label>`:
  - it answers `in-session` (exit 4) when `hr_placeholder_host_probe_var` gives `0` or the base profile's `.sandbox.enabled` is `false`;
  - it answers `pending` (exit 3) for a live `.running`, or once its run claims `.running` or writes `.verdict` at or after the launch second;
  - every refusal is one stderr line `launch-sandboxed-gates.sh: <reason>`, exit 2, with nothing on stdout. The reasons include `bwrap is not on PATH…`, `bwrap cannot start a sandbox here: <line>…`, `cannot protect '<p>' in the gate sandbox: its parent directory is absent` and `the sandboxed gate run of <label> did not start: <line>`.

  The argument vector, in order:
  1. `--new-session --unshare-all --die-with-parent --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --bind <target> <target>`.
  2. Per exact denyWrite entry of the session's profile under `<target>/`: `--ro-bind <p> <p>` when it exists, `--ro-bind /dev/null <p>` when it is absent.
  3. Per base `sandbox.credentials.files` path that exists: `--tmpfs` for a directory, `--ro-bind /dev/null` for a file.
  4. `--unsetenv <name>` per base `envVars` name, then `--unsetenv RUN_TEST_SUITE_WORKER`.
  5. `--setenv TMPDIR /tmp --chdir <target> -- bash <target>/<scripts_dir>/run-test-suite.sh --no-detach <label>`.

  The supervisor (`--supervise`) runs `bwrap` in the foreground, then removes each placeholder through `hr_placeholder_sweep_paths_var`.
- **Task 3.** `init` writes the launcher into a fixture's `scriptsDir`, and the base profile allows and excludes it.

### Targets

- `cli/test/launch-sandboxed-gates.test.mjs` (new).

**Work:**

- [ ] **The fixture.** Build it with `cli/test/helpers/fixture.mjs` under `os.tmpdir()`, adopted by the built CLI's `init`, and removed in process.
  - **`commands.test`.** A stub that records its own run and exits per the case. `commands.typecheck` is `<none>`.
  - **The host answer.** Override `hr_placeholder_host_probe_var` the way `cli/test/watcher-placeholder-host.test.mjs` does: append a definition setting `HR_PLACEHOLDER_HOST` to the fixture's installed `lib/harness-run-lib.sh`.
  - **`HOME`.** A case-owned directory holding `.ssh/config` and `.netrc`.
  - **`PATH`.** A case-owned `bin/` in front, holding a `bwrap` stub, and in some cases a `setsid` stub.
    - The `bwrap` stub answers the preflight argv (ending `true`) with `STUB_BWRAP_PREFLIGHT_RC`, and that variable's stderr line.
    - Otherwise it appends its argv, one argument per line, to a record file.
    - For each `--ro-bind /dev/null <p>` pair it creates `<p>` as a 0-byte mode-0444 file, as `bwrap` does for a mount point. This emulates the mount point and is not measured.
    - Then it execs the words after `--`, unsandboxed.
  - **The target.** It is the fixture's main checkout (kind `main`, so the profile is the base), except in the clone case.
  - **The header** states the rule: the launcher's answers and its argument vector are its contract, and no case shows Linux survival, which GS1 owns.
- [ ] **Answers before anything starts.**
  - (a) With the host answer `0`, it prints `in-session` with exit 4, and the `bwrap` record is absent.
  - (b) With the host answer `1` and the base profile's `.sandbox.enabled` set to `false` by the case, the result is the same.
  - (c) With no `bwrap` on `PATH`, it exits 2 with the `bwrap is not on PATH` line, stdout is empty, and nothing is recorded.
  - (d) With a preflight rc of 1 and stderr `bwrap: setting up uid map: Permission denied`, it exits 2 with a line quoting it and naming `kernel.apparmor_restrict_unprivileged_userns`.
  - (e) A bad label, a missing argument, and a target that is a plain `git init` repository under the case's directory each exit 2, and `bwrap` is never called past its preflight.
  - (f) A fresh `.running` written by the case gives `pending` with exit 3, and no supervisor starts: the record holds only the preflight, if anything.
- [ ] **The run.**
  - (g) A passing stub gives `pending` with exit 3. Then the fixture's own `bash <scriptsDir>/run-test-suite.sh --wait <label>`, repeated while it prints `pending`, prints `pass`.
  - **The recorded argv equals the expected vector, element by element.** Build it from the fixture's base profile with `jq`, never from a literal list: every exact `denyWrite` entry under the fixture root, existing or absent, the two `HOME` credential paths (`.ssh` directory → `--tmpfs`, `.netrc` file → `--ro-bind /dev/null`), and every `envVars` name.
  - The argv contains no `--share-net`.
  - The stub's recorded run shows `RUN_TEST_SUITE_WORKER` as unset.
  - The argv's last two words are `--no-detach` and `<label>`.
  - (h) After the verdict, every placeholder path the stub created is gone, removed by the supervisor's sweep, and no other file under the fixture changed except the lane files and the stub's records.
  - (i) A `bwrap` stub that exits 1 at once with the stderr line `bwrap: boom`, writing nothing, gives exit 2 and `the sandboxed gate run of <label> did not start: bwrap: boom`.
  - (j) A protected path whose parent directory the case removed gives exit 2 with the `cannot protect` line, and `bwrap` is never called past its preflight.
- [ ] **The clone arm.** Build one case the way `cli/test/wrapper-clone-arm.test.mjs` builds its registered clone. Write the per-run profile at `hr_run_profile_file`'s path under a case-owned `XDG_STATE_HOME`, with one exact `denyWrite` entry inside the clone.
  - That entry appears as `--ro-bind` in the record.
  - With the per-run profile file removed, the run refuses, naming the profile.

**Verification:**

- `cli/test/launch-sandboxed-gates.test.mjs` passes, through the single-file command `.claude/context/conventions.md` → `## The testing bar` gives.
- No case starts a session or reaches the network. Every file a case creates lives under its own temporary directory and is removed in process.
