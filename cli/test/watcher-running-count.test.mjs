/**
 * The written watcher's `running_count`, and the terminal writes that feed it, against a fixture.
 *
 * **The rule these tests exist to enforce: a record holds a slot only while its status is `running`
 * and its pid is alive, and a run that reaches `completed` or `failed` drops its pid.** The defect
 * they replay: `running_count` tested only the pid, so a finished record whose pid the OS had reused
 * held a slot against the cap.
 *
 * Not driven here: the stall watchdog's two give-up arms and `fail_before_launch`, which need the
 * watchdog's timing or a failed working-copy build. Their edit is the same one-write `pid ""` pair
 * as the `classify_run_exit` and `reconcile_stale_runs` arms these cases drive.
 *
 * A session's terminal write can land before `spawn_engine`'s parent writes `pid "$!"`, leaving the
 * session's own dead subshell pid on the record, so a session-written terminal record is asserted to
 * hold `''` or a pid that no longer answers `kill -0`, never `''` alone.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { runBash } from './helpers/fixture.mjs';
import { createWatcherFixture, TICK_TIMEOUT_MS } from './helpers/watcher.mjs';

const REGISTRY_PATH = 'sdlc-harness/autonomous_logs/registry.json';

/** A `sleep` child of this test, killed when the test ends; its pid answers `kill -0`. */
function liveChild(t) {
  const child = spawn('sleep', ['300'], { stdio: 'ignore' });
  t.after(() => child.kill('SIGKILL'));
  return child.pid;
}

/** The pid of a child this test spawned and has already reaped. */
async function deadPid() {
  const child = spawn('true', [], { stdio: 'ignore' });
  await once(child, 'exit');
  return child.pid;
}

/** Replace the registry with these records, keyed by branch. */
async function seedRuns(f, runs) {
  const path = join(f.dir, REGISTRY_PATH);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify({ runs }, null, 2)}\n`, 'utf8');
}

/** `running_count`'s stdout, reached the way the watcher header's REPRO reaches it. */
async function runningCount(t, f) {
  const result = await runBash(
    f.dir,
    ['-c', '. "$1" status >/dev/null; running_count', '_', f.watcherPath],
    f.watcherEnv(),
    { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal },
  );
  assert.equal(result.status, 0, `running_count exited ${result.status}\n${result.stderr}`);
  return result.stdout;
}

/** A session-written terminal record's pid: dropped, or the session's own exited subshell. */
function assertPidDropped(pid) {
  if (pid !== '') assert.throws(() => process.kill(Number(pid), 0), { code: 'ESRCH' });
}

test('a completed and a failed record holding a live pid count 0', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const pid = liveChild(t);

  await seedRuns(f, { done: { status: 'completed', pid }, broke: { status: 'failed', pid } });
  assert.equal(await runningCount(t, f), '0\n');
});

test('a parked and a paused record holding a live pid count 0', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const pid = liveChild(t);

  await seedRuns(f, { held: { status: 'parked', pid }, waiting: { status: 'paused', pid } });
  assert.equal(await runningCount(t, f), '0\n');
});

test('a running record holding a live pid counts 1, beside terminal records or alone', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const pid = liveChild(t);

  await seedRuns(f, { live: { status: 'running', pid } });
  assert.equal(await runningCount(t, f), '1\n');

  await seedRuns(f, {
    live: { status: 'running', pid },
    done: { status: 'completed', pid },
    broke: { status: 'failed', pid },
  });
  assert.equal(await runningCount(t, f), '1\n');
});

test('a running record whose process is gone is reconciled to failed with its pid dropped', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;

  await f.seedRecord({ status: 'running', pid: await deadPid() });
  await f.tick();

  const record = f.record();
  assert.equal(record.status, 'failed', f.watcherLog());
  // reconcile_stale_runs writes from the watcher itself, so no session-exit window applies.
  assert.equal(record.pid, '');
  assert.equal(await runningCount(t, f), '0\n');
});

for (const [label, stub, status] of [
  ['completed', ':', 'completed'],
  ['failed', 'exit 3', 'failed'],
]) {
  test(`a parked run resumed on its answer ends ${label} and drops its pid`, async (t) => {
    const f = await createWatcherFixture(t);
    if (f === null) return;

    await f.seedRecord();
    await f.writeQuestion(1, '## Q1\n');
    await f.writeAnswer(1, 'a1\n');
    await f.setStub(stub);
    await f.tick();

    assert.equal(f.prompts().length, 1, `expected one resume:\n${f.watcherLog()}`);
    const record = f.record();
    assert.equal(record.status, status, f.watcherLog());
    assertPidDropped(record.pid);
    assert.equal(await runningCount(t, f), '0\n');
  });
}
