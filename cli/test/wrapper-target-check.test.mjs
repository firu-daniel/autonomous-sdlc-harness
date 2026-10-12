/**
 * The shipped `push-branch.sh` and `refresh-branch.sh`'s target check, driven as the permission
 * profile runs them: the MAIN checkout's copies, with the target as their argument.
 *
 * **The rule these tests exist to enforce: the main checkout's two unsandboxed wrappers run git
 * only in the main checkout their own file sits in, or in a worktree that main repository lists —
 * its `.git` pointer leads into `<main>/.git/worktrees`, that record's `commondir` resolves to
 * `<main>/.git`, and its `gitdir` points back at the target. Anything else is refused before the
 * first git call, under each wrapper's own exit contract: `push-branch.sh` exits 0, and
 * `refresh-branch.sh` exits 1.** "Before the first git call" is proved by the scratch repository's
 * `core.sshCommand` marker: its origin push URL is an `ssh://` one, so any push git started there
 * would run that command, and a refusal case passing with no marker is that proof.
 *
 * The fixture is built by hand rather than by `init`, so the git records under test are exactly
 * the ones each case rewrites.
 */

import assert from 'node:assert/strict';
import { chmod, cp, mkdir, mkdtemp, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const TEMPLATE_SCRIPTS = join(PACKAGE_ROOT, 'templates', 'scripts');
const CONFIG = {
  version: 1,
  defaultBranch: 'trunk',
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const PUSH_REFUSED = /^push-branch\.sh: refusing to push: /m;
const REFRESH_REFUSED = /^refresh-branch\.sh: refusing to refresh: /m;

const output = (result) => `${result.stdout}\n${result.stderr}`;

/**
 * A bare origin; a main checkout on `feat_main` carrying `harness.config.json`, `githooks/` and the
 * two wrappers with their `lib/`; a linked worktree `wt` on `feat_w`, bootstrapped as
 * `setup-worktree.sh` step 4 does, with one commit origin has not seen; and a scratch clone of the
 * same origin on `feat_s`, behind origin's `trunk`, whose `core.sshCommand` writes a marker.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'wrapper-target-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  const wt = join(root, 'wt');
  const scratch = join(root, 'scratch');
  const markers = join(root, 'markers');
  await mkdir(origin);
  await mkdir(main);
  await mkdir(markers);
  await runGit(origin, ['init', '--bare', '--quiet']);

  const identity = async (dir) => {
    await runGit(dir, ['config', 'user.email', 'fixture@example.invalid']);
    await runGit(dir, ['config', 'user.name', 'Harness Fixture']);
  };

  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  await identity(main);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await mkdir(join(main, 'githooks'));
  await writeFile(join(main, 'githooks', 'README'), 'hooks\n');
  await mkdir(join(main, 'scripts'));
  for (const name of ['push-branch.sh', 'refresh-branch.sh']) {
    await cp(join(TEMPLATE_SCRIPTS, name), join(main, 'scripts', name));
  }
  await cp(join(TEMPLATE_SCRIPTS, 'lib'), join(main, 'scripts', 'lib'), { recursive: true });
  await runGit(main, ['add', 'harness.config.json', 'githooks', 'scripts']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['config', 'core.hooksPath', 'githooks']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', 'origin', 'trunk']);

  await runGit(root, ['clone', '--quiet', '-b', 'trunk', origin, scratch]);
  await identity(scratch);
  await runGit(scratch, ['checkout', '--quiet', '-b', 'feat_s']);
  const ssh = join(root, 'ssh-marker.sh');
  await writeFile(ssh, `#!/bin/sh\n: > '${join(markers, 'ssh')}'\nexit 1\n`);
  await chmod(ssh, 0o755);
  await runGit(scratch, ['config', 'core.sshCommand', ssh]);
  await runGit(scratch, ['config', 'remote.origin.pushurl', 'ssh://harness.invalid/origin.git']);

  // Origin's trunk moves on, so a refresh of the scratch clone would have a merge to make.
  await writeFile(join(main, 'base.txt'), 'base\n');
  await runGit(main, ['add', 'base.txt']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: base']);
  await runGit(main, ['push', '--quiet', 'origin', 'trunk']);
  await runGit(main, ['checkout', '--quiet', '-b', 'feat_main']);

  await runGit(main, ['worktree', 'add', '--quiet', '-b', 'feat_w', wt]);
  await runGit(wt, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(wt, ['config', '--worktree', 'core.hooksPath', join(wt, 'githooks')]);
  await runGit(wt, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'fixture: work']);

  const script = (name) => join(main, 'scripts', name);
  return {
    main,
    wt,
    scratch,
    record: join(main, '.git', 'worktrees', 'wt'),
    push: (target) => runBash(root, [script('push-branch.sh'), target], { PUSH_RETRY_DELAY_SECS: '0' }),
    refresh: (target) => runBash(root, [script('refresh-branch.sh'), target]),
    head: async (dir) => (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim(),
    originRefs: async () => (await runGit(origin, ['for-each-ref'])).stdout,
    originTip: async (branch) =>
      (await runBash(origin, ['-c', `git rev-parse --verify --quiet refs/heads/${branch}`])).stdout.trim(),
    markers: async () => (await readdir(markers)).sort(),
  };
}

/** A push refusal: exit 0, the `refusing to push:` line, origin's refs unchanged, no marker. */
async function assertPushRefused(f, target) {
  const before = await f.originRefs();
  const result = await f.push(target);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, PUSH_REFUSED, output(result));
  assert.equal(await f.originRefs(), before);
  assert.deepEqual(await f.markers(), []);
  return result;
}

test('(a) A scratch repository as push-branch.sh’s target is refused before git runs', async (t) => {
  const f = await fixture(t);
  const result = await assertPushRefused(f, f.scratch);
  assert.match(result.stdout, /is neither the main checkout .* nor a worktree it lists/);
});

test('(b) A scratch repository as refresh-branch.sh’s <repo-dir> is refused with exit 1', async (t) => {
  const f = await fixture(t);
  const before = await f.head(f.scratch);
  const result = await f.refresh(f.scratch);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, REFRESH_REFUSED, output(result));
  assert.equal(await f.head(f.scratch), before);
  assert.deepEqual(await f.markers(), []);
});

test('(c) A worktree whose .git pointer was rewritten to the scratch repository is refused', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.wt, '.git'), `gitdir: ${join(f.scratch, '.git')}\n`);
  const result = await assertPushRefused(f, f.wt);
  assert.match(result.stdout, /does not point into /);
});

test('(d) A worktree whose record’s commondir was rewritten to the scratch repository is refused', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.record, 'commondir'), `${join(f.scratch, '.git')}\n`);
  const result = await assertPushRefused(f, f.wt);
  assert.match(result.stdout, /commondir does not resolve to /);
});

test('(e) The clean worktree pushes, and origin’s branch equals its HEAD', async (t) => {
  const f = await fixture(t);
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^push-branch\.sh: pushed feat_w to origin$/m, output(result));
  assert.equal(await f.originTip('feat_w'), await f.head(f.wt));
});

test('(f) The main checkout as the target proceeds in both wrappers', async (t) => {
  const f = await fixture(t);
  const pushed = await f.push(f.main);
  assert.equal(pushed.status, 0, output(pushed));
  assert.match(pushed.stdout, /^push-branch\.sh: pushed feat_main to origin$/m, output(pushed));
  assert.equal(await f.originTip('feat_main'), await f.head(f.main));
  const refreshed = await f.refresh(f.main);
  assert.equal(refreshed.status, 3, output(refreshed));
  assert.doesNotMatch(refreshed.stderr, REFRESH_REFUSED);
});

test('(g) A worktree whose record’s gitdir no longer points back at it is refused', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.record, 'gitdir'), `${join(f.scratch, '.git')}\n`);
  const result = await assertPushRefused(f, f.wt);
  assert.match(result.stdout, /gitdir does not point back at /);
});
