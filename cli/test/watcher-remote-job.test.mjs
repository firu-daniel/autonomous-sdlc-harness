/**
 * The written watcher's `job` subcommand — one run, supervised inside a remote job's own checkout —
 * driven end to end against a fixture `init` wired, with the agent CLI and the notifier recorded.
 *
 * **The rule these tests exist to enforce: job mode launches nothing it was not told to, reports
 * every run it launched through `remote_status.json`, and carries across a job boundary only what
 * the bundle contract says it carries.** Every case points `XDG_STATE_HOME` at an empty directory
 * inside the fixture and passes `USAGE_LANE_STATE_ENABLED=1`, so a lane write that job mode failed
 * to force off would land there and be seen.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

import { runBash } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const PROMPT_DELIMITER = '----- end of prompt -----';

function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * A watcher fixture plus this suite's own stub, which — unlike the shared one — saves its whole
 * argument vector, and a `job` driver.
 *
 * @param {import('node:test').TestContext} t
 */
async function createJobFixture(t) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const recorder = join(w.dir, 'job-test');
  const stubPath = join(recorder, 'agent-stub.sh');
  const bodyPath = join(recorder, 'agent-stub-body.sh');
  const argvPath = join(recorder, 'argv.txt');
  const promptsPath = join(recorder, 'prompts.txt');
  const xdgState = join(w.dir, 'xdg-state');
  const remoteStatus = join(w.dir, STATE_DIR, 'autonomous_logs', 'remote_status.json');
  const watcher = join(w.dir, 'scripts', 'autonomous-watcher.sh');

  await mkdir(recorder, { recursive: true });
  await mkdir(xdgState, { recursive: true });
  await writeFile(
    stubPath,
    [
      '#!/usr/bin/env bash',
      `printf '%s\\n' "$@" > ${shellQuote(argvPath)}`,
      `printf '%s\\n%s\\n' "$2" ${shellQuote(PROMPT_DELIMITER)} >> ${shellQuote(promptsPath)}`,
      'sleep 0.3',
      `. ${shellQuote(bodyPath)}`,
      'exit 0',
      '',
    ].join('\n'),
    'utf8',
  );
  await chmod(stubPath, 0o755);
  await writeFile(bodyPath, ':\n', 'utf8');

  const config = JSON.parse(readFileSync(join(w.dir, 'harness.config.json'), 'utf8'));

  const jobEnv = (env) => ({
    HARNESS_JOB_MODE: '1',
    HARNESS_INPUT_CHAIN: '',
    HARNESS_REMOTE_SLUG: '',
    HARNESS_AGENT_CLI: stubPath,
    CLAR: w.clarDir,
    POLL_INTERVAL_SECS: '1',
    USAGE_LANE_STATE_ENABLED: '1',
    HOME: join(w.dir, 'home'),
    XDG_CONFIG_HOME: join(w.dir, 'home', '.config'),
    XDG_STATE_HOME: xdgState,
    ...env,
  });

  return {
    ...w,
    defaultBranch: config.defaultBranch,
    remoteStatus,
    watcher,
    jobEnv,
    setStub: (shellBody) => writeFile(bodyPath, `${shellBody}\n`, 'utf8'),
    job: (args, env = {}) => runBash(w.dir, [watcher, 'job', ...args], jobEnv(env)),
    argv: () => (existsSync(argvPath) ? readFileSync(argvPath, 'utf8').split('\n').slice(0, -1) : null),
    prompts: () =>
      existsSync(promptsPath)
        ? readFileSync(promptsPath, 'utf8').split(`${PROMPT_DELIMITER}\n`).slice(0, -1)
        : [],
    status: () => JSON.parse(readFileSync(remoteStatus, 'utf8')),
    async restoreStatus(fields) {
      const record = { schema: '1', branch: w.branch, engine: 'task', status: 'paused', decision: 'continue', ...fields };
      await mkdir(join(w.dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
      await writeFile(remoteStatus, `${JSON.stringify(record)}\n`, 'utf8');
    },
    assertLaneUntouched() {
      assert.deepEqual(readdirSync(xdgState), [], 'job mode wrote under XDG_STATE_HOME');
    },
  };
}

const lastLine = (text) => text.trimEnd().split('\n').at(-1);

test('refusals: nothing is launched', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  const cases = [
    ['without HARNESS_JOB_MODE', [j.branch, 'task', 'none'], { HARNESS_JOB_MODE: '' }],
    ['the default branch', [j.defaultBranch, 'task', 'none'], {}],
    ['a non-integer HARNESS_INPUT_CHAIN', [j.branch, 'task', 'none'], { HARNESS_INPUT_CHAIN: 'x' }],
  ];
  for (const [name, args, env] of cases) {
    const result = await j.job(args, env);
    assert.equal(result.status, 2, `${name}: exited ${result.status}\n${result.stdout}\n${result.stderr}`);
    assert.equal(j.argv(), null, `${name}: the stub was launched`);
    assert.equal(existsSync(j.remoteStatus), false, `${name}: a status was written`);
  }
  j.assertLaneUntouched();
});

test('none: the launch line, the start and stop records, and the parked detail', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  await t.test('a stub exiting 0 is completed / stop under the watcher launch line', async () => {
    const result = await j.job([j.branch, 'task', 'none']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: completed stop');
    assert.equal(j.status().status, 'completed');
    assert.equal(j.status().decision, 'stop');

    const argv = j.argv();
    const after = (flag) => argv[argv.indexOf(flag) + 1];
    assert.equal(after('--settings'), join(j.dir, '.claude', 'settings.autonomous.json'));
    assert.ok(argv.includes('--permission-mode'), argv.join(' '));
    const addDirs = argv.flatMap((arg, i) => (arg === '--add-dir' ? [argv[i + 1]] : []));
    assert.deepEqual(addDirs, [j.dir, join(j.dir, STATE_DIR)]);
    assert.equal(j.notifications().some((n) => n.event === 'launched'), false);
    j.assertLaneUntouched();
  });

  await t.test('a stub that writes question_1.md is parked / stop, naming branch-answer', async () => {
    await mkdir(j.clarDir, { recursive: true });
    await j.setStub('printf "## Q1\\n" > "$CLAR/question_1.md"');
    const result = await j.job([j.branch, 'task', 'none']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(j.status().status, 'parked');
    assert.equal(j.status().decision, 'stop');
    const parked = j.notifications().filter((n) => n.event === 'parked');
    assert.equal(parked.length, 1);
    assert.match(parked[0].detail, new RegExp(`/autonomous-sdlc-harness:branch-answer ${j.branch}`));
    j.assertLaneUntouched();
  });
});

test('answer: the prompt names the restored answer', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  await j.writeQuestion(1, '## Q1\n');
  await j.writeAnswer(1, 'a1\n');
  const result = await j.job([j.branch, 'task', 'answer']);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(j.prompts().at(-1), /clarifications\/feat_x\/answer_1\.md/);
  assert.equal(j.status().status, 'completed');
  assert.ok(j.notifications().some((n) => n.event === 'resumed' && /remote job/.test(n.detail)));
  j.assertLaneUntouched();
});

test('answer: a seeded park_loop_cycles and a no-progress re-park become park_loop', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  await j.restoreStatus({ status: 'parked', park_loop_cycles: '1' });
  await j.writeQuestion(5, '## Q5\n');
  await j.writeAnswer(5, 'a5\n');
  await j.setStub('printf "## Q1\\n" > "$CLAR/question_1.md"');
  const result = await j.job([j.branch, 'task', 'answer'], { PARK_LOOP_MAX_CYCLES: '2' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(lastLine(result.stdout), 'job: park_loop stop');
  assert.equal(j.status().status, 'park_loop');
  assert.equal(j.status().park_loop_cycles, '2');
  const loop = j.notifications().filter((n) => n.event === 'park_loop');
  assert.equal(loop.length, 1);
  assert.match(loop[0].detail, /\/autonomous-sdlc-harness:branch-status feat_x/);
  j.assertLaneUntouched();
});

test('chain and auto_resumes: chain is this job input, auto_resumes resets on a user dispatch', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  const runs = [
    { chain: '2', expectChain: '2', expectAuto: '2' },
    { chain: '0', expectChain: '0', expectAuto: '0' },
    { chain: '1', expectChain: '1', expectAuto: '2' },
  ];
  for (const { chain, expectChain, expectAuto } of runs) {
    await j.restoreStatus({ chain: '5', auto_resumes: '2' });
    const result = await j.job([j.branch, 'task', 'none'], { HARNESS_INPUT_CHAIN: chain });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(j.status().chain, expectChain, `HARNESS_INPUT_CHAIN=${chain}`);
    assert.equal(j.status().auto_resumes, expectAuto, `HARNESS_INPUT_CHAIN=${chain}`);
  }
  j.assertLaneUntouched();
});

test('a job killed mid-run leaves running / continue', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  await j.setStub('sleep 30');
  const child = spawn('bash', [j.watcher, 'job', j.branch, 'task', 'none'], {
    cwd: j.dir,
    env: { ...process.env, ...j.jobEnv({}) },
    detached: true,
    stdio: 'ignore',
  });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  try {
    let seen = false;
    for (let i = 0; i < 100 && !seen; i += 1) {
      await delay(100);
      seen = existsSync(j.remoteStatus) && j.argv() !== null;
    }
    assert.ok(seen, 'the job never wrote its start record and launched');
  } finally {
    process.kill(-child.pid, 'SIGKILL');
    await exited;
  }
  await delay(500);
  assert.equal(j.status().status, 'running');
  assert.equal(j.status().decision, 'continue');
  assert.equal(j.status().detail, 'job started');
  j.assertLaneUntouched();
});
