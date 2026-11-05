/**
 * `scripts/gate12-sandbox-round.sh default-branch`: JS3's leg, round step 8.
 *
 * **The rule this suite enforces: the leg changes the GitHub default branch and the repository
 * variables `STALL_WARN_SECS` and `STALL_KILL_SECS`, and restores every one of them on every exit
 * path — a failed dispatch, a job that never starts and an interrupt included; it keeps
 * `<other branch>` recorded for `teardown`; and it refuses, before changing anything, while another
 * planted run is in flight, an earlier leg's other branch is still recorded or `--stall-kill-secs` is
 * over 480. JS3's planted prompt asks for exactly one silent scratch-run stall of
 * S = STALL_KILL_SECS + 60 seconds under a Bash timeout of (S + 60) * 1000 ms, before its README step.**
 *
 * It reads one fixed script, not a tree, so it owes no `treeGuards` entry.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
import { scaleBound } from './helpers/timing.mjs';

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

/** Run a whole leg at `--stall-kill-secs <kill>` (the default when absent) and return JS3's committed prompt. */
async function plantedPrompt(t, kill) {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, routes('in_progress'), START);
  const args = kill === undefined ? ARGS : [...ARGS, '--stall-kill-secs', String(kill)];
  const result = await runRound(fixture, args, { env: ENV });
  assert.equal(result.status, 0, show(result));
  const branch = await assertJs3Branch(fixture, readJson(fixture.stateFile));
  const path = `${fixture.stateDir}/task_prompts/${branch.name}_task_prompt.md`;
  return { fixture, prompt: await git(fixture.origin, ['show', `${branch.commit}:${path}`]) };
}

/** The ```js block of the prompt's first step. */
function stallBody(prompt) {
  const match = /^```js\n([\s\S]*?)\n```$/m.exec(prompt);
  assert.ok(match, prompt);
  return `${match[1]}\n`;
}

test('JS3: the planted prompt asks for one silent scratch-run stall past STALL_KILL_SECS', async (t) => {
  for (const [kill, s, ms] of [[undefined, 180, 240000], [200, 260, 320000]]) {
    await t.test(`--stall-kill-secs ${kill ?? 'default (120)'}`, async (t) => {
      const { fixture, prompt } = await plantedPrompt(t, kill);
      const scratch = `${fixture.stateDir}/scratch`;
      const file = `${scratch}/gate12_js3_stall.mjs`;
      const command = `bash ${fixture.scriptsDir}/scratch-run.sh ${file}`;

      assert.ok(prompt.includes(`1. Write the file \`${file}\``), prompt);
      assert.ok(prompt.includes(`2. Run \`${command}\` once, in the foreground`), prompt);
      assert.equal(prompt.split(command).length - 1, 1, 'the scratch-run command appears once');
      assert.ok(prompt.includes(`timeout set to ${ms} milliseconds`), prompt);
      assert.ok(prompt.includes(`returns after ${s} seconds`), prompt);

      const body = stallBody(prompt);
      assert.ok(body.includes(`const marker = '${scratch}/gate12_js3_stalled';`), body);
      assert.ok(body.includes(`setTimeout(() => {}, ${s} * 1000);`), body);
      assert.doesNotMatch(body, /console\.|process\.std(out|err)/);

      const steps = prompt.split('\n').filter((l) => /^\d+\. /.test(l));
      assert.equal(steps.length, 3, prompt);
      assert.equal(steps.at(-1), '3. Add a line to README.md naming the date this repository was last checked.');
    });
  }
});

test('JS3: the stall body waits S seconds once and prints nothing', async (t) => {
  const { fixture, prompt } = await plantedPrompt(t);
  // S overridden to 1 so the case waits one second rather than 180; the second run's body is
  // overridden to 600 s and bounded by scaleBound, so a broken marker guard is killed at the ceiling.
  const body = stallBody(prompt).replace('setTimeout(() => {}, 180 * 1000);', 'setTimeout(() => {}, 1 * 1000);');
  assert.ok(body.includes('setTimeout(() => {}, 1 * 1000);'), body);

  const cwd = await mkdtemp(join(tmpdir(), 'gate12-js3-stall-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const scratch = join(cwd, fixture.stateDir, 'scratch');
  await mkdir(scratch, { recursive: true });
  const file = join(scratch, 'gate12_js3_stall.mjs');
  await writeFile(file, body, 'utf8');
  const marker = join(scratch, 'gate12_js3_stalled');

  const timed = () => {
    const start = Date.now();
    const stdout = execFileSync(process.execPath, [file], { cwd, encoding: 'utf8' });
    return { stdout, ms: Date.now() - start };
  };

  const first = timed();
  assert.equal(first.stdout, '');
  assert.ok(first.ms >= 1000, `first run returned after ${first.ms} ms`);
  assert.ok(existsSync(marker), 'the marker is created');

  // The marker now exists, so a body that would stall 600 s must return at once; the ceiling is
  // an "until it exits" bound under helpers/timing.mjs's rule.
  await writeFile(file, body.replace('setTimeout(() => {}, 1 * 1000);', 'setTimeout(() => {}, 600 * 1000);'), 'utf8');
  const second = execFileSync(process.execPath, [file], { cwd, encoding: 'utf8', timeout: scaleBound(30_000) });
  assert.equal(second, '');
});

test('JS3: a stall-kill threshold over 480 s is refused before anything changes', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, routes('in_progress'), START);
  const heads = await originHeads(fixture);

  const result = await runRound(fixture, [...ARGS, '--stall-kill-secs', '481'], { env: ENV });
  assert.equal(result.status, 2, show(result));
  assert.match(result.stderr, /--stall-kill-secs 481 /);
  assert.match(result.stderr, /600000 ms/);

  assert.equal(await originHeads(fixture), heads);
  const calls = await ghStubCalls(fixture.binDir);
  assert.deepEqual(calls.filter((a) => isRepoEdit(a) || (a[0] === 'variable' && a[1] !== 'list')), []);
  assert.deepEqual(ghStubState(fixture.binDir), { ...START, runs: {} });
});
