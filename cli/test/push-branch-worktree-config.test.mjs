/**
 * The shipped `push-branch.sh`'s per-working-copy configuration check and its hooks pin, driven as
 * the permission profile runs it: the MAIN checkout's copy, with a linked worktree as its argument.
 *
 * **The rule these tests exist to enforce: the main checkout's push wrapper pushes from a worktree
 * only when that worktree's `config.worktree` is absent, empty or holds just the `core.hooksPath`
 * `setup-worktree.sh` writes, and every push it makes runs the main repository's configured hooks
 * directory — accepted only when it is `<main>/<githooksDir>` or `<main>/.git/hooks` — never the
 * worktree's. Every refusal exits 0 and leaves origin unchanged.** Case (a)'s marker assertion is
 * the proof of the pin: a refusal case passing proves nothing about it.
 *
 * The fixture is built by hand rather than by `init`, so the hooks configuration under test is
 * exactly the one each case sets. Each `pre-push` hook writes a marker file named for its directory.
 */

import assert from 'node:assert/strict';
import { chmod, cp, mkdir, mkdtemp, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const TEMPLATE_SCRIPTS = join(PACKAGE_ROOT, 'templates', 'scripts');
const BRANCH = 'feat_w';
const MAIN_BRANCH = 'feat_main';
const CONFIG = {
  version: 1,
  defaultBranch: 'trunk',
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const REFUSED = /^push-branch\.sh: refusing to push: /m;
const PUSHED = /^push-branch\.sh: pushed feat_w to origin$/m;

const output = (result) => `${result.stdout}\n${result.stderr}`;

/**
 * A bare origin, a main checkout on `feat_main` carrying the wrapper, and a linked worktree on
 * `feat_w` with one commit origin has not seen, bootstrapped as `setup-worktree.sh` step 4 does.
 *
 * @param {import('node:test').TestContext} t
 * @param {'githooks' | '.husky' | null} mainHooksPath the main `.git/config`'s `core.hooksPath`;
 *   `null` leaves it unset and installs the marker hook under `.git/hooks` instead.
 */
async function worktreeFixture(t, mainHooksPath = 'githooks') {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'push-wt-config-')));
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
    const file = join(dir, 'pre-push');
    await writeFile(file, `#!/bin/sh\necho ${name} >> '${join(markers, name)}'\nexit 0\n`);
    await chmod(file, 0o755);
  };

  await runGit(main, ['init', '--quiet', '-b', MAIN_BRANCH]);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await hook(join(main, 'githooks'), 'main');
  await mkdir(join(main, 'scripts'));
  await cp(join(TEMPLATE_SCRIPTS, 'push-branch.sh'), join(main, 'scripts', 'push-branch.sh'));
  await cp(join(TEMPLATE_SCRIPTS, 'lib'), join(main, 'scripts', 'lib'), { recursive: true });
  await runGit(main, ['add', 'harness.config.json', 'githooks', 'scripts']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['remote', 'add', 'origin', origin]);

  if (mainHooksPath === '.husky') await hook(join(main, '.husky'), 'husky');
  if (mainHooksPath === null) await hook(join(main, '.git', 'hooks'), 'gitdefault');
  else await runGit(main, ['config', 'core.hooksPath', mainHooksPath]);

  await runGit(main, ['worktree', 'add', '--quiet', '-b', BRANCH, wt]);
  await runGit(wt, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(wt, ['config', '--worktree', 'core.hooksPath', join(wt, 'githooks')]);
  await hook(join(wt, 'githooks'), 'wt');
  await runGit(wt, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'fixture: work']);

  return {
    main,
    wt,
    configWorktree: join(main, '.git', 'worktrees', 'wt', 'config.worktree'),
    push: (target) =>
      runBash(root, [join(main, 'scripts', 'push-branch.sh'), target], { PUSH_RETRY_DELAY_SECS: '0' }),
    head: async (dir) => (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim(),
    originTip: async (branch) =>
      (await runBash(origin, ['-c', `git rev-parse --verify --quiet refs/heads/${branch}`])).stdout.trim(),
    markers: async () => (await readdir(markers)).sort(),
  };
}

/** A refusal: exit 0, the `refusing to push:` line, origin without the branch, no hook run. */
async function assertRefused(f, result) {
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, REFUSED, output(result));
  assert.doesNotMatch(result.stdout, PUSHED);
  assert.equal(await f.originTip(BRANCH), '');
  assert.deepEqual(await f.markers(), []);
}

test('(a) A clean worktree pushes, and only the main checkout’s pre-push runs', async (t) => {
  const f = await worktreeFixture(t);
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, PUSHED, output(result));
  assert.equal(await f.originTip(BRANCH), await f.head(f.wt));
  assert.deepEqual(await f.markers(), ['main']);
});

test('(b) A foreign key in config.worktree is refused by name, never by value', async (t) => {
  const f = await worktreeFixture(t);
  await runGit(f.wt, ['config', '--worktree', 'user.name', 'sandbox-written-value']);
  const result = await f.push(f.wt);
  await assertRefused(f, result);
  assert.match(result.stdout, /refusing to push: .*user\.name/);
  assert.doesNotMatch(output(result), /sandbox-written-value/);
});

test('(c) core.hooksPath at another value is refused', async (t) => {
  const f = await worktreeFixture(t);
  await runGit(f.wt, ['config', '--worktree', 'core.hooksPath', join(f.wt, 'elsewhere')]);
  await assertRefused(f, await f.push(f.wt));
});

test('(d) No config.worktree at all pushes', async (t) => {
  const f = await worktreeFixture(t);
  await rm(f.configWorktree);
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, PUSHED, output(result));
  assert.equal(await f.originTip(BRANCH), await f.head(f.wt));
  assert.deepEqual(await f.markers(), ['main']);
});

test('(e) The main checkout itself as the argument pushes', async (t) => {
  const f = await worktreeFixture(t);
  const result = await f.push(f.main);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^push-branch\.sh: pushed feat_main to origin$/m, output(result));
  assert.equal(await f.originTip(MAIN_BRANCH), await f.head(f.main));
  assert.deepEqual(await f.markers(), ['main']);
});

test('(f) A foreign core.hooksPath in the main .git/config is refused, naming the directory', async (t) => {
  const f = await worktreeFixture(t, '.husky');
  const result = await f.push(f.wt);
  await assertRefused(f, result);
  assert.ok(result.stdout.includes(join(f.main, '.husky')), output(result));
});

test('(g) core.hooksPath unset in the main .git/config pins <main>/.git/hooks', async (t) => {
  const f = await worktreeFixture(t, null);
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, PUSHED, output(result));
  assert.equal(await f.originTip(BRANCH), await f.head(f.wt));
  assert.deepEqual(await f.markers(), ['gitdefault']);
});
