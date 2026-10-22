### 3. The hung-watcher timeout case fails

**Site:** `cli/test/test-timeout.test.mjs` → `test('a hung watcher case fails by name with a timeout and leaves no process behind', …)` (near line 80). Its bounds are `const CHILD_TEST_TIMEOUT_MS = 240_000;`, `const CHILD_BOUND_MS = 2_000;` and `const REAP_GRACE_MS = 500;`. The child it writes (`childSource`) runs `createWatcherFixture` from `cli/test/helpers/watcher.mjs` and then `runBash(f.dir, [f.watcherPath, 'watch'], …, { timeoutMs: CHILD_BOUND_MS, … })`. The reap it asserts is `cli/test/helpers/fixture.mjs` → `runBounded` / `killGroup`.

**Failing test:** `cli/test/test-timeout.test.mjs` — `a hung watcher case fails by name with a timeout and leaves no process behind`

**The failure, quoted from the log:**

```
        not ok 1029 - a hung watcher case fails by name with a timeout and leaves no process behind
```

The gate wrapper (`scripts/run-gates.sh` → `gate`) keeps only the `not ok` lines and the last 25 lines of the suite's output, and deletes its own log afterwards. The assertion message is therefore not in the log. It is new this round: no earlier round exists.

**Diagnosis, from the current tree.** The case has four assertions, and each points at a different cause:

1. `assert.notEqual(child.status, 0, …)`: the child passed. Nothing in the tree makes that plausible.
2. `assert.match(child.stdout, /^not ok \d+ - a watch loop that never returns$/m, …)`: the child's TAP named the **file** instead of the case. That happens when the child runner's own `--test-timeout` (240 s) fires before the 2-second `runBash` bound, which means the child's setup took about four minutes: fixture seeding, `init` and `createWatcherFixture`. An earlier fix plan in this project hit exactly this on a loaded gate host, and the 240-second figure is the bound that fix chose. This run's suite took 2,342 seconds across 2,264 tests, so a loaded host is the leading candidate here too.
3. `assert.match(child.stdout, /timed out|cancelled/, …)`: same cause as (2).
4. `assert.equal(left.status, 1, …)` after `pgrep -f <fixtureDir>`: either a process of the hung fixture survived the group kill, or `pgrep` exited with neither 0 nor 1 because it could not read the process table. The second is a host or sandbox outcome, not a tree defect.

The branch's diff does not reach this path. The child drops nothing into the inbox, so `watch` never gets to the new preflight in `process_inbox_file`. The change to `helpers/watcher.mjs` alters `tick`, which the child does not call: it runs `watch` directly. `helpers/fixture.mjs` and this test file are unchanged on the branch. So code reading finds no defect, and the fix is chosen by the message the case reports.

**Suspected shared cause:** likely the same cause as Finding 2. Both are long, watcher-driven cases with a fixed wall-clock bound, and they failed in the same 39-minute, heavily concurrent suite run.

**Fix.**

- [ ] **The message is assertion (2) or (3), and the child's TAP shows `not ok 1 - <child path>` (the file, not the case).** The child runner's file bound was exceeded during setup. Raise `CHILD_TEST_TIMEOUT_MS` to `600_000`. That is still below the parent suite's `--test-timeout` (`cli/package.json` → `scripts.test`, 1 800 000 ms), which the constant's doc comment requires. Amend that doc comment to give the new figure and the reason: a loaded gate host was measured taking longer than 240 s for the child's setup. `CHILD_BOUND_MS` stays at 2 000; it is the bound under test.
- [ ] **The message is assertion (4), and the listed processes belong to the fixture.** The group kill in `cli/test/helpers/fixture.mjs` → `runBounded` / `killGroup` left a descendant behind. Find the process that left the group (its command line is in the message) and make the reap cover it. Do not lengthen `REAP_GRACE_MS` to hide it.
- [x] **The message is assertion (4) with a `pgrep` status other than 0 or 1, and the `pgrep` output carries `Operation not permitted` or another refusal of the process-table read.** This is the sandbox refusing a verification. Per `layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.**, it is recorded with the refusal quoted, and the case and its assertion stay as they are.
- [ ] **Any other message.** The diagnosis above does not cover it. Fix what the message names, at the site it names, and record the message in this file's deviation note.

None of these branches deletes, skips or loosens an assertion in the case.

**Deviations from plan:**

- **Branch taken: assertion (4), the sandbox refusing the process-table read. No code or test file was edited.** The named test's file was run from the repository root with `npm test --workspace cli -- test/test-timeout.test.mjs`. The result was `not ok 1 - a hung watcher case fails by name with a timeout and leaves no process behind`, with `# tests 1`, `# pass 0`, `# fail 1` and `duration_ms: 3029.020917`. The failing assertion is `test-timeout.test.mjs:108:10` (`assert.equal(left.status, 1, …)`), quoted from the run:

  ```
  processes of the hung fixture survived:
  sysmon request failed with error: sysmond service not found
  pgrep: Cannot get process list


  3 !== 1
  ```

  Assertions (1) to (3) passed in this run, so the child named the case and reported a timeout well inside its bound. The 240 s child-timeout branch does not apply, and `CHILD_TEST_TIMEOUT_MS` stays at `240_000`. The listing is empty, and the error is `pgrep` exiting 3 because it could not reach `sysmond` for the process list. That is the macOS Seatbelt sandbox this run executes under refusing the process-table read. It is not a process that survived the group kill, so the `killGroup` branch does not apply either.
- **Evidence downgrade.** The case's no-survivor claim (assertion 4) could not be verified inside this sandbox, and the reap in `cli/test/helpers/fixture.mjs` → `runBounded` / `killGroup` is unverified here. The case and its assertion stay as they are, per this file's third fix branch and `layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.** No sandbox profile entry was added or requested. The case passes only on a host where `pgrep` can read the process table, so the Run gates phase reports it `not ok` again for as long as the gates run under this sandbox. Whether to run that gate outside the sandbox is the operator's decision.
