/**
 * A run parked or paused in a legacy linked worktree when the clone layout lands, driven through the
 * `init`-written watcher, wrappers and sweep against a fixture with a bare `origin`.
 *
 * **The decision these tests exist to hold: both layouts are supported until no worktree run is
 * left, and no run is migrated on resume.** A record with no `copy_kind` is a legacy worktree: it
 * resumes in that worktree under a per-run profile protecting its `.git` pointer and no clone
 * `.git` path, commits through the main checkout's `commit-on-branch.sh`, pushes through
 * `push-branch.sh`, and once its branch is gone from `origin` is swept from its registry record by
 * `cleanup-merged-worktrees.sh`'s legacy arm. A new run dropped beside it gets a clone.
 *
 * The legacy state is built as it exists when this branch lands: a linked worktree at
 * `hr_worktree_dir` made with `git worktree add -b` and pushed, a registry record with no
 * `copy_kind`, and an answered question under its clarification channel. Every fixture directory
 * is a sibling of the fixture under the system temp directory, and every per-run profile lands
 * under the fixture's own `XDG_STATE_HOME` (`watcherEnv`). The sweep runs under that same
 * environment and removes the legacy run's profile the watcher rendered.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import test from 'node:test';

import { COPY_GIT_PATHS } from '../dist/generators/writeProtection.js';
import { INIT_SCRIPTS_DIR, runBash, runGit } from './helpers/fixture.mjs';
import { scaleBound } from './helpers/timing.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const LEGACY = 'feat_legacy';
const NEW = 'feat_new';
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];
const LIB_PATH = `${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh`;
const REGISTRY_PATH = `${STATE_DIR}/autonomous_logs/registry.json`;

const output = (r) => `${r.stdout}\n${r.stderr}`;

/**
 * An adopted watcher fixture holding `LEGACY`'s linked worktree, pushed with an upstream, its
 * record `{ status, worktree }` with no `copy_kind`, and an answered pair in its channel.
 *
 * @param {import('node:test').TestContext} t
 * @param {'parked' | 'paused'} status
 */
async function legacyFixture(t, status) {
  const w = await createWatcherFixture(t, { branch: LEGACY });
  if (w === null) return null;
  assert.ok(realpathSync(w.dir).startsWith(realpathSync(tmpdir())), `the fixture ${w.dir} is outside the temp directory`);

  const configPath = join(w.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  delete config.commands.depInstall;
  delete config.commands.build;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n', { flag: 'a' });
  await runGit(w.dir, ['add', '-A']);
  await runGit(w.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  const lib = join(w.dir, LIB_PATH);
  const derived = async (branch) => {
    const r = await runBash(w.dir, ['-c', '. "$1"; hr_worktree_dir "$2" "$3"', '_', lib, w.dir, branch]);
    assert.equal(r.status, 0, `hr_worktree_dir failed: ${r.stderr}`);
    const path = r.stdout.trim();
    t.after(() => rm(path, { recursive: true, force: true }));
    return path;
  };

  const wt = await derived(LEGACY);
  await runGit(w.dir, ['worktree', 'add', '--quiet', '-b', LEGACY, wt]);
  // `--no-verify`: `init` installed a `pre-push` hook, and this push is fixture setup.
  await runGit(w.dir, ['push', '--quiet', '--no-verify', '-u', 'origin', LEGACY]);
  const clar = join(wt, STATE_DIR, 'clarifications', LEGACY);
  await mkdir(clar, { recursive: true });
  await writeFile(join(clar, 'question_1.md'), '## Q1\n', 'utf8');
  await writeFile(join(clar, 'answer_1.md'), 'a1\n', 'utf8');
  await w.seedRecord({ status, worktree: wt });

  const recorder = join(w.dir, 'watcher-test');
  const wrapperLog = join(recorder, 'wrapper.log');
  const argvPath = (copy) => join(recorder, `argv-${basename(copy)}.txt`);
  const origin = (await runGit(w.dir, ['config', 'remote.origin.url'])).stdout.trim();

  return {
    ...w,
    config,
    wt,
    lib,
    origin,
    derived,
    wrapperLog,
    /** The stub body: record the argument vector per copy; in the legacy worktree, commit and push. */
    async stubCommitAndPush(subject) {
      await w.setStub(
        [
          `printf '%s\\n' "$@" > '${recorder}'/argv-"$(basename "$PWD")".txt`,
          `if [ "$PWD" = '${wt}' ]; then`,
          '  printf "legacy\\n" > legacy.txt',
          `  bash "$HARNESS_MAIN_REPO/${INIT_SCRIPTS_DIR}/commit-on-branch.sh" --repo "$PWD" legacy.txt -- '${subject}' >> '${wrapperLog}' 2>&1 || echo COMMIT_FAILED >> '${wrapperLog}'`,
          `  bash "$HARNESS_MAIN_REPO/${INIT_SCRIPTS_DIR}/push-branch.sh" "$PWD" >> '${wrapperLog}' 2>&1 || echo PUSH_FAILED >> '${wrapperLog}'`,
          'fi',
        ].join('\n'),
      );
    },
    /** The `--settings` argument the stub received in `copy`, or `undefined` when it never ran there. */
    settingsArg(copy) {
      const path = argvPath(copy);
      if (!existsSync(path)) return undefined;
      const argv = readFileSync(path, 'utf8').split('\n');
      return argv[argv.indexOf('--settings') + 1];
    },
    runs: () => JSON.parse(readFileSync(join(w.dir, REGISTRY_PATH), 'utf8')).runs,
    wrapperOutput: () => (existsSync(wrapperLog) ? readFileSync(wrapperLog, 'utf8') : ''),
  };
}

/** The settings file `copy`'s session got: under `XDG_STATE_HOME`, carrying `wt`'s pointer. */
function assertLegacyProfile(f, settings) {
  assert.ok(settings, `the legacy run was not resumed:\n${f.watcherLog()}`);
  assert.ok(settings.startsWith(`${f.watcherEnv().XDG_STATE_HOME}/`), `${settings} is outside XDG_STATE_HOME`);
  const profile = JSON.parse(readFileSync(settings, 'utf8'));
  const denyWrite = profile.sandbox.filesystem.denyWrite;
  assert.ok(denyWrite.includes(`${f.wt}/.git`), `${f.wt}/.git is not in denyWrite`);
  for (const row of COPY_GIT_PATHS) {
    assert.ok(!denyWrite.includes(`${f.wt}/${row.path}`), `${row.path} was added for a legacy worktree`);
  }
  return profile;
}

/** The wrapper commit is on `LEGACY` in the main checkout, and `origin` carries the same tip. */
async function assertCommittedAndPushed(f, subject) {
  const log = f.wrapperOutput();
  assert.ok(!/COMMIT_FAILED|PUSH_FAILED/.test(log), log);
  const ref = `refs/heads/${LEGACY}`;
  const tip = (await runGit(f.dir, ['rev-parse', ref])).stdout.trim();
  assert.equal((await runGit(f.dir, ['log', '-1', '--format=%s', ref])).stdout.trim(), subject, `no wrapper commit:\n${log}`);
  assert.equal((await runGit(f.wt, ['rev-parse', 'HEAD'])).stdout.trim(), tip);
  const remote = (await runGit(f.dir, ['ls-remote', 'origin', ref])).stdout.trim().split('\t')[0];
  assert.equal(remote, tip, `origin's ${LEGACY} is not the commit:\n${log}`);
}

test('a parked legacy worktree run resumes in its worktree, commits and pushes through the wrappers', async (t) => {
  const f = await legacyFixture(t, 'parked');
  if (f === null) return;
  const subject = 'test: commit from the parked legacy run';
  await f.stubCommitAndPush(subject);

  await f.tick();

  assertLegacyProfile(f, f.settingsArg(f.wt));
  assert.equal(f.settingsArg(f.wt), (await runBash(f.dir, ['-c', '. "$1"; hr_run_profile_file "$(hr_repo_slug "$2")" "$3"', '_', f.lib, f.dir, LEGACY], f.watcherEnv())).stdout.trim());
  await assertCommittedAndPushed(f, subject);
  assert.equal(f.record().status, 'completed', f.watcherLog());
  assert.equal(f.record().worktree, f.wt);
  assert.equal(f.record().copy_kind, undefined, 'the resume migrated the record');
  assert.deepEqual(f.notifications().map((n) => n.event), ['resumed', 'completed']);
});

test('a paused legacy worktree run resumes through the pause-resume path, commits and pushes', async (t) => {
  const f = await legacyFixture(t, 'paused');
  if (f === null) return;
  const resume = join(f.wt, STATE_DIR, 'RESUME');
  await writeFile(resume, '', 'utf8');
  const subject = 'test: commit from the paused legacy run';
  await f.stubCommitAndPush(subject);

  await f.tick();

  assertLegacyProfile(f, f.settingsArg(f.wt));
  assert.ok(!existsSync(resume), 'the RESUME trigger was not consumed');
  await assertCommittedAndPushed(f, subject);
  assert.equal(f.record().status, 'completed', f.watcherLog());
  assert.equal(f.record().copy_kind, undefined, 'the resume migrated the record');
  assert.deepEqual(
    f.notifications().map((n) => [n.event, n.detail]),
    [['resumed', 'after pause'], ['completed', '']],
  );
});

test('a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree', async (t) => {
  const f = await legacyFixture(t, 'parked');
  if (f === null) return;
  const clone = await f.derived(NEW);
  await f.stubCommitAndPush('test: commit from the legacy run beside a new one');
  await writeFile(join(f.dir, STATE_DIR, 'autonomous_inbox', `${NEW}_task_prompt.md`), 'do it\n', 'utf8');

  // This pass resumes one run (commit and push) and launches a second, so it takes the larger bound.
  await f.tick({}, { timeoutMs: scaleBound(180_000) });

  // New beside old, in one pass.
  assertLegacyProfile(f, f.settingsArg(f.wt));
  const runs = f.runs();
  assert.equal(runs[NEW]?.copy_kind, 'clone', f.watcherLog());
  assert.equal(runs[NEW].worktree, clone);
  assert.equal(runs[LEGACY].copy_kind, undefined, 'the legacy record was migrated');
  const newSettings = f.settingsArg(clone);
  assert.ok(newSettings, `the new run was never launched:\n${f.watcherLog()}`);
  assert.ok(newSettings.startsWith(`${f.watcherEnv().XDG_STATE_HOME}/`), `${newSettings} is outside XDG_STATE_HOME`);
  const newProfile = JSON.parse(readFileSync(newSettings, 'utf8'));
  assert.ok(
    newProfile.sandbox.filesystem.denyWrite.includes(`${f.wt}/.git`),
    `the clone run's profile does not protect the legacy worktree's pointer`,
  );
  assert.ok(existsSync(join(clone, '.git')), `the clone ${clone} was not created`);

  // The sweep: the legacy branch gone on origin, its record completed.
  await runGit(f.origin, ['branch', '--quiet', '-D', LEGACY]);
  const set = await runBash(f.dir, ['-c', '. "$1"; hr_registry_set "$2" "$3" status completed', '_', f.lib, join(f.dir, REGISTRY_PATH), LEGACY]);
  assert.equal(set.status, 0, output(set));
  const sweep = (args = []) => runBash(f.dir, [join(f.dir, INIT_SCRIPTS_DIR, 'cleanup-merged-worktrees.sh'), ...args], f.watcherEnv());
  const localHas = async (branch) =>
    (await runBash(f.dir, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0;
  const cloneTip = (await runGit(clone, ['rev-parse', 'HEAD'])).stdout.trim();

  const dry = await sweep(['--dry-run']);
  assert.equal(dry.status, 0, output(dry));
  assert.ok(
    dry.stdout.includes(`[dry-run] would delete branch '${LEGACY}' and remove worktree ${f.wt}`),
    `the preview did not name the legacy arm's removal:\n${output(dry)}`,
  );
  assert.ok(!dry.stdout.includes(NEW), `the preview named the new run:\n${output(dry)}`);
  assert.ok(existsSync(f.wt) && (await localHas(LEGACY)), 'the preview removed something');

  // The profile the watcher passed the legacy session, equated with `hr_run_profile_file` by the parked case.
  const legacySettings = f.settingsArg(f.wt);
  assert.ok(existsSync(legacySettings), `the legacy run's profile ${legacySettings} is missing before the sweep`);
  const real = await sweep();
  assert.equal(real.status, 0, output(real));
  assert.ok(real.stdout.includes(`removed worktree ${f.wt}`), output(real));
  assert.ok(real.stdout.includes(`removed run profile ${legacySettings} for '${LEGACY}'`), output(real));
  assert.ok(!existsSync(legacySettings), `the legacy run's profile survived:\n${output(real)}`);
  assert.ok(existsSync(newSettings), `the new run's profile was removed:\n${output(real)}`);
  assert.ok(!existsSync(f.wt), `the legacy worktree survived:\n${output(real)}`);
  assert.equal(await localHas(LEGACY), false, `${LEGACY} was not deleted:\n${output(real)}`);
  assert.ok(existsSync(join(clone, '.git')), `the clone was removed:\n${output(real)}`);
  assert.equal((await runGit(clone, ['rev-parse', 'HEAD'])).stdout.trim(), cloneTip);
  assert.equal(await localHas(NEW), true, `${NEW} was deleted:\n${output(real)}`);
});
