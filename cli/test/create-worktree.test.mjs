/**
 * `create-worktree.sh --no-bootstrap`, the branch cut a trigger job makes, and its `--existing`
 * form, the copy `remote-run.sh review` places a review round in.
 *
 * **The rule these tests exist to enforce: a no-bootstrap cut pushes the branch and installs
 * nothing; an `--existing --no-bootstrap` copy checks the branch out, installs nothing and pushes
 * nothing.** The default mode's case is the regression for the unchanged, bootstrapped path.
 *
 * Each case builds the script header's REPRO fixture under the system temp directory: a bare
 * `origin`, a committed `harness.config.json` whose `commands.depInstall` writes `deps.marker`, and
 * `create-worktree.sh`, `setup-worktree.sh` and `lib/` copied in from `cli/templates/scripts/` — the
 * shipped scripts carry no template token, so the copy is what `init` would write. No case reaches
 * the network.
 */

import assert from 'node:assert/strict';
import { existsSync, realpathSync } from 'node:fs';
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
 * The REPRO fixture: `w` holds `origin.git`, the `demo` checkout on `trunk`, and every sibling
 * working copy the script creates.
 *
 * @param {import('node:test').TestContext} t
 */
async function reproFixture(t) {
  const w = realpathSync(await mkdtemp(join(tmpdir(), 'create-worktree-')));
  t.after(() => rm(w, { recursive: true, force: true }));
  const b = join(w, 'origin.git');
  const d = join(w, 'demo');
  await mkdir(b);
  await runGit(b, ['init', '--quiet', '--bare']);
  await mkdir(d);
  await runGit(d, ['init', '--quiet', '-b', 'trunk']);
  await runGit(d, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(d, ['config', 'user.name', 'fixture']);
  await runGit(d, ['remote', 'add', 'origin', b]);
  await writeFile(join(d, 'harness.config.json'), JSON.stringify(CONFIG), 'utf8');
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
    create: (args) => runBash(d, [join(d, 'scripts', 'create-worktree.sh'), ...args]),
    originHas: async (branch) =>
      (await runBash(b, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0,
    localHas: async (branch) =>
      (await runBash(d, ['-c', 'git show-ref --verify --quiet "refs/heads/$1"', '_', branch])).status === 0,
  };
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
