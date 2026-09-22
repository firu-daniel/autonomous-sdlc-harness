/**
 * The docs-retrieval index store: the {@link DocStore} interface every consumer takes, and its one
 * implementation on an embedded Postgres (PGlite) with an HNSW vector index and a BM25 lexical index.
 *
 * **The rule this module exists to enforce: every value reaches SQL as a bound parameter, and the SQL
 * stays plain Postgres plus the `vector` and `pg_textsearch` extensions.** A search query comes from an
 * agent and is untrusted, so no input is ever spliced into a statement; the two spliced tokens are the
 * `vector(<dimensions>)` column type, taken from a checked integer, and the constant index name inside
 * `to_bm25query($1, 'chunks_bm25')`. Keeping the dialect plain is what would let a real Postgres
 * implement {@link DocStore} by connection string; this module builds no such implementation.
 *
 * **The shapes the lexical plan's cost depends on are exported, and a caller composes them rather than
 * retyping them:** {@link CHUNKS_TABLE}, {@link BM25_INDEX}, {@link BM25_INDEX_DEFINITION},
 * {@link BM25_ORDER_CLAUSE}, {@link CHUNK_TEXT_COLUMN} and {@link chunkEmbeddingColumn}. They exist for
 * `cli/test/docs-retrieval-store.test.mjs`, which measures the row count at which the planner chooses
 * the BM25 index scan and must build that index *after* the rows — which this module's open path cannot
 * do. The statements below are issued from those same constants, so there is no second copy inside the
 * owner either, and a change to the indexed column, the `text_config`, the index name, the row width or
 * the ordering operator moves the measurement with it instead of leaving it describing a store that no
 * longer exists.
 *
 * The PGlite packages are optional peers reached only through `loadRetrievalModule`
 * (`cli/src/retrieval/runtime.ts`); this file takes their types with `import type`.
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import type * as Pglite from '@electric-sql/pglite';
import type * as PgTextsearch from '@electric-sql/pglite-pg_textsearch';
import type * as Pgvector from '@electric-sql/pglite-pgvector';

import { internal } from '../core/errors.js';
import { normalizeRepoDir } from '../core/repoPaths.js';
import type { DocChunk } from './chunk.js';
import { loadRetrievalModule } from './runtime.js';

/** The index directory's name under `stateDir`; the ignore rule reads it from here. */
export const INDEX_DIR_NAME = 'docs_index';

/** The chunk table's name, so a composed statement names the same table the store's own DDL creates. */
export const CHUNKS_TABLE = 'chunks';

/** The BM25 lexical index's name, spliced rather than bound — see the header's spliced-token clause. */
export const BM25_INDEX = 'chunks_bm25';

/**
 * Everything after the index name in the BM25 index's `CREATE INDEX`: the indexed column and the
 * `text_config` the planner's row estimate and the scan's matching-rows behaviour both depend on. The
 * `IF NOT EXISTS` is the open path's alone, so a caller building the index after its rows composes the
 * same definition without it.
 */
export const BM25_INDEX_DEFINITION = `ON ${CHUNKS_TABLE} USING bm25 (text) WITH (text_config='english')`;

/** The lexical arm's ordering clause; `$1` is the bound query text. */
export const BM25_ORDER_CLAUSE = `text <@> to_bm25query($1, '${BM25_INDEX}')`;

/** The BM25-indexed column's declaration. */
export const CHUNK_TEXT_COLUMN = 'text text NOT NULL';

/** The embedding column's declaration; its width is what sets the rows per page a scan is costed on. */
export function chunkEmbeddingColumn(dimensions: number): string {
  return `embedding vector(${dimensions}) NOT NULL`;
}

/** `<repoRoot>/<stateDir>/docs_index` — the per-checkout index PGlite persists into. */
export function indexDataDir(repoRoot: string, stateDir: string): string {
  return join(repoRoot, normalizeRepoDir(stateDir), INDEX_DIR_NAME);
}

/** A stored chunk as a search result cites it. */
export interface StoredChunk {
  readonly id: number;
  readonly key: string;
  readonly path: string;
  readonly anchor: string;
  readonly heading: string;
  readonly body: string;
}

/** One arm's hit; `rank` is 1-based within that arm, as reciprocal rank fusion reads it. */
export interface RankedId {
  readonly id: number;
  readonly rank: number;
}

/** The index as refresh and search see it, independent of the database behind it. */
export interface DocStore {
  readMeta(key: string): Promise<string | undefined>;
  writeMeta(key: string, value: string): Promise<void>;
  /** key -> hash */
  listChunkHashes(): Promise<ReadonlyMap<string, string>>;
  upsertChunks(chunks: readonly DocChunk[], embeddings: readonly number[][]): Promise<void>;
  deleteChunks(keys: readonly string[]): Promise<void>;
  /** Removes every chunk; meta is kept. */
  clear(): Promise<void>;
  /**
   * The best-scoring chunks for the query, lower-is-better score first, up to `limit`.
   * **Not necessarily only matching chunks:** the filter to matching rows belongs to the BM25 index
   * scan rather than to the `<@>` operator, so a plan that falls back to a sequential scan — which a
   * small corpus does — returns non-matching rows at score `0` after the matches. Measured in
   * `docs/retrieval.md` → `## Measured, and how`, item (b), and open under `## Still open`.
   */
  lexicalSearch(query: string, limit: number): Promise<readonly RankedId[]>;
  /** Nearest chunks by cosine distance, best first. */
  vectorSearch(embedding: readonly number[], limit: number): Promise<readonly RankedId[]>;
  /** The chunks with these ids, in the order the ids were given; an unknown id is skipped. */
  getChunks(ids: readonly number[]): Promise<readonly StoredChunk[]>;
  close(): Promise<void>;
}

const PGLITE_SPECIFIER = '@electric-sql/pglite';
const PGVECTOR_SPECIFIER = '@electric-sql/pglite-pgvector';
const PG_TEXTSEARCH_SPECIFIER = '@electric-sql/pglite-pg_textsearch';

/** The meta key recording the width the `chunks.embedding` column was created with. */
const DIMENSIONS_META_KEY = 'dimensions';

/** The meta key refresh compares against the embedder's id; cleared when the column is recreated. */
export const EMBEDDER_META_KEY = 'embedder';

/** A vector as pgvector's text input form, bound as `$n::vector`. */
function vectorLiteral(embedding: readonly number[]): string {
  return `[${embedding.map((value) => String(value)).join(',')}]`;
}

/**
 * Opens the index. `dataDir: undefined` is an in-memory store; a path is created and persisted into.
 *
 * An existing index built at another width has its `chunks` table dropped and its embedder record
 * removed, so the next refresh rebuilds rather than failing on the column type.
 */
export async function openPgliteStore(options: { dataDir: string | undefined; dimensions: number }): Promise<DocStore> {
  const { dataDir, dimensions } = options;
  if (!Number.isInteger(dimensions) || dimensions <= 0) {
    throw internal(`openPgliteStore was given ${String(dimensions)} dimensions, which is not a positive integer`);
  }

  const { PGlite } = await loadRetrievalModule<typeof Pglite>(PGLITE_SPECIFIER);
  const { vector } = await loadRetrievalModule<typeof Pgvector>(PGVECTOR_SPECIFIER);
  const { pg_textsearch } = await loadRetrievalModule<typeof PgTextsearch>(PG_TEXTSEARCH_SPECIFIER);

  // The one in-repository write outside the write engine: `cli/src/core/writer.ts`'s header, the
  // per-checkout docs index clause; raised for a supervised amendment in the story index's
  // `## Corpus staleness`.
  if (dataDir !== undefined) mkdirSync(dataDir, { recursive: true });

  const db = await PGlite.create({ dataDir, extensions: { vector, pg_textsearch } });

  await db.exec('CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_textsearch;');
  await db.exec('CREATE TABLE IF NOT EXISTS meta (key text PRIMARY KEY, value text NOT NULL)');

  const readMeta = async (key: string): Promise<string | undefined> => {
    const result = await db.query<{ value: string }>('SELECT value FROM meta WHERE key = $1', [key]);
    return result.rows[0]?.value;
  };
  const writeMeta = async (key: string, value: string): Promise<void> => {
    await db.query('INSERT INTO meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [
      key,
      value,
    ]);
  };

  const width = String(dimensions);
  if ((await readMeta(DIMENSIONS_META_KEY)) !== width) {
    await db.exec(`DROP TABLE IF EXISTS ${CHUNKS_TABLE}`);
    await db.query('DELETE FROM meta WHERE key = $1', [EMBEDDER_META_KEY]);
  }
  await db.exec(
    `CREATE TABLE IF NOT EXISTS ${CHUNKS_TABLE} (id serial PRIMARY KEY, key text UNIQUE NOT NULL, path text NOT NULL, ` +
      `anchor text NOT NULL, heading text NOT NULL, body text NOT NULL, ${CHUNK_TEXT_COLUMN}, hash text NOT NULL, ` +
      `${chunkEmbeddingColumn(dimensions)})`,
  );
  await db.exec(`CREATE INDEX IF NOT EXISTS chunks_hnsw ON ${CHUNKS_TABLE} USING hnsw (embedding vector_cosine_ops)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS ${BM25_INDEX} ${BM25_INDEX_DEFINITION}`);
  await writeMeta(DIMENSIONS_META_KEY, width);

  const ranked = (rows: readonly { id: number }[]): RankedId[] => rows.map((row, index) => ({ id: row.id, rank: index + 1 }));

  return {
    readMeta,
    writeMeta,

    async listChunkHashes() {
      const result = await db.query<{ key: string; hash: string }>(`SELECT key, hash FROM ${CHUNKS_TABLE}`);
      return new Map(result.rows.map((row) => [row.key, row.hash]));
    },

    async upsertChunks(chunks, embeddings) {
      if (chunks.length !== embeddings.length) {
        throw internal(`upsertChunks was given ${chunks.length} chunks and ${embeddings.length} embeddings`);
      }
      await db.transaction(async (tx) => {
        for (const [index, chunk] of chunks.entries()) {
          const embedding = embeddings[index] ?? [];
          if (embedding.length !== dimensions) {
            throw internal(`an embedding for ${chunk.key} has ${embedding.length} dimensions where the index has ${dimensions}`);
          }
          await tx.query(
            `INSERT INTO ${CHUNKS_TABLE} (key, path, anchor, heading, body, text, hash, embedding) ` +
              'VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector) ' +
              'ON CONFLICT (key) DO UPDATE SET path = EXCLUDED.path, anchor = EXCLUDED.anchor, heading = EXCLUDED.heading, ' +
              'body = EXCLUDED.body, text = EXCLUDED.text, hash = EXCLUDED.hash, embedding = EXCLUDED.embedding',
            [chunk.key, chunk.path, chunk.anchor, chunk.heading, chunk.body, chunk.text, chunk.hash, vectorLiteral(embedding)],
          );
        }
      });
    },

    async deleteChunks(keys) {
      if (keys.length === 0) return;
      await db.query(`DELETE FROM ${CHUNKS_TABLE} WHERE key = ANY($1::text[])`, [[...keys]]);
    },

    async clear() {
      await db.exec(`DELETE FROM ${CHUNKS_TABLE}`);
    },

    async lexicalSearch(query, limit) {
      if (query.trim() === '') return [];
      // pg_textsearch scores lower-is-better; a non-matching row scores 0, so matches sort first.
      // Filtering to matching rows alone is the index scan's behaviour, not the operator's — see the
      // interface comment above.
      const result = await db.query<{ id: number }>(
        `SELECT id FROM ${CHUNKS_TABLE} ORDER BY ${BM25_ORDER_CLAUSE} LIMIT $2`,
        [query, limit],
      );
      return ranked(result.rows);
    },

    async vectorSearch(embedding, limit) {
      const result = await db.query<{ id: number }>(
        `SELECT id FROM ${CHUNKS_TABLE} ORDER BY embedding <=> $1::vector LIMIT $2`,
        [vectorLiteral(embedding), limit],
      );
      return ranked(result.rows);
    },

    async getChunks(ids) {
      if (ids.length === 0) return [];
      const result = await db.query<StoredChunk>(
        `SELECT id, key, path, anchor, heading, body FROM ${CHUNKS_TABLE} WHERE id = ANY($1::int[])`,
        [[...ids]],
      );
      const byId = new Map(result.rows.map((row) => [row.id, row]));
      return ids.flatMap((id) => {
        const row = byId.get(id);
        return row === undefined ? [] : [row];
      });
    },

    async close() {
      await db.close();
    },
  };
}
