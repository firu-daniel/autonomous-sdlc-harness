/**
 * Hybrid search over the docs-retrieval index: the BM25 and vector arms of {@link DocStore},
 * reciprocal rank fusion, cross-encoder rerank, abstention, and the rendering a terminal and an agent
 * both read.
 *
 * **The rule this module exists to enforce: only `fused-rerank` abstains, and only below
 * {@link ABSTAIN_SCORE_THRESHOLD}, a provisional constant.** The reranker's score is the one this
 * module treats as calibrated; the `lexical`, `vector` and `fused` scores are rank-derived and
 * uncalibrated, so those modes never abstain. Every store access goes through the {@link DocStore}
 * methods; this module holds no SQL.
 */

import { HarnessError } from '../core/errors.js';
import type { Embedder, Reranker } from './models.js';
import type { DocStore, RankedId, StoredChunk } from './store.js';

/** The reciprocal-rank-fusion constant: a hit at rank `r` contributes `1 / (RRF_K + r)`. */
export const RRF_K = 60;

/** The rows taken from each arm before fusion. */
export const ARM_CANDIDATES = 50;

/** The fused rows sent to the reranker in `fused-rerank`. */
export const RERANK_CANDIDATES = 20;

/** The results returned when the caller does not ask for a count. */
export const DEFAULT_RESULTS = 5;

/** The upper bound `k` is clamped to. */
export const MAX_RESULTS = 20;

/** The snippet length, before the `...` a cut appends. */
const SNIPPET_CHARS = 240;

/**
 * PROVISIONAL: the best reranker score below which `fused-rerank` abstains. Set from the fixture
 * corpus of `cli/test/docs-retrieval.test.mjs` under the `stub-overlap` reranker, where it must sit
 * strictly between the matching queries' lowest best score and the no-match query's highest score:
 * `"work without a network"` scored 1.000 at its best hit, and `"quantum chromodynamics lattice"`
 * scored 0.000 on every candidate. The eval branch `feat_docs_retrieval_eval` calibrates it on a real
 * catalog with the real reranker.
 */
export const ABSTAIN_SCORE_THRESHOLD = 0.3;

/** The whole rendering of an abstention. */
export const ABSTAIN_MESSAGE = 'no confident match';

/** `lexical` and `vector` run one arm, `fused` both, `fused-rerank` both plus the reranker. */
export type SearchMode = 'lexical' | 'vector' | 'fused' | 'fused-rerank';

/** Every {@link SearchMode}, in the order a refusal lists them. */
export const SEARCH_MODES: readonly SearchMode[] = ['lexical', 'vector', 'fused', 'fused-rerank'];

/** One result. `ref` is `path#anchor`, or `path` alone for a preamble chunk. */
export interface SearchHit {
  readonly ref: string;
  readonly path: string;
  readonly anchor: string;
  readonly heading: string;
  readonly snippet: string;
  readonly score: number;
}

export interface SearchResult {
  readonly abstained: boolean;
  readonly hits: readonly SearchHit[];
}

/** Adds each hit's RRF term to `scores`, keeping first-seen order. */
function addRrf(scores: Map<number, number>, ranked: readonly RankedId[]): void {
  for (const { id, rank } of ranked) scores.set(id, (scores.get(id) ?? 0) + 1 / (RRF_K + rank));
}

/** Whitespace collapsed, cut on a word boundary at {@link SNIPPET_CHARS} with `...` appended. */
function snippetOf(body: string): string {
  const text = body.replace(/\s+/g, ' ').trim();
  if (text.length <= SNIPPET_CHARS) return text;
  const cut = text.slice(0, SNIPPET_CHARS);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}...`;
}

function hitOf(chunk: StoredChunk, score: number): SearchHit {
  return {
    ref: chunk.anchor === '' ? chunk.path : `${chunk.path}#${chunk.anchor}`,
    path: chunk.path,
    anchor: chunk.anchor,
    heading: chunk.heading,
    snippet: snippetOf(chunk.body),
    score,
  };
}

/**
 * Answers `query` in `mode`. `k` is clamped to `[1, MAX_RESULTS]`; an empty or whitespace-only query
 * is refused. Only `fused-rerank` abstains — on no candidates, or a best reranker score below
 * {@link ABSTAIN_SCORE_THRESHOLD}; the other modes' scores are uncalibrated and never abstain.
 */
export async function searchDocs(options: {
  store: DocStore;
  embedder: Embedder;
  reranker: Reranker;
  query: string;
  k: number;
  mode: SearchMode;
}): Promise<SearchResult> {
  const { store, embedder, reranker, query, mode } = options;
  if (query.trim() === '') throw new HarnessError('docs search: the query is empty; give a non-empty query');
  const k = Math.min(MAX_RESULTS, Math.max(1, Math.trunc(Number.isFinite(options.k) ? options.k : DEFAULT_RESULTS)));

  const scores = new Map<number, number>();
  if (mode !== 'vector') addRrf(scores, await store.lexicalSearch(query, ARM_CANDIDATES));
  if (mode !== 'lexical') addRrf(scores, await store.vectorSearch(await embedder.embedQuery(query), ARM_CANDIDATES));
  const fused = [...scores.entries()].sort((a, b) => b[1] - a[1]);

  if (mode !== 'fused-rerank') {
    const top = fused.slice(0, k);
    const chunks = await store.getChunks(top.map(([id]) => id));
    return { abstained: false, hits: chunks.map((chunk) => hitOf(chunk, scores.get(chunk.id) ?? 0)) };
  }

  const candidates = await store.getChunks(fused.slice(0, RERANK_CANDIDATES).map(([id]) => id));
  if (candidates.length === 0) return { abstained: true, hits: [] };
  const rerankScores = await reranker.score(
    query,
    candidates.map((chunk) => (chunk.heading === '' ? chunk.body : `${chunk.heading}\n${chunk.body}`)),
  );
  const reranked = candidates
    .map((chunk, index) => ({ chunk, score: rerankScores[index] ?? 0 }))
    .sort((a, b) => b.score - a.score);
  const best = reranked[0]?.score ?? 0;
  if (best < ABSTAIN_SCORE_THRESHOLD) return { abstained: true, hits: [] };
  return { abstained: false, hits: reranked.slice(0, k).map(({ chunk, score }) => hitOf(chunk, score)) };
}

/**
 * {@link ABSTAIN_MESSAGE} alone on an abstention; otherwise two lines per hit, `n. ref (score s)` and
 * the indented snippet, with no blank line between hits. No hits and no abstention render as `''`.
 */
export function renderResults(result: SearchResult): string {
  if (result.abstained) return ABSTAIN_MESSAGE;
  return result.hits
    .flatMap((hit, index) => [`${index + 1}. ${hit.ref} (score ${hit.score.toFixed(3)})`, `   ${hit.snippet}`])
    .join('\n');
}
