### Task 11 — Test CS8 (a)'s and CS8 (b)'s grading against recorded streams and a stub watcher

**Goal:** A new suite for the `invalid-profile` leg's three grading functions:

- (a) is `not run` when the call on `<bad>` was refused at the permission layer or never issued, and recorded otherwise;
- (b) is `pass` only on the watcher check's sandbox-clause refusal, `fail` on acceptance, and `not run` when its control fails;
- `sp__cs8b_check` reads the check's status and refusal through a sourced watcher.

A **stub watcher** stands in for the real one, so no case sources this repository's own `scripts/autonomous-watcher.sh` or aims at this checkout.

**Depends on:** Task 6, which produces these in `scripts/lib/sandbox-probe/legs-settings.sh`. Their contract is restated here:

- **`sp__cs8a_grade <stream> <exact command> <marker written: 1|0>`** → `SP__CS8A_V` / `SP__CS8A_E`:
  - **Marker `1`:** `pass`, `on <bad> the marker was written: the invalid setting was silently ignored and the call ran unsandboxed`.
  - **Not in the stream:** `not run`, `on <bad> the call was not issued: <evidence>`.
  - **Permission layer:** `not run`, `on <bad> the call was refused at the permission layer, so it never reached the sandbox: <evidence>`.
  - **Any other layer:** `pass`, `on <bad> the marker was refused at the <layer> layer: <evidence>`.
- **`sp__cs8b_check <watcher script> <profile> <copy>`.** It sources `<watcher script> status` in a child `bash -c`, discarding that sourcing's output. It then runs `run_profile_check <profile> <copy>` and prints `$RUN_PROFILE_REFUSAL` on a non-zero return. It sets:
  - `SP__CS8B_RC` to the child's status;
  - `SP__CS8B_REFUSAL` to the first line it printed.
- **`sp__cs8b_grade <rc> <refusal> <control rc> <control refusal>`** → `SP_VERDICT` / `SP_EVIDENCE`, its arms taken in this order:
  - **Control rc not `0`:** `not run`, `control did not succeed: run_profile_check refused the unmodified per-run profile: <control refusal>`.
  - **rc `0`:** `fail`, `the watcher's run_profile_check accepted <bad>, whose sandbox.failIfUnavailable is the string "true", so a run launched on it would start unsandboxed (§5 F7)`.
  - **rc `1`, with a refusal carrying `does not carry sandbox.enabled true, sandbox.failIfUnavailable true`:** `pass`, `refused before launch: <refusal>`.
  - **rc `1`, any other refusal:** `not run`, `refused, but not by the sandbox clause: <refusal>`.
  - **Any other rc:** `not run`, `run_profile_check could not be run (exit <rc>): <refusal>`.

**How the suite runs them.** As `cli/test/sandbox-probe-remote-legs.test.mjs` → `sourced()` does: source `core.sh`, `judge.sh`, `controls.sh` and `legs-settings.sh` in a `bash -c` from a case directory under `os.tmpdir()`, with `SP_VERSION: ''`. The helper call is `bash @FIXTURE_ROOT@/tmp/cs8-helper.sh`.

### Targets

- `cli/test/sandbox-probe-invalid-profile.test.mjs` (new)
- `cli/test/fixtures/sandbox-probe/cs8-bad-permission.jsonl` (new): the helper call refused with `Permission to use Bash has been denied because Claude Code is running in don't ask mode.`
- `cli/test/fixtures/sandbox-probe/cs8-bad-sandbox.jsonl` (new): the helper call refused with `@FIXTURE_ROOT@/tmp/cs8-helper.sh: line 2: @FIXTURE_ROOT@/home/sbx_cs8_marker: Operation not permitted`.
- `cli/test/fixtures/sandbox-probe/cs8b-watcher-stub.sh` (new). A `#!/usr/bin/env bash` file that, when sourced with the argument `status`:
  - prints a line on stdout and one on stderr (both must be discarded by `sp__cs8b_check`);
  - defines `run_profile_check`, which sets `RUN_PROFILE_REFUSAL` from the environment variable `CS8B_STUB_REFUSAL` and returns `CS8B_STUB_RC`.
  
  It does nothing else, and parses under bash 3.2. Its header comment names the suite that uses it and states that it stands in for `scripts/autonomous-watcher.sh` so no test sources the real watcher.

**Work:**

- [ ] The two stream fixtures, in the existing fixtures' event shape, and the stub watcher.
- [ ] The suite's header states its rule: *CS8 (a) records only a call that reached the sandbox or wrote the marker; CS8 (b) passes only on the watcher check's sandbox-clause refusal of a profile whose `failIfUnavailable` is a string, fails on its acceptance, and is not run when the unmodified profile's control is refused*. It also says that no case launches a session or sources the real watcher.
- [ ] `sp__cs8a_grade` cases:
  - `cs8-bad-permission` with marker `0` → `not run|on <bad> the call was refused at the permission layer, …`;
  - `cs8-bad-sandbox` with marker `0` → `pass|on <bad> the marker was refused at the sandbox layer: …`;
  - `ran` (a fixture without the call) with marker `0` → `not run|on <bad> the call was not issued: no Bash call …`;
  - `cs8-bad-permission` with marker `1` → the "marker was written" `pass`.
- [ ] `sp__cs8b_grade` cases, one per arm above, each asserting the full `SP_VERDICT|SP_EVIDENCE` string with `assert.equal`. Use, as the sandbox-clause refusal, the watcher's real `strict` sentence with a placeholder path: `<p> does not carry sandbox.enabled true, sandbox.failIfUnavailable true and sandbox.allowUnsandboxedCommands false, and names no sandbox opt-out`.
- [ ] `sp__cs8b_check` cases against the stub (pass its path from `PACKAGE_ROOT/test/fixtures/sandbox-probe/`):
  - with `CS8B_STUB_RC=1` and a refusal, it sets `SP__CS8B_RC` `1` and `SP__CS8B_REFUSAL` to that refusal;
  - with `CS8B_STUB_RC=0`, it sets `0` and an empty refusal.
  
  In both, the stub's stdout and stderr lines appear nowhere in the run's stdout or stderr.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-invalid-profile.test.mjs`, from the repository root as one plain foreground command, exits 0, and its TAP counts show no failure.
- `grep -n 'autonomous-watcher' cli/test/sandbox-probe-invalid-profile.test.mjs` shows the name only in prose, never as a path the suite sources.
- The type check (`bash scripts/typecheck.sh`) parses the stub under the bash floor.
