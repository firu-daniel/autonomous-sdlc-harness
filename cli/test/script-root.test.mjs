/**
 * `hr_script_root`, sourced from the shipped run library, against fixture repositories whose
 * `scriptsDir` carries the placeholder `.git` a bubblewrap host leaves (F15).
 *
 * **The rule these tests exist to enforce: a script's root is the nearest ancestor holding
 * `harness.config.json` that `git -C` confirms as its own top, whatever stands at
 * `<scriptsDir>/.git`; `hr_wrapper_main_of`'s answers are unchanged.**
 *
 * Every case runs under `helpers/runner-git-shim.mjs`, which substitutes two things and states why:
 * a `git` that dies on a placeholder as the runner's git did, put first on the child's `PATH`, and a
 * symbolic link to `/dev/null` standing in for the placeholder character device.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { createFixture, readJson, runBash, runCli, runGit } from './helpers/fixture.mjs';
import { RUN_LIB } from './helpers/run-copy-layouts.mjs';
import { installRunnerGitShim, plantPlaceholder } from './helpers/runner-git-shim.mjs';

const SCRIPTS_DIR = 'harness-scripts';
const NESTED_SCRIPTS_DIR = 'tools/harness';
const PROFILE_FILE = '.claude/settings.autonomous.json';
const PLACEHOLDERS = ['empty-file', 'device'];
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];

/** A configuration `init` keeps, with `scriptsDir` set; the schema's required keys plus `projectName`. */
function config(scriptsDir) {
  return {
    version: 1,
    projectName: 'fixture-project',
    defaultBranch: 'main',
    stateDir: 'sdlc-harness/',
    scriptsDir,
    layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
    commands: { typecheck: 'echo typecheck', test: 'echo test' },
  };
}

/**
 * A fixture repository holding `files`, and the shim's `PATH` and calls file, both torn down in
 * `t.after`.
 *
 * @param {import('node:test').TestContext} t
 * @param {Record<string, string | object>} files
 */
async function shimmedFixture(t, files) {
  const fixture = await createFixture({ files });
  t.after(fixture.cleanup);
  const binDir = await realpath(await mkdtemp(join(tmpdir(), 'runner-git-shim-')));
  t.after(() => rm(binDir, { recursive: true, force: true }));
  const { callsFile } = await installRunnerGitShim(binDir);
  const env = { PATH: `${binDir}${delimiter}${process.env.PATH ?? ''}` };

  /** `fn <arg>` in a shell that sourced the run library, under the shim. */
  const lib = async (fn, arg) => {
    const result = await runBash(fixture.dir, ['-c', '. "$1" || exit 99; "$2" "$3"', '_', RUN_LIB, fn, arg], env);
    assert.notEqual(result.status, 99, `sourcing the run library failed: ${result.stderr}`);
    return { status: result.status, stdout: result.stdout };
  };
  return { dir: fixture.dir, env, callsFile, lib };
}

/** The adopted layout: a configuration and a tracked file in `scriptsDir`. */
function adoptedFiles(scriptsDir) {
  const files = { 'harness.config.json': config(scriptsDir) };
  if (scriptsDir !== '.') files[`${scriptsDir}/README.md`] = 'scripts\n';
  return files;
}

/** A root answer: status 0 and `root` alone on stdout. */
function assertRoot(answer, root, what) {
  assert.deepEqual(answer, { status: 0, stdout: `${root}\n` }, what);
}

/** A refusal: status 1 and nothing printed. */
function assertRefusal(answer, what) {
  assert.deepEqual(answer, { status: 1, stdout: '' }, what);
}

test('(a) job layout: harness-scripts/.git absent or a placeholder, the root', async (t) => {
  for (const shape of ['absent', ...PLACEHOLDERS]) {
    await t.test(shape, async (t) => {
      const f = await shimmedFixture(t, adoptedFiles(SCRIPTS_DIR));
      const scripts = join(f.dir, SCRIPTS_DIR);
      if (shape !== 'absent') {
        await plantPlaceholder(join(scripts, '.git'), shape);
        // The shim reproduces F15: discovery from the scripts directory dies.
        assertRefusal(await f.lib('hr_repo_root', scripts), `hr_repo_root under a ${shape}`);
      }
      assertRoot(await f.lib('hr_script_root', scripts), f.dir, `hr_script_root under ${shape}`);
      const calls = readFileSync(f.callsFile, 'utf8').split('\n');
      assert.ok(calls.includes(`-C ${f.dir} rev-parse --show-toplevel`), 'the shim never answered the root probe');
    });
  }
});

test('(b) nested scriptsDir: a placeholder at both levels, the root', async (t) => {
  for (const shape of PLACEHOLDERS) {
    await t.test(shape, async (t) => {
      const f = await shimmedFixture(t, adoptedFiles(NESTED_SCRIPTS_DIR));
      await plantPlaceholder(join(f.dir, 'tools', '.git'), shape);
      await plantPlaceholder(join(f.dir, NESTED_SCRIPTS_DIR, '.git'), shape);
      assertRoot(await f.lib('hr_script_root', join(f.dir, NESTED_SCRIPTS_DIR)), f.dir, shape);
    });
  }
});

test('(c) a clone and a linked worktree each answer their own checkout, as hr_repo_root does', async (t) => {
  const f = await shimmedFixture(t, adoptedFiles(SCRIPTS_DIR));
  await runGit(f.dir, ['add', '-A']);
  await runGit(f.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);

  const clone = `${f.dir}-clone`;
  const worktree = `${f.dir}-worktree`;
  t.after(() => rm(clone, { recursive: true, force: true }));
  t.after(() => rm(worktree, { recursive: true, force: true }));
  await runGit(f.dir, ['clone', '--quiet', f.dir, clone]);
  await runGit(f.dir, ['worktree', 'add', '--quiet', '-b', 'feat_x', worktree]);

  for (const copy of [clone, worktree]) {
    const scripts = join(copy, SCRIPTS_DIR);
    const answer = await f.lib('hr_script_root', scripts);
    assertRoot(answer, copy, copy);
    assert.deepEqual(answer, await f.lib('hr_repo_root', scripts), `hr_repo_root disagrees at ${copy}`);
  }
});

test("(d) scriptsDir '.': the root", async (t) => {
  const f = await shimmedFixture(t, adoptedFiles('.'));
  assertRoot(await f.lib('hr_script_root', f.dir), f.dir, "scriptsDir '.'");
});

test("(e) no harness.config.json anywhere: hr_repo_root's answer, a refusal under a placeholder", async (t) => {
  for (const shape of ['absent', ...PLACEHOLDERS]) {
    await t.test(shape, async (t) => {
      const f = await shimmedFixture(t, { [`${SCRIPTS_DIR}/README.md`]: 'scripts\n' });
      const scripts = join(f.dir, SCRIPTS_DIR);
      if (shape !== 'absent') await plantPlaceholder(join(scripts, '.git'), shape);
      const answer = await f.lib('hr_script_root', scripts);
      assert.deepEqual(answer, await f.lib('hr_repo_root', scripts), `hr_repo_root disagrees under ${shape}`);
      if (shape === 'absent') assertRoot(answer, f.dir, shape);
      else assertRefusal(answer, shape);
    });
  }
});

test('(f) a planted harness-scripts/harness.config.json: still the root', async (t) => {
  for (const shape of ['absent', ...PLACEHOLDERS]) {
    await t.test(shape, async (t) => {
      const f = await shimmedFixture(t, {
        ...adoptedFiles(SCRIPTS_DIR),
        [`${SCRIPTS_DIR}/harness.config.json`]: config('.'),
      });
      const scripts = join(f.dir, SCRIPTS_DIR);
      if (shape !== 'absent') await plantPlaceholder(join(scripts, '.git'), shape);
      assertRoot(await f.lib('hr_script_root', scripts), f.dir, shape);
    });
  }
});

test("a planted <scriptsDir>/.git still cannot move an unsandboxed wrapper's main checkout", async (t) => {
  for (const shape of PLACEHOLDERS) {
    await t.test(`${shape}: hr_wrapper_main_of refuses`, async (t) => {
      const f = await shimmedFixture(t, adoptedFiles(SCRIPTS_DIR));
      const scripts = join(f.dir, SCRIPTS_DIR);
      await plantPlaceholder(join(scripts, '.git'), shape);
      assertRefusal(await f.lib('hr_wrapper_main_of', scripts), shape);
    });
  }

  await t.test('a directory .git with no commondir: answers harness-scripts, which the profile stops', async (t) => {
    const f = await shimmedFixture(t, {
      ...adoptedFiles(SCRIPTS_DIR),
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0' },
    });
    const scripts = join(f.dir, SCRIPTS_DIR);

    const init = await runCli(f.dir, ['init'], f.env);
    assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
    const profile = readJson(join(f.dir, PROFILE_FILE));
    const entry = join(scripts, '.git');
    assert.ok(profile.sandbox.filesystem.denyWrite.includes(entry), `denyWrite does not hold ${entry}`);
    // The `entry` kind's two file-tool rules: the path itself and everything under it.
    for (const rule of [`Edit(/${entry})`, `Edit(/${entry}/**)`]) {
      assert.ok(profile.permissions.deny.includes(rule), `permissions.deny lacks ${rule}`);
    }

    await mkdir(entry);
    assertRoot(await f.lib('hr_wrapper_main_of', scripts), scripts, 'a planted directory .git');
  });
});
