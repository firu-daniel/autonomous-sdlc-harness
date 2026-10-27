### 1. `sp__wp_tracked` test fails in its own setup or teardown, not in an assertion

**Site:** `cli/test/sandbox-probe-protection-legs.test.mjs` — the top-level test `'sp__wp_tracked: one tracked file, and nothing on stderr however long the list is'` (near line 151), specifically its seed sequence `await seedRepository(clone, { remote: false });` … `await runGit(clone, ['commit', '--quiet', '-m', 'seed tracked files']);`, and the case directory's teardown in `caseDir` — `t.after(() => rm(dir, { recursive: true, force: true }));`.

**Failing test:** `cli/test/sandbox-probe-protection-legs.test.mjs` — `sp__wp_tracked: one tracked file, and nothing on stderr however long the list is`

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
        npm error Lifecycle script `test` failed with error:
        npm error code 1
        npm error path cli
        npm error command sh -c node --test --test-timeout=1800000
```

**Class:** new this round (round 1; no earlier log).

**Diagnosis.**

- **What the log says.** Only the parent test is `not ok`. `scripts/run-gates.sh` → `gate()` greps the whole TAP output for `^[[:space:]]*not ok `, which would also have printed an indented `not ok` line for either subtest (`README.md first`, `README.md excluded: the first other non-dot tracked file`). No such line appears, so **neither subtest assertion failed**. `# cancelled 0` rules out a test-timeout, which would have cancelled the pending subtests. The error itself is not in the log (run-gates prints only `not ok` lines and the last 25 lines). So the parent failed in its own body before the subtests ran (the 10,000 `writeFile` calls, `git add -A`, `git commit`), or in its `t.after` hook, which fails the parent with a hook failure after both subtests pass.
- **The function under test is not at fault in the current tree.** `scripts/lib/sandbox-probe/legs-protection.sh` → `sp__wp_tracked` no longer pipes: it captures `git -C "$SP_CLONE" ls-files` into `list`, matches `README.md` with a `case` pattern, and walks `list` through a here-document. With `trap '' PIPE` nothing in it can write `Broken pipe`. `git ls-files` byte order puts `README.md` before `f0.txt`, and `sp__ctl_literal` accepts `f0.txt`, so both expected stdouts hold.
- **Probable cause: git's auto-gc racing the teardown.** The seed commit writes about 10,002 loose objects (10,001 blobs, one tree, one commit). That is above git's default `gc.auto` threshold of 6,700, and the fixture's isolated configuration (`GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1` in `cli/test/helpers/fixture.mjs` → `ISOLATED_ENV`) keeps that default. `git commit` then starts `git maintenance run --auto` / `gc --auto` **detached in the background** (`gc.autoDetach` defaults to true), and it goes on packing and pruning under `clone/.git/objects` after `runGit` returns. Two outcomes fit the log:
  - The case directory's `rm(dir, { recursive: true, force: true })` walks `.git/objects` while gc is still writing packs or removing loose objects, and fails with `ENOTEMPTY` (or `ENOENT` on an entry gc removed). That is a hook failure on the parent and leaves the subtests green, which matches the log exactly.
  - Less likely: the detached gc's lock or pack activity reaches the test's own git calls.
  The suite's load (39 minutes total, many files in parallel) widens the race window. No other suite in `cli/test` commits anywhere near 6,700 objects, which is why only this test is hit.
- This is the most probable cause, not a certain one. The log does not carry the thrown error, and this plan-writing session could not reproduce it by hand. The fix below is safe whichever of the two setup or teardown paths failed, because it takes the background process out of the picture and makes the teardown resilient.

**Fix.**

- [ ] In the `sp__wp_tracked` test, right after `await seedRepository(clone, { remote: false });` and before `git add -A`, turn off automatic housekeeping in the clone so the seed commit starts no detached process: `await runGit(clone, ['config', 'gc.auto', '0']);` and `await runGit(clone, ['config', 'maintenance.auto', 'false']);`. Add a one-line comment saying why: 10,000 loose objects exceed `gc.auto`, and the detached gc races the case directory's removal.
- [ ] Make the case directory's teardown tolerate a transient race. In `caseDir`, change the `t.after` removal to `rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })`. This is belt-and-braces and does not replace the config change.
- [ ] Keep `TRACKED_COUNT` at 10,000, the `IGNORE_SIGPIPE` prefix and both subtests' assertions (`status`, exact `stdout`, empty `stderr`) unchanged. The over-64-KiB list is the regression the test exists to guard, so do not shrink or weaken it.
- [ ] Update the file's header comment (the paragraph beginning `The sp__wp_tracked repository commits 10,000 files`) with one sentence saying that the clone disables auto-gc so the seed commit leaves no background writer behind.

## Already passing

- **(a) Named test and file run:** `sp__wp_tracked: one tracked file, and nothing on stderr however long the list is`, in `cli/test/sandbox-probe-protection-legs.test.mjs`, run against the tree as committed at `409a35b5` (the implementer's edit stashed out first: the before-edit run was taken late, after the edit had been written and run once, then the edit was stashed and dropped).
- **(b) Command and result:** `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs`, from the repository root, in isolation: `ok 4 - sp__wp_tracked: one tracked file, and nothing on stderr however long the list is`, both subtests `ok`; file totals `# tests 11`, `# pass 11`, `# fail 0`, `# cancelled 0`. Caveat for whoever closes this: the diagnosis above names a load-dependent race (detached auto-gc against the teardown `rm`) that an isolated run is not expected to reproduce, so this pass does not show the race is gone. The drafted fix (the two `git config` lines, `maxRetries: 5, retryDelay: 100` on the `caseDir` removal, the header sentence) was also run once with the edit applied: `# pass 11`, `# fail 0`, and `npm test --workspace cli -- test/main-anchor-isolation.test.mjs` `# pass 2`, `# fail 0`.
- **(c) No code file edited:** the edit was discarded (`git stash drop`); `git status --short` is empty.
