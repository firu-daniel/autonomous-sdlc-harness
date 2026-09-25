/**
 * `remote-run.sh`'s sending verbs — `dispatch`, `pause`, `warm` and `stop` — against a fixture `init`
 * wired, with `gh` replaced by a recorder stub through `HARNESS_GH_CLI`.
 *
 * **The rule these tests exist to enforce: the script is the one shell-side producer of the run
 * workflow's inputs, so each verb sends exactly the argument vector the input contract states, a
 * refusal sends nothing at all, and `stop` always sends its `action=stop` marker before any cancel —
 * whether or not a run is in progress.** No case reaches the network: the stub is a Node script that
 * appends its argument vector, as one JSON line, to a log and prints canned JSON for `run list` and
 * `repo view`.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REGISTRY = `${STATE_DIR}/autonomous_logs/registry.json`;
const CLARIFY_DIR = `${STATE_DIR}/clarifications/feat_x`;

/** The documented `workflow_dispatch` inputs limit the script refuses above. */
const PAYLOAD_MAX = 65535;

const STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
const line = args.join(' ');
const failOn = process.env.STUB_FAIL_ON;
if (failOn && line.startsWith(failOn)) {
  process.stderr.write((process.env.STUB_FAIL_STDERR || 'stub failure') + '\\nsecond line\\n');
  process.exit(4);
}
if (line.startsWith('run list')) process.stdout.write(process.env.STUB_RUN_LIST || '[]');
if (line.startsWith('repo view')) process.stdout.write(process.env.STUB_REPO_VIEW || '{}');
`;

const ACTIVE_RUNS = JSON.stringify([
  { databaseId: 11, status: 'in_progress' },
  { databaseId: 12, status: 'completed' },
  { databaseId: 13, status: 'queued' },
  { databaseId: 14, status: 'waiting' },
]);

/** An `init`-wired fixture with `execution.target` set, and a recorder stub beside it. */
async function remoteFixture(t, target = 'github-actions') {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
    },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);

  const configPath = join(dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.execution = { target };
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  // Beside the fixture's state directory, which is gitignored, so the stub is never part of a snapshot.
  const stubDir = join(dir, STATE_DIR, 'stub');
  mkdirSync(stubDir, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  return { dir, stub, log: join(stubDir, 'gh.log') };
}

/** Run the script from the fixture root with the stub as `gh`. */
function remoteRun(fx, args, env = {}) {
  return runBash(fx.dir, [SCRIPT, ...args], { HARNESS_GH_CLI: fx.stub, STUB_LOG: fx.log, ...env });
}

/** Every argument vector the stub recorded, in call order. */
function calls(fx) {
  if (!existsSync(fx.log)) return [];
  return readFileSync(fx.log, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function joined(fx) {
  return calls(fx).map((argv) => argv.join(' '));
}

test('dispatch sends exactly the run inputs, with chain 0 by default', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['dispatch', 'feat_x', '--engine', 'task']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(joined(fx), [
    'workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=task -f resume=none -f chain=0',
  ]);
});

test('a resume on answers sends one answers value that jq parses back to each file\'s exact bytes', async (t) => {
  const fx = await remoteFixture(t);
  const first = 'He said "yes" \\ and a tab\there.\n\nSecond paragraph, ünïcødé.\n';
  const second = 'no trailing newline; {"json": [1, 2]} $HOME `tick`';
  mkdirSync(join(fx.dir, CLARIFY_DIR), { recursive: true });
  writeFileSync(join(fx.dir, CLARIFY_DIR, 'answer_1.md'), first);
  writeFileSync(join(fx.dir, CLARIFY_DIR, 'answer_2.md'), second);

  const result = await remoteRun(fx, [
    'dispatch', 'feat_x', '--engine', 'task', '--resume', 'answer',
    '--answers-from', join(fx.dir, CLARIFY_DIR), '--indexes', '1 2',
  ]);
  assert.equal(result.status, 0, result.stderr);

  const [argv] = calls(fx);
  const answersArgs = argv.filter((arg) => arg.startsWith('answers='));
  assert.equal(answersArgs.length, 1, 'expected exactly one answers input');
  const json = answersArgs[0].slice('answers='.length);
  assert.equal(execFileSync('jq', ['-j', '.["1"]'], { input: json, encoding: 'utf8' }), first);
  assert.equal(execFileSync('jq', ['-j', '.["2"]'], { input: json, encoding: 'utf8' }), second);
  assert.ok(argv.includes('resume=answer'));
});

test('an inputs payload over the limit exits 2 and sends nothing', async (t) => {
  const fx = await remoteFixture(t);
  mkdirSync(join(fx.dir, CLARIFY_DIR), { recursive: true });
  writeFileSync(join(fx.dir, CLARIFY_DIR, 'answer_1.md'), 'a'.repeat(PAYLOAD_MAX + 1));
  const result = await remoteRun(fx, [
    'dispatch', 'feat_x', '--engine', 'task', '--resume', 'answer',
    '--answers-from', join(fx.dir, CLARIFY_DIR), '--indexes', '1',
  ]);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /65535/);
  assert.deepEqual(calls(fx), []);
});

test('a named answer file that is missing exits 2 and sends nothing', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, [
    'dispatch', 'feat_x', '--engine', 'task', '--resume', 'answer',
    '--answers-from', join(fx.dir, CLARIFY_DIR), '--indexes', '9',
  ]);
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(calls(fx), []);
});

test('execution.target local exits 2 and sends nothing, for every verb', async (t) => {
  const fx = await remoteFixture(t, 'local');
  for (const args of [['dispatch', 'feat_x', '--engine', 'task'], ['pause', 'feat_x'], ['warm'], ['stop', 'feat_x']]) {
    const result = await remoteRun(fx, args);
    assert.equal(result.status, 2, `${args[0]}: ${result.stderr}`);
  }
  assert.deepEqual(calls(fx), []);
});

test('a usage error exits 1 and sends nothing', async (t) => {
  const fx = await remoteFixture(t);
  for (const args of [[], ['dispatch', 'feat_x'], ['dispatch', 'feat_x', '--engine', 'task', '--chain', '-1'], ['pause'], ['warm', 'feat_x']]) {
    const result = await remoteRun(fx, args);
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stderr}`);
  }
  assert.deepEqual(calls(fx), []);
});

test('pause sends action=pause on the branch', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['pause', 'feat_x']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(joined(fx), ['workflow run harness-run.yml --ref feat_x -f action=pause -f branch=feat_x']);
});

test('warm dispatches on GitHub\'s own default branch', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['warm'], { STUB_REPO_VIEW: '{"defaultBranchRef":{"name":"gh-default"}}' });
  assert.equal(result.status, 0, result.stderr);
  const sent = joined(fx);
  assert.equal(sent[0], 'repo view --json defaultBranchRef');
  assert.equal(sent[1], 'workflow run harness-run.yml --ref gh-default -f action=warm -f branch=gh-default');
});

test('stop sends the marker first, cancels exactly the active runs, and flips an existing record to failed', async (t) => {
  const fx = await remoteFixture(t);
  mkdirSync(join(fx.dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
  writeFileSync(join(fx.dir, REGISTRY), JSON.stringify({ runs: { feat_x: { branch: 'feat_x', status: 'paused' } } }));

  const before = Math.floor(Date.now() / 1000);
  const result = await remoteRun(fx, ['stop', 'feat_x'], { STUB_RUN_LIST: ACTIVE_RUNS });
  assert.equal(result.status, 0, result.stderr);

  const sent = joined(fx);
  assert.equal(sent[0], 'workflow run harness-run.yml --ref feat_x -f action=stop -f branch=feat_x');
  assert.ok(sent[1].startsWith('run list '), sent[1]);
  assert.deepEqual(sent.slice(2), ['run cancel 11', 'run cancel 13', 'run cancel 14']);

  const record = JSON.parse(readFileSync(join(fx.dir, REGISTRY), 'utf8')).runs.feat_x;
  assert.equal(record.status, 'failed');
  assert.ok(Number(record.remote_stopped_at) >= before, `remote_stopped_at is ${record.remote_stopped_at}`);
});

test('stop with no queued, waiting or in-progress run still sends the marker and cancels nothing', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['stop', 'feat_x'], {
    STUB_RUN_LIST: JSON.stringify([{ databaseId: 21, status: 'completed' }]),
  });
  assert.equal(result.status, 0, result.stderr);
  const sent = joined(fx);
  assert.equal(sent[0], 'workflow run harness-run.yml --ref feat_x -f action=stop -f branch=feat_x');
  assert.equal(sent.filter((line) => line.startsWith('run cancel')).length, 0);
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false, 'stop created a registry with no record to update');
});

test('a failed marker dispatch exits 3 and sends no cancel', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['stop', 'feat_x'], {
    STUB_RUN_LIST: ACTIVE_RUNS,
    STUB_FAIL_ON: 'workflow run',
    STUB_FAIL_STDERR: 'HTTP 422: marker refused',
  });
  assert.equal(result.status, 3, result.stderr);
  assert.match(result.stderr, /HTTP 422: marker refused/);
  assert.deepEqual(joined(fx), ['workflow run harness-run.yml --ref feat_x -f action=stop -f branch=feat_x']);
});

test('gh exiting non-zero yields exit 3 naming the first line of its stderr', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['pause', 'feat_x'], { STUB_FAIL_ON: 'workflow run', STUB_FAIL_STDERR: 'could not find workflow' });
  assert.equal(result.status, 3);
  assert.match(result.stderr, /could not find workflow/);
  assert.doesNotMatch(result.stderr, /second line/);
});

test('gh that cannot be found yields exit 3', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['warm'], { HARNESS_GH_CLI: join(fx.dir, 'no-such-gh') });
  assert.equal(result.status, 3);
  assert.match(result.stderr, /not found/);
});
