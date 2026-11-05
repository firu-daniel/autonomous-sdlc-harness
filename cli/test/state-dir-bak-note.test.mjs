/**
 * `init` → `hiddenBackupsNote`, end to end.
 *
 * **The rule these tests exist to enforce: every `.bak` a forced run leaves inside a contents-ignored
 * state-dir directory is named in its notes, and none is named when none was written.** The
 * unedited forced run is the perturbation: the same command over the same tree, one edit apart, and
 * no note. A committed README's `.bak` is visible to `git status`, so it is never named here.
 *
 * Every fixture lives under the system temp directory and is removed in process; nothing writes
 * into this checkout. These run against the **compiled** CLI, so `npm run build` precedes `npm test`.
 */

import assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { createFixture, ignoredAmong, runCli } from './helpers/fixture.mjs';

const HIDDEN_README = 'sdlc-harness/scratch/README.md';
const COMMITTED_README = 'sdlc-harness/task_prompts/README.md';
const NOTE = /the managed \.gitignore block ignores by (its|their) contents, so git status will not list/;

async function fixtureFor(t) {
  const fixture = await createFixture({
    files: {
      'package.json': {
        name: 'fixture-project',
        private: true,
        version: '0.0.0',
        scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build' },
      },
      'README.md': '# fixture project\n',
    },
  });
  t.after(fixture.cleanup);
  return fixture.dir;
}

async function initOk(dir, args = []) {
  const result = await runCli(dir, ['init', ...args]);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

/** The one stdout line carrying the note, or `undefined`. */
function noteLine(stdout) {
  return stdout.split('\n').find((line) => NOTE.test(line));
}

test('a forced init names the .bak it left in a contents-ignored directory, and git ignores it', async (t) => {
  const dir = await fixtureFor(t);
  await initOk(dir);
  writeFileSync(join(dir, HIDDEN_README), '# edited by the adopter\n');

  const result = await initOk(dir, ['--force']);

  const line = noteLine(result.stdout);
  assert.ok(line !== undefined, `no hidden-.bak note\n${result.stdout}`);
  assert.ok(line.includes(`${HIDDEN_README}.bak`), line);
  assert.ok(existsSync(join(dir, `${HIDDEN_README}.bak`)));
  assert.deepEqual(await ignoredAmong(dir, [`${HIDDEN_README}.bak`]), [`${HIDDEN_README}.bak`]);
});

test('a forced init with no edit names no .bak', async (t) => {
  const dir = await fixtureFor(t);
  await initOk(dir);

  const result = await initOk(dir, ['--force']);

  assert.equal(noteLine(result.stdout), undefined, result.stdout);
});

test('a committed README edited and forced gets its .bak, and the note does not name it', async (t) => {
  const dir = await fixtureFor(t);
  await initOk(dir);
  writeFileSync(join(dir, COMMITTED_README), '# edited by the adopter\n');

  const result = await initOk(dir, ['--force']);

  assert.ok(existsSync(join(dir, `${COMMITTED_README}.bak`)));
  const line = noteLine(result.stdout);
  assert.ok(line === undefined || !line.includes(COMMITTED_README), line);
});
