/**
 * `hr_clone_create_var`, `hr_clone_remove_var`, `hr_registry_drop` and `hr_registry_restore` in
 * `cli/templates/scripts/lib/harness-run-lib.sh`.
 *
 * **The rule these tests exist to enforce: a clone is created only for an unprotected branch with no
 * live run copy, recorded before any check reads it, with its objects borrowed and never hardlinked;
 * a failed creation leaves the main checkout, the registry and the filesystem as it found them; and
 * removal touches only a registered clone's derived path, never the main checkout and never through
 * a symbolic link.** The rollback cases hold `harness-runs/lessons.md` → *"A script that creates a
 * temporary working copy or branch removes it on every exit path, success and failure alike, and
 * never removes one it did not create."*
 *
 * Each case builds a main checkout carrying `harness.config.json`, a local bare origin and the
 * registry directory under the system temp directory, and sources the library from the template
 * tree; every clone lands at `hr_worktree_dir`, `<root>/main-<branch>`. A forced failure is a `git`
 * shim first on `PATH`, the technique `cli/test/wrapper-target-check.test.mjs` uses. The temp-tree
 * listing a refusal compares skips the contents of every `.git` directory and of the bare origin:
 * the surface check's trusted-base fetch writes `FETCH_HEAD`, which no ref listing sees. The check's
 * own refusals are `cli/test/clone-trust-check.test.mjs`'s, and sync is `cli/test/clone-sync.test.mjs`'s.
 *
 * RED ONCE — the rollback's `update-ref -d` of the cut branch skipped in `hr_clone_create_var`:
 * cases (h) and (j) fail. `hr_clone_remove_var`'s derived-path comparison deleted: the off-path
 * case in (m) fails. Every other case passes under each.
 */

import assert from 'node:assert/strict';
import { chmod, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const LIB = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');
const CONFIG = {
  version: 1,
  defaultBranch: 'trunk',
  protectedBranches: ['release/*'],
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const BRANCH = 'feat_c';
const REF = `refs/heads/${BRANCH}`;
const IDENTITY = ['-c', 'user.name=Harness Fixture', '-c', 'user.email=fixture@example.invalid'];
/** A record no case touches, so a rewrite of the registry shows in its bytes. */
const BYSTANDER = { other: { branch: 'other', worktree: '/nowhere/other', copy_kind: 'worktree', updated_at: '2026-01-01T00:00:00' } };

const exists = (path) =>
  lstat(path).then(
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

const CREATE = `hr_clone_create_var "$1" "$2" "$3"; s=$?
printf 'status=%s\\ndir=%s\\nrefusal=%s\\n' "$s" "$HR_CLONE_DIR" "$HR_CLONE_REFUSAL"`;
const REMOVE = `hr_clone_remove_var "$1" "$2"; s=$?
printf 'status=%s\\nrefusal=%s\\n' "$s" "$HR_CLONE_REFUSAL"`;
const CHECK = `hr_wrapper_target_check_var "$1" "$2"; s=$?
printf 'status=%s\\nkind=%s\\nrefusal=%s\\n' "$s" "$HR_TARGET_KIND" "$HR_TARGET_REFUSAL"`;

/** Every path under `dir`, not descending into a `.git` directory or a bare `*.git` one. */
async function listing(dir) {
  const out = [];
  const walk = async (d) => {
    for (const entry of (await readdir(d, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, entry.name);
      out.push(`${relative(dir, p)}${entry.isSymbolicLink() ? ' -> link' : entry.isDirectory() ? '/' : ''}`);
      if (entry.isDirectory() && !entry.isSymbolicLink() && !entry.name.endsWith('.git')) await walk(p);
    }
  };
  await walk(dir);
  return out.join('\n');
}

/**
 * A bare origin; a main checkout on `trunk` carrying `harness.config.json`, with its registry
 * directory made and the registry seeded with {@link BYSTANDER} in `jq`'s own layout.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'clone-create-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  await mkdir(origin);
  await mkdir(main);
  await runGit(origin, ['init', '--bare', '--quiet']);
  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await runGit(main, ['add', 'harness.config.json']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', 'origin', 'trunk']);
  await runGit(main, ['fetch', '--quiet', 'origin']);
  const logs = join(main, 'sdlc-harness', 'autonomous_logs');
  await mkdir(logs, { recursive: true });
  const registry = join(logs, 'registry.json');
  const writeRegistry = (runs) => writeFile(registry, `${JSON.stringify({ runs }, null, 2)}\n`);
  await writeRegistry(BYSTANDER);

  const f = {
    root,
    main,
    logs,
    registry,
    writeRegistry,
    derived: (branch = BRANCH) => join(root, `main-${branch.replaceAll('/', '-')}`),
    create: async (branch = BRANCH, start = 'trunk', env = {}) => globals(await lib(root, CREATE, [main, branch, start], env)),
    remove: async (dir) => globals(await lib(root, REMOVE, [main, dir])),
    check: async (dir) => globals(await lib(root, CHECK, [main, dir])),
    readRegistry: async () => JSON.parse(await readFile(registry, 'utf8')),
    mainRefs: async () => (await runGit(main, ['for-each-ref'])).stdout,
    tip: async (ref = REF, cwd = main) => (await runGit(cwd, ['rev-parse', '--verify', ref])).stdout.trim(),
    /** A commit on `ref` in the main checkout, made by plumbing with no checkout; returns its id. */
    commitOn: async (ref, path, content, parentRef = 'refs/heads/trunk') => {
      const parent = (await runGit(main, ['rev-parse', '--verify', parentRef])).stdout.trim();
      const blob = (await runBash(main, ['-c', 'printf "%s" "$1" | git hash-object -w --stdin', 'hr', content])).stdout.trim();
      const index = join(root, 'plumbing-index');
      const env = { GIT_INDEX_FILE: index };
      const step = async (args) => {
        const r = await runBash(main, ['-c', 'git "$@"', 'hr', ...args], env);
        assert.equal(r.status, 0, r.stderr);
        return r.stdout.trim();
      };
      await step(['read-tree', parent]);
      await step(['update-index', '--add', '--cacheinfo', `100644,${blob},${path}`]);
      const tree = await step(['write-tree']);
      await rm(index, { force: true });
      const oid = (await runGit(main, [...IDENTITY, 'commit-tree', tree, '-p', parent, '-m', `fixture: ${path}`])).stdout.trim();
      await runGit(main, ['update-ref', ref, oid]);
      return oid;
    },
    /** The registry bytes, the main checkout's refs and the temp tree's listing. */
    snapshot: async () => ({
      registry: (await exists(registry)) ? await readFile(registry, 'utf8') : null,
      refs: (await runGit(main, ['for-each-ref'])).stdout,
      tree: await listing(root),
    }),
  };
  return f;
}

/** Create the clone of {@link BRANCH} and return its path. */
async function created(f, branch = BRANCH) {
  const g = await f.create(branch);
  assert.equal(g.status, '0', g.refusal);
  assert.equal(g.dir, f.derived(branch));
  return g.dir;
}

/** Every regular file under `dir`, relative to it. */
async function files(dir) {
  const out = [];
  const walk = async (d) => {
    for (const entry of await readdir(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) await walk(p);
      else if (entry.isFile()) out.push(relative(dir, p));
    }
  };
  await walk(dir);
  return out.sort();
}

/**
 * Put a `git` shim first on `PATH`: a call whose arguments contain `trigger` runs `action` (a
 * shell fragment, with the real git as `$REAL`) instead of passing straight through.
 */
async function gitShim(f, trigger, action) {
  const real = (await runBash(f.root, ['-c', 'command -v git'])).stdout.trim();
  const bin = join(f.root, 'shim-bin');
  await mkdir(bin);
  const fired = join(f.root, 'shim-fired');
  await writeFile(
    join(bin, 'git'),
    `#!/bin/sh\nREAL='${real}'\ncase " $* " in *'${trigger}'*) : > '${fired}'; ${action} ;; esac\nexec "$REAL" "$@"\n`,
  );
  await chmod(join(bin, 'git'), 0o755);
  return {
    env: { PATH: `${bin}:${process.env.PATH}` },
    fired: () => exists(fired),
    /** Remove the shim and its marker, so the temp-tree listing compares what the library did. */
    clear: async () => {
      await rm(bin, { recursive: true, force: true });
      await rm(fired, { force: true });
    },
  };
}

// ---------------------------------------------------------------------------
// Creation's invariants.
// ---------------------------------------------------------------------------

test('(a) A created clone is shared, borrows every object, mirrors origin and is recorded', async (t) => {
  const f = await fixture(t);
  const startTip = await f.tip('refs/heads/trunk');
  const clone = await created(f);
  const gd = join(clone, '.git');

  const g = await f.check(clone);
  assert.deepEqual(g, { status: '0', kind: 'clone', refusal: '' });

  assert.equal(await readFile(join(gd, 'objects', 'info', 'alternates'), 'utf8'), `${join(f.main, '.git', 'objects')}\n`);
  const own = await files(join(gd, 'objects'));
  assert.deepEqual(own, [join('info', 'alternates')]);

  const mainInodes = new Set();
  for (const p of await files(join(f.main, '.git', 'objects'))) {
    const s = await lstat(join(f.main, '.git', 'objects', p));
    mainInodes.add(`${s.dev}:${s.ino}`);
  }
  for (const p of own) {
    const s = await lstat(join(gd, 'objects', p));
    assert.equal(mainInodes.has(`${s.dev}:${s.ino}`), false, `${p} shares an inode with the main checkout's object store`);
  }

  assert.equal((await runGit(clone, ['for-each-ref', '--format=%(refname)', 'refs/heads/'])).stdout, `${REF}\n`);
  assert.equal(await f.tip(REF, clone), startTip);
  assert.equal(await f.tip(REF), startTip);
  assert.equal((await runGit(clone, ['symbolic-ref', 'HEAD'])).stdout.trim(), REF);
  const remotes = async (cwd) =>
    (await runGit(cwd, ['for-each-ref', '--format=%(objectname) %(refname) %(symref)', 'refs/remotes/origin/'])).stdout;
  const mainRemotes = await remotes(f.main);
  assert.notEqual(mainRemotes, '');
  assert.equal(await remotes(clone), mainRemotes);
  const url = async (cwd) => (await runGit(cwd, ['config', '--get', 'remote.origin.url'])).stdout;
  assert.equal(await url(clone), await url(f.main));
  assert.equal((await runGit(clone, ['status', '--porcelain'])).stdout, '');

  const record = (await f.readRegistry()).runs[BRANCH];
  assert.equal(record.worktree, clone);
  assert.equal(record.copy_kind, 'clone');
  assert.deepEqual((await f.readRegistry()).runs.other, BYSTANDER.other);
});

test('(a2) An existing branch is cloned at its own tip, not at the start point', async (t) => {
  const f = await fixture(t);
  const own = await f.commitOn(REF, 'feature.txt', 'feature work\n');
  assert.notEqual(own, await f.tip('refs/heads/trunk'));
  const clone = await created(f);
  assert.equal(await f.tip(REF), own);
  assert.equal(await f.tip(REF, clone), own);
  assert.equal(await readFile(join(clone, 'feature.txt'), 'utf8'), 'feature work\n');
  assert.equal((await runGit(clone, ['status', '--porcelain'])).stdout, '');
});

// ---------------------------------------------------------------------------
// Refusals: the registry, the main checkout's refs and the temp tree byte-identical.
// ---------------------------------------------------------------------------

/** Call creation and assert it refused with `pattern`, changing nothing `snapshot` sees. */
async function assertRefused(f, pattern, branch = BRANCH) {
  const before = await f.snapshot();
  const g = await f.create(branch);
  assert.equal(g.status, '1', JSON.stringify(g));
  assert.equal(g.dir, '');
  assert.match(g.refusal, pattern);
  assert.deepEqual(await f.snapshot(), before);
}

test('(b) A branch the main configuration protects is refused', async (t) => {
  const f = await fixture(t);
  await assertRefused(f, /protects it$/, 'release/x');
});

test('(c) A missing autonomous_logs/ directory is refused, and creation does not make it', async (t) => {
  const f = await fixture(t);
  await rm(f.logs, { recursive: true });
  await assertRefused(f, /the run registry's directory .* does not exist$/);
  assert.equal(await exists(f.logs), false);
});

test('(d) A derived path that already exists, as a directory or as a symbolic link, is refused', async (t) => {
  const f = await fixture(t);
  await mkdir(f.derived());
  await writeFile(join(f.derived(), 'sentinel'), 'mine\n');
  await assertRefused(f, /already exists$/);
  assert.equal(await readFile(join(f.derived(), 'sentinel'), 'utf8'), 'mine\n');

  await rm(f.derived(), { recursive: true });
  const target = join(f.root, 'link-target');
  await mkdir(target);
  await symlink(target, f.derived());
  await assertRefused(f, /already exists$/);
  assert.equal(await exists(f.derived()), true);
});

test('(e) A registry record whose worktree exists is refused', async (t) => {
  const f = await fixture(t);
  const live = join(f.root, 'live-copy');
  await mkdir(live);
  await f.writeRegistry({ ...BYSTANDER, [BRANCH]: { branch: BRANCH, worktree: live, copy_kind: 'worktree', updated_at: '2026-01-01T00:00:00' } });
  await assertRefused(f, /the run registry records a run copy of it at .*, which exists$/);
});

test('(f) The branch checked out in the main checkout, or in a linked worktree, is refused', async (t) => {
  const f = await fixture(t);
  await runGit(f.main, ['checkout', '--quiet', '-b', BRANCH]);
  await assertRefused(f, /the main checkout .* has it checked out$/);

  await runGit(f.main, ['checkout', '--quiet', 'trunk']);
  await runGit(f.main, ['worktree', 'add', '--quiet', join(f.root, 'wt'), BRANCH]);
  await assertRefused(f, /a checkout of .* has it checked out$/);
});

test('(g) An existing branch whose tip changes a protected path is refused by the surface check', async (t) => {
  const f = await fixture(t);
  await f.commitOn(REF, 'githooks/pre-push', '#!/bin/sh\nexit 0\n');
  await assertRefused(f, /the protected-surface check of [0-9a-f]+ failed \(.*githooks\/pre-push.*\), and everything this call created was rolled back$/);
});

// ---------------------------------------------------------------------------
// Rollback: a failure after the record undoes exactly what the call created.
// ---------------------------------------------------------------------------

test('(h) The clone failing, with a new branch and no prior record: branch deleted, record dropped, no directory', async (t) => {
  const f = await fixture(t);
  const sentinel = join(f.root, 'sentinel-dir');
  await mkdir(sentinel);
  await runGit(f.main, ['branch', 'keep_me']);
  const before = await f.snapshot();
  const shim = await gitShim(f, ' clone --shared ', 'exit 1');
  const g = await f.create(BRANCH, 'trunk', shim.env);
  assert.ok(await shim.fired(), 'the shim never ran');
  assert.equal(g.status, '1');
  assert.match(g.refusal, /git clone --shared into .* failed, and everything this call created was rolled back$/);
  await shim.clear();
  assert.deepEqual(await f.snapshot(), before);
  assert.equal(await exists(f.derived()), false);
  assert.equal(await exists(sentinel), true);
});

test('(i) Population failing, with an existing branch and a prior record: branch untouched, record restored, directory removed', async (t) => {
  const f = await fixture(t);
  const own = await f.commitOn(REF, 'feature.txt', 'feature work\n');
  const stale = join(f.root, 'gone-copy');
  await f.writeRegistry({ ...BYSTANDER, [BRANCH]: { branch: BRANCH, worktree: stale, copy_kind: 'worktree', updated_at: '2026-01-01T00:00:00' } });
  const shim = await gitShim(f, ' read-tree --reset -u ', 'exit 1');
  const refsBefore = await f.mainRefs();
  const g = await f.create(BRANCH, 'trunk', shim.env);
  assert.ok(await shim.fired(), 'the shim never ran');
  assert.equal(g.status, '1');
  assert.match(g.refusal, /populating .* failed, and everything this call created was rolled back$/);
  assert.equal(await f.tip(REF), own);
  assert.equal(await f.mainRefs(), refsBefore);
  const doc = await f.readRegistry();
  assert.equal(doc.runs[BRANCH].worktree, stale);
  assert.equal(doc.runs[BRANCH].copy_kind, 'worktree');
  assert.deepEqual(doc.runs.other, BYSTANDER.other);
  assert.equal(await exists(f.derived()), false);
});

test('(i2) Population failing, with a prior record carrying no copy_kind: the record restored byte for byte', async (t) => {
  const f = await fixture(t);
  await f.commitOn(REF, 'feature.txt', 'feature work\n');
  const seeded = { branch: BRANCH, worktree: join(f.root, 'gone-copy'), status: 'completed', updated_at: '2026-01-01T00:00:00' };
  await f.writeRegistry({ ...BYSTANDER, [BRANCH]: seeded });
  const shim = await gitShim(f, ' read-tree --reset -u ', 'exit 1');
  const g = await f.create(BRANCH, 'trunk', shim.env);
  assert.ok(await shim.fired(), 'the shim never ran');
  assert.equal(g.status, '1');
  assert.match(g.refusal, /populating .* failed, and everything this call created was rolled back$/);
  const doc = await f.readRegistry();
  assert.deepEqual(doc.runs[BRANCH], seeded);
  assert.deepEqual(doc.runs.other, BYSTANDER.other);
  assert.equal(await exists(f.derived()), false);
});

test('(j) The final target check failing: the same full rollback', async (t) => {
  const f = await fixture(t);
  const sentinel = join(f.root, 'sentinel-dir');
  await mkdir(sentinel);
  // Populate for real, then plant a `commondir` the target check refuses.
  const before = await f.snapshot();
  const shim = await gitShim(f, ' read-tree --reset -u ', '"$REAL" "$@" || exit $?; : > "$2/.git/commondir"; exit 0');
  const g = await f.create(BRANCH, 'trunk', shim.env);
  assert.ok(await shim.fired(), 'the shim never ran');
  assert.equal(g.status, '1');
  assert.match(g.refusal, /the trust check of the finished clone failed \(.*commondir exists.*\), and everything this call created was rolled back$/);
  await shim.clear();
  assert.deepEqual(await f.snapshot(), before);
  assert.equal(await exists(f.derived()), false);
  assert.equal(await exists(sentinel), true);
});

// ---------------------------------------------------------------------------
// Removal.
// ---------------------------------------------------------------------------

test('(k) A registered clone is removed; the registry and the branch are unchanged', async (t) => {
  const f = await fixture(t);
  const clone = await created(f);
  const registry = await readFile(f.registry, 'utf8');
  const refs = await f.mainRefs();
  assert.deepEqual(await f.remove(clone), { status: '0', refusal: '' });
  assert.equal(await exists(clone), false);
  assert.equal(await readFile(f.registry, 'utf8'), registry);
  assert.equal(await f.mainRefs(), refs);
});

test('(l) A clone whose .git/config gained core.fsmonitor is still removed, and the monitor never runs', async (t) => {
  const f = await fixture(t);
  const clone = await created(f);
  const marker = join(f.root, 'fsmonitor-ran');
  const monitor = join(f.root, 'fsmonitor.sh');
  await writeFile(monitor, `#!/bin/sh\n: > '${marker}'\n`);
  await chmod(monitor, 0o755);
  await runGit(f.root, ['config', '--file', join(clone, '.git', 'config'), 'core.fsmonitor', monitor]);
  assert.deepEqual(await f.remove(clone), { status: '0', refusal: '' });
  assert.equal(await exists(clone), false);
  assert.equal(await exists(marker), false);
});

test('(m) Removal refuses every path but a registered clone’s derived one, removing nothing', async (t) => {
  /** Refused, with `victim/sentinel` still present. */
  const refused = async (f, dir, victim, pattern) => {
    await writeFile(join(victim, 'sentinel'), 'mine\n');
    const g = await f.remove(dir);
    assert.equal(g.status, '1', JSON.stringify(g));
    assert.match(g.refusal, pattern);
    assert.equal(await readFile(join(victim, 'sentinel'), 'utf8'), 'mine\n');
  };

  await t.test('the main checkout passed as <dir>', async (t) => {
    const f = await fixture(t);
    await refused(f, f.main, f.main, /it is the main checkout/);
  });

  await t.test('a scratch directory at another branch’s derived path with no record', async (t) => {
    const f = await fixture(t);
    const scratch = f.derived('feat_other');
    await mkdir(join(scratch, '.git'), { recursive: true });
    await refused(f, scratch, scratch, /0 run registry records name a clone at .*, not exactly one$/);
  });

  await t.test('a clone whose .git was replaced by a symbolic link', async (t) => {
    const f = await fixture(t);
    const clone = await created(f);
    const moved = join(f.root, 'moved-git');
    await rename(join(clone, '.git'), moved);
    await symlink(moved, join(clone, '.git'));
    await refused(f, clone, clone, /is a symbolic link/);
    await refused(f, clone, moved, /is a symbolic link/);
  });

  await t.test('<dir> itself a symbolic link to the clone', async (t) => {
    const f = await fixture(t);
    const clone = await created(f);
    const link = join(f.root, 'clone-link');
    await symlink(clone, link);
    await refused(f, link, clone, /is a symbolic link/);
  });

  await t.test('a record whose worktree names a path other than the derived one', async (t) => {
    const f = await fixture(t);
    const clone = await created(f);
    const offPath = join(f.root, 'off-path-clone');
    await rename(clone, offPath);
    const doc = await f.readRegistry();
    doc.runs[BRANCH].worktree = offPath;
    await f.writeRegistry(doc.runs);
    await refused(f, offPath, offPath, /it is not the path hr_worktree_dir derives from .* for the branch 'feat_c' its record names$/);
  });
});
