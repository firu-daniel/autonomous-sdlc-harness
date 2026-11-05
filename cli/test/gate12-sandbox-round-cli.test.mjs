/**
 * `scripts/gate12-sandbox-round.sh`'s entry point, its row table and its preflight refusals.
 *
 * **The rule this suite enforces: the round driver refuses to run anywhere but an adopted, explicitly
 * named Gate 12 repository, and creates nothing when it refuses; `--list` is the single row table.**
 * Each refusal is asserted on the bytes on disk, not on the message. The last three cases hold the
 * shared fixture (`helpers/gate12-round.mjs`) to the ignore rule, stub exit and run synthesis the
 * other round-driver suites rely on.
 *
 * It reads one fixed script, not a tree, so it owes no `treeGuards` entry.
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { runBash, runGit, snapshotTree, WORKSPACE_ROOT } from './helpers/fixture.mjs';
import {
  cleanup,
  GATE12_SLUG,
  ghStub,
  ghStubRuns,
  makeGate12Fixture,
  runRound,
} from './helpers/gate12-round.mjs';

const ROWS = [
  'FR1', 'FR2', 'FR3', 'FR4', 'FR5', 'FR6', 'FR7',
  'JS1', 'JS4', 'SB2', 'SB4', 'RJ2', 'JS3', 'JS3N', 'SB3', 'RJ3',
];

/** A fixture torn down when the case ends. */
async function fixtureFor(t, options) {
  const fixture = await makeGate12Fixture(options);
  t.after(() => cleanup(fixture));
  return fixture;
}

/** Run `args` and assert the exit code, an unchanged tree and no state file. */
async function assertRefused(fixture, args, status, options) {
  const before = await snapshotTree(fixture.dir);
  const result = await runRound(fixture, args, options);
  assert.equal(result.status, status, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.equal(existsSync(fixture.stateFile), false);
  assert.equal(existsSync(join(fixture.dir, fixture.stateDir)), false);
  assert.deepEqual(await snapshotTree(fixture.dir), before);
  return result;
}

test('--help exits 0 and --list prints one line per row, in table order', async (t) => {
  const fixture = await fixtureFor(t);

  const help = await runRound(fixture, ['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /^Usage: gate12-sandbox-round\.sh/);

  const list = await runRound(fixture, ['--list']);
  assert.equal(list.status, 0, list.stderr);
  const lines = list.stdout.split('\n').filter((l) => l !== '');
  assert.deepEqual(lines.map((l) => l.split('\t')[0]), ROWS);
  for (const line of lines) assert.equal(line.split('\t').length, 5, line);
});

test('a usage error exits 1 and creates nothing', async (t) => {
  const fixture = await fixtureFor(t);
  await t.test('plant with no --repo', () => assertRefused(fixture, ['plant'], 1));
  await t.test('grade with a row not in the table', () =>
    assertRefused(fixture, ['grade', '--repo', GATE12_SLUG, '--row', 'XX'], 1));
});

test('each preflight refusal exits 2 and creates nothing', async (t) => {
  await t.test('--repo names another repository than origin', async (t) => {
    const fixture = await fixtureFor(t);
    const result = await assertRefused(fixture, ['plant', '--repo', 'other/repo'], 2);
    assert.match(result.stderr, /origin is 'fixture\/gate12', not --repo 'other\/repo'/);
  });

  await t.test('no harness.config.json', async (t) => {
    const fixture = await fixtureFor(t);
    await unlink(join(fixture.dir, 'harness.config.json'));
    const result = await assertRefused(fixture, ['plant', '--repo', GATE12_SLUG], 2);
    assert.match(result.stderr, /carries no harness\.config\.json/);
  });

  await t.test('the default branch workflow lacks the install step', async (t) => {
    const fixture = await fixtureFor(t, { withInstallStep: false });
    const result = await assertRefused(fixture, ['plant', '--repo', GATE12_SLUG], 2);
    assert.match(result.stderr, /has no step Install the sandbox prerequisites/);
  });

  await t.test("a copy run from inside the script's own repository", async (t) => {
    const fixture = await fixtureFor(t);
    const script = join(fixture.dir, 'scripts', 'gate12-sandbox-round.sh');
    await mkdir(join(fixture.dir, 'scripts', 'lib'), { recursive: true });
    await cp(join(WORKSPACE_ROOT, 'scripts', 'gate12-sandbox-round.sh'), script);
    await cp(
      join(WORKSPACE_ROOT, 'scripts', 'lib', 'gate12-sandbox-round'),
      join(fixture.dir, 'scripts', 'lib', 'gate12-sandbox-round'),
      { recursive: true },
    );
    await cp(join(WORKSPACE_ROOT, 'scripts', 'lib', 'harness-run-lib.sh'), join(fixture.dir, 'scripts', 'lib', 'harness-run-lib.sh'));
    const result = await assertRefused(fixture, ['plant', '--repo', GATE12_SLUG], 2, { script });
    assert.match(result.stderr, /is the checkout this script sits in/);
  });

  await t.test('a checkout carrying the driver, run by another copy', async (t) => {
    const fixture = await fixtureFor(t);
    const lib = join(fixture.dir, 'scripts', 'lib', 'gate12-sandbox-round');
    await mkdir(lib, { recursive: true });
    await writeFile(join(lib, 'core.sh'), '');
    const result = await assertRefused(fixture, ['plant', '--repo', GATE12_SLUG], 2);
    assert.match(result.stderr, /it is a checkout of the repository that ships this driver/);
  });
});

test('a failing gh repo view exits 3 and creates nothing', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, { 'repo view': { stderr: 'stub: repo view refused\n', exit: 1 } });
  const result = await assertRefused(fixture, ['plant', '--repo', GATE12_SLUG], 3);
  assert.match(result.stderr, /gh repo view fixture\/gate12 failed/);
});

test("the fixture's ignore rule hides the driver's scratch directory", async (t) => {
  const fixture = await fixtureFor(t);
  const scratch = join(fixture.dir, fixture.stateDir, 'scratch', 'gate12-sandbox-round');
  await mkdir(scratch, { recursive: true });
  await writeFile(join(scratch, 'state.json'), '{}\n', 'utf8');
  const { stdout } = await runGit(fixture.dir, ['status', '--porcelain']);
  assert.equal(stdout, '');
});

test("the fixture's remote-run.sh stub exits remoteRunExit and still logs its argv", async (t) => {
  const fixture = await fixtureFor(t, { remoteRunExit: 3 });
  const result = await runBash(fixture.dir, [
    join(fixture.dir, fixture.scriptsDir, 'remote-run.sh'), 'dispatch', 'gate12_js1', '--engine', 'task',
  ]);
  assert.equal(result.status, 3, result.stderr);
  assert.equal(await readFile(fixture.remoteRunLog, 'utf8'), 'dispatch gate12_js1 --engine task\n');
});

test("the gh stub synthesises one stable run per branch named at run time", async (t) => {
  const fixture = await fixtureFor(t);
  const gh = await ghStub(fixture.binDir, { 'run list': { synthesiseRun: true } });
  const list = async (branch) => {
    const result = await runBash(fixture.dir, [
      gh, 'run', 'list', '--repo', GATE12_SLUG, '--workflow', 'harness-run.yml', '--branch', branch,
      '--json', 'databaseId,createdAt,displayTitle', '--limit', '20',
    ]);
    assert.equal(result.status, 0, result.stderr);
    const runs = JSON.parse(result.stdout);
    assert.equal(runs.length, 1);
    assert.equal(runs[0].displayTitle, `harness run ${branch}`);
    assert.match(runs[0].createdAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    return runs[0].databaseId;
  };

  assert.deepEqual([await list('a'), await list('a'), await list('b')], [1001, 1001, 1002]);
  assert.deepEqual(ghStubRuns(fixture.binDir), { a: 1001, b: 1002 });

  const unbranched = await runBash(fixture.dir, [gh, 'run', 'list', '--repo', GATE12_SLUG]);
  assert.equal(unbranched.status, 0, unbranched.stderr);
  assert.deepEqual(JSON.parse(unbranched.stdout), []);
});
