/**
 * The shipped `push-branch.sh`'s per-working-copy configuration check and its hooks pin, driven as
 * the permission profile runs it: the MAIN checkout's copy, with a linked worktree as its argument.
 *
 * **The rule these tests exist to enforce: the main checkout's push wrapper pushes from a worktree
 * only when that worktree's `config.worktree` is absent, empty or holds just the `core.hooksPath`
 * `setup-worktree.sh` writes, and every push it makes runs the main repository's configured hooks
 * directory — accepted only when it is `<main>/<githooksDir>` or `<main>/.git/hooks` — never the
 * worktree's. Every refusal exits 0 and leaves origin unchanged.** Case (a)'s marker assertion is
 * the proof of the pin: a refusal case passing proves nothing about it. A worktree whose `HEAD` names
 * a branch starting with `-` is refused too, since `git push` would read that name as an option.
 * The protected set is the MAIN checkout's `harness.config.json`'s, never the worktree's own
 * committed copy, which the sandbox can rewrite; a main checkout whose configuration cannot be read
 * is a refusal. The fixture's marker `pre-push` hooks never refuse, so a protected branch that is
 * not pushed was refused by the wrapper, not by the hook.
 *
 * A branch cut from `origin/trunk`, as `create-worktree.sh` cuts every run's branch, starts out with
 * `branch.<branch>.merge` naming the base: its first push must set the upstream to its own ref, and
 * once its remote deletes it, it must stay deleted (cases (l) and (m)).
 *
 * The fixture is built by hand rather than by `init`, so the hooks configuration under test is
 * exactly the one each case sets. Each `pre-push` hook writes a marker file named for its directory.
 */

import assert from 'node:assert/strict';
import { access, chmod, cp, mkdir, mkdtemp, readdir, realpath, rm, writeFile } from 'node:fs/promises';
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
  protectedBranches: ['trunk', 'release/*'],
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
 * @param {{ fromOrigin?: boolean }} [options] `fromOrigin` cuts the worktree's branch from
 *   `origin/trunk`, exactly as `create-worktree.sh` does, so `branch.feat_w.merge` starts out as
 *   `refs/heads/trunk` rather than unset.
 */
async function worktreeFixture(t, mainHooksPath = 'githooks', { fromOrigin = false } = {}) {
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

  if (fromOrigin) {
    // create-worktree.sh: fetch origin <base>, then `worktree add -b <branch> <dir> origin/<base>`.
    await runGit(main, ['branch', 'trunk']);
    await runGit(main, ['push', '--quiet', '--no-verify', 'origin', 'trunk']);
    await runGit(main, ['fetch', '--quiet', 'origin', 'trunk']);
    await runGit(main, ['worktree', 'add', '--quiet', '-b', BRANCH, wt, 'origin/trunk']);
  } else {
    await runGit(main, ['worktree', 'add', '--quiet', '-b', BRANCH, wt]);
  }
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
    root,
    origin,
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

test('(h) A worktree HEAD naming a branch that starts with `-` is refused before any push', async (t) => {
  const f = await worktreeFixture(t);
  const ran = join(f.root, 'receive-pack-ran');
  const program = join(f.root, 'marker.sh');
  await writeFile(program, `#!/bin/sh\ntouch '${ran}'\nexit 1\n`);
  await chmod(program, 0o755);
  const originRefs = async () => (await runGit(f.origin, ['for-each-ref'])).stdout;
  const before = await originRefs();
  // Written with the file system, as a sandboxed command could: git refuses to create such a branch.
  await writeFile(
    join(f.main, '.git', 'worktrees', 'wt', 'HEAD'),
    `ref: refs/heads/--receive-pack=${program}\n`,
  );
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /refusing to push/, output(result));
  assert.doesNotMatch(result.stdout, /^push-branch\.sh: pushed /m);
  await assert.rejects(access(ran), output(result));
  assert.equal(await originRefs(), before);
  assert.deepEqual(await f.markers(), []);
});

test('(i) A worktree harness.config.json dropping a protected pattern does not unprotect the branch', async (t) => {
  const f = await worktreeFixture(t);
  await runGit(f.wt, ['checkout', '--quiet', '-b', 'release/x']);
  await writeFile(
    join(f.wt, 'harness.config.json'),
    `${JSON.stringify({ ...CONFIG, protectedBranches: [] })}\n`,
  );
  await runGit(f.wt, ['add', 'harness.config.json']);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: worktree drops release/*']);
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^push-branch\.sh: branch 'release\/x' is protected — refusing to push$/m, output(result));
  assert.equal(await f.originTip('release/x'), '');
  assert.deepEqual(await f.markers(), []);
});

test('(j) A main checkout whose harness.config.json cannot be read is refused, never answered from the worktree’s', async (t) => {
  const f = await worktreeFixture(t);
  // The worktree keeps its own valid committed copy; only the main checkout's file is broken.
  await writeFile(join(f.main, 'harness.config.json'), 'x');
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /refusing to push/, output(result));
  assert.doesNotMatch(result.stdout, PUSHED);
  assert.equal(await f.originTip(BRANCH), '');
  assert.deepEqual(await f.markers(), []);
});

test('(k) An unreadable worktree harness.config.json is never read: the main one decides, and the push lands', async (t) => {
  const f = await worktreeFixture(t);
  // No config.worktree key left, so the per-working-copy check never consults the worktree's copy:
  // only the protected-set decision could still read it.
  await runGit(f.wt, ['config', '--worktree', '--unset', 'core.hooksPath']);
  await writeFile(join(f.wt, 'harness.config.json'), 'x');
  await runGit(f.wt, ['add', 'harness.config.json']);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: worktree config unreadable']);
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, PUSHED, output(result));
  assert.equal(await f.originTip(BRANCH), await f.head(f.wt));
  assert.deepEqual(await f.markers(), ['main']);
});

/** `branch.<branch>.merge` as the main `.git/config` holds it, or '' when unset. */
const mergeOf = async (f, branch) =>
  (await runBash(f.main, ['-c', `git config --get branch.${branch}.merge || true`])).stdout.trim();

test('(l) A worktree cut from origin/trunk, as create-worktree.sh does, has its first push set the upstream to its own branch', async (t) => {
  const f = await worktreeFixture(t, 'githooks', { fromOrigin: true });
  assert.equal(await mergeOf(f, BRANCH), 'refs/heads/trunk', 'the fixture does not track the base the way create-worktree.sh leaves it');
  const trunkBefore = await f.originTip('trunk');
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, PUSHED, output(result));
  assert.doesNotMatch(result.stdout, /no longer has/);
  assert.equal(await f.originTip(BRANCH), await f.head(f.wt));
  assert.equal(await f.originTip('trunk'), trunkBefore);
  assert.equal(await mergeOf(f, BRANCH), `refs/heads/${BRANCH}`);
});

test('(m) A worktree cut from origin/trunk whose branch its remote deleted after the first push is not pushed back', async (t) => {
  const f = await worktreeFixture(t, 'githooks', { fromOrigin: true });
  const first = await f.push(f.wt);
  assert.equal(first.status, 0, output(first));
  assert.equal(await f.originTip(BRANCH), await f.head(f.wt), output(first));
  await runGit(f.origin, ['update-ref', '-d', `refs/heads/${BRANCH}`]);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'fixture: after the deletion']);
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(
    result.stdout,
    /^push-branch\.sh: origin no longer has feat_w, which this checkout tracks; not pushing it back/m,
    output(result),
  );
  assert.doesNotMatch(result.stdout, PUSHED);
  assert.equal(await f.originTip(BRANCH), '');
});
