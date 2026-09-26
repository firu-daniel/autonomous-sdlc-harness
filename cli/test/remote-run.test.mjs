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
 *
 * **For `continue` and `poll`, the rule is that a re-dispatch carries the bundle's own `chain` plus
 * one, and nothing is sent for a branch that is stopped, under `HARNESS_REMOTE_STOP`, or at the chain
 * limit**: a `continue` case records at most one `workflow run`, and a branch whose `harness stop` run
 * is newer than its newest `harness run` run gets no `workflow run` and no `workflow enable`. Most
 * cases replace the fixture's `autonomous-notify.sh` with a recorder, as the watcher suite does, so no
 * desktop banner fires; the failed-enable case keeps the real notifier and records through
 * `HARNESS_PUSH_CMD`, with `XDG_CONFIG_HOME` pointed into the fixture so no machine push file is read.
 *
 * **For the job's read verbs `pause-requested` and `run-created-at`, the rule is that a failed read is
 * exit 3 and never an answer**, so job mode, which pauses only on exit 0, cannot pause on a gh fault.
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
if (line.startsWith('run view')) process.stdout.write(process.env.STUB_RUN_VIEW || '{}');
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
  { databaseId: 11, displayTitle: 'harness run feat_x', status: 'in_progress' },
  { databaseId: 12, displayTitle: 'harness run feat_x', status: 'completed' },
  { databaseId: 13, displayTitle: 'harness run feat_x', status: 'queued' },
  { databaseId: 14, displayTitle: 'harness run feat_x', status: 'waiting' },
  { databaseId: 15, displayTitle: 'harness stop feat_x', status: 'queued' },
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
  assert.ok(!sent.includes('run cancel 15'), 'stop cancelled its own jobless marker run');

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

// ---------------------------------------------------------------------------
// continue and poll — closing the loop without the local machine.
// ---------------------------------------------------------------------------

const NOTIFY = 'scripts/autonomous-notify.sh';
const THIS_RUN = { GITHUB_RUN_ID: '900', GITHUB_SERVER_URL: 'https://github.com', GITHUB_REPOSITORY: 'o/r' };
/** The job running `continue`: run 900, still in progress, the newest `harness run feat_x`. */
const CURRENT_RUN = ghRun(900, 'in_progress', 5);

/** Replace the fixture's notifier with a recorder of event, branch, detail and exported slug. */
function recordNotifications(fx) {
  const notes = join(fx.dir, STATE_DIR, 'stub', 'notifications.tsv');
  writeFileSync(join(fx.dir, NOTIFY),
    `#!/usr/bin/env bash\nprintf '%s\\t%s\\t%s\\t%s\\n' "$1" "$2" "\${4-}" "\${HARNESS_REPO_SLUG-}" >> '${notes}'\n`,
    { mode: 0o755 });
  return () => (existsSync(notes) ? readFileSync(notes, 'utf8').split('\n').filter(Boolean).map((line) => {
    const [event, branch, detail, slug] = line.split('\t');
    return { event, branch, detail, slug };
  }) : []);
}

/** A bundle whose status.json carries the given fields over `bundle`'s defaults. */
function loopBundle(fx, name, fields) {
  const dir = bundle(fx, name);
  const status = JSON.parse(readFileSync(join(dir, 'status.json'), 'utf8'));
  const merged = { ...status, ...fields };
  for (const [key, value] of Object.entries(fields)) if (value === undefined) delete merged[key];
  writeFileSync(join(dir, 'status.json'), JSON.stringify(merged));
  return dir;
}

function continueEnv(runs = [CURRENT_RUN], extra = {}) {
  return { ...THIS_RUN, STUB_RUN_LIST: JSON.stringify(runs), ...extra };
}

const workflowRuns = (fx) => joined(fx).filter((line) => line.startsWith('workflow run'));
const enables = (fx) => joined(fx).filter((line) => line.startsWith('workflow enable'));

/** The per-case invariant: `continue` sends at most one `workflow run`. */
function atMostOneDispatch(fx) {
  assert.ok(workflowRuns(fx).length <= 1, joined(fx).join('\n'));
}

test('continue with no status.json notifies failed with the run URL and dispatches nothing', async (t) => {
  const fx = await remoteFixture(t);
  const notes = recordNotifications(fx);
  const empty = join(fx.dir, STATE_DIR, 'stub', 'empty');
  mkdirSync(empty, { recursive: true });
  const result = await remoteRun(fx, ['continue', 'feat_x', empty], continueEnv());
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(calls(fx), []);
  const sent = notes();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].event, 'failed');
  assert.ok(sent[0].detail.includes('https://github.com/o/r/actions/runs/900'), sent[0].detail);
});

test('continue under the chain limit re-dispatches with the bundle chain plus one, never HARNESS_INPUT_CHAIN', async (t) => {
  const fx = await remoteFixture(t);
  const notes = recordNotifications(fx);
  const b = loopBundle(fx, 'c', { decision: 'continue', status: 'running', chain: '5', engine: 'user_review' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv([CURRENT_RUN], { HARNESS_INPUT_CHAIN: '11' }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(workflowRuns(fx), [
    'workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=user_review -f resume=pause -f chain=6',
  ]);
  assert.ok(joined(fx)[0].startsWith('run list --workflow harness-run.yml --json databaseId,headBranch,displayTitle,status,createdAt'), joined(fx)[0]);
  assert.deepEqual(notes(), []);
});

test('continue with an unreadable chain notifies failed once and dispatches nothing', async (t) => {
  const fx = await remoteFixture(t);
  const notes = recordNotifications(fx);
  for (const [name, chain] of [['x', 'x'], ['absent', undefined], ['empty', '']]) {
    const b = loopBundle(fx, name, { decision: 'continue', chain });
    const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv([CURRENT_RUN], { HARNESS_INPUT_CHAIN: '0', HARNESS_REMOTE_SLUG: 'o/r' }));
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    atMostOneDispatch(fx);
  }
  assert.deepEqual(workflowRuns(fx), []);
  const sent = notes();
  assert.equal(sent.length, 3);
  for (const note of sent) {
    assert.equal(note.event, 'failed');
    assert.match(note.detail, /chain unreadable/);
    assert.equal(note.slug, 'o/r');
  }
});

test('continue at the chain limit notifies failed and dispatches nothing; one below it dispatches', async (t) => {
  const fx = await remoteFixture(t);
  const notes = recordNotifications(fx);
  const atDefault = loopBundle(fx, 'limit', { decision: 'continue', chain: '24' });
  assert.equal((await remoteRun(fx, ['continue', 'feat_x', atDefault], continueEnv())).status, 0);
  atMostOneDispatch(fx);
  assert.deepEqual(workflowRuns(fx), []);
  assert.equal(notes().length, 1);
  assert.equal(notes()[0].event, 'failed');
  assert.match(notes()[0].detail, /chain limit reached/);

  const atThree = loopBundle(fx, 'three', { decision: 'continue', chain: '3' });
  assert.equal((await remoteRun(fx, ['continue', 'feat_x', atThree], continueEnv([CURRENT_RUN], { HARNESS_MAX_CHAIN: '3' }))).status, 0);
  assert.deepEqual(workflowRuns(fx), []);
  assert.equal(notes().length, 2);

  const belowThree = loopBundle(fx, 'two', { decision: 'continue', chain: '2' });
  assert.equal((await remoteRun(fx, ['continue', 'feat_x', belowThree], continueEnv([CURRENT_RUN], { HARNESS_MAX_CHAIN: '3' }))).status, 0);
  assert.equal(workflowRuns(fx).length, 1);
  assert.ok(workflowRuns(fx)[0].endsWith('-f chain=3'), workflowRuns(fx)[0]);
});

test('continue with HARNESS_REMOTE_STOP set sends nothing and notifies paused once', async (t) => {
  const fx = await remoteFixture(t);
  const notes = recordNotifications(fx);
  const b = loopBundle(fx, 'c', { decision: 'continue', chain: '1' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv([CURRENT_RUN], { HARNESS_REMOTE_STOP: '1' }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(calls(fx), []);
  assert.equal(notes().length, 1);
  assert.equal(notes()[0].event, 'paused');
  assert.match(notes()[0].detail, /remote stop is set/);
});

test('continue on wait-poller enables the resume poller and notifies nothing', async (t) => {
  const fx = await remoteFixture(t);
  const notes = recordNotifications(fx);
  const b = loopBundle(fx, 'w', { decision: 'wait-poller', status: 'paused', pause_reason: 'usage', usage_resume_at: '9999999999' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv());
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(enables(fx), ['workflow enable harness-resume.yml']);
  assert.deepEqual(workflowRuns(fx), []);
  assert.deepEqual(notes(), []);
});

test('continue on wait-poller with a failing enable sends a paused notification through HARNESS_PUSH_CMD', async (t) => {
  const fx = await remoteFixture(t);
  const stubDir = join(fx.dir, STATE_DIR, 'stub');
  const body = join(stubDir, 'push-body');
  const title = join(stubDir, 'push-title');
  const b = loopBundle(fx, 'w', { decision: 'wait-poller', status: 'paused', pause_reason: 'usage' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv([CURRENT_RUN], {
    STUB_FAIL_ON: 'workflow enable',
    STUB_FAIL_STDERR: 'HTTP 403: Resource not accessible by integration',
    HARNESS_PUSH_CMD: `cat > '${body}'; printf %s "$HARNESS_PUSH_TITLE" > '${title}'`,
    HARNESS_PUSH_URL: '',
    XDG_CONFIG_HOME: join(stubDir, 'xdg'),
    HARNESS_REMOTE_SLUG: 'o/r',
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(workflowRuns(fx), []);
  assert.deepEqual(enables(fx), ['workflow enable harness-resume.yml']);
  const message = readFileSync(body, 'utf8');
  assert.match(message, /Auto-resume is unavailable/);
  assert.match(message, /HTTP 403: Resource not accessible by integration/);
  assert.match(message, /autonomous-sdlc-harness:branch-resume feat_x/);
  const heading = readFileSync(title, 'utf8');
  assert.ok(heading.startsWith('[o/r] '), heading);
  assert.match(heading, /paused/i);
});

test('continue on decision stop sends nothing and notifies nothing', async (t) => {
  const fx = await remoteFixture(t);
  const notes = recordNotifications(fx);
  const b = loopBundle(fx, 's', { decision: 'stop', status: 'completed' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv());
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(calls(fx), []);
  assert.deepEqual(notes(), []);
});

test('continue for a stopped branch sends no workflow run and no enable, and notifies nothing, in either arm', async (t) => {
  const fx = await remoteFixture(t);
  const notes = recordNotifications(fx);
  const runs = [ghRun(901, 'completed', 6, 'harness stop feat_x'), CURRENT_RUN];
  for (const [name, decision] of [['c', 'continue'], ['w', 'wait-poller']]) {
    const b = loopBundle(fx, name, { decision, chain: '1', status: 'paused', pause_reason: 'usage' });
    const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv(runs));
    assert.equal(result.status, 0, `${decision}: ${result.stderr}`);
    assert.match(result.stdout, /stopped/);
  }
  assert.deepEqual(workflowRuns(fx), []);
  assert.deepEqual(enables(fx), []);
  assert.deepEqual(notes(), []);
});

test('continue with a failing run list fails closed: nothing sent, one paused notification', async (t) => {
  const fx = await remoteFixture(t);
  const notes = recordNotifications(fx);
  const b = loopBundle(fx, 'c', { decision: 'continue', chain: '1' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv([CURRENT_RUN], {
    STUB_FAIL_ON: 'run list', STUB_FAIL_STDERR: 'HTTP 502: bad gateway',
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(workflowRuns(fx), []);
  assert.equal(notes().length, 1);
  assert.equal(notes()[0].event, 'paused');
  assert.match(notes()[0].detail, /HTTP 502: bad gateway/);
  assert.match(notes()[0].detail, /autonomous-sdlc-harness:branch-resume feat_x/);
});

/** A usage-paused bundle; `due` puts its reset in the past. */
function usageBundle(fx, name, due, chain = '2') {
  return loopBundle(fx, name, {
    decision: 'wait-poller', status: 'paused', pause_reason: 'usage', chain,
    usage_resume_at: due ? '1' : '9999999999',
  });
}

test('poll dispatches the due branch and keeps the poller for the one still waiting', async (t) => {
  const fx = await remoteFixture(t);
  recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], syncEnv({
    runs: [ghRun(702, 'completed', 2, 'harness run feat_b'), ghRun(701, 'completed', 1, 'harness run feat_a')],
    artifacts: { 701: ['harness-state'], 702: ['harness-state'] },
    bundles: { 701: usageBundle(fx, 'a', true), 702: usageBundle(fx, 'b', false) },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(workflowRuns(fx), [
    'workflow run harness-run.yml --ref feat_a -f action=run -f branch=feat_a -f engine=task -f resume=pause -f chain=3',
  ]);
  assert.equal(joined(fx).filter((line) => line.startsWith('workflow disable')).length, 0);
  assert.equal(downloads(fx).length, 2);
  assert.ok(existsSync(join(fx.dir, STATE_DIR, 'autonomous_logs/remote_download/feat_a/701/status.json')));
});

test('poll with only a due branch dispatches it, then disables the poller', async (t) => {
  const fx = await remoteFixture(t);
  recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], syncEnv({
    runs: [ghRun(701, 'completed', 1, 'harness run feat_a')],
    artifacts: { 701: ['harness-state'] },
    bundles: { 701: usageBundle(fx, 'a', true) },
  }));
  assert.equal(result.status, 0, result.stderr);
  const sent = joined(fx).filter((line) => line.startsWith('workflow '));
  assert.deepEqual(sent, [
    'workflow run harness-run.yml --ref feat_a -f action=run -f branch=feat_a -f engine=task -f resume=pause -f chain=3',
    'workflow disable harness-resume.yml',
  ]);
});

test('poll with HARNESS_REMOTE_STOP set sends nothing', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['poll'], {
    ...syncEnv({ runs: [ghRun(701, 'completed', 1, 'harness run feat_a')], artifacts: { 701: ['harness-state'] }, bundles: { 701: usageBundle(fx, 'a', true) } }),
    HARNESS_REMOTE_STOP: '1',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(calls(fx), []);
});

test('poll skips a due branch whose harness stop run is newer, and disables itself when it was the only one waiting', async (t) => {
  const fx = await remoteFixture(t);
  recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], syncEnv({
    runs: [ghRun(802, 'completed', 2, 'harness stop feat_x'), ghRun(801, 'completed', 1)],
    artifacts: { 801: ['harness-state'] },
    bundles: { 801: usageBundle(fx, 'x', true) },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(workflowRuns(fx), []);
  assert.deepEqual(downloads(fx), []);
  assert.deepEqual(joined(fx).filter((line) => line.startsWith('workflow ')), ['workflow disable harness-resume.yml']);
});

test('poll dispatches a due branch whose harness stop run is older than its newest harness run', async (t) => {
  const fx = await remoteFixture(t);
  recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], syncEnv({
    runs: [ghRun(802, 'completed', 2), ghRun(801, 'completed', 1, 'harness stop feat_x')],
    artifacts: { 802: ['harness-state'] },
    bundles: { 802: usageBundle(fx, 'x', true) },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(workflowRuns(fx), [
    'workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=task -f resume=pause -f chain=3',
  ]);
});

/** 2026-01-01T00:00:10Z, as an epoch second. */
const PAUSE_CREATED = 1767225610;
const PAUSE_RUNS = JSON.stringify([
  { databaseId: 5, displayTitle: 'harness run feat_x', status: 'in_progress', createdAt: '2026-01-01T00:01:00Z' },
  { databaseId: 6, displayTitle: 'harness pause feat_xy', status: 'completed', createdAt: '2026-01-01T00:01:00Z' },
  { databaseId: 7, displayTitle: 'harness pause feat_x', status: 'completed', createdAt: '2026-01-01T00:00:10Z' },
]);

test('pause-requested: 0 for an exact-title run at or after the epoch, 1 for none, 3 when gh fails', async (t) => {
  const fx = await remoteFixture(t, 'local');
  const env = { STUB_RUN_LIST: PAUSE_RUNS };
  for (const [since, expected] of [[PAUSE_CREATED - 10, 0], [PAUSE_CREATED, 0], [PAUSE_CREATED + 1, 1]]) {
    const result = await remoteRun(fx, ['pause-requested', 'feat_x', String(since)], env);
    assert.equal(result.status, expected, `since ${since}: ${result.stdout}\n${result.stderr}`);
  }
  assert.ok(joined(fx).every((line) => line.startsWith('run list --workflow harness-run.yml --branch feat_x')), joined(fx).join('\n'));

  const failed = await remoteRun(fx, ['pause-requested', 'feat_x', '0'], { ...env, STUB_FAIL_ON: 'run list' });
  assert.equal(failed.status, 3, failed.stderr);
  const garbled = await remoteRun(fx, ['pause-requested', 'feat_x', '0'], { STUB_RUN_LIST: 'not json' });
  assert.equal(garbled.status, 3, garbled.stderr);
});

test('run-created-at prints the run createdAt as an epoch second, or exits 3', async (t) => {
  const fx = await remoteFixture(t, 'local');
  const result = await remoteRun(fx, ['run-created-at', '42'], { STUB_RUN_VIEW: '{"createdAt":"2026-01-01T00:00:10Z"}' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `${PAUSE_CREATED}\n`);
  assert.deepEqual(joined(fx), ['run view 42 --json createdAt']);

  for (const env of [{ STUB_FAIL_ON: 'run view' }, { STUB_RUN_VIEW: '{}' }]) {
    const failed = await remoteRun(fx, ['run-created-at', '42'], env);
    assert.equal(failed.status, 3, failed.stderr);
    assert.equal(failed.stdout, '');
  }
});

test('the read verbs refuse bad arguments with exit 1 and call nothing', async (t) => {
  const fx = await remoteFixture(t);
  for (const args of [['pause-requested', 'feat_x'], ['pause-requested', 'feat_x', 'x'], ['run-created-at'], ['run-created-at', '0'], ['run-created-at', '4', '5']]) {
    const result = await remoteRun(fx, args);
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stderr}`);
  }
  assert.deepEqual(calls(fx), []);
});
