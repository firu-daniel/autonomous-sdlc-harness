/**
 * The `Install the pinned plugin` step of the `harness-run.yml` template, run.
 *
 * **The rule these tests enforce: the install step installs the plugin at the workflow's version,
 * whatever the marketplace's default branch carries, and refuses naming the upgrade route when it
 * cannot.** The step's `run: |` body is taken from the template's own text and run with `bash`,
 * against a stub `claude` first on `PATH`. The clone is real: `https://github.com/` is redirected
 * through `GIT_CONFIG_*` to a local bare repository with two plugin versions, so no case reaches
 * the network.
 */

import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';
import { WORKFLOW_RUN_FILE, WORKFLOW_TEMPLATE_DIR } from '../dist/remote/githubActions.js';

const LINES = readFileSync(join(PACKAGE_ROOT, 'templates', WORKFLOW_TEMPLATE_DIR, WORKFLOW_RUN_FILE), 'utf8').split('\n');
const PLUGIN_KEY = 'autonomous-sdlc-harness@autonomous-sdlc-harness';
const UPGRADE_ROUTE = 'init --upgrade-workflows';

const indentOf = (line) => line.length - line.trimStart().length;

/** The `run: |` body of the step named `name`, de-indented. */
function stepBody(name) {
  const start = LINES.findIndex((l) => l.trim() === `- name: ${name}`);
  assert.notEqual(start, -1, `the template carries the step ${name}`);
  const stepIndent = indentOf(LINES[start]);
  let runAt = -1;
  for (let i = start + 1; i < LINES.length && (LINES[i].trim() === '' || indentOf(LINES[i]) > stepIndent); i++) {
    if (LINES[i].trim() === 'run: |') runAt = i;
  }
  assert.notEqual(runAt, -1, `the step ${name} has a run: | body`);
  const base = indentOf(LINES[runAt]);
  const body = [];
  for (let i = runAt + 1; i < LINES.length; i++) {
    if (LINES[i].trim() !== '' && indentOf(LINES[i]) <= base) break;
    body.push(LINES[i]);
  }
  const cut = Math.min(...body.filter((l) => l.trim() !== '').map(indentOf));
  return body.map((l) => l.slice(cut)).join('\n');
}

const STUB_CLAUDE = `#!/usr/bin/env bash
set -eu
state="$STUB_STATE_DIR"
case "$1 $2" in
  'plugin marketplace')
    [ "$3" = add ] || exit 2
    (cd "$4" && pwd -P) > "$state/marketplace"
    ;;
  'plugin install')
    pwd -P > "$state/install-cwd"
    market=$(cat "$state/marketplace")
    source=$(jq -r '.plugins[0].source' "$market/.claude-plugin/marketplace.json")
    jq -r '.version' "$market/$source/.claude-plugin/plugin.json" > "$state/version"
    ;;
  'plugin list')
    version="\${STUB_REPORTED_VERSION:-$(cat "$state/version")}"
    printf '[{"id":"${PLUGIN_KEY}","scope":"user","version":"%s"}]\\n' "$version"
    ;;
  *) exit 2 ;;
esac
`;

/** Commit `version` of the plugin into `work`. */
async function commitVersion(work, version) {
  writeFileSync(
    join(work, 'plugin', '.claude-plugin', 'plugin.json'),
    `${JSON.stringify({ name: 'autonomous-sdlc-harness', version })}\n`,
  );
  await runGit(work, ['add', '-A']);
  await runGit(work, ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '--quiet', '-m', `v${version}`]);
}

/** A throwaway world: the two-version bare repository, a run directory, the stub and its state. */
async function world(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'workflow-plugin-pin-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const fixtures = join(root, 'fixtures');
  const work = join(root, 'work');
  mkdirSync(join(work, '.claude-plugin'), { recursive: true });
  mkdirSync(join(work, 'plugin', '.claude-plugin'), { recursive: true });
  writeFileSync(
    join(work, '.claude-plugin', 'marketplace.json'),
    `${JSON.stringify({ name: 'autonomous-sdlc-harness', plugins: [{ name: 'autonomous-sdlc-harness', source: './plugin' }] })}\n`,
  );
  await runGit(work, ['init', '--quiet', '--initial-branch=main']);
  await commitVersion(work, '9.0.0');
  await runGit(work, ['-c', 'user.name=t', '-c', 'user.email=t@t', 'tag', '-a', '-m', 'v9.0.0', 'autonomous-sdlc-harness--v9.0.0']);
  await commitVersion(work, '9.1.0');
  mkdirSync(join(fixtures, 'acme'), { recursive: true });
  await runGit(root, ['clone', '--quiet', '--bare', work, join(fixtures, 'acme', 'harness.git')]);

  const checkout = join(root, 'checkout');
  mkdirSync(join(checkout, '.claude'), { recursive: true });
  writeFileSync(
    join(checkout, '.claude', 'settings.json'),
    `${JSON.stringify({ extraKnownMarketplaces: { 'autonomous-sdlc-harness': { source: { source: 'github', repo: 'acme/harness' } } } })}\n`,
  );
  const bin = join(root, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'claude'), STUB_CLAUDE);
  chmodSync(join(bin, 'claude'), 0o755);
  const state = join(root, 'stub-state');
  const runnerTemp = join(root, 'runner-temp');
  mkdirSync(state);
  mkdirSync(runnerTemp);
  const script = join(root, 'step.sh');
  writeFileSync(script, stepBody('Install the pinned plugin'));
  return { checkout, fixtures, script, state, runnerTemp, bin };
}

function runStep(w, env) {
  return runBash(w.checkout, [w.script], {
    PATH: `${w.bin}:${process.env.PATH}`,
    RUNNER_TEMP: w.runnerTemp,
    STUB_STATE_DIR: w.state,
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: `url.file://${w.fixtures}/.insteadOf`,
    GIT_CONFIG_VALUE_0: 'https://github.com/',
    ...env,
  });
}

test('(a) a workflow rendered for 9.0.0 installs 9.0.0 while the default branch carries 9.1.0', async (t) => {
  const w = await world(t);
  const result = await runStep(w, { HARNESS_CLI_VERSION: '9.0.0' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const recorded = readFileSync(join(w.state, 'marketplace'), 'utf8').trim();
  assert.equal(recorded, join(w.runnerTemp, 'harness-marketplace'));
  assert.notEqual(recorded, 'acme/harness');
  assert.equal(readFileSync(join(w.state, 'version'), 'utf8').trim(), '9.0.0');
  assert.equal(readFileSync(join(w.state, 'install-cwd'), 'utf8').trim(), w.runnerTemp);
});

test('(b) a version with no release tag refuses, naming the tag and the upgrade route', async (t) => {
  const w = await world(t);
  const result = await runStep(w, { HARNESS_CLI_VERSION: '9.2.0' });
  assert.notEqual(result.status, 0);
  const output = result.stdout + result.stderr;
  assert.ok(output.includes('autonomous-sdlc-harness--v9.2.0'), output);
  assert.ok(output.includes(UPGRADE_ROUTE), output);
});

test('(c) an installed version other than the rendered one refuses, naming both and the upgrade route', async (t) => {
  const w = await world(t);
  const result = await runStep(w, { HARNESS_CLI_VERSION: '9.0.0', STUB_REPORTED_VERSION: '9.1.0' });
  assert.notEqual(result.status, 0);
  const output = result.stdout + result.stderr;
  for (const fragment of ['9.1.0', '9.0.0', UPGRADE_ROUTE]) assert.ok(output.includes(fragment), output);
});
