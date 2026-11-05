/**
 * The GitHub job's checkout replayed on a fixture: `actions/checkout`'s two commands, then the
 * shipped `setup-worktree.sh`, then the main checkout's `commit-on-branch.sh` and `push-branch.sh`.
 *
 * **The rule these tests exist to enforce: after `actions/checkout`'s two commands and the shipped
 * `setup-worktree.sh`, both main-checkout wrappers accept the target; the bootstrap removes only the
 * three sparse keys at `false`, and every other shape is still refused.** The two commands are
 * `git sparse-checkout disable` and `git config --local --unset-all extensions.worktreeConfig`;
 * together they leave `core.sparseCheckout`, `core.sparseCheckoutCone` and `index.sparse`, each
 * `false`, in a `config.worktree` the extension no longer reads, until `setup-worktree.sh` turns it
 * back on. Case (b) is the reproduction and passes with or without the drop; case (c) plants the
 * keys by hand, so it does not depend on what the host's git writes.
 *
 * No clone case: the clone arm writes no `config.worktree` (`setup-worktree.sh` →
 * `hooks_config_write`), and the wrappers skip `hr_worktree_config_check_var` for a clone.
 *
 * Run red once against the fixture's copy of `setup-worktree.sh`, never the tracked template, with
 * its `drop_inert_sparse "$f"` call removed: (a), (c), (e) and both (d) cases fail; (b) passes.
 *
 * The fixture is built by hand rather than by `init`, as `push-branch-worktree-config.test.mjs`
 * builds its own, so the configuration under test is exactly the one each case sets.
 */

import assert from 'node:assert/strict';
import { chmod, cp, mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const TEMPLATE_SCRIPTS = join(PACKAGE_ROOT, 'templates', 'scripts');
const SCRIPTS = ['setup-worktree.sh', 'commit-on-branch.sh', 'push-branch.sh'];
const MAIN_BRANCH = 'feat_main';
const WT_BRANCH = 'feat_w';
const CONFIG = {
  version: 1,
  defaultBranch: 'trunk',
  protectedBranches: ['trunk'],
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const SPARSE_KEYS = ['core.sparseCheckout', 'core.sparseCheckoutCone', 'index.sparse'];
const SPARSE_LISTED = 'core.sparsecheckout=false\ncore.sparsecheckoutcone=false\nindex.sparse=false';
const SPARSE_NAMED = 'core.sparsecheckout, core.sparsecheckoutcone, index.sparse';
const REMOVED = /^setup-worktree\.sh: removed core\.sparseCheckout, core\.sparseCheckoutCone, index\.sparse \(each false\) from /m;
const REFUSED = /^push-branch\.sh: refusing to push: /m;

const output = (result) => `${result.stdout}\n${result.stderr}`;

/**
 * A bare origin and a main checkout on `feat_main` carrying `harness.config.json`, a passing
 * `githooks/pre-push` and the three scripts under test, with one seed commit origin has not seen.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'setup-wt-sparse-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  await mkdir(origin);
  await mkdir(main);
  await runGit(origin, ['init', '--bare', '--quiet']);

  await runGit(main, ['init', '--quiet', '-b', MAIN_BRANCH]);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await mkdir(join(main, 'githooks'));
  await writeFile(join(main, 'githooks', 'pre-push'), '#!/bin/sh\nexit 0\n');
  await chmod(join(main, 'githooks', 'pre-push'), 0o755);
  await mkdir(join(main, 'scripts'));
  for (const name of SCRIPTS) await cp(join(TEMPLATE_SCRIPTS, name), join(main, 'scripts', name));
  await cp(join(TEMPLATE_SCRIPTS, 'lib'), join(main, 'scripts', 'lib'), { recursive: true });
  await runGit(main, ['add', 'harness.config.json', 'githooks', 'scripts']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['remote', 'add', 'origin', origin]);

  const script = (name) => join(main, 'scripts', name);
  return {
    root,
    main,
    origin,
    configWorktree: join(main, '.git', 'config.worktree'),
    checkoutCommands: async () => {
      await runGit(main, ['sparse-checkout', 'disable']);
      await runGit(main, ['config', '--local', '--unset-all', 'extensions.worktreeConfig']);
    },
    plant: async (file, key, value) => runGit('/', ['config', '--file', file, key, value]),
    list: async (file) => (await runGit('/', ['config', '--file', file, '--list'])).stdout.trim(),
    setup: (...args) => runBash(root, [script('setup-worktree.sh'), ...args]),
    commit: (repo, file, subject) =>
      runBash(root, [script('commit-on-branch.sh'), '--repo', repo, file, '--', subject]),
    push: (target) => runBash(root, [script('push-branch.sh'), target], { PUSH_RETRY_DELAY_SECS: '0' }),
    tip: async (dir) => (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim(),
    originTip: async (branch) =>
      (await runBash(origin, ['-c', `git rev-parse --verify --quiet refs/heads/${branch}`])).stdout.trim(),
  };
}

/** `setup-worktree.sh` with no argument: exit 0, the `removed` line, only `core.hooksPath` left. */
async function assertBootstrapped(f) {
  const result = await f.setup();
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, REMOVED, output(result));
  assert.equal(await f.list(f.configWorktree), `core.hookspath=${join(f.main, 'githooks')}`);
}

/** Both wrappers accept the main checkout: a one-file commit lands, and the branch reaches origin. */
async function assertAccepted(f) {
  const before = await f.tip(f.main);
  await writeFile(join(f.main, 'sparse.txt'), 'replayed\n');
  const committed = await f.commit(f.main, 'sparse.txt', 'feat: Sparse replay');
  assert.equal(committed.status, 0, output(committed));
  const after = await f.tip(f.main);
  assert.notEqual(after, before, output(committed));
  assert.equal((await runGit(f.main, ['rev-parse', `${after}^`])).stdout.trim(), before);
  const changed = await runGit(f.main, ['diff-tree', '--no-commit-id', '--name-only', '-r', after]);
  assert.equal(changed.stdout.trim(), 'sparse.txt');

  const pushed = await f.push(f.main);
  assert.equal(pushed.status, 0, output(pushed));
  assert.match(pushed.stdout, new RegExp(`^push-branch\\.sh: pushed ${MAIN_BRANCH} to origin$`, 'm'), output(pushed));
  assert.doesNotMatch(pushed.stdout, REFUSED);
  assert.equal(await f.originTip(MAIN_BRANCH), after);
}

/** `push-branch.sh` on the main checkout refuses, naming `names`, and origin gains nothing. */
async function assertPushRefused(f, names) {
  const result = await f.push(f.main);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, REFUSED, output(result));
  assert.ok(result.stdout.includes(names), output(result));
  assert.equal(await f.originTip(MAIN_BRANCH), '');
  return result;
}

test('(a) The measured checkout sequence, then setup-worktree.sh: both wrappers accept the main checkout', async (t) => {
  const f = await fixture(t);
  await f.checkoutCommands();
  const version = (await runGit('/', ['--version'])).stdout.trim();
  assert.equal(await f.list(f.configWorktree), SPARSE_LISTED, `the checkout's two commands under ${version}`);
  await assertBootstrapped(f);
  await assertAccepted(f);
});

test('(b) Without the drop, the keys the checkout leaves are refused by both wrappers', async (t) => {
  const f = await fixture(t);
  await f.checkoutCommands();
  await runGit(f.main, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(f.main, ['config', '--worktree', 'core.hooksPath', join(f.main, 'githooks')]);
  const before = await f.tip(f.main);
  await writeFile(join(f.main, 'sparse.txt'), 'replayed\n');
  const committed = await f.commit(f.main, 'sparse.txt', 'feat: Sparse replay');
  assert.notEqual(committed.status, 0, output(committed));
  assert.ok(committed.stderr.includes(SPARSE_NAMED), output(committed));
  assert.equal(await f.tip(f.main), before);
  await assertPushRefused(f, SPARSE_NAMED);
});

test('(c) The three keys planted at false by hand are dropped too: the drop is not version-bound', async (t) => {
  const f = await fixture(t);
  for (const key of SPARSE_KEYS) await f.plant(f.configWorktree, key, 'false');
  await assertBootstrapped(f);
  await assertAccepted(f);
});

test('(d) core.sparseCheckout at true survives the bootstrap and is still refused', async (t) => {
  const f = await fixture(t);
  await f.checkoutCommands();
  await f.plant(f.configWorktree, 'core.sparseCheckout', 'true');
  const result = await f.setup();
  assert.equal(result.status, 0, output(result));
  assert.equal(
    await f.list(f.configWorktree),
    `core.sparsecheckout=true\ncore.hookspath=${join(f.main, 'githooks')}`,
    output(result),
  );
  const refused = await assertPushRefused(f, 'core.sparsecheckout');
  assert.doesNotMatch(refused.stdout, /core\.sparsecheckoutcone|index\.sparse/);
});

test('(d) A foreign key beside the three survives the bootstrap and is refused by name, never by value', async (t) => {
  const f = await fixture(t);
  await f.checkoutCommands();
  await f.plant(f.configWorktree, 'user.name', 'sandbox-written-value');
  const result = await f.setup();
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, REMOVED, output(result));
  assert.equal(
    await f.list(f.configWorktree),
    `user.name=sandbox-written-value\ncore.hookspath=${join(f.main, 'githooks')}`,
  );
  const refused = await assertPushRefused(f, 'user.name');
  assert.doesNotMatch(output(refused), /sandbox-written-value/);
});

test('(e) A linked worktree through --target: both files cleaned, and both wrappers accept', async (t) => {
  const f = await fixture(t);
  for (const key of SPARSE_KEYS) await f.plant(f.configWorktree, key, 'false');
  const wt = join(f.root, 'wt');
  await runGit(f.main, ['worktree', 'add', '--quiet', '-b', WT_BRANCH, wt]);

  const result = await f.setup('--target', wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, REMOVED, output(result));
  assert.equal(await f.list(f.configWorktree), '');
  assert.equal(
    await f.list(join(f.main, '.git', 'worktrees', 'wt', 'config.worktree')),
    `core.hookspath=${join(wt, 'githooks')}`,
  );

  const pushed = await f.push(wt);
  assert.equal(pushed.status, 0, output(pushed));
  assert.match(pushed.stdout, new RegExp(`^push-branch\\.sh: pushed ${WT_BRANCH} to origin$`, 'm'), output(pushed));
  assert.equal(await f.originTip(WT_BRANCH), await f.tip(wt));

  const before = await f.tip(f.main);
  await writeFile(join(f.main, 'sparse.txt'), 'replayed\n');
  const committed = await f.commit(f.main, 'sparse.txt', 'feat: Sparse replay');
  assert.equal(committed.status, 0, output(committed));
  const after = (await runGit(f.main, ['rev-parse', `refs/heads/${MAIN_BRANCH}`])).stdout.trim();
  assert.equal((await runGit(f.main, ['rev-parse', `${after}^`])).stdout.trim(), before);
});
