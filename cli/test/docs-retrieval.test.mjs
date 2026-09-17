/**
 * `docs index` and `docs search` on a fixture corpus: the task prompt's Acceptance 3, and the CLI half
 * of Acceptance 4.
 *
 * **The rules these tests exist to enforce: a refresh embeds exactly the chunks that changed, removes
 * the chunks of a deleted document, and rebuilds on a new embedder; a search cites `path#anchor`, and
 * only `fused-rerank` abstains — and the suite never downloads a model.** Every run takes the `hash-v1` or `hash-v2` stub through `retrievalEnv`, with the model
 * files planted as empty files under a temp `XDG_CACHE_HOME`.
 */

import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  createFixture,
  plantModelFiles,
  retrievalEnv,
  runCli,
  snapshotTree,
  writeRetrievalConfig,
} from './helpers/fixture.mjs';

const FENCE = '```';

function guide(usageBody) {
  return [
    '# Guide',
    'Intro paragraph about the guide.',
    '## Setup',
    'Install the tool. A fence follows.',
    FENCE,
    '## not a heading',
    FENCE,
    '### Offline',
    'Work without a network.',
    '## Usage',
    usageBody,
    '## Setup',
    'A second setup section.',
    '',
  ].join('\n');
}

const CORPUS = {
  'docs/guide.md': guide('Run the tool against a repository.'),
  'docs/other.md': '# Other\nIntro line of the other document.\n## Topic\nA line about the topic.\n',
  'conventions.md': '# Conventions\nIntro line of the conventions.\n## Rules\nA line about the rules.\n',
};

/** A retrieval-on fixture with the corpus, a planted model cache and its env; torn down with `t`. */
async function retrievalFixture(t) {
  const fixture = await createFixture({ files: CORPUS, remote: false });
  t.after(fixture.cleanup);
  await writeRetrievalConfig(fixture.dir);
  const cacheHome = await realpath(await mkdtemp(join(tmpdir(), 'harness-retrieval-cache-')));
  t.after(() => rm(cacheHome, { recursive: true, force: true }));
  await plantModelFiles(cacheHome);
  return { dir: fixture.dir, cacheHome, env: retrievalEnv(cacheHome) };
}

async function indexOk(dir, env, args = []) {
  const result = await runCli(dir, ['docs', 'index', ...args], env);
  assert.equal(result.status, 0, `docs index exited ${result.status}\n${result.stderr}`);
  return result.stdout.trim();
}

test('(a)-(e) docs index refreshes incrementally, deletes, and rebuilds on a new embedder', async (t) => {
  const { dir, env } = await retrievalFixture(t);

  // (a) Stub cold build of this corpus: 967 to 1372 ms wall time over five `docs index` subprocess
  // runs, process and PGlite start-up included; macOS, Node v20.19.5, 2026-09-17.
  assert.equal(await indexOk(dir, env), 'docs index: 3 files, 9 chunks; embedded 9, unchanged 0, deleted 0');

  // (b)
  assert.equal(await indexOk(dir, env), 'docs index: 3 files, 9 chunks; embedded 0, unchanged 9, deleted 0');

  // (c)
  await writeFile(join(dir, 'docs/guide.md'), guide('Run the tool against a different repository.'));
  assert.equal(await indexOk(dir, env), 'docs index: 3 files, 9 chunks; embedded 1, unchanged 8, deleted 0');

  // (d)
  await unlink(join(dir, 'docs/other.md'));
  assert.equal(await indexOk(dir, env), 'docs index: 2 files, 7 chunks; embedded 0, unchanged 7, deleted 2');

  // (e) The rebuild's clear() is not counted as deletions.
  assert.equal(
    await indexOk(dir, { ...env, AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB: 'hash-v2' }),
    'docs index: 2 files, 7 chunks; embedded 7, unchanged 0, deleted 0; rebuilt for a new embedder',
  );
});

test('(f) docs index --in-memory leaves the tree byte-identical', async (t) => {
  const { dir, env } = await retrievalFixture(t);
  const before = await snapshotTree(dir);

  assert.equal(
    await indexOk(dir, env, ['--in-memory']),
    'docs index: 3 files, 9 chunks; embedded 9, unchanged 0, deleted 0',
  );

  assert.deepEqual(await snapshotTree(dir), before);
});

test('(g) docs index refuses with docs.retrieval false', async (t) => {
  const { dir, env } = await retrievalFixture(t);
  const set = await runCli(dir, ['config', 'set', 'docs.retrieval', 'false'], env);
  assert.equal(set.status, 0, set.stderr);
  const before = await snapshotTree(dir);

  const result = await runCli(dir, ['docs', 'index'], env);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /docs retrieval is off in harness\.config\.json/);
  assert.deepEqual(await snapshotTree(dir), before);
});

test('(h) docs index refuses with the model files removed, naming a missing file', async (t) => {
  const { dir, cacheHome, env } = await retrievalFixture(t);
  await rm(join(cacheHome, 'autonomous-sdlc-harness', 'retrieval', 'models'), { recursive: true, force: true });
  const before = await snapshotTree(dir);

  const result = await runCli(dir, ['docs', 'index'], env);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Xenova\/bge-small-en-v1\.5\/config\.json/);
  assert.deepEqual(await snapshotTree(dir), before);
});

async function searchOk(dir, env, args) {
  const result = await runCli(dir, ['docs', 'search', ...args], env);
  assert.equal(result.status, 0, `docs search exited ${result.status}\n${result.stderr}`);
  return result.stdout.trim();
}

const MATCH_QUERY = 'work without a network';
const NO_MATCH_QUERY = 'quantum chromodynamics lattice';

test('search (a)-(d): hybrid search, abstention, lexical mode and --k', async (t) => {
  const { dir, env } = await retrievalFixture(t);

  // (a)
  const hybrid = await searchOk(dir, env, [MATCH_QUERY]);
  assert.ok(hybrid.split('\n')[0].startsWith('1. docs/guide.md#offline (score '), hybrid);

  // (b) The abstention half of Acceptance 4 at the CLI.
  assert.equal(await searchOk(dir, env, [NO_MATCH_QUERY]), 'no confident match');

  // (c)
  const lexical = await searchOk(dir, env, [MATCH_QUERY, '--mode', 'lexical']);
  assert.ok(lexical.split('\n')[0].startsWith('1. docs/guide.md#offline (score '), lexical);
  assert.equal(await searchOk(dir, env, [NO_MATCH_QUERY, '--mode', 'lexical']), '');

  // (d)
  const one = await searchOk(dir, env, [MATCH_QUERY, '--k', '1']);
  assert.equal(one.split('\n').filter((line) => /^\d+\. /.test(line)).length, 1, one);
});

test('search (e): an unknown --mode is refused, naming the four modes', async (t) => {
  const { dir, env } = await retrievalFixture(t);

  const result = await runCli(dir, ['docs', 'search', MATCH_QUERY, '--mode', 'nonsense'], env);

  assert.notEqual(result.status, 0);
  for (const mode of ['lexical', 'vector', 'fused', 'fused-rerank']) assert.match(result.stderr, new RegExp(`\\b${mode}\\b`));
});

test('docs refuses an unknown sub-verb and an unknown flag, naming docs --help', async (t) => {
  const { dir, env } = await retrievalFixture(t);
  for (const args of [['docs', 'reindex'], ['docs', 'index', '--bogus'], ['docs']]) {
    const result = await runCli(dir, args, env);
    assert.notEqual(result.status, 0, args.join(' '));
    assert.match(result.stderr, /docs --help/, args.join(' '));
  }
});
