/**
 * A parked run carried across real job boundaries: the written watcher's `job` subcommand run once per
 * job against one fixture `init` wired, with only the bundle crossing between jobs.
 *
 * **The rule these tests exist to enforce: a park answered, then paused, then resumed in job mode ends
 * `completed`, archives the answered pair, and is delivered — whatever pause came between, because
 * classification reads what was on disk at launch rather than a registry the job boundary discarded.**
 * Each case plays job 1 `none` (parks), job 2 `answer` (pauses), job 3 `pause` (completes), then
 * `remote-run.sh deliver` against job 3's saved bundle. The cases cover four sequences: the user pause,
 * the budget pause, the usage pause — reaching `wait-poller` through `HARNESS_JOB_DEADLINE_EPOCH`, never
 * the gate's fallback hour — and a stop, where job 2 is killed mid-session and its bundle, saved as
 * the workflow's `always()` step saves it on a cancel, still says `running`. The same outcome inside
 * one local process is the local resume suites' (`watcher-park-resume.test.mjs`, `watcher-usage-resume.test.mjs`).
 *
 * **Between jobs only the bundle crosses.** `remote-run.sh save` writes it; everything a fresh runner
 * would not have — the registry, the branch's clarification directory, `PAUSE_PROGRESS.md`,
 * `remote_status.json` and the PAUSE / RESUME / PAUSE_ACK sentinels — is removed; the fixture's own
 * copy of `hr_remote_bundle_restore` places the bundle back in `job` mode; and the `answer` job gets
 * its `answer_1.md` written as `remote-run.sh restore --resume answer` would write it.
 *
 * **Every watcher this file starts is bounded and reaped, so a hang fails by name.** Each `runBash` call
 * carries `timeoutMs: RUN_TIMEOUT_MS` and `t.signal`; the value sits below the per-test timeout
 * (`--test-timeout=1800000`) for the reason `watcher-remote-job.test.mjs`'s header gives. Every fixture
 * is torn down in process by `createWatcherFixture`'s `t.after`. No case reaches the network: `gh` is a
 * stub reached through `HARNESS_GH_CLI`. The stop case's killed job is the exception to `runBash`: it is
 * spawned as its own detached group, which the case waits on for at most `KILL_WAIT_TENTHS` and then
 * kills and reaps whether or not the session was seen to start.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, runBash, runGit } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const REPOSITORY = 'octo/fixture';
const ISSUE = 7;
const PR_URL = `https://github.com/${REPOSITORY}/pull/12`;

/** The bound on one script run — the header argues the value. */
const RUN_TIMEOUT_MS = 120_000;

/** How long, in tenths of a second, the stop case waits for its job's session to start before killing it. */
const KILL_WAIT_TENTHS = 100;

function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * `gh`, recorded: each argument vector and any `body=@` / `--body-file` content appended to `STUB_LOG`;
 * `run list` answered from `STUB_RUN_LIST`, `pr list` with `[]`, `pr create` with {@link PR_URL}, a
 * label read with `[]` and any other `api` call with `{}`.
 */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require('node:fs');
const args = process.argv.slice(2);
const at = args.findIndex((arg) => arg.startsWith('body=@'));
const fileAt = args.indexOf('--body-file');
const body = at >= 0 ? readFileSync(args[at].slice('body=@'.length), 'utf8')
  : fileAt >= 0 ? readFileSync(args[fileAt + 1], 'utf8') : null;
appendFileSync(process.env.STUB_LOG, JSON.stringify({ args, body }) + '\\n');
if (args[0] === 'run' && args[1] === 'list') {
  process.stdout.write(process.env.STUB_RUN_LIST || '[]');
} else if (args[0] === 'run' && args[1] === 'view') {
  process.stdout.write('{}');
} else if (args[0] === 'pr' && args[1] === 'list') {
  process.stdout.write('[]');
} else if (args[0] === 'pr' && args[1] === 'create') {
  process.stdout.write(${JSON.stringify(`${PR_URL}\n`)});
} else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1] ?? '')) {
  process.stdout.write('[]');
} else if (args[0] === 'api') {
  process.stdout.write('{}');
}
`;

const nowSecs = () => Math.floor(Date.now() / 1000);

/** GitHub's `createdAt` shape — whole seconds, `Z` — for an epoch second. */
const iso = (secs) => new Date(secs * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** A canned `run list` answer carrying one `harness pause <branch>` run created at <secs>. */
const pauseRunList = (branch, secs) =>
  JSON.stringify([{ databaseId: 99, displayTitle: `harness pause ${branch}`, status: 'completed', createdAt: iso(secs) }]);

/** Stub body: acknowledge PAUSE and exit 0 once it appears. `STATE` is the state directory. */
const HONOUR_PAUSE = (tenths) =>
  `for i in $(seq 1 ${tenths}); do if [ -f "$STATE/PAUSE" ]; then : > "$STATE/PAUSE_ACK"; exit 0; fi; sleep 0.1; done`;

/** Stub body: a usage rejection whose reset is <aheadSecs> ahead. */
const rateLimitRejected = (aheadSecs) =>
  `printf '{"type":"rate_limit_event","rate_limit_info":{"status":"rejected","rateLimitType":"five_hour","resetsAt":%s,"isUsingOverage":false}}\\n' "$(( $(date +%s) + ${aheadSecs} ))"`;

const lastLine = (text) => text.trimEnd().split('\n').at(-1);

/**
 * Set `execution.target` `github-actions` and `forge` `github`, and push the branch to origin carrying a
 * task prompt whose provenance line names {@link ISSUE}, through a throwaway clone.
 */
async function wireForge(w, scratch) {
  const configPath = join(w.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.execution = { target: 'github-actions' };
  config.forge = 'github';
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  const origin = (await runGit(w.dir, ['remote', 'get-url', 'origin'])).stdout.trim();
  const clone = join(scratch, 'origin-clone');
  await runGit(w.dir, ['clone', '--quiet', origin, clone]);
  try {
    await runGit(clone, ['checkout', '--quiet', '-b', w.branch]);
    const prompt = `${STATE_DIR}/task_prompts/${w.branch}_task_prompt.md`;
    await mkdir(join(clone, STATE_DIR, 'task_prompts'), { recursive: true });
    await writeFile(
      join(clone, prompt),
      `# A task\n\nDo it.\n\n---\n\nStarted from https://github.com/${REPOSITORY}/issues/${ISSUE} by @alice, who applied the label \`sdlc-harness\`.\n`,
      'utf8',
    );
    await runGit(clone, ['add', '--force', prompt]);
    await runGit(clone, [
      '-c', 'user.email=fixture@example.invalid', '-c', 'user.name=Harness Fixture',
      'commit', '--quiet', '--no-verify', '-m', `fixture: ${w.branch}`,
    ]);
    const push = await runGit(clone, ['push', '--quiet', '--no-verify', 'origin', `HEAD:refs/heads/${w.branch}`]);
    assert.equal(push.status, 0, push.stderr);
  } finally {
    await rm(clone, { recursive: true, force: true });
  }
}

/**
 * One fixture checkout that plays every job, wired for `forge` `github`, with the agent and `gh`
 * recorded and a driver for each step of the sequence.
 *
 * @param {import('node:test').TestContext} t
 */
async function createSequenceFixture(t) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const scratch = join(w.dir, 'sequence-test');
  const stubPath = join(scratch, 'agent-stub.sh');
  const bodyPath = join(scratch, 'agent-stub-body.sh');
  const launched = join(scratch, 'agent-launched');
  const ghStub = join(scratch, 'gh');
  const ghLog = join(scratch, 'gh.log');
  const runnerTemp = join(scratch, 'runner-temp');
  const xdgState = join(w.dir, 'xdg-state');
  const state = join(w.dir, STATE_DIR);
  const logs = join(state, 'autonomous_logs');
  const remoteStatus = join(logs, 'remote_status.json');
  const watcher = join(w.dir, INIT_SCRIPTS_DIR, 'autonomous-watcher.sh');
  const remoteRun = join(w.dir, INIT_SCRIPTS_DIR, 'remote-run.sh');
  const lib = join(w.dir, INIT_SCRIPTS_DIR, 'lib', 'harness-run-lib.sh');

  await mkdir(runnerTemp, { recursive: true });
  await mkdir(xdgState, { recursive: true });
  await writeFile(
    stubPath,
    ['#!/usr/bin/env bash', `: > ${shellQuote(launched)}`, 'sleep 0.3', `. ${shellQuote(bodyPath)}`, 'exit 0', ''].join('\n'),
    'utf8',
  );
  await chmod(stubPath, 0o755);
  await writeFile(bodyPath, ':\n', 'utf8');
  await writeFile(ghStub, GH_STUB, { mode: 0o755 });
  await wireForge(w, scratch);

  // Every job input a runner would set is pinned, so a suite run inside a real GitHub Actions job
  // reads none of that job's own values.
  const runnerEnv = (env) => ({
    HARNESS_INPUT_CHAIN: '',
    HARNESS_REMOTE_SLUG: '',
    HARNESS_JOB_STARTED_EPOCH: '',
    HARNESS_JOB_DEADLINE_EPOCH: '',
    RUNNER_ENVIRONMENT: '',
    REMOTE_SELF_PAUSE_AFTER_SECS: '',
    GITHUB_RUN_ID: '',
    GITHUB_REPOSITORY: REPOSITORY,
    GITHUB_SERVER_URL: 'https://github.com',
    GITHUB_STEP_SUMMARY: '',
    GH_TOKEN: '',
    HARNESS_PR_TOKEN: '',
    RUNNER_TEMP: runnerTemp,
    HARNESS_GH_CLI: ghStub,
    STUB_LOG: ghLog,
    STUB_RUN_LIST: '[]',
    HOME: join(w.dir, 'home'),
    XDG_CONFIG_HOME: join(w.dir, 'home', '.config'),
    XDG_STATE_HOME: xdgState,
    ...env,
  });
  const bounded = { timeoutMs: RUN_TIMEOUT_MS, signal: t.signal };
  const jobEnv = (env) =>
    runnerEnv({
      HARNESS_JOB_MODE: '1',
      REMOTE_CONTROL_POLL_SECS: '1',
      REMOTE_AUTO_RESUME_DELAY_SECS: '0',
      STATE: state,
      HARNESS_AGENT_CLI: stubPath,
      CLAR: w.clarDir,
      POLL_INTERVAL_SECS: '1',
      ...env,
    });
  let saved = 0;

  return {
    ...w,
    status: () => JSON.parse(readFileSync(remoteStatus, 'utf8')),
    setStub: (shellBody) => writeFile(bodyPath, `${shellBody}\n`, 'utf8'),
    /** Every recorded `gh` call, in order. */
    ghCalls: () =>
      existsSync(ghLog)
        ? readFileSync(ghLog, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map((line) => {
              const { args, body } = JSON.parse(line);
              return { args, body, line: args.join(' ') };
            })
        : [],
    /** One job: `autonomous-watcher.sh job <branch> task <resume>`. */
    job: (resume, env = {}) => runBash(w.dir, [watcher, 'job', w.branch, 'task', resume], jobEnv(env), bounded),
    /**
     * One job, killed with its whole group once it has written its start record and launched the
     * agent — a cancelled runner. Bounded by {@link KILL_WAIT_TENTHS}; the group is reaped either way.
     */
    async jobKilledAfterStart(resume, env = {}) {
      await rm(launched, { force: true });
      const child = spawn('bash', [watcher, 'job', w.branch, 'task', resume], {
        cwd: w.dir,
        env: { ...process.env, ...jobEnv(env) },
        detached: true,
        stdio: 'ignore',
      });
      const exited = new Promise((resolve) => child.once('exit', resolve));
      let seen = false;
      try {
        for (let i = 0; i < KILL_WAIT_TENTHS && !seen; i += 1) {
          await delay(100);
          seen = existsSync(remoteStatus) && existsSync(launched);
        }
      } finally {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
        await exited;
      }
      assert.ok(seen, 'the job never wrote its start record and launched the agent');
    },
    /** End the job: save its bundle, then leave the checkout as a fresh runner would find it. Returns the bundle. */
    async endJob() {
      saved += 1;
      const bundle = join(scratch, `bundle-${saved}`);
      const save = await runBash(w.dir, [remoteRun, 'save', w.branch, bundle], runnerEnv({}), bounded);
      assert.equal(save.status, 0, `save exited ${save.status}\n${save.stdout}\n${save.stderr}`);
      assert.ok(existsSync(join(bundle, 'status.json')), `bundle ${saved} carries no status.json\n${save.stderr}`);
      for (const path of [
        join(logs, 'registry.json'),
        w.clarDir,
        join(state, 'PAUSE_PROGRESS.md'),
        remoteStatus,
        join(state, 'PAUSE'),
        join(state, 'RESUME'),
        join(state, 'PAUSE_ACK'),
      ]) {
        await rm(path, { recursive: true, force: true });
      }
      return bundle;
    },
    /** Start the next job: place the bundle in `job` mode, and for an `answer` job write `answer_1.md`. */
    async startJob(bundle, answer = null) {
      const restore = await runBash(
        w.dir,
        ['-c', '. "$1" && hr_remote_bundle_restore "$2" "$3" "$4" job', '_', lib, bundle, w.dir, w.branch],
        runnerEnv({}),
        bounded,
      );
      assert.equal(restore.status, 0, `restore exited ${restore.status}\n${restore.stdout}\n${restore.stderr}`);
      if (answer !== null) await w.writeAnswer(1, answer);
    },
    deliver: (bundle) => runBash(w.dir, [remoteRun, 'deliver', w.branch, bundle], runnerEnv({}), bounded),
  };
}

/**
 * Plays job 1 (`none`, parks) and job 2 (`answer`, under `job2Env` and `job2Stub`, pauses as
 * `job2Expect` says — or, with `killJob2`, is killed once its session has started), then job 3
 * (`pause`, completes) and `deliver`, asserting the rule in the header after job 3 and after deliver.
 */
async function playSequence(t, { job2Env = () => ({}), job2Stub = HONOUR_PAUSE(100), job2Expect, killJob2 = false, job3Env = {} }) {
  const s = await createSequenceFixture(t);
  if (s === null) return;

  await mkdir(s.clarDir, { recursive: true });
  await s.setStub(`printf "## Q1\\n" > "$CLAR/question_1.md"`);
  const job1 = await s.job('none');
  assert.equal(job1.status, 0, `job 1: ${job1.stdout}\n${job1.stderr}`);
  assert.equal(s.status().status, 'parked', `job 1\n${job1.stdout}`);
  let bundle = await s.endJob();

  await s.startJob(bundle, 'a1\n');
  await s.setStub(job2Stub);
  if (killJob2) {
    await s.jobKilledAfterStart('answer', job2Env());
    await delay(500);
    assert.equal(s.status().status, 'running', 'job 2 was not killed mid-session');
  } else {
    const job2 = await s.job('answer', job2Env());
    assert.equal(job2.status, 0, `job 2: ${job2.stdout}\n${job2.stderr}`);
    assert.equal(lastLine(job2.stdout), `job: paused ${job2Expect.decision}`, s.watcherLog());
    assert.equal(s.status().pause_reason, job2Expect.reason);
  }
  bundle = await s.endJob();

  await s.startJob(bundle);
  // Before job 3 runs, so the stop case cannot pass on a bundle that is not a stopped one.
  if (killJob2) assert.equal(s.status().status, 'running', 'the restored status is not a stopped run');
  await s.setStub(':');
  const job3 = await s.job('pause', job3Env);
  assert.equal(job3.status, 0, `job 3: ${job3.stdout}\n${job3.stderr}`);
  // First, so the pre-fix outcome — job 3 re-parked on the pair it launched with — fails here by name.
  assert.equal(s.status().status, 'completed', `job 3\n${job3.stdout}\n${s.watcherLog()}`);
  assert.ok(existsSync(join(s.clarDir, 'answered', 'question_1.md')), 'question_1.md was not archived');
  assert.ok(existsSync(join(s.clarDir, 'answered', 'answer_1.md')), 'answer_1.md was not archived');
  assert.deepEqual(
    readdirSync(s.clarDir).filter((name) => /^question_.*\.md$/.test(name)),
    [],
    'a question file is still at the top level',
  );
  bundle = await s.endJob();

  const before = s.ghCalls().length;
  const delivered = await s.deliver(bundle);
  assert.equal(delivered.status, 0, `deliver: ${delivered.stdout}\n${delivered.stderr}`);
  const calls = s.ghCalls().slice(before);
  const creates = calls.filter((c) => c.args[0] === 'pr' && c.args[1] === 'create');
  assert.equal(creates.length, 1, calls.map((c) => c.line).join('\n'));
  assert.ok(creates[0].args.includes('--draft'), creates[0].line);
  const completed = calls.filter(
    (c) =>
      c.line.startsWith(`api --method POST repos/${REPOSITORY}/issues/${ISSUE}/comments `) &&
      (c.body ?? '').includes(`<!-- sdlc-harness event=completed branch=${s.branch} -->`),
  );
  assert.equal(completed.length, 1, calls.map((c) => c.line).join('\n'));
  assert.ok(completed[0].body.includes(PR_URL), completed[0].body);
}

test('user pause: park, answer, a harness pause run, then a pause resume completes and delivers', async (t) => {
  await playSequence(t, {
    job2Env: () => {
      const start = nowSecs() - 10;
      return { HARNESS_JOB_STARTED_EPOCH: String(start), STUB_RUN_LIST: pauseRunList('feat_x', start + 5) };
    },
    job2Expect: { decision: 'stop', reason: 'user' },
  });
});

test('budget pause: park, answer, a hosted self-pause, then a chained pause resume completes and delivers', async (t) => {
  await playSequence(t, {
    job2Env: () => ({ HARNESS_JOB_STARTED_EPOCH: String(nowSecs()), REMOTE_SELF_PAUSE_AFTER_SECS: '1' }),
    job2Expect: { decision: 'continue', reason: 'budget' },
    job3Env: { HARNESS_INPUT_CHAIN: '1' },
  });
});

test('usage pause: park, answer, a reset past the deadline, then the poller\'s pause resume completes and delivers', async (t) => {
  await playSequence(t, {
    job2Env: () => ({
      USAGE_CHECK_INTERVAL_SECS: '1',
      USAGE_RESUME_MARGIN_SECS: '0',
      HARNESS_JOB_DEADLINE_EPOCH: String(nowSecs() + 50),
    }),
    job2Stub: `${rateLimitRejected(100)}; ${HONOUR_PAUSE(100)}`,
    job2Expect: { decision: 'wait-poller', reason: 'usage' },
  });
});

test('stop, then resume: park, answer, a job killed mid-session, then a pause resume completes and delivers', async (t) => {
  await playSequence(t, { job2Stub: 'sleep 30', killJob2: true });
});
