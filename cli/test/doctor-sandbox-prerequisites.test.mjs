/**
 * `doctor`'s `sandbox-prerequisites` line, against the compiled CLI on repositories `init` wired.
 *
 * **The rule this suite enforces: a host missing a piece the sandbox needs is reported, naming the
 * piece, its package and the command that installs it and never offering the opt-out — a `warn` in a
 * default run, a `fail` under `--remote-job`, and told the watcher refuses its launches only where it
 * would: never in a job, never where `execution.target` is `github-actions` — a host where bwrap's
 * child cannot create a nested user namespace fails in both modes, while macOS passes naming Seatbelt
 * and a taken `sandbox.optOut` passes naming its reason in both modes.** The four verdicts the task
 * names are each graded through `assessSandboxHost` by `cli/test/sandbox-prerequisites.test.mjs`, and
 * the check's grade and message for each, in both modes, by (g) here, on every host. (d)–(f) prove
 * the spawn and its wiring on a Linux host, against stub executables the test writes, so no real
 * `bwrap` is spawned. The check probes the real platform, so (a), (b), (d), (e) and (f) each skip,
 * naming why, on a host they are not about; (c) runs on every host because a taken opt-out probes
 * nothing. No case reaches the network.
 */

import assert from 'node:assert/strict';
import { accessSync, chmodSync, constants, existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { release, tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { it } from 'node:test';

import { concurrentSuite } from './helpers/concurrency.mjs';
import { createFixture, runCli } from './helpers/fixture.mjs';
import { gradeSandboxPrerequisites, NESTED_USERNS_PROBE_ENV } from '../dist/doctor/checks.js';
import {
  assessSandboxHost,
  BWRAP_USERNS_RESTRICT_PROFILE_PATH,
  describeMissingPieces,
  describeNestedUserns,
  NESTED_USERNS_HELPER,
} from '../dist/doctor/sandboxPrerequisites.js';

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

/** Write `execution.target` `github-actions` into the fixture's config. */
function targetGithubActions(dir) {
  const path = join(dir, CONFIG_FILE);
  const config = JSON.parse(readFileSync(path, 'utf8'));
  config.execution = { ...config.execution, target: 'github-actions' };
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

/**
 * {@link gitOnlyPath} plus stub `bwrap`, {@link NESTED_USERNS_HELPER} and `socat` executables; the
 * stub `bwrap` exits `bwrapExit`, so the nested check's outcome is the test's choice.
 */
function stubbedPath(t, bwrapExit) {
  const directory = gitOnlyPath(t);
  for (const [name, exit] of [['bwrap', bwrapExit], [NESTED_USERNS_HELPER, 0], ['socat', 0]]) {
    const path = join(directory, name);
    writeFileSync(path, `#!/bin/sh\nexit ${exit}\n`, 'utf8');
    chmodSync(path, 0o755);
  }
  return directory;
}

/** The environment (d)–(f) run under: the stubbed `PATH`, and the nested check enabled unless `probe` is `off`. */
function nestedEnv(t, bwrapExit, probe = '') {
  return { PATH: stubbedPath(t, bwrapExit), [NESTED_USERNS_PROBE_ENV]: probe };
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
      if (status === 'FAIL') {
        assert.ok(!line.includes('the watcher refuses'), `a job is told the watcher refuses it:\n${line}`);
        assert.ok(line.includes("This job's agent session"), `the job consequence is not named:\n${line}`);
      }
    }
    const remoteDir = await wiredFixture(t);
    targetGithubActions(remoteDir);
    const { line } = await doctorLine(remoteDir, 'WARN', [], env);
    assert.ok(line.includes('refuses none here'), `a github-actions repository is told its launches are refused:\n${line}`);
  });

  it('(c) passes under a taken opt-out naming its reason, in both modes, with the git-only PATH and with a failing nested check', async (t) => {
    const dir = await wiredFixture(t);
    takeOptOut(dir);
    const env = { PATH: gitOnlyPath(t) };
    const failing = nestedEnv(t, 1);
    for (const [args, runEnv] of [[[], {}], [['--remote-job'], {}], [['--remote-job'], env], [[], failing], [['--remote-job'], failing]]) {
      const { line } = await doctorLine(dir, 'PASS', args, runEnv);
      assert.ok(line.includes(`not required: sandbox.optOut is taken — ${OPT_OUT_REASON}`), line);
    }
  });

  it('(d) passes naming the nested check when the stub bwrap exits 0, with and without --remote-job', { skip: IS_LINUX ? false : NOT_LINUX }, async (t) => {
    const dir = await wiredFixture(t);
    const env = nestedEnv(t, 0);
    for (const remoteJob of [false, true]) {
      const { line } = await doctorLine(dir, 'PASS', remoteJob ? ['--remote-job'] : [], env);
      assert.ok(line.includes(describeNestedUserns('passed', '', remoteJob)), `the nested check is not named:\n${line}`);
    }
  });

  it('(e) fails in both modes when the stub bwrap exits 1', { skip: IS_LINUX ? false : NOT_LINUX }, async (t) => {
    const dir = await wiredFixture(t);
    const env = nestedEnv(t, 1);
    const stock = existsSync(BWRAP_USERNS_RESTRICT_PROFILE_PATH);
    const answer = stock ? 'failed-stock-restrict' : 'failed';
    for (const remoteJob of [false, true]) {
      const { line } = await doctorLine(dir, 'FAIL', remoteJob ? ['--remote-job'] : [], env);
      assert.ok(line.includes(describeNestedUserns(answer, 'exited 1', remoteJob)), `the ${answer} sentence is not carried:\n${line}`);
      assert.equal(line.includes(`The cause is \`${BWRAP_USERNS_RESTRICT_PROFILE_PATH}\``), stock, `the stock profile is named as the cause iff present:\n${line}`);
      if (stock) {
        const owner = remoteJob ? 'Install the sandbox prerequisites' : 'trade-off';
        assert.ok(line.includes(owner), `${owner} not named:\n${line}`);
      }
      assert.ok(!line.includes('optOut'), `the remedy offers the opt-out:\n${line}`);
    }
  });

  it('(f) falls back to the file-based grade when the failing nested check is turned off', { skip: IS_LINUX ? false : NOT_LINUX }, async (t) => {
    const dir = await wiredFixture(t);
    const env = nestedEnv(t, 1, 'off');
    for (const args of [[], ['--remote-job']]) {
      const result = await runCli(dir, ['doctor', ...args], env);
      const lines = `${result.stdout}\n${result.stderr}`.split('\n');
      assert.ok(!lines.some((entry) => new RegExp(`^!! FAIL\\s+${CHECK_ID}\\s`).test(entry)), `the check failed:\n${result.stderr}`);
      const line = lines.find((entry) => new RegExp(`^(! )?(PASS|WARN)\\s+${CHECK_ID}\\s`).test(entry));
      assert.ok(line !== undefined, `no PASS or WARN ${CHECK_ID} line\n${result.stdout}\n${result.stderr}`);
      assert.ok(!line.includes("bwrap's child"), `the nested check ran:\n${line}`);
    }
  });

  it('(g) grades every verdict in both modes, on every host', () => {
    const release = '6.8.0-45-generic';
    const uncertain = { appArmorRestrict: { state: 'read', text: '1\n' }, bwrapProfile: { state: 'absent' } };
    const clear = { appArmorRestrict: { state: 'absent' }, bwrapProfile: { state: 'absent' } };
    const failed = { state: 'failed', detail: 'exited 1' };
    const facts = (binaries, rest) => ({ platform: 'linux', kernelRelease: release, resolvedBinaries: new Set(binaries), ...rest });
    const missingSentence = (pieces) => describeMissingPieces(pieces, release, 'linux').join(' ');
    const rows = [
      {
        name: 'probe passes, AppArmor files uncertain',
        facts: facts(['bwrap', 'socat'], { ...uncertain, nestedUserns: { state: 'passed' } }),
        grade: () => 'pass',
        carries: (remoteJob) => [describeNestedUserns('passed', '', remoteJob)],
      },
      {
        name: 'probe fails, stock file present',
        facts: facts(['bwrap', 'socat'], { ...clear, nestedUserns: failed, stockRestrictProfile: true }),
        grade: () => 'fail',
        carries: (remoteJob) => [describeNestedUserns('failed-stock-restrict', failed.detail, remoteJob), 'AppArmor files, for context:'],
      },
      {
        name: 'probe fails, no stock file',
        facts: facts(['bwrap', 'socat'], { ...clear, nestedUserns: failed, stockRestrictProfile: false }),
        grade: () => 'fail',
        carries: (remoteJob) => [describeNestedUserns('failed', failed.detail, remoteJob), 'AppArmor files, for context:'],
      },
      {
        name: 'no bwrap',
        facts: facts(['socat'], clear),
        grade: (remoteJob) => (remoteJob ? 'fail' : 'warn'),
        carries: () => [missingSentence(['bwrap'])],
      },
      {
        name: 'missing piece and failed probe',
        facts: facts(['bwrap'], { ...clear, nestedUserns: failed }),
        grade: () => 'fail',
        carries: (remoteJob) => [missingSentence(['socat']), `; ${describeNestedUserns('failed', failed.detail, remoteJob)}`],
      },
    ];
    for (const row of rows) {
      for (const remoteJob of [false, true]) {
        const { grade, message } = gradeSandboxPrerequisites({
          assessment: assessSandboxHost(row.facts),
          facts: row.facts,
          remoteJob,
          remoteExecution: false,
          resolvedPaths: [...row.facts.resolvedBinaries].map((binary) => `\`${binary}\` in /usr/bin`),
        });
        const where = `${row.name}, remoteJob ${remoteJob}`;
        assert.equal(grade, row.grade(remoteJob), `${where}: ${message}`);
        for (const expected of row.carries(remoteJob)) {
          assert.ok(message.includes(expected), `${where}: does not carry ${expected}\n${message}`);
        }
        assert.ok(!message.includes('optOut'), `${where}: offers the opt-out\n${message}`);
      }
    }
  });
});
