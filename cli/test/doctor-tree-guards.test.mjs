/**
 * `doctor`'s `tree-guards` line, against the compiled CLI on repositories `init` wired.
 *
 * **The rule this suite enforces: every `treeGuards` entry whose `test` resolves to no regular file —
 * joined to the repository root or to any `layers[].path` — is reported as a `warn` naming that
 * `test`, and a warning never moves the exit status.** An absolute `test`, or one carrying a `..`
 * segment, resolves against nothing. No case reaches the network.
 */

import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { CHECKS } from '../dist/doctor/checks.js';
import { createFixture, runCli } from './helpers/fixture.mjs';

const CONFIG_FILE = 'harness.config.json';
const CHECK_ID = 'tree-guards';
const NO_GUARDS_SENTENCE = 'no treeGuards are configured, so a unit runs no tree guard';

/** A repository whose stack detection resolves every command, so `init` writes a config `doctor` passes. */
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

/** A repository `init` wired, torn down after `t`. */
async function wiredFixture(t) {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);
  const init = await runCli(fixture.dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  return fixture.dir;
}

/** Write an empty file at `relativePath` under `dir`. */
function plant(dir, relativePath) {
  const path = join(dir, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, '', 'utf8');
}

/** Set `treeGuards` through the CLI's own writer, asserting it accepted the value. */
async function setGuards(dir, guards) {
  const set = await runCli(dir, ['config', 'set', 'treeGuards', JSON.stringify(guards)]);
  assert.equal(set.status, 0, `config set exited ${set.status}\n${set.stdout}\n${set.stderr}`);
}

/** The `id` line in `status`, from the stream the reporter puts it on, or `undefined`. */
function checkLine({ stdout, stderr }, status, id) {
  const [stream, prefix] = { PASS: [stdout, ''], WARN: [stderr, '! '], FAIL: [stderr, '!! '] }[status];
  return stream.split('\n').find((line) => new RegExp(`^${prefix}${status}\\s+${id}\\s`).test(line));
}

/** Run `doctor`; return its `tree-guards` line in `status`, asserting there is one, and the whole result. */
async function doctorLine(dir, status) {
  const result = await runCli(dir, ['doctor']);
  const line = checkLine(result, status, CHECK_ID);
  assert.ok(line !== undefined, `no ${status} ${CHECK_ID} line\n${result.stdout}\n${result.stderr}`);
  return { line, result };
}

test('the tree-guards check warns on a test that names no file', async (t) => {
  await t.test('it is listed directly after layer-drift', () => {
    const ids = CHECKS.map((check) => check.id);
    assert.equal(ids[ids.indexOf('layer-drift') + 1], CHECK_ID, ids.join(', '));
  });

  await t.test('with the key absent it passes with the no-guards sentence', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const config = JSON.parse(readFileSync(join(dir, CONFIG_FILE), 'utf8'));
    assert.equal(config.treeGuards, undefined, 'the fixture sets treeGuards');

    const { line } = await doctorLine(dir, 'PASS');
    assert.ok(line.includes(NO_GUARDS_SENTENCE), line);
  });

  await t.test('a test that exists relative to the repository root passes', async (subtest) => {
    const dir = await wiredFixture(subtest);
    plant(dir, 'test/root-guard.test.mjs');
    await setGuards(dir, [{ test: 'test/root-guard.test.mjs', covers: 'src/**' }]);

    await doctorLine(dir, 'PASS');
  });

  await t.test('a test that exists only under a configured layers[].path passes', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const path = join(dir, CONFIG_FILE);
    const config = JSON.parse(readFileSync(path, 'utf8'));
    config.layers = [{ ...config.layers[0], name: 'app', path: 'app' }, ...config.layers];
    writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    plant(dir, 'app/test/layer-guard.test.mjs');
    await setGuards(dir, [{ test: 'test/layer-guard.test.mjs', covers: 'app/src/**' }]);

    await doctorLine(dir, 'PASS');
  });

  await t.test('a test that exists nowhere warns naming it, with the exit status unchanged', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const baseline = await runCli(dir, ['doctor']);
    await setGuards(dir, [{ test: 'test/missing-guard.test.mjs', covers: 'src/**' }]);

    const { line, result } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes('test/missing-guard.test.mjs'), line);
    assert.ok(line.includes('config set treeGuards'), line);
    assert.equal(result.status, baseline.status, `${result.stdout}\n${result.stderr}`);
  });

  await t.test('a test carrying a .. segment warns even where the file exists', async (subtest) => {
    const dir = await wiredFixture(subtest);
    plant(dir, 'test/escape-guard.test.mjs');
    await setGuards(dir, [{ test: 'app/../test/escape-guard.test.mjs', covers: 'src/**' }]);

    const { line } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes('app/../test/escape-guard.test.mjs'), line);
  });
});
