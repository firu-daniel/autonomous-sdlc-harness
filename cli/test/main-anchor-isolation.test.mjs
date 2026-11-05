/**
 * The suite's isolation from the main checkout's anchor.
 *
 * **The rule this test exists to enforce: no child the suite's runners start sees the parent's
 * anchor.** The watcher exports `HARNESS_MAIN_REPO` to every session it launches, a session's gate
 * runs included, and a plugin reader that inherited it would act on the real main checkout rather
 * than a fixture's. One case runs `runBash` in a child `node` holding the anchor and reads what the
 * shell saw; the other reads the suite's sources for a `process.env` spread whose object does not
 * blank it.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';

const MARKER = 'marker';

test('runBash hands its child an empty anchor when the parent holds one', async (t) => {
  const anchor = await mkdtemp(join(tmpdir(), 'harness-anchor-'));
  t.after(() => rm(anchor, { recursive: true, force: true }));
  await writeFile(join(anchor, MARKER), '');

  const fixture = new URL('./helpers/fixture.mjs', import.meta.url).href;
  const source = [
    `import { runBash } from ${JSON.stringify(fixture)};`,
    `const r = await runBash(process.cwd(), ['-c', ${JSON.stringify(`printf '%s' "\${${MAIN_REPO_ANCHOR_VARIABLE}-unset}"`)}]);`,
    'process.stdout.write(JSON.stringify(r));',
  ].join('\n');
  const stdout = await new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      ['--input-type=module', '-e', source],
      { cwd: anchor, encoding: 'utf8', env: { ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: anchor } },
      (error, out, err) => (error === null ? resolve(out) : reject(new Error(`${error.message}\n${err}`))),
    );
  });

  const result = JSON.parse(stdout);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.deepEqual(await readdir(anchor), [MARKER]);
});

/**
 * Every environment a suite builds from `process.env` must blank the anchor **in the same object**:
 * the shared runners' `ISOLATED_ENV` does not reach a spread written outside them, and one blanked
 * spread in a file says nothing about the next one. The needle is joined so this file's own source
 * does not carry it.
 */
test('every process.env spread in a test source blanks the anchor in the same object', () => {
  const root = import.meta.dirname;
  const spread = ['...process', 'env'].join('.');
  const sources = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((p) => p.endsWith('.mjs'));
  const unguarded = [];
  for (const p of sources) {
    const text = readFileSync(join(root, p), 'utf8');
    for (let at = text.indexOf(spread); at !== -1; at = text.indexOf(spread, at + spread.length)) {
      const close = text.indexOf('}', at);
      const object = text.slice(at, close === -1 ? text.length : close);
      if (!/ISOLATED_ENV|MAIN_REPO_ANCHOR_VARIABLE/.test(object)) unguarded.push(`${p}: ${object.split('\n')[0]}`);
    }
  }
  assert.ok(sources.length > 0);
  assert.deepEqual(unguarded, []);
});
