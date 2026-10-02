/**
 * The written watcher's `job` subcommand — one run, supervised inside a remote job's own checkout —
 * driven end to end against a fixture `init` wired, with the agent CLI and the notifier recorded.
 *
 * **The rule these tests exist to enforce: job mode launches nothing it was not told to, reports
 * every run it launched through `remote_status.json`, and carries across a job boundary only what
 * the bundle contract says it carries.** Every case points `XDG_STATE_HOME` at an empty directory
 * inside the fixture and passes `USAGE_LANE_STATE_ENABLED=1`, so a lane write that job mode failed
 * to force off would land there and be seen.
 *
 * **A usage-paused run never leaves the job waiting on nothing:** it ends with a usable
 * `usage_resume_at` in the bundle, repaired to the gate's one-hour fallback when the value was
 * lost, or with the in-job wait's bound fired. The `usage:` cases assert both on the written
 * `remote_status.json` and the notification recorder, and none of them waits on the fallback hour.
 *
 * **Every job-mode event also reaches `remote-run.sh report`, which reaches GitHub only with `forge`
 * `github`:** a parked case posts its comment on the issue the branch's provenance line names, and the
 * same case with `forge` unset makes no `issues/` call.
 *
 * **Every watcher this file starts is bounded and reaped, so a hang fails by name.** Each `runBash`
 * call carries `timeoutMs: WATCHER_RUN_TIMEOUT_MS` and `t.signal`. The value sits below the per-test
 * timeout (`--test-timeout=1800000`), because that expiry kills this file's process and leaves the
 * watcher's detached group running (`helpers/fixture.mjs` → choice 6); and far above the longest
 * honest run here, a few one-second poll intervals, so only a hang reaches it. The case *"a job
 * killed mid-run leaves running / continue"* spawns and kills its own group, and is not bounded here.
 *
 * **`HARNESS_JOB_USAGE_REPEAT` repeats the case *"a reset 2 seconds ahead"* concurrently.** Unset is
 * 1 and runs the case once; a positive integer N runs N independent job fixtures at once and fails
 * naming the repetition; anything else fails the file's load naming the variable. At N > 1 each
 * repetition's reset is `REPEAT_RESET_AHEAD_SECS` ahead and its stub waits `REPEAT_PAUSE_WAIT_TENTHS`
 * for PAUSE: under that load a watcher's pass outlasts 2 seconds, the gate then reads an elapsed
 * window and downgrades it (the watcher's usage-gate invariant 1), and the run completes unpaused on
 * one prompt — a failure of the fixture's timing, not of the race. The race window, a tag written
 * after its PAUSE, does not depend on the lead. It is off by
 * default because N concurrent watchers multiply the suite's load for evidence only a maintainer
 * needs: that the registry write race stays closed under contention, not one lucky pass. Its figure
 * is taken by hand, outside any harness session (`harness-runs/lessons.md` → *"A wall-clock figure
 * in a document of record is never one a run measured inside its own session"*). From `cli/`:
 *
 *     HARNESS_JOB_USAGE_REPEAT=40 node --test --test-timeout=1800000 test/watcher-remote-job.test.mjs
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

import { runBash, runGit } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const PROMPT_DELIMITER = '----- end of prompt -----';

/** The bound on one watcher run — the header argues the value. */
const WATCHER_RUN_TIMEOUT_MS = 120_000;

/** The environment variable naming how many times the repeatable usage case runs at once. */
const JOB_USAGE_REPEAT_VARIABLE = 'HARNESS_JOB_USAGE_REPEAT';

/** Unset: 1. A positive integer: that count. Anything else: refused by name. */
function jobUsageRepeat() {
  const value = process.env[JOB_USAGE_REPEAT_VARIABLE];
  if (value === undefined) return 1;
  if (/^[1-9][0-9]*$/.test(value)) return Number(value);
  throw new Error(
    `${JOB_USAGE_REPEAT_VARIABLE} is set to \`${value}\`; it takes a positive integer, and \`1\` runs the case once.`,
  );
}

const JOB_USAGE_REPEAT = jobUsageRepeat();

/** The repeated case's reset lead and PAUSE wait — the header argues why they differ from one run's. */
const REPEAT_RESET_AHEAD_SECS = 15;
const REPEAT_PAUSE_WAIT_TENTHS = 600;

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
    GITHUB_REPOSITORY: '',
    GITHUB_SERVER_URL: '',
    RUNNER_TEMP: '',
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
    job: (args, env = {}) =>
      runBash(w.dir, [watcher, 'job', ...args], jobEnv(env), { timeoutMs: WATCHER_RUN_TIMEOUT_MS, signal: t.signal }),
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
    // The profile's only additionalDirectories entry is the state directory, so it is not repeated.
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
    assert.match(parked[0].detail, /Run workflow on harness-run\.yml .*resume answer/);
    assert.match(parked[0].detail, /engine `task`/);
    assert.match(parked[0].detail, /from the branch `[^`]+` \(Use workflow from\)/);
    j.assertLaneUntouched();
  });
});

test('a local run that parks names neither the job command nor the GitHub route', async (t) => {
  const w = await createWatcherFixture(t);
  if (w === null) return;

  await w.writeQuestion(1, '## Q1\n');
  await w.seedRecord();
  await w.writeAnswer(1, 'a1\n');
  await w.setStub('printf "## Q2\\n" > "$CLAR/question_2.md"');
  await w.tick({ HARNESS_JOB_MODE: '' });

  const parked = w.notifications().filter((n) => n.event === 'parked');
  assert.equal(parked.length, 1, w.watcherLog());
  assert.doesNotMatch(parked[0].detail, /\/autonomous-sdlc-harness:branch-answer/);
  assert.doesNotMatch(parked[0].detail, /Run workflow on/);
});

test("add-dir: job mode appends the profile's additionalDirectories after the two fixed ones", async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  const profilePath = join(j.dir, '.claude', 'settings.autonomous.json');
  const original = readFileSync(profilePath, 'utf8');
  const addDirs = () => {
    const argv = j.argv();
    return argv.flatMap((arg, i) => (arg === '--add-dir' ? [argv[i + 1]] : []));
  };

  await t.test('an extra entry is passed once, after the worktree and the state directory', async () => {
    const pluginRoot = join(j.dir, 'plugin root');
    const profile = JSON.parse(original);
    profile.permissions.additionalDirectories.push(pluginRoot, '');
    await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
    const result = await j.job([j.branch, 'task', 'none']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.deepEqual(addDirs(), [j.dir, join(j.dir, STATE_DIR), pluginRoot]);
  });

  await t.test('a profile without the key still launches with the two', async () => {
    const profile = JSON.parse(original);
    delete profile.permissions.additionalDirectories;
    await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
    const result = await j.job([j.branch, 'task', 'none']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.deepEqual(addDirs(), [j.dir, join(j.dir, STATE_DIR)]);
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
  assert.match(loop[0].detail, /resume answer, park_loop_clear true/);
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
  assert.match(paused[0].detail, /resume pause/);
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
    const runOnce = async (label, aheadSecs, pauseTenths) => {
      const j = await createJobFixture(t);
      if (j === null) return;
      await j.setStub(
        `${COUNT_LAUNCH}\nif [ "$n" = 1 ]; then ${rateLimitRejected(aheadSecs)}; ${HONOUR_PAUSE(pauseTenths)}; fi`,
      );
      const result = await j.job([j.branch, 'task', 'none'], {
        USAGE_CHECK_INTERVAL_SECS: '1',
        USAGE_RESUME_MARGIN_SECS: '0',
      });
      assert.equal(result.status, 0, `${label}${result.stdout}\n${result.stderr}`);
      assert.equal(lastLine(result.stdout), 'job: completed stop', label);
      assert.equal(j.prompts().length, 2, label);
      assert.equal(j.status().pause_reason, '', label);
    };
    if (JOB_USAGE_REPEAT === 1) {
      await runOnce('', 2, 100);
      return;
    }
    // Settled rather than `Promise.all`, so no watcher outlives the case and every failure is named.
    const outcomes = await Promise.allSettled(
      Array.from({ length: JOB_USAGE_REPEAT }, (_, i) =>
        runOnce(`repetition ${i + 1} of ${JOB_USAGE_REPEAT}: `, REPEAT_RESET_AHEAD_SECS, REPEAT_PAUSE_WAIT_TENTHS),
      ),
    );
    const failures = outcomes.filter((o) => o.status === 'rejected').map((o) => o.reason?.message ?? String(o.reason));
    assert.deepEqual(failures, [], `${failures.length} of ${JOB_USAGE_REPEAT} repetitions failed`);
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

  await t.test('a usage_resume_at lost after the gate paused -> repaired to the fallback, wait-poller', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const lib = join(j.dir, 'scripts', 'lib', 'harness-run-lib.sh');
    // The exact stranded record: tagged `usage`, PAUSE and PAUSE_ACK present, no reset time.
    const loseResumeAt =
      `. ${shellQuote(lib)}; ` +
      `hr_registry_set "$STATE/autonomous_logs/registry.json" feat_x usage_resume_at ""`;
    await j.setStub(
      `${rateLimitRejected(2)}; for i in $(seq 1 100); do if [ -f "$STATE/PAUSE" ]; then ${loseResumeAt}; : > "$STATE/PAUSE_ACK"; exit 0; fi; sleep 0.1; done`,
    );
    const result = await j.job([j.branch, 'task', 'none'], {
      USAGE_CHECK_INTERVAL_SECS: '1',
      USAGE_RESUME_MARGIN_SECS: '0',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused wait-poller');
    assert.equal(j.status().pause_reason, 'usage');
    assert.match(j.status().usage_resume_at, /^\d+$/);
    assert.ok(
      Number(j.status().usage_resume_at) >= nowSecs() + 3600 - 30,
      `usage_resume_at ${j.status().usage_resume_at} is not the one-hour fallback`,
    );
    const paused = j.notifications().filter((n) => n.event === 'paused');
    assert.equal(paused.length, 1, JSON.stringify(paused));
    assert.match(paused[0].detail, /the recorded reset time was lost/);
    assert.equal(j.prompts().length, 1);
  });

  await t.test('a relaunch held off past the reset -> the in-job wait bound fires, wait-poller', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    // The kill switch is GLOBAL_STOP — `<state_dir>/AUTONOMOUS_STOP` in the job's own checkout —
    // and kill_switch_active makes resume_paused_runs return before it relaunches anything, so
    // the gate's RESUME stands unconsumed and the record stays `paused` with both tags cleared.
    await j.setStub(
      `${rateLimitRejected(2)}; for i in $(seq 1 100); do if [ -f "$STATE/PAUSE" ]; then : > "$STATE/AUTONOMOUS_STOP"; : > "$STATE/PAUSE_ACK"; exit 0; fi; sleep 0.1; done`,
    );
    const result = await j.job([j.branch, 'task', 'none'], {
      USAGE_RESUME_MARGIN_SECS: '0',
      REMOTE_WAIT_MAX_SECS: '2',
      USAGE_CHECK_INTERVAL_SECS: '1',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

    // The bound path writes no log line of its own; the gate's resume during the wait is the
    // line that must follow the wait's. The immediate wait-poller path logs neither.
    const log = j.watcherLog();
    const waiting = log.search(/is usage-paused — waiting in the job for/);
    assert.ok(waiting >= 0, log);
    const gateResume = log.search(/usage auto-resume: the window reset recorded for 'feat_x' has passed/);
    assert.ok(gateResume > waiting, log);

    const paused = j.notifications().filter((n) => n.event === 'paused');
    assert.ok(paused.length >= 2, JSON.stringify(paused));
    assert.ok(
      paused.slice(0, -1).some((n) => /waiting in the job/.test(n.detail)),
      JSON.stringify(paused),
    );

    assert.equal(lastLine(result.stdout), 'job: paused wait-poller');

    const last = paused.at(-1).detail;
    assert.match(last, /the in-job wait passed 2s after the reset without a resume/);
    assert.match(last, /\/autonomous-sdlc-harness:branch-resume feat_x/);
    assert.match(last, /resume pause/);
    assert.doesNotMatch(last, /usage limit reached — resumes automatically after/);

    assert.equal(j.status().pause_reason, 'usage');
    assert.equal(j.status().usage_resume_at, '');
    assert.match(j.status().detail, /the in-job usage wait passed its bound/);
    // `paused_by` is not a bundle field; the registry the bundle was written from carries it.
    assert.equal(j.record().paused_by, '');
    assert.equal(existsSync(join(j.dir, STATE_DIR, 'RESUME')), true, 'the gate never dropped RESUME');
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

test('phases.qa: a job tells the task and user_review engines the QA phase is skipped, and says so on completion', async (t) => {
  const SKIP_CLAUSE = /executes in a GitHub Actions job \(execution: github-actions\), where the interactive-test phase is unsupported/;
  const SKIP_DETAIL = /interactive tests skipped \(unsupported on GitHub Actions\): run \/autonomous-sdlc-harness:branch-qa-test feat_x locally/;

  for (const qa of [true, false]) {
    await t.test(`phases.qa ${qa}`, async (t) => {
      const j = await createJobFixture(t);
      if (j === null) return;
      const configPath = join(j.dir, 'harness.config.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      await writeFile(configPath, `${JSON.stringify({ ...config, phases: { ...config.phases, qa } }, null, 2)}\n`, 'utf8');

      for (const engine of ['task', 'user_review', 'docs']) {
        const before = j.notifications().length;
        const result = await j.job([j.branch, engine, 'none']);
        assert.equal(result.status, 0, `${engine}: ${result.stdout}\n${result.stderr}`);
        assert.equal(lastLine(result.stdout), 'job: completed stop', engine);

        const expectSkip = qa && engine !== 'docs';
        assert.equal(SKIP_CLAUSE.test(j.prompts().at(-1)), expectSkip, `${engine}: prompt clause`);
        const completed = j.notifications().slice(before).filter((n) => n.event === 'completed');
        assert.equal(completed.length, 1, `${engine}: one completed notification`);
        assert.equal(SKIP_DETAIL.test(completed[0].detail ?? ''), expectSkip, `${engine}: completed detail`);
      }
      j.assertLaneUntouched();
    });
  }
});

/** The repository and issue the forge cases' provenance line names. */
const FORGE_REPOSITORY = 'octo/fixture';
const FORGE_ISSUE = 7;

/**
 * Set `execution.target` `github-actions` and `forge` (deleted when null), and push the job's branch to
 * origin carrying a task prompt whose provenance line names {@link FORGE_ISSUE}. The checkout itself is
 * left as it was: the push goes through a throwaway clone.
 */
async function wireForge(j, forge) {
  const configPath = join(j.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.execution = { target: 'github-actions' };
  if (forge === null) delete config.forge;
  else config.forge = forge;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  const origin = (await runGit(j.dir, ['remote', 'get-url', 'origin'])).stdout.trim();
  const clone = join(j.dir, 'job-test', 'origin-clone');
  await runGit(j.dir, ['clone', '--quiet', origin, clone]);
  try {
    await runGit(clone, ['checkout', '--quiet', '-b', j.branch]);
    const prompt = `${STATE_DIR}/task_prompts/${j.branch}_task_prompt.md`;
    await mkdir(join(clone, STATE_DIR, 'task_prompts'), { recursive: true });
    await writeFile(
      join(clone, prompt),
      `# A task\n\nDo it.\n\n---\n\nStarted from https://github.com/${FORGE_REPOSITORY}/issues/${FORGE_ISSUE} by @alice, who applied the label \`sdlc-harness\`.\n`,
      'utf8',
    );
    await runGit(clone, ['add', '--force', prompt]);
    await runGit(clone, [
      '-c', 'user.email=fixture@example.invalid', '-c', 'user.name=Harness Fixture',
      'commit', '--quiet', '--no-verify', '-m', `fixture: ${j.branch}`,
    ]);
    await runGit(clone, ['push', '--quiet', '--no-verify', 'origin', `HEAD:refs/heads/${j.branch}`]);
  } finally {
    await rm(clone, { recursive: true, force: true });
  }
}

test('report: a parked job comments on its issue with forge github, and calls no issues/ endpoint without it', async (t) => {
  for (const forge of ['github', null]) {
    await t.test(`forge ${forge ?? 'unset'}`, async (t) => {
      const j = await createJobFixture(t);
      if (j === null) return;
      await wireForge(j, forge);
      await mkdir(j.clarDir, { recursive: true });
      await j.setStub('printf "## Q1\\n" > "$CLAR/question_1.md"');
      const result = await j.job([j.branch, 'task', 'none'], { GITHUB_REPOSITORY: FORGE_REPOSITORY });
      assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
      assert.equal(j.status().status, 'parked');
      assert.equal(j.notifications().filter((n) => n.event === 'parked').length, 1);

      const calls = j.ghCalls();
      if (forge === 'github') {
        const comment = `api --method POST repos/${FORGE_REPOSITORY}/issues/${FORGE_ISSUE}/comments`;
        assert.ok(calls.some((c) => c.startsWith(`${comment} `)), calls.join('\n'));
      } else {
        assert.equal(calls.some((c) => c.includes('issues/')), false, calls.join('\n'));
      }
    });
  }
});

test('report: a job whose sessions keep failing reports failed on its issue once, after its automatic resumes', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;
  await wireForge(j, 'github');
  await j.setStub('exit 2');
  const result = await j.job([j.branch, 'task', 'none'], {
    REMOTE_AUTO_RESUME_MAX: '2',
    REMOTE_AUTO_RESUME_DELAY_SECS: '0',
    GITHUB_REPOSITORY: FORGE_REPOSITORY,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(lastLine(result.stdout), 'job: failed stop');
  assert.equal(j.prompts().length, 3);

  const calls = j.ghCalls();
  // The fixture has no pull request, so each `failed` report labels the issue once.
  assert.equal(calls.filter((c) => c.includes('labels[]=sdlc-harness: failed')).length, 1, calls.join('\n'));
});

test('status prints the four job-mode tunables with their defaults', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  const result = await runBash(
    j.dir,
    [j.watcher, 'status'],
    { HOME: join(j.dir, 'home'), XDG_CONFIG_HOME: join(j.dir, 'home', '.config') },
    { timeoutMs: WATCHER_RUN_TIMEOUT_MS, signal: t.signal },
  );
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
