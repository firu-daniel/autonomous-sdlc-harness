### 1. `--test-timeout=300000` cancels `cli/test/docs-retrieval.test.mjs` as a whole file

**File:** `cli/package.json` (`scripts.test`): `"test": "node --test --test-timeout=300000"`

**Failing test:** `cli/test/docs-retrieval.test.mjs`. The log reports the file, not a case: `not ok 5 - cli/test/docs-retrieval.test.mjs`.

**Failure, quoted from the gate log (machine paths rewritten):**

```
  FAIL  4 npm test (exit 1)
        not ok 5 - cli/test/docs-retrieval.test.mjs
        not ok 6 - cli/test/doctor.test.mjs
        ...
        # tests 1013
        # pass 1010
        # fail 1
        # cancelled 2
        ...
        npm error command sh -c node --test --test-timeout=300000
```

**Class:** first round (no earlier log to compare). This branch's Task 6 introduced the flag (`cli/package.json` went from `node --test` to `node --test --test-timeout=300000`), and the file passed before it.

**Diagnosis.** The log names the file, not a case, and counts it as **cancelled**, which is how Node's test runner counts a timeout expiry. Task 6 observed this directly and recorded it in the task plan's deviations and in `cli/test/helpers/fixture.mjs` → module header choice 6: under Node 20.19.5, the suite's Node, the runner's **file-level** timer is bounded by `--test-timeout` too. On expiry it kills the file's process and prints `not ok N - <file path>` with `test timed out after <n>ms`. So `--test-timeout=300000` does more than give each case 300 seconds. It caps each **test file's whole run** at 300 seconds.

`cli/test/docs-retrieval.test.mjs` runs its cases in series, and each builds a fixture, plants a model cache and drives the compiled CLI several times. Gate 4 runs files in parallel, so the file's wall time grows with load on the host. This gate run was slow overall: the log's closing summary reads `# duration_ms 475287.694083`. This file's run passed 300 seconds and was killed.

The flag's premise, stated in `docs/development.md` → Gate 4 (*"so every test has 300 seconds. The value sits far above any honest case: the whole suite ran in 118 s"*), is about cases. It does not hold for files on a loaded host, and 118 s was measured on Node 22, not the Node 20.19.5 the suite ran on here.

The case-level guarantee Task 6 wanted does not rely on this flag. Every watcher run is bounded by `runBash`'s `timeoutMs` (`tick` at `TICK_TIMEOUT_MS` = 60 000 ms in `cli/test/helpers/watcher.mjs`, `WATCHER_RUN_TIMEOUT_MS` = 120 000 ms in `cli/test/watcher-remote-job.test.mjs`), and that bound is what fails a hung case by name and reaps its group. The suite flag is only a backstop against a gate that never ends, so it has to sit above the slowest **file** under load, not the slowest case.

**Fix.**

- [ ] `cli/package.json` → `scripts.test`: change `node --test --test-timeout=300000` to `node --test --test-timeout=1800000` (30 minutes). This stays a finite backstop, so a hung file cannot hold gate 4 for ever. It sits far above any honest file's wall time on a loaded host, and still far above `WATCHER_RUN_TIMEOUT_MS` (120 000) and `TICK_TIMEOUT_MS` (60 000), so those case-level bounds keep firing first.
- [ ] `docs/development.md` → the paragraph beginning `**A hung case cannot hold the gate.**`:
  - Replace `--test-timeout=300000` with `--test-timeout=1800000`.
  - Replace the claim *"so every test has 300 seconds. The value sits far above any honest case: the whole suite ran in 118 s on 10 cores under **Run time, measured** below."* with the real contract: under Node 20.19.5 the flag bounds each test **file's** whole run as well as each case, so it is sized above a whole file's wall time on a loaded host, and the case-level bound is `runBash`'s `timeoutMs`.
  - Do **not** write this gate run's duration into the document. The lessons ledger bars a wall-clock figure a run measured inside its own session from a document of record.
- [ ] Same file, the command block under `**How the job-mode usage race is shown closed.**`: change `--test-timeout=300000` to `--test-timeout=1800000`.
- [ ] `cli/test/watcher-remote-job.test.mjs`, module header: change both `--test-timeout=300000` occurrences (the *"Every watcher this file starts is bounded and reaped"* paragraph and the `HARNESS_JOB_USAGE_REPEAT=40 node --test …` command line) to `--test-timeout=1800000`. The header's argument still holds: `WATCHER_RUN_TIMEOUT_MS` sits below it.
- [ ] Confirm that no tracked file outside `harness-runs/` still names `300000` as the suite timeout. The four sites above are the complete list at plan time.

Finding 2 (`doctor.test.mjs`) has the same cause and the same edit. If this finding lands first, Finding 2 only confirms it.
