/**
 * Two backends' blocks for one corpus, compared side by side: per-arm metrics, the recorded floor,
 * every per-query difference, arm B on its own, and the abstention sets at the recorded threshold.
 *
 * **The rule this module exists to enforce: a comparison is between two blocks taken over the same
 * corpus snapshot, and every difference is enumerated by query id, not summarised away.** Both sides
 * are read off the blocks' machine halves through `evals/docs-retrieval/results.mjs` →
 * `readCorpusMachineHalf`, keyed by `evals/docs-retrieval/backends.mjs` → `corpusBlockId`; nothing is
 * recomputed from another source. A pair whose `snapshot`, `k`, `repeat` or `abstainScoreThreshold`
 * differ is refused by name, quoting both values.
 * A `@python` block's `abstainScoreThreshold` is the TypeScript `search.js` constant
 * `evals/docs-retrieval/results.mjs` renders, not the Python server's, so that field's equality does not
 * test the Python side; {@link compareAbstention}'s `inconsistent` list, which tests each side's
 * abstentions against the recorded value, does.
 *
 * The arm set is walked from `evals/docs-retrieval/arms.mjs` → `ARMS` for the entries with a `mode`.
 * Two arms are found by mode rather than by letter — {@link LEXICAL_MODE}, which runs no model, and
 * {@link RERANK_MODE}, the one arm that abstains — and both are checked against that table at load,
 * so a renamed mode is refused here by name rather than matched by nothing.
 *
 * The floor is `evals/docs-retrieval/check-floor.mjs`'s: read through its `loadFloor` and graded with
 * its `METRICS` readers, `met` at `>=` as that gate grades. It applies to `FLOOR_CORPUS` alone. This
 * module names no case and states no cause; it reports.
 */

import { ARMS } from './arms.mjs';
import { backendFor, corpusBlockId } from './backends.mjs';
import { FLOOR_CORPUS, FLOOR_PATH, METRICS, loadFloor } from './check-floor.mjs';
import { percentile } from './metrics.mjs';
import { readCorpusMachineHalf } from './results.mjs';

/**
 * The two sides, in the order every table prints them. Each is checked against
 * `evals/docs-retrieval/backends.mjs` → `BACKENDS` at load.
 */
const SIDES = Object.freeze(['typescript', 'python']);
// Each side is a BACKENDS entry, refused by name at load if the vocabulary moves (`backends.mjs` → `backendFor`).
for (const side of SIDES) backendFor(side);

/** The arm that runs no model, so any difference there is the store's. */
const LEXICAL_MODE = 'lexical';

/** The arm that reranks and abstains. */
const RERANK_MODE = 'fused-rerank';

for (const mode of [LEXICAL_MODE, RERANK_MODE]) {
  if (!ARMS.some((arm) => arm.mode === mode)) {
    throw new Error(
      `eval: backend-comparison.mjs looks up mode ${mode}, which evals/docs-retrieval/arms.mjs → ARMS ` +
        `does not carry; its modes are ${ARMS.filter((arm) => arm.mode !== null).map((arm) => arm.mode).join(', ')}`,
    );
  }
}

/** How many of the largest rerank-score deltas are listed. */
const LARGEST_COUNT = 10;

/** The side-by-side rows, in print order; a floor metric is matched to its row by `METRICS[…].label`. */
const METRIC_ROWS = Object.freeze([
  { label: 'recall@1', read: (metrics) => metrics.recall[1] },
  { label: 'recall@3', read: (metrics) => metrics.recall[3] },
  { label: 'recall@5', read: (metrics) => metrics.recall[5] },
  { label: 'MRR', read: (metrics) => metrics.mrr },
  { label: 'strict recall@5', read: (metrics) => metrics.strict.recall[5] },
  { label: 'strict MRR', read: (metrics) => metrics.strict.mrr },
  { label: 'p50 ms', read: (metrics) => metrics.latency.p50 },
  { label: 'p95 ms', read: (metrics) => metrics.latency.p95 },
]);

function refuse(message) {
  throw new Error(`backend-comparison: ${message}`);
}

function stamp(snapshot) {
  return `{ files: ${snapshot.files}, chunks: ${snapshot.chunks} }`;
}

/** `backend`'s machine half for `corpusId`, refused by name when the block is absent or unreadable. */
function readSide(resultsText, corpusId, backend) {
  const blockId = corpusBlockId(corpusId, backend);
  try {
    return readCorpusMachineHalf(resultsText, blockId);
  } catch (error) {
    return refuse(`no usable ${backend} block ${blockId} for corpus ${corpusId}: ${error.message}`);
  }
}

/** Refuses a pair the two blocks do not form. */
function assertPair(corpusId, sides) {
  const { typescript: ts, python: py } = sides;
  if (ts.snapshot.files !== py.snapshot.files || ts.snapshot.chunks !== py.snapshot.chunks) {
    refuse(
      `${corpusId} is not a pair: the corpus moved between the two runs — typescript snapshot ` +
        `${stamp(ts.snapshot)}, python snapshot ${stamp(py.snapshot)}`,
    );
  }
  for (const field of ['k', 'repeat', 'abstainScoreThreshold']) {
    if (ts[field] !== py[field]) {
      refuse(`${corpusId} is not a pair: ${field} is ${ts[field]} on typescript and ${py[field]} on python`);
    }
  }
}

/** The side's machine-half entry for `letter`, or `undefined` when it did not run. */
function ranArm(side, letter) {
  const entry = side.arms.find((arm) => arm.arm === letter);
  return entry !== undefined && entry.ran === true ? entry : undefined;
}

/** `perQuery` keyed by id, refused when the two sides answered different query sets. */
function pairedQueries(letter, typescript, python) {
  const ts = new Map(typescript.metrics.perQuery.map((entry) => [entry.id, entry]));
  const py = new Map(python.metrics.perQuery.map((entry) => [entry.id, entry]));
  const missing = [
    ...[...ts.keys()].filter((id) => !py.has(id)).map((id) => `${id} (python has none)`),
    ...[...py.keys()].filter((id) => !ts.has(id)).map((id) => `${id} (typescript has none)`),
  ];
  if (missing.length > 0) {
    refuse(`arm ${letter} answered different query sets on the two sides: ${missing.join(', ')}`);
  }
  return [...ts.keys()].map((id) => ({ id, typescript: ts.get(id), python: py.get(id) }));
}

function refsOf(entry) {
  return entry.hits.map((hit) => hit.ref);
}

function sameRefs(a, b) {
  return a.length === b.length && a.every((ref, index) => ref === b[index]);
}

function metricsRow(metrics) {
  return Object.fromEntries(METRIC_ROWS.map((row) => [row.label, row.read(metrics)]));
}

/** The floor entries for arm `letter`, each graded on both sides; `null` off the floor's corpus. */
function gradeFloor(floor, letter, typescript, python) {
  if (floor === null) return null;
  return floor.floors
    .filter((entry) => entry.arm === letter)
    .map((entry) => {
      const read = METRICS[entry.metric].read;
      const grade = (side) => (read(side.metrics) >= entry.value ? 'met' : 'short');
      return { metric: entry.metric, value: entry.value, typescript: grade(typescript), python: grade(python) };
    });
}

function compareArm(arm, typescript, python, floor) {
  const pairs = pairedQueries(arm.letter, typescript, python);
  return {
    arm: arm.letter,
    mode: arm.mode,
    typescript: metricsRow(typescript.metrics),
    python: metricsRow(python.metrics),
    floor: gradeFloor(floor, arm.letter, typescript, python),
    rankChanges: pairs
      .filter(({ typescript: ts, python: py }) => !ts.negative && ts.rank !== py.rank)
      .map(({ id, typescript: ts, python: py }) => ({ id, typescriptRank: ts.rank, pythonRank: py.rank })),
    refOrderChanges: pairs
      .filter(({ typescript: ts, python: py }) => !sameRefs(refsOf(ts), refsOf(py)))
      .map(({ id, typescript: ts, python: py }) => ({ id, typescript: refsOf(ts), python: refsOf(py) })),
    pairs,
  };
}

/** The abstention sets of the rerank arm at `threshold`, with every mismatch and inconsistency listed. */
function compareAbstention(pairs, threshold) {
  const abstainedOn = (side) => pairs.filter((pair) => pair[side].abstained).map((pair) => pair.id);
  const only = (side, other) =>
    pairs
      .filter((pair) => pair[side].abstained && !pair[other].abstained)
      .map(({ id, typescript: ts, python: py }) => ({
        id,
        negative: ts.negative,
        typescriptScore: ts.bestRerankScore,
        pythonScore: py.bestRerankScore,
      }));
  const inconsistent = SIDES.flatMap((backend) =>
    pairs
      .map((pair) => pair[backend])
      .filter(
        (entry) => entry.abstained !== (entry.bestRerankScore === null || entry.bestRerankScore < threshold),
      )
      .map((entry) => ({ backend, id: entry.id, abstained: entry.abstained, bestRerankScore: entry.bestRerankScore })),
  );
  return {
    threshold,
    typescript: abstainedOn('typescript'),
    python: abstainedOn('python'),
    onlyTypescript: only('typescript', 'python'),
    onlyPython: only('python', 'typescript'),
    inconsistent,
  };
}

/**
 * `|ts − py|` of the rerank arm's `bestRerankScore` per query. A query scored on one side only enters
 * no delta and is listed under `oneSided` instead.
 */
function compareRerankScores(pairs) {
  const scored = (value) => typeof value === 'number';
  const both = pairs
    .filter((pair) => scored(pair.typescript.bestRerankScore) && scored(pair.python.bestRerankScore))
    .map(({ id, typescript: ts, python: py }) => ({
      id,
      typescriptScore: ts.bestRerankScore,
      pythonScore: py.bestRerankScore,
      delta: Math.abs(ts.bestRerankScore - py.bestRerankScore),
    }));
  const deltas = both.map((entry) => entry.delta);
  return {
    p50: percentile(deltas, 50),
    max: deltas.length === 0 ? null : Math.max(...deltas),
    largest: [...both]
      .sort((a, b) => b.delta - a.delta)
      .slice(0, LARGEST_COUNT)
      .map(({ id, typescriptScore, pythonScore }) => ({ id, typescriptScore, pythonScore })),
    oneSided: pairs
      .filter((pair) => scored(pair.typescript.bestRerankScore) !== scored(pair.python.bestRerankScore))
      .map(({ id, typescript: ts, python: py }) => ({
        id,
        typescriptScore: ts.bestRerankScore,
        pythonScore: py.bestRerankScore,
      })),
  };
}

/**
 * The comparison of `corpusId`'s `@typescript` and `@python` blocks inside `resultsText`.
 *
 * Refuses by name when either block is absent, when the pair's snapshots, `k`, `repeat` or thresholds
 * differ, when an arm ran on one side only, and when an arm's two sides answered different query sets.
 */
export function compareBackends({ resultsText, corpusId, floorPath = FLOOR_PATH }) {
  const sides = Object.fromEntries(SIDES.map((backend) => [backend, readSide(resultsText, corpusId, backend)]));
  assertPair(corpusId, sides);
  const floor = corpusId === FLOOR_CORPUS ? loadFloor(floorPath) : null;

  const compared = [];
  for (const arm of ARMS.filter((entry) => entry.mode !== null)) {
    const typescript = ranArm(sides.typescript, arm.letter);
    const python = ranArm(sides.python, arm.letter);
    if (typescript === undefined && python === undefined) continue;
    if (typescript === undefined || python === undefined) {
      refuse(
        `arm ${arm.letter} (${arm.mode}) ran on the ${typescript === undefined ? 'python' : 'typescript'} side ` +
          'only, so it has nothing to be compared against',
      );
    }
    compared.push(compareArm(arm, typescript, python, floor));
  }

  const lexical = compared.find((arm) => arm.mode === LEXICAL_MODE);
  const rerank = compared.find((arm) => arm.mode === RERANK_MODE);
  const threshold = sides.typescript.abstainScoreThreshold;

  return {
    corpusId,
    snapshot: sides.typescript.snapshot,
    sides: Object.fromEntries(
      SIDES.map((backend) => {
        const side = sides[backend];
        return [
          backend,
          {
            blockId: corpusBlockId(corpusId, backend),
            embedder: side.embedder,
            reranker: side.reranker,
            host: side.host,
            node: side.node,
            generatedAt: side.generatedAt,
            repeat: side.repeat,
          },
        ];
      }),
    ),
    arms: compared.map(({ pairs: _pairs, ...arm }) => arm),
    armB:
      lexical === undefined
        ? null
        : {
            arm: lexical.arm,
            agreeing: lexical.pairs.length - lexical.refOrderChanges.length,
            total: lexical.pairs.length,
            differing: lexical.refOrderChanges,
          },
    abstention: rerank === undefined ? null : compareAbstention(rerank.pairs, threshold),
    rerankDelta: rerank === undefined ? null : compareRerankScores(rerank.pairs),
  };
}

const EMPTY_CELL = '—';

function cell(label, value) {
  if (value === null || value === undefined) return EMPTY_CELL;
  return label.endsWith(' ms') ? value.toFixed(1) : value.toFixed(3);
}

function score(value) {
  return value === null || value === undefined ? EMPTY_CELL : value.toFixed(4);
}

function refList(refs) {
  return refs.length === 0 ? EMPTY_CELL : refs.map((ref) => `\`${ref}\``).join(', ');
}

function idList(ids) {
  return ids.length === 0 ? 'none' : ids.map((id) => `\`${id}\``).join(', ');
}

/** The floor cell of `label`'s row: every floor entry whose metric prints under that label. */
function floorCell(arm, label) {
  if (arm.floor === null) return [];
  const entries = arm.floor.filter((entry) => METRICS[entry.metric].label === label);
  return [entries.length === 0 ? EMPTY_CELL : entries.map((e) => `>= ${e.value}: ${e.typescript} / ${e.python}`).join('; ')];
}

function armTable(arm) {
  const graded = arm.floor !== null;
  return [
    `#### Arm ${arm.arm} — \`${arm.mode}\``,
    '',
    `| Metric | TypeScript | Python |${graded ? ' Floor (TypeScript / Python) |' : ''}`,
    `| --- | --- | --- |${graded ? ' --- |' : ''}`,
    ...METRIC_ROWS.map(({ label }) =>
      ['', label, cell(label, arm.typescript[label]), cell(label, arm.python[label]), ...floorCell(arm, label), '']
        .join(' | ')
        .trim(),
    ),
  ];
}

function changeLists(arm) {
  return [
    `#### Arm ${arm.arm} — per-query changes`,
    '',
    arm.rankChanges.length === 0
      ? 'Rank changes on positives: none.'
      : 'Rank changes on positives (rank 0 is no relevant hit):',
    ...(arm.rankChanges.length === 0
      ? []
      : [
          '',
          '| Query | TypeScript rank | Python rank |',
          '| --- | --- | --- |',
          ...arm.rankChanges.map((c) => `| \`${c.id}\` | ${c.typescriptRank} | ${c.pythonRank} |`),
        ]),
    '',
    arm.refOrderChanges.length === 0 ? 'Ordered-ref changes: none.' : 'Ordered-ref changes, negatives included:',
    ...(arm.refOrderChanges.length === 0
      ? []
      : [
          '',
          '| Query | TypeScript refs | Python refs |',
          '| --- | --- | --- |',
          ...arm.refOrderChanges.map((c) => `| \`${c.id}\` | ${refList(c.typescript)} | ${refList(c.python)} |`),
        ]),
  ];
}

function armBSection(armB) {
  if (armB === null) return [`Arm \`${LEXICAL_MODE}\`: not run on either side.`];
  return [
    `**Arm ${armB.arm} (\`${LEXICAL_MODE}\`, no model)**: ${armB.agreeing} of ${armB.total} queries return the ` +
      'same ordered refs on both sides; any difference here is the store\'s.',
    ...(armB.differing.length === 0
      ? []
      : [
          '',
          '| Query | TypeScript refs | Python refs |',
          '| --- | --- | --- |',
          ...armB.differing.map((c) => `| \`${c.id}\` | ${refList(c.typescript)} | ${refList(c.python)} |`),
        ]),
  ];
}

function mismatchTable(heading, entries) {
  if (entries.length === 0) return [`${heading}: none.`];
  return [
    `${heading}:`,
    '',
    '| Query | Negative | TypeScript score | Python score |',
    '| --- | --- | --- | --- |',
    ...entries.map((e) => `| \`${e.id}\` | ${e.negative ? 'yes' : 'no'} | ${score(e.typescriptScore)} | ${score(e.pythonScore)} |`),
  ];
}

function abstentionSection(abstention) {
  if (abstention === null) return [`Abstention: arm \`${RERANK_MODE}\` not run on either side.`];
  return [
    `**Abstention** (arm \`${RERANK_MODE}\`, threshold \`${abstention.threshold}\` as both blocks record it)`,
    '',
    `- TypeScript abstained on: ${idList(abstention.typescript)}`,
    `- Python abstained on: ${idList(abstention.python)}`,
    '',
    ...mismatchTable('Abstained on TypeScript only', abstention.onlyTypescript),
    '',
    ...mismatchTable('Abstained on Python only', abstention.onlyPython),
    '',
    ...(abstention.inconsistent.length === 0
      ? ['Entries whose abstention disagrees with the recorded threshold: none.']
      : [
          'Entries whose abstention disagrees with the recorded threshold:',
          '',
          '| Backend | Query | Abstained | bestRerankScore |',
          '| --- | --- | --- | --- |',
          ...abstention.inconsistent.map(
            (e) => `| ${e.backend} | \`${e.id}\` | ${e.abstained ? 'yes' : 'no'} | ${score(e.bestRerankScore)} |`,
          ),
        ]),
  ];
}

function rerankSection(delta) {
  if (delta === null) return [];
  return [
    `**Rerank-score delta** (arm \`${RERANK_MODE}\`, \`|typescript − python|\` of \`bestRerankScore\` per query): ` +
      `p50 ${score(delta.p50)}, max ${score(delta.max)}.`,
    '',
    `The ${delta.largest.length} largest:`,
    '',
    '| Query | TypeScript score | Python score |',
    '| --- | --- | --- |',
    ...delta.largest.map((e) => `| \`${e.id}\` | ${score(e.typescriptScore)} | ${score(e.pythonScore)} |`),
    '',
    delta.oneSided.length === 0
      ? 'Scored on one side only: none.'
      : `Scored on one side only, outside the delta: ${delta.oneSided
          .map((e) => `\`${e.id}\` (${score(e.typescriptScore)} / ${score(e.pythonScore)})`)
          .join(', ')}.`,
  ];
}

/** One Markdown block for {@link compareBackends}'s result. */
export function renderBackendComparison(comparison) {
  const { sides } = comparison;
  return [
    `### Backend comparison — corpus \`${comparison.corpusId}\``,
    '',
    `- Snapshot \`${stamp(comparison.snapshot)}\`, the same on both blocks.`,
    ...SIDES.map(
      (backend) =>
        `- \`${sides[backend].blockId}\`: embedder \`${sides[backend].embedder}\`, reranker ` +
        `\`${sides[backend].reranker}\`, host \`${sides[backend].host}\`, Node \`${sides[backend].node}\`, ` +
        `${sides[backend].generatedAt}, ${sides[backend].repeat} repetition(s).`,
    ),
    '',
    ...comparison.arms.flatMap((arm) => [...armTable(arm), '']),
    ...armBSection(comparison.armB),
    '',
    ...abstentionSection(comparison.abstention),
    '',
    ...rerankSection(comparison.rerankDelta),
    '',
    ...comparison.arms.flatMap((arm) => [...changeLists(arm), '']),
  ]
    .join('\n')
    .trimEnd();
}
