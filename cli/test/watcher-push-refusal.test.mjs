/**
 * The written watcher's reaction to a push-refusal record — `check_push_refusals`, `classify_run_exit`'s
 * own-branch check and `push_refusal_fail` in `autonomous-watcher.sh` — with each record written
 * through the library's `hr_push_refusal_record`, so the fixture has the producer's own shape.
 *
 * **The rule this suite enforces: a refused push stops the run visibly.** A record for a `running`
 * run's branch stops its session at the next tick, sets it `failed` with `push refused: <reason>`,
 * sends one `failed` notification carrying the reason verbatim and moves the record to `handled/`;
 * in a job it also prints an `::error title=Push refused::` annotation, stops the job with decision
 * `stop`, and writes nothing to `$GITHUB_STEP_SUMMARY`. A session that exits 0 after its push was
 * refused ends `failed`, not `completed`. A record for another branch changes nothing, and one
 * branch's exit never acts on another branch's record. A record that predates a launch is filed as
 * handled, and it does not fail that launch.
 *
 * The stub writes the record from inside the session, then, where the case needs the tick pass,
 * waits for the registry to show `failed` before it exits — bounded — because inside the sandbox
 * `pgrep -P` lists nothing and the teardown reaches only the launch subshell
 * (`helpers/watcher.mjs`, choice 7). Every path in a stub body is a literal: a local session does
 * not inherit the recorders' variables.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, runBash } from './helpers/fixture.mjs';
import { scaleBound } from './helpers/timing.mjs';
import {
  DEFAULT_KEEP_AWAKE_PROBE,
  DEFAULT_PLACEHOLDER_HOST_PROBE,
  DEFAULT_SANDBOX_PROBE,
  createWatcherFixture,
  finishedLedgerBody,
} from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const REGISTRY_PATH = `${STATE_DIR}/autonomous_logs/registry.json`;
const LIB_PATH = `${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh`;
const RUN_TIMEOUT_MS = scaleBound(120_000);
/** How long, in tenths of a second, a stub waits for the tick pass to mark its run failed. */
const FAILED_WAIT_TENTHS = scaleBound(600);

const CREDENTIAL_REASON =
  'the commits to send carry a credential value; rewrite those commits without it, then push by hand';
const WORKFLOW_REASON =
  'the commits to send change a file under .github/workflows/, and a workflow edit is supervised-only; nothing was pushed — review these commits and push them by hand, or rewrite them without that change';

function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

const refusalDir = (f) => join(f.dir, '.git', 'harness-push-refusals');
const pending = (f) =>
  existsSync(refusalDir(f)) ? readdirSync(refusalDir(f)).filter((name) => name.endsWith('.refusal')) : [];
const handled = (f) =>
  existsSync(join(refusalDir(f), 'handled')) ? readdirSync(join(refusalDir(f), 'handled')) : [];

/** Shell lines writing one record for `branch` through the library. */
function recordLines(f, branch, reason) {
  return [
    `. ${shellQuote(join(f.dir, LIB_PATH))}`,
    `hr_push_refusal_record ${shellQuote(f.dir)} ${shellQuote(branch)} ${shellQuote(reason)}`,
  ];
}

/** A stub body that writes a record, marks `written`, then waits for its run to read `failed`. */
function refuseThenWait(f, reason) {
  return [
    ...recordLines(f, f.branch, reason),
    `: > ${shellQuote(join(f.dir, 'watcher-test', 'written'))}`,
    `for i in $(seq 1 ${FAILED_WAIT_TENTHS}); do`,
    `  [ "$(jq -r --arg b ${shellQuote(f.branch)} '.runs[$b].status' ${shellQuote(join(f.dir, REGISTRY_PATH))})" = failed ] && break`,
    '  sleep 0.1',
    'done',
  ].join('\n');
}

/** A `paused` record and an empty RESUME, so the next tick launches the stub. */
async function arm(f) {
  await f.seedRecord({ status: 'paused' });
  await mkdir(join(f.dir, STATE_DIR), { recursive: true });
  await writeFile(join(f.dir, STATE_DIR, 'RESUME'), '', 'utf8');
}

/** Two passes: the first launches the stub, the second runs once the record is written. */
async function twoTicks(t, f) {
  const written = join(f.dir, 'watcher-test', 'written');
  const script = [
    '. "$1" status >/dev/null',
    `hr_sandbox_prereq_probe_var() {\n${DEFAULT_SANDBOX_PROBE}\n}`,
    `hr_keep_awake_probe_var() {\n${DEFAULT_KEEP_AWAKE_PROBE}\n}`,
    `hr_placeholder_host_probe_var() {\n${DEFAULT_PLACEHOLDER_HOST_PROBE}\n}`,
    'tick',
    `n=0; until [ -e ${shellQuote(written)} ] || [ "$n" -ge ${FAILED_WAIT_TENTHS} ]; do sleep 0.1; n=$((n + 1)); done`,
    'tick',
    'wait',
  ].join('\n');
  const result = await runBash(f.dir, ['-c', script, '_', f.watcherPath], f.watcherEnv(), {
    timeoutMs: RUN_TIMEOUT_MS,
    signal: t.signal,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result;
}

for (const [label, reason] of [
  ['a credential reason', CREDENTIAL_REASON],
  ['a workflow-file reason', WORKFLOW_REASON],
]) {
  test(`locally, the tick pass stops a running session on ${label}`, async (t) => {
    const f = await createWatcherFixture(t);
    if (f === null) return;
    await mkdir(refusalDir(f), { recursive: true });
    const other = await runBash(
      f.dir,
      ['-c', recordLines(f, 'other_branch', CREDENTIAL_REASON).join('\n')],
      f.watcherEnv(),
    );
    assert.equal(other.status, 0, other.stderr);
    await arm(f);
    await f.setStub(refuseThenWait(f, reason));

    await twoTicks(t, f);

    const record = f.record();
    assert.equal(record.status, 'failed', `${JSON.stringify(record)}\n${f.watcherLog()}`);
    assert.equal(record.push_refused, `push refused: ${reason}`);
    assert.ok(!record.push_refusing, JSON.stringify(record));
    const failed = f.notifications().filter((n) => n.event === 'failed');
    assert.equal(failed.length, 1, JSON.stringify(f.notifications()));
    assert.equal(failed[0].detail, `push refused: ${reason}`);
    assert.equal(handled(f).length, 1, `handled: ${handled(f).join(' ')}`);
    // The other branch's record is still pending, and nothing names that branch.
    assert.equal(pending(f).length, 1, `pending: ${pending(f).join(' ')}`);
    assert.equal(f.notifications().some((n) => n.branch === 'other_branch'), false);
  });
}

test('locally, a session that exits 0 after a refused push is failed, not completed', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  await arm(f);
  await f.setStub(recordLines(f, f.branch, CREDENTIAL_REASON).join('\n'));

  await f.tick();

  const record = f.record();
  assert.equal(record.status, 'failed', `${JSON.stringify(record)}\n${f.watcherLog()}`);
  assert.match(record.push_refused, /^push refused: /);
  const failed = f.notifications().filter((n) => n.event === 'failed');
  assert.equal(failed.length, 1, JSON.stringify(f.notifications()));
  assert.match(failed[0].detail, /^push refused: /);
  assert.equal(f.notifications().some((n) => n.event === 'completed'), false);
  assert.equal(handled(f).length, 1);
  assert.equal(pending(f).length, 0);
});

test('locally, one branch\'s exit never acts on another branch\'s record', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const other = 'branch_b';
  const logs = join(f.dir, STATE_DIR, 'autonomous_logs');
  await mkdir(logs, { recursive: true });
  const bRecord = { status: 'paused', worktree: f.dir, log_path: join(logs, `${other}.log`), engine: 'task' };
  await arm(f);
  const registry = JSON.parse(readFileSync(join(f.dir, REGISTRY_PATH), 'utf8'));
  registry.runs[other] = bRecord;
  await writeFile(join(f.dir, REGISTRY_PATH), `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  const written = await runBash(f.dir, ['-c', recordLines(f, other, CREDENTIAL_REASON).join('\n')], f.watcherEnv());
  assert.equal(written.status, 0, written.stderr);
  // A resumed session is `completed` only over a finished ledger.
  await f.setStub(finishedLedgerBody(f.branch));

  await f.tick();

  assert.equal(f.record().status, 'completed', f.watcherLog());
  const b = JSON.parse(readFileSync(join(f.dir, REGISTRY_PATH), 'utf8')).runs[other];
  assert.equal(b.status, 'paused', JSON.stringify(b));
  assert.equal(b.push_refused, undefined, JSON.stringify(b));
  assert.equal(pending(f).length, 1);
  assert.equal(handled(f).length, 0);
  assert.equal(f.notifications().some((n) => n.branch === other), false, JSON.stringify(f.notifications()));
});

test('locally, a record written before a launch is filed as handled and does not fail that launch', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const written = await runBash(f.dir, ['-c', recordLines(f, f.branch, CREDENTIAL_REASON).join('\n')], f.watcherEnv());
  assert.equal(written.status, 0, written.stderr);
  assert.equal(pending(f).length, 1);
  await arm(f);
  // A resumed session is `completed` only over a finished ledger.
  await f.setStub(finishedLedgerBody(f.branch));

  await f.tick();

  const record = f.record();
  assert.equal(record.status, 'completed', `${JSON.stringify(record)}\n${f.watcherLog()}`);
  assert.ok(!record.push_refused, JSON.stringify(record));
  assert.equal(f.notifications().some((n) => n.event === 'failed'), false, JSON.stringify(f.notifications()));
  assert.equal(pending(f).length, 0, `pending: ${pending(f).join(' ')}`);
  assert.equal(handled(f).length, 1, `handled: ${handled(f).join(' ')}`);
});

test('in a job, a refused push is annotated, stops the job, and writes no step summary', async (t) => {
  const f = await createWatcherFixture(t);
  if (f === null) return;
  const rec = join(f.dir, 'watcher-test');
  const runnerTemp = `${f.dir}-runner-temp`;
  t.after(() => rm(runnerTemp, { recursive: true, force: true }));
  await mkdir(runnerTemp, { recursive: true });
  const summary = join(rec, 'step-summary.md');
  await writeFile(
    join(f.dir, INIT_SCRIPTS_DIR, 'remote-run.sh'),
    '#!/usr/bin/env bash\ncase "${1-}" in pause-requested) exit 5 ;; esac\nexit 0\n',
    'utf8',
  );
  await chmod(join(f.dir, INIT_SCRIPTS_DIR, 'remote-run.sh'), 0o755);
  await f.setStub(refuseThenWait(f, WORKFLOW_REASON));

  const result = await runBash(
    f.dir,
    [f.watcherPath, 'job', f.branch, 'task', 'none'],
    f.watcherEnv({
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
      GITHUB_STEP_SUMMARY: summary,
      RUNNER_TEMP: runnerTemp,
      REMOTE_CONTROL_POLL_SECS: '1',
      REMOTE_AUTO_RESUME_DELAY_SECS: '0',
      POLL_INTERVAL_SECS: '1',
      HARNESS_GH_CLI: join(rec, 'gh-never-called'),
    }),
    { timeoutMs: RUN_TIMEOUT_MS, signal: t.signal },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.ok(
    result.stdout.includes(`::error title=Push refused::${WORKFLOW_REASON}`),
    `no annotation:\n${result.stdout}\n${f.watcherLog()}`,
  );
  assert.match(result.stdout, /job: failed stop\s*$/, result.stdout);
  const record = f.record();
  assert.equal(record.status, 'failed', JSON.stringify(record));
  assert.match(record.push_refused, /^push refused: /);
  const status = JSON.parse(readFileSync(join(f.dir, STATE_DIR, 'autonomous_logs', 'remote_status.json'), 'utf8'));
  assert.equal(status.decision, 'stop');
  assert.equal(status.detail, `push refused: ${WORKFLOW_REASON}`);
  const failed = f.notifications().filter((n) => n.event === 'failed');
  assert.equal(failed.length, 1, JSON.stringify(f.notifications()));
  assert.equal(failed[0].detail, `push refused: ${WORKFLOW_REASON}`);
  assert.equal(handled(f).length, 1);
  assert.equal(existsSync(summary), false, 'the watcher wrote the step summary');
});
