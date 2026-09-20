/**
 * `docs index`, `docs search` and `docs serve` on a fixture corpus: the task prompt's Acceptance 3, and
 * Acceptance 4 at the CLI and through the MCP SDK's own client.
 *
 * **The rules these tests exist to enforce: a refresh embeds exactly the chunks that changed, removes
 * the chunks of a deleted document, and rebuilds on a new embedder; a search cites `path#anchor`, and
 * only `fused-rerank` abstains — and the suite never downloads a model.** Every run takes the `hash-v1` or `hash-v2` stub through `retrievalEnv`, with the model
 * files planted as empty files under a temp `XDG_CACHE_HOME`.
 *
 * The `serve (h)`-`(j)` cases add one more: the query log is off until its variable names a path, its
 * record key set is the contract `feat_docs_retrieval_eval` reads, and a log that cannot be written
 * costs a caller a stderr warning and never its answer.
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, realpath, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import {
  CLI_ENTRY,
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

/** A retrieval-on fixture with a corpus, a planted model cache and its env; torn down with `t`. */
async function retrievalFixture(t, files = CORPUS) {
  const fixture = await createFixture({ files, remote: false });
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

/**
 * A house-template document: a `##` wrapper whose body is `howItWorksBody` over two `###` children, a
 * `##` with a body of its own over one child, and a `##` with neither body nor child.
 */
function catalog(howItWorksBody) {
  return [
    '# Catalog',
    'Intro line of the catalog.',
    '## How it works',
    howItWorksBody,
    '### Cache lookup',
    'A stored entry is returned unchanged.',
    '### Cache write',
    'A miss is written back to the store.',
    '## What it is',
    'The catalog groups documents by topic.',
    '### Scope',
    'One line about which documents are in.',
    '## Open questions',
    '',
  ].join('\n');
}

const CATALOG_CORPUS = {
  'docs/catalog.md': catalog(''),
  'conventions.md': CORPUS['conventions.md'],
};

/**
 * The wrapper fold, on the shape that makes it worth having: a catalog written to a house template,
 * where the same bodiless `##` heading opens most documents. Eight chunks, not nine — `## How it
 * works` is folded into its two children, while the `##` with a body and the childless empty `##`
 * are both emitted.
 */
test('chunking: a bodiless ## wrapper is folded into its ### children', async (t) => {
  const { dir, env } = await retrievalFixture(t, CATALOG_CORPUS);

  assert.equal(await indexOk(dir, env), 'docs index: 2 files, 8 chunks; embedded 8, unchanged 0, deleted 0');

  // The wrapper's words reach the index only through its children's heading path, which is the whole
  // reason folding it loses nothing.
  const wrapper = await searchOk(dir, env, ['how it works cache lookup', '--mode', 'lexical', '--k', '5']);
  assert.ok(!wrapper.includes('#how-it-works'), wrapper);
  assert.match(wrapper, /docs\/catalog\.md#cache-lookup/);

  // A `##` with a body of its own and a `###` child: both still emitted, exactly as before.
  const withBody = await searchOk(dir, env, ['groups documents by topic', '--mode', 'lexical']);
  assert.match(withBody, /docs\/catalog\.md#what-it-is/);
  const child = await searchOk(dir, env, ['which documents are in', '--mode', 'lexical']);
  assert.match(child, /docs\/catalog\.md#scope/);

  // The recorded decision: an empty section with no child at all is kept, because its words survive
  // nowhere else in the index.
  const childless = await searchOk(dir, env, ['open questions', '--mode', 'lexical']);
  assert.match(childless, /docs\/catalog\.md#open-questions/);
});

/**
 * Why this change needs no index version bump: a chunk's identity is `path#anchor`, so an index built
 * before the fold simply carries a key the corpus no longer produces, and the next refresh deletes it
 * without re-embedding anything else and without rebuilding.
 */
test('chunking: an index holding a wrapper row drops it on the next refresh, no rebuild', async (t) => {
  const { dir, env } = await retrievalFixture(t, {
    ...CATALOG_CORPUS,
    'docs/catalog.md': catalog('A paragraph the wrapper owns.'),
  });

  assert.equal(await indexOk(dir, env), 'docs index: 2 files, 9 chunks; embedded 9, unchanged 0, deleted 0');

  await writeFile(join(dir, 'docs/catalog.md'), catalog(''));

  assert.equal(await indexOk(dir, env), 'docs index: 2 files, 8 chunks; embedded 0, unchanged 8, deleted 1');
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
  // A mode that never abstains still answers when it found nothing — the one thing a caller cannot
  // tell from a run that did nothing at all.
  assert.equal(await searchOk(dir, env, [NO_MATCH_QUERY, '--mode', 'lexical']), 'no results');

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

test('search (f): docs search --dry-run answers from memory and leaves the tree byte-identical', async (t) => {
  const { dir, env } = await retrievalFixture(t);
  const before = await snapshotTree(dir);

  const hybrid = await searchOk(dir, env, [MATCH_QUERY, '--dry-run']);
  assert.ok(hybrid.split('\n')[0].startsWith('1. docs/guide.md#offline (score '), hybrid);

  assert.deepEqual(await snapshotTree(dir), before);
  assert.equal(existsSync(join(dir, 'sdlc-harness', 'docs_index')), false);
});

test('docs refuses an unknown sub-verb and an unknown flag, naming docs --help', async (t) => {
  const { dir, env } = await retrievalFixture(t);
  for (const args of [['docs', 'reindex'], ['docs', 'index', '--bogus'], ['docs']]) {
    const result = await runCli(dir, args, env);
    assert.notEqual(result.status, 0, args.join(' '));
    assert.match(result.stderr, /docs --help/, args.join(' '));
  }
});

/**
 * Run `body` against a `docs serve` child through the SDK's stdio client, closing the client in a
 * `finally` so a failing assertion leaves no server process behind.
 */
async function withServer(fixture, body, extraEnv = {}) {
  const client = new Client({ name: 'docs-retrieval-test', version: '0.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [CLI_ENTRY, 'docs', 'serve', '--cwd', fixture.dir],
    env: { ...process.env, ...retrievalEnv(fixture.cacheHome), ...extraEnv },
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });
  try {
    await client.connect(transport);
    await body(client, () => stderr);
  } finally {
    await client.close();
  }
}

/** Poll `read` until it matches `pattern` or the budget runs out; the server's stderr is a second pipe. */
async function waitForStderr(read, pattern) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (pattern.test(read())) return read();
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return read();
}

function toolText(result) {
  return result.content.map((part) => part.text).join('\n');
}

test('serve (a)-(d): search_docs over stdio MCP', async (t) => {
  const fixture = await retrievalFixture(t);

  await withServer(fixture, async (client) => {
    // (a) The handshake passing is also the proof nothing reached stdout ahead of the transport.
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name),
      ['search_docs'],
    );

    // (b) Acceptance 4.
    const match = await client.callTool({ name: 'search_docs', arguments: { query: MATCH_QUERY } });
    assert.notEqual(match.isError, true, toolText(match));
    assert.ok(toolText(match).split('\n')[0].startsWith('1. docs/guide.md#offline (score '), toolText(match));

    // (c) Acceptance 4.
    const none = await client.callTool({ name: 'search_docs', arguments: { query: NO_MATCH_QUERY } });
    assert.equal(toolText(none), 'no confident match');

    // (d)
    const empty = await client.callTool({ name: 'search_docs', arguments: { query: '' } });
    assert.equal(empty.isError, true);
  });
});

test('serve (e): docs serve with docs.retrieval false exits non-zero before the handshake', async (t) => {
  const { dir, env } = await retrievalFixture(t);
  const set = await runCli(dir, ['config', 'set', 'docs.retrieval', 'false'], env);
  assert.equal(set.status, 0, set.stderr);

  const result = await runCli(dir, ['docs', 'serve'], env);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /docs retrieval is off in harness\.config\.json/);
});

test('serve (f): docs serve --dry-run exits non-zero before the handshake and writes nothing', async (t) => {
  const { dir, env } = await retrievalFixture(t);
  const before = await snapshotTree(dir);

  const result = await runCli(dir, ['docs', 'serve', '--dry-run'], env);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /docs serve: --dry-run is not supported/);
  assert.deepEqual(await snapshotTree(dir), before);
});

/**
 * A corpus-coverage warning reaches the calling agent, which reads the tool result and never the
 * server log stderr is captured into. The tool's own description must declare the shape, so the two
 * are asserted together: an agent told only about hits and `no confident match` would read a `note:`
 * line as a result rather than as a diagnostic.
 */
test('serve (g): a skipped corpus file becomes a note line on the tool result, declared in the description', async (t) => {
  const fixture = await retrievalFixture(t);
  await unlink(join(fixture.dir, 'conventions.md'));

  await withServer(fixture, async (client) => {
    const { tools } = await client.listTools();
    assert.match(tools[0].description, /"note: " lines/, tools[0].description);

    const match = await client.callTool({ name: 'search_docs', arguments: { query: MATCH_QUERY } });
    assert.notEqual(match.isError, true, toolText(match));
    const lines = toolText(match).split('\n');
    assert.equal(
      lines[0],
      'note: conventions document conventions.md of layer general is missing and was skipped',
      toolText(match),
    );
    assert.equal(lines[1], '', toolText(match));
    assert.ok(lines[2].startsWith('1. docs/guide.md#offline (score '), toolText(match));
  });
});

/** The variable `cli/src/retrieval/queryLog.ts` owns; its only spelling outside that module. */
const LOG_ENV = 'AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG';

/**
 * The key set of one record, which the `feat_docs_retrieval_eval` branch reads as a contract: it is
 * asserted whole and in order rather than key by key, so a field quietly dropped or renamed fails
 * here rather than on that branch.
 */
const LOG_KEYS = ['outcome', 'timestamp', 'query', 'k', 'hits', 'bestScore', 'abstained', 'refresh', 'durationMs'];

test('serve (h): one search_docs call appends one JSONL record carrying every field', async (t) => {
  const fixture = await retrievalFixture(t);
  const logPath = join(fixture.dir, 'queries.jsonl');

  await withServer(
    fixture,
    async (client) => {
      const match = await client.callTool({ name: 'search_docs', arguments: { query: MATCH_QUERY } });
      assert.notEqual(match.isError, true, toolText(match));
    },
    { [LOG_ENV]: logPath },
  );

  const lines = (await readFile(logPath, 'utf8')).split('\n');
  assert.deepEqual(lines.slice(1), [''], 'exactly one line, newline-terminated');
  const record = JSON.parse(lines[0]);
  assert.deepEqual(Object.keys(record), LOG_KEYS);
  assert.equal(record.outcome, 'answered');
  assert.match(record.timestamp, /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
  assert.equal(record.query, MATCH_QUERY);
  assert.equal(record.k, 5);
  assert.ok(record.hits > 0, lines[0]);
  assert.equal(typeof record.bestScore, 'number');
  assert.equal(record.abstained, false);
  // The first call of a server is also the cold build, so the refresh counts are the ones
  // `docs index` reports for this corpus.
  assert.deepEqual(record.refresh, { embedded: 9, unchanged: 0, deleted: 0 });
  assert.equal(typeof record.durationMs, 'number');
});

test('serve (i): with the variable unset, a search_docs call creates no log anywhere', async (t) => {
  const fixture = await retrievalFixture(t);
  const logPath = join(fixture.dir, 'queries.jsonl');

  await withServer(fixture, async (client) => {
    const match = await client.callTool({ name: 'search_docs', arguments: { query: MATCH_QUERY } });
    assert.notEqual(match.isError, true, toolText(match));
  });

  assert.equal(existsSync(logPath), false);
});

/**
 * The seam may not cost a caller its answer: a logging failure is the server's problem and the search
 * result is returned unchanged, with the diagnostic on stderr — never on stdout, which the MCP
 * transport owns.
 */
test('serve (j): an unwritable log path still answers, warning on stderr', async (t) => {
  const fixture = await retrievalFixture(t);
  const logPath = join(fixture.dir, 'no-such-dir', 'queries.jsonl');

  await withServer(
    fixture,
    async (client, stderr) => {
      const match = await client.callTool({ name: 'search_docs', arguments: { query: MATCH_QUERY } });
      assert.notEqual(match.isError, true, toolText(match));
      assert.ok(toolText(match).split('\n')[0].startsWith('1. docs/guide.md#offline (score '), toolText(match));

      const captured = await waitForStderr(stderr, new RegExp(LOG_ENV));
      assert.match(captured, new RegExp(`${LOG_ENV}: appending to .*queries\\.jsonl failed`));
    },
    { [LOG_ENV]: logPath },
  );

  assert.equal(existsSync(logPath), false);
});
