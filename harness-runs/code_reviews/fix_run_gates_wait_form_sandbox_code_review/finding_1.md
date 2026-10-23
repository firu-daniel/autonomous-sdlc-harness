### 1. The new `cannot read the heartbeat` refusal has no case, and the test header does not say it is uncovered

**File:** `cli/test/run-test-suite.test.mjs` (the module header's `Not covered here:` paragraph, and the case list after `test('a SIGINT to the run form\'s process group stops the gate before any release, then no verdict'`). The behaviour under test is in `cli/templates/scripts/run-test-suite.sh` (`run_alive`): "refuse \"cannot read the heartbeat of '$running_file'\"".

**The problem.** This branch adds an exit-2 refusal to `run_alive`. It fires when `.running` exists but `hr_lane_mtime` cannot read its mtime and prints `0`. `run_alive` has two callers, so the refusal is reachable from both the wait form (`wait_for_verdict`) and the run form (the `if run_alive; then wait_for_verdict; fi` guard). In the run form this is a behaviour change. Before this branch, an unreadable `.running` read as "not alive" and a fresh run started. Now the run form refuses and starts nothing. The script's exit map documents the refusal, but no case in the suite reaches it.

The testing bar in `.claude/context/conventions.md` → `## The testing bar` says *"where a documented behaviour is deliberately not covered, that header says which behaviour and why"*. The header's `Not covered here:` list names the sandbox, a `SIGKILL` to the run form's PID alone and the second `stat` spelling. It does not name this refusal. So the refusal is neither covered nor declared uncovered.

The case can be reached without a sandbox. `hr_lane_mtime` is the only `stat` call that `cli/templates/scripts/lib/harness-run-lib.sh` and `run-test-suite.sh` make, and both of its spellings fail if a `stat` that always exits non-zero is put first on `PATH`.

**Fix.** Add this case after the SIGINT case, in the same file. Every helper it uses (`plantRunning`, `deadPid`, `wrapper`, `counterLines`, `snapshotTree`, `mkdirSync`, `writeFileSync`, `join`) is already in scope:

```js
test('a .running whose heartbeat cannot be read refuses in both forms, and the run form starts nothing', async (t) => {
  const dir = await wiredFixture(t);
  plantRunning(dir, { pid: deadPid(), ageSeconds: 0 });
  // `hr_lane_mtime` is the only `stat` the wrapper reaches; a `stat` that always fails makes it print 0.
  const fakeBin = join(dir, 'fake-bin');
  mkdirSync(fakeBin);
  writeFileSync(join(fakeBin, 'stat'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  const env = { PATH: `${fakeBin}:${process.env.PATH}` };
  const refusal = /^run-test-suite\.sh: cannot read the heartbeat of '[^'\n]*task_round_1\.running'\n$/;
  const before = await snapshotTree(dir);

  const waited = await wrapper(dir, ['--wait', 'task_round_1'], env);
  assert.equal(waited.status, 2);
  assert.equal(waited.stdout, '');
  assert.match(waited.stderr, refusal);

  const ran = await wrapper(dir, ['task_round_1'], env);
  assert.equal(ran.status, 2);
  assert.equal(ran.stdout, '');
  assert.match(ran.stderr, refusal);
  assert.deepEqual(counterLines(dir), [], 'the run form started the command');
  assert.deepEqual(await snapshotTree(dir), before, 'a refusal wrote a file');
});
```

This fix edits only this one test file, so the only test it runs is that file: `npm test --workspace cli -- test/run-test-suite.test.mjs`. The full suite runs later, in the Run gates phase.
