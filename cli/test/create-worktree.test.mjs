/**
 * `create-worktree.sh`: the default-mode cut, `--no-bootstrap`, and `--existing`, the copy the
 * watcher recreates for a branch a run wrote and `remote-run.sh review` places a review round in.
 *
 * **The rules these tests exist to enforce: a no-bootstrap cut pushes the branch and installs
 * nothing; an `--existing --no-bootstrap` copy checks the branch out, installs nothing and pushes
 * nothing; `--existing` writes no tree, and runs no hook, whose protected surface differs from
 * origin's default branch, and bootstraps with the main checkout's `setup-worktree.sh` and
 * configuration; and default mode cuts from the commit origin reports, never from a local ref.**
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
 * RED ONCE — each mutation applied once to `cli/templates/scripts/create-worktree.sh` (E7: to
 * `lib/harness-run-lib.sh`), the file run, the failure observed, the mutation reverted:
 * - (E1) the surface check skipped and steps 6–8 replaced with the unpinned
 *   `git -C "$main_repo" worktree add "$worktree_dir" "$branch"` → fails `a payload hook ran`, the
 *   markers holding `E1.marker`.
 * - (E2) the same mutation → fails `githooks/post-checkout was written under …/demo-feat-e2`. The
 *   `post-checkout` marker did not appear: for the hook, a regression guard: the pre-hardening
 *   `--existing` did not reach this payload. The case's red is the planted file.
 * - (E3) the surface check skipped alone → fails on `.claude/settings.json` written under the copy.
 *   The same mutation leaves E1 and E2 without a marker, so the pins and `--no-checkout` alone keep
 *   their hooks from running.
 * - (E4) the surface check skipped alone → fails on `.mcp.json` written under the copy.
 * - (E5) the copy's `scripts/setup-worktree.sh` run in place of `$script_dir/setup-worktree.sh` →
 *   fails `the branch's own commands.depInstall ran`.
 * - (E6) the bootstrap run whatever `--no-bootstrap` says → fails `--no-bootstrap ran the
 *   dependency install`.
 * - (E7) `hr_run_surface_check_var`'s merge base taken against the local
 *   `refs/remotes/origin/<defaultBranch>` in place of `HR_RUN_TRUSTED_BASE` → fails on
 *   `.claude/settings.json` written under the copy.
 * - (E8) default mode's `show-ref` test of `refs/remotes/origin/<defaultBranch>` and the cut from
 *   `origin/$default_branch` restored in place of the trusted-base refusal → fails on
 *   `.claude/settings.json` written under the copy. The `post-checkout` marker did not appear: for
 *   the hook, a regression guard: the pre-hardening default mode did not reach this payload.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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

  return {
    w,
    b,
    d,
    markers,
    create: (args) => runBash(d, [join(d, 'scripts', 'create-worktree.sh'), ...args]),
    originHas: async (branch) =>
      (await runBash(b, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0,
    localHas: async (branch) =>
      (await runBash(d, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0,
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

/**
 * The refusal outcome every payload case shares: no hook ran, nothing planted was written, exit 2,
 * and nothing of the branch left anywhere. The payload assertions come first, so a mutation that lets
 * the payload through fails on the payload rather than on the exit status.
 */
async function assertRefusedClean(f, result, branch, rel) {
  const copy = join(f.w, `demo-${branch.replace('/', '-')}`);
  assert.deepEqual(readdirSync(f.markers), [], 'a payload hook ran');
  assert.deepEqual(plantedUnder(copy, rel), [], `${rel} was written under ${copy}`);
  assert.equal(result.status, 2, `expected exit 2, got ${result.status}\n${output(result)}`);
  assert.equal(existsSync(copy), false, `a directory was left at ${copy}`);
  assert.equal(await f.localHas(branch), false, `a local ${branch} was created`);
}

test('a --no-bootstrap cut pushes the branch and installs nothing', async (t) => {
  const f = await reproFixture(t);

  const { status, stdout, stderr } = await f.create(['--no-bootstrap', 'feat/q']);

  assert.equal(status, 0, `create-worktree.sh exited ${status}\n${stdout}\n${stderr}`);
  const copy = join(f.w, 'demo-feat-q');
  assert.ok(existsSync(join(copy, 'harness.config.json')), 'the working copy was not created');
  assert.equal(existsSync(join(copy, 'deps.marker')), false, 'a --no-bootstrap cut ran the dependency install');
  assert.equal((await runGit(copy, ['branch', '--show-current'])).stdout.trim(), 'feat/q');
  assert.ok(await f.originHas('feat/q'), 'origin does not carry feat/q');
  assert.match(stdout, /worktree ready at .*demo-feat-q \(not bootstrapped\)/);
  assert.match(stdout, /branch feat\/q \(pushed to origin\)/);
});

test('--existing --no-bootstrap checks out a branch only on origin, installs nothing, pushes nothing', async (t) => {
  const f = await reproFixture(t);
  await runGit(f.d, ['push', '--quiet', 'origin', 'trunk:refs/heads/feat/q']);
  assert.equal(await f.localHas('feat/q'), false, 'the fixture left a local feat/q');
  const originBefore = (await runGit(f.b, ['for-each-ref'])).stdout;

  for (const args of [
    ['--existing', '--no-bootstrap', 'feat/q'],
    ['--no-bootstrap', '--existing', 'feat/q'],
  ]) {
    const { status, stdout, stderr } = await f.create(args);
    assert.equal(status, 0, `${args.join(' ')} exited ${status}\n${stdout}\n${stderr}`);
    const copy = join(f.w, 'demo-feat-q');
    assert.equal((await runGit(copy, ['branch', '--show-current'])).stdout.trim(), 'feat/q');
    assert.equal(existsSync(join(copy, 'deps.marker')), false, `${args.join(' ')} ran the dependency install`);
    assert.match(stdout, /\(not bootstrapped\)/);
    assert.match(stdout, /branch feat\/q \(existing branch; not pushed\)/);
    assert.equal((await runGit(f.b, ['for-each-ref'])).stdout, originBefore, `${args.join(' ')} changed origin`);
    await runGit(f.d, ['worktree', 'remove', '--force', copy]);
    await runGit(f.d, ['branch', '-D', 'feat/q']);
  }
});

test('the default mode still bootstraps the copy before pushing', async (t) => {
  const f = await reproFixture(t);

  const { status, stdout, stderr } = await f.create(['feat/x']);

  assert.equal(status, 0, `create-worktree.sh exited ${status}\n${stdout}\n${stderr}`);
  assert.ok(existsSync(join(f.w, 'demo-feat-x', 'deps.marker')), 'the default mode did not run the dependency install');
  assert.ok(await f.originHas('feat/x'), 'origin does not carry feat/x');
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

test('(E5) an honest --existing branch is populated at its tip and bootstrapped from the main configuration', async (t) => {
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

  const result = await f.create(['--existing', 'feat/e5']);

  assert.equal(result.status, 0, `expected exit 0, got ${result.status}\n${output(result)}`);
  const copy = join(f.w, 'demo-feat-e5');
  assert.equal((await runGit(copy, ['rev-parse', 'HEAD'])).stdout.trim(), commit);
  assert.equal((await runGit(copy, ['branch', '--show-current'])).stdout.trim(), 'feat/e5');
  assert.equal(readFileSync(join(copy, 'src', 'e5.txt'), 'utf8'), 'e5\n', 'the copy was not populated');
  assert.equal((await runGit(copy, ['status', '--porcelain'])).stdout, '', 'the populated copy is not clean');
  assert.equal(existsSync(join(copy, 'branch-deps.marker')), false, "the branch's own commands.depInstall ran");
  assert.ok(existsSync(join(copy, 'deps.marker')), "the main checkout's commands.depInstall did not run");
});

test('(E6) --existing --no-bootstrap on an honest branch populates the copy and installs nothing', async (t) => {
  const f = await reproFixture(t);
  await pushAs(f, await plumbCommit(f, [{ path: 'src/e6.txt', content: 'e6\n' }], 'E6'), 'feat/e6');

  const result = await f.create(['--existing', '--no-bootstrap', 'feat/e6']);

  assert.equal(result.status, 0, `expected exit 0, got ${result.status}\n${output(result)}`);
  const copy = join(f.w, 'demo-feat-e6');
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
