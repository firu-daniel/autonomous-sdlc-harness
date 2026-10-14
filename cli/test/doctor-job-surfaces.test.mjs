/**
 * `doctor --job-surfaces=<branch>[@<commit>]`, against the compiled CLI on a clone checked out on a
 * pushed run branch.
 *
 * **The rule this suite enforces: a branch whose own commits changed a path the job runs or loads is
 * refused before the job trusts it, and the trusted configuration is the default branch's.** Each
 * case builds a bare origin, a default branch carrying `harness.config.json`, a run branch pushed
 * over it, and a clone checked out on the run branch with `refs/remotes/origin/*` fetched. No case
 * reaches the network.
 *
 * RED ONCE — each mutation applied once to `cli/src/doctor/checks.ts`, the file run, the failure
 * observed, the mutation reverted:
 * - the configuration read from `HEAD` instead of the option's branch → "the branch rewrote its
 *   config" fails: `expected exit 1, got 0`.
 * - `harness.config.json` filtered out of `jobSurfacePaths`' answer → "a branch commit changing
 *   harness.config.json" and "the branch rewrote its config" fail: `expected exit 1, got 0`.
 * - the comparison taken from `refs/remotes/origin/<defaultBranch>` instead of the merge base →
 *   "merged default" fails: `expected exit 0, got 1`.
 * - `refs/remotes/origin/<defaultBranch>` as the base and `refs/remotes/origin/<branch>` as the
 *   configuration's ref even under `@<commit>` → "a forged base", subtest `.claude/settings.json`,
 *   fails: `expected exit 1, got 0`.
 */

import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { it } from 'node:test';

import { concurrentSuite } from './helpers/concurrency.mjs';
import { runCli, runGit } from './helpers/fixture.mjs';

const DEFAULT_BRANCH = 'main';
const RUN_BRANCH = 'harness/run-1';
const CONFIG_FILE = 'harness.config.json';

const CONFIG = {
  version: 1,
  projectName: 'demo',
  defaultBranch: DEFAULT_BRANCH,
  stateDir: 'sdlc-harness/',
  scriptsDir: 'scripts',
  githooksDir: 'githooks',
  layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
  commands: { typecheck: 'true', test: 'true' },
};

/** The default branch's tree: the configuration, every surface a case edits, and files that are none. */
const SEED_FILES = Object.freeze({
  [CONFIG_FILE]: `${JSON.stringify(CONFIG, null, 2)}\n`,
  'src/app.txt': 'app\n',
  'scripts/autonomous-watcher.sh': '#!/usr/bin/env bash\n',
  'scripts/lib/harness-run-lib.sh': '#!/usr/bin/env bash\n',
  'scripts/own-tool.sh': '#!/usr/bin/env bash\n',
  '.claude/settings.json': '{}\n',
  '.claude/settings.autonomous.json': '{}\n',
  '.mcp.json': '{}\n',
  'githooks/pre-push': '#!/usr/bin/env bash\n',
});

/** The surfaces whose change on the run branch is refused, one case each. */
const SURFACES = Object.freeze([
  'scripts/autonomous-watcher.sh',
  'scripts/lib/harness-run-lib.sh',
  '.claude/settings.json',
  '.mcp.json',
  'githooks/pre-push',
  '.claude/settings.autonomous.json',
  CONFIG_FILE,
]);

/** Write `files` (relative path → text) under `dir`. */
async function writeFiles(dir, files) {
  for (const [relative, text] of Object.entries(files)) {
    const path = join(dir, relative);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text, 'utf8');
  }
}

/** Stage everything in `dir` and commit it. */
async function commit(dir, message) {
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '-m', message]);
}

/**
 * A bare origin and a `work` checkout whose `main` carries `seedFiles` and is pushed, with the run
 * branch created from it. Torn down after `t`.
 */
async function originFixture(t, seedFiles = SEED_FILES) {
  const root = realpathSync(await mkdtemp(join(tmpdir(), 'doctor-job-surfaces-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const work = join(root, 'work');
  await mkdir(origin);
  await runGit(origin, ['init', '--quiet', '--bare']);
  await mkdir(work);
  await runGit(work, ['init', '--quiet', '-b', DEFAULT_BRANCH]);
  await runGit(work, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(work, ['config', 'user.name', 'fixture']);
  await runGit(work, ['remote', 'add', 'origin', origin]);
  await writeFiles(work, seedFiles);
  await commit(work, 'seed');
  await runGit(work, ['push', '--quiet', 'origin', DEFAULT_BRANCH]);
  await runGit(work, ['checkout', '--quiet', '-b', RUN_BRANCH]);
  return { root, origin, work };
}

/** Push both branches from `work`, then clone `origin` and check the run branch out. Returns the clone. */
async function cloneOnRunBranch({ root, origin, work }) {
  await runGit(work, ['push', '--quiet', 'origin', DEFAULT_BRANCH, RUN_BRANCH]);
  const clone = join(root, 'clone');
  await runGit(root, ['clone', '--quiet', origin, clone]);
  await runGit(clone, ['checkout', '--quiet', '-b', RUN_BRANCH, `origin/${RUN_BRANCH}`]);
  return clone;
}

/** The run branch with one commit editing `relative`, cloned. */
async function branchChanging(t, relative) {
  const fixture = await originFixture(t);
  await writeFiles(fixture.work, { [relative]: `${SEED_FILES[relative] ?? ''}changed on the run branch\n` });
  await commit(fixture.work, `change ${relative}`);
  return { ...fixture, clone: await cloneOnRunBranch(fixture) };
}

/** `doctor --job-surfaces=<value>` in `clone`. */
function jobSurfaces(clone, value) {
  return runCli(clone, ['doctor', `--job-surfaces=${value}`]);
}

/** The run's whole output, for a message assertion. */
function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}

function assertExit(result, status) {
  assert.equal(result.status, status, `expected exit ${status}, got ${result.status}\n${output(result)}`);
}

/** Exit 1 with one failing `job-surfaces` line whose text carries every one of `needles`. */
function assertRefused(result, ...needles) {
  assertExit(result, 1);
  const text = output(result);
  assert.match(text, /FAIL\s+job-surfaces/);
  for (const needle of needles) assert.ok(text.includes(needle), `expected ${JSON.stringify(needle)} in\n${text}`);
}

/** Exit 0 with exactly the one check run, and passing. */
function assertPassed(result) {
  assertExit(result, 0);
  assert.match(result.stdout, /Summary: 1 pass, 0 warn, 0 fail/);
}

concurrentSuite('doctor --job-surfaces', () => {
  it('passes an honest branch that changed only src/', async (t) => {
    const { clone } = await branchChanging(t, 'src/app.txt');
    assertPassed(await jobSurfaces(clone, DEFAULT_BRANCH));
  });

  for (const surface of SURFACES) {
    it(`fails a branch commit changing ${surface}, naming it`, async (t) => {
      const { clone } = await branchChanging(t, surface);
      assertRefused(await jobSurfaces(clone, DEFAULT_BRANCH), surface);
    });
  }

  // The default branch changes `.mcp.json` again after the merge, so a comparison from its tip rather
  // than from the merge base sees a difference the branch did not make.
  it('passes a branch that merged a newer default branch which itself changed .mcp.json (merged default)', async (t) => {
    const fixture = await originFixture(t);
    const { work } = fixture;
    await writeFiles(work, { 'src/app.txt': 'branch work\n' });
    await commit(work, 'branch work');
    await runGit(work, ['checkout', '--quiet', DEFAULT_BRANCH]);
    await writeFiles(work, { '.mcp.json': '{"mcpServers":{}}\n' });
    await commit(work, 'default branch changes .mcp.json');
    await runGit(work, ['checkout', '--quiet', RUN_BRANCH]);
    await runGit(work, ['merge', '--quiet', '--no-ff', '--no-edit', DEFAULT_BRANCH]);
    await runGit(work, ['checkout', '--quiet', DEFAULT_BRANCH]);
    await writeFiles(work, { '.mcp.json': '{"mcpServers":{"later":{}}}\n' });
    await commit(work, 'default branch changes .mcp.json after the merge');
    await runGit(work, ['checkout', '--quiet', RUN_BRANCH]);
    const clone = await cloneOnRunBranch(fixture);
    assertPassed(await jobSurfaces(clone, DEFAULT_BRANCH));
  });

  it("still fails a branch that rewrote its config's defaultBranch to itself (the branch rewrote its config)", async (t) => {
    const fixture = await originFixture(t);
    await writeFiles(fixture.work, {
      [CONFIG_FILE]: `${JSON.stringify({ ...CONFIG, defaultBranch: RUN_BRANCH }, null, 2)}\n`,
    });
    await commit(fixture.work, 'point defaultBranch at the run branch');
    const clone = await cloneOnRunBranch(fixture);
    assertRefused(await jobSurfaces(clone, DEFAULT_BRANCH), CONFIG_FILE);
  });

  it("passes a change to the adopter's own script under scripts/", async (t) => {
    const { clone } = await branchChanging(t, 'scripts/own-tool.sh');
    assertPassed(await jobSurfaces(clone, DEFAULT_BRANCH));
  });

  it("fails when the option's branch carries no configuration", async (t) => {
    const { [CONFIG_FILE]: _omitted, ...withoutConfig } = SEED_FILES;
    const fixture = await originFixture(t, withoutConfig);
    await writeFiles(fixture.work, { 'src/app.txt': 'branch work\n' });
    await commit(fixture.work, 'branch work');
    const clone = await cloneOnRunBranch(fixture);
    assertRefused(await jobSurfaces(clone, DEFAULT_BRANCH), `refs/remotes/origin/${DEFAULT_BRANCH}:${CONFIG_FILE}`);
  });

  it("fails on an unparsable configuration on the option's branch, naming the ref it was read from", async (t) => {
    const fixture = await originFixture(t, { ...SEED_FILES, [CONFIG_FILE]: '{ not json\n' });
    await writeFiles(fixture.work, { 'src/app.txt': 'branch work\n' });
    await commit(fixture.work, 'branch work');
    const clone = await cloneOnRunBranch(fixture);
    assertRefused(
      await jobSurfaces(clone, DEFAULT_BRANCH),
      `refs/remotes/origin/${DEFAULT_BRANCH}:${CONFIG_FILE} is not valid JSON`,
    );
  });

  it('fails a forged base under @<commit> naming .claude/settings.json, and passes the honest branch in the same form', async (t) => {
    for (const [changed, refused] of [
      ['.claude/settings.json', true],
      ['src/app.txt', false],
    ]) {
      await t.test(changed, async (st) => {
        const { clone } = await branchChanging(st, changed);
        const trusted = (await runGit(clone, ['rev-parse', `refs/remotes/origin/${DEFAULT_BRANCH}`])).stdout.trim();
        const tip = (await runGit(clone, ['rev-parse', 'HEAD'])).stdout.trim();
        await runGit(clone, ['update-ref', `refs/remotes/origin/${DEFAULT_BRANCH}`, tip]);
        const result = await jobSurfaces(clone, `${DEFAULT_BRANCH}@${trusted}`);
        if (refused) assertRefused(result, changed);
        else assertPassed(result);
      });
    }
  });

  it('fails an @<commit> the clone does not hold, naming it', async (t) => {
    const { clone } = await branchChanging(t, 'src/app.txt');
    const unknown = 'deadbeef'.repeat(5);
    assertRefused(await jobSurfaces(clone, `${DEFAULT_BRANCH}@${unknown}`), unknown);
  });
});
