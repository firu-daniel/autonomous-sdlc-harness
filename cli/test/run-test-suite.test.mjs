/**
 * `run-test-suite.sh` — the Run gates phase's test-suite runner, driven against a repository the
 * test builds and throws away.
 *
 * **The rule these tests exist to enforce: the wrapper hands the orchestrator one line and nothing
 * else, runs `commands.typecheck` and then `commands.test` exactly once each per invocation, decides
 * one verdict for the pair, never runs while a run of the same label is live, and versions its log
 * per round. A run's liveness is its heartbeat, the mtime of `.running`, never a signal to its PID.**
 * Every case seeds `commands.test` with a stub that counts its own runs, so "exactly once" is an
 * assertion on a counter file; the stub's own output must reach the log and neither stream. The
 * two-gate cases wire `commands.typecheck` to a second counting stub; a `<none>` one is asserted as
 * not run — a marker line and no counter — never as a pass: a failing test still fails the round.
 * A signal to the run form's process group stops the gate too; a trapped signal to its PID alone
 * leaves the label live until the gate returns, then removes `.running` and writes no verdict.
 *
 * Not covered here: the Run gates phase's own sequencing (instruction prose, Task 23's walk); the
 * sandbox itself (`docs/sandbox-verification.md` rows WF2–WF5); a `SIGKILL` to the run form's PID
 * alone, whose orphaned gate is today's behaviour; and the second `stat` spelling — the wrapper reads
 * the mtime through `hr_lane_mtime`, where only one of BSD `stat -f %m` and GNU `stat -c %Y` yields.
 * These run the **compiled** `dist/cli.js`, whose `init` writes the wrapper: `npm run build` first.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit, snapshotTree } from './helpers/fixture.mjs';

const STATE_DIR = 'sdlc-harness';
/** Stays `scripts` on purpose: `seededConfig()` omits `scriptsDir`, so `init` writes there, the absent key's value. */
const WRAPPER = 'scripts/run-test-suite.sh';

/** The branch every fixture is put on; its `/` is what the log directory's sanitizing turns to `-`. */
const BRANCH = 'feat/run-gates';
const LOG_DIR = `${STATE_DIR}/test_run_logs/feat-run-gates`;
const LOGS_ROOT = `${STATE_DIR}/test_run_logs`;

/** What `init` itself writes into the log tree — its contract file — and so what a refusal must leave it holding. */
const LOGS_ROOT_AS_INITIALISED = Object.freeze(['README.md']);

const COUNTER = 'stub-counter.txt';
const PWD_RECORD = 'stub-pwd.txt';
const STDOUT_MARKER = 'STUB-STDOUT-MARKER';
const STDERR_MARKER = 'STUB-STDERR-MARKER';

/**
 * The stub `commands.test` runs. Its exit status, a tag appended to both markers, and an optional
 * release file it blocks on come from the environment, which the wrapper's `eval` passes through.
 * Its paths are relative, so it only finds them when it runs from the repository root.
 */
const STUB = [
  '#!/usr/bin/env bash',
  `printf 'ran\\n' >> ${COUNTER}`,
  `pwd > ${PWD_RECORD}; printf '%s\\n' "$$" > stub-pid.txt`,
  `echo "${STDOUT_MARKER} \${STUB_TAG-}"`,
  `echo "${STDERR_MARKER} \${STUB_TAG-}" >&2`,
  'if [ -n "${STUB_RELEASE-}" ]; then',
  '  while [ ! -e "$STUB_RELEASE" ]; do sleep 0.1; done',
  'fi',
  'exit "${STUB_EXIT:-0}"',
  '',
].join('\n');

const TC_COUNTER = 'typecheck-stub-counter.txt';
const TC_STDOUT_MARKER = 'TC-STUB-STDOUT-MARKER';
const TC_STDERR_MARKER = 'TC-STUB-STDERR-MARKER';
const TC_STUB_COMMAND = 'bash typecheck-stub.sh';

/** The stub the two-gate cases wire as `commands.typecheck`; its exit status comes from `TC_STUB_EXIT`. */
const TC_STUB = [
  '#!/usr/bin/env bash',
  `printf 'ran\\n' >> ${TC_COUNTER}`,
  `echo "${TC_STDOUT_MARKER}"`,
  `echo "${TC_STDERR_MARKER}" >&2`,
  'exit "${TC_STUB_EXIT:-0}"',
  '',
].join('\n');

/** The wrapper's per-gate log marker lines, byte-exact. */
const GATE_MARKER = Object.freeze({
  typecheckHeader: '== run-test-suite.sh: gate typecheck (commands.typecheck) ==',
  typecheckExited: (status) => `== run-test-suite.sh: gate typecheck exited ${status} ==`,
  typecheckNotRun: '== run-test-suite.sh: gate typecheck not run: commands.typecheck is <none> ==',
  testHeader: '== run-test-suite.sh: gate test (commands.test) ==',
  testExited: (status) => `== run-test-suite.sh: gate test exited ${status} ==`,
});

/** How many times a case re-checks for a state the wrapper is expected to reach, before failing. */
const POLL_LIMIT = 600;

function seededConfig({ typecheck = 'echo typecheck' } = {}) {
  return {
    version: 1,
    defaultBranch: 'main',
    stateDir: STATE_DIR,
    layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
    commands: { typecheck, test: 'bash stub.sh' },
  };
}

/** A fixture on {@link BRANCH} with the stub wired as `commands.test` and `init` already run. */
async function wiredFixture(t, { typecheck } = {}) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0' },
      'harness.config.json': seededConfig({ typecheck }),
      'stub.sh': STUB,
      'typecheck-stub.sh': TC_STUB,
    },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;

  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  await runGit(dir, ['checkout', '--quiet', '-b', BRANCH]);
  return dir;
}

function wrapper(dir, args, env = {}, cwd = dir) {
  return runBash(cwd, [join(dir, WRAPPER), ...args], env);
}

function text(dir, relativePath) {
  return readFileSync(join(dir, relativePath), 'utf8');
}

function counterLines(dir, counter = COUNTER) {
  return existsSync(join(dir, counter)) ? text(dir, counter).split('\n').filter((line) => line !== '') : [];
}

function logFiles(dir) {
  return existsSync(join(dir, LOG_DIR)) ? readdirSync(join(dir, LOG_DIR)).filter((name) => name.endsWith('.log')).sort() : [];
}

async function pollUntil(predicate, what) {
  for (let i = 0; i < POLL_LIMIT; i += 1) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail(`never observed: ${what}`);
}

/** A PID that belonged to a process which has already exited. */
function deadPid() {
  const { pid, status } = spawnSync('true');
  assert.equal(status, 0);
  return pid;
}

const STALE_ENV = 'RUN_TEST_SUITE_STALE';
const RUNNING = `${LOG_DIR}/task_round_1.running`;
const VERDICT = `${LOG_DIR}/task_round_1.verdict`;
const LOG = `${LOG_DIR}/task_round_1.log`;
const REFUSAL = 'run-test-suite.sh: no run in flight for task_round_1\n';

/** Plants `task_round_1.running` holding `pid`, its mtime — the heartbeat — `ageSeconds` in the past. */
function plantRunning(dir, { pid, ageSeconds }) {
  mkdirSync(join(dir, LOG_DIR), { recursive: true });
  const path = join(dir, RUNNING);
  writeFileSync(path, `${pid}\n`);
  const at = Date.now() / 1000 - ageSeconds;
  utimesSync(path, at, at);
}

function pidOf(dir) {
  return Number(text(dir, RUNNING).trim());
}

/** The same literal the `STUB`'s `pwd > ${PWD_RECORD}; printf …` line writes the gate's own PID to. */
const STUB_PID_RECORD = 'stub-pid.txt';

function stubPidOf(dir) {
  return Number(text(dir, STUB_PID_RECORD).trim());
}

/** Whether `pid` exists; the test process is unsandboxed, so signal 0 answers here as it cannot for the wrapper. */
function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

/** Resolves once the run held on its release file is in flight: `.running`, one counter line, the gate's PID. */
function untilInFlight(dir) {
  return pollUntil(
    () => existsSync(join(dir, RUNNING)) && counterLines(dir).length === 1 && existsSync(join(dir, STUB_PID_RECORD)),
    'the run in flight',
  );
}

for (const [name, stubExit, expectedStdout, expectedStatus] of [
  ['a zero-exit command prints exactly `pass` and exits 0', '0', 'pass\n', 0],
  [
    'a non-zero command prints exactly `fail <log path>` and exits 1',
    '3',
    `fail ${LOG_DIR}/task_round_1.log\n`,
    1,
  ],
]) {
  test(name, async (t) => {
    const dir = await wiredFixture(t);

    const result = await wrapper(dir, ['task_round_1'], { STUB_EXIT: stubExit });

    assert.equal(result.stdout, expectedStdout);
    assert.equal(result.status, expectedStatus);
    assert.equal(result.stderr, '', 'the command\'s output reached the wrapper\'s stderr');
    const log = text(dir, `${LOG_DIR}/task_round_1.log`);
    assert.match(log, new RegExp(STDOUT_MARKER));
    assert.match(log, new RegExp(STDERR_MARKER));
    assert.deepEqual(counterLines(dir), ['ran'], 'the command did not run exactly once');
  });
}

test('each round keeps its own log, and only a re-run of the same label replaces one', async (t) => {
  const dir = await wiredFixture(t);

  assert.equal((await wrapper(dir, ['task_round_1'], { STUB_TAG: 'first' })).stdout, 'pass\n');
  const roundOne = text(dir, `${LOG_DIR}/task_round_1.log`);
  assert.equal((await wrapper(dir, ['task_round_2'], { STUB_TAG: 'second' })).stdout, 'pass\n');

  assert.deepEqual(logFiles(dir), ['task_round_1.log', 'task_round_2.log']);
  assert.equal(text(dir, `${LOG_DIR}/task_round_1.log`), roundOne, 'round 2 changed round 1\'s log');

  assert.equal((await wrapper(dir, ['task_round_1'], { STUB_TAG: 'rerun' })).stdout, 'pass\n');
  const rerun = text(dir, `${LOG_DIR}/task_round_1.log`);
  assert.match(rerun, new RegExp(`${STDOUT_MARKER} rerun`));
  assert.doesNotMatch(rerun, /first/, 'the re-run appended to the log instead of replacing it');
  assert.deepEqual(logFiles(dir), ['task_round_1.log', 'task_round_2.log']);
});

for (const [name, stubExit, line, expectedStatus] of [
  ['a finished `pass` run leaves its verdict, and --wait reads it without re-running', '0', 'pass\n', 0],
  [
    'a finished `fail` run leaves its verdict, and --wait reads it without re-running',
    '1',
    `fail ${LOG_DIR}/task_round_1.log\n`,
    1,
  ],
]) {
  test(name, async (t) => {
    const dir = await wiredFixture(t);

    const run = await wrapper(dir, ['task_round_1'], { STUB_EXIT: stubExit });
    assert.equal(run.stdout, line);

    assert.equal(text(dir, `${LOG_DIR}/task_round_1.verdict`), line);
    assert.equal(existsSync(join(dir, LOG_DIR, 'task_round_1.running')), false, '.running outlived the run');

    const waited = await wrapper(dir, ['--wait', 'task_round_1']);
    assert.equal(waited.stdout, line);
    assert.equal(waited.status, expectedStatus);
    assert.equal(waited.stderr, '');
    assert.deepEqual(counterLines(dir), ['ran'], 'the wait form ran the command');
  });
}

test('--wait prints `pending` while the run is live, then its verdict once re-issued after it ends', async (t) => {
  const dir = await wiredFixture(t);
  const release = join(dir, 'stub-release');
  const running = join(dir, LOG_DIR, 'task_round_1.running');

  const inFlight = wrapper(dir, ['task_round_1'], { STUB_RELEASE: release });
  await pollUntil(() => existsSync(running) && counterLines(dir).length === 1, 'the run in flight');

  const pending = await wrapper(dir, ['--wait', 'task_round_1'], { RUN_TEST_SUITE_WAIT_SLICE: '1' });
  assert.equal(pending.stdout, 'pending\n');
  assert.equal(pending.status, 3);
  assert.equal(existsSync(running), true);

  writeFileSync(release, '');
  let waited;
  await pollUntil(async () => {
    waited = await wrapper(dir, ['--wait', 'task_round_1'], { RUN_TEST_SUITE_WAIT_SLICE: '1' });
    return waited.stdout !== 'pending\n';
  }, '--wait to stop printing `pending`');

  assert.equal(waited.stdout, 'pass\n');
  assert.equal(waited.status, 0);
  assert.equal((await inFlight).stdout, 'pass\n');
  assert.deepEqual(counterLines(dir), ['ran'], 'the command did not run exactly once');
});

test('a run form issued while a run of the same label is live prints `pending` and starts nothing', async (t) => {
  const dir = await wiredFixture(t);
  const release = join(dir, 'stub-release');
  const running = join(dir, LOG_DIR, 'task_round_1.running');

  const inFlight = wrapper(dir, ['task_round_1'], { STUB_RELEASE: release });
  await pollUntil(() => existsSync(running) && counterLines(dir).length === 1, 'the run in flight');

  const second = await wrapper(dir, ['task_round_1'], { RUN_TEST_SUITE_WAIT_SLICE: '1' });
  assert.equal(second.stdout, 'pending\n');
  assert.equal(second.status, 3);
  assert.deepEqual(counterLines(dir), ['ran'], 'the second run form started the command');

  writeFileSync(release, '');
  const first = await inFlight;
  assert.equal(first.stdout, 'pass\n');

  const waited = await wrapper(dir, ['--wait', 'task_round_1']);
  assert.equal(waited.stdout, 'pass\n');
  assert.deepEqual(counterLines(dir), ['ran'], 'the command did not run exactly once');
});

for (const [name, plant] of [
  ['--wait for a label never run refuses: no run in flight', () => {}],
  [
    '--wait for a label whose .running heartbeat is stale refuses: no run in flight',
    (dir) => plantRunning(dir, { pid: deadPid(), ageSeconds: 120 }),
  ],
]) {
  test(name, async (t) => {
    const dir = await wiredFixture(t);
    plant(dir);
    const before = await snapshotTree(dir);

    const result = await wrapper(dir, ['--wait', 'task_round_1']);

    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^run-test-suite\.sh: no run in flight for task_round_1\n$/);
    assert.deepEqual(await snapshotTree(dir), before, 'a refused --wait wrote a file');
  });
}

test('--wait for a label whose fresh heartbeat names an unsignalable PID prints `pending`: the heartbeat decides', async (t) => {
  const dir = await wiredFixture(t);
  // The planted PID is dead, so the old `kill -0` liveness check would refuse this case.
  plantRunning(dir, { pid: deadPid(), ageSeconds: 0 });
  const before = await snapshotTree(dir);

  const result = await wrapper(dir, ['--wait', 'task_round_1'], { RUN_TEST_SUITE_WAIT_SLICE: '1' });

  assert.equal(result.stdout, 'pending\n');
  assert.equal(result.status, 3);
  assert.equal(result.stderr, '');
  assert.deepEqual(await snapshotTree(dir), before, 'the wait form wrote a file');
});

test('a run form finding a fresh heartbeat of its label prints `pending` and starts nothing', async (t) => {
  const dir = await wiredFixture(t);
  const sentinel = 'PLANTED-LOG-SENTINEL\n';
  const pid = deadPid();
  plantRunning(dir, { pid, ageSeconds: 0 });
  writeFileSync(join(dir, LOG), sentinel);

  const result = await wrapper(dir, ['task_round_1'], { RUN_TEST_SUITE_WAIT_SLICE: '1' });

  assert.equal(result.stdout, 'pending\n');
  assert.equal(result.status, 3);
  assert.deepEqual(counterLines(dir), [], 'the run form started the command');
  assert.equal(text(dir, LOG), sentinel, 'the run form touched the live run\'s log');
  assert.equal(pidOf(dir), pid, 'the run form replaced the live run\'s .running');
});

test('a run form finding a stale heartbeat of its label starts a fresh run', async (t) => {
  const dir = await wiredFixture(t);
  const sentinel = 'PLANTED-LOG-SENTINEL\n';
  plantRunning(dir, { pid: deadPid(), ageSeconds: 120 });
  writeFileSync(join(dir, LOG), sentinel);

  const result = await wrapper(dir, ['task_round_1']);

  assert.equal(result.stdout, 'pass\n');
  assert.equal(result.status, 0);
  assert.deepEqual(counterLines(dir), ['ran']);
  assert.doesNotMatch(text(dir, LOG), /PLANTED-LOG-SENTINEL/, 'the re-run did not truncate the log');
  assert.equal(existsSync(join(dir, RUNNING)), false, '.running outlived the run');
});

test('a run killed without a verdict reads as no run in flight once its heartbeat is stale', async (t) => {
  const dir = await wiredFixture(t);
  const release = join(dir, 'stub-release');
  const controller = new AbortController();

  const run = runBash(dir, [join(dir, WRAPPER), 'task_round_1'], { STUB_RELEASE: release }, { signal: controller.signal });
  const rejected = assert.rejects(run, /^Error: runBash aborted:/);
  await untilInFlight(dir);
  controller.abort();
  await rejected;
  await pollUntil(() => !isAlive(stubPidOf(dir)), 'the group SIGKILL to reach the gate');

  const result = await wrapper(dir, ['--wait', 'task_round_1'], { [STALE_ENV]: '3', RUN_TEST_SUITE_WAIT_SLICE: '30' });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, REFUSAL);
  assert.equal(existsSync(join(dir, VERDICT)), false, 'a killed run left a verdict');
  assert.equal(existsSync(join(dir, RUNNING)), true, '.running is gone, so the refusal did not come from staleness');
  writeFileSync(release, '');
});

test('a run that outlives the stale window keeps its heartbeat fresh', async (t) => {
  const dir = await wiredFixture(t);
  const release = join(dir, 'stub-release');
  const controller = new AbortController();
  t.after(() => controller.abort());

  const run = runBash(dir, [join(dir, WRAPPER), 'task_round_1'], { STUB_RELEASE: release }, { signal: controller.signal });
  await untilInFlight(dir);
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const pending = await wrapper(dir, ['--wait', 'task_round_1'], { [STALE_ENV]: '5', RUN_TEST_SUITE_WAIT_SLICE: '1' });
  assert.equal(pending.stdout, 'pending\n');
  assert.equal(pending.status, 3);

  writeFileSync(release, '');
  let waited;
  await pollUntil(async () => {
    waited = await wrapper(dir, ['--wait', 'task_round_1'], { [STALE_ENV]: '5', RUN_TEST_SUITE_WAIT_SLICE: '1' });
    return waited.stdout !== 'pending\n';
  }, '--wait to stop printing `pending`');
  assert.equal(waited.stdout, 'pass\n');
  assert.equal((await run).stdout, 'pass\n');
  assert.deepEqual(counterLines(dir), ['ran'], 'the command did not run exactly once');
});

test('a SIGTERM to the run form\'s PID alone leaves the label live until the gate returns, then no verdict', async (t) => {
  const dir = await wiredFixture(t);
  const release = join(dir, 'stub-release');
  const controller = new AbortController();
  t.after(() => controller.abort());

  const run = runBash(dir, [join(dir, WRAPPER), 'task_round_1'], { STUB_RELEASE: release }, { signal: controller.signal });
  await untilInFlight(dir);
  process.kill(pidOf(dir), 'SIGTERM');

  assert.equal(existsSync(join(dir, RUNNING)), true, '.running went before the gate returned');
  assert.equal(isAlive(stubPidOf(dir)), true, 'the SIGTERM stopped the gate');
  const pending = await wrapper(dir, ['--wait', 'task_round_1'], { RUN_TEST_SUITE_WAIT_SLICE: '1' });
  assert.equal(pending.stdout, 'pending\n');
  assert.equal(pending.status, 3);

  writeFileSync(release, '');
  const result = await run;

  assert.equal(result.status, 143);
  assert.equal(result.stdout, '');
  assert.equal(existsSync(join(dir, RUNNING)), false, 'the trap left .running');
  assert.equal(existsSync(join(dir, VERDICT)), false, 'a signalled run left a verdict');
  assert.equal(isAlive(stubPidOf(dir)), false, 'the gate outlived the run form');
  const exitedPrefix = GATE_MARKER.testExited('#').split('#')[0];
  assert.ok(!text(dir, LOG).split('\n').some((line) => line.startsWith(exitedPrefix)), 'a marker followed the trap');
  const refused = await wrapper(dir, ['--wait', 'task_round_1']);
  assert.equal(refused.status, 2);
  assert.equal(refused.stderr, REFUSAL);
});

test('a SIGINT to the run form\'s process group stops the gate before any release, then no verdict', async (t) => {
  const dir = await wiredFixture(t);
  const release = join(dir, 'stub-release');
  const controller = new AbortController();
  t.after(() => controller.abort());

  const run = runBash(dir, [join(dir, WRAPPER), 'task_round_1'], { STUB_RELEASE: release }, { signal: controller.signal });
  await untilInFlight(dir);
  process.kill(-pidOf(dir), 'SIGINT');

  await pollUntil(() => !existsSync(join(dir, RUNNING)), 'the trap to remove .running');
  assert.equal(isAlive(stubPidOf(dir)), false, 'the interrupt did not stop the gate');
  const result = await run;

  assert.equal(result.status, 130);
  assert.equal(result.stdout, '');
  assert.equal(existsSync(join(dir, VERDICT)), false, 'an interrupted run left a verdict');
  const refused = await wrapper(dir, ['--wait', 'task_round_1']);
  assert.equal(refused.status, 2);
  assert.equal(refused.stderr, REFUSAL);
  writeFileSync(release, '');
});

test('a .running whose heartbeat cannot be read refuses in both forms, and the run form starts nothing', async (t) => {
  const dir = await wiredFixture(t);
  plantRunning(dir, { pid: deadPid(), ageSeconds: 0 });
  // `hr_lane_mtime` is the only `stat` the wrapper reaches; a `stat` that always fails makes it print 0.
  const fakeBin = join(dir, 'fake-bin');
  mkdirSync(fakeBin);
  writeFileSync(join(fakeBin, 'stat'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  const env = { PATH: `${fakeBin}:${process.env.PATH}` };
  const refusal = /^run-test-suite\.sh: cannot read the heartbeat of '[^'\n]*task_round_1\.running'\n$/;
  const before = await snapshotTree(dir);

  const waited = await wrapper(dir, ['--wait', 'task_round_1'], env);
  assert.equal(waited.status, 2);
  assert.equal(waited.stdout, '');
  assert.match(waited.stderr, refusal);

  const ran = await wrapper(dir, ['task_round_1'], env);
  assert.equal(ran.status, 2);
  assert.equal(ran.stdout, '');
  assert.match(ran.stderr, refusal);
  assert.deepEqual(counterLines(dir), [], 'the run form started the command');
  assert.deepEqual(await snapshotTree(dir), before, 'a refusal wrote a file');
});

test('malformed invocations refuse with exit 2, one stderr line and nothing written', async (t) => {
  const dir = await wiredFixture(t);
  const before = await snapshotTree(dir);

  for (const [what, args] of [
    ['no argument', []],
    ['two arguments that are not --wait <label>', ['task_round_1', 'task_round_2']],
    ['--wait alone', ['--wait']],
    ['a label containing /', ['task/round_1']],
    ['a label starting with .', ['.task_round_1']],
  ]) {
    const result = await wrapper(dir, args);
    assert.equal(result.status, 2, `${what}: exit ${result.status}`);
    assert.equal(result.stdout, '', `${what}: stdout`);
    assert.match(result.stderr, /^run-test-suite\.sh: [^\n]*\n$/, `${what}: stderr`);
  }

  assert.deepEqual(readdirSync(join(dir, LOGS_ROOT)), LOGS_ROOT_AS_INITIALISED, 'a refusal wrote into the log tree');
  assert.deepEqual(counterLines(dir), [], 'a refusal ran the command');
  assert.deepEqual(await snapshotTree(dir), before, 'a refusal wrote a file');
});

test('a detached HEAD refuses with exit 2, one stderr line and nothing written', async (t) => {
  const dir = await wiredFixture(t);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--allow-empty', '--no-verify', '-m', 'fixture seed']);
  await runGit(dir, ['checkout', '--quiet', '--detach']);
  const before = await snapshotTree(dir);

  const result = await wrapper(dir, ['task_round_1']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^run-test-suite\.sh: [^\n]*\n$/);
  assert.deepEqual(readdirSync(join(dir, LOGS_ROOT)), LOGS_ROOT_AS_INITIALISED, 'the refusal wrote into the log tree');
  assert.deepEqual(counterLines(dir), [], 'the refusal ran the command');
  assert.deepEqual(await snapshotTree(dir), before, 'the refusal wrote a file');
});

test('invoked from a subdirectory, the command still runs from the repository root', async (t) => {
  const dir = await wiredFixture(t);
  const nested = join(dir, 'nested', 'deeper');
  mkdirSync(nested, { recursive: true });

  const result = await wrapper(dir, ['task_round_1'], {}, nested);

  assert.equal(result.stdout, 'pass\n');
  assert.equal(text(dir, PWD_RECORD), `${dir}\n`);
  assert.equal(existsSync(join(nested, COUNTER)), false, 'the command ran in the caller\'s directory');
});

for (const [name, tcExit, stubExit, expectedStdout, expectedStatus] of [
  ['typecheck fails, test passes: `fail`, and the test still ran', '1', '0', `fail ${LOG_DIR}/task_round_1.log\n`, 1],
  ['typecheck passes, test fails: `fail`', '0', '1', `fail ${LOG_DIR}/task_round_1.log\n`, 1],
  ['both gates fail: `fail`, and the test still ran', '1', '1', `fail ${LOG_DIR}/task_round_1.log\n`, 1],
  ['both gates pass: `pass`', '0', '0', 'pass\n', 0],
]) {
  test(`two gates — ${name}`, async (t) => {
    const dir = await wiredFixture(t, { typecheck: TC_STUB_COMMAND });

    const result = await wrapper(dir, ['task_round_1'], { TC_STUB_EXIT: tcExit, STUB_EXIT: stubExit });

    assert.equal(result.stdout, expectedStdout);
    assert.equal(result.status, expectedStatus);
    assert.equal(result.stderr, '', 'a gate\'s output reached the wrapper\'s stderr');
    assert.deepEqual(counterLines(dir, TC_COUNTER), ['ran'], 'the typecheck did not run exactly once');
    assert.deepEqual(counterLines(dir), ['ran'], 'the test did not run exactly once');
    const log = text(dir, `${LOG_DIR}/task_round_1.log`);
    for (const marker of [TC_STDOUT_MARKER, TC_STDERR_MARKER, STDOUT_MARKER, STDERR_MARKER]) {
      assert.match(log, new RegExp(marker), `${marker} is missing from the log`);
    }
  });
}

for (const [name, tcExit, stubExit] of [
  ['both pass', '0', '0'],
  ['typecheck fails', '1', '0'],
]) {
  test(`two gates — the log carries each gate's marker lines, typecheck first (${name})`, async (t) => {
    const dir = await wiredFixture(t, { typecheck: TC_STUB_COMMAND });

    await wrapper(dir, ['task_round_1'], { TC_STUB_EXIT: tcExit, STUB_EXIT: stubExit });

    const lines = text(dir, `${LOG_DIR}/task_round_1.log`).split('\n');
    for (const marker of [
      GATE_MARKER.typecheckHeader,
      GATE_MARKER.typecheckExited(tcExit),
      GATE_MARKER.testHeader,
      GATE_MARKER.testExited(stubExit),
    ]) {
      assert.ok(lines.includes(marker), `the log has no line ${marker}`);
    }
    assert.ok(
      lines.indexOf(GATE_MARKER.typecheckHeader) < lines.indexOf(GATE_MARKER.testHeader),
      'the test gate ran before the typecheck gate',
    );
  });
}

for (const [name, stubExit, expectedStdout, expectedStatus] of [
  ['with the test passing, the round passes on the test alone', '0', 'pass\n', 0],
  ['with the test failing, the round fails: `<none>` masks nothing', '1', `fail ${LOG_DIR}/task_round_1.log\n`, 1],
]) {
  test(`commands.typecheck \`<none>\` runs nothing and is logged as not run — ${name}`, async (t) => {
    const dir = await wiredFixture(t, { typecheck: '<none>' });
    assert.equal(existsSync(join(dir, 'scripts', 'typecheck.sh')), false, 'init wrote typecheck.sh for `<none>`');

    const result = await wrapper(dir, ['task_round_1'], { STUB_EXIT: stubExit });

    assert.equal(result.stdout, expectedStdout);
    assert.equal(result.status, expectedStatus);
    assert.equal(result.stderr, '');
    const lines = text(dir, `${LOG_DIR}/task_round_1.log`).split('\n');
    assert.ok(lines.includes(GATE_MARKER.typecheckHeader), 'the log has no typecheck header');
    assert.ok(lines.includes(GATE_MARKER.typecheckNotRun), 'the log has no not-run line');
    assert.equal(existsSync(join(dir, TC_COUNTER)), false, 'a typecheck stub ran');
    assert.deepEqual(counterLines(dir), ['ran'], 'the test did not run exactly once');
  });
}

test('commands.typecheck `<none>` padded with whitespace is still the sentinel, as isNoneSentinel reads it', async (t) => {
  const dir = await wiredFixture(t, { typecheck: '  <none> ' });

  const result = await wrapper(dir, ['task_round_1']);

  assert.equal(result.stdout, 'pass\n');
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const lines = text(dir, `${LOG_DIR}/task_round_1.log`).split('\n');
  assert.ok(lines.includes(GATE_MARKER.typecheckNotRun), 'the padded sentinel was not recognised');
  assert.deepEqual(counterLines(dir), ['ran'], 'the test did not run exactly once');
});

test('commands.typecheck unset refuses with exit 2, its own stderr line and nothing written', async (t) => {
  const dir = await wiredFixture(t, { typecheck: TC_STUB_COMMAND });
  const configPath = join(dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  delete config.commands.typecheck;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  const before = await snapshotTree(dir);

  const result = await wrapper(dir, ['task_round_1']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'run-test-suite.sh: commands.typecheck is not set in harness.config.json\n');
  assert.deepEqual(counterLines(dir, TC_COUNTER), [], 'the refusal ran the typecheck');
  assert.deepEqual(counterLines(dir), [], 'the refusal ran the test');
  assert.deepEqual(await snapshotTree(dir), before, 'the refusal wrote a file');
});

test('--wait after a run that failed on typecheck alone reprints its `fail` and runs neither gate again', async (t) => {
  const dir = await wiredFixture(t, { typecheck: TC_STUB_COMMAND });
  const line = `fail ${LOG_DIR}/task_round_1.log\n`;

  assert.equal((await wrapper(dir, ['task_round_1'], { TC_STUB_EXIT: '1' })).stdout, line);

  const waited = await wrapper(dir, ['--wait', 'task_round_1']);
  assert.equal(waited.stdout, line);
  assert.equal(waited.status, 1);
  assert.equal(waited.stderr, '');
  assert.deepEqual(counterLines(dir, TC_COUNTER), ['ran'], 'the wait form ran the typecheck');
  assert.deepEqual(counterLines(dir), ['ran'], 'the wait form ran the test');
});
