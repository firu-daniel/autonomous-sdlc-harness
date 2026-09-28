/**
 * **The rule this suite enforces: a copied fixture is indistinguishable, to git, from a freshly
 * seeded one.** `createFixture` copies a per-process template rather than seeding each repository
 * (`helpers/fixture.mjs`, choice 5), so every git query a test could make of the seeded state is
 * asked of one copy and of one repository {@link seedRepository} seeded in place, and the answers
 * compared.
 *
 * **Object ids are never compared across the two repositories.** The seed commit carries the
 * wall-clock second it was made, and the template and the fresh repository are seeded at different
 * moments, so such a comparison fails whenever the two straddle a second boundary. What the id must
 * satisfy is asserted within each repository instead: the local remote-tracking ref and the
 * origin's branch name the same commit, whose tree is the empty tree and whose subject is the seed's.
 */

import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createFixture, runGit, seedRepository } from './helpers/fixture.mjs';

/** A git query's trimmed stdout. */
async function ask(dir, args) {
  return (await runGit(dir, args)).stdout.trim();
}

/** A repository seeded in place, torn down in-process when the test ends. */
async function freshlySeeded(t, remote) {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'harness-fixture-fresh-')));
  t.after(async () => {
    await rm(dir, { recursive: true, force: true });
    await rm(`${dir}-origin.git`, { recursive: true, force: true });
  });
  await seedRepository(dir, { remote });
  return dir;
}

/** A fixture from `createFixture`, torn down when the test ends. */
async function copied(t, remote) {
  const fixture = await createFixture({ remote });
  t.after(fixture.cleanup);
  return fixture.dir;
}

/** The answers that must match between a copy and a fresh seed, with no object id among them. */
async function answers(dir) {
  return {
    head: await ask(dir, ['symbolic-ref', 'HEAD']),
    email: await ask(dir, ['config', '--get', 'user.email']),
    name: await ask(dir, ['config', '--get', 'user.name']),
    refs: await ask(dir, ['for-each-ref', '--format=%(refname)']),
    remotes: await ask(dir, ['remote']),
  };
}

/** Assert the seed's invariants that involve an object id, within one repository. */
async function assertSeededOrigin(dir) {
  const branch = await ask(dir, ['symbolic-ref', '--short', 'HEAD']);
  const origin = `${dir}-origin.git`;
  assert.equal(await ask(dir, ['remote', 'get-url', 'origin']), origin, `${dir} points at its own sibling origin`);

  const local = await ask(dir, ['rev-parse', `refs/remotes/origin/${branch}`]);
  const remoteHead = await ask(origin, ['rev-parse', `refs/heads/${branch}`]);
  assert.equal(local, remoteHead, 'the remote-tracking ref and the origin branch name one commit');

  const emptyTree = await ask(dir, ['hash-object', '-t', 'tree', '/dev/null']);
  assert.equal(await ask(dir, ['rev-parse', `${local}^{tree}`]), emptyTree);
  assert.equal(await ask(dir, ['log', '-1', '--format=%s', local]), 'origin seed');
}

/** `ls-remote origin`'s ref names, without their ids. */
async function remoteRefNames(dir) {
  return (await ask(dir, ['ls-remote', 'origin']))
    .split('\n')
    .map((line) => line.split('\t')[1])
    .sort();
}

for (const remote of [true, false]) {
  test(`a copied fixture answers git as a freshly seeded one does (remote: ${remote})`, async (t) => {
    const copy = await copied(t, remote);
    const fresh = await freshlySeeded(t, remote);

    assert.deepEqual(await answers(copy), await answers(fresh));
    for (const dir of [copy, fresh]) {
      await assert.rejects(runGit(dir, ['rev-parse', '--verify', '--quiet', 'HEAD']), 'HEAD is unborn');
    }

    if (remote) {
      await assertSeededOrigin(copy);
      await assertSeededOrigin(fresh);
      assert.deepEqual(await remoteRefNames(copy), await remoteRefNames(fresh));
    } else {
      assert.equal(await ask(copy, ['remote']), '');
    }
  });
}

test('two copied fixtures never share an origin', async (t) => {
  const first = await copied(t, true);
  const second = await copied(t, true);

  const firstOrigin = await ask(first, ['remote', 'get-url', 'origin']);
  const secondOrigin = await ask(second, ['remote', 'get-url', 'origin']);
  assert.notEqual(firstOrigin, secondOrigin);
  assert.equal(firstOrigin, `${first}-origin.git`);
  assert.equal(secondOrigin, `${second}-origin.git`);
});
