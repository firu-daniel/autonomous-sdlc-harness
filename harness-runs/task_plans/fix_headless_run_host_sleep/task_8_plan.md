### Task 8 — `doctor`'s informational `keep-awake` check, registered after `sandbox-prerequisites`, with a hermetic lock-probe default for the test tree

**Goal:** `doctor` reports, on every run, whether this host can hold a sleep assertion for a run. On Linux it takes a real test lock from the watcher's context where it can. The check is graded `pass` or `warn` and never `fail`, `--remote-job` included, with the remedy in the warning.

**Depends on:** Task 1 and Task 7.

**Task 1** defines `keepAwakeEnabled(config: HarnessConfig): boolean` in `cli/src/config/model.ts`. It is `false` only for `execution.keepAwake === false`.

**Task 7** defines, in `cli/src/doctor/keepAwake.ts`:

- `KEEP_AWAKE_WHO`, `KEEP_AWAKE_WHAT`.
- `KeepAwakeHostFacts { platform, kernelRelease, enabled, githubActions, caffeinatePath?, systemdInhibitPath?, lock? }` and `KeepAwakeLockProbe { taken, context: 'user-manager' | 'this-shell', detail }`.
- `needsLockProbe(facts)` and `assessKeepAwake(facts) → { answer: 'off' | 'not-applicable' | 'can-hold' | 'cannot-hold', host, sentence }`.

This task gathers the facts and grades. It writes no sentence of its own, because each one is the module's.

**Where this task stops.** `cli/src/doctor/checks.ts`, the shared fixture helper and two test files only. **Task 10** adds the `keep-awake` row and severity bullet to `docs/cli.md` §7.

### Targets

- `cli/src/doctor/checks.ts` — the probe, `KEEP_AWAKE_CHECK`, its `CHECKS` entry and the order comment.
- `cli/test/helpers/fixture.mjs` — `ISOLATED_ENV` sets `KEEP_AWAKE_LOCK_PROBE_ENV` to `off`, and its doc comment says why.
- `cli/test/doctor.test.mjs` — `PRE_BRANCH_CHECK_IDS` gains `keep-awake`.
- `cli/test/doctor-keep-awake.test.mjs` (new) — the check driven through the compiled CLI on an `init`-wired fixture.

**Work:**

- [ ] **`probeKeepAwakeHost(ctx: CheckContext): KeepAwakeHostFacts`**, beside `probeSandboxHost`. It reads `process.platform`, `kernelRelease()`, `enabled` (`ctx.config === undefined ? true : keepAwakeEnabled(ctx.config)`) and `githubActions` (`process.env['GITHUB_ACTIONS'] === 'true' || ctx.remoteJob`). It locates `caffeinate` and `systemd-inhibit` through `locateOnPath`, joined with their names into a path. Only when `needsLockProbe(facts)` holds, **and the test seam in the next bullet does not disable it**, does it take one test lock:
  - When `systemd-run` resolves: `execFileSync('systemd-run', ['--user', '--wait', '--quiet', '--collect', '--', 'systemd-inhibit', `--what=${KEEP_AWAKE_WHAT}`, '--mode=block', `--who=${KEEP_AWAKE_WHO}`, '--why=doctor keep-awake probe', 'true'], …)`, context `user-manager`.
  - Otherwise the same `systemd-inhibit …` argv directly, context `this-shell`.

  Both use `stdio: 'ignore'` and `timeout: KEEP_AWAKE_PROBE_TIMEOUT_MS` (10 000). Taken on exit 0. Otherwise the detail is `exited <status>` or `timed out after 10 s`, and nothing more of the child's output is read (`.claude/context/cli.md`: *"A host probe is additionally bounded and its output discarded"*). Its doc comment states that it is the only probe in this module that takes something from the host, a block lock released the moment `true` exits, and why `systemd-run --user` is preferred: it is the user manager the watcher's unit runs under, where polkit can answer differently from an interactive shell. It also states that the watcher's own launch line remains the authority for a run (Task 4).
- [ ] **The hermetic test default.** Export `KEEP_AWAKE_LOCK_PROBE_ENV = 'AUTONOMOUS_SDLC_HARNESS_KEEP_AWAKE_LOCK_PROBE'` from `cli/src/doctor/checks.ts`, beside the probe, with a doc comment in the form `RETRIEVAL_STUB_ENV` uses (`cli/src/retrieval/models.ts`): it is the variable's only spelling in `cli/src`, it is read through this constant alone (`.claude/context/conventions.md` → *"An environment-variable name is a constant with an owner too"*), it exists so the test tree never takes a real logind lock unasked (`.claude/context/cli.md` → `## What "done" means here`: *"No test loads, starts or stops a real background service … by default"*), and **no shipped path ever sets it**. When `process.env[KEEP_AWAKE_LOCK_PROBE_ENV] === 'off'` and `needsLockProbe(facts)` holds, `probeKeepAwakeHost` spawns nothing. It sets `lock` to `{ taken: false, context: 'this-shell', detail: `lock probe disabled by ${KEEP_AWAKE_LOCK_PROBE_ENV}=off` }`, which grades `cannot-hold`, a `warn` and never a `fail`. That is the same grade a Linux host without `systemd-inhibit` already gets in every existing suite, so no existing case changes. Any other value, unset included, runs the real probe. In `cli/test/helpers/fixture.mjs`, import the constant from `../../dist/doctor/checks.js` as `MAIN_REPO_ANCHOR_VARIABLE` is imported. Add `[KEEP_AWAKE_LOCK_PROBE_ENV]: 'off'` to `ISOLATED_ENV`, so `runCli` and every other subprocess the helper spawns get it, and extend `ISOLATED_ENV`'s doc comment with one paragraph in its existing form: why it is set, that it is never set by a shipped path, and that a case whose subject is the real lock passes `{ [KEEP_AWAKE_LOCK_PROBE_ENV]: '' }` explicitly. Change nothing else in that file.
- [ ] **`KEEP_AWAKE_CHECK`**, id `keep-awake`, title `this host can hold a sleep assertion for the life of a run`. Its run is `assessKeepAwake(probeKeepAwakeHost(ctx))`. `can-hold`, `off` and `not-applicable` → `pass(sentence)`. `cannot-hold` → `warn(sentence)`, under `--remote-job` too. The doc comment lists the grades and says it **never fails**: no hold is a precondition for a run to begin, and the run launches unheld. Register it in `CHECKS` directly after `SANDBOX_PREREQUISITES_CHECK`. Add one sentence to the comment above `CHECKS` saying why: it is the second host question, asked right after whether the host can start the sandbox. Extend the module header's choice 3 (*"Reachability is command resolution by default …"*) with one sentence naming this lock as the one host-side effect, bounded and released at once.
- [ ] **`doctor.test.mjs`.** Insert `'keep-awake'` into `PRE_BRANCH_CHECK_IDS` directly after `'sandbox-prerequisites'`. Change nothing else in that file.
- [ ] **`doctor-keep-awake.test.mjs`.** The header states the rule, *"`keep-awake` reports and never fails"*, and says which behaviour is deliberately not covered and why: the real Linux lock probe and the macOS `caffeinate` lookup grade the host, and no fixture can choose `process.platform`, so the per-host sentences are `cli/test/keep-awake.test.mjs`'s pure cases. The header also states the seam: `cli/test/helpers/fixture.mjs` → `ISOLATED_ENV` sets `KEEP_AWAKE_LOCK_PROBE_ENV` (imported from `../dist/doctor/checks.js`) to `off`, so neither this suite nor any other suite that runs `doctor` takes a real lock unless a case passes `{ [KEEP_AWAKE_LOCK_PROBE_ENV]: '' }`, and no case here does. Write the two cases with the repository's existing `passLine`/`warnLine`/`failLine` idiom. **(a)** An `init`-wired fixture whose `harness.config.json` sets `execution.keepAwake: false`: `doctor` prints a `keep-awake` pass line containing `off: \`execution.keepAwake\` is false`. That arm short-circuits before any probe, so the case is hermetic on every host. **(b)** The same fixture under `doctor --remote-job` with the key `false` and `GITHUB_ACTIONS: ''` passes the same `off` line and no `keep-awake` FAIL line. A case setting `GITHUB_ACTIONS: 'true'` with the key absent passes as `not-applicable`, again before any probe.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- `npm test --workspace cli -- test/doctor-keep-awake.test.mjs` passes.
- `npm test --workspace cli -- test/doctor.test.mjs` passes with the extended id list.
- `grep -rn 'AUTONOMOUS_SDLC_HARNESS_KEEP_AWAKE_LOCK_PROBE' cli/src cli/templates scripts` hits only the constant's declaration in `cli/src/doctor/checks.ts`, which shows no shipped path sets it. `grep -n 'KEEP_AWAKE_LOCK_PROBE_ENV' cli/test/helpers/fixture.mjs` hits the import and the `ISOLATED_ENV` entry.
- `grep -n "'keep-awake'" cli/src/doctor/checks.ts` names the check's `id` once. Reading `KEEP_AWAKE_CHECK`'s body shows no call to `fail(` or `unevaluated(`.

- **Deviations from plan:** The lock probe's failure detail adds one arm the plan does not name: a child that ends with neither a numeric exit status nor a timeout (killed by a signal, or a spawn error) reports `exited without a status` rather than `exited null`. The fixture-helper grep also hits the two `ISOLATED_ENV` doc-comment lines the plan itself requires, beside the import and the entry.
