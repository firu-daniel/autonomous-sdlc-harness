/**
 * `run-test-suite.sh` — the Run gates phase's test-suite runner, driven against a repository the
 * test builds and throws away.
 *
 * **The rule these tests exist to enforce: the wrapper hands the orchestrator one line and nothing
 * else, runs the configured command at most once per invocation, and never while a run of the same
 * label is live, and versions its log per round.**
 * Every case seeds `commands.test` with a stub that counts its own runs, so "exactly once" is an
 * assertion on a counter file rather than an inference from the verdict, and "nothing else" is an
 * assertion that the stub's own output reached the log and neither of the wrapper's streams.
 *
 * Not covered here: the Run gates phase's own sequencing — which gate runs when, and what a `fail`
 * dispatches — is instruction prose, and Task 23's walk of that prose covers it.
 *
 * These run against the **compiled** CLI at `dist/cli.js`, because `init` is what writes the
 * wrapper into the fixture; `npm run build` precedes `npm test`.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  `pwd > ${PWD_RECORD}`,
  `echo "${STDOUT_MARKER} \${STUB_TAG-}"`,
  `echo "${STDERR_MARKER} \${STUB_TAG-}" >&2`,
  'if [ -n "${STUB_RELEASE-}" ]; then',
  '  while [ ! -e "$STUB_RELEASE" ]; do sleep 0.1; done',
  'fi',
  'exit "${STUB_EXIT:-0}"',
  '',
].join('\n');

/** How many times a case re-checks for a state the wrapper is expected to reach, before failing. */
const POLL_LIMIT = 600;

function seededConfig() {
  return {
    version: 1,
    defaultBranch: 'main',
    stateDir: STATE_DIR,
    layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
    commands: { typecheck: 'echo typecheck', test: 'bash stub.sh' },
  };
}

/** A fixture on {@link BRANCH} with the stub wired as `commands.test` and `init` already run. */
async function wiredFixture(t) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0' },
      'harness.config.json': seededConfig(),
      'stub.sh': STUB,
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

function counterLines(dir) {
  return existsSync(join(dir, COUNTER)) ? text(dir, COUNTER).split('\n').filter((line) => line !== '') : [];
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
    '--wait for a label whose .running names a dead PID refuses: no run in flight',
    (dir) => {
      mkdirSync(join(dir, LOG_DIR), { recursive: true });
      writeFileSync(join(dir, LOG_DIR, 'task_round_1.running'), `${deadPid()}\n`);
    },
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
