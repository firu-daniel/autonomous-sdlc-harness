/**
 * The shipped `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` on a clone, driven as
 * the permission profile runs them: the MAIN checkout's copies, with the clone as their target.
 *
 * **The rule these tests exist to enforce: the main checkout's three excluded wrappers act on a
 * registered clone only through the main checkout — sync-in, the unchanged operation, then the
 * branch moved clone-first; a commit landing in the clone after sync-in, and a clone diverged from
 * the main checkout, are refused with nothing moved; the next ordinary call heals a clone left behind
 * or ahead; every refusal they make on a worktree still fires on a clone; and their exit statuses
 * and stdout lines are the worktree arm's.** One control per wrapper runs the same operation on a linked
 * worktree in the same fixture and compares the exit status and stdout line, and a worktree whose
 * `config.worktree` sets `core.sshCommand` is still refused by all three, so skipping
 * `hr_worktree_config_check_var` on the clone arm did not reach the worktree arm.
 *
 * The worktree arm itself is the existing suites' (`cli/test/wrapper-target-check.test.mjs`,
 * `cli/test/commit-on-branch-target-check.test.mjs` and their neighbours); sync in isolation is
 * `cli/test/clone-sync.test.mjs`'s. The fixture is built by hand, as
 * `cli/test/wrapper-target-check.test.mjs` builds its own, and the clone is the one
 * `hr_clone_create_var` makes. Races are staged with a `git` shim first on `PATH`, the technique
 * `cli/test/run-copy-clone-arm.test.mjs` uses: (r) commits once in the clone after sync-in and before
 * the wrapper's own ref update; (f), (n) and (s) let the clone's swap land and fail every later
 * `update-ref` of the branch, so the main checkout's swap and the clone's rollback both fail.
 *
 * RED ONCE — `push-branch.sh`'s `hr_copy_sync_in_var` call removed: case (g) fails, origin's
 * `feat_c` missing the clone's commit, and case (i) pushes instead of refusing. `push-branch.sh`'s
 * verify-only `hr_copy_ref_swap_var` call removed: case (r)'s push subtest pushes instead of
 * refusing. `refresh-branch.sh`'s swap replaced by the main checkout's `update-ref` alone: case (r)'s
 * refresh subtest fails, and so do (j), (k), (m) and (n).
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, chmod, cp, mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const TEMPLATE_SCRIPTS = join(PACKAGE_ROOT, 'templates', 'scripts');
const LIB = join(TEMPLATE_SCRIPTS, 'lib', 'harness-run-lib.sh');
const CONFIG = {
  version: 1,
  defaultBranch: 'trunk',
  protectedBranches: ['trunk'],
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const BRANCH = 'feat_c';
const WT_BRANCH = 'feat_w';
const REF = `refs/heads/${BRANCH}`;
const IDENTITY = ['-c', 'user.name=Harness Fixture', '-c', 'user.email=fixture@example.invalid'];
const COMMIT_REFUSED = /^commit-on-branch\.sh: refusing to commit: /m;
const PUSH_REFUSED = /^push-branch\.sh: refusing to push: /m;
const REFRESH_REFUSED = /^refresh-branch\.sh: refusing to refresh: /m;
const COMMITTED = /^commit-on-branch\.sh: committed ([0-9a-f]+) on feat_c$/m;
const PUSHED = /^push-branch\.sh: pushed feat_c to origin$/m;
const MERGED = /^refresh-branch\.sh: merged origin\/trunk into feat_c$/m;
const WT_CONFIG_REFUSED = /sets core\.sshcommand, and only core\.hooksPath may be set there/;

const output = (result) => `${result.stdout}\n${result.stderr}`;
const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

/**
 * A bare origin; a main checkout on `trunk` carrying `harness.config.json`, `githooks/`, `notes.txt`
 * and the three wrappers with their `lib/`, its `core.hooksPath` `githooks`; the clone of
 * {@link BRANCH} `hr_clone_create_var` makes at `<root>/main-feat_c`; and a linked worktree `wt` on
 * {@link WT_BRANCH}, bootstrapped as `setup-worktree.sh` step 4 does.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'wrapper-clone-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  const wt = join(root, 'wt');
  const markers = join(root, 'markers');
  await mkdir(origin);
  await mkdir(join(main, 'githooks'), { recursive: true });
  await mkdir(markers);
  await runGit(origin, ['init', '--bare', '--quiet', '-b', 'trunk']);
  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await writeFile(join(main, 'githooks', 'README'), 'hooks\n');
  await writeFile(join(main, 'notes.txt'), 'seeded notes\n');
  await mkdir(join(main, 'scripts'));
  for (const name of ['commit-on-branch.sh', 'push-branch.sh', 'refresh-branch.sh']) {
    await cp(join(TEMPLATE_SCRIPTS, name), join(main, 'scripts', name));
  }
  await cp(join(TEMPLATE_SCRIPTS, 'lib'), join(main, 'scripts', 'lib'), { recursive: true });
  await runGit(main, ['add', 'harness.config.json', 'githooks', 'notes.txt', 'scripts']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['config', 'core.hooksPath', 'githooks']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', 'origin', 'trunk']);
  await mkdir(join(main, 'sdlc-harness', 'autonomous_logs'), { recursive: true });

  const created = await runBash(root, [
    '-c',
    '. "$1" || exit 99; hr_clone_create_var "$2" "$3" trunk || { printf "%s\\n" "$HR_CLONE_REFUSAL" >&2; exit 1; }',
    'hr',
    LIB,
    main,
    BRANCH,
  ]);
  assert.equal(created.status, 0, output(created));
  const clone = join(root, `main-${BRANCH}`);

  await runGit(main, ['worktree', 'add', '--quiet', '-b', WT_BRANCH, wt]);
  await runGit(wt, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(wt, ['config', '--worktree', 'core.hooksPath', join(wt, 'githooks')]);

  const script = (name) => join(main, 'scripts', name);
  const seed = (await runGit(main, ['rev-parse', 'HEAD'])).stdout.trim();
  const f = {
    root,
    origin,
    main,
    clone,
    wt,
    seed,
    gitdir: join(clone, '.git'),
    commit: (target, paths, subject, env = {}) =>
      runBash(root, [script('commit-on-branch.sh'), '--repo', target, ...paths, '--', subject], env),
    push: (target, env = {}) => runBash(root, [script('push-branch.sh'), target], { PUSH_RETRY_DELAY_SECS: '0', ...env }),
    refresh: (args, env = {}) => runBash(root, [script('refresh-branch.sh'), ...args], env),
    tip: async (dir, ref = REF) => (await runGit(dir, ['rev-parse', '--verify', ref])).stdout.trim(),
    parents: async (oid, dir = main) => (await runGit(dir, ['log', '-1', '--format=%P', oid])).stdout.trim().split(' '),
    cloneStatus: async () => (await runGit(clone, ['status', '--porcelain', '--untracked-files=all'])).stdout,
    originTip: async (branch) => {
      const line = (await runGit(main, ['ls-remote', origin, `refs/heads/${branch}`])).stdout.trim();
      return line.split('\t')[0];
    },
    originRefs: async () => (await runGit(origin, ['for-each-ref'])).stdout,
    markers: async () => (await readdir(markers)).sort(),
    /** A commit made in the clone with plain `git commit`; returns its id. */
    commitInClone: async (name, content) => {
      await writeFile(join(clone, name), content);
      await runGit(clone, ['add', name]);
      await runGit(clone, [...IDENTITY, 'commit', '--quiet', '-m', `clone: ${name}`]);
      return (await runGit(clone, ['rev-parse', 'HEAD'])).stdout.trim();
    },
    /** A commit on the main checkout's `trunk` setting `name`, pushed to origin; returns its id. */
    advanceTrunk: async (name, content, { push = true } = {}) => {
      await writeFile(join(main, name), content);
      await runGit(main, ['add', name]);
      await runGit(main, ['commit', '--quiet', '-m', `trunk: ${name}`]);
      if (push) await runGit(main, ['push', '--quiet', 'origin', 'trunk']);
      return (await runGit(main, ['rev-parse', 'HEAD'])).stdout.trim();
    },
    /** A commit in the main repository on top of `parent`, reaching no branch. */
    looseCommit: async (parent, message) =>
      (await runGit(main, ['commit-tree', `${parent}^{tree}`, '-p', parent, '-m', message])).stdout.trim(),
    /** The main checkout's `harness.config.json` protecting {@link BRANCH} too. */
    protectBranch: () =>
      writeFile(join(main, 'harness.config.json'), `${JSON.stringify({ ...CONFIG, protectedBranches: ['trunk', BRANCH] })}\n`),
    /** A program that leaves the marker `name` and fails. */
    marker: async (name) => {
      const file = join(root, `${name}-marker.sh`);
      await writeFile(file, `#!/bin/sh\n: > '${join(markers, name)}'\nexit 1\n`);
      await chmod(file, 0o755);
      return file;
    },
    /**
     * A `git` shim first on `PATH`: a call whose arguments contain `trigger` runs the real git
     * (`$REAL`) and then `after`.
     */
    shim: async (trigger, after) => {
      const real = (await runBash(root, ['-c', 'command -v git'])).stdout.trim();
      const bin = join(root, 'shim-bin');
      await mkdir(bin);
      const fired = join(root, 'shim-fired');
      await writeFile(
        join(bin, 'git'),
        `#!/bin/sh\nREAL='${real}'\ncase " $* " in *'${trigger}'*) : > '${fired}'; "$REAL" "$@"; s=$?; ${after}; exit $s ;; esac\nexec "$REAL" "$@"\n`,
      );
      await chmod(join(bin, 'git'), 0o755);
      return { env: { PATH: `${bin}:${process.env.PATH}` }, fired: () => exists(fired) };
    },
  };
  return f;
}

/**
 * The shim's `after`: one empty commit on the clone's {@link REF} by plain `git commit`, the first
 * time only, with every variable the wrappers set for their own call cleared.
 */
const raceCommit = (f) =>
  `[ -e '${join(f.root, 'race-done')}' ] || { env -u GIT_DIR -u GIT_INDEX_FILE -u GIT_WORK_TREE -u GIT_COMMON_DIR ` +
  `-u GIT_OBJECT_DIRECTORY -u GIT_CONFIG_COUNT -u GIT_CONFIG_KEY_0 -u GIT_CONFIG_VALUE_0 -u GIT_CONFIG_PARAMETERS ` +
  `-u GIT_NO_REPLACE_OBJECTS -u GIT_GRAFT_FILE "$REAL" -C '${f.clone}' ${IDENTITY.map((a) => `'${a}'`).join(' ')} ` +
  `commit --quiet --no-verify --allow-empty -m race; : > '${join(f.root, 'race-done')}'; }`;

/**
 * A `git` shim first on `PATH` that runs the first `update-ref` of {@link REF} — the clone's half of
 * the swap — and fails every later one: the main checkout's half and the clone's rollback.
 */
async function swapFiveShim(f) {
  const real = (await runBash(f.root, ['-c', 'command -v git'])).stdout.trim();
  const bin = join(f.root, 'swap-bin');
  await mkdir(bin);
  const first = join(f.root, 'swap-first');
  const failed = join(f.root, 'swap-failed');
  await writeFile(
    join(bin, 'git'),
    `#!/bin/sh\nREAL='${real}'\ncase " $* " in *' update-ref '*'${REF} '*)\n` +
      `  if [ -e '${first}' ]; then : > '${failed}'; exit 1; fi\n  : > '${first}' ;;\nesac\nexec "$REAL" "$@"\n`,
  );
  await chmod(join(bin, 'git'), 0o755);
  return { env: { PATH: `${bin}:${process.env.PATH}` }, fired: () => exists(failed) };
}

/** A result's exit status and stdout with the branch and short commit ids made generic. */
const shape = (result, branch) => ({
  status: result.status,
  stdout: result.stdout.replaceAll(branch, '<branch>').replace(/\b[0-9a-f]{7,64}\b/g, '<sha>'),
});

// ---------------------------------------------------------------------------
// commit-on-branch.sh
// ---------------------------------------------------------------------------

test('(a) commit-on-branch.sh commits an edited tracked file in the clone and moves both refs', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
  const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
  assert.equal(result.status, 0, output(result));
  const m = result.stdout.match(COMMITTED);
  assert.ok(m, output(result));
  const commit = await f.tip(f.main);
  assert.ok(commit.startsWith(m[1]));
  assert.notEqual(commit, f.seed);
  assert.equal(await f.tip(f.clone), commit);
  assert.deepEqual(await f.parents(commit), [f.seed]);
  assert.equal(await f.cloneStatus(), '');
});

test('(b) commit-on-branch.sh builds on a plain git commit the run made in the clone', async (t) => {
  const f = await fixture(t);
  const earlier = await f.commitInClone('a.txt', 'clone work\n');
  assert.equal(await f.tip(f.main), f.seed);
  await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
  const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, COMMITTED, output(result));
  const commit = await f.tip(f.main);
  assert.deepEqual(await f.parents(commit), [earlier]);
  assert.equal(await f.tip(f.clone), commit);
  assert.equal(await f.cloneStatus(), '');
});

test('(c) commit-on-branch.sh refuses a protected clone branch with exit 2', async (t) => {
  const f = await fixture(t);
  await f.protectBranch();
  await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
  const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
  assert.equal(result.status, 2, output(result));
  assert.match(result.stderr, /^commit-on-branch\.sh: branch 'feat_c' is protected — refusing to commit$/m, output(result));
  assert.equal(await f.tip(f.main), f.seed);
  assert.equal(await f.tip(f.clone), f.seed);
});

test('(d) commit-on-branch.sh refuses a clone branch the main checkout has checked out', async (t) => {
  const f = await fixture(t);
  await runGit(f.main, ['checkout', '--quiet', BRANCH]);
  await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
  const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, COMMIT_REFUSED, output(result));
  assert.match(result.stderr, /has it checked out$/m, output(result));
  assert.equal(await f.tip(f.main), f.seed);
  assert.equal(await f.tip(f.clone), f.seed);
});

test('(e) commit-on-branch.sh refuses a clone whose .git/config gains core.fsmonitor, naming the key only', async (t) => {
  const f = await fixture(t);
  const monitor = await f.marker('fsmonitor');
  await runGit(f.root, ['config', '--file', join(f.gitdir, 'config'), 'core.fsmonitor', monitor]);
  await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
  const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, COMMIT_REFUSED, output(result));
  assert.match(result.stderr, /sets core\.fsmonitor, which the clone allow-list does not hold/, output(result));
  assert.ok(!output(result).includes(monitor), output(result));
  assert.deepEqual(await f.markers(), []);
  assert.equal(await f.tip(f.main), f.seed);
  assert.equal(await f.tip(f.clone), f.seed);
});

test('(f) commit-on-branch.sh: a main ref that cannot follow the clone’s exits 1, the commit standing in the clone', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
  const shim = await swapFiveShim(f);
  const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes', shim.env);
  assert.ok(await shim.fired(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 1, output(result));
  const m = result.stderr.match(
    /^commit-on-branch\.sh: committed ([0-9a-f]+) on feat_c, but .* — the commit stands in the clone, and the main checkout's ref follows it on the next wrapper call$/m,
  );
  assert.ok(m, output(result));
  assert.doesNotMatch(result.stdout, COMMITTED, output(result));
  const commit = await f.tip(f.clone);
  assert.ok(commit.startsWith(m[1]));
  assert.deepEqual(await f.parents(commit), [f.seed]);
  assert.equal(await f.tip(f.main), f.seed);
});

// ---------------------------------------------------------------------------
// push-branch.sh
// ---------------------------------------------------------------------------

test('(g) push-branch.sh pushes the commit the run made in the clone and mirrors origin/<branch> into it', async (t) => {
  const f = await fixture(t);
  const commit = await f.commitInClone('a.txt', 'clone work\n');
  const result = await f.push(f.clone);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, PUSHED, output(result));
  assert.doesNotMatch(result.stdout, /could not follow/, output(result));
  assert.equal(await f.originTip(BRANCH), commit, output(result));
  assert.equal(await f.tip(f.clone, `refs/remotes/origin/${BRANCH}`), await f.tip(f.main, `refs/remotes/origin/${BRANCH}`));
  assert.equal(await f.tip(f.clone, `refs/remotes/origin/${BRANCH}`), commit);
});

test('(h) push-branch.sh refuses an unregistered repository at the derived clone path', async (t) => {
  const f = await fixture(t);
  const scratch = join(f.root, 'main-feat_s');
  await runGit(f.root, ['clone', '--quiet', '-b', 'trunk', f.origin, scratch]);
  await runGit(scratch, ['checkout', '--quiet', '-b', 'feat_s']);
  await runGit(scratch, [...IDENTITY, 'commit', '--quiet', '--allow-empty', '-m', 'scratch: work']);
  // An ssh:// push URL, so any push git started there would run this marker.
  await runGit(scratch, ['config', 'core.sshCommand', await f.marker('ssh')]);
  await runGit(scratch, ['config', 'remote.origin.pushurl', 'ssh://harness.invalid/origin.git']);
  const before = await f.originRefs();
  const result = await f.push(scratch);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, PUSH_REFUSED, output(result));
  assert.match(result.stdout, /is neither the main checkout .* nor a worktree it lists/, output(result));
  assert.equal(await f.originRefs(), before);
  assert.deepEqual(await f.markers(), []);
});

test('(i) All three wrappers refuse a clone whose tip has diverged from the main checkout’s, moving nothing', async (t) => {
  const f = await fixture(t);
  const own = await f.commitInClone('a.txt', 'clone work\n');
  const other = await f.looseCommit(f.seed, 'fixture: main side');
  await runGit(f.main, ['update-ref', REF, other, f.seed]);
  await f.advanceTrunk('base.txt', 'base\n');
  await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
  const before = await f.originRefs();

  const committed = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
  assert.equal(committed.status, 1, output(committed));
  assert.match(committed.stderr, COMMIT_REFUSED, output(committed));
  assert.match(committed.stderr, /have diverged/, output(committed));

  const pushed = await f.push(f.clone);
  assert.equal(pushed.status, 0, output(pushed));
  assert.match(pushed.stdout, PUSH_REFUSED, output(pushed));
  assert.match(pushed.stdout, /have diverged/, output(pushed));

  const refreshed = await f.refresh([f.clone]);
  assert.equal(refreshed.status, 1, output(refreshed));
  assert.match(refreshed.stderr, REFRESH_REFUSED, output(refreshed));
  assert.match(refreshed.stderr, /have diverged/, output(refreshed));

  assert.equal(await f.originRefs(), before);
  assert.equal(await f.tip(f.main), other);
  assert.equal(await f.tip(f.clone), own);
});

// ---------------------------------------------------------------------------
// refresh-branch.sh
// ---------------------------------------------------------------------------

test('(j) refresh-branch.sh fast-forwards the clone to origin/trunk: its ref, index and tree, and the main ref', async (t) => {
  const f = await fixture(t);
  const base = await f.advanceTrunk('base.txt', 'base\n');
  const result = await f.refresh([f.clone]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, MERGED, output(result));
  assert.equal(await f.tip(f.main), base);
  assert.equal(await f.tip(f.clone), base);
  assert.equal(await f.tip(f.clone, 'HEAD'), base);
  assert.equal(await f.tip(f.clone, 'refs/remotes/origin/trunk'), base);
  assert.equal(await readFile(join(f.clone, 'base.txt'), 'utf8'), 'base\n');
  assert.equal(await f.cloneStatus(), '');
});

test('(k) refresh-branch.sh builds a two-parent merge with git’s default message', async (t) => {
  const f = await fixture(t);
  const own = await f.commitInClone('a.txt', 'clone work\n');
  const base = await f.advanceTrunk('base.txt', 'base\n');
  const result = await f.refresh([f.clone]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, MERGED, output(result));
  const merge = await f.tip(f.main);
  assert.equal(await f.tip(f.clone), merge);
  assert.deepEqual(await f.parents(merge), [own, base]);
  assert.equal(
    (await runGit(f.main, ['log', '-1', '--format=%s', merge])).stdout.trim(),
    "Merge remote-tracking branch 'origin/trunk' into feat_c",
  );
  assert.equal(await readFile(join(f.clone, 'base.txt'), 'utf8'), 'base\n');
  assert.equal(await f.cloneStatus(), '');
});

test('(l) refresh-branch.sh: a conflict exits 4 and leaves both refs, the clone’s index and its files as they were', async (t) => {
  const f = await fixture(t);
  await f.advanceTrunk('base.txt', 'base\n');
  await writeFile(join(f.clone, 'base.txt'), 'not the base\n');
  const committed = await f.commit(f.clone, ['base.txt'], 'chore: conflicting base.txt');
  assert.equal(committed.status, 0, output(committed));
  const tip = await f.tip(f.clone);
  assert.equal(await f.tip(f.main), tip);
  const index = join(f.gitdir, 'index');
  const hash = async () => createHash('sha256').update(await readFile(index)).digest('hex');
  // `git status` may rewrite the index's stat data, so it runs before the hash is taken and after
  // the hash is compared.
  const statusBefore = await f.cloneStatus();
  const indexBefore = await hash();
  const result = await f.refresh([f.clone]);
  assert.equal(result.status, 4, output(result));
  assert.match(result.stderr, /^ {2}conflicted: base\.txt$/m, output(result));
  assert.equal(await hash(), indexBefore);
  assert.equal(await f.tip(f.main), tip);
  assert.equal(await f.tip(f.clone), tip);
  assert.equal(await f.cloneStatus(), statusBefore);
  assert.equal(await readFile(join(f.clone, 'base.txt'), 'utf8'), 'not the base\n');
});

test('(m) refresh-branch.sh --local merges the local trunk into the clone', async (t) => {
  const f = await fixture(t);
  const trunk = await f.advanceTrunk('local.txt', 'local\n', { push: false });
  const result = await f.refresh(['--local', f.clone]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^refresh-branch\.sh: merged trunk into feat_c$/m, output(result));
  assert.equal(await f.tip(f.main), trunk);
  assert.equal(await f.tip(f.clone), trunk);
  assert.equal(await f.cloneStatus(), '');
});

test('(n) refresh-branch.sh: a main ref that cannot follow the clone’s, with the rollback failing, exits 5 before the tree moves', async (t) => {
  const f = await fixture(t);
  const base = await f.advanceTrunk('base.txt', 'base\n');
  const shim = await swapFiveShim(f);
  const result = await f.refresh([f.clone], shim.env);
  assert.ok(await shim.fired(), `the shim never ran\n${output(result)}`);
  assert.equal(result.status, 5, output(result));
  assert.match(result.stderr, /^refresh-branch\.sh: could not move 'feat_c' to the merge result: .*rolling the clone back failed/m, output(result));
  assert.doesNotMatch(result.stdout, MERGED, output(result));
  assert.equal(await f.tip(f.main), f.seed);
  assert.equal(await f.tip(f.clone), base);
  assert.equal(await exists(join(f.clone, 'base.txt')), false);
});

test('(o) refresh-branch.sh refuses a protected clone branch with exit 2', async (t) => {
  const f = await fixture(t);
  await f.advanceTrunk('base.txt', 'base\n');
  await f.protectBranch();
  const result = await f.refresh([f.clone]);
  assert.equal(result.status, 2, output(result));
  assert.match(result.stderr, /HEAD is on protected branch 'feat_c'/, output(result));
  assert.doesNotMatch(result.stderr, REFRESH_REFUSED, output(result));
  assert.equal(await f.tip(f.main), f.seed);
  assert.equal(await f.tip(f.clone), f.seed);
});

// ---------------------------------------------------------------------------
// The race, the heal.
// ---------------------------------------------------------------------------

test('(r) A commit landing in the clone after sync-in is refused by each wrapper with nothing moved', async (t) => {
  await t.test('commit-on-branch.sh', async (t) => {
    const f = await fixture(t);
    await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
    const shim = await f.shim(' commit-tree ', raceCommit(f));
    const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes', shim.env);
    assert.ok(await shim.fired(), `the shim never ran\n${output(result)}`);
    assert.equal(result.status, 1, output(result));
    assert.match(
      result.stderr,
      /^commit-on-branch\.sh: refusing to commit: 'feat_c' moved under this wrapper, or its ref could not be locked — no commit made, and the given paths are left staged$/m,
      output(result),
    );
    const raced = await f.tip(f.clone);
    assert.deepEqual(await f.parents(raced, f.clone), [f.seed]);
    assert.equal(await f.tip(f.main), f.seed);
  });

  await t.test('push-branch.sh', async (t) => {
    const f = await fixture(t);
    const shim = await f.shim('branch.feat_c.merge', raceCommit(f));
    const before = await f.originRefs();
    const result = await f.push(f.clone, shim.env);
    assert.ok(await shim.fired(), `the shim never ran\n${output(result)}`);
    assert.equal(result.status, 0, output(result));
    assert.match(result.stdout, /^push-branch\.sh: refusing to push: the clone's refs\/heads\/feat_c moved after it was synced in /m, output(result));
    assert.doesNotMatch(result.stdout, PUSHED, output(result));
    assert.equal(await f.originTip(BRANCH), '');
    assert.equal(await f.originRefs(), before);
    const raced = await f.tip(f.clone);
    assert.deepEqual(await f.parents(raced, f.clone), [f.seed]);
    assert.equal(await f.tip(f.main), f.seed);
  });

  await t.test('refresh-branch.sh', async (t) => {
    const f = await fixture(t);
    await f.advanceTrunk('base.txt', 'base\n');
    const shim = await f.shim(' read-tree -n ', raceCommit(f));
    const result = await f.refresh([f.clone], shim.env);
    assert.ok(await shim.fired(), `the shim never ran\n${output(result)}`);
    assert.equal(result.status, 1, output(result));
    assert.match(result.stderr, /^refresh-branch\.sh: 'feat_c' moved while it was being refreshed, or its ref could not be locked/m, output(result));
    assert.doesNotMatch(result.stdout, MERGED, output(result));
    const raced = await f.tip(f.clone);
    assert.deepEqual(await f.parents(raced, f.clone), [f.seed]);
    assert.equal(await f.tip(f.main), f.seed);
    assert.equal(await exists(join(f.clone, 'base.txt')), false);
  });
});

test('(s) The next ordinary commit-on-branch.sh call heals a clone its ref left behind or ahead', async (t) => {
  await t.test('the clone behind, its ref moved back one commit by hand', async (t) => {
    const f = await fixture(t);
    await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
    const first = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
    assert.equal(first.status, 0, output(first));
    const c1 = await f.tip(f.main);
    await runGit(f.clone, ['update-ref', REF, f.seed, c1]);
    await writeFile(join(f.clone, 'notes.txt'), 'edited again\n');
    const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes again');
    assert.equal(result.status, 0, output(result));
    assert.match(result.stdout, COMMITTED, output(result));
    const c2 = await f.tip(f.main);
    assert.equal(await f.tip(f.clone), c2);
    assert.deepEqual(await f.parents(c2), [c1]);
  });

  await t.test('the clone ahead, after a main ref that could not follow', async (t) => {
    const f = await fixture(t);
    await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
    const shim = await swapFiveShim(f);
    const first = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes', shim.env);
    assert.ok(await shim.fired(), `the shim never ran\n${output(first)}`);
    assert.equal(first.status, 1, output(first));
    const c1 = await f.tip(f.clone);
    assert.equal(await f.tip(f.main), f.seed);
    await writeFile(join(f.clone, 'notes.txt'), 'edited again\n');
    const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes again');
    assert.equal(result.status, 0, output(result));
    assert.match(result.stdout, COMMITTED, output(result));
    const c2 = await f.tip(f.main);
    assert.equal(await f.tip(f.clone), c2);
    assert.deepEqual(await f.parents(c2), [c1]);
  });
});

// ---------------------------------------------------------------------------
// The worktree controls.
// ---------------------------------------------------------------------------

test('(p) Each wrapper gives a worktree the exit status and stdout line it gives the clone', async (t) => {
  await t.test('commit-on-branch.sh', async (t) => {
    const f = await fixture(t);
    await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
    await writeFile(join(f.wt, 'notes.txt'), 'edited\n');
    const onClone = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
    const onWt = await f.commit(f.wt, ['notes.txt'], 'chore: edit notes');
    assert.equal(onClone.status, 0, output(onClone));
    assert.deepEqual(shape(onWt, WT_BRANCH), shape(onClone, BRANCH), output(onWt));
  });

  await t.test('push-branch.sh', async (t) => {
    const f = await fixture(t);
    await f.commitInClone('a.txt', 'clone work\n');
    await runGit(f.wt, [...IDENTITY, 'commit', '--quiet', '--no-verify', '--allow-empty', '-m', 'wt: work']);
    const onClone = await f.push(f.clone);
    const onWt = await f.push(f.wt);
    assert.match(onClone.stdout, PUSHED, output(onClone));
    assert.deepEqual(shape(onWt, WT_BRANCH), shape(onClone, BRANCH), output(onWt));
    assert.equal(await f.originTip(WT_BRANCH), await f.tip(f.wt, 'HEAD'));
  });

  await t.test('refresh-branch.sh', async (t) => {
    const f = await fixture(t);
    await f.advanceTrunk('base.txt', 'base\n');
    const onClone = await f.refresh([f.clone]);
    const onWt = await f.refresh([f.wt]);
    assert.match(onClone.stdout, MERGED, output(onClone));
    assert.deepEqual(shape(onWt, WT_BRANCH), shape(onClone, BRANCH), output(onWt));
  });
});

test('(q) A worktree whose config.worktree sets core.sshCommand is still refused by all three wrappers', async (t) => {
  const f = await fixture(t);
  await runGit(f.wt, ['config', '--worktree', 'core.sshCommand', await f.marker('ssh')]);
  await writeFile(join(f.wt, 'notes.txt'), 'edited\n');
  const wtHead = await f.tip(f.wt, 'HEAD');
  const before = await f.originRefs();

  const committed = await f.commit(f.wt, ['notes.txt'], 'chore: edit notes');
  assert.equal(committed.status, 1, output(committed));
  assert.match(committed.stderr, COMMIT_REFUSED, output(committed));
  assert.match(committed.stderr, WT_CONFIG_REFUSED, output(committed));

  const pushed = await f.push(f.wt);
  assert.equal(pushed.status, 0, output(pushed));
  assert.match(pushed.stdout, PUSH_REFUSED, output(pushed));
  assert.match(pushed.stdout, WT_CONFIG_REFUSED, output(pushed));

  const refreshed = await f.refresh([f.wt]);
  assert.equal(refreshed.status, 1, output(refreshed));
  assert.match(refreshed.stderr, REFRESH_REFUSED, output(refreshed));
  assert.match(refreshed.stderr, WT_CONFIG_REFUSED, output(refreshed));

  assert.equal(await f.tip(f.wt, 'HEAD'), wtHead);
  assert.equal(await f.originRefs(), before);
  assert.deepEqual(await f.markers(), []);
});
