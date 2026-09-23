/**
 * Hybrid search over the docs-retrieval index: the BM25 and vector arms of {@link DocStore},
 * reciprocal rank fusion, cross-encoder rerank, abstention, and the rendering a terminal and an agent
 * both read.
 *
 * **The rule this module exists to enforce: only `fused-rerank` abstains, and only below
 * {@link ABSTAIN_SCORE_THRESHOLD}, calibrated against the measured reranker distribution** — that
 * constant's own doc comment carries the value and points at the record of how it was chosen. The
 * reranker's score is the one this module treats as calibrated; the `lexical`, `vector` and `fused`
 * scores are rank-derived and uncalibrated, so those modes never abstain. The score abstention tests
 * is reported on the result whether or not it abstained, so the calibration can observe the
 * distribution it cuts. Every store access goes through the {@link DocStore} methods; this module
 * holds no SQL.
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
 * The best reranker score below which `fused-rerank` abstains, calibrated at `0.32` against the real
 * reranker's measured score distribution; `docs/retrieval-eval-results.md` → `## Threshold
 * calibration` holds how that value was chosen and on what, and is the only record of it.
 *
 * This module's own suite bounds the value from outside: the abstention cases of
 * `cli/test/docs-retrieval.test.mjs` run under the `stub-overlap` reranker, which scores a matching
 * query's best hit `1.000` and the no-match query `0.000` on every candidate, so any value strictly
 * inside `(0.000, 1.000)` keeps them passing and a value at or outside either end flips one.
 *
 * No other mode gains a score filter from this: the `lexical`, `vector` and `fused` scores are
 * rank-derived, and a cut-off on them would be an arbitrary number rather than a calibrated one.
 */
export const ABSTAIN_SCORE_THRESHOLD = 0.32;

/** The whole rendering of an abstention. */
export const ABSTAIN_MESSAGE = 'no confident match';

/** The whole rendering of a search that found nothing, in a mode that does not abstain. Module-private: {@link renderResults} is its only reader. */
const NO_RESULTS_MESSAGE = 'no results';

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
  /** The top reranker score `fused-rerank` compared against ABSTAIN_SCORE_THRESHOLD; null in every other mode, and when there were no candidates to rerank. */
  readonly bestRerankScore: number | null;
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
 * `bestRerankScore` carries the score that comparison read, abstention or not, and no renderer reads it.
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
    return {
      abstained: false,
      hits: chunks.map((chunk) => hitOf(chunk, scores.get(chunk.id) ?? 0)),
      bestRerankScore: null,
    };
  }

  const candidates = await store.getChunks(fused.slice(0, RERANK_CANDIDATES).map(([id]) => id));
  if (candidates.length === 0) return { abstained: true, hits: [], bestRerankScore: null };
  const rerankScores = await reranker.score(
    query,
    candidates.map((chunk) => (chunk.heading === '' ? chunk.body : `${chunk.heading}\n${chunk.body}`)),
  );
  const reranked = candidates
    .map((chunk, index) => ({ chunk, score: rerankScores[index] ?? 0 }))
    .sort((a, b) => b.score - a.score);
  const best = reranked[0]?.score ?? 0;
  if (best < ABSTAIN_SCORE_THRESHOLD) return { abstained: true, hits: [], bestRerankScore: best };
  return {
    abstained: false,
    hits: reranked.slice(0, k).map(({ chunk, score }) => hitOf(chunk, score)),
    bestRerankScore: best,
  };
}

/**
 * {@link ABSTAIN_MESSAGE} alone on an abstention; otherwise two lines per hit, `n. ref (score s)` and
 * the indented snippet, with no blank line between hits. No hits and no abstention render as
 * {@link NO_RESULTS_MESSAGE}: every caller prints what this returns, so an empty string would leave a
 * run that answered indistinguishable from one that did nothing.
 */
export function renderResults(result: SearchResult): string {
  if (result.abstained) return ABSTAIN_MESSAGE;
  if (result.hits.length === 0) return NO_RESULTS_MESSAGE;
  return result.hits
    .flatMap((hit, index) => [`${index + 1}. ${hit.ref} (score ${hit.score.toFixed(3)})`, `   ${hit.snippet}`])
    .join('\n');
}
