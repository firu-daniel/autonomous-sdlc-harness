/**
 * The written watcher's `job` subcommand — one run, supervised inside a remote job's own checkout —
 * driven end to end against a fixture `init` wired, with the agent CLI and the notifier recorded.
 *
 * **The rule these tests exist to enforce: job mode launches nothing it was not told to, reports
 * every run it launched through `remote_status.json`, and carries across a job boundary only what
 * the bundle contract says it carries.** Every case points `XDG_STATE_HOME` at an empty directory
 * inside the fixture and passes `USAGE_LANE_STATE_ENABLED=1`, so a lane write that job mode failed
 * to force off would land there and be seen. The same directory holds the per-run profile off: a
 * job-mode render would land under it (`hr_run_profile_file`), so `assertLaneUntouched` asserts both.
 * `RUNNER_TEMP` is a fixture-owned sibling of the checkout: these cases run the script with no probe
 * override, so on a Linux host the job writes its placeholder manifest there, never in a CI runner's
 * own `$RUNNER_TEMP`, and never under the checkout, where the watcher refuses to write one.
 *
 * **Job mode launches only on a base profile its launch check passes:** a sandbox switched off with
 * no opt-out marker launches nothing and ends `failed`, and the opt-out shape `applySandbox` writes
 * launches. RED ONCE: the refusal case was confirmed red once with `run_profile_check`'s sandbox
 * clause skipped in a fixture copy of the watcher, never by editing the tracked template.
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
 * **A job reports a ledger phase change through `remote-run.sh report progress`, and an unchanged
 * ledger once at the first pass and once at the end:** the `progress:` cases assert the comment on
 * the stub's pull request, its opt-out, and the invocation count read off the watcher log.
 *
 * **A job ends `completed` only over a finished ledger. An unfinished one is auto-resumed under its
 * own name, bounded, then reported, unless the user asked for the pause, which outranks it.** The
 * `unfinished:` cases assert the decision, the prompt count, `pause_reason` and the notifications.
 * RED ONCE, each against the fixture's installed copy of the watcher or its library, never the
 * tracked template: `run_job`'s `unfinished)` arm removed -> the exhausted pause's notification
 * reads *paused itself on API overload*; `unfinished` left out of `hr_remote_status_write`'s
 * `pause_reason` vocabulary -> `pause_reason` written empty; `classify_run_exit`'s `unfinished`
 * write made unconditional, overwriting `user` -> the user-pause case shows `pause_reason`
 * `unfinished`.
 *
 * **A job commits each session's run analytics on its branch and pushes nothing for them:** the
 * workflow's `Push the branch` step does. The `run analytics:` case drives a job with the real
 * `run-analytics.sh` and a recording `push-branch.sh`, and asserts the two commits and no push call.
 *
 * **Every watcher this file starts is bounded and reaped, so a hang fails by name.** Each `runBash`
 * call carries `timeoutMs: WATCHER_RUN_TIMEOUT_MS` and `t.signal`. The value is scaled by
 * `HARNESS_TEST_TIME_SCALE` (`helpers/timing.mjs`) and sits below the per-test timeout
 * (`--test-timeout=1800000`) even at the scale's cap, because that expiry kills this file's process
 * and leaves the watcher's detached group running (`helpers/fixture.mjs` → choice 6); and far above
 * the longest honest run here, a few one-second poll intervals, so only a hang reaches it. The case
 * *"a job killed mid-run leaves running / continue"* spawns and kills its own group, and is not
 * bounded here.
 *
 * **`HARNESS_JOB_USAGE_REPEAT` repeats the case *"a reset 2 seconds ahead"* concurrently.** Unset is
 * 1 and runs the case once; a positive integer N runs N independent job fixtures at once and fails
 * naming the repetition; anything else fails the file's load naming the variable. At N > 1 each
 * repetition's reset is `REPEAT_RESET_AHEAD_SECS` ahead and its stub waits `REPEAT_PAUSE_WAIT_TENTHS`,
 * scaled by `HARNESS_TEST_TIME_SCALE`, for PAUSE: under that load a watcher's pass outlasts 2
 * seconds, the gate then reads an elapsed window and downgrades it (the watcher's usage-gate invariant 1), and the run completes unpaused on
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

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { SANDBOX_OPT_OUT_MARKER } from '../dist/generators/sandboxProfile.js';
import { INIT_SCRIPTS_DIR, runBash, runGit } from './helpers/fixture.mjs';
import { scaleBound } from './helpers/timing.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const PROMPT_DELIMITER = '----- end of prompt -----';

/** The bound on one watcher run — the header argues the value. */
const WATCHER_RUN_TIMEOUT_MS = scaleBound(120_000);

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

/**
 * The repeated case's reset lead and PAUSE wait — the header argues why they differ from one run's.
 * The lost-`usage_resume_at` and held-off-relaunch cases take them too, for the same reason.
 */
const REPEAT_RESET_AHEAD_SECS = 15;
const REPEAT_PAUSE_WAIT_TENTHS = scaleBound(600);

/** The stub's ceiling, in tenths of a second, for a PAUSE the case expects. */
const PAUSE_WAIT_TENTHS = scaleBound(100);

/** How many 100 ms polls the killed-job case makes for its job's start record and launch, before failing. */
const START_WAIT_POLLS = scaleBound(100);

function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * `gh`, recorded: every argument vector appended to `STUB_LOG`, `run list` and `run view` answered
 * from the environment, and any call starting with `STUB_FAIL_ON` failed with exit 4. With
 * `STUB_RUN_LIST_LATER` set, every `run list` after the first answers it instead of `STUB_RUN_LIST`,
 * counted in `<STUB_LOG>.run-list-count` — a listing that shows a run late. The content of any
 * `body=@<path>` is appended to `<STUB_LOG>.bodies`, one JSON string per line.
 */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync, existsSync, readFileSync, writeFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
const at = args.findIndex((arg) => arg.startsWith('body=@'));
if (at >= 0) {
  appendFileSync(process.env.STUB_LOG + '.bodies', JSON.stringify(readFileSync(args[at].slice('body=@'.length), 'utf8')) + '\\n');
}
const line = args.join(' ');
const failOn = process.env.STUB_FAIL_ON;
if (failOn && line.startsWith(failOn)) {
  process.stderr.write('stub failure\\n');
  process.exit(4);
}
if (line.startsWith('run list') && process.env.STUB_RUN_LIST_LATER !== undefined) {
  const counter = process.env.STUB_LOG + '.run-list-count';
  const n = existsSync(counter) ? Number(readFileSync(counter, 'utf8')) : 0;
  writeFileSync(counter, String(n + 1));
  process.stdout.write(n === 0 ? process.env.STUB_RUN_LIST || '[]' : process.env.STUB_RUN_LIST_LATER);
} else if (line.startsWith('run list')) process.stdout.write(process.env.STUB_RUN_LIST || '[]');
if (line.startsWith('run view')) process.stdout.write(process.env.STUB_RUN_VIEW || '{}');
if (line.startsWith('pr list') && process.env.STUB_PR_LIST !== undefined) process.stdout.write(process.env.STUB_PR_LIST);
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
 * argument vector, and a `job` driver. `runAnalytics` is passed to `createWatcherFixture`.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ runAnalytics?: boolean }} [options]
 */
async function createJobFixture(t, { runAnalytics = false } = {}) {
  const w = await createWatcherFixture(t, { runAnalytics });
  if (w === null) return null;

  const recorder = join(w.dir, 'job-test');
  const stubPath = join(recorder, 'agent-stub.sh');
  const bodyPath = join(recorder, 'agent-stub-body.sh');
  const argvPath = join(recorder, 'argv.txt');
  const promptsPath = join(recorder, 'prompts.txt');
  const xdgState = join(w.dir, 'xdg-state');
  const runnerTemp = `${w.dir}-runner-temp`;
  t.after(() => rm(runnerTemp, { recursive: true, force: true }));
  const remoteStatus = join(w.dir, STATE_DIR, 'autonomous_logs', 'remote_status.json');
  const watcher = join(w.dir, INIT_SCRIPTS_DIR, 'autonomous-watcher.sh');

  await mkdir(recorder, { recursive: true });
  await mkdir(xdgState, { recursive: true });
  await mkdir(runnerTemp, { recursive: true });
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
    RUNNER_TEMP: runnerTemp,
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
    ghBodies: () =>
      existsSync(`${ghLog}.bodies`)
        ? readFileSync(`${ghLog}.bodies`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
        : [],
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
    // The base profile, not a per-run copy: the machine lane is off in job mode, and the job's copy
    // is the main checkout with no other linked worktree, so a copy would equal the base.
    assert.equal(after('--settings'), join(j.dir, '.claude', 'settings.autonomous.json'));
    assert.ok(argv.includes('--permission-mode'), argv.join(' '));
    assert.equal(after('--permission-mode'), 'dontAsk', argv.join(' '));
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

test('launch check: a base profile with the sandbox off and no opt-out marker launches nothing and ends failed', async (t) => {
  /** The fixture's base profile, rewritten by <edit> on its parsed JSON. */
  const editProfile = async (j, edit) => {
    const profilePath = join(j.dir, '.claude', 'settings.autonomous.json');
    const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
    edit(profile);
    await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
    return profilePath;
  };

  await t.test('sandbox.enabled false, no marker: refused', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await editProfile(j, (profile) => {
      profile.sandbox.enabled = false;
      assert.ok(!(profile._README ?? []).some((line) => String(line).startsWith(SANDBOX_OPT_OUT_MARKER)));
    });
    const result = await j.job([j.branch, 'task', 'none']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(j.argv(), null, 'the stub was launched');
    assert.equal(j.status().status, 'failed');
    assert.ok(result.stdout.includes(`not launching '${j.branch}'`), result.stdout);
    j.assertLaneUntouched();
  });

  // The perturbation: the opt-out shape launches, so the refusal above is the check's, not the fixture's.
  await t.test("the opt-out shape applySandbox writes, with its marker: launched on the base profile", async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const profilePath = await editProfile(j, (profile) => {
      profile.sandbox.enabled = false;
      profile.sandbox.failIfUnavailable = false;
      profile._README = [...(profile._README ?? []), `${SANDBOX_OPT_OUT_MARKER}: fixture opt-out.`];
    });
    const result = await j.job([j.branch, 'task', 'none']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const argv = j.argv();
    assert.notEqual(argv, null, `the stub was not launched\n${result.stdout}`);
    assert.equal(argv[argv.indexOf('--settings') + 1], profilePath);
    assert.equal(j.status().status, 'completed');
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
  assert.match(loop[0].detail, /resume answer, park_loop_clear true/);
  j.assertLaneUntouched();
});

test('a pause resume launched with an answered pair at the top level ends completed and archives the pair', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  await j.writeQuestion(1, '## Q1\n');
  await j.writeAnswer(1, 'a1\n');
  const result = await j.job([j.branch, 'task', 'pause']);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(j.status().status, 'completed');
  assert.ok(existsSync(join(j.clarDir, 'answered', 'question_1.md')), 'question_1.md was not archived');
  assert.ok(existsSync(join(j.clarDir, 'answered', 'answer_1.md')), 'answer_1.md was not archived');
  assert.deepEqual(
    readdirSync(j.clarDir).filter((name) => /^question_.*\.md$/.test(name)),
    [],
    'a question file is still at the top level',
  );
  j.assertLaneUntouched();
});

test('pause note: kept only for a pause resume of a paused job of the same engine', async (t) => {
  const NOTE = '# Pause note\n\nstopped mid Phase B\n';
  const STOP_KILL = /RESUME after the previous job was stopped or ended without pausing: there is no pause note/;
  const PARK_RESUME = /This is a RESUME: every question file of this park has been answered/;

  const fixture = async (t, { restored, note }) => {
    const j = await createJobFixture(t);
    if (j === null) return null;
    if (restored) await j.restoreStatus(restored);
    if (note) await writeFile(join(j.dir, STATE_DIR, 'PAUSE_PROGRESS.md'), NOTE, 'utf8');
    const notePath = join(j.dir, STATE_DIR, 'PAUSE_PROGRESS.md');
    const supersededDir = join(j.dir, STATE_DIR, 'autonomous_logs', 'remote_superseded');
    const superseded = () =>
      existsSync(supersededDir)
        ? readdirSync(supersededDir, { recursive: true }).filter((p) => p.endsWith('PAUSE_PROGRESS.md'))
        : [];
    const assertMovedAside = (label) => {
      assert.equal(existsSync(notePath), false, `${label}: the top-level note is still there`);
      const moved = superseded();
      assert.equal(moved.length, 1, `${label}: ${JSON.stringify(moved)}`);
      assert.equal(readFileSync(join(supersededDir, moved[0]), 'utf8'), NOTE, `${label}: the moved note changed`);
    };
    return { j, notePath, supersededDir, superseded, assertMovedAside };
  };

  await t.test('restored running + a note, resume pause: stop/kill clause, note moved aside', async (t) => {
    const f = await fixture(t, { restored: { status: 'running' }, note: true });
    if (f === null) return;
    const result = await f.j.job([f.j.branch, 'task', 'pause']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const prompt = f.j.prompts().at(-1);
    assert.match(prompt, STOP_KILL);
    assert.doesNotMatch(prompt, /PAUSE_PROGRESS\.md/);
    f.assertMovedAside('running');
  });

  await t.test('restored paused, same engine + a note, resume pause: the note is named and kept byte-identical', async (t) => {
    const f = await fixture(t, { restored: { status: 'paused', engine: 'task' }, note: true });
    if (f === null) return;
    const result = await f.j.job([f.j.branch, 'task', 'pause']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const prompt = f.j.prompts().at(-1);
    assert.match(prompt, /RESUME from a PAUSE: read sdlc-harness\/PAUSE_PROGRESS\.md/);
    assert.doesNotMatch(prompt, STOP_KILL);
    assert.equal(readFileSync(f.notePath, 'utf8'), NOTE);
    assert.deepEqual(f.superseded(), []);
  });

  await t.test('restored paused by engine task, job engine user_review: stop/kill clause, note moved aside', async (t) => {
    const f = await fixture(t, { restored: { status: 'paused', engine: 'task' }, note: true });
    if (f === null) return;
    const result = await f.j.job([f.j.branch, 'user_review', 'pause']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const prompt = f.j.prompts().at(-1);
    assert.match(prompt, STOP_KILL);
    assert.doesNotMatch(prompt, /PAUSE_PROGRESS\.md/);
    f.assertMovedAside('engine mismatch');
  });

  await t.test('resume none with a carried note: moved aside, the fresh prompt unchanged', async (t) => {
    const f = await fixture(t, { restored: null, note: false });
    if (f === null) return;
    const baseline = await f.j.job([f.j.branch, 'task', 'none']);
    assert.equal(baseline.status, 0, `${baseline.stdout}\n${baseline.stderr}`);
    const fresh = f.j.prompts().at(-1);

    await writeFile(f.notePath, NOTE, 'utf8');
    const result = await f.j.job([f.j.branch, 'task', 'none']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(f.j.prompts().at(-1), fresh);
    f.assertMovedAside('none');
  });

  await t.test('resume answer, restored parked, same engine + a note: moved aside, park-resume clause only', async (t) => {
    const f = await fixture(t, { restored: { status: 'parked', engine: 'task' }, note: true });
    if (f === null) return;
    await f.j.writeQuestion(1, '## Q1\n');
    await f.j.writeAnswer(1, 'a1\n');
    const result = await f.j.job([f.j.branch, 'task', 'answer']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const prompt = f.j.prompts().at(-1);
    assert.match(prompt, PARK_RESUME);
    assert.doesNotMatch(prompt, /PAUSE_PROGRESS\.md/);
    assert.doesNotMatch(prompt, STOP_KILL);
    f.assertMovedAside('answer');
    assert.equal(f.j.record().pause_note_stale ?? '', '');
  });

  await t.test('restored running, no note, resume pause: stop/kill clause, nothing moved, no aside logged', async (t) => {
    const f = await fixture(t, { restored: { status: 'running' }, note: false });
    if (f === null) return;
    const result = await f.j.job([f.j.branch, 'task', 'pause']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const prompt = f.j.prompts().at(-1);
    assert.match(prompt, STOP_KILL);
    assert.doesNotMatch(prompt, /PAUSE_PROGRESS\.md/);
    assert.equal(existsSync(f.supersededDir), false, 'something was moved under remote_superseded/');
    assert.doesNotMatch(f.j.watcherLog(), /moved aside|remote_superseded/);
  });
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
    env: { ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: '', ...j.jobEnv({}) },
    detached: true,
    stdio: 'ignore',
  });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  try {
    let seen = false;
    for (let i = 0; i < START_WAIT_POLLS && !seen; i += 1) {
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
  await j.setStub(HONOUR_PAUSE(PAUSE_WAIT_TENTHS));
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

test('control poll: a pause the listing shows only after a poll that missed it is still seen', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  const start = nowSecs() - 10;
  await j.setStub(HONOUR_PAUSE(PAUSE_WAIT_TENTHS));
  const result = await j.job([j.branch, 'task', 'none'], {
    HARNESS_JOB_STARTED_EPOCH: String(start),
    STUB_RUN_LIST: '[]',
    STUB_RUN_LIST_LATER: pauseRunList(start + 5),
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(lastLine(result.stdout), 'job: paused stop');
  assert.equal(j.status().pause_reason, 'user');
  assert.ok(j.ghCalls().filter((c) => c.startsWith('run list')).length >= 2, j.ghCalls().join('\n'));
  assert.match(result.stdout, /job: control poll of 'feat_x' since \d+ \(exit 5\): remote-run\.sh: no 'harness pause feat_x' run/);
  assert.match(result.stdout, /job: control poll of 'feat_x' since \d+ \(exit 0\): remote-run\.sh: a 'harness pause feat_x' run/);
});

test('control poll: a usage refusal is a failed poll', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  const scripts = join(j.dir, INIT_SCRIPTS_DIR);
  await writeFile(join(scripts, 'remote-run-real.sh'), readFileSync(join(scripts, 'remote-run.sh')), { mode: 0o755 });
  await writeFile(
    join(scripts, 'remote-run.sh'),
    '#!/usr/bin/env bash\n[ "$1" = pause-requested ] && exit 1\nexec bash "$(dirname "$0")/remote-run-real.sh" "$@"\n',
    { mode: 0o755 },
  );
  const start = nowSecs() - 10;
  await j.setStub(HONOUR_PAUSE(30));
  const result = await j.job([j.branch, 'task', 'none'], {
    HARNESS_JOB_STARTED_EPOCH: String(start),
    STUB_RUN_LIST: pauseRunList(start + 5),
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(lastLine(result.stdout), 'job: completed stop');
  assert.equal(j.status().pause_reason, '');
  assert.match(j.watcherLog(), /the control poll for 'feat_x' failed \(exit 1\)/);
  assert.equal(j.status().control_polled_at, String(start));
});

test('control poll: the lower bound is never the job start alone', async (t) => {
  await t.test('chain 0: a pause sent while the job queued, after its own run createdAt', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const start = nowSecs();
    await j.setStub(HONOUR_PAUSE(PAUSE_WAIT_TENTHS));
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
    assert.equal(j.ghCalls().filter((c) => c === 'run view 77 --json createdAt').length, 1, j.ghCalls().join('\n'));
  });

  await t.test('chain 1: a pause sent across a chained continuation, after the restored bound', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const start = nowSecs();
    await j.restoreStatus({ control_polled_at: String(start - 20), pause_reason: 'budget' });
    await j.setStub(HONOUR_PAUSE(PAUSE_WAIT_TENTHS));
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
    assert.equal(j.status().control_polled_at, String(start - 5));
  });
});

test('budget: a hosted self-pause continues, silently', async (t) => {
  const j = await createJobFixture(t);
  if (j === null) return;

  await t.test('REMOTE_SELF_PAUSE_AFTER_SECS=1 -> paused / budget / continue, no paused notification', async () => {
    await j.setStub(HONOUR_PAUSE(PAUSE_WAIT_TENTHS));
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
    await j.setStub(`${COUNT_LAUNCH}\nif [ "$n" = 1 ]; then ${FAIL_AFTER_PAUSE(PAUSE_WAIT_TENTHS)}; fi\n${HONOUR_PAUSE(PAUSE_WAIT_TENTHS)}`);
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
      await runOnce('', 2, PAUSE_WAIT_TENTHS);
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
    await j.setStub(`${rateLimitRejected(100)}; ${HONOUR_PAUSE(PAUSE_WAIT_TENTHS)}`);
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
    const lib = join(j.dir, INIT_SCRIPTS_DIR, 'lib', 'harness-run-lib.sh');
    // The exact stranded record: tagged `usage`, PAUSE and PAUSE_ACK present, no reset time.
    const loseResumeAt =
      `. ${shellQuote(lib)}; ` +
      `hr_registry_set "$STATE/autonomous_logs/registry.json" feat_x usage_resume_at ""`;
    // This case asserts the repair, not the in-job wait's timing, so it takes the repeated case's
    // lead and wait: a 2-second lead lets a loaded gate downgrade the event and never pause (the
    // header's `HARNESS_JOB_USAGE_REPEAT` paragraph).
    await j.setStub(
      `${rateLimitRejected(REPEAT_RESET_AHEAD_SECS)}; for i in $(seq 1 ${REPEAT_PAUSE_WAIT_TENTHS}); do if [ -f "$STATE/PAUSE" ]; then ${loseResumeAt}; : > "$STATE/PAUSE_ACK"; exit 0; fi; sleep 0.1; done`,
    );
    const before = nowSecs();
    const result = await j.job([j.branch, 'task', 'none'], {
      USAGE_CHECK_INTERVAL_SECS: '1',
      USAGE_RESUME_MARGIN_SECS: '0',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused wait-poller');
    assert.equal(j.status().pause_reason, 'usage');
    assert.match(j.status().usage_resume_at, /^\d+$/);
    const resumeAt = Number(j.status().usage_resume_at);
    assert.ok(
      resumeAt >= before + 3600 && resumeAt <= nowSecs() + 3600,
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
    // This case asserts the post-reset bound, not the in-job wait's timing, so it takes the
    // repeated case's lead and wait: a 2-second lead lets a loaded gate downgrade the event and
    // never pause (the header's `HARNESS_JOB_USAGE_REPEAT` paragraph). That lead exceeds
    // REMOTE_WAIT_MAX_SECS, so the runner is self-hosted to bypass the hosted lead admission,
    // which other cases cover; the bound applies self-hosted included.
    await j.setStub(
      `${rateLimitRejected(REPEAT_RESET_AHEAD_SECS)}; for i in $(seq 1 ${REPEAT_PAUSE_WAIT_TENTHS}); do if [ -f "$STATE/PAUSE" ]; then : > "$STATE/AUTONOMOUS_STOP"; : > "$STATE/PAUSE_ACK"; exit 0; fi; sleep 0.1; done`,
    );
    const result = await j.job([j.branch, 'task', 'none'], {
      USAGE_RESUME_MARGIN_SECS: '0',
      REMOTE_WAIT_MAX_SECS: '2',
      USAGE_CHECK_INTERVAL_SECS: '1',
      RUNNER_ENVIRONMENT: 'self-hosted',
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

const TASK_LEDGER_IDS = ['P1', 'P2', 'P3', 'A', 'A1.5g', 'A1.5f', 'A2g', 'A2f', 'Bg', 'Bm', 'C', 'C2g', 'C2m', 'C2f', 'E', 'G', 'D'];

/** A task-engine ledger in the template's shape: every id in `done` is `[x]`, every other `[ ]`. */
function taskLedger(branch, done = []) {
  const lines = [`# Flow progress — ${branch}   (engine: task)`, '', '## Run mode', '- skipped: none', ''];
  for (const id of TASK_LEDGER_IDS) lines.push(`- [${done.includes(id) ? 'x' : ' '}] ${`${id}.`.padEnd(8)} label for ${id}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Write the ledger stages under the recorder and a stub body that copies each into the checkout's
 * ledger, holding it `holdSecs` so at least one poll reads it, then exits 0.
 */
async function ledgerTicks(j, stages, holdSecs) {
  const ledgerPath = join(j.dir, STATE_DIR, 'flow_progress', `${j.branch}_progress.md`);
  const steps = [`mkdir -p ${shellQuote(join(j.dir, STATE_DIR, 'flow_progress'))}`];
  for (const [i, done] of stages.entries()) {
    const stage = join(j.dir, 'job-test', `ledger-${i}.md`);
    await writeFile(stage, taskLedger(j.branch, done), 'utf8');
    steps.push(`cp ${shellQuote(stage)} ${shellQuote(ledgerPath)}`, `sleep ${holdSecs}`);
  }
  await j.setStub(steps.join('\n'));
}

const PR_12 = JSON.stringify([{ number: 12, isCrossRepository: false }]);
const progressBodies = (j) => j.ghBodies().filter((b) => b.includes('event=progress'));

// Each `progress:` case exits 0 over an unfinished ledger, so it ends an `unfinished` pause; MAX 0 keeps it to one session.
test('progress: a job reports a ledger phase change on its pull request', async (t) => {
  await t.test('ticks P1 to P3 -> a progress POST on #12, the last write carrying Planning: done', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await wireForge(j, 'github');
    await ledgerTicks(j, [[], ['P1'], ['P1', 'P2'], ['P1', 'P2', 'P3']], 1.5);
    const result = await j.job([j.branch, 'task', 'none'], {
      GITHUB_REPOSITORY: FORGE_REPOSITORY,
      STUB_PR_LIST: PR_12,
      REMOTE_AUTO_RESUME_MAX: '0',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused stop');

    const calls = j.ghCalls();
    const post = `api --method POST repos/${FORGE_REPOSITORY}/issues/12/comments `;
    assert.ok(calls.some((c) => c.startsWith(post)), calls.join('\n'));
    const bodies = progressBodies(j);
    assert.ok(bodies.length >= 1, j.ghBodies().join('\n---\n'));
    assert.match(bodies.at(-1), /^- Planning: done$/m, bodies.at(-1));
    assert.match(bodies.at(-1), /^- Implementation: in progress$/m, bodies.at(-1));
  });

  await t.test('execution.progressComments false -> no progress write', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await wireForge(j, 'github');
    const configPath = join(j.dir, 'harness.config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.execution = { ...config.execution, progressComments: false };
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    await ledgerTicks(j, [[], ['P1'], ['P1', 'P2'], ['P1', 'P2', 'P3']], 1.5);
    const result = await j.job([j.branch, 'task', 'none'], {
      GITHUB_REPOSITORY: FORGE_REPOSITORY,
      STUB_PR_LIST: PR_12,
      REMOTE_AUTO_RESUME_MAX: '0',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused stop');
    assert.deepEqual(progressBodies(j), [], j.ghBodies().join('\n---\n'));
    assert.equal(j.ghCalls().some((c) => c.startsWith('api --method PATCH')), false, j.ghCalls().join('\n'));
    assert.match(j.watcherLog(), /progress comments are off by execution\.progressComments/);
  });

  await t.test('a ledger unchanged after the first pass -> one report progress, then the final one', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await ledgerTicks(j, [['P1']], 4);
    const result = await j.job([j.branch, 'task', 'none'], { REMOTE_AUTO_RESUME_MAX: '0' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused stop');
    // forge is unset, so each `report progress` writes exactly this one line into the watcher log.
    const reports = j.watcherLog().match(/^remote-run\.sh: report: the forge coupling is off.*$/gm) ?? [];
    assert.equal(reports.length, 2, j.watcherLog());
  });
});

/** Stage <ledger> under the recorder and return the shell line copying it into the checkout's ledger. */
async function stageLedger(j, ledger) {
  const dir = join(j.dir, STATE_DIR, 'flow_progress');
  const stage = join(j.dir, 'job-test', 'ledger-final.md');
  await writeFile(stage, ledger, 'utf8');
  return `mkdir -p ${shellQuote(dir)}; cp ${shellQuote(stage)} ${shellQuote(join(dir, `${j.branch}_progress.md`))}`;
}

test('unfinished: a zero exit over an unfinished ledger is resumed, bounded, then reported', async (t) => {
  await t.test('an unfinished ledger every session -> one auto-resume, then paused / unfinished / stop', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await j.setStub(await stageLedger(j, taskLedger(j.branch, [])));
    const result = await j.job([j.branch, 'task', 'none'], {
      REMOTE_AUTO_RESUME_DELAY_SECS: '0',
      REMOTE_AUTO_RESUME_MAX: '1',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused stop');
    assert.equal(j.prompts().length, 2);
    assert.match(j.prompts()[1], /RESUME from a PAUSE/);
    assert.equal(j.status().status, 'paused');
    assert.equal(j.status().pause_reason, 'unfinished');
    assert.equal(j.status().decision, 'stop');
    const notes = j.notifications();
    const paused = notes.filter((n) => n.event === 'paused');
    assert.equal(paused.length, 1, JSON.stringify(notes));
    assert.match(paused[0].detail, /\/autonomous-sdlc-harness:branch-resume feat_x/);
    assert.equal(notes.some((n) => n.event === 'completed'), false, JSON.stringify(notes));
    assert.equal(notes.some((n) => /API overload/.test(n.detail ?? '')), false, JSON.stringify(notes));
  });

  await t.test('every task id ticked, E skipped -> completed / stop', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const ledger = taskLedger(j.branch, TASK_LEDGER_IDS).replace(/^- \[x\] E\. /m, '- [-] E. ');
    assert.match(ledger, /^- \[-\] E\. /m);
    await j.setStub(await stageLedger(j, ledger));
    const result = await j.job([j.branch, 'task', 'none']);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: completed stop');
    assert.equal(j.notifications().filter((n) => n.event === 'completed').length, 1);
  });

  await t.test("a user's pause survives an unfinished exit -> paused / user / stop, no auto-resume", async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const start = nowSecs() - 10;
    const copy = await stageLedger(j, taskLedger(j.branch, []));
    await j.setStub(
      `for i in $(seq 1 ${PAUSE_WAIT_TENTHS}); do if [ -f "$STATE/PAUSE" ]; then break; fi; sleep 0.1; done\n${copy}\nexit 0`,
    );
    const result = await j.job([j.branch, 'task', 'none'], {
      HARNESS_JOB_STARTED_EPOCH: String(start),
      STUB_RUN_LIST: pauseRunList(start + 5),
      REMOTE_AUTO_RESUME_DELAY_SECS: '0',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(lastLine(result.stdout), 'job: paused stop');
    assert.equal(j.status().pause_reason, 'user');
    assert.equal(j.status().decision, 'stop');
    assert.equal(j.prompts().length, 1);
    const notes = j.notifications();
    const paused = notes.filter((n) => n.event === 'paused');
    assert.equal(paused.length, 1, JSON.stringify(notes));
    assert.match(paused[0].detail, /\/autonomous-sdlc-harness:branch-resume feat_x/);
    assert.equal(notes.some((n) => n.event === 'completed'), false, JSON.stringify(notes));
    assert.match(j.watcherLog(), /paused \(unfinished\)/);
  });
});

test('runner wait: logged from the run createdAt, and noted on a resumed comment only when long', async (t) => {
  for (const [name, waitSecs, expectNote] of [
    ['a long wait on a user resume', 600, true],
    ['a short wait', 30, false],
  ]) {
    await t.test(name, async (t) => {
      const j = await createJobFixture(t);
      if (j === null) return;
      await wireForge(j, 'github');
      await j.restoreStatus({ pause_reason: 'user' });
      const start = nowSecs();
      const result = await j.job([j.branch, 'task', 'pause'], {
        HARNESS_INPUT_CHAIN: '0',
        HARNESS_JOB_STARTED_EPOCH: String(start),
        GITHUB_RUN_ID: '77',
        GITHUB_RUN_ATTEMPT: '1',
        GITHUB_REPOSITORY: FORGE_REPOSITORY,
        STUB_RUN_VIEW: JSON.stringify({ createdAt: iso(start - waitSecs) }),
      });
      assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
      assert.match(result.stdout, new RegExp(`job: waited ${waitSecs}s for a runner \\(run created ${start - waitSecs}, job started ${start}\\)`));
      assert.equal(j.ghCalls().filter((c) => c === 'run view 77 --json createdAt').length, 1, j.ghCalls().join('\n'));
      const resumed = j.ghBodies().filter((b) => b.includes('resumed.'));
      assert.equal(resumed.length, 1, j.ghBodies().join('\n---\n'));
      assert.equal(resumed[0].includes('GitHub took 10 minutes to start this job'), expectNote, resumed[0]);
      assert.equal(resumed[0].includes('GitHub took'), expectNote, resumed[0]);
    });
  }

  await t.test('a re-run attempt: the wait is not measured and not noted', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await wireForge(j, 'github');
    await j.restoreStatus({ pause_reason: 'user' });
    const start = nowSecs();
    const result = await j.job([j.branch, 'task', 'pause'], {
      HARNESS_INPUT_CHAIN: '0',
      HARNESS_JOB_STARTED_EPOCH: String(start),
      GITHUB_RUN_ID: '77',
      GITHUB_RUN_ATTEMPT: '2',
      GITHUB_REPOSITORY: FORGE_REPOSITORY,
      STUB_RUN_VIEW: JSON.stringify({ createdAt: iso(start - 18720) }),
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /job: run attempt 2 — this run's createdAt is its first attempt's, so the runner wait is not measured/);
    assert.doesNotMatch(result.stdout, /job: waited \d+s for a runner/);
    const resumed = j.ghBodies().filter((b) => b.includes('resumed.'));
    assert.equal(resumed.length, 1, j.ghBodies().join('\n---\n'));
    assert.equal(resumed[0].includes('GitHub took'), false, resumed[0]);
  });

  await t.test('a long wait, then an automatic resume: its resumed comment carries no note', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await wireForge(j, 'github');
    await j.setStub(`${COUNT_LAUNCH}\nif [ "$n" = 1 ]; then : > "$STATE/PAUSE_ACK"; exit 0; fi`);
    const start = nowSecs();
    const result = await j.job([j.branch, 'task', 'none'], {
      HARNESS_JOB_STARTED_EPOCH: String(start),
      REMOTE_AUTO_RESUME_DELAY_SECS: '0',
      GITHUB_RUN_ID: '77',
      GITHUB_RUN_ATTEMPT: '1',
      GITHUB_REPOSITORY: FORGE_REPOSITORY,
      STUB_RUN_VIEW: JSON.stringify({ createdAt: iso(start - 600) }),
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /job: waited 600s for a runner/);
    const resumed = j.ghBodies().filter((b) => b.includes('resumed.'));
    assert.equal(resumed.length, 1, j.ghBodies().join('\n---\n'));
    assert.equal(resumed[0].includes('GitHub took'), false, resumed[0]);
  });

  await t.test('no GITHUB_RUN_ID: the wait is unknown', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    const result = await j.job([j.branch, 'task', 'none'], { HARNESS_JOB_STARTED_EPOCH: String(nowSecs()), GITHUB_RUN_ATTEMPT: '1' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /job: this run's createdAt could not be read — the runner wait is unknown/);
    assert.equal(j.ghCalls().some((c) => c.startsWith('run view')), false, j.ghCalls().join('\n'));
  });
});

test("run analytics: a job commits the session's record on its branch and leaves the push to the workflow", async (t) => {
  const j = await createJobFixture(t, { runAnalytics: true });
  if (j === null) return;

  // The job's copy is the main checkout, so it needs the run's branch with a commit for
  // `hr_commit_placed` to commit on; the fixture's own directories stay out of that commit.
  await writeFile(join(j.dir, '.git', 'info', 'exclude'), '/job-test/\n/xdg-state/\n/home/\n/watcher-test/\n', {
    flag: 'a',
  });
  const identity = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];
  await runGit(j.dir, ['checkout', '--quiet', '-b', j.branch]);
  await runGit(j.dir, ['add', '-A']);
  await runGit(j.dir, [...identity, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);

  const pushCalls = join(j.dir, 'job-test', 'push-calls.txt');
  const pushScript = join(j.dir, INIT_SCRIPTS_DIR, 'push-branch.sh');
  await writeFile(pushScript, `#!/usr/bin/env bash\nprintf '%s\\n' "$1" >> ${shellQuote(pushCalls)}\nexit 0\n`, 'utf8');
  await chmod(pushScript, 0o755);

  const session = [
    { type: 'system', subtype: 'init', session_id: 'sess-job' },
    { type: 'user', timestamp: '2026-01-01T00:00:00.000Z', message: { role: 'user', content: 'Go.' } },
    { type: 'assistant', timestamp: '2026-01-01T00:00:01.000Z', message: { id: 'sess-job-m1', content: [] } },
    { type: 'result', subtype: 'success', timestamp: '2026-01-01T00:00:02.000Z', duration_ms: 2000 },
  ];
  await j.setStub(session.map((line) => `printf '%s\\n' ${shellQuote(JSON.stringify(line))}`).join('\n'));

  const result = await j.job([j.branch, 'task', 'none'], {
    RUN_ANALYTICS_SUSPEND_SOURCE: 'none',
    CLAUDE_CONFIG_DIR: join(j.dir, 'home', 'no-claude-config'),
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(lastLine(result.stdout), 'job: completed stop');

  const subject = `chore: Record run analytics for ${j.branch}`;
  const subjects = (await runGit(j.dir, ['log', '--format=%s', `refs/heads/${j.branch}`])).stdout.split('\n');
  assert.equal(subjects.filter((line) => line === subject).length, 2, `${subjects.join('\n')}\n${j.watcherLog()}`);
  assert.equal(existsSync(pushCalls), false, `push-branch.sh was called in job mode:\n${j.watcherLog()}`);
  assert.doesNotMatch(j.watcherLog(), /after the run-analytics commit/);
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
