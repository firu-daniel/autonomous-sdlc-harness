/**
 * `run-test-suite.sh --no-detach` and `scratch-run.sh`, as `init` writes them, in a job-layout
 * checkout whose `<scriptsDir>/.git` is the placeholder a bubblewrap host leaves (F15).
 *
 * **The rule these tests exist to enforce: in a job-layout checkout whose `<scriptsDir>/.git` is a
 * placeholder, the gate worker's `run-test-suite.sh` and an agent's `scratch-run.sh` place the
 * checkout root and run; a copy of the scripts outside any repository still refuses with each
 * script's own message.**
 *
 * Every case runs under `helpers/runner-git-shim.mjs`, which substitutes two things and states why:
 * a `git` that dies on a placeholder as the runner's git did, put first on the child's `PATH`, and a
 * symbolic link to `/dev/null` standing in for the placeholder character device.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { cp, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, runGit } from './helpers/fixture.mjs';
import { installRunnerGitShim, plantPlaceholder } from './helpers/runner-git-shim.mjs';

const SCRIPTS_DIR = 'harness-scripts';
const STATE_DIR = 'job-state';
const PLACEHOLDERS = ['empty-file', 'device'];
const LABEL = 'job_round_1';
const COUNTER = 'stub-counter.txt';
const PROBE_LINE = 'job-layout probe ran';

/** `commands.test`: counts its runs in {@link COUNTER}, relative, so only from the checkout root. */
const STUB = `#!/usr/bin/env bash\nprintf 'ran\\n' >> ${COUNTER}\n`;

/**
 * An adopted job-layout fixture with `scriptsDir/.git` planted as `shape`, and the shim's `PATH`;
 * every directory is torn down in `t.after`.
 *
 * @param {import('node:test').TestContext} t
 * @param {'empty-file' | 'device'} shape
 */
async function jobFixture(t, shape) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0' },
      'harness.config.json': {
        version: 1,
        projectName: 'fixture-project',
        defaultBranch: 'main',
        stateDir: STATE_DIR,
        scriptsDir: SCRIPTS_DIR,
        layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
        commands: { typecheck: '<none>', test: 'bash stub.sh' },
      },
      'stub.sh': STUB,
    },
  });
  t.after(fixture.cleanup);
  const binDir = await realpath(await mkdtemp(join(tmpdir(), 'runner-git-shim-')));
  t.after(() => rm(binDir, { recursive: true, force: true }));
  await installRunnerGitShim(binDir);
  const env = { PATH: `${binDir}${delimiter}${process.env.PATH ?? ''}` };

  const init = await runCli(fixture.dir, ['init'], env);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  await runGit(fixture.dir, ['checkout', '--quiet', '-b', 'feat_job']);
  await plantPlaceholder(join(fixture.dir, SCRIPTS_DIR, '.git'), shape);
  return { dir: fixture.dir, env };
}

/** `run-test-suite.sh --no-detach` and `scratch-run.sh` refusing to place a root at `scripts`. */
const NO_ROOT = Object.freeze({
  suite: (scripts) => ({ status: 2, stderr: `run-test-suite.sh: '${scripts}' is not inside a git repository\n` }),
  scratch: (scripts) => ({
    status: 68,
    stderr: `scratch-run.sh: '${scripts}' is not inside a git repository — refusing to run anything\n`,
  }),
});

for (const shape of PLACEHOLDERS) {
  test(`(a) ${shape}: run-test-suite.sh --no-detach places the root and answers pass`, async (t) => {
    const f = await jobFixture(t, shape);
    const result = await runBash(f.dir, [`${SCRIPTS_DIR}/run-test-suite.sh`, '--no-detach', LABEL], f.env);
    assert.deepEqual(
      { status: result.status, stdout: result.stdout, stderr: result.stderr },
      { status: 0, stdout: 'pass\n', stderr: '' },
    );
    assert.equal(readFileSync(join(f.dir, COUNTER), 'utf8'), 'ran\n', 'the stub did not run exactly once');
  });

  test(`(b) ${shape}: scratch-run.sh places the root and runs the probe`, async (t) => {
    const f = await jobFixture(t, shape);
    const probe = `${STATE_DIR}/scratch/probe.mjs`;
    await writeFile(join(f.dir, probe), `console.log(${JSON.stringify(PROBE_LINE)});\n`, 'utf8');
    const result = await runBash(f.dir, [`${SCRIPTS_DIR}/scratch-run.sh`, probe], f.env);
    assert.deepEqual(
      { status: result.status, stdout: result.stdout, stderr: result.stderr },
      { status: 0, stdout: `${PROBE_LINE}\n`, stderr: '' },
    );
  });

  test(`(c) ${shape}: a copy of the scripts outside any repository still refuses`, async (t) => {
    const f = await jobFixture(t, shape);
    const outside = await realpath(await mkdtemp(join(tmpdir(), 'job-layout-outside-')));
    t.after(() => rm(outside, { recursive: true, force: true }));
    const scripts = join(outside, SCRIPTS_DIR);
    await cp(join(f.dir, SCRIPTS_DIR), scripts, { recursive: true });

    const suite = await runBash(outside, [join(scripts, 'run-test-suite.sh'), '--no-detach', LABEL], f.env);
    assert.deepEqual({ status: suite.status, stderr: suite.stderr }, NO_ROOT.suite(scripts));
    const scratch = await runBash(outside, [join(scripts, 'scratch-run.sh'), `${STATE_DIR}/scratch/probe.mjs`], f.env);
    assert.deepEqual({ status: scratch.status, stderr: scratch.stderr }, NO_ROOT.scratch(scripts));
    assert.equal(existsSync(join(f.dir, COUNTER)), false, 'a refused run reached the stub');
  });
}
