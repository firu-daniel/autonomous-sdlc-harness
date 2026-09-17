/**
 * The embedder and the reranker docs retrieval runs on: the two interfaces every consumer takes, the
 * local Transformers.js models behind them, the files an offline load needs, and the deterministic
 * stubs.
 *
 * **The rule this module exists to enforce: a model is downloaded only by `fetchModels`, at setup
 * time. Every other load runs with remote models disabled, so a run never reaches the network.**
 * `env.allowRemoteModels` is set in {@link loadModels} alone, from its caller's option, before any
 * `from_pretrained`; `@huggingface/transformers` is reached only through `loadRetrievalModule`
 * (`cli/src/retrieval/runtime.ts`), and this file takes its types with `import type`.
 *
 * **Why the stubs exist.** The suite drives the compiled CLI in a subprocess and has no mocking
 * framework (`.claude/context/conventions.md` → `## The testing bar`), so a test cannot substitute a
 * model in process. {@link RETRIEVAL_STUB_ENV} is the seam: set in the child's environment, it swaps
 * both halves for hash-based stand-ins that never download or load a model.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type * as Transformers from '@huggingface/transformers';

import { HarnessError } from '../core/errors.js';
import { loadRetrievalModule, retrievalModelCacheDir } from './runtime.js';

/** Turns text into vectors. `id` is stored in the index, and a change to it forces a full rebuild. */
export interface Embedder {
  readonly id: string;
  readonly dimensions: number;
  embedDocuments(texts: readonly string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

/** Scores passages against a query. Every score lies in `[0, 1]`, and higher is better. */
export interface Reranker {
  readonly id: string;
  score(query: string, passages: readonly string[]): Promise<number[]>;
}

/**
 * ONNX port of `BAAI/bge-small-en-v1.5`, MIT; about 33M parameters, per the upstream model card.
 * Loaded with `dtype: 'q8'`, CLS pooling and `normalize: true`, yielding {@link EMBEDDING_DIMENSIONS}
 * dimensions.
 */
export const EMBEDDING_MODEL = 'Xenova/bge-small-en-v1.5';

/** bge-v1.5's retrieval instruction, prepended to queries only. */
export const EMBEDDING_QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';

/**
 * ONNX port of `cross-encoder/ms-marco-MiniLM-L-6-v2`, Apache-2.0; about 23M parameters, per the
 * upstream model card. Loaded with `dtype: 'q8'`; each score is the sigmoid of its single logit.
 */
export const RERANK_MODEL = 'Xenova/ms-marco-MiniLM-L-6-v2';

/** Bumped by hand when any loading parameter above changes, so the embedder's `id` changes with it. */
export const MODEL_VERSION = 1;

/** The vector width of {@link EMBEDDING_MODEL}, which the stub embedder matches. */
const EMBEDDING_DIMENSIONS = 384;

const MODEL_DTYPE = 'q8';

const TRANSFORMERS_SPECIFIER = '@huggingface/transformers';

/**
 * The files, relative to `<retrievalModelCacheDir()>/<model id>/`, an offline load of each model
 * needs. Read off `@huggingface/transformers` 4.3.0: `utils/hub.js` → `buildResourcePaths` keys a
 * `FileCache` entry at `<model id>/<filename>` on the `main` revision, and `FileCache.match` joins that
 * onto `env.cacheDir`; `utils/model_registry/get_model_files.js` → `get_model_files` lists
 * `config.json` plus `onnx/<session><dtype suffix>.onnx` (`q8` → `_quantized`, `utils/dtypes.js`),
 * with no external-data chunk for these configs; `get_tokenizer_files` lists `tokenizer.json` and
 * `tokenizer_config.json`.
 */
export const MODEL_FILES: Readonly<Record<string, readonly string[]>> = {
  [EMBEDDING_MODEL]: ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'],
  [RERANK_MODEL]: ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'],
};

/** File existence only: every {@link MODEL_FILES} entry under `cacheDir`, `missing` as `<model id>/<file>`. */
export function modelFilesPresent(cacheDir: string): { present: boolean; missing: readonly string[] } {
  const missing: string[] = [];
  for (const [modelId, files] of Object.entries(MODEL_FILES)) {
    for (const file of files) {
      if (!existsSync(join(cacheDir, modelId, file))) missing.push(`${modelId}/${file}`);
    }
  }
  return { present: missing.length === 0, missing };
}

/** The tensor surface this module reads. */
interface ListTensor {
  tolist(): unknown[];
  sigmoid(): ListTensor;
}

/** The real models. Remote loading follows `options.allowRemote`, set before anything is loaded. */
export async function loadModels(options: { allowRemote: boolean }): Promise<{ embedder: Embedder; reranker: Reranker }> {
  const transformers = await loadRetrievalModule<typeof Transformers>(TRANSFORMERS_SPECIFIER);
  const { env } = transformers;
  env.cacheDir = retrievalModelCacheDir();
  env.allowRemoteModels = options.allowRemote;

  const extractor = await transformers.pipeline('feature-extraction', EMBEDDING_MODEL, { dtype: MODEL_DTYPE });
  const embed = async (texts: string[]): Promise<number[][]> => {
    const output = (await extractor(texts, { pooling: 'cls', normalize: true })) as unknown as ListTensor;
    return output.tolist() as number[][];
  };
  const embedder: Embedder = {
    id: `${EMBEDDING_MODEL}:${MODEL_DTYPE}:cls:${EMBEDDING_DIMENSIONS}:v${MODEL_VERSION}`,
    dimensions: EMBEDDING_DIMENSIONS,
    async embedDocuments(texts) {
      return texts.length === 0 ? [] : embed([...texts]);
    },
    async embedQuery(text) {
      const [vector] = await embed([`${EMBEDDING_QUERY_PREFIX}${text}`]);
      return vector ?? [];
    },
  };

  const tokenizer = await transformers.AutoTokenizer.from_pretrained(RERANK_MODEL);
  const model = await transformers.AutoModelForSequenceClassification.from_pretrained(RERANK_MODEL, {
    dtype: MODEL_DTYPE,
  });
  const reranker: Reranker = {
    id: `${RERANK_MODEL}:${MODEL_DTYPE}:sigmoid:v${MODEL_VERSION}`,
    async score(query, passages) {
      if (passages.length === 0) return [];
      const inputs = tokenizer(
        passages.map(() => query),
        { text_pair: [...passages], padding: true, truncation: true },
      );
      const { logits } = (await (model as unknown as (input: unknown) => Promise<{ logits: ListTensor }>)(inputs));
      return (logits.sigmoid().tolist() as number[][]).map((row) => row[0] ?? 0);
    },
  };

  return { embedder, reranker };
}

/** The one place a download is allowed: load both models with remote loading on, and run each once. */
export async function fetchModels(): Promise<void> {
  const { embedder, reranker } = await loadModels({ allowRemote: true });
  await embedder.embedQuery('warm up');
  await reranker.score('warm up', ['warm up']);
}

/** The environment variable that selects the stubs; this constant is its only spelling in `cli/src`. */
export const RETRIEVAL_STUB_ENV = 'AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB';

const STUB_VERSIONS = ['hash-v1', 'hash-v2'] as const;

type StubVersion = (typeof STUB_VERSIONS)[number];

/** Lower-cased alphanumeric runs of at least `minLength` characters. */
function stubTokens(text: string, minLength: number): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= minLength);
}

function stubEmbedder(version: StubVersion): Embedder {
  const salt = version === 'hash-v2' ? 'v2' : '';
  const embed = (text: string): number[] => {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    for (const token of stubTokens(text, 2)) {
      const bucket = createHash('sha256').update(salt).update(token).digest().readUInt32BE(0) % EMBEDDING_DIMENSIONS;
      vector[bucket] = (vector[bucket] ?? 0) + 1;
    }
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    return norm === 0 ? vector : vector.map((value) => value / norm);
  };
  return {
    id: `stub-hash:${version}`,
    dimensions: EMBEDDING_DIMENSIONS,
    async embedDocuments(texts) {
      return texts.map(embed);
    },
    async embedQuery(text) {
      return embed(text);
    },
  };
}

const STUB_RERANKER: Reranker = {
  id: 'stub-overlap',
  async score(query, passages) {
    const queryTokens = [...new Set(stubTokens(query, 3))];
    return passages.map((passage) => {
      if (queryTokens.length === 0) return 0;
      const passageTokens = new Set(stubTokens(passage, 2));
      return queryTokens.filter((token) => passageTokens.has(token)).length / queryTokens.length;
    });
  },
};

/**
 * The stubs when {@link RETRIEVAL_STUB_ENV} names one of {@link STUB_VERSIONS}, a refusal for any other
 * non-empty value, and otherwise {@link loadModels}.
 */
export async function resolveModels(options: { allowRemote: boolean }): Promise<{ embedder: Embedder; reranker: Reranker }> {
  const value = process.env[RETRIEVAL_STUB_ENV];
  if (value === undefined || value === '') return loadModels(options);
  const version = STUB_VERSIONS.find((candidate) => candidate === value);
  if (version === undefined) {
    throw new HarnessError(
      `${RETRIEVAL_STUB_ENV} is set to ${JSON.stringify(value)}; its legal values are ${STUB_VERSIONS.join(' and ')}, or unset it to load the real models`,
    );
  }
  return { embedder: stubEmbedder(version), reranker: STUB_RERANKER };
}
