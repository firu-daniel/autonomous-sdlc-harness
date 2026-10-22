/**
 * `doctor`'s `sandbox-prerequisites` line, against the compiled CLI on repositories `init` wired.
 *
 * **The rule this suite enforces: a host missing a piece the sandbox needs is reported, naming the
 * piece, its package and the command that installs it and never offering the opt-out — a `warn` in a
 * default run, a `fail` under `--remote-job` — while macOS passes naming Seatbelt and a taken
 * `sandbox.optOut` passes naming its reason in both modes.** Its expectations depend on the host by
 * design: the check probes the real platform, so (a) and (b) each skip, naming why, on a host they
 * are not about, and (c) runs on every host because a taken opt-out probes nothing. No case reaches
 * the network.
 */

import assert from 'node:assert/strict';
import { accessSync, constants, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { release, tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { it } from 'node:test';

import { concurrentSuite } from './helpers/concurrency.mjs';
import { createFixture, runCli } from './helpers/fixture.mjs';

const CONFIG_FILE = 'harness.config.json';
const CHECK_ID = 'sandbox-prerequisites';
const OPT_OUT_REASON = 'r';
const IS_DARWIN = process.platform === 'darwin';
const IS_WSL1 = process.platform === 'linux' && /microsoft/i.test(release()) && !/microsoft-standard|wsl2/i.test(release());
const IS_LINUX = process.platform === 'linux' && !IS_WSL1;
const NOT_LINUX = `platform ${process.platform}${IS_WSL1 ? ' (WSL1)' : ''} is not a Linux/WSL2 host`;

/** Whether `path` is a file this account may execute. */
function isExecutable(path) {
  try {
    if (!statSync(path).isFile()) return false;
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

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

/** Write `sandbox.optOut` into the fixture's config. */
function takeOptOut(dir) {
  const path = join(dir, CONFIG_FILE);
  const config = JSON.parse(readFileSync(path, 'utf8'));
  config.sandbox = { ...config.sandbox, optOut: { reason: OPT_OUT_REASON } };
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/** A `PATH` value naming one temp directory that holds only a symlink to this process's `git`. */
function gitOnlyPath(t) {
  const git = (process.env['PATH'] ?? '')
    .split(delimiter)
    .filter((entry) => entry !== '')
    .map((directory) => join(directory, 'git'))
    .find(isExecutable);
  assert.ok(git !== undefined, 'no git on this process PATH');
  const directory = mkdtempSync(join(tmpdir(), 'sandbox-prereq-path-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  symlinkSync(git, join(directory, 'git'));
  return directory;
}

/** Run `doctor` with `args` and return this check's line in `status`, asserting there is one. */
async function doctorLine(dir, status, args = [], env = {}) {
  const result = await runCli(dir, ['doctor', ...args], env);
  const [stream, prefix] = { PASS: [result.stdout, ''], WARN: [result.stderr, '! '], FAIL: [result.stderr, '!! '] }[status];
  const line = stream.split('\n').find((entry) => new RegExp(`^${prefix}${status}\\s+${CHECK_ID}\\s`).test(entry));
  assert.ok(line !== undefined, `no ${status} ${CHECK_ID} line\n${result.stdout}\n${result.stderr}`);
  return { line, status: result.status };
}

concurrentSuite('doctor sandbox-prerequisites', () => {
  it('(a) passes on darwin naming Seatbelt, with and without --remote-job', { skip: IS_DARWIN ? false : `platform ${process.platform} is not darwin` }, async (t) => {
    const dir = await wiredFixture(t);
    for (const args of [[], ['--remote-job']]) {
      const { line } = await doctorLine(dir, 'PASS', args);
      assert.ok(line.includes('Seatbelt'), line);
    }
  });

  it('(b) warns on linux with neither binary on PATH, and fails under --remote-job', { skip: IS_LINUX ? false : NOT_LINUX }, async (t) => {
    const dir = await wiredFixture(t);
    const env = { PATH: gitOnlyPath(t) };
    for (const [status, args] of [['WARN', []], ['FAIL', ['--remote-job']]]) {
      const { line } = await doctorLine(dir, status, args, env);
      for (const named of ['`bwrap`', '`bubblewrap`', '`socat`', 'sudo apt-get install bubblewrap socat']) {
        assert.ok(line.includes(named), `${named} not named:\n${line}`);
      }
      assert.ok(!line.includes('optOut'), `the remedy offers the opt-out:\n${line}`);
    }
  });

  it('(c) passes under a taken opt-out naming its reason, in both modes and with the git-only PATH', async (t) => {
    const dir = await wiredFixture(t);
    takeOptOut(dir);
    const env = { PATH: gitOnlyPath(t) };
    for (const [args, runEnv] of [[[], {}], [['--remote-job'], {}], [['--remote-job'], env]]) {
      const { line } = await doctorLine(dir, 'PASS', args, runEnv);
      assert.ok(line.includes(`not required: sandbox.optOut is taken — ${OPT_OUT_REASON}`), line);
    }
  });
});
