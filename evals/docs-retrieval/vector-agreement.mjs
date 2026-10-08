/**
 * Per-chunk vector agreement between the TypeScript embedder and the Python one: the cosine between
 * the two backends' stored document vectors for every chunk key of a corpus.
 *
 * **The rule this module exists to enforce: the two vectors compared for a chunk are the ones each
 * backend's index actually stores for that chunk key.** The TypeScript side is embedded from the same
 * `chunk.text` `refreshIndex` embeds (`cli/src/retrieval/refresh.ts` →
 * `embedder.embedDocuments(batch.map((chunk) => chunk.text))`), in corpus order and in batches of the
 * same size, as a cold refresh batches them. The Python side is read out of the Python index and never
 * recomputed here. A chunk whose stored text differs between the two sides is reported as a text
 * mismatch and kept out of the cosine summary, because its cosine would measure the chunker rather
 * than the embedder.
 *
 * **The summary covers document vectors only** — never query vectors, which bge embeds with its
 * instruction prefix — and the write-up quoting it must say so.
 *
 * The main leg is q8 ONNX (TypeScript) against fp32 PyTorch (Python), so quantization and export are
 * measured together; `legs.quantizationAndExport` records that, and the rendered output says it. The
 * optional matched-precision leg separates them: given `onnxFp32CacheDir`, an operator-supplied cache
 * holding the fp32 ONNX export, every chunk is embedded again at fp32, and each pair gains
 * `quantizationCosine` (q8 against fp32 ONNX) and `exportCosine` (fp32 ONNX against fp32 PyTorch). That
 * leg extracts with the imported `EMBEDDING_EXTRACT_OPTIONS` alone, never loads remotely, never reads
 * the shared model cache, and restores the transformers `env` it changed.
 *
 * The Python index is read through `docker compose exec -T postgres psql`, run in
 * `docs-retrieval-service/`, whose `compose.yaml` → `services.postgres` owns the service name
 * `evals/docs-retrieval/python-backend.mjs` keeps as {@link POSTGRES_SERVICE}. That route reaches only
 * the compose database, so the measurement refuses before anything is built unless
 * `pythonDatabaseUrl(process.env)` — the same owner the index write goes through — is
 * `PYTHON_DEFAULT_DATABASE_URL`. The psql user and database are read off that
 * constant; the URL itself is never printed.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { chunkMarkdown } from '../../cli/dist/retrieval/chunk.js';
import { corpusFiles } from '../../cli/dist/retrieval/corpus.js';
import {
  EMBEDDING_EXTRACT_OPTIONS,
  EMBEDDING_MODEL,
  MODEL_FILES,
  resolveModels,
} from '../../cli/dist/retrieval/models.js';
import {
  PYTHON_DATABASE_URL_VARIABLE,
  PYTHON_DEFAULT_DATABASE_URL,
  pythonDatabaseUrl,
} from '../../cli/dist/retrieval/pythonBackend.js';
import { corpusConfig } from './corpora.mjs';
import { assertRealModelsAreAvailable } from './index-build.mjs';
import { percentile } from './metrics.mjs';
import { buildMirrorFixture, removeMirrorFixture } from './mirror-fixture.mjs';
import {
  COMPOSE_DIR,
  POSTGRES_SERVICE,
  assertPythonBackendAvailable,
  indexPythonCorpus,
  scrub,
} from './python-backend.mjs';

/** `cli/src/retrieval/refresh.ts` → `EMBED_BATCH_SIZE`, which that module does not export. */
const EMBED_BATCH_SIZE = 32;

/** `docs-retrieval-service/src/harness_docs_retrieval/store.py` → `EMBEDDER_META_KEY`. */
const EMBEDDER_META_KEY = 'embedder';

/** The fp32 export's graph; `MODEL_FILES` lists only the q8 one. */
const FP32_ONNX_FILE = 'onnx/model.onnx';

/** The precision the matched-precision leg loads, matching the Python side's. */
const FP32_DTYPE = 'fp32';

/** How many of the lowest-cosine keys are listed. */
const LOWEST_COUNT = 10;

/** Every vector of a corpus comes back in one psql answer; the default 1 MiB buffer is far too small. */
const PSQL_MAX_BUFFER = 1024 * 1024 * 1024;

const ROWS_QUERY =
  "SELECT json_build_object('key', key, 'text', text, 'embedding', embedding::text) FROM chunks ORDER BY key";

const LEG_LINE =
  'Leg: q8 ONNX (TypeScript) against fp32 PyTorch (Python) — quantization and export measured together; ' +
  'the matched-precision leg is reported separately when arranged.';

function refuse(message) {
  throw new Error(`eval: vector agreement: ${scrub(message)}`);
}

/** The compose database's psql user and database name, read off {@link PYTHON_DEFAULT_DATABASE_URL}. */
function composeDatabase() {
  const url = new URL(PYTHON_DEFAULT_DATABASE_URL);
  return { user: decodeURIComponent(url.username), database: decodeURIComponent(url.pathname.replace(/^\//, '')) };
}

function assertComposeDatabase() {
  if (pythonDatabaseUrl(process.env) !== PYTHON_DEFAULT_DATABASE_URL) {
    refuse(
      `${PYTHON_DATABASE_URL_VARIABLE} names a database other than the compose default; this measurement reads ` +
        `the Python index back through \`docker compose exec ${POSTGRES_SERVICE} psql\`, which can reach only the ` +
        `compose database, so it would read a different index from the one just built. Unset ` +
        `${PYTHON_DATABASE_URL_VARIABLE} and re-run`,
    );
  }
}

/** One `psql -At -c <sql>` against the compose database, its stdout lines; refuses by name on failure. */
function psql(checkout, sql) {
  const { user, database } = composeDatabase();
  let stdout;
  try {
    stdout = execFileSync(
      'docker',
      ['compose', 'exec', '-T', POSTGRES_SERVICE, 'psql', '-U', user, '-d', database, '-At', '-c', sql],
      { cwd: join(checkout, COMPOSE_DIR), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: PSQL_MAX_BUFFER },
    );
  } catch (error) {
    if (error.code === 'ENOENT') refuse('`docker` is not on PATH, so the Python index cannot be read');
    const stderr = String(error.stderr ?? '').split(/\r?\n/).filter((line) => line.length > 0);
    refuse(
      `\`docker compose exec ${POSTGRES_SERVICE} psql\` exited ${error.status ?? error.signal ?? error.code}, so the ` +
        `Python index cannot be read; is the compose \`${POSTGRES_SERVICE}\` service up? stderr: ` +
        `${stderr.at(-1) ?? '(no stderr)'}`,
    );
  }
  return stdout.split(/\r?\n/).filter((line) => line.length > 0);
}

/** `{ key, text }` per chunk of the corpus, exactly as `index-build.mjs` → `buildIndex` chunks it. */
function corpusChunks(resolved) {
  const corpus = corpusFiles(resolved.repoRoot, resolved.config);
  return corpus.files.flatMap((path) =>
    chunkMarkdown(path, readFileSync(join(resolved.repoRoot, path), 'utf8')).map(({ key, text }) => ({ key, text })),
  );
}

/** `{ key, text, vector }` per chunk, embedded by `embed` in corpus order and in refresh-sized batches. */
async function embedChunks(chunks, embed) {
  const byKey = new Map();
  for (let start = 0; start < chunks.length; start += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(start, start + EMBED_BATCH_SIZE);
    const vectors = await embed(batch.map((chunk) => chunk.text));
    batch.forEach((chunk, index) => byKey.set(chunk.key, { text: chunk.text, vector: vectors[index] }));
  }
  return byKey;
}

async function typescriptVectors(chunks) {
  const { embedder } = await resolveModels({ allowRemote: false });
  return { id: embedder.id, byKey: await embedChunks(chunks, (texts) => embedder.embedDocuments(texts)) };
}

/** Every file the fp32 leg loads: `MODEL_FILES`' non-graph entries plus {@link FP32_ONNX_FILE}. */
function fp32ModelFiles() {
  return [...MODEL_FILES[EMBEDDING_MODEL].filter((file) => !file.endsWith('.onnx')), FP32_ONNX_FILE];
}

/** `undefined` when the fp32 export is in place; otherwise the not-arranged reason, free of local paths. */
function matchedPrecisionGap(onnxFp32CacheDir) {
  if (onnxFp32CacheDir === undefined) return `no fp32 ONNX cache directory was supplied, so ${FP32_ONNX_FILE} is absent`;
  const missing = fp32ModelFiles().filter((file) => !existsSync(join(onnxFp32CacheDir, EMBEDDING_MODEL, file)));
  if (missing.length === 0) return undefined;
  return `the fp32 ONNX cache lacks ${missing.map((file) => `${EMBEDDING_MODEL}/${file}`).join(', ')}`;
}

/**
 * The same chunks embedded through the fp32 ONNX export in `onnxFp32CacheDir`. The transformers `env`
 * is module-global and shared with `models.js`, so the two settings changed here are put back after.
 */
async function fp32Vectors(chunks, onnxFp32CacheDir) {
  const { env, pipeline } = await import('@huggingface/transformers');
  const saved = { cacheDir: env.cacheDir, allowRemoteModels: env.allowRemoteModels };
  env.cacheDir = onnxFp32CacheDir;
  env.allowRemoteModels = false;
  try {
    const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, { dtype: FP32_DTYPE });
    const byKey = await embedChunks(chunks, async (texts) =>
      (await extractor(texts, { ...EMBEDDING_EXTRACT_OPTIONS })).tolist(),
    );
    const [first] = byKey.values();
    const width = first === undefined ? 0 : first.vector.length;
    return { id: `${EMBEDDING_MODEL}:${FP32_DTYPE}:${EMBEDDING_EXTRACT_OPTIONS.pooling}:${width}`, byKey };
  } finally {
    env.cacheDir = saved.cacheDir;
    env.allowRemoteModels = saved.allowRemoteModels;
  }
}

function pythonVectors(checkout) {
  const byKey = new Map();
  for (const line of psql(checkout, ROWS_QUERY)) {
    const row = JSON.parse(line);
    byKey.set(row.key, { text: row.text, vector: JSON.parse(row.embedding) });
  }
  const [id] = psql(checkout, `SELECT value FROM meta WHERE key = '${EMBEDDER_META_KEY}'`);
  if (id === undefined) refuse(`the Python index's meta table carries no ${EMBEDDER_META_KEY} row`);
  return { id, byKey };
}

/** The full cosine — dot over the product of norms — so an unnormalised vector cannot pass as agreeing. */
export function cosine(a, b) {
  if (a.length !== b.length) refuse(`two vectors of different widths, ${a.length} and ${b.length}, cannot be compared`);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  if (normA === 0 || normB === 0) refuse('a zero vector has no cosine');
  return dot / Math.sqrt(normA * normB);
}

function pair(typescript, python, fp32) {
  const onlyTypescript = [...typescript.byKey.keys()].filter((key) => !python.byKey.has(key));
  const onlyPython = [...python.byKey.keys()].filter((key) => !typescript.byKey.has(key));
  if (onlyTypescript.length > 0 || onlyPython.length > 0) {
    refuse(
      'the two indexes describe different corpora, though the chunkers are byte-parity-tested ' +
        '(docs-retrieval-service/tests/test_chunk_parity.py); ' +
        `TypeScript only: ${onlyTypescript.join(', ') || 'none'}; Python only: ${onlyPython.join(', ') || 'none'}`,
    );
  }
  return [...typescript.byKey.keys()].sort().map((key) => {
    const ts = typescript.byKey.get(key);
    const py = python.byKey.get(key);
    const f32 = fp32?.byKey.get(key);
    return {
      key,
      cosine: cosine(ts.vector, py.vector),
      textMatches: ts.text === py.text,
      quantizationCosine: f32 === undefined ? null : cosine(ts.vector, f32.vector),
      exportCosine: f32 === undefined ? null : cosine(f32.vector, py.vector),
    };
  });
}

/** `summary` and `lowest` over `pairs[field]`, text mismatches excluded. */
function summarise(pairs, field = 'cosine') {
  const matching = pairs.filter((entry) => entry.textMatches).map((entry) => ({ key: entry.key, cosine: entry[field] }));
  const cosines = matching.map((entry) => entry.cosine);
  const summary = {
    count: cosines.length,
    min: cosines.length === 0 ? null : Math.min(...cosines),
    p5: percentile(cosines, 5),
    p50: percentile(cosines, 50),
    mean: cosines.length === 0 ? null : cosines.reduce((sum, value) => sum + value, 0) / cosines.length,
    max: cosines.length === 0 ? null : Math.max(...cosines),
  };
  const lowest = [...matching]
    .sort((a, b) => a.cosine - b.cosine)
    .slice(0, LOWEST_COUNT)
    .map(({ key, cosine: value }) => ({ key, cosine: value }));
  return { summary, lowest };
}

/**
 * The cosine between the TypeScript and Python stored document vectors for every chunk key of the
 * corpus `options` names. `options` is the eval's parsed argument surface
 * (`evals/docs-retrieval/args.mjs` → `parseArgs`); it reads `repo`, `checkout` and `corpus`, plus the
 * optional absolute `onnxFp32CacheDir` that arranges the matched-precision leg.
 */
export async function measureVectorAgreement({ repo, checkout, corpus, onnxFp32CacheDir }) {
  assertComposeDatabase();
  assertRealModelsAreAvailable();
  const resolved = corpusConfig({ repoRoot: repo ?? checkout, corpus });
  psql(checkout, 'SELECT 1');

  const chunks = corpusChunks(resolved);
  const typescript = await typescriptVectors(chunks);
  const gap = matchedPrecisionGap(onnxFp32CacheDir);
  const fp32 = gap === undefined ? await fp32Vectors(chunks, onnxFp32CacheDir) : undefined;

  const fixture = buildMirrorFixture(checkout, resolved);
  let python;
  let snapshot;
  try {
    assertPythonBackendAvailable({ checkout, fixtureDir: fixture.dir });
    const index = await indexPythonCorpus({ checkout, fixtureDir: fixture.dir });
    snapshot = { files: index.files, chunks: index.chunks };
    python = pythonVectors(checkout);
  } finally {
    removeMirrorFixture(fixture.dir);
  }

  const pairs = pair(typescript, python, fp32);
  const { summary, lowest } = summarise(pairs);
  const matchedPrecision =
    fp32 === undefined
      ? { arranged: false, reason: gap }
      : {
          arranged: true,
          id: fp32.id,
          quantization: summarise(pairs, 'quantizationCosine'),
          export: summarise(pairs, 'exportCosine'),
        };
  return {
    corpus: resolved.id,
    snapshot,
    ids: { typescript: typescript.id, python: python.id },
    pairs,
    summary,
    lowest,
    textMismatches: pairs.filter((entry) => !entry.textMatches).map((entry) => entry.key),
    legs: { quantizationAndExport: true, matchedPrecision },
  };
}

function six(value) {
  return value === null ? '—' : value.toFixed(6);
}

function summaryTable(label, summary) {
  return [
    `| ${label} | min | p5 | p50 | mean | max |`,
    '| --- | --- | --- | --- | --- | --- |',
    `| ${summary.count} | ${six(summary.min)} | ${six(summary.p5)} | ${six(summary.p50)} | ${six(summary.mean)} | ${six(summary.max)} |`,
  ];
}

function lowestTable(heading, lowest) {
  return [
    heading.replace('<n>', String(lowest.length)),
    '',
    '| Chunk key | Cosine |',
    '| --- | --- |',
    ...lowest.map(({ key, cosine: value }) => `| \`${key}\` | ${six(value)} |`),
  ];
}

function renderMatchedPrecision(leg) {
  if (!leg.arranged) return [`Leg: matched precision — not arranged: ${leg.reason}.`];
  return [
    'Leg: matched precision (fp32 ONNX against fp32 PyTorch)',
    '',
    `- TypeScript fp32 embedder \`${leg.id}\``,
    '',
    'Quantization alone — TypeScript q8 against TypeScript fp32, one ONNX graph:',
    '',
    ...summaryTable('Pairs', leg.quantization.summary),
    '',
    ...lowestTable('The <n> lowest quantization cosines:', leg.quantization.lowest),
    '',
    'Export and runtime alone — TypeScript fp32 ONNX against Python fp32 PyTorch:',
    '',
    ...summaryTable('Pairs', leg.export.summary),
    '',
    ...lowestTable('The <n> lowest export cosines:', leg.export.lowest),
  ];
}

/** One Markdown block for {@link measureVectorAgreement}'s result; no machine-local path, no connection string. */
export function renderVectorAgreement(result) {
  const { summary } = result;
  return [
    `**Vector agreement**, taken through \`vector-agreement.mjs\` — stored document vectors only, never query vectors.`,
    '',
    `- Corpus \`${result.corpus}\`, snapshot \`{ files: ${result.snapshot.files}, chunks: ${result.snapshot.chunks} }\``,
    `- TypeScript embedder \`${result.ids.typescript}\``,
    `- Python embedder \`${result.ids.python}\``,
    `- ${LEG_LINE}`,
    '',
    '| Pairs | min | p5 | p50 | mean | max |',
    '| --- | --- | --- | --- | --- | --- |',
    `| ${summary.count} | ${six(summary.min)} | ${six(summary.p5)} | ${six(summary.p50)} | ${six(summary.mean)} | ${six(summary.max)} |`,
    '',
    `The ${result.lowest.length} lowest cosines:`,
    '',
    '| Chunk key | Cosine |',
    '| --- | --- |',
    ...result.lowest.map(({ key, cosine: value }) => `| \`${key}\` | ${six(value)} |`),
    '',
    result.textMismatches.length === 0
      ? 'Text mismatches: none.'
      : `Text mismatches, kept out of the summary: ${result.textMismatches.map((key) => `\`${key}\``).join(', ')}.`,
    '',
    ...renderMatchedPrecision(result.legs.matchedPrecision),
  ].join('\n');
}
