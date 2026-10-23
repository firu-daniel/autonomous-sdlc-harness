### 1. Make the start-up-poll case wait for the verdict before its one `--wait`

**Site:** `cli/test/run-test-suite.test.mjs` → the `test('a worker that finishes inside the start-up poll still answers \`pending\`, and one --wait collects it', …)` case (around line 458), specifically its line `const waited = await wrapper(dir, ['--wait', LABEL], { RUN_TEST_SUITE_WAIT_SLICE: '1' });`.

**Failing test:** `cli/test/run-test-suite.test.mjs` — `a worker that finishes inside the start-up poll still answers \`pending\`, and one --wait collects it`

**Failure, from the log** (the test gate, gate 4 `npm test`, exit 1):

```
  FAIL  4 npm test (exit 1)
        not ok 988 - a worker that finishes inside the start-up poll still answers `pending`, and one --wait collects it
        # tests 2281
        # pass 2276
        # fail 1
```

The log carries no assertion diagnostic for case 988, so which `assert` threw is not quoted there. First round; no earlier log, so no regression class.

**Diagnosis.** This is a timing race in the test, not a defect in the wrapper, and this branch touches neither file (the last commits to `cli/templates/scripts/run-test-suite.sh` and to the test both predate the branch).

The case starts an un-held run (no `STUB_RELEASE`), takes the run form's `pending`, then issues **one** `--wait` with `RUN_TEST_SUITE_WAIT_SLICE: '1'` and asserts `pass`. Nothing makes sure the worker has finished by then:

- The run form in `cli/templates/scripts/run-test-suite.sh` answers `pending` as soon as **either** `.verdict` exists **or** `.running` holds the worker's PID (the `if [ -f "$verdict_file" ] || [ "$(cat "$running_file" 2>/dev/null)" = "$worker_pid" ]` poll). In practice it mostly returns on the `.running` branch, while the worker is still running its gates. The case name says the worker "finishes inside the start-up poll", but nothing in the case forces that.
- The worker needs at least about two seconds after it claims `.running`. `run_gate` loops `while kill -0 "$gate_pid"; do touch -c …; sleep "$HEARTBEAT_SECONDS"; done` with `HEARTBEAT_SECONDS=1`, and it runs twice (typecheck `echo typecheck`, then `bash stub.sh`). On top of that come bash start-up and the library's config reads.
- With a slice of `1`, `wait_for_verdict` sets its deadline to `SECONDS + 1`, checks, sleeps 1 and checks once more before it breaks and prints `pending`. So the single `--wait` covers only about one to two seconds.

On an idle machine the worker usually wins. Under this round's full suite (about 34 minutes, 2281 tests, many spawning bash fixtures at once) it did not, so `waited.stdout` was most likely `pending\n` where the assertion `assert.equal(waited.stdout, 'pass\n')` expects `pass\n`. The `counterLines` assertion does not change the conclusion: if the counter was the failing check, the cause is still a worker that had not finished.

**Fix (in `cli/test/run-test-suite.test.mjs`, this case only):**

- [ ] After the three assertions on `started`, and before the one `--wait`, wait for the worker to write its verdict, using the file's existing helpers and constants: `await pollUntil(() => existsSync(join(dir, VERDICT)), 'the worker\'s verdict');`. The case then still asserts what its name promises: the run form answers `pending` (exit 3, empty stderr) whichever start-up branch it took, and **one** `--wait` collects `pass` with exit 0 and the command run exactly once. The verdict no longer depends on how long the slice lasts.
- [ ] Keep `RUN_TEST_SUITE_WAIT_SLICE: '1'` on that `--wait`. Once `.verdict` exists, `wait_for_verdict` prints it on its first check, so the slice no longer matters.
- [ ] Do not swap the single `--wait` for `collect(dir)`. That would drop the case's "one --wait collects it" subject, which other cases (`--wait prints \`pending\` while the run is live…`) already cover through `collect`.
- [ ] Leave `cli/templates/scripts/run-test-suite.sh` unchanged: its start-up contract (header `START-UP:` paragraph) is correct, and the defect is only the test's missing synchronisation.
- [ ] If the case's name or the file header's description of it is edited, keep the name byte-identical unless the edit is deliberate. The name is what a gate log reports.
