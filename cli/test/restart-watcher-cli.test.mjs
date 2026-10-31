/**
 * The written `restart-watcher.sh`'s parse of `HARNESS_CLI`, driven through its own REPRO
 * arrangement: a recorder `hcli` on a temp `PATH`, an idle registry, and no daemon or service manager.
 *
 * **The rule these tests exist to enforce: a multi-word `HARNESS_CLI` runs its first word with the
 * rest as leading arguments, and a one-word value behaves as before.** A blank value and an
 * unresolvable first word are refused before anything is delegated.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, runBash } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const REGISTRY_PATH = 'sdlc-harness/autonomous_logs/registry.json';
const SCRIPT_PATH = `${INIT_SCRIPTS_DIR}/restart-watcher.sh`;

/**
 * An `init`-wired fixture with an idle registry, and a function running the script once under a given
 * `HARNESS_CLI`, or `null` when the fixture skipped.
 *
 * @param {import('node:test').TestContext} t
 */
async function createCliFixture(t) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const bin = join(w.dir, 'restart-test');
  const calls = join(bin, 'calls');
  await mkdir(bin, { recursive: true });
  await writeFile(join(bin, 'hcli'), `#!/usr/bin/env bash\necho "$*" >> '${calls}'\n`, { mode: 0o755 });
  await mkdir(join(w.dir, 'sdlc-harness', 'autonomous_logs'), { recursive: true });
  await writeFile(join(w.dir, REGISTRY_PATH), JSON.stringify({ runs: { feat_x: { status: 'completed' } } }), 'utf8');

  return {
    bin,
    /** @param {string} harnessCli */
    run: (harnessCli) =>
      runBash(w.dir, [join(w.dir, SCRIPT_PATH)], {
        PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
        HARNESS_CLI: harnessCli,
        // A name no process carries, so the backstop probe cannot match a real agent session.
        HARNESS_AGENT_CLI: 'restart-test-no-such-agent',
      }),
    calls: () => (existsSync(calls) ? readFileSync(calls, 'utf8').split('\n').filter(Boolean) : null),
  };
}

test('a multi-word HARNESS_CLI passes its remaining words ahead of each delegated command', async (t) => {
  const f = await createCliFixture(t);
  if (f === null) return;

  const result = await f.run('hcli --via');

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.deepEqual(f.calls(), ['--via daemon stop', '--via daemon install']);
});

test('a one-word HARNESS_CLI delegates exactly as before', async (t) => {
  const f = await createCliFixture(t);
  if (f === null) return;

  const result = await f.run('hcli');

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.deepEqual(f.calls(), ['daemon stop', 'daemon install']);
});

test('an interpreter followed by a script path runs that script', async (t) => {
  const f = await createCliFixture(t);
  if (f === null) return;

  const result = await f.run(`bash ${join(f.bin, 'hcli')}`);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.deepEqual(f.calls(), ['daemon stop', 'daemon install']);
});

test('a first word not on PATH is refused, named, and nothing is delegated', async (t) => {
  const f = await createCliFixture(t);
  if (f === null) return;

  const result = await f.run('definitely-not-installed --x');

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /'definitely-not-installed' is not on PATH/);
  assert.equal(f.calls(), null, 'the recorder was called on a refusal');
});

test('a blank HARNESS_CLI is refused, naming the variable, and nothing is delegated', async (t) => {
  const f = await createCliFixture(t);
  if (f === null) return;

  const result = await f.run(' ');

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /HARNESS_CLI/);
  assert.equal(f.calls(), null, 'the recorder was called on a refusal');
});
