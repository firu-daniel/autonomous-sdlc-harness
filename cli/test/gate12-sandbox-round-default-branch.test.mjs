/**
 * `scripts/gate12-sandbox-round.sh default-branch`: JS3's leg, round step 8.
 *
 * **The rule this suite enforces: the leg changes the GitHub default branch and the repository
 * variables `STALL_WARN_SECS` and `STALL_KILL_SECS`, and restores every one of them on every exit
 * path — a failed dispatch, a job that never starts and an interrupt included; it keeps
 * `<other branch>` recorded for `teardown`; and it refuses, before changing anything, while another
 * planted run is in flight or an earlier leg's other branch is still recorded.**
 *
 * It reads one fixed script, not a tree, so it owes no `treeGuards` entry.
 */

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import test from 'node:test';

import { readJson, runGit } from './helpers/fixture.mjs';
import {
  cleanup,
  GATE12_SLUG,
  ghStub,
  ghStubCalls,
  ghStubRuns,
  ghStubState,
  makeGate12Fixture,
  runRound,
  spawnRound,
} from './helpers/gate12-round.mjs';

const OTHER = 'gate12_other_fixture';

/** The stub's state at the start of every case: `STALL_KILL_SECS` absent, so its restore is a delete. */
const START = { defaultBranch: 'main', variables: { STALL_WARN_SECS: '900' } };

// `run view … --jq .status` reaches a route's fixed stdout unfiltered, so a route prints the bare status.
const routes = (status) => ({
  'run list': { synthesiseRun: true },
  'run view': { stdout: `${status}\n` },
});

const ENV = { G12_DB_POLL_SECS: '1', G12_RUN_LOOKUP_TRIES: '1', G12_RUN_LOOKUP_DELAY_SECS: '0' };

const ARGS = ['default-branch', '--repo', GATE12_SLUG, '--other-branch', OTHER];

async function fixtureFor(t, options) {
  const fixture = await makeGate12Fixture(options);
  t.after(() => cleanup(fixture));
  return fixture;
}

const git = async (dir, args) => (await runGit(dir, args)).stdout.trim();

const originHeads = (fixture) => git(fixture.origin, ['for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads']);

const show = (result) => `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`;

const isRepoEdit = (argv) => argv[0] === 'repo' && argv[1] === 'edit';

/** The stub's default branch is `main` again, and each variable is back where it started. */
function assertRestored(fixture) {
  const stub = ghStubState(fixture.binDir);
  assert.equal(stub.defaultBranch, 'main');
  assert.deepEqual(stub.variables, { STALL_WARN_SECS: '900' });
  const state = readJson(fixture.stateFile);
  assert.deepEqual(state.variables, {
    STALL_WARN_SECS: { present: true, value: '900', restored: true },
    STALL_KILL_SECS: { present: false, value: null, restored: true },
  });
  return state;
}

/** The one JS3 branches[] entry, whose commit is its branch's tip on the bare origin. */
async function assertJs3Branch(fixture, state) {
  const js3 = state.branches.filter((b) => b.row === 'JS3');
  assert.equal(js3.length, 1, JSON.stringify(state.branches));
  assert.equal(js3[0].arm, 'stall');
  assert.match(js3[0].name, /^gate12_js3_stall_\d{14}$/);
  assert.equal(await git(fixture.origin, ['rev-parse', `refs/heads/${js3[0].name}`]), js3[0].commit);
  return js3[0];
}

test('a leg whose job starts restores the default and both variables and keeps the other branch recorded', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, routes('in_progress'), START);
  const seed = await git(fixture.dir, ['rev-parse', 'refs/remotes/origin/main']);

  const result = await runRound(fixture, ARGS, { env: ENV });
  assert.equal(result.status, 0, show(result));

  const state = assertRestored(fixture);
  assert.equal(state.default_branch, 'main');
  assert.equal(state.other_branch, OTHER);
  const branch = await assertJs3Branch(fixture, state);

  const runs = state.runs.filter((r) => r.row === 'JS3');
  assert.equal(runs.length, 1, JSON.stringify(state.runs));
  assert.equal(runs[0].arm, 'stall');
  assert.equal(runs[0].branch, branch.name);
  const id = ghStubRuns(fixture.binDir)[branch.name];
  assert.equal(typeof id, 'number');
  assert.equal(runs[0].run_id, id);
  assert.notEqual(runs[0].stall_values_unconfirmed, true);

  const calls = await ghStubCalls(fixture.binDir);
  const at = (pred) => calls.findIndex(pred);
  const toOther = at((a) => isRepoEdit(a) && a.includes(OTHER));
  const lookup = at((a) => a[0] === 'run' && a[1] === 'list');
  const view = at((a) => a[0] === 'run' && a[1] === 'view' && a[2] === String(id));
  const toMain = at((a) => isRepoEdit(a) && a.at(-1) === 'main');
  assert.ok(toOther !== -1 && lookup !== -1 && view !== -1 && toMain !== -1, JSON.stringify(calls));
  // The run lookup follows remote-run.sh's dispatch, so it stands for the dispatch in the gh log.
  assert.ok(toOther < lookup, 'repo edit to the other branch precedes the dispatch');
  assert.ok(view < toMain, 'repo edit back to main follows the in_progress answer');
  assert.match(result.stdout, new RegExp(`^run ${id} is in_progress$`, 'm'));

  assert.equal(await git(fixture.origin, ['rev-parse', `refs/heads/${OTHER}`]), seed);
});

test('a failed dispatch restores everything and keeps the JS3 branch recorded; a second leg then refuses, naming teardown', async (t) => {
  const fixture = await fixtureFor(t, { remoteRunExit: 3 });
  await ghStub(fixture.binDir, routes('in_progress'), START);

  const result = await runRound(fixture, ARGS, { env: ENV });
  assert.equal(result.status, 3, show(result));
  const state = assertRestored(fixture);
  assert.equal(state.other_branch, OTHER);
  await assertJs3Branch(fixture, state);
  assert.deepEqual(state.runs, []);

  await t.test('the recorded other_branch refuses the next leg', async () => {
    const heads = await originHeads(fixture);
    const before = (await ghStubCalls(fixture.binDir)).length;
    const again = await runRound(fixture, [...ARGS.slice(0, 3), '--other-branch', `${OTHER}_2`], { env: ENV });
    assert.equal(again.status, 2, show(again));
    assert.match(again.stderr, /teardown/);
    assert.equal(await originHeads(fixture), heads);
    assert.deepEqual((await ghStubCalls(fixture.binDir)).slice(before).filter(isRepoEdit), []);
  });
});

test('a job that never leaves queued restores everything and marks the run stall_values_unconfirmed', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, routes('queued'), START);

  const result = await runRound(fixture, [...ARGS, '--wait-secs', '1'], { env: ENV });
  assert.equal(result.status, 0, show(result));
  const state = assertRestored(fixture);
  const runs = state.runs.filter((r) => r.row === 'JS3');
  assert.equal(runs.length, 1, JSON.stringify(state.runs));
  assert.equal(runs[0].stall_values_unconfirmed, true);
});

test('a SIGINT while the leg polls restores everything before the child exits non-zero', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, routes('queued'), START);

  const child = spawnRound(fixture, ARGS, { env: ENV });
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  });
  let stdout = '';
  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const closed = new Promise((resolve) => child.on('close', (code, signal) => resolve({ code, signal })));
  await new Promise((resolve, reject) => {
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (/^planted JS3 stall /m.test(stdout)) resolve();
    });
    closed.then(() => reject(new Error(`exited before polling\nstdout:\n${stdout}\nstderr:\n${stderr}`)));
  });
  child.kill('SIGINT');
  const { code, signal } = await closed;
  const detail = `code ${code} signal ${signal}\nstdout:\n${stdout}\nstderr:\n${stderr}`;
  assert.equal(signal, null, detail);
  assert.notEqual(code, 0, detail);
  assertRestored(fixture);
});

test('a restore whose gh repo edit fails exits 5 and names the command that finishes it', async (t) => {
  const fixture = await fixtureFor(t);
  const restore = `repo edit ${GATE12_SLUG} --default-branch main`;
  await ghStub(fixture.binDir, { ...routes('in_progress'), [restore]: { exit: 1, stderr: 'gh stub: refused\n' } }, START);

  const result = await runRound(fixture, ARGS, { env: ENV });
  assert.equal(result.status, 5, show(result));
  assert.ok(result.stderr.includes(`gh ${restore}`), result.stderr);
});

test('a recorded run the stub reports in_progress refuses the leg before anything changes', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, routes('in_progress'), START);
  await mkdir(dirname(fixture.stateFile), { recursive: true });
  const planted = {
    schema: 1,
    repo: GATE12_SLUG,
    default_branch: null,
    branches: [],
    runs: [{ row: 'JS1', arm: 'settings', branch: 'gate12_js1_settings_20260101000000', run_id: 4242, dispatched_at: '2026-01-01T00:00:00Z' }],
    tokens: {},
    other_branch: null,
    variables: {},
  };
  await writeFile(fixture.stateFile, `${JSON.stringify(planted, null, 2)}\n`, 'utf8');
  const heads = await originHeads(fixture);

  const result = await runRound(fixture, ARGS, { env: ENV });
  assert.equal(result.status, 2, show(result));
  assert.match(result.stderr, /run 4242 .* is in_progress/);
  assert.equal(await originHeads(fixture), heads);
  assert.deepEqual((await ghStubCalls(fixture.binDir)).filter(isRepoEdit), []);
  assert.deepEqual(ghStubState(fixture.binDir).variables, START.variables);
});
