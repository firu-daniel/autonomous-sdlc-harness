/**
 * `init` → `selfAdoptionOf` and `generators/scripts.ts` → `carryOnDiskCommandLines`, end to end.
 *
 * **The rule these tests exist to enforce: a forced self-adopt `init` keeps the command line of a
 * wrapper whose configured value names that wrapper, and an adopter's forced run does not.** The
 * adopter arm is the self-adopt arm with the two identity files removed and the variable still set,
 * so the pair differs only in which repository the run is aimed at. The unforced arm holds the other
 * conjunct: without `--force` nothing is replaced, so no row may claim a re-render.
 *
 * Every fixture lives under the system temp directory and is removed in process; nothing writes
 * into this checkout. These run against the **compiled** CLI, so `npm run build` precedes `npm test`.
 */

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { createFixture, PACKAGE_ROOT, readJson, runCli, snapshotTree } from './helpers/fixture.mjs';

const SELF_ADOPT = { HARNESS_SELF_ADOPT: '1' };
const FORWARDED = '"$@"';
/** The hand-set line per wrapper, and the config key whose value names that wrapper. */
const HAND_SET = [
  { key: 'commands.typecheck', file: 'scripts/typecheck.sh', line: 'npm run build' },
  { key: 'commands.test', file: 'scripts/test.sh', line: 'bash scripts/run-gates.sh' },
];

const CONFIG = {
  version: 1,
  defaultBranch: 'main',
  stateDir: 'sdlc-harness',
  layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
  commands: { typecheck: 'bash scripts/typecheck.sh', test: 'bash scripts/test.sh' },
};

const PROJECT_FILES = {
  'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'node --test' } },
  'harness.config.json': CONFIG,
};

const HARNESS_IDENTITY = {
  '.claude-plugin/marketplace.json': { name: 'fixture-marketplace', plugins: [] },
  'cli/package.json': { name: readJson(join(PACKAGE_ROOT, 'package.json')).name, version: '0.0.0' },
};

async function fixtureFor(t, { harnessOwn }) {
  const fixture = await createFixture({ files: { ...PROJECT_FILES, ...(harnessOwn ? HARNESS_IDENTITY : {}) } });
  t.after(fixture.cleanup);
  return fixture.dir;
}

async function initOk(dir, args = []) {
  const result = await runCli(dir, ['init', '--non-interactive', ...args], SELF_ADOPT);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

/** The wrapper's forwarding line: the last unindented, uncommented line carrying `"$@"`. */
function forwardingIndex(lines) {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!/^\s/.test(line) && !line.startsWith('#') && line.includes(FORWARDED)) return i;
  }
  throw new Error('fixture: no forwarding line in the wrapper');
}

function forwardingLine(dir, file) {
  const lines = readFileSync(join(dir, file), 'utf8').split('\n');
  return lines[forwardingIndex(lines)];
}

function handSet(dir) {
  for (const { file, line } of HAND_SET) {
    const lines = readFileSync(join(dir, file), 'utf8').split('\n');
    lines[forwardingIndex(lines)] = `${line} ${FORWARDED}`;
    writeFileSync(join(dir, file), lines.join('\n'));
  }
}

function carriedRow({ key, file, line }, dryRun) {
  const name = file.split('/').pop();
  const kept = dryRun ? 'would be kept' : 'kept';
  const rendered = dryRun ? 'would be re-rendered' : 're-rendered';
  return `${key} -> bash ${file} -> ${line} — the line ${name} already carries, ${kept} by this self-adopt run and ${rendered} into the current template`;
}

/** The `commands` step's row for one key; fails when the run printed none. */
function commandRow(stdout, key) {
  const row = stdout.split('\n').find((line) => line.trimStart().startsWith(`${key} -> `));
  assert.ok(row !== undefined, `no commands row for ${key}\n${stdout}`);
  return row;
}

test('a forced self-adopt init keeps both hand-set wrapper lines and says it carried them', async (t) => {
  const dir = await fixtureFor(t, { harnessOwn: true });
  await initOk(dir);
  handSet(dir);

  const result = await initOk(dir, ['--force']);

  for (const entry of HAND_SET) {
    assert.equal(forwardingLine(dir, entry.file), `${entry.line} ${FORWARDED}`, `${entry.file} lost its hand-set line`);
    assert.ok(result.stdout.includes(carriedRow(entry, false)), `no carried row for ${entry.key}\n${result.stdout}`);
  }
  assert.doesNotMatch(result.stdout, /--force is what replaces the file/);
});

test('an unforced self-adopt init leaves the hand-set wrappers byte-identical and claims no re-render', async (t) => {
  const dir = await fixtureFor(t, { harnessOwn: true });
  await initOk(dir);
  handSet(dir);
  const before = HAND_SET.map(({ file }) => readFileSync(join(dir, file), 'utf8'));

  const result = await initOk(dir);

  assert.deepEqual(
    HAND_SET.map(({ file }) => readFileSync(join(dir, file), 'utf8')),
    before,
  );
  // Scoped to the two rows: the githooks note says "re-rendered" about the hook on every run.
  for (const entry of HAND_SET) {
    const row = commandRow(result.stdout, entry.key);
    assert.doesNotMatch(row, /re-rendered/, row);
    assert.doesNotMatch(row, /self-adopt run/, row);
  }
});

test('an adopter repository given the same variable, edits and --force gets no carried line', async (t) => {
  const dir = await fixtureFor(t, { harnessOwn: false });
  await initOk(dir);
  handSet(dir);

  const result = await initOk(dir, ['--force']);

  for (const entry of HAND_SET) {
    assert.notEqual(forwardingLine(dir, entry.file), `${entry.line} ${FORWARDED}`, `${entry.file} kept the hand-set line`);
  }
  assert.match(forwardingLine(dir, 'scripts/typecheck.sh'), /^harness_fail\b/);
  assert.doesNotMatch(result.stdout, /self-adopt run/);
});

test('a dry-run forced self-adopt init prints the conditional carried rows and writes nothing', async (t) => {
  const dir = await fixtureFor(t, { harnessOwn: true });
  await initOk(dir);
  handSet(dir);
  const before = await snapshotTree(dir);

  const result = await initOk(dir, ['--dry-run', '--force']);

  for (const entry of HAND_SET) {
    assert.ok(result.stdout.includes(carriedRow(entry, true)), `no conditional carried row for ${entry.key}\n${result.stdout}`);
  }
  assert.deepEqual(await snapshotTree(dir), before, 'a dry run changed the tree');
});
