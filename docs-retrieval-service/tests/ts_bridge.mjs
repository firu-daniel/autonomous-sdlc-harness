/**
 * The Python suite's one way to ask the running TypeScript retrieval code a question.
 *
 * **The rule this module exists to enforce: it answers from the running TypeScript code and never
 * from a copy of it.** Every value it prints is computed by, or read off the export of, the compiled
 * modules under `cli/dist/retrieval/`, the eval's corpus composer `evals/docs-retrieval/corpora.mjs`
 * or the suite's fixture helpers `cli/test/helpers/fixture.mjs`; none is typed here. It reads the
 * TypeScript side and changes nothing in it. Its precondition is `npm run build`.
 *
 * Usage: `node ts_bridge.mjs <sub-command> [args...]`. Sub-commands marked (stdin) read one JSON
 * document from stdin. Exactly one JSON document is written to stdout; a failure writes its message
 * to stderr and exits non-zero.
 *
 *   corpus <fixture-catalog|self-docs>     the eval's corpus, enumerated and chunked
 *   constants                              the exported constants of search, store, server, models
 *   render (stdin)                         `renderResults` of a `SearchResult`
 *   stub-models (stdin)                    the stub embedder's vectors and the stub reranker's scores
 *   prepare-ts-fixture <dir> <cacheHome> (stdin)
 *                                          a retrieval-on repository in the existing empty `dir`, and
 *                                          the planted model cache under `cacheHome`; nothing else
 *
 * `constants` passes `384` to `chunkEmbeddingColumn` because its output key names that width; the
 * column text itself is the owner's.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

import { chunkMarkdown } from '../../cli/dist/retrieval/chunk.js';
import { corpusFiles } from '../../cli/dist/retrieval/corpus.js';
import { RETRIEVAL_STUB_ENV, resolveModels } from '../../cli/dist/retrieval/models.js';
import {
  ABSTAIN_MESSAGE,
  ABSTAIN_SCORE_THRESHOLD,
  ARM_CANDIDATES,
  DEFAULT_RESULTS,
  MAX_RESULTS,
  RERANK_CANDIDATES,
  RRF_K,
  SEARCH_MODES,
  renderResults,
} from '../../cli/dist/retrieval/search.js';
import { DOCS_SERVER_NAME, SEARCH_TOOL_NAME, SEARCH_TOOL_PERMISSION } from '../../cli/dist/retrieval/server.js';
import {
  BM25_INDEX,
  BM25_INDEX_DEFINITION,
  BM25_ORDER_CLAUSE,
  CHUNKS_TABLE,
  CHUNK_TEXT_COLUMN,
  EMBEDDER_META_KEY,
  chunkEmbeddingColumn,
} from '../../cli/dist/retrieval/store.js';
import { BUILT_IN_CORPORA, corpusConfig } from '../../evals/docs-retrieval/corpora.mjs';
import {
  CLI_ENTRY,
  plantModelFiles,
  retrievalEnv,
  seedRepository,
  writeRetrievalConfig,
} from '../../cli/test/helpers/fixture.mjs';

const CHECKOUT_ROOT = resolve(import.meta.dirname, '..', '..');

function readStdinJson() {
  return JSON.parse(readFileSync(0, 'utf8'));
}

function corpus(id) {
  if (!BUILT_IN_CORPORA.includes(id)) {
    throw new Error(`corpus needs one of ${BUILT_IN_CORPORA.join(' and ')}, got ${JSON.stringify(id)}`);
  }
  const { config, repoRoot } = corpusConfig({ repoRoot: CHECKOUT_ROOT, corpus: id });
  const { files, warnings } = corpusFiles(repoRoot, config);
  const chunks = [];
  for (const path of files) {
    for (const { key, path: chunkPath, anchor, heading, text, body, hash } of chunkMarkdown(
      path,
      readFileSync(join(repoRoot, path), 'utf8'),
    )) {
      chunks.push({ key, path: chunkPath, anchor, heading, text, body, hash });
    }
  }
  return { repoRoot, config, files, warnings, chunks };
}

function constants() {
  return {
    search: {
      RRF_K,
      ARM_CANDIDATES,
      RERANK_CANDIDATES,
      DEFAULT_RESULTS,
      MAX_RESULTS,
      ABSTAIN_SCORE_THRESHOLD,
      ABSTAIN_MESSAGE,
      SEARCH_MODES,
    },
    store: {
      CHUNKS_TABLE,
      BM25_INDEX,
      BM25_INDEX_DEFINITION,
      BM25_ORDER_CLAUSE,
      CHUNK_TEXT_COLUMN,
      EMBEDDER_META_KEY,
      embeddingColumn384: chunkEmbeddingColumn(384),
    },
    server: { DOCS_SERVER_NAME, SEARCH_TOOL_NAME, SEARCH_TOOL_PERMISSION },
    models: { RETRIEVAL_STUB_ENV },
  };
}

function render() {
  const { abstained, hits, bestRerankScore } = readStdinJson();
  return { text: renderResults({ abstained, hits, bestRerankScore }) };
}

async function stubModels() {
  const { version, documents, query, passages } = readStdinJson();
  process.env[RETRIEVAL_STUB_ENV] = version;
  const { embedder, reranker } = await resolveModels({ allowRemote: false });
  return {
    embedderId: embedder.id,
    rerankerId: reranker.id,
    dimensions: embedder.dimensions,
    documentVectors: await embedder.embedDocuments(documents),
    queryVector: await embedder.embedQuery(query),
    scores: await reranker.score(query, passages),
  };
}

async function prepareTsFixture(dir, cacheHome) {
  if (dir === undefined || cacheHome === undefined) {
    throw new Error('prepare-ts-fixture needs <dir> <cacheHome>');
  }
  const { files } = readStdinJson();
  const root = resolve(dir);
  for (const [relativePath, content] of Object.entries(files)) {
    const target = resolve(root, relativePath);
    if (!target.startsWith(`${root}${sep}`)) {
      throw new Error(`prepare-ts-fixture: ${relativePath} resolves outside ${root}`);
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, 'utf8');
  }
  await seedRepository(root, { remote: false });
  await writeRetrievalConfig(root);
  await plantModelFiles(cacheHome);
  return { env: retrievalEnv(cacheHome), cliEntry: CLI_ENTRY };
}

async function answer(subCommand, args) {
  switch (subCommand) {
    case 'corpus':
      return corpus(args[0]);
    case 'constants':
      return constants();
    case 'render':
      return render();
    case 'stub-models':
      return stubModels();
    case 'prepare-ts-fixture':
      return prepareTsFixture(args[0], args[1]);
    default:
      throw new Error(
        `unknown sub-command ${JSON.stringify(subCommand)}; ` +
          'expected corpus, constants, render, stub-models or prepare-ts-fixture',
      );
  }
}

try {
  process.stdout.write(`${JSON.stringify(await answer(process.argv[2], process.argv.slice(3)))}\n`);
} catch (error) {
  process.stderr.write(`ts_bridge: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
