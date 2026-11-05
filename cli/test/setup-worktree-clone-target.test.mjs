/**
 * The shipped `setup-worktree.sh --target`, run as the main checkout's copy, on a clone.
 *
 * **The rule these tests exist to enforce: `setup-worktree.sh --target`, run as the main checkout's
 * copy, writes a clone's hooks path into that clone's own configuration and nothing into the main
 * checkout's; a clone so configured is still trusted; and an unregistered directory is refused before
 * anything is written.** One control gives a linked worktree as the target and expects the worktree
 * arm's two writes unchanged.
 *
 * The fixture is built by hand, as `cli/test/wrapper-clone-arm.test.mjs` builds its own, and the
 * clone is the one `hr_clone_create_var` makes. `commands.depInstall` and `commands.build` are unset,
 * so no command runs.
 */

import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

const output = (result) => `${result.stdout}\n${result.stderr}`;

/**
 * A main checkout on `trunk` carrying `harness.config.json`, `githooks/pre-push` and
 * `scripts/setup-worktree.sh` with its `lib/`, and the clone of {@link BRANCH} `hr_clone_create_var`
 * makes at `<root>/main-feat_c`.
 *
 * @param {import('node:test').TestContext} t
 */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'setup-clone-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const main = join(root, 'main');
  await mkdir(join(main, 'githooks'), { recursive: true });
  await runGit(main, ['init', '--quiet', '-b', 'trunk']);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(join(main, 'harness.config.json'), `${JSON.stringify(CONFIG)}\n`);
  await writeFile(join(main, 'githooks', 'pre-push'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 });
  await mkdir(join(main, 'scripts'));
  await cp(join(TEMPLATE_SCRIPTS, 'setup-worktree.sh'), join(main, 'scripts', 'setup-worktree.sh'));
  await cp(join(TEMPLATE_SCRIPTS, 'lib'), join(main, 'scripts', 'lib'), { recursive: true });
  await runGit(main, ['add', 'harness.config.json', 'githooks', 'scripts']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
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

  return {
    root,
    main,
    clone: join(root, `main-${BRANCH}`),
    mainConfig: () => readFile(join(main, '.git', 'config')),
    setup: (target) => runBash(root, [join(main, 'scripts', 'setup-worktree.sh'), '--target', target]),
    /** `git config --file <file> --get <key>`'s exit status and trimmed stdout. */
    get: async (file, key) => {
      const r = await runBash(root, ['-c', 'git -C / config --file "$1" --get "$2"', 'get', file, key]);
      return { status: r.status, value: r.stdout.trim() };
    },
  };
}

test('(a) A clone target takes core.hooksPath in its own .git/config, the main checkout’s is untouched, and it is still trusted', async (t) => {
  const f = await fixture(t);
  const before = await f.mainConfig();
  const hooks = join(f.clone, 'githooks');
  const result = await f.setup(f.clone);
  assert.equal(result.status, 0, output(result));
  assert.ok(
    result.stdout.includes(`setup-worktree.sh: pre-push hook installed (core.hooksPath -> ${hooks})`),
    output(result),
  );
  assert.ok((await f.mainConfig()).equals(before), 'the main checkout’s .git/config changed');
  const mainConfigFile = join(f.main, '.git', 'config');
  assert.equal((await f.get(mainConfigFile, 'extensions.worktreeConfig')).status, 1);
  assert.equal((await f.get(mainConfigFile, 'core.hooksPath')).status, 1);
  assert.deepEqual(await f.get(join(f.clone, '.git', 'config'), 'core.hooksPath'), { status: 0, value: hooks });

  const checked = await runBash(f.root, [
    '-c',
    '. "$1" || exit 99; hr_wrapper_target_check_var "$2" "$3" || { printf "%s\\n" "$HR_TARGET_REFUSAL" >&2; exit 1; }; printf "%s\\n" "$HR_TARGET_KIND"',
    'hr',
    LIB,
    f.main,
    f.clone,
  ]);
  assert.equal(checked.status, 0, output(checked));
  assert.equal(checked.stdout.trim(), 'clone');
});

test('(b) An unregistered repository at another branch’s derived path is refused and its .git/config is unchanged', async (t) => {
  const f = await fixture(t);
  const scratch = join(f.root, 'main-feat_s');
  await runGit(f.root, ['clone', '--quiet', '-b', 'trunk', f.main, scratch]);
  await runGit(scratch, ['checkout', '--quiet', '-b', 'feat_s']);
  const scratchConfig = join(scratch, '.git', 'config');
  const before = await readFile(scratchConfig);
  const mainBefore = await f.mainConfig();
  const result = await f.setup(scratch);
  assert.equal(result.status, 1, output(result));
  assert.match(result.stderr, / — refusing to bootstrap$/m, output(result));
  assert.ok((await readFile(scratchConfig)).equals(before), 'the scratch repository’s .git/config changed');
  assert.ok((await f.mainConfig()).equals(mainBefore), 'the main checkout’s .git/config changed');
});

test('(c) A linked worktree target still takes extensions.worktreeConfig in the main checkout and core.hooksPath in its config.worktree', async (t) => {
  const f = await fixture(t);
  const wt = join(f.root, 'wt');
  await runGit(f.main, ['worktree', 'add', '--quiet', '-b', 'feat_w', wt]);
  const hooks = join(wt, 'githooks');
  const result = await f.setup(wt);
  assert.equal(result.status, 0, output(result));
  assert.ok(
    result.stdout.includes(`setup-worktree.sh: pre-push hook installed (core.hooksPath -> ${hooks})`),
    output(result),
  );
  assert.deepEqual(await f.get(join(f.main, '.git', 'config'), 'extensions.worktreeConfig'), {
    status: 0,
    value: 'true',
  });
  assert.deepEqual(await f.get(join(f.main, '.git', 'worktrees', 'wt', 'config.worktree'), 'core.hooksPath'), {
    status: 0,
    value: hooks,
  });
});
