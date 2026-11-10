/**
 * The shipped `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` on a registered clone
 * whose main checkout's `harness.config.json` cannot be resolved, driven as the permission profile
 * runs them: the MAIN checkout's copies, with the clone as their target.
 *
 * **The rule these tests exist to enforce: on a registered clone, the main checkout's three wrappers
 * name an unresolvable configuration with the same `cannot resolve '<main>/harness.config.json'` line
 * and exit status as on the main checkout, move no ref, and keep the clone arm's registry sentence
 * for a clone the readable registry does not record.** Each wrapper loads that configuration ahead of
 * its target check; a scratch repository is still refused by the target check, so the hoist did not
 * open it.
 *
 * Three unresolvable forms: (i) the file truncated, for which `hr_config_load` answers 2; (ii) the
 * file removed, for which it answers 1, "not adopted"; and (iii) a `jq` stand-in first on `PATH`
 * reporting `jq-1.4`, which answers 2. The fixture is `cli/test/wrapper-clone-arm.test.mjs` →
 * `fixture`'s, without its linked worktree.
 */

import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const TEMPLATE_SCRIPTS = join(PACKAGE_ROOT, 'templates', 'scripts');
const LIB = join(TEMPLATE_SCRIPTS, 'lib', 'harness-run-lib.sh');
const CONFIG = {
  version: 1,
  defaultBranch: 'trunk',
  protectedBranches: ['trunk'],
  stateDir: 'sdlc-harness/',
  githooksDir: 'githooks',
  layers: [],
  commands: {},
};
const BRANCH = 'feat_c';
const REF = `refs/heads/${BRANCH}`;
const IDENTITY = ['-c', 'user.name=Harness Fixture', '-c', 'user.email=fixture@example.invalid'];
const CAUSES = '  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)';
const COMMIT_REFUSED = /^commit-on-branch\.sh: refusing to commit: /m;
const COMMITTED = /^commit-on-branch\.sh: committed ([0-9a-f]+) on feat_c$/m;
const NO_CLONE_RECORD = /^commit-on-branch\.sh: refusing to commit: .*, and the run registry records no clone of .* at that path$/m;

const output = (result) => `${result.stdout}\n${result.stderr}`;
const lines = (text) => text.split('\n');

/**
 * A bare origin; a main checkout on `trunk` carrying `harness.config.json`, `githooks/`, `notes.txt`
 * and the three wrappers with their `lib/`, its `core.hooksPath` `githooks`; and the clone of
 * {@link BRANCH} `hr_clone_create_var` makes at `<root>/main-feat_c`.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'wrapper-clone-cfg-')));
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
  await writeFile(join(main, 'githooks', 'README'), 'hooks\n');
  await writeFile(join(main, 'notes.txt'), 'seeded notes\n');
  await mkdir(join(main, 'scripts'));
  for (const name of ['commit-on-branch.sh', 'push-branch.sh', 'refresh-branch.sh']) {
    await cp(join(TEMPLATE_SCRIPTS, name), join(main, 'scripts', name));
  }
  await cp(join(TEMPLATE_SCRIPTS, 'lib'), join(main, 'scripts', 'lib'), { recursive: true });
  await runGit(main, ['add', 'harness.config.json', 'githooks', 'notes.txt', 'scripts']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await runGit(main, ['config', 'core.hooksPath', 'githooks']);
  await runGit(main, ['remote', 'add', 'origin', origin]);
  await runGit(main, ['push', '--quiet', 'origin', 'trunk']);
  await mkdir(join(main, 'sdlc-harness', 'autonomous_logs'), { recursive: true });

  const created = await runBash(root, [
    '-c',
    '. "$1" || exit 99; hr_clone_create_var "$2" "$3" trunk || { printf "%s\\n" "$HR_CLONE_REFUSAL" >&2; exit 1; }',
    'hr',
    LIB,
    main,
    BRANCH,
  ]);
  assert.equal(created.status, 0, output(created));
  const clone = join(root, `main-${BRANCH}`);

  const script = (name) => join(main, 'scripts', name);
  const config = join(main, 'harness.config.json');
  const registry = join(main, 'sdlc-harness', 'autonomous_logs', 'registry.json');
  return {
    root,
    origin,
    main,
    clone,
    config,
    registry,
    commit: (target, paths, subject, env = {}) =>
      runBash(root, [script('commit-on-branch.sh'), '--repo', target, ...paths, '--', subject], env),
    push: (target, env = {}) => runBash(root, [script('push-branch.sh'), target], { PUSH_RETRY_DELAY_SECS: '0', ...env }),
    refresh: (args, env = {}) => runBash(root, [script('refresh-branch.sh'), ...args], env),
    tip: async (dir, ref = REF) => (await runGit(dir, ['rev-parse', '--verify', ref])).stdout.trim(),
    cloneStatus: async () => (await runGit(clone, ['status', '--porcelain', '--untracked-files=all'])).stdout,
    originRefs: async () => (await runGit(origin, ['for-each-ref'])).stdout,
    /** A commit on the main checkout's `trunk` setting `name`, pushed to origin. */
    advanceTrunk: async (name, content) => {
      await writeFile(join(main, name), content);
      await runGit(main, ['add', name]);
      await runGit(main, ['commit', '--quiet', '-m', `trunk: ${name}`]);
      await runGit(main, ['push', '--quiet', 'origin', 'trunk']);
    },
  };
}

/** Each form returns the environment the wrapper is called with and the step that undoes it. */
const FORMS = {
  '(i) truncated': async (f) => {
    const saved = await readFile(f.config, 'utf8');
    await writeFile(f.config, '{"version":');
    return { env: {}, restore: () => writeFile(f.config, saved) };
  },
  '(ii) absent': async (f) => {
    const saved = await readFile(f.config, 'utf8');
    await rm(f.config);
    return { env: {}, restore: () => writeFile(f.config, saved) };
  },
  '(iii) old jq': async (f) => {
    const dir = join(f.root, 'jq-shim');
    await mkdir(dir);
    await writeFile(join(dir, 'jq'), '#!/bin/sh\n[ "$1" = --version ] && { echo jq-1.4; exit 0; }\nexit 3\n', { mode: 0o755 });
    return { env: { PATH: `${dir}${delimiter}${process.env.PATH ?? ''}` }, restore: async () => {} };
  },
};

const commitLine = (f) => `commit-on-branch.sh: cannot resolve '${f.config}' — refusing to commit`;
const pushLine = (f) => `push-branch.sh: cannot resolve '${f.config}' — refusing to push`;
const refreshLine = (f) => `refresh-branch.sh: cannot resolve '${f.config}' — refusing to merge`;

test('(a) commit-on-branch.sh on the clone names the unresolvable configuration as it does on the main checkout', async (t) => {
  for (const [name, perturb] of Object.entries(FORMS)) {
    await t.test(name, async (t) => {
      const f = await fixture(t);
      await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
      const mainBefore = await f.tip(f.main);
      const cloneBefore = await f.tip(f.clone);
      const statusBefore = await f.cloneStatus();
      const { env, restore } = await perturb(f);

      const onClone = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes', env);
      assert.equal(onClone.status, 1, output(onClone));
      assert.ok(lines(onClone.stderr).includes(commitLine(f)), output(onClone));
      assert.ok(lines(onClone.stderr).includes(CAUSES), output(onClone));
      assert.doesNotMatch(onClone.stderr, COMMIT_REFUSED, output(onClone));
      assert.equal(await f.tip(f.main), mainBefore);
      assert.equal(await f.tip(f.clone), cloneBefore);
      assert.equal(await f.cloneStatus(), statusBefore);

      const onMain = await f.commit(f.main, ['notes.txt'], 'chore: edit notes', env);
      assert.equal(onMain.status, onClone.status, output(onMain));
      assert.equal(onMain.stderr, onClone.stderr);

      await restore();
      const healed = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
      assert.equal(healed.status, 0, output(healed));
      assert.match(healed.stdout, COMMITTED, output(healed));
      const moved = await f.tip(f.main);
      assert.notEqual(moved, mainBefore);
      assert.equal(await f.tip(f.clone), moved);
    });
  }
});

test('(b) A readable configuration whose registry records no clone keeps the registry sentence', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.clone, 'notes.txt'), 'edited\n');
  const doc = JSON.parse(await readFile(f.registry, 'utf8'));
  assert.ok(doc.runs[BRANCH], 'the fixture registers the clone');
  delete doc.runs[BRANCH];
  await writeFile(f.registry, `${JSON.stringify(doc)}\n`);
  const mainBefore = await f.tip(f.main);
  const cloneBefore = await f.tip(f.clone);

  const result = await f.commit(f.clone, ['notes.txt'], 'chore: edit notes');
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, NO_CLONE_RECORD, output(result));
  assert.equal(await f.tip(f.main), mainBefore);
  assert.equal(await f.tip(f.clone), cloneBefore);
});

test('(c) push-branch.sh on the clone prints the cannot-resolve line, exits 0 and pushes nothing', async (t) => {
  for (const [name, perturb] of Object.entries(FORMS)) {
    await t.test(name, async (t) => {
      const f = await fixture(t);
      const refsBefore = await f.originRefs();
      const { env } = await perturb(f);

      const onClone = await f.push(f.clone, env);
      assert.equal(onClone.status, 0, output(onClone));
      assert.ok(lines(onClone.stdout).includes(pushLine(f)), output(onClone));
      assert.equal(await f.originRefs(), refsBefore);

      const onMain = await f.push(f.main, env);
      assert.equal(onMain.status, 0, output(onMain));
      assert.ok(lines(onMain.stdout).includes(pushLine(f)), output(onMain));
      assert.equal(await f.originRefs(), refsBefore);
    });
  }
});

test('(d) refresh-branch.sh on the clone refuses with the cannot-resolve line and moves no ref', async (t) => {
  for (const [name, perturb] of Object.entries(FORMS)) {
    await t.test(name, async (t) => {
      const f = await fixture(t);
      await f.advanceTrunk('base.txt', 'base\n');
      const mainBefore = await f.tip(f.main);
      const cloneBefore = await f.tip(f.clone);
      const { env, restore } = await perturb(f);

      const result = await f.refresh([f.clone], env);
      assert.equal(result.status, 1, output(result));
      assert.ok(lines(result.stderr).includes(refreshLine(f)), output(result));
      assert.ok(lines(result.stderr).includes(CAUSES), output(result));
      assert.equal(await f.tip(f.main), mainBefore);
      assert.equal(await f.tip(f.clone), cloneBefore);

      await restore();
      const healed = await f.refresh([f.clone]);
      assert.equal(healed.status, 0, output(healed));
      assert.notEqual(await f.tip(f.clone), cloneBefore);
    });
  }
});

test('(e) With the configuration readable, a scratch repository is still refused by the target check', async (t) => {
  const f = await fixture(t);
  const scratch = join(f.root, 'scratch');
  await mkdir(scratch);
  await runGit(scratch, ['init', '--quiet', '-b', 'feat_s']);
  await runGit(scratch, [...IDENTITY, 'commit', '--quiet', '--allow-empty', '-m', 's']);
  await writeFile(join(scratch, 's.txt'), 's\n');
  const before = await f.tip(scratch, 'HEAD');

  const result = await f.commit(scratch, ['s.txt'], 'feat: s');
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, COMMIT_REFUSED, output(result));
  assert.equal(await f.tip(scratch, 'HEAD'), before);
});
