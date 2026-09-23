/**
 * The spread of arm A's figures across a variant's repetitions, and the same per-half and far / near
 * breakdown for any arm's records.
 *
 * **The rule this module exists to enforce: every arm A figure the hand-written section publishes, and
 * every arm E breakdown beside it, is computed here from the committed transcripts and the generated
 * block, never by hand and never by a second scoring path.** Recall and MRR — pooled and per
 * partition — come from `evals/docs-retrieval/metrics.mjs` → `scoreArm` over the relevant subset, and
 * a transcript is read through `evals/docs-retrieval/arm-a/score-transcript.mjs` alone, so a figure
 * here is the table's figure by construction.
 *
 * The statistics are the ones `docs/retrieval-eval.md` → `### Two arm A variants, and how they
 * combine` fixes: per repetition, the nearest-rank p50 of per-query `durationMs`, and billed tokens
 * per query as `input + output + cache_creation_input + cache_read_input` over the record count, a
 * field absent from `usage` counting as `0`. Across repetitions, `median` and `p95` are
 * `metrics.mjs` → `percentile` (nearest-rank), so with five repetitions the p95 is the maximum.
 */

import { percentile, scoreArm } from '../metrics.mjs';
import { NEGATIVE_KINDS, UNCLASSED_NEGATIVE } from '../queries.mjs';
import { readTranscript, scoreTranscript } from './score-transcript.mjs';

/** The recall cutoff every bar grades (`docs/retrieval-eval.md` → `### Two arm A variants, and how they combine`). */
const RECALL_K = 5;

/** Repetitions per variant (`docs/retrieval-eval.md` → `### Five repetitions, and what is recorded`); fewer is `partial`. */
const FULL_REPETITIONS = 5;

/** The usage fields summed into the billed token figure. */
const BILLED_FIELDS = Object.freeze([
  'input_tokens',
  'output_tokens',
  'cache_creation_input_tokens',
  'cache_read_input_tokens',
]);

/** The partition of one ref: its first two directory segments, or its one directory for a file directly under it. */
function partitionOfRef(ref) {
  const directories = ref.split('#')[0].split('/').slice(0, -1);
  return directories.slice(0, 2).join('/') || '.';
}

/** The partition every label of a positive `query` sits in; refuses a positive spanning two; `null` for a negative. */
export function partitionOf(query) {
  if (query.labels.length === 0) return null;
  const partitions = [...new Set(query.labels.map((label) => partitionOfRef(label.ref)))];
  if (partitions.length > 1) {
    throw new Error(`eval: query ${query.id} is labelled in two partitions (${partitions.join(', ')}), so it has no half`);
  }
  return partitions[0];
}

function relevance(records, queries) {
  const metrics = scoreArm(records, queries, { kValues: [RECALL_K] });
  return {
    positives: metrics.positives,
    recallAt5: metrics.recall[RECALL_K],
    mrr: metrics.mrr,
    strictRecallAt5: metrics.strict.recall[RECALL_K],
    strictMrr: metrics.strict.mrr,
  };
}

/** Pooled and per-partition relevance, and negatives answered `none` split by `negativeKind`. */
export function breakdown({ records, queries }) {
  const pooled = relevance(records, queries);
  const byId = new Map(records.map((record) => [record.id, record]));

  const groups = new Map();
  for (const query of queries) {
    const partition = partitionOf(query);
    if (partition === null) continue;
    if (!groups.has(partition)) groups.set(partition, []);
    groups.get(partition).push(query);
  }
  const byPartition = {};
  for (const [partition, subset] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    byPartition[partition] = relevance(subset.map((query) => byId.get(query.id)), subset);
  }

  const negatives = { total: 0, answeredNone: 0 };
  for (const kind of [...Object.values(NEGATIVE_KINDS), UNCLASSED_NEGATIVE]) negatives[kind] = { total: 0, answeredNone: 0 };
  for (const query of queries) {
    if (query.labels.length > 0) continue;
    const bucket = negatives[query.negativeKind ?? UNCLASSED_NEGATIVE];
    const answeredNone = byId.get(query.id).abstained === true ? 1 : 0;
    for (const counter of [negatives, bucket]) {
      counter.total += 1;
      counter.answeredNone += answeredNone;
    }
  }

  return { pooled, byPartition, negatives };
}

function spread(values) {
  const numbers = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  return { values, median: percentile(numbers, 50), p95: percentile(numbers, 95) };
}

function billed(usage) {
  if (usage === null || typeof usage !== 'object') return 0;
  return BILLED_FIELDS.reduce((sum, field) => sum + (typeof usage[field] === 'number' ? usage[field] : 0), 0);
}

function repetition(path, queries, chunkKeys) {
  const { records } = scoreTranscript({ transcript: path, queries });
  const raw = readTranscript(path);

  const durations = records.flatMap((record) => (typeof record.durationMs === 'number' ? [record.durationMs] : []));

  const perField = {};
  const toolCalls = {};
  const queriesUsingTool = {};
  const perQueryTokens = raw.map((entry) => {
    const usage = entry.usage ?? null;
    if (usage !== null && typeof usage === 'object') {
      for (const [field, value] of Object.entries(usage)) {
        if (typeof value === 'number' && Number.isFinite(value)) perField[field] = (perField[field] ?? 0) + value;
      }
    }
    if (entry.toolCalls !== null && typeof entry.toolCalls === 'object') {
      for (const [name, count] of Object.entries(entry.toolCalls)) {
        if (typeof count !== 'number' || count <= 0) continue;
        toolCalls[name] = (toolCalls[name] ?? 0) + count;
        queriesUsingTool[name] = (queriesUsingTool[name] ?? 0) + 1;
      }
    }
    return { id: entry.id, billed: billed(usage), usage };
  });
  const billedTotal = perQueryTokens.reduce((sum, entry) => sum + entry.billed, 0);

  const unresolvedRefs =
    chunkKeys === undefined
      ? null
      : records.reduce((sum, record) => sum + record.hits.filter((hit) => !chunkKeys.has(hit.ref)).length, 0);

  return {
    repetition: {
      path,
      breakdown: breakdown({ records, queries }),
      latency: { p50: percentile(durations, 50), p95: percentile(durations, 95) },
      tokens: { perField, billedTotal, billedPerQuery: records.length === 0 ? null : billedTotal / records.length },
      perQueryTokens,
      toolCalls,
      queriesUsingTool,
      unresolvedRefs,
    },
    refsById: new Map(records.map((record) => [record.id, record.hits.map((hit) => hit.ref)])),
  };
}

/** Every repetition of one variant, their spread, and the queries whose ordered refs moved between repetitions. */
export function summarizeVariant({ transcripts, queries, chunkKeys }) {
  if (!Array.isArray(transcripts) || transcripts.length === 0) {
    throw new Error('eval: summarizeVariant was given no transcripts, so a variant has no repetition to summarize');
  }
  const runs = transcripts.map((path) => repetition(path, queries, chunkKeys));
  const repetitions = runs.map((run) => run.repetition);

  const partitions = [...new Set(repetitions.flatMap((entry) => Object.keys(entry.breakdown.byPartition)))].sort();
  const byPartition = {};
  for (const partition of partitions) {
    const figures = repetitions.map((entry) => entry.breakdown.byPartition[partition]);
    byPartition[partition] = {
      recallAt5: spread(figures.map((figure) => figure?.recallAt5 ?? null)),
      mrr: spread(figures.map((figure) => figure?.mrr ?? null)),
    };
  }

  const across = {
    recallAt5: spread(repetitions.map((entry) => entry.breakdown.pooled.recallAt5)),
    mrr: spread(repetitions.map((entry) => entry.breakdown.pooled.mrr)),
    byPartition,
    answeredNoneShare: spread(
      repetitions.map(({ breakdown: { negatives } }) => (negatives.total === 0 ? null : negatives.answeredNone / negatives.total)),
    ),
    latencyP50: spread(repetitions.map((entry) => entry.latency.p50)),
    latencyP95: spread(repetitions.map((entry) => entry.latency.p95)),
    billedPerQuery: spread(repetitions.map((entry) => entry.tokens.billedPerQuery)),
  };

  const disagreements = [];
  for (const query of queries) {
    const refsByRepetition = runs.map((run) => run.refsById.get(query.id) ?? null);
    const keys = new Set(refsByRepetition.map((refs) => JSON.stringify(refs)));
    if (keys.size > 1) disagreements.push({ id: query.id, refsByRepetition });
  }

  return { repetitions, across, disagreements, partial: transcripts.length < FULL_REPETITIONS };
}
