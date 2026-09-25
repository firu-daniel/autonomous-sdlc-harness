/**
 * `remote-run.sh`'s sending verbs — `dispatch`, `pause`, `warm` and `stop` — against a fixture `init`
 * wired, with `gh` replaced by a recorder stub through `HARNESS_GH_CLI`.
 *
 * **The rule these tests exist to enforce: the script is the one shell-side producer of the run
 * workflow's inputs, so each verb sends exactly the argument vector the input contract states, a
 * refusal sends nothing at all, and `stop` always sends its `action=stop` marker before any cancel —
 * whether or not a run is in progress.** No case reaches the network: the stub is a Node script that
 * appends its argument vector, as one JSON line, to a log, prints canned JSON for `run list`,
 * `repo view` and a run's artifact list, and materialises a fixture bundle on `run download`.
 *
 * **For `status` and `sync`, the rule is that the newest finished run decides and a bundle already
 * applied is never applied again**: `status` leaves every byte under the state directory as it found
 * it, and a second `sync` of the same run — or of a newer run that left no bundle — moves nothing in
 * the mirror, so an answer written there since the last sync survives. "The record differs only in
 * `remote_synced_at`" is asserted with `updated_at` set aside too: the shared registry writer stamps
 * it on every write.
 *
 * **For the job-side `restore` and `save`, the rule is that a job carries forward exactly the
 * previous job's bundle — never its own run's — and an answer lands with its exact bytes or not at
 * all**: every answer is checked against a top-level `question_<n>.md` before any is written, and
 * `save` exits 0 whatever it met.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, snapshotTree } from './helpers/fixture.mjs';

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
if (args[0] === 'api') {
  const parts = args[1].split('/');
  const id = parts[parts.length - 2];
  const names = JSON.parse(process.env.STUB_ARTIFACTS || '{}')[id] || [];
  process.stdout.write(JSON.stringify({ artifacts: names.map((name) => ({ name, expired: false })) }));
}
if (line.startsWith('run download')) {
  const source = JSON.parse(process.env.STUB_BUNDLES || '{}')[args[2]];
  if (!source) { process.stderr.write('no artifact matches\\n'); process.exit(1); }
  require('node:fs').cpSync(source, args[args.indexOf('-D') + 1], { recursive: true });
}
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

// ---------------------------------------------------------------------------
// status and sync.
// ---------------------------------------------------------------------------

const SUPERSEDED = `${STATE_DIR}/autonomous_logs/remote_superseded`;
const REMOTE_LOG = `${STATE_DIR}/autonomous_logs/feat_x.remote.log`;

const runUrl = (id) => `https://github.com/o/r/actions/runs/${id}`;

/** One `gh run list` entry; `createdAt` orders runs, as GitHub's own list does. */
function ghRun(id, status, minute, title = 'harness run feat_x') {
  return {
    databaseId: id,
    displayTitle: title,
    status,
    conclusion: status === 'completed' ? 'success' : null,
    createdAt: `2026-01-01T00:${String(minute).padStart(2, '0')}:00Z`,
    url: runUrl(id),
  };
}

/** A remote registry record whose mirror is the fixture itself. */
function remoteRecord(fx, extra = {}) {
  mkdirSync(join(fx.dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
  const record = { branch: 'feat_x', status: 'running', execution: 'github-actions', worktree: fx.dir, ...extra };
  writeFileSync(join(fx.dir, REGISTRY), JSON.stringify({ runs: { feat_x: record } }));
}

/** A bundle directory in Task 4's format, under the stub's directory, for `run download` to copy. */
function bundle(fx, name, { status = 'parked', questions = ['question_1.md'], detail = 'parked on a question' } = {}) {
  const dir = join(fx.dir, STATE_DIR, 'stub', 'bundles', name);
  mkdirSync(join(dir, 'clarifications', 'feat_x'), { recursive: true });
  writeFileSync(join(dir, 'status.json'), JSON.stringify({
    schema: '1', branch: 'feat_x', engine: 'task', status, pause_reason: '', usage_resume_at: '',
    park_loop_cycles: '0', resume_max_question_index: '', auto_resumes: '', stall_restarts: '',
    chain: '0', control_polled_at: '', decision: 'stop', detail, run_id: '', run_url: '', written_at: '1',
  }));
  for (const q of questions) writeFileSync(join(dir, 'clarifications', 'feat_x', q), `${name} ${q}\n`);
  writeFileSync(join(dir, 'run.log'), `${name} log\n`);
  return dir;
}

function syncEnv({ runs, artifacts = {}, bundles = {} }) {
  return {
    STUB_RUN_LIST: JSON.stringify(runs),
    STUB_ARTIFACTS: JSON.stringify(artifacts),
    STUB_BUNDLES: JSON.stringify(bundles),
  };
}

function record(fx) {
  return JSON.parse(readFileSync(join(fx.dir, REGISTRY), 'utf8')).runs.feat_x;
}

/** The record without the two fields every sync may restamp. */
function stable(rec) {
  const { remote_synced_at: _synced, updated_at: _updated, ...rest } = rec;
  return rest;
}

function superseded(fx) {
  const dir = join(fx.dir, SUPERSEDED);
  return existsSync(dir) ? readdirSync(dir) : [];
}

function downloads(fx) {
  return joined(fx).filter((line) => line.startsWith('run download'));
}

const mirror = (fx, file) => join(fx.dir, CLARIFY_DIR, file);

test('sync applies a parked bundle, and a second sync of the same run downloads nothing', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx);
  const env = syncEnv({ runs: [ghRun(101, 'completed', 1)], artifacts: { 101: ['harness-state'] }, bundles: { 101: bundle(fx, 'a') } });

  const first = await remoteRun(fx, ['sync', 'feat_x'], env);
  assert.equal(first.status, 0, first.stderr);
  const rec = record(fx);
  assert.equal(rec.status, 'parked');
  assert.equal(rec.remote_run_id, '101');
  assert.equal(rec.remote_run_url, runUrl(101));
  assert.ok(existsSync(mirror(fx, 'question_1.md')));
  assert.equal(readFileSync(join(fx.dir, REMOTE_LOG), 'utf8'), 'a log\n');
  assert.deepEqual(downloads(fx), [`run download 101 -n harness-state -D ${join(fx.dir, STATE_DIR, 'autonomous_logs/remote_download/feat_x/101')}`]);

  const second = await remoteRun(fx, ['sync', 'feat_x'], env);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(downloads(fx).length, 1, 'the second sync downloaded again');
  assert.deepEqual(stable(record(fx)), stable(rec));
});

test('an answer written into the mirror survives a second sync of the same run', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx);
  const env = syncEnv({
    runs: [ghRun(101, 'completed', 1)],
    artifacts: { 101: ['harness-state'] },
    bundles: { 101: bundle(fx, 'a', { questions: ['question_1.md', 'question_2.md'] }) },
  });
  assert.equal((await remoteRun(fx, ['sync', 'feat_x'], env)).status, 0);
  writeFileSync(mirror(fx, 'answer_1.md'), 'yes\n');
  const before = record(fx);
  const asideBefore = superseded(fx);

  const again = await remoteRun(fx, ['sync', 'feat_x'], env);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(readFileSync(mirror(fx, 'answer_1.md'), 'utf8'), 'yes\n');
  assert.deepEqual(superseded(fx), asideBefore);
  assert.deepEqual(stable(record(fx)), stable(before));
});

test('a newer finished run with a bundle does replace the mirror, moving the stale pair aside', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx);
  const a = bundle(fx, 'a');
  assert.equal((await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(101, 'completed', 1)], artifacts: { 101: ['harness-state'] }, bundles: { 101: a },
  }))).status, 0);
  writeFileSync(mirror(fx, 'answer_1.md'), 'yes\n');

  const result = await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(102, 'completed', 2), ghRun(101, 'completed', 1)],
    artifacts: { 101: ['harness-state'], 102: ['harness-state'] },
    bundles: { 101: a, 102: bundle(fx, 'b', { questions: ['question_1.md', 'question_2.md'] }) },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(record(fx).remote_run_id, '102');
  assert.equal(existsSync(mirror(fx, 'answer_1.md')), false);
  assert.equal(readFileSync(mirror(fx, 'question_2.md'), 'utf8'), 'b question_2.md\n');
  const aside = superseded(fx);
  assert.equal(aside.length, 1);
  assert.ok(existsSync(join(fx.dir, SUPERSEDED, aside[0], 'clarifications/feat_x/answer_1.md')));
});

test('an in-progress newest run sets the record running and downloads nothing', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx, { status: 'parked' });
  const result = await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(102, 'in_progress', 2), ghRun(101, 'completed', 1)],
    artifacts: { 101: ['harness-state'] },
    bundles: { 101: bundle(fx, 'a') },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(record(fx).status, 'running');
  assert.deepEqual(downloads(fx), []);
});

test('a finished run whose bundle still says running syncs as paused / killed', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx);
  const result = await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(101, 'completed', 1)],
    artifacts: { 101: ['harness-state'] },
    bundles: { 101: bundle(fx, 'a', { status: 'running' }) },
  }));
  assert.equal(result.status, 0, result.stderr);
  const rec = record(fx);
  assert.equal(rec.status, 'paused');
  assert.equal(rec.pause_reason, 'killed');
});

test('a newer finished run with no bundle records paused / killed at that run and restores nothing', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx);
  const a = bundle(fx, 'a');
  assert.equal((await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(201, 'completed', 1)], artifacts: { 201: ['harness-state'] }, bundles: { 201: a },
  }))).status, 0);
  writeFileSync(mirror(fx, 'answer_1.md'), 'yes\n');
  const asideBefore = superseded(fx);
  const downloadsBefore = downloads(fx).length;
  const env = syncEnv({
    runs: [ghRun(202, 'completed', 2), ghRun(201, 'completed', 1)],
    artifacts: { 201: ['harness-state'] },
    bundles: { 201: a },
  });

  const result = await remoteRun(fx, ['sync', 'feat_x'], env);
  assert.equal(result.status, 0, result.stderr);
  const rec = record(fx);
  assert.equal(rec.status, 'paused');
  assert.equal(rec.pause_reason, 'killed');
  assert.equal(rec.remote_run_id, '202');
  assert.equal(rec.remote_run_url, runUrl(202));
  assert.ok(rec.remote_detail.includes(runUrl(202)), rec.remote_detail);
  assert.equal(readFileSync(mirror(fx, 'answer_1.md'), 'utf8'), 'yes\n');
  assert.deepEqual(superseded(fx), asideBefore);
  assert.equal(downloads(fx).length, downloadsBefore, 'a run download was recorded');

  const further = await remoteRun(fx, ['sync', 'feat_x'], env);
  assert.equal(further.status, 0, further.stderr);
  assert.deepEqual(stable(record(fx)), stable(rec));
});

test('no bundle in any run and an empty remote_run_id syncs as failed', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx);
  const result = await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(302, 'completed', 2), ghRun(301, 'completed', 1)],
  }));
  assert.equal(result.status, 0, result.stderr);
  const rec = record(fx);
  assert.equal(rec.status, 'failed');
  assert.ok(rec.remote_detail.includes(runUrl(302)), rec.remote_detail);
  assert.deepEqual(downloads(fx), []);
});

test('a download directory that already holds the bundle is not downloaded again', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx);
  const target = join(fx.dir, STATE_DIR, 'autonomous_logs/remote_download/feat_x/101');
  mkdirSync(join(target, '..'), { recursive: true });
  cpSync(bundle(fx, 'a'), target, { recursive: true });
  const result = await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(101, 'completed', 1)], artifacts: { 101: ['harness-state'] },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(downloads(fx), []);
  assert.equal(record(fx).status, 'parked');
});

test('status leaves the registry and every file under the state directory byte-identical', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx, { status: 'parked', remote_run_id: '101', remote_run_url: runUrl(101), remote_synced_at: '5' });
  const before = await snapshotTree(fx.dir, { exclude: ['.git', 'stub'] });
  const registryBefore = readFileSync(join(fx.dir, REGISTRY));

  const result = await remoteRun(fx, ['status', 'feat_x'], syncEnv({
    runs: [
      ghRun(103, 'completed', 3, 'harness pause feat_x'),
      ghRun(102, 'completed', 2),
      ghRun(101, 'completed', 1),
      ghRun(9, 'completed', 0, 'harness run other'),
    ],
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /103 {2}harness pause feat_x/);
  assert.match(result.stdout, /102 {2}harness run feat_x/);
  assert.doesNotMatch(result.stdout, /harness run other/);
  assert.match(result.stdout, /remote_synced_at: 5/);
  assert.match(result.stdout, /run 102 finished after the last sync/);
  assert.match(result.stdout, /^[\x00-\x7f]*$/);

  assert.deepEqual(readFileSync(join(fx.dir, REGISTRY)), registryBefore);
  assert.deepEqual(await snapshotTree(fx.dir, { exclude: ['.git', 'stub'] }), before);
});

test('status and sync refuse a local record, or no record, with exit 2 and call nothing', async (t) => {
  const fx = await remoteFixture(t);
  for (const verb of ['status', 'sync']) {
    const absent = await remoteRun(fx, [verb, 'feat_x']);
    assert.equal(absent.status, 2, `${verb}: ${absent.stderr}`);
  }
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false, 'a refusal created the registry');

  mkdirSync(join(fx.dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
  writeFileSync(join(fx.dir, REGISTRY), JSON.stringify({ runs: { feat_x: { branch: 'feat_x', status: 'parked', worktree: fx.dir } } }));
  const registryBefore = readFileSync(join(fx.dir, REGISTRY));
  for (const verb of ['status', 'sync']) {
    const local = await remoteRun(fx, [verb, 'feat_x']);
    assert.equal(local.status, 2, `${verb}: ${local.stderr}`);
  }
  assert.deepEqual(readFileSync(join(fx.dir, REGISTRY)), registryBefore);
  assert.deepEqual(calls(fx), []);
});

test('sync with a missing mirror working copy exits 2 naming it and writes nothing', async (t) => {
  const fx = await remoteFixture(t);
  const gone = join(fx.dir, 'no-such-mirror');
  remoteRecord(fx, { worktree: gone });
  const registryBefore = readFileSync(join(fx.dir, REGISTRY));
  const result = await remoteRun(fx, ['sync', 'feat_x'], syncEnv({ runs: [ghRun(101, 'completed', 1)] }));
  assert.equal(result.status, 2, result.stderr);
  assert.ok(result.stderr.includes(gone), result.stderr);
  assert.deepEqual(readFileSync(join(fx.dir, REGISTRY)), registryBefore);
  assert.deepEqual(calls(fx), []);
});

// ---------------------------------------------------------------------------
// restore and save — the job-side verbs.
// ---------------------------------------------------------------------------

const REMOTE_STATUS = `${STATE_DIR}/autonomous_logs/remote_status.json`;
const WALKER = `${STATE_DIR}/.flow_walker_state`;

/** A bundle carrying a walker state too, with `park_loop_cycles` set as given. */
function jobBundle(fx, name, { parkLoopCycles = '2' } = {}) {
  const dir = bundle(fx, name);
  const status = JSON.parse(readFileSync(join(dir, 'status.json'), 'utf8'));
  writeFileSync(join(dir, 'status.json'), JSON.stringify({ ...status, park_loop_cycles: parkLoopCycles }));
  writeFileSync(join(dir, 'flow_walker_state'), `${name} walker\n`);
  return dir;
}

/** One finished run 401 carrying a bundle; this job is run 999. */
function restoreEnv(fx, extra = {}) {
  return {
    ...syncEnv({ runs: [ghRun(401, 'completed', 1)], artifacts: { 401: ['harness-state'] }, bundles: { 401: jobBundle(fx, 'r') } }),
    GITHUB_RUN_ID: '999',
    ...extra,
  };
}

test('restore places the previous bundle in job mode on --resume none', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'none'], restoreEnv(fx));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(mirror(fx, 'question_1.md'), 'utf8'), 'r question_1.md\n');
  assert.equal(readFileSync(join(fx.dir, WALKER), 'utf8'), 'r walker\n');
  assert.equal(JSON.parse(readFileSync(join(fx.dir, REMOTE_STATUS), 'utf8')).status, 'parked');
  assert.ok(joined(fx)[0].includes('--json databaseId,displayTitle,status,createdAt '), joined(fx)[0]);
  assert.deepEqual(downloads(fx), [`run download 401 -n harness-state -D ${join(fx.dir, STATE_DIR, 'autonomous_logs/remote_download/feat_x/401')}`]);
});

test('restore --resume answer writes each answer with its exact bytes', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'answer'],
    restoreEnv(fx, { HARNESS_INPUT_ANSWERS: JSON.stringify({ 1: 'Use B.\n' }) }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readFileSync(mirror(fx, 'answer_1.md')), Buffer.from('Use B.\n'));
});

test('restore --resume answer refuses an answer whose question is not at the top level, writing no answer', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'answer'],
    restoreEnv(fx, { HARNESS_INPUT_ANSWERS: JSON.stringify({ 1: 'yes\n', 2: 'no\n' }) }));
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /question_2\.md/);
  assert.ok(existsSync(mirror(fx, 'question_1.md')), 'the bundle was not restored first');
  assert.equal(existsSync(mirror(fx, 'answer_1.md')), false);
  assert.equal(existsSync(mirror(fx, 'answer_2.md')), false);
});

test('restore --resume answer refuses an answers input that is not an object of index keys to strings', async (t) => {
  const fx = await remoteFixture(t);
  for (const answers of ['', '[]', '{}', JSON.stringify({ '01': 'x' }), JSON.stringify({ a: 'x' }), JSON.stringify({ 1: 2 })]) {
    const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'answer'], restoreEnv(fx, { HARNESS_INPUT_ANSWERS: answers }));
    assert.equal(result.status, 2, `${answers}: ${result.stderr}`);
  }
  assert.deepEqual(calls(fx), []);
});

test('restore with park_loop_clear true sets park_loop_cycles to "0" in the restored status', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'pause'], restoreEnv(fx, { HARNESS_INPUT_PARK_LOOP_CLEAR: 'true' }));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(join(fx.dir, REMOTE_STATUS), 'utf8')).park_loop_cycles, '0');

  const kept = await remoteFixture(t);
  assert.equal((await remoteRun(kept, ['restore', 'feat_x', '--resume', 'none'], restoreEnv(kept))).status, 0);
  assert.equal(JSON.parse(readFileSync(join(kept.dir, REMOTE_STATUS), 'utf8')).park_loop_cycles, '2');
});

test('no previous run is a first job under none and a refusal under answer', async (t) => {
  const fx = await remoteFixture(t);
  const env = { ...syncEnv({ runs: [ghRun(401, 'in_progress', 1)] }), GITHUB_RUN_ID: '999' };
  const none = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'none'], env);
  assert.equal(none.status, 0, none.stderr);
  assert.match(none.stdout, /first job/);
  const answer = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'answer'], { ...env, HARNESS_INPUT_ANSWERS: JSON.stringify({ 1: 'x' }) });
  assert.equal(answer.status, 2, answer.stderr);
  assert.deepEqual(downloads(fx), []);
  assert.equal(existsSync(join(fx.dir, REMOTE_STATUS)), false);
});

test('restore never selects the current GITHUB_RUN_ID', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'none'], {
    ...syncEnv({
      runs: [ghRun(502, 'completed', 2), ghRun(501, 'completed', 1)],
      artifacts: { 501: ['harness-state'], 502: ['harness-state'] },
      bundles: { 501: jobBundle(fx, 'old'), 502: jobBundle(fx, 'self') },
    }),
    GITHUB_RUN_ID: '502',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(downloads(fx).map((line) => line.split(' ')[2]), ['501']);
  assert.equal(readFileSync(join(fx.dir, WALKER), 'utf8'), 'old walker\n');
});

test('restore usage errors exit 1 and call nothing', async (t) => {
  const fx = await remoteFixture(t);
  for (const args of [['restore', 'feat_x'], ['restore', 'feat_x', '--resume', 'later'], ['restore', '--resume', 'none']]) {
    const result = await remoteRun(fx, args);
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stderr}`);
  }
  assert.deepEqual(calls(fx), []);
});

test('save after a job-mode status write produces the full layout and a job-summary table', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx, { status: 'parked', engine: 'task' });
  const wrote = await runBash(fx.dir, ['-c',
    '. scripts/lib/harness-run-lib.sh && hr_remote_status_write "$1" feat_x "$2" stop "parked | on a question"',
    '_', REGISTRY, REMOTE_STATUS]);
  assert.equal(wrote.status, 0, wrote.stderr);
  mkdirSync(join(fx.dir, CLARIFY_DIR), { recursive: true });
  writeFileSync(mirror(fx, 'question_1.md'), 'q\n');
  writeFileSync(join(fx.dir, STATE_DIR, 'PAUSE_PROGRESS.md'), 'note\n');
  writeFileSync(join(fx.dir, WALKER), 'walker\n');
  writeFileSync(join(fx.dir, STATE_DIR, 'autonomous_logs/feat_x.log'), 'log\n');

  const out = join(fx.dir, STATE_DIR, 'stub', 'out');
  const summary = join(fx.dir, STATE_DIR, 'stub', 'summary.md');
  const result = await remoteRun(fx, ['save', 'feat_x', out], { GITHUB_STEP_SUMMARY: summary });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(out).sort(), ['PAUSE_PROGRESS.md', 'clarifications', 'flow_walker_state', 'run.log', 'status.json']);
  assert.ok(existsSync(join(out, 'clarifications/feat_x/question_1.md')));
  assert.equal(JSON.parse(readFileSync(join(out, 'status.json'), 'utf8')).decision, 'stop');
  const table = readFileSync(summary, 'utf8');
  assert.match(table, /\| status \| decision \| detail \|/);
  assert.match(table, /\| parked \| stop \| parked \\\| on a question \|/);
  assert.deepEqual(calls(fx), []);
});

test('save with no status and no registry leaves an empty bundle, and never fails', async (t) => {
  const fx = await remoteFixture(t);
  const out = join(fx.dir, STATE_DIR, 'stub', 'out');
  const summary = join(fx.dir, STATE_DIR, 'stub', 'summary.md');
  const result = await remoteRun(fx, ['save', 'feat_x', out], { GITHUB_STEP_SUMMARY: summary });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(out), []);
  assert.match(readFileSync(summary, 'utf8'), /never started/);
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false, 'save created a registry');

  for (const args of [['save', 'feat_x'], ['save', 'feat_x', out, '--repo', join(fx.dir, 'no-such-dir')]]) {
    const failed = await remoteRun(fx, args);
    assert.equal(failed.status, 0, `${args.join(' ')}: ${failed.stderr}`);
    assert.notEqual(failed.stderr, '');
  }
});
