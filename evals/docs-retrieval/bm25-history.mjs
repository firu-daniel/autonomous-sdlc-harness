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
 * as a bound parameter: through `db.query` on PGlite, and through psql's `\bind` on Postgres.
 *
 * **Every score statement reads two columns, because `pg_textsearch` 1.3.1 computes a score two
 * different ways** (tag `v1.3.1` of `github.com/timescale/pg_textsearch`). `scan` is
 * `bm25_get_current_score()`, the score the index scan ranked the current row by (`src/access/scan.c` →
 * `tp_cached_score`), which is what the store ranks by (`cli/src/retrieval/store.ts` → the lexical
 * search's `SELECT id … ORDER BY`); it is a `real` and is rounded to six decimals here. It is called
 * explicitly because a bare `BM25_ORDER_CLAUSE` column is not the scan's score in this statement: on
 * both engines `EXPLAIN (VERBOSE)` shows it projected as the operator expression, and it returns the
 * operator's value (`src/planner/hooks.c` → `replace_scores_in_targetlist` names the substitution that
 * does not happen here). `operator` is `round((BM25_ORDER_CLAUSE)::numeric, 6)`, which the standalone
 * operator computes from the row's own text (`src/types/query.c` → `bm25_text_bm25query_score`); it is
 * the comparison's own probe column (`docs/retrieval-eval-results.md` → `### Divergence sources, in the
 * order checked`, item 3). Both are read through the `chunks_bm25` index scan, which nothing here
 * disables; a step whose plan is not that scan is reported with the plan it got, and its `scan`
 * column then carries no index-scan score.
 *
 * **A third, diagnostic column, `operator_exact`, is the operator unrounded as a `float8`, and no
 * comparison reads it.** It exists for one exact test per differing hit: whether
 * `Math.fround(scanRaw) === Math.fround(operatorRaw)`, that is, whether the scan's score is the
 * operator's value stored as a `real`. A hit failing it differs beyond `real` storage. Those hits are
 * split by document length at 39 tokens, the boundary of the task prompt's fieldnorm lead (the index
 * scan scores memtable rows by exact length, segments and the operator by a fieldnorm length exact up to
 * 39 tokens; reported upstream as `timescale/pg_textsearch#573`). That split is printed only when the
 * sequence's first step, which holds no dead row, finds the summed `to_tsvector` positions equal to the
 * index's `total_len`; otherwise the length definition is not the index's and the split is withheld.
 * The other mechanism lead, that deleted rows stay in `total_docs` / `total_len` until a `REINDEX`, is
 * what the history sequence measures. Every `pg_textsearch` source path and issue number here is the
 * task prompt's lead and was not re-read on the branch that added it.
 *
 * **A step whose probe plan is not the `chunks_bm25` index scan is scored a second time, in the same
 * session, with the planner's sequential scans priced off and reset afterwards** — the forced re-score,
 * labelled as such. It forces the index scan rather than disabling anything: an index whose statistics
 * describe its rows can fall below the planner's crossover at fixture size, and disabling the index
 * scan would leave no `scan` score to read at all.
 *
 * **Two sequences.** The history sequence (`s0`–`s7`) writes a second corpus and deletes it. The states
 * sequence (`t0`–`t4`) holds corpus A alone in each index state the task prompt names: a fresh-insert
 * index, after `bm25_spill_index`, after a PGlite reopen, after `REINDEX`, and a `CREATE INDEX` over the
 * loaded table, and prints every pair of states' differing-hit counts.
 *
 * **A repeat mode, for the stray score** (the task prompt's leads `timescale/pg_textsearch#557` and
 * `#516`). With `repeat > 1` each step scores its queries that many times, each repetition its own
 * `run` call, so on Postgres its own `psql` process and backend. The first repetition is the step's
 * recorded scoring; every later value differing from it is listed, and nothing is replaced, dropped or
 * averaged. The index summary, and Postgres's `autovacuum_count`, are read before the first repetition
 * and after the last, so a change to the index under the repetitions shows.
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
import { ARM_CANDIDATES } from '../../cli/dist/retrieval/search.js';
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

export const SEQUENCES = Object.freeze(['history', 'states']);

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

/** How many order inversions a step lists per corpus; a corpus not named here lists every one. */
const LISTED_INVERSIONS = Object.freeze({ 'self-docs': 20 });

/** The task prompt's fieldnorm lead: the quantized length is exact up to this many tokens. */
const FIELDNORM_EXACT_TOKENS = 39;

/** One psql answer carries every score of a step; the default 1 MiB buffer is too small. */
const PSQL_MAX_BUFFER = 256 * 1024 * 1024;

const MARKER = '@@bm25-history';

/** The `text_config` the index tokenizes with, so the length statement tokenizes the same way. */
const TEXT_CONFIG = /text_config='([^']+)'/.exec(BM25_INDEX_DEFINITION)?.[1];
if (TEXT_CONFIG === undefined) {
  throw new Error(`eval: bm25 history: BM25_INDEX_DEFINITION carries no text_config='…' to read (${BM25_INDEX_DEFINITION}), so no length statement can tokenize as the index does`);
}

/** The `operator` column: the standalone operator over the row's own text, rounded on the server. */
const OPERATOR_EXPRESSION = `round((${BM25_ORDER_CLAUSE})::numeric, 6)`;

/** The `operator_exact` column: the same operator unrounded, read only by the diagnostics. */
const OPERATOR_EXACT_EXPRESSION = `(${BM25_ORDER_CLAUSE})::float8`;

/** The `scan` column: the score the index scan ranked the current row by. */
const SCAN_EXPRESSION = 'bm25_get_current_score()';

/** Both score columns, `scan` first, then the diagnostic one, read through the store's own index-scan ordering. */
const SCORE_SELECT = `SELECT key, ${SCAN_EXPRESSION} AS scan, ${OPERATOR_EXPRESSION} AS operator, ${OPERATOR_EXACT_EXPRESSION} AS operator_exact FROM ${CHUNKS_TABLE} ORDER BY ${BM25_ORDER_CLAUSE} LIMIT $2`;

/** The store's own lexical statement (`cli/src/retrieval/store.ts` → `lexicalSearch`), bound at `ARM_CANDIDATES`. */
const STORE_SELECT = `SELECT id FROM ${CHUNKS_TABLE} ORDER BY ${BM25_ORDER_CLAUSE} LIMIT $2`;

/** The two score columns, in the order every report and capture line lists them. */
export const SCORE_COLUMNS = Object.freeze(['scan', 'operator']);

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
  spill: `SELECT bm25_spill_index('${BM25_INDEX}')`,
  spillAvailable: "SELECT count(*) FROM pg_proc WHERE proname = 'bm25_spill_index'",
  score: SCORE_SELECT,
  explainScore: `EXPLAIN (VERBOSE, COSTS OFF) ${SCORE_SELECT}`,
  explainStore: `EXPLAIN (VERBOSE, COSTS OFF) ${STORE_SELECT}`,
  lengths: `SELECT key, (SELECT coalesce(sum(array_length(positions, 1)), 0) FROM unnest(to_tsvector('${TEXT_CONFIG}', text))) FROM ${CHUNKS_TABLE}`,
  forceIndexScan: 'SET enable_seqscan = off',
  resetForceIndexScan: 'RESET enable_seqscan',
  version: 'SELECT version()',
  extversion: "SELECT extversion FROM pg_extension WHERE extname = 'pg_textsearch'",
  autovacuumCount: `SELECT autovacuum_count FROM pg_stat_user_tables WHERE relname = '${CHUNKS_TABLE}'`,
});

/** The statements, in the order the sequence first issues them, as the record quotes them. */
export const BM25_HISTORY_STATEMENTS = STATEMENTS;

/** A probe plan whose scan line matches this is the index scan; any other plan is re-scored forced. */
const INDEX_SCAN = new RegExp(`Index Scan using ${BM25_INDEX}\\b`);

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

/** An `EXPLAIN` answer's scan line and the output line under it. */
function parsePlan(text) {
  const lines = text.split('\n').map((line) => line.trim());
  const at = lines.findIndex((line) => /Scan/.test(line));
  return { scan: lines[at] ?? lines[0] ?? '', output: at < 0 ? '' : (lines[at + 1] ?? '') };
}

/** `line` split into its first part and its last `count` space-separated fields; the first part may hold spaces. */
function splitRight(line, count) {
  const fields = [];
  let rest = line;
  for (let index = 0; index < count; index += 1) {
    const at = rest.lastIndexOf(' ');
    fields.unshift(rest.slice(at + 1));
    rest = at < 0 ? '' : rest.slice(0, at);
  }
  return [rest, ...fields];
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

/**
 * A PGlite engine. With `dataDir` absent it creates its own temporary data directory and removes it on
 * `close`; with `dataDir` given it opens that directory and never removes it.
 */
export async function openPgliteEngine({ dataDir } = {}) {
  const { PGlite } = await loadRetrievalModule('@electric-sql/pglite');
  const { vector } = await loadRetrievalModule('@electric-sql/pglite-pgvector');
  const { pg_textsearch } = await loadRetrievalModule('@electric-sql/pglite-pg_textsearch');
  const owned = dataDir === undefined;
  const directory = owned ? mkdtempSync(join(tmpdir(), 'bm25-history-')) : dataDir;
  const open = () => PGlite.create({ dataDir: directory, extensions: { vector, pg_textsearch } });
  const removeOwned = () => {
    if (owned) rmSync(directory, { recursive: true, force: true });
  };
  let db;
  try {
    db = await open();
  } catch (error) {
    removeOwned();
    throw error;
  }

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
        removeOwned();
      }
    },
  };
}

/** A value as a single-quoted psql meta-command argument: `\` and `'` escaped, line breaks spelled. */
function psqlArgument(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
}

/**
 * A Postgres engine on the compose server. With `create: true` it drops and creates `database` before
 * use and drops it on `close`; with `create: false` it attaches to an existing database and drops nothing.
 */
export function openPostgresEngine(repoRoot, { database = PROBE_DATABASE, create = true } = {}) {
  const url = new URL(PYTHON_DEFAULT_DATABASE_URL);
  const user = decodeURIComponent(url.username);
  const maintenance = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!/^[a-z_][a-z0-9_]*$/.test(database)) {
    throw new Error(`eval: bm25 history: database name ${JSON.stringify(database)} is not a lower-case unquoted identifier`);
  }
  if (create && database === maintenance) {
    throw new Error(`eval: bm25 history: refusing to create and drop the maintenance database ${maintenance}`);
  }

  const psql = (target, script) => {
    const result = spawnSync(
      'docker',
      ['compose', 'exec', '-T', POSTGRES_SERVICE, 'psql', '-U', user, '-d', target, '-v', 'ON_ERROR_STOP=1', '-q', '-At', '-F', ' '],
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

  const dropDatabase = () => psql(maintenance, `DROP DATABASE IF EXISTS ${database} \\g\n`);
  if (create) {
    dropDatabase();
    psql(maintenance, `CREATE DATABASE ${database} \\g\n`);
  }

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
      for (const line of psql(database, script).split('\n')) {
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
      const time = /^Time: ([\d.]+) ms/m.exec(psql(database, `\\timing on\n${sql} \\g\n`))?.[1];
      if (time === undefined) throw new Error(`eval: bm25 history: psql printed no timing line for ${sql}`);
      return Number(time);
    },
    async close() {
      if (create) dropDatabase();
    },
  };
}

/** Whether `engine`'s `pg_textsearch` exposes `bm25_spill_index`. */
export async function spillAvailable(engine) {
  const [count] = await engine.run([{ sql: STATEMENTS.spillAvailable }]);
  return Number(count) > 0;
}

/** A score as six-decimal text; `scan` arrives as a float and is rounded here, `operator` is already rounded. */
function sixDecimals(value) {
  const rounded = Number(value).toFixed(6);
  return rounded === '-0.000000' ? '0.000000' : rounded;
}

/**
 * Every query's scores in one `run` call — under the forced index scan when `forced`, with that
 * session's probe plan. Returns `{ plan, scores, order }`: `scores` holds the hits, the rows scoring
 * non-zero in either column, as `qid -> key -> { scan, operator, scanRaw, operatorRaw }`, and `order`
 * every returned row of each query in returned order.
 */
async function readScores(engine, queries, limit, forced = false) {
  const statements = queries.map((query) => ({ sql: STATEMENTS.score, params: [query.query, String(limit)] }));
  let plan;
  let answers;
  if (forced) {
    const all = await engine.run([
      { sql: STATEMENTS.forceIndexScan },
      { sql: STATEMENTS.explainScore, params: [queries[0].query, String(limit)] },
      ...statements,
      { sql: STATEMENTS.resetForceIndexScan },
    ]);
    plan = parsePlan(all[1]);
    answers = all.slice(2, -1);
  } else {
    answers = await engine.run(statements);
  }
  const scores = new Map();
  const order = new Map();
  queries.forEach((query, index) => {
    const hits = new Map();
    const rows = [];
    for (const line of answers[index].split('\n')) {
      if (line === '') continue;
      const [key, scanText, operatorText, exactText] = splitRight(line, 3);
      const row = {
        key,
        scan: sixDecimals(scanText),
        operator: sixDecimals(operatorText),
        scanRaw: Number(scanText),
        operatorRaw: Number(exactText),
      };
      rows.push(row);
      if (Number(row.scan) !== 0 || Number(row.operator) !== 0) {
        hits.set(key, { scan: row.scan, operator: row.operator, scanRaw: row.scanRaw, operatorRaw: row.operatorRaw });
      }
    }
    scores.set(query.id, hits);
    order.set(query.id, rows);
  });
  return { plan, scores, order };
}

/** The hits on `keys` whose `column` score differs between `reference` and `scores`, a hit on one side only included. */
function differences(reference, scores, keys, column) {
  const differing = [];
  for (const [queryId, referenceHits] of reference) {
    const hits = scores.get(queryId) ?? new Map();
    const pairs = new Set([...referenceHits.keys(), ...hits.keys()].filter((key) => keys.has(key)));
    for (const key of pairs) {
      const before = referenceHits.get(key)?.[column] ?? 'none';
      const after = hits.get(key)?.[column] ?? 'none';
      if (before !== after) differing.push({ queryId, key, reference: before, step: after });
    }
  }
  return differing;
}

/** {@link differences} once per column of {@link SCORE_COLUMNS}, as `column -> differing hits`. */
export function differencesByColumn(reference, scores, keys) {
  return Object.fromEntries(SCORE_COLUMNS.map((column) => [column, differences(reference, scores, keys, column)]));
}

function countHits(scores, keys) {
  let count = 0;
  for (const hits of scores.values()) for (const key of hits.keys()) if (keys.has(key)) count += 1;
  return count;
}

/** Adjacent returned rows of one query whose `raw` value is strictly below the row before it. */
function inversions(order, raw) {
  const found = [];
  for (const [queryId, rows] of order) {
    for (let index = 1; index < rows.length; index += 1) {
      if (rows[index][raw] < rows[index - 1][raw]) found.push({ queryId, before: rows[index - 1], after: rows[index] });
    }
  }
  return found;
}

/** Diagnostics (a)–(d), (f) and (g) of one reading; (e) is the step's `lengths`, shared by every reading. */
function diagnose({ scores, order }, { keys, lengths, listInversions }) {
  let hits = 0;
  let realStorage = 0;
  let largest;
  const differing = [];
  const bands = { atMost: 0, above: 0, unknown: 0 };
  for (const [queryId, byKey] of scores) {
    for (const [key, score] of byKey) {
      if (!keys.has(key)) continue;
      hits += 1;
      const gap = Math.abs(score.scanRaw - score.operatorRaw);
      if (largest === undefined || gap > largest.gap) largest = { gap, queryId, key, scanRaw: score.scanRaw, operatorRaw: score.operatorRaw };
      if (score.scan === score.operator) continue;
      differing.push({ queryId, key });
      if (Math.fround(score.scanRaw) === Math.fround(score.operatorRaw)) {
        realStorage += 1;
        continue;
      }
      const length = lengths.byKey.get(key);
      if (length === undefined) bands.unknown += 1;
      else if (length <= FIELDNORM_EXACT_TOKENS) bands.atMost += 1;
      else bands.above += 1;
    }
  }
  return {
    hits,
    differing: differing.length,
    realStorage,
    beyondReal: differing.length - realStorage,
    largest,
    lengthBands: lengths.verdict.equal ? bands : undefined,
    inversions: { operator: inversions(order, 'operatorRaw'), scan: inversions(order, 'scanRaw') },
    listInversions,
  };
}

function parseLengths(text) {
  const byKey = new Map();
  for (const line of text.split('\n')) {
    if (line === '') continue;
    const [key, length] = splitRight(line, 1);
    byKey.set(key, Number(length));
  }
  return byKey;
}

/** Each (query, key, column) of `later` whose value differs from `first`'s, a hit on one side only included. */
function disagreements(first, later) {
  let compared = 0;
  const found = [];
  for (const queryId of new Set([...first.keys(), ...later.keys()])) {
    const a = first.get(queryId) ?? new Map();
    const b = later.get(queryId) ?? new Map();
    for (const key of new Set([...a.keys(), ...b.keys()])) {
      for (const column of SCORE_COLUMNS) {
        compared += 1;
        const before = a.get(key)?.[column] ?? 'none';
        const value = b.get(key)?.[column] ?? 'none';
        if (before !== value) found.push({ queryId, key, column, first: before, value });
      }
    }
  }
  return { compared, found };
}

/** The lines of `bm25_summarize_index`'s text that differ between two readings, positionally, each verbatim. */
function summaryChanges(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  const changes = [];
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) changes.push({ before: (a[index] ?? '(no line)').trim(), after: (b[index] ?? '(no line)').trim() });
  }
  return changes;
}

/**
 * One step's whole reading: `{ summary, plans: { probe, store }, scores, forced, diagnostics }`, plus
 * `repeats` when `repeat > 1`. `forced` is present only when the probe plan is not the `chunks_bm25`
 * index scan. `lengthVerdict` (`{ equal, decidedAt }`) carries the sequence's first-step `Σ length` /
 * `total_len` verdict to a later step; absent, this step's own pair decides. `listInversions` bounds the
 * inversions the step lists, never the ones it counts.
 */
export async function readIndexState(engine, queries, { limit, keys, repeat = 1, lengthVerdict, listInversions = Infinity }) {
  const probe = queries[0].query;
  const postgres = engine.name === 'postgres';
  const statusStatements = [{ sql: STATEMENTS.summarize }, ...(postgres ? [{ sql: STATEMENTS.autovacuumCount }] : [])];
  const [summaryText, autovacuumBefore, probePlan, storePlan, lengthsText] = await engine.run([
    { sql: STATEMENTS.summarize },
    { sql: postgres ? STATEMENTS.autovacuumCount : 'SELECT NULL' },
    { sql: STATEMENTS.explainScore, params: [probe, String(limit)] },
    { sql: STATEMENTS.explainStore, params: [probe, String(ARM_CANDIDATES)] },
    { sql: STATEMENTS.lengths },
  ]);
  const summary = parseSummary(summaryText);
  const plans = { probe: parsePlan(probePlan), store: parsePlan(storePlan) };
  const byKey = parseLengths(lengthsText);
  const sum = [...byKey.values()].reduce((total, length) => total + length, 0);
  const lengths = { byKey, sum, totalLen: summary.totalLen, equal: sum === summary.totalLen };
  lengths.verdict = lengthVerdict ?? { equal: lengths.equal, decidedAt: undefined };

  const reading = await readScores(engine, queries, limit);
  const forcedReading = INDEX_SCAN.test(plans.probe.scan) ? undefined : await readScores(engine, queries, limit, true);
  const context = { keys, lengths, listInversions };
  const state = {
    summary,
    plans,
    scores: reading.scores,
    forced: forcedReading === undefined ? undefined : { plan: forcedReading.plan, scores: forcedReading.scores },
    diagnostics: {
      lengths: { sum, totalLen: lengths.totalLen, equal: lengths.equal, verdict: lengths.verdict },
      scores: diagnose(reading, context),
      forced: forcedReading === undefined ? undefined : diagnose(forcedReading, context),
    },
  };

  if (repeat > 1) {
    const repeats = { count: repeat, compared: 0, disagreements: [], scores: [], forcedScores: [] };
    for (const forced of forcedReading === undefined ? [false] : [false, true]) {
      const first = forced ? forcedReading.scores : reading.scores;
      for (let repetition = 2; repetition <= repeat; repetition += 1) {
        const { scores } = await readScores(engine, queries, limit, forced);
        (forced ? repeats.forcedScores : repeats.scores).push(scores);
        const { compared, found } = disagreements(first, scores);
        repeats.compared += compared;
        for (const disagreement of found) repeats.disagreements.push({ forced, repetition, ...disagreement });
      }
    }
    const [summaryAfterText, autovacuumAfter] = await engine.run(statusStatements);
    repeats.summaryBefore = summary;
    repeats.summaryAfter = parseSummary(summaryAfterText);
    repeats.summaryChanges = summaryChanges(summaryText, summaryAfterText);
    repeats.autovacuum = postgres ? { before: autovacuumBefore, after: autovacuumAfter } : undefined;
    state.repeats = repeats;
  }
  return state;
}

const summaryLine = (summary) =>
  `total_docs ${summary.totalDocs}, total_len ${summary.totalLen}, memtable docs ${summary.memtableDocs}, segments ${summary.segments}`;

const planLine = (plan) => `${plan.scan} | ${plan.output}`;

const rowValues = (row) => `${row.key} (${row.scan} ${row.operator} ${row.operatorRaw})`;

function diagnosticLines(stepId, reading, diagnostics, verdict) {
  const lines = [
    `  ${reading}: hits ${diagnostics.hits}, scan != operator ${diagnostics.differing}, of which the operator stored as a real ${diagnostics.realStorage}, differing beyond real storage ${diagnostics.beyondReal}`,
  ];
  const { largest } = diagnostics;
  lines.push(
    largest === undefined
      ? `  ${reading}: largest |scan - operator|: no hits`
      : `  ${reading}: largest |scan - operator| ${largest.gap} at ${largest.queryId} ${largest.key} (scanRaw ${largest.scanRaw}, operatorRaw ${largest.operatorRaw})`,
  );
  const bands = diagnostics.lengthBands;
  lines.push(
    bands === undefined
      ? `  ${reading}: beyond-real by length: withheld, sum of lengths != total_len at ${verdict.decidedAt ?? stepId}, so this length definition is not the index's`
      : `  ${reading}: beyond-real by length (boundary ${FIELDNORM_EXACT_TOKENS} tokens, the task prompt's fieldnorm lead): <= ${FIELDNORM_EXACT_TOKENS} ${bands.atMost}, > ${FIELDNORM_EXACT_TOKENS} ${bands.above}` +
          (bands.unknown > 0 ? `, no length read ${bands.unknown}` : ''),
  );
  for (const column of ['operator', 'scan']) {
    const found = diagnostics.inversions[column];
    const listed = found.slice(0, diagnostics.listInversions);
    lines.push(
      `  ${reading}: order inversions against ${column}: ${found.length}` +
        (listed.length < found.length ? ` (first ${listed.length} listed; each row: key (scan operator operatorRaw))` : found.length > 0 ? ' (each row: key (scan operator operatorRaw))' : ''),
    );
    for (const { queryId, before, after } of listed) {
      lines.push(`    inversion ${stepId} ${column} ${queryId}: ${rowValues(before)} then ${rowValues(after)}`);
    }
  }
  return lines;
}

/** The text lines one step prints, the same in every module that reads an index state. */
export function renderIndexState(id, label, state) {
  const { lengths } = state.diagnostics;
  const lines = [
    `step ${id}: ${label}`,
    `  summary: ${summaryLine(state.summary)}`,
    `  plan probe: ${planLine(state.plans.probe)}`,
    `  plan store (LIMIT ${ARM_CANDIDATES}): ${planLine(state.plans.store)}`,
    `  lengths: sum ${lengths.sum}, total_len ${lengths.totalLen}, ${lengths.equal ? 'equal' : 'not equal'}; ` +
      `length-band verdict ${lengths.verdict.equal ? 'equal' : 'not equal'}, decided at ${lengths.verdict.decidedAt ?? id}`,
    ...diagnosticLines(id, 'default plan', state.diagnostics.scores, lengths.verdict),
  ];
  if (state.forced === undefined) {
    lines.push(`  forced index scan: not taken, the probe plan is the ${BM25_INDEX} index scan`);
  } else {
    lines.push(`  forced index scan (sequential scans priced off, then reset): plan ${planLine(state.forced.plan)}`);
    lines.push(...diagnosticLines(`${id}.forced`, 'forced index scan', state.diagnostics.forced, lengths.verdict));
  }
  const { repeats } = state;
  if (repeats !== undefined) {
    lines.push(
      `  repeat: ${repeats.count} repetitions, values compared ${repeats.compared}, disagreeing ${repeats.disagreements.length}`,
      `  repeat summary before: ${summaryLine(repeats.summaryBefore)}`,
      `  repeat summary after: ${summaryLine(repeats.summaryAfter)}`,
      repeats.summaryChanges.length === 0
        ? '  repeat summary text: identical'
        : `  repeat summary text: differs in ${repeats.summaryChanges.map((change) => `"${change.before}" -> "${change.after}"`).join('; ')}`,
    );
    if (repeats.autovacuum !== undefined) {
      lines.push(`  repeat autovacuum_count before ${repeats.autovacuum.before}, after ${repeats.autovacuum.after}`);
    }
    for (const d of repeats.disagreements) {
      lines.push(`disagrees ${id}${d.forced ? '.forced' : ''} r${d.repetition} ${d.queryId} ${d.key} ${d.column}: ${d.first} ${d.value}`);
    }
  }
  return lines;
}

/** Every capture `score` line of one step: its recorded scoring, its later repetitions, and its forced readings. */
export function scoreLines(stepId, state) {
  const lines = [];
  const emit = (id, scores) => {
    for (const [queryId, hits] of scores) {
      for (const [key, score] of hits) {
        lines.push(`score ${id} ${queryId} ${key} ${score.scan} ${score.operator} ${score.scanRaw} ${score.operatorRaw}`);
      }
    }
  };
  emit(stepId, state.scores);
  state.repeats?.scores.forEach((scores, index) => emit(`${stepId}.r${index + 2}`, scores));
  if (state.forced !== undefined) {
    emit(`${stepId}.forced`, state.forced.scores);
    state.repeats?.forcedScores.forEach((scores, index) => emit(`${stepId}.forced.r${index + 2}`, scores));
  }
  return lines;
}

function insertRows(db, chunks) {
  return db.run(chunks.map((chunk) => ({ sql: STATEMENTS.upsert, params: [chunk.key, chunk.text, CONSTANT_VECTOR] })));
}

async function assertRows(db, chunks) {
  const [digest] = await db.run([{ sql: STATEMENTS.contentDigest }]);
  if (digest !== expectedDigest(chunks)) {
    throw new Error('eval: bm25 history: the rows read back differ from the chunks written, so no score here describes the corpus');
  }
}

/** A new table with its empty index, then `chunks` inserted into it: the fresh-insert index. */
async function freshTable(db, chunks) {
  await db.run([{ sql: STATEMENTS.dropTable }, { sql: STATEMENTS.createTable }, { sql: STATEMENTS.createIndex }]);
  await insertRows(db, chunks);
  await assertRows(db, chunks);
}

function checkEngine(engine) {
  if (!ENGINES.includes(engine)) throw new Error(`eval: bm25 history: engine ${engine} is not one of ${ENGINES.join(', ')}`);
}

function checkCorpus(id) {
  if (!BUILT_IN_CORPORA.includes(id)) throw new Error(`eval: bm25 history: corpus ${id} is not one of ${BUILT_IN_CORPORA.join(', ')}`);
}

function checkRepeat(repeat) {
  if (!Number.isInteger(repeat) || repeat < 1) throw new Error(`eval: bm25 history: repeat ${repeat} is not a positive integer`);
}

const openEngine = (engine, repoRoot) => (engine === 'pglite' ? openPgliteEngine() : openPostgresEngine(repoRoot));

/**
 * Runs the sequence on `engine` with corpus `corpusA` as the live rows and `corpusB` as the rows a
 * refresh to A deletes. Returns `{ engine, ranAt, server, extversion, corpora, queries, steps, scores }`,
 * plus `reindexMs` under `timeReindex`. Each step carries the heap count, its {@link readIndexState}
 * reading as `state`, Postgres's `autovacuum_count`, and its hits on A's keys against `s0` and `s1`,
 * counted per column of {@link SCORE_COLUMNS}.
 */
export async function measureBm25History({ repoRoot, engine, corpusA, corpusB, timeReindex = false, repeat = 1 }) {
  checkEngine(engine);
  for (const id of [corpusA, corpusB]) checkCorpus(id);
  if (corpusA === corpusB) throw new Error('eval: bm25 history: corpus A and corpus B must differ');
  checkRepeat(repeat);

  const a = corpusChunks(repoRoot, corpusA);
  const b = corpusChunks(repoRoot, corpusB);
  const aKeys = new Set(a.chunks.map((chunk) => chunk.key));
  const collision = b.chunks.find((chunk) => aKeys.has(chunk.key));
  if (collision !== undefined) throw new Error(`eval: bm25 history: key ${collision.key} is in both corpora`);
  const queries = loadQueries(join(repoRoot, QUERIES_DIR, `${corpusA}.jsonl`));
  const limit = a.chunks.length + b.chunks.length;
  const listInversions = LISTED_INVERSIONS[corpusA] ?? Infinity;

  const ranAt = new Date().toISOString();
  const db = await openEngine(engine, repoRoot);
  const steps = [];
  const scores = new Map();
  let reindexMs;
  let lengthVerdict;

  const record = async (id, label) => {
    const [heap, autovacuum] = await db.run([{ sql: STATEMENTS.heapCount }, { sql: STATEMENTS.autovacuumCount }]);
    const state = await readIndexState(db, queries, { limit, keys: aKeys, repeat, lengthVerdict, listInversions });
    lengthVerdict ??= { equal: state.diagnostics.lengths.equal, decidedAt: id };
    const stepScores = state.scores;
    scores.set(id, stepScores);
    const versusS0 = differencesByColumn(scores.get('s0'), stepScores, aKeys);
    const versusS1 = scores.has('s1') && id !== 's0' && id !== 's1' ? differencesByColumn(scores.get('s1'), stepScores, aKeys) : undefined;
    steps.push({
      id,
      label,
      heapRows: Number(heap),
      summary: state.summary,
      scan: state.plans.probe.scan,
      scanOutput: state.plans.probe.output,
      autovacuumCount: engine === 'postgres' ? autovacuum : 'n/a',
      hitsOnA: countHits(stepScores, aKeys),
      hitsOnB: countHits(stepScores, new Set(b.chunks.map((chunk) => chunk.key))),
      differingFromS0: Object.fromEntries(SCORE_COLUMNS.map((column) => [column, versusS0[column].length])),
      firstDiffering: Object.fromEntries(SCORE_COLUMNS.map((column) => [column, versusS0[column].slice(0, LISTED_DIFFERENCES)])),
      differingFromS1:
        versusS1 === undefined ? undefined : Object.fromEntries(SCORE_COLUMNS.map((column) => [column, versusS1[column].length])),
      state,
    });
  };

  let server;
  let extversion;
  try {
    await db.run(STATEMENTS.extensions.map((sql) => ({ sql })));
    [server, extversion] = await db.run([{ sql: STATEMENTS.version }, { sql: STATEMENTS.extversion }]);

    await freshTable(db, a.chunks);
    await record('s0', `fresh index of ${corpusA}`);

    await freshTable(db, [...a.chunks, ...b.chunks]);
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
    sequence: 'history',
    engine,
    ranAt,
    server,
    extversion,
    corpora: { a: { id: a.id, snapshot: a.snapshot }, b: { id: b.id, snapshot: b.snapshot } },
    queries: { set: `${QUERIES_DIR}/${corpusA}.jsonl`, count: queries.length },
    repeat,
    steps,
    scores,
    ...(reindexMs === undefined ? {} : { reindexMs }),
  };
}

/**
 * Holds corpus A alone in each index state in turn — `t0` fresh insert, `t1` after `bm25_spill_index`,
 * `t2` a PGlite reopen, `t3` `REINDEX`, `t4` `CREATE INDEX` over the loaded table — and reads each with
 * {@link readIndexState}. A step that does not apply on `engine` carries `skipped` instead of `state`.
 * Returns the history sequence's envelope, with `pairs`: every two read steps' differing A hits per column.
 */
export async function measureBm25States({ repoRoot, engine, corpus, repeat = 1 }) {
  checkEngine(engine);
  checkCorpus(corpus);
  checkRepeat(repeat);

  const a = corpusChunks(repoRoot, corpus);
  const keys = new Set(a.chunks.map((chunk) => chunk.key));
  const queries = loadQueries(join(repoRoot, QUERIES_DIR, `${corpus}.jsonl`));
  const limit = a.chunks.length;
  const listInversions = LISTED_INVERSIONS[corpus] ?? Infinity;

  const ranAt = new Date().toISOString();
  const db = await openEngine(engine, repoRoot);
  const steps = [];
  let lengthVerdict;
  let spill;

  const record = async (id, label) => {
    const state = await readIndexState(db, queries, { limit, keys, repeat, lengthVerdict, listInversions });
    lengthVerdict ??= { equal: state.diagnostics.lengths.equal, decidedAt: id };
    steps.push({ id, label, state });
  };

  let server;
  let extversion;
  try {
    await db.run(STATEMENTS.extensions.map((sql) => ({ sql })));
    [server, extversion] = await db.run([{ sql: STATEMENTS.version }, { sql: STATEMENTS.extversion }]);
    spill = await spillAvailable(db);

    await freshTable(db, a.chunks);
    await record('t0', `fresh-insert index of ${corpus}`);

    if (spill) {
      await db.run([{ sql: STATEMENTS.spill }]);
      await record('t1', STATEMENTS.spill);
    } else {
      steps.push({ id: 't1', label: STATEMENTS.spill, skipped: `bm25_spill_index not available on ${engine}` });
    }

    if (db.reopen !== undefined) {
      await db.reopen();
      await record('t2', 'data directory closed and reopened');
    } else {
      steps.push({ id: 't2', label: 'data directory closed and reopened', skipped: `PGlite only, not run on ${engine}` });
    }

    await db.run([{ sql: STATEMENTS.reindex }]);
    await record('t3', STATEMENTS.reindex);

    await db.run([{ sql: STATEMENTS.dropTable }, { sql: STATEMENTS.createTable }]);
    await insertRows(db, a.chunks);
    await db.run([{ sql: STATEMENTS.createIndex }]);
    await assertRows(db, a.chunks);
    await record('t4', `new table, ${corpus} inserted, then ${STATEMENTS.createIndex}`);
  } finally {
    await db.close();
  }

  const read = steps.filter((step) => step.state !== undefined);
  const indexScanScores = (step) => step.state.forced?.scores ?? step.state.scores;
  const pairs = [];
  for (let i = 0; i < read.length; i += 1) {
    for (let j = i + 1; j < read.length; j += 1) {
      const count = (reference, scores) =>
        Object.fromEntries(Object.entries(differencesByColumn(reference, scores, keys)).map(([column, found]) => [column, found.length]));
      pairs.push({
        steps: [read[i].id, read[j].id],
        defaultPlan: count(read[i].state.scores, read[j].state.scores),
        indexScan: count(indexScanScores(read[i]), indexScanScores(read[j])),
      });
    }
  }

  return {
    sequence: 'states',
    engine,
    ranAt,
    server,
    extversion,
    corpora: { a: { id: a.id, snapshot: a.snapshot } },
    queries: { set: `${QUERIES_DIR}/${corpus}.jsonl`, count: queries.length },
    repeat,
    spillAvailable: spill,
    steps,
    pairs,
  };
}

export const stamp = (snapshot) => `{ files: ${snapshot.files}, chunks: ${snapshot.chunks} }`;

/** The summary a reader records from; `withScores` appends every score of every step, `scan` before `operator`. */
export function renderBm25History(result, { withScores = false } = {}) {
  const perColumn = (counts) => SCORE_COLUMNS.map((column) => (counts === undefined ? 'n/a' : counts[column])).join(' | ');
  const lines = [
    `bm25-history: engine ${result.engine}, ran ${result.ranAt}`,
    `server: ${result.server}`,
    `pg_textsearch: ${result.extversion}`,
    `corpus A: ${result.corpora.a.id} ${stamp(result.corpora.a.snapshot)}; corpus B: ${result.corpora.b.id} ${stamp(result.corpora.b.snapshot)}`,
    `queries: ${result.queries.count} from ${result.queries.set}`,
    `repeat: ${result.repeat}`,
    `plan output (s0): ${result.steps[0]?.scanOutput ?? ''}`,
    '',
    '| Step | What | Heap rows | total_docs | total_len | Memtable docs | Segments | Score plan | autovacuum_count | Hits on A | Hits on B | ' +
      'A hits differing from s0, scan | A hits differing from s0, operator | A hits differing from s1, scan | A hits differing from s1, operator |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const step of result.steps) {
    lines.push(
      `| ${step.id} | ${step.label} | ${step.heapRows} | ${step.summary.totalDocs} | ${step.summary.totalLen} | ` +
        `${step.summary.memtableDocs} | ${step.summary.segments} | ${step.scan} | ${step.autovacuumCount} | ` +
        `${step.hitsOnA} | ${step.hitsOnB} | ${perColumn(step.differingFromS0)} | ${perColumn(step.differingFromS1)} |`,
    );
  }
  lines.push('');
  for (const step of result.steps) {
    for (const column of SCORE_COLUMNS) {
      for (const hit of step.firstDiffering[column]) {
        lines.push(`differs ${step.id} ${column}: ${hit.queryId} ${hit.key} s0 ${hit.reference} ${step.id} ${hit.step}`);
      }
    }
  }
  for (const step of result.steps) lines.push('', ...renderIndexState(step.id, step.label, step.state));
  if (result.reindexMs !== undefined) lines.push(`reindex-ms ${result.engine} ${result.corpora.a.id}: ${result.reindexMs.toFixed(1)}`);
  if (withScores) {
    lines.push('');
    // Not a spread: a --repeat capture holds more score lines than one call's argument limit.
    for (const step of result.steps) for (const line of scoreLines(step.id, step.state)) lines.push(line);
  }
  return `${lines.join('\n')}\n`;
}

/** The states sequence's summary: each step's reading and the pairwise counts; `withScores` as {@link renderBm25History}. */
export function renderBm25States(result, { withScores = false } = {}) {
  const lines = [
    `bm25-history states: engine ${result.engine}, ran ${result.ranAt}`,
    `server: ${result.server}`,
    `pg_textsearch: ${result.extversion}`,
    `corpus: ${result.corpora.a.id} ${stamp(result.corpora.a.snapshot)}`,
    `queries: ${result.queries.count} from ${result.queries.set}`,
    `repeat: ${result.repeat}`,
    `bm25_spill_index: ${result.spillAvailable ? 'available' : `not available on ${result.engine}`}`,
  ];
  for (const step of result.steps) {
    lines.push('', ...(step.state === undefined ? [`step ${step.id}: ${step.label}: skipped, ${step.skipped}`] : renderIndexState(step.id, step.label, step.state)));
  }
  const table = (title, field) => [
    '',
    `${title}: A hits whose score differs, per column`,
    '| Steps | scan | operator |',
    '| --- | --- | --- |',
    ...result.pairs.map((pair) => `| ${pair.steps.join(' / ')} | ${SCORE_COLUMNS.map((column) => pair[field][column]).join(' | ')} |`),
  ];
  lines.push(...table('pairwise, default plan', 'defaultPlan'));
  if (result.steps.some((step) => step.state?.forced !== undefined)) {
    lines.push(...table('pairwise, index-scan reading (the forced re-score where a step was forced)', 'indexScan'));
  }
  if (withScores) {
    lines.push('');
    // Not a spread: a --repeat capture holds more score lines than one call's argument limit.
    for (const step of result.steps) if (step.state !== undefined) for (const line of scoreLines(step.id, step.state)) lines.push(line);
  }
  return `${lines.join('\n')}\n`;
}

const SIX_DECIMALS = /^-?\d+\.\d{6}$/;

/**
 * The scores that are not the same in every capture of one pair: each `score` line's `scan` and
 * `operator` value across `captures` (the texts `--capture` wrote), listed when the captures disagree
 * on it. A hit present in one capture and absent from another is listed with `none` for the absent side.
 * A line in the old two-value form is refused, because it carries no raw values.
 */
export function compareBm25Captures(captures) {
  const values = new Map();
  captures.forEach((text, index) => {
    for (const line of text.split('\n')) {
      if (!line.startsWith('score ')) continue;
      const [, step, queryId] = line.split(' ', 3);
      const [head, scan, operator, scanRaw, operatorRaw] = splitRight(line, 4);
      const key = head.slice(`score ${step} ${queryId} `.length);
      if (key === '' || !SIX_DECIMALS.test(scan) || !SIX_DECIMALS.test(operator) || scanRaw === '' || operatorRaw === '') {
        throw new Error(
          `eval: bm25 history: capture ${index + 1} carries a score line in the old two-value form ` +
            `(score <step> <qid> <key> <scan> <operator>), which has no raw values; re-take it: ${line}`,
        );
      }
      const score = { scan, operator };
      for (const column of SCORE_COLUMNS) {
        const id = `${step} ${queryId} ${key} ${column}`;
        if (!values.has(id)) values.set(id, new Array(captures.length).fill('none'));
        values.get(id)[index] = score[column];
      }
    }
  });
  const disagreeing = [...values].filter(([, seen]) => new Set(seen).size > 1);
  return `${[`captures: ${captures.length}, values compared: ${values.size}, disagreeing: ${disagreeing.length}`, ...disagreeing.map(([id, seen]) => `disagrees ${id}: ${seen.join(' ')}`)].join('\n')}\n`;
}

/**
 * The launcher's whole body: `--sequence <history|states>` (default `history`), `--engine`, `--corpus`
 * (A), `--other` (B, the history sequence's only) and `--repeat <n>` (default 1) select one run, and
 * `--capture <path>` also writes the summary with every score to that repo-relative path.
 * `--reindex-cost` instead runs `self-docs` against `fixture-catalog` on each engine, timing step `s5`
 * alone, and prints one line per engine. `--compare <path>`, given once per capture of one pair, runs
 * nothing and prints {@link compareBm25Captures} over them.
 */
export async function runBm25HistoryLauncher(argv) {
  const { values } = parseFlags({
    args: argv,
    options: {
      sequence: { type: 'string' },
      engine: { type: 'string' },
      corpus: { type: 'string' },
      other: { type: 'string' },
      repeat: { type: 'string' },
      capture: { type: 'string' },
      compare: { type: 'string', multiple: true },
      'reindex-cost': { type: 'boolean', default: false },
    },
    strict: true,
  });
  const { repo } = parseArgs([]);
  const repoPath = (path) => (isAbsolute(path) ? path : join(repo, path));
  if (values.compare !== undefined) {
    if (Object.keys(values).some((name) => name !== 'compare' && name !== 'reindex-cost') || values['reindex-cost']) {
      throw new Error('eval: bm25 history: --compare reads captures only; drop every other flag');
    }
    if (values.compare.length < 2) throw new Error('eval: bm25 history: --compare needs at least two captures');
    process.stdout.write(compareBm25Captures(values.compare.map((path) => readFileSync(repoPath(path), 'utf8'))));
    return;
  }
  const sequence = values.sequence ?? 'history';
  if (!SEQUENCES.includes(sequence)) throw new Error(`eval: bm25 history: --sequence ${sequence} is not one of ${SEQUENCES.join(', ')}`);
  if (values.repeat !== undefined && !/^[1-9]\d*$/.test(values.repeat)) {
    throw new Error(`eval: bm25 history: --repeat ${values.repeat} is not a positive integer`);
  }
  const repeat = values.repeat === undefined ? 1 : Number(values.repeat);
  let text;
  if (values['reindex-cost']) {
    if (values.engine !== undefined || values.corpus !== undefined || values.other !== undefined) {
      throw new Error('eval: bm25 history: --reindex-cost fixes the engines and corpora; drop --engine, --corpus and --other');
    }
    if (values.sequence !== undefined || values.repeat !== undefined) {
      throw new Error('eval: bm25 history: --reindex-cost runs the history sequence once; drop --sequence and --repeat');
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
  } else if (sequence === 'states') {
    if (values.other !== undefined) throw new Error('eval: bm25 history: --sequence states holds one corpus; drop --other');
    const result = await measureBm25States({ repoRoot: repo, engine: values.engine, corpus: values.corpus, repeat });
    process.stdout.write(renderBm25States(result));
    text = renderBm25States(result, { withScores: true });
  } else {
    const result = await measureBm25History({ repoRoot: repo, engine: values.engine, corpusA: values.corpus, corpusB: values.other, repeat });
    process.stdout.write(renderBm25History(result));
    text = renderBm25History(result, { withScores: true });
  }
  if (values.capture !== undefined) {
    const path = repoPath(values.capture);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
}
