### 2. Give every scratch-runner probe a direct-interpreter control run, and skip only when the interpreter itself cannot run the probe

**Site:** `cli/test/outer-loop-scripts.test.mjs`, the case `test("the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status", …)`, inside its `for (const [file, interpreter, body] of PROBES)` subtest body. Specifically, the code between:

```js
      const { status, stdout, stderr } = await runScratch(dir, [`${SCRATCH_DIR}/${file}`, PROBE_ARG]);
```

and the three assertions that follow it (`assertContextEstablished(status, stderr);`, `assert.equal(status, 7, …)`, `assert.equal(stdout.trim(), PROBE_ARG, …)`). That is about lines 1297–1317, as a navigation hint only. The `PROBES` table and `PROBE_ARG` sit directly above.

**Failing test:** `cli/test/outer-loop-scripts.test.mjs` — `probe.dart under dart`, and its parent `the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status`, which fails only because that subtest fails.

**Failure, as the log reports it** (`harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_4.log`, gate 4 `npm test`):

```
            not ok 4 - probe.dart under dart
        not ok 309 - the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status
```

**Class:** persisting. It has failed in rounds 1, 2, 3 and 4.

**Diagnosis.** The subtest skips any interpreter that is not on `PATH` (`if (!onPath(interpreter))`). So `dart` was on `PATH` on the gate host and was driven. The runner dispatches every extension the same way: `cli/templates/scripts/scratch-run.sh` → `SCRATCH_INTERPRETERS='py:python3 js:node mjs:node cjs:node rb:ruby dart:dart php:php'`, then `exec "$interpreter" "$target" "$@"`. The `python3` and `node` probes pass through that same path in the same fixture. Neither the runner nor this case has changed on the branch.

The user confirmed that this subtest passes on this branch's tip when run unsandboxed (`harness-runs/clarifications/feat_unattended_sandbox_preflight/answer_1.md`). So under the gate's sandbox, the `dart` interpreter cannot run a one-file script, most likely because its writes of per-user state are refused. The runner is not at fault. The case cannot currently tell those two causes apart, because it never runs the interpreter without the runner. The user chose to fix that in this test (Option 3, Q1), with a control run that applies to **every** probe in the table, not to `dart` by name.

**Concrete fix.** Change only `cli/test/outer-loop-scripts.test.mjs`. Do not change `cli/templates/scripts/scratch-run.sh`, the `PROBES` table, any sandbox profile, or `sandbox.optOut`.

- [ ] Add a small file-local helper near `onPath`. It runs the interpreter directly on the probe file with a fixed argument vector (`execFile` is already imported; never a shell string), and it **resolves** whatever happens rather than rejecting:
  ```js
  /** The interpreter run directly on a probe, without the runner: the control a failing runner run is read against. */
  function runDirect(interpreter, path, arg, cwd) {
    return new Promise((resolveRun) => {
      execFile(interpreter, [path, arg], { cwd, encoding: 'utf8' }, (error, stdout, stderr) => {
        resolveRun({
          status: error === null ? 0 : error.code,
          stdout: stdout ?? '',
          stderr: stderr ?? (error?.message ?? ''),
        });
      });
    });
  }
  ```
  A spawn failure resolves with its non-numeric `code` (for example `ENOENT`). It counts as "the interpreter cannot run here" and is never thrown.
- [ ] In the subtest, keep the runner run first and keep it unchanged: `const { status, stdout, stderr } = await runScratch(dir, [\`${SCRATCH_DIR}/${file}\`, PROBE_ARG]);`.
- [ ] Only when that run did **not** succeed, meaning `status !== 7 || stdout.trim() !== PROBE_ARG`, run the control with the interpreter itself. The command is `<interpreter> <probe file> forwarded-argument`, with no runner: `const direct = await runDirect(interpreter, join(dir, SCRATCH_DIR, file), PROBE_ARG, dir);`. When the runner run succeeded, do not run the control. Hosts where the runner run passes pay nothing extra.
- [ ] If the control also fails to exit 7 with the argument echoed (`direct.status !== 7 || direct.stdout.trim() !== PROBE_ARG`), the interpreter cannot run the probe on this machine. Skip, and quote its own output:
  ```js
  subtest.skip(
    `${interpreter} cannot run ${file} on this machine even without the runner ` +
      `(exit ${direct.status}: ${`${direct.stdout}${direct.stderr}`.trim()}), so ${file} cannot be driven here`,
  );
  return;
  ```
  The wording follows the existing `${interpreter} is not on PATH on this machine, so ${file} cannot be driven here` skip directly above it.
- [ ] If the control succeeds, the runner is at fault. Fall through to the **original** three assertions, unchanged and in their current order: `assertContextEstablished(status, stderr);`, `assert.equal(status, 7, …)` and `assert.equal(stdout.trim(), PROBE_ARG, …)`, all against the **runner** run's `status` / `stdout` / `stderr`. The subtest then fails exactly as it does today. A runner that cannot establish its context (exit 68) still fails through `assertContextEstablished` whenever the interpreter itself can run the probe.
- [ ] When the runner run succeeded, the same three assertions run as they do today. Do not loosen or delete any assertion. The skip decision reads only the control run's own result and never inspects the environment for a sandbox.
- [ ] Extend the comment above the existing `onPath` skip ("Skipped rather than failed: …"), or add one beside the new branch. It should say that an interpreter present on `PATH` that cannot run the probe even when invoked directly is skipped with its own output quoted, and that a direct run which succeeds leaves the runner's failure standing.
