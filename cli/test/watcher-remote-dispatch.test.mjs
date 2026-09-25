/**
 * The written watcher's inbox pass with `execution.target` `github-actions`: a drop is prepared as
 * today — working copy, artifact committed and pushed — and then handed to `remote-run.sh dispatch`
 * instead of spawned. Driven against a fixture whose own files are committed and pushed to a bare
 * `origin`, so `create-worktree.sh` cuts a real sibling working copy, with the agent CLI, the
 * notifier and `gh` recorded.
 *
 * **The rule these tests exist to enforce: a remote drop reaches GitHub only once its artifact is on
 * `origin/<branch>`, and with the key absent the inbox pass is today's.** A failed push sends no
 * `workflow run` at all; the key-absent case launches the agent stub and sends nothing to `gh`.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { runGit } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const REGISTRY_PATH = `${STATE_DIR}/autonomous_logs/registry.json`;

/** `gh`, recorded: each argument vector appended to `STUB_LOG`; a call starting `STUB_FAIL_ON` exits 4. */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
const line = args.join(' ');
const failOn = process.env.STUB_FAIL_ON;
if (failOn && line.startsWith(failOn)) {
  process.stderr.write('stub gh failure\\n');
  process.exit(4);
}
if (line.startsWith('run list')) process.stdout.write('[]');
`;

/** A bare repository's hook refusing every branch UPDATE while still accepting a branch creation. */
const REJECT_UPDATES = `#!/bin/sh
while read old new ref; do
  case "$old" in
    *[!0]*) echo "fixture origin: updates refused" >&2; exit 1 ;;
  esac
done
exit 0
`;

const taskDispatch = (branch, engine) =>
  `workflow run harness-run.yml --ref ${branch} -f action=run -f branch=${branch} -f engine=${engine} -f resume=none -f chain=0`;

/**
 * A watcher fixture adopted on `origin`'s default branch, with `execution.target` set to `target`
 * (or absent when `null`) and the bootstrap's install and build unset, so `create-worktree.sh` runs
 * offline.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ target?: string | null }} [options]
 */
async function createDispatchFixture(t, { target = 'github-actions' } = {}) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const configPath = join(w.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  delete config.commands.depInstall;
  delete config.commands.build;
  if (target !== null) config.execution = { target };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  const worktree = `${w.dir}-${w.branch}`;
  const origin = `${w.dir}-origin.git`;
  t.after(() => rm(worktree, { recursive: true, force: true }));

  // `init` has already made the fixture's first commit, unrelated to the seed on `origin`, so the
  // adopted tree replaces that seed outright — past the protected-branch pre-push hook `init` wired.
  await runGit(w.dir, ['add', '-A']);
  await runGit(w.dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  await runGit(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  const ghStub = join(w.dir, 'watcher-test', 'gh');
  const ghLog = join(w.dir, 'watcher-test', 'gh.log');
  await writeFile(ghStub, GH_STUB, { mode: 0o755 });

  const git = async (cwd, args) => (await runGit(cwd, args)).stdout.trim();

  return {
    ...w,
    worktree,
    origin,
    tick: (env = {}) => w.tick({ HARNESS_GH_CLI: ghStub, STUB_LOG: ghLog, ...env }),
    drop: (name, body) => writeFile(join(w.dir, STATE_DIR, 'autonomous_inbox', name), body, 'utf8'),
    inInbox: (name) => existsSync(join(w.dir, STATE_DIR, 'autonomous_inbox', name)),
    ghCalls: () =>
      existsSync(ghLog)
        ? readFileSync(ghLog, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).join(' '))
        : [],
    workflowRuns() {
      return this.ghCalls().filter((c) => c.startsWith('workflow run'));
    },
    async patchRecord(fields) {
      const path = join(w.dir, REGISTRY_PATH);
      const registry = JSON.parse(readFileSync(path, 'utf8'));
      Object.assign(registry.runs[w.branch], fields);
      await writeFile(path, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    },
    rejectUpdates: () => writeFile(join(origin, 'hooks', 'pre-receive'), REJECT_UPDATES, { mode: 0o755 }),
    subject: (rev = 'HEAD') => git(worktree, ['log', '-1', '--format=%s', rev]),
    head: () => git(worktree, ['rev-parse', 'HEAD']),
    originTip: () => git(origin, ['rev-parse', `refs/heads/${w.branch}`]),
    git,
  };
}

const failures = (f) => f.notifications().filter((n) => n.event === 'failed');

test('a remote task drop is committed, pushed and dispatched, never spawned', async (t) => {
  const f = await createDispatchFixture(t);
  if (f === null) return;

  await f.drop('feat_x_task_prompt.md', 'do the thing\n');
  await f.tick();

  assert.equal(await f.subject(), 'chore: add task prompt for feat_x');
  assert.equal(await f.originTip(), await f.head(), 'the prompt commit is not on origin/feat_x');
  assert.deepEqual(f.workflowRuns(), [taskDispatch('feat_x', 'task')]);

  const record = f.record();
  assert.equal(record.execution, 'github-actions');
  assert.equal(record.status, 'running');
  assert.equal(record.pid, '');
  assert.match(record.remote_dispatched_at, /^\d+$/);
  assert.deepEqual(f.prompts(), [], 'the agent stub was launched');
  const launched = f.notifications().filter((n) => n.event === 'launched');
  assert.deepEqual(launched.map((n) => n.detail), ['dispatched to GitHub Actions']);
});

test('the usage hold and the cap do not gate a remote drop; the kill switch still defers it', async (t) => {
  const f = await createDispatchFixture(t);
  if (f === null) return;

  const stop = join(f.dir, STATE_DIR, 'AUTONOMOUS_STOP');
  await writeFile(stop, '', 'utf8');
  await f.drop('feat_x_task_prompt.md', 'do the thing\n');
  await f.tick();
  assert.ok(f.inInbox('feat_x_task_prompt.md'), 'the kill switch did not defer the drop');
  assert.deepEqual(f.ghCalls(), []);
  assert.equal(existsSync(f.worktree), false);

  await rm(stop);
  await writeFile(join(f.dir, STATE_DIR, 'autonomous_logs', '.usage_hold'), '', 'utf8');
  await f.tick({ MAX_PARALLEL_RUNS: '0' });
  assert.equal(f.inInbox('feat_x_task_prompt.md'), false);
  assert.deepEqual(f.workflowRuns(), [taskDispatch('feat_x', 'task')]);
  assert.equal(f.record().status, 'running');
});

test('a failed dispatch leaves the record failed with one failed notification', async (t) => {
  const f = await createDispatchFixture(t);
  if (f === null) return;

  await f.drop('feat_x_task_prompt.md', 'do the thing\n');
  await f.tick({ STUB_FAIL_ON: 'workflow run' });

  assert.equal(f.record().status, 'failed');
  assert.equal(f.record().remote_dispatched_at, '');
  const failed = failures(f);
  assert.equal(failed.length, 1, JSON.stringify(f.notifications()));
  assert.match(failed[0].detail, /remote-run\.sh dispatch failed/);
  assert.equal(f.notifications().some((n) => n.event === 'launched'), false);
  assert.deepEqual(f.prompts(), []);
});

test('a push origin refuses blocks the dispatch', async (t) => {
  const f = await createDispatchFixture(t);
  if (f === null) return;

  await f.rejectUpdates();
  await f.drop('feat_x_task_prompt.md', 'do the thing\n');
  await f.tick();

  assert.equal(await f.subject(), 'chore: add task prompt for feat_x', 'the commit itself should land');
  assert.deepEqual(f.workflowRuns(), []);
  assert.equal(f.record().status, 'failed');
  const failed = failures(f);
  assert.equal(failed.length, 1, JSON.stringify(f.notifications()));
  assert.match(failed[0].detail, /push-branch\.sh/);
  assert.deepEqual(f.prompts(), []);
});

test('a remote review drop fast-forwards, commits, pushes and dispatches; a refused re-push blocks', async (t) => {
  const f = await createDispatchFixture(t);
  if (f === null) return;

  await f.drop('feat_x_task_prompt.md', 'do the thing\n');
  await f.tick();
  await f.patchRecord({ status: 'completed' });

  // The job advancing the branch on origin, which this working copy has not seen.
  const tip = await f.git(f.dir, ['rev-parse', 'refs/heads/feat_x']);
  const tree = await f.git(f.dir, ['rev-parse', `${tip}^{tree}`]);
  const jobCommit = await f.git(f.dir, ['commit-tree', tree, '-p', tip, '-m', 'job: advance the branch']);
  await runGit(f.dir, ['push', '--quiet', f.origin, `${jobCommit}:refs/heads/feat_x`]);

  await t.test('the review is committed on top of the job commit and dispatched', async () => {
    await f.drop('feat_x_review.md', 'fix the button\n');
    await f.tick();

    assert.equal(await f.subject(), 'chore: add user review for feat_x');
    assert.equal(await f.subject('HEAD~1'), 'job: advance the branch');
    assert.equal(await f.originTip(), await f.head());
    assert.deepEqual(f.workflowRuns(), [taskDispatch('feat_x', 'task'), taskDispatch('feat_x', 'user_review')]);
    assert.equal(f.record().status, 'running');
    assert.equal(f.record().engine, 'user_review');
    assert.ok(f.ghCalls().some((c) => c.startsWith('run list')), 'no sync ran before the duplicate test');
  });

  await t.test('a review whose push is refused, then re-dropped identically, never dispatches', async () => {
    await f.patchRecord({ status: 'completed' });
    await f.rejectUpdates();
    const before = failures(f).length;

    await f.drop('feat_x_review_2.md', 'round two\n');
    await f.tick();
    assert.equal(await f.subject(), 'chore: add user review for feat_x');
    assert.notEqual(await f.originTip(), await f.head());
    assert.equal(f.record().status, 'failed');
    assert.equal(failures(f).length, before + 1);
    assert.match(failures(f).at(-1).detail, /push-branch\.sh/);

    const committed = await f.head();
    await f.drop('feat_x_review_2.md', 'round two\n');
    await f.tick();
    assert.equal(await f.head(), committed, 'the identical re-drop made a commit');
    assert.match(f.watcherLog(), /already committed \(identical re-drop\) — skipping the commit, pushing anyway/);
    assert.equal(f.record().status, 'failed');
    assert.equal(failures(f).length, before + 2);
    assert.match(failures(f).at(-1).detail, /push-branch\.sh/);
    assert.equal(f.workflowRuns().length, 2, 'a refused push was followed by a dispatch');
  });
});

test('with the key absent the same drop launches the agent and sends nothing to gh', async (t) => {
  const f = await createDispatchFixture(t, { target: null });
  if (f === null) return;

  await f.drop('feat_x_task_prompt.md', 'do the thing\n');
  await f.tick();

  assert.equal(f.prompts().length, 1, 'the agent stub was not launched');
  assert.deepEqual(f.ghCalls(), []);
  assert.equal(await f.subject(), 'chore: add task prompt for feat_x');
  const record = f.record();
  assert.equal(record.status, 'completed');
  assert.equal(record.engine, 'task');
  assert.equal(record.worktree, f.worktree);
  assert.match(String(record.pid), /^\d+$/);
  assert.equal('execution' in record, false);
  assert.equal('remote_dispatched_at' in record, false);
  const launched = f.notifications().filter((n) => n.event === 'launched');
  assert.deepEqual(launched.map((n) => n.detail), ['engine=task']);
});
