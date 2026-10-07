/**
 * The written `push-branch.sh`'s deleted-upstream skip, against a fixture `init` adopted and its
 * throwaway bare origin.
 *
 * **The rule these tests exist to enforce: a branch this checkout tracks is not pushed when its
 * remote no longer lists it, every path exits 0, and a branch that tracks nothing is pushed as
 * before.** Gate 12 round 9, finding 1: a run stopped by its branch's deletion had the branch
 * re-created by the job's `always()` push step.
 */

import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = join('scripts', 'push-branch.sh');
const BRANCH = 'feat_x';
const NO_DELAY = { PUSH_RETRY_DELAY_SECS: '0' };
const SKIPPED = /push-branch\.sh: origin no longer has feat_x, which this checkout tracks; not pushing it back \(a branch deleted on its remote stays deleted\)\. To publish it again on purpose: git push --set-upstream origin feat_x$/m;
const ASKED = /ls-remote/;

/** An adopted fixture on `feat_x`, with one commit `origin` has not seen. */
async function adoptedFixture(t) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
      'README.md': '# fixture project\n',
    },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  await runGit(dir, ['checkout', '--quiet', '-b', BRANCH]);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--allow-empty', '-m', 'fixture: work on feat_x']);

  const origin = `${dir}-origin.git`;
  return {
    dir,
    origin,
    push: () => runBash(dir, [join(dir, SCRIPT), dir], NO_DELAY),
    commit: (message) => runGit(dir, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', message]),
    head: async () => (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim(),
    originTip: async () =>
      (await runBash(origin, ['-c', `git rev-parse --verify --quiet refs/heads/${BRANCH}`])).stdout.trim(),
  };
}

const output = (result) => `${result.stdout}\n${result.stderr}`;

/** Push once so the branch has an upstream, and prove it landed. */
async function pushedOnce(f) {
  const first = await f.push();
  assert.equal(first.status, 0, output(first));
  assert.equal(await f.originTip(), await f.head(), output(first));
}

test('Deleted on origin, tracking ref still present: exit 0, the skip line, origin keeps no feat_x', async (t) => {
  const f = await adoptedFixture(t);
  await pushedOnce(f);
  await runGit(f.origin, ['update-ref', '-d', `refs/heads/${BRANCH}`]);
  await f.commit('fixture: after the deletion');

  const result = await f.push();
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, SKIPPED);
  assert.doesNotMatch(result.stdout, /pushed feat_x to origin/);
  assert.equal(await f.originTip(), '');
});

test('Deleted on origin, tracking ref pruned: the config test alone triggers the skip', async (t) => {
  const f = await adoptedFixture(t);
  await pushedOnce(f);
  const gone = await runGit(f.dir, ['push', '--quiet', '--no-verify', 'origin', '--delete', BRANCH]);
  assert.equal(gone.status, 0, gone.stderr);
  const tracking = await runBash(f.dir, ['-c', `git rev-parse --verify --quiet refs/remotes/origin/${BRANCH}`]);
  assert.notEqual(tracking.status, 0, 'the tracking ref survived the delete');
  assert.equal((await runGit(f.dir, ['config', '--get', `branch.${BRANCH}.merge`])).stdout.trim(), `refs/heads/${BRANCH}`);
  await f.commit('fixture: after the deletion');

  const result = await f.push();
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, SKIPPED);
  assert.equal(await f.originTip(), '');
});

test('Still on origin: a tracked branch its remote still has moves to HEAD', async (t) => {
  const f = await adoptedFixture(t);
  await pushedOnce(f);
  await f.commit('fixture: more work');

  const result = await f.push();
  assert.equal(result.status, 0, output(result));
  assert.doesNotMatch(result.stdout, SKIPPED);
  assert.doesNotMatch(result.stdout, ASKED);
  assert.match(result.stdout, /push-branch\.sh: pushed feat_x to origin/);
  assert.equal(await f.originTip(), await f.head());
});

test('Never pushed: a branch tracking nothing is pushed with --set-upstream and asks no remote', async (t) => {
  const f = await adoptedFixture(t);

  const result = await f.push();
  assert.equal(result.status, 0, output(result));
  assert.doesNotMatch(result.stdout, ASKED);
  assert.doesNotMatch(result.stdout, SKIPPED);
  assert.match(result.stdout, /push-branch\.sh: pushed feat_x to origin/);
  assert.equal(await f.originTip(), await f.head());
  assert.equal((await runGit(f.dir, ['config', '--get', `branch.${BRANCH}.merge`])).stdout.trim(), `refs/heads/${BRANCH}`);
});

test('Remote cannot answer: the could-not-ask line, then the existing failure line, and exit 0', async (t) => {
  const f = await adoptedFixture(t);
  await pushedOnce(f);
  await runGit(f.dir, ['remote', 'set-url', 'origin', `${f.dir}-no-such-origin.git`]);
  await f.commit('fixture: more work');

  const result = await f.push();
  assert.equal(result.status, 0, output(result));
  const lines = result.stdout.split('\n');
  const asked = lines.findIndex((line) =>
    /^push-branch\.sh: could not ask origin whether it still has feat_x \(ls-remote exited \d+\); pushing as before$/.test(line));
  const failed = lines.findIndex((line) => /^push-branch\.sh: push failed for feat_x after 3 attempts/.test(line));
  assert.ok(asked >= 0, output(result));
  assert.ok(failed > asked, output(result));
  assert.doesNotMatch(result.stdout, SKIPPED);
});
