/**
 * The main checkout's anchor as the written watcher sets it, and the outer-loop scripts' silence on it.
 *
 * **The rule these tests exist to enforce: every session the watcher launches carries the main
 * checkout's path in the anchor variable, set from the watcher's own `MAIN_REPO` and never passed on
 * from the watcher's environment, and no other outer-loop script names the variable outside a
 * comment.** The name is `MAIN_REPO_ANCHOR_VARIABLE`'s (`cli/src/core/mainRepoAnchor.ts`); the guard
 * is built from that constant, so a renamed constant fails here until the template follows.
 */

import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { createWatcherFixture } from './helpers/watcher.mjs';

const TEMPLATE_SCRIPTS_DIR = fileURLToPath(new URL('../templates/scripts/', import.meta.url));
const RECORDED = 'watcher-test/main-anchor.txt';

/** A fixture with one parked run whose answer is in, and a stub that records the anchor it was given. */
async function parkedRunRecordingAnchor(t) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;
  await w.writeQuestion(1, '## Q1\n');
  await w.seedRecord();
  await w.writeAnswer(1, 'a1\n');
  await w.setStub(`printf '%s' "\${${MAIN_REPO_ANCHOR_VARIABLE}-unset}" > '${join(w.dir, RECORDED)}'`);
  return w;
}

async function recordedAnchor(w) {
  assert.equal(w.prompts().length, 1, `expected one resume:\n${w.watcherLog()}`);
  return readFile(join(w.dir, RECORDED), 'utf8');
}

test('the launched session carries the main checkout in the anchor', async (t) => {
  const w = await parkedRunRecordingAnchor(t);
  if (w === null) return;

  await w.tick();

  assert.equal(await recordedAnchor(w), w.dir);
});

test('an anchor the watcher inherited is overwritten, never passed on', async (t) => {
  const w = await parkedRunRecordingAnchor(t);
  if (w === null) return;
  const inherited = await mkdtemp(join(tmpdir(), 'harness-inherited-anchor-'));
  t.after(() => rm(inherited, { recursive: true, force: true }));

  await w.tick({ [MAIN_REPO_ANCHOR_VARIABLE]: inherited });

  assert.equal(await recordedAnchor(w), w.dir);
});

async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)])),
  );
  return nested.flat();
}

test('outside comments, only the watcher names the anchor, once, in its export', async () => {
  const hits = [];
  for (const file of await filesUnder(TEMPLATE_SCRIPTS_DIR)) {
    const lines = (await readFile(file, 'utf8')).split('\n');
    for (const line of lines) {
      if (line.trimStart().startsWith('#')) continue;
      if (line.includes(MAIN_REPO_ANCHOR_VARIABLE)) hits.push({ file: relative(TEMPLATE_SCRIPTS_DIR, file), line: line.trim() });
    }
  }

  assert.deepEqual(hits, [
    { file: 'autonomous-watcher.sh', line: `export ${MAIN_REPO_ANCHOR_VARIABLE}="$MAIN_REPO"` },
  ]);
});
