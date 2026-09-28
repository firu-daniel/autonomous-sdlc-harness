/**
 * The written `restart-watcher.sh`'s in-flight gate, driven through its own REPRO arrangement: the
 * harness CLI replaced by a recorder on a temp `PATH` (`HARNESS_CLI`), so no daemon and no service
 * manager is touched.
 *
 * **The rule these tests exist to enforce: a registry record whose `execution` is `github-actions`
 * is listed and never refuses a restart, while a local in-flight record still refuses one.** A
 * restart tears down the local process tree only, which a run executing on GitHub is not part of.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { runBash } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const REGISTRY_PATH = 'sdlc-harness/autonomous_logs/registry.json';
const SCRIPT_PATH = 'scripts/restart-watcher.sh';
const REMOTE_LINE = 'remote (not affected by a restart): feat_r running';

/**
 * An `init`-wired fixture with `registry` written and a function running the script once, or `null`
 * when the fixture skipped.
 *
 * @param {import('node:test').TestContext} t
 * @param {object} registry
 */
async function createRestartFixture(t, registry) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const bin = join(w.dir, 'restart-test');
  const calls = join(bin, 'calls');
  await mkdir(bin, { recursive: true });
  await writeFile(join(bin, 'hcli'), `#!/usr/bin/env bash\necho "$*" >> '${calls}'\n`, { mode: 0o755 });
  await mkdir(join(w.dir, 'sdlc-harness', 'autonomous_logs'), { recursive: true });
  await writeFile(join(w.dir, REGISTRY_PATH), JSON.stringify(registry), 'utf8');

  return {
    run: () =>
      runBash(w.dir, [join(w.dir, SCRIPT_PATH)], {
        PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
        HARNESS_CLI: 'hcli',
        // A name no process carries, so the backstop probe cannot match a real agent session.
        HARNESS_AGENT_CLI: 'restart-test-no-such-agent',
      }),
    calls: () => (existsSync(calls) ? readFileSync(calls, 'utf8').split('\n').filter(Boolean) : null),
  };
}

test('a remote running record is listed and does not refuse the restart', async (t) => {
  const f = await createRestartFixture(t, { runs: { feat_r: { status: 'running', execution: 'github-actions' } } });
  if (f === null) return;

  const result = await f.run();

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.ok(result.stdout.includes(REMOTE_LINE), result.stdout);
  assert.doesNotMatch(result.stdout, /IN FLIGHT/);
  assert.deepEqual(f.calls(), ['daemon stop', 'daemon install']);
});

test('the same record without execution still refuses, and nothing is delegated', async (t) => {
  const f = await createRestartFixture(t, { runs: { feat_r: { status: 'running' } } });
  if (f === null) return;

  const result = await f.run();

  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /registry: running feat_r/);
  assert.ok(!result.stdout.includes('remote (not affected'), result.stdout);
  assert.equal(f.calls(), null, 'the recorder was called on a refusal');
});

test('a local parked record beside a remote running one refuses, naming only the local one', async (t) => {
  const f = await createRestartFixture(t, {
    runs: {
      feat_l: { status: 'parked' },
      feat_r: { status: 'running', execution: 'github-actions' },
    },
  });
  if (f === null) return;

  const result = await f.run();

  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  const registryLines = result.stdout.split('\n').filter((line) => line.includes('registry: '));
  assert.deepEqual(registryLines, ['    registry: parked feat_l']);
  assert.ok(result.stdout.includes(REMOTE_LINE), result.stdout);
  assert.equal(f.calls(), null, 'the recorder was called on a refusal');
});
