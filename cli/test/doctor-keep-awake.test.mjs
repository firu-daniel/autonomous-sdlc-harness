/**
 * `doctor`'s `keep-awake` check, driven through the compiled CLI on an `init`-wired fixture.
 *
 * **The rule these tests exist to enforce: `keep-awake` reports and never fails**, `--remote-job`
 * included.
 *
 * **Deliberately not covered here:** the real Linux lock probe and the macOS `caffeinate` lookup grade
 * the host, and no fixture can choose `process.platform`, so the per-host sentences are
 * `cli/test/keep-awake.test.mjs`'s pure cases. Every case below takes an arm that answers before any
 * probe.
 *
 * **The seam:** `cli/test/helpers/fixture.mjs` → `ISOLATED_ENV` sets `KEEP_AWAKE_LOCK_PROBE_ENV`
 * (imported from `../dist/doctor/checks.js`) to `off`, so neither this suite nor any other suite that
 * runs `doctor` takes a real lock unless a case passes `{ [KEEP_AWAKE_LOCK_PROBE_ENV]: '' }`, and no
 * case here does.
 */

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runCli } from './helpers/fixture.mjs';

const CONFIG_FILE = 'harness.config.json';

/** The `off` arm's sentence, as `doctor/keepAwake.ts` → `assessKeepAwake` writes it. */
const OFF_TEXT = 'off: `execution.keepAwake` is false';

/** The `not-applicable` arm's sentence, as `doctor/keepAwake.ts` → `assessKeepAwake` writes it. */
const NOT_APPLICABLE_TEXT = 'A GitHub Actions runner does not sleep';

/** A repository whose stack detection resolves every command — the seed `doctor.test.mjs` uses. */
function nodeProjectFiles() {
  return {
    'package.json': {
      name: 'fixture-project',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
    },
    'README.md': '# fixture project\n',
  };
}

/** Build a fixture, register its teardown, wire it with `init`, and return its directory. */
async function wiredFixture(t) {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);
  const result = await runCli(fixture.dir, ['init']);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return fixture.dir;
}

/** Sets `execution.keepAwake` in the fixture's config, or removes it when `value` is `undefined`. */
function setKeepAwake(dir, value) {
  const path = join(dir, CONFIG_FILE);
  const config = JSON.parse(readFileSync(path, 'utf8'));
  const execution = { ...(config.execution ?? {}) };
  if (value === undefined) delete execution.keepAwake;
  else execution.keepAwake = value;
  config.execution = execution;
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
}

/** A report line, as the reporter emits it: `!! FAIL  <id>  <detail>` on stderr. */
function failLine(id) {
  return new RegExp(`^!! FAIL\\s+${id}\\s`, 'm');
}

/** A report line, as the reporter emits it: `! WARN  <id>  <detail>` on stderr. */
function warnLine(id) {
  return new RegExp(`^! WARN\\s+${id}\\s`, 'm');
}

/** A report line, as the reporter emits it: `PASS  <id>  <detail>` on stdout. */
function passLine(id) {
  return new RegExp(`^PASS\\s+${id}\\s`, 'm');
}

/** The report's `keep-awake` PASS line, or an assertion failure naming the whole report. */
function keepAwakePassLine(result) {
  const report = `${result.stdout}\n${result.stderr}`;
  assert.match(result.stdout, passLine('keep-awake'), report);
  return result.stdout.split('\n').find((line) => passLine('keep-awake').test(line));
}

function assertNeverFailed(result) {
  const report = `${result.stdout}\n${result.stderr}`;
  assert.doesNotMatch(result.stderr, failLine('keep-awake'), report);
  assert.doesNotMatch(result.stderr, warnLine('keep-awake'), report);
}

test('execution.keepAwake false passes as off before any probe', async (t) => {
  const dir = await wiredFixture(t);
  setKeepAwake(dir, false);

  const result = await runCli(dir, ['doctor']);
  assert.ok(keepAwakePassLine(result).includes(OFF_TEXT), result.stdout);
  assertNeverFailed(result);
});

test('--remote-job with the key false passes as off and never fails', async (t) => {
  const dir = await wiredFixture(t);
  setKeepAwake(dir, false);

  const result = await runCli(dir, ['doctor', '--remote-job'], { GITHUB_ACTIONS: '' });
  assert.ok(keepAwakePassLine(result).includes(OFF_TEXT), result.stdout);
  assertNeverFailed(result);
});

test('GITHUB_ACTIONS=true with the key absent passes as not-applicable before any probe', async (t) => {
  const dir = await wiredFixture(t);
  setKeepAwake(dir, undefined);

  const result = await runCli(dir, ['doctor'], { GITHUB_ACTIONS: 'true' });
  assert.ok(keepAwakePassLine(result).includes(NOT_APPLICABLE_TEXT), result.stdout);
  assertNeverFailed(result);
});
