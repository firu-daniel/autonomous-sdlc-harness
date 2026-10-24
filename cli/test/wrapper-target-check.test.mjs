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
 * **The main checkout is placed from each wrapper's own location and is never redirected by a
 * `<main>/.git/commondir`**, which a sandboxed command can create: a main checkout whose `.git`
 * holds one is refused under the same exit contracts, so a repository that file names is never
 * taken for the main checkout, and its configuration and hooks never run.
 *
 * **After its checks, neither wrapper lets git re-read the target's records.** A race cannot be
 * staged reliably, so cases (i)–(k) stage its outcome deterministically instead: a `git` shim
 * first on `PATH` rewrites the records at the wrapper's first git call that is not one of its
 * checks' own `git -C / config --file` reads — after every check has read them, before any git
 * call that could honour them. `push-branch.sh` then pushes the real branch to the real origin
 * with no payload run, the worktree's `.git` pointer, its record's `commondir` and its
 * `config.worktree` all rewritten; `refresh-branch.sh` merges the real base into the real branch
 * with the `.git` pointer (j) or the `commondir` (k) rewritten, runs no `core.fsmonitor` planted in
 * `config.worktree` on the merge path (k2) or the conflict path (k3), and moves only
 * `refs/heads/<branch>` when the record's `HEAD` is flipped to another branch (k4) — every refresh
 * call runs against `<main>/.git` with only the worktree's index and files borrowed.
 *
 * **A remote whose URL the main `.git/config` does not name is refused** by both wrappers, so a
 * legacy `.git/remotes/origin` a sandboxed command planted never names the repository they push to
 * or fetch from (cases (l) and (m)). **The refresh's clean-tree test never runs git inside a nested
 * repository at a gitlink** (case (n)): without `--ignore-submodules` git would, under that
 * repository's own sandbox-writable configuration. **Neither wrapper recurses into a submodule
 * under a `submodule.recurse` in the main configuration** (cases (o) and (o2)): the refresh's
 * `read-tree` would check one out, and the push would push one, under its
 * `<main>/.git/modules/<name>/config`, which the permission profile does not protect.
 *
 * **The refresh moves the branch before the working tree, so a moved branch is caught before
 * anything is written** (case (p)), a working tree that refuses after the branch moved puts the
 * branch back (case (p2)), and exit 5 is the one state where that put-back fails too (case (p3)) —
 * each staged by the same `git` shim at the call that opens the window.
 *
 * The fixture is built by hand rather than by `init`, so the git records under test are exactly
 * the ones each case rewrites.
 */

import assert from 'node:assert/strict';
import { chmod, cp, mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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

test('(h) A commondir planted in the main .git cannot make another repository the main checkout', async (t) => {
  const f = await fixture(t);
  const root = dirname(f.main);
  const markers = join(root, 'markers');
  // A repository a sandboxed command could build: a valid configuration, a branch origin has not
  // seen and is behind origin's trunk, and hooks and an SSH command that each leave a marker.
  const fake = join(root, 'fake');
  await runGit(root, ['clone', '--quiet', '-b', 'trunk', join(root, 'origin.git'), fake]);
  await runGit(fake, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(fake, ['config', 'user.name', 'Harness Fixture']);
  await runGit(fake, ['reset', '--quiet', '--hard', 'HEAD~1']);
  await runGit(fake, ['checkout', '--quiet', '-b', 'feat_fake']);
  await writeFile(join(fake, 'harness.config.json'), `${JSON.stringify({ ...CONFIG, githooksDir: '.git/hooks' })}\n`);
  await runGit(fake, ['add', 'harness.config.json']);
  await runGit(fake, ['commit', '--quiet', '-m', 'fixture: fake']);
  for (const name of ['pre-push', 'post-merge']) {
    const hook = join(fake, '.git', 'hooks', name);
    await writeFile(hook, `#!/bin/sh\n: > '${join(markers, name)}'\nexit 0\n`);
    await chmod(hook, 0o755);
  }
  const ssh = join(root, 'fake-ssh.sh');
  await writeFile(ssh, `#!/bin/sh\n: > '${join(markers, 'fake-ssh')}'\nexit 1\n`);
  await chmod(ssh, 0o755);
  await runGit(fake, ['config', 'core.sshCommand', ssh]);
  // An ssh:// push URL, so a push git started from this repository would run that command.
  await runGit(fake, ['config', 'remote.origin.pushurl', 'ssh://harness.invalid/origin.git']);
  const fakeHead = await f.head(fake);

  // Written with the file system, as a sandboxed command could: `.git/` is writable but for
  // `hooks/` and `config`.
  await writeFile(join(f.main, '.git', 'commondir'), `${join(fake, '.git')}\n`);

  const pushed = await assertPushRefused(f, fake);
  assert.match(pushed.stdout, /refusing to push: cannot place this script in a main checkout/, output(pushed));
  assert.equal(await f.originTip('feat_fake'), '');

  const refreshed = await f.refresh(fake);
  assert.equal(refreshed.status, 1, output(refreshed));
  assert.match(refreshed.stderr, /refusing to refresh: cannot place this script in a main checkout/, output(refreshed));
  assert.equal(await f.head(fake), fakeHead);
  assert.deepEqual(await f.markers(), []);
});

/**
 * A repository a sandboxed command could build to receive the redirected records: its
 * configuration runs a marker from `core.fsmonitor` (any index refresh) and `core.sshCommand`, its
 * hooks directory holds marker `pre-push` and `post-merge` hooks, and its `origin` is a bare
 * repository whose `pre-receive` leaves a marker — so whichever of them a git call honoured, a
 * marker says so. Its `HEAD` is on `feat_evil`.
 */
async function evilRepository(f) {
  const root = dirname(f.main);
  const markers = join(root, 'markers');
  const marker = async (name) => {
    const file = join(root, `evil-${name}.sh`);
    await writeFile(file, `#!/bin/sh\n: > '${join(markers, `evil-${name}`)}'\nexit 1\n`);
    await chmod(file, 0o755);
    return file;
  };
  const evilOrigin = join(root, 'evil-origin.git');
  await mkdir(evilOrigin);
  await runGit(evilOrigin, ['init', '--bare', '--quiet']);
  const receive = join(evilOrigin, 'hooks', 'pre-receive');
  await writeFile(receive, `#!/bin/sh\n: > '${join(markers, 'evil-pre-receive')}'\nexit 0\n`);
  await chmod(receive, 0o755);

  const evil = join(root, 'evil');
  await mkdir(evil);
  await runGit(evil, ['init', '--quiet', '-b', 'feat_evil']);
  await runGit(evil, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(evil, ['config', 'user.name', 'Harness Fixture']);
  await runGit(evil, ['commit', '--quiet', '--allow-empty', '-m', 'fixture: evil']);
  await runGit(evil, ['remote', 'add', 'origin', evilOrigin]);
  await runGit(evil, ['config', 'core.fsmonitor', await marker('fsmonitor')]);
  await runGit(evil, ['config', 'core.sshCommand', await marker('ssh')]);
  const hooks = join(root, 'evil-hooks');
  await mkdir(hooks);
  for (const name of ['pre-push', 'post-merge']) await cp(await marker(name), join(hooks, name));
  await runGit(evil, ['config', 'core.hooksPath', hooks]);
  return { evil, evilOrigin, receivepack: await marker('receive-pack') };
}

/**
 * Put a `git` shim first on `PATH` that runs `flip` — a list of `[file, contents]` writes — once,
 * at the first git call that is not a `git -C / config --file` read, then hands every call to the
 * real git. Returns the environment that installs it. `trigger`, a shell `case` pattern matched
 * against the call's arguments, moves the flip to the first call it matches instead: `*" diff "*`
 * is the refresh's clean-tree test, the first call after the branch is read.
 */
async function racingGit(f, flip, trigger) {
  const root = dirname(f.main);
  const realGit = (await runBash(root, ['-c', 'command -v git'])).stdout.trim();
  const bin = join(root, 'shim-bin');
  await mkdir(bin);
  const flipScript = join(root, 'flip.sh');
  const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
  await writeFile(
    flipScript,
    flip.map(([file, contents]) => `printf '%s' ${quote(contents)} > ${quote(file)}\n`).join(''),
  );
  const done = join(root, 'flip-done');
  await writeFile(
    join(bin, 'git'),
    trigger === undefined
      ? `#!/bin/sh\nif [ ! -e '${done}' ] && [ "$1 $2" != "-C /" ]; then : > '${done}'; /bin/sh '${flipScript}'; fi\nexec '${realGit}' "$@"\n`
      : `#!/bin/sh\nif [ ! -e '${done}' ]; then case " $* " in ${trigger}) : > '${done}'; /bin/sh '${flipScript}' ;; esac; fi\nexec '${realGit}' "$@"\n`,
  );
  await chmod(join(bin, 'git'), 0o755);
  return { PATH: `${bin}:${process.env.PATH}`, flipped: async () => (await readdir(root)).includes('flip-done') };
}

test('(i) push-branch.sh: records rewritten after its checks are never read, and the real branch is pushed', async (t) => {
  const f = await fixture(t);
  const { evil, receivepack } = await evilRepository(f);
  const race = await racingGit(f, [
    [join(f.wt, '.git'), `gitdir: ${join(evil, '.git')}\n`],
    [join(f.record, 'commondir'), `${join(evil, '.git')}\n`],
    [join(f.record, 'config.worktree'), `[remote "origin"]\n\treceivepack = ${receivepack}\n[core]\n\tfsmonitor = ${receivepack}\n`],
  ]);
  const wtHead = await f.head(f.wt);
  const result = await runBash(dirname(f.main), [join(f.main, 'scripts', 'push-branch.sh'), f.wt], {
    PUSH_RETRY_DELAY_SECS: '0',
    PATH: race.PATH,
  });
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^push-branch\.sh: pushed feat_w to origin$/m, output(result));
  assert.equal(await f.originTip('feat_w'), wtHead);
  assert.deepEqual(await f.markers(), []);
});

test('(j) refresh-branch.sh: a .git pointer rewritten after its checks is never read, and the real base is merged', async (t) => {
  const f = await fixture(t);
  // Behind origin's trunk on its own branch, so there is a merge to make.
  await runGit(f.wt, ['reset', '--quiet', '--hard', 'origin/trunk~1']);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'fixture: behind']);
  const base = (await runGit(f.main, ['rev-parse', 'refs/remotes/origin/trunk'])).stdout.trim();
  const { evil } = await evilRepository(f);
  const race = await racingGit(f, [[join(f.wt, '.git'), `gitdir: ${join(evil, '.git')}\n`]]);
  const result = await runBash(dirname(f.main), [join(f.main, 'scripts', 'refresh-branch.sh'), f.wt], {
    PATH: race.PATH,
  });
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^refresh-branch\.sh: merged origin\/trunk into feat_w$/m, output(result));
  const merged = await runBash(f.main, ['-c', `git merge-base --is-ancestor ${base} refs/heads/feat_w`]);
  assert.equal(merged.status, 0, `feat_w does not contain origin/trunk\n${output(result)}`);
  assert.deepEqual(await f.markers(), []);
});

test('(k) refresh-branch.sh: a commondir rewritten after its checks never brings in another configuration', async (t) => {
  const f = await fixture(t);
  await runGit(f.wt, ['reset', '--quiet', '--hard', 'origin/trunk~1']);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'fixture: behind']);
  const { evil } = await evilRepository(f);
  const race = await racingGit(f, [[join(f.record, 'commondir'), `${join(evil, '.git')}\n`]]);
  const result = await runBash(dirname(f.main), [join(f.main, 'scripts', 'refresh-branch.sh'), f.wt], {
    PATH: race.PATH,
  });
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  // Every refresh call runs against <main>/.git, so the record's commondir is never followed: the
  // real base is merged into the real branch, and nothing from the other repository ran.
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^refresh-branch\.sh: merged origin\/trunk into feat_w$/m, output(result));
  const merged = await runBash(f.main, ['-c', 'git merge-base --is-ancestor refs/remotes/origin/trunk refs/heads/feat_w']);
  assert.equal(merged.status, 0, `feat_w does not contain origin/trunk\n${output(result)}`);
  assert.deepEqual(await f.markers(), [], output(result));
});

/** A program that leaves the marker `fsmonitor` and fails, for a planted `core.fsmonitor`. */
async function fsmonitorMarker(f) {
  const root = dirname(f.main);
  const file = join(root, 'fsmonitor-marker.sh');
  await writeFile(file, `#!/bin/sh\n: > '${join(root, 'markers', 'fsmonitor')}'\nexit 1\n`);
  await chmod(file, 0o755);
  return file;
}

/** The worktree behind origin's trunk on a commit of its own, so the refresh builds a merge commit. */
async function behind(f) {
  await runGit(f.wt, ['reset', '--quiet', '--hard', 'origin/trunk~1']);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'fixture: behind']);
}

test('(k2) refresh-branch.sh: a core.fsmonitor written to config.worktree after its checks never runs, and the base is merged', async (t) => {
  const f = await fixture(t);
  await behind(f);
  const monitor = await fsmonitorMarker(f);
  const race = await racingGit(
    f,
    [[join(f.record, 'config.worktree'), `[core]\n\thooksPath = ${join(f.wt, 'githooks')}\n\tfsmonitor = ${monitor}\n`]],
    '*" diff "*',
  );
  const result = await runBash(dirname(f.main), [join(f.main, 'scripts', 'refresh-branch.sh'), f.wt], {
    PATH: race.PATH,
  });
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^refresh-branch\.sh: merged origin\/trunk into feat_w$/m, output(result));
  assert.deepEqual(await f.markers(), [], output(result));
});

test('(k3) refresh-branch.sh: a core.fsmonitor in config.worktree never runs on the conflict path either', async (t) => {
  const f = await fixture(t);
  await runGit(f.wt, ['reset', '--quiet', '--hard', 'origin/trunk~1']);
  // origin's trunk adds base.txt; adding it here too, differently, is an add/add conflict.
  await writeFile(join(f.wt, 'base.txt'), 'not the base\n');
  await runGit(f.wt, ['add', 'base.txt']);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: conflicting base.txt']);
  const wtHead = await f.head(f.wt);
  const monitor = await fsmonitorMarker(f);
  const race = await racingGit(
    f,
    [[join(f.record, 'config.worktree'), `[core]\n\thooksPath = ${join(f.wt, 'githooks')}\n\tfsmonitor = ${monitor}\n`]],
    '*" diff "*',
  );
  const result = await runBash(dirname(f.main), [join(f.main, 'scripts', 'refresh-branch.sh'), f.wt], {
    PATH: race.PATH,
  });
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 4, output(result));
  assert.equal((await runGit(f.main, ['rev-parse', 'refs/heads/feat_w'])).stdout.trim(), wtHead);
  assert.deepEqual(await f.markers(), [], output(result));
});

test('(k4) refresh-branch.sh: a worktree HEAD flipped to another branch after the read moves only refs/heads/<branch>', async (t) => {
  const f = await fixture(t);
  await behind(f);
  const refs = async () =>
    (await runGit(f.main, ['for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads/trunk', 'refs/heads/feat_main']))
      .stdout;
  const before = await refs();
  const race = await racingGit(f, [[join(f.record, 'HEAD'), 'ref: refs/heads/feat_main\n']], '*" diff "*');
  const result = await runBash(dirname(f.main), [join(f.main, 'scripts', 'refresh-branch.sh'), f.wt], {
    PATH: race.PATH,
  });
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^refresh-branch\.sh: merged origin\/trunk into feat_w$/m, output(result));
  assert.equal(await refs(), before);
  const merged = await runBash(f.main, ['-c', 'git merge-base --is-ancestor refs/remotes/origin/trunk refs/heads/feat_w']);
  assert.equal(merged.status, 0, `feat_w does not contain origin/trunk\n${output(result)}`);
  assert.deepEqual(await f.markers(), [], output(result));
});

/** Unset the main checkout's `remote.origin.url` and plant a legacy `.git/remotes/origin` naming `url`. */
async function legacyRemote(f, url) {
  await runGit(f.main, ['config', '--unset', 'remote.origin.url']);
  await mkdir(join(f.main, '.git', 'remotes'));
  await writeFile(
    join(f.main, '.git', 'remotes', 'origin'),
    `URL: ${url}\nPush: refs/heads/*:refs/heads/*\nPull: refs/heads/*:refs/remotes/origin/*\n`,
  );
}

test('(l) push-branch.sh refuses a remote the main .git/config names no URL for, and never reaches the planted one', async (t) => {
  const f = await fixture(t);
  const { evilOrigin } = await evilRepository(f);
  await legacyRemote(f, evilOrigin);
  const result = await assertPushRefused(f, f.wt);
  assert.match(result.stdout, /names no URL for remote 'origin'/, output(result));
  assert.equal((await runGit(evilOrigin, ['for-each-ref'])).stdout, '');
});

test('(m) refresh-branch.sh refuses a fetch from a remote the main .git/config names no URL for', async (t) => {
  const f = await fixture(t);
  await runGit(f.wt, ['reset', '--quiet', '--hard', 'origin/trunk']);
  // A planted origin one commit ahead of the real one's trunk: a fetch from it would bring that
  // commit in, and the merge would land it.
  const { evilOrigin } = await evilRepository(f);
  await runGit(f.main, ['push', '--quiet', '--no-verify', evilOrigin, 'refs/remotes/origin/trunk:refs/heads/trunk']);
  const clone = join(dirname(f.main), 'evil-clone');
  await runGit(dirname(f.main), ['clone', '--quiet', '-b', 'trunk', evilOrigin, clone]);
  await runGit(clone, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(clone, ['config', 'user.name', 'Harness Fixture']);
  await runGit(clone, ['commit', '--quiet', '--allow-empty', '-m', 'fixture: planted']);
  await runGit(clone, ['push', '--quiet', '--no-verify', 'origin', 'trunk']);
  await legacyRemote(f, evilOrigin);
  const tracking = (await runGit(f.main, ['rev-parse', 'refs/remotes/origin/trunk'])).stdout;
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.wt);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /refusing to refresh: .*names no URL for remote 'origin'/, output(result));
  assert.equal((await runGit(f.main, ['rev-parse', 'refs/remotes/origin/trunk'])).stdout, tracking);
  assert.equal(await f.head(f.wt), wtHead);
});

test('(n) refresh-branch.sh never runs git inside a nested repository planted at a gitlink', async (t) => {
  const f = await fixture(t);
  // What a sandboxed command can build in its own worktree: a nested repository whose configuration
  // runs a marker on any index refresh, recorded as a gitlink in a commit.
  const { receivepack } = await evilRepository(f);
  const sub = join(f.wt, 'sub');
  await mkdir(sub);
  await runGit(sub, ['init', '--quiet']);
  await runGit(sub, ['-c', 'user.email=fixture@example.invalid', '-c', 'user.name=Fixture', 'commit', '--quiet', '--allow-empty', '-m', 'sub']);
  await runGit(sub, ['config', 'core.fsmonitor', receivepack]);
  const subHead = (await runGit(sub, ['rev-parse', 'HEAD'])).stdout.trim();
  await runGit(f.wt, ['update-index', '--add', '--cacheinfo', `160000,${subHead},sub`]);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: gitlink']);
  const result = await f.refresh(f.wt);
  assert.doesNotMatch(result.stderr, REFRESH_REFUSED, output(result));
  assert.deepEqual(await f.markers(), [], output(result));
});

/**
 * A real submodule `sm` in the main checkout, its git directory at `<main>/.git/modules/sm` — a
 * directory the permission profile does not write-protect — recorded on origin's `trunk` at its
 * first commit, with the worktree reset onto that `trunk` and one commit ahead of it. The main
 * configuration sets `submodule.recurse`, so any wrapper call that honoured it would run git inside
 * the submodule under that directory's configuration.
 */
async function withSubmodule(f) {
  const root = dirname(f.main);
  const source = join(root, 'sm-source');
  await mkdir(source);
  const id = ['-c', 'user.email=fixture@example.invalid', '-c', 'user.name=Harness Fixture'];
  await runGit(source, ['init', '--quiet', '-b', 'main']);
  await runGit(source, [...id, 'commit', '--quiet', '--allow-empty', '-m', 'sm: c1']);
  const c1 = (await runGit(source, ['rev-parse', 'HEAD'])).stdout.trim();
  await runGit(source, [...id, 'commit', '--quiet', '--allow-empty', '-m', 'sm: c2']);
  const c2 = (await runGit(source, ['rev-parse', 'HEAD'])).stdout.trim();
  const sm = join(f.main, 'sm');
  await runGit(f.main, ['-c', 'protocol.file.allow=always', 'submodule', 'add', '--quiet', source, 'sm']);
  await runGit(sm, ['checkout', '--quiet', c1]);
  await runGit(f.main, ['add', 'sm']);
  await runGit(f.main, ['commit', '--quiet', '--no-verify', '-m', 'fixture: add sm']);
  await runGit(f.main, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/trunk']);
  await runGit(f.wt, ['reset', '--quiet', '--hard', 'origin/trunk']);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'fixture: work']);
  await runGit(f.main, ['config', 'submodule.recurse', 'true']);
  return { sm, c2, modules: join(f.main, '.git', 'modules', 'sm', 'config'), id };
}

test('(o) refresh-branch.sh never checks out a submodule under submodule.recurse, so its fsmonitor never runs', async (t) => {
  const f = await fixture(t);
  const { sm, c2, modules } = await withSubmodule(f);
  // The base bumps the gitlink: a recursing read-tree would check the submodule out.
  await runGit(sm, ['checkout', '--quiet', c2]);
  await runGit(f.main, ['add', 'sm']);
  await runGit(f.main, ['commit', '--quiet', '--no-verify', '-m', 'fixture: bump sm']);
  await runGit(f.main, ['push', '--quiet', '--no-verify', 'origin', 'HEAD:refs/heads/trunk']);
  await runGit(f.main, ['config', '--file', modules, 'core.fsmonitor', await fsmonitorMarker(f)]);
  const result = await f.refresh(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^refresh-branch\.sh: merged origin\/trunk into feat_w$/m, output(result));
  const merged = await runBash(f.main, ['-c', 'git merge-base --is-ancestor refs/remotes/origin/trunk refs/heads/feat_w']);
  assert.equal(merged.status, 0, `feat_w does not contain origin/trunk\n${output(result)}`);
  assert.deepEqual(await f.markers(), [], output(result));
});

test('(o2) push-branch.sh never pushes a submodule under submodule.recurse, so its configuration never runs', async (t) => {
  const f = await fixture(t);
  const { sm, modules, id } = await withSubmodule(f);
  // A submodule commit its own remote lacks, recorded on feat_w: an on-demand push would push it,
  // to the URL and with the SSH command the submodule's configuration names.
  await runGit(sm, [...id, 'commit', '--quiet', '--allow-empty', '-m', 'sm: c3']);
  const c3 = (await runGit(sm, ['rev-parse', 'HEAD'])).stdout.trim();
  await runGit(sm, ['branch', 'feat_w']);
  await runGit(f.wt, ['update-index', '--cacheinfo', `160000,${c3},sm`]);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: bump sm']);
  const ssh = join(dirname(f.main), 'sm-ssh.sh');
  await writeFile(ssh, `#!/bin/sh\n: > '${join(dirname(f.main), 'markers', 'sm-ssh')}'\nexit 1\n`);
  await chmod(ssh, 0o755);
  await runGit(f.main, ['config', '--file', modules, 'core.sshCommand', ssh]);
  await runGit(f.main, ['config', '--file', modules, 'remote.origin.url', 'ssh://harness.invalid/sm.git']);
  const result = await f.push(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^push-branch\.sh: pushed feat_w to origin$/m, output(result));
  assert.equal(await f.originTip('feat_w'), await f.head(f.wt));
  assert.deepEqual(await f.markers(), [], output(result));
});

/**
 * The worktree behind origin's `trunk` (which adds `base.txt`) on a commit of its own, plus what a
 * refresh must leave alone when it refuses: the branch tip, the index bytes and the tracked status.
 */
async function refreshState(f) {
  const index = join(f.record, 'index');
  return {
    tip: async () => (await runGit(f.main, ['rev-parse', 'refs/heads/feat_w'])).stdout.trim(),
    index: async () => readFile(index),
    status: async () => (await runGit(f.wt, ['status', '--porcelain', '--untracked-files=all'])).stdout,
  };
}

test('(p) refresh-branch.sh: a branch moved before its update-ref exits 1 with nothing written', async (t) => {
  const f = await fixture(t);
  await behind(f);
  const s = await refreshState(f);
  const oldTip = await s.tip();
  // Another writer's commit on feat_w, landing after the merge was built and before the ref moves.
  const tree = (await runGit(f.main, ['rev-parse', `${oldTip}^{tree}`])).stdout.trim();
  const moved = (
    await runGit(f.main, ['commit-tree', tree, '-p', oldTip, '-m', 'fixture: another writer'])
  ).stdout.trim();
  const indexBefore = await s.index();
  const statusBefore = await s.status();
  // A working tree updated and then put back still leaves a trace: base.txt created and removed
  // again moves the directory's own modification time.
  const dirBefore = (await stat(f.wt, { bigint: true })).mtimeNs;
  const race = await racingGit(f, [[join(f.main, '.git', 'refs', 'heads', 'feat_w'), `${moved}\n`]], '*" update-ref "*');
  const result = await runBash(dirname(f.main), [join(f.main, 'scripts', 'refresh-branch.sh'), f.wt], {
    PATH: race.PATH,
  });
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /'feat_w' moved while it was being refreshed, or its ref could not be locked \(see output above\) — nothing was merged, working copy unchanged/, output(result));
  assert.equal(await s.tip(), moved);
  assert.deepEqual(await s.index(), indexBefore);
  assert.equal(await s.status(), statusBefore);
  assert.equal(await readdir(f.wt).then((names) => names.includes('base.txt')), false);
  assert.equal((await stat(f.wt, { bigint: true })).mtimeNs, dirBefore, 'the working tree was written');
});

test('(p2) refresh-branch.sh: a working tree that refuses after the ref moved puts the branch back and exits 1', async (t) => {
  const f = await fixture(t);
  await behind(f);
  const s = await refreshState(f);
  const oldTip = await s.tip();
  const indexBefore = await s.index();
  // An untracked base.txt appearing after the dry run: the real read-tree refuses to overwrite it.
  const race = await racingGit(f, [[join(f.wt, 'base.txt'), 'untracked\n']], '*" read-tree --no-recurse-submodules -m "*');
  const result = await runBash(dirname(f.main), [join(f.main, 'scripts', 'refresh-branch.sh'), f.wt], {
    PATH: race.PATH,
  });
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /'feat_w' was put back where it was, nothing was merged/, output(result));
  assert.equal(await s.tip(), oldTip);
  assert.deepEqual(await s.index(), indexBefore);
  assert.equal(await readFile(join(f.wt, 'base.txt'), 'utf8'), 'untracked\n');
});

test('(p3) refresh-branch.sh: exit 5 when the working tree refuses and the branch cannot be put back', async (t) => {
  const f = await fixture(t);
  await behind(f);
  const s = await refreshState(f);
  const oldTip = await s.tip();
  const tree = (await runGit(f.main, ['rev-parse', `${oldTip}^{tree}`])).stdout.trim();
  const moved = (
    await runGit(f.main, ['commit-tree', tree, '-p', oldTip, '-m', 'fixture: another writer'])
  ).stdout.trim();
  const race = await racingGit(
    f,
    [
      [join(f.wt, 'base.txt'), 'untracked\n'],
      [join(f.main, '.git', 'refs', 'heads', 'feat_w'), `${moved}\n`],
    ],
    '*" read-tree --no-recurse-submodules -m "*',
  );
  const result = await runBash(dirname(f.main), [join(f.main, 'scripts', 'refresh-branch.sh'), f.wt], {
    PATH: race.PATH,
  });
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 5, output(result));
  assert.match(result.stderr, /putting 'feat_w' back failed too/, output(result));
  assert.equal(await s.tip(), moved);
  assert.equal(await readFile(join(f.wt, 'base.txt'), 'utf8'), 'untracked\n');
});
