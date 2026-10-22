### 1. Skip the hung-watcher survivor check only when `pgrep` cannot read the process table

**Site:** `cli/test/test-timeout.test.mjs`, the case `test('a hung watcher case fails by name with a timeout and leaves no process behind', …)`, at its last two statements:

```js
  const left = await execResult('pgrep', ['-f', fixtureDir]);
  assert.equal(left.status, 1, `processes of the hung fixture survived:\n${left.stdout}${left.stderr}`);
```

(about lines 106–108, as a navigation hint only.)

**Failing test:** `cli/test/test-timeout.test.mjs` — `a hung watcher case fails by name with a timeout and leaves no process behind`

**Failure, as the log reports it** (`harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_4.log`, gate 4 `npm test`):

```
        not ok 1029 - a hung watcher case fails by name with a timeout and leaves no process behind
```

The gate wrapper keeps only the `not ok` line. The failing assertion and its output were recorded when this file was run on its own in round 1 (Finding 3). The failing assertion is the `assert.equal(left.status, 1, …)` above, and `pgrep` printed this on stderr and exited 3:

```
sysmon request failed with error: sysmond service not found
pgrep: Cannot get process list
```

**Class:** persisting. It has failed in rounds 1, 2, 3 and 4.

**Diagnosis.** The case's assertions (1) to (3) pass: the child exits non-zero, names the case `not ok`, and says `timed out` or `cancelled`. The last assertion reads the process table through `pgrep -f <fixtureDir>` and expects exit 1, meaning nothing matched. Under the gate's command sandbox, `pgrep` cannot read the process table. It exits 3 with the two lines above, and `assert.equal(left.status, 1, …)` fails on that. No surviving process was listed. So the case fails because the check could not be made, not because the check found a survivor. The user confirmed that the case passes on this branch's tip when run unsandboxed (`harness-runs/clarifications/feat_unattended_sandbox_preflight/answer_1.md`). The user chose to fix it in this test (Option 3, Q1).

**Concrete fix.** Change only `cli/test/test-timeout.test.mjs`. Do not change `cli/test/helpers/fixture.mjs`, any sandbox profile, or `sandbox.optOut`.

- [ ] Keep the existing `pgrep` call as it is: `const left = await execResult('pgrep', ['-f', fixtureDir]);`.
- [ ] Insert a capability check between that call and the `assert.equal`. It skips only when `left.status` is **neither `0` nor `1`**:
  ```js
  // `pgrep` exits 1 when nothing matches, and 0 with the matches listed. Any other status means it
  // could not read the process table at all, so the survivor check cannot be made on this machine.
  if (left.status !== 0 && left.status !== 1) {
    t.skip(
      `pgrep cannot read the process table on this machine (exit ${left.status}: ${left.stderr.trim()}), ` +
        'so the hung fixture cannot be checked for survivors here',
    );
    return;
  }
  ```
  The skip message follows the existing `… is not on PATH on this machine, so … cannot be driven here` skips. It quotes `pgrep`'s own stderr and its status, so a sandboxed run records `exit 3: sysmon request failed with error: sysmond service not found` / `pgrep: Cannot get process list`. `execResult` resolves `error.code`. When `pgrep` cannot be spawned at all, that is a string such as `ENOENT`, which is also neither `0` nor `1`, so it takes this skip as well. That is still a measured inability to read the process table, not detection of the sandbox.
- [ ] Leave `assert.equal(left.status, 1, \`processes of the hung fixture survived:\n${left.stdout}${left.stderr}\`);` byte-for-byte unchanged after the check. Exit 0 with matches listed still fails the case. Exit 1 still passes it.
- [ ] Do not move, loosen or delete assertions (1) to (3), the `fixtureDir` non-empty assertion, or the `REAP_GRACE_MS` wait. The check decides only whether the last assertion can be made, and it reads only the `pgrep` result already in hand. It never inspects the environment for a sandbox.
- [ ] Amend the module header's description of what the case reads ("reads the child's TAP and the process table"). Add one sentence saying the process-table read is skipped, with `pgrep`'s own output quoted, when `pgrep` exits with anything but 0 or 1, because then it could not read the table and its answer says nothing about survivors. Per `.claude/context/cli.md` → `## What "done" means here`, a header must keep describing what the code under it does.
