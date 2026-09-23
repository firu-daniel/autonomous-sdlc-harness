/**
 * The fixed re-calibration method of `ABSTAIN_SCORE_THRESHOLD`, over the uncensored scores the
 * generated region of `docs/retrieval-eval-results.md` publishes.
 *
 * **The rule this module exists to enforce: the method is the one `docs/retrieval-eval-results.md` →
 * `## Threshold calibration` → `### The re-calibration method, fixed before the real-catalog run`
 * fixes, and this module is its only implementation.** {@link calibrateThreshold} takes the pool and
 * nothing else — no margin, no grade, no class and no rounding step is a parameter — so the value a
 * run moves the constant to cannot be tuned toward the figures once they are in. A change to the
 * method is a change to that subsection first, and to this module second.
 *
 * No marker spelling and no block parsing live here (`evals/docs-retrieval/results.mjs` →
 * `readCorpusMachineHalf`), no mode string (`SEARCH_MODES`), no grade (`evals/docs-retrieval/metrics.mjs`
 * → `STRICT_GRADE`) and no `negativeKind` class (`evals/docs-retrieval/queries.mjs` → `NEGATIVE_KINDS`):
 * each is imported from its owner.
 */

import { SEARCH_MODES } from '../../cli/dist/retrieval/search.js';
import { STRICT_GRADE } from './metrics.mjs';
import { NEGATIVE_KINDS } from './queries.mjs';
import { readCorpusMachineHalf } from './results.mjs';

/** This module's own point kinds; the negative classes beside them are {@link NEGATIVE_KINDS}'. */
const POSITIVE = 'positive';
const UNCLASSED = 'unclassed';

const METHOD = Object.freeze({ separable: 'separable', overlapping: 'overlapping', cannotSeparate: 'cannot-separate' });

/**
 * Most positives the overlapping case may abstain on before the finding is *cannot separate*.
 */
const MAX_PRICE = 1;

const NULL_SCORE_REASON = 'bestRerankScore is null — no candidate to rerank';

/**
 * `x * 100` with binary noise stripped — twelve significant digits is far above a reranker score's
 * resolution and far below the error a product by `100` carries, so `0.3195` reads as `31.95`, not
 * `31.949999999999996`.
 */
function hundredthsOf(x) {
  return Number((x * 100).toPrecision(12));
}

/** Half-up rounding at two decimals, taken in integer hundredths. */
function roundHalfUpToHundredths(x) {
  return Math.round(hundredthsOf(x)) / 100;
}

/**
 * The smallest two-decimal number strictly greater than `x`, compared as the doubles
 * `best < ABSTAIN_SCORE_THRESHOLD` compares — so the value abstains on `x` itself.
 */
function smallestHundredthAbove(x) {
  let hundredths = Math.floor(hundredthsOf(x)) + 1;
  while (hundredths / 100 <= x) hundredths += 1;
  while ((hundredths - 1) / 100 > x) hundredths -= 1;
  return hundredths / 100;
}

/**
 * The per-query entries of one arm of one corpus block of `docs/retrieval-eval-results.md`'s generated
 * region: the `metrics.perQuery` of the `arms[]` entry whose `mode` is `mode`.
 *
 * Refuses by name a `mode` outside `SEARCH_MODES` (an absent one included), an arm the block does not
 * carry or did not run, and an entry with no `bestRerankScore` key — a block generated before that
 * field existed carries only the censored scores, and calibrating on those is what this method replaces.
 */
export function readPerQuery(resultsText, corpusId, mode) {
  if (!SEARCH_MODES.includes(mode)) {
    throw new Error(
      `eval: calibration mode ${JSON.stringify(mode)} is not one of SEARCH_MODES (${SEARCH_MODES.join(', ')})`,
    );
  }
  const payload = readCorpusMachineHalf(resultsText, corpusId);
  const arm = Array.isArray(payload.arms) ? payload.arms.find((entry) => entry.mode === mode) : undefined;
  if (arm === undefined) {
    throw new Error(`eval: the block for corpus ${corpusId} carries no arm in mode ${mode}`);
  }
  if (arm.ran !== true) {
    throw new Error(`eval: arm ${arm.arm} (mode ${mode}) did not run in the block for corpus ${corpusId}`);
  }
  const perQuery = arm.metrics?.perQuery;
  if (!Array.isArray(perQuery)) {
    throw new Error(`eval: arm ${arm.arm} (mode ${mode}) of corpus ${corpusId} carries no metrics.perQuery`);
  }
  for (const entry of perQuery) {
    if (!Object.hasOwn(entry, 'bestRerankScore')) {
      throw new Error(
        `eval: query ${entry.id} of arm ${arm.arm} (mode ${mode}), corpus ${corpusId}, carries no bestRerankScore — ` +
          'the block predates the uncensored field; regenerate it before calibrating on it',
      );
    }
    if (entry.bestRerankScore !== null && typeof entry.bestRerankScore !== 'number') {
      throw new Error(
        `eval: query ${entry.id} of corpus ${corpusId} carries bestRerankScore ` +
          `${JSON.stringify(entry.bestRerankScore)}, which is neither a number nor null`,
      );
    }
  }
  return perQuery;
}

/** The point kind of `query`: a positive, a negative's `negativeKind`, or `unclassed`. */
function kindOf(query) {
  if (query.labels.length > 0) return POSITIVE;
  return Object.values(NEGATIVE_KINDS).includes(query.negativeKind) ? query.negativeKind : UNCLASSED;
}

/** One corpus's scored points and excluded ids, joined on `id` and refused on any mismatch. */
function pointsOfCorpus({ corpus, queries, perQuery }) {
  const byId = new Map(perQuery.map((entry) => [entry.id, entry]));
  for (const entry of perQuery) {
    if (!queries.some((query) => query.id === entry.id)) {
      throw new Error(`eval: calibration entry ${entry.id} of corpus ${corpus} answers no query in its set`);
    }
  }
  const points = [];
  const excluded = [];
  for (const query of queries) {
    const entry = byId.get(query.id);
    if (entry === undefined) {
      throw new Error(`eval: query ${query.id} of corpus ${corpus} has no calibration entry`);
    }
    const negative = query.labels.length === 0;
    if (entry.negative !== negative) {
      throw new Error(
        `eval: query ${query.id} of corpus ${corpus} is ${negative ? 'negative' : 'positive'} in its set ` +
          'but not in its calibration entry',
      );
    }
    if (entry.bestRerankScore === null) {
      excluded.push({ corpus, id: query.id, reason: NULL_SCORE_REASON });
      continue;
    }
    points.push({
      corpus,
      id: query.id,
      kind: kindOf(query),
      grade3: query.labels.some((label) => label.grade === STRICT_GRADE),
      score: entry.bestRerankScore,
    });
  }
  return { points, excluded };
}

function reference({ corpus, id, score }) {
  return { corpus, id, score };
}

/** The point with the extreme score under `better`, or `null` for an empty list. */
function extreme(points, better) {
  return points.reduce((best, point) => (best === null || better(point.score, best.score) ? point : best), null);
}

/**
 * The fixed method over a pool of corpora: `pool` is `[{ corpus, queries, perQuery }]`, `queries` as
 * `evals/docs-retrieval/queries.mjs` → `loadQueries` returns them and `perQuery` as
 * {@link readPerQuery} does.
 *
 * Returns `{ method, value, highestNegative, lowestPositive, lowestGrade3Positive, nearBelowL, price,
 * excluded, points }`. `value` is `null` exactly when `method` is `cannot-separate`; `price` is every
 * positive scoring below the value — below the candidate value on `cannot-separate` — and `nearBelowL`
 * is `N`, both whichever method applies.
 *
 * Refuses a pool with no scored positive or no scored negative: neither side of the method is defined
 * over it.
 */
export function calibrateThreshold(pool) {
  const points = [];
  const excluded = [];
  for (const member of pool) {
    const corpusPoints = pointsOfCorpus(member);
    points.push(...corpusPoints.points);
    excluded.push(...corpusPoints.excluded);
  }

  const positives = points.filter((point) => point.kind === POSITIVE);
  const negatives = points.filter((point) => point.kind !== POSITIVE);
  if (positives.length === 0 || negatives.length === 0) {
    throw new Error(
      `eval: calibration pool carries ${positives.length === 0 ? 'no scored positive' : 'no scored negative'}, ` +
        'so neither side of the method is defined over it',
    );
  }

  const highestNegative = extreme(negatives, (a, b) => a > b);
  const lowestPositive = extreme(positives, (a, b) => a < b);
  const lowestGrade3Positive = extreme(
    positives.filter((point) => point.grade3),
    (a, b) => a < b,
  );
  const nearBelowL =
    lowestGrade3Positive === null
      ? []
      : negatives.filter((point) => point.kind === NEGATIVE_KINDS.near && point.score < lowestGrade3Positive.score);
  const priceBelow = (value) => positives.filter((point) => point.score < value).map(reference);

  const shared = {
    highestNegative: reference(highestNegative),
    lowestPositive: reference(lowestPositive),
    lowestGrade3Positive: lowestGrade3Positive === null ? null : reference(lowestGrade3Positive),
    nearBelowL: nearBelowL.map(reference),
    excluded,
    points,
  };

  if (highestNegative.score < lowestPositive.score) {
    const value = roundHalfUpToHundredths((highestNegative.score + lowestPositive.score) / 2);
    return { method: METHOD.separable, value, ...shared, price: priceBelow(value) };
  }

  if (nearBelowL.length === 0) {
    return { method: METHOD.cannotSeparate, value: null, ...shared, price: [] };
  }
  const candidate = smallestHundredthAbove(Math.max(...nearBelowL.map((point) => point.score)));
  const price = priceBelow(candidate);
  if (price.length > MAX_PRICE) {
    return { method: METHOD.cannotSeparate, value: null, ...shared, price };
  }
  return { method: METHOD.overlapping, value: candidate, ...shared, price };
}
