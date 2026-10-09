/**
 * Where `init` puts the scripts, and what `doctor` says about it, against the compiled CLI.
 *
 * **The rule these tests exist to enforce: a new adoption writes its scripts to
 * `harness-scripts/`, an existing one never moves, and an absent key means `scripts`.** The first
 * half is what `init` writes into a config it generates; the second is that a config already on
 * disk is kept byte for byte by `init` and `init --force` alike, and generated against; the third is
 * that a config omitting `scriptsDir` keeps finding its scripts where every release before 0.6.6
 * wrote them, and is warned to say so explicitly.
 *
 * The kept-config cases are graded on the bytes on disk rather than on a message, and `doctor` runs
 * without `--check-github`, so no case reaches the network.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { DEFAULTS } from '../dist/config/model.js';
import { OUTER_LOOP_SCRIPTS, outerLoopRelativePath } from '../dist/generators/outerLoopScripts.js';
import { WRAPPER_SCRIPTS } from '../dist/generators/scripts.js';
import { createFixture, readJson, runCli, runGit, snapshotTree, INIT_SCRIPTS_DIR } from './helpers/fixture.mjs';

/** The two wrappers every `init` writes, whatever the stack. */
const VERIFIER_FILES = WRAPPER_SCRIPTS.filter(({ key }) => key === 'typecheck' || key === 'test').map(({ file }) => file);

/** The `commands.typecheck` and `commands.test` wrappers' file names. */
const TYPECHECK_WRAPPER = WRAPPER_SCRIPTS.find(({ key }) => key === 'typecheck').file;
const TEST_WRAPPER = WRAPPER_SCRIPTS.find(({ key }) => key === 'test').file;

/** A repository whose stack detection resolves every command — the seed `init`'s own tests use. */
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

/** A report line, as the reporter emits it: `! WARN  <id>  <detail>` on stderr. */
function warnLine(id) {
  return new RegExp(`^! WARN\\s+${id}\\s`, 'm');
}

/** A report line, as the reporter emits it: `PASS  <id>  <detail>` on stdout. */
function passLine(id) {
  return new RegExp(`^PASS\\s+${id}\\s`, 'm');
}

/** Build a fixture, register its teardown against the test, and return its directory. */
async function fixtureFor(t) {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);
  return fixture.dir;
}

/** Run one CLI invocation and require exit 0, naming its output when it is not. */
async function runOk(dir, args) {
  const result = await runCli(dir, args);
  assert.equal(result.status, 0, `${args.join(' ')} exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

/**
 * Write a hand-made `harness.config.json` carrying `scriptsDir` only when `scriptsDir` is given, and
 * return its bytes. `defaultBranch` is the fixture's own unborn branch, so `doctor` grades the
 * config's subject rather than a branch the fixture does not have.
 */
async function seedConfig(dir, scriptsDir) {
  const branch = (await runGit(dir, ['symbolic-ref', '--short', 'HEAD'])).stdout.trim();
  const wrapperDir = scriptsDir ?? DEFAULTS.scriptsDir;
  const config = {
    version: 1,
    defaultBranch: branch,
    stateDir: 'sdlc-harness',
    ...(scriptsDir === undefined ? {} : { scriptsDir }),
    layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
    commands: { typecheck: `bash ${wrapperDir}/${TYPECHECK_WRAPPER}`, test: `bash ${wrapperDir}/${TEST_WRAPPER}` },
  };
  const path = join(dir, 'harness.config.json');
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return readFileSync(path);
}

/** Every wrapper and outer-loop script exists under `scriptsDir`. */
function assertScriptsUnder(dir, scriptsDir) {
  for (const file of VERIFIER_FILES) {
    assert.ok(existsSync(join(dir, scriptsDir, file)), `${scriptsDir}/${file} was not written`);
  }
  for (const script of OUTER_LOOP_SCRIPTS) {
    const relativePath = outerLoopRelativePath(script);
    assert.ok(existsSync(join(dir, scriptsDir, relativePath)), `${scriptsDir}/${relativePath} was not written`);
  }
}

/** `doctor` exits 0 with the two script-wiring checks passing and no `scriptsDir` warning. */
async function assertDoctorClean(dir) {
  const { stdout, stderr } = await runOk(dir, ['doctor']);
  for (const id of ['command-wrappers', 'command-permissions']) {
    assert.match(stdout, passLine(id), `${id} did not pass\n${stdout}\n${stderr}`);
    assert.doesNotMatch(stderr, warnLine(id));
  }
  assert.doesNotMatch(stderr, /scriptsDir: is not set/);
}

test('a configless init writes scriptsDir as the init directory and puts every script there', async (t) => {
  const dir = await fixtureFor(t);
  await runOk(dir, ['init']);

  const config = readJson(join(dir, 'harness.config.json'));
  assert.equal(config.scriptsDir, INIT_SCRIPTS_DIR);
  assert.equal(config.commands.test, `bash ${INIT_SCRIPTS_DIR}/${TEST_WRAPPER}`);
  assertScriptsUnder(dir, INIT_SCRIPTS_DIR);
  assert.equal(existsSync(join(dir, DEFAULTS.scriptsDir)), false, `init created ${DEFAULTS.scriptsDir}/`);

  await assertDoctorClean(dir);
});

test('init --scripts-dir writes that directory and puts every script there', async (t) => {
  const dir = await fixtureFor(t);
  const scriptsDir = 'tools/harness';
  await runOk(dir, ['init', '--scripts-dir', scriptsDir]);

  const config = readJson(join(dir, 'harness.config.json'));
  assert.equal(config.scriptsDir, scriptsDir);
  assert.equal(config.commands.test, `bash ${scriptsDir}/${TEST_WRAPPER}`);
  assertScriptsUnder(dir, scriptsDir);
  assert.equal(existsSync(join(dir, INIT_SCRIPTS_DIR)), false, `init created ${INIT_SCRIPTS_DIR}/`);
  assert.equal(existsSync(join(dir, DEFAULTS.scriptsDir)), false, `init created ${DEFAULTS.scriptsDir}/`);

  await assertDoctorClean(dir);
});

test('a seeded scriptsDir "scripts" config is kept byte for byte by init, init --force and doctor', async (t) => {
  const dir = await fixtureFor(t);
  const seeded = await seedConfig(dir, 'scripts');
  const configPath = join(dir, 'harness.config.json');

  await runOk(dir, ['init']);
  assert.deepEqual(readFileSync(configPath), seeded, 'init rewrote the seeded config');
  assertScriptsUnder(dir, 'scripts');
  assert.equal(existsSync(join(dir, INIT_SCRIPTS_DIR)), false, `init created ${INIT_SCRIPTS_DIR}/`);

  await runOk(dir, ['init', '--force']);
  assert.deepEqual(readFileSync(configPath), seeded, 'init --force rewrote the seeded config');
  assertScriptsUnder(dir, 'scripts');
  assert.equal(existsSync(join(dir, INIT_SCRIPTS_DIR)), false, `init --force created ${INIT_SCRIPTS_DIR}/`);

  const before = await snapshotTree(dir);
  await runOk(dir, ['doctor']);
  assert.deepEqual(await snapshotTree(dir), before, 'doctor changed the tree');
});

test('a seeded config with no scriptsDir keeps its scripts under the absent-key directory and is warned', async (t) => {
  const dir = await fixtureFor(t);
  const seeded = await seedConfig(dir, undefined);

  const init = await runOk(dir, ['init']);
  assert.deepEqual(readFileSync(join(dir, 'harness.config.json')), seeded, 'init rewrote the seeded config');
  assertScriptsUnder(dir, DEFAULTS.scriptsDir);
  assert.equal(existsSync(join(dir, INIT_SCRIPTS_DIR)), false, `init created ${INIT_SCRIPTS_DIR}/`);
  assert.match(init.stderr, /scriptsDir: is not set/);

  const { stderr } = await runOk(dir, ['doctor']);
  assert.match(stderr, warnLine('config'));
  assert.match(stderr, /scriptsDir/);
  assert.match(stderr, /config set scriptsDir/);
});
