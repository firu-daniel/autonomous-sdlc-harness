/**
 * The shipped `commit-on-branch.sh`'s commit mechanics, driven as the permission profile runs it
 * from a linked worktree: the MAIN checkout's copy, with the worktree as its `--repo`.
 *
 * **The rule these tests exist to enforce: from a linked worktree, the main checkout's commit
 * wrapper produces exactly what the old `git add` / `git commit` wrapper produced — the same exits,
 * the same stdout line, the same staging policy, a clean working copy after exit 0 and a synced
 * index after exit 3 — except that it runs no filter driver and refuses a path that selects one.
 * It never asks git to read the worktree's `.git` pointer, its record's `HEAD`, its `commondir` or
 * its `config.worktree` after its checks, and it runs no commit hook.** Cases (a)–(f) re-prove
 * `docs/outer-loop-verification.md` §1.1 on a worktree; (g) is the hooks; (k) the filter refusal;
 * (l) a submodule under a passed directory; (m) a landed commit whose index sync failed.
 *
 * A race cannot be staged reliably, so cases (h)–(j) and (m) stage its outcome deterministically
 * instead, as `cli/test/wrapper-target-check.test.mjs`'s header explains for its (i)–(k): a `git`
 * shim first on `PATH` rewrites the records, or moves the branch, once, at a chosen git call of the
 * wrapper's and before handing that call to the real git.
 *
 * Not covered here: the target, `config.worktree`, hooks-pin and protected-branch refusals. Those
 * are `cli/test/commit-on-branch-target-check.test.mjs`'s. The fixture is built by hand rather than
 * by `init`, and is this file's own: no fixture helper is shared between the two suites.
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
  protectedBranches: ['trunk', 'release/*'],
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const BRANCH = 'feat_w';
const MOVED = /^commit-on-branch\.sh: refusing to commit: 'feat_w' moved under this wrapper, or its ref could not be locked — no commit made, and the given paths are left staged$/m;

const output = (result) => `${result.stdout}\n${result.stderr}`;
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

/** A marker program: leaves `<root>/markers/<name>` and fails. */
async function markerProgram(root, name) {
  const file = join(root, `${name}-marker.sh`);
  await writeFile(file, `#!/bin/sh\n: > ${quote(join(root, 'markers', name))}\nexit 1\n`);
  await chmod(file, 0o755);
  return file;
}

/**
 * A main checkout on `feat_main` carrying `harness.config.json`, `githooks/`, the three wrappers
 * and their `lib/`, plus `tracked.txt` and `dir/gone.txt`, with `core.hooksPath` set to `githooks`
 * and the identity in its configuration; and a linked worktree `wt` on `feat_w`, bootstrapped as
 * `setup-worktree.sh` does, holding an untracked `new.txt`.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'commit-plumbing-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const main = join(root, 'main');
  const wt = join(root, 'wt');
  await mkdir(main);
  await mkdir(join(root, 'markers'));

  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await mkdir(join(main, 'githooks'));
  await writeFile(join(main, 'githooks', 'README'), 'hooks\n');
  await mkdir(join(main, 'scripts'));
  for (const name of ['commit-on-branch.sh', 'push-branch.sh', 'refresh-branch.sh']) {
    await cp(join(TEMPLATE_SCRIPTS, name), join(main, 'scripts', name));
  }
  await cp(join(TEMPLATE_SCRIPTS, 'lib'), join(main, 'scripts', 'lib'), { recursive: true });
  await writeFile(join(main, 'tracked.txt'), 'tracked\n');
  await mkdir(join(main, 'dir'));
  await writeFile(join(main, 'dir', 'gone.txt'), 'gone\n');
  await runGit(main, ['add', 'harness.config.json', 'githooks', 'scripts', 'tracked.txt', 'dir']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['config', 'core.hooksPath', 'githooks']);
  await runGit(main, ['checkout', '--quiet', '-b', 'feat_main']);

  await runGit(main, ['worktree', 'add', '--quiet', '-b', BRANCH, wt, 'trunk']);
  await runGit(wt, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(wt, ['config', '--worktree', 'core.hooksPath', join(wt, 'githooks')]);
  await writeFile(join(wt, 'new.txt'), 'new\n');

  /** Read through the main checkout, so a rewritten worktree record cannot redirect it. */
  const mainGit = async (...args) => (await runGit(main, args)).stdout;
  return {
    root,
    main,
    wt,
    record: join(main, '.git', 'worktrees', 'wt'),
    commit: (paths, message = ['feat: x', 'body'], env = {}) =>
      runBash(root, [join(main, 'scripts', 'commit-on-branch.sh'), '--repo', wt, ...paths, '--', ...message], env),
    mainGit,
    tip: async () => (await mainGit('rev-parse', `refs/heads/${BRANCH}`)).trim(),
    wtGit: async (...args) => (await runGit(wt, args)).stdout,
    markers: async () => (await readdir(join(root, 'markers'))).sort(),
  };
}

/** The paths a commit changed, read through the main checkout. */
async function changed(f, commit) {
  return (await f.mainGit('show', '--name-status', '--pretty=format:', commit)).trim();
}

/**
 * Put a `git` shim first on `PATH` that runs `flip` — a list of `[file, contents]` writes — once,
 * before handing the call to the real git: at the first call matching `trigger`, a shell `case`
 * pattern over the call's arguments, or, with none, at the first call that is not a check's own
 * `git -C / config --file` read. Returns the environment that installs it.
 */
async function racingGit(f, flip, trigger) {
  const realGit = (await runBash(f.root, ['-c', 'command -v git'])).stdout.trim();
  const bin = join(f.root, 'shim-bin');
  await mkdir(bin);
  const flipScript = join(f.root, 'flip.sh');
  await writeFile(flipScript, flip.map(([file, contents]) => `printf '%s' ${quote(contents)} > ${quote(file)}\n`).join(''));
  const done = join(f.root, 'flip-done');
  await writeFile(
    join(bin, 'git'),
    trigger === undefined
      ? `#!/bin/sh\nif [ ! -e '${done}' ] && [ "$1 $2" != "-C /" ]; then : > '${done}'; /bin/sh '${flipScript}'; fi\nexec '${realGit}' "$@"\n`
      : `#!/bin/sh\nif [ ! -e '${done}' ]; then case " $* " in ${trigger}) : > '${done}'; /bin/sh '${flipScript}' ;; esac; fi\nexec '${realGit}' "$@"\n`,
  );
  await chmod(join(bin, 'git'), 0o755);
  return { env: { PATH: `${bin}:${process.env.PATH}` }, flipped: async () => (await readdir(f.root)).includes('flip-done') };
}

// The wrapper's read of the tip it builds on: after its checks and after the branch read.
const AFTER_BRANCH_READ = '*" rev-parse --verify --quiet refs/heads/"*';

test('(a) One path with a subject and a body: exit 0, the exact stdout line, a clean worktree', async (t) => {
  const f = await fixture(t);
  const before = await f.tip();
  const result = await f.commit(['new.txt']);
  assert.equal(result.status, 0, output(result));
  const after = await f.tip();
  const short = (await f.mainGit('rev-parse', '--short', after)).trim();
  assert.equal(result.stdout, `commit-on-branch.sh: committed ${short} on ${BRANCH}\n`);
  assert.equal((await f.mainGit('rev-parse', `${after}^`)).trim(), before);
  assert.equal((await f.wtGit('log', '-1', '--pretty=%B')).trimEnd(), 'feat: x\n\nbody');
  assert.equal(await f.wtGit('status', '--porcelain', '--untracked-files=all'), '');
  assert.equal((await f.wtGit('rev-parse', 'HEAD')).trim(), after);
  assert.equal(await changed(f, after), 'A\tnew.txt');
});

test('(b) The same call again exits 3 with no new commit', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.commit(['new.txt'])).status, 0);
  const before = await f.tip();
  const result = await f.commit(['new.txt']);
  assert.equal(result.status, 3, output(result));
  assert.equal(result.stdout, '', output(result));
  assert.match(result.stderr, /^commit-on-branch\.sh: nothing to commit$/m, output(result));
  assert.equal(await f.tip(), before);
});

test('(c) A missing path is warned about and skipped; only the existing one is committed', async (t) => {
  const f = await fixture(t);
  const result = await f.commit(['new.txt', 'missing.txt']);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stderr, /^commit-on-branch\.sh: path 'missing\.txt' does not exist under '.*' — skipping$/m, output(result));
  assert.equal((await f.mainGit('show', '--name-only', '--pretty=format:', await f.tip())).trim(), 'new.txt');
});

test('(d) A deletion is committed by passing its parent directory', async (t) => {
  const f = await fixture(t);
  await rm(join(f.wt, 'dir', 'gone.txt'));
  const result = await f.commit(['dir']);
  assert.equal(result.status, 0, output(result));
  assert.equal(await changed(f, await f.tip()), 'D\tdir/gone.txt');
  assert.equal(await f.wtGit('ls-files', 'dir/gone.txt'), '');
  assert.equal(await f.wtGit('status', '--porcelain', '--', 'dir'), '');
});

test('(l) A submodule under a passed directory is carried unchanged', async (t) => {
  const f = await fixture(t);
  await runGit(f.wt, ['update-index', '--add', '--cacheinfo', `160000,${await f.tip()},dir/sub`]);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: gitlink']);
  await mkdir(join(f.wt, 'dir', 'sub'));
  await rm(join(f.wt, 'dir', 'gone.txt'));
  const result = await f.commit(['dir']);
  assert.equal(result.status, 0, output(result));
  assert.equal(await changed(f, await f.tip()), 'D\tdir/gone.txt');
  assert.match(await f.mainGit('ls-tree', await f.tip(), 'dir/sub'), /^160000 commit /);
});

test('(e) A path staged earlier is not swept into the commit, and stays staged', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.wt, 'other.txt'), 'other\n');
  await f.wtGit('add', 'other.txt');
  const result = await f.commit(['new.txt']);
  assert.equal(result.status, 0, output(result));
  assert.equal(await changed(f, await f.tip()), 'A\tnew.txt');
  assert.equal((await f.wtGit('diff', '--cached', '--name-only')).trim(), 'other.txt');
});

test('(f) Exit 3 still syncs the index: a staged edit reverted on disk is re-staged as the tip', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.wt, 'tracked.txt'), 'edited\n');
  await f.wtGit('add', 'tracked.txt');
  await writeFile(join(f.wt, 'tracked.txt'), 'tracked\n');
  assert.notEqual(await f.wtGit('status', '--porcelain', '--', 'tracked.txt'), '');
  const before = await f.tip();
  const result = await f.commit(['tracked.txt']);
  assert.equal(result.status, 3, output(result));
  assert.equal(await f.tip(), before);
  assert.equal(await f.wtGit('status', '--porcelain', '--', 'tracked.txt'), '');
});

test('(g) No commit hook in the pinned main hooks directory runs', async (t) => {
  const f = await fixture(t);
  for (const name of ['pre-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit']) {
    const hook = join(f.main, 'githooks', name);
    await writeFile(hook, `#!/bin/sh\n: > ${quote(join(f.root, 'markers', name))}\nexit 0\n`);
    await chmod(hook, 0o755);
  }
  const before = await f.tip();
  const result = await f.commit(['new.txt']);
  assert.equal(result.status, 0, output(result));
  assert.notEqual(await f.tip(), before);
  assert.deepEqual(await f.markers(), [], output(result));
});

test('(h) Records rewritten after the checks are never read: the commit lands on the real branch', async (t) => {
  const f = await fixture(t);
  const evil = join(f.root, 'evil');
  await mkdir(evil);
  await runGit(evil, ['init', '--quiet', '-b', BRANCH]);
  await runGit(evil, ['-c', 'user.email=fixture@example.invalid', '-c', 'user.name=Fixture', 'commit', '--quiet', '--allow-empty', '-m', 'evil']);
  await runGit(evil, ['config', 'core.fsmonitor', await markerProgram(f.root, 'evil-fsmonitor')]);
  const evilTip = (await runGit(evil, ['rev-parse', `refs/heads/${BRANCH}`])).stdout;
  const monitor = await markerProgram(f.root, 'wt-fsmonitor');
  const race = await racingGit(f, [
    [join(f.wt, '.git'), `gitdir: ${join(evil, '.git')}\n`],
    [join(f.record, 'commondir'), `${join(evil, '.git')}\n`],
    [join(f.record, 'config.worktree'), `[core]\n\thooksPath = ${join(f.wt, 'githooks')}\n\tfsmonitor = ${monitor}\n`],
  ]);
  const before = await f.tip();
  const result = await f.commit(['new.txt'], undefined, race.env);
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 0, output(result));
  const after = await f.tip();
  assert.equal(result.stdout, `commit-on-branch.sh: committed ${(await f.mainGit('rev-parse', '--short', after)).trim()} on ${BRANCH}\n`);
  assert.equal((await f.mainGit('rev-parse', `${after}^`)).trim(), before);
  assert.equal(await f.mainGit('show', `${after}:new.txt`), 'new\n');
  assert.equal((await runGit(evil, ['rev-parse', `refs/heads/${BRANCH}`])).stdout, evilTip);
  assert.deepEqual(await f.markers(), [], output(result));
});

test('(i) A worktree HEAD flipped to another branch after the branch read moves only refs/heads/<branch>', async (t) => {
  const f = await fixture(t);
  const others = async () =>
    (await f.mainGit('for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads/trunk', 'refs/heads/feat_main'));
  const othersBefore = await others();
  const before = await f.tip();
  const race = await racingGit(f, [[join(f.record, 'HEAD'), 'ref: refs/heads/feat_main\n']], AFTER_BRANCH_READ);
  const result = await f.commit(['new.txt'], undefined, race.env);
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^commit-on-branch\.sh: committed [0-9a-f]+ on feat_w$/m, output(result));
  const after = await f.tip();
  assert.equal((await f.mainGit('rev-parse', `${after}^`)).trim(), before);
  assert.equal(await f.mainGit('show', `${after}:new.txt`), 'new\n');
  assert.equal(await others(), othersBefore);
});

test('(j) A branch moved just before update-ref: exit 1, no commit made, the ref left moved, the paths staged', async (t) => {
  const f = await fixture(t);
  const before = await f.tip();
  // Another writer's commit on feat_w, landing after the commit was built and before the ref moves.
  const tree = (await f.mainGit('rev-parse', `${before}^{tree}`)).trim();
  const moved = (await f.mainGit('commit-tree', tree, '-p', before, '-m', 'fixture: another writer')).trim();
  const race = await racingGit(f, [[join(f.main, '.git', 'refs', 'heads', BRANCH), `${moved}\n`]], '*" update-ref "*');
  const result = await f.commit(['new.txt'], undefined, race.env);
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 1, output(result));
  assert.equal(result.stdout, '', output(result));
  assert.match(result.stderr, MOVED, output(result));
  assert.equal(await f.tip(), moved);
  assert.equal((await f.wtGit('diff', '--cached', '--name-only')).trim(), 'new.txt');
});

test('(k) A path whose attributes select a filter is refused, and the filter never runs', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.wt, '.gitattributes'), 'tracked.txt filter=marker\n');
  await runGit(f.main, ['config', 'filter.marker.clean', await markerProgram(f.root, 'filter-clean')]);
  await writeFile(join(f.wt, 'tracked.txt'), 'edited\n');
  const before = await f.tip();
  const result = await f.commit(['tracked.txt']);
  assert.equal(result.status, 1, output(result));
  assert.equal(result.stdout, '', output(result));
  assert.match(
    result.stderr,
    /^commit-on-branch\.sh: refusing to commit: 'tracked\.txt' selects a filter driver, which this wrapper never runs$/m,
    output(result),
  );
  assert.equal(await f.tip(), before);
  assert.deepEqual(await f.markers(), [], output(result));
});

test('(m) A commit whose index sync fails is reported as landed', async (t) => {
  const f = await fixture(t);
  const before = await f.tip();
  // The record's index lock appears just before the ref moves, so the commit lands and the sync fails.
  const lock = join(f.record, 'index.lock');
  const race = await racingGit(f, [[lock, '']], '*" update-ref "*');
  const result = await f.commit(['new.txt'], undefined, race.env);
  assert.ok(await race.flipped(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /^commit-on-branch\.sh: committed [0-9a-f]+ on feat_w, but the index of /m, output(result));
  const after = await f.tip();
  assert.notEqual(after, before);
  assert.equal((await f.mainGit('rev-parse', `${after}^`)).trim(), before);

  await rm(lock);
  const again = await f.commit(['new.txt']);
  assert.equal(again.status, 3, output(again));
  assert.equal(await f.tip(), after);
  assert.equal(await f.wtGit('status', '--porcelain', '--', 'new.txt'), '');
});
