### 2. `run-test-suite.test.mjs` asserts `.running` is gone in the window between the verdict's rename and `.running`'s removal

**Site:** `cli/test/run-test-suite.test.mjs`, the parameterised loop whose first row is `'a finished \`pass\` run leaves its verdict, and --wait reads it without re-running'` (around line 359). The racing assertion is `assert.equal(existsSync(join(dir, RUNNING)), false, '.running outlived the run');` (around line 374), which runs right after `runAndCollect` returns. The same assertion follows `runAndCollect` / `collect` in two more cases: `'a run form finding a stale heartbeat of its label starts a fresh run'` (around line 561) and the SIGINT-to-the-group case ending `await collect(dir);` (around line 685).

**Failing test:** `cli/test/run-test-suite.test.mjs` — `a finished \`pass\` run leaves its verdict, and --wait reads it without re-running`

**Failure (from the log):**

```
  FAIL  4 npm test (exit 1)
        not ok 1038 - a finished `pass` run leaves its verdict, and --wait reads it without re-running
        ...
        # tests 2791
        # pass 2786
        # fail 1
        # skipped 4
        # duration_ms 2225382.745167
        npm error command sh -c node --test --test-timeout=1800000
```

The gate output keeps only the `not ok` line. It does not show which assertion failed.

**Diagnosis:** This is the first round, so there is no earlier log to compare against. This branch did not touch the code under test. Its code commits change `cli/src/retrieval/corpus.ts`, `cli/test/docs-retrieval-corpus.test.mjs`, files under `docs-retrieval-service/` and `docs/retrieval.md`. `cli/templates/scripts/run-test-suite.sh` and this test file are unchanged. The `fail` row of the same loop runs the identical body and passed. Both point to a timing race rather than a regression.

The wrapper finishes a run in two steps. First it does `printf '%s\n' "$verdict" > "$verdict_file.tmp" && mv -f "$verdict_file.tmp" "$verdict_file"`. Only after that does it run `if [ "$(cat "$running_file" 2>/dev/null)" = "$$" ]; then rm -f "$running_file"; fi`. The order is deliberate: `wait_for_verdict` comments "The verdict is renamed into place before `.running` is removed". The test's `collect` returns as soon as `--wait` prints the verdict, which can happen the moment `.verdict` exists. The test then checks synchronously that `.running` is already gone. On a loaded host, the worker can still be between the `mv` and the `rm`, and the assertion fires. This round's suite ran 2791 tests over about 37 minutes, which is the kind of load that opens that window. The log does not say which assertion failed, so this is the most likely cause, not a confirmed one. It is the only assertion in the body that depends on state the worker changes after the verdict is visible.

Do not reorder the wrapper. Removing `.running` before the verdict lands would open a window with neither file present, and in that window `--wait` refuses with "no run in flight".

**Fix:**
- [ ] In the `pass` / `fail` loop body, replace the instant `assert.equal(existsSync(join(dir, RUNNING)), false, '.running outlived the run');` with `await pollUntil(() => !existsSync(join(dir, RUNNING)), '.running removed after the verdict');`. `pollUntil` and its scaled `POLL_LIMIT` already exist in this file. The test still requires `.running` to be removed; it no longer requires that to happen in the same instant the verdict appears.
- [ ] Apply the same replacement at the two other post-`collect` sites (the stale-heartbeat case and the SIGINT-to-the-group case). They carry the same race.
- [ ] Update the file's header doc comment only if it states that `.running` is gone the moment the verdict is read. Otherwise leave it.
- [ ] Do not touch `cli/templates/scripts/run-test-suite.sh` or `scripts/run-test-suite.sh`.
