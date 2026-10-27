/**
 * The sandbox probe's start-up: `scripts/sandbox-probe.sh preflight` and the `shasum` guard
 * (`sp_snapshot_take`, `sp_snapshot_check`), both in `scripts/lib/sandbox-probe/preflight.sh`.
 *
 * **The rule these tests exist to enforce: the probe refuses before creating anything, in the order
 * `preflight.sh`'s header lists, with exit 2 and one `refusing to start: <reason>` line; and its
 * `shasum` guard fires, with exit 3 and one `FAILED: <path> changed` line, on any change to the three
 * main-checkout files it snapshots.**
 *
 * The probe places its main checkout from its own location, and the `SANDBOX_PROBE_*` seams replace
 * `uname`, `doctor` and the agent CLI only, never that root. So every case runs a **copy** of the
 * probe committed into an adopted fixture under `os.tmpdir()`, and each case's `TMPDIR` is its own
 * directory, read afterwards for a leftover `sandbox-probe.*`. `WORKSPACE_ROOT` is only the copy
 * source; no case invokes the probe, or sources its libraries, there.
 *
 * Left out deliberately: the sandboxed sessions, which only a hand-run `sandbox-probe.sh run`
 * reaches, so no case launches `claude`; and the git judges and the leg table, which
 * `cli/test/sandbox-probe-git-and-legs.test.mjs` covers.
 */

import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { chmod, cp, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { INIT_SCRIPTS_DIR, runBash, runGit, WORKSPACE_ROOT } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];
const PROBE_FILE = 'sandbox-probe.sh';
const PROBE_LIB = join('lib', 'sandbox-probe');
const DOCTOR_IDS = ['profile-sandbox', 'profile-write-protection', 'profile-main-anchor', 'sandbox-prerequisites'];
const GUARDED = ['harness.config.json', '.git/config', '.claude/settings.autonomous.json'];

/** A shell single-quoted literal. */
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/** A `SANDBOX_PROBE_DOCTOR` command line printing `lines`, one per line. */
function doctorPrinting(lines) {
  return `printf '%s\\n' ${lines.map(shellQuote).join(' ')}`;
}

const DOCTOR_PASS = doctorPrinting(DOCTOR_IDS.map((id) => `PASS  ${id}  ok`));

/** A fresh `TMPDIR` under `os.tmpdir()`, removed when the case ends. */
async function caseTmp(t) {
  const dir = realpathSync(await mkdtemp(join(tmpdir(), 'sandbox-probe-case-')));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

async function probeLeftovers(tmp) {
  return (await readdir(tmp)).filter((name) => name.startsWith('sandbox-probe.'));
}

/**
 * An adopted fixture holding a committed copy of the probe, checked out on its `defaultBranch`, or
 * `null` when the watcher helper skipped the case.
 *
 * @param {import('node:test').TestContext} t
 */
async function probeFixture(t) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const scripts = join(w.dir, INIT_SCRIPTS_DIR);
  await cp(join(WORKSPACE_ROOT, 'scripts', PROBE_FILE), join(scripts, PROBE_FILE));
  await cp(join(WORKSPACE_ROOT, 'scripts', PROBE_LIB), join(scripts, PROBE_LIB), { recursive: true });

  const config = JSON.parse(readFileSync(join(w.dir, 'harness.config.json'), 'utf8'));
  await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n', { flag: 'a' });
  await runGit(w.dir, ['add', '-A']);
  await runGit(w.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness and the probe']);
  await runGit(w.dir, ['checkout', '--quiet', '-B', config.defaultBranch]);
  const status = await runGit(w.dir, ['status', '--porcelain']);
  assert.equal(status.stdout, '', 'the fixture tree is clean after the adoption commit');

  return { ...w, scripts, defaultBranch: config.defaultBranch, libDir: join(scripts, PROBE_LIB) };
}

/** `preflight` through the probe copy at `probe`, under `tmp`, with `seams` over the doctor pass. */
function preflight(f, probe, tmp, seams = {}) {
  return runBash(
    f.dir,
    [probe, 'preflight'],
    f.watcherEnv({
      TMPDIR: tmp,
      SANDBOX_PROBE_UNAME: 'Darwin',
      SANDBOX_PROBE_DOCTOR: DOCTOR_PASS,
      SANDBOX_PROBE_AGENT_CLI: '',
      SP_VERSION: '',
      ...seams,
      [MAIN_REPO_ANCHOR_VARIABLE]: '',
    }),
  );
}

/**
 * The probe's own stderr lines, those carrying its `sandbox-probe: ` prefix. The rest is whatever
 * sourcing the entry point's libraries prints, which is not this suite's subject.
 */
function probeLines(stderr) {
  return stderr.split('\n').filter((line) => line.startsWith('sandbox-probe: '));
}

function assertRefused(run, reason) {
  assert.deepEqual(probeLines(run.stderr), [`sandbox-probe: refusing to start: ${reason}`], run.stderr);
  assert.equal(run.status, 2, run.stderr);
  assert.equal(run.stdout, '');
}

test('preflight refuses in order, exit 2, leaving nothing behind', async (t) => {
  const f = await probeFixture(t);
  if (f === null) return;
  const probe = join(f.scripts, PROBE_FILE);
  const agentStub = join(f.dir, 'watcher-test', 'agent-version.sh');
  await writeFile(agentStub, "#!/usr/bin/env bash\nprintf 'stub 0.0.0\\n'\n", 'utf8');
  await chmod(agentStub, 0o755);
  const agentPass = { SANDBOX_PROBE_AGENT_CLI: agentStub };

  await t.test('1. a probe in a linked worktree is not the main checkout, refused before the snapshot', async (t) => {
    const parent = await caseTmp(t);
    const worktree = join(parent, 'wt');
    await runGit(f.dir, ['worktree', 'add', '--quiet', '--detach', worktree]);
    const tmp = await caseTmp(t);

    const run = await preflight(f, join(worktree, INIT_SCRIPTS_DIR, PROBE_FILE), tmp, { SANDBOX_PROBE_UNAME: 'Linux' });

    assertRefused(
      run,
      `the probe's checkout '${worktree}' is not the main checkout (its scripts directory places as '${f.dir}', the main checkout is '${f.dir}')`,
    );
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('2. a host that is not macOS', async (t) => {
    const tmp = await caseTmp(t);
    const run = await preflight(f, probe, tmp, { SANDBOX_PROBE_UNAME: 'Linux', ...agentPass });
    assertRefused(run, "this probe measures the macOS sandbox and 'uname -s' is 'Linux'; the Linux legs are owed under roadmap item 21 (docs/development.md §6)");
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('3. the main checkout off its default branch', async (t) => {
    await runGit(f.dir, ['checkout', '--quiet', '-b', 'probe-elsewhere']);
    t.after(() => runGit(f.dir, ['checkout', '--quiet', f.defaultBranch]));
    const tmp = await caseTmp(t);

    const run = await preflight(f, probe, tmp, agentPass);

    assertRefused(
      run,
      `the main checkout '${f.dir}' is on 'probe-elsewhere', not the default branch '${f.defaultBranch}'`,
    );
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('5. doctor printing a non-PASS line for one of its four checks', async (t) => {
    const tmp = await caseTmp(t);
    const warn = '! WARN  profile-write-protection  not strict';
    const lines = DOCTOR_IDS.map((id) => (id === 'profile-write-protection' ? warn : `PASS  ${id}  ok`));

    const run = await preflight(f, probe, tmp, { SANDBOX_PROBE_DOCTOR: doctorPrinting(lines), ...agentPass });

    assertRefused(run, `doctor does not pass profile-write-protection: ${warn}`);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('6. an agent CLI that does not resolve on PATH', async (t) => {
    const tmp = await caseTmp(t);
    const missing = join(f.dir, 'watcher-test', 'no-such-agent');
    const run = await preflight(f, probe, tmp, { SANDBOX_PROBE_AGENT_CLI: missing });
    assertRefused(run, `the agent CLI '${missing}' does not resolve on PATH`);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });

  await t.test('every check passing: exit 0, nothing printed, the temp area released', async (t) => {
    const tmp = await caseTmp(t);
    const run = await preflight(f, probe, tmp, agentPass);
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(probeLines(run.stderr), [], run.stderr);
    assert.equal(run.stdout, '');
    assert.deepEqual(await probeLeftovers(tmp), []);
  });
});

test('the shasum guard: exit 3 naming the changed file, exit 0 when none changed', async (t) => {
  const f = await probeFixture(t);
  if (f === null) return;

  /**
   * `sp_snapshot_take`, then `relative` appended to when non-empty, then `sp_snapshot_check`, in one
   * shell that sourced the fixture's copies of the probe libraries, with the fixture as root.
   */
  const guard = (tmp, relative) =>
    runBash(
      f.dir,
      [
        '-c',
        [
          '. "$1/core.sh"; . "$1/preflight.sh"',
          'SP_MAIN="$2"',
          'sp_snapshot_take || { echo "take: $SP_SNAPSHOT_REFUSAL" >&2; exit 9; }',
          '[ -z "$3" ] || printf "\\n" >> "$SP_MAIN/$3"',
          'sp_snapshot_check; rc=$?',
          'sp_snapshot_release',
          'exit "$rc"',
        ].join('\n'),
        '_',
        f.libDir,
        f.dir,
        relative,
      ],
      { TMPDIR: tmp, [MAIN_REPO_ANCHOR_VARIABLE]: '' },
    );

  for (const relative of GUARDED) {
    await t.test(`a change to ${relative}`, async (t) => {
      const path = join(f.dir, relative);
      const original = readFileSync(path);
      t.after(() => writeFile(path, original));
      const tmp = await caseTmp(t);

      const run = await guard(tmp, relative);

      assert.equal(run.stderr, `sandbox-probe: FAILED: ${path} changed during the probe\n`);
      assert.equal(run.status, 3, run.stderr);
      assert.deepEqual(await probeLeftovers(tmp), []);
    });
  }

  await t.test('no change to any of the three', async (t) => {
    const tmp = await caseTmp(t);
    const run = await guard(tmp, '');
    assert.equal(run.stderr, '');
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(await probeLeftovers(tmp), []);
  });
});
