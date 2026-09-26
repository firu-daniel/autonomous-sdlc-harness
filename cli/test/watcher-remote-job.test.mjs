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
 * `gh`, recorded: every argument vector appended to `STUB_LOG`, `run list` and `run view` answered
 * from the environment, and any call starting with `STUB_FAIL_ON` failed with exit 4.
 */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
const line = args.join(' ');
const failOn = process.env.STUB_FAIL_ON;
if (failOn && line.startsWith(failOn)) {
  process.stderr.write('stub failure\\n');
  process.exit(4);
}
if (line.startsWith('run list')) process.stdout.write(process.env.STUB_RUN_LIST || '[]');
if (line.startsWith('run view')) process.stdout.write(process.env.STUB_RUN_VIEW || '{}');
`;

const nowSecs = () => Math.floor(Date.now() / 1000);

/** GitHub's `createdAt` shape — whole seconds, `Z` — for an epoch second. */
const iso = (secs) => new Date(secs * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** A canned `run list` answer carrying one `harness pause feat_x` run created at <secs>. */
const pauseRunList = (secs) =>
  JSON.stringify([{ databaseId: 99, displayTitle: 'harness pause feat_x', status: 'completed', createdAt: iso(secs) }]);

/** Stub bodies. `STATE` is the state directory and `REC` the recorder directory. */
const HONOUR_PAUSE = (tenths) =>
  `for i in $(seq 1 ${tenths}); do if [ -f "$STATE/PAUSE" ]; then : > "$STATE/PAUSE_ACK"; exit 0; fi; sleep 0.1; done`;
/** Exits 2 once PAUSE is dropped, without acknowledging it — a session failing before its checkpoint. */
const FAIL_AFTER_PAUSE = (tenths) =>
  `for i in $(seq 1 ${tenths}); do if [ -f "$STATE/PAUSE" ]; then exit 2; fi; sleep 0.1; done; exit 2`;
const COUNT_LAUNCH = 'n=$(cat "$REC/count" 2>/dev/null || echo 0); n=$((n + 1)); echo "$n" > "$REC/count"';
const rateLimitRejected = (aheadSecs) =>
  `printf '{"type":"rate_limit_event","rate_limit_info":{"status":"rejected","rateLimitType":"five_hour","resetsAt":%s,"isUsingOverage":false}}\\n' "$(( $(date +%s) + ${aheadSecs} ))"`;

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
  const ghStub = join(recorder, 'gh');
  const ghLog = join(recorder, 'gh.log');
  await writeFile(ghStub, GH_STUB, { mode: 0o755 });

  const config = JSON.parse(readFileSync(join(w.dir, 'harness.config.json'), 'utf8'));

  // Every job input a runner would set is pinned empty here, so a suite run inside a real
  // GitHub Actions job reads none of that job's own values.
  const jobEnv = (env) => ({
    HARNESS_JOB_MODE: '1',
    HARNESS_INPUT_CHAIN: '',
    HARNESS_REMOTE_SLUG: '',
    HARNESS_JOB_STARTED_EPOCH: '',
    HARNESS_JOB_DEADLINE_EPOCH: '',
    RUNNER_ENVIRONMENT: '',
    REMOTE_SELF_PAUSE_AFTER_SECS: '',
    GITHUB_RUN_ID: '',
    REMOTE_CONTROL_POLL_SECS: '1',
    REMOTE_AUTO_RESUME_DELAY_SECS: '0',
    HARNESS_GH_CLI: ghStub,
    STUB_LOG: ghLog,
    STUB_RUN_LIST: '[]',
    STATE: join(w.dir, STATE_DIR),
    REC: recorder,
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
    ghCalls: () =>
      existsSync(ghLog) ? readFileSync(ghLog, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).join(' ')) : [],
    pauseDropped: () => existsSync(join(w.dir, STATE_DIR, 'PAUSE')),
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

test('control poll: a harness pause run newer than the start pauses the run for the user', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  const start = nowSecs() - 10;
  await j.setStub(HONOUR_PAUSE(100));
  const result = await j.job([j.branch, 'task', 'none'], {
    HARNESS_JOB_STARTED_EPOCH: String(start),
    STUB_RUN_LIST: pauseRunList(start + 5),
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(lastLine(result.stdout), 'job: paused stop');
  assert.equal(j.status().pause_reason, 'user');
  assert.equal(j.status().decision, 'stop');
  const paused = j.notifications().filter((n) => n.event === 'paused');
  assert.equal(paused.length, 1);
  assert.match(paused[0].detail, /\/autonomous-sdlc-harness:branch-resume feat_x/);
  assert.ok(j.ghCalls().some((c) => c.startsWith('run list')), j.ghCalls().join('\n'));
  j.assertLaneUntouched();
});

test('control poll: a failed read never pauses', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  await j.setStub(HONOUR_PAUSE(30));
  const result = await j.job([j.branch, 'task', 'none'], {
    HARNESS_JOB_STARTED_EPOCH: String(nowSecs() - 10),
    STUB_RUN_LIST: pauseRunList(nowSecs()),
    STUB_FAIL_ON: 'run list',
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(lastLine(result.stdout), 'job: completed stop');
  assert.equal(j.status().pause_reason, '');
  assert.match(j.watcherLog(), /the control poll for 'feat_x' failed \(exit 3\)/);
});

test('control poll: the lower bound is never the job start alone', async (t) => {
  await t.test('chain 0: a pause sent while the job queued, after its own run createdAt', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const start = nowSecs();
    await j.setStub(HONOUR_PAUSE(100));
    const result = await j.job([j.branch, 'task', 'none'], {
      HARNESS_INPUT_CHAIN: '0',
      HARNESS_JOB_STARTED_EPOCH: String(start),
      GITHUB_RUN_ID: '77',
      STUB_RUN_VIEW: JSON.stringify({ createdAt: iso(start - 20) }),
      STUB_RUN_LIST: pauseRunList(start - 10),
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused stop');
    assert.equal(j.status().pause_reason, 'user');
    assert.ok(j.ghCalls().includes('run view 77 --json createdAt'), j.ghCalls().join('\n'));
  });

  await t.test('chain 1: a pause sent across a chained continuation, after the restored bound', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const start = nowSecs();
    await j.restoreStatus({ control_polled_at: String(start - 20), pause_reason: 'budget' });
    await j.setStub(HONOUR_PAUSE(100));
    const result = await j.job([j.branch, 'task', 'pause'], {
      HARNESS_INPUT_CHAIN: '1',
      HARNESS_JOB_STARTED_EPOCH: String(start),
      STUB_RUN_LIST: pauseRunList(start - 10),
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused stop');
    assert.equal(j.status().pause_reason, 'user');
    assert.equal(j.notifications().some((n) => n.event === 'resumed'), false, 'a budget continuation was announced');
  });

  await t.test('chain 1: a pause older than the restored bound is not seen again', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const start = nowSecs();
    await j.restoreStatus({ control_polled_at: String(start - 5) });
    await j.setStub(HONOUR_PAUSE(30));
    const result = await j.job([j.branch, 'task', 'none'], {
      HARNESS_INPUT_CHAIN: '1',
      HARNESS_JOB_STARTED_EPOCH: String(start),
      STUB_RUN_LIST: pauseRunList(start - 10),
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: completed stop');
    assert.ok(Number(j.status().control_polled_at) >= start, `control_polled_at ${j.status().control_polled_at} < ${start}`);
  });
});

test('budget: a hosted self-pause continues, silently', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  await t.test('REMOTE_SELF_PAUSE_AFTER_SECS=1 -> paused / budget / continue, no paused notification', async () => {
    await j.setStub(HONOUR_PAUSE(100));
    const result = await j.job([j.branch, 'task', 'none'], {
      HARNESS_JOB_STARTED_EPOCH: String(nowSecs()),
      REMOTE_SELF_PAUSE_AFTER_SECS: '1',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused continue');
    assert.equal(j.status().pause_reason, 'budget');
    assert.equal(j.status().decision, 'continue');
    assert.equal(j.notifications().some((n) => n.event === 'paused'), false);
  });

  await t.test('a failed exit after the budget PAUSE -> the auto-resume re-drops it, paused / budget / continue', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await j.setStub(`${COUNT_LAUNCH}\nif [ "$n" = 1 ]; then ${FAIL_AFTER_PAUSE(100)}; fi\n${HONOUR_PAUSE(100)}`);
    const result = await j.job([j.branch, 'task', 'none'], {
      HARNESS_JOB_STARTED_EPOCH: String(nowSecs()),
      REMOTE_SELF_PAUSE_AFTER_SECS: '1',
      REMOTE_AUTO_RESUME_DELAY_SECS: '0',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused continue');
    assert.equal(j.prompts().length, 2);
    assert.equal(j.status().pause_reason, 'budget');
    assert.equal(j.status().auto_resumes, '1');
  });

  await t.test('self-hosted with the variable unset -> no self-pause', async () => {
    await j.setStub(HONOUR_PAUSE(30));
    const result = await j.job([j.branch, 'task', 'none'], {
      HARNESS_JOB_STARTED_EPOCH: String(nowSecs() - 100000),
      RUNNER_ENVIRONMENT: 'self-hosted',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: completed stop');
  });
});

test('usage: a short reset is waited out in the job, a reset past the deadline goes to the poller', async (t) => {
  await t.test('a reset 2 seconds ahead -> the run completes in the same job', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await j.setStub(`${COUNT_LAUNCH}\nif [ "$n" = 1 ]; then ${rateLimitRejected(2)}; ${HONOUR_PAUSE(100)}; fi`);
    const result = await j.job([j.branch, 'task', 'none'], {
      USAGE_CHECK_INTERVAL_SECS: '1',
      USAGE_RESUME_MARGIN_SECS: '0',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: completed stop');
    assert.equal(j.prompts().length, 2);
    assert.equal(j.status().pause_reason, '');
  });

  await t.test('a reset beyond the deadline -> paused / usage / wait-poller', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await j.setStub(`${rateLimitRejected(100)}; ${HONOUR_PAUSE(100)}`);
    const result = await j.job([j.branch, 'task', 'none'], {
      USAGE_CHECK_INTERVAL_SECS: '1',
      USAGE_RESUME_MARGIN_SECS: '0',
      HARNESS_JOB_DEADLINE_EPOCH: String(nowSecs() + 50),
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused wait-poller');
    assert.equal(j.status().pause_reason, 'usage');
    assert.match(j.status().usage_resume_at, /^\d+$/);
    const paused = j.notifications().filter((n) => n.event === 'paused');
    assert.equal(paused.length, 1);
    assert.match(paused[0].detail, /reset at ~/);
    assert.equal(j.prompts().length, 1);
  });
});

test('auto-resume: bounded, and reset by a user action', async (t) => {
  await t.test('an unrequested PAUSE_ACK, then exit 0 on relaunch -> one auto-resume, completed', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await j.setStub(`${COUNT_LAUNCH}\nif [ "$n" = 1 ]; then : > "$STATE/PAUSE_ACK"; exit 0; fi`);
    const result = await j.job([j.branch, 'task', 'none']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: completed stop');
    assert.equal(j.prompts().length, 2);
    assert.equal(j.status().auto_resumes, '1');
    assert.match(j.prompts()[1], /RESUME from a PAUSE/);
    assert.equal(j.notifications().some((n) => n.event === 'paused'), false);
  });

  await t.test('a stub that always exits 2 -> exactly REMOTE_AUTO_RESUME_MAX relaunches, then failed / stop', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await j.setStub('exit 2');
    const result = await j.job([j.branch, 'task', 'none'], { REMOTE_AUTO_RESUME_MAX: '2' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: failed stop');
    assert.equal(j.prompts().length, 3);
    assert.equal(j.status().auto_resumes, '2');
  });

  await t.test('a restored exhausted count: chain 0 gets the full allowance, chain 1 none', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await j.setStub('exit 2');
    await j.restoreStatus({ auto_resumes: '2' });
    const user = await j.job([j.branch, 'task', 'none'], { REMOTE_AUTO_RESUME_MAX: '2', HARNESS_INPUT_CHAIN: '0' });
    assert.equal(user.status, 0, `${user.stdout}\n${user.stderr}`);
    assert.equal(j.prompts().length, 3);

    await j.restoreStatus({ auto_resumes: '2' });
    const chained = await j.job([j.branch, 'task', 'none'], { REMOTE_AUTO_RESUME_MAX: '2', HARNESS_INPUT_CHAIN: '1' });
    assert.equal(chained.status, 0, `${chained.stdout}\n${chained.stderr}`);
    assert.equal(lastLine(chained.stdout), 'job: failed stop');
    assert.equal(j.prompts().length, 4);
  });
});

test('status prints the four job-mode tunables with their defaults', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  const result = await runBash(j.dir, [j.watcher, 'status'], {
    HOME: join(j.dir, 'home'),
    XDG_CONFIG_HOME: join(j.dir, 'home', '.config'),
  });
  assert.equal(result.status, 0, result.stderr);
  for (const pair of [
    'REMOTE_CONTROL_POLL_SECS=60',
    'REMOTE_WAIT_MAX_SECS=600',
    'REMOTE_AUTO_RESUME_MAX=2',
    'REMOTE_AUTO_RESUME_DELAY_SECS=300',
  ]) {
    assert.match(result.stdout, new RegExp(`^tunables: .* ${pair}( |$)`, 'm'), pair);
  }
});
