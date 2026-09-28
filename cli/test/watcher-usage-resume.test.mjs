/**
 * The local watcher's usage gate, resume side, driven one `tick` at a time against a fixture
 * `init` wired, with the agent CLI and the notifier recorded.
 *
 * **The rule these tests exist to enforce: a usage-paused run is never left without a resume
 * time, a hand pause is never touched, and the launch hold is bounded by the recorded time.**
 * Every case seeds the registry directly, so the record under test is the exact one a lost write
 * leaves behind rather than one the gate itself produced.
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { runBash } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const GATE_ON = { USAGE_CHECK_ENABLED: '1', USAGE_CHECK_INTERVAL_SECS: '0' };

const nowSecs = () => Math.floor(Date.now() / 1000);

/** A watcher fixture plus the paths and the library writer these cases read and drive. */
async function createUsageFixture(t) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;
  const state = join(w.dir, STATE_DIR);
  const registry = join(state, 'autonomous_logs', 'registry.json');
  const lib = join(w.dir, 'scripts', 'lib', 'harness-run-lib.sh');
  return {
    ...w,
    state,
    hold: () => existsSync(join(state, 'autonomous_logs', '.usage_hold')),
    async plantPauseAck() {
      await mkdir(state, { recursive: true });
      await writeFile(join(state, 'PAUSE'), '', 'utf8');
      await writeFile(join(state, 'PAUSE_ACK'), '', 'utf8');
    },
    async setField(key, value) {
      const result = await runBash(w.dir, [
        '-c',
        '. "$1"; hr_registry_set "$2" "$3" "$4" "$5"',
        '_',
        lib,
        registry,
        w.branch,
        key,
        value,
      ]);
      assert.equal(result.status, 0, `hr_registry_set exited ${result.status}\n${result.stderr}`);
    },
    paused: () => w.notifications().filter((n) => n.event === 'paused'),
  };
}

test('usage resume: a lost usage_resume_at is repaired and reported once, and the hold comes down', async (t) => {
  const u = await createUsageFixture(t);
  if (u === null) return;

  await t.test('the stranded record gets a future resume time, one notification and the hold', async () => {
    await u.seedRecord({ status: 'paused', paused_by: 'usage', usage_resume_at: '' });
    await u.plantPauseAck();
    const before = nowSecs();
    await u.tick(GATE_ON);

    assert.match(u.record().usage_resume_at, /^\d+$/);
    assert.ok(Number(u.record().usage_resume_at) > before, `usage_resume_at ${u.record().usage_resume_at}`);
    assert.equal(u.record().status, 'paused');
    assert.equal(u.record().paused_by, 'usage');
    const paused = u.paused();
    assert.equal(paused.length, 1, JSON.stringify(paused));
    assert.match(paused[0].detail, /lost its recorded reset time/);
    assert.equal(u.hold(), true, 'the launch hold is not up');
    assert.match(u.watcherLog(), /is usage-paused with no usable usage_resume_at/);
  });

  await t.test('a second pass sends no second notification', async () => {
    const repaired = u.record().usage_resume_at;
    await u.tick(GATE_ON);
    assert.equal(u.paused().length, 1, JSON.stringify(u.paused()));
    assert.equal(u.record().usage_resume_at, repaired);
    assert.equal(u.hold(), true);
  });

  await t.test('a resume time in the past drops RESUME, clears both tags and takes the hold down', async () => {
    await u.setField('usage_resume_at', '1');
    await u.tick(GATE_ON);
    assert.equal(existsSync(join(u.state, 'RESUME')), true, 'RESUME was not dropped');
    assert.equal(u.record().paused_by, '');
    assert.equal(u.record().usage_resume_at, '');
    assert.equal(u.hold(), false, 'the launch hold outlived the recorded time');
    assert.equal(u.paused().length, 1);
  });
});

test('usage resume: a hand pause is never touched', async (t) => {
  const u = await createUsageFixture(t);
  if (u === null) return;

  await u.seedRecord({ status: 'paused', paused_by: '', usage_resume_at: '' });
  await u.plantPauseAck();
  const { updated_at: _seeded, ...before } = u.record();
  await u.tick(GATE_ON);

  const { updated_at: _after, ...after } = u.record();
  assert.deepEqual(after, before);
  assert.equal(existsSync(join(u.state, 'RESUME')), false, 'a RESUME was dropped for a hand pause');
  assert.deepEqual(u.notifications(), []);
  assert.equal(u.hold(), false, 'a hand pause raised the launch hold');
});
