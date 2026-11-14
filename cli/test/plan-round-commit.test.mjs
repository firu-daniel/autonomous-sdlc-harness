/**
 * The planning path sets the two autonomous plan forks hand the shipped `commit-on-branch.sh` at a
 * round's end and on a planning pause, driven against a fixture `init` has wired.
 *
 * **The rule this suite enforces: a task-plan or fix-plan round commit, and its `partial` pause
 * commit, stage exactly the files under that fork's planning path set — tracked edits and new
 * untracked drafts alike — and nothing else, and a repeated identical call exits 3 with `HEAD`
 * unchanged.** A path in the set with nothing on disk is the wrapper's skip-with-warning, not a
 * refusal. `TASK_PLAN_PATHS` and `FIX_PLAN_PATHS` are the literals each fork's fenced command
 * must list, in this order.
 *
 * Deliberately not covered: whether the orchestrator calls the wrapper at all, and when. The pause
 * rule — including refusing a pause commit while a tracked file outside the set is dirty — is the
 * caller's to apply; this suite only proves such a file never enters the commit. Driving that
 * decision needs a live orchestrator session, which no test in this package starts.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, runBash, runCli, runGit } from './helpers/fixture.mjs';

const BRANCH = 'feat_x';

/** The task-plan fork's path set, in order. */
const TASK_PLAN_PATHS = (s, b) => [
  `${s}/story_plans/${b}_story_plan.md`,
  `${s}/task_plans/${b}/`,
  `${s}/task_plan_reviews/${b}/`,
  `${s}/business_parity_reviews/${b}/`,
  `${s}/architecture_reviews/${b}/`,
  `${s}/plan_revisions/${b}/`,
];

/** The fix-plan fork's path set for user-review round `n` with suffix `suffix`, in order. */
const FIX_PLAN_PATHS = (s, b, n, suffix) => [
  `${s}/user_reviews/${b}_fix_plan${suffix}.md`,
  `${s}/user_reviews/${b}_fix_plan${suffix}/`,
  `${s}/business_parity_user_review_reviews/${b}/user_review_${n}/`,
  `${s}/architecture_user_review_reviews/${b}/user_review_${n}/`,
  `${s}/plan_revisions/${b}/`,
];

const write = async (dir, rel, text) => {
  await mkdir(dirname(join(dir, rel)), { recursive: true });
  await writeFile(join(dir, rel), text, 'utf8');
};

const git = async (dir, ...args) => (await runGit(dir, args)).stdout;
const lines = (text) => text.split('\n').filter((l) => l !== '').sort();
const headFiles = async (dir) => lines(await git(dir, 'show', '--name-only', '--format=', 'HEAD'));

/**
 * A fixture `init` wired, on `feat_x`, whose seed commit holds `seed` (relative path → content)
 * beside `README.md`.
 *
 * @param {import('node:test').TestContext} t
 * @param {(s: string) => Record<string, string>} seed
 */
async function fixture(t, seed) {
  const { dir, cleanup } = await createFixture({ files: { 'README.md': '# fixture project\n' } });
  t.after(cleanup);
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  const stateDir = JSON.parse(readFileSync(join(dir, 'devscene.config.json'), 'utf8')).stateDir.replace(/\/+$/, '');
  await runGit(dir, ['checkout', '--quiet', '-b', BRANCH]);
  const files = seed(stateDir);
  for (const [rel, text] of Object.entries(files)) await write(dir, rel, text);
  await runGit(dir, ['add', '--', ...Object.keys(files)]);
  await runGit(dir, ['commit', '--quiet', '-m', 'fixture: seed plan']);
  assert.equal(await git(dir, 'status', '--porcelain'), '', 'the seed left the tree dirty');
  return {
    dir,
    stateDir,
    commit: (paths, subject) =>
      runBash(dir, [`${INIT_SCRIPTS_DIR}/commit-on-branch.sh`, '--repo', dir, ...paths, '--', subject]),
    head: async () => (await git(dir, 'rev-parse', 'HEAD')).trim(),
  };
}

/** The unrelated tracked edit is still in the working tree, and nothing is left staged. */
async function assertReadmeLeftAlone(dir) {
  assert.deepEqual(lines(await git(dir, 'diff', '--name-only')), ['README.md']);
  assert.equal(await git(dir, 'diff', '--cached', '--name-only'), '');
}

/** Exits 0, and an identical second call exits 3 with `HEAD` unchanged. */
async function assertLandsOnce(f, paths, subject) {
  const landed = await f.commit(paths, subject);
  assert.equal(landed.status, 0, `${landed.stdout}\n${landed.stderr}`);
  assert.equal((await git(f.dir, 'log', '-1', '--format=%s')).trim(), subject);
  const head = await f.head();
  const again = await f.commit(paths, subject);
  assert.equal(again.status, 3, `${again.stdout}\n${again.stderr}`);
  assert.equal(await f.head(), head);
  return landed;
}

const taskSeed = (s) => ({
  [`${s}/story_plans/${BRANCH}_story_plan.md`]: '# Story\n',
  [`${s}/task_plans/${BRANCH}/task_1_plan.md`]: '### Task 1\n',
});

test('(a) the task-plan round commit stages exactly the planning files, and repeats as a no-op', async (t) => {
  const f = await fixture(t, taskSeed);
  const s = f.stateDir;
  await write(f.dir, `${s}/story_plans/${BRANCH}_story_plan.md`, '# Story\n\nrevised\n');
  await write(f.dir, `${s}/task_plans/${BRANCH}/task_2_plan.md`, '### Task 2\n');
  await write(f.dir, `${s}/task_plan_reviews/${BRANCH}/review_0.md`, 'FAIL\n');
  await write(f.dir, `${s}/architecture_reviews/${BRANCH}/review_0.md`, 'PASS\n');
  await write(f.dir, `${s}/plan_revisions/${BRANCH}/task_plan_revision_1.md`, 'revision 1\n');
  await write(f.dir, 'README.md', '# fixture project\n\nunrelated\n');

  const paths = TASK_PLAN_PATHS(s, BRANCH);
  const landed = await assertLandsOnce(f, paths, `chore: Plan round 0 for ${BRANCH}`);
  // The parity folder is in the set with nothing on disk: skipped with a warning, not refused.
  assert.match(landed.stderr, new RegExp(`path '${s}/business_parity_reviews/${BRANCH}/' does not exist`));

  assert.deepEqual(await headFiles(f.dir), [
    `${s}/architecture_reviews/${BRANCH}/review_0.md`,
    `${s}/plan_revisions/${BRANCH}/task_plan_revision_1.md`,
    `${s}/story_plans/${BRANCH}_story_plan.md`,
    `${s}/task_plan_reviews/${BRANCH}/review_0.md`,
    `${s}/task_plans/${BRANCH}/task_2_plan.md`,
  ]);
  await assertReadmeLeftAlone(f.dir);
});

test('(b) a pause commit before the first reviewer, then one between two reviewers, each takes only what changed', async (t) => {
  const f = await fixture(t, taskSeed);
  const s = f.stateDir;
  const paths = TASK_PLAN_PATHS(s, BRANCH);
  await write(f.dir, `${s}/task_plan_reviews/${BRANCH}/review_0.md`, 'FAIL\n');
  await assertLandsOnce(f, paths, `chore: Plan round 0 for ${BRANCH}`);
  await write(f.dir, 'README.md', '# fixture project\n\nunrelated\n');

  // The writer returned, no reviewer has run: only the plan files and the revision note changed.
  await write(f.dir, `${s}/task_plans/${BRANCH}/task_1_plan.md`, '### Task 1\n\nrevised\n');
  await write(f.dir, `${s}/task_plans/${BRANCH}/task_2_plan.md`, '### Task 2\n');
  await write(f.dir, `${s}/plan_revisions/${BRANCH}/task_plan_revision_1.md`, 'revision 1\n');
  await assertLandsOnce(f, paths, `chore: Plan round 1 partial for ${BRANCH}`);
  assert.deepEqual(await headFiles(f.dir), [
    `${s}/plan_revisions/${BRANCH}/task_plan_revision_1.md`,
    `${s}/task_plans/${BRANCH}/task_1_plan.md`,
    `${s}/task_plans/${BRANCH}/task_2_plan.md`,
  ]);
  await assertReadmeLeftAlone(f.dir);

  // One reviewer has written its round file since the last commit; the next has not run.
  await write(f.dir, `${s}/architecture_reviews/${BRANCH}/review_1.md`, 'PASS\n');
  await assertLandsOnce(f, paths, `chore: Plan round 1 partial for ${BRANCH}`);
  assert.deepEqual(await headFiles(f.dir), [`${s}/architecture_reviews/${BRANCH}/review_1.md`]);
  await assertReadmeLeftAlone(f.dir);
});

test('(c) the fix-plan round commit for user review 2 stages exactly its files, never round 1\'s', async (t) => {
  const roundOne = (s) => `${s}/user_reviews/${BRANCH}_fix_plan.md`;
  const f = await fixture(t, (s) => ({ [roundOne(s)]: '# Fix plan 1\n' }));
  const s = f.stateDir;
  await write(f.dir, `${s}/user_reviews/${BRANCH}_fix_plan_2.md`, '# Fix plan 2\n');
  await write(f.dir, `${s}/user_reviews/${BRANCH}_fix_plan_2/fix_1.md`, '### Fix 1\n');
  await write(f.dir, `${s}/business_parity_user_review_reviews/${BRANCH}/user_review_2/review_0.md`, 'PASS\n');
  await write(f.dir, `${s}/architecture_user_review_reviews/${BRANCH}/user_review_2/review_0.md`, 'FAIL\n');
  await write(f.dir, `${s}/plan_revisions/${BRANCH}/fix_plan_2_revision_1.md`, 'revision 1\n');
  await write(f.dir, 'README.md', '# fixture project\n\nunrelated\n');

  await assertLandsOnce(f, FIX_PLAN_PATHS(s, BRANCH, 2, '_2'), `chore: Fix plan 2 round 0 for ${BRANCH}`);
  assert.deepEqual(await headFiles(f.dir), [
    `${s}/architecture_user_review_reviews/${BRANCH}/user_review_2/review_0.md`,
    `${s}/business_parity_user_review_reviews/${BRANCH}/user_review_2/review_0.md`,
    `${s}/plan_revisions/${BRANCH}/fix_plan_2_revision_1.md`,
    `${s}/user_reviews/${BRANCH}_fix_plan_2.md`,
    `${s}/user_reviews/${BRANCH}_fix_plan_2/fix_1.md`,
  ]);
  assert.equal(readFileSync(join(f.dir, roundOne(s)), 'utf8'), '# Fix plan 1\n');
  await assertReadmeLeftAlone(f.dir);
});
