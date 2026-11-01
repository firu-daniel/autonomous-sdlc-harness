/**
 * The shipped `commit-on-branch.sh`'s target check, hooks pin and protected set, driven as the
 * permission profile runs it: the MAIN checkout's copy, with the target as its `--repo`.
 *
 * **The rule these tests exist to enforce: the main checkout's commit wrapper writes nothing, and
 * runs no git in the target, unless the target is the main checkout its own file sits in, or a
 * worktree that main repository lists and whose `config.worktree` holds nothing but the
 * `core.hooksPath` `setup-worktree.sh` writes. The protected set is the main checkout's, never the
 * target's. Every refusal exits 1 (2 for a protected branch) and leaves the target's
 * `refs/heads/<branch>`, its index and its files byte-identical.** "No git in the target" is
 * proved by a `core.fsmonitor` marker in the scratch repository's own `.git/config`: any index
 * refresh git ran there would run it.
 *
 * Every snapshot reads the target through the main repository (`GIT_DIR=<main>/.git` with the
 * record's index) — or, for the scratch repository, its own `.git` — with `core.fsmonitor` and
 * `core.hooksPath` overridden and `--no-optional-locks`, so taking one runs no planted program and
 * rewrites no index, and a rewritten `.git` pointer or `commondir` cannot redirect it.
 *
 * Not covered here: the commit mechanics — the exit-0 and exit-3 paths beyond the one positive
 * control (j), the index sync, the absence of a commit hook, records rewritten after the checks.
 * Those are `cli/test/commit-on-branch-plumbing.test.mjs`'s, so neither suite duplicates the
 * other. The fixture is built by hand rather than by `init`, so the git records under test are
 * exactly the ones each case rewrites.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, cp, mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit, snapshotTree } from './helpers/fixture.mjs';

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
const REFUSED = /^commit-on-branch\.sh: refusing to commit: /m;

const output = (result) => `${result.stdout}\n${result.stderr}`;

/** A marker program: leaves `<markers>/<name>` and fails. */
async function markerProgram(root, name) {
  const file = join(root, `${name}-marker.sh`);
  await writeFile(file, `#!/bin/sh\n: > '${join(root, 'markers', name)}'\nexit 1\n`);
  await chmod(file, 0o755);
  return file;
}

/**
 * A main checkout on `feat_main` carrying `harness.config.json`, `githooks/`, the three wrappers
 * and their `lib/`, with `core.hooksPath` set to `githooks` and the identity in its configuration;
 * a linked worktree `wt` on `branch`, bootstrapped as `setup-worktree.sh` does; and a scratch
 * repository outside both, on `feat_s`, whose `core.fsmonitor` writes the marker `scratch-fsmonitor`.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ branch?: string }} [options]
 */
async function fixture(t, { branch = 'feat_w' } = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'commit-target-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const main = join(root, 'main');
  const wt = join(root, 'wt');
  const scratch = join(root, 'scratch');
  const markers = join(root, 'markers');
  await mkdir(main);
  await mkdir(scratch);
  await mkdir(markers);

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
  await runGit(main, ['add', 'harness.config.json', 'githooks', 'scripts']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['config', 'core.hooksPath', 'githooks']);
  await runGit(main, ['checkout', '--quiet', '-b', 'feat_main']);

  await runGit(main, ['worktree', 'add', '--quiet', '-b', branch, wt, 'trunk']);
  await runGit(wt, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(wt, ['config', '--worktree', 'core.hooksPath', join(wt, 'githooks')]);

  await runGit(scratch, ['init', '--quiet', '-b', 'feat_s']);
  await runGit(scratch, ['-c', 'user.email=fixture@example.invalid', '-c', 'user.name=Fixture', 'commit', '--quiet', '--allow-empty', '-m', 'scratch']);
  await runGit(scratch, ['config', 'core.fsmonitor', await markerProgram(root, 'scratch-fsmonitor')]);

  // A file each target would commit, so a refusal is the only reason nothing lands.
  for (const dir of [main, wt, scratch]) await writeFile(join(dir, 'new.txt'), 'new\n');

  const record = join(main, '.git', 'worktrees', 'wt');
  return {
    root,
    main,
    wt,
    scratch,
    record,
    commit: (target, paths = ['new.txt']) =>
      runBash(root, [join(main, 'scripts', 'commit-on-branch.sh'), '--repo', target, ...paths, '--', 'feat: x', 'body']),
    markers: async () => (await readdir(markers)).sort(),
    /** How a snapshot reads each target, independently of the records a case rewrites. */
    view: {
      main: { gitDir: join(main, '.git'), index: join(main, '.git', 'index'), workTree: main },
      wt: { gitDir: join(main, '.git'), index: join(record, 'index'), workTree: wt },
      scratch: { gitDir: join(scratch, '.git'), index: join(scratch, '.git', 'index'), workTree: scratch },
    },
  };
}

/**
 * The target's `refs/heads/<branch>`, its index (listing and file digest), its tracked status and
 * its files, read with no planted program run and no index rewritten.
 */
async function snapshot(view, branch) {
  const env = { GIT_DIR: view.gitDir, GIT_INDEX_FILE: view.index, GIT_WORK_TREE: view.workTree };
  const git = async (...args) => {
    const result = await runBash(
      view.workTree,
      ['-c', 'exec git --no-optional-locks -c core.fsmonitor=false -c core.hooksPath=/dev/null "$@"', 'git', ...args],
      env,
    );
    // A failing read would compare equal before and after, so it fails the case instead.
    assert.equal(result.status, 0, `snapshot: git ${args.join(' ')}\n${result.stderr}`);
    return result.stdout;
  };
  return {
    ref: await git('rev-parse', '--verify', '--quiet', `refs/heads/${branch}`),
    lsFiles: await git('ls-files', '-s'),
    index: createHash('sha256').update(await readFile(view.index)).digest('hex'),
    status: await git('status', '--porcelain', '--untracked-files=all'),
    files: await snapshotTree(view.workTree),
  };
}

/**
 * A refusal: `status`, a `refusing to commit:` line matching `pattern`, the target byte-identical,
 * and no marker. `between` runs after the first snapshot and before the call; `restore` after the
 * call and before the second snapshot, for a case whose rewrite would mislead the snapshot itself.
 */
async function assertRefused(f, { target, view, branch, pattern, status = 1, between, restore }) {
  const before = await snapshot(view, branch);
  if (between) await between();
  const result = await f.commit(target);
  if (restore) await restore();
  assert.equal(result.status, status, output(result));
  assert.equal(result.stdout, '', output(result));
  assert.match(result.stderr, pattern, output(result));
  assert.deepEqual(await snapshot(view, branch), before, output(result));
  assert.deepEqual(await f.markers(), [], output(result));
  return result;
}

test('(a) A scratch repository as --repo is refused before git runs there', async (t) => {
  const f = await fixture(t);
  await assertRefused(f, {
    target: f.scratch,
    view: f.view.scratch,
    branch: 'feat_s',
    pattern: /refusing to commit: '.*' is neither the main checkout .* nor a worktree it lists: its \.git is not a regular pointer file/,
  });
});

test('(b) A worktree whose .git pointer was rewritten to the scratch repository is refused', async (t) => {
  const f = await fixture(t);
  await assertRefused(f, {
    target: f.wt,
    view: f.view.wt,
    branch: 'feat_w',
    pattern: /refusing to commit: .*its \.git does not point into /,
    between: () => writeFile(join(f.wt, '.git'), `gitdir: ${join(f.scratch, '.git')}\n`),
  });
});

test('(c) A worktree whose record’s commondir was rewritten is refused', async (t) => {
  const f = await fixture(t);
  await assertRefused(f, {
    target: f.wt,
    view: f.view.wt,
    branch: 'feat_w',
    pattern: /refusing to commit: .*its worktree record's commondir does not resolve to /,
    between: () => writeFile(join(f.record, 'commondir'), `${join(f.scratch, '.git')}\n`),
  });
});

test('(d) A commondir planted in the main .git leaves the script no main checkout to place', async (t) => {
  const f = await fixture(t);
  const planted = join(f.main, '.git', 'commondir');
  // Removed before the second snapshot: git itself would follow it, through the snapshot's GIT_DIR.
  await assertRefused(f, {
    target: f.wt,
    view: f.view.wt,
    branch: 'feat_w',
    pattern: /refusing to commit: cannot place this script in a main checkout/,
    between: () => writeFile(planted, `${join(f.scratch, '.git')}\n`),
    restore: () => rm(planted),
  });
});

test('(e) A config.worktree carrying core.fsmonitor is refused, naming the key and never its value', async (t) => {
  const f = await fixture(t);
  const monitor = await markerProgram(f.root, 'wt-fsmonitor');
  const result = await assertRefused(f, {
    target: f.wt,
    view: f.view.wt,
    branch: 'feat_w',
    pattern: /refusing to commit: .*config\.worktree sets core\.fsmonitor, and only core\.hooksPath may be set there/,
    between: () =>
      writeFile(join(f.record, 'config.worktree'), `[core]\n\thooksPath = ${join(f.wt, 'githooks')}\n\tfsmonitor = ${monitor}\n`),
  });
  assert.ok(!result.stderr.includes(monitor), output(result));
});

test('(f) A config.worktree whose core.hooksPath is not the one setup-worktree.sh writes is refused', async (t) => {
  const f = await fixture(t);
  const elsewhere = join(f.root, 'elsewhere');
  await assertRefused(f, {
    target: f.wt,
    view: f.view.wt,
    branch: 'feat_w',
    pattern: /refusing to commit: .*sets core\.hooksPath to something other than .*, the value setup-worktree\.sh writes/,
    between: () => writeFile(join(f.record, 'config.worktree'), `[core]\n\thooksPath = ${elsewhere}\n`),
  });
});

test('(g) A branch whose name starts with - is refused', async (t) => {
  const f = await fixture(t);
  // git will not create such a branch, so the ref and the record's HEAD are written by hand.
  const tip = (await runGit(f.main, ['rev-parse', 'refs/heads/feat_w'])).stdout;
  await writeFile(join(f.main, '.git', 'refs', 'heads', '-dash'), tip);
  await writeFile(join(f.record, 'HEAD'), 'ref: refs/heads/-dash\n');
  await assertRefused(f, {
    target: f.wt,
    view: f.view.wt,
    branch: '-dash',
    pattern: /refusing to commit: branch '-dash' starts with '-'/,
  });
});

test('(h) A branch the main configuration protects is refused, whatever the worktree’s own copy says', async (t) => {
  const f = await fixture(t, { branch: 'release/x' });
  // The worktree's committed configuration drops release/*; the main checkout's still protects it.
  await writeFile(join(f.wt, 'harness.config.json'), `${JSON.stringify({ ...CONFIG, protectedBranches: ['trunk'] })}\n`);
  await runGit(f.wt, ['add', 'harness.config.json']);
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: unprotect']);
  await assertRefused(f, {
    target: f.wt,
    view: f.view.wt,
    branch: 'release/x',
    status: 2,
    pattern: /^commit-on-branch\.sh: branch 'release\/x' is protected — refusing to commit$/m,
  });
});

test('(i) A main configuration that cannot be read is refused, whatever the worktree’s copy says', async (t) => {
  const f = await fixture(t);
  await assertRefused(f, {
    target: f.wt,
    view: f.view.wt,
    branch: 'feat_w',
    pattern: /^commit-on-branch\.sh: cannot resolve '.*\/main\/harness\.config\.json' — refusing to commit$/m,
    between: () => writeFile(join(f.main, 'harness.config.json'), '{"version":'),
  });
});

test('(j) Positive control: the main checkout itself, on an unprotected branch, commits', async (t) => {
  const f = await fixture(t);
  const before = (await runGit(f.main, ['rev-parse', 'refs/heads/feat_main'])).stdout.trim();
  const result = await f.commit(f.main);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^commit-on-branch\.sh: committed [0-9a-f]+ on feat_main$/m, output(result));
  assert.doesNotMatch(result.stderr, REFUSED, output(result));
  const after = (await runGit(f.main, ['rev-parse', 'refs/heads/feat_main'])).stdout.trim();
  assert.equal((await runGit(f.main, ['rev-parse', `${after}^`])).stdout.trim(), before);
  assert.equal((await runGit(f.main, ['show', `${after}:new.txt`])).stdout, 'new\n');
  assert.deepEqual(await f.markers(), []);
});

/** A `pre-commit` and a `post-index-change` hook in `dir`, each leaving a marker named after itself. */
async function markerHooks(f, dir, prefix) {
  await mkdir(dir, { recursive: true });
  for (const name of ['pre-commit', 'post-index-change']) {
    const hook = join(dir, name);
    await writeFile(hook, `#!/bin/sh\n: > '${join(f.root, 'markers', `${prefix}-${name}`)}'\nexit 0\n`);
    await chmod(hook, 0o755);
  }
}

test('(k) The worktree’s own hooks never run: the commit pins the main hooks directory', async (t) => {
  const f = await fixture(t);
  await markerHooks(f, join(f.wt, 'githooks'), 'wt');
  const before = (await runGit(f.main, ['rev-parse', 'refs/heads/feat_w'])).stdout.trim();
  const result = await f.commit(f.wt);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^commit-on-branch\.sh: committed [0-9a-f]+ on feat_w$/m, output(result));
  assert.notEqual((await runGit(f.main, ['rev-parse', 'refs/heads/feat_w'])).stdout.trim(), before);
  assert.deepEqual(await f.markers(), [], output(result));
});

test('(k2) A main core.hooksPath naming a directory outside both accepted ones is refused', async (t) => {
  const f = await fixture(t);
  await markerHooks(f, join(f.wt, 'githooks'), 'wt');
  const foreign = join(f.root, 'foreign-hooks');
  await markerHooks(f, foreign, 'foreign');
  await runGit(f.main, ['config', 'core.hooksPath', foreign]);
  await assertRefused(f, {
    target: f.wt,
    view: f.view.wt,
    branch: 'feat_w',
    pattern: /refusing to commit: core\.hooksPath in .* resolves to .*foreign-hooks, which is neither /,
  });
});
