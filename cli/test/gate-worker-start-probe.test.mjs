/**
 * The gate-worker start probe (`scripts/gate-worker-start-probe.sh`): its `judge` grading, one live
 * run against a temp work base, its teardown and its refusals.
 *
 * **The rule these tests exist to enforce: the probe grades each leg from its records alone, refuses
 * a work base it cannot use, and leaves its work base, `$HOME` and `$TMPDIR` as it found them.** The
 * `judge` cases plant one records directory per verdict a leg can print and compare the printed
 * summary line verbatim. The live run asserts structure only — seven summary lines in leg order, each
 * verdict drawn from its leg's vocabulary, and the `launch-line` lane listed before the launch —
 * because this suite also runs inside the sandboxed gate run, where the `nohup` legs read `fail`.
 *
 * Left out deliberately: whether any verdict is right under a real sandbox. Only an in-session run of
 * the probe measures that, and its record is the task's, not this suite's.
 *
 * Every fixture lives under `os.tmpdir()`; `--work` is never pointed at this checkout.
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE = join(WORKSPACE_ROOT, 'scripts', 'gate-worker-start-probe.sh');
const LEGS = ['env', 'sandbox', 'nohup', 'detach', 'launch-line', 'run-form', 'tmpdir'];
const VOCABULARY = {
  env: ['info'],
  sandbox: ['sandboxed', 'unsandboxed', 'not run'],
  nohup: ['pass', 'fail', 'not run'],
  detach: ['pass', 'fail', 'not run'],
  'launch-line': ['pass', 'fail', 'not run'],
  'run-form': ['pass', 'fail', 'not run'],
  tmpdir: ['pass', 'fail'],
};
const NOHUP_STDERR = "nohup: can't detach from console: Inappropriate ioctl for device";
const LANE = 'devscene/test_run_logs/gwsp-probe';
const STUB_VERSION = '9.9.9 (Claude Code stub)';

/** Plants `records` (name → content, written with a trailing newline as the probe writes them). */
async function plant(records) {
  const dir = await mkdtemp(join(tmpdir(), 'gwsp-judge-'));
  for (const [name, content] of Object.entries(records)) {
    await writeFile(join(dir, name), content === '' ? '' : `${content}\n`);
  }
  return dir;
}

async function assertJudged(leg, records, expected) {
  const dir = await plant(records);
  try {
    const run = await runBash(WORKSPACE_ROOT, [PROBE, 'judge', leg, dir]);
    assert.equal(run.stdout, `gwsp: ${leg}: ${expected}\n`, run.stderr);
    assert.equal(run.status, 0, run.stderr);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('judge sandbox: unsandboxed, sandboxed and not run', async () => {
  const target = '/h/.gwsp-sandbox-check.1';
  await assertJudged(
    'sandbox',
    { 'sandbox.write.target': target, 'sandbox.write.status': '0', 'sandbox.write.stderr': '', 'sandbox.ondisk': 'present' },
    `unsandboxed — the write to ${target} reached the disk (status 0)`,
  );
  await assertJudged(
    'sandbox',
    {
      'sandbox.write.target': target,
      'sandbox.write.status': '1',
      'sandbox.write.stderr': `bash: ${target}: Operation not permitted`,
      'sandbox.ondisk': 'absent',
    },
    `sandboxed — the write to ${target} did not reach the disk (status 1): bash: ${target}: Operation not permitted`,
  );
  await assertJudged(
    'sandbox',
    { 'sandbox.write.stderr': 'HOME is unset' },
    'not run — no record sandbox.ondisk: HOME is unset',
  );
});

test('judge nohup: fail, pass and not run', async () => {
  await assertJudged(
    'nohup',
    {
      'nohup.nohup.status': '127',
      'nohup.nohup.stderr': NOHUP_STDERR,
      'nohup.control.status': '0',
      'nohup.control.stderr': '',
    },
    `fail — nohup true exited 127, stderr: ${NOHUP_STDERR}; trap '' HUP control exited 0, stderr: (empty)`,
  );
  await assertJudged(
    'nohup',
    { 'nohup.nohup.status': '0', 'nohup.nohup.stderr': '', 'nohup.control.status': '0', 'nohup.control.stderr': '' },
    "pass — nohup true exited 0, stderr: (empty); trap '' HUP control exited 0, stderr: (empty)",
  );
  await assertJudged(
    'nohup',
    { 'nohup.nohup.status': '0', 'nohup.nohup.stderr': '', 'nohup.control.status': '1', 'nohup.control.stderr': 'boom' },
    "not run — nohup true exited 0, stderr: (empty); trap '' HUP control exited 1, stderr: boom",
  );
});

test('judge detach: fail when only the trap arm wrote, pass when both did, not run otherwise', async () => {
  await assertJudged(
    'detach',
    { 'detach.nohup.stderr': NOHUP_STDERR, 'detach.trap.stderr': '', 'detach.trap.marker': 'started' },
    `fail — nohup arm not started, stderr: ${NOHUP_STDERR}; trap arm started, stderr: (empty)`,
  );
  await assertJudged(
    'detach',
    {
      'detach.nohup.stderr': '',
      'detach.trap.stderr': '',
      'detach.nohup.marker': 'started',
      'detach.trap.marker': 'started',
    },
    'pass — nohup arm started, stderr: (empty); trap arm started, stderr: (empty)',
  );
  await assertJudged(
    'detach',
    { 'detach.nohup.stderr': '', 'detach.trap.stderr': '' },
    'not run — nohup arm not started, stderr: (empty); trap arm not started, stderr: (empty)',
  );
});

test('judge launch-line: pass, fail, and not run on a failed setup', async () => {
  const setupOk = {
    'launch-line.setup.status': '0',
    'launch-line.setup.command': '',
    'launch-line.setup.stdout': LANE,
  };
  await assertJudged(
    'launch-line',
    {
      ...setupOk,
      'launch-line.lane.names': 'gwsp_launch.commit\ngwsp_launch.verdict',
      'launch-line.ondisk.running': 'absent',
      'launch-line.ondisk.verdict': 'present',
      'launch-line.launch.stderr': '',
    },
    `pass — lane ${LANE} listed: gwsp_launch.commit\\ngwsp_launch.verdict; gwsp_launch.running absent, gwsp_launch.verdict present; launch stderr: (empty)`,
  );
  await assertJudged(
    'launch-line',
    {
      ...setupOk,
      'launch-line.lane.names': 'gwsp_launch.running',
      'launch-line.ondisk.running': 'present',
      'launch-line.ondisk.verdict': 'absent',
      'launch-line.launch.stderr': NOHUP_STDERR,
    },
    `fail — lane ${LANE} listed: gwsp_launch.running; gwsp_launch.running present, gwsp_launch.verdict absent; launch stderr: ${NOHUP_STDERR}`,
  );
  await assertJudged(
    'launch-line',
    {
      'launch-line.setup.status': '1',
      'launch-line.setup.command': 'mkdir -p /w/repo/devscene/test_run_logs/gwsp-probe',
      'launch-line.setup.stderr': 'mkdir: /w/repo/devscene: Operation not permitted',
    },
    "not run — setup command 'mkdir -p /w/repo/devscene/test_run_logs/gwsp-probe' exited 1: mkdir: /w/repo/devscene: Operation not permitted",
  );
  await assertJudged('launch-line', {}, 'not run — no record launch-line.setup.status');
});

test('judge run-form: fail on the did-not-start exit, pass after pending, not run otherwise', async () => {
  const notStarted = 'run-test-suite.sh: the detached run of gwsp_run did not start';
  await assertJudged(
    'run-form',
    {
      'run-form.run.status': '2',
      'run-form.run.stdout': '',
      'run-form.run.stderr': notStarted,
      'run-form.lane.names': 'gwsp_run.start',
      'run-form.ondisk.start': 'present',
      'run-form.start': NOHUP_STDERR,
    },
    `fail — run form exited 2, stdout: (empty), stderr: ${notStarted}; lane listed: gwsp_run.start; gwsp_run.start present: ${NOHUP_STDERR}`,
  );
  await assertJudged(
    'run-form',
    {
      'run-form.run.status': '3',
      'run-form.run.stdout': 'pending',
      'run-form.run.stderr': '',
      'run-form.wait1.status': '3',
      'run-form.wait1.stdout': 'pending',
      'run-form.wait1.stderr': '',
      'run-form.wait2.status': '0',
      'run-form.wait2.stdout': 'pass',
      'run-form.wait2.stderr': '',
    },
    'pass — run form exited 3, stdout: pending, stderr: (empty); wait 1 exited 3, stdout: pending, stderr: (empty); wait 2 exited 0, stdout: pass, stderr: (empty)',
  );
  await assertJudged(
    'run-form',
    { 'run-form.run.status': '1', 'run-form.run.stdout': '', 'run-form.run.stderr': 'boom' },
    'not run — run form exited 1, stdout: (empty), stderr: boom; lane listed: (no record run-form.lane.names)',
  );
  await assertJudged('run-form', {}, 'not run — no record run-form.run.status');
});

test('judge tmpdir: pass when both creations reached the disk, fail when either did not', async () => {
  const common = {
    'tmpdir.value.stdout': '/t',
    'tmpdir.canonical.stdout': '/private/t',
    'tmpdir.file.status': '0',
    'tmpdir.file.stdout': '/t/gwsp.AAAAAA',
    'tmpdir.file.stderr': '',
    'tmpdir.file.ondisk': 'present',
  };
  const head = 'TMPDIR /t (pwd -P: /private/t); mktemp template exited 0, created /t/gwsp.AAAAAA present, stderr: (empty)';
  await assertJudged(
    'tmpdir',
    {
      ...common,
      'tmpdir.dir.status': '0',
      'tmpdir.dir.stdout': '/t/tmp.BBBBBB',
      'tmpdir.dir.stderr': '',
      'tmpdir.dir.ondisk': 'present',
    },
    `pass — ${head}; bare mktemp -d exited 0, created /t/tmp.BBBBBB present, stderr: (empty)`,
  );
  const refused = 'mktemp: mkdtemp failed on /v/T/tmp.CCCCCC: Operation not permitted';
  await assertJudged(
    'tmpdir',
    { ...common, 'tmpdir.dir.status': '1', 'tmpdir.dir.stdout': '', 'tmpdir.dir.stderr': refused, 'tmpdir.dir.ondisk': 'absent' },
    `fail — ${head}; bare mktemp -d exited 1, created (empty) absent, stderr: ${refused}`,
  );
});

async function listing(dir) {
  return (await readdir(dir)).sort();
}

test('a live run against a temp work base prints seven graded legs and leaves base, HOME and TMPDIR as found', async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'gwsp-live-')));
  try {
    const base = join(root, 'base');
    const home = join(root, 'home');
    const tmp = join(root, 'tmp');
    const bin = join(root, 'bin');
    for (const dir of [base, home, tmp, bin]) {
      await mkdir(dir);
      await writeFile(join(dir, 'kept'), 'kept\n');
    }
    await writeFile(join(bin, 'claude'), `#!/bin/sh\necho '${STUB_VERSION}'\n`);
    await chmod(join(bin, 'claude'), 0o755);
    const before = { base: await listing(base), home: await listing(home), tmp: await listing(tmp) };

    const run = await runBash(
      WORKSPACE_ROOT,
      [PROBE, '--work', base],
      { HOME: home, TMPDIR: tmp, PATH: `${bin}${delimiter}${process.env.PATH}` },
      { timeoutMs: 180000 },
    );
    assert.equal(run.status, 0, run.stderr);

    const summaries = run.stdout.split('\n').filter((l) => /^gwsp: [a-z-]+: /.test(l));
    assert.deepEqual(
      summaries.map((l) => l.split(': ')[1]),
      LEGS,
      run.stdout,
    );
    for (const [i, leg] of LEGS.entries()) {
      const verdict = summaries[i].slice(`gwsp: ${leg}: `.length).split(' — ')[0];
      assert.ok(VOCABULARY[leg].includes(verdict), `${leg} printed '${verdict}': ${summaries[i]}`);
    }
    assert.ok(summaries[0].startsWith(`gwsp: env: info — claude ${STUB_VERSION}; `), summaries[0]);

    const block = run.stdout.split('== gwsp: launch-line ==\n')[1].split('== gwsp: run-form ==\n')[0];
    assert.ok(block.includes(`-- launch-line.setup.stdout:\n${LANE}\n`), block);
    const preListing = block.split('-- launch-line.lane.pre-listing:\n')[1]?.split('\n-- ')[0];
    assert.ok(preListing !== undefined && /^total \d+$/m.test(preListing), block);
    assert.doesNotMatch(preListing, /No such file or directory/);

    assert.deepEqual(await listing(base), before.base);
    assert.deepEqual(await listing(home), before.home);
    assert.deepEqual(await listing(tmp), before.tmp);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('an absent work base is refused with exit 2 and nothing created; a bad argument exits 1', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gwsp-refuse-'));
  try {
    const absent = join(root, 'absent');
    const refused = await runBash(WORKSPACE_ROOT, [PROBE, '--work', absent]);
    assert.equal(refused.status, 2, refused.stderr);
    assert.equal(refused.stdout, '');
    assert.equal(existsSync(absent), false);
    assert.deepEqual(await readdir(root), []);

    const bad = await runBash(WORKSPACE_ROOT, [PROBE, '--bogus']);
    assert.equal(bad.status, 1, bad.stderr);
    assert.equal(bad.stdout, '');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
