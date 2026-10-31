/**
 * The sandbox probe's platform library, `scripts/lib/sandbox-probe/platform.sh`: `sp_platform_of`,
 * `sp_prereq_cmd` and `sp_stamp`.
 *
 * **The rule these tests exist to enforce: the platform is named by one mapping; the prerequisite
 * lookups have one spelling; and the stamp prints every key in a fixed order, on stderr only, whatever
 * is missing.**
 *
 * **Left out:** whether a real `bwrap --version` prints the line the stamp quotes. Every command the
 * stamp runs is a stub here, so only a Linux run shows that.
 *
 * `core.sh` and `platform.sh` are sourced in a `bash -c` whose working directory is the case
 * directory, a `mkdtemp` under `os.tmpdir()` removed when the case ends; the stubs and the files the
 * seams name live there. No case reaches the network or launches the agent CLI.
 */

import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = ['core.sh', 'platform.sh'].map((f) => join(PROBE_LIB, f));
const STAMP_PREFIX = 'sandbox-probe: stamp: ';
const AGENT_CLI = 'sbx-stub-agent-cli';
const MISSING_COMMAND = 'sbx-no-such-bwrap';

/** `body` run after sourcing the two libraries, its own arguments in `"$@"`, in `cwd`. */
function sourced(cwd, body, args = [], env = {}) {
  return runBash(cwd, ['-c', `. "$1"; . "$2"; shift 2; ${body}`, '_', ...LIBS, ...args], {
    SP_VERSION: '',
    ...env,
  });
}

async function caseDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-platform-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

/** Writes an executable `name` into `binDir` printing `lines`, one per line. */
async function stub(binDir, name, lines) {
  const path = join(binDir, name);
  const body = lines.map((line) => `printf '%s\\n' '${line}'`).join('\n');
  await writeFile(path, `#!/bin/sh\n${body}\n`);
  await chmod(path, 0o755);
}

/** Stubs every command either stamp branch runs; `uid` is what `id -u` prints. */
async function stubBin(dir, uid) {
  const binDir = join(dir, 'bin');
  await mkdir(binDir);
  await stub(binDir, 'uname', ['Linux sbx-host 6.1.0-stub #1 SMP x86_64 GNU/Linux']);
  await stub(binDir, 'bwrap', ['bubblewrap 0.8.0']);
  await stub(binDir, 'socat', ['socat by Gerhard Rieger and contributors', 'socat version 1.7.4.4 on Jan 1 2024']);
  await stub(binDir, 'git', ['git version 2.99.0-stub']);
  await stub(binDir, 'id', [uid]);
  await stub(binDir, 'sw_vers', ['14.5']);
  await stub(binDir, AGENT_CLI, ['9.9.9 (Claude Code)']);
  return binDir;
}

/** The environment a stamp case runs under: the stubs first on PATH, the seams pointed into `dir`. */
function stampEnv(binDir, env) {
  return { PATH: `${binDir}${delimiter}${process.env.PATH}`, SANDBOX_PROBE_AGENT_CLI: AGENT_CLI, ...env };
}

function stampLines(stderr) {
  return stderr.split('\n').filter((line) => line.startsWith(STAMP_PREFIX));
}

function stamp(pairs) {
  return pairs.map(([key, value]) => `${STAMP_PREFIX}${key}: ${value}`);
}

test('sp_platform_of: one mapping from uname -s', async (t) => {
  for (const [input, expected] of [
    ['Darwin', 'macos'],
    ['Linux', 'linux'],
  ]) {
    await t.test(`${input} prints ${expected}`, async (t) => {
      const run = await sourced(await caseDir(t), 'sp_platform_of "$1"', [input]);
      assert.equal(run.status, 0, run.stderr);
      assert.equal(run.stdout, `${expected}\n`);
    });
  }
  for (const input of ['FreeBSD', 'darwin', '']) {
    await t.test(`${JSON.stringify(input)} prints nothing and returns 1`, async (t) => {
      const run = await sourced(await caseDir(t), 'sp_platform_of "$1"', [input]);
      assert.equal(run.status, 1);
      assert.equal(run.stdout, '');
    });
  }
});

test('sp_prereq_cmd: one spelling of the bwrap and socat lookups', async (t) => {
  await t.test('the defaults are bwrap and socat', async (t) => {
    const run = await sourced(await caseDir(t), 'sp_prereq_cmd bwrap; sp_prereq_cmd socat', [], {
      SANDBOX_PROBE_BWRAP: '',
      SANDBOX_PROBE_SOCAT: '',
    });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, 'bwrap\nsocat\n');
  });

  await t.test('SANDBOX_PROBE_BWRAP replaces the bwrap name', async (t) => {
    const run = await sourced(await caseDir(t), 'sp_prereq_cmd bwrap', [], { SANDBOX_PROBE_BWRAP: MISSING_COMMAND });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, `${MISSING_COMMAND}\n`);
  });

  await t.test('an unknown argument prints nothing and returns 1', async (t) => {
    const run = await sourced(await caseDir(t), 'sp_prereq_cmd curl');
    assert.equal(run.status, 1);
    assert.equal(run.stdout, '');
  });
});

test('sp_stamp with SP_PLATFORM=linux: eight keys, in order, on stderr only', async (t) => {
  for (const [uid, caller] of [
    ['1000', 'non-root (uid 1000)'],
    ['0', 'root'],
  ]) {
    await t.test(`id -u ${uid} stamps the caller as ${caller}`, async (t) => {
      const dir = await caseDir(t);
      const binDir = await stubBin(dir, uid);
      const osRelease = join(dir, 'os-release');
      const apparmor = join(dir, 'apparmor');
      await writeFile(osRelease, 'NAME="Debian GNU/Linux"\nPRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nID=debian\n');
      await writeFile(apparmor, '1\n');
      const run = await sourced(
        dir,
        'SP_PLATFORM=linux; sp_stamp',
        [],
        stampEnv(binDir, {
          SANDBOX_PROBE_BWRAP: '',
          SANDBOX_PROBE_SOCAT: '',
          SANDBOX_PROBE_OS_RELEASE: osRelease,
          SANDBOX_PROBE_APPARMOR_FILE: apparmor,
        }),
      );
      assert.equal(run.status, 0, run.stderr);
      assert.equal(run.stdout, '');
      assert.deepEqual(
        stampLines(run.stderr),
        stamp([
          ['uname -a', 'Linux sbx-host 6.1.0-stub #1 SMP x86_64 GNU/Linux'],
          ['distribution', 'Debian GNU/Linux 12 (bookworm)'],
          ['bwrap --version', 'bubblewrap 0.8.0'],
          ['socat -V', 'socat version 1.7.4.4 on Jan 1 2024'],
          ['git --version', 'git version 2.99.0-stub'],
          ['agent cli --version', '9.9.9 (Claude Code)'],
          ['kernel.apparmor_restrict_unprivileged_userns', '1'],
          ['caller', caller],
        ]),
      );
    });
  }

  await t.test('a bwrap that resolves nowhere and a missing AppArmor file still stamp, and return 0', async (t) => {
    const dir = await caseDir(t);
    const binDir = await stubBin(dir, '1000');
    const osRelease = join(dir, 'os-release');
    await writeFile(osRelease, 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\n');
    const run = await sourced(
      dir,
      'SP_PLATFORM=linux; sp_stamp',
      [],
      stampEnv(binDir, {
        SANDBOX_PROBE_BWRAP: MISSING_COMMAND,
        SANDBOX_PROBE_SOCAT: '',
        SANDBOX_PROBE_OS_RELEASE: osRelease,
        SANDBOX_PROBE_APPARMOR_FILE: join(dir, 'no-such-apparmor-file'),
      }),
    );
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, '');
    const lines = stampLines(run.stderr);
    assert.equal(lines.length, 8, run.stderr);
    assert.ok(lines.includes(`${STAMP_PREFIX}bwrap --version: not found`), run.stderr);
    assert.ok(lines.includes(`${STAMP_PREFIX}kernel.apparmor_restrict_unprivileged_userns: absent`), run.stderr);
  });
});

test('sp_stamp with SP_PLATFORM empty: the five macOS keys, in order', async (t) => {
  const dir = await caseDir(t);
  const binDir = await stubBin(dir, '501');
  const run = await sourced(dir, 'SP_PLATFORM=; sp_stamp', [], stampEnv(binDir, {}));
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, '');
  assert.deepEqual(
    stampLines(run.stderr),
    stamp([
      ['uname -a', 'Linux sbx-host 6.1.0-stub #1 SMP x86_64 GNU/Linux'],
      ['macOS', '14.5'],
      ['git --version', 'git version 2.99.0-stub'],
      ['agent cli --version', '9.9.9 (Claude Code)'],
      ['caller', 'non-root (uid 501)'],
    ]),
  );
});
