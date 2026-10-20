/**
 * `hr_copy_sync_in_var` and `hr_copy_sync_out_var` in `cli/templates/scripts/lib/harness-run-lib.sh`.
 *
 * **The rule these tests exist to enforce: a clone's objects enter the main checkout only through
 * sync-in's fetch, which hashes what it indexes, so a substituted object is rejected and the main
 * checkout's refs are left as they were; sync-in fast-forwards a clone strictly behind the main
 * checkout to the main checkout's tip, and refuses a diverged one with neither ref moved; sync-in
 * never moves a branch the main checkout or one of its worktrees has checked out; and both halves are
 * no-ops for a worktree and for the main checkout.**
 *
 * RED ONCE — the library at `git merge-base HEAD origin/dev` (the revision before this branch's heal),
 * copied into a temp fixture: case (c) fails, sync-in refusing the behind clone. Every other case
 * passes under it.
 *
 * MEASURED ANSWERS, git 2.50.1 (Apple Git-155). Sync-in's local-transport fetch honours none of the
 * clone's own configuration keys measured here, and runs no hook, filter or fsmonitor in the clone:
 * - (m-fsmonitor) `core.fsmonitor`: no marker; sync-in synced.
 * - (m-packobjectshook) `uploadpack.packObjectsHook`: no marker; sync-in synced.
 * - (m-hookspath) `core.hooksPath` naming `pre-upload-pack`, `reference-transaction` and
 *   `post-checkout`: no marker; sync-in synced.
 * - (m-filter) a `filter.x.clean`/`smudge` pair with a committed `* filter=x` `.gitattributes`: no
 *   marker; sync-in synced.
 * - (m-sshcommand) `core.sshCommand`: no marker; sync-in synced.
 * - (m-shallow) a planted `.git/shallow` naming the clone's tip: the fetch was not refused, sync-in
 *   synced, the main checkout gained no `shallow` file, and `rev-list --count` of its old tip read
 *   the same before and after, and of its new tip one more.
 * - (m-grafts) a planted `.git/info/grafts` making the clone's tip a root: the same outcome.
 * - (s) the substituted loose object: the fetch failed, sync-in returned 1, the main checkout's refs
 *   and reflogs were unchanged, `cat-file -e` of the substituted name failed in the main checkout, and
 *   its `fsck --full` reported no hash-path mismatch.
 * The same payloads, each shown to fire inside the repository it was planted in, fired on none of an
 * unpinned plain `git fetch <clone> <ref>` either, so the answers above are git's local transport
 * and not only Task 2's pins.
 *
 * The record of the measurement is `docs/cli.md` §6, transcribed from this header.
 *
 * Each case builds a main checkout with `harness.config.json`, `autonomous_logs/` and a local bare
 * origin, plus the clone `hr_clone_create_var` makes, under the system temp directory, and sources
 * the library from the template tree. The trust check's own suite is
 * `cli/test/clone-trust-check.test.mjs`; the payload cases call sync-in without it on purpose.
 */

import assert from 'node:assert/strict';
import { access, chmod, copyFile, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
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
const IDENTITY = ['-c', 'user.name=Harness Fixture', '-c', 'user.email=fixture@example.invalid'];

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
function lib(cwd, body, ...args) {
  return runBash(cwd, ['-c', `. "$1" || exit 99; shift; ${body}`, 'hr', LIB, ...args]);
}

const SYNC_IN = `hr_copy_sync_in_var "$1" "$2" "$3"; s=$?
printf 'status=%s\\ntip=%s\\nrefusal=%s\\n' "$s" "$HR_SYNC_TIP" "$HR_SYNC_REFUSAL"`;
const SYNC_OUT = `if [ "$#" -ge 4 ]; then hr_copy_sync_out_var "$1" "$2" "$3" "$4"; else hr_copy_sync_out_var "$1" "$2" "$3"; fi; s=$?
printf 'status=%s\\nrefusal=%s\\n' "$s" "$HR_SYNC_REFUSAL"`;

/**
 * A bare origin; a main checkout on `trunk` carrying `harness.config.json`, with its registry
 * directory made; and the clone of {@link BRANCH} `hr_clone_create_var` makes at `<root>/main-feat_c`.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'clone-sync-')));
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
  await mkdir(join(main, 'sdlc-harness', 'autonomous_logs'), { recursive: true });

  const created = globals(
    await lib(
      root,
      `hr_clone_create_var "$1" "$2" trunk; s=$?; printf 'status=%s\\ndir=%s\\nrefusal=%s\\n' "$s" "$HR_CLONE_DIR" "$HR_CLONE_REFUSAL"`,
      main,
      BRANCH,
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
    syncIn: async (target = gitdir) => globals(await lib(root, SYNC_IN, main, target, BRANCH)),
    syncOut: async (ref, ...old) => globals(await lib(root, SYNC_OUT, main, gitdir, ref, ...old)),
    mainTip: async (ref = REF) => (await runGit(main, ['rev-parse', '--verify', ref])).stdout.trim(),
    cloneTip: async (ref = REF) => (await runGit(clone, ['rev-parse', '--verify', ref])).stdout.trim(),
    /** A commit made in the clone with plain `git commit`; returns its id. */
    commitInClone: async (name, content) => {
      await writeFile(join(clone, name), content);
      await runGit(clone, ['add', name]);
      await runGit(clone, [...IDENTITY, 'commit', '--quiet', '-m', `clone: ${name}`]);
      return (await runGit(clone, ['rev-parse', 'HEAD'])).stdout.trim();
    },
    /** A commit on the main checkout's `ref` made by plumbing, with no checkout; returns its id. */
    advanceMain: async (message, ref = REF) => {
      const parent = (await runGit(main, ['rev-parse', '--verify', ref])).stdout.trim();
      const oid = (await runGit(main, [...IDENTITY, 'commit-tree', `${parent}^{tree}`, '-p', parent, '-m', message])).stdout.trim();
      await runGit(main, ['update-ref', ref, oid, parent]);
      return oid;
    },
    /** The main checkout's refs and the two reflogs a ref move would append to. */
    mainSnapshot: async () => {
      const read = async (p) => ((await exists(p)) ? readFile(p, 'utf8') : null);
      return {
        refs: (await runGit(main, ['for-each-ref'])).stdout,
        head: (await runGit(main, ['symbolic-ref', '-q', 'HEAD'])).stdout,
        branchLog: await read(join(main, '.git', 'logs', 'refs', 'heads', BRANCH)),
        headLog: await read(join(main, '.git', 'logs', 'HEAD')),
      };
    },
    cloneRefs: async () => (await runGit(clone, ['for-each-ref'])).stdout,
  };
  return f;
}

/** The loose object file of `oid` under the objects directory `objects`. */
const loose = (objects, oid) => join(objects, oid.slice(0, 2), oid.slice(2));

test('(a) A commit made in the clone is synced in: the main checkout’s branch and HR_SYNC_TIP name it', async (t) => {
  const f = await fixture(t);
  const commit = await f.commitInClone('a.txt', 'clone work\n');
  const g = await f.syncIn();
  assert.deepEqual(g, { status: '0', tip: commit, refusal: '' });
  assert.equal(await f.mainTip(), commit);
});

test('(a-disk) After a sync-in the clone’s object store holds only info/ and its own loose objects', async (t) => {
  const f = await fixture(t);
  const commit = await f.commitInClone('a.txt', 'clone work\n');
  const tree = (await runGit(f.clone, ['rev-parse', `${commit}^{tree}`])).stdout.trim();
  const blob = (await runGit(f.clone, ['rev-parse', `${commit}:a.txt`])).stdout.trim();
  assert.equal((await f.syncIn()).status, '0');

  const objects = join(f.gitdir, 'objects');
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) await walk(p);
      else files.push(relative(objects, p));
    }
  };
  await walk(objects);
  const own = [commit, tree, blob].map((oid) => `${oid.slice(0, 2)}/${oid.slice(2)}`).sort();
  assert.deepEqual(files.filter((p) => !p.startsWith('info/')).sort(), own);
  assert.ok(files.includes('info/alternates'), files.join('\n'));
});

test('(b) Equal tips: sync-in writes nothing', async (t) => {
  const f = await fixture(t);
  const before = await f.mainSnapshot();
  const tip = await f.mainTip();
  assert.equal(await f.cloneTip(), tip);
  assert.deepEqual(await f.syncIn(), { status: '0', tip, refusal: '' });
  assert.deepEqual(await f.mainSnapshot(), before);
});

test('(c) A clone behind the main checkout is healed to the main checkout’s tip, and a clone ahead then syncs in', async (t) => {
  const f = await fixture(t);
  const ahead = await f.advanceMain('main: ahead');
  const before = await f.mainSnapshot();
  assert.deepEqual(await f.syncIn(), { status: '0', tip: ahead, refusal: '' });
  assert.equal(await f.cloneTip(), ahead);
  assert.equal(await f.mainTip(), ahead);
  assert.deepEqual(await f.mainSnapshot(), before);

  const commit = await f.commitInClone('a.txt', 'clone work\n');
  assert.deepEqual(await f.syncIn(), { status: '0', tip: commit, refusal: '' });
  assert.equal(await f.mainTip(), commit);
  assert.equal(await f.cloneTip(), commit);
});

test('(d) Diverged tips are refused, naming both short ids', async (t) => {
  const f = await fixture(t);
  const theirs = await f.commitInClone('a.txt', 'clone work\n');
  const ours = await f.advanceMain('main: diverge');
  const before = await f.mainSnapshot();
  const g = await f.syncIn();
  assert.equal(g.status, '1');
  assert.match(g.refusal, /have diverged/);
  assert.ok(g.refusal.includes(theirs.slice(0, 12)), g.refusal);
  assert.ok(g.refusal.includes(ours.slice(0, 12)), g.refusal);
  assert.deepEqual(await f.mainSnapshot(), before);
  assert.equal(await f.mainTip(), ours);
  assert.equal(await f.cloneTip(), theirs);
});

test('(e) The main checkout having the branch checked out refuses sync-in, its ref unchanged', async (t) => {
  const f = await fixture(t);
  await f.commitInClone('a.txt', 'clone work\n');
  await runGit(f.main, ['checkout', '--quiet', BRANCH]);
  const before = await f.mainSnapshot();
  const g = await f.syncIn();
  assert.equal(g.status, '1');
  assert.match(g.refusal, /the main checkout '.*' has it checked out$/);
  assert.deepEqual(await f.mainSnapshot(), before);
});

test('(e2) A linked worktree of the main checkout having the branch checked out refuses sync-in, its ref unchanged', async (t) => {
  const f = await fixture(t);
  await f.commitInClone('a.txt', 'clone work\n');
  await runGit(f.main, ['worktree', 'add', '--quiet', join(f.root, 'wt'), BRANCH]);
  const before = await f.mainSnapshot();
  const g = await f.syncIn();
  assert.equal(g.status, '1');
  assert.match(g.refusal, /a checkout of '.*' has it checked out$/);
  assert.deepEqual(await f.mainSnapshot(), before);
});

test('(f) Sync-out moves only the named clone ref, and a stale expected old value refuses with the ref unchanged', async (t) => {
  const f = await fixture(t);
  const start = await f.cloneTip();
  const first = await f.advanceMain('main: first');
  const mainBefore = await f.mainSnapshot();
  const cloneBefore = await f.cloneRefs();

  assert.deepEqual(await f.syncOut(REF, start), { status: '0', refusal: '' });
  assert.equal(await f.cloneTip(), first);
  assert.equal(await f.cloneRefs(), cloneBefore.replace(`${start} commit\t${REF}`, `${first} commit\t${REF}`));
  assert.notEqual(await f.cloneRefs(), cloneBefore);
  assert.deepEqual(await f.mainSnapshot(), mainBefore);

  await f.advanceMain('main: second');
  const cloneMid = await f.cloneRefs();
  const g = await f.syncOut(REF, start);
  assert.equal(g.status, '1');
  assert.match(g.refusal, /update-ref to [0-9a-f]{12} failed$/);
  assert.equal(await f.cloneTip(), first);
  assert.equal(await f.cloneRefs(), cloneMid);
});

test('(g) On a linked worktree and on the main checkout both functions return 0 and change nothing', async (t) => {
  const f = await fixture(t);
  await runGit(f.main, ['worktree', 'add', '--quiet', join(f.root, 'wt'), '-b', 'feat_w']);
  await f.advanceMain('main: ahead');
  for (const gitdir of [join(f.main, '.git', 'worktrees', 'wt'), join(f.main, '.git')]) {
    const before = await f.mainSnapshot();
    const cloneBefore = await f.cloneRefs();
    const result = await lib(
      f.root,
      `${SYNC_IN}
hr_copy_sync_out_var "$1" "$2" refs/heads/feat_w; printf 'out=%s\\noutrefusal=%s\\n' "$?" "$HR_SYNC_REFUSAL"`,
      f.main,
      gitdir,
      BRANCH,
    );
    assert.deepEqual(globals(result), { status: '0', tip: '', refusal: '', out: '0', outrefusal: '' }, gitdir);
    assert.deepEqual(await f.mainSnapshot(), before, gitdir);
    assert.equal(await f.cloneRefs(), cloneBefore, gitdir);
  }
});

test('(h) Neither function reads, writes or needs the HR_RUN_* globals', async (t) => {
  const f = await fixture(t);
  const commit = await f.commitInClone('a.txt', 'clone work\n');
  const elsewhere = join(f.root, 'elsewhere');
  await mkdir(join(elsewhere, '.git'), { recursive: true });
  const seeded = {
    HR_RUN_MAIN: elsewhere,
    HR_RUN_TRUSTED_BASE: 'sentinel-trusted-base',
    HR_RUN_REFUSAL: 'sentinel-refusal',
    HR_RUN_COPY_TOP: 'sentinel-copy-top',
    HR_RUN_COPY_GITDIR: 'sentinel-copy-gitdir',
    HR_RUN_COPY_BRANCH: 'sentinel-copy-branch',
    HR_RUN_COPY_TIP: 'sentinel-copy-tip',
    HR_TARGET_GITDIR: 'sentinel-target-gitdir',
    HR_WRAPPER_BRANCH: 'sentinel-wrapper-branch',
  };
  const seed = Object.entries(seeded)
    .map(([k, v]) => `${k}='${v}'`)
    .join('\n');
  const print = Object.keys(seeded)
    .map((k) => `printf '${k}=%s\\n' "$${k}"`)
    .join('\n');
  const result = await lib(
    f.root,
    `${seed}
hr_copy_sync_in_var "$1" "$2" "$3"; printf 'in=%s\\nintip=%s\\ninrefusal=%s\\n' "$?" "$HR_SYNC_TIP" "$HR_SYNC_REFUSAL"
hr_copy_sync_out_var "$1" "$2" "refs/heads/$3" "$4"; printf 'out=%s\\noutrefusal=%s\\n' "$?" "$HR_SYNC_REFUSAL"
${print}
unset HR_RUN_MAIN
hr_copy_sync_in_var "$1" "$2" "$3"; printf 'unset=%s\\nunsetrefusal=%s\\n' "$?" "$HR_SYNC_REFUSAL"`,
    f.main,
    f.gitdir,
    BRANCH,
    commit,
  );
  assert.deepEqual(globals(result), {
    in: '0',
    intip: commit,
    inrefusal: '',
    out: '0',
    outrefusal: '',
    ...seeded,
    unset: '0',
    unsetrefusal: '',
  });
  assert.equal(await f.mainTip(), commit);
});

test('(s) A substituted loose object in the clone is rejected by the fetch, and the main checkout’s refs are unchanged', async (t) => {
  const f = await fixture(t);
  const objects = join(f.gitdir, 'objects');
  await writeFile(join(f.clone, 'decoy.txt'), 'substituted bytes, never committed\n');
  const decoy = (await runGit(f.clone, ['hash-object', '-w', 'decoy.txt'])).stdout.trim();
  await rm(join(f.clone, 'decoy.txt'));
  await f.commitInClone('a.txt', 'the committed bytes\n');
  const named = (await runGit(f.clone, ['rev-parse', `${REF}:a.txt`])).stdout.trim();
  for (const oid of [named, decoy]) {
    assert.notEqual((await runBash(f.main, ['-c', 'git cat-file -e "$1"', 'hr', oid])).status, 0, `the main checkout already holds ${oid}`);
  }
  await chmod(loose(objects, named), 0o644);
  await rm(loose(objects, named));
  await copyFile(loose(objects, decoy), loose(objects, named));

  const before = await f.mainSnapshot();
  const g = await f.syncIn();
  assert.equal(g.status, '1');
  assert.equal(g.tip, '');
  assert.match(g.refusal, /the fetch of refs\/heads\/feat_c failed$/);
  assert.deepEqual(await f.mainSnapshot(), before);

  assert.notEqual((await runBash(f.main, ['-c', 'git cat-file -e "$1"', 'hr', named])).status, 0);
  const fsck = await runBash(f.main, ['-c', 'git fsck --full 2>&1']);
  assert.doesNotMatch(fsck.stdout, /hash-path mismatch/);
});

/**
 * The fetch's measured pins: `plant` arms one payload in a clone one commit ahead of the main checkout,
 * each program it names touching a marker outside the clone, and returns how many further commits it
 * made there. Sync-in must run no payload, succeed, and leave the main checkout non-shallow with its
 * history read from the objects it holds.
 *
 * @param {import('node:test').TestContext} t
 * @param {(f: Awaited<ReturnType<typeof fixture>>, script: (name: string) => Promise<string>) => Promise<number | void>} plant
 */
async function measure(t, plant) {
  const f = await fixture(t);
  await f.commitInClone('a.txt', 'clone work\n');
  const markers = join(f.root, 'markers');
  const payloads = join(f.root, 'payloads');
  await mkdir(markers);
  await mkdir(payloads);
  const script = async (name) => {
    const path = join(payloads, name);
    await writeFile(path, `#!/bin/sh\ntouch '${join(markers, name)}'\ncat\n`);
    await chmod(path, 0o755);
    return path;
  };
  const old = await f.mainTip();
  const count = async (tip) => Number((await runGit(f.main, ['rev-list', '--count', tip])).stdout.trim());
  const countBefore = await count(old);
  const added = 1 + ((await plant(f, script)) ?? 0);
  const g = await f.syncIn();
  const fired = await readdir(markers);
  assert.deepEqual(fired, [], `a clone-side program ran during sync-in: ${fired.join(', ')}`);
  assert.equal(g.status, '0', g.refusal);
  assert.equal(await f.mainTip(), g.tip);
  assert.equal(await count(old), countBefore);
  assert.equal(await count(g.tip), countBefore + added);
  assert.equal(await exists(join(f.main, '.git', 'shallow')), false);
}

test('(m-fsmonitor) core.fsmonitor in the clone does not run during sync-in', async (t) => {
  await measure(t, async (f, script) => {
    await runGit(f.clone, ['config', 'core.fsmonitor', await script('fsmonitor')]);
  });
});

test('(m-packobjectshook) uploadpack.packObjectsHook in the clone does not run during sync-in', async (t) => {
  await measure(t, async (f, script) => {
    await runGit(f.clone, ['config', 'uploadpack.packObjectsHook', await script('pack-objects-hook')]);
  });
});

test('(m-hookspath) core.hooksPath in the clone naming pre-upload-pack, reference-transaction and post-checkout does not run them', async (t) => {
  await measure(t, async (f, script) => {
    const hooks = join(f.root, 'payloads', 'hooks');
    await mkdir(hooks);
    for (const name of ['pre-upload-pack', 'reference-transaction', 'post-checkout']) {
      await copyFile(await script(name), join(hooks, name));
      await chmod(join(hooks, name), 0o755);
      await rm(join(f.root, 'payloads', name));
    }
    await runGit(f.clone, ['config', 'core.hooksPath', hooks]);
  });
});

test('(m-filter) a clean/smudge filter in the clone with a committed .gitattributes does not run during sync-in', async (t) => {
  await measure(t, async (f, script) => {
    await f.commitInClone('.gitattributes', '* filter=x\n');
    await runGit(f.clone, ['config', 'filter.x.clean', await script('clean')]);
    await runGit(f.clone, ['config', 'filter.x.smudge', await script('smudge')]);
    return 1;
  });
});

test('(m-sshcommand) core.sshCommand in the clone does not run during sync-in', async (t) => {
  await measure(t, async (f, script) => {
    await runGit(f.clone, ['config', 'core.sshCommand', await script('ssh')]);
  });
});

test('(m-shallow) a planted .git/shallow in the clone is not refused and leaves the main checkout’s history unchanged', async (t) => {
  await measure(t, async (f) => {
    await writeFile(join(f.gitdir, 'shallow'), `${await f.cloneTip()}\n`);
  });
});

test('(m-grafts) a planted .git/info/grafts in the clone is not refused and leaves the main checkout’s history unchanged', async (t) => {
  await measure(t, async (f) => {
    await mkdir(join(f.gitdir, 'info'), { recursive: true });
    await writeFile(join(f.gitdir, 'info', 'grafts'), `${await f.cloneTip()}\n`);
  });
});
