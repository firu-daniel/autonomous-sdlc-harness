### 2. `--test-timeout=300000` cancels `cli/test/doctor.test.mjs` as a whole file

**File:** `cli/package.json` (`scripts.test`): `"test": "node --test --test-timeout=300000"`

**Failing test:** `cli/test/doctor.test.mjs`. The log reports the file, not a case: `not ok 6 - cli/test/doctor.test.mjs`.

**Failure, quoted from the gate log (machine paths rewritten):**

```
        not ok 6 - cli/test/doctor.test.mjs
        ...
        # fail 1
        # cancelled 2
        ...
        # duration_ms 475287.694083
        npm error command sh -c node --test --test-timeout=300000
```

**Class:** first round (no earlier log to compare). This branch's Task 6 introduced the flag, and the file passed without it.

**Diagnosis.** A `not ok` line naming a file path rather than a case, counted under `cancelled`, is the runner's file-level timeout. Under Node 20.19.5 (the suite's Node), `--test-timeout` bounds each test file's whole run as well as each case. This is recorded in `cli/test/helpers/fixture.mjs` → module header choice 6 and in Task 6's measured deviation: the file-level timer fires, kills the file's process, and the TAP line names the file.

`cli/test/doctor.test.mjs` is the suite's largest file, about 5,800 lines. Its many cases each drive `init` and `doctor` against a fresh fixture, under the concurrency bound in `cli/test/helpers/concurrency.mjs`. Its wall time is the sum of those subprocess chains divided by that bound, and it grows with load on the host. In this gate run, which took 475 seconds overall, the file passed 300 seconds and was killed.

The flag was sized for one case (`docs/development.md` → Gate 4: *"so every test has 300 seconds"*), not for a whole file. Nothing in `doctor.test.mjs` changed on this branch.

**Suspected shared cause:** likely the same cause as Finding 1. Both files were cancelled by path in the same run, and the only timeout either runs under is `scripts.test`'s `--test-timeout=300000`.

**Fix.** If Finding 1 has already landed, `cli/package.json` → `scripts.test` already reads `--test-timeout=1800000`. Confirm that and change nothing. Otherwise make the same edit here:

- [ ] `cli/package.json` → `scripts.test`: change `node --test --test-timeout=300000` to `node --test --test-timeout=1800000` (30 minutes). This stays a finite backstop against a gate that never ends. It sits above any honest file's wall time on a loaded host and far above the case-level `runBash` bounds (`TICK_TIMEOUT_MS` 60 000 in `cli/test/helpers/watcher.mjs`, `WATCHER_RUN_TIMEOUT_MS` 120 000 in `cli/test/watcher-remote-job.test.mjs`), which remain what fails a hung case by name.
- [ ] `docs/development.md` → the paragraph beginning `**A hung case cannot hold the gate.**`: replace `--test-timeout=300000` with `--test-timeout=1800000`. Replace *"so every test has 300 seconds. The value sits far above any honest case: the whole suite ran in 118 s on 10 cores …"* with the real contract: under Node 20.19.5 the flag bounds each test **file's** whole run as well as each case, so it is sized above a whole file's wall time on a loaded host. Write no duration from this gate run into the document; the lessons ledger bars in-session timing figures from a document of record.
- [ ] Same file, the `HARNESS_JOB_USAGE_REPEAT=40 node --test --test-timeout=300000 …` command block: change `300000` to `1800000`.
- [ ] `cli/test/watcher-remote-job.test.mjs`, module header: change both `--test-timeout=300000` occurrences to `--test-timeout=1800000`.

## Already passing

- **(a) What was checked:** the named test file `cli/test/doctor.test.mjs` was **not run** — neither `.claude/context/conventions.md` nor `.claude/context/cli.md` states a single-file test command, so the fix-site fallback applies. The fix sites read were: `cli/package.json` → `scripts.test`; `docs/development.md` → the `**A hung case cannot hold the gate.**` paragraph and the `HARNESS_JOB_USAGE_REPEAT=40` command block; `cli/test/watcher-remote-job.test.mjs`, module header.
- **(b) Evidence:** `grep -rn 'test-timeout=' cli/package.json cli/test docs/development.md` returns `"test": "node --test --test-timeout=1800000"` in `cli/package.json`, both header occurrences in `cli/test/watcher-remote-job.test.mjs` at `--test-timeout=1800000`, and `docs/development.md` at `--test-timeout=1800000` in both places, the paragraph already stating *"Under Node 20.19.5 that flag bounds each test **file's** whole run as well as each case, so it is sized above a whole file's wall time on a loaded host"* with no 300-second or 118 s wording. All landed in commit `a7c6410` (Finding 1). The close rests on reading the fix site, not on a test run; Phase G re-runs `doctor.test.mjs`.
- **(c)** No code file was edited.
