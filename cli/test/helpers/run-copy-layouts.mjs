/**
 * The run-copy layouts `hc_main_root` and the change-request fence are graded in: a main checkout
 * and every working copy that can stand beside it, built once per call under the system temp
 * directory.
 *
 * **The rule this module exists to enforce: each layout differs from a registered run clone in
 * exactly one condition, so a refusal in a case is the work of the check that case targets.** The
 * registered clones are made by the shipped `hr_clone_create_var`, sourced from
 * `cli/templates/scripts/lib/harness-run-lib.sh`, so the registry record and the run-copy path are
 * the ones a real run writes rather than a hand-built imitation of them; the unregistered clone sits
 * at the same derived path with no record, and the two broken clones are registered ones with only
 * their `alternates` file rewritten.
 *
 * Every child runs through {@link runBash} / {@link runGit}, so it gets the isolated environment —
 * the main-checkout anchor blanked among it — and nothing here spreads `process.env`.
 */

import { appendFile, mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { WORKSPACE_ROOT, runBash, runGit } from './fixture.mjs';

/** The shipped run library, sourced in place. */
export const RUN_LIB = join(WORKSPACE_ROOT, 'cli', 'templates', 'scripts', 'lib', 'harness-run-lib.sh');

/** The layouts' main branch. */
export const LAYOUT_BASE = 'trunk';

/** The main checkout's `stateDir` — not the schema default, so a default-path read fails by name. */
export const LAYOUT_STATE_DIR = 'run-state';

/**
 * `hr_clone_create_var <main> <branch> trunk` from {@link RUN_LIB}; resolves the clone's path.
 *
 * @param {string} cwd
 * @param {string} main
 * @param {string} branch
 * @param {string} state an `XDG_STATE_HOME` under the fixture root, so no machine state is touched.
 * @returns {Promise<string>}
 */
export async function createRegisteredClone(cwd, main, branch, state) {
  const result = await runBash(
    cwd,
    [
      '-c',
      '. "$1" || exit 99; hr_clone_create_var "$2" "$3" "$4" || { printf "%s\\n" "$HR_CLONE_REFUSAL" >&2; exit 1; }; printf "%s\\n" "$HR_CLONE_DIR"',
      '_',
      RUN_LIB,
      main,
      branch,
      LAYOUT_BASE,
    ],
    { XDG_STATE_HOME: state },
  );
  if (result.status !== 0) {
    throw new Error(`fixture setup: hr_clone_create_var ${branch} exited ${result.status}: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

/**
 * Build every layout under one `realpath`-resolved temp root, removed in `t.after`.
 *
 * @param {import('node:test').TestContext} t
 * @returns {Promise<{
 *   root: string, main: string, worktree: string, registeredClone: string,
 *   unregisteredClone: string, twoLineClone: string, selfClone: string, plain: string,
 * }>} absolute physical paths.
 */
export async function buildRunCopyLayouts(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'run-copy-layouts-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const state = join(root, 'xdg-state');
  const main = join(root, 'main');

  await mkdir(main);
  await runGit(main, ['init', '--quiet', '-b', LAYOUT_BASE]);
  await runGit(main, ['config', 'user.email', 'fixture@example.invalid']);
  await runGit(main, ['config', 'user.name', 'Harness Fixture']);
  await writeFile(
    join(main, 'harness.config.json'),
    `${JSON.stringify({ version: 1, defaultBranch: LAYOUT_BASE, stateDir: `${LAYOUT_STATE_DIR}/` })}\n`,
  );
  await writeFile(join(main, '.gitignore'), `${LAYOUT_STATE_DIR}/\n`);
  await runGit(main, ['add', 'harness.config.json', '.gitignore']);
  await runGit(main, ['commit', '--quiet', '-m', 'fixture: seed']);
  await mkdir(join(main, LAYOUT_STATE_DIR, 'autonomous_logs'), { recursive: true });

  const worktree = join(root, 'wt');
  await runGit(main, ['worktree', 'add', '--quiet', '-b', 'feat_wt', worktree]);

  const registeredClone = await createRegisteredClone(root, main, 'feat_reg', state);

  // `hr_worktree_dir`'s path for `feat_unreg`, with no projectName configured: `<root>/main-<branch>`.
  const unregisteredClone = join(root, 'main-feat_unreg');
  await runGit(root, ['clone', '--quiet', '--shared', main, unregisteredClone]);
  await runGit(unregisteredClone, ['checkout', '--quiet', '-b', 'feat_unreg']);

  const twoLineClone = await createRegisteredClone(root, main, 'feat_two', state);
  await appendFile(join(twoLineClone, '.git', 'objects', 'info', 'alternates'), `${main}/.git/objects\n`);

  const selfClone = await createRegisteredClone(root, main, 'feat_self', state);
  await writeFile(join(selfClone, '.git', 'objects', 'info', 'alternates'), `${selfClone}/.git/objects\n`);

  const plain = join(root, 'plain');
  await mkdir(plain);
  await runGit(plain, ['init', '--quiet']);

  return { root, main, worktree, registeredClone, unregisteredClone, twoLineClone, selfClone, plain };
}
