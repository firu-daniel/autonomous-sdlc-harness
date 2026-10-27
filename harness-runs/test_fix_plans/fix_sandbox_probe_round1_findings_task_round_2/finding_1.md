### 1. `sp__wp_tracked` test still fails in its own setup or teardown: the round-1 fix was never applied

**Site:** `cli/test/sandbox-probe-protection-legs.test.mjs`:

- the top-level test `'sp__wp_tracked: one tracked file, and nothing on stderr however long the list is'` (near line 151), specifically its seed sequence from `await seedRepository(clone, { remote: false });` through `await runGit(clone, ['commit', '--quiet', '-m', 'seed tracked files']);`;
- the case directory's teardown in `async function caseDir(t)`, `t.after(() => rm(dir, { recursive: true, force: true }));` (near line 54);
- the file header paragraph beginning `The \`sp__wp_tracked\` repository commits 10,000 files`.

**Failing test:** `cli/test/sandbox-probe-protection-legs.test.mjs`, `sp__wp_tracked: one tracked file, and nothing on stderr however long the list is`

**Failure, quoted from the log (gate 4, `npm test`):**

```
  FAIL  4 npm test (exit 1)
        not ok 1093 - sp__wp_tracked: one tracked file, and nothing on stderr however long the list is
        ...
        # tests 2554
        # suites 8
        # pass 2549
        # fail 1
        # cancelled 0
        # skipped 4
        # todo 0
        # duration_ms 2179198.529292
        npm error Lifecycle script `test` failed with error:
        npm error code 1
        npm error path cli
        npm error command sh -c node --test --test-timeout=1800000
```

**Class:** persisting. The same test, at the same TAP number `1093`, failed with the same totals in round 1 (`task_round_1.log`).

**Diagnosis.**

- **Why it persists.** Round 1's test fix plan diagnosed this failure and prescribed a fix. That fix was never committed. The round-1 unit drafted it, ran the test file **in isolation**, saw `# pass 11`, `# fail 0`, discarded the edit and closed the finding as "already passing" (commit `e943c2a7`). Its own record says the isolated pass does not show the race is gone. The full-suite run in round 2 confirms that. The current tree still has no `gc.auto` or `maintenance.auto` setting and no `maxRetries` anywhere under `cli/test`, and the test body and `caseDir` are unchanged from round 1. Commit `a9584b50` (the N3 loopback-listener change) touched a different file and does not affect this test.
- **An isolated pass of this file is not evidence for this finding.** The failure depends on load. It showed up only in the full suite (about 36 to 40 minutes, many files running in parallel), in both rounds. A pass of the file on its own was already seen in round 1 while the full suite still failed. So that pass cannot close this finding.
- **What the log says.** Only the parent test is `not ok`. `scripts/run-gates.sh` → `gate()` prints every `not ok` line in the TAP output, indented ones included, and no line appears for either subtest (`README.md first`, `README.md excluded: the first other non-dot tracked file`). So **neither subtest assertion failed**. `# cancelled 0` rules out a test timeout. The parent therefore failed either in its own body before the subtests ran (the 10,000 `writeFile` calls, `git add -A`, `git commit`, any of which throws through `runGit` → `fixture setup: ... exited ...`) or in its `t.after` teardown hook, which fails the parent after both subtests pass.
- **The function under test is not at fault.** `scripts/lib/sandbox-probe/legs-protection.sh` → `sp__wp_tracked()` captures `git -C "$SP_CLONE" ls-files` into `list`, matches `README.md` with a `case` pattern and walks `list` through a here-document. No pipe is left that could write `Broken pipe`, and the subtests passed in both rounds.
- **Probable cause: git's automatic gc racing the teardown.** The seed commit writes about 10,002 loose objects (10,001 blobs, one tree, one commit). That is above git's default `gc.auto` threshold of 6,700. The fixture's isolated configuration (`cli/test/helpers/fixture.mjs` → `ISOLATED_ENV`: `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_SYSTEM=/dev/null`) keeps that default, and `seedRepository` sets only `user.email` and `user.name`. After the commit, git starts `maintenance run --auto` / `gc --auto` **detached** (`gc.autoDetach` defaults to true). That background process keeps packing and pruning under `clone/.git/objects` after `runGit` returns. Under suite load it is still running when the case directory's `rm(dir, { recursive: true, force: true })` walks the tree. The `rm` fails with `ENOTEMPTY` (or `ENOENT`) as a hook failure on the parent while the subtests stay green, which matches the log exactly. No other suite under `cli/test` commits anywhere near 6,700 objects, which is why only this test is hit.
- **Certainty.** This is the most probable cause, not a proven one, because the log does not carry the thrown error. The fix below works whichever setup or teardown path failed: it removes the background writer and makes the teardown tolerate a transient race.

**Fix.**

- [ ] In the `sp__wp_tracked` test, right after `await seedRepository(clone, { remote: false });` and before `git add -A`, turn off automatic housekeeping in the clone so the seed commit starts no detached process: `await runGit(clone, ['config', 'gc.auto', '0']);` and `await runGit(clone, ['config', 'maintenance.auto', 'false']);`. Add a one-line comment saying why: 10,000 loose objects exceed `gc.auto`, and the detached gc races the case directory's removal.
- [ ] Make the case directory's teardown tolerate a transient race. In `caseDir`, change the `t.after` removal to `rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })`. This is extra protection and does not replace the config change.
- [ ] Leave `TRACKED_COUNT` at `10_000` and keep the `IGNORE_SIGPIPE` prefix and both subtests' assertions (`status`, exact `stdout`, empty `stderr`) as they are. The list longer than 64 KiB is the regression this test exists to guard, so do not shrink or weaken it.
- [ ] Add one sentence to the file header paragraph beginning `The \`sp__wp_tracked\` repository commits 10,000 files`: the clone disables automatic gc so that the seed commit leaves no background writer behind.
- [ ] Land the change as a real edit. This finding persists because the round-1 fix was drafted, passed in isolation and then discarded. Do not discard it again on the strength of another isolated pass.
