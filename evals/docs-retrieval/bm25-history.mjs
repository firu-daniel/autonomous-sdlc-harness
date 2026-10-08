/**
 * The BM25 index's history, measured statement by statement: one fixed sequence of writes against a
 * `chunks` table carrying the store's own BM25 index, on PGlite and on the compose Postgres, with every
 * query's scores and the index's own corpus statistics read back after each step.
 *
 * **The rule this module exists to enforce: a step's scores are compared against a fresh index of the
 * same live rows, never against a remembered figure, and nothing here measures time unless the caller
 * asks for the rebuild cost.** Step `s0` builds that reference in the same process and on the same
 * engine; every later step is reported as the hits on corpus A's keys whose score differs from it at
 * six decimals, so re-running the sequence reproduces every figure it prints. A wall-clock figure is
 * taken only under `timeReindex`, and only around step `s5`.
 *
 * Every statement is composed from the store's exported shapes in `cli/dist/retrieval/store.js`
 * (`cli/src/retrieval/store.ts` → the module header's second paragraph), and every value reaches SQL
 * as a bound parameter: through `db.query` on PGlite, and through psql's `\bind` on Postgres. The score
 * statement is the comparison's own probe statement with the query bound rather than dollar-quoted
 * (`docs/retrieval-eval-results.md` → `### Divergence sources, in the order checked`, item 3).
 *
 * **Postgres statements reach psql on its stdin, not through `-c`.** A `self-docs` chunk is larger than
 * the 131072 bytes Linux allows one argument, so a row cannot travel as an argument vector element,
 * and `-c` cannot carry a `\bind` beside its SQL. The route is otherwise item 3's: `docker compose exec
 * -T postgres psql -At -F ' '` from {@link COMPOSE_DIR}, spawned with a fixed argument vector, against
 * a database this module creates after a `DROP DATABASE IF EXISTS` and drops on every exit path.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { parseArgs as parseFlags } from 'node:util';

import { chunkMarkdown } from '../../cli/dist/retrieval/chunk.js';
import { corpusFiles } from '../../cli/dist/retrieval/corpus.js';
import { PYTHON_DEFAULT_DATABASE_URL } from '../../cli/dist/retrieval/pythonBackend.js';
import { loadRetrievalModule } from '../../cli/dist/retrieval/runtime.js';
import {
  BM25_INDEX,
  BM25_INDEX_DEFINITION,
  BM25_ORDER_CLAUSE,
  CHUNKS_TABLE,
  CHUNK_TEXT_COLUMN,
  chunkEmbeddingColumn,
} from '../../cli/dist/retrieval/store.js';
import { parseArgs } from './args.mjs';
import { BUILT_IN_CORPORA, corpusConfig } from './corpora.mjs';
import { COMPOSE_DIR, POSTGRES_SERVICE } from './python-backend.mjs';
import { loadQueries } from './queries.mjs';

export const ENGINES = Object.freeze(['pglite', 'postgres']);

/** `cli/src/retrieval/models.ts` → `EMBEDDING_DIMENSIONS`, unexported; it keeps the row width the store's. */
const EMBEDDING_DIMENSIONS = 384;

/** No score reads the embedding, so every row carries this one. */
const CONSTANT_VECTOR = `[${new Array(EMBEDDING_DIMENSIONS).fill(0.1).join(',')}]`;

/** The database the Postgres engine creates on the compose server and drops afterwards. */
const PROBE_DATABASE = 'bm25_history_probe';

/** Where a corpus's query set lives (`evals/docs-retrieval/args.mjs` → `QUERIES_DIR`). */
const QUERIES_DIR = 'evals/docs-retrieval/queries';

/** How many differing hits a step lists with both scores. */
const LISTED_DIFFERENCES = 3;

/** One psql answer carries every score of a step; the default 1 MiB buffer is too small. */
const PSQL_MAX_BUFFER = 256 * 1024 * 1024;

const MARKER = '@@bm25-history';

const SCORE_EXPRESSION = `round((${BM25_ORDER_CLAUSE})::numeric, 6)`;

const STATEMENTS = Object.freeze({
  extensions: ['CREATE EXTENSION IF NOT EXISTS vector', 'CREATE EXTENSION IF NOT EXISTS pg_textsearch'],
  dropTable: `DROP TABLE IF EXISTS ${CHUNKS_TABLE}`,
  createTable: `CREATE TABLE ${CHUNKS_TABLE} (id serial PRIMARY KEY, key text UNIQUE NOT NULL, ${CHUNK_TEXT_COLUMN}, ${chunkEmbeddingColumn(EMBEDDING_DIMENSIONS)})`,
  createIndex: `CREATE INDEX ${BM25_INDEX} ${BM25_INDEX_DEFINITION}`,
  upsert: `INSERT INTO ${CHUNKS_TABLE} (key, text, embedding) VALUES ($1, $2, $3::vector) ON CONFLICT (key) DO UPDATE SET text = EXCLUDED.text, embedding = EXCLUDED.embedding`,
  deleteKeys: `DELETE FROM ${CHUNKS_TABLE} WHERE key = ANY($1::text[])`,
  heapCount: `SELECT count(*) FROM ${CHUNKS_TABLE}`,
  contentDigest: `SELECT md5(string_agg(key || chr(10) || text, chr(10) ORDER BY key COLLATE "C")) FROM ${CHUNKS_TABLE}`,
  summarize: `SELECT bm25_summarize_index('${BM25_INDEX}')`,
  vacuum: `VACUUM ${CHUNKS_TABLE}`,
  reindex: `REINDEX INDEX ${BM25_INDEX}`,
  score: `SELECT key, ${SCORE_EXPRESSION} AS s FROM ${CHUNKS_TABLE} ORDER BY ${BM25_ORDER_CLAUSE} LIMIT $2`,
  explainScore: `EXPLAIN (COSTS OFF) SELECT key, ${SCORE_EXPRESSION} AS s FROM ${CHUNKS_TABLE} ORDER BY ${BM25_ORDER_CLAUSE} LIMIT $2`,
  version: 'SELECT version()',
  extversion: "SELECT extversion FROM pg_extension WHERE extname = 'pg_textsearch'",
  autovacuumCount: `SELECT autovacuum_count FROM pg_stat_user_tables WHERE relname = '${CHUNKS_TABLE}'`,
});

/** The statements, in the order the sequence first issues them, as the record quotes them. */
export const BM25_HISTORY_STATEMENTS = STATEMENTS;

/** The `Corpus Statistics:` lines, the memtable's document count and the segments' total line. */
function parseSummary(text) {
  const field = (name) => new RegExp(`^\\s*${name}: (\\S+)`, 'm').exec(text)?.[1];
  const memtable = /Memtable:\n(?:.*\n)*?\s*documents: (\d+)/.exec(text)?.[1];
  const segments = /Segments:\n\s*(.*)/.exec(text)?.[1] ?? '';
  const total = /^\s*Total: (.*)$/m.exec(text)?.[1];
  return {
    totalDocs: Number(field('total_docs')),
    totalLen: Number(field('total_len')),
    docsPersisted: Number(field('docs_persisted')),
    lenPersisted: Number(field('len_persisted')),
    avgDocLen: field('avg_doc_len'),
    memtableDocs: Number(memtable),
    segments: total ?? segments.trim(),
  };
}

function corpusChunks(repoRoot, id) {
  const resolved = corpusConfig({ repoRoot, corpus: id });
  const corpus = corpusFiles(resolved.repoRoot, resolved.config);
  const chunks = corpus.files.flatMap((path) =>
    chunkMarkdown(path, readFileSync(join(resolved.repoRoot, path), 'utf8')).map(({ key, text }) => ({ key, text })),
  );
  return { id, chunks, snapshot: { files: corpus.files.length, chunks: chunks.length } };
}

/** The digest {@link STATEMENTS}.contentDigest computes, over the rows this sequence wrote. */
function expectedDigest(chunks) {
  const sorted = [...chunks].sort((a, b) => Buffer.compare(Buffer.from(a.key), Buffer.from(b.key)));
  return createHash('md5')
    .update(sorted.map((chunk) => `${chunk.key}\n${chunk.text}`).join('\n'))
    .digest('hex');
}

/** One row as the shared text form: fields joined by a space, as `psql -At -F ' '` prints them. */
function rowText(row) {
  return Object.values(row)
    .map((value) => (value === null || value === undefined ? '' : String(value)))
    .join(' ');
}

async function openPglite() {
  const { PGlite } = await loadRetrievalModule('@electric-sql/pglite');
  const { vector } = await loadRetrievalModule('@electric-sql/pglite-pgvector');
  const { pg_textsearch } = await loadRetrievalModule('@electric-sql/pglite-pg_textsearch');
  const dataDir = mkdtempSync(join(tmpdir(), 'bm25-history-'));
  const open = () => PGlite.create({ dataDir, extensions: { vector, pg_textsearch } });
  let db = await open();

  return {
    name: 'pglite',
    /** Each statement's answer as text: rows joined by a newline, fields by a space. */
    async run(statements) {
      const answers = [];
      for (const { sql, params } of statements) {
        const result = params === undefined ? (await db.exec(sql)).at(-1) : await db.query(sql, params);
        answers.push((result?.rows ?? []).map(rowText).join('\n'));
      }
      return answers;
    },
    /** One parameterless statement's wall time, taken around the call in this process. */
    async timed(sql) {
      const start = performance.now();
      await db.exec(sql);
      return performance.now() - start;
    },
    async reopen() {
      await db.close();
      db = await open();
    },
    async close() {
      try {
        await db.close();
      } finally {
        rmSync(dataDir, { recursive: true, force: true });
      }
    },
  };
}

/** A value as a single-quoted psql meta-command argument: `\` and `'` escaped, line breaks spelled. */
function psqlArgument(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
}

function openPostgres(repoRoot) {
  const url = new URL(PYTHON_DEFAULT_DATABASE_URL);
  const user = decodeURIComponent(url.username);
  const maintenance = decodeURIComponent(url.pathname.replace(/^\//, ''));

  const psql = (database, script) => {
    const result = spawnSync(
      'docker',
      ['compose', 'exec', '-T', POSTGRES_SERVICE, 'psql', '-U', user, '-d', database, '-v', 'ON_ERROR_STOP=1', '-q', '-At', '-F', ' '],
      { cwd: join(repoRoot, COMPOSE_DIR), input: script, encoding: 'utf8', maxBuffer: PSQL_MAX_BUFFER },
    );
    if (result.error !== undefined) {
      throw new Error(`eval: bm25 history: could not run docker compose exec ${POSTGRES_SERVICE} psql: ${result.error.message}`);
    }
    if (result.status !== 0) {
      const stderr = result.stderr.split('\n').filter((line) => line.length > 0);
      throw new Error(
        `eval: bm25 history: docker compose exec ${POSTGRES_SERVICE} psql exited ${result.status ?? result.signal}; ` +
          `is the compose ${POSTGRES_SERVICE} service up? stderr: ${stderr.slice(-3).join(' / ') || '(none)'}`,
      );
    }
    return result.stdout;
  };

  const dropProbe = () => psql(maintenance, `DROP DATABASE IF EXISTS ${PROBE_DATABASE} \\g\n`);
  dropProbe();
  psql(maintenance, `CREATE DATABASE ${PROBE_DATABASE} \\g\n`);

  return {
    name: 'postgres',
    async run(statements) {
      const script = statements
        .map(({ sql, params }, index) => {
          const send = params === undefined ? '\\g' : `\\bind ${params.map(psqlArgument).join(' ')} \\g`;
          return `\\echo ${MARKER} ${index}\n${sql} ${send}\n`;
        })
        .join('');
      const answers = new Array(statements.length).fill('');
      const collected = answers.map(() => []);
      let current = -1;
      for (const line of psql(PROBE_DATABASE, script).split('\n')) {
        const marker = line.startsWith(`${MARKER} `) ? Number(line.slice(MARKER.length + 1)) : undefined;
        if (marker !== undefined && Number.isInteger(marker)) {
          current = marker;
          continue;
        }
        if (current >= 0) collected[current].push(line);
      }
      collected.forEach((lines, index) => {
        while (lines.length > 0 && lines.at(-1) === '') lines.pop();
        answers[index] = lines.join('\n');
      });
      return answers;
    },
    /** One parameterless statement's wall time as psql's own `\timing` reports it, so no `docker` hop is counted. */
    async timed(sql) {
      const time = /^Time: ([\d.]+) ms/m.exec(psql(PROBE_DATABASE, `\\timing on\n${sql} \\g\n`))?.[1];
      if (time === undefined) throw new Error(`eval: bm25 history: psql printed no timing line for ${sql}`);
      return Number(time);
    },
    async close() {
      dropProbe();
    },
  };
}

/** Every query's hits — the rows scoring non-zero — as `qid -> key -> score`, scores as six-decimal text. */
async function scoreAll(engine, queries, limit) {
  const answers = await engine.run(queries.map((query) => ({ sql: STATEMENTS.score, params: [query.query, String(limit)] })));
  const byQuery = new Map();
  queries.forEach((query, index) => {
    const hits = new Map();
    for (const line of answers[index].split('\n')) {
      if (line === '') continue;
      const split = line.lastIndexOf(' ');
      const key = line.slice(0, split);
      const score = line.slice(split + 1);
      if (Number(score) !== 0) hits.set(key, score);
    }
    byQuery.set(query.id, hits);
  });
  return byQuery;
}

/** The hits on `keys` that differ between `reference` and `scores`, a hit on one side only included. */
function differences(reference, scores, keys) {
  const differing = [];
  for (const [queryId, referenceHits] of reference) {
    const hits = scores.get(queryId) ?? new Map();
    const pairs = new Set([...referenceHits.keys(), ...hits.keys()].filter((key) => keys.has(key)));
    for (const key of pairs) {
      const before = referenceHits.get(key) ?? 'none';
      const after = hits.get(key) ?? 'none';
      if (before !== after) differing.push({ queryId, key, reference: before, step: after });
    }
  }
  return differing;
}

function countHits(scores, keys) {
  let count = 0;
  for (const hits of scores.values()) for (const key of hits.keys()) if (keys.has(key)) count += 1;
  return count;
}

/**
 * Runs the sequence on `engine` with corpus `corpusA` as the live rows and `corpusB` as the rows a
 * refresh to A deletes. Returns `{ engine, ranAt, server, extversion, corpora, queries, steps, scores }`,
 * plus `reindexMs` under `timeReindex`. Each step carries the heap count, the parsed summary, the
 * score plan's scan line, Postgres's `autovacuum_count`, and its hits on A's keys against `s0` and `s1`.
 */
export async function measureBm25History({ repoRoot, engine, corpusA, corpusB, timeReindex = false }) {
  if (!ENGINES.includes(engine)) throw new Error(`eval: bm25 history: engine ${engine} is not one of ${ENGINES.join(', ')}`);
  for (const id of [corpusA, corpusB]) {
    if (!BUILT_IN_CORPORA.includes(id)) throw new Error(`eval: bm25 history: corpus ${id} is not one of ${BUILT_IN_CORPORA.join(', ')}`);
  }
  if (corpusA === corpusB) throw new Error('eval: bm25 history: corpus A and corpus B must differ');

  const a = corpusChunks(repoRoot, corpusA);
  const b = corpusChunks(repoRoot, corpusB);
  const aKeys = new Set(a.chunks.map((chunk) => chunk.key));
  const collision = b.chunks.find((chunk) => aKeys.has(chunk.key));
  if (collision !== undefined) throw new Error(`eval: bm25 history: key ${collision.key} is in both corpora`);
  const queries = loadQueries(join(repoRoot, QUERIES_DIR, `${corpusA}.jsonl`));
  const limit = a.chunks.length + b.chunks.length;

  const ranAt = new Date().toISOString();
  const db = engine === 'pglite' ? await openPglite() : openPostgres(repoRoot);
  const steps = [];
  const scores = new Map();
  let reindexMs;

  const insert = (chunks) => db.run(chunks.map((chunk) => ({ sql: STATEMENTS.upsert, params: [chunk.key, chunk.text, CONSTANT_VECTOR] })));
  const freshTable = async (chunks) => {
    await db.run([{ sql: STATEMENTS.dropTable }, { sql: STATEMENTS.createTable }, { sql: STATEMENTS.createIndex }]);
    await insert(chunks);
    const [digest] = await db.run([{ sql: STATEMENTS.contentDigest }]);
    if (digest !== expectedDigest(chunks)) {
      throw new Error('eval: bm25 history: the rows read back differ from the chunks written, so no score here describes the corpus');
    }
  };
  const record = async (id, label) => {
    const [heap, summary, plan, autovacuum] = await db.run([
      { sql: STATEMENTS.heapCount },
      { sql: STATEMENTS.summarize },
      { sql: STATEMENTS.explainScore, params: [queries[0].query, String(limit)] },
      { sql: STATEMENTS.autovacuumCount },
    ]);
    const stepScores = await scoreAll(db, queries, limit);
    scores.set(id, stepScores);
    const reference = scores.get('s0');
    const all = differences(reference, stepScores, aKeys);
    const versusUnion = scores.has('s1') && id !== 's0' && id !== 's1' ? differences(scores.get('s1'), stepScores, aKeys) : undefined;
    steps.push({
      id,
      label,
      heapRows: Number(heap),
      summary: parseSummary(summary),
      scan: plan.split('\n').find((line) => /Scan/.test(line))?.trim() ?? plan.split('\n')[0]?.trim() ?? '',
      autovacuumCount: engine === 'postgres' ? autovacuum : 'n/a',
      hitsOnA: countHits(stepScores, aKeys),
      hitsOnB: countHits(stepScores, new Set(b.chunks.map((chunk) => chunk.key))),
      differingFromS0: all.length,
      firstDiffering: all.slice(0, LISTED_DIFFERENCES),
      differingFromS1: versusUnion?.length,
    });
  };

  let server;
  let extversion;
  try {
    await db.run(STATEMENTS.extensions.map((sql) => ({ sql })));
    [server, extversion] = await db.run([{ sql: STATEMENTS.version }, { sql: STATEMENTS.extversion }]);

    await freshTable(a.chunks);
    await record('s0', `fresh index of ${corpusA}`);

    await freshTable([...a.chunks, ...b.chunks]);
    await record('s1', `new table and index, ${corpusA} and ${corpusB} inserted`);

    await db.run([{ sql: STATEMENTS.deleteKeys, params: [`{${b.chunks.map((chunk) => `"${chunk.key.replace(/(["\\])/g, '\\$1')}"`).join(',')}}`] }]);
    await record('s2', `DELETE of ${corpusB}'s keys`);

    if (db.reopen !== undefined) {
      await db.reopen();
      await record('s3', 'data directory closed and reopened');
    }

    await db.run([{ sql: STATEMENTS.vacuum }]);
    await record('s4', STATEMENTS.vacuum);

    if (timeReindex) reindexMs = await db.timed(STATEMENTS.reindex);
    else await db.run([{ sql: STATEMENTS.reindex }]);
    await record('s5', STATEMENTS.reindex);

    const [first] = a.chunks;
    const other = a.chunks.at(-1);
    await db.run([
      { sql: STATEMENTS.upsert, params: [first.key, other.text, CONSTANT_VECTOR] },
      { sql: STATEMENTS.upsert, params: [first.key, first.text, CONSTANT_VECTOR] },
    ]);
    await record('s6', `ON CONFLICT DO UPDATE of ${first.key} to ${other.key}'s text and back`);

    await db.run([{ sql: STATEMENTS.reindex }]);
    await record('s7', STATEMENTS.reindex);
  } finally {
    await db.close();
  }

  return {
    engine,
    ranAt,
    server,
    extversion,
    corpora: { a: { id: a.id, snapshot: a.snapshot }, b: { id: b.id, snapshot: b.snapshot } },
    queries: { set: `${QUERIES_DIR}/${corpusA}.jsonl`, count: queries.length },
    steps,
    scores,
    ...(reindexMs === undefined ? {} : { reindexMs }),
  };
}

const stamp = (snapshot) => `{ files: ${snapshot.files}, chunks: ${snapshot.chunks} }`;

/** The summary a reader records from; `withScores` appends every score of every step. */
export function renderBm25History(result, { withScores = false } = {}) {
  const lines = [
    `bm25-history: engine ${result.engine}, ran ${result.ranAt}`,
    `server: ${result.server}`,
    `pg_textsearch: ${result.extversion}`,
    `corpus A: ${result.corpora.a.id} ${stamp(result.corpora.a.snapshot)}; corpus B: ${result.corpora.b.id} ${stamp(result.corpora.b.snapshot)}`,
    `queries: ${result.queries.count} from ${result.queries.set}`,
    '',
    '| Step | What | Heap rows | total_docs | total_len | Memtable docs | Segments | Score plan | autovacuum_count | Hits on A | Hits on B | A hits differing from s0 | A hits differing from s1 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const step of result.steps) {
    lines.push(
      `| ${step.id} | ${step.label} | ${step.heapRows} | ${step.summary.totalDocs} | ${step.summary.totalLen} | ` +
        `${step.summary.memtableDocs} | ${step.summary.segments} | ${step.scan} | ${step.autovacuumCount} | ` +
        `${step.hitsOnA} | ${step.hitsOnB} | ${step.differingFromS0} | ${step.differingFromS1 ?? 'n/a'} |`,
    );
  }
  lines.push('');
  for (const step of result.steps) {
    for (const hit of step.firstDiffering) {
      lines.push(`differs ${step.id}: ${hit.queryId} ${hit.key} s0 ${hit.reference} ${step.id} ${hit.step}`);
    }
  }
  if (result.reindexMs !== undefined) lines.push(`reindex-ms ${result.engine} ${result.corpora.a.id}: ${result.reindexMs.toFixed(1)}`);
  if (withScores) {
    lines.push('');
    for (const [stepId, byQuery] of result.scores) {
      for (const [queryId, hits] of byQuery) for (const [key, score] of hits) lines.push(`score ${stepId} ${queryId} ${key} ${score}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

/**
 * The launcher's whole body: `--engine`, `--corpus` (A) and `--other` (B) select one run, and
 * `--capture <path>` also writes the summary with every score to that repo-relative path.
 * `--reindex-cost` instead runs `self-docs` against `fixture-catalog` on each engine, timing step `s5`
 * alone, and prints one line per engine.
 */
export async function runBm25HistoryLauncher(argv) {
  const { values } = parseFlags({
    args: argv,
    options: {
      engine: { type: 'string' },
      corpus: { type: 'string' },
      other: { type: 'string' },
      capture: { type: 'string' },
      'reindex-cost': { type: 'boolean', default: false },
    },
    strict: true,
  });
  const { repo } = parseArgs([]);
  let text;
  if (values['reindex-cost']) {
    if (values.engine !== undefined || values.corpus !== undefined || values.other !== undefined) {
      throw new Error('eval: bm25 history: --reindex-cost fixes the engines and corpora; drop --engine, --corpus and --other');
    }
    const lines = [];
    for (const engine of ENGINES) {
      const result = await measureBm25History({ repoRoot: repo, engine, corpusA: 'self-docs', corpusB: 'fixture-catalog', timeReindex: true });
      const s4 = result.steps.find((step) => step.id === 's4');
      lines.push(
        `reindex-cost ${engine} ${result.ranAt} ${result.corpora.a.id} ${stamp(result.corpora.a.snapshot)} ` +
          `total_docs before ${s4.summary.totalDocs}, heap rows ${s4.heapRows}: ${result.reindexMs.toFixed(1)} ms`,
      );
    }
    text = `${lines.join('\n')}\n`;
    process.stdout.write(text);
  } else {
    const result = await measureBm25History({ repoRoot: repo, engine: values.engine, corpusA: values.corpus, corpusB: values.other });
    process.stdout.write(renderBm25History(result));
    text = renderBm25History(result, { withScores: true });
  }
  if (values.capture !== undefined) {
    const path = isAbsolute(values.capture) ? values.capture : join(repo, values.capture);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
}
