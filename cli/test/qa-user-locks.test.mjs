/**
 * The plugin's `reserve-qa-user.sh` / `release-qa-user.sh` pair, driven from a main checkout and from
 * a linked worktree of it.
 *
 * **The rule these tests exist to enforce: the QA account lock set lives at
 * `<main checkout>/<stateDir>/qa_user_locks/` — the MAIN checkout's directory, with `stateDir` read
 * from the main checkout's `harness.config.json` — whichever working copy the script runs from, so a
 * reserve issued in a linked worktree and a release issued in the main checkout agree on one lock;
 * a reserve prints only the slot it claimed and exits 0, a held slot or a full set exits 3, and a
 * repository with no main checkout (a bare repository's worktree) makes a reserve exit 1 and a
 * release exit 0.**
 *
 * The fixture is built by hand rather than by `init`, so the configuration under test is exactly the
 * one written here. The worktree's own `harness.config.json` is rewritten to name a different
 * `stateDir`, so a lock landing in either working copy's own state directory — rather than the main
 * checkout's — fails the location assertion by name.
 *
 * Not covered: a submodule and a `--separate-git-dir` layout, the other two shapes the scripts
 * document as "no main checkout". Both reach the same `hc_main_root` refusal arm as the bare case
 * (a common directory not named `.git`), so the bare case stands for all three. The TTL reclaim and
 * the `jq`-absent arm are unchanged by the lock set's move and are not re-tested here.
 */

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { WORKSPACE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const SCRIPTS = join(WORKSPACE_ROOT, 'plugin', 'scripts');
const RESERVE = join(SCRIPTS, 'reserve-qa-user.sh');
const RELEASE = join(SCRIPTS, 'release-qa-user.sh');
const BASE = 'trunk';
const STATE_DIR = 'qa-state';
const CREDS = '.claude/qa-accounts.env';
const CONFIG = {
  version: 1,
  defaultBranch: BASE,
  stateDir: `${STATE_DIR}/`,
  phases: { qa: true },
  qa: { credentialsPath: CREDS },
};
const CREDENTIALS = [
  'HARNESS_QA_1_EMAIL=one@example.invalid',
  'HARNESS_QA_1_PASSWORD=x',
  'HARNESS_QA_2_EMAIL=two@example.invalid',
  'HARNESS_QA_2_PASSWORD=x',
  '',
].join('\n');

const output = (result) => `${result.stdout}\n${result.stderr}`;
const exists = async (path) => stat(path).then(() => true, () => false);

/**
 * A main checkout on `trunk` with the configuration and credentials committed, and a linked
 * worktree whose own configuration names a different `stateDir`.
 *
 * @param {import('node:test').TestContext} t
 */
async function lockFixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'qa-user-locks-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const main = join(root, 'main');
  const wt = join(root, 'wt');
  await mkdir(join(main, '.claude'), { recursive: true });
  await runGit(main, ['init', '--quiet', '-b', BASE]);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await writeFile(join(main, CREDS), CREDENTIALS);
  await runGit(main, ['add', 'harness.config.json', CREDS]);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['worktree', 'add', '--quiet', '-b', 'feat_w', wt]);
  await writeFile(
    join(wt, 'harness.config.json'),
    `${JSON.stringify({ ...CONFIG, stateDir: 'wt-state' })}\n`,
  );
  return {
    root,
    main,
    wt,
    lockSet: join(main, STATE_DIR, 'qa_user_locks'),
    run: (cwd, script, args = []) => runBash(cwd, [script, ...args]),
  };
}

test('(a) A reserve in a linked worktree parks the slot under the main checkout’s state directory', async (t) => {
  const f = await lockFixture(t);
  const result = await f.run(f.wt, RESERVE);
  assert.equal(result.status, 0, output(result));
  assert.equal(result.stdout, '1\n', output(result));
  assert.ok(await exists(join(f.lockSet, 'user_1')), `no lock at ${f.lockSet}/user_1`);
  assert.equal(await exists(join(f.wt, 'wt-state')), false, 'lock set created in the worktree’s state dir');
  assert.equal(await exists(join(f.wt, STATE_DIR)), false, 'lock set created in the worktree');
});

test('(b) A release in the main checkout removes the lock a worktree reserve took', async (t) => {
  const f = await lockFixture(t);
  const reserved = await f.run(f.wt, RESERVE);
  assert.equal(reserved.status, 0, output(reserved));
  assert.ok(await exists(join(f.lockSet, 'user_1')), `no lock at ${f.lockSet}/user_1`);
  const released = await f.run(f.main, RELEASE, ['1']);
  assert.equal(released.status, 0, output(released));
  assert.equal(released.stdout, 'release-qa-user: released account slot 1\n');
  assert.equal(await exists(join(f.lockSet, 'user_1')), false, 'lock still present after release');
});

test('(c) A held slot is busy from either working copy; the next free one is taken, then the set is full', async (t) => {
  const f = await lockFixture(t);
  assert.equal((await f.run(f.wt, RESERVE)).stdout, '1\n');

  const held = await f.run(f.main, RESERVE, ['1']);
  assert.equal(held.status, 3, output(held));
  assert.equal(held.stdout, '');

  const next = await f.run(f.main, RESERVE);
  assert.equal(next.status, 0, output(next));
  assert.equal(next.stdout, '2\n');
  assert.ok(await exists(join(f.lockSet, 'user_2')));

  const full = await f.run(f.wt, RESERVE);
  assert.equal(full.status, 3, output(full));
  assert.equal(full.stdout, '');
  assert.match(full.stderr, /all accounts busy/);
});

test('(d) A bare repository’s worktree has no main checkout: reserve exits 1, release exits 0', async (t) => {
  const f = await lockFixture(t);
  const bare = join(f.root, 'repo.git');
  const bareWt = join(f.root, 'bare-wt');
  await runGit(f.root, ['clone', '--quiet', '--bare', f.main, bare]);
  await runGit(bare, ['worktree', 'add', '--quiet', bareWt, BASE]);

  const reserved = await f.run(bareWt, RESERVE);
  assert.equal(reserved.status, 1, output(reserved));
  assert.equal(reserved.stdout, '');
  assert.match(reserved.stderr, /cannot resolve the main checkout/);
  assert.equal(await exists(join(bareWt, STATE_DIR)), false);

  const released = await f.run(bareWt, RELEASE, ['1']);
  assert.equal(released.status, 0, output(released));
  assert.match(released.stderr, /cannot resolve the main checkout/);
});
