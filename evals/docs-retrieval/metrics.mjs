/**
 * The docs-retrieval eval's metrics: graded recall@k, MRR, latency percentiles, and the two score
 * distributions the abstention threshold is calibrated on.
 *
 * **The rule this module exists to enforce: every figure is computed the same way for every arm,
 * with no test on which arm produced it.** `cli/src/retrieval/search.ts`'s header states that only
 * the reranking mode abstains, so the arms that cannot abstain report `abstainedOnNegative` as `0`
 * — a measured fact taken off their own records rather than a letter test. There is no arm letter
 * and no `SearchMode` anywhere in this module, so a mode added to `SEARCH_MODES` is scored here with
 * no edit, and `evals/docs-retrieval/arms.mjs` stays the one declared arm table.
 *
 * **Graded relevance, two columns.** A label carries `grade` `1`–`3`
 * (`evals/docs-retrieval/queries/README.md`). The primary recall and MRR score `grade >= 1` — any
 * related and useful section — and the strict column scores `grade == 3` alone, the section that
 * answers the query. A threshold calibrated against the first and one calibrated against the second
 * are different numbers, which is why both ship.
 *
 * **A negative query — an empty `labels` array — enters neither metric.** It has no relevant ref, so
 * a recall over it would be `0` by construction and would drag every arm down by the share of
 * negatives in the set. What it produces instead is the other half of the calibration:
 * `abstainedOnNegative`, and a per-query `bestScoreOnNegative` beside every positive query's
 * `bestScoreOnPositive`. Those two distributions are per-query values rather than summaries, because
 * the threshold is chosen by separating them.
 */

/** The `k` values `scoreArm` reports recall at when its caller names none. */
const DEFAULT_K_VALUES = Object.freeze([1, 3, 5]);

/** The grade at or above which a label counts for the primary columns. */
const RELEVANT_GRADE = 1;

/** The grade a label must carry exactly to count for the strict columns. */
const STRICT_GRADE = 3;

/** The refs of `query`'s labels at or above `minimumGrade`. */
function relevantRefs(query, minimumGrade) {
  return new Set(query.labels.filter((label) => label.grade >= minimumGrade).map((label) => label.ref));
}

/** The 1-based rank of the first hit whose ref is in `refs`, or `0` when there is none. */
function firstRelevantRank(hits, refs) {
  const index = hits.findIndex((hit) => refs.has(hit.ref));
  return index === -1 ? 0 : index + 1;
}

/**
 * The nearest-rank percentile of `values` — sorted ascending, index `ceil(p/100 * n) - 1`.
 *
 * Exported so a pass reporting a latency beside an arm's computes it the same way
 * (`evals/docs-retrieval/query-log-pass.mjs`); two percentiles of different definitions are not
 * comparable, and that comparison is what the query-log pass exists to publish.
 */
export function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

/** Every recorded duration of a record, whether the record carries one number or one per repetition. */
function durationsOf(record) {
  const value = record.durationMs;
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === 'number');
  return typeof value === 'number' ? [value] : [];
}

/** The best score among `hits`, or `null` when the arm returned none. */
function bestScore(hits) {
  return hits.length === 0 ? null : Math.max(...hits.map((hit) => hit.score));
}

/** Recall at each of `kValues`, and MRR, over the positive queries alone. */
function gradedColumns(pairs, minimumGrade, kValues) {
  const recall = {};
  for (const k of kValues) recall[k] = 0;
  let reciprocalRankSum = 0;

  for (const { query, record } of pairs) {
    const refs = relevantRefs(query, minimumGrade);
    const rank = firstRelevantRank(record.hits, refs);
    if (rank > 0) reciprocalRankSum += 1 / rank;
    for (const k of kValues) if (rank > 0 && rank <= k) recall[k] += 1;
  }

  const total = pairs.length;
  for (const k of kValues) recall[k] = total === 0 ? 0 : recall[k] / total;
  return { recall, mrr: total === 0 ? 0 : reciprocalRankSum / total };
}

/**
 * Every figure one arm's run produces, from that arm's `records` and the `queries` they answer.
 *
 * `records` are `{ id, arm, hits, abstained, durationMs }` — the shape
 * `evals/docs-retrieval/arms.mjs` → `runArm` returns and the shape
 * `evals/docs-retrieval/arm-a/score-transcript.mjs` → `scoreTranscript` hands over for arm A, so both
 * are scored by this one function.
 *
 * Returns `{ kValues, positives, negatives, recall, mrr, strict: { recall, mrr }, latency, samples,
 * abstainedOnNegative, perQuery }`, where `perQuery` carries each query's rank, abstention and best
 * score under `bestScoreOnPositive` or `bestScoreOnNegative`.
 *
 * Refuses by name on a record whose `id` is in no query, and on a query with no record: a metric over
 * a half-answered set is worse than a stop.
 */
export function scoreArm(records, queries, { kValues = DEFAULT_K_VALUES } = {}) {
  const byId = new Map(records.map((record) => [record.id, record]));
  for (const record of records) {
    if (!queries.some((query) => query.id === record.id)) {
      throw new Error(`eval: record ${record.id} answers no query in the set, so it cannot be scored`);
    }
  }

  const pairs = queries.map((query) => {
    const record = byId.get(query.id);
    if (record === undefined) {
      throw new Error(`eval: query ${query.id} has no record, so this arm's metrics would be taken over a short set`);
    }
    return { query, record, negative: query.labels.length === 0 };
  });

  const positives = pairs.filter((pair) => !pair.negative);
  const negatives = pairs.filter((pair) => pair.negative);
  const durations = pairs.flatMap(({ record }) => durationsOf(record));

  const primary = gradedColumns(positives, RELEVANT_GRADE, kValues);
  const strict = gradedColumns(positives, STRICT_GRADE, kValues);

  const perQuery = pairs.map(({ query, record, negative }) => {
    const score = bestScore(record.hits);
    const entry = {
      id: query.id,
      negative,
      abstained: record.abstained === true,
      hits: record.hits.map((hit) => ({ ref: hit.ref, score: hit.score })),
      durationMs: durationsOf(record),
      warnings: Array.isArray(record.warnings) ? record.warnings : [],
    };
    if (negative) {
      entry.bestScoreOnNegative = score;
    } else {
      entry.bestScoreOnPositive = score;
      entry.rank = firstRelevantRank(record.hits, relevantRefs(query, RELEVANT_GRADE));
      entry.strictRank = firstRelevantRank(record.hits, relevantRefs(query, STRICT_GRADE));
    }
    return entry;
  });

  return {
    kValues: [...kValues],
    positives: positives.length,
    negatives: negatives.length,
    recall: primary.recall,
    mrr: primary.mrr,
    strict: { recall: strict.recall, mrr: strict.mrr },
    latency: { p50: percentile(durations, 50), p95: percentile(durations, 95) },
    samples: durations.length,
    abstainedOnNegative: negatives.filter(({ record }) => record.abstained === true).length,
    perQuery,
  };
}
