/**
 * The suite's timing multiplier, `HARNESS_TEST_TIME_SCALE` (`helpers/timing.mjs`).
 *
 * **The rule this test exists to enforce: the multiplier takes a number above 0 and at most the cap,
 * refuses anything else by name, and a shared bound scales by it.** The pure cases call
 * `parseTimeScale` directly. The load-time cases import `helpers/timing.mjs` and
 * `helpers/watcher.mjs` in a child `node`, because the variable is read once at load; the child's
 * environment drops `HARNESS_TEST_TIME_SCALE` and `NODE_TEST_CONTEXT` before adding the case's own
 * value, so a parent run that exports the variable cannot decide the result, and blanks
 * `HARNESS_MAIN_REPO` so a watcher-launched run's anchor does not leak into the child. No case
 * measures wall time.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { DEFAULT_TIME_SCALE, MAX_TIME_SCALE, parseTimeScale, TIME_SCALE_VARIABLE } from './helpers/timing.mjs';

const HELPERS_DIR = join(import.meta.dirname, 'helpers');
const TICK_BASE_MS = 60_000;

const CHILD_SOURCE = [
  `const { TIME_SCALE } = await import(${JSON.stringify(pathToFileURL(join(HELPERS_DIR, 'timing.mjs')).href)});`,
  `const { TICK_TIMEOUT_MS } = await import(${JSON.stringify(pathToFileURL(join(HELPERS_DIR, 'watcher.mjs')).href)});`,
  'process.stdout.write(JSON.stringify({ scale: TIME_SCALE, tick: TICK_TIMEOUT_MS }));',
].join('\n');

/**
 * Load both helpers in a child `node` with the variable set to `value`, or unset when `undefined`.
 *
 * @param {string | undefined} value
 * @returns {Promise<{ status: number, stdout: string, stderr: string }>}
 */
function loadWith(value) {
  const env = { ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: '' };
  delete env[TIME_SCALE_VARIABLE];
  delete env.NODE_TEST_CONTEXT;
  if (value !== undefined) env[TIME_SCALE_VARIABLE] = value;
  return new Promise((resolveRun) => {
    execFile(process.execPath, ['--input-type=module', '-e', CHILD_SOURCE], { env }, (error, stdout, stderr) => {
      const status = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
      resolveRun({ status, stdout, stderr });
    });
  });
}

test('parseTimeScale', async (t) => {
  await t.test('unset returns the default', () => {
    assert.equal(parseTimeScale(undefined), DEFAULT_TIME_SCALE);
  });

  for (const [value, expected] of [
    ['1', 1],
    ['2.5', 2.5],
    ['5', 5],
  ]) {
    await t.test(`'${value}' returns ${expected}`, () => {
      assert.equal(parseTimeScale(value), expected);
    });
  }

  for (const value of ['abc', '', '0', '-1', '2x', '1e3', 'Infinity']) {
    await t.test(`'${value}' is refused by name`, () => {
      assert.throws(
        () => parseTimeScale(value),
        (error) => error.message.includes(TIME_SCALE_VARIABLE) && error.message.includes(`\`${value}\``),
      );
    });
  }

  await t.test(`'5.5' is refused naming the cap`, () => {
    assert.throws(
      () => parseTimeScale('5.5'),
      (error) => error.message.includes('`5.5`') && error.message.includes(`at most ${MAX_TIME_SCALE}`),
    );
  });
});

test('the multiplier at load', async (t) => {
  await t.test('unset loads the default and doubles the tick bound', async () => {
    const run = await loadWith(undefined);
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(JSON.parse(run.stdout), { scale: DEFAULT_TIME_SCALE, tick: TICK_BASE_MS * DEFAULT_TIME_SCALE });
  });

  await t.test("'1' keeps the tick bound at its written value", async () => {
    const run = await loadWith('1');
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(JSON.parse(run.stdout), { scale: 1, tick: TICK_BASE_MS });
  });

  await t.test("'3' triples the tick bound", async () => {
    const run = await loadWith('3');
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(JSON.parse(run.stdout), { scale: 3, tick: 180_000 });
  });

  await t.test("'abc' fails the load by name", async () => {
    const run = await loadWith('abc');
    assert.notEqual(run.status, 0);
    assert.ok(run.stderr.includes(TIME_SCALE_VARIABLE) && run.stderr.includes('abc'), run.stderr);
  });

  await t.test("'6' fails the load naming the cap", async () => {
    const run = await loadWith('6');
    assert.notEqual(run.status, 0);
    assert.ok(run.stderr.includes(`at most ${MAX_TIME_SCALE}`), run.stderr);
  });
});
