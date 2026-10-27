/**
 * The written watcher's run-analytics hook (`autonomous-watcher.sh` → `record_run_analytics`, called
 * in `spawn_engine`'s subshell between `rc=${PIPESTATUS[0]}` and `classify_run_exit`), driven by real
 * passes of the `init`-written watcher against a fixture whose stub agent prints a stream.
 *
 * **The rule these tests exist to enforce: the session's analytics are committed on the run's branch
 * after every session, and the analytics step never changes the run's status, exit handling or
 * notifications.**
 *
 * Not covered here: job mode, which reaches the same `spawn_engine` line and is driven elsewhere
 * (`cli/test/watcher-remote-job.test.mjs`); and the metrics themselves (`cli/test/run-analytics.test.mjs`).
 *
 * The cases share one fixture and run in order: the launch commits and sets the baseline, a resume
 * over the same session commits nothing, and two failing resumes are held to the successful resume's
 * outcome. A resume's outcome is compared with a resume's, because a resume adds its own `resumed`
 * notification that a launch does not.
 */

import assert from 'node:assert/strict';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, runGit } from './helpers/fixture.mjs';
import { createWatcherFixture, TICK_TIMEOUT_MS } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];
const SUBJECT = 'chore: Record run analytics for feat_x';
const OUT_REL = `${STATE_DIR}/run_analytics/feat_x`;
/**
 * `RUN_ANALYTICS_SUSPEND_SOURCE=none` keeps the host's suspend log out of every pass, and a
 * `CLAUDE_CONFIG_DIR` that is never created keeps the real account's transcripts out of it.
 */
const PASS_ENV = {
  RUN_ANALYTICS_SUSPEND_SOURCE: 'none',
  CLAUDE_CONFIG_DIR: join(tmpdir(), `watcher-run-analytics-no-home-${process.pid}`),
};
/**
 * Every pass here runs the real hook, whose two commits lengthen it (`./helpers/watcher.mjs`, choice
 * 6); a ceiling, so a passing pass still returns when it is done. `TICK_TIMEOUT_MS` is already scaled.
 */
const PASS_OPTIONS = { timeoutMs: TICK_TIMEOUT_MS * 2 };

/** A stub body printing one complete session, `id`, to stdout — the stream the watcher tees. */
function sessionStub(id) {
  const lines = [
    { type: 'system', subtype: 'init', session_id: id },
    { type: 'user', timestamp: '2026-01-01T00:00:00.000Z', message: { role: 'user', content: 'Go.' } },
    { type: 'assistant', timestamp: '2026-01-01T00:00:01.000Z', message: { id: `${id}-m1`, content: [] } },
    { type: 'result', subtype: 'success', timestamp: '2026-01-01T00:00:02.000Z', duration_ms: 2000 },
  ];
  return lines.map((line) => `printf '%s\\n' '${JSON.stringify(line)}'`).join('\n');
}

/**
 * A watcher fixture adopted on `origin`'s default branch, as `cli/test/watcher-run-profile.test.mjs`
 * → `adoptedFixture` builds it: unadopted, the main checkout's `HEAD` is unborn on the protected
 * default branch, where `hr_commit_placed` refuses every commit.
 *
 * @param {import('node:test').TestContext} t
 */
async function adoptedFixture(t) {
  const w = await createWatcherFixture(t, { runAnalytics: true });
  if (w === null) return null;

  const config = JSON.parse(await readFile(join(w.dir, 'harness.config.json'), 'utf8'));
  await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n', { flag: 'a' });
  await runGit(w.dir, ['add', '-A']);
  await runGit(w.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  const clone = `${w.dir}-${w.branch}`;
  t.after(() => rm(clone, { recursive: true, force: true }));
  const ref = `refs/heads/${w.branch}`;
  const cloneClar = join(clone, STATE_DIR, 'clarifications', w.branch);

  return {
    ...w,
    clone,
    scriptPath: join(w.dir, INIT_SCRIPTS_DIR, 'run-analytics.sh'),
    drop: () => writeFile(join(w.dir, STATE_DIR, 'autonomous_inbox', `${w.branch}_task_prompt.md`), 'do it\n', 'utf8'),
    /** `[sha, subject]` of every analytics commit on the branch in `repo`, newest first. */
    async analyticsCommits(repo) {
      const out = (await runGit(repo, ['log', '--format=%H%x09%s', ref])).stdout.trim();
      return out
        .split('\n')
        .map((line) => line.split('\t'))
        .filter(([, subject]) => subject === SUBJECT);
    },
    tip: async (repo) => (await runGit(repo, ['rev-parse', ref])).stdout.trim(),
    /**
     * The clone parked with one answered pair under its own state directory, where
     * `resume_parked_run` looks — the helper's `writeQuestion` / `writeAnswer` write under the
     * main checkout, which a clone run never reads.
     */
    async parkClone(n) {
      await w.seedRecord({ status: 'parked', worktree: clone, copy_kind: 'clone' });
      await mkdir(cloneClar, { recursive: true });
      await writeFile(join(cloneClar, `question_${n}.md`), `## Q${n}\n`, 'utf8');
      await writeFile(join(cloneClar, `answer_${n}.md`), `a${n}\n`, 'utf8');
    },
  };
}

/** What a pass's outcome is held to: the record's status and the notification events it added. */
function outcome(f, notificationsBefore) {
  return { status: f.record().status, events: f.notifications().slice(notificationsBefore).map((n) => n.event) };
}

test('the session\'s analytics are committed on the run\'s branch, and a failing step changes no outcome', async (t) => {
  const f = await adoptedFixture(t);
  if (f === null) return;

  await t.test('a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout', async () => {
    await f.setStub(sessionStub('sess-launch'));
    await f.drop();
    await f.tick(PASS_ENV, PASS_OPTIONS);

    assert.equal(f.record().copy_kind, 'clone', f.watcherLog());
    assert.equal(f.record().worktree, f.clone);
    assert.equal(f.prompts().length, 1, f.watcherLog());

    const commits = await f.analyticsCommits(f.clone);
    assert.equal(commits.length, 2, `${JSON.stringify(commits)}\n${f.watcherLog()}`);
    const names = [];
    for (const [sha] of commits) {
      names.push((await runGit(f.clone, ['show', '--name-only', '--format=', sha])).stdout.trim().split('\n'));
    }
    assert.deepEqual(names, [[`${OUT_REL}/run-analytics.md`], [`${OUT_REL}/run-analytics.json`]]);

    assert.deepEqual(await f.analyticsCommits(f.dir), commits, `the main checkout lags:\n${f.watcherLog()}`);
    assert.equal(await f.tip(f.dir), await f.tip(f.clone));

    // A launch notifies `launched`, then the one outcome `classify_run_exit` names.
    const launch = outcome(f, 0);
    assert.notEqual(launch.status, 'failed', f.watcherLog());
    assert.equal(launch.events.length, 2, JSON.stringify(f.notifications()));
    assert.equal(launch.events[0], 'launched');

    const status = await runGit(f.clone, ['status', '--porcelain', '--', `${STATE_DIR}/run_analytics/`]);
    assert.equal(status.stdout, '');
  });

  let resumeBaseline;

  // A session_id seen again is recorded as a resume occurrence, so a resume reprinting the launch's
  // session is new data; only a session that adds nothing leaves both blobs identical.
  await t.test('a resume that adds no session adds no analytics commit', async () => {
    const before = await f.analyticsCommits(f.clone);
    const notified = f.notifications().length;
    await f.setStub(':');
    await f.parkClone(1);
    await f.tick(PASS_ENV, PASS_OPTIONS);

    assert.equal(f.prompts().length, 2, `the parked run was not resumed:\n${f.watcherLog()}`);
    assert.deepEqual(await f.analyticsCommits(f.clone), before, f.watcherLog());
    resumeBaseline = outcome(f, notified);
    assert.notEqual(resumeBaseline.status, 'failed', f.watcherLog());
  });

  /**
   * One resume printing a session the record has never seen, so a working step would commit; held
   * to the successful resume's outcome, with no commit added and `logged` new watcher-log lines.
   */
  async function failingResume(n, id, logged) {
    assert.ok(resumeBaseline, 'the resume case did not run');
    const before = await f.analyticsCommits(f.clone);
    const notified = f.notifications().length;
    const logBefore = f.watcherLog().length;
    await f.setStub(sessionStub(id));
    await f.parkClone(n);
    await f.tick(PASS_ENV, PASS_OPTIONS);

    assert.equal(f.prompts().length, n + 1, `the parked run was not resumed:\n${f.watcherLog()}`);
    assert.deepEqual(outcome(f, notified), resumeBaseline);
    assert.deepEqual(await f.analyticsCommits(f.clone), before);
    const added = f.watcherLog().slice(logBefore).split('\n').filter(logged);
    assert.equal(added.length, 1, f.watcherLog().slice(logBefore));
  }

  await t.test('a run-analytics.sh that exits 1 changes neither the status nor the notifications', async () => {
    await writeFile(f.scriptPath, '#!/usr/bin/env bash\nexit 1\n', 'utf8');
    await chmod(f.scriptPath, 0o755);
    await failingResume(2, 'sess-fail', (line) => line.includes(`run analytics: '${f.branch}' not recorded (exit 1)`));
  });

  await t.test('a missing run-analytics.sh changes neither the status nor the notifications', async () => {
    await rm(f.scriptPath);
    await failingResume(
      3,
      'sess-missing',
      (line) => line.includes('run analytics: ') && line.includes('run-analytics.sh') && line.includes('init --force'),
    );
  });
});
