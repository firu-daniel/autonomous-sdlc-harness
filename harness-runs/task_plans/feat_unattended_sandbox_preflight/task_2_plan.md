### Task 2 — Add `doctor`'s `sandbox-prerequisites` check and its live host probe

**Goal:** Make `doctor` report the sandbox's host prerequisites ahead of time. Each missing piece is named with the command that installs it. An AppArmor answer the probe cannot settle is reported as uncertain, never as a pass. `doctor --remote-job` fails on a definite missing piece, which is what refuses a remote job (Task 5 installs the pieces before that step).

**Depends on:** Task 1, which exports these names from `cli/src/doctor/sandboxPrerequisites.ts`:

- the facts type: `SandboxHostFacts { platform: string; kernelRelease: string; resolvedBinaries: ReadonlySet<string>; appArmorRestrict: FileRead; bwrapProfile: FileRead }`, where `FileRead` is `{ state: 'absent' } | { state: 'unreadable' } | { state: 'read'; text: string }`;
- `assessSandboxHost(facts)`, which returns `{ host, missing, appArmor }`;
- `SANDBOX_HOST_BINARIES`, `APPARMOR_USERNS_SYSCTL_PATH` and `BWRAP_APPARMOR_PROFILE_PATH`;
- `describeMissingPieces(missing, kernelRelease, platform)` and `describeAppArmor(answer)`.

This task gathers the facts and grades them. It decides nothing about the table itself.

### Targets

- `cli/src/doctor/checks.ts`: the live probe with its mirror-declaring doc comment, `SANDBOX_PREREQUISITES_CHECK`, its `CHECKS` entry, and two doc comments.
- `cli/src/commands/doctor.ts`: the `--remote-job` help text and the header lines that count the checks it moves.
- `cli/test/doctor-sandbox-prerequisites.test.mjs` (new): the check against the compiled CLI.
- `cli/test/doctor.test.mjs`: the frozen id list, and the two `--remote-job` exit-0 cases.

**Work:**

- [ ] **`checks.ts`, the live probe.** Add `probeSandboxHost(): SandboxHostFacts`, placed beside `locateOnPath` / `resolvesOnPath`:
  - `platform` is `process.platform` and `kernelRelease` is `os.release()`, imported from `node:os`;
  - `resolvedBinaries` holds each `SANDBOX_HOST_BINARIES[].binary` for which `resolvesOnPath(binary)` holds, against this process's `PATH`;
  - each of the two files is read with `readFileSync(path, 'utf8')`. `ENOENT` and `ENOTDIR` are `absent`, any other error is `unreadable`, and a successful read is `read`.

  The probe spawns nothing and reaches no network. Add a doc comment saying so, and saying that the watcher's own launch-time probe (Task 4) is the authority for the daemon's `PATH`. The same doc comment **declares the probe's shell mirror**: `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_prereq_probe_var` mirrors its platform, kernel-release and `PATH` reads, held equal by `cli/test/sandbox-prerequisites-shell-mirror.test.mjs` (Task 3), so a rename of `probeSandboxHost` or a change to what it reads is an edit to that shell function. The function name `hr_sandbox_prereq_probe_var` is a wire Task 3 spells exactly.
- [ ] **`checks.ts`, the check.** `SANDBOX_PREREQUISITES_CHECK` has id `sandbox-prerequisites` and title `this host can start the sandbox an unattended run needs`. Its doc comment states the grades:
  - a taken opt-out is `pass` (*not required: sandbox.optOut is taken — `<reason>`; `profile-sandbox` reports it*). It is decided by `sandboxOptedOut(ctx.config)` from `config/model.ts`, imported and never re-spelled. A `ctx.config` of `undefined` counts as not opted out.
  - any definite missing piece is `warn`, and `fail` under `ctx.remoteJob`. The detail is `describeMissingPieces(…)`, followed by the consequence: the watcher refuses every fresh local launch, and the agent CLI exits at startup under `failIfUnavailable`. Name the agent CLI through `AGENT_CLI_VARIABLE` / `DEFAULT_AGENT_CLI`, never as a literal.
  - an `uncertain` AppArmor answer is `warn` in both modes, with `describeAppArmor`'s sentence. When it comes with a missing piece, take the worse grade and join both sentences with `; `.
  - otherwise `pass`, naming the host kind, where each binary resolved (`locateOnPath`), and `clear`, `allowed` or not applicable for AppArmor.

  Insert it into `CHECKS` directly after `PROFILE_WRITE_PROTECTION_CHECK`. Extend `CheckContext.remoteJob`'s doc comment to name the new check. Rewrite `PROFILE_SANDBOX_CHECK`'s doc comment clause *"refusing to launch an unsandboxed run is roadmap item 20"* to name the shipped refusal (this check and the watcher's launch refusal), with no item number.
- [ ] **`commands/doctor.ts`.** `--remote-job` now turns six warnings into failures. Update the header lines (the `REMOTE_JOB_FLAG` bullet, and the paragraph naming `profile-write-protection`) and the help text block that begins `` `${REMOTE_JOB_FLAG} turns five warnings into failures `` to say six. Add `sandbox-prerequisites, when this host lacks a piece the sandbox needs, unless the opt-out was taken`, keeping the text's existing line-wrapping style.
- [ ] **`cli/test/doctor-sandbox-prerequisites.test.mjs` (new).** Its header states the rule, and the fact that its expectations depend on the host by design. It builds a wired fixture as `doctor-profile-sandbox.test.mjs` does, with `createFixture` and `runCli(dir, ['init'])`, and reads the `sandbox-prerequisites` line from `doctor`'s output. Its cases:
  - on `darwin`, the check passes naming Seatbelt, with and without `--remote-job`;
  - on `linux`, with `PATH` set to a temp directory holding only a symlink to the resolved `git`, it warns by default and fails under `--remote-job`. The detail names `bwrap`, `bubblewrap`, `socat` and `sudo apt-get install bubblewrap socat`, and contains no `optOut`;
  - on any host, with `sandbox.optOut: { reason: 'r' }` written into the fixture's config, the check passes naming the reason under `--remote-job` too, and the same `PATH` case still passes;
  - every other platform skips, naming why.
- [ ] **`cli/test/doctor.test.mjs`.** Add `'sandbox-prerequisites'` after `'profile-write-protection'` in `PRE_BRANCH_CHECK_IDS`. Make the two `--remote-job` cases that assert `status, 0` (the `job` and `untracked` runs) host-aware: when that run's own `sandbox-prerequisites` line is `FAIL`, assert that it is the only `FAIL` line and that the status is 1; otherwise keep `status, 0`. Grep this suite for any other assertion that a `--remote-job` run, or a fresh fixture, has no `FAIL` or `WARN` line, and give each the same treatment.

**Verification:**

- `npm test --workspace cli -- test/doctor-sandbox-prerequisites.test.mjs` passes, and so does `npm test --workspace cli -- test/doctor.test.mjs`, which this task edits.
- `bash scripts/typecheck.sh` reports no error in `checks.ts` or `commands/doctor.ts`.
- `grep -n "sandboxOptedOut\|SANDBOX_HOST_BINARIES" cli/src/doctor/checks.ts` shows imports and uses only. No `reason.trim()` and no `'bwrap'` or `'socat'` literal is retyped in `checks.ts`.
- `grep -n "item 20" cli/src/doctor/checks.ts` prints nothing.

**Deviations from plan:**

- `npm test --workspace cli -- test/doctor.test.mjs` does not pass on this host. It was run twice: as written, and again with `--test-reporter=dot` added because the first run's output was truncated before its failure list. The second run's failure list shows one failing subtest: `a unit that sets the agent CLI variable is graded against the CLI it names` (`the daemon-path check grades the installed unit, and never above a warning`), at `cli/test/doctor.test.mjs:3432`. It asserts that the `daemon-path` warning does not contain `claude`, but this session's sandbox temp directory is `/tmp/claude-501/…`, so every fixture path contains that substring. The test belongs to the `daemon-path` check, which this unit does not touch. Every other case in the suite passes, including the edited `PRE_BRANCH_CHECK_IDS` case and the two `--remote-job` cases made host-aware. The Run gates phase verifies this suite under `commands.test`.
- `cli/test/doctor-sandbox-prerequisites.test.mjs` case (b), the Linux path, was skipped on this darwin host as the suite intends. The Linux grading is backed only by a scratch probe, `harness-runs/scratch/sandbox_prereq_linux_probe.mjs`, run through `scripts/scratch-run.sh`. It forced `process.platform` to `linux` and set an empty `PATH`, then called the compiled check directly. Result: `warn` by default and `fail` under `remoteJob`, with a detail naming `` `bwrap` ``, `` `bubblewrap` ``, `` `socat` `` and `sudo apt-get install bubblewrap socat`, and no `optOut`. With an opt-out config, `pass` with `not required: sandbox.optOut is taken — r; profile-sandbox reports it`. The doctor CLI itself was not run end-to-end on Linux. Removing the probe file was refused, so it remains under `harness-runs/scratch/`, uncommitted.
- Task 1's `describeMissingPieces` sentences end in `.`, so the consequence is a separate sentence beginning `Until then the watcher refuses…`. Only the AppArmor sentence is joined with `; `.
