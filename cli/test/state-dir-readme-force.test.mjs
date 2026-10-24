/**
 * `writeStateDir` — the identical-bytes keep on the run-artifact READMEs.
 *
 * **The rule these tests exist to enforce: a forced `init` takes no `.bak` of a run-artifact README
 * whose bytes already are its template, and still replaces a differing one after a `.bak`.** The
 * second case is the first's perturbation — the same forced run, one edit apart per README — and has
 * the opposite outcome, which ties the result to the bytes rather than to the fixture.
 *
 * Every fixture lives under the system temp directory and is removed in process; nothing writes
 * into this checkout. These run against the **compiled** CLI, so `npm run build` precedes `npm test`.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import { createFixture, runCli } from './helpers/fixture.mjs';

const STATE_DIR = 'sdlc-harness';
const EDITED = '# edited by the adopter\n';
/** One README inside a contents-ignored directory, one committed. */
const EDITED_READMES = [`${STATE_DIR}/scratch/README.md`, `${STATE_DIR}/task_prompts/README.md`];

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

/** Every `README.md.bak` under `root`, repo-relative to `dir`, found by walking the tree. */
function readmeBackups(dir, root) {
  const found = [];
  for (const entry of readdirSync(root, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.endsWith('README.md.bak')) {
      found.push(relative(dir, join(entry.parentPath ?? entry.path, entry.name)));
    }
  }
  return found.sort();
}

function text(dir, path) {
  return readFileSync(join(dir, path), 'utf8');
}

test('(a) a forced init over template-identical READMEs takes no .bak of any of them', async (t) => {
  const dir = await fixtureFor(t);
  await initOk(dir);
  await initOk(dir, ['--force']);

  assert.deepEqual(readmeBackups(dir, join(dir, STATE_DIR)), []);
});

test('(b) a forced init replaces an edited README after a .bak holding exactly the edit', async (t) => {
  const dir = await fixtureFor(t);
  await initOk(dir);
  const templates = Object.fromEntries(EDITED_READMES.map((path) => [path, text(dir, path)]));
  for (const path of EDITED_READMES) writeFileSync(join(dir, path), EDITED);

  await initOk(dir, ['--force']);

  for (const path of EDITED_READMES) {
    assert.equal(text(dir, `${path}.bak`), EDITED, `${path}.bak does not hold the edited text`);
    assert.equal(text(dir, path), templates[path], `${path} is not back to its template bytes`);
  }
  assert.deepEqual(
    readmeBackups(dir, join(dir, STATE_DIR)),
    EDITED_READMES.map((path) => `${path}.bak`).sort(),
  );
});
