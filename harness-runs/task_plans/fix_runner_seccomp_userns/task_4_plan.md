### Task 4 — Make `doctor`'s `sandbox-prerequisites` check run the nested check and FAIL when it fails

**Goal:** `doctor` fails, on a runner or a local Linux machine, wherever bwrap's child cannot create a nested user namespace. This is the task prompt's goal 2. `doctor --remote-job` therefore fails on a runner where the sandbox cannot run a command. `doctor` still changes nothing on the host.

**Depends on:** Task 2, which exports the following from `cli/src/doctor/sandboxPrerequisites.ts`:

- `NESTED_USERNS_PROBE`, the argument vector `bwrap --unshare-user --dev-bind / / -- unshare -U -r true`.
- `NESTED_USERNS_HELPER` (`'unshare'`).
- `BWRAP_USERNS_RESTRICT_PROFILE_PATH`.
- `NestedUsernsProbe`, one of `{ state: 'not-run' }`, `{ state: 'passed' }` or `{ state: 'failed'; detail: string }`.
- The optional `SandboxHostFacts` fields `nestedUserns?` and `stockRestrictProfile?: boolean`.
- `SandboxPrerequisites.nestedUserns`, one of `not-applicable | not-run | passed | failed | failed-stock-restrict`.
- `describeNestedUserns(answer, detail, remoteJob)` and the corrected `describeAppArmor(answer)`.

This task gathers the facts and grades the answer, and re-words nothing those functions word.

**What this task does not do.**

- **Not here:** the watcher's launch refusal belongs to **Task 5**. That task mirrors this probe in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_prereq_probe_var`, and the doc comment this task writes on `probeSandboxHost` declares that mirror as Task 5 makes it.
- **Not here:** the job's step that applies the remedy belongs to **Task 3**.

### Targets

- `cli/src/doctor/checks.ts`: `probeSandboxHost`, a new exported env-var constant beside `KEEP_AWAKE_LOCK_PROBE_ENV`, a new exported pure `gradeSandboxPrerequisites` with its input interface, and `SANDBOX_PREREQUISITES_CHECK`.
- `cli/test/helpers/fixture.mjs`: `ISOLATED_ENV` and its doc comment.
- `cli/test/doctor-sandbox-prerequisites.test.mjs`

**Work:**

- [ ] **The probe.**
  - Add `export const NESTED_USERNS_PROBE_ENV = 'AUTONOMOUS_SDLC_HARNESS_NESTED_USERNS_PROBE'`, documented as `KEEP_AWAKE_LOCK_PROBE_ENV` is. It is read through this constant alone, no shipped path ever sets it, and `off` reports the check as not run. It exists so the test tree never spawns a real `bwrap` unasked: inside a sandboxed Linux gate run, that nested check fails by design.
  - Add a bound constant `NESTED_USERNS_PROBE_TIMEOUT_MS = 10_000`.
  - In `probeSandboxHost`, add `stockRestrictProfile: readHostFile(BWRAP_USERNS_RESTRICT_PROFILE_PATH).state !== 'absent'`.
  - Add `nestedUserns`. Run the check only when all of these hold: `sandboxHostKind(platform, kernelRelease)` is `linux` or `wsl2`; both `bwrap` and `NESTED_USERNS_HELPER` resolve on `PATH` (`resolvesOnPath`); and the env var is not `off`.
  - Run it as `execFileSync(NESTED_USERNS_PROBE[0], NESTED_USERNS_PROBE.slice(1), { stdio: 'ignore', timeout: NESTED_USERNS_PROBE_TIMEOUT_MS, windowsHide: true })`. That is a fixed argument vector, bounded, with output discarded, per `.claude/context/cli.md` → *"A **host** probe is additionally bounded and its output discarded"*.
  - Exit 0 gives `{ state: 'passed' }`. A throw gives `{ state: 'failed', detail }`, where `detail` is `exited <n>` or `timed out after 10 s`, worded as `probeKeepAwakeHost` words its own. Otherwise the answer is `{ state: 'not-run' }`.
  - Rewrite the doc comment: it now spawns exactly this one bounded check and still reaches no network. Its **DECLARED MIRROR** sentence now covers the nested check and the stock-file presence as well as the platform, kernel-release and `PATH` reads.
- [ ] **The grade, as a pure exported function that `SANDBOX_PREREQUISITES_CHECK.run` calls.** The opt-out pass stays in `run`, ahead of the probe, exactly as it is.
  - Add `export function gradeSandboxPrerequisites(input: SandboxPrerequisitesGradeInput): { grade: 'pass' | 'warn' | 'fail'; message: string }` in `cli/src/doctor/checks.ts`, with an exported input interface carrying: `assessment` (`SandboxPrerequisites`, from `assessSandboxHost`); `facts` (`SandboxHostFacts`, for the kernel release, the platform and the nested `detail`); `remoteJob`; `remoteExecution` (`ctx.config !== undefined && remoteExecutionApplies(ctx.config)`, which today's consequence sentence reads); and `resolvedPaths` (the `` `<binary>` in <dir> `` strings `run` builds today from `locateOnPath`). It reads no environment, file or `PATH`, and spawns nothing. `run` probes, assesses, builds these inputs, calls it, and maps `grade` onto `pass` / `warn` / `fail`.
  - The missing-piece sentences and their consequence wording move into it unchanged.
  - **`failed` or `failed-stock-restrict` → `fail`, in both modes.** The message is `describeNestedUserns(answer, detail, ctx.remoteJob)`, followed by the file-based reading as context: `` AppArmor files, for context: <describeAppArmor(appArmor)> ``. With a missing piece as well, both sentences are joined with `; ` and the grade stays `fail`.
  - **`passed`:** an `uncertain` AppArmor answer **no longer warns**. The pass line keeps its host label and resolved paths, adds the `passed` sentence, and keeps `describeAppArmor(appArmor)` as context.
  - **`not-run` and `not-applicable`:** today's logic unchanged. An `uncertain` answer warns, and a missing piece warns, or fails under `--remote-job`.
  - Update the check's doc comment bullet list to state these three cases, and that the file reading is context wherever the nested check ran. Put the same list on `gradeSandboxPrerequisites`, and have the check's comment point at it.
- [ ] **`cli/test/helpers/fixture.mjs`:**
  - Import `NESTED_USERNS_PROBE_ENV` from `../../dist/doctor/checks.js` beside `KEEP_AWAKE_LOCK_PROBE_ENV`.
  - Set it to `'off'` in `ISOLATED_ENV`.
  - Extend the doc comment above `ISOLATED_ENV` with one sentence in the keep-awake sentence's shape: a case whose subject is the check passes `{ [NESTED_USERNS_PROBE_ENV]: '' }` explicitly.
- [ ] **`cli/test/doctor-sandbox-prerequisites.test.mjs`:**
  - Add Linux-only cases, each skipped elsewhere and naming why, as (b) is. Each runs with `{ [NESTED_USERNS_PROBE_ENV]: '' }` and a `PATH` holding `git`, plus stub `bwrap`, `unshare` and `socat` executables written by the test. No real `bwrap` is spawned.
    - **(d)** a stub `bwrap` that exits 0 gives a `PASS` line naming the nested check, with and without `--remote-job`.
    - **(e)** a stub `bwrap` that exits 1 gives a `FAIL` line in **both** modes. Without `--remote-job`, the line names the hardening trade-off. With it, the line names `Install the sandbox prerequisites`. The line names `bwrap-userns-restrict` exactly when `existsSync(BWRAP_USERNS_RESTRICT_PROFILE_PATH)` holds on this host (read from the owner, not retyped). It never names `optOut`.
    - **(f)** the same failing stub under `{ [NESTED_USERNS_PROBE_ENV]: 'off' }` does not FAIL. The check falls back to today's file-based grade.
  - Extend case (c) so a taken opt-out still passes with the failing stub on `PATH` and the env var cleared.
  - Add **(g)**, host-independent and run on every host. It imports `gradeSandboxPrerequisites` from `../dist/doctor/checks.js`, and `assessSandboxHost` and `describeNestedUserns` from the owner. For each of the prompt's four verdicts, in both `remoteJob: false` and `remoteJob: true`, it builds `linux` facts and passes `assessSandboxHost(facts)` with them:
    - **Probe passes** (`nestedUserns: { state: 'passed' }`, both binaries resolved): `pass`, and the message carries `describeNestedUserns('passed', …)`. An `uncertain` AppArmor reading in these facts still gives `pass`.
    - **Probe fails, stock file present** (`failed`, `stockRestrictProfile: true`): `fail` in both modes. The message carries `describeNestedUserns('failed-stock-restrict', detail, remoteJob)` and `AppArmor files, for context:`.
    - **Probe fails, no stock file**: `fail` in both modes, carrying `describeNestedUserns('failed', detail, remoteJob)`.
    - **No `bwrap`** (`bwrap` unresolved, `nestedUserns` absent): `warn` without `--remote-job` and `fail` with it, as today.
    - A further row joins a missing piece with a failed probe: `fail` in both modes, and both sentences are joined with `; `.
    - No message offers `optOut`.
    - Every expected sentence is read from the owner's functions, never retyped.
  - Update the header's rule sentence. The four verdicts the prompt names are each graded through `assessSandboxHost` by `cli/test/sandbox-prerequisites.test.mjs`, and the check's grade and message for each, in both modes, by (g) here, on every host. (d)–(f) prove the spawn and its wiring on a Linux host.

**Verification:**

- `npm test --workspace cli -- test/doctor-sandbox-prerequisites.test.mjs` passes. On a macOS host, (d), (e) and (f) report skipped with their reason, and (a), (c) and (g) pass. (g) covers all four verdicts in both modes.
- `bash scripts/typecheck.sh` reports no error in `cli/src/doctor/checks.ts`.
- On a macOS host, `node cli/dist/cli.js doctor` still prints `PASS  sandbox-prerequisites` naming Seatbelt. The nested check is Linux and WSL2 only, so macOS keeps its verdict, as the prompt's constraint requires. On any other host, record this check as not taken.
- Read `probeSandboxHost`: it never runs the check when `bwrap` or `unshare` does not resolve, never on macOS, WSL1 or an unsupported platform, and never under the `off` seam. Its one spawn is a fixed vector with a timeout.

**Deviations from plan:**

- (e) asserts the stock profile is named **as the cause** (`` The cause is `/etc/apparmor.d/bwrap-userns-restrict` ``) exactly when `existsSync(BWRAP_USERNS_RESTRICT_PROFILE_PATH)` holds, rather than any mention of `bwrap-userns-restrict`: `describeNestedUserns('failed', …)` itself names the path (*"no `…` is present"*), so the plan's literal assertion would fail on a host without the file. The trade-off and `Install the sandbox prerequisites` assertions are likewise made only when the stock file is present, because only the `failed-stock-restrict` sentence carries them; the full expected sentence is read from `describeNestedUserns` in both cases.
- The `exited <n>` / `timed out after <n> s` wording is shared through a new private `boundedProbeFailure(error, timeoutMs)` in `cli/src/doctor/checks.ts`, which `probeKeepAwakeHost` now calls too, rather than a second copy of that expression.
- The module header's choice-3 paragraph (*"The one host-side effect is …"*) gained one sentence naming the nested check as a spawn that leaves nothing behind, bounded by `NESTED_USERNS_PROBE_TIMEOUT_MS`, so the header still matches the code (`.claude/context/cli.md` → *"A reviewer holds a change to its module's own header"*).
- On a `passed` nested check the pass line carries the AppArmor reading with the same `AppArmor files, for context: ` prefix the failure line uses; where the nested check did not run, the pass line is unchanged.
- Verification bullet 3 was executed on this macOS host: `node cli/dist/cli.js doctor` printed `PASS  sandbox-prerequisites          macOS, sandboxed by Seatbelt. AppArmor does not govern the sandbox on this host.` Cases (d), (e) and (f) were skipped on this host (darwin), so the Linux spawn and its wiring rest on reading `probeSandboxHost` and on (g) until the suite runs on a Linux host.
