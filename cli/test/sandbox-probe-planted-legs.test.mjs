/**
 * The sandbox probe's planted-config refusal grading (`sp__pc_refusal` in `legs-planted.sh`), run over recorded
 * streams of CS15's shape: a push then a commit through the main checkout's wrappers.
 *
 * **The rule these tests exist to enforce: a planted-config row passes only on the wrapper's own refusal line; a
 * wrapper call refused at the permission layer never reached the wrapper and is `not run`; any other refusal of
 * the main wrapper is `fail`. From PD25, `sp__pf_inert_worktree_config` (`legs-planted-files.sh`) accepts
 * exactly the `config.worktree` shape `hr_run_copy_check_var` accepts: a regular, non-link, empty file with
 * `extensions.worktreeConfig` absent or false.**
 *
 * Every case sources libraries and reads a fixture or its own temporary repository: none plants a config,
 * starts a session or runs a wrapper.
 * Fixtures are passed unsubstituted, since each call is matched byte-equal against a command that spells
 * `@FIXTURE_ROOT@` the same way.
 */

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');
const LIBS = ['core.sh', 'judge.sh', 'controls.sh', 'legs-planted.sh'];
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');

const CS15_PUSH = 'bash @FIXTURE_ROOT@/scripts/push-branch.sh @FIXTURE_ROOT@/clone_cfg';
const CS15_COMMIT =
  'bash @FIXTURE_ROOT@/scripts/commit-on-branch.sh --repo @FIXTURE_ROOT@/clone_cfg sbx_pc_cs15.txt -- "chore: Sandbox probe CS15"';
const CS15_WANT =
  "@FIXTURE_ROOT@/clone_cfg/.git/config sets sbx.cs15, which the clone allow-list does not hold, so this clone's configuration is not trusted";
const DD_CMD = 'dd if=/dev/zero of=@FIXTURE_ROOT@/outside/probe bs=1 count=1';
const DONT_ASK = "Permission to use Bash has been denied because Claude Code is running in don't ask mode.";

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

/** Runs `sp__pc_refusal "$@"` and returns `<SP__PC_RV>|<SP__PC_RE>`. */
async function refusal(t, stream, cmd, prefix, want) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-planted-legs-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const libs = LIBS.map((f) => join(PROBE_LIB, f));
  const body = 'sp__pc_refusal "$@"; printf \'%s|%s\' "$SP__PC_RV" "$SP__PC_RE"';
  const run = await runBash(
    dir,
    ['-c', `. "$1"; . "$2"; . "$3"; . "$4"; shift 4; ${body}`, '_', ...libs, stream, cmd, prefix, want],
    { SP_VERSION: '' },
  );
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
}

test('sp__pc_refusal: a planted-config row passes only on the wrapper’s own refusal line', async (t) => {
  await t.test('a push refused at the permission layer is not run', async (t) => {
    assert.equal(
      await refusal(t, fixture('cs15-permission'), CS15_PUSH, 'refusing to push:', CS15_WANT),
      `not run|refused at the permission layer, so it never reached the wrapper: ${DONT_ASK}`,
    );
  });

  await t.test('a commit answered with the wrapper’s own refusal line passes, quoting it', async (t) => {
    assert.equal(
      await refusal(t, fixture('cs15-permission'), CS15_COMMIT, 'refusing to commit:', CS15_WANT),
      `pass|commit-on-branch.sh: refusing to commit: ${CS15_WANT}`,
    );
  });

  await t.test('a sandbox refusal of the call fails', async (t) => {
    assert.equal(
      await refusal(t, fixture('sandbox-dd'), DD_CMD, 'refusing to commit:', CS15_WANT),
      'fail|the wrapper did not run: refused at sandbox: dd: @FIXTURE_ROOT@/outside/probe: Operation not permitted',
    );
  });
});

test('PD25: sp__pf_inert_worktree_config accepts only the trust check’s inert config.worktree', async (t) => {
  /** A case-owned repository; `plant(path, dir)` shapes its `.git/config.worktree`. Returns the status. */
  async function inert(t, plant, worktreeConfig) {
    const dir = await mkdtemp(join(tmpdir(), 'harness-sp-planted-legs-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    await runGit(dir, ['init', '--quiet']);
    if (worktreeConfig !== undefined) {
      await runGit(dir, ['config', '--file', join(dir, '.git', 'config'), 'extensions.worktreeConfig', worktreeConfig]);
    }
    const path = join(dir, '.git', 'config.worktree');
    await plant(path, dir);
    const libs = [...LIBS, 'legs-planted-files.sh'].map((f) => join(PROBE_LIB, f));
    const run = await runBash(
      dir,
      ['-c', '. "$1"; . "$2"; . "$3"; . "$4"; . "$5"; shift 5; sp__pf_inert_worktree_config "$@"; printf %s "$?"', '_', ...libs, path, dir],
      { SP_VERSION: '' },
    );
    assert.equal(run.stderr, '');
    return run.stdout;
  }
  const empty = (p) => writeFile(p, '');

  await t.test('an empty regular file with extensions.worktreeConfig absent is inert', async (t) => {
    assert.equal(await inert(t, empty), '0');
  });

  await t.test('an empty regular file with extensions.worktreeConfig false is inert', async (t) => {
    assert.equal(await inert(t, empty, 'false'), '0');
  });

  await t.test('a 1-byte file is not', async (t) => {
    assert.equal(await inert(t, (p) => writeFile(p, '\n')), '1');
  });

  await t.test('a symbolic link to an empty file is not', async (t) => {
    assert.equal(
      await inert(t, async (p, dir) => {
        await writeFile(join(dir, 'empty'), '');
        await symlink(join(dir, 'empty'), p);
      }),
      '1',
    );
  });

  await t.test('a directory is not', async (t) => {
    assert.equal(await inert(t, (p) => mkdir(p)), '1');
  });

  await t.test('an empty file with extensions.worktreeConfig true is not', async (t) => {
    assert.equal(await inert(t, empty, 'true'), '1');
  });

  await t.test('an empty file with extensions.worktreeConfig unparseable as a boolean is not', async (t) => {
    assert.equal(await inert(t, empty, 'maybe'), '1');
  });
});
