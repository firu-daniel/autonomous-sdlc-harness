/**
 * The fixture's host isolation, proven on the two refusals only Linux enforces natively.
 *
 * **The rule this test exists to enforce: a fixture subprocess is refused, on every host, what a
 * Linux host refuses.** git never guesses a commit identity (`helpers/fixture.mjs`, choice 3), so a
 * repository that commits carries its own — the fixture's origin included — and no single argument
 * or environment string over `MAX_ARG_STRLEN` is spawned (choice 7). Without either, a case passes
 * on macOS and fails on Linux for a reason no assertion names.
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { MAX_ARG_STRING_BYTES, createFixture, runBash, runGit } from './helpers/fixture.mjs';

/** A scratch directory under `os.tmpdir()`, removed in process when the test ends. */
async function scratchDir(t) {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'harness-fixture-isolation-')));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('the origin has its own identity', async (t) => {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  const origin = (await runGit(fixture.dir, ['remote', 'get-url', 'origin'])).stdout.trim();

  const tree = (await runGit(origin, ['hash-object', '-w', '-t', 'tree', '/dev/null'])).stdout.trim();
  const commit = (await runGit(origin, ['commit-tree', tree, '-m', 'identity probe'])).stdout.trim();
  const body = (await runGit(origin, ['cat-file', 'commit', commit])).stdout;

  assert.match(body, /^author Harness Fixture <fixture@example\.invalid> /m);
});

test('git never guesses an identity', async (t) => {
  const repo = await scratchDir(t);
  await runGit(repo, ['init', '--quiet']);

  const result = await runBash(repo, [
    '-c',
    'unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL EMAIL; ' +
      'tree=$(git hash-object -w -t tree /dev/null) && git commit-tree "$tree" -m probe',
  ]);

  assert.notEqual(result.status, 0, `commit-tree succeeded: ${result.stdout}`);
  assert.match(result.stderr, /auto-detection is disabled/);
});

test('the single-string bound', async (t) => {
  const dir = await scratchDir(t);
  const marker = join(dir, 'spawned');
  const script = 'printf spawned > "$0"';

  await t.test('an argument one byte under the bound is spawned', async () => {
    const result = await runBash(dir, ['-c', script, marker, 'x'.repeat(MAX_ARG_STRING_BYTES - 1)]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(marker), 'the command did not run');
    await rm(marker);
  });

  await t.test('an argument at the bound rejects, and nothing is spawned', async () => {
    const args = ['-c', script, marker, 'x'.repeat(MAX_ARG_STRING_BYTES)];
    const expected = new RegExp(
      `argument 3 is ${MAX_ARG_STRING_BYTES} bytes .*over the ${MAX_ARG_STRING_BYTES}-byte bound .*MAX_ARG_STRLEN.*macOS does not`,
    );
    await assert.rejects(runBash(dir, args), expected);
    await assert.rejects(runBash(dir, args, {}, { timeoutMs: 60_000 }), expected);
    assert.equal(existsSync(marker), false, 'a refused call spawned its command');
  });

  await t.test('an environment override at the bound rejects naming it, and nothing is spawned', async () => {
    const value = 'x'.repeat(MAX_ARG_STRING_BYTES - 'NAME='.length);
    const expected = new RegExp(`environment variable NAME is ${MAX_ARG_STRING_BYTES} bytes .*MAX_ARG_STRLEN`);
    await assert.rejects(runBash(dir, ['-c', script, marker], { NAME: value }), expected);
    await assert.rejects(runBash(dir, ['-c', script, marker], { NAME: value }, { timeoutMs: 60_000 }), expected);
    assert.equal(existsSync(marker), false, 'a refused call spawned its command');
  });
});
