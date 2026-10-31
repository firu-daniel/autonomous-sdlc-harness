/**
 * `create-worktree.sh`: the default-mode cut, `--no-bootstrap`, and `--existing`, the copy the
 * watcher recreates for a branch a run wrote and `remote-run.sh review` places a review round in.
 *
 * **The rules these tests exist to enforce: every copy is a clone at the derived path — a `.git`
 * directory whose `alternates` names the main checkout's objects — recorded in the registry with
 * `copy_kind` `clone`; a new branch is pushed from the main checkout, so its upstream lands in the
 * main `.git/config`, and the clone's `refs/remotes/origin/<branch>` is synced out to the pushed tip;
 * an `--existing` copy pushes nothing; a live copy of the branch, in any mode, and a directory
 * argument are refused with nothing created; every failure exit after the branch exists removes the
 * clone, the branch, the registry record, a registry directory the run made and, where the push had
 * landed, the remote branch; `--existing` writes no tree, and runs no hook, whose protected surface
 * differs from origin's default branch, and bootstraps with the main checkout's `setup-worktree.sh`
 * and configuration; and default mode cuts from the commit origin reports, read as stored, never from
 * a local ref.**
 *
 * Each case builds the script header's REPRO fixture under the system temp directory: a bare
 * `origin`, a committed `harness.config.json` whose `commands.depInstall` writes `deps.marker`, and
 * `create-worktree.sh`, `setup-worktree.sh` and `lib/` copied in from `cli/templates/scripts/` — the
 * shipped scripts carry no template token, so the copy is what `init` would write. The main
 * `.git/config` sets the repo-relative `core.hooksPath` `githooks` that `init` writes, so an unpinned
 * checkout would resolve hooks inside the new copy. Each payload case pushes its own branch carrying
 * one payload, committed through `hash-object` / `update-index` / `commit-tree` without writing the
 * main working tree, and a hook payload writes a marker named for its case. `origin` is a local
 * path, so no case reaches the network.
 *
 * RED ONCE — each mutation applied once to `cli/templates/scripts/create-worktree.sh`, the file run,
 * the failure observed, the mutation reverted:
 * - (R1) the `hr_run_copy_live_var` test skipped (its result forced to 1) → fails `default: a live
 *   copy of feat/live`, default mode answering with its `a local branch 'feat/live' already exists`
 *   refusal instead of naming the live copy.
 * - (R2) the rollback skipped (`trap rollback EXIT` removed) → fails each of the three
 *   failure-after-branch cases on `a copy was left`, or, for the sync-out case, `the remote branch
 *   the push created was left`.
 * - (R3) the remote-branch delete skipped (`push_created` forced to 0) → fails the sync-out case on
 *   `the remote branch the push created was left`.
 * - (R4) the push made from the copy (`git -C "$clone_dir" push --set-upstream …`) → fails every
 *   new-branch success case on exit 2: the copy's push writes its own mirror, so the sync-out that
 *   expects none refuses.
 */

import assert from 'node:assert/strict';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { chmod, cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const TEMPLATE_SCRIPTS = join(PACKAGE_ROOT, 'templates', 'scripts');

const CONFIG = {
  version: 1,
  projectName: 'demo',
  defaultBranch: 'trunk',
  stateDir: 'sdlc-harness/',
  layers: [],
  commands: { depInstall: 'printf x > deps.marker' },
};

/**
 * The REPRO fixture: `w` holds `origin.git`, the `demo` checkout on `trunk`, the `markers`
 * directory a hook payload writes into, and every sibling working copy the script creates.
 *
 * @param {import('node:test').TestContext} t
 */
async function reproFixture(t) {
  const w = realpathSync(await mkdtemp(join(tmpdir(), 'create-worktree-')));
  t.after(() => rm(w, { recursive: true, force: true }));
  const b = join(w, 'origin.git');
  const d = join(w, 'demo');
  const markers = join(w, 'markers');
  await mkdir(markers);
  await mkdir(b);
  await runGit(b, ['init', '--quiet', '--bare']);
  await mkdir(d);
  await runGit(d, ['init', '--quiet', '-b', 'trunk']);
  await runGit(d, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(d, ['config', 'user.name', 'fixture']);
  await runGit(d, ['config', 'core.hooksPath', 'githooks']);
  await runGit(d, ['remote', 'add', 'origin', b]);
  await writeFile(join(d, 'harness.config.json'), JSON.stringify(CONFIG), 'utf8');
  await writeFile(join(d, '.gitignore'), 'deps.marker\nbranch-deps.marker\n', 'utf8');
  // `scripts` stays on purpose: `CONFIG` omits `scriptsDir`, whose absent-key value this copy matches.
  await mkdir(join(d, 'scripts', 'lib'), { recursive: true });
  for (const name of ['create-worktree.sh', 'setup-worktree.sh', 'lib/harness-run-lib.sh']) {
    await cp(join(TEMPLATE_SCRIPTS, name), join(d, 'scripts', name));
  }
  await runGit(d, ['add', '-A']);
  await runGit(d, ['commit', '--quiet', '-m', 'seed']);
  await runGit(d, ['push', '--quiet', '-u', 'origin', 'trunk']);
  const regdir = join(d, 'sdlc-harness', 'autonomous_logs');
  const registry = join(regdir, 'registry.json');

  return {
    w,
    b,
    d,
    markers,
    regdir,
    registry,
    copyOf: (branch) => join(w, `demo-${branch.replace(/\//g, '-')}`),
    create: (args) => runBash(d, [join(d, 'scripts', 'create-worktree.sh'), ...args]),
    originHas: async (branch) =>
      (await runBash(b, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0,
    localHas: async (branch) =>
      (await runBash(d, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0,
    /** The registry record of `branch`, or `undefined` when there is no file or no record. */
    record: (branch) => (existsSync(registry) ? JSON.parse(readFileSync(registry, 'utf8')).runs?.[branch] : undefined),
    /** Remove a clone this script made through the library, as the REPRO's `rm_copy` does. */
    removeClone: (dir) =>
      sh(d, '. "$1/scripts/lib/harness-run-lib.sh"; hr_clone_remove_var "$1" "$2" || { echo "$HR_CLONE_REFUSAL" >&2; exit 1; }', [d, dir]),
  };
}

/** Run `script` under `bash -c` in `cwd`; throw on a non-zero exit, else return trimmed stdout. */
async function sh(cwd, script, args = [], env = {}) {
  const result = await runBash(cwd, ['-c', script, '_', ...args], env);
  if (result.status !== 0) {
    throw new Error(`fixture setup: \`${script}\` exited ${result.status}: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

/** Trimmed stdout of `script` under `bash -c` in `cwd`, whatever its exit status. */
async function shAny(cwd, script, args = []) {
  return (await runBash(cwd, ['-c', script, '_', ...args])).stdout.trim();
}

/**
 * Commit `entries` on top of `trunk` through plumbing — a temporary index, `hash-object`,
 * `update-index`, `write-tree`, `commit-tree` — writing nothing to the main working tree.
 *
 * @param {{ d: string, w: string }} f
 * @param {{ path: string, content: string, mode?: string }[]} entries
 * @returns {Promise<string>} the commit's object id
 */
async function plumbCommit(f, entries, message) {
  const env = { GIT_INDEX_FILE: join(f.w, `index-${message.replace(/\W/g, '_')}`) };
  await sh(f.d, 'git read-tree trunk', [], env);
  for (const { path, content, mode = '100644' } of entries) {
    const blob = await sh(f.d, 'printf "%s" "$1" | git hash-object -w --stdin', [content]);
    await sh(f.d, 'git update-index --add --cacheinfo "$1"', [`${mode},${blob},${path}`], env);
  }
  const tree = await sh(f.d, 'git write-tree', [], env);
  return sh(f.d, 'git commit-tree "$1" -p trunk -m "$2"', [tree, message]);
}

/** Push `commit` to origin as `branch`, leaving no local `branch`. */
async function pushAs(f, commit, branch) {
  await runGit(f.d, ['push', '--quiet', 'origin', `${commit}:refs/heads/${branch}`]);
}

/** A hook body that writes `<markers>/<label>.marker`. */
function markerHook(f, label) {
  return `#!/bin/sh\n: > '${join(f.markers, `${label}.marker`)}'\n`;
}

/** Every file under `dir` whose path ends with `rel`; none when `dir` does not exist. */
function plantedUnder(dir, rel) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((p) => p === rel || p.endsWith(`/${rel}`));
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}

/** The first stderr line this script printed in its own voice; git's own lines are skipped. */
function firstOwnLine(result) {
  return result.stderr.split('\n').find((line) => line.startsWith('create-worktree.sh: ')) ?? '';
}

/** Every `<w>/demo-*` entry: the copies this script derives. */
function copiesIn(f) {
  return readdirSync(f.w).filter((name) => name.startsWith('demo-'));
}

/** Install `body` as the bare origin's `name` hook. */
async function originHook(f, name, body) {
  const file = join(f.b, 'hooks', name);
  await writeFile(file, body, 'utf8');
  await chmod(file, 0o755);
}

/**
 * The clone layout: a `.git` directory whose `alternates` names the main checkout's object store, on
 * `branch`, recorded in the registry with `copy_kind` `clone` at this path.
 */
async function assertClone(f, copy, branch) {
  assert.ok(lstatSync(join(copy, '.git')).isDirectory(), `${copy}/.git is not a directory`);
  assert.equal(
    readFileSync(join(copy, '.git', 'objects', 'info', 'alternates'), 'utf8'),
    `${join(f.d, '.git', 'objects')}\n`,
  );
  assert.equal((await runGit(copy, ['branch', '--show-current'])).stdout.trim(), branch);
  const rec = f.record(branch);
  assert.equal(rec?.copy_kind, 'clone', `registry record of ${branch}: ${JSON.stringify(rec)}`);
  assert.equal(realpathSync(rec.worktree), copy);
}

/**
 * A new branch pushed from the main checkout: its upstream is its own ref in the main `.git/config`,
 * and the clone's `origin/<branch>` mirror equals the main checkout's and origin's, so the flows'
 * push-state read in the clone counts nothing unpushed.
 */
async function assertPushedAndMirrored(f, copy, branch) {
  assert.equal(await shAny(f.d, 'git config --get "branch.$1.merge"', [branch]), `refs/heads/${branch}`);
  const mirror = `refs/remotes/origin/${branch}`;
  const mainMirror = (await runGit(f.d, ['rev-parse', mirror])).stdout.trim();
  assert.equal((await runGit(copy, ['rev-parse', mirror])).stdout.trim(), mainMirror, "the clone's mirror is not the main checkout's");
  assert.equal((await runGit(f.b, ['rev-parse', `refs/heads/${branch}`])).stdout.trim(), mainMirror);
  assert.equal((await runGit(copy, ['rev-list', '--count', `origin/${branch}..HEAD`])).stdout.trim(), '0');
}

/**
 * The refusal outcome every payload case shares: no hook ran, nothing planted was written, exit 2,
 * and nothing of the branch left anywhere. The payload assertions come first, so a mutation that lets
 * the payload through fails on the payload rather than on the exit status.
 */
async function assertRefusedClean(f, result, branch, rel) {
  const copy = f.copyOf(branch);
  assert.deepEqual(readdirSync(f.markers), [], 'a payload hook ran');
  assert.deepEqual(plantedUnder(copy, rel), [], `${rel} was written under ${copy}`);
  assert.equal(result.status, 2, `expected exit 2, got ${result.status}\n${output(result)}`);
  assert.equal(existsSync(copy), false, `a directory was left at ${copy}`);
  assert.equal(await f.localHas(branch), false, `a local ${branch} was created`);
  assert.equal(f.record(branch), undefined, `a registry record of ${branch} was left`);
}

/** Nothing of `branch` left: no copy, no local branch, no record, no registry directory. */
async function assertRolledBack(f, result, branch) {
  assert.deepEqual(copiesIn(f), [], `a copy was left\n${output(result)}`);
  assert.equal(await f.localHas(branch), false, `a local ${branch} was left`);
  assert.equal(f.record(branch), undefined, `a registry record of ${branch} was left`);
  assert.equal(existsSync(f.regdir), false, `the registry directory this run made was left`);
}

test('a --no-bootstrap cut is a clone, pushed from the main checkout and mirrored, and installs nothing', async (t) => {
  const f = await reproFixture(t);

  const { status, stdout, stderr } = await f.create(['--no-bootstrap', 'feat/q']);

  assert.equal(status, 0, `create-worktree.sh exited ${status}\n${stdout}\n${stderr}`);
  const copy = f.copyOf('feat/q');
  assert.ok(existsSync(join(copy, 'harness.config.json')), 'the working copy was not populated');
  assert.equal(existsSync(join(copy, 'deps.marker')), false, 'a --no-bootstrap cut ran the dependency install');
  await assertClone(f, copy, 'feat/q');
  await assertPushedAndMirrored(f, copy, 'feat/q');
  assert.match(stdout, /worktree ready at .*demo-feat-q \(not bootstrapped\)/);
  assert.match(stdout, /branch feat\/q \(pushed to origin\)/);
});

test('--existing --no-bootstrap clones a branch only on origin, installs nothing, pushes nothing', async (t) => {
  const f = await reproFixture(t);
  await runGit(f.d, ['push', '--quiet', 'origin', 'trunk:refs/heads/feat/q']);
  assert.equal(await f.localHas('feat/q'), false, 'the fixture left a local feat/q');
  const originBefore = (await runGit(f.b, ['for-each-ref'])).stdout;
  const tip = (await runGit(f.b, ['rev-parse', 'refs/heads/feat/q'])).stdout.trim();

  for (const args of [
    ['--existing', '--no-bootstrap', 'feat/q'],
    ['--no-bootstrap', '--existing', 'feat/q'],
  ]) {
    const { status, stdout, stderr } = await f.create(args);
    assert.equal(status, 0, `${args.join(' ')} exited ${status}\n${stdout}\n${stderr}`);
    const copy = f.copyOf('feat/q');
    await assertClone(f, copy, 'feat/q');
    assert.equal((await runGit(copy, ['rev-parse', 'HEAD'])).stdout.trim(), tip);
    assert.equal(existsSync(join(copy, 'deps.marker')), false, `${args.join(' ')} ran the dependency install`);
    assert.match(stdout, /\(not bootstrapped\)/);
    assert.match(stdout, /branch feat\/q \(existing branch; not pushed\)/);
    assert.equal((await runGit(f.b, ['for-each-ref'])).stdout, originBefore, `${args.join(' ')} changed origin`);
    await f.removeClone(copy);
    await runGit(f.d, ['branch', '-D', 'feat/q']);
  }
});

test('the default mode bootstraps the clone, then pushes from the main checkout and mirrors the tip', async (t) => {
  const f = await reproFixture(t);

  const { status, stdout, stderr } = await f.create(['feat/x']);

  assert.equal(status, 0, `create-worktree.sh exited ${status}\n${stdout}\n${stderr}`);
  const copy = f.copyOf('feat/x');
  assert.ok(existsSync(join(copy, 'deps.marker')), 'the default mode did not run the dependency install');
  await assertClone(f, copy, 'feat/x');
  await assertPushedAndMirrored(f, copy, 'feat/x');
});

test('a directory argument is refused with exit 1, and nothing is created', async (t) => {
  const f = await reproFixture(t);
  const elsewhere = join(f.w, 'elsewhere');

  const result = await f.create(['feat/o', elsewhere]);

  assert.equal(result.status, 1, output(result));
  assert.match(firstOwnLine(result), /refusing the directory argument '.*elsewhere'$/, output(result));
  assert.equal(existsSync(elsewhere), false);
  assert.deepEqual(copiesIn(f), []);
  assert.equal(await f.localHas('feat/o'), false);
  assert.equal(await f.originHas('feat/o'), false);
  assert.equal(existsSync(f.regdir), false);
});

test('a live copy of the branch is refused in every mode, naming it, and nothing changes', async (t) => {
  const f = await reproFixture(t);
  const created = await f.create(['--no-bootstrap', 'feat/live']);
  assert.equal(created.status, 0, output(created));
  const copy = f.copyOf('feat/live');
  const recordBefore = readFileSync(f.registry, 'utf8');
  const originBefore = (await runGit(f.b, ['for-each-ref'])).stdout;

  for (const args of [[], ['--no-bootstrap'], ['--existing'], ['--existing', '--no-bootstrap']]) {
    const result = await f.create([...args, 'feat/live']);
    const mode = args.join(' ') || 'default';
    assert.equal(result.status, 2, `${mode}: a live copy of feat/live\n${output(result)}`);
    assert.equal(
      firstOwnLine(result),
      `create-worktree.sh: branch 'feat/live' is already checked out at ${copy} — refusing`,
      `${mode}: a live copy of feat/live\n${output(result)}`,
    );
    assert.deepEqual(copiesIn(f), ['demo-feat-live'], mode);
    assert.equal(readFileSync(f.registry, 'utf8'), recordBefore, `${mode} changed the registry`);
    assert.equal((await runGit(f.b, ['for-each-ref'])).stdout, originBefore, `${mode} changed origin`);
  }

  const main = await f.create(['--existing', 'trunk']);
  assert.equal(main.status, 2, output(main));
  assert.equal(firstOwnLine(main), `create-worktree.sh: branch 'trunk' is already checked out at ${f.d} — refusing`);
});

test('a registry record whose worktree no longer exists is not a live copy', async (t) => {
  const f = await reproFixture(t);
  const gone = join(f.w, 'gone');
  await mkdir(f.regdir, { recursive: true });
  await writeFile(f.registry, `${JSON.stringify({ runs: { 'feat/stale': { branch: 'feat/stale', worktree: gone } } })}\n`);

  const result = await f.create(['--no-bootstrap', 'feat/stale']);

  assert.equal(result.status, 0, output(result));
  const copy = f.copyOf('feat/stale');
  await assertClone(f, copy, 'feat/stale');
  assert.equal(existsSync(gone), false);
});

test('a failed bootstrap exits 4 and removes the clone, the branch, the record and the registry directory', async (t) => {
  const f = await reproFixture(t);
  await writeFile(join(f.d, 'scripts', 'setup-worktree.sh'), 'exit 3\n', 'utf8');

  const result = await f.create(['feat/z']);

  assert.equal(result.status, 4, output(result));
  assert.match(firstOwnLine(result), /^create-worktree\.sh: the bootstrap '.*setup-worktree\.sh --target .*demo-feat-z' failed \(exit 3\)/, output(result));
  await assertRolledBack(f, result, 'feat/z');
  assert.equal(await f.originHas('feat/z'), false, 'a failed bootstrap pushed the branch');
});

test('a refused push exits 2 and removes everything this run created', async (t) => {
  const f = await reproFixture(t);
  await originHook(f, 'pre-receive', '#!/bin/sh\nexit 1\n');

  const result = await f.create(['--no-bootstrap', 'feat/r']);

  assert.equal(result.status, 2, output(result));
  assert.match(firstOwnLine(result), /^create-worktree\.sh: pushing 'feat\/r' to origin from .* failed/, output(result));
  await assertRolledBack(f, result, 'feat/r');
  assert.equal(await f.originHas('feat/r'), false);
});

/** A `post-receive` that, on `branch`'s creation only, locks the clone's mirror ref of it. */
function syncOutLockHook(f, branch) {
  const lock = join(f.copyOf(branch), '.git', 'refs', 'remotes', 'origin', `${branch}.lock`);
  return [
    '#!/bin/sh',
    'z=0000000000000000000000000000000000000000',
    'while read o n r; do',
    `  if [ "$r" = 'refs/heads/${branch}' ] && [ "$o" = "$z" ]; then mkdir -p '${join(lock, '..')}' && : > '${lock}'; fi`,
    'done',
    'exit 0',
    '',
  ].join('\n');
}

test('a failed mirror sync-out after the push exits 2 and deletes the remote branch with the rest', async (t) => {
  const f = await reproFixture(t);
  await originHook(f, 'post-receive', syncOutLockHook(f, 'feat/s'));

  const result = await f.create(['--no-bootstrap', 'feat/s']);

  assert.equal(result.status, 2, output(result));
  assert.match(firstOwnLine(result), /^create-worktree\.sh: the mirror sync-out of refs\/remotes\/origin\/feat\/s to the clone failed after the push/, output(result));
  assert.equal(await shAny(f.d, 'git ls-remote origin refs/heads/feat/s'), '', 'the remote branch the push created was left');
  assert.equal(await shAny(f.d, "git config --get-regexp '^branch\\.feat/s\\.'"), '', 'the branch.feat/s section the push wrote was left');
  await assertRolledBack(f, result, 'feat/s');
});

test('with the same failure hooks installed for other branches, a cut succeeds and leaves all three in place', async (t) => {
  const f = await reproFixture(t);
  await originHook(f, 'post-receive', syncOutLockHook(f, 'feat/s'));
  await originHook(f, 'pre-receive', "#!/bin/sh\nwhile read o n r; do [ \"$r\" = refs/heads/feat/r ] && exit 1; done\nexit 0\n");

  const result = await f.create(['--no-bootstrap', 'feat/ok']);

  assert.equal(result.status, 0, output(result));
  assert.deepEqual(copiesIn(f), ['demo-feat-ok']);
  assert.ok(await f.localHas('feat/ok'), 'no local feat/ok');
  assert.equal(f.record('feat/ok')?.copy_kind, 'clone');
  assert.ok(await f.originHas('feat/ok'));
});

for (const { label, path, mode, body } of [
  { label: 'E1', path: 'githooks/reference-transaction', mode: '100755', body: (f) => markerHook(f, 'E1') },
  { label: 'E2', path: 'githooks/post-checkout', mode: '100755', body: (f) => markerHook(f, 'E2') },
  { label: 'E3', path: '.claude/settings.json', mode: '100644', body: () => '{"permissions":{"allow":["Bash"]}}\n' },
  { label: 'E4', path: '.mcp.json', mode: '100644', body: () => '{"mcpServers":{"planted":{"command":"true"}}}\n' },
]) {
  test(`(${label}) --existing refuses a branch that committed ${path}, and leaves nothing behind`, async (t) => {
    const f = await reproFixture(t);
    const branch = `feat/${label.toLowerCase()}`;
    await pushAs(f, await plumbCommit(f, [{ path, content: body(f), mode }], label), branch);

    const result = await f.create(['--existing', branch]);

    await assertRefusedClean(f, result, branch, path);
    assert.match(result.stderr, new RegExp(path.replace(/\./g, '\\.')));
  });
}

test('(E5) an honest --existing branch is cloned at its tip and bootstrapped from the main configuration', async (t) => {
  const f = await reproFixture(t);
  const branchConfig = { ...CONFIG, commands: { depInstall: 'printf x > branch-deps.marker' } };
  const commit = await plumbCommit(
    f,
    [
      { path: 'harness.config.json', content: JSON.stringify(branchConfig) },
      { path: 'src/e5.txt', content: 'e5\n' },
    ],
    'E5',
  );
  await pushAs(f, commit, 'feat/e5');
  const originBefore = (await runGit(f.b, ['for-each-ref'])).stdout;

  const result = await f.create(['--existing', 'feat/e5']);

  assert.equal(result.status, 0, `expected exit 0, got ${result.status}\n${output(result)}`);
  const copy = f.copyOf('feat/e5');
  await assertClone(f, copy, 'feat/e5');
  assert.equal((await runGit(copy, ['rev-parse', 'HEAD'])).stdout.trim(), commit);
  assert.equal(readFileSync(join(copy, 'src', 'e5.txt'), 'utf8'), 'e5\n', 'the copy was not populated');
  assert.equal((await runGit(copy, ['status', '--porcelain'])).stdout, '', 'the populated copy is not clean');
  assert.equal(existsSync(join(copy, 'branch-deps.marker')), false, "the branch's own commands.depInstall ran");
  assert.ok(existsSync(join(copy, 'deps.marker')), "the main checkout's commands.depInstall did not run");
  assert.equal((await runGit(f.b, ['for-each-ref'])).stdout, originBefore, '--existing changed origin');
});

test('(E6) --existing --no-bootstrap on an honest branch populates the clone and installs nothing', async (t) => {
  const f = await reproFixture(t);
  await pushAs(f, await plumbCommit(f, [{ path: 'src/e6.txt', content: 'e6\n' }], 'E6'), 'feat/e6');

  const result = await f.create(['--existing', '--no-bootstrap', 'feat/e6']);

  assert.equal(result.status, 0, `expected exit 0, got ${result.status}\n${output(result)}`);
  const copy = f.copyOf('feat/e6');
  await assertClone(f, copy, 'feat/e6');
  assert.equal(readFileSync(join(copy, 'src', 'e6.txt'), 'utf8'), 'e6\n', 'the copy was not populated');
  assert.equal((await runGit(copy, ['status', '--porcelain'])).stdout, '', 'the populated copy is not clean');
  assert.equal(existsSync(join(copy, 'deps.marker')), false, '--no-bootstrap ran the dependency install');
});

test('(E7) --existing refuses a payload branch even when the local default-branch refs point at it', async (t) => {
  const f = await reproFixture(t);
  const commit = await plumbCommit(f, [{ path: '.claude/settings.json', content: '{}\n' }], 'E7');
  await pushAs(f, commit, 'feat/e7');
  await runGit(f.d, ['update-ref', 'refs/remotes/origin/trunk', commit]);
  await runGit(f.d, ['update-ref', 'refs/heads/trunk', commit]);

  const result = await f.create(['--existing', 'feat/e7']);

  await assertRefusedClean(f, result, 'feat/e7', '.claude/settings.json');
});

test('(E8) default mode refuses to cut from a forged origin/<default> when origin is unreachable', async (t) => {
  const f = await reproFixture(t);
  const commit = await plumbCommit(
    f,
    [
      { path: '.claude/settings.json', content: '{}\n' },
      { path: 'githooks/post-checkout', content: markerHook(f, 'E8'), mode: '100755' },
    ],
    'E8',
  );
  await runGit(f.d, ['update-ref', 'refs/remotes/origin/trunk', commit]);
  await runGit(f.d, ['config', 'remote.origin.url', join(f.w, 'missing.git')]);

  const result = await f.create(['feat/f']);

  await assertRefusedClean(f, result, 'feat/f', '.claude/settings.json');
  assert.match(result.stderr, /origin/);
});

test('(E9) default mode cuts the trusted base as stored, past a replace ref planted on it', async (t) => {
  const f = await reproFixture(t);
  const originTip = (await runGit(f.b, ['rev-parse', 'refs/heads/trunk'])).stdout.trim();
  const blob = await sh(f.d, 'printf "%s" "$1" | git hash-object -w --stdin', ['{"planted":true}']);
  const claude = await sh(f.d, 'printf "100644 blob %s\tsettings.json\n" "$1" | git mktree', [blob]);
  const root = await sh(f.d, 'printf "040000 tree %s\t.claude\n" "$1" | git mktree', [claude]);
  const planted = await sh(f.d, 'git commit-tree "$1" -m planted', [root]);
  await runGit(f.d, ['update-ref', `refs/replace/${originTip}`, planted]);

  const result = await f.create(['--no-bootstrap', 'feat/r']);

  assert.equal(result.status, 0, `create-worktree.sh exited ${result.status}\n${output(result)}`);
  const settings = join(f.copyOf('feat/r'), '.claude', 'settings.json');
  assert.equal(existsSync(settings), false, `the copy holds ${existsSync(settings) ? readFileSync(settings, 'utf8') : ''}`);
});
