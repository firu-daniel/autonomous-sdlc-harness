/**
 * The watcher family's git on a clone, in `cli/templates/scripts/lib/harness-run-lib.sh`: the copy
 * check (`hr_run_copy_check_var`), the artifact commit (`hr_commit_placed`, `hr_commit_paths_var`), the
 * fast-forward (`hr_run_fast_forward_var`), the watchdog's reset (`hr_run_reset_var`) and the surface
 * check under them.
 *
 * **The rule these tests exist to enforce: on a clone, the watcher family's git runs under the same
 * pins as on a worktree — no hook, no fsmonitor, no submodule recursion, history as stored, and
 * `refs/heads/<branch>` named — reads objects from the main checkout alone, syncs the run's ref in at
 * the copy check and heals a clone behind the main checkout there, moves the clone's ref before the
 * main checkout's for every ref it moves, and refuses a protected-path change exactly as on a
 * worktree.**
 *
 * Each case builds, under the system temp directory, a main checkout carrying a hand-written
 * `harness.config.json` (`githooksDir` `githooks`) and its `autonomous_logs/` directory, a local bare
 * origin standing in for the network `hr_run_trusted_base_var` asks, whose default branch carries a
 * committed `githooks/pre-push`, and the clone `hr_clone_create_var` makes at `hr_worktree_dir`. The
 * library is sourced from the template tree through `runBash`. A ref moved under a call is a `git`
 * shim first on `PATH`, the technique `cli/test/wrapper-target-check.test.mjs` uses: it moves the
 * clone's ref just before the operation's first `update-ref`, which on a clone is the clone's own
 * swap, so the operation refuses with nothing moved. A substituted object is planted by the method
 * `docs/cli.md` §6 residual 1, item 5 describes. Sync in isolation is
 * `cli/test/clone-sync.test.mjs`'s, the clone-first order under every race
 * `cli/test/clone-ref-order.test.mjs`'s, and the wrappers on a clone are another suite's.
 *
 * RED ONCE — `hr_run_copy_git`'s `GIT_DIR` pointed at `$HR_RUN_COPY_GITDIR` when the kind is `clone`:
 * case (h) fails. The clone's swap removed from `hr_copy_ref_swap_var`'s clone arm: case (e) fails on
 * the clone's own ref.
 */

import assert from 'node:assert/strict';
import { access, chmod, copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const LIB = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');
const CONFIG = {
  version: 1,
  defaultBranch: 'trunk',
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const BRANCH = 'feat_c';
const REF = `refs/heads/${BRANCH}`;
const ORIGIN_REF = `refs/remotes/origin/${BRANCH}`;
const IDENTITY = ['-c', 'user.name=Harness Fixture', '-c', 'user.email=fixture@example.invalid'];
const PRE_PUSH = '#!/bin/sh\nexit 0\n';
const NOTES = 'seeded notes\n';

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

/** Parse the `name=value` lines a library call prints; a value may hold `=`. */
function globals(result) {
  assert.equal(result.stderr, '', result.stderr);
  const out = {};
  for (const line of result.stdout.split('\n')) {
    const at = line.indexOf('=');
    if (at > 0) out[line.slice(0, at)] = line.slice(at + 1);
  }
  return out;
}

/** Run `body` with the library sourced; `$1`… are `args`. */
function lib(cwd, body, args, env = {}) {
  return runBash(cwd, ['-c', `. "$1" || exit 99; shift; ${body}`, 'hr', LIB, ...args], env);
}

/** The copy check, then `hr_run_copy_clean` when it passed. `$1` main, `$2` copy. */
const CHECK = `hr_run_copy_check_var "$1" "$2"; s=$?; c=-
if [ "$s" -eq 0 ]; then hr_run_copy_clean; c=$?; fi
printf 'status=%s\\nkind=%s\\ntip=%s\\nclean=%s\\nrefusal=%s\\n' "$s" "$HR_RUN_COPY_KIND" "$HR_RUN_COPY_TIP" "$c" "$HR_RUN_REFUSAL"`;
/** The copy check, then the fast-forward to `$3`. */
const FAST_FORWARD = `if ! hr_run_copy_check_var "$1" "$2"; then printf 'status=check\\nrefusal=%s\\n' "$HR_RUN_REFUSAL"; exit 0; fi
hr_run_fast_forward_var "$3"; s=$?
printf 'status=%s\\ntip=%s\\nrefusal=%s\\n' "$s" "$HR_RUN_COPY_TIP" "$HR_RUN_FF_REFUSAL"`;
/** The copy check, then the watchdog's reset. */
const RESET = `if ! hr_run_copy_check_var "$1" "$2"; then printf 'status=check\\nrefusal=%s\\n' "$HR_RUN_REFUSAL"; exit 0; fi
hr_run_reset_var; s=$?
printf 'status=%s\\nrefusal=%s\\n' "$s" "$HR_RUN_RESET_REFUSAL"`;
/** The copy check, then `hr_commit_paths_var` of `$3` on the checked copy. */
const COMMIT_PATHS = `if ! hr_run_copy_check_var "$1" "$2"; then printf 'status=check\\nrefusal=%s\\n' "$HR_RUN_REFUSAL"; exit 0; fi
hr_commit_paths_var "$1" "$HR_RUN_COPY_TOP" "$HR_RUN_COPY_GITDIR" "$HR_RUN_COPY_BRANCH" "$HR_RUN_COPY_TIP" 100644 committed "fixture: $3" "$3" -- "fixture: $3"; s=$?
printf 'status=%s\\nnew=%s\\nsyncfailed=%s\\nrefusal=%s\\n' "$s" "$HR_COMMIT_NEW" "$HR_COMMIT_SYNC_FAILED" "$HR_COMMIT_REFUSAL"`;
const PLACED = `hr_commit_placed "$1" "$2" "$3" "$4"; printf 'status=%s\\n' "$?"`;

/** The loose object file of `oid` under the objects directory `objects`. */
const loose = (objects, oid) => join(objects, oid.slice(0, 2), oid.slice(2));

/**
 * A bare origin whose `trunk` carries `githooks/pre-push`; a main checkout on `trunk` carrying
 * `harness.config.json` and `autonomous_logs/`; and the clone of {@link BRANCH} at `<root>/main-feat_c`.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'run-copy-clone-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  await mkdir(origin);
  await mkdir(join(main, 'githooks'), { recursive: true });
  await runGit(origin, ['init', '--bare', '--quiet', '-b', 'trunk']);
  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await writeFile(join(main, 'githooks', 'pre-push'), PRE_PUSH);
  await writeFile(join(main, 'notes.txt'), NOTES);
  await runGit(main, ['add', 'harness.config.json', 'githooks/pre-push', 'notes.txt']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', 'origin', 'trunk']);
  await runGit(main, ['fetch', '--quiet', 'origin']);
  await mkdir(join(main, 'sdlc-harness', 'autonomous_logs'), { recursive: true });

  const created = globals(
    await lib(
      root,
      `hr_clone_create_var "$1" "$2" trunk; s=$?; printf 'status=%s\\ndir=%s\\nrefusal=%s\\n' "$s" "$HR_CLONE_DIR" "$HR_CLONE_REFUSAL"`,
      [main, BRANCH],
    ),
  );
  assert.equal(created.status, '0', created.refusal);
  const clone = join(root, `main-${BRANCH}`);
  assert.equal(created.dir, clone);
  const gitdir = join(clone, '.git');

  const f = {
    root,
    main,
    clone,
    gitdir,
    check: async (env = {}) => globals(await lib(root, CHECK, [main, clone], env)),
    fastForward: async (ref = ORIGIN_REF) => globals(await lib(root, FAST_FORWARD, [main, clone, ref])),
    reset: async () => globals(await lib(root, RESET, [main, clone])),
    commitPaths: async (rel, env = {}) => globals(await lib(root, COMMIT_PATHS, [main, clone, rel], env)),
    placed: (rel, subject) => lib(root, PLACED, [main, clone, rel, subject]),
    mainTip: async (ref = REF) => (await runGit(main, ['rev-parse', '--verify', ref])).stdout.trim(),
    cloneTip: async (ref = REF) => (await runGit(clone, ['rev-parse', '--verify', ref])).stdout.trim(),
    cloneStatus: async () => (await runGit(clone, ['status', '--porcelain'])).stdout,
    /** A commit made in the clone with plain `git commit`; returns its id. */
    commitInClone: async (name, content) => {
      await writeFile(join(clone, name), content);
      await runGit(clone, ['add', name]);
      await runGit(clone, [...IDENTITY, 'commit', '--quiet', '-m', `clone: ${name}`]);
      return (await runGit(clone, ['rev-parse', 'HEAD'])).stdout.trim();
    },
    /**
     * Give origin's {@link BRANCH} a commit on the main checkout's {@link REF} setting `path` to
     * `content`, made by plumbing in the main checkout, and fetch it to {@link ORIGIN_REF} there.
     * The main checkout's {@link REF} does not move. Returns the commit and the blob.
     */
    originGains: async (path, content) => {
      const parent = await f.mainTip();
      const blob = (await runBash(main, ['-c', 'printf "%s" "$1" | git hash-object -w --stdin', 'hr', content])).stdout.trim();
      const index = join(root, 'plumbing-index');
      const step = async (args) => {
        const r = await runBash(main, ['-c', 'git "$@"', 'hr', ...args], { GIT_INDEX_FILE: index });
        assert.equal(r.status, 0, r.stderr);
        return r.stdout.trim();
      };
      await step(['read-tree', parent]);
      await step(['update-index', '--add', '--cacheinfo', `100644,${blob},${path}`]);
      const tree = await step(['write-tree']);
      await rm(index, { force: true });
      const oid = (await runGit(main, [...IDENTITY, 'commit-tree', tree, '-p', parent, '-m', `origin: ${path}`])).stdout.trim();
      await runGit(main, ['push', '--quiet', 'origin', `${oid}:${REF}`]);
      await runGit(main, ['fetch', '--quiet', 'origin']);
      assert.equal(await f.mainTip(ORIGIN_REF), oid);
      return { oid, blob };
    },
  };
  return f;
}

/**
 * Put a `git` shim first on `PATH`: a call whose arguments contain `trigger` runs `before` and then
 * the real git (`$REAL`).
 */
async function gitShim(f, trigger, before) {
  const real = (await runBash(f.root, ['-c', 'command -v git'])).stdout.trim();
  const bin = join(f.root, 'shim-bin');
  await mkdir(bin);
  const fired = join(f.root, 'shim-fired');
  await writeFile(
    join(bin, 'git'),
    `#!/bin/sh\nREAL='${real}'\ncase " $* " in *'${trigger}'*) : > '${fired}'; ${before} ;; esac\nexec "$REAL" "$@"\n`,
  );
  await chmod(join(bin, 'git'), 0o755);
  return { env: { PATH: `${bin}:${process.env.PATH}` }, fired: () => exists(fired) };
}

// ---------------------------------------------------------------------------
// The copy check.
// ---------------------------------------------------------------------------

test('(a) The copy check on a clone syncs a plain clone commit in and reads clean', async (t) => {
  const f = await fixture(t);
  const commit = await f.commitInClone('a.txt', 'clone work\n');
  assert.notEqual(await f.mainTip(), commit);
  const g = await f.check();
  assert.deepEqual(g, { status: '0', kind: 'clone', tip: commit, clean: '0', refusal: '' });
  assert.equal(await f.mainTip(), commit);
});

test('(b) The copy check refuses a branch the main checkout has checked out, and heals a clone behind it', async (t) => {
  await t.test('checked out in the main checkout', async (t) => {
    const f = await fixture(t);
    const before = await f.mainTip();
    await runGit(f.main, ['checkout', '--quiet', BRANCH]);
    const g = await f.check();
    assert.equal(g.status, '1', JSON.stringify(g));
    assert.match(g.refusal, /has it checked out$/);
    assert.equal(await f.mainTip(), before);
  });

  await t.test('the clone rewound behind the main checkout is healed', async (t) => {
    const f = await fixture(t);
    const parent = await f.cloneTip();
    const commit = await f.commitInClone('a.txt', 'clone work\n');
    assert.equal((await f.check()).status, '0');
    assert.equal(await f.mainTip(), commit);
    await runGit(f.clone, ['update-ref', REF, parent, commit]);
    const g = await f.check();
    assert.equal(g.status, '0', JSON.stringify(g));
    assert.equal(g.tip, commit);
    assert.equal(await f.mainTip(), commit);
    assert.equal(await f.cloneTip(), commit);
  });
});

// ---------------------------------------------------------------------------
// The artifact commit.
// ---------------------------------------------------------------------------

test('(c) The artifact commit on a clone moves both refs, leaves the clone clean and runs no hook', async (t) => {
  const f = await fixture(t);
  const hooks = join(f.clone, 'githooks');
  const markers = join(f.root, 'markers');
  await mkdir(markers);
  for (const name of ['pre-commit', 'reference-transaction']) {
    await writeFile(join(hooks, name), `#!/bin/sh\n: > '${join(markers, name)}'\nexit 0\n`);
    await chmod(join(hooks, name), 0o755);
  }
  await runGit(f.root, ['config', '--file', join(f.gitdir, 'config'), 'core.hooksPath', hooks]);
  // Control: an unpinned ref move in the clone does run the configured hook.
  await runGit(f.clone, ['update-ref', 'refs/probe/x', 'HEAD']);
  await runGit(f.clone, ['update-ref', '-d', 'refs/probe/x']);
  assert.ok(await exists(join(markers, 'reference-transaction')), 'the control hook never ran');
  await rm(join(markers, 'reference-transaction'));

  const rel = join('sdlc-harness', 'reviews', 'r.md');
  await mkdir(dirname(join(f.clone, rel)), { recursive: true });
  await writeFile(join(f.clone, rel), 'review\n');
  const before = await f.mainTip();
  const r = await f.placed(rel, 'chore: add review');
  assert.equal(r.stderr, '', r.stderr);
  const [line, status] = r.stdout.trim().split('\n');
  assert.equal(status, 'status=0');
  const m = line.match(/^committed ([0-9a-f]+) on feat_c$/);
  assert.ok(m, line);
  const commit = await f.mainTip();
  assert.notEqual(commit, before);
  assert.ok(commit.startsWith(m[1]));
  assert.equal(await f.cloneTip(), commit);
  assert.equal((await runGit(f.main, ['rev-parse', `${commit}^`])).stdout.trim(), before);
  assert.equal(await exists(join(markers, 'pre-commit')), false);
  assert.equal(await exists(join(markers, 'reference-transaction')), false);

  await rm(join(hooks, 'pre-commit'));
  await rm(join(hooks, 'reference-transaction'));
  assert.equal(await f.cloneStatus(), '');

  await t.test('(c2) a second identical drop exits 3', async () => {
    const again = await f.placed(rel, 'chore: add review');
    assert.equal(again.stdout, 'status=3\n');
    assert.equal(await f.mainTip(), commit);
    assert.equal(await f.cloneTip(), commit);
  });
});

test('(d) A clone ref moved off the synced-in tip before the commit’s first update-ref returns 4 with nothing moved on either side', async (t) => {
  const f = await fixture(t);
  const before = await f.mainTip();
  const parent = await f.commitInClone('a.txt', 'clone work\n');
  assert.equal((await f.check()).status, '0');
  assert.equal(await f.mainTip(), parent);
  await writeFile(join(f.clone, 'b.txt'), 'artifact\n');
  // Ahead of the clone's own swap, move the clone's ref off the tip that swap expects.
  const shim = await gitShim(f, ' update-ref ', `"$REAL" -c advice.graftFileDeprecated=false --git-dir='${f.gitdir}' update-ref '${REF}' '${before}'`);
  const g = await f.commitPaths('b.txt', shim.env);
  assert.ok(await shim.fired(), 'the shim never ran');
  assert.equal(g.status, '4', JSON.stringify(g));
  assert.equal(g.new, '');
  assert.equal(g.syncfailed, '');
  assert.equal(await f.mainTip(), parent);
  assert.equal(await f.cloneTip(), before);
});

// ---------------------------------------------------------------------------
// The fast-forward, the reset and the surface check.
// ---------------------------------------------------------------------------

test('(e) The fast-forward on a clone moves the clone’s ref, index and tree and the main checkout’s ref', async (t) => {
  const f = await fixture(t);
  const { oid } = await f.originGains('e.txt', 'from origin\n');
  const g = await f.fastForward();
  assert.deepEqual(g, { status: '0', tip: oid, refusal: '' });
  assert.equal(await f.mainTip(), oid);
  assert.equal(await f.cloneTip(), oid);
  assert.equal((await runGit(f.clone, ['rev-parse', 'HEAD'])).stdout.trim(), oid);
  assert.equal(await readFile(join(f.clone, 'e.txt'), 'utf8'), 'from origin\n');
  assert.equal(await f.cloneStatus(), '');
});

test('(f) A target commit that changes githooks/pre-push is refused, and nothing moves', async (t) => {
  const f = await fixture(t);
  const before = await f.mainTip();
  await f.originGains('githooks/pre-push', '#!/bin/sh\necho changed\n');
  const g = await f.fastForward();
  assert.equal(g.status, '1', JSON.stringify(g));
  assert.match(g.refusal, /protected surface differs .*githooks\/pre-push/);
  assert.equal(await f.mainTip(), before);
  assert.equal(await f.cloneTip(), before);
  assert.equal(await readFile(join(f.clone, 'githooks', 'pre-push'), 'utf8'), PRE_PUSH);
  assert.equal(await f.cloneStatus(), '');
});

test('(g) The reset restores a tracked file, and refuses a changed githooks/pre-push, skip-worktree included', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.clone, 'notes.txt'), 'changed by the run\n');
  assert.deepEqual(await f.reset(), { status: '0', refusal: '' });
  assert.equal(await readFile(join(f.clone, 'notes.txt'), 'utf8'), NOTES);
  assert.equal(await f.cloneStatus(), '');

  const hook = join(f.clone, 'githooks', 'pre-push');
  const changed = '#!/bin/sh\necho changed by the run\n';
  await writeFile(hook, changed);
  const g = await f.reset();
  assert.equal(g.status, '1', JSON.stringify(g));
  assert.match(g.refusal, /githooks\/pre-push/);
  assert.equal(await readFile(hook, 'utf8'), changed);

  await runGit(f.clone, ['update-index', '--skip-worktree', 'githooks/pre-push']);
  assert.equal((await runGit(f.clone, ['status', '--porcelain'])).stdout, '');
  const skipped = await f.reset();
  assert.equal(skipped.status, '1', JSON.stringify(skipped));
  assert.match(skipped.refusal, /githooks\/pre-push/);
  assert.equal(await readFile(hook, 'utf8'), changed);
});

// ---------------------------------------------------------------------------
// Objects come from the main checkout only.
// ---------------------------------------------------------------------------

test('(h) A substituted loose object in the clone’s store never reaches its working tree', async (t) => {
  const f = await fixture(t);
  const objects = join(f.gitdir, 'objects');
  const truth = 'the true bytes\n';
  const { oid, blob: named } = await f.originGains('h.txt', truth);
  const decoy = (await runBash(f.clone, ['-c', 'printf "%s" "$1" | git hash-object -w --stdin', 'hr', 'substituted bytes\n'])).stdout.trim();
  assert.equal(await exists(loose(objects, decoy)), true);
  assert.equal(await exists(loose(objects, named)), false);
  await mkdir(dirname(loose(objects, named)), { recursive: true });
  await copyFile(loose(objects, decoy), loose(objects, named));
  // Control: read through the clone's own store, the name yields the substituted bytes.
  assert.equal((await runGit(f.clone, ['cat-file', '-p', named])).stdout, 'substituted bytes\n');

  const g = await f.fastForward();
  assert.deepEqual(g, { status: '0', tip: oid, refusal: '' });
  assert.equal(await readFile(join(f.clone, 'h.txt'), 'utf8'), truth);
  assert.equal((await runGit(f.clone, ['hash-object', 'h.txt'])).stdout.trim(), named);
  const fsck = await runBash(f.main, ['-c', 'git fsck --full 2>&1']);
  assert.doesNotMatch(fsck.stdout, /hash-path mismatch/);
});
