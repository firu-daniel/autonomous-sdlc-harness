/**
 * The sandbox probe's job mode at its two ends: `preflight --job` (`scripts/lib/sandbox-probe/preflight.sh`,
 * its JOB MODE checks) and a job-mode `run`'s setup and teardown (`scripts/lib/sandbox-probe/job.sh` →
 * `sp_job_setup`, `sp_job_teardown`, called from `session.sh` → `sp_setup`, `sp_teardown`).
 *
 * **The rule these tests exist to enforce: job mode refuses, before creating anything, a checkout it must
 * not measure, and leaves the checkout it measured as it found it on every exit path: its branch, its
 * `HEAD`, its `.git/config`, its tracked files and its origin.**
 *
 * Job mode places the checkout it measures from `--job`'s argument, not from its own location, so the
 * probe runs **in place** from `WORKSPACE_ROOT/scripts/sandbox-probe.sh`, aimed at an adopted fixture
 * under `os.tmpdir()`. The one exception is the probe's-own-checkout refusal, which runs a committed
 * copy of the probe inside a second fixture, so no case's outcome depends on what kind of checkout this
 * repository is. Each case's `TMPDIR` is its own directory, read afterwards for a leftover
 * `sandbox-probe.*`.
 *
 * Left out deliberately: no session is real — every agent CLI is a stub through
 * `SANDBOX_PROBE_AGENT_CLI` and every doctor a stub through `SANDBOX_PROBE_DOCTOR`, so no case launches
 * `claude`; and no case reaches a placeholder host's manifest, which belongs with the job-mode launch
 * line's own cases, not with setup and teardown.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { chmod, cp, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { INIT_SCRIPTS_DIR, runBash, runGit, WORKSPACE_ROOT } from './helpers/fixture.mjs';
import { scaleBound } from './helpers/timing.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];
const PROBE_FILE = 'sandbox-probe.sh';
const PROBE_LIB = join('lib', 'sandbox-probe');
const IN_PLACE_PROBE = join(WORKSPACE_ROOT, 'scripts', PROBE_FILE);
const DOCTOR_IDS = ['profile-sandbox', 'profile-write-protection', 'profile-main-anchor', 'sandbox-prerequisites'];
const PROBE_BRANCH_GLOB = 'chore_sbx_probe_*';
const RUN_TIMEOUT_MS = scaleBound(180_000);
const MARKER_WAIT_MS = scaleBound(120_000);

/** A shell single-quoted literal. */
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/** A `SANDBOX_PROBE_DOCTOR` command line printing `lines`, one per line, then exiting `status`. */
function doctorPrinting(lines, status = 0) {
  return `printf '%s\\n' ${lines.map(shellQuote).join(' ')}; exit ${status}`;
}

const DOCTOR_PASS = doctorPrinting(DOCTOR_IDS.map((id) => `PASS  ${id}  ok`));
const DOCTOR_FAIL_LINE = '!! FAIL  profile-paths  the profile names a path outside the checkout';
const DOCTOR_FAIL = doctorPrinting([...DOCTOR_IDS.map((id) => `PASS  ${id}  ok`), DOCTOR_FAIL_LINE], 1);

/** A fresh directory under `os.tmpdir()`, removed when the case ends. */
async function caseTmp(t) {
  const dir = realpathSync(await mkdtemp(join(tmpdir(), 'sandbox-probe-job-case-')));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

async function probeLeftovers(tmp) {
  return (await readdir(tmp)).filter((name) => name.startsWith('sandbox-probe.'));
}

/** An executable at `path` whose body is `lines`. */
async function writeScript(path, lines) {
  await writeFile(path, `${['#!/usr/bin/env bash', ...lines].join('\n')}\n`, 'utf8');
  await chmod(path, 0o755);
}

/**
 * An adopted fixture committed on its `defaultBranch`, that branch pushed to the fixture's bare origin,
 * with an agent-CLI stub that answers `--version` only; `null` when the watcher helper skipped the case.
 * `withProbe` also commits a copy of the probe under its scripts directory.
 *
 * @param {import('node:test').TestContext} t
 */
async function jobFixture(t, { withProbe = false } = {}) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const scripts = join(w.dir, INIT_SCRIPTS_DIR);
  if (withProbe) {
    await cp(join(WORKSPACE_ROOT, 'scripts', PROBE_FILE), join(scripts, PROBE_FILE));
    await cp(join(WORKSPACE_ROOT, 'scripts', PROBE_LIB), join(scripts, PROBE_LIB), { recursive: true });
  }
  const config = JSON.parse(readFileSync(join(w.dir, 'harness.config.json'), 'utf8'));
  assert.ok(existsSync(join(w.dir, '.claude', 'settings.autonomous.json')), 'init generated the base profile');
  await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n/home/\n', { flag: 'a' });
  await runGit(w.dir, ['add', '-A']);
  await runGit(w.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(w.dir, ['checkout', '--quiet', '-B', config.defaultBranch]);
  // The origin's seed commit is unrelated to the adoption commit, so the first push replaces it; the
  // installed pre-push guard refuses a push to the default branch, as it does an adopter's.
  await runGit(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `${config.defaultBranch}:${config.defaultBranch}`]);
  const status = await runGit(w.dir, ['status', '--porcelain']);
  assert.equal(status.stdout, '', 'the fixture tree is clean after the adoption commit');

  const origin = (await runGit(w.dir, ['remote', 'get-url', 'origin'])).stdout.trim();
  const agentStub = join(w.dir, 'watcher-test', 'agent-version.sh');
  await writeScript(agentStub, ["printf 'stub 0.0.0\\n'"]);

  return { ...w, scripts, origin, agentStub, defaultBranch: config.defaultBranch };
}

/**
 * `<probe> <args>` under `tmp`, from the fixture, with `seams` over the passing doctor and the agent stub;
 * `signal` aborts it.
 */
function probe(f, probePath, args, tmp, seams = {}, signal = undefined) {
  return runBash(
    f.dir,
    [probePath, ...args],
    f.watcherEnv({
      TMPDIR: tmp,
      SANDBOX_PROBE_DOCTOR: DOCTOR_PASS,
      SANDBOX_PROBE_AGENT_CLI: f.agentStub,
      SP_VERSION: '',
      ...seams,
      [MAIN_REPO_ANCHOR_VARIABLE]: '',
    }),
    { timeoutMs: RUN_TIMEOUT_MS, signal },
  );
}

/** The probe's own stderr lines, those carrying its `sandbox-probe: ` prefix. */
function probeLines(stderr) {
  return stderr.split('\n').filter((line) => line.startsWith('sandbox-probe: '));
}

function assertRefused(run, reason) {
  const refusals = probeLines(run.stderr).filter((line) => line.includes('refusing to start:'));
  assert.deepEqual(refusals, [`sandbox-probe: refusing to start: ${reason}`], run.stderr);
  assert.equal(run.status, 2, run.stderr);
}

/** The probe branches in `repo`'s local heads. */
async function probeBranches(repo) {
  const out = (await runGit(repo, ['for-each-ref', '--format=%(refname:short)', `refs/heads/${PROBE_BRANCH_GLOB}`])).stdout;
  return out.split('\n').filter((line) => line !== '');
}

/** The checkout's state the job-mode contract holds: branch, `HEAD`, `.git/config` bytes. */
async function checkoutState(f) {
  return {
    branch: (await runGit(f.dir, ['symbolic-ref', '--short', 'HEAD'])).stdout.trim(),
    head: (await runGit(f.dir, ['rev-parse', 'HEAD'])).stdout.trim(),
    config: readFileSync(join(f.dir, '.git', 'config')),
  };
}

/** The checkout is as `before` found it, its tracked files clean and no probe branch on either side. */
async function assertRestored(f, before) {
  const after = await checkoutState(f);
  assert.equal(after.branch, f.defaultBranch, 'HEAD is back on defaultBranch');
  assert.equal(after.head, before.head, 'HEAD names the commit it named before');
  assert.ok(after.config.equals(before.config), '.git/config is byte-identical to the one read before the run');
  assert.deepEqual(await probeBranches(f.dir), [], 'no probe branch is left locally');
  assert.deepEqual(await probeBranches(f.origin), [], 'no probe branch is left on origin');
  const tracked = await runGit(f.dir, ['status', '--porcelain', '--untracked-files=no']);
  assert.equal(tracked.stdout, '', 'no tracked change is left');
}

test('preflight --job refuses, creating nothing', async (t) => {
  const f = await jobFixture(t);
  if (f === null) return;
  const preflight = (tmp, extraArgs = [], seams = {}, target = f.dir) =>
    probe(f, IN_PLACE_PROBE, ['preflight', '--job', target, ...extraArgs], tmp, seams);

  await t.test("1. the probe's own checkout", async (t) => {
    const copy = await jobFixture(t, { withProbe: true });
    if (copy === null) return;
    const tmp = await caseTmp(t);

    const run = await probe(copy, join(copy.scripts, PROBE_FILE), ['preflight', '--job', copy.dir], tmp);

    assertRefused(run, `'${copy.dir}' is the probe's own checkout: job mode measures another checkout; the probe's own is not one`);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('1. a linked worktree', async (t) => {
    const parent = await caseTmp(t);
    const worktree = join(parent, 'wt');
    await runGit(f.dir, ['worktree', 'add', '--quiet', '--detach', worktree]);
    t.after(() => runGit(f.dir, ['worktree', 'remove', '--force', worktree]));
    const tmp = await caseTmp(t);

    const run = await preflight(tmp, [], {}, worktree);

    assertRefused(run, `'${worktree}' is not a main checkout: it is a linked worktree of '${f.dir}'`);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('1. a git clone --shared', async (t) => {
    const parent = await caseTmp(t);
    const shared = join(parent, 'shared');
    await runGit(parent, ['clone', '--quiet', '--shared', f.dir, shared]);
    const tmp = await caseTmp(t);

    const run = await preflight(tmp, [], {}, shared);

    assertRefused(run, `'${shared}' is not a main checkout: it borrows objects through .git/objects/info/alternates, so it is a run copy`);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('3. the checkout off its default branch', async (t) => {
    await runGit(f.dir, ['checkout', '--quiet', '-b', 'probe-elsewhere']);
    t.after(async () => {
      await runGit(f.dir, ['checkout', '--quiet', f.defaultBranch]);
      await runGit(f.dir, ['branch', '--quiet', '-D', 'probe-elsewhere']);
    });
    const tmp = await caseTmp(t);

    const run = await preflight(tmp);

    assertRefused(run, `the main checkout '${f.dir}' is on 'probe-elsewhere', not the default branch '${f.defaultBranch}'`);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('3. a tracked file modified', async (t) => {
    const readme = join(f.dir, 'README.md');
    const original = readFileSync(readme);
    await writeFile(readme, `${original.toString('utf8')}a tracked change\n`);
    t.after(() => writeFile(readme, original));
    const tmp = await caseTmp(t);

    const run = await preflight(tmp);

    assertRefused(
      run,
      `'${f.dir}' carries a tracked change, first 'README.md', which the probe's teardown would discard; commit or stash it first`,
    );
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('6. doctor --remote-job printing a FAIL line and exiting 1', async (t) => {
    const tmp = await caseTmp(t);
    const run = await preflight(tmp, [], { SANDBOX_PROBE_DOCTOR: DOCTOR_FAIL });
    assertRefused(run, `doctor --remote-job fails: ${DOCTOR_FAIL_LINE}`);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('6. doctor --remote-job printing PASS for three of the four ids', async (t) => {
    const tmp = await caseTmp(t);
    const three = doctorPrinting(DOCTOR_IDS.slice(0, 3).map((id) => `PASS  ${id}  ok`));
    const run = await preflight(tmp, [], { SANDBOX_PROBE_DOCTOR: three });
    assertRefused(run, `doctor printed no line for ${DOCTOR_IDS[3]}`);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('8. --runner-controls naming a missing path', async (t) => {
    const tmp = await caseTmp(t);
    const missing = join(tmp, 'no-such-controls.txt');
    const run = await preflight(tmp, ['--runner-controls', missing]);
    assertRefused(run, `the runner controls file '${missing}' is not a readable regular file, or is a symbolic link`);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('every check passing: exit 0, nothing refused, the temp area released', async (t) => {
    const tmp = await caseTmp(t);
    const run = await preflight(tmp);
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(probeLines(run.stderr), [], run.stderr);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });
});

test('a job-mode run leaves the checkout as it found it', async (t) => {
  const f = await jobFixture(t);
  if (f === null) return;

  await t.test('a leg with no job rows: setup and teardown in full, no session', async (t) => {
    const before = await checkoutState(f);
    const tmp = await caseTmp(t);

    const run = await probe(f, IN_PLACE_PROBE, ['run', '--job', f.dir, '--leg', 'git'], tmp);

    assert.equal(run.status, 0, run.stderr);
    for (const row of ['CS3', 'CL5']) {
      const lines = run.stdout
        .split('\n')
        .filter((line) => line.startsWith(`leg="git" row="${row}" result="not run" evidence="not a job-mode leg`));
      assert.equal(lines.length, 1, `one not-run line for git ${row}\n${run.stdout}`);
    }
    assert.ok(run.stderr.includes(`sandbox-probe: stamp: mode: job (${f.dir})`), run.stderr);
    assert.ok(run.stderr.includes('sandbox-probe: job-sweep: exit 0'), run.stderr);
    await assertRestored(f, before);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('a failing doctor: nothing at all created', async (t) => {
    const before = await checkoutState(f);
    const tmp = await caseTmp(t);

    const run = await probe(f, IN_PLACE_PROBE, ['run', '--job', f.dir, '--leg', 'git'], tmp, {
      SANDBOX_PROBE_DOCTOR: DOCTOR_FAIL,
    });

    assertRefused(run, `doctor --remote-job fails: ${DOCTOR_FAIL_LINE}`);
    assert.equal(run.stdout, '');
    assert.ok(!run.stderr.includes('job-sweep'), run.stderr);
    await assertRestored(f, before);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });
});

test('an interrupted job-mode run still tears down', async (t) => {
  const f = await jobFixture(t);
  if (f === null) return;
  const caseDir = await caseTmp(t);
  const marker = join(caseDir, 'started');
  const sessionStub = join(f.dir, 'watcher-test', 'agent-session.sh');
  // `$PPID` is the probe itself: sp_session's subshell `exec`s this stub.
  await writeScript(sessionStub, [
    `if [ "\${1:-}" = --version ]; then printf 'stub 0.0.0\\n'; exit 0; fi`,
    `printf '%s\\n' "$PPID" > ${shellQuote(`${marker}.tmp`)}`,
    `mv ${shellQuote(`${marker}.tmp`)} ${shellQuote(marker)}`,
    'sleep 2',
    'exit 0',
  ]);
  const before = await checkoutState(f);
  const tmp = await caseTmp(t);

  const running = probe(
    f,
    IN_PLACE_PROBE,
    ['run', '--job', f.dir, '--leg', 'job-layout'],
    tmp,
    { SANDBOX_PROBE_AGENT_CLI: sessionStub },
    t.signal,
  );
  let settled = false;
  running.then(
    () => { settled = true; },
    () => { settled = true; },
  );
  const deadline = Date.now() + MARKER_WAIT_MS;
  while (!existsSync(marker) && !settled && Date.now() < deadline) await delay(50);
  if (!existsSync(marker)) {
    const early = settled ? await running : null;
    assert.fail(`no session started within ${MARKER_WAIT_MS} ms${early ? `\n${early.stdout}\n${early.stderr}` : ''}`);
  }
  const pid = Number(readFileSync(marker, 'utf8').trim());
  assert.ok(Number.isInteger(pid) && pid > 0, `the marker names a process id: ${pid}`);
  process.kill(pid, 'SIGTERM');

  const run = await running;

  assert.equal(run.status, 143, run.stderr);
  assert.ok(run.stderr.includes('sandbox-probe: job-sweep: exit 0'), run.stderr);
  await assertRestored(f, before);
  assert.ok(!existsSync(join(f.dir, 'sbx_cs6.txt')), 'sbx_cs6.txt is removed from the checkout');
  assert.deepEqual(await probeLeftovers(tmp), []);
});
