### Task 3 — Run `doctor.test.mjs`'s cases concurrently under the shared bound

**Goal:** Let `cli/test/doctor.test.mjs` (91 s alone per the task prompt; 74 top-level cases, 83 awaited subtests) use more than one core, with the same helper and the same rules `stack-presets.test.mjs` adopted in Task 2.

**Depends on:** Task 2, which creates `cli/test/helpers/concurrency.mjs` exporting exactly:

- `CONCURRENCY_VARIABLE` — the string `'HARNESS_TEST_CONCURRENCY'`;
- `CASE_CONCURRENCY` — a positive integer: the variable's value when set to one (`1` = every case in series), otherwise `Math.max(2, os.availableParallelism())`;
- `concurrentSuite(name, fn)` — exactly `describe(name, { concurrency: CASE_CONCURRENCY }, fn)`.

This task imports those and defines no bound of its own.

**Isolation, established rather than assumed (planner's audit, 2026-09-25 — re-check it, do not inherit it).** Each case builds its own repository (`wiredFixture` → `createFixture` + one `init`) and every machine-scoped directory a case needs is its own `mkdtemp`: the throwaway `HOME` and toolchain directories of the `daemon-path` cases, the `XDG_STATE_HOME` / `XDG_CONFIG_HOME` roots of the registry, footprint and notification cases, the `CLAUDE_CONFIG_DIR` of the plugin-permissions cases, the `jq` / `npm` stub directories prepended to `PATH`. All of those reach the CLI through `runCli`'s `env` argument — `grep -nE "process\.env(\.[A-Z_]+|\[[^]]+\]) *=[^=]|delete process\.env" cli/test/doctor.test.mjs` prints nothing, so no case changes another's environment. Worktrees are created at `` `${dir}-feature_x` ``, keyed on the case's own unique fixture name. The file has no timing assertion (`grep -nE "sleep|eventually\(|Date\.now|performance\.now|setTimeout|process\.kill"` prints nothing) and no module-level mutable state. `doctor` itself only reads the host (`jq --version`, the service manager's unit path under the case's `HOME`) and writes nothing, which its own cases assert.

### Targets

- `cli/test/doctor.test.mjs` — the suite wrapper, concurrent subtests in its slowest cases, and its header.

**Work:**

- [ ] **First, hoist every module-level `await` that sits below the first case.** A `concurrentSuite` callback is a plain synchronous function, and a top-level `await` wrapped inside it is a `SyntaxError` ("await is only valid in async functions") that stops the whole file loading. Find them with `grep -nE "^[^ /*].*\bawait\b" cli/test/doctor.test.mjs` and compare each line number with that of the first match of `grep -nE "^test\(" cli/test/doctor.test.mjs`. At planning time two sit below the first case — `const { MARKETPLACE_NAME, PLUGIN_KEY } = await loadCompiled('generators/projectSettings.js');` and `const { PLUGIN_NAME } = await loadCompiled('core/pluginIdentity.js');` — but re-run the grep rather than trusting that pair. Move each one **unchanged** to just above the first case, keeping their order. The move is safe: each only calls `loadCompiled` (defined above the first case) with a string literal, and `loadCompiled` only imports compiled, read-only modules. Then confirm that no helper or constant that stays above the suite refers to a binding declared between the first case and the end of the file: wrapping those declarations in the suite's block scope hides them from anything outside it, and that failure shows only at run time as a `ReferenceError`. Keep the callback synchronous; do not make it `async` in place of hoisting.
- [ ] Import `concurrentSuite` and `CASE_CONCURRENCY` from `./helpers/concurrency.mjs`. Open `concurrentSuite('doctor', () => {` immediately before the first top-level `test(` (*"doctor exits 0 on a freshly wired repository, warnings and all, and writes nothing"*) and close it at the end of the file, **without re-indenting the body**, with the same one-line comment Task 2 put on its opening line. Everything above the first case stays outside the suite; no case name or body changes.
- [ ] The file's long poles (planner-measured under load: *"the plugin-permissions check prints the entries to paste, and never above a warning"* ≈14 s, *"the daemon-path check grades the installed unit, and never above a warning"* ≈14 s, *"the machine-footprint check reports the machine, and never fails or writes"* ≈12 s): for each, check that every `t.test` subtest builds its own fixture and its own machine directories and reads no variable another subtest assigns; where that holds, give the parent `{ concurrency: CASE_CONCURRENCY }`, start the subtests without awaiting each, and `await Promise.all(…)` over them. Re-measure per-case durations after the wrapper and apply the same rule to any other case whose serial duration exceeds half the file's new total. A parent whose subtests share state stays serial and is named, with the shared state, in the header.
- [ ] Header: add the numbered choice *"Cases run concurrently"*, in this file's own words: the audit above, the bound and `HARNESS_TEST_CONCURRENCY=1`, and the rule a new case must keep — its own fixture, every machine directory its own `mkdtemp` passed through `runCli`'s `env`, no `process.env` write, no timing assertion — or it is placed after the suite closes.

**Verification:**

- From `cli/`, `node --check test/doctor.test.mjs` exits 0. Every line `grep -nE "^[^ /*].*\bawait\b" test/doctor.test.mjs` prints has a lower line number than the `concurrentSuite('doctor'` line that `grep -n "concurrentSuite('doctor'" test/doctor.test.mjs` prints.
- From `cli/` after `npm run build`, `node --test --test-reporter=spec test/doctor.test.mjs` passes with `ℹ tests` and `ℹ pass` equal to the pre-change run's, and the sorted case-name lists (durations stripped) are identical.
- The file passes with `HARNESS_TEST_CONCURRENCY=1` in its environment, and its default-bound wall time before and after is recorded in the implementer's return summary.
- No `harness-*` directory the file's cases create is left under the system temp directory after a green run (list the temp directory's `harness-` entries before and after one run; the after list is not longer).
- Three consecutive full `npm test` runs from the repository root are green.
