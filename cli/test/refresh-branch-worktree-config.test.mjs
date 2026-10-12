/**
 * The shipped `refresh-branch.sh`'s checkout argument, its per-working-copy configuration check and
 * its hooks pin, driven as the permission profile runs it: the MAIN checkout's copy, with a linked
 * worktree as its argument.
 *
 * **The rule these tests exist to enforce: the main checkout's refresh wrapper, aimed at a worktree,
 * merges the base into that worktree and never into the main checkout; it does so only when the
 * worktree's `config.worktree` is absent, empty or holds just the `core.hooksPath`
 * `setup-worktree.sh` writes, refusing otherwise with exit 1 and the worktree untouched; and every
 * merge it makes runs the main repository's configured hooks directory, never the worktree's.**
 * Case (a)'s marker assertion is the proof of the pin: a refusal case passing proves nothing about it.
 *
 * The fixture is built by hand rather than by `init`, so the hooks configuration under test is
 * exactly the one each case sets. Each `post-merge` hook writes a marker file named for its
 * directory. The hooks directories are left untracked so the worktree's own hook leaves its tree
 * clean, which the wrapper requires before it merges.
 */

import assert from 'node:assert/strict';
import { chmod, cp, mkdir, mkdtemp, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const TEMPLATE_SCRIPTS = join(PACKAGE_ROOT, 'templates', 'scripts');
const BASE = 'trunk';
const BRANCH = 'feat_w';
const CONFIG = {
  version: 1,
  defaultBranch: BASE,
  protectedBranches: [BASE],
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const REFUSED = /^refresh-branch\.sh: refusing to refresh: /m;
const MERGED = /^refresh-branch\.sh: merged \S+ into feat_w$/m;

const output = (result) => `${result.stdout}\n${result.stderr}`;

/**
 * A bare origin; a main checkout on `trunk` carrying the scripts, `core.hooksPath=githooks` and a
 * published seed; a linked worktree on `feat_w` with one commit of its own, bootstrapped as
 * `setup-worktree.sh` step 4 does; then `trunk` moved on by one commit and published, so `feat_w`
 * is behind it.
 *
 * @param {import('node:test').TestContext} t
 */
async function worktreeFixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'refresh-wt-config-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  const wt = join(root, 'wt');
  const markers = join(root, 'markers');
  await mkdir(origin);
  await mkdir(main);
  await mkdir(markers);
  await runGit(origin, ['init', '--bare', '--quiet']);

  const hook = async (dir, name) => {
    await mkdir(dir, { recursive: true });
    const file = join(dir, 'post-merge');
    await writeFile(file, `#!/bin/sh\necho ${name} >> '${join(markers, name)}'\nexit 0\n`);
    await chmod(file, 0o755);
  };

  await runGit(main, ['init', '--quiet', '-b', BASE]);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await writeFile(join(main, 'f.txt'), 'a\n');
  await mkdir(join(main, 'scripts'));
  await cp(join(TEMPLATE_SCRIPTS, 'refresh-branch.sh'), join(main, 'scripts', 'refresh-branch.sh'));
  await cp(join(TEMPLATE_SCRIPTS, 'lib'), join(main, 'scripts', 'lib'), { recursive: true });
  await runGit(main, ['add', 'harness.config.json', 'f.txt', 'scripts']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', '-u', 'origin', BASE]);
  await hook(join(main, 'githooks'), 'main');
  await runGit(main, ['config', 'core.hooksPath', 'githooks']);

  await runGit(main, ['worktree', 'add', '--quiet', '-b', BRANCH, wt]);
  await runGit(wt, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(wt, ['config', '--worktree', 'core.hooksPath', join(wt, 'githooks')]);
  await hook(join(wt, 'githooks'), 'wt');
  await writeFile(join(wt, 'w.txt'), 'work\n');
  await runGit(wt, ['add', 'w.txt']);
  await runGit(wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: work']);

  await writeFile(join(main, 'f.txt'), 'a\nb\n');
  await runGit(main, ['commit', '--quiet', '--no-verify', '-am', 'fixture: base']);
  await runGit(main, ['push', '--quiet', '--no-verify', 'origin', BASE]);

  const head = async (dir) => (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim();
  return {
    main,
    wt,
    head,
    baseSha: await head(main),
    refresh: (script, args) => runBash(root, [script, ...args]),
    mainScript: join(main, 'scripts', 'refresh-branch.sh'),
    wtScript: join(wt, 'scripts', 'refresh-branch.sh'),
    branchOf: async (dir) => (await runGit(dir, ['symbolic-ref', '--short', 'HEAD'])).stdout.trim(),
    contains: async (dir, sha) => (await runGit(dir, ['log', '--format=%H'])).stdout.split('\n').includes(sha),
    markers: async () => (await readdir(markers)).sort(),
  };
}

test('(a) The main checkout’s copy refreshes the named worktree, and only the main post-merge runs', async (t) => {
  const f = await worktreeFixture(t);
  const mainHead = await f.head(f.main);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, MERGED, output(result));
  assert.ok(await f.contains(f.wt, f.baseSha), output(result));
  assert.equal(await f.head(f.main), mainHead);
  assert.equal(await f.branchOf(f.main), BASE);
  assert.deepEqual(await f.markers(), ['main']);
});

test('(b) A foreign key in config.worktree is refused with exit 1, by name, never by value', async (t) => {
  const f = await worktreeFixture(t);
  await runGit(f.wt, ['config', '--worktree', 'user.name', 'sandbox-written-value']);
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, REFUSED, output(result));
  assert.match(result.stderr, /refusing to refresh: .*user\.name/);
  assert.doesNotMatch(output(result), /sandbox-written-value/);
  assert.equal(await f.head(f.wt), wtHead);
  assert.deepEqual(await f.markers(), []);
});

test('(c) --local with a checkout argument merges the local base and never fetches', async (t) => {
  const f = await worktreeFixture(t);
  await runGit(f.main, ['remote', 'set-url', 'origin', join(f.main, 'no-such-origin.git')]);
  await writeFile(join(f.main, 'f.txt'), 'a\nb\nc\n');
  await runGit(f.main, ['commit', '--quiet', '--no-verify', '-am', 'fixture: unpushed base']);
  const localBase = await f.head(f.main);
  const result = await f.refresh(f.mainScript, ['--local', f.wt]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, MERGED, output(result));
  assert.doesNotMatch(output(result), /no-such-origin|fatal:/);
  assert.ok(await f.contains(f.wt, localBase), output(result));
});

test('(d) The worktree’s own copy with no argument still refreshes the worktree', async (t) => {
  const f = await worktreeFixture(t);
  const mainHead = await f.head(f.main);
  const result = await f.refresh(f.wtScript, []);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, MERGED, output(result));
  assert.ok(await f.contains(f.wt, f.baseSha), output(result));
  assert.equal(await f.head(f.main), mainHead);
  assert.deepEqual(await f.markers(), ['main']);
});

test('(e) A second checkout argument is a usage error', async (t) => {
  const f = await worktreeFixture(t);
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt, f.main]);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /usage: refresh-branch\.sh \[--local\] \[<repo-dir>\]/, output(result));
  assert.equal(await f.head(f.wt), wtHead);
});
