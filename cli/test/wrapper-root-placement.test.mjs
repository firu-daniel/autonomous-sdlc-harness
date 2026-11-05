/**
 * `typecheck.sh` and `test.sh`, as `init` writes them, placing their root in a job-layout checkout
 * whose `<scriptsDir>/.git` is the placeholder a bubblewrap host leaves (F15).
 *
 * **The rule these tests exist to enforce: an `init`-written wrapper runs at its checkout's root in a
 * job-layout checkout whose `<scriptsDir>/.git` is a placeholder, and at the same root as before
 * everywhere else.** A copy outside any repository still refuses with its own line, and `doctor`
 * still reads each wrapper's command line back.
 *
 * Every case runs under `helpers/runner-git-shim.mjs`, which substitutes two things and states why:
 * a `git` that dies on a placeholder as the runner's git did, put first on the child's `PATH`, and a
 * symbolic link to `/dev/null` standing in for the placeholder character device.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { cp, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, relative } from 'node:path';
import test from 'node:test';

import { wrapperCommandLine } from '../dist/generators/scripts.js';
import { createFixture, readJson, runBash, runCli } from './helpers/fixture.mjs';
import { installRunnerGitShim, plantPlaceholder } from './helpers/runner-git-shim.mjs';

const PLACEHOLDERS = ['empty-file', 'device'];
const WRAPPERS = Object.freeze([
  { key: 'typecheck', file: 'typecheck.sh' },
  { key: 'test', file: 'test.sh' },
]);
const SUBDIR = 'sub/dir';

/** The recorder each raw command line runs: writes its working directory, physical, to `$1`. */
const RECORDER = '#!/usr/bin/env bash\npwd -P > "$1"\n';

/**
 * An adopted fixture with `scriptsDir`, whose `commands.typecheck` and `commands.test` raw lines
 * record `pwd` under an out directory outside it, and the shim's `PATH`; torn down in `t.after`.
 *
 * @param {import('node:test').TestContext} t
 * @param {string} scriptsDir
 */
async function adoptedFixture(t, scriptsDir) {
  const out = await realpath(await mkdtemp(join(tmpdir(), 'wrapper-root-out-')));
  t.after(() => rm(out, { recursive: true, force: true }));
  await writeFile(join(out, 'record-pwd.sh'), RECORDER, 'utf8');
  const commands = Object.fromEntries(
    WRAPPERS.map(({ key }) => [key, `bash ${join(out, 'record-pwd.sh')} ${join(out, `${key}.txt`)}`]),
  );

  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0' },
      'harness.config.json': {
        version: 1,
        projectName: 'fixture-project',
        defaultBranch: 'main',
        stateDir: 'job-state',
        scriptsDir,
        layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
        commands,
      },
    },
    dirs: [SUBDIR],
  });
  t.after(fixture.cleanup);
  const binDir = await realpath(await mkdtemp(join(tmpdir(), 'runner-git-shim-')));
  t.after(() => rm(binDir, { recursive: true, force: true }));
  await installRunnerGitShim(binDir);
  const env = { PATH: `${binDir}${delimiter}${process.env.PATH ?? ''}` };

  const init = await runCli(fixture.dir, ['init'], env);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  for (const { key, file } of WRAPPERS) {
    const body = wrapperCommandLine(readFileSync(join(fixture.dir, scriptsDir, file), 'utf8'));
    assert.deepEqual(body, { kind: 'command', command: commands[key] }, `${file} does not carry its raw line`);
  }
  return { dir: fixture.dir, out, env, scriptsDir };
}

/**
 * Run each wrapper from the root and from {@link SUBDIR}, and assert its verdict and that the
 * recorded `pwd` is the fixture root.
 *
 * @param {{ dir: string, out: string, env: Record<string, string>, scriptsDir: string }} f
 */
async function assertRunsAtRoot(f) {
  for (const cwd of [f.dir, join(f.dir, SUBDIR)]) {
    for (const { key, file } of WRAPPERS) {
      const recorded = join(f.out, `${key}.txt`);
      await rm(recorded, { force: true });
      const script = relative(cwd, join(f.dir, f.scriptsDir, file));
      const result = await runBash(cwd, [script], f.env);
      assert.deepEqual(
        { status: result.status, stdout: result.stdout, stderr: result.stderr },
        { status: 0, stdout: `PASS: ${key}\n`, stderr: '' },
        `${script} from ${cwd}`,
      );
      assert.equal(readFileSync(recorded, 'utf8'), `${f.dir}\n`, `${script} from ${cwd} ran elsewhere`);
    }
  }
}

for (const shape of PLACEHOLDERS) {
  test(`(a) ${shape}: the wrappers run at the root with harness-scripts/.git a placeholder`, async (t) => {
    const f = await adoptedFixture(t, 'harness-scripts');
    await plantPlaceholder(join(f.dir, 'harness-scripts', '.git'), shape);
    await assertRunsAtRoot(f);
  });

  test(`(b) ${shape}: the wrappers run at the root with a placeholder at both levels of tools/harness`, async (t) => {
    const f = await adoptedFixture(t, 'tools/harness');
    await plantPlaceholder(join(f.dir, 'tools', '.git'), shape);
    await plantPlaceholder(join(f.dir, 'tools', 'harness', '.git'), shape);
    await assertRunsAtRoot(f);
  });
}

test('(c) with no placeholder the wrappers run at the root, as before', async (t) => {
  const f = await adoptedFixture(t, 'harness-scripts');
  await assertRunsAtRoot(f);
});

test('(d) a copy of a rendered wrapper outside any repository refuses with no verdict line', async (t) => {
  const f = await adoptedFixture(t, 'harness-scripts');
  const outside = await realpath(await mkdtemp(join(tmpdir(), 'wrapper-root-outside-')));
  t.after(() => rm(outside, { recursive: true, force: true }));
  for (const { key, file } of WRAPPERS) {
    const copy = join(outside, file);
    await cp(join(f.dir, 'harness-scripts', file), copy);
    const result = await runBash(outside, [copy], f.env);
    assert.deepEqual(
      { status: result.status, stdout: result.stdout, stderr: result.stderr },
      {
        status: 1,
        stdout: '',
        stderr: `${key}: could not resolve a repository root from '${outside}' (is git on PATH?)\n`,
      },
    );
    assert.equal(existsSync(join(f.out, `${key}.txt`)), false, `the refused ${file} reached its command`);
  }
});

test('(e) doctor still reads each rendered wrapper\'s command line', async (t) => {
  const f = await adoptedFixture(t, 'harness-scripts');
  await plantPlaceholder(join(f.dir, 'harness-scripts', '.git'), 'empty-file');
  // `init` keeps an existing config, so the raw lines are swapped for the invocations a fresh
  // adoption writes: only a key holding one makes `doctor` read the wrapper file.
  const configPath = join(f.dir, 'harness.config.json');
  const config = readJson(configPath);
  for (const { key, file } of WRAPPERS) config.commands[key] = `bash harness-scripts/${file}`;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  const doctor = await runCli(f.dir, ['doctor'], f.env);
  const report = `${doctor.stdout}${doctor.stderr}`;
  assert.match(doctor.stdout, /^PASS\s+command-wrappers\s/m);
  const resolves = report.split('\n').find((line) => /^PASS\s+command-resolves\s/.test(line)) ?? '';
  for (const { key, file } of WRAPPERS) {
    assert.ok(resolves.includes(`commands.${key} → harness-scripts/${file}`), `command-resolves did not read ${file}`);
  }
  const unread = report.split('\n').filter((line) => /\(harness-scripts\/(?:typecheck|test)\.sh[):]/.test(line));
  assert.deepEqual(unread, [], 'a check reported a rendered wrapper\'s line as unread');
});
