/**
 * The written `push-branch.sh`'s retry, against a fixture `init` adopted and a throwaway bare
 * origin whose `pre-receive` hook refuses on demand.
 *
 * **The rule these tests exist to enforce: a push the remote refused is attempted at most
 * `PUSH_ATTEMPTS` times in all, a `[rejected]` push is never retried, and every path exits 0.** A
 * lost race is `docs/github-run-control.md`'s "fails loudly, and is never fetched, rebased or
 * retried"; a server-side refusal is transient and gets its bounded retries.
 *
 * Every case passes `PUSH_RETRY_DELAY_SECS=0`, so a retry costs no wall-clock wait. The hook counts
 * its calls in a file beside the bare repository, which is how attempts are counted: a
 * `[rejected]` push is refused client-side and never reaches the hook, so that case counts
 * `[rejected]` lines in git's own output instead.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = join('scripts', 'push-branch.sh');
const BRANCH = 'feat_x';
const NO_DELAY = { PUSH_RETRY_DELAY_SECS: '0' };
const IDENTITY = ['-c', 'user.email=other@example.invalid', '-c', 'user.name=Other Clone'];

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
  const counter = `${origin}-calls`;
  const git = async (cwd, args) => (await runGit(cwd, args)).stdout.trim();
  return {
    dir,
    origin,
    push: (env = {}) => runBash(dir, [join(dir, SCRIPT), dir], { ...NO_DELAY, ...env }),
    /** Install a hook that refuses its first `refusals` calls and accepts every later one. */
    refuseFirst(refusals) {
      writeFileSync(
        join(origin, 'hooks', 'pre-receive'),
        `#!/bin/sh
echo call >> '${counter}'
n=$(wc -l < '${counter}')
[ "$n" -gt ${refusals} ] && exit 0
echo "fixture origin: refused call $n" >&2
exit 1
`,
        { mode: 0o755 },
      );
    },
    calls: () => (existsSync(counter) ? readFileSync(counter, 'utf8').split('\n').filter(Boolean).length : 0),
    head: () => git(dir, ['rev-parse', 'HEAD']),
    originTip: async () => (await runBash(origin, ['-c', `git rev-parse --verify --quiet refs/heads/${BRANCH}`])).stdout.trim(),
    git,
  };
}

const output = (result) => `${result.stdout}\n${result.stderr}`;
const count = (text, pattern) => text.split('\n').filter((line) => pattern.test(line)).length;

test('refused once, then accepted: exit 0, the push lands after exactly one retry', async (t) => {
  const f = await adoptedFixture(t);
  f.refuseFirst(1);

  const result = await f.push();
  assert.equal(result.status, 0, output(result));
  assert.equal(count(result.stdout, /retrying in 0s$/), 1, output(result));
  assert.match(result.stdout, /push-branch\.sh: pushed feat_x to origin/);
  assert.equal(f.calls(), 2);
  assert.equal(await f.originTip(), await f.head());
});

test('always refused: exit 0 after three attempts in all, origin unchanged', async (t) => {
  const f = await adoptedFixture(t);
  const before = await f.originTip();
  f.refuseFirst(99);

  const result = await f.push();
  assert.equal(result.status, 0, output(result));
  assert.equal(f.calls(), 3);
  assert.equal(count(result.stdout, /retrying in 0s$/), 2, output(result));
  assert.match(result.stdout, /push-branch\.sh: push failed for feat_x after 3 attempts \(see output above\)/);
  assert.equal(await f.originTip(), before);
});

test('the remote moved: exit 0, one attempt, never retried, origin keeps the other clone\'s commit', async (t) => {
  const f = await adoptedFixture(t);
  const first = await f.push();
  assert.equal(first.status, 0, output(first));
  assert.equal(await f.originTip(), await f.head(), output(first));

  const other = join(await realpath(await mkdtemp(join(tmpdir(), 'harness-other-clone-'))), 'clone');
  t.after(() => rm(join(other, '..'), { recursive: true, force: true }));
  await runGit(join(other, '..'), ['clone', '--quiet', '--branch', BRANCH, f.origin, other]);
  await runGit(other, [...IDENTITY, 'commit', '--quiet', '--allow-empty', '-m', 'other: moved the branch']);
  await runGit(other, ['push', '--quiet', 'origin', BRANCH]);
  const moved = await f.git(other, ['rev-parse', 'HEAD']);

  await runGit(f.dir, ['commit', '--quiet', '--allow-empty', '-m', 'fixture: mine']);
  const result = await f.push();
  assert.equal(result.status, 0, output(result));
  assert.equal(count(result.stderr, /^ ! \[rejected\]/), 1, output(result));
  assert.doesNotMatch(result.stdout, /retrying/);
  assert.match(
    result.stdout,
    /push-branch\.sh: push failed for feat_x: origin has commits this branch does not \(not retried\)/,
  );
  assert.equal(await f.originTip(), moved);
});

test('a PUSH_RETRY_DELAY_SECS that is not an integer falls back with one line and still pushes', async (t) => {
  const f = await adoptedFixture(t);

  const result = await f.push({ PUSH_RETRY_DELAY_SECS: 'x' });
  assert.equal(result.status, 0, output(result));
  assert.equal(count(result.stdout, /PUSH_RETRY_DELAY_SECS='x' is not a non-negative integer — using 5$/), 1, output(result));
  assert.match(result.stdout, /push-branch\.sh: pushed feat_x to origin/);
  assert.equal(await f.originTip(), await f.head());
});
