/**
 * `remote-run.sh adopt` and `adopt --list`: a local registry record and mirror working copy for a run
 * started on GitHub, which no local watcher dispatched.
 *
 * **The rule these tests exist to enforce: adopt writes a record and a mirror only for a live,
 * unprotected, unrecorded branch whose newest run is titled `harness run <branch>`, and `--list`
 * writes nothing.**
 *
 * Each case drives a fixture `init` wired, with `execution.target` set, the adopted tree pushed to
 * the fixture's bare `origin` as its default branch and `feat_x` pushed beside it, so
 * `create-worktree.sh --existing` checks out a real sibling working copy. `commands.depInstall` and
 * `commands.build` are removed so that copy's bootstrap installs nothing. `gh` is a recorder stub
 * reached through `HARNESS_GH_CLI` whose `run list` answers a fixed set of runs, filtered by
 * `--branch` when one is given. No case reaches the network.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = 'scripts/remote-run.sh';
const STATE_DIR = 'sdlc-harness';
const REGISTRY = `${STATE_DIR}/autonomous_logs/registry.json`;
const FEAT_X_URL = 'https://github.com/o/r/actions/runs/4';

const RUNS = [
  {
    databaseId: 4,
    headBranch: 'feat_x',
    displayTitle: 'harness run feat_x',
    status: 'in_progress',
    conclusion: '',
    createdAt: '2026-01-01T00:00:40Z',
    url: FEAT_X_URL,
  },
  {
    databaseId: 3,
    headBranch: 'feat_x',
    displayTitle: 'harness pause feat_x',
    status: 'completed',
    conclusion: 'success',
    createdAt: '2026-01-01T00:00:50Z',
    url: 'https://github.com/o/r/actions/runs/3',
  },
  {
    databaseId: 2,
    headBranch: 'feat_gone',
    displayTitle: 'harness run feat_gone',
    status: 'completed',
    conclusion: 'success',
    createdAt: '2026-01-01T00:00:20Z',
    url: 'https://github.com/o/r/actions/runs/2',
  },
  {
    databaseId: 1,
    headBranch: 'main',
    displayTitle: 'harness run main',
    status: 'completed',
    conclusion: 'success',
    createdAt: '2026-01-01T00:00:10Z',
    url: 'https://github.com/o/r/actions/runs/1',
  },
];

/** `gh`, recorded: each argument vector appended to `STUB_LOG`; a call starting `STUB_FAIL_ON` exits 4. */
const STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
const failOn = process.env.STUB_FAIL_ON;
if (failOn && args.join(' ').startsWith(failOn)) {
  process.stderr.write('stub gh failure\\n');
  process.exit(4);
}
if (args[0] === 'run' && args[1] === 'list') {
  const runs = ${JSON.stringify(RUNS)};
  const at = args.indexOf('--branch');
  const branch = at === -1 ? null : args[at + 1];
  process.stdout.write(JSON.stringify(branch === null ? runs : runs.filter((r) => r.headBranch === branch)));
}
`;

/**
 * An `init`-wired fixture adopted on `origin`'s default branch with `feat_x` beside it, `main` among
 * its protected branches, and a recorder stub.
 *
 * @param {import('node:test').TestContext} t
 * @param {string} [target]
 */
async function adoptFixture(t, target = 'github-actions') {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
    },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);

  const configPath = join(dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.execution = { target };
  config.protectedBranches = [...new Set([...(config.protectedBranches ?? []), 'main', config.defaultBranch])];
  delete config.commands.depInstall;
  delete config.commands.build;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  const worktree = join(dirname(dir), `${config.projectName}-feat_x`);
  t.after(() => rm(worktree, { recursive: true, force: true }));

  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '-m', 'fixture: adopt the harness']);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);
  await runGit(dir, ['push', '--quiet', '--force', '--no-verify', 'origin', 'HEAD:refs/heads/feat_x']);

  // Beside the fixture's state directory, which is gitignored, so neither is ever committed.
  const stubDir = join(dir, STATE_DIR, 'stub');
  mkdirSync(stubDir, { recursive: true });
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(stubDir, 'gh.log');
  const registry = join(dir, REGISTRY);

  return {
    dir,
    worktree,
    registry,
    adopt: (args = [], env = {}) =>
      runBash(dir, [SCRIPT, 'adopt', ...args], { HARNESS_GH_CLI: stub, STUB_LOG: log, ...env }),
    registryBytes: () => (existsSync(registry) ? readFileSync(registry, 'utf8') : null),
    record: (branch) => JSON.parse(readFileSync(registry, 'utf8')).runs[branch],
  };
}

test('adopt --list prints feat_x only and creates no registry', async (t) => {
  const f = await adoptFixture(t);
  const result = await f.adopt(['--list']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `remote-run.sh: not adopted: feat_x ${FEAT_X_URL}\n`);
  assert.equal(existsSync(f.registry), false, 'adopt --list created the registry');
  assert.equal(existsSync(f.worktree), false, 'adopt --list created a working copy');
});

test('adopt makes the mirror and a running github-actions record, and a second adopt finds nothing', async (t) => {
  const f = await adoptFixture(t);
  const result = await f.adopt();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /remote-run\.sh: adopted feat_x \(https:\/\/github\.com\/o\/r\/actions\/runs\/4\)/);

  assert.ok(existsSync(f.worktree), 'no mirror working copy');
  assert.equal((await runGit(f.worktree, ['symbolic-ref', '--short', 'HEAD'])).stdout.trim(), 'feat_x');

  const record = f.record('feat_x');
  assert.equal(record.execution, 'github-actions');
  assert.equal(realpathSync(record.worktree), realpathSync(f.worktree));
  assert.equal(record.status, 'running');
  assert.equal(record.engine, 'task');
  assert.match(record.remote_adopted_at, /^[0-9]+$/);
  const runs = JSON.parse(f.registryBytes()).runs;
  assert.deepEqual(Object.keys(runs), ['feat_x'], 'a run other than feat_x was adopted');

  const before = f.registryBytes();
  const again = await f.adopt();
  assert.equal(again.status, 0, again.stderr);
  assert.equal(again.stdout, 'remote-run.sh: nothing to adopt\n');
  assert.equal(f.registryBytes(), before);
});

test('a branch already recorded is skipped', async (t) => {
  const f = await adoptFixture(t);
  mkdirSync(dirname(f.registry), { recursive: true });
  const seeded = `${JSON.stringify({ runs: { feat_x: { branch: 'feat_x', execution: 'local' } } })}\n`;
  writeFileSync(f.registry, seeded);

  const list = await f.adopt(['--list']);
  assert.equal(list.status, 0, list.stderr);
  assert.equal(list.stdout, 'remote-run.sh: nothing to adopt\n');
  const result = await f.adopt();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'remote-run.sh: nothing to adopt\n');
  assert.equal(f.registryBytes(), seeded);
  assert.equal(existsSync(f.worktree), false);
});

test('execution.target local exits 2 and writes nothing', async (t) => {
  const f = await adoptFixture(t, 'local');
  const result = await f.adopt();
  assert.equal(result.status, 2, result.stderr);
  assert.equal(existsSync(f.registry), false);
  assert.equal(existsSync(f.worktree), false);
});

test('a failed run listing exits 3 and writes no registry', async (t) => {
  const f = await adoptFixture(t);
  for (const args of [[], ['--list']]) {
    const result = await f.adopt(args, { STUB_FAIL_ON: 'run list' });
    assert.equal(result.status, 3, result.stderr);
    assert.match(result.stderr, /stub gh failure/);
  }
  assert.equal(existsSync(f.registry), false);
  assert.equal(existsSync(f.worktree), false);
});

test('feat_x checked out in another working copy exits 4 with a could-not-adopt line', async (t) => {
  const f = await adoptFixture(t);
  const other = join(dirname(f.dir), `${Date.now()}-other-feat_x`);
  t.after(() => rm(other, { recursive: true, force: true }));
  await runGit(f.dir, ['fetch', '--quiet', 'origin', 'feat_x:feat_x']);
  await runGit(f.dir, ['worktree', 'add', '--quiet', other, 'feat_x']);

  const result = await f.adopt();
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /remote-run\.sh: could not adopt feat_x: create-worktree\.sh exited 2/);
  assert.equal(existsSync(f.worktree), false);
  assert.equal(f.registryBytes() === null || f.record('feat_x') === undefined, true, 'a record was written');
});

test('--list belongs to adopt, and adopt takes no branch', async (t) => {
  const f = await adoptFixture(t);
  assert.equal((await runBash(f.dir, [SCRIPT, 'sync', 'feat_x', '--list'])).status, 1);
  assert.equal((await f.adopt(['feat_x'])).status, 1);
});
