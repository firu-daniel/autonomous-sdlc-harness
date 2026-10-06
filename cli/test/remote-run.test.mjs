/**
 * `remote-run.sh`'s sending verbs — `dispatch`, `pause`, `warm` and `stop` — against a fixture `init`
 * wired, with `gh` replaced by a recorder stub through `HARNESS_GH_CLI`.
 *
 * **The rule these tests exist to enforce: the script is the one shell-side producer of the run
 * workflow's inputs, so each verb sends exactly the argument vector the input contract states, a
 * refusal sends nothing at all, and `stop` always sends its `action=stop` marker before any cancel —
 * whether or not a run is in progress.** No case reaches the network: the stub is a Node script that
 * appends its argument vector, as one JSON line, to a log, prints canned JSON for `run list`,
 * `repo view`, a run's artifact list, a run's jobs (`STUB_JOBS`) and a check run's annotations
 * (`STUB_ANNOTATIONS`) — the last two empty when unset — and materialises a fixture bundle on
 * `run download`.
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
 * `save` exits 0 whatever it met. An uncommitted planning draft crosses a job boundary only into a
 * job checkout, and never over a file that checkout already has. **A previous job is one of the
 * branch's current lineage**: a run whose `headSha` is not a commit of `origin/<defaultBranch>..HEAD`
 * is never restored, so a branch recreated under a reused name is a first job, while a resume, a
 * user-review round or a chain on the branch's own commits still restores its own bundle; a checkout
 * with no commit beyond `origin/<defaultBranch>` — every fixture that commits nothing — selects
 * unbounded and says so. The lineage cases commit on a local `feat_x` in the fixture itself.
 *
 * **For `continue` and `poll`, the rule is that a re-dispatch carries the bundle's own `chain` plus
 * one, and nothing is sent for a branch that is stopped, deleted on `origin`, under
 * `HARNESS_REMOTE_STOP`, or at the chain limit**: a `continue` case records at most one `workflow run`,
 * and a branch whose `harness stop` run is newer than its newest `harness run` run, or that the
 * fixture's bare `origin` no longer has, gets no `workflow run` and no `workflow enable`. These cases
 * run on `loopFixture`, which puts every branch they name on `origin` first. A
 * `poll` never dispatches a run that is not yet `completed`, counts one carrying a usage-paused
 * bundle as waiting, and after its own disable re-lists once and re-enables the poller when such a
 * run appeared meanwhile — never for a running job with no bundle. The stub models "meanwhile": once
 * its log holds a `workflow disable`, it answers `run list` and the artifact list from
 * `STUB_RUN_LIST_AFTER_DISABLE` and `STUB_ARTIFACTS_AFTER_DISABLE` when those are set. A dispatch
 * that keeps failing is retried until a count or a deadline bound, then notified once and no longer
 * waiting; the count is carried between ticks the way GitHub carries it — the test copies a tick's
 * `poll_state/current/` aside and serves it as the next tick's `harness-poll-state` artifact, listed
 * under `STUB_RESUME_RUN_LIST`, and `STUB_FAIL_TIMES` fails `STUB_FAIL_ON` only for its first calls
 * as counted in the stub's own log. A completed run's listed bundle that cannot be downloaded keeps the
 * poller enabled under its own consecutive count, and at the bound sends one push-only
 * `bundle_unreadable` with no issue write; a completed run with no bundle whose `run` job never
 * started is not waiting and reported by nothing here. Most
 * cases replace the fixture's `autonomous-notify.sh` with a recorder, as the watcher suite does, so no
 * desktop banner fires; the failed-enable case keeps the real notifier and records through
 * `HARNESS_PUSH_CMD`, with `XDG_CONFIG_HOME` pointed into the fixture so no machine push file is read.
 *
 * **For the forge coupling, the rule is that `continue`'s notification and a complete `stop` reach the
 * run's issue as a comment naming no slash command, plus the state label, while a partial stop and a
 * coupling that is off post nothing**: every pre-existing case runs with `forge` unset and keeps its
 * exact call list. The stub answers `pr list` with `STUB_PRS` (`[]` when unset), a paginated comment
 * list with `STUB_ITEM_COMMENTS` (item number to comments) when set, an issue's label read with `STUB_LABELS`
 * (`[]` when unset), a `contents/` read
 * with `STUB_CONTENTS` (a 404 when unset), and logs each `body=@<path>` call with that file's content
 * to `<log>.bodies`. A `stop --pr <n>` reports on #<n> though no open pull request is listed, and a
 * `stop --branch-gone` on a branch origin no longer has marks on GitHub's default branch, reads its
 * issue at the newest run's `headSha` and never offers `resume`.
 *
 * **For an expired state bundle, the rule is that it is told from an absent one and never read as a
 * first job**: a `STUB_ARTIFACTS` entry is a name (listed unexpired) or a whole `{name, expired,
 * expires_at}` artifact. `restore` stops at an expired bundle rather than falling back to an older
 * copy, `sync` records `paused` / `expired` with the way on, and `status` names the expiry and writes
 * nothing.
 *
 * **For the job's read verbs `pause-requested` and `run-created-at`, the rule is that a failed read is
 * exit 3 and never an answer**, so job mode, which pauses only on exit 0, cannot pause on a gh fault;
 * `pause-requested`'s "no pause" is exit 5, so a usage refusal (exit 1) is never read as one.
 *
 * **For the commands' `fetch`, the rule is that it reads a branch's newest state from GitHub alone and
 * writes nothing but its `<out_dir>`**; its `key: value` lines are a wire, so each case asserts the
 * keys it reads. A finished run with no bundle whose `run` job GitHub never started keeps its case's
 * state and gets a detail naming GitHub's reason; a failed jobs lookup changes nothing but stderr.
 * **No verb makes a run started on GitHub local: `adopt` is an unknown verb, so no
 * command can create a working copy or a record for another branch through it.** **A user's chain-0
 * resume dispatch marks an existing remote record `running`, and
 * no other dispatch creates or touches a registry.** **For `review`, the rule is that a round lands
 * on the branch tip only when no run is in flight, named by exact branch equality, committed under
 * its fixed subject and dispatched once — leaving no copy, no local branch and no bootstrap behind —
 * a branch with no run listed taking one only under `--allow-no-run`, and under `forge` `github` the
 * round reported on the run's issue after the dispatch**;
 * those cases push to the fixture's bare `origin`, as `remote-start.test.mjs` does. The bootstrap
 * sentinel is a `commands.depInstall` writing a marker outside the copy, because the copy itself is
 * removed before the case can look in it.
 *
 * **For the commands' `discard`, the rule is that it removes a directory only when it resolves
 * strictly inside `<state_dir>/scratch/` and is not a symlink, and calls no `gh`**: every refused
 * path — the scratch directory itself, a sibling under the state directory, a `..`, an absolute path
 * outside the fixture, a symlink out of scratch, or a file — exits 2 with the fixture and the outside directory
 * byte-identical, and a removed branch directory leaves `scratch/` listing as it did before.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit, snapshotTree } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REGISTRY = `${STATE_DIR}/autonomous_logs/registry.json`;
const CLARIFY_DIR = `${STATE_DIR}/clarifications/feat_x`;

/** The documented `workflow_dispatch` inputs limit the script refuses above. */
const PAYLOAD_MAX = 65535;

const STUB = `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require('node:fs');
const args = process.argv.slice(2);
const disabled = (() => {
  try { return readFileSync(process.env.STUB_LOG, 'utf8').includes('["workflow","disable"'); } catch { return false; }
})();
const after = (name) => (disabled && process.env[name + '_AFTER_DISABLE'] !== undefined
  ? process.env[name + '_AFTER_DISABLE'] : process.env[name]);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
const bodyAt = args.findIndex((arg) => arg.startsWith('body=@'));
if (bodyAt >= 0) {
  const body = readFileSync(args[bodyAt].slice('body=@'.length), 'utf8');
  appendFileSync(process.env.STUB_LOG + '.bodies', JSON.stringify({ args, body }) + '\\n');
}
const line = args.join(' ');
const failOn = process.env.STUB_FAIL_ON;
const failTimes = process.env.STUB_FAIL_TIMES;
const failedSoFar = () => readFileSync(process.env.STUB_LOG, 'utf8').split('\\n').filter(Boolean)
  .filter((entry) => JSON.parse(entry).join(' ').startsWith(failOn)).length;
if (failOn && line.startsWith(failOn) && (failTimes === undefined || failedSoFar() <= Number(failTimes))) {
  process.stderr.write((process.env.STUB_FAIL_STDERR || 'stub failure') + '\\nsecond line\\n');
  process.exit(4);
}
if (line.startsWith('run list --workflow harness-resume.yml')) process.stdout.write(process.env.STUB_RESUME_RUN_LIST || '[]');
else if (line.startsWith('run list')) process.stdout.write(after('STUB_RUN_LIST') || '[]');
if (line.startsWith('repo view')) process.stdout.write(process.env.STUB_REPO_VIEW || '{}');
if (line.startsWith('run view')) process.stdout.write(process.env.STUB_RUN_VIEW || '{}');
if (line.startsWith('pr list')) process.stdout.write(process.env.STUB_PRS || '[]');
if (args[0] === 'api' && args[1] === '--paginate' && process.env.STUB_ITEM_COMMENTS !== undefined) {
  const item = /\\/issues\\/([0-9]+)\\/comments$/.exec(args[2] ?? '')?.[1];
  for (const c of JSON.parse(process.env.STUB_ITEM_COMMENTS)[item] ?? []) {
    process.stdout.write(JSON.stringify({ login: c.user.login, at: c.created_at, body: c.body }) + '\\n');
  }
}
else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/issues\\/[0-9]+\\/labels$/.test(args[1])) process.stdout.write(process.env.STUB_LABELS || '[]');
else if (args[0] === 'api' && args[1].includes('/contents/')) {
  if (process.env.STUB_CONTENTS === undefined) { process.stderr.write('HTTP 404: Not Found\\n'); process.exit(1); }
  process.stdout.write(process.env.STUB_CONTENTS);
}
else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/actions\\/runs\\/[0-9]+\\/jobs$/.test(args[1])) {
  const id = args[1].split('/')[5];
  process.stdout.write(JSON.stringify({ jobs: JSON.parse(process.env.STUB_JOBS || '{}')[id] || [] }));
}
else if (args[0] === 'api' && /^repos\\/[^/]+\\/[^/]+\\/check-runs\\/[0-9]+\\/annotations$/.test(args[1])) {
  const id = args[1].split('/')[4];
  process.stdout.write(JSON.stringify(JSON.parse(process.env.STUB_ANNOTATIONS || '{}')[id] || []));
}
else if (args[0] === 'api') {
  const parts = args[1].split('/');
  const id = parts[parts.length - 2];
  const names = JSON.parse(after('STUB_ARTIFACTS') || '{}')[id] || [];
  process.stdout.write(JSON.stringify({ artifacts: names.map((entry) => (typeof entry === 'string' ? { name: entry, expired: false } : entry)) }));
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
  // `init`'s first commit is not a descendant of the seeded origin, so it would read as a lineage of its
  // own; with `origin/<defaultBranch>` at HEAD, `restore` selects unbounded as it did before the bound.
  const head = await runGit(dir, ['rev-parse', '--verify', '--quiet', 'HEAD']);
  if (head.status === 0) {
    await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);
  }

  // Beside the fixture's state directory, which is gitignored, so the stub is never part of a snapshot.
  const stubDir = join(dir, STATE_DIR, 'stub');
  mkdirSync(stubDir, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  return { dir, stub, log: join(stubDir, 'gh.log') };
}

/** Run the script from the fixture root with the stub as `gh`. */
function remoteRun(fx, args, env = {}) {
  return runBash(fx.dir, [SCRIPT, ...args], { HARNESS_GH_CLI: fx.stub, STUB_LOG: fx.log, HARNESS_TRIGGER_LOOKUP_SECS: '0', ...env });
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

test('a relative --answers-from resolves against the caller\'s directory, not the main checkout', async (t) => {
  const fx = await remoteFixture(t);
  const sub = join(fx.dir, 'caller');
  mkdirSync(join(sub, 'answers'), { recursive: true });
  writeFileSync(join(sub, 'answers', 'answer_1.md'), 'Use B.\n');
  const result = await runBash(sub, [join(fx.dir, SCRIPT),
    'dispatch', 'feat_x', '--engine', 'task', '--resume', 'answer',
    '--answers-from', 'answers', '--indexes', '1',
  ], { HARNESS_GH_CLI: fx.stub, STUB_LOG: fx.log });
  assert.equal(result.status, 0, result.stderr);
  const [argv] = calls(fx);
  const answersArgs = argv.filter((arg) => arg.startsWith('answers='));
  assert.equal(answersArgs.length, 1, 'expected exactly one answers input');
  assert.equal(execFileSync('jq', ['-j', '.["1"]'], { input: answersArgs[0].slice('answers='.length), encoding: 'utf8' }), 'Use B.\n');
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
function ghRun(id, status, minute, title = 'harness run feat_x', headSha = undefined) {
  return {
    databaseId: id,
    displayTitle: title,
    status,
    conclusion: status === 'completed' ? 'success' : null,
    createdAt: `2026-01-01T00:${String(minute).padStart(2, '0')}:00Z`,
    url: runUrl(id),
    ...(headSha === undefined ? {} : { headSha }),
  };
}

/** A remote registry record whose mirror is the fixture itself. */
function remoteRecord(fx, extra = {}) {
  mkdirSync(join(fx.dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
  const record = { branch: 'feat_x', status: 'running', execution: 'github-actions', worktree: fx.dir, ...extra };
  writeFileSync(join(fx.dir, REGISTRY), JSON.stringify({ runs: { feat_x: record } }));
}

/** A bundle directory in Task 4's format, under the stub's directory, for `run download` to copy. */
function bundle(fx, name, { status = 'parked', questions = ['question_1.md'], detail = 'parked on a question', engine = 'task' } = {}) {
  const dir = join(fx.dir, STATE_DIR, 'stub', 'bundles', name);
  mkdirSync(join(dir, 'clarifications', 'feat_x'), { recursive: true });
  writeFileSync(join(dir, 'status.json'), JSON.stringify({
    schema: '1', branch: 'feat_x', engine, status, pause_reason: '', usage_resume_at: '',
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

test('sync takes the engine the downloaded bundle names', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx, { engine: 'task' });
  const env = syncEnv({ runs: [ghRun(101, 'completed', 1)], artifacts: { 101: ['harness-state'] }, bundles: { 101: bundle(fx, 'e', { engine: 'docs' }) } });
  const result = await remoteRun(fx, ['sync', 'feat_x'], env);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(record(fx).engine, 'docs');
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

test('sync with the newest bundle expired records paused / expired with the way on, restoring nothing', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx);
  const result = await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(102, 'completed', 2), ghRun(101, 'completed', 1)],
    artifacts: { 101: ['harness-state'], 102: [{ name: 'harness-state', expired: true, expires_at: '2026-01-02T00:00:00Z' }] },
    bundles: { 101: bundle(fx, 'a'), 102: bundle(fx, 'b') },
  }));
  assert.equal(result.status, 0, result.stderr);
  const rec = record(fx);
  assert.equal(rec.status, 'paused');
  assert.equal(rec.pause_reason, 'expired');
  assert.equal(rec.remote_run_id, '102');
  assert.equal(rec.remote_run_url, runUrl(102));
  assert.equal(rec.remote_detail, 'the state bundle of run 102 expired on 2026-01-02T00:00:00Z: resume from the committed ledger with /autonomous-sdlc-harness:branch-resume feat_x, or re-drop the task');
  assert.deepEqual(downloads(fx), []);
  assert.equal(existsSync(mirror(fx, 'question_1.md')), false);
});

test('sync of an already-applied parked record whose bundle has since expired flips it to paused / expired', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx);
  const a = bundle(fx, 'a');
  assert.equal((await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(101, 'completed', 1)], artifacts: { 101: ['harness-state'] }, bundles: { 101: a },
  }))).status, 0);
  assert.equal(record(fx).status, 'parked');

  const result = await remoteRun(fx, ['sync', 'feat_x'], syncEnv({
    runs: [ghRun(101, 'completed', 1)],
    artifacts: { 101: [{ name: 'harness-state', expired: true, expires_at: '2026-01-02T00:00:00Z' }] },
    bundles: { 101: a },
  }));
  assert.equal(result.status, 0, result.stderr);
  const rec = record(fx);
  assert.equal(rec.status, 'paused');
  assert.equal(rec.pause_reason, 'expired');
  assert.equal(rec.remote_run_id, '101');
  assert.ok(rec.remote_detail.includes('/autonomous-sdlc-harness:branch-resume feat_x'), rec.remote_detail);
  assert.ok(existsSync(mirror(fx, 'question_1.md')), 'the mirror question files were removed');
  assert.equal(downloads(fx).length, 1);
});

test('status prints the expired line and leaves every file under the state directory byte-identical', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx, { status: 'parked', remote_run_id: '101', remote_run_url: runUrl(101), remote_synced_at: '5' });
  const before = await snapshotTree(fx.dir, { exclude: ['.git', 'stub'] });
  const registryBefore = readFileSync(join(fx.dir, REGISTRY));

  const result = await remoteRun(fx, ['status', 'feat_x'], syncEnv({
    runs: [ghRun(101, 'completed', 1)],
    artifacts: { 101: [{ name: 'harness-state', expired: true, expires_at: '2026-01-02T00:00:00Z' }] },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /the state bundle of run 101 expired on 2026-01-02T00:00:00Z: resume from the committed ledger with \/autonomous-sdlc-harness:branch-resume feat_x/);
  assert.deepEqual(readFileSync(join(fx.dir, REGISTRY)), registryBefore);
  assert.deepEqual(await snapshotTree(fx.dir, { exclude: ['.git', 'stub'] }), before);
});

test('status and sync refuse a local record, and sync refuses no record, with exit 2 and call nothing', async (t) => {
  const fx = await remoteFixture(t);
  const absent = await remoteRun(fx, ['sync', 'feat_x']);
  assert.equal(absent.status, 2, absent.stderr);
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
  assert.ok(joined(fx)[0].includes('--json databaseId,displayTitle,status,createdAt,headSha '), joined(fx)[0]);
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
  assert.equal(existsSync(mirror(fx, 'question_1.md')), false, 'the bundle was restored before the refusal');
  assert.equal(existsSync(join(fx.dir, REMOTE_STATUS)), false);
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

/** A commit no lineage in these fixtures carries: an earlier, unrelated branch of the same name. */
const FOREIGN_SHA = '0123456789abcdef0123456789abcdef01234567';
const LINEAGE_PROMPT = `${STATE_DIR}/task_prompts/feat_x_task_prompt.md`;
const LINEAGE_DRAFT = `${STATE_DIR}/story_plans/feat_x_story_plan.md`;

/**
 * A remote fixture adopted on `origin/<defaultBranch>` and checked out on a local `feat_x` carrying
 * `commits` commits beyond it, the first a task prompt; returns their SHAs, oldest first.
 */
async function lineageFixture(t, commits) {
  const fx = await remoteFixture(t);
  const { dir } = fx;
  const { defaultBranch } = JSON.parse(readFileSync(join(dir, 'harness.config.json'), 'utf8'));
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${defaultBranch}`]);
  const tracking = await runGit(dir, ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${defaultBranch}`]);
  if (tracking.status !== 0) await runGit(dir, ['fetch', '--quiet', 'origin', defaultBranch]);
  await runGit(dir, ['checkout', '--quiet', '-b', 'feat_x']);
  const shas = [];
  for (let i = 0; i < commits; i += 1) {
    const file = i === 0 ? LINEAGE_PROMPT : `${STATE_DIR}/task_prompts/feat_x_note_${i}.md`;
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), `# feat_x ${i}\n`);
    await runGit(dir, ['add', '--force', file]);
    await runGit(dir, ['commit', '--quiet', '-m', i === 0 ? 'chore: add task prompt for feat_x' : `fixture: commit ${i}`]);
    shas.push((await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim());
  }
  return { ...fx, defaultBranch, shas };
}

/** A job bundle that also carries a planning draft, so a restore of it would place one. */
function plannedBundle(fx, name) {
  const dir = jobBundle(fx, name);
  mkdirSync(join(dir, 'planning', 'story_plans'), { recursive: true });
  writeFileSync(join(dir, 'planning', 'story_plans', 'feat_x_story_plan.md'), `${name} draft\n`);
  return dir;
}

test('restore on a recreated branch skips the earlier lineage\'s run: a first job, and a refusal under answer', async (t) => {
  const fx = await lineageFixture(t, 1);
  const env = {
    ...syncEnv({
      runs: [ghRun(601, 'completed', 1, 'harness run feat_x', FOREIGN_SHA)],
      artifacts: { 601: ['harness-state'] },
      bundles: { 601: plannedBundle(fx, 'stale') },
    }),
    GITHUB_RUN_ID: '999',
  };
  const none = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'none'], env);
  assert.equal(none.status, 0, none.stderr);
  assert.match(none.stdout, /skipped 1 finished run\(s\) of feat_x from before its current lineage/);
  assert.match(none.stdout, /this is its first job/);
  assert.deepEqual(downloads(fx), []);
  assert.equal(existsSync(join(fx.dir, REMOTE_STATUS)), false);
  assert.equal(existsSync(join(fx.dir, LINEAGE_DRAFT)), false);
  assert.equal(existsSync(join(fx.dir, WALKER)), false);

  const answer = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'answer'], { ...env, HARNESS_INPUT_ANSWERS: JSON.stringify({ 1: 'x' }) });
  assert.equal(answer.status, 2, answer.stderr);
  assert.match(answer.stderr, /no finished run of feat_x's current lineage carries a state bundle/);
  assert.deepEqual(downloads(fx), []);
  assert.equal(existsSync(mirror(fx, 'answer_1.md')), false);
});

test('restore of a branch resumed in its own lineage downloads exactly its own run', async (t) => {
  const fx = await lineageFixture(t, 1);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'pause'], {
    ...syncEnv({
      runs: [ghRun(602, 'completed', 2, 'harness run feat_x', fx.shas[0]), ghRun(601, 'completed', 1, 'harness run feat_x', FOREIGN_SHA)],
      artifacts: { 601: ['harness-state'], 602: ['harness-state'] },
      bundles: { 601: jobBundle(fx, 'stale'), 602: jobBundle(fx, 'own') },
    }),
    GITHUB_RUN_ID: '999',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(downloads(fx).map((line) => line.split(' ')[2]), ['602']);
  assert.equal(readFileSync(join(fx.dir, WALKER), 'utf8'), 'own walker\n');
  assert.equal(readFileSync(mirror(fx, 'question_1.md'), 'utf8'), 'own question_1.md\n');
  assert.doesNotMatch(result.stdout, /first job/);
});

test('restore selects a run dispatched on an earlier own commit of a branch with two', async (t) => {
  const fx = await lineageFixture(t, 2);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'pause'], {
    ...syncEnv({
      runs: [ghRun(701, 'completed', 1, 'harness run feat_x', fx.shas[0])],
      artifacts: { 701: ['harness-state'] },
      bundles: { 701: jobBundle(fx, 'first') },
    }),
    GITHUB_RUN_ID: '999',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(downloads(fx).map((line) => line.split(' ')[2]), ['701']);
  assert.equal(readFileSync(join(fx.dir, WALKER), 'utf8'), 'first walker\n');
  assert.doesNotMatch(result.stdout, /skipped/);
});

test('restore with HEAD at origin/<defaultBranch> selects unbounded and says so', async (t) => {
  const fx = await lineageFixture(t, 0);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'none'], {
    ...syncEnv({
      runs: [ghRun(801, 'completed', 1, 'harness run feat_x', FOREIGN_SHA)],
      artifacts: { 801: ['harness-state'] },
      bundles: { 801: jobBundle(fx, 'any') },
    }),
    GITHUB_RUN_ID: '999',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(
    `the lineage of feat_x is not bounded (HEAD carries no commit beyond origin/${fx.defaultBranch}); every finished run of it is a candidate`,
  ), result.stdout);
  assert.deepEqual(downloads(fx).map((line) => line.split(' ')[2]), ['801']);
  assert.equal(readFileSync(join(fx.dir, WALKER), 'utf8'), 'any walker\n');
});

const EXPIRES_AT = '2026-01-02T00:00:00Z';
const EXPIRED_STATE = { name: 'harness-state', expired: true, expires_at: EXPIRES_AT };

/** Run 402 finished newest with an expired bundle; the older run 401 still carries one. */
function expiredRestoreEnv(fx, extra = {}) {
  return {
    ...syncEnv({
      runs: [ghRun(402, 'completed', 2), ghRun(401, 'completed', 1)],
      artifacts: { 401: ['harness-state'], 402: [EXPIRED_STATE] },
      bundles: { 401: jobBundle(fx, 'older'), 402: jobBundle(fx, 'gone') },
    }),
    GITHUB_RUN_ID: '999',
    ...extra,
  };
}

test('restore --resume answer with the newest bundle expired exits 2 naming the expiry, writing and downloading nothing', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'answer'],
    expiredRestoreEnv(fx, { HARNESS_INPUT_ANSWERS: JSON.stringify({ 1: 'yes\n' }) }));
  assert.equal(result.status, 2, result.stderr);
  assert.ok(result.stderr.includes(`run 402 expired on ${EXPIRES_AT}`), result.stderr);
  assert.ok(result.stderr.includes('/autonomous-sdlc-harness:branch-resume feat_x'), result.stderr);
  assert.deepEqual(downloads(fx), []);
  assert.equal(existsSync(mirror(fx, 'answer_1.md')), false);
  assert.equal(existsSync(join(fx.dir, REMOTE_STATUS)), false);
});

test('restore --resume pause with the newest bundle expired warns, restores nothing, and never falls back to an older bundle', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['restore', 'feat_x', '--resume', 'pause'], expiredRestoreEnv(fx));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^::warning::.*run 402 expired on 2026-01-02T00:00:00Z.*planning drafts.*committed ledger/m);
  assert.doesNotMatch(result.stdout, /first job/);
  assert.deepEqual(downloads(fx), []);
  assert.equal(existsSync(join(fx.dir, REMOTE_STATUS)), false);
  assert.equal(existsSync(join(fx.dir, WALKER)), false);
  assert.equal(existsSync(mirror(fx, 'question_1.md')), false);
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

test('save moves aside a restored status.json whose run_id is not this job\'s, and continue then fails without dispatching', async (t) => {
  const fx = await remoteFixture(t);
  mkdirSync(join(fx.dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
  writeFileSync(join(fx.dir, REMOTE_STATUS), JSON.stringify({
    schema: '1', branch: 'feat_x', status: 'paused', decision: 'continue', chain: '3', run_id: '111',
  }));
  const out = join(fx.dir, STATE_DIR, 'stub', 'out');
  const saved = await remoteRun(fx, ['save', 'feat_x', out], { GITHUB_RUN_ID: '222' });
  assert.equal(saved.status, 0, saved.stderr);
  assert.deepEqual(readdirSync(out), []);
  assert.ok(existsSync(join(fx.dir, `${REMOTE_STATUS}.previous`)), saved.stderr);
  assert.equal(existsSync(join(fx.dir, REMOTE_STATUS)), false);

  const notes = recordNotifications(fx);
  const cont = await remoteRun(fx, ['continue', 'feat_x', out], continueEnv());
  assert.equal(cont.status, 0, cont.stderr);
  assert.deepEqual(workflowRuns(fx), []);
  const sent = notes();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].event, 'failed');
});

const STORY_INDEX = `${STATE_DIR}/story_plans/feat_x_story_plan.md`;
const TASK_DRAFT = `${STATE_DIR}/task_plans/feat_x/task_1_plan.md`;
const WALK = ['--flow', 'task_plan_writing', '--branch', 'feat_x'];

/** The `node:` value of the walker's output. */
function pendingNode(stdout) {
  const match = /^node: (.+)$/m.exec(stdout);
  assert.ok(match, stdout);
  return match[1];
}

/** Save, from `fx`, a job bundle holding a job-mode status and whatever the checkout carries. */
async function saveJob(fx) {
  remoteRecord(fx, { status: 'paused', engine: 'task' });
  const wrote = await runBash(fx.dir, ['-c',
    '. scripts/lib/harness-run-lib.sh && hr_remote_status_write "$1" feat_x "$2" stop "paused mid-planning"',
    '_', REGISTRY, REMOTE_STATUS]);
  assert.equal(wrote.status, 0, wrote.stderr);
  const out = join(fx.dir, STATE_DIR, 'stub', 'out');
  const saved = await remoteRun(fx, ['save', 'feat_x', out]);
  assert.equal(saved.status, 0, saved.stderr);
  return out;
}

/** Serve `out` as run 401's `harness-state` to `fx`, whose job is run 999, and restore it. */
function restoreFrom(fx, out, headSha = undefined) {
  return remoteRun(fx, ['restore', 'feat_x', '--resume', 'pause'], {
    ...syncEnv({ runs: [ghRun(401, 'completed', 1, 'harness run feat_x', headSha)], artifacts: { 401: ['harness-state'] }, bundles: { 401: out } }),
    GITHUB_RUN_ID: '999',
  });
}

test('a walk paused mid-planning in one checkout continues in a fresh one, its pending reviewer\'s story index on disk', async (t) => {
  const a = await remoteFixture(t);
  const started = await runBash(a.dir, ['scripts/flow-walker.sh', 'start', ...WALK, '--skipped', 'none']);
  assert.equal(started.status, 0, started.stderr);
  const advanced = await runBash(a.dir, ['scripts/flow-walker.sh', 'next', ...WALK, '--outcome', 'returned', '--skipped', 'none']);
  assert.equal(advanced.status, 0, advanced.stderr);
  const pending = pendingNode(advanced.stdout);
  assert.equal(pending, 'architecture_review');
  mkdirSync(join(a.dir, STATE_DIR, 'story_plans'), { recursive: true });
  mkdirSync(join(a.dir, STATE_DIR, 'task_plans', 'feat_x'), { recursive: true });
  writeFileSync(join(a.dir, STORY_INDEX), '# feat_x story index\n');
  writeFileSync(join(a.dir, TASK_DRAFT), '### Task 1\n');
  const out = await saveJob(a);

  const b = await remoteFixture(t);
  const restored = await restoreFrom(b, out);
  assert.equal(restored.status, 0, restored.stderr);
  assert.match(restored.stdout, /placed 2 planning file\(s\) for feat_x; kept 0/);
  for (const draft of [STORY_INDEX, TASK_DRAFT]) {
    assert.deepEqual(readFileSync(join(b.dir, draft)), readFileSync(join(a.dir, draft)));
  }
  const current = await runBash(b.dir, ['scripts/flow-walker.sh', 'current', ...WALK]);
  assert.equal(current.status, 0, current.stderr);
  assert.match(current.stdout, /^action: dispatch$/m);
  assert.equal(pendingNode(current.stdout), pending);
  assert.deepEqual(downloads(b).map((line) => line.split(' ').slice(0, 5).join(' ')), ['run download 401 -n harness-state']);

  // Control: the same bundle without planning/ restores a walk whose pending reviewer has no story index.
  const bare = join(a.dir, STATE_DIR, 'stub', 'bare');
  cpSync(out, bare, { recursive: true });
  rmSync(join(bare, 'planning'), { recursive: true });
  const c = await remoteFixture(t);
  const control = await restoreFrom(c, bare);
  assert.equal(control.status, 0, control.stderr);
  assert.doesNotMatch(control.stdout, /planning file/);
  const controlCurrent = await runBash(c.dir, ['scripts/flow-walker.sh', 'current', ...WALK]);
  assert.equal(controlCurrent.status, 0, controlCurrent.stderr);
  assert.equal(pendingNode(controlCurrent.stdout), pending);
  assert.equal(existsSync(join(c.dir, STORY_INDEX)), false);
});

test('restore keeps a planning file the fresh checkout already carries, and reports it kept', async (t) => {
  const a = await remoteFixture(t);
  mkdirSync(join(a.dir, STATE_DIR, 'story_plans'), { recursive: true });
  writeFileSync(join(a.dir, STORY_INDEX), 'draft from the paused job\n');
  const out = await saveJob(a);

  const b = await remoteFixture(t);
  mkdirSync(join(b.dir, STATE_DIR, 'story_plans'), { recursive: true });
  writeFileSync(join(b.dir, STORY_INDEX), 'committed on the branch\n');
  await runGit(b.dir, ['add', '--force', STORY_INDEX]);
  await runGit(b.dir, ['commit', '--quiet', '-m', 'story index']);

  // That commit is beyond origin/<defaultBranch>, so run 401 must carry it as its headSha to be of the lineage.
  const head = (await runGit(b.dir, ['rev-parse', 'HEAD'])).stdout.trim();
  const restored = await restoreFrom(b, out, head);
  assert.equal(restored.status, 0, restored.stderr);
  assert.match(restored.stdout, /placed 0 planning file\(s\) for feat_x; kept 1/);
  assert.equal(readFileSync(join(b.dir, STORY_INDEX), 'utf8'), 'committed on the branch\n');
  assert.equal((await runGit(b.dir, ['status', '--porcelain', '--', STORY_INDEX])).stdout, '');
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

/** `remoteFixture` with each of `branches` on its bare `origin`, at the default branch's commit. */
async function loopFixture(t, branches = ['feat_x', 'feat_a', 'feat_b']) {
  const fx = await remoteFixture(t);
  const { defaultBranch } = JSON.parse(readFileSync(join(fx.dir, 'harness.config.json'), 'utf8'));
  for (const b of branches) {
    const push = await runGit(fx.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `refs/remotes/origin/${defaultBranch}:refs/heads/${b}`]);
    assert.equal(push.status, 0, push.stderr);
  }
  return fx;
}

/** Delete `branch` on the fixture's bare `origin`. */
async function deleteOnOrigin(fx, branch) {
  const push = await runGit(fx.dir, ['push', '--quiet', '--no-verify', 'origin', '--delete', branch]);
  assert.equal(push.status, 0, push.stderr);
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
  const fx = await loopFixture(t);
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
  const fx = await loopFixture(t);
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
  const fx = await loopFixture(t);
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
  const fx = await loopFixture(t);
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
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const b = loopBundle(fx, 'c', { decision: 'continue', chain: '1' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv([CURRENT_RUN], { HARNESS_REMOTE_STOP: '1' }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(calls(fx), []);
  assert.equal(notes().length, 1);
  assert.equal(notes()[0].event, 'paused');
  assert.match(notes()[0].detail, /remote stop is set/);
  assert.match(notes()[0].detail, /\/autonomous-sdlc-harness:branch-resume feat_x/);
  assert.match(notes()[0].detail, /Run workflow on harness-run\.yml .*resume pause/);
});

test('continue on wait-poller enables the resume poller and notifies nothing', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const b = loopBundle(fx, 'w', { decision: 'wait-poller', status: 'paused', pause_reason: 'usage', usage_resume_at: '9999999999' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv());
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(enables(fx), ['workflow enable harness-resume.yml']);
  assert.deepEqual(workflowRuns(fx), []);
  assert.deepEqual(notes(), []);
});

test('continue on wait-poller with a failing enable sends a paused notification through HARNESS_PUSH_CMD', async (t) => {
  const fx = await loopFixture(t);
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
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const b = loopBundle(fx, 's', { decision: 'stop', status: 'completed' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv());
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(calls(fx), []);
  assert.deepEqual(notes(), []);
});

test('continue for a stopped branch sends no workflow run and no enable, and notifies nothing, in either arm', async (t) => {
  const fx = await loopFixture(t);
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

test('continue for a branch deleted on origin sends no workflow run and no enable, and notifies nothing, in either arm', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const arms = [['c', 'continue', 'not re-dispatched'], ['w', 'wait-poller', 'the resume poller is not enabled']];
  const bundles = arms.map(([name, decision]) => loopBundle(fx, name, { decision, chain: '1', status: 'paused', pause_reason: 'usage', usage_resume_at: '9999999999' }));
  for (const b of bundles) assert.equal((await remoteRun(fx, ['continue', 'feat_x', b], continueEnv())).status, 0);
  assert.equal(workflowRuns(fx).length, 1, 'the present branch re-dispatches');
  assert.deepEqual(enables(fx), ['workflow enable harness-resume.yml'], 'the present branch enables the poller');

  await deleteOnOrigin(fx, 'feat_x');
  for (const [i, [, decision, line]] of arms.entries()) {
    const result = await remoteRun(fx, ['continue', 'feat_x', bundles[i]], continueEnv());
    assert.equal(result.status, 0, `${decision}: ${result.stderr}`);
    assert.ok(result.stdout.includes(`feat_x no longer exists on origin; ${line}`), result.stdout);
  }
  assert.equal(workflowRuns(fx).length, 1);
  assert.deepEqual(enables(fx), ['workflow enable harness-resume.yml']);
  assert.deepEqual(notes(), []);
});

test('continue whose origin cannot be read says so in one line and still re-dispatches', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const set = await runGit(fx.dir, ['remote', 'set-url', 'origin', join(fx.dir, STATE_DIR, 'stub', 'no-such-origin')]);
  assert.equal(set.status, 0, set.stderr);
  const b = loopBundle(fx, 'c', { decision: 'continue', chain: '1' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /whether feat_x exists on origin could not be checked \(git ls-remote exited \d+: .+\); proceeding/);
  assert.equal(workflowRuns(fx).length, 1);
  assert.deepEqual(notes(), []);
});

test('continue with a failing run list fails closed: nothing sent, one paused notification', async (t) => {
  const fx = await loopFixture(t);
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

// ---------------------------------------------------------------------------
// The forge coupling: continue's notifications and stop, reported on the issue.
// ---------------------------------------------------------------------------

/** `remoteFixture` with `forge` `github`, its tree on origin, and `feat_x` pushed with a prompt started from issue 7. */
async function forgeFixture(t) {
  const fx = await remoteFixture(t);
  const configPath = join(fx.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.forge = 'github';
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await runGit(fx.dir, ['add', '-A']);
  await runGit(fx.dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(fx.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);
  await runGit(fx.dir, ['checkout', '--quiet', '-b', 'feat_x']);
  mkdirSync(join(fx.dir, STATE_DIR, 'task_prompts'), { recursive: true });
  writeFileSync(join(fx.dir, LINEAGE_PROMPT),
    '# A task\n\nDo it.\n\n---\n\nStarted from https://github.com/o/r/issues/7 by @alice, who applied the label `sdlc-harness`.\n');
  await runGit(fx.dir, ['add', '--force', LINEAGE_PROMPT]);
  await runGit(fx.dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: feat_x']);
  const push = await runGit(fx.dir, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/feat_x']);
  assert.equal(push.status, 0, push.stderr);
  await runGit(fx.dir, ['checkout', '--quiet', config.defaultBranch]);
  return fx;
}

/** Every `body=@<path>` call the stub logged, with that file's content. */
function posted(fx) {
  const file = `${fx.log}.bodies`;
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

const COMMENT_ON_7 = 'api --method POST repos/o/r/issues/7/comments';
const LABEL_ON_7 = 'api --method POST repos/o/r/issues/7/labels';
/** A local `stop`: no runner environment, so the repository comes from `gh repo view`. */
const LOCAL_STOP = {
  STUB_RUN_LIST: ACTIVE_RUNS, STUB_REPO_VIEW: '{"nameWithOwner":"o/r"}',
  GITHUB_REPOSITORY: '', GITHUB_SERVER_URL: '', GITHUB_RUN_ID: '', RUNNER_TEMP: '',
};

test('continue with HARNESS_REMOTE_STOP under forge github also comments on the issue, naming no slash command', async (t) => {
  const fx = await forgeFixture(t);
  const notes = recordNotifications(fx);
  const b = loopBundle(fx, 'c', { decision: 'continue', chain: '1' });
  const result = await remoteRun(fx, ['continue', 'feat_x', b], continueEnv([CURRENT_RUN], { HARNESS_REMOTE_STOP: '1', RUNNER_TEMP: '' }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(workflowRuns(fx), []);
  assert.equal(notes().length, 1);
  assert.equal(notes()[0].event, 'paused');
  assert.match(notes()[0].detail, /\/autonomous-sdlc-harness:branch-resume feat_x/);

  const comments = posted(fx).filter((call) => call.args.join(' ').startsWith(COMMENT_ON_7));
  assert.equal(comments.length, 1, joined(fx).join('\n'));
  assert.match(comments[0].body, /`HARNESS_REMOTE_STOP`/);
  assert.match(comments[0].body, /`@sdlc-harness resume`/);
  assert.doesNotMatch(comments[0].body, /\/autonomous-sdlc-harness:/);
  assert.deepEqual(joined(fx).filter((line) => line.startsWith(LABEL_ON_7)), [`${LABEL_ON_7} -f labels[]=sdlc-harness: paused`]);
});

test('a complete stop --actor under forge github comments naming the actor and labels stopped, after the cancels', async (t) => {
  const fx = await forgeFixture(t);
  const result = await remoteRun(fx, ['stop', 'feat_x', '--actor', 'alice'], LOCAL_STOP);
  assert.equal(result.status, 0, result.stderr);
  const sent = joined(fx);
  const lastCancel = sent.findLastIndex((line) => line.startsWith('run cancel'));
  assert.equal(sent[lastCancel], 'run cancel 14');
  const comment = sent.findIndex((line) => line.startsWith(COMMENT_ON_7));
  const label = sent.indexOf(`${LABEL_ON_7} -f labels[]=sdlc-harness: stopped`);
  assert.ok(comment > lastCancel, sent.join('\n'));
  assert.ok(label > lastCancel, sent.join('\n'));
  const [body] = posted(fx).map((call) => call.body);
  assert.match(body, /Stopped by @alice\./);
  assert.match(body, /event=stopped branch=feat_x/);
});

test('a partial stop under forge github exits 3 and comments and labels nothing', async (t) => {
  const fx = await forgeFixture(t);
  const result = await remoteRun(fx, ['stop', 'feat_x', '--actor', 'alice'], { ...LOCAL_STOP, STUB_FAIL_ON: 'run cancel 13' });
  assert.equal(result.status, 3, result.stderr);
  assert.deepEqual(posted(fx), []);
  assert.deepEqual(joined(fx).filter((line) => line.includes('/labels')), []);
});

test('stop --actor that is not a login is a usage error that calls nothing', async (t) => {
  const fx = await forgeFixture(t);
  for (const actor of ['a b', '-alice', 'alice[bot]x']) {
    const result = await remoteRun(fx, ['stop', 'feat_x', '--actor', actor], LOCAL_STOP);
    assert.equal(result.status, 1, `${actor}: ${result.stderr}`);
  }
  const misplaced = await remoteRun(fx, ['pause', 'feat_x', '--actor', 'alice'], LOCAL_STOP);
  assert.equal(misplaced.status, 1, misplaced.stderr);
  assert.deepEqual(calls(fx), []);
});

test('stop --note posts that note in place of the actor sentence', async (t) => {
  const fx = await forgeFixture(t);
  const result = await remoteRun(fx, ['stop', 'feat_x', '--actor', 'x', '--note', 'Stopped because @x closed issue #7.'], LOCAL_STOP);
  assert.equal(result.status, 0, result.stderr);
  const [comment] = posted(fx);
  assert.match(comment.args.join(' '), new RegExp(`^${COMMENT_ON_7}`));
  assert.match(comment.body, /\n\nStopped because @x closed issue #7\.\n/);
  assert.doesNotMatch(comment.body, /Stopped by @x\./);
});

test('stop --pr posts on that pull request although no open one is listed, and labels it and the issue stopped', async (t) => {
  const fx = await forgeFixture(t);
  const result = await remoteRun(fx, ['stop', 'feat_x', '--pr', '9'], LOCAL_STOP);
  assert.equal(result.status, 0, result.stderr);
  const sent = joined(fx);
  assert.ok(!sent.some((line) => line.startsWith('pr list')), sent.join('\n'));
  assert.deepEqual(posted(fx).map((call) => call.args.join(' ').split(' -F ')[0]), ['api --method POST repos/o/r/issues/9/comments']);
  assert.ok(sent.includes('api --method POST repos/o/r/issues/9/labels -f labels[]=sdlc-harness: stopped'), sent.join('\n'));
  assert.ok(sent.includes(`${LABEL_ON_7} -f labels[]=sdlc-harness: stopped`), sent.join('\n'));
});

test('stop --branch-gone marks on the default branch, reads the issue at the newest run\'s commit, and never offers resume', async (t) => {
  const fx = await forgeFixture(t);
  await runGit(fx.dir, ['push', '--quiet', '--no-verify', 'origin', '--delete', 'feat_x']);
  await runGit(fx.dir, ['branch', '--quiet', '-D', 'feat_x']);
  await runGit(fx.dir, ['update-ref', '-d', 'refs/remotes/origin/feat_x']);
  const remote = await runGit(fx.dir, ['ls-remote', '--heads', 'origin', 'feat_x']);
  assert.equal(remote.stdout.trim(), '', 'the fixture origin still carries feat_x');

  const prompt = '# A task\n\nStarted from https://github.com/o/r/issues/7 by @alice, who applied the label `sdlc-harness`.\n';
  const result = await remoteRun(fx, ['stop', 'feat_x', '--actor', 'alice', '--branch-gone'], {
    ...LOCAL_STOP,
    STUB_REPO_VIEW: '{"nameWithOwner":"o/r","defaultBranchRef":{"name":"trunk"}}',
    STUB_RUN_LIST: JSON.stringify([
      { databaseId: 21, displayTitle: 'harness run feat_x', status: 'completed', headSha: 'aaaaaaa', createdAt: '2026-01-01T00:00:00Z' },
      { databaseId: 22, displayTitle: 'harness run feat_x', status: 'completed', headSha: 'bbbbbbb', createdAt: '2026-01-02T00:00:00Z' },
    ]),
    STUB_CONTENTS: prompt,
  });
  assert.equal(result.status, 0, result.stderr);
  const sent = joined(fx);
  assert.equal(sent.filter((line) => line.startsWith('workflow run'))[0],
    'workflow run harness-run.yml --ref trunk -f action=stop -f branch=feat_x');
  assert.ok(sent.some((line) => line.startsWith(`api repos/o/r/contents/${LINEAGE_PROMPT}?ref=bbbbbbb`)), sent.join('\n'));
  const [comment] = posted(fx);
  assert.match(comment.args.join(' '), new RegExp(`^${COMMENT_ON_7}`));
  assert.match(comment.body, /its branch was deleted, so the run cannot be resumed/);
  assert.match(comment.body, /workflow runs and their artifacts are kept/);
  assert.doesNotMatch(comment.body, /resume`/);
  assert.ok(sent.includes(`${LABEL_ON_7} -f labels[]=sdlc-harness: stopped`), sent.join('\n'));
});

test('--branch-gone and --pr on another verb are usage errors that call nothing', async (t) => {
  const fx = await forgeFixture(t);
  for (const args of [['pause', 'feat_x', '--branch-gone'], ['pause', 'feat_x', '--pr', '9'], ['dispatch', 'feat_x', '--engine', 'task', '--note', 'x']]) {
    const result = await remoteRun(fx, args, LOCAL_STOP);
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stderr}`);
  }
  assert.deepEqual(calls(fx), []);
});

/** A usage-paused bundle; `due` puts its reset in the past. */
function usageBundle(fx, name, due, chain = '2') {
  return loopBundle(fx, name, {
    decision: 'wait-poller', status: 'paused', pause_reason: 'usage', chain,
    usage_resume_at: due ? '1' : '9999999999',
  });
}

const POLL_STATE_CURRENT = `${STATE_DIR}/autonomous_logs/poll_state/current`;

/** The poller state `poll` wrote for the next tick. */
function pollState(fx) {
  return JSON.parse(readFileSync(join(fx.dir, POLL_STATE_CURRENT, 'poll_state.json'), 'utf8'));
}

test('poll dispatches the due branch and keeps the poller for the one still waiting', async (t) => {
  const fx = await loopFixture(t);
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
  const fx = await loopFixture(t);
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

test('poll with HARNESS_REMOTE_STOP set sends nothing, and carries the poller state unchanged', async (t) => {
  const fx = await loopFixture(t);
  const carried = { feat_a: { run_id: '701', failures: '2', notified: '' } };
  const previous = join(fx.dir, STATE_DIR, 'stub', 'poll_states', 'stop');
  mkdirSync(previous, { recursive: true });
  writeFileSync(join(previous, 'poll_state.json'), JSON.stringify(carried));
  const result = await remoteRun(fx, ['poll'], {
    ...syncEnv({
      runs: [ghRun(701, 'completed', 1, 'harness run feat_a')],
      artifacts: { 701: ['harness-state'], 5001: ['harness-poll-state'] },
      bundles: { 701: usageBundle(fx, 'a', true), 5001: previous },
    }),
    STUB_RESUME_RUN_LIST: JSON.stringify([{ databaseId: 5001, createdAt: '2026-01-01T00:00:00Z' }]),
    HARNESS_REMOTE_STOP: '1',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(calls(fx).every((argv) => argv[0] !== 'workflow'), joined(fx).join('\n'));
  assert.deepEqual(pollState(fx), carried);
});

test('poll skips a due branch whose harness stop run is newer, and disables itself when it was the only one waiting', async (t) => {
  const fx = await loopFixture(t);
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
  const fx = await loopFixture(t);
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

test('poll skips a due branch deleted on origin, drops its state, and disables itself when it was the only one waiting', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  await deleteOnOrigin(fx, 'feat_x');
  const served = join(fx.dir, STATE_DIR, 'stub', 'poll_states', 'gone');
  mkdirSync(served, { recursive: true });
  writeFileSync(join(served, 'poll_state.json'), JSON.stringify({ feat_x: { run_id: '801', failures: '1', notified: '' } }));
  const result = await pollTick(fx, { tick: 1, runId: 801, bundleDir: usageBundle(fx, 'x', true), served });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /poll: feat_x no longer exists on origin; skipped/);
  assert.deepEqual(workflowRuns(fx), []);
  assert.deepEqual(downloads(fx).filter((line) => line.startsWith('run download 801 ')), []);
  assert.deepEqual(pollState(fx), {});
  assert.deepEqual(joined(fx).filter((line) => line.startsWith('workflow ')), ['workflow disable harness-resume.yml']);
  assert.deepEqual(notes(), []);
});

const workflowCalls = (fx) => joined(fx).filter((line) => line.startsWith('workflow '));
const DISPATCH_B = 'workflow run harness-run.yml --ref feat_b -f action=run -f branch=feat_b -f engine=task -f resume=pause -f chain=3';

/**
 * feat_b completed and due; feat_a's job still running with no artifact at the first listing. After
 * the disable, feat_b's dispatched run is listed and — when `aPaused` — feat_a's job has uploaded a
 * usage-paused bundle and enabled the poller.
 */
function interleaveEnv(fx, aPaused) {
  const a = ghRun(711, 'in_progress', 3, 'harness run feat_a');
  const b = ghRun(702, 'completed', 2, 'harness run feat_b');
  const env = syncEnv({
    runs: [a, b],
    artifacts: { 702: ['harness-state'] },
    bundles: { 702: usageBundle(fx, 'b', true), 711: usageBundle(fx, 'a', false) },
  });
  env.STUB_RUN_LIST_AFTER_DISABLE = JSON.stringify([ghRun(703, 'queued', 4, 'harness run feat_b'), a, b]);
  if (aPaused) env.STUB_ARTIFACTS_AFTER_DISABLE = JSON.stringify({ 702: ['harness-state'], 711: ['harness-state'] });
  return env;
}

test('poll re-enables the poller when a finishing job uploaded a usage-paused bundle during the tick', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], interleaveEnv(fx, true));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(workflowCalls(fx), [DISPATCH_B, 'workflow disable harness-resume.yml', 'workflow enable harness-resume.yml']);
  assert.match(result.stdout, /feat_a became waiting during this tick; re-enabled harness-resume\.yml/);
  assert.deepEqual(notes(), []);
});

test('poll keeps the poller disabled for a job that is still running with no bundle', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], interleaveEnv(fx, false));
  assert.equal(result.status, 0, result.stderr);
  const toggles = workflowCalls(fx).filter((line) => !line.startsWith('workflow run'));
  assert.equal(toggles[toggles.length - 1], 'workflow disable harness-resume.yml');
  assert.deepEqual(workflowCalls(fx), [DISPATCH_B, 'workflow disable harness-resume.yml']);
  assert.deepEqual(notes(), []);
});

test('poll whose re-enable fails sends one paused notification for the branch that became waiting, and exits 0', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], {
    ...interleaveEnv(fx, true), STUB_FAIL_ON: 'workflow enable', STUB_FAIL_STDERR: 'HTTP 403: forbidden',
  });
  assert.equal(result.status, 0, result.stderr);
  const sent = notes();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].event, 'paused');
  assert.equal(sent[0].branch, 'feat_a');
  assert.match(sent[0].detail, /HTTP 403: forbidden/);
  assert.match(sent[0].detail, /autonomous-sdlc-harness:branch-resume feat_a/);
});

test('poll counts an unfinished run already carrying a usage-paused bundle as waiting, and never dispatches it', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], syncEnv({
    runs: [ghRun(711, 'in_progress', 3, 'harness run feat_a')],
    artifacts: { 711: ['harness-state'] },
    bundles: { 711: usageBundle(fx, 'a', true) },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(workflowCalls(fx), []);
  assert.deepEqual(notes(), []);
});

/** A usage-paused bundle whose reset passed a minute ago: due, and inside the give-up deadline. */
function recentDueBundle(fx, name) {
  return loopBundle(fx, name, {
    decision: 'wait-poller', status: 'paused', pause_reason: 'usage', chain: '2',
    usage_resume_at: String(Math.floor(Date.now() / 1000) - 60),
  });
}

/**
 * One tick over feat_x's completed run `runId`. `served`, when given, is the previous tick's state
 * directory, listed as poller run 5000 + `tick`'s `harness-poll-state` artifact.
 */
function pollTick(fx, { tick, runId, bundleDir, served = null, extra = {} }) {
  const artifacts = { [runId]: ['harness-state'] };
  const bundles = { [runId]: bundleDir };
  const resumeRuns = [];
  if (served !== null) {
    const stateRun = 5000 + tick;
    artifacts[stateRun] = ['harness-poll-state'];
    bundles[stateRun] = served;
    resumeRuns.push({ databaseId: stateRun, createdAt: '2026-01-01T00:00:00Z' });
  }
  return remoteRun(fx, ['poll'], {
    ...syncEnv({ runs: [ghRun(runId, 'completed', 1)], artifacts, bundles }),
    STUB_RESUME_RUN_LIST: JSON.stringify(resumeRuns),
    ...extra,
  });
}

/** What the upload step does: keep this tick's written state for the next tick to download. */
function uploadState(fx, tick) {
  const dir = join(fx.dir, STATE_DIR, 'stub', 'poll_states', `tick${tick}`);
  cpSync(join(fx.dir, POLL_STATE_CURRENT), dir, { recursive: true });
  return dir;
}

const disables = (fx) => joined(fx).filter((line) => line.startsWith('workflow disable'));
const FAILING_DISPATCH = { STUB_FAIL_ON: 'workflow run', STUB_FAIL_STDERR: 'HTTP 404: harness-run.yml not found' };

test('poll gives up on a dispatch that always fails: one paused notification at the limit, then it disables itself', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const b = recentDueBundle(fx, 'x');
  let served = null;
  for (let tick = 1; tick <= 3; tick++) {
    const result = await pollTick(fx, { tick, runId: 801, bundleDir: b, served, extra: FAILING_DISPATCH });
    assert.equal(result.status, 0, result.stderr);
    if (tick < 3) {
      assert.deepEqual(notes(), [], `tick ${tick}`);
      assert.deepEqual(disables(fx), [], `tick ${tick}`);
      assert.equal(pollState(fx).feat_x.failures, String(tick));
    }
    served = uploadState(fx, tick);
  }
  const sent = notes();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].event, 'paused');
  assert.equal(sent[0].branch, 'feat_x');
  assert.match(sent[0].detail, /HTTP 404: harness-run\.yml not found/);
  assert.match(sent[0].detail, /after 3 attempts/);
  assert.match(sent[0].detail, /autonomous-sdlc-harness:branch-resume feat_x/);
  assert.deepEqual(disables(fx), ['workflow disable harness-resume.yml']);
  assert.equal(pollState(fx).feat_x.notified, '1');

  // The poller re-enabled by another branch: the same state sends no second notification or attempt.
  const again = await pollTick(fx, { tick: 4, runId: 801, bundleDir: b, served, extra: FAILING_DISPATCH });
  assert.equal(again.status, 0, again.stderr);
  assert.equal(notes().length, 1);
  assert.equal(workflowRuns(fx).length, 3);
});

test('poll retries a dispatch that fails once, then drops the branch\'s state when it succeeds', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const b = recentDueBundle(fx, 'x');
  const extra = { ...FAILING_DISPATCH, STUB_FAIL_TIMES: '1' };
  const first = await pollTick(fx, { tick: 1, runId: 801, bundleDir: b, extra });
  assert.equal(first.status, 0, first.stderr);
  assert.deepEqual(notes(), []);
  assert.deepEqual(disables(fx), []);
  assert.deepEqual(pollState(fx), { feat_x: { run_id: '801', failures: '1', notified: '' } });

  const second = await pollTick(fx, { tick: 2, runId: 801, bundleDir: b, served: uploadState(fx, 1), extra });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(workflowRuns(fx).length, 2);
  assert.ok(workflowRuns(fx)[1].includes('-f resume=pause'), workflowRuns(fx)[1]);
  assert.deepEqual(notes(), []);
  assert.deepEqual(pollState(fx), {});
  assert.deepEqual(disables(fx), ['workflow disable harness-resume.yml']);
});

test('poll gives up on the first failed dispatch past the deadline, with no carried state', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const result = await pollTick(fx, { tick: 1, runId: 801, bundleDir: usageBundle(fx, 'x', true), extra: FAILING_DISPATCH });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(notes().length, 1);
  assert.equal(notes()[0].event, 'paused');
  assert.match(notes()[0].detail, /after 1 attempts/);
  assert.deepEqual(disables(fx), ['workflow disable harness-resume.yml']);
});

test('poll restarts the failure count for a newer run of the branch', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const served = join(fx.dir, STATE_DIR, 'stub', 'poll_states', 'old');
  mkdirSync(served, { recursive: true });
  writeFileSync(join(served, 'poll_state.json'), JSON.stringify({ feat_x: { run_id: '700', failures: '2', notified: '' } }));
  const result = await pollTick(fx, { tick: 1, runId: 701, bundleDir: recentDueBundle(fx, 'x'), served, extra: FAILING_DISPATCH });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(notes(), []);
  assert.deepEqual(pollState(fx), { feat_x: { run_id: '701', failures: '1', notified: '' } });
  assert.deepEqual(disables(fx), []);
});

/** A poller state directory carrying `state`, for `pollTick`'s `served`. */
function servedState(fx, name, state) {
  const dir = join(fx.dir, STATE_DIR, 'stub', 'poll_states', name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'poll_state.json'), JSON.stringify(state));
  return dir;
}

/** Any call that changes the issue: a comment, or a label added or removed. */
const issueWrites = (fx) => joined(fx).filter((line) => /--method (POST|DELETE|PATCH) repos\/o\/r\/issues\//.test(line));

test('poll keeps itself enabled for a listed bundle it cannot download, and counts the download apart', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const served = servedState(fx, 'listed', { feat_x: { run_id: '801', failures: '1', notified: '' } });
  // Listed under `harness-state`, with no bundle to copy: `run download` fails.
  const result = await pollTick(fx, { tick: 1, runId: 801, bundleDir: undefined, served });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /the bundle of run 801 \(feat_x\) could not be downloaded, attempt 1 of 3; still waiting/);
  assert.deepEqual(disables(fx), []);
  assert.deepEqual(pollState(fx), { feat_x: { run_id: '801', failures: '1', notified: '', download_failures: '1' } });
  assert.deepEqual(notes(), []);
});

/** feat_x's run 801 under forge github, its bundle listed but undownloadable, one failure short of the bound. */
async function downloadBoundTick(t, labels) {
  const fx = await forgeFixture(t);
  const notes = recordNotifications(fx);
  const served = servedState(fx, 'bound', { feat_x: { run_id: '801', failures: '', notified: '', download_failures: '2' } });
  const result = await pollTick(fx, { tick: 1, runId: 801, bundleDir: undefined, served, extra: { STUB_LABELS: labels } });
  assert.equal(result.status, 0, result.stderr);
  return { fx, notes };
}

test('poll at the download bound sends one push-only bundle_unreadable, posts nothing, and disables itself', async (t) => {
  const { fx, notes } = await downloadBoundTick(t, '[]');
  const sent = notes();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].event, 'bundle_unreadable');
  assert.equal(sent[0].branch, 'feat_x');
  assert.match(sent[0].detail, /after 3 attempts \([^)]*no artifact matches\)/);
  assert.match(sent[0].detail, /autonomous-sdlc-harness:branch-resume feat_x/);
  assert.deepEqual(issueWrites(fx), []);
  assert.deepEqual(posted(fx), []);
  assert.equal(pollState(fx).feat_x.notified, '1');
  assert.deepEqual(disables(fx), ['workflow disable harness-resume.yml']);
});

test('poll counts a failed artifact lookup on a completed run as a failed download, up to one bundle_unreadable', async (t) => {
  const fx = await forgeFixture(t);
  const notes = recordNotifications(fx);
  const extra = {
    STUB_LABELS: '[]',
    STUB_FAIL_ON: 'api repos/{owner}/{repo}/actions/runs/801/artifacts',
    STUB_FAIL_STDERR: 'HTTP 502: bad gateway',
  };
  let served = servedState(fx, 'lookup', { feat_x: { run_id: '801', failures: '', notified: '' } });
  for (const tick of [1, 2]) {
    const result = await pollTick(fx, { tick, runId: 801, bundleDir: bundle(fx, `lookup${tick}`), served, extra });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /reading the artifacts of run 801 \(feat_x\) failed \([^)]*HTTP 502: bad gateway\)/);
    assert.match(result.stdout, new RegExp(`could not be downloaded, attempt ${tick} of 3; still waiting`));
    assert.equal(pollState(fx).feat_x.download_failures, String(tick));
    assert.deepEqual(notes(), []);
    assert.deepEqual(disables(fx), []);
    served = uploadState(fx, tick);
  }
  const last = await pollTick(fx, { tick: 3, runId: 801, bundleDir: bundle(fx, 'lookup3'), served, extra });
  assert.equal(last.status, 0, last.stderr);
  const sent = notes();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].event, 'bundle_unreadable');
  assert.match(sent[0].detail, /after 3 attempts \([^)]*HTTP 502: bad gateway\)/);
  assert.equal(pollState(fx).feat_x.notified, '1');
  assert.deepEqual(issueWrites(fx), []);
  assert.deepEqual(disables(fx), ['workflow disable harness-resume.yml']);
});

test('poll at the download bound leaves a delivered run\'s label unchanged', async (t) => {
  const { fx, notes } = await downloadBoundTick(t, '[{"name":"sdlc-harness: done"}]');
  assert.equal(notes().length, 1);
  assert.equal(notes()[0].event, 'bundle_unreadable');
  assert.deepEqual(joined(fx).filter((line) => line.includes('/issues/7/labels') && line.includes('--method')), []);
  assert.deepEqual(issueWrites(fx), []);
});

test('poll resets the download count when the bundle downloads', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const served = servedState(fx, 'reset', { feat_x: { run_id: '801', failures: '', notified: '', download_failures: '2' } });
  const result = await pollTick(fx, { tick: 1, runId: 801, bundleDir: bundle(fx, 'parked'), served });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(pollState(fx).feat_x.download_failures, '');
  assert.deepEqual(notes(), []);
});

test('poll treats a completed run whose run job never started as not waiting, and reports nothing', async (t) => {
  const fx = await forgeFixture(t);
  const notes = recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], {
    ...syncEnv({ runs: [ghRun(801, 'completed', 1)] }),
    STUB_JOBS: JSON.stringify({ 801: [{ name: 'run', status: 'completed', conclusion: 'cancelled', steps: [], id: 556 }] }),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /poll: run 801 of feat_x never started \(.+\); its collect job reports it; not waiting/);
  assert.deepEqual(notes(), []);
  assert.deepEqual(posted(fx), []);
  assert.deepEqual(issueWrites(fx), []);
  assert.deepEqual(downloads(fx), []);
  assert.deepEqual(disables(fx), ['workflow disable harness-resume.yml']);
});

test('poll skips a completed run with no bundle whose run job started', async (t) => {
  const fx = await loopFixture(t);
  const notes = recordNotifications(fx);
  const result = await remoteRun(fx, ['poll'], {
    ...syncEnv({ runs: [ghRun(801, 'completed', 1)] }),
    STUB_JOBS: JSON.stringify({ 801: [{ name: 'run', status: 'completed', conclusion: 'success', steps: [{ name: 'harness' }], id: 557 }] }),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /poll: feat_x skipped/);
  assert.doesNotMatch(result.stdout, /never started/);
  assert.deepEqual(notes(), []);
  assert.deepEqual(disables(fx), ['workflow disable harness-resume.yml']);
});

test('poll with a give-up bound that is not a non-negative integer exits 1 and dispatches nothing', async (t) => {
  const fx = await loopFixture(t);
  recordNotifications(fx);
  for (const name of ['HARNESS_POLL_MAX_DISPATCH_FAILURES', 'HARNESS_POLL_GIVE_UP_AFTER_MINUTES']) {
    const result = await pollTick(fx, { tick: 1, runId: 801, bundleDir: usageBundle(fx, 'x', true), extra: { [name]: 'x' } });
    assert.equal(result.status, 1, name);
    assert.match(result.stderr, new RegExp(name));
  }
  assert.deepEqual(workflowCalls(fx), []);
});

/** 2026-01-01T00:00:10Z, as an epoch second. */
const PAUSE_CREATED = 1767225610;
const PAUSE_RUNS = JSON.stringify([
  { databaseId: 5, displayTitle: 'harness run feat_x', status: 'in_progress', createdAt: '2026-01-01T00:01:00Z' },
  { databaseId: 6, displayTitle: 'harness pause feat_xy', status: 'completed', createdAt: '2026-01-01T00:01:00Z' },
  { databaseId: 7, displayTitle: 'harness pause feat_x', status: 'completed', createdAt: '2026-01-01T00:00:10Z' },
]);

test('pause-requested: 0 for an exact-title run at or after the epoch, 5 for none, 1 for a usage error, 3 when gh fails', async (t) => {
  const fx = await remoteFixture(t, 'local');
  const env = { STUB_RUN_LIST: PAUSE_RUNS };
  for (const [since, expected] of [[PAUSE_CREATED - 10, 0], [PAUSE_CREATED, 0], [PAUSE_CREATED + 1, 5]]) {
    const result = await remoteRun(fx, ['pause-requested', 'feat_x', String(since)], env);
    assert.equal(result.status, expected, `since ${since}: ${result.stdout}\n${result.stderr}`);
  }
  assert.ok(joined(fx).every((line) => line.startsWith('run list --workflow harness-run.yml --branch feat_x')), joined(fx).join('\n'));

  const failed = await remoteRun(fx, ['pause-requested', 'feat_x', '0'], { ...env, STUB_FAIL_ON: 'run list' });
  assert.equal(failed.status, 3, failed.stderr);
  const garbled = await remoteRun(fx, ['pause-requested', 'feat_x', '0'], { STUB_RUN_LIST: 'not json' });
  assert.equal(garbled.status, 3, garbled.stderr);

  const missing = await remoteRun(fx, ['pause-requested', 'feat_x'], env);
  assert.equal(missing.status, 1, missing.stderr);
  assert.match(missing.stderr, /pause-requested <branch> <since_epoch>/);
  const nonInteger = await remoteRun(fx, ['pause-requested', 'feat_x', 'abc'], env);
  assert.equal(nonInteger.status, 1, nonInteger.stderr);
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

// ---------------------------------------------------------------------------
// fetch — the commands' read of one branch.
// ---------------------------------------------------------------------------

/** An empty directory outside the fixture's state directory, removed after the case. */
function outDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'remote-fetch-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** `fetch`'s `key: value` lines as an object. */
function fetched(stdout) {
  return Object.fromEntries(stdout.split('\n').filter(Boolean).map((line) => {
    const at = line.indexOf(': ');
    return at === -1 ? [line.replace(/:$/, ''), ''] : [line.slice(0, at), line.slice(at + 2)];
  }));
}

const FETCH_KEYS = ['run_id', 'run_url', 'run_status', 'state', 'pause_reason', 'engine', 'detail', 'open_questions', 'bundle_dir'];

/** Every file under the state directory except the stub's own, which records each call. */
const stateSnapshot = (fx) => snapshotTree(join(fx.dir, STATE_DIR), { exclude: ['.git', 'stub'] });

test('fetch with no harness run listed prints state none, every key present, and writes nothing', async (t) => {
  const fx = await remoteFixture(t);
  const out = outDir(t);
  const before = await stateSnapshot(fx);
  const result = await remoteRun(fx, ['fetch', 'feat_x', out], syncEnv({ runs: [] }));
  assert.equal(result.status, 0, result.stderr);
  const lines = fetched(result.stdout);
  assert.deepEqual(Object.keys(lines), FETCH_KEYS);
  assert.equal(lines.state, 'none');
  assert.equal(lines.bundle_dir, '');
  assert.deepEqual(readdirSync(out), []);
  assert.deepEqual(await stateSnapshot(fx), before);
});

test('fetch of an in-progress newest run prints running and downloads nothing', async (t) => {
  const fx = await remoteFixture(t);
  const out = outDir(t);
  const result = await remoteRun(fx, ['fetch', 'feat_x', out], syncEnv({ runs: [ghRun(102, 'in_progress', 2), ghRun(101, 'completed', 1)] }));
  assert.equal(result.status, 0, result.stderr);
  const lines = fetched(result.stdout);
  assert.equal(lines.state, 'running');
  assert.equal(lines.run_id, '102');
  assert.equal(lines.run_url, runUrl(102));
  assert.equal(lines.run_status, 'in_progress');
  assert.deepEqual(downloads(fx), []);
});

test('fetch of a parked bundle prints the open questions and leaves the files in out_dir alone', async (t) => {
  const fx = await remoteFixture(t);
  const out = outDir(t);
  const source = bundle(fx, 'p', { questions: ['question_1.md', 'question_2.md', 'question_10.md', 'question_3.md'] });
  writeFileSync(join(source, 'clarifications', 'feat_x', 'answer_3.md'), 'already answered\n');
  const before = await stateSnapshot(fx);

  const result = await remoteRun(fx, ['fetch', 'feat_x', out], syncEnv({
    runs: [ghRun(101, 'completed', 1)], artifacts: { 101: ['harness-state'] }, bundles: { 101: source },
  }));
  assert.equal(result.status, 0, result.stderr);
  const lines = fetched(result.stdout);
  assert.equal(lines.state, 'parked');
  assert.equal(lines.engine, 'task');
  assert.equal(lines.detail, 'parked on a question');
  assert.equal(lines.open_questions, '1 2 10');
  assert.equal(lines.bundle_dir, out);
  assert.equal(readFileSync(join(out, 'clarifications', 'feat_x', 'question_2.md'), 'utf8'), 'p question_2.md\n');
  assert.deepEqual(downloads(fx), [`run download 101 -n harness-state -D ${out}`]);
  assert.deepEqual(await stateSnapshot(fx), before, 'fetch wrote under the state directory');
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false, 'fetch created a registry');
});

test('fetch of an expired bundle prints paused / expired and downloads nothing', async (t) => {
  const fx = await remoteFixture(t);
  const out = outDir(t);
  const result = await remoteRun(fx, ['fetch', 'feat_x', out], syncEnv({
    runs: [ghRun(101, 'completed', 1)],
    artifacts: { 101: [{ name: 'harness-state', expired: true, expires_at: '2026-01-02T00:00:00Z' }] },
  }));
  assert.equal(result.status, 0, result.stderr);
  const lines = fetched(result.stdout);
  assert.equal(lines.state, 'paused');
  assert.equal(lines.pause_reason, 'expired');
  assert.match(lines.detail, /expired on 2026-01-02T00:00:00Z/);
  assert.equal(lines.bundle_dir, '');
  assert.deepEqual(downloads(fx), []);
});

const NOT_ACQUIRED = 'The job was not acquired by Runner of type hosted even after multiple attempts';

/** A newest completed run 202 with no artifact, over an older run 201 that carries a bundle. */
function case4Env(fx, steps, extra = {}) {
  return {
    ...syncEnv({
      runs: [ghRun(202, 'completed', 2), ghRun(201, 'completed', 1)],
      artifacts: { 201: ['harness-state'] },
      bundles: { 201: bundle(fx, 'old') },
    }),
    STUB_JOBS: JSON.stringify({ 202: [{ name: 'run', status: 'completed', conclusion: 'cancelled', steps, id: 555 }] }),
    STUB_ANNOTATIONS: JSON.stringify({ 555: [{ message: NOT_ACQUIRED }] }),
    ...extra,
  };
}

test('fetch of a newest run GitHub never started, over an older bundle, prints paused / killed naming GitHub\'s reason', async (t) => {
  const fx = await remoteFixture(t);
  const out = outDir(t);
  const result = await remoteRun(fx, ['fetch', 'feat_x', out], case4Env(fx, []));
  assert.equal(result.status, 0, result.stderr);
  const lines = fetched(result.stdout);
  assert.equal(lines.state, 'paused');
  assert.equal(lines.pause_reason, 'killed');
  assert.equal(lines.detail, `GitHub did not start the job of run 202 (${NOT_ACQUIRED}): ${runUrl(202)}`);
  assert.ok(joined(fx).includes('api repos/{owner}/{repo}/check-runs/555/annotations'));
  assert.deepEqual(downloads(fx), []);
});

test('sync of a newest run GitHub never started records the engine its dispatch\'s round comment names', async (t) => {
  const fx = await forgeFixture(t);
  remoteRecord(fx, { status: 'completed', engine: 'task', remote_run_id: '201' });
  const round = {
    user: { login: 'github-actions[bot]' },
    created_at: '2026-01-01T00:02:10Z',
    body: 'Round 4 placed.\n\n<!-- sdlc-harness event=round branch=feat_x -->\n',
  };
  const result = await remoteRun(fx, ['sync', 'feat_x'], case4Env(fx, [], {
    GITHUB_REPOSITORY: 'o/r',
    STUB_PRS: JSON.stringify([{ number: 12, isCrossRepository: false }]),
    STUB_ITEM_COMMENTS: JSON.stringify({ 12: [round] }),
  }));
  assert.equal(result.status, 0, result.stderr);
  const rec = record(fx);
  assert.equal(rec.status, 'paused');
  assert.equal(rec.pause_reason, 'killed');
  assert.equal(rec.engine, 'user_review');
  assert.equal(rec.remote_run_id, '202');
});

test('fetch of a newest run whose job ran a step, over an older bundle, keeps the no-bundle detail', async (t) => {
  const fx = await remoteFixture(t);
  const out = outDir(t);
  const result = await remoteRun(fx, ['fetch', 'feat_x', out], case4Env(fx, [{ name: 'Set up job', status: 'completed' }]));
  assert.equal(result.status, 0, result.stderr);
  const lines = fetched(result.stdout);
  assert.equal(lines.state, 'paused');
  assert.equal(lines.pause_reason, 'killed');
  assert.equal(lines.detail, `run 202 ended with no state bundle (killed, cancelled or replaced): ${runUrl(202)}`);
  assert.ok(!joined(fx).some((line) => line.includes('/annotations')), 'a started job had its annotations read');
});

test('fetch whose jobs lookup fails keeps today\'s state and detail, and names the failure on stderr', async (t) => {
  const fx = await remoteFixture(t);
  const out = outDir(t);
  const result = await remoteRun(fx, ['fetch', 'feat_x', out], case4Env(fx, [], {
    STUB_FAIL_ON: 'api repos/{owner}/{repo}/actions/runs/202/jobs',
    STUB_FAIL_STDERR: 'HTTP 502: jobs unavailable',
  }));
  assert.equal(result.status, 0, result.stderr);
  const lines = fetched(result.stdout);
  assert.equal(lines.state, 'paused');
  assert.equal(lines.pause_reason, 'killed');
  assert.equal(lines.detail, `run 202 ended with no state bundle (killed, cancelled or replaced): ${runUrl(202)}`);
  assert.match(result.stderr, /could not tell whether GitHub started the job of run 202: .*HTTP 502: jobs unavailable/);
});

test('fetch is refused under execution.target local, and needs an existing, empty out_dir', async (t) => {
  const local = await remoteFixture(t, 'local');
  const refused = await remoteRun(local, ['fetch', 'feat_x', outDir(t)]);
  assert.equal(refused.status, 2, refused.stderr);
  assert.deepEqual(calls(local), []);

  const fx = await remoteFixture(t);
  const full = outDir(t);
  writeFileSync(join(full, 'x'), 'x');
  for (const args of [['fetch', 'feat_x'], ['fetch', 'feat_x', join(full, 'missing')], ['fetch', 'feat_x', full]]) {
    const result = await remoteRun(fx, args);
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stderr}`);
  }
  assert.deepEqual(calls(fx), []);
});

// ---------------------------------------------------------------------------
// status with no local record, and list — the commands' reads that need none.
// ---------------------------------------------------------------------------

/** A fresh TMPDIR for one run, so a temporary directory it leaves behind is seen. */
function tmpRoot(t) {
  const dir = mkdtempSync(join(tmpdir(), 'remote-status-tmp-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('status with no registry reads the newest bundle from GitHub, prints its open question, and writes nothing', async (t) => {
  const fx = await remoteFixture(t);
  const source = bundle(fx, 'q');
  writeFileSync(join(source, 'clarifications', 'feat_x', 'question_1.md'), '# Questions\n\n## Q1 — Which colour?\n\nBody.\n');
  const before = await stateSnapshot(fx);
  const tmp = tmpRoot(t);

  const result = await remoteRun(fx, ['status', 'feat_x'], {
    ...syncEnv({ runs: [ghRun(101, 'completed', 1)], artifacts: { 101: ['harness-state'] }, bundles: { 101: source } }),
    TMPDIR: tmp,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /101 {2}harness run feat_x/);
  assert.match(result.stdout, /no local record; state from GitHub \(newest run\):/);
  assert.match(result.stdout, /^ {2}state: parked$/m);
  assert.match(result.stdout, /^remote-run\.sh: open question question_1\.md$/m);
  assert.match(result.stdout, /^ {2}## Q1 — Which colour\?$/m);
  assert.doesNotMatch(result.stdout, /finished after the last sync/);
  assert.equal(downloads(fx).length, 1);

  assert.deepEqual(await stateSnapshot(fx), before, 'status wrote under the state directory');
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false, 'status created a registry');
  assert.equal(existsSync(join(fx.dir, STATE_DIR, 'autonomous_logs', 'remote_download')), false);
  assert.deepEqual(readdirSync(tmp), [], 'status left a temporary directory');
});

test('status with no record is refused under execution.target local, calling nothing', async (t) => {
  const fx = await remoteFixture(t, 'local');
  const result = await remoteRun(fx, ['status', 'feat_x']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /execution\.target is 'local'/);
  assert.deepEqual(calls(fx), []);
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false);
});

test('status with no record and no run on GitHub prints the no-run line and exits 0', async (t) => {
  const fx = await remoteFixture(t);
  const result = await remoteRun(fx, ['status', 'feat_x'], syncEnv({ runs: [] }));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /remote-run\.sh: no local record, and no run titled 'harness run feat_x' on GitHub/);
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false);
});

test('status with no record and an expired newest bundle prints the expired line once, as its detail', async (t) => {
  const fx = await remoteFixture(t);
  const before = await stateSnapshot(fx);
  const result = await remoteRun(fx, ['status', 'feat_x'], syncEnv({
    runs: [ghRun(102, 'completed', 2)],
    artifacts: { 102: [{ name: 'harness-state', expired: true, expires_at: '2026-01-02T00:00:00Z' }] },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^ {2}pause_reason: expired$/m);
  assert.equal(result.stdout.split('the state bundle of run 102 expired on 2026-01-02T00:00:00Z').length - 1, 1);
  assert.equal(downloads(fx).length, 0);
  assert.deepEqual(await stateSnapshot(fx), before);
});

test('status with no record and a never-started newest run with no annotation prints failed, naming the conclusion', async (t) => {
  const fx = await remoteFixture(t);
  const before = await stateSnapshot(fx);
  const result = await remoteRun(fx, ['status', 'feat_x'], {
    ...syncEnv({ runs: [ghRun(102, 'completed', 2)] }),
    STUB_JOBS: JSON.stringify({ 102: [{ name: 'run', status: 'completed', conclusion: 'cancelled', steps: [], id: 556 }] }),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^ {2}state: failed$/m);
  assert.match(result.stdout, /^ {2}detail: GitHub did not start the job of run 102 \(its `run` job ended `cancelled` with no step run\): /m);
  assert.equal(downloads(fx).length, 0);
  assert.deepEqual(await stateSnapshot(fx), before);
});

test('status with no record and an unrecognised bundle is refused with exit 2, naming the bundle', async (t) => {
  const fx = await remoteFixture(t);
  const source = bundle(fx, 'odd', { status: 'not_a_status' });
  const tmp = tmpRoot(t);
  const result = await remoteRun(fx, ['status', 'feat_x'], {
    ...syncEnv({ runs: [ghRun(101, 'completed', 1)], artifacts: { 101: ['harness-state'] }, bundles: { 101: source } }),
    TMPDIR: tmp,
  });
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /is unrecognised/);
  assert.doesNotMatch(result.stderr, /execution\.target/);
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false);
  assert.deepEqual(readdirSync(tmp), [], 'status left a temporary directory');
});

/** One `list_all_runs` entry, carrying the branch as `headBranch`. */
const branchRun = (id, b, minute) => ({ ...ghRun(id, 'completed', minute, `harness run ${b}`), headBranch: b });

test('list prints only the unrecorded, live, unprotected branch, and creates no registry', async (t) => {
  const fx = await remoteFixture(t);
  const configPath = join(fx.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.protectedBranches = [...new Set([...(config.protectedBranches ?? []), 'main', config.defaultBranch])];
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await runGit(fx.dir, ['add', '-A']);
  await runGit(fx.dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  for (const ref of [config.defaultBranch, 'main', 'feat_x', 'feat_rec']) {
    await runGit(fx.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${ref}`]);
  }
  const env = syncEnv({
    runs: [
      branchRun(5, 'feat_rec', 5),
      branchRun(4, 'feat_x', 4),
      { ...ghRun(3, 'completed', 3, 'harness pause feat_gone'), headBranch: 'feat_gone' },
      branchRun(2, 'feat_gone', 2),
      branchRun(1, 'main', 1),
    ],
  });

  const unrecorded = await remoteRun(fx, ['list'], env);
  assert.equal(unrecorded.status, 0, unrecorded.stderr);
  assert.match(unrecorded.stdout, /on GitHub, no local record: feat_rec /);
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false, 'list created the registry');

  mkdirSync(join(fx.dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
  writeFileSync(join(fx.dir, REGISTRY), JSON.stringify({ runs: { feat_rec: { branch: 'feat_rec', execution: 'local' } } }));
  const registryBefore = readFileSync(join(fx.dir, REGISTRY));
  const before = await stateSnapshot(fx);
  const result = await remoteRun(fx, ['list'], env);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `remote-run.sh: on GitHub, no local record: feat_x ${runUrl(4)}\n`);
  assert.deepEqual(readFileSync(join(fx.dir, REGISTRY)), registryBefore);
  assert.deepEqual(await stateSnapshot(fx), before);
  assert.equal(joined(fx).filter((line) => line.startsWith('run download') || line.startsWith('api ')).length, 0);
});

test('list with nothing unrecorded says so; under execution.target local it is refused; a failed listing is 3', async (t) => {
  const fx = await remoteFixture(t);
  const none = await remoteRun(fx, ['list'], syncEnv({ runs: [] }));
  assert.equal(none.status, 0, none.stderr);
  assert.equal(none.stdout, 'remote-run.sh: no run on GitHub without a local record\n');

  const failed = await remoteRun(fx, ['list'], { STUB_FAIL_ON: 'run list' });
  assert.equal(failed.status, 3, failed.stderr);
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false);

  assert.equal((await remoteRun(fx, ['list', 'feat_x'])).status, 1);

  const local = await remoteFixture(t, 'local');
  const refused = await remoteRun(local, ['list']);
  assert.equal(refused.status, 2, refused.stderr);
  assert.deepEqual(calls(local), []);
});

test('adopt is an unknown verb: exit 1, no gh call, no registry', async (t) => {
  const fx = await remoteFixture(t);
  const env = syncEnv({ runs: [branchRun(4, 'feat_x', 4)] });
  for (const args of [['adopt'], ['adopt', '--list'], ['adopt', 'feat_x']]) {
    const result = await remoteRun(fx, args, env);
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stderr}`);
    assert.match(result.stderr, /unknown verb 'adopt'/);
  }
  assert.deepEqual(calls(fx), []);
  assert.equal(existsSync(join(fx.dir, REGISTRY)), false);
});

// ---------------------------------------------------------------------------
// dispatch — the record update after a user's resume.
// ---------------------------------------------------------------------------

test('a chain-0 answer dispatch marks an existing remote record running in one write', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx, { status: 'parked' });
  mkdirSync(join(fx.dir, CLARIFY_DIR), { recursive: true });
  writeFileSync(join(fx.dir, CLARIFY_DIR, 'answer_1.md'), 'blue\n');
  const result = await remoteRun(fx, [
    'dispatch', 'feat_x', '--engine', 'task', '--resume', 'answer',
    '--answers-from', join(fx.dir, CLARIFY_DIR), '--indexes', '1', '--chain', '0',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const rec = record(fx);
  assert.equal(rec.status, 'running');
  assert.equal(rec.resume_kind, 'answer');
  assert.match(rec.resumed_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
});

test('a chain-1 resume leaves the record alone, and a dispatch with no registry creates none', async (t) => {
  const fx = await remoteFixture(t);
  remoteRecord(fx, { status: 'paused' });
  const before = readFileSync(join(fx.dir, REGISTRY), 'utf8');
  const chained = await remoteRun(fx, ['dispatch', 'feat_x', '--engine', 'task', '--resume', 'pause', '--chain', '1']);
  assert.equal(chained.status, 0, chained.stderr);
  assert.equal(readFileSync(join(fx.dir, REGISTRY), 'utf8'), before);

  const bare = await remoteFixture(t);
  const sent = await remoteRun(bare, ['dispatch', 'feat_x', '--engine', 'task', '--resume', 'pause', '--chain', '0']);
  assert.equal(sent.status, 0, sent.stderr);
  assert.equal(existsSync(join(bare.dir, REGISTRY)), false, 'the dispatch created a registry');
});

// ---------------------------------------------------------------------------
// review — a user review round placed on the branch tip, then dispatched.
// ---------------------------------------------------------------------------

const REVIEW_DIR = `${STATE_DIR}/user_reviews`;
const REVIEW_BYTES = 'The button is not centred.\n\n  "quoted" $HOME `tick`\n';
const REVIEW_DISPATCH =
  'workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=user_review -f resume=none -f chain=0';

/**
 * A remote fixture adopted on `origin`'s default branch, with `origin/feat_x` one commit ahead
 * carrying `reviews` under the state directory's `user_reviews/`, no local `feat_x`, a review file
 * outside the checkout, and a `commands.depInstall` that would write `bootstrapMarker`. With `forge`,
 * the configuration says `forge` `github` and `feat_x` carries a task prompt started from issue 7.
 */
async function reviewFixture(t, reviews = [], { forge = false } = {}) {
  const fx = await remoteFixture(t);
  const { dir } = fx;
  const bootstrapMarker = join(dir, STATE_DIR, 'stub', 'bootstrap.marker');
  const configPath = join(dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.commands.depInstall = `printf x > '${bootstrapMarker}'`;
  delete config.commands.build;
  if (forge) config.forge = 'github';
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  const copy = join(dirname(dir), `${config.projectName}-feat_x`);
  t.after(() => rmSync(copy, { recursive: true, force: true }));

  const origin = (await runGit(dir, ['remote', 'get-url', 'origin'])).stdout.trim();
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);
  await runGit(dir, ['checkout', '--quiet', '-b', 'feat_x']);
  for (const name of reviews) writeFileSync(join(dir, REVIEW_DIR, name), `${name}\n`);
  if (reviews.length > 0) {
    await runGit(dir, ['add', '--', ...reviews.map((name) => `${REVIEW_DIR}/${name}`)]);
    await runGit(dir, ['commit', '--quiet', '-m', 'fixture: earlier rounds']);
  }
  if (forge) {
    mkdirSync(join(dir, STATE_DIR, 'task_prompts'), { recursive: true });
    writeFileSync(join(dir, LINEAGE_PROMPT),
      '# A task\n\nDo it.\n\n---\n\nStarted from https://github.com/o/r/issues/7 by @alice, who applied the label `sdlc-harness`.\n');
    await runGit(dir, ['add', '--force', LINEAGE_PROMPT]);
    await runGit(dir, ['commit', '--quiet', '--no-verify', '-m', 'fixture: feat_x prompt']);
  }
  await runGit(dir, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/feat_x']);
  await runGit(dir, ['checkout', '--quiet', config.defaultBranch]);
  await runGit(dir, ['branch', '--quiet', '-D', 'feat_x']);

  const reviewFile = join(dir, STATE_DIR, 'stub', 'review.md');
  writeFileSync(reviewFile, REVIEW_BYTES);
  const git = async (cwd, args) => (await runGit(cwd, args)).stdout.trim();
  return {
    ...fx,
    origin,
    copy,
    bootstrapMarker,
    reviewFile,
    git,
    originRefs: () => git(origin, ['for-each-ref', '--format=%(refname) %(objectname)']),
  };
}

/** A completed newest run whose bundle says `status`. */
function finishedEnv(fx, status) {
  return syncEnv({
    runs: [ghRun(101, 'completed', 1)],
    artifacts: { 101: ['harness-state'] },
    bundles: { 101: bundle(fx, status, { status, questions: [] }) },
  });
}

test('review is refused while the newest run is in progress, or its bundle is parked; origin unchanged', async (t) => {
  const fx = await reviewFixture(t);
  const before = await fx.originRefs();
  for (const env of [syncEnv({ runs: [ghRun(102, 'in_progress', 2)] }), finishedEnv(fx, 'parked')]) {
    const result = await remoteRun(fx, ['review', 'feat_x', '--review-file', fx.reviewFile], env);
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /feat_x is (running|parked) on GitHub/);
  }
  assert.equal(await fx.originRefs(), before);
  assert.deepEqual(joined(fx).filter((line) => line.startsWith('workflow run')), []);
  assert.equal(existsSync(fx.copy), false);
});

test('review places the next round by exact branch equality, commits it, and dispatches once', async (t) => {
  const fx = await reviewFixture(t, ['feat_x_review.md', 'feat_x_extra_review_5.md']);
  const tipBefore = await fx.git(fx.origin, ['rev-parse', 'refs/heads/feat_x']);

  const result = await remoteRun(fx, ['review', 'feat_x', '--review-file', fx.reviewFile], finishedEnv(fx, 'completed'));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`^remote-run\\.sh: placed ${REVIEW_DIR}/feat_x_review_2\\.md \\(round 2\\) on feat_x$`, 'm'));

  assert.equal(await fx.git(fx.origin, ['rev-list', '--count', `${tipBefore}..refs/heads/feat_x`]), '1');
  assert.equal(await fx.git(fx.origin, ['log', '-1', '--format=%s', 'refs/heads/feat_x']), 'chore: add user review for feat_x');
  assert.equal(await fx.git(fx.origin, ['diff', '--name-only', tipBefore, 'refs/heads/feat_x']), `${REVIEW_DIR}/feat_x_review_2.md`);
  assert.equal((await runGit(fx.origin, ['show', `refs/heads/feat_x:${REVIEW_DIR}/feat_x_review_2.md`])).stdout, REVIEW_BYTES);
  assert.deepEqual(joined(fx).filter((line) => line.startsWith('workflow run')), [REVIEW_DISPATCH]);

  assert.equal(existsSync(fx.copy), false, 'the copy was left behind');
  const local = await runBash(fx.dir, ['-c', 'git show-ref --verify --quiet refs/heads/feat_x']);
  assert.notEqual(local.status, 0, 'the local branch feat_x was left behind');
  assert.doesNotMatch((await runGit(fx.dir, ['worktree', 'list'])).stdout, /-feat_x\b/);
  assert.equal(existsSync(fx.bootstrapMarker), false, 'the copy was bootstrapped');
});

test('review of a branch with no earlier round places round 1', async (t) => {
  const fx = await reviewFixture(t);
  const result = await remoteRun(fx, ['review', 'feat_x', '--review-file', fx.reviewFile], finishedEnv(fx, 'failed'));
  assert.equal(result.status, 0, result.stderr);
  assert.equal((await runGit(fx.origin, ['show', `refs/heads/feat_x:${REVIEW_DIR}/feat_x_review.md`])).stdout, REVIEW_BYTES);
});

test('review --allow-no-run places round 1 on a branch with no harness run on GitHub, and dispatches once', async (t) => {
  const fx = await reviewFixture(t);
  const tipBefore = await fx.git(fx.origin, ['rev-parse', 'refs/heads/feat_x']);
  const result = await remoteRun(fx, ['review', 'feat_x', '--review-file', fx.reviewFile, '--allow-no-run'], syncEnv({ runs: [] }));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await fx.git(fx.origin, ['log', '-1', '--format=%s', 'refs/heads/feat_x']), 'chore: add user review for feat_x');
  assert.equal(await fx.git(fx.origin, ['diff', '--name-only', tipBefore, 'refs/heads/feat_x']), `${REVIEW_DIR}/feat_x_review.md`);
  assert.equal((await runGit(fx.origin, ['show', `refs/heads/feat_x:${REVIEW_DIR}/feat_x_review.md`])).stdout, REVIEW_BYTES);
  assert.deepEqual(joined(fx).filter((line) => line.startsWith('workflow run')), [REVIEW_DISPATCH]);
  assert.equal(existsSync(fx.copy), false, 'the copy was left behind');
});

test('review with no harness run on GitHub and no --allow-no-run is refused; origin unchanged', async (t) => {
  const fx = await reviewFixture(t);
  const before = await fx.originRefs();
  const result = await remoteRun(fx, ['review', 'feat_x', '--review-file', fx.reviewFile], syncEnv({ runs: [] }));
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /no `harness run feat_x` run on GitHub/);
  assert.equal(await fx.originRefs(), before);
  assert.deepEqual(joined(fx).filter((line) => line.startsWith('workflow run')), []);
});

test('review under forge github reports the round on the issue, naming the round, source and actor, and labels running', async (t) => {
  const fx = await reviewFixture(t, [], { forge: true });
  const source = 'https://github.com/octo/fixture/pull/12#pullrequestreview-1';
  const result = await remoteRun(fx,
    ['review', 'feat_x', '--review-file', fx.reviewFile, '--allow-no-run', '--actor', 'alice', '--source', source],
    {
      ...syncEnv({ runs: [] }), STUB_REPO_VIEW: '{"nameWithOwner":"o/r"}',
      GITHUB_REPOSITORY: '', GITHUB_SERVER_URL: '', GITHUB_RUN_ID: '', RUNNER_TEMP: '',
    });
  assert.equal(result.status, 0, result.stderr);
  const sent = joined(fx);
  const dispatched = sent.indexOf(REVIEW_DISPATCH);
  assert.ok(dispatched >= 0, sent.join('\n'));
  const comments = posted(fx).filter((call) => call.args.join(' ').startsWith(COMMENT_ON_7));
  assert.equal(comments.length, 1, sent.join('\n'));
  assert.ok(sent.findIndex((line) => line.startsWith(COMMENT_ON_7)) > dispatched, sent.join('\n'));
  assert.match(comments[0].body, /A user-review round started on `feat_x`/);
  assert.ok(comments[0].body.includes(`Round 1 from ${source} by @alice`), comments[0].body);
  assert.match(comments[0].body, /event=round branch=feat_x/);
  assert.deepEqual(sent.filter((line) => line.startsWith(LABEL_ON_7)), [`${LABEL_ON_7} -f labels[]=sdlc-harness: running`]);
});

test('review --actor, --reviewers or --source of the wrong shape is a usage error, and each option off review too; nothing pushed or called', async (t) => {
  const fx = await reviewFixture(t);
  const before = await fx.originRefs();
  for (const extra of [['--actor', 'x y'], ['--reviewers', 'alice,x y'], ['--reviewers', 'alice,'], ['--source', 'http://example.com/r'], ['--source', 'x']]) {
    const result = await remoteRun(fx, ['review', 'feat_x', '--review-file', fx.reviewFile, '--allow-no-run', ...extra], syncEnv({ runs: [] }));
    assert.equal(result.status, 1, `${extra.join(' ')}: ${result.stderr}`);
  }
  for (const misplaced of [['--allow-no-run'], ['--reviewers', 'alice'], ['--source', 'https://example.com/r']]) {
    const result = await remoteRun(fx, ['pause', 'feat_x', ...misplaced]);
    assert.equal(result.status, 1, `${misplaced.join(' ')}: ${result.stderr}`);
  }
  assert.equal(await fx.originRefs(), before);
  assert.deepEqual(calls(fx), []);
});

// ---------------------------------------------------------------------------
// discard — the commands' removal of a directory they fetched into.
// ---------------------------------------------------------------------------

const SCRATCH = `${STATE_DIR}/scratch`;

test('discard removes a nested directory under scratch with its files, and calls nothing', async (t) => {
  const fx = await remoteFixture(t);
  const target = `${SCRATCH}/branch-answer-feat_x`;
  mkdirSync(join(fx.dir, target, 'clarifications', 'feat_x'), { recursive: true });
  writeFileSync(join(fx.dir, target, 'status.json'), '{}\n');
  writeFileSync(join(fx.dir, target, 'clarifications', 'feat_x', 'question_1.md'), 'q\n');

  const result = await remoteRun(fx, ['discard', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`removed ${target}`));
  assert.equal(existsSync(join(fx.dir, target)), false);
  assert.equal(existsSync(join(fx.dir, SCRATCH)), true, 'the scratch directory itself was removed');
  assert.deepEqual(calls(fx), []);
});

test('discard of an absent directory exits 0 with the does-not-exist line, under any execution.target', async (t) => {
  const fx = await remoteFixture(t, 'local');
  const before = await snapshotTree(fx.dir, { exclude: ['.git', 'stub'] });
  const result = await remoteRun(fx, ['discard', `${SCRATCH}/branch-pause-feat_x`]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /branch-pause-feat_x does not exist; nothing removed/);
  assert.deepEqual(await snapshotTree(fx.dir, { exclude: ['.git', 'stub'] }), before);
  assert.deepEqual(calls(fx), []);
});

test('discard of a slash-bearing branch\'s folded directory leaves nothing under scratch', async (t) => {
  const fx = await remoteFixture(t);
  const before = readdirSync(join(fx.dir, SCRATCH)).sort();
  const target = `${SCRATCH}/branch-pause-feat_recent_searches_panel`;
  mkdirSync(join(fx.dir, target), { recursive: true });
  writeFileSync(join(fx.dir, target, 'status.json'), '{}\n');

  const result = await remoteRun(fx, ['discard', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(join(fx.dir, SCRATCH)).sort(), before);
  assert.deepEqual(calls(fx), []);
});

test('discard refuses every path not strictly inside scratch, or a symlink, or a file, with exit 2 and every byte unchanged', async (t) => {
  const fx = await remoteFixture(t);
  const outside = mkdtempSync(join(tmpdir(), 'remote-discard-'));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(join(outside, 'keep.txt'), 'keep\n');
  symlinkSync(outside, join(fx.dir, SCRATCH, 'link'));
  mkdirSync(join(fx.dir, STATE_DIR, 'autonomous_logs'), { recursive: true });
  writeFileSync(join(fx.dir, STATE_DIR, 'autonomous_logs', 'keep.log'), 'keep\n');
  const fixtureBefore = await snapshotTree(fx.dir, { exclude: ['.git', 'stub'] });
  const outsideBefore = await snapshotTree(outside);

  for (const target of [
    SCRATCH,
    `${SCRATCH}/.`,
    `${STATE_DIR}/autonomous_logs`,
    `${SCRATCH}/../autonomous_logs`,
    outside,
    `${SCRATCH}/link`,
    `${SCRATCH}/README.md`,
  ]) {
    const result = await remoteRun(fx, ['discard', target]);
    assert.equal(result.status, 2, `${target}: ${result.stderr}`);
    assert.match(result.stderr, /nothing removed/, target);
  }
  assert.deepEqual(await snapshotTree(fx.dir, { exclude: ['.git', 'stub'] }), fixtureBefore);
  assert.deepEqual(await snapshotTree(outside), outsideBefore);
  assert.deepEqual(calls(fx), []);
});

test('discard with no <dir>, or with two, is a usage error that calls nothing', async (t) => {
  const fx = await remoteFixture(t);
  for (const args of [['discard'], ['discard', `${SCRATCH}/a`, `${SCRATCH}/b`]]) {
    const result = await remoteRun(fx, args);
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stderr}`);
  }
  assert.deepEqual(calls(fx), []);
});
