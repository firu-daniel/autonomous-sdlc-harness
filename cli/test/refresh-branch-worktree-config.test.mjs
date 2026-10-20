/**
 * The shipped `refresh-branch.sh`'s checkout argument, its per-working-copy configuration check and
 * its hooks pin, driven as the permission profile runs it: the MAIN checkout's copy, with a linked
 * worktree as its argument.
 *
 * **The rule these tests exist to enforce: the main checkout's refresh wrapper, aimed at a worktree,
 * merges the base into that worktree and never into the main checkout; it does so only when the
 * worktree's `config.worktree` is absent, empty or holds just the `core.hooksPath`
 * `setup-worktree.sh` writes, refusing otherwise with exit 1 and the worktree untouched; and every
 * merge it makes runs the main repository's configured hooks directory, never the worktree's — and,
 * built from plumbing, its ref swap runs no hook at all, the only hook that fires being the
 * `reference-transaction` hook of the wrapper's fetch, under the main hooks directory; and a
 * main-checkout `defaultBranch` starting with `-` is refused with exit 1 before git can read it as an
 * option; and `defaultBranch` and the protected set come from the MAIN checkout's
 * `harness.config.json`, never from the worktree's own committed copy, which the sandbox can
 * rewrite.**
 * Case (a)'s marker assertion is the proof of the pin: a refusal case passing proves nothing about it.
 * Cases (a) and (d) move the main checkout's `refs/remotes/origin/trunk` back one commit before the
 * refresh, so that the fetch has a ref to move.
 * Cases (k)–(m) cover the merge mechanics: a fast-forward, a conflict that writes nothing, and an
 * untracked file in the way; (a) and (c) pin the merge commit's message in each mode; (n) is the
 * refusal on a git older than 2.38, whose `merge-tree` has no `--write-tree`.
 *
 * The fixture is built by hand rather than by `init`, so the hooks configuration under test is
 * exactly the one each case sets. Each hooks directory's two marker hooks are described at `hook`
 * in the fixture. The hooks directories are left untracked so the worktree's own hook leaves its tree
 * clean, which the wrapper requires before it merges.
 */

import assert from 'node:assert/strict';
import { access, chmod, cp, mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const TEMPLATE_SCRIPTS = join(PACKAGE_ROOT, 'templates', 'scripts');
const BASE = 'trunk';
const BRANCH = 'feat_w';
const CONFIG = {
  version: 1,
  defaultBranch: BASE,
  protectedBranches: [BASE, 'release/*'],
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const REFUSED = /^refresh-branch\.sh: refusing to refresh: /m;
const MERGED = /^refresh-branch\.sh: merged \S+ into feat_w$/m;

const output = (result) => `${result.stdout}\n${result.stderr}`;

/**
 * A bare origin; a main checkout on `trunk` carrying the scripts, `core.hooksPath=githooks` and a
 * published seed; a linked worktree on `feat_w` with one commit of its own, bootstrapped as
 * `setup-worktree.sh` step 4 does; then `trunk` moved on by one commit and published, so `feat_w`
 * is behind it.
 *
 * @param {import('node:test').TestContext} t
 */
async function worktreeFixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'refresh-wt-config-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const main = join(root, 'main');
  const wt = join(root, 'wt');
  const markers = join(root, 'markers');
  await mkdir(origin);
  await mkdir(main);
  await mkdir(markers);
  await runGit(origin, ['init', '--bare', '--quiet']);

  // A `post-merge` hook writing `<name>` and a `reference-transaction` hook writing `<name>-rt`:
  // git runs the second whenever a ref moves, so it proves which hooks directory the wrapper's fetch
  // ran under, and the first proves no merge hook ran at all.
  const hook = async (dir, name) => {
    await mkdir(dir, { recursive: true });
    const file = join(dir, 'post-merge');
    await writeFile(file, `#!/bin/sh\necho ${name} >> '${join(markers, name)}'\nexit 0\n`);
    await chmod(file, 0o755);
    const rt = join(dir, 'reference-transaction');
    await writeFile(rt, `#!/bin/sh\ncat >/dev/null\necho ${name} >> '${join(markers, `${name}-rt`)}'\nexit 0\n`);
    await chmod(rt, 0o755);
  };

  await runGit(main, ['init', '--quiet', '-b', BASE]);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await writeFile(join(main, 'f.txt'), 'a\n');
  await mkdir(join(main, 'scripts'));
  await cp(join(TEMPLATE_SCRIPTS, 'refresh-branch.sh'), join(main, 'scripts', 'refresh-branch.sh'));
  await cp(join(TEMPLATE_SCRIPTS, 'lib'), join(main, 'scripts', 'lib'), { recursive: true });
  await runGit(main, ['add', 'harness.config.json', 'f.txt', 'scripts']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', '-u', 'origin', BASE]);
  await hook(join(main, 'githooks'), 'main');
  await runGit(main, ['config', 'core.hooksPath', 'githooks']);

  await runGit(main, ['worktree', 'add', '--quiet', '-b', BRANCH, wt]);
  await runGit(wt, ['config', 'extensions.worktreeConfig', 'true']);
  await runGit(wt, ['config', '--worktree', 'core.hooksPath', join(wt, 'githooks')]);
  await hook(join(wt, 'githooks'), 'wt');
  await writeFile(join(wt, 'w.txt'), 'work\n');
  await runGit(wt, ['add', 'w.txt']);
  await runGit(wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: work']);

  await writeFile(join(main, 'f.txt'), 'a\nb\n');
  await runGit(main, ['commit', '--quiet', '--no-verify', '-am', 'fixture: base']);
  await runGit(main, ['push', '--quiet', '--no-verify', 'origin', BASE]);
  // The fixture's own commits ran the reference-transaction hooks; each case starts with none, and
  // a case that commits before its refresh clears them again.
  const resetMarkers = async () => {
    for (const name of await readdir(markers)) await rm(join(markers, name));
  };
  await resetMarkers();

  const head = async (dir) => (await runGit(dir, ['rev-parse', 'HEAD'])).stdout.trim();
  return {
    main,
    wt,
    head,
    baseSha: await head(main),
    refresh: (script, args, env = {}) => runBash(root, [script, ...args], env),
    mainScript: join(main, 'scripts', 'refresh-branch.sh'),
    wtScript: join(wt, 'scripts', 'refresh-branch.sh'),
    branchOf: async (dir) => (await runGit(dir, ['symbolic-ref', '--short', 'HEAD'])).stdout.trim(),
    contains: async (dir, sha) => (await runGit(dir, ['log', '--format=%H'])).stdout.split('\n').includes(sha),
    markers: async () => (await readdir(markers)).sort(),
    resetMarkers,
    root,
    subject: async (dir) => (await runGit(dir, ['log', '-1', '--format=%s'])).stdout.trim(),
    // Tracked changes only: the worktree's hooks directory is untracked by design.
    status: async (dir) => (await runGit(dir, ['status', '--porcelain', '--untracked-files=no'])).stdout,
  };
}

test('(a) The main checkout’s copy refreshes the named worktree under the main hooks, and runs no merge hook', async (t) => {
  const f = await worktreeFixture(t);
  // The fixture's push already advanced origin/trunk; put it back one commit so the wrapper's
  // fetch moves a ref, and its reference-transaction hook shows which hooks directory it ran under.
  await runGit(f.main, ['update-ref', `refs/remotes/origin/${BASE}`, `${f.baseSha}~1`]);
  await f.resetMarkers();
  const mainHead = await f.head(f.main);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, MERGED, output(result));
  assert.ok(await f.contains(f.wt, f.baseSha), output(result));
  assert.equal(await f.head(f.main), mainHead);
  assert.equal(await f.branchOf(f.main), BASE);
  assert.equal(await f.subject(f.wt), "Merge remote-tracking branch 'origin/trunk' into feat_w");
  assert.equal(await f.status(f.wt), '');
  assert.deepEqual(await f.markers(), ['main-rt']);
});

test('(b) A foreign key in config.worktree is refused with exit 1, by name, never by value', async (t) => {
  const f = await worktreeFixture(t);
  await runGit(f.wt, ['config', '--worktree', 'user.name', 'sandbox-written-value']);
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, REFUSED, output(result));
  assert.match(result.stderr, /refusing to refresh: .*user\.name/);
  assert.doesNotMatch(output(result), /sandbox-written-value/);
  assert.equal(await f.head(f.wt), wtHead);
  assert.deepEqual(await f.markers(), []);
});

test('(c) --local with a checkout argument merges the local base and never fetches', async (t) => {
  const f = await worktreeFixture(t);
  await runGit(f.main, ['remote', 'set-url', 'origin', join(f.main, 'no-such-origin.git')]);
  await writeFile(join(f.main, 'f.txt'), 'a\nb\nc\n');
  await runGit(f.main, ['commit', '--quiet', '--no-verify', '-am', 'fixture: unpushed base']);
  const localBase = await f.head(f.main);
  const result = await f.refresh(f.mainScript, ['--local', f.wt]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, MERGED, output(result));
  assert.doesNotMatch(output(result), /no-such-origin|fatal:/);
  assert.ok(await f.contains(f.wt, localBase), output(result));
  assert.equal(await f.subject(f.wt), "Merge branch 'trunk' into feat_w");
});

test('(d) The worktree’s own copy with no argument still refreshes the worktree, under the main hooks', async (t) => {
  const f = await worktreeFixture(t);
  // The fixture's push already advanced origin/trunk; put it back one commit so the wrapper's
  // fetch moves a ref, and its reference-transaction hook shows which hooks directory it ran under.
  await runGit(f.main, ['update-ref', `refs/remotes/origin/${BASE}`, `${f.baseSha}~1`]);
  await f.resetMarkers();
  const mainHead = await f.head(f.main);
  const result = await f.refresh(f.wtScript, []);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, MERGED, output(result));
  assert.ok(await f.contains(f.wt, f.baseSha), output(result));
  assert.equal(await f.head(f.main), mainHead);
  assert.deepEqual(await f.markers(), ['main-rt']);
});

test('(e) A second checkout argument is a usage error', async (t) => {
  const f = await worktreeFixture(t);
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt, f.main]);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /usage: refresh-branch\.sh \[--local\] \[<repo-dir>\]/, output(result));
  assert.equal(await f.head(f.wt), wtHead);
});

test('(f) A main-checkout defaultBranch starting with `-` is refused before git fetch can run it as an option', async (t) => {
  const f = await worktreeFixture(t);
  const root = dirname(f.main);
  const marker = join(root, 'upload-pack-ran');
  const program = join(root, 'marker.sh');
  await writeFile(program, `#!/bin/sh\ntouch '${marker}'\nexec git upload-pack "$@"\n`);
  await chmod(program, 0o755);
  // Left uncommitted in the main checkout: the wrapper reads the file, not the commit.
  await writeFile(
    join(f.main, 'harness.config.json'),
    `${JSON.stringify({ ...CONFIG, defaultBranch: `--upload-pack=${program}` })}\n`,
  );
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /starts with '-'/, output(result));
  await assert.rejects(access(marker), output(result));
  assert.equal(await f.head(f.wt), wtHead);
});

test('(g) A worktree harness.config.json naming another defaultBranch is ignored: the main one’s base is merged', async (t) => {
  const f = await worktreeFixture(t);
  // `other` is the seed commit, which feat_w already contains: merging it would be "nothing to do".
  await runGit(f.main, ['push', '--quiet', '--no-verify', 'origin', 'HEAD~1:refs/heads/other']);
  await writeFile(
    join(f.wt, 'harness.config.json'),
    `${JSON.stringify({ ...CONFIG, defaultBranch: 'other', protectedBranches: [] })}\n`,
  );
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-am', 'fixture: worktree names another base']);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^refresh-branch\.sh: merged origin\/trunk into feat_w$/m, output(result));
  assert.doesNotMatch(output(result), /origin\/other/);
  assert.ok(await f.contains(f.wt, f.baseSha), output(result));
});

test('(h) A worktree harness.config.json dropping a protected pattern does not unprotect the branch', async (t) => {
  const f = await worktreeFixture(t);
  await runGit(f.wt, ['checkout', '--quiet', '-b', 'release/x']);
  await writeFile(
    join(f.wt, 'harness.config.json'),
    `${JSON.stringify({ ...CONFIG, protectedBranches: [] })}\n`,
  );
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-am', 'fixture: worktree drops release/*']);
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 2, output(result));
  assert.match(result.stderr, /HEAD is on protected branch 'release\/x'/, output(result));
  assert.ok(result.stderr.includes(join(f.main, 'harness.config.json')), output(result));
  assert.equal(await f.head(f.wt), wtHead);
  assert.ok(!(await f.contains(f.wt, f.baseSha)), output(result));
});

test('(i) A main checkout whose harness.config.json cannot be read is refused with exit 1, never answered from the worktree’s', async (t) => {
  const f = await worktreeFixture(t);
  await writeFile(join(f.main, 'harness.config.json'), 'x');
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /refusing to (refresh|merge)/, output(result));
  assert.equal(await f.head(f.wt), wtHead);
  assert.deepEqual(await f.markers(), []);
});

test('(j) An unreadable worktree harness.config.json is never read: the main one decides, and the merge lands', async (t) => {
  const f = await worktreeFixture(t);
  // No config.worktree key left, so the per-working-copy check never consults the worktree's copy:
  // only the base and protected-set decisions could still read it.
  await runGit(f.wt, ['config', '--worktree', '--unset', 'core.hooksPath']);
  await writeFile(join(f.wt, 'harness.config.json'), 'x');
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-am', 'fixture: worktree config unreadable']);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^refresh-branch\.sh: merged origin\/trunk into feat_w$/m, output(result));
  assert.ok(await f.contains(f.wt, f.baseSha), output(result));
});

test('(k) A branch the base is ahead of is fast-forwarded to it, with no merge commit', async (t) => {
  const f = await worktreeFixture(t);
  await runGit(f.wt, ['reset', '--quiet', '--hard', 'HEAD~1']);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /^refresh-branch\.sh: merged origin\/trunk into feat_w$/m, output(result));
  assert.equal(await f.head(f.wt), f.baseSha);
  assert.equal(await readFile(join(f.wt, 'f.txt'), 'utf8'), 'a\nb\n');
  assert.equal(await f.status(f.wt), '');
});

test('(l) A conflict exits 4 and writes nothing: no merge state, the branch and the tree as they were', async (t) => {
  const f = await worktreeFixture(t);
  await writeFile(join(f.wt, 'f.txt'), 'a\nX\n');
  await runGit(f.wt, ['commit', '--quiet', '--no-verify', '-am', 'fixture: conflicting edit']);
  await f.resetMarkers();
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 4, output(result));
  assert.match(result.stderr, /origin\/trunk conflicts with feat_w — nothing was merged/, output(result));
  assert.match(result.stderr, /^ {2}conflicted: f\.txt$/m, output(result));
  assert.equal(await f.head(f.wt), wtHead);
  assert.equal(await readFile(join(f.wt, 'f.txt'), 'utf8'), 'a\nX\n');
  assert.equal(await f.status(f.wt), '');
  const merging = await runBash(f.wt, ['-c', 'git rev-parse --verify --quiet MERGE_HEAD']);
  assert.notEqual(merging.status, 0, 'a MERGE_HEAD was left behind');
  assert.deepEqual(await f.markers(), []);
});

test('(m) An untracked file the merge would overwrite is refused with exit 1, and is left as it was', async (t) => {
  const f = await worktreeFixture(t);
  await writeFile(join(f.main, 'n.txt'), 'from the base\n');
  await runGit(f.main, ['add', 'n.txt']);
  await runGit(f.main, ['commit', '--quiet', '--no-verify', '-m', 'fixture: base adds n.txt']);
  await runGit(f.main, ['push', '--quiet', '--no-verify', 'origin', BASE]);
  await writeFile(join(f.wt, 'n.txt'), 'untracked\n');
  await f.resetMarkers();
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt]);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /nothing was merged, working copy unchanged/, output(result));
  assert.equal(await f.head(f.wt), wtHead);
  assert.equal(await readFile(join(f.wt, 'n.txt'), 'utf8'), 'untracked\n');
  assert.equal(await f.status(f.wt), '');
  assert.deepEqual(await f.markers(), []);
});

test('(n) A git older than 2.38 is refused with exit 1 before anything is fetched or merged', async (t) => {
  const f = await worktreeFixture(t);
  const real = (await runBash(f.root, ['-c', 'command -v git'])).stdout.trim();
  const bin = join(f.root, 'old-git-bin');
  await mkdir(bin);
  await writeFile(
    join(bin, 'git'),
    `#!/bin/sh\nif [ "$#" -eq 1 ] && [ "$1" = --version ]; then echo 'git version 2.37.4'; exit 0; fi\nexec '${real}' "$@"\n`,
  );
  await chmod(join(bin, 'git'), 0o755);
  const tracking = (await runGit(f.main, ['rev-parse', 'refs/remotes/origin/trunk'])).stdout;
  const wtHead = await f.head(f.wt);
  const result = await f.refresh(f.mainScript, [f.wt], { PATH: `${bin}:${process.env.PATH}` });
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, /needs git 2\.38 or newer .*'git version 2\.37\.4'/, output(result));
  assert.equal(await f.head(f.wt), wtHead);
  assert.equal((await runGit(f.main, ['rev-parse', 'refs/remotes/origin/trunk'])).stdout, tracking);
  assert.deepEqual(await f.markers(), []);
});
